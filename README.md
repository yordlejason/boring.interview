# CodeAssist

This application captures your screen, extracts text via OCR, identifies questions, and provides answers.

## Features

- **Automatic Full-Screen OCR**: Continuously captures and processes the entire screen, no manual region selection required.
- **Periodic OCR Analysis**: Every few seconds, the app takes a snapshot and extracts text.
- **Local Question Solver**: Quick responses for known queries (e.g., "What time is it?").
- **ChatGPT Integration**: For unknown questions, queries ChatGPT via the OpenAI API.
- **Markdown Rendering**: Answers are displayed with rich formatting using `react-markdown` and `remark-gfm`.

## Prerequisites

- **Node.js** (LTS recommended, e.g., Node 18 or 20)
- **npm** or **yarn** for package management
- **OpenAI API Key**: Obtain at [OpenAI's Website](https://platform.openai.com/)

## Project Structure
```
your_project/
├─ server/
│  ├─ .env
│  ├─ package.json
│  └─ server.js
└─ client/
├─ index.html
├─ package.json
├─ vite.config.ts
└─ src/
├─ App.tsx
├─ main.tsx
└─ style.css
```

### `.env` file (in `server/`)
```bash
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
```

## Installation

1.	Clone this repository:

```git clone https://github.com/yourusername/screen-capture-ocr.git```

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

## Technologies Used
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