# `transactions` là sổ cái chỉ-ghi-thêm, ghi duy nhất qua RPC `record_*`

Bảng `transactions` không có RLS policy insert/update/delete nào — chỉ có policy select. Mọi nghiệp vụ (Nhập Hàng, Xuất Kho Ra Bar, Điều Chuyển, Kiểm Kho, Kiểm Bar) ghi dữ liệu duy nhất qua các hàm `security definer` `record_receipt`/`record_issue_to_bar`/`record_transfer`/`record_warehouse_count`/`record_bar_count`, bypass RLS để cùng lúc cập nhật `inventory_levels` và chèn dòng transaction trong 1 transaction DB. Không ai — kể cả admin — sửa hoặc xóa được một dòng đã ghi, kể cả thao tác trực tiếp trên bảng.

## Status

accepted

## Consequences

- Một người đọc schema thấy `transactions` không có insert policy dễ tưởng là thiếu sót — đây là cố ý: thêm insert policy trực tiếp sẽ cho phép ghi dữ liệu không qua các hàm `record_*`, làm `kho_stock`/`bar_stock` trong `inventory_levels` không còn khớp với lịch sử giao dịch.
- Muốn sửa một giao dịch sai, phải ghi thêm một giao dịch điều chỉnh mới (vd: Kiểm Kho lại) — không có đường sửa/xóa ngược.
- Thêm một nghiệp vụ ghi sổ mới (như Điều Chuyển) bắt buộc phải thêm một hàm `record_*` mới, không thể chỉ thêm policy insert.
