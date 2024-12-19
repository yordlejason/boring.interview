import React, { useRef, useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [ocrText, setOcrText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [answer, setAnswer] = useState<string>('');

  useEffect(() => {
    if (stream && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play();
      };
    }
  }, [stream]);

  const startCapture = async () => {
    try {
      const captureStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setStream(captureStream);
    } catch (err) {
      console.error("Error capturing screen:", err);
    }
  };

  const askChatGPT = async (question: string) => {
    const resp = await fetch('http://localhost:3000/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    const data = await resp.json();
    if (data.answer) {
      setAnswer(data.answer);
    } else {
      setAnswer("No answer received.");
    }
  };

  useEffect(() => {
    if (!stream || !videoRef.current || !canvasRef.current) return;

    const interval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (video.videoWidth && video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

        if (!isProcessing) {
          setIsProcessing(true);
          const dataUrl = canvas.toDataURL('image/png');
          try {
            const { data: { text } } = await Tesseract.recognize(dataUrl, 'eng');
            setOcrText(text);

            // Find a question in the extracted text
            const question = text
            if (question) {
              await askChatGPT(question);
            }
          } catch (error) {
            console.error("OCR Error:", error);
          } finally {
            setIsProcessing(false);
          }
        }
      }
    }, 5000); // OCR every 5 seconds

    return () => clearInterval(interval);
  }, [stream, isProcessing]);

  return (
    <div style={{ margin: '20px' }}>
      <h1>CodeAssist</h1>
      {!stream && <button onClick={startCapture}>Start Screen Capture</button>}
      {stream && (
        <>
          <p>Capturing your screen. OCR runs every 5s.</p>
          <video ref={videoRef} style={{ width: '100%', border: '1px solid #ccc' }}></video>
        </>
      )}
      <div style={{ marginTop: '20px' }}>
        <h2>Recognized Text (Live OCR):</h2>
        {isProcessing ? <p>Processing OCR...</p> : <pre>{ocrText}</pre>}
      </div>
      {answer && (
        <div style={{ marginTop: '20px' }}>
          <h2>Answer (Markdown Rendered):</h2>
          <div style={{ border: '1px solid #ddd', padding: '10px' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {answer}
            </ReactMarkdown>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </div>
  );
}

export default App;