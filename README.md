# Live Translator

Live Translator là một ứng dụng web cung cấp tính năng nhận diện giọng nói và dịch thuật phụ đề theo thời gian thực (Real-time Subtitles), tập trung vào việc dịch từ **tiếng Nhật sang tiếng Việt**. Ứng dụng được thiết kế đặc biệt để hỗ trợ các cuộc họp trên Discord, hội thảo trực tuyến, hoặc xem video không có sẵn phụ đề.

## 🌟 Tính năng nổi bật

- **Speech-to-Text (Nhận diện giọng nói) chính xác:** Thay thế Web Speech API mặc định bằng mô hình AI mạnh mẽ **Whisper** (thông qua Transformers.js), giúp nhận diện tiếng Nhật với độ chính xác cực cao.
- **Dịch thuật thời gian thực:** Sử dụng mô hình **NLLB** (No Language Left Behind) để dịch trực tiếp ngữ cảnh từ tiếng Nhật sang tiếng Việt một cách mượt mà.
- **Local-first & Quyền riêng tư (Privacy-focused):** Mọi quá trình nhận diện và dịch thuật được thực hiện **100% trên trình duyệt (client-side)**. Dữ liệu âm thanh của bạn không bao giờ bị gửi lên các máy chủ bên thứ ba.
- **Thu âm hệ thống (System Audio Capture):** Hỗ trợ chụp âm thanh trực tiếp từ tab hoặc hệ thống (Screen/Tab Share), loại bỏ tạp âm và khắc phục những hạn chế của việc thu âm qua microphone thông thường.

## 🛠️ Công nghệ sử dụng

- **Frontend:** React 19, Vite.
- **AI & Machine Learning:** [@xenova/transformers](https://www.npmjs.com/package/@xenova/transformers) (Chạy các mô hình NLP trực tiếp trên trình duyệt qua WebAssembly).
- **Mô hình AI:** Whisper (Speech-to-text) và NLLB (Machine Translation).

## 🚀 Hướng dẫn cài đặt và sử dụng

### 1. Yêu cầu
- Đã cài đặt [Node.js](https://nodejs.org/).
- Trình duyệt hiện đại hỗ trợ WebAssembly và MediaDevices/Screen Capture API (Google Chrome, Microsoft Edge, v.v.).

### 2. Cài đặt dự án
Clone repository về máy và di chuyển vào thư mục dự án:
```bash
git clone <repository-url>
cd live-translator
```

Cài đặt các gói phụ thuộc (dependencies):
```bash
npm install
```

### 3. Khởi chạy môi trường phát triển (Development)
Chạy lệnh sau để khởi động ứng dụng:
```bash
npm run dev
```
Mở trình duyệt và truy cập vào địa chỉ hiển thị trên terminal (thường là `http://localhost:5173`).

### 💡 Lưu ý quan trọng
- **Tải mô hình AI lần đầu:** Trong lần chạy đầu tiên, Transformers.js sẽ tự động tải các mô hình AI (Whisper và NLLB) về máy và lưu vào cache của trình duyệt. Quá trình này có thể mất một chút thời gian tùy thuộc vào tốc độ mạng của bạn. Các lần sử dụng sau sẽ nhanh hơn rất nhiều vì mô hình đã được lưu sẵn (cached).
- Để thu âm thanh hệ thống (như âm thanh từ Discord), khi trình duyệt hiện hộp thoại yêu cầu quyền chia sẻ màn hình/âm thanh, hãy nhớ chọn **"Share tab"** hoặc **"Share system audio"** tùy theo trình duyệt.

## 📄 Giấy phép (License)

Dự án này được tạo ra cho mục đích sử dụng cá nhân và phát triển công cụ AI dịch thuật thời gian thực.
