import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, defer, delay, of } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Punto único de acceso a la API REST.
 * Con `environment.useMocks` devuelve el resultado de la función `mock` con una pequeña
 * latencia; si la función lanza un error, el observable emite ese error (como haría la API).
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  get<T>(ruta: string, mock: () => T): Observable<T> {
    return this.pedir('GET', ruta, undefined, mock);
  }

  post<T>(ruta: string, cuerpo: unknown, mock: () => T): Observable<T> {
    return this.pedir('POST', ruta, cuerpo, mock);
  }

  put<T>(ruta: string, cuerpo: unknown, mock: () => T): Observable<T> {
    return this.pedir('PUT', ruta, cuerpo, mock);
  }

  patch<T>(ruta: string, cuerpo: unknown, mock: () => T): Observable<T> {
    return this.pedir('PATCH', ruta, cuerpo, mock);
  }

  private pedir<T>(metodo: string, ruta: string, body: unknown, mock: () => T): Observable<T> {
    if (environment.useMocks) return defer(() => of(structuredClone(mock()))).pipe(delay(150));
    return this.http.request<T>(metodo, environment.apiUrl + ruta, { body });
  }
}
