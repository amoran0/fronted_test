import { Routes } from '@angular/router';
import { guardaSesionIniciada, guardaSoloInvitados } from './guardas/guarda-sesion';
import { guardaPorRol } from './guardas/guarda-rol';
import { EstructuraAplicacion } from './componentes/estructura-aplicacion/estructura-aplicacion';

/** Carga diferida de cada página (se descarga al visitarla por primera vez). */
const cargarPagina = {
  carta: () => import('./paginas/carta/carta').then((modulo) => modulo.PaginaCarta),
  detalleProducto: () => import('./paginas/detalle-producto/detalle-producto').then((modulo) => modulo.PaginaDetalleProducto),
  acceder: () => import('./paginas/acceder/acceder').then((modulo) => modulo.PaginaAcceder),
  informacionSeccion: () => import('./paginas/informacion-seccion/informacion-seccion').then((modulo) => modulo.PaginaInformacionSeccion),
  realizaPedido: () => import('./paginas/realiza-pedido/realiza-pedido').then((modulo) => modulo.PaginaRealizaPedido),
  confirmacionPedido: () => import('./paginas/confirmacion-pedido/confirmacion-pedido').then((modulo) => modulo.PaginaConfirmacionPedido),
  misPedidos: () => import('./paginas/mis-pedidos/mis-pedidos').then((modulo) => modulo.PaginaMisPedidos),
  colaPedidos: () => import('./paginas/cola-pedidos/cola-pedidos').then((modulo) => modulo.PaginaColaPedidos),
  disponibilidad: () => import('./paginas/disponibilidad/disponibilidad').then((modulo) => modulo.PaginaDisponibilidad),
  gestionCarta: () => import('./paginas/gestion-carta/gestion-carta').then((modulo) => modulo.PaginaGestionCarta),
  editarProducto: () => import('./paginas/editar-producto/editar-producto').then((modulo) => modulo.PaginaEditarProducto),
  cupones: () => import('./paginas/cupones/cupones').then((modulo) => modulo.PaginaCupones),
  solicitudesCupones: () => import('./paginas/solicitudes-cupones/solicitudes-cupones').then((modulo) => modulo.PaginaSolicitudesCupones),
  informes: () => import('./paginas/informes/informes').then((modulo) => modulo.PaginaInformes),
};

export const rutas: Routes = [
  {
    path: '',
    component: EstructuraAplicacion,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'carta' },

      // Público (accesible para todos los roles)
      { path: 'carta', title: 'Carta · The Coffee Room', loadComponent: cargarPagina.carta },
      { path: 'carta/:id', title: 'Detalle del producto · The Coffee Room', loadComponent: cargarPagina.detalleProducto },
      { path: 'como-funciona', title: 'Cómo funciona · The Coffee Room', loadComponent: cargarPagina.informacionSeccion, data: { seccion: 'como-funciona' } },
      { path: 'acceder', title: 'Acceder · The Coffee Room', canActivate: [guardaSoloInvitados], loadComponent: cargarPagina.acceder },

      // Cliente
      {
        path: '',
        canActivate: [guardaSesionIniciada, guardaPorRol],
        data: { roles: ['cliente'] },
        children: [
          { path: 'pedido', title: 'Realiza tu pedido · The Coffee Room', loadComponent: cargarPagina.realizaPedido },
          { path: 'pedido/confirmar', title: 'Descuento y confirmación · The Coffee Room', loadComponent: cargarPagina.confirmacionPedido },
          { path: 'mis-pedidos', title: 'Mis pedidos · The Coffee Room', loadComponent: cargarPagina.misPedidos },
          { path: 'perfil', title: 'Mi perfil · The Coffee Room', loadComponent: cargarPagina.informacionSeccion, data: { seccion: 'perfil' } },
        ],
      },

      // Barista
      {
        path: 'barista',
        canActivate: [guardaSesionIniciada, guardaPorRol],
        data: { roles: ['barista'] },
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'cola' },
          { path: 'cola', title: 'Cola de pedidos · The Coffee Room', loadComponent: cargarPagina.colaPedidos },
          { path: 'disponibilidad', title: 'Disponibilidad de carta · The Coffee Room', loadComponent: cargarPagina.disponibilidad },
          { path: 'turno', title: 'Turno · The Coffee Room', loadComponent: cargarPagina.informacionSeccion, data: { seccion: 'turno' } },
        ],
      },

      // Admin
      {
        path: 'admin',
        canActivate: [guardaSesionIniciada, guardaPorRol],
        data: { roles: ['admin'] },
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'carta' },
          { path: 'resumen', title: 'Resumen · The Coffee Room', loadComponent: cargarPagina.informacionSeccion, data: { seccion: 'resumen' } },
          { path: 'carta', title: 'Gestión de carta · The Coffee Room', loadComponent: cargarPagina.gestionCarta },
          { path: 'carta/:id', title: 'Editar producto · The Coffee Room', loadComponent: cargarPagina.editarProducto },
          { path: 'cupones', title: 'Cupones · The Coffee Room', loadComponent: cargarPagina.cupones },
          { path: 'cupones/solicitudes', title: 'Solicitudes de cupones · The Coffee Room', loadComponent: cargarPagina.solicitudesCupones },
          { path: 'informes', title: 'Informes · The Coffee Room', loadComponent: cargarPagina.informes },
        ],
      },

      { path: '**', redirectTo: 'carta' },
    ],
  },
];
