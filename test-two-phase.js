const openaiService = require('./src/services/openaiService');

async function testTwoPhaseApproach() {
  console.log('=== Testing Two-Phase Approach ===\n');

  // Phase 1: First Question (No last_response_id) - Brief Project Overview
  console.log('📋 PHASE 1: First Question (Brief Project Overview)');
  console.log('Question: "Tell me about O West Orascom project"');
  
  try {
    const phase1Result = await openaiService.createChatCompletion(
      'Tell me about O West Orascom project',
      {},
      null, // No last_response_id
      false,
      'O West Orascom'
    );

    console.log('✅ Phase 1 Response:');
    console.log(`Phase: ${phase1Result.phase}`);
    console.log(`Message: ${phase1Result.message}`);
    console.log(`Last Response ID: ${phase1Result.last_response_id}`);
    console.log(`Dataset Used: ${phase1Result.dataset_used}`);
    console.log('');

    // Phase 2: Follow-up Question (With last_response_id) - Detailed Analysis
    console.log('🔍 PHASE 2: Follow-up Question (Detailed Analysis)');
    console.log('Question: "What are the exact prices and financing options?"');
    
    const phase2Result = await openaiService.createChatCompletion(
      'What are the exact prices and financing options?',
      {},
      phase1Result.last_response_id, // Use the last_response_id from Phase 1
      false,
      'O West Orascom'
    );

    console.log('✅ Phase 2 Response:');
    console.log(`Phase: ${phase2Result.phase}`);
    console.log(`Message: ${phase2Result.message}`);
    console.log(`Last Response ID: ${phase2Result.last_response_id}`);
    console.log(`Dataset Used: ${phase2Result.dataset_used}`);
    console.log('');

    // Compare the two phases
    console.log('📊 PHASE COMPARISON:');
    console.log(`Phase 1: ${phase1Result.phase === 1 ? '✅ Brief Overview' : '❌ Unexpected'}`);
    console.log(`Phase 2: ${phase2Result.phase === 2 ? '✅ Detailed Analysis' : '❌ Unexpected'}`);
    console.log(`Different Response IDs: ${phase1Result.last_response_id !== phase2Result.last_response_id ? '✅' : '❌'}`);
    console.log(`Both Used Dataset: ${phase1Result.dataset_used && phase2Result.dataset_used ? '✅' : '❌'}`);

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

// Run the test
testTwoPhaseApproach().catch(console.error); 