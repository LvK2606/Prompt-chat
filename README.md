# PromptHub — Thư viện prompt AI tiếng Việt

PromptHub là website thư viện prompt AI xây dựng cho repository **LvK2606/Prompt-chat**. Giao diện tiếng Việt, responsive, không cần tài khoản hoặc API key.

## Chức năng

- 140 prompt mẫu có nội dung thực tế trong 11 nhóm: Viết lách, Lập trình, Marketing, Thiết kế, Học tập, Kinh doanh, Sáng tạo, Năng suất, AI nâng cao, Vibe Coding và Clean TV.
- Tìm kiếm không phân biệt dấu tiếng Việt (Ctrl/Cmd + K), lọc theo danh mục, sắp xếp và xem chi tiết.
- Sao chép prompt chỉ một click, tải nội dung từng prompt (.txt), đánh dấu yêu thích.
- Thêm, chỉnh sửa, xóa prompt cá nhân; xuất/nhập bản sao lưu JSON.
- Giao diện sáng/tối; mobile responsive, hỗ trợ bàn phím và nhãn accessibility.
- Khách chưa đăng nhập vẫn xem và lưu prompt cục bộ; khi đăng nhập, dữ liệu cá nhân và email tài khoản được lưu và xử lý qua Neon Auth + PostgreSQL.

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


## Bản bổ sung: 64 prompt theo xu hướng diễn đàn (ngày 07/11/2026)

