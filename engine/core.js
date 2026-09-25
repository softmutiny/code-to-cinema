// code-to-cinema · engine core: rng, noise, geometry, Plate (a drawing that writes itself stroke by stroke)
// Canvas is fixed at W×H; the drawable plate area is PL. Every shot builds Plates in build() and reveals them in frame(t).
const W = 1600, H = 900, PFPS = 8;
const PL = { x0: 70, y0: 44, x1: 1530, y1: 716 };
const INK = '#1e1a1c', PAPER = '#e8dfcc', PAPERL = '#efe8d8', LAMP = '#e8b04a', RED = '#8e1f2a', CHALK = '#ddd3bd';
const PI = Math.PI, TAU = PI * 2;
const mk = (seed) => { let s = seed | 0; return () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sm = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const f1 = (v) => (Math.round(v * 10) / 10).toString();
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function hash(i, j, s) { let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 982451653)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, y, s = 0) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function fbm(x, y, s = 0) { let v = 0, a = 0.5, f = 1; for (let i = 0; i < 4; i++) { v += a * vnoise(x * f, y * f, s + i * 17); f *= 2; a *= 0.5; } return v / 0.9375; }
// shapes
const ell = (x, y, cx, cy, rx, ry) => Math.hypot((x - cx) / rx, (y - cy) / ry); // <1 inside
function pip(x, y, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c; } return c; }
function segDist(x, y, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1]; const t = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1)); return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy); }
function polyDist(x, y, poly) { let d = 1e9; for (let i = 0; i < poly.length - 1; i++) d = Math.min(d, segDist(x, y, poly[i], poly[i + 1])); return d; }
function bbox(poly) { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const [x, y] of poly) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); } return [a, b, c, d]; }
function ellPts(cx, cy, rx, ry, a0 = 0, a1 = TAU, n = 48, rot = 0) { const p = []; const cr = Math.cos(rot), sr = Math.sin(rot); for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; const x = Math.cos(a) * rx, y = Math.sin(a) * ry; p.push([cx + x * cr - y * sr, cy + x * sr + y * cr]); } return p; }
function bez(p0, p1, p2, p3, n = 16) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]); } return o; }
function spline(P, n = 8, closed = false) { const o = []; const pts = closed ? [P[P.length - 1], ...P, P[0], P[1]] : [P[0], ...P, P[P.length - 1]]; for (let i = 1; i < pts.length - 2; i++) { const [p0, p1, p2, p3] = [pts[i - 1], pts[i], pts[i + 1], pts[i + 2]]; for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; o.push([0, 1].map(j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3))); } } o.push(closed ? [...P[0]] : [...P[P.length - 1]]); return o; }
function capsule(a, b, r, r2 = r, n = 9) { const an = Math.atan2(b[1] - a[1], b[0] - a[0]); const o = []; for (let i = 0; i <= n; i++) { const t = an - PI / 2 + PI * i / n; o.push([b[0] + Math.cos(t) * r2, b[1] + Math.sin(t) * r2]); } for (let i = 0; i <= n; i++) { const t = an + PI / 2 + PI * i / n; o.push([a[0] + Math.cos(t) * r, a[1] + Math.sin(t) * r]); } return o; }
// distance-based shading for a capsule: returns u in [0,1] inside (0 = axis, 1 = edge) or -1 outside
function capU(x, y, a, b, r) { const d = segDist(x, y, a, b); return d < r ? d / r : -1; }
function plen(p) { let l = 0; for (let i = 1; i < p.length; i++) l += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return l; }
function resample(p, step) { const o = [p[0]]; let acc = 0; for (let i = 1; i < p.length; i++) { const [ax, ay] = p[i - 1], [bx, by] = p[i]; const d = Math.hypot(bx - ax, by - ay); let t = step - acc; while (t <= d) { o.push([ax + (bx - ax) * t / d, ay + (by - ay) * t / d]); t += step; } acc = d - (t - step); } const l = p[p.length - 1]; const q = o[o.length - 1]; if (Math.hypot(q[0] - l[0], q[1] - l[1]) > 0.5) o.push([...l]); return o; }
function wob(p, amp, seed, freq = 0.04) { if (!amp || p.length < 2) return p; const q = resample(p, 5); let s = 0; return q.map((pt, i) => { const a = q[Math.max(0, i - 1)], b = q[Math.min(q.length - 1, i + 1)]; const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; if (i) s += Math.hypot(pt[0] - q[i - 1][0], pt[1] - q[i - 1][1]); const o = (vnoise(s * freq, seed * 7.13, seed) - 0.5) * 2 * amp; return [pt[0] - dy / l * o, pt[1] + dx / l * o]; }); }
function partial(p, f, lens) { if (f >= 1) return p; const L = lens[lens.length - 1] * f; let i = 1; while (i < p.length && lens[i] < L) i++; if (i >= p.length) return p; const a = p[i - 1], b = p[i], seg = lens[i] - lens[i - 1] || 1, t = (L - lens[i - 1]) / seg; return [...p.slice(0, i), [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]]; }
const dStr = (p) => { let s = 'M' + f1(p[0][0]) + ' ' + f1(p[0][1]); for (let i = 1; i < p.length; i++) s += 'L' + f1(p[i][0]) + ' ' + f1(p[i][1]); return s; };
const tf = (x, y, s = 1, r = 0) => `translate(${f1(x)} ${f1(y)})${r ? ` rotate(${f1(r)})` : ''}${s !== 1 ? ` scale(${s.toFixed(3)})` : ''}`;

