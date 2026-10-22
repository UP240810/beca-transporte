require("dotenv").config();

// Orígenes permitidos para CORS. En desarrollo se aceptan localhost por defecto.
// En producción: CORS_ORIGINS=https://beca.calvillo.gob.mx,https://www.calvillo.gob.mx
function parseOrigins(raw) {
  if (!raw || !String(raw).trim()) return null;
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const isProd = process.env.NODE_ENV === "production";

module.exports = {
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || "development",
  IS_PROD: isProd,

  // En producción estos DEBEN venir de variables de entorno reales.
  JWT_SECRET: process.env.JWT_SECRET || (isProd ? null : "dev-secret-cambiar-en-produccion"),
  // Secreto separado para firmar los QR (si no se define, se deriva del JWT_SECRET).
  QR_SECRET: process.env.QR_SECRET || null,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "12h",

  // null = en desarrollo permite cualquier origen (útil en local).
  // En producción, si no se configura, solo se permiten orígenes vacíos (bloqueo).
  CORS_ORIGINS: parseOrigins(process.env.CORS_ORIGINS),

  // Redis para rate limiting compartido entre instancias (Railway Redis, Upstash, etc.)
  // Si está vacío, el rate limiter usa memoria local.
  REDIS_URL: process.env.REDIS_URL || null,

  RESEND_API_KEY: process.env.RESEND_API_KEY || null,
  EMAIL_FROM: process.env.EMAIL_FROM || "Beca de Transporte Calvillo <onboarding@resend.dev>",
  // URL del frontend (enlaces de recuperar contraseña)
  APP_URL: process.env.APP_URL || "http://localhost:5173",
};

// Aviso en arranque si faltan secretos en producción
if (isProd) {
  if (!process.env.JWT_SECRET) {
    console.error("[SEGURIDAD] JWT_SECRET no está configurado. El servidor no debería arrancar en producción sin él.");
  }
  if (!process.env.QR_SECRET) {
    console.warn("[SEGURIDAD] QR_SECRET no está configurado; se derivará de JWT_SECRET. Mejor definir uno distinto.");
  }
  if (!process.env.CORS_ORIGINS) {
    console.warn("[SEGURIDAD] CORS_ORIGINS vacío en producción: ningún origen de navegador podrá llamar a la API.");
  }
}
