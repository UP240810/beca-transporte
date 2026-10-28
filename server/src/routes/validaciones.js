const express = require("express");
const db = require("../db");
const { authRequired } = require("../middleware/auth");
const { verificarPaseQR } = require("../qr");

const router = express.Router();

const MENSAJES = {
  valido: "Pase válido. Ruta correcta y con viajes disponibles.",
  "ruta-incorrecta": "Ruta incorrecta. Este estudiante no tiene descuento en la ruta de este turno.",
  "sin-saldo": "Saldo insuficiente. El estudiante debe recargar en la Presidencia Municipal.",
  revocado: "Pase revocado o alumno dado de baja. No se permite el viaje.",
  "pase-usado": "Este pase ya fue utilizado. El estudiante debe abrir su app y mostrar el pase nuevo.",
};

function rutasDelAlumno(alumnoId) {
  return db.prepare(`
    SELECT r.id, r.nombre, r.codigo, r.costo_por_viaje
    FROM alumno_rutas ar
    JOIN rutas r ON r.id = ar.ruta_id
    WHERE ar.alumno_id = ?
    ORDER BY ar.orden
  `).all(alumnoId);
}

// POST /api/validaciones  { qrToken } o { matricula }, { rutaId }
router.post("/", authRequired(["camionero"]), (req, res) => {
  const { qrToken, matricula: matriculaDirecta, rutaId, escaneadoEn } = req.body;
  if ((!qrToken && !matriculaDirecta) || !rutaId) {
    return res.status(400).json({ error: "Faltan datos del escaneo." });
  }

  let matricula = matriculaDirecta;
  let viaManual = true;
  let versionEnToken = null;
  let jti = null;

  if (qrToken) {
    try {
      // escaneadoEn: validaciones hechas sin señal que se envían después
      const payload = verificarPaseQR(qrToken, { escaneadoEn });
      jti = payload.jti || null;
      matricula = payload.matricula;
      versionEnToken = payload.v != null ? Number(payload.v) : 1;
      viaManual = false;
    } catch {
      return res.status(400).json({ error: "QR inválido, vencido o no reconocido." });
    }
  }

  const alumno = db.prepare(`SELECT * FROM alumnos WHERE matricula = ?`).get(matricula);
  if (!alumno) return res.status(404).json({ error: "Pase no reconocido." });

  const rutasAlumno = rutasDelAlumno(alumno.id);
  const rutaTurno = db.prepare(`SELECT id, nombre, codigo, costo_por_viaje FROM rutas WHERE id = ?`).get(rutaId);

  const alumnoPayload = () => ({
    nombre: `${alumno.nombre} ${alumno.apellidos}`,
    matricula: alumno.matricula,
    ruta: rutasAlumno[0]?.nombre || null,
    rutas: rutasAlumno.map((r) => r.nombre),
    viajesRestantes: alumno.viajes_restantes,
  });

  if (alumno.activo === 0) {
    return res.json({
      resultado: "revocado",
      mensaje: MENSAJES.revocado,
      viaManual,
      alumno: alumnoPayload(),
      rutaTurno: rutaTurno ? { id: rutaTurno.id, nombre: rutaTurno.nombre, codigo: rutaTurno.codigo } : null,
    });
  }

  if (!viaManual && versionEnToken != null) {
    const versionActual = alumno.qr_version != null ? Number(alumno.qr_version) : 1;
    if (versionEnToken !== versionActual) {
      return res.json({
        resultado: "revocado",
        mensaje: "Este código QR ya no es válido (fue revocado o regenerado). El estudiante debe abrir su app para obtener uno nuevo.",
        viaManual,
        alumno: alumnoPayload(),
        rutaTurno: rutaTurno ? { id: rutaTurno.id, nombre: rutaTurno.nombre, codigo: rutaTurno.codigo } : null,
      });
    }
  }

  // Pase de un solo uso: cada QR trae un identificador único (jti) que solo se acepta una vez.
  if (!viaManual) {
    const respuestaPase = (mensaje) => res.json({
      resultado: "pase-usado",
      mensaje,
      viaManual,
      alumno: alumnoPayload(),
      rutaTurno: rutaTurno ? { id: rutaTurno.id, nombre: rutaTurno.nombre, codigo: rutaTurno.codigo } : null,
    });
    if (!jti) {
      return respuestaPase("Este QR es de una versión anterior y ya no sirve. El estudiante debe abrir su app para obtener un pase nuevo.");
    }
    if (db.prepare(`SELECT 1 FROM pases_usados WHERE jti = ?`).get(jti)) {
      return respuestaPase(MENSAJES["pase-usado"]);
    }
  }

  const tieneRuta = db.prepare(
    `SELECT 1 FROM alumno_rutas WHERE alumno_id = ? AND ruta_id = ?`
  ).get(alumno.id, rutaId);

  let resultado;
  if (!tieneRuta) {
    resultado = "ruta-incorrecta";
  } else if (alumno.viajes_restantes <= 0) {
    resultado = "sin-saldo";
  } else {
    resultado = "valido";
  }

  const registrar = db.transaction(() => {
    // Se consume primero: si otro escaneo ganó la carrera, la restricción UNIQUE aborta todo.
    if (resultado === "valido" && jti) {
      db.prepare(`INSERT INTO pases_usados (jti, alumno_id, ruta_id) VALUES (?, ?, ?)`).run(jti, alumno.id, rutaId);
    }
    db.prepare(`
      INSERT INTO viajes_consumidos (alumno_id, ruta_id, operador_usuario_id, resultado) VALUES (?, ?, ?, ?)
    `).run(alumno.id, rutaId, req.user.id, resultado);

    if (resultado === "valido") {
      db.prepare(`UPDATE alumnos SET viajes_restantes = viajes_restantes - 1 WHERE id = ?`).run(alumno.id);
    }
  });
  try {
    registrar();
  } catch (e) {
    if (String(e.code || "").startsWith("SQLITE_CONSTRAINT")) {
      return res.json({
        resultado: "pase-usado",
        mensaje: MENSAJES["pase-usado"],
        viaManual,
        alumno: alumnoPayload(),
        rutaTurno: rutaTurno ? { id: rutaTurno.id, nombre: rutaTurno.nombre, codigo: rutaTurno.codigo } : null,
      });
    }
    throw e;
  }

  const viajesRestantes =
    resultado === "valido" ? alumno.viajes_restantes - 1 : alumno.viajes_restantes;

  res.json({
    resultado,
    mensaje: MENSAJES[resultado],
    viaManual,
    alumno: {
      ...alumnoPayload(),
      viajesRestantes,
    },
    rutaTurno: rutaTurno
      ? { id: rutaTurno.id, nombre: rutaTurno.nombre, codigo: rutaTurno.codigo }
      : null,
    costoDescontado: resultado === "valido" ? (rutaTurno?.costo_por_viaje || null) : null,
  });
});

