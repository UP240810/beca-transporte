import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ShieldCheck, LogOut, Bug, Inbox, CheckCircle2, Clock, XCircle, RefreshCw,
} from "lucide-react";
import { C } from "../theme";
import { StaffHeader, A11yWidget } from "../components/GovShell";
import { useStaffSesion } from "../context/StaffSesionContext";
import useIsDesktop from "../hooks/useIsDesktop";
import api from "../api";
import { formatFechaHora } from "../utils";
import BrandLogos from "../components/BrandLogos";

const ESTADOS = [
  { key: "", label: "Todos" },
  { key: "nuevo", label: "Nuevos" },
  { key: "en_revision", label: "En revisión" },
  { key: "resuelto", label: "Resueltos" },
  { key: "descartado", label: "Descartados" },
];

const ESTADO_UI = {
  nuevo: { bg: `${C.gold}22`, color: "#8A6114", label: "Nuevo" },
  en_revision: { bg: `${C.busBlue}18`, color: C.busBlue, label: "En revisión" },
  resuelto: { bg: `${C.mint}33`, color: "#1F7A56", label: "Resuelto" },
  descartado: { bg: `${C.paperDim}`, color: "#5B6675", label: "Descartado" },
};

function BadgeEstado({ estado }) {
  const s = ESTADO_UI[estado] || ESTADO_UI.nuevo;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, background: s.bg, color: s.color, borderRadius: 999, padding: "3px 8px" }}>
      {s.label}
    </span>
  );
}

