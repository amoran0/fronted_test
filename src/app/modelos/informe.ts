export interface MetricasDia {
  fecha: string;
  ventas: number;
  pedidos: number;
  variacionPedidosAyer: number;
  ticketMedio: number;
  variacionTicketAyer: number;
  descuentos: number;
}

export interface VentaFranja {
  hora: string;
  importe: number;
}

export interface RankingProducto {
  posicion: number;
  nombre: string;
  categoria: string;
  unidades: number;
  importe: number;
}
