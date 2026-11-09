import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, INICIO_POR_ROL } from '../services/auth.service';

/** Exige sesión iniciada; si no, envía a /acceder y recuerda la URL de destino. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  return auth.autenticado() || inject(Router).createUrlTree(['/acceder'], { queryParams: { volver: state.url } });
};

/** Para /acceder: si ya hay sesión, lleva a la página de inicio del rol. */
export const invitadoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return !auth.autenticado() || inject(Router).createUrlTree([INICIO_POR_ROL[auth.rol()]]);
};
