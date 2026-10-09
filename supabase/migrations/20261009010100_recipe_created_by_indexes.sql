-- Index còn thiếu cho cột created_by (Advisor performance warning)
create index on product_recipes (created_by);
create index on material_recipes (created_by);
