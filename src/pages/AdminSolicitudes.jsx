import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ShieldCheck, ChevronRight, ArrowLeft, User, Phone, Mail,
  GraduationCap, Bus, CheckCircle2, Send, KeyRound, LogOut, Users, Inbox, ShieldAlert,
  Plus, MapPin, History, Ban,
} from "lucide-react";
import { C } from "../theme";
import { StaffLayout } from "../components/GovShell";
import { useStaffSesion } from "../context/StaffSesionContext";
import useIsDesktop from "../hooks/useIsDesktop";
import api from "../api";
import { formatFechaHora } from "../utils";
import BrandLogos from "../components/BrandLogos";

function Badge({ estado }) {
  const map = {
    pendiente: { bg: `${C.gold}22`, color: "#8A6114", label: "Pendiente" },
    corregir: { bg: `${C.garnet}15`, color: C.garnet, label: "En corrección" },
    aprobada: { bg: `${C.mint}33`, color: "#1F7A56", label: "Aprobada" },
    rechazada: { bg: `${C.garnet}22`, color: C.garnet, label: "Rechazada" },
  };
  const s = map[estado];
  return <span style={{ fontSize: 9.5, fontWeight: 700, padding: "3px 8px", borderRadius: 999, background: s.bg, color: s.color }}>{s.label}</span>;
}

function DetalleRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: "flex", gap: 9, alignItems: "flex-start", marginBottom: 10 }}>
      <Icon size={13} color={C.busBlue} style={{ marginTop: 2, flexShrink: 0 }} />
      <div><div style={{ fontSize: 10, color: "#8993A1" }}>{label}</div><div style={{ fontSize: 12.5, color: C.ink, fontWeight: 600 }}>{value}</div></div>
    </div>
  );
}

const inputStyle = {
  width: "100%", border: `1px solid ${C.paperDim}`, borderRadius: 9,
  padding: "9px 11px", fontSize: 12.5, color: C.ink, outline: "none",
  boxSizing: "border-box", background: "#fff",
};

/**
 * Panel para asignar 1–2 rutas oficiales al aprobar.
 * Cada slot puede ser: ruta del catálogo, o "nueva" con nombre + costo.
 */
