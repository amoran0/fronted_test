import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Aviso } from '../../componentes/aviso/aviso';
import { Icono } from '../../componentes/icono/icono';
import { CabeceraPagina } from '../../componentes/cabecera-pagina/cabecera-pagina';
import { SelectorCantidad } from '../../componentes/selector-cantidad/selector-cantidad';
import { EtiquetaEstado } from '../../componentes/etiqueta-estado/etiqueta-estado';
import { MAX_LINEAS, MAX_UNIDADES_LINEA } from '../../modelos/pedido';
import { ServicioCarrito } from '../../servicios/servicio-carrito';
import { PipeEuro } from '../../utilidades/pipe-euro';
import { totalLinea } from '../../utilidades/calculos';

@Component({
  selector: 'app-pagina-realiza-pedido',
  imports: [CabeceraPagina, Aviso, Icono, SelectorCantidad, EtiquetaEstado, PipeEuro, RouterLink],
  templateUrl: './realiza-pedido.html',
  styleUrl: './realiza-pedido.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaRealizaPedido {
  protected readonly servicioCarrito = inject(ServicioCarrito);
  protected readonly maximoLineas = MAX_LINEAS;
  protected readonly maximoUnidadesPorLinea = MAX_UNIDADES_LINEA;
  protected readonly totalLinea = totalLinea;
}
