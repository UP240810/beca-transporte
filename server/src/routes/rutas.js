const express = require("express");
const db = require("../db");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

// GET /api/rutas — catálogo público
router.get("/", (req, res) => {
  const rutas = db.prepare(
    `SELECT id, nombre, codigo, descuento_pct, costo_por_viaje FROM rutas WHERE activa = 1 ORDER BY nombre`
  ).all();
  res.json(rutas);
});

// POST /api/rutas — Recaudación da de alta o reutiliza una ruta oficial
// Body: { nombre, codigo?, costo_por_viaje?, descuento_pct? }
router.post("/", authRequired(["desarrollo_social", "recaudacion"]), (req, res) => {
  const { nombre, codigo, costo_por_viaje, descuento_pct } = req.body;
  if (!nombre || !String(nombre).trim()) {
    return res.status(400).json({ error: "El nombre de la ruta es obligatorio." });
  }
  const nombreLimpio = String(nombre).trim();
  const codigoLimpio = codigo ? String(codigo).trim().toUpperCase().slice(0, 20) : null;

  const existente = db.prepare(
    `SELECT id, nombre, codigo, descuento_pct, costo_por_viaje FROM rutas WHERE nombre = ?`
  ).get(nombreLimpio);
  if (existente) {
    // Si mandan código y la ruta no tenía, se lo actualizamos
    if (codigoLimpio && !existente.codigo) {
      db.prepare(`UPDATE rutas SET codigo = ? WHERE id = ?`).run(codigoLimpio, existente.id);
      existente.codigo = codigoLimpio;
    }
    return res.status(200).json(existente);
  }

  if (codigoLimpio) {
    const porCodigo = db.prepare(
      `SELECT id, nombre, codigo, descuento_pct, costo_por_viaje FROM rutas WHERE codigo = ?`
    ).get(codigoLimpio);
    if (porCodigo) {
      return res.status(200).json(porCodigo);
    }
  }

  const costo = Number(costo_por_viaje) > 0 ? Number(costo_por_viaje) : 15;
  const descuento = Number(descuento_pct) >= 0 ? Number(descuento_pct) : 50;
  const info = db.prepare(
    `INSERT INTO rutas (nombre, codigo, descuento_pct, costo_por_viaje) VALUES (?, ?, ?, ?)`
  ).run(nombreLimpio, codigoLimpio, descuento, costo);

  res.status(201).json({
    id: info.lastInsertRowid,
    nombre: nombreLimpio,
    codigo: codigoLimpio,
    descuento_pct: descuento,
    costo_por_viaje: costo,
  });
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
