/**
 * Interface for Large Language Model (LLM) services.
 */
export interface ILLMService {
  /**
   * Asks a question to the LLM and returns the answer.
   * 
   * @param {string} question - The question to ask.
   * @param {string} model - The model to use.
   * @returns {Promise<string | null>} The answer from the LLM.
   */
  ask(question: string, model: string): Promise<string | null>;
}