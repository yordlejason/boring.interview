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

const pre_prompt = `
You are an AI assistant for software engineers. Given an OCR result of a programming question, follow these steps:

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
- Include clean, industry-standard code with comments explaining each part.
- Use clear and meaningful variable and function names.
- Handle edge cases effectively.
- Include a section analyzing:
- Time Complexity: Big-O notation with an explanation.
- Space Complexity: Big-O notation with an explanation.`

const SUPPORTED_MODELS = {
  'gpt-4o': { max_tokens: 10000 },
  'o1-preview': { max_completion_tokens: 10000 },
};

const COST_PER_1K_PROMPT_TOKENS = {
  'gpt-4o': 0.03,
  'o1-preview': 0.001
};

const COST_PER_1K_COMPLETION_TOKENS = {
  'gpt-4o': 0.06,
  'o1-preview': 0.001
};

app.post('/api/chatgpt', async (req, res) => {
  const { question, model = 'gpt-4o' } = req.body;
  
  if (!question) {
    return res.status(400).json({ error: "No question provided." });
  }

  if (!SUPPORTED_MODELS[model]) {
    return res.status(400).json({ error: "Unsupported model selected." });
  }

  try {
    console.log(`[OpenAI Request] Model: ${model}, question length: ${question.length}`);
    const content = pre_prompt + question;
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: content }],
      max_tokens: SUPPORTED_MODELS[model].max_tokens
    });

    const { usage } = response;
    if (usage) {
      console.log(`[OpenAI Response] Model: ${model}, Prompt: ${usage.prompt_tokens}, Completion: ${usage.completion_tokens}, Total: ${usage.total_tokens}`);

      const promptCost = (usage.prompt_tokens / 1000) * COST_PER_1K_PROMPT_TOKENS[model];
      const completionCost = (usage.completion_tokens / 1000) * COST_PER_1K_COMPLETION_TOKENS[model];
      const totalCost = promptCost + completionCost;
      console.log(`[OpenAI Cost] Model: ${model}, Prompt: $${promptCost.toFixed(4)}, Completion: $${completionCost.toFixed(4)}, Total: $${totalCost.toFixed(4)}`);
    }

    const answer = response.choices[0].message.content.trim();
    res.json({ answer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching answer from ChatGPT." });
  }
});

// Add DeepSeek API endpoint
app.post('/api/deepseek', async (req, res) => {
  const { question } = req.body;
  const model = 'deepseek-chat';

  if (!question) {
    return res.status(400).json({ error: "No question provided." });
  }

  try {
    console.log(`[DeepSeek Request] Model: ${model}, question length: ${question.length}`);
    const content = pre_prompt + question;
    const response = await deepseek.chat.completions.create({
      model: model,
      messages: [{ role: "system", content: content }],
      max_tokens: 8192
    });

    const { usage } = response;
    if (usage) {
      console.log(`[DeepSeek Response] Model: ${model}, Prompt: ${usage.prompt_tokens}, Completion: ${usage.completion_tokens}, Total: ${usage.total_tokens}`);

      const promptCost = (usage.prompt_tokens / 1000) * 0.03; // Example cost
      const completionCost = (usage.completion_tokens / 1000) * 0.06; // Example cost
      const totalCost = promptCost + completionCost;
      console.log(`[DeepSeek Cost] Model: ${model}, Prompt: $${promptCost.toFixed(4)}, Completion: $${completionCost.toFixed(4)}, Total: $${totalCost.toFixed(4)}`);
    }

    const answer = response.choices[0].message.content.trim();
    res.json({ answer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching answer from DeepSeek." });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));