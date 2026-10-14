-- 016_weighted_average_cost: đổi material_prices từ "giá chuẩn = giá lần nhập
-- gần nhất" sang "giá bình quân gia quyền", tính lại mỗi lần Nhập Hàng. Khi
-- NCC tăng giá, lần nhập mới không còn ghi đè thẳng giá cũ — mà hoà vào tồn
-- kho hiện có theo đúng tỷ trọng số lượng, nên Giá Vốn không bị lệch toàn bộ
-- về giá mới nhất mỗi khi có 1 lần nhập giá cao hơn. Đảo ngược quyết định ở
-- ADR-0003 — xem ADR-0006.
--
-- Bình quân tính trên TỔNG tồn kho toàn thương hiệu (mọi cửa hàng cộng lại),
-- vì material_prices là 1 giá dùng chung cho cả thương hiệu, không tách theo
-- từng cửa hàng.

create or replace function record_receipt(
  p_store_id uuid,
  p_material_id uuid,
  p_quantity numeric,
  p_unit_price numeric,
  p_note text default null,
  p_expiry_date date default null
) returns transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before numeric;
  v_after numeric;
  v_unit_code text;
  v_txn transactions;
  v_total_qty_before numeric;
  v_old_price numeric;
  v_new_avg_price numeric;
begin
  if p_store_id not in (select auth_accessible_store_ids()) then
    raise exception 'Không có quyền thao tác cửa hàng này';
  end if;
  if p_quantity <= 0 then
    raise exception 'Số lượng phải lớn hơn 0';
  end if;

  select u.code into v_unit_code
    from materials m join units u on u.id = m.unit_kho_id
    where m.id = p_material_id and m.brand_id in (select auth_readable_brand_ids());
  if v_unit_code is null then
    raise exception 'Nguyên vật liệu không hợp lệ';
  end if;

  insert into inventory_levels (store_id, material_id, kho_stock, bar_stock)
  values (p_store_id, p_material_id, 0, 0)
  on conflict (store_id, material_id) do nothing;

  select kho_stock into v_before from inventory_levels
    where store_id = p_store_id and material_id = p_material_id for update;
  v_after := v_before + p_quantity;

  -- Khóa dòng giá trước: 2 cửa hàng cùng nhập 1 NVL đồng thời sẽ serialize ở
  -- đây thay vì đọc chồng lên nhau ra bình quân sai.
  select unit_price into v_old_price from material_prices where material_id = p_material_id for update;
  v_old_price := coalesce(v_old_price, 0);

  select coalesce(sum(kho_stock), 0) into v_total_qty_before
    from inventory_levels where material_id = p_material_id;

  if v_total_qty_before + p_quantity > 0 then
    v_new_avg_price := (v_total_qty_before * v_old_price + p_quantity * p_unit_price)
                        / (v_total_qty_before + p_quantity);
  else
    v_new_avg_price := p_unit_price;
  end if;

  update inventory_levels
    set kho_stock = v_after,
        expiry_date = coalesce(p_expiry_date, expiry_date),
        updated_at = now()
    where store_id = p_store_id and material_id = p_material_id;

  insert into material_prices (material_id, unit_price, updated_at, updated_by)
  values (p_material_id, v_new_avg_price, now(), auth.uid())
  on conflict (material_id) do update
    set unit_price = excluded.unit_price, updated_at = now(), updated_by = auth.uid();

  -- transactions.unit_price/amount vẫn ghi ĐÚNG giá thực tế của lần nhập này
  -- (không phải giá bình quân) — đây là lịch sử giao dịch, không phải giá trị kho.
  insert into transactions
    (store_id, material_id, type, quantity, unit_code, stock_before, stock_after, unit_price, amount, note, created_by)
  values
    (p_store_id, p_material_id, 'receipt', p_quantity, v_unit_code, v_before, v_after, p_unit_price, p_quantity * p_unit_price, p_note, auth.uid())
  returning * into v_txn;

  return v_txn;
end;
$$;
