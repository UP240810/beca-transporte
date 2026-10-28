import { get, set, del } from "idb-keyval";

/*
 * Offline real para el camionero (La Labor / Presa de los Serna).
 *
 * 1. Al iniciar turno CON señal → manifiesto de la ruta en IndexedDB.
 * 2. Sin señal → validación local + cola de pendientes.
 * 3. Al recuperar señal (app abierta) → sync desde Camionero.jsx.
 * 4. Con app cerrada → Background Sync del Service Worker (Chrome/Edge/Android)
 *    usando el tag `sync-validaciones`. Safari/Firefox usan el fallback del punto 3.
 */

const CLAVE_MANIFIESTO = (rutaId) => `manifiesto:${rutaId}`;
const CLAVE_PENDIENTES = "pendientes-sync";
/** Token + API base para que el Service Worker sincronice sin la UI abierta */
export const CLAVE_SYNC_META = "camionero-sync-meta";
export const SYNC_TAG = "sync-validaciones";

export async function guardarManifiesto(rutaId, alumnos) {
  await set(CLAVE_MANIFIESTO(rutaId), { alumnos, guardadoEn: new Date().toISOString() });
}

export async function obtenerManifiesto(rutaId) {
  return (await get(CLAVE_MANIFIESTO(rutaId))) || null;
}

export function evaluarLocal(manifiesto, matricula) {
  if (!manifiesto) return { resultado: "sin-manifiesto", alumno: null };
  const alumno = manifiesto.alumnos.find((a) => a.matricula === matricula);
  if (!alumno) return { resultado: "ruta-incorrecta", alumno: null };
  if (alumno.viajesRestantes <= 0) return { resultado: "sin-saldo", alumno };
  return { resultado: "valido", alumno };
}

export async function descontarLocal(rutaId, matricula) {
  const manifiesto = await obtenerManifiesto(rutaId);
  if (!manifiesto) return;
  manifiesto.alumnos = manifiesto.alumnos.map((a) =>
    a.matricula === matricula ? { ...a, viajesRestantes: Math.max(0, a.viajesRestantes - 1) } : a
  );
  await set(CLAVE_MANIFIESTO(rutaId), manifiesto);
}

export async function guardarSyncMeta({ token, apiBase }) {
  if (!token) return;
  await set(CLAVE_SYNC_META, {
    token,
    apiBase: apiBase || "http://localhost:4000/api",
    actualizadoEn: new Date().toISOString(),
  });
}

export async function obtenerSyncMeta() {
  return (await get(CLAVE_SYNC_META)) || null;
}

export async function encolarPendiente(evento) {
  const pendientes = (await get(CLAVE_PENDIENTES)) || [];
  pendientes.push({
    ...evento,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    encoladoEn: new Date().toISOString(),
  });
  await set(CLAVE_PENDIENTES, pendientes);
  await solicitarBackgroundSync();
  return pendientes.length;
}

export async function listarPendientes() {
  return (await get(CLAVE_PENDIENTES)) || [];
}

export async function contarPendientes() {
  const pendientes = await listarPendientes();
  return pendientes.length;
}

export async function quitarPendiente(id) {
  const pendientes = (await get(CLAVE_PENDIENTES)) || [];
  await set(CLAVE_PENDIENTES, pendientes.filter((p) => p.id !== id));
}

export async function limpiarPendientes() {
  await del(CLAVE_PENDIENTES);
}

/**
 * Registra Background Sync si el navegador lo soporta.
 * No falla en Safari/Firefox: solo no sincroniza con la app cerrada.
 */
export async function solicitarBackgroundSync() {
  try {
    if (!("serviceWorker" in navigator)) return { ok: false, motivo: "sin-sw" };
    const reg = await navigator.serviceWorker.ready;
    if (!reg.sync) return { ok: false, motivo: "sin-background-sync" };
    await reg.sync.register(SYNC_TAG);
    return { ok: true };
  } catch (err) {
    console.warn("[offline] No se pudo registrar Background Sync:", err?.message || err);
    return { ok: false, motivo: err?.message || "error" };
  }
}

/**
 * Sincroniza la cola en el hilo de la página (fallback cuando la app está abierta).
 * Usado por Camionero.jsx al recuperar conexión.
 */
export async function sincronizarColaConApi(token, apiValidar) {
  const pendientes = await listarPendientes();
  let ok = 0;
  let fallidos = 0;
  for (const item of pendientes) {
    try {
      const body = { rutaId: item.rutaId };
      if (item.qrToken) body.qrToken = item.qrToken;
      if (item.matricula) body.matricula = item.matricula;
      if (item.ts) body.escaneadoEn = item.ts;
      await apiValidar(body, token);
      await quitarPendiente(item.id);
      ok += 1;
    } catch {
      fallidos += 1;
    }
  }
  return { ok, fallidos, restantes: await contarPendientes() };
}
