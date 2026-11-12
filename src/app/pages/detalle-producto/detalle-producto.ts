import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Aviso } from '../../components/aviso/aviso';
import { Icono } from '../../components/icono/icono';
import { CabeceraPagina } from '../../components/cabecera-pagina/cabecera-pagina';
import { EtiquetaEstado } from '../../components/etiqueta-estado/etiqueta-estado';
import { ServicioAutenticacion } from '../../services/servicio-autenticacion';
import { ServicioCarrito } from '../../services/servicio-carrito';
import { ServicioProductos } from '../../services/servicio-productos';
import { PipeEuro } from '../../utils/pipe-euro';

@Component({
  selector: 'app-pagina-detalle-producto',
  imports: [CabeceraPagina, EtiquetaEstado, Aviso, Icono, PipeEuro, RouterLink],
  templateUrl: './detalle-producto.html',
  styleUrl: './detalle-producto.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaDetalleProducto {
  /** Parámetro de ruta `:id` (enlazado con withComponentInputBinding). */
  readonly id = input.required<string>();

  protected readonly servicioProductos = inject(ServicioProductos);
  protected readonly autenticacion = inject(ServicioAutenticacion);
  private readonly servicioCarrito = inject(ServicioCarrito);
  private readonly enrutador = inject(Router);

  protected readonly producto = computed(() => this.servicioProductos.porId(this.id()));
  protected readonly imagenNoDisponible = signal(false);
  protected readonly mensajeAnadido = signal<string | null>(null);

  protected anadirAlPedido(): void {
    const producto = this.producto();
    if (!producto) return;
    if (this.autenticacion.rol() !== 'cliente') {
      this.enrutador.navigate(['/acceder'], { queryParams: { volver: '/carta/' + producto.id } });
      return;
    }
    const anadido = this.servicioCarrito.anadir(producto);
    this.mensajeAnadido.set(
      anadido
        ? `${producto.nombre} añadido a tu pedido.`
        : 'Has alcanzado el máximo de 15 líneas por pedido.',
    );
  }
}
