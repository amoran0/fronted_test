# The Coffee Room

Web de pedidos de la cafetería, implementada en **Angular 22** a partir del mockup de Figma.
Componentes standalone, señales (`signal`, `computed`), sin Zone.js y rutas con carga diferida.
Consume la API REST de Spring Boot del proyecto de DWES (`/api/v1`).

## Arrancar

```bash
npm install
npm start          # http://localhost:4200  (entra por localhost, no por 127.0.0.1: CORS)
npm run build      # compilación de producción en dist/
```

Con `usarDatosSimulados: true` (por defecto en desarrollo) no hace falta el backend. Para usar la
API real, arranca antes el backend en `http://localhost:8081` (ver «Conectar la API real»).

## Roles y cuentas de prueba

Son las cuentas del **script SQL de la base de datos**, así que valen igual con datos simulados y con la API real.
En **Acceder** hay botones de acceso rápido (solo en desarrollo, `entorno.cuentasDemostracion`).

| Rol      | Email                          | Contraseña            | Inicio          | Vistas |
| -------- | ------------------------------ | --------------------- | --------------- | ------ |
| Público  | —                              | —                     | `/carta`        | Carta, Detalle del producto, Cómo funciona, Acceder, Crear cuenta |
| Cliente  | `carlos.gomez@gmail.com`       | `hash_pass_123`       | `/carta`        | Realiza tu pedido, Descuento y confirmación, Mis pedidos, Perfil |
| Cliente  | `maria.lopez@yahoo.com`        | `hash_pass_456`       | `/carta`        | (tiene el cupón personal `SOLOMARIA`) |
| Barista  | `marcos.barista@cafeteria.com` | `hash_pass_barista1`  | `/barista/cola` | Cola de pedidos, Disponibilidad, Turno |
| Camarero | `lucia.camarera@cafeteria.com` | `hash_pass_camarero2` | `/barista/cola` | Las mismas que el barista |
| Admin    | `gerencia@cafeteria.com`       | `admin123`            | `/admin/carta`  | Resumen, Gestión de carta, Editar producto, Cupones, Solicitudes CineTown, Informes |

La barra lateral cambia de menú según el rol, y los guards impiden entrar en vistas de otro rol
(la protección real la hace la API: los guards solo ocultan pantallas).

## Estructura

```
src/app
├── models         → api.ts: contrato EXACTO con la API (DTO: mismos campos y enums que el JSON)
│                    producto.ts, pedido.ts, cupon.ts, usuario.ts, informe.ts, pagina.ts: modelos de pantalla
│                    descuento.ts, linea-carrito.ts: clases del dominio
├── services       → servicio-api (HttpClient) y uno por recurso: productos, pedidos, carrito, cupones,
│                    informes, autenticacion
├── simulacion     → servidor simulado (solo con usarDatosSimulados): datos del script SQL,
│                    rutas, reglas de negocio y errores iguales que la API
├── components     → reutilizables: estructura, barra lateral, tarjetas, etiquetas, avisos, paginador…
├── pages          → una carpeta por vista
├── guards         → guarda-rol.ts (sesión y rol, vía `data.roles`), guarda-sesion.ts (solo invitados)
├── interceptors   → interceptor-sesion.ts (añade `Authorization: Bearer <token>`; cierra sesión con 401)
├── utils          → mapeadores.ts (API ⇄ pantalla), filtros-carta.ts (parámetros de GET /productos),
│                    presentacion.ts (imágenes y grupos de la carta), calculos.ts, validaciones.ts, formato.ts…
├── rutas.ts
└── configuracion-aplicacion.ts
src/entornos       → URL de la API, `usarDatosSimulados` y cuentas de prueba (desarrollo / producción)
```

## Comunicación con la API

- **Un solo punto de acceso**: `ServicioApi` hace GET, POST, PUT, PATCH y DELETE con `HttpClient`.
  Los componentes nunca hacen peticiones: se las piden a los servicios.
- **Dos capas de modelos**: `models/api.ts` copia el JSON de la API tal cual (`precioVenta`, `idCategoria`,
  `numeroTurno`, enums en MAYÚSCULAS…) y `utils/mapeadores.ts` lo convierte en los modelos de pantalla.
  Si la API cambia un campo, solo se toca el mapeador.
