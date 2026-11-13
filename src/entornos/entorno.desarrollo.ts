/** Configuración de desarrollo (`ng serve`). */
export const entorno = {
  produccion: false,
  /** API de Spring Boot (DWES). Apache ocupa el 8080, por eso la API va en el 8081. */
  urlApi: 'http://localhost:8081/api/v1',
  /**
   * `true`: las peticiones HTTP las responde el servidor simulado de `src/app/simulacion`
   * (mismas rutas y mismo JSON que la API real). `false`: van a la API real.
   */
  usarDatosSimulados: true,
  /** Cuentas del script SQL de la BD, mostradas como accesos rápidos en «Acceder». */
  cuentasDemostracion: [
    { rol: 'admin', nombre: 'Gerencia', email: 'gerencia@cafeteria.com', contrasena: 'admin123' },
    { rol: 'barista', nombre: 'Marcos (barista)', email: 'marcos.barista@cafeteria.com', contrasena: 'hash_pass_barista1' },
    { rol: 'cliente', nombre: 'Carlos Gómez', email: 'carlos.gomez@gmail.com', contrasena: 'hash_pass_123' },
  ],
};
