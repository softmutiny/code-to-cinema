// code-to-cinema · liyue drawer: pastel cloisonné (掐丝珐琅) storybook style.
// Math + seeded rng + the ornament library (clouds, osmanthus, lanterns, pavilions, lattice windows, figures)
// + Cloi: a drawing that makes itself the way cloisonné is made: gold wire is laid first (掐丝), then enamel floods each cell (点蓝).
const W = 1600, H = 900, PFPS = 8;
const PI = Math.PI, TAU = PI * 2;
const mk = (s0) => { let s = s0 | 0; return () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sm = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function hash(i, j, s) { let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 982451653)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, y, s = 0) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function fbm(x, y, s = 0) { let v = 0, a = 0.5, fq = 1; for (let i = 0; i < 4; i++) { v += a * vnoise(x * fq, y * fq, s + i * 17); fq *= 2; a *= 0.5; } return v / 0.9375; }

// ---------------- ornament library (from the v3/v4 stills) ----------------
const NS = 'http://www.w3.org/2000/svg';
let seed = 20261006;
const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const R = (a, b) => a + (b - a) * rnd();
const f = v => (+v).toFixed(1);


const INK = '#6b5273', GOLD = '#d4ae58', GOLDL = '#f6e1a0', GOLDD = '#a9803a', LEADC = '#d9bc70';


