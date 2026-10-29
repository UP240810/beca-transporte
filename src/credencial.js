import { C } from "./theme";
import logoClaro from "./assets/logo-calvillo-claro.png";

/*
 * Documentos descargables del alumno (se dibujan en canvas, sin servidor):
 *  - Credencial en PDF tamaño carta: texto de instrucciones arriba y, en la parte
 *    inferior de la hoja, REVERSO (izquierda) y FRENTE (derecha) listos para recortar y enmicar.
 *  - Pase de un solo uso en PNG, para cuando la página no cargue.
 */

const DPI = 300;
const MM = DPI / 25.4; // píxeles por milímetro a 300 dpi
const mm = (v) => Math.round(v * MM);

const CARD_W = mm(85.6); // tarjeta estándar (CR80)
const CARD_H = mm(54);
const LETTER_W = mm(215.9);
const LETTER_H = mm(279.4);

const SANS = '"Inter", Arial, sans-serif';
const MONO = '"IBM Plex Mono", "Courier New", monospace';

// ---------- utilidades de dibujo ----------
async function cargarFuentes() {
  if (!document.fonts?.load) return;
  try {
    await Promise.all([
      document.fonts.load(`400 32px ${SANS}`),
      document.fonts.load(`500 32px ${SANS}`),
      document.fonts.load(`600 32px ${SANS}`),
      document.fonts.load(`700 32px ${SANS}`),
      document.fonts.load(`600 32px ${MONO}`),
    ]);
  } catch { /* si falla, se usa la fuente de respaldo */ }
}

function cargarImagen(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function nuevoCanvas(w, h) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return { canvas, ctx: canvas.getContext("2d") };
}

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

/** Parte un texto en líneas que caben en maxW (con la fuente ya puesta en ctx). */
function lineas(ctx, texto, maxW, maxLineas = 99) {
  const palabras = String(texto || "").split(/\s+/).filter(Boolean);
  const out = [];
  let actual = "";
  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p;
    if (ctx.measureText(prueba).width <= maxW || !actual) {
      actual = prueba;
    } else {
      out.push(actual);
      actual = p;
    }
  }
  if (actual) out.push(actual);
  if (out.length > maxLineas) {
    const recorte = out.slice(0, maxLineas);
    recorte[maxLineas - 1] = `${recorte[maxLineas - 1].replace(/[\s.,;]+$/, "")}…`;
    return recorte;
  }
  return out;
}

function texto(ctx, str, x, y, { font, color, align = "left", spacing }) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  try { ctx.letterSpacing = spacing || "0px"; } catch { /* navegador sin soporte */ }
  ctx.fillText(str, x, y);
  try { ctx.letterSpacing = "0px"; } catch { /* noop */ }
}

function fotoCover(ctx, img, x, y, w, h, r) {
  ctx.save();
  rr(ctx, x, y, w, h, r);
  ctx.clip();
  const escala = Math.max(w / img.width, h / img.height);
  const dw = img.width * escala;
  const dh = img.height * escala;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

function marcador(ctx, x, y, w, h, r) {
  // placeholder cuando el alumno aún no tiene foto
  ctx.save();
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = "#E9EEF4";
  ctx.fill();
  ctx.setLineDash([14, 10]);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#9AA9BA";
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#9AA9BA";
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h * 0.38, w * 0.17, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h * 0.78, w * 0.3, h * 0.2, 0, Math.PI, 0);
  ctx.fill();
  ctx.restore();
}

function fondoAzul(ctx, w, h, invertido = false) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, invertido ? C.navySoft : C.navy);
  g.addColorStop(1, invertido ? C.navy : C.navySoft);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // destello decorativo
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.beginPath();
  ctx.arc(w, 0, h * 0.62, 0, Math.PI * 2);
  ctx.fill();
}

