# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# Gemini Clone with Content Moderation

This project integrates Google's Gemini AI with a Hugging Face hate speech detection model to create a safer AI assistant experience.

## Setup

### Backend (Python Content Moderation Service)

1. Install Python dependencies:
```bash
cd server
pip install -r requirements.txt
```

2. Run the Flask server:
```bash
python hate_speech_detector.py
```
This will start the content moderation service on http://localhost:5000.

### Frontend (React Application)

1. Install Node dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

## How It Works

1. When a user submits a prompt, it's first sent to the content moderation server
2. The hate speech detection model analyzes the content
3. If the content is flagged as offensive or hate speech, a warning is returned
4. If the content passes the check, it's forwarded to the Gemini API for a response