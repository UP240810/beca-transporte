# Backend — Beca de Transporte Estudiantil (Calvillo)

Node/Express + SQLite. Login real, QR firmado, offline real para el camionero,
y envío de correos reales (Resend) al aprobar/corregir solicitudes.

## Cómo correrlo

```bash
cd server
npm install
cp .env.example .env      # opcional en desarrollo, ya tiene valores por defecto
npm run seed               # crea/reinicia la base de datos con datos de prueba
npm run dev                 # servidor con auto-reinicio, http://localhost:4000
```

Prueba rápida:
```bash
curl http://localhost:4000/api/health
# {"ok":true}
```

### Cuentas de prueba (todas con la contraseña `calvillo2026`)

| Rol | Usuario |
|---|---|
| Alumno | `upa-20231045`, `upa-20230812`, `upa-20229981`, `upa-20225567` |
| Recaudación | `recaudacion.andres` |
| Ventanilla | `ventanilla.02` |
| Camionero | `operador.14` |

## Correo (Resend)

Sin configurar nada, los correos de aprobación/corrección se **imprimen en la
consola** del servidor en vez de enviarse — así puedes probar todo el flujo sin
tener una cuenta de Resend. Para enviarlos de verdad:

1. Crea una cuenta gratis en [resend.com](https://resend.com) (su plan gratuito
   alcanza perfectamente para el piloto).
2. Copia tu API key y ponla en `.env`: `RESEND_API_KEY=re_...`
3. Mientras no tengas un dominio propio verificado en Resend, usa el remitente
   de pruebas que ya viene por defecto (`onboarding@resend.dev`) — solo puede
   enviar a tu propio correo registrado en Resend. Para mandar a cualquier
   estudiante hay que verificar un dominio real de Calvillo en Resend y
   cambiar `EMAIL_FROM` en `.env`.

## Endpoints

Todos los protegidos necesitan `Authorization: Bearer <token>` (el token lo
regresa el login).

### Auth
| Método | Ruta | Rol | Qué hace |
|---|---|---|---|
| POST | `/api/auth/alumno/login` | público | `{usuario, password}` → `{token, nombre}` |
| POST | `/api/auth/staff/login` | público | `{usuario, password, rol}` → `{token, nombre, rol}` |

### Rutas
| Método | Ruta | Rol | Qué hace |
|---|---|---|---|
| GET | `/api/rutas` | público | catálogo de rutas disponibles |
| GET | `/api/rutas/:id/manifiesto` | camionero | matrícula + saldo de cada alumno de esa ruta — se descarga al iniciar turno para poder validar sin señal después |

### Solicitudes
| Método | Ruta | Rol | Qué hace |
|---|---|---|---|
| POST | `/api/solicitudes` | público | crea una solicitud (incluye `fotoBase64` opcional) — la usa el formulario, envía correo de confirmación |
| GET | `/api/solicitudes?estado=pendiente` | recaudación | lista por estado |
| GET | `/api/solicitudes/:folio` | recaudación | detalle de una solicitud |
| POST | `/api/solicitudes/:folio/aprobar` | recaudación | crea la cuenta del alumno, envía correo con usuario/contraseña, regresa `{usuario, password, correo, correoEnviado}` |
| POST | `/api/solicitudes/:folio/corregir` | recaudación | `{motivo}` — marca "corregir", envía correo explicando el motivo, nunca borra |

### Alumno (dashboard propio)
| Método | Ruta | Rol | Qué hace |
|---|---|---|---|
| GET | `/api/alumno/me` | alumno | datos del dashboard (rutas, viajes, saldo) |
| GET | `/api/alumno/qr-token` | alumno | token JWT firmado para su QR (ver `src/qr.js`) |

### Alumnos (gestión, Recaudación)
| Método | Ruta | Rol | Qué hace |
|---|---|---|---|
| GET | `/api/alumnos` | recaudación | lista completa de alumnos con sus rutas |
| POST | `/api/alumnos` | recaudación | alta manual (sin pasar por solicitud), envía correo con credenciales |
| GET | `/api/alumnos/exportar` | recaudación | descarga CSV/Excel de todos los alumnos |

