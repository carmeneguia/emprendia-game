// Constructor común de niveles a partir de un mapa ASCII.
//
// Leyenda base:
//   =  suelo            #  plataforma          o  moneda
//   B  bicho enemigo    ^  pinchos             |  puerta (se abre al superar el reto)
//   K  punto de control M  meta (bandera)      P  inicio del jugador
// Cada nivel puede añadir sus propias letras con `solidos` y `casillas`.
//
// Aspecto: cfg.tema elige el fondo ilustrado (src/pintor/fondos.js) y cfg.materiales
// el material de cada letra sólida (src/pintor/terreno.js).
import { k, ANCHO, ALTO, T } from "./k.js";
import { PERSONAJES, TITULOS } from "./datos.js";
import { estado, guardar, desbloquear } from "./estado.js";
import { crearJugador } from "./jugador.js";
import { pintarTerreno } from "./pintor/terreno.js";
import { pintarFondo } from "./pintor/fondos.js";
import { rotulo, cartel, mostrarPanel } from "./ui.js";

export function montarNivel(cfg) {
  const indice = cfg.indice;
  const id = cfg.personaje;
  k.setGravity(cfg.gravedad ?? 2000);

  // ---------- eventos sencillos para que los poderes avisen al nivel ----------
  const oyentes = {};
  const kit = {
    indice,
    personaje: id,
    // vidas base del nivel + 1 por cada nivel ya superado
    vidas: (cfg.vidas ?? 3) + (estado.vidasExtra ?? 0),
    metaAbierta: cfg.metaAbierta ?? true,
    resbaladizo: !!cfg.resbaladizo,
    modoJefe: false,
    terminado: false,
    on(nombre, cb) { (oyentes[nombre] ??= []).push(cb); },
    emit(nombre, ...args) { (oyentes[nombre] ?? []).forEach((cb) => cb(...args)); },
  };

  // ---------- mapa ----------
  const mapa = cfg.mapa ?? [];
  const columnas = Math.max(0, ...mapa.map((f) => f.length));
  const filas = mapa.map((f) => f.padEnd(columnas, " "));
  kit.ancho = cfg.ancho ?? columnas * T;
  kit.alto = cfg.alto ?? filas.length * T;
  kit.buscar = (ch) => {
    const r = [];
    filas.forEach((f, cy) => [...f].forEach((c, cx) => { if (c === ch) r.push({ cx, cy, pos: k.vec2(cx * T, cy * T) }); }));
    return r;
  };
  // centro inferior de una casilla (donde se apoyan los objetos con anchor "bot")
  kit.pie = (cx, cy) => k.vec2(cx * T + T / 2, (cy + 1) * T);

  // ---------- fondo ilustrado en dos capas ----------
  const fondo = pintarFondo(cfg.tema ?? "menu");
  k.add([k.sprite(fondo.lejos, { width: ANCHO, height: ALTO }), k.pos(0, 0), k.fixed(), k.z(-100)]);
  k.add([k.fixed(), k.z(-90), {
    draw() {
      const cam = k.getCamPos();
      const off = -(((cam.x * 0.35) % fondo.anchoMedio) + fondo.anchoMedio) % fondo.anchoMedio;
      const dy = kit.alto > ALTO ? k.clamp((cam.y - (kit.alto - ALTO / 2)) * 0.15, -120, 0) : 0;
      for (const x of [off, off + fondo.anchoMedio]) k.drawSprite({ sprite: fondo.medio, pos: k.vec2(x, dy), width: fondo.anchoMedio, height: ALTO, opacity: cfg.opacidadFondo ?? 0.8 });
      // velo para que el fondo no compita con el primer plano
      k.drawRect({ width: ANCHO, height: ALTO, color: k.rgb(12, 10, 24), opacity: cfg.velo ?? 0.18 });
    },
  }]);
  if (cfg.decorarFondo) cfg.decorarFondo();

  // ---------- terreno pintado ----------
  const materiales = { "=": "madera", "#": "madera", ...(cfg.materiales ?? {}) };
  pintarTerreno(`n${indice}_${cfg.clave ?? ""}`, filas, materiales, T).forEach((tr) => {
    k.add([k.sprite(tr.sprite, { width: tr.ancho, height: tr.alto }), k.pos(tr.x, 0), k.z(-10)]);
  });

  const SOLIDOS = {
    "=": { etiquetas: ["suelo"] },
    "#": { etiquetas: ["suelo", "plataforma"] },
    ...(cfg.solidos ?? {}),
  };

  // Física: une casillas sólidas seguidas en una sola pieza invisible (el dibujo es el terreno pintado).
  filas.forEach((f, cy) => {
    let cx = 0;
    while (cx < f.length) {
      const c = f[cx];
      const s = SOLIDOS[c];
      if (!s) { cx++; continue; }
      let fin = cx;
      while (fin + 1 < f.length && f[fin + 1] === c) fin++;
      const n = fin - cx + 1;
      const pieza = k.add([k.pos(cx * T, cy * T), k.rect(n * T, T, { fill: false }), k.area(), k.body({ isStatic: true }), ...(s.etiquetas ?? ["suelo"])]);
      if (s.alCrear) s.alCrear(pieza, cx, cy, n);
      cx = fin + 1;
    }
  });

  const CASILLAS = {
    o: (cx, cy) => crearMoneda(kit, k.vec2(cx * T + T / 2, cy * T + T / 2)),
    B: (cx, cy) => crearBicho(kit, kit.pie(cx, cy)),
    "^": (cx, cy) => k.add([k.sprite("t_pinchos", { width: T, height: 22 }), k.pos(cx * T, cy * T + T - 22), k.area({ scale: k.vec2(0.8, 0.7), offset: k.vec2(4, 6) }), "peligro"]),
    "|": (cx, cy) => {
      const pu = k.add([k.sprite("t_puerta", { width: T, height: T }), k.pos(cx * T, cy * T), k.opacity(1), k.area(), k.body({ isStatic: true }), "puerta", "suelo"]);
      pu.onUpdate(() => (pu.opacity = 0.75 + Math.sin(k.time() * 6 + cy) * 0.25));
    },
    K: (cx, cy) => {
      const c = k.add([k.pos(kit.pie(cx, cy)), k.rect(30, 72, { fill: false }), k.anchor("bot"), k.area(), "control"]);
      c.apagada = c.add([k.sprite("t_control", { width: 40, height: 72 }), k.anchor("bot")]);
      c.encendida = c.add([k.sprite("t_control_on", { width: 40, height: 72 }), k.anchor("bot")]);
      c.encendida.hidden = true;
    },
    M: (cx, cy) => crearMeta(kit, kit.pie(cx, cy)),
    ...(cfg.casillas ?? {}),
  };
  filas.forEach((f, cy) => [...f].forEach((c, cx) => { if (CASILLAS[c]) CASILLAS[c](cx, cy); }));

  // ---------- jugador ----------
  const inicio = kit.buscar("P")[0];
  const posInicio = cfg.inicio ?? (inicio ? kit.pie(inicio.cx, inicio.cy) : k.vec2(80, kit.alto - 2 * T));
  kit.checkpoint = posInicio.clone();
  const p = crearJugador(kit, id, posInicio, { autoCorrer: cfg.autoCorrer, sinCuerpo: cfg.sinCuerpo });
  kit.jugador = p;

  // ---------- HUD ----------
  const titulo = cfg.titulo ?? `Nivel ${indice + 1} · ${TITULOS[id] ?? ""}`;
  const marco = cartel(10, 8, 330, 58, { z: 99, opacidad: 0.85 });
  k.add([k.fixed(), k.z(100), {
    draw() {
      // retrato (cabeza del personaje), vidas y monedas
      try { k.drawSprite({ sprite: id, frame: 0, pos: k.vec2(42, 37), anchor: "center", width: 52, height: 52, quad: new k.Quad(0.28, 0.02, 0.44, 0.44) }); } catch (e) { /* sin sprite */ }
      const xNombre = 76 + nombreAncho + 14;
      for (let i = 0; i < Math.max(0, kit.vidas); i++) k.drawSprite({ sprite: "t_corazon", pos: k.vec2(xNombre + i * 22, 37), width: 20, height: 18 });
      k.drawSprite({ sprite: "t_moneda", pos: k.vec2(xNombre + Math.max(1, kit.vidas) * 22 + 10, 36), width: 20, height: 20 });
    },
  }]);
  const tituloTxt = rotulo(titulo, { pos: k.vec2(76, 23), tam: 14, color: [255, 214, 110], ancla: "left", fijo: true, z: 100, sombra: 0 });
  const nombreTxt = rotulo(PERSONAJES[id].nombre, { pos: k.vec2(76, 46), tam: 16, ancla: "left", fijo: true, z: 100, sombra: 0 });
  const nombreAncho = nombreTxt.width;
  const hud = rotulo("", { pos: k.vec2(0, 46), tam: 16, ancla: "left", fijo: true, z: 100, sombra: 0 });
  const caja = cartel(ANCHO - 10, 8, 300, 58, { ancla: "topright", z: 99, opacidad: 0.85 });
  const info = rotulo("", { pos: k.vec2(ANCHO - 26, 37), tam: 15, color: [255, 230, 140], ancla: "right", alinear: "right", fijo: true, z: 100, sombra: 0 });
  kit.info = "";
  hud.onUpdate(() => {
    hud.text = `${estado.monedas}`;
    hud.pos.x = 76 + nombreAncho + 14 + Math.max(1, kit.vidas) * 22 + 24;
    marco.width = Math.max(330, hud.pos.x + hud.width + 16, 76 + tituloTxt.width + 6);
    info.text = kit.info;
    caja.hidden = !kit.info;
    if (kit.info) caja.height = Math.max(58, info.height + 22);
  });
  const ayuda = rotulo("← → mover · ↑ saltar · ↓ agacharse · RATÓN apuntar · CLIC/ESPACIO superpoder · R reiniciar · ESC menú", { pos: k.vec2(ANCHO / 2, ALTO - 16), tam: 13, color: [230, 230, 245], fijo: true, z: 100, sombra: 2 });
  k.wait(9, () => k.tween(1, 0, 1, (v) => (ayuda.opacity = v)));

  kit.aviso = (texto, color = [255, 255, 255], dur = 1.6) => {
    const a = rotulo(texto, { pos: k.vec2(ANCHO / 2, ALTO * 0.3), tam: 28, color, ancho: 860, alinear: "center", fijo: true, z: 110, sombra: 4 });
    a.use(k.scale(0.6));
    k.tween(0.6, 1, 0.25, (v) => (a.scale = k.vec2(v)), k.easings.easeOutBack);
    k.wait(dur, () => k.tween(1, 0, 0.4, (v) => (a.opacity = v)).onEnd(() => a.destroy()));
    return a;
  };

  // Panel de instrucciones (pausa el juego hasta pulsar ENTER)
  kit.panel = (opciones) => mostrarPanel({ personaje: id, color: cfg.colorTema ?? [255, 210, 80], ...opciones });
  if (cfg.panelInicio) k.wait(0.05, () => kit.panel(cfg.panelInicio));

  // ---------- cámara ----------
  const seguirCamara = () => {
    const cx = kit.ancho <= ANCHO ? kit.ancho / 2 : k.clamp(p.pos.x + p.dir * 60, ANCHO / 2, kit.ancho - ANCHO / 2);
    const cy = kit.alto <= ALTO ? kit.alto / 2 : k.clamp(p.pos.y - 60, ALTO / 2, kit.alto - ALTO / 2);
    const actual = k.getCamPos();
    k.setCamPos(k.vec2(k.lerp(actual.x, cx, Math.min(1, 8 * k.dt())), k.lerp(actual.y, cy, Math.min(1, 6 * k.dt()))));
  };
  k.setCamPos(k.vec2(
    kit.ancho <= ANCHO ? kit.ancho / 2 : k.clamp(posInicio.x, ANCHO / 2, kit.ancho - ANCHO / 2),
    kit.alto <= ALTO ? kit.alto / 2 : k.clamp(posInicio.y - 60, ALTO / 2, kit.alto - ALTO / 2),
  ));
  kit.camaraFija = null; // un nivel puede fijar la cámara en un punto (vec2)
  k.onUpdate(() => {
    if (cfg.camaraPropia) return;
    if (kit.camaraFija) {
      const a = k.getCamPos();
      k.setCamPos(a.lerp(kit.camaraFija, Math.min(1, 4 * k.dt())));
    } else seguirCamara();
  });

  // ---------- vida, muerte y reaparición ----------
  kit.herir = (empuje = true) => {
    if (kit.terminado || p.inv > 0) return;
    kit.vidas--;
    k.shake(6);
    if (kit.vidas <= 0) return kit.fallar("¡Te has quedado sin vidas!");
    p.inv = 1.5;
    if (empuje && p.jump) p.jump(380);
  };
  kit.morir = () => {
    if (kit.terminado) return;
    kit.vidas--;
    k.shake(8);
    if (kit.vidas <= 0) return kit.fallar("¡Te has quedado sin vidas!");
    p.pos = kit.checkpoint.clone();
    p.vx = 0;
    if (p.vel) p.vel = k.vec2(0, 0);
    p.inv = 1.5;
    kit.emit("reaparecer");
  };
  kit.reiniciar = cfg.reiniciar ?? (() => k.go("nivel", indice));
  kit.fallar = (motivo) => {
    if (kit.terminado) return;
    kit.terminado = true;
    p.bloqueado = true;
    kit.aviso(`${motivo}\nReintentando...`, [255, 120, 120], 2);
    k.wait(2.2, kit.reiniciar);
  };
  kit.abrirMeta = (texto = "¡Reto superado! Ve a la meta") => {
    if (kit.metaAbierta) return;
    kit.metaAbierta = true;
    k.get("puerta").forEach((pu, i) => k.wait(i * 0.06, () => {
      if (!pu.exists()) return;
      chispas(pu.pos.add(T / 2, T / 2), [190, 140, 255], 6);
      pu.destroy();
    }));
    k.get("meta").forEach((m) => m.abrir());
    kit.aviso(texto, [140, 255, 160], 2.2);
  };
  kit.completar = () => {
    if (kit.terminado) return;
    if (cfg.alCompletar) { kit.terminado = true; p.bloqueado = true; return cfg.alCompletar(kit); }
    kit.terminado = true;
    p.bloqueado = true;
    desbloquear(id);
    // pasar de fase da una vida más (solo la primera vez que se supera cada nivel)
    if (indice >= estado.siguiente) {
      estado.vidasExtra = (estado.vidasExtra ?? 0) + 1;
      kit.vidas++;
      kit.aviso("¡+1 VIDA!", [255, 110, 130], 0.7);
    }
    estado.siguiente = Math.max(estado.siguiente, indice + 1);
    guardar();
    chispas(p.pos.add(0, -40), [255, 220, 90], 24);
    k.wait(0.8, () => k.go("desbloqueo", { id, indice, objeto: kit.recompensa }));
  };
  kit.ganarMonedas = (n) => { estado.monedas += n; guardar(); };

  p.onUpdate(() => { if (p.pos.y > kit.alto + 200) kit.morir(); });
  p.onCollide("peligro", () => kit.herir());
  p.onCollide("control", (c) => {
    kit.checkpoint = c.pos.clone();
    if (c.encendida.hidden) { c.encendida.hidden = false; c.apagada.hidden = true; chispas(c.pos.add(0, -60), [120, 255, 150], 8); }
  });
  p.onCollide("meta", (m) => {
    if (kit.metaAbierta) kit.completar();
    else if (!m.avisado) { m.avisado = true; kit.aviso(cfg.textoMetaCerrada ?? "Primero supera el reto del nivel", [255, 190, 90]); k.wait(2, () => (m.avisado = false)); }
  });

  // Enemigos: se pisan desde arriba o se eliminan con el superpoder.
  p.onCollide("enemigo", (e, col) => {
    if (e.inofensivo) return;
    if (col?.isBottom?.() || (p.vel && p.vel.y > 0 && p.pos.y < e.pos.y - 10)) {
      kit.matar(e);
      p.jump?.(520);
    } else kit.herir();
  });
  kit.matar = (e) => {
    if (!e.exists()) return;
    e.destroy();
    kit.emit("enemigo_muerto", e);
    chispas(e.pos.add(0, -14), [255, 120, 100], 8);
    flotante("+1", e.pos.add(0, -30), [255, 230, 90]);
    kit.ganarMonedas(1);
  };
  k.onCollide("poder", "enemigo", (pw, e) => {
    if (e.inmuneAPoder) return;
    kit.matar(e);
    if (!pw.is("atraviesa")) pw.destroy();
  });
  // Ancla de Ferrín: onda al tocar el suelo
  p.onGround?.(() => {
    if (p.anclando) { p.anclando = false; kit.emit("ancla", p); }
  });
  kit.on("ancla", (pj) => {
    k.shake(10);
    const onda = k.add([k.pos(pj.pos), k.circle(10), k.color(255, 160, 60), k.opacity(0.6), k.outline(4, k.rgb(120, 50, 10)), k.anchor("center"), k.z(5)]);
    k.tween(10, 90, 0.3, (r) => (onda.radius = r)).onEnd(() => onda.destroy());
    k.get("enemigo").forEach((e) => { if (e.pos.dist(pj.pos) < 110) kit.matar(e); });
  });

  kit.cuentaAtras = (segundos, alAcabar, etiqueta = "Tiempo") => {
    let resto = segundos;
    const t = { activa: true, resto: () => resto, parar() { this.activa = false; } };
    k.onUpdate(() => {
      if (!t.activa || kit.terminado) return;
      resto -= k.dt();
      kit.info = `${etiqueta}: ${Math.max(0, Math.ceil(resto))}s` + (kit.infoExtra ? `\n${kit.infoExtra}` : "");
      if (resto <= 0) { t.activa = false; alAcabar(); }
    });
    return t;
  };
  // Ejecuta algo una sola vez cuando el jugador pasa de cierta x
  kit.alPasar = (x, cb) => {
    let hecho = false;
    k.onUpdate(() => { if (!hecho && p.pos.x > x) { hecho = true; cb(); } });
  };

  k.onKeyPress("r", () => kit.reiniciar());
  k.onKeyPress("escape", () => k.go("prologo"));
  // Atajo para el equipo: F2 completa el nivel al instante
  k.onKeyPress("f2", () => kit.completar());

  return kit;
}

