// Nivel 4: El Hadoopeno — "Pánico en el HDFS"
// Tramo 1: saltar cables de red. Reto: sala del Clúster. Los DataNodes se caen (NODE DEAD)
// y se hunden en la lava: lánzales réplicas (hdfs dfs -put) para levantarlos durante 30 segundos.
import { k, T } from "../k.js";
import { montarNivel, crearBicho, chispas, flotante } from "../nivel.js";
import { lienzo } from "../lienzo.js";
import { darObjeto } from "../estado.js";

const NODOS = [63, 70, 77, 84]; // columna izquierda de cada DataNode (4 casillas de ancho)
const FILA_NODO = 9;
const SUPERVIVENCIA = 30;
const MAX_PERDIDOS = 2;
const COLOR = [250, 220, 60];

export function nivelHadoopeno(indice) {
  const L = lienzo(104);
  L.suelo(0, 14).suelo(18, 30).suelo(34, 44).suelo(47, 61).suelo(89, 103);
  L.fila("#", 8, 11, 9).fila("#", 24, 27, 8).fila("#", 38, 41, 9);
  [8, 10, 24, 26, 38, 40].forEach((x, i) => L.pon("o", x, i % 2 ? 7 : 8));
  L.columna("|", 92, 7, 11);
  L.pon("P", 3, 11).pon("K", 57, 11).pon("M", 98, 11);

  const nodos = [];
  let perdidos = 0;
  let enMarcha = false;

  const kit = montarNivel({
    indice,
    personaje: "hadoopeno",
    mapa: L.filas(),
    metaAbierta: false,
    tema: "datacenter",
    colorTema: COLOR,
    materiales: { "=": "metal", "#": "metal_plat" },
    textoMetaCerrada: "Mantén vivo el clúster 30 segundos",
    panelInicio: {
      titulo: "Nivel 4 · Pánico en el HDFS",
      subtitulo: "El Hadoopeno · Rayo Replicador",
      puntos: [
        "Salta los huecos y los bichos 404 hasta llegar a la sala del Clúster.",
        "Tu poder (ESPACIO) lanza un paquete de datos en parábola: sale hacia arriba y cae delante de ti.",
        "En la sala del Clúster te explicaré el reto.",
      ],
      controles: [["← + →", "Moverse"], ["↑", "Saltar"], ["ESPACIO", "Lanzar réplica"]],
    },
  });
  [[22, 11], [36, 11], [52, 11]].forEach(([cx, cy]) => crearBicho(kit, kit.pie(cx, cy), { texto: "404" }));

  // Lava (con burbujas) entre las columnas 62 y 88
  const lavaX = 62 * T, lavaW = 27 * T, lavaY = 12 * T;
  k.add([k.pos(lavaX, lavaY + 10), k.rect(lavaW, 2 * T, { fill: false }), k.area(), "lava", k.z(4), {
    draw() {
      const pts = [];
      for (let x = 0; x <= lavaW; x += 20) pts.push(k.vec2(x, Math.sin(x / 30 + k.time() * 3) * 5 - 6));
      for (let i = 0; i < pts.length - 1; i++) k.drawPolygon({ pts: [pts[i], pts[i + 1], k.vec2(pts[i + 1].x, 100), k.vec2(pts[i].x, 100)], color: k.rgb(230, 70, 20) });
      k.drawLines({ pts, width: 6, color: k.rgb(255, 200, 60) });
      for (let i = 0; i < 9; i++) {
        const fase = (k.time() * 0.7 + i * 0.37) % 1;
        k.drawCircle({ pos: k.vec2((i * 127) % lavaW, 30 - fase * 30), radius: 4 + fase * 5, color: k.rgb(255, 170, 40), opacity: 1 - fase });
      }
    },
  }]);
  // resplandor sobre la lava
  k.add([k.pos(lavaX, lavaY - 120), k.z(-5), { draw() { k.drawRect({ width: lavaW, height: 130, gradient: [k.rgb(255, 120, 40), k.rgb(255, 60, 20)], opacity: 0.18 }); } }]);
  kit.jugador.onCollide("lava", () => kit.morir());

  // NameNode arriba
  const nn = k.add([k.pos(76 * T, 2 * T + 10), k.sprite("t_namenode", { width: 240, height: 80 }), k.anchor("center")]);

  function crearNodo(cx, cy) {
    const n = k.add([
      k.pos(cx * T, cy * T), k.sprite("t_nodo", { width: 4 * T, height: T }), k.color(140, 255, 170),
      k.area(), k.body({ isStatic: true }), "suelo", "datanode",
      { y0: cy * T, muerto: false, perdido: false },
    ]);
    n.etiqueta = n.add([k.text("DataNode OK", { size: 12 }), k.pos(2 * T, -14), k.anchor("center"), k.color(160, 255, 190)]);
    n.onUpdate(() => {
      if (n.perdido) return;
      if (n.muerto) {
        n.pos.y += 22 * k.dt();
        n.color = Math.sin(k.time() * 14) > 0 ? k.rgb(255, 80, 80) : k.rgb(150, 40, 40);
        if (n.pos.y > 12 * T - 10) perder(n);
      } else if (n.pos.y > n.y0) {
        n.pos.y = Math.max(n.y0, n.pos.y - 90 * k.dt());
      }
    });
    return n;
  }
  NODOS.forEach((x) => nodos.push(crearNodo(x, FILA_NODO)));

  function perder(n) {
    n.perdido = true;
    perdidos++;
    chispas(n.pos.add(2 * T, 0), [255, 120, 40], 16);
    kit.aviso(`¡Hemos perdido un DataNode! (${perdidos}/${MAX_PERDIDOS})`, [255, 140, 90], 1.4);
    k.tween(n.pos.y, n.pos.y + 200, 0.6, (y) => (n.pos.y = y)).onEnd(() => n.destroy());
    if (perdidos >= MAX_PERDIDOS) kit.fallar("¡El clúster se ha caído!");
  }

  const reparar = (n) => {
    n.muerto = false;
    n.color = k.rgb(140, 255, 170);
    n.etiqueta.text = "DataNode OK";
    n.etiqueta.color = k.rgb(160, 255, 190);
  };
  k.onCollide("replica", "datanode", (r, n) => {
    r.destroy();
    if (!n.muerto) return;
    reparar(n);
    kit.ganarMonedas(1);
    chispas(n.pos.add(2 * T, 0), [140, 255, 170], 12);
    flotante("+1 réplica", n.pos.add(2 * T, -30), [255, 240, 120], 16);
  });

  // Bloques que reparte el NameNode
  k.loop(0.7, () => {
    if (!enMarcha) return;
    const vivos = nodos.filter((n) => n.exists() && !n.perdido);
    if (!vivos.length) return;
    const n = k.choose(vivos);
    const b = k.add([k.pos(nn.pos.add(0, 30)), k.sprite("t_paquete", { width: 18, height: 16 }), k.anchor("center"), k.opacity(1), k.lifespan(0.6, { fade: 0.2 })]);
    k.tween(b.pos, n.pos.add(2 * T, 0), 0.5, (v) => (b.pos = v));
  });

  kit.alPasar(62 * T, async () => {
    kit.checkpoint = kit.pie(64, FILA_NODO - 1);
    await kit.panel({
      titulo: "Reto · Pánico en el HDFS",
      subtitulo: "Mantén vivo el clúster",
      puntos: [
        "Arriba, el NameNode reparte bloques a 4 DataNodes que flotan sobre la lava.",
        "Cada pocos segundos un DataNode se cae: parpadea en ROJO (NODE DEAD) y se hunde poco a poco.",
        "Lánzale una réplica (ESPACIO) para repararlo: vuelve a ponerse verde y sube a su sitio.",
        `Aguanta ${SUPERVIVENCIA} segundos. Si se hunden ${MAX_PERDIDOS} DataNodes, el clúster cae y repites.`,
        "Salta de servidor en servidor para llegar a tiempo. ¡No toques la lava!",
      ],
      controles: [["ESPACIO", "Réplica (en parábola)"], ["↑", "Saltar"]],
    });
    enMarcha = true;
    kit.cuentaAtras(SUPERVIVENCIA, () => {
      enMarcha = false;
      nodos.forEach((n) => { if (n.exists() && !n.perdido) reparar(n); });
      darObjeto("Pegatina del Elefante Amarillo");
      kit.recompensa = "Pegatina del Elefante Amarillo";
      kit.abrirMeta("¡Clúster estable!\nPegatina del Elefante Amarillo conseguida");
    }, "Aguanta");
    const tumbar = () => {
      if (!enMarcha || kit.terminado) return;
      const sanos = nodos.filter((n) => n.exists() && !n.muerto && !n.perdido);
      if (sanos.length > 1) {
        const n = k.choose(sanos);
        n.muerto = true;
        n.etiqueta.text = "NODE DEAD";
        n.etiqueta.color = k.rgb(255, 120, 120);
      }
      k.wait(k.rand(2.2, 3.4), tumbar);
    };
    k.wait(1.5, tumbar);
  });
}
