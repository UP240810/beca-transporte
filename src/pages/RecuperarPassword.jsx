import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, ShieldAlert, CheckCircle2 } from "lucide-react";
import { C } from "../theme";
import { GovHeader, GovFooter, A11yWidget } from "../components/GovShell";
import api from "../api";
import BrandLogos from "../components/BrandLogos";

export default function RecuperarPassword() {
  const [usuario, setUsuario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [listo, setListo] = useState(null);

  async function enviar(e) {
    e.preventDefault();
    if (!usuario.trim()) return;
    setEnviando(true);
    setError("");
    try {
      const data = await api.recuperarPassword(usuario.trim());
      setListo(data.mensaje || "Revisa tu correo si la cuenta existe.");
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="page-shell" style={{ background: C.paper || "#F7F8FA", fontFamily: "var(--font-sans)" }}>
      <GovHeader compact />
      <div className="page-body" style={{ maxWidth: 480, margin: "0 auto", padding: "32px 18px" }}>
        <header style={{ background: "#fff", borderBottom: `3px solid ${C.navy}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, borderRadius: 10 }}>
          <Link to="/acceso" style={{ display: "flex", color: C.navy }}><ArrowLeft size={18} /></Link>
          <BrandLogos variant="municipio" height={28} />
        </header>

        <div style={{ padding: "20px 4px" }}>
          <div className="f-display" style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>
            ¿Olvidaste tu contraseña?
          </div>
          <p style={{ fontSize: 12.5, color: "#6b7785", marginTop: 6, lineHeight: 1.5 }}>
            Escribe el usuario con el que inicias sesión. Si tiene correo registrado, te enviaremos un enlace válido por 1 hora.
          </p>

          {listo ? (
            <div style={{ marginTop: 20, background: `${C.mint}22`, border: `1px solid ${C.mint}`, borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <CheckCircle2 size={18} color="#1F7A56" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 13, color: C.navy, lineHeight: 1.5 }}>{listo}</div>
              </div>
              <Link to="/acceso" style={{ display: "inline-block", marginTop: 14, fontSize: 12.5, fontWeight: 700, color: C.busBlue }}>
                Volver al acceso
              </Link>
            </div>
          ) : (
            <form onSubmit={enviar} style={{ marginTop: 18 }}>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: C.navy, display: "block", marginBottom: 6 }}>Usuario</label>
              <div style={{ position: "relative", marginBottom: 14 }}>
                <Mail size={15} color="#8993A1" style={{ position: "absolute", left: 12, top: 13 }} />
                <input
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="Tu usuario de acceso"
                  autoComplete="username"
                  style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${C.paperDim}`, borderRadius: 9, padding: "11px 12px 11px 36px", fontSize: 13, outline: "none" }}
                />
              </div>

              {error && (
                <div style={{ display: "flex", gap: 7, alignItems: "center", background: `${C.garnet}12`, border: `1px solid ${C.garnet}`, color: C.garnet, borderRadius: 9, padding: "10px 12px", fontSize: 12, marginBottom: 12 }}>
                  <ShieldAlert size={14} /> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={enviando || !usuario.trim()}
                style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: C.navy, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: enviando ? 0.7 : 1 }}
              >
                {enviando ? "Enviando..." : "Enviar enlace"}
              </button>
            </form>
          )}
        </div>
      </div>
      <GovFooter />
      <A11yWidget />
    </div>
  );
}
