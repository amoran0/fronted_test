import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type TonoEtiqueta = 'exito' | 'informacion' | 'peligro' | 'advertencia' | 'neutro' | 'acento';

/** Mapa único de estados → etiqueta y color, para que toda la app sea coherente. */
const TEXTO_Y_TONO_POR_ESTADO: Record<string, [string, TonoEtiqueta]> = {
  // Producto
  disponible: ['Disponible', 'exito'],
  agotado: ['Agotado', 'peligro'],
  retirado: ['Retirado', 'peligro'],
  activo: ['Activo', 'informacion'],
  // Pedido
  pendiente: ['Pendiente', 'peligro'],
  en_preparacion: ['En preparación', 'informacion'],
  listo: ['Listo', 'exito'],
  entregado: ['Entregado', 'neutro'],
  cancelado: ['Cancelado', 'neutro'],
  pagado: ['Pagado', 'exito'],
  // Cupón
  personal: ['Personal', 'informacion'],
  caducado: ['Caducado', 'peligro'],
  inactivo: ['Inactivo', 'neutro'],
};

/**
 * Uso: `<app-etiqueta-estado estado="agotado" />` o con texto libre:
 * `<app-etiqueta-estado tono="informacion" texto="Paso 2 de 2" />`
 */
@Component({
  selector: 'app-etiqueta-estado',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:inline-flex' },
  template: `<span class="insignia" [class]="'insignia insignia--' + tonoFinal()" [class.insignia--texto]="textoPlano()" [class.insignia--estado-producto]="estado() === 'disponible' || estado() === 'agotado'">{{ textoFinal() }}</span>`,
  styles: `
    .insignia--texto {
      padding: 0;
      background: transparent;
      font-weight: 800;
    }
    .insignia--estado-producto {
      font-weight: 900;
    }
  `,
})
export class EtiquetaEstado {
  readonly estado = input<string>();
  readonly texto = input<string>();
  readonly tono = input<TonoEtiqueta>();
  readonly textoPlano = input(false, { transform: booleanAttribute });

  protected readonly textoFinal = computed(() => this.texto() ?? TEXTO_Y_TONO_POR_ESTADO[this.estado() ?? '']?.[0] ?? this.estado() ?? '');
  protected readonly tonoFinal = computed(() => this.tono() ?? TEXTO_Y_TONO_POR_ESTADO[this.estado() ?? '']?.[1] ?? 'neutro');
}
