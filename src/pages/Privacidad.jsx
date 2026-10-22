import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { C } from "../theme";
import { GovHeader, GovFooter, A11yWidget } from "../components/GovShell";

export default function Privacidad() {
  return (
    <div style={{ minHeight: "100vh", background: C.paper }}>
      <GovHeader compact />
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "28px 20px 48px" }}>
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.navy, fontWeight: 600, fontSize: 14, marginBottom: 20 }}>
          <ArrowLeft size={16} /> Inicio
        </Link>
        <h1 className="f-display" style={{ color: C.navy, fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>
          Aviso de privacidad
        </h1>
        <p style={{ color: "#6b7785", fontSize: 14, marginBottom: 24 }}>
          Versión 1.0 · Ley Federal de Protección de Datos Personales en Posesión de los Particulares y normativa aplicable a sujetos obligados · Jurisdicción: México
        </p>
        <div style={{ background: "#fff", borderRadius: 8, border: `1px solid ${C.paperDim}`, padding: 24, lineHeight: 1.65, fontSize: 15, color: C.ink }}>
          <h2 style={{ color: C.navy, fontSize: 18, marginTop: 0 }}>1. Responsable</h2>
          <p>H. Ayuntamiento de Calvillo, Aguascalientes, a través de las áreas de Desarrollo Social y Finanzas/Recaudación, es responsable del tratamiento de los datos personales recabados mediante el Sistema Digital de Beca de Transporte Estudiantil.</p>

          <h2 style={{ color: C.navy, fontSize: 18 }}>2. Datos que se recaban</h2>
          <p>Únicamente los necesarios para la solicitud, evaluación, otorgamiento y administración del beneficio (minimización): identificación y contacto del solicitante, datos escolares, trayectos, información socioeconómica familiar, documentos de soporte en PDF e información de uso del servicio (recargas y validaciones). No se solicitan datos adicionales a los previstos en el expediente del programa.</p>

          <h2 style={{ color: C.navy, fontSize: 18 }}>3. Finalidades</h2>
          <p>Primarias: tramitar y resolver solicitudes de beca, asignar rutas y descuentos, emitir credenciales digitales, gestionar recargas y validaciones en ruta, y atender reportes de errores. Secundarias: estadística e informes de gestión municipal, siempre de forma agregada cuando sea posible.</p>

          <h2 style={{ color: C.navy, fontSize: 18 }}>4. Transferencias</h2>
          <p>Los datos podrán compartirse con áreas internas del Ayuntamiento involucradas en el programa y, en su caso, con prestadores de transporte autorizados solo en la medida necesaria para la prestación del servicio. No se realizan transferencias comerciales a terceros.</p>

          <h2 style={{ color: C.navy, fontSize: 18 }}>5. Derechos ARCO y medios</h2>
          <p>El titular puede ejercer los derechos de acceso, rectificación, cancelación y oposición, así como limitar el uso o revocar el consentimiento, mediante solicitud en oficinas de Recaudación o a través del formulario de Ayuda del Sistema, acreditando su identidad conforme a la normativa aplicable.</p>

          <h2 style={{ color: C.navy, fontSize: 18 }}>6. Conservación</h2>
          <p>Los datos se conservarán el tiempo necesario para cumplir las finalidades y las obligaciones legales y de auditoría del Ayuntamiento, tras lo cual se procederá a su bloqueo o eliminación segura.</p>

          <h2 style={{ color: C.navy, fontSize: 18 }}>7. Seguridad</h2>
          <p>Se aplican medidas administrativas, técnicas y físicas razonables para proteger los datos contra daño, pérdida, alteración o acceso no autorizado.</p>

          <h2 style={{ color: C.navy, fontSize: 18 }}>8. Cambios al aviso</h2>
          <p>Cualquier modificación sustancial se publicará en el Sistema con nueva versión y fecha. Se recomienda revisar periódicamente este aviso.</p>

          <p style={{ marginTop: 28, fontSize: 13, color: "#8993A1" }}>
            Para más información: sección Ayuda del Sistema o Presidencia Municipal de Calvillo (horarios de atención de oficinas).
          </p>
        </div>
      </main>
      <GovFooter />
      <A11yWidget />
    </div>
  );
}
