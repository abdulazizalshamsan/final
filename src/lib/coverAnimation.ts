/**
 * Fixed-camera "living" atmosphere painted over the static cover photograph.
 *
 * Every coordinate below is pixel-fitted to Bahrain-Cover.jpg at its native
 * 1536×864 canvas resolution (the canvas is scaled to the rendered size by
 * CSS, not by redrawing at a different resolution). Do not "tidy" these
 * numbers; moving any of them makes a light, beacon or figure drift off the
 * physical structure it is meant to sit on.
 */

const CANVAS_W = 1536;
const CANVAS_H = 864;

// Tower-rooftop and skyline beacon positions.
const BEACONS: [number, number][] = [
  [669, 185], [704, 183], [1316, 183], [1362, 174], [1393, 176], [1319, 263],
  [1254, 274], [1446, 297], [1035, 220], [946, 270], [1210, 263],
];

// Taxiway highlight shown on hover / while entering.
const ROUTE: [number, number][] = [
  [370, 495], [441, 495], [506, 472], [572, 468], [638, 466],
];

const SERVICE_PATH: [number, number][] = [
  [881, 679], [944, 700], [1015, 727], [1085, 758], [1152, 792],
];

// Sky/runway region the lightning is clipped to — matches the rain zone's general area
// so a flash never brightens the headline or button sitting over the tower on the left.
const LIGHTNING_ZONE: [number, number][] = [
  [650, 0], [CANVAS_W, 0], [CANVAS_W, 470], [650, 230],
];

/** Deterministic pseudo-random in [0, 1) — keeps the strike cadence reproducible per run instead of relying on Math.random() inside a render loop. */
function hash01(n: number): number {
  const s = Math.sin(n * 127.1) * 43758.5453123;
  return s - Math.floor(s);
}

export class CoverAtmosphere {
  private ctx: CanvasRenderingContext2D;
  private img: HTMLImageElement;

  private time = 0;
  private lastFrame = 0;
  private hover = false;
  private entering = false;
  private active = true;
  private paused: boolean;
  private rafId: number | null = null;

  private lightMask: HTMLCanvasElement | null = null;
  private darkMask: HTMLCanvasElement | null = null;
  private maskFailed = false;

  private readonly reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  constructor(canvas: HTMLCanvasElement, img: HTMLImageElement) {
    this.img = img;
    this.ctx = canvas.getContext('2d')!;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    this.paused = this.reducedMotion.matches;

    if (this.img.complete && this.img.naturalWidth) this.makeLightMask();
    this.img.addEventListener('load', () => {
      this.makeLightMask();
      this.draw();
    });
  }

  setHover(value: boolean) {
    this.hover = value;
  }

  setEntering(value: boolean) {
    this.entering = value;
  }

  setActive(value: boolean) {
    this.active = value;
    if (value) this.lastFrame = performance.now();
  }

  togglePaused(): boolean {
    this.paused = !this.paused;
    return this.paused;
  }

  isPaused() {
    return this.paused;
  }

