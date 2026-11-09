/**
 * Datos de ejemplo que sustituyen a la API mientras `entorno.usarDatosSimulados` sea `true`.
 * Reproducen el contenido del mockup de Figma.
 */
import { Cupon } from '../modelos/cupon';
import { MetricasDia, RankingProducto, VentaFranja } from '../modelos/informe';
import { Pedido } from '../modelos/pedido';
import { Categoria, Producto } from '../modelos/producto';
import { Usuario } from '../modelos/usuario';
import { fechaHoyIso } from '../utilidades/formato';

const ahora = new Date();
const haceMinutos = (minutos: number) => new Date(ahora.getTime() - minutos * 60000).toISOString();
const fechaIsoDelDia = (anio: number, mes: number, dia: number) => fechaHoyIso(new Date(anio, mes, dia));
const inicioMes = fechaIsoDelDia(ahora.getFullYear(), ahora.getMonth(), 1);
const finMes = fechaIsoDelDia(ahora.getFullYear(), ahora.getMonth() + 1, 0);
const dentroDeDias = (dias: number) => fechaHoyIso(new Date(ahora.getTime() + dias * 86400000));

export const USUARIOS_SIMULADOS: (Usuario & { contrasena: string })[] = [
  { id: 'u-cliente', nombre: 'Marta Ruiz', email: 'marta.r@example.com', rol: 'cliente', dniSocio: '12345678Z', contrasena: 'demo1234' },
  { id: 'u-barista', nombre: 'Leo Martín', email: 'barista@thecoffeeroom.es', rol: 'barista', contrasena: 'demo1234' },
  { id: 'u-admin', nombre: 'Lucía Admin', email: 'admin@thecoffeeroom.es', rol: 'admin', contrasena: 'demo1234' },
];

export const CATEGORIAS_SIMULADAS: Categoria[] = [
  { id: 'cafe', nombre: 'Café', grupo: 'cafe' },
  { id: 'desayuno', nombre: 'Desayuno', grupo: 'comida' },
  { id: 'bebidas-frias', nombre: 'Bebidas frías', grupo: 'frios' },
  { id: 'dulces', nombre: 'Dulces y bollería', grupo: 'comida' },
  { id: 'especiales', nombre: 'Especiales', grupo: 'frios' },
];

