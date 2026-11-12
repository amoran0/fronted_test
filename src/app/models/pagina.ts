/**
 * Página de resultados tal como la devuelve Spring Data (`Page<T>`).
 * Los nombres de campo son los del JSON de la API, por eso están en inglés.
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
