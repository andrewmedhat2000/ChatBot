const openaiService = require('./src/services/openaiService');

// Import test functions
const { testPrimaryUnitsScenarios } = require('./test-primary-units-scenarios');
const { testConversationFlow, testResponsePatterns } = require('./test-conversation-flow');

async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive Primary Units Testing Suite');
  console.log('═'.repeat(80));
  console.log('');

  const testResults = {
    basicScenarios: { passed: 0, total: 0, details: [] },
    conversationFlow: { passed: 0, total: 0, details: [] },
    responsePatterns: { passed: 0, total: 0, details: [] },
    edgeCases: { passed: 0, total: 0, details: [] }
  };

  // Test 1: Basic functionality test
  console.log('🧪 Test 1: Basic Primary Units Functionality');
  console.log('─'.repeat(60));
  
  try {
    const basicTest = await openaiService.createChatCompletion(
      'Tell me about Parkside project',
      {},
      null,
      true,
      'parkside - owest'
    );

    if (basicTest.success) {
      const messageLower = basicTest.message.toLowerCase();
      const hasPrimary = messageLower.includes('primary');
      const hasDeveloper = messageLower.includes('developer');
      const hasResale = messageLower.includes('resale');
      
      console.log(`📄 Response: "${basicTest.message}"`);
      console.log(`✅ Primary units mentioned: ${hasPrimary}`);
      console.log(`✅ Developer mentioned: ${hasDeveloper}`);
      console.log(`❌ Resale mentioned: ${hasResale}`);
      
      if (hasPrimary && hasDeveloper && !hasResale) {
        console.log('✅ Basic functionality test PASSED');
        testResults.basicScenarios.passed++;
      } else {
        console.log('❌ Basic functionality test FAILED');
      }
      testResults.basicScenarios.total++;
      
    } else {
      console.log(`❌ Basic test failed: ${basicTest.error}`);
    }
  } catch (error) {
    console.log(`❌ Basic test error: ${error.message}`);
  }
  console.log('');

  // Test 2: Phase 2 detailed response
  console.log('🧪 Test 2: Phase 2 Detailed Response');
  console.log('─'.repeat(60));
  
  try {
    const detailedTest = await openaiService.createChatCompletion(
      'What are the prices and financing options for Parkside?',
      {},
      'test-response-123',
      true,
      'parkside - owest'
    );

    if (detailedTest.success) {
      const messageLower = detailedTest.message.toLowerCase();
      const hasPrimary = messageLower.includes('primary');
      const hasPrice = messageLower.includes('price') || messageLower.includes('egp');
      const hasFinancing = messageLower.includes('financing') || messageLower.includes('installment');
      const hasResale = messageLower.includes('resale');
      
      console.log(`📄 Response: "${detailedTest.message}"`);
      console.log(`✅ Primary units mentioned: ${hasPrimary}`);
      console.log(`✅ Pricing mentioned: ${hasPrice}`);
      console.log(`✅ Financing mentioned: ${hasFinancing}`);
      console.log(`❌ Resale mentioned: ${hasResale}`);
      
      if (hasPrimary && hasPrice && hasFinancing && !hasResale) {
        console.log('✅ Phase 2 test PASSED');
        testResults.basicScenarios.passed++;
      } else {
        console.log('❌ Phase 2 test FAILED');
      }
      testResults.basicScenarios.total++;
      
    } else {
      console.log(`❌ Phase 2 test failed: ${detailedTest.error}`);
    }
  } catch (error) {
    console.log(`❌ Phase 2 test error: ${error.message}`);
  }
  console.log('');

  // Test 3: Resale redirection
  console.log('🧪 Test 3: Resale Redirection');
  console.log('─'.repeat(60));
  
  try {
    const resaleTest = await openaiService.createChatCompletion(
      'I want to see resale properties in Parkside',
      {},
      null,
      true,
      'parkside - owest'
    );

    if (resaleTest.success) {
      const messageLower = resaleTest.message.toLowerCase();
      const hasPrimary = messageLower.includes('primary');
      const hasDeveloper = messageLower.includes('developer');
      const hasResale = messageLower.includes('resale');
      const hasRedirect = messageLower.includes('instead') || messageLower.includes('however') || messageLower.includes('focus');
      
      console.log(`📄 Response: "${resaleTest.message}"`);
      console.log(`✅ Primary units mentioned: ${hasPrimary}`);
      console.log(`✅ Developer mentioned: ${hasDeveloper}`);
      console.log(`❌ Resale mentioned: ${hasResale}`);
      console.log(`✅ Redirection language: ${hasRedirect}`);
      
      if (hasPrimary && hasDeveloper && !hasResale) {
        console.log('✅ Resale redirection test PASSED');
        testResults.edgeCases.passed++;
      } else {
        console.log('❌ Resale redirection test FAILED');
      }
      testResults.edgeCases.total++;
      
    } else {
      console.log(`❌ Resale test failed: ${resaleTest.error}`);
    }
  } catch (error) {
    console.log(`❌ Resale test error: ${error.message}`);
  }
  console.log('');

  // Test 4: Conversation flow
  console.log('🧪 Test 4: Conversation Flow');
  console.log('─'.repeat(60));
  
  try {
    // Step 1: Initial inquiry
    const step1 = await openaiService.createChatCompletion(
      'Hi, I\'m interested in Parkside',
      {},
      null,
      true,
      'parkside - owest'
    );

    if (step1.success) {
      console.log(`📝 Step 1: "${step1.message}"`);
      
      // Step 2: Follow-up with resale mention
      const step2 = await openaiService.createChatCompletion(
        'Do you have resale options?',
        {},
        step1.last_response_id,
        true,
        'parkside - owest'
      );

      if (step2.success) {
        console.log(`📝 Step 2: "${step2.message}"`);
        
        const step1Lower = step1.message.toLowerCase();
        const step2Lower = step2.message.toLowerCase();
        
        const step1Good = step1Lower.includes('primary') && step1Lower.includes('developer');
        const step2Good = step2Lower.includes('primary') && step2Lower.includes('developer') && !step2Lower.includes('resale');
        
        console.log(`✅ Step 1 maintains focus: ${step1Good}`);
        console.log(`✅ Step 2 redirects properly: ${step2Good}`);
        
        if (step1Good && step2Good) {
          console.log('✅ Conversation flow test PASSED');
          testResults.conversationFlow.passed++;
        } else {
          console.log('❌ Conversation flow test FAILED');
        }
        testResults.conversationFlow.total++;
        
      } else {
        console.log(`❌ Step 2 failed: ${step2.error}`);
      }
    } else {
      console.log(`❌ Step 1 failed: ${step1.error}`);
    }
  } catch (error) {
    console.log(`❌ Conversation test error: ${error.message}`);
  }
  console.log('');

  // Test 5: Data filtering verification
  console.log('🧪 Test 5: Data Filtering Verification');
  console.log('─'.repeat(60));
  
  try {
    const basicContext = await openaiService.getBasicDatasetContext('I want apartments in New Cairo', 'parkside - owest');
    const detailedContext = await openaiService.getDetailedDatasetContext('What are the prices?', 'parkside - owest');
    
    console.log(`📊 Basic context success: ${basicContext.success}`);
    console.log(`📊 Detailed context success: ${detailedContext.success}`);
    
    if (basicContext.success && detailedContext.success) {
      const basicHasPrimary = basicContext.context.includes('PRIMARY UNITS');
      const detailedHasPrimary = detailedContext.context.includes('PRIMARY UNITS');
      const basicNoResale = !basicContext.context.includes('resale');
      const detailedNoResale = !detailedContext.context.includes('resale');
      
      console.log(`✅ Basic context mentions primary units: ${basicHasPrimary}`);
      console.log(`✅ Detailed context mentions primary units: ${detailedHasPrimary}`);
      console.log(`❌ Basic context avoids resale: ${basicNoResale}`);
      console.log(`❌ Detailed context avoids resale: ${detailedNoResale}`);
      
      if (basicHasPrimary && detailedHasPrimary && basicNoResale && detailedNoResale) {
        console.log('✅ Data filtering test PASSED');
        testResults.basicScenarios.passed++;
      } else {
        console.log('❌ Data filtering test FAILED');
      }
      testResults.basicScenarios.total++;
      
    } else {
      console.log('❌ Context tests failed');
    }
  } catch (error) {
    console.log(`❌ Data filtering test error: ${error.message}`);
  }
  console.log('');

  // Final Summary
  console.log('📋 COMPREHENSIVE TEST SUMMARY');
  console.log('═'.repeat(80));
  
  const totalTests = Object.values(testResults).reduce((sum, category) => sum + category.total, 0);
  const totalPassed = Object.values(testResults).reduce((sum, category) => sum + category.passed, 0);
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Total Passed: ${totalPassed}`);
  console.log(`Total Failed: ${totalTests - totalPassed}`);
  console.log(`Overall Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
  console.log('');
  
  // Category breakdown
  Object.entries(testResults).forEach(([category, results]) => {
    if (results.total > 0) {
      const successRate = ((results.passed / results.total) * 100).toFixed(1);
      console.log(`${category}: ${results.passed}/${results.total} (${successRate}%)`);
    }
  });
  console.log('');
  
  if (totalPassed === totalTests) {
    console.log('🎉 ALL TESTS PASSED! Primary units focus is working perfectly.');
  } else if (totalPassed >= totalTests * 0.8) {
    console.log('✅ MOST TESTS PASSED! Primary units focus is working well with minor issues.');
  } else {
    console.log('⚠️  MANY TESTS FAILED! Primary units focus needs attention.');
  }
  
  console.log('');
  console.log('🔧 Recommendations:');
  if (totalPassed < totalTests) {
    console.log('- Review failed test cases above');
    console.log('- Check if all instructions are properly emphasizing primary units');
    console.log('- Verify data filtering is working correctly');
    console.log('- Test with real API calls (not test mode)');
  } else {
    console.log('- All systems working correctly');
    console.log('- Ready for production use');
    console.log('- Consider adding more edge case tests');
  }
}

// Run the comprehensive test suite
runComprehensiveTests(); 