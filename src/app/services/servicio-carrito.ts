import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { DescuentoAplicado, LineaPedido, MAX_LINEAS, MAX_UNIDADES_LINEA } from '../models/pedido';
import { Producto } from '../models/producto';
import { calcularSubtotal, calcularTotal, descuentoPorcentaje, desglosarIva, mejorDescuento } from '../utils/calculos';
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
/** Porcentaje de descuento para socios del gimnasio FitZone. */
const PORCENTAJE_DESCUENTO_SOCIO = 10;

/** Carrito de demostración que reproduce el mockup. */
const CARRITO_DEMO: LineaGuardada[] = [
  { productoId: 'flat-white', cantidad: 2, opciones: ['Leche de avena', 'Extra caliente'], precioUnitario: 3.2 },
  { productoId: 'tostada-aguacate', cantidad: 1, opciones: ['Sin cambios'], precioUnitario: 6.9 },
  { productoId: 'fitzone-proteina', cantidad: 1, opciones: ['Sabor vainilla'], precioUnitario: 5.9 },
];

/** Carrito del cliente y descuentos del paso de confirmación. */
@Injectable({ providedIn: 'root' })
export class ServicioCarrito {
  private readonly servicioProductos = inject(ServicioProductos);
  private readonly servicioCupones = inject(ServicioCupones);
  private readonly autenticacion = inject(ServicioAutenticacion);

  private readonly lineasGuardadas = signal(leerJson<LineaGuardada[]>(CLAVE_CARRITO_GUARDADO) ?? CARRITO_DEMO);

  /** Líneas con el producto actualizado (para detectar agotados en tiempo real). */
  readonly lineas = computed<LineaPedido[]>(() =>
    this.lineasGuardadas().flatMap((lineaGuardada) => {
      const producto = this.servicioProductos.porId(lineaGuardada.productoId);
      if (!producto) return [];
      const { cantidad, opciones, precioUnitario } = lineaGuardada;
      return [{ producto, cantidad, opciones, precioUnitario }];
    }),
  );
  /** Líneas de productos disponibles: son las que se cobran. */
  readonly validas = computed(() => this.lineas().filter((linea) => linea.producto.estado === 'disponible'));
  /** Líneas de productos agotados o retirados: impiden continuar. */
  readonly invalidas = computed(() => this.lineas().filter((linea) => linea.producto.estado !== 'disponible'));
  readonly unidades = computed(() => this.lineas().reduce((totalUnidades, linea) => totalUnidades + linea.cantidad, 0));
  readonly subtotal = computed(() => calcularSubtotal(this.validas()));
  readonly puedeContinuar = computed(() => this.validas().length > 0 && this.invalidas().length === 0);

  /** Código de cupón aplicado (se revalida si cambia el subtotal). */
  readonly codigoCupon = signal<string | null>(null);
  readonly dniSocio = signal<string | null>(null);

  readonly descuentoCupon = computed<DescuentoAplicado | null>(() => {
    const codigo = this.codigoCupon();
    if (!codigo) return null;
    const resultado = this.servicioCupones.validar(codigo, {
      subtotal: this.subtotal(),
      email: this.autenticacion.usuario()?.email,
    });
    return resultado.valido ? { tipo: 'cupon', etiqueta: `Cupón ${codigo}`, importe: resultado.descuento! } : null;
  });

  readonly descuentoSocio = computed<DescuentoAplicado | null>(() =>
    this.dniSocio()
      ? {
          tipo: 'socio',
          etiqueta: `Socio FitZone · ${PORCENTAJE_DESCUENTO_SOCIO} %`,
          importe: descuentoPorcentaje(this.subtotal(), PORCENTAJE_DESCUENTO_SOCIO),
        }
      : null,
  );

  readonly descuento = computed(() => mejorDescuento(this.subtotal(), [this.descuentoCupon(), this.descuentoSocio()]));
  readonly total = computed(() => calcularTotal(this.subtotal(), this.descuento()));
  readonly desglose = computed(() => desglosarIva(this.total()));

  constructor() {
    effect(() => guardarJson(CLAVE_CARRITO_GUARDADO, this.lineasGuardadas()));
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
    const lineaNueva = { productoId: producto.id, cantidad: 1, opciones, precioUnitario: producto.precio };
    this.lineasGuardadas.set([...lineasActuales, lineaNueva]);
    return true;
  }

  cambiarCantidad(indiceLinea: number, cantidad: number): void {
    const cantidadLimitada = Math.min(MAX_UNIDADES_LINEA, Math.max(1, cantidad));
    this.lineasGuardadas.update((lineas) =>
      lineas.map((linea, indice) => (indice === indiceLinea ? { ...linea, cantidad: cantidadLimitada } : linea)),
    );
  }

  quitar(indiceLinea: number): void {
    this.lineasGuardadas.update((lineas) => lineas.filter((_linea, indice) => indice !== indiceLinea));
  }

  quitarInvalidas(): void {
    const idsInvalidos = new Set(this.invalidas().map((linea) => linea.producto.id));
    this.lineasGuardadas.update((lineas) => lineas.filter((linea) => !idsInvalidos.has(linea.productoId)));
  }

  validarSocio(dni: string): boolean {
    const dniEsValido = esDniValido(dni);
    this.dniSocio.set(dniEsValido ? dni.trim().toUpperCase() : null);
    return dniEsValido;
  }

  vaciar(): void {
    this.lineasGuardadas.set([]);
    this.codigoCupon.set(null);
    this.dniSocio.set(null);
  }
}
