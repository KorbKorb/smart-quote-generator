// Clean test for validation
const axios = require('axios');

const API_URL = 'http://localhost:3002/api';

async function testValidation() {
  console.log('\n==================================');
  console.log('VALIDATION TEST RESULTS');
  console.log('==================================\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: Old format with invalid material
  totalTests++;
  console.log('TEST 1: Old format - Invalid material');
  try {
    await axios.post(`${API_URL}/quotes/calculate`, {
      items: [{
        material: 'invalid-material',
        thickness: 0.125,
        quantity: 10
      }]
    });
    console.log('RESULT: FAIL - Should have caught invalid material\n');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('RESULT: PASS - Caught invalid material');
      console.log('Error:', error.response.data.message || error.response.data.error);
      passedTests++;
    } else {
      console.log('RESULT: FAIL - Wrong error type');
    }
    console.log('');
  }
  
  // Test 2: New format with valid data
  totalTests++;
  console.log('TEST 2: New format - Valid request');
  try {
    const response = await axios.post(`${API_URL}/quotes/calculate`, {
      material: 'cold-rolled-steel',
      thickness: 0.125,
      quantity: 10,
      finishType: 'powder-coat',
      urgency: 'standard',
      manualLength: 24,
      manualWidth: 18
    });
    console.log('RESULT: PASS - Valid request accepted');
    console.log('Quote total: $' + response.data.quote.pricing.total);
    passedTests++;
  } catch (error) {
    console.log('RESULT: FAIL - Valid request rejected');
    console.log('Error:', error.response?.data);
  }
  console.log('');
  
  // Test 3: New format with invalid thickness
  totalTests++;
  console.log('TEST 3: New format - Invalid thickness (too thick)');
  try {
    await axios.post(`${API_URL}/quotes/calculate`, {
      material: 'cold-rolled-steel',
      thickness: 5, // Too thick
      quantity: 10
    });
    console.log('RESULT: FAIL - Should have caught invalid thickness\n');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('RESULT: PASS - Caught invalid thickness');
      console.log('Error:', error.response.data.message || JSON.stringify(error.response.data.errors));
      passedTests++;
    } else {
      console.log('RESULT: FAIL - Wrong error type');
    }
    console.log('');
  }
  
  // Test 4: Empty request
  totalTests++;
  console.log('TEST 4: Empty request');
  try {
    await axios.post(`${API_URL}/quotes/calculate`, {});
    console.log('RESULT: FAIL - Should have caught empty request\n');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('RESULT: PASS - Caught empty request');
      console.log('Error:', error.response.data.message || error.response.data.error);
      passedTests++;
    } else {
      console.log('RESULT: FAIL - Wrong error type');
    }
    console.log('');
  }
  
  // Test 5: Invalid quantity
  totalTests++;
  console.log('TEST 5: New format - Invalid quantity (too high)');
  try {
    await axios.post(`${API_URL}/quotes/calculate`, {
      material: 'cold-rolled-steel',
      thickness: 0.125,
      quantity: 20000 // Over limit
    });
    console.log('RESULT: FAIL - Should have caught invalid quantity\n');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('RESULT: PASS - Caught invalid quantity');
      console.log('Error:', error.response.data.message || JSON.stringify(error.response.data.errors));
      passedTests++;
    } else {
      console.log('RESULT: FAIL - Wrong error type');
    }
    console.log('');
  }
  
  console.log('==================================');
  console.log(`SUMMARY: ${passedTests}/${totalTests} tests passed`);
  console.log('==================================\n');
  
  if (passedTests === totalTests) {
    console.log('All validation tests passed!');
    process.exit(0);
  } else {
    console.log('Some tests failed. Check the validation middleware.');
    process.exit(1);
  }
}

// Run the test
testValidation().catch(error => {
  console.error('Test script error:', error.message);
  process.exit(1);
});