// ---------- efectos ----------
export function chispas(pos, color = [255, 220, 90], n = 10) {
  for (let i = 0; i < n; i++) {
    const a = k.rand(0, Math.PI * 2), v = k.rand(80, 260);
    const c = k.add([k.pos(pos), k.circle(k.rand(2, 5)), k.color(...color), k.opacity(1), k.anchor("center"), k.z(60), k.lifespan(0.5, { fade: 0.3 }), k.move(k.vec2(Math.cos(a), Math.sin(a)), v)]);
  }
}
export function flotante(cad, pos, color = [255, 255, 255], tam = 18) {
  const t = rotulo(cad, { pos, tam, color, z: 60, sombra: 2 });
  t.use(k.move(k.UP, 60));
  k.wait(0.35, () => k.tween(1, 0, 0.35, (v) => (t.opacity = v)).onEnd(() => t.destroy()));
  return t;
}

export function crearMoneda(kit, pos) {
  const m = k.add([k.pos(pos), k.sprite("t_moneda", { width: 24, height: 24 }), k.anchor("center"), k.scale(1), k.area(), "moneda"]);
  const y0 = pos.y;
  m.onUpdate(() => {
    m.pos.y = y0 + Math.sin(k.time() * 4 + pos.x) * 3;
    m.scale = k.vec2(Math.max(0.15, Math.abs(Math.cos(k.time() * 3 + pos.x * 0.01))), 1);
  });
  m.onCollide("jugador", () => { chispas(m.pos, [255, 220, 90], 6); m.destroy(); kit.ganarMonedas(1); });
  return m;
}

