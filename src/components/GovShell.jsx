import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
          <Link to="/" aria-label="Gobierno de Calvillo, ir al inicio" style={{ display: "flex", alignItems: "center", textDecoration: "none", color: "#fff", minWidth: 0 }}>
            <BrandLogos
              variant="municipio"
              onDark
              height={compact ? "clamp(100px, 15vw, 140px)" : "clamp(120px, 18vw, 168px)"}
            />
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
                borderRadius: 8,
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
              borderRadius: 8,
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
    <footer style={{ marginTop: flush ? 0 : "auto" }}>
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
              <Link
                to="/ayuda"
                className="btn-anim"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  padding: "12px 16px",
                  fontSize: 14.5,
                  lineHeight: 1.35,
                  color: "#fff",
                  textDecoration: "none",
                  display: "block",
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 18, color: C.gold }}>Reportar un problema</div>
                En la app · formulario de ayuda
              </Link>
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
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>© {new Date().getFullYear()} H. Ayuntamiento de Calvillo</span>
        <span style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
          <Link to="/terminos" style={{ color: "rgba(255,255,255,0.85)", textDecoration: "none" }}>Términos y condiciones</Link>
          <Link to="/privacidad" style={{ color: "rgba(255,255,255,0.85)", textDecoration: "none" }}>Aviso de privacidad</Link>
          <Link to="/cookies" style={{ color: "rgba(255,255,255,0.85)", textDecoration: "none" }}>Política de cookies</Link>
        </span>
      </div>
    </footer>
  );
}

/* ---- Accesibilidad: tamaño de letra y contraste ----
   El tamaño se aplica con `zoom` sobre #root (la app usa px, así que cambiar el
   font-size del body no hacía nada). El contraste se aplica como filtro sobre
   #root (no sobre body) para no romper el position:fixed del botón. */
const A11Y_KEY = "a11y-prefs";
const A11Y_MIN = 0.85;
const A11Y_MAX = 1.4;
const A11Y_MODES = ["a11y-bright", "a11y-dark", "a11y-gray"];

function loadA11y() {
  try {
    const p = JSON.parse(localStorage.getItem(A11Y_KEY) || "{}");
    const scale = Math.min(A11Y_MAX, Math.max(A11Y_MIN, Number(p.scale) || 1));
    return { scale, mode: A11Y_MODES.includes(p.mode) ? p.mode : null };
  } catch {
    return { scale: 1, mode: null };
  }
}

function applyA11y({ scale, mode }) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--app-zoom", String(scale));
  const root = document.getElementById("root");
  if (root) root.style.zoom = scale === 1 ? "" : String(scale);
  document.body.classList.remove(...A11Y_MODES);
  if (mode) document.body.classList.add(mode);
}

// Se aplica desde que carga la app, aunque la página no tenga el widget.
applyA11y(loadA11y());

