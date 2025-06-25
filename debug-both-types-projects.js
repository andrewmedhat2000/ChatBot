// Debug script to show projects with both developer_sale and resale properties
const fs = require('fs');
const csv = require('csv-parser');

async function debugBothTypesProjects() {
  console.log('🔍 Debug: Projects with Both Developer Sale and Resale Properties\n');

  const datasetPath = './data/projects.csv';
  
  if (!fs.existsSync(datasetPath)) {
    console.error(`❌ Dataset file not found at: ${datasetPath}`);
    return;
  }

  const bothTypesProjects = [];
  let totalBothTypes = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream(datasetPath)
      .pipe(csv())
      .on('data', (data) => {
        // Check business type counts
        const developerSaleCount = parseInt(data['business_types.developer_sale']) || 0;
        const resaleCount = parseInt(data['business_types.resale']) || 0;
        
        // Check individual properties
        let hasDeveloperSaleProperty = false;
        let hasResaleProperty = false;
        let developerSaleProperties = [];
        let resaleProperties = [];
        
        for (let i = 0; i < 8; i++) {
          for (let j = 0; j < 30; j++) {
            const businessTypeField = `property_types[${i}].properties[${j}].business_type`;
            const propertyTypeField = `property_types[${i}].name`;
            const priceField = `property_types[${i}].properties[${j}].price`;
            
            if (data[businessTypeField]) {
              const businessType = data[businessTypeField].trim();
              const propertyType = data[propertyTypeField] || 'Unknown';
              const price = data[priceField] || 'N/A';
              
              if (businessType === 'developer_sale') {
                hasDeveloperSaleProperty = true;
                developerSaleProperties.push({
                  type: propertyType,
                  price: price
                });
              } else if (businessType === 'resale') {
                hasResaleProperty = true;
                resaleProperties.push({
                  type: propertyType,
                  price: price
                });
              }
            }
          }
        }
        
        // Check if project has both types
        const hasPrimary = developerSaleCount > 0 || hasDeveloperSaleProperty;
        const hasResale = resaleCount > 0 || hasResaleProperty;
        
        if (hasPrimary && hasResale) {
          totalBothTypes++;
          if (bothTypesProjects.length < 10) {
            bothTypesProjects.push({
              name: data.name,
              developer: data.developer_name,
              area: data.area_name,
              developerSaleCount,
              resaleCount,
              developerSaleProperties: developerSaleProperties.slice(0, 3), // Show first 3
              resaleProperties: resaleProperties.slice(0, 3), // Show first 3
              totalDeveloperSaleProperties: developerSaleProperties.length,
              totalResaleProperties: resaleProperties.length
            });
          }
        }
      })
      .on('end', () => {
        console.log(`📊 Found ${totalBothTypes} projects with both developer_sale and resale properties\n`);
        
        console.log('🔍 Examples of Projects with Both Types:');
        console.log('═'.repeat(80));
        
        bothTypesProjects.forEach((project, index) => {
          console.log(`${index + 1}. ${project.name}`);
          console.log(`   Developer: ${project.developer}`);
          console.log(`   Area: ${project.area}`);
          console.log(`   Business Types Count - Developer Sale: ${project.developerSaleCount}, Resale: ${project.resaleCount}`);
          console.log(`   Total Properties - Developer Sale: ${project.totalDeveloperSaleProperties}, Resale: ${project.totalResaleProperties}`);
          console.log('');
          
          if (project.developerSaleProperties.length > 0) {
            console.log(`   📋 Developer Sale Properties (${project.totalDeveloperSaleProperties} total):`);
            project.developerSaleProperties.forEach((prop, i) => {
              console.log(`      ${i + 1}. ${prop.type} - ${prop.price}`);
            });
            console.log('');
          }
          
          if (project.resaleProperties.length > 0) {
            console.log(`   📋 Resale Properties (${project.totalResaleProperties} total):`);
            project.resaleProperties.forEach((prop, i) => {
              console.log(`      ${i + 1}. ${prop.type} - ${prop.price}`);
            });
            console.log('');
          }
          
          console.log('   🎯 This project appears in BOTH datasets:');
          console.log('      • Primary Dataset (developer_sale campaign)');
          console.log('      • Resale Dataset (resale campaign)');
          console.log('─'.repeat(80));
          console.log('');
        });
        
        console.log('📋 How This Works in Practice:');
        console.log('');
        console.log('1. When campaignType = "primary":');
        console.log('   • Loads primary_properties.csv');
        console.log('   • Shows only developer_sale properties from this project');
        console.log('   • Ignores resale properties');
        console.log('');
        console.log('2. When campaignType = "resale":');
        console.log('   • Loads resale_properties.csv');
        console.log('   • Shows only resale properties from this project');
        console.log('   • Ignores developer_sale properties');
        console.log('');
        console.log('3. Benefits:');
        console.log('   • Clean separation of property types');
        console.log('   • No cross-contamination in responses');
        console.log('   • Campaign-specific data filtering');
        console.log('   • Accurate property counts per campaign type');
        
        resolve();
      })
      .on('error', (error) => {
        console.error('❌ Error reading dataset:', error);
        reject(error);
      });
  });
}

// Run the debug
debugBothTypesProjects().catch(console.error); 