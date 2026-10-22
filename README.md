# Beca de Transporte Estudiantil · Calvillo

Sistema Digital de Beca de Transporte Estudiantil — Gobierno Municipal de Calvillo.
Frontend en React (Vite) + React Router, PWA instalable. Backend en Node/Express
con SQLite, en `server/`. **Ya están conectados entre sí — Parte 3 completa.**

## Cómo correrlo (frontend + backend)

Necesitas dos terminales abiertas, una para cada uno:

```bash
# Terminal 1 — backend
cd server
npm install
npm run seed        # crea/reinicia la base de datos con datos de prueba
npm run dev           # http://localhost:4000

# Terminal 2 — frontend
npm install
npm run dev            # http://localhost:5173
```

Abre `http://localhost:5173` — ya no es solo un prototipo visual, todo lo que
hagas (inscribirte, aprobar una solicitud, recargar viajes, validar un pase)
se guarda de verdad en `server/data/beca_transporte.db`.

### Cuentas de prueba (todas con la contraseña `calvillo2026`)

| Rol | Usuario |
|---|---|
| Alumno | `upa-20231045`, `upa-20230812`, `upa-20229981`, `upa-20225567` |
| Recaudación | `recaudacion.andres` |
| Ventanilla | `ventanilla.02` |
| Camionero | `operador.14` |

## Rutas de la app

| Ruta | Página |
|---|---|
| `/` | Página principal (pública) |
| `/acceso` | Selector de tipo de acceso |
| `/solicitud` | Formulario de solicitud de beca |
| `/admin/solicitudes` | Panel de Recaudación — aprobar / pedir corrección |
| `/alumno/login` | Login del estudiante |
| `/alumno` | Dashboard del estudiante — tarjeta, QR, viajes |
| `/recarga` | Ventanilla de recargas — cobro por viajes |
| `/camionero` | App del operador — validación de pases |

## Qué es real y qué es simulado ahora mismo

**Ya real (Parte 1 + 2 + 3 + QR completas):**
- Backend real (Node/Express) con base de datos SQLite persistente en `server/`.
- Login real con JWT + contraseñas hasheadas (bcrypt).
- Las 6 pantallas hablan con la API real: rutas, solicitudes, aprobar/corregir,
  dashboard del alumno, recargas, y validaciones del camionero.
- **QR real y firmado**: cada alumno tiene un token JWT propio (`GET /api/alumno/qr-token`,
  firmado con un secreto separado del de login, ver `server/src/qr.js`), codificado
  como una imagen QR de verdad en su dashboard (librería `qrcode`).
- **Lector de cámara real** en la app del camionero (`html5-qrcode`, cargado solo
  cuando se abre esa pantalla) que decodifica el QR y lo manda a verificar al backend
  — un QR alterado o vencido se rechaza (probado con `curl` simulando uno manipulado).
- **Respaldo manual** por matrícula cuando la cámara falla o no hay señal para cargarla
  — funciona, pero está marcado como menos seguro (sin firma que verificar) y le pide
  al operador confirmar visualmente el nombre en la tarjeta.
- **Descargar tarjeta de viaje** ya genera una imagen PNG real (QR + datos del alumno
  dibujados en un `<canvas>`), no es un botón decorativo.
- **Offline real para el camionero**: al iniciar turno con señal se descarga un
  "manifiesto" de la ruta (matrícula + saldo de cada alumno asignado) y se guarda en
  IndexedDB (`src/offlineQueue.js`). Si se pierde la señal — real (`navigator.onLine`)
  o simulada con el toggle de prueba — cada escaneo se resuelve contra esa copia local
  (incluye leer la matrícula del QR sin verificar su firma, ya que verificarla requiere
  el secreto que solo vive en el backend) y se guarda en una cola de pendientes. Al
  recuperar señal, la cola se sincroniza sola contra el backend, que tiene la última
  palabra sobre el resultado real. Probado de punta a punta: validar dos veces al mismo
  alumno sin señal detecta correctamente "sin saldo" la segunda vez, y al sincronizar
  el servidor descuenta los viajes de verdad.
