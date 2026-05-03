import { pipeline, env } from '@xenova/transformers';

// Tắt local models để tránh lỗi Vite 404 HTML
env.allowLocalModels = false;

class TranslatorPipeline {
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      this.instance = pipeline('translation', 'Xenova/nllb-200-distilled-600M', { progress_callback });
    }
    return this.instance;
  }
}

self.addEventListener('message', async (event) => {
  const { id, text } = event.data;
  
  if (!text) return;

  try {
    // Tải mô hình dịch thuật NLLB
    const translator = await TranslatorPipeline.getInstance((x) => {
      self.postMessage({ status: 'progress', data: x });
    });

    // Thực hiện dịch
    const output = await translator(text, {
      src_lang: 'jpn_Jpan',
      tgt_lang: 'vie_Latn',
    });
    
    // Gửi kết quả về kèm theo ID của câu
    self.postMessage({
      status: 'complete',
      id: id,
      translation: output[0].translation_text
    });

  } catch (error) {
    self.postMessage({ status: 'error', id: id, error: error.message });
  }
});
