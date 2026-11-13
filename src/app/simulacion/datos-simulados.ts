/**
 * Datos del servidor simulado: los MISMOS que carga el script SQL de la base de datos
 * (mismos UUID, nombres, precios, cupones y pedidos), guardados con la forma del JSON de la API.
 * Así, al conectar el backend real se ve exactamente lo mismo.
 *
 * ⚠️ Esta carpeta solo se usa con `entorno.usarDatosSimulados = true`.
 *    Para conectar la API real basta con poner ese valor a `false` (o borrar la carpeta y su
 *    interceptor en `configuracion-aplicacion.ts`, ver README).
 */
import { AlergenoApi, CuponApi, EstadoPedidoApi, RolApi } from '../models/api';

// ─── Tablas (forma de la BD, no de la respuesta) ────────────────────────────

export interface UsuarioSimulado {
  id: string;
  rol: RolApi;
  email: string;
  contrasena: string;
}

export interface ClienteSimulado {
  id: string;
  usuarioId: string;
  nombre: string;
  email: string;
  dni: string;
}

export interface CategoriaSimulada {
  id: string;
  nombre: string;
  disponible: boolean;
}

export interface ProductoSimulado {
  id: string;
  categoriaId: string;
  nombre: string;
  descripcion: string | null;
  precioBase: number | null;
  precioVenta: number;
  disponible: boolean;
  activa: boolean;
  iva: number | null;
  alergenosIds: string[];
}

export interface PedidoSimulado {
  id: string;
  clienteId: string;
  cuponId: string | null;
  estado: EstadoPedidoApi;
  fecha: string;
  numeroTurno: number;
  subtotal: number;
  descuento: number;
  total: number;
  baseImponible: number;
  cuotaIva: number;
  lineas: { productoId: string; cantidad: number; precioUnitario: number }[];
}

export type CuponSimulado = Omit<CuponApi, 'usos'>;

export interface BaseDatosSimulada {
  usuarios: UsuarioSimulado[];
  clientes: ClienteSimulado[];
  categorias: CategoriaSimulada[];
  alergenos: AlergenoApi[];
  productos: ProductoSimulado[];
  cupones: CuponSimulado[];
  pedidos: PedidoSimulado[];
}

/** DNI que el servicio de FitZone (simulado) reconoce como socios activos. */
export const SOCIOS_FITZONE_ACTIVOS = ['99887766F', '33445566H'];

const idUsuario = (n: number) => `a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a${n}`;
const idCliente = (n: string) => `b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a${n}`;
const idPedido = (n: string) => `b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a${n}`;
const idCupon = (n: string) => `d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a${n}`;
const idCategoria = (n: string) => `e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a${n}`;
const idProducto = (n: string) => `f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a${n}`;
const idAlergeno = (n: string) => `a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a${n}`;

