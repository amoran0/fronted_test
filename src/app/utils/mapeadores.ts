import {
  CategoriaApi,
  CategoriaListadoApi,
  CuponApi,
  CuponPeticionApi,
  EstadoPedidoApi,
  PaginaApi,
  PedidoApi,
  ProductoApi,
  ProductoPeticionApi,
  RolApi,
  SesionApi,
  UsuarioApi,
} from '../models/api';
import { Cupon } from '../models/cupon';
import { PaginaResultados } from '../models/pagina';
import { EstadoPedido, Pedido } from '../models/pedido';
import { Categoria, EstadoProducto, Producto } from '../models/producto';
import { Sesion, Usuario } from '../models/usuario';
import { formatearEuros } from './formato';
import { grupoDeCategoria, imagenesDeProducto } from './presentacion';

/**
 * Traducción entre el JSON de la API (`models/api.ts`) y los modelos de pantalla.
 * Es el ÚNICO sitio que conoce los dos formatos: si la API cambia un nombre, se toca aquí.
 */

// ─── Páginas ────────────────────────────────────────────────────────────────

export function mapearPagina<A, B>(pagina: PaginaApi<A>, mapear: (dto: A) => B): PaginaResultados<B> {
  return {
    content: pagina.content.map(mapear),
    number: pagina.page.number,
    size: pagina.page.size,
    totalElements: pagina.page.totalElements,
    totalPages: Math.max(1, pagina.page.totalPages),
  };
}

// ─── Productos ──────────────────────────────────────────────────────────────

/** `activa=false` → retirado (baja lógica) · `disponible=false` → agotado. */
export function estadoDeProducto(dto: Pick<ProductoApi, 'activa' | 'disponible'>): EstadoProducto {
  if (!dto.activa) return 'retirado';
  return dto.disponible ? 'disponible' : 'agotado';
}

const NOTA_POR_ESTADO: Record<EstadoProducto, string> = {
  disponible: 'En servicio',
  agotado: 'Agotado',
  retirado: 'Retirado',
};

export function mapearProducto(dto: ProductoApi): Producto {
  const estado = estadoDeProducto(dto);
  return {
    id: dto.id,
    nombre: dto.nombre,
    descripcion: dto.descripcion ?? '',
    precio: dto.precioVenta,
    categoriaId: dto.categoriaId,
    alergenos: dto.alergenos.map((alergeno) => alergeno.nombre),
    estado,
    nota: NOTA_POR_ESTADO[estado],
    ...imagenesDeProducto(dto.id),
  };
}

/**
 * Producto de pantalla → cuerpo de POST / PUT.
 * Los alérgenos se guardan por nombre en pantalla y viajan por id (`alergenosIds`).
 */
export function productoAPeticion(
  producto: Producto,
  idAlergenoPorNombre: Map<string, string>,
): ProductoPeticionApi {
  return {
    categoriaId: producto.categoriaId,
    nombre: producto.nombre.trim(),
    descripcion: producto.descripcion?.trim() || null,
    precioVenta: Math.round(producto.precio * 100) / 100,
    disponible: producto.estado === 'disponible',
    activa: producto.estado !== 'retirado',
    iva: 10,
    alergenosIds: producto.alergenos
      .map((nombre) => idAlergenoPorNombre.get(nombre))
      .filter((id): id is string => !!id),
  };
}

// ─── Categorías ─────────────────────────────────────────────────────────────

export function mapearCategoriaListado(dto: CategoriaListadoApi): Categoria {
  return {
    id: dto.idCategoria,
    nombre: dto.nombre,
    grupo: grupoDeCategoria(dto.idCategoria),
    disponible: dto.disponible,
    productosActivos: dto.cantidadProductosActivos,
  };
}

export function mapearCategoria(dto: CategoriaApi, productosActivos = 0): Categoria {
  return {
    id: dto.id,
    nombre: dto.nombre,
    grupo: grupoDeCategoria(dto.id),
    disponible: dto.disponible,
    productosActivos,
  };
}

// ─── Pedidos ────────────────────────────────────────────────────────────────

export function estadoPedidoAApi(estado: EstadoPedido): EstadoPedidoApi {
  return estado.toUpperCase() as EstadoPedidoApi;
}