// ---------- tarjeta: FRENTE ----------
function dibujarFrente({ alumno, foto, qr, logo }) {
  const { canvas, ctx } = nuevoCanvas(CARD_W, CARD_H);
  const W = CARD_W;
  const H = CARD_H;
  fondoAzul(ctx, W, H);

  // franja dorada superior
  ctx.fillStyle = C.gold;
  ctx.fillRect(0, 0, W, 12);

  texto(ctx, "BECAS DE TRANSPORTE ESCOLAR", 48, 74, { font: `700 33px ${SANS}`, color: C.gold, spacing: "2px" });

  // ciclo escolar
  const cicloTxt = "2026 – 2027";
  ctx.font = `700 26px ${SANS}`;
  const cw = ctx.measureText(cicloTxt).width + 40;
  rr(ctx, W - 48 - cw, 40, cw, 46, 23);
  ctx.fillStyle = C.gold;
  ctx.fill();
  texto(ctx, cicloTxt, W - 48 - cw / 2, 73, { font: `700 26px ${SANS}`, color: C.navy, align: "center" });

  // foto
  const fx = 48, fy = 118, fw = 236, fh = 315;
  rr(ctx, fx - 6, fy - 6, fw + 12, fh + 12, 22);
  ctx.fillStyle = "#fff";
  ctx.fill();
  if (foto) fotoCover(ctx, foto, fx, fy, fw, fh, 16);
  else marcador(ctx, fx, fy, fw, fh, 16);

  // nombre
  const tx = 330;
  const maxTexto = W - tx - 48;
  ctx.font = `700 46px ${SANS}`;
  const nom = lineas(ctx, alumno.nombreCompleto, maxTexto, 2);
  let y = 168;
  nom.forEach((l) => { texto(ctx, l, tx, y, { font: `700 46px ${SANS}`, color: "#fff" }); y += 54; });

  // número de control
  y += 14;
  texto(ctx, "NÚMERO DE CONTROL", tx, y, { font: `700 21px ${SANS}`, color: C.gold, spacing: "2px" });
  y += 16;
  const num = String(alumno.matricula || "—");
  ctx.font = `600 44px ${MONO}`;
  const nw = Math.min(ctx.measureText(num).width + 44, maxTexto - 190);
  rr(ctx, tx, y, nw, 68, 14);
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.fill();
  texto(ctx, num, tx + 22, y + 48, { font: `600 44px ${MONO}`, color: "#fff" });
  y += 68 + 40;

  // escuela
  ctx.font = `500 24px ${SANS}`;
  lineas(ctx, alumno.escuela || "", maxTexto - 200, 2).forEach((l) => {
    texto(ctx, l, tx, y, { font: `500 24px ${SANS}`, color: C.skyBlue });
    y += 32;
  });

  // QR (identificación del estudiante)
  const qs = 190;
  const qx = W - 48 - qs;
  const qy = H - 48 - qs;
  rr(ctx, qx - 12, qy - 12, qs + 24, qs + 24, 18);
  ctx.fillStyle = "#fff";
  ctx.fill();
  if (qr) ctx.drawImage(qr, qx, qy, qs, qs);

  // logo + presidente
  if (logo) {
    const lh = 118;
    ctx.drawImage(logo, 40, H - 40 - lh, lh * (logo.width / logo.height), lh);
  }
  texto(ctx, "C. Daniel Romo Urrutia", 230, H - 78, { font: `700 24px ${SANS}`, color: "#fff" });
  texto(ctx, "Presidente Municipal de Calvillo", 230, H - 48, { font: `400 20px ${SANS}`, color: C.skyBlue });

  return canvas;
}

// ---------- tarjeta: REVERSO ----------
function dibujarReverso() {
  const { canvas, ctx } = nuevoCanvas(CARD_W, CARD_H);
  const W = CARD_W;
  const H = CARD_H;
  fondoAzul(ctx, W, H, true);
  ctx.fillStyle = C.gold;
  ctx.fillRect(0, 0, W, 12);

  const firmas = [
    ["Lic. Cynthia Yolanda Olague Martínez", "Secretaria de Desarrollo Social"],
    ["Profr. Sergio Reyes Velasco", "Tesorero de la Asociación de Transporte Colectivo de Calvillo A. C."],
    ["Profr. J. Félix Cruz Colís", "Presidente de la Asociación de Transporte Colectivo de Calvillo A. C."],
  ];
  const colW = 520;
  let y = 52;
  firmas.forEach(([nombre, cargo]) => {
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(48, y + 56);
    ctx.lineTo(48 + colW - 40, y + 56);
    ctx.stroke();
    texto(ctx, nombre, 48, y + 90, { font: `700 24px ${SANS}`, color: "#fff" });
    ctx.font = `400 18px ${SANS}`;
    lineas(ctx, cargo, colW - 30, 2).forEach((l, i) => {
      texto(ctx, l, 48, y + 118 + i * 23, { font: `400 18px ${SANS}`, color: C.skyBlue });
    });
    y += 158;
  });

  // emergencias
  const ex = 628;
  ctx.strokeStyle = "rgba(223,167,64,0.6)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ex - 28, 50);
  ctx.lineTo(ex - 28, H - 90);
  ctx.stroke();
  texto(ctx, "EMERGENCIAS", ex, 80, { font: `700 24px ${SANS}`, color: C.gold, spacing: "2px" });
  const filas = [
    ["Bomberos y Protección Civil", ["495 956 0750"]],
    ["Seguridad Pública", ["495 956 0317", "495 956 3124"]],
    ["Emergencia", ["911"]],
  ];
  let ey = 128;
  filas.forEach(([t, nums]) => {
    texto(ctx, t, ex, ey, { font: `600 20px ${SANS}`, color: "#fff" });
    nums.forEach((v, i) => texto(ctx, v, ex, ey + 32 + i * 30, { font: `600 24px ${MONO}`, color: C.skyBlue }));
    ey += 70 + nums.length * 30 - 30 + 14;
  });

  ctx.font = `400 17px ${SANS}`;
  lineas(ctx, "Pase PERSONAL e intransferible. No puede compartirse con nadie. Credencial válida impresa a color, con foto y enmicada. Para viajar, muestra tu pase digital en la app.", W - 96, 3)
    .forEach((l, i) => texto(ctx, l, 48, H - 68 + i * 20, { font: `600 16px ${SANS}`, color: "rgba(255,255,255,0.9)" }));

  return canvas;
}

