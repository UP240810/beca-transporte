const express = require("express");
const db = require("../db");
const { authRequired } = require("../middleware/auth");
const { partesBoleto } = require("../porcentajes");

const router = express.Router();

function rango(req) {
  const hoy = new Date().toISOString().slice(0, 10);
  return {
    desde: (req.query.desde || hoy).slice(0, 10),
    hasta: (req.query.hasta || hoy).slice(0, 10),
  };
}

/** Recargas por rango — recaudación / ventanilla */
router.get("/recargas", authRequired(["recaudacion", "ventanilla", "desarrollo_social"]), (req, res) => {
  const { desde, hasta } = rango(req);
  const filas = db.prepare(`
    SELECT rec.id, rec.folio, rec.viajes, rec.monto, rec.creado_en,
           a.matricula, a.nombre, a.apellidos
    FROM recargas rec
    JOIN alumnos a ON a.id = rec.alumno_id
    WHERE date(rec.creado_en) >= date(?) AND date(rec.creado_en) <= date(?)
    ORDER BY rec.creado_en
  `).all(desde, hasta);
  const total = filas.reduce((s, f) => s + (f.monto || 0), 0);
  res.json({ desde, hasta, total, filas });
});

/** Movimientos de un beneficiario por rango — recaudación */
router.get("/beneficiario/:matricula", authRequired(["recaudacion", "desarrollo_social", "ventanilla"]), (req, res) => {
  const { desde, hasta } = rango(req);
  const alumno = db.prepare(`SELECT * FROM alumnos WHERE matricula = ?`).get(req.params.matricula);
  if (!alumno) return res.status(404).json({ error: "Beneficiario no encontrado." });

  const recargas = db.prepare(`
    SELECT id, folio, viajes, monto, creado_en FROM recargas
    WHERE alumno_id = ? AND date(creado_en) >= date(?) AND date(creado_en) <= date(?)
    ORDER BY creado_en
  `).all(alumno.id, desde, hasta);

  const viajes = db.prepare(`
    SELECT vc.id, vc.resultado, vc.creado_en, r.nombre as ruta, r.costo_por_viaje,
           u.nombre as chofer
    FROM viajes_consumidos vc
    LEFT JOIN rutas r ON r.id = vc.ruta_id
    LEFT JOIN usuarios u ON u.id = vc.operador_usuario_id
    WHERE vc.alumno_id = ? AND date(vc.creado_en) >= date(?) AND date(vc.creado_en) <= date(?)
    ORDER BY vc.creado_en
  `).all(alumno.id, desde, hasta);

  res.json({
    desde, hasta,
    beneficiario: {
      matricula: alumno.matricula,
      nombre: `${alumno.nombre} ${alumno.apellidos}`,
      saldo: alumno.viajes_restantes,
    },
    recargas,
    viajes: viajes.map((v) => {
      const p = partesBoleto(v.costo_por_viaje || 0);
      return { ...v, costo100: p.costo100, costo90: p.costo90, costo40: p.costo40 };
    }),
  });
});

/** Viajes mensuales DS — costos 100%, 90%, 50% */
router.get("/viajes-mensual", authRequired(["desarrollo_social", "recaudacion"]), (req, res) => {
  const mes = (req.query.mes || new Date().toISOString().slice(0, 7)).slice(0, 7);
  const filas = db.prepare(`
    SELECT vc.id, vc.creado_en, vc.resultado, r.nombre as ruta, r.costo_por_viaje,
           a.matricula, a.nombre, a.apellidos
    FROM viajes_consumidos vc
    LEFT JOIN rutas r ON r.id = vc.ruta_id
    JOIN alumnos a ON a.id = vc.alumno_id
    WHERE strftime('%Y-%m', vc.creado_en) = ?
      AND vc.resultado = 'valido'
    ORDER BY vc.creado_en
  `).all(mes);

  let sum100 = 0, sum90 = 0, sum50 = 0, sum40 = 0;
  const detalle = filas.map((v) => {
    const p = partesBoleto(v.costo_por_viaje || 0);
    sum100 += p.costo100; sum90 += p.costo90; sum50 += p.costo50; sum40 += p.costo40;
    return {
      id: v.id,
      fecha: v.creado_en,
      ruta: v.ruta,
      matricula: v.matricula,
      nombre: `${v.nombre} ${v.apellidos}`,
      costo100: p.costo100,
      costo90: p.costo90,
      costo50: p.costo50,
      costo40: p.costo40,
    };
  });
  res.json({ mes, totalViajes: detalle.length, sum100, sum90, sum50, sum40, filas: detalle });
});

