import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MetricasDia, RankingProducto, VentaFranja } from '../models/informe';
import { ApiService } from './api.service';
import { mockFranjas, mockMetricas, mockRanking } from './mock-data';

/** Los informes solo cuentan pedidos en estado ENTREGADO. */
@Injectable({ providedIn: 'root' })
export class InformeService {
  private readonly api = inject(ApiService);

  metricas(fecha: string): Observable<MetricasDia> {
    return this.api.get(`/informes/metricas?fecha=${fecha}`, () => mockMetricas(fecha));
  }

  ventasPorFranja(fecha: string): Observable<VentaFranja[]> {
    return this.api.get(`/informes/franjas?fecha=${fecha}`, () => mockFranjas(fecha));
  }

  ranking(desde: string, hasta: string): Observable<RankingProducto[]> {
    return this.api.get(`/informes/ranking?desde=${desde}&hasta=${hasta}`, () => mockRanking(desde, hasta));
  }
}
