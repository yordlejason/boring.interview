import React, { useRef, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { AuthService } from './services/AuthService';
import { OcrService } from './services/OcrService';
import { ILLMService } from './controller/ILLMController';
import { ChatGPTService } from './controller/ChatGPTController';
import { DeepSeekService } from './controller/DeepSeekController';
import { DecodedToken } from './types/DecodedToken';

const clientId = "541775409213-uc49bvsrq582uveqoaf501rfoobs1bpg.apps.googleusercontent.com";

const getSliderBackground = (value: number): string => {
  const percentage = ((value - 5) / 55) * 100;
  return `linear-gradient(to right, #4caf50 ${percentage}%, #ffa726 ${percentage}%, #ef5350 100%)`;
};

/**
 * The main application component for the boring.interview client.
 * 
 * This component handles user authentication, screen capture, OCR processing, 
 * and interaction with a language model to provide answers based on captured text.
 * 
 * @component
 * 
 * @returns {JSX.Element} The rendered application component.
 * 
 * @example
 * <App />
 * 
 * @remarks
 * - Uses Google OAuth for authentication.
 * - Manages dark mode and auto mode settings.
 * - Captures screen content and processes it using OCR.
 * - Interacts with a language model to generate answers.
 * 
 * @hook
 * - `useRef` for video, canvas, and settings container references.
 * - `useState` for managing various states such as authentication, processing, and settings.
 * - `useEffect` for handling side effects like token verification, local storage, and stream setup.
 * 
 * @function
 * - `responseGoogle` Handles the response from Google OAuth.
 * - `handleLogout` Logs out the user and resets the state.
 * - `startCapture` Initiates screen capture.
 * - `runOCR` Performs OCR on the captured screen content and interacts with the language model.
 * - `toggleAutoMode` Toggles the auto mode setting.
 * - `handleManualProcess` Manually triggers the OCR process.
 * 
 * @style
 * - Defines various styles for the component and its elements, including dark mode and light mode styles.
 * 
 * @dependencies
 * - `GoogleOAuthProvider` for Google OAuth integration.
 * - `ReactMarkdown` for rendering markdown content.
 * - `remarkGfm` for GitHub Flavored Markdown support.
 * - `AuthService` for handling authentication.
 * - `OcrService` for performing OCR.
 * - `DeepSeekService` and `ChatGPTService` for interacting with language models.
 */
function App(): JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settingsContainerRef = useRef<HTMLDivElement>(null);
  const solutionRef = useRef<HTMLDivElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [answer, setAnswer] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWaitingForApi, setIsWaitingForApi] = useState(false);
  const [intervalSeconds, setIntervalSeconds] = useState(30);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [model, setModel] = useState('deepseek-chat');
  const [solutions, setSolutions] = useState<string[]>([]);
  const [currentSolutionIndex, setCurrentSolutionIndex] = useState<number>(-1);

  const responseGoogle = (response: unknown): void => {
    if (AuthService.handleGoogleResponse(response)) {
      setIsAuthenticated(true);
    } else {
      console.error("Google login failed:", response);
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
    AuthService.signOut();
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
    await OcrService.captureScreen(
      setStream,
      setAnswer,
      setIsProcessing,
      setIsWaitingForApi,
      isAuthenticated
    );
  };

  const runOCR = async () => {
    if (isWaitingForApi) return;
    const llmService: ILLMService = model.includes('deepseek')
      ? new DeepSeekService()
      : new ChatGPTService();
    if (videoRef.current && canvasRef.current) {
      setIsProcessing(true);
      setIsWaitingForApi(true); // Set waiting state to true
      try {
        const text = await OcrService.performOCR(videoRef.current, canvasRef.current);
        const ans = await llmService.ask(text, model);
        if (ans) {
          setAnswer(ans);
          setSolutions(prev => [...prev, ans]);
          setCurrentSolutionIndex(prev => prev + 1);
        }
      } finally {
        setIsProcessing(false);
        setIsWaitingForApi(false); // Reset waiting state to false
      }
    }
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

  useEffect(() => {
    if (answer && solutionRef.current) {
      solutionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [answer]);

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

    [data-tooltip] {
      position: relative;
      cursor: pointer;
    }
    [data-tooltip]::before {
      content: attr(data-tooltip);
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background-color: rgba(0, 0, 0);
      color: #fff;
      padding: 5px 10px;
      border-radius: 4px;
      white-space: nowrap;
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
      z-index: 10;
    }
    [data-tooltip]:hover::before {
      opacity: 1;
    }
  `;

  const loadingIconKeyframes = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  const containerStyles: React.CSSProperties = {
    margin: '0 auto',
    maxWidth: '700px',
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
    backgroundColor: isDarkMode ? '#fdfdfd' : '#222',
    color: isDarkMode ? '#000' : '#fff',
    borderRadius: '8px',
    minWidth: '190px'
  };

  const settingsItemStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
    whiteSpace: 'nowrap', // Prevent line breaks
    color: isDarkMode ? '#000' : '#fff' // Ensure font color matches the container
  };

  const labelStyles: React.CSSProperties = {
    color: isDarkMode ? '#000' : '#fff', // Ensure font color matches the container
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
    display: 'block',
    width: '100%',
    padding: '15px 25px',
    backgroundColor: isDarkMode ? '#4caf50' : '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'transform 0.2s, background-color 0.3s',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };

  const solveButtonHoverStyles: React.CSSProperties = {
    backgroundColor: isDarkMode ? '#45a049' : '#45a049',
  };

  const loadingIconStyles: React.CSSProperties = {
    display: 'inline-block',
    width: '20px',
    height: '20px',
    border: '3px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '50%',
    borderTopColor: '#fff',
    animation: 'spin 1s ease-in-out infinite',
  };

  const dropdownStyles: React.CSSProperties = {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: `1px solid ${borderColor}`,
    backgroundColor: isDarkMode ? '#333' : '#fff',
    color: textColor,
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    backgroundImage: isDarkMode
      ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%23fff\'%3E%3Cpath d=\'M7 10l5 5 5-5z\'/%3E%3C/svg%3E")'
      : 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%23000\'%3E%3Cpath d=\'M7 10l5 5 5-5z\'/%3E%3C/svg%3E")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    backgroundSize: '12px',
  };

  const leftButtonContainer: React.CSSProperties = {
    position: 'fixed',
    bottom: '20px',
    left: '20px',
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  };

  const navButtonStyles = (dark: boolean): React.CSSProperties => ({
    backgroundColor: dark ? '#fdfdfd' : '#222',
    color: dark ? '#000' : '#fff',
    border: 'none',
    borderRadius: '4px',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s, background-color 0.3s'
  });

  const toggleAutoMode = () => {
    setIsAutoMode(!isAutoMode);
  };

  const handleManualProcess = async () => {
    await runOCR();
  };

  const handlePrev = () => {
    setCurrentSolutionIndex(i => Math.max(0, i - 1));
  };

  const handleNext = () => {
    setCurrentSolutionIndex(i => Math.min(solutions.length - 1, i + 1));
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
        <style>{loadingIconKeyframes}</style>
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
                    }}
                    data-tooltip="Screen sharing is required to capture and process the content on your screen."
                  >
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
                        style={{ ...solveButtonStyles, ...(isDarkMode ? solveButtonHoverStyles : {}) }}
                        onClick={handleManualProcess}
                        disabled={isWaitingForApi}
                      >
                        {isWaitingForApi ? <span style={loadingIconStyles}></span> : 'Solve!'}
                      </button>
                    </div>
                  )}
                </>
              )}

              {stream && currentSolutionIndex >= 0 && (
                <div style={{ marginTop: '30px' }} ref={solutionRef}>
                  <h2 style={sectionHeadingStyles}>Answer</h2>
                  <div style={answerBoxStyles} className="answer-box">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {solutions[currentSolutionIndex]}
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
                  <span style={{ ...labelStyles }} data-tooltip="Switch between light/dark theme">Dark Mode</span>
                  <div style={switchContainerStyles(isDarkMode)} onClick={() => setIsDarkMode(!isDarkMode)}>
                    <div style={switchKnobStyles(isDarkMode)}></div>
                  </div>
                </div>
                <div style={settingsItemStyles}>
                  <span style={{ ...labelStyles }} data-tooltip={`Auto-solve questions every ${intervalSeconds} seconds when enabled.`}>Auto Mode</span>
                  <div
                    style={switchContainerStyles(isAutoMode)}
                    onClick={toggleAutoMode}
                  >
                    <div style={switchKnobStyles(isAutoMode)}></div>
                  </div>
                </div>
                {isAutoMode && (
                  <div style={settingsItemStyles}>
                    <span style={{ ...labelStyles }} data-tooltip="Screen capture frequency in seconds">Interval (s)</span>
                    <input
                      type="range"
                      min="15"
                      max="300"
                      step="15"
                      value={intervalSeconds}
                      onChange={(e) => setIntervalSeconds(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{
                        width: '100%',
                        background: getSliderBackground(intervalSeconds),
                        color: textColor,
                        border: `1px solid ${borderColor}`,
                        borderRadius: '4px',
                        padding: '2px 5px',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px'
                      }}
                    />
                    <span style={labelStyles}>{intervalSeconds}</span>
                  </div>
                )}
                <div style={settingsItemStyles}>
                  <span style={{ ...labelStyles }} data-tooltip="Large Language Models">Model</span>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    style={dropdownStyles}
                  >
                    <option value="deepseek-chat">deepseek-chat</option>
                    <option value="deepseek-reasoner">deepseek-reasoner</option>
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

          {/* Bottom-left container for previous/next buttons */}
          <div style={leftButtonContainer}>
            <button onClick={handlePrev}
              disabled={currentSolutionIndex <= 0}
              style={navButtonStyles(isDarkMode)}>
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '24px', height: '24px' }}>
                <path d="M15.41 7.41L14 6 8 12l6 6 1.41-1.41L10.83 12z" />
              </svg>
            </button>
            <button onClick={handleNext}
              disabled={currentSolutionIndex >= solutions.length - 1}
              style={navButtonStyles(isDarkMode)}>
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '24px', height: '24px' }}>
                <path d="M8.59 16.59L13.17 12l-4.58-4.59L10 6l6 6-6 6z" />
              </svg>
            </button>
          </div>
        </div>
      </>
    </GoogleOAuthProvider>
  );
}

export default App;
