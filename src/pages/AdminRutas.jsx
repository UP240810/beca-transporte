import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Bus, Plus, Pencil, Trash2, RefreshCw, ArrowLeft, Save, X } from "lucide-react";
import { C } from "../theme";
import { useStaffSesion } from "../context/StaffSesionContext";
import { StaffLayout } from "../components/GovShell";
import api from "../api";

const vacio = { nombre: "", codigo: "", costo_por_viaje: "15", descuento_pct: "60" };

export default function AdminRutas() {
  const { staff, salir } = useStaffSesion();
  const [rutas, setRutas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(vacio);
  const [creando, setCreando] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      setRutas(await api.rutasAdmin(staff.token));
    } catch (e) {
      setError(e.message || "No se pudo cargar el catálogo.");
    } finally {
      setCargando(false);
    }
  }, [staff.token]);

  useEffect(() => { cargar(); }, [cargar]);

  function empezarCrear() {
    setCreando(true);
    setEditId(null);
    setForm(vacio);
    setOk("");
    setError("");
  }

  function empezarEditar(r) {
    setCreando(false);
    setEditId(r.id);
    setForm({
      nombre: r.nombre || "",
      codigo: r.codigo || "",
      costo_por_viaje: String(r.costo_por_viaje ?? 15),
      descuento_pct: String(r.descuento_pct ?? 60),
    });
    setOk("");
    setError("");
  }

  function cancelar() {
    setCreando(false);
    setEditId(null);
    setForm(vacio);
  }

  async function guardar(e) {
    e?.preventDefault();
    const costo = Number(form.costo_por_viaje);
    if (!form.nombre.trim()) { setError("El nombre es obligatorio."); return; }
    if (!Number.isFinite(costo) || costo <= 0) { setError("El precio por viaje debe ser mayor a 0."); return; }
    setProcesando(true);
    setError("");
    try {
      const body = {
        nombre: form.nombre.trim(),
        codigo: form.codigo.trim() || null,
        costo_por_viaje: costo,
        descuento_pct: Number(form.descuento_pct) >= 0 ? Number(form.descuento_pct) : 60,
      };
      if (creando) {
        await api.crearRuta(body, staff.token);
        setOk("Ruta creada.");
      } else if (editId) {
        await api.actualizarRuta(editId, body, staff.token);
        setOk("Ruta actualizada.");
      }
      cancelar();
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  }

  async function desactivar(r) {
    if (!window.confirm(`¿Desactivar la ruta «${r.nombre}»? Dejará de aparecer en el catálogo de aprobación.`)) return;
    setProcesando(true);
    try {
      await api.eliminarRuta(r.id, staff.token, false);
      setOk("Ruta desactivada.");
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  }

  async function reactivar(r) {
    setProcesando(true);
    try {
      await api.actualizarRuta(r.id, { activa: 1 }, staff.token);
      setOk("Ruta reactivada.");
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  }

  const activas = rutas.filter((r) => r.activa);
  const inactivas = rutas.filter((r) => !r.activa);

  return (
    <StaffLayout
      title="Rutas del programa"
      userLabel={staff?.nombre}
      onLogout={salir}
      maxWidth={900}
    >
      <div style={{ marginBottom: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <Link to="/admin" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.busBlue, fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
          <ArrowLeft size={15} /> Solicitudes
        </Link>
        <button type="button" onClick={cargar} style={btnSec}>
          <RefreshCw size={14} /> Actualizar
        </button>
        <button type="button" onClick={empezarCrear} style={btnPri}>
          <Plus size={15} /> Nueva ruta
        </button>
      </div>

      <p style={{ fontSize: 13.5, color: "#5b6675", marginTop: 0, marginBottom: 16, lineHeight: 1.5 }}>
        Catálogo oficial de rutas de Calvillo. Aquí se define el <strong>precio del boleto</strong> (100%);
        el estudiante paga el 40% en ventanilla. Puedes crear, editar, desactivar o reactivar.
      </p>

      {error && <div style={alertaError}>{error}</div>}
      {ok && <div style={alertaOk}>{ok}</div>}

      {(creando || editId) && (
        <form onSubmit={guardar} style={{ background: "#fff", border: `1px solid ${C.paperDim}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: C.navy, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <Bus size={16} /> {creando ? "Nueva ruta" : `Editar ruta #${editId}`}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
            <label style={lab}>
              Nombre *
              <input style={inp} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Calvillo Centro → Los Patos" required />
            </label>
            <label style={lab}>
              Código
              <input style={inp} value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="R001" />
            </label>
            <label style={lab}>
              Precio boleto ($) *
              <input style={inp} type="number" min="1" step="1" value={form.costo_por_viaje} onChange={(e) => setForm({ ...form, costo_por_viaje: e.target.value })} required />
            </label>
            <label style={lab}>
              Descuento (%)
              <input style={inp} type="number" min="0" max="100" value={form.descuento_pct} onChange={(e) => setForm({ ...form, descuento_pct: e.target.value })} />
            </label>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button type="submit" disabled={procesando} style={btnPri}>
              <Save size={14} /> {procesando ? "Guardando…" : "Guardar"}
            </button>
            <button type="button" onClick={cancelar} style={btnSec}>
              <X size={14} /> Cancelar
            </button>
          </div>
        </form>
      )}

      <div style={{ background: "#fff", border: `1px solid ${C.paperDim}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.paperDim}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, color: C.navy }}>Activas ({activas.length})</span>
          {cargando && <span style={{ fontSize: 12, color: "#8993A1" }}>Cargando…</span>}
        </div>
        {activas.length === 0 && !cargando && (
          <div style={{ padding: 20, color: "#8993A1", fontSize: 13 }}>No hay rutas activas. Crea la primera.</div>
        )}
        {activas.map((r) => (
          <FilaRuta key={r.id} r={r} onEdit={() => empezarEditar(r)} onToggle={() => desactivar(r)} />
        ))}
      </div>

      {inactivas.length > 0 && (
        <div style={{ background: "#fff", border: `1px solid ${C.paperDim}`, borderRadius: 12, overflow: "hidden", marginTop: 14 }}>
          <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.paperDim}`, fontWeight: 700, color: "#8993A1" }}>
            Inactivas ({inactivas.length})
          </div>
          {inactivas.map((r) => (
            <FilaRuta key={r.id} r={r} onEdit={() => empezarEditar(r)} onToggle={() => reactivar(r)} inactiva />
          ))}
        </div>
      )}
    </StaffLayout>
  );
}

function FilaRuta({ r, onEdit, onToggle, inactiva }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
      borderBottom: `1px solid ${C.paperDim}`, opacity: inactiva ? 0.7 : 1, flexWrap: "wrap",
    }}>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontWeight: 700, color: C.navy, fontSize: 14 }}>
          {r.codigo ? <span className="f-mono" style={{ color: C.busBlue, marginRight: 6 }}>{r.codigo}</span> : null}
          {r.nombre}
        </div>
        <div style={{ fontSize: 12, color: "#5b6675", marginTop: 2 }}>
          Boleto ${r.costo_por_viaje} · Descuento {r.descuento_pct}% · Estudiante paga ${Math.max(1, Math.round(r.costo_por_viaje * 0.4))}
        </div>
      </div>
      <button type="button" onClick={onEdit} style={btnIcon} title="Editar"><Pencil size={15} /></button>
      <button type="button" onClick={onToggle} style={{ ...btnIcon, color: inactiva ? "#1F7A56" : C.garnet }} title={inactiva ? "Reactivar" : "Desactivar"}>
        <Trash2 size={15} />
      </button>
    </div>
  );
}

const lab = { display: "flex", flexDirection: "column", gap: 4, fontSize: 11, fontWeight: 600, color: C.navy };
const inp = {
  padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.paperDim}`, fontSize: 14,
  fontFamily: "inherit", background: "#fff",
};
const btnPri = {
  display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 9,
  border: "none", background: C.busBlue, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
};
const btnSec = {
  display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 9,
  border: `1px solid ${C.paperDim}`, background: "#fff", color: C.navy, fontWeight: 600, fontSize: 13, cursor: "pointer",
};
const btnIcon = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36,
  borderRadius: 8, border: `1px solid ${C.paperDim}`, background: "#fff", color: C.navy, cursor: "pointer",
};
const alertaError = { background: "#FDECEC", color: C.garnet, padding: "10px 12px", borderRadius: 9, marginBottom: 12, fontSize: 13 };
const alertaOk = { background: "#E4F3EA", color: "#1F7A56", padding: "10px 12px", borderRadius: 9, marginBottom: 12, fontSize: 13 };
