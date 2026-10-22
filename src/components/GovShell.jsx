import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu, X, GraduationCap, ShieldCheck, Wallet, Bus, FileSpreadsheet,
  Accessibility, Plus, Minus, Contrast, RotateCcw,
} from "lucide-react";
import { C } from "../theme";
import BrandLogos from "./BrandLogos";

const ACCESOS = [
  { to: "/alumno/login", icon: GraduationCap, t: "Beneficiario", d: "Estudiante becado" },
  { to: "/admin/login", icon: ShieldCheck, t: "Desarrollo Social", d: "Solicitudes y credenciales" },
  { to: "/recarga/login", icon: Wallet, t: "Ventanilla de cobros", d: "Recargas y tickets" },
  { to: "/recaudacion/login", icon: FileSpreadsheet, t: "Recaudación", d: "Reportes y cortes" },
  { to: "/camionero/login", icon: Bus, t: "Chofer", d: "Validación en ruta" },
  { to: "/transportistas/login", icon: ShieldCheck, t: "Admin transportistas", d: "Viajes por unidad" },
];

/** Patrón decorativo tipo greca / guayaba abstracta */
function PatternBar({ height = 28 }) {
  return (
    <div
      aria-hidden
      style={{
        height,
        background: `repeating-linear-gradient(
          90deg,
          ${C.navy} 0 10px,
          ${C.navySoft} 10px 14px,
          ${C.gold} 14px 18px,
          ${C.navySoft} 18px 22px,
          ${C.navy} 22px 32px
        )`,
        opacity: 0.92,
      }}
    />
  );
}

export function GovHeader({ compact = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [loc.pathname]);

  return (
    <>
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "#fff", boxShadow: "0 2px 12px rgba(0,51,102,0.12)" }}>
        {/* Barra superior institucional */}
        <div style={{
          background: C.navy,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: compact ? "8px 18px" : "10px 28px",
          gap: 12,
          flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "#fff" }}>
              <BrandLogos variant="municipio" height={compact ? 34 : 42} />
              <div style={{ lineHeight: 1.15 }}>
                <div style={{ fontSize: compact ? 13 : 15, fontWeight: 700, letterSpacing: 0.3 }}>CALVILLO</div>
                <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 500 }}>Gobierno Municipal · 2024-2027</div>
              </div>
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link
              to="/solicitud"
              style={{
                display: "none",
                sm: "inline",
                fontSize: 12,
                color: "#fff",
                textDecoration: "none",
                padding: "6px 12px",
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.35)",
                fontWeight: 600,
              }}
              className="hdr-link-solicitud"
            >
              Solicitar beca
            </Link>
            <button
              type="button"
              aria-label="Menú de accesos"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                border: "none",
                background: menuOpen ? C.gold : "rgba(255,255,255,0.12)",
                color: menuOpen ? C.navy : "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        <PatternBar height={6} />

        {/* Panel menú hamburguesa — logins por área */}
        {menuOpen && (
          <div
            style={{
              position: "absolute",
              right: 16,
              top: "100%",
              marginTop: 8,
              width: "min(340px, calc(100vw - 32px))",
              background: "#fff",
              borderRadius: 14,
              boxShadow: "0 16px 40px rgba(0,51,102,0.2)",
              border: `1px solid ${C.paperDim}`,
              overflow: "hidden",
              zIndex: 60,
            }}
          >
            <div style={{ padding: "12px 16px", background: C.paper, borderBottom: `1px solid ${C.paperDim}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.navy, letterSpacing: 0.6 }}>ACCESOS AL SISTEMA</div>
              <div style={{ fontSize: 12, color: "#6b7785", marginTop: 2 }}>Elige tu área para iniciar sesión</div>
            </div>
            <nav style={{ padding: 8 }}>
              {ACCESOS.map(({ to, icon: Icon, t, d }) => (
                <Link
                  key={to}
                  to={to}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 10,
                    textDecoration: "none",
                    color: C.ink,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = C.paper; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${C.navy}12`, color: C.navy,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={18} />
                  </span>
                  <span>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: C.navy }}>{t}</div>
                    <div style={{ fontSize: 11.5, color: "#6b7785" }}>{d}</div>
                  </span>
                </Link>
              ))}
            </nav>
            <div style={{ padding: "10px 16px 14px", borderTop: `1px solid ${C.paperDim}` }}>
              <Link to="/acceso" style={{ fontSize: 12, color: C.busBlue, fontWeight: 600, textDecoration: "none" }}>
                Ver todos los accesos →
              </Link>
            </div>
          </div>
        )}
      </header>
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 40 }}
        />
      )}
    </>
  );
}

