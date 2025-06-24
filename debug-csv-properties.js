const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

async function debugCSVProperties() {
  console.log('=== Debugging CSV Properties Structure ===\n');

  const datasetPath = process.env.PROJECT_DATASET_PATH || './data/projects.csv';
  
  if (!fs.existsSync(datasetPath)) {
    console.error(`❌ CSV file not found at: ${datasetPath}`);
    return;
  }

  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(datasetPath)
      .pipe(csv())
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', () => {
        console.log(`✅ CSV loaded with ${results.length} rows\n`);

        // Find parkside row
        const parksideRow = results.find(row => 
          row.name && row.name.toLowerCase().includes('parkside')
        );

        if (parksideRow) {
          console.log('🏠 Found Parkside row:');
          console.log('Name:', parksideRow.name);
          console.log('Business Type:', parksideRow.business_type);
          console.log('');

          // Get all column names
          const columns = Object.keys(parksideRow);
          console.log(`📋 Total columns: ${columns.length}`);
          
          // Look for property-related columns
          const propertyColumns = columns.filter(col => 
            col.toLowerCase().includes('property') ||
            col.toLowerCase().includes('business') ||
            col.toLowerCase().includes('price') ||
            col.toLowerCase().includes('area') ||
            col.toLowerCase().includes('bedroom') ||
            col.toLowerCase().includes('bathroom') ||
            col.toLowerCase().includes('finishing') ||
            col.toLowerCase().includes('resale') ||
            col.toLowerCase().includes('developer_sale')
          );

          console.log('\n🔍 Property-related columns:');
          propertyColumns.forEach(col => {
            const value = parksideRow[col];
            console.log(`  ${col}: "${value}"`);
          });

          // Look for array-like columns that might contain individual properties
          console.log('\n🔍 Array-like columns (containing [ or {):');
          columns.forEach(col => {
            const value = parksideRow[col];
            if (typeof value === 'string' && (value.includes('[') || value.includes('{'))) {
              console.log(`  ${col}:`);
              console.log(`    Value: ${value.substring(0, 200)}${value.length > 200 ? '...' : ''}`);
              try {
                const parsed = JSON.parse(value);
                console.log(`    Parsed type: ${typeof parsed}`);
                if (Array.isArray(parsed)) {
                  console.log(`    Array length: ${parsed.length}`);
                  if (parsed.length > 0) {
                    console.log(`    First item:`, parsed[0]);
                  }
                } else if (typeof parsed === 'object') {
                  console.log(`    Object keys:`, Object.keys(parsed));
                }
              } catch (error) {
                console.log(`    Failed to parse JSON: ${error.message}`);
              }
              console.log('');
            }
          });

          // Look for columns that might contain individual property data
          console.log('\n🔍 Looking for individual property data patterns:');
          const individualPropertyPatterns = [
            'properties[',
            'property[',
            'unit[',
            'apartment[',
            'villa[',
            'resale[',
            'developer_sale['
          ];

          individualPropertyPatterns.forEach(pattern => {
            const matchingColumns = columns.filter(col => col.includes(pattern));
            if (matchingColumns.length > 0) {
              console.log(`\n  Pattern "${pattern}":`);
              matchingColumns.slice(0, 5).forEach(col => {
                const value = parksideRow[col];
                console.log(`    ${col}: "${value}"`);
              });
              if (matchingColumns.length > 5) {
                console.log(`    ... and ${matchingColumns.length - 5} more`);
              }
            }
          });

        } else {
          console.log('❌ Parkside row not found');
        }

        // Check if there are any rows with resale data
        console.log('\n🔍 Looking for any rows with resale data...');
        const resaleRows = results.filter(row => {
          const allValues = Object.values(row).join(' ').toLowerCase();
          return allValues.includes('resale');
        });

        console.log(`✅ Found ${resaleRows.length} rows with resale data`);
        if (resaleRows.length > 0) {
          console.log('\nSample resale rows:');
          resaleRows.slice(0, 3).forEach((row, index) => {
            console.log(`  ${index + 1}. ${row.name}`);
            console.log(`     Business Type: ${row.business_type}`);
            console.log(`     Property Types: ${row.property_types_names}`);
            console.log('');
          });
        }

        resolve();
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV:', error);
        reject(error);
      });
  });
}

debugCSVProperties(); 