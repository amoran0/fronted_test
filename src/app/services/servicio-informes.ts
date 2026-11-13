import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ProductoTopApi, VentaFranjaApi, VentasDiaApi } from '../models/api';
import { MetricasDia, RankingProducto, VentaFranja } from '../models/informe';
import { ServicioApi } from './servicio-api';
import { ServicioProductos } from './servicio-productos';
import { fechaHoyIso } from '../utils/formato';
import { redondear } from '../utils/calculos';

/** Productos que se piden para el ranking. */
const LIMITE_RANKING = 10;

/** Los informes solo cuentan pedidos en estado ENTREGADO (RN-10). Las fechas viajan en la URL. */
@Injectable({ providedIn: 'root' })
export class ServicioInformes {
  private readonly api = inject(ServicioApi);
  private readonly servicioProductos = inject(ServicioProductos);

  /**
   * Métricas del día: `GET /informes/ventas-dia` del día pedido y del anterior en paralelo,
   * para calcular la variación. El ticket medio se deriva de total / nº de pedidos.
   */
  metricas(fecha: string): Observable<MetricasDia> {
    const dia = new Date(fecha + 'T12:00');
    const ayer = fechaHoyIso(new Date(dia.getTime() - 86400000));
    return forkJoin({
      hoy: this.api.obtener<VentasDiaApi>('/informes/ventas-dia', { fecha }),
      ayer: this.api.obtener<VentasDiaApi>('/informes/ventas-dia', { fecha: ayer }),
    }).pipe(
      map(({ hoy, ayer: diaAnterior }) => {
        const ticketMedio = hoy.numeroPedidos ? redondear(hoy.total / hoy.numeroPedidos) : 0;
        const ticketAnterior = diaAnterior.numeroPedidos
          ? redondear(diaAnterior.total / diaAnterior.numeroPedidos)
          : 0;
        return {
          fecha,
          ventas: hoy.total,
          pedidos: hoy.numeroPedidos,
          variacionPedidosAyer: hoy.numeroPedidos - diaAnterior.numeroPedidos,
          ticketMedio,
          variacionTicketAyer: redondear(ticketMedio - ticketAnterior),
          descuentos: hoy.descuentos ?? 0,
        };
      }),
    );
  }

  /** `GET /informes/ventas-franja?fecha=` → una barra por hora. */
  ventasPorFranja(fecha: string): Observable<VentaFranja[]> {
    return this.api.obtener<VentaFranjaApi[]>('/informes/ventas-franja', { fecha }).pipe(
      map((franjas) =>
        franjas.map((franja) => ({
          hora: `${String(franja.hora).padStart(2, '0')} h`,
          importe: franja.total,
        })),
      ),
    );
  }

  /** `GET /informes/productos-top`. La categoría se completa con el catálogo cargado. */
  ranking(desde: string, hasta: string): Observable<RankingProducto[]> {
    return this.api
      .obtener<ProductoTopApi[]>('/informes/productos-top', { desde, hasta, limite: LIMITE_RANKING })
      .pipe(
        map((productosTop) =>
          productosTop.map((productoTop, indice) => {
            const producto = this.servicioProductos.porId(productoTop.productoId);
            return {
              posicion: indice + 1,
              nombre: productoTop.nombre,
              categoria: producto ? this.servicioProductos.nombreCategoria(producto.categoriaId) : '—',
              unidades: productoTop.unidadesVendidas,
              importe: productoTop.totalVendido,
            };
          }),
        ),
      );
  }
}
