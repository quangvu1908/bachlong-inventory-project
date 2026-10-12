-- 014_bar_stock_count_only: khớp đúng nguyên tắc sổ kho Excel Mongo — Tồn Quầy Bar
-- KHÔNG cộng dồn từ các lần "Xuất ra Bar". Xuất ra bar chỉ làm giảm Tồn Kho Dự Trữ;
-- tồn bar chỉ "nhảy" lên mức mới qua một lần Kiểm Bar mới (record_bar_count, không đổi).
-- Trước migration này, record_issue_to_bar cộng thẳng SL xuất vào bar_stock mỗi lần —
-- khác với Excel và làm tồn bar không bao giờ khớp với số đếm thực tế.

create or replace function record_issue_to_bar(
  p_store_id uuid,
  p_material_id uuid,
  p_quantity numeric,
  p_note text default null
) returns transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kho_before numeric;
  v_kho_after numeric;
  v_bar_stock numeric;
  v_bar_qty numeric;
  v_kho_unit text;
  v_bar_unit text;
  v_convert numeric;
  v_txn transactions;
begin
  if p_store_id not in (select auth_accessible_store_ids()) then
    raise exception 'Không có quyền thao tác cửa hàng này';
  end if;
  if p_quantity <= 0 then
    raise exception 'Số lượng phải lớn hơn 0';
  end if;

  select uk.code, ub.code, m.convert_factor into v_kho_unit, v_bar_unit, v_convert
    from materials m
    join units uk on uk.id = m.unit_kho_id
    join units ub on ub.id = m.unit_bar_id
    where m.id = p_material_id and m.brand_id in (select auth_readable_brand_ids());
  if v_kho_unit is null then
    raise exception 'Nguyên vật liệu không hợp lệ';
  end if;

  insert into inventory_levels (store_id, material_id, kho_stock, bar_stock)
  values (p_store_id, p_material_id, 0, 0)
  on conflict (store_id, material_id) do nothing;

  select kho_stock, bar_stock into v_kho_before, v_bar_stock
    from inventory_levels where store_id = p_store_id and material_id = p_material_id for update;

  if v_kho_before < p_quantity then
    raise exception 'Vượt tồn kho: hiện có % % trong kho', v_kho_before, v_kho_unit;
  end if;

  v_kho_after := v_kho_before - p_quantity;
  v_bar_qty := p_quantity * v_convert;

  -- bar_stock giữ nguyên — chỉ kho_stock giảm
  update inventory_levels
    set kho_stock = v_kho_after, updated_at = now()
    where store_id = p_store_id and material_id = p_material_id;

  insert into transactions
    (store_id, material_id, type, quantity, unit_code, stock_before, stock_after,
     bar_quantity, bar_unit_code, bar_stock_before, bar_stock_after, note, created_by)
  values
    (p_store_id, p_material_id, 'issue_to_bar', p_quantity, v_kho_unit, v_kho_before, v_kho_after,
     v_bar_qty, v_bar_unit, v_bar_stock, v_bar_stock, p_note, auth.uid())
  returning * into v_txn;

  return v_txn;
end;
$$;
