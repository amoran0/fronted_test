/** Nombre del alérgeno; el admin puede añadir nuevos además de los iniciales. */
export type Alergeno = string;

/** Alérgenos con los que arranca la carta. */
export const ALERGENOS: Alergeno[] = ['Gluten', 'Leche', 'Huevo', 'Sésamo', 'Frutos secos', 'Soja'];

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
  grupo: GrupoCarta;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  /** Precio final con IVA (21 %) incluido. */
  precio: number;
  categoriaId: string;
  alergenos: Alergeno[];
  estado: EstadoProducto;
  /** Ruta relativa a /public, p. ej. `img/flat-white.jpg`. */
  imagen?: string;
  /** Foto vertical opcional para la ficha de detalle (si no hay, se usa `imagen`). */
  imagenDetalle?: string;
  /** Motivo visible para el barista cuando no está disponible. */
  nota?: string;
}
