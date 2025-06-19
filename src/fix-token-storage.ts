// Script para arreglar el almacenamiento del token
// Ejecutar en la consola del navegador

function fixTokenStorage() {
  console.log('🔧 === ARREGLANDO ALMACENAMIENTO DE TOKEN ===');
  
  // Token válido que vimos en el debug
  const validToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiY29ycmVvQGVqZW1wbG8uY29tIiwicm9sZXMiOlsiYWRtaW4iXSwiaWF0IjoxNzUwMTk4NjE1LCJleHAiOjE3NTAyODUwMTV9.GpR2YtHU0g7vc0Y73qwDQlcxuBBQPsmmumdSfVDpKJg";
  
  // Usuario correspondiente
  const user = {
    id: 1,
    email: "correo@ejemplo.com",
    roles: ["admin"]
  };
  
  // Guardar con las claves correctas
  localStorage.setItem('token', validToken);
  localStorage.setItem('currentUser', JSON.stringify(user));
  
  console.log('✅ Token guardado en localStorage con clave "token"');
  console.log('✅ Usuario guardado en localStorage con clave "currentUser"');
  
  // Verificar que se guardó correctamente
  const savedToken = localStorage.getItem('token');
  const savedUser = localStorage.getItem('currentUser');
  
  console.log('📋 Verificación:');
  console.log('  - Token presente:', !!savedToken);
  console.log('  - User presente:', !!savedUser);
  
  if (savedToken && savedUser) {
    console.log('✅ ¡LISTO! Ahora puedes intentar registrar personal nuevamente');
    console.log('🔄 Recomendación: Recarga la página para que Angular detecte los cambios');
  }
  
  console.log('==============================================');
}

// Ejecutar el fix
fixTokenStorage();

// Función adicional para recargar la página
function reloadPage() {
  console.log('🔄 Recargando la página...');
  window.location.reload();
}

console.log('💡 Ejecuta reloadPage() para recargar la página después del fix'); 