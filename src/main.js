// Punto de entrada: carga recursos, registra escenas y arranca en el prólogo.
import { k } from "./k.js";
import { cargarSprites } from "./sprites.js";
import { generarObjetos } from "./pintor/objetos.js";
import { registrarMenus } from "./escenas/menus.js";
import { registrarFinal } from "./escenas/final.js";
import { registrarJefe } from "./escenas/jefe.js";
import { NIVELES } from "./niveles/index.js";

generarObjetos();
cargarSprites(k);
registrarMenus();
registrarFinal();
registrarJefe();

k.scene("nivel", (indice) => {
  const crear = NIVELES[indice];
  if (!crear) return k.go("prologo");
  try {
    crear(indice);
  } catch (e) {
    console.error(e);
    k.add([k.text(`Error en el nivel ${indice + 1}:\n${e.message}`, { size: 18, width: 900 }), k.pos(20, 20), k.fixed(), k.z(999), k.color(255, 120, 120)]);
  }
});

// Acceso desde la consola del navegador para pruebas: juego.go("nivel", 3)
window.juego = k;

k.onLoad(() => k.go("prologo"));
