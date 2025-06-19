// Script para ejecutar en la consola del navegador
// Copia y pega este código en las DevTools del navegador para verificar autenticación

function testAuth() {
  console.log('=== TEST DE AUTENTICACIÓN ===');
  
  // 1. Verificar token en localStorage
  const token = localStorage.getItem('token');
  console.log('1. Token presente:', !!token);
  
  if (!token) {
    console.error('❌ No hay token en localStorage');
    return;
  }
  
  // 2. Decodificar y verificar token
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('2. Payload del token:', payload);
    console.log('3. Usuario ID:', payload.sub || payload.userId);
    console.log('4. Rol:', payload.role);
    console.log('5. Expira en:', new Date(payload.exp * 1000));
    
    const now = new Date();
    const expiry = new Date(payload.exp * 1000);
    const isValid = now < expiry;
    
    console.log('6. Tiempo actual:', now);
    console.log('7. Token válido:', isValid ? '✅' : '❌');
    
    if (!isValid) {
      console.error('❌ El token ha expirado');
      return;
    }
    
  } catch (e) {
    console.error('❌ Error decodificando token:', e);
    return;
  }
  
  // 3. Test del endpoint
  console.log('8. Probando endpoint GET /personal...');
  
  fetch('http://localhost:3000/personal', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('9. Respuesta GET /personal:', response.status, response.statusText);
    if (response.status === 200) {
      console.log('✅ Autenticación funcionando correctamente');
    } else if (response.status === 401) {
      console.error('❌ Error 401: Problema de autenticación');
    } else {
      console.warn('⚠️ Respuesta inesperada:', response.status);
    }
    return response.text();
  })
  .then(data => {
    console.log('10. Datos recibidos (primeros 200 chars):', data.substring(0, 200));
  })
  .catch(error => {
    console.error('❌ Error en petición:', error);
  });
  
  console.log('==============================');
}

// Ejecutar la prueba
testAuth(); 