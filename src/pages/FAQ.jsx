import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, ChevronDown, HelpCircle, Bug, Send, CheckCircle2,
  ShieldAlert, Loader2, MessageSquareWarning,
} from "lucide-react";
import { C } from "../theme";
import { GovHeader, GovFooter, A11yWidget } from "../components/GovShell";
import api from "../api";
import BrandLogos from "../components/BrandLogos";

const PREGUNTAS = [
  {
    cat: "Solicitud de beca",
    items: [
      {
        q: "¿Cómo solicito la beca de transporte?",
        a: "Entra a la página principal y pulsa «Inscribirme ahora» en el periodo de inscripción. Llena tus datos, indica de dónde a dónde viajas y envía la solicitud. Recaudación la revisa y te avisa por correo.",
      },
      {
        q: "¿Qué hago si me piden una corrección?",
        a: "Recibirás un correo con el motivo. Corrige lo indicado y vuelve a enviar o acude a Recaudación en la Presidencia Municipal. Tu solicitud original no se elimina.",
      },
      {
        q: "No sé el nombre exacto de mi ruta",
        a: "En el formulario escribe libremente de qué punto a qué punto viajas (por ejemplo: «De Malpaso a UPA»). Al aprobar, Recaudación asigna el nombre oficial y el costo de la ruta.",
      },
    ],
  },
  {
    cat: "Tarjeta y viajes",
    items: [
      {
        q: "¿Dónde veo mi saldo de viajes?",
        a: "Inicia sesión como estudiante. En tu dashboard aparece tu tarjeta digital, el código QR, las rutas asignadas y cuántos viajes te quedan.",
      },
      {
        q: "¿Cómo recargo viajes?",
        a: "Las recargas son en efectivo, en la ventanilla de la Presidencia Municipal. Presenta tu matrícula, tu nombre o el QR de tu tarjeta. Te cargan los viajes al momento.",
      },
      {
        q: "Perdí mi teléfono / alguien tiene mi QR",
        a: "Avisa de inmediato a Recaudación. Pueden revocar el código QR actual; al abrir tu app obtendrás uno nuevo y el anterior dejará de funcionar en el camión.",
      },
    ],
  },
  {
    cat: "Uso en el camión",
    items: [
      {
        q: "¿El QR funciona sin señal?",
        a: "Tu QR se muestra aunque no tengas datos. El operador descarga al inicio del turno la lista de alumnos de su ruta y puede validar pases aunque se pierda la cobertura en el camino.",
      },
      {
        q: "Me rechazaron el pase ¿por qué?",
        a: "Puede ser: sin viajes disponibles, ruta incorrecta (el camión no es de tu ruta asignada), o QR revocado. Recarga en Presidencia o verifica con Recaudación tus rutas.",
      },
    ],
  },
  {
    cat: "Cuenta y acceso",
    items: [
      {
        q: "¿Cuándo recibo usuario y contraseña?",
        a: "Cuando Recaudación aprueba tu solicitud. Te llegan por correo. El usuario suele ser tu matrícula en minúsculas.",
      },
      {
        q: "Olvidé mi contraseña",
        a: "Por ahora acude a Recaudación en la Presidencia Municipal con una identificación para que te ayuden a restablecer el acceso. Pronto habrá recuperación por correo.",
      },
    ],
  },
];

