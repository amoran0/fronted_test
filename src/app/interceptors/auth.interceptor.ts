import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

/** Añade el token de sesión a las peticiones a nuestra API y cierra sesión si caduca (401). */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const esNuestraApi = req.url.startsWith(environment.apiUrl);

  const peticion = token && esNuestraApi ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(peticion).pipe(
    catchError((err: unknown) => {
      if (esNuestraApi && err instanceof HttpErrorResponse && err.status === 401) auth.logout();
      return throwError(() => err);
    }),
  );
};
