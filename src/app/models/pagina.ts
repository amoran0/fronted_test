/**
 * Página de resultados para las pantallas. La API la envía anidada
 * (`{ content, page: { number, size, … } }`, ver `PaginaApi`) y `mapearPagina` la aplana.
 */
export interface PaginaResultados<T> {
  content: T[];
  /** Número de página (empieza en 0). */
  number: number;
  /** Elementos por página. */
  size: number;
  totalElements: number;
  totalPages: number;
}
