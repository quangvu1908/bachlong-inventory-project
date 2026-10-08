-- 007_hardening: vá cảnh báo từ Supabase Advisor sau khi tạo schema

-- Index cho các khóa ngoại còn thiếu (giúp join nhanh khi dữ liệu lớn)
create index on inventory_levels (material_id);
create index on material_prices (updated_by);
create index on materials (brand_id);
create index on materials (category_id);
create index on materials (unit_bar_id);
create index on materials (unit_kho_id);
create index on transactions (created_by);
create index on user_brands (brand_id);
create index on user_stores (store_id);

-- Gộp 2 policy UPDATE trên profiles thành 1 (tránh đánh giá 2 lần mỗi câu truy vấn)
drop policy "profiles_update_admin" on profiles;
drop policy "profiles_update_self" on profiles;
create policy "profiles_update" on profiles for update
  using (auth_is_admin() or id = (select auth.uid()))
  with check (
    auth_is_admin()
    or (id = (select auth.uid()) and role is not distinct from (select role from profiles where id = (select auth.uid())))
  );

-- auth.uid() chỉ tính 1 lần mỗi câu truy vấn thay vì mỗi dòng
alter policy "profiles_select" on profiles
  using (
    id = (select auth.uid())
    or auth_is_admin()
    or id in (select user_id from user_stores where store_id in (
         select s.id from stores s where s.brand_id in (select auth_managed_brand_ids())
       ))
    or id in (select user_id from user_brands where brand_id in (select auth_managed_brand_ids()))
  );
alter policy "user_brands_select" on user_brands
  using (user_id = (select auth.uid()) or auth_is_admin() or brand_id in (select auth_managed_brand_ids()));
alter policy "user_stores_select" on user_stores
  using (
    user_id = (select auth.uid())
    or auth_is_admin()
    or store_id in (select s.id from stores s where s.brand_id in (select auth_managed_brand_ids()))
  );

-- Chỉ authenticated mới gọi được 4 nghiệp vụ kho + gán vai trò; anon (chưa đăng nhập) bị chặn hẳn
revoke execute on function record_receipt(uuid, uuid, numeric, numeric, text, date) from anon, public;
revoke execute on function record_issue_to_bar(uuid, uuid, numeric, text) from anon, public;
revoke execute on function record_warehouse_count(uuid, uuid, numeric, text) from anon, public;
revoke execute on function record_bar_count(uuid, uuid, numeric, text) from anon, public;
revoke execute on function assign_user_role(uuid, user_role, uuid, uuid) from anon, public;

-- handle_new_user chỉ chạy qua trigger, không cần expose qua API cho ai cả
revoke execute on function handle_new_user() from anon, authenticated, public;
