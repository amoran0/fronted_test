import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Producto } from '../../modelos/producto';
import { PipeEuro } from '../../utilidades/pipe-euro';
import { listaAlergenos } from '../../utilidades/formato';
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
          <app-etiqueta-estado [estado]="producto().estado" />
          <span class="t-leyenda atenuado">{{ nombreCategoria() }}</span>
        </div>
        <p class="t-leyenda atenuado">Alérgenos: {{ textoAlergenos() }}</p>
      </div>
    </a>
  `,
  styles: `
    :host { display: block; }
    .tarjeta-producto { display: flex; flex-direction: column; padding: 0; overflow: hidden; height: 100%; text-decoration: none; transition: transform .15s, box-shadow .15s; }
    .tarjeta-producto:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(57, 37, 27, .14); }
    .tarjeta-producto__imagen { height: 112px; background: var(--color-arena); border-radius: var(--radio-tarjeta) var(--radio-tarjeta) 0 0; overflow: hidden; }
    .tarjeta-producto__imagen img { width: 100%; height: 100%; object-fit: cover; }
    .esta-agotado .tarjeta-producto__sin-imagen { opacity: .5; }
    .tarjeta-producto__sin-imagen { height: 100%; background: var(--color-arena); }
    .tarjeta-producto__informacion { display: flex; flex-direction: column; gap: 8px; padding: 14px 15px 40px; }
    .tarjeta-producto__titulo { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
    .tarjeta-producto__datos { display: flex; align-items: center; gap: 7px; }
  `,
})
export class TarjetaProducto {
  readonly producto = input.required<Producto>();
  readonly nombreCategoria = input('');
  /** Se activa si la foto no carga, para mostrar el fondo liso. */
  protected readonly imagenNoDisponible = signal(false);
  protected textoAlergenos = () => listaAlergenos(this.producto().alergenos);
}
