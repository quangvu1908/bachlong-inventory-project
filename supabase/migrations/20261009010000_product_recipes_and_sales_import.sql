-- Công thức sản phẩm (BOM) + nhập doanh thu bán hàng, để tính tiêu thụ lý thuyết
-- và so sánh với tiêu thụ thực tế. Xem tài liệu phân tích file Excel, mục 7, cho bối cảnh đầy đủ.
--
-- Quyết định đã chốt với người dùng (mục 7 của tài liệu):
-- 1. Số lượng bán lấy từ file CSV/Excel import (không có module bán hàng/POS tích hợp).
-- 2. Công thức BTP chỉ 1 tầng — luôn đi thẳng từ NVL thô (material_recipes không tự tham chiếu material_recipes khác).
-- 3. Công thức có lịch sử hiệu lực theo thời gian (effective_from/effective_to, nửa-mở).
-- 4. Sản phẩm/công thức/doanh thu tách biệt hoàn toàn theo thương hiệu, dùng chung cho mọi cửa hàng trong thương hiệu đó.

-- ===== products: sản phẩm bán ra, theo từng thương hiệu =====
create table products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  name text not null,
  code text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (brand_id, name)
);

-- ===== product_aliases: gán tên món trong file POS về đúng sản phẩm, để lần import sau tự khớp =====
create table product_aliases (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  source_name text not null,
  created_at timestamptz not null default now(),
  unique (brand_id, source_name)
);

-- ===== product_recipes: công thức sản phẩm, có lịch sử hiệu lực =====
-- material_id có thể là NVL thô hoặc NVL loại "bán thành phẩm" (BTP) — cả 2 đều nằm trong bảng materials.
-- quantity tính theo đơn vị ĐVT Kho của material (cùng đơn vị với Nhập/Xuất/Kiểm Kho), cho 1 đơn vị sản phẩm bán ra.
-- Hiệu lực nửa-mở [effective_from, effective_to): effective_to null = đang áp dụng.
create table product_recipes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  material_id uuid not null references materials(id) on delete cascade,
  quantity numeric not null check (quantity > 0),
  effective_from date not null default current_date,
  effective_to date,
  created_at timestamptz not null default now(),
  created_by uuid references profiles(id),
  check (effective_to is null or effective_to > effective_from)
);

-- ===== material_recipes: công thức bán thành phẩm (BTP), chỉ 1 tầng — luôn đi thẳng từ NVL thô =====
-- quantity = lượng NVL thô cần để ra 1 đơn vị BTP thành phẩm (đã quy đổi theo hiệu suất sản xuất của mẻ).
create table material_recipes (
  id uuid primary key default gen_random_uuid(),
  btp_material_id uuid not null references materials(id) on delete cascade,
  input_material_id uuid not null references materials(id) on delete cascade,
  quantity numeric not null check (quantity > 0),
  effective_from date not null default current_date,
  effective_to date,
  created_at timestamptz not null default now(),
  created_by uuid references profiles(id),
  check (btp_material_id <> input_material_id),
  check (effective_to is null or effective_to > effective_from)
);

-- ===== sales_imports: mỗi lần upload file CSV/Excel doanh thu bán hàng =====
create table sales_imports (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  file_name text not null,
  imported_by uuid not null references profiles(id),
  imported_at timestamptz not null default now(),
  row_count integer not null default 0
);

