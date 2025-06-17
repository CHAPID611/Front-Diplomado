import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    console.log('AuthGuard: canActivate se está ejecutando para la ruta:', state.url);
    if (this.authService.isAuthenticated()) {
      console.log('AuthGuard: Usuario autenticado. Acceso permitido.');
      return true;
    } else {
      console.log('AuthGuard: Usuario NO autenticado. Redirigiendo a /login.');
      this.router.navigate(['/login']);
      return false;
    }
  }
} 