const { Resend } = require("resend");
const { RESEND_API_KEY, EMAIL_FROM } = require("./config");

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

async function enviarCorreo({ to, subject, html }) {
  if (!resend) {
    // Modo desarrollo: no hay RESEND_API_KEY configurada — se imprime en la
    // consola del servidor en vez de enviarse de verdad, para que el flujo
    // completo (aprobar/corregir) se pueda probar sin depender de una cuenta
    // de Resend. Configura RESEND_API_KEY en .env para enviarlos de verdad.
    const textoPlano = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    console.log("\n📧 [correo simulado — configura RESEND_API_KEY en .env para enviarlo de verdad]");
    console.log(`   Para: ${to}`);
    console.log(`   Asunto: ${subject}`);
    console.log(`   ${textoPlano.slice(0, 300)}${textoPlano.length > 300 ? "…" : ""}`);
    console.log("");
    return { simulado: true };
  }

  const { data, error } = await resend.emails.send({ from: EMAIL_FROM, to, subject, html });
  if (error) throw new Error(`No se pudo enviar el correo: ${error.message || error}`);
  return { simulado: false, id: data?.id };
}

module.exports = { enviarCorreo };
