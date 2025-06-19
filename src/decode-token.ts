// Decodificar y verificar el token actual
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiY29ycmVvQGVqZW1wbG8uY29tIiwicm9sZXMiOlsiYWRtaW4iXSwiaWF0IjoxNzUwMTk4NjE1LCJleHAiOjE3NTAyODUwMTV9.GpR2YtHU0g7vc0Y73qwDQlcxuBBQPsmmumdSfVDpKJg";

try {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('🔍 === ANÁLISIS DEL TOKEN ===');
  console.log('📋 Payload completo:', payload);
  console.log('👤 Usuario ID:', payload.sub);
  console.log('📧 Email:', payload.email);
  console.log('🔐 Roles:', payload.roles);
  console.log('⏰ Issued at:', new Date(payload.iat * 1000));
  console.log('⏰ Expires at:', new Date(payload.exp * 1000));
  console.log('⏰ Tiempo actual:', new Date());
  
  const now = Date.now() / 1000;
  const isValid = payload.exp > now;
  const timeLeft = (payload.exp - now) / 3600; // horas restantes
  
  console.log('✅ Token válido:', isValid);
  console.log('⏰ Tiempo restante:', Math.round(timeLeft), 'horas');
  
  if (isValid) {
    console.log('🎯 EL TOKEN ES VÁLIDO - El problema está en otro lado');
  } else {
    console.log('❌ EL TOKEN HA EXPIRADO');
  }
  
} catch (e) {
  console.error('❌ Error decodificando token:', e);
}

console.log('==============================='); 