export const PRODUCTOS_SIMULADOS: Producto[] = [
  { id: 'flat-white', nombre: 'Flat white', precio: 3.2, categoriaId: 'cafe', alergenos: ['Leche'], estado: 'disponible', imagen: 'img/flat-white.jpg', nota: 'En servicio',
    descripcion: 'Doble ristretto de nuestro tueste de temporada con leche microtexturizada. Suave, intenso y con final de cacao.' },
  { id: 'tostada-aguacate', nombre: 'Tostada de aguacate', precio: 6.9, categoriaId: 'desayuno', alergenos: ['Gluten', 'Sésamo'], estado: 'disponible', imagen: 'img/tostada-aguacate.jpg',
    descripcion: 'Pan de masa madre tostado, aguacate machacado con lima, sésamo tostado y escamas de sal.' },
  { id: 'cold-brew-naranja', nombre: 'Cold brew naranja', precio: 4.5, categoriaId: 'bebidas-frias', alergenos: [], estado: 'disponible', imagen: 'img/cold-brew-naranja.jpg',
    descripcion: 'Café extraído en frío durante 18 horas, servido con hielo y piel de naranja.' },
  { id: 'roll-canela', nombre: 'Roll de canela', precio: 3.8, categoriaId: 'dulces', alergenos: ['Gluten', 'Leche', 'Huevo'], estado: 'agotado', imagen: 'img/roll-canela.jpg', imagenDetalle: 'img/roll-canela-detalle.jpg', nota: '0 unidades',
    descripcion: 'Masa de brioche horneada cada mañana, canela de Ceilán y un glaseado ligero de vainilla. Dulce, especiado y perfecto junto a un café.' },
  { id: 'fitzone-proteina', nombre: 'FitZone proteína', precio: 5.9, categoriaId: 'especiales', alergenos: ['Leche'], estado: 'agotado', imagen: 'img/fitzone-proteina.jpg', nota: 'Proveedor sin stock',
    descripcion: 'Batido de proteína de suero con plátano y vainilla, en colaboración con el gimnasio FitZone.' },
  { id: 'bowl-granola', nombre: 'Bowl granola cacao', precio: 7.2, categoriaId: 'desayuno', alergenos: ['Frutos secos', 'Leche'], estado: 'disponible', imagen: 'img/bowl-granola.jpg',
    descripcion: 'Yogur griego, granola casera de cacao y avellana, frutos rojos y miel.' },
  { id: 'cappuccino', nombre: 'Cappuccino', precio: 3.4, categoriaId: 'cafe', alergenos: ['Leche'], estado: 'disponible', imagen: 'img/cappuccino.jpg',
    descripcion: 'Espresso, leche vaporizada y una capa generosa de espuma. Con cacao si lo pides.' },
  { id: 'croissant', nombre: 'Croissant de mantequilla', precio: 2.5, categoriaId: 'dulces', alergenos: ['Gluten', 'Leche', 'Huevo'], estado: 'disponible', imagen: 'img/croissant.jpg',
    descripcion: 'Hojaldre de mantequilla con 27 capas, horneado en el obrador cada mañana.' },
  { id: 'matcha-latte', nombre: 'Matcha latte', precio: 4.2, categoriaId: 'especiales', alergenos: ['Leche'], estado: 'disponible', imagen: 'img/matcha-latte.jpg',
    descripcion: 'Matcha ceremonial japonés batido a mano con leche caliente o fría.' },
  { id: 'tostada-jamon', nombre: 'Tostada de jamón', precio: 5.5, categoriaId: 'desayuno', alergenos: ['Gluten'], estado: 'disponible', imagen: 'img/tostada-jamon.jpg',
    descripcion: 'Pan rústico con tomate rallado, aceite de oliva virgen extra y jamón ibérico.' },
  { id: 'tarta-queso', nombre: 'Tarta de queso', precio: 4.8, categoriaId: 'dulces', alergenos: ['Gluten', 'Leche', 'Huevo'], estado: 'agotado', imagen: 'img/tarta-queso.jpg', nota: '0 porciones',
    descripcion: 'Tarta de queso cremosa al horno, con el centro fundente.' },
  { id: 'smoothie', nombre: 'Smoothie frutos rojos', precio: 4.9, categoriaId: 'bebidas-frias', alergenos: [], estado: 'disponible', imagen: 'img/smoothie.jpg',
    descripcion: 'Fresa, frambuesa, arándano y plátano. Sin azúcar añadido.' },
  { id: 'mocaccino', nombre: 'Mocaccino clásico', precio: 3.9, categoriaId: 'cafe', alergenos: ['Leche'], estado: 'retirado', imagen: 'img/mocaccino.jpg', nota: 'Retirado',
    descripcion: 'Espresso con chocolate negro y leche vaporizada.' },
];

const lineaPedido = (nombre: string, cantidad: number, precioUnitario: number) => ({ nombre, cantidad, precioUnitario });

export const PEDIDOS_SIMULADOS: (Pedido & { clienteId: string })[] = [
  { id: 'p-1048', codigo: 'CS-1048', turno: 'A-27', fecha: haceMinutos(12), clienteId: 'u-cliente',
    lineas: [lineaPedido('Flat white', 2, 3.2), lineaPedido('Tostada de aguacate', 1, 6.9)],
    subtotal: 13.3, descuento: { tipo: 'socio', etiqueta: 'Socio FitZone · 10 %', importe: 1.33 }, total: 11.97,
    estado: 'listo', pagado: true, alergiasDeclaradas: null },
  { id: 'p-1046', codigo: 'CS-1046', turno: 'A-25', fecha: haceMinutos(16), clienteId: 'u-otro',
    lineas: [lineaPedido('Cold brew naranja', 1, 4.5), lineaPedido('Bowl granola cacao', 1, 7.2)],
    subtotal: 11.7, total: 11.7, estado: 'en_preparacion', pagado: true, alergiasDeclaradas: null },
  { id: 'p-1045', codigo: 'CS-1045', turno: 'A-24', fecha: haceMinutos(20), clienteId: 'u-otro',
    lineas: [lineaPedido('Flat white', 2, 3.2), lineaPedido('Tostada de aguacate', 1, 6.9)],
    subtotal: 13.3, total: 13.3, estado: 'pendiente', pagado: true, alergiasDeclaradas: null },
  { id: 'p-1047', codigo: 'CS-1047', turno: 'A-26', fecha: haceMinutos(5), clienteId: 'u-otro',
    lineas: [lineaPedido('Cappuccino', 1, 3.4), lineaPedido('Croissant de mantequilla', 2, 2.5)],
    subtotal: 8.4, total: 8.4, estado: 'pendiente', pagado: true, alergiasDeclaradas: 'Frutos secos' },
  { id: 'p-1031', codigo: 'CS-1031', turno: 'A-18', fecha: '2026-09-29T09:15:00', clienteId: 'u-cliente',
    lineas: [lineaPedido('Cold brew naranja', 1, 4.5), lineaPedido('Bowl granola cacao', 1, 7.2)],
    subtotal: 11.7, total: 11.7, estado: 'entregado', pagado: true, alergiasDeclaradas: null },
  { id: 'p-0984', codigo: 'CS-0984', turno: 'B-04', fecha: '2026-09-21T17:05:00', clienteId: 'u-cliente',
    lineas: [lineaPedido('Flat white', 1, 3.2), lineaPedido('Roll de canela', 1, 3.8)],
    subtotal: 7, total: 7, estado: 'entregado', pagado: true, alergiasDeclaradas: null },
];

