# Giá Vốn dùng một giá chuẩn hiện hành, không lưu lịch sử giá theo từng lần nhập

`material_prices` có khóa chính là `material_id` — mỗi NVL chỉ có đúng 1 dòng giá, bị ghi đè mỗi lần Nhập Hàng. Đây là lựa chọn có chủ đích để khớp đúng mô hình "standard cost" của sổ kho Excel gốc: Excel chỉ có 1 cột đơn giá hiện hành cho mỗi NVL, không lưu giá theo từng lô nhập. Lựa chọn còn lại — lưu lịch sử giá theo thời gian (actual/FIFO cost) — chính xác hơn về kế toán nhưng sẽ làm Giá Vốn tính ra không còn khớp với cách BachLong đang đối chiếu bằng Excel.

## Status

superseded by ADR-0006 — `material_prices` vẫn chỉ 1 dòng giá/NVL (đúng như
mô tả ở đây), nhưng giá đó giờ là bình quân gia quyền tự tính lại mỗi lần
Nhập Hàng, không còn là "ghi đè thẳng bằng giá lần nhập gần nhất" nữa.

## Consequences

- Đổi giá một NVL hôm nay làm đổi Giá Vốn của **cả các kỳ báo cáo cũ** khi mở lại báo cáo — đây là hệ quả cố ý của mô hình "giá chuẩn hiện hành", không phải bug.
- Muốn chuyển sang lưu lịch sử giá sau này sẽ cần đổi khóa chính của `material_prices` (vd: thêm `effective_from` như `product_recipes`/`material_recipes` đang làm) và sửa lại mọi báo cáo Giá Vốn/Sai Lệch Tiêu Thụ.
