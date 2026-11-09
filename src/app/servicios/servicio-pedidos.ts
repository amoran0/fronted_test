import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { EstadoPedido, FLUJO_PEDIDO, Pedido } from '../modelos/pedido';
import { ServicioApi } from './servicio-api';
import { ServicioAutenticacion } from './servicio-autenticacion';
import { ServicioCarrito } from './servicio-carrito';
import { PEDIDOS_SIMULADOS } from './datos-simulados';

type PedidoConCliente = Pedido & { clienteId: string };

/** Estados de un pedido que todavía no se ha entregado ni cancelado. */
const ESTADOS_EN_CURSO: EstadoPedido[] = ['pendiente', 'en_preparacion', 'listo'];

@Injectable({ providedIn: 'root' })
export class ServicioPedidos {
  private readonly api = inject(ServicioApi);
  private readonly autenticacion = inject(ServicioAutenticacion);
  private readonly servicioCarrito = inject(ServicioCarrito);

  private readonly todosLosPedidos = signal<PedidoConCliente[]>([]);
  readonly ultimaActualizacion = signal(new Date());

  readonly misPedidos = computed(() =>
    this.todosLosPedidos()
      .filter((pedido) => pedido.clienteId === this.autenticacion.usuario()?.id)
      .sort((pedidoA, pedidoB) => pedidoB.fecha.localeCompare(pedidoA.fecha)),
  );
  readonly pedidoActivo = computed(
    () => this.misPedidos().find((pedido) => ESTADOS_EN_CURSO.includes(pedido.estado)) ?? null,
  );
  readonly historial = computed(() => this.misPedidos().filter((pedido) => pedido !== this.pedidoActivo()));

  /** Cola del barista: primero por estado, después por antigüedad. */
  readonly cola = computed(() =>
    this.todosLosPedidos()
      .filter((pedido) => ESTADOS_EN_CURSO.includes(pedido.estado))
      .sort(
        (pedidoA, pedidoB) =>
          FLUJO_PEDIDO.indexOf(pedidoA.estado) - FLUJO_PEDIDO.indexOf(pedidoB.estado) ||
          pedidoA.fecha.localeCompare(pedidoB.fecha),
      ),
  );
  readonly pendientes = computed(() => this.cola().filter((pedido) => pedido.estado === 'pendiente'));
  readonly pendienteMasAntiguo = computed(() => this.pendientes()[0] ?? null);
  readonly cantidadPorEstado = computed(() => ({
    pendiente: this.pendientes().length,
    en_preparacion: this.cola().filter((pedido) => pedido.estado === 'en_preparacion').length,
    listo: this.cola().filter((pedido) => pedido.estado === 'listo').length,
  }));

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.api.obtener('/pedidos', () => PEDIDOS_SIMULADOS).subscribe((pedidosRecibidos) => {
      this.todosLosPedidos.set(pedidosRecibidos);
      this.ultimaActualizacion.set(new Date());
    });
  }

  siguienteEstado(estado: EstadoPedido): EstadoPedido | null {
    const posicion = FLUJO_PEDIDO.indexOf(estado);
    return posicion >= 0 && posicion < FLUJO_PEDIDO.length - 1 ? FLUJO_PEDIDO[posicion + 1] : null;
  }

  cambiarEstado(id: string, estado: EstadoPedido): Observable<Pedido> {
    return this.api
      .modificar<Pedido>(`/pedidos/${id}/estado`, { estado }, () => ({
        ...this.todosLosPedidos().find((pedido) => pedido.id === id)!,
        estado,
      }))
      .pipe(
        tap((pedidoActualizado) =>
          this.todosLosPedidos.update((pedidos) =>
            pedidos.map((pedido) => (pedido.id === id ? { ...pedido, estado: pedidoActualizado.estado } : pedido)),
          ),
        ),
      );
  }

  avanzar(id: string): Observable<Pedido> | null {
    const pedido = this.todosLosPedidos().find((pedidoBuscado) => pedidoBuscado.id === id);
    const estadoSiguiente = pedido && this.siguienteEstado(pedido.estado);
    return estadoSiguiente ? this.cambiarEstado(id, estadoSiguiente) : null;
  }

  /** Solo se pueden cancelar los pedidos que aún no se han empezado a preparar. */
  cancelar(id: string): Observable<Pedido> {
    return this.cambiarEstado(id, 'cancelado');
  }

  /** Crea el pedido a partir del carrito con el descuento ya aplicado. */
  confirmar(): Observable<Pedido> {
    const pedidosExistentes = this.todosLosPedidos();
    const ultimoNumero = Math.max(0, ...pedidosExistentes.map((pedido) => Number(pedido.codigo.split('-')[1])));
    const ultimoTurno = Math.max(
      0,
      ...pedidosExistentes
        .filter((pedido) => pedido.turno.startsWith('A-'))
        .map((pedido) => Number(pedido.turno.slice(2))),
    );
    const pedidoNuevo: PedidoConCliente = {
      id: 'p-' + (ultimoNumero + 1),
      codigo: 'CS-' + String(ultimoNumero + 1).padStart(4, '0'),
      turno: 'A-' + (ultimoTurno + 1),
      fecha: new Date().toISOString(),
      clienteId: this.autenticacion.usuario()?.id ?? 'anonimo',
      lineas: this.servicioCarrito.validas().map((linea) => ({
        nombre: linea.producto.nombre,
        cantidad: linea.cantidad,
        precioUnitario: linea.precioUnitario,
      })),
      subtotal: this.servicioCarrito.subtotal(),
      descuento: this.servicioCarrito.descuento() ?? undefined,
      total: this.servicioCarrito.total(),
      estado: 'pendiente',
      pagado: true,
      alergiasDeclaradas: null,
    };
    return this.api.crear<Pedido>('/pedidos', pedidoNuevo, () => pedidoNuevo).pipe(
      tap(() => {
        this.todosLosPedidos.update((pedidos) => [pedidoNuevo, ...pedidos]);
        this.servicioCarrito.vaciar();
      }),
    );
  }
}
