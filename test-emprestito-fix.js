// Test script to verify empréstito data loading fix
const fetch = require('node-fetch');

async function testEmprestitoData() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔍 Testing empréstito data loading...\n');
  
  try {
    // Test direct file access
    console.log('1. Testing direct JSON file access...');
    const response = await fetch(`${baseUrl}/data/emprestito/emp_contratos.json`);
    
    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      return false;
    }
    
    console.log(`✅ Status: ${response.status} ${response.statusText}`);
    
    // Test JSON parsing
    let data;
    try {
      data = await response.json();
      console.log('✅ JSON parsed successfully');
    } catch (jsonError) {
      console.error(`❌ JSON Parse Error: ${jsonError.message}`);
      return false;
    }
    
    // Validate data structure
    console.log(`📊 Data type: ${Array.isArray(data) ? 'Array' : 'Object'}`);
    console.log(`📈 Records count: ${data.length || 'N/A'}`);
    
    if (Array.isArray(data) && data.length > 0) {
      console.log(`🔍 Sample record keys: ${Object.keys(data[0]).slice(0, 5).join(', ')}`);
      console.log(`💰 Sample valor_contrato: ${data[0].valor_contrato || 'N/A'}`);
      console.log(`🏢 Sample nombre_entidad: ${data[0].nombre_entidad || 'N/A'}`);
      
      // Check for any remaining NaN values
      const jsonString = JSON.stringify(data);
      if (jsonString.includes('NaN')) {
        console.error('❌ Data still contains NaN values!');
        return false;
      }
      
      console.log('✅ No NaN values found in data');
    }
    
    console.log('\n🎉 All tests passed! Empréstito data should now load correctly.');
    return true;
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    return false;
  }
}

// Run the test
testEmprestitoData()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });