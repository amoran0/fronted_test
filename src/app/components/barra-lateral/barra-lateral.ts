import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Rol } from '../../models/usuario';
import { ServicioAutenticacion } from '../../services/servicio-autenticacion';
import { ServicioPedidos } from '../../services/servicio-pedidos';
import { NEGOCIO, estaAbierto } from '../../utils/negocio';
import { Icono, NombreIcono } from '../icono/icono';

interface ConfiguracionRol {
  etiqueta: string;
  icono: NombreIcono;
  menu: { texto: string; ruta: string }[];
}

/** Etiqueta, icono y menú de cada uno de los 4 roles. */
const CONFIGURACION_POR_ROL: Record<Rol, ConfiguracionRol> = {
  publico: {
    etiqueta: 'Público',
    icono: 'mundo',
    menu: [
      { texto: 'Carta', ruta: '/carta' },
      { texto: 'Cómo pedir', ruta: '/como-pedir' },
      { texto: 'Acceder', ruta: '/acceder' },
    ],
  },
  cliente: {
    etiqueta: 'Cliente',
    icono: 'usuario',
    menu: [
      { texto: 'Nuevo pedido', ruta: '/pedido' },
      { texto: 'Mis pedidos', ruta: '/mis-pedidos' },
      { texto: 'Mi perfil', ruta: '/perfil' },
    ],
  },
  barista: {
    etiqueta: 'Barista',
    icono: 'vaso-refresco',
    menu: [
      { texto: 'Cola de pedidos', ruta: '/barista/cola' },
      { texto: 'Disponibilidad', ruta: '/barista/disponibilidad' },
      { texto: 'Turno', ruta: '/barista/turno' },
    ],
  },
  admin: {
    etiqueta: 'Admin',
    icono: 'escudo',
    menu: [
      { texto: 'Resumen', ruta: '/admin/resumen' },
      { texto: 'Carta', ruta: '/admin/carta' },
      { texto: 'Cupones', ruta: '/admin/cupones' },
      { texto: 'Informes', ruta: '/admin/informes' },
    ],
  },
};

@Component({
  selector: 'app-barra-lateral',
  imports: [RouterLink, RouterLinkActive, Icono],
  templateUrl: './barra-lateral.html',
  styleUrl: './barra-lateral.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarraLateral {
  protected readonly autenticacion = inject(ServicioAutenticacion);
  private readonly servicioPedidos = inject(ServicioPedidos);

  protected readonly negocio = NEGOCIO;
  protected readonly localAbierto = estaAbierto();
  protected readonly configuracionRol = computed(() => CONFIGURACION_POR_ROL[this.autenticacion.rol()]);
  protected readonly siguienteTurno = computed(() => {
    const ultimoTurno = Math.max(
      0,
      ...this.servicioPedidos.cola().map((pedido) => Number(pedido.turno.slice(2)) || 0),
    );
    return `A-${ultimoTurno + 1}`;
  });
}
