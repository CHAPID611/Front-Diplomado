intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
  console.log('🔄 AuthInterceptor: Interceptando petición a:', request.url);

  const token = this.authService.getToken();
  console.log('🔑 AuthInterceptor: Token obtenido:', token ? 'Presente (length: ' + token.length + ')' : 'Ausente');

  if (token) {
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const expirationDate = new Date(tokenPayload.exp * 1000);
      const isTokenValid = expirationDate > new Date();

      if (isTokenValid) {
        console.log('✅ AuthInterceptor: Agregando token válido a la petición:', request.url);
        console.log('🎯 Token usado:', token.substring(0, 50) + '...');
        
        const authRequest = request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });

        console.log('📤 Headers agregados:', authRequest.headers.get('Authorization') ? 'Sí' : 'No');
        return next.handle(authRequest);
      } else {
        console.warn('🔒 Token expirado, redirigiendo al login');
        this.authService.logout();
        this.router.navigate(['/login']);
        return throwError(() => new Error('Token expirado'));
      }
    } catch (error) {
      console.error('🔒 Error al validar el token', error);
      this.authService.logout();
      this.router.navigate(['/login']);
      return throwError(() => new Error('Token inválido'));
    }
  } else {
    console.error('❌ No hay token disponible para:', request.url);
    return next.handle(request);
  }

  // Manejo de errores HTTP
  return next.handle(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.warn('🔐 Error 401 - sesión expirada o no autorizada');
        this.authService.logout();
        this.router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
}
