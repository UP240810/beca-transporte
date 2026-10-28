const TIPOS_DOC = ["acta_nacimiento", "curp", "identificacion", "constancia_estudios", "comprobante_domicilio"];
const LABELS_DOC = {
  acta_nacimiento: "Acta de nacimiento",
  curp: "CURP",
  identificacion: "Credencial (papá o solicitante)",
  constancia_estudios: "Constancia de estudios",
  comprobante_domicilio: "Comprobante de domicilio",
};
const MAX_PDF_B64 = 2_000_000;
const PARENTESCO_OK = new Set(["1", "2", "3", "4", "5", "6", "7"]);
const OCUPACION_OK = new Set(["1", "2", "3", "4", "5", "6"]);
const EDUCACION_OK = new Set(["1", "2", "3", "4", "5", "6"]);
const MATERIAL_OK = new Set(["1", "2", "3", "4", "5", "6", "7", "8"]);
const VIVIENDA_OK = new Set(["propia", "prestada", "rentada"]);

function soloDigitos(s) {
  return String(s || "").replace(/\D/g, "");
}

function esPdfBase64(dataBase64) {
  if (!dataBase64 || typeof dataBase64 !== "string") return false;
  // data:application/pdf;base64,JVBERi0...  JVBERi0 = %PDF
  const m = dataBase64.match(/^data:([^;]+);base64,(.+)$/s);
  if (!m) return false;
  const mime = m[1].toLowerCase();
  if (!mime.includes("pdf")) return false;
  const b64 = m[2].replace(/\s/g, "");
  if (b64.length < 20) return false;
  try {
    const head = Buffer.from(b64.slice(0, 48), "base64").toString("utf8");
    return head.startsWith("%PDF");
  } catch {
    return false;
  }
}

/**
 * Valida el cuerpo de una solicitud para que los datos sean exportables a Excel
 * y los PDF sean reales. Devuelve { ok: true, limpio } o { ok: false, error }.
 */
