// Prólogo de Amparo, menú principal, selector de niveles y cartel de desbloqueo.
import { k, ANCHO, ALTO } from "../k.js";
import { PERSONAJES, ORDEN, TITULOS } from "../datos.js";
import { estado, nuevaPartida } from "../estado.js";
import { crearFigura } from "../figura.js";
import { pintarFondo } from "../pintor/fondos.js";
import { rotulo, cartel } from "../ui.js";
import { chispas } from "../nivel.js";

const DIALOGO = [
  "¡Hola! Soy Amparo. Te doy la bienvenida.",
  "¡Emergencia! Mucientes se ha atrincherado en la fortaleza de EmprendIA y tiene retenido a Chaves.",
  "Recluta al equipo superando sus pruebas para el asalto final.",
];

// Fondo ilustrado (estrellas y la fortaleza a lo lejos) que se desliza despacio
function fondoMenu(tema = "menu") {
  const f = pintarFondo(tema);
  k.add([k.sprite(f.lejos, { width: ANCHO, height: ALTO }), k.z(-100)]);
  k.add([k.z(-90), {
    draw() {
      const off = -((k.time() * 12) % f.anchoMedio);
      for (const x of [off, off + f.anchoMedio]) k.drawSprite({ sprite: f.medio, pos: k.vec2(x, 0), width: f.anchoMedio, height: ALTO });
    },
  }]);
}

// Menú vertical reutilizable: opciones = [{ texto, accion }]
function menu(opciones, x, y, tam = 22, ancho = 420) {
  let sel = 0;
  const alto = tam + 18;
  const resalte = cartel(x - 16, y - alto / 2, ancho, alto, { fijo: false, z: 1, color: [255, 214, 110], borde: [27, 23, 38], opacidad: 0.95, radio: alto / 2, grosor: 3 });
  const items = opciones.map((o, i) => rotulo(o.texto, { pos: k.vec2(x, y + i * alto), tam, ancla: "left", z: 2, sombra: 0 }));
  const pintar = () => {
    items.forEach((it, i) => (it.color = i === sel ? k.rgb(27, 23, 38) : k.rgb(235, 235, 250)));
    resalte.pos.y = y + sel * alto - alto / 2;
  };
  pintar();
  k.onKeyPress(["down", "s"], () => { sel = (sel + 1) % opciones.length; pintar(); });
  k.onKeyPress(["up", "w"], () => { sel = (sel - 1 + opciones.length) % opciones.length; pintar(); });
  k.onKeyPress(["enter", "space"], () => opciones[sel].accion());
}

