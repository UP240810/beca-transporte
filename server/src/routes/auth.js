const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../db");
const { JWT_SECRET, JWT_EXPIRES_IN, APP_URL } = require("../config");
const { enviarCorreo } = require("../email");
const { plantillaRecuperarPassword } = require("../emailTemplates");
const { crearRateLimiter } = require("../middleware/rateLimit");

const router = express.Router();

function firmarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, usuario: usuario.usuario, rol: usuario.rol, nombre: usuario.nombre, es_jefe: !!usuario.es_jefe },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

const recuperarLimiter = crearRateLimiter({
  nombre: "recuperar",
  dims: { ip: true },
  ventanaMs: 60 * 60 * 1000,
  max: 8,
  mensaje: "Demasiados intentos de recuperación. Espera un rato e inténtalo de nuevo.",
});

function correoDeCuenta(cuenta) {
  if (cuenta.correo) return cuenta.correo;
  if (cuenta.rol === "alumno") {
    const al = db.prepare(`SELECT correo FROM alumnos WHERE usuario_id = ?`).get(cuenta.id);
    return al?.correo || null;
  }
  return null;
}

// POST /api/auth/alumno/login
router.post("/alumno/login", (req, res) => {
  const { usuario, password } = req.body;
  if (!usuario || !password) {
    return res.status(400).json({ error: "Ingresa tu usuario y contraseña." });
  }

  const cuenta = db.prepare(`SELECT * FROM usuarios WHERE usuario = ? AND rol = 'alumno' AND activo = 1`).get(usuario.toLowerCase());
  if (!cuenta || !bcrypt.compareSync(password, cuenta.password_hash)) {
    return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
  }

  const token = firmarToken(cuenta);
  res.json({ token, nombre: cuenta.nombre });
});

// POST /api/auth/staff/login
router.post("/staff/login", (req, res) => {
  const { usuario, password, rol } = req.body;
  if (!usuario || !password || !rol) {
    return res.status(400).json({ error: "Ingresa tu usuario y contraseña." });
  }

  const cuenta = db.prepare(`SELECT * FROM usuarios WHERE usuario = ? AND rol = ? AND activo = 1`).get(usuario.toLowerCase(), rol);
  if (!cuenta || !bcrypt.compareSync(password, cuenta.password_hash)) {
    return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
  }

  const token = firmarToken(cuenta);
  res.json({ token, nombre: cuenta.nombre, rol: cuenta.rol, esJefe: !!cuenta.es_jefe });
});

/**
 * POST /api/auth/recuperar  { usuario }
 * Respuesta siempre genérica (no revela si el usuario existe).
 */
router.post("/recuperar", recuperarLimiter, async (req, res) => {
  const usuario = String(req.body?.usuario || "").trim().toLowerCase();
  if (!usuario) {
    return res.status(400).json({ error: "Ingresa tu usuario." });
  }

  const okMsg = {
    ok: true,
    mensaje:
      "Si el usuario existe y tiene correo registrado, recibirás un enlace para restablecer tu contraseña. Revisa también la bandeja de spam.",
  };

  const cuenta = db.prepare(`SELECT * FROM usuarios WHERE usuario = ? AND activo = 1`).get(usuario);
  if (!cuenta) {
    return res.json(okMsg);
  }

  const correo = correoDeCuenta(cuenta);
  const tokenPlano = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(tokenPlano).digest("hex");
  const expira = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  db.prepare(`UPDATE password_resets SET usado = 1 WHERE usuario_id = ? AND usado = 0`).run(cuenta.id);
  db.prepare(`
    INSERT INTO password_resets (usuario_id, token_hash, expira_en) VALUES (?, ?, ?)
  `).run(cuenta.id, tokenHash, expira);

  const link = `${String(APP_URL || "http://localhost:5173").replace(/\/$/, "")}/restablecer?token=${tokenPlano}`;

  if (correo) {
    try {
      const { subject, html } = plantillaRecuperarPassword({
        nombre: cuenta.nombre || cuenta.usuario,
        link,
      });
      await enviarCorreo({ to: correo, subject, html });
    } catch (err) {
      console.error("Error enviando correo de recuperación:", err.message);
    }
  } else {
    console.log("\n🔑 [recuperar sin correo] usuario:", cuenta.usuario, "\n   link:", link, "\n");
  }

  res.json(okMsg);
});

/**
 * POST /api/auth/restablecer  { token, password }
 */
router.post("/restablecer", recuperarLimiter, (req, res) => {
  const token = String(req.body?.token || "").trim();
  const password = String(req.body?.password || "");

  if (!token || token.length < 20) {
    return res.status(400).json({ error: "Enlace inválido o incompleto." });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres." });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const fila = db.prepare(`
    SELECT * FROM password_resets
    WHERE token_hash = ? AND usado = 0
  `).get(tokenHash);

  if (!fila) {
    return res.status(400).json({ error: "El enlace no es válido o ya fue usado." });
  }
  if (new Date(fila.expira_en).getTime() < Date.now()) {
    return res.status(400).json({ error: "El enlace expiró. Solicita uno nuevo." });
  }

  const hash = bcrypt.hashSync(password, 10);
  const tx = db.transaction(() => {
    db.prepare(`UPDATE usuarios SET password_hash = ? WHERE id = ?`).run(hash, fila.usuario_id);
    db.prepare(`UPDATE password_resets SET usado = 1 WHERE id = ?`).run(fila.id);
  });
  tx();

  res.json({ ok: true, mensaje: "Contraseña actualizada. Ya puedes iniciar sesión." });
});

module.exports = router;
