/** Genera un CSV (separador `;`, compatible con Excel en español) y lo descarga. */
export function exportarCsv(nombreArchivo: string, filas: (string | number)[][]): void {
  const escaparCelda = (valor: string | number) => {
    const texto = typeof valor === 'number' ? valor.toString().replace('.', ',') : valor;
    return /[;"\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  };
  const contenido = '﻿' + filas.map((fila) => fila.map(escaparCelda).join(';')).join('\n');
  const urlArchivo = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }));
  const enlaceDescarga = document.createElement('a');
  enlaceDescarga.href = urlArchivo;
  enlaceDescarga.download = nombreArchivo;
  enlaceDescarga.click();
  URL.revokeObjectURL(urlArchivo);
}
