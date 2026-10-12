-- 015_index_transactions_related_store: advisor hiệu năng báo thiếu index cho
-- transactions.related_store_id (cột mới thêm khi làm Điều Chuyển) — các truy vấn
-- lọc theo cửa hàng đối ứng (vd: lịch sử giao dịch) sẽ full scan nếu không có.

create index if not exists transactions_related_store_id_idx on transactions (related_store_id);
