import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Icono } from '../icono/icono';

/**
 * Paginador numérico. Las páginas empiezan en 0 (como en la API) y se muestran desde 1.
 * Uso: `<app-paginador [paginaActual]="p" [totalPaginas]="n" (cambiarPagina)="ir($event)" />`
 */
@Component({
  selector: 'app-paginador',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (totalPaginas() > 1) {
      <nav class="paginador" aria-label="Paginación">
        <button
          type="button"
          class="chip"
          [disabled]="paginaActual() === 0"
          (click)="cambiarPagina.emit(paginaActual() - 1)"
          aria-label="Página anterior"
        >
          <app-icono nombre="flecha-izquierda" [tamano]="14" />
        </button>
        @for (numeroPagina of paginas(); track numeroPagina) {
          <button
            type="button"
            class="chip"
            [class.esta-activo]="numeroPagina === paginaActual()"
            [attr.aria-current]="numeroPagina === paginaActual() ? 'page' : null"
            (click)="cambiarPagina.emit(numeroPagina)"
          >
            {{ numeroPagina + 1 }}
          </button>
        }
        <button
          type="button"
          class="chip"
          [disabled]="paginaActual() >= totalPaginas() - 1"
          (click)="cambiarPagina.emit(paginaActual() + 1)"
          aria-label="Página siguiente"
        >
          <app-icono nombre="flecha-derecha" [tamano]="14" />
        </button>
      </nav>
    }
  `,
  styles: `
    .paginador {
      display: flex;
      justify-content: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .chip:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  `,
})
export class Paginador {
  readonly paginaActual = input.required<number>();
  readonly totalPaginas = input.required<number>();
  readonly cambiarPagina = output<number>();

  /** Índices de todas las páginas: [0, 1, …, total − 1]. */
  protected readonly paginas = computed(() =>
    Array.from({ length: this.totalPaginas() }, (_valor, indice) => indice),
  );
}
