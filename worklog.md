# Worklog — Trà House: Hệ thống kiểm soát tồn kho

---
Task ID: 1
Agent: main (Z.ai Code)
Task: Thiết kế giao diện trang chủ hệ thống kiểm soát tồn kho cho cửa hàng trà sữa, bao gồm 6 nghiệp vụ trong quy trình, phần cài đặt và quản lý nguyên vật liệu (thêm/bớt/đơn vị/giá).

Work Log:
- Phân tích hình ảnh quy trình (VLM) → xác định 6 nghiệp vụ: Nhập Hàng, Xuất Kho Ra Bar, Kiểm Kho (Kho Dự Trữ), Kiểm Bar (Quầy Bar), Tồn Kho (báo cáo chỉ xem), Giá Vốn (báo cáo chỉ xem).
- Thiết lập theme màu trà sữa (caramel/matcha/cream) trong `src/app/globals.css` với oklch, dark mode, scrollbar tùy chỉnh, animation flow-line/float.
- Tạo `ThemeProvider` + `ThemeToggle` (next-themes) và cập nhật `layout.tsx` (metadata tiếng Việt, lang="vi").
- Tạo `src/lib/inventory-data.ts`: định nghĩa 6 InventoryOperation + 12 Material mẫu + danh mục + đơn vị + luồng 3 chặng.
- Xây dựng `src/components/inventory/`:
  - `app-header.tsx`: sticky header, logo trà, nav 4 mục, search, thông báo (badge tồn kho thấp), theme toggle, nút Cài đặt, mobile sheet menu.
  - `inventory-flow.tsx`: hero + sơ đồ luồng 3 chặng (Nhà cung cấp → Kho Dự Trữ → Quầy Bar) với connector animation, 3 stat chips, legend.
  - `operations-grid.tsx`: lưới 6 thẻ nghiệp vụ (3 cột), phân loại action/periodic/report, hover effect, framer-motion stagger.
  - `material-management.tsx`: bảng nguyên vật liệu đầy đủ — search, filter danh mục, sort 4 cột, badge trạng thái (Đủ/Sắp hết), dialog thêm/sửa, alert confirm xóa, mobile cards, summary 4 thẻ.
  - `settings-panel.tsx`: SettingsSheet (slide-out) + SettingsOverview (6 thẻ category) — thông tin cửa hàng, đơn vị, nhắc nhở, tính giá vốn, dữ liệu, giao diện.
  - `operation-preview.tsx`: dialog xem trước nghiệp vụ khi click thẻ (mô tả, tần suất, luồng, các trường dữ liệu, cảnh báo chỉ-đọc).
  - `app-footer.tsx`: footer sticky (mt-auto trong flex-col min-h-screen).
- Lắp ráp `src/app/page.tsx` với `min-h-screen flex flex-col`, main flex-1, footer mt-auto.
- Chạy `bun run lint` → sạch, không lỗi.
- Kiểm tra dev log → compile 200 OK, không runtime error.
- Agent Browser verification end-to-end:
  - Trang render sạch (light + dark), không hydration error.
  - Click thẻ "Nhập Hàng" → dialog preview mở đúng.
  - Click "Thêm nguyên vật liệu" → điền form → submit → NVL mới "Trà oolong sữa" xuất hiện trong bảng + toast "Đã thêm".
  - Mở Settings Sheet → đầy đủ 5 nhóm cài đặt.
  - Toggle dark mode → class `dark` = true, VLM xác nhận hiển thị tốt.
  - Mobile 390px → responsive, không tràn ngang.
  - Filter danh mục "Trà" → chỉ hiển thị 4 NVL trà.
  - Không có console error / runtime error.

