import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface OpcionFiltro<T extends string = string> {
  valor: T;
  texto: string;
  /** Color del punto indicador (opcional). */
  punto?: string;
}

/** Grupo de botones-filtro de selección única. Uso: `<app-grupo-filtros [opciones]="..." [(valor)]="filtro" />` */
@Component({
  selector: 'app-grupo-filtros',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grupo-filtros" role="radiogroup" [attr.aria-label]="etiqueta()">
      @for (opcion of opciones(); track opcion.valor) {
        <button
          type="button"
          role="radio"
          class="chip"
          [class.esta-activo]="valor() === opcion.valor"
          [attr.aria-checked]="valor() === opcion.valor"
          (click)="valor.set(opcion.valor)"
        >
          @if (opcion.punto) {
            <span class="chip__punto" [style.color]="opcion.punto"></span>
          }
          {{ opcion.texto }}
        </button>
      }
    </div>
  `,
  styles: `.grupo-filtros { display: flex; gap: 6px; flex-wrap: wrap; }`,
})
export class GrupoFiltros {
  readonly opciones = input.required<OpcionFiltro[]>();
  readonly valor = model.required<string>();
  readonly etiqueta = input('Filtro');
}
