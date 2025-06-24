const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

async function debugParksideSpecific() {
  console.log('=== Debugging Parkside Specific Data ===\n');

  const datasetPath = process.env.PROJECT_DATASET_PATH || './data/projects.csv';
  
  if (!fs.existsSync(datasetPath)) {
    console.error(`❌ CSV file not found at: ${datasetPath}`);
    return;
  }

  return new Promise((resolve, reject) => {
    fs.createReadStream(datasetPath)
      .pipe(csv())
      .on('data', (data) => {
        if (data.name && data.name.toLowerCase().includes('parkside')) {
          console.log('🏠 Found Parkside row!');
          console.log('Name:', data.name);
          console.log('Business Type:', data.business_type);
          console.log('');
          
          // Check all property_types_names fields
          console.log('🔍 Property Types Names Fields:');
          const propertyTypeFields = [
            'property_types_names.Villa',
            'property_types_names.Penthouse', 
            'property_types_names.Apartment',
            'property_types_names.Duplex',
            'property_types_names.Studio',
            'property_types_names.Townhouse',
            'property_types_names.Twinhouse',
            'property_types_names.Loft',
            'property_types_names.Office'
          ];
          
          propertyTypeFields.forEach(field => {
            const value = data[field];
            console.log(`  ${field}: "${value}" (type: ${typeof value})`);
          });
          
          console.log('');
          
          // Check business types fields
          console.log('🔍 Business Types Fields:');
          const businessTypeFields = [
            'business_types.developer_sale',
            'business_types.resale'
          ];
          
          businessTypeFields.forEach(field => {
            const value = data[field];
            console.log(`  ${field}: "${value}" (type: ${typeof value})`);
          });
          
          console.log('');
          
          // Check finishing fields
          console.log('🔍 Finishing Fields:');
          const finishingFields = [
            'finishing.not_finished',
            'finishing.finished',
            'finishing.semi_finished'
          ];
          
          finishingFields.forEach(field => {
            const value = data[field];
            console.log(`  ${field}: "${value}" (type: ${typeof value})`);
          });
          
          console.log('');
          
          // Check property_types array fields
          console.log('🔍 Property Types Array Fields (first 3):');
          for (let i = 0; i < 3; i++) {
            const nameField = `property_types[${i}].name`;
            const idField = `property_types[${i}].property_type_id`;
            const countField = `property_types[${i}].property_types_count`;
            
            console.log(`  ${nameField}: "${data[nameField]}"`);
            console.log(`  ${idField}: "${data[idField]}"`);
            console.log(`  ${countField}: "${data[countField]}"`);
            console.log('');
          }
        }
      })
      .on('end', () => {
        console.log('✅ Debug complete');
        resolve();
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV:', error);
        reject(error);
      });
  });
}

debugParksideSpecific().catch(console.error); 