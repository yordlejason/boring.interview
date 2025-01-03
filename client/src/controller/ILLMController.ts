export interface ILLMService {
    ask(question: string, model: string): Promise<string | null>;
}