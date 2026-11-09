import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Alert } from '../../components/alert/alert';
import { Icon } from '../../components/icon/icon';
import { KpiCard } from '../../components/kpi-card/kpi-card';
import { PageHeader } from '../../components/page-header/page-header';
import { SearchInput } from '../../components/search-input/search-input';
import { StatusBadge } from '../../components/status-badge/status-badge';
import { Cupon } from '../../models/cupon';
import { CuponService } from '../../services/cupon.service';
import { formatEuro, formatFechaCorta, hoyIso } from '../../utils/formato';
import { esCodigoCuponValido } from '../../utils/validaciones';

/** Validador de grupo: fechas coherentes y email obligatorio si el cupón es personal. */
function reglasCupon(g: AbstractControl): ValidationErrors | null {
  const { desde, hasta, destinatario, email } = g.value;
  const errores: ValidationErrors = {};
  if (desde && hasta && hasta < desde) errores['fechas'] = true;
  if (destinatario === 'personal' && !email) errores['emailRequerido'] = true;
  return Object.keys(errores).length ? errores : null;
}

@Component({
  selector: 'app-cupones-page',
  imports: [ReactiveFormsModule, PageHeader, KpiCard, SearchInput, StatusBadge, Alert, Icon, RouterLink],
  templateUrl: './cupones.html',
  styleUrl: './cupones.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CuponesPage {
  protected readonly cupones = inject(CuponService);
  protected readonly formatEuro = formatEuro;

  protected readonly texto = signal('');
  protected readonly mensaje = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  /** Código del cupón que se está editando; `null` al crear uno nuevo. */
  protected readonly editando = signal<string | null>(null);

  protected readonly lista = computed(() => {
    const q = this.texto().trim().toUpperCase();
    return this.cupones.cupones().filter((c) => !q || c.codigo.includes(q) || c.descripcion.toUpperCase().includes(q));
  });

  protected readonly form = inject(FormBuilder).nonNullable.group(
    {
      codigo: ['', [Validators.required, (c: AbstractControl) => (c.value && !esCodigoCuponValido(c.value) ? { formato: true } : null)]],
      valor: [10, [Validators.required, Validators.min(1)]],
      tipo: ['porcentaje' as Cupon['tipo']],
      usosMax: [100, [Validators.required, Validators.min(1)]],
      desde: [hoyIso(), Validators.required],
      hasta: [''],
      destinatario: ['publico' as 'publico' | 'personal'],
      minimoCompra: [0, [Validators.min(0)]],
      activo: [true],
      email: ['', Validators.email],
    },
    { validators: reglasCupon },
  );
  private readonly estadoForm = toSignal(this.form.statusChanges, { initialValue: this.form.status });
  protected readonly formValido = computed(() => this.estadoForm() === 'VALID');

  protected vigencia(c: Cupon): string {
    if (!c.hasta) return 'Sin caducidad';
    return c.desde > hoyIso() ? `${formatFechaCorta(c.desde)} — ${formatFechaCorta(c.hasta)}` : `Hasta ${formatFechaCorta(c.hasta)}`;
  }

  /** Carga un cupón existente en el formulario para modificarlo. */
  protected editar(c: Cupon): void {
    this.mensaje.set(null);
    this.error.set(null);
    this.editando.set(c.codigo);
    this.form.reset({
      codigo: c.codigo,
      valor: c.valor,
      tipo: c.tipo,
      usosMax: c.usosMax,
      desde: c.desde,
      hasta: c.hasta ?? '',
      destinatario: c.email ? 'personal' : 'publico',
      minimoCompra: c.minimoCompra,
      activo: c.activo,
      email: c.email ?? '',
    });
    this.irAlFormulario();
  }

  protected nuevo(): void {
    this.mensaje.set(null);
    this.error.set(null);
    this.editando.set(null);
    this.form.reset();
    this.irAlFormulario();
  }

  /** Lleva el formulario a la vista (en pantallas estrechas queda debajo de la lista). */
  private irAlFormulario(): void {
    const f = document.getElementById('nuevo-cupon');
    f?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    f?.querySelector<HTMLInputElement>('input:not([readonly])')?.focus({ preventScroll: true });
  }

  protected crear(): void {
    this.mensaje.set(null);
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const codigo = v.codigo.trim().toUpperCase();
    const destino = v.destinatario === 'personal' ? v.email : 'todos los productos';
    const cupon: Cupon = {
      codigo,
      tipo: v.tipo,
      valor: v.valor,
      descripcion: `${v.tipo === 'porcentaje' ? v.valor + ' %' : formatEuro(v.valor)} · ${destino}${v.minimoCompra ? ' · mín. ' + formatEuro(v.minimoCompra) : ''}`,
      desde: v.desde,
      hasta: v.hasta || null,
      usos: this.editando() ? (this.cupones.buscar(codigo)?.usos ?? 0) : 0,
      usosMax: v.usosMax,
      minimoCompra: v.minimoCompra,
      email: v.destinatario === 'personal' ? v.email : undefined,
      activo: v.activo,
    };
    const editando = !!this.editando();
    (editando ? this.cupones.actualizar(cupon) : this.cupones.crear(cupon)).subscribe({
      next: () => {
        this.mensaje.set(`Cupón ${codigo} ${editando ? 'actualizado' : 'creado'}.`);
        this.editando.set(null);
        this.form.reset();
      },
      error: (e: Error) => this.error.set(e.message),
    });
  }

  protected invalido(n: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[n];
    return c.touched && c.invalid;
  }
}
