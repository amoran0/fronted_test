import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ServicioAutenticacion, INICIO_POR_ROL } from '../servicios/servicio-autenticacion';

/** Exige sesión iniciada; si no, envía a /acceder y recuerda la URL de destino. */
export const guardaSesionIniciada: CanActivateFn = (_rutaSolicitada, estadoNavegacion) => {
  const autenticacion = inject(ServicioAutenticacion);
  return (
    autenticacion.autenticado() ||
    inject(Router).createUrlTree(['/acceder'], { queryParams: { volver: estadoNavegacion.url } })
  );
};

/** Para /acceder: si ya hay sesión, lleva a la página de inicio del rol. */
export const guardaSoloInvitados: CanActivateFn = () => {
  const autenticacion = inject(ServicioAutenticacion);
  return !autenticacion.autenticado() || inject(Router).createUrlTree([INICIO_POR_ROL[autenticacion.rol()]]);
};
