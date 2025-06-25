# Campaign Type Datasets

This document describes the implementation of separate datasets for primary properties (developer sales) and resale properties, with automatic property-level filtering.

## Overview

The system now supports two separate datasets:
- **Primary Properties Dataset** (`primary_properties.csv`): Contains only developer_sale properties
- **Resale Properties Dataset** (`resale_properties.csv`): Contains only resale properties

## Key Features

### 1. Property-Level Filtering
- **Individual Property Filtering**: Each dataset contains only properties that match the specific business type
- **No Cross-Contamination**: Properties are filtered at the individual property level, not just at the project level
- **Accurate Counts**: Property type counts are recalculated to reflect only the filtered properties

### 2. Campaign Type Support
- **Primary Campaign**: Uses `primary_properties.csv` with only developer_sale properties
- **Resale Campaign**: Uses `resale_properties.csv` with only resale properties
- **Automatic Selection**: Dataset is automatically selected based on the `campaignType` parameter

### 3. Project Handling
- **Projects with Both Types**: Projects containing both developer_sale and resale properties appear in both datasets
- **Filtered Properties**: Each dataset shows only the relevant properties for that business type
- **Clean Separation**: No mixing of property types between datasets

## Implementation Details

### Dataset Creation Process

The `createSeparateDatasets()` method in `datasetService.js` performs the following steps:

1. **Read Main Dataset**: Processes the original `projects.csv` file
2. **Property-Level Analysis**: Examines each individual property's business type
3. **Filter Properties**: Creates separate rows with only matching properties
4. **Update Counts**: Recalculates property type counts for filtered data
5. **Generate Datasets**: Creates two separate CSV files

### Property Filtering Logic

```javascript
// For each project in the main dataset
const primaryRow = createFilteredRow(data, 'developer_sale');
const resaleRow = createFilteredRow(data, 'resale');

// Only include projects that have properties of the specified type
if (primaryRow) {
  primaryData.push(primaryRow);
}
if (resaleRow) {
  resaleData.push(resaleRow);
}
```

### Business Type Count Updates

When filtering properties, the system:
- Sets non-matching business type counts to 0
- Recalculates property type counts based on filtered properties
- Clears individual property fields that don't match the business type

## Usage

### 1. Loading Datasets

```javascript
const datasetService = require('./src/services/datasetService');

// Load primary dataset (developer_sale properties only)
await datasetService.loadPrimaryDataset();

// Load resale dataset (resale properties only)
await datasetService.loadResaleDataset();

// Load based on campaign type
await datasetService.loadDataset('primary'); // Loads primary_properties.csv
await datasetService.loadDataset('resale');  // Loads resale_properties.csv
```

### 2. OpenAI Service Integration

```javascript
const openaiService = require('./src/services/openaiService');

// For primary properties campaign
const primaryResponse = await openaiService.createChatCompletion(
  'How many apartments are available?',
  { projectName: 'o west orascom' },
  'response-id',
  false,
  'o west orascom',
  'primary' // This loads primary_properties.csv
);

// For resale properties campaign
const resaleResponse = await openaiService.createChatCompletion(
  'What are the resale prices?',
  { projectName: 'o west orascom' },
  'response-id',
  false,
  'o west orascom',
  'resale' // This loads resale_properties.csv
);
```

### 3. Property Queries

```javascript
// Get only developer_sale properties
const primaryProperties = await datasetService.getProperties(
  'o west orascom', 
  null, 
  'developer_sale'
);

// Get only resale properties
const resaleProperties = await datasetService.getProperties(
  'o west orascom', 
  null, 
  'resale'
);
```

## Dataset Statistics

### Current Breakdown
- **Primary Dataset**: 561 projects with developer_sale properties
- **Resale Dataset**: 615 projects with resale properties
- **Overlap**: 276 projects contain both property types
- **Primary Only**: 285 projects with only developer_sale properties
- **Resale Only**: 339 projects with only resale properties

### Property-Level Accuracy
- **No Cross-Contamination**: Each dataset contains only properties of the correct business type
- **Accurate Counts**: Property type counts reflect only the filtered properties
- **Clean Separation**: Complete isolation between primary and resale property data

## Benefits

### 1. Campaign Accuracy
- **Primary Campaigns**: Only show developer_sale properties
- **Resale Campaigns**: Only show resale properties
- **No Confusion**: Clear separation prevents mixing of property types

### 2. Data Integrity
- **Property-Level Filtering**: Individual properties are filtered, not just projects
- **Accurate Counts**: All counts and statistics reflect only the relevant properties
- **Clean Data**: No empty or irrelevant property fields

### 3. Real-World Accuracy
- **Market Reality**: Reflects the actual separation between primary and secondary markets
- **Business Logic**: Aligns with how real estate campaigns are typically structured
- **User Experience**: Provides relevant information based on campaign type

## Migration Guide

### For Existing Code

1. **Update OpenAI Service Calls**:
   ```javascript
   // Old way (combined dataset)
   const response = await openaiService.createChatCompletion(prompt, options, lastResponseId, test, projectName);
   
   // New way (campaign-specific dataset)
   const response = await openaiService.createChatCompletion(prompt, options, lastResponseId, test, projectName, campaignType);
   ```

2. **Specify Campaign Type**:
   - Use `'primary'` for developer_sale properties
   - Use `'resale'` for resale properties

3. **Update Property Queries**:
   ```javascript
   // Old way (all properties)
   const properties = await datasetService.getProperties(projectName);
   
   // New way (filtered by business type)
   const properties = await datasetService.getProperties(projectName, null, businessType);
   ```

### For New Implementations

1. **Always specify campaign type** when calling `createChatCompletion`
2. **Use business type filters** when querying properties
3. **Load appropriate dataset** based on your use case

## Testing

### Test Scripts Available

1. **`test-campaign-type-datasets.js`**: Tests the complete workflow
2. **`test-property-filtering.js`**: Verifies property-level filtering
3. **`debug-property-filtering-details.js`**: Detailed analysis of filtering
4. **`demo-campaign-type-usage.js`**: Usage examples

### Running Tests

```bash
# Test the complete implementation
node test-campaign-type-datasets.js

# Test property filtering specifically
node test-property-filtering.js

# Debug property filtering details
node debug-property-filtering-details.js

# See usage examples
node demo-campaign-type-usage.js
```

## File Structure

```
data/
├── projects.csv                    # Original combined dataset
├── primary_properties.csv         # Filtered dataset (developer_sale only)
└── resale_properties.csv          # Filtered dataset (resale only)

src/services/
├── datasetService.js              # Updated with property filtering
└── openaiService.js               # Updated with campaign type support

tests/
├── test-campaign-type-datasets.js
├── test-property-filtering.js
├── debug-property-filtering-details.js
└── demo-campaign-type-usage.js
```

## Conclusion

The property-level filtering implementation ensures that each dataset contains only the relevant properties for its business type. This provides:

- **Clean separation** between primary and resale markets
- **Accurate property counts** and statistics
- **Campaign-specific data** for better user experience
- **Real-world accuracy** reflecting actual market structure

The system now properly handles projects with both property types by including them in both datasets but with only their relevant properties, ensuring complete data integrity and campaign accuracy. 