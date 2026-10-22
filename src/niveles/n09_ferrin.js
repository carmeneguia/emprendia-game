// Nivel 9: Ferrín — "La Montaña Rusa del Descenso del Gradiente"
// Reto de FÍSICA E IMPULSO: el suelo es una función matemática. Las bajadas te aceleran.
// Ancla (ESPACIO): en el aire caes en picado; al tocar el suelo clavas la bandera.
// En un mínimo local rebotas ("¡Error: Mínimo Local!"). Clávala en el valle más profundo (mínimo global) para ganar.
import { k } from "../k.js";
import { montarNivel, crearMoneda, chispas, flotante } from "../nivel.js";

const COLOR = [255, 150, 60];
const ANCHO_MUNDO = 5600;
const ALTO_MUNDO = 1200;
const GRAVEDAD = 2000;
const SALTO = 820;
const TOLERANCIA = 70; // distancia en píxeles para considerar que has clavado el ancla en un mínimo

const campana = (x, c, w, d) => d * Math.exp(-(((x - c) / w) ** 2));
// y del suelo en cada x (y crece hacia abajo: un "valle" es un máximo de y)
function terreno(x) {
  const suave = Math.min(1, Math.max(0, (x - 250) / 400));
  return 420
    + suave * (50 * Math.sin(x / 170) + 30 * Math.sin(x / 77))
    + campana(x, 1500, 110, 120) + campana(x, 2500, 120, 140) + campana(x, 3300, 110, 130)
    + campana(x, 4500, 380, 560)
    - campana(x, 5500, 300, 120);
}
const pendiente = (x) => (terreno(x + 2) - terreno(x - 2)) / 4;

// Busca todos los valles (mínimos locales) muestreando la función
function buscarValles() {
  const v = [];
  for (let x = 300; x < ANCHO_MUNDO - 10; x += 4) {
    if (terreno(x) > terreno(x - 4) && terreno(x) >= terreno(x + 4)) v.push(x);
  }
  return v;
}

const PINCHOS = [900, 1950, 2900, 3750];

