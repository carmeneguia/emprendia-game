// Nivel 5: Guardián de las Bases — "El Foso del DROP TABLE"
// Reto de RITMO: las bases de datos tienen un DROP TABLE activo. Al aterrizar empieza una cuenta atrás
// (anillo) y la base se cae, salvo que hagas COMMIT (ESPACIO) a tiempo.
// El martillo también rompe muros de datos corruptos. Al final, golpea el Altar para obtener el Código SQL.
import { k, T } from "../k.js";
import { montarNivel, chispas, flotante } from "../nivel.js";
import { lienzo } from "../lienzo.js";
import { darObjeto, tieneObjeto } from "../estado.js";

const MARGEN_COMMIT = 0.9; // segundos para hacer COMMIT antes de que la base caiga
const COLOR = [110, 200, 255];

const BASES = [[13, 11], [17, 10], [21, 11], [25, 9], [29, 10], [33, 11], [37, 10],
  [50, 10], [54, 9], [58, 11], [62, 10], [66, 9], [70, 10], [74, 11], [78, 10]];

export function nivelBases(indice) {
  const L = lienzo(100);
  L.suelo(0, 10).suelo(40, 47).suelo(81, 99);
  BASES.forEach(([x, y]) => L.pon("S", x, y));
  L.columna("X", 44, 9, 11);
  L.pon("o", 25, 8).pon("o", 54, 8).pon("o", 66, 8);
  L.pon("A", 87, 11);
  L.columna("|", 92, 7, 11);
  L.pon("P", 3, 11).pon("K", 41, 11).pon("M", 96, 11);

  let sqlObtenido = false;
  let racha = 0;

  const kit = montarNivel({
    indice,
    personaje: "bases",
    mapa: L.filas(),
    metaAbierta: false,
    tema: "sql",
    colorTema: COLOR,
    materiales: { "=": "tech", "#": "tech" },
    textoMetaCerrada: "Golpea el Altar con COMMIT para obtener el Código SQL",
    casillas: {
      S: (cx, cy) => crearBase(cx, cy),
      X: (cx, cy) => k.add([k.pos(cx * T, cy * T), k.sprite("t_muro_corrupto", { width: T, height: T }), k.area(), k.body({ isStatic: true }), "suelo", "muro_corrupto"]),
      A: (cx, cy) => k.add([k.pos(cx * T + T / 2, (cy + 1) * T), k.sprite("t_altar", { width: 90, height: 90 }), k.anchor("bot"), k.color(255, 255, 255), k.area(), "altar"]),
    },
    panelInicio: {
      titulo: "Nivel 5 · El Foso del DROP TABLE",
      subtitulo: "Guardián de las Bases · Martillo COMMIT",
      puntos: [
        "Cruza el foso saltando de una base de datos a otra.",
        "Todas tienen un DROP TABLE activo: en cuanto aterrizas aparece un ANILLO que se vacía. Cuando se acaba, la base se cae al vacío contigo encima.",
        "Pulsa ESPACIO nada más aterrizar para hacer COMMIT: la base se vuelve verde y ya no se cae.",
        "Si encadenas COMMITs sin fallar, ganas monedas extra.",
        "El martillo también rompe los muros de datos corruptos (NULL). Al final, golpea el Altar para conseguir el Código SQL.",
      ],
      controles: [["← + →", "Moverse"], ["↑", "Saltar"], ["ESPACIO", "COMMIT"]],
    },
  });

  function crearBase(cx, cy) {
    const b = k.add([
      k.pos(cx * T, cy * T), k.rect(2 * T, T, { fill: false }), k.area(), k.body({ isStatic: true }), "suelo", "base",
      { fijada: false, cuenta: -1, vy: 0, cayendo: false },
    ]);
    b.dibujo = b.add([k.sprite("t_base_db", { width: 2 * T, height: 44 }), k.pos(0, -4), k.color(150, 180, 255)]);
    b.add([k.z(20), {
      draw() {
        if (b.cuenta < 0 || b.fijada || b.cayendo) return;
        const frac = b.cuenta / MARGEN_COMMIT;
        k.drawCircle({ pos: k.vec2(T, -30), radius: 16, color: k.rgb(27, 23, 38), opacity: 0.8 });
        const pts = [];
        for (let a = 0; a <= frac * 360; a += 12) { const r = (a - 90) * Math.PI / 180; pts.push(k.vec2(T + Math.cos(r) * 12, -30 + Math.sin(r) * 12)); }
        if (pts.length > 1) k.drawLines({ pts, width: 5, color: k.rgb(255, Math.round(80 + frac * 170), 80) });
      },
    }]);
    b.onUpdate(() => {
      if (b.fijada) return;
      if (b.cayendo) {
        b.vy += 1400 * k.dt();
        b.pos.y += b.vy * k.dt();
        if (b.pos.y > kit.alto + 100) b.destroy();
        return;
      }
      const rapido = b.cuenta >= 0 ? 18 : 4;
      b.dibujo.color = Math.sin(k.time() * rapido + cx) > 0 ? k.rgb(150, 180, 255) : k.rgb(255, 120, 140);
      if (b.cuenta >= 0) {
        b.cuenta -= k.dt();
        if (b.cuenta < 0) { b.cayendo = true; racha = 0; flotante("DROP TABLE", b.pos.add(T, -20), [255, 120, 140], 16); }
      }
    });
    return b;
  }

  const fijar = (b) => {
    if (b.fijada || b.cayendo) return;
    b.fijada = true;
    b.dibujo.color = k.rgb(120, 255, 160);
    racha++;
    kit.ganarMonedas(racha >= 3 ? 2 : 1);
    chispas(b.pos.add(T, 0), [120, 255, 160], 12);
    flotante(racha >= 3 ? `COMMIT ✓ x${racha}` : "COMMIT ✓", b.pos.add(T, -40), [140, 255, 170], 18);
  };

  // Al aterrizar en una base empieza la cuenta atrás
  kit.jugador.onUpdate(() => {
    const p = kit.jugador;
    const pl = p.isGrounded() ? p.curPlatform() : null;
    if (pl?.is("base") && !pl.fijada && !pl.cayendo && pl.cuenta < 0) pl.cuenta = MARGEN_COMMIT;
  });

  k.onCollide("commit", "base", (_, b) => fijar(b));
  kit.on("commit", (p) => {
    const pl = p.isGrounded() ? p.curPlatform() : null;
    if (pl?.is("base")) fijar(pl);
  });

  k.onCollide("commit", "muro_corrupto", (_, m) => {
    k.shake(4);
    chispas(m.pos.add(T / 2, T / 2), [255, 90, 220], 10);
    m.destroy();
    kit.ganarMonedas(1);
  });

  k.onCollide("commit", "altar", (_, a) => {
    if (sqlObtenido) return;
    sqlObtenido = true;
    a.color = k.rgb(160, 255, 220);
    chispas(a.pos.add(0, -60), [120, 230, 255], 24);
    darObjeto("Código SQL");
    kit.recompensa = "Llave Código SQL";
    const txt = tieneObjeto("Pegatina del Elefante Amarillo")
      ? "Canjeas el Elefante de Hadoop...\n¡Obtienes el Código SQL!"
      : "¡El Altar te entrega el Código SQL!";
    kit.abrirMeta(txt);
  });
}
