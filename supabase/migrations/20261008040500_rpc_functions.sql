-- 005_rpc_functions: 4 nghiệp vụ kho (chạy trọn vẹn hoặc hủy toàn bộ)
-- + hàm gán vai trò (kiểm tra quyền theo thương hiệu/cửa hàng, chặn tự nâng quyền)

-- ===== Nhập hàng: +kho, ghi nhận đơn giá mới nhất =====
create function record_receipt(
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

  update inventory_levels
    set kho_stock = v_after,
        expiry_date = coalesce(p_expiry_date, expiry_date),
        updated_at = now()
    where store_id = p_store_id and material_id = p_material_id;

  insert into material_prices (material_id, unit_price, updated_at, updated_by)
  values (p_material_id, p_unit_price, now(), auth.uid())
  on conflict (material_id) do update
    set unit_price = excluded.unit_price, updated_at = now(), updated_by = auth.uid();

  insert into transactions
    (store_id, material_id, type, quantity, unit_code, stock_before, stock_after, unit_price, amount, note, created_by)
  values
    (p_store_id, p_material_id, 'receipt', p_quantity, v_unit_code, v_before, v_after, p_unit_price, p_quantity * p_unit_price, p_note, auth.uid())
  returning * into v_txn;

  return v_txn;
end;
$$;

-- ===== Xuất kho ra bar: -kho, +bar (quy đổi theo convert_factor) =====
create function record_issue_to_bar(
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
  v_bar_before numeric;
  v_bar_after numeric;
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

  select kho_stock, bar_stock into v_kho_before, v_bar_before
    from inventory_levels where store_id = p_store_id and material_id = p_material_id for update;

  if v_kho_before < p_quantity then
    raise exception 'Vượt tồn kho: hiện có % % trong kho', v_kho_before, v_kho_unit;
  end if;

  v_kho_after := v_kho_before - p_quantity;
  v_bar_qty := p_quantity * v_convert;
  v_bar_after := v_bar_before + v_bar_qty;

  update inventory_levels
    set kho_stock = v_kho_after, bar_stock = v_bar_after, updated_at = now()
    where store_id = p_store_id and material_id = p_material_id;

  insert into transactions
    (store_id, material_id, type, quantity, unit_code, stock_before, stock_after,
     bar_quantity, bar_unit_code, bar_stock_before, bar_stock_after, note, created_by)
  values
    (p_store_id, p_material_id, 'issue_to_bar', p_quantity, v_kho_unit, v_kho_before, v_kho_after,
     v_bar_qty, v_bar_unit, v_bar_before, v_bar_after, p_note, auth.uid())
  returning * into v_txn;

  return v_txn;
end;
$$;

-- ===== Kiểm kho: đặt lại tồn kho theo số đếm thực tế =====
create function record_warehouse_count(
  p_store_id uuid,
  p_material_id uuid,
  p_counted numeric,
  p_note text default null
) returns transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before numeric;
  v_unit_code text;
  v_txn transactions;
begin
  if p_store_id not in (select auth_accessible_store_ids()) then
    raise exception 'Không có quyền thao tác cửa hàng này';
  end if;
  if p_counted < 0 then
    raise exception 'Số đếm không hợp lệ';
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

  update inventory_levels
    set kho_stock = p_counted, updated_at = now()
    where store_id = p_store_id and material_id = p_material_id;

  insert into transactions
    (store_id, material_id, type, quantity, unit_code, stock_before, stock_after, note, created_by)
  values
    (p_store_id, p_material_id, 'warehouse_count', p_counted - v_before, v_unit_code, v_before, p_counted, p_note, auth.uid())
  returning * into v_txn;

  return v_txn;
end;
$$;

-- ===== Kiểm bar: đặt lại tồn bar theo số đếm thực tế =====
create function record_bar_count(
  p_store_id uuid,
  p_material_id uuid,
  p_counted numeric,
  p_note text default null
) returns transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before numeric;
  v_unit_code text;
  v_txn transactions;
begin
  if p_store_id not in (select auth_accessible_store_ids()) then
    raise exception 'Không có quyền thao tác cửa hàng này';
  end if;
  if p_counted < 0 then
    raise exception 'Số đếm không hợp lệ';
  end if;

  select u.code into v_unit_code
    from materials m join units u on u.id = m.unit_bar_id
    where m.id = p_material_id and m.brand_id in (select auth_readable_brand_ids());
  if v_unit_code is null then
    raise exception 'Nguyên vật liệu không hợp lệ';
  end if;

  insert into inventory_levels (store_id, material_id, kho_stock, bar_stock)
  values (p_store_id, p_material_id, 0, 0)
  on conflict (store_id, material_id) do nothing;

  select bar_stock into v_before from inventory_levels
    where store_id = p_store_id and material_id = p_material_id for update;

  update inventory_levels
    set bar_stock = p_counted, updated_at = now()
    where store_id = p_store_id and material_id = p_material_id;

  insert into transactions
    (store_id, material_id, type, quantity, unit_code, stock_before, stock_after, note, created_by)
  values
    (p_store_id, p_material_id, 'bar_count', p_counted - v_before, v_unit_code, v_before, p_counted, p_note, auth.uid())
  returning * into v_txn;

  return v_txn;
end;
$$;

-- ===== Gán vai trò: admin gán bất kỳ; quản lý thương hiệu chỉ gán
--       store_manager/staff trong thương hiệu mình quản lý. Không ai tự gán cho chính mình. =====
create function assign_user_role(
  p_target_user uuid,
  p_role user_role,
  p_brand_id uuid default null,
  p_store_id uuid default null
) returns profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile profiles;
begin
  if p_target_user = auth.uid() then
    raise exception 'Không thể tự gán vai trò cho chính mình';
  end if;

  if auth_is_admin() then
    -- admin gán được mọi vai trò
    null;
  elsif auth_role() = 'brand_manager' then
    if p_role not in ('store_manager', 'staff') then
      raise exception 'Quản lý thương hiệu chỉ gán được vai trò Quản lý cửa hàng hoặc Nhân viên';
    end if;
    if p_store_id is null or p_store_id not in (
      select s.id from stores s where s.brand_id in (select auth_managed_brand_ids())
    ) then
      raise exception 'Cửa hàng không thuộc thương hiệu bạn quản lý';
    end if;
  else
    raise exception 'Không có quyền gán vai trò';
  end if;

  update profiles set role = p_role, updated_at = now()
    where id = p_target_user
    returning * into v_profile;

  if p_role = 'brand_manager' and p_brand_id is not null then
    insert into user_brands (user_id, brand_id) values (p_target_user, p_brand_id)
    on conflict do nothing;
  end if;

  if p_role in ('store_manager', 'staff') and p_store_id is not null then
    insert into user_stores (user_id, store_id) values (p_target_user, p_store_id)
    on conflict do nothing;
  end if;

  return v_profile;
end;
$$;
