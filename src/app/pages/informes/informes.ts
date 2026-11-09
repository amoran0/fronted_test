import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Icon } from '../../components/icon/icon';
import { KpiCard } from '../../components/kpi-card/kpi-card';
import { PageHeader } from '../../components/page-header/page-header';
import { MetricasDia, RankingProducto, VentaFranja } from '../../models/informe';
import { InformeService } from '../../services/informe.service';
import { porcentaje } from '../../utils/calculos';
import { exportarCsv } from '../../utils/csv';
import { EuroPipe } from '../../utils/euro.pipe';
import { formatEuro, formatFecha, hoyIso } from '../../utils/formato';

@Component({
  selector: 'app-informes-page',
  imports: [PageHeader, KpiCard, Icon, EuroPipe],
  templateUrl: './informes.html',
  styleUrl: './informes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InformesPage {
  private readonly informes = inject(InformeService);
  protected readonly formatEuro = formatEuro;
  protected readonly formatFecha = formatFecha;

  // Filtros (el valor del input se aplica al pulsar "Aplicar")
  protected readonly dia = signal(hoyIso());
  protected readonly desde = signal(hoyIso(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  protected readonly hasta = signal(hoyIso());

  protected readonly metricas = signal<MetricasDia | null>(null);
  protected readonly franjas = signal<VentaFranja[]>([]);
  protected readonly ranking = signal<RankingProducto[]>([]);

  protected readonly maxFranja = computed(() => Math.max(1, ...this.franjas().map((f) => f.importe)));
  protected readonly maxRanking = computed(() => Math.max(1, ...this.ranking().map((r) => r.unidades)));
  protected readonly pctDescuento = computed(() => {
    const m = this.metricas();
    return m ? porcentaje(m.descuentos, m.ventas) : 0;
  });

  constructor() {
    this.aplicarDia(this.dia());
    this.aplicarRango(this.desde(), this.hasta());
  }

  protected aplicarDia(fecha: string): void {
    this.dia.set(fecha);
    this.informes.metricas(fecha).subscribe((m) => this.metricas.set(m));
    this.informes.ventasPorFranja(fecha).subscribe((f) => this.franjas.set(f));
  }

  protected aplicarRango(desde: string, hasta: string): void {
    if (hasta < desde) [desde, hasta] = [hasta, desde];
    this.desde.set(desde);
    this.hasta.set(hasta);
    this.informes.ranking(desde, hasta).subscribe((r) => this.ranking.set(r));
  }

  protected exportar(): void {
    const m = this.metricas();
    exportarCsv(`informe-${this.dia()}.csv`, [
      ['Informe de ventas', formatFecha(this.dia())],
      [],
      ['Métrica', 'Valor'],
      ['Ventas (€)', m?.ventas ?? 0],
      ['Pedidos', m?.pedidos ?? 0],
      ['Ticket medio (€)', m?.ticketMedio ?? 0],
      ['Descuentos (€)', m?.descuentos ?? 0],
      [],
      ['Franja', 'Ventas (€)'],
      ...this.franjas().map((f) => [f.hora, f.importe]),
      [],
      ['Posición', 'Producto', 'Categoría', 'Unidades', 'Importe (€)'],
      ...this.ranking().map((r) => [r.posicion, r.nombre, r.categoria, r.unidades, r.importe]),
    ]);
  }
}
