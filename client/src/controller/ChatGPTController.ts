import { ILLMService } from './ILLMController';

/**
 * Service for interacting with the ChatGPT model.
 */
export class ChatGPTService implements ILLMService {
  /**
   * Asks a question to the ChatGPT model and returns the answer.
   * 
   * @param {string} question - The question to ask.
   * @param {string} model - The model to use.
   * @returns {Promise<string | null>} The answer from the ChatGPT model.
   */
  async ask(question: string, model: string): Promise<string | null> {
    try {
      const resp = await fetch('http://localhost:3000/api/chatgpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, model: model })
      });
      const data = await resp.json();
      return data.answer || null;
    } catch (error) {
      console.error("Error querying ChatGPT:", error);
      return null;
    }
  }
}