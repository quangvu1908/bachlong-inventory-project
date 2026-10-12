# Tồn Quầy Bar chỉ đổi qua Kiểm Bar, không cộng dồn từ Xuất Kho Ra Bar

Mô hình web app ban đầu cộng thẳng số lượng Xuất Kho Ra Bar vào Tồn Quầy Bar mỗi lần xuất — hợp lý trực giác nhưng sai so với sổ kho Excel gốc mà BachLong đang vận hành ở 8 cửa hàng Mongo. Excel chỉ tin vào lần Kiểm Bar gần nhất; hàng xuất ra bar giữa 2 lần kiểm coi như rời khỏi sổ sách, không theo dõi chi tiết hao hụt tại bar theo thời gian thực. Ta đổi `record_issue_to_bar` để khớp đúng Excel: nghiệp vụ này chỉ trừ Tồn Kho Dự Trữ, không đổi `bar_stock`; `bar_stock` chỉ đổi qua `record_bar_count`.

## Status

accepted

## Consequences

- Một người đọc code thấy `record_issue_to_bar` không đụng đến `bar_stock` dễ tưởng là thiếu logic — đây là cố ý, không phải bug.
- Nếu một cửa hàng lâu không Kiểm Bar, số Tồn Quầy Bar hiển thị sẽ cũ, dù đã xuất thêm hàng ra bar nhiều lần — đúng theo thiết kế gốc, không phải lỗi hiển thị.
