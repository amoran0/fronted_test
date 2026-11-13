import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { entorno } from '../../entornos/entorno';
import { ServicioAutenticacion } from '../services/servicio-autenticacion';

/** Añade el token de sesión a las peticiones a nuestra API y cierra sesión si caduca (401). */
export const interceptorSesion: HttpInterceptorFn = (peticionOriginal, siguienteManejador) => {
  const autenticacion = inject(ServicioAutenticacion);
  const token = autenticacion.token();
  const esNuestraApi = peticionOriginal.url.startsWith(entorno.urlApi);

  const peticion =
    token && esNuestraApi
      ? peticionOriginal.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : peticionOriginal;

  return siguienteManejador(peticion).pipe(
    catchError((error: unknown) => {
      // Solo es «sesión caducada» si se envió un token; un 401 en el login es una contraseña incorrecta.
      const sesionCaducada = error instanceof HttpErrorResponse && error.status === 401 && !!token;
      if (esNuestraApi && sesionCaducada) autenticacion.cerrarSesion();
      return throwError(() => error);
    }),
  );
};