export function nivelFerrin(indice) {
  const valles = buscarValles();
  const xGlobal = valles.reduce((a, b) => (terreno(b) > terreno(a) ? b : a));
  const locales = valles.filter((x) => x !== xGlobal);

  let vx = 0, vy = 0, enSuelo = true, picado = false, ganado = false;

  const kit = montarNivel({
    indice,
    personaje: "ferrin",
    mapa: [],
    ancho: ANCHO_MUNDO,
    alto: ALTO_MUNDO,
    sinCuerpo: true,
    inicio: k.vec2(120, terreno(120)),
    tema: "pizarra",
    colorTema: COLOR,
    panelInicio: {
      titulo: "Nivel 9 · La Montaña Rusa del Gradiente",
      subtitulo: "Ferrín · Ancla de Mínimo Global",
      puntos: [
        "El suelo es una función matemática: las bajadas te ACELERAN y las subidas te frenan. Coge carrerilla para subir las cuestas.",
        "Tu misión: encontrar el MÍNIMO GLOBAL, el valle más profundo de toda la montaña.",
        "Ancla (ESPACIO): en el aire caes en picado y clavas una bandera; en el suelo la clavas al momento.",
        "Si la clavas en un valle pequeño (mínimo local) rebotas con un error. Clávala en el más profundo para ganar.",
        "Salta los pinchos con ↑.",
      ],
      controles: [["← + →", "Moverse"], ["SHIFT", "Más fuerza"], ["↑", "Saltar"], ["ESPACIO", "Ancla"]],
    },
  });
  const p = kit.jugador;
  kit.info = "Busca el valle más profundo";

  // Terreno: colina ilustrada (franjas verticales, solo lo que se ve)
  const PASO = 16;
  k.add([k.z(-5), {
    draw() {
      const cam = k.getCamPos().x;
      const x0 = Math.max(0, Math.floor((cam - 560) / PASO) * PASO);
      const x1 = Math.min(ANCHO_MUNDO, cam + 560);
      const borde = [];
      for (let x = x0; x <= x1 + PASO; x += PASO) {
        const a = terreno(x), b = terreno(x + PASO);
        k.drawPolygon({ pts: [k.vec2(x, a), k.vec2(x + PASO + 0.5, b), k.vec2(x + PASO + 0.5, ALTO_MUNDO + 200), k.vec2(x, ALTO_MUNDO + 200)], color: k.rgb(70, 140, 80) });
        k.drawPolygon({ pts: [k.vec2(x, a + 14), k.vec2(x + PASO + 0.5, b + 14), k.vec2(x + PASO + 0.5, ALTO_MUNDO + 200), k.vec2(x, ALTO_MUNDO + 200)], color: k.rgb(52, 112, 64) });
        borde.push(k.vec2(x, a));
      }
      // vetas de tierra
      for (let x = x0; x < x1; x += 64) k.drawLine({ p1: k.vec2(x, terreno(x) + 60), p2: k.vec2(x + 30, terreno(x + 30) + 70), width: 3, color: k.rgb(40, 90, 50) });
      k.drawLines({ pts: borde, width: 9, color: k.rgb(27, 23, 38) });
      k.drawLines({ pts: borde.map((v) => v.add(0, 1)), width: 4, color: k.rgb(150, 230, 120) });
    },
  }]);

  // Monedas a lo largo del recorrido y pinchos
  for (let x = 400; x < ANCHO_MUNDO - 300; x += 260) crearMoneda(kit, k.vec2(x, terreno(x) - 80));
  PINCHOS.forEach((x) => {
    k.add([k.pos(x, terreno(x) + 4), k.sprite("t_pinchos", { width: 48, height: 26 }), k.anchor("bot"), k.area({ scale: k.vec2(0.7, 0.6) }), k.rotate((Math.atan(pendiente(x)) * 180) / Math.PI), "pincho"]);
  });

  // Física propia: el jugador "rueda" sobre la función
  k.onKeyPress(["up", "w"], () => { if (enSuelo && !p.bloqueado) { vy = -SALTO; enSuelo = false; } });

  p.onUpdate(() => {
    if (p.bloqueado) return;
    const dt = k.dt();
    const eje = p.eje();
    if (eje !== 0) { p.dir = eje; p.mirar(eje); }
    const s = pendiente(p.pos.x);
    if (enSuelo) {
      const empuje = (900 * s) / Math.sqrt(1 + s * s); // cuesta abajo acelera
      vx += (eje * (k.isKeyDown("shift") ? 1100 : 800) + empuje) * dt;
      vx *= 1 - 1.4 * dt;
    } else {
      vx += eje * 500 * dt;
    }
    vx = k.clamp(vx, -750, 750);
    p.pos.x = k.clamp(p.pos.x + vx * dt, 20, ANCHO_MUNDO - 20);
    if (enSuelo) {
      p.pos.y = terreno(p.pos.x);
    } else {
      vy += GRAVEDAD * dt;
      p.pos.y += vy * dt;
      if (p.pos.y >= terreno(p.pos.x)) {
        p.pos.y = terreno(p.pos.x);
        enSuelo = true;
        vy = 0;
        if (picado) { picado = false; clavar(); }
      }
    }
    if (p.tiempoAtaque <= 0) {
      const quieto = eje === 0 && Math.abs(vx) < 40;
      p.animarCuerpo({ suelo: enSuelo, vx, vy, quieto });
    }
  });

  p.onCollide("pincho", () => {
    if (p.inv > 0) return;
    kit.herir(false);
    vy = -600; enSuelo = false; vx = -vx * 0.5;
  });
  kit.on("reaparecer", () => { vx = 0; vy = 0; enSuelo = true; picado = false; p.pos.y = terreno(p.pos.x); });

  kit.poderPropio = () => {
    if (!enSuelo) { picado = true; vy = 1500; vx *= 0.3; }
    else clavar();
    return 0.5;
  };

  function clavar() {
    if (ganado) return;
    const x = p.pos.x;
    k.shake(8);
    chispas(k.vec2(x, terreno(x)), [255, 170, 80], 10);
    const bandera = k.add([k.pos(x, terreno(x)), k.sprite("t_control", { width: 40, height: 72 }), k.anchor("bot"), k.opacity(1)]);
    if (Math.abs(x - xGlobal) < TOLERANCIA) {
      ganado = true;
      bandera.unuse("sprite");
      bandera.use(k.sprite("t_control_on", { width: 40, height: 72 }));
      vx = 0;
      p.bloqueado = true;
      kit.info = "¡Mínimo global!";
      chispas(k.vec2(x, terreno(x) - 40), [120, 255, 150], 30);
      kit.aviso("¡MÍNIMO GLOBAL ENCONTRADO!\nInterruptor de victoria activado", [140, 255, 160], 2.5);
      k.wait(2.6, () => kit.completar());
      return;
    }
    k.wait(1.2, () => k.tween(1, 0, 0.4, (v) => (bandera.opacity = v)).onEnd(() => bandera.destroy()));
    if (locales.some((m) => Math.abs(x - m) < TOLERANCIA)) {
      flotante("¡Error: Mínimo Local!", k.vec2(x, terreno(x) - 130), [255, 130, 90], 22);
      vy = -950; enSuelo = false;
    } else {
      flotante("Aquí no hay un mínimo", k.vec2(x, terreno(x) - 130), [220, 220, 240], 16);
    }
  }

  // Ayuda al equipo para depurar: posición del mínimo global en la consola
  console.log("[Ferrín] mínimo global en x =", xGlobal, "· mínimos locales:", locales);
}
