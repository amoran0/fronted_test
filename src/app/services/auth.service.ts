import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { Credenciales, Rol, Sesion } from '../models/usuario';
import { ApiService } from './api.service';
import { MOCK_USUARIOS } from './mock-data';
import { guardarJson, leerJson } from '../utils/almacen';

const CLAVE = 'tcr.sesion';

/** Página de inicio de cada rol tras iniciar sesión. */
export const INICIO_POR_ROL: Record<Rol, string> = {
  publico: '/carta',
  cliente: '/carta',
  barista: '/barista/cola',
  admin: '/admin/carta',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly sesion = signal(leerJson<Sesion>(CLAVE));

  readonly usuario = computed(() => this.sesion()?.usuario ?? null);
  readonly token = computed(() => this.sesion()?.token ?? null);
  readonly rol = computed<Rol>(() => this.sesion()?.usuario.rol ?? 'publico');
  readonly autenticado = computed(() => !!this.sesion());

  login(cred: Credenciales): Observable<Sesion> {
    return this.api
      .post<Sesion>('/auth/login', cred, () => {
        const u = MOCK_USUARIOS.find(
          (x) => x.email.toLowerCase() === cred.email.trim().toLowerCase() && x.password === cred.password,
        );
        if (!u) throw new Error('Email o contraseña incorrectos.');
        const { password: _omit, ...usuario } = u;
        return { token: 'demo.' + btoa(u.id), usuario };
      })
      .pipe(tap((s) => this.guardar(s)));
  }

  logout(): void {
    this.guardar(null);
    this.router.navigateByUrl('/carta');
  }

  private guardar(s: Sesion | null): void {
    this.sesion.set(s);
    guardarJson(CLAVE, s);
  }
}
