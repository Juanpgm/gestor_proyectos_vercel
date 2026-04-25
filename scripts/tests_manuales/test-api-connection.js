// Test simple para verificar conexión con API
async function testAPI() {
  console.log('🔍 Probando conexión con API...\n');
  
  const endpoints = [
    'https://gestorproyectoapi-production.up.railway.app/contratos_emprestito_all',
    'https://gestorproyectoapi-production.up.railway.app/reportes_contratos/',
    'https://gestorproyectoapi-production.up.railway.app/bancos_emprestito_all'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Probando: ${endpoint}`);
      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Éxito - Datos recibidos:`, {
          success: data.success,
          count: data.count || data.data?.length || 0,
          keys: Object.keys(data)
        });
      } else {
        console.log(`❌ Error: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Error de conexión:`, error.message);
    }
    console.log('---\n');
  }
}

testAPI();
