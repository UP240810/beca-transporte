/**
 * Cliente Redis opcional.
 * Si REDIS_URL no está definida o la conexión falla, getRedis() devuelve null
 * y el rate limiter usa memoria. El proyecto funciona igual en local sin Redis.
 */
const { REDIS_URL } = require("./config");

let redis = null;

async function conectarRedis() {
  if (!REDIS_URL) {
    console.log("[redis] REDIS_URL no configurada — rate limiting en memoria (ok para desarrollo).");
    return null;
  }

  try {
    const Redis = require("ioredis");
    const client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
      connectTimeout: 4000,
      retryStrategy() {
        // No reintentar en bucle al arrancar; si falla, nos quedamos en memoria
        return null;
      },
    });

    client.on("error", (err) => {
      // Evita uncrash por unhandled error event
      if (redis === client) {
        console.warn("[redis] conexión perdida:", err.message);
        redis = null;
      }
    });

    await client.connect();
    await client.ping();

    redis = client;
    console.log("[redis] conectado — rate limiting compartido entre instancias.");
    return client;
  } catch (err) {
    console.warn("[redis] no se pudo conectar; se usará rate limiting en memoria.", err.message);
    try {
      // Cierra el cliente fallido para no dejar sockets abiertos
      if (redis) await redis.quit().catch(() => {});
    } catch { /* ignore */ }
    redis = null;
    return null;
  }
}

function getRedis() {
  return redis;
}

module.exports = { conectarRedis, getRedis };
