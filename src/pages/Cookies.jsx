import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { C } from "../theme";
import { GovHeader, GovFooter, A11yWidget } from "../components/GovShell";

export default function Cookies() {
  return (
    <div style={{ minHeight: "100vh", background: C.paper }}>
      <GovHeader compact />
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "28px 20px 48px" }}>
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.navy, fontWeight: 600, fontSize: 14, marginBottom: 20 }}>
          <ArrowLeft size={16} /> Inicio
        </Link>
        <h1 className="f-display" style={{ color: C.navy, fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>
          Política de cookies
        </h1>
        <p style={{ color: "#6b7785", fontSize: 14, marginBottom: 24 }}>
          Versión 1.0 · H. Ayuntamiento de Calvillo · Jurisdicción: México
        </p>
        <div style={{ background: "#fff", borderRadius: 8, border: `1px solid ${C.paperDim}`, padding: 24, lineHeight: 1.65, fontSize: 15, color: C.ink }}>
          <h2 style={{ color: C.navy, fontSize: 18, marginTop: 0 }}>1. ¿Qué son las cookies y el almacenamiento local?</h2>
          <p>Este Sistema utiliza almacenamiento local del navegador (localStorage) y, en su caso, cookies técnicas para el funcionamiento esencial: sesión de usuario, preferencias de accesibilidad y registro de aceptación de documentos legales.</p>

          <h2 style={{ color: C.navy, fontSize: 18 }}>2. Finalidad</h2>
          <ul>
            <li><strong>Esenciales:</strong> mantener la sesión autenticada, recordar preferencias de accesibilidad y constancia de aceptación de Términos y Aviso de Privacidad.</li>
            <li><strong>No se utilizan</strong> cookies de publicidad, analítica de terceros ni rastreo comercial.</li>
          </ul>

          <h2 style={{ color: C.navy, fontSize: 18 }}>3. Base y consentimiento</h2>
          <p>Las técnicas estrictamente necesarias operan para prestar el servicio solicitado. El consentimiento para el tratamiento asociado a documentos legales se recaba mediante el aviso de primera visita y los checkboxes en formularios de alta, de forma separada e informada.</p>

          <h2 style={{ color: C.navy, fontSize: 18 }}>4. Gestión</h2>
          <p>Puede borrar el almacenamiento local desde la configuración de su navegador. Al hacerlo, podría requerirse volver a iniciar sesión y aceptar nuevamente los documentos legales para continuar usando el Sistema.</p>

          <h2 style={{ color: C.navy, fontSize: 18 }}>5. Actualizaciones</h2>
          <p>Esta política puede actualizarse; la versión vigente se publica en esta página con su número de versión.</p>

          <p style={{ marginTop: 28, fontSize: 13, color: "#8993A1" }}>
            Inventario actual: almacenamiento de sesión, preferencias de accesibilidad (a11y-prefs) y registro de aceptación legal (consent-legal-v1). Sin cookies de terceros.
          </p>
        </div>
      </main>
      <GovFooter />
      <A11yWidget />
    </div>
  );
}
