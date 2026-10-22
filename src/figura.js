// Dibuja a un personaje: usa su sprite si existe, si no un bloque de color con iniciales.
// En los dos casos el objeto "de verdad" es un rectángulo de ancho x alto con el anclaje en los pies:
// así la zona de choque es igual para todos y los niveles no dependen del dibujo.
import { k } from "./k.js";
import { PERSONAJES } from "./datos.js";
import { SPRITES } from "./sprites.js";

export function crearFigura(id, comps = [], { ancho = 32, alto = 48, padre = null } = {}) {
  const s = SPRITES[id];
  const destino = padre ?? k;
  let obj;
  if (s) {
    // rectángulo invisible (sin relleno) que lleva el área y la física
    obj = destino.add([k.rect(ancho, alto, { fill: false }), k.anchor("bot"), ...comps]);
    obj.esSprite = true;
    // en la hoja (celdas de 256 px) el personaje mide unos 230 px; se dibuja ~1,4 veces más alto que su caja
    const escala = (alto * 1.42 / 230) * (s.escala ?? 1);
    obj.dibujo = obj.add([k.sprite(id), k.anchor("bot"), k.scale(escala), k.opacity(1), k.pos(0, s.bajar ?? 0)]);
    obj.dibujo.play("idle");
    // el parpadeo y los fundidos se aplican al dibujo
    obj.onUpdate(() => { if (obj.opacity !== undefined) obj.dibujo.opacity = obj.opacity; });
  } else {
    const c = PERSONAJES[id]?.color ?? [200, 200, 200];
    obj = destino.add([
      k.rect(ancho, alto, { radius: 6 }),
      k.color(...c),
      k.outline(3, k.rgb(20, 20, 30)),
      k.anchor("bot"),
      ...comps,
    ]);
    obj.add([
      k.text(PERSONAJES[id]?.iniciales ?? "?", { size: Math.round(alto * 0.3) }),
      k.pos(0, -alto * 0.4),
      k.anchor("center"),
      k.color(20, 20, 30),
    ]);
    obj.ojo = obj.add([
      k.rect(8, 8),
      k.pos(7, -alto + 10),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.outline(2, k.rgb(20, 20, 30)),
    ]);
  }
  obj.mirar = (dir) => {
    if (obj.esSprite) obj.dibujo.flipX = dir < 0;
    else obj.ojo.pos.x = 7 * dir;
  };
  // forzar = volver a empezar la animación aunque ya se esté reproduciendo
  obj.animar = (nombre, forzar = false) => {
    if (!obj.esSprite) return;
    const d = obj.dibujo;
    // una "animación" de un solo fotograma (como idle): hay que parar la que esté sonando,
    // si no Kaplay sigue reproduciendo la anterior (por ejemplo, andar)
    const anim = d.getAnim(nombre);
    if (typeof anim === "number") return obj.fotograma(anim);
    if (!forzar && d.getCurAnim()?.name === nombre) return;
    if (d.hasAnim(nombre)) d.play(nombre);
  };
  // Muestra un fotograma concreto de la hoja (sin animación)
  obj.fotograma = (n) => {
    if (!obj.esSprite) return;
    const d = obj.dibujo;
    if (d.getCurAnim()) d.stop();
    d.frame = n;
  };

  // Animación de un personaje que anda y salta.
  // El salto no es una animación con tiempo fijo: el fotograma depende de lo que hace el cuerpo,
  // así dura exactamente lo mismo que el salto.
  //   fila 3 de la hoja: 8 impulso · 9 subiendo · 10 en lo alto / cayendo · 11 aterrizaje
  const estado = { enAire: false, aterrizaje: 0 };
  obj.animarCuerpo = ({ suelo, vx = 0, vy = 0, atacando = false, quieto = false }) => {
    if (!suelo) estado.enAire = true;
    else if (estado.enAire) { estado.enAire = false; estado.aterrizaje = 0.12; }
    estado.aterrizaje -= k.dt();
    if (atacando) return obj.animar("attack");
    if (!suelo) return obj.fotograma(vy < -150 ? 9 : 10);
    if (estado.aterrizaje > 0) return obj.fotograma(11);
    if (quieto || Math.abs(vx) < 25) return obj.animar("idle");
    obj.animar(Math.abs(vx) > 300 ? "run" : "walk");
  };
  return obj;
}
