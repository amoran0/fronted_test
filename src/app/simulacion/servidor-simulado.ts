/**
 * Servidor simulado: imita la API de Spring Boot (rutas, JSON, códigos HTTP, reglas de negocio
 * RN-01…RN-10, roles y errores `ProblemDetail`). Lo usa `interceptor-simulado.ts`.
 * Solo existe para desarrollar sin backend: con la API real no se carga.
 */
import {
  AlergenoApi,
  CategoriaApi,
  CategoriaListadoApi,
  CuponApi,
  CuponPeticionApi,
  EstadoPedidoApi,
  LoginPeticionApi,
  PaginaApi,
  PedidoApi,
  PedidoPeticionApi,
  ProblemaApi,
  ProductoApi,
  ProductoPeticionApi,
  ProductoTopApi,
  RegistroPeticionApi,
  RolApi,
  SesionApi,
  ValidacionCuponApi,
  ValidacionCuponPeticionApi,
  VentaFranjaApi,
  VentasDiaApi,
} from '../models/api';
import {
  BaseDatosSimulada,
  CuponSimulado,
  PedidoSimulado,
  ProductoSimulado,
  SOCIOS_FITZONE_ACTIVOS,
  UsuarioSimulado,
  crearBaseDatosSimulada,
} from './datos-simulados';

export interface PeticionSimulada {
  metodo: string;
  /** Ruta sin la URL base ni la query, p. ej. `/productos/123`. */
  ruta: string;
  parametros: { get(nombre: string): string | null; getAll(nombre: string): string[] | null };
  cuerpo: unknown;
  /** Cabecera `Authorization` recibida. */
  autorizacion: string | null;
}

export interface RespuestaSimulada {
  estado: number;
  cuerpo: unknown;
}

/** Error que el interceptor convierte en una respuesta HTTP con cuerpo `ProblemDetail`. */
export class ErrorSimulado extends Error {
  constructor(
    readonly estado: number,
    readonly titulo: string,
    detalle: string,
    readonly errores?: Record<string, string>,
  ) {
    super(detalle);
  }

  aProblema(instancia: string): ProblemaApi {
    return {
      status: this.estado,
      title: this.titulo,
      detail: this.message,
      instance: '/api/v1' + instancia,
      timestamp: fechaHoraLocal(new Date()),
      ...(this.errores ? { errores: this.errores } : {}),
    };
  }
}

// ─── Estado en memoria ──────────────────────────────────────────────────────

const bd: BaseDatosSimulada = crearBaseDatosSimulada();
const PREFIJO_TOKEN = 'simulado.';

// ─── Utilidades ─────────────────────────────────────────────────────────────

const redondear = (valor: number) => Math.round((valor + Number.EPSILON) * 100) / 100;
const uuid = () => crypto.randomUUID();
const dosCifras = (numero: number) => String(numero).padStart(2, '0');

function fechaLocal(fecha: Date): string {
  return `${fecha.getFullYear()}-${dosCifras(fecha.getMonth() + 1)}-${dosCifras(fecha.getDate())}`;
}

/** Formato de `LocalDateTime` de Java: `2026-11-13T16:25:29`. */
function fechaHoraLocal(fecha: Date): string {
  return `${fechaLocal(fecha)}T${dosCifras(fecha.getHours())}:${dosCifras(fecha.getMinutes())}:${dosCifras(fecha.getSeconds())}`;
}

const noEncontrado = (detalle: string) => new ErrorSimulado(404, 'Elemento no encontrado', detalle);
const reglaNegocio = (detalle: string) => new ErrorSimulado(422, 'Regla de negocio no cumplida', detalle);
const duplicado = (detalle: string) => new ErrorSimulado(409, 'Elemento duplicado', detalle);
const parametroNoValido = (detalle: string) => new ErrorSimulado(400, 'Parámetro no válido', detalle);

/** 400 con los mensajes por campo, como `MethodArgumentNotValidException` en el backend. */
function validar(errores: Record<string, string | false>): void {
  const erroresReales = Object.fromEntries(
    Object.entries(errores).filter((entrada): entrada is [string, string] => !!entrada[1]),
  );
  if (Object.keys(erroresReales).length)
    throw new ErrorSimulado(400, 'Datos no válidos', 'Revisa los campos indicados', erroresReales);
}

const tieneMasDeDosDecimales = (valor: number) => Math.round(valor * 100) !== valor * 100;
const estaVacio = (texto: unknown) => typeof texto !== 'string' || !texto.trim();

function paginar<T>(elementos: T[], peticion: PeticionSimulada): PaginaApi<T> {
  const size = Math.max(1, Number(peticion.parametros.get('size') ?? 20));
  const totalPages = Math.ceil(elementos.length / size);
  const number = Math.max(0, Number(peticion.parametros.get('page') ?? 0));
  return {
    content: elementos.slice(number * size, number * size + size),
    page: { size, number, totalElements: elementos.length, totalPages },
  };
}

// ─── Seguridad (imita Spring Security + JWT) ────────────────────────────────

function usuarioDeLaPeticion(peticion: PeticionSimulada): UsuarioSimulado | null {
  const token = peticion.autorizacion?.replace(/^Bearer\s+/, '') ?? '';
  if (!token.startsWith(PREFIJO_TOKEN)) return null;
  return bd.usuarios.find((usuario) => usuario.id === token.slice(PREFIJO_TOKEN.length)) ?? null;
}

