# boring.interview

![License](https://img.shields.io/github/license/yordlejason/boring.interview)
![Version](https://img.shields.io/github/v/release/yordlejason/boring.interview)

boring.interview is designed to assist candidates in mastering LeetCode-style technical interview questions. Whether you're a beginner venturing into coding challenges or a seasoned developer aiming to refine your problem-solving skills, boring.interview provides a structured and supportive environment to boost your preparation.

## How It Works:
1.	Screen Sharing: Share your screen to capture coding challenges or problems displayed in any application.
2.	OCR & Text Extraction: The app processes the captured screen to extract relevant text.
3.	Solve: Once the text is parsed, boring.interview sends the query to an AI backend for analysis and solution generation.

## Prerequisites

- **Node.js** (LTS recommended, works perfectly well with [v22.7.0](https://nodejs.org/en/blog/release/v22.7.0))
- **npm** or **yarn** for package management
- **OpenAI API Key**: Obtain at [OpenAI's Website](https://platform.openai.com/)

## Installation

1.	Clone this repository:

```https://github.com/yordlejason/boring.interview.git```

2.	Install Server Dependencies:
```bash
cd server
npm install
```

3.	Add environment variables to `.env` file (in `server/`)
```bash
OPENAI_API_KEY=your_openai_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
PORT=3000
```
If you chose to use single API only, you don't have to fill out the other API Key.

4.	Install Frontend Dependencies:
```bash
cd ../client
npm install
```

## Running the Application
1.	Start the server:
```bash
cd server
npm start
```
The server runs at http://localhost:3000.

2.	Start the client:
```bash
cd ../client
npm run dev
```
The client runs at http://localhost:5173.

## Usage
1.	Open http://localhost:5173 in your browser (Chrome works the best).
3.	Click “Start Screen Capture”. Your browser will prompt you to select a screen or window to share.
4.	The application will silently capture the screen, run OCR, and solve the question.
5.	Final answer will be displayed on the page.

## Tech Stack
-	Client: React, Vite, TypeScript
-	OCR: Tesseract.js (no external OCR API needed)
-	ChatGPT & DeepSeek Integration: OpenAI Node.js SDK
-	Markdown Rendering: react-markdown + remark-gfm

## Troubleshooting
- `Configuration is not a constructor error`: Ensure you have the latest OpenAI Node.js SDK and a compatible Node.js version.
- Permission issues capturing the screen: Verify that the browser supports `getDisplayMedia()` and that you have allowed screen capture.
- No questions detected: Ensure the on-screen text is clearly visible and recognizable by OCR.

## License

This project is licensed under the [MIT License](LICENSE).
