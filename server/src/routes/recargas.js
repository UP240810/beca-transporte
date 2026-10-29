const express = require("express");
const db = require("../db");
const { authRequired } = require("../middleware/auth");
const { verificarQRIdentidad } = require("../qr");

const router = express.Router();
const { cobroEstudiante, PCT_ESTUDIANTE, partesBoleto } = require("../porcentajes");


function fichaAlumno(alumno) {
  const rutas = db.prepare(`
    SELECT r.id, r.nombre, r.codigo, r.costo_por_viaje
    FROM alumno_rutas ar JOIN rutas r ON r.id = ar.ruta_id
    WHERE ar.alumno_id = ?
    ORDER BY ar.orden
  `).all(alumno.id);

  const costoBoleto = rutas[0]?.costo_por_viaje || 15;
  const partes = partesBoleto(costoBoleto);
  const costoPorViaje = partes.costo40;

  const usadosMes = db.prepare(`
    SELECT COUNT(*) as n FROM viajes_consumidos
    WHERE alumno_id = ? AND resultado = 'valido'
      AND strftime('%Y-%m', creado_en) = strftime('%Y-%m', 'now')
  `).get(alumno.id)?.n || 0;

  const hace7 = db.prepare(`
    SELECT 'recarga' as tipo, rec.viajes, rec.monto, rec.folio, rec.creado_en, null as resultado
    FROM recargas rec WHERE rec.alumno_id = ? AND date(rec.creado_en) >= date('now', '-7 days')
    UNION ALL
    SELECT 'viaje' as tipo, 1 as viajes, null as monto, null as folio, vc.creado_en, vc.resultado
    FROM viajes_consumidos vc WHERE vc.alumno_id = ? AND date(vc.creado_en) >= date('now', '-7 days')
    ORDER BY creado_en DESC
    LIMIT 40
  `).all(alumno.id, alumno.id);

  return {
    id: alumno.id,
    matricula: alumno.matricula,
    nombre: `${alumno.nombre} ${alumno.apellidos}`,
    nombreSolo: alumno.nombre,
    apellidos: alumno.apellidos,
    fotoUrl: alumno.foto_url || null,
    viajesRestantes: alumno.viajes_restantes,
    viajesMes: usadosMes,
    rutas: rutas.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      codigo: r.codigo,
      costoBoleto: r.costo_por_viaje,
      costoEstudiante: partesBoleto(r.costo_por_viaje).costo40,
    })),
    costoPorViaje,
    costoBoleto,
    pctEstudiante: PCT_ESTUDIANTE,
    historial7d: hace7,
  };
}

// GET /api/recargas/buscar?q=
router.get("/buscar", authRequired(["ventanilla"]), (req, res) => {
  const q = `%${(req.query.q || "").toLowerCase()}%`;
  const alumnos = db.prepare(`
    SELECT * FROM alumnos
    WHERE lower(nombre || ' ' || apellidos) LIKE ? OR lower(matricula) LIKE ?
    LIMIT 10
  `).all(q, q);

  res.json(alumnos.map(fichaAlumno));
});

// GET /api/recargas/alumno/:matricula — ficha completa
router.get("/alumno/:matricula", authRequired(["ventanilla"]), (req, res) => {
  const alumno = db.prepare(`SELECT * FROM alumnos WHERE matricula = ?`).get(req.params.matricula);
  if (!alumno) return res.status(404).json({ error: "Alumno no encontrado." });
  res.json(fichaAlumno(alumno));
});

