const express = require("express");
const db = require("../db");
const { authRequired } = require("../middleware/auth");
const { crearRateLimiter } = require("../middleware/rateLimit");

const router = express.Router();

// Evitar spam de reportes: 5 por hora por IP
const bugLimiter = crearRateLimiter({
  nombre: "bug",
  dims: { ip: true },
  ventanaMs: 60 * 60 * 1000,
  max: 5,
  mensaje: "Has enviado demasiados reportes. Espera un rato e inténtalo de nuevo.",
});

// POST /api/bugs — público
router.post("/", bugLimiter, (req, res) => {
  const { nombre, correo, rol, titulo, descripcion, pagina } = req.body || {};

  if (!titulo || !String(titulo).trim()) {
    return res.status(400).json({ error: "Escribe un título breve del problema." });
  }
  if (!descripcion || !String(descripcion).trim() || String(descripcion).trim().length < 10) {
    return res.status(400).json({ error: "Describe el problema con al menos 10 caracteres." });
  }
  if (String(titulo).length > 200) {
    return res.status(400).json({ error: "El título es demasiado largo." });
  }
  if (String(descripcion).length > 4000) {
    return res.status(400).json({ error: "La descripción es demasiado larga." });
  }
  if (correo && !/^\S+@\S+\.\S+$/.test(correo)) {
    return res.status(400).json({ error: "El correo no es válido." });
  }

  const rolesOk = ["estudiante", "recaudacion", "ventanilla", "camionero", "otro"];
  const rolLimpio = rolesOk.includes(rol) ? rol : null;

  const info = db.prepare(`
    INSERT INTO reportes_bugs (nombre, correo, rol, titulo, descripcion, pagina)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    nombre ? String(nombre).trim().slice(0, 120) : null,
    correo ? String(correo).trim().slice(0, 120) : null,
    rolLimpio,
    String(titulo).trim(),
    String(descripcion).trim(),
    pagina ? String(pagina).trim().slice(0, 200) : null
  );

  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});

// GET /api/bugs — Recaudación ve los reportes
router.get("/", authRequired(["recaudacion", "desarrollo_social"]), (req, res) => {
  const estado = req.query.estado || null;
  let filas;
  if (estado) {
    filas = db.prepare(`
      SELECT * FROM reportes_bugs WHERE estado = ? ORDER BY creado_en DESC LIMIT 200
    `).all(estado);
  } else {
    filas = db.prepare(`
      SELECT * FROM reportes_bugs ORDER BY creado_en DESC LIMIT 200
    `).all();
  }
  res.json(filas);
});

// PATCH /api/bugs/:id — cambiar estado
router.patch("/:id", authRequired(["recaudacion", "desarrollo_social"]), (req, res) => {
  const id = Number(req.params.id);
  const { estado } = req.body || {};
  const validos = ["nuevo", "en_revision", "resuelto", "descartado"];
  if (!validos.includes(estado)) {
    return res.status(400).json({ error: "Estado no válido." });
  }
  const row = db.prepare(`SELECT id FROM reportes_bugs WHERE id = ?`).get(id);
  if (!row) return res.status(404).json({ error: "Reporte no encontrado." });
  db.prepare(`UPDATE reportes_bugs SET estado = ? WHERE id = ?`).run(estado, id);
  res.json({ ok: true, id, estado });
});

module.exports = router;
