import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Alert } from '../../components/alert/alert';
import { Icon } from '../../components/icon/icon';
import { PageHeader } from '../../components/page-header/page-header';
import { StatusBadge } from '../../components/status-badge/status-badge';
import { ETIQUETA_ESTADO, FLUJO_PEDIDO, Pedido } from '../../models/pedido';
import { PedidoService } from '../../services/pedido.service';
import { EuroPipe } from '../../utils/euro.pipe';
import { formatDescuento, formatFechaCorta, formatHora } from '../../utils/formato';

@Component({
  selector: 'app-mis-pedidos-page',
  imports: [PageHeader, Alert, Icon, StatusBadge, EuroPipe, RouterLink],
  templateUrl: './mis-pedidos.html',
  styleUrl: './mis-pedidos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MisPedidosPage {
  protected readonly pedidos = inject(PedidoService);
  protected readonly flujo = FLUJO_PEDIDO;
  protected readonly etiqueta = ETIQUETA_ESTADO;
  protected readonly formatHora = formatHora;
  protected readonly formatFechaCorta = formatFechaCorta;
  protected readonly formatDescuento = formatDescuento;

  protected resumenLineas(p: Pedido): string {
    return p.lineas.map((l) => `${l.cantidad} × ${l.nombre}`).join(' · ');
  }

  protected paso(p: Pedido): number {
    return FLUJO_PEDIDO.indexOf(p.estado);
  }

  protected cancelar(p: Pedido): void {
    this.pedidos.cancelar(p.id).subscribe();
  }
}
