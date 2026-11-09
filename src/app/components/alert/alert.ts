import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Icon, NombreIcono } from '../icon/icon';

export type TonoAviso = 'success' | 'info' | 'danger' | 'warning';

const ICONO: Record<TonoAviso, NombreIcono> = {
  success: 'circle-check',
  info: 'info',
  danger: 'circle-alert',
  warning: 'circle-alert',
};

/** Aviso con icono, título y texto (proyectado). */
@Component({
  selector: 'app-alert',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.role]': "tone() === 'danger' ? 'alert' : 'status'" },
  template: `
    <div class="alert" [class]="'alert alert--' + tone()">
      <app-icon [name]="icono()" [size]="16" class="alert__icon" />
      <div class="alert__body">
        @if (title()) {
          <strong class="alert__title">{{ title() }}</strong>
        }
        <div class="alert__text"><ng-content /></div>
      </div>
      <ng-content select="[alert-action]" />
    </div>
  `,
  styles: `
    :host { display: block; }
    .alert { display: flex; gap: 12px; align-items: flex-start; padding: 14px; border-radius: var(--r-field); font-size: 12px; line-height: 1.45; }
    .alert__icon { margin-top: 1px; }
    .alert__body { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .alert__title { font: 700 13px var(--f-sans); }
    .alert__text { color: var(--c-text); }
    .alert--success { background: var(--c-success-bg); color: var(--c-success); }
    .alert--info { background: var(--c-info-bg); color: var(--c-info); }
    .alert--danger { background: var(--c-danger-bg); color: var(--c-danger); }
    .alert--warning { background: var(--c-warning-bg); color: var(--c-warning); }
  `,
})
export class Alert {
  readonly tone = input<TonoAviso>('info');
  readonly title = input<string>();
  protected readonly icono = computed(() => ICONO[this.tone()]);
}
