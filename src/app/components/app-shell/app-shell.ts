import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Footer } from '../footer/footer';
import { Icon } from '../icon/icon';
import { Sidebar } from '../sidebar/sidebar';

/**
 * Estructura común de todas las vistas: barra lateral a toda la altura + contenido con su pie debajo.
 * En pantallas estrechas la barra lateral se oculta y se abre con un botón.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Sidebar, Footer, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'menuAbierto.set(false)' },
  template: `
    <div class="shell" [class.is-open]="menuAbierto()">
      <button
        type="button"
        class="shell__toggle"
        aria-controls="menu-lateral"
        [attr.aria-expanded]="menuAbierto()"
        [attr.aria-label]="menuAbierto() ? 'Ocultar menú' : 'Mostrar menú'"
        (click)="menuAbierto.set(!menuAbierto())"
      >
        <app-icon [name]="menuAbierto() ? 'x' : 'menu'" [size]="20" />
      </button>
      <app-sidebar id="menu-lateral" class="shell__nav" />
      <div class="shell__backdrop" (click)="menuAbierto.set(false)"></div>
      <div class="shell__content">
        <main class="shell__main" id="contenido">
          <router-outlet />
        </main>
        <app-footer />
      </div>
    </div>
  `,
  styles: `
    .shell {
      display: grid;
      grid-template-columns: var(--sidebar-w) minmax(0, 1fr);
      min-height: 100vh;
    }
    .shell__content {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .shell__main {
      flex: 1 0 auto;
      padding: 34px 40px 36px;
      min-width: 0;
    }
    .shell__toggle,
    .shell__backdrop {
      display: none;
    }
    @media (max-width: 900px) {
      .shell {
        --drawer-w: min(var(--sidebar-w), 85vw);
        grid-template-columns: 1fr;
      }
      .shell__main {
        padding: 76px 16px 40px;
      }
      .shell__nav {
        position: fixed;
        inset: 0 auto 0 0;
        width: var(--drawer-w);
        z-index: 20;
        transform: translateX(-100%);
        visibility: hidden;
        transition: transform 0.25s ease, visibility 0.25s;
      }
      .shell__backdrop {
        display: block;
        position: fixed;
        inset: 0;
        z-index: 10;
        background: rgba(30, 24, 30, 0.45);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.25s;
      }
      .shell__toggle {
        display: grid;
        place-items: center;
        position: fixed;
        top: 16px;
        left: 16px;
        z-index: 30;
        width: 44px;
        height: 44px;
        border: 0;
        border-radius: 50%;
        background: var(--c-sidebar);
        color: #fff;
        box-shadow: var(--shadow-card);
        cursor: pointer;
        transition: left 0.25s ease;
      }
      .is-open .shell__nav {
        transform: none;
        visibility: visible;
      }
      .is-open .shell__backdrop {
        opacity: 1;
        pointer-events: auto;
      }
      .is-open .shell__toggle {
        left: calc(var(--drawer-w) + 12px);
      }
    }
  `,
})
export class AppShell {
  protected readonly menuAbierto = signal(false);

  constructor() {
    // Al navegar a otra página, el menú lateral se cierra.
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuAbierto.set(false));
  }
}
