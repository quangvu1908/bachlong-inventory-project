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

---
Task ID: 3
Agent: main (Z.ai Code) — webDevReview cron round 2
Task: Đánh giá trạng thái, QA, sửa bug Giá Vốn (Tiêu thụ=0), wire Reset data, thêm tracking hạn sử dụng, panel gợi ý nhập bổ sung, animated counters, polish styling.

Work Log:
- Đọc worklog.md round 1 + 2 → xác nhận app ổn định, không lỗi. QA agent-browser: trang render sạch, 0 console error.
- **Sửa bug Giá Vốn** (HIGH): viết lại công thức trong `reports-section.tsx` — cân đối kho đúng: `stock_end = stock_start + receipts − issues_to_bar + kho_adjustments` → `tonDau = tonCuoi − receipts + issues − khoAdjust`, `tieuThu = tonDau + receipts − tonCuoi = issues − khoAdjust`. Thêm cột Xuất Bar (XB) + Tiêu thụ + Giá vốn vào bảng, thêm thẻ tổng "Xuất sang Bar". Kết quả: Giá vốn tiêu thụ = 408.000 ₫ (trước = 0), per-material đúng (Sữa tươi 6×32000=192.000 ₫, Sữa đặc 6×22000=132.000 ₫, Đường trắng 3×28000=84.000 ₫).
- **Wire Reset data** trong `settings-panel.tsx`: nút "Đặt lại dữ liệu kho…" với AlertDialog xác nhận → gọi `store.resetData()`, toast xác nhận, đóng sheet. Đổi tên handleReset → handleResetSettings cho nút Khôi phục cài đặt.
- **Tracking hạn sử dụng (expiry)**:
  - Thêm field `expiryDate?: string` vào Material (inventory-data.ts), seed 7 NVL có hạn (Pudding 3 ngày, Sữa tươi 5, Trà xanh 8, Trân châu đen 12, Thạch 20, Trà đen 61, Sữa đặc 182).
  - Thêm helpers `daysUntil`, `expiryLevel` (expired/critical/soon/ok/none), `expiryLevelMeta` trong inventory-stats.ts.
  - Mở rộng `useInventoryStats`: `expiringMaterials` + `restockSuggestions` (with suggested qty = max(min*2−stock, deficit*2, min)).
- **Build AlertsPanel** (`alerts-panel.tsx`): section "Cảnh báo & gợi ý" với 2 tab (Nhập bổ sung / Hạn sử dụng), badge tổng, animated transition. RestockList: stock bar visualization + gợi ý nhập + nút "Nhập" quick-receipt. ExpiryList: badge mức + ngày còn lại + chi tiết.
- **AnimatedCounter** (`animated-counter.tsx`): count-up easeOutCubic với requestAnimationFrame, respects prefers-reduced-motion. Wire vào dashboard KPI cards (currency + count).
- **Cột Hạn SD trong bảng NVL**: thêm column header + ExpiryCell (badge + tooltip ngày hết hạn) + ExpiryPreview trong dialog thêm/sửa, field date picker với nút xóa. Cập nhật colSpan 10→11.
- **Quick-receipt prefill**: extend OperationDialogs với `prefill` prop → ReceiptForm khởi tạo materialId/quantity/note từ prefill. Wire AlertsPanel onQuickReceipt → mở dialog Nhập Hàng đã pre-fill.
- Cập nhật `page.tsx`: thêm AlertsPanel giữa Dashboard và MaterialManagement, state prefill, handleQuickReceipt.
- Polish styling: KPI cards hover shadow + icon scale-110, gradient blob trên operation cards, sticky table headers, scrollbar tùy chỉnh.
- Lint sạch (0 error/warning). Có 2 transient 500 trong lúc edit (ExpiryCell/AlertDialog chưa import) → tự phục hồi sau full reload.
- Agent Browser QA end-to-end:
  - **Giá Vốn fix VERIFIED**: "GIÁ VỐN TIÊU THỤ: 408.000 ₫" (trước = 0), bảng per-material đúng (Sữa tươi Đầu 30/Nhập 0/XB 6/Cuối 24/Tiêu thụ 6/Giá vốn 192.000 ₫).
  - **Expiry column VERIFIED**: bảng NVL có cột HẠN SD, hiển thị "3 ngày"/"5 ngày"/"8 ngày"/"12 ngày"/"182 ngày"/"—".
  - **Alerts panel VERIFIED**: tab "Hạn sử dụng" (4) liệt kê 4 NVL sắp hết hạn sorted tăng dần, mỗi item có badge mức + "Hết hạn DD/MM/YYYY · còn X [unit] tại kho" + số ngày.
  - **Reset data VERIFIED**: mở Settings → "Đặt lại dữ liệu kho…" → confirm dialog → "Đặt lại" → toast "Đã đặt lại dữ liệu kho" → data về seed (12 NVL, 7 giao dịch, 5.873.900 ₫).
  - Không console error / runtime error toàn bộ phiên.