/** Crea una copia nueva de la base de datos (se reinicia al recargar la página). */
export function crearBaseDatosSimulada(): BaseDatosSimulada {
  return {
    usuarios: [
      { id: idUsuario(11), rol: 'ADMIN', email: 'gerencia@cafeteria.com', contrasena: 'admin123' },
      { id: idUsuario(12), rol: 'BARISTA', email: 'marcos.barista@cafeteria.com', contrasena: 'hash_pass_barista1' },
      { id: idUsuario(13), rol: 'CAMARERO', email: 'lucia.camarera@cafeteria.com', contrasena: 'hash_pass_camarero2' },
      { id: idUsuario(14), rol: 'CLIENTE', email: 'carlos.gomez@gmail.com', contrasena: 'hash_pass_123' },
      { id: idUsuario(15), rol: 'CLIENTE', email: 'maria.lopez@yahoo.com', contrasena: 'hash_pass_456' },
      { id: idUsuario(16), rol: 'CLIENTE', email: 'juan.perez@hotmail.com', contrasena: 'hash_pass_789' },
      { id: idUsuario(17), rol: 'CLIENTE', email: 'ana.martinez@gmail.com', contrasena: 'hash_pass_abc' },
      { id: idUsuario(18), rol: 'CLIENTE', email: 'luis.fernandez@outlook.com', contrasena: 'hash_pass_def' },
      { id: idUsuario(19), rol: 'CLIENTE', email: 'laura.sanchez@gmail.com', contrasena: 'hash_pass_ghi' },
      { id: idUsuario(20), rol: 'CLIENTE', email: 'diego.ramirez@yahoo.com', contrasena: 'hash_pass_jkl' },
      { id: idUsuario(21), rol: 'CLIENTE', email: 'marta.ruiz@gmail.com', contrasena: 'hash_pass_paso1' },
      { id: idUsuario(22), rol: 'CLIENTE', email: 'pedro.a@gmail.com', contrasena: 'hash_pass_paso2' },
      { id: idUsuario(23), rol: 'CLIENTE', email: 'elena.p@gmail.com', contrasena: 'hash_pass_paso3' },
    ],
    clientes: [
      { id: idCliente('01'), usuarioId: idUsuario(14), nombre: 'Carlos Gómez', email: 'carlos.gomez@gmail.com', dni: '12345678A' },
      { id: idCliente('02'), usuarioId: idUsuario(15), nombre: 'María López', email: 'maria.lopez@yahoo.com', dni: '87654321B' },
      { id: idCliente('03'), usuarioId: idUsuario(16), nombre: 'Juan Pérez', email: 'juan.perez@hotmail.com', dni: '11223344C' },
      { id: idCliente('04'), usuarioId: idUsuario(17), nombre: 'Ana Martínez', email: 'ana.martinez@gmail.com', dni: '44332211D' },
      { id: idCliente('05'), usuarioId: idUsuario(18), nombre: 'Luis Fernández', email: 'luis.fernandez@outlook.com', dni: '55667788E' },
      { id: idCliente('06'), usuarioId: idUsuario(19), nombre: 'Laura Sánchez', email: 'laura.sanchez@gmail.com', dni: '99887766F' },
      { id: idCliente('07'), usuarioId: idUsuario(20), nombre: 'Diego Ramírez', email: 'diego.ramirez@yahoo.com', dni: '22334455G' },
      { id: idCliente('08'), usuarioId: idUsuario(21), nombre: 'Marta Ruiz (Paso)', email: 'marta.ruiz@gmail.com', dni: '33445566H' },
      { id: idCliente('09'), usuarioId: idUsuario(22), nombre: 'Pedro Alarcón (Paso)', email: 'pedro.a@gmail.com', dni: '77889900I' },
      { id: idCliente('10'), usuarioId: idUsuario(23), nombre: 'Elena Prieto (Paso)', email: 'elena.p@gmail.com', dni: '55443322J' },
    ],
    categorias: [
      { id: idCategoria('01'), nombre: 'Cafés Clásicos', disponible: true },
      { id: idCategoria('02'), nombre: 'Cafés Especiales y Fríos', disponible: true },
      { id: idCategoria('03'), nombre: 'Tés e Infusiones', disponible: true },
      { id: idCategoria('04'), nombre: 'Tostadas y Salados', disponible: true },
      { id: idCategoria('05'), nombre: 'Bollería Artesanal', disponible: true },
      { id: idCategoria('06'), nombre: 'Tartas y Repostería', disponible: true },
      { id: idCategoria('07'), nombre: 'Zumos y Batidos Naturales', disponible: true },
      { id: idCategoria('08'), nombre: 'Combos Desayuno', disponible: true },
      { id: idCategoria('09'), nombre: 'Bebidas Vegetales / Extras', disponible: true },
      { id: idCategoria('10'), nombre: 'Especiales de Temporada', disponible: false },
    ],
    alergenos: [
      { id: idAlergeno('01'), nombre: 'Gluten' },
      { id: idAlergeno('02'), nombre: 'Lácteos' },
      { id: idAlergeno('03'), nombre: 'Huevos' },
      { id: idAlergeno('04'), nombre: 'Frutos de cáscara' },
      { id: idAlergeno('05'), nombre: 'Soja' },
      { id: idAlergeno('06'), nombre: 'Sésamo' },
      { id: idAlergeno('07'), nombre: 'Sulfito' },
      { id: idAlergeno('08'), nombre: 'Mostaza' },
      { id: idAlergeno('09'), nombre: 'Cacahuetes' },
      { id: idAlergeno('10'), nombre: 'Altramuces' },
    ],
    productos: [
      producto('01', '01', 'Café Espresso', '100% Arábica de tueste natural', 1.5, []),
      producto('02', '01', 'Café con Leche', 'Espresso largo con leche vaporizada', 1.8, ['02']),
      producto('03', '02', 'Iced Caramel Macchiato', 'Café frío con hielo, leche, vainilla y caramelo', 3.8, ['02']),
      producto('04', '02', 'Cappuccino Italiano', 'Espresso, leche vaporizada y espuma de leche con cacao', 2.8, ['02']),
      producto('05', '04', 'Tostada con Tomate y Aceite', 'Pan de masa madre tostado con tomate natural y AOVE', 2.5, ['01']),
      producto('06', '04', 'Tostada de Aguacate y Huevo', 'Pan de semillas, aguacate laminado y huevo poché', 4.9, ['01', '03', '06']),
      producto('07', '05', 'Croissant de Mantequilla', 'Hornear diario, hojaldrado artesanal', 1.9, ['01', '02']),
      producto('08', '06', 'Tarta de Zanahoria (Carrot Cake)', 'Porción casera con cobertura de queso crema', 4.2, ['04']),
      producto('09', '07', 'Zumo de Naranja Natural', 'Recién exprimido (250ml)', 2.8, []),
      producto('10', '07', 'Smoothie Antiox', 'Batido de frutos rojos, plátano y manzana', 3.9, []),
    ],
    cupones: [
      cupon('01', 'CAFEMATIN', 'FIJO', 1, 5, 100, '2026-01-01', '2026-12-31'),
      cupon('02', 'DULCE20', 'PORCENTAJE', 20, 8, 50, '2026-03-01', '2026-05-31'),
      cupon('03', 'PROMOBATIDO', 'FIJO', 2, 10, 30, '2026-06-01', '2026-08-31'),
      cupon('04', 'BIENVENIDACAFE', 'PORCENTAJE', 15, 4, 200, '2026-01-01', '2026-12-31'),
      cupon('05', 'TAKEAWAY10', 'PORCENTAJE', 10, 6, 150, '2026-02-01', '2026-11-30'),
      cupon('06', 'MERIENDAVIP', 'FIJO', 3, 12, 40, '2026-01-01', '2026-12-31'),
      cupon('07', 'CUMPLECAFEE', 'PORCENTAJE', 50, 0, 10, '2026-01-01', '2026-12-31'),
      cupon('08', 'DESAYUNO2X1', 'PORCENTAJE', 25, 7, 80, '2026-04-01', '2026-06-30'),
      cupon('09', 'VERANOFRIO', 'FIJO', 1, 4.5, 100, '2026-06-15', '2026-09-15'),
      cupon('10', 'CROSSANTFREE', 'FIJO', 2, 8, 60, '2026-10-01', '2026-10-31'),
      // Cupón personal (RN-06): solo lo puede usar María López
      { ...cupon('11', 'SOLOMARIA', 'PORCENTAJE', 30, 0, 1, '2026-01-01', '2026-12-31'), email: 'maria.lopez@yahoo.com' },
    ],
    pedidos: [
      pedido('01', '01', '04', 'ENTREGADO', '2026-10-04T08:30:00', 1, [4.3, 0.65, 3.65, 3.32, 0.33], [['02', 1, 1.8], ['05', 1, 2.5]]),
      pedido('02', '02', '01', 'ENTREGADO', '2026-10-04T09:15:00', 2, [11.4, 1, 10.4, 9.45, 0.95], [['03', 2, 3.8], ['07', 2, 1.9]]),
      pedido('03', '03', '05', 'ENTREGADO', '2026-10-04T10:00:00', 3, [7.7, 0.77, 6.93, 6.3, 0.63], [['06', 1, 4.9], ['09', 1, 2.8]]),
      pedido('04', '04', null, 'ENTREGADO', '2026-10-04T11:30:00', 4, [3, 0, 3, 2.73, 0.27], [['01', 2, 1.5]]),
      pedido('05', '05', null, 'CANCELADO', '2026-10-04T12:00:00', 5, [3.9, 0, 3.9, 3.55, 0.35], [['10', 1, 3.9]]),
      // Pedido 6: descuento de socio FitZone (10 %), sin cupón
      pedido('06', '06', null, 'ENTREGADO', '2026-10-04T16:30:00', 6, [7, 0.7, 6.3, 5.73, 0.57], [['04', 1, 2.8], ['08', 1, 4.2]]),
      pedido('07', '07', null, 'EN_PREPARACION', '2026-10-04T17:15:00', 7, [3.8, 0, 3.8, 3.45, 0.35], [['03', 1, 3.8]]),
      pedido('08', '08', '01', 'PENDIENTE', '2026-10-04T17:30:00', 8, [6.8, 1, 5.8, 5.27, 0.53], [['05', 2, 2.5], ['02', 1, 1.8]]),
      pedido('09', '09', '06', 'ENTREGADO', '2026-10-04T18:00:00', 9, [15.4, 3, 12.4, 11.27, 1.13], [['06', 2, 4.9], ['09', 2, 2.8]]),
      pedido('10', '10', '10', 'LISTO', '2026-10-04T18:45:00', 10, [8.7, 2, 6.7, 6.09, 0.61], [['07', 3, 1.9], ['01', 2, 1.5]]),
    ],
  };
}