  start() {
    if (this.rafId !== null) return;
    this.lastFrame = performance.now();
    const frame = (now: number) => {
      if (this.active && !this.paused) {
        // rAF timestamps and performance.now() (used elsewhere, e.g. setActive on tab
        // refocus) aren't guaranteed monotonic relative to each other, so clamp instead
        // of trusting `now - lastFrame` to stay positive — a negative delta here walks
        // `time` backwards, which desyncs the service-vehicle path index below zero.
        this.time += Math.max(0, Math.min(0.05, (now - this.lastFrame) / 1000));
        this.draw();
      }
      this.lastFrame = now;
      this.rafId = requestAnimationFrame(frame);
    };
    this.draw();
    this.rafId = requestAnimationFrame(frame);
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private glow(x: number, y: number, r: number, a: number, color = '255,38,61') {
    const ctx = this.ctx;
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

  // The accepted, corrected version removes synthetic cloud bands and a zigzag
  // water-reflection distortion that reviewers rejected — these stay no-ops, kept
  // as named methods (rather than deleted) so `draw()`'s call order stays legible.
  private water(_t: number) {
    void _t;
  }
  private clouds(_t: number) {
    void _t;
  }

  private boat(t: number) {
    const ctx = this.ctx;
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
    this.glow(8, -3, 6, 0.85, '255,232,190');
    this.glow(-9, -1, 4, 0.9);
    this.glow(1, -10, 3, 0.55, '234,249,255');
    ctx.restore();
  }

  private service(t: number) {
    const ctx = this.ctx;
    const path = SERVICE_PATH;
    let f = (t / 32) % 2;
    const reverse = f > 1;
    if (reverse) f = 2 - f;
    const p = f * (path.length - 1);
    const i = Math.max(0, Math.min(path.length - 2, Math.floor(p)));
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
    this.glow(11, -3, 13, 0.33, '255,239,190');
    this.glow(11, 3, 13, 0.33, '255,239,190');
    this.glow(-2, -2, 5, 0.4 + 0.25 * Math.sin(t * 2), '255,169,40');
    ctx.restore();
  }

  private person(x: number, y: number, phase: number, scale = 1) {
    const ctx = this.ctx;
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

  private controlRoom(t: number) {
    const ctx = this.ctx;
    ctx.save();
    // Clip all motion to the tower's glass bays — walls and mullions stay in front.
    ctx.beginPath();
    ctx.moveTo(231, 590);
    ctx.lineTo(347, 574);
    ctx.lineTo(343, 689);
    ctx.lineTo(230, 708);
    ctx.closePath();
    ctx.moveTo(359, 572);
    ctx.lineTo(450, 560);
    ctx.lineTo(447, 674);
    ctx.lineTo(355, 687);
    ctx.closePath();
    ctx.moveTo(463, 558);
    ctx.lineTo(545, 550);
    ctx.lineTo(539, 659);
    ctx.lineTo(461, 674);
    ctx.closePath();
    ctx.clip();

    for (const [i, x, y, w, h] of [
      [0, 264, 649, 17, 12],
      [1, 330, 647, 17, 13],
      [2, 419, 612, 26, 17],
      [3, 508, 588, 27, 34],
    ]) {
      ctx.fillStyle = `rgba(234,38,58,${0.08 + (0.5 + 0.5 * Math.sin(t * 0.85 + i)) * 0.14})`;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(255,182,177,.46)';
      for (let j = 0; j < 3; j++) {
        ctx.fillRect(x + 2, y + 3 + j * 3, 4 + (Math.sin(t * 0.7 + i + j) + 1) * w * 0.24, 1);
      }
      this.glow(x + w / 2, y + h / 2, 16, 0.1);
    }

    const f = (t / 6) % 2;
    const p = f > 1 ? 2 - f : f;
    const x = 253 + p * 180;
    const y = 698 - (x - 253) * 0.16;
    this.person(x, y, t * 6, 1.9);

    const colleague = 468 + Math.sin(t * 0.65) * 37;
    this.person(colleague, 655 - (colleague - 468) * 0.16, t * 5, 1.55);

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
    ctx.moveTo(4, -7);
    ctx.lineTo(10, -4);
    ctx.lineTo(15 + Math.sin(t * 0.8) * 3, -14 + Math.sin(t * 0.8) * 7);
    ctx.stroke();
    ctx.strokeStyle = '#201822';
    ctx.beginPath();
    ctx.moveTo(-2, 8);
    ctx.lineTo(-3, 23);
    ctx.moveTo(3, 8);
    ctx.lineTo(5, 23);
    ctx.stroke();
    ctx.restore();

    // Local scan sweep on the existing radar screen.
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
      this.glow(521 + 9 * Math.cos(a), 608 + 9 * Math.sin(a), 2, 0.32);
    }
    ctx.restore();

    // Soft internal light passing behind the glass, following the walking analyst.
    this.glow(x + 4, y - 16, 24, 0.09, '255,175,149');
    ctx.restore();
  }

  private planeActivity(t: number) {
    const ctx = this.ctx;
    this.glow(947, 269, 13, 0.3 + 0.7 * Math.pow(Math.max(0, Math.sin(t * 2.1)), 4));
    this.glow(1211, 265, 11, 0.25 + 0.6 * Math.pow(Math.max(0, Math.sin(t * 2.1 + 0.4)), 4));
    this.glow(1035, 221, 9, 0.3 + 0.5 * Math.pow(Math.max(0, Math.sin(t * 1.9)), 5));
    this.glow(1170, 266, 8, 0.45, '225,245,255');
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const [ex, ey] of [
      [1091, 290],
      [1137, 276],
    ]) {
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

  /** One-time pixel scan that isolates the photograph's own red runway lights into reusable masks. */
  private makeLightMask() {
    if (this.maskFailed || !this.img.complete || !this.img.naturalWidth) return;
    try {
      const src = document.createElement('canvas');
      src.width = CANVAS_W;
      src.height = CANVAS_H;
      const sc = src.getContext('2d', { willReadFrequently: true })!;
      sc.drawImage(this.img, 0, 0, CANVAS_W, CANVAS_H);
      const pixels = sc.getImageData(0, 0, CANVAS_W, CANVAS_H);
      const out = sc.createImageData(CANVAS_W, CANVAS_H);
      const black = sc.createImageData(CANVAS_W, CANVAS_H);
      for (let y = 449; y < 858; y++) {
        for (let x = 790; x < CANVAS_W; x++) {
          const i = (y * CANVAS_W + x) * 4;
          const r = pixels.data[i];
          const g = pixels.data[i + 1];
          const b = pixels.data[i + 2];
          if (r > 112 && r > g * 1.65 && r > b * 1.5 && g < 145) {
            const alpha = Math.min(255, (r - Math.max(g, b)) * 2.5);
            out.data[i] = 255;
            out.data[i + 1] = 38;
            out.data[i + 2] = 49;
            out.data[i + 3] = alpha;
            black.data[i + 3] = alpha;
          }
        }
      }
      this.lightMask = document.createElement('canvas');
      this.lightMask.width = CANVAS_W;
      this.lightMask.height = CANVAS_H;
      this.lightMask.getContext('2d')!.putImageData(out, 0, 0);
      this.darkMask = document.createElement('canvas');
      this.darkMask.width = CANVAS_W;
      this.darkMask.height = CANVAS_H;
      this.darkMask.getContext('2d')!.putImageData(black, 0, 0);
    } catch {
      // A tainted/cross-origin canvas (or a decode failure) means we simply skip the pulse effect.
      this.maskFailed = true;
      this.lightMask = null;
    }
  }

  private runwayActivity(t: number) {
    if (!this.lightMask || !this.darkMask) {
      this.makeLightMask();
      return;
    }
    const ctx = this.ctx;
    const pulse = 0.5 + 0.5 * Math.sin(t * 2);
    ctx.save();
    ctx.globalAlpha = 0.68 * (1 - pulse);
    ctx.drawImage(this.darkMask, 0, 0);
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.2 + 0.8 * pulse;
    ctx.filter = 'blur(3px)';
    ctx.drawImage(this.lightMask, 0, 0);
    ctx.filter = 'none';
    ctx.globalAlpha = 0.18 + 0.72 * pulse;
    ctx.drawImage(this.lightMask, 0, 0);
    ctx.restore();
  }

  private rainfall(t: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(580, 0);
    ctx.lineTo(CANVAS_W, 0);
    ctx.lineTo(CANVAS_W, CANVAS_H);
    ctx.lineTo(840, CANVAS_H);
    ctx.lineTo(786, 452);
    ctx.lineTo(580, 210);
    ctx.closePath();
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

  /**
   * Irregular lightning: a strike "slot" every CYCLE seconds, only ~40% of which
   * actually fire, each with a quick double-flicker envelope. Clipped to the sky
   * above the runway so it brightens the storm, never the headline or button.
   */
  private lightning(t: number) {
    const CYCLE = 6;
    const cycle = Math.floor(t / CYCLE);
    const localT = t - cycle * CYCLE;
    const strikeRoll = hash01(cycle * 3.1 + 1);
    if (strikeRoll > 0.4) return;

    const strikeAt = 0.5 + strikeRoll * (CYCLE - 2.5);
    const dt = localT - strikeAt;
    if (dt < 0 || dt > 0.45) return;

    const flickers: [number, number][] = [
      [0, 0.09],
      [0.16, 0.27],
    ];
    let flash = 0;
    for (const [start, end] of flickers) {
      if (dt >= start && dt <= end) flash = Math.max(flash, Math.sin(((dt - start) / (end - start)) * Math.PI));
    }
    if (flash <= 0) return;

    const ctx = this.ctx;
    const originX = 680 + hash01(cycle * 7.77 + 2) * 750;

    ctx.save();
    ctx.beginPath();
    LIGHTNING_ZONE.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
    ctx.clip();

    ctx.globalCompositeOperation = 'screen';
    const glow = ctx.createRadialGradient(originX, 40, 0, originX, 40, 780);
    glow.addColorStop(0, `rgba(214,224,255,${0.4 * flash})`);
    glow.addColorStop(0.45, `rgba(180,195,230,${0.16 * flash})`);
    glow.addColorStop(1, 'rgba(180,195,230,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(650, 0, CANVAS_W - 650, 470);

    ctx.strokeStyle = `rgba(255,255,255,${0.9 * flash})`;
    ctx.lineWidth = 1.6;
    ctx.shadowColor = 'rgba(200,220,255,.95)';
    ctx.shadowBlur = 16 * flash;
    ctx.beginPath();
    let x = originX;
    let y = 6;
    ctx.moveTo(x, y);
    const segments = 6;
    for (let i = 0; i < segments; i++) {
      x += (hash01(cycle * 11 + i * 3.3 + 4) - 0.5) * 70;
      y += 430 / segments;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  private buildingActivity(t: number) {
    const ctx = this.ctx;
    BEACONS.forEach(([x, y], i) => {
      const p = Math.pow(Math.max(0, Math.sin(t * 1.6 + i * 0.9)), 4);
      this.glow(x, y, 12, 0.18 + p * 0.8);
      if (p > 0.6) {
        ctx.fillStyle = `rgba(255,185,189,${p})`;
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }
    });
    for (const [x, y, w, h, phase] of [
      [1311, 214, 8, 2, 0],
      [1319, 235, 5, 3, 1],
      [1361, 218, 6, 2, 2],
      [1393, 233, 7, 3, 3],
      [1360, 274, 6, 3, 4],
      [1420, 319, 6, 3, 5],
    ]) {
      ctx.fillStyle = `rgba(255,217,156,${0.12 + 0.24 * (0.5 + 0.5 * Math.sin(t * 0.35 + phase))})`;
      ctx.fillRect(x, y, w, h);
    }
    this.glow(688, 228, 30, 0.05 + 0.05 * Math.sin(t * 0.7), '255,58,70');
  }

  private draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    this.water(this.time);
    this.clouds(this.time);
    this.boat(this.time);
    this.service(this.time);
    this.controlRoom(this.time);
    this.runwayActivity(this.time);
    this.buildingActivity(this.time);
    this.planeActivity(this.time);
    this.rainfall(this.time);
    this.lightning(this.time);
    if (this.hover || this.entering) {
      ROUTE.forEach(([x, y], i) => {
        this.glow(x, y, 20, 0.35 + 0.6 * Math.pow(Math.max(0, Math.sin(this.time * 3 - i * 0.6)), 2));
      });
    }
  }
}
