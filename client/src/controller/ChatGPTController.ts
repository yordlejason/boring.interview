import { ILLMService } from './ILLMController';

export class ChatGPTService implements ILLMService {
  async ask(question: string): Promise<string | null> {
    try {
      const resp = await fetch('http://localhost:3000/api/chatgpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, model: 'gpt-4o' })
      });
      const data = await resp.json();
      return data.answer || null;
    } catch (error) {
      console.error("Error querying ChatGPT:", error);
      return null;
    }
  }
}