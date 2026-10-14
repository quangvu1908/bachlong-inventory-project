# Giá Vốn dùng bình quân gia quyền, tính lại mỗi lần Nhập Hàng

ADR-0003 chọn "giá chuẩn hiện hành" = giá của lần Nhập Hàng gần nhất, khớp đúng Excel gốc. Hệ quả: khi NCC tăng giá, `record_receipt` ghi đè thẳng giá mới vào `material_prices`, nên **toàn bộ** lượng tiêu thụ trong kỳ báo cáo — kể cả phần tiêu thụ trước khi giá tăng — bị tính theo giá mới nhất, không phản ánh đúng dòng tiền thực đã bỏ ra. Đã đổi sang **bình quân gia quyền** (weighted average cost): mỗi lần nhập, giá mới hoà vào tồn kho hiện có theo đúng tỷ trọng số lượng — `giá mới = (tồn cũ × giá cũ + SL nhập × giá nhập) / (tồn cũ + SL nhập)` — thay vì ghi đè. Đây là cách tính giá vốn phổ biến nhất trong ngành F&B/chuỗi bán lẻ, cân bằng giữa độ chính xác và độ phức tạp (so với FIFO theo từng lô — chính xác hơn nhưng cần thêm bảng theo dõi lô nhập, đổi lại toàn bộ báo cáo Giá Vốn/Sai Lệch Tiêu Thụ).

Bình quân tính trên **tổng tồn kho toàn thương hiệu** (mọi cửa hàng cộng lại tại thời điểm nhập), không tách riêng theo từng cửa hàng — vì `material_prices` vẫn là 1 giá dùng chung cho cả thương hiệu (xem ADR-0003), Điều Chuyển giữa các cửa hàng không làm thay đổi tổng này nên không ảnh hưởng tới giá bình quân.

## Status

accepted

## Consequences

- `transactions.unit_price`/`amount` của nghiệp vụ Nhập Hàng vẫn ghi **đúng giá thực tế** của lần nhập đó (không đổi) — chỉ `material_prices.unit_price` (dùng để định giá tồn kho và tính Giá Vốn) là giá bình quân. Hai giá này giờ có thể khác nhau, đọc báo cáo cần phân biệt rõ.
- Kiểm Kho (`record_warehouse_count`) và Điều Chuyển không mang thông tin giá, nên không làm thay đổi giá bình quân — chỉ Nhập Hàng mới tính lại.
- 2 lần Nhập Hàng cùng 1 NVL ở 2 cửa hàng khác nhau, chạy đồng thời, sẽ bị khóa tuần tự ở dòng `material_prices` (xem `for update` trong `record_receipt`) để tránh tính bình quân sai do đọc chồng dữ liệu.
- Giá bình quân "trôi" dần theo mỗi lần nhập, không "nhảy" ngay lập tức như trước — nếu NCC tăng giá đột ngột và cần phản ánh ngay 100% giá mới vào Giá Vốn (vd: để báo giá lại ngay), phải sửa tay `material_prices` hoặc đợi tồn kho cũ bán hết.
