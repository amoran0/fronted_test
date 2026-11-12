import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Aviso, ResultadoOperacion, TonoAviso } from '../../components/aviso/aviso';
import { Icono } from '../../components/icono/icono';
import { CabeceraPagina } from '../../components/cabecera-pagina/cabecera-pagina';
import { CampoBusqueda } from '../../components/campo-busqueda/campo-busqueda';
import { EtiquetaEstado } from '../../components/etiqueta-estado/etiqueta-estado';
import { EstadoProducto, Producto } from '../../models/producto';
import { ServicioProductos } from '../../services/servicio-productos';

/** Nota visible para el barista según el nuevo estado del producto. */
const NOTA_POR_ESTADO: Record<EstadoProducto, string> = {
  disponible: 'En servicio',
  agotado: 'Agotado por el barista',
  retirado: 'Retirado',
};

/** El barista abre o agota productos sin tocar la carta administrativa. */
@Component({
  selector: 'app-pagina-disponibilidad',
  imports: [CabeceraPagina, CampoBusqueda, EtiquetaEstado, Aviso, Icono],
  templateUrl: './disponibilidad.html',
  styleUrl: './disponibilidad.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaDisponibilidad {
  protected readonly servicioProductos = inject(ServicioProductos);

  protected readonly textoBusqueda = signal('');
  protected readonly categoriaSeleccionada = signal('');
  /** Estado del cambio masivo pendiente de confirmar con un segundo clic. */
  protected readonly cambioMasivoPorConfirmar = signal<EstadoProducto | null>(null);
  protected readonly resultado = signal<ResultadoOperacion | null>(null);

  protected readonly productosFiltrados = computed(() => {
    const busqueda = this.textoBusqueda().trim().toLowerCase();
    return this.servicioProductos
      .productos()
      .filter(
        (producto) =>
          (!this.categoriaSeleccionada() ||
            producto.categoriaId === this.categoriaSeleccionada()) &&
          (!busqueda || producto.nombre.toLowerCase().includes(busqueda)),
      );
  });
  /** Productos que el barista puede cambiar (los retirados solo los gestiona el admin). */
  protected readonly productosEditables = computed(() =>
    this.productosFiltrados().filter((producto) => producto.estado !== 'retirado'),
  );
  protected readonly recuentos = computed(() => {
    const todosLosProductos = this.servicioProductos.productos();
    return {
      disponibles: todosLosProductos.filter((producto) => producto.estado === 'disponible').length,
      agotados: todosLosProductos.filter((producto) => producto.estado === 'agotado').length,
      visibles: this.productosFiltrados().length,
    };
  });

  protected cambiarEstado(producto: Producto, estado: EstadoProducto): void {
    this.servicioProductos.cambiarEstado([producto.id], estado, NOTA_POR_ESTADO[estado]).subscribe({
      next: () => this.mostrarResultado('exito', `${producto.nombre} marcado como ${estado}.`),
      error: (errorCambio: Error) => this.mostrarResultado('peligro', errorCambio.message),
    });
  }

  /** Cambio masivo: requiere un segundo clic de confirmación. */
  protected cambiarEstadoMasivo(estado: EstadoProducto): void {
    if (this.cambioMasivoPorConfirmar() !== estado) {
      this.cambioMasivoPorConfirmar.set(estado);
      return;
    }
    const ids = this.productosEditables().map((producto) => producto.id);
    this.servicioProductos.cambiarEstado(ids, estado, NOTA_POR_ESTADO[estado]).subscribe({
      next: () => {
        const textoEstado = estado === 'disponible' ? 'disponibles' : 'agotados';
        this.mostrarResultado('exito', `${ids.length} productos marcados como ${textoEstado}.`);
        this.cambioMasivoPorConfirmar.set(null);
      },
      error: (errorCambio: Error) => this.mostrarResultado('peligro', errorCambio.message),
    });
  }

  protected registrarReposicion(): void {
    const productosAgotados = this.servicioProductos
      .productos()
      .filter((producto) => producto.estado === 'agotado');
    if (!productosAgotados.length) {
      this.mostrarResultado('informacion', 'No hay productos agotados que reponer.');
      return;
    }
    const ids = productosAgotados.map((producto) => producto.id);
    this.servicioProductos.cambiarEstado(ids, 'disponible', NOTA_POR_ESTADO.disponible).subscribe({
      next: () =>
        this.mostrarResultado(
          'exito',
          `Reposición registrada · ${productosAgotados.length} productos vuelven a estar disponibles.`,
        ),
      error: (errorCambio: Error) => this.mostrarResultado('peligro', errorCambio.message),
    });
  }

  private mostrarResultado(tono: TonoAviso, texto: string): void {
    this.resultado.set({ tono, texto });
  }
}
