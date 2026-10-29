import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import {
  User, Bus, Download, TrendingDown, CalendarCheck, ArrowLeft,
  AlertTriangle, Wallet, History, ArrowDownCircle, ArrowUpCircle, Ban, CheckCircle2, FileText,
} from "lucide-react";
import { C } from "../theme";
import { StaffLayout } from "../components/GovShell";
import { useSesion } from "../context/SesionContext";
import { formatFechaHora } from "../utils";
import api from "../api";
import { descargarCredencialPDF, descargarPasePNG } from "../credencial";
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

const formatoPesos = (n) =>
  `$${(Number(n) || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const estiloBotonDescarga = (deshabilitado) => ({
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  padding: "12px 10px", borderRadius: 10, border: `1px solid ${C.paperDim}`,
  background: "#fff", color: C.navy, fontSize: 12.5, fontWeight: 700,
  cursor: deshabilitado ? "not-allowed" : "pointer", opacity: deshabilitado ? 0.55 : 1,
});

export default function AlumnoDashboard() {
  const navigate = useNavigate();
  const { alumno, token, logout, cargando, refrescar } = useSesion();
  const [qrImg, setQrImg] = useState(null);
  const [pase, setPase] = useState(null); // { jti, expiraEn }
  const [paseUsado, setPaseUsado] = useState(false);
  const [paseError, setPaseError] = useState("");
  const [generando, setGenerando] = useState(""); // "pdf" | "png" | ""
  const [errorDescarga, setErrorDescarga] = useState("");
  const [movimientos, setMovimientos] = useState([]);
  const [cargandoHist, setCargandoHist] = useState(false);

  useEffect(() => {
    if (!cargando && !alumno) navigate("/alumno/login", { replace: true });
  }, [cargando, alumno, navigate]);

  // PASE DE UN SOLO USO: cada QR sirve una vez. Al usarse en el camión la app
  // lo detecta y genera uno nuevo automáticamente.
  const generarPase = useCallback(async () => {
    if (!token) return;
    try {
      const { token: qrToken, jti, expiraEn } = await api.qrToken(token);
      const img = await QRCode.toDataURL(qrToken, { margin: 1, width: 360, color: { dark: C.navy, light: "#FFFFFF" } });
      setQrImg(img);
      setPase({ jti, expiraEn });
      setPaseUsado(false);
      setPaseError("");
    } catch (e) {
      setPaseError(e?.message || "No se pudo generar tu pase.");
    }
  }, [token]);

  useEffect(() => { generarPase(); }, [generarPase]);

  // Sondeo: ¿ya se usó este pase? ¿venció?
  useEffect(() => {
    if (!pase || paseUsado) return undefined;
    const id = setInterval(async () => {
      if (Date.now() >= pase.expiraEn) { generarPase(); return; }
      try {
        const r = await api.paseEstado(pase.jti, token);
        if (r.usado) {
          setPaseUsado(true);
          if (typeof refrescar === "function") refrescar();
        }
      } catch { /* sin señal: se reintenta en el siguiente ciclo */ }
    }, 3000);
    return () => clearInterval(id);
  }, [pase, paseUsado, token, generarPase, refrescar]);

  // Tras usarse, se muestra el aviso unos segundos y se genera el pase nuevo
  useEffect(() => {
    if (!paseUsado) return undefined;
    const t = setTimeout(generarPase, 3500);
    return () => clearTimeout(t);
  }, [paseUsado, generarPase]);

  useEffect(() => {
    if (!token) return;
    setCargandoHist(true);
    api.alumnoHistorial(token, 40)
      .then((data) => {
        const lista = data.movimientos || [];
        lista.sort((a, b) => {
          const tb = Date.parse(String(b.fecha).replace(" ", "T")) || 0;
          const ta = Date.parse(String(a.fecha).replace(" ", "T")) || 0;
          return tb - ta;
        });
        setMovimientos(lista);
      })
      .catch(() => setMovimientos([]))
      .finally(() => setCargandoHist(false));
  }, [token]);

  // Refrescar /me al montar por si el saldo cambió (recarga)
  useEffect(() => {
    if (token && typeof refrescar === "function") refrescar();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Credencial física en PDF (carta, con frente y reverso listos para recortar y enmicar)
  async function bajarCredencial() {
    setGenerando("pdf");
    setErrorDescarga("");
    try {
      const { token: credToken } = await api.credencialQr(token);
      const qrDataUrl = await QRCode.toDataURL(credToken, { margin: 1, width: 420, errorCorrectionLevel: "M" });
      await descargarCredencialPDF({ alumno, qrDataUrl });
    } catch (e) {
      setErrorDescarga(e?.message || "No se pudo generar la credencial.");
    } finally {
      setGenerando("");
    }
  }

  // Pase de un solo uso en PNG, para cuando la página no cargue (solo con saldo)
  async function bajarPase() {
    setGenerando("png");
    setErrorDescarga("");
    try {
      const { token: t, jti, expiraEn } = await api.qrToken(token, true);
      const qrDataUrl = await QRCode.toDataURL(t, { margin: 1, width: 720, errorCorrectionLevel: "M" });
      await descargarPasePNG({ alumno, qrDataUrl, expiraEn, jti });
    } catch (e) {
      setErrorDescarga(e?.message || "No se pudo generar el pase.");
    } finally {
      setGenerando("");
    }
  }

  if (cargando) {
    return (
      <div style={{ width: "100%", margin: "0 auto", minHeight: "60vh", background: C.paper, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
    <StaffLayout
        title="Mi pase estudiantil"
        userLabel={alumno?.nombreCompleto || alumno?.nombre}
        onLogout={() => { logout(); navigate("/"); }} maxWidth={760}>

      <div className="alumno-ui" style={{ padding: 18 }}>
        <div className="f-display" style={{ fontSize: 19, fontWeight: 700, color: C.navy }}>Hola, {alumno.nombre} 👋</div>
        <div style={{ fontSize: 12, color: "#6b7785", marginTop: 2, marginBottom: 14 }}>{alumno.escuela}</div>

        <AvisoSaldo alumno={alumno} />

        {/* Tarjeta + QR */}
        <div style={{ background: `linear-gradient(160deg, ${C.navy}, ${C.navySoft})`, borderRadius: 16, display: "flex", overflow: "hidden", boxShadow: "0 12px 28px rgba(0,51,102,0.25)" }}>
          <div style={{ flex: 1, padding: "16px 14px", color: "#fff" }}>
            <div style={{ fontSize: 9.5, letterSpacing: 1, color: C.gold, fontWeight: 700, marginBottom: 8 }}>PASE ESTUDIANTIL</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 66, height: 88, borderRadius: 10, background: C.skyBlue, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", border: "2px solid #fff" }}>
                {alumno.foto ? <img src={alumno.foto} alt={alumno.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={30} color={C.navy} />}
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="f-display" style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>{alumno.nombreCompleto}</div>
                <div style={{ fontSize: 9.5, color: C.gold, fontWeight: 700, letterSpacing: 0.6, marginTop: 6 }}>NÚMERO DE CONTROL</div>
                <div className="f-mono" style={{ fontSize: 12, color: C.skyBlue, marginTop: 1 }}>{alumno.matricula}</div>
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: C.skyBlue, marginBottom: 4 }}>
              Saldo: <strong className="f-mono" style={{ color: "#fff", fontSize: 15 }}>{alumno.viajesRestantes}</strong> {alumno.viajesRestantes === 1 ? "viaje" : "viajes"}
              {" · "}<strong className="f-mono" style={{ color: "#fff", fontSize: 15 }}>{formatoPesos(alumno.saldoPesos)}</strong>
            </div>
            <div style={{ fontSize: 9.5, color: C.skyBlue, opacity: 0.85 }}>Ciclo escolar 2026–2027</div>
          </div>
          <div style={{ width: 0, borderLeft: `2px dashed ${C.navySoft}` }} />
          <div style={{ width: "clamp(140px, 30vw, 220px)", flexShrink: 0, padding: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.12)" }}>
            <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1" }}>
              {qrImg && !paseError ? (
                <img src={qrImg} alt="QR del pase de un solo uso" style={{ width: "100%", height: "100%", borderRadius: 8, background: "#fff", opacity: paseUsado ? 0.12 : 1, transition: "opacity .25s" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", borderRadius: 8, background: "rgba(255,255,255,0.15)" }} />
              )}
              {paseUsado && (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", textAlign: "center", padding: 6 }}>
                  <CheckCircle2 size={34} color={C.mint} />
                  <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>Pase usado</div>
                  <div style={{ fontSize: 10.5, opacity: 0.9 }}>Generando uno nuevo…</div>
                </div>
              )}
            </div>
            {paseError ? (
              <>
                <div style={{ fontSize: 10.5, color: "#fff", marginTop: 6, textAlign: "center" }}>{paseError}</div>
                <button type="button" onClick={generarPase} style={{ marginTop: 6, background: C.gold, color: C.navy, border: "none", borderRadius: 999, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  Reintentar
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="alumno-descargas" style={{ marginTop: 12, display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
          <button type="button" onClick={bajarCredencial} disabled={!!generando} style={estiloBotonDescarga(!!generando)}>
            <FileText size={15} /> {generando === "pdf" ? "Generando PDF…" : "Descargar credencial (PDF)"}
          </button>
          <button type="button" onClick={bajarPase} disabled={!!generando || alumno.viajesRestantes <= 0} style={estiloBotonDescarga(!!generando || alumno.viajesRestantes <= 0)}>
            <Download size={15} /> {generando === "png" ? "Generando pase…" : "Pase de 1 solo uso (PNG)"}
          </button>
        </div>
        <div style={{ fontSize: 10.5, color: "#8993A1", marginTop: 8, lineHeight: 1.45 }}>
          La credencial se imprime a color y se enmica (hoja carta, lista para recortar). El pase PNG es para cuando la página no cargue: funciona una sola vez y solo se genera si tienes saldo.
        </div>
        {errorDescarga && <div style={{ fontSize: 11.5, color: C.garnet, marginTop: 8 }}>{errorDescarga}</div>}

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
                {alumno.viajesRestantes} <span style={{ fontSize: 11, fontWeight: 600 }}>{alumno.viajesRestantes === 1 ? "viaje" : "viajes"}</span>
              </div>
              <div className="f-mono" style={{ fontSize: 14, fontWeight: 700, color: alumno.viajesRestantes <= 0 ? C.garnet : C.navy, marginTop: 2 }}>
                {formatoPesos(alumno.saldoPesos)} <span style={{ fontSize: 10, fontWeight: 600, color: "#8993A1" }}>en pesos (tu 40%)</span>
                {alumno.costoEstudiante != null && (
                  <div style={{ fontSize: 11, color: "#8993A1", marginTop: 4, fontWeight: 500 }}>
                    Cada viaje te descuenta {formatoPesos(alumno.costoEstudiante)} (40% del boleto)
                  </div>
                )}
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
    </StaffLayout>
  );
}
