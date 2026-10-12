-- 013_record_transfer_rpc: Điều chuyển NVL từ kho dự trữ của 1 cửa hàng sang 1 cửa hàng
-- khác CÙNG thương hiệu. Theo quyết định đã xác nhận: bên nhận được TỰ ĐỘNG cộng kho
-- (khác Excel gốc — Excel chỉ ghi nhận bên gửi) để tổng tồn kho toàn chuỗi luôn khớp.
-- Điều chuyển KHÔNG tính vào giá vốn/tiêu thụ (trừ riêng, xem actual-consumption.ts).

create function record_transfer(
  p_store_id uuid,
  p_material_id uuid,
  p_quantity numeric,
  p_dest_store_id uuid,
  p_note text default null
) returns transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_src_brand uuid;
  v_dest_brand uuid;
  v_kho_before numeric;
  v_kho_after numeric;
  v_dest_before numeric;
  v_dest_after numeric;
  v_unit_code text;
  v_txn transactions;
begin
  if p_store_id not in (select auth_accessible_store_ids()) then
    raise exception 'Không có quyền thao tác cửa hàng này';
  end if;
  if p_quantity <= 0 then
    raise exception 'Số lượng phải lớn hơn 0';
  end if;
  if p_dest_store_id = p_store_id then
    raise exception 'Cửa hàng nhận phải khác cửa hàng gửi';
  end if;

  select brand_id into v_src_brand from stores where id = p_store_id;
  select brand_id into v_dest_brand from stores where id = p_dest_store_id;
  if v_dest_brand is null or v_dest_brand is distinct from v_src_brand then
    raise exception 'Cửa hàng nhận phải cùng thương hiệu với cửa hàng gửi';
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
  insert into inventory_levels (store_id, material_id, kho_stock, bar_stock)
  values (p_dest_store_id, p_material_id, 0, 0)
  on conflict (store_id, material_id) do nothing;

  select kho_stock into v_kho_before from inventory_levels
    where store_id = p_store_id and material_id = p_material_id for update;
  if v_kho_before < p_quantity then
    raise exception 'Vượt tồn kho: hiện có % % trong kho', v_kho_before, v_unit_code;
  end if;
  v_kho_after := v_kho_before - p_quantity;

  update inventory_levels set kho_stock = v_kho_after, updated_at = now()
    where store_id = p_store_id and material_id = p_material_id;

  select kho_stock into v_dest_before from inventory_levels
    where store_id = p_dest_store_id and material_id = p_material_id for update;
  v_dest_after := v_dest_before + p_quantity;

  update inventory_levels set kho_stock = v_dest_after, updated_at = now()
    where store_id = p_dest_store_id and material_id = p_material_id;

  insert into transactions
    (store_id, material_id, type, quantity, unit_code, stock_before, stock_after, related_store_id, note, created_by)
  values
    (p_store_id, p_material_id, 'transfer_out', p_quantity, v_unit_code, v_kho_before, v_kho_after, p_dest_store_id, p_note, auth.uid())
  returning * into v_txn;

  insert into transactions
    (store_id, material_id, type, quantity, unit_code, stock_before, stock_after, related_store_id, note, created_by)
  values
    (p_dest_store_id, p_material_id, 'transfer_in', p_quantity, v_unit_code, v_dest_before, v_dest_after, p_store_id, p_note, auth.uid());

  return v_txn;
end;
$$;

revoke execute on function record_transfer(uuid, uuid, numeric, uuid, text) from anon, public;

-- Thêm related_store_id vào view (xem 011_transactions_price_masking). Cột mới phải
-- đứng CUỐI select list — CREATE OR REPLACE VIEW không cho đổi vị trí cột đã có.
create or replace view transactions_view
with (security_invoker = true)
as
select
  id, store_id, material_id, type, quantity, unit_code, stock_before, stock_after,
  bar_quantity, bar_unit_code, bar_stock_before, bar_stock_after,
  case when auth_can_view_price() then unit_price else null end as unit_price,
  case when auth_can_view_price() then amount else null end as amount,
  note, created_by, created_at, related_store_id
from transactions;

grant select on transactions_view to authenticated;