/** 401 sin sesión · 403 si el rol no está en la lista (lista vacía = cualquier usuario autenticado). */
function exigirRol(peticion: PeticionSimulada, ...roles: RolApi[]): UsuarioSimulado {
  const usuario = usuarioDeLaPeticion(peticion);
  if (!usuario)
    throw new ErrorSimulado(401, 'No autenticado', 'Inicia sesión para acceder a este recurso');
  if (roles.length && !roles.includes(usuario.rol))
    throw new ErrorSimulado(403, 'Acceso denegado', 'Tu rol no permite esta operación');
  return usuario;
}

const clienteDeUsuario = (usuario: UsuarioSimulado | null) =>
  usuario ? (bd.clientes.find((cliente) => cliente.usuarioId === usuario.id) ?? null) : null;

function sesionDe(usuario: UsuarioSimulado): SesionApi {
  const cliente = clienteDeUsuario(usuario);
  return {
    token: PREFIJO_TOKEN + usuario.id,
    usuario: {
      id: usuario.id,
      clienteId: cliente?.id ?? null,
      nombre: cliente?.nombre ?? usuario.email.split('@')[0],
      email: usuario.email,
      rol: usuario.rol,
      dni: cliente?.dni ?? null,
    },
  };
}

// ─── Conversión de tablas a DTO ─────────────────────────────────────────────

function productoApi(producto: ProductoSimulado): ProductoApi {
  const { alergenosIds, ...resto } = producto;
  return {
    ...resto,
    alergenos: alergenosIds
      .map((id) => bd.alergenos.find((alergeno) => alergeno.id === id))
      .filter((alergeno): alergeno is AlergenoApi => !!alergeno),
  };
}

function pedidoApi(pedido: PedidoSimulado): PedidoApi {
  const { cuponId, lineas, ...resto } = pedido;
  return {
    ...resto,
    lineas: lineas.map((linea) => ({
      ...linea,
      nombre: bd.productos.find((producto) => producto.id === linea.productoId)?.nombre ?? '—',
    })),
    codigoCupon: bd.cupones.find((cupon) => cupon.id === cuponId)?.codigo ?? null,
  };
}

/** Usos = pedidos no cancelados con el cupón (al cancelar se devuelve el uso, RN-08). */
const usosDeCupon = (cupon: CuponSimulado) =>
  bd.pedidos.filter((pedido) => pedido.cuponId === cupon.id && pedido.estado !== 'CANCELADO').length;

const cuponApi = (cupon: CuponSimulado): CuponApi => ({ ...cupon, usos: usosDeCupon(cupon) });

function buscarProducto(id: string): ProductoSimulado {
  const producto = bd.productos.find((productoBuscado) => productoBuscado.id === id);
  if (!producto) throw noEncontrado(`No existe ningún producto con id ${id}`);
  return producto;
}

function buscarProductoActivo(id: string): ProductoSimulado {
  const producto = buscarProducto(id);
  if (!producto.activa) throw noEncontrado(`El producto con id ${id} está dado de baja (RN-01)`);
  return producto;
}

// ─── Productos, categorías y alérgenos ──────────────────────────────────────

function listarProductos(peticion: PeticionSimulada): PaginaApi<ProductoApi> {
  const p = peticion.parametros;
  const esAdmin = usuarioDeLaPeticion(peticion)?.rol === 'ADMIN';
  const incluirInactivos = esAdmin && p.get('incluirInactivos') === 'true';
  const categorias = p.getAll('categoriaId') ?? [];
  const sinAlergenos = p.getAll('sinAlergenoId') ?? [];
  const nombre = p.get('nombre')?.trim().toLowerCase();
  const precioMaximo = p.get('precioMaximo');
  if (precioMaximo !== null && isNaN(Number(precioMaximo)))
    throw parametroNoValido(`El parámetro 'precioMaximo' tiene un valor no válido ('${precioMaximo}'). Se espera un número`);
  const disponible = p.get('disponible');
  const filtrados = bd.productos
    .filter((producto) => incluirInactivos || producto.activa)
    .filter((producto) => !categorias.length || categorias.includes(producto.categoriaId))
    .filter((producto) => !nombre || producto.nombre.toLowerCase().includes(nombre))
    .filter((producto) => precioMaximo === null || producto.precioVenta <= Number(precioMaximo))
    .filter((producto) => disponible === null || String(producto.disponible) === disponible)
    .filter((producto) => !producto.alergenosIds.some((id) => sinAlergenos.includes(id)))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
  return paginar(filtrados.map(productoApi), peticion);
}

