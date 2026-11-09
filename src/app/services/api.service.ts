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
  private readonly base = environment.apiUrl;

  get<T>(ruta: string, mock: () => T): Observable<T> {
    return environment.useMocks ? this.simular(mock) : this.http.get<T>(this.base + ruta);
  }

  post<T>(ruta: string, cuerpo: unknown, mock: () => T): Observable<T> {
    return environment.useMocks ? this.simular(mock) : this.http.post<T>(this.base + ruta, cuerpo);
  }

  put<T>(ruta: string, cuerpo: unknown, mock: () => T): Observable<T> {
    return environment.useMocks ? this.simular(mock) : this.http.put<T>(this.base + ruta, cuerpo);
  }

  patch<T>(ruta: string, cuerpo: unknown, mock: () => T): Observable<T> {
    return environment.useMocks ? this.simular(mock) : this.http.patch<T>(this.base + ruta, cuerpo);
  }

  delete<T>(ruta: string, mock: () => T): Observable<T> {
    return environment.useMocks ? this.simular(mock) : this.http.delete<T>(this.base + ruta);
  }

  private simular<T>(mock: () => T): Observable<T> {
    return defer(() => of(structuredClone(mock()))).pipe(delay(150));
  }
}