const tmp = document.createElementNS(NS, 'path');
document.getElementById('measure').appendChild(tmp);
function sample(d, n) {
  tmp.setAttribute('d', d);
  const L = tmp.getTotalLength(), P = [];
  for (let i = 0; i <= n; i++) { const p = tmp.getPointAtLength(L * i / n); P.push([p.x, p.y]); }
  return P;
}
function offsets(d, w0, w1, wm, n, ks) {
  const P = sample(d, n);
  return ks.map(k => P.map((p, i) => {
    const t = i / n, a = P[Math.max(0, i - 1)], b = P[Math.min(n, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const w = ((w0 - w1) * (1 - Math.pow(t, 1.5)) + w1 + wm * Math.sin(Math.PI * t)) / 2;
    return [p[0] - dy * w * k, p[1] + dx * w * k];
  }));
}
const poly = pts => 'M' + pts.map(p => f(p[0]) + ',' + f(p[1])).join('L');
function ribbon(d, w0, w1, wm, n = 90) {
  const [A, B] = offsets(d, w0, w1, wm, n, [1, -1]);
  return poly(A) + 'L' + B.reverse().map(p => f(p[0]) + ',' + f(p[1])).join('L') + 'Z';
}
// tapered hair lock: fine at the root, full at mid-length, fine curling tip
function strand(d, w0, wm, fill, opt = {}) {
  const n = 120;
  let s = `<path d="${ribbon(d, w0, 0.8, wm, n)}" fill="${fill}" stroke="${opt.stroke || INK}" stroke-width="${opt.sw || 1.7}" stroke-linejoin="round"/>`;
  const ks = opt.ks || [-0.5, -0.1, 0.3, 0.62];
  const lines = offsets(d, w0, 0.8, wm, n, ks);
  lines.forEach((L, j) => {
    const a = Math.floor(n * (0.04 + 0.03 * j)), b = Math.floor(n * (0.86 + 0.03 * (j % 2)));
    const hi = j === 1;
    s += `<path d="${poly(L.slice(a, b))}" fill="none" stroke="${hi ? (opt.hi || '#fff6d8') : (opt.lo || '#c1924a')}" stroke-width="${hi ? 1.7 : 0.9}" stroke-linecap="round" opacity="${hi ? 0.9 : 0.75}"/>`;
  });
  return s;
}
function fluffy(d, w0, w1, wm, bumps, amp) {
  const n = 200;
  const [A, B] = offsets(d, w0, w1, wm, n, [1, -1]);
  const P = sample(d, n);
  const bump = (arr, ph) => arr.map((p, i) => { const c = P[i], k = 1 + amp * (0.5 + 0.5 * Math.sin(i * Math.PI * 2 * bumps / n + ph)); return [c[0] + (p[0] - c[0]) * k, c[1] + (p[1] - c[1]) * k]; });
  const a = bump(A, 0), b = bump(B, 1.7);
  return poly(a) + 'L' + b.reverse().map(p => f(p[0]) + ',' + f(p[1])).join('L') + 'Z';
}
function clipHalf(pg, a, b, c) {
  const o = [];
  for (let i = 0; i < pg.length; i++) {
    const P = pg[i], Q = pg[(i + 1) % pg.length];
    const fp = a * P[0] + b * P[1] - c, fq = a * Q[0] + b * Q[1] - c;
    if (fp <= 0) o.push(P);
    if ((fp < 0) !== (fq < 0) && fp !== fq) { const t = fp / (fp - fq); o.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); }
  }
  return o;
}
function voronoi(sites, box, lim = 160) {
  return sites.map((s, i) => {
    let pg = [[box[0], box[1]], [box[2], box[1]], [box[2], box[3]], [box[0], box[3]]];
    for (let j = 0; j < sites.length && pg.length; j++) {
      if (i === j) continue; const t = sites[j];
      const a = t[0] - s[0], b = t[1] - s[1];
      if (Math.abs(a) > lim || Math.abs(b) > lim) continue;
      pg = clipHalf(pg, a, b, (t[0] * t[0] + t[1] * t[1] - s[0] * s[0] - s[1] * s[1]) / 2);
    }
    return pg;
  });
}
const centroid = pg => { let x = 0, y = 0; pg.forEach(p => { x += p[0]; y += p[1]; }); return [x / pg.length, y / pg.length]; };
const shrink = (pg, k) => { const c = centroid(pg); return pg.map(p => [c[0] + (p[0] - c[0]) * k, c[1] + (p[1] - c[1]) * k]); };
const hsl = (h, s, l, a = 1) => `hsla(${f(h)},${f(s)}%,${f(l)}%,${a})`;


// ---------- small ornaments ----------
const twinkle = (x, y, r, col = '#fff6d4', o = 1) => `<path d="M${f(x)},${f(y - r)} Q${f(x + r * 0.16)},${f(y - r * 0.16)} ${f(x + r)},${f(y)} Q${f(x + r * 0.16)},${f(y + r * 0.16)} ${f(x)},${f(y + r)} Q${f(x - r * 0.16)},${f(y + r * 0.16)} ${f(x - r)},${f(y)} Q${f(x - r * 0.16)},${f(y - r * 0.16)} ${f(x)},${f(y - r)} Z" fill="${col}" opacity="${o}"/>`;
const sparkle = (x, y, r, o = 1) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 1.3)}" fill="#fff4c8" opacity="${f(0.45 * o)}" filter="url(#glowS)"/>` + twinkle(x, y, r, '#fffbea', o) + twinkle(x, y, r * 0.45, '#f3cf6e', o);
function star5(x, y, r, rot = 0) {
  let d = '';
  for (let i = 0; i < 10; i++) { const a = (i * 36 - 90 + rot) * Math.PI / 180, rr = i % 2 ? r * 0.46 : r; d += (i ? 'L' : 'M') + f(x + Math.cos(a) * rr) + ',' + f(y + Math.sin(a) * rr); }
  return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 1.8)}" fill="#fff0b8" opacity="0.5" filter="url(#glowS)"/><path d="${d}Z" fill="url(#goldG)" stroke="${GOLDD}" stroke-width="0.9" stroke-linejoin="round"/><path d="${d}Z" transform="translate(${f(x)},${f(y)}) scale(0.45) translate(${f(-x)},${f(-y)})" fill="#fff6d0" opacity="0.9"/>`;
}
function crescentC(x, y, r, rot = 0) {
  return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 1.7)}" fill="#fff3c4" opacity="0.45" filter="url(#glowS)"/><g transform="translate(${f(x)},${f(y)}) rotate(${rot})"><path d="M0,${-r} A${r},${r} 0 1 0 0,${r} A${f(r * 0.7)},${r} 0 1 1 0,${-r} Z" fill="url(#fruitG)" stroke="${GOLDD}" stroke-width="1"/></g>`;
}
function rosette(x, y, s = 1) {
  let p = '';
  for (let k = 0; k < 8; k++) p += `<ellipse cx="0" cy="${-5.2 * s}" rx="${2.4 * s}" ry="${4.4 * s}" transform="rotate(${k * 45})"/>`;
  return `<g transform="translate(${f(x)},${f(y)})"><circle r="${f(12 * s)}" fill="#fff3c4" opacity="0.6" filter="url(#glowS)"/><g fill="url(#goldG)" stroke="${GOLDD}" stroke-width="${f(0.6 * s)}">${p}</g><circle r="${f(3 * s)}" fill="#fff6d6" stroke="${GOLDD}" stroke-width="${f(0.7 * s)}"/></g>`;
}
function osmFlower(x, y, s, rot) {
  let p = '';
  for (let k = 0; k < 4; k++) p += `<ellipse cx="0" cy="${-2.3 * s}" rx="${1.7 * s}" ry="${2.4 * s}" transform="rotate(${k * 90})"/>`;
  return `<g transform="translate(${f(x)},${f(y)}) rotate(${f(rot)})"><g fill="#f9cf55" stroke="#b77e22" stroke-width="${f(0.4 * s)}">${p}</g><circle r="${f(0.85 * s)}" fill="#e08a1e"/></g>`;
}
function osmCluster(x, y, n, s, spread) {
  let o = `<circle cx="${f(x)}" cy="${f(y)}" r="${f(spread * 1.3)}" fill="#ffe79a" opacity="0.35" filter="url(#glowS)"/>`;
  for (let i = 0; i < n; i++) { const a = R(0, 6.28), r = R(0, spread); o += osmFlower(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.8, s * R(0.8, 1.15), R(0, 90)); }
  return o;
}
// deep violet-indigo leaf (Hermès storybook palette)
function leaf(x, y, len, ang, w = 0.34) {
  const L = len, W = len * w;
  return `<g transform="translate(${f(x)},${f(y)}) rotate(${f(ang)})"><path d="M0,0 C${f(L * 0.3)},${f(-W)} ${f(L * 0.75)},${f(-W * 0.8)} ${f(L)},0 C${f(L * 0.75)},${f(W * 0.8)} ${f(L * 0.3)},${f(W)} 0,0 Z" fill="#54479a" stroke="#3a2f74" stroke-width="1"/><path d="M0,0 C${f(L * 0.3)},${f(-W * 0.6)} ${f(L * 0.7)},${f(-W * 0.5)} ${f(L * 0.92)},0 C${f(L * 0.7)},${f(-W * 0.12)} ${f(L * 0.3)},${f(-W * 0.06)} 0,0Z" fill="#7d70c6" opacity="0.75"/><path d="M${f(L * 0.05)},0 L${f(L * 0.9)},0" stroke="${GOLD}" stroke-width="0.8" opacity="0.8"/></g>`;
}
// small glowing moon hanging like fruit
function moonFruit(x, y, r, stem = 12, full = true) {
  let o = `<path d="M${f(x)},${f(y - r - stem)} L${f(x)},${f(y - r)}" stroke="${GOLDD}" stroke-width="1"/>`;
  o += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.6)}" fill="#fff2b8" opacity="0.55" filter="url(#glow)"/>`;
  if (full) o += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#fruitG)" stroke="${GOLDD}" stroke-width="0.9"/><circle cx="${f(x - r * 0.3)}" cy="${f(y - r * 0.3)}" r="${f(r * 0.3)}" fill="#fff" opacity="0.7"/>`;
  else o += crescentC(x, y, r, -20);
  return o;
}
function branch(d, w0, leaves, clusters, fs = 1, fruits = []) {
  let s = `<path d="${ribbon(d, w0, 1.4, 0)}" fill="#7a6182" stroke="#4d3a5a" stroke-width="1.1"/>`;
  const P = sample(d, 60);
  let lv = '', fl = '', fr = '';
  for (let i = 0; i < leaves; i++) {
    const t = 0.12 + 0.85 * i / leaves, idx = Math.floor(t * 60), p = P[idx], q = P[Math.min(60, idx + 1)];
    const ang = Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI;
    const side = i % 2 ? 1 : -1;
    lv += leaf(p[0], p[1], R(26, 38) * fs, ang + side * R(35, 62));
  }
  for (let i = 0; i < clusters; i++) {
    const t = 0.18 + 0.8 * i / clusters, p = P[Math.floor(t * 60)];
    fl += osmCluster(p[0] + R(-5, 5), p[1] + R(-3, 7), Math.round(R(5, 9)), 1.55 * fs, 9 * fs);
  }
  for (const [t, r, st, full] of fruits) { const p = P[Math.floor(t * 60)]; fr += moonFruit(p[0], p[1] + st + r, r, st, full !== false); }
  return s + lv + fr + fl;
}
// soft rounded 祥云 cloud with lighter spiral curls
function puffCloud(cx, cy, w, h, opt = {}) {
  const n = opt.n || Math.max(4, Math.round(w / (h * 0.85)));
  const lobes = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const r = h * (0.42 + 0.5 * Math.sin(Math.PI * (0.12 + 0.76 * t))) * R(0.85, 1.12);
    lobes.push([cx - w / 2 + w * t + R(-6, 6), cy - r * 0.45 + R(-4, 4), r]);
  }
  if (opt.extra) opt.extra.forEach(e => lobes.push(e));
  const base = `<ellipse cx="${f(cx)}" cy="${f(cy + h * 0.18)}" rx="${f(w / 2 + h * 0.3)}" ry="${f(h * 0.42)}"/>`;
  const circ = lobes.map(l => `<circle cx="${f(l[0])}" cy="${f(l[1])}" r="${f(l[2])}"/>`).join('');
  const fill = opt.fill || 'url(#cloudIri)';
  let g = `<g>`;
  g += `<g fill="none" stroke="${opt.edge || GOLD}" stroke-width="${opt.sw || 2.6}">${base}${circ}</g>`;
  g += `<g fill="${fill}" filter="url(#gouache)">${base}${circ}</g>`;
  g += `<g fill="url(#puffLo)">${base}</g>`;
  g += `<g fill="url(#puffHi)">${circ}</g>`;
  // spiral curls in a lighter tone on the lobes + a few gold-leaf flecks
  let sp = '', fk = '';
  lobes.forEach((l, i) => {
    if (i % (opt.every || 1)) return;
    const [x, y, r] = l, k = r * 0.34, s = i % 2 ? 1 : -1;
    const x0 = x + s * r * 0.15, y0 = y + r * 0.42;
    sp += `M${f(x0 - s * k * 1.9)},${f(y0 + k * 0.6)} C${f(x0 - s * k * 1.2)},${f(y0 - k * 0.9)} ${f(x0 + s * k * 1.1)},${f(y0 - k * 1.1)} ${f(x0 + s * k)},${f(y0 + k * 0.1)} C${f(x0 + s * k * 0.9)},${f(y0 + k * 0.8)} ${f(x0 - s * k * 0.1)},${f(y0 + k * 0.8)} ${f(x0 - s * k * 0.15)},${f(y0 + k * 0.15)} C${f(x0 - s * k * 0.2)},${f(y0 - k * 0.3)} ${f(x0 + s * k * 0.35)},${f(y0 - k * 0.25)} ${f(x0 + s * k * 0.3)},${f(y0 + k * 0.1)} `;
    for (let j = 0; j < (opt.flecks === 0 ? 0 : 2); j++) { const a = R(0, 6.28), rr = R(0.2, 0.75) * r, fx = x + Math.cos(a) * rr, fy = y + Math.sin(a) * rr * 0.7, q = R(1, 2.6); fk += `<path d="M${f(fx)},${f(fy - q)} L${f(fx + q * 1.3)},${f(fy)} L${f(fx + q * 0.2)},${f(fy + q)} L${f(fx - q)},${f(fy + q * 0.1)}Z" fill="${GOLD}" opacity="0.85"/>`; }
  });
  g += `<path d="${sp}" fill="none" stroke="#fffaf0" stroke-width="${opt.cw || 2.4}" stroke-linecap="round" opacity="0.95"/>`;
  g += `<path d="${sp}" fill="none" stroke="${GOLD}" stroke-width="0.8" stroke-linecap="round" opacity="0.55" transform="translate(0.8,1.2)"/>`;
  g += fk + `</g>`;
  return g;
}
function pastelGlass(x0, x1, y0, y1, clip, colAt, step = 36) {
  const sites = [];
  for (let y = y0; y < y1; y += step * 0.85) for (let x = x0 - 10; x < x1 + 20; x += step) sites.push([x + R(-12, 12), y + R(-10, 10)]);
  let base = '', glowS = '', lead = '', hl = '';
  voronoi(sites, [x0 - 30, y0 - 30, x1 + 30, y1 + 30]).forEach(pg => {
    const c = centroid(pg), col = colAt(c[0], c[1]);
    const d = poly(pg) + 'Z';
    base += `<path d="${d}" fill="${hsl(...col)}"/>`;
    glowS += `<path d="${poly(shrink(pg, 0.58))}Z" fill="${hsl(col[0], col[1] - 10, Math.min(97, col[2] + 9))}"/>`;
    lead += `<path d="${d}" fill="none" stroke="${LEADC}" stroke-width="${f(R(1.4, 2))}" stroke-linejoin="round"/>`;
    hl += `<path d="${d}" fill="none" stroke="#fffbee" stroke-width="0.6" stroke-linejoin="round" opacity="0.7"/>`;
  });
  return `<g clip-path="url(#${clip})"><g filter="url(#gouache)">${base}</g><g filter="url(#glow)" opacity="0.9">${glowS}</g>${lead}${hl}</g>`;
}
const skyCol = (x, y) => {
  const t = Math.min(1, Math.max(0, (y - 100) / 620));
  const stops = [[0, 232, 62, 80], [0.35, 250, 58, 84], [0.62, 272, 52, 88], [0.85, 338, 64, 88], [1, 20, 70, 90]];
  let i = 0; while (i < stops.length - 2 && t > stops[i + 1][0]) i++;
  const a = stops[i], b = stops[i + 1], u = (t - a[0]) / (b[0] - a[0]);
  let h = lerp(a[1], b[1], u), s = lerp(a[2], b[2], u), l = lerp(a[3], b[3], u) + R(-3, 3);
  if (rnd() < 0.1) { h = 165; s = 38; l = 86; }
  else if (rnd() < 0.08) { h = 48; s = 80; l = 88; }
  return [h, s, l];
};
function kongming(x, y, s, o = 1) {
  let g = `<g opacity="${o}"><circle cx="${f(x)}" cy="${f(y)}" r="${f(60 * s)}" fill="url(#warmBloom)"/>`;
  g += `<g transform="translate(${f(x)},${f(y)}) scale(${s})">`;
  g += `<path d="M-22,-30 C-24,-40 -14,-46 0,-46 C14,-46 24,-40 22,-30 L16,26 C10,30 -10,30 -16,26 Z" fill="url(#kongG)" stroke="${GOLDD}" stroke-width="1.4" stroke-linejoin="round"/>`;
  g += `<path d="M-8,-45 C-9,-20 -7,10 -6,28 M8,-45 C9,-20 7,10 6,28 M-21,-12 C-8,-9 8,-9 21,-12" fill="none" stroke="#e0a95a" stroke-width="0.9" opacity="0.7"/>`;
  g += `<ellipse cx="0" cy="27" rx="16" ry="3.5" fill="#f3c46e" stroke="${GOLDD}" stroke-width="1.2"/><ellipse cx="0" cy="22" rx="5" ry="7" fill="#fffbe0" filter="url(#glowS)"/>`;
  g += `<ellipse cx="-8" cy="-26" rx="6" ry="10" fill="#fffef4" opacity="0.6" filter="url(#glowS)"/></g></g>`;
  return g;
}
function pavilion(x, y, s) {
  let g = `<g transform="translate(${x},${y}) scale(${s})">`;
  g += `<ellipse cx="0" cy="-60" rx="150" ry="100" fill="url(#warmBloom)" opacity="0.8"/>`;
  // island cloud (behind)
  g += puffCloud(0, 22, 220, 44, { n: 6, sw: 2.2, cw: 2 });
  // wisps hanging from the island
  g += `<path d="M-60,40 C-64,64 -48,72 -54,92 M10,44 C14,70 -2,84 6,104 M70,38 C74,58 62,66 66,82" fill="none" stroke="#fffaf0" stroke-width="3" stroke-linecap="round" opacity="0.8"/>`;
  // white-jade terrace + slender railing
  g += `<path d="M-92,2 L92,2 L84,14 L-84,14 Z" fill="#f4faf7" stroke="${GOLDD}" stroke-width="1.3"/>`;
  g += `<rect x="-86" y="-6" width="172" height="8" fill="#e6f4ef" stroke="${GOLDD}" stroke-width="1.1"/>`;
  let rail = ''; for (let i = -8; i <= 8; i++) rail += `M${i * 10},-6 L${i * 10},-18 `;
  g += `<path d="${rail} M-82,-18 L82,-18 M-82,-12 L82,-12" stroke="${GOLD}" stroke-width="1.1"/>`;
  // hall with glowing moon-gate and lattice
  g += `<rect x="-60" y="-80" width="120" height="62" fill="#fbf6ec" stroke="${GOLDD}" stroke-width="1.2"/>`;
  g += `<circle cx="0" cy="-48" r="24" fill="#fff0b8" opacity="0.9" filter="url(#glowS)"/><circle cx="0" cy="-48" r="19" fill="#ffe7a0" stroke="${GOLDD}" stroke-width="1.2"/><circle cx="0" cy="-48" r="12" fill="#fffbe8" opacity="0.8" filter="url(#glowS)"/>`;
  for (const k of [-1, 1]) {
    g += `<rect x="${k > 0 ? 28 : -50}" y="-70" width="22" height="42" rx="11" fill="#ffe9ae" stroke="${GOLDD}" stroke-width="1"/>`;
    g += `<path d="M${k * 39},-70 L${k * 39},-28 M${k * 39 - 11},-56 L${k * 39 + 11},-56 M${k * 39 - 11},-42 L${k * 39 + 11},-42" stroke="${GOLD}" stroke-width="0.8"/>`;
  }
  for (const px of [-60, -22, 22, 60]) g += `<rect x="${px - 3}" y="-80" width="6" height="62" fill="#fffdf8" stroke="${GOLDD}" stroke-width="0.9"/>`;
  g += `<rect x="-68" y="-90" width="136" height="10" fill="#a9dcd6" stroke="${GOLDD}" stroke-width="1.1"/>`;
  let br = ''; for (let i = -6; i <= 6; i++) br += `<circle cx="${i * 10.5}" cy="-85" r="2" fill="${GOLDL}" stroke="${GOLDD}" stroke-width="0.6"/>`;
  g += br;
  // jade roof with upswept eaves
  const roof = 'M-118,-98 C-96,-90 -70,-98 -52,-128 L52,-128 C70,-98 96,-90 118,-98 C112,-90 102,-86 88,-88 L-88,-88 C-102,-86 -112,-90 -118,-98 Z';
  g += `<path d="${roof}" fill="url(#roofG)" stroke="${GOLDD}" stroke-width="1.4" stroke-linejoin="round"/>`;
  let tl = ''; for (let i = -9; i <= 9; i++) { const xt = i * 5.6, xb = i * 9.6; tl += `M${f(xt)},-127 C${f(xt + (xb - xt) * 0.3)},-110 ${f(xb * 0.95)},-96 ${f(xb)},-89 `; }
  g += `<path d="${tl}" fill="none" stroke="#6fb0ac" stroke-width="0.8" opacity="0.8"/>`;
  g += `<path d="M-118,-98 C-96,-90 -70,-98 -52,-128 M118,-98 C96,-90 70,-98 52,-128" fill="none" stroke="#fffbee" stroke-width="1.2" opacity="0.8"/>`;
  g += `<path d="M-58,-128 L58,-128 L54,-134 L-54,-134 Z" fill="url(#goldG)" stroke="${GOLDD}" stroke-width="1"/>`;
  g += `<path d="M-54,-134 C-62,-140 -66,-134 -62,-130 M54,-134 C62,-140 66,-134 62,-130" fill="none" stroke="${GOLD}" stroke-width="1.6" stroke-linecap="round"/>`;
  g += `<path d="M0,-134 L0,-146" stroke="${GOLD}" stroke-width="1.6"/><circle cx="0" cy="-151" r="9" fill="#fff3c0" opacity="0.8" filter="url(#glowS)"/><circle cx="0" cy="-151" r="5" fill="url(#fruitG)" stroke="${GOLDD}" stroke-width="0.9"/>`;
  for (const k of [-1, 1]) g += `<path d="M${k * 118},-98 L${k * 118},-90" stroke="${GOLD}" stroke-width="0.9"/><circle cx="${k * 118}" cy="-87" r="2.8" fill="url(#goldG)" stroke="${GOLDD}" stroke-width="0.6"/>`;
  // front puffs hugging the terrace
  g += puffCloud(-70, 20, 80, 22, { n: 3, sw: 2, cw: 1.6, flecks: 0 }) + puffCloud(78, 22, 70, 20, { n: 3, sw: 2, cw: 1.6, flecks: 0 });
  g += `</g>`;
  return g;
}
function ruyi(x, y, s, rot, fill, trim) {
  const d = 'M0,-12 C-30,-12 -42,10 -35,27 C-28,41 -13,39 -10,30 C-18,48 -8,62 0,72 C8,62 18,48 10,30 C13,39 28,41 35,27 C42,10 30,-12 0,-12 Z';
  return `<g transform="translate(${x},${y}) rotate(${rot}) scale(${s})"><path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${f(1.6 / s)}" stroke-linejoin="round"/><path d="${d}" transform="translate(0,8) scale(0.72)" fill="none" stroke="${trim}" stroke-width="${f(1.4 / s)}"/><circle cx="0" cy="22" r="3.5" fill="${trim}" stroke="${INK}" stroke-width="0.8"/></g>`;
}
function crab(x, y, s, rot) {
  let g = `<g transform="translate(${x},${y}) rotate(${rot}) scale(${s})">`;
  g += `<path d="M-9,4 L-15,9 M-7,6 L-11,12 M9,4 L15,9 M7,6 L11,12" stroke="#a8322a" stroke-width="2" stroke-linecap="round"/>`;
  g += `<path d="M-8,-4 C-12,-10 -16,-12 -18,-17 M8,-4 C12,-10 16,-12 18,-17" stroke="#c9392c" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  g += `<path d="M-22,-20 C-24,-26 -18,-28 -16,-22 L-19,-19 L-15,-17 C-16,-13 -21,-14 -22,-20Z M22,-20 C24,-26 18,-28 16,-22 L19,-19 L15,-17 C16,-13 21,-14 22,-20Z" fill="#e8483a" stroke="${INK}" stroke-width="1.2"/>`;
  g += `<ellipse cx="0" cy="0" rx="13" ry="9" fill="#e8483a" stroke="${INK}" stroke-width="1.4"/><ellipse cx="-3" cy="-3" rx="5" ry="2.6" fill="#ff9a84" opacity="0.8"/>`;
  g += `<circle cx="-4" cy="-8" r="2" fill="#fff" stroke="${INK}" stroke-width="0.8"/><circle cx="4" cy="-8" r="2" fill="#fff" stroke="${INK}" stroke-width="0.8"/><circle cx="-4" cy="-8" r="0.9" fill="${INK}"/><circle cx="4" cy="-8" r="0.9" fill="${INK}"/>`;
  return g + `</g>`;
}
function bow(x, y, s, rot) {
  let g = `<g transform="translate(${x},${y}) rotate(${rot}) scale(${s})">`;
  g += `<path d="M-2,2 C-6,14 -10,26 -6,36 L0,30 L4,36 C6,24 4,12 2,2Z" fill="#8fb2dc" stroke="${INK}" stroke-width="1.3"/>`;
  g += `<path d="M0,0 C-10,-14 -26,-12 -24,0 C-22,10 -10,8 0,0Z M0,0 C10,-14 26,-12 24,0 C22,10 10,8 0,0Z" fill="#b3cdef" stroke="${INK}" stroke-width="1.4"/>`;
  g += `<path d="M-4,-2 C-10,-6 -16,-6 -18,-2 M4,-2 C10,-6 16,-6 18,-2" fill="none" stroke="#7d9fcc" stroke-width="1"/><ellipse cx="0" cy="0" rx="4.5" ry="5" fill="#9fbfe3" stroke="${INK}" stroke-width="1.3"/>`;
  return g + `</g>`;
}
const BONE = `<path d="M-8,-2.2 L8,-2.2 A3.2,3.2 0 1 1 10.5,1 A3.2,3.2 0 1 1 8,4.2 L-8,4.2 A3.2,3.2 0 1 1 -10.5,1 A3.2,3.2 0 1 1 -8,-2.2 Z" fill="#fdf8ea" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`;
function pibo(d, w0, w1, fill) {
  const n = 120;
  let s = `<path d="${ribbon(d, w0, w1, 4, n)}" fill="${fill}" stroke="${GOLD}" stroke-width="1.2" stroke-linejoin="round"/>`;
  const [c] = offsets(d, w0, w1, 4, n, [0.25]);
  s += `<path d="${poly(c.slice(4, n - 4))}" fill="none" stroke="#fffdf6" stroke-width="1.2" opacity="0.8"/>`;
  const [e] = offsets(d, w0, w1, 4, n, [-0.7]);
  s += `<path d="${poly(e.slice(4, n - 4))}" fill="none" stroke="${GOLD}" stroke-width="0.7" stroke-dasharray="1 3" opacity="0.9"/>`;
  return s;
}
const HAIR = 'url(#hairG)', PINK = 'url(#pinkHairG)';
const pinkOpt = { lo: '#d98aa3', hi: '#fff3f6' };
function goldLine(d, w = 3.2) {
  return `<path d="${d}" fill="none" stroke="#a9803a" stroke-width="${w + 1.6}" opacity="0.35"/><path d="${d}" fill="none" stroke="url(#goldH)" stroke-width="${w}"/><path d="${d}" fill="none" stroke="#fff4cc" stroke-width="0.8" opacity="0.9"/>`;
}
const GX = 800;
const G1 = { cy: 418, r: 306, ro: 328 }, G2 = { cy: 408, r: 280, ro: 293 }, G3 = { cy: 398, r: 252, ro: 263 };
const gateY = (g, x) => g.cy - Math.sqrt(Math.max(0, g.r * g.r - (x - GX) * (x - GX)));
const area = pg => { let s = 0; for (let i = 0; i < pg.length; i++) { const a = pg[i], b = pg[(i + 1) % pg.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; };
function octagon(x0, y0, x1, y1, c) { return [[x0 + c, y0], [x1 - c, y0], [x1, y0 + c], [x1, y1 - c], [x1 - c, y1], [x0 + c, y1], [x0, y1 - c], [x0, y0 + c]]; }
const OCT = octagon(92, 176, 318, 650, 62);
// 扇形窗 (fan window) — nod to 与谁同坐轩
const FAN = { cx: 1368, cy: 566, R: 356, r: 128, h: 29 };
function fanPts(F, grow = 0) {
  const P = [], n = 28;
  for (let i = 0; i <= n; i++) { const a = (-90 - F.h + 2 * F.h * i / n) * Math.PI / 180; P.push([F.cx + Math.cos(a) * (F.R + grow), F.cy + Math.sin(a) * (F.R + grow)]); }
  for (let i = n; i >= 0; i--) { const a = (-90 - F.h + 2 * F.h * i / n) * Math.PI / 180; P.push([F.cx + Math.cos(a) * (F.r - grow), F.cy + Math.sin(a) * (F.r - grow)]); }
  return P;
}
const FANP = fanPts(FAN);
function iceCrack(pg, minA) {
  const cells = [], stack = [pg];
  while (stack.length) {
    const p = stack.pop(), A = area(p);
    if (A < minA) { cells.push(p); continue; }
    let xs = p.map(q => q[0]), ys = p.map(q => q[1]);
    const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
    let done = false;
    for (let t = 0; t < 10 && !done; t++) {
      const c = centroid(p), k = Math.sqrt(A) * 0.22;
      const px = c[0] + R(-k, k), py = c[1] + R(-k, k);
      const ang = (h > w ? Math.PI / 2 : 0) + R(-0.75, 0.75);
      const nx = Math.cos(ang), ny = Math.sin(ang), cc = nx * px + ny * py;
      const a1 = clipHalf(p, nx, ny, cc), a2 = clipHalf(p, -nx, -ny, -cc);
      if (a1.length < 3 || a2.length < 3) continue;
      const r1 = area(a1) / A; if (r1 < 0.25 || r1 > 0.75) continue;
      stack.push(a1, a2); done = true;
    }
    if (!done) cells.push(p);
  }
  return cells;
}
const wire = (d, w = 1.4) => `<path d="${d}" fill="none" stroke="${WIRE}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${WIREH}" stroke-width="${f(w * 0.35)}" stroke-linecap="round" opacity="0.85"/>`;
function wireSpiral(x, y, r, dir = 1, turns = 1.5, a0 = 0) {
  const P = [], N = 40;
  for (let i = 0; i <= N; i++) { const t = i / N, a = a0 + dir * t * turns * Math.PI * 2, rr = r * (1 - 0.85 * t); P.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
  return poly(P);
}
function scrollCurl(x, y, ang, len, dir) {
  const P = [[x, y]]; let a = ang, px = x, py = y; const N = 46;
  for (let i = 1; i <= N; i++) { const t = i / N; a += dir * (0.012 + 0.3 * t * t); const st = len / N * 1.6 * (1 - 0.72 * t); px += Math.cos(a) * st; py += Math.sin(a) * st; P.push([px, py]); }
  return poly(P);
}
// cloisonné blob: union of circles with a gold wire only on the outer contour
function cloiBlob(circles, fill, sw = 3.2, extra = '') {
  const c = circles.map(q => `<circle cx="${f(q[0])}" cy="${f(q[1])}" r="${f(q[2])}"/>`).join('') + extra;
  return `<g fill="none" stroke="${WIRE}" stroke-width="${sw}">${c}</g><g fill="${fill}" stroke="none">${c}</g>`;
}
function cloiCloud(x, y, s, fill, fl = 1) {
  const C = [[0, 0, 15], [-17, 5, 11], [16, 4, 12], [-5, -11, 10], [9, -12, 9]].map(q => [x + q[0] * s * fl, y + q[1] * s, q[2] * s]);
  const tail = `<path d="M${f(x + 24 * s * fl)},${f(y + 9 * s)} C${f(x + 42 * s * fl)},${f(y + 14 * s)} ${f(x + 58 * s * fl)},${f(y + 8 * s)} ${f(x + 64 * s * fl)},${f(y - 3 * s)} C${f(x + 56 * s * fl)},${f(y + 3 * s)} ${f(x + 42 * s * fl)},${f(y + 5 * s)} ${f(x + 24 * s * fl)},${f(y - 1 * s)} Z"/>`;
  let g = cloiBlob(C, fill, 3, tail);
  g += wire(wireSpiral(C[0][0], C[0][1] + 2 * s, 9 * s, fl, 1.25, 3.4), 1.2);
  g += wire(wireSpiral(C[1][0], C[1][1] + 1 * s, 6 * s, -fl, 1.1, 0.4), 1.1);
  g += wire(wireSpiral(C[2][0], C[2][1] + 1 * s, 6.5 * s, fl, 1.1, 3.0), 1.1);
  return g;
}
function coping(x0, x1, top) {
  let g = `<rect x="${x0 - 12}" y="${top + 32}" width="${x1 - x0 + 24}" height="12" fill="#a99ccc" opacity="0.28" filter="url(#glowS)"/>`;
  g += `<path d="M${x0 - 6},${top + 9} L${x1 + 6},${top + 9} L${x1 + 13},${top + 27} L${x0 - 13},${top + 27} Z" fill="url(#tileG)" stroke="${GOLDD}" stroke-width="1"/>`;
  let rib = '', rh = '';
  for (let x = x0 - 2; x <= x1 + 2; x += 11) { const dx = (x - (x0 + x1) / 2) * 0.012; rib += `M${f(x)},${top + 10} L${f(x + dx)},${top + 26} `; rh += `M${f(x + 3)},${top + 11} L${f(x + 3 + dx)},${top + 25} `; }
  g += `<path d="${rib}" stroke="#7db3ab" stroke-width="1.2"/><path d="${rh}" stroke="#f5fffb" stroke-width="0.9" opacity="0.8"/>`;
  let wd = '', ds = '';
  for (let x = x0 - 8; x <= x1 + 8; x += 11) { wd += `<circle cx="${x}" cy="${top + 29}" r="4.1"/>`; ds += `M${x + 1.5},${top + 28} L${x + 9.5},${top + 28} L${x + 5.5},${top + 35} Z `; }
  g += `<path d="${ds}" fill="#cbe9e2" stroke="${GOLDD}" stroke-width="0.7"/><g fill="#bfe3dc" stroke="${GOLDD}" stroke-width="0.8">${wd}</g>`;
  g += `<rect x="${x0 - 10}" y="${top}" width="${x1 - x0 + 20}" height="10" rx="2" fill="#9ccfc6" stroke="${GOLDD}" stroke-width="1"/><path d="M${x0 - 6},${top + 5} L${x1 + 6},${top + 5}" stroke="${GOLDL}" stroke-width="0.9"/>`;
  for (const [x, s] of [[x0 - 10, -1], [x1 + 10, 1]]) {
    const d = `M${x - s * 2},${top + 2} C${x + s * 8},${top + 1} ${x + s * 12},${top - 6} ${x + s * 8},${top - 12}`;
    g += `<path d="${d}" fill="none" stroke="${GOLDD}" stroke-width="6.4" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#9ccfc6" stroke-width="4.2" stroke-linecap="round"/>`;
  }
  return g;
}
function latticeWindow(pts, clip, scene, seedMin, hole = '') {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const box = [[Math.min(...xs) - 4, Math.min(...ys) - 4], [Math.max(...xs) + 4, Math.min(...ys) - 4], [Math.max(...xs) + 4, Math.max(...ys) + 4], [Math.min(...xs) - 4, Math.max(...ys) + 4]];
  const cells = iceCrack(box, seedMin);
  let g = `<clipPath id="${clip}L"><path d="${poly(pts)}Z ${hole}" clip-rule="evenodd"/></clipPath><g clip-path="url(#${clip})">` + scene + `<g clip-path="url(#${clip}L)">`;
  const hues = [[45, 80, 93], [330, 70, 93], [190, 55, 91], [265, 60, 93], [150, 45, 91]];
  let tint = '', glowC = '', lines = '';
  cells.forEach((pg, i) => {
    const h = hues[Math.floor(R(0, 5))];
    tint += `<path d="${poly(pg)}Z" fill="${hsl(h[0], h[1], h[2])}" opacity="${f(R(0.16, 0.3))}"/>`;
    glowC += `<path d="${poly(shrink(pg, 0.62))}Z" fill="#fffdf6"/>`;
    lines += poly(pg) + 'Z ';
  });
  g += tint + `<g filter="url(#glow)" opacity="0.16">${glowC}</g>`;
  g += `<path d="${lines}" fill="none" stroke="#9c8462" stroke-width="7.5" stroke-linejoin="miter" opacity="0.28"/>`;
  g += `<path d="${lines}" fill="none" stroke="#f3e8d4" stroke-width="5" stroke-linejoin="miter"/>`;
  g += `<path d="${lines}" fill="none" stroke="#dcb866" stroke-width="1" stroke-linejoin="miter" opacity="0.95"/>`;
  g += `</g>`;
  if (hole) g += `<path d="${hole}" fill="none" stroke="#9c8462" stroke-width="9" opacity="0.28"/><path d="${hole}" fill="none" stroke="#f3e8d4" stroke-width="6.5"/><path d="${hole}" fill="none" stroke="url(#goldH)" stroke-width="1.8"/>`;
  g += `</g>`;
  // stone moulding frame
  const d = poly(pts) + 'Z';
  g += `<path d="${d}" fill="none" stroke="#bdb4cf" stroke-width="22" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#f2eff6" stroke-width="17" stroke-linejoin="round"/>`;
  g += `<path d="${d}" fill="none" stroke="#fffdf8" stroke-width="2" stroke-linejoin="round" opacity="0.9" transform="translate(-1,-1)"/>`;
  g += `<path d="${d}" fill="none" stroke="url(#goldH)" stroke-width="2.4" stroke-linejoin="round"/>`;
  return g;
}
function bamboo(x, y0, y1, w) {
  let g = `<path d="M${x - w / 2},${y0} L${x - w / 2 + 2},${y1} L${x + w / 2 + 2},${y1} L${x + w / 2},${y0} Z" fill="url(#bambooG)" stroke="#6f9c90" stroke-width="1.1"/>`;
  for (let y = y0 - 50; y > y1 + 10; y -= 58) g += `<path d="M${x - w / 2 - 1},${y} C${x - 2},${y + 3} ${x + 2},${y + 3} ${x + w / 2 + 3},${y}" fill="none" stroke="${GOLD}" stroke-width="1.6"/><path d="M${x - w / 2},${y + 3} L${x + w / 2 + 1},${y + 3}" stroke="#8fbcae" stroke-width="0.8"/>`;
  return g;
}
function bLeaf(x, y, len, ang) {
  const L = len, W = len * 0.16;
  return `<g transform="translate(${f(x)},${f(y)}) rotate(${f(ang)})"><path d="M0,0 C${f(L * 0.3)},${f(-W)} ${f(L * 0.7)},${f(-W * 0.8)} ${f(L)},0 C${f(L * 0.7)},${f(W * 0.5)} ${f(L * 0.3)},${f(W * 0.9)} 0,0 Z" fill="#6fa89a" stroke="#43756c" stroke-width="0.9"/><path d="M${f(L * 0.08)},0 L${f(L * 0.85)},${f(-W * 0.2)}" stroke="#bfe5d8" stroke-width="0.9" opacity="0.8"/></g>`;
}
function leafSpray(x, y, dir, n) {
  let g = `<path d="M${x},${y} C${x + dir * 20},${y - 6} ${x + dir * 40},${y - 4} ${x + dir * 60},${y + 6}" fill="none" stroke="#6f9c90" stroke-width="1.6"/>`;
  for (let i = 0; i < n; i++) { const t = i / n, px = x + dir * 60 * t, py = y + 6 * t * t - 4 * t; g += bLeaf(px, py, R(34, 46), (dir > 0 ? 0 : 180) + R(-10, 60) * (i % 2 ? 1 : -0.6) + 20); }
  return g;
}
// ---------------- liyue additions ----------------
const f1 = f;
const WIRE = '#c99e48', WIREH = '#fff1c2';
// run fn with a fixed rng seed so ornaments built per pose come out identical every pose (no random jitter)
function seeded(s, fn) { const keep = seed; seed = s; try { return fn(); } finally { seed = keep; } }
const circD = (x, y, r) => `M${f(x - r)},${f(y)} a${f(r)},${f(r)} 0 1 0 ${f(2 * r)},0 a${f(r)},${f(r)} 0 1 0 ${f(-2 * r)},0 Z`;
const ellD = (x, y, rx, ry) => `M${f(x - rx)},${f(y)} a${f(rx)},${f(ry)} 0 1 0 ${f(2 * rx)},0 a${f(rx)},${f(ry)} 0 1 0 ${f(-2 * rx)},0 Z`;
const tf = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${(+s).toFixed(4)})` : ''}`;
function pathLen(d) { tmp.setAttribute('d', d); return tmp.getTotalLength(); }
function pathPt(d, l) { tmp.setAttribute('d', d); const p = tmp.getPointAtLength(l); return [p.x, p.y]; }
function pathBox(d) { tmp.setAttribute('d', d); const b = tmp.getBBox(); return [b.x, b.y, b.width, b.height]; }
// split "M..M.." into absolute-M subpaths (dash animation must run per subpath)
const subpaths = (d) => d.trim().split(/(?=M)/).map(s => s.trim()).filter(s => s.length > 2);
let UID = 0;

