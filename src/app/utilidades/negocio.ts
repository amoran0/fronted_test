/** Datos del negocio mostrados en el pie y la barra lateral. Sustituir por los reales. */
export const NEGOCIO = {
  nombre: 'The Coffee Room',
  lema: 'Café de especialidad',
  local: 'CoffeeStation Centro',
  direccion: 'C/ Mayor 12, 41001 Sevilla',
  ciudad: 'Sevilla',
  telefono: '+34 954 000 000',
  email: 'hola@thecoffeeroom.es',
  apertura: { desde: '08:00', hasta: '20:30' },
} as const;

/** ¿Está abierto ahora mismo? */
export function estaAbierto(ahora = new Date()): boolean {
  const aMinutos = (hora: string) => {
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
  };
  const minutoActual = ahora.getHours() * 60 + ahora.getMinutes();
  return minutoActual >= aMinutos(NEGOCIO.apertura.desde) && minutoActual < aMinutos(NEGOCIO.apertura.hasta);
}
