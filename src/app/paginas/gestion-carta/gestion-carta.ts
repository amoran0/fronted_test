import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Aviso } from '../../componentes/aviso/aviso';
import { GrupoFiltros, OpcionFiltro } from '../../componentes/grupo-filtros/grupo-filtros';
import { Icono } from '../../componentes/icono/icono';
import { CabeceraPagina } from '../../componentes/cabecera-pagina/cabecera-pagina';
import { CampoBusqueda } from '../../componentes/campo-busqueda/campo-busqueda';
import { EtiquetaEstado } from '../../componentes/etiqueta-estado/etiqueta-estado';
import { ALERGENOS, Alergeno } from '../../modelos/producto';
import { ServicioProductos } from '../../servicios/servicio-productos';
import { PipeEuro } from '../../utilidades/pipe-euro';

@Component({
  selector: 'app-pagina-gestion-carta',
  imports: [CabeceraPagina, CampoBusqueda, GrupoFiltros, EtiquetaEstado, Aviso, Icono, PipeEuro, RouterLink],
  templateUrl: './gestion-carta.html',
  styleUrl: './gestion-carta.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaGestionCarta {
  protected readonly servicioProductos = inject(ServicioProductos);
  protected readonly alergenos = ALERGENOS;

  protected readonly textoBusqueda = signal('');
  protected readonly seccionVisible = signal('productos');

  protected readonly opcionesSeccion = computed<OpcionFiltro[]>(() => [
    { valor: 'productos', texto: `Productos · ${this.servicioProductos.productos().length}` },
    { valor: 'categorias', texto: `Categorías · ${this.servicioProductos.categorias().length}` },
    { valor: 'alergenos', texto: `Alérgenos · ${this.alergenos.length}` },
  ]);

  protected readonly productosFiltrados = computed(() => {
    const busqueda = this.textoBusqueda().trim().toLowerCase();
    return this.servicioProductos.productos().filter((producto) => {
      const nombreCategoria = this.servicioProductos.nombreCategoria(producto.categoriaId).toLowerCase();
      return !busqueda || producto.nombre.toLowerCase().includes(busqueda) || nombreCategoria.includes(busqueda);
    });
  });

  /** Categorías con el número de productos de cada una. */
  protected readonly categoriasConTotal = computed(() =>
    this.servicioProductos.categorias().map((categoria) => ({
      ...categoria,
      total: this.servicioProductos.productos().filter((producto) => producto.categoriaId === categoria.id).length,
    })),
  );

  protected crearCategoria(): void {
    const nombre = prompt('Nombre de la nueva categoría');
    if (nombre?.trim()) this.servicioProductos.crearCategoria(nombre).subscribe();
  }

  protected productosConAlergeno(alergeno: Alergeno): number {
    return this.servicioProductos.productos().filter((producto) => producto.alergenos.includes(alergeno)).length;
  }
}
