// Fondos ilustrados de cada nivel en dos capas:
//   lejos (960x540, quieta)  y  medio (1920x540, se repite y se mueve más despacio que la cámara)
import { registrar, azar, TINTA, rect, circulo, elipse, poligono, pintar, degradado, radial, texto, rgba, aclarar, oscurecer, mezclar, brillo } from "./base.js";

const W = 960, H = 540, WM = 1920;

// dibuja algo en x y también "dando la vuelta" para que la capa media se repita sin cortes
function envolver(fn, x, ancho) {
  fn(x);
  if (x + ancho > WM) fn(x - WM);
  if (x < 0) fn(x + WM);
}

function cielo(c, arriba, abajo) {
  c.fillStyle = degradado(c, 0, 0, 0, H, [[0, arriba], [1, abajo]]);
  c.fillRect(0, 0, W, H);
}

const FONDOS = {
  menu: {
    lejos(c) {
      cielo(c, "#0b1030", "#3a1c4a");
      const r = azar(1);
      for (let i = 0; i < 120; i++) { circulo(c, r() * W, r() * H * 0.7, r() * 1.6 + 0.3); pintar(c, rgba("#ffffff", 0.3 + r() * 0.6), 0); }
      circulo(c, 880, 470, 34); pintar(c, radial(c, 874, 464, 4, 40, [[0, "#fff6d6"], [1, "#f5c46b"]]), 0);
    },
    medio(c) {
      // silueta de la fortaleza de EmprendIA y colinas
      c.fillStyle = "#1c1430";
      c.beginPath(); c.moveTo(0, 470);
      for (let x = 0; x <= WM; x += 80) c.quadraticCurveTo(x + 40, 430 + Math.sin(x / 200) * 30, x + 80, 460);
      c.lineTo(WM, H); c.lineTo(0, H); c.fill();
      [300, 1300].forEach((x0) => {
        rect(c, x0, 300, 220, 180, 0); pintar(c, "#251a3d", 3);
        for (let i = 0; i < 5; i++) { rect(c, x0 + i * 48, 280, 28, 24, 0); pintar(c, "#251a3d", 3); }
        rect(c, x0 + 80, 220, 60, 90, 0); pintar(c, "#2d2048", 3);
        circulo(c, x0 + 110, 250, 14); pintar(c, "#ff3b5c", 3);
        for (let i = 0; i < 6; i++) { rect(c, x0 + 20 + i * 33, 340, 12, 18, 3); pintar(c, "#ffd36b", 0); }
      });
    },
  },

  bolera: {
    lejos(c) {
      cielo(c, "#1a0c2e", "#4a1a4a");
      // pistas en perspectiva al fondo
      for (let i = 0; i < 6; i++) {
        const x = 80 + i * 150;
        poligono(c, [[x, 330], [x + 110, 330], [x + 150, 540], [x - 40, 540]]);
        pintar(c, degradado(c, 0, 330, 0, 540, [[0, "#6b4524"], [1, "#c98a4a"]]), 2);
        for (let b = 0; b < 4; b++) { elipse(c, x + 40 + b * 10, 325, 4, 9); pintar(c, "#f2f2f2", 1.5); }
      }
      rect(c, 0, 250, W, 70, 0); pintar(c, "#2a1238", 0);
      texto(c, "★ BOWLING ★", W / 2, 285, { tam: 38, color: "#ff8af0", borde: 0 });
      c.save(); c.shadowColor = "#ff4fd8"; c.shadowBlur = 20; texto(c, "★ BOWLING ★", W / 2, 285, { tam: 38, color: "#ffd1f7" }); c.restore();
    },
    medio(c) {
      const r = azar(2);
      for (let x = 60; x < WM; x += 320) {
        rect(c, x, 330, 90, 210, 10); pintar(c, degradado(c, 0, 330, 0, 540, [[0, "#3b1d5a"], [1, "#1e0f30"]]), 3);
        rect(c, x + 12, 350, 66, 46, 6); pintar(c, ["#4fe0ff", "#ff6bd6", "#ffe14f"][Math.floor(r() * 3)], 3);
        circulo(c, x + 45, 430, 10); pintar(c, "#ff3b5c", 3);
        c.save(); c.shadowColor = "#4fe0ff"; c.shadowBlur = 14; rect(c, x + 160, 120, 8, 420, 4); pintar(c, "#9ff3ff", 0); c.restore();
      }
    },
  },

  caverna: {
    lejos(c) {
      cielo(c, "#1c120c", "#3a2416");
      const r = azar(3);
      for (let i = 0; i < 30; i++) {
        const x = r() * W, h = 40 + r() * 120;
        poligono(c, [[x - 18, 0], [x + 18, 0], [x, h]]); pintar(c, "#2a1a10", 0);
      }
      for (let i = 0; i < 14; i++) {
        const x = r() * W, y = 150 + r() * 300;
        c.save(); c.shadowColor = "#ffb347"; c.shadowBlur = 18;
        poligono(c, [[x, y - 14], [x + 7, y], [x, y + 14], [x - 7, y]]); pintar(c, rgba("#ffb347", 0.75), 0);
        c.restore();
      }
    },
    medio(c) {
      const r = azar(4);
      for (let x = 0; x < WM; x += 240) {
        envolver((xx) => {
          poligono(c, [[xx, 540], [xx + 40, 260 + r() * 60], [xx + 90, 540]]); pintar(c, degradado(c, 0, 260, 0, 540, [[0, "#5a3c28"], [1, "#2a1a10"]]), 3);
        }, x + 20, 90);
        // amonites incrustados
        const ax = x + 150, ay = 200 + r() * 200;
        circulo(c, ax, ay, 22); pintar(c, "#6e4e36", 3);
        c.beginPath(); for (let t = 0; t < 12; t += 0.2) { const rr = 2 + t * 1.6; c.lineTo(ax + Math.cos(t) * rr, ay + Math.sin(t) * rr); }
        c.lineWidth = 2.5; c.strokeStyle = "#a07a58"; c.stroke();
      }
      for (let x = 100; x < WM; x += 380) {
        poligono(c, [[x - 30, 0], [x + 30, 0], [x, 180]]); pintar(c, degradado(c, 0, 0, 0, 180, [[0, "#4a3020"], [1, "#6e4e36"]]), 3);
      }
    },
  },

  bolsa: {
    lejos(c) {
      cielo(c, "#08122e", "#1d2f5e");
      const r = azar(5);
      for (let i = 0; i < 60; i++) { circulo(c, r() * W, r() * 200, r() * 1.4); pintar(c, rgba("#ffffff", 0.6), 0); }
      for (let x = 0; x < W; x += 50 + r() * 40) {
        const h = 120 + r() * 260, w = 40 + r() * 50;
        rect(c, x, H - h, w, h, 0); pintar(c, "#121f42", 2);
        for (let yy = H - h + 10; yy < H - 10; yy += 16) for (let xx = x + 6; xx < x + w - 8; xx += 12) if (r() > 0.55) { rect(c, xx, yy, 6, 8, 1); pintar(c, rgba("#ffd36b", 0.7), 0); }
      }
    },
    medio(c) {
      // panel gigante de cotizaciones
      rect(c, 120, 60, 560, 210, 14); pintar(c, "#0b1124", 4);
      c.beginPath(); let y = 220;
      for (let x = 140; x < 660; x += 20) { y += (Math.sin(x * 0.07) * 18 + Math.cos(x * 0.031) * 12) * 0.6; c.lineTo(x, Math.max(80, Math.min(250, y - 60))); }
      c.lineWidth = 4; c.strokeStyle = "#3fe07a"; c.stroke();
      texto(c, "EMPRENDIA  ▲ +900%", 400, 90, { tam: 22, color: "#3fe07a" });
      rect(c, 1100, 120, 520, 150, 14); pintar(c, "#0b1124", 4);
      texto(c, "IBEX ▼ -3,1%", 1360, 170, { tam: 26, color: "#ff5a5a" });
      texto(c, "NASDAQ ▼ -4,2%", 1360, 220, { tam: 26, color: "#ff5a5a" });
    },
  },

  datacenter: {
    lejos(c) {
      cielo(c, "#0a1a22", "#14323e");
      const r = azar(6);
      for (let x = 10; x < W; x += 70) {
        rect(c, x, 120, 56, 360, 4); pintar(c, "#0f2630", 2);
        for (let y = 135; y < 470; y += 14) { circulo(c, x + 10, y, 2); pintar(c, r() > 0.3 ? "#3fe0ff" : "#ff5a5a", 0); }
      }
    },
    medio(c) {
      const r = azar(7);
      for (let x = 0; x < WM; x += 160) {
        rect(c, x + 20, 180, 120, 360, 8); pintar(c, degradado(c, 0, 180, 0, 540, [[0, "#2c4452"], [1, "#152530"]]), 3);
        for (let y = 200; y < 520; y += 26) {
          rect(c, x + 30, y, 100, 18, 3); pintar(c, "#1d323e", 2);
          circulo(c, x + 118, y + 9, 3); pintar(c, r() > 0.2 ? "#5dff8a" : "#ffd23f", 0);
        }
      }
      // bandejas de cables
      c.lineWidth = 6; ["#ffcf3f", "#3fa8ff", "#ff5a8a"].forEach((col, i) => { c.strokeStyle = col; c.beginPath(); c.moveTo(0, 120 + i * 12); for (let x = 0; x <= WM; x += 160) c.quadraticCurveTo(x + 80, 160 + i * 12, x + 160, 120 + i * 12); c.stroke(); });
    },
  },

  sql: {
    lejos(c) {
      cielo(c, "#050c24", "#10285a");
      const r = azar(8);
      for (let i = 0; i < 40; i++) { circulo(c, r() * W, r() * H, r() * 1.5); pintar(c, rgba("#9fe6ff", 0.5), 0); }
      c.strokeStyle = rgba("#6fd3ff", 0.15); c.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { c.beginPath(); c.moveTo(x, 300); c.lineTo(W / 2 + (x - W / 2) * 3, H); c.stroke(); }
    },
    medio(c) {
      const r = azar(9);
      for (let x = 60; x < WM; x += 300) {
        const y = 80 + r() * 160;
        rect(c, x, y, 150, 110, 8); pintar(c, rgba("#163a7a", 0.9), 3);
        rect(c, x, y, 150, 24, 8); pintar(c, "#2f6fd6", 3);
        texto(c, ["usuarios", "pedidos", "clientes", "facturas"][Math.floor(r() * 4)], x + 75, y + 13, { tam: 13 });
        for (let f = 0; f < 3; f++) { rect(c, x + 10, y + 34 + f * 22, 90 + r() * 40, 10, 3); pintar(c, rgba("#9fe6ff", 0.4), 0); }
        // cilindro
        const cx = x + 220, cy = y + 160;
        rect(c, cx - 30, cy, 60, 60, 0); pintar(c, rgba("#1d4a9a", 0.8), 0);
        elipse(c, cx, cy + 60, 30, 8); pintar(c, "#1d4a9a", 3);
        elipse(c, cx, cy, 30, 8); pintar(c, "#3a7ae0", 3);
      }
    },
  },

  terminal: {
    lejos(c) {
      cielo(c, "#020a05", "#08200f");
      const r = azar(10);
      c.font = "14px Menlo, monospace";
      for (let x = 0; x < W; x += 22) for (let y = 0; y < H; y += 22) if (r() > 0.6) { c.fillStyle = rgba("#2fbf5a", 0.1 + r() * 0.25); c.fillText(r() > 0.5 ? "1" : "0", x, y); }
    },
    medio(c) {
      const r = azar(11);
      const cmds = ["$ sudo su", "$ chmod 777 *", "$ grep -r secreto", "$ kill -9 1337", "$ ls -la /fortaleza", "Permission denied"];
      for (let x = 40; x < WM; x += 360) {
        const y = 60 + r() * 220;
        rect(c, x, y, 280, 170, 10); pintar(c, rgba("#06140a", 0.95), 3);
        rect(c, x, y, 280, 22, 10); pintar(c, "#1c3a24", 3);
        ["#ff5f57", "#febc2e", "#28c840"].forEach((col, i) => { circulo(c, x + 16 + i * 16, y + 11, 5); pintar(c, col, 1.5); });
        for (let l = 0; l < 6; l++) texto(c, cmds[(l + Math.floor(r() * 6)) % 6], x + 14, y + 40 + l * 22, { tam: 13, alinear: "left", color: l === 5 ? "#ff5a5a" : "#5dff8a", fuente: "Menlo, monospace", peso: "normal" });
      }
    },
  },

  castillo: {
    lejos(c) {
      cielo(c, "#12081e", "#3a1640");
      circulo(c, 760, 120, 60); pintar(c, radial(c, 750, 110, 5, 70, [[0, "#ffd6a0"], [1, "#e0603a"]]), 0);
      c.fillStyle = "#1e1030";
      for (let x = 0; x < W; x += 120) { c.fillRect(x, 300, 90, 240); for (let i = 0; i < 3; i++) c.fillRect(x + i * 34, 280, 22, 24); }
    },
    medio(c) {
      // grafo brillante: nodos y aristas con pesos
      const r = azar(12);
      const nodos = [];
      for (let x = 80; x < WM; x += 200) nodos.push([x, 120 + r() * 220]);
      c.lineWidth = 4;
      nodos.forEach((n, i) => {
        const m = nodos[(i + 1) % nodos.length];
        if (i < nodos.length - 1) {
          c.strokeStyle = rgba("#b38bff", 0.5); c.beginPath(); c.moveTo(n[0], n[1]); c.lineTo(m[0], m[1]); c.stroke();
          texto(c, String(1 + Math.floor(r() * 15)), (n[0] + m[0]) / 2, (n[1] + m[1]) / 2 - 12, { tam: 16, color: "#e0d2ff" });
        }
      });
      nodos.forEach(([x, y]) => { c.save(); c.shadowColor = "#b38bff"; c.shadowBlur = 16; circulo(c, x, y, 16); pintar(c, "#6b3ad1", 3); c.restore(); });
      for (let x = 140; x < WM; x += 480) {
        rect(c, x, 360, 50, 180, 4); pintar(c, "#2a1840", 3);
        c.save(); c.shadowColor = "#ffa53a"; c.shadowBlur = 18; elipse(c, x + 25, 350, 9, 16); pintar(c, "#ffcf6b", 0); c.restore();
      }
    },
  },

  tienda: {
    lejos(c) {
      cielo(c, "#f4f7fc", "#dfe7f3");
      rect(c, 0, 360, W, 18, 0); pintar(c, "#2f6fd6", 0);
      for (let x = 60; x < W; x += 300) {
        rect(c, x, 90, 200, 180, 8); pintar(c, "#cfe3ff", 3);
        c.strokeStyle = "#ffffff"; c.lineWidth = 6; c.beginPath(); c.moveTo(x + 30, 240); c.lineTo(x + 90, 110); c.stroke();
        texto(c, "SALE", x + 100, 70, { tam: 24, color: "#2f6fd6" });
      }
    },
    medio(c) {
      const r = azar(13);
      for (let x = 0; x < WM; x += 220) {
        rect(c, x + 20, 300, 180, 240, 6); pintar(c, "#ffffff", 3);
        for (let f = 0; f < 4; f++) {
          rect(c, x + 26, 318 + f * 52, 168, 6, 2); pintar(c, "#b8c2d6", 2);
          for (let p = 0; p < 5; p++) { rect(c, x + 32 + p * 32, 296 + f * 52, 26, 20, 4); pintar(c, r() > 0.5 ? "#ffffff" : "#3a78e0", 2); }
        }
      }
    },
  },

  pizarra: {
    lejos(c) {
      cielo(c, "#132232", "#1c3448");
      c.strokeStyle = rgba("#7fb3d9", 0.12); c.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
      for (let y = 0; y < H; y += 40) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
      for (let i = 1; i < 7; i++) { elipse(c, 700, 160, i * 36, i * 20, 0.3); c.strokeStyle = rgba("#9fe6ff", 0.18); c.lineWidth = 2; c.stroke(); }
    },
    medio(c) {
      const f = ["∇f(x)", "θ ← θ − α∇J(θ)", "∂L/∂w", "min f(x)", "α = 0,01", "f'(x) = 0"];
      const r = azar(14);
      for (let x = 60; x < WM; x += 320) texto(c, f[Math.floor(r() * f.length)], x, 80 + r() * 200, { tam: 26, color: rgba("#e8f2ff", 0.55), fuente: "Georgia, serif", peso: "italic" });
    },
  },

  puerto: {
    lejos(c) {
      cielo(c, "#7cc4f0", "#ffd9a8");
      circulo(c, 180, 130, 46); pintar(c, "#fff3c4", 0);
      rect(c, 0, 380, W, 160, 0); pintar(c, degradado(c, 0, 380, 0, 540, [[0, "#2f7fc0"], [1, "#1a4f8a"]]), 0);
      c.strokeStyle = rgba("#ffffff", 0.35); c.lineWidth = 2;
      for (let y = 395; y < H; y += 18) { c.beginPath(); for (let x = 0; x < W; x += 30) c.lineTo(x, y + Math.sin(x / 30 + y) * 3); c.stroke(); }
      const r = azar(15);
      for (let i = 0; i < 5; i++) { const x = 100 + i * 200, y = 60 + r() * 60; [0, 30, 60].forEach((d, j) => { circulo(c, x + d, y + (j === 1 ? -14 : 0), 26); pintar(c, rgba("#ffffff", 0.9), 0); }); }
    },
    medio(c) {
      // grúas y barcos
      for (let x = 100; x < WM; x += 640) {
        rect(c, x, 140, 16, 300, 0); pintar(c, "#e0603a", 3);
        rect(c, x - 120, 140, 300, 14, 0); pintar(c, "#e0603a", 3);
        c.strokeStyle = TINTA; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 150, 154); c.lineTo(x + 150, 260); c.stroke();
        rect(c, x + 130, 260, 40, 24, 2); pintar(c, "#2f9e5a", 2.5);
        poligono(c, [[x + 230, 400], [x + 520, 400], [x + 490, 450], [x + 260, 450]]); pintar(c, "#3a3f52", 3);
        ["#d6453a", "#2f6fd6", "#f2c230", "#2f9e5a"].forEach((col, i) => { rect(c, x + 260 + i * 56, 370, 52, 30, 2); pintar(c, col, 2.5); });
      }
    },
  },

  fortaleza: {
    lejos(c) {
      cielo(c, "#12050c", "#3a0c1c");
      c.save(); c.shadowColor = "#ff3b5c"; c.shadowBlur = 40;
      elipse(c, W / 2, 150, 120, 60); pintar(c, "#2a0a14", 4);
      circulo(c, W / 2, 150, 40); pintar(c, radial(c, W / 2, 150, 4, 44, [[0, "#ffd0d8"], [0.4, "#ff3b5c"], [1, "#6a0a1e"]]), 3);
      c.restore();
      c.strokeStyle = rgba("#ff3b5c", 0.25); c.lineWidth = 2;
      const r = azar(16);
      for (let i = 0; i < 16; i++) { c.beginPath(); let x = r() * W, y = H; c.moveTo(x, y); for (let s = 0; s < 6; s++) { if (s % 2) x += (r() - 0.5) * 120; else y -= 40 + r() * 40; c.lineTo(x, y); } c.stroke(); }
    },
    medio(c) {
      for (let x = 0; x < WM; x += 240) {
        rect(c, x + 30, 260, 70, 280, 4); pintar(c, degradado(c, 0, 260, 0, 540, [[0, "#3a1424"], [1, "#1a060e"]]), 3);
        c.save(); c.shadowColor = "#ff3b5c"; c.shadowBlur = 14; rect(c, x + 58, 280, 14, 240, 4); pintar(c, "#ff7a9a", 0); c.restore();
      }
    },
  },
};

const hechos = new Set();
export function pintarFondo(tema) {
  if (!FONDOS[tema]) tema = "menu";
  if (!hechos.has(tema)) {
    registrar(`fondo_${tema}_lejos`, W, H, FONDOS[tema].lejos, { dpr: 1 });
    registrar(`fondo_${tema}_medio`, WM, H, FONDOS[tema].medio, { dpr: 1 });
    hechos.add(tema);
  }
  return { lejos: `fondo_${tema}_lejos`, medio: `fondo_${tema}_medio`, anchoMedio: WM };
}
