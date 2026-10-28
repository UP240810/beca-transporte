import React from "react";
import { C } from "../theme";

/** Evita la pantalla en blanco: si una pantalla falla, muestra un aviso con opción de recargar. */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Error en pantalla:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: C.paper, fontFamily: "var(--font-sans)" }}>
        <div style={{ maxWidth: 440, width: "100%", background: "#fff", borderRadius: 12, padding: 28, textAlign: "center", boxShadow: "0 8px 30px rgba(0,51,102,0.12)" }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 22, color: C.navy }}>Algo salió mal</h1>
          <p style={{ margin: "0 0 18px", color: "#6b7785", fontSize: 15, lineHeight: 1.5 }}>
            Esta pantalla no se pudo mostrar. Intenta recargar; si sigue pasando, avisa desde “Ayuda”.
          </p>
          <p style={{ margin: "0 0 18px", color: C.garnet, fontSize: 12, overflowWrap: "anywhere" }}>{String(this.state.error?.message || this.state.error)}</p>
          <button
            type="button"
            onClick={() => { window.location.href = "/"; }}
            style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 24, padding: "11px 22px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }
}