/** Widget flotante de accesibilidad (inspirado en portales .gob.mx) */
export function A11yWidget() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState(loadA11y);

  useEffect(() => {
    applyA11y(prefs);
    try {
      if (prefs.scale === 1 && !prefs.mode) localStorage.removeItem(A11Y_KEY);
      else localStorage.setItem(A11Y_KEY, JSON.stringify(prefs));
    } catch { /* sin storage: no pasa nada */ }
  }, [prefs]);

  const cambiarFuente = (delta) =>
    setPrefs((p) => ({
      ...p,
      scale: Math.min(A11Y_MAX, Math.max(A11Y_MIN, Math.round((p.scale + delta) * 100) / 100)),
    }));
  const setModo = (mode) => setPrefs((p) => ({ ...p, mode: p.mode === mode ? null : mode }));

  const opciones = [
    { label: "Reducir tamaño de fuente", fn: () => cambiarFuente(-0.1), icon: <Minus size={16} />, off: prefs.scale <= A11Y_MIN },
    { label: "Incrementar tamaño de fuente", fn: () => cambiarFuente(0.1), icon: <Plus size={16} />, off: prefs.scale >= A11Y_MAX },
    { label: "Contraste brillante", fn: () => setModo("a11y-bright"), icon: <Contrast size={16} />, on: prefs.mode === "a11y-bright" },
    { label: "Contraste obscuro", fn: () => setModo("a11y-dark"), icon: <Contrast size={16} />, on: prefs.mode === "a11y-dark" },
    { label: "Escala de grises", fn: () => setModo("a11y-gray"), icon: <Contrast size={16} />, on: prefs.mode === "a11y-gray" },
    { label: "Reiniciar", fn: () => setPrefs({ scale: 1, mode: null }), icon: <RotateCcw size={16} /> },
  ];

  // Va en un portal a <body>: así no le afectan el zoom ni los filtros de #root
  // (un filtro en un ancestro mueve el position:fixed y el botón "desaparecía").
  return createPortal(
    <div className={`a11y-widget${prefs.mode ? " " + prefs.mode : ""}`} style={{ position: "fixed", left: 16, bottom: 20, zIndex: 70 }}>
      {open && (
        <div style={{
          marginBottom: 10,
          background: "#fff",
          borderRadius: 8,
          boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
          padding: "14px 16px",
          width: "min(290px, calc(100vw - 32px))",
          border: `1px solid ${C.paperDim}`,
        }}>
          <div style={{ fontWeight: 700, color: C.navy, marginBottom: 4, fontSize: 16 }}>Opciones de accesibilidad</div>
          <div style={{ fontSize: 13.5, color: "#6b7785", marginBottom: 8 }}>
            Tamaño de letra: {Math.round(prefs.scale * 100)}%
          </div>
          {opciones.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.fn}
              disabled={item.off}
              aria-pressed={item.on === undefined ? undefined : item.on}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", textAlign: "left", padding: "9px 8px",
                border: "none", background: item.on ? `${C.busBlue}1f` : "transparent",
                cursor: item.off ? "not-allowed" : "pointer", opacity: item.off ? 0.45 : 1,
                fontSize: 15, color: item.on ? C.navy : C.ink, fontWeight: item.on ? 700 : 400, borderRadius: 8,
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
        aria-expanded={open}
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
    </div>,
    document.body
  );
}

export { ACCESOS };

/** Contenedor de tarjeta estándar */
export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 8,
      border: `1px solid ${C.paperDim}`,
      boxShadow: "rgba(18,22,30,0.024) 0px 1px 4px 0px, rgba(18,22,30,0.05) 0px 1px 0px 0px, rgba(18,22,30,0.024) 0px 0px 0px 1px",
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
        padding: "13px 20px",
        fontWeight: 700,
        fontSize: 16,
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
    <label style={{ display: "block", fontSize: 15, color: "#5b6675", marginBottom: 12 }}>
      <span style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>{label}</span>
      {children}
    </label>
  );
}

export const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: `1px solid ${C.paperDim}`,
  fontSize: 16,
  boxSizing: "border-box",
  background: "#fff",
  color: C.ink,
};

/** Encabezado uniforme para pantallas internas.
 *  Mismo estilo, márgenes y comportamiento que el de la página principal (GovHeader),
 *  pero sin el logo de la presidencia: muestra el título de la pantalla. */
export function StaffHeader({ title, subtitle, variant = "municipio", userLabel, onLogout, extra }) {
  const logoSecretaria = variant === "finanzas" || variant === "desarrollo";
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 50, background: "#fff", boxShadow: "0 2px 12px rgba(0,51,102,0.12)" }}>
      <div className="hdr-bar compact" style={{ background: C.navy, color: "#fff", minHeight: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          {logoSecretaria && (
            <span style={{ background: "#fff", borderRadius: 8, padding: "4px 8px", display: "flex", flexShrink: 0 }}>
              <BrandLogos variant={variant} height="clamp(30px, 6vw, 44px)" />
            </span>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "clamp(16px, 2.4vw, 20px)", fontWeight: 700, lineHeight: 1.2, overflowWrap: "anywhere" }}>{title}</div>
            {subtitle && <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>{subtitle}</div>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {extra}
          {userLabel && <span className="hdr-user" style={{ fontSize: 14, opacity: 0.95 }}>{userLabel}</span>}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              style={{ background: C.gold, color: C.navy, border: "none", borderRadius: 24, padding: "9px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Salir
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

/** Pantalla interna completa: header + contenido adaptable + footer (iguales en toda la app).
 *  maxWidth controla el ancho máximo del contenido en pantallas grandes. */
export function StaffLayout({
  title, subtitle, variant = "municipio", userLabel, onLogout, extra,
  maxWidth = 1200, background, children,
}) {
  return (
    <div className="page-shell" style={{ background: background || C.paper, fontFamily: "var(--font-sans)", color: C.ink }}>
      <StaffHeader title={title} subtitle={subtitle} variant={variant} userLabel={userLabel} onLogout={onLogout} extra={extra} />
      <main className="staff-main" style={{ "--staff-max": `${maxWidth}px` }}>
        {children}
      </main>
      <GovFooter />
      <A11yWidget />
    </div>
  );
}

/** Layout uniforme para pantallas internas con tarjetas (Recaudación, Transportistas) */
export function AppPage({ title, subtitle, children, onLogout, userLabel, variant = "municipio", maxWidth = 1200 }) {
  return (
    <StaffLayout title={title} subtitle={subtitle} variant={variant} userLabel={userLabel} onLogout={onLogout} maxWidth={maxWidth}>
      <div style={{ paddingTop: 20, paddingBottom: 40 }}>{children}</div>
    </StaffLayout>
  );
}
