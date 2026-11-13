import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Observable, map, tap, throwError } from 'rxjs';
import { PaginaApi, PedidoApi, PedidoPeticionApi } from '../models/api';
import { EstadoPedido, FLUJO_PEDIDO, Pedido } from '../models/pedido';
import { ServicioApi } from './servicio-api';
import { ServicioAutenticacion } from './servicio-autenticacion';
import { ServicioCarrito } from './servicio-carrito';
import { estadoPedidoAApi, mapearPedido } from '../utils/mapeadores';

/** Estados de un pedido que todavía no se ha entregado ni cancelado. */
const ESTADOS_EN_CURSO: EstadoPedido[] = ['pendiente', 'en_preparacion', 'listo'];
/** Pedidos que se piden por consulta (los más recientes primero). */
const TAMANO_LISTADO_PEDIDOS = 100;

@Injectable({ providedIn: 'root' })
export class ServicioPedidos {
  private readonly api = inject(ServicioApi);
  private readonly autenticacion = inject(ServicioAutenticacion);
  private readonly servicioCarrito = inject(ServicioCarrito);

  private readonly todosLosPedidos = signal<Pedido[]>([]);
  readonly ultimaActualizacion = signal(new Date());
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly misPedidos = computed(() =>
    this.todosLosPedidos()
      .filter((pedido) => pedido.clienteId === this.autenticacion.usuario()?.clienteId)
      .sort((pedidoA, pedidoB) => pedidoB.fecha.localeCompare(pedidoA.fecha)),
  );
  readonly pedidoActivo = computed(
    () => this.misPedidos().find((pedido) => ESTADOS_EN_CURSO.includes(pedido.estado)) ?? null,
  );
  readonly historial = computed(() =>
    this.misPedidos().filter((pedido) => pedido !== this.pedidoActivo()),
  );

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
  readonly pendientes = computed(() =>
    this.cola().filter((pedido) => pedido.estado === 'pendiente'),
  );
  readonly pendienteMasAntiguo = computed(() => this.pendientes()[0] ?? null);
  readonly cantidadPorEstado = computed(() => ({
    pendiente: this.pendientes().length,
    en_preparacion: this.cola().filter((pedido) => pedido.estado === 'en_preparacion').length,
    listo: this.cola().filter((pedido) => pedido.estado === 'listo').length,
  }));

  constructor() {
    // Se recargan los pedidos al iniciar o cerrar sesión (cada rol ve pedidos distintos).
    effect(() => {
      this.autenticacion.usuario();
      untracked(() => this.cargar());
    });
  }

  /**
   * `GET /pedidos` (paginado). Un cliente pide solo los suyos (`clienteId`); la API
   * además lo impone con el token. Barista y admin reciben todos.
   */
  cargar(): void {
    const usuario = this.autenticacion.usuario();
    if (!usuario) {
      this.todosLosPedidos.set([]);
      this.cargando.set(false);
      return;
    }
    this.cargando.set(true);
    this.api
      .obtener<PaginaApi<PedidoApi>>('/pedidos', {
        clienteId: usuario.rol === 'cliente' ? usuario.clienteId : undefined,
        sort: 'fecha,desc',
        size: TAMANO_LISTADO_PEDIDOS,
      })
      .subscribe({
        next: (paginaPedidos) => {
          this.todosLosPedidos.set(paginaPedidos.content.map(mapearPedido));
          this.ultimaActualizacion.set(new Date());
          this.error.set(null);
          this.cargando.set(false);
        },
        error: (errorCarga: Error) => {
          this.error.set(errorCarga.message);
          this.cargando.set(false);
        },
      });
  }

  siguienteEstado(estado: EstadoPedido): EstadoPedido | null {
    const posicion = FLUJO_PEDIDO.indexOf(estado);
    return posicion >= 0 && posicion < FLUJO_PEDIDO.length - 1 ? FLUJO_PEDIDO[posicion + 1] : null;
  }

  /** `PATCH /pedidos/{id}/estado`. La API valida las transiciones (RN-08) y responde 422 si no es válida. */
  cambiarEstado(id: string, estado: EstadoPedido): Observable<Pedido> {
    return this.api
      .modificar<PedidoApi>(`/pedidos/${id}/estado`, { estado: estadoPedidoAApi(estado) })
      .pipe(
        map(mapearPedido),
        tap((pedidoActualizado) =>
          this.todosLosPedidos.update((pedidos) =>
            pedidos.map((pedido) => (pedido.id === id ? pedidoActualizado : pedido)),
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

  /**
   * `POST /pedidos` con las líneas del carrito, el cupón y el DNI de socio.
   * El servidor calcula precios, descuento (RN-07), IVA (RN-05) y turno (RN-09):
   * el pedido que se guarda y se muestra es el que devuelve la API.
   */
  confirmar(): Observable<Pedido> {
    const clienteId = this.autenticacion.usuario()?.clienteId;
    if (!clienteId)
      return throwError(() => new Error('Inicia sesión como cliente para hacer un pedido.'));
    const cuerpo: PedidoPeticionApi = {
      clienteId,
      lineas: this.servicioCarrito.validas().map((linea) => linea.aLineaDePedido()),
      codigoCupon: this.servicioCarrito.codigoCupon(),
      dniSocio: this.servicioCarrito.dniSocio(),
    };
    return this.api.crear<PedidoApi>('/pedidos', cuerpo).pipe(
      map(mapearPedido),
      tap((pedidoCreado) => {
        this.todosLosPedidos.update((pedidos) => [pedidoCreado, ...pedidos]);
        this.servicioCarrito.vaciar();
      }),
    );
  }
}
