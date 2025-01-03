export interface ILLMService {
    ask(question: string): Promise<string | null>;
}