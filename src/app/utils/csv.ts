/** Genera un CSV (separador `;`, compatible con Excel en español) y lo descarga. */
export function exportarCsv(nombreArchivo: string, filas: (string | number)[][]): void {
  const escapar = (v: string | number) => {
    const s = typeof v === 'number' ? v.toString().replace('.', ',') : v;
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const contenido = '﻿' + filas.map((f) => f.map(escapar).join(';')).join('\n');
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  a.click();
  URL.revokeObjectURL(url);
}
