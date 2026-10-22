import React, { useMemo } from "react";
import { C } from "../theme";

// pseudo-QR determinista — placeholder visual únicamente.
// TODO: reemplazar con una librería real (ej. `qrcode`) que genere un token firmado por el backend.
export default function PseudoQR({ seed = "0000", size = 11, cell = 8 }) {
  const grid = useMemo(() => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    const cells = [];
    for (let y = 0; y < size; y++) {
      const row = [];
      for (let x = 0; x < size; x++) {
        const isFinder = (x < 3 && y < 3) || (x > size - 4 && y < 3) || (x < 3 && y > size - 4);
        if (isFinder) {
          row.push(1);
        } else {
          h = (h * 1103515245 + 12345) >>> 0;
          row.push((h >> 16) % 5 === 0 ? 0 : h % 2);
        }
      }
      cells.push(row);
    }
    return cells;
  }, [seed, size]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${size}, ${cell}px)`,
        gap: 1,
        background: C.navy,
        padding: 6,
        borderRadius: 8,
      }}
    >
      {grid.flatMap((row, y) =>
        row.map((v, x) => (
          <div key={`${x}-${y}`} style={{ width: cell, height: cell, background: v ? C.navy : "#fff" }} />
        ))
      )}
    </div>
  );
}
