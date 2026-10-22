// Nivel 11 (FINAL): batalla contra Mucientes y Chema.
//
// Mucientes (armadura con propulsores) tiene 3 fases:
//   Fase 1 (100%-60%): Cañón (ráfaga de orbes) · Visión Artificial (recuadro + láser)
//   Fase 2 (60%-30%):  + Embestida con espada: cae en picado, onda expansiva por el suelo y se queda ATURDIDO (daño x2)
//   Fase 3 (<30%):     + Lluvia de misiles con mira en el suelo · aparecen Bots · todo más rápido
// Chema (en su cápsula) orbita a Mucientes: si le das, despliega el ESCUDO y te devuelve el disparo.
// De vez en cuando se lanza a un lado y dispara una estrella.
import { k, ANCHO, ALTO, T } from "../k.js";
import { PERSONAJES } from "../datos.js";
import { estado, guardar, desbloquear } from "../estado.js";
import { crearFigura } from "../figura.js";
import { montarNivel, chispas, flotante } from "../nivel.js";
import { lienzo } from "../lienzo.js";
import { rotulo } from "../ui.js";
import { sfx } from "../sonido.js";

const VIDA_JEFE = 55;
const SUELO = 12 * T;
const COLOR = [255, 80, 110];
const UMBRAL_F2 = 0.6, UMBRAL_F3 = 0.3;

