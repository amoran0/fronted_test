import { Pipe, PipeTransform } from '@angular/core';
import { formatEuro } from './formato';

/** Uso: `{{ producto.precio | euro }}` → "3,20 €" */
@Pipe({ name: 'euro' })
export class EuroPipe implements PipeTransform {
  transform(valor: number | null | undefined): string {
    return valor == null ? '—' : formatEuro(valor);
  }
}
