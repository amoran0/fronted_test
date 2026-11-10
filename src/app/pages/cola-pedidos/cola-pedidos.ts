import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Aviso } from '../../components/aviso/aviso';
import { Icono } from '../../components/icono/icono';
import { TarjetaIndicador } from '../../components/tarjeta-indicador/tarjeta-indicador';
import { CabeceraPagina } from '../../components/cabecera-pagina/cabecera-pagina';
import { EtiquetaEstado } from '../../components/etiqueta-estado/etiqueta-estado';
import { FLUJO_PEDIDO, Pedido } from '../../models/pedido';
import { ServicioPedidos } from '../../services/servicio-pedidos';
import { formatearHora, minutosDesde, resumenLineas } from '../../utils/formato';

/** Minutos a partir de los cuales un pedido pendiente se marca como "espera alta". */
const MINUTOS_ESPERA_ALTA = 8;

@Component({
  selector: 'app-pagina-cola-pedidos',
  imports: [CabeceraPagina, TarjetaIndicador, Aviso, Icono, EtiquetaEstado],
  templateUrl: './cola-pedidos.html',
  styleUrl: './cola-pedidos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaColaPedidos {
  protected readonly servicioPedidos = inject(ServicioPedidos);
  protected readonly flujoEstados = FLUJO_PEDIDO;
  protected readonly formatearHora = formatearHora;
  protected readonly minutosDesde = minutosDesde;
  protected readonly resumenLineas = resumenLineas;

  protected readonly tiempoDesdeActualizacion = computed(() => {
    const segundos = Math.round((Date.now() - this.servicioPedidos.ultimaActualizacion().getTime()) / 1000);
    return segundos < 60 ? `hace ${Math.max(segundos, 1)} s` : `hace ${Math.round(segundos / 60)} min`;
  });

  /**
   * Minutos de espera del pendiente más antiguo. Se recalcula al cargar la página, al pulsar
   * "Actualizar cola", al entrar un pedido nuevo o al cambiar el estado de cualquier pedido.
   */
  protected readonly minutosEsperaMasAntiguo = computed(() => {
    const pendienteMasAntiguo = this.servicioPedidos.pendientes()[0];
    return pendienteMasAntiguo ? minutosDesde(pendienteMasAntiguo.fecha) : 0;
  });

  protected tieneEsperaAlta(pedido: Pedido): boolean {
    return pedido.estado === 'pendiente' && minutosDesde(pedido.fecha) >= MINUTOS_ESPERA_ALTA;
  }

  protected avanzarEstado(pedido: Pedido): void {
    this.servicioPedidos.avanzar(pedido.id)?.subscribe();
  }

  protected cancelarPedido(pedido: Pedido): void {
    if (confirm(`¿Cancelar el pedido ${pedido.turno}?`)) this.servicioPedidos.cancelar(pedido.id).subscribe();
  }
}
