-- 012_transfer_enum_and_column: thêm nghiệp vụ thứ 5 "Điều Chuyển" (giữa các cửa hàng
-- cùng thương hiệu) để khớp đúng luồng sổ kho Excel Mongo. Tách riêng migration này vì
-- Postgres không cho dùng giá trị enum mới thêm trong cùng transaction đã ALTER TYPE.

alter type transaction_type add value 'transfer_out';
alter type transaction_type add value 'transfer_in';

-- Cửa hàng đối ứng của giao dịch điều chuyển: với transfer_out là cửa hàng nhận,
-- với transfer_in là cửa hàng gửi. Null với 4 nghiệp vụ còn lại.
alter table transactions add column related_store_id uuid references stores(id);
