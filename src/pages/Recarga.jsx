import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Bus, Wallet, CheckCircle2, ChevronRight, ScanLine,
  Plus, Minus, TrendingUp, Calendar, ShieldCheck, LogOut, MousePointerClick, ShieldAlert,
  FileSpreadsheet, Download, Camera, X, User, Printer, ArrowLeft,
  Users,
} from "lucide-react";
import { C, COSTO_POR_VIAJE } from "../theme";
import { useStaffSesion } from "../context/StaffSesionContext";
import useIsDesktop from "../hooks/useIsDesktop";
import api from "../api";
import { formatFechaHora } from "../utils";
import BrandLogos from "../components/BrandLogos";

const READER_ID = "qr-reader-ventanilla";

function ResumenDia({ resumen }) {
  const { totalMonto = 0, totalViajes = 0, personas = 0, recargas = [] } = resumen || {};
  const porRuta = {};
  recargas.forEach((r) => {
    porRuta[r.ruta] = porRuta[r.ruta] || { viajes: 0, monto: 0 };
    porRuta[r.ruta].viajes += r.viajes;
    porRuta[r.ruta].monto += r.monto;
  });

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, background: C.navy, borderRadius: 12, padding: 12, color: "#fff" }}>
          <div style={{ fontSize: 9.5, color: C.skyBlue, marginBottom: 4 }}>RECAUDADO HOY</div>
          <div className="f-mono" style={{ fontSize: 18, fontWeight: 700, color: C.gold }}>${totalMonto}</div>
        </div>
        <div style={{ flex: 1, background: "#fff", border: `1px solid ${C.paperDim}`, borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 9.5, color: "#8993A1", marginBottom: 4 }}>VIAJES CARGADOS</div>
          <div className="f-mono" style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>{totalViajes}</div>
        </div>
        <div style={{ flex: 1, background: "#fff", border: `1px solid ${C.paperDim}`, borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 9.5, color: "#8993A1", marginBottom: 4 }}>ESTUDIANTES</div>
          <div className="f-mono" style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>{personas}</div>
        </div>
      </div>
      {Object.keys(porRuta).length > 0 && (
        <div style={{ background: "#fff", border: `1px solid ${C.paperDim}`, borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.busBlue, letterSpacing: 0.5, marginBottom: 8 }}>POR RUTA</div>
          {Object.entries(porRuta).map(([ruta, d], i) => (
            <div key={ruta} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderTop: i > 0 ? `1px solid ${C.paperDim}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
                <Bus size={11} color={C.busBlue} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ruta}</span>
              </div>
              <span className="f-mono" style={{ fontSize: 11, color: C.navy, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{d.viajes}v · ${d.monto}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EscanerQrVentanilla({ onDetectado, onCerrar, onError }) {
  const instanciaRef = useRef(null);
  const detectadoRef = useRef(false);

  useEffect(() => {
    detectadoRef.current = false;
    let html5QrCode;
    let cancelado = false;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (cancelado) return;
      html5QrCode = new Html5Qrcode(READER_ID);
      instanciaRef.current = html5QrCode;
      html5QrCode
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (text) => {
            if (detectadoRef.current) return;
            detectadoRef.current = true;
            onDetectado(text);
          },
          () => {}
        )
        .catch(() => onError("No se pudo abrir la cámara. Revisa permisos o busca por nombre/matrícula."));
    });

    return () => {
      cancelado = true;
      if (instanciaRef.current) {
        instanciaRef.current.stop().then(() => instanciaRef.current.clear()).catch(() => {});
      }
    };
  }, []);

  return (
    <div style={{ background: "#fff", border: `1px solid ${C.paperDim}`, borderRadius: 14, padding: 14, marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: C.navy }}>
          <Camera size={14} /> Escanear QR del estudiante
        </div>
        <button type="button" onClick={onCerrar} style={{ background: "none", border: "none", cursor: "pointer", color: C.navy }}>
          <X size={18} />
        </button>
      </div>
      <div id={READER_ID} style={{ width: "100%", borderRadius: 12, overflow: "hidden" }} />
      <p style={{ fontSize: 11, color: "#6b7785", textAlign: "center", marginTop: 10, marginBottom: 0 }}>
        Pide al estudiante que muestre el QR de su tarjeta digital.
      </p>
    </div>
  );
}

function Busqueda({ query, setQuery, resultados, onSelect, onAbrirQr }) {
  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#fff", border: `1px solid ${C.paperDim}`, borderRadius: 10, padding: "9px 12px" }}>
          <Search size={15} color="#8993A1" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre, matrícula o ID"
            style={{ border: "none", outline: "none", fontSize: 13, flex: 1, background: "transparent" }}
          />
        </div>
        <button
          type="button"
          onClick={onAbrirQr}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 42, background: C.navy, borderRadius: 10, border: "none", cursor: "pointer" }}
          title="Escanear QR de la tarjeta"
        >
          <ScanLine size={17} color="#fff" />
        </button>
      </div>

      {resultados.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${C.paperDim}`, overflow: "hidden", marginBottom: 14 }}>
          {resultados.map((a, i) => (
            <button
              key={a.matricula}
              type="button"
              onClick={() => onSelect(a)}
              style={{
                width: "100%", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "11px 14px", border: "none", background: "#fff",
                borderBottom: i < resultados.length - 1 ? `1px solid ${C.paperDim}` : "none", cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9, background: C.skyBlue, overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {a.fotoUrl ? (
                    <img src={a.fotoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <User size={16} color={C.navy} />
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: C.navy }}>{a.nombre}</div>
                  <div className="f-mono" style={{ fontSize: 10.5, color: "#8993A1" }}>
                    {a.matricula} · {a.viajesRestantes} viajes
                  </div>
                </div>
              </div>
              <ChevronRight size={14} color="#8993A1" />
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function ExportarReporte({ token }) {
  const hoy = new Date().toISOString().slice(0, 10);
  const primerDiaMes = `${hoy.slice(0, 7)}-01`;
  const [desde, setDesde] = useState(primerDiaMes);
  const [hasta, setHasta] = useState(hoy);
  const [exportando, setExportando] = useState(false);
  const [error, setError] = useState("");

  async function exportar() {
    setExportando(true);
    setError("");
    try {
      await api.exportarRecargas(desde, hasta, token);
    } catch (err) {
      setError(err.message);
    } finally {
      setExportando(false);
    }
  }

  return (
    <div style={{ background: "#fff", border: `1px solid ${C.paperDim}`, borderRadius: 12, padding: 12, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <FileSpreadsheet size={13} color={C.navy} />
        <span style={{ fontSize: 11.5, fontWeight: 700, color: C.navy }}>Exportar para Contabilidad</span>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} style={{ flex: 1, border: `1px solid ${C.paperDim}`, borderRadius: 7, padding: "6px 8px", fontSize: 11 }} />
        <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} style={{ flex: 1, border: `1px solid ${C.paperDim}`, borderRadius: 7, padding: "6px 8px", fontSize: 11 }} />
      </div>
      {error && <div style={{ fontSize: 10.5, color: C.garnet, marginBottom: 6 }}>{error}</div>}
      <button type="button" onClick={exportar} disabled={exportando} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 8, border: "none", background: C.gold, color: C.navy, fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
        <Download size={13} /> {exportando ? "Generando…" : "Descargar CSV del periodo"}
      </button>
    </div>
  );
}

function RecargasHoy({ recargas }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <TrendingUp size={13} color={C.navy} />
        <span style={{ fontSize: 11.5, fontWeight: 700, color: C.navy }}>Recargas de hoy</span>
      </div>
      <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${C.paperDim}`, overflow: "hidden" }}>
        {recargas.map((r, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: i < recargas.length - 1 ? `1px solid ${C.paperDim}` : "none" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>{r.nombre}</div>
              <div style={{ fontSize: 10, color: "#8993A1" }}>{r.viajes} viajes · {formatFechaHora(r.hora)}</div>
            </div>
            <span className="f-mono" style={{ fontSize: 12.5, fontWeight: 700, color: "#1F7A56" }}>+${r.monto}</span>
          </div>
        ))}
        {recargas.length === 0 && (
          <div style={{ padding: 16, textAlign: "center", fontSize: 12, color: "#8993A1" }}>Aún no hay recargas hoy.</div>
        )}
      </div>
    </div>
  );
}

/** Comprobante / ticket en pantalla */
function TicketRecarga({ ticket, onNueva, onImprimir }) {
  if (!ticket) return null;
  const fecha = ticket.fecha ? new Date(ticket.fecha) : new Date();
  const fechaStr = fecha.toLocaleString("es-MX", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div style={{ background: "#fff", border: `1px solid ${C.mint}`, borderRadius: 14, overflow: "hidden" }}>
      <div id="ticket-recarga-print" style={{ padding: 18 }}>
        <div style={{ textAlign: "center", borderBottom: `1px dashed ${C.paperDim}`, paddingBottom: 12, marginBottom: 12 }}>
          <BrandLogos variant="finanzas" height={36} />
          <div style={{ fontSize: 11, fontWeight: 700, color: C.navy }}>Beca de Transporte Estudiantil</div>
          <div style={{ fontSize: 10, color: "#6b7785" }}>H. Ayuntamiento de Calvillo · Comprobante de recarga</div>
        </div>

        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${C.mint}33`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
            <CheckCircle2 size={22} color="#1F7A56" />
          </div>
          <div className="f-display" style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>Recarga exitosa</div>
          <div className="f-mono" style={{ fontSize: 10, color: "#8993A1", marginTop: 4 }}>{ticket.folio}</div>
          <div style={{ fontSize: 10, color: "#8993A1" }}>{fechaStr}</div>
        </div>

        <div style={{ background: C.paper, borderRadius: 10, padding: 12, marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{ticket.alumno?.nombre}</div>
          <div className="f-mono" style={{ fontSize: 11, color: "#5B6675" }}>{ticket.alumno?.matricula}</div>
          {ticket.alumno?.ruta && (
            <div style={{ fontSize: 10.5, color: "#6b7785", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
              <Bus size={11} /> {ticket.alumno.ruta}
            </div>
          )}
        </div>

        <div style={{ fontSize: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.paperDim}` }}>
            <span style={{ color: "#6b7785" }}>Concepto</span>
            <span style={{ fontWeight: 600, color: C.ink }}>Recarga de viajes ({ticket.modo === "monto" ? "por monto" : "por viajes"})</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.paperDim}` }}>
            <span style={{ color: "#6b7785" }}>Viajes acreditados</span>
            <span className="f-mono" style={{ fontWeight: 700, color: C.navy }}>+{ticket.viajes}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.paperDim}` }}>
            <span style={{ color: "#6b7785" }}>Monto cobrado</span>
            <span className="f-mono" style={{ fontWeight: 700, color: "#1F7A56" }}>${ticket.monto}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.paperDim}` }}>
            <span style={{ color: "#6b7785" }}>Saldo anterior</span>
            <span className="f-mono">{ticket.saldoAnterior} viajes</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0" }}>
            <span style={{ color: "#6b7785" }}>Saldo actual</span>
            <span className="f-mono" style={{ fontWeight: 800, color: C.navy, fontSize: 14 }}>{ticket.saldoNuevo} viajes</span>
          </div>
        </div>

        <div style={{ marginTop: 12, fontSize: 9.5, color: "#8993A1", textAlign: "center" }}>
          Atendido por: {ticket.atendidoPor || "ventanilla"} · Conserva este comprobante. También queda registrado en la app del estudiante (historial).
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, padding: "0 18px 18px" }}>
        <button
          type="button"
          onClick={onImprimir}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "11px 0", borderRadius: 10, border: `1px solid ${C.paperDim}`, background: "#fff",
            color: C.navy, fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}
        >
          <Printer size={14} /> Imprimir
        </button>
        <button
          type="button"
          onClick={onNueva}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "11px 0", borderRadius: 10, border: "none", background: C.navy,
            color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}
        >
          Nueva recarga
        </button>
      </div>
    </div>
  );
}

function PanelRecarga({
  seleccionado, ticket, modo, setModo, numViajes, setNumViajes, montoPesos, setMontoPesos,
  error, procesando, onConfirmar, onNueva, onImprimir,
}) {
  if (!seleccionado && !ticket) {
    return (
      <div style={{ background: "#fff", border: `1px dashed ${C.paperDim}`, borderRadius: 14, padding: 30, textAlign: "center", color: "#8993A1" }}>
        <MousePointerClick size={26} style={{ marginBottom: 8, opacity: 0.5 }} />
        <div style={{ fontSize: 12 }}>Busca o escanea el QR del estudiante para registrar su recarga.</div>
      </div>
    );
  }

  if (ticket) {
    return <TicketRecarga ticket={ticket} onNueva={onNueva} onImprimir={onImprimir} />;
  }

  const costo = seleccionado.costoPorViaje || COSTO_POR_VIAJE;
  const montoEstimado = modo === "viajes"
    ? numViajes * costo
    : Math.floor(Number(montoPesos || 0) / costo) * costo;
  const viajesDesdeMonto = Math.floor(Number(montoPesos || 0) / costo);

  return (
    <div style={{ background: C.navy, borderRadius: 14, padding: 16, color: "#fff" }}>
      {/* Ficha del estudiante */}
      <div style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "center" }}>
        <div style={{
          width: 56, height: 56, borderRadius: 12, background: C.navySoft, overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          border: `2px solid ${C.gold}`,
        }}>
          {seleccionado.fotoUrl ? (
            <img src={seleccionado.fotoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <User size={26} color={C.skyBlue} />
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10, letterSpacing: 0.5, color: C.skyBlue }}>TARJETA ESTUDIANTIL</div>
          <div className="f-display" style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.25 }}>{seleccionado.nombre}</div>
          <div className="f-mono" style={{ fontSize: 11, color: C.skyBlue }}>{seleccionado.matricula}</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: C.skyBlue, marginBottom: 4 }}>
        <Bus size={11} /> {seleccionado.ruta}
      </div>
      <div style={{
        fontSize: 12, marginBottom: 14, padding: "8px 10px", borderRadius: 8,
        background: seleccionado.viajesRestantes === 0 ? "rgba(122,25,61,0.35)" : "rgba(255,255,255,0.08)",
      }}>
        Saldo actual: <strong className="f-mono" style={{ fontSize: 15 }}>{seleccionado.viajesRestantes}</strong> viajes
        {seleccionado.viajesRestantes === 0 && " · sin saldo"}
        <span style={{ opacity: 0.75 }}> · ${costo}/viaje (40% del boleto)</span>
      </div>

      {/* Modo viajes | pesos */}
      <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: 3, marginBottom: 14 }}>
        <button
          type="button"
          onClick={() => setModo("viajes")}
          style={{
            flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11.5, fontWeight: 700,
            background: modo === "viajes" ? C.gold : "transparent",
            color: modo === "viajes" ? C.navy : C.skyBlue,
          }}
        >
          Por viajes
        </button>
        <button
          type="button"
          onClick={() => setModo("monto")}
          style={{
            flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11.5, fontWeight: 700,
            background: modo === "monto" ? C.gold : "transparent",
            color: modo === "monto" ? C.navy : C.skyBlue,
          }}
        >
          Por pesos ($)
        </button>
      </div>

      {modo === "viajes" ? (
        <>
          <div style={{ fontSize: 10.5, color: C.skyBlue, marginBottom: 8 }}>¿Cuántos viajes va a recargar?</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 6 }}>
            <button type="button" onClick={() => setNumViajes((n) => Math.max(1, n - 5))} style={{ width: 34, height: 34, borderRadius: 9, border: "none", background: C.navySoft, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Minus size={15} />
            </button>
            <div className="f-mono" style={{ fontSize: 28, fontWeight: 700, minWidth: 60, textAlign: "center" }}>{numViajes}</div>
            <button type="button" onClick={() => setNumViajes((n) => n + 5)} style={{ width: 34, height: 34, borderRadius: 9, border: "none", background: C.navySoft, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Plus size={15} />
            </button>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 14 }}>
            {[10, 20, 30].map((n) => (
              <button key={n} type="button" onClick={() => setNumViajes(n)} style={{ fontSize: 10.5, padding: "4px 10px", borderRadius: 999, border: `1px solid ${numViajes === n ? C.gold : C.navySoft}`, background: numViajes === n ? C.gold : "transparent", color: numViajes === n ? C.navy : C.skyBlue, fontWeight: 700, cursor: "pointer" }}>
                {n}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 10.5, color: C.skyBlue, marginBottom: 8 }}>¿Cuánto paga en efectivo? ($)</div>
          <input
            type="number"
            min={costo}
            step={costo}
            value={montoPesos}
            onChange={(e) => setMontoPesos(e.target.value)}
            placeholder={String(costo * 10)}
            className="f-mono"
            style={{
              width: "100%", boxSizing: "border-box", border: "none", borderRadius: 10, padding: "12px 14px",
              fontSize: 22, fontWeight: 700, textAlign: "center", marginBottom: 8, color: C.navy,
            }}
          />
          <div style={{ fontSize: 11, color: C.skyBlue, textAlign: "center", marginBottom: 14 }}>
            {viajesDesdeMonto >= 1
              ? `Se acreditarán ${viajesDesdeMonto} viaje${viajesDesdeMonto === 1 ? "" : "s"} ($${viajesDesdeMonto * costo})`
              : `Monto mínimo: $${costo} (1 viaje)`}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 14 }}>
            {[costo * 10, costo * 20, 100, 200].map((n) => (
              <button key={n} type="button" onClick={() => setMontoPesos(String(n))} style={{ fontSize: 10.5, padding: "4px 10px", borderRadius: 999, border: `1px solid ${Number(montoPesos) === n ? C.gold : C.navySoft}`, background: Number(montoPesos) === n ? C.gold : "transparent", color: Number(montoPesos) === n ? C.navy : C.skyBlue, fontWeight: 700, cursor: "pointer" }}>
                ${n}
              </button>
            ))}
          </div>
        </>
      )}

      <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 11.5, color: C.skyBlue }}>Total a cobrar</span>
        <span className="f-mono" style={{ fontSize: 18, fontWeight: 700, color: C.gold }}>${montoEstimado}</span>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(122,25,61,0.25)", border: `1px solid ${C.garnet}`, color: "#F5C6D3", borderRadius: 9, padding: "9px 12px", fontSize: 11.5, marginBottom: 12 }}>
          <ShieldAlert size={13} /> {error}
        </div>
      )}

      <button
        type="button"
        onClick={onConfirmar}
        disabled={procesando}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          padding: "12px 0", borderRadius: 10, border: "none", background: C.gold, color: C.navy,
          fontSize: 13, fontWeight: 700, cursor: procesando ? "default" : "pointer",
        }}
      >
        <Wallet size={15} /> {procesando ? "Procesando…" : "Confirmar recarga"}
      </button>
    </div>
  );
}

