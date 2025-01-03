import { ILLMService } from './ILLMController';

export class DeepSeekService implements ILLMService {
  async ask(question: string): Promise<string | null> {
    try {
      const resp = await fetch('http://localhost:3000/api/deepseek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      const data = await resp.json();
      return data.answer || null;
    } catch (error) {
      console.error("Error querying DeepSeek:", error);
      return null;
    }
  }
}