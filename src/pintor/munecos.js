// Personajes provisionales dibujados por código (para los que aún no tienen sprite).
// Misma cuadrícula que los sprites reales: 4x4 celdas de 256 px.
//   fila 1 andar · fila 2 correr · fila 3 saltar · fila 4 superpoder
import { crearLienzo, TINTA, rect, circulo, elipse, pintar, degradado, aclarar, oscurecer, trazoGrueso, brillo } from "./base.js";

export const ESTILOS_MUNECO = {
  catala:   { piel: "#f1c9a5", pelo: "#3a2418", peinado: "corto", camisa: "#d63a3a", pantalon: "#2a2f45", zapatos: "#f2f2f2", efecto: "#4a4fd0" },
  pet:      { piel: "#f3cfae", pelo: "#6b4226", peinado: "rizado", camisa: "#ffffff", pantalon: "#2f6fd6", zapatos: "#1b1726", efecto: "#5ee8ff" },
  amparo:   { piel: "#f3cfae", pelo: "#5a2e1a", peinado: "largo", camisa: "#ef6aa8", pantalon: "#3a3050", zapatos: "#8a2a4a", efecto: "#ff8ac8" },
  julian:   { piel: "#e8bb94", pelo: "#2a1a10", peinado: "patillas", camisa: "#2f9e5a", pantalon: "#2a2f45", zapatos: "#5a3a20", efecto: "#5dff8a" },
  chaves:   { piel: "#f1c9a5", pelo: "#b9b9c2", peinado: "corto", camisa: "#f4f4f8", pantalon: "#4a4f63", zapatos: "#1b1726", efecto: "#fff6c2", gafas: true },
  bot_calvo: { piel: "#aeb8c8", pelo: null, peinado: "calvo", camisa: "#5a6478", pantalon: "#3a4152", zapatos: "#2a2f3a", efecto: "#ff3b5c", robot: true, altura: 0.82 },
  bot_alto: { piel: "#aeb8c8", pelo: "#3a2a20", peinado: "largo", camisa: "#6a5a48", pantalon: "#3a4152", zapatos: "#2a2f3a", efecto: "#ff3b5c", robot: true, altura: 1.05 },
};

const CELDA = 256;

// Pose de cada fotograma
function pose(fila, f) {
  const s = Math.sin((f / 4) * Math.PI * 2);
  if (fila === 0) return { piernaA: 24 * s, piernaB: -24 * s, brazoA: -22 * s, brazoB: 22 * s, rodilla: 6, inclinar: 0, agachar: Math.abs(s) * -3, codo: 10 };
  if (fila === 1) return { piernaA: 48 * s, piernaB: -48 * s, brazoA: -55 * s, brazoB: 55 * s, rodilla: 34, inclinar: 10, agachar: Math.abs(s) * -8, codo: 70 };
  if (fila === 2) return [
    { piernaA: 18, piernaB: -10, brazoA: 30, brazoB: -20, rodilla: 60, inclinar: 6, agachar: 24, codo: 30 },
    { piernaA: 8, piernaB: -14, brazoA: 165, brazoB: -165, rodilla: 6, inclinar: 0, agachar: -6, codo: 10 },
    { piernaA: 40, piernaB: -20, brazoA: 130, brazoB: -120, rodilla: 70, inclinar: 4, agachar: -2, codo: 30 },
    { piernaA: 20, piernaB: -16, brazoA: 20, brazoB: -10, rodilla: 50, inclinar: 4, agachar: 18, codo: 30 },
  ][f];
  return [
    { piernaA: 20, piernaB: -20, brazoA: -150, brazoB: 30, rodilla: 20, inclinar: -6, agachar: 4, codo: 40, efecto: 0 },
    { piernaA: 26, piernaB: -24, brazoA: 80, brazoB: -20, rodilla: 26, inclinar: 6, agachar: 8, codo: 0, efecto: 0.5 },
    { piernaA: 30, piernaB: -26, brazoA: 90, brazoB: -30, rodilla: 30, inclinar: 10, agachar: 10, codo: 0, efecto: 1 },
    { piernaA: 24, piernaB: -22, brazoA: 95, brazoB: -20, rodilla: 24, inclinar: 8, agachar: 8, codo: 10, efecto: 0.6 },
  ][f];
}

const rad = (g) => (g * Math.PI) / 180;

function extremidad(c, x, y, angulo, largo, flexion, grosor, color, colorFinal, finalTam) {
  // dos tramos: muslo/brazo y pierna/antebrazo
  const a1 = rad(angulo), a2 = rad(angulo + flexion);
  const x1 = x + Math.sin(a1) * largo / 2, y1 = y + Math.cos(a1) * largo / 2;
  const x2 = x1 + Math.sin(a2) * largo / 2, y2 = y1 + Math.cos(a2) * largo / 2;
  trazoGrueso(c, [[x, y], [x1, y1], [x2, y2]], grosor, color, 3.5);
  if (colorFinal) { elipse(c, x2 + 3, y2 + 2, finalTam, finalTam * 0.62); pintar(c, colorFinal, 3); }
  return [x2, y2];
}

