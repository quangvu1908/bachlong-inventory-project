# Điều Chuyển tự động cộng kho cửa hàng nhận, khác với Excel gốc

Sổ kho Excel chỉ ghi nhận phía gửi của một lần điều chuyển NVL giữa các cửa hàng — không có nghiệp vụ nào cho phía nhận, nên tồn kho toàn chuỗi trên Excel không bao giờ tự khớp tuyệt đối. Khi thêm Điều Chuyển vào web app, ta có 2 lựa chọn: bám sát Excel (chỉ trừ kho bên gửi, bên nhận tự nhập kho riêng) hoặc để `record_transfer` tự cộng kho bên nhận trong cùng giao dịch. Đã chọn tự động cộng — đổi lấy việc tồn kho toàn chuỗi luôn khớp, dù khác với Excel gốc.

## Status

accepted

## Consequences

- `record_transfer` ghi 2 dòng transaction (`transfer_out` tại cửa hàng gửi, `transfer_in` tại cửa hàng nhận) trong cùng 1 lần gọi — không có bước "xác nhận đã nhận hàng" riêng như vài phần mềm quản lý kho khác.
- Điều Chuyển chỉ cho phép giữa 2 cửa hàng cùng Thương hiệu (NVL thuộc về thương hiệu, cửa hàng khác thương hiệu không dùng chung danh mục NVL).
- Điều Chuyển bị loại trừ riêng khỏi công thức Tiêu thụ thực tế / Giá Vốn — xem định nghĩa trong `CONTEXT.md`.
