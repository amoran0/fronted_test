export type EstadoCupon = 'activo' | 'personal' | 'caducado' | 'agotado' | 'inactivo';

export interface Cupon {
  codigo: string;
  /** `porcentaje` (10 = 10 %) o `fijo` en euros. */
  tipo: 'porcentaje' | 'fijo';
  valor: number;
  descripcion: string;
  desde: string;
  hasta: string | null;
  usos: number;
  usosMax: number;
  minimoCompra: number;
  /** Si tiene email, solo puede usarlo ese cliente. */
  email?: string;
  activo: boolean;
}

export interface ResultadoValidacion {
  valido: boolean;
  motivo?: string;
  descuento?: number;
}

export interface SolicitudCineTown {
  referencia: string;
  recibida: string;
  codigo: string;
  descuentoFijo: number;
  desde: string;
  hasta: string;
  usosMax: number;
  minimoCompra: number;
  email: string;
}
