import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Título de página + subtítulo opcional + acciones proyectadas a la derecha. */
@Component({
  selector: 'app-cabecera-pagina',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="cabecera-pagina">
      <div class="cabecera-pagina__texto">
        <h1 class="t-titular">{{ titulo() }}</h1>
        @if (subtitulo()) {
          <p class="t-cuerpo atenuado">{{ subtitulo() }}</p>
        }
      </div>
      <div class="cabecera-pagina__acciones"><ng-content /></div>
    </header>
  `,
  styles: `
    .cabecera-pagina { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
    .cabecera-pagina__texto { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    .cabecera-pagina__acciones { display: flex; gap: 10px; align-items: center; }
  `,
})
export class CabeceraPagina {
  readonly titulo = input.required<string>();
  readonly subtitulo = input<string>();
}
