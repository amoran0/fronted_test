import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Alert } from '../../components/alert/alert';
import { Icon } from '../../components/icon/icon';
import { PageHeader } from '../../components/page-header/page-header';
import { StatusBadge } from '../../components/status-badge/status-badge';
import { AuthService } from '../../services/auth.service';
import { CarritoService } from '../../services/carrito.service';
import { ProductoService } from '../../services/producto.service';
import { EuroPipe } from '../../utils/euro.pipe';

@Component({
  selector: 'app-detalle-producto-page',
  imports: [PageHeader, StatusBadge, Alert, Icon, EuroPipe, RouterLink],
  templateUrl: './detalle-producto.html',
  styleUrl: './detalle-producto.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetalleProductoPage {
  /** Parámetro de ruta `:id` (enlazado con withComponentInputBinding). */
  readonly id = input.required<string>();

  protected readonly productos = inject(ProductoService);
  protected readonly auth = inject(AuthService);
  private readonly carrito = inject(CarritoService);
  private readonly router = inject(Router);

  protected readonly producto = computed(() => this.productos.porId(this.id()));
  protected readonly sinImagen = signal(false);
  protected readonly mensaje = signal<string | null>(null);

  protected anadir(): void {
    const p = this.producto();
    if (!p) return;
    if (this.auth.rol() !== 'cliente') {
      this.router.navigate(['/acceder'], { queryParams: { volver: '/carta/' + p.id } });
      return;
    }
    const ok = this.carrito.anadir(p);
    this.mensaje.set(ok ? `${p.nombre} añadido a tu pedido.` : 'Has alcanzado el máximo de 15 líneas por pedido.');
  }
}
