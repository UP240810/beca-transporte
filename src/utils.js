// SQLite guarda CURRENT_TIMESTAMP como "YYYY-MM-DD HH:MM:SS" (UTC, sin "Z").
// Este helper lo normaliza para que Date lo interprete bien en ambos formatos
// (el que guarda SQLite y el ISO que a veces manda el seed de datos de prueba).
export function formatFechaHora(valor) {
  if (!valor) return null;
  const iso = valor.includes("T") ? valor : `${valor.replace(" ", "T")}Z`;
  const fecha = new Date(iso);
  if (isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// Comprime y redimensiona una foto del navegador antes de mandarla al
// backend como JSON — sin esto, una foto de celular sin comprimir (varios MB)
// tardaría mucho en subir y pesaría demasiado guardada como texto en SQLite.
// Regresa un data URI JPEG, listo para usarse directo como <img src>.
export function comprimirImagen(archivo, { maxLado = 480, calidad = 0.75 } = {}) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onerror = () => reject(new Error("No se pudo leer la imagen."));
    lector.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("El archivo no parece ser una imagen válida."));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxLado) { height = Math.round((height * maxLado) / width); width = maxLado; }
        else if (height > maxLado) { width = Math.round((width * maxLado) / height); height = maxLado; }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", calidad));
      };
      img.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  });
}
