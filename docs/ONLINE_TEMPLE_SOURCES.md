# Trend đi chùa online — nguồn và nguyên tắc biên soạn

*Ngày rà soát: 07/11/2026. Mục tiêu: 16 prompt do PromptHub viết mới để hướng dẫn AI tạo trải nghiệm website 3D, không phải văn bản prompt của các tác giả Sansa hay Niệm Phật Online.*

## Hai sản phẩm gốc và sự khác biệt

- **[Sansa — sansatemple.com](https://sansatemple.com/)**: chùa ảo Hàn Quốc, thường được mô tả là tối giản, không có chat, chú trọng ngồi yên, chắp tay, lần hạt, tiếng chuông và cảm giác hiện diện cùng người khác. [Yonhap (31/10/2026)](https://www.yna.co.kr/view/AKR20261031034300005) phỏng vấn nhà phát triển Park Jin-won, nói về động lực dùng AI-assisted coding tạo sản phẩm. [Korea Times (03/11/2026)](https://www.koreatimes.co.kr/southkorea/20261103/ai-built-virtual-buddhist-temple-draws-1-mil-visitors-in-less-than-a-week) ghi nhận áp lực mở rộng khả năng phục vụ khi lượng truy cập tăng cao.
- **Niệm Phật Online (Việt Nam)**: trải nghiệm chùa 3D trên web, tạo nhân vật, đi vào sân/chính điện, tương tác mô phỏng, có nhiệm vụ và vật phẩm game. [Tuổi Trẻ (02/11/2026)](https://news.tuoitre.vn/virtual-temples-go-viral-in-south-korea-vietnam-what-sets-the-games-apart-103261102090614184.htm), [Znews (03/11/2026)](https://znews.vn/gan-3000-nguoi-len-web-di-chua-online-luc-23h-post1693824.html), [FPT (03/11/2026)](https://fpt.vn/tin-tuc/game-di-chua-online-15777.html), [Sforum (01/11/2026)](https://cellphones.com.vn/sforum/niem-phat-online). Những con số người online trên báo chỉ phản ánh thời điểm ghi nhận, không phải lượng người dùng hiện tại.
- Nguồn về quy trình vibe coding tạo chùa ảo: [VnExpress (03/11/2026)](https://vnexpress.net/tac-gia-chua-online-khuay-dao-mang-voi-30-phut-lap-trinh-ai-5140379.html). Dù có tiêu đề '30 phút', không được diễn giải thành cam kết rằng một sản phẩm đa người dùng vận hành production có thể hoàn thành với chất lượng tương tự trong 30 phút.
- Nguồn về rủi ro website giả mạo, quyền riêng tư và thông tin cá nhân: [VOV (03/11/2026)](https://vov.vn/xa-hoi/di-chua-online-thu-hut-nhieu-nguoi-dung-mang-chuyen-gia-canh-bao-post1346831.vov), [VTC News (03/11/2026)](https://vtcnews.vn/chuyen-gia-chi-ra-nguy-co-mat-du-lieu-ca-nhan-tu-tra-luu-di-chua-online-ar1048882.html).

## Bộ prompt 16 mẫu

| ID | Chủ đề | Nhóm bài học |
| --- | --- | --- |
| tem-001 | Xây website chùa ảo 3D Việt Nam từ A đến Z | React/Three.js MVP |
| tem-002 | Không khí tĩnh lặng theo nguyên lý Sansa | Thiết kế trải nghiệm |
| tem-003 | Chùa ảo nhiều người không chat | WebSocket/presence |
| tem-004 | Hoạt ảnh chắp tay/cúi lạy/ngồi thiền | Rig + animation |
| tem-005 | Kiến trúc Việt 3D | Blender + PBR + LOD |
| tem-006 | Avatar ẩn danh và biệt danh | UX và bảo vệ dữ liệu |
| tem-007 | Thả hoa đăng/dâng hoa ảo | Particle animation |
| tem-008 | Chuông và tràng hạt mô phỏng | WebAudio + accessibility |
| tem-009 | Không gian tĩnh tâm 5 phút | Mindfulness không áp lực |
| tem-010 | Tối ưu mobile | FPS, loading, WebGL fallback |
| tem-011 | Nhiều phòng và scale server | Realtime và tải cao |
| tem-012 | Tour tham quan 360° | Giáo dục di sản và bản quyền |
| tem-013 | Kiểm toán bảo mật, chống giả mạo | Security và privacy |
| tem-014 | Storyboard TikTok/Reels | Truyền thông minh bạch |
| tem-015 | Prompt giao Codex phát triển theo phase | GitHub + PR + test |
| tem-016 | Kiểm thử E2E chùa 3D | QA mobile + privacy |

## Nguyên tắc bắt buộc

1. Không sao chép hình ảnh, mô hình, mã nguồn, nội dung/tên thương hiệu riêng của Sansa hoặc Niệm Phật Online khi chưa có quyền; chỉ tham khảo công năng và thiết kế độc lập.
2. Chỉ sử dụng avatar hư cấu; không mạo danh bất kỳ chùa/tu sĩ/tổ chức cụ thể nào. Đặc biệt nếu làm tour 360 chùa có thật cần có chấp thuận sử dụng hình ảnh.
3. Không bán vật phẩm dưới những lời hứa linh ứng, phước báu, tăng công đức hoặc giải hạn. Điểm trong game, nếu xuất hiện, chỉ là cơ chế trò chơi, **không phải công đức ngoài đời**.
4. Ưu tiên trải nghiệm ẩn danh, hạn chế email/định danh thật, không yêu cầu nạp tiền/đóng góp bắt buộc và có cơ chế xóa dữ liệu.
5. Website là hoạt động mô phỏng hoặc tìm hiểu văn hóa, không thay thế sinh hoạt tôn giáo ngoài đời thực. Cần tôn trọng nhiều quan điểm và mục đích sử dụng khác nhau.
6. Các prompt này **chưa được dùng để triển khai một game chùa ảo mới**. PromptHub chỉ phân phối văn bản; việc tải, tạo mã và chạy thử là công việc riêng.

## Tính minh bạch của nguồn

Trong mỗi prompt có `sourceName`, `sourceUrl`, `sourcePlatform`, `sourceType`. Đây là **nguồn chứng minh chủ đề đang được thảo luận công khai**, không phải bằng chứng rằng prompt trong thư viện là nguyên tác của một bài viết. Chưa có bài Facebook công khai được xác minh trực tiếp trong đợt khảo sát này, nên không gắn nhãn "prompt lấy từ Facebook".

**Ngày rà soát:** 07/11/2026.