Stage Summary:
- Hoàn thành thiết kế trang chủ đầy đủ: header + hero/flow + 6 nghiệp vụ + quản lý NVL (CRUD) + cài đặt + footer sticky.
- Bảng màu trà sữa ấm (caramel primary, matcha accent, cream background), hỗ trợ dark mode.
- 6 nghiệp vụ được phân loại rõ: 2 thao tác (Nhập/Xuất), 2 kiểm kê định kỳ (Kiểm Kho/Kiểm Bar), 2 báo cáo chỉ-xem (Tồn Kho/Giá Vốn).
- Quản lý NVL hỗ trợ ĐVT Kho + ĐVT Bar + hệ số quy đổi + đơn giá + tồn kho/tối thiểu, có cảnh báo sắp hết.
- Tất cả tương tác cốt lõi đã được kiểm chứng bằng Agent Browser.
- Artifacts: `src/app/page.tsx`, `src/app/globals.css`, `src/app/layout.tsx`, `src/lib/inventory-data.ts`, `src/components/theme-provider.tsx`, `src/components/theme-toggle.tsx`, `src/components/inventory/*.tsx`.

Unresolved / Next-phase recommendations:
- Chưa có backend/database: dữ liệu NVL đang là state client (initialMaterials). Giai đoạn sau nên dựng Prisma schema (Material, Receipt, Issue, StockCheck, StockCheckBar) + API routes cho từng nghiệp vụ.
- Các nghiệp vụ hiện chỉ là "preview dialog" (nút disabled) — cần xây giao diện chi tiết cho từng nghiệp vụ (form nhập hàng, phiếu xuất, bảng kiểm kê, báo cáo tồn kho/giá vốn với chart).
- Có thể bổ sung dashboard thống kê (recharts đã cài), lịch sử phiếu, in PDF phiếu.
- Cron webDevReview 15 phút đã được lập để tiếp tục phát triển tự động.

---
Task ID: 2
Agent: main (Z.ai Code) — webDevReview cron round 1
Task: Đánh giá trạng thái, QA, và tiếp tục phát triển: thêm tính năng (dashboard biểu đồ, nghiệp vụ thực thi thật, lịch sử giao dịch, báo cáo) + hoàn thiện styling.

