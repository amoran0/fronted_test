import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Categoria, EstadoProducto, Producto } from '../models/producto';
import { ApiService } from './api.service';
import { MOCK_CATEGORIAS, MOCK_PRODUCTOS } from './mock-data';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly api = inject(ApiService);

  private readonly _productos = signal<Producto[]>([]);
  private readonly _categorias = signal<Categoria[]>([]);
  readonly cargando = signal(true);
  readonly actualizado = signal<Date | null>(null);

  readonly productos = this._productos.asReadonly();
  readonly categorias = this._categorias.asReadonly();
  /** Lo que ve el público: todo excepto lo retirado. */
  readonly carta = computed(() => this._productos().filter((p) => p.estado !== 'retirado'));

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.api.get('/categorias', () => MOCK_CATEGORIAS).subscribe((c) => this._categorias.set(c));
    this.api.get('/productos', () => MOCK_PRODUCTOS).subscribe((p) => {
      this._productos.set(p);
      this.cargando.set(false);
      this.actualizado.set(new Date());
    });
  }

  porId(id: string): Producto | undefined {
    return this._productos().find((p) => p.id === id);
  }

  categoria(id: string): Categoria | undefined {
    return this._categorias().find((c) => c.id === id);
  }

  nombreCategoria(id: string): string {
    return this.categoria(id)?.nombre ?? '—';
  }

  /** Cambio rápido del barista: disponible ⇄ agotado. */
  cambiarEstado(ids: string[], estado: EstadoProducto, nota?: string): Observable<Producto[]> {
    return this.api
      .patch<Producto[]>('/productos/estado', { ids, estado, nota }, () =>
        this._productos().filter((p) => ids.includes(p.id)).map((p) => ({ ...p, estado, nota: nota ?? p.nota })),
      )
      .pipe(tap((cambiados) => this.fusionar(cambiados)));
  }

  guardar(producto: Producto): Observable<Producto> {
    const existe = !!this.porId(producto.id);
    const peticion = existe
      ? this.api.put<Producto>(`/productos/${producto.id}`, producto, () => producto)
      : this.api.post<Producto>('/productos', producto, () => producto);
    return peticion.pipe(tap((p) => this.fusionar([p])));
  }

  crearCategoria(nombre: string, grupo: Categoria['grupo'] = 'comida'): Observable<Categoria> {
    const id = nombre.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
    const categoria: Categoria = { id, nombre: nombre.trim(), grupo };
    return this.api
      .post<Categoria>('/categorias', categoria, () => categoria)
      .pipe(tap((c) => this._categorias.update((l) => [...l.filter((x) => x.id !== c.id), c])));
  }

  /** Baja lógica: conserva el producto en informes e historial. */
  retirar(id: string): Observable<Producto[]> {
    return this.cambiarEstado([id], 'retirado', 'Retirado');
  }

  private fusionar(cambiados: Producto[]): void {
    this._productos.update((lista) => {
      const mapa = new Map(lista.map((p) => [p.id, p]));
      cambiados.forEach((p) => mapa.set(p.id, p));
      return [...mapa.values()];
    });
  }
}
