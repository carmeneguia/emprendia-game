// Nivel 7: Bugarín — "La Ruta de Dijkstra"
// Reto de DECISIÓN: el camino se divide en 3 alturas con un coste cada una.
// Empiezas con 20 de energía. El Escáner (ESPACIO) ilumina la plataforma de menor coste,
// abre su compuerta y derrumba los caminos falsos. La energía que sobra se convierte en monedas.
import { k, T } from "../k.js";
import { montarNivel, chispas, flotante } from "../nivel.js";
import { lienzo } from "../lienzo.js";

const COLOR = [180, 140, 255];
const ENERGIA_INICIAL = 20;
const FILAS = [5, 8, 11]; // arriba, medio, abajo
const SECCIONES = [
  [9, 2, 15],
  [3, 12, 7],
  [15, 9, 4],
  [2, 11, 16],
];
const ANCHO_CARRIL = 12;
const PASO = 18; // columnas entre el inicio de una sección y la siguiente
const INICIO = 13;

export function nivelBugarin(indice) {
  const finUltima = INICIO + (SECCIONES.length - 1) * PASO + ANCHO_CARRIL;
  const L = lienzo(finUltima + 18);
  L.suelo(0, INICIO - 1);
  L.pon("J", 9, 11);
  SECCIONES.forEach((_, i) => {
    const xs = INICIO + i * PASO;
    if (i < SECCIONES.length - 1) {
      L.suelo(xs + ANCHO_CARRIL, xs + PASO - 1);
      L.pon("J", xs + ANCHO_CARRIL + 3, 11);
    }
  });
  L.suelo(finUltima, finUltima + 17);
  L.pon("P", 2, 11).pon("M", finUltima + 12, 11);

  let energia = ENERGIA_INICIAL;
  const secciones = [];

  const kit = montarNivel({
    indice,
    personaje: "bugarin",
    mapa: L.filas(),
    tema: "castillo",
    colorTema: COLOR,
    materiales: { "=": "ladrillo" },
    casillas: {
      J: (cx, cy) => k.add([k.pos(cx * T + T / 2, (cy + 1) * T), k.sprite("t_trampolin", { width: 44, height: 20 }), k.anchor("bot"), k.area(), k.scale(1), "trampolin"]),
    },
    panelInicio: {
      titulo: "Nivel 7 · La Ruta de Dijkstra",
      subtitulo: "Bugarín · Escáner Heurístico",
      puntos: [
        "Muévete con ← → y salta con ↑, como siempre.",
        "El camino se divide en 3 alturas. Cada plataforma tiene un COSTE. Empiezas con 20 de energía y cada plataforma que pisas te resta su coste.",
        "Pulsa ESPACIO (Escáner) al acercarte a cada cruce: ilumina en VERDE la ruta más barata, abre su compuerta y derrumba los caminos más caros.",
        "La ruta más barata tiene una compuerta cerrada: si no escaneas no puedes pasar, y empujarla te quita energía.",
        "Los trampolines amarillos te lanzan hasta la plataforma de arriba. La energía que te sobre se convierte en monedas.",
      ],
      controles: [["ESPACIO", "Escanear"], ["↑", "Saltar"], ["← + →", "Moverse"]],
    },
  });

  // Barra de energía
  k.add([k.fixed(), k.z(101), {
    draw() {
      const x = 960 - 280, y = 20, w = 250;
      k.drawRect({ pos: k.vec2(x, y), width: w, height: 30, radius: 15, color: k.rgb(27, 23, 38), outline: { width: 3, color: k.rgb(...COLOR) } });
      const frac = Math.max(0, energia) / ENERGIA_INICIAL;
      k.drawRect({ pos: k.vec2(x + 4, y + 4), width: Math.max(0, (w - 8) * frac), height: 22, radius: 11, color: frac > 0.5 ? k.rgb(120, 255, 160) : frac > 0.25 ? k.rgb(255, 210, 80) : k.rgb(255, 90, 90) });
      k.drawText({ text: `Energía ${Math.max(0, energia)}/${ENERGIA_INICIAL}`, pos: k.vec2(x + w / 2, y + 15), size: 15, anchor: "center", color: k.rgb(27, 23, 38) });
    },
  }]);

  kit.jugador.onCollide("trampolin", (t) => {
    kit.jugador.jump(1100);
    k.tween(k.vec2(1.2, 0.6), k.vec2(1, 1), 0.3, (s) => (t.scale = s), k.easings.easeOutBack);
  });

  SECCIONES.forEach((costes, i) => {
    const xs = (INICIO + i * PASO) * T;
    const min = Math.min(...costes);
    const sec = { carriles: [], escaneada: false, xs };
    costes.forEach((coste, c) => {
      const y = FILAS[c] * T;
      const car = k.add([
        k.pos(xs, y), k.rect(ANCHO_CARRIL * T, T, { fill: false }), k.opacity(1), k.area(), k.body({ isStatic: true }), "suelo", "carril",
        { coste, pagado: false, optimo: coste === min, falso: coste >= 15, iluminado: false },
        {
          draw() {
            const ilum = this.iluminado;
            const base = ilum ? k.rgb(70, 190, 110) : k.rgb(110, 85, 150), luz = ilum ? k.rgb(150, 255, 180) : k.rgb(170, 145, 210);
            k.drawRect({ width: ANCHO_CARRIL * T, height: T, radius: 8, color: base, opacity: this.opacity, outline: { width: 3, color: k.rgb(27, 23, 38) } });
            k.drawRect({ pos: k.vec2(4, 4), width: ANCHO_CARRIL * T - 8, height: 7, radius: 4, color: luz, opacity: this.opacity });
            for (let x = 40; x < ANCHO_CARRIL * T; x += 40) k.drawLine({ p1: k.vec2(x, 6), p2: k.vec2(x, T - 6), width: 2, color: k.rgb(27, 23, 38), opacity: 0.25 * this.opacity });
            // cartel con el coste
            k.drawRect({ pos: k.vec2(ANCHO_CARRIL * T / 2 - 60, -40), width: 120, height: 32, radius: 10, color: k.rgb(36, 22, 58), opacity: this.opacity, outline: { width: 3, color: ilum ? k.rgb(140, 255, 170) : k.rgb(...COLOR) } });
            k.drawText({ text: `Coste ${coste}`, pos: k.vec2(ANCHO_CARRIL * T / 2, -24), size: 17, anchor: "center", color: k.rgb(255, 255, 255), opacity: this.opacity });
          },
        },
      ]);
      if (car.optimo) car.compuerta = k.add([k.pos(xs + 2 * T, y), k.sprite("t_compuerta", { width: 20, height: 2 * T }), k.anchor("botleft"), k.area(), k.body({ isStatic: true }), "suelo", "compuerta"]);
      sec.carriles.push(car);
    });
    secciones.push(sec);
    kit.alPasar(xs - 5 * T, () => (kit.checkpoint = k.vec2(xs - 4 * T, 12 * T)));
  });

  kit.jugador.onUpdate(() => {
    const p = kit.jugador;
    const pl = p.isGrounded() ? p.curPlatform() : null;
    if (!pl?.is("carril") || pl.pagado || kit.terminado) return;
    pl.pagado = true;
    energia -= pl.coste;
    flotante(`-${pl.coste}`, p.pos.add(0, -110), pl.optimo ? [140, 255, 160] : [255, 110, 110], 24);
    if (!pl.optimo) k.shake(3);
    if (energia <= 0) kit.fallar("Energía agotada:\nese no era el camino más corto");
  });

  // Atascado contra una compuerta: pierdes energía poco a poco
  let goteo = 0;
  kit.jugador.onCollideUpdate("compuerta", () => {
    goteo += k.dt();
    if (goteo > 0.5) {
      goteo = 0;
      energia -= 1;
      flotante("-1", kit.jugador.pos.add(0, -110), [255, 110, 110]);
      if (energia <= 0) kit.fallar("Energía agotada contra la compuerta");
    }
  });

  kit.on("escaner", (p) => {
    const sec = secciones.find((s) => !s.escaneada && p.pos.x > s.xs - 12 * T && p.pos.x < s.xs + ANCHO_CARRIL * T);
    if (!sec) { flotante("Nada que escanear aquí", p.pos.add(0, -110), [200, 200, 220], 14); return; }
    sec.escaneada = true;
    const debajo = p.isGrounded() ? p.curPlatform() : null;
    sec.carriles.forEach((c) => {
      if (c.optimo) {
        c.iluminado = true;
        if (c.compuerta?.exists()) { chispas(c.compuerta.pos.add(10, -T), [255, 140, 240], 12); c.compuerta.destroy(); }
      } else if (c.falso && c !== debajo) {
        k.tween(1, 0, 0.5, (v) => (c.opacity = v));
        k.wait(0.5, () => { chispas(c.pos.add(ANCHO_CARRIL * T / 2, T / 2), [180, 140, 255], 16); c.destroy(); });
      }
    });
    kit.aviso("Ruta óptima encontrada", [140, 255, 160], 1);
  });

  kit.alPasar((finUltima + 2) * T, () => {
    if (energia > 0) { kit.ganarMonedas(energia); kit.aviso(`¡Ruta de Dijkstra completada!\nBonus: +${energia} monedas`, [140, 255, 160], 2); }
  });
}
