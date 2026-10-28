const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error("No se pudo conectar con el servidor. Revisa tu conexión.");
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // respuesta sin cuerpo
  }

  if (!res.ok) {
    throw new Error((data && data.error) || `Error del servidor (${res.status}).`);
  }
  return data;
}

async function descargarArchivo(path, token, nombreArchivo) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    throw new Error("No se pudo conectar con el servidor. Revisa tu conexión.");
  }
  if (!res.ok) {
    let data = null;
    try { data = await res.json(); } catch {}
    throw new Error((data && data.error) || `Error del servidor (${res.status}).`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const api = {
  // Auth
  alumnoLogin: (usuario, password) => request("/auth/alumno/login", { method: "POST", body: { usuario, password } }),
  recuperarPassword: (usuario) =>
    request("/auth/recuperar", { method: "POST", body: { usuario } }),
  restablecerPassword: (token, password) =>
    request("/auth/restablecer", { method: "POST", body: { token, password } }),
  staffLogin: (usuario, password, rol) => request("/auth/staff/login", { method: "POST", body: { usuario, password, rol } }),
  listarPersonal: (token) => request("/personal", { token }),
  crearPersonal: (datos, token) => request("/personal", { method: "POST", body: datos, token }),
  setPersonalActivo: (id, activo, token) =>
    request(`/personal/${id}/activo`, { method: "PATCH", body: { activo }, token }),
  resetPasswordPersonal: (id, token) =>
    request(`/personal/${id}/reset-password`, { method: "POST", body: {}, token }),

  // Rutas
  rutas: () => request("/rutas"),
  crearRuta: (datos, token) => request("/rutas", { method: "POST", body: datos, token }),
  manifiestoRuta: (rutaId, token) => request(`/rutas/${rutaId}/manifiesto`, { token }),

  // Solicitudes
  crearSolicitud: (datos) => request("/solicitudes", { method: "POST", body: datos }),
  solicitudes: (estado, token) => request(`/solicitudes?estado=${encodeURIComponent(estado)}`, { token }),
  solicitudDetalle: (folio, token) =>
    request(`/solicitudes/${encodeURIComponent(folio)}`, { token }),
  // aprobar ahora recibe rutasAsignadas: [{ rutaId }] | [{ nombre, costo_por_viaje?, descuento_pct? }]
  aprobarSolicitud: (folio, rutasAsignadas, token) =>
    request(`/solicitudes/${encodeURIComponent(folio)}/aprobar`, {
      method: "POST",
      body: { rutasAsignadas },
      token,
    }),
  corregirSolicitud: (folio, motivo, token) =>
    request(`/solicitudes/${encodeURIComponent(folio)}/corregir`, { method: "POST", body: { motivo }, token }),
  descargarDocumentoSolicitud: (folio, id, token) =>
    request(`/solicitudes/${encodeURIComponent(folio)}/documentos/${id}`, { token }),
  rechazarSolicitud: (folio, motivo, token) =>
    request(`/solicitudes/${encodeURIComponent(folio)}/rechazar`, { method: "POST", body: { motivo }, token }),

  // Alumno
  alumnoMe: (token) => request("/alumno/me", { token }),
  alumnoHistorial: (token, limit = 50) =>
    request(`/alumno/historial?limit=${limit}`, { token }),
  // descargable=true: pase de un solo uso para guardar como PNG (solo se emite con saldo)
  qrToken: (token, descargable = false) => request(`/alumno/qr-token${descargable ? "?descargable=1" : ""}`, { token }),
  credencialQr: (token) => request("/alumno/credencial-qr", { token }),

  // Recargas (ventanilla)
  buscarAlumnos: (q, token) => request(`/recargas/buscar?q=${encodeURIComponent(q)}`, { token }),
  fichaAlumnoRecarga: (matricula, token) =>
    request(`/recargas/alumno/${encodeURIComponent(matricula)}`, { token }),
  alumnoPorQr: (qrToken, token) =>
    request("/recargas/por-qr", { method: "POST", body: { qrToken }, token }),
  // viajes O monto (el backend resuelve)
  registrarRecarga: (datos, token) =>
    request("/recargas", { method: "POST", body: datos, token }),
  recargasHoy: (token) => request("/recargas/hoy", { token }),

  // Recorridos del camionero (empezar / terminar ruta, historial)
  iniciarRecorrido: (datos, token) => request("/recorridos", { method: "POST", body: datos, token }),
  terminarRecorrido: (clave, datos, token) =>
    request(`/recorridos/${encodeURIComponent(clave)}/terminar`, { method: "POST", body: datos || {}, token }),
  recorridos: (token, limit = 30) => request(`/recorridos?limit=${limit}`, { token }),
  recorrido: (clave, token) => request(`/recorridos/${encodeURIComponent(clave)}`, { token }),

  // Validaciones (camionero)
  validar: (datos, token) => request("/validaciones", { method: "POST", body: datos, token }),
  validacionesHoy: (token) => request("/validaciones/hoy", { token }),
  resumenValidaciones: (fecha, token) =>
    request(fecha ? `/validaciones/resumen?fecha=${encodeURIComponent(fecha)}` : "/validaciones/resumen", { token }),

  // Alumnos (gestión, Recaudación)
  listarAlumnos: (token) => request("/alumnos", { token }),
  altaManualAlumno: (datos, token) => request("/alumnos", { method: "POST", body: datos, token }),
  revocarQrAlumno: (matricula, token) =>
    request(`/alumnos/${encodeURIComponent(matricula)}/revocar-qr`, { method: "POST", token }),
  bajaAlumno: (matricula, token) =>
    request(`/alumnos/${encodeURIComponent(matricula)}/baja`, { method: "POST", token }),
  reactivarAlumno: (matricula, token) =>
    request(`/alumnos/${encodeURIComponent(matricula)}/reactivar`, { method: "POST", token }),
  exportarAlumnos: (token) => descargarArchivo("/alumnos/exportar", token, `alumnos_${new Date().toISOString().slice(0, 10)}.csv`),
  exportarBeneficiarios: (token) =>
    descargarArchivo("/alumnos/exportar-beneficiarios", token, `registro_beneficiarios_${new Date().toISOString().slice(0, 10)}.csv`),
  exportarCortesBoletos: (desde, hasta, token) =>
    descargarArchivo(`/recargas/cortes?desde=${desde}&hasta=${hasta}`, token, `cortes_boletos_${desde}_a_${hasta}.csv`),
  exportarRecargas: (desde, hasta, token) =>
    descargarArchivo(`/recargas/reporte?desde=${desde}&hasta=${hasta}`, token, `recargas_${desde}_a_${hasta}.csv`),

  // FAQ / bugs
  reportarBug: (datos) => request("/bugs", { method: "POST", body: datos }),
  listarBugs: (token, estado) =>
    request(estado ? `/bugs?estado=${encodeURIComponent(estado)}` : "/bugs", { token }),
  actualizarBug: (id, estado, token) =>
    request(`/bugs/${id}`, { method: "PATCH", body: { estado }, token }),


  // Admin transportistas
  filtrosTransportistas: (token) => request("/reportes/filtros-transportistas", { token }),
  reportesTransportistas: (desde, hasta, token, extra = {}) => {
    const q = new URLSearchParams({ desde, hasta });
    if (extra.choferId) q.set("choferId", extra.choferId);
    if (extra.unidadId) q.set("unidadId", extra.unidadId);
    return request(`/reportes/transportistas?${q.toString()}`, { token });
  },

  // Reportes
  reportesRecargas: (desde, hasta, token) =>
    request(`/reportes/recargas?desde=${desde}&hasta=${hasta}`, { token }),
  reportesBeneficiario: (matricula, desde, hasta, token) =>
    request(`/reportes/beneficiario/${encodeURIComponent(matricula)}?desde=${desde}&hasta=${hasta}`, { token }),
  reportesViajesMensual: (mes, token) =>
    request(`/reportes/viajes-mensual?mes=${encodeURIComponent(mes)}`, { token }),
  reportesChofer: (desde, hasta, token, detallado = false) =>
    request(`/reportes/chofer?desde=${desde}&hasta=${hasta}${detallado ? "&detallado=1" : ""}`, { token }),

  // Ventanilla: devoluciones y ficha por matrícula
  devolucion: (datos, token) => request("/recargas/devolucion", { method: "POST", body: datos, token }),
  alumnoPorMatricula: (matricula, token) =>
    request(`/recargas/alumno/${encodeURIComponent(matricula)}`, { token }),

  // Pase de un solo uso (alumno)
  paseEstado: (jti, token) => request(`/alumno/pase-estado/${encodeURIComponent(jti)}`, { token }),

  // Contabilidad
  contabilidadResumen: (desde, hasta, token) =>
    request(`/contabilidad/resumen?desde=${desde}&hasta=${hasta}`, { token }),
  exportarContabilidadRecargas: (desde, hasta, token) =>
    descargarArchivo(`/contabilidad/recargas.csv?desde=${desde}&hasta=${hasta}`, token, `contabilidad_recargas_${desde}_a_${hasta}.csv`),
  exportarContabilidadViajes: (desde, hasta, token) =>
    descargarArchivo(`/contabilidad/viajes.csv?desde=${desde}&hasta=${hasta}`, token, `contabilidad_viajes_${desde}_a_${hasta}.csv`),
};

export default api;