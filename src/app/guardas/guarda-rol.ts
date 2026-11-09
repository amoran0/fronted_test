import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol } from '../modelos/usuario';
import { ServicioAutenticacion, INICIO_POR_ROL } from '../servicios/servicio-autenticacion';

/**
 * Protege rutas por rol. Uso en la ruta:
 * `canActivate: [guardaPorRol], data: { roles: ['admin'] }`
 */
export const guardaPorRol: CanActivateFn = (rutaSolicitada, estadoNavegacion) => {
  const autenticacion = inject(ServicioAutenticacion);
  const enrutador = inject(Router);
  const rolesPermitidos = (rutaSolicitada.data['roles'] as Rol[] | undefined) ?? [];

  if (!rolesPermitidos.length || rolesPermitidos.includes(autenticacion.rol())) return true;
  if (!autenticacion.autenticado()) {
    return enrutador.createUrlTree(['/acceder'], { queryParams: { volver: estadoNavegacion.url } });
  }
  return enrutador.createUrlTree([INICIO_POR_ROL[autenticacion.rol()]]);
};
