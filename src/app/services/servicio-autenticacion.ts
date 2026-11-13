import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { LoginPeticionApi, RegistroPeticionApi, SesionApi } from '../models/api';
import { Credenciales, DatosRegistro, Rol, Sesion } from '../models/usuario';
import { ServicioApi } from './servicio-api';
import { guardarJson, leerJson } from '../utils/almacen';
import { mapearSesion } from '../utils/mapeadores';

/** Clave de localStorage donde se guarda la sesión. */
const CLAVE_SESION_GUARDADA = 'tcr.sesion';

/** Página de inicio de cada rol tras iniciar sesión. */
export const INICIO_POR_ROL: Record<Rol, string> = {
  publico: '/carta',
  cliente: '/carta',
  barista: '/barista/cola',
  admin: '/admin/carta',
};

/** Sesión guardada con el formato actual (descarta las de versiones anteriores). */
function leerSesionGuardada(): Sesion | null {
  const sesion = leerJson<Sesion>(CLAVE_SESION_GUARDADA);
  return sesion?.token && sesion.usuario && 'clienteId' in sesion.usuario ? sesion : null;
}

@Injectable({ providedIn: 'root' })
export class ServicioAutenticacion {
  private readonly api = inject(ServicioApi);
  private readonly enrutador = inject(Router);

  private readonly sesion = signal(leerSesionGuardada());

  readonly usuario = computed(() => this.sesion()?.usuario ?? null);
  /** Token JWT que el interceptor añade como `Authorization: Bearer …`. */
  readonly token = computed(() => this.sesion()?.token ?? null);
  readonly rol = computed<Rol>(() => this.sesion()?.usuario.rol ?? 'publico');
  readonly autenticado = computed(() => !!this.sesion());

  /** `POST /auth/login` → `{ token, usuario }`. Con credenciales incorrectas la API responde 401. */
  iniciarSesion(credenciales: Credenciales): Observable<Sesion> {
    const cuerpo: LoginPeticionApi = {
      email: credenciales.email.trim().toLowerCase(),
      contrasena: credenciales.contrasena,
    };
    return this.api.crear<SesionApi>('/auth/login', cuerpo).pipe(
      map(mapearSesion),
      tap((sesionIniciada) => this.guardarSesion(sesionIniciada)),
    );
  }

  /** `POST /auth/registro`: crea una cuenta de CLIENTE y deja la sesión iniciada. Email o DNI repetidos → 409. */
  registrar(datos: DatosRegistro): Observable<Sesion> {
    const cuerpo: RegistroPeticionApi = {
      nombre: datos.nombre.trim(),
      email: datos.email.trim().toLowerCase(),
      dni: datos.dni.trim().toUpperCase(),
      contrasena: datos.contrasena,
    };
    return this.api.crear<SesionApi>('/auth/registro', cuerpo).pipe(
      map(mapearSesion),
      tap((sesionIniciada) => this.guardarSesion(sesionIniciada)),
    );
  }

  /** El token no se invalida en el servidor (JWT sin estado): basta con olvidarlo. */
  cerrarSesion(): void {
    this.guardarSesion(null);
    this.enrutador.navigateByUrl('/carta');
  }

  private guardarSesion(sesion: Sesion | null): void {
    this.sesion.set(sesion);
    guardarJson(CLAVE_SESION_GUARDADA, sesion);
  }
}
