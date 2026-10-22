// Instancia única de Kaplay que comparten todos los archivos.
import kaplay from "../lib/kaplay.mjs";

export const ANCHO = 960;
export const ALTO = 540;
export const T = 40; // tamaño de casilla de los mapas ASCII

export const k = kaplay({
  width: ANCHO,
  height: ALTO,
  letterbox: true,
  background: [11, 13, 23],
  // letra redondeada del sistema (si no existe, el navegador usa la siguiente)
  font: '"Arial Rounded MT Bold", "Trebuchet MS", Arial, sans-serif',
  // los sprites son ilustraciones, no pixel art: suavizado al escalar
  texFilter: "linear",
  global: false,
  debugKey: "f1",
});
