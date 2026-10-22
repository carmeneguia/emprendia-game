// Nivel 3: Bianca — "Wall Street Crash"
// Nivel VERTICAL: escala el gráfico de velas hasta la Cámara Acorazada mientras la inflación sube desde abajo.
// Velas verdes = plataformas firmes. Velas rojas = se hunden al acercarte.
// Dispara monedas a la mecha de una vela roja: se vuelve verde y sube como un ascensor.
import { k, T, ANCHO } from "../k.js";
import { montarNivel, chispas, flotante } from "../nivel.js";
import { lienzo } from "../lienzo.js";
import { darObjeto } from "../estado.js";

const COLOR = [80, 220, 120];
const FILAS_MAPA = 50;
const SUBIDA = 4 * T;          // cuánto sube una vela al volverse verde
const VEL_INFLACION = 15;      // píxeles por segundo
// [columna, fila, tipo] de abajo arriba (cada vela ocupa 2 columnas)
const VELAS = [
  [5, 45, "G"], [10, 43, "R"], [15, 40, "G"], [19, 40, "R"], [15, 33, "G"], [10, 33, "R"],
  [5, 26, "G"], [1, 23, "G"], [5, 20, "R"], [10, 17, "G"], [15, 17, "R"], [19, 10, "G"], [14, 7, "R"],
];

