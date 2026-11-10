import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { PiePagina } from '../pie-pagina/pie-pagina';
import { Icono } from '../icono/icono';
import { BarraLateral } from '../barra-lateral/barra-lateral';

/**
 * Estructura común de todas las vistas: barra lateral a toda la altura + contenido con su pie debajo.
 * En pantallas estrechas la barra lateral se oculta y se abre con un botón.
 */
@Component({
  selector: 'app-estructura-aplicacion',
  imports: [RouterOutlet, BarraLateral, PiePagina, Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'menuAbierto.set(false)' },
  template: `
    <div class="estructura" [class.esta-abierto]="menuAbierto()">
      <button
        type="button"
        class="estructura__desplegable"
        aria-controls="menu-lateral"
        [attr.aria-expanded]="menuAbierto()"
        [attr.aria-label]="menuAbierto() ? 'Ocultar menú' : 'Mostrar menú'"
        (click)="menuAbierto.set(!menuAbierto())"
      >
        <app-icono [nombre]="menuAbierto() ? 'cerrar' : 'menu'" [tamano]="20" />
      </button>
      <app-barra-lateral id="menu-lateral" class="estructura__navegacion" />
      <div class="estructura__fondo" (click)="menuAbierto.set(false)"></div>
      <div class="estructura__contenido">
        <main class="estructura__principal" id="contenido">
          <router-outlet />
        </main>
        <app-pie-pagina />
      </div>
    </div>
  `,
  styles: `
    .estructura {
      display: grid;
      grid-template-columns: var(--ancho-barra-lateral) minmax(0, 1fr);
      min-height: 100vh;
    }
    .estructura__contenido {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .estructura__principal {
      flex: 1 0 auto;
      padding: 34px 40px 36px;
      min-width: 0;
    }
    .estructura__desplegable,
    .estructura__fondo {
      display: none;
    }
    @media (max-width: 900px) {
      .estructura {
        --ancho-menu-movil: min(var(--ancho-barra-lateral), 85vw);
        grid-template-columns: 1fr;
      }
      .estructura__principal {
        padding: 76px 16px 40px;
      }
      .estructura__navegacion {
        position: fixed;
        inset: 0 auto 0 0;
        width: var(--ancho-menu-movil);
        z-index: 20;
        transform: translateX(-100%);
        visibility: hidden;
        transition: transform 0.25s ease, visibility 0.25s;
      }
      .estructura__fondo {
        display: block;
        position: fixed;
        inset: 0;
        z-index: 10;
        background: rgba(30, 24, 30, 0.45);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.25s;
      }
      .estructura__desplegable {
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
        background: var(--color-barra-lateral);
        color: #fff;
        box-shadow: var(--sombra-tarjeta);
        cursor: pointer;
        transition: left 0.25s ease;
      }
      .esta-abierto .estructura__navegacion {
        transform: none;
        visibility: visible;
      }
      .esta-abierto .estructura__fondo {
        opacity: 1;
        pointer-events: auto;
      }
      .esta-abierto .estructura__desplegable {
        left: calc(var(--ancho-menu-movil) + 12px);
      }
    }
  `,
})
export class EstructuraAplicacion {
  protected readonly menuAbierto = signal(false);

  constructor() {
    // Al navegar a otra página, el menú lateral se cierra.
    inject(Router)
      .events.pipe(
        filter((evento) => evento instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuAbierto.set(false));
  }
}
