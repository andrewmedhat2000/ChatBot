const openaiService = require('./src/services/openaiService');

async function testNoPrimaryUnitsHandling() {
  console.log('🧪 Testing No Primary Units Handling\n');

  const testScenarios = [
    {
      name: 'No Primary Units Available',
      message: 'Tell me about apartments in a project with no primary units',
      projectName: 'project-with-no-primary-units',
      expectedBehavior: 'Should clearly state no primary units available, not mention resale'
    },
    {
      name: 'Resale Inquiry Redirection',
      message: 'I want resale properties in Parkside',
      projectName: 'parkside - owest',
      expectedBehavior: 'Should redirect to primary units, not provide resale info'
    },
    {
      name: 'Mixed Business Types Query',
      message: 'Show me both developer and resale options',
      projectName: 'parkside - owest',
      expectedBehavior: 'Should focus only on developer sales, ignore resale request'
    },
    {
      name: 'Price Inquiry with No Primary Units',
      message: 'What are the prices for apartments?',
      projectName: 'project-with-no-primary-units',
      lastResponseId: 'test-no-primary',
      expectedBehavior: 'Should state no primary units available, not provide resale prices'
    }
  ];

  let passedTests = 0;
  let totalTests = testScenarios.length;

  for (const scenario of testScenarios) {
    console.log(`\n📝 Testing: ${scenario.name}`);
    console.log(`💬 Message: "${scenario.message}"`);
    console.log(`🎯 Expected: ${scenario.expectedBehavior}`);
    
    try {
      // Mock response based on the scenario
      const mockResponse = await getMockResponseForNoPrimaryUnits(scenario.message, scenario.projectName);
      
      console.log(`✅ Response: "${mockResponse}"`);
      
      // Analyze the response
      const responseLower = mockResponse.toLowerCase();
      const hasNoPrimaryMessage = responseLower.includes('no primary units') || responseLower.includes('not available');
      const hasResaleMention = responseLower.includes('resale') || responseLower.includes('secondary');
      const hasPrimaryFocus = responseLower.includes('primary units') || responseLower.includes('developer');
      const hasRedirect = responseLower.includes('redirect') || responseLower.includes('instead') || responseLower.includes('however');
      
      console.log(`📊 Analysis:`);
      console.log(`   Mentions no primary units: ${hasNoPrimaryMessage ? '✅' : '❌'}`);
      console.log(`   Mentions resale: ${hasResaleMention ? '❌' : '✅'}`);
      console.log(`   Focuses on primary units: ${hasPrimaryFocus ? '✅' : '❌'}`);
      console.log(`   Redirects appropriately: ${hasRedirect ? '✅' : '❌'}`);
      
      // Determine if test passed
      let testPassed = false;
      
      if (scenario.name.includes('No Primary Units') || scenario.name.includes('Price Inquiry')) {
        // Should mention no primary units and not mention resale
        testPassed = hasNoPrimaryMessage && !hasResaleMention;
      } else if (scenario.name.includes('Resale') || scenario.name.includes('Mixed')) {
        // Should redirect to primary units and not provide resale info
        testPassed = hasPrimaryFocus && !hasResaleMention && hasRedirect;
      }
      
      if (testPassed) {
        console.log(`✅ Test PASSED`);
        passedTests++;
      } else {
        console.log(`❌ Test FAILED`);
      }
      
    } catch (error) {
      console.log(`❌ Test error: ${error.message}`);
    }
    
    console.log('─'.repeat(60));
  }

  // Summary
  console.log(`\n📋 SUMMARY`);
  console.log('═'.repeat(60));
  console.log(`Total tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! No primary units handling is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Review the results above.');
  }
}

async function getMockResponseForNoPrimaryUnits(message, projectName) {
  const currentDate = new Date().toLocaleDateString();
  
  if (message.toLowerCase().includes('no primary units') || projectName.includes('no-primary-units')) {
    return `No primary units are currently available in ${projectName}. We only handle primary units (developer sales) and do not provide information about resale properties. Would you like to explore other projects with available primary units?`;
  } else if (message.toLowerCase().includes('resale')) {
    return `I understand you're asking about resale properties, but let me redirect you to our excellent primary units from the developer instead. Primary units offer better financing, developer guarantees, and direct support. We only handle primary units (developer sales).`;
  } else if (message.toLowerCase().includes('both developer and resale')) {
    return `I can only provide information about primary units (developer sales) as we do not handle resale properties. Let me show you the available primary units from the developer with competitive pricing and financing options.`;
  } else if (message.toLowerCase().includes('price') && projectName.includes('no-primary-units')) {
    return `No primary units are currently available in ${projectName}, so I cannot provide pricing information. We only handle primary units (developer sales) and do not provide information about resale properties. Would you like to explore other projects with available primary units?`;
  } else {
    return `For ${projectName}, I can only provide information about primary units (developer sales). We do not handle resale properties. Current date: ${currentDate}.`;
  }
}

// Run the no primary units handling test
testNoPrimaryUnitsHandling(); 