import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, forkJoin, map, of, tap } from 'rxjs';
import {
  AlergenoApi,
  CategoriaApi,
  CategoriaListadoApi,
  PaginaApi,
  ProductoApi,
} from '../models/api';
import { Alergeno, Categoria, EstadoProducto, GrupoCarta, Producto } from '../models/producto';
import { PaginaResultados } from '../models/pagina';
import { ServicioApi } from './servicio-api';
import { FiltrosCarta, parametrosDeFiltrosCarta } from '../utils/filtros-carta';
import {
  mapearCategoria,
  mapearCategoriaListado,
  mapearPagina,
  mapearProducto,
  productoAPeticion,
} from '../utils/mapeadores';

/** Tamaño de página usado para cargar el catálogo completo (gestión y disponibilidad). */
const TAMANO_CATALOGO_COMPLETO = 500;

@Injectable({ providedIn: 'root' })
export class ServicioProductos {
  private readonly api = inject(ServicioApi);

  private readonly productosCargados = signal<Producto[]>([]);
  private readonly categoriasCargadas = signal<Categoria[]>([]);
  private readonly alergenosCargados = signal<AlergenoApi[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly productos = this.productosCargados.asReadonly();
  readonly categorias = this.categoriasCargadas.asReadonly();
  /** Nombres de los alérgenos (las pantallas trabajan con el nombre). */
  readonly alergenos = computed<Alergeno[]>(() =>
    this.alergenosCargados().map((alergeno) => alergeno.nombre),
  );
  /** Nombre → id, para enviar los alérgenos a la API (`alergenosIds`, `sinAlergenoId`). */
  readonly idAlergenoPorNombre = computed(
    () => new Map(this.alergenosCargados().map((alergeno) => [alergeno.nombre, alergeno.id])),
  );
  /** Lo que ve el público: todo excepto lo retirado. */
  readonly carta = computed(() =>
    this.productosCargados().filter((producto) => producto.estado !== 'retirado'),
  );

  constructor() {
    this.cargar();
  }

  /**
   * Carga categorías, alérgenos y productos en paralelo; la vista se actualiza cuando llegan los tres.
   * `incluirInactivos=true` devuelve también los retirados (solo con rol ADMIN; al resto la API se los omite).
   */
  cargar(): void {
    this.cargando.set(true);
    forkJoin({
      categorias: this.api.obtener<CategoriaListadoApi[]>('/categorias'),
      alergenos: this.api.obtener<AlergenoApi[]>('/alergenos'),
      productos: this.api.obtener<PaginaApi<ProductoApi>>('/productos', {
        incluirInactivos: true,
        size: TAMANO_CATALOGO_COMPLETO,
      }),
    }).subscribe({
      next: ({ categorias, alergenos, productos }) => {
        this.categoriasCargadas.set(categorias.map(mapearCategoriaListado));
        this.alergenosCargados.set(alergenos);
        this.productosCargados.set(productos.content.map(mapearProducto));
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
   * como parámetros de la URL (`GET /productos?nombre=…&categoriaId=…&page=0&size=6`).
   */
  buscarCarta(
    filtros: FiltrosCarta,
    pagina: number,
    tamanoPagina: number,
  ): Observable<PaginaResultados<Producto>> {
    const parametros = parametrosDeFiltrosCarta(filtros, pagina, tamanoPagina, {
      idsCategorias: this.categoriasCargadas().map((categoria) => categoria.id),
      idAlergenoPorNombre: this.idAlergenoPorNombre(),
    });
    return this.api
      .obtener<PaginaApi<ProductoApi>>('/productos', parametros)
      .pipe(map((paginaApi) => mapearPagina(paginaApi, mapearProducto)));
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

  /**
   * Cambia el estado de uno o varios productos. Cada estado usa su endpoint:
   * - disponible ⇄ agotado → `PATCH /productos/{id}/disponibilidad`
   * - retirado → `DELETE /productos/{id}` (baja lógica, RN-01)
   * - retirado → disponible (reactivar) → `PUT /productos/{id}` con `activa: true`
   * Las peticiones de varios productos se lanzan en paralelo con `forkJoin`.
   */
  cambiarEstado(ids: string[], estado: EstadoProducto): Observable<Producto[]> {
    const productos = ids
      .map((id) => this.porId(id))
      .filter((producto): producto is Producto => !!producto);
    if (!productos.length) return of([]);
    return forkJoin(productos.map((producto) => this.peticionCambioEstado(producto, estado))).pipe(
      tap((productosCambiados) => this.fusionarCambios(productosCambiados)),
    );
  }

  private peticionCambioEstado(producto: Producto, estado: EstadoProducto): Observable<Producto> {
    if (estado === 'retirado') {
      return this.api
        .eliminar(`/productos/${producto.id}`)
        .pipe(map(() => ({ ...producto, estado: 'retirado' as const, nota: 'Retirado' })));
    }
    if (producto.estado === 'retirado') {
      return this.api
        .reemplazar<ProductoApi>(
          `/productos/${producto.id}`,
          productoAPeticion({ ...producto, estado }, this.idAlergenoPorNombre()),
        )
        .pipe(map(mapearProducto));
    }
    return this.api
      .modificar<ProductoApi>(`/productos/${producto.id}/disponibilidad`, {
        disponible: estado === 'disponible',
      })
      .pipe(map(mapearProducto));
  }

  /** Alta (`POST /productos`) o modificación (`PUT /productos/{id}`). El id del alta lo genera la API. */
  guardar(producto: Producto, esNuevo: boolean): Observable<Producto> {
    const cuerpo = productoAPeticion(producto, this.idAlergenoPorNombre());
    const peticion = esNuevo
      ? this.api.crear<ProductoApi>('/productos', cuerpo)
      : this.api.reemplazar<ProductoApi>(`/productos/${producto.id}`, cuerpo);
    return peticion.pipe(
      map(mapearProducto),
      tap((productoGuardado) => this.fusionarCambios([productoGuardado])),
    );
  }

  /** Crea un alérgeno (`POST /alergenos`). La API rechaza los duplicados con un 409. */
  crearAlergeno(nombre: string): Observable<Alergeno> {
    return this.api.crear<AlergenoApi>('/alergenos', { nombre: nombre.trim() }).pipe(
      tap((alergenoCreado) =>
        this.alergenosCargados.update((alergenos) => [...alergenos, alergenoCreado]),
      ),
      map((alergenoCreado) => alergenoCreado.nombre),
    );
  }

  /** Crea una categoría (`POST /categorias`). El grupo de los filtros rápidos es solo de presentación. */
  crearCategoria(nombre: string, _grupo: GrupoCarta = 'comida'): Observable<Categoria> {
    return this.api.crear<CategoriaApi>('/categorias', { nombre: nombre.trim() }).pipe(
      map((categoriaCreada) => mapearCategoria(categoriaCreada)),
      tap((categoriaCreada) =>
        this.categoriasCargadas.update((categorias) => [...categorias, categoriaCreada]),
      ),
    );
  }

  /** Elimina una categoría (`DELETE /categorias/{id}`). La API responde 409 si aún tiene productos. */
  eliminarCategoria(id: string): Observable<void> {
    return this.api
      .eliminar(`/categorias/${id}`)
      .pipe(
        tap(() =>
          this.categoriasCargadas.update((categorias) =>
            categorias.filter((categoria) => categoria.id !== id),
          ),
        ),
      );
  }

  /**
   * Agota o repone una categoría entera (`PATCH /categorias/{id}/disponibilidad`, RF-03).
   * La API cambia también todos sus productos, así que después se recarga el catálogo.
   */
  cambiarDisponibilidadCategoria(id: string, disponible: boolean): Observable<Categoria> {
    return this.api
      .modificar<CategoriaApi>(`/categorias/${id}/disponibilidad`, { disponible })
      .pipe(
        map((categoriaApi) =>
          mapearCategoria(categoriaApi, this.categoria(id)?.productosActivos ?? 0),
        ),
        tap(() => this.cargar()),
      );
  }

  /** Baja lógica: conserva el producto en informes e historial. */
  retirar(id: string): Observable<Producto[]> {
    return this.cambiarEstado([id], 'retirado');
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
