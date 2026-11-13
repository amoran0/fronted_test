import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { CuponApi, ValidacionCuponApi, ValidacionCuponPeticionApi } from '../models/api';
import { Cupon, EstadoCupon, SolicitudCineTown } from '../models/cupon';
import { ServicioApi } from './servicio-api';
import { ServicioAutenticacion } from './servicio-autenticacion';
import { cuponAPeticion, describirCupon, mapearCupon } from '../utils/mapeadores';

@Injectable({ providedIn: 'root' })
export class ServicioCupones {
  private readonly api = inject(ServicioApi);
  private readonly autenticacion = inject(ServicioAutenticacion);
  private readonly cuponesCargados = signal<Cupon[]>([]);
  readonly cupones = this.cuponesCargados.asReadonly();
  readonly error = signal<string | null>(null);

  /** Cupones vigentes: activos o personales. */
  private readonly vigentes = computed(() =>
    this.cuponesCargados().filter((cupon) => ['activo', 'personal'].includes(this.estado(cupon))),
  );
  readonly activos = computed(() => this.vigentes().length);
  /** Usos de los cupones vigentes (pedidos no cancelados que los aplican). */
  readonly canjes = computed(() =>
    this.vigentes().reduce((totalCanjes, cupon) => totalCanjes + cupon.usos, 0),
  );
  readonly personales = computed(
    () => this.vigentes().filter((cupon) => this.estado(cupon) === 'personal').length,
  );

  constructor() {
    // El listado completo (`GET /cupones`) solo lo puede pedir el admin.
    effect(() => {
      if (this.autenticacion.rol() === 'admin') untracked(() => this.cargar());
      else untracked(() => this.cuponesCargados.set([]));
    });
  }

  cargar(): void {
    this.api.obtener<CuponApi[]>('/cupones').subscribe({
      next: (cuponesRecibidos) => {
        this.cuponesCargados.set(cuponesRecibidos.map(mapearCupon));
        this.error.set(null);
      },
      error: (errorCarga: Error) => this.error.set(errorCarga.message),
    });
  }

  buscar(codigo: string): Cupon | undefined {
    const codigoNormalizado = codigo.trim().toUpperCase();
    return this.cuponesCargados().find((cupon) => cupon.codigo === codigoNormalizado);
  }

  /**
   * Valida un código para un subtotal (`POST /cupones/validar`). La comprobación la hace el
   * servidor (RN-06): existencia, activo, vigencia, usos, importe mínimo y email si es personal.
   * Si no es válido, el observable emite el error con el motivo (`detail` del 404 / 422).
   */
  validar(codigo: string, subtotal: number, email?: string | null): Observable<ValidacionCuponApi> {
    const cuerpo: ValidacionCuponPeticionApi = {
      codigo: codigo.trim().toUpperCase(),
      subtotal,
      email: email || null,
    };
    return this.api.crear<ValidacionCuponApi>('/cupones/validar', cuerpo);
  }

  estado(cupon: Cupon, hoy = new Date()): EstadoCupon {
    if (!cupon.activo) return 'inactivo';
    if (cupon.hasta && new Date(cupon.hasta + 'T23:59:59') < hoy) return 'caducado';
    if (cupon.usosMax && cupon.usos >= cupon.usosMax) return 'agotado';
    return cupon.email ? 'personal' : 'activo';
  }

  /** `POST /cupones`. El código repetido lo rechaza la API con un 409. */
  crear(cupon: Cupon): Observable<Cupon> {
    return this.api.crear<CuponApi>('/cupones', cuponAPeticion(cupon)).pipe(
      map(mapearCupon),
      tap((cuponCreado) => this.cuponesCargados.update((cupones) => [cuponCreado, ...cupones])),
    );
  }

  /** `PUT /cupones/{id}`: guarda los cambios (los usos los calcula la API). */
  actualizar(cupon: Cupon): Observable<Cupon> {
    return this.api.reemplazar<CuponApi>(`/cupones/${cupon.id}`, cuponAPeticion(cupon)).pipe(
      map((cuponApi) => ({ ...mapearCupon(cuponApi), usos: cupon.usos })),
      tap((cuponActualizado) =>
        this.cuponesCargados.update((cupones) =>
          cupones.map((cuponExistente) =>
            cuponExistente.id === cuponActualizado.id ? cuponActualizado : cuponExistente,
          ),
        ),
      ),
    );
  }

  /**
   * `DELETE /cupones/{id}`. La API solo lo permite si nunca se ha canjeado (409 en otro caso):
   * los cupones usados se desactivan para conservar el historial de pedidos.
   */
  eliminar(id: string): Observable<void> {
    return this.api
      .eliminar(`/cupones/${id}`)
      .pipe(
        tap(() =>
          this.cuponesCargados.update((cupones) => cupones.filter((cupon) => cupon.id !== id)),
        ),
      );
  }

  /** Cupón personal de importe fijo generado a petición de CineTown (se crea con `POST /cupones`). */
  generarParaSolicitud(solicitud: SolicitudCineTown): Observable<Cupon> {
    const cupon: Cupon = {
      id: '',
      codigo: solicitud.codigo.trim().toUpperCase(),
      tipo: 'fijo',
      valor: solicitud.descuentoFijo,
      descripcion: '',
      desde: solicitud.desde,
      hasta: solicitud.hasta,
      usos: 0,
      usosMax: solicitud.usosMax,
      minimoCompra: solicitud.minimoCompra,
      email: solicitud.email,
      activo: true,
    };
    return this.crear({ ...cupon, descripcion: describirCupon(cupon) });
  }
}
