import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { rutas } from './rutas';
import { interceptorSesion } from './interceptors/interceptor-sesion';
import { entorno } from '../entornos/entorno';
// ↓ Datos simulados: al conectar la API real, borra esta línea y la carpeta `simulacion/`.
import { interceptorSimulado } from './simulacion/interceptor-simulado';

registerLocaleData(localeEs);

export const configuracionAplicacion: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(rutas, withComponentInputBinding(), withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    // El de sesión va primero: añade el token y, con datos simulados, el simulado responde la petición.
    provideHttpClient(
      withFetch(),
      withInterceptors([interceptorSesion, ...(entorno.usarDatosSimulados ? [interceptorSimulado] : [])]),
    ),
    { provide: LOCALE_ID, useValue: 'es-ES' },
  ],
};
