// Texturas de objetos (monedas, enemigos, proyectiles, elementos de cada minijuego).
// Se generan una sola vez al arrancar. Nombre de sprite = "t_<objeto>".
import {
  registrar, TINTA, rect, circulo, elipse, poligono, pintar, degradado, radial, brillo,
  trazoGrueso, texto, aclarar, oscurecer, rgba, azar,
} from "./base.js";

export function generarObjetos() {
  // ---------------- comunes ----------------
  registrar("t_moneda", 40, 40, (c) => {
    circulo(c, 20, 20, 16);
    pintar(c, radial(c, 15, 14, 2, 20, [[0, "#fff4b0"], [0.5, "#ffc93a"], [1, "#d98a12"]]), 3);
    circulo(c, 20, 20, 10);
    pintar(c, null, 2, "#b36a08");
    texto(c, "E", 20, 21, { tam: 13, color: "#b36a08" });
    brillo(c, 14, 12, 5, 3, 0.7);
  });

  registrar("t_corazon", 40, 36, (c) => {
    c.beginPath();
    c.moveTo(20, 33); c.bezierCurveTo(4, 22, 2, 12, 8, 6); c.bezierCurveTo(13, 1, 19, 4, 20, 10);
    c.bezierCurveTo(21, 4, 27, 1, 32, 6); c.bezierCurveTo(38, 12, 36, 22, 20, 33); c.closePath();
    pintar(c, degradado(c, 0, 2, 0, 33, [[0, "#ff7a8a"], [1, "#d6213a"]]), 3);
    brillo(c, 12, 11, 4, 2.5, 0.7);
  });

  // bicho con 2 fotogramas (patas alternas)
  registrar("t_bicho", 112, 40, (c) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 56;
      for (let i = 0; i < 3; i++) {
        const lx = ox + 16 + i * 10, d = (i + f) % 2 ? 4 : -4;
        trazoGrueso(c, [[lx, 26], [lx + d, 36]], 3, "#3a1214", 1.5);
      }
      elipse(c, ox + 28, 22, 20, 14);
      pintar(c, degradado(c, 0, 8, 0, 36, [[0, "#ff6b5e"], [1, "#b3141b"]]), 3);
      c.beginPath(); c.moveTo(ox + 28, 9); c.lineTo(ox + 28, 34); c.lineWidth = 2; c.strokeStyle = TINTA; c.stroke();
      circulo(c, ox + 47, 20, 8); pintar(c, "#3a1214", 3);
      circulo(c, ox + 49, 18, 3.5); pintar(c, "#ffffff", 1.5);
      circulo(c, ox + 50, 18, 1.5); pintar(c, TINTA, 0);
      circulo(c, ox + 20, 18, 3); pintar(c, "#ffd0c8", 0);
      circulo(c, ox + 33, 26, 2.5); pintar(c, "#ffd0c8", 0);
      brillo(c, ox + 20, 13, 7, 3);
    }
  }, { sprite: { sliceX: 2, anims: { andar: { from: 0, to: 1, loop: true, speed: 6 } } } });

  const bandera = (abierta) => (c) => {
    rect(c, 26, 196, 28, 14, 4); pintar(c, "#8b8f9c", 3);
    rect(c, 36, 20, 8, 180, 3); pintar(c, degradado(c, 36, 0, 44, 0, [[0, "#f5f5f5"], [1, "#a9adb8"]]), 3);
    circulo(c, 40, 16, 8); pintar(c, abierta ? "#ffd23f" : "#8b8f9c", 3);
    const col = abierta ? "#3fcf6b" : "#7c7f8a";
    c.beginPath(); c.moveTo(44, 26); c.quadraticCurveTo(64, 20, 78, 30); c.lineTo(78, 62); c.quadraticCurveTo(64, 54, 44, 60); c.closePath();
    pintar(c, degradado(c, 44, 0, 78, 0, [[0, col], [1, oscurecer(col, 0.25)]]), 3);
    texto(c, abierta ? "E" : "🔒", 60, 43, { tam: abierta ? 18 : 14, color: "#ffffff" });
  };
  registrar("t_meta", 80, 212, bandera(true));
  registrar("t_meta_cerrada", 80, 212, bandera(false));

  registrar("t_control", 40, 72, (c) => {
    rect(c, 17, 8, 6, 62, 2); pintar(c, "#c9ccd6", 2.5);
    c.beginPath(); c.moveTo(23, 10); c.lineTo(38, 17); c.lineTo(23, 24); c.closePath(); pintar(c, "#8b8f9c", 2.5);
  });
  registrar("t_control_on", 40, 72, (c) => {
    rect(c, 17, 8, 6, 62, 2); pintar(c, "#c9ccd6", 2.5);
    c.beginPath(); c.moveTo(23, 10); c.lineTo(38, 17); c.lineTo(23, 24); c.closePath(); pintar(c, "#3fcf6b", 2.5);
  });

  registrar("t_pinchos", 40, 22, (c) => {
    for (let i = 0; i < 3; i++) {
      poligono(c, [[2 + i * 12.5, 21], [8.5 + i * 12.5, 2], [15 + i * 12.5, 21]]);
      pintar(c, degradado(c, 0, 2, 0, 21, [[0, "#ffffff"], [1, "#8d93a3"]]), 2.5);
    }
  });

  registrar("t_puerta", 40, 40, (c) => {
    rect(c, 1, 1, 38, 38, 4); pintar(c, rgba("#8a3cff", 0.35), 0);
    for (let i = 0; i < 3; i++) { rect(c, 6 + i * 11, 0, 6, 40, 3); pintar(c, degradado(c, 0, 0, 0, 40, [[0, "#d7b8ff"], [1, "#7a2fe0"]]), 2); }
  });

  // ---------------- proyectiles ----------------
  registrar("t_bola", 40, 40, (c) => {
    circulo(c, 20, 20, 17);
    pintar(c, radial(c, 14, 13, 2, 22, [[0, "#6a6fd8"], [0.6, "#2a2d78"], [1, "#12133a"]]), 3);
    [[24, 12], [30, 15], [26, 19]].forEach(([x, y]) => { circulo(c, x, y, 2.6); pintar(c, TINTA, 0); });
    brillo(c, 12, 11, 6, 3, 0.6);
  });
  registrar("t_fosil", 40, 26, (c) => {
    c.save(); c.shadowColor = "#ffb347"; c.shadowBlur = 8;
    elipse(c, 20, 13, 16, 9); pintar(c, radial(c, 16, 10, 1, 18, [[0, "#fff1c4"], [0.5, "#f0a53a"], [1, "#8a5512"]]), 2.5);
    c.restore();
    c.beginPath(); c.arc(20, 13, 5, 0, Math.PI * 1.6); c.lineWidth = 2; c.strokeStyle = "#7a4a0f"; c.stroke();
  });
  registrar("t_liquidez", 26, 26, (c) => {
    circulo(c, 13, 13, 10); pintar(c, radial(c, 10, 9, 1, 13, [[0, "#fff4b0"], [1, "#e09a14"]]), 2.5);
    texto(c, "$", 13, 14, { tam: 12, color: "#8a5a06" });
  });
  registrar("t_paquete", 32, 28, (c) => {
    rect(c, 3, 5, 26, 20, 3); pintar(c, degradado(c, 0, 5, 0, 25, [[0, "#ffe46b"], [1, "#e0a91a"]]), 2.5);
    poligono(c, [[3, 5], [9, 1], [31, 1], [29, 5]]); pintar(c, "#fff3a8", 2.5);
    texto(c, "put", 16, 16, { tam: 9, color: "#6b4a00" });
  });
  registrar("t_martillo", 96, 60, (c) => {
    rect(c, 10, 30, 70, 10, 4); pintar(c, degradado(c, 0, 30, 0, 40, [[0, "#c58a4a"], [1, "#7c4f22"]]), 2.5);
    rect(c, 62, 8, 30, 46, 6); pintar(c, degradado(c, 62, 0, 92, 0, [[0, "#9ec2ff"], [1, "#3a64c9"]]), 3);
    texto(c, "SQL", 77, 31, { tam: 10, color: "#ffffff" });
  });
  registrar("t_terminal", 84, 26, (c) => {
    rect(c, 2, 2, 80, 22, 5); pintar(c, "#0c1a10", 2.5);
    texto(c, "$ rm -rf", 42, 14, { tam: 12, color: "#5dff8a", fuente: "Menlo, monospace" });
  });
  registrar("t_escaner", 34, 100, (c) => {
    c.save(); c.shadowColor = "#7dffa0"; c.shadowBlur = 12;
    c.beginPath(); c.arc(-30, 50, 58, -0.85, 0.85); c.lineWidth = 8; c.strokeStyle = "rgba(140,255,170,0.9)"; c.stroke();
    c.restore();
  });
  registrar("t_rayo", 56, 14, (c) => {
    c.save(); c.shadowColor = "#5ee8ff"; c.shadowBlur = 10;
    rect(c, 3, 4, 50, 6, 3); pintar(c, degradado(c, 0, 0, 56, 0, [[0, "rgba(94,232,255,0.2)"], [1, "#e9fdff"]]), 0);
    c.restore();
  });
  registrar("t_ping", 32, 32, (c) => {
    [14, 9, 4].forEach((r, i) => { circulo(c, 16, 16, r); c.lineWidth = 3; c.strokeStyle = i === 2 ? "#ffffff" : "#5ccfff"; c.stroke(); });
  });
  registrar("t_ancla", 34, 44, (c) => {
    trazoGrueso(c, [[17, 6], [17, 38]], 5, "#c7ced9", 2.5);
    trazoGrueso(c, [[6, 30], [17, 39], [28, 30]], 5, "#c7ced9", 2.5);
    trazoGrueso(c, [[10, 12], [24, 12]], 5, "#c7ced9", 2.5);
    circulo(c, 17, 5, 4); pintar(c, "#c7ced9", 2.5);
  });
  registrar("t_estrella", 30, 30, (c) => {
    const p = [];
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 6 : 13, a = -Math.PI / 2 + i * Math.PI / 5; p.push([15 + Math.cos(a) * r, 15 + Math.sin(a) * r]); }
    poligono(c, p); pintar(c, "#fff6c2", 2.5);
  });

  // ---------------- nivel 1: bolos ----------------
  registrar("t_bolo", 28, 60, (c) => {
    c.beginPath();
    c.moveTo(14, 2); c.bezierCurveTo(22, 2, 22, 16, 18, 22); c.bezierCurveTo(27, 32, 26, 50, 20, 58);
    c.lineTo(8, 58); c.bezierCurveTo(2, 50, 1, 32, 10, 22); c.bezierCurveTo(6, 16, 6, 2, 14, 2); c.closePath();
    pintar(c, degradado(c, 2, 0, 26, 0, [[0, "#ffffff"], [0.7, "#eef0f5"], [1, "#b9bfcc"]]), 3);
    rect(c, 8.5, 16, 11, 3, 1); pintar(c, "#e0303c", 0);
    rect(c, 9, 21, 10, 3, 1); pintar(c, "#e0303c", 0);
    brillo(c, 10, 34, 2, 8, 0.6);
  });

  // ---------------- nivel 2: caverna ----------------
  registrar("t_volador", 136, 40, (c) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 68, ala = f ? 12 : -10;
      c.beginPath(); c.moveTo(ox + 30, 20); c.quadraticCurveTo(ox + 18, 20 + ala, ox + 2, 14 + ala); c.lineTo(ox + 28, 26); c.closePath(); pintar(c, "#7c3aa8", 2.5);
      c.beginPath(); c.moveTo(ox + 38, 20); c.quadraticCurveTo(ox + 48, 20 + ala, ox + 60, 14 + ala); c.lineTo(ox + 40, 26); c.closePath(); pintar(c, "#7c3aa8", 2.5);
      elipse(c, ox + 34, 24, 14, 8); pintar(c, degradado(c, 0, 16, 0, 32, [[0, "#c27be8"], [1, "#6a2a95"]]), 2.5);
      poligono(c, [[ox + 44, 18], [ox + 66, 22], [ox + 44, 26]]); pintar(c, "#f2c14e", 2.5);
      poligono(c, [[ox + 40, 18], [ox + 36, 6], [ox + 46, 16]]); pintar(c, "#a65bd1", 2);
      circulo(c, ox + 45, 20, 2.6); pintar(c, "#ffef6b", 1.5);
    }
  }, { sprite: { sliceX: 2, anims: { volar: { from: 0, to: 1, loop: true, speed: 7 } } } });
  registrar("t_volador_piedra", 68, 40, (c) => {
    elipse(c, 34, 24, 30, 12); pintar(c, degradado(c, 0, 12, 0, 36, [[0, "#c9c3b8"], [1, "#7a736a"]]), 3);
    [[20, 22], [38, 28], [48, 20]].forEach(([x, y]) => { elipse(c, x, y, 4, 2.5); pintar(c, "#9a9388", 0); });
    c.beginPath(); c.arc(30, 22, 6, 0, Math.PI * 1.7); c.lineWidth = 2; c.strokeStyle = "#6a635a"; c.stroke();
  });
  registrar("t_roca", 36, 36, (c) => {
    c.save(); c.shadowColor = "#ff6a00"; c.shadowBlur = 12;
    poligono(c, [[18, 3], [31, 9], [33, 24], [22, 33], [7, 30], [3, 15]]);
    pintar(c, radial(c, 15, 14, 2, 22, [[0, "#ffd36b"], [0.4, "#ff6a1a"], [1, "#7a1a05"]]), 3);
    c.restore();
    c.beginPath(); c.moveTo(12, 14); c.lineTo(18, 19); c.lineTo(15, 26); c.lineWidth = 2; c.strokeStyle = "#ffe08a"; c.stroke();
  });
  registrar("t_roca_piedra", 36, 36, (c) => {
    poligono(c, [[18, 3], [31, 9], [33, 24], [22, 33], [7, 30], [3, 15]]);
    pintar(c, degradado(c, 0, 3, 0, 33, [[0, "#cfc8bd"], [1, "#7a736a"]]), 3);
  });

  // ---------------- nivel 3: bolsa ----------------
  registrar("t_impuesto", 60, 34, (c) => {
    rect(c, 3, 3, 54, 28, 4); pintar(c, degradado(c, 0, 3, 0, 31, [[0, "#fff7f2"], [1, "#f1d8cf"]]), 2.5);
    rect(c, 3, 3, 54, 8, 3); pintar(c, "#d62e3b", 0);
    c.beginPath(); c.moveTo(3, 3); c.lineTo(57, 3); c.lineTo(57, 31); c.lineTo(3, 31); c.closePath(); c.lineWidth = 2.5; c.strokeStyle = TINTA; c.stroke();
  });
  registrar("t_maletin", 48, 38, (c) => {
    rect(c, 16, 2, 16, 10, 4); pintar(c, null, 3);
    rect(c, 3, 9, 42, 27, 5); pintar(c, degradado(c, 0, 9, 0, 36, [[0, "#9a5b2a"], [1, "#5c3214"]]), 3);
    rect(c, 3, 18, 42, 4, 0); pintar(c, "#3e200c", 0);
    rect(c, 20, 16, 8, 8, 2); pintar(c, "#ffd23f", 2);
    brillo(c, 12, 13, 6, 2, 0.35);
  });

  // ---------------- nivel 4: HDFS ----------------
  registrar("t_nodo", 160, 40, (c) => {
    rect(c, 2, 2, 156, 36, 5); pintar(c, degradado(c, 0, 2, 0, 38, [[0, "#f2f4f8"], [1, "#a8afbd"]]), 3);
    for (let i = 0; i < 6; i++) { rect(c, 12 + i * 14, 12, 8, 16, 2); pintar(c, "#6c7384", 1.5); }
    [[120, 20], [132, 20], [144, 20]].forEach(([x, y]) => { circulo(c, x, y, 4); pintar(c, "#ffffff", 1.5); });
    brillo(c, 30, 7, 24, 2, 0.5);
  });
  registrar("t_namenode", 240, 80, (c) => {
    rect(c, 4, 4, 232, 72, 10); pintar(c, degradado(c, 0, 4, 0, 76, [[0, "#ffe46b"], [1, "#d39a12"]]), 3.5);
    rect(c, 16, 16, 60, 48, 6); pintar(c, "#3a2c06", 2.5);
    for (let i = 0; i < 4; i++) { circulo(c, 30 + (i % 2) * 30, 30 + Math.floor(i / 2) * 20, 5); pintar(c, i % 2 ? "#5dff8a" : "#ffd23f", 1.5); }
    texto(c, "NameNode", 155, 40, { tam: 22, color: "#3a2c06" });
    brillo(c, 60, 10, 40, 3, 0.4);
  });

  // ---------------- nivel 5: SQL ----------------
  registrar("t_base_db", 80, 44, (c) => {
    // cilindro de base de datos (en gris claro para poder teñirlo)
    rect(c, 4, 8, 72, 28, 0); pintar(c, degradado(c, 4, 0, 76, 0, [[0, "#ffffff"], [0.6, "#e3e7ef"], [1, "#a9b1c2"]]), 0);
    elipse(c, 40, 36, 36, 6); pintar(c, "#b8bfcd", 3);
    rect(c, 4, 8, 72, 28, 0); pintar(c, degradado(c, 4, 0, 76, 0, [[0, "#ffffff"], [0.6, "#e3e7ef"], [1, "#a9b1c2"]]), 0);
    c.beginPath(); c.moveTo(4, 8); c.lineTo(4, 36); c.moveTo(76, 8); c.lineTo(76, 36); c.lineWidth = 3; c.strokeStyle = TINTA; c.stroke();
    c.beginPath(); c.ellipse(40, 22, 36, 6, 0, 0, Math.PI); c.lineWidth = 2; c.strokeStyle = "#8a92a3"; c.stroke();
    c.beginPath(); c.ellipse(40, 36, 36, 6, 0, 0, Math.PI); c.lineWidth = 3; c.strokeStyle = TINTA; c.stroke();
    elipse(c, 40, 8, 36, 6); pintar(c, "#ffffff", 3);
  });
  registrar("t_muro_corrupto", 40, 40, (c) => {
    const r = azar(7);
    rect(c, 1, 1, 38, 38, 4); pintar(c, "#3b1450", 2.5);
    for (let i = 0; i < 9; i++) { rect(c, 4 + r() * 28, 4 + r() * 30, 4 + r() * 10, 3, 1); pintar(c, ["#ff4fd8", "#55e6ff", "#ffffff"][i % 3], 0); }
    texto(c, "NULL", 20, 21, { tam: 10, color: "#ffb3f2" });
  });
  registrar("t_altar", 90, 90, (c) => {
    rect(c, 6, 60, 78, 26, 4); pintar(c, degradado(c, 0, 60, 0, 86, [[0, "#d9c08a"], [1, "#8c6b2a"]]), 3);
    rect(c, 18, 22, 54, 40, 4); pintar(c, degradado(c, 0, 22, 0, 62, [[0, "#f0dca8"], [1, "#b48f45"]]), 3);
    c.save(); c.shadowColor = "#5ee8ff"; c.shadowBlur = 14;
    poligono(c, [[45, 4], [56, 16], [45, 28], [34, 16]]); pintar(c, "#9ff3ff", 2.5);
    c.restore();
    texto(c, "SQL", 45, 44, { tam: 13, color: "#5c4214" });
  });

  // ---------------- nivel 6: terminal ----------------
  registrar("t_muro_codigo", 40, 240, (c) => {
    const r = azar(3);
    rect(c, 2, 2, 36, 236, 5); pintar(c, degradado(c, 0, 0, 40, 0, [[0, "#3c4652"], [1, "#1f262e"]]), 3);
    for (let y = 14; y < 230; y += 9) { rect(c, 7, y, 6 + r() * 22, 3, 1); pintar(c, r() > 0.7 ? "#ff5a5a" : "#5a6a7a", 0); }
    rect(c, 8, 8, 24, 16, 3); pintar(c, "#d62e3b", 2);
    texto(c, "403", 20, 16.5, { tam: 9, color: "#ffffff" });
  });

  // ---------------- nivel 7: Dijkstra ----------------
  registrar("t_trampolin", 44, 20, (c) => {
    for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(10 + i * 3, 18 - i * 4); c.lineTo(34 - i * 3, 16 - i * 4); c.lineWidth = 3; c.strokeStyle = "#8b8f9c"; c.stroke(); }
    rect(c, 4, 2, 36, 7, 3); pintar(c, degradado(c, 0, 2, 0, 9, [[0, "#ffd84d"], [1, "#e09a14"]]), 2.5);
    rect(c, 8, 16, 28, 4, 2); pintar(c, "#5a5f6e", 2);
  });
  registrar("t_cartel", 120, 34, (c) => {
    rect(c, 3, 3, 114, 28, 8); pintar(c, degradado(c, 0, 3, 0, 31, [[0, "#3a2850"], [1, "#24163a"]]), 3);
  });
  registrar("t_compuerta", 20, 80, (c) => {
    rect(c, 2, 2, 16, 76, 4); pintar(c, degradado(c, 0, 0, 20, 0, [[0, "#ff8af0"], [1, "#a02ab0"]]), 2.5);
    for (let y = 12; y < 76; y += 14) { circulo(c, 10, y, 3); pintar(c, "#ffe3fb", 1.5); }
  });

  // ---------------- nivel 8: tienda ----------------
  registrar("t_camiseta", 40, 34, (c) => {
    poligono(c, [[12, 3], [28, 3], [38, 10], [33, 17], [29, 14], [29, 31], [11, 31], [11, 14], [7, 17], [2, 10]]);
    pintar(c, degradado(c, 0, 3, 0, 31, [[0, "#ffffff"], [1, "#d9e1ee"]]), 2.5);
    c.beginPath(); c.arc(20, 3, 5, 0, Math.PI); c.lineWidth = 2; c.strokeStyle = TINTA; c.stroke();
  });
  registrar("t_vaquero", 30, 42, (c) => {
    poligono(c, [[4, 2], [26, 2], [27, 40], [17, 40], [15, 16], [13, 40], [3, 40]]);
    pintar(c, degradado(c, 0, 2, 0, 40, [[0, "#4f8fe8"], [1, "#22489c"]]), 2.5);
    c.beginPath(); c.moveTo(4, 8); c.lineTo(26, 8); c.lineWidth = 2; c.strokeStyle = "#ffcf6b"; c.stroke();
  });
  registrar("t_maniqui", 40, 92, (c) => {
    rect(c, 17, 84, 6, 6, 2); pintar(c, "#8b8f9c", 2);
    rect(c, 8, 86, 24, 5, 2); pintar(c, "#8b8f9c", 2);
    rect(c, 12, 50, 16, 36, 6); pintar(c, "#d8d2c6", 2.5);
    rect(c, 9, 22, 22, 30, 8); pintar(c, "#e6e0d4", 2.5);
    circulo(c, 20, 12, 9); pintar(c, "#e6e0d4", 2.5);
  });
  registrar("t_maniqui_arriba", 40, 92, (c) => {
    rect(c, 7, 22, 26, 30, 8); pintar(c, degradado(c, 0, 22, 0, 52, [[0, "#ffffff"], [1, "#d9e1ee"]]), 2.5);
  });
  registrar("t_maniqui_abajo", 40, 92, (c) => {
    rect(c, 10, 50, 20, 36, 5); pintar(c, degradado(c, 0, 50, 0, 86, [[0, "#4f8fe8"], [1, "#22489c"]]), 2.5);
  });
  registrar("t_ordenador", 230, 260, (c) => {
    rect(c, 70, 200, 90, 30, 6); pintar(c, "#4a4f63", 3);
    rect(c, 40, 226, 150, 26, 8); pintar(c, degradado(c, 0, 226, 0, 252, [[0, "#6a7088"], [1, "#3a3f52"]]), 3);
    rect(c, 6, 6, 218, 196, 18); pintar(c, degradado(c, 0, 6, 0, 202, [[0, "#7a8099"], [1, "#3e4357"]]), 4);
    rect(c, 24, 24, 182, 140, 10); pintar(c, "#0d1220", 3);
    circulo(c, 196, 184, 6); pintar(c, "#ff4d5a", 2);
    brillo(c, 60, 16, 40, 4, 0.3);
  });
  registrar("t_linea", 80, 18, (c) => {
    rect(c, 2, 2, 76, 14, 7); pintar(c, degradado(c, 0, 2, 0, 16, [[0, "#9dffb5"], [1, "#2fbf5a"]]), 2.5);
    texto(c, "return ok;", 40, 9.5, { tam: 9, color: "#0a3a18", fuente: "Menlo, monospace" });
  });

  // ---------------- nivel 10: puerto ----------------
  registrar("t_caja", 40, 40, (c) => {
    rect(c, 2, 2, 36, 36, 6); pintar(c, degradado(c, 0, 2, 0, 38, [[0, "#ffd75a"], [1, "#e0921a"]]), 3);
    [[7, 7], [33, 7], [7, 33], [33, 33]].forEach(([x, y]) => { circulo(c, x, y, 2); pintar(c, "#9a5a0a", 0); });
    texto(c, "?", 20, 21, { tam: 22, color: "#ffffff", borde: 3, colorBorde: "#9a5a0a" });
  });
  registrar("t_caja_abierta", 40, 40, (c) => {
    rect(c, 2, 2, 36, 36, 6); pintar(c, degradado(c, 0, 2, 0, 38, [[0, "#b9a07a"], [1, "#7c6440"]]), 3);
  });
  registrar("t_ballena", 150, 100, (c) => {
    for (let i = 0; i < 3; i++) for (let j = 0; j < (i === 1 ? 2 : 1); j++) {
      rect(c, 40 + i * 24, 18 - j * 18, 22, 16, 2); pintar(c, ["#2f6fd6", "#4fa3ff", "#2f6fd6"][i], 2.5);
    }
    c.beginPath(); c.moveTo(8, 50); c.quadraticCurveTo(10, 34, 40, 34); c.lineTo(118, 34); c.quadraticCurveTo(140, 36, 142, 56);
    c.quadraticCurveTo(140, 86, 90, 88); c.lineTo(40, 88); c.quadraticCurveTo(10, 84, 8, 50); c.closePath();
    pintar(c, degradado(c, 0, 34, 0, 88, [[0, "#3aa0ff"], [1, "#1c5fc4"]]), 3.5);
    c.beginPath(); c.moveTo(8, 50); c.quadraticCurveTo(0, 36, 4, 26); c.quadraticCurveTo(12, 40, 14, 46); pintar(c, "#1c5fc4", 3);
    circulo(c, 120, 54, 4); pintar(c, TINTA, 0);
    c.beginPath(); c.moveTo(40, 70); c.quadraticCurveTo(90, 82, 130, 66); c.lineWidth = 2; c.strokeStyle = "#a9d6ff"; c.stroke();
    brillo(c, 60, 44, 20, 4, 0.35);
  });

  // ---------------- batalla final ----------------
  registrar("t_orbe", 40, 40, (c) => {
    c.save(); c.shadowColor = "#ff3b8a"; c.shadowBlur = 14;
    circulo(c, 20, 20, 13); pintar(c, radial(c, 17, 17, 1, 16, [[0, "#ffffff"], [0.35, "#ff9ad0"], [1, "#d6136a"]]), 2.5);
    c.restore();
  });
  registrar("t_orbe_azul", 40, 40, (c) => {
    c.save(); c.shadowColor = "#5ee8ff"; c.shadowBlur = 14;
    circulo(c, 20, 20, 13); pintar(c, radial(c, 17, 17, 1, 16, [[0, "#ffffff"], [0.35, "#a8f4ff"], [1, "#1a8fd6"]]), 2.5);
    c.restore();
  });
  registrar("t_estrella_chema", 44, 44, (c) => {
    const p = [];
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 8 : 19, a = -Math.PI / 2 + i * Math.PI / 5; p.push([22 + Math.cos(a) * r, 22 + Math.sin(a) * r]); }
    c.save(); c.shadowColor = "#ffc94a"; c.shadowBlur = 16;
    poligono(c, p); pintar(c, radial(c, 22, 22, 2, 20, [[0, "#ffffff"], [0.5, "#ffe27a"], [1, "#ff9a1a"]]), 2.5);
    c.restore();
  });
  registrar("t_misil", 30, 64, (c) => {
    c.save(); c.shadowColor = "#ff7a2a"; c.shadowBlur = 12;
    poligono(c, [[9, 54], [15, 64], [21, 54]]); pintar(c, "#ffd36b", 0);
    c.restore();
    rect(c, 8, 14, 14, 42, 4); pintar(c, degradado(c, 8, 0, 22, 0, [[0, "#e7ecf4"], [1, "#8a93a6"]]), 2.5);
    poligono(c, [[8, 16], [15, 2], [22, 16]]); pintar(c, "#e0303c", 2.5);
    poligono(c, [[8, 44], [2, 56], [8, 54]]); pintar(c, "#e0303c", 2);
    poligono(c, [[22, 44], [28, 56], [22, 54]]); pintar(c, "#e0303c", 2);
  });
  registrar("t_mira", 80, 80, (c) => {
    c.strokeStyle = "#ff3b5c"; c.lineWidth = 4;
    circulo(c, 40, 40, 30); c.stroke();
    circulo(c, 40, 40, 14); c.stroke();
    [[40, 2, 40, 18], [40, 62, 40, 78], [2, 40, 18, 40], [62, 40, 78, 40]].forEach(([a, b, x, y]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(x, y); c.stroke(); });
  });
  registrar("t_humo", 64, 64, (c) => {
    circulo(c, 32, 32, 28); pintar(c, radial(c, 28, 28, 2, 30, [[0, "rgba(120,110,130,0.9)"], [1, "rgba(60,50,70,0)"]]), 0);
  });
  registrar("t_vineta", 480, 270, (c, w, h) => {
    c.fillStyle = radial(c, w / 2, h / 2, h * 0.35, w * 0.62, [[0, "rgba(0,0,0,0)"], [1, "rgba(10,0,8,0.75)"]]);
    c.fillRect(0, 0, w, h);
  }, { dpr: 1 });
}
