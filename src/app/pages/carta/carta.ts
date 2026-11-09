import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FilterChips, OpcionFiltro } from '../../components/filter-chips/filter-chips';
import { Icon } from '../../components/icon/icon';
import { PageHeader } from '../../components/page-header/page-header';
import { ProductCard } from '../../components/product-card/product-card';
import { SearchInput } from '../../components/search-input/search-input';
import { ALERGENOS } from '../../models/producto';
import { AuthService } from '../../services/auth.service';
import { CarritoService } from '../../services/carrito.service';
import { ProductoService } from '../../services/producto.service';

@Component({
  selector: 'app-carta-page',
  imports: [PageHeader, ProductCard, FilterChips, SearchInput, Icon, RouterLink],
  templateUrl: './carta.html',
  styleUrl: './carta.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartaPage {
  protected readonly productos = inject(ProductoService);
  protected readonly carrito = inject(CarritoService);
  protected readonly auth = inject(AuthService);

  protected readonly alergenos = ALERGENOS;
  protected readonly preciosMax = [5, 10, 15];

  protected readonly grupos: OpcionFiltro[] = [
    { valor: 'todos', texto: 'Todos' },
    { valor: 'cafe', texto: 'Café' },
    { valor: 'comida', texto: 'Comida' },
    { valor: 'frios', texto: 'Fríos' },
  ];
  protected readonly disponibilidad: OpcionFiltro[] = [
    { valor: 'todos', texto: 'Todos' },
    { valor: 'disponible', texto: 'Disponibles', punto: 'var(--c-info)' },
    { valor: 'agotado', texto: 'Agotados', punto: 'var(--c-danger)' },
  ];

  // Filtros
  protected readonly texto = signal('');
  protected readonly grupo = signal('todos');
  protected readonly estado = signal('todos');
  protected readonly precioMax = signal(10);
  protected readonly sinAlergeno = signal('');

  protected readonly resultado = computed(() => {
    const q = this.texto().trim().toLowerCase();
    return this.productos.carta().filter((p) => {
      const cat = this.productos.categoria(p.categoriaId);
      return (
        (!q || p.nombre.toLowerCase().includes(q) || cat?.nombre.toLowerCase().includes(q)) &&
        (this.grupo() === 'todos' || cat?.grupo === this.grupo()) &&
        (this.estado() === 'todos' || p.estado === this.estado()) &&
        p.precio <= this.precioMax() &&
        (!this.sinAlergeno() || !p.alergenos.includes(this.sinAlergeno() as never))
      );
    });
  });

  protected limpiar(): void {
    this.texto.set('');
    this.grupo.set('todos');
    this.estado.set('todos');
    this.precioMax.set(15);
    this.sinAlergeno.set('');
  }
}
