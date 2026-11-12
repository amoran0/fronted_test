import { Cupon, ResultadoValidacion } from '../models/cupon';
import { crearDescuentoDeCupon } from '../models/descuento';
import { formatearEuros, formatearFecha } from './formato';

const LETRAS_DNI = 'TRWAGMYFPDXBNJZSQVHLCKE';

/** DNI español: 8 dígitos + letra de control. */
export function esDniValido(dni: string): boolean {
  const limpio = dni.trim().toUpperCase();
  const partesDni = /^(\d{8})([A-Z])$/.exec(limpio);
  if (!partesDni) return false;
  const [, numero, letra] = partesDni;
  return LETRAS_DNI[Number(numero) % 23] === letra;
}

/** Contraseña de registro: al menos 8 caracteres, con una letra y un número. */
export function esContrasenaSegura(contrasena: string): boolean {
  return contrasena.length >= 8 && /[a-zA-ZñÑ]/.test(contrasena) && /\d/.test(contrasena);
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
export function validarCupon(
  cupon: Cupon | undefined,
  contexto: ContextoCupon,
): ResultadoValidacion {
  if (!cupon) return { valido: false, motivo: 'El código no existe.' };
  const hoy = contexto.fecha ?? new Date();
  if (!cupon.activo) return { valido: false, motivo: `${cupon.codigo} está desactivado.` };
  if (new Date(cupon.desde) > hoy)
    return {
      valido: false,
      motivo: `${cupon.codigo} es válido desde el ${formatearFecha(cupon.desde)}.`,
    };
  if (cupon.hasta && finDelDia(cupon.hasta) < hoy)
    return {
      valido: false,
      motivo: `${cupon.codigo} venció el ${formatearFecha(cupon.hasta)}. Prueba otro código.`,
    };
  if (cupon.usos >= cupon.usosMax)
    return { valido: false, motivo: `${cupon.codigo} ya no tiene usos disponibles.` };
  if (contexto.subtotal < cupon.minimoCompra)
    return {
      valido: false,
      motivo: `Requiere una compra mínima de ${formatearEuros(cupon.minimoCompra)}.`,
    };
  if (cupon.email && cupon.email.toLowerCase() !== (contexto.email ?? '').toLowerCase())
    return { valido: false, motivo: 'Este cupón es personal y no corresponde a tu email.' };

  return { valido: true, descuento: crearDescuentoDeCupon(cupon).importePara(contexto.subtotal) };
}

function finDelDia(iso: string): Date {
  const fecha = new Date(iso);
  fecha.setHours(23, 59, 59, 999);
  return fecha;
}