- La sesión (alumno y personal) se guarda en `localStorage`, sobrevive a un refresh.
- **Gestión de alumnos para Recaudación** (`/admin/alumnos`): lista completa, **alta
  manual** de un alumno sin pasar por el formulario público (útil para pruebas o altas
  directas), y **exportar a Excel/CSV** todos los alumnos con sus datos y rutas.
- **Reporte de recargas por periodo para Contabilidad**: en Ventanilla, selector de
  fechas + botón para descargar CSV de las recargas de ese rango — quién recargó,
  a quién, cuándo, cuánto y en qué ruta (`GET /api/recargas/reporte`) — pedido
  explícito del marco de requerimientos de Sprint 1.
- **Correo real al enviar/aprobar/corregir solicitudes**: al enviar el formulario, el
  estudiante recibe un correo confirmando que se recibió su solicitud (con el folio);
  al aprobar, recibe su usuario y contraseña; al pedir corrección, recibe uno explicando
  el motivo (`server/src/email.js` + `emailTemplates.js`, vía Resend). Si no hay una llave
  de Resend configurada, el correo se imprime en la consola del servidor en vez de
  fallar — así el flujo completo se puede probar sin tener una cuenta de Resend a la
  mano. Probado con `curl`: los 3 correos se generan con el contenido correcto y la API
  responde `correoEnviado: true/false` en aprobar/corregir para que Recaudación
  sepa si debe avisarle al estudiante por otro medio.

**Todavía simulado / pendiente** (marcado con `// TODO` en el código):
- **Background Sync (camionero):** Chrome/Edge/Android sincronizan la cola offline aunque se cierre la pestaña (`src/sw.js`, tag `sync-validaciones`). Safari/Firefox sincronizan al recuperar señal con la app abierta.
  una capa más avanzada que no se implementó todavía.
- **Carga de foto real** en el formulario: se comprime y redimensiona en el navegador
  antes de enviarse (`comprimirImagen` en `src/utils.js`), se guarda en la solicitud,
  y al aprobarla se copia automáticamente al perfil del alumno — ya aparece en su
  tarjeta/QR del dashboard y en la lista de Recaudación para identificar de un vistazo.
- **Revocar un QR antes de su vencimiento** (alumno dado de baja, tarjeta reportada
  perdida) no tiene un mecanismo todavía — hoy el token es válido ~5 años sin forma
  de invalidarlo antes de tiempo salvo cambiar el secreto (lo cual invalidaría todos).

## Qué falta para estar completo (producción)

**1. Revocación de pases QR**
- Agregar una tabla `pases_revocados` o un campo `qr_version` en `alumnos` que se
  incluya en la firma y se verifique en `verificarPaseQR` — así se puede invalidar
  el QR de un alumno específico sin afectar a los demás.

**2. Background Sync para el offline del camionero — HECHO**
- La cola offline (IndexedDB) ya funciona y sincroniza sola al recuperar señal
  mientras la app sigue abierta. Para que sincronice incluso con la app cerrada
  del todo, hace falta un Service Worker con el evento `sync` — Vite-PWA usa
  `generateSW` hoy, que no soporta esto directamente; se necesitaría cambiar a
  la estrategia `injectManifest` con código de Service Worker propio.

**3. Catálogo real de rutas y costo por viaje**
- Ya vienen de la base de datos (`server/data/beca_transporte.db`), así que solo
  hace falta actualizar los registros de la tabla `rutas` cuando el municipio
  confirme el listado y las tarifas reales — no hay que tocar código.
- **Pendiente de decisión con Andrés**: hay demasiadas rutas reales para un catálogo
  fijo. La idea que se platicó es que el estudiante escriba en el formulario de dónde
  a dónde va (texto libre) en vez de elegir de una lista, y que Recaudación sea quien
  la dé de alta (con costo y nombre oficial) al aprobar — todavía no se construyó ese
  cambio, sigue siendo el catálogo fijo de 3 rutas de ejemplo.

**4. Pruebas con cada área**
- Sesión con estudiantes, Contabilidad, Recaudación, camioneros y Presidencia
  (ver el marco de preguntas del reporte de Sprint 1) antes de dar por cerrado el sistema.