function producto(
  n: string,
  categoria: string,
  nombre: string,
  descripcion: string,
  precioVenta: number,
  alergenos: string[],
): ProductoSimulado {
  return {
    id: idProducto(n),
    categoriaId: idCategoria(categoria),
    nombre,
    descripcion,
    precioBase: null,
    precioVenta,
    disponible: true,
    activa: true,
    iva: 10,
    alergenosIds: alergenos.map(idAlergeno),
  };
}

function cupon(
  n: string,
  codigo: string,
  tipo: CuponSimulado['tipo'],
  valor: number,
  importeMin: number,
  maxUsos: number,
  fechaInicio: string,
  fechaFin: string,
): CuponSimulado {
  return { id: idCupon(n), codigo, tipo, valor, importeMin, maxUsos, fechaInicio, fechaFin, activo: true, email: null };
}

function pedido(
  n: string,
  cliente: string,
  cuponN: string | null,
  estado: EstadoPedidoApi,
  fecha: string,
  numeroTurno: number,
  [subtotal, descuento, total, baseImponible, cuotaIva]: number[],
  lineas: [producto: string, cantidad: number, precioUnitario: number][],
): PedidoSimulado {
  return {
    id: idPedido(n),
    clienteId: idCliente(cliente),
    cuponId: cuponN ? idCupon(cuponN) : null,
    estado,
    fecha,
    numeroTurno,
    subtotal,
    descuento,
    total,
    baseImponible,
    cuotaIva,
    lineas: lineas.map(([productoN, cantidad, precioUnitario]) => ({
      productoId: idProducto(productoN),
      cantidad,
      precioUnitario,
    })),
  };
}
