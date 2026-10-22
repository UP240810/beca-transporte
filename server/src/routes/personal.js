const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { authRequired } = require("../middleware/auth");
const { generarPassword } = require("../passwords");

const router = express.Router();

const ROLES_STAFF = ["recaudacion", "ventanilla", "camionero", "desarrollo_social", "admin_transportistas"];

function soloJefe(req, res, next) {
  if (!req.user || !req.user.es_jefe) {
    return res.status(403).json({ error: "Solo el jefe del área puede administrar personal." });
  }
  if (!ROLES_STAFF.includes(req.user.rol)) {
    return res.status(403).json({ error: "Rol no autorizado." });
  }
  next();
}

/** Lista el personal del mismo rol (todos del área ven la lista; solo jefe edita) */
router.get("/", authRequired(ROLES_STAFF), (req, res) => {
  const filas = db.prepare(`
    SELECT id, usuario, nombre, correo, activo, es_jefe, creado_en
    FROM usuarios
    WHERE rol = ?
    ORDER BY es_jefe DESC, nombre COLLATE NOCASE
  `).all(req.user.rol);

  res.json({
    rol: req.user.rol,
    soyJefe: !!req.user.es_jefe,
    personal: filas.map((f) => ({
      id: f.id,
      usuario: f.usuario,
      nombre: f.nombre,
      correo: f.correo,
      activo: !!f.activo,
      esJefe: !!f.es_jefe,
      creadoEn: f.creado_en,
    })),
  });
});

/**
 * POST /api/personal
 * Body: { nombre, usuario, correo?, password? }
 * Solo jefe. Crea cuenta del mismo rol.
 */
router.post("/", authRequired(ROLES_STAFF), soloJefe, (req, res) => {
  const nombre = String(req.body?.nombre || "").trim();
  let usuario = String(req.body?.usuario || "").trim().toLowerCase();
  const correo = req.body?.correo ? String(req.body.correo).trim().toLowerCase() : null;
  let password = req.body?.password ? String(req.body.password) : null;

  if (!nombre || nombre.length < 3) {
    return res.status(400).json({ error: "Indica el nombre completo (mín. 3 caracteres)." });
  }
  if (!usuario || usuario.length < 3) {
    return res.status(400).json({ error: "Indica un usuario de acceso (mín. 3 caracteres)." });
  }
  if (!/^[a-z0-9._-]+$/.test(usuario)) {
    return res.status(400).json({ error: "Usuario: solo letras minúsculas, números, punto, guion o guion bajo." });
  }
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return res.status(400).json({ error: "Correo inválido." });
  }

  const existe = db.prepare(`SELECT id FROM usuarios WHERE usuario = ?`).get(usuario);
  if (existe) {
    return res.status(409).json({ error: "Ese usuario ya existe. Elige otro." });
  }

  if (!password || password.length < 8) {
    password = generarPassword();
  }

  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare(`
    INSERT INTO usuarios (usuario, password_hash, rol, nombre, activo, es_jefe, correo)
    VALUES (?, ?, ?, ?, 1, 0, ?)
  `).run(usuario, hash, req.user.rol, nombre, correo);

  res.status(201).json({
    ok: true,
    id: info.lastInsertRowid,
    usuario,
    nombre,
    correo,
    passwordTemporal: password,
    mensaje: "Cuenta creada. Comparte el usuario y la contraseña temporal de forma segura.",
  });
});

/** Activar / desactivar (no puede desactivarse a sí mismo ni a otro jefe) */
router.patch("/:id/activo", authRequired(ROLES_STAFF), soloJefe, (req, res) => {
  const id = Number(req.params.id);
  const activo = req.body?.activo === true || req.body?.activo === 1 || req.body?.activo === "1";

  const fila = db.prepare(`SELECT * FROM usuarios WHERE id = ? AND rol = ?`).get(id, req.user.rol);
  if (!fila) return res.status(404).json({ error: "Persona no encontrada en tu área." });
  if (fila.id === req.user.id) {
    return res.status(400).json({ error: "No puedes desactivar tu propia cuenta." });
  }
  if (fila.es_jefe) {
    return res.status(400).json({ error: "No se puede desactivar a un jefe de área." });
  }

  db.prepare(`UPDATE usuarios SET activo = ? WHERE id = ?`).run(activo ? 1 : 0, id);
  res.json({ ok: true, id, activo: !!activo });
});

/** Reset password (solo jefe, mismo rol) */
router.post("/:id/reset-password", authRequired(ROLES_STAFF), soloJefe, (req, res) => {
  const id = Number(req.params.id);
  const fila = db.prepare(`SELECT * FROM usuarios WHERE id = ? AND rol = ?`).get(id, req.user.rol);
  if (!fila) return res.status(404).json({ error: "Persona no encontrada en tu área." });

  const password = generarPassword();
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(`UPDATE usuarios SET password_hash = ? WHERE id = ?`).run(hash, id);

  res.json({
    ok: true,
    usuario: fila.usuario,
    passwordTemporal: password,
    mensaje: "Contraseña restablecida. Entrégala de forma segura.",
  });
});

module.exports = router;
