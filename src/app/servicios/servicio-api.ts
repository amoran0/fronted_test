import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, defer, delay, of } from 'rxjs';
import { entorno } from '../../entornos/entorno';

/**
 * Punto único de acceso a la API REST.
 * Con `entorno.usarDatosSimulados` devuelve el resultado de la función `generarDatosSimulados`
 * con una pequeña latencia; si esa función lanza un error, el observable emite ese error
 * (como haría la API).
 */
@Injectable({ providedIn: 'root' })
export class ServicioApi {
  private readonly clienteHttp = inject(HttpClient);

  /** GET: consulta un recurso. */
  obtener<T>(ruta: string, generarDatosSimulados: () => T): Observable<T> {
    return this.pedir('GET', ruta, undefined, generarDatosSimulados);
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

  private pedir<T>(metodoHttp: string, ruta: string, cuerpo: unknown, generarDatosSimulados: () => T): Observable<T> {
    if (entorno.usarDatosSimulados) {
      return defer(() => of(structuredClone(generarDatosSimulados()))).pipe(delay(150));
    }
    return this.clienteHttp.request<T>(metodoHttp, entorno.urlApi + ruta, { body: cuerpo });
  }
}
