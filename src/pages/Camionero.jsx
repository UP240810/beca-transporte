import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bus, ScanLine, CheckCircle2, XCircle, AlertTriangle, WifiOff, Wifi,
  User, RotateCcw, ListChecks, LogOut, Camera, Keyboard, CameraOff,
  CloudUpload, CloudOff, Clock3, CalendarDays, ArrowLeft, Volume2,
  Users,
} from "lucide-react";
import { C } from "../theme";
import { StaffHeader, A11yWidget } from "../components/GovShell";
import { useStaffSesion } from "../context/StaffSesionContext";
import api from "../api";
// reportes chofer (sencillo / detallado)
import {
  guardarManifiesto, obtenerManifiesto, evaluarLocal, descontarLocal,
  encolarPendiente, listarPendientes, contarPendientes, quitarPendiente,
  guardarSyncMeta, solicitarBackgroundSync, sincronizarColaConApi,
} from "../offlineQueue";
import BrandLogos from "../components/BrandLogos";

const ESTADOS = {
  valido: {
    color: "#fff",
    bg: "#1F7A56",
    icon: CheckCircle2,
    titulo: "APROBADO",
    msg: "Ruta correcta y con viajes disponibles.",
  },
  "ruta-incorrecta": {
    color: "#fff",
    bg: C.garnet,
    icon: XCircle,
    titulo: "RUTA INCORRECTA",
    msg: "Este estudiante no tiene descuento en la ruta de este turno.",
  },
  "sin-saldo": {
    color: "#fff",
    bg: "#B45309",
    icon: AlertTriangle,
    titulo: "SALDO INSUFICIENTE",
    msg: "Debe recargar en la Presidencia Municipal.",
  },
  revocado: {
    color: "#fff",
    bg: "#6B1F2A",
    icon: XCircle,
    titulo: "PASE REVOCADO",
    msg: "QR invalidado o alumno dado de baja.",
  },
  "no-encontrado": {
    color: "#fff",
    bg: C.garnet,
    icon: XCircle,
    titulo: "NO RECONOCIDO",
    msg: "No está en el manifiesto de esta ruta (offline) o no existe.",
  },
};

/** Beep corto con Web Audio — tono distinto según resultado */
function tocarSonido(resultado) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = 0.15;

    if (resultado === "valido") {
      // Dos tonos ascendentes (OK)
      osc.frequency.value = 880;
      osc.type = "sine";
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.stop(ctx.currentTime + 0.12);
      setTimeout(() => {
        const ctx2 = new (window.AudioContext || window.webkitAudioContext)();
        const o2 = ctx2.createOscillator();
        const g2 = ctx2.createGain();
        o2.connect(g2);
        g2.connect(ctx2.destination);
        o2.frequency.value = 1175;
        o2.type = "sine";
        g2.gain.value = 0.15;
        o2.start();
        g2.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 0.15);
        o2.stop(ctx2.currentTime + 0.15);
      }, 100);
    } else {
      // Tono bajo / doble rechazo
      osc.frequency.value = 220;
      osc.type = "square";
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.stop(ctx.currentTime + 0.25);
      setTimeout(() => {
        const ctx2 = new (window.AudioContext || window.webkitAudioContext)();
        const o2 = ctx2.createOscillator();
        const g2 = ctx2.createGain();
        o2.connect(g2);
        g2.connect(ctx2.destination);
        o2.frequency.value = 180;
        o2.type = "square";
        g2.gain.value = 0.12;
        o2.start();
        g2.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 0.3);
        o2.stop(ctx2.currentTime + 0.3);
      }, 180);
    }
  } catch {
    // Navegadores sin Web Audio: silencioso
  }
}

function leerMatriculaSinVerificar(qrToken) {
  try {
    let payload = qrToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    while (payload.length % 4 !== 0) payload += "=";
    const json = JSON.parse(atob(payload));
    return json.matricula || null;
  } catch {
    return null;
  }
}

const READER_ID = "qr-reader-camionero";