function dibujarMuneco(c, est, p, ox, oy) {
  const esc = est.altura ?? 1;
  c.save();
  c.translate(ox + CELDA / 2, oy + CELDA - 6);
  c.scale(esc, esc);
  c.translate(0, p.agachar);
  const cadera = [0, -104];
  const hombro = [Math.sin(rad(p.inclinar)) * 70, -170];
  // pierna de atrás, brazo de atrás (más oscuros)
  extremidad(c, cadera[0] - 4, cadera[1], -p.piernaB, 100, -p.rodilla * (p.piernaB > 0 ? 0.2 : 1), 30, oscurecer(est.pantalon, 0.25), oscurecer(est.zapatos, 0.15), 16);
  extremidad(c, hombro[0] - 10, hombro[1] + 6, p.brazoB, 76, p.codo, 22, oscurecer(est.camisa, 0.25), oscurecer(est.piel, 0.2), 8);
  // torso
  c.save();
  c.translate(cadera[0], cadera[1]);
  c.rotate(rad(p.inclinar));
  rect(c, -34, -80, 68, 88, 20);
  pintar(c, degradado(c, -34, 0, 34, 0, [[0, aclarar(est.camisa, 0.12)], [1, oscurecer(est.camisa, 0.18)]]), 3.5);
  if (est.robot) { rect(c, -12, -60, 24, 18, 4); pintar(c, "#2a2f3a", 2.5); circulo(c, -5, -51, 3); pintar(c, "#ff3b5c", 0); circulo(c, 5, -51, 3); pintar(c, "#5dff8a", 0); }
  brillo(c, -12, -60, 6, 14, 0.25);
  // cabeza
  const cy = -112;
  if (est.peinado === "largo") { rect(c, -26, cy - 20, 48, 70, 20); pintar(c, est.pelo, 3.5); }
  circulo(c, 2, cy, 34);
  pintar(c, degradado(c, -28, cy - 30, 30, cy + 30, [[0, aclarar(est.piel, 0.1)], [1, oscurecer(est.piel, 0.12)]]), 3.5);
  if (est.robot) {
    rect(c, -6, cy - 10, 36, 14, 6); pintar(c, "#1b1726", 2.5);
    rect(c, 2, cy - 7, 24, 7, 3); pintar(c, "#ff3b5c", 0);
    c.beginPath(); c.moveTo(2, cy - 30); c.lineTo(2, cy - 46); c.lineWidth = 3; c.strokeStyle = TINTA; c.stroke();
    circulo(c, 2, cy - 48, 5); pintar(c, "#ff3b5c", 2.5);
  } else {
    // ojo, nariz y boca mirando a la derecha
    elipse(c, 18, cy - 4, 4, 5.5); pintar(c, TINTA, 0);
    c.beginPath(); c.moveTo(30, cy + 2); c.quadraticCurveTo(36, cy + 8, 29, cy + 10); c.lineWidth = 2.5; c.strokeStyle = TINTA; c.stroke();
    c.beginPath(); c.moveTo(14, cy + 16); c.quadraticCurveTo(21, cy + 20, 26, cy + 15); c.stroke();
    if (est.gafas) { circulo(c, 18, cy - 4, 9); c.lineWidth = 3; c.stroke(); }
  }
  // pelo
  if (est.pelo && est.peinado !== "calvo") {
    c.beginPath();
    if (est.peinado === "rizado") {
      for (let i = 0; i < 7; i++) { circulo(c, -22 + i * 7.5, cy - 24 + Math.sin(i) * 4, 10); pintar(c, est.pelo, 3); }
    } else {
      c.moveTo(-28, cy + 4); c.quadraticCurveTo(-32, cy - 34, 4, cy - 34); c.quadraticCurveTo(34, cy - 32, 30, cy - 12);
      c.quadraticCurveTo(10, cy - 22, -6, cy - 14); c.quadraticCurveTo(-14, cy - 4, -18, cy + 8); c.closePath();
      pintar(c, est.pelo, 3.5);
      if (est.peinado === "patillas") { rect(c, 2, cy - 6, 8, 26, 4); pintar(c, est.pelo, 2.5); }
    }
  }
  c.restore();
  // pierna y brazo delanteros
  extremidad(c, cadera[0] + 4, cadera[1], p.piernaA, 100, -p.rodilla * (p.piernaA > 0 ? 1 : 0.2), 30, est.pantalon, est.zapatos, 16);
  const mano = extremidad(c, hombro[0] + 10, hombro[1] + 6, p.brazoA, 76, p.codo, 22, est.camisa, est.piel, 8);
  // efecto del superpoder
  if (p.efecto) {
    c.save(); c.shadowColor = est.efecto; c.shadowBlur = 20;
    circulo(c, mano[0] + 14, mano[1], 10 + p.efecto * 16); pintar(c, est.efecto, 3);
    circulo(c, mano[0] + 14, mano[1], 4 + p.efecto * 6); pintar(c, "#ffffff", 0);
    c.restore();
  }
  c.restore();
}

export function pintarHojaMuneco(estilo) {
  const { c, ctx } = crearLienzo(CELDA * 4, CELDA * 4, 1);
  for (let fila = 0; fila < 4; fila++) for (let f = 0; f < 4; f++) dibujarMuneco(ctx, estilo, pose(fila, f), f * CELDA, fila * CELDA);
  return c;
}
