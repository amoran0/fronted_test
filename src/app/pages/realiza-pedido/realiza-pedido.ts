import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Aviso } from '../../components/aviso/aviso';
import { Icono } from '../../components/icono/icono';
import { CabeceraPagina } from '../../components/cabecera-pagina/cabecera-pagina';
import { SelectorCantidad } from '../../components/selector-cantidad/selector-cantidad';
import { EtiquetaEstado } from '../../components/etiqueta-estado/etiqueta-estado';
import { MAX_LINEAS, MAX_UNIDADES_LINEA } from '../../models/pedido';
import { ServicioCarrito } from '../../services/servicio-carrito';
import { PipeEuro } from '../../utils/pipe-euro';
import { totalLinea } from '../../utils/calculos';

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
