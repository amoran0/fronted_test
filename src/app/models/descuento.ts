import { Cupon } from './cupon';
import { DescuentoAplicado, TipoDescuento } from './pedido';
import { redondear } from '../utils/calculos';

/**
 * Clase base de todos los descuentos del carrito.
 *
 * Herencia y polimorfismo: cada subclase decide cómo se calcula su importe
 * (`calcularImporte`) y cómo se describe (`describir`). El resto de la aplicación
 * trabaja siempre con `Descuento` sin saber de qué tipo concreto es: el carrito
 * compara descuentos de cupón y de socio llamando al mismo método `aplicar()`.
 */
export abstract class Descuento {
  protected constructor(
    readonly tipo: TipoDescuento,
    /** Texto corto con el origen del descuento (p. ej. «Cupón BIENVENIDA»). */
    protected readonly origen: string,
  ) {}

  /** Importe bruto del descuento para un subtotal, antes de limitarlo. */
  protected abstract calcularImporte(subtotal: number): number;

  /** Descripción del valor del descuento («10 %», «2,00 €»…). */
  abstract describir(): string;

  /** Importe final: redondeado a céntimos y nunca mayor que el subtotal ni negativo. */
  importePara(subtotal: number): number {
    return Math.min(Math.max(0, redondear(this.calcularImporte(subtotal))), subtotal);
  }

  /** Convierte el descuento en el objeto que viaja en el pedido. */
  aplicar(subtotal: number): DescuentoAplicado {
    return {
      tipo: this.tipo,
      etiqueta: `${this.origen} · ${this.describir()}`,
      importe: this.importePara(subtotal),
    };
  }
}

/** Descuento proporcional al subtotal (10 = 10 %). */
export class DescuentoPorcentaje extends Descuento {
  constructor(
    origen: string,
    private readonly porcentaje: number,
    tipo: TipoDescuento = 'cupon',
  ) {
    super(tipo, origen);
  }

  protected calcularImporte(subtotal: number): number {
    return (subtotal * this.porcentaje) / 100;
  }

  describir(): string {
    return `${this.porcentaje} %`;
  }
}

/** Descuento de una cantidad fija en euros. */
export class DescuentoImporteFijo extends Descuento {
  constructor(
    origen: string,
    private readonly importe: number,
  ) {
    super('cupon', origen);
  }

  protected calcularImporte(): number {
    return this.importe;
  }

  describir(): string {
    return this.importe.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
  }
}

/** Ventaja de los socios del gimnasio FitZone: un porcentaje fijo identificado por su DNI. */
export class DescuentoSocioFitZone extends DescuentoPorcentaje {
  /** Porcentaje de descuento para socios del gimnasio. */
  static readonly PORCENTAJE = 10;

  constructor(private readonly dni: string) {
    super('Socio FitZone', DescuentoSocioFitZone.PORCENTAJE, 'socio');
  }

  /** Sobrescribe la descripción para indicar el DNI parcialmente oculto. */
  override describir(): string {
    return `${super.describir()} · DNI ···${this.dni.slice(-4)}`;
  }
}

/** Crea el descuento adecuado según el tipo de cupón (fábrica polimórfica). */
export function crearDescuentoDeCupon(cupon: Cupon): Descuento {
  const origen = `Cupón ${cupon.codigo}`;
  return cupon.tipo === 'porcentaje'
    ? new DescuentoPorcentaje(origen, cupon.valor)
    : new DescuentoImporteFijo(origen, cupon.valor);
}

/** De varios descuentos, devuelve el que más ahorra (cupón y socio no se suman). */
export function elegirMejorDescuento(
  subtotal: number,
  descuentos: (Descuento | null)[],
): DescuentoAplicado | null {
  const aplicados = descuentos
    .filter((descuento): descuento is Descuento => descuento !== null)
    .map((descuento) => descuento.aplicar(subtotal))
    .filter((aplicado) => aplicado.importe > 0)
    .sort((descuentoA, descuentoB) => descuentoB.importe - descuentoA.importe);
  return aplicados[0] ?? null;
}
