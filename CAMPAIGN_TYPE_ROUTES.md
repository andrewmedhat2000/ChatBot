# Campaign Type Support in Routes

This document describes how to use the campaign type feature in the API routes for separating primary properties (developer sales) and resale properties.

## Overview

The API now supports two campaign types:
- **`Primary`**: Loads only developer_sale properties (primary units)
- **`Resale`**: Loads only resale properties (secondary market)

## Chat Routes

### POST `/api/chat/completion`

**Request Body:**
```json
{
  "prompt": "How many apartments are available?",
  "projectName": "o west orascom",
  "campaignType": "Primary",
  "instructions": "Optional custom instructions",
  "options": {
    "temperature": 0.7,
    "max_tokens": 1000
  },
  "lastResponseId": "optional-previous-response-id",
  "test": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Based on the data filtered for business_type: 'developer_sale' (primary units only), there are 25 apartment units available in o west orascom...",
  "last_response_id": "abc123",
  "project_name": "o west orascom",
  "dataset_used": true,
  "context_info": "Dataset context information",
  "phase": 1,
  "campaign_type": "Primary"
}
```

## Dataset Routes

### POST `/api/dataset/search`

**Request Body:**
```json
{
  "query": "apartments",
  "campaignType": "Primary",
  "filters": {
    "price_min": 1000000,
    "price_max": 5000000,
    "bedrooms": 2
  }
}
```

**Response:**
```json
{
  "success": true,
  "projects": [...],
  "count": 45,
  "total": 561
}
```

### POST `/api/dataset/project`

**Request Body:**
```json
{
  "projectName": "o west orascom",
  "campaignType": "Primary"
}
```

**Response:**
```json
{
  "success": true,
  "project": {
    "name": "o west orascom",
    "developer_name": "Orascom Development Egypt",
    "area_name": "October Gardens",
    "business_type": "developer_sale",
    "property_types": [...]
  }
}
```

### POST `/api/dataset/properties`

**Request Body:**
```json
{
  "projectName": "o west orascom",
  "propertyType": "Apartment",
  "businessType": "primary",
  "campaignType": "Primary",
  "filters": {
    "price_min": 1000000,
    "price_max": 5000000
  }
}
```

**Response:**
```json
{
  "success": true,
  "properties": [...],
  "count": 25,
  "total": 25,
  "filters": {
    "projectName": "o west orascom",
    "propertyType": "Apartment",
    "businessType": "primary",
    "campaignType": "Primary",
    "price_min": 1000000,
    "price_max": 5000000
  }
}
```

### POST `/api/dataset/load`

**Request Body:**
```json
{
  "campaignType": "Primary"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Primary dataset loaded successfully",
  "count": 561,
  "campaignType": "Primary"
}
```

### POST `/api/dataset/similar`

**Request Body:**
```json
{
  "projectName": "o west orascom",
  "limit": 3,
  "campaignType": "Primary"
}
```

**Response:**
```json
{
  "success": true,
  "projects": [...]
}
```

### POST `/api/dataset/compare`

**Request Body:**
```json
{
  "projectNames": ["o west orascom", "beit al bahr"],
  "campaignType": "Primary"
}
```

**Response:**
```json
{
  "success": true,
  "projects": [...]
}
```

### POST `/api/dataset/property-types`

**Request Body:**
```json
{
  "projectName": "o west orascom",
  "campaignType": "Primary"
}
```

**Response:**
```json
{
  "success": true,
  "propertyTypes": [...],
  "count": 8,
  "campaignType": "Primary"
}
```

## Validation

All routes validate the `campaignType` parameter to ensure it's one of the allowed values:
- `Primary`
- `Resale`

**Error Response for Invalid Campaign Type:**
```json
{
  "success": false,
  "errors": [
    {
      "type": "field",
      "value": "invalid",
      "msg": "Campaign type must be one of: Primary, Resale",
      "path": "campaignType",
      "location": "body"
    }
  ]
}
```

## Usage Examples

### Primary Campaign (Developer Sales)
```bash
curl -X POST http://localhost:3000/api/chat/completion \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What apartments are available?",
    "projectName": "o west orascom",
    "campaignType": "Primary"
  }'
```

### Resale Campaign (Secondary Market)
```bash
curl -X POST http://localhost:3000/api/chat/completion \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What resale properties are available?",
    "projectName": "o west orascom",
    "campaignType": "Resale"
  }'
```

## Benefits

1. **Campaign-Specific Responses**: AI responses are tailored to the campaign type
2. **Filtered Data**: Only relevant properties are loaded based on campaign type
3. **Accurate Statistics**: Property counts reflect only the campaign-specific data
4. **Performance**: Smaller, focused datasets load faster
5. **Real-World Accuracy**: Reflects actual primary vs secondary market separation

## Migration Guide

### For Existing Clients

1. **Breaking Changes**: Campaign type is now required and must be capitalized
2. **Required Parameter**: `campaignType` is now required in all routes
3. **New Values**: Use `Primary` for developer sales, `Resale` for secondary market

### For New Implementations

1. **Add Campaign Type**: Include `campaignType` parameter in requests
2. **Choose Appropriate Type**: Use `Primary` for developer sales, `Resale` for secondary market
3. **Handle Responses**: Check `campaign_type` field in responses for confirmation

## Testing

Use the provided test script to verify campaign type functionality:

```bash
node test-campaign-type-routes.js
```

This will test all routes with different campaign types and validate the responses. 