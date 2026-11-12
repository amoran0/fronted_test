import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol } from '../models/usuario';
import { ServicioAutenticacion, INICIO_POR_ROL } from '../services/servicio-autenticacion';

/**
 * Protege rutas por sesión y rol. Uso en la ruta:
 * `canActivate: [guardaPorRol], data: { roles: ['admin'] }`
 * - Sin sesión: envía a /acceder y recuerda la URL de destino (`?volver=`).
 * - Con otro rol: envía a la página de inicio de su rol.
 */
export const guardaPorRol: CanActivateFn = (rutaSolicitada, estadoNavegacion) => {
  const autenticacion = inject(ServicioAutenticacion);
  const enrutador = inject(Router);
  const rolesPermitidos = (rutaSolicitada.data['roles'] as Rol[] | undefined) ?? [];

  if (!autenticacion.autenticado()) {
    return enrutador.createUrlTree(['/acceder'], { queryParams: { volver: estadoNavegacion.url } });
  }
  if (!rolesPermitidos.length || rolesPermitidos.includes(autenticacion.rol())) return true;
  return enrutador.createUrlTree([INICIO_POR_ROL[autenticacion.rol()]]);
};
