/** Los cuatro roles de la aplicación. `publico` es el visitante sin sesión. */
export type Rol = 'publico' | 'cliente' | 'barista' | 'admin';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Exclude<Rol, 'publico'>;
  /** DNI de socio FitZone, si el cliente lo tiene asociado. */
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
}
