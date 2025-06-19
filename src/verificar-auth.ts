// Script para verificar estado de autenticación
// Ejecutar en la consola del navegador

function verificarEstadoAuth() {
  console.log('🔍 === VERIFICACIÓN COMPLETA DE AUTENTICACIÓN ===');
  
  // 1. Verificar localStorage
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('currentUser');
  
  console.log('📦 LocalStorage:');
  console.log('  - Token:', token ? 'Presente' : '❌ Ausente');
  console.log('  - User:', user ? 'Presente' : '❌ Ausente');
  
  if (token) {
    console.log('  - Token (primeros 50 chars):', token.substring(0, 50) + '...');
  }
  
  if (user) {
    try {
      const userData = JSON.parse(user);
      console.log('  - User data:', userData);
    } catch (e) {
      console.error('  - Error parseando user data:', e);
    }
  }
  
  // 2. Verificar estado de Angular AuthService (si está disponible)
  if ((window as any).ng) {
    console.log('🅰️ Verificando AuthService...');
  } else {
    console.log('⚠️ Angular context no disponible');
  }
  
  // 3. Sugerencias
  console.log('💡 SOLUCIONES:');
  
  if (!token) {
    console.log('❌ NO HAY TOKEN - NECESITAS HACER LOGIN');
    console.log('📝 Pasos a seguir:');
    console.log('  1. Ve a la página de login');
    console.log('  2. Ingresa con tus credenciales');
    console.log('  3. Verifica que el login sea exitoso');
    console.log('  4. Intenta registrar personal nuevamente');
  } else {
    console.log('✅ HAY TOKEN - Verificando validez...');
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      
      if (payload.exp < now) {
        console.log('❌ TOKEN EXPIRADO');
        console.log('  - Expiró:', new Date(payload.exp * 1000));
        console.log('  - Ahora:', new Date());
        console.log('📝 Necesitas hacer login nuevamente');
      } else {
        console.log('✅ TOKEN VÁLIDO');
        console.log('  - Rol:', payload.role);
        console.log('  - Expira:', new Date(payload.exp * 1000));
      }
    } catch (e) {
      console.log('❌ TOKEN MALFORMADO:', e);
      console.log('📝 Elimina el token corrupto y haz login nuevamente');
    }
  }
  
  console.log('\n🔧 ACCIONES RÁPIDAS:');
  console.log('📋 Para limpiar autenticación: localStorage.clear()');
  console.log('🔄 Para ir a login: window.location.href = "/login"');
  
  console.log('===================================================');
}

// Ejecutar verificación
verificarEstadoAuth(); 