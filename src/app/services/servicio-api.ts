import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { entorno } from '../../entornos/entorno';
import { ProblemaApi } from '../models/api';

/** Valores admitidos como parámetros de la URL (`?clave=valor`). */
export type ParametrosConsulta = Record<
  string,
  string | number | boolean | (string | number)[] | null | undefined
>;

/**
 * Error de la API ya traducido para la interfaz: `message` es el texto para el usuario y
 * `errores` trae los mensajes por campo de los 400 de validación.
 */
export class ErrorApi extends Error {
  constructor(
    message: string,
    readonly estado: number,
    readonly errores: Record<string, string> = {},
  ) {
    super(message);
  }
}

/**
 * Punto único de acceso a la API REST: todas las peticiones salen de aquí con `HttpClient`.
 * Con `entorno.usarDatosSimulados` las contesta el interceptor de `src/app/simulacion`,
 * así que este servicio funciona igual con la API real y con la simulada.
 */
@Injectable({ providedIn: 'root' })
export class ServicioApi {
  private readonly clienteHttp = inject(HttpClient);

  /** GET: consulta un recurso. Los `parametros` viajan en la URL (filtros, paginación…). */
  obtener<T>(ruta: string, parametros?: ParametrosConsulta): Observable<T> {
    return this.pedir('GET', ruta, undefined, parametros);
  }

  /** POST: crea un recurso. El cuerpo viaja en JSON. */
  crear<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.pedir('POST', ruta, cuerpo);
  }

  /** PUT: sustituye un recurso completo. */
  reemplazar<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.pedir('PUT', ruta, cuerpo);
  }

  /** PATCH: modifica parte de un recurso. */
  modificar<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.pedir('PATCH', ruta, cuerpo);
  }

  /** DELETE: elimina un recurso (la API responde 204 sin cuerpo). */
  eliminar(ruta: string): Observable<void> {
    return this.pedir<void>('DELETE', ruta);
  }

  private pedir<T>(
    metodoHttp: string,
    ruta: string,
    cuerpo?: unknown,
    parametros?: ParametrosConsulta,
  ): Observable<T> {
    return this.clienteHttp
      .request<T>(metodoHttp, entorno.urlApi + ruta, {
        body: cuerpo,
        params: crearParametrosHttp(parametros),
      })
      .pipe(catchError((errorHttp: unknown) => throwError(() => traducirError(errorHttp))));
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
 * Traduce un error HTTP a `ErrorApi`. La API envía siempre un `ProblemDetail`:
 * `detail` es el mensaje para el usuario (p. ej. el de una regla de negocio en un 422)
 * y `errores` los mensajes por campo de un 400 de validación.
 */
export function traducirError(errorHttp: unknown): ErrorApi {
  if (!(errorHttp instanceof HttpErrorResponse))
    return new ErrorApi('Ha ocurrido un error inesperado.', 0);
  const problema = (typeof errorHttp.error === 'object' ? errorHttp.error : null) as
    Partial<ProblemaApi> | null;
  const errores = problema?.errores ?? {};
  const detalleCampos = Object.values(errores).join(' · ');
  const mensaje =
    (detalleCampos && problema?.status === 400 ? detalleCampos : problema?.detail) ||
    mensajePorEstado(errorHttp.status);
  return new ErrorApi(mensaje, errorHttp.status, errores);
}

/** Texto para el usuario de cualquier error HTTP. */
export function mensajeDeError(errorHttp: unknown): string {
  return traducirError(errorHttp).message;
}

function mensajePorEstado(estado: number): string {
  if (estado === 0) return 'No se puede conectar con el servidor. Comprueba tu conexión.';
  if (estado === 401) return 'Tu sesión ha caducado. Vuelve a iniciar sesión.';
  if (estado === 403) return 'No tienes permiso para realizar esta acción.';
  if (estado === 404) return 'El recurso solicitado no existe.';
  if (estado >= 500) return 'El servidor no ha podido completar la operación. Inténtalo más tarde.';
  return `Error ${estado} al comunicarse con el servidor.`;
}
