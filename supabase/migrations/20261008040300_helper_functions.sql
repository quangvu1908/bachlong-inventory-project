-- 003_helper_functions: hàm dùng trong policy RLS. SECURITY DEFINER để tránh đệ quy
-- khi profiles/user_brands/user_stores tự bật RLS lên chính mình.

create function public.auth_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create function public.auth_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()) = 'admin', false);
$$;

create function public.auth_is_approved()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()) is not null, false);
$$;

-- Thương hiệu mà user QUẢN LÝ (admin: tất cả; brand_manager: thương hiệu được gán; khác: rỗng)
create function public.auth_managed_brand_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.brands where public.auth_is_admin()
  union
  select brand_id from public.user_brands where user_id = auth.uid();
$$;

-- Cửa hàng mà user được phép thao tác nghiệp vụ (nhập/xuất/kiểm kê)
create function public.auth_accessible_store_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.stores where public.auth_is_admin()
  union
  select s.id from public.stores s where s.brand_id in (select public.auth_managed_brand_ids())
  union
  select store_id from public.user_stores where user_id = auth.uid();
$$;

-- Thương hiệu mà user được phép ĐỌC (quản lý trực tiếp, hoặc có cửa hàng thuộc thương hiệu đó)
create function public.auth_readable_brand_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.brands where public.auth_is_admin()
  union
  select public.auth_managed_brand_ids()
  union
  select s.brand_id from public.stores s where s.id in (select public.auth_accessible_store_ids());
$$;

-- Vai trò được phép xem đơn giá / báo cáo giá vốn (không gồm staff)
create function public.auth_can_view_price()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()) in ('admin','brand_manager','store_manager'), false);
$$;
