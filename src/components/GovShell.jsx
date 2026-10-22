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
        <div
          className={compact ? "hdr-bar compact" : "hdr-bar"}
          style={{ background: C.navy, color: "#fff" }}
        >
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none", color: "#fff", minWidth: 0 }}>
            <BrandLogos
              variant="municipio"
              onDark
              height={compact ? "clamp(52px, 8vw, 64px)" : "clamp(60px, 9vw, 80px)"}
            />
            <div className="hdr-brand-text" style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: compact ? 16 : 19, fontWeight: 700, letterSpacing: 0.3 }}>CALVILLO</div>
              <div style={{ fontSize: 13, opacity: 0.88, fontWeight: 500 }}>Gobierno Municipal · 2024-2027</div>
            </div>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <Link
              to="/solicitud"
              className="hdr-link-solicitud"
              style={{
                color: "#fff",
                textDecoration: "none",
                borderRadius: 24,
                border: "1px solid rgba(255,255,255,0.45)",
                fontWeight: 600,
              }}
            >
              Solicitar beca
            </Link>
            <button
              type="button"
              aria-label="Menú de accesos"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                border: "none",
                background: menuOpen ? C.gold : "rgba(255,255,255,0.12)",
                color: menuOpen ? C.navy : "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Panel menú hamburguesa — logins por área */}
        {menuOpen && (
          <div
            style={{
              position: "absolute",
              right: 12,
              top: "100%",
              marginTop: 8,
              width: "min(380px, calc(100vw - 24px))",
              background: "#fff",
              borderRadius: 14,
              boxShadow: "0 16px 40px rgba(0,51,102,0.2)",
              border: `1px solid ${C.paperDim}`,
              overflow: "hidden",
              zIndex: 60,
            }}
          >
            <div style={{ padding: "12px 16px", background: C.paper, borderBottom: `1px solid ${C.paperDim}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, letterSpacing: 0.6 }}>ACCESOS AL SISTEMA</div>
              <div style={{ fontSize: 14, color: "#6b7785", marginTop: 2 }}>Elige tu área para iniciar sesión</div>
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
                    padding: "11px 12px",
                    borderRadius: 10,
                    textDecoration: "none",
                    color: C.ink,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = C.paper; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: `${C.navy}12`, color: C.navy,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={18} />
                  </span>
                  <span>
                    <div style={{ fontSize: 15.5, fontWeight: 700, color: C.navy }}>{t}</div>
                    <div style={{ fontSize: 13.5, color: "#6b7785" }}>{d}</div>
                  </span>
                </Link>
              ))}
            </nav>
            <div style={{ padding: "10px 16px 14px", borderTop: `1px solid ${C.paperDim}` }}>
              <Link to="/acceso" style={{ fontSize: 14, color: C.busBlue, fontWeight: 600, textDecoration: "none" }}>
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

export function GovFooter({ flush = false }) {
  const titulo = { fontSize: 14, fontWeight: 700, letterSpacing: 0.8, marginBottom: 12, color: C.gold };
  const texto = { fontSize: 15.5, lineHeight: 1.65, margin: 0, opacity: 0.94 };
  return (
    <footer style={{ marginTop: flush ? 0 : 48 }}>
      <div style={{ background: C.navy, color: "#fff", padding: "clamp(28px, 5vw, 44px) clamp(16px, 4vw, 28px) 28px" }}>
        <div style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))",
          gap: 32,
        }}>
          <div>
            <BrandLogos variant="municipio" onDark height="clamp(100px, 15vw, 132px)" />
            <p style={{ marginTop: 14, fontSize: 15, lineHeight: 1.55, opacity: 0.92, maxWidth: 280 }}>
              H. Ayuntamiento de Calvillo · Movilidad Estudiantil Integral
            </p>
          </div>
          <div>
            <div style={titulo}>CONTACTO</div>
            <p style={texto}>
              Palacio Municipal s/n, Centro<br />
              Calvillo, Aguascalientes, C.P. 20800<br />
              (495) 956 0039
            </p>
          </div>
          <div>
            <div style={titulo}>PROGRAMA</div>
            <p style={texto}>
              Beca de transporte estudiantil<br />
              Desarrollo Social · Finanzas<br />
              <Link to="/ayuda" style={{ color: C.skyBlue, fontWeight: 600 }}>Ayuda y FAQ</Link>
            </p>
          </div>
          <div>
            <div style={titulo}>ATENCIÓN</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{
                background: "rgba(255,255,255,0.1)",
                borderRadius: 12,
                padding: "12px 16px",
                fontSize: 14.5,
                lineHeight: 1.35,
              }}>
                <div style={{ fontWeight: 800, fontSize: 21, color: C.gold }}>Presidencia</div>
                Ventanilla de cobros
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="foot-bottom"
        style={{
          background: "#001a33",
          color: "rgba(255,255,255,0.78)",
          fontSize: 13.5,
          padding: "14px clamp(16px, 4vw, 28px)",
        }}
      >
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
          width: "min(280px, calc(100vw - 32px))",
          border: `1px solid ${C.paperDim}`,
        }}>
          <div style={{ fontWeight: 700, color: C.navy, marginBottom: 10, fontSize: 15.5 }}>Opciones de accesibilidad</div>
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
                fontSize: 15, color: C.ink, borderRadius: 8,
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

export { ACCESOS };

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
