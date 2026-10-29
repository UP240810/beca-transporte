const express = require("express");
const db = require("../db");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

// GET /api/rutas — catálogo activo (público / choferes / aprobación)
router.get("/", (req, res) => {
  const rutas = db.prepare(
    `SELECT id, nombre, codigo, descuento_pct, costo_por_viaje, activa
     FROM rutas WHERE activa = 1 ORDER BY nombre`
  ).all();
  res.json(rutas);
});

// GET /api/rutas/admin — todas (activas e inactivas) para Desarrollo Social
router.get("/admin", authRequired(["desarrollo_social", "recaudacion"]), (req, res) => {
  const rutas = db.prepare(
    `SELECT id, nombre, codigo, descuento_pct, costo_por_viaje, activa
     FROM rutas ORDER BY activa DESC, nombre`
  ).all();
  res.json(rutas);
});

// POST /api/rutas — alta o reutiliza por nombre/código
router.post("/", authRequired(["desarrollo_social", "recaudacion"]), (req, res) => {
  const { nombre, codigo, costo_por_viaje, descuento_pct } = req.body;
  if (!nombre || !String(nombre).trim()) {
    return res.status(400).json({ error: "El nombre de la ruta es obligatorio." });
  }
  const nombreLimpio = String(nombre).trim();
  const codigoLimpio = codigo ? String(codigo).trim().toUpperCase().slice(0, 20) : null;

  const existente = db.prepare(
    `SELECT id, nombre, codigo, descuento_pct, costo_por_viaje, activa FROM rutas WHERE nombre = ?`
  ).get(nombreLimpio);
  if (existente) {
    if (codigoLimpio && !existente.codigo) {
      db.prepare(`UPDATE rutas SET codigo = ? WHERE id = ?`).run(codigoLimpio, existente.id);
      existente.codigo = codigoLimpio;
    }
    return res.status(200).json(existente);
  }

  if (codigoLimpio) {
    const porCodigo = db.prepare(
      `SELECT id, nombre, codigo, descuento_pct, costo_por_viaje, activa FROM rutas WHERE codigo = ?`
    ).get(codigoLimpio);
    if (porCodigo) {
      return res.status(200).json(porCodigo);
    }
  }

  const costo = Number(costo_por_viaje) > 0 ? Number(costo_por_viaje) : 15;
  const descuento = Number(descuento_pct) >= 0 ? Number(descuento_pct) : 60;
  const info = db.prepare(
    `INSERT INTO rutas (nombre, codigo, descuento_pct, costo_por_viaje) VALUES (?, ?, ?, ?)`
  ).run(nombreLimpio, codigoLimpio, descuento, costo);

  res.status(201).json({
    id: info.lastInsertRowid,
    nombre: nombreLimpio,
    codigo: codigoLimpio,
    descuento_pct: descuento,
    costo_por_viaje: costo,
    activa: 1,
  });
});

// PATCH /api/rutas/:id — editar nombre, código, precio, descuento, activa
router.patch("/:id", authRequired(["desarrollo_social", "recaudacion"]), (req, res) => {
  const id = Number(req.params.id);
  const ruta = db.prepare(`SELECT * FROM rutas WHERE id = ?`).get(id);
  if (!ruta) return res.status(404).json({ error: "Ruta no encontrada." });

  const { nombre, codigo, costo_por_viaje, descuento_pct, activa } = req.body || {};
  const nombreLimpio = nombre != null ? String(nombre).trim() : ruta.nombre;
  if (!nombreLimpio) return res.status(400).json({ error: "El nombre no puede quedar vacío." });

  const codigoLimpio = codigo != null
    ? (String(codigo).trim() ? String(codigo).trim().toUpperCase().slice(0, 20) : null)
    : ruta.codigo;

  let costo = ruta.costo_por_viaje;
  if (costo_por_viaje != null) {
    const c = Number(costo_por_viaje);
    if (!Number.isFinite(c) || c <= 0) {
      return res.status(400).json({ error: "El precio por viaje debe ser mayor a 0." });
    }
    costo = Math.round(c);
  }

  let descuento = ruta.descuento_pct;
  if (descuento_pct != null) {
    const d = Number(descuento_pct);
    if (!Number.isFinite(d) || d < 0 || d > 100) {
      return res.status(400).json({ error: "El descuento debe estar entre 0 y 100." });
    }
    descuento = Math.round(d);
  }

  let act = ruta.activa;
  if (activa != null) act = activa ? 1 : 0;

  db.prepare(`
    UPDATE rutas SET nombre = ?, codigo = ?, costo_por_viaje = ?, descuento_pct = ?, activa = ?
    WHERE id = ?
  `).run(nombreLimpio, codigoLimpio, costo, descuento, act, id);

  const actualizada = db.prepare(
    `SELECT id, nombre, codigo, descuento_pct, costo_por_viaje, activa FROM rutas WHERE id = ?`
  ).get(id);
  res.json(actualizada);
});

// DELETE /api/rutas/:id — baja lógica (activa = 0). Si ?hard=1 y no hay alumnos, borra.
router.delete("/:id", authRequired(["desarrollo_social", "recaudacion"]), (req, res) => {
  const id = Number(req.params.id);
  const ruta = db.prepare(`SELECT * FROM rutas WHERE id = ?`).get(id);
  if (!ruta) return res.status(404).json({ error: "Ruta no encontrada." });

  const usados = db.prepare(`SELECT COUNT(*) AS n FROM alumno_rutas WHERE ruta_id = ?`).get(id).n;
  if (req.query.hard === "1" && usados === 0) {
    db.prepare(`DELETE FROM rutas WHERE id = ?`).run(id);
    return res.json({ ok: true, eliminada: true });
  }

  db.prepare(`UPDATE rutas SET activa = 0 WHERE id = ?`).run(id);
  res.json({ ok: true, desactivada: true, alumnosAsignados: usados });
});

// GET /api/rutas/:id/manifiesto — Camionero
router.get("/:id/manifiesto", authRequired(["camionero"]), (req, res) => {
  const rutaId = Number(req.params.id);
  const ruta = db.prepare(`SELECT * FROM rutas WHERE id = ?`).get(rutaId);
  if (!ruta) return res.status(404).json({ error: "Ruta no encontrada." });

  const alumnos = db.prepare(`
    SELECT a.matricula, a.nombre, a.apellidos, a.viajes_restantes
    FROM alumno_rutas ar
    JOIN alumnos a ON a.id = ar.alumno_id
    WHERE ar.ruta_id = ? AND a.activo = 1
  `).all(rutaId);

  res.json({
    rutaId,
    generadoEn: new Date().toISOString(),
    alumnos: alumnos.map((a) => ({
      matricula: a.matricula,
      nombre: `${a.nombre} ${a.apellidos}`,
      viajesRestantes: a.viajes_restantes,
    })),
  });
});

module.exports = router;
