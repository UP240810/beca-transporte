import React, { createContext, useContext, useState } from "react";
import api from "../api";

const StaffSesionContext = createContext(null);

function leerSesionGuardada() {
  const token = localStorage.getItem("staff_token");
  const rol = localStorage.getItem("staff_rol");
  const nombre = localStorage.getItem("staff_nombre");
  const usuario = localStorage.getItem("staff_usuario");
  const esJefe = localStorage.getItem("staff_es_jefe") === "1";
  return token && rol ? { token, rol, nombre, usuario, esJefe } : null;
}

export function StaffSesionProvider({ children }) {
  const [staff, setStaff] = useState(leerSesionGuardada);

  async function login(rol, usuario, password) {
    const data = await api.staffLogin(usuario, password, rol);
    const sesion = {
      token: data.token,
      rol: data.rol,
      nombre: data.nombre,
      usuario,
      esJefe: !!data.esJefe,
    };
    localStorage.setItem("staff_token", sesion.token);
    localStorage.setItem("staff_rol", sesion.rol);
    localStorage.setItem("staff_nombre", sesion.nombre);
    localStorage.setItem("staff_usuario", sesion.usuario);
    localStorage.setItem("staff_es_jefe", sesion.esJefe ? "1" : "0");
    setStaff(sesion);
    return sesion;
  }

  function logout() {
    localStorage.removeItem("staff_token");
    localStorage.removeItem("staff_rol");
    localStorage.removeItem("staff_nombre");
    localStorage.removeItem("staff_usuario");
    localStorage.removeItem("staff_es_jefe");
    setStaff(null);
  }

  return <StaffSesionContext.Provider value={{ staff, login, logout }}>{children}</StaffSesionContext.Provider>;
}

export function useStaffSesion() {
  const ctx = useContext(StaffSesionContext);
  if (!ctx) throw new Error("useStaffSesion debe usarse dentro de StaffSesionProvider");
  return ctx;
}
