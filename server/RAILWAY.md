# Despliegue en Railway

1. Root Directory: `/server`
2. Start Command (si no toma railway.toml):
   `node src/seed.js && node src/index.js`
3. Variables:
   - NODE_ENV=production
   - PORT=4000
   - JWT_SECRET=...
   - QR_SECRET=...
   - CORS_ORIGINS=https://tu-app.vercel.app
4. Node: 20.x (engines + nixpacks)
5. No uses `npm install` en el Start Command (Railway ya instala en el build).

Prueba: https://TU-DOMINIO.up.railway.app/api/rutas
