# The Coffee Room

Web de pedidos de la cafetería, implementada en **Angular 22** a partir del mockup de Figma.
Componentes standalone, señales (`signal`, `computed`), sin Zone.js y rutas con carga diferida.

## Arrancar

```bash
npm install
npm start          # http://localhost:4200
npm run build      # compilación de producción en dist/
```

## Roles y accesos de demostración

Mientras `useMocks` sea `true` (ver `src/environments`), la app funciona con datos de ejemplo en memoria.
En **Acceder** hay botones para entrar con cada rol. Contraseña de todos: `demo1234`.

| Rol      | Email                       | Inicio            | Vistas                                                        |
| -------- | --------------------------- | ----------------- | ------------------------------------------------------------- |
| Público  | —                           | `/carta`          | Carta, Detalle del producto, Cómo funciona, Acceder           |
| Cliente  | `marta.r@example.com`       | `/pedido`         | Realiza tu pedido, Descuento y confirmación, Mis pedidos, Perfil |
| Barista  | `barista@thecoffeeroom.es`  | `/barista/cola`   | Cola de pedidos, Disponibilidad, Turno                        |
| Admin    | `admin@thecoffeeroom.es`    | `/admin/carta`    | Resumen, Gestión de carta, Editar producto, Cupones, Solicitudes CineTown, Informes |

La barra lateral cambia de menú según el rol, y los guards impiden entrar en vistas de otro rol.

## Estructura

```
src/app
├── models         → interfaces del dominio (producto.ts, pedido.ts, cupon.ts, usuario.ts, informe.ts)
├── services       → datos y autenticación (auth, producto, carrito, pedido, cupon, informe, api) + mock-data.ts
├── components     → reutilizables: app-shell, sidebar, footer, page-header, product-card, status-badge,
│                    alert, kpi-card, quantity-stepper, filter-chips, search-input, icon
├── pages          → una carpeta por vista: carta, detalle-producto, acceder, informacion, realiza-pedido,
│                    confirmacion-pedido, mis-pedidos, cola-pedidos, disponibilidad, gestion-carta,
│                    editar-producto, cupones, cupones-solicitudes, informes
├── guards         → auth.guard.ts (sesión), role.guard.ts (rol, vía `data.roles` de la ruta)
├── interceptors   → auth.interceptor.ts (añade `Authorization: Bearer <token>`; cierra sesión con 401)
├── utils          → calculos.ts (IVA, descuentos), validaciones.ts (DNI, cupones, email),
│                    formato.ts + euro.pipe.ts, negocio.ts (datos del local)
├── app.routes.ts
└── app.config.ts
src/environments   → URL de la API (desarrollo / producción) y `useMocks`
```

## Reglas de negocio implementadas

- Precios con **IVA del 10 % incluido**; el resumen separa base imponible e IVA.
- **Cupón y socio FitZone no se suman**: se aplica solo el descuento mayor y el total nunca es negativo.
- Cupón válido solo si existe, está activo, vigente, con usos, cumple el mínimo y, si es personal, coincide el email.
- DNI de socio con letra de control.
- Máximo 15 líneas por pedido y 20 unidades por línea. Una línea con un producto agotado bloquea el paso 2.
- El precio de cada línea se fija al añadirla (los cambios de precio no afectan a pedidos ya hechos).
- Flujo del pedido: pendiente → en preparación → listo → entregado. Solo se cancela si está pendiente.
- "Retirar" un producto es una baja lógica: desaparece de la carta pero se conserva en el historial.
- Los informes cuentan solo pedidos entregados.

## Conectar la API real

1. Pon la URL en `src/environments/environment*.ts` (`apiUrl`) y cambia `useMocks` a `false`.
2. Todas las llamadas pasan por `services/api.service.ts`; cada servicio indica el endpoint que usa
   (p. ej. `GET /productos`, `PATCH /productos/estado`, `POST /pedidos`, `POST /auth/login`).
3. El login debe devolver `{ token, usuario }` (ver `models/usuario.ts`).

> Con datos de ejemplo el estado vive en memoria: al recargar la página o cambiar de rol se vuelve a los datos iniciales
> (la sesión y el carrito sí se guardan en `localStorage`).

## Pendiente

- **Fotos de producto**: exporta las imágenes desde Figma y guárdalas en `public/img/` con estos nombres
  (mientras no existan se muestra un marcador):
  `flat-white.jpg`, `tostada-aguacate.jpg`, `cold-brew-naranja.jpg`, `roll-canela.jpg`, `fitzone-proteina.jpg`,
  `bowl-granola.jpg`, `cappuccino.jpg`, `croissant.jpg`, `matcha-latte.jpg`, `tostada-jamon.jpg`,
  `tarta-queso.jpg`, `smoothie.jpg`, `mocaccino.jpg`.
- **Datos del local** (dirección, teléfono, email) en `src/app/utils/negocio.ts`: ahora son de ejemplo.
- Las vistas Cómo funciona, Mi perfil, Turno y Resumen no tienen pantalla en el mockup; tienen una versión sencilla.
