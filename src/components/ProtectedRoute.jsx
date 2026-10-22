import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStaffSesion } from "../context/StaffSesionContext";

export default function ProtectedRoute({ rol, roles, loginPath = "/acceso", children }) {
  const navigate = useNavigate();
  const { staff } = useStaffSesion();
  const lista = roles || (rol ? [rol] : null);
  const autorizado = staff && (!lista || lista.includes(staff.rol));

  useEffect(() => {
    if (!staff) {
      navigate(loginPath, { replace: true });
    } else if (lista && !lista.includes(staff.rol)) {
      navigate(loginPath, { replace: true });
    }
  }, [staff, lista, loginPath, navigate]);

  if (!autorizado) return null;
  return children;
}
