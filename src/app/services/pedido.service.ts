import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { EstadoPedido, FLUJO_PEDIDO, Pedido } from '../models/pedido';
import { minutosDesde } from '../utils/formato';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { CarritoService } from './carrito.service';
import { MOCK_PEDIDOS } from './mock-data';

type PedidoConCliente = Pedido & { clienteId: string };

const EN_CURSO: EstadoPedido[] = ['pendiente', 'en_preparacion', 'listo'];

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly carrito = inject(CarritoService);

  private readonly _pedidos = signal<PedidoConCliente[]>([]);
  readonly ultimaActualizacion = signal(new Date());

  readonly misPedidos = computed(() =>
    this._pedidos()
      .filter((p) => p.clienteId === this.auth.usuario()?.id)
      .sort((a, b) => b.fecha.localeCompare(a.fecha)),
  );
  readonly pedidoActivo = computed(() => this.misPedidos().find((p) => EN_CURSO.includes(p.estado)) ?? null);
  readonly historial = computed(() => this.misPedidos().filter((p) => p !== this.pedidoActivo()));

  /** Cola del barista: primero por estado, después por antigüedad. */
  readonly cola = computed(() =>
    this._pedidos()
      .filter((p) => EN_CURSO.includes(p.estado))
      .sort((a, b) => FLUJO_PEDIDO.indexOf(a.estado) - FLUJO_PEDIDO.indexOf(b.estado) || a.fecha.localeCompare(b.fecha)),
  );
  readonly pendientes = computed(() => this.cola().filter((p) => p.estado === 'pendiente'));
  readonly masAntiguo = computed(() => this.pendientes()[0] ?? null);
  readonly cuenta = computed(() => ({
    pendiente: this.pendientes().length,
    en_preparacion: this.cola().filter((p) => p.estado === 'en_preparacion').length,
    listo: this.cola().filter((p) => p.estado === 'listo').length,
  }));

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.api.get('/pedidos', () => MOCK_PEDIDOS).subscribe((p) => {
      this._pedidos.set(p);
      this.ultimaActualizacion.set(new Date());
    });
  }

  esperaMinutos(p: Pedido): number {
    return minutosDesde(p.fecha);
  }

  siguienteEstado(estado: EstadoPedido): EstadoPedido | null {
    const i = FLUJO_PEDIDO.indexOf(estado);
    return i >= 0 && i < FLUJO_PEDIDO.length - 1 ? FLUJO_PEDIDO[i + 1] : null;
  }

  cambiarEstado(id: string, estado: EstadoPedido): Observable<Pedido> {
    return this.api
      .patch<Pedido>(`/pedidos/${id}/estado`, { estado }, () => ({ ...this._pedidos().find((p) => p.id === id)!, estado }))
      .pipe(tap((p) => this._pedidos.update((l) => l.map((x) => (x.id === id ? { ...x, estado: p.estado } : x)))));
  }

  avanzar(id: string): Observable<Pedido> | null {
    const p = this._pedidos().find((x) => x.id === id);
    const sig = p && this.siguienteEstado(p.estado);
    return sig ? this.cambiarEstado(id, sig) : null;
  }

  /** Solo se pueden cancelar los pedidos que aún no se han empezado a preparar. */
  cancelar(id: string): Observable<Pedido> {
    return this.cambiarEstado(id, 'cancelado');
  }

  /** Crea el pedido a partir del carrito con el descuento ya aplicado. */
  confirmar(): Observable<Pedido> {
    const lista = this._pedidos();
    const ultimoNumero = Math.max(0, ...lista.map((p) => Number(p.codigo.split('-')[1])));
    const ultimoTurno = Math.max(0, ...lista.filter((p) => p.turno.startsWith('A-')).map((p) => Number(p.turno.slice(2))));
    const nuevo: PedidoConCliente = {
      id: 'p-' + (ultimoNumero + 1),
      codigo: 'CS-' + String(ultimoNumero + 1).padStart(4, '0'),
      turno: 'A-' + (ultimoTurno + 1),
      fecha: new Date().toISOString(),
      clienteId: this.auth.usuario()?.id ?? 'anonimo',
      lineas: this.carrito.validas().map((l) => ({ nombre: l.producto.nombre, cantidad: l.cantidad, precioUnitario: l.precioUnitario })),
      subtotal: this.carrito.subtotal(),
      descuento: this.carrito.descuento() ?? undefined,
      total: this.carrito.total(),
      estado: 'pendiente',
      pagado: true,
      alergiasDeclaradas: null,
    };
    return this.api.post<Pedido>('/pedidos', nuevo, () => nuevo).pipe(
      tap(() => {
        this._pedidos.update((l) => [nuevo, ...l]);
        this.carrito.vaciar();
      }),
    );
  }
}
