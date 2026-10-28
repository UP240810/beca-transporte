const express = require("express");
const db = require("../db");
const { authRequired } = require("../middleware/auth");
const { firmarPaseQR } = require("../qr");

const router = express.Router();

// Umbral de "pocos viajes" — se puede mover a config después
const UMBRAL_POCOS_VIAJES = 5;

// GET /api/alumno/me — protegido, alumno logueado
router.get("/me", authRequired(["alumno"]), (req, res) => {
  const alumno = db.prepare(`SELECT * FROM alumnos WHERE usuario_id = ?`).get(req.user.id);
  if (!alumno) return res.status(404).json({ error: "No se encontró tu información de alumno." });

  if (alumno.activo === 0) {
    return res.status(403).json({ error: "Tu cuenta está dada de baja del programa de becas." });
  }

  const rutas = db.prepare(`
    SELECT r.nombre, r.descuento_pct, r.costo_por_viaje FROM alumno_rutas ar
    JOIN rutas r ON r.id = ar.ruta_id
    WHERE ar.alumno_id = ? ORDER BY ar.orden
  `).all(alumno.id);

  const ultimoViaje = db.prepare(`
    SELECT creado_en FROM viajes_consumidos WHERE alumno_id = ? AND resultado = 'valido'
    ORDER BY creado_en DESC LIMIT 1
  `).get(alumno.id);

  const usadosMes = db.prepare(`
    SELECT COUNT(*) as n FROM viajes_consumidos
    WHERE alumno_id = ? AND resultado = 'valido'
    AND strftime('%Y-%m', creado_en) = strftime('%Y-%m', 'now')
  `).get(alumno.id).n;

  res.json({
    nombre: alumno.nombre,
    nombreCompleto: `${alumno.nombre} ${alumno.apellidos}`,
    matricula: alumno.matricula,
    escuela: alumno.escuela,
    foto: alumno.foto_url,
    rutas: rutas.map((r) => ({
      nombre: r.nombre,
      descuento: `${r.descuento_pct}%`,
      costoPorViaje: r.costo_por_viaje,
    })),
    viajesRestantes: alumno.viajes_restantes,
    viajesLimiteMes: alumno.viajes_limite_mes,
    viajesUsadosMes: usadosMes,
    ultimoUso: ultimoViaje ? ultimoViaje.creado_en : null,
    pocosViajes: alumno.viajes_restantes > 0 && alumno.viajes_restantes <= UMBRAL_POCOS_VIAJES,
    sinSaldo: alumno.viajes_restantes <= 0,
    umbralPocosViajes: UMBRAL_POCOS_VIAJES,
  });
});

// GET /api/alumno/historial?limit=50
// Movimientos unificados tipo banco: recargas (ingreso) + viajes (egreso)
router.get("/historial", authRequired(["alumno"]), (req, res) => {
  const alumno = db.prepare(`SELECT * FROM alumnos WHERE usuario_id = ?`).get(req.user.id);
  if (!alumno) return res.status(404).json({ error: "No se encontró tu información de alumno." });
  if (alumno.activo === 0) {
    return res.status(403).json({ error: "Tu cuenta está dada de baja del programa de becas." });
  }

  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));

  const recargas = db.prepare(`
    SELECT id, viajes, monto, creado_en
    FROM recargas
    WHERE alumno_id = ?
    ORDER BY creado_en DESC
    LIMIT ?
  `).all(alumno.id, limit);

  const viajes = db.prepare(`
    SELECT vc.id, vc.resultado, vc.creado_en, r.nombre AS ruta_nombre, r.costo_por_viaje
    FROM viajes_consumidos vc
    JOIN rutas r ON r.id = vc.ruta_id
    WHERE vc.alumno_id = ?
    ORDER BY vc.creado_en DESC
    LIMIT ?
  `).all(alumno.id, limit);

  const movimientos = [];

  for (const r of recargas) {
    movimientos.push({
      id: `recarga-${r.id}`,
      tipo: "recarga",
      titulo: "Recarga en ventanilla",
      detalle: `${r.viajes} viaje${r.viajes === 1 ? "" : "s"} · $${r.monto}${r.folio ? ` · ${r.folio}` : ""}`,
      fecha: r.creado_en,
      viajes: r.viajes,
      monto: r.monto,
      folio: r.folio || null,
      signo: "+",
    });
  }

  for (const v of viajes) {
    const valido = v.resultado === "valido";
    let titulo = "Viaje en camión";
    let detalle = v.ruta_nombre || "Ruta";
    if (v.resultado === "ruta-incorrecta") {
      titulo = "Intento rechazado";
      detalle = `Ruta incorrecta · ${v.ruta_nombre}`;
    } else if (v.resultado === "sin-saldo") {
      titulo = "Intento rechazado";
      detalle = "Sin viajes disponibles";
    } else if (v.resultado === "revocado") {
      titulo = "Intento rechazado";
      detalle = "Pase revocado o baja";
    } else if (valido) {
      detalle = v.ruta_nombre;
    }

    movimientos.push({
      id: `viaje-${v.id}`,
      tipo: valido ? "viaje" : "rechazo",
      titulo,
      detalle,
      fecha: v.creado_en,
      viajes: valido ? -1 : 0,
      monto: valido ? -(v.costo_por_viaje || 0) : 0,
      resultado: v.resultado,
      signo: valido ? "-" : "·",
    });
  }

  // Ordenar por fecha descendente y cortar
  movimientos.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  const lista = movimientos.slice(0, limit);

  res.json({
    movimientos: lista,
    viajesRestantes: alumno.viajes_restantes,
    pocosViajes: alumno.viajes_restantes > 0 && alumno.viajes_restantes <= UMBRAL_POCOS_VIAJES,
    sinSaldo: alumno.viajes_restantes <= 0,
    umbralPocosViajes: UMBRAL_POCOS_VIAJES,
  });
});

// GET /api/alumno/qr-token
router.get("/qr-token", authRequired(["alumno"]), (req, res) => {
  const alumno = db.prepare(`SELECT * FROM alumnos WHERE usuario_id = ?`).get(req.user.id);
  if (!alumno) return res.status(404).json({ error: "No se encontró tu información de alumno." });
  if (alumno.activo === 0) {
    return res.status(403).json({ error: "Tu cuenta está dada de baja; no se puede emitir un pase." });
  }
  const { token, jti, exp } = firmarPaseQR(alumno);
  res.json({ token, jti, expiraEn: exp * 1000 });
});

// GET /api/alumno/pase-estado/:jti — la app del alumno pregunta si su pase ya fue usado
router.get("/pase-estado/:jti", authRequired(["alumno"]), (req, res) => {
  const alumno = db.prepare(`SELECT id FROM alumnos WHERE usuario_id = ?`).get(req.user.id);
  if (!alumno) return res.status(404).json({ error: "No se encontró tu información de alumno." });
  const fila = db.prepare(`SELECT usado_en FROM pases_usados WHERE jti = ? AND alumno_id = ?`).get(req.params.jti, alumno.id);
  res.json({ usado: !!fila, usadoEn: fila?.usado_en || null });
});

module.exports = router;
