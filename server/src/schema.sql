-- Esquema — Sistema Digital de Beca de Transporte Estudiantil (Calvillo)
-- SQLite para desarrollo local. Diseñado para migrar a Postgres/Supabase sin
-- cambios grandes de estructura (mismos tipos, mismas relaciones).

PRAGMA foreign_keys = ON;

-- Rutas oficiales del catálogo. Desarrollo Social asigna ruta + precio al aprobar
-- solicitudes (o por alta manual). El estudiante ya no elige de esta lista:
-- solo escribe de dónde a dónde viaja en texto libre.
CREATE TABLE IF NOT EXISTS rutas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  codigo TEXT,
  descuento_pct INTEGER NOT NULL DEFAULT 50,
  costo_por_viaje INTEGER NOT NULL DEFAULT 15,
  activa INTEGER NOT NULL DEFAULT 1
);

-- Cuentas de acceso — cubre los 4 roles del sistema con una sola tabla.
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('alumno', 'recaudacion', 'ventanilla', 'camionero', 'desarrollo_social', 'admin_transportistas')),
  nombre TEXT NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1,
  es_jefe INTEGER NOT NULL DEFAULT 0,
  correo TEXT,
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Datos del alumno becado. Se crea junto con su usuario cuando Recaudación
-- aprueba su solicitud.
CREATE TABLE IF NOT EXISTS alumnos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  telefono TEXT NOT NULL,
  correo TEXT NOT NULL UNIQUE,
  escuela TEXT NOT NULL,
  carrera TEXT NOT NULL,
  grado TEXT NOT NULL,
  matricula TEXT NOT NULL UNIQUE,
  foto_url TEXT,
  viajes_restantes INTEGER NOT NULL DEFAULT 0,
  viajes_limite_mes INTEGER NOT NULL DEFAULT 30,
  -- Versión del pase QR: se incrementa al revocar/regenerar para invalidar tokens viejos
  qr_version INTEGER NOT NULL DEFAULT 1,
  -- Si es 0, el alumno está dado de baja (no puede viajar ni iniciar sesión útil)
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Relación: un alumno normalmente tiene 1 ruta con descuento; máximo 2 (trasbordo).
CREATE TABLE IF NOT EXISTS alumno_rutas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alumno_id INTEGER NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  ruta_id INTEGER NOT NULL REFERENCES rutas(id),
  orden INTEGER NOT NULL DEFAULT 1,
  UNIQUE (alumno_id, ruta_id)
);

-- Solicitudes de beca — existen independientes del alumno hasta que se
-- aprueban (ahí se crea su cuenta). Si se pide corrección, la solicitud
-- se queda activa para que el estudiante la reenvíe, nunca se borra.
CREATE TABLE IF NOT EXISTS solicitudes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  folio TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  telefono TEXT NOT NULL,
  correo TEXT NOT NULL,
  escuela TEXT NOT NULL,
  carrera TEXT NOT NULL,
  grado TEXT NOT NULL,
  matricula TEXT NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('pendiente', 'corregir', 'aprobada', 'rechazada')) DEFAULT 'pendiente',
  motivo_correccion TEXT,
  foto_base64 TEXT,
  -- Estudio socioeconómico (JSON del formato oficial)
  direccion TEXT,
  colonia_localidad TEXT,
  celular TEXT,
  estudio_socioeconomico TEXT,
  alumno_id INTEGER REFERENCES alumnos(id),
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Trayectos que el estudiante escribió en texto libre ("De X a Y").
-- Recaudación los usa como referencia para asignar rutas oficiales al aprobar.
CREATE TABLE IF NOT EXISTS solicitud_trayectos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  solicitud_id INTEGER NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
  orden INTEGER NOT NULL DEFAULT 1,
  descripcion TEXT NOT NULL
);

-- Rutas oficiales ya asignadas a una solicitud (se llena al aprobar).
CREATE TABLE IF NOT EXISTS solicitud_rutas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  solicitud_id INTEGER NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
  ruta_id INTEGER NOT NULL REFERENCES rutas(id),
  orden INTEGER NOT NULL DEFAULT 1
);

