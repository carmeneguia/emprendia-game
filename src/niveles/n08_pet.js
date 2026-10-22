// Nivel 8: PET — "La Tienda Blanca y Azul y el Bug Final"
// Tramo 1: tienda de ropa. Las camisetas blancas y vaqueros azules que recoges visten a la plantilla.
// Reto de DEFENSA: el Ordenador Gigante escupe Bugs rojos (SegFault) que corren hacia la plantilla.
// Destruye 10 con el Depurador antes de que 3 lleguen a la plantilla. Salta las líneas de código verdes.
import { k, T } from "../k.js";
import { montarNivel, crearBicho, chispas, flotante } from "../nivel.js";
import { lienzo } from "../lienzo.js";

const COLOR = [80, 160, 255];
const BUGS_OBJETIVO = 10;
const INFECCIONES_MAX = 3;
const X_PLANTILLA = 69 * T; // línea que no deben cruzar los bugs

export function nivelPet(indice) {
  const L = lienzo(100);
  L.suelo(0, 99);
  // percheros
  L.fila("h", 8, 12, 9).fila("h", 16, 19, 6).fila("h", 23, 27, 9).fila("h", 31, 34, 6).fila("h", 38, 42, 9).fila("h", 46, 49, 6);
  [[10, 8, "c"], [17, 5, "v"], [25, 8, "c"], [32, 5, "v"], [40, 8, "c"], [47, 5, "v"], [14, 11, "c"], [29, 11, "v"], [44, 11, "c"], [36, 11, "v"]]
    .forEach(([x, y, t]) => L.pon(t, x, y));
  L.pon("B", 21, 11).pon("B", 36, 11);
  L.pon("P", 2, 11).pon("K", 58, 11);
  L.pon("M", 80, 11);

  const plantilla = [];
  let bugs = 0;
  let infecciones = 0;
  let maquinaActiva = false;

  const kit = montarNivel({
    indice,
    personaje: "pet",
    mapa: L.filas(),
    metaAbierta: false,
    tema: "tienda",
    colorTema: COLOR,
    velo: 0.05,
    materiales: { "=": "baldosa", h: "percha" },
    solidos: { h: { etiquetas: ["suelo", "plataforma"] } },
    textoMetaCerrada: `Destruye ${BUGS_OBJETIVO} Bugs rojos`,
    casillas: {
      c: (cx, cy) => prenda(cx, cy, "camiseta"),
      v: (cx, cy) => prenda(cx, cy, "vaquero"),
    },
    panelInicio: {
      titulo: "Nivel 8 · La Tienda Blanca y Azul",
      subtitulo: "PET · Depurador de Punteros",
      puntos: [
        "Atraviesa la tienda saltando entre los percheros.",
        "Recoge las camisetas BLANCAS y los vaqueros AZULES: cada prenda viste a un miembro de la plantilla que espera al final del pasillo.",
        "Elimina los bichos con el Depurador (ESPACIO) o pisándolos.",
        "Al final te espera el Ordenador Gigante.",
      ],
      controles: [["← + →", "Moverse"], ["↑", "Saltar"], ["ESPACIO", "Depurador"]],
    },
  });

  function prenda(cx, cy, tipo) {
    const camiseta = tipo === "camiseta";
    const o = k.add([
      k.pos(cx * T + T / 2, cy * T + T / 2), k.sprite(camiseta ? "t_camiseta" : "t_vaquero", { width: camiseta ? 40 : 30, height: camiseta ? 34 : 42 }),
      k.anchor("center"), k.rotate(0), k.area(), "prenda", { tipo },
    ]);
    const y0 = o.pos.y;
    o.onUpdate(() => { o.pos.y = y0 + Math.sin(k.time() * 3 + cx) * 4; o.angle = Math.sin(k.time() * 2 + cx) * 8; });
    return o;
  }

  // La plantilla espera detrás de la línea de defensa
  for (let i = 0; i < 6; i++) {
    const x = 61 * T + i * 30;
    const m = k.add([k.pos(x, 12 * T), k.sprite("t_maniqui", { width: 40, height: 92 }), k.anchor("bot"), k.z(1), { arriba: false, abajo: false }]);
    m.parteArriba = m.add([k.sprite("t_maniqui_arriba", { width: 40, height: 92 }), k.anchor("bot")]);
    m.parteAbajo = m.add([k.sprite("t_maniqui_abajo", { width: 40, height: 92 }), k.anchor("bot")]);
    m.parteArriba.hidden = true;
    m.parteAbajo.hidden = true;
    plantilla.push(m);
  }
  // línea de defensa
  k.add([k.pos(X_PLANTILLA, 12 * T), k.z(-2), {
    draw() {
      if (!maquinaActiva) return;
      for (let y = 0; y < 200; y += 20) k.drawRect({ pos: k.vec2(-3, -y - 14), width: 6, height: 12, radius: 3, color: k.rgb(255, 80, 100), opacity: 0.7 });
      k.drawText({ text: "PLANTILLA", pos: k.vec2(-10, -220), size: 14, anchor: "right", color: k.rgb(47, 111, 214) });
    },
  }]);

  const vestidos = () => plantilla.filter((m) => m.arriba && m.abajo).length;
  kit.info = `Plantilla vestida: 0/${plantilla.length}`;

  kit.jugador.onCollide("prenda", (o) => {
    chispas(o.pos, o.tipo === "camiseta" ? [255, 255, 255] : [80, 140, 255], 8);
    o.destroy();
    kit.ganarMonedas(1);
    const m = plantilla.find((m) => (o.tipo === "camiseta" ? !m.arriba : !m.abajo));
    if (m) {
      if (o.tipo === "camiseta") { m.arriba = true; m.parteArriba.hidden = false; }
      else { m.abajo = true; m.parteAbajo.hidden = false; }
      flotante(o.tipo === "camiseta" ? "+ camiseta" : "+ vaquero", kit.jugador.pos.add(0, -110), COLOR, 15);
    }
    if (!maquinaActiva) kit.info = `Plantilla vestida: ${vestidos()}/${plantilla.length}`;
  });

  // Ordenador Gigante
  const pc = k.add([k.pos(85 * T, 12 * T), k.sprite("t_ordenador", { width: 230, height: 260 }), k.anchor("bot")]);
  const pantalla = k.add([k.pos(85 * T - 115 + 24, 12 * T - 260 + 24), k.z(1), { mal: false,
    draw() {
      const c = this.mal ? k.rgb(200, 30, 50) : k.rgb(30, 140, 80);
      k.drawRect({ width: 182, height: 140, radius: 10, color: c });
      const t = this.mal ? "SEGFAULT" : "OK";
      k.drawText({ text: t, pos: k.vec2(91, 60), size: 28, anchor: "center", color: k.rgb(255, 255, 255) });
      if (this.mal) for (let i = 0; i < 4; i++) k.drawRect({ pos: k.vec2(0, (k.time() * 160 + i * 40) % 140), width: 182, height: 4, color: k.rgb(255, 255, 255), opacity: 0.25 });
    } }]);

  function escupir() {
    if (!maquinaActiva || kit.terminado) return;
    if (k.chance(0.62)) {
      const b = crearBicho(kit, k.vec2(pc.pos.x - 120, 12 * T), { dir: -1, vel: k.rand(100, 150), rango: 0, texto: "SegFault", color: [255, 160, 160] });
      b.tag("segfault");
      // algunos bugs saltan
      if (k.chance(0.35)) b.onUpdate(() => { if (b.isGrounded() && k.chance(0.01)) b.jump(600); });
    } else {
      const l = k.add([
        k.pos(pc.pos.x - 120, 12 * T - 16), k.sprite("t_linea", { width: 80, height: 18 }), k.anchor("center"),
        k.area(), k.offscreen({ destroy: true, distance: 600 }), "linea_verde", "peligro",
      ]);
      l.onUpdate(() => l.move(-260, 0));
    }
    k.wait(k.rand(0.9, 1.5), escupir);
  }

  // Bugs que llegan a la plantilla
  k.onUpdate(() => {
    if (!maquinaActiva) return;
    k.get("segfault").forEach((b) => {
      if (b.pos.x < X_PLANTILLA) {
        chispas(b.pos, [255, 60, 80], 14);
        b.destroy();
        infecciones++;
        k.shake(6);
        const m = plantilla[Math.min(plantilla.length - 1, infecciones - 1)];
        m.use(k.color(255, 120, 120));
        kit.aviso(`¡Un bug ha infectado a la plantilla! (${infecciones}/${INFECCIONES_MAX})`, [255, 120, 120], 1.3);
        if (infecciones >= INFECCIONES_MAX) kit.fallar("¡La plantilla está infectada!");
      }
    });
    k.get("linea_verde").forEach((l) => { if (l.pos.x < X_PLANTILLA) l.destroy(); });
    kit.info = `Bugs: ${bugs}/${BUGS_OBJETIVO}\nInfecciones: ${infecciones}/${INFECCIONES_MAX}`;
  });

  kit.alPasar(66 * T, async () => {
    kit.checkpoint = kit.pie(72, 11);
    await kit.panel({
      titulo: "Reto · El Bug Final",
      subtitulo: "Defiende a la plantilla",
      puntos: [
        "El Ordenador Gigante escupe Bugs rojos (SegFault) que corren hacia la plantilla.",
        `Si ${INFECCIONES_MAX} bugs cruzan la línea roja y llegan a la plantilla, ¡la infectan y repites!`,
        "También lanza líneas de código verdes a ras de suelo: sáltalas (hacen daño y no se pueden destruir). Algunos bugs saltan.",
        `Destruye ${BUGS_OBJETIVO} Bugs con el Depurador (ESPACIO) o pisándolos para ganar.`,
      ],
      controles: [["ESPACIO", "Depurador"], ["↑", "Saltar"], ["← + →", "Moverse"]],
    });
    maquinaActiva = true;
    pantalla.mal = true;
    escupir();
  });

  kit.on("enemigo_muerto", (e) => {
    if (!e.is("segfault") || !maquinaActiva) return;
    bugs++;
    if (bugs >= BUGS_OBJETIVO) {
      maquinaActiva = false;
      pantalla.mal = false;
      k.get("segfault").forEach((b) => b.destroy());
      k.get("linea_verde").forEach((l) => l.destroy());
      kit.info = "";
      abrazo();
      kit.abrirMeta("¡Bug Final eliminado!\nPET reparte abrazos");
    }
  });

  function abrazo() {
    const p = kit.jugador;
    for (let i = 0; i < 16; i++) k.wait(i * 0.08, () => k.add([k.pos(p.pos.add(k.rand(-50, 50), -100)), k.sprite("t_corazon", { width: 26, height: 24 }), k.anchor("center"), k.opacity(1), k.move(k.UP, 90), k.lifespan(1.1, { fade: 0.5 }), k.z(60)]));
    plantilla.forEach((m, i) => k.wait(i * 0.1, () => k.tween(m.pos.y, m.pos.y - 30, 0.25, (y) => (m.pos.y = y)).onEnd(() => k.tween(m.pos.y, m.pos.y + 30, 0.25, (y) => (m.pos.y = y)))));
  }
}
