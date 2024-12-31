import Tesseract from 'tesseract.js';

export class OcrService {
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
}