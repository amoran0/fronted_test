import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { DescuentoAplicado, LineaPedido, MAX_LINEAS, MAX_UNIDADES_LINEA } from '../models/pedido';
import { Producto } from '../models/producto';
import { calcularSubtotal, calcularTotal, descuentoPorcentaje, desglosarIva, mejorDescuento } from '../utils/calculos';
import { esDniValido } from '../utils/validaciones';
import { AuthService } from './auth.service';
import { CuponService } from './cupon.service';
import { ProductoService } from './producto.service';

interface LineaGuardada {
  productoId: string;
  cantidad: number;
  opciones: string[];
  precioUnitario: number;
}

const CLAVE = 'tcr.carrito';
const DESCUENTO_SOCIO = 10;

/** Carrito del cliente y descuentos del paso de confirmación. */
@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly productos = inject(ProductoService);
  private readonly cupones = inject(CuponService);
  private readonly auth = inject(AuthService);

  private readonly guardadas = signal<LineaGuardada[]>(this.leer());

  /** Líneas con el producto actualizado (para detectar agotados en tiempo real). */
  readonly lineas = computed<LineaPedido[]>(() =>
    this.guardadas().flatMap((l) => {
      const producto = this.productos.porId(l.productoId);
      return producto ? [{ producto, cantidad: l.cantidad, opciones: l.opciones, precioUnitario: l.precioUnitario }] : [];
    }),
  );
  readonly validas = computed(() => this.lineas().filter((l) => l.producto.estado === 'disponible'));
  readonly invalidas = computed(() => this.lineas().filter((l) => l.producto.estado !== 'disponible'));
  readonly unidades = computed(() => this.lineas().reduce((a, l) => a + l.cantidad, 0));
  readonly subtotal = computed(() => calcularSubtotal(this.validas()));
  readonly puedeContinuar = computed(() => this.validas().length > 0 && this.invalidas().length === 0);

  /** Código de cupón aplicado (se revalida si cambia el subtotal). */
  readonly codigoCupon = signal<string | null>(null);
  readonly dniSocio = signal<string | null>(null);

  readonly descuentoCupon = computed<DescuentoAplicado | null>(() => {
    const codigo = this.codigoCupon();
    if (!codigo) return null;
    const r = this.cupones.validar(codigo, { subtotal: this.subtotal(), email: this.auth.usuario()?.email });
    return r.valido ? { tipo: 'cupon', etiqueta: `Cupón ${codigo}`, importe: r.descuento! } : null;
  });

  readonly descuentoSocio = computed<DescuentoAplicado | null>(() =>
    this.dniSocio()
      ? { tipo: 'socio', etiqueta: `Socio FitZone · ${DESCUENTO_SOCIO} %`, importe: descuentoPorcentaje(this.subtotal(), DESCUENTO_SOCIO) }
      : null,
  );

  readonly descuento = computed(() => mejorDescuento(this.subtotal(), [this.descuentoCupon(), this.descuentoSocio()]));
  readonly total = computed(() => calcularTotal(this.subtotal(), this.descuento()));
  readonly desglose = computed(() => desglosarIva(this.total()));

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(CLAVE, JSON.stringify(this.guardadas()));
      } catch {
        /* sin almacenamiento */
      }
    });
  }

  /** Devuelve `false` si se alcanzó el máximo de líneas. */
  anadir(producto: Producto, opciones: string[] = []): boolean {
    const lista = this.guardadas();
    const clave = opciones.join('|');
    const i = lista.findIndex((l) => l.productoId === producto.id && l.opciones.join('|') === clave);
    if (i >= 0) {
      this.cambiarCantidad(i, lista[i].cantidad + 1);
      return true;
    }
    if (lista.length >= MAX_LINEAS) return false;
    this.guardadas.set([...lista, { productoId: producto.id, cantidad: 1, opciones, precioUnitario: producto.precio }]);
    return true;
  }

  cambiarCantidad(indice: number, cantidad: number): void {
    const c = Math.min(MAX_UNIDADES_LINEA, Math.max(1, cantidad));
    this.guardadas.update((l) => l.map((x, i) => (i === indice ? { ...x, cantidad: c } : x)));
  }

  quitar(indice: number): void {
    this.guardadas.update((l) => l.filter((_, i) => i !== indice));
  }

  quitarInvalidas(): void {
    const ids = new Set(this.invalidas().map((l) => l.producto.id));
    this.guardadas.update((l) => l.filter((x) => !ids.has(x.productoId)));
  }

  validarSocio(dni: string): boolean {
    const ok = esDniValido(dni);
    this.dniSocio.set(ok ? dni.trim().toUpperCase() : null);
    return ok;
  }

  vaciar(): void {
    this.guardadas.set([]);
    this.codigoCupon.set(null);
    this.dniSocio.set(null);
  }

  private leer(): LineaGuardada[] {
    try {
      const raw = localStorage.getItem(CLAVE);
      if (raw) return JSON.parse(raw);
    } catch {
      /* sin almacenamiento */
    }
    // Carrito de demostración que reproduce el mockup.
    return [
      { productoId: 'flat-white', cantidad: 2, opciones: ['Leche de avena', 'Extra caliente'], precioUnitario: 3.2 },
      { productoId: 'tostada-aguacate', cantidad: 1, opciones: ['Sin cambios'], precioUnitario: 6.9 },
      { productoId: 'fitzone-proteina', cantidad: 1, opciones: ['Sabor vainilla'], precioUnitario: 5.9 },
    ];
  }
}
