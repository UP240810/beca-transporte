/* eslint-disable no-restricted-globals */
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { clientsClaim } from "workbox-core";

clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

const DB_NAME = "keyval-store";
const STORE = "keyval";
const CLAVE_PENDIENTES = "pendientes-sync";
const CLAVE_SYNC_META = "camionero-sync-meta";
const SYNC_TAG = "sync-validaciones";

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
  });
}

function idbGet(key) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

function idbSet(key, value) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        const req = tx.objectStore(STORE).put(value, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      })
  );
}

async function syncPendientes() {
  const meta = await idbGet(CLAVE_SYNC_META);
  if (!meta || !meta.token || !meta.apiBase) {
    console.log("[sw] Sin meta de sync (token/api); se reintentará después.");
    return;
  }

  let pendientes = (await idbGet(CLAVE_PENDIENTES)) || [];
  if (!pendientes.length) return;

  const restantes = [];
  for (const item of pendientes) {
    try {
      const body = { rutaId: item.rutaId };
      if (item.qrToken) body.qrToken = item.qrToken;
      if (item.matricula) body.matricula = item.matricula;

      const res = await fetch(`${meta.apiBase}/validaciones`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${meta.token}`,
        },
        body: JSON.stringify(body),
      });

      // 2xx o 4xx de negocio (ya procesado / sin saldo) → sacar de la cola
      // 5xx o red → dejar para reintento
      if (res.status >= 500) {
        restantes.push(item);
        continue;
      }
      // ok: descartar
    } catch {
      restantes.push(item);
    }
  }

  await idbSet(CLAVE_PENDIENTES, restantes);

  // Avisar a ventanas abiertas para refrescar contador
  const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of clientsList) {
    client.postMessage({
      type: "SYNC_VALIDACIONES_DONE",
      restantes: restantes.length,
    });
  }
}

self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(syncPendientes());
  }
});

// Sync manual si la página lo pide
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "FORCE_SYNC_VALIDACIONES") {
    event.waitUntil(syncPendientes());
  }
});