export function GovFooter() {
  return (
    <footer style={{ marginTop: 48 }}>
      <PatternBar height={10} />
      <div style={{ background: C.navy, color: "#fff", padding: "40px 28px 24px" }}>
        <div style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 32,
        }}>
          <div>
            <BrandLogos variant="municipio" height={48} />
            <p style={{ marginTop: 14, fontSize: 13, lineHeight: 1.5, opacity: 0.9, maxWidth: 260 }}>
              H. Ayuntamiento de Calvillo · Movilidad Estudiantil Integral
            </p>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.8, marginBottom: 12, color: C.gold }}>CONTACTO</div>
            <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0, opacity: 0.92 }}>
              Palacio Municipal s/n, Centro<br />
              Calvillo, Aguascalientes, C.P. 20800<br />
              (495) 956 0039
            </p>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.8, marginBottom: 12, color: C.gold }}>PROGRAMA</div>
            <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0, opacity: 0.92 }}>
              Beca de transporte estudiantil<br />
              Desarrollo Social · Finanzas<br />
              <Link to="/ayuda" style={{ color: C.skyBlue }}>Ayuda y FAQ</Link>
            </p>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.8, marginBottom: 12, color: C.gold }}>ATENCIÓN</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{
                background: "rgba(255,255,255,0.1)",
                borderRadius: 12,
                padding: "10px 14px",
                fontSize: 12,
                lineHeight: 1.35,
              }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: C.gold }}>Presidencia</div>
                Ventanilla de cobros
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={{
        background: "#001a33",
        color: "rgba(255,255,255,0.7)",
        fontSize: 11,
        padding: "12px 28px",
        display: "flex",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 8,
      }}>
        <span>© {new Date().getFullYear()} H. Ayuntamiento de Calvillo</span>
        <span>Sistema Digital de Beca de Transporte Estudiantil</span>
      </div>
    </footer>
  );
}

