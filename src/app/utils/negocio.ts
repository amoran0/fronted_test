/** Datos del negocio mostrados en el pie y la barra lateral. Sustituir por los reales. */
export const NEGOCIO = {
  nombre: 'The Coffee Room',
  lema: 'Café de especialidad',
  local: 'CoffeeStation Centro',
  direccion: 'C/ Mayor 12, 41001 Sevilla',
  telefono: '+34 954 000 000',
  email: 'hola@thecoffeeroom.es',
  apertura: { desde: '08:00', hasta: '20:30' },
} as const;

/** ¿Está abierto ahora mismo? */
export function estaAbierto(ahora = new Date()): boolean {
  const min = ahora.getHours() * 60 + ahora.getMinutes();
  const [hd, md] = NEGOCIO.apertura.desde.split(':').map(Number);
  const [hh, mh] = NEGOCIO.apertura.hasta.split(':').map(Number);
  return min >= hd * 60 + md && min < hh * 60 + mh;
}
