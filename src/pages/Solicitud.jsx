import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, User, Phone, Mail, GraduationCap, MapPin,
  CheckCircle2, ChevronDown, Bus, Loader2, ShieldAlert, Camera, X as XIcon,
  Home, Users, FileText, Wallet,
} from "lucide-react";
import { C } from "../theme";
import { GovHeader, GovFooter, A11yWidget } from "../components/GovShell";
import api from "../api";
import { comprimirImagen } from "../utils";
import BrandLogos from "../components/BrandLogos";

const ESCUELAS = [
  // Primarias
  { value: "Primaria Adolfo López Mateos (Calvillo)", abrev: "prim" },
  { value: "Primaria Miguel Hidalgo (Calvillo)", abrev: "prim" },
  { value: "Primaria Henry Ford 62 (Calvillo)", abrev: "prim" },
  { value: "Primaria Vicente Guerrero (Calvillo)", abrev: "prim" },
  { value: "Primaria Francisco González Bocanegra (La Panadera)", abrev: "prim" },
  { value: "Primaria 18 de Marzo (Los Patos)", abrev: "prim" },
  { value: "Primaria 20 de Noviembre (Ojocaliente)", abrev: "prim" },
  // Secundarias
  { value: "Secundaria General Núm. 22, Izcóatl (Calvillo)", abrev: "sec" },
  { value: "Secundaria General Núm. 23, Rafael Ramírez Castañeda (Ojocaliente)", abrev: "sec" },
  { value: "Secundaria General Núm. 35, Valle de Huéjucar (Calvillo)", abrev: "sec" },
  { value: "Secundaria Técnica Núm. 17 (Ojo de Agua)", abrev: "sec" },
  // Media superior / superior
  { value: "CBTIS 191 Calvillo", abrev: "cbtis" },
  { value: "CBTA 61 Calvillo", abrev: "cbta" },
  { value: "Preparatoria Regional de Calvillo", abrev: "prepa" },
  { value: "Universidad Tecnológica de Calvillo (El Salitre)", abrev: "utc" },
  { value: "Universidad para el Bienestar Benito Juárez de Calvillo", abrev: "ubbj" },
  { value: "Otra escuela de Calvillo", abrev: "esc" },
];

const PARENTESCO = [
  { value: "1", label: "1 — Padre/Madre" },
  { value: "2", label: "2 — Hijo/a" },
  { value: "3", label: "3 — Cónyuge" },
  { value: "4", label: "4 — Hermano/a" },
  { value: "5", label: "5 — Abuelo/a" },
  { value: "6", label: "6 — Nieto/a" },
  { value: "7", label: "7 — Otro" },
];
const OCUPACION = [
  { value: "1", label: "1 — Estudiante" },
  { value: "2", label: "2 — Hogar" },
  { value: "3", label: "3 — Empleado" },
  { value: "4", label: "4 — Jornalero" },
  { value: "5", label: "5 — Obrero" },
  { value: "6", label: "6 — Otro" },
];
const EDUCACION = [
  { value: "1", label: "1 — Primaria" },
  { value: "2", label: "2 — Secundaria" },
  { value: "3", label: "3 — Bachillerato" },
  { value: "4", label: "4 — Universidad" },
  { value: "5", label: "5 — Preescolar" },
  { value: "6", label: "6 — Especial" },
];
const MATERIAL = [
  { value: "1", label: "1 — Ladrillo" },
  { value: "2", label: "2 — Bloques de concreto" },
  { value: "3", label: "3 — Cemento" },
  { value: "4", label: "4 — Tierra" },
  { value: "5", label: "5 — Adobe" },
  { value: "6", label: "6 — Firme" },
  { value: "7", label: "7 — Vitropiso/mosaico" },
  { value: "8", label: "8 — Otro" },
];

const DOCS = [
  { tipo: "acta_nacimiento", label: "Acta de nacimiento (PDF)" },
  { tipo: "curp", label: "CURP (PDF)" },
  { tipo: "identificacion", label: "Credencial del papá o del solicitante si es mayor de edad (PDF)" },
  { tipo: "constancia_estudios", label: "Constancia de estudios (PDF)" },
  { tipo: "comprobante_domicilio", label: "Comprobante de domicilio (PDF)" },
];

const MAX_PDF = 1.5 * 1024 * 1024; // 1.5 MB

