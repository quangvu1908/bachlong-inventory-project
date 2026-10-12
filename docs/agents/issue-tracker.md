# Issue tracker: GitHub

Issue và spec của repo này lưu dưới dạng GitHub issue. Dùng `gh` CLI cho mọi thao tác.

## Quy ước

- **Tạo issue**: `gh issue create --title "..." --body "..."`. Dùng heredoc cho nội dung nhiều dòng.
- **Đọc issue**: `gh issue view <number> --comments`, lọc comment bằng `jq` và lấy luôn nhãn (label).
- **Liệt kê issue**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` kèm `--label`/`--state` phù hợp.
- **Comment vào issue**: `gh issue comment <number> --body "..."`
- **Gắn / gỡ nhãn**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Đóng issue**: `gh issue close <number> --comment "..."`

Repo được suy ra từ `git remote -v`; `gh` tự làm việc này khi chạy trong một bản clone. Remote của repo này là `quangvu1908/bachlong-inventory-project`.

## Pull request như một kênh triage

**PR như một kênh request: không.** _(Đổi thành `có` nếu repo này coi PR từ bên ngoài là feature request; `/triage` đọc cờ này.)_

Khi bật `có`, PR chạy qua cùng bộ nhãn/trạng thái như issue, dùng các lệnh `gh pr` tương ứng:

- **Đọc PR**: `gh pr view <number> --comments` và `gh pr diff <number>` để xem diff.
- **Liệt kê PR bên ngoài cần triage**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments` rồi chỉ giữ lại `authorAssociation` thuộc `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, hoặc `NONE` (bỏ `OWNER`/`MEMBER`/`COLLABORATOR`).
- **Comment / gắn nhãn / đóng**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub dùng chung 1 dải số cho issue và PR, nên `#42` có thể là 1 trong 2 — thử `gh pr view 42` trước, không có thì fallback sang `gh issue view 42`.

## Khi một skill nói "publish lên issue tracker"

Tạo một GitHub issue.

## Khi một skill nói "lấy ticket liên quan"

Chạy `gh issue view <number> --comments`.

## Thao tác cho Wayfinding

Dùng bởi `/wayfinder`. **Map** là 1 issue duy nhất, có các issue **con** là ticket.

- **Map**: 1 issue gắn nhãn `wayfinder:map`, chứa nội dung Notes / Decisions-so-far / Fog. `gh issue create --label wayfinder:map`.
- **Ticket con**: 1 issue được liên kết với map dưới dạng GitHub sub-issue (`gh api` trên endpoint sub-issues). Nếu repo chưa bật sub-issue, thêm ticket con vào task list trong body của map và ghi `Part of #<map>` ở đầu body của ticket con. Nhãn: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Khi được nhận, ticket được gán (assign) cho dev đang thực hiện.
- **Blocking (phụ thuộc)**: dùng **native issue dependencies** của GitHub, đây là biểu diễn chuẩn, hiển thị trên UI. Thêm một cạnh phụ thuộc bằng `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, trong đó `<blocker-db-id>` là **database id** dạng số của issue chặn (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`, **không phải** `#number` hay `node_id`). GitHub trả về `issue_dependencies_summary.blocked_by` (chỉ tính các blocker đang mở — đây là cổng chặn còn hiệu lực). Nếu dependencies không khả dụng, dùng cách dự phòng: dòng `Blocked by: #<n>, #<n>` ở đầu body ticket con. Một ticket hết bị chặn khi mọi blocker đã đóng.
- **Frontier query (truy vấn hàng chờ)**: liệt kê các ticket con đang mở của map (`gh issue list --state open`, giới hạn trong sub-issue/task list của map), bỏ qua ticket nào còn blocker mở (`issue_dependencies_summary.blocked_by > 0`, hoặc có issue mở trong dòng `Blocked by`) hoặc đã có assignee; ticket đứng đầu theo thứ tự trong map được chọn.
- **Claim (nhận việc)**: `gh issue edit <n> --add-assignee @me`, đây là thao tác ghi đầu tiên của phiên làm việc.
- **Resolve (giải quyết)**: `gh issue comment <n> --body "<câu trả lời>"`, sau đó `gh issue close <n>`, rồi thêm một pointer ngữ cảnh (gist + link) vào mục Decisions-so-far của map.
