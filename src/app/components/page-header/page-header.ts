import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Título de página + subtítulo opcional + acciones proyectadas a la derecha. */
@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="ph">
      <div class="ph__text">
        <h1 class="t-display">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="t-body muted">{{ subtitle() }}</p>
        }
      </div>
      <div class="ph__actions"><ng-content /></div>
    </header>
  `,
  styles: `
    .ph { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
    .ph__text { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    .ph__actions { display: flex; gap: 10px; align-items: center; }
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}
