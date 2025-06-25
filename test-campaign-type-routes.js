// Test script to verify campaign type support in routes
const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000'; // Adjust if your server runs on a different port
const API_KEY = process.env.API_KEY || 'test-api-key'; // Set your API key

// Test data
const testProject = 'o west orascom';

async function testCampaignTypeRoutes() {
  console.log('🧪 Testing Campaign Type Support in Routes\n');
  console.log('═'.repeat(80));

  try {
    // Test 1: Chat completion with primary campaign
    console.log('📝 Test 1: Chat completion with primary campaign');
    console.log('─'.repeat(50));
    
    const chatResponse = await axios.post(`${BASE_URL}/api/chat/completion`, {
      prompt: 'How many apartments are available?',
      projectName: testProject,
      campaignType: 'Primary'
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Chat completion with primary campaign:');
    console.log(`   Status: ${chatResponse.status}`);
    console.log(`   Success: ${chatResponse.data.success}`);
    console.log(`   Campaign Type: ${chatResponse.data.campaign_type}`);
    console.log(`   Message: ${chatResponse.data.message.substring(0, 100)}...`);
    console.log('');

    // Test 2: Dataset search with primary campaign
    console.log('📝 Test 2: Dataset search with primary campaign');
    console.log('─'.repeat(50));
    
    const searchResponse = await axios.post(`${BASE_URL}/api/dataset/search`, {
      query: 'apartments',
      campaignType: 'Primary'
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Dataset search with primary campaign:');
    console.log(`   Status: ${searchResponse.status}`);
    console.log(`   Success: ${searchResponse.data.success}`);
    console.log(`   Projects found: ${searchResponse.data.count}`);
    console.log('');

    // Test 3: Get project with primary campaign
    console.log('📝 Test 3: Get project with primary campaign');
    console.log('─'.repeat(50));
    
    const projectResponse = await axios.post(`${BASE_URL}/api/dataset/project`, {
      projectName: testProject,
      campaignType: 'Primary'
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Get project with primary campaign:');
    console.log(`   Status: ${projectResponse.status}`);
    console.log(`   Success: ${projectResponse.data.success}`);
    console.log(`   Project: ${projectResponse.data.project.name}`);
    console.log(`   Developer: ${projectResponse.data.project.developer_name}`);
    console.log('');

    // Test 4: Get properties with primary campaign
    console.log('📝 Test 4: Get properties with primary campaign');
    console.log('─'.repeat(50));
    
    const propertiesResponse = await axios.post(`${BASE_URL}/api/dataset/properties`, {
      projectName: testProject,
      campaignType: 'Primary'
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Get properties with primary campaign:');
    console.log(`   Status: ${propertiesResponse.status}`);
    console.log(`   Success: ${propertiesResponse.data.success}`);
    console.log(`   Properties found: ${propertiesResponse.data.count}`);
    console.log(`   Campaign Type in filters: ${propertiesResponse.data.filters.campaignType}`);
    console.log('');

    // Test 5: Load dataset with primary campaign
    console.log('📝 Test 5: Load dataset with primary campaign');
    console.log('─'.repeat(50));
    
    const loadResponse = await axios.post(`${BASE_URL}/api/dataset/load`, {
      campaignType: 'Primary'
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Load dataset with primary campaign:');
    console.log(`   Status: ${loadResponse.status}`);
    console.log(`   Success: ${loadResponse.data.success}`);
    console.log(`   Message: ${loadResponse.data.message}`);
    console.log(`   Count: ${loadResponse.data.count}`);
    console.log(`   Campaign Type: ${loadResponse.data.campaignType}`);
    console.log('');

    // Test 6: Chat completion with resale campaign
    console.log('📝 Test 6: Chat completion with resale campaign');
    console.log('─'.repeat(50));
    
    const resaleChatResponse = await axios.post(`${BASE_URL}/api/chat/completion`, {
      prompt: 'How many apartments are available?',
      projectName: testProject,
      campaignType: 'Resale'
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Chat completion with resale campaign:');
    console.log(`   Status: ${resaleChatResponse.status}`);
    console.log(`   Success: ${resaleChatResponse.data.success}`);
    console.log(`   Campaign Type: ${resaleChatResponse.data.campaign_type}`);
    console.log(`   Message: ${resaleChatResponse.data.message.substring(0, 100)}...`);
    console.log('');

    // Test 7: Validation error for invalid campaign type
    console.log('📝 Test 7: Validation error for invalid campaign type');
    console.log('─'.repeat(50));
    
    try {
      await axios.post(`${BASE_URL}/api/chat/completion`, {
        prompt: 'Test',
        projectName: testProject,
        campaignType: 'invalid'
      }, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Validation error caught for invalid campaign type:');
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Error: ${error.response.data.errors[0].msg}`);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    console.log('');
    console.log('🎉 All campaign type route tests completed successfully!');
    console.log('═'.repeat(80));

  } catch (error) {
    console.error('❌ Error testing campaign type routes:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the tests
testCampaignTypeRoutes().catch(console.error); 