import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText, ShieldCheck, Smartphone, Wallet, ChevronRight, Lock,
  MapPin, Bus,
} from "lucide-react";
import { C, INSCRIPCIONES } from "../theme";
import { GovHeader, GovFooter, A11yWidget } from "../components/GovShell";

/** Hace aparecer su contenido (fade + subida) cuando entra a la pantalla al hacer scroll. */
function Reveal({ children, delay = 0, style, className = "" }) {
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
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [visto]);

  return (
    <div
      ref={ref}
      className={`reveal${visto ? " in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {children}
    </div>
  );
}

function estadoInscripcion() {
  const hoy = new Date();
  const abre = new Date(INSCRIPCIONES.abre);
  const cierra = new Date(INSCRIPCIONES.cierra);
  const fmt = (d) => d.toLocaleDateString("es-MX", { day: "numeric", month: "long" });
  if (hoy < abre) return { abierto: false, texto: `Abren el ${fmt(abre)}` };
  if (hoy > cierra) return { abierto: false, texto: `Cerraron el ${fmt(cierra)}` };
  return { abierto: true, texto: `Cierran el ${fmt(cierra)}` };
}

function Hero() {
  const insc = estadoInscripcion();
  return (
    <section style={{
      position: "relative",
      overflow: "hidden",
      background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navySoft} 55%, #0a5a8a 100%)`,
      color: "#fff",
      padding: "clamp(32px, 6vw, 60px) clamp(16px, 4vw, 28px) clamp(36px, 6vw, 64px)",
    }}>
      {/* Formas decorativas */}
      <div aria-hidden className="anim-float" style={{
        position: "absolute", right: -40, top: -40, width: 220, height: 220,
        borderRadius: "50%", background: "rgba(223,167,64,0.15)",
      }} />
      <div aria-hidden className="anim-float" style={{ animationDelay: "-3s",
        position: "absolute", left: -60, bottom: -80, width: 280, height: 280,
        borderRadius: "50%", background: "rgba(164,211,238,0.1)",
      }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))", gap: "clamp(24px, 4vw, 40px)", alignItems: "center" }}>
        <div className="anim-up">
          <div style={{
            display: "inline-block", fontSize: 13, fontWeight: 700, letterSpacing: 1.2,
            padding: "6px 14px", borderRadius: 20, background: "rgba(223,167,64,0.25)", color: C.gold, marginBottom: 14,
          }}>
            MOVILIDAD ESTUDIANTIL INTEGRAL
          </div>
          <h1 style={{ fontSize: "clamp(30px, 5.2vw, 48px)", fontWeight: 800, lineHeight: 1.15, margin: "0 0 16px", letterSpacing: -0.5 }}>
            Beca de transporte<br />para estudiantes de Calvillo
          </h1>
          <p style={{ fontSize: "clamp(16.5px, 2.2vw, 19px)", lineHeight: 1.55, opacity: 0.95, maxWidth: 520, margin: 0 }}>
            El Gobierno Municipal cubre parte del costo de tus viajes en las rutas participantes.
            Solicita en línea, recarga en ventanilla y viaja con tu pase digital.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 26 }}>
            {insc.abierto ? (
              <Link to="/solicitud" className="btn-anim" style={{
                padding: "14px 26px", borderRadius: 8, background: C.gold, color: C.navy,
                fontWeight: 800, fontSize: 17, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
              }}>
                <ChevronRight size={18} /> Inscribirme ahora
              </Link>
            ) : (
              <span style={{
                padding: "14px 26px", borderRadius: 8, background: "rgba(255,255,255,0.12)",
                fontWeight: 700, fontSize: 17, display: "inline-flex", alignItems: "center", gap: 6,
              }}>
                <Lock size={16} /> {insc.texto}
              </span>
            )}
            <Link to="/ayuda" className="btn-anim" style={{
              padding: "14px 26px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.5)",
              color: "#fff", fontWeight: 600, fontSize: 17, textDecoration: "none",
            }}>
              Ayuda y FAQ
            </Link>
          </div>
        </div>

        {/* Tarjeta de periodo */}
        <div className="hero-card anim-right" style={{
          background: "#fff", color: C.ink, borderRadius: 8, padding: "clamp(18px, 3vw, 26px)",
          boxShadow: "rgba(30,30,44,0.15) 24px 48px 64px 0px, rgb(255,255,255) 0px 0px 0px 1px inset", maxWidth: 440, width: "100%",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <FileText size={18} color={C.busBlue} />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.6, color: "#6b7785" }}>PERIODO DE INSCRIPCIÓN</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.navy, marginBottom: 4 }}>
            {new Date(INSCRIPCIONES.abre).toLocaleDateString("es-MX", { day: "numeric", month: "long" })}
            {" – "}
            {new Date(INSCRIPCIONES.cierra).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
          </div>
          <div style={{ fontSize: 15, color: insc.abierto ? "#2E8B57" : C.garnet, fontWeight: 600, marginBottom: 16 }}>
            {insc.texto}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { icon: MapPin, t: "Rutas locales", d: "Origen → destino" },
              { icon: Wallet, t: "60% descuento", d: "A estudiantes" },
              { icon: Smartphone, t: "Pase digital", d: "QR en el celular" },
              { icon: Bus, t: "En la combi", d: "Validación rápida" },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} style={{ background: C.paper, borderRadius: 10, padding: "12px 14px" }}>
                <Icon size={18} color={C.navy} />
                <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginTop: 4 }}>{t}</div>
                <div style={{ fontSize: 13, color: "#6b7785" }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ComoFunciona() {
  const pasos = [
    { icon: FileText, t: "Llena tu solicitud", d: "Datos, escuela y de dónde a dónde viajas, con documentos PDF." },
    { icon: ShieldCheck, t: "Revisión municipal", d: "Desarrollo Social valida y asigna ruta y precio del boleto." },
    { icon: Smartphone, t: "Recibe tu acceso", d: "Usuario, contraseña y pase QR en tu cuenta de estudiante." },
    { icon: Wallet, t: "Recarga y viaja", d: "Paga el 40% restante en ventanilla y valida el pase con el chofer." },
  ];
  return (
    <section style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(32px, 6vw, 56px) clamp(16px, 4vw, 28px)" }}>
      <Reveal>
        <h2 style={{ textAlign: "center", color: C.navy, fontSize: "clamp(25px, 4vw, 32px)", fontWeight: 800, marginBottom: 8 }}>
          ¿Cómo funciona?
        </h2>
        <p style={{ textAlign: "center", color: "#6b7785", fontSize: 16.5, marginBottom: 28, maxWidth: 560, marginInline: "auto" }}>
          Cuatro pasos para formar parte del programa de beca de transporte.
        </p>
      </Reveal>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(230px, 100%), 1fr))", gap: 16 }}>
        {pasos.map(({ icon: Icon, t, d }, i) => (
          <Reveal key={t} delay={i * 110} style={{ display: "flex" }}>
          <div className="lift" style={{
            flex: 1,
            background: "#fff", borderRadius: 8, padding: 22,
            border: `1px solid ${C.paperDim}`,
            boxShadow: "rgba(18,22,30,0.024) 0px 1px 4px 0px, rgba(18,22,30,0.05) 0px 1px 0px 0px, rgba(18,22,30,0.024) 0px 0px 0px 1px",
            position: "relative",
          }}>
            <div style={{
              position: "absolute", top: 12, right: 14, fontSize: 32, fontWeight: 800,
              color: `${C.navy}14`, lineHeight: 1,
            }}>{i + 1}</div>
            <div style={{
              width: 48, height: 48, borderRadius: 8, background: `${C.busBlue}18`,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12,
            }}>
              <Icon size={24} color={C.busBlue} />
            </div>
            <div style={{ fontWeight: 750, color: C.navy, fontSize: 18, marginBottom: 6 }}>{t}</div>
            <div style={{ fontSize: 15.5, color: "#5b6675", lineHeight: 1.5 }}>{d}</div>
          </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function VideoPromo() {
  return (
    <section
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 clamp(16px, 4vw, 28px) clamp(28px, 5vw, 48px)",
      }}
    >
      <Reveal>
        <h2
          style={{
            textAlign: "center",
            color: C.navy,
            fontSize: "clamp(22px, 3.6vw, 28px)",
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          Conoce Pase Calvillo
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "#6b7785",
            fontSize: 16,
            marginBottom: 20,
            maxWidth: 520,
            marginInline: "auto",
          }}
        >
          En 21 segundos: cómo solicitar, recargar y viajar con tu beca de transporte.
        </p>
      </Reveal>
      <Reveal delay={80}>
        <div
          style={{
            borderRadius: 12,
            overflow: "hidden",
            border: `1px solid ${C.paperDim}`,
            boxShadow:
              "rgba(18,22,30,0.06) 0px 4px 16px 0px, rgba(18,22,30,0.04) 0px 1px 0px 0px",
            background: "#0a0a0a",
            maxWidth: 900,
            margin: "0 auto",
            aspectRatio: "16 / 9",
          }}
        >
          <video
            src="/pase_calvillo_21s.mp4"
            controls
            playsInline
            preload="metadata"
            poster=""
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              background: "#f5f0e6",
            }}
          >
            Tu navegador no soporta video HTML5.
          </video>
        </div>
      </Reveal>
    </section>
  );
}

