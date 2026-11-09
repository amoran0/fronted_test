const euro = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  // 'always' agrupa también los miles (1.842,60 €); la librería de tipos de TS aún lo declara como boolean.
  useGrouping: 'always' as unknown as boolean,
});

/** 1842.6 → "1.842,60 €" */
export function formatEuro(valor: number): string {
  return euro.format(valor);
}

/** −1.33 → "−1,33 €" con el signo menos tipográfico. */
export function formatDescuento(valor: number): string {
  return '−' + formatEuro(Math.abs(valor));
}

/** "2026-03-18" → "18/03/2026" */
export function formatFecha(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** "2026-09-29T09:15" → "29 sep" */
export function formatFechaCorta(iso: string): string {
  return new Date(iso)
    .toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    .replace('.', '');
}

/** "2026-09-29T09:15" → "09:15" */
export function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

/** Fecha local en formato ISO corto (yyyy-mm-dd), útil para inputs de tipo date. */
export function hoyIso(base = new Date()): string {
  const d = new Date(base.getTime() - base.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 10);
}

/** Minutos transcurridos desde una fecha ISO. */
export function minutosDesde(iso: string, ahora = new Date()): number {
  return Math.max(0, Math.round((ahora.getTime() - new Date(iso).getTime()) / 60000));
}

/** "Café con Leche" → "cafe-con-leche" (sin tildes ni símbolos). */
export function slug(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
}

/** "2 × Flat white · 1 × Croissant" */
export function resumenLineas(lineas: { cantidad: number; nombre: string }[]): string {
  return lineas.map((l) => `${l.cantidad} × ${l.nombre}`).join(' · ');
}

/** "Leche, Gluten" o "Sin alérgenos" */
export function listaAlergenos(alergenos: string[]): string {
  return alergenos.length ? alergenos.join(', ') : 'Sin alérgenos';
}
