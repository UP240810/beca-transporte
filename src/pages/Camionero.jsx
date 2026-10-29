import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bus, ScanLine, CheckCircle2, XCircle, AlertTriangle, WifiOff, Wifi,
  User, RotateCcw, ListChecks, Camera, Keyboard, CameraOff,
  History, PlayCircle, FlagOff, ArrowLeft, ChevronRight, FileSpreadsheet, Clock3,
} from "lucide-react";
import { C } from "../theme";
import { StaffLayout, Btn } from "../components/GovShell";
import { useStaffSesion } from "../context/StaffSesionContext";
import api from "../api";
import { descargarExcel } from "../exportExcel";
import {
  guardarManifiesto, obtenerManifiesto, evaluarLocal, descontarLocal,
  encolarPendiente, contarPendientes,
  guardarSyncMeta, solicitarBackgroundSync, sincronizarColaConApi,
} from "../offlineQueue";

const ESTADOS = {
  valido: { color: "#fff", bg: "#1F7A56", icon: CheckCircle2, titulo: "APROBADO", msg: "Ruta correcta y con viajes disponibles." },
  "ruta-incorrecta": { color: "#fff", bg: C.garnet, icon: XCircle, titulo: "RUTA INCORRECTA", msg: "Este estudiante no tiene descuento en la ruta de este turno." },
  "sin-saldo": { color: "#fff", bg: "#B45309", icon: AlertTriangle, titulo: "SALDO INSUFICIENTE", msg: "Debe recargar en la Presidencia Municipal." },
  revocado: { color: "#fff", bg: "#6B1F2A", icon: XCircle, titulo: "PASE REVOCADO", msg: "QR invalidado o alumno dado de baja." },
  cooldown: { color: "#fff", bg: "#B45309", icon: XCircle, titulo: "ESPERA 30 MIN", msg: "Este estudiante ya viajó hace menos de media hora." },
  "pase-usado": { color: "#fff", bg: "#7A1F1F", icon: XCircle, titulo: "PASE YA USADO", msg: "Este pase ya fue utilizado. Debe mostrar el pase nuevo desde su app." },
  "no-encontrado": { color: "#fff", bg: C.garnet, icon: XCircle, titulo: "NO RECONOCIDO", msg: "No está en el manifiesto de esta ruta (offline) o no existe." },
};

const LS_ACTIVO = "camionero-recorrido-activo";
const LS_FIN_PEND = "camionero-recorridos-por-cerrar";

const leerLS = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } };
const guardarLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin storage */ } };
const borrarLS = (k) => { try { localStorage.removeItem(k); } catch { /* sin storage */ } };

