import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authFunctionalInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('🔄 AuthFunctionalInterceptor: Interceptando petición a:', req.url);
  
  const authService = inject(AuthService);
  const token = authService.getToken();
  
  console.log('🔑 AuthFunctionalInterceptor: Token obtenido:', token ? 'Presente (length: ' + token.length + ')' : 'Ausente');
  
  if (token) {
    console.log('✅ AuthFunctionalInterceptor: Agregando token a petición:', req.url);
    console.log('🎯 AuthFunctionalInterceptor: Token usado:', token.substring(0, 50) + '...');
    
    const authRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('📤 AuthFunctionalInterceptor: Headers agregados:', authRequest.headers.get('Authorization') ? 'Sí' : 'No');
    return next(authRequest);
  } else {
    console.error('❌ AuthFunctionalInterceptor: No hay token disponible para:', req.url);
    return next(req);
  }
}; 