// Elementos de interfaz con el estilo del juego: textos con sombra, carteles y paneles de instrucciones.
import { k, ANCHO, ALTO } from "./k.js";

export const TINTA = [27, 23, 38];

// Texto con sombra oscura (se lee bien sobre cualquier fondo)
export function rotulo(cad, { pos = k.vec2(0, 0), tam = 18, color = [255, 255, 255], ancla = "center", ancho, alinear = "left", fijo = false, z = 100, sombra = 3 } = {}) {
  const opts = { size: tam, align: alinear, ...(ancho ? { width: ancho } : {}) };
  const t = k.add([k.text(cad, opts), k.pos(pos), k.anchor(ancla), k.color(...color), k.opacity(1), k.z(z), ...(fijo ? [k.fixed()] : [])]);
  if (!sombra) return t;
  const s = t.add([k.text(cad, opts), k.pos(sombra * 0.4, sombra), k.anchor(ancla), k.color(...TINTA), k.opacity(0.75), k.z(-1)]);
  // mantener la sombra igual al texto
  t.onUpdate(() => { if (s.text !== t.text) s.text = t.text; s.opacity = t.opacity * 0.75; });
  return t;
}

// Recuadro redondeado con contorno de tinta
export function cartel(x, y, w, h, { color = [29, 26, 51], borde = [255, 210, 80], ancla = "topleft", fijo = true, z = 99, opacidad = 0.92, radio = 14, grosor = 4 } = {}) {
  return k.add([
    k.pos(x, y), k.rect(w, h, { radius: radio }), k.anchor(ancla), k.color(...color), k.opacity(opacidad),
    k.outline(grosor, k.rgb(...borde)), k.z(z), ...(fijo ? [k.fixed()] : []),
  ]);
}

// Tecla dibujada (para explicar controles)
function tecla(x, y, etiqueta, z) {
  const w = Math.max(34, etiqueta.length * 10 + 18);
  cartel(x, y, w, 30, { color: [240, 240, 248], borde: TINTA, radio: 7, z, opacidad: 1, grosor: 3 });
  k.add([k.text(etiqueta, { size: 14 }), k.pos(x + w / 2, y + 16), k.anchor("center"), k.color(...TINTA), k.fixed(), k.z(z + 1)]);
  return w;
}

// Panel de instrucciones que pausa el juego hasta pulsar ENTER.
//   titulo, subtitulo, personaje (id del sprite para el retrato), color (acento),
//   puntos: lista de frases · controles: [["ESPACIO", "Lanzar bola"], ...]
export function mostrarPanel({ titulo, subtitulo = "", personaje = null, color = [255, 210, 80], puntos = [], controles = [], pie = "Pulsa ENTER para empezar" }) {
  return new Promise((resolver) => {
    const Z = 900;
    const objetos = [];
    const add = (o) => (objetos.push(o), o);
    add(k.add([k.rect(ANCHO, ALTO), k.color(10, 8, 20), k.opacity(0.62), k.fixed(), k.z(Z)]));
    const X = 90, Y = 40, W = ANCHO - 180, H = ALTO - 80;
    add(cartel(X + 6, Y + 8, W, H, { color: TINTA, borde: TINTA, z: Z + 1, opacidad: 0.6, radio: 24 }));
    add(cartel(X, Y, W, H, { color: [33, 29, 56], borde: color, z: Z + 2, opacidad: 1, radio: 24, grosor: 5 }));
    add(cartel(X, Y, W, 92, { color: color.map((v) => Math.round(v * 0.35)), borde: color, z: Z + 3, opacidad: 1, radio: 24, grosor: 5 }));
    add(rotulo(titulo, { pos: k.vec2(X + 30, Y + 30), tam: 30, color: [255, 255, 255], ancla: "left", fijo: true, z: Z + 4 }));
    if (subtitulo) add(rotulo(subtitulo, { pos: k.vec2(X + 30, Y + 66), tam: 17, color, ancla: "left", fijo: true, z: Z + 4 }));

    let xTexto = X + 36;
    if (personaje) {
      // retrato: fotograma del superpoder
      add(k.add([k.fixed(), k.z(Z + 4), {
        draw() {
          k.drawCircle({ pos: k.vec2(X + 120, Y + 230), radius: 86, color: k.rgb(...color.map((v) => Math.round(v * 0.25))), outline: { width: 4, color: k.rgb(...color) } });
          try { k.drawSprite({ sprite: personaje, frame: 13, pos: k.vec2(X + 120, Y + 318), anchor: "bot", width: 190, height: 190 }); } catch (e) { /* sin sprite */ }
        },
      }]));
      xTexto = X + 236;
    }
    let y = Y + 118;
    puntos.forEach((frase) => {
      add(k.add([k.circle(5), k.pos(xTexto + 6, y + 10), k.color(...color), k.fixed(), k.z(Z + 4)]));
      const t = add(k.add([k.text(frase, { size: 17, width: X + W - xTexto - 40, lineSpacing: 4 }), k.pos(xTexto + 22, y), k.color(235, 235, 245), k.fixed(), k.z(Z + 4)]));
      y += t.height + 14;
    });

    let xc = X + 36;
    const yc = Y + H - 96;
    controles.forEach(([tec, desc]) => {
      tec.split("+").forEach((parte, i) => { if (i) xc += 4; xc += tecla(xc, yc, parte.trim(), Z + 4) + 6; });
      const d = add(k.add([k.text(desc, { size: 14 }), k.pos(xc + 2, yc + 16), k.anchor("left"), k.color(200, 200, 220), k.fixed(), k.z(Z + 4)]));
      xc += d.width + 24;
    });
    const pieT = add(rotulo(pie, { pos: k.vec2(ANCHO / 2, Y + H - 30), tam: 20, color, fijo: true, z: Z + 4 }));

    // Pausa: se detiene todo lo que cuelga de la raíz (objetos y temporizadores); el dibujo sigue.
    const raiz = k.getTreeRoot();
    raiz.paused = true;
    let cerrado = false;
    const cerrar = () => {
      if (cerrado) return;
      cerrado = true;
      window.removeEventListener("keydown", tecla_);
      // borrar todo lo que se añadió para el panel (y sus hijos)
      k.get("*").filter((o) => (o.z ?? 0) >= Z).forEach((o) => o.destroy());
      objetos.forEach((o) => o.exists() && o.destroy());
      raiz.paused = false;
      resolver();
    };
    const tecla_ = (e) => { if (e.key === "Enter") { e.preventDefault(); cerrar(); } };
    // pequeña espera para que la tecla que abrió el panel no lo cierre al momento
    setTimeout(() => window.addEventListener("keydown", tecla_), 250);
    if (window.juegoSinPaneles) setTimeout(cerrar, 0);
    // si se cambia de pantalla con el panel abierto (R, ESC...), quitar la pausa
    k.onSceneLeave(() => { window.removeEventListener("keydown", tecla_); cerrado = true; raiz.paused = false; });
  });
}
