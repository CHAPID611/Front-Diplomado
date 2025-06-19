import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    console.log('🔄 AuthInterceptor: Interceptando petición a:', request.url);
    
    const token = this.authService.getToken();
    console.log('🔑 AuthInterceptor: Token obtenido:', token ? 'Presente (length: ' + token.length + ')' : 'Ausente');
    
    if (token) {
      console.log('✅ AuthInterceptor: Agregando token a petición:', request.url);
      console.log('🎯 AuthInterceptor: Token usado:', token.substring(0, 50) + '...');
      
      const authRequest = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('📤 AuthInterceptor: Headers agregados:', authRequest.headers.get('Authorization') ? 'Sí' : 'No');
      return next.handle(authRequest);
    } else {
      console.error('❌ AuthInterceptor: No hay token disponible para:', request.url);
    return next.handle(request);
    }
  }
} 