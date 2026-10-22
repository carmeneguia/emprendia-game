// Nivel 6: Paiboll Cheese y Julián Patillas — "Los Trapicheadores de Comandos"
// Reto de PUNTERÍA EN ALTURA: caen muros de código ("Permiso Denegado"). Cada muro tiene un punto débil:
//   chmod = abajo (dispara desde el suelo) · grep = medio (salto corto) · kill = arriba (salto completo)
// Golpéalo con sudo rm -rf antes de chocar. El último cortafuegos tiene los tres.
import { k, T } from "../k.js";
import { montarNivel, chispas, flotante } from "../nivel.js";
import { lienzo } from "../lienzo.js";
import { darObjeto, tieneObjeto } from "../estado.js";
import { crearFigura } from "../figura.js";
import { ALTURA_DISPARO } from "../poderes.js";
import { FUERZA_SALTO } from "../jugador.js";

const COLOR = [90, 255, 140];
const SUELO_Y = 12 * T;
const ALTURAS = {
  chmod: { y: SUELO_Y - ALTURA_DISPARO, color: [255, 210, 60], pista: "¡Un chmod! Dispara desde el suelo" },
  grep: { y: SUELO_Y - 100, color: [80, 220, 255], pista: "¡Un grep! Salto corto y dispara" },
  kill: { y: SUELO_Y - 180, color: [255, 90, 90], pista: "¡Un kill! Salta del todo y dispara arriba" },
};
const MUROS = [[20, "chmod"], [32, "grep"], [44, "kill"], [56, "chmod"], [66, "grep"], [76, "kill"], [86, "grep"], [96, "chmod"], [106, "kill"]];
const CORTAFUEGOS = 120;