// ---------- Plate: a drawing built from strokes, revealed progressively ----------
// layer 0 = contours (single pen, sequential), layers 1..4 = hatching (sweeps), 5 = details/accents
class Plate {
  constructor(seed = 1, o = {}) { this.items = []; this.rnd = mk(seed); this.seed = seed; this.col = o.col || INK; this.win = o.win || [[0, 0.55], [0.22, 0.72], [0.4, 0.86], [0.55, 0.96], [0.66, 1], [0.3, 0.9]]; this.keyFn = o.key || null; this.cache = null; }
  line(pts, o = {}) {
    const p = o.raw ? pts : wob(pts, o.wob ?? 0.9, Math.floor(this.rnd() * 1000), o.freq);
    if (p.length < 2) return this;
    this.items.push({ k: 's', pts: p, w: o.w ?? 1.6, col: o.col || this.col, op: o.op ?? 1, layer: o.layer ?? 0, key: o.key, len: plen(p) });
    return this;
  }
  poly(pts, o = {}) { return this.line([...pts, pts[0]], o); }
  fill(pts, fill, o = {}) { this.items.push({ k: 'f', d: dStr(pts) + 'Z', fill, op: o.op ?? 1, layer: o.layer ?? 0, key: o.key ?? -1e9, len: 0, blend: o.blend, filter: o.filter }); return this; }
  raw(svg, o = {}) { this.items.push({ k: 'r', svg, layer: o.layer ?? 5, key: o.key ?? 0, len: o.len ?? 60 }); return this; }
  text(x, y, str, o = {}) { this.items.push({ k: 't', x, y, str, cls: o.cls || 'serif', size: o.size || 20, fill: o.fill || this.col, anchor: o.anchor || 'middle', extra: o.extra || '', layer: o.layer ?? 0, key: o.key ?? x, len: o.len ?? str.length * (o.size || 20) * 0.6 }); return this; }
  dots(tone, n, bb, o = {}) { // stipple
    const r = mk(o.seed || 5); const pts = [];
    for (let i = 0; i < n; i++) { const x = bb[0] + r() * (bb[2] - bb[0]), y = bb[1] + r() * (bb[3] - bb[1]); if (r() < tone(x, y)) pts.push([x, y]); }
    const chunk = 60; for (let i = 0; i < pts.length; i += chunk) { const c = pts.slice(i, i + chunk); const kx = c.reduce((a, p) => a + p[0], 0) / c.length; this.items.push({ k: 'd', pts: c, w: o.w || 1.7, col: o.col || this.col, layer: o.layer ?? 4, key: o.key ? o.key(c[0][0], c[0][1]) : kx, len: c.length * 3 }); }
    return this;
  }
  // hatch lines wherever tone(x,y) > thr
  hatch(tone, thr, ang, sp, o = {}) {
    const bb = o.bb || [PL.x0, PL.y0, PL.x1, PL.y1]; const [x0, y0, x1, y1] = bb;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    const R = Math.hypot(x1 - x0, y1 - y0) / 2 + 2, step = o.step || 3, r = mk(o.seed || Math.floor(this.rnd() * 1e6));
    const wave = o.wave || 0, jit = o.jit ?? 0.03, layer = o.layer ?? 1;
    const wmin = o.wmin ?? 0.3 * (o.w || 1), wmax = o.wmax ?? 1.9 * (o.w || 1), gam = o.gam ?? 1.1;
    const push = (c, off) => {
      if (c.pts.length < 3) return;
      const q = [], ws = []; for (let i = 0; i < c.pts.length; i += 2) { q.push(c.pts[i]); ws.push(c.w[i]); } if ((c.pts.length - 1) % 2) { q.push(c.pts[c.pts.length - 1]); ws.push(c.w[c.w.length - 1]); }
      ws[0] *= 0.5; ws[ws.length - 1] *= 0.5;
      const m = q[Math.floor(q.length / 2)];
      this.items.push({ k: 'h', pts: q, ws, col: o.col || this.col, op: o.op ?? 1, layer, key: o.key ? o.key(m[0], m[1]) : (this.keyFn ? this.keyFn(m[0], m[1]) : off), len: plen(q) });
    };
    for (let off = -R; off <= R; off += sp * (0.94 + 0.12 * r())) {
      const lt = thr + (r() - 0.5) * jit, ph = r() * TAU; let cur = null;
      for (let s = -R; s <= R; s += step) {
        const wv = wave * Math.sin(s * 0.006 + ph * 0.3 + off * 0.004) + wave * 0.25 * Math.sin(s * 0.021 + ph);
        const x = cx + nx * (off + wv) + dx * s, y = cy + ny * (off + wv) + dy * s;
        const t = (x >= x0 && x <= x1 && y >= y0 && y <= y1) ? tone(x, y) : -1;
        if (t > lt) { if (!cur) cur = { pts: [], w: [] }; cur.pts.push([x, y]); cur.w.push(wmin + (wmax - wmin) * Math.pow(clamp((t - lt) / (1 - lt + 1e-3)), gam)); }
        else if (cur) { push(cur, off); cur = null; }
      }
      if (cur) push(cur, off);
    }
    return this;
  }
  // engraving tone build: swelling parallel lines, a cross set in the mid-darks, a third set in the blacks
  tone(tone, o = {}) {
    const a = o.ang ?? 0.35, sp = o.sp || 5.2, con = o.con ?? 1.3;
    const angs = o.angs || [a, a + 1.0, a - 0.5];
    const T = (x, y) => { const v = tone(x, y); return v <= 0 ? v : clamp((v - 0.5) * con + 0.5); };
    const w = o.w ? o.w / 0.85 : 1;
    this.hatch(T, 0.07, angs[0], sp, { layer: 1, wave: o.wave ?? 3, wmin: 0.35 * w, wmax: 2.3 * w, bb: o.bb, key: o.key, col: o.col, step: o.step });
    this.hatch(T, 0.5, angs[1], sp * 1.08, { layer: 2, wave: (o.wave ?? 3) * 0.7, wmin: 0.3 * w, wmax: 1.9 * w, bb: o.bb, key: o.key, col: o.col, step: o.step });
    this.hatch(T, 0.8, angs[2], sp * 0.95, { layer: 3, wave: (o.wave ?? 3) * 0.5, wmin: 0.3 * w, wmax: 1.5 * w, bb: o.bb, key: o.key, col: o.col, step: o.step });
    return this;
  }
  finalize() {
    const byL = {};
    for (const it of this.items) (byL[it.layer] ||= []).push(it);
    for (const L in byL) {
      const arr = byL[L]; const [a, b] = this.win[L] || [0, 1];
      if (+L === 0) arr.sort((p, q) => (p.key ?? 0) - (q.key ?? 0)); else arr.sort((p, q) => p.key - q.key);
      const tot = arr.reduce((s, i) => s + Math.max(i.len, 1), 0); let cum = 0;
      for (const it of arr) { it.t0 = a + (b - a) * cum / tot; cum += Math.max(it.len, 1); it.t1 = a + (b - a) * cum / tot; if (it.pts && !it.lens) { it.lens = [0]; for (let i = 1; i < it.pts.length; i++) it.lens.push(it.lens[i - 1] + Math.hypot(it.pts[i][0] - it.pts[i - 1][0], it.pts[i][1] - it.pts[i - 1][1])); } }
    }
    this.fin = true; return this;
  }
  // returns {svg, tip:[x,y,ang]|null, drawn:length}
  render(P) {
    if (!this.fin) this.finalize();
    if (P >= 1 && this.cache) return this.cache;
    const groups = new Map(); let fills = '', texts = '', raws = '', tip = null, drawn = 0, tipLayer = 99;
    for (const it of this.items) {
      if (P <= it.t0) continue;
      const f = clamp((P - it.t0) / (it.t1 - it.t0 || 1e-6));
      if (it.k === 'f') { fills += `<path d="${it.d}" fill="${it.fill}"${it.op < 1 ? ` opacity="${it.op}"` : ''}${it.blend ? ` style="mix-blend-mode:${it.blend}"` : ''}${it.filter ? ` filter="${it.filter}"` : ''}/>`; continue; }
      if (it.k === 't') { const n = Math.ceil(it.str.length * f); texts += `<text class="${it.cls}" x="${f1(it.x)}" y="${f1(it.y)}" font-size="${it.size}" fill="${it.fill}" text-anchor="${it.anchor}" ${it.extra}>${esc(it.str.slice(0, n))}</text>`; drawn += it.len * f; continue; }
      if (it.k === 'r') { if (f > 0.3) raws += it.svg; continue; }
      if (it.k === 'd') { const n = Math.ceil(it.pts.length * f); const kk = it.col + '|' + it.w + '|d'; let s = groups.get(kk) || ''; for (let i = 0; i < n; i++) s += `M${f1(it.pts[i][0])} ${f1(it.pts[i][1])}h0.1`; groups.set(kk, s); drawn += n * 3; continue; }
      const p = f < 1 ? partial(it.pts, f, it.lens) : it.pts;
      drawn += it.len * f;
      if (it.k === 'h') {
        if (f < 1 && it.layer <= tipLayer && p.length > 1) { const a = p[p.length - 1], b = p[p.length - 2]; tip = [a[0], a[1], Math.atan2(a[1] - b[1], a[0] - b[0])]; tipLayer = it.layer; }
        const n = p.length; if (n < 2) continue; const L = [], Rr = [];
        for (let i = 0; i < n; i++) { const a = p[Math.max(0, i - 1)], b = p[Math.min(n - 1, i + 1)]; const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; const w = (it.ws[Math.min(i, it.ws.length - 1)] || 0.3) / 2; L.push(f1(p[i][0] - dy / l * w) + ' ' + f1(p[i][1] + dx / l * w)); Rr.push(f1(p[i][0] + dy / l * w) + ' ' + f1(p[i][1] - dx / l * w)); }
        const kk = it.col + '|h|' + (it.op ?? 1);
        groups.set(kk, (groups.get(kk) || '') + 'M' + L.join('L') + 'L' + Rr.reverse().join('L') + 'Z');
        continue;
      }
      if (f < 1 && it.layer <= tipLayer && p.length > 1) { const a = p[p.length - 1], b = p[p.length - 2]; tip = [a[0], a[1], Math.atan2(a[1] - b[1], a[0] - b[0])]; tipLayer = it.layer; }
      const wb = Math.round(it.w * 5) / 5; const kk = it.col + '|' + wb + '|' + (it.op ?? 1);
      groups.set(kk, (groups.get(kk) || '') + dStr(p));
    }
    let strokes = '';
    for (const [kk, d] of groups) { const [col, w, op] = kk.split('|'); if (w === 'h') { strokes += `<path d="${d}" fill="${col}" stroke="${col}" stroke-width="0.25"${op !== '1' ? ` opacity="${op}"` : ''}/>`; continue; } strokes +=`<path d="${d}" fill="none" stroke="${col}" stroke-width="${op === 'd' ? w : w}" stroke-linecap="round" stroke-linejoin="round"${op !== 'd' && op !== '1' ? ` opacity="${op}"` : ''}/>`; }
    const out = { svg: fills + strokes + texts + raws, tip, drawn };
    if (P >= 1) this.cache = out;
    return out;
  }
  totalLen() { return this.items.reduce((s, i) => s + (i.len || 0), 0); }
}

