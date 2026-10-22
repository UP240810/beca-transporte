import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, KeyRound, Eye, EyeOff, ShieldAlert, CheckCircle2 } from "lucide-react";
import { C } from "../theme";
import { GovHeader, GovFooter, A11yWidget } from "../components/GovShell";
import api from "../api";
import BrandLogos from "../components/BrandLogos";

export default function RestablecerPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [show, setShow] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [listo, setListo] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!token) {
      setError("Falta el token del enlace. Solicita uno nuevo.");
      return;
    }
    setEnviando(true);
    try {
      await api.restablecerPassword(token, password);
      setListo(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.paper || "#F7F8FA", fontFamily: "system-ui, sans-serif" }}>
      <GovHeader compact />
      <div style={{ maxWidth: 430, margin: "0 auto", padding: "32px 18px" }}>
        <header style={{ background: "#fff", borderBottom: `3px solid ${C.navy}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, borderRadius: 10 }}>
          <Link to="/acceso" style={{ display: "flex", color: C.navy }}><ArrowLeft size={18} /></Link>
          <BrandLogos variant="municipio" height={28} />
        </header>

        <div style={{ padding: "20px 4px" }}>
          <div className="f-display" style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>
            Nueva contraseña
          </div>
          <p style={{ fontSize: 12.5, color: "#6b7785", marginTop: 6, lineHeight: 1.5 }}>
            Elige una contraseña de al menos 8 caracteres.
          </p>

          {listo ? (
            <div style={{ marginTop: 20, background: `${C.mint}22`, border: `1px solid ${C.mint}`, borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <CheckCircle2 size={18} color="#1F7A56" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 13, color: C.navy, lineHeight: 1.5 }}>
                  Contraseña actualizada. Ya puedes iniciar sesión.
                </div>
              </div>
              <Link to="/acceso" style={{ display: "inline-block", marginTop: 14, fontSize: 12.5, fontWeight: 700, color: C.busBlue }}>
                Ir al acceso
              </Link>
            </div>
          ) : (
            <form onSubmit={enviar} style={{ marginTop: 18 }}>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: C.navy, display: "block", marginBottom: 6 }}>Nueva contraseña</label>
              <div style={{ position: "relative", marginBottom: 12 }}>
                <KeyRound size={15} color="#8993A1" style={{ position: "absolute", left: 12, top: 13 }} />
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${C.paperDim}`, borderRadius: 9, padding: "11px 40px 11px 36px", fontSize: 13, outline: "none" }}
                />
                <button type="button" onClick={() => setShow((s) => !s)} style={{ position: "absolute", right: 10, top: 10, background: "none", border: "none", cursor: "pointer", color: "#8993A1" }}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <label style={{ fontSize: 11.5, fontWeight: 600, color: C.navy, display: "block", marginBottom: 6 }}>Confirmar</label>
              <input
                type={show ? "text" : "password"}
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                autoComplete="new-password"
                style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${C.paperDim}`, borderRadius: 9, padding: "11px 12px", fontSize: 13, outline: "none", marginBottom: 14 }}
              />

              {error && (
                <div style={{ display: "flex", gap: 7, alignItems: "center", background: `${C.garnet}12`, border: `1px solid ${C.garnet}`, color: C.garnet, borderRadius: 9, padding: "10px 12px", fontSize: 12, marginBottom: 12 }}>
                  <ShieldAlert size={14} /> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={enviando}
                style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: C.navy, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                {enviando ? "Guardando..." : "Guardar contraseña"}
              </button>

              <div style={{ marginTop: 14, textAlign: "center" }}>
                <Link to="/recuperar" style={{ fontSize: 12, color: C.busBlue }}>Solicitar un enlace nuevo</Link>
              </div>
            </form>
          )}
        </div>
      </div>
      <GovFooter />
      <A11yWidget />
    </div>
  );
}
