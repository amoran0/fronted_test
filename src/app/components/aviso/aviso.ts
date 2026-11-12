import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Icono, NombreIcono } from '../icono/icono';

export type TonoAviso = 'exito' | 'informacion' | 'peligro' | 'advertencia';

/** Mensaje que se muestra tras una operación (verde si terminó bien, rojo si falló). */
export interface ResultadoOperacion {
  tono: TonoAviso;
  texto: string;
}

const ICONO_POR_TONO: Record<TonoAviso, NombreIcono> = {
  exito: 'circulo-confirmacion',
  informacion: 'informacion',
  peligro: 'circulo-alerta',
  advertencia: 'circulo-alerta',
};

/** Aviso con icono, título y texto (proyectado). */
@Component({
  selector: 'app-aviso',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.role]': "tono() === 'peligro' ? 'alert' : 'status'" },
  template: `
    <div class="aviso" [class]="'aviso aviso--' + tono()">
      <app-icono [nombre]="iconoDelTono()" [tamano]="16" class="aviso__icono" />
      <div class="aviso__cuerpo">
        @if (titulo()) {
          <strong class="aviso__titulo">{{ titulo() }}</strong>
        }
        <div class="aviso__texto"><ng-content /></div>
      </div>
      <ng-content select="[accion-aviso]" />
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .aviso {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 14px;
      border-radius: var(--radio-campo);
      font-size: 12px;
      line-height: 1.45;
    }
    .aviso__icono {
      margin-top: 1px;
    }
    .aviso__cuerpo {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .aviso__titulo {
      font: 700 13px var(--fuente-sans);
    }
    .aviso__texto {
      color: var(--color-texto);
    }
    .aviso--exito {
      background: var(--color-exito-fondo);
      color: var(--color-exito);
    }
    .aviso--informacion {
      background: var(--color-informacion-fondo);
      color: var(--color-informacion);
    }
    .aviso--peligro {
      background: var(--color-peligro-fondo);
      color: var(--color-peligro);
    }
    .aviso--advertencia {
      background: var(--color-advertencia-fondo);
      color: var(--color-advertencia);
    }
  `,
})
export class Aviso {
  readonly tono = input<TonoAviso>('informacion');
  readonly titulo = input<string>();
  protected readonly iconoDelTono = computed(() => ICONO_POR_TONO[this.tono()]);
}
