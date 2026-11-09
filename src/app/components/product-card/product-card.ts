import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Producto } from '../../models/producto';
import { EuroPipe } from '../../utils/euro.pipe';
import { listaAlergenos } from '../../utils/formato';
import { StatusBadge } from '../status-badge/status-badge';

/** Tarjeta de producto de la carta. Enlaza al detalle. */
@Component({
  selector: 'app-product-card',
  imports: [RouterLink, EuroPipe, StatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="pc card" [routerLink]="['/carta', producto().id]" [class.is-out]="producto().estado !== 'disponible'">
      <div class="pc__media">
        @if (producto().imagen && !sinImagen()) {
          <img [src]="producto().imagen" [alt]="producto().nombre" loading="lazy" (error)="sinImagen.set(true)" />
        } @else {
          <div class="pc__placeholder"></div>
        }
      </div>
      <div class="pc__info">
        <div class="pc__title">
          <h3 class="t-title">{{ producto().nombre }}</h3>
          <span class="price">{{ producto().precio | euro }}</span>
        </div>
        <div class="pc__meta">
          <app-status-badge [estado]="producto().estado" />
          <span class="t-caption muted">{{ categoria() }}</span>
        </div>
        <p class="t-caption muted">Alérgenos: {{ alergenos() }}</p>
      </div>
    </a>
  `,
  styles: `
    :host { display: block; }
    .pc { display: flex; flex-direction: column; padding: 0; overflow: hidden; height: 100%; text-decoration: none; transition: transform .15s, box-shadow .15s; }
    .pc:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(57, 37, 27, .14); }
    .pc__media { height: 112px; background: var(--c-sand); border-radius: var(--r-card) var(--r-card) 0 0; overflow: hidden; }
    .pc__media img { width: 100%; height: 100%; object-fit: cover; }
    .is-out .pc__placeholder { opacity: .5; }
    .pc__placeholder { height: 100%; background: var(--c-sand); }
    .pc__info { display: flex; flex-direction: column; gap: 8px; padding: 14px 15px 40px; }
    .pc__title { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
    .pc__meta { display: flex; align-items: center; gap: 7px; }
  `,
})
export class ProductCard {
  readonly producto = input.required<Producto>();
  readonly categoria = input('');
  protected readonly sinImagen = signal(false);
  protected alergenos = () => listaAlergenos(this.producto().alergenos);
}
