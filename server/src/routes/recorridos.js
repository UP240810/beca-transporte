const express = require("express");
const db = require("../db");
const { authRequired } = require("../middleware/auth");
const { partesBoleto } = require("../porcentajes");

const router = express.Router();

const CLAVE_OK = /^[A-Za-z0-9_-]{6,64}$/;

/** Crea el recorrido si no existe (idempotente) y lo devuelve. Lo usa también validaciones. */
function asegurarRecorrido({ clave, operadorId, rutaId, iniciadoEn }) {
  let r = db.prepare(`SELECT * FROM recorridos WHERE clave = ?`).get(clave);
  if (r) return r.operador_usuario_id === operadorId ? r : null;
  const fecha = iniciadoEn && !Number.isNaN(Date.parse(iniciadoEn))
    ? new Date(iniciadoEn).toISOString().slice(0, 19).replace("T", " ")
    : new Date().toISOString().slice(0, 19).replace("T", " ");
  db.prepare(
    `INSERT OR IGNORE INTO recorridos (clave, operador_usuario_id, ruta_id, iniciado_en) VALUES (?, ?, ?, ?)`
  ).run(clave, operadorId, rutaId, fecha);
  return db.prepare(`SELECT * FROM recorridos WHERE clave = ?`).get(clave);
}

function resumenRecorrido(rec) {
  const ruta = db.prepare(`SELECT id, nombre, codigo FROM rutas WHERE id = ?`).get(rec.ruta_id);
  const unidad = db.prepare(`
    SELECT un.codigo FROM camionero_perfil cp JOIN unidades un ON un.id = cp.unidad_id WHERE cp.usuario_id = ?
  `).get(rec.operador_usuario_id);
  const filas = db.prepare(`
    SELECT vc.id, vc.resultado, vc.creado_en, a.matricula, a.nombre, a.apellidos,
           r.nombre AS ruta, r.costo_por_viaje
    FROM viajes_consumidos vc
    JOIN alumnos a ON a.id = vc.alumno_id
    LEFT JOIN rutas r ON r.id = vc.ruta_id
    WHERE vc.recorrido_id = ?
    ORDER BY vc.creado_en, vc.id
  `).all(rec.id);

  let validos = 0, rechazados = 0, total100 = 0, total90 = 0;
  const detalle = filas.map((f) => {
    const p = partesBoleto(f.costo_por_viaje || 0);
    if (f.resultado === "valido") { validos += 1; total100 += p.costo100; total90 += p.costo90; }
    else rechazados += 1;
    return {
      id: f.id,
      hora: f.creado_en,
      matricula: f.matricula,
      nombre: `${f.nombre} ${f.apellidos}`,
      resultado: f.resultado,
      monto100: f.resultado === "valido" ? p.costo100 : 0,
      monto90: f.resultado === "valido" ? p.costo90 : 0,
    };
  });

  return {
    clave: rec.clave,
    ruta: ruta ? { id: ruta.id, nombre: ruta.nombre, codigo: ruta.codigo } : null,
    unidad: unidad?.codigo || null,
    iniciadoEn: rec.iniciado_en,
    terminadoEn: rec.terminado_en,
    enCurso: !rec.terminado_en,
    validos,
    rechazados,
    totalEscaneos: filas.length,
    total100,
    total90,
    detalle,
  };
}

// POST /api/recorridos { clave, rutaId, iniciadoEn? } — empezar ruta nueva (idempotente)
router.post("/", authRequired(["camionero"]), (req, res) => {
  const { clave, rutaId, iniciadoEn } = req.body || {};
  if (!CLAVE_OK.test(String(clave || ""))) return res.status(400).json({ error: "Clave de recorrido inválida." });
  if (!db.prepare(`SELECT 1 FROM rutas WHERE id = ?`).get(Number(rutaId))) {
    return res.status(404).json({ error: "Ruta no encontrada." });
  }
  const rec = asegurarRecorrido({ clave, operadorId: req.user.id, rutaId: Number(rutaId), iniciadoEn });
  if (!rec) return res.status(403).json({ error: "Ese recorrido pertenece a otro chofer." });
  res.status(201).json(resumenRecorrido(rec));
});

// POST /api/recorridos/:clave/terminar { rutaId?, terminadoEn? } — terminar ruta
router.post("/:clave/terminar", authRequired(["camionero"]), (req, res) => {
  const { clave } = req.params;
  if (!CLAVE_OK.test(clave)) return res.status(400).json({ error: "Clave de recorrido inválida." });
  const { rutaId, terminadoEn, iniciadoEn } = req.body || {};
  let rec = db.prepare(`SELECT * FROM recorridos WHERE clave = ?`).get(clave);
  if (!rec) {
    // Ruta iniciada sin señal y sin escaneos enviados aún: se registra ahora.
    if (!rutaId) return res.status(404).json({ error: "Recorrido no encontrado." });
    rec = asegurarRecorrido({ clave, operadorId: req.user.id, rutaId: Number(rutaId), iniciadoEn });
  }
  if (!rec || rec.operador_usuario_id !== req.user.id) {
    return res.status(403).json({ error: "Ese recorrido pertenece a otro chofer." });
  }
  if (!rec.terminado_en) {
    const fin = terminadoEn && !Number.isNaN(Date.parse(terminadoEn))
      ? new Date(terminadoEn).toISOString().slice(0, 19).replace("T", " ")
      : new Date().toISOString().slice(0, 19).replace("T", " ");
    db.prepare(`UPDATE recorridos SET terminado_en = ? WHERE id = ?`).run(fin, rec.id);
    rec = db.prepare(`SELECT * FROM recorridos WHERE id = ?`).get(rec.id);
  }
  res.json(resumenRecorrido(rec));
});

// GET /api/recorridos — historial del chofer (más recientes primero)
router.get("/", authRequired(["camionero"]), (req, res) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
  const filas = db.prepare(`
    SELECT * FROM recorridos WHERE operador_usuario_id = ? ORDER BY iniciado_en DESC, id DESC LIMIT ?
  `).all(req.user.id, limit);
  res.json(filas.map((r) => {
    const { detalle, ...resumen } = resumenRecorrido(r);
    return resumen;
  }));
});

// GET /api/recorridos/:clave — detalle de un recorrido
router.get("/:clave", authRequired(["camionero"]), (req, res) => {
  const rec = db.prepare(`SELECT * FROM recorridos WHERE clave = ? AND operador_usuario_id = ?`).get(req.params.clave, req.user.id);
  if (!rec) return res.status(404).json({ error: "Recorrido no encontrado." });
  res.json(resumenRecorrido(rec));
});

module.exports = { router, asegurarRecorrido };