// POST /api/recargas/por-qr  { qrToken } — identifica alumno por QR de la tarjeta
router.post("/por-qr", authRequired(["ventanilla"]), (req, res) => {
  const { qrToken } = req.body || {};
  if (!qrToken) return res.status(400).json({ error: "Falta el código QR." });

  let matricula;
  let versionEnToken = null;
  try {
    const payload = verificarQRIdentidad(qrToken);
    matricula = payload.matricula;
    versionEnToken = payload.v != null ? Number(payload.v) : 1;
  } catch {
    return res.status(400).json({ error: "QR inválido, vencido o no reconocido." });
  }

  const alumno = db.prepare(`SELECT * FROM alumnos WHERE matricula = ?`).get(matricula);
  if (!alumno) return res.status(404).json({ error: "Alumno no encontrado." });

  if (alumno.activo === 0) {
    return res.status(403).json({ error: "Este alumno está dado de baja del programa." });
  }

  const versionActual = alumno.qr_version != null ? Number(alumno.qr_version) : 1;
  if (versionEnToken !== versionActual) {
    return res.status(400).json({
      error: "Este QR ya no es válido (fue revocado). El estudiante debe abrir su app para obtener uno nuevo.",
    });
  }

  res.json(fichaAlumno(alumno));
});

/**
 * POST /api/recargas
 * Body:
 *   { matricula, viajes }           — recarga por número de viajes
 *   { matricula, monto }            — recarga por pesos (se convierten a viajes enteros)
 *   { matricula, viajes, monto }    — si mandan ambos, prioriza viajes y recalcula monto
 */
router.post("/", authRequired(["ventanilla"]), (req, res) => {
  const { matricula } = req.body || {};
  let { viajes, monto } = req.body || {};

  if (!matricula) {
    return res.status(400).json({ error: "Falta la matrícula del alumno." });
  }

  const alumno = db.prepare(`SELECT * FROM alumnos WHERE matricula = ?`).get(matricula);
  if (!alumno) return res.status(404).json({ error: "Alumno no encontrado." });
  if (alumno.activo === 0) {
    return res.status(403).json({ error: "No se puede recargar: alumno dado de baja." });
  }

  const ruta = db.prepare(`
    SELECT r.costo_por_viaje, r.nombre FROM alumno_rutas ar JOIN rutas r ON r.id = ar.ruta_id
    WHERE ar.alumno_id = ? ORDER BY ar.orden LIMIT 1
  `).get(alumno.id);
  const costoBoleto = ruta ? Number(ruta.costo_por_viaje) : 15;
  const costoPorViaje = cobroEstudiante(costoBoleto); // lo que paga el estudiante (40%)


  let modo = "viajes";
  viajes = Number(viajes);
  monto = Number(monto);

  const MONTO_MAX_RECARGA = 500;

  if (Number.isFinite(viajes) && viajes > 0) {
    modo = "viajes";
    viajes = Math.floor(viajes);
    monto = viajes * costoPorViaje;
  } else if (Number.isFinite(monto) && monto > 0) {
    modo = "monto";
    // Solo viajes enteros; el dinero que no alcanza un viaje completo no se acredita como fracción
    viajes = Math.floor(monto / costoPorViaje);
    if (viajes < 1) {
      return res.status(400).json({
        error: `El monto mínimo es $${costoPorViaje} (1 viaje al 40%). Recibido: $${monto}.`,
      });
    }
    // Registramos el monto realmente cobrado = viajes * costo estudiante (40%)
    const montoAcreditado = viajes * costoPorViaje;
    monto = montoAcreditado;
  } else {
    return res.status(400).json({ error: "Indica un número de viajes o un monto en pesos mayor a cero." });
  }

  if (monto > MONTO_MAX_RECARGA) {
    const maxViajes = Math.floor(MONTO_MAX_RECARGA / costoPorViaje);
    return res.status(400).json({
      error: `El límite por recarga es $${MONTO_MAX_RECARGA}. Con el costo del estudiante ($${costoPorViaje}/viaje) el máximo es ${maxViajes} viaje(s).`,
      limite: MONTO_MAX_RECARGA,
      costoPorViajeEstudiante: costoPorViaje,
      maxViajes,
    });
  }

  const saldoAnterior = alumno.viajes_restantes;
  const ahora = new Date();
  const folio = `REC-${ahora.toISOString().slice(0, 10).replace(/-/g, "")}-${String(alumno.id).padStart(4, "0")}-${String(Date.now()).slice(-5)}`;

  const registrar = db.transaction(() => {
    db.prepare(`
      INSERT INTO recargas (folio, alumno_id, viajes, monto, staff_usuario_id) VALUES (?, ?, ?, ?, ?)
    `).run(folio, alumno.id, viajes, monto, req.user.id);

    db.prepare(`UPDATE alumnos SET viajes_restantes = viajes_restantes + ? WHERE id = ?`).run(viajes, alumno.id);
  });
  registrar();

  const saldoNuevo = saldoAnterior + viajes;

  res.status(201).json({
    ok: true,
    folio,
    modo,
    viajes,
    monto,
    costoPorViaje,
    costoBoleto,
    pctEstudiante: PCT_ESTUDIANTE,
    saldoAnterior,
    saldoNuevo,
    fecha: ahora.toISOString(),
    alumno: {
      matricula: alumno.matricula,
      nombre: `${alumno.nombre} ${alumno.apellidos}`,
      ruta: ruta ? ruta.nombre : null,
      fotoUrl: alumno.foto_url || null,
    },
    atendidoPor: req.user.usuario || req.user.nombre || "ventanilla",
  });
});

