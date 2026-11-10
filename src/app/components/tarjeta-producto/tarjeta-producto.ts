import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Producto } from '../../models/producto';
import { PipeEuro } from '../../utils/pipe-euro';
import { listaAlergenos } from '../../utils/formato';
import { EtiquetaEstado } from '../etiqueta-estado/etiqueta-estado';

/** Tarjeta de producto de la carta. Enlaza al detalle. */
@Component({
  selector: 'app-tarjeta-producto',
  imports: [RouterLink, PipeEuro, EtiquetaEstado],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="tarjeta-producto tarjeta" [routerLink]="['/carta', producto().id]" [class.esta-agotado]="producto().estado !== 'disponible'">
      <div class="tarjeta-producto__imagen">
        @if (producto().imagen && !imagenNoDisponible()) {
          <img [src]="producto().imagen" [alt]="producto().nombre" loading="lazy" (error)="imagenNoDisponible.set(true)" />
        } @else {
          <div class="tarjeta-producto__sin-imagen"></div>
        }
      </div>
      <div class="tarjeta-producto__informacion">
        <div class="tarjeta-producto__titulo">
          <h3 class="t-titulo">{{ producto().nombre }}</h3>
          <span class="precio">{{ producto().precio | euro }}</span>
        </div>
        <div class="tarjeta-producto__datos">
          <app-etiqueta-estado [estado]="producto().estado" textoPlano />
          <span class="t-leyenda atenuado">{{ nombreCategoria() }}</span>
        </div>
        <p class="t-leyenda atenuado">Alérgenos: {{ textoAlergenos() }}</p>
      </div>
    </a>
  `,
  styles: `
    :host { display: block; }
    .tarjeta-producto { display: flex; flex-direction: column; height: 100%; padding: 0; overflow: hidden; background: transparent; border: 0; border-radius: 0; box-shadow: none; text-decoration: none; transition: transform .15s; }
    .tarjeta-producto:hover { transform: translateY(-2px); }
    .tarjeta-producto__imagen { height: 112px; background: var(--color-arena); border-radius: var(--radio-tarjeta); overflow: hidden; }
    .tarjeta-producto__imagen img { width: 100%; height: 100%; object-fit: cover; }
    .esta-agotado .tarjeta-producto__sin-imagen { opacity: .5; }
    .tarjeta-producto__sin-imagen { height: 100%; background: var(--color-arena); }
    .tarjeta-producto__informacion { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 14px 0 40px; text-align: center; }
    .tarjeta-producto__titulo { display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .tarjeta-producto__datos { display: flex; align-items: center; justify-content: center; gap: 7px; }
  `,
})
export class TarjetaProducto {
  readonly producto = input.required<Producto>();
  readonly nombreCategoria = input('');
  /** Se activa si la foto no carga, para mostrar el fondo liso. */
  protected readonly imagenNoDisponible = signal(false);
  protected textoAlergenos = () => listaAlergenos(this.producto().alergenos);
}