Stage Summary:
- Sửa bug logic Giá Vốn (HIGH): công thức cân đối kho đúng, Tiêu thụ = Xuất Bar − điều chỉnh kho, giờ khác 0 và chính xác.
- Wire nút Reset data với xác nhận (unresolved round trước).
- Thêm tracking hạn sử dụng: field + helpers + cột bảng + alert — phản ánh đúng đặc thù tiệm trà sữa (sữa/trân châu/pudding dễ hết hạn).
- Build AlertsPanel 2-tab: gợi ý nhập bổ sung (restock) + cảnh báo hết hạn (expiry), với quick-receipt pre-fill sang dialog Nhập Hàng.
- AnimatedCounter cho KPI cards (count-up mượt, giảm chuyển động).
- Polish: hover effects, sticky headers, gradient, scrollbar.
- Artifacts mới: `alerts-panel.tsx`, `animated-counter.tsx` + mở rộng `inventory-data.ts`, `inventory-stats.ts`, `reports-section.tsx`, `settings-panel.tsx`, `material-management.tsx`, `operation-dialogs.tsx`, `page.tsx`.

Unresolved / Next-phase recommendations:
- Quick-receipt từ AlertsPanel chưa test end-to-end (restock list đang rỗng vì không NVL dưới min). Để test: có thể chủ động tạo NVL thấp bằng cách xuất nhiều. Nên thêm NLV mẫu có stock < minStock để demo restock list.
- Giá Vốn tính theo consumption = Xuất Bar (chưa track hao hụt thực tế tại Bar qua 2 lần Kiểm Bar). Có thể nâng cấp: tính tiêu thụ bar = issues − (bar_stock_end − bar_stock_start) + bar_adjustments, cho số liệu tinh hơn.
- Chưa có backend/DB (vẫn localStorage). Nếu cần multi-user/server, dựng Prisma schema Material/Transaction + API routes.
- Có thể thêm: xuất PDF phiếu, command palette (Cmd+K), so sánh kỳ, cảnh báo hạn sử dụng theo ngày cụ thể trên dashboard.
- Chưa wire expiry vào operation dialogs (vd: khi nhập hàng có thể set lại hạn mới).

---
Task ID: 4
Agent: main (Z.ai Code) — webDevReview cron round 3
Task: Đánh giá trạng thái, QA, thêm Command Palette (Cmd+K), dashboard trend delta + expiry summary, demo low-stock + test quick-receipt flow end-to-end, polish styling.