export function registrarJefe() {
  // Destello blanco al recibir daño
  k.loadShader("destello", null, `
    uniform float u_flash;
    vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
      vec4 c = def_frag();
      return vec4(mix(c.rgb, vec3(1.0), u_flash * c.a), c.a);
    }`);

  k.scene("jefe", ({ id }) => {
    const L = lienzo(24);
    L.suelo(0, 23);
    L.fila("#", 3, 7, 9).fila("#", 10, 13, 6).fila("#", 16, 20, 9);
    L.pon("P", 2, 11);

    let vida = VIDA_JEFE, vidaFantasma = VIDA_JEFE, fase = 1;
    let ganado = false, luchando = false;
    const esperar = (s) => new Promise((r) => k.wait(s, r));
    const activo = () => luchando && !ganado && !kit.terminado;
    k.onSceneLeave(() => { k.debug.timeScale = 1; });

    const kit = montarNivel({
      indice: 10,
      personaje: id,
      mapa: L.filas(),
      vidas: 5,
      metaAbierta: false,
      titulo: "Nivel 11 · La Fortaleza de EmprendIA",
      tema: "fortaleza",
      colorTema: COLOR,
      velo: 0.25,
      materiales: { "=": "fortaleza", "#": "fortaleza_plat" },
      reiniciar: () => k.go("jefe", { id }),
      alCompletar: () => victoria(),
    });
    kit.modoJefe = true;
    const p = kit.jugador;
    p.bloqueado = true;

    // ---------- ambiente ----------
    k.add([k.sprite("t_vineta", { width: ANCHO, height: ALTO }), k.fixed(), k.z(95)]);
    k.loop(0.12, () => {
      const b = k.add([k.pos(k.rand(0, ANCHO), ALTO + 10), k.circle(k.rand(1.5, 3.5)), k.color(255, k.rand(80, 160), 90), k.opacity(0.8), k.z(-4), k.lifespan(4, { fade: 1 })]);
      const vx = k.rand(-20, 20), vy = k.rand(40, 90);
      b.onUpdate(() => b.move(vx, -vy));
    });
    const destelloPantalla = k.add([k.rect(ANCHO, ALTO), k.color(255, 255, 255), k.opacity(0), k.fixed(), k.z(96)]);
    const destello = (color = [255, 255, 255], fuerza = 0.7) => {
      destelloPantalla.color = k.rgb(...color);
      k.tween(fuerza, 0, 0.35, (v) => (destelloPantalla.opacity = v));
    };

    // Daño al jugador: sonido y destello rojo
    const herirBase = kit.herir;
    kit.herir = (...a) => {
      if (kit.terminado || p.inv > 0 || ganado) return;
      herirBase(...a);
      sfx.danio();
      destello([255, 40, 60], 0.35);
    };
    k.onAdd("disparo_jefe", () => sfx.disparo());

    // ---------- Chaves en la jaula láser ----------
    const chaves = crearFigura("chaves", [k.pos(22 * T + 20, SUELO), k.z(2)], { ancho: 34, alto: 72 });
    chaves.mirar(-1);
    const barrotes = [];
    for (let i = 0; i < 6; i++) {
      const b = k.add([k.pos(21 * T - 4 + i * 18, SUELO), k.rect(5, 130, { radius: 2 }), k.anchor("bot"), k.color(255, 60, 100), k.opacity(0.9), k.z(3)]);
      b.onUpdate(() => (b.opacity = 0.6 + Math.sin(k.time() * 12 + i) * 0.35));
      barrotes.push(b);
    }
    barrotes.push(k.add([k.pos(21 * T - 12, SUELO - 136), k.rect(114, 10, { radius: 4 }), k.color(110, 30, 50), k.outline(3, k.rgb(27, 23, 38)), k.z(3)]));
    const ayuda = k.add([k.text("¡Ayuda!", { size: 14 }), k.pos(22 * T + 20, SUELO - 150), k.anchor("center"), k.color(255, 255, 255), k.opacity(1), k.z(3)]);
    ayuda.onUpdate(() => (ayuda.opacity = Math.sin(k.time() * 4) > 0 ? 1 : 0.4));

    // ---------- Mucientes ----------
    const M = k.add([k.pos(ANCHO / 2, -260), k.rect(90, 170, { fill: false }), k.anchor("bot"), k.area(), k.z(6), "mucientes",
      { flash: 0, aturdido: 0, invulnerable: 0, mira: 1 }]);
    // sombra en el suelo
    k.add([k.z(1), { draw() {
      const alt = Math.max(0, SUELO - M.pos.y);
      const r = Math.max(20, 70 - alt * 0.12);
      k.drawEllipse({ pos: k.vec2(M.pos.x, SUELO - 2), radiusX: r, radiusY: r * 0.22, color: k.rgb(0, 0, 0), opacity: 0.35 });
    } }]);
    // aura
    M.add([k.z(-1), { draw() {
      const furia = fase === 3 ? 1 : 0;
      k.drawCircle({ pos: k.vec2(0, -100), radius: 110 + Math.sin(k.time() * 3) * 8, color: k.rgb(255, 40 + furia * 0, 80), opacity: 0.1 + furia * 0.08 });
    } }]);
    M.spr = M.add([k.sprite("mucientes", { anim: "flotar" }), k.anchor("bot"), k.scale(0.92), k.pos(0, 8), k.color(255, 255, 255),
      k.shader("destello", () => ({ u_flash: M.flash }))]);
    // estrellas de aturdido
    M.add([k.pos(0, -215), k.z(5), { draw() {
      if (M.aturdido <= 0) return;
      for (let i = 0; i < 4; i++) { const a = k.time() * 5 + i * 1.57; k.drawSprite({ sprite: "t_estrella", pos: k.vec2(Math.cos(a) * 34, Math.sin(a) * 9), width: 18, height: 18, anchor: "center" }); }
    } }]);
    M.onUpdate(() => {
      M.flash = Math.max(0, M.flash - k.dt() * 6);
      M.invulnerable -= k.dt();
      if (M.aturdido > 0) {
        M.aturdido -= k.dt();
        M.spr.color = k.rgb(255, 255, 255);
        M.flash = Math.max(M.flash, Math.sin(k.time() * 14) > 0.4 ? 0.35 : 0);
      } else if (fase === 3) {
        const r = 0.5 + Math.sin(k.time() * 6) * 0.5;
        M.spr.color = k.rgb(255, 255 - r * 90, 255 - r * 90);
      }
      // mirar al jugador y flotar
      if (M.mira) M.spr.flipX = p.pos.x < M.pos.x;
      M.spr.pos.y = M.aturdido > 0 ? 8 : 8 + Math.sin(k.time() * 2.4) * 6;
    });
    const animM = (n) => M.spr.play(n);
    const delanteM = () => (M.spr.flipX ? -1 : 1);

    // ---------- Chema ----------
    const C = k.add([k.pos(-200, 200), k.rect(100, 70, { fill: false }), k.anchor("center"), k.area(), k.z(7), "chema",
      { escudo: 0, modo: "espera", angulo: 0 }]);
    C.spr = C.add([k.sprite("chema", { anim: "flotar" }), k.anchor("center"), k.scale(0.56)]);
    C.onUpdate(() => {
      C.escudo -= k.dt();
      if (C.modo === "orbita") {
        C.angulo += k.dt() * (fase === 1 ? 1.5 : fase === 2 ? 1.9 : 2.4);
        const centro = M.pos.add(0, -120);
        const objetivo = centro.add(Math.cos(C.angulo) * 165, Math.sin(C.angulo) * 75);
        C.pos = C.pos.lerp(objetivo, Math.min(1, 6 * k.dt()));
      }
      C.spr.flipX = p.pos.x < C.pos.x;
      // con el escudo puesto, refleja todo lo que se acerque
      if (C.escudo > 0) k.get("disparo_jefe").forEach((d) => { if (d.pos.dist(C.pos) < 105) reflejar(d); });
    });
    // burbuja del escudo (dibujada encima, además de la del sprite)
    C.add([k.z(1), { draw() {
      if (C.escudo <= 0) return;
      k.drawCircle({ radius: 92 + Math.sin(k.time() * 20) * 3, color: k.rgb(140, 240, 255), opacity: 0.12 + Math.min(0.15, C.escudo * 0.2), outline: { width: 3, color: k.rgb(170, 250, 255) } });
    } }]);

    function reflejar(d) {
      if (d.usado) return;
      d.usado = true;
      const desde = d.pos.clone();
      d.destroy();
      chispas(desde, [170, 250, 255], 10);
      bala(desde, p.pos.add(0, -40).sub(desde).unit(), 430, "t_orbe_azul", 30);
    }
    function activarEscudo() {
      if (C.escudo <= 0) { C.spr.play("escudo"); sfx.escudo(); flotante("¡ESCUDO!", C.pos.add(0, -70), [170, 250, 255], 18); }
      C.escudo = 1.1;
      k.wait(1.15, () => { if (C.escudo <= 0 && C.exists()) C.spr.play("flotar"); });
    }

    // ---------- proyectiles enemigos ----------
    function bala(pos, dir, vel, sprite = "t_orbe", tam = 30) {
      const b = k.add([k.pos(pos), k.sprite(sprite, { width: tam, height: tam }), k.anchor("center"), k.rotate(0), k.area({ scale: 0.6 }),
        k.offscreen({ destroy: true, distance: 120 }), k.z(14), "peligro", "bala_enemiga"]);
      b.onUpdate(() => {
        b.move(dir.scale(vel));
        b.angle += 360 * k.dt();
        if (k.chance(0.5)) k.add([k.pos(b.pos), k.circle(k.rand(2, 4)), k.color(sprite === "t_orbe" ? k.rgb(255, 120, 190) : sprite === "t_orbe_azul" ? k.rgb(150, 230, 255) : k.rgb(255, 210, 90)), k.opacity(0.7), k.lifespan(0.25, { fade: 0.2 }), k.z(13)]);
      });
      return b;
    }
    function explosion(pos, escala = 1) {
      sfx.explosion(escala > 1.5);
      const anillo = k.add([k.pos(pos), k.circle(10), k.color(255, 220, 120), k.opacity(0.9), k.anchor("center"), k.z(30)]);
      k.tween(10, 70 * escala, 0.3, (r) => (anillo.radius = r));
      k.tween(0.9, 0, 0.35, (o) => (anillo.opacity = o)).onEnd(() => anillo.destroy());
      chispas(pos, [255, 170, 60], Math.round(12 * escala));
      for (let i = 0; i < 4 * escala; i++) {
        const h = k.add([k.pos(pos.add(k.rand(-20, 20) * escala, k.rand(-20, 10))), k.sprite("t_humo", { width: 50 * escala, height: 50 * escala }), k.anchor("center"), k.opacity(0.8), k.z(29), k.lifespan(0.9, { fade: 0.6 })]);
        h.onUpdate(() => h.move(0, -40));
      }
    }

    // ---------- barra de vida del jefe ----------
    const BX = ANCHO / 2 - 300, BY = 498, BW = 600;
    k.add([k.fixed(), k.z(101), { draw() {
      if (!luchando) return;
      k.drawRect({ pos: k.vec2(BX - 6, BY - 6), width: BW + 12, height: 28, radius: 14, color: k.rgb(27, 23, 38), opacity: 0.9, outline: { width: 3, color: k.rgb(...COLOR) } });
      const fr = Math.max(0, vida) / VIDA_JEFE, ff = Math.max(0, vidaFantasma) / VIDA_JEFE;
      k.drawRect({ pos: k.vec2(BX, BY), width: BW * ff, height: 16, radius: 8, color: k.rgb(255, 230, 160) });
      k.drawRect({ pos: k.vec2(BX, BY), width: BW * fr, height: 16, radius: 8, color: fase === 3 ? k.rgb(255, 60 + Math.sin(k.time() * 10) * 40, 60) : k.rgb(235, 40, 80) });
      k.drawRect({ pos: k.vec2(BX + 4, BY + 2), width: Math.max(0, BW * fr - 8), height: 4, radius: 2, color: k.rgb(255, 255, 255), opacity: 0.35 });
      [UMBRAL_F2, UMBRAL_F3].forEach((u) => k.drawRect({ pos: k.vec2(BX + BW * u - 2, BY - 4), width: 4, height: 24, color: k.rgb(27, 23, 38) }));
      k.drawText({ text: `MUCIENTES  ·  FASE ${fase}`, pos: k.vec2(BX, BY - 24), size: 16, color: k.rgb(255, 255, 255) });
      if (M.aturdido > 0) k.drawText({ text: "¡ATURDIDO! DAÑO x2", pos: k.vec2(BX + BW, BY - 24), size: 16, anchor: "topright", color: k.rgb(255, 230, 90) });
    } }]);
    k.onUpdate(() => { vidaFantasma = vidaFantasma > vida ? Math.max(vida, vidaFantasma - VIDA_JEFE * 0.35 * k.dt()) : vida; });

    // ---------- carteles grandes ----------
    async function cartelGrande(nombre, sub, color, dur = 1.6) {
      const banda = k.add([k.pos(-ANCHO, ALTO / 2 - 60), k.rect(ANCHO, 120), k.color(15, 8, 18), k.opacity(0.85), k.fixed(), k.z(200)]);
      const linea = k.add([k.pos(-ANCHO, ALTO / 2 + 58), k.rect(ANCHO, 4), k.color(...color), k.fixed(), k.z(201)]);
      const t1 = rotulo(nombre, { pos: k.vec2(-ANCHO / 2, ALTO / 2 - 14), tam: 58, color, fijo: true, z: 202, sombra: 5 });
      const t2 = rotulo(sub, { pos: k.vec2(ANCHO * 1.5, ALTO / 2 + 34), tam: 20, color: [235, 230, 245], fijo: true, z: 202, sombra: 2 });
      k.tween(-ANCHO, 0, 0.35, (x) => { banda.pos.x = x; linea.pos.x = x; }, k.easings.easeOutCubic);
      k.tween(-ANCHO / 2, ANCHO / 2, 0.4, (x) => (t1.pos.x = x), k.easings.easeOutBack);
      k.tween(ANCHO * 1.5, ANCHO / 2, 0.45, (x) => (t2.pos.x = x), k.easings.easeOutCubic);
      await esperar(dur);
      k.tween(0, ANCHO, 0.3, (x) => { banda.pos.x = x; linea.pos.x = x; t1.pos.x = ANCHO / 2 + x; t2.pos.x = ANCHO / 2 - x; }, k.easings.easeInCubic);
      await esperar(0.32);
      [banda, linea, t1, t2].forEach((o) => o.destroy());
    }
    function textoPop(cad, color, tam = 80, dur = 0.9) {
      const t = rotulo(cad, { pos: k.vec2(ANCHO / 2, ALTO / 2 - 40), tam, color, fijo: true, z: 210, sombra: 6 });
      t.use(k.scale(0.2));
      k.tween(0.2, 1, 0.3, (s) => (t.scale = k.vec2(s)), k.easings.easeOutBack);
      k.wait(dur, () => k.tween(1, 0, 0.3, (o) => (t.opacity = o)).onEnd(() => t.destroy()));
    }

    const moverA = (obj, dest, dur, ease = k.easings.easeInOutQuad) => new Promise((r) => k.tween(obj.pos.clone(), dest, dur, (v) => (obj.pos = v), ease).onEnd(r));

    // ---------- daño a Mucientes ----------
    k.onCollide("disparo_jefe", "chema", (d) => {
      if (d.usado || ganado) return;
      activarEscudo();
      reflejar(d);
    });
    k.onCollide("disparo_jefe", "mucientes", (d) => {
      if (d.usado || ganado || !luchando) return;
      if (C.escudo > 0 && C.pos.dist(d.pos) < 105) return reflejar(d);
      d.usado = true;
      const pos = d.pos.clone();
      d.destroy();
      if (M.invulnerable > 0) { flotante("INMUNE", pos.add(0, -20), [200, 200, 220], 16); chispas(pos, [200, 200, 220], 5); return; }
      const critico = M.aturdido > 0;
      const dano = critico ? 2 : 1;
      vida = Math.max(0, vida - dano);
      M.flash = 1;
      chispas(pos, critico ? [255, 230, 90] : [255, 180, 120], critico ? 14 : 8);
      flotante(critico ? `-${dano} ¡CRÍTICO!` : `-${dano}`, pos.add(k.rand(-10, 10), -20), critico ? [255, 230, 90] : [255, 255, 255], critico ? 24 : 20);
      critico ? sfx.critico() : sfx.golpe();
      k.shake(critico ? 4 : 2);
      comprobarFase();
      if (vida <= 0) kit.completar();
    });

    function comprobarFase() {
      const frac = vida / VIDA_JEFE;
      const nueva = frac <= UMBRAL_F3 ? 3 : frac <= UMBRAL_F2 ? 2 : 1;
      if (nueva <= fase || vida <= 0) return;
      fase = nueva;
      M.invulnerable = 2;
      M.aturdido = 0;
      sfx.rugido();
      k.shake(14);
      destello(COLOR, 0.6);
      chispas(M.pos.add(0, -100), COLOR, 30);
      cartelGrande(fase === 2 ? "FASE 2" : "FASE 3", fase === 2 ? "¡Armadura de combate! Ahora embiste con la espada" : "¡FURIA! Lluvia de misiles y refuerzos", COLOR, 1.3);
    }

    // ================= ATAQUES DE MUCIENTES =================
    const DESCANSO = () => (fase === 1 ? 1.4 : fase === 2 ? 1.0 : 0.6);

    async function ataqueCanon() {
      const x = p.pos.x < ANCHO / 2 ? k.rand(640, 800) : k.rand(160, 320);
      await moverA(M, k.vec2(x, k.rand(220, 270)), 0.7);
      if (!activo()) return;
      animM("canon");
      M.mira = 0;
      M.spr.flipX = p.pos.x < M.pos.x;
      const boca = () => M.pos.add(delanteM() * 100, -112);
      // carga
      sfx.carga(0.6);
      const carga = k.add([k.pos(boca()), k.circle(4), k.color(255, 120, 190), k.opacity(0.9), k.anchor("center"), k.z(15)]);
      k.tween(4, 26, 0.6, (r) => (carga.radius = r));
      await esperar(0.6);
      carga.destroy();
      if (!activo()) { M.mira = 1; return; }
      const n = fase === 1 ? 3 : fase === 2 ? 4 : 6;
      for (let i = 0; i < n && activo(); i++) {
        const desde = boca();
        const dir = p.pos.add(0, -36).sub(desde).unit();
        const abanico = (i - (n - 1) / 2) * 0.12;
        bala(desde, k.vec2(dir.x * Math.cos(abanico) - dir.y * Math.sin(abanico), dir.x * Math.sin(abanico) + dir.y * Math.cos(abanico)), 360 + fase * 50);
        sfx.canon();
        chispas(desde, [255, 150, 200], 6);
        M.pos.x -= delanteM() * 6;
        k.shake(1.5);
        await esperar(0.16);
      }
      M.mira = 1;
      await esperar(0.4);
      animM("flotar");
    }

    async function ataqueVision() {
      animM("volar");
      const veces = fase === 3 ? 2 : 1;
      for (let v = 0; v < veces && activo(); v++) {
        const caja = k.add([k.pos(p.pos), k.z(20), { fijado: false, ancho: 110, alto: 160,
          draw() {
            const w = this.ancho, h = this.alto, c = this.fijado ? k.rgb(255, 40, 60) : k.rgb(255, 90, 110);
            const parp = this.fijado ? (Math.sin(k.time() * 40) > 0 ? 0.35 : 0.08) : 0.1;
            k.drawRect({ pos: k.vec2(-w / 2, -h), width: w, height: h, color: c, opacity: parp });
            const L2 = 22;
            [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
              const cx = sx * w / 2, cy = sy < 0 ? -h : 0;
              k.drawLine({ p1: k.vec2(cx, cy), p2: k.vec2(cx - sx * L2, cy), width: 4, color: c });
              k.drawLine({ p1: k.vec2(cx, cy), p2: k.vec2(cx, cy - sy * L2), width: 4, color: c });
            });
            const barrido = ((k.time() * 1.6) % 1) * h;
            if (!this.fijado) k.drawLine({ p1: k.vec2(-w / 2, -barrido), p2: k.vec2(w / 2, -barrido), width: 2, color: c, opacity: 0.8 });
            k.drawText({ text: `persona ${(0.9 + (Math.sin(k.time() * 7) * 0.05 + 0.05)).toFixed(2)}`, pos: k.vec2(-w / 2, -h - 18), size: 13, color: c });
          } }]);
        const rastreo = fase === 3 ? 1.2 : 1.6;
        let t = 0;
        while (t < rastreo && activo()) { caja.pos = caja.pos.lerp(p.pos, Math.min(1, 5 * k.dt())); t += k.dt(); await esperar(0); }
        caja.fijado = true;
        sfx.alarma();
        await esperar(fase === 3 ? 0.45 : 0.6);
        if (!activo()) { caja.destroy(); break; }
        // láser desde lo alto hasta el suelo, del ancho del recuadro
        sfx.laser();
        k.shake(6);
        destello([255, 60, 90], 0.25);
        const x = caja.pos.x;
        const rayo = k.add([k.pos(x, 0), k.z(19), { vida: 0.4, draw() {
          const pulso = 0.8 + Math.sin(k.time() * 60) * 0.2, h = SUELO;
          k.drawRect({ pos: k.vec2(-58, 0), width: 116, height: h, color: k.rgb(255, 40, 70), opacity: 0.3 * pulso });
          k.drawRect({ pos: k.vec2(-26, 0), width: 52, height: h, color: k.rgb(255, 120, 150), opacity: 0.8 * pulso });
          k.drawRect({ pos: k.vec2(-9, 0), width: 18, height: h, color: k.rgb(255, 255, 255), opacity: pulso });
        } }]);
        chispas(k.vec2(x, SUELO), [255, 90, 120], 16);
        for (let i = 0; i < 6; i++) {
          if (Math.abs(p.pos.x - x) < 55 && p.pos.y > caja.pos.y - 170) kit.herir();
          await esperar(0.06);
        }
        rayo.destroy();
        caja.destroy();
        await esperar(0.2);
      }
      animM("flotar");
    }

    async function ataqueEmbestida() {
      animM("volar");
      await moverA(M, k.vec2(M.pos.x, 150), 0.5, k.easings.easeOutQuad);
      if (!activo()) return;
      // aviso: línea discontinua hasta el objetivo
      let objetivo = k.vec2(k.clamp(p.pos.x, 90, ANCHO - 140), SUELO);
      sfx.alarma();
      const aviso = k.add([k.z(18), { draw() {
        const a = M.pos.add(0, -60), b = objetivo;
        const dir = b.sub(a), largo = dir.len(), u = dir.unit();
        for (let s = 0; s < largo; s += 26) k.drawLine({ p1: a.add(u.scale(s)), p2: a.add(u.scale(Math.min(largo, s + 14))), width: 5, color: k.rgb(255, 60, 80), opacity: 0.85 });
        k.drawEllipse({ pos: b, radiusX: 70, radiusY: 14, color: k.rgb(255, 40, 60), opacity: 0.25 + Math.sin(k.time() * 25) * 0.15 });
        k.drawText({ text: "!", pos: b.add(0, -60), size: 44, anchor: "center", color: k.rgb(255, 80, 90) });
      } }]);
      let t = 0;
      while (t < 0.85 && activo()) { if (t < 0.55) objetivo = k.vec2(k.clamp(k.lerp(objetivo.x, p.pos.x, 8 * k.dt()), 90, ANCHO - 140), SUELO); t += k.dt(); await esperar(0); }
      aviso.destroy();
      if (!activo()) return;
      animM("espada");
      M.spr.flipX = objetivo.x < M.pos.x;
      M.mira = 0;
      await moverA(M, objetivo, 0.3, k.easings.easeInQuad);
      // impacto + onda expansiva por el suelo (hay que saltarla)
      sfx.impacto();
      k.shake(16);
      destello([255, 200, 160], 0.35);
      chispas(objetivo.add(0, -10), [255, 200, 120], 24);
      for (let i = 0; i < 6; i++) { const h = k.add([k.pos(objetivo.add(k.rand(-60, 60), -10)), k.sprite("t_humo", { width: 70, height: 70 }), k.anchor("center"), k.opacity(0.8), k.z(29), k.lifespan(1, { fade: 0.7 })]); h.onUpdate(() => h.move(k.rand(-30, 30), -30)); }
      if (Math.abs(p.pos.x - objetivo.x) < 70 && p.pos.y > SUELO - 120) kit.herir();
      [-1, 1].forEach((d) => {
        const onda = k.add([k.pos(objetivo.x + d * 40, SUELO), k.z(17), { d, r: 0,
          draw() { k.drawEllipse({ pos: k.vec2(0, -14), radiusX: 26, radiusY: 22, color: k.rgb(255, 160, 80), opacity: 0.6 }); k.drawEllipse({ pos: k.vec2(0, -12), radiusX: 14, radiusY: 16, color: k.rgb(255, 240, 200), opacity: 0.9 }); } }]);
        onda.onUpdate(() => {
          onda.move(d * 460, 0);
          if (k.chance(0.4)) chispas(onda.pos.add(0, -6), [255, 170, 90], 1);
          if (Math.abs(p.pos.x - onda.pos.x) < 26 && p.pos.y > SUELO - 34) kit.herir();
          if (onda.pos.x < -40 || onda.pos.x > ANCHO + 40) onda.destroy();
        });
      });
      // aturdido: ventana para atacar
      M.aturdido = fase === 3 ? 1.9 : 2.5;
      M.spr.stop();
      M.spr.frame = 8;
      textoPop("¡AHORA!", [255, 230, 90], 60, 0.8);
      while (M.aturdido > 0 && activo()) await esperar(0.05);
      M.mira = 1;
      if (!activo()) return;
      animM("volar");
      await moverA(M, k.vec2(M.pos.x, 240), 0.6, k.easings.easeOutQuad);
      animM("flotar");
    }

    async function ataqueLluvia() {
      animM("volar");
      await moverA(M, k.vec2(ANCHO / 2, 160), 0.6);
      if (!activo()) return;
      sfx.alarma();
      flotante("¡LLUVIA DE MISILES!", M.pos.add(0, -240), COLOR, 26);
      const n = 8;
      for (let i = 0; i < n && activo(); i++) {
        const x = k.clamp(i % 3 === 0 ? p.pos.x : p.pos.x + k.rand(-260, 260), 30, ANCHO - 30);
        const mira = k.add([k.pos(x, SUELO - 6), k.sprite("t_mira", { width: 70, height: 70 }), k.anchor("center"), k.scale(1, 0.35), k.opacity(1), k.z(16)]);
        mira.onUpdate(() => (mira.opacity = 0.55 + Math.sin(k.time() * 25) * 0.45));
        k.wait(0.85, () => {
          if (!mira.exists()) return;
          const m = k.add([k.pos(x, -60), k.sprite("t_misil", { width: 26, height: 56 }), k.anchor("center"), k.rotate(180), k.z(17)]);
          m.onUpdate(() => {
            m.move(0, 1000);
            if (k.chance(0.7)) k.add([k.pos(m.pos.add(0, -30)), k.circle(k.rand(3, 6)), k.color(255, 200, 120), k.opacity(0.8), k.lifespan(0.3, { fade: 0.25 }), k.z(16)]);
            if (m.pos.y >= SUELO - 10) {
              m.destroy(); mira.destroy();
              explosion(k.vec2(x, SUELO - 12), 1);
              k.shake(5);
              if (Math.abs(p.pos.x - x) < 55 && p.pos.y > SUELO - 90) kit.herir();
            }
          });
        });
        await esperar(0.28);
      }
      await esperar(1.1);
      animM("flotar");
    }

    const ATAQUES = { canon: ataqueCanon, vision: ataqueVision, embestida: ataqueEmbestida, lluvia: ataqueLluvia };
    // Atajos para el equipo desde la consola del navegador:
    //   depurarJefe.fase(2) · depurarJefe.ataque("lluvia") · depurarJefe.ganar()
    window.depurarJefe = {
      fase: (f) => { vida = Math.floor(VIDA_JEFE * (f === 2 ? 0.55 : f === 3 ? 0.25 : 1)); comprobarFase(); },
      ataque: (n) => ATAQUES[n](),
      ganar: () => { vida = 0; kit.completar(); },
      estado: () => ({ vida, fase, luchando, aturdido: M.aturdido, chema: C.modo }),
    };

    async function cerebroMucientes() {
      const ultimos = [];
      while (activo()) {
        await moverA(M, k.vec2(k.rand(220, 740), k.rand(200, 260)), 0.9);
        await esperar(DESCANSO());
        if (!activo()) break;
        const lista = fase === 1 ? ["canon", "vision"] : fase === 2 ? ["canon", "vision", "embestida", "embestida"] : ["lluvia", "embestida", "canon", "vision"];
        let elegido = k.choose(lista);
        if (ultimos[0] === elegido && k.chance(0.7)) elegido = k.choose(lista);
        ultimos.unshift(elegido);
        await ATAQUES[elegido]();
      }
    }

    async function cerebroChema() {
      while (activo()) {
        await esperar(fase === 1 ? k.rand(6, 8) : fase === 2 ? k.rand(4.5, 6) : k.rand(3, 4.5));
        if (!activo()) break;
        // se lanza a un lado y dispara una estrella
        C.modo = "ataque";
        C.spr.play("mover");
        const lado = p.pos.x < ANCHO / 2 ? 1 : -1;
        await moverA(C, k.vec2(k.clamp(p.pos.x + lado * 300, 80, ANCHO - 80), k.rand(230, 300)), 0.55, k.easings.easeOutCubic);
        if (!activo()) break;
        C.spr.play("disparar");
        await esperar(0.25);
        const desde = C.pos.add(C.spr.flipX ? -50 : 50, 10);
        const disparos = fase === 3 ? 3 : 1;
        for (let i = 0; i < disparos && activo(); i++) {
          bala(desde, p.pos.add(0, -36).sub(desde).unit(), 400, "t_estrella_chema", 40);
          sfx.disparo();
          await esperar(0.2);
        }
        await esperar(0.35);
        C.spr.play("flotar");
        C.modo = "orbita";
      }
    }

    // Bots de autómatas en la fase 3
    async function cerebroBots() {
      while (activo()) {
        await esperar(fase === 3 ? 8 : 1);
        if (!activo() || fase < 3) continue;
        const izq = k.chance(0.5);
        const bot = crearFigura(izq ? "bot_calvo" : "bot_alto", [k.pos(izq ? 30 : 20 * T, SUELO), k.opacity(0), k.z(5)], { ancho: 34, alto: izq ? 60 : 76 });
        bot.mirar(izq ? 1 : -1);
        k.tween(0, 1, 0.3, (v) => (bot.opacity = v));
        for (const i of [0, 1, 2]) {
          await esperar(i === 0 ? 0.6 : 1);
          if (!bot.exists() || !activo()) break;
          bot.animar("attack", true);
          const d = izq ? 1 : -1;
          const b = k.add([k.pos(bot.pos.add(d * 26, -18)), k.circle(13), k.color(255, 255, 255), k.outline(3, k.rgb(27, 23, 38)), k.anchor("center"), k.area(), k.offscreen({ destroy: true }), k.z(14), "peligro"]);
          b.add([k.text(i % 2 ? "q1" : "q0", { size: 11 }), k.anchor("center"), k.color(27, 23, 38)]);
          b.onUpdate(() => b.move(d * 280, 0));
        }
        await esperar(0.8);
        if (bot.exists()) k.tween(1, 0, 0.3, (v) => (bot.opacity = v)).onEnd(() => bot.destroy());
      }
    }

    // ================= PRESENTACIÓN =================
    (async () => {
      await kit.panel({
        titulo: "Nivel 11 · Batalla final",
        subtitulo: `${PERSONAJES[id].nombre} contra Mucientes y Chema`,
        puntos: [
          "Dispara a MUCIENTES (ESPACIO sale en diagonal; mantén ↑ para disparar recto arriba). Tiene 3 fases y cada una añade ataques nuevos.",
          "CHEMA gira a su alrededor. Si le das, despliega su ESCUDO y te devuelve el disparo: apunta cuando no esté delante.",
          "Todos los ataques avisan antes: recuadro rojo (sal de él antes del láser), línea roja (va a embestir: aléjate y SALTA la onda del suelo), miras rojas en el suelo (misiles).",
          "Tras embestir, Mucientes se queda ATURDIDO unos segundos: ¡es tu momento! Recibe el doble de daño.",
          "Tienes 5 vidas. M = silenciar el sonido.",
        ],
        controles: [["← + →", "Moverse"], ["↑", "Saltar"], ["ESPACIO", "Disparar"], ["↑ + ESPACIO", "Recto arriba"]],
      });
      // Mucientes desciende
      animM("volar");
      sfx.rugido();
      await moverA(M, k.vec2(ANCHO / 2, 250), 1.3, k.easings.easeOutQuad);
      sfx.impacto();
      k.shake(10);
      animM("flotar");
      await cartelGrande("MUCIENTES", "Señor de la fortaleza de EmprendIA", COLOR, 1.3);
      // llega Chema
      C.spr.play("mover");
      sfx.escudo();
      await moverA(C, M.pos.add(165, -120), 0.8, k.easings.easeOutCubic);
      C.spr.play("flotar");
      C.modo = "orbita";
      await cartelGrande("CHEMA", "Escudo orbital", [140, 230, 255], 1.1);
      textoPop("¡LUCHA!", [255, 214, 90]);
      sfx.lucha();
      await esperar(0.5);
      p.bloqueado = false;
      luchando = true;
      cerebroMucientes();
      cerebroChema();
      cerebroBots();
    })();

    // ================= VICTORIA =================
    async function victoria() {
      ganado = true;
      luchando = false;
      kit.info = "";
      M.mira = 0;
      M.aturdido = 0;
      k.get("bala_enemiga").forEach((b) => b.destroy());
      k.get("peligro").forEach((o) => o.destroy());
      // cámara lenta y explosiones en cadena
      k.debug.timeScale = 0.3;
      destello([255, 255, 255], 0.9);
      sfx.explosion(true);
      for (let i = 0; i < 10; i++) {
        explosion(M.pos.add(k.rand(-60, 60), k.rand(-190, -20)), k.rand(0.8, 1.6));
        M.flash = 1;
        k.shake(6);
        await esperar(0.05);
      }
      k.debug.timeScale = 1;
      animM("volar");
      C.modo = "huye";
      C.spr.play("mover");
      k.tween(C.pos.clone(), k.vec2(-260, -120), 1.2, (v) => (C.pos = v), k.easings.easeInQuad);
      k.tween(0, 25, 1.2, (a) => (M.spr.angle = a));
      await moverA(M, k.vec2(M.pos.x, SUELO + 260), 1.2, k.easings.easeInQuad);
      explosion(k.vec2(M.pos.x, SUELO - 20), 2.4);
      k.shake(18);
      destello([255, 230, 200], 0.8);
      M.hidden = true;
      // liberar a Chaves
      barrotes.forEach((b, i) => k.wait(0.2 + i * 0.1, () => { k.shake(3); chispas(b.pos.add(0, -60), [255, 90, 120], 6); b.destroy(); }));
      ayuda.text = "¡Gracias!";
      k.wait(1, () => k.tween(chaves.pos.y, chaves.pos.y - 80, 0.3, (y) => (chaves.pos.y = y)).onEnd(() => k.tween(chaves.pos.y, SUELO, 0.3, (y) => (chaves.pos.y = y))));
      sfx.victoria();
      textoPop("¡VICTORIA!", [255, 214, 90], 86, 2.4);
      estado.jefeDerrotado = true;
      desbloquear("chaves");
      guardar();
      await esperar(3.6);
      k.go("victoria", { id });
    }
  });
}
