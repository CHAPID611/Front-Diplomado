// Debug del backend - ejecutar en consola del navegador
export function testBackendAuth() {
  const token = localStorage.getItem('auth_token');
  const apiUrl = 'http://localhost:3000';
  
  console.log('🔍 Debug Backend Authentication:');
  console.log('Token disponible:', token ? 'SÍ' : 'NO');
  
  if (!token) {
    console.error('❌ No hay token disponible');
    return;
  }
  
  // Probar diferentes endpoints
  const endpoints = [
    '/personal',
    '/constantes/tipos-sangre', 
    '/constantes/estados',
    '/constantes/rangos',
    '/competencias'
  ];
  
  endpoints.forEach(async (endpoint) => {
    try {
      console.log(`🚀 Probando ${endpoint}...`);
      
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`📊 ${endpoint}:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint} - Datos:`, data);
      } else {
        const error = await response.text();
        console.error(`❌ ${endpoint} - Error:`, error);
      }
      
    } catch (error) {
      console.error(`💥 ${endpoint} - Error de red:`, error);
    }
  });
}

// Para usar en la consola:
// testBackendAuth()
(window as any).testBackendAuth = testBackendAuth; 