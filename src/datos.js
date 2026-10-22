// Personajes, colores provisionales y textos de cada nivel.
// Cuando lleguen los sprites, solo hay que rellenar src/sprites.js.

export const PERSONAJES = {
  catala:    { nombre: "Catalá",            color: [214, 64, 64],   iniciales: "CA", poder: "Bola Pesada" },
  fosil:     { nombre: "Mujer Fósil",       color: [196, 140, 60],  iniciales: "MF", fem: true, poder: "Onda Fosilizadora" },
  bianca:    { nombre: "Bianca",            color: [240, 200, 60],  iniciales: "BI", fem: true, poder: "Inyección de Liquidez" },
  hadoopeno: { nombre: "El Hadoopeno",      color: [250, 220, 40],  iniciales: "HD", poder: "Rayo Replicador" },
  bases:     { nombre: "Guardián de las Bases", color: [70, 120, 220], iniciales: "GB", poder: "Martillo COMMIT" },
  paiboll:   { nombre: "Paiboll Cheese",    color: [60, 200, 90],   iniciales: "PC", poder: "Ráfaga sudo rm -rf" },
  bugarin:   { nombre: "Bugarín",           color: [150, 90, 220],  iniciales: "BU", poder: "Escáner Heurístico" },
  pet:       { nombre: "PET",               color: [230, 230, 240], iniciales: "PT", poder: "Depurador de Punteros" },
  ferrin:    { nombre: "Ferrín",            color: [230, 120, 40],  iniciales: "FE", poder: "Ancla de Mínimo Global" },
  alberto:   { nombre: "Alberto",           color: [40, 170, 230],  iniciales: "AL", poder: "Ping de Red" },
  // Personajes que no se controlan en los niveles
  amparo:    { nombre: "Amparo",            color: [240, 110, 170], iniciales: "AM" },
  julian:    { nombre: "Julián Patillas",   color: [40, 150, 70],   iniciales: "JP" },
  mucientes: { nombre: "Mucientes",         color: [120, 20, 30],   iniciales: "MU" },
  chema:     { nombre: "Chema",             color: [90, 90, 110],   iniciales: "CH" },
  bot_calvo: { nombre: "Bot Autómata (bajito calvo)", color: [200, 190, 170], iniciales: "q0" },
  bot_alto:  { nombre: "Bot Autómata (alto de pelo largo)", color: [130, 90, 60], iniciales: "q1" },
  chaves:    { nombre: "Chaves",            color: [255, 255, 255], iniciales: "CV", poder: "Libertad" },
};

// Orden de los niveles: cada uno desbloquea a su personaje.
export const ORDEN = ["catala", "fosil", "bianca", "hadoopeno", "bases", "paiboll", "bugarin", "pet", "ferrin", "alberto"];

export const TITULOS = {
  catala: "La Pista Deslizante",
  fosil: "La Caverna Mesozoica",
  bianca: "Wall Street Crash",
  hadoopeno: "Pánico en el HDFS",
  bases: "El Foso del DROP TABLE",
  paiboll: "Los Trapicheadores de Comandos",
  bugarin: "La Ruta de Dijkstra",
  pet: "La Tienda Blanca y Azul",
  ferrin: "La Montaña Rusa del Gradiente",
  alberto: "Caza de Contenedores Docker",
};
