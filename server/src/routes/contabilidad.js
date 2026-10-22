const express = require("express");
const db = require("../db");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

// Recaudación también puede ver estos resúmenes si hace falta
const roles = ["contabilidad", "recaudacion"];

function rango(req) {
  const hoy = new Date().toISOString().slice(0, 10);
  const primerDiaMes = `${hoy.slice(0, 7)}-01`;
  return {
    desde: req.query.desde || primerDiaMes,
    hasta: req.query.hasta || hoy,
  };
}

function celda(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// GET /api/contabilidad/resumen?desde=&hasta=
router.get("/resumen", authRequired(roles), (req, res) => {
  const { desde, hasta } = rango(req);

  const recargas = db.prepare(`
    SELECT COUNT(*) as n, COALESCE(SUM(viajes),0) as viajes, COALESCE(SUM(monto),0) as monto
    FROM recargas
    WHERE date(creado_en) BETWEEN date(?) AND date(?)
  `).get(desde, hasta);

  const viajes = db.prepare(`
    SELECT
      SUM(CASE WHEN resultado = 'valido' THEN 1 ELSE 0 END) as validos,
      SUM(CASE WHEN resultado != 'valido' THEN 1 ELSE 0 END) as rechazados,
      COUNT(*) as total
    FROM viajes_consumidos
    WHERE date(creado_en) BETWEEN date(?) AND date(?)
  `).get(desde, hasta);

  const porRuta = db.prepare(`
    SELECT r.nombre as ruta,
      SUM(CASE WHEN vc.resultado = 'valido' THEN 1 ELSE 0 END) as validos,
      COUNT(*) as total
    FROM viajes_consumidos vc
    JOIN rutas r ON r.id = vc.ruta_id
    WHERE date(vc.creado_en) BETWEEN date(?) AND date(?)
    GROUP BY r.id
    ORDER BY validos DESC
  `).all(desde, hasta);

  res.json({
    desde,
    hasta,
    recargas: {
      operaciones: recargas.n,
      viajesAcreditados: recargas.viajes,
      montoTotal: recargas.monto,
    },
    validaciones: {
      validas: viajes.validos || 0,
      rechazadas: viajes.rechazados || 0,
      total: viajes.total || 0,
    },
    porRuta,
  });
});

// GET /api/contabilidad/recargas.csv?desde=&hasta=
router.get("/recargas.csv", authRequired(roles), (req, res) => {
  const { desde, hasta } = rango(req);
  const filas = db.prepare(`
    SELECT rec.creado_en, a.matricula, a.nombre, a.apellidos, rec.viajes, rec.monto, u.usuario as atendido_por,
           (SELECT r.nombre FROM alumno_rutas ar JOIN rutas r ON r.id = ar.ruta_id WHERE ar.alumno_id = a.id ORDER BY ar.orden LIMIT 1) as ruta
    FROM recargas rec
    JOIN alumnos a ON a.id = rec.alumno_id
    JOIN usuarios u ON u.id = rec.staff_usuario_id
    WHERE date(rec.creado_en) BETWEEN date(?) AND date(?)
    ORDER BY rec.creado_en ASC
  `).all(desde, hasta);

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

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="contabilidad_recargas_${desde}_a_${hasta}.csv"`);
  res.send("\uFEFF" + lineas.join("\n"));
});

// GET /api/contabilidad/viajes.csv?desde=&hasta=
router.get("/viajes.csv", authRequired(roles), (req, res) => {
  const { desde, hasta } = rango(req);
  const filas = db.prepare(`
    SELECT vc.creado_en, a.matricula, a.nombre, a.apellidos, r.nombre as ruta, r.costo_por_viaje,
           vc.resultado, u.usuario as operador
    FROM viajes_consumidos vc
    JOIN alumnos a ON a.id = vc.alumno_id
    JOIN rutas r ON r.id = vc.ruta_id
    JOIN usuarios u ON u.id = vc.operador_usuario_id
    WHERE date(vc.creado_en) BETWEEN date(?) AND date(?)
    ORDER BY vc.creado_en ASC
  `).all(desde, hasta);

  const encabezado = ["Fecha", "Matrícula", "Nombre", "Ruta", "Resultado", "Costo ruta", "Operador"];
  const lineas = [encabezado.join(",")];
  for (const f of filas) {
    lineas.push([
      celda(f.creado_en), celda(f.matricula), celda(`${f.nombre} ${f.apellidos}`),
      celda(f.ruta), celda(f.resultado), celda(f.costo_por_viaje), celda(f.operador),
    ].join(","));
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="contabilidad_viajes_${desde}_a_${hasta}.csv"`);
  res.send("\uFEFF" + lineas.join("\n"));
});

module.exports = router;
