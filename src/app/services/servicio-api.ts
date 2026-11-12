import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, defer, delay, of, throwError } from 'rxjs';
import { entorno } from '../../entornos/entorno';

/** Valores admitidos como parámetros de la URL (`?clave=valor`). */
export type ParametrosConsulta = Record<
  string,
  string | number | boolean | (string | number)[] | null | undefined
>;

/**
 * Punto único de acceso a la API REST.
 * Con `entorno.usarDatosSimulados` devuelve el resultado de la función `generarDatosSimulados`
 * con una pequeña latencia; si esa función lanza un error, el observable emite ese error
 * (como haría la API).
 */
@Injectable({ providedIn: 'root' })
export class ServicioApi {
  private readonly clienteHttp = inject(HttpClient);

  /** GET: consulta un recurso. Los `parametros` viajan en la URL (filtros, paginación…). */
  obtener<T>(
    ruta: string,
    generarDatosSimulados: () => T,
    parametros?: ParametrosConsulta,
  ): Observable<T> {
    return this.pedir('GET', ruta, undefined, generarDatosSimulados, parametros);
  }

  /** POST: crea un recurso. */
  crear<T>(ruta: string, cuerpo: unknown, generarDatosSimulados: () => T): Observable<T> {
    return this.pedir('POST', ruta, cuerpo, generarDatosSimulados);
  }

  /** PUT: sustituye un recurso completo. */
  reemplazar<T>(ruta: string, cuerpo: unknown, generarDatosSimulados: () => T): Observable<T> {
    return this.pedir('PUT', ruta, cuerpo, generarDatosSimulados);
  }

  /** PATCH: modifica parte de un recurso. */
  modificar<T>(ruta: string, cuerpo: unknown, generarDatosSimulados: () => T): Observable<T> {
    return this.pedir('PATCH', ruta, cuerpo, generarDatosSimulados);
  }

  /** DELETE: elimina un recurso. */
  eliminar<T = void>(ruta: string, generarDatosSimulados: () => T): Observable<T> {
    return this.pedir('DELETE', ruta, undefined, generarDatosSimulados);
  }

  private pedir<T>(
    metodoHttp: string,
    ruta: string,
    cuerpo: unknown,
    generarDatosSimulados: () => T,
    parametros?: ParametrosConsulta,
  ): Observable<T> {
    if (entorno.usarDatosSimulados) {
      return defer(() => of(structuredClone(generarDatosSimulados()))).pipe(delay(150));
    }
    return this.clienteHttp
      .request<T>(metodoHttp, entorno.urlApi + ruta, {
        body: cuerpo,
        params: crearParametrosHttp(parametros),
      })
      .pipe(
        catchError((errorHttp: unknown) => throwError(() => new Error(mensajeDeError(errorHttp)))),
      );
  }
}

/** Convierte un objeto en `HttpParams`, omitiendo los valores vacíos. Los arrays se envían repetidos. */
export function crearParametrosHttp(parametros: ParametrosConsulta = {}): HttpParams {
  return Object.entries(parametros).reduce((parametrosHttp, [clave, valor]) => {
    if (valor === null || valor === undefined || valor === '') return parametrosHttp;
    if (Array.isArray(valor)) {
      return valor.reduce<HttpParams>(
        (acumulado, elemento) => acumulado.append(clave, String(elemento)),
        parametrosHttp,
      );
    }
    return parametrosHttp.set(clave, String(valor));
  }, new HttpParams());
}

/**
 * Traduce un error HTTP a un texto para el usuario. Usa el mensaje que envía el servidor
 * (`message`, `mensaje` o `error` en el cuerpo) y, si no hay, uno genérico según el código.
 */
export function mensajeDeError(errorHttp: unknown): string {
  if (!(errorHttp instanceof HttpErrorResponse)) return 'Ha ocurrido un error inesperado.';
  const cuerpo = errorHttp.error as
    { message?: string; mensaje?: string; error?: string } | string | null;
  const mensajeServidor =
    typeof cuerpo === 'string' ? cuerpo : (cuerpo?.message ?? cuerpo?.mensaje ?? cuerpo?.error);
  if (mensajeServidor) return mensajeServidor;
  if (errorHttp.status === 0) return 'No se puede conectar con el servidor. Comprueba tu conexión.';
  if (errorHttp.status === 401) return 'Tu sesión ha caducado. Vuelve a iniciar sesión.';
  if (errorHttp.status === 403) return 'No tienes permiso para realizar esta acción.';
  if (errorHttp.status === 404) return 'El recurso solicitado no existe.';
  if (errorHttp.status >= 500)
    return 'El servidor no ha podido completar la operación. Inténtalo más tarde.';
  return `Error ${errorHttp.status} al comunicarse con el servidor.`;
}