const errBorder = (bad) => bad ? C.garnet : C.paperDim;
const baseInput = {
  width: "100%", borderRadius: 9,
  padding: "10px 12px", fontSize: 16.4, color: C.ink, outline: "none",
  boxSizing: "border-box", background: "#fff",
};
function inputStyle(bad) {
  return { ...baseInput, border: `1px solid ${bad ? C.garnet : C.paperDim}` };
}


function Field({ label, icon: Icon, children, hint }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14.5, fontWeight: 600, color: C.navy, marginBottom: 6 }}>
        {Icon && <Icon size={13} />} {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: 13.3, color: "#8993A1", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function Select({ value, onChange, options, placeholder }) {
  const normalizadas = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <div style={{ position: "relative" }}>
      <select value={value} onChange={onChange} style={{ ...inputStyle(), appearance: "none", color: value ? C.ink : "#8993A1" }}>
        <option value="">{placeholder || "Selecciona"}</option>
        {normalizadas.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={14} color="#8993A1" style={{ position: "absolute", right: 12, top: 12, pointerEvents: "none" }} />
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.paperDim}`, borderRadius: 8, padding: 16, marginBottom: 14, boxShadow: "0 1px 4px rgba(18,22,30,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        {Icon && <Icon size={15} color={C.navy} />}
        <div className="f-display" style={{ fontSize: 17.6, fontWeight: 700, color: C.navy }}>{title}</div>
      </div>
      {children}
    </div>
  );
}

function familiarVacio() {
  return {
    nombre: "", parentesco: "", ocupacion: "", educacion: "",
    institucion: "", ubicacion: "", ruta1: "", ruta2: "", costoDiario: "",
  };
}

const initialForm = {
  nombre: "", apellidos: "", telefono: "", celular: "", correo: "",
  direccion: "", coloniaLocalidad: "",
  escuela: "", carrera: "", grado: "", matricula: "",
};

export default function Solicitud() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [numRutas, setNumRutas] = useState(1);
  const [trayectos, setTrayectos] = useState([{ origen: "", destino: "" }]);
  const [familiares, setFamiliares] = useState([familiarVacio()]);
  const [ingresos, setIngresos] = useState({ persona1: "", persona2: "" });
  const [egresos, setEgresos] = useState({ alimentos: "", vestido: "", escolares: "", otro: "" });
  const [vivienda, setVivienda] = useState({
    tipo: "", techoLamina: "", paredes: "", piso: "",
    agua: false, luz: false, drenaje: false, internet: false,
    refrigerador: false, television: false, microondas: false, lavadora: false, vehiculo: false,
  });
  const [discapacidad, setDiscapacidad] = useState([
    { persona: "", detalle: "" },
    { persona: "", detalle: "" },
    { persona: "", detalle: "" },
  ]);
  const [docs, setDocs] = useState({});
  const [foto, setFoto] = useState(null);
  const [comprimiendoFoto, setComprimiendoFoto] = useState(false);
  const [errorFoto, setErrorFoto] = useState("");
  const [paso, setPaso] = useState(0);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [folio, setFolio] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  function setF(k, v) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function handleFoto(e) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    setErrorFoto("");
    setComprimiendoFoto(true);
    try {
      const dataUri = await comprimirImagen(archivo);
      setFoto(dataUri);
    } catch (err) {
      setErrorFoto(err.message);
    } finally {
      setComprimiendoFoto(false);
    }
  }

  function handlePdf(tipo, e) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    const esPdfMime = archivo.type === "application/pdf" || archivo.type === "application/x-pdf";
    const esPdfNombre = /\.pdf$/i.test(archivo.name);
    if (!esPdfMime && !esPdfNombre) {
      setError("Todos los documentos deben ser PDF escaneados.");
      setFieldErrors((fe) => ({ ...fe, [tipo]: "Solo se acepta PDF" }));
      return;
    }
    if (archivo.size === 0) {
      setError("El archivo está vacío.");
      return;
    }
    if (archivo.size > MAX_PDF) {
      setError(`El PDF supera 1.5 MB. Escanea con menor resolución.`);
      setFieldErrors((fe) => ({ ...fe, [tipo]: "Máximo 1.5 MB" }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result;
      // Cabecera %PDF en base64 → JVBERi
      if (typeof data !== "string" || !data.includes("base64,")) {
        setError("No se pudo leer el archivo.");
        return;
      }
      const b64 = data.split("base64,")[1] || "";
      let head = "";
      try {
        head = atob(b64.slice(0, 32));
      } catch {
        setError("Archivo corrupto.");
        return;
      }
      if (!head.startsWith("%PDF")) {
        setError("El archivo no es un PDF válido (debe empezar con %PDF).");
        setFieldErrors((fe) => ({ ...fe, [tipo]: "PDF inválido" }));
        return;
      }
      setDocs((prev) => ({
        ...prev,
        [tipo]: { dataBase64: data, nombreArchivo: archivo.name.replace(/\.pdf$/i, "") + ".pdf" },
      }));
      setFieldErrors((fe) => {
        const n = { ...fe };
        delete n[tipo];
        return n;
      });
      setError("");
    };
    reader.onerror = () => setError("Error al leer el archivo.");
    reader.readAsDataURL(archivo);
  }

  const PASOS = [
    "Datos del solicitante",
    "Trayectos",
    "Datos familiares",
    "Ingresos y egresos",
    "Datos de la vivienda",
    "Discapacidad",
    "Documentos y envío",
  ];

  function validarPaso(p) {
    const errs = {};
    const msgs = [];
    const dig = (s) => String(s || "").replace(/\D/g, "");

    if (p === 0) {
      if (!form.nombre.trim()) { errs.nombre = true; msgs.push("Nombre obligatorio"); }
      if (!form.apellidos.trim()) { errs.apellidos = true; msgs.push("Apellidos obligatorios"); }
      if (!form.direccion.trim()) { errs.direccion = true; msgs.push("Dirección obligatoria"); }
      if (!form.coloniaLocalidad.trim()) { errs.coloniaLocalidad = true; msgs.push("Colonia / localidad obligatoria"); }
      if (dig(form.telefono).length !== 10) { errs.telefono = true; msgs.push("Teléfono: 10 dígitos"); }
      if (dig(form.celular).length !== 10) { errs.celular = true; msgs.push("Celular: 10 dígitos"); }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo.trim())) { errs.correo = true; msgs.push("Correo inválido"); }
      if (!form.escuela) { errs.escuela = true; msgs.push("Selecciona institución"); }
      if (!form.grado.trim()) { errs.grado = true; msgs.push("Indica el grado (ej. 3° de primaria, 2° cuatrimestre)"); }
      if (!form.matricula.trim()) { errs.matricula = true; msgs.push("Número de estudiante obligatorio"); }
      if (!foto) { errs.foto = true; msgs.push("Foto del estudiante obligatoria"); }
    }
    if (p === 1) {
      for (let i = 0; i < numRutas; i++) {
        const t = trayectos[i];
        if (!t?.origen?.trim() || !t?.destino?.trim()) {
          errs[`trayecto${i}`] = true;
          msgs.push(`Completa origen y destino del trayecto ${i + 1}`);
        }
      }
    }
    if (p === 2) {
      familiares.forEach((f, i) => {
        if (!f.nombre.trim()) return;
        if (!f.parentesco) { errs[`fam${i}p`] = true; msgs.push(`Familiar ${i + 1}: parentesco`); }
        if (!f.ocupacion) { errs[`fam${i}o`] = true; msgs.push(`Familiar ${i + 1}: ocupación`); }
      });
    }
    if (p === 4) {
      if (!vivienda.tipo) { errs.viviendaTipo = true; msgs.push("Tipo de vivienda"); }
      if (vivienda.techoLamina !== "si" && vivienda.techoLamina !== "no") {
        errs.techoLamina = true; msgs.push("¿Techo de lámina?");
      }
      if (!vivienda.paredes) { errs.paredes = true; msgs.push("Material de paredes"); }
      if (!vivienda.piso) { errs.piso = true; msgs.push("Material del piso"); }
    }
    if (p === 6) {
      for (const d of DOCS) {
        if (!docs[d.tipo]) {
          errs[d.tipo] = true;
          msgs.push(`Falta PDF: ${d.label}`);
        }
      }
      if (!aceptaTerminos) { msgs.push("Debes aceptar los Términos y condiciones"); }
      if (!aceptaPrivacidad) { msgs.push("Debes aceptar el Aviso de privacidad"); }
    }
    return { errs, msgs };
  }

  function validarCliente() {
    let allErrs = {};
    let allMsgs = [];
    for (let p = 0; p <= 6; p++) {
      const { errs, msgs } = validarPaso(p);
      allErrs = { ...allErrs, ...errs };
      allMsgs = allMsgs.concat(msgs);
    }
    return { errs: allErrs, msgs: allMsgs };
  }

  function avanzarPaso(e) {
    e.preventDefault();
    const { errs, msgs } = validarPaso(paso);
    setFieldErrors(errs);
    if (msgs.length) {
      setError(msgs.join(". "));
      return;
    }
    setError("");
    setPaso((p) => Math.min(p + 1, PASOS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }


  function setFamiliar(i, key, val) {
    setFamiliares((prev) => prev.map((f, idx) => (idx === i ? { ...f, [key]: val } : f)));
  }

  async function enviar(e) {
    e.preventDefault();
    setError("");
    const { errs, msgs } = validarCliente();
    setFieldErrors(errs);
    if (msgs.length) {
      setError(msgs[0] + (msgs.length > 1 ? ` (y ${msgs.length - 1} más)` : ""));
      return;
    }

    const trayectosStr = trayectos.slice(0, numRutas).map((t) => {
      const o = t.origen.trim();
      const dest = t.destino.trim();
      return o && dest ? `De ${o} a ${dest}` : "";
    });

    const estudioSocioeconomico = {
      familiares: familiares.filter((f) => f.nombre.trim()),
      ingresos: {
        persona1: Number(ingresos.persona1) || 0,
        persona2: Number(ingresos.persona2) || 0,
        total: (Number(ingresos.persona1) || 0) + (Number(ingresos.persona2) || 0),
      },
      egresos: {
        alimentos: Number(egresos.alimentos) || 0,
        vestido: Number(egresos.vestido) || 0,
        escolares: Number(egresos.escolares) || 0,
        otro: Number(egresos.otro) || 0,
        total:
          (Number(egresos.alimentos) || 0) +
          (Number(egresos.vestido) || 0) +
          (Number(egresos.escolares) || 0) +
          (Number(egresos.otro) || 0),
      },
      vivienda,
      discapacidad: discapacidad.filter((d) => d.persona.trim() || d.detalle.trim()),
    };

    const documentos = DOCS.map((d) => ({
      tipo: d.tipo,
      nombreArchivo: docs[d.tipo].nombreArchivo,
      dataBase64: docs[d.tipo].dataBase64,
    }));

    setEnviando(true);
    try {
      const data = await api.crearSolicitud({
        ...form,
        coloniaLocalidad: form.coloniaLocalidad,
        trayectos: trayectosStr,
        fotoBase64: foto,
        estudioSocioeconomico,
        documentos,
      });
      setFolio(data.folio);
      setEnviado(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div className="page-shell" style={{ background: C.paper }}>
        <GovHeader compact />
        <div className="page-body" style={{ maxWidth: 520, margin: "clamp(20px, 5vw, 48px) auto", padding: "0 20px" }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 28, textAlign: "center", border: `1px solid ${C.mint}` }}>
          <CheckCircle2 size={40} color="#1F7A56" style={{ marginBottom: 12 }} />
          <div className="f-display" style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>Solicitud enviada</div>
          <p style={{ fontSize: 16.4, color: "#5B6675", marginTop: 8 }}>Tu folio es:</p>
          <div className="f-mono" style={{ fontSize: 20, fontWeight: 700, color: C.navy, margin: "10px 0" }}>{folio}</div>
          <p style={{ fontSize: 15.1, color: "#6b7785", lineHeight: 1.5 }}>
            Guárdalo. Te avisaremos por correo cuando sea revisada.
          </p>
          <button type="button" onClick={() => navigate("/")} style={{ marginTop: 18, width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: C.navy, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
            Volver al inicio
          </button>
        </div>
        </div>
        <GovFooter />
        <A11yWidget />
      </div>
    );
  }

  const totalIng = (Number(ingresos.persona1) || 0) + (Number(ingresos.persona2) || 0);
  const totalEgr =
    (Number(egresos.alimentos) || 0) +
    (Number(egresos.vestido) || 0) +
    (Number(egresos.escolares) || 0) +
    (Number(egresos.otro) || 0);

  return (
    <div className="page-shell" style={{ background: C.paper }}>
      <GovHeader compact />

      <form onSubmit={paso < 6 ? avanzarPaso : enviar} className="page-body" style={{ maxWidth: 900, margin: "0 auto", padding: "clamp(16px, 3vw, 32px) clamp(14px, 3vw, 24px) 40px" }}>
        <p style={{ fontSize: 15.1, color: "#6b7785", marginBottom: 10, lineHeight: 1.45 }}>
          Formato de estudio socioeconómico — Programa Apoyo al Transporte Escolar. Completa sección por sección.
        </p>
        <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
          {PASOS.map((label, i) => (
            <div key={label} style={{
              flex: "1 1 auto",
              minWidth: 0,
              height: 4,
              borderRadius: 999,
              background: i <= paso ? C.navy : C.paperDim,
            }} title={label} />
          ))}
        </div>
        <div style={{ fontSize: 13.5, color: "#6b7785", marginBottom: 14, fontWeight: 600 }}>
          Paso {paso + 1} de {PASOS.length}: {PASOS[paso]}
        </div>

        {/* DATOS DEL SOLICITANTE */}
        {paso === 0 && <Section title="Datos del solicitante" icon={User}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Nombre(s)"><input required value={form.nombre} onChange={(e) => setF("nombre", e.target.value)} style={inputStyle(fieldErrors.nombre)} /></Field>
            <Field label="Apellidos"><input required value={form.apellidos} onChange={(e) => setF("apellidos", e.target.value)} style={inputStyle(fieldErrors.apellidos)} /></Field>
          </div>
          <Field label="Dirección" icon={MapPin}><input required value={form.direccion} onChange={(e) => setF("direccion", e.target.value)} style={inputStyle(fieldErrors.direccion)} placeholder="Calle y número" /></Field>
          <Field label="Col. / Localidad"><input required value={form.coloniaLocalidad} onChange={(e) => setF("coloniaLocalidad", e.target.value)} style={inputStyle(fieldErrors.coloniaLocalidad)} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Celular" icon={Phone}><input required value={form.celular} onChange={(e) => setF("celular", e.target.value)} style={inputStyle(fieldErrors.celular)} placeholder="10 dígitos" inputMode="numeric" /></Field>
            <Field label="Teléfono" icon={Phone}><input required value={form.telefono} onChange={(e) => setF("telefono", e.target.value)} style={inputStyle(fieldErrors.telefono)} placeholder="10 dígitos" inputMode="numeric" /></Field>
          </div>
          <Field label="Correo electrónico" icon={Mail}><input required type="email" value={form.correo} onChange={(e) => setF("correo", e.target.value)} style={inputStyle(fieldErrors.correo)} /></Field>
          <Field label="Institución educativa" icon={GraduationCap}>
            <Select value={form.escuela} onChange={(e) => setF("escuela", e.target.value)} options={ESCUELAS.map((e) => typeof e === "string" ? e : e.value)} placeholder="Selecciona" />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Carrera / especialidad (opcional)">
              <input value={form.carrera} onChange={(e) => setF("carrera", e.target.value)} style={inputStyle()} placeholder="Solo si aplica (prepa / universidad)" />
            </Field>
            <Field label="Grado o año escolar">
              <input required value={form.grado} onChange={(e) => setF("grado", e.target.value)} style={inputStyle(fieldErrors.grado)} placeholder="Ej. 2° de primaria, 1er cuatrimestre, 3° de secundaria" />
            </Field>
          </div>
          <Field label="Número de estudiante"><input required value={form.matricula} onChange={(e) => setF("matricula", e.target.value.toLowerCase().replace(/\s/g, ""))} style={inputStyle()} className="f-mono" placeholder="Ej. cbtis2024, cbta2023, utc2025, prepa2024…" /><div style={{ fontSize: 11, color: "#8993A1", marginTop: 4 }}>Usa la abreviatura de tu escuela + año o folio (ej. <span className="f-mono">cbta2023</span>, <span className="f-mono">utc2024</span>). No uses prefijos UPA.</div></Field>
          <Field label="Foto del estudiante — tamaño infantil (obligatoria)" icon={Camera}>
            {foto ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img src={foto} alt="Foto infantil del estudiante" style={{ width: 105, height: 135, borderRadius: 6, objectFit: "cover", border: `1px solid ${C.paperDim}`, background: "#fff" }} />
                <div>
                  <div style={{ fontSize: 12, color: "#5B6675", marginBottom: 6 }}>Formato infantil (vertical)</div>
                  <button type="button" onClick={() => setFoto(null)} style={{ border: "none", background: "none", color: C.garnet, fontSize: 14, cursor: "pointer" }}><XIcon size={14} /> Quitar</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                <label style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.navy}`,
                  background: C.navy, color: "#fff", fontSize: 14, fontWeight: 600, cursor: comprimiendoFoto ? "default" : "pointer",
                }}>
                  <Camera size={16} />
                  Tomar foto
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFoto}
                    disabled={comprimiendoFoto}
                    style={{ display: "none" }}
                  />
                </label>
                <label style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.paperDim}`,
                  background: "#fff", color: C.navy, fontSize: 14, fontWeight: 600, cursor: comprimiendoFoto ? "default" : "pointer",
                }}>
                  Subir imagen
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFoto}
                    disabled={comprimiendoFoto}
                    style={{ display: "none" }}
                  />
                </label>
                {comprimiendoFoto && <span style={{ fontSize: 13, color: "#6b7785" }}>Procesando…</span>}
              </div>
            )}
            {errorFoto && <div style={{ color: C.garnet, fontSize: 13.9 }}>{errorFoto}</div>}
          </Field>
        </Section>}

        {/* TRAYECTOS */}
        {paso === 1 && <Section title="Trayectos (máx. 2 rutas)" icon={Bus}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {[1, 2].map((n) => (
              <button key={n} type="button" onClick={() => { setNumRutas(n); setTrayectos((t) => { const c = [...t]; while (c.length < n) c.push({ origen: "", destino: "" }); return c.slice(0, n); }); }}
                style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 15.1, cursor: "pointer", background: numRutas === n ? C.navy : C.paper, color: numRutas === n ? "#fff" : C.navy }}>
                {n} ruta{n > 1 ? "s" : ""}
              </button>
            ))}
          </div>
          {trayectos.slice(0, numRutas).map((t, i) => (
            <div key={i} style={{ marginBottom: 10, padding: 10, background: C.paper, borderRadius: 10 }}>
              <div style={{ fontSize: 13.9, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Trayecto {i + 1}</div>
              <input placeholder="Origen (ej. Calvillo Centro)" value={t.origen} onChange={(e) => setTrayectos((arr) => arr.map((x, j) => j === i ? { ...x, origen: e.target.value } : x))} style={{ ...inputStyle(), marginBottom: 6 }} required />
              <input placeholder="Destino (ej. secundaria / preparatoria / universidad en Calvillo)" value={t.destino} onChange={(e) => setTrayectos((arr) => arr.map((x, j) => j === i ? { ...x, destino: e.target.value } : x))} style={inputStyle()} required />
            </div>
          ))}
        </Section>}

        {/* DATOS FAMILIARES */}
        {paso === 2 && <Section title="Datos familiares" icon={Users}>
          <p style={{ fontSize: 13.9, color: "#6b7785", marginBottom: 10 }}>Incluye a quienes viven en el hogar (códigos del formato oficial).</p>
          {familiares.map((f, i) => (
            <div key={i} style={{ border: `1px solid ${C.paperDim}`, borderRadius: 10, padding: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 13.9, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Persona {i + 2 <= 10 ? String(i + 2).padStart(2, "0") : i + 1}</div>
              <input placeholder="Nombre" value={f.nombre} onChange={(e) => setFamiliar(i, "nombre", e.target.value)} style={{ ...inputStyle(), marginBottom: 6 }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
                <Select value={f.parentesco} onChange={(e) => setFamiliar(i, "parentesco", e.target.value)} options={PARENTESCO} placeholder="Parentesco" />
                <Select value={f.ocupacion} onChange={(e) => setFamiliar(i, "ocupacion", e.target.value)} options={OCUPACION} placeholder="Ocupación" />
              </div>
              <Select value={f.educacion} onChange={(e) => setFamiliar(i, "educacion", e.target.value)} options={EDUCACION} placeholder="Educación" />
              <input placeholder="Institución" value={f.institucion} onChange={(e) => setFamiliar(i, "institucion", e.target.value)} style={{ ...inputStyle(), marginTop: 6, marginBottom: 6 }} />
              <input placeholder="Ubicación" value={f.ubicacion} onChange={(e) => setFamiliar(i, "ubicacion", e.target.value)} style={{ ...inputStyle(), marginBottom: 6 }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                <input placeholder="Ruta R1" value={f.ruta1} onChange={(e) => setFamiliar(i, "ruta1", e.target.value)} style={inputStyle()} />
                <input placeholder="Ruta R2" value={f.ruta2} onChange={(e) => setFamiliar(i, "ruta2", e.target.value)} style={inputStyle()} />
                <input placeholder="Costo diario $" value={f.costoDiario} onChange={(e) => setFamiliar(i, "costoDiario", e.target.value)} style={inputStyle()} inputMode="decimal" />
              </div>
            </div>
          ))}
          {familiares.length < 9 && (
            <button type="button" onClick={() => setFamiliares((p) => [...p, familiarVacio()])} style={{ width: "100%", padding: 8, borderRadius: 8, border: `1px dashed ${C.navy}`, background: "none", color: C.navy, fontSize: 15.1, fontWeight: 600, cursor: "pointer" }}>
              + Agregar familiar
            </button>
          )}
        </Section>}

        {/* INGRESOS Y EGRESOS */}
        {paso === 3 && <Section title="Ingresos y egresos familiares" icon={Wallet}>
          <div style={{ fontSize: 13.9, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Ingresos ($)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <input placeholder="Persona 1" value={ingresos.persona1} onChange={(e) => setIngresos((p) => ({ ...p, persona1: e.target.value }))} style={inputStyle()} inputMode="decimal" />
            <input placeholder="Persona 2" value={ingresos.persona2} onChange={(e) => setIngresos((p) => ({ ...p, persona2: e.target.value }))} style={inputStyle()} inputMode="decimal" />
          </div>
          <div className="f-mono" style={{ fontSize: 15.1, marginBottom: 12, color: C.navy }}>Total ingresos: ${totalIng}</div>
          <div style={{ fontSize: 13.9, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Egresos ($)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <input placeholder="Alimentos" value={egresos.alimentos} onChange={(e) => setEgresos((p) => ({ ...p, alimentos: e.target.value }))} style={inputStyle()} inputMode="decimal" />
            <input placeholder="Vestido / calzado" value={egresos.vestido} onChange={(e) => setEgresos((p) => ({ ...p, vestido: e.target.value }))} style={inputStyle()} inputMode="decimal" />
            <input placeholder="Gastos escolares" value={egresos.escolares} onChange={(e) => setEgresos((p) => ({ ...p, escolares: e.target.value }))} style={inputStyle()} inputMode="decimal" />
            <input placeholder="Otro" value={egresos.otro} onChange={(e) => setEgresos((p) => ({ ...p, otro: e.target.value }))} style={inputStyle()} inputMode="decimal" />
          </div>
          <div className="f-mono" style={{ fontSize: 15.1, marginTop: 8, color: C.navy }}>Total egresos: ${totalEgr}</div>
        </Section>}

        {/* VIVIENDA */}
        {paso === 4 && <Section title="Datos de la vivienda" icon={Home}>
          <Field label="1. Su vivienda es">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["propia", "prestada", "rentada"].map((v) => (
                <label key={v} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 15.1, textTransform: "capitalize" }}>
                  <input type="radio" name="viv" checked={vivienda.tipo === v} onChange={() => setVivienda((p) => ({ ...p, tipo: v }))} required /> {v}
                </label>
              ))}
            </div>
          </Field>
          <Field label="2. ¿Techo de lámina?">
            <div style={{ display: "flex", gap: 12 }}>
              {["si", "no"].map((v) => (
                <label key={v} style={{ fontSize: 15.1, textTransform: "uppercase" }}>
                  <input type="radio" name="lamina" checked={vivienda.techoLamina === v} onChange={() => setVivienda((p) => ({ ...p, techoLamina: v }))} /> {v}
                </label>
              ))}
            </div>
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Field label="Material de las paredes">
              <Select value={vivienda.paredes} onChange={(e) => setVivienda((p) => ({ ...p, paredes: e.target.value }))} options={MATERIAL} placeholder="Material" />
            </Field>
            <Field label="Material del piso">
              <Select value={vivienda.piso} onChange={(e) => setVivienda((p) => ({ ...p, piso: e.target.value }))} options={MATERIAL} placeholder="Material" />
            </Field>
          </div>
          <Field label="3. Cuenta con servicios de">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 15.1 }}>
              {[
                ["agua", "Agua potable"],
                ["luz", "Luz eléctrica"],
                ["drenaje", "Drenaje"],
                ["internet", "Internet"],
              ].map(([k, lab]) => (
                <label key={k} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input type="checkbox" checked={!!vivienda[k]} onChange={(e) => setVivienda((p) => ({ ...p, [k]: e.target.checked }))} /> {lab}
                </label>
              ))}
            </div>
          </Field>
          <Field label="4. Su casa cuenta con">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 15.1 }}>
              {[
                ["refrigerador", "Refrigerador"],
                ["television", "Televisión"],
                ["microondas", "Horno microondas"],
                ["lavadora", "Lavadora"],
                ["vehiculo", "Vehículo propio"],
              ].map(([k, lab]) => (
                <label key={k} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input type="checkbox" checked={!!vivienda[k]} onChange={(e) => setVivienda((p) => ({ ...p, [k]: e.target.checked }))} /> {lab}
                </label>
              ))}
            </div>
          </Field>
        </Section>}

        {/* DISCAPACIDAD */}
        {paso === 5 && <Section title="¿Tiene alguna discapacidad o enfermedad?" icon={ShieldAlert}>
          {discapacidad.map((d, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 6, marginBottom: 8 }}>
              <input placeholder={`Persona ${i + 1}`} value={d.persona} onChange={(e) => setDiscapacidad((arr) => arr.map((x, j) => j === i ? { ...x, persona: e.target.value } : x))} style={inputStyle()} />
              <input placeholder="Detalle / ¿cuál?" value={d.detalle} onChange={(e) => setDiscapacidad((arr) => arr.map((x, j) => j === i ? { ...x, detalle: e.target.value } : x))} style={inputStyle()} />
            </div>
          ))}
        </Section>}

        {/* DOCUMENTOS PDF */}
        {paso === 6 && (
        <Section title="Documentos (PDF escaneados)" icon={FileText}>
          <p style={{ fontSize: 13.9, color: "#6b7785", marginBottom: 10 }}>Obligatorios. Solo PDF, máximo 1.5 MB cada uno.</p>
          {DOCS.map((d) => (
            <div key={d.tipo} style={{ marginBottom: 12, padding: 10, background: docs[d.tipo] ? `${C.mint}18` : C.paper, borderRadius: 10, border: `1px solid ${docs[d.tipo] ? C.mint : (fieldErrors[d.tipo] ? C.garnet : C.paperDim)}` }}>
              <div style={{ fontSize: 15.1, fontWeight: 600, color: C.navy, marginBottom: 6 }}>{d.label}</div>
              {docs[d.tipo] ? (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13.9 }}>
                  <span style={{ color: "#1F7A56" }}>✓ {docs[d.tipo].nombreArchivo}</span>
                  <button type="button" onClick={() => setDocs((p) => { const n = { ...p }; delete n[d.tipo]; return n; })} style={{ border: "none", background: "none", color: C.garnet, cursor: "pointer", fontSize: 13.9 }}>Quitar</button>
                </div>
              ) : (
                <input type="file" accept="application/pdf" onChange={(e) => handlePdf(d.tipo, e)} />
              )}
            </div>
          ))}
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10, cursor: "pointer", fontSize: 14.5 }}>
              <input type="checkbox" checked={aceptaTerminos} onChange={(e) => setAceptaTerminos(e.target.checked)} style={{ marginTop: 3 }} />
              <span>Acepto los <a href="/terminos" target="_blank" rel="noopener" style={{ color: C.busBlue, fontWeight: 600 }}>Términos y condiciones</a>.</span>
            </label>
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14, cursor: "pointer", fontSize: 14.5 }}>
              <input type="checkbox" checked={aceptaPrivacidad} onChange={(e) => setAceptaPrivacidad(e.target.checked)} style={{ marginTop: 3 }} />
              <span>Acepto el <a href="/privacidad" target="_blank" rel="noopener" style={{ color: C.busBlue, fontWeight: 600 }}>Aviso de privacidad</a>.</span>
            </label>
        </Section>
        )}

        {error && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: `${C.garnet}12`, border: `1px solid ${C.garnet}`, color: C.garnet, borderRadius: 8, padding: 12, fontSize: 15.8, marginBottom: 12 }}>
            <ShieldAlert size={16} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          {paso > 0 && (
            <button type="button" onClick={() => { setError(""); setPaso((p) => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              style={{ flex: 1, padding: "14px 0", borderRadius: 8, border: `1px solid ${C.navy}`, background: "#fff", color: C.navy, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
              Atrás
            </button>
          )}
          <button type="submit" disabled={enviando} style={{ flex: 2, padding: "14px 0", borderRadius: 8, border: "none", background: C.navy, color: "#fff", fontSize: 17.6, fontWeight: 700, cursor: enviando ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {enviando ? <><Loader2 size={16} className="spin" /> Enviando…</> : (paso < 6 ? "Continuar" : "Enviar solicitud")}
          </button>
        </div>
        <p style={{ fontSize: 13.3, color: "#8993A1", textAlign: "center", marginTop: 12, lineHeight: 1.4 }}>
          {paso < 6 ? "Se valida cada sección al continuar." : "Al enviar declaras que la información es verídica. Recaudación revisará los datos y documentos."}
        </p>
      </form>
      <GovFooter />
      <A11yWidget />
    </div>
  );
}
