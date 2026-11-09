import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol } from '../models/usuario';
import { AuthService, INICIO_POR_ROL } from '../services/auth.service';

/**
 * Protege rutas por rol. Uso en la ruta:
 * `canActivate: [roleGuard], data: { roles: ['admin'] }`
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const permitidos = (route.data['roles'] as Rol[] | undefined) ?? [];

  if (!permitidos.length || permitidos.includes(auth.rol())) return true;
  if (!auth.autenticado()) return router.createUrlTree(['/acceder'], { queryParams: { volver: state.url } });
  return router.createUrlTree([INICIO_POR_ROL[auth.rol()]]);
};
