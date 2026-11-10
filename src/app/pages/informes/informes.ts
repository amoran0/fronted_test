import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Icono } from '../../components/icono/icono';
import { TarjetaIndicador } from '../../components/tarjeta-indicador/tarjeta-indicador';
import { CabeceraPagina } from '../../components/cabecera-pagina/cabecera-pagina';
import { MetricasDia, RankingProducto, VentaFranja } from '../../models/informe';
import { ServicioInformes } from '../../services/servicio-informes';
import { porcentaje } from '../../utils/calculos';
import { PipeEuro } from '../../utils/pipe-euro';
import { formatearEuros, formatearFecha, fechaHoyIso } from '../../utils/formato';

@Component({
  selector: 'app-pagina-informes',
  imports: [CabeceraPagina, TarjetaIndicador, Icono, PipeEuro],
  templateUrl: './informes.html',
  styleUrl: './informes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaInformes {
  private readonly servicioInformes = inject(ServicioInformes);
  protected readonly formatearEuros = formatearEuros;
  protected readonly formatearFecha = formatearFecha;

  // Filtros (el valor del input se aplica al pulsar "Aplicar")
  protected readonly diaSeleccionado = signal(fechaHoyIso());
  protected readonly rangoDesde = signal(fechaHoyIso(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  protected readonly rangoHasta = signal(fechaHoyIso());

  protected readonly metricas = signal<MetricasDia | null>(null);
  protected readonly ventasPorFranja = signal<VentaFranja[]>([]);
  protected readonly rankingProductos = signal<RankingProducto[]>([]);

  /** Valores máximos para escalar las barras del gráfico y del ranking. */
  protected readonly importeMaximoFranja = computed(() =>
    Math.max(1, ...this.ventasPorFranja().map((franja) => franja.importe)),
  );
  protected readonly unidadesMaximasRanking = computed(() =>
    Math.max(1, ...this.rankingProductos().map((productoRanking) => productoRanking.unidades)),
  );
  protected readonly porcentajeDescuentos = computed(() => {
    const metricasDia = this.metricas();
    return metricasDia ? porcentaje(metricasDia.descuentos, metricasDia.ventas) : 0;
  });

  constructor() {
    this.aplicarDia(this.diaSeleccionado());
    this.aplicarRango(this.rangoDesde(), this.rangoHasta());
  }

  protected aplicarDia(fecha: string): void {
    this.diaSeleccionado.set(fecha);
    this.servicioInformes.metricas(fecha).subscribe((metricasRecibidas) => this.metricas.set(metricasRecibidas));
    this.servicioInformes.ventasPorFranja(fecha).subscribe((franjasRecibidas) => this.ventasPorFranja.set(franjasRecibidas));
  }

  protected aplicarRango(desde: string, hasta: string): void {
    if (hasta < desde) [desde, hasta] = [hasta, desde];
    this.rangoDesde.set(desde);
    this.rangoHasta.set(hasta);
    this.servicioInformes.ranking(desde, hasta).subscribe((rankingRecibido) => this.rankingProductos.set(rankingRecibido));
  }
}
