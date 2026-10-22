const C = { navy: "#003366", gold: "#DFA740", skyBlue: "#A4D3EE", garnet: "#7A193D", paper: "#F7F8FA" };

function envoltura(contenidoHtml) {
  return `
  <div style="background:${C.paper}; padding:32px 16px; font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:480px; margin:0 auto; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #E4E8EA;">
      <div style="background:${C.navy}; padding:18px 24px;">
        <div style="color:#ffffff; font-size:15px; font-weight:bold;">Beca de Transporte Estudiantil</div>
        <div style="color:${C.skyBlue}; font-size:11px; margin-top:2px;">Gobierno Municipal de Calvillo</div>
      </div>
      <div style="padding:26px 24px;">
        ${contenidoHtml}
      </div>
      <div style="background:${C.paper}; padding:14px 24px; font-size:10.5px; color:#8993A1; border-top:1px solid #E4E8EA;">
        Presidencia Municipal de Calvillo · Recaudación de la Propiedad Raíz — Finanzas
      </div>
    </div>
  </div>`;
}

function plantillaAprobacion({ nombre, usuario, password }) {
  const html = envoltura(`
    <h2 style="color:${C.navy}; font-size:18px; margin:0 0 12px;">¡Tu beca fue aprobada, ${nombre}!</h2>
    <p style="color:#333; font-size:13px; line-height:1.6; margin:0 0 18px;">
      Ya puedes entrar a tu cuenta para ver tu tarjeta de viaje, tu código QR y tus viajes disponibles.
    </p>
    <div style="background:${C.navy}; border-radius:10px; padding:16px 18px; margin-bottom:18px;">
      <div style="color:${C.skyBlue}; font-size:10px; letter-spacing:0.5px; margin-bottom:8px;">TUS DATOS DE ACCESO</div>
      <div style="color:${C.skyBlue}; font-size:11px; margin-bottom:2px;">Usuario</div>
      <div style="color:#ffffff; font-family:monospace; font-size:15px; font-weight:bold; margin-bottom:10px;">${usuario}</div>
      <div style="color:${C.skyBlue}; font-size:11px; margin-bottom:2px;">Contraseña temporal</div>
      <div style="color:${C.gold}; font-family:monospace; font-size:15px; font-weight:bold;">${password}</div>
    </div>
    <p style="color:#6b7785; font-size:11.5px; line-height:1.6; margin:0;">
      Por seguridad, te recomendamos guardar estos datos en un lugar seguro. Si tienes dudas, acércate a Recaudación en la Presidencia Municipal.
    </p>
  `);
  return { subject: "Tu beca de transporte fue aprobada", html };
}

function plantillaCorreccion({ nombre, motivo, folio }) {
  const html = envoltura(`
    <h2 style="color:${C.navy}; font-size:18px; margin:0 0 12px;">Necesitamos que corrijas tu solicitud</h2>
    <p style="color:#333; font-size:13px; line-height:1.6; margin:0 0 14px;">
      Hola ${nombre}, revisamos tu solicitud (folio <strong>${folio}</strong>) y encontramos algo que corregir antes de poder aprobarla:
    </p>
    <div style="background:${C.garnet}12; border-left:4px solid ${C.garnet}; border-radius:6px; padding:14px 16px; margin-bottom:18px;">
      <div style="color:${C.garnet}; font-size:13px; line-height:1.6;">${motivo}</div>
    </div>
    <p style="color:#6b7785; font-size:11.5px; line-height:1.6; margin:0;">
      Vuelve a llenar el formulario de solicitud con la corrección indicada. Tu solicitud sigue activa — no se eliminó.
    </p>
  `);
  return { subject: "Tu solicitud de beca necesita una corrección", html };
}

function plantillaSolicitudRecibida({ nombre, folio }) {
  const html = envoltura(`
    <h2 style="color:${C.navy}; font-size:18px; margin:0 0 12px;">Recibimos tu solicitud, ${nombre}</h2>
    <p style="color:#333; font-size:13px; line-height:1.6; margin:0 0 18px;">
      Recaudación va a revisar tu información. Te avisaremos por este mismo correo en cuanto la aprueben, o si necesita alguna corrección.
    </p>
    <div style="background:${C.paper}; border:1px solid #E4E8EA; border-radius:10px; padding:14px 18px; margin-bottom:6px;">
      <div style="color:${C.navy}; font-size:10px; letter-spacing:0.5px; font-weight:bold; margin-bottom:4px;">FOLIO DE REFERENCIA</div>
      <div style="color:${C.navy}; font-family:monospace; font-size:16px; font-weight:bold;">${folio}</div>
    </div>
  `);
  return { subject: "Recibimos tu solicitud de beca de transporte", html };
}


function plantillaRecuperarPassword({ nombre, link }) {
  const html = envoltura(`
    <h2 style="color:${C.navy}; font-size:18px; margin:0 0 12px;">Restablecer contraseña</h2>
    <p style="color:#333; font-size:13px; line-height:1.6; margin:0 0 12px;">
      Hola ${nombre || ""}, recibimos una solicitud para restablecer la contraseña de tu cuenta en el sistema de Beca de Transporte de Calvillo.
    </p>
    <p style="color:#333; font-size:13px; line-height:1.6; margin:0 0 18px;">
      El enlace es válido por <strong>1 hora</strong> y solo puede usarse una vez.
    </p>
    <p style="text-align:center; margin:0 0 18px;">
      <a href="${link}" style="display:inline-block; background:${C.navy}; color:#fff; text-decoration:none; font-size:13px; font-weight:700; padding:12px 20px; border-radius:8px;">
        Elegir nueva contraseña
      </a>
    </p>
    <p style="color:#6b7785; font-size:11px; line-height:1.5; margin:0;">
      Si no solicitaste este cambio, ignora este correo. Tu contraseña actual no se modifica.
    </p>
  `);
  return { subject: "Restablecer contraseña — Beca de Transporte Calvillo", html };
}

module.exports = {
  plantillaRecuperarPassword, plantillaAprobacion, plantillaCorreccion, plantillaSolicitudRecibida };
