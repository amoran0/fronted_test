import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Cupon, EstadoCupon, ResultadoValidacion, SolicitudCineTown } from '../models/cupon';
import { ContextoCupon, validarCupon } from '../utils/validaciones';
import { ApiService } from './api.service';
import { MOCK_CUPONES } from './mock-data';

@Injectable({ providedIn: 'root' })
export class CuponService {
  private readonly api = inject(ApiService);
  private readonly _cupones = signal<Cupon[]>([]);
  readonly cupones = this._cupones.asReadonly();

  /** Cupones vigentes: activos o personales. */
  private readonly vigentes = computed(() => this._cupones().filter((c) => ['activo', 'personal'].includes(this.estado(c))));
  readonly activos = computed(() => this.vigentes().length);
  readonly canjesMes = computed(() => this.vigentes().reduce((acc, c) => acc + c.usos, 0));
  readonly descuentoConcedido = signal(428.6);

  constructor() {
    this.api.get('/cupones', () => MOCK_CUPONES).subscribe((c) => this._cupones.set(c));
  }

  buscar(codigo: string): Cupon | undefined {
    const c = codigo.trim().toUpperCase();
    return this._cupones().find((x) => x.codigo === c);
  }

  validar(codigo: string, ctx: ContextoCupon): ResultadoValidacion {
    return validarCupon(this.buscar(codigo), ctx);
  }

  estado(c: Cupon, hoy = new Date()): EstadoCupon {
    if (!c.activo) return 'inactivo';
    if (c.hasta && new Date(c.hasta + 'T23:59:59') < hoy) return 'caducado';
    if (c.usos >= c.usosMax) return 'agotado';
    return c.email ? 'personal' : 'activo';
  }

  crear(cupon: Cupon): Observable<Cupon> {
    return this.api
      .post<Cupon>('/cupones', cupon, () => {
        if (this.buscar(cupon.codigo)) throw new Error(`Ya existe un cupón con el código ${cupon.codigo}.`);
        return cupon;
      })
      .pipe(tap((c) => this._cupones.update((l) => [c, ...l])));
  }

  /** Guarda los cambios de un cupón existente (conserva sus usos). */
  actualizar(cupon: Cupon): Observable<Cupon> {
    return this.api
      .put<Cupon>(`/cupones/${cupon.codigo}`, cupon, () => {
        if (!this.buscar(cupon.codigo)) throw new Error(`No existe el cupón ${cupon.codigo}.`);
        return cupon;
      })
      .pipe(tap((c) => this._cupones.update((l) => l.map((x) => (x.codigo === c.codigo ? c : x)))));
  }

  /** Cupón personal de importe fijo generado a petición de CineTown. */
  generarParaSolicitud(s: SolicitudCineTown): Observable<Cupon> {
    return this.crear({
      codigo: s.codigo.trim().toUpperCase(),
      tipo: 'fijo',
      valor: s.descuentoFijo,
      descripcion: `${s.descuentoFijo} € · CineTown · ${s.email}`,
      desde: s.desde,
      hasta: s.hasta,
      usos: 0,
      usosMax: s.usosMax,
      minimoCompra: s.minimoCompra,
      email: s.email,
      activo: true,
    });
  }
}
