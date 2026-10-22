const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Llave dedicada a los QR — separada por completo de JWT_SECRET (que es para
// sesiones de login). Que el frontend conozca la llave PÚBLICA es seguro e
// intencional: solo sirve para VERIFICAR firmas, nunca para crearlas.
const KEYS_DIR = path.join(__dirname, "..", "keys");
const PRIVATE_PATH = path.join(KEYS_DIR, "qr-private.pem");
const PUBLIC_PATH = path.join(KEYS_DIR, "qr-public.pem");

function asegurarLlaves() {
  if (fs.existsSync(PRIVATE_PATH) && fs.existsSync(PUBLIC_PATH)) {
    return {
      privateKey: fs.readFileSync(PRIVATE_PATH, "utf8"),
      publicKey: fs.readFileSync(PUBLIC_PATH, "utf8"),
    };
  }
  fs.mkdirSync(KEYS_DIR, { recursive: true });
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  fs.writeFileSync(PRIVATE_PATH, privateKey);
  fs.writeFileSync(PUBLIC_PATH, publicKey);
  console.log("Llaves de QR generadas por primera vez en server/keys/");
  return { privateKey, publicKey };
}

module.exports = asegurarLlaves();
