import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;
  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY = 'currentUser';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Acceder a localStorage solo si se está ejecutando en el navegador
if (isPlatformBrowser(this.platformId)) {
  const savedUser = localStorage.getItem(this.USER_KEY);
  const savedToken = localStorage.getItem(this.TOKEN_KEY);

  if (savedToken) {
    try {
      const tokenPayload = JSON.parse(atob(savedToken.split('.')[1]));
      const expirationDate = new Date(tokenPayload.exp * 1000);
      const isTokenValid = expirationDate > new Date();

      if (isTokenValid && savedUser) {
        console.log('✅ AuthService: Sesión válida encontrada, mantener logueado');
        this.currentUserSubject = new BehaviorSubject<any>(JSON.parse(savedUser));
      } else {
        console.log('❌ AuthService: Token expirado o usuario no encontrado, limpiar datos');
        this.clearAuth();
        this.currentUserSubject = new BehaviorSubject<any>(null);
      }
    } catch (error) {
      console.error('❌ AuthService: Error validando token guardado:', error);
      this.clearAuth();
      this.currentUserSubject = new BehaviorSubject<any>(null);
    }
  } else {
    this.currentUserSubject = new BehaviorSubject<any>(null);
  }
} else {
  this.currentUserSubject = new BehaviorSubject<any>(null);
}

    }
    this.currentUser = this.currentUserSubject.asObservable();
  }

  private clearAuth(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
    this.currentUserSubject?.next(null);
  }

  public get currentUserValue() {
    return this.currentUserSubject.value;
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(response => {
          // Almacenar en localStorage solo en el navegador
          if (isPlatformBrowser(this.platformId) && response) {
            const token = response.access_token || response.token;
            const user = response.user || response;
            
            if (token) {
              localStorage.setItem(this.TOKEN_KEY, token);
              localStorage.setItem(this.USER_KEY, JSON.stringify(user));
              this.currentUserSubject.next(user);
              console.log('✅ AuthService: Token guardado en localStorage con clave:', this.TOKEN_KEY);
              console.log('✅ AuthService: Usuario guardado:', user);
              console.log('✅ AuthService: Rol del usuario:', user.role || user.roles);
            } else {
              console.error('❌ AuthService: No se encontró token en la respuesta:', response);
            }
          }
        })
      );
  }

  logout() {
    // Eliminar de localStorage solo en el navegador
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    // Obtener de localStorage solo en el navegador
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    console.log('AuthService: Verificando autenticación. Token obtenido:', token ? 'Existe' : 'No existe');

    if (!token) {
      console.log('AuthService: No hay token. Usuario NO autenticado.');
      return false;
    }
    
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const expirationDate = new Date(tokenPayload.exp * 1000);
      const isTokenValid = expirationDate > new Date();
      
      console.log('AuthService: Token decodificado. Fecha de expiración:', expirationDate);
      console.log('AuthService: Token válido (no expirado):', isTokenValid);
      
      if (!isTokenValid) {
        console.log('AuthService: Token expirado. Realizando logout.');
        this.logout(); // Asegurarse de que el token expirado se elimine
      }
      
      return isTokenValid;
    } catch (error) {
      console.error('AuthService: Error al decodificar o validar el token:', error);
      this.logout(); // Limpiar el estado en caso de token corrupto
      return false;
    }
  }

  getUserRole(): string {
    const user = this.currentUserValue; 
    let role = '';
    console.log('AuthService: En getUserRole - Objeto de usuario:', user);

    if (user && user.roles) {
      console.log('AuthService: En getUserRole - Array de roles:', user.roles);
      if (user.roles.length > 0) {
        console.log('AuthService: En getUserRole - Primer elemento del array roles:', user.roles[0]);
        // Intentar extraer el rol de diferentes maneras, si la primera falla
        if (typeof user.roles[0] === 'string') {
          role = user.roles[0];
        } else if (user.roles[0] && user.roles[0].name) {
          role = user.roles[0].name;
        } else if (user.roles[0] && user.roles[0].role) { // Si el campo es 'role' en lugar de 'name'
          role = user.roles[0].role;
        }
      }
    }
    console.log('AuthService: Rol final obtenido:', role);
    return role;
  }

  getCurrentUser(): any {
    return this.currentUserValue;
  }

  // Método para verificar y renovar la sesión antes de operaciones críticas
  verifyAndRefreshSession(): boolean {
    const token = this.getToken();
    
    if (!token) {
      console.log('❌ No hay token disponible');
      return false;
    }
    
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const expirationDate = new Date(tokenPayload.exp * 1000);
      const currentTime = new Date();
      const timeUntilExpiry = expirationDate.getTime() - currentTime.getTime();
      const minutesUntilExpiry = timeUntilExpiry / (1000 * 60);
      
      console.log(`⏰ Token expira en ${minutesUntilExpiry.toFixed(2)} minutos`);
      
      // Si faltan menos de 5 minutos para expirar, alertar al usuario
      if (minutesUntilExpiry < 5 && minutesUntilExpiry > 0) {
        console.log('⚠️ Token cerca de expirar');
        // Aquí podrías implementar renovación automática del token
      }
      
      return minutesUntilExpiry > 0;
    } catch (error) {
      console.error('❌ Error verificando token:', error);
      return false;
    }
  }

  // Método para obtener información del token
  getTokenInfo(): any {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      return {
        userId: tokenPayload.sub,
        email: tokenPayload.email,
        exp: new Date(tokenPayload.exp * 1000),
        iat: new Date(tokenPayload.iat * 1000),
        timeLeft: new Date(tokenPayload.exp * 1000).getTime() - new Date().getTime()
      };
    } catch (error) {
      console.error('Error decodificando token:', error);
      return null;
    }
  }
} 