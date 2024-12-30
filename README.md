# boring.interview

![License](https://img.shields.io/github/license/yordlejason/boring.interview)
![Version](https://img.shields.io/github/v/release/yordlejason/boring.interview)

boring.interview is designed to solve the coding questions through the integration of OCR and generative AI assistance. 

## How It Works:
1.	Screen Sharing: Share your screen to capture coding challenges or problems displayed in any application.
2.	OCR & Text Extraction: The app processes the captured screen to extract relevant text.
3.	Solve: Once the text is parsed, boring.interview sends the query to an AI backend for analysis and solution generation.

## Prerequisites

- **Node.js** (LTS recommended, works perfectly well with [v22.7.0](https://nodejs.org/en/blog/release/v22.7.0))
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

3.	Install Frontend Dependencies:
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

2.	Start the Client:
```bash
cd ../client
npm run dev
```

## Usage
1.	Open http://localhost:5173 in your browser.
2.	Click “Start Screen Capture”. Your browser will prompt you to select a screen or window to share.
3.	The application will silently capture the screen every 10 seconds, run OCR, and look for a question.
4.	Otherwise, it sends the question to ChatGPT for an answer.
5.	The recognized text and the final answer (in Markdown) will be displayed on the page.

## Tech Stack
-	Client: React, Vite, TypeScript
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

## License

This project is licensed under the [MIT License](LICENSE).
