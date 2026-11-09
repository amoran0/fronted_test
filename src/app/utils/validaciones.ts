import { Cupon, ResultadoValidacion } from '../models/cupon';
import { descuentoPorcentaje, redondear } from './calculos';
import { formatEuro, formatFecha } from './formato';

const LETRAS_DNI = 'TRWAGMYFPDXBNJZSQVHLCKE';

/** DNI español: 8 dígitos + letra de control. */
export function esDniValido(dni: string): boolean {
  const limpio = dni.trim().toUpperCase();
  const m = /^(\d{8})([A-Z])$/.exec(limpio);
  if (!m) return false;
  return LETRAS_DNI[Number(m[1]) % 23] === m[2];
}

export function esEmailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/** Código de cupón: letras, números (y Ñ), entre 4 y 16 caracteres. */
export function esCodigoCuponValido(codigo: string): boolean {
  return /^[A-ZÑ0-9]{4,16}$/.test(codigo.trim().toUpperCase());
}

export interface ContextoCupon {
  subtotal: number;
  email?: string;
  fecha?: Date;
}

/** Comprueba existencia, estado, vigencia, usos, mínimo de compra y destinatario. */
export function validarCupon(cupon: Cupon | undefined, ctx: ContextoCupon): ResultadoValidacion {
  if (!cupon) return { valido: false, motivo: 'El código no existe.' };
  const hoy = ctx.fecha ?? new Date();
  if (!cupon.activo) return { valido: false, motivo: `${cupon.codigo} está desactivado.` };
  if (new Date(cupon.desde) > hoy)
    return { valido: false, motivo: `${cupon.codigo} es válido desde el ${formatFecha(cupon.desde)}.` };
  if (cupon.hasta && finDelDia(cupon.hasta) < hoy)
    return { valido: false, motivo: `${cupon.codigo} venció el ${formatFecha(cupon.hasta)}. Prueba otro código.` };
  if (cupon.usos >= cupon.usosMax) return { valido: false, motivo: `${cupon.codigo} ya no tiene usos disponibles.` };
  if (ctx.subtotal < cupon.minimoCompra)
    return { valido: false, motivo: `Requiere una compra mínima de ${formatEuro(cupon.minimoCompra)}.` };
  if (cupon.email && cupon.email.toLowerCase() !== (ctx.email ?? '').toLowerCase())
    return { valido: false, motivo: 'Este cupón es personal y no corresponde a tu email.' };

  const descuento =
    cupon.tipo === 'porcentaje' ? descuentoPorcentaje(ctx.subtotal, cupon.valor) : redondear(cupon.valor);
  return { valido: true, descuento: Math.min(descuento, ctx.subtotal) };
}

function finDelDia(iso: string): Date {
  const d = new Date(iso);
  d.setHours(23, 59, 59, 999);
  return d;
}
