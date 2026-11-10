import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, model, signal } from '@angular/core';

/**
 * Desplegable con casillas para elegir varias opciones.
 * Uso: `<app-selector-multiple [opciones]="..." [(valor)]="elegidas" etiqueta="..." textoIndicativo="..." />`
 */
@Component({
  selector: 'app-selector-multiple',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display:block; position:relative',
    '(document:click)': 'cerrarSiFuera($event)',
    '(keydown.escape)': 'cerrar()',
  },
  template: `
    <button
      type="button"
      class="selector selector-multiple__boton"
      [class.sin-seleccion]="!valor().length"
      [attr.aria-label]="etiqueta()"
      [attr.aria-expanded]="abierto()"
      (click)="abierto.set(!abierto())"
    >
      {{ textoBoton() }}
    </button>
    @if (abierto()) {
      <div class="selector-multiple__lista" role="group" [attr.aria-label]="etiqueta()">
        @for (opcion of opciones(); track opcion) {
          <label class="selector-multiple__opcion">
            <input type="checkbox" [checked]="valor().includes(opcion)" (change)="alternar(opcion)" />
            {{ opcion }}
          </label>
        }
      </div>
    }
  `,
  styles: `
    .selector-multiple__boton {
      display: block;
      text-align: left;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .selector-multiple__lista {
      position: absolute;
      z-index: 10;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: 4px;
      padding: 6px;
      border: 1px solid var(--color-borde);
      border-radius: var(--radio-tarjeta);
      background: var(--color-superficie);
      box-shadow: var(--sombra-tarjeta);
    }
    .selector-multiple__opcion {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 10px;
      border-radius: var(--radio-campo);
      cursor: pointer;
    }
    .selector-multiple__opcion:hover {
      background: var(--color-arena);
    }
    .selector-multiple__opcion input {
      margin: 0;
      width: 16px;
      height: 16px;
      accent-color: var(--color-primario);
      cursor: pointer;
    }
  `,
})
export class SelectorMultiple {
  readonly opciones = input.required<readonly string[]>();
  readonly valor = model<string[]>([]);
  /** Nombre accesible del desplegable. */
  readonly etiqueta = input('Opciones');
  /** Texto que se muestra cuando no hay nada elegido. */
  readonly textoIndicativo = input('Elegir');

  protected readonly abierto = signal(false);
  /** Opciones elegidas en el orden de la lista, o el texto indicativo si no hay ninguna. */
  protected readonly textoBoton = computed(() =>
    this.valor().length
      ? this.opciones().filter((opcion) => this.valor().includes(opcion)).join(', ')
      : this.textoIndicativo(),
  );
  private readonly elemento = inject(ElementRef<HTMLElement>);

  protected alternar(opcion: string): void {
    this.valor.update((elegidas) =>
      elegidas.includes(opcion) ? elegidas.filter((elegida) => elegida !== opcion) : [...elegidas, opcion],
    );
  }

  protected cerrar(): void {
    this.abierto.set(false);
  }

  protected cerrarSiFuera(evento: MouseEvent): void {
    if (!this.elemento.nativeElement.contains(evento.target as Node)) this.cerrar();
  }
}
