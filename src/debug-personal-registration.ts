import { AuthService } from './app/core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from './environments/environment';

// Script de debug para verificar autenticación antes de registro de personal
export function debugPersonalRegistration() {
  console.log('=== DEBUG REGISTRO DE PERSONAL ===');
  
  // Verificar token en localStorage
  const token = localStorage.getItem('token');
  console.log('1. Token en localStorage:', token ? 'Presente' : 'Ausente');
  
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('2. Payload del token:', payload);
      console.log('3. Rol del usuario:', payload.role);
      console.log('4. Expira en:', new Date(payload.exp * 1000));
      console.log('5. Tiempo actual:', new Date());
      console.log('6. Token válido:', new Date() < new Date(payload.exp * 1000));
    } catch (e) {
      console.error('Error al decodificar token:', e);
    }
  }
  
  // Verificar currentUser en AuthService
  console.log('7. Usuario actual disponible en AuthService');
  
  // Test de headers para POST
  console.log('8. Headers que se enviarán:');
  if (token) {
    console.log('   Authorization: Bearer ' + token.substring(0, 20) + '...');
    console.log('   Content-Type: application/json');
  }
  
  console.log('9. URL del endpoint:', environment.apiUrl + '/personal');
  console.log('================================');
}

// Test directo del endpoint
export async function testPersonalEndpoint() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No hay token disponible');
    return;
  }

  try {
    const response = await fetch(environment.apiUrl + '/personal', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Test GET /personal:', response.status, response.statusText);
    
    if (response.status === 401) {
      console.error('Error 401: Token inválido o usuario sin permisos');
    }
    
  } catch (error) {
    console.error('Error en test de endpoint:', error);
  }
} 