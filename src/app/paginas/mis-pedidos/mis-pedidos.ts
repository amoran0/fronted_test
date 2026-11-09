import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Aviso } from '../../componentes/aviso/aviso';
import { Icono } from '../../componentes/icono/icono';
import { CabeceraPagina } from '../../componentes/cabecera-pagina/cabecera-pagina';
import { EtiquetaEstado } from '../../componentes/etiqueta-estado/etiqueta-estado';
import { ETIQUETA_ESTADO, FLUJO_PEDIDO, Pedido } from '../../modelos/pedido';
import { ServicioPedidos } from '../../servicios/servicio-pedidos';
import { PipeEuro } from '../../utilidades/pipe-euro';
import { formatearDescuento, formatearFechaCorta, formatearHora, resumenLineas } from '../../utilidades/formato';

@Component({
  selector: 'app-pagina-mis-pedidos',
  imports: [CabeceraPagina, Aviso, Icono, EtiquetaEstado, PipeEuro, RouterLink],
  templateUrl: './mis-pedidos.html',
  styleUrl: './mis-pedidos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaMisPedidos {
  protected readonly servicioPedidos = inject(ServicioPedidos);
  protected readonly flujoEstados = FLUJO_PEDIDO;
  protected readonly etiquetaPorEstado = ETIQUETA_ESTADO;
  protected readonly formatearHora = formatearHora;
  protected readonly formatearFechaCorta = formatearFechaCorta;
  protected readonly formatearDescuento = formatearDescuento;
  protected readonly resumenLineas = resumenLineas;

  /** Posición del estado actual del pedido dentro del flujo (0 = pendiente). */
  protected indicePasoActual(pedido: Pedido): number {
    return FLUJO_PEDIDO.indexOf(pedido.estado);
  }

  protected cancelarPedido(pedido: Pedido): void {
    this.servicioPedidos.cancelar(pedido.id).subscribe();
  }
}