// ---------- hoja carta ----------
function dibujarHoja({ alumno, frente, reverso, logo }) {
  const { canvas, ctx } = nuevoCanvas(LETTER_W, LETTER_H);
  const W = LETTER_W;
  const H = LETTER_H;
  const mx = mm(15); // márgenes laterales

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, H);

  // encabezado como el de la página
  const hh = mm(30);
  ctx.fillStyle = C.navy;
  ctx.fillRect(0, 0, W, hh);
  ctx.fillStyle = C.gold;
  ctx.fillRect(0, hh, W, mm(1.2));
  texto(ctx, "Beca de transporte estudiantil", mx, mm(14), { font: `700 ${mm(7.2)}px ${SANS}`, color: "#fff" });
  texto(ctx, "H. Ayuntamiento de Calvillo · Movilidad Estudiantil Integral", mx, mm(22.5), { font: `400 ${mm(3.6)}px ${SANS}`, color: C.skyBlue });
  if (logo) {
    const lh = hh - mm(5);
    const lw = lh * (logo.width / logo.height);
    ctx.drawImage(logo, W - mx - lw, mm(2.5), lw, lh);
  }

  // título
  let y = hh + mm(20);
  texto(ctx, "Credencial de estudiante", mx, y, { font: `700 ${mm(9.5)}px ${SANS}`, color: C.navy });
  y += mm(9);
  texto(ctx, "Ciclo escolar 2026 – 2027", mx, y, { font: `500 ${mm(4.6)}px ${SANS}`, color: C.busBlue });

  // datos del estudiante
  y += mm(8);
  const bx = mx, bw = W - 2 * mx, bh = mm(30);
  rr(ctx, bx, y, bw, bh, mm(3));
  ctx.fillStyle = C.paper;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = C.paperDim;
  ctx.stroke();
  const datos = [
    ["NOMBRE", alumno.nombreCompleto],
    ["NÚMERO DE CONTROL", alumno.matricula],
    ["INSTITUCIÓN", alumno.escuela],
  ];
  datos.forEach(([k, v], i) => {
    const yy = y + mm(8) + i * mm(9);
    texto(ctx, k, bx + mm(6), yy, { font: `700 ${mm(2.8)}px ${SANS}`, color: "#6b7785", spacing: "2px" });
    ctx.font = `600 ${mm(4.4)}px ${SANS}`;
    const val = lineas(ctx, String(v || "—"), bw - mm(70), 1)[0];
    texto(ctx, val, bx + mm(52), yy, { font: `600 ${mm(4.4)}px ${SANS}`, color: C.navy });
  });
  y += bh + mm(10);

  // requisitos
  texto(ctx, "Para que tu tarjeta de estudiante sea válida necesita:", mx, y, { font: `700 ${mm(4.8)}px ${SANS}`, color: C.navy });
  y += mm(9);
  const reqs = ["Estar impresa a color", "Tener foto del estudiante", "Estar enmicada"];
  const rw = (W - 2 * mx - 2 * mm(5)) / 3;
  reqs.forEach((t, i) => {
    const rx = mx + i * (rw + mm(5));
    rr(ctx, rx, y, rw, mm(15), mm(2.5));
    ctx.fillStyle = `${C.navy}0F`;
    ctx.fill();
    ctx.fillStyle = C.gold;
    ctx.beginPath();
    ctx.arc(rx + mm(6), y + mm(7.5), mm(3.2), 0, Math.PI * 2);
    ctx.fill();
    texto(ctx, String(i + 1), rx + mm(6), y + mm(9), { font: `700 ${mm(3.8)}px ${SANS}`, color: C.navy, align: "center" });
    ctx.font = `600 ${mm(3.7)}px ${SANS}`;
    lineas(ctx, t, rw - mm(16), 2).forEach((l, j, arr) => {
      texto(ctx, l, rx + mm(12), y + mm(arr.length > 1 ? 6.4 : 8.7) + j * mm(4.4), { font: `600 ${mm(3.7)}px ${SANS}`, color: C.navy });
    });
  });
  y += mm(25);

  // pasos
  texto(ctx, "Cómo prepararla", mx, y, { font: `700 ${mm(4.8)}px ${SANS}`, color: C.navy });
  y += mm(8);
  const pasos = [
    "Imprime esta hoja a color en tamaño carta, al 100 % (sin ajustar a la página).",
    "Recorta el reverso y el frente por la línea punteada.",
    "Júntalos espalda con espalda y colócalos dentro de la mica.",
    "Guarda tu credencial: te identifica ante Desarrollo Social, la ventanilla y el chofer.",
  ];
  pasos.forEach((p, i) => {
    texto(ctx, `${i + 1}.`, mx, y, { font: `700 ${mm(4)}px ${SANS}`, color: C.busBlue });
    ctx.font = `400 ${mm(4)}px ${SANS}`;
    lineas(ctx, p, W - 2 * mx - mm(9), 2).forEach((l, j) => {
      texto(ctx, l, mx + mm(9), y + j * mm(5.2), { font: `400 ${mm(4)}px ${SANS}`, color: "#1C2733" });
      if (j > 0) y += 0;
    });
    y += mm(p.length > 78 ? 12.4 : 8);
  });

  // zona de recorte: reverso (izq.) y frente (der.)
  const gap = mm(10);
  const totalW = CARD_W * 2 + gap;
  const x0 = Math.round((W - totalW) / 2);
  const yCard = H - mm(25) - CARD_H;
  const xRev = x0;
  const xFre = x0 + CARD_W + gap;

  texto(ctx, "REVERSO", xRev, yCard - mm(9), { font: `700 ${mm(3.4)}px ${SANS}`, color: C.navy, spacing: "3px" });
  texto(ctx, "FRENTE", xFre, yCard - mm(9), { font: `700 ${mm(3.4)}px ${SANS}`, color: C.navy, spacing: "3px" });
  texto(ctx, "Recorta por la línea punteada", x0 + totalW, yCard - mm(9), { font: `400 ${mm(3.2)}px ${SANS}`, color: "#6b7785", align: "right" });

  ctx.drawImage(reverso, xRev, yCard);
  ctx.drawImage(frente, xFre, yCard);

  // líneas de corte y marcas en las esquinas
  [xRev, xFre].forEach((cx) => {
    ctx.save();
    ctx.setLineDash([16, 12]);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#4b5563";
    ctx.strokeRect(cx, yCard, CARD_W, CARD_H);
    ctx.restore();
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    const o = mm(2.2), l = mm(4);
    [[cx, yCard, -1, -1], [cx + CARD_W, yCard, 1, -1], [cx, yCard + CARD_H, -1, 1], [cx + CARD_W, yCard + CARD_H, 1, 1]].forEach(([px, py, sx, sy]) => {
      ctx.beginPath();
      ctx.moveTo(px + sx * o, py);
      ctx.lineTo(px + sx * (o + l), py);
      ctx.moveTo(px, py + sy * o);
      ctx.lineTo(px, py + sy * (o + l));
      ctx.stroke();
    });
  });
  texto(ctx, "Tamaño real de la tarjeta: 85.6 × 54 mm", W / 2, yCard + CARD_H + mm(9), { font: `400 ${mm(3)}px ${SANS}`, color: "#6b7785", align: "center" });
  texto(ctx, "H. Ayuntamiento de Calvillo · Sistema de Beca de Transporte", W / 2, H - mm(9), { font: `400 ${mm(3.2)}px ${SANS}`, color: "#8993A1", align: "center" });

  return canvas;
}

