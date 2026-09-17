// Ported 1:1 from NBB-Source.html's #living-bahrain canvas layer.
// Coordinates are calibrated to the supplied Bahrain-Cover.jpg at 1536x864 — do not rescale them.

const W = 1536;
const H = 864;

const BEACONS: [number, number][] = [
  [669, 185], [704, 183], [1316, 183], [1362, 174], [1393, 176], [1319, 263], [1254, 274], [1446, 297],
  [1035, 220], [946, 270], [1210, 263],
];
const ROUTE: [number, number][] = [[370, 495], [441, 495], [506, 472], [572, 468], [638, 466]];
const SERVICE_PATH: [number, number][] = [[881, 679], [944, 700], [1015, 727], [1085, 758], [1152, 792]];

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a: number, color = '255,38,61') {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${color},${a})`);
  g.addColorStop(0.15, `rgba(${color},${a * 0.62})`);
  g.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function boat(ctx: CanvasRenderingContext2D, t: number) {
  const x = 820 + (t * 8) % 710;
  const y = 416 + Math.sin(t * 1.8) * 0.8;
  ctx.save();
  ctx.translate(x, y);
  for (let i = 0; i < 7; i++) {
    const len = 22 + i * 11;
    const spread = 2 + i * 1.05;
    ctx.strokeStyle = `rgba(219,235,247,${0.34 - i * 0.038})`;
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(-6, -1);
    ctx.quadraticCurveTo(-len * 0.6, -spread, -len, -spread + Math.sin(t * 2 + i) * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-6, 2);
    ctx.quadraticCurveTo(-len * 0.6, spread + 2, -len, spread + 2 + Math.sin(t * 2 + i) * 0.5);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(243,245,251,.48)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-10, 2);
  ctx.lineTo(-35, 2 + Math.sin(t * 4) * 0.5);
  ctx.stroke();
  ctx.fillStyle = '#a6b0bc';
  ctx.beginPath();
  ctx.moveTo(-13, -1);
  ctx.lineTo(16, -1);
  ctx.lineTo(11, 4);
  ctx.lineTo(-10, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d3dae0';
  ctx.fillRect(-5, -5, 13, 4);
  ctx.fillStyle = '#344858';
  ctx.fillRect(-2, -5, 6, 3);
  ctx.strokeStyle = '#aab7c2';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(1, -5);
  ctx.lineTo(1, -11);
  ctx.stroke();
  glow(ctx, 8, -3, 6, 0.85, '255,232,190');
  glow(ctx, -9, -1, 4, 0.9);
  glow(ctx, 1, -10, 3, 0.55, '234,249,255');
  ctx.restore();
}

function service(ctx: CanvasRenderingContext2D, t: number) {
  let f = (t / 32) % 2;
  const reverse = f > 1;
  if (reverse) f = 2 - f;
  const path = SERVICE_PATH;
  const p = f * (path.length - 1);
  const i = Math.min(path.length - 2, Math.floor(p));
  const k = p - i;
  const a = path[i];
  const b = path[i + 1];
  const x = a[0] + (b[0] - a[0]) * k;
  const y = a[1] + (b[1] - a[1]) * k;
  const angle = Math.atan2(b[1] - a[1], b[0] - a[0]) + (reverse ? Math.PI : 0);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = 'rgba(0,0,0,.7)';
  ctx.fillRect(-11, 0, 23, 9);
  const g = ctx.createLinearGradient(-10, -5, 10, 5);
  g.addColorStop(0, '#b7bac0');
  g.addColorStop(0.5, '#e3ded4');
  g.addColorStop(1, '#656a73');
  ctx.fillStyle = g;
  ctx.fillRect(-10, -5, 15, 9);
  ctx.fillStyle = '#8d9aa5';
  ctx.fillRect(5, -4, 6, 8);
  ctx.fillStyle = '#162333';
  ctx.fillRect(7, -3, 3, 6);
  ctx.fillStyle = '#111217';
  ctx.fillRect(-7, -6, 4, 2);
  ctx.fillRect(-7, 4, 4, 2);
  ctx.fillRect(6, 4, 3, 2);
  ctx.fillRect(6, -6, 3, 2);
  glow(ctx, 11, -3, 13, 0.33, '255,239,190');
  glow(ctx, 11, 3, 13, 0.33, '255,239,190');
  glow(ctx, -2, -2, 5, 0.4 + 0.25 * Math.sin(t * 2), '255,169,40');
  ctx.restore();
}

function person(ctx: CanvasRenderingContext2D, x: number, y: number, phase: number, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#171321';
  ctx.strokeStyle = 'rgba(248,69,84,.75)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.ellipse(0, -13, 3.3, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#685462';
  ctx.beginPath();
  ctx.moveTo(-3, -9);
  ctx.lineTo(4, -9);
  ctx.lineTo(5, 2);
  ctx.lineTo(-4, 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#bf9199';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-1, 1);
  ctx.lineTo(-2 + Math.sin(phase) * 3, 12);
  ctx.moveTo(2, 1);
  ctx.lineTo(3 - Math.sin(phase) * 3, 12);
  ctx.moveTo(-3, -7);
  ctx.lineTo(-5 + Math.sin(phase) * 2, 0);
  ctx.moveTo(4, -7);
  ctx.lineTo(6 - Math.sin(phase) * 3, 0);
  ctx.stroke();
  ctx.restore();
}

function controlRoom(ctx: CanvasRenderingContext2D, t: number) {
  // Motion is restricted to the glass bays; structural mullions remain untouched.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(231, 590); ctx.lineTo(347, 574); ctx.lineTo(343, 689); ctx.lineTo(230, 708); ctx.closePath();
  ctx.moveTo(359, 572); ctx.lineTo(450, 560); ctx.lineTo(447, 674); ctx.lineTo(355, 687); ctx.closePath();
  ctx.moveTo(463, 558); ctx.lineTo(545, 550); ctx.lineTo(539, 659); ctx.lineTo(461, 674); ctx.closePath();
  ctx.clip();
  const bays: [number, number, number, number, number][] = [
    [0, 264, 649, 17, 12], [1, 330, 647, 17, 13], [2, 419, 612, 26, 17], [3, 508, 588, 27, 34],
  ];
  for (const [i, x, y, w, h] of bays) {
    ctx.fillStyle = `rgba(234,38,58,${0.08 + (0.5 + 0.5 * Math.sin(t * 0.85 + i)) * 0.14})`;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,182,177,.46)';
    for (let j = 0; j < 3; j++) ctx.fillRect(x + 2, y + 3 + j * 3, 4 + (Math.sin(t * 0.7 + i + j) + 1) * w * 0.24, 1);
    glow(ctx, x + w / 2, y + h / 2, 16, 0.1);
  }
  const f = (t / 6) % 2;
  const p = f > 1 ? 2 - f : f;
  const x = 253 + p * 180;
  const y = 698 - (x - 253) * 0.16;
  person(ctx, x, y, t * 6, 1.9);
  const colleague = 468 + Math.sin(t * 0.65) * 37;
  person(ctx, colleague, 655 - (colleague - 468) * 0.16, t * 5, 1.55);
  // A second analyst stands at the radar console and gestures toward the display.
  ctx.save();
  ctx.translate(478, 642);
  ctx.fillStyle = '#352630';
  ctx.strokeStyle = '#b77379';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.ellipse(0, -16, 4.5, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(-5, -10, 10, 19);
  ctx.strokeStyle = '#a46872';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(4, -7); ctx.lineTo(10, -4); ctx.lineTo(15 + Math.sin(t * 0.8) * 3, -14 + Math.sin(t * 0.8) * 7);
  ctx.stroke();
  ctx.strokeStyle = '#201822';
  ctx.beginPath();
  ctx.moveTo(-2, 8); ctx.lineTo(-3, 23); ctx.moveTo(3, 8); ctx.lineTo(5, 23);
  ctx.stroke();
  ctx.restore();
  // Local scan on the existing radar screen.
  ctx.save();
  ctx.beginPath();
  ctx.rect(508, 588, 27, 34);
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,168,168,.58)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(521, 608);
  ctx.lineTo(521 + 17 * Math.cos(t * 0.9), 608 + 17 * Math.sin(t * 0.9));
  ctx.stroke();
  for (let k = 0; k < 3; k++) {
    const a = t * 0.9 + k * 2;
    glow(ctx, 521 + 9 * Math.cos(a), 608 + 9 * Math.sin(a), 2, 0.32);
  }
  ctx.restore();
  // A soft internal light passes behind the glass, following the walking analyst.
  glow(ctx, x + 4, y - 16, 24, 0.09, '255,175,149');
  ctx.restore();
}

function planeActivity(ctx: CanvasRenderingContext2D, t: number) {
  glow(ctx, 947, 269, 13, 0.3 + 0.7 * Math.pow(Math.max(0, Math.sin(t * 2.1)), 4));
  glow(ctx, 1211, 265, 11, 0.25 + 0.6 * Math.pow(Math.max(0, Math.sin(t * 2.1 + 0.4)), 4));
  glow(ctx, 1035, 221, 9, 0.3 + 0.5 * Math.pow(Math.max(0, Math.sin(t * 1.9)), 5));
  glow(ctx, 1170, 266, 8, 0.45, '225,245,255');
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (const [ex, ey] of [[1091, 290], [1137, 276]] as [number, number][]) {
    for (let j = 0; j < 20; j++) {
      const travel = (t * 18 + j * 7) % 135;
      const ratio = travel / 135;
      const x = ex - travel;
      const y = ey + travel * 0.24 + Math.sin(j + t) * 1.4;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 3 + ratio * 10);
      g.addColorStop(0, `rgba(173,185,207,${0.07 * (1 - ratio)})`);
      g.addColorStop(1, 'rgba(160,180,205,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, 7 + ratio * 13, 2 + ratio * 4, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function buildingActivity(ctx: CanvasRenderingContext2D, t: number) {
  BEACONS.forEach(([x, y], i) => {
    const p = Math.pow(Math.max(0, Math.sin(t * 1.6 + i * 0.9)), 4);
    glow(ctx, x, y, 12, 0.18 + p * 0.8);
    if (p > 0.6) {
      ctx.fillStyle = `rgba(255,185,189,${p})`;
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
  });
  const windows: [number, number, number, number, number][] = [
    [1311, 214, 8, 2, 0], [1319, 235, 5, 3, 1], [1361, 218, 6, 2, 2],
    [1393, 233, 7, 3, 3], [1360, 274, 6, 3, 4], [1420, 319, 6, 3, 5],
  ];
  for (const [x, y, w, h, phase] of windows) {
    ctx.fillStyle = `rgba(255,217,156,${0.12 + 0.24 * (0.5 + 0.5 * Math.sin(t * 0.35 + phase))})`;
    ctx.fillRect(x, y, w, h);
  }
  glow(ctx, 688, 228, 30, 0.05 + 0.05 * Math.sin(t * 0.7), '255,58,70');
}

function rainfall(ctx: CanvasRenderingContext2D, t: number) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(580, 0); ctx.lineTo(W, 0); ctx.lineTo(W, H); ctx.lineTo(840, H);
  ctx.lineTo(786, 452); ctx.lineTo(580, 210); ctx.closePath();
  ctx.clip();
  for (let i = 0; i < 155; i++) {
    const depth = (i % 5) / 4;
    const speed = 190 + depth * 300;
    const span = 1050;
    const y = ((i * 73.19 + t * speed) % span) - 90;
    const x = 640 + ((i * 107.37) % 1030) - y * 0.1;
    ctx.strokeStyle = `rgba(199,212,232,${0.13 + depth * 0.19})`;
    ctx.lineWidth = 0.6 + depth * 0.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 2.5 - depth * 3, y + 12 + depth * 16);
    ctx.stroke();
  }
  for (let i = 0; i < 38; i++) {
    const x = 820 + ((i * 97) % 690);
    const y = 478 + ((i * 63) % 343);
    const phase = (t * 1.1 + i * 0.17) % 1;
    ctx.strokeStyle = `rgba(226,211,215,${(1 - phase) * 0.24})`;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.ellipse(x, y, 1 + phase * 6, 0.5 + phase * 1.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export interface CoverAnimationHandle {
  setPaused: (p: boolean) => void;
  setActive: (a: boolean) => void;
  setHover: (h: boolean) => void;
  destroy: () => void;
}

export function createCoverAnimation(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  reducedMotion: boolean,
): CoverAnimationHandle {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { setPaused() {}, setActive() {}, setHover() {}, destroy() {} };
  }

  let time = 0;
  let last = performance.now();
  let hover = false;
  let active = true;
  let paused = reducedMotion;
  let destroyed = false;
  let rafId = 0;
  let lightMask: HTMLCanvasElement | null = null;
  let darkMask: HTMLCanvasElement | null = null;

  function makeLightMask() {
    if (!img.complete || !img.naturalWidth) return;
    try {
      const src = document.createElement('canvas');
      src.width = W; src.height = H;
      const sc = src.getContext('2d', { willReadFrequently: true });
      if (!sc) return;
      sc.drawImage(img, 0, 0, W, H);
      const pixels = sc.getImageData(0, 0, W, H);
      const out = sc.createImageData(W, H);
      const black = sc.createImageData(W, H);
      for (let y = 449; y < 858; y++) {
        for (let x = 790; x < W; x++) {
          const i = (y * W + x) * 4;
          const r = pixels.data[i], g = pixels.data[i + 1], b = pixels.data[i + 2];
          if (r > 112 && r > g * 1.65 && r > b * 1.5 && g < 145) {
            const alpha = Math.min(255, (r - Math.max(g, b)) * 2.5);
            out.data[i] = 255; out.data[i + 1] = 38; out.data[i + 2] = 49; out.data[i + 3] = alpha;
            black.data[i + 3] = alpha;
          }
        }
      }
      const lm = document.createElement('canvas'); lm.width = W; lm.height = H;
      lm.getContext('2d')!.putImageData(out, 0, 0);
      const dm = document.createElement('canvas'); dm.width = W; dm.height = H;
      dm.getContext('2d')!.putImageData(black, 0, 0);
      lightMask = lm; darkMask = dm;
    } catch {
      lightMask = null; darkMask = null;
    }
  }

  function runwayActivity(t: number) {
    if (!lightMask || !darkMask) { makeLightMask(); return; }
    const pulse = 0.5 + 0.5 * Math.sin(t * 2);
    ctx!.save();
    ctx!.globalAlpha = 0.68 * (1 - pulse);
    ctx!.drawImage(darkMask, 0, 0);
    ctx!.globalCompositeOperation = 'screen';
    ctx!.globalAlpha = 0.2 + 0.8 * pulse;
    ctx!.filter = 'blur(3px)';
    ctx!.drawImage(lightMask, 0, 0);
    ctx!.filter = 'none';
    ctx!.globalAlpha = 0.18 + 0.72 * pulse;
    ctx!.drawImage(lightMask, 0, 0);
    ctx!.restore();
  }

  function draw() {
    ctx!.clearRect(0, 0, W, H);
    boat(ctx!, time);
    service(ctx!, time);
    controlRoom(ctx!, time);
    runwayActivity(time);
    buildingActivity(ctx!, time);
    planeActivity(ctx!, time);
    rainfall(ctx!, time);
    if (hover) {
      ROUTE.forEach(([x, y], i) => glow(ctx!, x, y, 20, 0.35 + 0.6 * Math.pow(Math.max(0, Math.sin(time * 3 - i * 0.6)), 2)));
    }
  }

  function frame(now: number) {
    if (destroyed) return;
    if (active && !paused && document.visibilityState !== 'hidden') {
      time += Math.min(0.05, (now - last) / 1000);
      draw();
    }
    last = now;
    rafId = requestAnimationFrame(frame);
  }

  const onVisibility = () => { last = performance.now(); };
  document.addEventListener('visibilitychange', onVisibility);

  if (img.complete && img.naturalWidth) makeLightMask();
  else img.addEventListener('load', makeLightMask, { once: true });

  draw();
  rafId = requestAnimationFrame(frame);

  return {
    setPaused(p: boolean) { paused = p; },
    setActive(a: boolean) { active = a; if (a) last = performance.now(); },
    setHover(h: boolean) { hover = h; },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', onVisibility);
      img.removeEventListener('load', makeLightMask);
    },
  };
}
