// Ayudante para dibujar mapas ASCII por coordenadas (columna x, fila y).
// La fila 12 es la superficie del suelo normal; el mapa tiene 14 filas.
export function lienzo(ancho, alto = 14) {
  const g = Array.from({ length: alto }, () => Array(ancho).fill(" "));
  const L = {
    pon(ch, x, y) { if (y >= 0 && y < alto && x >= 0 && x < ancho) g[y][x] = ch; return L; },
    fila(ch, x0, x1, y) { for (let x = x0; x <= x1; x++) L.pon(ch, x, y); return L; },
    columna(ch, x, y0, y1) { for (let y = y0; y <= y1; y++) L.pon(ch, x, y); return L; },
    // Suelo macizo desde la fila y hasta abajo
    suelo(x0, x1, y = 12, ch = "=") { for (let yy = y; yy < alto; yy++) L.fila(ch, x0, x1, yy); return L; },
    filas() { return g.map((r) => r.join("")); },
    // Para ver el mapa en la consola del navegador: console.log(mapa.ver())
    ver() { return L.filas().join("\n"); },
  };
  return L;
}
