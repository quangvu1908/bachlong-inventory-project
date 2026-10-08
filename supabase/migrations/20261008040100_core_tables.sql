-- 001_core_tables: enums + 12 bảng chính (chưa RLS)

create type user_role as enum ('admin', 'brand_manager', 'store_manager', 'staff');
create type unit_dimension as enum ('weight', 'volume', 'count');
create type transaction_type as enum ('receipt', 'issue_to_bar', 'warehouse_count', 'bar_count');

-- Thương hiệu: Mongo, NooShan
create table brands (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Cửa hàng, thuộc một thương hiệu
create table stores (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete restrict,
  code text not null,
  name text not null,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (brand_id, code)
);

-- Hồ sơ user, 1-1 với auth.users. role = null nghĩa là tài khoản đang chờ duyệt.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role user_role,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Quản lý thương hiệu phụ trách thương hiệu nào
create table user_brands (
  user_id uuid not null references profiles(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, brand_id)
);

-- Quản lý cửa hàng / nhân viên được gán cửa hàng nào
create table user_stores (
  user_id uuid not null references profiles(id) on delete cascade,
  store_id uuid not null references stores(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, store_id)
);

-- Đơn vị đo, dùng chung cho mọi thương hiệu
create table units (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  dimension unit_dimension not null,
  base_factor numeric not null default 1,
  is_active boolean not null default true
);

-- Danh mục nguyên vật liệu, tách riêng theo thương hiệu
create table material_categories (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  code text not null,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  unique (brand_id, code)
);

-- Danh mục nguyên vật liệu (không chứa giá)
create table materials (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete restrict,
  category_id uuid not null references material_categories(id) on delete restrict,
  name text not null,
  unit_kho_id uuid not null references units(id) on delete restrict,
  unit_bar_id uuid not null references units(id) on delete restrict,
  convert_factor numeric not null default 1,
  min_stock numeric not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Giá NVL, tách bảng riêng để ẩn với nhân viên
create table material_prices (
  material_id uuid primary key references materials(id) on delete cascade,
  unit_price numeric not null default 0,
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id)
);

-- Tồn kho theo từng cửa hàng
create table inventory_levels (
  store_id uuid not null references stores(id) on delete cascade,
  material_id uuid not null references materials(id) on delete cascade,
  kho_stock numeric not null default 0,
  bar_stock numeric not null default 0,
  expiry_date date,
  updated_at timestamptz not null default now(),
  primary key (store_id, material_id)
);

-- Sổ cái giao dịch, chỉ ghi thêm
create table transactions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete restrict,
  material_id uuid not null references materials(id) on delete restrict,
  type transaction_type not null,
  quantity numeric not null,
  unit_code text not null,
  stock_before numeric not null,
  stock_after numeric not null,
  bar_quantity numeric,
  bar_unit_code text,
  bar_stock_before numeric,
  bar_stock_after numeric,
  unit_price numeric,
  amount numeric,
  note text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create index transactions_store_created_idx on transactions (store_id, created_at desc);
create index transactions_material_idx on transactions (material_id);

-- Cấu hình hệ thống. brand_id null = áp dụng toàn hệ thống
create table app_settings (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  unique (brand_id, key)
);