// ---------- Cloi: a cloisonné plate that makes itself ----------
// piece(d, fill)  : an enamel cell, gold wire on its outline (wire:false for enamel only)
// wire(d)         : a free gold wire (spirals, veins, scroll curls)
// deco(svg)       : finished ornament that fades in with the enamel (things too fussy to wire one by one)
// render(p)       : p 0..1. Wires lay down in key order over win.wire, enamel floods in over win.fill,
//                   each cell spreading out from its centre. Returns { svg, tip } (tip = where the wire is being laid now).
class Cloi {
  constructor(o = {}) { this.items = []; this.win = { wire: o.wire || [0, 0.6], fill: o.fill || [0.3, 1] }; this.col = o.col || WIRE; this.hi = o.hi || WIREH; this.ready = false; this.flood = o.flood ?? true; }
  piece(d, fill, o = {}) { this.items.push({ d, fill, wire: o.wire !== false, w: o.w ?? 1.6, key: o.key, fkey: o.fkey, op: o.op ?? 1, filter: o.filter, rule: o.rule, flood: o.flood, ws: o.ws }); return this; }
  wire(d, o = {}) { this.items.push({ d, fill: null, wire: true, w: o.w ?? 1.2, key: o.key, op: 1, ws: o.ws }); return this; }
  deco(svg, o = {}) { this.items.push({ svg, fkey: o.fkey, wire: false, op: 1, fadeOnly: true }); return this; }
  prep() {
    if (this.ready) return; this.ready = true;
    const W_ = [], F_ = [];
    this.items.forEach((it, i) => {
      it.i = i;
      if (it.d && (it.fill || it.fadeOnly)) { const b = pathBox(it.d); it.box = b; it.cx = b[0] + b[2] / 2; it.cy = b[1] + b[3] / 2; it.rr = Math.hypot(b[2], b[3]) / 2 + 2; }
      if (it.fill || it.fadeOnly) F_.push(it);
      if (it.wire && it.d) { it.sub = subpaths(it.d).map(s => ({ d: s, L: pathLen(s) })); W_.push(it); }
    });
    const k = (it, j) => it.key ?? j;
    W_.sort((a, b) => k(a, a.i) - k(b, b.i));
    let tot = 0; for (const it of W_) for (const s of it.sub) { s.a = tot; tot += Math.max(6, s.L); s.b = tot; }
    this.wireTotal = tot || 1; this.W = W_;
    F_.sort((a, b) => (a.fkey ?? k(a, a.i)) - (b.fkey ?? k(b, b.i)));
    F_.forEach((it, j) => { const u = F_.length > 1 ? j / (F_.length - 1) : 0; it.fa = u * 0.72; it.fb = it.fa + 0.28; });
    this.F = F_;
  }
  wireStr(d, w, q, L, it) {
    const dash = q >= 1 ? '' : ` stroke-dasharray="${f(L + 2)} ${f(L + 2)}" stroke-dashoffset="${f((L + 2) * (1 - q))}"`;
    return `<path d="${d}" fill="none" stroke="${this.col}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round"${dash}/>` +
      `<path d="${d}" fill="none" stroke="${this.hi}" stroke-width="${f(w * 0.35)}" stroke-linecap="round" opacity="0.85"${dash}/>`;
  }
  render(p) {
    this.prep();
    if (p >= 1 && this.done) return { svg: this.done, tip: null, act: 0 };
    const [wa, wb] = this.win.wire, [fa, fb] = this.win.fill;
    const wp = clamp((p - wa) / (wb - wa)) * this.wireTotal, fp = clamp((p - fa) / (fb - fa));
    let o = '', tip = null;
    for (const it of this.items) {
      if (it.fadeOnly) { const e = ease((fp - it.fa) / (it.fb - it.fa)); if (e > 0) o += e < 1 ? `<g opacity="${e.toFixed(3)}">${it.svg}</g>` : it.svg; continue; }
      if (it.fill) {
        const e = ease((fp - it.fa) / (it.fb - it.fa));
        if (e > 0) {
          const attrs = `${it.filter ? ` filter="url(#${it.filter})"` : ''}${it.rule ? ` fill-rule="${it.rule}"` : ''}`;
          if (e >= 1 || !this.flood || it.flood === false) o += `<path d="${it.d}" fill="${it.fill}" opacity="${(it.op * Math.min(1, e * 1.4)).toFixed(3)}"${attrs}/>`;
          else { const id = 'fl' + (UID++); o += `<clipPath id="${id}"><circle cx="${f(it.cx)}" cy="${f(it.cy)}" r="${f(it.rr * (0.15 + 0.85 * e))}"/></clipPath><path d="${it.d}" fill="${it.fill}" opacity="${(it.op * Math.min(1, e * 1.6)).toFixed(3)}" clip-path="url(#${id})"${attrs}/>`; }
        }
      }
      if (it.wire && it.sub) {
        for (const s of it.sub) {
          if (wp <= s.a) continue;
          const q = clamp((wp - s.a) / (s.b - s.a));
          o += this.wireStr(s.d, it.w, q, s.L, it);
          if (q < 1) { const pt = pathPt(s.d, s.L * q); tip = pt; }
        }
      }
    }
    if (p >= 1) this.done = o;
    return { svg: o, tip, act: tip ? 1 : 0 };
  }
}
// the spark that lays the wire: a bright bead of molten gold with a little flare
function spark(x, y, t) {
  const r = 5 + 1.5 * Math.sin(t * 40);
  return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 3.2)}" fill="#fff3c0" opacity="0.55" filter="url(#glowS)"/>` + twinkle(x, y, r * 2.2, '#fffdf2', 0.95) + `<circle cx="${f(x)}" cy="${f(y)}" r="2.2" fill="#fff"/>`;
}

