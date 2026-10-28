const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, QR_SECRET: QR_SECRET_CFG } = require("./config");

// Secreto separado del de login — un QR filtrado NO debe servir para iniciar
// sesión, y viceversa. En producción debe ser su propia variable de entorno.
const QR_SECRET = QR_SECRET_CFG || process.env.QR_SECRET || `${JWT_SECRET}::qr-pass`;

// PASE DE UN SOLO USO
// Cada pase lleva un identificador único (jti). Al validarse correctamente en el
// camión, el jti se registra en la tabla pases_usados y ya no vuelve a funcionar:
// la app del alumno genera uno nuevo. Vigencia corta (por defecto 12 horas, se puede
// cambiar con PASE_VIGENCIA, p. ej. "30m" o "24h") por si un pase se queda sin usar.
// Con qr_version, Recaudación sigue pudiendo revocar todos los pases de un alumno.
const VIGENCIA = process.env.PASE_VIGENCIA || "12h";

function firmarPaseQR(alumno, opts = {}) {
  const version = alumno.qr_version != null ? Number(alumno.qr_version) : 1;
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { matricula: alumno.matricula, tipo: "pase-transporte", v: version },
    QR_SECRET,
    { expiresIn: opts.vigencia || VIGENCIA, jwtid: jti }
  );
  const { exp } = jwt.decode(token);
  return { token, jti, exp };
}

/**
 * Verifica firma, tipo y vigencia.
 * opts.escaneadoEn: fecha ISO del escaneo (validaciones hechas sin señal y enviadas después).
 * En ese caso se acepta un pase que ya expiró si estaba vigente al momento del escaneo.
 */
function verificarPaseQR(token, opts = {}) {
  const fueraDeLinea = !!opts.escaneadoEn;
  const payload = jwt.verify(token, QR_SECRET, { ignoreExpiration: fueraDeLinea });
  if (payload.tipo === "credencial") {
    const err = new Error("Este QR es el de la credencial física (identificación), no un pase de viaje.");
    err.codigo = "CREDENCIAL";
    throw err;
  }
  if (payload.tipo !== "pase-transporte") {
    throw new Error("El código no corresponde a un pase de transporte.");
  }
  if (fueraDeLinea) {
    const ts = Date.parse(opts.escaneadoEn);
    if (Number.isNaN(ts) || payload.exp * 1000 < ts - 60_000) {
      throw new Error("El pase ya estaba vencido al momento del escaneo.");
    }
  }
  return payload;
}

// QR de la credencial física impresa: identifica al estudiante (ventanilla, recargas).
// NO sirve para viajar: para eso se necesita el pase de un solo uso.
function firmarCredencialQR(alumno) {
  const version = alumno.qr_version != null ? Number(alumno.qr_version) : 1;
  return jwt.sign({ matricula: alumno.matricula, tipo: "credencial", v: version }, QR_SECRET, { expiresIn: "1825d" });
}

/** Acepta el QR de la credencial o un pase vigente: solo para identificar al alumno. */
function verificarQRIdentidad(token) {
  const payload = jwt.verify(token, QR_SECRET);
  if (payload.tipo !== "credencial" && payload.tipo !== "pase-transporte") {
    throw new Error("Código no reconocido.");
  }
  return payload;
}

module.exports = { firmarPaseQR, verificarPaseQR, firmarCredencialQR, verificarQRIdentidad };