Work Log:
- Đọc worklog.md giai đoạn 1 → xác nhận homepage ổn định, không lỗi.
- QA agent-browser: trang render sạch, không console error, không runtime error.
- Tạo `src/lib/inventory-store.ts`: Zustand store với persist (localStorage) cho materials + transactions, 4 action ghi nhận giao dịch (recordReceipt, recordIssue, recordWarehouseCount, recordBarCount), seed 7 giao dịch mẫu 7 ngày.
- Tạo `src/lib/inventory-stats.ts`: hook `useInventoryStats` (giá trị kho/bar, phân bổ danh mục, xu hướng 7 ngày, KPIs) + helpers formatVND/formatNum/formatDate + transactionTypeMeta.
- Refactor `material-management.tsx` dùng store (thay initialMaterials local state) → CRUD đồng bộ toàn app.
- Tạo `operation-dialogs.tsx`: 4 form nghiệp vụ THẬT — Nhập Hàng (+stock, tự tính thành tiền), Xuất Kho Ra Bar (−kho +bar có quy đổi, validate vượt tồn), Kiểm Kho (điều chỉnh theo đếm thực tế), Kiểm Bar (điều chỉnh bar stock). Mỗi form có MaterialSummary, cảnh báo chênh lệch, toast xác nhận.
- Tạo `dashboard-section.tsx`: 4 KPI cards + donut chart (giá trị theo danh mục, recharts) + bar chart (top 6 mức tồn Kho vs Bar) + line chart (xu hướng 7 ngày 3 loại giao dịch). Tooltip tùy chỉnh, legend, màu oklch đồng bộ theme.
- Tạo `transaction-history.tsx`: feed giao dịch với filter theo loại + sort (mới nhất/cũ nhất/thành tiền), summary strip (tổng giao dịch/tiền nhập/tiền xuất/đang xem), badge loại + delta + amount, empty state.
- Tạo `reports-section.tsx`: Báo cáo Tồn Kho (bảng + tổng giá trị kho/bar + lọc + CSV) và Giá Vốn (khoảng ngày C2→C3, công thức Tiêu thụ = Tồn đầu + Nhập − Tồn cuối, bảng NVL với Đầu/Nhập/Cuối/TT).
- Cập nhật `page.tsx` lắp ráp: Header → Flow → Operations → Dashboard → Materials → History → Reports → Settings → Footer.
- Cập nhật header nav thêm "Lịch sử", "Báo cáo"; sửa duplicate id (flow → #luong-nvl, dashboard giữ #tong-quan).
- Xóa file dead code `operation-preview.tsx` (thay bằng operation-dialogs).
- Lint sạch (0 error, 0 warning). Dev log compile 200 OK.
- Agent Browser QA end-to-end:
  - Test Nhập Hàng: chọn Trà đen Đài Loan, sl 3, đơn giá auto 180.000 → thành tiền 540.000 ₫ → submit → stock 8,5→11,5 kg, toast "Đã ghi nhận nhập hàng", dashboard KPI Giá trị Kho 5.873.900→6.413.900 ₫, donut Trà 2.762.000→3.302.000 ₫, "Nhập hôm nay" 0→540.000 ₫ (1 phiếu), transaction history thêm entry +3 kg, Giá Vốn report Đầu 3,5/Nhập 8/Cuối 11,5. Tất cả reactive.
  - Test Xuất Kho Ra Bar: chọn Trà đen (đã thấy stock cập nhật 11,5), sl 2 → submit → kho 11,5→9,5 kg, bar 600→2.600 g (quy đổi 2×1000 đúng), toast "−2 kg kho · +2.000 g bar", dashboard Giá trị Kho −360.000, Giá trị Bar +360.000, history thêm entry, Tồn Kho report 9,5 kg/2.600 g.
  - Test filter lịch sử: chọn "Nhập hàng" → chỉ còn 4 entry receipt, "Đang xem" 4.
  - Dark mode: class dark=true, KPI cards/cards đọc tốt, không lỗi.
  - Không console error / runtime error toàn bộ phiên.

Stage Summary:
- Biến homepage tĩnh thành ứng dụng nghiệp vụ hoạt động thật: 4 nghiệp vụ thao tác (Nhập/Xuất/Kiểm Kho/Kiểm Bar) thực sự cập nhật tồn kho và tạo giao dịch.
- Toàn bộ state tập trung trong Zustand store (persist localStorage) → mọi component (dashboard, bảng NVL, lịch sử, báo cáo) đồng bộ reactive khi thực hiện nghiệp vụ.
- Dashboard recharts: donut + bar + line chart render đúng với dữ liệu, tooltip tùy chỉnh tiếng Việt, màu oklch theo theme.
- Lịch sử giao dịch: filter + sort + summary, 9 giao dịch (7 seed + 2 test) hiển thị đầy đủ.
- Báo cáo Tồn Kho & Giá Vốn: bảng chi tiết, khoảng ngày, công thức, nút CSV (toast).
- Artifacts mới: `src/lib/inventory-store.ts`, `src/lib/inventory-stats.ts`, `src/components/inventory/operation-dialogs.tsx`, `dashboard-section.tsx`, `transaction-history.tsx`, `reports-section.tsx`.

Unresolved / Next-phase recommendations:
- Giá Vốn hiện tính Tiêu thụ = 0 vì chưa track consumption (hết hàng tại bar) riêng — nên bổ sung nghiệp vụ "Bán/Tiêu thụ tại Bar" hoặc tính tiêu thụ = barStock 减少 giữa 2 lần kiểm bar. Ưu tiên cao cho round sau.
- Data persistence dùng localStorage (client) — nếu cần multi-user/server nên chuyển sang Prisma + API routes (schema Material/Transaction đã sẵn sàng thiết kế).
- Có thể thêm: in/xuất PDF phiếu, lịch kiểm kê định kỳ (cron nhắc), dashboard so sánh kỳ, cảnh báo hạn sử dụng NVL.
- Nút "Reset data" trong settings chưa wire tới store.resetData — nên nối.
