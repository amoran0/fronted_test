import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ServicioAutenticacion, INICIO_POR_ROL } from '../services/servicio-autenticacion';

/** Para /acceder y /registro: si ya hay sesión, lleva a la página de inicio del rol. */
export const guardaSoloInvitados: CanActivateFn = () => {
  const autenticacion = inject(ServicioAutenticacion);
  return (
    !autenticacion.autenticado() ||
    inject(Router).createUrlTree([INICIO_POR_ROL[autenticacion.rol()]])
  );
};
