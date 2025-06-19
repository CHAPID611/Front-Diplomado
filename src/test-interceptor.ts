// Script para probar interceptors
// Ejecutar en la consola después de que la app esté cargada

function testInterceptors() {
  console.log('🧪 === TEST DE INTERCEPTORS ===');
  
  // Test simple con fetch nativo
  const token = localStorage.getItem('token');
  console.log('1. Token en localStorage:', token ? 'Presente' : 'Ausente');
  
  if (token) {
    console.log('2. Haciendo petición de prueba con fetch nativo...');
    
    fetch('http://localhost:3000/personal', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      console.log('3. Respuesta fetch nativo:', response.status, response.statusText);
      if (response.status === 200) {
        console.log('✅ Token válido con fetch nativo');
      } else if (response.status === 401) {
        console.log('❌ Error 401 incluso con fetch nativo - problema del backend');
      }
    })
    .catch(error => {
      console.error('❌ Error con fetch nativo:', error);
    });
  }
  
  console.log('================================');
}

// Función para verificar configuración de Angular
function checkAngularConfig() {
  console.log('🔍 Verificando configuración de Angular...');
  
  // Verificar si los interceptors están registrados
  if ((window as any).ng) {
    console.log('✅ Angular detectado');
  } else {
    console.log('❌ Angular no detectado');
  }
  
  console.log('💡 Si los interceptors no funcionan, es un problema de configuración');
  console.log('💡 El fetch nativo debería funcionar si el token es válido');
}

// Ejecutar ambas funciones
testInterceptors();
checkAngularConfig(); 