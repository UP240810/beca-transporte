const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "data", "beca_transporte.db");

// better-sqlite3 no crea carpetas: nos aseguramos de que exista antes de abrir la BD.
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Carga el esquema en cada arranque — CREATE TABLE IF NOT EXISTS, así que
// es seguro correrlo siempre sin borrar datos existentes.
const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
db.exec(schema);

// Migraciones ligeras — CREATE TABLE IF NOT EXISTS no agrega columnas nuevas
// a una tabla que alguien ya tenía creada de una sesión anterior. Esto le
// agrega columnas que se sumaron después del esquema original, sin borrar
// nada de lo que ya existía.
function columnaExiste(tabla, columna) {
  return db.prepare(`PRAGMA table_info(${tabla})`).all().some((c) => c.name === columna);
}
function agregarColumnaSiFalta(tabla, columna, tipo) {
  if (!columnaExiste(tabla, columna)) {
    db.exec(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${tipo}`);
  }
}
agregarColumnaSiFalta("solicitudes", "foto_base64", "TEXT");
agregarColumnaSiFalta("alumnos", "qr_version", "INTEGER NOT NULL DEFAULT 1");
agregarColumnaSiFalta("alumnos", "activo", "INTEGER NOT NULL DEFAULT 1");
agregarColumnaSiFalta("rutas", "codigo", "TEXT");

// Tabla de auditoría de solicitudes (si el schema ya corrió en una DB vieja)
db.exec(`
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
`);

// SQLite no actualiza fácilmente CHECK constraints: intentamos ampliar estados
// recreando no es seguro con datos. Aceptamos 'rechazada' vía INSERT en eventos
// y guardamos estado en columna TEXT (ya existe). Si falla el CHECK al UPDATE,
// usamos un try/catch en la ruta de rechazo.



// Ampliar estados de solicitud para incluir 'rechazada' (recrea tabla solo si hace falta)
(function migrarEstadoRechazada() {
  try {
    const row = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='solicitudes'`).get();
    if (!row || !row.sql || row.sql.includes("'rechazada'")) return;
    db.exec("BEGIN");
    db.exec(`
      CREATE TABLE solicitudes_mig (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        folio TEXT NOT NULL UNIQUE,
        nombre TEXT NOT NULL,
        apellidos TEXT NOT NULL,
        telefono TEXT,
        correo TEXT,
        escuela TEXT,
        carrera TEXT,
        grado TEXT,
        matricula TEXT,
        foto_base64 TEXT,
        estado TEXT NOT NULL CHECK (estado IN ('pendiente', 'corregir', 'aprobada', 'rechazada')) DEFAULT 'pendiente',
        motivo_correccion TEXT,
        alumno_id INTEGER,
        creado_en TEXT NOT NULL DEFAULT (datetime('now')),
        actualizado_en TEXT
      );
      INSERT INTO solicitudes_mig (
        id, folio, nombre, apellidos, telefono, correo, escuela, carrera, grado, matricula,
        foto_base64, estado, motivo_correccion, alumno_id, creado_en, actualizado_en
      )
      SELECT
        id, folio, nombre, apellidos, telefono, correo, escuela, carrera, grado, matricula,
        foto_base64, estado, motivo_correccion, alumno_id, creado_en, actualizado_en
      FROM solicitudes;
      DROP TABLE solicitudes;
      ALTER TABLE solicitudes_mig RENAME TO solicitudes;
      CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes(estado);
    `);
    db.exec("COMMIT");
    console.log("Migración: estado 'rechazada' habilitado en solicitudes");
  } catch (e) {
    try { db.exec("ROLLBACK"); } catch (_) {}
    console.warn("Migración rechazada no aplicada:", e.message);
  }
})();


// Roles completos del sistema (incluye desarrollo_social y admin_transportistas)
(function migrarRolesCompletos() {
  try {
    const row = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='usuarios'`).get();
    // Si ya incluye desarrollo_social, no hace falta migrar
    if (!row || !row.sql || row.sql.includes("'desarrollo_social'")) return;

    db.exec("BEGIN");
    db.exec(`
      CREATE TABLE usuarios_mig (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        rol TEXT NOT NULL CHECK (rol IN (
          'alumno',
          'recaudacion',
          'ventanilla',
          'camionero',
          'contabilidad',
          'desarrollo_social',
          'admin_transportistas'
        )),
        nombre TEXT,
        activo INTEGER NOT NULL DEFAULT 1,
        creado_en TEXT NOT NULL DEFAULT (datetime('now'))
      );
      INSERT INTO usuarios_mig (id, usuario, password_hash, rol, nombre, activo, creado_en)
      SELECT id, usuario, password_hash, rol, nombre, activo, creado_en FROM usuarios;
      DROP TABLE usuarios;
      ALTER TABLE usuarios_mig RENAME TO usuarios;
    `);
    db.exec("COMMIT");
    console.log("Migración: roles desarrollo_social y admin_transportistas habilitados");
  } catch (e) {
    try { db.exec("ROLLBACK"); } catch (_) {}
    console.warn("Migración roles:", e.message);
  }
})();


db.exec(`
  CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expira_en TEXT NOT NULL,
    usado INTEGER NOT NULL DEFAULT 0,
    creado_en TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token_hash);
`);
agregarColumnaSiFalta("usuarios", "correo", "TEXT");


agregarColumnaSiFalta("solicitudes", "direccion", "TEXT");
agregarColumnaSiFalta("solicitudes", "colonia_localidad", "TEXT");
agregarColumnaSiFalta("solicitudes", "celular", "TEXT");
agregarColumnaSiFalta("solicitudes", "estudio_socioeconomico", "TEXT");
db.exec(`
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
`);

agregarColumnaSiFalta("recargas", "folio", "TEXT");
agregarColumnaSiFalta("usuarios", "es_jefe", "INTEGER NOT NULL DEFAULT 0");
agregarColumnaSiFalta("usuarios", "correo", "TEXT");

// Pases QR de un solo uso: un jti aquí registrado ya no puede volver a validarse.
db.exec(`
  CREATE TABLE IF NOT EXISTS pases_usados (
    jti TEXT PRIMARY KEY,
    alumno_id INTEGER NOT NULL,
    ruta_id INTEGER,
    usado_en TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_pases_usados_alumno ON pases_usados(alumno_id);
`);

module.exports = db;
