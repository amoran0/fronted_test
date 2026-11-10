import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icono } from '../icono/icono';

/**
 * Tarjeta con título y botón «Añadir».
 * - Con `enlaceAnadir`, el botón navega a esa ruta.
 * - Sin él, despliega un campo para escribir el nombre y emite `anadir`.
 */
@Component({
  selector: 'app-tarjeta-lista-editable',
  imports: [Icono, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:block' },
  template: `
    <section class="tarjeta tarjeta--amplia">
      <div class="tarjeta__cabecera">
        <h2 class="t-titulo-3">{{ titulo() }}</h2>
        @if (enlaceAnadir()) {
          <a class="boton boton--discreto boton--pequeno" [routerLink]="enlaceAnadir()"><app-icono nombre="mas" /> Añadir</a>
        } @else if (!creando()) {
          <button type="button" class="boton boton--discreto boton--pequeno" (click)="creando.set(true)"><app-icono nombre="mas" /> Añadir</button>
        }
      </div>
      @if (creando()) {
        <form class="formulario-nuevo" (submit)="$event.preventDefault(); confirmar()">
          <label class="campo">
            <span class="t-etiqueta">{{ etiquetaNuevo() }}</span>
            <input
              class="entrada"
              type="text"
              [placeholder]="textoIndicativo()"
              [value]="nombreNuevo()"
              (input)="nombreNuevo.set($any($event.target).value)"
              (keydown.escape)="cancelar()"
            />
          </label>
          <div class="fila acciones">
            <button type="button" class="boton boton--secundario boton--pequeno" (click)="cancelar()">Cancelar</button>
            <button type="submit" class="boton boton--primario boton--pequeno" [disabled]="!nombreNuevo().trim()">Guardar</button>
          </div>
        </form>
      }
    </section>
  `,
  styles: `
    .tarjeta__cabecera:last-child { margin-bottom: 0; }
    .formulario-nuevo { display: flex; flex-direction: column; gap: 10px; }
    .acciones { justify-content: flex-end; gap: 8px; }
  `,
})
export class TarjetaListaEditable {
  readonly titulo = input.required<string>();
  /** Ruta a la que lleva «Añadir» (si se omite, se usa el campo en línea). */
  readonly enlaceAnadir = input<string | undefined>();
  readonly etiquetaNuevo = input('Nuevo elemento');
  readonly textoIndicativo = input('Nombre…');
  readonly anadir = output<string>();

  protected readonly creando = signal(false);
  protected readonly nombreNuevo = signal('');

  protected confirmar(): void {
    const nombre = this.nombreNuevo().trim();
    if (!nombre) return;
    this.anadir.emit(nombre);
    this.cancelar();
  }

  protected cancelar(): void {
    this.nombreNuevo.set('');
    this.creando.set(false);
  }
}
