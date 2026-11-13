import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { MAX_LINEAS } from '../models/pedido';
import { Producto } from '../models/producto';
import {
  Descuento,
  DescuentoImporteFijo,
  DescuentoSocioFitZone,
  elegirMejorDescuento,
} from '../models/descuento';
import { LineaCarrito } from '../models/linea-carrito';
import { calcularSubtotal, calcularTotal, desglosarIva } from '../utils/calculos';
import { guardarJson, leerJson } from '../utils/almacen';
import { esDniValido } from '../utils/validaciones';
import { ServicioAutenticacion } from './servicio-autenticacion';
import { ServicioCupones } from './servicio-cupones';
import { ServicioProductos } from './servicio-productos';

interface LineaGuardada {
  productoId: string;
  cantidad: number;
  opciones: string[];
  precioUnitario: number;
}

/** Clave de localStorage donde se guarda el carrito. */
const CLAVE_CARRITO_GUARDADO = 'tcr.carrito';

/** Resultado de `POST /cupones/validar` para un subtotal concreto. */
interface CuponValidado {
  codigo: string;
  subtotal: number;
  descuento: number;
}

/**
 * Carrito del cliente y descuentos del paso de confirmación.
 * Los importes que se ven aquí son una PREVISIÓN: el total definitivo lo calcula
 * la API al crear el pedido (RN-03, RN-05, RN-07) y es el que se guarda.
 */
@Injectable({ providedIn: 'root' })
export class ServicioCarrito {
  private readonly servicioProductos = inject(ServicioProductos);
  private readonly servicioCupones = inject(ServicioCupones);
  private readonly autenticacion = inject(ServicioAutenticacion);

  private readonly lineasGuardadas = signal(
    leerJson<LineaGuardada[]>(CLAVE_CARRITO_GUARDADO) ?? [],
  );

  /** Líneas con el producto actualizado (para detectar agotados en tiempo real). */
  readonly lineas = computed<LineaCarrito[]>(() =>
    this.lineasGuardadas().flatMap((lineaGuardada) => {
      const producto = this.servicioProductos.porId(lineaGuardada.productoId);
      if (!producto) return [];
      const { cantidad, opciones, precioUnitario } = lineaGuardada;
      return [new LineaCarrito(producto, cantidad, opciones, precioUnitario)];
    }),
  );
  /** Líneas de productos disponibles: son las que se cobran. */
  readonly validas = computed(() => this.lineas().filter((linea) => linea.esCobrable));
  /** Líneas de productos agotados o retirados: impiden continuar. */
  readonly invalidas = computed(() => this.lineas().filter((linea) => !linea.esCobrable));
  readonly unidades = computed(() =>
    this.lineas().reduce((totalUnidades, linea) => totalUnidades + linea.cantidad, 0),
  );
  readonly subtotal = computed(() => calcularSubtotal(this.validas()));
  readonly puedeContinuar = computed(
    () => this.validas().length > 0 && this.invalidas().length === 0,
  );

  /** Código de cupón aplicado (se revalida en el servidor si cambia el subtotal). */
  readonly codigoCupon = signal<string | null>(null);
  readonly dniSocio = signal<string | null>(null);
  /** Motivo por el que el cupón ha dejado de ser válido al cambiar el carrito. */
  readonly errorCupon = signal<string | null>(null);
  private readonly cuponValidado = signal<CuponValidado | null>(null);

  /** Descuento del cupón validado por la API, mientras el subtotal no cambie. */
  readonly descuentoDeCupon = computed<Descuento | null>(() => {
    const validado = this.cuponValidado();
    if (!validado || validado.subtotal !== this.subtotal()) return null;
    return new DescuentoImporteFijo(`Cupón ${validado.codigo}`, validado.descuento);
  });

  /** Descuento de socio FitZone, si se ha validado un DNI. */
  private readonly descuentoDeSocio = computed<Descuento | null>(() => {
    const dni = this.dniSocio();
    return dni ? new DescuentoSocioFitZone(dni) : null;
  });

