import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileSpreadsheet } from "lucide-react";
import { useStaffSesion } from "../context/StaffSesionContext";
import { C } from "../theme";
import api from "../api";
import { AppPage, Card, Btn, Field, FilterBar, inputStyle } from "../components/GovShell";
import { descargarExcel } from "../exportExcel";

export default function Transportistas() {
  const { staff, logout } = useStaffSesion();
  const navigate = useNavigate();
  const hoy = new Date().toISOString().slice(0, 10);
  const [desde, setDesde] = useState(hoy);
  const [hasta, setHasta] = useState(hoy);
  const [choferId, setChoferId] = useState("");
  const [unidadId, setUnidadId] = useState("");
  const [filtros, setFiltros] = useState({ choferes: [], unidades: [] });
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.filtrosTransportistas(staff.token).then(setFiltros).catch(() => {});
  }, [staff.token]);

  async function cargar() {
    setErr("");
    try {
      const q = {};
      if (choferId) q.choferId = choferId;
      if (unidadId) q.unidadId = unidadId;
      setData(await api.reportesTransportistas(desde, hasta, staff.token, q));
    } catch (e) { setErr(e.message); }
  }

  function exportar() {
    if (!data) return;
    const chofer = (filtros.choferes || []).find((c) => String(c.id) === String(choferId));
    const unidad = (filtros.unidades || []).find((u) => String(u.id) === String(unidadId));
    descargarExcel(`transportistas_${data.desde}_a_${data.hasta}`, [{
      nombre: "Viajes",
      titulo: `Viajes de transportistas ${data.desde} → ${data.hasta}`,
      subtitulo: `Chofer: ${chofer ? chofer.nombre : "Todos"} · Unidad: ${unidad ? unidad.codigo : "Todas"} · Total 90%: $${Number(data.total90).toLocaleString("es-MX")}`,
      columnas: [
        { h: "Fecha", k: "fecha", ancho: 18 },
        { h: "Chofer", k: "chofer", ancho: 26 },
        { h: "Unidad", k: "unidad", ancho: 10 },
        { h: "ID Viaje", k: "idViaje", tipo: "numero", ancho: 10 },
        { h: "Ruta", k: "ruta", ancho: 34 },
        { h: "100%", k: "costo100", tipo: "moneda", ancho: 12 },
        { h: "90%", k: "costo90", tipo: "moneda", ancho: 12 },
        { h: "Beneficiario", k: "idBeneficiario", ancho: 18 },
      ],
      filas: (data.filas || []).map((f) => ({ ...f, fecha: String(f.fecha).slice(0, 16), unidad: f.unidad || "—" })),
      totales: {
        costo100: (data.filas || []).reduce((s, f) => s + (Number(f.costo100) || 0), 0),
        costo90: Number(data.total90) || 0,
      },
    }]);
  }

  return (
    <AppPage
      title="Admin transportistas"
      subtitle="Viajes por chofer y unidad"
      userLabel={staff?.nombre}
      onLogout={() => { logout(); navigate("/acceso"); }}
      maxWidth={1000}
    >
      <Card style={{ marginBottom: 16 }}>
        <FilterBar>
          <Field flush label="Desde"><input type="date" style={{ ...inputStyle, width: 160 }} value={desde} onChange={(e) => setDesde(e.target.value)} /></Field>
          <Field flush label="Hasta"><input type="date" style={{ ...inputStyle, width: 160 }} value={hasta} onChange={(e) => setHasta(e.target.value)} /></Field>
          <Field flush label="Chofer" style={{ minWidth: 170 }}>
            <select style={inputStyle} value={choferId} onChange={(e) => setChoferId(e.target.value)}>
              <option value="">Todos</option>
              {(filtros.choferes || []).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </Field>
          <Field flush label="Unidad" style={{ minWidth: 130 }}>
            <select style={inputStyle} value={unidadId} onChange={(e) => setUnidadId(e.target.value)}>
              <option value="">Todas</option>
              {(filtros.unidades || []).map((u) => <option key={u.id} value={u.id}>{u.codigo}</option>)}
            </select>
          </Field>
          <Btn onClick={cargar}>Consultar</Btn>
        </FilterBar>
        {err && <p style={{ color: C.garnet, marginTop: 12, marginBottom: 0 }}>{err}</p>}
      </Card>
      {data && (
        <Card style={{ overflowX: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <span>Viajes: <strong>{data.totalViajes}</strong></span>
              <span>Total 90%: <strong>${Number(data.total90).toLocaleString("es-MX")}</strong></span>
            </div>
            <Btn variant="excel" icon={FileSpreadsheet} onClick={exportar} disabled={!data.filas?.length}>Exportar a Excel</Btn>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: C.navy, color: "#fff" }}>
                {["Fecha", "Chofer", "Unidad", "ID Viaje", "Ruta", "100%", "90%", "Beneficiario"].map((h) => (
                  <th key={h} style={{ padding: 6, textAlign: "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data.filas || []).map((f) => (
                <tr key={f.idViaje} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: 6 }}>{String(f.fecha).slice(0, 16)}</td>
                  <td style={{ padding: 6 }}>{f.chofer}</td>
                  <td style={{ padding: 6 }}>{f.unidad || "—"}</td>
                  <td style={{ padding: 6 }}>{f.idViaje}</td>
                  <td style={{ padding: 6 }}>{f.ruta}</td>
                  <td style={{ padding: 6 }}>${f.costo100}</td>
                  <td style={{ padding: 6 }}>${f.costo90}</td>
                  <td style={{ padding: 6 }}>{f.idBeneficiario}</td>
                </tr>
              ))}
              {!data.filas?.length && (
                <tr><td colSpan={8} style={{ padding: 16, textAlign: "center", color: "#8993A1" }}>Sin viajes en el periodo.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </AppPage>
  );
}
