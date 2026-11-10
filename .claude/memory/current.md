---
updated: 2026-11-10
branch: main
head_commit: 14400d4
working_tree: dirty (1 ruta sin seguimiento: .claude/)
---
# Contexto técnico actual

## Proyecto
App Angular 22 (standalone, signals, OnPush, control flow `@if/@for`) para pedidos de una cafetería con 4 roles: público, cliente, barista y admin. Usa datos de ejemplo (`environment.useMocks: true`) en lugar de una API real.

## Estado del desarrollo
### Funciona
- Build de producción y desarrollo sin errores ni avisos (`npx ng build`): verificado el 2026-11-09.
- Estilos en CSS plano. El CSS compilado es idéntico al del SCSS anterior salvo los cambios intencionados: verificado el 2026-11-09 comparando la salida de sass archivo por archivo.
- Barra lateral responsive por debajo de 900 px: panel deslizante con botón ☰/✕, fondo oscuro, cierre al navegar y con Escape (`src/app/components/app-shell/app-shell.ts`). Verificado con capturas de chromium headless a 420 px y 1200 px.
- Logo nuevo, vaso de café sobre círculo beige a 34 px (`public/logo-cup.svg`, `src/app/components/sidebar/sidebar.html`). Verificado con captura.
- La barra lateral muestra el nombre del usuario conectado en lugar del rol y, sin sesión, "Público". El nombre ya no se repite junto a "Cerrar sesión". Verificado con captura simulando la sesión de un barista.
### Incompleto o roto
- No hay tests: no existe ningún `*.spec.ts`.
- `public/favicon.ico` sigue siendo el icono antiguo; no tiene el vaso nuevo.

## Decisiones técnicas vigentes
- Estilos solo en `.css`, sin sintaxis SCSS. `angular.json` tiene `style` e `inlineStyleLanguage` en `css`. Motivo: lo pidió el usuario.
- Las simplificaciones no deben cambiar el comportamiento. Motivo: lo pidió el usuario y se revirtió un cambio que sí lo alteraba.
- `antiguoMin` en `cola-pedidos.ts` es un `computed` que lee `pedidos.pendientes()`. Así se recalcula al cargar, al pulsar "Actualizar cola", al entrar un pedido y al cambiar el estado de cualquier pedido, pero no con el paso del tiempo. Motivo: lo pidió el usuario.
- El acceso a `localStorage` está centralizado en `src/app/utils/almacen.ts` (`leerJson` y `guardarJson`).
- Utilidades compartidas en `src/app/utils/formato.ts`: `slug()` y `resumenLineas()`.
- `ApiService` usa un único método privado `pedir()` con `http.request`. Se eliminó `delete()` porque no se usaba.
- El logo es un SVG redibujado a mano a partir del PNG que dio el usuario, para que sea vectorial y nítido a tamaño pequeño.
- El menú lateral en móvil se implementa en `AppShell` con el signal `menuAbierto`. Se añadió el icono `menu` en `icon.ts`.

## Decisiones pendientes
- Ofrecidas al usuario y sin respuesta:
  - En `cola-pedidos.html`, usar `@let` para no llamar tres veces a `esperaAlta(p)`.
  - En `carta.html`, cambiar los `$any($event.target).value` de los `<select>` por `[(ngModel)]`.
- ¿Sustituir `favicon.ico` por el nuevo logo?

## Tests
- Comando: `npx ng test --watch=false` (script `npm test`, con vitest).
- Última ejecución: 2026-11-10. Falla con "No tests found matching **/*.spec.ts, **/*.test.ts" porque no hay tests.
- Fallos conocidos: ninguno, aparte de que no existen tests.

## Próximo paso
Preguntar al usuario si quiere aplicar las decisiones pendientes: los dos retoques de HTML y el favicon. Después de cualquier cambio visual, ejecutar `npx ng build`, servir `dist/the-coffee-room/browser` con `python3 -m http.server` y revisar una captura de `chromium --headless --screenshot`.
