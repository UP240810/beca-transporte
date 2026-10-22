import React, { useState, useEffect } from "react";
import { C } from "../theme";
import guayaba from "../assets/guayaba.png";

/** Animación de carga al iniciar la página (guayaba PNG: escala grande ↔ pequeña). */
export default function PageLoader() {
  const [show, setShow] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const ready = () => {
      setFade(true);
      setTimeout(() => setShow(false), 400);
    };
    if (document.readyState === "complete") {
      const t = setTimeout(ready, 600);
      return () => clearTimeout(t);
    }
    window.addEventListener("load", () => setTimeout(ready, 400));
    const fallback = setTimeout(ready, 2500);
    return () => {
      clearTimeout(fallback);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      aria-busy="true"
      aria-label="Cargando"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100000,
        background: C.paper,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: fade ? 0 : 1,
        transition: "opacity 0.4s ease",
        pointerEvents: fade ? "none" : "auto",
      }}
    >
      <img
        src={guayaba}
        alt=""
        className="loader-guayaba"
        width={96}
        height={96}
        style={{ marginBottom: 16, display: "block" }}
      />
      <div style={{ fontWeight: 700, color: C.navy, fontSize: 16, marginBottom: 12 }}>
        Cargando…
      </div>
      <div style={{
        width: 120,
        height: 4,
        borderRadius: 999,
        background: C.paperDim,
        overflow: "hidden",
      }}>
        <div className="loader-bar" style={{
          height: "100%",
          width: "40%",
          background: C.navy,
          borderRadius: 999,
        }} />
      </div>
      <style>{`
        @keyframes loader-guayaba {
          0%, 100% { transform: scale(0.88); }
          50% { transform: scale(1.12); }
        }
        @keyframes loader-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        .loader-guayaba { animation: loader-guayaba 1.1s ease-in-out infinite; }
        .loader-bar { animation: loader-bar 1s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .loader-guayaba, .loader-bar { animation: none; }
        }
      `}</style>
    </div>
  );
}
