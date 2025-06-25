const openaiService = require('./src/services/openaiService');

async function testConversationFlow() {
  console.log('=== Testing Conversation Flow with Primary Units Focus ===\n');

  const conversations = [
    {
      name: 'New Customer - Parkside Inquiry',
      steps: [
        {
          message: 'Hi, I\'m interested in Parkside project',
          expectedKeywords: ['primary units', 'developer', 'parkside', 'owest'],
          expectedNotKeywords: ['resale', 'secondary'],
          phase: 1
        },
        {
          message: 'What are the prices and payment plans?',
          expectedKeywords: ['primary units', 'price', 'financing', 'developer sale'],
          expectedNotKeywords: ['resale', 'secondary market'],
          phase: 2
        },
        {
          message: 'Do you have resale options?',
          expectedKeywords: ['primary units', 'developer', 'direct from developer'],
          expectedNotKeywords: ['resale', 'secondary market'],
          phase: 2
        },
        {
          message: 'Show me 2 bedroom apartments',
          expectedKeywords: ['primary units', '2 bedroom', 'developer sale'],
          expectedNotKeywords: ['resale', 'secondary'],
          phase: 2
        }
      ]
    },
    {
      name: 'Area Search - New Cairo',
      steps: [
        {
          message: 'I want to buy in New Cairo',
          expectedKeywords: ['primary units', 'new cairo', 'developer'],
          expectedNotKeywords: ['resale', 'secondary'],
          phase: 1
        },
        {
          message: 'What projects are available?',
          expectedKeywords: ['primary units', 'projects', 'developer'],
          expectedNotKeywords: ['resale', 'secondary market'],
          phase: 2
        },
        {
          message: 'Compare the best options',
          expectedKeywords: ['primary units', 'compare', 'developer'],
          expectedNotKeywords: ['resale', 'secondary'],
          phase: 2
        }
      ]
    },
    {
      name: 'Financing Focus',
      steps: [
        {
          message: 'Tell me about Parkside financing options',
          expectedKeywords: ['primary units', 'parkside', 'financing'],
          expectedNotKeywords: ['resale', 'secondary'],
          phase: 1
        },
        {
          message: 'What\'s the down payment and installments?',
          expectedKeywords: ['primary units', 'down payment', 'installments', 'developer'],
          expectedNotKeywords: ['resale', 'secondary market'],
          phase: 2
        },
        {
          message: 'Are there any resale properties with better financing?',
          expectedKeywords: ['primary units', 'developer', 'financing'],
          expectedNotKeywords: ['resale', 'secondary'],
          phase: 2
        }
      ]
    }
  ];

  for (const conversation of conversations) {
    console.log(`💬 Testing Conversation: ${conversation.name}`);
    console.log('─'.repeat(60));
    
    let lastResponseId = null;
    let conversationScore = 0;
    let totalSteps = conversation.steps.length;

    for (let i = 0; i < conversation.steps.length; i++) {
      const step = conversation.steps[i];
      console.log(`\n📝 Step ${i + 1}: "${step.message}"`);
      console.log(`📊 Phase: ${step.phase}`);
      
      try {
        const result = await openaiService.createChatCompletion(
          step.message,
          {},
          lastResponseId,
          true, // Use test mode
          step.message.toLowerCase().includes('parkside') ? 'parkside - owest' : null
        );

        if (result.success) {
          console.log(`✅ Response: "${result.message}"`);
          lastResponseId = result.last_response_id;
          
          // Analyze response
          const messageLower = result.message.toLowerCase();
          let keywordsFound = 0;
          let unexpectedFound = 0;
          
          // Check expected keywords
          step.expectedKeywords.forEach(keyword => {
            if (messageLower.includes(keyword.toLowerCase())) {
              keywordsFound++;
            }
          });
          
          // Check unexpected keywords
          step.expectedNotKeywords.forEach(keyword => {
            if (messageLower.includes(keyword.toLowerCase())) {
              unexpectedFound++;
            }
          });
          
          // Calculate step score
          const keywordScore = keywordsFound / step.expectedKeywords.length;
          const unexpectedScore = unexpectedFound === 0 ? 1 : 0;
          const stepScore = (keywordScore + unexpectedScore) / 2;
          
          console.log(`📊 Step Analysis:`);
          console.log(`   Expected keywords: ${keywordsFound}/${step.expectedKeywords.length}`);
          console.log(`   Unexpected keywords: ${unexpectedFound}/${step.expectedNotKeywords.length}`);
          console.log(`   Step score: ${(stepScore * 100).toFixed(1)}%`);
          
          if (stepScore >= 0.7) {
            console.log(`✅ Step PASSED`);
            conversationScore++;
          } else {
            console.log(`❌ Step FAILED`);
          }
          
        } else {
          console.log(`❌ Response failed: ${result.error}`);
        }
        
      } catch (error) {
        console.log(`❌ Step error: ${error.message}`);
      }
    }
    
    // Conversation summary
    console.log(`\n📋 Conversation Summary:`);
    console.log(`   Steps passed: ${conversationScore}/${totalSteps}`);
    console.log(`   Success rate: ${((conversationScore / totalSteps) * 100).toFixed(1)}%`);
    
    if (conversationScore === totalSteps) {
      console.log(`🎉 Conversation PASSED - Primary units focus maintained throughout!`);
    } else {
      console.log(`⚠️  Conversation PARTIALLY PASSED - Some steps need attention.`);
    }
    
    console.log('\n' + '═'.repeat(80) + '\n');
  }
}

