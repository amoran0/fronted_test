import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Cupon, EstadoCupon, ResultadoValidacion, SolicitudCineTown } from '../models/cupon';
import { ContextoCupon, validarCupon } from '../utils/validaciones';
import { ServicioApi } from './servicio-api';
import { CUPONES_SIMULADOS } from './datos-simulados';

@Injectable({ providedIn: 'root' })
export class ServicioCupones {
  private readonly api = inject(ServicioApi);
  private readonly cuponesCargados = signal<Cupon[]>([]);
  readonly cupones = this.cuponesCargados.asReadonly();

  /** Cupones vigentes: activos o personales. */
  private readonly vigentes = computed(() =>
    this.cuponesCargados().filter((cupon) => ['activo', 'personal'].includes(this.estado(cupon))),
  );
  readonly activos = computed(() => this.vigentes().length);
  readonly canjesMes = computed(() => this.vigentes().reduce((totalCanjes, cupon) => totalCanjes + cupon.usos, 0));
  readonly descuentoConcedido = signal(428.6);

  constructor() {
    this.api
      .obtener('/cupones', () => CUPONES_SIMULADOS)
      .subscribe((cuponesRecibidos) => this.cuponesCargados.set(cuponesRecibidos));
  }

  buscar(codigo: string): Cupon | undefined {
    const codigoNormalizado = codigo.trim().toUpperCase();
    return this.cuponesCargados().find((cupon) => cupon.codigo === codigoNormalizado);
  }

  validar(codigo: string, contexto: ContextoCupon): ResultadoValidacion {
    return validarCupon(this.buscar(codigo), contexto);
  }

  estado(cupon: Cupon, hoy = new Date()): EstadoCupon {
    if (!cupon.activo) return 'inactivo';
    if (cupon.hasta && new Date(cupon.hasta + 'T23:59:59') < hoy) return 'caducado';
    if (cupon.usos >= cupon.usosMax) return 'agotado';
    return cupon.email ? 'personal' : 'activo';
  }

  crear(cupon: Cupon): Observable<Cupon> {
    return this.api
      .crear<Cupon>('/cupones', cupon, () => {
        if (this.buscar(cupon.codigo)) throw new Error(`Ya existe un cupón con el código ${cupon.codigo}.`);
        return cupon;
      })
      .pipe(tap((cuponCreado) => this.cuponesCargados.update((cupones) => [cuponCreado, ...cupones])));
  }

  /** Guarda los cambios de un cupón existente (conserva sus usos). */
  actualizar(cupon: Cupon): Observable<Cupon> {
    return this.api
      .reemplazar<Cupon>(`/cupones/${cupon.codigo}`, cupon, () => {
        if (!this.buscar(cupon.codigo)) throw new Error(`No existe el cupón ${cupon.codigo}.`);
        return cupon;
      })
      .pipe(
        tap((cuponActualizado) =>
          this.cuponesCargados.update((cupones) =>
            cupones.map((cupon) => (cupon.codigo === cuponActualizado.codigo ? cuponActualizado : cupon)),
          ),
        ),
      );
  }

  /** Cupón personal de importe fijo generado a petición de CineTown. */
  generarParaSolicitud(solicitud: SolicitudCineTown): Observable<Cupon> {
    return this.crear({
      codigo: solicitud.codigo.trim().toUpperCase(),
      tipo: 'fijo',
      valor: solicitud.descuentoFijo,
      descripcion: `${solicitud.descuentoFijo} € · CineTown · ${solicitud.email}`,
      desde: solicitud.desde,
      hasta: solicitud.hasta,
      usos: 0,
      usosMax: solicitud.usosMax,
      minimoCompra: solicitud.minimoCompra,
      email: solicitud.email,
      activo: true,
    });
  }
}
