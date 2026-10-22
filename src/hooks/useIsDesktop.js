import { useState, useEffect } from "react";

// Punto de quiebre a partir del cual Recaudación y Ventanilla
// pasan de vista de celular (una columna) a vista de escritorio (dos columnas).
const BREAKPOINT = "(min-width: 900px)";

export default function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.matchMedia(BREAKPOINT).matches : false
  );

  useEffect(() => {
    const mql = window.matchMedia(BREAKPOINT);
    const handler = (e) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return isDesktop;
}
