import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { Aviso } from '../../components/aviso/aviso';
import { Icono } from '../../components/icono/icono';
import { TarjetaIndicador } from '../../components/tarjeta-indicador/tarjeta-indicador';
import { CabeceraPagina } from '../../components/cabecera-pagina/cabecera-pagina';
import { EtiquetaEstado } from '../../components/etiqueta-estado/etiqueta-estado';
import { FLUJO_PEDIDO, Pedido } from '../../models/pedido';
import { ServicioPedidos } from '../../services/servicio-pedidos';
import { formatearEuros, formatearHora, minutosDesde, resumenLineas } from '../../utils/formato';

/** Minutos a partir de los cuales un pedido pendiente se marca como "espera alta". */
const MINUTOS_ESPERA_ALTA = 8;
/** Cada cuántos segundos se vuelve a pedir la cola a la API (pantalla destacada). */
export const SEGUNDOS_ENTRE_ACTUALIZACIONES = 15;

@Component({
  selector: 'app-pagina-cola-pedidos',
  imports: [CabeceraPagina, TarjetaIndicador, Aviso, Icono, EtiquetaEstado],
  templateUrl: './cola-pedidos.html',
  styleUrl: './cola-pedidos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaColaPedidos {
  protected readonly servicioPedidos = inject(ServicioPedidos);
  protected readonly flujoEstados = FLUJO_PEDIDO;
  protected readonly formatearHora = formatearHora;
  protected readonly formatearEuros = formatearEuros;
  protected readonly minutosDesde = minutosDesde;
  protected readonly resumenLineas = resumenLineas;
  protected readonly segundosEntreActualizaciones = SEGUNDOS_ENTRE_ACTUALIZACIONES;

  /** Instante actual; avanza cada segundo para refrescar los tiempos de espera en pantalla. */
  private readonly instanteActual = signal(Date.now());
  /** Mensaje de error de la última acción (preparar, entregar, cancelar). */
  protected readonly errorAccion = signal<string | null>(null);

  constructor() {
    // Actualización periódica: cada segundo se mueve el reloj y, cada N segundos, se recarga la cola.
    // `takeUntilDestroyed` detiene el temporizador al salir de la página.
    interval(1000)
      .pipe(takeUntilDestroyed())
      .subscribe((segundosTranscurridos) => {
        this.instanteActual.set(Date.now());
        if ((segundosTranscurridos + 1) % SEGUNDOS_ENTRE_ACTUALIZACIONES === 0)
          this.servicioPedidos.cargar();
      });
  }

  protected readonly tiempoDesdeActualizacion = computed(() => {
    const segundos = Math.round(
      (this.instanteActual() - this.servicioPedidos.ultimaActualizacion().getTime()) / 1000,
    );
    return segundos < 60
      ? `hace ${Math.max(segundos, 1)} s`
      : `hace ${Math.round(segundos / 60)} min`;
  });

  /** Minutos de espera del pendiente más antiguo (se recalcula cada segundo). */
  protected readonly minutosEsperaMasAntiguo = computed(() => {
    const pendienteMasAntiguo = this.servicioPedidos.pendienteMasAntiguo();
    return pendienteMasAntiguo
      ? minutosDesde(pendienteMasAntiguo.fecha, new Date(this.instanteActual()))
      : 0;
  });

  protected tieneEsperaAlta(pedido: Pedido): boolean {
    return pedido.estado === 'pendiente' && minutosDesde(pedido.fecha) >= MINUTOS_ESPERA_ALTA;
  }

  protected avanzarEstado(pedido: Pedido): void {
    this.errorAccion.set(null);
    this.servicioPedidos.avanzar(pedido.id)?.subscribe({
      error: (errorAvance: Error) =>
        this.errorAccion.set(`No se ha podido actualizar ${pedido.turno}: ${errorAvance.message}`),
    });
  }

  protected cancelarPedido(pedido: Pedido): void {
    if (!confirm(`¿Cancelar el pedido ${pedido.turno}?`)) return;
    this.errorAccion.set(null);
    this.servicioPedidos.cancelar(pedido.id).subscribe({
      error: (errorCancelacion: Error) =>
        this.errorAccion.set(
          `No se ha podido cancelar ${pedido.turno}: ${errorCancelacion.message}`,
        ),
    });
  }
}
