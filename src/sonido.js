// Efectos de sonido sintetizados con Web Audio (no hacen falta archivos).
// El audio arranca con la primera tecla pulsada (los navegadores lo exigen). M silencia / activa.
let ctx = null;
let maestro = null;
let silencio = false;

function iniciar() {
  if (ctx) return;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    maestro = ctx.createGain();
    maestro.gain.value = 0.22;
    maestro.connect(ctx.destination);
  } catch (e) { ctx = null; }
}
window.addEventListener("keydown", (e) => {
  iniciar();
  if (ctx?.state === "suspended") ctx.resume();
  if (e.key === "m" || e.key === "M") { silencio = !silencio; if (maestro) maestro.gain.value = silencio ? 0 : 0.22; }
});

function tono({ tipo = "square", desde = 440, hasta = desde, dur = 0.15, vol = 0.5, retraso = 0 }) {
  if (!ctx || silencio) return;
  const t = ctx.currentTime + retraso;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = tipo;
  o.frequency.setValueAtTime(desde, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, hasta), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(maestro);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function ruido({ dur = 0.3, vol = 0.6, filtro = 1200, hastaFiltro = 200, retraso = 0 }) {
  if (!ctx || silencio) return;
  const t = ctx.currentTime + retraso;
  const n = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = ctx.createBufferSource();
  s.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.setValueAtTime(filtro, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(40, hastaFiltro), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f).connect(g).connect(maestro);
  s.start(t);
}

export const sfx = {
  disparo: () => tono({ tipo: "square", desde: 880, hasta: 330, dur: 0.09, vol: 0.18 }),
  golpe: () => { tono({ tipo: "sawtooth", desde: 220, hasta: 60, dur: 0.12, vol: 0.35 }); ruido({ dur: 0.1, vol: 0.3, filtro: 3000 }); },
  critico: () => { tono({ tipo: "square", desde: 660, hasta: 1320, dur: 0.12, vol: 0.25 }); tono({ tipo: "square", desde: 990, hasta: 1980, dur: 0.12, vol: 0.2, retraso: 0.06 }); },
  escudo: () => { tono({ tipo: "sine", desde: 300, hasta: 1200, dur: 0.25, vol: 0.35 }); tono({ tipo: "triangle", desde: 1500, hasta: 900, dur: 0.2, vol: 0.2, retraso: 0.05 }); },
  danio: () => { tono({ tipo: "sawtooth", desde: 400, hasta: 90, dur: 0.3, vol: 0.4 }); ruido({ dur: 0.2, vol: 0.25 }); },
  carga: (dur = 0.8) => tono({ tipo: "sawtooth", desde: 120, hasta: 900, dur, vol: 0.18 }),
  laser: () => { tono({ tipo: "sawtooth", desde: 1400, hasta: 200, dur: 0.45, vol: 0.3 }); ruido({ dur: 0.4, vol: 0.2, filtro: 5000, hastaFiltro: 800 }); },
  canon: () => { tono({ tipo: "square", desde: 300, hasta: 80, dur: 0.18, vol: 0.3 }); ruido({ dur: 0.15, vol: 0.3, filtro: 2500 }); },
  explosion: (grande = false) => { ruido({ dur: grande ? 1.2 : 0.5, vol: grande ? 0.9 : 0.55, filtro: 2400, hastaFiltro: 60 }); tono({ tipo: "sine", desde: 120, hasta: 30, dur: grande ? 0.9 : 0.4, vol: 0.6 }); },
  alarma: () => { for (let i = 0; i < 3; i++) tono({ tipo: "square", desde: 880, hasta: 660, dur: 0.12, vol: 0.18, retraso: i * 0.18 }); },
  rugido: () => { tono({ tipo: "sawtooth", desde: 90, hasta: 45, dur: 1.1, vol: 0.5 }); ruido({ dur: 1.1, vol: 0.4, filtro: 800, hastaFiltro: 100 }); },
  impacto: () => { tono({ tipo: "sine", desde: 160, hasta: 35, dur: 0.5, vol: 0.8 }); ruido({ dur: 0.45, vol: 0.6, filtro: 1500, hastaFiltro: 80 }); },
  victoria: () => [523, 659, 784, 1047].forEach((f, i) => tono({ tipo: "square", desde: f, dur: i === 3 ? 0.6 : 0.16, vol: 0.22, retraso: i * 0.15 })),
  lucha: () => { tono({ tipo: "square", desde: 392, dur: 0.12, vol: 0.25 }); tono({ tipo: "square", desde: 784, dur: 0.35, vol: 0.25, retraso: 0.13 }); },
};
