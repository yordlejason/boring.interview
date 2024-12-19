import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({apiKey: process.env['OPENAI_API_KEY'],});
const pre_prompt = `
You are an AI assistant for software engineers. Given an OCR result of a programming question, follow these steps:

Step 1: Parse the Question
- Extract and clean the question from the raw OCR result.
- Ensure the problem statement is complete, grammatically correct, and unambiguous.
- Identify key requirements, constraints, and input-output formats from the question. If missing, provide the questions that interviees should ask to interviewers.
- Provide 3-5 test cases to validate the solution.

Step 2: Plan the Solution
Provide the plan for the proposed solution. 
- How we want to solve.
- Why we want to solve it that way.
- What data structures and algorithms we will use.

Step 3: Solve the Question
Provide a solution based on Step 2 using Python unless another language is explicitly specified.

Your solution must:
- Include clean, industry-standard code with comments explaining each part.
- Use clear and meaningful variable and function names.
- Handle edge cases effectively.
- Include a section analyzing:
- Time Complexity: Big-O notation with an explanation.
- Space Complexity: Big-O notation with an explanation.`

app.post('/api/ask', async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: "No question provided." });
  }

  try {
    const content = pre_prompt + question
    const response = await openai.chat.completions.create({
      // model: "o1-mini",
      model: "gpt-3.5-turbo-0125",
      messages: [{ role: "user", content: content }],
      // max_completion_tokens: 10000
      max_completion_tokens: 4096
    });

    const answer = response.choices[0].message.content.trim();
    res.json({ answer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching answer from ChatGPT." });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));