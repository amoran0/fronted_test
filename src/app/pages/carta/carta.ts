import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GrupoFiltros, OpcionFiltro } from '../../components/grupo-filtros/grupo-filtros';
import { Icono } from '../../components/icono/icono';
import { CabeceraPagina } from '../../components/cabecera-pagina/cabecera-pagina';
import { TarjetaProducto } from '../../components/tarjeta-producto/tarjeta-producto';
import { CampoBusqueda } from '../../components/campo-busqueda/campo-busqueda';
import { SelectorMultiple } from '../../components/selector-multiple/selector-multiple';
import { Alergeno } from '../../models/producto';
import { ServicioAutenticacion } from '../../services/servicio-autenticacion';
import { ServicioCarrito } from '../../services/servicio-carrito';
import { ServicioProductos } from '../../services/servicio-productos';

@Component({
  selector: 'app-pagina-carta',
  imports: [CabeceraPagina, TarjetaProducto, GrupoFiltros, CampoBusqueda, SelectorMultiple, Icono, RouterLink],
  templateUrl: './carta.html',
  styleUrl: './carta.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaCarta {
  protected readonly servicioProductos = inject(ServicioProductos);
  protected readonly servicioCarrito = inject(ServicioCarrito);
  protected readonly autenticacion = inject(ServicioAutenticacion);

  protected readonly alergenos = this.servicioProductos.alergenos;
  protected readonly opcionesPrecioMaximo = [5, 10, 15];

  protected readonly opcionesTipoProducto: OpcionFiltro[] = [
    { valor: 'todos', texto: 'Todos' },
    { valor: 'cafe', texto: 'Café' },
    { valor: 'comida', texto: 'Comida' },
    { valor: 'frios', texto: 'Fríos' },
  ];
  protected readonly opcionesDisponibilidad: OpcionFiltro[] = [
    { valor: 'todos', texto: 'Todos' },
    { valor: 'disponible', texto: 'Disponibles' },
    { valor: 'agotado', texto: 'Agotados' },
  ];

  // Filtros
  protected readonly textoBusqueda = signal('');
  protected readonly tipoProducto = signal('todos');
  protected readonly estadoDisponibilidad = signal('todos');
  protected readonly precioMaximo = signal(10);
  protected readonly alergenosExcluidos = signal<string[]>([]);

  protected readonly productosFiltrados = computed(() => {
    const busqueda = this.textoBusqueda().trim().toLowerCase();
    return this.servicioProductos.carta().filter((producto) => {
      const categoria = this.servicioProductos.categoria(producto.categoriaId);
      const coincideBusqueda =
        !busqueda ||
        producto.nombre.toLowerCase().includes(busqueda) ||
        categoria?.nombre.toLowerCase().includes(busqueda);
      const coincideTipo = this.tipoProducto() === 'todos' || categoria?.grupo === this.tipoProducto();
      const coincideDisponibilidad =
        this.estadoDisponibilidad() === 'todos' || producto.estado === this.estadoDisponibilidad();
      const dentroDePrecio = producto.precio <= this.precioMaximo();
      const sinAlergenoExcluido = !this.alergenosExcluidos().some((alergeno) =>
        producto.alergenos.includes(alergeno as Alergeno),
      );
      return coincideBusqueda && coincideTipo && coincideDisponibilidad && dentroDePrecio && sinAlergenoExcluido;
    });
  });

  protected quitarFiltros(): void {
    this.textoBusqueda.set('');
    this.tipoProducto.set('todos');
    this.estadoDisponibilidad.set('todos');
    this.precioMaximo.set(15);
    this.alergenosExcluidos.set([]);
  }
}
