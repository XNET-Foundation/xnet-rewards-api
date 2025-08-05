const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing XNET Rewards API with Data, Bonus, and PoC Rewards\n');

  // Test MAC address (you may need to replace this with a real one from your sheets)
  const testMac = '48bf74221270';
  
  try {
    // Test 1: Aggregate endpoint
    console.log('1. Testing Aggregate Endpoint...');
    const aggregateResponse = await fetch(`${BASE_URL}/api/rewards/aggregate?mac=${testMac}&epochs=3`);
    
    if (aggregateResponse.ok) {
      const aggregateData = await aggregateResponse.json();
      console.log('✅ Aggregate endpoint working:');
      console.log(`   MAC: ${aggregateData.mac}`);
      console.log(`   Epochs: ${aggregateData.epochs.join(', ')}`);
      console.log(`   Data Rewards: ${aggregateData.rewards.data_rewards}`);
      console.log(`   Bonus Rewards: ${aggregateData.rewards.bonus_rewards}`);
      console.log(`   PoC Rewards: ${aggregateData.rewards.poc_rewards}`);
      console.log(`   Total Rewards: ${aggregateData.rewards.total_rewards}`);
    } else {
      console.log(`❌ Aggregate endpoint failed: ${aggregateResponse.status}`);
    }

    // Test 2: Epoch endpoint
    console.log('\n2. Testing Epoch Endpoint...');
    const epochResponse = await fetch(`${BASE_URL}/api/rewards/epoch?mac=${testMac}&epoch=63`);
    
    if (epochResponse.ok) {
      const epochData = await epochResponse.json();
      console.log('✅ Epoch endpoint working:');
      console.log(`   MAC: ${epochData.mac}`);
      console.log(`   Epoch: ${epochData.epoch}`);
      console.log(`   Data Rewards: ${epochData.rewards.data_rewards}`);
      console.log(`   Bonus Rewards: ${epochData.rewards.bonus_rewards}`);
      console.log(`   PoC Rewards: ${epochData.rewards.poc_rewards}`);
      console.log(`   Total Rewards: ${epochData.rewards.total_rewards}`);
    } else {
      console.log(`❌ Epoch endpoint failed: ${epochResponse.status}`);
    }

    // Test 3: History endpoint
    console.log('\n3. Testing History Endpoint...');
    const historyResponse = await fetch(`${BASE_URL}/api/rewards/history?mac=${testMac}`);
    
    if (historyResponse.ok) {
      const historyData = await historyResponse.json();
      console.log('✅ History endpoint working:');
      console.log(`   MAC: ${historyData.mac}`);
      console.log(`   Current Epoch: ${historyData.current_epoch}`);
      console.log(`   History entries: ${Object.keys(historyData.history).length}`);
      
      // Show first few history entries
      const firstEntries = Object.entries(historyData.history).slice(0, 3);
      firstEntries.forEach(([epoch, data]: [string, any]) => {
        console.log(`   ${epoch}: Data=${data.data_rewards}, Bonus=${data.bonus_rewards}, PoC=${data.poc_rewards}, Total=${data.total_rewards}`);
      });
    } else {
      console.log(`❌ History endpoint failed: ${historyResponse.status}`);
    }

    console.log('\n🎉 API testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAPI(); 