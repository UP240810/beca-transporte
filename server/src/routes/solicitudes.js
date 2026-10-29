const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { authRequired } = require("../middleware/auth");
const { enviarCorreo } = require("../email");
const { plantillaAprobacion, plantillaCorreccion, plantillaSolicitudRecibida } = require("../emailTemplates");
const { generarPassword } = require("../passwords");
const { solicitudLimiter } = require("../middleware/rateLimit");
const { validarSolicitudBody } = require("../validarSolicitud");

const router = express.Router();

function registrarEvento(solicitudId, req, accion, comentario) {
  const user = req && req.user ? req.user : null;
  const staffUsuario = user ? (user.usuario || user.nombre || null) : null;
  const staffId = user && user.id != null ? user.id : null;
  db.prepare(`
    INSERT INTO solicitud_eventos (solicitud_id, staff_usuario_id, staff_usuario, accion, comentario)
    VALUES (?, ?, ?, ?, ?)
  `).run(solicitudId, staffId, staffUsuario, accion, comentario || null);
}

function eventosDe(solicitudId) {
  return db.prepare(`
    SELECT id, staff_usuario, accion, comentario, creado_en
    FROM solicitud_eventos
    WHERE solicitud_id = ?
    ORDER BY creado_en ASC, id ASC
  `).all(solicitudId).map((e) => ({
    id: e.id,
    usuario: e.staff_usuario || "sistema",
    accion: e.accion,
    comentario: e.comentario,
    fecha: e.creado_en,
  }));
}


function generarFolio(matricula) {
  const sufijo = (matricula || "0000").replace(/\D/g, "").slice(-4).padStart(4, "0");
  let folio = `SOL-${sufijo}-2026`;
  const existe = db.prepare(`SELECT 1 FROM solicitudes WHERE folio = ?`).get(folio);
  if (existe) {
    folio = `SOL-${sufijo}${Math.floor(Math.random() * 9)}-2026`;
  }
  return folio;
}

function trayectosDe(solicitudId) {
  return db.prepare(`
    SELECT descripcion FROM solicitud_trayectos
    WHERE solicitud_id = ? ORDER BY orden
  `).all(solicitudId).map((t) => t.descripcion);
}

/**
 * Resuelve las rutas que Desarrollo Social asigna al aprobar.
 * Cada ítem puede ser:
 *   { rutaId: number }  — ruta existente del catálogo
 *   { nombre, costo_por_viaje?, descuento_pct? }  — crea una ruta nueva
 * Devuelve array de { id, orden }.
 */
function resolverRutasAsignadas(rutasAsignadas) {
  // 1 ruta normal; máximo 2 si hay trasbordo
  if (!Array.isArray(rutasAsignadas) || rutasAsignadas.length === 0 || rutasAsignadas.length > 2) {
    throw new Error("Asigna 1 o 2 rutas oficiales (máximo 2 si hay trasbordo).");
  }

  const ids = [];
  const insertRuta = db.prepare(
    `INSERT INTO rutas (nombre, codigo, descuento_pct, costo_por_viaje) VALUES (?, ?, ?, ?)`
  );

  for (let i = 0; i < rutasAsignadas.length; i++) {
    const item = rutasAsignadas[i];
    if (item.rutaId) {
      const ruta = db.prepare(`SELECT id, costo_por_viaje FROM rutas WHERE id = ? AND activa = 1`).get(Number(item.rutaId));
      if (!ruta) throw new Error(`La ruta #${item.rutaId} no existe o no está activa.`);
      // Precio se fija al aprobar (puede diferir del catálogo previo)
      const costo = Number(item.costo_por_viaje);
      if (Number.isFinite(costo) && costo > 0 && costo !== Number(ruta.costo_por_viaje)) {
        db.prepare(`UPDATE rutas SET costo_por_viaje = ? WHERE id = ?`).run(Math.round(costo), ruta.id);
      }
      if (item.descuento_pct != null && Number(item.descuento_pct) >= 0) {
        db.prepare(`UPDATE rutas SET descuento_pct = ? WHERE id = ?`).run(Math.round(Number(item.descuento_pct)), ruta.id);
      }
      ids.push({ id: ruta.id, orden: i + 1, costo: Number.isFinite(costo) && costo > 0 ? Math.round(costo) : ruta.costo_por_viaje });
    } else if (item.nombre && String(item.nombre).trim()) {
      const nombre = String(item.nombre).trim();
      const codigo = item.codigo ? String(item.codigo).trim().toUpperCase().slice(0, 20) : null;
      // Reutiliza por nombre o por código
      const existente = db.prepare(`SELECT id FROM rutas WHERE nombre = ?`).get(nombre)
        || (codigo ? db.prepare(`SELECT id FROM rutas WHERE codigo = ?`).get(codigo) : null);
      if (existente) {
        ids.push({ id: existente.id, orden: i + 1 });
      } else {
        const costo = Number(item.costo_por_viaje) > 0 ? Number(item.costo_por_viaje) : 15;
        const descuento = Number(item.descuento_pct) >= 0 ? Number(item.descuento_pct) : 50;
        const nuevaId = insertRuta.run(nombre, codigo, descuento, costo).lastInsertRowid;
        ids.push({ id: nuevaId, orden: i + 1 });
      }
    } else {
      throw new Error(`Ruta ${i + 1}: elige una del catálogo o escribe un nombre para darla de alta.`);
    }
  }
  return ids;
}

