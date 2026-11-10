import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { Icono } from '../icono/icono';

/** Campo de búsqueda con icono. Uso: `<app-campo-busqueda [(valor)]="texto" textoIndicativo="Buscar" />` */
@Component({
  selector: 'app-campo-busqueda',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:block' },
  template: `
    <label class="entrada-con-icono">
      <span class="solo-lector-pantalla">{{ textoIndicativo() }}</span>
      <app-icono nombre="buscar" [tamano]="15" />
      <input class="entrada" type="search" [placeholder]="textoIndicativo()" [value]="valor()" (input)="valor.set($any($event.target).value)" />
    </label>
  `,
  styles: `label { display: block; }`,
})
export class CampoBusqueda {
  readonly valor = model('');
  /** Texto de ayuda dentro del campo (y etiqueta accesible). */
  readonly textoIndicativo = input('Buscar');
}
