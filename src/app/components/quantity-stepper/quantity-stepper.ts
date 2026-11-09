import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { Icon } from '../icon/icon';

/** Selector de cantidad −/+ con límites. Uso: `<app-quantity-stepper [(value)]="n" [max]="20" />` */
@Component({
  selector: 'app-quantity-stepper',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="qs" role="group" [attr.aria-label]="'Cantidad de ' + label()">
      <button type="button" class="qs__btn" [disabled]="disabled() || value() <= min()" (click)="value.set(value() - 1)" aria-label="Quitar una unidad">
        <app-icon name="minus" [size]="14" />
      </button>
      <div class="qs__value">
        <strong>{{ value() }}</strong>
        <span>máx. {{ max() }}</span>
      </div>
      <button type="button" class="qs__btn" [disabled]="disabled() || value() >= max()" (click)="value.set(value() + 1)" aria-label="Añadir una unidad">
        <app-icon name="plus" [size]="14" />
      </button>
    </div>
  `,
  styles: `
    .qs { display: flex; align-items: center; gap: 8px; }
    .qs__btn { width: 42px; height: 42px; border-radius: var(--r-btn); border: 1px solid var(--c-border); background: var(--c-surface); display: grid; place-items: center; cursor: pointer; }
    .qs__btn:hover:not(:disabled) { border-color: var(--c-muted); }
    .qs__btn:disabled { color: var(--c-disabled-fg); cursor: not-allowed; opacity: .6; }
    .qs__value { width: 40px; display: flex; flex-direction: column; align-items: center; font-size: 13px; }
    .qs__value span { font-size: 9px; color: var(--c-muted); }
  `,
})
export class QuantityStepper {
  readonly value = model(1);
  readonly min = input(1);
  readonly max = input(20);
  readonly disabled = input(false);
  readonly label = input('producto');
}
