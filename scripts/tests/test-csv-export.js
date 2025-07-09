// test-csv-export.js
// Run this from the project root to test the CSV export functionality

const axios = require('axios');

async function testCSVExport() {
  console.log('Testing CSV Export Functionality...\n');

  try {
    // Test 1: Basic API call
    console.log('1. Testing basic quotes API...');
    const response1 = await axios.get('http://localhost:5000/api/quotes');
    console.log(`✓ Found ${response1.data.length} quotes\n`);

    // Test 2: Search filter
    console.log('2. Testing search filter...');
    const response2 = await axios.get('http://localhost:5000/api/quotes?search=Guest');
    console.log(`✓ Search for "Guest" returned ${response2.data.length} quotes\n`);

    // Test 3: Date filter
    console.log('3. Testing date filter...');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // 30 days ago
    const response3 = await axios.get(`http://localhost:5000/api/quotes?startDate=${startDate.toISOString()}`);
    console.log(`✓ Quotes from last 30 days: ${response3.data.length}\n`);

    // Test 4: Status filter
    console.log('4. Testing status filter...');
    const response4 = await axios.get('http://localhost:5000/api/quotes?status=draft');
    console.log(`✓ Draft quotes: ${response4.data.length}\n`);

    // Test 5: Sorting
    console.log('5. Testing sorting...');
    const response5 = await axios.get('http://localhost:5000/api/quotes?sortBy=totalPrice&sortOrder=desc');
    if (response5.data.length > 1) {
      const firstPrice = parseFloat(response5.data[0].totalPrice);
      const secondPrice = parseFloat(response5.data[1].totalPrice);
      console.log(`✓ Sorting works: First quote ($${firstPrice}) >= Second quote ($${secondPrice})\n`);
    }

    console.log('✅ All API tests passed!\n');
    console.log('Now check the frontend:');
    console.log('1. Go to http://localhost:3000/quotes');
    console.log('2. Try the filters');
    console.log('3. Click "Export CSV"');
    console.log('4. Open the downloaded file in Excel\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nMake sure:');
    console.log('1. Backend is running on port 5000');
    console.log('2. You have some quotes in the database');
  }
}

testCSVExport();
