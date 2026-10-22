import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { C } from "../theme";

const CONSENT_KEY = "consent-legal-v1";
const DOC_VERSION = "1.0";

function loadConsent() {
  try {
    return JSON.parse(localStorage.getItem(CONSENT_KEY) || "null");
  } catch {
    return null;
  }
}

/** Registra aceptación auditable en localStorage (usuario/ref, documento, versión, fecha-hora, medio). */
function saveConsent({ terminos, privacidad, cookies }) {
  const entry = {
    ref: `anon-${Date.now().toString(36)}`,
    documentos: [
      terminos && { documento: "terminos", version: DOC_VERSION },
      privacidad && { documento: "privacidad", version: DOC_VERSION },
      cookies && { documento: "cookies", version: DOC_VERSION },
    ].filter(Boolean),
    fechaHora: new Date().toISOString(),
    medio: "web-popup-primera-visita",
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(entry));
  // Log en consola para auditoría local (el backend puede ampliarse después)
  console.info("[consent-audit]", entry);
  return entry;
}

export function hasValidConsent() {
  const c = loadConsent();
  if (!c || !Array.isArray(c.documentos)) return false;
  const docs = c.documentos.map((d) => d.documento);
  return docs.includes("terminos") && docs.includes("privacidad");
}

/**
 * Popup de primera visita: dos checkboxes separados (términos | privacidad),
 * nunca pre-marcados; sin aceptación no se deja entrar a la web.
 */
export default function ConsentModal() {
  const [visible, setVisible] = useState(false);
  const [terminos, setTerminos] = useState(false);
  const [privacidad, setPrivacidad] = useState(false);
  const [cookiesOk, setCookiesOk] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasValidConsent()) setVisible(true);
  }, []);

  if (!visible) return null;

  function aceptar() {
    if (!terminos || !privacidad) {
      setError("Debes aceptar los Términos y el Aviso de privacidad para continuar.");
      return;
    }
    saveConsent({ terminos, privacidad, cookies: cookiesOk });
    setVisible(false);
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(0, 26, 51, 0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        animation: "consent-fade-in 0.35s ease-out",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          maxWidth: 480,
          width: "100%",
          padding: "28px 24px",
          boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
          animation: "consent-slide-up 0.4s ease-out",
        }}
      >
        <h2 id="consent-title" className="f-display" style={{ margin: "0 0 8px", color: C.navy, fontSize: 22, fontWeight: 800 }}>
          Antes de continuar
        </h2>
        <p style={{ margin: "0 0 18px", color: "#5b6675", fontSize: 14.5, lineHeight: 1.5 }}>
          Para usar el Sistema Digital de Beca de Transporte Estudiantil debes aceptar los documentos legales. Los checkboxes no están premarcados.
        </p>

        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12, cursor: "pointer", fontSize: 14.5, color: C.ink }}>
          <input type="checkbox" checked={terminos} onChange={(e) => setTerminos(e.target.checked)} style={{ marginTop: 3 }} />
          <span>
            He leído y acepto los{" "}
            <Link to="/terminos" target="_blank" rel="noopener" style={{ color: C.busBlue, fontWeight: 600 }}>
              Términos y condiciones
            </Link>
            .
          </span>
        </label>

        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12, cursor: "pointer", fontSize: 14.5, color: C.ink }}>
          <input type="checkbox" checked={privacidad} onChange={(e) => setPrivacidad(e.target.checked)} style={{ marginTop: 3 }} />
          <span>
            He leído y acepto el{" "}
            <Link to="/privacidad" target="_blank" rel="noopener" style={{ color: C.busBlue, fontWeight: 600 }}>
              Aviso de privacidad
            </Link>
            .
          </span>
        </label>

        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 16, cursor: "pointer", fontSize: 14.5, color: C.ink }}>
          <input type="checkbox" checked={cookiesOk} onChange={(e) => setCookiesOk(e.target.checked)} style={{ marginTop: 3 }} />
          <span>
            Acepto el uso de almacenamiento esencial descrito en la{" "}
            <Link to="/cookies" target="_blank" rel="noopener" style={{ color: C.busBlue, fontWeight: 600 }}>
              Política de cookies
            </Link>
            {" "}(opcional para técnicas estrictamente necesarias).
          </span>
        </label>

        {error && (
          <p style={{ color: C.garnet, fontSize: 13.5, margin: "0 0 12px" }}>{error}</p>
        )}

        <button
          type="button"
          onClick={aceptar}
          style={{
            width: "100%",
            padding: "12px 0",
            borderRadius: 8,
            border: "none",
            background: C.navy,
            color: "#fff",
            fontWeight: 700,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          Continuar
        </button>
        <p style={{ margin: "12px 0 0", fontSize: 12, color: "#8993A1", textAlign: "center" }}>
          Sin aceptación no es posible usar el sitio. Jurisdicción: México.
        </p>
      </div>
      <style>{`
        @keyframes consent-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes consent-slide-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          [role="dialog"] { animation: none !important; }
          [role="dialog"] > div { animation: none !important; }
        }
      `}</style>
    </div>,
    document.body
  );
}
