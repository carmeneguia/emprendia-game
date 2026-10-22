// Motor común del jugador: el mismo para los 10 niveles y la batalla final.
// Flechas / A-D: andar (SHIFT para correr) · Arriba / W: saltar · ESPACIO: superpoder.
import { k } from "./k.js";
import { crearFigura } from "./figura.js";
import { usarSuperpoder } from "./poderes.js";

export const FUERZA_SALTO = 820;
// Caja de choque del jugador (el dibujo es ~1,4 veces más alto)
export const ANCHO_JUGADOR = 34;
export const ALTO_JUGADOR = 72;

export function crearJugador(kit, id, pos, opc = {}) {
  const comps = [
    k.pos(pos),
    k.area({ collisionIgnore: ["poder"] }),
    k.opacity(1),
    k.z(10),
    "jugador",
  ];
  if (!opc.sinCuerpo) comps.push(k.body({ jumpForce: FUERZA_SALTO }));
  const p = crearFigura(id, comps, { ancho: ANCHO_JUGADOR, alto: ALTO_JUGADOR });
  p.xAnterior = pos.x;

  Object.assign(p, {
    personaje: id,
    dir: 1,
    vx: 0,
    enfriamiento: 0,
    bloqueado: false,
    inv: 0, // tiempo de invulnerabilidad tras recibir daño
    autoCorrer: opc.autoCorrer ?? 0,
    tiempoAire: 0,
    anclando: false,
    tiempoAtaque: 0,
  });

  const eje = () => {
    let e = 0;
    if (k.isKeyDown("left") || k.isKeyDown("a")) e -= 1;
    if (k.isKeyDown("right") || k.isKeyDown("d")) e += 1;
    return e;
  };
  p.eje = eje;

  p.onUpdate(() => {
    p.enfriamiento -= k.dt();
    p.tiempoAtaque -= k.dt();
    if (p.inv > 0) {
      p.inv -= k.dt();
      p.opacity = Math.sin(k.time() * 40) > 0 ? 1 : 0.3;
      if (p.inv <= 0) p.opacity = 1;
    }
    if (opc.sinCuerpo || p.bloqueado) return;

    const e = eje();
    const vmax = k.isKeyDown("shift") ? 360 : 240;
    let objetivo = e * vmax;
    if (p.autoCorrer) objetivo = p.autoCorrer + e * 90;
    const suelo = p.isGrounded();
    const acel = kit.resbaladizo && suelo ? 1.6 : 14;
    p.vx = k.lerp(p.vx, objetivo, Math.min(1, acel * k.dt()));
    if (Math.abs(p.vx) < 2 && objetivo === 0) p.vx = 0;
    p.move(p.vx, 0);

    const mira = e !== 0 ? e : (p.autoCorrer ? 1 : 0);
    if (mira !== 0) { p.dir = mira; p.mirar(mira); }

    p.tiempoAire = suelo ? 0 : p.tiempoAire + k.dt();
    // la animación depende de lo que de verdad se mueve: si está parado (o contra una pared), quieto
    const velReal = (p.pos.x - p.xAnterior) / Math.max(k.dt(), 0.001);
    p.xAnterior = p.pos.x;
    const quieto = Math.abs(velReal) < 25 || (e === 0 && !p.autoCorrer);
    p.animarCuerpo({ suelo, vx: velReal, vy: p.vel.y, atacando: p.tiempoAtaque > 0, quieto });
  });

  k.onKeyPress(["up", "w"], () => {
    if (opc.sinCuerpo || p.bloqueado || !p.exists()) return;
    // pequeño margen para poder saltar justo después de salir del borde
    if (p.isGrounded() || p.tiempoAire < 0.09) {
      p.jump(FUERZA_SALTO);
      p.tiempoAire = 1;
      kit.emit("salto", p);
    }
  });

  k.onKeyPress("space", () => {
    if (p.bloqueado || !p.exists() || p.enfriamiento > 0) return;
    p.enfriamiento = usarSuperpoder(kit, p) ?? 0.35;
    p.tiempoAtaque = 0.3;
    p.animar("attack", true);
    if (!p.esSprite) {
      k.tween(1.25, 1, 0.18, (v) => (p.scale = k.vec2(v, 2 - v)), k.easings.easeOutQuad);
    }
  });

  if (!p.scale) p.use(k.scale(1));
  return p;
}
