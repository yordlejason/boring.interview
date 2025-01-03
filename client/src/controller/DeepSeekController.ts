import { ILLMService } from './ILLMController';

/**
 * Service for interacting with the DeepSeek model.
 */
export class DeepSeekService implements ILLMService {
  /**
   * Asks a question to the DeepSeek model and returns the answer.
   * 
   * @param {string} question - The question to ask.
   * @param {string} model - The model to use.
   * @returns {Promise<string | null>} The answer from the DeepSeek model.
   */
  async ask(question: string, model: string): Promise<string | null> {
    try {
      const resp = await fetch('http://localhost:3000/api/deepseek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, model: model })
      });
      const data = await resp.json();
      return data.answer || null;
    } catch (error) {
      console.error("Error querying DeepSeek:", error);
      return null;
    }
  }
}