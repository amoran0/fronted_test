import { GrupoCarta } from '../models/producto';
import { ParametrosConsulta } from '../services/servicio-api';
import { categoriasDelGrupo } from './presentacion';

/** Filtros que el cliente puede aplicar en la carta. */
export interface FiltrosCarta {
  texto: string;
  /** Grupo de categoría (`cafe`, `comida`, `frios`) o `todos`. */
  grupo: string;
  /** `disponible`, `agotado` o `todos`. */
  estado: string;
  precioMaximo: number;
  /** Nombres de los alérgenos que el cliente quiere evitar. */
  alergenosExcluidos: string[];
}

/** Datos del catálogo necesarios para traducir los filtros de pantalla a ids de la API. */
export interface CatalogoFiltros {
  idsCategorias: string[];
  idAlergenoPorNombre: Map<string, string>;
}

/**
 * Traduce los filtros y la página a los parámetros de `GET /productos` de la API:
 * `nombre`, `categoriaId` (repetido), `disponible`, `precioMaximo`, `sinAlergenoId` (repetido),
 * `page` (empieza en 0), `size` y `sort`. Si la API cambia un nombre, solo se toca aquí.
 */
export function parametrosDeFiltrosCarta(
  filtros: FiltrosCarta,
  pagina: number,
  tamanoPagina: number,
  catalogo: CatalogoFiltros,
): ParametrosConsulta {
  return {
    nombre: filtros.texto.trim() || undefined,
    categoriaId:
      filtros.grupo === 'todos'
        ? undefined
        : categoriasDelGrupo(filtros.grupo as GrupoCarta, catalogo.idsCategorias),
    disponible: filtros.estado === 'todos' ? undefined : filtros.estado === 'disponible',
    precioMaximo: filtros.precioMaximo,
    sinAlergenoId: filtros.alergenosExcluidos
      .map((nombre) => catalogo.idAlergenoPorNombre.get(nombre))
      .filter((id): id is string => !!id),
    page: pagina,
    size: tamanoPagina,
  };
}
