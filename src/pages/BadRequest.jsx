import React from "react";
import { Link } from "react-router-dom";
import { C } from "../theme";
import { GovHeader, GovFooter, A11yWidget } from "../components/GovShell";
import guayaba from "../assets/guayaba.png";

/** Página 400 — guayaba (PNG) con animación de escala */
export default function BadRequest() {
  return (
    <div style={{ minHeight: "100vh", background: C.paper, display: "flex", flexDirection: "column" }}>
      <GovHeader compact />
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{
          textAlign: "center",
          background: "#fff",
          borderRadius: 8,
          border: `1px solid ${C.paperDim}`,
          boxShadow: "0 8px 24px rgba(0,51,102,0.06)",
          padding: "40px 32px",
          maxWidth: 420,
          width: "100%",
        }}>
          <img
            src={guayaba}
            alt=""
            className="guayaba-pulse"
            width={88}
            height={88}
            style={{ marginBottom: 12, display: "inline-block" }}
          />
          <div style={{ fontSize: 48, fontWeight: 800, color: C.navy, letterSpacing: -1 }}>400</div>
          <p style={{ color: C.ink, fontSize: 18, fontWeight: 600, margin: "8px 0 6px" }}>
            Hay un error en la solicitud
          </p>
          <p style={{ color: "#6b7785", fontSize: 15, lineHeight: 1.5, marginBottom: 24 }}>
            La petición no pudo procesarse. Revisa los datos e inténtalo de nuevo, o regresa al inicio.
          </p>
          <Link
            to="/"
            style={{
              display: "inline-block",
              background: C.navy,
              color: "#fff",
              padding: "12px 24px",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 15,
              textDecoration: "none",
            }}
          >
            Volver al inicio
          </Link>
        </div>
      </main>
      <GovFooter />
      <A11yWidget />
      <style>{`
        @keyframes guayaba-pulse {
          0%, 100% { transform: scale(0.9); }
          50% { transform: scale(1.1); }
        }
        .guayaba-pulse {
          animation: guayaba-pulse 1.2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .guayaba-pulse { animation: none; }
        }
      `}</style>
    </div>
  );
}