Work Log:
- Đọc worklog.md round 1-3 → app ổn định, không lỗi. QA agent-browser: render sạch, 0 console error.
- **Build Command Palette** (`command-palette.tsx`): cmdk-based, mở bằng Cmd/Ctrl+K hoặc nút "Lệnh nhanh… ⌘K" ở header. 4 nhóm lệnh: Điều hướng (5 section), Nghiệp vụ (6 op), Thao tác (thêm NVL/mở settings/reset data), Giao diện (toggle dark). Tìm kiếm fuzzy, sticky group headings, footer hint phím (↑↓/↵/⌘K), animated entrance, respects ESC. Wire custom event 'tra-house:open-command-palette' + 'tra-house:add-material' để header button mở palette + MaterialManagement nghe event mở dialog thêm.
- **Dashboard trend strip** (`TrendStrip` trong dashboard-section.tsx): 4 thẻ — Tiền nhập 7 ngày, Xuất sang Bar 7 ngày, Số phiếu nhập (animated counter) + thẻ Hạn sử dụng (count + "X sắp hết"). Mỗi thẻ có delta % so với 7 ngày trước (icon TrendingUp/Down/Minus, tone màu tương ứng). Thêm helpers trong inventory-stats: `trends` (receiptValue/issueValue/receiptCount current/previous/delta).
- **Demo low-stock + test quick-receipt end-to-end** (unresolved round 2):
  - Sửa seed Trà xanh matcha: stock 2.1 → 0.6 (< min 1) → kích hoạt restock list.
  - Bump store version 1→2 với migrate discard → seed mới có hiệu lực.
  - Agent Browser test: restock list hiện "Trà xanh matcha, 0,6 kg / tối thiểu 1 kg, GỢI Ý NHẬP +1,4 kg, ≈ 588.000 ₫" + nút "Nhập".
  - Click "Nhập" → dialog Nhập Hàng mở pre-fill: material=Trà xanh matcha (0,6 kg), qty=1.4, note="Nhập bổ sung theo gợi ý", đơn giá auto 420.000, thành tiền 588.000 ₫.
  - Submit → stock 0,6→2 kg, "Sắp hết" 1→0, "Nhập hôm nay" 0→588.000 ₫ (1 phiếu), transaction history thêm entry "+1,4 kg · 588.000 ₫", restock list giờ rỗng (đã hoàn tất).
- Polish styling: xóa search box trang trí cũ (thay bằng command trigger), header gọn hơn, KPI cards icon scale-110 on hover + shadow, gradient blobs, sticky table headers, scrollbar tùy chỉnh, trend cards ring tone theo loại.
- Lint sạch (0 error/warning). Có vài transient 500 trong lúc edit (hot reload) → tự phục hồi.
- Agent Browser QA end-to-end:
  - Command Palette: mở bằng nút header + Ctrl+K, hiển thị 15 lệnh chia 4 nhóm, Enter chạy lệnh điều hướng (page scroll), đóng bằng ESC/Enter.
  - Trend strip: 4 thẻ đúng (Tiền nhập 1.255.000 ₫ +100%, Xuất Bar 408.000 ₫ +100%, Số phiếu 3 +100%, Hạn sử dụng 4 — 1 sắp hết).
  - Low-stock demo: Trà xanh matcha 0,6 kg "Sắp hết", dashboard "Sắp hết hàng"=1, donut Trà 2.132.000 ₫.
  - Quick-receipt prefill VERIFIED: dialog mở đúng NVL + qty + note + thành tiền 588.000 ₫.
  - Submit round-trip VERIFIED: stock 0,6→2, low-stock cleared, dashboard/transaction/report reactive.
  - Không console error / runtime error toàn bộ phiên.

Stage Summary:
- Command Palette (Cmd+K): productivity hub — điều hướng section, mở nghiệp vụ, thêm NVL, settings, reset data, toggle theme trong 1 palette tìm kiếm được.
- Dashboard trend strip: so sánh 7 ngày này vs 7 ngày trước với delta % + thẻ tổng hạn sử dụng.
- Demo + test end-to-end quick-receipt (unresolved round 2): tạo NVL low-stock, restock list hiện gợi ý, click Nhập → dialog pre-fill → submit → stock update + low-stock cleared.
- Polish: header gọn, micro-interaction, trend tone colors.
- Artifacts mới: `command-palette.tsx` + mở rộng `inventory-stats.ts` (trends), `dashboard-section.tsx` (TrendStrip), `app-header.tsx` (trigger button), `material-management.tsx` (event listener), `inventory-data.ts` (matcha low-stock), `inventory-store.ts` (v2 migrate), `page.tsx` (wire palette).

