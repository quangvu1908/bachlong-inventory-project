-- 006_seed_data: 2 thương hiệu + bộ đơn vị đo chuẩn dùng chung

insert into brands (code, name) values
  ('mongo', 'Mongo'),
  ('nooshan', 'NooShan');

insert into units (code, name, dimension, base_factor) values
  ('g',   'Gam',        'weight', 1),
  ('kg',  'Ki-lô-gam',  'weight', 1000),
  ('ml',  'Mi-li-lít',  'volume', 1),
  ('lit', 'Lít',        'volume', 1000),
  ('cai', 'Cái',        'count',  1),
  ('khay','Khay',       'count',  1),
  ('lon', 'Lon',        'count',  1),
  ('mieng','Miếng',     'count',  1);
