-- 004_rls_policies: bật RLS + luật phân quyền cho toàn bộ bảng

alter table brands enable row level security;
alter table stores enable row level security;
alter table profiles enable row level security;
alter table user_brands enable row level security;
alter table user_stores enable row level security;
alter table units enable row level security;
alter table material_categories enable row level security;
alter table materials enable row level security;
alter table material_prices enable row level security;
alter table inventory_levels enable row level security;
alter table transactions enable row level security;
alter table app_settings enable row level security;

-- ===== brands =====
create policy "brands_select" on brands for select
  using (auth_is_approved());
create policy "brands_insert" on brands for insert
  with check (auth_is_admin());
create policy "brands_update" on brands for update
  using (auth_is_admin());
create policy "brands_delete" on brands for delete
  using (auth_is_admin());

-- ===== stores =====
create policy "stores_select" on stores for select
  using (id in (select auth_accessible_store_ids()) or brand_id in (select auth_readable_brand_ids()));
create policy "stores_insert" on stores for insert
  with check (brand_id in (select auth_managed_brand_ids()));
create policy "stores_update" on stores for update
  using (brand_id in (select auth_managed_brand_ids()));
create policy "stores_delete" on stores for delete
  using (brand_id in (select auth_managed_brand_ids()));

-- ===== profiles =====
-- Tự xem hồ sơ mình; admin xem tất cả; brand_manager xem user đã gán vào cửa hàng
-- thuộc thương hiệu mình quản lý hoặc được gán thẳng vào thương hiệu đó.
create policy "profiles_select" on profiles for select
  using (
    id = auth.uid()
    or auth_is_admin()
    or id in (select user_id from user_stores where store_id in (
         select s.id from stores s where s.brand_id in (select auth_managed_brand_ids())
       ))
    or id in (select user_id from user_brands where brand_id in (select auth_managed_brand_ids()))
  );
-- Chỉ admin được UPDATE qua bảng trực tiếp (gồm cả role); đổi role cho người khác
-- phải qua RPC assign_user_role để kiểm tra quyền theo thương hiệu/cửa hàng.
create policy "profiles_update_admin" on profiles for update
  using (auth_is_admin());
-- User tự sửa hồ sơ mình, nhưng KHÔNG được tự đổi role (chặn bằng with check).
create policy "profiles_update_self" on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role is not distinct from (select role from profiles where id = auth.uid()));
-- Không có policy insert cho authenticated: hồ sơ chỉ được tạo bởi trigger handle_new_user (security definer).

-- ===== user_brands =====
-- Chỉ admin được gán quản lý thương hiệu (theo quyết định: BM không tự tạo BM khác)
create policy "user_brands_select" on user_brands for select
  using (user_id = auth.uid() or auth_is_admin() or brand_id in (select auth_managed_brand_ids()));
create policy "user_brands_insert" on user_brands for insert
  with check (auth_is_admin());
create policy "user_brands_delete" on user_brands for delete
  using (auth_is_admin());

-- ===== user_stores =====
-- Admin: mọi nơi. Brand_manager: chỉ cửa hàng thuộc thương hiệu mình quản lý.
create policy "user_stores_select" on user_stores for select
  using (
    user_id = auth.uid()
    or auth_is_admin()
    or store_id in (select s.id from stores s where s.brand_id in (select auth_managed_brand_ids()))
  );
create policy "user_stores_insert" on user_stores for insert
  with check (
    auth_is_admin()
    or store_id in (select s.id from stores s where s.brand_id in (select auth_managed_brand_ids()))
  );
create policy "user_stores_delete" on user_stores for delete
  using (
    auth_is_admin()
    or store_id in (select s.id from stores s where s.brand_id in (select auth_managed_brand_ids()))
  );

-- ===== units (dùng chung, chỉ admin quản lý) =====
create policy "units_select" on units for select
  using (auth_is_approved());
create policy "units_insert" on units for insert
  with check (auth_is_admin());
create policy "units_update" on units for update
  using (auth_is_admin());
create policy "units_delete" on units for delete
  using (auth_is_admin());

-- ===== material_categories =====
create policy "material_categories_select" on material_categories for select
  using (brand_id in (select auth_readable_brand_ids()));
create policy "material_categories_insert" on material_categories for insert
  with check (brand_id in (select auth_managed_brand_ids()));
create policy "material_categories_update" on material_categories for update
  using (brand_id in (select auth_managed_brand_ids()));
create policy "material_categories_delete" on material_categories for delete
  using (brand_id in (select auth_managed_brand_ids()));

-- ===== materials =====
create policy "materials_select" on materials for select
  using (brand_id in (select auth_readable_brand_ids()));
create policy "materials_insert" on materials for insert
  with check (brand_id in (select auth_managed_brand_ids()));
create policy "materials_update" on materials for update
  using (brand_id in (select auth_managed_brand_ids()));
create policy "materials_delete" on materials for delete
  using (brand_id in (select auth_managed_brand_ids()));

-- ===== material_prices (ẩn với staff) =====
create policy "material_prices_select" on material_prices for select
  using (
    auth_can_view_price()
    and material_id in (select id from materials where brand_id in (select auth_readable_brand_ids()))
  );
create policy "material_prices_insert" on material_prices for insert
  with check (material_id in (select id from materials where brand_id in (select auth_managed_brand_ids())));
create policy "material_prices_update" on material_prices for update
  using (material_id in (select id from materials where brand_id in (select auth_managed_brand_ids())));

-- ===== inventory_levels (chỉ đọc trực tiếp; ghi bắt buộc qua RPC) =====
create policy "inventory_levels_select" on inventory_levels for select
  using (store_id in (select auth_accessible_store_ids()));
-- Không tạo policy insert/update/delete: chặn ghi trực tiếp từ client,
-- chỉ các hàm RPC (security definer) ở 005 mới ghi được bảng này.

-- ===== transactions (sổ cái chỉ ghi thêm qua RPC, không ai sửa/xóa) =====
create policy "transactions_select" on transactions for select
  using (store_id in (select auth_accessible_store_ids()));
-- Không có policy insert/update/delete nào ở đây: ghi chỉ qua RPC (005),
-- và không ai - kể cả admin - sửa/xóa được một dòng đã ghi, kể cả qua bảng trực tiếp.

-- ===== app_settings =====
create policy "app_settings_select" on app_settings for select
  using (brand_id is null or brand_id in (select auth_readable_brand_ids()));
create policy "app_settings_insert" on app_settings for insert
  with check (
    (brand_id is null and auth_is_admin())
    or brand_id in (select auth_managed_brand_ids())
  );
create policy "app_settings_update" on app_settings for update
  using (
    (brand_id is null and auth_is_admin())
    or brand_id in (select auth_managed_brand_ids())
  );
