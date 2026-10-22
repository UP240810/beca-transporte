import React from "react";
import { Link } from "react-router-dom";
import { C } from "../theme";
import { GovHeader, GovFooter, A11yWidget } from "../components/GovShell";

/** Página 400 — animación de guayaba (símbolo local de Calvillo) */
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
          <div className="guayaba-bounce" aria-hidden style={{ fontSize: 72, lineHeight: 1, marginBottom: 12 }}>
            🍈
          </div>
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
        @keyframes guayaba-bounce {
          0%, 100% { transform: translateY(0) rotate(-4deg); }
          50% { transform: translateY(-14px) rotate(4deg); }
        }
        .guayaba-bounce {
          animation: guayaba-bounce 1.4s ease-in-out infinite;
          display: inline-block;
        }
        @media (prefers-reduced-motion: reduce) {
          .guayaba-bounce { animation: none; }
        }
      `}</style>
    </div>
  );
}
