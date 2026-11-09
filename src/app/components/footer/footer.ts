import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NEGOCIO } from '../../utils/negocio';
import { Icon } from '../icon/icon';

/** Pie de página compacto: marca, email, teléfono y ubicación. Va al final del área de contenido. */
@Component({
  selector: 'app-footer',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="footer">
      <div class="footer__brand">
        <strong class="footer__name">{{ n.nombre }}</strong>
        <span class="footer__tagline">{{ n.lema }}</span>
      </div>
      <address class="footer__contact">
        <a class="footer__item" [href]="'mailto:' + n.email">
          <app-icon name="mail" [size]="16" [stroke]="1.5" class="footer__icon" />{{ n.email }}
        </a>
        <a class="footer__item" [href]="'tel:' + n.telefono.replaceAll(' ', '')">
          <app-icon name="phone" [size]="16" [stroke]="1.5" class="footer__icon" />{{ n.telefono }}
        </a>
        <span class="footer__item" [title]="n.direccion">
          <app-icon name="map-pin" [size]="16" [stroke]="1.5" class="footer__icon" />{{ n.ciudad }}
        </span>
      </address>
    </footer>
  `,
  styles: `
    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px 32px;
      flex-wrap: wrap;
      min-height: 80px;
      padding: 20px 40px 20px 24px;
      background: var(--c-footer);
      border-top: 1px solid var(--c-footer-border);
    }
    .footer__brand { display: flex; flex-direction: column; gap: 2px; }
    .footer__name { font: 600 20px/1.2 var(--f-serif); color: var(--c-accent); }
    .footer__tagline { font: 400 12px/1.4 var(--f-sans); color: var(--c-footer-muted); }
    .footer__contact { display: flex; align-items: center; gap: 12px 32px; flex-wrap: wrap; font-style: normal; }
    .footer__item { display: inline-flex; align-items: center; gap: 8px; font: 400 13px var(--f-sans); color: var(--c-sand); text-decoration: none; }
    a.footer__item:hover { text-decoration: underline; }
    .footer__icon { color: var(--c-accent); }
  `,
})
export class Footer {
  protected readonly n = NEGOCIO;
}