// GET /api/recargas/reporte
router.get("/reporte", authRequired(["recaudacion", "ventanilla"]), (req, res) => {
  const hoy = new Date().toISOString().slice(0, 10);
  const primerDiaMes = `${hoy.slice(0, 7)}-01`;
  const desde = req.query.desde || primerDiaMes;
  const hasta = req.query.hasta || hoy;

  const filas = db.prepare(`
    SELECT rec.creado_en, a.matricula, a.nombre, a.apellidos, rec.viajes, rec.monto, u.usuario as atendido_por,
           (SELECT r.nombre FROM alumno_rutas ar JOIN rutas r ON r.id = ar.ruta_id WHERE ar.alumno_id = a.id ORDER BY ar.orden LIMIT 1) as ruta
    FROM recargas rec
    JOIN alumnos a ON a.id = rec.alumno_id
    JOIN usuarios u ON u.id = rec.staff_usuario_id
    WHERE date(rec.creado_en) BETWEEN date(?) AND date(?)
    ORDER BY rec.creado_en ASC
  `).all(desde, hasta);

  function celda(v) {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  const encabezado = ["Fecha", "Matrícula", "Nombre", "Ruta", "Viajes", "Monto (MXN)", "Atendido por"];
  const lineas = [encabezado.join(",")];
  let totalViajes = 0, totalMonto = 0;
  for (const f of filas) {
    totalViajes += f.viajes;
    totalMonto += f.monto;
    lineas.push([
      celda(f.creado_en), celda(f.matricula), celda(`${f.nombre} ${f.apellidos}`),
      celda(f.ruta || ""), celda(f.viajes), celda(f.monto), celda(f.atendido_por),
    ].join(","));
  }
  lineas.push("");
  lineas.push(["TOTAL", "", "", "", celda(totalViajes), celda(totalMonto), ""].join(","));

  const csv = "\uFEFF" + lineas.join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="recargas_${desde}_a_${hasta}.csv"`);
  res.send(csv);
});

// GET /api/recargas/hoy
router.get("/hoy", authRequired(["ventanilla"]), (req, res) => {
  const recargas = db.prepare(`
    SELECT rec.viajes, rec.monto, rec.creado_en, a.nombre, a.apellidos, a.matricula,
           (SELECT r.nombre FROM alumno_rutas ar JOIN rutas r ON r.id = ar.ruta_id WHERE ar.alumno_id = a.id ORDER BY ar.orden LIMIT 1) as ruta
    FROM recargas rec
    JOIN alumnos a ON a.id = rec.alumno_id
    WHERE date(rec.creado_en) = date('now')
    ORDER BY rec.creado_en DESC
  `).all();

  const totalMonto = recargas.reduce((s, r) => s + r.monto, 0);
  const totalViajes = recargas.reduce((s, r) => s + r.viajes, 0);
  const personas = new Set(recargas.map((r) => r.matricula)).size;

  res.json({
    totalMonto, totalViajes, personas,
    recargas: recargas.map((r) => ({
      matricula: r.matricula,
      nombre: `${r.nombre} ${r.apellidos}`,
      ruta: r.ruta,
      viajes: r.viajes,
      monto: r.monto,
      hora: r.creado_en,
    })),
  });
});



router.get("/cortes", authRequired(["ventanilla", "recaudacion", "contabilidad", "desarrollo_social"]), (req, res) => {
  const hoy = new Date().toISOString().slice(0, 10);
  const desde = (req.query.desde || hoy).slice(0, 10);
  const hasta = (req.query.hasta || hoy).slice(0, 10);

  const filas = db.prepare(`
    SELECT rec.id, rec.folio, rec.viajes, rec.monto, rec.creado_en,
           a.matricula, a.nombre, a.apellidos
    FROM recargas rec
    JOIN alumnos a ON a.id = rec.alumno_id
    WHERE date(rec.creado_en) >= date(?) AND date(rec.creado_en) <= date(?)
    ORDER BY rec.creado_en
  `).all(desde, hasta);

  function esc(v) {
    const s = v == null ? "" : String(v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  const headers = ["idventa", "idestudiante", "matricula", "nombre", "cantidad", "precio", "fecha", "40%", "folio"];
  const lines = [headers.join(",")];
  let subtotal40 = 0;
  for (const f of filas) {
    subtotal40 += f.monto;
    lines.push([
      f.id,
      f.id,
      f.matricula,
      `${f.nombre} ${f.apellidos}`.trim(),
      f.viajes,
      f.monto,
      String(f.creado_en || "").slice(0, 10),
      f.monto,
      f.folio || "",
    ].map(esc).join(","));
  }
  lines.push("");
  lines.push(["", "", "", "", "", "SUBTOTAL 40%", "", subtotal40, ""].map(esc).join(","));

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="cortes_boletos_${desde}_a_${hasta}.csv"`);
  res.send("\uFEFF" + lines.join("\n"));
});


