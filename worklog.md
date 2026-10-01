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
