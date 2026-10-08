-- 010_cascade_deletes: cho phep xoa cua hang/NVL/danh muc/don vi keo theo xoa
-- toan bo du lieu lien quan (giao dich, ton kho, gia). Truoc day la RESTRICT.

alter table transactions drop constraint transactions_store_id_fkey;
alter table transactions add constraint transactions_store_id_fkey
  foreign key (store_id) references stores(id) on delete cascade;

alter table transactions drop constraint transactions_material_id_fkey;
alter table transactions add constraint transactions_material_id_fkey
  foreign key (material_id) references materials(id) on delete cascade;

alter table materials drop constraint materials_category_id_fkey;
alter table materials add constraint materials_category_id_fkey
  foreign key (category_id) references material_categories(id) on delete cascade;

alter table materials drop constraint materials_unit_kho_id_fkey;
alter table materials add constraint materials_unit_kho_id_fkey
  foreign key (unit_kho_id) references units(id) on delete cascade;

alter table materials drop constraint materials_unit_bar_id_fkey;
alter table materials add constraint materials_unit_bar_id_fkey
  foreign key (unit_bar_id) references units(id) on delete cascade;