export function estadoPedidoDeApi(estado: EstadoPedidoApi): EstadoPedido {
  return estado.toLowerCase() as EstadoPedido;
}

/**
 * La API envía el descuento como un importe y el código del cupón aparte.
 * Si hay descuento sin cupón, es el de socio FitZone (RN-07: se aplica solo el mayor).
 */
export function mapearPedido(dto: PedidoApi): Pedido {
  const hayDescuento = dto.descuento > 0;
  return {
    id: dto.id,
    clienteId: dto.clienteId,
    codigo: dto.id.slice(0, 8).toUpperCase(),
    turno: `Turno ${dto.numeroTurno}`,
    numeroTurno: dto.numeroTurno,
    fecha: dto.fecha,
    lineas: dto.lineas.map((linea) => ({ ...linea })),
    subtotal: dto.subtotal,
    descuento: hayDescuento
      ? {
          tipo: dto.codigoCupon ? 'cupon' : 'socio',
          etiqueta: dto.codigoCupon ? `Cupón ${dto.codigoCupon}` : 'Socio FitZone · 10 %',
          importe: dto.descuento,
        }
      : undefined,
    total: dto.total,
    baseImponible: dto.baseImponible,
    cuotaIva: dto.cuotaIva,
    estado: estadoPedidoDeApi(dto.estado),
  };
}

// ─── Cupones ────────────────────────────────────────────────────────────────

/** Texto resumen del cupón para los listados («10 % · todos · mín. 5,00 €»). */
export function describirCupon(
  cupon: Pick<Cupon, 'tipo' | 'valor' | 'email' | 'minimoCompra'>,
): string {
  const descuento = cupon.tipo === 'porcentaje' ? `${cupon.valor} %` : formatearEuros(cupon.valor);
  const destinatario = cupon.email ? cupon.email : 'todos los productos';
  const minimo = cupon.minimoCompra ? ` · más de ${formatearEuros(cupon.minimoCompra)}` : '';
  return `${descuento} · ${destinatario}${minimo}`;
}

export function mapearCupon(dto: CuponApi): Cupon {
  const cupon: Cupon = {
    id: dto.id,
    codigo: dto.codigo,
    tipo: dto.tipo === 'PORCENTAJE' ? 'porcentaje' : 'fijo',
    valor: dto.valor,
    descripcion: '',
    desde: dto.fechaInicio ?? '',
    hasta: dto.fechaFin,
    usos: dto.usos ?? 0,
    usosMax: dto.maxUsos ?? 0,
    minimoCompra: dto.importeMin ?? 0,
    email: dto.email ?? undefined,
    activo: dto.activo,
  };
  return { ...cupon, descripcion: describirCupon(cupon) };
}

export function cuponAPeticion(cupon: Cupon): CuponPeticionApi {
  return {
    codigo: cupon.codigo.trim().toUpperCase(),
    tipo: cupon.tipo === 'porcentaje' ? 'PORCENTAJE' : 'FIJO',
    valor: cupon.valor,
    importeMin: cupon.minimoCompra || null,
    maxUsos: cupon.usosMax || null,
    fechaInicio: cupon.desde || null,
    fechaFin: cupon.hasta || null,
    email: cupon.email?.trim() || null,
    activo: cupon.activo,
  };
}

// ─── Usuarios y sesión ──────────────────────────────────────────────────────

/** El CAMARERO usa las pantallas del barista (cola de pedidos y disponibilidad). */
const ROL_DE_API: Record<RolApi, Usuario['rol']> = {
  ADMIN: 'admin',
  BARISTA: 'barista',
  CAMARERO: 'barista',
  CLIENTE: 'cliente',
};

export function mapearUsuario(dto: UsuarioApi): Usuario {
  return {
    id: dto.id,
    clienteId: dto.clienteId,
    nombre: dto.nombre,
    email: dto.email,
    rol: ROL_DE_API[dto.rol],
    dniSocio: dto.dni ?? undefined,
  };
}

export function mapearSesion(dto: SesionApi): Sesion {
  return { token: dto.token, usuario: mapearUsuario(dto.usuario) };
}
