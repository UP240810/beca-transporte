const app = require("./app");
const { PORT } = require("./config");
const { conectarRedis } = require("./redis");

async function arrancar() {
  // Intenta Redis antes de aceptar tráfico; si falla, el rate limiter
  // sigue en memoria y la API arranca igual.
  await conectarRedis();

  app.listen(PORT, () => {
    console.log(`API corriendo en http://localhost:${PORT}`);
  });
}

arrancar().catch((err) => {
  console.error("No se pudo arrancar el servidor:", err);
  process.exit(1);
});
