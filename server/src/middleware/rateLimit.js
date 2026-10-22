/**
 * Rate limiter con Redis (producción multi-instancia) y fallback en memoria.
 *
 * Algoritmo: ventana fija (fixed window)
 *   INCR clave → si count === 1, EXPIRE ventanaSeg → si count > max, 429
 *
 * Patrones de clave (versionados, legibles y seguros):
 *   rl:v1:login:{ip}:{usuario}     — 10 / 15 min  (IP + usuario)
 *   rl:v1:solicitud:{ip}           — 5 / 1 h      (solo IP)
 *   rl:v1:api:{ip}                 — 300 / 15 min (solo IP)
 *
 * La IP se normaliza (quita ::ffff:, IPv6 con ":" → "_") para que no rompa
 * la jerarquía de la clave. Segmentos se sanitizan y truncan.
 */

const { getRedis } = require("../redis");

const KEY_VERSION = "v1";
const KEY_PREFIX = "rl";

/** Quita el prefijo IPv4-mapeado y hace la IP segura como segmento de clave. */
function normalizarIp(raw) {
  let ip = String(raw || "unknown").trim().toLowerCase();
  // Express trust-proxy a veces entrega ::ffff:1.2.3.4
  if (ip.startsWith("::ffff:")) ip = ip.slice(7);
  // IPv6 usa ":" — lo cambiamos para no confundir con el separador de clave
  ip = ip.replace(/:/g, "_");
  // Solo caracteres seguros
  ip = ip.replace(/[^a-z0-9._-]/g, "_");
  if (!ip || ip === "_") ip = "unknown";
  // Evitar claves absurdamente largas
  return ip.slice(0, 64);
}

/** Sanitiza un segmento arbitrario (usuario, etc.). */
function segmento(valor, fallback = "-") {
  const s = String(valor ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._@+-]/g, "_")
    .slice(0, 64);
  return s || fallback;
}

/**
 * Construye la clave Redis/memoria.
 * dims = { ip: true|string, usuario?: true|string }
 * - Si dims.ip === true, se toma de req
 * - Si dims.usuario === true, se toma de req.body.usuario (solo login)
 */
function construirClave(nombre, req, dims = { ip: true }) {
  const partes = [KEY_PREFIX, KEY_VERSION, nombre];

  if (dims.ip) {
    const rawIp =
      dims.ip === true
        ? req.ip || req.socket?.remoteAddress || "unknown"
        : dims.ip;
    partes.push(normalizarIp(rawIp));
  }

  if (dims.usuario) {
    const rawUser =
      dims.usuario === true
        ? req.body?.usuario || req.body?.email || ""
        : dims.usuario;
    partes.push(segmento(rawUser, "-"));
  }

  return partes.join(":");
}

// ---------- fallback en memoria ----------
function crearLimitadorMemoria({ ventanaMs, max, mensaje, nombre, dims }) {
  const intentos = new Map();

  setInterval(() => {
    const ahora = Date.now();
    for (const [k, v] of intentos) {
      if (v.resetAt <= ahora) intentos.delete(k);
    }
  }, Math.min(ventanaMs, 60_000)).unref?.();

  return function rateLimitMemoria(req, res, next) {
    const clave = construirClave(nombre, req, dims);
    const ahora = Date.now();

    let registro = intentos.get(clave);
    if (!registro || registro.resetAt <= ahora) {
      registro = { count: 0, resetAt: ahora + ventanaMs };
      intentos.set(clave, registro);
    }

    registro.count += 1;

    const restantes = Math.max(0, max - registro.count);
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(restantes));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(registro.resetAt / 1000)));
    res.setHeader("X-RateLimit-Backend", "memory");

    if (registro.count > max) {
      const esperaSeg = Math.ceil((registro.resetAt - ahora) / 1000);
      res.setHeader("Retry-After", String(esperaSeg));
      return res.status(429).json({
        error: mensaje || `Demasiados intentos. Espera ${esperaSeg} segundos e inténtalo de nuevo.`,
      });
    }

    next();
  };
}