export function registrarMenus() {
  k.scene("prologo", () => {
    k.setCamPos(k.vec2(ANCHO / 2, ALTO / 2));
    fondoMenu();
    const titulo = rotulo("ASALTO A EMPRENDIA", { pos: k.vec2(ANCHO / 2, 70), tam: 58, color: [255, 214, 90], sombra: 6 });
    titulo.use(k.scale(1));
    titulo.onUpdate(() => (titulo.scale = k.vec2(1 + Math.sin(k.time() * 2) * 0.02)));
    rotulo("¡Rescata a Chaves!", { pos: k.vec2(ANCHO / 2, 122), tam: 22, color: [230, 220, 255], sombra: 3 });

    const amparo = crearFigura("amparo", [k.pos(140, 470)], { ancho: 60, alto: 120 });
    amparo.animar("walk");
    amparo.onUpdate(() => (amparo.pos.y = 470 + Math.sin(k.time() * 2) * 3));
    rotulo("Amparo", { pos: k.vec2(140, 500), tam: 18, color: [255, 140, 190], sombra: 3 });

    // Caja de diálogo con efecto máquina de escribir
    cartel(268, 196, 640, 150, { fijo: false, color: [33, 29, 56], borde: [255, 140, 190], radio: 20, grosor: 5, z: 0 });
    k.add([k.pos(268, 270), k.z(0), { draw() { k.drawTriangle({ p1: k.vec2(0, -16), p2: k.vec2(0, 16), p3: k.vec2(-24, 30), color: k.rgb(255, 140, 190) }); } }]);
    const linea = k.add([k.text("", { size: 21, width: 600, lineSpacing: 6 }), k.pos(290, 218), k.color(255, 255, 255), k.z(1)]);
    const pista = rotulo("ENTER para continuar", { pos: k.vec2(890, 326), tam: 14, ancla: "right", color: [200, 190, 230], sombra: 0 });

    let i = 0, letras = 0, enMenu = false;
    linea.onUpdate(() => {
      if (enMenu) return;
      letras = Math.min(DIALOGO[i].length, letras + k.dt() * 45);
      linea.text = DIALOGO[i].slice(0, Math.floor(letras));
      amparo.animar(letras < DIALOGO[i].length ? "attack" : "idle");
    });

    const mostrarMenu = () => {
      enMenu = true;
      amparo.animar("idle");
      pista.text = "↑ ↓ elegir · ENTER aceptar";
      const ops = [];
      if (estado.siguiente > 0 && estado.siguiente < ORDEN.length) {
        ops.push({ texto: `Continuar (Nivel ${estado.siguiente + 1})`, accion: () => k.go("nivel", estado.siguiente) });
      }
      if (estado.siguiente >= ORDEN.length) {
        ops.push({ texto: "Ir a la fortaleza (batalla final)", accion: () => k.go("seleccion") });
      }
      ops.push({ texto: "Nueva partida", accion: () => { nuevaPartida(); k.go("nivel", 0); } });
      ops.push({ texto: "Elegir nivel (equipo)", accion: () => k.go("niveles") });
      menu(ops, 330, 392, 20, 380);
    };

    k.onKeyPress("enter", () => {
      if (enMenu) return;
      if (letras < DIALOGO[i].length) { letras = DIALOGO[i].length; return; }
      i++;
      letras = 0;
      if (i >= DIALOGO.length) { i = DIALOGO.length - 1; letras = DIALOGO[i].length; k.wait(0, mostrarMenu); }
    });
  });

  k.scene("niveles", () => {
    k.setCamPos(k.vec2(ANCHO / 2, ALTO / 2));
    fondoMenu();
    rotulo("Elegir nivel", { pos: k.vec2(ANCHO / 2, 38), tam: 36, color: [255, 214, 90], sombra: 4 });
    cartel(120, 66, 720, 460, { fijo: false, color: [33, 29, 56], borde: [255, 214, 90], radio: 20, z: 0, opacidad: 0.88 });
    const ops = ORDEN.map((id, i) => ({ texto: `${i + 1}. ${PERSONAJES[id].nombre} · ${TITULOS[id]}`, accion: () => k.go("nivel", i) }));
    ops.push({ texto: "11. Fortaleza de EmprendIA (todos desbloqueados)", accion: () => k.go("seleccion", { todos: true }) });
    ops.push({ texto: "Volver", accion: () => k.go("prologo") });
    menu(ops, 160, 98, 16, 660);
  });

  k.scene("desbloqueo", ({ id, indice, objeto }) => {
    k.setCamPos(k.vec2(ANCHO / 2, ALTO / 2));
    fondoMenu();
    const pj = PERSONAJES[id];
    // foco de luz
    k.add([k.pos(ANCHO / 2, 318), { draw() { k.drawCircle({ radius: 150 + Math.sin(k.time() * 3) * 8, color: k.rgb(255, 214, 90), opacity: 0.15 }); k.drawEllipse({ pos: k.vec2(0, 0), radiusX: 90, radiusY: 16, color: k.rgb(0, 0, 0), opacity: 0.35 }); } }]);
    const fig = crearFigura(id, [k.pos(ANCHO / 2, 318)], { ancho: 80, alto: 130 });
    fig.use(k.scale(0));
    fig.animar("attack");
    k.tween(0, 1, 0.6, (v) => (fig.scale = k.vec2(v)), k.easings.easeOutBack);
    k.loop(1.2, () => fig.animar("attack", true));
    k.loop(0.25, () => chispas(k.vec2(ANCHO / 2 + k.rand(-160, 160), k.rand(150, 330)), [255, 214, 90], 4));
    rotulo(`¡${pj.nombre.toUpperCase()} ${pj.fem ? "DESBLOQUEADA" : "DESBLOQUEADO"}\nPARA LA BATALLA FINAL!`, { pos: k.vec2(ANCHO / 2, 80), tam: 36, ancho: 900, alinear: "center", color: [255, 214, 90], sombra: 5 });
    rotulo(`Superpoder: ${pj.poder}`, { pos: k.vec2(ANCHO / 2, 368), tam: 20, color: [200, 225, 255], sombra: 3 });
    const extra = objeto ? `Has conseguido: ${objeto}\n` : "";
    const sig = indice + 1 < ORDEN.length ? `Siguiente: Nivel ${indice + 2} con ${PERSONAJES[ORDEN[indice + 1]].nombre}` : "¡Las puertas de la fortaleza de EmprendIA se abren!";
    cartel(ANCHO / 2, 452, 640, 110, { ancla: "center", fijo: false, color: [33, 29, 56], borde: [255, 214, 90], radio: 18, z: 0, opacidad: 0.9 });
    rotulo(`${extra}Monedas: ${estado.monedas}\n${sig}\n(ENTER para seguir)`, { pos: k.vec2(ANCHO / 2, 452), tam: 17, ancho: 600, alinear: "center", sombra: 0 });

    const seguir = () => (indice + 1 < ORDEN.length ? k.go("nivel", indice + 1) : k.go("seleccion"));
    k.wait(6, seguir);
    k.wait(0.8, () => k.onKeyPress(["enter", "space"], seguir));
  });
}
