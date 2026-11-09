import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Rol } from '../../models/usuario';
import { AuthService } from '../../services/auth.service';
import { PedidoService } from '../../services/pedido.service';
import { NEGOCIO, estaAbierto } from '../../utils/negocio';
import { Icon, NombreIcono } from '../icon/icon';

interface ConfigRol {
  etiqueta: string;
  icono: NombreIcono;
  menu: { texto: string; ruta: string }[];
}

/** Menú de cada uno de los 4 roles. */
const MENU: Record<Rol, ConfigRol> = {
  publico: {
    etiqueta: 'Público',
    icono: 'globe',
    menu: [
      { texto: 'Carta', ruta: '/carta' },
      { texto: 'Cómo funciona', ruta: '/como-funciona' },
      { texto: 'Acceder', ruta: '/acceder' },
    ],
  },
  cliente: {
    etiqueta: 'Cliente',
    icono: 'user',
    menu: [
      { texto: 'Carta', ruta: '/carta' },
      { texto: 'Nuevo pedido', ruta: '/pedido' },
      { texto: 'Mis pedidos', ruta: '/mis-pedidos' },
      { texto: 'Mi perfil', ruta: '/perfil' },
    ],
  },
  barista: {
    etiqueta: 'Barista',
    icono: 'coffee',
    menu: [
      { texto: 'Cola de pedidos', ruta: '/barista/cola' },
      { texto: 'Disponibilidad', ruta: '/barista/disponibilidad' },
      { texto: 'Turno', ruta: '/barista/turno' },
    ],
  },
  admin: {
    etiqueta: 'Admin',
    icono: 'shield',
    menu: [
      { texto: 'Resumen', ruta: '/admin/resumen' },
      { texto: 'Carta', ruta: '/admin/carta' },
      { texto: 'Cupones', ruta: '/admin/cupones' },
      { texto: 'Informes', ruta: '/admin/informes' },
    ],
  },
};

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, Icon],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  protected readonly auth = inject(AuthService);
  private readonly pedidos = inject(PedidoService);

  protected readonly negocio = NEGOCIO;
  protected readonly abierto = estaAbierto();
  protected readonly config = computed(() => MENU[this.auth.rol()]);
  protected readonly siguienteTurno = computed(() => {
    const n = Math.max(0, ...this.pedidos.cola().map((p) => Number(p.turno.slice(2)) || 0));
    return `A-${n + 1}`;
  });
}
