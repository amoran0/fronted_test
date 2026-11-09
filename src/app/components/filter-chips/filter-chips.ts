import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface OpcionFiltro<T extends string = string> {
  valor: T;
  texto: string;
  /** Color del punto indicador (opcional). */
  punto?: string;
}

/** Grupo de chips de selección única. Uso: `<app-filter-chips [opciones]="..." [(valor)]="filtro" />` */
@Component({
  selector: 'app-filter-chips',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fc" role="radiogroup" [attr.aria-label]="etiqueta()">
      @for (o of opciones(); track o.valor) {
        <button
          type="button"
          role="radio"
          class="chip"
          [class.is-active]="valor() === o.valor"
          [attr.aria-checked]="valor() === o.valor"
          (click)="valor.set(o.valor)"
        >
          @if (o.punto) {
            <span class="chip__dot" [style.color]="o.punto"></span>
          }
          {{ o.texto }}
        </button>
      }
    </div>
  `,
  styles: `.fc { display: flex; gap: 6px; flex-wrap: wrap; }`,
})
export class FilterChips {
  readonly opciones = input.required<OpcionFiltro[]>();
  readonly valor = model.required<string>();
  readonly etiqueta = input('Filtro');
}
