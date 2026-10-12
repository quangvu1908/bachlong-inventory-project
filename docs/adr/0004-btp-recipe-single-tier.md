# Công thức BTP chỉ 1 tầng — không có BTP lồng BTP

Công thức sản phẩm có thể dùng NVL thô hoặc BTP; Công thức BTP luôn đi thẳng từ NVL thô. Ta cố tình không cho phép một BTP dùng BTP khác làm nguyên liệu đầu vào, dù mô hình 2 tầng (NVL → BTP → Sản phẩm) tổng quát hơn sẽ cho phép N tầng. Quyết định này được xác nhận trực tiếp với BachLong khi thiết kế tính năng công thức/sai lệch tiêu thụ (GĐ8) — thực tế sản xuất tại cửa hàng không có BTP nào được làm từ BTP khác.

## Status

accepted

## Consequences

- `material_recipes.input_material_id` không có ràng buộc ngăn trỏ tới một NVL khác cũng đang là `btp_material_id` của một công thức khác — ràng buộc "chỉ 1 tầng" hiện chỉ được đảm bảo bằng quy ước, không bằng constraint ở DB.
- Logic "nổ" công thức trong `theoretical-consumption.ts` chỉ nổ đúng 2 bước (sản phẩm → BTP/NVL, rồi BTP → NVL thô) — không đệ quy nhiều tầng.
