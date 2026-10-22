import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ShieldCheck, LogOut, UserPlus, Users, X, Bus, CheckCircle2, ShieldAlert,
  FileSpreadsheet, Ban, RefreshCw, UserX, UserCheck,
} from "lucide-react";
import { C } from "../theme";
import { StaffHeader, A11yWidget } from "../components/GovShell";
import { useStaffSesion } from "../context/StaffSesionContext";
import api from "../api";
import BrandLogos from "../components/BrandLogos";

const inputStyle = { width: "100%", border: `1px solid ${C.paperDim}`, borderRadius: 9, padding: "9px 11px", fontSize: 12.5, color: C.ink, outline: "none", boxSizing: "border-box", background: "#fff" };

function Campo({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: "block", fontSize: 10.5, fontWeight: 600, color: C.navy, marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

function FormularioAltaManual({ token, rutasDisponibles, onCreado, onCancelar }) {
  const [form, setForm] = useState({ nombre: "", apellidos: "", telefono: "", correo: "", escuela: "", carrera: "", grado: "", matricula: "" });
  const [rutaIds, setRutaIds] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function toggleRuta(id) {
    setRutaIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : prev.length < 3 ? [...prev, id] : prev));
  }

  async function enviar(e) {
    e.preventDefault();
    if (Object.values(form).some((v) => !v.trim()) || rutaIds.length === 0) {
      setError("Completa todos los campos y elige al menos una ruta.");
      return;
    }
    setError("");
    setEnviando(true);
    try {
      const resp = await api.altaManualAlumno({ ...form, rutaIds }, token);
      setResultado(resp);
      onCreado();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (resultado) {
    return (
      <div style={{ background: "#fff", border: `1px solid ${C.paperDim}`, borderRadius: 12, padding: 18, textAlign: "center" }}>
        <CheckCircle2 size={26} color="#1F7A56" style={{ marginBottom: 8 }} />
        <div className="f-display" style={{ fontSize: 14.5, fontWeight: 700, color: C.navy }}>Alumno dado de alta</div>
        <p style={{ fontSize: 11.5, color: "#5B6675", marginTop: 6 }}>
          {resultado.correoEnviado ? <>Se envió un correo con sus datos de acceso a <strong>{resultado.correo}</strong>.</> : <>El correo no se pudo enviar — avísale por otro medio.</>}
        </p>
        <div style={{ marginTop: 12, background: C.paper, borderRadius: 9, padding: 12, textAlign: "left", fontSize: 11.5 }}>
          <div>Usuario: <span className="f-mono" style={{ fontWeight: 700 }}>{resultado.usuario}</span></div>
          <div>Contraseña: <span className="f-mono" style={{ fontWeight: 700, color: C.busBlue }}>{resultado.password}</span></div>
        </div>
        <button onClick={onCancelar} style={{ marginTop: 14, background: "none", border: `1px solid ${C.paperDim}`, borderRadius: 9, padding: "8px 16px", fontSize: 12, color: C.navy, cursor: "pointer" }}>Cerrar</button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} style={{ background: "#fff", border: `1px solid ${C.paperDim}`, borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div className="f-display" style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>Alta manual de alumno</div>
        <button type="button" onClick={onCancelar} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} color="#8993A1" /></button>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}><Campo label="Nombre(s)"><input style={inputStyle} value={form.nombre} onChange={set("nombre")} /></Campo></div>
        <div style={{ flex: 1 }}><Campo label="Apellidos"><input style={inputStyle} value={form.apellidos} onChange={set("apellidos")} /></Campo></div>
      </div>
      <Campo label="Teléfono"><input style={inputStyle} value={form.telefono} onChange={set("telefono")} placeholder="465 123 4567" /></Campo>
      <Campo label="Correo"><input style={inputStyle} type="email" value={form.correo} onChange={set("correo")} /></Campo>
      <Campo label="Escuela"><input style={inputStyle} value={form.escuela} onChange={set("escuela")} /></Campo>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}><Campo label="Carrera"><input style={inputStyle} value={form.carrera} onChange={set("carrera")} /></Campo></div>
        <div style={{ flex: 1 }}><Campo label="Grado"><input style={inputStyle} value={form.grado} onChange={set("grado")} placeholder="6to semestre" /></Campo></div>
      </div>
      <Campo label="Matrícula"><input style={inputStyle} value={form.matricula} onChange={set("matricula")} placeholder="UPA-20231045" /></Campo>

      <Campo label={`Ruta(s) — hasta 3 (${rutaIds.length} seleccionada${rutaIds.length !== 1 ? "s" : ""})`}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {rutasDisponibles.map((r) => (
            <button key={r.id} type="button" onClick={() => toggleRuta(r.id)} style={{ display: "flex", alignItems: "center", gap: 8, textAlign: "left", padding: "8px 10px", borderRadius: 8, border: `1px solid ${rutaIds.includes(r.id) ? C.busBlue : C.paperDim}`, background: rutaIds.includes(r.id) ? `${C.busBlue}0F` : "#fff", cursor: "pointer" }}>
              <Bus size={12} color={rutaIds.includes(r.id) ? C.busBlue : "#8993A1"} />
              <span style={{ fontSize: 11.5, color: C.ink }}>{r.nombre}</span>
            </button>
          ))}
        </div>
      </Campo>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: `${C.garnet}12`, border: `1px solid ${C.garnet}`, color: C.garnet, borderRadius: 8, padding: "8px 10px", fontSize: 11, marginBottom: 10 }}>
          <ShieldAlert size={12} /> {error}
        </div>
      )}

      <button type="submit" disabled={enviando} style={{ width: "100%", padding: "10px 0", borderRadius: 9, border: "none", background: C.busBlue, color: "#fff", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>
        {enviando ? "Creando…" : "Crear cuenta"}
      </button>
    </form>
  );
}

