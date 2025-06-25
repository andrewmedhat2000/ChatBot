// Test script to verify dataset service functionality
const datasetService = require('./src/services/datasetService');

async function testDatasetService() {
  console.log('🧪 Testing Dataset Service Functionality\n');

  try {
    // Test 1: Load primary dataset
    console.log('📋 Test 1: Loading Primary Dataset');
    console.log('─'.repeat(50));
    
    const primaryResult = await datasetService.loadDataset('primary');
    console.log('Primary Dataset Result:', primaryResult);
    
    if (primaryResult.success) {
      console.log(`✅ Primary dataset loaded successfully with ${primaryResult.count} projects`);
      console.log(`Campaign Type: ${primaryResult.campaignType}`);
    } else {
      console.log(`❌ Failed to load primary dataset: ${primaryResult.error}`);
    }
    
    console.log('');

    // Test 2: Load resale dataset
    console.log('📋 Test 2: Loading Resale Dataset');
    console.log('─'.repeat(50));
    
    const resaleResult = await datasetService.loadDataset('resale');
    console.log('Resale Dataset Result:', resaleResult);
    
    if (resaleResult.success) {
      console.log(`✅ Resale dataset loaded successfully with ${resaleResult.count} projects`);
      console.log(`Campaign Type: ${resaleResult.campaignType}`);
    } else {
      console.log(`❌ Failed to load resale dataset: ${resaleResult.error}`);
    }
    
    console.log('');

    // Test 3: Load combined dataset
    console.log('📋 Test 3: Loading Combined Dataset');
    console.log('─'.repeat(50));
    
    const combinedResult = await datasetService.loadDataset('combined');
    console.log('Combined Dataset Result:', combinedResult);
    
    if (combinedResult.success) {
      console.log(`✅ Combined dataset loaded successfully with ${combinedResult.count} projects`);
      console.log(`Campaign Type: ${combinedResult.campaignType}`);
    } else {
      console.log(`❌ Failed to load combined dataset: ${combinedResult.error}`);
    }
    
    console.log('');

    // Test 4: Check dataset status
    console.log('📋 Test 4: Dataset Status');
    console.log('─'.repeat(50));
    
    const statusResult = await datasetService.getDatasetStatus();
    console.log('Dataset Status:', statusResult);
    
    if (statusResult.success) {
      console.log(`✅ Dataset status retrieved successfully`);
      console.log(`Loaded: ${statusResult.loaded}`);
      console.log(`Count: ${statusResult.count}`);
      console.log(`File exists: ${statusResult.fileExists}`);
    } else {
      console.log(`❌ Failed to get dataset status: ${statusResult.error}`);
    }

    console.log('\n🎯 Summary:');
    console.log('• Dataset service supports separate loading for primary and resale properties');
    console.log('• Campaign type parameter controls which dataset to load');
    console.log('• Automatic dataset creation from main dataset');
    console.log('• Backward compatibility with existing code');

  } catch (error) {
    console.error('❌ Error in dataset service test:', error);
  }
}

// Run the test
testDatasetService().catch(console.error); 