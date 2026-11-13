import { Producto } from './producto';

export type EstadoPedido = 'pendiente' | 'en_preparacion' | 'listo' | 'entregado' | 'cancelado';

export const FLUJO_PEDIDO: EstadoPedido[] = ['pendiente', 'en_preparacion', 'listo', 'entregado'];

export const ETIQUETA_ESTADO: Record<EstadoPedido, string> = {
  pendiente: 'Pendiente',
  en_preparacion: 'En preparación',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

/** Línea del carrito: el precio queda fijado al añadirla. */
export interface LineaPedido {
  producto: Producto;
  cantidad: number;
  /** Personalización libre: tipo de leche, temperatura… */
  opciones: string[];
  precioUnitario: number;
}

export type TipoDescuento = 'cupon' | 'socio';

export interface DescuentoAplicado {
  tipo: TipoDescuento;
  etiqueta: string;
  importe: number;
}

/** Pedido tal como se muestra en pantalla (se construye a partir de `PedidoApi`). */
export interface Pedido {
  id: string;
  clienteId: string;
  /** Referencia corta para mostrar (primeros caracteres del UUID). */
  codigo: string;
  /** Turno del día para llamar al cliente, p. ej. «Turno 11» (RN-09). */
  turno: string;
  numeroTurno: number;
  fecha: string;
  lineas: { productoId: string; nombre: string; cantidad: number; precioUnitario: number }[];
  subtotal: number;
  descuento?: DescuentoAplicado;
  total: number;
  baseImponible: number;
  cuotaIva: number;
  estado: EstadoPedido;
}

export const MAX_LINEAS = 15;
export const MAX_UNIDADES_LINEA = 20;
