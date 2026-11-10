import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MetricasDia, RankingProducto, VentaFranja } from '../models/informe';
import { ServicioApi } from './servicio-api';
import { franjasSimuladas, metricasSimuladas, rankingSimulado } from './datos-simulados';

/** Los informes solo cuentan pedidos en estado ENTREGADO. */
@Injectable({ providedIn: 'root' })
export class ServicioInformes {
  private readonly api = inject(ServicioApi);

  metricas(fecha: string): Observable<MetricasDia> {
    return this.api.obtener(`/informes/metricas?fecha=${fecha}`, () => metricasSimuladas(fecha));
  }

  ventasPorFranja(fecha: string): Observable<VentaFranja[]> {
    return this.api.obtener(`/informes/franjas?fecha=${fecha}`, () => franjasSimuladas(fecha));
  }

  ranking(desde: string, hasta: string): Observable<RankingProducto[]> {
    return this.api.obtener(`/informes/ranking?desde=${desde}&hasta=${hasta}`, () => rankingSimulado(desde, hasta));
  }
}
