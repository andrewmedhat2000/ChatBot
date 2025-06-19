# Dataset Integration Setup Guide

This guide explains how to set up and use the new CSV-based project dataset integration.

## Overview

The dataset integration allows the AI model to have continuous access to all project data via a CSV file, enabling:
- **Project Comparisons**: Compare any projects in the dataset
- **Market Intelligence**: Access to comprehensive market data
- **Smart Recommendations**: AI can suggest alternatives based on user preferences
- **Comprehensive Responses**: AI has context about all available projects

## Setup Instructions

### 1. Environment Variables

Add the following to your `.env` file:

```env
# Dataset Configuration
PROJECT_DATASET_PATH=./data/projects.csv
```

### 2. CSV File Structure

The CSV file should be placed in the `data/` directory with the following structure:

```csv
name,developer_name,area_name,min_price,max_price,min_area,max_area,min_bedrooms,max_bedrooms,min_bathrooms,max_bathrooms,business_type,property_types_names,finishing,min_delivery_date,max_delivery_date,financing_eligibility,min_installments,max_installments,min_down_payment,max_down_payment,bruchure
"Project Name","Developer Name","Area Name",2500000,4500000,120,200,2,4,2,3,"Residential","Apartment: 150, Villa: 50","Core & Shell: 100, Finished: 100","2024-06-01","2024-12-31","true",50000,150000,10,25,"brochure1.pdf"
```

### 3. CSV Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| name | String | Project name |
| developer_name | String | Developer company name |
| area_name | String | Location/area name |
| min_price | Number | Minimum price in EGP |
| max_price | Number | Maximum price in EGP |
| min_area | Number | Minimum area in sqm |
| max_area | Number | Maximum area in sqm |
| min_bedrooms | Number | Minimum number of bedrooms |
| max_bedrooms | Number | Maximum number of bedrooms |
| min_bathrooms | Number | Minimum number of bathrooms |
| max_bathrooms | Number | Maximum number of bathrooms |
| business_type | String | Type of business (e.g., "Residential") |
| property_types_names | String | Property types available |
| finishing | String | Finishing options |
| min_delivery_date | Date | Earliest delivery date (YYYY-MM-DD) |
| max_delivery_date | Date | Latest delivery date (YYYY-MM-DD) |
| financing_eligibility | Boolean | Whether financing is available |
| min_installments | Number | Minimum monthly installment |
| max_installments | Number | Maximum monthly installment |
| min_down_payment | Number | Minimum down payment percentage |
| max_down_payment | Number | Maximum down payment percentage |
| bruchure | String | Brochure file names |

## API Endpoints

### Enhanced Chat Completion

The existing chat completion endpoint now includes dataset context:

**Endpoint**: `POST /api/chat/completion`

**Response includes**:
```json
{
  "success": true,
  "message": "AI response with dataset context",
  "last_response_id": "response_id",
  "project_name": "project_name",
  "dataset_used": true,
  "context_info": "Market Overview: 10 total projects available. 2 relevant projects found. 3 similar alternatives available."
}
```

### Dataset Management Endpoints

#### 1. Search Projects
**Endpoint**: `POST /api/dataset/search`
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

#### 2. Get Project Details
**Endpoint**: `POST /api/dataset/project`
```json
{
  "projectName": "O West Orascom"
}
```

#### 3. Get Similar Projects
**Endpoint**: `POST /api/dataset/similar`
```json
{
  "projectName": "O West Orascom",
  "limit": 3
}
```

#### 4. Compare Projects
**Endpoint**: `POST /api/dataset/compare`
```json
{
  "projectNames": ["O West Orascom", "Palm Hills New Cairo", "Madinaty"]
}
```

#### 5. Market Insights
**Endpoint**: `GET /api/dataset/insights`

#### 6. Dataset Status
**Endpoint**: `GET /api/dataset/status`

#### 7. Load Dataset
**Endpoint**: `POST /api/dataset/load`

#### 8. Get All Projects
**Endpoint**: `GET /api/dataset/all`

## Usage Examples

### Example 1: Chat with Dataset Context
```bash
curl -X POST http://localhost:3000/api/chat/completion \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "prompt": "Compare O West Orascom with other projects in New Cairo",
    "projectName": "O West Orascom"
  }'
```

### Example 2: Search for Projects
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

### Example 3: Get Market Insights
```bash
curl -X GET http://localhost:3000/api/dataset/insights \
  -H "X-API-Key: your_api_key"
```

## Benefits

1. **Comprehensive AI Responses**: The AI now has access to all project data
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