Unresolved / Next-phase recommendations:
- Command Palette search chưa test typing/filter (agent-browser type cần ref; đã verify list + navigation). Nên test gõ "nhập" filter.
- localStorage vẫn (chưa Prisma/API) — nếu multi-user cần backend.
- Có thể thêm: in PDF phiếu, lịch kiểm kê định kỳ (cron nhắc), so sánh kỳ tùy chọn, drag-drop NVL, export Excel đầy đủ.
- Expiry chưa wire vào operation dialogs (nhập hàng có thể set lại hạn mới).

---
Task ID: 5
Agent: main (Z.ai Code) — webDevReview cron round 4
Task: Đánh giá trạng thái, QA, wire expiry vào dialog Nhập Hàng, thêm toggle so sánh kỳ (7/30 ngày) cho trend strip, polish styling.

Work Log:
- Đọc worklog.md round 1-4 → app ổn định, không lỗi. QA agent-browser: render sạch, 0 console error.
- **Wire expiry vào Nhập Hàng** (unresolved round trước):
  - Mở rộng `store.recordReceipt` nhận `expiryDate?` param, apply vào material khi có (`...(expiryDate !== undefined ? { expiryDate } : {})`).
  - Thêm UI trong `ReceiptForm`: Switch "Cập nhật hạn sử dụng cho lô này" + date picker (id r-expiry). Khi bật switch, prefill với expiry hiện tại của NVL (useEffect). Truyền `expiryDate: updateExpiry ? expiryDate || undefined : undefined` khi submit.
  - Import Switch + formatDate.
- **Toggle so sánh kỳ (7/30 ngày)** cho trend strip:
  - `useInventoryStats(trendDays=7)` — tham số hóa kỳ trend, tính `periodStart`/`prevStart` theo `trendDays`.
  - TrendStrip: state `days` (7|30), toggle button group (7 ngày / 30 ngày, pill style), labels động (`Tiền nhập ${periodLabel}`, `vs {days} ngày trước`), re-gọi `useInventoryStats(days)`.
  - Thêm `trends.days` vào return.
- Polish: period toggle pill style (active bg-primary), trend cards ring tone, sticky group headings trong command palette, smooth motion.
- Lint sạch (0 error/warning). Dev log compile 200 OK.
- Agent Browser QA end-to-end:
  - **Period toggle VERIFIED**: click "30 ngày" → labels đổi thành "TIỀN NHẬP 30 NGÀY", "vs 30 ngày trước", values đúng. Click "7 ngày" → về "TIỀN NHẬP 7 NGÀY".
  - **Expiry toggle UI VERIFIED**: mở dialog Nhập Hàng → switch "Cập nhật hạn sử dụng cho lô này" hiện, toggle ON → date picker hiện prefill month 12 (từ expiry hiện tại Trà đen 2026-12-01, đúng prefill logic). Điền qty 2, submit → receipt thành công (+2 kg, stock 8,5→10,5).
  - **Reset data VERIFIED**: mở Settings → "Đặt lại dữ liệu kho…" → confirm → seed restored (Trà đen 8.5 kg, expiry 2026-12-01).
  - Giới hạn test: chọn ngày qua calendar automation không hoàn tất (lỗi tooling, không phải code). Code path đúng: `expiryDate: updateExpiry ? expiryDate || undefined : undefined` + store apply khi `expiryDate !== undefined`.
  - Không console error / runtime error toàn bộ phiên.

