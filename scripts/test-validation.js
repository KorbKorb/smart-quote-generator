// Test input validation
const axios = require('axios');

const API_URL = 'http://localhost:3002/api';

async function testValidation() {
  console.log('🧪 Testing Input Validation...\n');
  
  console.log('=== Testing Old Format (items array) ===\n');
  
  // Test 1: Invalid material (old format)
  console.log('Test 1: Invalid material type');
  try {
    await axios.post(`${API_URL}/quotes/calculate`, {
      items: [{
        material: 'invalid-material',
        thickness: 0.125,
        quantity: 10
      }]
    });
    console.log('❌ Should have failed validation');
  } catch (error) {
    console.log('✅ Validation error:', error.response.data);
  }
  
  // Test 2: Valid request (old format)
  console.log('\nTest 2: Valid request (old format)');
  try {
    const response = await axios.post(`${API_URL}/quotes/calculate`, {
      items: [{
        material: 'Cold Rolled Steel',
        thickness: 0.125,
        quantity: 10,
        finishType: 'powder-coat',
        urgency: 'standard',
        bendComplexity: 'simple'
      }]
    });
    console.log('✅ Valid request accepted:', response.status);
    console.log('Total price:', response.data.totalPrice);
  } catch (error) {
    console.log('❌ Valid request failed:', error.response?.data);
  }
  
  console.log('\n=== Testing New Format (direct quote data) ===\n');
  
  // Test 3: Invalid material (new format)
  console.log('Test 3: Invalid material type');
  try {
    await axios.post(`${API_URL}/quotes/calculate`, {
      material: 'invalid-material',
      thickness: 0.125,
      quantity: 10,
      finishType: 'none',
      urgency: 'standard'
    });
    console.log('❌ Should have failed validation');
  } catch (error) {
    console.log('✅ Validation caught invalid material:', error.response.data);
  }
  
  // Test 4: Invalid thickness
  console.log('\nTest 4: Invalid thickness');
  try {
    await axios.post(`${API_URL}/quotes/calculate`, {
      material: 'cold-rolled-steel',
      thickness: 5, // Too thick
      quantity: 10,
      finishType: 'none',
      urgency: 'standard'
    });
    console.log('❌ Should have failed validation');
  } catch (error) {
    console.log('✅ Validation caught invalid thickness:', error.response.data);
  }
  
  // Test 5: Valid request (new format)
  console.log('\nTest 5: Valid request (new format)');
  try {
    const response = await axios.post(`${API_URL}/quotes/calculate`, {
      material: 'cold-rolled-steel',
      thickness: 0.125,
      quantity: 10,
      finishType: 'powder-coat',
      urgency: 'standard',
      manualLength: 24,
      manualWidth: 18,
      manualHoles: 4,
      manualBends: 2
    });
    console.log('✅ Valid request accepted:', response.status);
    console.log('Quote total:', response.data.quote.pricing.total);
  } catch (error) {
    console.log('❌ Valid request failed:', error.response?.data);
  }
  
  // Test 6: Missing required fields
  console.log('\nTest 6: Missing required fields');
  try {
    await axios.post(`${API_URL}/quotes/calculate`, {
      material: 'cold-rolled-steel'
      // Missing thickness and quantity
    });
    console.log('❌ Should have failed validation');
  } catch (error) {
    console.log('✅ Validation caught missing fields:', error.response.data);
  }
  
  // Test 7: Invalid quantity
  console.log('\nTest 7: Invalid quantity (too high)');
  try {
    await axios.post(`${API_URL}/quotes/calculate`, {
      material: 'cold-rolled-steel',
      thickness: 0.125,
      quantity: 20000, // Over 10000 limit
      finishType: 'none',
      urgency: 'standard'
    });
    console.log('❌ Should have failed validation');
  } catch (error) {
    console.log('✅ Validation caught invalid quantity:', error.response.data);
  }
}

testValidation().catch(console.error);
