# 🎙️ Discord Live Subtitle (JA -> VI)

Ứng dụng web dịch thuật trực tiếp (Real-time Translation) siêu tốc độ, được thiết kế chuyên biệt để hỗ trợ các cuộc họp tiếng Nhật trên Discord, Google Meet, hoặc xem video YouTube.

Ứng dụng lắng nghe âm thanh hệ thống, tự động nhận diện giọng nói tiếng Nhật và hiển thị bản dịch tiếng Việt gần như ngay lập tức với giao diện chia đôi màn hình chuyên nghiệp (Split UI).

## ✨ Tính năng nổi bật

- **Tốc độ cực nhanh (Real-time):** Sử dụng `Web Speech API` mặc định của Chrome giúp chữ tiếng Nhật xuất hiện ngay lập tức theo tốc độ nói, không có độ trễ.
- **Dịch thuật chính xác & Miễn phí:** Tích hợp trực tiếp với API mở của Google Translate, mang lại bản dịch tiếng Việt chuẩn xác chỉ trong ~0.2 giây mà không cần cấu hình API Key rườm rà.
- **Giao diện Split UI (Chia đôi màn hình):**
  - **Cột Trái (Live Caption):** Hiển thị duy nhất câu đang nói với kích thước lớn, tập trung tối đa.
  - **Cột Phải (Meeting Transcript):** Tự động lưu trữ và hiển thị toàn bộ lịch sử các câu đã nói kèm bản dịch (như một cuốn sổ tay ghi chú), có thanh cuộn mượt mà.
- **Premium Dark Theme:** Giao diện tối hiện đại, bảo vệ mắt và mang lại cảm giác chuyên nghiệp.

## ⚙️ Yêu cầu hệ thống (Rất Quan Trọng)

Vì `Web Speech API` của trình duyệt mặc định **chỉ lắng nghe từ thiết bị Microphone**, nó không thể tự nghe được âm thanh phát ra từ tab YouTube hay phần mềm Discord. Bạn **bắt buộc** phải sử dụng tính năng **Stereo Mix** của Windows để chuyển đổi âm thanh hệ thống thành tín hiệu Micro.

**Cách bật Stereo Mix trên Windows:**
1. Chuột phải vào biểu tượng chiếc Loa ở góc dưới cùng bên phải màn hình (Taskbar) -> Chọn **Sound settings** (Cài đặt âm thanh).
2. Cuộn xuống tìm và chọn **More sound settings** (đối với Windows 11) hoặc tab **Recording** (đối với Windows 10).
3. Tại tab **Recording**, chuột phải vào vùng trống -> Tích chọn **Show Disabled Devices**.
4. Bạn sẽ thấy thiết bị tên **Stereo Mix** (hoặc Wave Out Mix). Chuột phải vào nó -> **Enable**.
5. Chuột phải vào Stereo Mix lần nữa -> **Set as Default Device**.
6. Khởi động lại trình duyệt Chrome/Edge của bạn.

*(Lưu ý: Nếu không muốn dùng Stereo Mix, bạn phải mở âm thanh máy tính ra loa ngoài đủ lớn để Micro vật lý của máy tính thu lại được).*

## 🚀 Hướng dẫn Cài đặt & Chạy ứng dụng

Dự án được xây dựng bằng Vite + ReactJS.

```bash
# 1. Cài đặt các thư viện cần thiết
npm install

# 2. Khởi chạy máy chủ phát triển (Development Server)
npm run dev
```

Sau khi chạy lệnh trên, hãy mở trình duyệt (Khuyên dùng **Google Chrome** để Web Speech API hoạt động tốt nhất) và truy cập vào đường dẫn `http://localhost:5173`.

## 🖥️ Cách sử dụng

1. Đảm bảo bạn đã cấu hình xong **Stereo Mix** làm Microphone mặc định.
2. Mở ứng dụng trên trình duyệt.
3. Bấm nút **"Bắt đầu nghe"** ở cột bên trái.
4. Trình duyệt sẽ yêu cầu cấp quyền Microphone, hãy chọn **Allow (Cho phép)**.
5. Mở phần mềm Discord hoặc một tab YouTube tiếng Nhật và bắt đầu phát âm thanh.
6. Tận hưởng phụ đề trực tiếp trên màn hình!

## 🛠️ Công nghệ sử dụng
- **Frontend:** ReactJS, Vite
- **Styling:** Vanilla CSS (CSS Grid, Flexbox, Animations)
- **Speech-To-Text:** `window.SpeechRecognition` (Web Speech API)
- **Translation:** Fetch API tới endpoint `translate.googleapis.com`

---
*Developed with 💖 by Antigravity AI*
