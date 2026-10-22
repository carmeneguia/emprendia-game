// Nivel 11 (FINAL): selección de héroe, batalla contra Mucientes y Chema, y pantalla de victoria.
import { k, ANCHO, ALTO, T } from "../k.js";
import { PERSONAJES, ORDEN } from "../datos.js";
import { estado, guardar, desbloquear } from "../estado.js";
import { crearFigura } from "../figura.js";
import { montarNivel, chispas, flotante } from "../nivel.js";
import { pintarFondo } from "../pintor/fondos.js";
import { rotulo } from "../ui.js";
import { lienzo } from "../lienzo.js";

const VIDA_JEFE = 30;

export function registrarFinal() {
  // ---------------- "Choose Your Fighter" ----------------
  k.scene("seleccion", (opc = {}) => {
    k.setCamPos(k.vec2(ANCHO / 2, ALTO / 2));
    const f0 = pintarFondo("fortaleza");
    k.add([k.sprite(f0.lejos, { width: ANCHO, height: ALTO })]);
    k.add([k.sprite(f0.medio, { width: f0.anchoMedio, height: ALTO }), k.opacity(0.6)]);
    rotulo("CHOOSE YOUR FIGHTER", { pos: k.vec2(ANCHO / 2, 50), tam: 44, color: [255, 220, 80], sombra: 5 });
    const lista = [...ORDEN, ...(estado.jefeDerrotado || opc.todos ? ["chaves"] : [])];
    const ninguno = estado.desbloqueados.length === 0;
    const disponible = (id) => opc.todos || ninguno || estado.desbloqueados.includes(id) || (id === "chaves" && estado.jefeDerrotado);
    const COLS = 6;
    const cartas = lista.map((id, i) => {
      const x = 110 + (i % COLS) * 148, y = 108 + Math.floor(i / COLS) * 186;
      const ok = disponible(id);
      const c = k.add([k.pos(x, y), k.rect(132, 170, { radius: 14 }), k.anchor("top"), k.color(40, 22, 40), k.opacity(0.92), k.outline(3, k.rgb(90, 60, 90)), k.scale(1)]);
      let fig = null;
      if (ok) fig = crearFigura(id, [k.pos(0, 132)], { padre: c, ancho: 44, alto: 82 });
      else c.add([k.text("?", { size: 60 }), k.pos(0, 80), k.anchor("center"), k.color(90, 70, 90)]);
      c.add([k.text(ok ? PERSONAJES[id].nombre : "Bloqueado", { size: 13, width: 124, align: "center" }), k.pos(0, 152), k.anchor("center"), k.color(255, 255, 255)]);
      return { id, ok, c, fig };
    });
    const info = rotulo("", { pos: k.vec2(ANCHO / 2, ALTO - 30), tam: 17, ancho: 900, alinear: "center", color: [220, 230, 255], sombra: 2 });
    if (ninguno && !opc.todos) k.add([k.text("(Modo prueba: todavía no hay nadie desbloqueado, puedes elegir a cualquiera)", { size: 12 }), k.pos(ANCHO / 2, 92), k.anchor("center"), k.color(200, 160, 160)]);
    let sel = Math.max(0, cartas.findIndex((c) => c.ok));
    const pintar = () => {
      cartas.forEach((c, i) => {
        const elegida = i === sel;
        c.c.outline.color = elegida ? k.rgb(255, 220, 80) : k.rgb(90, 60, 90);
        c.c.outline.width = elegida ? 5 : 3;
        c.c.scale = k.vec2(elegida ? 1.06 : 1);
        c.c.color = elegida ? k.rgb(80, 30, 60) : k.rgb(40, 22, 40);
        c.fig?.animar(elegida ? "walk" : "idle");
      });
      const c = cartas[sel];
      info.text = c.ok ? `${PERSONAJES[c.id].nombre} — ${PERSONAJES[c.id].poder}\nENTER para luchar` : "Personaje bloqueado";
    };
    pintar();
    const mover = (d) => { sel = (sel + d + cartas.length) % cartas.length; pintar(); };
    k.onKeyPress(["right", "d"], () => mover(1));
    k.onKeyPress(["left", "a"], () => mover(-1));
    k.onKeyPress(["down", "s"], () => mover(COLS));
    k.onKeyPress(["up", "w"], () => mover(-COLS));
    k.onKeyPress("enter", () => { if (cartas[sel].ok) k.go("jefe", { id: cartas[sel].id }); });
    k.onKeyPress("escape", () => k.go("prologo"));
  });

  // ---------------- Victoria ----------------
  k.scene("victoria", ({ id }) => {
    k.setCamPos(k.vec2(ANCHO / 2, ALTO / 2));
    const f0 = pintarFondo("menu");
    k.add([k.sprite(f0.lejos, { width: ANCHO, height: ALTO })]);
    k.add([k.sprite(f0.medio, { width: f0.anchoMedio, height: ALTO }), k.opacity(0.8)]);
    rotulo("¡VICTORIA!", { pos: k.vec2(ANCHO / 2, 80), tam: 70, color: [255, 220, 80], sombra: 6 });
    rotulo(`${PERSONAJES[id].nombre} ha derrotado a Mucientes\ny Chaves vuelve a ser libre.`, { pos: k.vec2(ANCHO / 2, 165), tam: 24, ancho: 860, alinear: "center", sombra: 3 });
    k.loop(0.15, () => chispas(k.vec2(k.rand(100, ANCHO - 100), k.rand(60, 300)), [k.rand(150, 255), k.rand(150, 255), k.rand(80, 255)], 6));
    const equipo = [...ORDEN, "chaves", "amparo"];
    equipo.forEach((pj, i) => {
      const x = 60 + i * (ANCHO - 120) / (equipo.length - 1);
      const f = crearFigura(pj, [k.pos(x, 400)], { ancho: 34, alto: 72 });
      f.animar("jump");
      f.onUpdate(() => (f.pos.y = 400 - Math.abs(Math.sin(k.time() * 4 + i)) * 24));
    });
    k.add([k.text(`Monedas totales: ${estado.monedas}\nChaves ya se puede elegir en la batalla final (modo libre)\n\nENTER para volver al inicio`, { size: 16, align: "center", width: 860 }), k.pos(ANCHO / 2, 470), k.anchor("center"), k.color(200, 220, 255)]);
    k.onKeyPress("enter", () => k.go("prologo"));
  });
}
