# BachLong Inventory

Quản lý tồn kho và giá vốn cho chuỗi đồ uống BachLong, gồm 2 thương hiệu (Mongo, NooShan). Mô hình nghiệp vụ bám theo đúng luồng của sổ kho Excel mà các cửa hàng đang dùng — không phải một mô hình kế toán tổng quát.

## Language

### Nguyên liệu & công thức

**NVL (Nguyên Vật Liệu)**:
Một mặt hàng được theo dõi tồn kho — có thể là nguyên liệu thô hoặc một BTP. Mỗi NVL thuộc về đúng 1 thương hiệu.
_Avoid_: Mặt hàng, hàng hóa, SKU

**BTP (Bán Thành Phẩm)**:
Một NVL được chế biến ra từ NVL thô khác qua Công thức BTP (vd: Thạch, Kem Cheese), thay vì mua trực tiếp từ nhà cung cấp. Trong hệ thống nó vẫn là một NVL bình thường — "BTP" chỉ là vai trò của nó trong công thức.
_Avoid_: Bán sản phẩm, thành phẩm phụ

**Công thức BTP**:
Danh sách NVL thô + định lượng cần để sản xuất ra 1 mẻ BTP. Luôn đi thẳng từ NVL thô — không có BTP lồng BTP (chỉ 1 tầng).
_Avoid_: Recipe, BOM nguyên liệu

**Sản phẩm**:
Một món được bán cho khách (vd: Trà sữa Thái Xanh size M). Khác với NVL — sản phẩm không được theo dõi tồn kho, chỉ được theo dõi qua Công thức sản phẩm và số liệu bán ra. Thuộc về đúng 1 thương hiệu; 2 thương hiệu không bao giờ dùng chung sản phẩm.

**Công thức sản phẩm**:
Danh sách NVL hoặc BTP + định lượng cần cho 1 đơn vị Sản phẩm bán ra. Dùng để "nổ" số lượng bán thành Tiêu thụ lý thuyết.
_Avoid_: Recipe sản phẩm

### Tồn kho

**Tồn Kho Dự Trữ**:
Số lượng NVL tại kho chứa của một cửa hàng, tính kiểu "bán liên tục": bằng số đếm của lần Kiểm Kho gần nhất, cộng dồn Nhập Hàng và trừ dần Xuất Kho Ra Bar / Điều Chuyển kể từ đó.
_Avoid_: Tồn kho, tồn tổng

**Tồn Quầy Bar**:
Số lượng NVL tại quầy bar của một cửa hàng. Khác hẳn Tồn Kho Dự Trữ: **không** cộng dồn từ các lần Xuất Kho Ra Bar — chỉ bằng đúng số đếm của lần Kiểm Bar gần nhất. Giữa 2 lần kiểm, hàng đã xuất ra bar coi như rời khỏi sổ sách.
_Avoid_: Tồn bar, tồn quầy

**Tồn Tổng**:
Tồn Kho Dự Trữ + Tồn Quầy Bar của một NVL tại một cửa hàng.

### Nghiệp vụ

**Nhập Hàng**:
Ghi nhận NVL mua từ nhà cung cấp vào Tồn Kho Dự Trữ, kèm đơn giá nhập (đơn giá này trở thành Giá chuẩn hiện hành mới).

**Xuất Kho Ra Bar**:
Chuyển NVL từ Tồn Kho Dự Trữ sang quầy bar. Chỉ làm giảm Tồn Kho Dự Trữ — không làm tăng Tồn Quầy Bar (xem định nghĩa Tồn Quầy Bar).

**Điều Chuyển**:
Chuyển NVL từ Tồn Kho Dự Trữ của một cửa hàng sang một cửa hàng khác cùng thương hiệu. Cửa hàng nhận được tự động cộng Tồn Kho Dự Trữ. Bị loại trừ riêng khỏi Tiêu thụ thực tế — điều chuyển không phải là tiêu thụ.
_Avoid_: Chuyển kho, xuất điều chuyển

**Kiểm Kho**:
Đếm thực tế Tồn Kho Dự Trữ, đặt lại thành mốc neo (baseline) mới cho các lần tính tồn sau đó.

**Kiểm Bar**:
Đếm thực tế Tồn Quầy Bar, đặt lại thành mốc neo (baseline) mới — đây là cách DUY NHẤT để Tồn Quầy Bar tăng lên.

### Giá vốn & tiêu thụ

**Giá chuẩn hiện hành**:
Một đơn giá duy nhất cho mỗi NVL, có hiệu lực tại mọi thời điểm (standard cost) — không phải giá thực tế của từng lần nhập. Đổi giá hôm nay làm đổi Giá Vốn của cả các kỳ báo cáo cũ khi mở lại.
_Avoid_: Giá vốn trung bình, giá lịch sử

**Tiêu thụ thực tế**:
Lượng NVL đã dùng/hao hụt trong một khoảng thời gian, suy ra từ cân đối tồn kho: Tồn đầu kỳ + Nhập − Tồn cuối kỳ − Điều chuyển. Không tách được giữa "dùng đúng công thức" và "hao hụt" — chỉ tổng thực tế.

**Tiêu thụ lý thuyết**:
Lượng NVL lẽ ra phải dùng, suy từ số lượng bán của Sản phẩm "nổ" qua Công thức sản phẩm rồi Công thức BTP. Dựa trên dữ liệu bán hàng import từ phần mềm POS, không phải từ nghiệp vụ Xuất Kho Ra Bar.

**Sai lệch tiêu thụ**:
% chênh lệch giữa Tiêu thụ thực tế và Tiêu thụ lý thuyết của một NVL. Dương = dùng nhiều hơn công thức (hao hụt, rơi vãi, thất thoát); âm = dùng ít hơn (đếm sai, hoặc pha "tiết kiệm" hơn công thức).

**Giá Vốn**:
Tiêu thụ thực tế × Giá chuẩn hiện hành, trong một khoảng thời gian. Không bao giờ âm (Tiêu thụ âm → Giá Vốn = 0).

### Tổ chức

**Thương hiệu**:
Mongo hoặc NooShan. Ranh giới cô lập dữ liệu cao nhất: NVL, Sản phẩm, Công thức, dữ liệu bán hàng không bao giờ dùng chung giữa 2 thương hiệu.
_Avoid_: Brand, nhãn hàng

**Cửa hàng**:
Một điểm bán, thuộc đúng 1 Thương hiệu. Có Tồn Kho Dự Trữ + Tồn Quầy Bar riêng; dùng chung danh mục NVL/Sản phẩm/Công thức của thương hiệu mình.