function guardarProducto(producto: ProductoSimulado, cuerpo: ProductoPeticionApi): ProductoApi {
  validar({
    categoriaId: !cuerpo.categoriaId && 'La categoría es obligatoria',
    nombre: estaVacio(cuerpo.nombre) && 'El nombre es obligatorio',
    precioVenta:
      cuerpo.precioVenta == null
        ? 'El precio de venta es obligatorio'
        : cuerpo.precioVenta <= 0
          ? 'El precio debe ser positivo'
          : tieneMasDeDosDecimales(cuerpo.precioVenta) &&
            'El precio de venta admite como máximo 6 cifras enteras y 2 decimales',
    activa: cuerpo.activa == null && 'Activo o inactivo es obligatorio',
    iva:
      cuerpo.iva != null &&
      (cuerpo.iva < 0 || cuerpo.iva > 100) &&
      'El IVA debe estar entre 0 y 100',
  });
  const categoria = bd.categorias.find((categoriaBuscada) => categoriaBuscada.id === cuerpo.categoriaId);
  if (!categoria) throw noEncontrado(`No existe ninguna categoría con id ${cuerpo.categoriaId}`);
  const alergenosIds = cuerpo.alergenosIds ?? [];
  const noExisten = alergenosIds.filter((id) => !bd.alergenos.some((alergeno) => alergeno.id === id));
  if (noExisten.length) throw noEncontrado(`No existen los alérgenos con id [${noExisten.join(', ')}]`);
  Object.assign(producto, {
    categoriaId: categoria.id,
    nombre: cuerpo.nombre.trim(),
    descripcion: cuerpo.descripcion ?? producto.descripcion ?? null,
    precioBase: cuerpo.precioBase ?? producto.precioBase ?? null,
    precioVenta: cuerpo.precioVenta,
    disponible: categoria.disponible && (cuerpo.disponible ?? producto.disponible ?? true),
    activa: cuerpo.activa,
    iva: cuerpo.iva ?? 10,
    alergenosIds,
  });
  return productoApi(producto);
}

function listarCategorias(): CategoriaListadoApi[] {
  return bd.categorias.map((categoria) => ({
    idCategoria: categoria.id,
    nombre: categoria.nombre,
    disponible: categoria.disponible,
    cantidadProductosActivos: bd.productos.filter(
      (producto) => producto.categoriaId === categoria.id && producto.activa,
    ).length,
  }));
}

// ─── Cupones (RN-06) ────────────────────────────────────────────────────────

function cuponValido(codigo: string, subtotal: number, email: string | null | undefined): CuponSimulado {
  const cupon = bd.cupones.find((cuponBuscado) => cuponBuscado.codigo.toUpperCase() === codigo.trim().toUpperCase());
  if (!cupon) throw noEncontrado(`No existe ningún cupón con el código '${codigo}' (RN-06)`);
  const hoy = fechaLocal(new Date());
  if (!cupon.activo) throw reglaNegocio(`El cupón '${cupon.codigo}' está desactivado (RN-06)`);
  if ((cupon.fechaInicio && hoy < cupon.fechaInicio) || (cupon.fechaFin && hoy > cupon.fechaFin))
    throw reglaNegocio(
      `El cupón '${cupon.codigo}' solo es válido del ${cupon.fechaInicio} al ${cupon.fechaFin} y hoy es ${hoy} (RN-06)`,
    );
  if (cupon.maxUsos != null && usosDeCupon(cupon) >= cupon.maxUsos)
    throw reglaNegocio(`El cupón '${cupon.codigo}' ya ha alcanzado su máximo de ${cupon.maxUsos} usos (RN-06)`);
  if (cupon.importeMin != null && subtotal <= cupon.importeMin)
    throw reglaNegocio(
      `El cupón '${cupon.codigo}' exige un subtotal superior a ${cupon.importeMin.toFixed(2)} € y el pedido suma ${subtotal.toFixed(2)} € (RN-06)`,
    );
  if (cupon.email && cupon.email.toLowerCase() !== (email ?? '').toLowerCase())
    throw reglaNegocio(
      `El cupón '${cupon.codigo}' es personal y no pertenece al email ${email || '(no indicado)'} (RN-06)`,
    );
  return cupon;
}

function descuentoDeCupon(cupon: CuponSimulado, subtotal: number): number {
  const descuento = cupon.tipo === 'PORCENTAJE' ? (subtotal * cupon.valor) / 100 : cupon.valor;
  return redondear(Math.max(0, Math.min(descuento, subtotal)));
}

function guardarCupon(cupon: CuponSimulado, cuerpo: CuponPeticionApi): CuponApi {
  validar({
    codigo: estaVacio(cuerpo.codigo) && 'El código es obligatorio',
    tipo: !['FIJO', 'PORCENTAJE'].includes(cuerpo.tipo) && 'El tipo es obligatorio (PORCENTAJE o FIJO)',
    valor:
      cuerpo.valor == null
        ? 'El valor es obligatorio'
        : cuerpo.valor <= 0 && 'El valor debe ser mayor que 0',
    importeMin: (cuerpo.importeMin ?? 0) < 0 && 'El importe mínimo no puede ser negativo',
    maxUsos: cuerpo.maxUsos != null && cuerpo.maxUsos <= 0 && 'El máximo de usos debe ser mayor que 0',
    email: !!cuerpo.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cuerpo.email) && 'El email no tiene un formato válido',
  });
  const codigo = cuerpo.codigo.trim().toUpperCase();
  if (bd.cupones.some((otro) => otro.id !== cupon.id && otro.codigo === codigo))
    throw duplicado(`Ya existe un cupón con el código '${codigo}'; los códigos no pueden repetirse`);
  if (cuerpo.fechaInicio && cuerpo.fechaFin && cuerpo.fechaFin < cuerpo.fechaInicio)
    throw reglaNegocio(
      `La fecha de fin (${cuerpo.fechaFin}) no puede ser anterior a la de inicio (${cuerpo.fechaInicio})`,
    );
  if (cuerpo.tipo === 'PORCENTAJE' && cuerpo.valor > 100)
    throw reglaNegocio(`Un cupón de tipo PORCENTAJE no puede superar el 100 % y se ha indicado ${cuerpo.valor} %`);
  Object.assign(cupon, {
    codigo,
    tipo: cuerpo.tipo,
    valor: cuerpo.valor,
    importeMin: cuerpo.importeMin ?? null,
    maxUsos: cuerpo.maxUsos ?? null,
    fechaInicio: cuerpo.fechaInicio ?? null,
    fechaFin: cuerpo.fechaFin ?? null,
    email: cuerpo.email ?? null,
    activo: cuerpo.activo ?? cupon.activo ?? true,
  });
  return cuponApi(cupon);
}

