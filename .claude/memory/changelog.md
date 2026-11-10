# Engineering Changelog

## 2026-11-10 · main · 185bf22..14400d4
**Archivos**
- creados: `src/app/utils/almacen.ts` (leer y guardar JSON en localStorage)
- renombrados: los 15 `*.scss` pasan a `*.css`, incluido `src/styles.scss` → `src/styles.css`
- modificados:
  - `angular.json`: estilos en css.
  - `src/app/components/app-shell/app-shell.ts`: menú lateral responsive.
  - `src/app/components/icon/icon.ts`: nuevo icono `menu`.
  - `src/app/components/sidebar/sidebar.html`: logo de 34 px y nombre del usuario.
  - `public/logo-cup.svg`: logo nuevo.
  - `src/app/services/*`: código muerto eliminado y uso de helpers.
  - `src/app/utils/formato.ts`: `slug` y `resumenLineas`.
  - `src/app/utils/validaciones.ts`: eliminado `esEmailValido`.
  - Varias páginas usan los helpers compartidos.

**Cambios**
- Migración de SCSS a CSS. El anidamiento se convirtió a selectores planos en sidebar, acceder, detalle-producto, gestion-carta, informes y mis-pedidos.
- Se eliminaron las clases sin uso `.t-body-strong` y `.btn--block`. `.cols-2` pasó a `styles.css`; antes estaba duplicada en cupones, cupones-solicitudes y editar-producto.
- Se eliminó código sin uso: `AuthService.tieneRol`, `PedidoService.esperaMinutos`, `ProductoService.actualizado`, `ApiService.delete` y `esEmailValido`.
- Duplicados unificados:
  - Acceso a localStorage en `AuthService` y `CarritoService`.
  - `slug()` en `ProductoService` y `editar-producto`.
  - Resumen de líneas en `cola-pedidos` y `mis-pedidos`.
  - Tabla `NOTA` en `disponibilidad`.
  - Lista de cupones vigentes en `CuponService`.
- En `carta` y `gestion-carta`, los casts `as never` se sustituyeron por el tipo `Alergeno`.
- Por debajo de 900 px, la barra lateral es un panel deslizante con botón para mostrarla u ocultarla.
- Logo: vaso de café sobre círculo beige, a 34 px.
- La barra lateral muestra el nombre del usuario conectado en lugar del rol, y se quitó el nombre duplicado junto a "Cerrar sesión".

**Decisiones**
- Estilos solo en `.css`. Motivo: petición del usuario.
- Simplificar sin cambiar el comportamiento. `antiguoMin` en `cola-pedidos.ts` vuelve a ser un `computed` sobre `pendientes()` después de que el usuario pidiera revertir una versión que se recalculaba en cada refresco.

**Tests**
- `npx ng build` (producción y desarrollo): sin errores ni avisos, el 2026-11-09.
- `npx ng test --watch=false`: falla con "No tests found" porque no hay `*.spec.ts`, el 2026-11-10.

**Estado y próximo paso**
- Quedan pendientes los retoques opcionales de HTML (`@let` en la cola y `ngModel` en los selects de la carta) y decidir si se cambia el favicon.
