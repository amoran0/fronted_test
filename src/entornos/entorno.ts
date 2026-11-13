/** Configuración de producción (`ng build`). */
export const entorno = {
  produccion: true,
  urlApi: 'https://api.thecoffeeroom.es/api/v1',
  /** En producción siempre contra la API real. */
  usarDatosSimulados: false,
  cuentasDemostracion: [] as { rol: string; nombre: string; email: string; contrasena: string }[],
};