export function nivelBianca(indice) {
  const L = lienzo(24, FILAS_MAPA);
  L.suelo(0, 23, 48);
  L.fila("#", 0, 9, 4); // suelo de la Cámara Acorazada
  L.pon("P", 2, 47).pon("K", 6, 25).pon("M", 2, 3).pon("$", 7, 3);
  L.columna("|", 4, 0, 3);

  let maletin = false;
  let inflacionY = FILAS_MAPA * T + 40;
  let inflacionActiva = false;

  const kit = montarNivel({
    indice,
    personaje: "bianca",
    mapa: L.filas(),
    metaAbierta: false,
    tema: "bolsa",
    colorTema: COLOR,
    materiales: { "=": "marmol", "#": "oro" },
    textoMetaCerrada: "Coge el maletín de dividendos",
    casillas: {
      $: (cx, cy) => k.add([k.pos(cx * T + T / 2, (cy + 1) * T), k.sprite("t_maletin", { width: 48, height: 38 }), k.anchor("bot"), k.area(), "maletin"]),
    },
    panelInicio: {
      titulo: "Nivel 3 · Wall Street Crash",
      subtitulo: "Bianca · Inyección de Liquidez",
      puntos: [
        "¡La INFLACIÓN sube desde abajo! Escala el gráfico hasta la Cámara Acorazada de arriba antes de que te alcance.",
        "Las velas VERDES son plataformas firmes. Las ROJAS se hunden en cuanto te acercas.",
        "Dispara monedas (ESPACIO) a la mecha de una vela roja: se vuelve verde y sube 4 pisos como un ascensor. ¡Súbete!",
        "Los impuestos que caen del cielo hacen daño: destrúyelos con monedas.",
        "Arriba del todo coge el maletín de dividendos para abrir la meta.",
      ],
      controles: [["← + →", "Moverse"], ["↑", "Saltar"], ["ESPACIO", "Monedas"]],
    },
  });
  const p = kit.jugador;

  // paredes invisibles a los lados
  k.add([k.pos(-40, 0), k.rect(40, kit.alto, { fill: false }), k.area(), k.body({ isStatic: true })]);
  k.add([k.pos(ANCHO, 0), k.rect(40, kit.alto, { fill: false }), k.area(), k.body({ isStatic: true })]);

  // ---------- velas ----------
  const VERDE = [[90, 230, 130], [30, 150, 80]];
  const ROJA = [[255, 110, 110], [180, 30, 50]];
  function crearVela(cx, cy, verde) {
    const v = k.add([
      k.pos(cx * T, cy * T), k.rect(2 * T, 2 * T, { fill: false }), k.area(), k.body({ isStatic: true }), "suelo", "vela",
      { verde, destinoY: cy * T, hundiendo: false },
      {
        draw() {
          const [a, b] = this.verde ? VERDE : ROJA;
          k.drawRect({ pos: k.vec2(T - 3, -34), width: 6, height: 34, color: k.rgb(...b), outline: { width: 2, color: k.rgb(27, 23, 38) } });
          k.drawRect({ pos: k.vec2(T - 3, 2 * T), width: 6, height: 26, color: k.rgb(...b), outline: { width: 2, color: k.rgb(27, 23, 38) } });
          k.drawRect({ width: 2 * T, height: 2 * T, radius: 6, gradient: [k.rgb(...a), k.rgb(...b)], horizontal: true, outline: { width: 3, color: k.rgb(27, 23, 38) } });
          k.drawRect({ pos: k.vec2(8, 6), width: 10, height: 2 * T - 12, radius: 4, color: k.rgb(255, 255, 255), opacity: 0.25 });
          if (!this.verde) k.drawText({ text: "▼", pos: k.vec2(T, T), size: 22, anchor: "center", color: k.rgb(255, 230, 230) });
          else k.drawText({ text: "▲", pos: k.vec2(T, T), size: 22, anchor: "center", color: k.rgb(230, 255, 235) });
        },
      },
    ]);
    // la mecha: zona donde aciertan las monedas
    v.add([k.pos(0, -75), k.rect(2 * T, 85, { fill: false }), k.area(), "mecha", { vela: v }]);
    v.onUpdate(() => {
      if (!v.verde) {
        if (!v.hundiendo && p.pos.dist(v.pos.add(T, 0)) < 280) v.hundiendo = true;
        if (v.hundiendo) v.pos.y += 32 * k.dt();
        if (v.pos.y > inflacionY) { chispas(v.pos.add(T, 0), [255, 90, 90], 8); v.destroy(); }
      } else if (v.pos.y > v.destinoY) {
        v.pos.y = Math.max(v.destinoY, v.pos.y - 110 * k.dt());
      }
    });
    return v;
  }
  VELAS.forEach(([cx, cy, tipo]) => crearVela(cx, cy, tipo === "G"));

  const volverVerde = (v) => {
    if (v.verde) return;
    v.verde = true;
    v.hundiendo = false;
    v.destinoY = v.pos.y - SUBIDA;
    kit.ganarMonedas(1);
    chispas(v.pos.add(T, 0), [120, 255, 150], 10);
    flotante("▲ ALCISTA", v.pos.add(T, -50), [120, 255, 150], 16);
  };
  // las monedas atraviesan las velas verdes y solo se gastan al acertar en una roja
  k.onCollide("liquidez", "mecha", (m, me) => { if (me.vela.verde) return; m.destroy(); volverVerde(me.vela); });
  k.onCollide("liquidez", "vela", (m, v) => { if (v.verde) return; m.destroy(); volverVerde(v); });

  // ---------- inflación ----------
  k.add([k.z(30), {
    draw() {
      const y = inflacionY;
      if (y > kit.alto + 30) return;
      const ola = (x) => y + Math.sin(x / 40 + k.time() * 3) * 6;
      const pts = [];
      for (let x = 0; x <= ANCHO; x += 24) pts.push(k.vec2(x, ola(x)));
      for (let i = 0; i < pts.length - 1; i++) {
        k.drawPolygon({ pts: [pts[i], pts[i + 1], k.vec2(pts[i + 1].x, kit.alto + 300), k.vec2(pts[i].x, kit.alto + 300)], color: k.rgb(200, 30, 50), opacity: 0.88 });
      }
      k.drawLines({ pts, width: 5, color: k.rgb(255, 120, 120) });
      k.drawText({ text: "INFLACIÓN ▲", pos: k.vec2(ANCHO / 2, y + 40), size: 26, anchor: "center", color: k.rgb(255, 220, 220) });
    },
  }]);
  k.wait(0.1, () => (inflacionActiva = true)); // empieza al cerrar el panel (el juego está en pausa mientras)
  k.onUpdate(() => {
    if (!inflacionActiva || maletin || kit.terminado) return;
    inflacionY -= VEL_INFLACION * k.dt();
    const dist = Math.max(0, Math.round((inflacionY - p.pos.y) / T));
    kit.info = `Inflación a ${dist} pisos\nAltura: ${Math.max(0, 47 - Math.round(p.pos.y / T))}/44`;
    if (p.pos.y > inflacionY + 10) kit.fallar("¡La inflación te ha alcanzado!");
  });
  // caer al suelo no mata (la inflación sí); el punto de control solo sirve si te caes muy abajo
  kit.on("reaparecer", () => { if (kit.checkpoint.y > inflacionY) kit.fallar("¡La inflación te ha alcanzado!"); });

  // ---------- impuestos que caen ----------
  const CAIDAS = ["IVA", "IRPF", "-3%", "DEUDA", "€ ↓"];
  k.loop(1.6, () => {
    if (kit.terminado || maletin || !inflacionActiva) return;
    const cam = k.getCamPos();
    const im = k.add([
      k.pos(k.rand(40, ANCHO - 40), cam.y - 300), k.sprite("t_impuesto", { width: 60, height: 34 }), k.anchor("center"), k.rotate(0),
      k.area(), "peligro", "impuesto", "enemigo", { inofensivo: true },
    ]);
    im.add([k.text(k.choose(CAIDAS), { size: 13 }), k.pos(0, 4), k.anchor("center"), k.color(160, 20, 40)]);
    im.onUpdate(() => {
      im.move(Math.sin(k.time() * 3 + im.id) * 50, 150);
      im.angle = Math.sin(k.time() * 4 + im.id) * 15;
      if (im.pos.y > inflacionY) im.destroy();
    });
  });

  p.onCollide("maletin", (m) => {
    if (maletin) return;
    maletin = true;
    chispas(m.pos.add(0, -20), [255, 220, 90], 20);
    m.destroy();
    kit.ganarMonedas(10);
    darObjeto("Maletín de dividendos");
    kit.recompensa = "Maletín de dividendos";
    kit.info = "";
    kit.abrirMeta("¡Maletín de dividendos conseguido!");
  });
}
