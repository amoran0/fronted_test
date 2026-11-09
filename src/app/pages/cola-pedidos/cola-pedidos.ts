import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Alert } from '../../components/alert/alert';
import { Icon } from '../../components/icon/icon';
import { KpiCard } from '../../components/kpi-card/kpi-card';
import { PageHeader } from '../../components/page-header/page-header';
import { StatusBadge } from '../../components/status-badge/status-badge';
import { FLUJO_PEDIDO, Pedido } from '../../models/pedido';
import { PedidoService } from '../../services/pedido.service';
import { formatHora, minutosDesde } from '../../utils/formato';

/** Minutos a partir de los cuales un pedido pendiente se marca como "espera alta". */
const ESPERA_ALTA = 8;

@Component({
  selector: 'app-cola-pedidos-page',
  imports: [PageHeader, KpiCard, Alert, Icon, StatusBadge],
  templateUrl: './cola-pedidos.html',
  styleUrl: './cola-pedidos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColaPedidosPage {
  protected readonly pedidos = inject(PedidoService);
  protected readonly flujo = FLUJO_PEDIDO;
  protected readonly formatHora = formatHora;

  protected readonly hace = computed(() => {
    const s = Math.round((Date.now() - this.pedidos.ultimaActualizacion().getTime()) / 1000);
    return s < 60 ? `hace ${Math.max(s, 1)} s` : `hace ${Math.round(s / 60)} min`;
  });

  protected readonly antiguoMin = computed(() => {
    const p = this.pedidos.masAntiguo();
    return p ? minutosDesde(p.fecha) : 0;
  });

  protected esperaAlta(p: Pedido): boolean {
    return p.estado === 'pendiente' && minutosDesde(p.fecha) >= ESPERA_ALTA;
  }

  protected minutos(p: Pedido): number {
    return minutosDesde(p.fecha);
  }

  protected resumen(p: Pedido): string {
    return p.lineas.map((l) => `${l.cantidad} × ${l.nombre}`).join(' · ');
  }

  protected avanzar(p: Pedido): void {
    this.pedidos.avanzar(p.id)?.subscribe();
  }

  protected cancelar(p: Pedido): void {
    if (confirm(`¿Cancelar el pedido ${p.turno}?`)) this.pedidos.cancelar(p.id).subscribe();
  }
}
