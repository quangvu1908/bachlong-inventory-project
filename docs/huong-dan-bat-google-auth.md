# Hướng dẫn bật đăng nhập Google (GĐ 2)

Việc này có 2 phần, làm trên 2 trang web khác nhau: **Google Cloud Console** (tạo "giấy phép" OAuth) và **Supabase Dashboard** (dán giấy phép đó vào, cho phép app gọi tới).

Tổng cộng khoảng 10 phút. Không cần sửa code — phần code đã xong và đã xác nhận chạy đúng, chỉ đang chờ bước này.

---

## Phần 1 — Tạo OAuth Client trên Google Cloud Console

### Bước 1: Tạo project (nếu chưa có)

1. Mở [console.cloud.google.com](https://console.cloud.google.com)
2. Góc trên bên trái, bấm vào tên project hiện tại → **New Project**
3. Đặt tên, ví dụ `BachLong Inventory` → **Create**

### Bước 2: Cấu hình màn hình đồng ý (OAuth consent screen)

1. Trong menu bên trái: **APIs & Services** → **OAuth consent screen**
2. Chọn **User Type: External** → **Create**
3. Điền:
   - **App name**: `BachLong Inventory`
   - **User support email**: email của bạn
   - **Developer contact information**: email của bạn
4. Các bước tiếp theo (Scopes, Test users) — bấm **Save and Continue** qua hết, không cần điền thêm gì
5. Ở bước cuối, bấm **Back to Dashboard**

> **Lưu ý:** Ở trạng thái "Testing", chỉ những email bạn thêm vào mục **Test users** mới đăng nhập được. Nếu muốn **ai cũng đăng nhập được** (toàn bộ nhân viên BachLong), vào **OAuth consent screen** → bấm **Publish App**. Không cần Google duyệt lại vì app chỉ xin quyền cơ bản (email, tên, ảnh).

### Bước 3: Tạo OAuth Client ID

1. Menu bên trái: **APIs & Services** → **Credentials**
2. Bấm **+ Create Credentials** → **OAuth client ID**
3. **Application type**: chọn **Web application**
4. **Name**: `BachLong Inventory Web`
5. Mục **Authorized redirect URIs** → bấm **+ Add URI** → dán **chính xác** dòng này:

   ```
   https://zuyhpvwrgsiyalsrigay.supabase.co/auth/v1/callback
   ```

   > Đây là URL của Supabase, không phải của app bạn — vì luồng đăng nhập đi qua Supabase trước, Supabase xử lý xong mới đưa người dùng về lại app. Không cần thêm URL nào khác ở đây.

6. Bấm **Create**
7. Một popup hiện ra với **Client ID** và **Client Secret** — giữ tab này mở, bạn sẽ cần dán 2 giá trị này ở Phần 2

---

## Phần 2 — Bật Google provider trên Supabase

### Bước 1: Dán Client ID / Secret

1. Mở [supabase.com/dashboard/project/zuyhpvwrgsiyalsrigay](https://supabase.com/dashboard/project/zuyhpvwrgsiyalsrigay)
2. Menu trái: **Authentication** → **Sign In / Providers**
3. Tìm **Google** trong danh sách → bấm vào để mở rộng
4. Bật công tắc **Enable Sign in with Google**
5. Dán **Client ID** và **Client Secret** từ Phần 1 vào 2 ô tương ứng
6. Bấm **Save**

### Bước 2: Khai báo các URL được phép chuyển hướng về

1. Vẫn trong **Authentication**, vào **URL Configuration**
2. **Site URL**: điền

   ```
   https://quangvu1908.github.io/bachlong-inventory-project/
   ```

3. Mục **Redirect URLs** → bấm **Add URL**, thêm lần lượt **2 dòng** sau (mỗi dòng một lần Add):

   ```
   https://quangvu1908.github.io/bachlong-inventory-project/**
   http://localhost:3000/**
   ```

   Dòng đầu cho bản thật trên GitHub Pages, dòng sau cho lúc tôi chạy thử trên máy bạn lúc phát triển.

4. Bấm **Save**

---

## Kiểm tra

1. Mở [quangvu1908.github.io/bachlong-inventory-project](https://quangvu1908.github.io/bachlong-inventory-project/)
2. Bấm **Đăng nhập bằng Google**
3. Nếu thấy màn hình Google hỏi chọn tài khoản (thay vì báo lỗi như trước) — nghĩa là đã bật thành công
4. Đăng nhập xong, bạn sẽ thấy màn hình **"Tài khoản đang chờ duyệt"** — đây là đúng thiết kế, vì tài khoản mới chưa có vai trò

Báo tôi ngay sau bước 4 — tôi sẽ vào database gán tài khoản bạn làm **Admin** đầu tiên.

---

## Các lỗi thường gặp

| Thông báo lỗi | Nguyên nhân | Cách sửa |
|---|---|---|
| `redirect_uri_mismatch` | URI ở Phần 1 Bước 3.5 gõ sai hoặc thiếu | So lại từng ký tự với URL Supabase callback ở trên, không được có khoảng trắng thừa |
| `Unsupported provider: provider is not enabled` | Chưa bật công tắc ở Phần 2 Bước 1, hoặc chưa Save | Quay lại Phần 2 Bước 1 |
| Đăng nhập xong bị văng về trang login, không vào được app | Thiếu URL trong **Redirect URLs** ở Phần 2 Bước 2 | Kiểm tra lại đúng 2 dòng, có dấu `**` ở cuối |
| Google báo "App chưa xác minh" / chặn không cho đăng nhập | App đang ở chế độ **Testing** và email đó không có trong Test users | Thêm email vào Test users, hoặc Publish App như lưu ý ở Phần 1 Bước 2 |