// ---------- API pública ----------
export async function descargarCredencialPDF({ alumno, qrDataUrl }) {
  await cargarFuentes();
  const [foto, qr, logo] = await Promise.all([cargarImagen(alumno.foto), cargarImagen(qrDataUrl), cargarImagen(logoClaro)]);
  const frente = dibujarFrente({ alumno, foto, qr, logo });
  const reverso = dibujarReverso();
  const hoja = dibujarHoja({ alumno, frente, reverso, logo });

  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "letter", orientation: "portrait" });
  pdf.addImage(hoja.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, 215.9, 279.4);
  pdf.save(`credencial-${String(alumno.matricula || "estudiante").replace(/[^\w-]+/g, "_")}.pdf`);
}

const fechaCorta = (ms) => new Date(ms).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });

export async function descargarPasePNG({ alumno, qrDataUrl, expiraEn, jti }) {
  await cargarFuentes();
  const [qr, logo] = await Promise.all([cargarImagen(qrDataUrl), cargarImagen(logoClaro)]);
  const W = 1080;
  const H = 1700;
  const { canvas, ctx } = nuevoCanvas(W, H);

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, H);

  // encabezado
  const g = ctx.createLinearGradient(0, 0, W, 260);
  g.addColorStop(0, C.navy);
  g.addColorStop(1, C.navySoft);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, 250);
  ctx.fillStyle = C.gold;
  ctx.fillRect(0, 250, W, 10);
  texto(ctx, "PASE DE 1 SOLO USO", 70, 105, { font: `700 36px ${SANS}`, color: C.gold, spacing: "4px" });
  texto(ctx, "Beca de transporte", 70, 168, { font: `700 56px ${SANS}`, color: "#fff" });
  texto(ctx, "estudiantil", 70, 228, { font: `700 56px ${SANS}`, color: "#fff" });
  if (logo) {
    const lh = 170;
    ctx.drawImage(logo, W - 60 - lh * (logo.width / logo.height), 40, lh * (logo.width / logo.height), lh);
  }

  // estudiante
  ctx.font = `700 54px ${SANS}`;
  let y = 360;
  lineas(ctx, alumno.nombreCompleto, W - 140, 2).forEach((l) => { texto(ctx, l, W / 2, y, { font: `700 54px ${SANS}`, color: C.navy, align: "center" }); y += 62; });
  texto(ctx, `Número de control: ${alumno.matricula || "—"}`, W / 2, y + 6, { font: `600 34px ${MONO}`, color: C.busBlue, align: "center" });

  // QR
  const qs = 640;
  const qx = (W - qs) / 2;
  const qy = y + 50;
  rr(ctx, qx - 26, qy - 26, qs + 52, qs + 52, 30);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = C.navy;
  ctx.stroke();
  if (qr) ctx.drawImage(qr, qx, qy, qs, qs);

  // aviso
  const ay = qy + qs + 80;
  rr(ctx, 70, ay, W - 140, 150, 26);
  ctx.fillStyle = C.garnet;
  ctx.fill();
  texto(ctx, "VÁLIDO PARA 1 SOLO VIAJE", W / 2, ay + 66, { font: `700 48px ${SANS}`, color: "#fff", align: "center" });
  texto(ctx, "Una vez escaneado deja de funcionar. No lo compartas.", W / 2, ay + 115, { font: `500 30px ${SANS}`, color: "#fff", align: "center" });

  // detalles
  let dy = ay + 220;
  const fila = (k, v) => {
    texto(ctx, k, 90, dy, { font: `600 28px ${SANS}`, color: "#6b7785" });
    texto(ctx, v, W - 90, dy, { font: `600 28px ${SANS}`, color: C.ink, align: "right" });
    dy += 50;
  };
  const saldo = Number(alumno.viajesRestantes) || 0;
  const pesos = Number(alumno.saldoPesos) || 0;
  fila("Saldo al generarlo", `${saldo} ${saldo === 1 ? "viaje" : "viajes"} · $${pesos.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`);
  fila("Generado", fechaCorta(Date.now()));
  fila("Vence", fechaCorta(expiraEn));
  fila("Folio del pase", String(jti || "").slice(0, 8).toUpperCase());

  texto(ctx, "H. Ayuntamiento de Calvillo · Sistema de Beca de Transporte", W / 2, H - 50, { font: `400 26px ${SANS}`, color: "#8993A1", align: "center" });

  const link = document.createElement("a");
  link.download = `pase-1-uso-${String(alumno.matricula || "estudiante").replace(/[^\w-]+/g, "_")}-${String(jti || "").slice(0, 6)}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
