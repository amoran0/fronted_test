import { Pipe, PipeTransform } from '@angular/core';
import { formatearEuros } from './formato';

/** Uso: `{{ producto.precio | euro }}` → "3,20 €" */
@Pipe({ name: 'euro' })
export class PipeEuro implements PipeTransform {
  transform(valor: number | null | undefined): string {
    return valor == null ? '—' : formatearEuros(valor);
  }
}
