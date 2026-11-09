import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Alert } from '../../components/alert/alert';
import { Icon } from '../../components/icon/icon';
import { PageHeader } from '../../components/page-header/page-header';
import { SearchInput } from '../../components/search-input/search-input';
import { StatusBadge } from '../../components/status-badge/status-badge';
import { EstadoProducto, Producto } from '../../models/producto';
import { ProductoService } from '../../services/producto.service';

/** El barista abre o agota productos sin tocar la carta administrativa. */
@Component({
  selector: 'app-disponibilidad-page',
  imports: [PageHeader, SearchInput, StatusBadge, Alert, Icon],
  templateUrl: './disponibilidad.html',
  styleUrl: './disponibilidad.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisponibilidadPage {
  protected readonly productos = inject(ProductoService);

  protected readonly texto = signal('');
  protected readonly categoria = signal('');
  protected readonly confirmar = signal<EstadoProducto | null>(null);
  protected readonly mensaje = signal<string | null>(null);

  protected readonly lista = computed(() => {
    const q = this.texto().trim().toLowerCase();
    return this.productos
      .productos()
      .filter((p) => (!this.categoria() || p.categoriaId === this.categoria()) && (!q || p.nombre.toLowerCase().includes(q)));
  });
  protected readonly editables = computed(() => this.lista().filter((p) => p.estado !== 'retirado'));
  protected readonly cuenta = computed(() => {
    const todos = this.productos.productos();
    return {
      disponibles: todos.filter((p) => p.estado === 'disponible').length,
      agotados: todos.filter((p) => p.estado === 'agotado').length,
      visibles: this.lista().length,
    };
  });

  protected cambiar(p: Producto, estado: EstadoProducto): void {
    const nota = estado === 'disponible' ? 'En servicio' : 'Agotado por el barista';
    this.productos.cambiarEstado([p.id], estado, nota).subscribe(() =>
      this.mensaje.set(`${p.nombre} marcado como ${estado === 'disponible' ? 'disponible' : 'agotado'}.`),
    );
  }

  /** Cambio masivo: requiere un segundo clic de confirmación. */
  protected masivo(estado: EstadoProducto): void {
    if (this.confirmar() !== estado) {
      this.confirmar.set(estado);
      return;
    }
    const ids = this.editables().map((p) => p.id);
    this.productos.cambiarEstado(ids, estado, estado === 'disponible' ? 'En servicio' : 'Agotado por el barista').subscribe(() => {
      this.mensaje.set(`${ids.length} productos marcados como ${estado === 'disponible' ? 'disponibles' : 'agotados'}.`);
      this.confirmar.set(null);
    });
  }

  protected registrarReposicion(): void {
    const agotados = this.productos.productos().filter((p) => p.estado === 'agotado');
    if (!agotados.length) {
      this.mensaje.set('No hay productos agotados que reponer.');
      return;
    }
    this.productos.cambiarEstado(agotados.map((p) => p.id), 'disponible', 'En servicio').subscribe(() =>
      this.mensaje.set(`Reposición registrada · ${agotados.length} productos vuelven a estar disponibles.`),
    );
  }
}
