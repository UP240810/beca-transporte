import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStaffSesion } from "../context/StaffSesionContext";
import { C } from "../theme";
import api from "../api";
import { AppPage, Card, Btn, Field, inputStyle } from "../components/GovShell";

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

  return (
    <AppPage
      title="Admin transportistas"
      subtitle="Viajes por chofer y unidad"
      userLabel={staff?.nombre}
      onLogout={() => { logout(); navigate("/acceso"); }}
      maxWidth={1000}
    >
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "end" }}>
          <Field label="Desde"><input type="date" style={{ ...inputStyle, width: 150 }} value={desde} onChange={(e) => setDesde(e.target.value)} /></Field>
          <Field label="Hasta"><input type="date" style={{ ...inputStyle, width: 150 }} value={hasta} onChange={(e) => setHasta(e.target.value)} /></Field>
          <Field label="Chofer">
            <select style={inputStyle} value={choferId} onChange={(e) => setChoferId(e.target.value)}>
              <option value="">Todos</option>
              {(filtros.choferes || []).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </Field>
          <Field label="Unidad">
            <select style={inputStyle} value={unidadId} onChange={(e) => setUnidadId(e.target.value)}>
              <option value="">Todas</option>
              {(filtros.unidades || []).map((u) => <option key={u.id} value={u.id}>{u.codigo}</option>)}
            </select>
          </Field>
          <Btn onClick={cargar}>Consultar</Btn>
        </div>
        {err && <p style={{ color: C.garnet, marginTop: 10 }}>{err}</p>}
      </Card>
      {data && (
        <Card style={{ overflowX: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span>Viajes: <strong>{data.totalViajes}</strong></span>
            <span>Total 90%: <strong>${Number(data.total90).toLocaleString("es-MX")}</strong></span>
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
            </tbody>
          </table>
        </Card>
      )}
    </AppPage>
  );
}
