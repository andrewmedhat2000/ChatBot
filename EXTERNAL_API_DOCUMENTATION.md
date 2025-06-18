# Chat API Documentation

This document describes how to use the chat API endpoints that require API key authentication.

## Base URL
```
http://your-server:3000/api/chat
```

## Authentication

All chat API endpoints require authentication using an API key. Include your API key in the `api-key` header:

```
api-key: YOUR_API_KEY_HERE
```

## Endpoints

### 1. Chat Completion

**Endpoint:** `POST /api/chat/completion`

**Description:** Creates a chat completion using OpenAI's API.

**Headers:**
```
Content-Type: application/json
api-key: YOUR_API_KEY_HERE
```

**Request Body:**
```json
{
  "prompt": "Your prompt text here",
  "instructions": "Optional system instructions",
  "options": {
    "temperature": 0.7,
    "max_tokens": 1000,
    "model": "gpt-4.1"
  },
  "lastResponseId": "optional-response-id-for-conversation-continuity",
  "test": false,
  "projectName": "optional-project-name"
}
```

**Parameters:**
- `prompt` (required): The text prompt to send to the AI
- `instructions` (optional): System instructions for the AI
- `options` (optional): Configuration options
  - `temperature` (optional): Controls randomness (0-2, default: 0.7)
  - `max_tokens` (optional): Maximum tokens in response (1-4000)
  - `model` (optional): AI model to use (default: gpt-4.1)
- `lastResponseId` (optional): ID from previous response for conversation continuity
- `test` (optional): Boolean flag for test mode - returns fixed response when true
- `projectName` (optional): Project name for tracking and organization (can be null)

**Response:**
```json
{
  "success": true,
  "message": "AI response text here",
  "last_response_id": "response-id-for-next-request",
  "project_name": "project-name-or-null"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "type": "error_type",
  "code": "error_code"
}
```

### 2. Health Check

**Endpoint:** `GET /api/chat/health`

**Description:** Check if the chat API is running.

**Headers:**
```
api-key: YOUR_API_KEY_HERE
```

**Response:**
```json
{
  "status": "ok",
  "service": "chat-api",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `authentication_error` | Invalid or missing API key |
| `insufficient_quota` | OpenAI API quota exceeded |
| `server_error` | Internal server error |
| `validation_error` | Invalid request parameters |

## Example Usage

### cURL Example
```bash
curl -X POST http://localhost:3000/api/chat/completion \
  -H "Content-Type: application/json" \
  -H "api-key: YOUR_API_KEY_HERE" \
  -d '{
    "prompt": "What is the capital of France?",
    "options": {
      "temperature": 0.5,
      "max_tokens": 100
    }
  }'
```

### Test Mode Example
```bash
curl -X POST http://localhost:3000/api/chat/completion \
  -H "Content-Type: application/json" \
  -H "api-key: YOUR_API_KEY_HERE" \
  -d '{
    "prompt": "Hello world",
    "test": true
  }'
```

**Test Mode Response:**
```json
{
  "success": true,
  "message": "This is a test response from the OpenAI service. The prompt was: Hello world",
  "last_response_id": "test-response-id-12345"
}
```

### Project Name Example
```bash
curl -X POST http://localhost:3000/api/chat/completion \
  -H "Content-Type: application/json" \
  -H "api-key: YOUR_API_KEY_HERE" \
  -d '{
    "prompt": "Write a function to calculate fibonacci numbers",
    "projectName": "math-library",
    "options": {
      "temperature": 0.3,
      "max_tokens": 200
    }
  }'
```

**Project Name Response:**
```json
{
  "success": true,
  "message": "Here's a function to calculate Fibonacci numbers...",
  "last_response_id": "abc123def456",
  "project_name": "math-library"
}
```

### JavaScript Example
```javascript
const response = await fetch('http://localhost:3000/api/chat/completion', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'api-key': 'YOUR_API_KEY_HERE'
  },
  body: JSON.stringify({
    prompt: 'What is the capital of France?',
    options: {
      temperature: 0.5,
      max_tokens: 100
    }
  })
});

const result = await response.json();
console.log(result.data);
```

### Python Example
```python
import requests

url = 'http://localhost:3000/api/chat/completion'
headers = {
    'Content-Type': 'application/json',
    'api-key': 'YOUR_API_KEY_HERE'
}
data = {
    'prompt': 'What is the capital of France?',
    'options': {
        'temperature': 0.5,
        'max_tokens': 100
    }
}

response = requests.post(url, headers=headers, json=data)
result = response.json()
print(result['data'])
```

## Rate Limiting

Currently, there are no rate limits implemented, but this may be added in future versions.

## Security Notes

1. Keep your API key secure and never expose it in client-side code
2. Use HTTPS in production environments
3. Rotate your API key regularly
4. Monitor API usage for unusual patterns

## Environment Variables

Make sure the following environment variable is set on the server:

```
EXTERNAL_API_KEY=your-secure-api-key-here
```

## Support

For issues or questions, please check the server logs or contact the system administrator. 