// ---------- pond pieces ----------
function pad(x, y, rx, rot = 0) {
  const ry = rx * 0.34, a1 = -0.28, a2 = 0.28;
  let s = `<g transform="translate(${x},${y}) rotate(${rot})"><path d="M0,0 L${f(Math.cos(a2) * rx)},${f(Math.sin(a2) * ry)} A${rx},${f(ry)} 0 1 1 ${f(Math.cos(a1) * rx)},${f(Math.sin(a1) * ry)} Z" fill="url(#padG)" stroke="${GOLDD}" stroke-width="1.1"/>`;
  let v = ''; for (let k = 0; k < 7; k++) { const a = 0.6 + k * 0.8; v += `M0,0 L${f(Math.cos(a) * rx * 0.85)},${f(Math.sin(a) * ry * 0.85)} `; }
  s += `<path d="${v}" stroke="#8fc3ab" stroke-width="0.8"/><ellipse cx="${f(-rx * 0.3)}" cy="${f(-ry * 0.3)}" rx="${f(rx * 0.35)}" ry="${f(ry * 0.3)}" fill="#f4fff8" opacity="0.5"/></g>`;
  return s;
}
function lotus(x, y, s) {
  let o = `<g transform="translate(${x},${y}) scale(${s})"><path d="M0,0 C1,14 -1,26 0,40" stroke="#8fbfa8" stroke-width="2.2" fill="none"/>`;
  o += `<circle cx="0" cy="-10" r="26" fill="#ffe7ee" opacity="0.5" filter="url(#glowS)"/>`;
  for (const [a, h] of [[-58, 22], [58, 22], [-30, 28], [30, 28], [0, 30]]) o += `<path d="M0,0 C-9,-${h * 0.4} -8,-${h * 0.85} 0,-${h} C8,-${h * 0.85} 9,-${h * 0.4} 0,0 Z" transform="rotate(${a})" fill="url(#lotusG)" stroke="${GOLDD}" stroke-width="0.9"/>`;
  o += `<ellipse cx="0" cy="-4" rx="5" ry="3" fill="#f6d67a" stroke="${GOLDD}" stroke-width="0.6"/></g>`;
  return o;
}
function koi(x, y, rot, s = 1) {
  let o = `<g transform="translate(${x},${y}) rotate(${rot}) scale(${s})">`;
  o += `<path d="M-22,0 C-30,-7 -36,-9 -40,-6 C-36,-2 -36,2 -40,6 C-36,9 -30,7 -22,0 Z" fill="#fde9dc" stroke="${GOLDD}" stroke-width="0.8"/>`;
  o += `<path d="M20,0 C18,-7 6,-9 -6,-7 C-16,-5 -22,-2 -24,0 C-22,2 -16,5 -6,7 C6,9 18,7 20,0 Z" fill="#fffaf2" stroke="${GOLDD}" stroke-width="0.9"/>`;
  o += `<path d="M4,-7 C8,-3 6,2 0,3 C-4,1 -2,-5 4,-7 Z M-10,2 C-8,5 -12,6 -15,4 Z" fill="#f7a58e" opacity="0.85"/><path d="M0,-7 C-2,-12 -8,-12 -10,-8 M0,7 C-2,12 -8,12 -10,8" fill="none" stroke="${GOLDD}" stroke-width="0.8"/></g>`;
  return o;
}