export function crearBicho(kit, pos, opc = {}) {
  const e = k.add([
    k.pos(pos), k.rect(38, 28, { fill: false }), k.anchor("bot"), k.area(), k.body(), "enemigo",
    { dir: opc.dir ?? -1, velocidad: opc.vel ?? 70, x0: pos.x, rango: opc.rango ?? 110 },
  ]);
  e.dibujo = e.add([k.sprite("t_bicho", { anim: "andar", width: 52, height: 38 }), k.anchor("bot"), k.pos(0, 2)]);
  if (opc.color) e.dibujo.use(k.color(...opc.color));
  if (opc.texto) e.add([k.text(opc.texto, { size: 11 }), k.pos(0, -42), k.anchor("center"), k.color(255, 220, 220)]);
  e.onUpdate(() => {
    if (e.congelado) return;
    e.move(e.dir * e.velocidad, 0);
    e.dibujo.flipX = e.dir < 0;
    if (e.rango > 0) {
      if (e.pos.x < e.x0 - e.rango) e.dir = 1;
      if (e.pos.x > e.x0 + e.rango) e.dir = -1;
    }
    if (e.pos.y > kit.alto + 200) e.destroy();
  });
  return e;
}

export function crearMeta(kit, pos) {
  const m = k.add([k.pos(pos), k.rect(44, 212, { fill: false }), k.anchor("bot"), k.area(), "meta"]);
  const abierta = m.add([k.sprite("t_meta", { width: 80, height: 212 }), k.anchor("bot")]);
  const cerrada = m.add([k.sprite("t_meta_cerrada", { width: 80, height: 212 }), k.anchor("bot")]);
  abierta.hidden = !kit.metaAbierta;
  cerrada.hidden = kit.metaAbierta;
  m.abrir = () => { abierta.hidden = false; cerrada.hidden = true; chispas(pos.add(0, -180), [120, 255, 150], 14); };
  return m;
}
