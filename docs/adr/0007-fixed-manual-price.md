# Đơn giá NVL cố định, thiết lập thủ công — Nhập Hàng không còn nhập giá

ADR-0006 đổi sang bình quân gia quyền để Giá Vốn phản ánh đúng hơn khi NCC tăng giá, nhưng BachLong đánh giá việc nhân viên phải quan tâm tới cách tính "trôi dần" của giá bình quân là phức tạp không cần thiết cho vận hành thực tế. Đã quay lại mô hình đơn giản hơn: mỗi NVL có **một đơn giá cố định**, thiết lập thủ công trong trang Quản Lý Nguyên Vật Liệu (không đổi gì ở form này). Nghiệp vụ Nhập Hàng **không còn nhận đơn giá từ người dùng** — `record_receipt` tự lấy đơn giá hiện có của NVL từ `material_prices` để ghi nhận Giá trị nhập (= SL × đơn giá); nhân viên chỉ cần nhập số lượng.

## Status

accepted

## Consequences

- `record_receipt` đổi chữ ký hàm: bỏ tham số `p_unit_price` (migration `drop function` + `create function` lại, không phải `create or replace`, vì kiểu tham số đổi).
- Nhập Hàng không còn là nơi cập nhật giá — giá chỉ đổi khi ai đó sửa tay ở trang Nguyên Vật Liệu. Nếu quên cập nhật giá khi NCC báo giá mới, Giá Vốn sẽ tính sai theo giá cũ cho tới khi có người sửa tay.
- NVL chưa từng được đặt giá (`material_prices` không có dòng) sẽ nhập hàng với đơn giá 0 — trang Nhập Hàng hiển thị "Chưa có giá" để nhắc đi đặt giá trước, nhưng không chặn lưu.
- Thay thế hoàn toàn ADR-0006 (bình quân gia quyền) và hoàn tất việc đảo ngược ADR-0003 (giá tự ghi đè theo lần nhập gần nhất) — cả 3 ADR nên đọc theo thứ tự thời gian để hiểu vì sao mô hình giá đổi qua lại nhiều lần.
