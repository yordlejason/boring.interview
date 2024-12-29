import React, { useRef, useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

const clientId = "541775409213-uc49bvsrq582uveqoaf501rfoobs1bpg.apps.googleusercontent.com";

interface GoogleResponse {
  credential: string;
}

interface DecodedToken {
  exp: number;
}

// Helper function type definitions
const handleGoogleAuthToken = (credential: string): boolean => {
  try {
    const decoded = jwtDecode<DecodedToken>(credential);
    if (decoded?.exp && decoded.exp * 1000 > Date.now()) {
      document.cookie = `authToken=${credential}; path=/; Secure; SameSite=Strict; Max-Age=21600`;
      return true;
    }
  } catch (err) {
    console.error("Token validation error:", err);
  }
  return false;
};

const captureScreen = async (
  setStream: React.Dispatch<React.SetStateAction<MediaStream | null>>,
  setAnswer: React.Dispatch<React.SetStateAction<string>>,
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>,
  setIsWaitingForApi: React.Dispatch<React.SetStateAction<boolean>>,
  isAuthenticated: boolean
): Promise<void> => {
  if (!isAuthenticated) {
    alert("Please log in to start screen capture.");
    return;
  }
  try {
    const media = await navigator.mediaDevices.getDisplayMedia({ video: true });
    setStream(media);
    setAnswer('');
    setIsProcessing(false);
    setIsWaitingForApi(false);
  } catch (err) {
    console.error("Screen capture failed:", err);
  }
};

// Helper to query ChatGPT
const askChatGPT = async (
  question: string,
  setAnswer: React.Dispatch<React.SetStateAction<string>>,
  setIsWaitingForApi: React.Dispatch<React.SetStateAction<boolean>>,
  model: string
): Promise<void> => {
  setIsWaitingForApi(true);
  try {
    const resp = await fetch('http://localhost:3000/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, model })
    });
    const data = await resp.json();
    if (data.answer) {
      setAnswer(data.answer);
    } else {
      console.warn("No answer received from ChatGPT.");
    }
  } catch (error) {
    console.error("Error querying ChatGPT:", error);
  } finally {
    setIsWaitingForApi(false);
  }
};

// Move OCR steps into its own function
const performOCR = async (
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  isProcessing: boolean,
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>,
  askChatGPTFn: (text: string) => Promise<void>
): Promise<void> => {
  if (!videoRef.current || !canvasRef.current || isProcessing) return;
  const video = videoRef.current;
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  if (!ctx || !video.videoWidth || !video.videoHeight) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

  setIsProcessing(true);
  try {
    const dataUrl = canvas.toDataURL('image/png');
    const { data: { text } } = await Tesseract.recognize(dataUrl, 'eng');
    if (text) {
      await askChatGPTFn(text);
    }
  } catch (ocrErr) {
    console.error("OCR Error:", ocrErr);
  } finally {
    setIsProcessing(false);
  }
}

