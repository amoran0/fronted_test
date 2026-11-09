import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type Tono = 'success' | 'info' | 'danger' | 'warning' | 'neutral' | 'accent';

/** Mapa único de estados → etiqueta y color, para que toda la app sea coherente. */
const ESTADOS: Record<string, [string, Tono]> = {
  // Producto
  disponible: ['Disponible', 'success'],
  agotado: ['Agotado', 'danger'],
  retirado: ['Retirado', 'danger'],
  activo: ['Activo', 'info'],
  // Pedido
  pendiente: ['Pendiente', 'danger'],
  en_preparacion: ['En preparación', 'info'],
  listo: ['Listo', 'success'],
  entregado: ['Entregado', 'neutral'],
  cancelado: ['Cancelado', 'neutral'],
  pagado: ['Pagado', 'success'],
  // Cupón
  personal: ['Personal', 'info'],
  caducado: ['Caducado', 'danger'],
  inactivo: ['Inactivo', 'neutral'],
};

/**
 * Uso: `<app-status-badge estado="agotado" />` o con texto libre:
 * `<app-status-badge tono="info" texto="Paso 2 de 2" />`
 */
@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:inline-flex' },
  template: `<span class="badge" [class]="'badge badge--' + tonoFinal()">{{ textoFinal() }}</span>`,
})
export class StatusBadge {
  readonly estado = input<string>();
  readonly texto = input<string>();
  readonly tono = input<Tono>();

  protected readonly textoFinal = computed(() => this.texto() ?? ESTADOS[this.estado() ?? '']?.[0] ?? this.estado() ?? '');
  protected readonly tonoFinal = computed(() => this.tono() ?? ESTADOS[this.estado() ?? '']?.[1] ?? 'neutral');
}