// ─── Pedidos (RN-01 … RN-09) ────────────────────────────────────────────────

const TRANSICIONES: Record<EstadoPedidoApi, EstadoPedidoApi[]> = {
  PENDIENTE: ['EN_PREPARACION', 'CANCELADO'],
  EN_PREPARACION: ['LISTO'],
  LISTO: ['ENTREGADO'],
  ENTREGADO: [],
  CANCELADO: [],
};

function crearPedido(usuario: UsuarioSimulado, cuerpo: PedidoPeticionApi): PedidoApi {
  // Un cliente siempre pide a su nombre: el clienteId sale del token, no del cuerpo.
  const clienteId = usuario.rol === 'CLIENTE' ? clienteDeUsuario(usuario)?.id : cuerpo.clienteId;
  validar({
    clienteId: !clienteId && 'El cliente es obligatorio',
    lineas: !cuerpo.lineas?.length && 'El pedido debe tener líneas',
  });
  const cliente = bd.clientes.find((clienteBuscado) => clienteBuscado.id === clienteId);
  if (!cliente) throw noEncontrado(`No existe ningún cliente con id ${clienteId}`);

  // RN-04: cada línea entre 1 y 20 antes de agrupar; después, 1–15 productos y 1–20 unidades por producto
  cuerpo.lineas.forEach((linea, indice) => {
    if (!Number.isInteger(linea.cantidad) || linea.cantidad < 1 || linea.cantidad > 20)
      throw reglaNegocio(`La línea ${indice + 1} tiene ${linea.cantidad} unidades y cada línea debe tener entre 1 y 20 (RN-04)`);
  });
  const cantidades = new Map<string, number>();
  cuerpo.lineas.forEach((linea) =>
    cantidades.set(linea.productoId, (cantidades.get(linea.productoId) ?? 0) + linea.cantidad),
  );
  if (cantidades.size > 15)
    throw reglaNegocio(`Un pedido debe tener entre 1 y 15 líneas (productos distintos) y se han recibido ${cantidades.size} (RN-04)`);

  let subtotal = 0;
  const lineas = [...cantidades].map(([productoId, cantidad]) => {
    const producto = buscarProducto(productoId);
    if (cantidad > 20)
      throw reglaNegocio(
        `La línea del producto '${producto.nombre}' tiene ${cantidad} unidades y debe tener entre 1 y 20 (si el producto se repite, se suman sus cantidades) (RN-04)`,
      );
    const categoria = bd.categorias.find((categoriaBuscada) => categoriaBuscada.id === producto.categoriaId);
    if (!producto.activa)
      throw reglaNegocio(`El producto '${producto.nombre}' (id ${producto.id}) está dado de baja y no se puede pedir (RN-02)`);
    if (!categoria?.disponible)
      throw reglaNegocio(
        `El producto '${producto.nombre}' (id ${producto.id}) está agotado porque su categoría '${categoria?.nombre}' está agotada y no se puede pedir (RN-02)`,
      );
    if (!producto.disponible)
      throw reglaNegocio(`El producto '${producto.nombre}' (id ${producto.id}) está agotado y no se puede pedir (RN-02)`);
    subtotal += producto.precioVenta * cantidad;
    return { productoId, cantidad, precioUnitario: producto.precioVenta }; // RN-03
  });
  subtotal = redondear(subtotal);

  // RN-07: cupón o socio FitZone, se aplica el mayor
  let descuento = 0;
  let cupon: CuponSimulado | null = null;
  if (cuerpo.codigoCupon?.trim()) {
    cupon = cuponValido(cuerpo.codigoCupon, subtotal, cliente.email);
    descuento = descuentoDeCupon(cupon, subtotal);
  }
  if (cuerpo.dniSocio?.trim() && SOCIOS_FITZONE_ACTIVOS.includes(cuerpo.dniSocio.trim().toUpperCase())) {
    const descuentoSocio = redondear(subtotal * 0.1);
    if (descuentoSocio > descuento) {
      descuento = descuentoSocio;
      cupon = null;
    }
  }

  // RN-05: total nunca negativo; base = total / 1,10
  descuento = redondear(Math.min(descuento, subtotal));
  const total = redondear(subtotal - descuento);
  const baseImponible = redondear(total / 1.1);
  const ahora = new Date();
  const hoy = fechaLocal(ahora);
  const pedido: PedidoSimulado = {
    id: uuid(),
    clienteId: cliente.id,
    cuponId: cupon?.id ?? null,
    estado: 'PENDIENTE',
    fecha: fechaHoraLocal(ahora),
    numeroTurno: bd.pedidos.filter((otro) => otro.fecha.startsWith(hoy)).length + 1, // RN-09
    subtotal,
    descuento,
    total,
    baseImponible,
    cuotaIva: redondear(total - baseImponible),
    lineas,
  };
  bd.pedidos.push(pedido);
  return pedidoApi(pedido);
}