function AccionesAlumno({ alumno, token, onHecho }) {
  const [abierto, setAbierto] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function accion(fn) {
    setProcesando(true);
    setError("");
    setMsg("");
    try {
      const resp = await fn();
      setMsg(resp.mensaje || "Listo.");
      onHecho();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        style={{ marginTop: 6, fontSize: 10.5, fontWeight: 600, color: C.busBlue, background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        Gestionar pase ›
      </button>
    );
  }

  return (
    <div style={{ marginTop: 8, background: C.paper, borderRadius: 8, padding: 10 }}>
      {alumno.activo ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button
            disabled={procesando}
            onClick={() => {
              if (window.confirm(`¿Invalidar el QR actual de ${alumno.nombre}?\n\nÚtil si reportó la tarjeta perdida o robada. Sigue activo: al abrir su app obtiene un código nuevo.`)) {
                accion(() => api.revocarQrAlumno(alumno.matricula, token));
              }
            }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.gold}`, background: "#fff", color: "#8A6114", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
          >
            <Ban size={12} /> Revocar QR (tarjeta perdida)
          </button>
          <button
            disabled={procesando}
            onClick={() => {
              if (window.confirm(`¿Dar de baja a ${alumno.nombre} del programa?\n\nSe invalidará su QR y no podrá iniciar sesión. El historial se conserva.`)) {
                accion(() => api.bajaAlumno(alumno.matricula, token));
              }
            }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.garnet}`, background: "#fff", color: C.garnet, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
          >
            <UserX size={12} /> Dar de baja del programa
          </button>
        </div>
      ) : (
        <button
          disabled={procesando}
          onClick={() => accion(() => api.reactivarAlumno(alumno.matricula, token))}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderRadius: 8, border: `1px solid #1F7A56`, background: "#fff", color: "#1F7A56", fontSize: 11, fontWeight: 600, cursor: "pointer", width: "100%" }}
        >
          <UserCheck size={12} /> Reactivar alumno
        </button>
      )}
      <button onClick={() => { setAbierto(false); setMsg(""); setError(""); }} style={{ marginTop: 6, background: "none", border: "none", fontSize: 10.5, color: "#8993A1", cursor: "pointer" }}>
        Cerrar
      </button>
      {msg && <div style={{ marginTop: 6, fontSize: 11, color: "#1F7A56" }}>{msg}</div>}
      {error && <div style={{ marginTop: 6, fontSize: 11, color: C.garnet }}>{error}</div>}
      {procesando && <div style={{ marginTop: 6, fontSize: 11, color: "#8993A1" }}>Procesando…</div>}
    </div>
  );
}

