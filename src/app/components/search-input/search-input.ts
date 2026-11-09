import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { Icon } from '../icon/icon';

/** Campo de búsqueda con icono. Uso: `<app-search-input [(value)]="texto" placeholder="Buscar" />` */
@Component({
  selector: 'app-search-input',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:block' },
  template: `
    <label class="input-icon">
      <span class="sr-only">{{ placeholder() }}</span>
      <app-icon name="search" [size]="15" />
      <input class="input" type="search" [placeholder]="placeholder()" [value]="value()" (input)="value.set($any($event.target).value)" />
    </label>
  `,
  styles: `label { display: block; }`,
})
export class SearchInput {
  readonly value = model('');
  readonly placeholder = input('Buscar');
}
