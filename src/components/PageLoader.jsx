import React, { useState, useEffect } from "react";
import { C } from "../theme";
import guayaba from "../assets/guayaba.png";

/** Pantalla de carga: fondo blanco, guayaba azul (sin deformarse) y barra que va y viene. */
export default function PageLoader() {
  const [show, setShow] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const ready = () => {
      setFade(true);
      setTimeout(() => setShow(false), 450);
    };
    if (document.readyState === "complete") {
      const t = setTimeout(ready, 700);
      return () => clearTimeout(t);
    }
    window.addEventListener("load", () => setTimeout(ready, 450));
    const fallback = setTimeout(ready, 2800);
    return () => clearTimeout(fallback);
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
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: fade ? 0 : 1,
        transition: "opacity 0.45s ease",
        pointerEvents: fade ? "none" : "auto",
      }}
    >
      {/* La guayaba conserva su proporción original (417 × 550) y se tiñe de azul con una máscara */}
      <div
        aria-hidden
        className="loader-guayaba"
        style={{
          height: 120,
          aspectRatio: "417 / 550",
          marginBottom: 22,
          background: C.navy,
          WebkitMaskImage: `url(${guayaba})`,
          maskImage: `url(${guayaba})`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        }}
      />
      <div
        style={{
          fontWeight: 600,
          color: C.navy,
          fontSize: 16,
          marginBottom: 16,
          letterSpacing: "0.02em",
          fontFamily: "var(--font-sans, Inter, system-ui, sans-serif)",
        }}
      >
        Cargando…
      </div>
      <div
        style={{
          width: 160,
          height: 4,
          borderRadius: 999,
          background: `${C.navy}1F`,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          className="loader-bar"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            width: "40%",
            background: C.navy,
            borderRadius: 999,
          }}
        />
      </div>
      <style>{`
        @keyframes loader-guayaba {
          0%, 100% { transform: translateY(0) scale(0.96); }
          50% { transform: translateY(-4px) scale(1.04); }
        }
        /* Avanti e indietro: la barra va hasta el extremo y regresa */
        @keyframes loader-bar {
          0%   { transform: translateX(0); }
          50%  { transform: translateX(150%); }
          100% { transform: translateX(0); }
        }
        .loader-guayaba { animation: loader-guayaba 1.4s ease-in-out infinite; }
        .loader-bar { animation: loader-bar 1.3s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .loader-guayaba, .loader-bar { animation: none; }
        }
      `}</style>
    </div>
  );
}
