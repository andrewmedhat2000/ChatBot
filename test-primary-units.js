const openaiService = require('./src/services/openaiService');

async function testPrimaryUnitsFocus() {
  console.log('=== Testing Primary Units Focus ===\n');

  try {
    // Test 1: Basic context for a project
    console.log('🔍 Test 1: Getting basic context for a project');
    const basicContext = await openaiService.getBasicDatasetContext('I want to know about apartments in New Cairo', 'parkside - owest');
    console.log('Basic Context Success:', basicContext.success);
    console.log('Context Info:', basicContext.contextInfo);
    if (basicContext.success && basicContext.context) {
      console.log('Context includes "PRIMARY UNITS":', basicContext.context.includes('PRIMARY UNITS'));
      console.log('Context includes "resale":', basicContext.context.includes('resale'));
    }
    console.log('');

    // Test 2: Detailed context for a project
    console.log('🔍 Test 2: Getting detailed context for a project');
    const detailedContext = await openaiService.getDetailedDatasetContext('What are the prices and financing options?', 'parkside - owest');
    console.log('Detailed Context Success:', detailedContext.success);
    console.log('Context Info:', detailedContext.contextInfo);
    if (detailedContext.success && detailedContext.context) {
      console.log('Context includes "PRIMARY UNITS":', detailedContext.context.includes('PRIMARY UNITS'));
      console.log('Context includes "resale":', detailedContext.context.includes('resale'));
      console.log('Context includes "developer_sale":', detailedContext.context.includes('developer_sale'));
    }
    console.log('');

    // Test 3: Test chat completion with primary units focus
    console.log('🔍 Test 3: Testing chat completion with primary units focus');
    const chatResult = await openaiService.createChatCompletion(
      'Tell me about apartments in New Cairo',
      {},
      null,
      true, // Use test mode
      'parkside - owest'
    );
    console.log('Chat Result Success:', chatResult.success);
    if (chatResult.success) {
      console.log('Message includes "primary":', chatResult.message.toLowerCase().includes('primary'));
      console.log('Message includes "developer":', chatResult.message.toLowerCase().includes('developer'));
      console.log('Message includes "resale":', chatResult.message.toLowerCase().includes('resale'));
    }
    console.log('');

    console.log('✅ Primary units focus test completed!');

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

// Run the test
testPrimaryUnitsFocus(); 