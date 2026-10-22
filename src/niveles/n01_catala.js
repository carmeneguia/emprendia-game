// Nivel 1: Catalá — "La Pista Deslizante"
// Tramo 1: bolera con el suelo encerado (resbala).
// Reto: lanzamiento con parábola. Mantén ESPACIO para cargar la fuerza, ↑/↓ para el ángulo,
// suelta para lanzar. 12 bolas para derribar los 10 bolos gigantes repartidos por las plataformas.
import { k, T } from "../k.js";
import { montarNivel, chispas, flotante } from "../nivel.js";
import { lienzo } from "../lienzo.js";
import { PODERES, ALTURA_DISPARO } from "../poderes.js";

const BOLAS = 12;
const COLOR = [255, 110, 214];

export function nivelCatala(indice) {
  const L = lienzo(116);
  // Tramo 1
  L.suelo(0, 24).suelo(28, 45).suelo(49, 115);
  L.fila("#", 10, 14, 9).fila("#", 20, 23, 8).fila("#", 33, 37, 8).fila("#", 41, 43, 5);
  [10, 12, 14].forEach((x) => L.pon("o", x, 8));
  [20, 22].forEach((x) => L.pon("o", x, 7));
  [34, 36].forEach((x) => L.pon("o", x, 7));
  L.pon("o", 42, 4);
  L.pon("B", 18, 11).pon("B", 38, 11).pon("B", 54, 11);
  L.pon("P", 3, 11).pon("K", 58, 11);
  // Reto: estructura de bolos
  L.fila("#", 70, 72, 9).fila("#", 76, 78, 6).fila("#", 82, 84, 9).fila("#", 88, 90, 5).fila("#", 94, 96, 8);
  [[71, 8], [77, 5], [83, 8], [88, 4], [90, 4], [95, 7], [74, 11], [86, 11], [99, 11], [101, 11]].forEach(([x, y]) => L.pon("k", x, y));
  L.columna("|", 104, 7, 11);
  L.pon("M", 110, 11);

  let derribados = 0;
  let bolas = BOLAS;
  let retoActivo = false;
  let cargando = false, tiempoCarga = 0, potencia = 0, angulo = 40;

  const kit = montarNivel({
    indice,
    personaje: "catala",
    mapa: L.filas(),
    resbaladizo: true,
    metaAbierta: false,
    tema: "bolera",
    colorTema: COLOR,
    materiales: { "=": "madera", "#": "madera_neon" },
    textoMetaCerrada: "¡Derriba los 10 bolos para abrir la salida!",
    casillas: { k: (cx, cy) => crearBolo(cx, cy) },
    panelInicio: {
      titulo: "Nivel 1 · La Pista Deslizante",
      subtitulo: "Catalá · Bola Pesada",
      puntos: [
        "La pista está encerada: al soltar las flechas sigues resbalando. Frena con tiempo antes de los huecos.",
        "Pisa a los bichos o lánzales una bola con ESPACIO.",
        "Al final te espera el reto de los 10 bolos gigantes.",
      ],
      controles: [["← + →", "Moverse"], ["↑", "Saltar"], ["ESPACIO", "Lanzar bola"]],
    },
  });

  function crearBolo(cx, cy) {
    return k.add([
      k.pos(cx * T + T / 2, (cy + 1) * T), k.sprite("t_bolo", { width: 28, height: 60 }),
      k.anchor("bot"), k.rotate(0), k.opacity(1), k.area(), "bolo",
    ]);
  }

  const mostrar = () => (kit.info = retoActivo ? `Bolos: ${derribados}/10\nBolas: ${bolas}` : "");

  // ---------- reto ----------
  kit.alPasar(64 * T, async () => {
    kit.checkpoint = kit.pie(64, 11);
    await kit.panel({
      titulo: "Reto · ¡Pleno de 10 bolos!",
      subtitulo: "Calcula la parábola",
      puntos: [
        "Hay 10 bolos gigantes repartidos por las plataformas. Derríbalos todos para abrir la salida.",
        "MANTÉN pulsado ESPACIO para cargar la fuerza: la barra sube y baja. SUELTA en el momento justo.",
        "Mientras cargas, ↑ y ↓ cambian el ángulo. La línea de puntos te enseña por dónde irá la bola.",
        `Tienes ${BOLAS} bolas. Entre lanzamiento y lanzamiento puedes moverte y saltar para buscar mejor posición.`,
      ],
      controles: [["ESPACIO", "Mantener y soltar"], ["↑ + ↓", "Ángulo"], ["← + →", "Moverse"]],
    });
    retoActivo = true;
    mostrar();
  });

  // ESPACIO durante el reto: empezar a cargar
  kit.poderPropio = (p) => {
    if (!retoActivo) return PODERES.catala(kit, p);
    if (bolas <= 0 || cargando) return 0.1;
    cargando = true;
    tiempoCarga = 0;
    p.bloqueado = true;
    return 0.1;
  };

  const vectorSalida = () => {
    const a = (angulo * Math.PI) / 180;
    return k.vec2(Math.cos(a) * kit.jugador.dir, -Math.sin(a)).scale(380 + potencia * 640);
  };
  const origen = () => kit.jugador.pos.add(kit.jugador.dir * 26, -ALTURA_DISPARO - 10);

  k.onUpdate(() => {
    if (!cargando) return;
    const p = kit.jugador;
    tiempoCarga += k.dt();
    potencia = 0.5 - 0.5 * Math.cos(tiempoCarga * 2.8);
    if (k.isKeyDown("up") || k.isKeyDown("w")) angulo = Math.min(80, angulo + 50 * k.dt());
    if (k.isKeyDown("down") || k.isKeyDown("s")) angulo = Math.max(5, angulo - 50 * k.dt());
    if (k.isKeyDown("left") || k.isKeyDown("a")) { p.dir = -1; p.mirar(-1); }
    if (k.isKeyDown("right") || k.isKeyDown("d")) { p.dir = 1; p.mirar(1); }
    p.animar("attack");
  });

  // Dibujo de la parábola y de la barra de fuerza (en el mundo)
  k.add([k.z(40), {
    draw() {
      if (!cargando) return;
      const o = origen(), v = vectorSalida();
      for (let t = 0.05; t < 1.3; t += 0.055) {
        const pt = o.add(v.scale(t)).add(0, 1000 * t * t);
        if (pt.y > kit.alto) break;
        k.drawCircle({ pos: pt, radius: Math.max(2, 4.5 - t * 2), color: k.rgb(255, 255, 255), opacity: Math.max(0.2, 0.9 - t * 0.5), outline: { width: 2, color: k.rgb(27, 23, 38) } });
      }
      const b = kit.jugador.pos.add(-40, -130);
      k.drawRect({ pos: b, width: 80, height: 14, radius: 7, color: k.rgb(27, 23, 38) });
      k.drawRect({ pos: b.add(3, 3), width: Math.max(2, 74 * potencia), height: 8, radius: 4, color: k.rgb(255, Math.round(220 - potencia * 180), 80) });
      k.drawText({ text: `${Math.round(angulo)}°`, pos: b.add(40, -16), size: 14, anchor: "center", color: k.rgb(255, 255, 255) });
    },
  }]);

  k.onKeyRelease("space", () => {
    if (!cargando) return;
    cargando = false;
    const p = kit.jugador;
    p.bloqueado = false;
    bolas--;
    mostrar();
    const bola = k.add([
      k.pos(origen()), k.sprite("t_bola", { width: 36, height: 36 }), k.anchor("center"), k.rotate(0),
      k.area({ collisionIgnore: ["jugador", "poder", "moneda", "meta"] }), k.body(), k.opacity(1), k.lifespan(4.5, { fade: 0.3 }),
      k.z(12), "poder", "bola", "atraviesa", { dir: p.dir },
    ]);
    bola.vel = vectorSalida();
    bola.onUpdate(() => (bola.angle += 540 * bola.dir * k.dt()));
    if (bolas <= 0) k.wait(4.6, () => { if (derribados < 10) kit.fallar("¡Te has quedado sin bolas!"); });
  });

  k.onCollide("bola", "bolo", (bola, b) => {
    if (b.caido) return;
    b.caido = true;
    derribados++;
    kit.ganarMonedas(1);
    mostrar();
    chispas(b.pos.add(0, -30), [255, 255, 255], 8);
    flotante(derribados === 10 ? "¡PLENO!" : `${derribados}`, b.pos.add(0, -70), COLOR, 22);
    const dir = bola.dir ?? 1;
    k.tween(0, 90 * dir, 0.35, (a) => (b.angle = a), k.easings.easeInQuad).onEnd(() => {
      k.tween(1, 0, 0.3, (v) => (b.opacity = v)).onEnd(() => b.destroy());
    });
    if (derribados >= 10) {
      retoActivo = false;
      kit.poderPropio = null;
      kit.info = "¡Pleno!";
      kit.abrirMeta("¡PLENO! La salida está abierta");
    }
  });
}
