import { pipeline, env } from '@xenova/transformers';

// Tắt tính năng tìm model ở thư mục local (tránh lỗi Vite trả về file HTML thay vì JSON)
env.allowLocalModels = false;

class AIModelPipeline {
  static sttInstance = null;
  static translateInstance = null;

  static async getSTT(progress_callback = null) {
    if (this.sttInstance === null) {
      // Sử dụng Whisper-tiny cho tốc độ nhanh nhất
      this.sttInstance = pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', { progress_callback });
    }
    return this.sttInstance;
  }

  static async getTranslation(progress_callback = null) {
    if (this.translateInstance === null) {
      // Sử dụng NLLB-200 cho dịch thuật
      this.translateInstance = pipeline('translation', 'Xenova/nllb-200-distilled-600M', { progress_callback });
    }
    return this.translateInstance;
  }
}

self.addEventListener('message', async (event) => {
  const { type, audio } = event.data;
  
  // Chỉ nhận xử lý loại dữ liệu là audio Float32Array
  if (type !== 'audio' || !audio) return;

  try {
    const transcriber = await AIModelPipeline.getSTT((x) => {
      x.model = "Whisper (STT)";
      self.postMessage({ status: 'progress', data: x });
    });
    
    const translator = await AIModelPipeline.getTranslation((x) => {
      x.model = "NLLB (Translate)";
      self.postMessage({ status: 'progress', data: x });
    });

    self.postMessage({ status: 'processing' });
    
    // 1. Chạy Whisper (Chuyển đổi âm thanh Nhật sang Văn bản Nhật)
    const sttOutput = await transcriber(audio, {
      language: 'japanese', 
      task: 'transcribe'
    });
    
    const japaneseText = sttOutput.text.trim();
    if (!japaneseText) {
       self.postMessage({ status: 'complete', original: '', translation: '' });
       return;
    }

    // Gửi thông báo đang chuyển sang bước dịch
    self.postMessage({ status: 'translating', original: japaneseText });

    // 2. Chạy NLLB (Dịch văn bản Tiếng Nhật sang Tiếng Việt)
    const translationOutput = await translator(japaneseText, {
      src_lang: 'jpn_Jpan',
      tgt_lang: 'vie_Latn',
    });

    // 3. Trả kết quả cuối cùng
    self.postMessage({
      status: 'complete',
      original: japaneseText,
      translation: translationOutput[0].translation_text
    });

  } catch (error) {
    self.postMessage({ status: 'error', error: error.message });
  }
});
