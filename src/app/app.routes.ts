import { Routes } from '@angular/router';
import { authGuard, invitadoGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { AppShell } from './components/app-shell/app-shell';

const page = {
  carta: () => import('./pages/carta/carta').then((m) => m.CartaPage),
  detalle: () => import('./pages/detalle-producto/detalle-producto').then((m) => m.DetalleProductoPage),
  acceder: () => import('./pages/acceder/acceder').then((m) => m.AccederPage),
  info: () => import('./pages/informacion/informacion').then((m) => m.InformacionPage),
  pedido: () => import('./pages/realiza-pedido/realiza-pedido').then((m) => m.RealizaPedidoPage),
  confirmacion: () => import('./pages/confirmacion-pedido/confirmacion-pedido').then((m) => m.ConfirmacionPedidoPage),
  misPedidos: () => import('./pages/mis-pedidos/mis-pedidos').then((m) => m.MisPedidosPage),
  cola: () => import('./pages/cola-pedidos/cola-pedidos').then((m) => m.ColaPedidosPage),
  disponibilidad: () => import('./pages/disponibilidad/disponibilidad').then((m) => m.DisponibilidadPage),
  gestionCarta: () => import('./pages/gestion-carta/gestion-carta').then((m) => m.GestionCartaPage),
  editarProducto: () => import('./pages/editar-producto/editar-producto').then((m) => m.EditarProductoPage),
  cupones: () => import('./pages/cupones/cupones').then((m) => m.CuponesPage),
  solicitudes: () => import('./pages/cupones-solicitudes/cupones-solicitudes').then((m) => m.CuponesSolicitudesPage),
  informes: () => import('./pages/informes/informes').then((m) => m.InformesPage),
};

export const routes: Routes = [
  {
    path: '',
    component: AppShell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'carta' },

      // Público (accesible para todos los roles)
      { path: 'carta', title: 'Carta · The Coffee Room', loadComponent: page.carta },
      { path: 'carta/:id', title: 'Detalle del producto · The Coffee Room', loadComponent: page.detalle },
      { path: 'como-funciona', title: 'Cómo funciona · The Coffee Room', loadComponent: page.info, data: { seccion: 'como-funciona' } },
      { path: 'acceder', title: 'Acceder · The Coffee Room', canActivate: [invitadoGuard], loadComponent: page.acceder },

      // Cliente
      {
        path: '',
        canActivate: [authGuard, roleGuard],
        data: { roles: ['cliente'] },
        children: [
          { path: 'pedido', title: 'Realiza tu pedido · The Coffee Room', loadComponent: page.pedido },
          { path: 'pedido/confirmar', title: 'Descuento y confirmación · The Coffee Room', loadComponent: page.confirmacion },
          { path: 'mis-pedidos', title: 'Mis pedidos · The Coffee Room', loadComponent: page.misPedidos },
          { path: 'perfil', title: 'Mi perfil · The Coffee Room', loadComponent: page.info, data: { seccion: 'perfil' } },
        ],
      },

      // Barista
      {
        path: 'barista',
        canActivate: [authGuard, roleGuard],
        data: { roles: ['barista'] },
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'cola' },
          { path: 'cola', title: 'Cola de pedidos · The Coffee Room', loadComponent: page.cola },
          { path: 'disponibilidad', title: 'Disponibilidad de carta · The Coffee Room', loadComponent: page.disponibilidad },
          { path: 'turno', title: 'Turno · The Coffee Room', loadComponent: page.info, data: { seccion: 'turno' } },
        ],
      },

      // Admin
      {
        path: 'admin',
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin'] },
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'carta' },
          { path: 'resumen', title: 'Resumen · The Coffee Room', loadComponent: page.info, data: { seccion: 'resumen' } },
          { path: 'carta', title: 'Gestión de carta · The Coffee Room', loadComponent: page.gestionCarta },
          { path: 'carta/:id', title: 'Editar producto · The Coffee Room', loadComponent: page.editarProducto },
          { path: 'cupones', title: 'Cupones · The Coffee Room', loadComponent: page.cupones },
          { path: 'cupones/solicitudes', title: 'Solicitudes de cupones · The Coffee Room', loadComponent: page.solicitudes },
          { path: 'informes', title: 'Informes · The Coffee Room', loadComponent: page.informes },
        ],
      },

      { path: '**', redirectTo: 'carta' },
    ],
  },
];
