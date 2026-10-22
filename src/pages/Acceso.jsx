import React from "react";
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

export default function Acceso() {
  return (
    <div style={{ minHeight: "100vh", background: C.paper, fontFamily: "system-ui, sans-serif", color: C.ink }}>
      <GovHeader compact />
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "36px 24px 48px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.navy, margin: "0 0 6px" }}>Accesos al sistema</h1>
        <p style={{ fontSize: 14, color: "#6b7785", marginBottom: 24 }}>
          Elige el área que te corresponde. También puedes abrir este menú desde las tres rayas del encabezado.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
          {accesos.map((o) => (
            <Link
              key={o.to}
              to={o.to}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                background: "#fff", borderRadius: 14, padding: "16px 16px",
                textDecoration: "none", border: `1px solid ${C.paperDim}`,
                boxShadow: "0 4px 12px rgba(0,51,102,0.05)",
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: `${o.color}18`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <o.icon size={20} color={o.color === C.gold ? C.navy : o.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 750, color: C.navy }}>{o.t}</div>
                <div style={{ fontSize: 12, color: "#6b7785", marginTop: 2 }}>{o.d}</div>
              </div>
              <ChevronRight size={18} color="#8993A1" />
            </Link>
          ))}
        </div>
      </main>
      <GovFooter />
      <A11yWidget />
    </div>
  );
}
