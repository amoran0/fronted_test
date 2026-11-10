import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { Icono } from '../icono/icono';

/** Selector de cantidad −/+ con límites. Uso: `<app-selector-cantidad [(valor)]="cantidad" [maximo]="20" />` */
@Component({
  selector: 'app-selector-cantidad',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="selector-cantidad" role="group" [attr.aria-label]="'Cantidad de ' + etiqueta()">
      <button type="button" class="selector-cantidad__boton" [disabled]="deshabilitado() || valor() <= minimo()" (click)="valor.set(valor() - 1)" aria-label="Quitar una unidad">
        <app-icono nombre="menos" [tamano]="14" />
      </button>
      <div class="selector-cantidad__valor">
        <strong>{{ valor() }}</strong>
        <span>máx. {{ maximo() }}</span>
      </div>
      <button type="button" class="selector-cantidad__boton" [disabled]="deshabilitado() || valor() >= maximo()" (click)="valor.set(valor() + 1)" aria-label="Añadir una unidad">
        <app-icono nombre="mas" [tamano]="14" />
      </button>
    </div>
  `,
  styles: `
    .selector-cantidad { display: flex; align-items: center; gap: 8px; }
    .selector-cantidad__boton { width: 42px; height: 42px; border-radius: var(--radio-boton); border: 1px solid var(--color-borde); background: var(--color-superficie); display: grid; place-items: center; cursor: pointer; }
    .selector-cantidad__boton:hover:not(:disabled) { border-color: var(--color-texto-atenuado); }
    .selector-cantidad__boton:disabled { color: var(--color-deshabilitado-texto); cursor: not-allowed; opacity: .6; }
    .selector-cantidad__valor { width: 40px; display: flex; flex-direction: column; align-items: center; font-size: 13px; }
    .selector-cantidad__valor span { font-size: 9px; color: var(--color-texto-atenuado); }
  `,
})
export class SelectorCantidad {
  readonly valor = model(1);
  readonly minimo = input(1);
  readonly maximo = input(20);
  readonly deshabilitado = input(false);
  /** Nombre del producto, para la etiqueta accesible. */
  readonly etiqueta = input('producto');
}
