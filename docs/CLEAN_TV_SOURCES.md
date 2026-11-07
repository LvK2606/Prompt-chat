# Nguồn tham khảo: Clean TV bằng Claude Code

**Biên tập:** 07/11/2026 · **Phạm vi:** chỉ các nguồn công khai, có liên kết kiểm chứng được.
Đây không phải danh sách "tất cả prompt đang hot trên Facebook". Các trang Facebook và nhóm có thể giới hạn xem bài; đợt thu thập này **không xác minh được bài đăng Facebook cụ thể**, nên không gán tác giả/lượt xem Facebook giả cho prompt.

## Prompt gốc và tài liệu chính thức

| Nguồn | Nội dung | Vai trò trong thư viện |
| --- | --- | --- |
| [CleanYourTV GitHub](https://github.com/Gathin23/cleanyourtv) | Mã nguồn, phạm vi thiết bị, hướng dẫn dọn và phục hồi; MIT | Tài liệu chủ đạo |
| [PROMPT.md chính thức](https://github.com/Gathin23/cleanyourtv/blob/main/PROMPT.md) | Toàn bộ prompt tác giả dành cho Claude Code/coding agent | `ctv-001` trỏ đến prompt gốc, KHÔNG chép nguyên văn |
| [AGENTS.md](https://github.com/Gathin23/cleanyourtv/blob/main/AGENTS.md) | Những điều cấm, guardrail, backup và khôi phục | `ctv-003`, `ctv-012` |
| [Restore guide](https://github.com/Gathin23/cleanyourtv/blob/main/docs/restore.md) | Khôi phục launcher, gói đã vô hiệu hóa | `ctv-004`, `ctv-013` |
| [TV model examples](https://github.com/Gathin23/cleanyourtv/blob/main/examples/README.md) | Cấu hình theo model/firmware, không dùng chéo bừa bãi | `ctv-008` |
| [Themes guide](https://github.com/Gathin23/cleanyourtv/blob/main/themes/README.md) | Hình nền, dock, giao diện theme | `ctv-007` |
| [FAQ](https://github.com/Gathin23/cleanyourtv/blob/main/docs/faq.md) | ADB, privacy, DNS và giới hạn | Phần cảnh báo an toàn |

## Diễn đàn cộng đồng (đã kiểm tra công khai)

- [r/ClaudeAI — Tác giả nói về các guardrail](https://www.reddit.com/r/ClaudeAI/comments/1xbrzo0/i_gave_claude_code_my_parents_tv_model_number_it/) · 21/10/2026. Tác giả nhấn mạnh backup, chỉ disable, giữ input/home/wi-fi, hỏi trước mỗi thay đổi.
- [r/coolgithubprojects — Chia sẻ prompt + CleanYourTV](https://www.reddit.com/r/coolgithubprojects/comments/1xcjedm/cleanyourtv_one_prompt_for_your_ai_coding_agent/) · 22/10/2026. Thảo luận launcher, tùy biến và vấn đề khả năng tương thích.
- [r/GoogleTV — Người dùng chia sẻ tối ưu Sony TV](https://www.reddit.com/r/GoogleTV/comments/1xbcawv/claude_made_my_sony_tv_90_faster/) · 21/10/2026. **Số phần trăm là khẳng định cá nhân, không phải benchmark được kiểm nghiệm.**
- [r/vibecoding — Công cụ Tellyscope dùng trên Android](https://www.reddit.com/r/vibecoding/comments/1xg5ddy/built_an_android_tv_debloater_with_opus_55_it/) · 26/10/2026. Ví dụ công cụ độc lập do cộng đồng phát triển; không phải app chính thức của CleanYourTV.

## Phân loại 16 prompt đã biên soạn

- **Khởi đầu/khả năng tương thích**: `ctv-001`, `ctv-002`, `ctv-016`
- **Kiểm kê/backup/an toàn**: `ctv-003`, `ctv-004`, `ctv-005`, `ctv-008`
- **Launcher và trải nghiệm**: `ctv-006`, `ctv-007`, `ctv-009`
- **Không hỗ trợ Android ADB**: `ctv-010`
- **Kết nối và phục hồi**: `ctv-011`, `ctv-012`, `ctv-013`, `ctv-015`
- **Điện thoại, không laptop**: `ctv-014`

Nội dung prompt mới được biên soạn độc lập bằng tiếng Việt để giúp khám phá ý tưởng, không sao chép nguyên văn bài Reddit hoặc prompt dài của tác giả. Liên kết trong từng mục là tài liệu **tham khảo**, không phải bằng chứng cho mọi bước trong nội dung do PromptHub viết.

## Điều kiện an toàn bắt buộc

1. Chỉ thao tác trên thiết bị thuộc quyền sử dụng của bạn. Phải xác minh **OS và model**, không đoán chỉ từ tên hãng.
2. Với Samsung Tizen, LG webOS, Roku, VIDAA: **không áp dụng** lệnh CleanYourTV dành cho Android TV/Google TV; hướng dẫn dùng menu thiết bị ở [cleanyour.tv/not-android](https://cleanyour.tv/not-android).
3. Chỉ dùng bản nguồn chính thức, backup + đường phục hồi rõ ràng trước khi đổi trạng thái. Không root/flash/uninstall hệ thống; chỉ thao tác khi chủ TV chấp thuận.
4. Giữ lại HDMI, Live TV, remote, Bluetooth, Wi-Fi, Home, dịch vụ cập nhật và các dịch vụ nền chưa được xác minh.
5. Tắt và thu hồi quyền gỡ lỗi ADB sau khi xong; tránh để cổng ADB 5555 mở trên mạng.
6. Những kết quả như "nhanh hơn 90%" trên diễn đàn là trải nghiệm cá nhân, không phải thông số đã được bảo đảm.

**Giới hạn kỹ thuật:** PromptHub chỉ cung cấp **văn bản prompt**, không kết nối trực tiếp vào thiết bị, không chạy ADB và không đánh giá được an toàn của cấu hình cụ thể. Nếu không chắc chắn, hãy ưu tiên lựa chọn không thay đổi hệ thống.