-- Recargas hechas en ventanilla — por número de viajes, no por monto libre.
CREATE TABLE IF NOT EXISTS recargas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  folio TEXT UNIQUE,
  alumno_id INTEGER NOT NULL REFERENCES alumnos(id),
  viajes INTEGER NOT NULL,
  monto INTEGER NOT NULL,
  staff_usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Cada validación de QR que hace un camionero, válida o no.
CREATE TABLE IF NOT EXISTS viajes_consumidos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alumno_id INTEGER NOT NULL REFERENCES alumnos(id),
  ruta_id INTEGER NOT NULL REFERENCES rutas(id),
  operador_usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  resultado TEXT NOT NULL CHECK (resultado IN ('valido', 'ruta-incorrecta', 'sin-saldo')),
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes(estado);
CREATE INDEX IF NOT EXISTS idx_recargas_alumno ON recargas(alumno_id);
CREATE INDEX IF NOT EXISTS idx_recargas_creado ON recargas(creado_en);
CREATE INDEX IF NOT EXISTS idx_viajes_alumno ON viajes_consumidos(alumno_id);
CREATE INDEX IF NOT EXISTS idx_solicitud_trayectos ON solicitud_trayectos(solicitud_id);


-- Reportes de errores enviados desde la página de Preguntas frecuentes
CREATE TABLE IF NOT EXISTS reportes_bugs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT,
  correo TEXT,
  rol TEXT CHECK (rol IN ('estudiante', 'recaudacion', 'ventanilla', 'camionero', 'desarrollo_social', 'otro') OR rol IS NULL),
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  pagina TEXT,
  estado TEXT NOT NULL DEFAULT 'nuevo' CHECK (estado IN ('nuevo', 'en_revision', 'resuelto', 'descartado')),
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bugs_estado ON reportes_bugs(estado);
CREATE INDEX IF NOT EXISTS idx_bugs_creado ON reportes_bugs(creado_en);


-- Historial de decisiones sobre una solicitud (auditoría)
CREATE TABLE IF NOT EXISTS solicitud_eventos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  solicitud_id INTEGER NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
  staff_usuario_id INTEGER REFERENCES usuarios(id),
  staff_usuario TEXT,
  accion TEXT NOT NULL CHECK (accion IN ('creada', 'corregir', 'aprobada', 'rechazada', 'reenviada')),
  comentario TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_solicitud_eventos_sol ON solicitud_eventos(solicitud_id);


-- Tokens de recuperación de contraseña (un solo uso, expiran)
CREATE TABLE IF NOT EXISTS password_resets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expira_en TEXT NOT NULL,
  usado INTEGER NOT NULL DEFAULT 0,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token_hash);


-- Documentos PDF adjuntos a la solicitud (acta, CURP, etc.)
CREATE TABLE IF NOT EXISTS solicitud_documentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  solicitud_id INTEGER NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  nombre_archivo TEXT,
  mime TEXT NOT NULL DEFAULT 'application/pdf',
  data_base64 TEXT NOT NULL,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_solicitud_docs ON solicitud_documentos(solicitud_id);


-- Unidad / combi del transportista (para reportes por chofer o unidad)
CREATE TABLE IF NOT EXISTS unidades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT,
  activa INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS camionero_perfil (
  usuario_id INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  unidad_id INTEGER REFERENCES unidades(id),
  codigo_chofer TEXT
);

-- Devoluciones de dinero en ventanilla
CREATE TABLE IF NOT EXISTS devoluciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  folio TEXT,
  alumno_id INTEGER NOT NULL REFERENCES alumnos(id),
  ventanilla_usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  monto INTEGER NOT NULL,
  viajes INTEGER NOT NULL DEFAULT 0,
  motivo TEXT,
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Credencial impresa (1 vez; reposición por Desarrollo Social)
CREATE TABLE IF NOT EXISTS alumno_credencial (
  alumno_id INTEGER PRIMARY KEY REFERENCES alumnos(id) ON DELETE CASCADE,
  impresa INTEGER NOT NULL DEFAULT 0,
  impresa_en TEXT,
  reposiciones INTEGER NOT NULL DEFAULT 0
);

-- Notificaciones simples al beneficiario
CREATE TABLE IF NOT EXISTS notificaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alumno_id INTEGER NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  cuerpo TEXT,
  leida INTEGER NOT NULL DEFAULT 0,
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
