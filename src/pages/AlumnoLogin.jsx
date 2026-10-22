import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { C } from "../theme";
import api from "../api";
import { useSesion } from "../context/SesionContext";
import { GovHeader, GovFooter, A11yWidget, Card, Btn, Field, inputStyle } from "../components/GovShell";

export default function AlumnoLogin() {
  const { login } = useSesion();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const data = await api.alumnoLogin(usuario.trim(), password);
      login(data);
      navigate("/alumno");
    } catch (ex) {
      setErr(ex.message || "No se pudo iniciar sesión.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.paper, fontFamily: "system-ui, sans-serif" }}>
      <GovHeader compact />
      <main style={{ maxWidth: 420, margin: "0 auto", padding: "40px 20px" }}>
        <Card style={{ padding: 24 }}>
          <h1 style={{ margin: "0 0 4px", fontSize: 20, color: C.navy, fontWeight: 800 }}>Beneficiario</h1>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "#6b7785" }}>Accede a tu pase, saldo e historial.</p>
          <form onSubmit={onSubmit}>
            <Field label="Usuario o matrícula">
              <input style={inputStyle} value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" required />
            </Field>
            <Field label="Contraseña">
              <input style={inputStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            </Field>
            {err && <p style={{ color: C.garnet, fontSize: 13, marginBottom: 12 }}>{err}</p>}
            <Btn type="submit" disabled={busy} style={{ width: "100%" }}>{busy ? "Entrando…" : "Entrar"}</Btn>
          </form>
          <p style={{ marginTop: 16, fontSize: 12, textAlign: "center" }}>
            <Link to="/solicitud" style={{ color: C.busBlue }}>Solicitar beca</Link>
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
