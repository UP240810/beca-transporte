import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
export default function Contabilidad() {
  const nav = useNavigate();
  useEffect(() => { nav("/recaudacion", { replace: true }); }, [nav]);
  return null;
}