/** Widget flotante de accesibilidad (inspirado en portales .gob.mx) */
export function A11yWidget() {
  const [open, setOpen] = useState(false);

  function setRoot(varName, value) {
    document.documentElement.style.setProperty(varName, value);
  }

  function fontDelta(delta) {
    const cur = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--app-font-scale") || "1");
    const next = Math.min(1.35, Math.max(0.85, cur + delta));
    setRoot("--app-font-scale", String(next));
    document.body.style.fontSize = `${next * 100}%`;
  }

  function contrast(mode) {
    document.body.classList.remove("a11y-bright", "a11y-dark", "a11y-gray");
    if (mode) document.body.classList.add(mode);
  }

  return (
    <div style={{ position: "fixed", left: 16, bottom: 20, zIndex: 70 }}>
      {open && (
        <div style={{
          marginBottom: 10,
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
          padding: "14px 16px",
          width: 240,
          border: `1px solid ${C.paperDim}`,
        }}>
          <div style={{ fontWeight: 700, color: C.navy, marginBottom: 10, fontSize: 14 }}>Opciones de accesibilidad</div>
          {[
            { label: "Reducir tamaño de fuente", fn: () => fontDelta(-0.08), icon: <Minus size={14} /> },
            { label: "Incrementar tamaño de fuente", fn: () => fontDelta(0.08), icon: <Plus size={14} /> },
            { label: "Contraste brillante", fn: () => contrast("a11y-bright"), icon: <Contrast size={14} /> },
            { label: "Contraste obscuro", fn: () => contrast("a11y-dark"), icon: <Contrast size={14} /> },
            { label: "Escala de grises", fn: () => contrast("a11y-gray"), icon: <Contrast size={14} /> },
            { label: "Reiniciar contraste", fn: () => { contrast(null); fontDelta(0); setRoot("--app-font-scale", "1"); document.body.style.fontSize = ""; }, icon: <RotateCcw size={14} /> },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.fn}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", textAlign: "left", padding: "8px 6px",
                border: "none", background: "transparent", cursor: "pointer",
                fontSize: 13, color: C.ink, borderRadius: 8,
              }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        aria-label="Accesibilidad"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 52, height: 52, borderRadius: "50%",
          border: "none", background: C.garnet, color: "#fff",
          cursor: "pointer", boxShadow: "0 6px 16px rgba(122,25,61,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <Accessibility size={24} />
      </button>
    </div>
  );
}

export { ACCESOS, PatternBar };

/** Layout uniforme para pantallas internas (staff y alumno) */
export function AppPage({
  title,
  subtitle,
  children,
  onLogout,
  userLabel,
  variant = "municipio", // municipio | finanzas | desarrollo
  maxWidth = 960,
  showFooter = true,
}) {
  return (
    <div style={{
      minHeight: "100vh",
      background: C.paper,
      fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      color: C.ink,
      display: "flex",
      flexDirection: "column",
    }}>
      <header style={{ background: C.navy, color: "#fff", boxShadow: "0 2px 12px rgba(0,51,102,0.15)" }}>
        <div style={{
          maxWidth: maxWidth + 80,
          margin: "0 auto",
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <BrandLogos variant={variant} height={34} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.2 }}>{title}</div>
              {subtitle && <div style={{ fontSize: 11, opacity: 0.85 }}>{subtitle}</div>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {userLabel && <span style={{ fontSize: 12, opacity: 0.9 }}>{userLabel}</span>}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                style={{
                  background: C.gold,
                  color: C.navy,
                  border: "none",
                  borderRadius: 8,
                  padding: "7px 14px",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Salir
              </button>
            )}
          </div>
        </div>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${C.gold}, ${C.busBlue}, ${C.navySoft})` }} />
      </header>

      <main style={{ flex: 1, maxWidth, width: "100%", margin: "0 auto", padding: "20px 18px 40px", boxSizing: "border-box" }}>
        {children}
      </main>

      {showFooter && (
        <div style={{
          background: "#001a33",
          color: "rgba(255,255,255,0.65)",
          fontSize: 11,
          padding: "10px 18px",
          textAlign: "center",
        }}>
          H. Ayuntamiento de Calvillo · Sistema de Beca de Transporte
        </div>
      )}
      <A11yWidget />
    </div>
  );
}

/** Contenedor de tarjeta estándar */
export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      border: `1px solid ${C.paperDim}`,
      boxShadow: "0 4px 14px rgba(0,51,102,0.06)",
      padding: 16,
      ...style,
    }}>
      {children}
    </div>
  );
}

export function Btn({ children, onClick, variant = "primary", type = "button", disabled, style = {} }) {
  const styles = {
    primary: { background: C.navy, color: "#fff" },
    accent: { background: C.busBlue, color: "#fff" },
    gold: { background: C.gold, color: C.navy },
    ghost: { background: "#fff", color: C.navy, border: `1px solid ${C.paperDim}` },
    danger: { background: C.garnet, color: "#fff" },
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        border: "none",
        borderRadius: 9,
        padding: "10px 16px",
        fontWeight: 700,
        fontSize: 13,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        ...styles[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }) {
  return (
    <label style={{ display: "block", fontSize: 12.5, color: "#5b6675", marginBottom: 10 }}>
      <span style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>{label}</span>
      {children}
    </label>
  );
}

export const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 9,
  border: `1px solid ${C.paperDim}`,
  fontSize: 14,
  boxSizing: "border-box",
  background: "#fff",
  color: C.ink,
};


/** Encabezado uniforme para módulos internos (reemplaza headers sueltos) */
export function StaffHeader({ title, variant = "municipio", userLabel, onLogout, extra }) {
  return (
    <header style={{ background: "#fff", borderBottom: "none", boxShadow: "0 2px 10px rgba(0,51,102,0.1)" }}>
      <div style={{ background: C.navy, color: "#fff", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BrandLogos variant={variant} height={32} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>H. Ayuntamiento de Calvillo</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {extra}
          {userLabel && <span style={{ fontSize: 12, opacity: 0.95 }}>{userLabel}</span>}
          {onLogout && (
            <button type="button" onClick={onLogout} style={{ background: C.gold, color: C.navy, border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              Salir
            </button>
          )}
        </div>
      </div>
      <div style={{ height: 4, background: `linear-gradient(90deg, ${C.gold}, ${C.busBlue})` }} />
    </header>
  );
}
