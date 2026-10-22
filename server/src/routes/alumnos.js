const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { authRequired } = require("../middleware/auth");
const { enviarCorreo } = require("../email");
const { plantillaAprobacion } = require("../emailTemplates");
const { generarPassword } = require("../passwords");

const router = express.Router();

function rutasDe(alumnoId) {
  return db.prepare(`
    SELECT r.nombre FROM alumno_rutas ar JOIN rutas r ON r.id = ar.ruta_id
    WHERE ar.alumno_id = ? ORDER BY ar.orden
  `).all(alumnoId).map((r) => r.nombre);
}

function celda(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function buscarPorMatricula(matricula) {
  return db.prepare(`SELECT * FROM alumnos WHERE matricula = ?`).get(matricula);
}

// GET /api/alumnos — Recaudación
router.get("/", authRequired(["desarrollo_social", "recaudacion"]), (req, res) => {
  const alumnos = db.prepare(`SELECT * FROM alumnos ORDER BY creado_en DESC`).all();
  res.json(alumnos.map((a) => ({
    matricula: a.matricula,
    nombre: `${a.nombre} ${a.apellidos}`,
    telefono: a.telefono,
    correo: a.correo,
    escuela: a.escuela,
    rutas: rutasDe(a.id),
    viajesRestantes: a.viajes_restantes,
    activo: a.activo !== 0,
    qrVersion: a.qr_version != null ? a.qr_version : 1,
    creadoEn: a.creado_en,
  })));
});

// GET /api/alumnos/exportar — CSV
router.get("/exportar", authRequired(["desarrollo_social", "recaudacion"]), (req, res) => {
  const alumnos = db.prepare(`SELECT * FROM alumnos ORDER BY nombre, apellidos`).all();

  const encabezado = ["Matrícula", "Nombre", "Apellidos", "Teléfono", "Correo", "Escuela", "Carrera", "Grado", "Ruta(s)", "Viajes restantes", "Activo", "Alta"];
  const lineas = [encabezado.join(",")];
  for (const a of alumnos) {
    lineas.push([
      celda(a.matricula), celda(a.nombre), celda(a.apellidos), celda(a.telefono), celda(a.correo),
      celda(a.escuela), celda(a.carrera), celda(a.grado), celda(rutasDe(a.id).join(" / ")),
      celda(a.viajes_restantes), celda(a.activo !== 0 ? "Sí" : "No"), celda(a.creado_en),
    ].join(","));
  }

  const csv = "\uFEFF" + lineas.join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="alumnos_${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csv);
});

// POST /api/alumnos — alta manual
router.post("/", authRequired(["desarrollo_social", "recaudacion"]), async (req, res) => {
  const { nombre, apellidos, telefono, correo, escuela, carrera, grado, matricula, rutaIds } = req.body;

  if (!nombre || !apellidos || !telefono || !correo || !escuela || !carrera || !grado || !matricula) {
    return res.status(400).json({ error: "Faltan datos obligatorios." });
  }
  if (!Array.isArray(rutaIds) || rutaIds.length === 0 || rutaIds.length > 3) {
    return res.status(400).json({ error: "Selecciona entre 1 y 3 rutas." });
  }

  const usuarioLogin = matricula.toLowerCase();
  const yaExiste = db.prepare(`SELECT 1 FROM usuarios WHERE usuario = ?`).get(usuarioLogin);
  if (yaExiste) return res.status(409).json({ error: "Ya existe una cuenta con esta matrícula." });

  const passwordPlano = generarPassword();
  const hash = bcrypt.hashSync(passwordPlano, 10);

  const alta = db.transaction(() => {
    const usuarioId = db.prepare(`
      INSERT INTO usuarios (usuario, password_hash, rol, nombre) VALUES (?, ?, 'alumno', ?)
    `).run(usuarioLogin, hash, nombre).lastInsertRowid;

    const alumnoId = db.prepare(`
      INSERT INTO alumnos (usuario_id, nombre, apellidos, telefono, correo, escuela, carrera, grado, matricula, viajes_restantes, viajes_limite_mes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 30)
    `).run(usuarioId, nombre, apellidos, telefono, correo, escuela, carrera, grado, matricula).lastInsertRowid;

    const insertAR = db.prepare(`INSERT INTO alumno_rutas (alumno_id, ruta_id, orden) VALUES (?, ?, ?)`);
    rutaIds.forEach((rutaId, i) => insertAR.run(alumnoId, rutaId, i + 1));

    return alumnoId;
  });
  alta();

  let correoEnviado = true;
  try {
    const { subject, html } = plantillaAprobacion({ nombre, usuario: usuarioLogin, password: passwordPlano });
    await enviarCorreo({ to: correo, subject, html });
  } catch (err) {
    console.error("No se pudo enviar el correo de alta manual:", err.message);
    correoEnviado = false;
  }

  res.status(201).json({ usuario: usuarioLogin, password: passwordPlano, correo, correoEnviado });
});

// POST /api/alumnos/:matricula/revocar-qr
// Invalida el QR actual (tarjeta perdida/robada). El alumno sigue activo:
// al abrir su app obtiene un QR nuevo con la versión incrementada.
router.post("/:matricula/revocar-qr", authRequired(["desarrollo_social", "recaudacion"]), (req, res) => {
  const alumno = buscarPorMatricula(req.params.matricula);
  if (!alumno) return res.status(404).json({ error: "Alumno no encontrado." });
  if (alumno.activo === 0) {
    return res.status(400).json({ error: "El alumno ya está dado de baja; su QR no es válido." });
  }

  const nuevaVersion = (alumno.qr_version != null ? alumno.qr_version : 1) + 1;
  db.prepare(`UPDATE alumnos SET qr_version = ? WHERE id = ?`).run(nuevaVersion, alumno.id);

  res.json({
    ok: true,
    matricula: alumno.matricula,
    qrVersion: nuevaVersion,
    mensaje: "QR anterior invalidado. El estudiante debe abrir su app para obtener un código nuevo.",
  });
});

// POST /api/alumnos/:matricula/baja
// Da de baja del programa: desactiva cuenta + revoca QR. No borra el historial.
router.post("/:matricula/baja", authRequired(["desarrollo_social", "recaudacion"]), (req, res) => {
  const alumno = buscarPorMatricula(req.params.matricula);
  if (!alumno) return res.status(404).json({ error: "Alumno no encontrado." });
  if (alumno.activo === 0) {
    return res.status(400).json({ error: "Este alumno ya está dado de baja." });
  }

  const nuevaVersion = (alumno.qr_version != null ? alumno.qr_version : 1) + 1;
  const tx = db.transaction(() => {
    db.prepare(`UPDATE alumnos SET activo = 0, qr_version = ? WHERE id = ?`).run(nuevaVersion, alumno.id);
    // También desactiva el login
    db.prepare(`UPDATE usuarios SET activo = 0 WHERE id = ?`).run(alumno.usuario_id);
  });
  tx();

  res.json({
    ok: true,
    matricula: alumno.matricula,
    mensaje: "Alumno dado de baja. Su QR y acceso quedaron invalidados.",
  });
});

// POST /api/alumnos/:matricula/reactivar
router.post("/:matricula/reactivar", authRequired(["desarrollo_social", "recaudacion"]), (req, res) => {
  const alumno = buscarPorMatricula(req.params.matricula);
  if (!alumno) return res.status(404).json({ error: "Alumno no encontrado." });
  if (alumno.activo !== 0) {
    return res.status(400).json({ error: "Este alumno ya está activo." });
  }

  const nuevaVersion = (alumno.qr_version != null ? alumno.qr_version : 1) + 1;
  const tx = db.transaction(() => {
    db.prepare(`UPDATE alumnos SET activo = 1, qr_version = ? WHERE id = ?`).run(nuevaVersion, alumno.id);
    db.prepare(`UPDATE usuarios SET activo = 1 WHERE id = ?`).run(alumno.usuario_id);
  });
  tx();

  res.json({
    ok: true,
    matricula: alumno.matricula,
    qrVersion: nuevaVersion,
    mensaje: "Alumno reactivado. Debe abrir su app para obtener un QR nuevo.",
  });
});


/** Export estilo Desarrollo Social: beneficiarios con rutas y costos */
router.get("/exportar-beneficiarios", authRequired(["desarrollo_social", "recaudacion", "contabilidad"]), (req, res) => {
  const alumnos = db.prepare(`
    SELECT a.*, u.usuario
    FROM alumnos a
    JOIN usuarios u ON u.id = a.usuario_id
    ORDER BY a.apellidos, a.nombre
  `).all();

  const rutasStmt = db.prepare(`
    SELECT r.nombre, r.costo_por_viaje, ar.orden
    FROM alumno_rutas ar
    JOIN rutas r ON r.id = ar.ruta_id
    WHERE ar.alumno_id = ?
    ORDER BY ar.orden
  `);

  function splitNombre(nombreCompleto) {
    const parts = String(nombreCompleto || "").trim().split(/\s+/);
    if (parts.length <= 1) return { apPat: parts[0] || "", apMat: "", nom: "" };
    if (parts.length === 2) return { apPat: parts[0], apMat: "", nom: parts[1] };
    return { apPat: parts[0], apMat: parts[1], nom: parts.slice(2).join(" ") };
  }

  const headers = [
    "FOLIO", "APELLIDO PATERNO BENEFICIARIO", "APELLIDO MATERNO BENEFICIARIO", "NOMBRE (S)",
    "NOMBRE COMPLETO BENEFICIARIO", "GÉNERO", "NIVEL", "NOMBRE DE LA INSTITUCIÓN EDUCATIVA",
    "UBICACIÓN DE LA INSTITUCIÓN EDUCATIVA", "RUTA 1 DE:", "RUTA 1 HACIA:", "RUTA 2 DE:", "RUTA 2 HACIA:",
    "COSTO DEL BOLETO RUTA 1", "COSTO DEL BOLETO RUTA 2", "TELÉFONO", "CORREO", "MATRÍCULA",
    "VIAJES RESTANTES", "ACTIVO",
  ];

  function esc(v) {
    const s = v == null ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  function parseRuta(nombre) {
    if (!nombre) return { de: "", hacia: "" };
    const parts = String(nombre).split(/\s*→\s*|\s*->\s*/);
    if (parts.length >= 2) return { de: parts[0].trim(), hacia: parts.slice(1).join(" → ").trim() };
    return { de: nombre, hacia: "" };
  }

  const lines = [headers.join(",")];
  alumnos.forEach((al, i) => {
    const rts = rutasStmt.all(al.id);
    const r1 = parseRuta(rts[0]?.nombre);
    const r2 = parseRuta(rts[1]?.nombre);
    const sp = splitNombre(`${al.apellidos} ${al.nombre}`.trim());
    // Prefer split apellidos if stored as "Paterno Materno"
    const apParts = String(al.apellidos || "").trim().split(/\s+/);
    const apPat = apParts[0] || "";
    const apMat = apParts.slice(1).join(" ") || "";
    lines.push([
      i + 1, apPat, apMat, al.nombre,
      `${al.nombre} ${al.apellidos}`.trim(), "", al.grado, al.escuela, "",
      r1.de, r1.hacia, r2.de, r2.hacia,
      rts[0]?.costo_por_viaje ?? "", rts[1]?.costo_por_viaje ?? "",
      al.telefono, al.correo, al.matricula, al.viajes_restantes, al.activo ? "Sí" : "No",
    ].map(esc).join(","));
  });

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="registro_beneficiarios.csv"');
  res.send("\uFEFF" + lines.join("\n"));
});


/** PATCH /api/alumnos/:id — edición de datos (Desarrollo Social) */
router.patch("/:id", authRequired(["desarrollo_social"]), (req, res) => {
  const id = Number(req.params.id);
  const a = db.prepare(`SELECT * FROM alumnos WHERE id = ?`).get(id);
  if (!a) return res.status(404).json({ error: "Alumno no encontrado." });
  const b = req.body || {};
  const nombre = b.nombre != null ? String(b.nombre).trim() : a.nombre;
  const apellidos = b.apellidos != null ? String(b.apellidos).trim() : a.apellidos;
  const telefono = b.telefono != null ? String(b.telefono).trim() : a.telefono;
  const correo = b.correo != null ? String(b.correo).trim() : a.correo;
  const escuela = b.escuela != null ? String(b.escuela).trim() : a.escuela;
  const carrera = b.carrera != null ? String(b.carrera).trim() : a.carrera;
  const grado = b.grado != null ? String(b.grado).trim() : a.grado;
  const foto_url = b.fotoUrl != null ? b.fotoUrl : a.foto_url;
  const activo = b.activo != null ? (b.activo ? 1 : 0) : a.activo;
  db.prepare(`
    UPDATE alumnos SET nombre=?, apellidos=?, telefono=?, correo=?, escuela=?, carrera=?, grado=?, foto_url=?, activo=?
    WHERE id=?
  `).run(nombre, apellidos, telefono, correo, escuela, carrera, grado, foto_url, activo, id);
  res.json({ ok: true, id });
});

/** Credencial: marcar impresa o reposición */
router.post("/:id/credencial", authRequired(["desarrollo_social", "alumno"]), (req, res) => {
  const id = Number(req.params.id);
  const a = db.prepare(`SELECT * FROM alumnos WHERE id = ?`).get(id);
  if (!a) return res.status(404).json({ error: "No encontrado." });
  if (req.user.rol === "alumno" && req.user.id !== a.usuario_id) {
    return res.status(403).json({ error: "No autorizado." });
  }
  let row = db.prepare(`SELECT * FROM alumno_credencial WHERE alumno_id = ?`).get(id);
  if (!row) {
    db.prepare(`INSERT INTO alumno_credencial (alumno_id, impresa, impresa_en) VALUES (?, 1, CURRENT_TIMESTAMP)`).run(id);
    return res.json({ ok: true, primera: true, reposiciones: 0 });
  }
  if (req.user.rol === "alumno" && row.impresa) {
    return res.status(400).json({ error: "Ya imprimiste tu credencial. Solicita reposición en Desarrollo Social." });
  }
  if (req.user.rol === "desarrollo_social") {
    db.prepare(`UPDATE alumno_credencial SET reposiciones = reposiciones + 1, impresa_en = CURRENT_TIMESTAMP WHERE alumno_id = ?`).run(id);
    row = db.prepare(`SELECT * FROM alumno_credencial WHERE alumno_id = ?`).get(id);
    return res.json({ ok: true, reposicion: true, reposiciones: row.reposiciones });
  }
  db.prepare(`UPDATE alumno_credencial SET impresa = 1, impresa_en = CURRENT_TIMESTAMP WHERE alumno_id = ?`).run(id);
  res.json({ ok: true, primera: true });
});

router.get("/:id/credencial", authRequired(["desarrollo_social", "alumno", "ventanilla"]), (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare(`SELECT * FROM alumno_credencial WHERE alumno_id = ?`).get(id);
  res.json(row || { alumno_id: id, impresa: 0, reposiciones: 0 });
});

module.exports = router;