function App(): JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settingsContainerRef = useRef<HTMLDivElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [answer, setAnswer] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWaitingForApi, setIsWaitingForApi] = useState(false);
  const [intervalSeconds, setIntervalSeconds] = useState(10);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [model, setModel] = useState('gpt-4o');

  const responseGoogle = (response: unknown): void => {
    if (response && typeof response === 'object' && 'credential' in response) {
      const { credential } = response as GoogleResponse;
      if (credential && handleGoogleAuthToken(credential)) {
        setIsAuthenticated(true);
      } else {
        console.error("Google login failed:", response);
      }
    } else {
      console.error("Invalid response format:", response);
    }
  };

  useEffect(() => {
    // On app load, verify stored token, ensure it's not expired
    const cookieMatch = document.cookie.match(/^(.*;)?\s*authToken\s*=\s*([^;]+)(.*)?$/);
    if (cookieMatch) {
      const token = cookieMatch[2];
      const decoded = jwtDecode<DecodedToken>(token);
      if (decoded?.exp && decoded.exp * 1000 > Date.now()) {
        setIsAuthenticated(true);
      }
    }

    const storedDarkMode = localStorage.getItem('isDarkMode');
    if (storedDarkMode === 'true') setIsDarkMode(true);

    const storedAnswer = localStorage.getItem('answer');
    if (storedAnswer) setAnswer(storedAnswer);

    const storedInterval = localStorage.getItem('intervalSeconds');
    if (storedInterval) {
      const val = parseInt(storedInterval, 10);
      if (!isNaN(val)) setIntervalSeconds(val);
    }
  }, []);

  const handleLogout = () => {
    document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setIsAuthenticated(false);
    setStream(null);
    setAnswer('');
  };

  useEffect(() => {
    localStorage.setItem('isDarkMode', isDarkMode.toString());
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('answer', answer);
  }, [answer]);

  useEffect(() => {
    localStorage.setItem('intervalSeconds', intervalSeconds.toString());
  }, [intervalSeconds]);

  useEffect(() => {
    if (stream && videoRef.current) {
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play();
        };
      }
    }
  }, [stream]);

  const startCapture = async () => {
    await captureScreen(setStream, setAnswer, setIsProcessing, setIsWaitingForApi, isAuthenticated);
  };

  const runOCR = async () => {
    if (isWaitingForApi) return;
    await performOCR(
      videoRef,
      canvasRef,
      isProcessing,
      setIsProcessing,
      async (text) => await askChatGPT(text, setAnswer, setIsWaitingForApi, model)
    );
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setIsProcessing(false);
      return;
    }
    if (!stream || !videoRef.current || !canvasRef.current || !isAutoMode) {
      setIsProcessing(false);
      return;
    }

    const intervalDuration = intervalSeconds * 1000;
    const interval = setInterval(() => runOCR(), intervalDuration);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    stream,
    isProcessing,
    isAutoMode,
    isWaitingForApi,
    intervalSeconds,
    isAuthenticated,
    videoRef,
    canvasRef
  ]);

  useEffect(() => {
    if (!isSettingsOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsContainerRef.current &&
        !settingsContainerRef.current.contains(event.target as Node)
      ) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSettingsOpen]);

  const bgColor = isDarkMode ? '#1c1c1c' : '#f9f9f7';
  const textColor = isDarkMode ? '#fdfdfd' : '#222';
  const secondaryTextColor = isDarkMode ? '#aaa' : '#555';
  const borderColor = isDarkMode ? '#444' : '#ddd';
  const accentBgColor = isDarkMode ? '#2a2a2a' : '#f5f3ee';

  const globalBgCSS = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=PT+Serif:ital,wght@0,400;0,700;1,400&display=swap');
    html, body {
      background-color: ${bgColor};
      margin: 0; padding: 0;
      font-family: 'PT Serif', serif;
      color: ${textColor};
      line-height: 1.6;
      transition: background-color 0.3s;
    }
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Inter', sans-serif;
      letter-spacing: 0.5px;
      margin-top: 0;
    }
    a {
      text-decoration: none;
      color: ${textColor};
      transition: color 0.3s;
    }
    a:hover {
      color: ${secondaryTextColor};
    }
    button {
      font-family: 'Inter', sans-serif;
      font-size: 0.9rem;
      transition: transform 0.2s, background-color 0.3s;
    }
    button:hover {
      transform: translateY(-1px);
    }
    [data-tooltip]:hover::before {
      opacity: 1;
    }

    @keyframes rotateIcon {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .rotating-icon {
      display: inline-block;
      animation: rotateIcon 1s linear infinite;
    }

    @media(max-width: 600px) {
      h1 { font-size: 1.8rem; }
      .answer-box { font-size: 0.9rem; }
    }
  `;

  const containerStyles: React.CSSProperties = {
    margin: '0 auto',
    maxWidth: '600px',
    padding: '40px 20px',
    transition: 'color 0.3s',
    minHeight: '100vh'
  };

  const headingStyles: React.CSSProperties = {
    textAlign: 'center' as const,
    fontWeight: 600,
    marginBottom: '40px',
    fontSize: '2.2rem',
  };

  const videoWrapperStyles: React.CSSProperties = {
    border: `1px solid ${borderColor}`,
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '20px'
  };

  const sectionHeadingStyles: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '1.3rem',
    marginBottom: '20px',
    fontWeight: 600,
    textAlign: 'center'
  };

  const answerBoxStyles: React.CSSProperties = {
    border: `1px solid ${borderColor}`,
    borderRadius: '4px',
    padding: '10px',
    backgroundColor: accentBgColor,
    fontSize: '14px',
    lineHeight: '1.5',
    transition: 'background-color 0.3s'
  };

  const bigCenterMessage = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    textAlign: 'center' as const,
    marginTop: '50px',
  };

  const rightButtonContainer: React.CSSProperties = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end'
  };

  const settingsButtonStyles: React.CSSProperties = {
    position: 'relative' as const,
    zIndex: 999,
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: isDarkMode ? '#fdfdfd' : '#222',
    color: isDarkMode ? '#000' : '#fff',
    marginBottom: '10px'
  };

  const settingsPanelStyles: React.CSSProperties = {
    position: 'absolute' as const,
    bottom: 'calc(100% + 10px)',
    right: '0',
    transform: isSettingsOpen ? 'translateY(0)' : 'translateY(10px)',
    opacity: isSettingsOpen ? 1 : 0,
    transition: 'opacity 0.3s, transform 0.3s',
    pointerEvents: isSettingsOpen ? 'auto' : 'none',
    padding: '15px',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)',
    borderRadius: '8px',
    minWidth: '190px'
  };

  const settingsItemStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px'
  };

  const labelStyles: React.CSSProperties = {
    color: textColor,
    fontSize: '14px',
    userSelect: 'none' as const,
    marginRight: '10px',
    fontFamily: 'Inter, sans-serif',
  };

  const switchContainerStyles = (on: boolean): React.CSSProperties => ({
    position: 'relative',
    width: '40px',
    height: '20px',
    backgroundColor: on ? '#4caf50' : (isDarkMode ? '#444' : '#ccc'),
    borderRadius: '20px',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background-color 0.3s',
    marginRight: '10px'
  });

  const switchKnobStyles = (on: boolean): React.CSSProperties => ({
    position: 'absolute',
    top: '2px',
    left: on ? '20px' : '2px',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    transition: 'left 0.3s'
  });

  const solveButtonStyles: React.CSSProperties = {
    display: 'block', // Makes the button a block-level element
    width: '100%',    // Ensures the button takes up the full width of the parent
    padding: '10px 20px', // Adjust padding for better aesthetics
    backgroundColor: isDarkMode ? '#444' : '#eee',
    color: isDarkMode ? '#fff' : '#000',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px', // Adjust font size to balance the new width
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'transform 0.2s, background-color 0.3s'
  };

  const toggleAutoMode = () => {
    setIsAutoMode(!isAutoMode);
  };

  const handleManualProcess = async () => {
    await runOCR();
  };

  // Determine step states for progress bar colors:
  // Colors: gray (#aaa), blue (#4285f4), green (#4caf50)
  const grayColor = '#aaa';
  const blueColor = '#4285f4';
  const greenColor = '#4caf50';

  // Step 1 logic:
  // If we have stream, step 1 completed (green), else gray
  const step1Color = stream ? greenColor : grayColor;

  // Step 2 logic:
  // If isProcessing => in progress (blue),
  // else if stream is available and not processing => completed (green),
  // else => gray
  let step2Color = grayColor;
  if (stream && isProcessing) step2Color = blueColor;
  else if (stream && !isProcessing && (answer || !isWaitingForApi)) step2Color = greenColor;

  // Step 3 logic:
  // If waitingForApi => blue (in progress)
  // If answer is obtained => green (completed)
  // Else if no answer yet => gray
  let step3Color = grayColor;
  if (isWaitingForApi) step3Color = blueColor;
  else if (answer && !isWaitingForApi) step3Color = greenColor;

  const progressBarContainer: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center', // Center-aligns the bars
    marginTop: '20px',
    marginBottom: '10px'
  };

  const progressBarSegment: React.CSSProperties = {
    flex: 1,
    height: '8px',
    borderRadius: '4px',
    margin: '0 10px', // Increased spacing between bars for better centering
  };

  const progressBarWrapper: React.CSSProperties = {
    textAlign: 'center', // Centers the label with respect to the bar
    flex: 1,
  };

  const stepLabels: React.CSSProperties = {
    fontSize: '12px',
    color: secondaryTextColor,
    fontFamily: 'Inter, sans-serif',
    marginTop: '5px',
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <>
        <style>{globalBgCSS}</style>
        <style>{`
        button:hover {
          transform: translateY(-2px);
        }
      `}</style>
        <div style={containerStyles}>
          <h1 style={headingStyles}>boring.interview</h1>

          {isAuthenticated ? (
            <>
              {stream && isAutoMode && (
                <p style={{ textAlign: 'center', color: secondaryTextColor }}>
                  Capturing screen. The process runs every {intervalSeconds}s in Auto mode.
                </p>
              )}

              {stream && !isAutoMode && (
                <p style={{ textAlign: 'center', color: secondaryTextColor }}>
                  Auto mode is disabled. Click "Solve!" to run once.
                </p>
              )}

              {stream && (
                <div style={videoWrapperStyles}>
                  <video ref={videoRef} style={{ width: '100%', height: 'auto', display: 'block' }}></video>
                </div>
              )}

              {!stream ? (
                <div style={bigCenterMessage}>
                  <button
                    onClick={startCapture}
                    style={{
                      padding: '20px',
                      fontSize: '1rem',
                      backgroundColor: isDarkMode ? '#fdfdfd' : '#222',
                      color: isDarkMode ? '#000' : '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}>
                    Screen Sharing Required
                  </button>
                </div>
              ) : (
                <>
                  <h2 style={sectionHeadingStyles}>Status</h2>

                  {/* Modernized Progress Bar */}
                  <div>
                    <div style={progressBarContainer}>
                      {/* Step 1 */}
                      <div style={progressBarWrapper}>
                        <div style={{ ...progressBarSegment, backgroundColor: step1Color }}></div>
                        <div style={stepLabels}>Screen Capture</div>
                      </div>
                      {/* Step 2 */}
                      <div style={progressBarWrapper}>
                        <div style={{ ...progressBarSegment, backgroundColor: step2Color }}></div>
                        <div style={stepLabels}>Parsing Texts</div>
                      </div>
                      {/* Step 3 */}
                      <div style={progressBarWrapper}>
                        <div style={{ ...progressBarSegment, backgroundColor: step3Color }}></div>
                        <div style={stepLabels}>Solving...</div>
                      </div>
                    </div>
                  </div>

                  {stream && !isAutoMode && (
                    <div style={{ marginTop: '20px' }}>
                      <button
                        style={solveButtonStyles}
                        onClick={handleManualProcess}>
                        Solve!
                      </button>
                    </div>
                  )}
                </>
              )}

              {stream && answer && (
                <div style={{ marginTop: '30px' }}>
                  <h2 style={sectionHeadingStyles}>Answer</h2>
                  <div style={answerBoxStyles} className="answer-box">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {answer}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={bigCenterMessage}>
              Please log in to use the features.
              <div style={{ marginTop: '20px', transform: 'scale(1.2)' }}>
                <GoogleLogin
                  onSuccess={responseGoogle}
                  onError={() => console.error("Google login failed")}
                />
              </div>
            </div>
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

          {/* Bottom-right container for settings and logout */}
          <div style={rightButtonContainer}>
            <div style={{ position: 'relative' }} ref={settingsContainerRef}>
              <button
                style={settingsButtonStyles}
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              >
                Settings
              </button>
              <div style={settingsPanelStyles}>
                <div style={settingsItemStyles}>
                  <span style={labelStyles}>Dark Mode</span>
                  <div style={switchContainerStyles(isDarkMode)} onClick={() => setIsDarkMode(!isDarkMode)}>
                    <div style={switchKnobStyles(isDarkMode)}></div>
                  </div>
                </div>
                <div style={settingsItemStyles}>
                  <span style={labelStyles}>Auto</span>
                  <div
                    style={switchContainerStyles(isAutoMode)}
                    onClick={toggleAutoMode}
                    data-tooltip="When enabled, the screen will be processed automatically every few seconds."
                  >
                    <div style={switchKnobStyles(isAutoMode)}></div>
                  </div>
                </div>
                <div style={settingsItemStyles}>
                  <span style={labelStyles}>Interval (s)</span>
                  <input
                    type="number"
                    min="1"
                    value={intervalSeconds}
                    onChange={(e) => setIntervalSeconds(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{
                      width: '60px',
                      backgroundColor: isDarkMode ? '#333' : '#fff',
                      color: textColor,
                      border: `1px solid ${borderColor}`,
                      borderRadius: '4px',
                      padding: '2px 5px',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div style={settingsItemStyles}>
                  <span style={labelStyles}>Model</span>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    style={{ backgroundColor: isDarkMode ? '#333' : '#fff', color: textColor }}
                  >
                    <option value="gpt-4o">gpt-4o</option>
                    <option value="o1-preview">o1-preview</option>
                  </select>
                </div>
              </div>
            </div>
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                style={{
                  ...settingsButtonStyles,
                  marginTop: '10px'  // Add spacing between settings and logout buttons
                }}
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </>
    </GoogleOAuthProvider>
  );
}

export default App;
