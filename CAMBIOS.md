# Cambios de esta versión

## Frontend
- **Recarga**: la página tronaba con `StaffLayout is not defined` (faltaba el import). Corregido en `src/pages/Recarga.jsx`.
- **Logos**: Desarrollo Social y Finanzas ahora son PNG con fondo transparente, recortados y con versión en blanco (`*-claro.png`) para ir directo sobre el header azul, sin caja blanca. Tamaño del logo en el header: 84–132 px (antes 30–44 px, ~3×).
- **Desarrollo Social → Solicitudes**: botón nuevo **Ver formulario completo** (datos del solicitante, domicilio, escolares, trayectos, familiares, ingresos/egresos, vivienda, discapacidad y documentos PDF con Ver/Descargar; se puede imprimir). El botón **Pedir corrección** ya no queda chueco (los 3 botones tienen la misma altura y se acomodan en 2 filas si no caben). Los contadores de las 4 pestañas ya cargan.
- **Recaudación y Admin transportistas**: botones e inputs alineados (`FilterBar`), logo grande sin fondo y **Exportar a Excel (.xlsx)**. Recaudación exporta recargas del periodo y movimientos de un beneficiario (hojas Recargas y Viajes).
- **Camionero**: al entrar hay 3 opciones (Empezar ruta nueva / Ver viajes anteriores / Continuar ruta en curso si quedó una abierta). Botón **Terminar ruta** → muestra el historial de esa ruta (válidos, rechazados, total 90 %, detalle) con Excel. Se arregló el error `Cannot stop, scanner is not running or paused` al cambiar a modo Manual. Funciona sin señal: la ruta se cierra al reconectar.
- `src/exportExcel.js`: generador de .xlsx propio (usa `fflate`, ya venía con jsPDF).

## Backend
- Nueva tabla `recorridos` + columna `viajes_consumidos.recorrido_id` (migración automática en `server/src/db.js`, no borra datos).
- Nuevas rutas `server/src/routes/recorridos.js`: `POST /api/recorridos`, `POST /api/recorridos/:clave/terminar`, `GET /api/recorridos`, `GET /api/recorridos/:clave`.
- `POST /api/validaciones` acepta `recorridoClave` para ligar cada escaneo a su ruta.

## Después de subirlo
1. `npm install` en la raíz (nueva dependencia `fflate`).
2. Hacer deploy del **backend** (Railway) además del frontend (Vercel): las rutas de recorridos son nuevas.
