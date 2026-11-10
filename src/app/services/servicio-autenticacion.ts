import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { Credenciales, Rol, Sesion } from '../models/usuario';
import { ServicioApi } from './servicio-api';
import { USUARIOS_SIMULADOS } from './datos-simulados';
import { guardarJson, leerJson } from '../utils/almacen';

/** Clave de localStorage donde se guarda la sesión. */
const CLAVE_SESION_GUARDADA = 'tcr.sesion';

/** Página de inicio de cada rol tras iniciar sesión. */
export const INICIO_POR_ROL: Record<Rol, string> = {
  publico: '/carta',
  cliente: '/carta',
  barista: '/barista/cola',
  admin: '/admin/carta',
};

@Injectable({ providedIn: 'root' })
export class ServicioAutenticacion {
  private readonly api = inject(ServicioApi);
  private readonly enrutador = inject(Router);

  private readonly sesion = signal(leerJson<Sesion>(CLAVE_SESION_GUARDADA));

  readonly usuario = computed(() => this.sesion()?.usuario ?? null);
  readonly token = computed(() => this.sesion()?.token ?? null);
  readonly rol = computed<Rol>(() => this.sesion()?.usuario.rol ?? 'publico');
  readonly autenticado = computed(() => !!this.sesion());

  iniciarSesion(credenciales: Credenciales): Observable<Sesion> {
    return this.api
      .crear<Sesion>('/auth/login', credenciales, () => {
        const usuarioEncontrado = USUARIOS_SIMULADOS.find(
          (usuarioSimulado) =>
            usuarioSimulado.email.toLowerCase() === credenciales.email.trim().toLowerCase() &&
            usuarioSimulado.contrasena === credenciales.contrasena,
        );
        if (!usuarioEncontrado) throw new Error('Email o contraseña incorrectos.');
        const { contrasena: _contrasenaOmitida, ...usuario } = usuarioEncontrado;
        return { token: 'demo.' + btoa(usuarioEncontrado.id), usuario };
      })
      .pipe(tap((sesionIniciada) => this.guardarSesion(sesionIniciada)));
  }

  cerrarSesion(): void {
    this.guardarSesion(null);
    this.enrutador.navigateByUrl('/carta');
  }

  private guardarSesion(sesion: Sesion | null): void {
    this.sesion.set(sesion);
    guardarJson(CLAVE_SESION_GUARDADA, sesion);
  }
}