function EscanerCamara({ activo, onDetectado, onErrorCamara }) {
  const instanciaRef = useRef(null);
  const detectadoRef = useRef(false);

  useEffect(() => {
    if (!activo) return;
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
          { fps: 10, qrbox: { width: 230, height: 230 } },
          (decodedText) => {
            if (detectadoRef.current) return;
            detectadoRef.current = true;
            onDetectado(decodedText);
          },
          () => {}
        )
        .catch(() => {
          onErrorCamara("No se pudo acceder a la cámara. Revisa permisos o usa modo manual.");
        });
    });

    return () => {
      cancelado = true;
      if (instanciaRef.current) {
        instanciaRef.current.stop().then(() => instanciaRef.current.clear()).catch(() => {});
      }
    };
  }, [activo]);

  return <div id={READER_ID} style={{ width: "100%", borderRadius: 16, overflow: "hidden" }} />;
}

function ResumenDia({ token, onCerrar }) {
  const hoy = new Date().toISOString().slice(0, 10);
  const [fecha, setFecha] = useState(hoy);
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancel = false;
    setCargando(true);
    setError("");
    api.resumenValidaciones(fecha, token)
      .then((d) => { if (!cancel) setData(d); })
      .catch((e) => { if (!cancel) setError(e.message); })
      .finally(() => { if (!cancel) setCargando(false); });
    return () => { cancel = true; };
  }, [fecha, token]);

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "#fff" }}>
      <StaffHeader title="Chofer" userLabel={staff?.nombre} onLogout={salir} />
      <div style={{ padding: 10, background: "#fff", borderBottom: "1px solid #eee", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "end" }}>
        <strong style={{ width: "100%", fontSize: 13 }}>Reportes de viajes</strong>
        <label style={{ fontSize: 12 }}>Desde <input type="date" value={repDesde} onChange={(e) => setRepDesde(e.target.value)} /></label>
        <label style={{ fontSize: 12 }}>Hasta <input type="date" value={repHasta} onChange={(e) => setRepHasta(e.target.value)} /></label>
        <button type="button" onClick={() => cargarReporteChofer(false)} style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: "#003366", color: "#fff", fontSize: 12 }}>Sencillo (90%)</button>
        <button type="button" onClick={() => cargarReporteChofer(true)} style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: "#4078D1", color: "#fff", fontSize: 12 }}>Detallado</button>
        {rep && <span style={{ fontSize: 13 }}>Viajes: <b>{rep.viajes}</b> · Total 90%: <b>${rep.total90}</b></span>}
      </div>

      <div style={{ padding: 16 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: C.navy }}>Fecha</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          style={{ width: "100%", marginTop: 6, marginBottom: 14, padding: "10px 12px", borderRadius: 9, border: `1px solid ${C.paperDim}`, fontSize: 13, boxSizing: "border-box" }}
        />

        {error && <div style={{ color: C.garnet, fontSize: 12, marginBottom: 10 }}>{error}</div>}
        {cargando && <div style={{ fontSize: 12, color: "#8993A1" }}>Cargando…</div>}

        {data && !cargando && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              <div style={{ background: "#E4F3EA", borderRadius: 12, padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#1F7A56" }}>{data.validos}</div>
                <div style={{ fontSize: 10, color: "#1F7A56", fontWeight: 600 }}>Válidos</div>
              </div>
              <div style={{ background: `${C.garnet}15`, borderRadius: 12, padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.garnet }}>{data.rechazados}</div>
                <div style={{ fontSize: 10, color: C.garnet, fontWeight: 600 }}>Rechazados</div>
              </div>
              <div style={{ background: C.paper, borderRadius: 12, padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.navy }}>{data.totalEscaneos}</div>
                <div style={{ fontSize: 10, color: "#8993A1", fontWeight: 600 }}>Escaneos</div>
              </div>
              <div style={{ background: `${C.gold}22`, borderRadius: 12, padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#8A6114" }}>${data.montoEstimado}</div>
                <div style={{ fontSize: 10, color: "#8A6114", fontWeight: 600 }}>Estimado (válidos)</div>
              </div>
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Detalle</div>
            {data.detalle.length === 0 ? (
              <div style={{ fontSize: 12, color: "#8993A1", textAlign: "center", padding: 20 }}>Sin registros este día.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {data.detalle.map((d, i) => (
                  <div key={i} style={{ background: C.paper, borderRadius: 10, padding: "10px 12px", border: `1px solid ${C.paperDim}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.navy }}>{d.nombre}</div>
                        <div className="f-mono" style={{ fontSize: 10, color: "#8993A1" }}>{d.matricula}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6,
                          background: d.resultado === "valido" ? "#E4F3EA" : `${C.garnet}15`,
                          color: d.resultado === "valido" ? "#1F7A56" : C.garnet,
                        }}>
                          {d.resultado === "valido" ? `$${d.monto}` : d.resultado}
                        </div>
                        <div style={{ fontSize: 9.5, color: "#8993A1", marginTop: 3 }}>
                          {d.hora?.slice(11, 16) || "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function Camionero() {
  const navigate = useNavigate();
  const { staff, logout } = useStaffSesion();

  const [repDesde, setRepDesde] = useState(() => new Date().toISOString().slice(0, 10));
  const [repHasta, setRepHasta] = useState(() => new Date().toISOString().slice(0, 10));
  const [rep, setRep] = useState(null);
  async function cargarReporteChofer(detallado) {
    try {
      const r = await api.reportesChofer(repDesde, repHasta, staff.token, detallado);
      setRep(r);
    } catch (e) {
      alert(e.message);
    }
  }

  const [rutasDisponibles, setRutasDisponibles] = useState([]);
  const [ruta, setRuta] = useState("");
  const [rutaId, setRutaId] = useState(null);
  const [iniciado, setIniciado] = useState(false);
  const [preparando, setPreparando] = useState(false);
  const [avisoInicio, setAvisoInicio] = useState("");
  const [vistaResumen, setVistaResumen] = useState(false);

  const [enLinea, setEnLinea] = useState(navigator.onLine);
  const [forzarSinSenal, setForzarSinSenal] = useState(false);
  const offline = !enLinea || forzarSinSenal;

  const [modo, setModo] = useState("camara");
  const [matriculaManual, setMatriculaManual] = useState("");
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [contador, setContador] = useState(0);
  const [contadores, setContadores] = useState({ validos: 0, rechazados: 0 });
  const [pendientesSync, setPendientesSync] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);

  useEffect(() => {
    api.rutas().then(setRutasDisponibles).catch(() => {});
  }, []);

  useEffect(() => {
    function marcarOnline() { setEnLinea(true); }
    function marcarOffline() { setEnLinea(false); }
    window.addEventListener("online", marcarOnline);
    window.addEventListener("offline", marcarOffline);
    return () => {
      window.removeEventListener("online", marcarOnline);
      window.removeEventListener("offline", marcarOffline);
    };
  }, []);

  // Token + API para que el Service Worker sincronice con la app cerrada
  useEffect(() => {
    if (!staff?.token) return;
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
    guardarSyncMeta({ token: staff.token, apiBase }).catch(() => {});
    solicitarBackgroundSync().catch(() => {});
  }, [staff?.token]);

  // Mensajes del SW cuando terminó un background sync
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    function onMsg(event) {
      if (event.data?.type === "SYNC_VALIDACIONES_DONE") {
        setPendientesSync(event.data.restantes ?? 0);
        contarPendientes().then(setPendientesSync).catch(() => {});
      }
    }
    navigator.serviceWorker.addEventListener("message", onMsg);
    return () => navigator.serviceWorker.removeEventListener("message", onMsg);
  }, []);

  const sincronizarPendientes = useCallback(async () => {
    if (offline || sincronizando) return;
    setSincronizando(true);
    try {
      await sincronizarColaConApi(staff.token, (body, token) => api.validar(body, token));
      // También pide al SW un intento por si quedó algo
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "FORCE_SYNC_VALIDACIONES" });
      }
      await solicitarBackgroundSync();
    } finally {
      setPendientesSync(await contarPendientes());
      setSincronizando(false);
    }
  }, [offline, sincronizando, staff.token]);

  useEffect(() => {
    if (!offline) sincronizarPendientes();
  }, [offline]); // eslint-disable-line react-hooks/exhaustive-deps

  function salir() {
    logout();
    navigate("/acceso");
  }

  function irPersonal() {
    navigate("/personal");
  }

  function mostrarResultado(data) {
    setResultado(data);
    tocarSonido(data.resultado);
    setContador((c) => c + 1);
    setContadores((c) => ({
      validos: c.validos + (data.resultado === "valido" ? 1 : 0),
      rechazados: c.rechazados + (data.resultado !== "valido" ? 1 : 0),
    }));
  }

  async function comenzarTurno() {
    setPreparando(true);
    setAvisoInicio("");
    const rutaSel = rutasDisponibles.find((r) => r.nombre === ruta);
    try {
      if (!offline) {
        const apiBase = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
        await guardarSyncMeta({ token: staff.token, apiBase });
        const manifiesto = await api.manifiestoRuta(rutaSel.id, staff.token);
        await guardarManifiesto(rutaSel.id, manifiesto.alumnos);
      } else {
        const local = await obtenerManifiesto(rutaSel.id);
        if (!local) {
          setAvisoInicio("No hay copia local de esta ruta. Conéctate al menos una vez antes de iniciar sin señal.");
          setPreparando(false);
          return;
        }
      }
      setRutaId(rutaSel.id);
      setPendientesSync(await contarPendientes());
      setIniciado(true);
    } catch {
      setAvisoInicio("No se pudo descargar la información de la ruta. Intenta de nuevo.");
    } finally {
      setPreparando(false);
    }
  }

  async function procesarEscaneoOffline(qrToken, matriculaDirecta) {
    const matricula = matriculaDirecta || leerMatriculaSinVerificar(qrToken);
    if (!matricula) {
      setError("No se pudo leer este código sin conexión.");
      return;
    }
    const manifiesto = await obtenerManifiesto(rutaId);
    const { resultado: resLocal, alumno } = evaluarLocal(manifiesto, matricula);

    if (resLocal === "sin-manifiesto") {
      setError("No hay datos locales de esta ruta. Conéctate para descargarlos.");
      return;
    }
    if (resLocal === "valido") await descontarLocal(rutaId, matricula);

    await encolarPendiente({
      ...(matriculaDirecta ? { matricula: matriculaDirecta } : { qrToken }),
      rutaId,
      resultadoLocal: resLocal,
      ts: new Date().toISOString(),
    });

    setPendientesSync(await contarPendientes());
    mostrarResultado({
      resultado: resLocal === "no-encontrado" ? "ruta-incorrecta" : resLocal,
      mensaje: ESTADOS[resLocal === "no-encontrado" ? "ruta-incorrecta" : resLocal]?.msg,
      pendiente: true,
      alumno: alumno
        ? {
            nombre: alumno.nombre,
            matricula: alumno.matricula,
            ruta,
            viajesRestantes: resLocal === "valido" ? alumno.viajesRestantes - 1 : alumno.viajesRestantes,
          }
        : { nombre: "No identificado localmente", matricula, ruta, viajesRestantes: "—" },
    });
  }

  async function validarConBackend(datos) {
    setProcesando(true);
    setError("");
    try {
      const data = await api.validar({ ...datos, rutaId }, staff.token);
      mostrarResultado(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  }

  async function handleDetectadoCamara(qrToken) {
    setError("");
    if (offline) {
      await procesarEscaneoOffline(qrToken, null);
      return;
    }
    validarConBackend({ qrToken });
  }

  async function handleValidarManual(e) {
    e.preventDefault();
    if (!matriculaManual.trim()) return;
    setError("");
    if (offline) {
      await procesarEscaneoOffline(null, matriculaManual.trim());
      return;
    }
    validarConBackend({ matricula: matriculaManual.trim() });
  }

  function escanearSiguiente() {
    setResultado(null);
    setError("");
    setMatriculaManual("");
  }

  if (vistaResumen) {
    return <ResumenDia token={staff.token} onCerrar={() => setVistaResumen(false)} />;
  }

  if (!iniciado) {
    return (
      <div style={{ maxWidth: 430, margin: "0 auto", minHeight: 640, background: "#fff" }}>
        <StaffHeader
          title="Chofer · validación"
          userLabel={staff?.nombre}
          onLogout={salir}
        />
        <A11yWidget />

        <div style={{ padding: "32px 24px", textAlign: "center" }}>
          <div style={{ width: 54, height: 54, borderRadius: 14, background: C.skyBlue, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Bus size={24} color={C.navy} />
          </div>
          <div className="f-display" style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>Inicio de turno</div>
          <p style={{ fontSize: 12, color: "#6b7785", marginTop: 6, marginBottom: 20, lineHeight: 1.45 }}>
            Elige la ruta que vas a cubrir. Solo se aceptarán estudiantes con <strong>esa ruta asignada</strong> por Recaudación. Si tienes 1 o 2 rutas en el pase, basta con que coincida con la del turno.
          </p>

          <div style={{ textAlign: "left", marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: C.navy, marginBottom: 8 }}>Ruta de hoy</label>
            {rutasDisponibles.length === 0 ? (
              <div style={{ fontSize: 12, color: "#8993A1" }}>Cargando rutas del catálogo…</div>
            ) : (
              rutasDisponibles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRuta(r.nombre)}
                  style={{
                    width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 10,
                    padding: "13px 14px", borderRadius: 11, marginBottom: 8, cursor: "pointer",
                    border: `1.5px solid ${ruta === r.nombre ? C.busBlue : C.paperDim}`,
                    background: ruta === r.nombre ? `${C.busBlue}0F` : "#fff",
                  }}
                >
                  <Bus size={15} color={ruta === r.nombre ? C.busBlue : "#8993A1"} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: ruta === r.nombre ? C.navy : C.ink }}>
                      {r.codigo ? <span className="f-mono" style={{ color: C.busBlue, marginRight: 6 }}>{r.codigo}</span> : null}
                      {r.nombre}
                    </div>
                    <div style={{ fontSize: 10, color: "#8993A1" }}>${r.costo_por_viaje} por viaje · {r.descuento_pct}% desc.</div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.paper, borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              {offline ? <WifiOff size={14} color={C.garnet} /> : <Wifi size={14} color="#1F7A56" />}
              <span style={{ fontSize: 11.5, color: C.ink }}>
                {!enLinea ? "Sin conexión real" : forzarSinSenal ? "Sin señal (simulado)" : "Con señal"}
              </span>
            </div>
            <button type="button" onClick={() => setForzarSinSenal((o) => !o)} style={{ fontSize: 10.5, color: C.busBlue, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>simular</button>
          </div>

          {avisoInicio && (
            <div style={{ background: `${C.garnet}12`, border: `1px solid ${C.garnet}`, color: C.garnet, borderRadius: 9, padding: "10px 12px", fontSize: 11.5, marginBottom: 14, textAlign: "left" }}>
              {avisoInicio}
            </div>
          )}

          <button
            type="button"
            disabled={!ruta || preparando}
            onClick={comenzarTurno}
            style={{
              width: "100%", padding: "13px 0", borderRadius: 11, border: "none", fontWeight: 700, fontSize: 13.5,
              background: ruta ? C.busBlue : C.paperDim, color: ruta ? "#fff" : "#8993A1",
              cursor: ruta && !preparando ? "pointer" : "not-allowed",
            }}
          >
            {preparando ? "Preparando…" : ruta ? "Comenzar a validar pases" : "Selecciona una ruta"}
          </button>
        </div>
      </div>
    );
  }

  // —— Resultado a pantalla completa ——
  if (resultado) {
    const estadoInfo = ESTADOS[resultado.resultado] || ESTADOS.revocado;
    const Icon = estadoInfo.icon;
    return (
      <div
        style={{
          maxWidth: 430, margin: "0 auto", minHeight: "100vh",
          background: estadoInfo.bg, color: estadoInfo.color,
          display: "flex", flexDirection: "column",
        }}
      >
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28, textAlign: "center" }}>
          <Icon size={72} strokeWidth={2.2} />
          <div className="f-display" style={{ fontSize: 28, fontWeight: 800, marginTop: 16, letterSpacing: 0.5 }}>
            {estadoInfo.titulo}
          </div>
          <div style={{ fontSize: 14, marginTop: 8, opacity: 0.95, maxWidth: 280, lineHeight: 1.4 }}>
            {resultado.mensaje || estadoInfo.msg}
          </div>

          <div style={{ marginTop: 28, background: "rgba(255,255,255,0.15)", borderRadius: 14, padding: "14px 18px", width: "100%", maxWidth: 300, textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User size={20} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{resultado.alumno?.nombre}</div>
                <div className="f-mono" style={{ fontSize: 11, opacity: 0.85 }}>{resultado.alumno?.matricula}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, opacity: 0.9, display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
              <span>Ruta del pase</span>
              <strong>{(resultado.alumno?.rutas || [resultado.alumno?.ruta]).filter(Boolean).join(" · ") || "—"}</strong>
            </div>
            <div style={{ fontSize: 12, opacity: 0.9, display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
              <span>Viajes restantes</span>
              <strong className="f-mono">{resultado.alumno?.viajesRestantes}</strong>
            </div>
            {resultado.costoDescontado != null && (
              <div style={{ fontSize: 12, opacity: 0.9, display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
                <span>Descontado</span>
                <strong>${resultado.costoDescontado}</strong>
              </div>
            )}
            {resultado.pendiente && (
              <div style={{ marginTop: 8, fontSize: 10.5, opacity: 0.9 }}>Validado offline — se confirmará al sincronizar.</div>
            )}
          </div>
        </div>

        <div style={{ padding: "16px 24px 28px" }}>
          <button
            type="button"
            onClick={escanearSiguiente}
            style={{
              width: "100%", padding: "14px 0", borderRadius: 12, border: "2px solid rgba(255,255,255,0.5)",
              background: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <RotateCcw size={16} /> Escanear siguiente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: 640, background: C.paper }}>
      <StaffHeader title="Resultado de validación" userLabel={staff?.nombre} onLogout={salir} />

      <div style={{ padding: 18 }}>
        {error && (
          <div style={{ background: `${C.garnet}12`, border: `1px solid ${C.garnet}`, color: C.garnet, borderRadius: 9, padding: "10px 12px", fontSize: 11.5, marginBottom: 14, textAlign: "center" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 6, marginBottom: 14, background: "#fff", border: `1px solid ${C.paperDim}`, borderRadius: 10, padding: 4 }}>
          <button type="button" onClick={() => setModo("camara")} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer", background: modo === "camara" ? C.busBlue : "transparent", color: modo === "camara" ? "#fff" : C.ink, fontSize: 12, fontWeight: 700 }}>
            <Camera size={13} /> Cámara
          </button>
          <button type="button" onClick={() => setModo("manual")} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer", background: modo === "manual" ? C.busBlue : "transparent", color: modo === "manual" ? "#fff" : C.ink, fontSize: 12, fontWeight: 700 }}>
            <Keyboard size={13} /> Manual
          </button>
        </div>

        {modo === "camara" ? (
          <div style={{ textAlign: "center" }}>
            <EscanerCamara activo={modo === "camara"} onDetectado={handleDetectadoCamara} onErrorCamara={setError} />
            <p style={{ fontSize: 11.5, color: "#6b7785", marginTop: 14 }}>
              {procesando ? "Validando…" : "Apunta al QR del estudiante. Solo pasan quienes tienen esta ruta."}
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 4, fontSize: 10.5, color: "#8993A1" }}>
              <CameraOff size={11} /> ¿Falla la cámara? Usa modo Manual.
            </div>
          </div>
        ) : (
          <form onSubmit={handleValidarManual} style={{ textAlign: "center", padding: "20px 10px" }}>
            <ScanLine size={40} color={C.busBlue} style={{ marginBottom: 14, opacity: 0.5 }} />
            <p style={{ fontSize: 12, color: "#6b7785", marginBottom: 14 }}>
              Escribe la matrícula impresa en la tarjeta del estudiante.
            </p>
            <input
              value={matriculaManual}
              onChange={(e) => setMatriculaManual(e.target.value)}
              placeholder="UP240810"
              className="f-mono"
              style={{ width: "100%", border: `1px solid ${C.paperDim}`, borderRadius: 10, padding: "12px 14px", fontSize: 14, textAlign: "center", outline: "none", boxSizing: "border-box", marginBottom: 12 }}
            />
            <button type="submit" disabled={!matriculaManual.trim() || procesando} style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: C.busBlue, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {procesando ? "Validando…" : "Validar"}
            </button>
          </form>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 20, fontSize: 11, color: "#8993A1" }}>
          <ListChecks size={13} /> {contador} escaneos en este turno
        </div>
      </div>
    </div>
  );
}
