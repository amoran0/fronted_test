import { PaginaResultados } from '../models/pagina';
import { Categoria, Producto } from '../models/producto';
import { ParametrosConsulta } from '../services/servicio-api';

/** Filtros que el cliente puede aplicar en la carta. */
export interface FiltrosCarta {
  texto: string;
  /** Grupo de categoría (`cafe`, `comida`, `frios`) o `todos`. */
  grupo: string;
  /** `disponible`, `agotado` o `todos`. */
  estado: string;
  precioMaximo: number;
  alergenosExcluidos: string[];
}

/**
 * Traduce los filtros y la página a los parámetros de la URL de `GET /productos`.
 * Si los nombres de la API cambian, solo hay que tocarlos aquí.
 */
export function parametrosDeFiltrosCarta(
  filtros: FiltrosCarta,
  pagina: number,
  tamanoPagina: number,
): ParametrosConsulta {
  return {
    nombre: filtros.texto.trim() || undefined,
    grupo: filtros.grupo === 'todos' ? undefined : filtros.grupo,
    estado: filtros.estado === 'todos' ? undefined : filtros.estado,
    precioMax: filtros.precioMaximo,
    sinAlergenos: filtros.alergenosExcluidos,
    page: pagina,
    size: tamanoPagina,
  };
}

/** Aplica los filtros de la carta a una lista de productos (lo que hace la API con datos simulados). */
export function filtrarProductos(
  productos: Producto[],
  categorias: Categoria[],
  filtros: FiltrosCarta,
): Producto[] {
  const busqueda = filtros.texto.trim().toLowerCase();
  const categoriasPorId = new Map(categorias.map((categoria) => [categoria.id, categoria]));
  return productos.filter((producto) => {
    const categoria = categoriasPorId.get(producto.categoriaId);
    const coincideBusqueda =
      !busqueda ||
      producto.nombre.toLowerCase().includes(busqueda) ||
      !!categoria?.nombre.toLowerCase().includes(busqueda);
    const coincideGrupo = filtros.grupo === 'todos' || categoria?.grupo === filtros.grupo;
    const coincideEstado = filtros.estado === 'todos' || producto.estado === filtros.estado;
    const dentroDePrecio = producto.precio <= filtros.precioMaximo;
    const sinAlergenoExcluido = !filtros.alergenosExcluidos.some((alergeno) =>
      producto.alergenos.includes(alergeno),
    );
    return (
      coincideBusqueda && coincideGrupo && coincideEstado && dentroDePrecio && sinAlergenoExcluido
    );
  });
}

/** Corta una lista en páginas con el mismo formato que la API. */
export function paginar<T>(
  elementos: T[],
  pagina: number,
  tamanoPagina: number,
): PaginaResultados<T> {
  const totalPages = Math.max(1, Math.ceil(elementos.length / tamanoPagina));
  const paginaValida = Math.min(Math.max(0, pagina), totalPages - 1);
  const inicio = paginaValida * tamanoPagina;
  return {
    content: elementos.slice(inicio, inicio + tamanoPagina),
    number: paginaValida,
    size: tamanoPagina,
    totalElements: elementos.length,
    totalPages,
  };
}
