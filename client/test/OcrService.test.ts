import { OcrService } from '../src/services/OcrService';
import Tesseract from 'tesseract.js';

describe('OcrService', () => {
  let videoEl: HTMLVideoElement;
  let canvasEl: HTMLCanvasElement;

  beforeEach(() => {
    videoEl = document.createElement('video');
    canvasEl = document.createElement('canvas');
  });

  test('performOCR should return empty string if context is not available', async () => {
    const result = await OcrService.performOCR(videoEl, canvasEl);
    expect(result).toBe('');
  });

  test('performOCR should return recognized text', async () => {
    const mockRecognize = jest.spyOn(Tesseract, 'recognize').mockResolvedValue({
      data: { text: 'recognized text' }
    } as any);

    const ctx = canvasEl.getContext('2d');
    if (ctx) {
      ctx.fillRect(0, 0, 100, 100);
    }

    const result = await OcrService.performOCR(videoEl, canvasEl);
    expect(result).toBe('recognized text');
    mockRecognize.mockRestore();
  });

  test('captureScreen should alert if not authenticated', async () => {
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
    await OcrService.captureScreen(jest.fn(), jest.fn(), jest.fn(), jest.fn(), false);
    expect(alertMock).toHaveBeenCalledWith("Please log in to start screen capture.");
    alertMock.mockRestore();
  });

  test('captureScreen should set stream and reset states if authenticated', async () => {
    const mockSetStream = jest.fn();
    const mockSetAnswer = jest.fn();
    const mockSetIsProcessing = jest.fn();
    const mockSetIsWaitingForApi = jest.fn();

    const mockMediaStream = new MediaStream();
    jest.spyOn(navigator.mediaDevices, 'getDisplayMedia').mockResolvedValue(mockMediaStream);

    await OcrService.captureScreen(mockSetStream, mockSetAnswer, mockSetIsProcessing, mockSetIsWaitingForApi, true);

    expect(mockSetStream).toHaveBeenCalledWith(mockMediaStream);
    expect(mockSetAnswer).toHaveBeenCalledWith('');
    expect(mockSetIsProcessing).toHaveBeenCalledWith(false);
    expect(mockSetIsWaitingForApi).toHaveBeenCalledWith(false);
  });
});