// GET /api/validaciones/hoy — resumen simple (compat)
router.get("/hoy", authRequired(["camionero"]), (req, res) => {
  const { n } = db.prepare(`
    SELECT COUNT(*) as n FROM viajes_consumidos
    WHERE operador_usuario_id = ? AND date(creado_en) = date('now') AND resultado = 'valido'
  `).get(req.user.id);
  res.json({ validadosHoy: n });
});

// GET /api/validaciones/resumen?fecha=YYYY-MM-DD
// Resumen del día (o de una fecha) para el camionero: totales + detalle
router.get("/resumen", authRequired(["camionero"]), (req, res) => {
  const fecha = req.query.fecha || new Date().toISOString().slice(0, 10);
  // Solo aceptar formato simple de fecha
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return res.status(400).json({ error: "Fecha inválida. Usa YYYY-MM-DD." });
  }

  const filas = db.prepare(`
    SELECT
      vc.resultado,
      vc.creado_en,
      a.matricula,
      a.nombre,
      a.apellidos,
      r.nombre AS ruta_nombre,
      r.codigo AS ruta_codigo,
      r.costo_por_viaje
    FROM viajes_consumidos vc
    JOIN alumnos a ON a.id = vc.alumno_id
    JOIN rutas r ON r.id = vc.ruta_id
    WHERE vc.operador_usuario_id = ?
      AND date(vc.creado_en) = date(?)
    ORDER BY vc.creado_en DESC
  `).all(req.user.id, fecha);

  let validos = 0;
  let rechazados = 0;
  let montoEstimado = 0;

  const detalle = filas.map((f) => {
    if (f.resultado === "valido") {
      validos += 1;
      montoEstimado += f.costo_por_viaje || 0;
    } else {
      rechazados += 1;
    }
    return {
      hora: f.creado_en,
      matricula: f.matricula,
      nombre: `${f.nombre} ${f.apellidos}`,
      ruta: f.ruta_nombre,
      codigo: f.ruta_codigo,
      resultado: f.resultado,
      monto: f.resultado === "valido" ? f.costo_por_viaje : 0,
    };
  });

  res.json({
    fecha,
    validos,
    rechazados,
    totalEscaneos: filas.length,
    montoEstimado,
    detalle,
  });
});

module.exports = router;
