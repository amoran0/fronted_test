import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NEGOCIO } from '../../utils/negocio';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="footer">
      <div class="footer__brand">
        <strong class="t-h3">{{ n.nombre }}</strong>
        <span class="t-small muted">{{ n.lema }}</span>
      </div>
      <address class="footer__contact">
        <div class="footer__item">
          <span class="t-label">Dirección</span>
          <span>{{ n.direccion }}</span>
        </div>
        <div class="footer__item">
          <span class="t-label">Teléfono</span>
          <a [href]="'tel:' + n.telefono.replaceAll(' ', '')">{{ n.telefono }}</a>
        </div>
        <div class="footer__item">
          <span class="t-label">Email</span>
          <a [href]="'mailto:' + n.email">{{ n.email }}</a>
        </div>
      </address>
    </footer>
  `,
  styles: `
    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px 40px;
      flex-wrap: wrap;
      padding: 20px 40px 20px 24px;
      background: var(--c-sand);
      border-top: 1px solid var(--c-border);
    }
    .footer__brand { display: flex; flex-direction: column; gap: 2px; }
    .footer__contact { display: flex; gap: 40px; flex-wrap: wrap; font-style: normal; }
    .footer__item { display: flex; flex-direction: column; gap: 4px; font: 500 13px var(--f-sans); }
    a { text-decoration: none; }
    a:hover { text-decoration: underline; }
  `,
})
export class Footer {
  protected readonly n = NEGOCIO;
}
