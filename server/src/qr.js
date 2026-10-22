const jwt = require("jsonwebtoken");
const { JWT_SECRET, QR_SECRET: QR_SECRET_CFG } = require("./config");

// Secreto separado del de login — un QR filtrado NO debe servir para iniciar
// sesión, y viceversa. En producción debe ser su propia variable de entorno.
const QR_SECRET = QR_SECRET_CFG || process.env.QR_SECRET || `${JWT_SECRET}::qr-pass`;

// El pase de un alumno es más parecido a una credencial física (~5 años).
// Para revocarlo antes de tiempo se usa el campo qr_version del alumno:
// al firmar se incluye la versión actual; al verificar se compara con la DB.
// Si no coinciden (porque Recaudación incrementó la versión), el QR es inválido.
const VIGENCIA = "1825d";

function firmarPaseQR(alumno) {
  const version = alumno.qr_version != null ? Number(alumno.qr_version) : 1;
  return jwt.sign(
    {
      matricula: alumno.matricula,
      tipo: "pase-transporte",
      v: version,
    },
    QR_SECRET,
    { expiresIn: VIGENCIA }
  );
}

function verificarPaseQR(token) {
  const payload = jwt.verify(token, QR_SECRET);
  if (payload.tipo !== "pase-transporte") {
    throw new Error("El código no corresponde a un pase de transporte.");
  }
  return payload;
}

module.exports = { firmarPaseQR, verificarPaseQR };
