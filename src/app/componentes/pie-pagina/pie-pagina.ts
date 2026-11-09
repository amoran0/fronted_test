import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NEGOCIO } from '../../utilidades/negocio';
import { Icono } from '../icono/icono';

/** Pie de página compacto: marca, email, teléfono y ubicación. Va al final del área de contenido. */
@Component({
  selector: 'app-pie-pagina',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="pie">
      <div class="pie__marca">
        <strong class="pie__nombre">{{ negocio.nombre }}</strong>
        <span class="pie__lema">{{ negocio.lema }}</span>
      </div>
      <address class="pie__contacto">
        <a class="pie__elemento" [href]="'mailto:' + negocio.email">
          <app-icono nombre="correo" [tamano]="16" [grosor]="1.5" class="pie__icono" />{{ negocio.email }}
        </a>
        <a class="pie__elemento" [href]="'tel:' + negocio.telefono.replaceAll(' ', '')">
          <app-icono nombre="telefono" [tamano]="16" [grosor]="1.5" class="pie__icono" />{{ negocio.telefono }}
        </a>
        <span class="pie__elemento" [title]="negocio.direccion">
          <app-icono nombre="ubicacion" [tamano]="16" [grosor]="1.5" class="pie__icono" />{{ negocio.ciudad }}
        </span>
      </address>
    </footer>
  `,
  styles: `
    .pie {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px 32px;
      flex-wrap: wrap;
      min-height: 80px;
      padding: 20px 40px 20px 24px;
      background: var(--color-pie);
      border-top: 1px solid var(--color-pie-borde);
    }
    .pie__marca { display: flex; flex-direction: column; gap: 2px; }
    .pie__nombre { font: 600 20px/1.2 var(--fuente-serif); color: var(--color-acento); }
    .pie__lema { font: 400 12px/1.4 var(--fuente-sans); color: var(--color-pie-atenuado); }
    .pie__contacto { display: flex; align-items: center; gap: 12px 32px; flex-wrap: wrap; font-style: normal; }
    .pie__elemento { display: inline-flex; align-items: center; gap: 8px; font: 400 13px var(--fuente-sans); color: var(--color-arena); text-decoration: none; }
    a.pie__elemento:hover { text-decoration: underline; }
    .pie__icono { color: var(--color-acento); }
  `,
})
export class PiePagina {
  protected readonly negocio = NEGOCIO;
}
