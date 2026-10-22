// Pinta el terreno sólido de un mapa ASCII en trozos de 960 px de ancho.
// Cada material define color, textura y cómo es su superficie (lo que se pisa).
import { k } from "../k.js";
import { crearLienzo, azar, TINTA, rect, circulo, elipse, pintar, mezclar, aclarar, oscurecer, rgba, degradado } from "./base.js";

export const MATERIALES = {
  // nivel 1: bolera
  madera:     { base: "#d9a25f", oscuro: "#8f5a2b", textura: "tablones", superficie: "brillo", colorSup: "#ffe9c2" },
  madera_neon: { base: "#b5763f", oscuro: "#6b3f1c", textura: "tablones", superficie: "neon", colorSup: "#ff4fd8" },
  // nivel 2: caverna
  roca:       { base: "#7a5a43", oscuro: "#3a281d", textura: "estratos", superficie: "musgo", colorSup: "#7fae4a" },
  roca_plat:  { base: "#8e7058", oscuro: "#4a3526", textura: "estratos", superficie: "filo", colorSup: "#b8977a" },
  // nivel 3: bolsa
  marmol:     { base: "#d9d4e6", oscuro: "#7d7794", textura: "vetas", superficie: "filo", colorSup: "#ffffff" },
  oro:        { base: "#e0b23a", oscuro: "#7c5a10", textura: "placas", superficie: "brillo", colorSup: "#fff2b0" },
  // nivel 4: centro de datos
  metal:      { base: "#55606f", oscuro: "#222831", textura: "placas", superficie: "franja", colorSup: "#f2c230" },
  metal_plat: { base: "#6a7586", oscuro: "#2d343e", textura: "rejilla", superficie: "filo", colorSup: "#9aa6b8" },
  // nivel 5: SQL
  tech:       { base: "#284a8a", oscuro: "#0f1d3d", textura: "rejilla_luz", superficie: "neon", colorSup: "#6fd3ff" },
  // nivel 6: terminal
  circuito:   { base: "#16301e", oscuro: "#06120a", textura: "circuito", superficie: "neon", colorSup: "#5dff8a" },
  // nivel 7: castillo de grafos
  ladrillo:   { base: "#5d4c74", oscuro: "#241a33", textura: "ladrillos", superficie: "filo", colorSup: "#a08cc2" },
  // nivel 8: tienda
  baldosa:    { base: "#e9eef6", oscuro: "#9aa6ba", textura: "baldosas", superficie: "franja_azul", colorSup: "#2f6fd6" },
  percha:     { base: "#c8d0de", oscuro: "#6c7690", textura: "barra", superficie: "brillo", colorSup: "#ffffff" },
  // nivel 10: puerto
  hormigon:   { base: "#9a9ca3", oscuro: "#4b4d55", textura: "hormigon", superficie: "franja", colorSup: "#f2c230" },
  cont_azul:  { base: "#2f6fd6", oscuro: "#14336e", textura: "corrugado", superficie: "filo", colorSup: "#6fa8ff" },
  cont_rojo:  { base: "#d6453a", oscuro: "#6e1a14", textura: "corrugado", superficie: "filo", colorSup: "#ff8a7a" },
  cont_verde: { base: "#2f9e5a", oscuro: "#11472a", textura: "corrugado", superficie: "filo", colorSup: "#6fe39a" },
  // final: fortaleza
  fortaleza:  { base: "#3a2030", oscuro: "#150a12", textura: "placas", superficie: "neon", colorSup: "#ff3b5c" },
  fortaleza_plat: { base: "#4a2a3e", oscuro: "#1e0e18", textura: "rejilla", superficie: "neon", colorSup: "#ff7a9a" },
};