export const CUPONES_SIMULADOS: Cupon[] = [
  { codigo: 'CAFE10', tipo: 'porcentaje', valor: 10, descripcion: '10 % · todos los productos', desde: inicioMes, hasta: finMes, usos: 42, usosMax: 200, minimoCompra: 0, activo: true },
  { codigo: 'MARTA5', tipo: 'fijo', valor: 5, descripcion: '5 € · Marta R. · marta.r@example.com', desde: inicioMes, hasta: dentroDeDias(6), usos: 0, usosMax: 1, minimoCompra: 0, email: 'marta.r@example.com', activo: true },
  { codigo: 'OTOÑO25', tipo: 'porcentaje', valor: 25, descripcion: '25 % · pedido mín. 15 €', desde: '2026-09-01', hasta: '2026-09-30', usos: 86, usosMax: 100, minimoCompra: 15, activo: true },
  { codigo: 'BIENVENIDA', tipo: 'fijo', valor: 3, descripcion: '3 € · primer pedido', desde: '2026-01-01', hasta: null, usos: 500, usosMax: 500, minimoCompra: 0, activo: true },
];

/** Genera datos de informe deterministas por fecha, para que cambiar el filtro tenga efecto. */
function factorVariacion(texto: string): number {
  let hash = 0;
  for (const caracter of texto) hash = (hash * 31 + caracter.charCodeAt(0)) >>> 0;
  return 0.85 + (hash % 30) / 100;
}

const FRANJAS_BASE: VentaFranja[] = [
  { hora: '08 h', importe: 238.08 },
  { hora: '10 h', importe: 367.49 },
  { hora: '12 h', importe: 305.09 },
  { hora: '14 h', importe: 196.68 },
  { hora: '16 h', importe: 326.08 },
  { hora: '18 h', importe: 409.18 },
];

export function franjasSimuladas(fecha: string): VentaFranja[] {
  const factor = factorVariacion(fecha);
  return FRANJAS_BASE.map((franja, indice) => ({
    ...franja,
    importe: Math.round(franja.importe * (indice % 2 ? factor : 2 - factor) * 100) / 100,
  }));
}

export function metricasSimuladas(fecha: string): MetricasDia {
  const ventas = Math.round(franjasSimuladas(fecha).reduce((suma, franja) => suma + franja.importe, 0) * 100) / 100;
  const pedidos = Math.round(186 * factorVariacion(fecha + 'p'));
  return {
    fecha,
    ventas,
    pedidos,
    variacionPedidosAyer: 18,
    ticketMedio: Math.round((ventas / pedidos) * 100) / 100,
    variacionTicketAyer: 0.42,
    descuentos: Math.round(ventas * 0.052 * 100) / 100,
  };
}

export function rankingSimulado(desde: string, hasta: string): RankingProducto[] {
  const factor = factorVariacion(desde + hasta);
  const ventasBase: [nombre: string, categoria: string, unidades: number, precio: number][] = [
    ['Flat white', 'Café', 84, 3.2],
    ['Tostada de aguacate', 'Desayuno', 51, 6.9],
    ['Cold brew naranja', 'Bebida fría', 46, 4.5],
    ['Bowl granola cacao', 'Desayuno', 32, 7.2],
  ];
  return ventasBase.map(([nombre, categoria, unidadesBase, precio], indice) => {
    const unidades = Math.round(unidadesBase * factor);
    return { posicion: indice + 1, nombre, categoria, unidades, importe: Math.round(unidades * precio * 100) / 100 };
  });
}
