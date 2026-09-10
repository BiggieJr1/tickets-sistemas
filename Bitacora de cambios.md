---
tags: [tickets-sistemas, bitacora, cambios]
actualizado: 2026-09-10
---

# Bitácora de cambios — Tickets Sistemas

Documentación de todo lo que se modificó desde que empezamos con los cambios (4 de septiembre de 2026).
El proyecto son **dos repos separados**:

| Repo | Ruta | Qué es |
|---|---|---|
| Frontend | `Desktop\tickets-sistemas` | App Angular (esta bóveda) |
| Backend | `D:\tickets-sistemas` | API .NET (`TicketsSistemas.Api`) |

**Índice:**
1. [[#1. Resumen ejecutivo]]
2. [[#2. Backend — `D:\tickets-sistemas`|Backend — restablecimiento inicial]]
3. [[#3. Frontend — `Desktop\tickets-sistemas`|Frontend — UX, accesibilidad y conexión a la API]]
4. [[#4. Estado actual del repo|Estado del repo (4 sep)]]
5. [[#5. Arquitectura resultante|Arquitectura resultante (4 sep)]]
6. [[#6. Sesión del 8 de septiembre (tarde) — cadena de fallos al desplegar|Cadena de fallos al desplegar]]
7. [[#7. Sesión del 8 de septiembre (tarde) — quién prioriza y quién reporta|Quién prioriza y quién reporta]]
8. [[#8. Sesión del 8 de septiembre (noche) — colaboradores, login y asignación de tickets|Colaboradores, login y asignación de tickets]]
9. [[#9. Sesión del 9 de septiembre — login con Microsoft Entra ID|Login con Microsoft Entra ID]]
10. [[#10. Sesión del 10 de septiembre — pruebas del login con Microsoft y hueco de permisos|Pruebas del login con Microsoft y hueco de permisos]]

---

## 1. Resumen ejecutivo

Se pasó de una app local a un sistema publicado en la nube, con una identidad real por colaborador:

- La API se restableció y se preparó para exponerse públicamente, con **CORS configurable**.
- El frontend se **conectó a la API real** en Railway.
- Se **eliminó SSR** (renderizado en servidor): el frontend quedó como **sitio estático** para Netlify.
- Se hizo una tanda de mejoras de **UX y accesibilidad** en el listado de tickets.
- Se limpiaron **secretos**: ninguna cadena de conexión vive en el repo.
- La autenticación pasó por tres etapas (documentadas conforme avanzan las secciones): **API key compartida** (§2-3) → **colaboradores con contraseña propia y JWT** (§8) → **login real con la cuenta de Microsoft de cada persona** (§9, estado actual).

---

## 2. Backend — `D:\tickets-sistemas`

### `23fcc97` · Restableciendo backend (4 sep, 14:45)

Se reconstruyó el proyecto completo de la API (677 líneas, 14 archivos):

- `TicketsSistemas.Api/` — `TicketsController.cs`, `AppDbContext.cs`, `Ticket.cs`, `Enums.cs`, `TicketDtos.cs`, `Program.cs`, `.csproj`, `appsettings.json`.
- `Dockerfile` + `docker-compose.yml` para levantar la API en contenedor.
- `nginx-tickets.conf.example` como plantilla del proxy inverso.
- `README.md` y `DEPLOY-NUBE.md` con el procedimiento de despliegue.

**Decisiones de configuración que quedaron en `Program.cs`:**

- **Base de datos:** Postgres (Supabase). La cadena de conexión *nunca* se hardcodea; se lee de la variable de entorno `ConnectionStrings__Default`. Si falta, la app truena al arrancar con un mensaje claro en vez de fallar silenciosamente.
- **CORS:** variable `ALLOWED_ORIGINS` (lista separada por comas). Si no se configura, queda abierto — pensado para uso local / red interna.
- **API key:** variable `API_KEY`. Si está configurada, todas las rutas `/api/*` exigen el header `X-Api-Key`; si no, no se exige nada (comportamiento anterior para uso interno).
- **Enums como texto:** `JsonStringEnumConverter`, para que el JSON mande `"Red"` / `"Critica"` en vez de números.
- **Esquema automático:** `db.Database.EnsureCreated()` al arrancar.
- **Healthcheck:** endpoint `GET /health` para Docker / balanceador.
- **Swagger** habilitado.

### `c277f2b` · fix: quitar connection string vacía por defecto (4 sep, 15:11)

`appsettings.json` traía `"ConnectionStrings": { "Default": "" }`. Esa cadena vacía **ganaba** sobre la variable de entorno en algunos escenarios y provocaba errores de conexión confusos. Se dejó `"ConnectionStrings": {}`.

> [!warning] Puntos pendientes / a cuidar
> - `docker-compose.yml` toma la cadena de `${SUPABASE_CONNECTION_STRING}`: debe estar en un `.env` local (ya ignorado por git) o exportada en la shell.
> - En Railway hay que tener configuradas `ConnectionStrings__Default`, `API_KEY` y `ALLOWED_ORIGINS`.

---

## 3. Frontend — `Desktop\tickets-sistemas`

### `9c04d1f` · cambios de claudio (4 sep, 15:37)

Tanda grande de mejoras de UX, accesibilidad y manejo de errores (427 inserciones / 44 eliminaciones).

**Manejo de errores (`tickets.service.ts`)**

- Nueva función exportada `extraerMensajeError(e)`: prioriza el mensaje que manda el backend (string plano o `{ message }`) sobre el genérico de Angular (`"Http failure response for..."`). Distingue el caso `status === 0` → *"No se pudo conectar con la API."*
- `cambiarEstado`, `cambiarPrioridad` y `eliminar` ahora atrapan sus errores y los publican en la señal `error()` en lugar de reventar la promesa sin aviso.

**Modal de nuevo ticket**

- Foco automático en el primer campo al abrir (`@ViewChild('primerCampo')` + `ngAfterViewInit`).
- Cierre con la tecla **Escape** (`@HostListener('document:keydown.escape')`).
- Bloqueo del scroll del `body` mientras el modal está abierto, restaurándolo al destruirse.
- `role="dialog"`, `aria-modal`, `aria-labelledby`, `label for` / `id` en todos los campos y `role="alert"` en los mensajes de error.
- El error de guardado ya usa el mensaje real del backend.

**Barra de filtros**

- Botón **"Limpiar filtros"**, visible solo cuando hay algún filtro activo (`hayFiltrosActivos` como `computed`).
- `aria-label` en el buscador y en los tres selects.

**Listado y filas**

- La fila del ticket pasó de `<div (click)>` a `<button>` real, con `aria-expanded` / `aria-controls` apuntando al detalle (`detalle-{id}`) y estilo `:focus-visible`. Ahora es navegable por teclado.
- El banner de error ya no oculta la lista: se muestra arriba con `role="alert"` y el estado vacío solo aparece si no hubo error.
- Spinner animado en el estado de carga en lugar de solo texto.
- El detalle muestra la fecha de **Actualizado** cuando existe, y los selects de estado/prioridad tienen `aria-label`.

**Fuentes y rendimiento**

- El `@import` de Google Fonts se sacó del SCSS (bloqueaba el render en cascada) y se movió a `index.html` con `preconnect` a `fonts.googleapis.com` y `fonts.gstatic.com`.
- Se agregó `<meta name="theme-color" content="#10141a">`.

**SSR (temporal, luego se quitó)**

- `app.routes.server.ts`: la ruta `tickets` se marcó como `RenderMode.Client`, porque prerenderizar un dashboard que carga datos por HTTP no funciona en build/CI sin la API viva.

> También entró en este commit la carpeta `.obsidian/` (config de esta bóveda).

### `5b2c3d4` · Conexión de frontend y API (4 sep, 15:44)

- **Nuevo `src/app/auth/api-key.interceptor.ts`:** pide la contraseña compartida **una sola vez** con `window.prompt`, la guarda en `localStorage` (`ticketsApiKey`) y la manda como header `X-Api-Key` en cada petición. Si la API responde **401**, borra la key guardada para que se vuelva a pedir. Protegido con `isPlatformBrowser` porque también corría en SSR, donde no existen `window` ni `localStorage`.
- **`app.config.ts`:** `provideHttpClient(withInterceptors([apiKeyInterceptor]))`.
- **`tickets.service.ts`:** la URL base ahora depende del entorno —
  - dev (`ng serve`): `/api/tickets`, que `proxy.conf.json` redirige a `http://localhost:5080`;
  - producción: `https://tickets-sistemas-backend-production.up.railway.app/api/tickets`.

> [!note] Nota de seguridad
> La API key es una **contraseña compartida en el navegador**, no autenticación por usuario: sirve para que la API pública no quede abierta, pero cualquiera con la contraseña entra y no hay rastro de quién hizo qué. Si más adelante se necesita saber quién cambió un ticket, hay que pasar a usuarios reales.
>
> *(Resuelto en §8: se quitó esta API key — ver §6.1 — y más adelante se reemplazó por login real de colaboradores.)*

### Serie de despliegue en Netlify (4 sep, 15:57 → 17:08)

Tres commits que en conjunto **quitaron SSR**:

1. `a7760d2` — se agregó `@netlify/angular-runtime` (requerido para SSR en Netlify).
2. `7623349` — **quitar SSR, dejar el frontend como sitio estático**: se removió la config de servidor en `angular.json` y se agregó `public/_redirects` (regla SPA para que las rutas internas no den 404).
3. `ffc6603` — se quitó `@netlify/angular-runtime` de `package.json` / `package-lock.json`, ya sin uso.

**Motivo:** el prerender requería una API viva durante el build, y para un dashboard interno el SSR no aportaba nada. Sitio estático = build más simple y despliegue más barato.

> [!info] Archivos que quedaron pero ya no se usan
> `src/main.server.ts`, `src/server.ts`, `src/app/app.config.server.ts` y `src/app/app.routes.server.ts` siguen en el repo aunque el SSR ya está desactivado. Se pueden borrar cuando quieras hacer limpieza.

---

## 4. Estado actual del repo

- **Backend (`D:\tickets-sistemas`):** árbol limpio, sin cambios pendientes.
- **Frontend (`Desktop\tickets-sistemas`):** 20 archivos aparecen como modificados en `git status`, pero **son solo cambios de fin de línea (CRLF/LF)** — `git diff --ignore-all-space` no reporta ninguna diferencia real. No hay código sin commitear.

---

## 5. Arquitectura resultante

```
Navegador (Netlify, sitio estático Angular)
        │  Authorization: Bearer <JWT del colaborador logueado> (ver §8)
        ▼
API .NET en Railway  ──►  Postgres (Supabase, Session pooler :5432)
   · CORS: ALLOWED_ORIGINS
   · Auth: JWT_SECRET + login de Colaboradores
   · GET /health
```

En desarrollo local: `ng serve` → `proxy.conf.json` → `http://localhost:5080` (API en Docker).

---

## 6. Sesión del 8 de septiembre (tarde) — cadena de fallos al desplegar

Después de cambiar el proyecto de Supabase que usa el backend, el sitio quedó desplegado pero encadenó varios errores distintos. Se fueron resolviendo uno por uno:

### 6.1 Reversión de la autenticación por API key

Se quitó lo agregado en `5b2c3d4` (interceptor `X-Api-Key` con `window.prompt`): se borró `src/app/auth/api-key.interceptor.ts` y su registro en `app.config.ts`. El frontend vuelve a llamar a la API sin pedir contraseña. El backend no se tocó porque el chequeo de `X-Api-Key` en `Program.cs` ya era opcional (solo se activa si la variable `API_KEY` está configurada en Railway).

### 6.2 Netlify: 404 al desplegar

No existía `netlify.toml`. Con el builder nuevo de Angular (`@angular/build:application`) el `index.html` real queda en `dist/tickets-sistemas/browser/`, no en `dist/tickets-sistemas/` — si Netlify tenía puesto el *publish directory* sin el `/browser` (fácil de confundir con el "Output location" que imprime `ng build`), servía una carpeta sin `index.html`.

Se agregó `netlify.toml` en la raíz del frontend con `command`, `publish = "dist/tickets-sistemas/browser"` y la regla de redirect SPA.

### 6.3 Backend: `relation "Tickets" does not exist` (500)

Al cambiar de proyecto de Supabase, la API respondía 500 en `/api/tickets` (pero `/health` sí daba 200). Causa: `Program.cs` usaba `db.Database.EnsureCreated()`, que decide si "ya hay esquema" contando cualquier tabla fuera de `pg_catalog`/`information_schema` — y todo proyecto de Supabase trae de fábrica tablas propias (`auth.*`, `storage.*`, etc.), así que `EnsureCreated()` nunca llegaba a crear la tabla `Tickets` en un proyecto nuevo.

Fix definitivo: se generó una migración real de EF Core (`Migrations/..._InitialCreate.cs`, con Docker + SDK de .NET 8 porque la máquina de desarrollo solo tenía .NET 10) y `Program.cs` ahora llama a `db.Database.Migrate()` en vez de `EnsureCreated()`. Como ya se había creado la tabla a mano una vez (con tipos ligeramente distintos a los que genera EF), se borró esa tabla antes de desplegar para que la migración la recreara con el esquema correcto.

### 6.4 Backend: crash loop / timeouts de 32s al arrancar

Tras el fix de arriba, el backend entró en **crash loop** (todo respondía 502, incluso `/health`): la consulta que EF hace para checar `__EFMigrationsHistory` se colgaba ~32s leyendo del socket, tronaba por timeout, y al ser una excepción sin capturar en el arranque (`Program.cs`, antes de `app.Run()`), tumbaba el proceso completo — Railway lo reiniciaba y se repetía el ciclo.

Causa: la cadena de conexión usaba el **Transaction pooler** de Supabase (puerto **6543**), pensado para conexiones cortas tipo serverless; recicla la conexión física entre sentencias, lo que no aguanta bien un arranque con varias consultas seguidas (como `Migrate()`) desde un servidor siempre encendido como este.

Fix: cambiar `ConnectionStrings__Default` en Railway al **Session pooler** (mismo host, puerto **5432** en vez de 6543). Conexión estable, sin más crashes.

### 6.5 Backend: CORS bloqueado en el navegador

Con todo lo anterior resuelto, el navegador seguía marcando error de CORS (`No 'Access-Control-Allow-Origin' header is present`) aunque `curl` mostraba que la API respondía 200. Causa: la variable `ALLOWED_ORIGINS` en Railway tenía `https://generador-tickets.netlify.app/tickets` (con la ruta incluida) — el header `Origin` que manda el navegador nunca incluye la ruta, solo esquema+dominio, así que nunca hacía match contra `WithOrigins(...)` en `Program.cs` y CORS rechazaba la petición sin avisar con un error claro del lado del servidor.

Fix: `ALLOWED_ORIGINS` = `https://generador-tickets.netlify.app` (sin ruta, sin slash final).

### 6.6 Resultado

Con los cinco fixes (auth, `netlify.toml`, migraciones, puerto del pooler, `ALLOWED_ORIGINS`), el sitio en Netlify carga y conecta bien con la API en Railway, que a su vez conecta bien a la base nueva de Supabase.

---

## 7. Sesión del 8 de septiembre (tarde) — quién prioriza y quién reporta

Cambio de flujo pedido por el equipo: la prioridad de un ticket ya no la decide quien lo reporta, la asigna soporte al revisarlo (para poder priorizar y dar seguimiento ellos mismos). De paso, se volvió obligatorio decir quién levanta el ticket.

**Backend:**
- Nuevo valor de enum `Prioridad.SinAsignar` (agregado al final, después de `Baja`, para no correr los valores existentes). Se asigna solo al crear un ticket — ya no se recibe `Prioridad` en `TicketCreateDto`. Soporte la cambia después con el mismo `PATCH /api/tickets/{id}/prioridad` de siempre.
- `OrdenPrioridad` en `TicketsController` ordena `SinAsignar` primero (antes que `Critica`), para que los tickets sin revisar aparezcan al inicio del listado.
- `Solicitante` pasó de opcional a obligatorio: `Ticket.cs`, `AppDbContext` (`IsRequired()`) y `TicketCreateDto` (`[Required]`). Se agregó la migración `SolicitanteRequerido` (`ALTER COLUMN ... SET NOT NULL`).

**Frontend:**
- El modal de "Nuevo ticket" ya no tiene el campo de prioridad; "Solicitante" dejó de decir "(opcional)" y ahora valida `Validators.required`.
- `PrioridadValue` y `PRIORIDADES` incluyen `'SinAsignar'` / "Sin asignar" (aparece primero en los selects de filtro y de detalle, igual que en el backend).
- Badge y borde propios para "Sin asignar" en `ticket-row` usando el color `--accent` (teal), distinto de los niveles reales de prioridad, para que salte a la vista que falta revisarlo.

Probado end-to-end en `generador-tickets.netlify.app/tickets`: crear ticket sin prioridad → queda "Sin asignar" arriba del listado → cambiarlo a una prioridad real desde el detalle → se guarda correctamente.

---

## 8. Sesión del 8 de septiembre (noche) — colaboradores, login y asignación de tickets

Hasta aquí la API no tenía ninguna autenticación real (la API key compartida se había quitado en §6.1). El equipo pidió poder identificar quién es cada persona que da soporte (**colaboradores**), que algunos de ellos sean **administradores** (mismo colaborador, un permiso extra — no un rol jerárquico aparte), y poder **asignar tickets** a alguien y ver quién hizo el último cambio. Se decidió que **todo el sitio quede detrás de login**, incluyendo levantar un ticket nuevo.

### 8.1 Por qué JWT y no cookie de sesión

Frontend (Netlify) y backend (Railway) son orígenes distintos. Una cookie de sesión hubiera exigido `SameSite=None; Secure` + `AllowCredentials()` en CORS, complicando el matching exacto de `ALLOWED_ORIGINS` que costó trabajo dejar bien en §6.5. Un JWT en el header `Authorization: Bearer <token>` evita eso por completo: sin modo credenciales en CORS, sin sesión guardada en el servidor.

### 8.2 Backend (`D:\tickets-sistemas`)

- **Nueva entidad `Colaborador`** (`Models/Colaborador.cs`): `NombreCompleto`, `Email` (único, es el usuario de login), `PasswordHash` (BCrypt, paquete `BCrypt.Net-Next`), `EsAdministrador`, `Activo` (se desactiva, nunca se borra — para no romper referencias de tickets viejos).
- **`Ticket` gana dos FKs nullable** a `Colaborador` (`SetNull` al borrar): `AsignadoAId` (a quién está asignado) y `ActualizadoPorId` (quién hizo el último cambio de estado/prioridad/asignación — la respuesta mínima a la nota de seguridad de §3, sin construir una tabla de historial completa).
- **JWT** (`Services/JwtService.cs`): firma con `JWT_SECRET` (variable de entorno nueva), token vigente 12h, claim `esAdministrador` para la policy de autorización. Paquete `Microsoft.AspNetCore.Authentication.JwtBearer`. Un handler `OnTokenValidated` revisa `Activo` en cada request (no solo al hacer login), así que desactivar a alguien surte efecto de inmediato.
- **`AuthController`**: `POST /api/auth/login` (público), `GET /api/auth/me`, `PATCH /api/auth/me/password`.
- **`ColaboradoresController`**: `GET` (cualquier colaborador logueado, para poblar el selector "asignar a"; con `?soloActivos=true` para ese caso puntual), `POST`/`PATCH {id}`/`PATCH {id}/password` (solo administradores). Sin `DELETE` — se desactiva con el PATCH combinado.
- **`TicketsController`** ahora exige `[Authorize]` en todo. Nuevo `PATCH /api/tickets/{id}/asignacion` (`{ colaboradorId: int? }`, null desasigna) — lo puede usar cualquier colaborador, no solo admins, porque asignar es el día a día, no una acción sensible. `DELETE` sigue siendo solo de administradores.
- **Primer administrador**: se siembra solo al arrancar (`Program.cs`, junto al `Database.Migrate()`) leyendo `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — mismo patrón que `ConnectionStrings__Default` / `ALLOWED_ORIGINS`. Se rechazó a propósito un endpoint abierto de "crear primer admin": esta app ya aprendió esa lección con la API key compartida que hubo que quitar después.
- Migración `AgregarColaboradoresYAsignacion` (tabla `Colaboradores` + las dos columnas FK en `Tickets`), generada con Docker (`mcr.microsoft.com/dotnet/sdk:8.0`) igual que las anteriores.

### 8.3 Frontend (`Desktop\tickets-sistemas`)

- **`AuthService`** (signals, como `TicketsService`): `currentUser`, `isAdmin` (computed), `login()`/`logout()`/`restoreSession()`. El token vive en `localStorage`.
- **`authInterceptor`**: agrega `Authorization: Bearer`, y en un 401 desloguea y manda a `/login`. Es el primer interceptor que registra `app.config.ts` desde que se quitó el de la API key.
- **`provideAppInitializer`** en `app.config.ts` espera a que `restoreSession()` termine antes de que el router resuelva la primera ruta — si no, los guards verían `currentUser()` en null todavía y mandarían al login a alguien con sesión activa.
- **Guards** `authGuard` / `adminGuard`, nuevas rutas `/login` (pública) y `/colaboradores` (solo admin).
- **`/colaboradores`**: tabla con toggles de Admin/Activo y reseteo de password inline, más un modal de alta — mismo lenguaje visual que el modal de "Nuevo ticket".
- **`ticket-detail`**: nuevo `<select>` "asignar a" (mismo patrón que Estado/Prioridad), muestra "Asignado a" y "Actualizado por" en los metadatos, y el botón "Eliminar" solo se ve si eres administrador (el backend también lo exige, esto evita el clic que truena con 403).
- Header global mínimo en `app.html` (nombre del colaborador, link a Colaboradores si es admin, logout) — no había ningún layout compartido antes, `app.html` era solo `<router-outlet />`.
- `extraerMensajeError` y la URL base de la API se movieron de `tickets.service.ts` a un util compartido (`services/api.util.ts`), porque ahora tres servicios (`tickets`, `auth`, `colaboradores`) los necesitan.

### 8.4 Resultado

Probado end-to-end en producción: `/tickets` redirige a `/login` si no hay sesión → login con el admin sembrado entra y ve "Colaboradores" en el header → crear un colaborador nuevo (no-admin) → asignarle un ticket desde el detalle → queda "Actualizado por Administrador" registrado → desactivar ese colaborador de prueba. Todo funcionó sin ajustes adicionales.

---

## 9. Sesión del 9 de septiembre — login con Microsoft Entra ID

Bisoft ya tiene Microsoft Entra ID (Microsoft 365), así que se decidió dejar de manejar contraseñas propias del sistema y usar el login corporativo. Cutover completo: no quedó login por correo/contraseña como respaldo. Se mantuvo el criterio ya usado con los administradores (§8.2): **no hay auto-alta** — un administrador tiene que dar de alta al colaborador (nombre + correo) desde `/colaboradores` antes de que esa persona pueda entrar; si el correo de la cuenta de Microsoft no coincide con ningún `Colaborador` activo, el login rechaza con un mensaje explícito en vez de crear la cuenta sola.

### 9.1 Arquitectura: SPA + API protegida en Entra ID

Patrón estándar de Microsoft para este escenario (sin cookies, sigue siendo `Authorization: Bearer <token>` como con el JWT propio — por eso frontend en Netlify y backend en Railway, orígenes distintos, no necesitaron tocar CORS):

- Dos **App Registrations** en el tenant de Bisoft (pendiente crearlos en el portal, ver §9.4): `tickets-sistemas-api` (expone el scope `access_as_user`) y `tickets-sistemas-frontend` (plataforma SPA, sin secreto — usa PKCE).
- El frontend usa **MSAL.js** (`@azure/msal-browser` + `@azure/msal-angular`) para hacer `loginRedirect` contra Microsoft y adjuntar el access token como Bearer.
- El backend ya no firma sus propios JWT: valida los tokens de Microsoft con **`Microsoft.Identity.Web`** (`AddMicrosoftIdentityWebApi`).

### 9.2 Backend (`D:\tickets-sistemas`)

- `Colaborador` perdió `PasswordHash` — Microsoft ya validó quién es la persona, esta app solo necesita su mapeo local (`EsAdministrador`, `Activo`). Migración `QuitarPasswordHashUsarEntraId` (drop de columna).
- `Program.cs`: `AddJwtBearer` con clave simétrica propia → `AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"))`. Se encadenó un `OnTokenValidated` extra (después del que ya trae Microsoft.Identity.Web): a partir del correo del token de Microsoft (`ClaimTypes.Upn` / `preferred_username` / `ClaimTypes.Email`), busca el `Colaborador` local y le agrega los claims `NameIdentifier` (id local) y `esAdministrador` — así `ColaboradorActualAsync()` y la policy `"Administrador"` siguen funcionando sin tocar `TicketsController` ni `ColaboradoresController`. Si el correo no tiene `Colaborador` o está `!Activo`, rechaza ahí mismo.
- Se quitaron: `JwtService`, el paquete `BCrypt.Net-Next`, `POST /api/auth/login`, `PATCH /api/auth/me/password` y `PATCH /api/colaboradores/{id}/password`. `GET /api/auth/me` sigue igual.
- El seed del primer administrador (`SEED_ADMIN_EMAIL`) ya no necesita `SEED_ADMIN_PASSWORD` — solo el correo, porque quien entre con esa cuenta ya se autenticó con Entra ID.
- Nueva config `AzureAd` en `appsettings.json` (Instance/TenantId/ClientId vacíos, se llenan por variable de entorno `AzureAd__TenantId` / `AzureAd__ClientId` en Railway, mismo patrón que `ALLOWED_ORIGINS`).
- Migración generada igual que las anteriores: Docker + `mcr.microsoft.com/dotnet/sdk:8.0` (la máquina de desarrollo solo tiene .NET 10), con una cadena de conexión dummy vía `ConnectionStrings__Default` para el design-time (no hace falta una base real para generar la migración).

### 9.3 Frontend (`Desktop\tickets-sistemas`)

- `@azure/msal-browser` + `@azure/msal-angular` agregados (sin conflicto de peer deps con Angular 22).
- Nuevo `src/app/auth/`: `entra.config.ts` (constantes `ENTRA_TENANT_ID` / `ENTRA_SPA_CLIENT_ID` / `ENTRA_API_SCOPE`, con placeholders `TODO-...` hasta tener los App Registrations reales) y `msal.config.ts` (instancia de MSAL, `MsalGuardConfiguration`, `MsalInterceptorConfiguration` sobre `API_ROOT`).
- `app.config.ts`: `MsalModule.forRoot(...)` + `MsalInterceptor` (adjunta el Bearer automáticamente contra `protectedResourceMap`, reemplaza al interceptor manual que guardaba el token en `localStorage`). El `provideAppInitializer` ahora inicializa MSAL, procesa el regreso de un login por redirect y solo entonces llama a `AuthService.restoreSession()`.
- `AuthService`: ya no tiene `login(email, password)` ni guarda un token propio — `login()` llama a `msalService.loginRedirect()`, `restoreSession()` llama a `GET /api/auth/me` una vez que MSAL ya tiene una cuenta activa (si la API rechaza, es que la cuenta de Microsoft no está dada de alta como `Colaborador` — se lo dice a la persona en vez de un error genérico). `logout()` cierra sesión también en Microsoft; se agregó `clearLocalSession()` para cuando la API rechaza con 401 sin querer sacar a la persona de su sesión de Microsoft.
- `login.component`: pasó de formulario correo/contraseña a un botón "Iniciar sesión con Microsoft".
- `/colaboradores`: el modal de alta y la tabla perdieron el campo/columna de contraseña y el flujo de "resetear password" — ya no aplica.
- Presupuesto de bundle (`angular.json`) subido de 500kB a 650kB — MSAL agrega ~90kB al bundle inicial.
- `app.spec.ts` necesitó los providers de `MsalModule.forRoot(...)` + `provideHttpClient()` en el `TestBed`, porque `AuthService` ahora inyecta `MsalService` (que a su vez necesita el token `MSAL_INSTANCE`).

### 9.4 App Registrations creados y config rellenada

Se crearon los dos App Registrations en el portal de Azure (single-tenant, Bisoft only), se expuso el scope `access_as_user` en la API, se agregaron los redirect URIs del SPA (`https://generador-tickets.netlify.app` y `http://localhost:4200`) y se concedió el admin consent del permiso delegado (requirió que alguien con rol de administrador en Entra ID diera ese clic — el botón no aparece habilitado para una cuenta sin ese rol).

IDs reales ya cargados en `entra.config.ts` (frontend) y `appsettings.json` (backend, sección `AzureAd`):
- Tenant ID: `e3821ff1-5752-48ab-b6d8-718c531dc602`
- Client ID API (`tickets-sistemas-api`): `ddf52754-eb15-48d5-9314-1d8951f6313f`
- Client ID SPA (`tickets-sistemas-frontend`): `c50e32a0-dd31-4e62-a160-2e9169da72d3`

No son secretos (viajan igual de expuestos que la URL de la API), así que se dejaron escritos directamente en vez de por variable de entorno.

### 9.5 Se desplegó directo a producción — tres bugs encontrados y arreglados en vivo

La base de Postgres es la misma para local y producción (no hay una separada para pruebas), y la migración se aplica sola al arrancar (`db.Database.Migrate()`). Levantar el backend local hubiera dejado el login viejo roto en Railway mientras tanto, así que se decidió ir directo a desplegar (commit + push a los dos repos, Railway/Netlify despliegan solo) y depurar ahí. Se encontraron y arreglaron tres problemas, cada uno confirmado con los logs de Railway (`Deployment Logs`, filtrando por `EntraAuth`) y la pestaña Network del navegador:

1. **`AADSTS50011` (redirect URI no coincide).** MSAL, si no le fijas `redirectUri`, manda la URL completa de la página donde se dio clic (`.../login`) en vez del origen registrado en Azure. Fix: `redirectUri: window.location.origin` explícito en `msal.config.ts`.
2. **Token de Microsoft en versión 1 en vez de 2.** El scope expuesto por el asistente del portal ("Expose an API") quedó con `accessTokenAcceptedVersion: null`, que en la práctica emite tokens v1 (`iss: https://sts.windows.net/...`, `ver: "1.0"`) aunque el cliente pida por el endpoint v2 — y `Microsoft.Identity.Web` espera v2 por default. Fix: en el App Registration de la API, editar el **manifiesto de Microsoft Graph** (no el de AAD Graph, que ya se retira) y poner `"api": { "requestedAccessTokenVersion": 2 }`.
3. **El id del Colaborador se perdía (401 después de validar el token bien).** `Microsoft.Identity.Web` ya mapea el claim `sub` del token al mismo tipo `ClaimTypes.NameIdentifier` que `Program.cs` usaba para guardar el id local — quedaban dos claims del mismo tipo, y `User.FindFirstValue(ClaimTypes.NameIdentifier)` devolvía el `sub` (un id opaco de Microsoft) en vez del id numérico, así que `int.TryParse` fallaba y `AuthController.Me()` / `TicketsController` regresaban 401 aunque el token ya era válido. Se veía en la respuesta como `content-type: application/problem+json` (viene del controller, no del middleware de autenticación) — esa fue la pista. Fix: claim propio `ClaimesColaborador.ColaboradorId` ("colaboradorId") en vez de reusar `ClaimTypes.NameIdentifier`.
4. **(UX, no bug de seguridad) Se quedaba en `/login` tras loguear bien.** MSAL, al volver del redirect de Microsoft, restaura la página en la que estabas antes de darle clic al botón — no navega directo a `/tickets`. Fix: `LoginComponent` redirige a `/tickets` en su constructor si `auth.currentUser()` ya está seteado.

Probado end-to-end en producción con la cuenta admin sembrada (`raul.galaviz@bisoft.com.mx`): login con Microsoft → entra directo a `/tickets` sin ver el formulario de login.

### 9.6 Pendiente

- Configurar `AzureAd__TenantId` / `AzureAd__ClientId` en Railway (o dejar que tome los valores de `appsettings.json`, que ya no están vacíos) y quitar `JWT_SECRET` / `SEED_ADMIN_PASSWORD`, que ya no se usan.
- Confirmar que todos los `Colaborador.Email` actuales correspondan a cuentas reales @bisoft.com.mx en el tenant.
- ~~Probar el flujo con un colaborador no-admin y con una cuenta de Microsoft que no esté dada de alta (debe rechazar con el mensaje de "cuenta no registrada").~~ Hecho, ver §10.

---

## 10. Sesión del 10 de septiembre — pruebas del login con Microsoft y hueco de permisos

Se retomó el pendiente de §9.6: probar el login en producción con cuentas distintas a la admin sembrada, más una revisión manual del flujo normal de tickets.

### 10.1 Pruebas del login

Todo con la app real en `https://generador-tickets.netlify.app` (Netlify) + `https://tickets-sistemas-backend-production.up.railway.app` (Railway):

- **Sesión persistente:** con la sesión de Microsoft ya activa, entrar a `/login` redirige directo a `/tickets` sin mostrar el formulario — el fix del bug #4 (§9.5) sigue funcionando.
- **CRUD de tickets como admin:** crear, cambiar estado, y eliminar un ticket de prueba funcionó de punta a punta. El registro de auditoría mostró correctamente "Actualizado por Administrador", confirmando que el fix del bug #3 (pérdida del `colaboradorId`, §9.5) sigue resuelto.
- **Cuenta de Microsoft sin `Colaborador` dado de alta:** probado por Raúl con otra cuenta — la API rechazó con **401**, como se esperaba. Después de dar de alta esa cuenta en `/colaboradores`, el login funcionó y pudo crear tickets con normalidad.
- **Botón "Salir":** cierra también la sesión de Microsoft en el navegador (no solo la de la app), como estaba documentado en §9.3.

### 10.2 Hueco de permisos encontrado — colaboradores podían modificar cualquier ticket

Al probar con la cuenta no-admin, Raúl notó que un colaborador regular podía cambiar el estado, la prioridad y la asignación de **cualquier** ticket, no solo darle seguimiento al propio. Revisando el código, esto no era un bug sino una decisión de diseño explícita que ya estaba comentada en `TicketsController.cs`: *"Cualquier colaborador logueado puede asignar, no solo administradores: no es una acción sensible, es el día a día de dar seguimiento."* Solo `DELETE` (eliminar ticket) estaba protegido con la policy `"Administrador"`, tanto en frontend como backend.

Se decidió corregirlo en la misma sesión:

- **Backend (`D:\tickets-sistemas`):** se agregó `[Authorize(Policy = "Administrador")]` a los tres endpoints `PATCH /api/tickets/{id}/estado`, `.../prioridad` y `.../asignacion` (antes solo `[Authorize]` genérico a nivel de clase). Usa la misma policy que ya protegía `DELETE`, respaldada por el claim `esAdministrador` que ya viaja en el token desde el cambio a Entra ID (§9.2).
- **Frontend (`Desktop\tickets-sistemas`):** en `ticket-detail.component`, los tres `<select>` (estado, prioridad, asignación) y el botón "Eliminar" ahora solo se muestran si `auth.isAdmin()`; un colaborador no-admin ve el estado y la prioridad como texto de solo lectura en vez del selector editable — evita el "clic y falla con 403" en la interfaz, igual que ya se hacía con "Eliminar".
- Verificado en producción tras el despliegue: como admin, los tres selectores y "Eliminar" siguen visibles y el `PATCH` de estado se aplicó correctamente (200, con el registro de auditoría actualizado).
- Pendiente de que Raúl confirme con la cuenta no-admin que ya no ve los selectores ni puede hacer `PATCH` directo a la API (debería regresar 403).

**Commits:** backend `b94d4f2`, frontend `4973d72` — ambos desplegados directo a producción (mismo patrón de §9.5, sin ambiente de staging separado).

### 10.3 Otros hallazgos menores (no corregidos aún)

- El colaborador **"Juan Perez"** (`juan.perez@ejemplo.com`) no es un correo `@bisoft.com.mx` real del tenant — parece dato de prueba. Está inactivo y no-admin, así que no representa un riesgo real (ni siquiera podría iniciar sesión), pero conviene limpiarlo o confirmarlo al revisar el pendiente de §9.6 sobre los correos de `Colaborador`.
- `app.routes.ts` no tiene una ruta comodín (`**`): entrar a una URL no reconocida dentro de la app (ej. `/administrador`, que no es una ruta real — el nombre "Administrador" del header es solo el nombre del colaborador logueado, no un link) deja la página en blanco en vez de redirigir a `/tickets` o mostrar un 404.

### 10.4 Pendiente

- Confirmar con la cuenta no-admin que el hueco de permisos de §10.2 quedó cerrado (UI oculta los selectores, y la API responde 403 si se llama directo).
- Limpiar o confirmar el colaborador de prueba "Juan Perez" (§10.3).
- Agregar una ruta comodín (`**`) que redirija a `/tickets` (§10.3).
- Los pendientes de configuración de Railway (`AzureAd__TenantId`/`ClientId`, quitar `JWT_SECRET`/`SEED_ADMIN_PASSWORD`) de §9.6 siguen abiertos.