// ---------- Redis ----------
function crearLimitadorRedis({ ventanaMs, max, mensaje, nombre, dims }) {
  const ventanaSeg = Math.max(1, Math.ceil(ventanaMs / 1000));

  return async function rateLimitRedis(req, res, next) {
    const client = getRedis();
    if (!client) {
      return crearLimitadorMemoria({ ventanaMs, max, mensaje, nombre, dims })(req, res, next);
    }

    const clave = construirClave(nombre, req, dims);

    try {
      // Pipeline: INCR + TTL en un round-trip cuando ya existe;
      // si es la primera vez, EXPIRE en el mismo pipeline.
      const multi = client.multi();
      multi.incr(clave);
      multi.ttl(clave);
      const resultados = await multi.exec();

      // ioredis multi.exec → [[err, count], [err, ttl]]
      const count = Number(resultados[0][1]);
      let ttl = Number(resultados[1][1]);

      if (count === 1 || ttl < 0) {
        // Primera vez o clave sin TTL (raro): fija la ventana
        await client.expire(clave, ventanaSeg);
        ttl = ventanaSeg;
      }

      const restantes = Math.max(0, max - count);
      res.setHeader("X-RateLimit-Limit", String(max));
      res.setHeader("X-RateLimit-Remaining", String(restantes));
      res.setHeader("X-RateLimit-Reset", String(Math.ceil(Date.now() / 1000) + ttl));
      res.setHeader("X-RateLimit-Backend", "redis");

      if (count > max) {
        res.setHeader("Retry-After", String(Math.max(1, ttl)));
        return res.status(429).json({
          error: mensaje || `Demasiados intentos. Espera ${ttl} segundos e inténtalo de nuevo.`,
        });
      }

      next();
    } catch (err) {
      console.warn("[rateLimit] error Redis, fallback a memoria:", err.message);
      return crearLimitadorMemoria({ ventanaMs, max, mensaje, nombre, dims })(req, res, next);
    }
  };
}

/**
 * Crea un middleware que usa Redis si está disponible, o memoria si no.
 * opts.dims controla qué entra en la clave (por defecto solo IP).
 */
function crearRateLimiter(opts) {
  const dims = opts.dims || { ip: true };
  const opciones = { ...opts, dims };
  const memoria = crearLimitadorMemoria(opciones);
  const redisMw = crearLimitadorRedis(opciones);

  return function rateLimit(req, res, next) {
    if (getRedis()) return redisMw(req, res, next);
    return memoria(req, res, next);
  };
}

// Login: por IP + usuario (evita que un atacante bloquee a todos desde una IP
// y a la vez limita fuerza bruta contra un usuario concreto).
const loginLimiter = crearRateLimiter({
  nombre: "login",
  dims: { ip: true, usuario: true },
  ventanaMs: 15 * 60 * 1000,
  max: 10,
  mensaje: "Demasiados intentos de inicio de sesión. Espera 15 minutos o revisa tu usuario y contraseña.",
});

// Formulario público: solo IP
const solicitudLimiter = crearRateLimiter({
  nombre: "solicitud",
  dims: { ip: true },
  ventanaMs: 60 * 60 * 1000,
  max: 5,
  mensaje: "Has enviado demasiadas solicitudes en poco tiempo. Espera un momento e inténtalo de nuevo.",
});

// API general: solo IP (antes mezclaba usuario del body y contaminaba la clave)
const apiLimiter = crearRateLimiter({
  nombre: "api",
  dims: { ip: true },
  ventanaMs: 15 * 60 * 1000,
  max: 300,
  mensaje: "Demasiadas peticiones. Espera un momento e inténtalo de nuevo.",
});

module.exports = {
  crearRateLimiter,
  loginLimiter,
  solicitudLimiter,
  apiLimiter,
  // exportados para tests / depuración
  construirClave,
  normalizarIp,
  segmento,
};
