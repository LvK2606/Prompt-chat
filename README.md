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
