import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { inputStyle } from "./GovShell";

/** Campo de contraseña con botón para mostrar u ocultar lo escrito. */
export default function PasswordInput({ value, onChange, autoComplete = "current-password", required = true, ...rest }) {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        {...rest}
        style={{ ...inputStyle, paddingRight: 48 }}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={visible}
        title={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        style={{
          position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
          width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
          background: "transparent", border: "none", cursor: "pointer", color: "#6b7785", borderRadius: 8,
        }}
      >
        {visible ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  );
}
