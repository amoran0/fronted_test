import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Alert } from '../../components/alert/alert';
import { KpiCard } from '../../components/kpi-card/kpi-card';
import { PageHeader } from '../../components/page-header/page-header';
import { AuthService } from '../../services/auth.service';
import { PedidoService } from '../../services/pedido.service';
import { ProductoService } from '../../services/producto.service';

type Seccion = 'como-funciona' | 'perfil' | 'turno' | 'resumen';

const TITULOS: Record<Seccion, [string, string]> = {
  'como-funciona': ['Cómo funciona', 'Pide desde la web y recoge en barra sin esperar cola.'],
  perfil: ['Mi perfil', 'Tus datos y ventajas de socio.'],
  turno: ['Turno', 'Resumen de tu turno de barra.'],
  resumen: ['Resumen', 'Vista rápida del local hoy.'],
};

/**
 * Vistas del menú que no tienen pantalla en el mockup (Cómo funciona, Mi perfil, Turno, Resumen).
 * Se resuelven con una página sencilla según `data.seccion` de la ruta.
 */
@Component({
  selector: 'app-informacion-page',
  imports: [PageHeader, Alert, KpiCard, RouterLink],
  templateUrl: './informacion.html',
  styles: `
    .steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 20px; }
    .step { display: flex; flex-direction: column; gap: 8px; }
    .step__n { font: 600 30px var(--f-serif); color: var(--c-primary); }
    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px; }
    dl { display: grid; grid-template-columns: 160px 1fr; gap: 10px; margin: 0; }
    dd { margin: 0; font-weight: 700; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InformacionPage {
  readonly seccion = input.required<Seccion>();
  protected readonly auth = inject(AuthService);
  protected readonly pedidos = inject(PedidoService);
  protected readonly productos = inject(ProductoService);

  protected readonly titulo = computed(() => TITULOS[this.seccion()]);
  protected readonly agotados = computed(() => this.productos.productos().filter((p) => p.estado === 'agotado').length);
}
