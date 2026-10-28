import { zipSync, strToU8 } from "fflate";

/*
 * Exportar a Excel (.xlsx) sin dependencias pesadas.
 * Uso:
 *   descargarExcel("recargas_2026-10-21_a_2026-10-28", [
 *     { titulo: "Recargas", columnas: [{ h: "Fecha", k: "fecha", ancho: 18 }, { h: "Monto", k: "monto", tipo: "moneda" }],
 *       filas: [{ fecha: "...", monto: 150 }], totales: { monto: 150 } },
 *   ]);
 * tipo: "texto" (default) | "numero" | "moneda"
 */

const esc = (v) =>
  String(v ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function colLetra(i) {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

// estilos: 0 normal · 1 encabezado · 2 moneda · 3 total (negritas) · 4 total moneda · 5 título
const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;$&quot;#,##0.00"/></numFmts>
<fonts count="4">
<font><sz val="11"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><name val="Calibri"/></font>
<font><b/><sz val="14"/><color rgb="FF003366"/><name val="Calibri"/></font>
</fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF003366"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="6">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment vertical="center"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="164" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyNumberFormat="1"/>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

function celda(ref, valor, tipo, estilo) {
  if (valor === null || valor === undefined || valor === "") return estilo ? `<c r="${ref}" s="${estilo}"/>` : "";
  const num = (tipo === "numero" || tipo === "moneda") && Number.isFinite(Number(valor));
  if (num) return `<c r="${ref}" s="${estilo}"><v>${Number(valor)}</v></c>`;
  return `<c r="${ref}"${estilo ? ` s="${estilo}"` : ""} t="inlineStr"><is><t xml:space="preserve">${esc(valor)}</t></is></c>`;
}

function hojaXml({ titulo, subtitulo, columnas, filas, totales }) {
  const rows = [];
  let r = 1;
  if (titulo) { rows.push(`<row r="${r}" ht="22" customHeight="1">${celda(`A${r}`, titulo, "texto", 5)}</row>`); r += 1; }
  if (subtitulo) { rows.push(`<row r="${r}">${celda(`A${r}`, subtitulo, "texto", 0)}</row>`); r += 1; }
  if (titulo || subtitulo) r += 1;
  const headerRow = r;
  rows.push(`<row r="${r}" ht="20" customHeight="1">${columnas.map((c, i) => celda(`${colLetra(i)}${r}`, c.h, "texto", 1)).join("")}</row>`);
  r += 1;
  for (const f of filas) {
    rows.push(`<row r="${r}">${columnas.map((c, i) => celda(`${colLetra(i)}${r}`, f[c.k], c.tipo, c.tipo === "moneda" ? 2 : 0)).join("")}</row>`);
    r += 1;
  }
  if (totales) {
    rows.push(`<row r="${r}">${columnas.map((c, i) => {
      const ref = `${colLetra(i)}${r}`;
      if (i === 0 && !(c.k in totales)) return celda(ref, "TOTAL", "texto", 3);
      return c.k in totales ? celda(ref, totales[c.k], c.tipo, c.tipo === "moneda" ? 4 : 3) : "";
    }).join("")}</row>`);
  }
  const cols = columnas.map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.ancho || 16}" customWidth="1"/>`).join("");
  const ultima = colLetra(columnas.length - 1);
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetViews><sheetView workbookViewId="0"><pane ySplit="${headerRow}" topLeftCell="A${headerRow + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<cols>${cols}</cols>
<sheetData>${rows.join("")}</sheetData>
<autoFilter ref="A${headerRow}:${ultima}${Math.max(headerRow, headerRow + filas.length)}"/>
</worksheet>`;
}

/** Construye los bytes del .xlsx (se separa de la descarga para poder probarlo). */
export function construirXlsx(hojas) {
  const nombres = hojas.map((h, i) => esc((h.nombre || h.titulo || `Hoja${i + 1}`).replace(/[\\/?*[\]:]/g, " ").slice(0, 31)));
  const files = {
    "[Content_Types].xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${hojas.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("\n")}
</Types>`),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    "xl/workbook.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>
${nombres.map((n, i) => `<sheet name="${n}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("\n")}
</sheets></workbook>`),
    "xl/_rels/workbook.xml.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${hojas.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("\n")}
<Relationship Id="rId${hojas.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`),
    "xl/styles.xml": strToU8(STYLES),
  };
  hojas.forEach((h, i) => { files[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(hojaXml(h)); });
  return zipSync(files, { level: 6 });
}

export function descargarExcel(nombreArchivo, hojas) {
  const bytes = construirXlsx(hojas);
  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo.endsWith(".xlsx") ? nombreArchivo : `${nombreArchivo}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
