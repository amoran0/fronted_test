import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MetricasDia, RankingProducto, VentaFranja } from '../models/informe';
import { ServicioApi } from './servicio-api';
import { franjasSimuladas, metricasSimuladas, rankingSimulado } from './datos-simulados';

/** Los informes solo cuentan pedidos en estado ENTREGADO. Las fechas viajan como parámetros de la URL. */
@Injectable({ providedIn: 'root' })
export class ServicioInformes {
  private readonly api = inject(ServicioApi);

  metricas(fecha: string): Observable<MetricasDia> {
    return this.api.obtener('/informes/metricas', () => metricasSimuladas(fecha), { fecha });
  }

  ventasPorFranja(fecha: string): Observable<VentaFranja[]> {
    return this.api.obtener('/informes/franjas', () => franjasSimuladas(fecha), { fecha });
  }

  ranking(desde: string, hasta: string): Observable<RankingProducto[]> {
    return this.api.obtener('/informes/ranking', () => rankingSimulado(desde, hasta), {
      desde,
      hasta,
    });
  }
}