function AsignarRutas({ trayectos, rutasCatalogo, asignaciones, setAsignaciones }) {
  function setSlot(i, patch) {
    setAsignaciones((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  }

  function agregarSlot() {
    if (asignaciones.length >= 2) return;
    setAsignaciones((prev) => [...prev, { modo: "existente", rutaId: "", nombreNuevo: "", codigoNuevo: "", costo: "15", descuento: "50" }]);
  }

  function quitarSlot(i) {
    if (asignaciones.length <= 1) return;
    setAsignaciones((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div style={{ background: C.paper, border: `1px solid ${C.paperDim}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Asignar ruta(s) oficial(es)</div>
      <p style={{ fontSize: 11, color: "#6b7785", marginTop: 0, marginBottom: 12, lineHeight: 1.45 }}>
        El estudiante indicó estos trayectos. Elige del catálogo (reutilizable) o da de alta una nueva. Normalmente 1 ruta; máximo 2 si hay trasbordo.
      </p>

      {trayectos && trayectos.length > 0 && (
        <div style={{ background: `${C.skyBlue}33`, borderRadius: 9, padding: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.navy, letterSpacing: 0.4, marginBottom: 6 }}>LO QUE PIDIÓ EL ESTUDIANTE</div>
          {trayectos.map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.ink, marginBottom: i < trayectos.length - 1 ? 4 : 0 }}>
              <MapPin size={12} color={C.busBlue} /> {t}
            </div>
          ))}
        </div>
      )}

      {asignaciones.map((slot, i) => (
        <div key={i} style={{ background: "#fff", border: `1px solid ${C.paperDim}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.navy }}>Ruta oficial {i + 1}</span>
            {asignaciones.length > 1 && (
              <button type="button" onClick={() => quitarSlot(i)} style={{ background: "none", border: "none", color: C.garnet, fontSize: 11, cursor: "pointer" }}>
                Quitar
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <button
              type="button"
              onClick={() => setSlot(i, { modo: "existente" })}
              style={{
                flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
                border: `1px solid ${slot.modo === "existente" ? C.busBlue : C.paperDim}`,
                background: slot.modo === "existente" ? C.busBlue : "#fff",
                color: slot.modo === "existente" ? "#fff" : C.ink,
              }}
            >
              Del catálogo
            </button>
            <button
              type="button"
              onClick={() => setSlot(i, { modo: "nueva" })}
              style={{
                flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
                border: `1px solid ${slot.modo === "nueva" ? C.busBlue : C.paperDim}`,
                background: slot.modo === "nueva" ? C.busBlue : "#fff",
                color: slot.modo === "nueva" ? "#fff" : C.ink,
              }}
            >
              Dar de alta nueva
            </button>
          </div>

          {slot.modo === "existente" ? (
            <select
              value={slot.rutaId}
              onChange={(e) => {
                const id = e.target.value;
                const r = rutasCatalogo.find((x) => String(x.id) === String(id));
                setSlot(i, {
                  rutaId: id,
                  costo: r ? String(r.costo_por_viaje ?? 15) : slot.costo,
                  descuento: r ? String(r.descuento_pct ?? 50) : slot.descuento,
                });
              }}
              style={{ ...inputStyle, appearance: "none" }}
            >
              <option value="">Selecciona una ruta…</option>
              {rutasCatalogo.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.codigo ? `${r.codigo} · ` : ""}{r.nombre} · ${r.costo_por_viaje}/viaje · -{r.descuento_pct}%
                </option>
              ))}
            </select>
          ) : (
            <div>
              <label style={{ fontSize: 10.5, fontWeight: 600, color: C.navy, display: "block", marginBottom: 4 }}>Nombre oficial de la ruta</label>
              <input
                style={inputStyle}
                value={slot.nombreNuevo}
                onChange={(e) => setSlot(i, { nombreNuevo: e.target.value })}
                placeholder="Ej. Calvillo Centro → Los Patos"
              />
              <label style={{ fontSize: 10.5, fontWeight: 600, color: C.navy, display: "block", marginBottom: 4, marginTop: 8 }}>Código (opcional)</label>
              <input
                style={inputStyle}
                value={slot.codigoNuevo || ""}
                onChange={(e) => setSlot(i, { codigoNuevo: e.target.value })}
                placeholder="Ej. R001"
              />
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10.5, fontWeight: 600, color: C.navy, display: "block", marginBottom: 4 }}>Precio por viaje ($) *</label>
              <input
                style={inputStyle}
                type="number"
                min="1"
                value={slot.costo}
                onChange={(e) => setSlot(i, { costo: e.target.value })}
                placeholder="Obligatorio"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10.5, fontWeight: 600, color: C.navy, display: "block", marginBottom: 4 }}>Descuento (%)</label>
              <input
                style={inputStyle}
                type="number"
                min="0"
                max="100"
                value={slot.descuento}
                onChange={(e) => setSlot(i, { descuento: e.target.value })}
              />
            </div>
          </div>
          <p style={{ fontSize: 10, color: "#8993A1", margin: "6px 0 0" }}>
            El precio se guarda en la ruta al aprobar (ventanilla lo usa para calcular recargas).
          </p>
        </div>
      ))}

      {asignaciones.length < 2 && (
        <button
          type="button"
          onClick={agregarSlot}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            width: "100%", padding: "8px 0", borderRadius: 9, border: `1px dashed ${C.busBlue}`,
            background: "none", color: C.busBlue, fontSize: 11.5, fontWeight: 600, cursor: "pointer",
          }}
        >
          <Plus size={14} /> Agregar segunda ruta (trasbordo)
        </button>
      )}
    </div>
  );
}

function construirRutasAsignadas(asignaciones) {
  return asignaciones.map((slot) => {
    if (slot.modo === "existente") {
      return { rutaId: Number(slot.rutaId) };
    }
    return {
      nombre: (slot.nombreNuevo || "").trim(),
      costo_por_viaje: Number(slot.costo) || 15,
      descuento_pct: Number(slot.descuento) >= 0 ? Number(slot.descuento) : 50,
    };
  });
}

function validarAsignaciones(asignaciones) {
  for (let i = 0; i < asignaciones.length; i++) {
    const s = asignaciones[i];
    if (s.modo === "existente" && !s.rutaId) {
      return `Elige una ruta del catálogo para la ruta oficial ${i + 1}.`;
    }
    if (s.modo === "nueva" && !(s.nombreNuevo || "").trim()) {
      return `Escribe el nombre de la ruta nueva (slot ${i + 1}).`;
    }
    const costo = Number(s.costo);
    if (!Number.isFinite(costo) || costo <= 0) {
      return `Indica el precio por viaje ($) de la ruta oficial ${i + 1}.`;
    }
  }
  return null;
}

