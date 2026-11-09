import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Producto } from '../../models/producto';
import { EuroPipe } from '../../utils/euro.pipe';
import { listaAlergenos } from '../../utils/formato';
import { Icon } from '../icon/icon';
import { StatusBadge } from '../status-badge/status-badge';

/** Tarjeta de producto de la carta. Enlaza al detalle. */
@Component({
  selector: 'app-product-card',
  imports: [RouterLink, EuroPipe, StatusBadge, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="pc card" [routerLink]="['/carta', producto().id]" [class.is-out]="producto().estado !== 'disponible'">
      <div class="pc__media">
        @if (producto().imagen && !sinImagen()) {
          <img [src]="producto().imagen" [alt]="producto().nombre" loading="lazy" (error)="sinImagen.set(true)" />
        } @else {
          <div class="pc__placeholder"><app-icon name="coffee" [size]="28" [stroke]="1.5" /></div>
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
    .pc__media { height: 112px; background: var(--c-sand); }
    .pc__media img { width: 100%; height: 100%; object-fit: cover; }
    .is-out .pc__media { opacity: .65; }
    .pc__placeholder { height: 100%; display: grid; place-items: center; color: var(--c-muted); background: linear-gradient(135deg, #ede0d0, #e8d1a7); }
    .pc__info { display: flex; flex-direction: column; gap: 8px; padding: 15px 15px 18px; }
    .pc__title { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
    .pc__title h3 { font-size: 17px; }
    .pc__meta { display: flex; align-items: center; gap: 7px; }
  `,
})
export class ProductCard {
  readonly producto = input.required<Producto>();
  readonly categoria = input('');
  protected readonly sinImagen = signal(false);
  protected alergenos = () => listaAlergenos(this.producto().alergenos);
}
