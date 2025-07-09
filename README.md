# Prompt Filtering for LLM Security

This project implements a comprehensive content moderation system for AI assistants using Google's Gemini AI combined with Hugging Face's hate speech detection models. The system includes thread-based conversation tracking to prevent harmful content circumvention.

## Features

- **Multi-layer Content Moderation**: Combines multiple AI models for comprehensive content filtering
- **Thread-based Tracking**: Tracks conversation threads to prevent circumvention attempts
- **Multi-language Support**: Detects and translates content in multiple languages
- **Real-time Processing**: Flask-based API for real-time content moderation
- **Modern UI**: React-based frontend with clean, responsive design

## Architecture

```
Frontend (React) → Backend (Flask) → Content Moderation Pipeline
                                   ├── Hate Speech Detection (HuggingFace)
                                   ├── Language Detection & Translation
                                   ├── Thread Similarity Analysis
                                   └── Gemini AI Moderation
```

## Setup Instructions

### Prerequisites

- Python 3.8+
- Node.js 14+
- Google Gemini API key

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Gemini API key
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

4. Run the Flask server:
```bash
python hate_speech_detector.py
```

The server will start on `http://localhost:5000`

### Frontend Setup

1. Install Node.js dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Usage

1. Start both the backend and frontend servers
2. Open your browser to `http://localhost:5173`
3. Interact with the AI assistant - harmful content will be automatically flagged
4. The system tracks conversation threads to prevent circumvention attempts

## Content Moderation Pipeline

The system uses a multi-stage approach:

1. **Language Detection**: Detects input language using both `langdetect` and Gemini AI
2. **Translation**: Translates non-English content to English for analysis
3. **Thread Analysis**: Checks if content relates to previously flagged conversations
4. **Hate Speech Detection**: Uses HuggingFace's BERT-based hate speech classifier
5. **Content Moderation**: Additional AI-based content safety checks
6. **Response Filtering**: Moderates AI-generated responses before delivery

## Security Features

- Environment variable-based API key management
- Thread-based conversation tracking
- Multi-model validation for reduced false positives/negatives
- Comprehensive logging for audit trails
- CORS protection for API endpoints

## Development

### Project Structure

```
├── server/                 # Flask backend
│   ├── hate_speech_detector.py
│   ├── requirements.txt
│   └── .env.example
├── src/                   # React frontend
│   ├── components/
│   ├── context/
│   └── assets/
└── public/
```

### Running Tests

```bash
# Backend tests
cd server
python test_server.py

# Frontend tests
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Security Considerations

- Never commit API keys to version control
- Use environment variables for sensitive configuration
- Regularly update dependencies for security patches
- Monitor API usage and implement rate limiting in production

## Troubleshooting

### Common Issues

1. **API Key Error**: Ensure your Gemini API key is correctly set in `.env`
2. **Model Loading Issues**: The hate speech model downloads automatically on first run
3. **CORS Issues**: Make sure both frontend and backend are running on specified ports

### Support

For issues and questions, please create an issue in the GitHub repository.
4. If the content passes the check, it's forwarded to the Gemini API for a response