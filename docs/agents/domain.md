# Tài liệu Domain

Các skill nghiệp vụ nên đọc tài liệu domain của repo này như thế nào khi khám phá codebase.

## Đọc các file này trước khi khám phá

- **`CONTEXT.md`** ở thư mục gốc, hoặc
- **`CONTEXT-MAP.md`** ở thư mục gốc nếu có: file này trỏ tới từng `CONTEXT.md` theo mỗi context. Đọc file nào liên quan đến chủ đề đang làm.
- **`docs/adr/`**: đọc các ADR liên quan đến phần bạn sắp động vào. Với repo multi-context, kiểm tra thêm `src/<context>/docs/adr/` cho các quyết định riêng của context đó.

Nếu các file trên chưa tồn tại, **cứ tiếp tục, đừng báo lỗi**. Đừng nhắc việc chúng thiếu; đừng đề xuất tạo trước. Skill `/domain-modeling` (được gọi qua `/grill-with-docs` và `/improve-codebase-architecture`) sẽ tạo các file này một cách lazily, khi có thuật ngữ hoặc quyết định thực sự cần ghi lại.

## Cấu trúc thư mục

Repo này là single-context:

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-bar-stock-is-count-only.md
│   ├── 0002-store-transfer-auto-credits-receiver.md
│   ├── 0003-single-current-standard-price.md
│   ├── 0004-btp-recipe-single-tier.md
│   ├── 0005-transactions-are-append-only-via-rpc.md
│   └── 0006-weighted-average-cost.md
└── src/
```

## Dùng đúng thuật ngữ trong glossary

Khi output của bạn nhắc tới một khái niệm domain (trong tiêu đề issue, đề xuất refactor, giả thuyết, tên test), dùng đúng thuật ngữ đã định nghĩa trong `CONTEXT.md`. Đừng trôi sang từ đồng nghĩa mà glossary đã liệt kê là nên tránh (`_Avoid_`).

Nếu khái niệm bạn cần chưa có trong glossary, đó là một tín hiệu: hoặc bạn đang bịa ra thuật ngữ mà dự án không dùng (nên xem lại), hoặc đây là một khoảng trống thật sự (ghi chú lại để dùng `/domain-modeling`).

## Báo xung đột với ADR

Nếu output của bạn mâu thuẫn với một ADR đã có, hãy nêu rõ ra thay vì âm thầm ghi đè:

> _Mâu thuẫn với ADR-0001 (tồn bar chỉ đổi qua kiểm kê), nhưng đáng cân nhắc lại vì…_
