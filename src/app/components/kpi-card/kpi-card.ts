import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Tarjeta de métrica: etiqueta, valor grande y pista opcional. */
@Component({
  selector: 'app-kpi-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card kpi">
      <span class="kpi__label">{{ label() }}</span>
      <strong class="t-h2 tabular">{{ value() }}</strong>
      @if (hint()) {
        <span class="kpi__hint" [class.is-alert]="hintTone() === 'alert'">{{ hint() }}</span>
      }
    </div>
  `,
  styles: `
    :host { display: block; }
    .kpi { display: flex; flex-direction: column; gap: 14px; padding: 16px; height: 100%; }
    .kpi__label { font: 700 12px var(--f-sans); color: var(--c-muted); }
    .kpi__hint { font-size: 11px; color: var(--c-success); }
    .kpi__hint.is-alert { color: var(--c-danger); }
  `,
})
export class KpiCard {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly hint = input<string>();
  readonly hintTone = input<'ok' | 'alert'>('ok');
}
