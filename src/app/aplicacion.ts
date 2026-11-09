import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Componente raíz: solo contiene el enrutador; la estructura visual está en EstructuraAplicacion. */
@Component({
  selector: 'app-raiz',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class Aplicacion {}