  /** Se aplica solo la mayor de las ventajas: ambos objetos se comparan con el mismo método polimórfico. */
  readonly descuento = computed(() =>
    elegirMejorDescuento(this.subtotal(), [this.descuentoDeCupon(), this.descuentoDeSocio()]),
  );
  readonly total = computed(() => calcularTotal(this.subtotal(), this.descuento()));
  readonly desglose = computed(() => desglosarIva(this.total()));

  constructor() {
    effect(() => guardarJson(CLAVE_CARRITO_GUARDADO, this.lineasGuardadas()));
    // Si cambia el subtotal con un cupón aplicado, se vuelve a validar (p. ej. por el importe mínimo).
    effect(() => {
      const subtotal = this.subtotal();
      untracked(() => {
        const codigo = this.codigoCupon();
        if (!codigo || this.cuponValidado()?.subtotal === subtotal || !subtotal) return;
        this.aplicarCupon(codigo).subscribe({
          error: (errorCupon: Error) => this.errorCupon.set(errorCupon.message),
        });
      });
    });
  }

  /**
   * Valida el código en el servidor (`POST /cupones/validar`) con el subtotal actual.
   * Si es válido queda aplicado; si no, se quita y el observable emite el motivo.
   */
  aplicarCupon(codigo: string): Observable<number> {
    const codigoNormalizado = codigo.trim().toUpperCase();
    const subtotal = this.subtotal();
    return this.servicioCupones
      .validar(codigoNormalizado, subtotal, this.autenticacion.usuario()?.email)
      .pipe(
        tap({
          next: (validacion) => {
            this.codigoCupon.set(validacion.codigo);
            this.cuponValidado.set({ codigo: validacion.codigo, subtotal, descuento: validacion.descuento });
            this.errorCupon.set(null);
          },
          error: () => this.quitarCupon(),
        }),
        map((validacion) => validacion.descuento),
      );
  }

  quitarCupon(): void {
    this.codigoCupon.set(null);
    this.cuponValidado.set(null);
  }

  /** Devuelve `false` si se alcanzó el máximo de líneas. */
  anadir(producto: Producto, opciones: string[] = []): boolean {
    const lineasActuales = this.lineasGuardadas();
    const opcionesUnidas = opciones.join('|');
    const indiceExistente = lineasActuales.findIndex(
      (linea) => linea.productoId === producto.id && linea.opciones.join('|') === opcionesUnidas,
    );
    if (indiceExistente >= 0) {
      this.cambiarCantidad(indiceExistente, lineasActuales[indiceExistente].cantidad + 1);
      return true;
    }
    if (lineasActuales.length >= MAX_LINEAS) return false;
    const lineaNueva = {
      productoId: producto.id,
      cantidad: 1,
      opciones,
      precioUnitario: producto.precio,
    };
    this.lineasGuardadas.set([...lineasActuales, lineaNueva]);
    return true;
  }

  cambiarCantidad(indiceLinea: number, cantidad: number): void {
    const cantidadLimitada = LineaCarrito.limitarCantidad(cantidad);
    this.lineasGuardadas.update((lineas) =>
      lineas.map((linea, indice) =>
        indice === indiceLinea ? { ...linea, cantidad: cantidadLimitada } : linea,
      ),
    );
  }

  quitar(indiceLinea: number): void {
    this.lineasGuardadas.update((lineas) =>
      lineas.filter((_linea, indice) => indice !== indiceLinea),
    );
  }

  validarSocio(dni: string): boolean {
    const dniEsValido = esDniValido(dni);
    this.dniSocio.set(dniEsValido ? dni.trim().toUpperCase() : null);
    return dniEsValido;
  }

  vaciar(): void {
    this.lineasGuardadas.set([]);
    this.quitarCupon();
    this.dniSocio.set(null);
  }
}
