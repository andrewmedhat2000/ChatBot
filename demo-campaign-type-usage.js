// Demo script showing how to use the new campaign type functionality
const OpenAIService = require('./src/services/openaiService');

async function demoCampaignTypeUsage() {
  console.log('🚀 Demo: Campaign Type Dataset Functionality\n');

  const openaiService = new OpenAIService();

  // Example 1: Primary Campaign
  console.log('📋 Example 1: Primary Campaign (Developer Sales)');
  console.log('─'.repeat(50));
  
  try {
    const primaryResponse = await openaiService.createChatCompletion(
      'How many apartment units are available in O West Orascom?',
      {}, // options
      null, // lastResponseId
      true, // test mode
      'o west orascom', // projectName
      false, // skipProjectPrompt
      'primary' // campaignType
    );

    console.log('✅ Primary Campaign Response:');
    console.log(`Message: ${primaryResponse.message}`);
    console.log(`Campaign Type: ${primaryResponse.campaign_type}`);
    console.log(`Phase: ${primaryResponse.phase}`);
    console.log('');
  } catch (error) {
    console.log('❌ Error in primary campaign:', error.message);
  }

  // Example 2: Resale Campaign
  console.log('📋 Example 2: Resale Campaign (Secondary Market)');
  console.log('─'.repeat(50));
  
  try {
    const resaleResponse = await openaiService.createChatCompletion(
      'What are the prices for apartments in O West Orascom?',
      {}, // options
      null, // lastResponseId
      true, // test mode
      'o west orascom', // projectName
      false, // skipProjectPrompt
      'resale' // campaignType
    );

    console.log('✅ Resale Campaign Response:');
    console.log(`Message: ${resaleResponse.message}`);
    console.log(`Campaign Type: ${resaleResponse.campaign_type}`);
    console.log(`Phase: ${resaleResponse.phase}`);
    console.log('');
  } catch (error) {
    console.log('❌ Error in resale campaign:', error.message);
  }

  // Example 3: Follow-up question with primary campaign
  console.log('📋 Example 3: Follow-up Question (Primary Campaign)');
  console.log('─'.repeat(50));
  
  try {
    const followUpResponse = await openaiService.createChatCompletion(
      'What are the delivery dates for these units?',
      {}, // options
      'mock-response-id', // lastResponseId
      true, // test mode
      'o west orascom', // projectName
      false, // skipProjectPrompt
      'primary' // campaignType
    );

    console.log('✅ Follow-up Response:');
    console.log(`Message: ${followUpResponse.message}`);
    console.log(`Campaign Type: ${followUpResponse.campaign_type}`);
    console.log(`Phase: ${followUpResponse.phase}`);
    console.log('');
  } catch (error) {
    console.log('❌ Error in follow-up question:', error.message);
  }

  console.log('🎯 Key Features Demonstrated:');
  console.log('• Separate datasets for primary and resale properties');
  console.log('• Campaign type parameter controls which dataset to load');
  console.log('• Automatic filtering based on business_type');
  console.log('• Consistent messaging based on campaign type');
  console.log('• No cross-contamination between property types');
}

// Run the demo
demoCampaignTypeUsage().catch(console.error); 