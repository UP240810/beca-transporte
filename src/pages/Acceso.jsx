import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap, ShieldCheck, Wallet, Bus, ChevronRight, FileSpreadsheet,
} from "lucide-react";
import { C } from "../theme";
import { GovHeader, GovFooter, A11yWidget } from "../components/GovShell";

const accesos = [
  { to: "/alumno/login", icon: GraduationCap, t: "Beneficiario (estudiante)", d: "Saldo, historial, QR y credencial.", color: C.busBlue },
  { to: "/admin/login", icon: ShieldCheck, t: "Desarrollo Social", d: "Solicitudes, base de datos y reportes.", color: C.navy },
  { to: "/recarga/login", icon: Wallet, t: "Ventanilla de cobros", d: "Recargas, tickets, venta del día y devoluciones.", color: C.gold },
  { to: "/recaudacion/login", icon: FileSpreadsheet, t: "Recaudación", d: "Reportes de recargas y movimientos.", color: C.navySoft },
  { to: "/camionero/login", icon: Bus, t: "Chofer", d: "Cobro en ruta y reportes 90%.", color: C.busBlue },
  { to: "/transportistas/login", icon: ShieldCheck, t: "Admin transportistas", d: "Viajes por chofer y unidad.", color: C.garnet },
];

function Reveal({ children, delay = 0, style }) {
  const ref = useRef(null);
  const [visto, setVisto] = useState(
    typeof IntersectionObserver === "undefined" ||
      (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
  );

  useEffect(() => {
    if (visto || !ref.current) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisto(true);
          io.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -4% 0px" }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [visto]);

  return (
    <div
      ref={ref}
      className={`reveal${visto ? " in" : ""}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {children}
    </div>
  );
}

export default function Acceso() {
  return (
    <div className="page-shell" style={{ background: C.paper, fontFamily: "var(--font-sans)", color: C.ink }}>
      <GovHeader compact />
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "clamp(24px, 5vw, 44px) clamp(16px, 4vw, 24px) 48px" }}>
        <Reveal>
          <h1 style={{ fontSize: "clamp(26px, 4vw, 32px)", fontWeight: 700, color: C.navy, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            Accesos al sistema
          </h1>
          <p style={{ fontSize: 16.5, color: "#6b7785", marginBottom: 24 }}>
            Elige el área que te corresponde. También puedes abrir este menú desde las tres rayas del encabezado.
          </p>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))", gap: 12 }}>
          {accesos.map((o, i) => (
            <Reveal key={o.to} delay={i * 80}>
              <Link
                to={o.to}
                className="lift btn-anim"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  background: "#fff",
                  borderRadius: 8,
                  padding: "16px 16px",
                  textDecoration: "none",
                  border: `1px solid ${C.paperDim}`,
                  boxShadow: "rgba(18,22,30,0.024) 0px 1px 4px 0px, rgba(18,22,30,0.05) 0px 1px 0px 0px, rgba(18,22,30,0.024) 0px 0px 0px 1px",
                  height: "100%",
                }}
              >
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  background: `${o.color}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <o.icon size={20} color={o.color === C.gold ? C.navy : o.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17.5, fontWeight: 650, color: C.navy }}>{o.t}</div>
                  <div style={{ fontSize: 14.5, color: "#6b7785", marginTop: 2 }}>{o.d}</div>
                </div>
                <ChevronRight size={18} color="#8993A1" />
              </Link>
            </Reveal>
          ))}
        </div>
      </main>
      <GovFooter />
      <A11yWidget />
    </div>
  );
}
