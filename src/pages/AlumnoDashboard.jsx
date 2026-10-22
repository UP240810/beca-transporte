import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import {
  User, Bus, Download, TrendingDown, CalendarCheck, ArrowLeft,
  AlertTriangle, Wallet, History, ArrowDownCircle, ArrowUpCircle, Ban,
} from "lucide-react";
import { C } from "../theme";
import { StaffHeader, A11yWidget } from "../components/GovShell";
import { useSesion } from "../context/SesionContext";
import { formatFechaHora } from "../utils";
import api from "../api";
import BrandLogos from "../components/BrandLogos";

function AvisoSaldo({ alumno }) {
  if (!alumno) return null;
  if (alumno.sinSaldo || alumno.viajesRestantes <= 0) {
    return (
      <div style={{
        background: `${C.garnet}12`, border: `1px solid ${C.garnet}`, borderRadius: 12,
        padding: "12px 14px", marginBottom: 14, display: "flex", gap: 10, alignItems: "flex-start",
      }}>
        <AlertTriangle size={18} color={C.garnet} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.garnet }}>Sin viajes disponibles</div>
          <div style={{ fontSize: 11.5, color: "#5B6675", marginTop: 3, lineHeight: 1.4 }}>
            Recarga en la ventanilla de la Presidencia Municipal (efectivo). Presenta tu matrícula o el QR de esta pantalla.
          </div>
        </div>
      </div>
    );
  }
  if (alumno.pocosViajes) {
    return (
      <div style={{
        background: `${C.gold}22`, border: `1px solid ${C.gold}`, borderRadius: 12,
        padding: "12px 14px", marginBottom: 14, display: "flex", gap: 10, alignItems: "flex-start",
      }}>
        <AlertTriangle size={18} color="#8A6114" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#8A6114" }}>
            Te quedan solo {alumno.viajesRestantes} viaje{alumno.viajesRestantes === 1 ? "" : "s"}
          </div>
          <div style={{ fontSize: 11.5, color: "#5B6675", marginTop: 3, lineHeight: 1.4 }}>
            Acércate pronto a ventanilla para recargar y no quedarte sin pase en el camión.
          </div>
        </div>
      </div>
    );
  }
  return null;
}

function iconoMovimiento(tipo) {
  if (tipo === "recarga") return <ArrowDownCircle size={16} color="#1F7A56" />;
  if (tipo === "viaje") return <ArrowUpCircle size={16} color={C.busBlue} />;
  return <Ban size={16} color={C.garnet} />;
}

