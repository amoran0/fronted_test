import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, forkJoin, tap } from 'rxjs';
import { ALERGENOS, Alergeno, Categoria, EstadoProducto, Producto } from '../models/producto';
import { ServicioApi } from './servicio-api';
import { CATEGORIAS_SIMULADAS, PRODUCTOS_SIMULADOS } from './datos-simulados';
import { textoAIdentificador } from '../utils/formato';
import { PaginaResultados } from '../models/pagina';
import {
  FiltrosCarta,
  filtrarProductos,
  paginar,
  parametrosDeFiltrosCarta,
} from '../utils/filtros-carta';

@Injectable({ providedIn: 'root' })
export class ServicioProductos {
  private readonly api = inject(ServicioApi);

  private readonly productosCargados = signal<Producto[]>([]);
  private readonly categoriasCargadas = signal<Categoria[]>([]);
  private readonly alergenosDisponibles = signal<Alergeno[]>([...ALERGENOS]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly productos = this.productosCargados.asReadonly();
  readonly categorias = this.categoriasCargadas.asReadonly();
  readonly alergenos = this.alergenosDisponibles.asReadonly();
  /** Lo que ve el público: todo excepto lo retirado. */
  readonly carta = computed(() =>
    this.productosCargados().filter((producto) => producto.estado !== 'retirado'),
  );

  constructor() {
    this.cargar();
  }

  /** Carga categorías y productos en paralelo; la vista se actualiza cuando llegan ambos. */
  cargar(): void {
    this.cargando.set(true);
    forkJoin({
      categorias: this.api.obtener('/categorias', () => CATEGORIAS_SIMULADAS),
      productos: this.api.obtener('/productos', () => PRODUCTOS_SIMULADOS),
    }).subscribe({
      next: ({ categorias, productos }) => {
        this.categoriasCargadas.set(categorias);
        this.productosCargados.set(productos);
        this.error.set(null);
        this.cargando.set(false);
      },
      error: (errorCarga: Error) => {
        this.error.set(errorCarga.message);
        this.cargando.set(false);
      },
    });
  }

  /**
   * Consulta paginada de la carta pública: los filtros y la página se envían a la API
   * como parámetros de la URL (`GET /productos?nombre=…&page=0&size=6`).
   */
  buscarCarta(
    filtros: FiltrosCarta,
    pagina: number,
    tamanoPagina: number,
  ): Observable<PaginaResultados<Producto>> {
    return this.api.obtener(
      '/productos',
      () =>
        paginar(
          filtrarProductos(this.carta(), this.categoriasCargadas(), filtros),
          pagina,
          tamanoPagina,
        ),
      parametrosDeFiltrosCarta(filtros, pagina, tamanoPagina),
    );
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

  /** Añade un alérgeno a la lista (ignora duplicados sin distinguir mayúsculas). */
  crearAlergeno(nombre: string): void {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) return;
    this.alergenosDisponibles.update((alergenos) =>
      alergenos.some((alergeno) => alergeno.toLowerCase() === nombreLimpio.toLowerCase())
        ? alergenos
        : [...alergenos, nombreLimpio],
    );
  }

  crearCategoria(nombre: string, grupo: Categoria['grupo'] = 'comida'): Observable<Categoria> {
    const categoria: Categoria = {
      id: textoAIdentificador(nombre.trim()),
      nombre: nombre.trim(),
      grupo,
    };
    return this.api
      .crear<Categoria>('/categorias', categoria, () => categoria)
      .pipe(
        tap((categoriaCreada) =>
          this.categoriasCargadas.update((categorias) => [
            ...categorias.filter(
              (categoriaExistente) => categoriaExistente.id !== categoriaCreada.id,
            ),
            categoriaCreada,
          ]),
        ),
      );
  }

  /** Elimina una categoría (DELETE). No se permite si todavía tiene productos asignados. */
  eliminarCategoria(id: string): Observable<void> {
    return this.api
      .eliminar<void>(`/categorias/${id}`, () => {
        const totalProductos = this.productosCargados().filter(
          (producto) => producto.categoriaId === id,
        ).length;
        if (totalProductos)
          throw new Error(
            `La categoría tiene ${totalProductos} productos: muévelos a otra antes de eliminarla.`,
          );
      })
      .pipe(
        tap(() =>
          this.categoriasCargadas.update((categorias) =>
            categorias.filter((categoria) => categoria.id !== id),
          ),
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
