import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    console.log('AdminGuard: Verificando permisos de administrador...');
    
    if (!this.authService.isAuthenticated()) {
      console.log('AdminGuard: Usuario no autenticado, redirigiendo al login');
      this.router.navigate(['/login']);
      return false;
    }

    const userRole = this.authService.getUserRole();
    console.log('AdminGuard: Rol del usuario:', userRole);
    
    const isAdmin = userRole === 'admin' || userRole === 'ADMIN' || userRole === 'Administrador';
    
    if (!isAdmin) {
      console.log('AdminGuard: Usuario no es administrador, acceso denegado');
      this.router.navigate(['/dashboard']);
      return false;
    }

    console.log('AdminGuard: Usuario administrador verificado, acceso permitido');
    return true;
  }
} 