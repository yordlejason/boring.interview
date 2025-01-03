import { DeepSeekService } from '../src/controller/DeepSeekController';

describe('DeepSeekService', () => {
  let deepSeekService: DeepSeekService;

  beforeEach(() => {
    deepSeekService = new DeepSeekService();
  });

  test('ask should return answer from DeepSeek model', async () => {
    const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
      json: jest.fn().mockResolvedValue({ answer: 'mock answer' })
    } as any);

    const result = await deepSeekService.ask('mock question', 'deepseek');
    expect(result).toBe('mock answer');
    mockFetch.mockRestore();
  });

  test('ask should return null if there is an error', async () => {
    const mockFetch = jest.spyOn(global, 'fetch').mockRejectedValue(new Error('mock error'));

    const result = await deepSeekService.ask('mock question', 'deepseek');
    expect(result).toBeNull();
    mockFetch.mockRestore();
  });
});