### Recargas (ventanilla)
| Método | Ruta | Rol | Qué hace |
|---|---|---|---|
| GET | `/api/recargas/buscar?q=` | ventanilla | busca alumno por nombre/matrícula |
| POST | `/api/recargas` | ventanilla | `{matricula, viajes}` — registra recarga y suma viajes |
| GET | `/api/recargas/hoy` | ventanilla | resumen del día + historial |
| GET | `/api/recargas/reporte?desde=&hasta=` | recaudación o ventanilla | descarga CSV de recargas del rango — para Contabilidad |

### Validaciones (camionero)
| Método | Ruta | Rol | Qué hace |
|---|---|---|---|
| POST | `/api/validaciones` | camionero | `{qrToken, rutaId}` (camino normal, QR real) o `{matricula, rutaId}` (respaldo manual) → valida ruta y saldo, descuenta viaje si es válido |
| GET | `/api/validaciones/hoy` | camionero | contador de pases validados en el turno |

## Qué es real ahora mismo

- **Login real** con JWT + contraseñas hasheadas con bcrypt (nunca en texto plano).
- **Base de datos real** (SQLite) que persiste — apagas el servidor y los datos siguen ahí.
- **Reglas de negocio reales**: aprobar una solicitud sí crea la cuenta del alumno;
  una recarga sí suma viajes; una validación sí resta un viaje y sí revisa ruta/saldo.
- **QR real y firmado** (`src/qr.js`) — un QR alterado o vencido se rechaza.
- **Correo real** (`src/email.js`) al aprobar o pedir corrección de una solicitud,
  con respaldo a consola si no hay `RESEND_API_KEY` configurada.
- **Offline real del camionero**: `/api/rutas/:id/manifiesto` le da al frontend los
  datos que necesita guardar localmente para poder seguir validando sin señal.
- Probado a mano con `curl` — los 3 estados de validación (`valido`, `ruta-incorrecta`,
  `sin-saldo`), aprobar/corregir solicitudes, recargas, QR alterado siendo rechazado,
  y el ciclo completo de sincronización offline, todos funcionan de verdad.

## Qué sigue siendo pendiente

- **Revocar un QR antes de su vencimiento** (alumno dado de baja, tarjeta perdida) no
  tiene mecanismo todavía — el token dura ~5 años sin forma de invalidarlo antes.
- **JWT_SECRET y QR_SECRET por defecto.** Hay que poner valores reales y distintos
  entre sí en `.env` antes de desplegar.
- **CORS abierto a cualquier origen.** Hay que restringirlo al dominio real del frontend
  antes de producción.
- **Sin rate limiting** en los logins — alguien podría intentar contraseñas sin límite.
- **Remitente de correo de pruebas** (`onboarding@resend.dev`) solo envía a tu propio
  correo registrado en Resend — hace falta verificar un dominio real de Calvillo para
  poder mandarle correos a cualquier estudiante.
- **Sin rate limiting** en los logins — alguien podría intentar contraseñas sin límite.

## Estructura

```
server/
  src/
    schema.sql          esquema de la base de datos
    db.js                conexión a SQLite
    seed.js               datos de prueba
    config.js              JWT secret, QR secret, config de correo, puerto
    qr.js                    firma y verifica los tokens del QR de cada alumno
    email.js                  envío de correos (Resend, con respaldo a consola)
    emailTemplates.js          plantillas HTML de los correos
    passwords.js                generador de contraseñas (compartido)
    middleware/
      auth.js               verifica el token y el rol
    routes/
      auth.js                login de alumno y de personal
      rutas.js                catálogo de rutas + manifiesto offline por ruta
      solicitudes.js           crear, listar, aprobar, corregir (con envío de correo)
      alumno.js                 dashboard del alumno + token de su QR
      alumnos.js                 gestión (Recaudación): listar, alta manual, exportar
      recargas.js                buscar alumno, registrar recarga, resumen, reporte por periodo
      validaciones.js             escaneo del camionero (QR firmado o respaldo manual)
    app.js                express + todas las rutas
    index.js               arranca el servidor
  data/
    beca_transporte.db      base de datos SQLite (se genera con npm run seed)
```
