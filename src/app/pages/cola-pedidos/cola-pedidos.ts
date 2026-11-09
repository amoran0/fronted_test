import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Alert } from '../../components/alert/alert';
import { Icon } from '../../components/icon/icon';
import { KpiCard } from '../../components/kpi-card/kpi-card';
import { PageHeader } from '../../components/page-header/page-header';
import { StatusBadge } from '../../components/status-badge/status-badge';
import { FLUJO_PEDIDO, Pedido } from '../../models/pedido';
import { PedidoService } from '../../services/pedido.service';
import { formatHora, minutosDesde, resumenLineas } from '../../utils/formato';

/** Minutos a partir de los cuales un pedido pendiente se marca como "espera alta". */
const ESPERA_ALTA = 8;

@Component({
  selector: 'app-cola-pedidos-page',
  imports: [PageHeader, KpiCard, Alert, Icon, StatusBadge],
  templateUrl: './cola-pedidos.html',
  styleUrl: './cola-pedidos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColaPedidosPage {
  protected readonly pedidos = inject(PedidoService);
  protected readonly flujo = FLUJO_PEDIDO;
  protected readonly formatHora = formatHora;
  protected readonly minutosDesde = minutosDesde;
  protected readonly resumenLineas = resumenLineas;

  protected readonly hace = computed(() => {
    const s = Math.round((Date.now() - this.pedidos.ultimaActualizacion().getTime()) / 1000);
    return s < 60 ? `hace ${Math.max(s, 1)} s` : `hace ${Math.round(s / 60)} min`;
  });

  /**
   * Minutos de espera del pendiente más antiguo. Se recalcula al cargar la página, al pulsar
   * "Actualizar cola", al entrar un pedido nuevo o al cambiar el estado de cualquier pedido.
   */
  protected readonly antiguoMin = computed(() => {
    const p = this.pedidos.pendientes()[0];
    return p ? minutosDesde(p.fecha) : 0;
  });

  protected esperaAlta(p: Pedido): boolean {
    return p.estado === 'pendiente' && minutosDesde(p.fecha) >= ESPERA_ALTA;
  }

  protected avanzar(p: Pedido): void {
    this.pedidos.avanzar(p.id)?.subscribe();
  }

  protected cancelar(p: Pedido): void {
    if (confirm(`¿Cancelar el pedido ${p.turno}?`)) this.pedidos.cancelar(p.id).subscribe();
  }
}
