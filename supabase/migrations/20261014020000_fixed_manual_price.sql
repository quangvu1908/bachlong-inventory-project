-- 017_fixed_manual_price: quay lại luồng giá cố định, thiết lập thủ công cho
-- mỗi NVL trong trang Quản Lý Nguyên Vật Liệu. Nhập Hàng không còn nhận đơn
-- giá từ người dùng — chỉ nhập số lượng, hệ thống tự lấy đơn giá hiện có của
-- NVL để hiển thị và tính Giá trị nhập (= SL × đơn giá). Đảo ngược ADR-0006
-- (bình quân gia quyền) — xem ADR-0007.
--
-- Đổi chữ ký hàm (bỏ p_unit_price) nên phải drop bản cũ trước khi tạo lại.

drop function if exists record_receipt(uuid, uuid, numeric, numeric, text, date);

create function record_receipt(
  p_store_id uuid,
  p_material_id uuid,
  p_quantity numeric,
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
  v_unit_price numeric;
  v_txn transactions;
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

  -- Đơn giá lấy từ material_prices (đã thiết lập sẵn trong trang Nguyên Vật
  -- Liệu) — không nhận từ client, tránh client gửi sai lệch giá thực tế.
  select unit_price into v_unit_price from material_prices where material_id = p_material_id;
  v_unit_price := coalesce(v_unit_price, 0);

  insert into inventory_levels (store_id, material_id, kho_stock, bar_stock)
  values (p_store_id, p_material_id, 0, 0)
  on conflict (store_id, material_id) do nothing;

  select kho_stock into v_before from inventory_levels
    where store_id = p_store_id and material_id = p_material_id for update;
  v_after := v_before + p_quantity;

  update inventory_levels
    set kho_stock = v_after,
        expiry_date = coalesce(p_expiry_date, expiry_date),
        updated_at = now()
    where store_id = p_store_id and material_id = p_material_id;

  insert into transactions
    (store_id, material_id, type, quantity, unit_code, stock_before, stock_after, unit_price, amount, note, created_by)
  values
    (p_store_id, p_material_id, 'receipt', p_quantity, v_unit_code, v_before, v_after, v_unit_price, p_quantity * v_unit_price, p_note, auth.uid())
  returning * into v_txn;

  return v_txn;
end;
$$;

revoke execute on function record_receipt(uuid, uuid, numeric, text, date) from anon, public;
