import React, { useState, useEffect, useRef } from 'react';
import './index.css';

// Gọi trực tiếp lên server mảng mở của Google Translate (Cực kỳ nhanh, không cần tải AI)
const googleTranslate = async (text) => {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const data = await response.json();
    return data[0][0][0]; // Lấy chuỗi kết quả tiếng Việt
  } catch (error) {
    console.error("Lỗi Google Translate:", error);
    return "[Lỗi mạng]";
  }
};

const App = () => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  
  const [notesHistory, setNotesHistory] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  
  const recognitionRef = useRef(null);
  const notesEndRef = useRef(null);

  useEffect(() => {
    if (notesEndRef.current) {
      notesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [notesHistory]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setErrorMsg("Trình duyệt không hỗ trợ Web Speech API.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ja-JP';

    recognition.onresult = async (event) => {
      let currentInterim = '';
      let currentFinal = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          currentFinal += event.results[i][0].transcript;
        } else {
          currentInterim += event.results[i][0].transcript;
        }
      }

      setInterimText(currentInterim);

      if (currentFinal) {
        const sentenceId = Date.now().toString() + Math.random().toString();
        
        const newNote = {
          id: sentenceId,
          timestamp: new Date().toLocaleTimeString(),
          japanese: currentFinal,
          vietnamese: '...', 
          isTranslating: true
        };

        setNotesHistory(prev => [...prev, newNote]);
        setInterimText('');

        // Gọi thẳng Google Translate thay vì dùng AI Worker nặng nề
        const translatedResult = await googleTranslate(currentFinal);
        
        setNotesHistory(prevHistory => 
          prevHistory.map(note => 
            note.id === sentenceId 
              ? { ...note, vietnamese: translatedResult, isTranslating: false }
              : note
          )
        );
      }
    };

    recognition.onerror = (event) => {
      console.error("Lỗi:", event.error);
      if (event.error !== 'no-speech') {
         setErrorMsg(`Lỗi thu âm: ${event.error}.`);
         setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (isListening) {
        try { recognition.start(); } catch (e) {}
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [isListening]);

  const startListening = () => {
    setErrorMsg('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
    setInterimText('');
  };

  return (
    <div className="app-container">
      {/* CỘT TRÁI: BẢNG ĐIỀU KHIỂN & PHỤ ĐỀ TRỰC TIẾP */}
      <div className="left-panel">
        <div className="controls">
          <h1>🎙️ Discord Live Subtitle</h1>
          <p className="subtitle-hint">Siêu tốc độ + Google Translate</p>
          
          {!isListening ? (
            <button className="btn start" onClick={startListening}>
               Bắt đầu nghe
            </button>
          ) : (
            <button className="btn stop" onClick={stopListening}>
               Dừng lại
            </button>
          )}
          
          {errorMsg && <p className="error">{errorMsg}</p>}
        </div>

        <div className="live-caption-box">
          <h3 className="box-title">Đang nghe...</h3>
          <div className="live-text-container">
            {interimText ? (
              <span className="interim-text">{interimText}</span>
            ) : (
              <span className="placeholder">Hãy nói hoặc phát video tiếng Nhật...</span>
            )}
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: BẢNG GHI CHÚ / BIÊN BẢN HỌP */}
      <div className="right-panel">
        <div className="notes-header">
          <h2>📝 Meeting Transcript</h2>
          <span className="note-count">{notesHistory.length} câu</span>
        </div>
        
        <div className="notes-list">
          {notesHistory.length === 0 ? (
            <div className="empty-notes">
              <p>Chưa có cuộc hội thoại nào.</p>
              <p>Các câu hoàn chỉnh sẽ được lưu lại tại đây.</p>
            </div>
          ) : (
            notesHistory.map((note) => (
              <div key={note.id} className="note-item">
                <div className="note-time">{note.timestamp}</div>
                <div className="note-content">
                  <div className="note-ja">{note.japanese}</div>
                  <div className={`note-vi ${note.isTranslating ? 'translating' : ''}`}>
                    {note.isTranslating ? 'Đang dịch...' : note.vietnamese}
                  </div>
                </div>
              </div>
            ))
          )}
          {/* Vùng vô hình để tự động cuộn xuống cuối */}
          <div ref={notesEndRef} />
        </div>
      </div>
    </div>
  );
};

export default App;
