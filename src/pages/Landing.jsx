import React from "react";
import { Link } from "react-router-dom";
import {
  FileText, ShieldCheck, Smartphone, Wallet, ChevronRight, Lock,
  MapPin, Clock, Bus, HelpCircle,
} from "lucide-react";
import { C, INSCRIPCIONES } from "../theme";
import { GovHeader, GovFooter, A11yWidget, PatternBar } from "../components/GovShell";

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
      padding: "48px 28px 56px",
    }}>
      {/* Formas decorativas */}
      <div aria-hidden style={{
        position: "absolute", right: -40, top: -40, width: 220, height: 220,
        borderRadius: "50%", background: "rgba(223,167,64,0.15)",
      }} />
      <div aria-hidden style={{
        position: "absolute", left: -60, bottom: -80, width: 280, height: 280,
        borderRadius: "50%", background: "rgba(164,211,238,0.1)",
      }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 36, alignItems: "center" }}>
        <div>
          <div style={{
            display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: 1.2,
            padding: "5px 12px", borderRadius: 20, background: "rgba(223,167,64,0.25)", color: C.gold, marginBottom: 14,
          }}>
            MOVILIDAD ESTUDIANTIL INTEGRAL
          </div>
          <h1 style={{ fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 800, lineHeight: 1.15, margin: "0 0 14px", letterSpacing: -0.5 }}>
            Beca de transporte<br />para estudiantes de Calvillo
          </h1>
          <p style={{ fontSize: 15.5, lineHeight: 1.55, opacity: 0.92, maxWidth: 440, margin: 0 }}>
            El Gobierno Municipal cubre parte del costo de tus viajes en las rutas participantes.
            Solicita en línea, recarga en ventanilla y viaja con tu pase digital.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
            {insc.abierto ? (
              <Link to="/solicitud" style={{
                padding: "12px 22px", borderRadius: 10, background: C.gold, color: C.navy,
                fontWeight: 800, fontSize: 14, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
              }}>
                <ChevronRight size={16} /> Inscribirme ahora
              </Link>
            ) : (
              <span style={{
                padding: "12px 22px", borderRadius: 10, background: "rgba(255,255,255,0.12)",
                fontWeight: 700, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 6,
              }}>
                <Lock size={14} /> {insc.texto}
              </span>
            )}
            <Link to="/ayuda" style={{
              padding: "12px 22px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.4)",
              color: "#fff", fontWeight: 600, fontSize: 14, textDecoration: "none",
            }}>
              Ayuda y FAQ
            </Link>
          </div>
        </div>

        {/* Tarjeta de periodo */}
        <div style={{
          background: "#fff", color: C.ink, borderRadius: 16, padding: 22,
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)", maxWidth: 380, marginLeft: "auto", width: "100%",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <FileText size={16} color={C.busBlue} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: "#6b7785" }}>PERIODO DE INSCRIPCIÓN</span>
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.navy, marginBottom: 4 }}>
            {new Date(INSCRIPCIONES.abre).toLocaleDateString("es-MX", { day: "numeric", month: "long" })}
            {" – "}
            {new Date(INSCRIPCIONES.cierra).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
          </div>
          <div style={{ fontSize: 13, color: insc.abierto ? "#2E8B57" : C.garnet, fontWeight: 600, marginBottom: 16 }}>
            {insc.texto}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { icon: MapPin, t: "Rutas locales", d: "Origen → destino" },
              { icon: Wallet, t: "40% estudiante", d: "Subsidio municipal" },
              { icon: Smartphone, t: "Pase digital", d: "QR en el celular" },
              { icon: Bus, t: "En la combi", d: "Validación rápida" },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} style={{ background: C.paper, borderRadius: 10, padding: "10px 12px" }}>
                <Icon size={16} color={C.navy} />
                <div style={{ fontSize: 12.5, fontWeight: 700, color: C.navy, marginTop: 4 }}>{t}</div>
                <div style={{ fontSize: 11, color: "#6b7785" }}>{d}</div>
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
    { icon: Wallet, t: "Recarga y viaja", d: "Paga el 40% en ventanilla y valida el pase con el chofer." },
  ];
  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 28px" }}>
      <h2 style={{ textAlign: "center", color: C.navy, fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
        ¿Cómo funciona?
      </h2>
      <p style={{ textAlign: "center", color: "#6b7785", fontSize: 14, marginBottom: 28, maxWidth: 480, marginInline: "auto" }}>
        Cuatro pasos para formar parte del programa de beca de transporte.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {pasos.map(({ icon: Icon, t, d }, i) => (
          <div key={t} style={{
            background: "#fff", borderRadius: 14, padding: 20,
            border: `1px solid ${C.paperDim}`,
            boxShadow: "0 4px 14px rgba(0,51,102,0.05)",
            position: "relative",
          }}>
            <div style={{
              position: "absolute", top: 12, right: 14, fontSize: 28, fontWeight: 800,
              color: `${C.navy}14`, lineHeight: 1,
            }}>{i + 1}</div>
            <div style={{
              width: 42, height: 42, borderRadius: 12, background: `${C.busBlue}18`,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12,
            }}>
              <Icon size={20} color={C.busBlue} />
            </div>
            <div style={{ fontWeight: 750, color: C.navy, fontSize: 15, marginBottom: 6 }}>{t}</div>
            <div style={{ fontSize: 13, color: "#5b6675", lineHeight: 1.45 }}>{d}</div>
          </div>
        ))}
      </div>
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
    <section style={{ background: C.paper, padding: "40px 28px 48px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", color: C.navy, fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
          Servicios en línea
        </h2>
        <div style={{ width: 48, height: 3, background: C.gold, margin: "0 auto 24px", borderRadius: 2 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {cards.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              style={{
                textDecoration: "none",
                borderRadius: 14,
                overflow: "hidden",
                background: "#fff",
                boxShadow: "0 6px 18px rgba(0,51,102,0.08)",
                border: `1px solid ${C.paperDim}`,
                display: "flex",
                flexDirection: "column",
                minHeight: 150,
                transition: "transform 0.15s ease",
              }}
            >
              <div style={{ height: 6, background: c.color }} />
              <div style={{ padding: "18px 18px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ fontWeight: 800, color: C.navy, fontSize: 15.5, marginBottom: 8 }}>{c.t}</div>
                <div style={{ fontSize: 13, color: "#5b6675", lineHeight: 1.45, flex: 1 }}>{c.d}</div>
                <div style={{ marginTop: 12, fontSize: 12.5, fontWeight: 700, color: c.color, display: "flex", alignItems: "center", gap: 4 }}>
                  Entrar <ChevronRight size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FranjaGuayaba() {
  return (
    <section style={{
      padding: "36px 28px",
      background: `linear-gradient(90deg, ${C.navy} 0%, ${C.navySoft} 100%)`,
      color: "#fff",
      textAlign: "center",
    }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, color: C.gold, marginBottom: 8 }}>
          CALVILLO · CAPITAL DE LA GUAYABA
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 10px", lineHeight: 1.25 }}>
          Un municipio que apuesta por sus estudiantes
        </h2>
        <p style={{ margin: 0, fontSize: 14.5, opacity: 0.9, lineHeight: 1.5 }}>
          La beca de transporte acerca la escuela a más jóvenes: menos costo de traslado, más continuidad en los estudios.
        </p>
      </div>
    </section>
  );
}

export default function Landing() {
  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", color: C.ink }}>
      <GovHeader />
      <Hero />
      <PatternBar height={5} />
      <ComoFunciona />
      <Servicios />
      <FranjaGuayaba />
      <GovFooter />
      <A11yWidget />
    </div>
  );
}
