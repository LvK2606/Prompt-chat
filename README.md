# PromptHub — Thư viện prompt AI tiếng Việt

PromptHub là website thư viện prompt AI xây dựng cho repository **LvK2606/Prompt-chat**. Giao diện tiếng Việt, responsive, không cần tài khoản hoặc API key.

## Chức năng

- 36 prompt mẫu có nội dung thực tế trong 9 nhóm: Viết lách, Lập trình, Marketing, Thiết kế, Học tập, Kinh doanh, Sáng tạo, Năng suất và AI nâng cao.
- Tìm kiếm không phân biệt dấu tiếng Việt (Ctrl/Cmd + K), lọc theo danh mục, sắp xếp và xem chi tiết.
- Sao chép prompt chỉ một click, tải nội dung từng prompt (.txt), đánh dấu yêu thích.
- Thêm, chỉnh sửa, xóa prompt cá nhân; xuất/nhập bản sao lưu JSON.
- Giao diện sáng/tối; mobile responsive, hỗ trợ bàn phím và nhãn accessibility.
- Không thu thập thông tin người dùng; không cần backend để sử dụng.

## Sử dụng và chạy cục bộ

Đây là website tĩnh gồm `index.html`, `styles.css`, `prompts.js`, `app.js`, `favicon.svg`.

Có thể dùng bất kỳ static server nào, ví dụ:

```bash
npx serve .
# hoặc
python3 -m http.server 4173
```

Truy cập localhost qua địa chỉ do server cung cấp.

## Thêm prompt công khai

Chỉnh mảng `window.PROMPT_SEED` trong `prompts.js`. Mỗi mục cần các trường: `id`, `title`, `summary`, `content`, `category`, `tags`, `model`. Danh mục khai báo trong `window.PROMPT_CATEGORIES`.

## Dữ liệu và giới hạn hiện tại

- 36 prompt là **bộ prompt tuyển chọn ban đầu**, không phải toàn bộ prompt có trên Internet.
- Prompt người dùng tạo và danh sách yêu thích được lưu vào **localStorage trên chính trình duyệt hiện tại**, không tự đồng bộ qua điện thoại/thiết bị khác.
- File JSON sao lưu cho phép mang dữ liệu giữa các trình duyệt; nên giữ file riêng tư nếu chứa prompt nhạy cảm.
- Website hiện không có tài khoản, database, duyệt nội dung do cộng đồng gửi hay chức năng đồng bộ nhiều người dùng. Muốn mở thành nền tảng cộng đồng cần thêm backend, auth và kiểm duyệt.

## Triển khai Vercel

Kết nối repo GitHub với Vercel, framework **Other** (website tĩnh), root directory `./`. Vercel tự triển khai từ nhánh chính khi push; không yêu cầu environment variables.

## Bảo mật

- Văn bản nhập từ người dùng luôn được escape khi chèn vào HTML, và nội dung prompt hiển thị bằng `textContent`.
- Nhập JSON chỉ chấp nhận file sao lưu PromptHub và giới hạn kích thước/độ dài.
- Không đưa API key, mật khẩu, thông tin cá nhân vào prompt công khai.

MIT-style educational starter; nội dung mẫu có thể tùy chỉnh cho nhu cầu sử dụng.


## Community v2 (đang phát triển)

- Neon Postgres (Singapore) dùng lưu prompt và bookmark theo tài khoản.
- Neon Auth (Better Auth) cung cấp đăng ký / đăng nhập email + mật khẩu. Đường dẫn `/api/auth/*` được Vercel reverse proxy cùng origin.
- `api/community.js` kiểm tra session với Neon Auth qua cookie server-side trước khi đọc/ghi dữ liệu riêng tư.
- Mặc định prompt riêng tư; người dùng chủ động gửi duyệt, chỉ prompt đã duyệt mới hiển thị ở thư viện công cộng.
- Trang kiểm duyệt chỉ hiện với role `admin` hoặc `moderator`; quyền được kiểm tra lại trong API.
- Một lần sau khi đăng nhập, ứng dụng tự chuyển prompt và dấu yêu thích cũ trong trình duyệt sang tài khoản (không tự xóa dữ liệu cũ).
- Người dùng chưa đăng nhập vẫn xem bộ 36 prompt mẫu và có thể lưu dữ liệu cục bộ.

### Thiết lập quyền quản trị (thao tác thủ công sau khi chủ sở hữu đăng ký)

Trong Neon SQL Editor, thay `EMAIL_CUA_BAN` bằng đúng email tài khoản đã đăng ký:

```sql
INSERT INTO community_roles (user_id, role)
SELECT id, 'admin' FROM neon_auth."user" WHERE email = 'EMAIL_CUA_BAN'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

**Không có mật khẩu admin mặc định, không tự cấp admin cho người đăng ký đầu tiên.** Cài `DATABASE_URL` và `NEON_AUTH_URL` trong Vercel environment; không đưa connection string lên GitHub. Với Neon Auth, thiết lập domain tin cậy là `https://prompt-chat.vercel.app`.
