import React from "react";
import logoCalvillo from "../assets/logo-calvillo.jpeg";
import logoFinanzas from "../assets/logo-finanzas.png";
import logoDesarrollo from "../assets/logo-desarrollo-social.jpg";

/**
 * variant: "municipio" | "finanzas" | "desarrollo"
 * - finanzas → solo Secretaría de Finanzas
 * - desarrollo → solo Secretaría de Desarrollo Social
 * - municipio → solo Gobierno de Calvillo
 */
export default function BrandLogos({ variant = "municipio", height = 36, style = {} }) {
  const src =
    variant === "finanzas"
      ? logoFinanzas
      : variant === "desarrollo"
        ? logoDesarrollo
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
          maxWidth: 180,
          objectFit: "contain",
          display: "block",
        }}
      />
    </div>
  );
}

export { logoCalvillo, logoFinanzas, logoDesarrollo };
