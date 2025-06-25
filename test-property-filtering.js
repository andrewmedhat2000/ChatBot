// Test script to verify property-level filtering in dataset creation
const datasetService = require('./src/services/datasetService');
const fs = require('fs');
const csv = require('csv-parser');

async function testPropertyFiltering() {
  console.log('🧪 Testing Property-Level Filtering in Dataset Creation\n');

  try {
    // Force recreation of datasets
    console.log('📋 Step 1: Recreating datasets with property-level filtering...');
    
    // Delete existing datasets to force recreation
    if (fs.existsSync('./data/primary_properties.csv')) {
      fs.unlinkSync('./data/primary_properties.csv');
    }
    if (fs.existsSync('./data/resale_properties.csv')) {
      fs.unlinkSync('./data/resale_properties.csv');
    }

    // Recreate datasets
    const result = await datasetService.createSeparateDatasets();
    console.log('Dataset creation result:', result);
    console.log('');

    // Test 2: Analyze the filtered datasets
    console.log('📋 Step 2: Analyzing filtered datasets...');
    
    const primaryAnalysis = await analyzeDataset('./data/primary_properties.csv', 'developer_sale');
    const resaleAnalysis = await analyzeDataset('./data/resale_properties.csv', 'resale');

    console.log('🔍 Primary Dataset Analysis:');
    console.log('─'.repeat(50));
    console.log(`Total Projects: ${primaryAnalysis.totalProjects}`);
    console.log(`Projects with developer_sale properties: ${primaryAnalysis.matchingProjects}`);
    console.log(`Projects with resale properties: ${primaryAnalysis.nonMatchingProjects}`);
    console.log(`Sample project: ${primaryAnalysis.sampleProject}`);
    console.log('');

    console.log('🔍 Resale Dataset Analysis:');
    console.log('─'.repeat(50));
    console.log(`Total Projects: ${resaleAnalysis.totalProjects}`);
    console.log(`Projects with resale properties: ${resaleAnalysis.matchingProjects}`);
    console.log(`Projects with developer_sale properties: ${resaleAnalysis.nonMatchingProjects}`);
    console.log(`Sample project: ${resaleAnalysis.sampleProject}`);
    console.log('');

    // Test 3: Verify property filtering
    console.log('📋 Step 3: Verifying property filtering...');
    await verifyPropertyFiltering();

    console.log('✅ Property-level filtering test completed successfully!');

  } catch (error) {
    console.error('❌ Error in property filtering test:', error);
  }
}

async function analyzeDataset(filePath, expectedBusinessType) {
  return new Promise((resolve, reject) => {
    let totalProjects = 0;
    let matchingProjects = 0;
    let nonMatchingProjects = 0;
    let sampleProject = '';

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        totalProjects++;
        
        if (!sampleProject) {
          sampleProject = data.name || 'Unknown';
        }

        // Check business type counts
        const developerSaleCount = parseInt(data['business_types.developer_sale']) || 0;
        const resaleCount = parseInt(data['business_types.resale']) || 0;

        if (expectedBusinessType === 'developer_sale') {
          if (developerSaleCount > 0) matchingProjects++;
          if (resaleCount > 0) nonMatchingProjects++;
        } else {
          if (resaleCount > 0) matchingProjects++;
          if (developerSaleCount > 0) nonMatchingProjects++;
        }
      })
      .on('end', () => {
        resolve({
          totalProjects,
          matchingProjects,
          nonMatchingProjects,
          sampleProject
        });
      })
      .on('error', reject);
  });
}

async function verifyPropertyFiltering() {
  console.log('🔍 Verifying individual property filtering...');
  
  // Check a specific project that should have both types
  const projectName = 'o west orascom';
  
  // Load datasets
  await datasetService.loadPrimaryDataset();
  await datasetService.loadResaleDataset();
  
  // Get properties for this project from both datasets
  const primaryProperties = await datasetService.getProperties(projectName, null, 'developer_sale');
  const resaleProperties = await datasetService.getProperties(projectName, null, 'resale');
  
  console.log(`📊 ${projectName} Property Analysis:`);
  console.log(`   Primary Dataset Properties: ${primaryProperties.count}`);
  console.log(`   Resale Dataset Properties: ${resaleProperties.count}`);
  
  // Verify no cross-contamination
  const primaryHasResale = primaryProperties.properties.some(p => p.business_type === 'resale');
  const resaleHasPrimary = resaleProperties.properties.some(p => p.business_type === 'developer_sale');
  
  console.log(`   Primary dataset has resale properties: ${primaryHasResale ? '❌' : '✅'}`);
  console.log(`   Resale dataset has primary properties: ${resaleHasPrimary ? '❌' : '✅'}`);
  
  if (!primaryHasResale && !resaleHasPrimary) {
    console.log('✅ Property filtering is working correctly!');
  } else {
    console.log('❌ Property filtering has issues!');
  }
}

// Run the test
testPropertyFiltering().catch(console.error); 