// Sprites de los personajes.
// Cada hoja es una cuadrícula de 4 x 4 (preparada con herramientas/procesar_sprites.py):
//   fila 1 andar · fila 2 correr · fila 3 saltar · fila 4 superpoder
// Para añadir un personaje nuevo: poner su PNG en assets/sprites/originales/, ejecutar
// `python3 herramientas/procesar_sprites.py` y añadir una línea en ARCHIVOS con el id de datos.js.
// Los personajes sin archivo usan un dibujo provisional generado por código (src/pintor/munecos.js).
import { ESTILOS_MUNECO, pintarHojaMuneco } from "./pintor/munecos.js";
import { QUIETO } from "./sprites_quieto.js";

// id del juego -> nombre del archivo (sin .png)
const ARCHIVOS = {
  alberto: "alberto",
  hadoopeno: "alvaro",
  bugarin: "bugarin",
  chema: "chema",
  ferrin: "ferrin",
  fosil: "fosil",
  bianca: "loreto",
  mucientes: "mucientes",
  paiboll: "pabloquesada",
  bases: "viqueira",
  catala: "catala",
  pet: "pet",
  julian: "julian",
  chaves: "chaves",
};

// Ajustes opcionales por personaje: escala (1 = normal)
const AJUSTES = {};

const ANIMS = {
  idle: 0,
  walk: { from: 0, to: 3, loop: true, speed: 8 },
  run: { from: 4, to: 7, loop: true, speed: 12 },
  jump: { from: 8, to: 11, loop: false, speed: 10 },
  attack: { from: 12, to: 15, loop: false, speed: 14 },
};

// Animaciones propias de la batalla final (filas de sus hojas)
const ANIMS_JEFES = {
  // Chema en su cápsula: flotar · escudo · desplazarse · disparar
  chema: {
    flotar: { from: 0, to: 3, loop: true, speed: 6 },
    escudo: { from: 4, to: 7, loop: false, speed: 14 },
    mover: { from: 8, to: 11, loop: true, speed: 10 },
    disparar: { from: 12, to: 15, loop: false, speed: 12 },
  },
  // Mucientes con armadura: flotar · espadazo · vuelo · cañón
  mucientes: {
    flotar: { from: 0, to: 3, loop: true, speed: 6 },
    espada: { from: 4, to: 7, loop: false, speed: 10 },
    // solo 8-9: los fotogramas 10-11 de la hoja traen el humo con un recuadro de fondo
    volar: { from: 8, to: 9, loop: true, speed: 8 },
    canon: { from: 12, to: 15, loop: false, speed: 9 },
  },
};

export const SPRITES = {};
for (const [id, archivo] of Object.entries(ARCHIVOS)) SPRITES[id] = { archivo: `assets/sprites/${archivo}.png`, quieto: QUIETO[archivo] ?? 0, ...(AJUSTES[id] ?? {}) };
for (const id of Object.keys(ESTILOS_MUNECO)) if (!SPRITES[id]) SPRITES[id] = { provisional: true, ...(AJUSTES[id] ?? {}) };

export function cargarSprites(k) {
  for (const [id, s] of Object.entries(SPRITES)) {
    const fuente = s.provisional ? pintarHojaMuneco(ESTILOS_MUNECO[id]) : s.archivo;
    // "idle" = fotograma con los pies juntos (las hojas no tienen fila de estar parado)
    k.loadSprite(id, fuente, { sliceX: 4, sliceY: 4, anims: { ...ANIMS, idle: s.quieto ?? 0, ...(ANIMS_JEFES[id] ?? {}) } });
  }
}