/** POST /api/recargas/devolucion — regresar dinero (resta viajes y registra) */
router.post("/devolucion", authRequired(["ventanilla"]), (req, res) => {
  const { matricula, monto, motivo } = req.body || {};
  if (!matricula) return res.status(400).json({ error: "Falta matrícula." });
  const alumno = db.prepare(`SELECT * FROM alumnos WHERE matricula = ?`).get(matricula);
  if (!alumno) return res.status(404).json({ error: "Alumno no encontrado." });

  const ruta = db.prepare(`
    SELECT r.costo_por_viaje FROM alumno_rutas ar JOIN rutas r ON r.id = ar.ruta_id
    WHERE ar.alumno_id = ? ORDER BY ar.orden LIMIT 1
  `).get(alumno.id);
  const costo40 = cobroEstudiante(ruta?.costo_por_viaje || 15);
  let viajes = 0;
  let montoN = Number(monto);
  if (Number.isFinite(montoN) && montoN > 0) {
    viajes = Math.floor(montoN / costo40);
    if (viajes < 1) return res.status(400).json({ error: `Monto mínimo de devolución: $${costo40}.` });
    montoN = viajes * costo40;
  } else {
    return res.status(400).json({ error: "Indica el monto a devolver." });
  }
  if (alumno.viajes_restantes < viajes) {
    return res.status(400).json({ error: "El alumno no tiene suficientes viajes para esa devolución." });
  }

  const saldoAnterior = alumno.viajes_restantes;
  const folio = `DEV-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${Date.now().toString().slice(-5)}`;
  const run = db.transaction(() => {
    db.prepare(`UPDATE alumnos SET viajes_restantes = viajes_restantes - ? WHERE id = ?`).run(viajes, alumno.id);
    db.prepare(`
      INSERT INTO devoluciones (folio, alumno_id, ventanilla_usuario_id, monto, viajes, motivo)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(folio, alumno.id, req.user.id, montoN, viajes, motivo || null);
  });
  run();

  res.json({
    ok: true,
    folio,
    matricula: alumno.matricula,
    nombre: `${alumno.nombre} ${alumno.apellidos}`,
    viajesDevueltos: viajes,
    monto: montoN,
    saldoAnterior,
    saldoNuevo: saldoAnterior - viajes,
  });
});

module.exports = router;



