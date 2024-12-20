# boring.interview

boring.interview is an innovative tool designed to simplify the process of solving programming-related challenges through seamless integration of OCR (Optical Character Recognition) and AI-powered assistance. Built with a focus on efficiency, accessibility, and modern design, boring.interview empowers developers to extract, analyze, and solve coding problems directly from their screens in real time.

### Key Features:
- Screen Capture Integration: Effortlessly capture any section of your screen for text recognition, making it ideal for extracting complex coding problems, debugging issues, or understanding code snippets.
- Powerful OCR Processing: Utilizing state-of-the-art OCR technology, boring.interview transforms raw images into clean, structured text to analyze coding challenges effectively.
- AI-Powered Solutions: Powered by OpenAI’s advanced language models, the app provides detailed, step-by-step solutions, including explanations, optimized code, and test cases to validate the results.
- Status Tracking: A clear and intuitive progress tracker allows users to monitor each stage of the process, from screen capture to parsing, AI analysis, and solution delivery.
- Dark Mode: Enhanced accessibility and user experience with a toggleable dark mode for coding enthusiasts who prefer working in low-light environments.

### How It Works:
1.	Screen Sharing: Share your screen to capture coding challenges or problems displayed in any application.
2.	OCR & Text Extraction: The app processes the captured screen to extract relevant text.
3.	AI-Powered Analysis: Once the text is parsed, boring.interview sends the query to an AI backend for analysis and solution generation.
4.	Get Solutions: Receive clear, well-documented solutions, complete with explanations and test cases.

## Who Is It For?

### boring.interview is perfect for:
- Developers and Programmers: Quickly debug, solve, or understand coding problems with minimal effort.
- Students and Learners: Gain a deeper understanding of programming concepts with detailed explanations and real-world examples.
- Technical Interviewees: Practice solving coding challenges with guided support and insights.

### Why boring.interview?

With its streamlined workflow, minimalist UI, and AI-powered capabilities, boring.interview eliminates the friction of manually copying problems or searching for solutions. By focusing on delivering clear, actionable insights, boring.interview becomes an indispensable tool for anyone involved in the world of programming. Whether you’re a professional developer or a curious learner, boring.interview is here to make problem-solving smarter, faster, and easier.

## Features

- **Automatic Full-Screen OCR**: Continuously captures and processes the entire screen, no manual region selection required.
- **Periodic OCR Analysis**: Every few seconds, the app takes a snapshot and extracts text.
- **ChatGPT Integration**: For unknown questions, queries ChatGPT via the OpenAI API.
- **Markdown Rendering**: Answers are displayed with rich formatting using `react-markdown` and `remark-gfm`.

## Prerequisites

- **Node.js** (LTS recommended, e.g., Node 18 or 20)
- **npm** or **yarn** for package management
- **OpenAI API Key**: Obtain at [OpenAI's Website](https://platform.openai.com/)

## Project Structure

### `.env` file (in `server/`)
```bash
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
```

## Installation

1.	Clone this repository:

```https://github.com/yordlejason/boring.interview.git```

2.	Install Server Dependencies:
```bash
cd server
npm install
```

3.	Install Client Dependencies:
```bash
cd ../client
npm install
```

## Running the Application
1.	Start the Backend (Server):
```bash
cd server
npm start
```
The server runs at http://localhost:3000.

2.	Start the Frontend (Client):
```bash
cd ../client
npm run dev
```

## Usage
1.	Open http://localhost:5173 in your browser.
2.	Click “Start Screen Capture”. Your browser will prompt you to select a screen or window to share.
3.	The application will silently capture the screen every 5 seconds, run OCR, and look for a question.
4.	If a known question (e.g., containing “time”) is found, it responds locally.
5.	Otherwise, it sends the question to ChatGPT for an answer.
6.	The recognized text and the final answer (in Markdown) will be displayed on the page.

## Tech Stack
-	Frontend: React, Vite, TypeScript
-	OCR: Tesseract.js (no external OCR API needed)
-	ChatGPT Integration: OpenAI Node.js SDK
-	Markdown Rendering: react-markdown + remark-gfm

## Security & Privacy
- The screen capture is user-initiated. The user must grant permission each time.
- OCR and question extraction happen locally (no OCR data is sent to external services if Tesseract.js is used).
- Questions are sent to the server and then to the OpenAI API for generating answers. Ensure you trust and protect your OpenAI API Key.
- Consider adding authentication, logging, and encryption if deploying publicly.

## Troubleshooting
- `Configuration is not a constructor error`: Ensure you have the latest OpenAI Node.js SDK and a compatible Node.js version.
- Permission issues capturing the screen: Verify that the browser supports `getDisplayMedia()` and that you have allowed screen capture.
- No questions detected: Ensure the on-screen text is clearly visible and recognizable by OCR.