Stage Summary:
- Wire expiry vào Nhập Hàng (unresolved round trước): store + UI + prefill logic, cho phép cập nhật hạn sử dụng khi nhập lô mới — đặc thù F&B quan trọng.
- Toggle so sánh kỳ 7/30 ngày cho trend strip: linh hoạt xem xu hướng ngắn/trung hạn.
- Polish: period pill toggle, trend tone colors.
- Artifacts mở rộng: `inventory-store.ts` (recordReceipt expiryDate), `inventory-stats.ts` (trendDays param), `operation-dialogs.tsx` (expiry toggle UI), `dashboard-section.tsx` (period toggle).

Unresolved / Next-phase recommendations:
- Expiry update qua calendar automation chưa test hoàn tất (giới hạn tooling) — nên verify bằng unit test hoặc manual test thực tế.
- localStorage vẫn (chưa Prisma/API) — nếu multi-user cần backend.
- Có thể thêm: in PDF phiếu, lịch kiểm kê định kỳ (cron nhắc), so sánh kỳ tùy chọn (14/90 ngày), drag-drop NVL, export Excel đầy đủ.
- Dashboard line chart vẫn cố định 7 ngày — có thể đồng bộ với period toggle.

---
Task ID: 6
Agent: main (Z.ai Code) — webDevReview cron round 5
Task: Đánh giá trạng thái, QA, real CSV export (Blob download), sync line chart với period toggle, wire Settings export toàn bộ dữ liệu.

Work Log:
- Đọc worklog.md round 1-5 → app ổn định, không lỗi. QA agent-browser: render sạch, 0 console error.
- **Real CSV export** (`csv-export.ts`): tạo utility `downloadCSV(filename, rows)` — escape fields (quote/double-quote), prepend UTF-8 BOM (Excel đọc tiếng Việt đúng), tạo Blob, click temporary <a>, revoke URL. Helper `csvFilename(prefix)` tạo tên có ngày.
- Wire CSV button Tồn Kho (`reports-section.tsx`): `handleExport` xuất bảng NVL đầy đủ (NVL, danh mục, ĐVT Kho/Bar, quy đổi, đơn giá, tồn, hạn, giá trị) + dòng tổng. Toast "12 nguyên vật liệu — file ton-kho-*.csv".
- Wire CSV button Giá Vốn: `handleExport` xuất bảng NVL có hoạt động (Đầu/Nhập/XB/Cuối/Tiêu thụ/Đơn giá/Giá vốn) + dòng tổng.
- **Wire Settings "Xuất dữ liệu kho (CSV)"** (`settings-panel.tsx`): `handleExportAll` xuất 2 section (=== NGUYEN VAT LIEU === + === GIAO DICH ===) với đầy đủ cột. Toast "12 NVL · 7 giao dịch".
- **Sync line chart với period toggle** (unresolved round trước):
  - Lift `days` state từ TrendStrip lên DashboardSection, pass xuống TrendStrip qua props.
  - `useInventoryStats(days)` gọi 1 lần ở DashboardSection, cả trend strip + line chart + KPI dùng cùng stats.
  - Đổi `last7Days` → `lastNDays` (parameter theo trendDays) trong inventory-stats.ts.
  - Line chart title động "Xu hướng giao dịch {days} ngày", data points theo N ngày.
- Polish: period toggle pill style, trend cards ring tone, sticky group headings.
- Lint sạch (0 error/warning). Có 1 transient 500 trong lúc edit → tự phục hồi sau full reload.
- Agent Browser QA end-to-end:
  - **Line chart sync VERIFIED**: click "30 ngày" → title "Xu hướng giao dịch 30 ngày" + **28 data points** (03-09→01-10) thay vì 6; trend strip labels "TIỀN NHẬP 30 NGÀY", "vs 30 ngày trước".
  - **CSV export Tồn Kho VERIFIED**: click CSV → toast "Đã xuất CSV · 12 nguyên vật liệu — file ton-kho-*.csv", download trigger (Blob URL tạo + click).
  - Không console error / runtime error toàn bộ phiên.

