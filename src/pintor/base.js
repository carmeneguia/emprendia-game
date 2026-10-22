// Herramientas de dibujo con Canvas 2D para crear texturas con el mismo estilo que los sprites:
// contorno oscuro, colores planos con sombra y brillo (estilo ilustración, no pixel art).
import { k } from "../k.js";

export const DPR = 2; // las texturas se pintan al doble para que se vean nítidas
export const TINTA = "#1b1726"; // color del contorno, igual que el de los sprites

// Números aleatorios repetibles (misma semilla = mismo dibujo)
export function azar(semilla) {
  let a = semilla >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function crearLienzo(w, h, dpr = DPR) {
  const c = document.createElement("canvas");
  c.width = Math.ceil(w * dpr);
  c.height = Math.ceil(h * dpr);
  const ctx = c.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  return { c, ctx };
}

// Pinta y registra una textura como sprite de Kaplay (disponible al instante).
export function registrar(nombre, w, h, pintar, opciones = {}) {
  const { c, ctx } = crearLienzo(w, h, opciones.dpr ?? DPR);
  pintar(ctx, w, h);
  k.loadSprite(nombre, c, opciones.sprite ?? {});
  return nombre;
}

// ---------- color ----------
function hexARgb(hex) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function mezclar(a, b, t) {
  const A = hexARgb(a), B = hexARgb(b);
  const c = A.map((v, i) => Math.round(v + (B[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
export const aclarar = (c, t) => mezclar(c, "#ffffff", t);
export const oscurecer = (c, t) => mezclar(c, TINTA, t);
export function rgba(hex, a) {
  const [r, g, b] = hexARgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

// ---------- formas ----------
export function rect(ctx, x, y, w, h, r = 0) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}
export function circulo(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}
export function elipse(ctx, x, y, rx, ry, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
}
export function poligono(ctx, pts) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}

// Relleno + contorno de tinta en un paso
export function pintar(ctx, relleno, borde = 3, colorBorde = TINTA) {
  if (relleno) { ctx.fillStyle = relleno; ctx.fill(); }
  if (borde) { ctx.lineWidth = borde; ctx.strokeStyle = colorBorde; ctx.stroke(); }
}

export function degradado(ctx, x0, y0, x1, y1, paradas) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  paradas.forEach(([p, c]) => g.addColorStop(p, c));
  return g;
}
export function radial(ctx, x, y, r0, r1, paradas) {
  const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
  paradas.forEach(([p, c]) => g.addColorStop(p, c));
  return g;
}

// Brillo curvo típico de ilustración (una "media luna" clara)
export function brillo(ctx, x, y, w, h, alfa = 0.45) {
  ctx.save();
  ctx.globalAlpha = alfa;
  ctx.fillStyle = "#ffffff";
  elipse(ctx, x, y, w, h, -0.5);
  ctx.fill();
  ctx.restore();
}

// Línea gruesa con contorno (para extremidades, cables...)
export function trazoGrueso(ctx, puntos, ancho, color, borde = 3) {
  ctx.beginPath();
  puntos.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.lineWidth = ancho + borde * 2;
  ctx.strokeStyle = TINTA;
  ctx.stroke();
  ctx.lineWidth = ancho;
  ctx.strokeStyle = color;
  ctx.stroke();
}

export function texto(ctx, cad, x, y, { tam = 16, color = "#ffffff", peso = "bold", alinear = "center", base = "middle", borde = 0, colorBorde = TINTA, fuente = FUENTE } = {}) {
  ctx.font = `${peso} ${tam}px ${fuente}`;
  ctx.textAlign = alinear;
  ctx.textBaseline = base;
  if (borde) { ctx.lineWidth = borde; ctx.strokeStyle = colorBorde; ctx.strokeText(cad, x, y); }
  ctx.fillStyle = color;
  ctx.fillText(cad, x, y);
}

export const FUENTE = '"Arial Rounded MT Bold", "Trebuchet MS", "Avenir Next", Arial, sans-serif';
