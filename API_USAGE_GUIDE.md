# API Usage Guide

## JSON Format Requirements

### ✅ Correct JSON Format

```json
{
  "prompt": "give me more cheaper one",
  "test": 0,
  "projectName": "o west orascom",
  "lastResponseId": "resp_6853dc789030819fac06ae208e51f69308a81a3dcfab2b64"
}
```

### ❌ Common JSON Errors

**1. Trailing Comma Error:**
```json
{
  "prompt": "give me more cheaper one",
  "test": 0,
  "projectName": "o west orascom",
  "lastResponseId": "resp_6853dc789030819fac06ae208e51f69308a81a3dcfab2b64",  // ❌ Remove this comma
}
```

**2. Extra Newlines:**
```json
{
  "prompt": "give me more cheaper one",
  "test": 0,
  "projectName": "o west orascom",
  "lastResponseId": "resp_6853dc789030819fac06ae208e51f69308a81a3dcfab2b64"

}  // ❌ Remove extra newline
```

**3. Missing Quotes:**
```json
{
  "prompt": "give me more cheaper one",
  "test": 0,
  projectName: "o west orascom",  // ❌ Missing quotes
  "lastResponseId": "resp_6853dc789030819fac06ae208e51f69308a81a3dcfab2b64"
}
```

## API Endpoints

### Chat Completion with Dataset

**Endpoint:** `POST /api/chat/completion`

**Headers:**
```
Content-Type: application/json
X-API-Key: your_api_key_here
```

**Request Body:**
```json
{
  "prompt": "Tell me about projects in New Cairo",
  "projectName": "O West Orascom",
  "test": false,
  "options": {
    "temperature": 0.7
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "AI response with dataset context",
  "last_response_id": "response_id",
  "project_name": "O West Orascom",
  "dataset_used": true,
  "context_info": "Market Overview: 36 total projects available. 1 relevant projects found. 3 similar alternatives available."
}
```

### Dataset Search

**Endpoint:** `POST /api/dataset/search`

**Request Body:**
```json
{
  "query": "New Cairo",
  "filters": {
    "price_min": 2000000,
    "price_max": 4000000,
    "bedrooms": 3,
    "financing_eligibility": true
  }
}
```

## Testing Your JSON

### Online JSON Validator
Use tools like:
- [JSONLint](https://jsonlint.com/)
- [JSON Editor Online](https://jsoneditoronline.org/)

### cURL Example
```bash
curl -X POST http://localhost:3000/api/chat/completion \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "prompt": "give me more cheaper one",
    "test": 0,
    "projectName": "o west orascom"
  }'
```

### JavaScript Example
```javascript
const response = await fetch('/api/chat/completion', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your_api_key'
  },
  body: JSON.stringify({
    prompt: "give me more cheaper one",
    test: 0,
    projectName: "o west orascom"
  })
});
```

## Common Issues and Solutions

### 1. "Expected double-quoted property name"
- **Cause:** Missing quotes around property names
- **Solution:** Ensure all property names are in double quotes

### 2. "Unexpected token"
- **Cause:** Trailing commas or extra characters
- **Solution:** Remove trailing commas and extra characters

### 3. "Unexpected end of JSON input"
- **Cause:** Incomplete JSON or missing closing braces
- **Solution:** Check that all objects and arrays are properly closed

## Best Practices

1. **Use a JSON formatter** to validate your JSON before sending
2. **Remove trailing commas** - they're not allowed in JSON
3. **Use double quotes** for all strings and property names
4. **Test with simple examples** first before complex requests
5. **Check your Content-Type header** is set to `application/json` 