import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Categoria, EstadoProducto, Producto } from '../modelos/producto';
import { ServicioApi } from './servicio-api';
import { CATEGORIAS_SIMULADAS, PRODUCTOS_SIMULADOS } from './datos-simulados';
import { textoAIdentificador } from '../utilidades/formato';

@Injectable({ providedIn: 'root' })
export class ServicioProductos {
  private readonly api = inject(ServicioApi);

  private readonly productosCargados = signal<Producto[]>([]);
  private readonly categoriasCargadas = signal<Categoria[]>([]);
  readonly cargando = signal(true);

  readonly productos = this.productosCargados.asReadonly();
  readonly categorias = this.categoriasCargadas.asReadonly();
  /** Lo que ve el público: todo excepto lo retirado. */
  readonly carta = computed(() => this.productosCargados().filter((producto) => producto.estado !== 'retirado'));

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.api
      .obtener('/categorias', () => CATEGORIAS_SIMULADAS)
      .subscribe((categoriasRecibidas) => this.categoriasCargadas.set(categoriasRecibidas));
    this.api.obtener('/productos', () => PRODUCTOS_SIMULADOS).subscribe((productosRecibidos) => {
      this.productosCargados.set(productosRecibidos);
      this.cargando.set(false);
    });
  }

  porId(id: string): Producto | undefined {
    return this.productosCargados().find((producto) => producto.id === id);
  }

  categoria(id: string): Categoria | undefined {
    return this.categoriasCargadas().find((categoria) => categoria.id === id);
  }

  nombreCategoria(id: string): string {
    return this.categoria(id)?.nombre ?? '—';
  }

  /** Cambio rápido del barista: disponible ⇄ agotado. */
  cambiarEstado(ids: string[], estado: EstadoProducto, nota?: string): Observable<Producto[]> {
    return this.api
      .modificar<Producto[]>('/productos/estado', { ids, estado, nota }, () =>
        this.productosCargados()
          .filter((producto) => ids.includes(producto.id))
          .map((producto) => ({ ...producto, estado, nota: nota ?? producto.nota })),
      )
      .pipe(tap((productosCambiados) => this.fusionarCambios(productosCambiados)));
  }

  guardar(producto: Producto): Observable<Producto> {
    const yaExiste = !!this.porId(producto.id);
    const peticion = yaExiste
      ? this.api.reemplazar<Producto>(`/productos/${producto.id}`, producto, () => producto)
      : this.api.crear<Producto>('/productos', producto, () => producto);
    return peticion.pipe(tap((productoGuardado) => this.fusionarCambios([productoGuardado])));
  }

  crearCategoria(nombre: string, grupo: Categoria['grupo'] = 'comida'): Observable<Categoria> {
    const categoria: Categoria = { id: textoAIdentificador(nombre.trim()), nombre: nombre.trim(), grupo };
    return this.api
      .crear<Categoria>('/categorias', categoria, () => categoria)
      .pipe(
        tap((categoriaCreada) =>
          this.categoriasCargadas.update((categorias) => [
            ...categorias.filter((categoriaExistente) => categoriaExistente.id !== categoriaCreada.id),
            categoriaCreada,
          ]),
        ),
      );
  }

  /** Baja lógica: conserva el producto en informes e historial. */
  retirar(id: string): Observable<Producto[]> {
    return this.cambiarEstado([id], 'retirado', 'Retirado');
  }

  /** Sustituye en la lista los productos modificados (o añade los nuevos). */
  private fusionarCambios(productosCambiados: Producto[]): void {
    this.productosCargados.update((productos) => {
      const productosPorId = new Map(productos.map((producto) => [producto.id, producto]));
      productosCambiados.forEach((producto) => productosPorId.set(producto.id, producto));
      return [...productosPorId.values()];
    });
  }
}
