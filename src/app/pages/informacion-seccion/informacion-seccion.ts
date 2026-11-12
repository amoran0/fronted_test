import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Aviso } from '../../components/aviso/aviso';
import { TarjetaIndicador } from '../../components/tarjeta-indicador/tarjeta-indicador';
import { CabeceraPagina } from '../../components/cabecera-pagina/cabecera-pagina';
import { ServicioAutenticacion } from '../../services/servicio-autenticacion';
import { ServicioPedidos } from '../../services/servicio-pedidos';
import { ServicioProductos } from '../../services/servicio-productos';

type Seccion = 'como-funciona' | 'perfil' | 'turno' | 'resumen';

const TITULO_Y_SUBTITULO_POR_SECCION: Record<Seccion, [titulo: string, subtitulo: string]> = {
  'como-funciona': ['Cómo funciona', 'Pide desde la web y recoge en barra sin esperar cola.'],
  perfil: ['Mi perfil', 'Tus datos y ventajas de socio.'],
  turno: ['Turno', 'Resumen de tu turno de barra.'],
  resumen: ['Resumen', 'Vista rápida del local hoy.'],
};

/**
 * Vistas del menú que no tienen pantalla en el mockup (Cómo funciona, Mi perfil, Turno, Resumen).
 * Se resuelven con una página sencilla según `data.seccion` de la ruta.
 */
@Component({
  selector: 'app-pagina-informacion-seccion',
  imports: [CabeceraPagina, Aviso, TarjetaIndicador, RouterLink],
  templateUrl: './informacion-seccion.html',
  styles: `
    .pasos {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
      margin-bottom: 20px;
    }
    .paso {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .paso__numero {
      font: 600 30px var(--fuente-serif);
      color: var(--color-primario);
    }
    .indicadores {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    dl {
      display: grid;
      grid-template-columns: 160px 1fr;
      gap: 10px;
      margin: 0;
    }
    dd {
      margin: 0;
      font-weight: 700;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaInformacionSeccion {
  readonly seccion = input.required<Seccion>();
  protected readonly autenticacion = inject(ServicioAutenticacion);
  protected readonly servicioPedidos = inject(ServicioPedidos);
  protected readonly servicioProductos = inject(ServicioProductos);

  protected readonly textos = computed(() => TITULO_Y_SUBTITULO_POR_SECCION[this.seccion()]);
  protected readonly productosAgotados = computed(
    () =>
      this.servicioProductos.productos().filter((producto) => producto.estado === 'agotado').length,
  );
}