- **Importante**: probar el lector de cámara en dispositivos y navegadores reales —
  aquí se construyó y se probó la lógica de backend a fondo, pero la cámara en sí
  no se pudo probar en este entorno de desarrollo (sin navegador/cámara física).
- Los camioneros todavía no confirman si van a usar el sistema — depende de esa
  respuesta si el flujo de validación se ajusta.

**5. Infraestructura de producción**
- Dominio (`.com.mx` o `.gob.mx`), hosting del frontend (Vercel/Netlify), hosting del
  backend + base de datos real en la nube (Supabase/Railway — hoy es SQLite local).
- Variables de entorno reales: `JWT_SECRET` y `QR_SECRET` fuertes y distintos entre sí,
  `VITE_API_URL` apuntando al backend desplegado, restringir CORS al dominio real.
- Rate limiting en los endpoints de login.
- Los QR deben verse bien impresos si se laminan como tarjeta física — probar tamaño
  mínimo de impresión para que la cámara los lea sin problema.

## Al desplegarlo (Vercel / Netlify)

Esta app usa rutas del lado del cliente (React Router). Al desplegar necesitas un
"rewrite" para que `/alumno`, `/recarga`, etc. no den 404 al recargar la página o
entrar por URL directa:

- **Vercel**: crea `vercel.json` con:
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```
- **Netlify**: crea `public/_redirects` con:
  ```
  /*    /index.html   200
  ```

## Login de personal (Recaudación / Ventanilla / Camionero)

Login real para las 3 vistas de gobierno, en `/admin/login`, `/recarga/login`
y `/camionero/login` — reutilizan un solo componente (`StaffLogin.jsx`) parametrizado
por rol, conectado a `POST /api/auth/staff/login`. Ya valida usuario/contraseña
contra la base de datos (no acepta cualquier cosa).

## Estado del checklist de detalles

Ya resuelto:
- **Layout de escritorio** para Recaudación y Ventanilla — en pantallas ≥900px se ven de
  dos columnas, como app de escritorio; en celular se quedan en una columna (`useIsDesktop.js`).
- **Ícono de iOS** (`apple-touch-icon.png`) — al instalar la PWA desde Safari/iPhone toma
  el logo correcto.
- **Página 404** con el mismo estilo institucional del resto del sitio.

Pendiente (menor):
- Campo de subida de foto en el formulario (depende de tener backend/storage).
- "Olvidé mi contraseña" en los logins.

## Estructura del proyecto

```
src/
  api.js                  cliente de la API — todas las llamadas al backend pasan por aquí
  offlineQueue.js         cola offline real (IndexedDB) para el camionero
  utils.js                helper para formatear fechas + comprimir fotos antes de subirlas
  theme.js                tokens de diseño (colores)
  context/
    SesionContext.jsx      sesión del alumno — login real, guardada en localStorage
    StaffSesionContext.jsx  sesión de personal (Recaudación/Ventanilla/Camionero)
  components/
    PseudoQR.jsx            QR visual placeholder
    ProtectedRoute.jsx        protege vistas de personal por rol
  hooks/
    useIsDesktop.js           breakpoint celular/escritorio
  pages/
    Landing.jsx
    Acceso.jsx
    Solicitud.jsx
    StaffLogin.jsx             login genérico (Recaudación/Ventanilla/Camionero)
    AdminSolicitudes.jsx
    AdminAlumnos.jsx
    AlumnoLogin.jsx
    AlumnoDashboard.jsx
    Recarga.jsx
    Camionero.jsx
    NotFound.jsx
  App.jsx                  rutas (React Router)
  main.jsx                 entrada de la app + fuentes

server/                  backend — ver server/README.md para su propia documentación
  src/
    schema.sql
    db.js
    seed.js
    config.js
    qr.js                 firma y verifica los tokens del QR de cada alumno
    email.js               envío de correos (Resend, con respaldo a consola)
    emailTemplates.js       plantillas HTML de los correos
    middleware/auth.js
    routes/
    app.js
    index.js
  data/
    beca_transporte.db     se genera con `npm run seed`
```

