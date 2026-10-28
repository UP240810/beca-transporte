import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { C } from "../theme";
import { useStaffSesion } from "../context/StaffSesionContext";
import PasswordInput from "../components/PasswordInput";
import { GovHeader, GovFooter, A11yWidget, Card, Btn, Field, inputStyle } from "../components/GovShell";

const ROL_META = {
  recaudacion: { title: "Recaudación", path: "/recaudacion", variant: "finanzas" },
  ventanilla: { title: "Ventanilla de cobros", path: "/recarga", variant: "finanzas" },
  camionero: { title: "Chofer", path: "/camionero", variant: "municipio" },
  desarrollo_social: { title: "Desarrollo Social", path: "/admin/solicitudes", variant: "desarrollo" },
  admin_transportistas: { title: "Admin transportistas", path: "/transportistas", variant: "municipio" },
  contabilidad: { title: "Recaudación", path: "/recaudacion", variant: "finanzas" },
};

export default function StaffLogin({ rol = "recaudacion" }) {
  const meta = ROL_META[rol] || ROL_META.recaudacion;
  const { login } = useStaffSesion();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      // El contexto llama a la API (con el rol), guarda la sesión y la activa.
      await login(rol, usuario.trim(), password);
      navigate(meta.path);
    } catch (ex) {
      setErr(ex.message || "No se pudo iniciar sesión.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-shell" style={{ background: C.paper, fontFamily: "var(--font-sans)" }}>
      <GovHeader compact />
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "clamp(24px, 6vw, 56px) 20px" }}>
        <Card style={{ padding: "clamp(20px, 4vw, 32px)" }}>
          <h1 style={{ margin: "0 0 4px", fontSize: 28, color: C.navy, fontWeight: 800 }}>{meta.title}</h1>
          <p style={{ margin: "0 0 22px", fontSize: 16, color: "#6b7785" }}>Inicia sesión con tu usuario municipal.</p>
          <form onSubmit={onSubmit}>
            <Field label="Usuario">
              <input style={inputStyle} value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" required />
            </Field>
            <Field label="Contraseña">
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            {err && <p style={{ color: C.garnet, fontSize: 15, marginBottom: 12 }}>{err}</p>}
            <Btn type="submit" disabled={busy} style={{ width: "100%" }}>{busy ? "Entrando…" : "Entrar"}</Btn>
          </form>
          <p style={{ marginTop: 18, fontSize: 15, textAlign: "center" }}>
            <Link to="/acceso" style={{ color: C.busBlue }}>← Otros accesos</Link>
            {" · "}
            <Link to="/recuperar" style={{ color: C.busBlue }}>Recuperar contraseña</Link>
          </p>
        </Card>
      </main>
      <GovFooter />
      <A11yWidget />
    </div>
  );
}
