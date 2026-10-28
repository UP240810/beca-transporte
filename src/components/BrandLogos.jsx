import React from "react";
import logoCalvillo from "../assets/logo-calvillo.png";
import logoCalvilloClaro from "../assets/logo-calvillo-claro.png";
import logoFinanzas from "../assets/logo-finanzas.png";
import logoFinanzasClaro from "../assets/logo-finanzas-claro.png";
import logoDesarrollo from "../assets/logo-desarrollo-social.png";
import logoDesarrolloClaro from "../assets/logo-desarrollo-social-claro.png";

/**
 * variant: "municipio" | "finanzas" | "desarrollo"
 * - finanzas → solo Secretaría de Finanzas
 * - desarrollo → solo Secretaría de Desarrollo Social
 * - municipio → solo Gobierno de Calvillo (PNG sin fondo)
 *
 * Todos los logos son PNG con fondo transparente.
 * onDark: usa la versión en blanco de cada logo para ponerlo directo sobre
 * fondos azules (header y footer), sin caja blanca detrás.
 * height puede ser número (px) o string CSS, ej. "clamp(46px, 7vw, 64px)".
 */
export default function BrandLogos({ variant = "municipio", height = 36, onDark = false, style = {} }) {
  const src =
    variant === "finanzas"
      ? (onDark ? logoFinanzasClaro : logoFinanzas)
      : variant === "desarrollo"
        ? (onDark ? logoDesarrolloClaro : logoDesarrollo)
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

export { logoCalvillo, logoCalvilloClaro, logoFinanzas, logoFinanzasClaro, logoDesarrollo, logoDesarrolloClaro };
