# Dataset Integration Guide

This guide explains how to use the comprehensive project dataset integration feature that allows the AI model to reference a CSV file containing all project data when answering questions.

## Overview

The dataset integration provides:
- **Comprehensive Project Data**: Access to all projects in a CSV file
- **Smart Search**: Find projects based on text queries and filters
- **Similar Projects**: Get recommendations for similar properties
- **Market Insights**: Access to market statistics and trends
- **Project Comparisons**: Compare multiple projects side-by-side

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Prepare Your CSV File

Create a CSV file with the following structure and place it in the `data/` directory:

```csv
name,developer_name,area_name,min_price,max_price,min_area,max_area,min_bedrooms,max_bedrooms,min_bathrooms,max_bathrooms,business_type,property_types_names,finishing,min_delivery_date,max_delivery_date,financing_eligibility,min_installments,max_installments,min_down_payment,max_down_payment,bruchure
"Project Name","Developer Name","Area Name",2500000,4500000,120,200,2,4,2,3,"Residential","Apartment: 150, Villa: 50","Core & Shell: 100, Finished: 100","2024-06-01","2024-12-31","true",50000,150000,10,25,"brochure1.pdf,brochure2.pdf"
```

### 3. Environment Variables

Add the following to your `.env` file:

```env
PROJECT_DATASET_PATH=./data/your_projects.csv
```

## API Endpoints

### 1. Enhanced Chat Completion with Dataset

**Endpoint**: `POST /api/chat/completion`

This endpoint now uses the dataset to provide more comprehensive responses.

**Request Body**:
```json
{
  "prompt": "Tell me about projects in New Cairo",
  "projectName": "optional_project_name",
  "test": false,
  "options": {
    "temperature": 0.7
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "AI response with dataset context",
  "last_response_id": "response_id",
  "project_name": "project_name",
  "dataset_used": true,
  "context_info": "Market Overview: 5 total projects available. 2 relevant projects found. 3 similar alternatives available."
}
```

### 2. Search Projects

**Endpoint**: `POST /api/dataset/search`

**Request Body**:
```json
{
  "query": "New Cairo",
  "filters": {
    "price_min": 2000000,
    "price_max": 4000000,
    "bedrooms": 3,
    "area_name": "New Cairo",
    "financing_eligibility": true
  }
}
```

**Response**:
```json
{
  "success": true,
  "projects": [...],
  "count": 2,
  "total": 5
}
```

### 3. Get Project Details

**Endpoint**: `POST /api/dataset/project`

**Request Body**:
```json
{
  "projectName": "Palm Hills New Cairo"
}
```

### 4. Get Similar Projects

**Endpoint**: `POST /api/dataset/similar`

**Request Body**:
```json
{
  "projectName": "Palm Hills New Cairo",
  "limit": 3
}
```

### 5. Compare Projects

**Endpoint**: `POST /api/dataset/compare`

**Request Body**:
```json
{
  "projectNames": ["Palm Hills New Cairo", "Madinaty", "Rehab City"]
}
```

### 6. Market Insights

**Endpoint**: `GET /api/dataset/insights`

**Response**:
```json
{
  "success": true,
  "insights": {
    "totalProjects": 5,
    "priceRange": {
      "min": 1500000,
      "max": 4500000
    },
    "areas": ["New Cairo", "Madinaty", "Rehab", "6th of October", "Shorouk"],
    "developers": ["Palm Hills Development", "Talaat Moustafa Group", "Al Ahly Sabbour"],
    "financingAvailable": 5,
    "avgPrice": 2800000
  }
}
```

### 7. Dataset Status

**Endpoint**: `GET /api/dataset/status`

**Response**:
```json
{
  "success": true,
  "loaded": true,
  "count": 5,
  "message": "Dataset already loaded"
}
```

## Features

### Smart Search
- **Text Search**: Search across project names, developers, areas, and descriptions
- **Price Filters**: Filter by minimum and maximum price ranges
- **Area Filters**: Filter by property size
- **Bedroom Filters**: Filter by number of bedrooms
- **Location Filters**: Filter by area name
- **Developer Filters**: Filter by developer name
- **Financing Filters**: Filter by financing availability

### Similar Projects Algorithm
The system calculates similarity based on:
- **Price Similarity**: Projects within 30% price range get higher scores
- **Area Similarity**: Properties with similar sizes
- **Location Similarity**: Same area gets bonus points
- **Developer Similarity**: Same developer gets bonus points

### Market Insights
- Total number of projects
- Price ranges across all projects
- Available areas and developers
- Financing statistics
- Average pricing

## Usage Examples

### Example 1: Find Projects in Specific Area
```bash
curl -X POST http://localhost:3000/api/dataset/search \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "query": "New Cairo",
    "filters": {
      "price_min": 2000000,
      "financing_eligibility": true
    }
  }'
```

### Example 2: Get AI Response with Dataset Context
```bash
curl -X POST http://localhost:3000/api/chat/completion \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "prompt": "What are the best projects for families in New Cairo?",
    "projectName": "Palm Hills New Cairo"
  }'
```

### Example 3: Compare Multiple Projects
```bash
curl -X POST http://localhost:3000/api/dataset/compare \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "projectNames": ["Palm Hills New Cairo", "Madinaty", "Rehab City"]
  }'
```

## Benefits

1. **Comprehensive Responses**: AI can reference all available projects
2. **Accurate Comparisons**: Data-driven project comparisons
3. **Market Intelligence**: Access to market insights and trends
4. **Personalized Recommendations**: Smart similar project suggestions
5. **Flexible Search**: Multiple filtering options for precise results

## Error Handling

The system includes comprehensive error handling:
- **Dataset Loading Errors**: Graceful fallback if CSV file is missing
- **Search Errors**: Proper error messages for invalid queries
- **Project Not Found**: Clear messages when projects don't exist
- **Validation Errors**: Input validation with detailed error messages

## Performance Considerations

- Dataset is loaded once and cached in memory
- Search operations are optimized for large datasets
- Similarity calculations are efficient and scalable
- API responses include relevant data only

## Security

- All endpoints require API key authentication
- Input validation prevents malicious requests
- Rate limiting can be implemented as needed
- Sensitive data is not exposed in responses 