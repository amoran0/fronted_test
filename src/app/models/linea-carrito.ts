import { LineaPedido, MAX_UNIDADES_LINEA } from './pedido';
import { Producto } from './producto';
import { redondear } from '../utils/calculos';

/**
 * Línea del carrito con comportamiento propio.
 * El precio unitario queda fijado al añadir el producto; el producto se mantiene
 * actualizado para saber en todo momento si se puede cobrar.
 */
export class LineaCarrito implements LineaPedido {
  readonly cantidad: number;

  constructor(
    readonly producto: Producto,
    cantidad: number,
    readonly opciones: string[],
    readonly precioUnitario: number,
  ) {
    this.cantidad = LineaCarrito.limitarCantidad(cantidad);
  }

  /** Ajusta una cantidad al rango permitido (1 – MAX_UNIDADES_LINEA). */
  static limitarCantidad(cantidad: number): number {
    return Math.min(MAX_UNIDADES_LINEA, Math.max(1, Math.trunc(cantidad) || 1));
  }

  /** Importe de la línea (cantidad × precio unitario). */
  get total(): number {
    return redondear(this.cantidad * this.precioUnitario);
  }

  /** Solo se cobran los productos disponibles; los agotados o retirados bloquean el pedido. */
  get esCobrable(): boolean {
    return this.producto.estado === 'disponible';
  }

  /** Clave que identifica producto + opciones (dos líneas iguales se agrupan en una). */
  get clave(): string {
    return `${this.producto.id}|${this.opciones.join('|')}`;
  }

  /** Texto de las opciones elegidas o «Sin cambios». */
  get descripcionOpciones(): string {
    return this.opciones.length ? this.opciones.join(' · ') : 'Sin cambios';
  }

  /**
   * Línea tal como la espera `POST /pedidos`: solo producto y cantidad.
   * El precio lo fija el servidor con el vigente (RN-03) y agrupa las líneas del mismo producto (RN-04).
   * Las opciones (tipo de leche…) son orientativas para el barista y no se envían a la API.
   */
  aLineaDePedido(): { productoId: string; cantidad: number } {
    return { productoId: this.producto.id, cantidad: this.cantidad };
  }
}
