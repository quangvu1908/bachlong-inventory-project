-- 009_demo_stores: cửa hàng MẪU để xem thử giao diện quản lý thương hiệu/cửa hàng
-- trước khi nhập dữ liệu thật. Xóa/sửa thoải mái qua trang /thuong-hieu.
insert into stores (brand_id, code, name, address)
select id, 'mongo-demo-1', 'Mongo Demo 1', 'Địa chỉ mẫu' from brands where code = 'mongo'
union all
select id, 'mongo-demo-2', 'Mongo Demo 2', 'Địa chỉ mẫu' from brands where code = 'mongo'
union all
select id, 'nooshan-demo-1', 'NooShan Demo 1', 'Địa chỉ mẫu' from brands where code = 'nooshan';
