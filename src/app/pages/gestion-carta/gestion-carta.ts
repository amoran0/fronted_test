import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Aviso, ResultadoOperacion } from '../../components/aviso/aviso';
import { GrupoFiltros, OpcionFiltro } from '../../components/grupo-filtros/grupo-filtros';
import { Icono } from '../../components/icono/icono';
import { CabeceraPagina } from '../../components/cabecera-pagina/cabecera-pagina';
import { CampoBusqueda } from '../../components/campo-busqueda/campo-busqueda';
import { EtiquetaEstado } from '../../components/etiqueta-estado/etiqueta-estado';
import { TarjetaAnadir } from '../../components/tarjeta-anadir/tarjeta-anadir';
import { Alergeno } from '../../models/producto';
import { ServicioProductos } from '../../services/servicio-productos';
import { PipeEuro } from '../../utils/pipe-euro';

@Component({
  selector: 'app-pagina-gestion-carta',
  imports: [
    CabeceraPagina,
    CampoBusqueda,
    GrupoFiltros,
    EtiquetaEstado,
    TarjetaAnadir,
    Aviso,
    Icono,
    PipeEuro,
    RouterLink,
  ],
  templateUrl: './gestion-carta.html',
  styleUrl: './gestion-carta.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaGestionCarta {
  protected readonly servicioProductos = inject(ServicioProductos);
  protected readonly alergenos = this.servicioProductos.alergenos;

  protected readonly textoBusqueda = signal('');
  protected readonly seccionVisible = signal('productos');

  protected readonly opcionesSeccion = computed<OpcionFiltro[]>(() => [
    { valor: 'productos', texto: `Productos · ${this.servicioProductos.productos().length}` },
    { valor: 'categorias', texto: `Categorías · ${this.servicioProductos.categorias().length}` },
    { valor: 'alergenos', texto: `Alérgenos · ${this.alergenos().length}` },
  ]);

  protected readonly productosFiltrados = computed(() => {
    const busqueda = this.textoBusqueda().trim().toLowerCase();
    return this.servicioProductos.productos().filter((producto) => {
      const nombreCategoria = this.servicioProductos
        .nombreCategoria(producto.categoriaId)
        .toLowerCase();
      return (
        !busqueda ||
        producto.nombre.toLowerCase().includes(busqueda) ||
        nombreCategoria.includes(busqueda)
      );
    });
  });

  /** Productos de la lista actual que no están retirados. */
  protected readonly productosActivos = computed(
    () => this.productosFiltrados().filter((producto) => producto.estado !== 'retirado').length,
  );

  /** Categorías con el número de productos de cada una. */
  protected readonly categoriasConTotal = computed(() =>
    this.servicioProductos.categorias().map((categoria) => ({
      ...categoria,
      total: this.servicioProductos
        .productos()
        .filter((producto) => producto.categoriaId === categoria.id).length,
    })),
  );

  /** Resultado de la última operación sobre categorías (crear o eliminar). */
  protected readonly resultadoCategoria = signal<ResultadoOperacion | null>(null);

  protected crearCategoria(nombre: string): void {
    this.servicioProductos.crearCategoria(nombre).subscribe({
      next: (categoria) =>
        this.resultadoCategoria.set({
          tono: 'exito',
          texto: `Categoría «${categoria.nombre}» creada.`,
        }),
      error: (errorCreando: Error) =>
        this.resultadoCategoria.set({ tono: 'peligro', texto: errorCreando.message }),
    });
  }

  protected eliminarCategoria(id: string, nombre: string): void {
    if (!confirm(`¿Eliminar la categoría «${nombre}»?`)) return;
    this.servicioProductos.eliminarCategoria(id).subscribe({
      next: () =>
        this.resultadoCategoria.set({ tono: 'exito', texto: `Categoría «${nombre}» eliminada.` }),
      error: (errorEliminando: Error) =>
        this.resultadoCategoria.set({ tono: 'peligro', texto: errorEliminando.message }),
    });
  }

  protected crearAlergeno(nombre: string): void {
    this.servicioProductos.crearAlergeno(nombre);
  }

  protected productosConAlergeno(alergeno: Alergeno): number {
    return this.servicioProductos
      .productos()
      .filter((producto) => producto.alergenos.includes(alergeno)).length;
  }
}