function buscarPedido(id: string): PedidoSimulado {
  const pedido = bd.pedidos.find((pedidoBuscado) => pedidoBuscado.id === id);
  if (!pedido) throw noEncontrado(`No existe ningún pedido con id ${id}`);
  return pedido;
}

/** Un cliente solo puede ver (y cancelar) sus propios pedidos. */
function comprobarPropietario(usuario: UsuarioSimulado, pedido: PedidoSimulado): void {
  if (usuario.rol === 'CLIENTE' && clienteDeUsuario(usuario)?.id !== pedido.clienteId)
    throw new ErrorSimulado(403, 'Acceso denegado', 'Solo puedes consultar tus propios pedidos');
}

function listarPedidos(usuario: UsuarioSimulado, peticion: PeticionSimulada): PaginaApi<PedidoApi> {
  const p = peticion.parametros;
  const estado = p.get('estado');
  if (estado && !(estado in TRANSICIONES))
    throw parametroNoValido(
      `El parámetro 'estado' tiene un valor no válido ('${estado}'). Valores admitidos: [${Object.keys(TRANSICIONES).join(', ')}]`,
    );
  const desde = p.get('desde');
  const hasta = p.get('hasta');
  if (desde && hasta && hasta < desde)
    throw parametroNoValido("La fecha 'hasta' no puede ser anterior a la fecha 'desde'");
  const clienteId = usuario.rol === 'CLIENTE' ? clienteDeUsuario(usuario)?.id : p.get('clienteId');
  const [campoOrden, sentido] = (p.get('sort') ?? 'fecha,asc').split(',');
  if (!['fecha', 'numeroTurno', 'total', 'estado'].includes(campoOrden))
    throw parametroNoValido("El parámetro 'sort' hace referencia a un campo que no existe");
  const pedidos = bd.pedidos
    .filter((pedido) => !clienteId || pedido.clienteId === clienteId)
    .filter((pedido) => !estado || pedido.estado === estado)
    .filter((pedido) => !desde || pedido.fecha.slice(0, 10) >= desde)
    .filter((pedido) => !hasta || pedido.fecha.slice(0, 10) <= hasta)
    .sort((a, b) => {
      const valorA = a[campoOrden as keyof PedidoSimulado] as string | number;
      const valorB = b[campoOrden as keyof PedidoSimulado] as string | number;
      const comparacion = valorA < valorB ? -1 : valorA > valorB ? 1 : 0;
      return sentido === 'desc' ? -comparacion : comparacion;
    });
  return paginar(pedidos.map(pedidoApi), peticion);
}

function cambiarEstadoPedido(usuario: UsuarioSimulado, id: string, cuerpo: { estado?: string }): PedidoApi {
  const pedido = buscarPedido(id);
  validar({ estado: !cuerpo?.estado && 'El estado es obligatorio' });
  const nuevo = cuerpo.estado as EstadoPedidoApi;
  if (!(nuevo in TRANSICIONES))
    throw new ErrorSimulado(
      400,
      'Cuerpo de la petición no válido',
      `El campo 'estado' tiene un valor no válido ('${nuevo}'). Valores admitidos: [${Object.keys(TRANSICIONES).join(', ')}]`,
    );
  if (usuario.rol === 'CLIENTE') {
    comprobarPropietario(usuario, pedido);
    if (nuevo !== 'CANCELADO')
      throw new ErrorSimulado(403, 'Acceso denegado', 'Un cliente solo puede cancelar sus pedidos');
  }
  if (!TRANSICIONES[pedido.estado].includes(nuevo))
    throw reglaNegocio(
      `El pedido ${id} no puede pasar de ${pedido.estado} a ${nuevo}. Transiciones válidas: PENDIENTE → EN_PREPARACION → LISTO → ENTREGADO y PENDIENTE → CANCELADO (RN-08)`,
    );
  pedido.estado = nuevo;
  return pedidoApi(pedido);
}

// ─── Informes (RN-10: solo ENTREGADO) ───────────────────────────────────────

function fechaObligatoria(peticion: PeticionSimulada, nombre: string): string {
  const valor = peticion.parametros.get(nombre);
  if (!valor) throw new ErrorSimulado(400, 'Parámetro obligatorio', `Falta el parámetro obligatorio '${nombre}'`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor))
    throw parametroNoValido(`El parámetro '${nombre}' tiene un valor no válido ('${valor}'). Se espera una fecha con formato yyyy-MM-dd`);
  return valor;
}

const entregadosDelDia = (fecha: string) =>
  bd.pedidos.filter((pedido) => pedido.estado === 'ENTREGADO' && pedido.fecha.startsWith(fecha));