// ---------------- the pair, seen from behind (origin = centre of the seat line) ----------------
function couple() {
  const FX = 0, FY = 0, FS = 1;
  let g = `<g transform="translate(${FX},${FY}) scale(${FS})">`;
  g += `<ellipse cx="60" cy="-190" rx="300" ry="230" fill="#8f86d6" opacity="0.24" filter="url(#bloom)"/>`;
  // floating 披帛 ends (behind)
  g += pibo('M120,-128 C190,-150 256,-160 298,-150 C336,-142 352,-170 384,-182 C410,-192 420,-212 446,-220', 18, 7, 'url(#piboL4)');
  g += pibo('M-126,-100 C-160,-70 -178,-30 -214,-8 C-244,10 -290,-4 -322,14', 11, 3, 'url(#piboL4)');
  g += pibo('M92,-58 C150,-38 214,-42 266,-68 C302,-86 332,-62 364,-80 C396,-98 408,-128 446,-134', 17, 7, 'url(#piboM4)');

  // ---- right figure's body (leaning in toward the left figure) ----
  const pb = 'M132,-214 C110,-210 92,-200 84,-184 C74,-150 70,-100 64,-50 C60,-24 54,-8 46,0 C120,10 220,10 290,0 C282,-8 274,-20 268,-40 C262,-80 258,-130 246,-162 C238,-182 206,-204 170,-214 Z';
  g += `<path d="${pb}" fill="url(#robeP)" filter="url(#gouache)"/><path d="${pb}" fill="none" stroke="${INK}" stroke-width="1.7" stroke-linejoin="round"/>`;
  g += `<path d="M96,-150 C92,-100 84,-56 70,-10 M236,-150 C246,-100 252,-56 268,-12 M170,-60 C172,-40 170,-20 168,0" fill="none" stroke="#d997a8" stroke-width="1.2" opacity="0.85"/>`;
  g += `<path d="M70,-92 C130,-78 210,-78 262,-94 L264,-76 C210,-60 130,-60 68,-74 Z" fill="#c9ecdf" stroke="${INK}" stroke-width="1.5"/><path d="M69,-84 C130,-70 210,-70 263,-86" fill="none" stroke="${GOLD}" stroke-width="1.5"/>`;
  g += `<path d="M128,-216 C140,-206 160,-206 174,-214 L172,-202 C160,-194 140,-194 130,-202 Z" fill="#fffaf2" stroke="${INK}" stroke-width="1.3"/>`;
  // her loose back hair (down from the nape)
  const pOpt = { lo: '#d98aa3', hi: '#fff3f6' };
  g += strand('M128,-232 C114,-202 126,-172 114,-146 C106,-128 118,-114 130,-120 C138,-124 134,-134 128,-132', 10, 20, 'url(#pinkB)', pOpt);
  g += strand('M146,-230 C152,-198 164,-176 160,-148 C156,-124 170,-110 184,-118 C192,-124 188,-134 182,-132', 11, 22, 'url(#pinkB)', pOpt);
  g += strand('M160,-236 C186,-216 204,-198 210,-170 C216,-144 234,-138 242,-150 C246,-158 240,-164 234,-160', 9, 18, 'url(#pinkB)', pOpt);

  // ---- left figure's robe (pastel 汉服) ----
  const ob = 'M-20,-224 C-52,-220 -84,-212 -100,-192 C-116,-170 -120,-130 -126,-92 C-132,-54 -142,-24 -170,0 C-120,12 120,12 170,0 C142,-24 132,-54 126,-92 C120,-130 116,-170 100,-192 C84,-212 52,-220 20,-224 Z';
  g += `<path d="${ob}" fill="url(#robeO)" filter="url(#gouache)"/><path d="${ob}" fill="none" stroke="${INK}" stroke-width="1.7" stroke-linejoin="round"/>`;
  g += `<path d="M-100,-186 C-112,-150 -118,-110 -132,-58 M-84,-150 C-92,-110 -96,-70 -112,-20 M100,-186 C112,-150 118,-110 132,-58 M84,-150 C92,-110 96,-70 112,-20 M-30,-60 C-32,-36 -34,-18 -40,4 M30,-60 C32,-36 34,-18 40,4" fill="none" stroke="#86aebf" stroke-width="1.2" opacity="0.8"/>`;
  g += `<path d="M-142,-24 C-150,-12 -160,-4 -170,0 L-128,6 C-132,-4 -136,-12 -142,-24Z M142,-24 C150,-12 160,-4 170,0 L128,6 C132,-4 136,-12 142,-24Z" fill="#fffaf2" stroke="${INK}" stroke-width="1.3"/>`;
  // 披帛 across her back
  g += pibo('M-124,-150 C-80,-122 -30,-116 20,-126 C60,-134 96,-146 126,-150', 13, 11, 'url(#piboL4)');
  // waist sash with a knot and tails
  g += `<path d="M-122,-86 C-60,-74 60,-74 122,-86 L123,-68 C60,-56 -60,-56 -123,-68 Z" fill="#d7ccf2" stroke="${INK}" stroke-width="1.5"/><path d="M-122,-77 C-60,-65 60,-65 122,-77" fill="none" stroke="${GOLD}" stroke-width="1.6"/>`;
  g += `<path d="M8,-68 C4,-48 10,-30 2,-8 L12,-6 C18,-28 14,-48 18,-68 Z M18,-68 C26,-50 34,-36 30,-16 L40,-18 C42,-38 34,-52 26,-68 Z" fill="#e3dbf6" stroke="${INK}" stroke-width="1.2"/>`;
  g += `<ellipse cx="16" cy="-72" rx="9" ry="7" fill="#d7ccf2" stroke="${INK}" stroke-width="1.3"/>`;
  // 云肩 ruyi collar pieces
  g += ruyi(60, -208, 0.8, -28, 'url(#collarG)', GOLD) + ruyi(92, -186, 0.66, -56, 'url(#collarG)', GOLD) + ruyi(-60, -208, 0.8, 28, 'url(#collarG)', GOLD);
  // nape + back collar
  g += `<path d="M-14,-240 L-16,-222 C-6,-216 6,-216 16,-222 L14,-240 Z" fill="#fbe7dc" stroke="${INK}" stroke-width="1.3"/>`;
  g += `<path d="M-26,-228 C-12,-218 12,-218 26,-228 L28,-218 C14,-208 -14,-208 -28,-218 Z" fill="#fffaf2" stroke="${INK}" stroke-width="1.3"/>`;

  // ---- left figure's hair: gathered at her left nape, pouring to her LEFT in S-curves ----
  const HL = 'url(#hairL)', HD = 'url(#hairD)';
  // lifted locks in the breeze (behind the rest)
  g += strand('M-44,-252 C-76,-286 -110,-296 -146,-300 C-184,-304 -204,-334 -240,-330 C-272,-326 -276,-292 -254,-286 C-238,-282 -232,-300 -246,-304', 9, 16, HL);
  g += strand('M-50,-244 C-96,-256 -130,-236 -168,-248 C-204,-260 -232,-248 -246,-224 C-258,-202 -238,-188 -224,-198 C-214,-206 -222,-218 -232,-212', 11, 19, HL);
  g += strand('M-40,-248 C-70,-264 -100,-252 -130,-264 C-156,-274 -170,-260 -162,-250', 5, 9, HL, { ks: [-0.2, 0.2] });
  // base mass
  g += strand('M-40,-240 C-110,-226 -170,-180 -184,-120 C-196,-66 -168,-40 -190,-6 C-202,12 -236,14 -250,-4 C-262,-20 -250,-40 -232,-34', 22, 66, HD);
  g += strand('M-48,-234 C-120,-230 -176,-200 -200,-150 C-222,-100 -206,-66 -228,-36 C-244,-14 -272,-16 -278,-36 C-282,-52 -266,-60 -256,-50', 12, 30, HL);
  g += strand('M-42,-236 C-92,-214 -130,-176 -130,-128 C-130,-84 -100,-60 -118,-22 C-132,6 -176,10 -186,-12 C-194,-30 -176,-44 -162,-34', 16, 40, HL);
  g += strand('M-34,-232 C-66,-196 -76,-156 -62,-116 C-50,-80 -74,-48 -80,-20 C-84,0 -62,8 -56,-4', 12, 26, HL);
  g += strand('M-38,-236 C-96,-196 -104,-150 -90,-108 C-80,-76 -100,-50 -96,-30', 8, 16, HL, { ks: [-0.3, 0.3] });

  // ---- head (back view), tilted a little toward her companion ----
  let h = `<g transform="rotate(7,0,-236)">`;
  for (const k of [-1, 1]) {
    h += `<path d="M${k * 46},-318 C${k * 52},-344 ${k * 56},-366 ${k * 54},-390 C${k * 38},-378 ${k * 24},-364 ${k * 10},-350 Z" fill="#efcf86" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
    h += `<path d="M${k * 50},-346 C${k * 52},-362 ${k * 52},-374 ${k * 51},-382 C${k * 45},-376 ${k * 40},-370 ${k * 35},-364" fill="none" stroke="#f7bcc6" stroke-width="2.4" stroke-linecap="round"/>`;
  }
  h += `<path d="M0,-356 C34,-356 56,-328 56,-294 C56,-264 44,-246 26,-238 C14,-233 -14,-233 -30,-238 C-46,-246 -56,-264 -56,-294 C-56,-328 -34,-356 0,-356 Z" fill="${HL}" stroke="${INK}" stroke-width="1.7"/>`;
  let hs = '';
  for (let i = 0; i <= 10; i++) {
    const s = i / 10, cx = 8, cy = -346;
    const mid = [lerp(-52, 50, s), lerp(-290, -262, s)];
    hs += `M${cx},${cy} C${f(cx + lerp(-44, 50, s))},${f(cy + lerp(4, 14, s))} ${f(lerp(-56, 58, s))},${f(lerp(-322, -300, s))} ${f(mid[0])},${f(mid[1])} C${f(lerp(-50, 34, s))},${f(lerp(-262, -236, s))} ${f(lerp(-44, -10, s))},-240 -40,-240 `;
  }
  h += `<path d="${hs}" fill="none" stroke="#c39450" stroke-width="1" opacity="0.85"/>`;
  h += `<path d="M-36,-326 C-18,-340 16,-342 38,-326" fill="none" stroke="#fff8de" stroke-width="3.2" opacity="0.85" stroke-linecap="round"/>`;
  h += `<path d="M44,-300 C46,-284 40,-266 30,-254" fill="none" stroke="#fff8de" stroke-width="2" opacity="0.6" stroke-linecap="round"/>`;
  h += `<circle cx="8" cy="-346" r="1.6" fill="#c39450"/>`;
  h += crab(34, -316, 1.15, 24);
  h += `</g>`;
  g += h;
  // a lock slipping over her right shoulder
  g += strand('M40,-262 C58,-238 72,-216 90,-202 C104,-190 102,-172 90,-170', 6, 12, HL, { ks: [-0.2, 0.25] });
  // bow at the nape tie + ribbon tails carrying the bone pendant
  g += `<path d="M-38,-232 C-30,-206 -40,-186 -30,-160" fill="none" stroke="${INK}" stroke-width="5.4" stroke-linecap="round"/><path d="M-38,-232 C-30,-206 -40,-186 -30,-160" fill="none" stroke="#8fb2dc" stroke-width="3.4" stroke-linecap="round"/>`;
  g += `<path d="M-46,-232 C-58,-208 -54,-190 -64,-170" fill="none" stroke="${INK}" stroke-width="5.4" stroke-linecap="round"/><path d="M-46,-232 C-58,-208 -54,-190 -64,-170" fill="none" stroke="#8fb2dc" stroke-width="3.4" stroke-linecap="round"/>`;
  g += `<circle cx="-30" cy="-156" r="3.2" fill="none" stroke="${GOLD}" stroke-width="1.8"/><g transform="translate(-30,-144) rotate(-8) scale(1.35)">${BONE}</g>`;
  g += bow(-42, -240, 1.15, -24);
  g += osmCluster(-18, -254, 5, 1.4, 6);

  // ---- fluffy golden belled tail, curled around her companion's waist ----
  {
    const d = 'M104,-34 C150,-44 206,-72 240,-96 C272,-118 276,-154 252,-164 C232,-172 220,-152 234,-142';
    const P = sample(d, 90);
    const rad = i => 13 + 6 * Math.sin(i / 90 * Math.PI * 0.9) - 3 * (i / 90);
    let st = '', hi = '';
    for (let i = 0; i <= 90; i += 2) { const [x, y] = P[i], r = rad(i) * (1 + 0.1 * Math.sin(i * 1.7)); st += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}"/>`; }
    const tip = P[90];
    g += `<g fill="none" stroke="${INK}" stroke-width="2.8">${st}<circle cx="${f(tip[0])}" cy="${f(tip[1])}" r="11"/></g>`;
    g += `<g fill="#f0cc82">${st}</g><circle cx="${f(tip[0])}" cy="${f(tip[1])}" r="11" fill="#fff3d6"/>`;
    const [T1] = offsets(d, 14, 10, 4, 90, [0.35]); hi += poly(T1.slice(6, 80));
    for (let i = 8; i <= 84; i += 7) { const [x, y] = P[i], q = P[i + 1], a = Math.atan2(q[1] - y, q[0] - x), r = rad(i); for (const sd of [-1, 1]) { const ex = x + Math.cos(a + sd * 1.3) * (r + 3), ey = y + Math.sin(a + sd * 1.3) * (r + 3); hi += ` M${f(x + Math.cos(a + sd * 1.5) * r * 0.6)},${f(y + Math.sin(a + sd * 1.5) * r * 0.6)} Q${f(ex - Math.cos(a) * 4)},${f(ey - Math.sin(a) * 4)} ${f(ex + Math.cos(a) * 3)},${f(ey + Math.sin(a) * 3)}`; } }
    g += `<path d="${hi}" fill="none" stroke="#fff4d0" stroke-width="1.6" stroke-linecap="round" opacity="0.85"/>`;
    for (let i = 80; i <= 90; i += 5) { const [x, y] = P[i]; g += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad(i) * 0.7)}" fill="#fff3d6" opacity="0.8"/>`; }
    const q = P[26], q2 = P[28], ang = Math.atan2(q2[1] - q[1], q2[0] - q[0]) * 180 / Math.PI + 90;
    g += `<g transform="translate(${f(q[0])},${f(q[1])}) rotate(${f(ang)})"><rect x="-16" y="-4.5" width="32" height="9" rx="3" fill="#9fbfe3" stroke="${INK}" stroke-width="1.4"/></g>`;
    g += `<g transform="translate(${f(q[0] + 2)},${f(q[1] + 15)})"><circle r="10" fill="#fff3c0" opacity="0.6" filter="url(#glowS)"/><circle r="7" fill="url(#goldG)" stroke="${INK}" stroke-width="1.4"/><path d="M-5,1 L5,1" stroke="${INK}" stroke-width="1"/><circle cy="3.5" r="1.4" fill="${INK}"/><circle cx="-2.5" cy="-3" r="1.8" fill="#fffae0"/></g>`;
  }

  // ---- right figure's head, resting on the left figure's shoulder ----
  g += strand('M166,-282 C178,-256 176,-232 186,-212 C194,-196 188,-182 178,-186', 7, 13, 'url(#pinkB)', pOpt);
  g += strand('M84,-246 C80,-226 86,-210 80,-192 C76,-178 86,-170 94,-176', 7, 12, 'url(#pinkB)', pOpt);
  {
    let c = `<g transform="translate(118,-272) rotate(-26)">`;
    c += `<ellipse cx="0" cy="0" rx="64" ry="66" fill="#fff" opacity="0.18" filter="url(#glowS)"/>`;
    // skull: soft rounded back of the head, hair flowing down from the crown
    const sk = 'M0,-52 C32,-52 52,-30 51,0 C52,22 44,40 30,52 C22,60 12,58 4,63 C-6,58 -16,63 -26,54 C-42,44 -52,24 -51,0 C-52,-30 -32,-52 0,-52 Z';
    c += `<path d="M-48,4 C-58,20 -56,34 -64,46 M48,8 C58,24 56,38 64,48" fill="none" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/><path d="M-48,4 C-58,20 -56,34 -64,46 M48,8 C58,24 56,38 64,48" fill="none" stroke="#f6c1d0" stroke-width="2" stroke-linecap="round"/>`;
    c += `<path d="${sk}" fill="url(#pinkL)" stroke="${INK}" stroke-width="1.7" stroke-linejoin="round"/>`;
    let ps = '', band = '';
    for (let i = 0; i <= 12; i++) {
      const s = -1 + 2 * i / 12, w = Math.sin(i * 2.1) * 3;
      const d = `M${f(s * 12)},-34 C${f(s * 44 + w)},-36 ${f(s * 56 + w)},12 ${f(s * 30 + w)},${f(56 + Math.abs(s) * -6)} `;
      if (i % 3 === 1) band += d; else ps += d;
    }
    c += `<path d="${band}" fill="none" stroke="#fff0f4" stroke-width="5.5" opacity="0.55" stroke-linecap="round"/>`;
    c += `<path d="${ps}" fill="none" stroke="#d98aa3" stroke-width="1" opacity="0.9"/>`;
    c += `<path d="M-40,-14 C-26,-28 12,-32 38,-20" fill="none" stroke="#fff4f7" stroke-width="3.4" opacity="0.8" stroke-linecap="round"/>`;
    // small bun at the crown
    c += `<circle cx="0" cy="-42" r="20" fill="url(#pinkL)" stroke="${INK}" stroke-width="1.6"/>`;
    c += `<path d="M-18,-46 C-8,-36 8,-36 18,-44 M-16,-54 C-6,-46 8,-46 16,-54 M-10,-60 C-2,-56 6,-56 10,-60" fill="none" stroke="#d98aa3" stroke-width="1.1"/><path d="M-12,-56 C-6,-60 4,-61 10,-58" fill="none" stroke="#fff4f7" stroke-width="2.4" opacity="0.8" stroke-linecap="round"/>`;
    c += `<path d="M16,-34 C26,-24 24,-12 30,-4" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M16,-34 C26,-24 24,-12 30,-4" fill="none" stroke="#f6c1d0" stroke-width="1.6" stroke-linecap="round"/>`;
    // gold hairpin + osmanthus sprig at the bun
    c += `<path d="M-28,-34 L28,-58" stroke="url(#goldH)" stroke-width="2.4" stroke-linecap="round"/><circle cx="-29" cy="-33" r="3.2" fill="#fffaf0" stroke="${GOLDD}" stroke-width="0.8"/>`;
    c += leaf(16, -54, 18, -20) + leaf(18, -50, 16, 40) + osmCluster(20, -56, 7, 1.6, 7) + osmCluster(6, -62, 4, 1.4, 4);
    c += `</g>`;
    g += c;
  }
  return g;
}
