import React, { useState, useEffect } from "react";
import { C } from "../theme";
import guayaba from "../assets/guayaba.png";

/** Pantalla de carga: fondo azul degradado + guayaba en blanco. */
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
        background: `linear-gradient(160deg, ${C.navy} 0%, ${C.navySoft} 45%, #0a4d8c 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: fade ? 0 : 1,
        transition: "opacity 0.45s ease",
        pointerEvents: fade ? "none" : "auto",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)",
        }}
      />
      <img
        src={guayaba}
        alt=""
        className="loader-guayaba"
        width={104}
        height={104}
        style={{
          marginBottom: 20,
          display: "block",
          position: "relative",
          filter: "brightness(0) invert(1)",
        }}
      />
      <div
        style={{
          fontWeight: 600,
          color: "rgba(255,255,255,0.95)",
          fontSize: 16,
          marginBottom: 16,
          letterSpacing: "0.02em",
          fontFamily: "var(--font-sans, Inter, system-ui, sans-serif)",
          position: "relative",
        }}
      >
        Cargando…
      </div>
      <div
        style={{
          width: 140,
          height: 3,
          borderRadius: 999,
          background: "rgba(255,255,255,0.2)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          className="loader-bar"
          style={{
            height: "100%",
            width: "42%",
            background: "rgba(255,255,255,0.95)",
            borderRadius: 999,
          }}
        />
      </div>
      <style>{`
        @keyframes loader-guayaba {
          0%, 100% { transform: scale(0.88); }
          50% { transform: scale(1.12); }
        }
        @keyframes loader-bar {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(280%); }
        }
        .loader-guayaba { animation: loader-guayaba 1.15s ease-in-out infinite; }
        .loader-bar { animation: loader-bar 1.05s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .loader-guayaba, .loader-bar { animation: none; }
        }
      `}</style>
    </div>
  );
}
