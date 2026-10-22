import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { C } from "../theme";
import { GovHeader, GovFooter, A11yWidget } from "../components/GovShell";

export default function Terminos() {
  return (
    <div style={{ minHeight: "100vh", background: C.paper }}>
      <GovHeader compact />
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "28px 20px 48px" }}>
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.navy, fontWeight: 600, fontSize: 14, marginBottom: 20 }}>
          <ArrowLeft size={16} /> Inicio
        </Link>
        <h1 className="f-display" style={{ color: C.navy, fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>
          Términos y condiciones
        </h1>
        <p style={{ color: "#6b7785", fontSize: 14, marginBottom: 24 }}>
          Versión 1.0 · Jurisdicción: México · H. Ayuntamiento de Calvillo, Ags.
        </p>
        <div style={{ background: "#fff", borderRadius: 8, border: `1px solid ${C.paperDim}`, padding: 24, lineHeight: 1.65, fontSize: 15, color: C.ink }}>
          <h2 style={{ color: C.navy, fontSize: 18, marginTop: 0 }}>1. Objeto</h2>
          <p>El presente documento regula el uso del Sistema Digital de Beca de Transporte Estudiantil del municipio de Calvillo, Aguascalientes (en adelante, «el Sistema»).</p>

          <h2 style={{ color: C.navy, fontSize: 18 }}>2. Aceptación</h2>
          <p>Al acceder o utilizar el Sistema, el usuario declara haber leído y aceptado estos Términos y el Aviso de Privacidad. El uso del Sistema implica la aceptación plena de ambos documentos en su versión vigente.</p>

          <h2 style={{ color: C.navy, fontSize: 18 }}>3. Destinatarios del programa</h2>
          <p>El programa está dirigido a estudiantes con residencia en el municipio de Calvillo que acrediten necesidad de apoyo para el traslado a su centro educativo, conforme a los criterios que determine la Dirección de Desarrollo Social.</p>

          <h2 style={{ color: C.navy, fontSize: 18 }}>4. Solicitud y veracidad</h2>
          <p>El solicitante se obliga a proporcionar información veraz y documentos auténticos. La falsedad u omisión relevante podrá dar lugar al rechazo o cancelación del beneficio y a las consecuencias legales aplicables.</p>

          <h2 style={{ color: C.navy, fontSize: 18 }}>5. Beneficio y descuento</h2>
          <p>El beneficio consiste en un subsidio municipal sobre el costo del viaje en rutas autorizadas. El porcentaje aplicable se comunica al beneficiario al aprobarse su solicitud. El pago de la parte a cargo del estudiante se realiza en la ventanilla habilitada por el Ayuntamiento.</p>

          <h2 style={{ color: C.navy, fontSize: 18 }}>6. Uso de la tarjeta digital y QR</h2>
          <p>La tarjeta digital y el código QR son personales e intransferibles. El beneficiario es responsable de su resguardo. En caso de pérdida o uso indebido debe notificar de inmediato a Recaudación para la revocación del código.</p>

          <h2 style={{ color: C.navy, fontSize: 18 }}>7. Limitación de responsabilidad</h2>
          <p>El Ayuntamiento no garantiza disponibilidad ininterrumpida del Sistema. Podrá suspender o modificar el servicio por mantenimiento, fuerza mayor o causas de interés público, sin perjuicio de los derechos que la ley reconozca al usuario.</p>

          <h2 style={{ color: C.navy, fontSize: 18 }}>8. Propiedad intelectual</h2>
          <p>Los contenidos, marcas, logotipos y software del Sistema son propiedad del H. Ayuntamiento de Calvillo o de sus licenciantes. Queda prohibida su reproducción no autorizada.</p>

          <h2 style={{ color: C.navy, fontSize: 18 }}>9. Modificaciones</h2>
          <p>El Ayuntamiento podrá actualizar estos Términos. La versión vigente se publicará en el Sistema con indicación de versión y fecha. El uso continuado tras la publicación implica aceptación de los cambios, salvo que la ley exija un consentimiento específico.</p>

          <h2 style={{ color: C.navy, fontSize: 18 }}>10. Jurisdicción</h2>
          <p>Para la interpretación y cumplimiento de estos Términos, las partes se someten a las leyes de los Estados Unidos Mexicanos y a los tribunales competentes del estado de Aguascalientes, renunciando a cualquier otro fuero que pudiera corresponderles.</p>

          <p style={{ marginTop: 28, fontSize: 13, color: "#8993A1" }}>
            Documento oficial del H. Ayuntamiento de Calvillo · Dirección de Desarrollo Social / Finanzas. Contacto: a través de la sección Ayuda del Sistema o en oficinas de Recaudación (lun–vie 9:00–15:00).
          </p>
        </div>
      </main>
      <GovFooter />
      <A11yWidget />
    </div>
  );
}
