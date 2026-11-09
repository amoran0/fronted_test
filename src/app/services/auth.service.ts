import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { Credenciales, Rol, Sesion } from '../models/usuario';
import { ApiService } from './api.service';
import { MOCK_USUARIOS } from './mock-data';

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

  private readonly sesion = signal<Sesion | null>(this.leer());

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

  tieneRol(...roles: Rol[]): boolean {
    return roles.includes(this.rol());
  }

  private guardar(s: Sesion | null): void {
    this.sesion.set(s);
    try {
      s ? localStorage.setItem(CLAVE, JSON.stringify(s)) : localStorage.removeItem(CLAVE);
    } catch {
      /* almacenamiento no disponible: la sesión vive solo en memoria */
    }
  }

  private leer(): Sesion | null {
    try {
      const raw = localStorage.getItem(CLAVE);
      return raw ? (JSON.parse(raw) as Sesion) : null;
    } catch {
      return null;
    }
  }
}