function Servicios() {
  const cards = [
    {
      to: "/solicitud",
      t: "Solicitud de beca",
      d: "Inscríbete en línea con tus datos y documentos.",
      color: C.navy,
    },
    {
      to: "/alumno/login",
      t: "Mi pase digital",
      d: "Consulta saldo, historial y código QR.",
      color: C.busBlue,
    },
    {
      to: "/ayuda",
      t: "Ayuda y FAQ",
      d: "Preguntas frecuentes y reporte de fallas.",
      color: C.garnet,
    },
    {
      to: "/acceso",
      t: "Personal municipal",
      d: "Accesos de ventanilla, choferes y áreas.",
      color: C.navySoft,
    },
  ];
  return (
    <section style={{ background: C.paper, padding: "clamp(32px, 6vw, 52px) clamp(16px, 4vw, 28px) clamp(36px, 6vw, 56px)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Reveal>
          <h2 style={{ textAlign: "center", color: C.navy, fontSize: "clamp(24px, 3.6vw, 30px)", fontWeight: 800, marginBottom: 6 }}>
            Servicios en línea
          </h2>
          <div style={{ width: 48, height: 3, background: C.gold, margin: "0 auto 24px", borderRadius: 2 }} />
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(250px, 100%), 1fr))", gap: 16 }}>
          {cards.map((c, i) => (
            <Reveal key={c.to} delay={i * 110} style={{ display: "flex" }}>
            <Link
              to={c.to}
              className="lift"
              style={{
                flex: 1,
                textDecoration: "none",
                borderRadius: 8,
                overflow: "hidden",
                background: "#fff",
                boxShadow: "rgba(18,22,30,0.024) 0px 1px 4px 0px, rgba(18,22,30,0.05) 0px 1px 0px 0px, rgba(18,22,30,0.024) 0px 0px 0px 1px",
                border: `1px solid ${C.paperDim}`,
                display: "flex",
                flexDirection: "column",
                minHeight: 160,
              }}
            >
              <div style={{ height: 6, background: c.color }} />
              <div style={{ padding: "20px 20px 18px", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ fontWeight: 800, color: C.navy, fontSize: 18, marginBottom: 8 }}>{c.t}</div>
                <div style={{ fontSize: 15.5, color: "#5b6675", lineHeight: 1.5, flex: 1 }}>{c.d}</div>
                <div style={{ marginTop: 14, fontSize: 15, fontWeight: 700, color: c.color, display: "flex", alignItems: "center", gap: 4 }}>
                  Entrar <ChevronRight size={16} />
                </div>
              </div>
            </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FranjaGuayaba() {
  return (
    <section style={{
      padding: "clamp(32px, 6vw, 48px) clamp(16px, 4vw, 28px)",
      background: `linear-gradient(90deg, ${C.navy} 0%, ${C.navySoft} 100%)`,
      color: "#fff",
      textAlign: "center",
    }}>
      <Reveal style={{ maxWidth: 780, margin: "0 auto" }}>
        <h2 style={{ fontSize: "clamp(24px, 3.6vw, 30px)", fontWeight: 800, margin: "0 0 12px", lineHeight: 1.25 }}>
          Un municipio que apuesta por sus estudiantes
        </h2>
        <p style={{ margin: 0, fontSize: "clamp(16px, 2vw, 18px)", opacity: 0.92, lineHeight: 1.55 }}>
          La beca de transporte acerca la escuela a más jóvenes: menos costo de traslado, más continuidad en los estudios.
        </p>
      </Reveal>
    </section>
  );
}

export default function Landing() {
  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "var(--font-sans)", color: C.ink }}>
      <GovHeader />
      <Hero />
      <ComoFunciona />
      <VideoPromo />
      <Servicios />
      <FranjaGuayaba />
      <GovFooter flush />
      <A11yWidget />
    </div>
  );
}
