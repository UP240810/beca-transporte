import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Users, UserPlus, Shield, KeyRound, UserX, UserCheck, Loader2, Copy, Check,
} from "lucide-react";
import { C } from "../theme";
import { StaffLayout } from "../components/GovShell";
import { useStaffSesion } from "../context/StaffSesionContext";
import api from "../api";
import BrandLogos from "../components/BrandLogos";

const ROL_LABEL = {
  recaudacion: "Recaudación",
  ventanilla: "Ventanilla",
  camionero: "Camioneros",
  contabilidad: "Contabilidad",
  desarrollo_social: "Desarrollo Social",
};

const HOME = {
  recaudacion: "/admin/solicitudes",
  ventanilla: "/recarga",
  camionero: "/camionero",
  contabilidad: "/contabilidad",
  desarrollo_social: "/admin/solicitudes",
};

export default function AdminPersonal() {
  const { staff, logout } = useStaffSesion();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ nombre: "", usuario: "", correo: "" });
  const [creando, setCreando] = useState(false);
  const [credenciales, setCredenciales] = useState(null);
  const [copiado, setCopiado] = useState(false);

  async function cargar() {
    if (!staff?.token) return;
    setCargando(true);
    setError("");
    try {
      const res = await api.listarPersonal(staff.token);
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, [staff?.token]);

  async function crear(e) {
    e.preventDefault();
    setCreando(true);
    setError("");
    setCredenciales(null);
    try {
      const res = await api.crearPersonal(form, staff.token);
      setCredenciales({ usuario: res.usuario, password: res.passwordTemporal });
      setForm({ nombre: "", usuario: "", correo: "" });
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreando(false);
    }
  }

  async function toggleActivo(p) {
    try {
      await api.setPersonalActivo(p.id, !p.activo, staff.token);
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function resetPw(p) {
    if (!confirm(`¿Restablecer contraseña de ${p.nombre}?`)) return;
    try {
      const res = await api.resetPasswordPersonal(p.id, staff.token);
      setCredenciales({ usuario: res.usuario, password: res.passwordTemporal });
    } catch (err) {
      setError(err.message);
    }
  }

  function copiarCreds() {
    if (!credenciales) return;
    const txt = `Usuario: ${credenciales.usuario}\nContraseña: ${credenciales.password}`;
    navigator.clipboard?.writeText(txt).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  if (!staff) {
    navigate("/acceso");
    return null;
  }

  const home = HOME[staff.rol] || "/acceso";
  const soyJefe = data?.soyJefe ?? staff.esJefe;

  return (
    <StaffLayout
        title="Personal del sistema"
        variant="municipio"
        userLabel={staff?.nombre}
        onLogout={() => { logout(); navigate("/acceso"); }} maxWidth={760}>

      <div style={{ padding: 16 }}>
        {error && (
          <div style={{ background: `${C.garnet}12`, border: `1px solid ${C.garnet}`, color: C.garnet, borderRadius: 10, padding: 12, fontSize: 12.5, marginBottom: 12 }}>
            {error}
          </div>
        )}

        {credenciales && (
          <div style={{ background: `${C.mint}22`, border: `1px solid ${C.mint}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Credenciales temporales</div>
            <div className="f-mono" style={{ fontSize: 13, color: C.ink }}>Usuario: {credenciales.usuario}</div>
            <div className="f-mono" style={{ fontSize: 13, color: C.ink, marginTop: 4 }}>Contraseña: {credenciales.password}</div>
            <button type="button" onClick={copiarCreds} style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, border: "none", background: C.navy, color: "#fff", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {copiado ? <Check size={14} /> : <Copy size={14} />} {copiado ? "Copiado" : "Copiar"}
            </button>
            <p style={{ fontSize: 10.5, color: "#6b7785", marginTop: 8 }}>Entrégalas de forma segura. No se volverán a mostrar igual.</p>
          </div>
        )}

        {soyJefe && (
          <form onSubmit={crear} style={{ background: "#fff", border: `1px solid ${C.paperDim}`, borderRadius: 14, padding: 14, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <UserPlus size={16} color={C.navy} />
              <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>Dar de alta</span>
            </div>
            <input
              required
              placeholder="Nombre completo"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              style={{ width: "100%", boxSizing: "border-box", marginBottom: 8, padding: "10px 12px", borderRadius: 9, border: `1px solid ${C.paperDim}`, fontSize: 13 }}
            />
            <input
              required
              placeholder="Usuario de acceso (ej. ventanilla.03)"
              value={form.usuario}
              onChange={(e) => setForm((f) => ({ ...f, usuario: e.target.value.toLowerCase() }))}
              style={{ width: "100%", boxSizing: "border-box", marginBottom: 8, padding: "10px 12px", borderRadius: 9, border: `1px solid ${C.paperDim}`, fontSize: 13 }}
              className="f-mono"
            />
            <input
              type="email"
              placeholder="Correo (opcional, para recuperar contraseña)"
              value={form.correo}
              onChange={(e) => setForm((f) => ({ ...f, correo: e.target.value }))}
              style={{ width: "100%", boxSizing: "border-box", marginBottom: 10, padding: "10px 12px", borderRadius: 9, border: `1px solid ${C.paperDim}`, fontSize: 13 }}
            />
            <button type="submit" disabled={creando} style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "none", background: C.navy, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {creando ? <Loader2 size={16} className="spin" /> : "Crear cuenta"}
            </button>
          </form>
        )}

        {!soyJefe && (
          <div style={{ fontSize: 12, color: "#6b7785", marginBottom: 12, display: "flex", gap: 6, alignItems: "center" }}>
            <Shield size={14} /> Solo el jefe de área puede dar de alta o desactivar personal.
          </div>
        )}

        <div style={{ background: "#fff", border: `1px solid ${C.paperDim}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.paperDim}`, fontSize: 12, fontWeight: 700, color: C.navy }}>
            Equipo ({data?.personal?.length ?? 0})
          </div>
          {cargando && <div style={{ padding: 16, textAlign: "center", fontSize: 12, color: "#8993A1" }}>Cargando…</div>}
          {!cargando && (data?.personal || []).map((p) => (
            <div key={p.id} style={{ padding: "12px 14px", borderBottom: `1px solid ${C.paperDim}`, display: "flex", gap: 10, alignItems: "center", opacity: p.activo ? 1 : 0.55 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>
                  {p.nombre} {p.esJefe && <span style={{ fontSize: 10, background: C.gold, color: C.navy, borderRadius: 4, padding: "1px 5px", marginLeft: 4 }}>Jefe</span>}
                </div>
                <div className="f-mono" style={{ fontSize: 11, color: "#6b7785" }}>{p.usuario}</div>
                {!p.activo && <div style={{ fontSize: 10, color: C.garnet }}>Inactivo</div>}
              </div>
              {soyJefe && !p.esJefe && (
                <div style={{ display: "flex", gap: 4 }}>
                  <button type="button" title="Restablecer contraseña" onClick={() => resetPw(p)} style={{ background: C.paper, border: "none", borderRadius: 8, padding: 8, cursor: "pointer", color: C.navy }}>
                    <KeyRound size={14} />
                  </button>
                  <button type="button" title={p.activo ? "Desactivar" : "Activar"} onClick={() => toggleActivo(p)} style={{ background: C.paper, border: "none", borderRadius: 8, padding: 8, cursor: "pointer", color: p.activo ? C.garnet : "#1F7A56" }}>
                    {p.activo ? <UserX size={14} /> : <UserCheck size={14} />}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </StaffLayout>
  );
}
