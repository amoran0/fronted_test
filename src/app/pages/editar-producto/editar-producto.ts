import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Alert } from '../../components/alert/alert';
import { Icon } from '../../components/icon/icon';
import { PageHeader } from '../../components/page-header/page-header';
import { StatusBadge } from '../../components/status-badge/status-badge';
import { ALERGENOS, Alergeno, EstadoProducto, Producto } from '../../models/producto';
import { ProductoService } from '../../services/producto.service';
import { EuroPipe } from '../../utils/euro.pipe';
import { slug } from '../../utils/formato';

@Component({
  selector: 'app-editar-producto-page',
  imports: [ReactiveFormsModule, PageHeader, Alert, Icon, StatusBadge, EuroPipe, RouterLink],
  templateUrl: './editar-producto.html',
  styleUrl: './editar-producto.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditarProductoPage {
  /** `:id` de la ruta, o `nuevo` para crear. */
  readonly id = input.required<string>();

  protected readonly productos = inject(ProductoService);
  private readonly router = inject(Router);

  protected readonly todosAlergenos = ALERGENOS;
  protected readonly esNuevo = computed(() => this.id() === 'nuevo');
  protected readonly producto = computed(() => this.productos.porId(this.id()));
  protected readonly confirmarRetirada = signal(false);
  protected readonly guardado = signal(false);
  protected readonly alergenosAbierto = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(60)]],
    categoriaId: ['cafe', Validators.required],
    precio: [0, [Validators.required, Validators.min(0.1), Validators.max(99)]],
    estado: ['disponible' as EstadoProducto, Validators.required],
    alergenos: [[] as Alergeno[]],
    descripcion: ['', Validators.maxLength(280)],
  });

  constructor() {
    // Rellena el formulario cuando llega el producto (los datos se cargan de forma asíncrona).
    effect(() => {
      const p = this.producto();
      if (p && !this.form.dirty) {
        this.form.reset({
          nombre: p.nombre,
          categoriaId: p.categoriaId,
          precio: p.precio,
          estado: p.estado,
          alergenos: [...p.alergenos],
          descripcion: p.descripcion,
        });
      }
    });
  }

  protected tieneAlergeno(a: Alergeno): boolean {
    return this.form.controls.alergenos.value.includes(a);
  }

  protected alternarAlergeno(a: Alergeno): void {
    const c = this.form.controls.alergenos;
    c.setValue(this.tieneAlergeno(a) ? c.value.filter((x) => x !== a) : [...c.value, a]);
    c.markAsDirty();
  }

  /** Cierra el desplegable de alérgenos cuando el foco sale de él. */
  protected cerrarAlergenos(e: FocusEvent): void {
    const actual = e.currentTarget as HTMLElement;
    if (!actual.contains(e.relatedTarget as Node | null)) this.alergenosAbierto.set(false);
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const id = this.esNuevo() ? slug(v.nombre) : this.id();
    const base: Partial<Producto> = this.producto() ?? {};
    this.productos.guardar({ ...base, ...v, id, precio: Math.round(v.precio * 100) / 100 } as Producto).subscribe(() => {
      this.guardado.set(true);
      this.form.markAsPristine();
      if (this.esNuevo()) this.router.navigate(['/admin/carta', id]);
    });
  }

  protected retirar(): void {
    this.productos.retirar(this.id()).subscribe(() => this.router.navigateByUrl('/admin/carta'));
  }

  protected reactivar(): void {
    this.productos.cambiarEstado([this.id()], 'disponible', 'En servicio').subscribe();
  }

  protected campoInvalido(nombre: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[nombre];
    return c.touched && c.invalid;
  }
}
