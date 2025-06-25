const openaiService = require('./src/services/openaiService');

async function testPrimaryUnitsScenarios() {
  console.log('=== Testing Primary Units Scenarios ===\n');

  const scenarios = [
    {
      name: 'Phase 1 - Initial Project Inquiry',
      message: 'Tell me about Parkside project',
      projectName: 'parkside - owest',
      expectedKeywords: ['primary units', 'developer', 'parkside', 'owest'],
      expectedNotKeywords: ['resale', 'secondary market'],
      phase: 1
    },
    {
      name: 'Phase 1 - Area Search',
      message: 'I want apartments in New Cairo',
      projectName: null,
      expectedKeywords: ['primary units', 'developer', 'new cairo'],
      expectedNotKeywords: ['resale', 'secondary market'],
      phase: 1
    },
    {
      name: 'Phase 1 - Developer Inquiry',
      message: 'What projects does Owest have?',
      projectName: null,
      expectedKeywords: ['primary units', 'owest', 'developer'],
      expectedNotKeywords: ['resale', 'secondary market'],
      phase: 1
    },
    {
      name: 'Phase 2 - Pricing Inquiry',
      message: 'What are the prices for apartments in Parkside?',
      projectName: 'parkside - owest',
      lastResponseId: 'test-response-123',
      expectedKeywords: ['primary units', 'developer sale', 'price', 'financing'],
      expectedNotKeywords: ['resale', 'secondary market'],
      phase: 2
    },
    {
      name: 'Phase 2 - Financing Options',
      message: 'What financing options are available?',
      projectName: 'parkside - owest',
      lastResponseId: 'test-response-456',
      expectedKeywords: ['primary units', 'financing', 'installments', 'down payment'],
      expectedNotKeywords: ['resale', 'secondary market'],
      phase: 2
    },
    {
      name: 'Phase 2 - Property Details',
      message: 'Show me 2 bedroom apartments with delivery dates',
      projectName: 'parkside - owest',
      lastResponseId: 'test-response-789',
      expectedKeywords: ['primary units', '2 bedroom', 'delivery', 'developer sale'],
      expectedNotKeywords: ['resale', 'secondary market'],
      phase: 2
    },
    {
      name: 'Phase 2 - Comparison Request',
      message: 'Compare Parkside with other projects in New Cairo',
      projectName: 'parkside - owest',
      lastResponseId: 'test-response-101',
      expectedKeywords: ['primary units', 'compare', 'developer', 'new cairo'],
      expectedNotKeywords: ['resale', 'secondary market'],
      phase: 2
    },
    {
      name: 'Phase 2 - Specific Property Type',
      message: 'I want to see villa options in Parkside',
      projectName: 'parkside - owest',
      lastResponseId: 'test-response-202',
      expectedKeywords: ['primary units', 'villa', 'developer sale', 'parkside'],
      expectedNotKeywords: ['resale', 'secondary market'],
      phase: 2
    }
  ];

  let passedTests = 0;
  let totalTests = scenarios.length;

  for (const scenario of scenarios) {
    console.log(`🧪 Testing: ${scenario.name}`);
    console.log(`📝 Message: "${scenario.message}"`);
    console.log(`🏗️  Project: ${scenario.projectName || 'None'}`);
    console.log(`📊 Phase: ${scenario.phase}`);
    
    try {
      const result = await openaiService.createChatCompletion(
        scenario.message,
        {},
        scenario.lastResponseId || null,
        true, // Use test mode
        scenario.projectName
      );

      if (result.success) {
        console.log(`✅ Response received successfully`);
        console.log(`📄 Response: "${result.message}"`);
        
        // Test expected keywords
        const messageLower = result.message.toLowerCase();
        let keywordsFound = 0;
        let keywordsTotal = scenario.expectedKeywords.length;
        
        console.log(`🔍 Checking expected keywords:`);
        scenario.expectedKeywords.forEach(keyword => {
          const found = messageLower.includes(keyword.toLowerCase());
          console.log(`   ${found ? '✅' : '❌'} "${keyword}": ${found}`);
          if (found) keywordsFound++;
        });

        // Test unexpected keywords
        let unexpectedFound = 0;
        let unexpectedTotal = scenario.expectedNotKeywords.length;
        
        console.log(`🚫 Checking unexpected keywords:`);
        scenario.expectedNotKeywords.forEach(keyword => {
          const found = messageLower.includes(keyword.toLowerCase());
          console.log(`   ${found ? '❌' : '✅'} "${keyword}": ${found ? 'FOUND (should not be)' : 'not found (good)'}`);
          if (found) unexpectedFound++;
        });

        // Calculate score
        const keywordScore = keywordsFound / keywordsTotal;
        const unexpectedScore = unexpectedFound === 0 ? 1 : 0;
        const totalScore = (keywordScore + unexpectedScore) / 2;
        
        console.log(`📊 Test Results:`);
        console.log(`   Expected keywords: ${keywordsFound}/${keywordsTotal} (${(keywordScore * 100).toFixed(1)}%)`);
        console.log(`   Unexpected keywords: ${unexpectedFound}/${unexpectedTotal} (${(unexpectedScore * 100).toFixed(1)}%)`);
        console.log(`   Overall score: ${(totalScore * 100).toFixed(1)}%`);
        
        if (totalScore >= 0.7) {
          console.log(`✅ Test PASSED`);
          passedTests++;
        } else {
          console.log(`❌ Test FAILED`);
        }
        
      } else {
        console.log(`❌ Response failed: ${result.error}`);
      }
      
    } catch (error) {
      console.log(`❌ Test error: ${error.message}`);
    }
    
    console.log('─'.repeat(80));
    console.log('');
  }

  // Summary
  console.log('📋 TEST SUMMARY');
  console.log('─'.repeat(80));
  console.log(`Total tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Primary units focus is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Review the results above.');
  }
}

// Additional specific scenario tests
async function testSpecificScenarios() {
  console.log('\n=== Testing Specific Edge Cases ===\n');

  const edgeCases = [
    {
      name: 'Resale Mention in Query',
      message: 'I want to see resale properties in Parkside',
      projectName: 'parkside - owest',
      expectedBehavior: 'Should redirect to primary units and not mention resale'
    },
    {
      name: 'Mixed Business Types Query',
      message: 'Show me both developer and resale options',
      projectName: 'parkside - owest',
      expectedBehavior: 'Should focus only on developer sales (primary units)'
    },
    {
      name: 'Secondary Market Query',
      message: 'What\'s available in the secondary market?',
      projectName: null,
      expectedBehavior: 'Should redirect to primary units market'
    },
    {
      name: 'Direct Primary Units Query',
      message: 'I specifically want primary units from the developer',
      projectName: 'parkside - owest',
      expectedBehavior: 'Should emphasize primary units and developer benefits'
    }
  ];

  for (const edgeCase of edgeCases) {
    console.log(`🧪 Edge Case: ${edgeCase.name}`);
    console.log(`📝 Message: "${edgeCase.message}"`);
    console.log(`🎯 Expected: ${edgeCase.expectedBehavior}`);
    
    try {
      const result = await openaiService.createChatCompletion(
        edgeCase.message,
        {},
        null,
        true, // Use test mode
        edgeCase.projectName
      );

      if (result.success) {
        const messageLower = result.message.toLowerCase();
        const hasPrimary = messageLower.includes('primary');
        const hasDeveloper = messageLower.includes('developer');
        const hasResale = messageLower.includes('resale');
        const hasSecondary = messageLower.includes('secondary');
        
        console.log(`📄 Response: "${result.message}"`);
        console.log(`🔍 Analysis:`);
        console.log(`   Mentions primary units: ${hasPrimary ? '✅' : '❌'}`);
        console.log(`   Mentions developer: ${hasDeveloper ? '✅' : '❌'}`);
        console.log(`   Mentions resale: ${hasResale ? '❌' : '✅'}`);
        console.log(`   Mentions secondary: ${hasSecondary ? '❌' : '✅'}`);
        
        const isCorrect = hasPrimary && hasDeveloper && !hasResale && !hasSecondary;
        console.log(`📊 Result: ${isCorrect ? '✅ PASS' : '❌ FAIL'}`);
        
      } else {
        console.log(`❌ Response failed: ${result.error}`);
      }
      
    } catch (error) {
      console.log(`❌ Test error: ${error.message}`);
    }
    
    console.log('─'.repeat(60));
    console.log('');
  }
}

// Run all tests
async function runAllTests() {
  await testPrimaryUnitsScenarios();
  await testSpecificScenarios();
}

runAllTests(); 