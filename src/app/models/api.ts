/**
 * Contrato con la API REST de DWES (Spring Boot · /api/v1).
 *
 * Estas interfaces son una copia EXACTA del JSON que envía y recibe el backend:
 * mismos nombres de campo, mismos valores de los enum (en MAYÚSCULAS) y mismos formatos
 * (UUID como string, fechas `yyyy-MM-dd`, fecha-hora `yyyy-MM-ddTHH:mm:ss`).
 * Los servicios convierten estos DTO en los modelos de pantalla con `utils/mapeadores.ts`.
 *
 * Los marcados con «NUEVO» todavía no existen en el backend y hay que añadirlos
 * (ver README · «Endpoints pendientes en el backend»).
 */

// ─── Comunes ────────────────────────────────────────────────────────────────

/** `Page<T>` de Spring Data serializada con `PageSerializationMode.VIA_DTO`. */
export interface PaginaApi<T> {
  content: T[];
  page: { size: number; number: number; totalElements: number; totalPages: number };
}

/** Cuerpo de todos los errores (RFC 7807 · `ProblemDetail`). */
export interface ProblemaApi {
  status: number;
  title: string;
  detail: string;
  instance?: string;
  timestamp?: string;
  /** Solo en los 400 de validación: campo → mensaje. */
  errores?: Record<string, string>;
}

// ─── Productos, categorías y alérgenos ──────────────────────────────────────

export interface AlergenoApi {
  id: string;
  nombre: string;
}

/** `GET /productos`, `GET /productos/{id}` y respuesta de POST / PUT / PATCH. */
export interface ProductoApi {
  id: string;
  categoriaId: string;
  nombre: string;
  descripcion: string | null;
  precioBase: number | null;
  /** Precio final con IVA (10 %) incluido. */
  precioVenta: number;
  disponible: boolean;
  /** `false` = baja lógica (RN-01). */
  activa: boolean;
  iva: number | null;
  alergenos: AlergenoApi[];
}

/** Cuerpo de `POST /productos` y `PUT /productos/{id}`. */
export interface ProductoPeticionApi {
  categoriaId: string;
  nombre: string;
  descripcion?: string | null;
  precioBase?: number | null;
  precioVenta: number;
  disponible?: boolean;
  activa: boolean;
  iva?: number | null;
  alergenosIds?: string[];
}

/** `GET /categorias` (ojo: el id se llama `idCategoria`). */
export interface CategoriaListadoApi {
  idCategoria: string;
  nombre: string;
  disponible: boolean;
  cantidadProductosActivos: number;
}

/** Respuesta de `PATCH /categorias/{id}/disponibilidad` y de `POST /categorias` (NUEVO). */
export interface CategoriaApi {
  id: string;
  nombre: string;
  disponible: boolean;
}

/** Cuerpo de `PATCH /productos/{id}/disponibilidad` y `PATCH /categorias/{id}/disponibilidad`. */
export interface DisponibilidadPeticionApi {
  disponible: boolean;
}

// ─── Pedidos ────────────────────────────────────────────────────────────────

export type EstadoPedidoApi = 'PENDIENTE' | 'EN_PREPARACION' | 'LISTO' | 'ENTREGADO' | 'CANCELADO';

export interface LineaPedidoApi {
  productoId: string;
  nombre: string;
  cantidad: number;
  /** Precio vigente al crear el pedido (RN-03). */
  precioUnitario: number;
}

export interface PedidoApi {
  id: string;
  clienteId: string;
  /** Nº de pedidos creados ese día + 1 (RN-09). */
  numeroTurno: number;
  estado: EstadoPedidoApi;
  fecha: string;
  lineas: LineaPedidoApi[];
  subtotal: number;
  descuento: number;
  total: number;
  baseImponible: number;
  cuotaIva: number;
  /** Código del cupón aplicado; `null` si no hubo cupón (o ganó el descuento de socio). */
  codigoCupon: string | null;
}

/** Cuerpo de `POST /pedidos`. Totales, IVA y turno los calcula siempre el servidor. */
export interface PedidoPeticionApi {
  clienteId: string;
  lineas: { productoId: string; cantidad: number }[];
  codigoCupon?: string | null;
  dniSocio?: string | null;
}

export interface EstadoPedidoPeticionApi {
  estado: EstadoPedidoApi;
}

// ─── Cupones ────────────────────────────────────────────────────────────────

export type TipoCuponApi = 'FIJO' | 'PORCENTAJE';

/** Respuesta de `POST /cupones` y elementos de `GET /cupones` (NUEVO). */
export interface CuponApi {
  id: string;
  codigo: string;
  tipo: TipoCuponApi;
  valor: number;
  importeMin: number | null;
  maxUsos: number | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  activo: boolean;
  email: string | null;
  /** NUEVO: pedidos no cancelados que usan el cupón (solo en `GET /cupones`). */
  usos?: number;
}

/** Cuerpo de `POST /cupones` y `PUT /cupones/{id}` (NUEVO). */
export interface CuponPeticionApi {
  codigo: string;
  tipo: TipoCuponApi;
  valor: number;
  importeMin?: number | null;
  maxUsos?: number | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  email?: string | null;
  /** NUEVO: permite desactivar un cupón al editarlo. */
  activo?: boolean;
}

export interface ValidacionCuponPeticionApi {
  codigo: string;
  subtotal: number;
  email?: string | null;
}

export interface ValidacionCuponApi {
  codigo: string;
  descuento: number;
  total: number;
}

// ─── Informes (solo pedidos ENTREGADO, RN-10) ───────────────────────────────

/** `GET /informes/ventas-dia?fecha=` */
export interface VentasDiaApi {
  numeroPedidos: number;
  total: number;
  base: number;
  iva: number;
  /** NUEVO: suma de descuentos aplicados ese día. */
  descuentos?: number;
}

/** `GET /informes/productos-top?desde=&hasta=&limite=` */
export interface ProductoTopApi {
  productoId: string;
  nombre: string;
  unidadesVendidas: number;
  totalVendido: number;
}

/** NUEVO · `GET /informes/ventas-franja?fecha=` → una entrada por hora con ventas. */
export interface VentaFranjaApi {
  hora: number;
  total: number;
}

// ─── Autenticación (NUEVO, con Spring Security + JWT) ───────────────────────

export type RolApi = 'ADMIN' | 'BARISTA' | 'CAMARERO' | 'CLIENTE';

export interface UsuarioApi {
  id: string;
  /** Id del Cliente asociado (solo rol CLIENTE). Es el que se usa en los pedidos. */
  clienteId: string | null;
  nombre: string;
  email: string;
  rol: RolApi;
  dni: string | null;
}

/** Respuesta de `POST /auth/login` y `POST /auth/registro`. */
export interface SesionApi {
  token: string;
  usuario: UsuarioApi;
}

export interface LoginPeticionApi {
  email: string;
  contrasena: string;
}

export interface RegistroPeticionApi {
  nombre: string;
  email: string;
  dni: string;
  contrasena: string;
}
