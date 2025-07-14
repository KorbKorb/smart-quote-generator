// test-api-single.js
// Test API with just the working rectangle file

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3002/api/quotes';

async function testSingleFile() {
  console.log('🧪 Testing API with test-rectangle-10x10.dxf\n');
  
  const filePath = path.join(__dirname, '..', 'test-files', 'test-rectangle-10x10.dxf');
  
  try {
    // Step 1: Analyze DXF
    console.log('📁 Analyzing DXF...');
    const analyzeForm = new FormData();
    analyzeForm.append('file', fs.createReadStream(filePath));
    
    const analyzeResponse = await axios.post(`${API_URL}/analyze-dxf`, analyzeForm, {
      headers: analyzeForm.getHeaders()
    });
    
    const dxfData = analyzeResponse.data.data;
    console.log('✅ DXF analyzed');
    console.log(`   Entities: ${dxfData.entities?.length || 0}`);
    console.log(`   Area: ${dxfData.area} sq in`);
    
    // Step 2: Calculate quote
    console.log('\n💰 Calculating quote...');
    const quoteData = {
      material: 'cold-rolled-steel',
      thickness: 0.125,
      quantity: 10,
      finishType: 'none',
      toleranceLevel: 'standard',
      urgency: 'standard',
      bendComplexity: 'simple',
      dxfData: dxfData
    };
    
    const quoteResponse = await axios.post(`${API_URL}/calculate`, quoteData, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    // Check both response formats
    if (quoteResponse.data.costs) {
      console.log('\n📊 Quote Results (Direct Format):');
      console.log(`   Total: $${quoteResponse.data.costs.total}`);
      console.log(`   Cutting: $${quoteResponse.data.costs.cuttingCost}`);
      
      if (quoteResponse.data.details.cuttingComplexity) {
        const cc = quoteResponse.data.details.cuttingComplexity;
        console.log('\n✅ Cutting Complexity Analysis:');
        console.log(`   Score: ${cc.score}/100`);
        console.log(`   Straight Cuts: ${cc.straightCuts}`);
        console.log(`   Curved Cuts: ${cc.curvedCuts}`);
        console.log(`   Tight Corners: ${cc.tightCorners}`);
        
        // Calculate savings
        const oldMethod = 25 + (dxfData.cutLength * 10 * 0.25 * 1.2);
        const newMethod = parseFloat(quoteResponse.data.costs.cuttingCost);
        const savings = ((oldMethod - newMethod) / oldMethod * 100).toFixed(1);
        
        console.log('\n💡 Cost Comparison:');
        console.log(`   Old Method: $${oldMethod.toFixed(2)}`);
        console.log(`   New Method: $${newMethod.toFixed(2)}`);
        console.log(`   Savings: ${savings}%`);
      }
    }
    
    if (quoteResponse.data.quote) {
      console.log('\n📊 Quote Results (Nested Format):');
      console.log(`   Total: $${quoteResponse.data.quote.pricing.total}`);
      console.log(`   Cutting: $${quoteResponse.data.quote.breakdown.operations.cutting.cost}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run test
testSingleFile();