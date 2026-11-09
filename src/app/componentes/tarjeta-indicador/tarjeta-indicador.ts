import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Tarjeta de métrica: etiqueta, valor grande y pista opcional. */
@Component({
  selector: 'app-tarjeta-indicador',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tarjeta indicador">
      <span class="indicador__etiqueta">{{ etiqueta() }}</span>
      <strong class="t-titulo-2 tabular">{{ valor() }}</strong>
      @if (pista()) {
        <span class="indicador__pista" [class.es-alerta]="tonoPista() === 'alerta'">{{ pista() }}</span>
      }
    </div>
  `,
  styles: `
    :host { display: block; }
    .indicador { display: flex; flex-direction: column; gap: 14px; padding: 16px; height: 100%; }
    .indicador__etiqueta { font: 500 12px var(--fuente-sans); color: var(--color-texto-atenuado); }
    .indicador__pista { font-size: 11px; color: var(--color-exito); }
    .indicador__pista.es-alerta { color: var(--color-peligro); }
  `,
})
export class TarjetaIndicador {
  readonly etiqueta = input.required<string>();
  readonly valor = input.required<string | number>();
  /** Texto pequeño bajo el valor (comparativa, aviso…). */
  readonly pista = input<string>();
  readonly tonoPista = input<'correcto' | 'alerta'>('correcto');
}
