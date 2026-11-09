import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Alert } from '../../components/alert/alert';
import { Icon } from '../../components/icon/icon';
import { PageHeader } from '../../components/page-header/page-header';
import { ResultadoValidacion } from '../../models/cupon';
import { CuponService } from '../../services/cupon.service';
import { calcularTotal } from '../../utils/calculos';
import { formatEuro, hoyIso } from '../../utils/formato';

/** Cupones generados a petición de CineTown y comprobador manual de cupones. */
@Component({
  selector: 'app-cupones-solicitudes-page',
  imports: [ReactiveFormsModule, PageHeader, Alert, Icon, RouterLink],
  templateUrl: './cupones-solicitudes.html',
  styleUrl: './cupones-solicitudes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CuponesSolicitudesPage {
  private readonly cupones = inject(CuponService);
  private readonly fb = inject(FormBuilder).nonNullable;
  protected readonly formatEuro = formatEuro;

  protected readonly solicitud = this.fb.group({
    referencia: ['CT2026-1048', Validators.required],
    codigo: ['CINE5', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{4,16}$/)]],
    descuentoFijo: [5, [Validators.required, Validators.min(1)]],
    desde: [hoyIso(), Validators.required],
    hasta: [hoyIso(new Date(Date.now() + 19 * 86400000)), Validators.required],
    usosMax: [1, [Validators.required, Validators.min(1)]],
    minimoCompra: [15, Validators.min(0)],
    email: ['marta.r@example.com', [Validators.required, Validators.email]],
  });
  protected readonly generado = signal<string | null>(null);
  protected readonly errorGenerar = signal<string | null>(null);

  protected readonly comprobador = this.fb.group({
    codigo: ['MARTA5', Validators.required],
    importe: [18.5, [Validators.required, Validators.min(0)]],
    fecha: [hoyIso(), Validators.required],
    email: ['marta.r@example.com', Validators.email],
  });
  protected readonly resultado = signal<(ResultadoValidacion & { total: number }) | null>(null);

  protected generar(): void {
    this.generado.set(null);
    this.errorGenerar.set(null);
    if (this.solicitud.invalid) {
      this.solicitud.markAllAsTouched();
      return;
    }
    const v = this.solicitud.getRawValue();
    this.cupones.generarParaSolicitud({ ...v, recibida: hoyIso() }).subscribe({
      next: (c) =>
        this.generado.set(
          `Cupón personal de ${formatEuro(c.valor)} · activo · 0/${c.usosMax} usos · mínimo ${formatEuro(c.minimoCompra)} · para ${c.email}.`,
        ),
      error: (e: Error) => this.errorGenerar.set(e.message),
    });
  }

  protected comprobar(): void {
    if (this.comprobador.invalid) {
      this.comprobador.markAllAsTouched();
      return;
    }
    const v = this.comprobador.getRawValue();
    const r = this.cupones.validar(v.codigo, { subtotal: v.importe, email: v.email, fecha: new Date(v.fecha + 'T12:00') });
    this.resultado.set({ ...r, total: calcularTotal(v.importe, r.valido ? { tipo: 'cupon', etiqueta: '', importe: r.descuento! } : null) });
  }
}
