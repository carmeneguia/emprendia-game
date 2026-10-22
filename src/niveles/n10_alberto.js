// Nivel 10: Alberto (Redes) — "Caza de Contenedores Docker"
// Reto de EXPLORACIÓN: la Ballena de Docker está escondida en una de las cajas "?" del puerto.
// Ábrelas con el Ping (ESPACIO) o con un cabezazo. Los Bots de Autómatas patrullan y disparan
// bolas de estado (q0, q1, q2). Cada 20 segundos llega otro bot: date prisa antes de que te acorralen.
import { k, T } from "../k.js";
import { montarNivel, chispas, flotante } from "../nivel.js";
import { lienzo } from "../lienzo.js";
import { darObjeto } from "../estado.js";
import { crearFigura } from "../figura.js";

const COLOR = [80, 200, 255];
const TIEMPO = 120;

export function nivelAlberto(indice) {
  const L = lienzo(124);
  L.suelo(0, 30).suelo(34, 66).suelo(70, 123);
  // pilas de contenedores de colores
  const colores = ["C", "Q", "G"];
  [[12, 3, 2], [22, 4, 2], [40, 2, 3], [52, 3, 2], [60, 5, 2], [78, 3, 3], [90, 4, 2], [100, 2, 2]].forEach(([x, alto, ancho], i) => {
    for (let y = 12 - alto; y < 12; y++) L.fila(colores[(i + y) % 3], x, x + ancho - 1, y);
  });
  // cajas misteriosas
  [[7, 8], [17, 8], [27, 7], [36, 8], [46, 7], [57, 5], [74, 8], [84, 7], [95, 6], [105, 8]].forEach(([x, y]) => L.pon("?", x, y));
  L.pon("o", 13, 7).pon("o", 23, 6).pon("o", 61, 5).pon("o", 91, 6);
  L.pon("P", 2, 11).pon("K", 64, 11).pon("M", 118, 11);
  L.columna("|", 112, 7, 11);

  let ballenaLibre = false;
  let abiertas = 0;

  const kit = montarNivel({
    indice,
    personaje: "alberto",
    mapa: L.filas(),
    metaAbierta: false,
    tema: "puerto",
    colorTema: COLOR,
    velo: 0.05,
    materiales: { "=": "hormigon", C: "cont_azul", Q: "cont_rojo", G: "cont_verde" },
    solidos: { C: { etiquetas: ["suelo"] }, Q: { etiquetas: ["suelo"] }, G: { etiquetas: ["suelo"] } },
    textoMetaCerrada: "Libera primero a la Ballena de Docker",
    casillas: { "?": (cx, cy) => crearCaja(cx, cy) },
    panelInicio: {
      titulo: "Nivel 10 · Caza de Contenedores Docker",
      subtitulo: "Alberto · Ping de Red",
      puntos: [
        "La Ballena de Docker está escondida dentro de UNA de las 10 cajas ? del puerto. ¡Cada partida está en un sitio distinto!",
        "Abre las cajas con el Ping (ESPACIO) o dándoles un cabezazo desde abajo. Pueden tener monedas, nada... o un bot.",
        "Los Bots de Autómatas disparan bolas de estado (q0, q1, q2) a ras de suelo: sáltalas. El Ping aturde a los bots 2 segundos.",
        `Cada 20 segundos llega un bot nuevo. Tienes ${TIEMPO / 60} minutos antes de que te acorralen. ¡No caigas al agua!`,
      ],
      controles: [["← + →", "Moverse"], ["↑", "Saltar / cabezazo"], ["ESPACIO", "Ping"]],
    },
  });

  // Agua entre los muelles
  [[31, 33], [67, 69]].forEach(([a, b]) => {
    const w = (b - a + 1) * T;
    k.add([k.pos(a * T, 12 * T + 14), k.rect(w, 2 * T, { fill: false }), k.area(), "agua", k.z(3), {
      draw() {
        const pts = [];
        for (let x = 0; x <= w; x += 10) pts.push(k.vec2(x, Math.sin(x / 18 + k.time() * 3) * 4));
        for (let i = 0; i < pts.length - 1; i++) k.drawPolygon({ pts: [pts[i], pts[i + 1], k.vec2(pts[i + 1].x, 80), k.vec2(pts[i].x, 80)], color: k.rgb(40, 110, 190) });
        k.drawLines({ pts, width: 4, color: k.rgb(170, 220, 255) });
      },
    }]);
  });
  kit.jugador.onCollide("agua", () => kit.morir());

  // Una caja al azar esconde la ballena
  const cajas = k.get("caja");
  const conBallena = k.choose(cajas);
  conBallena.contenido = "ballena";
  cajas.filter((c) => c !== conBallena).forEach((c, i) => (c.contenido = ["moneda", "vacia", "bot", "moneda", "vacia"][i % 5]));

  function crearCaja(cx, cy) {
    const c = k.add([k.pos(cx * T, cy * T), k.sprite("t_caja", { width: T, height: T }), k.area(), k.body({ isStatic: true }), "suelo", "caja", { abierta: false }]);
    const y0 = cy * T;
    c.onUpdate(() => { if (!c.abierta && !c.saltando) c.pos.y = y0 + Math.sin(k.time() * 3 + cx) * 1.5; });
    return c;
  }

  function abrir(c) {
    if (c.abierta) return;
    c.abierta = true;
    abiertas++;
    c.unuse("sprite");
    c.use(k.sprite("t_caja_abierta", { width: T, height: T }));
    c.saltando = true;
    const y0 = c.pos.y;
    k.tween(y0 - 10, y0, 0.2, (y) => (c.pos.y = y)).onEnd(() => (c.saltando = false));
    const arriba = c.pos.add(T / 2, -10);
    if (c.contenido === "ballena") return liberarBallena(arriba);
    if (c.contenido === "moneda") {
      kit.ganarMonedas(3);
      chispas(arriba, [255, 220, 90], 10);
      flotante("+3", arriba, [255, 230, 90], 20);
    } else if (c.contenido === "bot") {
      crearBot(k.vec2(c.pos.x + T / 2, 12 * T), k.chance(0.5));
      kit.aviso("¡Era una trampa!", [255, 140, 90], 1);
    } else {
      flotante("vacía", arriba, [230, 230, 240], 15);
    }
  }

  function liberarBallena(pos) {
    ballenaLibre = true;
    reloj.parar();
    const b = k.add([k.pos(pos), k.sprite("t_ballena", { width: 150, height: 100 }), k.anchor("center"), k.z(30)]);
    chispas(pos, [120, 200, 255], 30);
    k.tween(b.pos.y, b.pos.y - 140, 1.2, (y) => (b.pos.y = y), k.easings.easeOutQuad);
    b.onUpdate(() => (b.angle = Math.sin(k.time() * 2) * 4));
    b.use(k.rotate(0));
    darObjeto("Ballena de Docker");
    kit.recompensa = "Llaves de la fortaleza de EmprendIA";
    k.get("bot").forEach((bt) => { bt.aturdido = 99; });
    kit.info = "";
    kit.abrirMeta("¡Ballena de Docker liberada!\nLas puertas de la fortaleza se abren");
  }

  k.onCollide("ping", "caja", (pg, c) => { pg.destroy(); abrir(c); });
  kit.jugador.onCollide("caja", (c, col) => { if (col?.isTop?.()) abrir(c); });

  // Bots de Autómatas: el bajito calvo y el alto de pelo largo
  function crearBot(pos, alto) {
    const b = crearFigura(alto ? "bot_alto" : "bot_calvo", [k.pos(pos), k.area(), k.body(), "bot", { dir: -1, x0: pos.x, aturdido: 0, recarga: k.rand(1, 2.5) }], { ancho: 34, alto: alto ? 76 : 60 });
    const estrellas = b.add([k.pos(0, alto ? -120 : -100), k.z(5), { draw() { if (b.aturdido > 0 && b.aturdido < 50) for (let i = 0; i < 3; i++) { const an = k.time() * 4 + i * 2.1; k.drawSprite({ sprite: "t_estrella", pos: k.vec2(Math.cos(an) * 22, Math.sin(an) * 6), width: 16, height: 16, anchor: "center" }); } } }]);
    b.onUpdate(() => {
      if (b.pos.y > kit.alto + 100) return b.destroy();
      if (b.aturdido > 0) { b.aturdido -= k.dt(); b.animar("idle"); return; }
      b.move(b.dir * 60, 0);
      b.mirar(b.dir);
      b.animar("walk");
      if (b.pos.x < b.x0 - 120) b.dir = 1;
      if (b.pos.x > b.x0 + 120) b.dir = -1;
      const p = kit.jugador;
      b.recarga -= k.dt();
      if (b.recarga <= 0 && Math.abs(p.pos.x - b.pos.x) < 520 && !kit.terminado) {
        b.recarga = 2.2;
        const d = Math.sign(p.pos.x - b.pos.x) || -1;
        b.mirar(d);
        b.animar("attack", true);
        const bola = k.add([k.pos(b.pos.add(d * 26, -16)), k.circle(14), k.color(255, 255, 255), k.outline(3, k.rgb(27, 23, 38)), k.anchor("center"), k.area(), k.offscreen({ destroy: true, distance: 400 }), "peligro", "bola_estado"]);
        bola.add([k.text(k.choose(["q0", "q1", "q2"]), { size: 12 }), k.anchor("center"), k.color(27, 23, 38)]);
        bola.onUpdate(() => bola.move(d * 240, 0));
      }
    });
    return b;
  }
  [[25, true], [48, false], [86, true]].forEach(([cx, alto]) => crearBot(kit.pie(cx, 11), alto));
  kit.jugador.onCollide("bot", () => kit.herir());
  k.onCollide("ping", "bot", (pg, b) => { pg.destroy(); b.aturdido = 2; flotante("¡Aturdido!", b.pos.add(0, -120), [255, 230, 90], 14); });
  k.onCollide("ping", "bola_estado", (pg, bo) => { pg.destroy(); chispas(bo.pos, [255, 255, 255], 6); bo.destroy(); });

  const reloj = kit.cuentaAtras(TIEMPO, () => kit.fallar("¡Los bots te han acorralado!"), "Tiempo");
  k.onUpdate(() => { kit.infoExtra = `Cajas abiertas: ${abiertas}/${cajas.length}`; });
  let primeraVez = true; // k.loop se ejecuta también al empezar: la primera vez no llega nadie
  k.loop(20, () => {
    if (primeraVez) return (primeraVez = false);
    if (ballenaLibre || kit.terminado) return;
    const p = kit.jugador;
    crearBot(k.vec2(Math.min(kit.ancho - 60, p.pos.x + 460), 11 * T), k.chance(0.5));
    kit.aviso("¡Llega otro bot!", [255, 140, 90], 1);
  });
}