// ---------- texturas por casilla ----------
const TEXTURAS = {
  tablones(c, x, y, s, m, r, cy) {
    const desplaz = (cy % 2) * 20;
    c.strokeStyle = rgba("#000000", 0.18); c.lineWidth = 1.5;
    for (let yy = 13; yy < s; yy += 13) { c.beginPath(); c.moveTo(x, y + yy); c.lineTo(x + s, y + yy); c.stroke(); }
    c.beginPath(); c.moveTo(x + ((desplaz + 10) % s), y); c.lineTo(x + ((desplaz + 10) % s), y + 13); c.stroke();
    c.strokeStyle = rgba("#ffffff", 0.12);
    for (let i = 0; i < 3; i++) { const yy = y + 4 + r() * 32; c.beginPath(); c.moveTo(x + r() * 10, yy); c.lineTo(x + 20 + r() * 20, yy + r() * 2); c.stroke(); }
  },
  estratos(c, x, y, s, m, r) {
    c.strokeStyle = rgba("#000000", 0.18); c.lineWidth = 2;
    for (let yy = 8; yy < s; yy += 12) { c.beginPath(); c.moveTo(x, y + yy + r() * 3); c.quadraticCurveTo(x + 20, y + yy - 3 + r() * 6, x + s, y + yy + r() * 3); c.stroke(); }
    for (let i = 0; i < 2; i++) { elipse(c, x + 6 + r() * 28, y + 6 + r() * 28, 3 + r() * 3, 2 + r() * 2); pintar(c, rgba("#ffffff", 0.12), 0); }
  },
  vetas(c, x, y, s, m, r) {
    c.strokeStyle = rgba(m.oscuro, 0.35); c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(x + r() * s, y); c.bezierCurveTo(x + r() * s, y + 14, x + r() * s, y + 26, x + r() * s, y + s); c.stroke();
  },
  placas(c, x, y, s, m) {
    rect(c, x + 3, y + 3, s - 6, s - 6, 3); c.lineWidth = 1.5; c.strokeStyle = rgba("#000000", 0.25); c.stroke();
    [[6, 6], [s - 6, 6], [6, s - 6], [s - 6, s - 6]].forEach(([a, b]) => { circulo(c, x + a, y + b, 1.8); pintar(c, rgba("#ffffff", 0.35), 0); });
  },
  rejilla(c, x, y, s) {
    c.strokeStyle = rgba("#000000", 0.3); c.lineWidth = 1.5;
    for (let i = 8; i < s; i += 8) { c.beginPath(); c.moveTo(x + i, y + 4); c.lineTo(x + i, y + s - 4); c.stroke(); }
  },
  rejilla_luz(c, x, y, s, m, r) {
    rect(c, x + 2, y + 2, s - 4, s - 4, 4); c.lineWidth = 1.5; c.strokeStyle = rgba("#6fd3ff", 0.25); c.stroke();
    if (r() > 0.6) { rect(c, x + 8 + r() * 18, y + 8 + r() * 18, 6, 6, 1); pintar(c, rgba("#9fe6ff", 0.55), 0); }
  },
  circuito(c, x, y, s, m, r) {
    c.strokeStyle = rgba("#5dff8a", 0.25); c.lineWidth = 2;
    const a = y + 8 + r() * 24;
    c.beginPath(); c.moveTo(x, a); c.lineTo(x + 14, a); c.lineTo(x + 22, a + (r() > 0.5 ? 8 : -8)); c.lineTo(x + s, a + (r() > 0.5 ? 8 : -8)); c.stroke();
    circulo(c, x + 14, a, 2.5); pintar(c, rgba("#5dff8a", 0.5), 0);
  },
  ladrillos(c, x, y, s, m, r, cy) {
    c.strokeStyle = rgba("#000000", 0.35); c.lineWidth = 2;
    for (let f = 0; f < 3; f++) {
      const yy = y + f * 13.3;
      c.beginPath(); c.moveTo(x, yy); c.lineTo(x + s, yy); c.stroke();
      const off = (f + cy) % 2 ? 10 : 30;
      c.beginPath(); c.moveTo(x + off, yy); c.lineTo(x + off, yy + 13.3); c.stroke();
    }
    c.fillStyle = rgba("#ffffff", 0.06); c.fillRect(x + 2, y + 2, s - 4, 4);
  },
  baldosas(c, x, y, s) {
    c.strokeStyle = rgba("#7d8aa3", 0.45); c.lineWidth = 1.5;
    c.strokeRect(x + 0.75, y + 0.75, s / 2, s / 2); c.strokeRect(x + s / 2, y + s / 2, s / 2 - 0.75, s / 2 - 0.75);
  },
  barra(c, x, y, s) {
    c.fillStyle = rgba("#ffffff", 0.25); c.fillRect(x, y + 10, s, 4);
  },
  hormigon(c, x, y, s, m, r) {
    for (let i = 0; i < 7; i++) { circulo(c, x + r() * s, y + r() * s, 0.8 + r() * 1.4); pintar(c, rgba(r() > 0.5 ? "#ffffff" : "#000000", 0.15), 0); }
    if (r() > 0.8) { c.strokeStyle = rgba("#000000", 0.25); c.lineWidth = 1.2; c.beginPath(); c.moveTo(x + r() * s, y + r() * s); c.lineTo(x + r() * s, y + r() * s); c.stroke(); }
  },
  corrugado(c, x, y, s, m) {
    for (let i = 0; i < s; i += 8) { c.fillStyle = rgba("#ffffff", 0.14); c.fillRect(x + i, y, 3, s); c.fillStyle = rgba("#000000", 0.16); c.fillRect(x + i + 4, y, 2, s); }
  },
};

