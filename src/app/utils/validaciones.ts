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

// La validación de cupones (RN-06) la hace el servidor: ver `ServicioCupones.validar`.
