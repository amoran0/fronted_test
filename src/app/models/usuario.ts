/** Los cuatro roles de la aplicación. `publico` es el visitante sin sesión. */
export type Rol = 'publico' | 'cliente' | 'barista' | 'admin';

export interface Usuario {
  id: string;
  /** Id del cliente (solo rol cliente): es el que viaja en los pedidos. */
  clienteId: string | null;
  nombre: string;
  email: string;
  rol: Exclude<Rol, 'publico'>;
  /** DNI del cliente: se propone para comprobar si es socio FitZone. */
  dniSocio?: string;
}

export interface Sesion {
  token: string;
  usuario: Usuario;
}

export interface Credenciales {
  email: string;
  contrasena: string;
}

/** Datos que se envían para crear una cuenta de cliente. */
export interface DatosRegistro extends Credenciales {
  nombre: string;
  dni: string;
}