function Acordeon({ pregunta, respuesta }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${C.paperDim}` }}>
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        style={{
          width: "100%", textAlign: "left", display: "flex", justifyContent: "space-between",
          alignItems: "center", gap: 10, padding: "14px 0", background: "none", border: "none",
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 16.4, fontWeight: 600, color: C.navy, lineHeight: 1.35 }}>{pregunta}</span>
        <ChevronDown
          size={16}
          color={C.busBlue}
          style={{ flexShrink: 0, transform: abierto ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
        />
      </button>
      {abierto && (
        <div style={{ fontSize: 15.8, color: "#5B6675", lineHeight: 1.55, paddingBottom: 14 }}>
          {respuesta}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%", border: `1px solid ${C.paperDim}`, borderRadius: 9,
  padding: "10px 12px", fontSize: 16.4, color: C.ink, outline: "none",
  boxSizing: "border-box", background: "#fff",
};

function FormularioBug() {
  const [form, setForm] = useState({
    nombre: "", correo: "", rol: "estudiante", titulo: "", descripcion: "", pagina: "",
  });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function enviar(e) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await api.reportarBug({
        ...form,
        pagina: form.pagina || (typeof window !== "undefined" ? window.location.pathname : ""),
      });
      setEnviado(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div style={{ textAlign: "center", padding: "20px 10px" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: `${C.mint}33`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
          <CheckCircle2 size={26} color="#1F7A56" />
        </div>
        <div className="f-display" style={{ fontSize: 18.8, fontWeight: 700, color: C.navy }}>Reporte enviado</div>
        <p style={{ fontSize: 15.8, color: "#5B6675", marginTop: 8, lineHeight: 1.5 }}>
          Gracias. El equipo revisará el problema. Si dejaste correo, podremos contactarte si hace falta más información.
        </p>
        <button
          type="button"
          onClick={() => { setEnviado(false); setForm({ nombre: "", correo: "", rol: "estudiante", titulo: "", descripcion: "", pagina: "" }); }}
          style={{ marginTop: 14, background: "none", border: `1px solid ${C.paperDim}`, borderRadius: 9, padding: "9px 14px", fontSize: 15.1, color: C.navy, cursor: "pointer" }}
        >
          Enviar otro reporte
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar}>
      <p style={{ fontSize: 15.1, color: "#5B6675", marginTop: 0, marginBottom: 14, lineHeight: 1.5 }}>
        ¿Algo no funciona? Cuéntanos qué pasó. No es un canal de soporte urgente: para trámites de beca acude a Recaudación.
      </p>

      <label style={{ display: "block", fontSize: 13.9, fontWeight: 600, color: C.navy, marginBottom: 4 }}>Título del problema *</label>
      <input style={{ ...inputStyle, marginBottom: 12 }} value={form.titulo} onChange={set("titulo")} placeholder="Ej. No carga el QR en mi celular" required maxLength={200} />

      <label style={{ display: "block", fontSize: 13.9, fontWeight: 600, color: C.navy, marginBottom: 4 }}>Descripción *</label>
      <textarea
        style={{ ...inputStyle, marginBottom: 12, minHeight: 90, resize: "vertical" }}
        value={form.descripcion}
        onChange={set("descripcion")}
        placeholder="Qué estabas haciendo, qué esperabas y qué ocurrió. Si puedes, indica el navegador o modelo de celular."
        required
        maxLength={4000}
      />

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 13.9, fontWeight: 600, color: C.navy, marginBottom: 4 }}>Soy</label>
          <select style={inputStyle} value={form.rol} onChange={set("rol")}>
            <option value="estudiante">Estudiante</option>
            <option value="recaudacion">Recaudación</option>
            <option value="ventanilla">Ventanilla</option>
            <option value="camionero">Operador de camión</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 13.9, fontWeight: 600, color: C.navy, marginBottom: 4 }}>Página (opcional)</label>
          <input style={inputStyle} value={form.pagina} onChange={set("pagina")} placeholder="/alumno, /recarga…" />
        </div>
      </div>

      <label style={{ display: "block", fontSize: 13.9, fontWeight: 600, color: C.navy, marginBottom: 4 }}>Nombre (opcional)</label>
      <input style={{ ...inputStyle, marginBottom: 12 }} value={form.nombre} onChange={set("nombre")} placeholder="Tu nombre" />

      <label style={{ display: "block", fontSize: 13.9, fontWeight: 600, color: C.navy, marginBottom: 4 }}>Correo (opcional)</label>
      <input style={{ ...inputStyle, marginBottom: 14 }} type="email" value={form.correo} onChange={set("correo")} placeholder="para contactarte si hace falta" />

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 7, background: `${C.garnet}12`, border: `1px solid ${C.garnet}`, color: C.garnet, borderRadius: 9, padding: "10px 12px", fontSize: 14.5, marginBottom: 12 }}>
          <ShieldAlert size={13} /> {error}
        </div>
      )}

      <button
        type="submit"
        disabled={enviando}
        style={{
          width: "100%", padding: "12px 0", borderRadius: 10, border: "none",
          background: C.busBlue, color: "#fff", fontWeight: 700, fontSize: 17.0,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          cursor: enviando ? "default" : "pointer",
        }}
      >
        {enviando ? <><Loader2 size={15} className="spin" /> Enviando…</> : <><Send size={15} /> Enviar reporte</>}
      </button>
    </form>
  );
}

export default function FAQ() {
  const [tab, setTab] = useState("faq"); // faq | bug

  return (
    <div className="page-shell" style={{ background: "#fff" }}>
      <GovHeader compact />

      <div className="page-body" style={{ maxWidth: 880, margin: "0 auto", padding: "clamp(20px, 4vw, 40px) clamp(16px, 4vw, 24px) 40px" }}>
        <div className="f-display" style={{ fontSize: 17, fontWeight: 700, color: C.navy, display: "flex", alignItems: "center", gap: 8 }}>
          <HelpCircle size={20} color={C.busBlue} /> Ayuda
        </div>
        <p style={{ fontSize: 15.8, color: "#6b7785", marginTop: 6, marginBottom: 16 }}>
          Preguntas frecuentes y reporte de errores del sistema.
        </p>

        <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
          <button
            type="button"
            onClick={() => setTab("faq")}
            style={{
              flex: 1, padding: "9px 0", borderRadius: 9, fontSize: 15.1, fontWeight: 700, cursor: "pointer",
              border: `1px solid ${tab === "faq" ? C.busBlue : C.paperDim}`,
              background: tab === "faq" ? C.busBlue : "#fff",
              color: tab === "faq" ? "#fff" : C.ink,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <HelpCircle size={14} /> Preguntas frecuentes
          </button>
          <button
            type="button"
            onClick={() => setTab("bug")}
            style={{
              flex: 1, padding: "9px 0", borderRadius: 9, fontSize: 15.1, fontWeight: 700, cursor: "pointer",
              border: `1px solid ${tab === "bug" ? C.busBlue : C.paperDim}`,
              background: tab === "bug" ? C.busBlue : "#fff",
              color: tab === "bug" ? "#fff" : C.ink,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Bug size={14} /> Reportar un error
          </button>
        </div>

        {tab === "faq" ? (
          <div>
            {PREGUNTAS.map((bloque) => (
              <div key={bloque.cat} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13.3, fontWeight: 700, color: C.busBlue, letterSpacing: 0.5, marginBottom: 4 }}>
                  {bloque.cat.toUpperCase()}
                </div>
                <div style={{ background: C.paper, borderRadius: 12, padding: "0 14px", border: `1px solid ${C.paperDim}` }}>
                  {bloque.items.map((item) => (
                    <Acordeon key={item.q} pregunta={item.q} respuesta={item.a} />
                  ))}
                </div>
              </div>
            ))}
            <div style={{ background: `${C.skyBlue}33`, borderRadius: 12, padding: 14, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <MessageSquareWarning size={16} color={C.navy} style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ fontSize: 15.1, color: C.ink, lineHeight: 1.5 }}>
                ¿No encontraste tu respuesta? Usa la pestaña <strong>Reportar un error</strong> o acude a Recaudación de la Propiedad Raíz en la Presidencia Municipal (lun–vie 9:00–15:00).
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: C.paper, border: `1px solid ${C.paperDim}`, borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Bug size={16} color={C.garnet} />
              <span className="f-display" style={{ fontSize: 17.6, fontWeight: 700, color: C.navy }}>Reporte de errores</span>
            </div>
            <FormularioBug />
          </div>
        )}
      </div>
      <GovFooter />
      <A11yWidget />
    </div>
  );
}