- **Parámetros en la URL** (`HttpParams`): filtros y paginación de la carta
  (`GET /productos?nombre=&categoriaId=&categoriaId=&disponible=&precioMaximo=&sinAlergenoId=&page=&size=`),
  listado de pedidos (`?clienteId=&sort=fecha,desc&size=`) e informes (`?fecha=`, `?desde=&hasta=&limite=`).
  Los arrays se envían repetidos (`?categoriaId=a&categoriaId=b`).
- **Errores**: la API responde siempre con `ProblemDetail` (`{ status, title, detail, errores? }`).
  `traducirError` muestra `detail` (p. ej. el motivo de una regla de negocio en un 422) o, en un 400 de
  validación, los mensajes de `errores` por campo.
- **Lo calcula siempre el servidor**: precio de cada línea (RN-03), descuento (RN-06/07), IVA (RN-05) y turno
  (RN-09). El carrito enseña una previsión y, al confirmar, se muestra el pedido que devuelve `POST /pedidos`.
  Los cupones se validan con `POST /cupones/validar`, no en el navegador.
- **Pantalla destacada**: la cola de pedidos del barista se recarga sola cada 15 s; *Mis pedidos*
  consulta el estado del turno cada 30 s mientras haya un pedido en curso.

### Endpoints que usa cada servicio

| Servicio | Endpoints |
| --- | --- |
| Productos | `GET /productos` · `GET /alergenos` · `POST /productos` · `PUT /productos/{id}` · `PATCH /productos/{id}/disponibilidad` · `DELETE /productos/{id}` · `POST /alergenos` |
| Categorías | `GET /categorias` · `PATCH /categorias/{id}/disponibilidad` · `POST /categorias` · `DELETE /categorias/{id}` |
| Pedidos | `POST /pedidos` · `GET /pedidos` · `PATCH /pedidos/{id}/estado` |
| Cupones | `POST /cupones/validar` · `POST /cupones` · `GET /cupones` · `PUT /cupones/{id}` · `DELETE /cupones/{id}` |
| Informes | `GET /informes/ventas-dia` · `GET /informes/productos-top` · `GET /informes/ventas-franja` |
| Autenticación | `POST /auth/login` · `POST /auth/registro` |

## Datos simulados

Con `usarDatosSimulados: true` el interceptor `simulacion/interceptor-simulado.ts` contesta las peticiones
sin salir del navegador. Las peticiones siguen pasando por `HttpClient` y por el interceptor de sesión, y las
respuestas tienen **las mismas rutas, el mismo JSON y los mismos códigos de error** que la API real
(incluidos 401/403 por rol y las reglas RN-01…RN-10). Los datos son los del script SQL de la base de datos.

> El estado simulado vive en memoria: al recargar la página se vuelve a los datos iniciales
> (la sesión y el carrito sí se guardan en `localStorage`).

## Conectar la API real

1. Arranca el backend (`http://localhost:8081/api/v1`; la URL está en `src/entornos/entorno.desarrollo.ts`).
2. Pon `usarDatosSimulados: false` en ese mismo fichero. **No hay que tocar nada más.**
3. (Opcional) Borra la carpeta `src/app/simulacion/` y la línea que importa `interceptorSimulado` en
   `configuracion-aplicacion.ts` (está marcada con un comentario).

En la pestaña **Red** del navegador verás entonces las peticiones reales a `localhost:8081`.

### Endpoints pendientes en el backend

La app ya los usa (y el servidor simulado los implementa), pero hay que añadirlos a la API de Spring Boot
para que todo funcione contra la API real. Cada uno está documentado en `models/api.ts`.

