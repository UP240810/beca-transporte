const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");

// Verifica el token y adjunta el usuario a req.user.
// Uso: authRequired() para cualquier usuario logueado,
//      authRequired(['recaudacion']) para restringir por rol.
function authRequired(rolesPermitidos = null) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: "Falta el token de sesión." });
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = payload; // { id, usuario, rol, nombre }

      if (rolesPermitidos && !rolesPermitidos.includes(payload.rol)) {
        return res.status(403).json({ error: "No tienes permiso para esto." });
      }

      next();
    } catch (err) {
      return res.status(401).json({ error: "Sesión inválida o expirada." });
    }
  };
}

module.exports = { authRequired };
