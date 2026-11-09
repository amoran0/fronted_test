/** Lee un valor JSON de localStorage; `null` si no existe o el almacenamiento no está disponible. */
export function leerJson<T>(clave: string): T | null {
  try {
    const textoGuardado = localStorage.getItem(clave);
    return textoGuardado ? (JSON.parse(textoGuardado) as T) : null;
  } catch {
    return null;
  }
}

/** Guarda un valor JSON en localStorage (o lo borra si es `null`). Sin almacenamiento, no hace nada. */
export function guardarJson(clave: string, valor: unknown): void {
  try {
    if (valor == null) localStorage.removeItem(clave);
    else localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* almacenamiento no disponible: el estado vive solo en memoria */
  }
}