const sumar = (pedidos: PedidoSimulado[], campo: 'total' | 'baseImponible' | 'cuotaIva' | 'descuento') =>
  redondear(pedidos.reduce((suma, pedido) => suma + pedido[campo], 0));

function ventasDia(peticion: PeticionSimulada): VentasDiaApi {
  const pedidos = entregadosDelDia(fechaObligatoria(peticion, 'fecha'));
  return {
    numeroPedidos: pedidos.length,
    total: sumar(pedidos, 'total'),
    base: sumar(pedidos, 'baseImponible'),
    iva: sumar(pedidos, 'cuotaIva'),
    descuentos: sumar(pedidos, 'descuento'),
  };
}

function ventasFranja(peticion: PeticionSimulada): VentaFranjaApi[] {
  const pedidos = entregadosDelDia(fechaObligatoria(peticion, 'fecha'));
  return Array.from({ length: 13 }, (_, indice) => indice + 8).map((hora) => ({
    hora,
    total: sumar(pedidos.filter((pedido) => Number(pedido.fecha.slice(11, 13)) === hora), 'total'),
  }));
}

function productosTop(peticion: PeticionSimulada): ProductoTopApi[] {
  const desde = fechaObligatoria(peticion, 'desde');
  const hasta = fechaObligatoria(peticion, 'hasta');
  const limite = Number(peticion.parametros.get('limite') ?? 10);
  if (!Number.isInteger(limite) || limite < 1 || limite > 100)
    throw parametroNoValido("El parámetro 'limite' debe estar entre 1 y 100");
  if (hasta < desde) throw parametroNoValido("La fecha 'hasta' no puede ser anterior a la fecha 'desde'");
  const acumulado = new Map<string, ProductoTopApi>();
  bd.pedidos
    .filter((pedido) => pedido.estado === 'ENTREGADO')
    .filter((pedido) => pedido.fecha.slice(0, 10) >= desde && pedido.fecha.slice(0, 10) <= hasta)
    .flatMap((pedido) => pedido.lineas)
    .forEach((linea) => {
      const actual = acumulado.get(linea.productoId) ?? {
        productoId: linea.productoId,
        nombre: bd.productos.find((producto) => producto.id === linea.productoId)?.nombre ?? '—',
        unidadesVendidas: 0,
        totalVendido: 0,
      };
      actual.unidadesVendidas += linea.cantidad;
      actual.totalVendido = redondear(actual.totalVendido + linea.cantidad * linea.precioUnitario);
      acumulado.set(linea.productoId, actual);
    });
  return [...acumulado.values()]
    .sort((a, b) => b.unidadesVendidas - a.unidadesVendidas || a.nombre.localeCompare(b.nombre))
    .slice(0, limite);
}

// ─── Autenticación ──────────────────────────────────────────────────────────

const LETRAS_DNI = 'TRWAGMYFPDXBNJZSQVHLCKE';
const esDniValido = (dni: string) => {
  const partes = /^(\d{8})([A-Z])$/.exec(dni.trim().toUpperCase());
  return !!partes && LETRAS_DNI[Number(partes[1]) % 23] === partes[2];
};

function login(cuerpo: LoginPeticionApi): SesionApi {
  validar({
    email: estaVacio(cuerpo?.email) && 'El email es obligatorio',
    contrasena: estaVacio(cuerpo?.contrasena) && 'La contraseña es obligatoria',
  });
  const usuario = bd.usuarios.find(
    (usuarioBuscado) =>
      usuarioBuscado.email.toLowerCase() === cuerpo.email.trim().toLowerCase() &&
      usuarioBuscado.contrasena === cuerpo.contrasena,
  );
  if (!usuario) throw new ErrorSimulado(401, 'No autenticado', 'Email o contraseña incorrectos.');
  return sesionDe(usuario);
}

function registro(cuerpo: RegistroPeticionApi): SesionApi {
  validar({
    nombre: estaVacio(cuerpo?.nombre) && 'El nombre es obligatorio',
    email: !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cuerpo?.email ?? '') && 'El email no tiene un formato válido',
    dni: !esDniValido(cuerpo?.dni ?? '') && 'El DNI no es válido',
    contrasena: (cuerpo?.contrasena ?? '').length < 8 && 'La contraseña debe tener al menos 8 caracteres',
  });
  const email = cuerpo.email.trim().toLowerCase();
  const dni = cuerpo.dni.trim().toUpperCase();
  if (bd.usuarios.some((usuario) => usuario.email.toLowerCase() === email))
    throw duplicado('Ya existe una cuenta con ese email.');
  if (bd.clientes.some((cliente) => cliente.dni === dni)) throw duplicado('Ya existe un cliente con ese DNI.');
  const usuario: UsuarioSimulado = { id: uuid(), rol: 'CLIENTE', email, contrasena: cuerpo.contrasena };
  bd.usuarios.push(usuario);
  bd.clientes.push({ id: uuid(), usuarioId: usuario.id, nombre: cuerpo.nombre.trim(), email, dni });
  return sesionDe(usuario);
}

// ─── Enrutador ──────────────────────────────────────────────────────────────

type Manejador = (peticion: PeticionSimulada, parametrosRuta: string[]) => RespuestaSimulada;

