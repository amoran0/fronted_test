import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { delay, mergeMap, of, throwError, timer } from 'rxjs';
import { entorno } from '../../entornos/entorno';
import { ErrorSimulado, atenderPeticion } from './servidor-simulado';

/** Latencia simulada de red, para ver los estados de carga. */
const LATENCIA_MS = 150;

/**
 * Responde las peticiones a la API con el servidor simulado, sin salir del navegador.
 * Las peticiones siguen pasando por `HttpClient` y por el interceptor de sesión, y las
 * respuestas (incluidos los errores `ProblemDetail`) tienen el mismo formato que la API real.
 * Se registra solo con `entorno.usarDatosSimulados` (ver `configuracion-aplicacion.ts`).
 */
export const interceptorSimulado: HttpInterceptorFn = (peticion, siguienteManejador) => {
  if (!peticion.url.startsWith(entorno.urlApi)) return siguienteManejador(peticion);
  const ruta = peticion.url.slice(entorno.urlApi.length).split('?')[0];
  try {
    const respuesta = atenderPeticion({
      metodo: peticion.method,
      ruta,
      parametros: peticion.params,
      cuerpo: peticion.body,
      autorizacion: peticion.headers.get('Authorization'),
    });
    return of(
      new HttpResponse({ status: respuesta.estado, body: respuesta.cuerpo, url: peticion.urlWithParams }),
    ).pipe(delay(LATENCIA_MS));
  } catch (error) {
    const errorHttp =
      error instanceof ErrorSimulado
        ? new HttpErrorResponse({
            status: error.estado,
            statusText: error.titulo,
            error: error.aProblema(ruta),
            url: peticion.urlWithParams,
          })
        : new HttpErrorResponse({
            status: 500,
            statusText: 'Error interno',
            error: { status: 500, title: 'Error interno', detail: 'Se ha producido un error inesperado en el servidor' },
            url: peticion.urlWithParams,
          });
    if (!(error instanceof ErrorSimulado)) console.error('[servidor simulado]', error);
    return timer(LATENCIA_MS).pipe(mergeMap(() => throwError(() => errorHttp)));
  }
};
