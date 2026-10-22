import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api";

const SesionContext = createContext(null);

export function SesionProvider({ children }) {
  // El token se guarda en localStorage para que la sesión sobreviva a un
  // refresh de página — es una app real, no un artifact aislado.
  const [token, setToken] = useState(() => localStorage.getItem("alumno_token"));
  const [alumno, setAlumno] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!token) {
      setCargando(false);
      return;
    }
    api.alumnoMe(token)
      .then(setAlumno)
      .catch(() => {
        // token expirado o inválido — se limpia la sesión
        localStorage.removeItem("alumno_token");
        setToken(null);
        setAlumno(null);
      })
      .finally(() => setCargando(false));
  }, [token]);

  async function login(usuario, password) {
    const { token: nuevoToken } = await api.alumnoLogin(usuario, password);
    localStorage.setItem("alumno_token", nuevoToken);
    setToken(nuevoToken);
    const datos = await api.alumnoMe(nuevoToken);
    setAlumno(datos);
    return datos;
  }

  function logout() {
    localStorage.removeItem("alumno_token");
    setToken(null);
    setAlumno(null);
  }

  async function refrescar() {
    if (!token) return null;
    try {
      const datos = await api.alumnoMe(token);
      setAlumno(datos);
      return datos;
    } catch {
      return null;
    }
  }

  return <SesionContext.Provider value={{ alumno, token, login, logout, cargando, refrescar }}>{children}</SesionContext.Provider>;
}

export function useSesion() {
  const ctx = useContext(SesionContext);
  if (!ctx) throw new Error("useSesion debe usarse dentro de <SesionProvider>");
  return ctx;
}
