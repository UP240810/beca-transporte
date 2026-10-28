import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileSpreadsheet } from "lucide-react";
import { useStaffSesion } from "../context/StaffSesionContext";
import { C } from "../theme";
import api from "../api";
import { AppPage, Card, Btn, Field, FilterBar, inputStyle } from "../components/GovShell";
import { descargarExcel } from "../exportExcel";

const fechaCorta = (v) => String(v || "").slice(0, 16).replace("T", " ");

export default function Recaudacion() {
  const { staff, logout } = useStaffSesion();
  const navigate = useNavigate();
  const hoy = new Date().toISOString().slice(0, 10);
  const [desde, setDesde] = useState(hoy);
  const [hasta, setHasta] = useState(hoy);
  const [matricula, setMatricula] = useState("");
  const [data, setData] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function cargarRecargas() {
    setBusy(true); setErr(""); setDetalle(null);
    try { setData(await api.reportesRecargas(desde, hasta, staff.token)); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function cargarBeneficiario() {
    if (!matricula.trim()) return setErr("Indica matrícula del beneficiario.");
    setBusy(true); setErr(""); setData(null);
    try { setDetalle(await api.reportesBeneficiario(matricula.trim(), desde, hasta, staff.token)); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  function excelRecargas() {
    if (!data) return;
    const filas = (data.filas || []).map((f) => ({
      fecha: fechaCorta(f.creado_en),
      folio: f.folio || f.id,
      matricula: f.matricula,
      beneficiario: `${f.nombre} ${f.apellidos}`,
      viajes: f.viajes,
      monto: f.monto,
    }));
    descargarExcel(`recargas_${data.desde}_a_${data.hasta}`, [{
      nombre: "Recargas",
      titulo: `Recargas ${data.desde} → ${data.hasta}`,
      subtitulo: "H. Ayuntamiento de Calvillo · Beca de transporte estudiantil",
      columnas: [
        { h: "Fecha", k: "fecha", ancho: 18 },
        { h: "Folio", k: "folio", ancho: 14 },
        { h: "Matrícula", k: "matricula", ancho: 16 },
        { h: "Beneficiario", k: "beneficiario", ancho: 34 },
        { h: "Viajes", k: "viajes", tipo: "numero", ancho: 10 },
        { h: "Monto", k: "monto", tipo: "moneda", ancho: 14 },
      ],
      filas,
      totales: { viajes: filas.reduce((s, f) => s + (Number(f.viajes) || 0), 0), monto: Number(data.total) || 0 },
    }]);
  }

  function excelBeneficiario() {
    if (!detalle) return;
    const b = detalle.beneficiario || {};
    descargarExcel(`movimientos_${b.matricula}_${detalle.desde}_a_${detalle.hasta}`, [
      {
        nombre: "Recargas",
        titulo: `Recargas de ${b.nombre} (${b.matricula})`,
        subtitulo: `${detalle.desde} → ${detalle.hasta} · saldo actual: ${b.saldo} viajes`,
        columnas: [
          { h: "Fecha", k: "fecha", ancho: 18 },
          { h: "Folio", k: "folio", ancho: 14 },
          { h: "Viajes", k: "viajes", tipo: "numero", ancho: 10 },
          { h: "Monto", k: "monto", tipo: "moneda", ancho: 14 },
        ],
        filas: (detalle.recargas || []).map((r) => ({ fecha: fechaCorta(r.creado_en), folio: r.folio || r.id, viajes: r.viajes, monto: r.monto })),
        totales: {
          viajes: (detalle.recargas || []).reduce((s, r) => s + (Number(r.viajes) || 0), 0),
          monto: (detalle.recargas || []).reduce((s, r) => s + (Number(r.monto) || 0), 0),
        },
      },
      {
        nombre: "Viajes",
        titulo: `Viajes de ${b.nombre} (${b.matricula})`,
        subtitulo: `${detalle.desde} → ${detalle.hasta}`,
        columnas: [
          { h: "Fecha", k: "fecha", ancho: 18 },
          { h: "Ruta", k: "ruta", ancho: 34 },
          { h: "Chofer", k: "chofer", ancho: 24 },
          { h: "Resultado", k: "resultado", ancho: 16 },
          { h: "100%", k: "c100", tipo: "moneda", ancho: 12 },
          { h: "90%", k: "c90", tipo: "moneda", ancho: 12 },
        ],
        filas: (detalle.viajes || []).map((v) => ({
          fecha: fechaCorta(v.creado_en), ruta: v.ruta || "—", chofer: v.chofer || "—", resultado: v.resultado,
          c100: v.resultado === "valido" ? v.costo100 : 0, c90: v.resultado === "valido" ? v.costo90 : 0,
        })),
      },
    ]);
  }

  return (
    <AppPage
      title="Recaudación"
      subtitle="Reportes por rango de fechas"
      variant="finanzas"
      userLabel={staff?.nombre}
      onLogout={() => { logout(); navigate("/acceso"); }}
      maxWidth={980}
    >
      <Card style={{ marginBottom: 16 }}>
        <FilterBar>
          <Field flush label="Desde"><input type="date" style={{ ...inputStyle, width: 160 }} value={desde} onChange={(e) => setDesde(e.target.value)} /></Field>
          <Field flush label="Hasta"><input type="date" style={{ ...inputStyle, width: 160 }} value={hasta} onChange={(e) => setHasta(e.target.value)} /></Field>
          <Btn onClick={cargarRecargas} disabled={busy}>Recargas del periodo</Btn>
          <Field flush label="Beneficiario (matrícula)" style={{ flex: "1 1 200px", minWidth: 180 }}>
            <input style={inputStyle} value={matricula} onChange={(e) => setMatricula(e.target.value)} placeholder="upa-..." />
          </Field>
          <Btn variant="accent" onClick={cargarBeneficiario} disabled={busy}>Movimientos</Btn>
        </FilterBar>
        {err && <p style={{ color: C.garnet, marginTop: 12, marginBottom: 0 }}>{err}</p>}
      </Card>

      {data && (
        <Card style={{ marginBottom: 16, overflowX: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
            <div>
              <strong style={{ color: C.navy }}>Recargas {data.desde} → {data.hasta}</strong>
              <div style={{ color: C.busBlue, fontWeight: 700, marginTop: 2 }}>Total: ${Number(data.total).toLocaleString("es-MX")}</div>
            </div>
            <Btn variant="excel" icon={FileSpreadsheet} onClick={excelRecargas} disabled={!data.filas?.length}>Exportar a Excel</Btn>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.navy, color: "#fff" }}>
                <th style={{ padding: 8, textAlign: "left" }}>Fecha</th>
                <th style={{ padding: 8, textAlign: "left" }}>Folio</th>
                <th style={{ padding: 8, textAlign: "left" }}>Beneficiario</th>
                <th style={{ padding: 8, textAlign: "right" }}>Viajes</th>
                <th style={{ padding: 8, textAlign: "right" }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {(data.filas || []).map((f) => (
                <tr key={f.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: 8 }}>{fechaCorta(f.creado_en)}</td>
                  <td style={{ padding: 8 }}>{f.folio || f.id}</td>
                  <td style={{ padding: 8 }}>{f.matricula} — {f.nombre} {f.apellidos}</td>
                  <td style={{ padding: 8, textAlign: "right" }}>{f.viajes}</td>
                  <td style={{ padding: 8, textAlign: "right" }}>${f.monto}</td>
                </tr>
              ))}
              {!data.filas?.length && (
                <tr><td colSpan={5} style={{ padding: 16, textAlign: "center", color: "#8993A1" }}>Sin recargas en el periodo.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {detalle && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <strong style={{ color: C.navy }}>
              {detalle.beneficiario?.nombre} ({detalle.beneficiario?.matricula}) — saldo {detalle.beneficiario?.saldo} viajes
            </strong>
            <Btn variant="excel" icon={FileSpreadsheet} onClick={excelBeneficiario}>Exportar a Excel</Btn>
          </div>
          <h3 style={{ fontSize: 14, marginTop: 14 }}>Recargas</h3>
          <ul style={{ fontSize: 13, margin: 0, paddingLeft: 18 }}>
            {(detalle.recargas || []).map((r) => (
              <li key={`r${r.id}`}>{fechaCorta(r.creado_en)} · +{r.viajes} · ${r.monto} · {r.folio}</li>
            ))}
            {!detalle.recargas?.length && <li>Sin recargas en el periodo.</li>}
          </ul>
          <h3 style={{ fontSize: 14, marginTop: 14 }}>Viajes</h3>
          <ul style={{ fontSize: 13, margin: 0, paddingLeft: 18 }}>
            {(detalle.viajes || []).map((v) => (
              <li key={`v${v.id}`}>{fechaCorta(v.creado_en)} · {v.ruta || "—"} · {v.resultado}</li>
            ))}
            {!detalle.viajes?.length && <li>Sin viajes en el periodo.</li>}
          </ul>
        </Card>
      )}
    </AppPage>
  );
}
