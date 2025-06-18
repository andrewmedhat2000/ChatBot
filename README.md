# OpenAI API Integration Service

A Node.js application that provides a secure API wrapper around OpenAI's chat completion service with API key authentication for external services.

## Features

- **Secure Chat API**: Chat completion functionality with API key authentication
- **OpenAI Integration**: Wrapper around OpenAI's chat completion API
- **Request Validation**: Input validation and error handling
- **Logging**: Comprehensive logging with Winston

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```bash
OPENAI_API_KEY=your-openai-api-key
OPENAI_ORG_ID=your-openai-org-id
OPENAI_API_BASE=https://api.openai.com/v1
EXTERNAL_API_KEY=your-secure-external-api-key
PORT=3000
```

3. Start the development server:
```bash
npm run dev
```

4. For production:
```bash
npm start
```

## API Endpoints

### Chat API (API Key Authentication Required)
- `POST /api/chat/completion` - Chat completion endpoint
- `GET /api/chat/health` - Health check endpoint

## Authentication

All chat API endpoints require authentication using the `Authorization` header:
```
Authorization: Bearer YOUR_EXTERNAL_API_KEY
```

## Testing

Run the API tests:
```bash
npm run test:external-api
```

## Available Scripts

- `npm start` - Run the application in production mode
- `npm run dev` - Run the application in development mode with hot-reload
- `npm test` - Run tests
- `npm run test:external-api` - Test API endpoints with authentication

## Project Structure

```
src/
├── index.js              # Main application file
├── routes/
│   └── chatRoutes.js     # Chat API routes with authentication
├── services/
│   └── openaiService.js  # OpenAI service integration
├── middleware/
│   └── apiKeyAuth.js     # API key authentication middleware
├── utils/
│   └── logger.js         # Logging utility
└── config/               # Configuration files
```

## Documentation

For detailed API documentation, see [EXTERNAL_API_DOCUMENTATION.md](./EXTERNAL_API_DOCUMENTATION.md)

## Security

- API keys are validated on every request
- Invalid authentication attempts are logged
- Use HTTPS in production environments
- Rotate API keys regularly 