export default function AdminAlumnos() {
  const navigate = useNavigate();
  const { staff, logout } = useStaffSesion();
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [rutasDisponibles, setRutasDisponibles] = useState([]);
  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [errorExport, setErrorExport] = useState("");

  function cargar() {
    setCargando(true);
    api.listarAlumnos(staff.token).then(setAlumnos).catch(() => setAlumnos([])).finally(() => setCargando(false));
  }

  useEffect(() => { cargar(); api.rutas().then(setRutasDisponibles).catch(() => {}); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function salir() { logout(); navigate("/acceso"); }

  async function reporteMensual() {
    const mes = window.prompt("Mes (YYYY-MM):", new Date().toISOString().slice(0, 7));
    if (!mes) return;
    try {
      const r = await api.reportesViajesMensual(mes, staff.token);
      alert(`Mes ${r.mes}: ${r.totalViajes} viajes\n100%: $${r.sum100}\n90%: $${r.sum90}\n50%: $${r.sum50}\n40%: $${r.sum40}`);
    } catch (e) { alert(e.message); }
  }

  async function exportar() {
    setExportando(true);
    setErrorExport("");
    try {
      await api.exportarBeneficiarios(staff.token);
    } catch (err) {
      setErrorExport(err.message);
    } finally {
      setExportando(false);
    }
  }

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: 640, background: C.paper }}>
      <StaffHeader
        title="Beneficiarios"
        variant="desarrollo"
        userLabel={staff?.nombre}
        onLogout={() => { logout(); navigate("/acceso"); }}
      />
      <A11yWidget />

      <div style={{ padding: 16 }}>
        <div className="f-display" style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 3 }}>Alumnos</div>
        <div style={{ fontSize: 11.5, color: "#6b7785", marginBottom: 14 }}>
          {alumnos.filter((a) => a.activo).length} activos · {alumnos.filter((a) => !a.activo).length} dados de baja
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button onClick={() => setMostrarAlta((m) => !m)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", borderRadius: 9, border: `1px solid ${C.busBlue}`, background: mostrarAlta ? C.busBlue : "#fff", color: mostrarAlta ? "#fff" : C.busBlue, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            <UserPlus size={14} /> Alta manual
          </button>
          <button onClick={exportar} disabled={exportando} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", borderRadius: 9, border: "none", background: C.gold, color: C.navy, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            <FileSpreadsheet size={14} /> {exportando ? "Generando…" : "Exportar Excel"}
          </button>
        </div>
        {errorExport && <div style={{ fontSize: 11, color: C.garnet, marginBottom: 10 }}>{errorExport}</div>}

        {mostrarAlta && (
          <div style={{ marginBottom: 16 }}>
            <FormularioAltaManual token={staff.token} rutasDisponibles={rutasDisponibles} onCreado={cargar} onCancelar={() => setMostrarAlta(false)} />
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <Users size={13} color={C.navy} />
          <span className="f-display" style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>Todos los alumnos</span>
        </div>
        <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${C.paperDim}`, overflow: "hidden" }}>
          {cargando ? (
            <div style={{ padding: 20, textAlign: "center", fontSize: 12, color: "#8993A1" }}>Cargando…</div>
          ) : alumnos.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", fontSize: 12, color: "#8993A1" }}>Aún no hay alumnos registrados.</div>
          ) : (
            alumnos.map((a, i) => (
              <div key={a.matricula} style={{ padding: "11px 14px", borderBottom: i < alumnos.length - 1 ? `1px solid ${C.paperDim}` : "none", opacity: a.activo ? 1 : 0.7 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: C.navy }}>{a.nombre}</span>
                  {a.activo ? (
                    <span className="f-mono" style={{ fontSize: 11, fontWeight: 700, color: "#1F7A56" }}>{a.viajesRestantes} viajes</span>
                  ) : (
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.garnet, background: `${C.garnet}15`, padding: "2px 8px", borderRadius: 999 }}>Baja</span>
                  )}
                </div>
                <div className="f-mono" style={{ fontSize: 10.5, color: "#8993A1", marginTop: 2 }}>{a.matricula}</div>
                <div style={{ fontSize: 10.5, color: "#6b7785", marginTop: 2 }}>{a.rutas.join(" / ") || "Sin ruta asignada"}</div>
                <AccionesAlumno alumno={a} token={staff.token} onHecho={cargar} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
