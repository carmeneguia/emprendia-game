// usarSuperpoder(personajeActual): cada personaje tiene su ataque especial (ESPACIO).
// Devuelve el tiempo de recarga en segundos.
// Todos los proyectiles llevan la etiqueta "poder" (derriban enemigos normales)
// y una etiqueta propia que usa cada nivel para su minijuego.
import { k } from "./k.js";

// altura (desde los pies) a la que salen los proyectiles
export const ALTURA_DISPARO = 36;

function proyectil(p, o) {
  const {
    sprite, tam = [24, 24], velocidad = 520, vida = 1, etiqueta, texto, colorTexto = [255, 255, 255],
    gravedad = false, salto = 0, atraviesa = false, dirV = null, girar = 0,
  } = o;
  const origen = p.pos.add(p.dir * 26, -ALTURA_DISPARO);
  const comps = [
    k.pos(origen),
    k.sprite(sprite, { width: tam[0], height: tam[1], flipX: p.dir < 0 }),
    k.anchor("center"),
    k.rotate(0),
    k.area({ collisionIgnore: ["jugador", "poder", "moneda", "meta"] }),
    k.opacity(1),
    k.lifespan(vida, { fade: 0.15 }),
    k.offscreen({ destroy: true, distance: 300 }),
    k.z(12),
    "poder",
    etiqueta,
    { dir: p.dir },
  ];
  if (atraviesa) comps.push("atraviesa");
  if (gravedad) comps.push(k.body());
  const obj = k.add(comps);
  if (texto) obj.add([k.text(texto, { size: 11 }), k.anchor("center"), k.color(...colorTexto)]);
  if (gravedad && salto) obj.jump(salto);
  const v = dirV ?? k.vec2(p.dir, 0);
  // en diagonal: girar el dibujo hacia donde va
  if (dirV && !girar) obj.angle = (Math.atan2(v.y, v.x) * 180) / Math.PI - (p.dir < 0 ? 180 : 0);
  obj.onUpdate(() => {
    obj.move(v.scale(velocidad));
    if (girar) obj.angle += girar * p.dir * k.dt();
  });
  return obj;
}

export const PODERES = {
  catala(kit, p) {
    proyectil(p, { sprite: "t_bola", tam: [36, 36], velocidad: 430, vida: 2.6, etiqueta: "bola", gravedad: true, salto: p.isGrounded?.() ? 260 : 120, atraviesa: true, girar: 540 });
    return 0.6;
  },
  fosil(kit, p) {
    proyectil(p, { sprite: "t_fosil", tam: [34, 22], velocidad: 720, vida: 0.38, etiqueta: "fosil" });
    return 0.4;
  },
  bianca(kit, p) {
    proyectil(p, { sprite: "t_liquidez", tam: [22, 22], velocidad: 620, vida: 1.2, etiqueta: "liquidez", girar: 720 });
    return 0.25;
  },
  hadoopeno(kit, p) {
    proyectil(p, { sprite: "t_paquete", tam: [30, 26], velocidad: 420, vida: 1.6, etiqueta: "replica", gravedad: true, salto: 420, girar: 200 });
    return 0.35;
  },
  bases(kit, p) {
    const m = k.add([
      k.pos(p.pos.add(p.dir * 22, -12)),
      k.sprite("t_martillo", { width: 92, height: 58, flipX: p.dir < 0 }),
      k.rotate(-30 * p.dir),
      k.anchor("center"),
      k.area({ collisionIgnore: ["jugador"] }),
      k.opacity(1),
      k.lifespan(0.18, { fade: 0.08 }),
      k.z(12),
      "poder",
      "commit",
    ]);
    k.tween(-30 * p.dir, 40 * p.dir, 0.12, (a) => (m.angle = a));
    kit.emit("commit", p, m);
    return 0.3;
  },
  paiboll(kit, p) {
    proyectil(p, { sprite: "t_terminal", tam: [84, 26], velocidad: 680, vida: 1.2, etiqueta: "terminal" });
    return 0.3;
  },
  bugarin(kit, p) {
    proyectil(p, { sprite: "t_escaner", tam: [34, 100], velocidad: 760, vida: 0.55, etiqueta: "escaner", atraviesa: true });
    kit.emit("escaner", p);
    return 0.5;
  },
  pet(kit, p) {
    proyectil(p, { sprite: "t_rayo", tam: [56, 14], velocidad: 950, vida: 0.6, etiqueta: "depurador" });
    return 0.2;
  },
  ferrin(kit, p) {
    // Golpe descendente: en el aire cae en picado; en el suelo clava el ancla al momento.
    if (p.isGrounded?.() === false) {
      p.anclando = true;
      p.jump(-1500);
    } else {
      kit.emit("ancla", p);
    }
    return 0.5;
  },
  alberto(kit, p) {
    proyectil(p, { sprite: "t_ping", tam: [30, 30], velocidad: 580, vida: 1.2, etiqueta: "ping" });
    return 0.3;
  },
  chaves(kit, p) {
    proyectil(p, { sprite: "t_estrella", tam: [28, 28], velocidad: 650, vida: 1.2, etiqueta: "libre", girar: 600 });
    return 0.25;
  },
};

// En la batalla final todos disparan en diagonal hacia arriba (o recto arriba si mantienes ↑),
// cada uno con el aspecto de su ataque.
const ASPECTO_JEFE = {
  catala: { sprite: "t_bola", tam: [32, 32], girar: 540 },
  fosil: { sprite: "t_fosil", tam: [34, 22] },
  bianca: { sprite: "t_liquidez", tam: [22, 22], girar: 720 },
  hadoopeno: { sprite: "t_paquete", tam: [30, 26], girar: 200 },
  bases: { sprite: "t_martillo", tam: [60, 38], girar: 600 },
  paiboll: { sprite: "t_terminal", tam: [84, 26] },
  bugarin: { sprite: "t_escaner", tam: [30, 80] },
  pet: { sprite: "t_rayo", tam: [56, 14] },
  ferrin: { sprite: "t_ancla", tam: [28, 38], girar: 300 },
  alberto: { sprite: "t_ping", tam: [30, 30] },
  chaves: { sprite: "t_estrella", tam: [28, 28], girar: 600 },
};

export function usarSuperpoder(kit, p) {
  if (kit.poderPropio) return kit.poderPropio(p);
  if (kit.modoJefe) {
    const arriba = k.isKeyDown("up") || k.isKeyDown("w");
    const dirV = arriba ? k.vec2(0, -1) : k.vec2(p.dir, -0.7).unit();
    proyectil(p, { ...(ASPECTO_JEFE[p.personaje] ?? ASPECTO_JEFE.chaves), velocidad: 640, vida: 1.6, etiqueta: "disparo_jefe", dirV });
    return 0.32;
  }
  const f = PODERES[p.personaje];
  return f ? f(kit, p) : 0.3;
}
