import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStaffSesion } from "../context/StaffSesionContext";
import { C } from "../theme";
import api from "../api";
import { AppPage, Card, Btn, Field, inputStyle } from "../components/GovShell";

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
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "end" }}>
          <Field label="Desde"><input type="date" style={{ ...inputStyle, width: 150 }} value={desde} onChange={(e) => setDesde(e.target.value)} /></Field>
          <Field label="Hasta"><input type="date" style={{ ...inputStyle, width: 150 }} value={hasta} onChange={(e) => setHasta(e.target.value)} /></Field>
          <Btn onClick={cargarRecargas} disabled={busy}>Recargas del periodo</Btn>
          <div style={{ flex: 1, minWidth: 160 }}><Field label="Beneficiario (matrícula)">
            <input style={inputStyle} value={matricula} onChange={(e) => setMatricula(e.target.value)} placeholder="upa-..." />
          </Field></div>
          <Btn variant="accent" onClick={cargarBeneficiario} disabled={busy}>Movimientos</Btn>
        </div>
        {err && <p style={{ color: C.garnet, marginTop: 10, marginBottom: 0 }}>{err}</p>}
      </Card>

      {data && (
        <Card style={{ marginBottom: 16, overflowX: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <strong style={{ color: C.navy }}>Recargas {data.desde} → {data.hasta}</strong>
            <strong style={{ color: C.busBlue }}>Total: ${Number(data.total).toLocaleString("es-MX")}</strong>
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
                  <td style={{ padding: 8 }}>{String(f.creado_en || "").slice(0, 16).replace("T", " ")}</td>
                  <td style={{ padding: 8 }}>{f.folio || f.id}</td>
                  <td style={{ padding: 8 }}>{f.matricula} — {f.nombre} {f.apellidos}</td>
                  <td style={{ padding: 8, textAlign: "right" }}>{f.viajes}</td>
                  <td style={{ padding: 8, textAlign: "right" }}>${f.monto}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {detalle && (
        <Card>
          <strong style={{ color: C.navy }}>
            {detalle.beneficiario?.nombre} ({detalle.beneficiario?.matricula}) — saldo {detalle.beneficiario?.saldo} viajes
          </strong>
          <h3 style={{ fontSize: 14, marginTop: 14 }}>Recargas</h3>
          <ul style={{ fontSize: 13, margin: 0, paddingLeft: 18 }}>
            {(detalle.recargas || []).map((r) => (
              <li key={`r${r.id}`}>{String(r.creado_en).slice(0, 16)} · +{r.viajes} · ${r.monto} · {r.folio}</li>
            ))}
            {!detalle.recargas?.length && <li>Sin recargas en el periodo.</li>}
          </ul>
          <h3 style={{ fontSize: 14, marginTop: 14 }}>Viajes</h3>
          <ul style={{ fontSize: 13, margin: 0, paddingLeft: 18 }}>
            {(detalle.viajes || []).map((v) => (
              <li key={`v${v.id}`}>{String(v.creado_en).slice(0, 16)} · {v.ruta || "—"} · {v.resultado}</li>
            ))}
            {!detalle.viajes?.length && <li>Sin viajes en el periodo.</li>}
          </ul>
        </Card>
      )}
    </AppPage>
  );
}