function validarSolicitudBody(body) {
  const errores = [];
  const {
    nombre, apellidos, telefono, correo, escuela, carrera, grado, matricula,
    trayectos, fotoBase64, direccion, coloniaLocalidad, celular,
    estudioSocioeconomico, documentos,
  } = body || {};

  // —— Solicitante ——
  if (!nombre || !String(nombre).trim()) errores.push("Nombre es obligatorio.");
  if (!apellidos || !String(apellidos).trim()) errores.push("Apellidos son obligatorios.");
  if (!direccion || !String(direccion).trim()) errores.push("Dirección es obligatoria.");
  if (!coloniaLocalidad || !String(coloniaLocalidad).trim()) errores.push("Colonia / localidad es obligatoria.");
  if (!escuela || !String(escuela).trim()) errores.push("Institución educativa es obligatoria.");
  if (!carrera || !String(carrera).trim()) errores.push("Carrera / especialidad es obligatoria.");
  if (!grado || !String(grado).trim()) errores.push("Grado es obligatorio.");
  if (!matricula || !String(matricula).trim()) errores.push("Matrícula es obligatoria.");

  const tel = soloDigitos(telefono);
  if (tel.length !== 10) errores.push("Teléfono debe tener exactamente 10 dígitos.");
  const cel = soloDigitos(celular);
  if (cel.length !== 10) errores.push("Celular debe tener exactamente 10 dígitos.");

  const correoLimpio = String(correo || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio)) {
    errores.push("Correo electrónico inválido.");
  }

  if (String(nombre || "").trim().length > 80) errores.push("Nombre demasiado largo.");
  if (String(apellidos || "").trim().length > 80) errores.push("Apellidos demasiado largos.");
  if (String(matricula || "").trim().length > 40) errores.push("Matrícula demasiado larga.");

  // —— Trayectos ——
  if (!Array.isArray(trayectos) || trayectos.length < 1 || trayectos.length > 2) {
    errores.push("Debes indicar 1 o 2 trayectos.");
  } else {
    trayectos.forEach((t, i) => {
      if (!t || !String(t).trim() || String(t).trim().length < 5) {
        errores.push(`Trayecto ${i + 1} incompleto (origen y destino).`);
      }
    });
  }

  if (!fotoBase64 || !String(fotoBase64).startsWith("data:image/")) {
    errores.push("La foto del estudiante es obligatoria.");
  }
  if (fotoBase64 && String(fotoBase64).length > 2_000_000) {
    errores.push("La foto es demasiado pesada.");
  }

  // —— Estudio socioeconómico ——
  const est = estudioSocioeconomico;
  if (!est || typeof est !== "object") {
    errores.push("Completa el estudio socioeconómico.");
  } else {
    const viv = est.vivienda || {};
    if (!VIVIENDA_OK.has(viv.tipo)) errores.push("Indica si la vivienda es propia, prestada o rentada.");
    if (viv.techoLamina !== "si" && viv.techoLamina !== "no") {
      errores.push("Indica si el techo es de lámina (sí/no).");
    }
    if (!MATERIAL_OK.has(String(viv.paredes || ""))) errores.push("Selecciona el material de las paredes.");
    if (!MATERIAL_OK.has(String(viv.piso || ""))) errores.push("Selecciona el material del piso.");

    const fam = Array.isArray(est.familiares) ? est.familiares : [];
    // Al menos el solicitante suele ir en datos principales; familiares opcionales pero si hay fila debe estar completa
    fam.forEach((f, i) => {
      if (!f || !String(f.nombre || "").trim()) return; // fila vacía se ignora
      if (!PARENTESCO_OK.has(String(f.parentesco || ""))) {
        errores.push(`Familiar ${i + 1}: parentesco inválido (código 1–7).`);
      }
      if (!OCUPACION_OK.has(String(f.ocupacion || ""))) {
        errores.push(`Familiar ${i + 1}: ocupación inválida (código 1–6).`);
      }
      if (f.educacion && !EDUCACION_OK.has(String(f.educacion))) {
        errores.push(`Familiar ${i + 1}: educación inválida (código 1–6).`);
      }
      if (f.costoDiario !== undefined && f.costoDiario !== "" && Number.isNaN(Number(f.costoDiario))) {
        errores.push(`Familiar ${i + 1}: costo diario debe ser numérico.`);
      }
    });

    const ing = est.ingresos || {};
    const egr = est.egresos || {};
    ["persona1", "persona2", "total"].forEach((k) => {
      if (ing[k] !== undefined && ing[k] !== "" && Number.isNaN(Number(ing[k]))) {
        errores.push(`Ingreso ${k} debe ser numérico.`);
      }
    });
    ["alimentos", "vestido", "escolares", "otro", "total"].forEach((k) => {
      if (egr[k] !== undefined && egr[k] !== "" && Number.isNaN(Number(egr[k]))) {
        errores.push(`Egreso ${k} debe ser numérico.`);
      }
    });
  }

  // —— Documentos PDF ——
  if (!Array.isArray(documentos)) {
    errores.push("Debes adjuntar los documentos en PDF.");
  } else {
    const vistos = new Set();
    for (const tipo of TIPOS_DOC) {
      const d = documentos.find((x) => x && x.tipo === tipo);
      if (!d) {
        errores.push(`Falta el PDF: ${LABELS_DOC[tipo]}.`);
        continue;
      }
      if (vistos.has(tipo)) {
        errores.push(`Documento duplicado: ${LABELS_DOC[tipo]}.`);
        continue;
      }
      vistos.add(tipo);
      if (!d.dataBase64) {
        errores.push(`El archivo de ${LABELS_DOC[tipo]} está vacío.`);
        continue;
      }
      if (String(d.dataBase64).length > MAX_PDF_B64) {
        errores.push(`${LABELS_DOC[tipo]} supera el tamaño máximo (~1.5 MB).`);
        continue;
      }
      if (!esPdfBase64(d.dataBase64)) {
        errores.push(`${LABELS_DOC[tipo]} no es un PDF válido (verifica que sea un escaneo en PDF).`);
      }
      const nombre = String(d.nombreArchivo || "");
      if (nombre && !/\.pdf$/i.test(nombre)) {
        errores.push(`${LABELS_DOC[tipo]}: el nombre del archivo debe terminar en .pdf`);
      }
    }
    // extras no permitidos
    for (const d of documentos) {
      if (d && d.tipo && !TIPOS_DOC.includes(d.tipo)) {
        errores.push(`Tipo de documento no permitido: ${d.tipo}`);
      }
    }
  }

  if (errores.length) {
    return { ok: false, error: errores[0], errores };
  }

  const limpio = {
    nombre: String(nombre).trim(),
    apellidos: String(apellidos).trim(),
    telefono: tel,
    celular: cel,
    correo: correoLimpio,
    escuela: String(escuela).trim(),
    carrera: String(carrera).trim(),
    grado: String(grado).trim(),
    matricula: String(matricula).trim(),
    direccion: String(direccion).trim(),
    coloniaLocalidad: String(coloniaLocalidad).trim(),
    trayectos: trayectos.map((t) => String(t).trim()),
    fotoBase64: fotoBase64 || null,
    estudioSocioeconomico: est,
    documentos: documentos.map((d) => ({
      tipo: d.tipo,
      nombreArchivo: d.nombreArchivo || `${d.tipo}.pdf`,
      dataBase64: d.dataBase64,
    })),
  };
  return { ok: true, limpio };
}

module.exports = { validarSolicitudBody, TIPOS_DOC, LABELS_DOC, esPdfBase64 };
