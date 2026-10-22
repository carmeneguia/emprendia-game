// Nivel 2: Mujer Fósil — "La Caverna Mesozoica"
// Precipicios demasiado anchos: fosiliza a los voladores (y a las rocas que caen)
// para convertirlos en plataformas de piedra durante 4 segundos.
import { k, T } from "../k.js";
import { montarNivel, chispas } from "../nivel.js";
import { lienzo } from "../lienzo.js";

const DURACION_PIEDRA = 4;
const COLOR = [255, 180, 80];

export function nivelFosil(indice) {
  const L = lienzo(132);
  L.fila("=", 0, 131, 0); // techo de la cueva
  L.suelo(0, 20).suelo(29, 45).suelo(56, 70).suelo(83, 95).suelo(107, 131);
  // voladores sobre los precipicios
  [[23, 11], [26, 10], [48, 11], [51, 10], [54, 11], [73, 11], [76, 10], [79, 11], [81, 10], [98, 10], [101, 11], [104, 10]]
    .forEach(([x, y]) => L.pon("V", x, y));
  L.fila("#", 33, 36, 9).fila("#", 61, 64, 9).fila("#", 88, 90, 9);
  [33, 35].forEach((x) => L.pon("o", x, 8));
  [61, 63].forEach((x) => L.pon("o", x, 8));
  L.pon("B", 40, 11).pon("B", 66, 11).pon("B", 92, 11).pon("B", 115, 11);
  L.pon("P", 3, 11).pon("K", 58, 11).pon("K", 85, 11).pon("M", 126, 11);

  const kit = montarNivel({
    indice,
    personaje: "fosil",
    mapa: L.filas(),
    tema: "caverna",
    colorTema: COLOR,
    materiales: { "=": "roca", "#": "roca_plat" },
    casillas: { V: (cx, cy) => crearVolador(cx, cy) },
    panelInicio: {
      titulo: "Nivel 2 · La Caverna Mesozoica",
      subtitulo: "Mujer Fósil · Onda Fosilizadora",
      puntos: [
        "Los precipicios son demasiado anchos para saltarlos.",
        "Dispara la Onda Fosilizadora (ESPACIO) a los voladores morados: se vuelven de PIEDRA durante 4 segundos y puedes usarlos de plataforma.",
        "Cuando la piedra parpadea, ¡salta! Está a punto de volver a la vida.",
        "Del techo caen rocas ardientes: esquívalas o fosilízalas para tener más escalones.",
        "La onda tiene poco alcance: acércate al borde antes de disparar.",
      ],
      controles: [["← + →", "Moverse"], ["↑", "Saltar"], ["ESPACIO", "Fosilizar"]],
    },
  });

  // Objeto con dibujo normal y dibujo de piedra
  function conDosAspectos(o, normal, piedra) {
    o.normal = normal;
    o.piedraDibujo = piedra;
    piedra.hidden = true;
  }

  function crearVolador(cx, cy) {
    const x0 = cx * T + T / 2, y0 = cy * T + T / 2;
    const v = k.add([k.pos(x0, y0), k.rect(58, 22, { fill: false }), k.anchor("center"), k.area(), k.opacity(1), "volador", "fosilizable", { t: k.rand(0, 6), piedra: 0, dir: 1 }]);
    conDosAspectos(v,
      v.add([k.sprite("t_volador", { anim: "volar", width: 68, height: 40 }), k.anchor("center"), k.opacity(1)]),
      v.add([k.sprite("t_volador_piedra", { width: 68, height: 40 }), k.anchor("center"), k.opacity(1)]));
    v.onUpdate(() => {
      if (v.piedra > 0) return tiempoPiedra(v);
      v.t += k.dt();
      const nx = x0 + Math.sin(v.t * 1.2) * 70;
      v.normal.flipX = nx < v.pos.x;
      v.pos = k.vec2(nx, y0 + Math.sin(v.t * 2.5) * 12);
    });
    return v;
  }

  function tiempoPiedra(o) {
    o.piedra -= k.dt();
    const parp = o.piedra < 1.2 && Math.sin(k.time() * 30) > 0 ? 0.45 : 1;
    o.piedraDibujo.opacity = parp;
    if (o.piedra <= 0) despetrificar(o);
  }

  function petrificar(o) {
    o.piedra = DURACION_PIEDRA;
    o.normal.hidden = true;
    o.piedraDibujo.hidden = false;
    o.use(k.body({ isStatic: true }));
    o.tag("suelo");
    if (o.is("roca")) o.untag("peligro");
    chispas(o.pos, [255, 190, 90], 10);
  }

  function despetrificar(o) {
    o.piedra = 0;
    o.normal.hidden = false;
    o.piedraDibujo.hidden = true;
    o.unuse("body");
    o.untag("suelo");
    if (o.is("roca")) o.tag("peligro");
  }

  k.onCollide("fosil", "fosilizable", (f, o) => {
    if (o.piedra > 0) return;
    petrificar(o);
    f.destroy();
  });

  // Los voladores hacen daño mientras no sean de piedra
  kit.jugador.onCollide("volador", (v) => { if (!(v.piedra > 0)) kit.herir(); });

  // Rocas ardientes que caen del techo (con aviso de polvo antes)
  k.loop(1.3, () => {
    const p = kit.jugador;
    if (kit.terminado || p.pos.x < 8 * T) return;
    const x = p.pos.x + k.rand(-120, 420);
    const aviso = k.add([k.pos(x, T + 6), k.circle(14), k.color(255, 200, 120), k.opacity(0.5), k.anchor("center"), k.lifespan(0.5, { fade: 0.4 })]);
    k.wait(0.45, () => {
      const r = k.add([k.pos(x, T + 10), k.rect(30, 30, { fill: false }), k.anchor("center"), k.area(), k.opacity(1), "roca", "fosilizable", "peligro", { piedra: 0 }]);
      conDosAspectos(r,
        r.add([k.sprite("t_roca", { width: 36, height: 36 }), k.anchor("center"), k.rotate(0)]),
        r.add([k.sprite("t_roca_piedra", { width: 36, height: 36 }), k.anchor("center"), k.opacity(1)]));
      r.onUpdate(() => {
        if (r.piedra > 0) return tiempoPiedra(r);
        r.move(0, 260);
        r.normal.angle += 200 * k.dt();
        if (r.pos.y > kit.alto + 50) r.destroy();
      });
      r.onCollide("suelo", (s) => { if (!(r.piedra > 0) && !s.is("roca")) { chispas(r.pos, [255, 120, 40], 6); r.destroy(); } });
    });
  });
}
