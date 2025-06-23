import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });
const deepseek = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env['DEEPSEEK_API_KEY']
});

const SYSTEM_PROMPT = `You are an AI assistant for software engineers. Given an OCR result of a programming question, follow these steps:

Step 1: Parse the Question
- Extract and clean the question from the raw OCR result.
- Ensure the problem statement is complete, grammatically correct, and unambiguous.
- Identify key requirements, constraints, and input-output formats from the question. If missing, provide the questions that interviees should ask to interviewers.
- Provide 3 test cases to validate the solution.

Step 2: Plan the Solution
Provide the plan for the proposed solution. 
- How we want to solve.
- Why we want to solve it that way.
- What data structures and algorithms we will use.

Step 3: Solve the Question
Provide a solution based on Step 2 using Python3 unless another language is explicitly specified.

Your solution must:
- Include clean, industry-standard code with comments explaining each code block, why we wrote it, and how it works.
- Use clear and meaningful variable and function names.
- Handle edge cases effectively.
- Include a section analyzing:
- Time Complexity: Big-O notation with an explanation.
- Space Complexity: Big-O notation with an explanation.`

const SUPPORTED_MODELS = {
  'gpt-4.1': { max_tokens: 8192 },
  'deepseek-chat': { max_tokens: 8192 }
};

const COST_PER_1K_PROMPT_TOKENS = {
  'gpt-4.1': 0.002,
  'deepseek-chat': 0.00027
};

const COST_PER_1K_COMPLETION_TOKENS = {
  'gpt-4.1': 0.008,
  'deepseek-chat': 0.0011
};

/**
 * Logs the cost and usage of the AI model.
 * 
 * @param {string} model - The model name.
 * @param {object} usage - The usage data containing prompt and completion tokens.
 */
function logCostAndUsage(model, usage) {
  const promptCost = (usage.prompt_tokens / 1000) * COST_PER_1K_PROMPT_TOKENS[model];
  const completionCost = (usage.completion_tokens / 1000) * COST_PER_1K_COMPLETION_TOKENS[model];
  const totalCost = promptCost + completionCost;
  console.log(`[${model} Cost] Prompt: $${promptCost.toFixed(4)}, Completion: $${completionCost.toFixed(4)}, Total: $${totalCost.toFixed(4)}`);
  console.log(`[${model} Response] Prompt: ${usage.prompt_tokens}, Completion: ${usage.completion_tokens}, Total: ${usage.total_tokens}`);
}

/**
 * Handles the request to the AI model.
 * 
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {object} aiInstance - The AI instance to use for the request.
 * @param {string} model - The model name.
 * @param {number} maxTokens - The maximum number of tokens for the response.
 */
async function handleRequest(req, res, aiInstance, model, maxTokens) {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: "No question provided." });
  }

  try {
    console.log(`[${model} Request] question length: ${question.length}`);
    
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: question }
    ];
    
    const response = await aiInstance.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens
    });

    const { usage } = response;
    if (usage) {
      logCostAndUsage(model, usage);
    }

    const answer = response.choices[0].message.content.trim();
    res.json({ answer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Error fetching answer from ${model}.` });
  }
}

/**
 * Endpoint for ChatGPT model.
 * 
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
app.post('/api/chatgpt', (req, res) => {
  const { model = 'gpt-4.1' } = req.body;
  if (!SUPPORTED_MODELS[model]) {
    return res.status(400).json({ error: "Unsupported model selected." });
  }
  handleRequest(req, res, openai, model, SUPPORTED_MODELS[model].max_tokens);
});

/**
 * Endpoint for DeepSeek model.
 * 
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
app.post('/api/deepseek', (req, res) => {
  const { model = 'deepseek-chat' } = req.body;
  if (!SUPPORTED_MODELS[model]) {
    return res.status(400).json({ error: "Unsupported model selected." });
  }
  handleRequest(req, res, deepseek, model, SUPPORTED_MODELS[model].max_tokens);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));