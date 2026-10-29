import React, { useEffect } from "react";
import { X, Printer, FileText, Eye, Download, User, MapPin, GraduationCap, Bus, Users, Wallet, Home, ShieldAlert } from "lucide-react";
import { C } from "../theme";
import api from "../api";
import { formatFechaHora } from "../utils";

const PARENTESCO = { 1: "Padre/Madre", 2: "Hijo/a", 3: "Cónyuge", 4: "Hermano/a", 5: "Abuelo/a", 6: "Nieto/a", 7: "Otro" };
const OCUPACION = { 1: "Estudiante", 2: "Hogar", 3: "Empleado", 4: "Jornalero", 5: "Obrero", 6: "Otro" };
const EDUCACION = { 1: "Primaria", 2: "Secundaria", 3: "Bachillerato", 4: "Universidad", 5: "Preescolar", 6: "Especial" };
const MATERIAL = { 1: "Ladrillo", 2: "Bloques de concreto", 3: "Cemento", 4: "Tierra", 5: "Adobe", 6: "Firme", 7: "Vitropiso/mosaico", 8: "Otro" };
const LABEL_DOC = {
  acta_nacimiento: "Acta de nacimiento",
  curp: "CURP",
  identificacion: "Credencial (papá o solicitante)",
  constancia_estudios: "Constancia de estudios",
  comprobante_domicilio: "Comprobante de domicilio",
};
const SERVICIOS = [["agua", "Agua potable"], ["luz", "Luz eléctrica"], ["drenaje", "Drenaje"], ["internet", "Internet"]];
const BIENES = [["refrigerador", "Refrigerador"], ["television", "Televisión"], ["microondas", "Horno microondas"], ["lavadora", "Lavadora"], ["vehiculo", "Vehículo propio"]];

const cat = (mapa, v) => (v === undefined || v === null || v === "" ? "—" : mapa[v] ? `${mapa[v]}` : String(v));
const dinero = (n) => `$${Number(n || 0).toLocaleString("es-MX")}`;
const val = (v) => (v === undefined || v === null || String(v).trim() === "" ? "—" : String(v));

function dataUriABlobUrl(dataUri, mime = "application/pdf") {
  const b64 = String(dataUri).split(",")[1] || "";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}

function Seccion({ icon: Icon, titulo, children }) {
  return (
    <section className="form-sec" style={{ border: `1px solid ${C.paperDim}`, borderRadius: 12, padding: "14px 16px", marginBottom: 14, background: "#fff", breakInside: "avoid" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, color: C.navy }}>
        <Icon size={16} />
        <h3 style={{ margin: 0, fontSize: 14, letterSpacing: 0.5, textTransform: "uppercase" }}>{titulo}</h3>
      </div>
      {children}
    </section>
  );
}

function Dato({ label, children, ancho }) {
  return (
    <div style={{ minWidth: 0, ...(ancho ? { gridColumn: `span ${ancho}` } : {}) }}>
      <div style={{ fontSize: 11, color: "#8993A1", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, color: C.ink, fontWeight: 600, overflowWrap: "anywhere" }}>{children}</div>
    </div>
  );
}

const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "12px 18px" };