Stage Summary:
- Real CSV export (Blob download) cho 3 nút: Tồn Kho, Giá Vốn, Settings toàn bộ — trước đây chỉ toast giả lập.
- Sync line chart với period toggle (unresolved round trước): toggle 7/30 ngày cập nhật đồng thời trend strip + line chart (title + data points).
- Wire Settings export toàn bộ dữ liệu (materials + transactions) ra 1 file CSV 2 section.
- Artifacts mới: `csv-export.ts` + mở rộng `reports-section.tsx`, `settings-panel.tsx`, `inventory-stats.ts` (lastNDays), `dashboard-section.tsx` (lift days state).

Unresolved / Next-phase recommendations:
- CSV download không verify được file thực tế lưu về máy (giới hạn sandbox browser), nhưng Blob URL + click <a download> là API chuẩn, toast xác nhận data processed.
- localStorage vẫn (chưa Prisma/API) — nếu multi-user cần backend.
- Có thể thêm: in PDF phiếu, lịch kiểm kê định kỳ (cron nhắc), drag-drop NVL, export Excel (.xlsx).
- Line chart 30 ngày hơi dày (28 labels) — có thể ẩn bớt ticks hoặc dùng brush zoom.

---
Task ID: 7
Agent: main (Z.ai Code) — webDevReview cron round 6
Task: Đánh giá trạng thái, QA, fix line chart 30 ngày dày nhãn, build transaction detail + print view, polish styling.

Work Log:
- Đọc worklog.md round 1-6 → app ổn định, không lỗi. QA agent-browser: render sạch, 0 console error.
- **Fix line chart 30 ngày dày nhãn** (unresolved round trước):
  - XAxis thêm `interval={days === 30 ? 3 : 0}` + `minTickGap={8}` → 30 ngày hiển thị ~8 nhãn cách đều (02,06,10,14,18,22,26,30) thay vì 28 nhãn chồng nhau; 7 ngày vẫn hiện tất cả.
- **Build transaction detail + print view** (tính năng mới lớn):
  - Transaction rows → `motion.button` clickable, onClick set `detailTx` state.
  - `TransactionDetailDialog`: Dialog hiển thị chi tiết đầy đủ — NVL, loại, ngày nghiệp vụ, giờ ghi nhận, số lượng (tone màu theo loại), đơn giá, thành tiền, và riêng cho kiểm kê: tồn trước/sau/chênh lệch + ghi chú.
  - `handlePrint`: mở `window.open('', '_blank')` → viết HTML phiếu in (style F&B: header Trà House caramel, badge mã phiếu, rows dashed, amount lớn, note box, footer timestamp) → `window.print()` auto-trigger.
  - Nút "In phiếu" + "Đóng" trong dialog.
  - Helper `DetailRow` component.
- Polish: transaction rows hover bg-muted/40 + focus state, detail dialog tone colors theo loại giao dịch.
- Lint sạch (0 error/warning). Dev log compile 200 OK.
- Agent Browser QA end-to-end:
  - **Line chart fix VERIFIED**: toggle "30 ngày" → X-axis hiện 8 nhãn cách đều (02-09...30-09) không chồng; 7 ngày hiện đủ 7 nhãn.
  - **Transaction detail VERIFIED**: click giao dịch "Trà đen Đài Loan · Nhập hàng · +5 kg · 900.000 ₫" → dialog mở đúng: NVL, loại, ngày 25/09/2026, giờ 20:33, +5 kg, 180.000 ₫, thành tiền 900.000 ₫, ghi chú "Nhập lô từ NCC Minh Long", nút "In phiếu".
  - **Print VERIFIED**: click "In phiếu" → tab mới mở (title "Phiếu Nhập hàng - seed0"), HTML phiếu in render đúng, window.print() auto-trigger.
  - Không console error / runtime error toàn bộ phiên.