export function nivelPaiboll(indice) {
  const L = lienzo(134);
  L.suelo(0, 133);
  L.pon("o", 10, 9).pon("o", 12, 9).pon("o", 50, 9).pon("o", 81, 9).pon("o", 101, 9);
  L.pon("P", 3, 11).pon("K", 60, 11).pon("K", 90, 11).pon("M", 128, 11);
  L.columna("|", 124, 7, 11);

  const kit = montarNivel({
    indice,
    personaje: "paiboll",
    mapa: L.filas(),
    metaAbierta: false,
    tema: "terminal",
    colorTema: COLOR,
    materiales: { "=": "circuito" },
    textoMetaCerrada: "Rompe el último cortafuegos",
    panelInicio: {
      titulo: "Nivel 6 · Los Trapicheadores de Comandos",
      subtitulo: tieneObjeto("Código SQL") ? "Paiboll Cheese y Julián Patillas · Entras con el Código SQL" : "Paiboll Cheese y Julián Patillas · Ráfaga sudo rm -rf",
      puntos: [
        "Desde el cielo caen muros de código con PERMISO DENEGADO. No se pueden saltar.",
        "Cada muro tiene un punto débil de color. Dispara sudo rm -rf (ESPACIO) justo a su altura:",
        "chmod (AMARILLO) abajo: dispara desde el suelo.   grep (AZUL) en medio: salto corto.   kill (ROJO) arriba: salto completo y dispara en lo más alto.",
        "Si chocas contra un muro pierdes una vida. Julián Patillas te avisa de qué comando viene. Tienes 90 segundos.",
      ],
      controles: [["← + →", "Moverse"], ["↑", "Saltar"], ["ESPACIO", "sudo rm -rf"]],
    },
  });

  // Leyenda fija de alturas
  k.add([k.fixed(), k.z(98), {
    draw() {
      const x = 16, y = 470;
      k.drawRect({ pos: k.vec2(x, y - 6), width: 190, height: 60, radius: 10, color: k.rgb(10, 24, 14), opacity: 0.85, outline: { width: 2, color: k.rgb(...COLOR) } });
      [["kill", "arriba"], ["grep", "medio"], ["chmod", "abajo"]].forEach(([c, d], i) => {
        k.drawRect({ pos: k.vec2(x + 10, y + i * 16), width: 12, height: 12, radius: 3, color: k.rgb(...ALTURAS[c].color) });
        k.drawText({ text: `${c} → ${d}`, pos: k.vec2(x + 30, y + i * 16 - 1), size: 13, color: k.rgb(220, 255, 230) });
      });
    },
  }]);

  // Julián Patillas acompaña y da pistas
  // Julián tiene cuerpo propio: anda, se para y salta como Paiboll (un instante después)
  const julian = crearFigura("julian", [
    k.pos(kit.jugador.pos.sub(70, 0)), k.area({ collisionIgnore: ["jugador", "poder", "moneda", "meta"] }),
    k.body({ jumpForce: FUERZA_SALTO }), k.z(9), "julian",
  ], { ancho: 34, alto: 72 });
  let julianVx = 0;
  const bocadillo = k.add([k.pos(0, 0), k.z(50), { texto: "",
    draw() {
      if (!this.texto) return;
      const w = this.texto.length * 8.2 + 24;
      k.drawRect({ pos: k.vec2(-w / 2, -30), width: w, height: 30, radius: 12, color: k.rgb(255, 255, 255), outline: { width: 3, color: k.rgb(27, 23, 38) } });
      k.drawTriangle({ p1: k.vec2(-8, 0), p2: k.vec2(8, 0), p3: k.vec2(0, 12), color: k.rgb(255, 255, 255) });
      k.drawText({ text: this.texto, pos: k.vec2(0, -15), size: 14, anchor: "center", color: k.rgb(27, 23, 38) });
    } }]);
  julian.onUpdate(() => {
    const p = kit.jugador;
    // si se queda muy atrás (o se cae), aparece junto a Paiboll
    if (Math.abs(p.pos.x - julian.pos.x) > 520 || julian.pos.y > kit.alto + 100) { julian.pos = p.pos.add(-p.dir * 70, -10); julian.vel = k.vec2(0, 0); }
    const objetivoX = p.pos.x - p.dir * 70;
    const dx = objetivoX - julian.pos.x;
    // zona muerta: si está cerca de su sitio, se para del todo
    const deseada = Math.abs(dx) < 14 ? 0 : k.clamp(dx * 4, -300, 300);
    julianVx = k.lerp(julianVx, deseada, Math.min(1, 12 * k.dt()));
    if (Math.abs(julianVx) < 8) julianVx = 0;
    const antes = julian.pos.x;
    julian.move(julianVx, 0);
    const velReal = (julian.pos.x - antes) / Math.max(k.dt(), 0.001);
    julian.mirar(Math.abs(velReal) > 25 ? Math.sign(velReal) : p.dir);
    julian.animarCuerpo({ suelo: julian.isGrounded(), vx: velReal, vy: julian.vel.y, quieto: julianVx === 0 });
    bocadillo.pos = julian.pos.add(0, -112);
  });
  kit.on("salto", () => k.wait(0.15, () => { if (julian.exists() && julian.isGrounded()) julian.jump(FUERZA_SALTO); }));
  const decir = (t) => { bocadillo.texto = t; k.wait(2.4, () => { if (bocadillo.texto === t) bocadillo.texto = ""; }); };
  k.wait(0.5, () => decir("¡Vamos, Paiboll!"));

  const reloj = kit.cuentaAtras(90, () => kit.fallar("¡Se acabó el tiempo!"), "Tiempo");

  function crearMuro(cx, tipos, alto = 6) {
    const x = cx * T;
    const yFinal = SUELO_Y - alto * T;
    const m = k.add([
      k.pos(x, yFinal - 500), k.sprite("t_muro_codigo", { width: T, height: alto * T }),
      k.area(), k.body({ isStatic: true }), "suelo", "muro", { nucleos: [] },
    ]);
    tipos.forEach((tipo) => {
      const a = ALTURAS[tipo];
      const n = m.add([k.pos(-6, a.y - yFinal - 22), k.rect(T + 12, 44, { radius: 8 }), k.color(...a.color), k.outline(3, k.rgb(27, 23, 38))]);
      n.add([k.text(tipo, { size: 13 }), k.pos((T + 12) / 2, 22), k.anchor("center"), k.color(27, 23, 38)]);
      m.nucleos.push({ tipo, y: a.y, obj: n });
    });
    k.tween(yFinal - 500, yFinal, 0.45, (y) => (m.pos.y = y), k.easings.easeInQuad).onEnd(() => { k.shake(5); chispas(k.vec2(x + T / 2, SUELO_Y), [90, 255, 140], 10); });
    return m;
  }

  MUROS.forEach(([cx, tipo]) => {
    kit.alPasar(cx * T - 9 * T, () => {
      crearMuro(cx, [tipo]);
      decir(ALTURAS[tipo].pista);
    });
  });
  kit.alPasar(CORTAFUEGOS * T - 10 * T, () => {
    const f = crearMuro(CORTAFUEGOS, ["chmod", "grep", "kill"], 7);
    f.final = true;
    decir("¡El cortafuegos final! Tres puntos débiles");
  });

  k.onCollide("terminal", "muro", (t, m) => {
    t.destroy();
    const n = m.nucleos.find((n) => Math.abs(t.pos.y - n.y) < 28);
    if (!n) {
      flotante("Permission denied", t.pos, [255, 110, 110], 13);
      return;
    }
    chispas(n.obj.pos.add(m.pos).add(T / 2, 22), ALTURAS[n.tipo].color, 10);
    n.obj.destroy();
    m.nucleos = m.nucleos.filter((x) => x !== n);
    if (m.nucleos.length === 0) {
      k.shake(6);
      kit.ganarMonedas(2);
      chispas(m.pos.add(T / 2, m.height / 2), [90, 255, 140], 18);
      m.destroy();
      if (m.final) {
        reloj.parar();
        darObjeto("Comando Maestro de Linux");
        kit.recompensa = "Comando Maestro de Linux";
        kit.info = "";
        kit.abrirMeta("¡Comando Maestro de Linux desbloqueado!");
        decir("¡Lo tenemos!");
      }
    }
  });

  // Chocar contra un muro duele y te empuja atrás
  kit.jugador.onCollide("muro", (m, col) => {
    if (col?.isLeft?.() || col?.isRight?.()) {
      kit.herir(false);
      kit.jugador.vx = -kit.jugador.dir * 400;
    }
  });
}
