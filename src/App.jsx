import React, { useState, useEffect, useRef } from 'react';
import './index.css';

const App = () => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [modelProgress, setModelProgress] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const streamRef = useRef(null);
  const workerRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);

  useEffect(() => {
    // Khởi tạo Web Worker
    workerRef.current = new Worker(new URL('./worker.js', import.meta.url), {
      type: 'module'
    });

    const onMessageReceived = (e) => {
      switch (e.data.status) {
        case 'progress':
          setModelProgress(e.data.data);
          break;
        case 'processing':
          setIsProcessing(true);
          break;
        case 'translating':
          setIsProcessing(true);
          // Hiển thị chữ tiếng Nhật lên trước để User biết AI đã nghe xong
          if (e.data.original) setFinalText(e.data.original);
          break;
        case 'complete':
          if (e.data.original) {
             setFinalText(e.data.original);
             setTranslatedText(e.data.translation);
          }
          setIsProcessing(false);
          setModelProgress(null); 
          break;
        case 'error':
          setErrorMsg("Lỗi AI: " + e.data.error);
          setIsProcessing(false);
          break;
        default:
          break;
      }
    };

    workerRef.current.addEventListener('message', onMessageReceived);

    return () => {
      if (workerRef.current) workerRef.current.removeEventListener('message', onMessageReceived);
    };
  }, []);

  const sendAudioToWorker = (chunks) => {
    if (!chunks.length) return;
    
    // Gộp các mảnh Float32Array nhỏ thành một mảng dài hoàn chỉnh
    let totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    
    // Gửi sang Web Worker
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'audio', audio: merged });
    }
  };

  const startListening = async () => {
    try {
      setErrorMsg(''); setFinalText(''); setInterimText(''); setTranslatedText('');
      
      // Xin quyền lấy màn hình/tab âm thanh
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error("Không tìm thấy luồng âm thanh. Đảm bảo chọn 'Share tab/system audio'.");
      }

      streamRef.current = stream;

      // Khởi tạo Web Audio API chuẩn bị trích xuất dữ liệu âm thanh thô (Float32)
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext({ sampleRate: 16000 }); // Whisper yêu cầu 16kHz
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      // ScriptProcessorNode: Lấy từng đoạn nhỏ âm thanh để kiểm tra
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      let audioData = [];
      let isSpeaking = false;
      let silenceStart = Date.now();
      let speechStart = Date.now();
      
      // Cấu hình VAD (Nhận diện giọng nói cơ bản)
      const THRESHOLD = 0.01; // Ngưỡng âm lượng để phát hiện người nói
      const SILENCE_LIMIT_MS = 1000; // Ngắt đoạn nếu im lặng 1 giây
      const MAX_SPEECH_MS = 20000; // Ngắt tự động sau 8 giây dù chưa im lặng (để dịch kịp thời)

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Mute đầu ra để tránh tạo tiếng vọng (echo) lại tai người dùng
        const outputData = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < outputData.length; i++) outputData[i] = 0;

        // Tính toán độ lớn âm lượng trung bình
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) sum += Math.abs(inputData[i]);
        const average = sum / inputData.length;

        const now = Date.now();

        if (average > THRESHOLD) {
          if (!isSpeaking) {
            isSpeaking = true;
            speechStart = now;
            setInterimText('[ Đang nghe... ]'); 
          }
          silenceStart = now;
          audioData.push(new Float32Array(inputData));
        } else {
          if (isSpeaking) {
            audioData.push(new Float32Array(inputData));
            const silenceDuration = now - silenceStart;
            const speakingDuration = now - speechStart;
            
            // Xử lý gửi đoạn âm thanh sang Worker
            if (silenceDuration > SILENCE_LIMIT_MS || speakingDuration > MAX_SPEECH_MS) {
              isSpeaking = false;
              setInterimText(''); 
              sendAudioToWorker(audioData);
              audioData = []; // Đặt lại bộ đệm
            }
          }
        }
      };

      source.connect(processor);
      // Bắt buộc kết nối processor vào destination thì nó mới chạy trên trình duyệt
      processor.connect(audioContext.destination); 
      
      setIsListening(true);
    } catch (error) {
      console.error(error);
      setErrorMsg(error.message);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (processorRef.current) processorRef.current.disconnect();
    if (sourceRef.current) sourceRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsListening(false);
  };

  return (
    <div className="app-container">
      <div className="controls">
        <h1>🎙️ Whisper + NLLB Subtitle</h1>
        {!isListening ? (
          <button className="btn start" onClick={startListening}>
             Bắt đầu nghe Tab Audio
          </button>
        ) : (
          <button className="btn stop" onClick={stopListening}>
             Dừng lại
          </button>
        )}
        
        {modelProgress && modelProgress.status !== 'done' && modelProgress.status !== 'ready' && (
           <div className="progress-bar">
             <p>Đang tải {modelProgress.model} ({modelProgress.file}): {Math.round(modelProgress.progress || 0)}%</p>
             <p className="progress-note">(Whisper: ~80MB, NLLB: ~1GB. Chỉ tải lần đầu, sau đó sẽ lưu cache.)</p>
           </div>
        )}
        
        {errorMsg && <p className="error">{errorMsg}</p>}
      </div>

      <div className="subtitle-wrapper">
        <div className="subtitle-box">
          {(interimText || finalText || translatedText || isProcessing) ? (
            <>
              <div className="original-text">
                {finalText && <span className="final-ja">{finalText}</span>}
                {interimText && <span className="interim-ja"> {interimText}</span>}
              </div>
              
              {isProcessing && (
                 <div className="placeholder translating">AI đang trích xuất tiếng & dịch...</div>
              )}
              
              {translatedText && !isProcessing && (
                 <div className="translated-text">{translatedText}</div>
              )}
            </>
          ) : (
            <div className="placeholder">
              Phụ đề trực tiếp sẽ hiển thị ở đây...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
