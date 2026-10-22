// Paleta oficial — Calvillo · Movilidad Estudiantil Integral
// Principales (texto/acentos): navy, gold
// Fondo / acompañamiento (tints): skyBlue, mint
// Énfasis (botones / CTA): busBlue, garnet
export const C = {
  navy: "#003366",
  navySoft: "#0F4C87",
  skyBlue: "#A4D3EE",
  busBlue: "#4078D1",
  gold: "#DFA740",
  mint: "#7FD4BE",
  garnet: "#7A193D",
  paper: "#F7F8FA",
  paperDim: "#E4E8EA",
  ink: "#1C2733",
};

// PLACEHOLDER — reemplazar con el catálogo real de rutas cuando se confirme con el municipio.
// NOTA: ya no se usa directamente — las rutas ahora vienen de GET /api/rutas
// (ver src/api.js). Se deja aquí solo como referencia del catálogo original.
export const RUTAS_DISPONIBLES = [
  "Calvillo Centro → Aguascalientes Centro",
  "Malpaso → Calvillo Centro",
  "Calvillo Centro → UPA (Aguascalientes)",
];

// PLACEHOLDER — fechas reales de inscripción, y costo real por viaje.
export const INSCRIPCIONES = { abre: "2026-09-01", cierra: "2026-09-15" };
export const COSTO_POR_VIAJE = 15;