export default function AdminBugs() {
  const navigate = useNavigate();
  const { staff, logout } = useStaffSesion();
  const isDesktop = useIsDesktop();
  const [filtro, setFiltro] = useState("nuevo");
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);
  const [error, setError] = useState("");
  const [actualizando, setActualizando] = useState(false);

  const cargar = useCallback(() => {
    setCargando(true);
    setError("");
    api.listarBugs(staff.token, filtro || null)
      .then((data) => setReportes(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, [staff.token, filtro]);

  useEffect(() => { cargar(); }, [cargar]);

  async function cambiarEstado(id, estado) {
    setActualizando(true);
    setError("");
    try {
      await api.actualizarBug(id, estado, staff.token);
      setReportes((prev) => prev.map((r) => (r.id === id ? { ...r, estado } : r)));
      if (seleccionado?.id === id) setSeleccionado((s) => ({ ...s, estado }));
      // Si el filtro actual ya no aplica, recargar
      if (filtro && filtro !== estado) {
        setReportes((prev) => prev.filter((r) => r.id !== id));
        setSeleccionado(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActualizando(false);
    }
  }

  function salir() {
    logout();
    navigate("/acceso");
  }

  return (
    <div className={isDesktop ? "app-shell wide" : "app-shell"} style={{ background: C.paper, minHeight: "100vh" }}>
      <StaffHeader
        title="Reportes de fallas"
        variant="municipio"
        userLabel={staff?.nombre}
        onLogout={() => { logout(); navigate("/acceso"); }}
      />
      <A11yWidget />

      <div style={{ padding: isDesktop ? 20 : 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div className="f-display" style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>Reportes de errores</div>
          <button type="button" onClick={cargar} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: `1px solid ${C.paperDim}`, borderRadius: 8, padding: "6px 10px", fontSize: 11, color: C.navy, cursor: "pointer" }}>
            <RefreshCw size={12} /> Actualizar
          </button>
        </div>
        <div style={{ fontSize: 11.5, color: "#6b7785", marginBottom: 12 }}>
          Llegan desde la página pública de Ayuda (/ayuda).
        </div>

        <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 14 }}>
          {ESTADOS.map((e) => (
            <button
              key={e.key || "all"}
              type="button"
              onClick={() => { setFiltro(e.key); setSeleccionado(null); }}
              style={{
                flexShrink: 0, padding: "7px 12px", borderRadius: 999, border: "none", cursor: "pointer",
                fontSize: 11.5, fontWeight: 700,
                background: filtro === e.key ? C.navy : "#fff",
                color: filtro === e.key ? "#fff" : C.navy,
                boxShadow: filtro === e.key ? "none" : `inset 0 0 0 1px ${C.paperDim}`,
              }}
            >
              {e.label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: `${C.garnet}12`, border: `1px solid ${C.garnet}`, color: C.garnet, borderRadius: 9, padding: "10px 12px", fontSize: 12, marginBottom: 12 }}>
            {error}
          </div>
        )}

        {isDesktop ? (
          <div className="split-layout">
            <div className="split-left">
              <Lista reportes={reportes} cargando={cargando} seleccionado={seleccionado} onSelect={setSeleccionado} />
            </div>
            <div className="split-right">
              {seleccionado ? (
                <Detalle reporte={seleccionado} onCambiar={cambiarEstado} actualizando={actualizando} />
              ) : (
                <div style={{ background: "#fff", border: `1px dashed ${C.paperDim}`, borderRadius: 14, padding: 40, textAlign: "center", color: "#8993A1" }}>
                  <Bug size={28} style={{ opacity: 0.4, marginBottom: 8 }} />
                  <div style={{ fontSize: 12 }}>Selecciona un reporte para ver el detalle y cambiar su estado.</div>
                </div>
              )}
            </div>
          </div>
        ) : (
          seleccionado ? (
            <>
              <button type="button" onClick={() => setSeleccionado(null)} style={{ background: "none", border: "none", color: C.busBlue, fontSize: 12, marginBottom: 10, cursor: "pointer", padding: 0 }}>
                ← Volver a la lista
              </button>
              <Detalle reporte={seleccionado} onCambiar={cambiarEstado} actualizando={actualizando} />
            </>
          ) : (
            <Lista reportes={reportes} cargando={cargando} seleccionado={seleccionado} onSelect={setSeleccionado} />
          )
        )}
      </div>
    </div>
  );
}

function Lista({ reportes, cargando, seleccionado, onSelect }) {
  if (cargando) {
    return <div style={{ textAlign: "center", padding: 24, color: "#8993A1", fontSize: 12 }}>Cargando reportes…</div>;
  }
  if (reportes.length === 0) {
    return (
      <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${C.paperDim}`, padding: 28, textAlign: "center", color: "#8993A1" }}>
        <Inbox size={22} style={{ opacity: 0.5, marginBottom: 8 }} />
        <div style={{ fontSize: 12 }}>No hay reportes en este filtro.</div>
      </div>
    );
  }
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${C.paperDim}`, overflow: "hidden" }}>
      {reportes.map((r, i) => (
        <button
          key={r.id}
          type="button"
          onClick={() => onSelect(r)}
          style={{
            width: "100%", textAlign: "left", display: "block", padding: "12px 14px", border: "none", cursor: "pointer",
            background: seleccionado?.id === r.id ? `${C.busBlue}0F` : "#fff",
            borderBottom: i < reportes.length - 1 ? `1px solid ${C.paperDim}` : "none",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: C.navy }}>{r.titulo}</span>
            <BadgeEstado estado={r.estado} />
          </div>
          <div style={{ fontSize: 10.5, color: "#8993A1" }}>
            {formatFechaHora(r.creado_en)}
            {r.rol ? ` · ${r.rol}` : ""}
            {r.pagina ? ` · ${r.pagina}` : ""}
          </div>
        </button>
      ))}
    </div>
  );
}

function Detalle({ reporte, onCambiar, actualizando }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.paperDim}`, borderRadius: 14, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
        <div className="f-display" style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>{reporte.titulo}</div>
        <BadgeEstado estado={reporte.estado} />
      </div>
      <div className="f-mono" style={{ fontSize: 10.5, color: "#8993A1", marginBottom: 12 }}>
        #{reporte.id} · {formatFechaHora(reporte.creado_en)}
      </div>

      <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.5, whiteSpace: "pre-wrap", marginBottom: 14 }}>
        {reporte.descripcion}
      </div>

      <div style={{ background: C.paper, borderRadius: 10, padding: 12, fontSize: 12, marginBottom: 14 }}>
        <div><strong>Nombre:</strong> {reporte.nombre || "—"}</div>
        <div style={{ marginTop: 4 }}><strong>Correo:</strong> {reporte.correo || "—"}</div>
        <div style={{ marginTop: 4 }}><strong>Rol:</strong> {reporte.rol || "—"}</div>
        <div style={{ marginTop: 4 }}><strong>Página:</strong> {reporte.pagina || "—"}</div>
      </div>

      <div style={{ fontSize: 11.5, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Cambiar estado</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <button type="button" disabled={actualizando || reporte.estado === "en_revision"} onClick={() => onCambiar(reporte.id, "en_revision")} style={btnEstado(C.busBlue)}>
          <Clock size={13} /> En revisión
        </button>
        <button type="button" disabled={actualizando || reporte.estado === "resuelto"} onClick={() => onCambiar(reporte.id, "resuelto")} style={btnEstado("#1F7A56")}>
          <CheckCircle2 size={13} /> Resuelto
        </button>
        <button type="button" disabled={actualizando || reporte.estado === "descartado"} onClick={() => onCambiar(reporte.id, "descartado")} style={btnEstado(C.garnet)}>
          <XCircle size={13} /> Descartar
        </button>
        <button type="button" disabled={actualizando || reporte.estado === "nuevo"} onClick={() => onCambiar(reporte.id, "nuevo")} style={btnEstado("#8A6114")}>
          Reabrir
        </button>
      </div>
    </div>
  );
}

function btnEstado(color) {
  return {
    display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 9,
    border: `1px solid ${color}`, background: "#fff", color, fontSize: 11.5, fontWeight: 700, cursor: "pointer",
  };
}