| Endpoint / cambio | Rol | Para qué |
| --- | --- | --- |
| Spring Security + JWT · `POST /auth/login` `{email, contrasena}` → `{token, usuario}` | Público | Iniciar sesión |
| `POST /auth/registro` `{nombre, email, dni, contrasena}` → `{token, usuario}` (409 si email/DNI repetidos) | Público | Crear cuenta de cliente |
| CORS para `http://localhost:4200` | — | Que el navegador permita las llamadas |
| `GET /alergenos` → `[{id, nombre}]` · `POST /alergenos` `{nombre}` | Público · ADMIN | Filtro de la carta y gestión |
| `GET /productos`: `categoriaId` y `sinAlergenoId` repetibles (listas) | Público | Filtros Café/Comida/Fríos y varios alérgenos |
| `GET /productos?incluirInactivos=true` | ADMIN | Ver y reactivar los productos retirados |
| `POST /categorias` `{nombre}` · `DELETE /categorias/{id}` (409 si tiene productos) | ADMIN | Gestión de categorías |
| `GET /cupones` (con `usos`) · `PUT /cupones/{id}` · `DELETE /cupones/{id}` (409 si se ha usado) | ADMIN | Gestión de cupones |
| `CuponRequestDto.activo` (opcional) | ADMIN | Desactivar un cupón al editarlo |
| `GET /informes/ventas-franja?fecha=` → `[{hora, total}]` | ADMIN | Gráfico de ventas por hora |
| `VentasPorDia.descuentos` | ADMIN | Indicador de descuentos del día |
| `PATCH /pedidos/{id}/estado`: un CLIENTE puede cancelar **su** pedido PENDIENTE | CLIENTE | Cancelar desde «Mis pedidos» |
| `POST /pedidos` y `GET /pedidos` como CLIENTE: el cliente sale del token | CLIENTE | Que nadie pida o vea pedidos de otro |

### Qué funciona contra la API real hoy

- **Sin CORS, ninguna**: el navegador bloquea todas las llamadas desde `localhost:4200`.
- **Con CORS y `GET /alergenos`, sin seguridad**: la carta pública (listado, detalle y filtros de texto,
  precio y disponibilidad) funciona contra la API real. Sin `GET /alergenos` falla la carga inicial del catálogo. Todo lo que exige iniciar sesión (pedidos, cupones,
  gestión, informes) necesita además `POST /auth/login`, y algunas pantallas los endpoints de la tabla anterior.
- **Con toda la tabla implementada**: la aplicación completa funciona contra la API real.

## Reglas de negocio (las aplica la API; el cliente las anticipa)

- Precios con **IVA del 10 % incluido**; el resumen separa base imponible e IVA (RN-05).
- **Cupón y socio FitZone no se suman**: se aplica solo el descuento mayor y el total nunca es negativo (RN-07).
- Cupón válido si existe, está activo, vigente, con usos, el subtotal **supera** el mínimo y, si es personal,
  coincide el email (RN-06).
- Máximo 15 productos por pedido y de 1 a 20 unidades por línea (RN-04). Un producto agotado o retirado
  —o de una categoría agotada— no se puede pedir (RN-02).
- Flujo del pedido: pendiente → en preparación → listo → entregado; solo se cancela si está pendiente (RN-08).
- "Retirar" un producto es una baja lógica: desaparece de la carta pero se conserva en el historial (RN-01).
- Los informes cuentan solo pedidos entregados (RN-10).

## Clases de dominio (POO)

- `models/descuento.ts`: clase abstracta `Descuento` con las subclases `DescuentoPorcentaje`,
  `DescuentoImporteFijo` y `DescuentoSocioFitZone` (hereda de `DescuentoPorcentaje`). Cada una
  redefine `calcularImporte()` / `describir()`; el carrito compara cupón y socio con el mismo método `aplicar()`.
- `models/linea-carrito.ts`: clase `LineaCarrito` con `total`, `esCobrable` y `aLineaDePedido()`.

## Pendiente

- **Fotos de producto**: la API no envía imágenes. Se asignan por id en `src/app/utils/presentacion.ts`
  (ficheros en `public/img/`); los productos sin foto muestran un fondo liso.
- **Grupos de la carta** (Café · Comida · Fríos): también en `presentacion.ts`, por id de categoría.
- **Datos del local** (dirección, teléfono, email) en `src/app/utils/negocio.ts`: ahora son de ejemplo.
- Las opciones de cada línea (tipo de leche…) son orientativas: la API no las guarda.