// ---------- superficies (borde superior expuesto) ----------
const SUPERFICIES = {
  brillo(c, x, y, s, m) {
    c.fillStyle = m.colorSup; c.globalAlpha = 0.55; c.fillRect(x, y + 3, s, 4); c.globalAlpha = 1;
  },
  neon(c, x, y, s, m) {
    c.save(); c.shadowColor = m.colorSup; c.shadowBlur = 10;
    c.fillStyle = m.colorSup; c.fillRect(x, y, s, 4);
    c.restore();
  },
  musgo(c, x, y, s, m, r) {
    c.fillStyle = m.colorSup; c.fillRect(x, y, s, 7);
    for (let i = 0; i < 3; i++) { circulo(c, x + 6 + i * 13 + r() * 4, y + 7, 3 + r() * 3); c.fillStyle = m.colorSup; c.fill(); }
    c.fillStyle = aclarar(m.colorSup, 0.35); c.fillRect(x, y + 1, s, 2);
  },
  filo(c, x, y, s, m) {
    c.fillStyle = m.colorSup; c.globalAlpha = 0.8; c.fillRect(x, y, s, 5); c.globalAlpha = 1;
  },
  franja(c, x, y, s, m) {
    c.save(); c.beginPath(); c.rect(x, y, s, 8); c.clip();
    c.fillStyle = m.colorSup; c.fillRect(x, y, s, 8);
    c.fillStyle = TINTA; for (let i = -8; i < s; i += 12) { c.beginPath(); c.moveTo(x + i, y + 8); c.lineTo(x + i + 6, y); c.lineTo(x + i + 11, y); c.lineTo(x + i + 5, y + 8); c.fill(); }
    c.restore();
  },
  franja_azul(c, x, y, s, m) {
    c.fillStyle = m.colorSup; c.fillRect(x, y, s, 7); c.fillStyle = "#ffffff"; c.fillRect(x, y + 7, s, 2);
  },
};

const cacheTerreno = new Map();

// filas: array de strings del mapa · materiales: { "=": "madera", "#": "madera_neon", ... }
// Devuelve la lista de trozos [{ sprite, x, ancho, alto }] para dibujarlos.
export function pintarTerreno(clave, filas, materiales, T) {
  if (cacheTerreno.has(clave)) return cacheTerreno.get(clave);
  const alto = filas.length * T;
  const ancho = Math.max(...filas.map((f) => f.length)) * T;
  const es = (cx, cy) => cy >= 0 && cy < filas.length && cx >= 0 && !!materiales[filas[cy][cx]];
  const igual = (cx, cy, ch) => cy >= 0 && cy < filas.length && filas[cy][cx] === ch;
  const TROZO = 960;
  const trozos = [];
  for (let x0 = 0; x0 < ancho; x0 += TROZO) {
    const w = Math.min(TROZO, ancho - x0);
    const { c, ctx } = crearLienzo(w, alto, 1.5);
    ctx.translate(-x0, 0);
    const desde = Math.max(0, Math.floor(x0 / T) - 1), hasta = Math.ceil((x0 + w) / T) + 1;
    let algo = false;
    for (let cy = 0; cy < filas.length; cy++) {
      for (let cx = desde; cx < hasta; cx++) {
        const ch = filas[cy][cx];
        const m = MATERIALES[materiales[ch]];
        if (!m) continue;
        algo = true;
        const x = cx * T, y = cy * T;
        const r = azar(cx * 92821 + cy * 1237 + 17);
        // profundidad: cuántas casillas iguales hay encima (cuanto más abajo, más oscuro)
        let prof = 0;
        while (prof < 5 && igual(cx, cy - prof - 1, ch)) prof++;
        ctx.fillStyle = mezclar(m.base, m.oscuro, Math.min(prof, 4) * 0.13);
        ctx.fillRect(x, y, T + 0.5, T + 0.5);
        TEXTURAS[m.textura]?.(ctx, x, y, T, m, r, cy);
        const arribaLibre = !igual(cx, cy - 1, ch);
        if (arribaLibre) SUPERFICIES[m.superficie]?.(ctx, x, y, T, m, r);
        // sombra suave bajo la superficie
        if (prof === 1) { ctx.fillStyle = rgba("#000000", 0.12); ctx.fillRect(x, y, T, 5); }
        // contorno en los bordes expuestos
        ctx.strokeStyle = TINTA; ctx.lineWidth = 3;
        ctx.beginPath();
        if (arribaLibre) { ctx.moveTo(x, y + 1.5); ctx.lineTo(x + T, y + 1.5); }
        if (!igual(cx, cy + 1, ch) && cy + 1 < filas.length) { ctx.moveTo(x, y + T - 1.5); ctx.lineTo(x + T, y + T - 1.5); }
        if (!igual(cx - 1, cy, ch)) { ctx.moveTo(x + 1.5, y); ctx.lineTo(x + 1.5, y + T); }
        if (!igual(cx + 1, cy, ch)) { ctx.moveTo(x + T - 1.5, y); ctx.lineTo(x + T - 1.5, y + T); }
        ctx.stroke();
      }
    }
    if (!algo) continue;
    const nombre = `terreno_${clave}_${x0}`;
    k.loadSprite(nombre, c);
    trozos.push({ sprite: nombre, x: x0, ancho: w, alto });
  }
  cacheTerreno.set(clave, trozos);
  return trozos;
}
