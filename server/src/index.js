console.log("[boot] iniciando index.js · PORT env =", process.env.PORT, "· NODE_ENV =", process.env.NODE_ENV);

process.on("uncaughtException", (err) => {
  console.error("[boot] uncaughtException:", err);
  process.exit(1);
});
process.on("unhandledRejection", (err) => {
  console.error("[boot] unhandledRejection:", err);
  process.exit(1);
});
process.on("exit", (code) => console.log("[boot] el proceso termina con código", code));
process.on("SIGTERM", () => {
  console.log("[boot] SIGTERM recibido (Railway está deteniendo el contenedor)");
  process.exit(0);
});

const app = require("./app");
console.log("[boot] app.js cargado");
const { PORT } = require("./config");
const { conectarRedis } = require("./redis");

async function arrancar() {
  // Intenta Redis antes de aceptar tráfico; si falla, el rate limiter
  // sigue en memoria y la API arranca igual.
  await conectarRedis();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`API corriendo en http://0.0.0.0:${PORT}`);
  });
}

arrancar().catch((err) => {
  console.error("No se pudo arrancar el servidor:", err);
  process.exit(1);
});