- Tổng cộng **100 prompt**: 36 mẫu trước đó và 64 mẫu mới ở 9 danh mục.
- 64 mẫu được **viết mới bằng tiếng Việt**, tham khảo chủ đề thảo luận trên Reddit (r/ChatGPT, r/ChatGPTPromptGenius, r/PromptEngineering, r/Resume, r/promptingmagic) và bộ sưu tập [f/prompts.chat](https://github.com/f/prompts.chat).
- Mỗi prompt xu hướng có `sourceName` và `sourceUrl` để xem nguồn ý tưởng. Đây là **nguồn tham khảo chủ đề**, không phải tuyên bố sao chép hay lấy nguyên văn prompt của tác giả.
- **Xu hướng** có nghĩa là chủ đề đáng quan tâm theo mẫu bài viết được tham khảo tính đến ngày biên soạn; **không** phải bảng xếp hạng lượt vote tự động, không đại diện tất cả diễn đàn và không được bảo đảm hiệu quả trong mọi trường hợp.
- Phần giao diện có mục `Xu hướng cộng đồng` trong sidebar, trưng bày 6 gợi ý nổi bật, danh sách 64 mục, trang chi tiết nguồn tham khảo và nút **Xem thêm prompt** (24 thẻ/lần) để nhẹ hơn trên điện thoại.
- Bộ 64 prompt được lưu trong `trending-prompts-{1..4}.js`, nhập sau `prompts.js`. IDs có dạng `hot-001` đến `hot-064`, không trùng dữ liệu cũ; bookmark IDs `hot-...` được API hỗ trợ khi đồng bộ tài khoản.
- Kiểm thử trình duyệt: `npm run test:responsive`, gồm kiểm tra mobile và danh mục 100 prompt.

**Quyền tác giả:** các mẫu mới không chép nguyên văn Reddit. Nếu bổ sung prompt trực tiếp từ bộ sưu tập bên thứ ba sau này, phải kiểm tra điều khoản/giấy phép riêng của nguồn đó.


## Facebook Vibe Coding (cập nhật ngày 07/11/2026)

- 24 mẫu prompt tiếng Việt **viết mới** trong danh mục riêng `Vibe Coding`, đánh mã `fbv-001`…`fbv-024`.
- Tổng kho dữ liệu trước đợt Clean TV: **124 prompt / 10 danh mục** (36 gốc + 64 cộng đồng + 24 Vibe Coding).
- Nguồn **bài viết Facebook có thể kiểm chứng thông qua trang lưu trữ công khai**:
  1. 28/10/2026: lỗi code chạy được trên máy mình nhưng lỗi máy khác (322 bình luận, theo kho lưu trữ).
     https://vibecodingislife.com/archive/why-does-code-work-on-my-computer-but-fail-on-another
  2. 31/10/2026: lập trình cơ bản có còn cần thiết khi AI viết code (282 bình luận, 107 tương tác).
     https://vibecodingislife.com/archive/is-a-computer-science-degree-useless-now
  3. 09/10/2026: tự xây agent giống Claude hay huấn luyện model mới (116 bình luận, 57 tương tác).
     https://vibecodingislife.com/archive/can-you-build-your-own-claude
- Nguồn tổng quan **cộng đồng Facebook**: https://vibecodingislife.com/community — mô tả chủ đề builder, demo, feedback và prompt; **không xác nhận từng app là bài viral**.
- Nguồn **xu hướng đối chiếu từ Reddit**, KHÔNG phải số liệu Facebook:
  https://vibeheatmap.com/week/2026-W44/
- Nguồn hướng dẫn cấu trúc prompt, KHÔNG phải số liệu Facebook:
  https://getvibekits.com/rules/vibe-coding-prompts/
- Vì nội dung bài đăng Facebook trực tiếp có thể yêu cầu đăng nhập, dữ kiện về từng bài viết được dẫn qua **archive công khai của đơn vị quản lý nhóm**, không khẳng định tự truy cập tất cả bài Facebook.
- Các mẫu mới **không phải văn bản trích từ Facebook** và không sử dụng dữ liệu bí mật của thành viên; mỗi prompt có `sourceName`, `sourceUrl`, `sourcePlatform` xác định kiểu nguồn và có cảnh báo khi chỉ là chủ đề mở rộng.
- Giao diện: menu "Vibe Coding" (24 mẫu), danh mục lọc nhanh, khu vực giới thiệu 6 mẫu, modal trích nguồn và lưu yêu thích trên tài khoản. Backend cho phép `fbv-###` trong dấu yêu thích đã đăng nhập; `vibe` được cho phép trong danh mục prompt do người dùng tự tạo.
- Chạy `npm run test:responsive` để kiểm thử số lượng, nguồn, thao tác mobile, tìm kiếm và hồi quy của 100 mẫu trước đó.

**Giới hạn:** Không thể đưa ra bảng "hot nhất Facebook" toàn diện theo reaction/comment nếu không có dữ liệu chính thức từ từng nhóm. Đây là bộ sưu tập có kiểm chứng ở mức nguồn công khai, một số chủ đề được chọn biên tập từ nền tảng khác; không xếp hạng bằng số liệu chưa xác minh.

## CleanYourTV bằng Claude Code — 07/11/2026

**Tổng thư viện hiện tại: 140 prompt / 11 danh mục.** Bổ sung 16 mẫu tiếng Việt biên soạn riêng mã `ctv-001`…`ctv-016`, thuộc danh mục `smarttv` / **Clean TV**. Đây là hướng dẫn và prompt, KHÔNG có AI nào trên website được kết nối trực tiếp tới TV.

- **Nguồn chính thức:** https://github.com/Gathin23/cleanyourtv ; prompt nguyên gốc của tác giả: https://github.com/Gathin23/cleanyourtv/blob/main/PROMPT.md ; quy tắc coding agent: https://github.com/Gathin23/cleanyourtv/blob/main/AGENTS.md .
- **Nguồn cộng đồng:** Reddit /r/ClaudeAI, /r/coolgithubprojects, /r/GoogleTV, /r/vibecoding; liên kết cụ thể nằm trong `sourceName` và `sourceUrl` của từng prompt.
- **Tổng hợp nguồn:** xem `docs/CLEAN_TV_SOURCES.md`.
- **Facebook:** đã tìm bài công khai nhưng **chưa xác minh được link bài Facebook cụ thể**, nên không ngụy tạo nguồn hoặc lượt tương tác Facebook. Đây là nguồn GitHub/Reddit đã đối chiếu.
- Mẫu `ctv-001` là lời hướng dẫn sử dụng **PROMPT.md chính thức**; không sao chép nguyên văn 20.000+ ký tự của tác giả vào PromptHub. Các mẫu còn lại viết mới, có nhãn nguồn là tài liệu chính thức hoặc thảo luận thành viên.
- **Tương thích:** chủ yếu Android TV / Google TV. Với Samsung Tizen, LG webOS, Roku, Hisense VIDAA hãy dùng hướng dẫn settings phù hợp; không chạy các công cụ ADB/launcher Android của dự án lên hệ điều hành khác.
- **An toàn:** phải sao lưu trước; chỉ vô hiệu hóa khi rõ gói và được chủ sở hữu đồng ý; không root/flash, không uninstall hàng loạt; luôn chuẩn bị restore script, bảo vệ Home, Input, HDMI, Wi-Fi, Cast và đóng network ADB khi xong. CleanYourTV là dự án bên thứ ba, việc sửa phần mềm TV có rủi ro; PromptHub không bảo đảm tương thích mọi model.
- **Giao diện:** khu vực `cleanTvSection` (6 gợi ý), menu sidebar `Clean TV với Claude` (16 prompt), nguồn trong modal, tìm kiếm, tải .txt, yêu thích cục bộ hoặc đồng bộ tài khoản. API cho phép ID `ctv-###` và category `smarttv`.
- **Tests:** `npm run test:responsive` chạy tất cả Playwright regression, gồm `tests/clean-tv.spec.cjs`.