export default function Recarga() {
  const navigate = useNavigate();
  const { staff, logout } = useStaffSesion();
  const isDesktop = useIsDesktop();
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [modo, setModo] = useState("viajes"); // viajes | monto
  const [numViajes, setNumViajes] = useState(10);
  const [montoPesos, setMontoPesos] = useState("150");
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [resumen, setResumen] = useState(null);
  const [escaneando, setEscaneando] = useState(false);
  const [errorQr, setErrorQr] = useState("");

  const cargarResumen = useCallback(() => {
    api.recargasHoy(staff.token).then(setResumen).catch(() => {});
  }, [staff.token]);

  useEffect(() => { cargarResumen(); }, [cargarResumen]);

  useEffect(() => {
    if (!query.trim()) { setResultados([]); return; }
    const t = setTimeout(() => {
      api.buscarAlumnos(query, staff.token).then(setResultados).catch(() => setResultados([]));
    }, 250);
    return () => clearTimeout(t);
  }, [query, staff.token]);

  function seleccionar(a) {
    setSeleccionado(a);
    setNumViajes(10);
    setMontoPesos(String((a.costoPorViaje || COSTO_POR_VIAJE) * 10));
    setTicket(null);
    setError("");
    setQuery("");
    setResultados([]);
    setEscaneando(false);
  }

  async function handleQrDetectado(qrToken) {
    setErrorQr("");
    setEscaneando(false);
    setProcesando(true);
    try {
      const ficha = await api.alumnoPorQr(qrToken, staff.token);
      seleccionar(ficha);
    } catch (err) {
      setErrorQr(err.message);
      setEscaneando(false);
    } finally {
      setProcesando(false);
    }
  }

  async function confirmarRecarga() {
    if (!seleccionado) return;
    setProcesando(true);
    setError("");
    try {
      const body = modo === "viajes"
        ? { matricula: seleccionado.matricula, viajes: numViajes }
        : { matricula: seleccionado.matricula, monto: Number(montoPesos) };
      const data = await api.registrarRecarga(body, staff.token);
      setSeleccionado(null);
      cargarResumen();
      mostrarTicketYComprobantes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  }

  function imprimirTicket() {
    window.print();
  }

  function mostrarTicketYComprobantes(data) {
    setTicket(data);
    setTimeout(() => {
      try { window.print(); } catch (e) { console.warn(e); }
    }, 450);
  }

  
  async function hacerDevolucion() {
    if (!seleccionado) return;
    const monto = window.prompt("Monto a devolver ($):");
    if (!monto) return;
    if (!window.confirm(`¿Confirmar devolución de $${monto} a ${seleccionado.nombre}?`)) return;
    try {
      const r = await api.devolucion({ matricula: seleccionado.matricula, monto: Number(monto), motivo: "Devolución ventanilla" }, staff.token);
      alert(`Devolución ${r.folio}: −${r.viajesDevueltos} viajes. Saldo nuevo: ${r.saldoNuevo}`);
      // refresh
      try {
        const f = await api.alumnoPorMatricula(seleccionado.matricula, staff.token);
        if (f) setSeleccionado(f);
        else setSeleccionado({ ...seleccionado, viajesRestantes: r.saldoNuevo });
      } catch { setSeleccionado({ ...seleccionado, viajesRestantes: r.saldoNuevo }); }
    } catch (e) {
      alert(e.message);
    }
  }

  function salir() {
    logout();
    navigate("/acceso");
  }

  function nuevaRecarga() {
    setTicket(null);
    setSeleccionado(null);
    setError("");
  }

  return (
    <StaffLayout
        title="Ventanilla de cobros"
        variant="finanzas"
        userLabel={staff?.nombre || staff?.usuario}
        onLogout={salir}
        extra={
          <button type="button" onClick={() => navigate("/personal")} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12 }}>Personal</button>
        } maxWidth={1200}>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #ticket-recarga-print, #ticket-recarga-print * { visibility: visible !important; }
          #ticket-recarga-print { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      <div style={{ padding: isDesktop ? 20 : 16 }}>
        <div className="f-display" style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 3 }}>Recarga de viajes</div>
        <div style={{ fontSize: 11.5, color: "#6b7785", marginBottom: 14 }}>
          <Calendar size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
          Hoy · Busca por nombre o escanea el QR · Cobra por viajes o por pesos
        </div>

        {errorQr && (
          <div style={{ background: `${C.garnet}12`, border: `1px solid ${C.garnet}`, color: C.garnet, borderRadius: 9, padding: "10px 12px", fontSize: 12, marginBottom: 12 }}>
            {errorQr}
          </div>
        )}

        {escaneando && (
          <EscanerQrVentanilla
            onDetectado={handleQrDetectado}
            onCerrar={() => setEscaneando(false)}
            onError={(msg) => { setErrorQr(msg); setEscaneando(false); }}
          />
        )}

        {isDesktop ? (
          <div className="split-layout">
            <div className="split-left">
              {!ticket && (
                <Busqueda
                  query={query}
                  setQuery={setQuery}
                  resultados={resultados}
                  onSelect={seleccionar}
                  onAbrirQr={() => { setErrorQr(""); setEscaneando(true); }}
                />
              )}
              <RecargasHoy recargas={resumen?.recargas || []} />
              <div style={{ marginTop: 12 }}><ExportarReporte token={staff.token} /></div>
            </div>
            <div className="split-right">
              <ResumenDia resumen={resumen} />
              <PanelRecarga
                seleccionado={seleccionado}
                ticket={ticket}
                modo={modo}
                setModo={setModo}
                numViajes={numViajes}
                setNumViajes={setNumViajes}
                montoPesos={montoPesos}
                setMontoPesos={setMontoPesos}
                error={error}
                procesando={procesando}
                onConfirmar={confirmarRecarga}
                onNueva={nuevaRecarga}
                onImprimir={imprimirTicket}
              />
            </div>
          </div>
        ) : (
          <>
            <ResumenDia resumen={resumen} />
            {!ticket && !seleccionado && (
              <Busqueda
                query={query}
                setQuery={setQuery}
                resultados={resultados}
                onSelect={seleccionar}
                onAbrirQr={() => { setErrorQr(""); setEscaneando(true); }}
              />
            )}
            {(seleccionado || ticket) ? (
              <>
                {seleccionado && !ticket && (
                  <button
                    type="button"
                    onClick={() => setSeleccionado(null)}
                    style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: C.busBlue, fontSize: 12, marginBottom: 8, cursor: "pointer", padding: 0 }}
                  >
                    <ArrowLeft size={14} /> Volver a buscar
                  </button>
                )}
                <PanelRecarga
                  seleccionado={seleccionado}
                  ticket={ticket}
                  modo={modo}
                  setModo={setModo}
                  numViajes={numViajes}
                  setNumViajes={setNumViajes}
                  montoPesos={montoPesos}
                  setMontoPesos={setMontoPesos}
                  error={error}
                  procesando={procesando}
                  onConfirmar={confirmarRecarga}
                  onNueva={nuevaRecarga}
                  onImprimir={imprimirTicket}
                />
              </>
            ) : (
              <div style={{ marginTop: 18 }}>
                <RecargasHoy recargas={resumen?.recargas || []} />
                <div style={{ marginTop: 12 }}><ExportarReporte token={staff.token} /></div>
              </div>
            )}
          </>
        )}
      </div>
    </StaffLayout>
  );
}
