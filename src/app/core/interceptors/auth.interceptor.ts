import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();
    
    // Agregar token a todas las peticiones si existe
    if (token) {
      // Verificar si el token no ha expirado antes de agregarlo
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const expirationDate = new Date(tokenPayload.exp * 1000);
        const isTokenValid = expirationDate > new Date();
        
        if (isTokenValid) {
          request = request.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          });
        } else {
          console.log('🔒 AuthInterceptor: Token expirado detectado, limpiando sesión');
          this.authService.logout();
          this.router.navigate(['/login']);
          return throwError(() => new Error('Token expirado'));
        }
      } catch (error) {
        console.error('🔒 AuthInterceptor: Error validando token', error);
        this.authService.logout();
        this.router.navigate(['/login']);
        return throwError(() => new Error('Token inválido'));
      }
    }
    
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Manejar errores 401 automáticamente
        if (error.status === 401) {
          console.log('🔒 AuthInterceptor: Error 401 detectado - cerrando sesión');
          this.authService.logout();
          this.router.navigate(['/login']);
        }
        
        return throwError(() => error);
      })
    );
  }
} 