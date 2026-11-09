import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GrupoFiltros, OpcionFiltro } from '../../componentes/grupo-filtros/grupo-filtros';
import { Icono } from '../../componentes/icono/icono';
import { CabeceraPagina } from '../../componentes/cabecera-pagina/cabecera-pagina';
import { TarjetaProducto } from '../../componentes/tarjeta-producto/tarjeta-producto';
import { CampoBusqueda } from '../../componentes/campo-busqueda/campo-busqueda';
import { ALERGENOS, Alergeno } from '../../modelos/producto';
import { ServicioAutenticacion } from '../../servicios/servicio-autenticacion';
import { ServicioCarrito } from '../../servicios/servicio-carrito';
import { ServicioProductos } from '../../servicios/servicio-productos';

@Component({
  selector: 'app-pagina-carta',
  imports: [CabeceraPagina, TarjetaProducto, GrupoFiltros, CampoBusqueda, Icono, RouterLink],
  templateUrl: './carta.html',
  styleUrl: './carta.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaCarta {
  protected readonly servicioProductos = inject(ServicioProductos);
  protected readonly servicioCarrito = inject(ServicioCarrito);
  protected readonly autenticacion = inject(ServicioAutenticacion);

  protected readonly alergenos = ALERGENOS;
  protected readonly opcionesPrecioMaximo = [5, 10, 15];

  protected readonly opcionesTipoProducto: OpcionFiltro[] = [
    { valor: 'todos', texto: 'Todos' },
    { valor: 'cafe', texto: 'Café' },
    { valor: 'comida', texto: 'Comida' },
    { valor: 'frios', texto: 'Fríos' },
  ];
  protected readonly opcionesDisponibilidad: OpcionFiltro[] = [
    { valor: 'todos', texto: 'Todos' },
    { valor: 'disponible', texto: 'Disponibles', punto: 'var(--color-informacion)' },
    { valor: 'agotado', texto: 'Agotados', punto: 'var(--color-peligro)' },
  ];

  // Filtros
  protected readonly textoBusqueda = signal('');
  protected readonly tipoProducto = signal('todos');
  protected readonly estadoDisponibilidad = signal('todos');
  protected readonly precioMaximo = signal(10);
  protected readonly alergenoExcluido = signal<Alergeno | ''>('');

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
      const sinAlergenoExcluido =
        !this.alergenoExcluido() || !producto.alergenos.includes(this.alergenoExcluido() as Alergeno);
      return coincideBusqueda && coincideTipo && coincideDisponibilidad && dentroDePrecio && sinAlergenoExcluido;
    });
  });

  protected quitarFiltros(): void {
    this.textoBusqueda.set('');
    this.tipoProducto.set('todos');
    this.estadoDisponibilidad.set('todos');
    this.precioMaximo.set(15);
    this.alergenoExcluido.set('');
  }
}