/** Reportes transportistas / admin — por chofer o unidad */
router.get("/transportistas", authRequired(["admin_transportistas", "recaudacion"]), (req, res) => {
  const { desde, hasta } = rango(req);
  const choferId = req.query.choferId ? Number(req.query.choferId) : null;
  const unidadId = req.query.unidadId ? Number(req.query.unidadId) : null;

  let sql = `
    SELECT vc.id as id_viaje, vc.creado_en, vc.resultado,
           r.nombre as ruta, r.costo_por_viaje,
           a.matricula as id_beneficiario, a.nombre, a.apellidos,
           u.id as id_chofer, u.nombre as chofer,
           un.id as unidad_id, un.codigo as unidad
    FROM viajes_consumidos vc
    JOIN alumnos a ON a.id = vc.alumno_id
    LEFT JOIN rutas r ON r.id = vc.ruta_id
    LEFT JOIN usuarios u ON u.id = vc.operador_usuario_id
    LEFT JOIN camionero_perfil cp ON cp.usuario_id = u.id
    LEFT JOIN unidades un ON un.id = cp.unidad_id
    WHERE date(vc.creado_en) >= date(?) AND date(vc.creado_en) <= date(?)
      AND vc.resultado = 'valido'
  `;
  const params = [desde, hasta];
  if (choferId) { sql += ` AND u.id = ?`; params.push(choferId); }
  if (unidadId) { sql += ` AND un.id = ?`; params.push(unidadId); }
  sql += ` ORDER BY vc.creado_en`;

  const filas = db.prepare(sql).all(...params).map((v) => {
    const p = partesBoleto(v.costo_por_viaje || 0);
    return {
      fecha: v.creado_en,
      idChofer: v.id_chofer,
      chofer: v.chofer,
      unidad: v.unidad,
      unidadId: v.unidad_id,
      idViaje: v.id_viaje,
      ruta: v.ruta,
      costo100: p.costo100,
      costo90: p.costo90,
      idBeneficiario: v.id_beneficiario,
      nombre: `${v.nombre} ${v.apellidos}`,
    };
  });
  const total90 = filas.reduce((s, f) => s + f.costo90, 0);
  res.json({ desde, hasta, totalViajes: filas.length, total90, filas });
});

/** Catálogo choferes y unidades para filtros */
router.get("/filtros-transportistas", authRequired(["admin_transportistas", "recaudacion", "camionero"]), (req, res) => {
  const choferes = db.prepare(`SELECT id, nombre, usuario FROM usuarios WHERE rol = 'camionero' AND activo = 1`).all();
  const unidades = db.prepare(`SELECT id, codigo, nombre FROM unidades WHERE activa = 1`).all();
  res.json({ choferes, unidades });
});

/** Reportes del chofer (sencillo / detallado) */
router.get("/chofer", authRequired(["camionero"]), (req, res) => {
  const { desde, hasta } = rango(req);
  const detallado = req.query.detallado === "1" || req.query.detallado === "true";
  const filas = db.prepare(`
    SELECT vc.id as id_viaje, vc.creado_en, r.nombre as ruta, r.costo_por_viaje,
           a.matricula, a.nombre, a.apellidos,
           un.codigo as unidad
    FROM viajes_consumidos vc
    JOIN alumnos a ON a.id = vc.alumno_id
    LEFT JOIN rutas r ON r.id = vc.ruta_id
    LEFT JOIN camionero_perfil cp ON cp.usuario_id = ?
    LEFT JOIN unidades un ON un.id = cp.unidad_id
    WHERE vc.operador_usuario_id = ?
      AND vc.resultado = 'valido'
      AND date(vc.creado_en) >= date(?) AND date(vc.creado_en) <= date(?)
    ORDER BY vc.creado_en
  `).all(req.user.id, req.user.id, desde, hasta);

  const mapped = filas.map((v) => {
    const p = partesBoleto(v.costo_por_viaje || 0);
    return {
      fecha: v.creado_en,
      idEstudiante: v.matricula,
      nombre: `${v.nombre} ${v.apellidos}`,
      idChofer: req.user.id,
      unidad: v.unidad,
      idViaje: v.id_viaje,
      ruta: v.ruta,
      costo90: p.costo90,
    };
  });
  const total90 = mapped.reduce((s, f) => s + f.costo90, 0);
  if (!detallado) {
    return res.json({ desde, hasta, viajes: mapped.length, total90 });
  }
  res.json({ desde, hasta, viajes: mapped.length, total90, filas: mapped });
});

module.exports = router;
