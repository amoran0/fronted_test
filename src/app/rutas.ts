import { Routes } from '@angular/router';
import { guardaSoloInvitados } from './guards/guarda-sesion';
import { guardaPorRol } from './guards/guarda-rol';
import { EstructuraAplicacion } from './components/estructura-aplicacion/estructura-aplicacion';

/** Título de la pestaña del navegador: «Carta · The Coffee Room». */
const titulo = (texto: string) => `${texto} · The Coffee Room`;

/** Página informativa sencilla; `seccion` elige su contenido. */
const informacionSeccion = (seccion: string) => ({
  loadComponent: () =>
    import('./pages/informacion-seccion/informacion-seccion').then(
      (modulo) => modulo.PaginaInformacionSeccion,
    ),
  data: { seccion },
});

/**
 * Rutas de la aplicación. Cada página se descarga al visitarla por primera vez (`loadComponent`).
 * `guardaPorRol` exige sesión iniciada y que el rol esté en `data.roles`.
 */
export const rutas: Routes = [
  {
    path: '',
    component: EstructuraAplicacion,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'carta' },

      // Público (accesible para todos los roles)
      {
        path: 'carta',
        title: titulo('Carta'),
        loadComponent: () => import('./pages/carta/carta').then((modulo) => modulo.PaginaCarta),
      },
      {
        path: 'carta/:id',
        title: titulo('Detalle del producto'),
        loadComponent: () =>
          import('./pages/detalle-producto/detalle-producto').then(
            (modulo) => modulo.PaginaDetalleProducto,
          ),
      },
      { path: 'como-pedir', title: titulo('Cómo pedir'), ...informacionSeccion('como-funciona') },
      {
        path: 'acceder',
        title: titulo('Acceder'),
        canActivate: [guardaSoloInvitados],
        loadComponent: () =>
          import('./pages/acceder/acceder').then((modulo) => modulo.PaginaAcceder),
      },
      {
        path: 'registro',
        title: titulo('Crear cuenta'),
        canActivate: [guardaSoloInvitados],
        loadComponent: () =>
          import('./pages/registro/registro').then((modulo) => modulo.PaginaRegistro),
      },

      // Cliente
      {
        path: '',
        canActivate: [guardaPorRol],
        data: { roles: ['cliente'] },
        children: [
          {
            path: 'pedido',
            title: titulo('Realiza tu pedido'),
            loadComponent: () =>
              import('./pages/realiza-pedido/realiza-pedido').then(
                (modulo) => modulo.PaginaRealizaPedido,
              ),
          },
          {
            path: 'pedido/confirmar',
            title: titulo('Descuento y confirmación'),
            loadComponent: () =>
              import('./pages/confirmacion-pedido/confirmacion-pedido').then(
                (modulo) => modulo.PaginaConfirmacionPedido,
              ),
          },
          {
            path: 'mis-pedidos',
            title: titulo('Mis pedidos'),
            loadComponent: () =>
              import('./pages/mis-pedidos/mis-pedidos').then((modulo) => modulo.PaginaMisPedidos),
          },
          { path: 'perfil', title: titulo('Mi perfil'), ...informacionSeccion('perfil') },
        ],
      },

      // Barista
      {
        path: 'barista',
        canActivate: [guardaPorRol],
        data: { roles: ['barista'] },
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'cola' },
          {
            path: 'cola',
            title: titulo('Cola de pedidos'),
            loadComponent: () =>
              import('./pages/cola-pedidos/cola-pedidos').then(
                (modulo) => modulo.PaginaColaPedidos,
              ),
          },
          {
            path: 'disponibilidad',
            title: titulo('Disponibilidad de carta'),
            loadComponent: () =>
              import('./pages/disponibilidad/disponibilidad').then(
                (modulo) => modulo.PaginaDisponibilidad,
              ),
          },
          { path: 'turno', title: titulo('Turno'), ...informacionSeccion('turno') },
        ],
      },

      // Admin
      {
        path: 'admin',
        canActivate: [guardaPorRol],
        data: { roles: ['admin'] },
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'carta' },
          { path: 'resumen', title: titulo('Resumen'), ...informacionSeccion('resumen') },
          {
            path: 'carta',
            title: titulo('Gestión de carta'),
            loadComponent: () =>
              import('./pages/gestion-carta/gestion-carta').then(
                (modulo) => modulo.PaginaGestionCarta,
              ),
          },
          {
            path: 'carta/:id',
            title: titulo('Editar producto'),
            loadComponent: () =>
              import('./pages/editar-producto/editar-producto').then(
                (modulo) => modulo.PaginaEditarProducto,
              ),
          },
          {
            path: 'cupones',
            title: titulo('Cupones'),
            loadComponent: () =>
              import('./pages/cupones/cupones').then((modulo) => modulo.PaginaCupones),
          },
          {
            path: 'cupones/solicitudes',
            title: titulo('Solicitudes de cupones'),
            loadComponent: () =>
              import('./pages/solicitudes-cupones/solicitudes-cupones').then(
                (modulo) => modulo.PaginaSolicitudesCupones,
              ),
          },
          {
            path: 'informes',
            title: titulo('Informes'),
            loadComponent: () =>
              import('./pages/informes/informes').then((modulo) => modulo.PaginaInformes),
          },
        ],
      },

      { path: '**', redirectTo: 'carta' },
    ],
  },
];
