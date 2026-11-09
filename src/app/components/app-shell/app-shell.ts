import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from '../footer/footer';
import { Sidebar } from '../sidebar/sidebar';

/** Estructura común de todas las vistas: barra lateral + contenido + pie a todo el ancho. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Sidebar, Footer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell">
      <app-sidebar class="shell__nav" />
      <main class="shell__main" id="contenido">
        <router-outlet />
      </main>
      <app-footer class="shell__footer" />
    </div>
  `,
  styles: `
    .shell {
      display: grid;
      grid-template-columns: var(--sidebar-w) minmax(0, 1fr);
      grid-template-rows: 1fr auto;
      min-height: 100vh;
    }
    .shell__main {
      padding: 34px 40px 48px;
      min-width: 0;
    }
    .shell__footer {
      grid-column: 1 / -1;
    }
    @media (max-width: 900px) {
      .shell { grid-template-columns: 1fr; }
      .shell__main { padding: 24px 16px 40px; }
    }
  `,
})
export class AppShell {}