function nuevaClave() {
  return `R${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
}

const fmtHora = (v) => (v ? String(v).slice(11, 16) : "—");
const fmtFecha = (v) => (v ? String(v).slice(0, 10).split("-").reverse().join("/") : "—");
const fmtFechaHora = (v) => (v ? `${fmtFecha(v)} ${fmtHora(v)}` : "—");

/** Beep corto con Web Audio — tono distinto según resultado */
function tocarSonido(resultado) {
  try {
    const tono = (freq, tipo, dur, vol, retraso = 0) => setTimeout(() => {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = tipo; osc.frequency.value = freq; gain.gain.value = vol;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.stop(ctx.currentTime + dur);
    }, retraso);
    if (resultado === "valido") { tono(880, "sine", 0.12, 0.15); tono(1175, "sine", 0.15, 0.15, 100); }
    else { tono(220, "square", 0.25, 0.15); tono(180, "square", 0.3, 0.12, 180); }
  } catch {
    // Navegadores sin Web Audio: silencioso
  }
}

function leerMatriculaSinVerificar(qrToken) {
  try {
    let payload = qrToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    while (payload.length % 4 !== 0) payload += "=";
    return JSON.parse(atob(payload)).matricula || null;
  } catch {
    return null;
  }
}

const READER_ID = "qr-reader-camionero";

/** Escáner con cámara. Detenerlo es seguro aunque aún no haya arrancado (antes tronaba al pasar a modo Manual). */
function EscanerCamara({ activo, onDetectado, onErrorCamara }) {
  const onDetectadoRef = useRef(onDetectado);
  const onErrorRef = useRef(onErrorCamara);
  onDetectadoRef.current = onDetectado;
  onErrorRef.current = onErrorCamara;

  useEffect(() => {
    if (!activo) return undefined;
    let cancelado = false;
    let scanner = null;
    let detectado = false;

    async function detener() {
      const s = scanner;
      scanner = null;
      if (!s) return;
      try {
        const estado = typeof s.getState === "function" ? s.getState() : 0;
        if (estado === 2 || estado === 3) await s.stop(); // 2 = escaneando, 3 = en pausa
      } catch { /* ya estaba detenido */ }
      try { s.clear(); } catch { /* nada que limpiar */ }
    }

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelado) return;
        scanner = new Html5Qrcode(READER_ID);
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 230, height: 230 } },
          (texto) => {
            if (detectado) return;
            detectado = true;
            onDetectadoRef.current(texto);
          },
          () => {}
        );
        if (cancelado) await detener(); // se cerró mientras arrancaba
      } catch {
        if (!cancelado) onErrorRef.current("No se pudo acceder a la cámara. Revisa permisos o usa modo manual.");
      }
    })();

    return () => { cancelado = true; detener(); };
  }, [activo]);

  return <div id={READER_ID} style={{ width: "100%", borderRadius: 16, overflow: "hidden" }} />;
}

function Tarjeta({ children, style = {} }) {
  return <div style={{ background: "#fff", border: `1px solid ${C.paperDim}`, borderRadius: 14, padding: 16, ...style }}>{children}</div>;
}

function Stat({ valor, label, bg, color }) {
  return (
    <div style={{ background: bg, borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
      <div className="f-mono" style={{ fontSize: 22, fontWeight: 800, color }}>{valor}</div>
      <div style={{ fontSize: 12, color, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

/** Resumen de una ruta (al terminarla o desde el historial) */
function ResumenRecorrido({ r, aviso, onVolver, volverLabel = "Volver" }) {
  function exportar() {
    descargarExcel(`ruta_${String(r.iniciadoEn || "").slice(0, 10)}_${r.clave}`, [{
      nombre: "Ruta",
      titulo: `Recorrido ${r.ruta?.nombre || ""}`,
      subtitulo: `Inicio: ${fmtFechaHora(r.iniciadoEn)} · Fin: ${r.terminadoEn ? fmtFechaHora(r.terminadoEn) : "en curso"}${r.unidad ? ` · Unidad ${r.unidad}` : ""}`,
      columnas: [
        { h: "Hora", k: "hora", ancho: 10 },
        { h: "Matrícula", k: "matricula", ancho: 16 },
        { h: "Estudiante", k: "nombre", ancho: 32 },
        { h: "Resultado", k: "resultado", ancho: 16 },
        { h: "100%", k: "monto100", tipo: "moneda", ancho: 12 },
        { h: "90%", k: "monto90", tipo: "moneda", ancho: 12 },
      ],
      filas: (r.detalle || []).map((d) => ({ ...d, hora: fmtHora(d.hora) })),
      totales: { monto100: r.total100, monto90: r.total90 },
    }]);
  }

  return (
    <div style={{ padding: "18px 0 28px" }}>
      <button type="button" onClick={onVolver} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: C.navy, fontWeight: 700, fontSize: 14, cursor: "pointer", padding: 0, marginBottom: 14 }}>
        <ArrowLeft size={16} /> {volverLabel}
      </button>

      <Tarjeta style={{ marginBottom: 14 }}>
        <div className="f-display" style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>{r.ruta?.nombre || "Ruta"}</div>
        <div style={{ fontSize: 13.5, color: "#5B6675", marginTop: 4, display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
          <span><Clock3 size={13} style={{ verticalAlign: -2 }} /> Inicio {fmtFechaHora(r.iniciadoEn)}</span>
          <span>{r.terminadoEn ? `Fin ${fmtFechaHora(r.terminadoEn)}` : "En curso"}</span>
          {r.unidad && <span>Unidad {r.unidad}</span>}
        </div>
      </Tarjeta>

      {aviso && (
        <div style={{ background: `${C.gold}22`, border: `1px solid ${C.gold}`, color: "#8A6114", borderRadius: 10, padding: "10px 12px", fontSize: 13, marginBottom: 14 }}>{aviso}</div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8, marginBottom: 16 }}>
        <Stat valor={r.validos} label="Válidos" bg="#E4F3EA" color="#1F7A56" />
        <Stat valor={r.rechazados} label="Rechazados" bg={`${C.garnet}15`} color={C.garnet} />
        <Stat valor={r.totalEscaneos} label="Escaneos" bg={C.paper} color={C.navy} />
        <Stat valor={`$${r.total90}`} label="Total 90%" bg={`${C.gold}22`} color="#8A6114" />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>Historial de esta ruta</div>
        <Btn variant="excel" icon={FileSpreadsheet} onClick={exportar} disabled={!r.detalle?.length} style={{ minHeight: 40, fontSize: 14, padding: "0 14px" }}>Excel</Btn>
      </div>

      {!r.detalle?.length ? (
        <div style={{ fontSize: 14, color: "#8993A1", textAlign: "center", padding: 20 }}>Sin escaneos en esta ruta.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {r.detalle.map((d, i) => (
            <div key={d.id ?? i} style={{ background: "#fff", borderRadius: 10, padding: "10px 12px", border: `1px solid ${C.paperDim}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, overflowWrap: "anywhere" }}>{d.nombre}</div>
                <div className="f-mono" style={{ fontSize: 12, color: "#8993A1" }}>{d.matricula}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, padding: "3px 9px", borderRadius: 6,
                  background: d.resultado === "valido" ? "#E4F3EA" : `${C.garnet}15`,
                  color: d.resultado === "valido" ? "#1F7A56" : C.garnet,
                }}>
                  {d.resultado === "valido" ? "Válido" : d.resultado}
                </div>
                <div style={{ fontSize: 12, color: "#8993A1", marginTop: 3 }}>{fmtHora(d.hora)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Resumen armado con lo guardado en el teléfono (cuando no hay señal al terminar) */
function resumenLocal(activo, escaneos, costos) {
  let validos = 0, rechazados = 0, total100 = 0, total90 = 0;
  const detalle = escaneos.map((e, i) => {
    if (e.resultado === "valido") { validos += 1; total100 += costos.c100; total90 += costos.c90; } else rechazados += 1;
    return { id: i, hora: e.hora, matricula: e.matricula, nombre: e.nombre, resultado: e.resultado };
  });
  return {
    clave: activo.clave,
    ruta: { id: activo.rutaId, nombre: activo.rutaNombre },
    iniciadoEn: activo.iniciadoEn, terminadoEn: new Date().toISOString().slice(0, 19).replace("T", " "),
    validos, rechazados, totalEscaneos: escaneos.length, total100, total90, detalle,
  };
}

export default function Camionero() {
  const navigate = useNavigate();
  const { staff, logout } = useStaffSesion();

  // vistas: inicio | nueva | escaneando | historial | detalle | fin
  const [vista, setVista] = useState("inicio");
  const [rutasDisponibles, setRutasDisponibles] = useState([]);
  const [ruta, setRuta] = useState("");
  const [activo, setActivo] = useState(() => leerLS(LS_ACTIVO, null)); // { clave, rutaId, rutaNombre, iniciadoEn }
  const [escaneos, setEscaneos] = useState(() => leerLS(LS_ACTIVO, null)?.escaneos || []);
  const [preparando, setPreparando] = useState(false);
  const [avisoInicio, setAvisoInicio] = useState("");

  const [enLinea, setEnLinea] = useState(navigator.onLine);
  const [forzarSinSenal, setForzarSinSenal] = useState(false);
  const offline = !enLinea || forzarSinSenal;

  const [modo, setModo] = useState("camara");
  const [matriculaManual, setMatriculaManual] = useState("");
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [pendientesSync, setPendientesSync] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);

  const [confirmarFin, setConfirmarFin] = useState(false);
  const [terminando, setTerminando] = useState(false);
  const [resumenFin, setResumenFin] = useState(null);
  const [avisoFin, setAvisoFin] = useState("");

  const [historial, setHistorial] = useState(null);
  const [cargandoHist, setCargandoHist] = useState(false);
  const [detalle, setDetalle] = useState(null);

  // reportes del chofer (se conservan del diseño anterior)
  const hoy = new Date().toISOString().slice(0, 10);
  const [repDesde, setRepDesde] = useState(hoy);
  const [repHasta, setRepHasta] = useState(hoy);
  const [rep, setRep] = useState(null);

  const rutaId = activo?.rutaId ?? null;
  const contadorTurno = escaneos.length;

  useEffect(() => { api.rutas().then(setRutasDisponibles).catch(() => {}); }, []);

  useEffect(() => {
    const on = () => setEnLinea(true);
    const off = () => setEnLinea(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  useEffect(() => {
    if (!staff?.token) return;
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
    guardarSyncMeta({ token: staff.token, apiBase }).catch(() => {});
    solicitarBackgroundSync().catch(() => {});
    contarPendientes().then(setPendientesSync).catch(() => {});
  }, [staff?.token]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return undefined;
    function onMsg(event) {
      if (event.data?.type === "SYNC_VALIDACIONES_DONE") {
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
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "FORCE_SYNC_VALIDACIONES" });
      }
      await solicitarBackgroundSync();
    } finally {
      setPendientesSync(await contarPendientes());
      setSincronizando(false);
    }
  }, [offline, sincronizando, staff.token]);

  // Al recuperar señal: sube escaneos pendientes y cierra las rutas que se terminaron sin conexión
  useEffect(() => {
    if (offline) return;
    (async () => {
      await sincronizarPendientes();
      const porCerrar = leerLS(LS_FIN_PEND, []);
      const quedan = [];
      for (const r of porCerrar) {
        try { await api.terminarRecorrido(r.clave, { rutaId: r.rutaId, iniciadoEn: r.iniciadoEn, terminadoEn: r.terminadoEn }, staff.token); }
        catch { quedan.push(r); }
      }
      if (quedan.length) guardarLS(LS_FIN_PEND, quedan); else borrarLS(LS_FIN_PEND);
    })();
  }, [offline]); // eslint-disable-line react-hooks/exhaustive-deps

  // Guarda la ruta en curso para no perderla si se recarga la página
  useEffect(() => {
    if (activo) guardarLS(LS_ACTIVO, { ...activo, escaneos });
    else borrarLS(LS_ACTIVO);
  }, [activo, escaneos]);

  function salir() { logout(); navigate("/acceso"); }

  async function cargarReporteChofer(detallado) {
    try { setRep(await api.reportesChofer(repDesde, repHasta, staff.token, detallado)); }
    catch (e) { alert(e.message); }
  }

  async function abrirHistorial() {
    setVista("historial");
    setCargandoHist(true);
    try { setHistorial(await api.recorridos(staff.token)); }
    catch (e) { setHistorial([]); setError(e.message); }
    finally { setCargandoHist(false); }
  }

  async function abrirDetalle(clave) {
    setError("");
    try { setDetalle(await api.recorrido(clave, staff.token)); setVista("detalle"); }
    catch (e) { setError(e.message); }
  }

  async function comenzarRuta() {
    setPreparando(true);
    setAvisoInicio("");
    const rutaSel = rutasDisponibles.find((r) => r.nombre === ruta);
    if (!rutaSel) { setPreparando(false); return; }
    try {
      if (!offline) {
        const apiBase = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
        await guardarSyncMeta({ token: staff.token, apiBase });
        const manifiesto = await api.manifiestoRuta(rutaSel.id, staff.token);
        await guardarManifiesto(rutaSel.id, manifiesto.alumnos);
      } else if (!(await obtenerManifiesto(rutaSel.id))) {
        setAvisoInicio("No hay copia local de esta ruta. Conéctate al menos una vez antes de iniciar sin señal.");
        setPreparando(false);
        return;
      }
      const nuevo = { clave: nuevaClave(), rutaId: rutaSel.id, rutaNombre: rutaSel.nombre, iniciadoEn: new Date().toISOString().slice(0, 19).replace("T", " "), c100: rutaSel.costo_por_viaje || 0, c90: Math.round((rutaSel.costo_por_viaje || 0) * 0.9) };
      if (!offline) api.iniciarRecorrido({ clave: nuevo.clave, rutaId: nuevo.rutaId }, staff.token).catch(() => {});
      setEscaneos([]);
      setActivo(nuevo);
      setPendientesSync(await contarPendientes());
      setResultado(null); setError(""); setModo("camara");
      setVista("escaneando");
    } catch {
      setAvisoInicio("No se pudo descargar la información de la ruta. Intenta de nuevo.");
    } finally {
      setPreparando(false);
    }
  }

  function continuarRuta() {
    setResultado(null); setError(""); setModo("camara");
    setVista("escaneando");
  }

  function mostrarResultado(data) {
    setResultado(data);
    tocarSonido(data.resultado);
    setEscaneos((lista) => [...lista, {
      hora: new Date().toISOString().slice(0, 19).replace("T", " "),
      nombre: data.alumno?.nombre || "—",
      matricula: data.alumno?.matricula || "—",
      resultado: data.resultado,
    }]);
  }

  async function procesarEscaneoOffline(qrToken, matriculaDirecta) {
    const matricula = matriculaDirecta || leerMatriculaSinVerificar(qrToken);
    if (!matricula) { setError("No se pudo leer este código sin conexión."); return; }
    // Cooldown local 30 min entre validaciones del mismo alumno
    const hace30 = Date.now() - 30 * 60 * 1000;
    const reciente = escaneos.find((e) => e.matricula === matricula && e.resultado === "valido" && Date.parse(String(e.hora).replace(" ", "T")) >= hace30);
    if (reciente) {
      mostrarResultado({
        resultado: "cooldown",
        mensaje: "Este estudiante ya fue validado hace menos de 30 minutos.",
        alumno: { nombre: reciente.nombre, matricula, ruta: activo.rutaNombre, viajesRestantes: "—" },
      });
      return;
    }
    const manifiesto = await obtenerManifiesto(rutaId);
    const { resultado: resLocal, alumno } = evaluarLocal(manifiesto, matricula);
    if (resLocal === "sin-manifiesto") { setError("No hay datos locales de esta ruta. Conéctate para descargarlos."); return; }
    if (resLocal === "valido") await descontarLocal(rutaId, matricula);

    // Solo se encolan los VÁLIDOS para sincronizar el cobro.
    // Si se rechazó offline (sin saldo / ruta), NO se envía después:
    // así no se cobra si el alumno recargó al volver la señal.
    if (resLocal === "valido") {
      await encolarPendiente({
        ...(matriculaDirecta ? { matricula: matriculaDirecta } : { qrToken }),
        rutaId,
        recorridoClave: activo.clave,
        resultadoLocal: resLocal,
        ts: new Date().toISOString(),
      });
      setPendientesSync(await contarPendientes());
    }
    const res = resLocal === "no-encontrado" ? "ruta-incorrecta" : resLocal;
    mostrarResultado({
      resultado: res,
      mensaje: ESTADOS[res]?.msg,
      pendiente: true,
      alumno: alumno
        ? { nombre: alumno.nombre, matricula: alumno.matricula, ruta: activo.rutaNombre, viajesRestantes: resLocal === "valido" ? alumno.viajesRestantes - 1 : alumno.viajesRestantes }
        : { nombre: "No identificado localmente", matricula, ruta: activo.rutaNombre, viajesRestantes: "—" },
    });
  }

  async function validarConBackend(datos) {
    setProcesando(true);
    setError("");
    try {
      mostrarResultado(await api.validar({ ...datos, rutaId, recorridoClave: activo.clave }, staff.token));
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  }

  async function handleDetectadoCamara(qrToken) {
    setError("");
    if (offline) return procesarEscaneoOffline(qrToken, null);
    return validarConBackend({ qrToken });
  }

  async function handleValidarManual(e) {
    e.preventDefault();
    if (!matriculaManual.trim()) return;
    setError("");
    if (offline) return procesarEscaneoOffline(null, matriculaManual.trim());
    return validarConBackend({ matricula: matriculaManual.trim() });
  }

  function escanearSiguiente() {
    setResultado(null); setError(""); setMatriculaManual("");
  }

  async function terminarRuta() {
    setTerminando(true);
    setError("");
    const fin = { clave: activo.clave, rutaId: activo.rutaId, iniciadoEn: activo.iniciadoEn, terminadoEn: new Date().toISOString().slice(0, 19).replace("T", " ") };
    let resumen = null;
    let aviso = "";
    if (!offline) {
      try {
        await sincronizarColaConApi(staff.token, (body, token) => api.validar(body, token));
        setPendientesSync(await contarPendientes());
        resumen = await api.terminarRecorrido(fin.clave, { rutaId: fin.rutaId, iniciadoEn: fin.iniciadoEn }, staff.token);
        if ((await contarPendientes()) > 0) aviso = "Quedan escaneos sin enviar; se sumarán a esta ruta cuando se sincronicen.";
      } catch { /* cae al resumen local */ }
    }
    if (!resumen) {
      guardarLS(LS_FIN_PEND, [...leerLS(LS_FIN_PEND, []).filter((r) => r.clave !== fin.clave), fin]);
      resumen = resumenLocal(activo, escaneos, { c100: activo.c100 || 0, c90: activo.c90 || 0 });
      aviso = "Sin conexión: esta ruta se guardó en tu teléfono y se enviará sola cuando recuperes señal.";
    }
    setResumenFin(resumen);
    setAvisoFin(aviso);
    setActivo(null);
    setEscaneos([]);
    setConfirmarFin(false);
    setTerminando(false);
    setVista("fin");
  }

  const encabezado = (titulo) => ({ title: titulo, userLabel: staff?.nombre, onLogout: salir, maxWidth: 760 });

  // —— Resultado de un escaneo a pantalla completa ——
  if (vista === "escaneando" && resultado) {
    const estadoInfo = ESTADOS[resultado.resultado] || ESTADOS.revocado;
    const Icon = estadoInfo.icon;
    return (
      <div style={{ width: "100%", margin: "0 auto", minHeight: "100vh", background: estadoInfo.bg, color: estadoInfo.color, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28, textAlign: "center" }}>
          <Icon size={72} strokeWidth={2.2} />
          <div className="f-display" style={{ fontSize: 28, fontWeight: 800, marginTop: 16, letterSpacing: 0.5 }}>{estadoInfo.titulo}</div>
          <div style={{ fontSize: 15, marginTop: 8, opacity: 0.95, maxWidth: 300, lineHeight: 1.4 }}>{resultado.mensaje || estadoInfo.msg}</div>
          <div style={{ marginTop: 28, background: "rgba(255,255,255,0.15)", borderRadius: 14, padding: "14px 18px", width: "100%", maxWidth: 320, textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}><User size={20} /></div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{resultado.alumno?.nombre}</div>
                <div className="f-mono" style={{ fontSize: 12, opacity: 0.85 }}>{resultado.alumno?.matricula}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, opacity: 0.9, display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
              <span>Ruta del pase</span>
              <strong>{(resultado.alumno?.rutas || [resultado.alumno?.ruta]).filter(Boolean).join(" · ") || "—"}</strong>
            </div>
            <div style={{ fontSize: 13, opacity: 0.9, display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
              <span>Viajes restantes</span>
              <strong className="f-mono">{resultado.alumno?.viajesRestantes}</strong>
            </div>
            {resultado.costoDescontado != null && (
              <div style={{ fontSize: 13, opacity: 0.9, display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
                <span>Descontado</span><strong>${resultado.costoDescontado}</strong>
              </div>
            )}
            {resultado.pendiente && <div style={{ marginTop: 8, fontSize: 12, opacity: 0.9 }}>Validado offline — se confirmará al sincronizar.</div>}
          </div>
        </div>
        <div style={{ padding: "16px 24px 28px" }}>
          <button type="button" onClick={escanearSiguiente} style={{ width: "100%", minHeight: 52, borderRadius: 12, border: "2px solid rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <RotateCcw size={17} /> Escanear siguiente
          </button>
        </div>
      </div>
    );
  }

  // —— Escaneando ——
  if (vista === "escaneando" && activo) {
    return (
      <StaffLayout {...encabezado("Ruta en curso")}>
        <div style={{ padding: "18px 0 28px" }}>
          <Tarjeta style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, color: "#8993A1", fontWeight: 600 }}>RUTA</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, overflowWrap: "anywhere" }}>{activo.rutaNombre}</div>
              <div style={{ fontSize: 12.5, color: "#6b7785", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                {offline ? <WifiOff size={13} color={C.garnet} /> : <Wifi size={13} color="#1F7A56" />}
                {offline ? "Sin señal" : "Con señal"}
                {pendientesSync > 0 && <span> · {pendientesSync} por enviar</span>}
              </div>
            </div>
            <Btn variant="danger" icon={FlagOff} onClick={() => setConfirmarFin(true)} style={{ minHeight: 44, fontSize: 15 }}>Terminar ruta</Btn>
          </Tarjeta>

          {error && (
            <div style={{ background: `${C.garnet}12`, border: `1px solid ${C.garnet}`, color: C.garnet, borderRadius: 9, padding: "10px 12px", fontSize: 13, marginBottom: 14, textAlign: "center" }}>{error}</div>
          )}

          <div style={{ display: "flex", gap: 6, marginBottom: 14, background: "#fff", border: `1px solid ${C.paperDim}`, borderRadius: 10, padding: 4 }}>
            {[["camara", Camera, "Cámara"], ["manual", Keyboard, "Manual"]].map(([k, Ico, lab]) => (
              <button key={k} type="button" onClick={() => { setError(""); setModo(k); }} style={{ flex: 1, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 8, border: "none", cursor: "pointer", background: modo === k ? C.busBlue : "transparent", color: modo === k ? "#fff" : C.ink, fontSize: 14, fontWeight: 700 }}>
                <Ico size={15} /> {lab}
              </button>
            ))}
          </div>

          {modo === "camara" ? (
            <div style={{ textAlign: "center" }}>
              <EscanerCamara activo onDetectado={handleDetectadoCamara} onErrorCamara={setError} />
              <p style={{ fontSize: 13.5, color: "#6b7785", marginTop: 14 }}>
                {procesando ? "Validando…" : "Apunta al QR del estudiante. Solo pasan quienes tienen esta ruta."}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 4, fontSize: 12.5, color: "#8993A1" }}>
                <CameraOff size={13} /> ¿Falla la cámara? Usa modo Manual.
              </div>
            </div>
          ) : (
            <form onSubmit={handleValidarManual} style={{ textAlign: "center", padding: "20px 10px" }}>
              <ScanLine size={40} color={C.busBlue} style={{ marginBottom: 14, opacity: 0.5 }} />
              <p style={{ fontSize: 14, color: "#6b7785", marginBottom: 14 }}>Escribe la matrícula impresa en la tarjeta del estudiante.</p>
              <input
                value={matriculaManual}
                onChange={(e) => setMatriculaManual(e.target.value)}
                placeholder="UP240810"
                className="f-mono"
                style={{ width: "100%", maxWidth: 360, border: `1px solid ${C.paperDim}`, borderRadius: 10, padding: "12px 14px", fontSize: 16, textAlign: "center", outline: "none", boxSizing: "border-box", marginBottom: 12 }}
              />
              <div>
                <Btn type="submit" variant="accent" disabled={!matriculaManual.trim() || procesando} style={{ width: "100%", maxWidth: 360 }}>
                  {procesando ? "Validando…" : "Validar"}
                </Btn>
              </div>
            </form>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 20, fontSize: 13, color: "#8993A1" }}>
            <ListChecks size={14} /> {contadorTurno} escaneos en esta ruta
          </div>
        </div>

        {confirmarFin && (
          <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,26,51,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: "#fff", borderRadius: 14, padding: 22, width: "100%", maxWidth: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
              <div className="f-display" style={{ fontSize: 19, fontWeight: 800, color: C.navy, marginBottom: 6 }}>¿Terminar la ruta?</div>
              <p style={{ fontSize: 14, color: "#5B6675", lineHeight: 1.5, marginTop: 0 }}>
                Llevas <strong>{contadorTurno}</strong> escaneos en <strong>{activo.rutaNombre}</strong>. Al terminar verás el historial completo de esta ruta.
                {offline && " Estás sin señal: se guardará en tu teléfono y se enviará al reconectar."}
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <Btn variant="ghost" onClick={() => setConfirmarFin(false)} disabled={terminando} style={{ flex: 1 }}>Seguir</Btn>
                <Btn variant="danger" onClick={terminarRuta} disabled={terminando} style={{ flex: 1 }}>{terminando ? "Cerrando…" : "Sí, terminar"}</Btn>
              </div>
            </div>
          </div>
        )}
      </StaffLayout>
    );
  }

  // —— Resumen al terminar la ruta ——
  if (vista === "fin" && resumenFin) {
    return (
      <StaffLayout {...encabezado("Ruta terminada")}>
        <div style={{ textAlign: "center", paddingTop: 20 }}>
          <div style={{ width: 54, height: 54, borderRadius: "50%", background: "#E4F3EA", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={28} color="#1F7A56" /></div>
          <div className="f-display" style={{ fontSize: 20, fontWeight: 800, color: C.navy, marginTop: 8 }}>¡Ruta terminada!</div>
        </div>
        <ResumenRecorrido r={resumenFin} aviso={avisoFin} onVolver={() => { setResumenFin(null); setVista("inicio"); }} volverLabel="Volver al inicio" />
      </StaffLayout>
    );
  }

  // —— Detalle de una ruta anterior ——
  if (vista === "detalle" && detalle) {
    return (
      <StaffLayout {...encabezado("Detalle de ruta")}>
        <ResumenRecorrido r={detalle} onVolver={() => setVista("historial")} volverLabel="Volver a viajes anteriores" />
      </StaffLayout>
    );
  }

  // —— Viajes anteriores ——
  if (vista === "historial") {
    return (
      <StaffLayout {...encabezado("Viajes anteriores")}>
        <div style={{ padding: "18px 0 28px" }}>
          <button type="button" onClick={() => { setError(""); setVista("inicio"); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: C.navy, fontWeight: 700, fontSize: 14, cursor: "pointer", padding: 0, marginBottom: 14 }}>
            <ArrowLeft size={16} /> Volver
          </button>
          {error && <div style={{ color: C.garnet, fontSize: 13, marginBottom: 10 }}>{error}</div>}
          {cargandoHist ? (
            <div style={{ fontSize: 14, color: "#8993A1" }}>Cargando…</div>
          ) : !historial?.length ? (
            <Tarjeta style={{ textAlign: "center", color: "#8993A1", fontSize: 14 }}>Aún no tienes rutas registradas.</Tarjeta>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {historial.map((h) => (
                <button key={h.clave} type="button" onClick={() => abrirDetalle(h.clave)} style={{ textAlign: "left", background: "#fff", border: `1px solid ${C.paperDim}`, borderRadius: 12, padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, overflowWrap: "anywhere" }}>{h.ruta?.nombre || "Ruta"}</div>
                    <div style={{ fontSize: 12.5, color: "#6b7785", marginTop: 2 }}>
                      {fmtFechaHora(h.iniciadoEn)} → {h.terminadoEn ? fmtHora(h.terminadoEn) : "en curso"}
                    </div>
                    <div style={{ fontSize: 12.5, marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ color: "#1F7A56", fontWeight: 700 }}>{h.validos} válidos</span>
                      {h.rechazados > 0 && <span style={{ color: C.garnet, fontWeight: 700 }}>{h.rechazados} rechazados</span>}
                      <span style={{ color: "#8A6114", fontWeight: 700 }}>${h.total90} (90%)</span>
                    </div>
                  </div>
                  <ChevronRight size={18} color="#8993A1" style={{ flexShrink: 0 }} />
                </button>
              ))}
            </div>
          )}
        </div>
      </StaffLayout>
    );
  }

  // —— Elegir ruta para empezar ——
  if (vista === "nueva") {
    return (
      <StaffLayout {...encabezado("Empezar ruta nueva")}>
        <div style={{ padding: "18px 0 28px", maxWidth: 560, margin: "0 auto" }}>
          <button type="button" onClick={() => { setAvisoInicio(""); setVista("inicio"); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: C.navy, fontWeight: 700, fontSize: 14, cursor: "pointer", padding: 0, marginBottom: 14 }}>
            <ArrowLeft size={16} /> Volver
          </button>
          <p style={{ fontSize: 14, color: "#6b7785", marginTop: 0, marginBottom: 16, lineHeight: 1.45 }}>
            Elige la ruta que vas a cubrir. Solo se aceptarán estudiantes con <strong>esa ruta asignada</strong> por Desarrollo Social.
          </p>

          <div style={{ marginBottom: 16 }}>
            {rutasDisponibles.length === 0 ? (
              <div style={{ fontSize: 14, color: "#8993A1" }}>Cargando rutas del catálogo…</div>
            ) : rutasDisponibles.map((r) => (
              <button key={r.id} type="button" onClick={() => setRuta(r.nombre)} style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", borderRadius: 11, marginBottom: 8, cursor: "pointer", border: `1.5px solid ${ruta === r.nombre ? C.busBlue : C.paperDim}`, background: ruta === r.nombre ? `${C.busBlue}0F` : "#fff" }}>
                <Bus size={17} color={ruta === r.nombre ? C.busBlue : "#8993A1"} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: ruta === r.nombre ? C.navy : C.ink }}>
                    {r.codigo ? <span className="f-mono" style={{ color: C.busBlue, marginRight: 6 }}>{r.codigo}</span> : null}{r.nombre}
                  </div>
                  <div style={{ fontSize: 12, color: "#8993A1" }}>${r.costo_por_viaje} por viaje · {r.descuento_pct}% desc.</div>
                </div>
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.paper, border: `1px solid ${C.paperDim}`, borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              {offline ? <WifiOff size={15} color={C.garnet} /> : <Wifi size={15} color="#1F7A56" />}
              <span style={{ fontSize: 13.5, color: C.ink }}>{!enLinea ? "Sin conexión real" : forzarSinSenal ? "Sin señal (simulado)" : "Con señal"}</span>
            </div>
            <button type="button" onClick={() => setForzarSinSenal((o) => !o)} style={{ fontSize: 12.5, color: C.busBlue, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>simular</button>
          </div>

          {avisoInicio && (
            <div style={{ background: `${C.garnet}12`, border: `1px solid ${C.garnet}`, color: C.garnet, borderRadius: 9, padding: "10px 12px", fontSize: 13, marginBottom: 14 }}>{avisoInicio}</div>
          )}

          <Btn variant="accent" onClick={comenzarRuta} disabled={!ruta || preparando} style={{ width: "100%" }}>
            {preparando ? "Preparando…" : ruta ? "Comenzar a validar pases" : "Selecciona una ruta"}
          </Btn>
        </div>
      </StaffLayout>
    );
  }

  // —— Inicio: dos opciones ——
  const opcion = (Icon, titulo, desc, onClick, destacado) => (
    <button type="button" onClick={onClick} style={{ textAlign: "left", display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "18px 18px", borderRadius: 14, cursor: "pointer", border: destacado ? "none" : `1.5px solid ${C.paperDim}`, background: destacado ? C.busBlue : "#fff", color: destacado ? "#fff" : C.navy, boxShadow: "0 2px 10px rgba(0,51,102,0.08)" }}>
      <span style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: destacado ? "rgba(255,255,255,0.2)" : `${C.navy}12` }}><Icon size={26} /></span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 18, fontWeight: 800 }}>{titulo}</span>
        <span style={{ display: "block", fontSize: 13.5, opacity: 0.85, marginTop: 2 }}>{desc}</span>
      </span>
    </button>
  );

  return (
    <StaffLayout {...encabezado("Chofer")}>
      <div style={{ padding: "22px 0 32px", maxWidth: 560, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div className="f-display" style={{ fontSize: 22, fontWeight: 800, color: C.navy }}>¡Hola{staff?.nombre ? `, ${staff.nombre.split(" ")[0]}` : ""}!</div>
          <div style={{ fontSize: 14, color: "#6b7785", marginTop: 4 }}>¿Qué quieres hacer?</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {activo && opcion(PlayCircle, "Continuar ruta en curso", `${activo.rutaNombre} · ${escaneos.length} escaneos`, continuarRuta, true)}
          {opcion(Bus, "Empezar ruta nueva", activo ? "Primero termina la ruta en curso" : "Elige la ruta y empieza a validar pases", () => (activo ? continuarRuta() : setVista("nueva")), !activo)}
          {opcion(History, "Ver viajes anteriores", "Historial de las rutas que ya hiciste", abrirHistorial, false)}
        </div>

        {pendientesSync > 0 && (
          <div style={{ marginTop: 16, fontSize: 13, color: "#8A6114", background: `${C.gold}22`, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
            {pendientesSync} escaneo(s) por enviar — se subirán cuando haya señal.
          </div>
        )}

        <Tarjeta style={{ marginTop: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 10 }}>Reporte de viajes</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
            <label style={{ fontSize: 13, color: "#5b6675", fontWeight: 600 }}>Desde
              <input type="date" value={repDesde} onChange={(e) => setRepDesde(e.target.value)} style={{ display: "block", marginTop: 4, minHeight: 44, padding: "0 10px", borderRadius: 9, border: `1px solid ${C.paperDim}`, fontSize: 15 }} />
            </label>
            <label style={{ fontSize: 13, color: "#5b6675", fontWeight: 600 }}>Hasta
              <input type="date" value={repHasta} onChange={(e) => setRepHasta(e.target.value)} style={{ display: "block", marginTop: 4, minHeight: 44, padding: "0 10px", borderRadius: 9, border: `1px solid ${C.paperDim}`, fontSize: 15 }} />
            </label>
            <Btn onClick={() => cargarReporteChofer(false)} style={{ minHeight: 44, fontSize: 14 }}>Sencillo (90%)</Btn>
            <Btn variant="accent" onClick={() => cargarReporteChofer(true)} style={{ minHeight: 44, fontSize: 14 }}>Detallado</Btn>
          </div>
          {rep && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 14 }}>Viajes: <b>{rep.viajes}</b> · Total 90%: <b>${rep.total90}</b>
                {rep.total100 != null && <> · Boleto 100%: <b>${rep.total100}</b></>}
              </div>
              {rep.filas?.length > 0 ? (
                <>
                  <div style={{ marginTop: 12, border: `1px solid ${C.paperDim}`, borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ maxHeight: 320, overflowY: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                        <thead>
                          <tr style={{ background: C.navy, color: "#fff", textAlign: "left" }}>
                            <th style={{ padding: "8px 10px", fontWeight: 600 }}>Fecha</th>
                            <th style={{ padding: "8px 10px", fontWeight: 600 }}>Estudiante</th>
                            <th style={{ padding: "8px 10px", fontWeight: 600 }}>Ruta</th>
                            <th style={{ padding: "8px 10px", fontWeight: 600, textAlign: "right" }}>90%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rep.filas.map((f, i) => (
                            <tr key={i} style={{ borderTop: `1px solid ${C.paperDim}`, background: i % 2 ? "#F8FAFC" : "#fff" }}>
                              <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }} className="f-mono">{String(f.fecha).slice(0, 16)}</td>
                              <td style={{ padding: "8px 10px" }}>
                                <div style={{ fontWeight: 600, color: C.navy }}>{f.nombre || "—"}</div>
                                <div className="f-mono" style={{ fontSize: 11, color: "#8993A1" }}>{f.idEstudiante || f.matricula || "—"}}</div>
                              </td>
                              <td style={{ padding: "8px 10px" }}>{f.ruta || "—"}</td>
                              <td style={{ padding: "8px 10px", textAlign: "right" }} className="f-mono">${f.costo90 ?? 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <Btn variant="excel" icon={FileSpreadsheet} style={{ minHeight: 40, fontSize: 14, marginTop: 10 }} onClick={() => descargarExcel(`reporte_chofer_${rep.desde}_a_${rep.hasta}`, [{
                    nombre: "Viajes",
                    titulo: `Reporte de viajes ${rep.desde} → ${rep.hasta}`,
                    columnas: [
                      { h: "Fecha", k: "fecha", ancho: 18 }, { h: "No. estudiante", k: "idEstudiante", ancho: 16 }, { h: "Estudiante", k: "nombre", ancho: 30 },
                      { h: "Unidad", k: "unidad", ancho: 10 }, { h: "ID Viaje", k: "idViaje", tipo: "numero", ancho: 10 }, { h: "Ruta", k: "ruta", ancho: 32 }, { h: "90%", k: "costo90", tipo: "moneda", ancho: 12 },
                    ],
                    filas: rep.filas.map((f) => ({ ...f, fecha: String(f.fecha).slice(0, 16), unidad: f.unidad || "—" })),
                    totales: { costo90: rep.total90 },
                  }])}>Exportar a Excel (opcional)</Btn>
                </>
              ) : (
                <div style={{ marginTop: 10, fontSize: 13, color: "#8993A1" }}>No hay viajes en ese rango de fechas.</div>
              )}
            </div>
          )}
        </Tarjeta>
      </div>
    </StaffLayout>
  );
}