// ---------- recurring motifs ----------
function nib(x, y, dark = true, ang = 0) {
  const c = dark ? INK : '#cfc6b3', hl = dark ? '#8d8479' : '#fff8e6';
  const r = 122 + Math.sin(ang) * 6;
  return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(r)})"><g transform="rotate(90)"><path d="M0 0 L-6 22 Q-8 36 -5 48 L5 48 Q8 36 6 22 Z" fill="${c}"/><path d="M0 2 L0 26" stroke="${hl}" stroke-width="0.8"/><circle cx="0" cy="27" r="1.8" fill="${hl}"/>
  <path d="M-5 48 L-6 170 L6 170 L5 48 Z" fill="${dark ? '#3a302c' : '#9a8f7c'}" opacity="0.92"/></g></g>`;
}
// lantern (hanging cage lantern), origin = bail top. returns Plate (local coords) and flame center
function lanternPlate(s = 1, seed = 3, o = {}) {
  const P = new Plate(seed, { col: o.col || INK, win: [[0, 0.7], [0.3, 0.9], [0.45, 1], [0.5, 1], [0.6, 1], [0.3, 1]] });
  const S = (pts) => pts.map(([x, y]) => [x * s, y * s]);
  P.line(S(ellPts(0, 6, 7, 7, PI, TAU + PI, 20)), { w: 1.3 * s });
  P.poly(S([[-14, 14], [14, 14], [20, 24], [-20, 24]]), { w: 1.4 * s });
  P.poly(S([[-18, 24], [18, 24], [16, 70], [-16, 70]]), { w: 1.5 * s });
  if (o.bars !== false) for (const x of [-9, 0, 9]) P.line(S([[x * 1.05, 24], [x * 0.95, 70]]), { w: 0.9 * s });
  P.poly(S([[-22, 70], [22, 70], [18, 78], [-18, 78]]), { w: 1.4 * s });
  P.hatch((x, y) => (pip(x / s, y / s, [[-14, 14], [14, 14], [20, 24], [-20, 24]]) || pip(x / s, y / s, [[-22, 70], [22, 70], [18, 78], [-18, 78]])) ? 0.9 : 0, 0.3, 0.2, 2.4 * s, { bb: [-24 * s, 10 * s, 24 * s, 80 * s], layer: 1, w: 0.8 * s });
  return { plate: P, flame: [0, 50 * s] };
}
function lanternGlow(x, y, r, a = 1, flick = 0, dark = false) {
  const rr = r * (1 + flick * 0.06);
  return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(rr)}" fill="url(#glow)" opacity="${((dark ? 0.55 : 0.75) * a).toFixed(2)}" style="mix-blend-mode:${dark ? 'screen' : 'multiply'}"/>` +
    `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(rr * 0.42)}" fill="url(#glow)" opacity="${(0.5 * a).toFixed(2)}"/>` +
    `<path d="M${f1(x)} ${f1(y - 13 * r / 90)} q${f1(6 * r / 90)} ${f1(9 * r / 90)} 0 ${f1(16 * r / 90)} q${f1(-6 * r / 90)} ${f1(-7 * r / 90)} 0 ${f1(-16 * r / 90)}Z" fill="#fff3d0" opacity="${(0.95 * a).toFixed(2)}"/>` +
    `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(rr * 0.13)}" fill="url(#core)" opacity="${a.toFixed(2)}"/>`;
}
