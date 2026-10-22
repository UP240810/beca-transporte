import React from "react";
import logoCalvillo from "../assets/logo-calvillo.png";
import logoCalvilloClaro from "../assets/logo-calvillo-claro.png";
import logoFinanzas from "../assets/logo-finanzas.png";
import logoDesarrollo from "../assets/logo-desarrollo-social.jpg";

/**
 * variant: "municipio" | "finanzas" | "desarrollo"
 * - finanzas → solo Secretaría de Finanzas
 * - desarrollo → solo Secretaría de Desarrollo Social
 * - municipio → solo Gobierno de Calvillo (PNG sin fondo)
 *
 * onDark: usa la versión del logo de Calvillo con textos en blanco,
 * para ponerlo sobre fondos azules (header y footer).
 * height puede ser número (px) o string CSS, ej. "clamp(46px, 7vw, 64px)".
 */
export default function BrandLogos({ variant = "municipio", height = 36, onDark = false, style = {} }) {
  const src =
    variant === "finanzas"
      ? logoFinanzas
      : variant === "desarrollo"
        ? logoDesarrollo
        : onDark
          ? logoCalvilloClaro
          : logoCalvillo;

  const alt =
    variant === "finanzas"
      ? "Secretaría de Finanzas y Administración"
      : variant === "desarrollo"
        ? "Secretaría de Desarrollo Social"
        : "Gobierno de Calvillo";

  return (
    <div style={{ display: "flex", alignItems: "center", ...style }}>
      <img
        src={src}
        alt={alt}
        style={{
          height,
          width: "auto",
          maxWidth: "100%",
          objectFit: "contain",
          display: "block",
        }}
      />
    </div>
  );
}

export { logoCalvillo, logoCalvilloClaro, logoFinanzas, logoDesarrollo };
