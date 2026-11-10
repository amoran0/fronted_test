import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Aviso } from '../../components/aviso/aviso';
import { Icono } from '../../components/icono/icono';
import { CabeceraPagina } from '../../components/cabecera-pagina/cabecera-pagina';
import { EtiquetaEstado } from '../../components/etiqueta-estado/etiqueta-estado';
import { ETIQUETA_ESTADO, FLUJO_PEDIDO, Pedido } from '../../models/pedido';
import { ServicioPedidos } from '../../services/servicio-pedidos';
import { PipeEuro } from '../../utils/pipe-euro';
import { formatearDescuento, formatearFechaCorta, formatearHora, resumenLineas } from '../../utils/formato';

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