Stage Summary:
- Fix line chart 30 ngày: X-axis interval adaptive (8 nhãn thay 28), giải quyết vấn đề nhãn chồng (unresolved round trước).
- Transaction detail + print: click bất kỳ giao dịch → dialog chi tiết đầy đủ + in phiếu F&B-style (window.open + print) — tính năng thực tế cho tiệm trà sữa.
- Polish: clickable rows với focus states, tone colors theo loại.
- Artifacts mở rộng: `transaction-history.tsx` (detail dialog + print), `dashboard-section.tsx` (XAxis interval).

Unresolved / Next-phase recommendations:
- Print window không verify được file PDF vật lý (giới hạn sandbox), nhưng HTML render + window.print() API chuẩn.
- localStorage vẫn (chưa Prisma/API) — nếu multi-user cần backend.
- Có thể thêm: lịch kiểm kê định kỳ (cron nhắc), export Excel (.xlsx), drag-drop NVL, multi-receipt batch nhập.

---
Task ID: 8
Agent: main (Z.ai Code) — webDevReview cron round 7
Task: Đánh giá trạng thái, QA, thay Select dropdown NVL bằng searchable combobox (Popover + Command) trong operation dialogs.

Work Log:
- Đọc worklog.md round 1-7 → app ổn định, không lỗi. QA agent-browser: render sạch, 0 console error.
- **Build MaterialCombobox** (`material-combobox.tsx`): Popover + Command (cmdk) — trigger button hiển thị badge danh mục + tên + tồn kho, dropdown có ô search (tìm theo tên hoặc danh mục), list item có check icon + badge + tên + tồn, empty state "Không tìm thấy". `shouldFilter={false}` + filter thủ công để hỗ trợ tiếng Việt không dấu.
- Wire MaterialCombobox vào 4 operation dialogs (Nhập Hàng, Xuất Kho Ra Bar, Kiểm Kho, Kiểm Bar) — thay thế 4 Select dropdown cũ. Xóa unused imports Select/SelectTrigger/SelectContent/SelectItem/SelectValue.
- Lint sạch (0 error/warning). Dev log compile 200 OK.
- Agent Browser QA end-to-end:
  - **Combobox mở VERIFIED**: mở dialog Nhập Hàng → trigger hiển thị "Trà Trà đen Đài Loan · 8,5 kg" (badge + tên + tồn).
  - **Search VERIFIED**: click mở → list 12 NVL với badge danh mục; gõ "sữa" → filter còn 2 NVL (Sữa tươi, Sữa đặc).
  - **Selection VERIFIED**: chọn "Sữa tươi không đường" → trigger cập nhật "Sữa Sữa tươi không đường · 24 lít".
  - Không console error / runtime error toàn bộ phiên.

Stage Summary:
- Searchable MaterialCombobox cho 4 operation dialogs: UX tốt hơn nhiều khi danh sách NVL dài — tìm nhanh theo tên/danh mục, badge danh mục + tồn kho hiển thị trực quan.
- Thay thế Select dropdown đơn thuần (scroll dài) bằng combobox có search — giải quyết vấn đề UX khi số NVL tăng.
- Artifacts mới: `material-combobox.tsx` + mở rộng `operation-dialogs.tsx` (4 chỗ thay Select → Combobox, xóa unused imports).

Unresolved / Next-phase recommendations:
- Combobox search chưa hỗ trợ gõ không dấu (vd "sua" thay "sữa") — có thể thêm normalize dấu tiếng Việt.
- localStorage vẫn (chưa Prisma/API) — nếu multi-user cần backend.
- Có thể thêm: lịch kiểm kê định kỳ (cron nhắc), export Excel (.xlsx), drag-drop NVL, multi-receipt batch nhập.
