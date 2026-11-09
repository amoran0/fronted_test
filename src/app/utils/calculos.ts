import { DescuentoAplicado, LineaPedido } from '../models/pedido';

export const IVA_HOSTELERIA = 0.1;

/** Redondea a céntimos evitando errores de coma flotante. */
export function redondear(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export function totalLinea(linea: Pick<LineaPedido, 'cantidad' | 'precioUnitario'>): number {
  return redondear(linea.cantidad * linea.precioUnitario);
}

export function calcularSubtotal(lineas: Pick<LineaPedido, 'cantidad' | 'precioUnitario'>[]): number {
  return redondear(lineas.reduce((acc, l) => acc + totalLinea(l), 0));
}

/** Los precios llevan IVA incluido: se separa la base imponible y la cuota. */
export function desglosarIva(totalConIva: number, tipo = IVA_HOSTELERIA) {
  const base = redondear(totalConIva / (1 + tipo));
  return { base, iva: redondear(totalConIva - base) };
}

export function descuentoPorcentaje(subtotal: number, porcentaje: number): number {
  return redondear((subtotal * porcentaje) / 100);
}

/**
 * Regla de negocio: cupón y socio no se suman; se aplica solo la ventaja mayor
 * y el descuento nunca supera el subtotal (el total nunca es negativo).
 */
export function mejorDescuento(
  subtotal: number,
  candidatos: (DescuentoAplicado | null | undefined)[],
): DescuentoAplicado | null {
  const validos = candidatos.filter((c): c is DescuentoAplicado => !!c && c.importe > 0);
  if (!validos.length) return null;
  const mejor = validos.reduce((a, b) => (b.importe > a.importe ? b : a));
  return { ...mejor, importe: Math.min(redondear(mejor.importe), subtotal) };
}

export function calcularTotal(subtotal: number, descuento: DescuentoAplicado | null): number {
  return redondear(Math.max(0, subtotal - (descuento?.importe ?? 0)));
}

/** Tanto por ciento redondeado a 1 decimal. */
export function porcentaje(parte: number, total: number): number {
  return total ? Math.round((parte / total) * 1000) / 10 : 0;
}
