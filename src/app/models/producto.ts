/** Nombre del alérgeno; el admin puede añadir nuevos además de los iniciales. */
export type Alergeno = string;


/** Grupo usado por los filtros rápidos de la carta. */
export type GrupoCarta = 'cafe' | 'comida' | 'frios';

/**
 * - `disponible`: se puede pedir.
 * - `agotado`: retirado temporalmente por el barista (se repone).
 * - `retirado`: baja definitiva de la carta, solo la gestiona el admin.
 */
export type EstadoProducto = 'disponible' | 'agotado' | 'retirado';

export interface Categoria {
  id: string;
  nombre: string;
  /** Grupo para los filtros rápidos: no viene de la API, se asigna en `utils/presentacion.ts`. */
  grupo: GrupoCarta;
  /** Categoría agotada por completo (RF-03). */
  disponible: boolean;
  /** Productos activos de la categoría (lo calcula la API). */
  productosActivos: number;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  /** Precio final con IVA (10 %) incluido · `precioVenta` en la API. */
  precio: number;
  categoriaId: string;
  alergenos: Alergeno[];
  estado: EstadoProducto;
  /** Ruta relativa a /public, p. ej. `img/flat-white.jpg`. No viene de la API (`utils/presentacion.ts`). */
  imagen?: string;
  /** Foto vertical opcional para la ficha de detalle (si no hay, se usa `imagen`). */
  imagenDetalle?: string;
  /** Motivo visible para el barista cuando no está disponible. */
  nota?: string;
}