function HistorialMovimientos({ movimientos, cargando }) {
  return (
    <div style={{ marginTop: 20, background: "#fff", border: `1px solid ${C.paperDim}`, borderRadius: 14, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <History size={14} color={C.navy} />
        <span style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>Historial de movimientos</span>
      </div>
      <div style={{ fontSize: 10.5, color: "#8993A1", marginBottom: 10 }}>
        Como en una banca: recargas (ingresos) y viajes (cargos).
      </div>

      {cargando && (
        <div style={{ fontSize: 12, color: "#8993A1", textAlign: "center", padding: 16 }}>Cargando movimientos…</div>
      )}

      {!cargando && movimientos.length === 0 && (
        <div style={{ fontSize: 12, color: "#8993A1", textAlign: "center", padding: 16 }}>
          Aún no hay movimientos. Cuando viajes o recargues aparecerán aquí.
        </div>
      )}

      {!cargando && movimientos.map((m) => (
        <div
          key={m.id}
          style={{
            display: "flex", gap: 10, alignItems: "flex-start",
            padding: "10px 0", borderTop: `1px solid ${C.paperDim}`,
          }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: 9, background: C.paper,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            {iconoMovimiento(m.tipo)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: C.navy }}>{m.titulo}</div>
            <div style={{ fontSize: 11, color: "#6b7785", marginTop: 2 }}>{m.detalle}</div>
            <div style={{ fontSize: 10, color: "#8993A1", marginTop: 3 }}>{formatFechaHora(m.fecha)}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            {m.tipo === "recarga" && (
              <>
                <div className="f-mono" style={{ fontSize: 12.5, fontWeight: 700, color: "#1F7A56" }}>+{m.viajes}v</div>
                <div className="f-mono" style={{ fontSize: 10.5, color: "#1F7A56" }}>${m.monto}</div>
              </>
            )}
            {m.tipo === "viaje" && (
              <>
                <div className="f-mono" style={{ fontSize: 12.5, fontWeight: 700, color: C.busBlue }}>-1v</div>
                {m.monto ? (
                  <div className="f-mono" style={{ fontSize: 10.5, color: "#6b7785" }}>${Math.abs(m.monto)}</div>
                ) : null}
              </>
            )}
            {m.tipo === "rechazo" && (
              <div style={{ fontSize: 10, fontWeight: 600, color: C.garnet }}>Sin cargo</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AlumnoDashboard() {
  const navigate = useNavigate();
  const { alumno, token, logout, cargando, refrescar } = useSesion();
  const [qrImg, setQrImg] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [cargandoHist, setCargandoHist] = useState(false);

  useEffect(() => {
    if (!cargando && !alumno) navigate("/alumno/login", { replace: true });
  }, [cargando, alumno, navigate]);

  useEffect(() => {
    if (!token) return;
    api.qrToken(token)
      .then(({ token: qrToken }) =>
        QRCode.toDataURL(qrToken, { margin: 1, width: 240, color: { dark: C.navy, light: "#FFFFFF" } })
      )
      .then(setQrImg)
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    setCargandoHist(true);
    api.alumnoHistorial(token, 40)
      .then((data) => setMovimientos(data.movimientos || []))
      .catch(() => setMovimientos([]))
      .finally(() => setCargandoHist(false));
  }, [token]);

  // Refrescar /me al montar por si el saldo cambió (recarga)
  useEffect(() => {
    if (token && typeof refrescar === "function") refrescar();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  function descargarTarjeta() {
    const w = 640, h = 380;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, C.navy);
    grad.addColorStop(1, C.navySoft);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = C.gold;
    ctx.font = "bold 15px sans-serif";
    ctx.fillText("PASE ESTUDIANTIL", 32, 44);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText(alumno.nombreCompleto, 32, 90);

    ctx.fillStyle = C.skyBlue;
    ctx.font = "16px monospace";
    ctx.fillText(alumno.matricula, 32, 118);
    ctx.fillText(alumno.escuela, 32, 145);

    ctx.font = "13px sans-serif";
    ctx.fillText("Ciclo escolar 2026–2027", 32, 300);
    ctx.fillText("Gobierno Municipal de Calvillo", 32, 322);

    function finalizarYDescargar() {
      const link = document.createElement("a");
      link.download = `tarjeta-${alumno.matricula}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }

    if (qrImg) {
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(w - 280, 60, 220, 220);
        ctx.drawImage(img, w - 270, 70, 200, 200);
        finalizarYDescargar();
      };
      img.src = qrImg;
    } else {
      finalizarYDescargar();
    }
  }

  if (cargando) {
    return (
      <div style={{ maxWidth: 430, margin: "0 auto", minHeight: 640, background: C.paper, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 12.5, color: "#8993A1" }}>Cargando tu cuenta…</div>
      </div>
    );
  }
  if (!alumno) return null;

  const restantesMes = Math.max(0, (alumno.viajesLimiteMes || 0) - (alumno.viajesUsadosMes || 0));
  const pct = alumno.viajesLimiteMes
    ? Math.min(100, Math.round((alumno.viajesUsadosMes / alumno.viajesLimiteMes) * 100))
    : 0;

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: 640, background: C.paper }}>
      <StaffHeader
        title="Mi pase estudiantil"
        userLabel={alumno?.nombreCompleto || alumno?.nombre}
        onLogout={() => { logout(); navigate("/"); }}
      />
      <A11yWidget />

      <div style={{ padding: 18 }}>
        <div className="f-display" style={{ fontSize: 19, fontWeight: 700, color: C.navy }}>Hola, {alumno.nombre} 👋</div>
        <div style={{ fontSize: 12, color: "#6b7785", marginTop: 2, marginBottom: 14 }}>{alumno.escuela}</div>

        <AvisoSaldo alumno={alumno} />

        {/* Tarjeta + QR */}
        <div style={{ background: `linear-gradient(160deg, ${C.navy}, ${C.navySoft})`, borderRadius: 16, display: "flex", overflow: "hidden", boxShadow: "0 12px 28px rgba(0,51,102,0.25)" }}>
          <div style={{ flex: 1, padding: "16px 14px", color: "#fff" }}>
            <div style={{ fontSize: 9.5, letterSpacing: 1, color: C.gold, fontWeight: 700, marginBottom: 8 }}>PASE ESTUDIANTIL</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: C.skyBlue, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                {alumno.foto ? <img src={alumno.foto} alt={alumno.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={20} color={C.navy} />}
              </div>
              <div>
                <div className="f-display" style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.2 }}>{alumno.nombreCompleto}</div>
                <div className="f-mono" style={{ fontSize: 10, color: C.skyBlue, marginTop: 2 }}>{alumno.matricula}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: C.skyBlue, marginBottom: 4 }}>
              Saldo: <strong className="f-mono" style={{ color: "#fff", fontSize: 14 }}>{alumno.viajesRestantes}</strong> viajes
            </div>
            <div style={{ fontSize: 9.5, color: C.skyBlue, opacity: 0.85 }}>Ciclo escolar 2026–2027</div>
          </div>
          <div style={{ width: 0, borderLeft: `2px dashed ${C.navySoft}` }} />
          <div style={{ width: 130, padding: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.12)" }}>
            {qrImg ? (
              <img src={qrImg} alt="QR de pase" style={{ width: 100, height: 100, borderRadius: 8, background: "#fff" }} />
            ) : (
              <div style={{ width: 100, height: 100, borderRadius: 8, background: "rgba(255,255,255,0.15)" }} />
            )}
            <div style={{ fontSize: 8.5, color: C.skyBlue, marginTop: 6, textAlign: "center" }}>Muestra en el camión</div>
          </div>
        </div>

        <button
          type="button"
          onClick={descargarTarjeta}
          style={{
            width: "100%", marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            padding: "10px 0", borderRadius: 10, border: `1px solid ${C.paperDim}`, background: "#fff",
            color: C.navy, fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}
        >
          <Download size={14} /> Descargar tarjeta
        </button>

        {/* Rutas */}
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Bus size={13} color={C.navy} />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: C.navy }}>Tus rutas con descuento</span>
          </div>
          {alumno.rutas.map((r, i) => (
            <div
              key={i}
              style={{
                background: `${C.mint}1F`, border: `1px solid ${C.mint}`, borderRadius: 12,
                padding: "11px 13px", display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: i < alumno.rutas.length - 1 ? 8 : 0,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>{r.nombre}</span>
              <span className="f-mono" style={{ fontSize: 9.5, fontWeight: 700, color: "#fff", background: C.garnet, borderRadius: 999, padding: "3px 8px" }}>
                -{r.descuento}
              </span>
            </div>
          ))}
        </div>

        {/* Uso del mes */}
        <div style={{ marginTop: 20, background: "#fff", border: `1px solid ${C.paperDim}`, borderRadius: 14, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <TrendingDown size={13} color={C.busBlue} />
                <span style={{ fontSize: 11.5, fontWeight: 700, color: C.navy }}>Viajes de este mes</span>
              </div>
              <div className="f-mono" style={{ fontSize: 22, fontWeight: 700, color: C.navy, marginTop: 6 }}>
                {alumno.viajesUsadosMes}{" "}
                <span style={{ fontSize: 12, color: "#8993A1", fontWeight: 500 }}>/ {alumno.viajesLimiteMes}</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10.5, color: "#8993A1" }}>Saldo actual</div>
              <div className="f-mono" style={{ fontSize: 20, fontWeight: 700, color: alumno.viajesRestantes <= 0 ? C.garnet : "#1F7A56" }}>
                {alumno.viajesRestantes}
              </div>
            </div>
          </div>
          <div style={{ height: 8, background: C.paperDim, borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: pct > 85 ? C.garnet : C.busBlue, borderRadius: 999 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 10, fontSize: 10.5, color: "#8993A1" }}>
            <CalendarCheck size={12} /> Último uso: {alumno.ultimoUso ? formatFechaHora(alumno.ultimoUso) : "Aún no registras viajes"}
          </div>
        </div>

        <HistorialMovimientos movimientos={movimientos} cargando={cargandoHist} />

        <div style={{ marginTop: 16, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 10.5, color: "#8993A1" }}>
          <Wallet size={12} /> Recargas solo en efectivo · Presidencia Municipal de Calvillo
        </div>
      </div>
    </div>
  );
}
