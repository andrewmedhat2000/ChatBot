const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

async function debugCSVStructure() {
  console.log('=== Debugging CSV Structure ===\n');

  const datasetPath = process.env.PROJECT_DATASET_PATH || './data/projects.csv';
  
  if (!fs.existsSync(datasetPath)) {
    console.error(`❌ CSV file not found at: ${datasetPath}`);
    return;
  }

  console.log(`📊 Reading CSV file: ${datasetPath}\n`);

  const results = [];
  let rowCount = 0;
  const maxRows = 5; // Only examine first 5 rows

  return new Promise((resolve, reject) => {
    fs.createReadStream(datasetPath)
      .pipe(csv())
      .on('data', (data) => {
        if (rowCount < maxRows) {
          results.push(data);
          rowCount++;
        }
      })
      .on('end', () => {
        console.log(`✅ Read ${results.length} rows from CSV\n`);

        // Examine the first row in detail
        if (results.length > 0) {
          const firstRow = results[0];
          console.log('🔍 First row structure:');
          console.log('All fields:', Object.keys(firstRow));
          console.log('');

          // Look for parkside - owest specifically
          const parksideRow = results.find(row => 
            row.name && row.name.toLowerCase().includes('parkside')
          );

          if (parksideRow) {
            console.log('🏠 Found Parkside row:');
            console.log('Name:', parksideRow.name);
            console.log('Business Type:', parksideRow.business_type);
            console.log('Property Types Names (raw):', parksideRow.property_types_names);
            console.log('Property Types (raw):', parksideRow.property_types);
            console.log('Business Types (raw):', parksideRow.business_types);
            console.log('Finishing (raw):', parksideRow.finishing);
            console.log('');

            // Check if these fields are JSON strings
            console.log('🔍 Checking if fields are JSON strings:');
            
            ['property_types_names', 'property_types', 'business_types', 'finishing'].forEach(field => {
              const value = parksideRow[field];
              console.log(`${field}:`);
              console.log(`  Type: ${typeof value}`);
              console.log(`  Value: ${value}`);
              if (typeof value === 'string') {
                console.log(`  Length: ${value.length}`);
                console.log(`  Starts with [ or {: ${value.startsWith('[') || value.startsWith('{')}`);
                if (value.startsWith('[') || value.startsWith('{')) {
                  try {
                    const parsed = JSON.parse(value);
                    console.log(`  Parsed successfully: ${typeof parsed}`);
                    console.log(`  Parsed value:`, parsed);
                  } catch (error) {
                    console.log(`  Failed to parse JSON: ${error.message}`);
                  }
                }
              }
              console.log('');
            });
          } else {
            console.log('❌ Parkside row not found in first 5 rows');
          }

          // Show sample of all rows
          console.log('📋 Sample of all rows:');
          results.forEach((row, index) => {
            console.log(`Row ${index + 1}: ${row.name}`);
            console.log(`  Business Type: ${row.business_type}`);
            console.log(`  Property Types: ${row.property_types_names || 'undefined'}`);
            console.log(`  Property Types Array: ${row.property_types || 'undefined'}`);
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

// Run the debug
debugCSVStructure().catch(console.error); 