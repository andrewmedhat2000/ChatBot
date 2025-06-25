// Debug script to understand dataset breakdown
const fs = require('fs');
const csv = require('csv-parser');

async function debugDatasetBreakdown() {
  console.log('🔍 Debug: Dataset Breakdown Analysis\n');

  const datasetPath = './data/projects.csv';
  
  if (!fs.existsSync(datasetPath)) {
    console.error(`❌ Dataset file not found at: ${datasetPath}`);
    return;
  }

  let totalRows = 0;
  let primaryProjects = 0;
  let resaleProjects = 0;
  let bothTypesProjects = 0;
  let neitherTypeProjects = 0;
  
  const primaryDetails = [];
  const resaleDetails = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(datasetPath)
      .pipe(csv())
      .on('data', (data) => {
        totalRows++;
        
        // Check business type counts
        const developerSaleCount = parseInt(data['business_types.developer_sale']) || 0;
        const resaleCount = parseInt(data['business_types.resale']) || 0;
        
        // Check individual properties
        let hasDeveloperSaleProperty = false;
        let hasResaleProperty = false;
        
        for (let i = 0; i < 8; i++) {
          for (let j = 0; j < 30; j++) {
            const businessTypeField = `property_types[${i}].properties[${j}].business_type`;
            if (data[businessTypeField]) {
              const businessType = data[businessTypeField].trim();
              if (businessType === 'developer_sale') {
                hasDeveloperSaleProperty = true;
              } else if (businessType === 'resale') {
                hasResaleProperty = true;
              }
            }
          }
        }
        
        // Determine project type
        const hasPrimary = developerSaleCount > 0 || hasDeveloperSaleProperty;
        const hasResale = resaleCount > 0 || hasResaleProperty;
        
        if (hasPrimary && hasResale) {
          bothTypesProjects++;
        } else if (hasPrimary) {
          primaryProjects++;
          if (primaryDetails.length < 5) {
            primaryDetails.push({
              name: data.name,
              developerSaleCount,
              resaleCount,
              hasDeveloperSaleProperty,
              hasResaleProperty
            });
          }
        } else if (hasResale) {
          resaleProjects++;
          if (resaleDetails.length < 5) {
            resaleDetails.push({
              name: data.name,
              developerSaleCount,
              resaleCount,
              hasDeveloperSaleProperty,
              hasResaleProperty
            });
          }
        } else {
          neitherTypeProjects++;
        }
      })
      .on('end', () => {
        console.log('📊 Dataset Breakdown:');
        console.log('═'.repeat(60));
        console.log(`Total Projects: ${totalRows}`);
        console.log(`Primary Only: ${primaryProjects}`);
        console.log(`Resale Only: ${resaleProjects}`);
        console.log(`Both Types: ${bothTypesProjects}`);
        console.log(`Neither Type: ${neitherTypeProjects}`);
        console.log('');
        
        console.log('🔍 Primary Projects (Developer Sale Only):');
        console.log('─'.repeat(40));
        primaryDetails.forEach((detail, index) => {
          console.log(`${index + 1}. ${detail.name}`);
          console.log(`   Business Types Count - Developer Sale: ${detail.developerSaleCount}, Resale: ${detail.resaleCount}`);
          console.log(`   Individual Properties - Developer Sale: ${detail.hasDeveloperSaleProperty}, Resale: ${detail.hasResaleProperty}`);
          console.log('');
        });
        
        console.log('🔍 Resale Projects (Resale Only):');
        console.log('─'.repeat(40));
        resaleDetails.forEach((detail, index) => {
          console.log(`${index + 1}. ${detail.name}`);
          console.log(`   Business Types Count - Developer Sale: ${detail.developerSaleCount}, Resale: ${detail.resaleCount}`);
          console.log(`   Individual Properties - Developer Sale: ${detail.hasDeveloperSaleProperty}, Resale: ${detail.hasResaleProperty}`);
          console.log('');
        });
        
        console.log('📋 Summary:');
        console.log('• Each row in the CSV represents ONE PROJECT');
        console.log('• A project can have multiple properties with different business types');
        console.log('• Primary dataset includes projects that have ANY developer_sale properties');
        console.log('• Resale dataset includes projects that have ANY resale properties');
        console.log('• Some projects appear in both datasets if they have both types');
        console.log('');
        console.log(`Expected Primary Dataset Size: ${primaryProjects + bothTypesProjects}`);
        console.log(`Expected Resale Dataset Size: ${resaleProjects + bothTypesProjects}`);
        
        resolve();
      })
      .on('error', (error) => {
        console.error('❌ Error reading dataset:', error);
        reject(error);
      });
  });
}

// Run the debug
debugDatasetBreakdown().catch(console.error); 