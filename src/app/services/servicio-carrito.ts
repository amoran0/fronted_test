import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { MAX_LINEAS } from '../models/pedido';
import { Producto } from '../models/producto';
import {
  Descuento,
  DescuentoSocioFitZone,
  crearDescuentoDeCupon,
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

/** Carrito de demostración que reproduce el mockup. */
const CARRITO_DEMO: LineaGuardada[] = [
  {
    productoId: 'flat-white',
    cantidad: 2,
    opciones: ['Leche de avena', 'Extra caliente'],
    precioUnitario: 3.2,
  },
  { productoId: 'tostada-aguacate', cantidad: 1, opciones: ['Sin cambios'], precioUnitario: 6.9 },
  {
    productoId: 'fitzone-proteina',
    cantidad: 1,
    opciones: ['Sabor vainilla'],
    precioUnitario: 5.9,
  },
];

/** Carrito del cliente y descuentos del paso de confirmación. */
@Injectable({ providedIn: 'root' })
export class ServicioCarrito {
  private readonly servicioProductos = inject(ServicioProductos);
  private readonly servicioCupones = inject(ServicioCupones);
  private readonly autenticacion = inject(ServicioAutenticacion);

  private readonly lineasGuardadas = signal(
    leerJson<LineaGuardada[]>(CLAVE_CARRITO_GUARDADO) ?? CARRITO_DEMO,
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

  /** Código de cupón aplicado (se revalida si cambia el subtotal). */
  readonly codigoCupon = signal<string | null>(null);
  readonly dniSocio = signal<string | null>(null);

  /** Descuento del cupón (porcentaje o importe fijo, según el cupón) si sigue siendo válido. */
  readonly descuentoDeCupon = computed<Descuento | null>(() => {
    const codigo = this.codigoCupon();
    const cupon = codigo ? this.servicioCupones.buscar(codigo) : undefined;
    if (!cupon) return null;
    const { valido } = this.servicioCupones.validar(cupon.codigo, {
      subtotal: this.subtotal(),
      email: this.autenticacion.usuario()?.email,
    });
    return valido ? crearDescuentoDeCupon(cupon) : null;
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
    this.codigoCupon.set(null);
    this.dniSocio.set(null);
  }
}
