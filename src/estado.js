// Progreso de la partida (personajes desbloqueados, monedas, objetos).
// Se guarda en el navegador; si no se puede guardar, el juego sigue igual.

const CLAVE = "emprendia-partida-v1";

const vacio = () => ({ desbloqueados: [], monedas: 0, objetos: [], siguiente: 0, jefeDerrotado: false });

export const estado = cargar();

function cargar() {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (raw) return { ...vacio(), ...JSON.parse(raw) };
  } catch (e) { /* sin almacenamiento */ }
  return vacio();
}

export function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) { /* nada */ }
}

export function nuevaPartida() {
  Object.assign(estado, vacio());
  guardar();
}

export function desbloquear(id) {
  if (!estado.desbloqueados.includes(id)) estado.desbloqueados.push(id);
  guardar();
}

export function darObjeto(nombre) {
  if (!estado.objetos.includes(nombre)) estado.objetos.push(nombre);
  guardar();
}

export function tieneObjeto(nombre) {
  return estado.objetos.includes(nombre);
}