const TIPOS_DOC = ["acta_nacimiento", "curp", "identificacion", "constancia_estudios", "comprobante_domicilio"];
const MAX_PDF_B64 = 2_000_000; // ~1.5 MB por archivo

function documentosDe(solicitudId) {
  return db.prepare(`
    SELECT id, tipo, nombre_archivo, mime, length(data_base64) as tamanio
    FROM solicitud_documentos WHERE solicitud_id = ? ORDER BY id
  `).all(solicitudId);
}

// POST /api/solicitudes — pública
// Body: datos personales + trayectos + estudioSocioeconomico + documentos[]
router.post("/", solicitudLimiter, async (req, res) => {
  const resultado = validarSolicitudBody(req.body);
  if (!resultado.ok) {
    return res.status(400).json({ error: resultado.error, errores: resultado.errores });
  }
  const {
    nombre, apellidos, telefono, correo, escuela, carrera, grado, matricula,
    trayectos, fotoBase64, direccion, coloniaLocalidad, celular,
    estudioSocioeconomico, documentos,
  } = resultado.limpio;

  const folio = generarFolio(matricula);
  const estudioJson = JSON.stringify(estudioSocioeconomico);

  const insertar = db.transaction(() => {
    const solicitudId = db.prepare(`
      INSERT INTO solicitudes (
        folio, nombre, apellidos, telefono, correo, escuela, carrera, grado, matricula,
        estado, foto_base64, direccion, colonia_localidad, celular, estudio_socioeconomico
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', ?, ?, ?, ?, ?)
    `).run(
      folio, nombre, apellidos, telefono, correo, escuela, carrera, grado, matricula,
      fotoBase64 || null, String(direccion).trim(),
      coloniaLocalidad ? String(coloniaLocalidad).trim() : null,
      celular ? String(celular).replace(/\s/g, "") : null,
      estudioJson
    ).lastInsertRowid;

    const insertTrayecto = db.prepare(
      `INSERT INTO solicitud_trayectos (solicitud_id, orden, descripcion) VALUES (?, ?, ?)`
    );
    trayectos.forEach((desc, i) => insertTrayecto.run(solicitudId, i + 1, String(desc).trim()));

    const insertDoc = db.prepare(`
      INSERT INTO solicitud_documentos (solicitud_id, tipo, nombre_archivo, mime, data_base64)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const d of documentos) {
      insertDoc.run(
        solicitudId,
        d.tipo,
        d.nombreArchivo || `${d.tipo}.pdf`,
        "application/pdf",
        d.dataBase64
      );
    }

    registrarEvento(solicitudId, { user: null }, "creada", "Solicitud enviada por el aspirante");
    return solicitudId;
  });

  insertar();

  try {
    const { subject, html } = plantillaSolicitudRecibida({ nombre, folio });
    await enviarCorreo({ to: correo, subject, html });
  } catch (err) {
    console.error("No se pudo enviar el correo de confirmación de solicitud:", err.message);
  }

  res.status(201).json({ folio });
});

// GET /api/solicitudes?estado=pendiente — protegido, Recaudación
router.get("/", authRequired(["desarrollo_social"]), (req, res) => {
  const estado = req.query.estado || "pendiente";
  const solicitudes = db.prepare(`SELECT * FROM solicitudes WHERE estado = ? ORDER BY creado_en DESC`).all(estado);

  const conTrayectos = solicitudes.map((s) => ({
    ...s,
    trayectos: trayectosDe(s.id),
    // Compatibilidad: si hay datos viejos en solicitud_rutas, también los expone
    rutas: db.prepare(`
      SELECT r.nombre FROM solicitud_rutas sr JOIN rutas r ON r.id = sr.ruta_id
      WHERE sr.solicitud_id = ? ORDER BY sr.orden
    `).all(s.id).map((r) => r.nombre),
  }));

  res.json(conTrayectos);
});

// GET /api/solicitudes/:folio — protegido, Recaudación
router.get("/:folio", authRequired(["desarrollo_social"]), (req, res) => {
  const solicitud = db.prepare(`SELECT * FROM solicitudes WHERE folio = ?`).get(req.params.folio);
  if (!solicitud) return res.status(404).json({ error: "Solicitud no encontrada." });

  const trayectos = trayectosDe(solicitud.id);
  const rutas = db.prepare(`
    SELECT r.nombre FROM solicitud_rutas sr JOIN rutas r ON r.id = sr.ruta_id
    WHERE sr.solicitud_id = ? ORDER BY sr.orden
  `).all(solicitud.id).map((r) => r.nombre);

  let estudio = null;
  try {
    estudio = solicitud.estudio_socioeconomico ? JSON.parse(solicitud.estudio_socioeconomico) : null;
  } catch { estudio = null; }
  res.json({
    ...solicitud,
    trayectos,
    rutas,
    eventos: eventosDe(solicitud.id),
    estudioSocioeconomico: estudio,
    documentos: documentosDe(solicitud.id),
  });
});

// POST /api/solicitudes/:folio/aprobar
// Body: { rutasAsignadas: [ { rutaId } | { nombre, costo_por_viaje?, descuento_pct? } ] }
router.post("/:folio/aprobar", authRequired(["desarrollo_social"]), async (req, res) => {
  const solicitud = db.prepare(`SELECT * FROM solicitudes WHERE folio = ?`).get(req.params.folio);
  if (!solicitud) return res.status(404).json({ error: "Solicitud no encontrada." });
  if (solicitud.estado === "aprobada") return res.status(400).json({ error: "Esta solicitud ya fue aprobada." });

  const usuarioLogin = solicitud.matricula.toLowerCase();
  const yaExiste = db.prepare(`SELECT 1 FROM usuarios WHERE usuario = ?`).get(usuarioLogin);
  if (yaExiste) return res.status(409).json({ error: "Ya existe una cuenta con esta matrícula." });

  let rutasResueltas;
  try {
    const rawRutas = req.body.rutasAsignadas;
    if (Array.isArray(rawRutas)) {
      for (let i = 0; i < rawRutas.length; i++) {
        const item = rawRutas[i] || {};
        const cBody = Number(item.costo_por_viaje);
        if (item.rutaId) {
          if (Number.isFinite(cBody) && cBody > 0) continue;
          const ruta = db.prepare(`SELECT costo_por_viaje FROM rutas WHERE id = ?`).get(Number(item.rutaId));
          if (ruta && Number(ruta.costo_por_viaje) > 0) continue;
          return res.status(400).json({ error: `Indica el precio por viaje de la ruta ${i + 1} (mayor a 0).` });
        }
        if (!Number.isFinite(cBody) || cBody <= 0) {
          return res.status(400).json({ error: `Indica el precio por viaje de la ruta ${i + 1} (mayor a 0).` });
        }
      }
    }
    rutasResueltas = resolverRutasAsignadas(rawRutas);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const passwordPlano = generarPassword();
  const hash = bcrypt.hashSync(passwordPlano, 10);

  const aprobar = db.transaction(() => {
    const usuarioId = db.prepare(`
      INSERT INTO usuarios (usuario, password_hash, rol, nombre) VALUES (?, ?, 'alumno', ?)
    `).run(usuarioLogin, hash, solicitud.nombre).lastInsertRowid;

    const alumnoId = db.prepare(`
      INSERT INTO alumnos (usuario_id, nombre, apellidos, telefono, correo, escuela, carrera, grado, matricula, viajes_restantes, viajes_limite_mes, foto_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 30, ?)
    `).run(
      usuarioId, solicitud.nombre, solicitud.apellidos, solicitud.telefono, solicitud.correo,
      solicitud.escuela, solicitud.carrera, solicitud.grado, solicitud.matricula, solicitud.foto_base64 || null
    ).lastInsertRowid;

    const insertAR = db.prepare(`INSERT INTO alumno_rutas (alumno_id, ruta_id, orden) VALUES (?, ?, ?)`);
    const insertSR = db.prepare(`INSERT INTO solicitud_rutas (solicitud_id, ruta_id, orden) VALUES (?, ?, ?)`);
    for (const r of rutasResueltas) {
      insertAR.run(alumnoId, r.id, r.orden);
      insertSR.run(solicitud.id, r.id, r.orden);
    }

    db.prepare(`
      UPDATE solicitudes SET estado = 'aprobada', alumno_id = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?
    `).run(alumnoId, solicitud.id);

    return alumnoId;
  });

  aprobar();
  registrarEvento(solicitud.id, req, "aprobada", `Cuenta creada · usuario ${usuarioLogin}`);

  let correoEnviado = true;
  try {
    const { subject, html } = plantillaAprobacion({ nombre: solicitud.nombre, usuario: usuarioLogin, password: passwordPlano });
    await enviarCorreo({ to: solicitud.correo, subject, html });
  } catch (err) {
    console.error("No se pudo enviar el correo de aprobación:", err.message);
    correoEnviado = false;
  }

  res.json({ usuario: usuarioLogin, password: passwordPlano, correo: solicitud.correo, correoEnviado });
});

// POST /api/solicitudes/:folio/corregir  { motivo }
router.post("/:folio/corregir", authRequired(["desarrollo_social"]), async (req, res) => {
  const { motivo } = req.body;
  if (!motivo || !motivo.trim()) return res.status(400).json({ error: "Escribe el motivo de la corrección." });

  const solicitud = db.prepare(`SELECT * FROM solicitudes WHERE folio = ?`).get(req.params.folio);
  if (!solicitud) return res.status(404).json({ error: "Solicitud no encontrada." });

  db.prepare(`
    UPDATE solicitudes SET estado = 'corregir', motivo_correccion = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?
  `).run(motivo.trim(), solicitud.id);
  registrarEvento(solicitud.id, req, "corregir", motivo.trim());

  let correoEnviado = true;
  try {
    const { subject, html } = plantillaCorreccion({ nombre: solicitud.nombre, motivo: motivo.trim(), folio: solicitud.folio });
    await enviarCorreo({ to: solicitud.correo, subject, html });
  } catch (err) {
    console.error("No se pudo enviar el correo de corrección:", err.message);
    correoEnviado = false;
  }

  res.json({ ok: true, correoEnviado });
});


// POST /api/solicitudes/:folio/rechazar  { motivo }
router.post("/:folio/rechazar", authRequired(["desarrollo_social"]), async (req, res) => {
  const { motivo } = req.body || {};
  if (!motivo || !String(motivo).trim()) {
    return res.status(400).json({ error: "Escribe el motivo del rechazo." });
  }

  const solicitud = db.prepare(`SELECT * FROM solicitudes WHERE folio = ?`).get(req.params.folio);
  if (!solicitud) return res.status(404).json({ error: "Solicitud no encontrada." });
  if (solicitud.estado === "aprobada") {
    return res.status(400).json({ error: "No se puede rechazar una solicitud ya aprobada." });
  }
  if (solicitud.estado === "rechazada") {
    return res.status(400).json({ error: "Esta solicitud ya fue rechazada." });
  }

  db.prepare(`
    UPDATE solicitudes SET estado = 'rechazada', motivo_correccion = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?
  `).run(String(motivo).trim(), solicitud.id);
  registrarEvento(solicitud.id, req, "rechazada", String(motivo).trim());

  res.json({ ok: true });
});


// GET /api/solicitudes/:folio/documentos/:id — descarga PDF (Recaudación)
router.get("/:folio/documentos/:id", authRequired(["desarrollo_social"]), (req, res) => {
  const solicitud = db.prepare(`SELECT id FROM solicitudes WHERE folio = ?`).get(req.params.folio);
  if (!solicitud) return res.status(404).json({ error: "Solicitud no encontrada." });
  const doc = db.prepare(`
    SELECT * FROM solicitud_documentos WHERE id = ? AND solicitud_id = ?
  `).get(Number(req.params.id), solicitud.id);
  if (!doc) return res.status(404).json({ error: "Documento no encontrado." });
  res.json({
    tipo: doc.tipo,
    nombreArchivo: doc.nombre_archivo,
    mime: doc.mime,
    dataBase64: doc.data_base64,
  });
});

module.exports = router;