function DetalleSolicitud({ solicitud, token, onBack, onActualizado }) {
  const [modo, setModo] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [credenciales, setCredenciales] = useState(null);
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [rutasCatalogo, setRutasCatalogo] = useState([]);
  const [asignaciones, setAsignaciones] = useState([
    { modo: "existente", rutaId: "", nombreNuevo: "", codigoNuevo: "", costo: "15", descuento: "50" },
  ]);

  useEffect(() => {
    setModo(null);
    setMotivo("");
    setCredenciales(null);
    setError("");
    // Prefill: un slot por trayecto pedido
    const n = Math.max(1, Math.min(3, (solicitud?.trayectos || []).length || 1));
    setAsignaciones(
      Array.from({ length: n }, () => ({
        modo: "existente",
        rutaId: "",
        nombreNuevo: "",
        costo: "15",
        descuento: "50",
      }))
    );
  }, [solicitud?.folio]);

  useEffect(() => {
    if (modo === "aprobar") {
      api.rutas().then(setRutasCatalogo).catch(() => setRutasCatalogo([]));
    }
  }, [modo]);

  async function confirmarRechazo() {
    if (!motivo.trim()) return;
    setProcesando(true);
    setError("");
    try {
      await api.rechazarSolicitud(solicitud.folio, motivo, token);
      setModo("rechazada-ok");
      onActualizado();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  }

  async function confirmarCorreccion() {
    if (!motivo.trim()) return;
    setProcesando(true);
    setError("");
    try {
      const resp = await api.corregirSolicitud(solicitud.folio, motivo, token);
      setCredenciales(resp);
      setModo("correccion-enviada");
      onActualizado();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  }

  async function confirmarAprobacion() {
    const errValid = validarAsignaciones(asignaciones);
    if (errValid) {
      setError(errValid);
      return;
    }
    setProcesando(true);
    setError("");
    try {
      const rutasAsignadas = construirRutasAsignadas(asignaciones);
      const cred = await api.aprobarSolicitud(solicitud.folio, rutasAsignadas, token);
      setCredenciales(cred);
      setModo("aprobada");
      onActualizado();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  }

  const trayectos = solicitud.trayectos?.length
    ? solicitud.trayectos
    : (solicitud.rutas || []);

  return (
    <div style={{ padding: 16 }}>
      {onBack && (
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: C.navy, fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 14 }}>
          <ArrowLeft size={15} /> Volver a solicitudes
        </button>
      )}

      {modo === "aprobada" ? (
        <div style={{ textAlign: "center", padding: "20px 6px" }}>
          <div style={{ width: 54, height: 54, borderRadius: "50%", background: `${C.mint}33`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <CheckCircle2 size={26} color="#1F7A56" />
          </div>
          <div className="f-display" style={{ fontSize: 15.5, fontWeight: 700, color: C.navy }}>Solicitud aprobada</div>
          <p style={{ fontSize: 12, color: "#5B6675", marginTop: 6 }}>
            Se creó la cuenta del alumno{credenciales?.correoEnviado ? <> y se envió un correo con sus datos de acceso a <strong>{credenciales?.correo}</strong></> : <> — el correo con sus datos de acceso <strong>no se pudo enviar</strong>, avísale por otro medio</>}.
          </p>
          <div style={{ marginTop: 16, background: C.navy, borderRadius: 12, padding: 16, textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}><KeyRound size={13} color={C.gold} /><span style={{ fontSize: 10.5, color: C.skyBlue, letterSpacing: 0.5 }}>CREDENCIALES (copia de respaldo)</span></div>
            <div style={{ fontSize: 11, color: C.skyBlue, marginBottom: 2 }}>Usuario</div>
            <div className="f-mono" style={{ fontSize: 14, color: "#fff", fontWeight: 600, marginBottom: 10 }}>{credenciales?.usuario}</div>
            <div style={{ fontSize: 11, color: C.skyBlue, marginBottom: 2 }}>Contraseña temporal</div>
            <div className="f-mono" style={{ fontSize: 14, color: C.gold, fontWeight: 600 }}>{credenciales?.password}</div>
          </div>
        </div>
      ) : modo === "correccion-enviada" ? (
        <div style={{ textAlign: "center", padding: "20px 6px" }}>
          <div style={{ width: 54, height: 54, borderRadius: "50%", background: `${C.gold}26`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <Send size={24} color="#8A6114" />
          </div>
          <div className="f-display" style={{ fontSize: 15.5, fontWeight: 700, color: C.navy }}>Corrección solicitada</div>
          <p style={{ fontSize: 12, color: "#5B6675", marginTop: 6, lineHeight: 1.6 }}>
            {credenciales?.correoEnviado
              ? "Se envió un correo explicando qué corregir. La solicitud sigue activa para que la vuelvan a enviar — no se eliminó."
              : "El correo no se pudo enviar — avísale al estudiante por otro medio. La solicitud sigue activa para que la vuelvan a enviar — no se eliminó."}
          </p>
        </div>
      ) : modo === "rechazada-ok" ? (
        <div style={{ textAlign: "center", padding: "20px 6px" }}>
          <div style={{ width: 54, height: 54, borderRadius: "50%", background: `${C.garnet}18`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <Ban size={24} color={C.garnet} />
          </div>
          <div className="f-display" style={{ fontSize: 15.5, fontWeight: 700, color: C.navy }}>Solicitud rechazada</div>
          <p style={{ fontSize: 12, color: "#5B6675", marginTop: 6, lineHeight: 1.6 }}>
            Quedó registrado en el historial quién rechazó y el motivo. La solicitud ya no aparece en pendientes.
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            {solicitud.foto_base64 && (
              <img src={solicitud.foto_base64} alt={solicitud.nombre} style={{ width: 46, height: 46, borderRadius: 10, objectFit: "cover", border: `1px solid ${C.paperDim}`, flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div className="f-display" style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>{solicitud.nombre} {solicitud.apellidos}</div>
              <Badge estado={solicitud.estado} />
            </div>
          </div>
          <div className="f-mono" style={{ fontSize: 11, color: "#8993A1", marginBottom: 16 }}>{solicitud.folio} · recibida {formatFechaHora(solicitud.creado_en)}</div>

          {Array.isArray(solicitud.eventos) && solicitud.eventos.length > 0 && (
            <div style={{ background: C.paper, border: `1px solid ${C.paperDim}`, borderRadius: 12, padding: 12, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <History size={13} color={C.navy} />
                <span style={{ fontSize: 11.5, fontWeight: 700, color: C.navy }}>Historial de decisiones</span>
              </div>
              {solicitud.eventos.map((ev) => (
                <div key={ev.id} style={{ padding: "8px 0", borderTop: `1px solid ${C.paperDim}`, fontSize: 11.5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontWeight: 700, color: C.navy, textTransform: "capitalize" }}>{ev.accion}</span>
                    <span className="f-mono" style={{ fontSize: 10, color: "#8993A1" }}>{formatFechaHora(ev.fecha)}</span>
                  </div>
                  <div style={{ color: "#5B6675", marginTop: 2 }}>Por: <strong>{ev.usuario}</strong></div>
                  {ev.comentario && <div style={{ color: "#6b7785", marginTop: 2, fontStyle: "italic" }}>{ev.comentario}</div>}
                </div>
              ))}
            </div>
          )}


          {solicitud.direccion && (
            <div style={{ fontSize: 12, color: "#5B6675", marginBottom: 8 }}>
              <strong>Dirección:</strong> {solicitud.direccion}
              {solicitud.colonia_localidad ? ` · ${solicitud.colonia_localidad}` : ""}
              {solicitud.celular ? ` · Cel. ${solicitud.celular}` : ""}
            </div>
          )}

          {solicitud.estudioSocioeconomico && (
            <div style={{ background: C.paper, border: `1px solid ${C.paperDim}`, borderRadius: 12, padding: 12, marginBottom: 14, fontSize: 11.5 }}>
              <div style={{ fontWeight: 700, color: C.navy, marginBottom: 8 }}>Estudio socioeconómico</div>
              <div style={{ color: "#5B6675", marginBottom: 4 }}>
                Vivienda: {solicitud.estudioSocioeconomico.vivienda?.tipo || "—"}
                {solicitud.estudioSocioeconomico.vivienda?.techoLamina ? ` · Techo lámina: ${solicitud.estudioSocioeconomico.vivienda.techoLamina}` : ""}
              </div>
              <div style={{ color: "#5B6675", marginBottom: 4 }}>
                Ingresos: ${solicitud.estudioSocioeconomico.ingresos?.total ?? "—"} · Egresos: ${solicitud.estudioSocioeconomico.egresos?.total ?? "—"}
              </div>
              <div style={{ color: "#5B6675" }}>
                Familiares registrados: {(solicitud.estudioSocioeconomico.familiares || []).length}
              </div>
              {(solicitud.estudioSocioeconomico.familiares || []).slice(0, 5).map((f, i) => (
                <div key={i} style={{ marginTop: 4, paddingTop: 4, borderTop: `1px solid ${C.paperDim}`, color: C.ink }}>
                  {f.nombre || "Sin nombre"} · parentesco {f.parentesco || "—"} · occ. {f.ocupacion || "—"}
                </div>
              ))}
            </div>
          )}

          {Array.isArray(solicitud.documentos) && solicitud.documentos.length > 0 && (
            <div style={{ background: C.paper, border: `1px solid ${C.paperDim}`, borderRadius: 12, padding: 12, marginBottom: 14 }}>
              <div style={{ fontWeight: 700, color: C.navy, marginBottom: 8, fontSize: 12 }}>Documentos PDF</div>
              {solicitud.documentos.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={async () => {
                    try {
                      const data = await api.descargarDocumentoSolicitud(solicitud.folio, d.id, token);
                      const a = document.createElement("a");
                      a.href = data.dataBase64;
                      a.download = data.nombreArchivo || `${d.tipo}.pdf`;
                      a.click();
                    } catch (err) {
                      setError(err.message);
                    }
                  }}
                  style={{
                    display: "block", width: "100%", textAlign: "left", marginBottom: 6,
                    padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.paperDim}`,
                    background: "#fff", fontSize: 11.5, color: C.busBlue, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Descargar: {d.tipo.replace(/_/g, " ")} {d.nombre_archivo ? `(${d.nombre_archivo})` : ""}
                </button>
              ))}
            </div>
          )}

          {solicitud.estado === "corregir" && solicitud.motivo_correccion && (
            <div style={{ background: `${C.garnet}10`, border: `1px solid ${C.garnet}`, borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 11.5, color: C.garnet }}>
              <strong>Corrección ya solicitada:</strong> {solicitud.motivo_correccion}
            </div>
          )}

          <div style={{ background: "#fff", border: `1px solid ${C.paperDim}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: C.busBlue, letterSpacing: 0.5, marginBottom: 10 }}>CONTACTO</div>
            <DetalleRow icon={Phone} label="Teléfono" value={solicitud.telefono} />
            <DetalleRow icon={Mail} label="Correo" value={solicitud.correo} />
          </div>

          <div style={{ background: "#fff", border: `1px solid ${C.paperDim}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: C.busBlue, letterSpacing: 0.5, marginBottom: 10 }}>ESCOLARES</div>
            <DetalleRow icon={GraduationCap} label="Escuela" value={solicitud.escuela} />
            <DetalleRow icon={GraduationCap} label="Carrera" value={solicitud.carrera} />
            <DetalleRow icon={GraduationCap} label="Grado" value={solicitud.grado} />
            <DetalleRow icon={User} label="Matrícula" value={solicitud.matricula} />
          </div>

          <div style={{ background: "#fff", border: `1px solid ${C.paperDim}`, borderRadius: 12, padding: 14, marginBottom: 18 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: C.busBlue, letterSpacing: 0.5, marginBottom: 10 }}>TRAYECTO(S) QUE INDICÓ</div>
            {trayectos.length === 0 ? (
              <div style={{ fontSize: 12, color: "#8993A1" }}>Sin trayectos registrados.</div>
            ) : (
              trayectos.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: C.ink, marginBottom: i < trayectos.length - 1 ? 6 : 0 }}>
                  <Bus size={13} color={C.busBlue} /> {r}
                </div>
              ))
            )}
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: `${C.garnet}12`, border: `1px solid ${C.garnet}`, color: C.garnet, borderRadius: 9, padding: "10px 12px", fontSize: 11.5, marginBottom: 14 }}>
              <ShieldAlert size={13} /> {error}
            </div>
          )}

          {solicitud.estado === "aprobada" ? (
            <div style={{ fontSize: 12, color: "#8993A1", textAlign: "center", padding: "10px 0" }}>Esta solicitud ya fue aprobada.</div>
          ) : modo === "rechazar" ? (
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Motivo del rechazo (queda en el historial)</div>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
                placeholder="Ej. No cumple requisitos de residencia / documentos incompletos…"
                style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${C.paperDim}`, borderRadius: 9, padding: 10, fontSize: 12.5, resize: "vertical", marginBottom: 10 }}
              />
              {error && <div style={{ fontSize: 11.5, color: C.garnet, marginBottom: 8 }}>{error}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => { setModo(null); setMotivo(""); setError(""); }} style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: `1px solid ${C.paperDim}`, background: "#fff", color: C.navy, fontSize: 12, cursor: "pointer" }}>Cancelar</button>
                <button type="button" onClick={confirmarRechazo} disabled={!motivo.trim() || procesando} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", borderRadius: 9, border: "none", background: C.garnet, color: "#fff", fontSize: 12, fontWeight: 700, cursor: motivo.trim() ? "pointer" : "not-allowed", opacity: motivo.trim() ? 1 : 0.5 }}>
                  <Ban size={14} /> {procesando ? "Guardando…" : "Confirmar rechazo"}
                </button>
              </div>
            </div>
          ) : modo === "corregir" ? (
            <div style={{ background: C.paper, border: `1px solid ${C.paperDim}`, borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: C.navy, marginBottom: 8 }}>¿Qué debe corregir el estudiante?</div>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej. La matrícula no coincide con el formato registrado por la escuela."
                rows={3}
                style={{ width: "100%", border: `1px solid ${C.paperDim}`, borderRadius: 9, padding: 10, fontSize: 12.5, boxSizing: "border-box", resize: "none", outline: "none" }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button onClick={() => setModo(null)} disabled={procesando} style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: `1px solid ${C.paperDim}`, background: "#fff", color: C.ink, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Cancelar
                </button>
                <button onClick={confirmarCorreccion} disabled={!motivo.trim() || procesando} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", borderRadius: 9, border: "none", background: C.garnet, color: "#fff", fontSize: 12, fontWeight: 700, cursor: motivo.trim() ? "pointer" : "not-allowed", opacity: motivo.trim() ? 1 : 0.5 }}>
                  <Send size={13} /> {procesando ? "Enviando…" : "Enviar corrección"}
                </button>
              </div>
            </div>
          ) : modo === "aprobar" ? (
            <div>
              <AsignarRutas
                trayectos={trayectos}
                rutasCatalogo={rutasCatalogo}
                asignaciones={asignaciones}
                setAsignaciones={setAsignaciones}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setModo(null); setError(""); }} disabled={procesando} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: `1px solid ${C.paperDim}`, background: "#fff", color: C.ink, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                  Cancelar
                </button>
                <button onClick={confirmarAprobacion} disabled={procesando} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px 0", borderRadius: 10, border: "none", background: C.busBlue, color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  <CheckCircle2 size={14} /> {procesando ? "Procesando…" : "Confirmar aprobación"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setModo("rechazar")} disabled={procesando} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px 0", borderRadius: 10, border: `1px solid ${C.paperDim}`, background: "#fff", color: C.garnet, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                <Ban size={14} /> Rechazar
              </button>
              <button type="button" onClick={() => setModo("corregir")} disabled={procesando} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px 0", borderRadius: 10, border: `1px solid ${C.garnet}`, background: "#fff", color: C.garnet, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                <Send size={14} /> Pedir corrección
              </button>
              <button onClick={() => setModo("aprobar")} disabled={procesando} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px 0", borderRadius: 10, border: "none", background: C.busBlue, color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                <CheckCircle2 size={14} /> Aprobar
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ListaSolicitudes({ filtro, setFiltro, conteos, filtradas, cargando, seleccionada, onSelect }) {
  return (
    <div>
      <div className="f-display" style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 3 }}>Solicitudes</div>
      <div style={{ fontSize: 11.5, color: "#6b7785", marginBottom: 14 }}>Revisa, aprueba o pide correcciones.</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[["pendiente", "Pendientes"], ["corregir", "En corrección"], ["aprobada", "Aprobadas"], ["rechazada", "Rechazadas"]].map(([key, label]) => (
          <button key={key} onClick={() => setFiltro(key)} style={{ flex: 1, padding: "8px 4px", borderRadius: 9, fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1px solid ${filtro === key ? C.busBlue : C.paperDim}`, background: filtro === key ? C.busBlue : "#fff", color: filtro === key ? "#fff" : C.ink }}>
            {label} ({conteos[key] ?? "…"})
          </button>
        ))}
      </div>
      <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${C.paperDim}`, overflow: "hidden" }}>
        {cargando ? (
          <div style={{ padding: 20, textAlign: "center", fontSize: 12, color: "#8993A1" }}>Cargando…</div>
        ) : filtradas.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", fontSize: 12, color: "#8993A1" }}>No hay solicitudes en esta categoría.</div>
        ) : (
          filtradas.map((s, i) => (
            <button
              key={s.folio}
              onClick={() => onSelect(s)}
              style={{
                width: "100%", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 14px", border: "none", cursor: "pointer",
                background: seleccionada?.folio === s.folio ? `${C.busBlue}0F` : "#fff",
                borderBottom: i < filtradas.length - 1 ? `1px solid ${C.paperDim}` : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                {s.foto_base64 && (
                  <img src={s.foto_base64} alt={s.nombre} style={{ width: 34, height: 34, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: C.navy }}>{s.nombre} {s.apellidos}</span>
                    <Badge estado={s.estado} />
                  </div>
                  <div className="f-mono" style={{ fontSize: 10.5, color: "#8993A1" }}>{s.folio} · {formatFechaHora(s.creado_en)}</div>
                </div>
              </div>
              <ChevronRight size={15} color="#8993A1" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default function AdminSolicitudes() {
  const navigate = useNavigate();
  const { staff, logout } = useStaffSesion();
  const isDesktop = useIsDesktop();
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionada, setSeleccionada] = useState(null);
  const [filtro, setFiltro] = useState("pendiente");

  const cargar = useCallback(() => {
    setCargando(true);
    api.solicitudes(filtro, staff.token)
      .then(setSolicitudes)
      .catch(() => setSolicitudes([]))
      .finally(() => setCargando(false));
  }, [filtro, staff.token]);

  useEffect(() => { cargar(); setSeleccionada(null); }, [cargar]);

  function salir() {
    logout();
    navigate("/acceso");
  }

  const conteos = { [filtro]: solicitudes.length };
  const solicitudActual = solicitudes.find((s) => s.folio === seleccionada?.folio) || seleccionada;

  return (
    <StaffLayout
        title="Desarrollo Social · Solicitudes"
        variant="desarrollo"
        userLabel={staff?.nombre}
        onLogout={() => { logout(); navigate("/acceso"); }}
        extra={
          <button type="button" onClick={() => navigate("/personal")} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12 }}>Personal</button>
        } maxWidth={1200}>

      {isDesktop ? (
        <div className="split-layout" style={{ padding: 20 }}>
          <div className="split-left">
            <ListaSolicitudes filtro={filtro} setFiltro={setFiltro} conteos={conteos} filtradas={solicitudes} cargando={cargando} seleccionada={solicitudActual} onSelect={async (s) => {
            setSeleccionada(s);
            try {
              const det = await api.solicitudDetalle(s.folio, staff.token);
              setSeleccionada(det);
            } catch (_) {}
          }} />
          </div>
          <div className="split-right">
            <div style={{ background: "#fff", border: `1px solid ${C.paperDim}`, borderRadius: 14, minHeight: 300 }}>
              {solicitudActual ? (
                <DetalleSolicitud solicitud={solicitudActual} token={staff.token} onActualizado={cargar} />
              ) : (
                <div style={{ padding: 40, textAlign: "center", color: "#8993A1" }}>
                  <Inbox size={30} style={{ marginBottom: 10, opacity: 0.5 }} />
                  <div style={{ fontSize: 12.5 }}>Selecciona una solicitud de la lista para ver el detalle.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : seleccionada ? (
        <DetalleSolicitud solicitud={solicitudActual} token={staff.token} onBack={() => setSeleccionada(null)} onActualizado={cargar} />
      ) : (
        <div style={{ padding: 16 }}>
          <ListaSolicitudes filtro={filtro} setFiltro={setFiltro} conteos={conteos} filtradas={solicitudes} cargando={cargando} seleccionada={null} onSelect={async (s) => {
            setSeleccionada(s);
            try {
              const det = await api.solicitudDetalle(s.folio, staff.token);
              setSeleccionada(det);
            } catch (_) {}
          }} />
        </div>
      )}
    </StaffLayout>
  );
}