-- ===== sales_records: từng dòng số lượng bán đã được gán đúng sản phẩm (sau bước mapping ở UI) =====
create table sales_records (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references sales_imports(id) on delete cascade,
  store_id uuid not null references stores(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  sold_date date not null,
  source_name text not null,
  quantity numeric not null,
  revenue numeric,
  created_at timestamptz not null default now()
);

-- ===== index cho khóa ngoại + truy vấn báo cáo =====
create index on products (brand_id);
create index on product_aliases (brand_id);
create index on product_aliases (product_id);
create index on product_recipes (product_id, effective_from);
create index on product_recipes (material_id);
create index on material_recipes (btp_material_id, effective_from);
create index on material_recipes (input_material_id);
create index on sales_imports (store_id);
create index on sales_imports (imported_by);
create index on sales_records (import_id);
create index on sales_records (store_id, sold_date);
create index on sales_records (product_id, sold_date);

-- ===== RLS =====
alter table products enable row level security;
alter table product_aliases enable row level security;
alter table product_recipes enable row level security;
alter table material_recipes enable row level security;
alter table sales_imports enable row level security;
alter table sales_records enable row level security;

-- products: quản lý master data, giống materials (chỉ admin/brand_manager được sửa)
create policy "products_select" on products for select
  using (brand_id in (select auth_readable_brand_ids()));
create policy "products_insert" on products for insert
  with check (brand_id in (select auth_managed_brand_ids()));
create policy "products_update" on products for update
  using (brand_id in (select auth_managed_brand_ids()));
create policy "products_delete" on products for delete
  using (brand_id in (select auth_managed_brand_ids()));

-- product_aliases: cho phép tạo mới khi thao tác cửa hàng thuộc thương hiệu (để gán tên lúc import),
-- nhưng chỉ admin/brand_manager được sửa/xóa ánh xạ đã có (tránh sửa nhầm).
create policy "product_aliases_select" on product_aliases for select
  using (brand_id in (select auth_readable_brand_ids()));
create policy "product_aliases_insert" on product_aliases for insert
  with check (
    brand_id in (select auth_managed_brand_ids())
    or brand_id in (select s.brand_id from stores s where s.id in (select auth_accessible_store_ids()))
  );
create policy "product_aliases_update" on product_aliases for update
  using (brand_id in (select auth_managed_brand_ids()));
create policy "product_aliases_delete" on product_aliases for delete
  using (brand_id in (select auth_managed_brand_ids()));

-- product_recipes / material_recipes: cùng quyền quản lý như products/materials
create policy "product_recipes_select" on product_recipes for select
  using (product_id in (select id from products where brand_id in (select auth_readable_brand_ids())));
create policy "product_recipes_insert" on product_recipes for insert
  with check (product_id in (select id from products where brand_id in (select auth_managed_brand_ids())));
create policy "product_recipes_update" on product_recipes for update
  using (product_id in (select id from products where brand_id in (select auth_managed_brand_ids())));
create policy "product_recipes_delete" on product_recipes for delete
  using (product_id in (select id from products where brand_id in (select auth_managed_brand_ids())));

create policy "material_recipes_select" on material_recipes for select
  using (btp_material_id in (select id from materials where brand_id in (select auth_readable_brand_ids())));
create policy "material_recipes_insert" on material_recipes for insert
  with check (btp_material_id in (select id from materials where brand_id in (select auth_managed_brand_ids())));
create policy "material_recipes_update" on material_recipes for update
  using (btp_material_id in (select id from materials where brand_id in (select auth_managed_brand_ids())));
create policy "material_recipes_delete" on material_recipes for delete
  using (btp_material_id in (select id from materials where brand_id in (select auth_managed_brand_ids())));

-- sales_imports / sales_records: nghiệp vụ vận hành theo cửa hàng, giống transactions —
-- ai thao tác được cửa hàng thì import được; không cho sửa/xóa sales_records trực tiếp
-- (muốn sửa thì xóa cả lần import rồi nhập lại); chỉ admin/brand_manager xóa được cả lần import.
create policy "sales_imports_select" on sales_imports for select
  using (store_id in (select auth_accessible_store_ids()));
create policy "sales_imports_insert" on sales_imports for insert
  with check (store_id in (select auth_accessible_store_ids()) and imported_by = (select auth.uid()));
create policy "sales_imports_delete" on sales_imports for delete
  using (store_id in (select s.id from stores s where s.brand_id in (select auth_managed_brand_ids())));

create policy "sales_records_select" on sales_records for select
  using (store_id in (select auth_accessible_store_ids()));
create policy "sales_records_insert" on sales_records for insert
  with check (store_id in (select auth_accessible_store_ids()));

-- Chỉ authenticated mới đọc/ghi được các bảng mới; anon (chưa đăng nhập) không có policy nào khớp nên bị chặn hẳn.