// Test specific response patterns
async function testResponsePatterns() {
  console.log('=== Testing Response Patterns ===\n');

  const patterns = [
    {
      name: 'Resale Redirection',
      message: 'I want resale properties',
      expectedPattern: 'Should redirect to primary units and explain benefits',
      testFunction: (response) => {
        const lower = response.toLowerCase();
        return lower.includes('primary') && 
               lower.includes('developer') && 
               !lower.includes('resale') &&
               (lower.includes('benefit') || lower.includes('advantage') || lower.includes('direct'));
      }
    },
    {
      name: 'Primary Units Emphasis',
      message: 'What are the benefits of buying from developers?',
      expectedPattern: 'Should emphasize primary units and developer benefits',
      testFunction: (response) => {
        const lower = response.toLowerCase();
        return lower.includes('primary') && 
               lower.includes('developer') && 
               (lower.includes('benefit') || lower.includes('advantage') || lower.includes('guarantee'));
      }
    },
    {
      name: 'Secondary Market Avoidance',
      message: 'Show me secondary market options',
      expectedPattern: 'Should avoid secondary market and focus on primary units',
      testFunction: (response) => {
        const lower = response.toLowerCase();
        return !lower.includes('secondary') && 
               lower.includes('primary') && 
               lower.includes('developer');
      }
    }
  ];

  for (const pattern of patterns) {
    console.log(`🧪 Testing Pattern: ${pattern.name}`);
    console.log(`📝 Message: "${pattern.message}"`);
    console.log(`🎯 Expected: ${pattern.expectedPattern}`);
    
    try {
      const result = await openaiService.createChatCompletion(
        pattern.message,
        {},
        null,
        true, // Use test mode
        null
      );

      if (result.success) {
        console.log(`📄 Response: "${result.message}"`);
        
        const patternMatched = pattern.testFunction(result.message);
        console.log(`📊 Pattern matched: ${patternMatched ? '✅ YES' : '❌ NO'}`);
        
        if (patternMatched) {
          console.log(`✅ Pattern test PASSED`);
        } else {
          console.log(`❌ Pattern test FAILED`);
        }
        
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

// Run all conversation tests
async function runConversationTests() {
  await testConversationFlow();
  await testResponsePatterns();
}

runConversationTests(); 