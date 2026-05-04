import React, { useState, useEffect, useRef } from 'react';
import './index.css';

// Gọi trực tiếp lên server mảng mở của Google Translate (Cực kỳ nhanh, không cần tải AI)
const googleTranslate = async (text, sourceLang, targetLang) => {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const data = await response.json();
    return data[0][0][0]; // Lấy chuỗi kết quả
  } catch (error) {
    console.error("Lỗi Google Translate:", error);
    return "[Lỗi mạng]";
  }
};

const App = () => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  
  const [notesHistory, setNotesHistory] = useState(() => {
    const saved = localStorage.getItem('notesHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [errorMsg, setErrorMsg] = useState('');
  
  const [sourceLang, setSourceLang] = useState('ja-JP');
  const [targetLang, setTargetLang] = useState('vi');
  
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  const recognitionRef = useRef(null);
  const notesEndRef = useRef(null);
  const notesListRef = useRef(null);
  const isListeningRef = useRef(false);

  useEffect(() => {
    localStorage.setItem('notesHistory', JSON.stringify(notesHistory));
    if (isAutoScroll && notesEndRef.current) {
      notesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [notesHistory, isAutoScroll]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setErrorMsg("Trình duyệt không hỗ trợ Web Speech API.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = sourceLang;

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
          sourceText: currentFinal,
          translatedText: '...', 
          isTranslating: true
        };

        setNotesHistory(prev => [...prev, newNote]);
        setInterimText('');

        const sourceShort = sourceLang.split('-')[0];
        const translatedResult = await googleTranslate(currentFinal, sourceShort, targetLang);
        
        setNotesHistory(prevHistory => 
          prevHistory.map(note => 
            note.id === sentenceId 
              ? { ...note, translatedText: translatedResult, isTranslating: false }
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
         isListeningRef.current = false;
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        try { recognition.start(); } catch (e) {}
      }
    };

    recognitionRef.current = recognition;

    // Tự động khởi động lại bằng ngôn ngữ mới nếu đang nghe
    if (isListeningRef.current) {
      try { recognition.start(); } catch (e) {}
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [sourceLang, targetLang]);

  const startListening = () => {
    setErrorMsg('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        isListeningRef.current = true;
      } catch (error) {
        console.error(error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
    isListeningRef.current = false;
    setInterimText('');
  };

  const exportToWord = () => {
    if (notesHistory.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }

    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Meeting Transcript</title></head><body>`;
    
    let bodyText = `<h1>Biên bản cuộc họp (${new Date().toLocaleDateString()})</h1>`;
    bodyText += `<p><strong>Ngôn ngữ:</strong> ${sourceLang} -&gt; ${targetLang}</p><hr/>`;
    
    notesHistory.forEach(note => {
      bodyText += `
        <div style="margin-bottom: 16px;">
          <p style="margin: 0; color: #555; font-size: 10pt;">${note.timestamp}</p>
          <p style="margin: 4px 0; color: #000; font-size: 12pt;"><strong>${note.sourceText}</strong></p>
          <p style="margin: 4px 0; color: #0047b3; font-size: 12pt;">${note.translatedText}</p>
        </div>
      `;
    });
    
    const footer = "</body></html>";
    const sourceHTML = header + bodyText + footer;
    
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `Meeting_Transcript_${Date.now()}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  const clearHistory = () => {
    if(window.confirm("Bạn có chắc chắn muốn xoá toàn bộ lịch sử?")) {
      setNotesHistory([]);
      localStorage.removeItem('notesHistory');
    }
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleScroll = () => {
    if (!notesListRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = notesListRef.current;
    
    // Ngưỡng 50px để xác định có đang ở dưới cùng hay không
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAutoScroll(isAtBottom);
  };

  const scrollToBottom = () => {
    setIsAutoScroll(true);
    if (notesEndRef.current) {
      notesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
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
          <h3 className="box-title">
            Đang nghe...
            {isListening && (
              <span className="mic-visualizer">
                <span className="bar"></span>
                <span className="bar"></span>
                <span className="bar"></span>
              </span>
            )}
          </h3>
          <div className="live-text-container">
            {interimText ? (
              <span className="interim-text">{interimText}</span>
            ) : (
              <span className="placeholder">Hãy nói hoặc phát video để bắt đầu...</span>
            )}
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: BẢNG GHI CHÚ / BIÊN BẢN HỌP */}
      <div className="right-panel">
        <div className="top-bar">
          <div className="lang-selectors">
            <select className="lang-select" value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
              <option value="ja-JP">🇯🇵 Tiếng Nhật (JA)</option>
              <option value="en-US">🇺🇸 Tiếng Anh (EN)</option>
              <option value="ko-KR">🇰🇷 Tiếng Hàn (KO)</option>
              <option value="zh-CN">🇨🇳 Tiếng Trung (ZH)</option>
            </select>
            <span>➡️</span>
            <select className="lang-select" value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
              <option value="vi">🇻🇳 Tiếng Việt</option>
              <option value="en">🇺🇸 Tiếng Anh</option>
              <option value="ja">🇯🇵 Tiếng Nhật</option>
            </select>
          </div>
          <div className="action-buttons">
            <button className="btn-icon danger" onClick={clearHistory} title="Xóa toàn bộ lịch sử">🗑 Xoá</button>
            <button className="btn-icon" onClick={exportToWord} title="Xuất file Word (.doc)">📥 Xuất Word</button>
          </div>
        </div>

        <div className="notes-header">
          <h2>📝 Meeting Transcript</h2>
          <span className="note-count">{notesHistory.length} câu</span>
        </div>
        
        <div className="notes-list" ref={notesListRef} onScroll={handleScroll} style={{position: 'relative'}}>
          {notesHistory.length === 0 ? (
            <div className="empty-notes">
              <p>Chưa có cuộc hội thoại nào.</p>
              <p>Các câu hoàn chỉnh sẽ được lưu lại tại đây.</p>
            </div>
          ) : (
            notesHistory.map((note) => (
              <div key={note.id} className="note-item">
                <div className="note-actions">
                  <button className="btn-copy" onClick={() => copyText(`${note.sourceText}\n${note.translatedText}`)} title="Copy câu này">📋</button>
                </div>
                <div className="note-time">{note.timestamp}</div>
                <div className="note-content">
                  <div className="note-ja">{note.sourceText}</div>
                  <div className={`note-vi ${note.isTranslating ? 'translating' : ''}`}>
                    {note.isTranslating ? 'Đang dịch...' : note.translatedText}
                  </div>
                </div>
              </div>
            ))
          )}
          {/* Vùng vô hình để tự động cuộn xuống cuối */}
          <div ref={notesEndRef} />
          
          {/* Nút cuộn xuống dưới cùng nếu không auto-scroll */}
          {!isAutoScroll && notesHistory.length > 0 && (
            <button className="scroll-to-bottom" onClick={scrollToBottom}>
              👇 Có hội thoại mới
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
