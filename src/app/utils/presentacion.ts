import { GrupoCarta } from '../models/producto';

/**
 * Datos SOLO de presentación que la API no envía (no son datos simulados: se usan
 * también con el backend real). Se asignan por id para no depender de los nombres.
 */

/** Grupo de los filtros rápidos de la carta (Café · Comida · Fríos) por id de categoría. */
const GRUPO_POR_CATEGORIA: Record<string, GrupoCarta> = {
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01': 'cafe', // Cafés Clásicos
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02': 'cafe', // Cafés Especiales y Fríos
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03': 'cafe', // Tés e Infusiones
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04': 'comida', // Tostadas y Salados
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05': 'comida', // Bollería Artesanal
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06': 'comida', // Tartas y Repostería
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07': 'frios', // Zumos y Batidos Naturales
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08': 'comida', // Combos Desayuno
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09': 'frios', // Bebidas Vegetales / Extras
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10': 'frios', // Especiales de Temporada
};

/** Las categorías nuevas que cree el admin van al grupo «Comida» hasta que se asignen aquí. */
export function grupoDeCategoria(idCategoria: string): GrupoCarta {
  return GRUPO_POR_CATEGORIA[idCategoria] ?? 'comida';
}

/** Ids de las categorías de un grupo (se envían a `GET /productos?categoriaId=…&categoriaId=…`). */
export function categoriasDelGrupo(grupo: GrupoCarta, idsCategorias: string[]): string[] {
  return idsCategorias.filter((idCategoria) => grupoDeCategoria(idCategoria) === grupo);
}

/** Fotos de /public/img por id de producto. Sin entrada → la tarjeta muestra un fondo liso. */
const IMAGEN_POR_PRODUCTO: Record<string, { imagen: string; imagenDetalle?: string }> = {
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02': { imagen: 'img/flat-white.jpg' }, // Café con Leche
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03': { imagen: 'img/cold-brew-naranja.jpg' }, // Iced Caramel Macchiato
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06': { imagen: 'img/tostada-aguacate.jpg' }, // Tostada de Aguacate y Huevo
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07': {
    imagen: 'img/roll-canela.jpg',
    imagenDetalle: 'img/roll-canela-detalle.jpg',
  }, // Croissant de Mantequilla
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08': { imagen: 'img/bowl-granola.jpg' }, // Tarta de Zanahoria
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10': { imagen: 'img/fitzone-proteina.jpg' }, // Smoothie Antiox
};

export function imagenesDeProducto(idProducto: string): { imagen?: string; imagenDetalle?: string } {
  return IMAGEN_POR_PRODUCTO[idProducto] ?? {};
}
