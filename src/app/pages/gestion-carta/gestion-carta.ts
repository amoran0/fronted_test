import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Alert } from '../../components/alert/alert';
import { FilterChips, OpcionFiltro } from '../../components/filter-chips/filter-chips';
import { Icon } from '../../components/icon/icon';
import { PageHeader } from '../../components/page-header/page-header';
import { SearchInput } from '../../components/search-input/search-input';
import { StatusBadge } from '../../components/status-badge/status-badge';
import { ALERGENOS } from '../../models/producto';
import { ProductoService } from '../../services/producto.service';
import { EuroPipe } from '../../utils/euro.pipe';

@Component({
  selector: 'app-gestion-carta-page',
  imports: [PageHeader, SearchInput, FilterChips, StatusBadge, Alert, Icon, EuroPipe, RouterLink],
  templateUrl: './gestion-carta.html',
  styleUrl: './gestion-carta.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GestionCartaPage {
  protected readonly productos = inject(ProductoService);
  protected readonly alergenos = ALERGENOS;

  protected readonly texto = signal('');
  protected readonly vista = signal('productos');

  protected readonly vistas = computed<OpcionFiltro[]>(() => [
    { valor: 'productos', texto: `Productos · ${this.productos.productos().length}` },
    { valor: 'categorias', texto: `Categorías · ${this.productos.categorias().length}` },
    { valor: 'alergenos', texto: `Alérgenos · ${this.alergenos.length}` },
  ]);

  protected readonly lista = computed(() => {
    const q = this.texto().trim().toLowerCase();
    return this.productos
      .productos()
      .filter((p) => !q || p.nombre.toLowerCase().includes(q) || this.productos.nombreCategoria(p.categoriaId).toLowerCase().includes(q));
  });

  protected readonly porCategoria = computed(() =>
    this.productos.categorias().map((c) => ({ ...c, total: this.productos.productos().filter((p) => p.categoriaId === c.id).length })),
  );

  protected nuevaCategoria(): void {
    const nombre = prompt('Nombre de la nueva categoría');
    if (nombre?.trim()) this.productos.crearCategoria(nombre).subscribe();
  }

  protected usos(alergeno: string): number {
    return this.productos.productos().filter((p) => p.alergenos.includes(alergeno as never)).length;
  }
}
