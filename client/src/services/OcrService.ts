import Tesseract from 'tesseract.js';

export class OcrService {
  /**
   * Performs OCR on the given video element and returns the recognized text.
   * 
   * @param {HTMLVideoElement} videoEl - The video element to capture the image from.
   * @param {HTMLCanvasElement} canvasEl - The canvas element to draw the image on.
   * @returns {Promise<string>} The recognized text.
   */
  static async performOCR(videoEl: HTMLVideoElement, canvasEl: HTMLCanvasElement): Promise<string> {
    const ctx = canvasEl.getContext('2d');
    if (!ctx || !videoEl.videoWidth || !videoEl.videoHeight) return '';

    canvasEl.width = videoEl.videoWidth;
    canvasEl.height = videoEl.videoHeight;
    ctx.drawImage(videoEl, 0, 0, videoEl.videoWidth, videoEl.videoHeight);

    try {
      const dataUrl = canvasEl.toDataURL('image/png');
      const { data: { text } } = await Tesseract.recognize(dataUrl, 'eng');
      return text || '';
    } catch (ocrErr) {
      console.error("OCR Error:", ocrErr);
      return '';
    }
  }

  /**
   * Captures the screen and sets the stream, answer, processing, and waiting states.
   * 
   * @param {React.Dispatch<React.SetStateAction<MediaStream | null>>} setStream - The function to set the stream state.
   * @param {React.Dispatch<React.SetStateAction<string>>} setAnswer - The function to set the answer state.
   * @param {React.Dispatch<React.SetStateAction<boolean>>} setIsProcessing - The function to set the processing state.
   * @param {React.Dispatch<React.SetStateAction<boolean>>} setIsWaitingForApi - The function to set the waiting state.
   * @param {boolean} isAuthenticated - The authentication state.
   * @returns {Promise<void>}
   */
  public static async captureScreen(
    setStream: React.Dispatch<React.SetStateAction<MediaStream | null>>,
    setAnswer: React.Dispatch<React.SetStateAction<string>>,
    setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>,
    setIsWaitingForApi: React.Dispatch<React.SetStateAction<boolean>>,
    isAuthenticated: boolean
  ): Promise<void> {
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
  }
}