import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Alert } from '../../components/alert/alert';
import { Icon } from '../../components/icon/icon';
import { PageHeader } from '../../components/page-header/page-header';
import { QuantityStepper } from '../../components/quantity-stepper/quantity-stepper';
import { StatusBadge } from '../../components/status-badge/status-badge';
import { MAX_LINEAS, MAX_UNIDADES_LINEA } from '../../models/pedido';
import { CarritoService } from '../../services/carrito.service';
import { EuroPipe } from '../../utils/euro.pipe';
import { totalLinea } from '../../utils/calculos';

@Component({
  selector: 'app-realiza-pedido-page',
  imports: [PageHeader, Alert, Icon, QuantityStepper, StatusBadge, EuroPipe, RouterLink],
  templateUrl: './realiza-pedido.html',
  styleUrl: './realiza-pedido.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RealizaPedidoPage {
  protected readonly carrito = inject(CarritoService);
  protected readonly maxLineas = MAX_LINEAS;
  protected readonly maxUnidades = MAX_UNIDADES_LINEA;
  protected readonly totalLinea = totalLinea;
}
