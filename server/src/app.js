const express = require("express");
const cors = require("cors");
const { CORS_ORIGINS, IS_PROD, NODE_ENV } = require("./config");
const { loginLimiter, apiLimiter } = require("./middleware/rateLimit");

const authRoutes = require("./routes/auth");
const rutasRoutes = require("./routes/rutas");
const solicitudesRoutes = require("./routes/solicitudes");
const alumnoRoutes = require("./routes/alumno");
const alumnosRoutes = require("./routes/alumnos");
const recargasRoutes = require("./routes/recargas");
const reportes = require("./routes/reportes");
const validacionesRoutes = require("./routes/validaciones");
const bugsRoutes = require("./routes/bugs");
const personalRoutes = require("./routes/personal");
const contabilidadRoutes = require("./routes/contabilidad");

const app = express();

// Confiar en el proxy (Railway, Vercel, nginx) para que req.ip sea real
app.set("trust proxy", 1);

// --- CORS ---
// Desarrollo: si no hay CORS_ORIGINS, se permite cualquier origen (comodidad local).
// Producción: solo los orígenes listados en CORS_ORIGINS.
const corsOptions = {
  origin(origin, callback) {
    // Peticiones sin Origin (curl, health checks, apps nativas) se permiten
    if (!origin) return callback(null, true);

    if (!CORS_ORIGINS) {
      // Sin lista configurada
      if (IS_PROD) {
        return callback(new Error(`Origen no permitido por CORS: ${origin}`));
      }
      // Desarrollo: abierto
      return callback(null, true);
    }

    if (CORS_ORIGINS.includes(origin) || CORS_ORIGINS.includes("*")) {
      return callback(null, true);
    }
    return callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.use((err, req, res, next) => {
  // Errores de CORS llegan aquí si origin() llama callback(Error)
  if (err && String(err.message || "").includes("CORS")) {
    return res.status(403).json({ error: "Origen no permitido." });
  }
  next(err);
});

app.use(express.json({ limit: "12mb" }));

// Rate limit general suave sobre toda la API
app.use("/api", apiLimiter);

app.get("/api/health", (req, res) => res.json({ ok: true, env: NODE_ENV }));

// Rate limit estricto solo en logins
app.use("/api/auth/alumno/login", loginLimiter);
app.use("/api/auth/staff/login", loginLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/rutas", rutasRoutes);
app.use("/api/solicitudes", solicitudesRoutes);
app.use("/api/alumno", alumnoRoutes);
app.use("/api/alumnos", alumnosRoutes);
app.use("/api/recargas", recargasRoutes);
app.use("/api/reportes", reportes);
app.use("/api/validaciones", validacionesRoutes);
app.use("/api/bugs", bugsRoutes);
app.use("/api/personal", personalRoutes);
app.use("/api/contabilidad", contabilidadRoutes);

app.use((err, req, res, next) => {
  if (err && String(err.message || "").includes("CORS")) {
    return res.status(403).json({ error: "Origen no permitido." });
  }
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor." });
});

module.exports = app;