/** Formulario de solicitud completo (solo lectura) tal como lo llenó el estudiante. */
export default function FormularioSolicitud({ solicitud, token, onCerrar }) {
  const e = solicitud.estudioSocioeconomico || {};
  const viv = e.vivienda || {};
  const fam = e.familiares || [];
  const ing = e.ingresos || {};
  const egr = e.egresos || {};
  const disc = e.discapacidad || [];
  const trayectos = solicitud.trayectos?.length ? solicitud.trayectos : (solicitud.rutas || []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (ev) => { if (ev.key === "Escape") onCerrar(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [onCerrar]);

  async function abrirDoc(d, descargar) {
    try {
      const data = await api.descargarDocumentoSolicitud(solicitud.folio, d.id, token);
      const url = dataUriABlobUrl(data.dataBase64, data.mime || "application/pdf");
      if (descargar) {
        const a = document.createElement("a");
        a.href = url; a.download = data.nombreArchivo || `${d.tipo}.pdf`; a.click();
      } else {
        window.open(url, "_blank", "noopener");
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Formulario completo de ${solicitud.nombre} ${solicitud.apellidos}`}
      className="form-modal"
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,26,51,0.6)", display: "flex", justifyContent: "center", alignItems: "center", padding: "clamp(12px, 2.5vw, 24px)", boxSizing: "border-box" }}
      onClick={(ev) => { if (ev.target === ev.currentTarget) onCerrar(); }}
    >
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .form-modal, .form-modal * { visibility: visible !important; }
          .form-modal { position: absolute !important; inset: 0 !important; background: #fff !important; padding: 0 !important; overflow: visible !important; }
          .form-modal .no-print { display: none !important; }
          .form-modal .form-sheet { box-shadow: none !important; max-width: 100% !important; max-height: none !important; height: auto !important; }
        }
      `}</style>
      <div className="form-sheet" style={{ background: C.paper, width: "100%", maxWidth: 900, maxHeight: "min(92vh, 960px)", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.35)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ flexShrink: 0, background: C.navy, color: "#fff", borderRadius: "14px 14px 0 0", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 17 }}>Formulario completo de solicitud</div>
            <div className="f-mono" style={{ fontSize: 12, opacity: 0.85 }}>{solicitud.folio} · recibida {formatFechaHora(solicitud.creado_en)}</div>
          </div>
          <div className="no-print" style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => window.print()} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
              <Printer size={15} /> Imprimir
            </button>
            <button type="button" onClick={onCerrar} aria-label="Cerrar" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.gold, color: C.navy, border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
              <X size={15} /> Cerrar
            </button>
          </div>
        </div>

        <div style={{ padding: "16px clamp(12px, 3vw, 22px) 22px", overflowY: "auto", flex: 1, minHeight: 0, WebkitOverflowScrolling: "touch" }}>
          <Seccion icon={User} titulo="Datos del solicitante">
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
              {solicitud.foto_base64 && (
                <img src={solicitud.foto_base64} alt="Foto del estudiante" style={{ width: 110, height: 110, objectFit: "cover", borderRadius: 12, border: `1px solid ${C.paperDim}` }} />
              )}
              <div style={{ ...grid, flex: 1, minWidth: 240 }}>
                <Dato label="Nombre(s)">{val(solicitud.nombre)}</Dato>
                <Dato label="Apellidos">{val(solicitud.apellidos)}</Dato>
                <Dato label="Celular">{val(solicitud.celular)}</Dato>
                <Dato label="Teléfono">{val(solicitud.telefono)}</Dato>
                <Dato label="Correo electrónico" ancho={2}>{val(solicitud.correo)}</Dato>
              </div>
            </div>
          </Seccion>

          <Seccion icon={MapPin} titulo="Domicilio">
            <div style={grid}>
              <Dato label="Dirección" ancho={2}>{val(solicitud.direccion)}</Dato>
              <Dato label="Colonia / Localidad">{val(solicitud.colonia_localidad)}</Dato>
            </div>
          </Seccion>

          <Seccion icon={GraduationCap} titulo="Datos escolares">
            <div style={grid}>
              <Dato label="Institución educativa" ancho={2}>{val(solicitud.escuela)}</Dato>
              <Dato label="Carrera / especialidad">{val(solicitud.carrera)}</Dato>
              <Dato label="Grado">{val(solicitud.grado)}</Dato>
              <Dato label="Matrícula o número de control">{val(solicitud.matricula)}</Dato>
            </div>
          </Seccion>

          <Seccion icon={Bus} titulo={`Trayectos (${trayectos.length})`}>
            {trayectos.length === 0 ? <div style={{ color: "#8993A1", fontSize: 13 }}>Sin trayectos registrados.</div> : (
              <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, fontWeight: 600 }}>
                {trayectos.map((t, i) => <li key={i} style={{ marginBottom: 4 }}>{t}</li>)}
              </ol>
            )}
          </Seccion>

          <Seccion icon={Users} titulo={`Datos familiares (${fam.length})`}>
            {fam.length === 0 ? <div style={{ color: "#8993A1", fontSize: 13 }}>Sin familiares registrados.</div> : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 640 }}>
                  <thead>
                    <tr style={{ background: C.navy, color: "#fff", textAlign: "left" }}>
                      {["Nombre", "Parentesco", "Ocupación", "Escolaridad", "Institución", "Ubicación", "Ruta 1", "Ruta 2", "Costo diario"].map((h) => <th key={h} style={{ padding: "7px 8px", whiteSpace: "nowrap" }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {fam.map((f, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.paperDim}` }}>
                        <td style={{ padding: "7px 8px", fontWeight: 600 }}>{val(f.nombre)}</td>
                        <td style={{ padding: "7px 8px" }}>{cat(PARENTESCO, f.parentesco)}</td>
                        <td style={{ padding: "7px 8px" }}>{cat(OCUPACION, f.ocupacion)}</td>
                        <td style={{ padding: "7px 8px" }}>{cat(EDUCACION, f.educacion)}</td>
                        <td style={{ padding: "7px 8px" }}>{val(f.institucion)}</td>
                        <td style={{ padding: "7px 8px" }}>{val(f.ubicacion)}</td>
                        <td style={{ padding: "7px 8px" }}>{val(f.ruta1)}</td>
                        <td style={{ padding: "7px 8px" }}>{val(f.ruta2)}</td>
                        <td style={{ padding: "7px 8px" }}>{f.costoDiario ? dinero(f.costoDiario) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Seccion>

          <Seccion icon={Wallet} titulo="Ingresos y egresos familiares (mensuales)">
            <div style={{ ...grid, marginBottom: 12 }}>
              <Dato label="Ingreso persona 1">{dinero(ing.persona1)}</Dato>
              <Dato label="Ingreso persona 2">{dinero(ing.persona2)}</Dato>
              <Dato label="Total ingresos"><span style={{ color: C.busBlue }}>{dinero(ing.total)}</span></Dato>
            </div>
            <div style={grid}>
              <Dato label="Alimentos">{dinero(egr.alimentos)}</Dato>
              <Dato label="Vestido / calzado">{dinero(egr.vestido)}</Dato>
              <Dato label="Gastos escolares">{dinero(egr.escolares)}</Dato>
              <Dato label="Otro">{dinero(egr.otro)}</Dato>
              <Dato label="Total egresos"><span style={{ color: C.garnet }}>{dinero(egr.total)}</span></Dato>
            </div>
          </Seccion>

          <Seccion icon={Home} titulo="Datos de la vivienda">
            <div style={{ ...grid, marginBottom: 12 }}>
              <Dato label="La vivienda es"><span style={{ textTransform: "capitalize" }}>{val(viv.tipo)}</span></Dato>
              <Dato label="¿Techo de lámina?"><span style={{ textTransform: "uppercase" }}>{val(viv.techoLamina)}</span></Dato>
              <Dato label="Material de las paredes">{cat(MATERIAL, viv.paredes)}</Dato>
              <Dato label="Material del piso">{cat(MATERIAL, viv.piso)}</Dato>
            </div>
            <div style={grid}>
              <Dato label="Servicios">{SERVICIOS.filter(([k]) => viv[k]).map(([, l]) => l).join(", ") || "Ninguno"}</Dato>
              <Dato label="La casa cuenta con">{BIENES.filter(([k]) => viv[k]).map(([, l]) => l).join(", ") || "Ninguno"}</Dato>
            </div>
          </Seccion>

          <Seccion icon={ShieldAlert} titulo="Discapacidad o enfermedad">
            {disc.length === 0 ? <div style={{ color: "#8993A1", fontSize: 13 }}>No se reportó ninguna.</div> : (
              disc.map((d, i) => (
                <div key={i} style={{ ...grid, marginBottom: 8 }}>
                  <Dato label="Persona">{val(d.persona)}</Dato>
                  <Dato label="Detalle" ancho={2}>{val(d.detalle)}</Dato>
                </div>
              ))
            )}
          </Seccion>

          <Seccion icon={FileText} titulo="Documentos adjuntos (PDF)">
            {!solicitud.documentos?.length ? <div style={{ color: "#8993A1", fontSize: 13 }}>Sin documentos.</div> : (
              solicitud.documentos.map((d) => (
                <div key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", padding: "8px 0", borderTop: `1px solid ${C.paperDim}` }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>
                    {LABEL_DOC[d.tipo] || d.tipo.replace(/_/g, " ")}
                    {d.nombre_archivo && <span style={{ fontWeight: 400, color: "#8993A1", fontSize: 12 }}> · {d.nombre_archivo}</span>}
                  </div>
                  <div className="no-print" style={{ display: "flex", gap: 8 }}>
                    <button type="button" onClick={() => abrirDoc(d, false)} style={btnDoc(true)}><Eye size={14} /> Ver</button>
                    <button type="button" onClick={() => abrirDoc(d, true)} style={btnDoc(false)}><Download size={14} /> Descargar</button>
                  </div>
                </div>
              ))
            )}
          </Seccion>
        </div>
      </div>
    </div>
  );
}

const btnDoc = (primario) => ({
  display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, cursor: "pointer",
  fontSize: 13, fontWeight: 700,
  border: primario ? "none" : `1px solid ${C.paperDim}`,
  background: primario ? C.busBlue : "#fff",
  color: primario ? "#fff" : C.navy,
});
