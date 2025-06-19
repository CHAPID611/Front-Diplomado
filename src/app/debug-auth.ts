// Archivo temporal para debug de autenticación
// Ejecutar en la consola del navegador para verificar el estado

export function debugAuth() {
  const token = localStorage.getItem('auth_token');
  const user = localStorage.getItem('current_user');
  
  console.log('🔍 Debug de Autenticación:');
  console.log('Token:', token ? `${token.substring(0, 20)}...` : 'No encontrado');
  console.log('Usuario:', user ? JSON.parse(user) : 'No encontrado');
  console.log('Headers que se enviarían:', {
    'Authorization': token ? `Bearer ${token}` : 'Sin token',
    'Content-Type': 'application/json'
  });
  
  if (!token) {
    console.warn('⚠️ No hay token de autenticación. El usuario debe hacer login primero.');
    console.log('💡 Para probar sin autenticación, la aplicación ahora usará datos mock.');
  } else {
    console.log('✅ Token encontrado. Las peticiones deberían funcionar.');
  }
}

// Para usar en la consola del navegador:
// import('./debug-auth').then(m => m.debugAuth())

(window as any).debugAuth = debugAuth; 