const ok = (cuerpo: unknown): RespuestaSimulada => ({ estado: 200, cuerpo });
const creado = (cuerpo: unknown): RespuestaSimulada => ({ estado: 201, cuerpo });
const sinContenido = (): RespuestaSimulada => ({ estado: 204, cuerpo: null });

const ID = '([^/]+)';
const RUTAS: [metodo: string, patron: RegExp, manejador: Manejador][] = [
  // Autenticación
  ['POST', /^\/auth\/login$/, (p) => ok(login(p.cuerpo as LoginPeticionApi))],
  ['POST', /^\/auth\/registro$/, (p) => creado(registro(p.cuerpo as RegistroPeticionApi))],
  ['GET', /^\/auth\/me$/, (p) => ok(sesionDe(exigirRol(p)).usuario)],

  // Productos (1–6)
  ['GET', /^\/productos$/, (p) => ok(listarProductos(p))],
  ['GET', new RegExp(`^/productos/${ID}$`), (_p, [id]) => ok(productoApi(buscarProductoActivo(id)))],
  ['POST', /^\/productos$/, (p) => {
    exigirRol(p, 'ADMIN');
    const nuevo = { id: uuid() } as ProductoSimulado;
    const respuesta = guardarProducto(nuevo, p.cuerpo as ProductoPeticionApi);
    bd.productos.push(nuevo);
    return creado(respuesta);
  }],
  ['PUT', new RegExp(`^/productos/${ID}$`), (p, [id]) => {
    exigirRol(p, 'ADMIN');
    return ok(guardarProducto(buscarProducto(id), p.cuerpo as ProductoPeticionApi));
  }],
  ['PATCH', new RegExp(`^/productos/${ID}/disponibilidad$`), (p, [id]) => {
    exigirRol(p, 'ADMIN', 'BARISTA', 'CAMARERO');
    const { disponible } = (p.cuerpo ?? {}) as { disponible?: boolean };
    validar({ disponible: typeof disponible !== 'boolean' && 'El campo disponible es obligatorio (true o false)' });
    const producto = buscarProductoActivo(id);
    producto.disponible = disponible!;
    return ok(productoApi(producto));
  }],
  ['DELETE', new RegExp(`^/productos/${ID}$`), (p, [id]) => {
    exigirRol(p, 'ADMIN');
    buscarProductoActivo(id).activa = false; // RN-01: baja lógica
    return sinContenido();
  }],

  // Alérgenos (NUEVO)
  ['GET', /^\/alergenos$/, () => ok(bd.alergenos)],
  ['POST', /^\/alergenos$/, (p) => {
    exigirRol(p, 'ADMIN');
    const { nombre } = (p.cuerpo ?? {}) as { nombre?: string };
    validar({ nombre: estaVacio(nombre) && 'El nombre es obligatorio' });
    if (bd.alergenos.some((alergeno) => alergeno.nombre.toLowerCase() === nombre!.trim().toLowerCase()))
      throw duplicado(`Ya existe el alérgeno '${nombre!.trim()}'`);
    const alergeno = { id: uuid(), nombre: nombre!.trim() };
    bd.alergenos.push(alergeno);
    return creado(alergeno);
  }],

  // Categorías (7–8 + NUEVO)
  ['GET', /^\/categorias$/, () => ok(listarCategorias())],
  ['POST', /^\/categorias$/, (p) => {
    exigirRol(p, 'ADMIN');
    const { nombre } = (p.cuerpo ?? {}) as { nombre?: string };
    validar({ nombre: estaVacio(nombre) && 'El nombre es obligatorio' });
    if (bd.categorias.some((categoria) => categoria.nombre.toLowerCase() === nombre!.trim().toLowerCase()))
      throw duplicado(`Ya existe la categoría '${nombre!.trim()}'`);
    const categoria: CategoriaApi = { id: uuid(), nombre: nombre!.trim(), disponible: true };
    bd.categorias.push(categoria);
    return creado(categoria);
  }],
  ['DELETE', new RegExp(`^/categorias/${ID}$`), (p, [id]) => {
    exigirRol(p, 'ADMIN');
    const categoria = bd.categorias.find((categoriaBuscada) => categoriaBuscada.id === id);
    if (!categoria) throw noEncontrado(`No existe ninguna categoría con id ${id}`);
    const total = bd.productos.filter((producto) => producto.categoriaId === id).length;
    if (total)
      throw new ErrorSimulado(409, 'Elemento en uso', `La categoría tiene ${total} productos: muévelos a otra antes de eliminarla.`);
    bd.categorias.splice(bd.categorias.indexOf(categoria), 1);
    return sinContenido();
  }],
  ['PATCH', new RegExp(`^/categorias/${ID}/disponibilidad$`), (p, [id]) => {
    exigirRol(p, 'ADMIN', 'BARISTA', 'CAMARERO');
    const { disponible } = (p.cuerpo ?? {}) as { disponible?: boolean };
    validar({ disponible: typeof disponible !== 'boolean' && 'El campo disponible es obligatorio (true o false)' });
    const categoria = bd.categorias.find((categoriaBuscada) => categoriaBuscada.id === id);
    if (!categoria) throw noEncontrado(`No existe ninguna categoría con id ${id}`);
    categoria.disponible = disponible!;
    bd.productos.filter((producto) => producto.categoriaId === id).forEach((producto) => (producto.disponible = disponible!));
    return ok(categoria);
  }],

  // Pedidos (9–12)
  ['POST', /^\/pedidos$/, (p) => creado(crearPedido(exigirRol(p, 'BARISTA', 'CAMARERO', 'CLIENTE'), p.cuerpo as PedidoPeticionApi))],
  ['GET', /^\/pedidos$/, (p) => ok(listarPedidos(exigirRol(p, 'ADMIN', 'BARISTA', 'CAMARERO', 'CLIENTE'), p))],
  ['GET', new RegExp(`^/pedidos/${ID}$`), (p, [id]) => {
    const usuario = exigirRol(p, 'ADMIN', 'BARISTA', 'CAMARERO', 'CLIENTE');
    const pedido = buscarPedido(id);
    comprobarPropietario(usuario, pedido);
    return ok(pedidoApi(pedido));
  }],
  ['PATCH', new RegExp(`^/pedidos/${ID}/estado$`), (p, [id]) =>
    ok(cambiarEstadoPedido(exigirRol(p, 'ADMIN', 'BARISTA', 'CAMARERO', 'CLIENTE'), id, p.cuerpo as { estado?: string }))],

  // Cupones (13–14 + NUEVO)
  ['POST', /^\/cupones\/validar$/, (p) => {
    exigirRol(p);
    const cuerpo = (p.cuerpo ?? {}) as ValidacionCuponPeticionApi;
    validar({
      codigo: estaVacio(cuerpo.codigo) && 'El código es obligatorio',
      subtotal:
        cuerpo.subtotal == null ? 'El subtotal es obligatorio' : cuerpo.subtotal < 0 && 'El subtotal no puede ser negativo',
    });
    const cupon = cuponValido(cuerpo.codigo, cuerpo.subtotal, cuerpo.email);
    const descuento = descuentoDeCupon(cupon, cuerpo.subtotal);
    const respuesta: ValidacionCuponApi = { codigo: cupon.codigo, descuento, total: redondear(cuerpo.subtotal - descuento) };
    return ok(respuesta);
  }],
  ['GET', /^\/cupones$/, (p) => {
    exigirRol(p, 'ADMIN');
    return ok(bd.cupones.map(cuponApi));
  }],
  ['POST', /^\/cupones$/, (p) => {
    exigirRol(p, 'ADMIN');
    const nuevo = { id: uuid(), activo: true } as CuponSimulado;
    const respuesta = guardarCupon(nuevo, p.cuerpo as CuponPeticionApi);
    bd.cupones.push(nuevo);
    return creado(respuesta);
  }],
  ['PUT', new RegExp(`^/cupones/${ID}$`), (p, [id]) => {
    exigirRol(p, 'ADMIN');
    const cupon = bd.cupones.find((cuponBuscado) => cuponBuscado.id === id);
    if (!cupon) throw noEncontrado(`No existe ningún cupón con id ${id}`);
    return ok(guardarCupon(cupon, p.cuerpo as CuponPeticionApi));
  }],
  ['DELETE', new RegExp(`^/cupones/${ID}$`), (p, [id]) => {
    exigirRol(p, 'ADMIN');
    const cupon = bd.cupones.find((cuponBuscado) => cuponBuscado.id === id);
    if (!cupon) throw noEncontrado(`No existe ningún cupón con id ${id}`);
    if (bd.pedidos.some((pedido) => pedido.cuponId === id))
      throw new ErrorSimulado(409, 'Elemento en uso', `${cupon.codigo} ya se ha usado en pedidos: desactívalo en lugar de eliminarlo.`);
    bd.cupones.splice(bd.cupones.indexOf(cupon), 1);
    return sinContenido();
  }],

  // Informes (15–16 + NUEVO)
  ['GET', /^\/informes\/ventas-dia$/, (p) => (exigirRol(p, 'ADMIN'), ok(ventasDia(p)))],
  ['GET', /^\/informes\/ventas-franja$/, (p) => (exigirRol(p, 'ADMIN'), ok(ventasFranja(p)))],
  ['GET', /^\/informes\/productos-top$/, (p) => (exigirRol(p, 'ADMIN'), ok(productosTop(p)))],
];

/** Atiende una petición como lo haría la API. Lanza `ErrorSimulado` para las respuestas de error. */
export function atenderPeticion(peticion: PeticionSimulada): RespuestaSimulada {
  const rutasCoincidentes = RUTAS.filter(([, patron]) => patron.test(peticion.ruta));
  if (!rutasCoincidentes.length)
    throw new ErrorSimulado(404, 'Ruta no encontrada', `No existe la ruta /api/v1${peticion.ruta}`);
  const ruta = rutasCoincidentes.find(([metodo]) => metodo === peticion.metodo);
  if (!ruta) {
    const metodos = rutasCoincidentes.map(([metodo]) => metodo).join(', ');
    throw new ErrorSimulado(
      405,
      'Método no permitido',
      `El método ${peticion.metodo} no está permitido en esta ruta. Métodos admitidos: [${metodos}]`,
    );
  }
  const [, patron, manejador] = ruta;
  const parametrosRuta = patron.exec(peticion.ruta)!.slice(1).map(decodeURIComponent);
  // structuredClone: el componente no puede modificar por error los datos del "servidor".
  return structuredClone(manejador(peticion, parametrosRuta));
}
