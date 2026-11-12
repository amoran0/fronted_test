import { DescuentoAplicado, LineaPedido } from '../models/pedido';

/** Tipo de IVA aplicado a los precios (21 %). */
export const TIPO_IVA = 0.21;

/** Redondea a céntimos evitando errores de coma flotante. */
export function redondear(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export function totalLinea(linea: Pick<LineaPedido, 'cantidad' | 'precioUnitario'>): number {
  return redondear(linea.cantidad * linea.precioUnitario);
}

export function calcularSubtotal(
  lineas: Pick<LineaPedido, 'cantidad' | 'precioUnitario'>[],
): number {
  return redondear(lineas.reduce((suma, linea) => suma + totalLinea(linea), 0));
}

/** Los precios llevan IVA incluido: se separa la base imponible y la cuota. */
export function desglosarIva(totalConIva: number, tipoIva = TIPO_IVA) {
  const base = redondear(totalConIva / (1 + tipoIva));
  return { base, iva: redondear(totalConIva - base) };
}

export function calcularTotal(subtotal: number, descuento: DescuentoAplicado | null): number {
  return redondear(Math.max(0, subtotal - (descuento?.importe ?? 0)));
}

/** Tanto por ciento redondeado a 1 decimal. */
export function porcentaje(parte: number, total: number): number {
  return total ? Math.round((parte / total) * 1000) / 10 : 0;
}
