// code-to-cinema · awakening lib: Victorian stop-motion paper theatre. DOM helpers, palette, and the kit:
// hair strands, frills, gears, bones, intertitle cards, the ghost, the hand, the standing figure, paper, skyline, ruins, rain.
const NS = 'http://www.w3.org/2000/svg';
const root = document.getElementById('root');
const PI = Math.PI, TAU = PI * 2, D2R = PI / 180;
const mk = (seed) => { let s = seed | 0; return () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
let rnd = mk(1);
const R = (a, b) => a + (b - a) * rnd();
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) { if (k === 'text') e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); } if (parent) parent.appendChild(e); return e; };
const g = (parent, attrs = {}) => el('g', attrs, parent);
const frag = (parent, s, attrs = {}) => { const t = g(parent, attrs); t.innerHTML = s; return t; };
const key = (q, ks) => { let v = ks[0][1]; for (const [k, val] of ks) if (q >= k) v = val; return v; };
const angDiff = (t, a) => Math.atan2(Math.sin(t - a), Math.cos(t - a));
const f1 = (v) => v.toFixed(1);
const INK = '#2b2226', WINE = '#6e2330', LILAC = '#8a7f93', PLUM = '#5e5566', SMOKE = '#6b5a4e', IVORY = '#f3ede2';

// ================= shared drawing =================
function strand(parent, o) {
  const pts = [];
  let x = o.x, y = o.y, a = o.a, k = R(-0.012, 0.012);
  const n = Math.round(o.len / 5), tgt = o.tgt ?? PI / 2;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([x, y, t]);
    k += R(-0.005, 0.005); k = clamp(k, -0.03, 0.03);
    const curl = t > o.curlAt ? o.dir * 0.2 * Math.pow((t - o.curlAt) / (1 - o.curlAt), 1.1) : 0;
    const wave = (o.wave || 0) * Math.sin(i * 0.09 + o.phase);
    a += k + wave + curl + (t < o.curlAt ? o.g * angDiff(tgt, a) : 0);
    const step = 5 * (1 - 0.35 * Math.max(0, t - o.curlAt));
    x += Math.cos(a) * step; y += Math.sin(a) * step;
  }
  const frac = o.frac ?? 1;
  if (frac <= 0.001) return;
  const P = pts.slice(0, Math.max(3, Math.ceil(pts.length * frac)));
  const L = [], Rr = [], m1 = P.length - 1;
  for (let i = 0; i < P.length; i++) {
    const p = P[i], q = P[Math.min(i + 1, m1)], r = P[Math.max(i - 1, 0)];
    const dx = q[0] - r[0], dy = q[1] - r[1], m = Math.hypot(dx, dy) || 1;
    const w = o.w * Math.pow(1 - i / m1, 0.8) + 0.35;
    L.push([p[0] - dy / m * w, p[1] + dx / m * w]);
    Rr.push([p[0] + dy / m * w, p[1] - dx / m * w]);
  }
  const d = 'M' + L.map(p => f1(p[0]) + ' ' + f1(p[1])).join(' L') + ' L' + Rr.reverse().map(p => f1(p[0]) + ' ' + f1(p[1])).join(' L') + ' Z';
  el('path', { d, fill: o.fill, stroke: '#231c20', 'stroke-width': o.sw, 'stroke-opacity': 0.8, 'stroke-linejoin': 'round' }, parent);
  if (o.w > 3 && P.length > 8) {
    const c = 'M' + P.slice(2, -4).map(p => f1(p[0] + 0.5) + ' ' + f1(p[1] + 0.3)).join(' L');
    el('path', { d: c, fill: 'none', stroke: '#9a90a2', 'stroke-width': 0.35, opacity: 0.55 }, parent);
  }
}
const hairFill = () => ['#faf6ee', '#f6f1e8', '#f1ece9', '#f8f3e8', '#eee8ec'][Math.floor(rnd() * 5)];
const vine = (o) => ({ wave: R(0.025, 0.05), phase: R(0, 6.28), ...o });

function frill(parent, cx, y, w, n, depth, fill) {
  const x0 = cx - w / 2, sw = w / n;
  let d = `M${x0} ${y}`;
  for (let i = 0; i < n; i++) d += ` Q${f1(x0 + sw * (i + 0.5))} ${f1(y + depth + R(-2, 3))} ${f1(x0 + sw * (i + 1))} ${f1(y + R(-1.5, 1.5))}`;
  d += ` L${cx + w / 2 - 6} ${y - depth * 0.9} Q${cx} ${y - depth * 1.4} ${x0 + 6} ${y - depth * 0.9} Z`;
  el('path', { d, fill, stroke: INK, 'stroke-width': 0.9 }, parent);
  for (let i = 1; i < n; i++) el('path', { d: `M${f1(x0 + sw * i)} ${y} L${f1(x0 + sw * i + R(-2, 2))} ${f1(y - depth * 0.8)}`, stroke: LILAC, 'stroke-width': 0.6, opacity: 0.8 }, parent);
}

function gearPath(cx, cy, r, n, ang) {
  const ri = r * 0.8; let d = '';
  for (let i = 0; i < n; i++) {
    const a0 = ang * D2R + i * TAU / n, tw = PI / n;
    const pts = [[a0 - tw * 0.55, ri], [a0 - tw * 0.32, r], [a0 + tw * 0.32, r], [a0 + tw * 0.55, ri]];
    for (const [a, rr] of pts) d += (d ? ' L' : 'M') + f1(cx + Math.cos(a) * rr) + ' ' + f1(cy + Math.sin(a) * rr);
  }
  return d + ' Z';
}
function gear(parent, cx, cy, r, n, ang, fill, spokes = 5, stroke = INK) {
  const G = g(parent);
  el('path', { d: gearPath(cx, cy, r, n, ang), fill, stroke, 'stroke-width': Math.max(0.6, r * 0.04), 'stroke-linejoin': 'round' }, G);
  el('circle', { cx, cy, r: r * 0.62, fill: 'none', stroke, 'stroke-width': Math.max(0.5, r * 0.03), opacity: 0.8 }, G);
  for (let i = 0; i < spokes; i++) {
    const a = ang * D2R + i * TAU / spokes;
    el('line', { x1: f1(cx + Math.cos(a) * r * 0.2), y1: f1(cy + Math.sin(a) * r * 0.2), x2: f1(cx + Math.cos(a) * r * 0.6), y2: f1(cy + Math.sin(a) * r * 0.6), stroke, 'stroke-width': Math.max(0.6, r * 0.07), 'stroke-linecap': 'round' }, G);
  }
  el('circle', { cx, cy, r: r * 0.2, fill: WINE, stroke, 'stroke-width': Math.max(0.5, r * 0.03) }, G);
  return G;
}

function bone(parent, x, y, len, rot, s = 1, fill = '#e9e2d4') {
  const h = len / 2, k = 3.2 * s, w = 2.2 * s;
  frag(parent, `<path d="M${-h} ${-w} L${h} ${-w} M${-h} ${w} L${h} ${w}" stroke="none"/>
    <path d="M${-h + k * 0.5} ${-w} L${h - k * 0.5} ${-w} A${k} ${k} 0 1 1 ${h + k * 0.6} 0 A${k} ${k} 0 1 1 ${h - k * 0.5} ${w} L${-h + k * 0.5} ${w} A${k} ${k} 0 1 1 ${-h - k * 0.6} 0 A${k} ${k} 0 1 1 ${-h + k * 0.5} ${-w} Z" fill="${fill}" stroke="${INK}" stroke-width="${0.8 * s}"/>`,
    { transform: `translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)})` });
}

// caption card (intertitle)
function card(parent, x, y, en, zh, nShow, rot = 0, sizes = {}) {
  const fs = sizes.en || 46, fz = sizes.zh || 23, pad = 30;
  const C = g(parent, { transform: `translate(${x} ${y}) rotate(${rot})` });
  const bg = el('rect', { x: 0, y: 0, width: 10, height: 10, fill: IVORY, stroke: INK, 'stroke-width': 1.5, filter: 'url(#pencil)' }, C);
  const inner = el('rect', { x: 7, y: 7, width: 10, height: 10, fill: 'none', stroke: WINE, 'stroke-width': 0.7, opacity: 0.8 }, C);
  let yy = pad + fs * 0.78, maxw = 0;
  const ts = [];
  en.forEach((line, i) => {
    const t = el('text', { class: 'serif', x: pad, y: yy, 'font-size': fs, 'font-style': 'italic', 'font-weight': 600, fill: INK, text: line, opacity: i < nShow.en ? 1 : 0 }, C);
    ts.push(t); yy += fs * 1.12;
  });
  let ruleY = yy - fs * 0.62;
  if (zh && zh.length) {
    yy += 10;
    zh.forEach((line) => {
      const t = el('text', { class: 'zh', x: pad, y: yy, 'font-size': fz, 'letter-spacing': 3, 'font-weight': 500, fill: WINE, text: line, opacity: nShow.zh ? 1 : 0 }, C);
      ts.push(t); yy += fz * 1.5;
    });
  }
  for (const t of ts) maxw = Math.max(maxw, t.getComputedTextLength());
  const Wd = maxw + pad * 2, Ht = yy - (zh && zh.length ? fz * 1.5 : fs * 1.12) + pad + 6;
  bg.setAttribute('width', f1(Wd)); bg.setAttribute('height', f1(Ht));
  inner.setAttribute('width', f1(Wd - 14)); inner.setAttribute('height', f1(Ht - 14));
  if (zh && zh.length) el('line', { x1: pad, x2: pad + 60, y1: f1(ruleY), y2: f1(ruleY), stroke: INK, 'stroke-width': 0.8, opacity: nShow.zh ? 0.7 : 0 }, C);
  // corner ornaments
  for (const [cx, cy] of [[0, 0], [Wd, 0], [0, Ht], [Wd, Ht]]) el('circle', { cx: f1(cx), cy: f1(cy), r: 3.2, fill: WINE, stroke: INK, 'stroke-width': 0.8 }, C);
  return C;
}

// ================= the ghost (poster figure, poster coordinates) =================
function eyes(parent, o) {
  const e = o.e;
  const E = [
    { A: [996, 343], B: [948, 350], u1: [985, 352, 329], u2: [962, 354, 330], l1: [965, 354], l2: [985, 352], c: [970, 345] },
    { A: [1024, 339], B: [1071, 347], u1: [1036, 348, 325], u2: [1058, 351, 327], l1: [1055, 351], l2: [1036, 348], c: [1047, 341] },
  ];
  E.forEach((q, i) => {
    const u1 = [q.u1[0], q.u1[1] + (q.u1[2] - q.u1[1]) * e], u2 = [q.u2[0], q.u2[1] + (q.u2[2] - q.u2[1]) * e];
    const up = `M${q.A[0]} ${q.A[1]} C${u1[0]} ${f1(u1[1])} ${u2[0]} ${f1(u2[1])} ${q.B[0]} ${q.B[1]}`;
    const shape = up + ` C${q.l1[0]} ${q.l1[1]} ${q.l2[0]} ${q.l2[1]} ${q.A[0]} ${q.A[1]} Z`;
    const low = `M${q.B[0]} ${q.B[1]} C${q.l1[0]} ${q.l1[1]} ${q.l2[0]} ${q.l2[1]} ${q.A[0]} ${q.A[1]}`;
    if (e > 0.05) {
      const id = 'eyeclip' + i;
      const cp = el('clipPath', { id }, parent); el('path', { d: shape }, cp);
      el('path', { d: shape, fill: '#f2ede6' }, parent);
      const G = g(parent, { 'clip-path': `url(#${id})` });
      const cx = q.c[0] + o.look[0], cy = q.c[1] + o.look[1];
      el('circle', { cx, cy, r: 6.6, fill: PLUM }, G);
      if (o.focus) el('circle', { cx, cy, r: 6.6, fill: 'none', stroke: WINE, 'stroke-width': 1.2 }, G);
      for (let k = 0; k < 10; k++) { const a = k * TAU / 10; el('line', { x1: f1(cx + Math.cos(a) * (o.pupil + 0.6)), y1: f1(cy + Math.sin(a) * (o.pupil + 0.6)), x2: f1(cx + Math.cos(a) * 6.2), y2: f1(cy + Math.sin(a) * 6.2), stroke: '#3e3744', 'stroke-width': 0.35 }, G); }
      el('circle', { cx, cy, r: o.pupil, fill: '#161113' }, G);
      if (o.focus) el('circle', { cx: cx - 2.2, cy: cy - 2.2, r: 1.1, fill: '#fffaf0' }, G);
      const top = Math.min(u1[1], u2[1]);
      el('rect', { x: q.B[0] - 30, y: f1(top - 3), width: 90, height: 6, fill: LILAC, opacity: 0.4 }, G);
    }
    el('path', { d: up, fill: 'none', stroke: '#231c20', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, parent);
    const cr = 4 + 5 * e;
    el('path', { d: `M${q.A[0]} ${q.A[1] - cr} C${u1[0]} ${f1(u1[1] - cr)} ${u2[0]} ${f1(u2[1] - cr)} ${q.B[0]} ${q.B[1] - cr + 1}`, fill: 'none', stroke: '#3a3034', 'stroke-width': 0.8, opacity: 0.7 }, parent);
    el('path', { d: low, fill: 'none', stroke: '#3a3034', 'stroke-width': 0.7, opacity: e > 0.05 ? 0.6 : 0.2 }, parent);
    if (e <= 0.05) {
      for (let k = 1; k < 7; k++) {
        const t = k / 7, mt = 1 - t;
        const bx = mt * mt * mt * q.A[0] + 3 * mt * mt * t * u1[0] + 3 * mt * t * t * u2[0] + t * t * t * q.B[0];
        const by = mt * mt * mt * q.A[1] + 3 * mt * mt * t * u1[1] + 3 * mt * t * t * u2[1] + t * t * t * q.B[1];
        el('line', { x1: f1(bx), y1: f1(by), x2: f1(bx + (i ? 1 : -1) * 1.5), y2: f1(by + 4.5), stroke: '#231c20', 'stroke-width': 0.8 }, parent);
      }
    }
  });
}

function pendant(P, o) {
  const st = o.stage || 0;
  el('path', { d: 'M1012 575 C1040 640 1085 700 1118 742', fill: 'none', stroke: '#a9a6a8', 'stroke-width': 1.4, 'stroke-dasharray': '3 2' }, P);
  if (st < 3) {
    if (st >= 2) el('path', { d: gearPath(1012, 566, 22, 14, 8), fill: 'url(#silver)', stroke: INK, 'stroke-width': 0.8 }, P);
    el('circle', { cx: 1012, cy: 566, r: 17, fill: 'url(#silver)', stroke: INK, 'stroke-width': 0.9 }, P);
    if (st < 2) {
      el('circle', { cx: 1012, cy: 566, r: 11, fill: WINE, stroke: INK, 'stroke-width': 0.8 }, P);
      el('circle', { cx: 1008, cy: 562, r: 3, fill: '#e9c9c9', opacity: 0.7 }, P);
      if (st === 1) el('path', { d: 'M1004 556 L1010 564 L1007 569 L1014 576 M1010 564 L1018 561 M1007 569 L1001 572', fill: 'none', stroke: '#140e10', 'stroke-width': 1.1 }, P);
    } else {
      el('circle', { cx: 1012, cy: 566, r: 11, fill: '#1b1417' }, P);
      gear(P, 1012, 566, 8, 8, 20, 'url(#brass)', 4);
      el('path', { d: 'M1009 555 A11 11 0 0 0 1009 577 Z', fill: WINE, stroke: INK, 'stroke-width': 0.8, transform: 'translate(-6 0)' }, P);
      el('path', { d: 'M1015 555 A11 11 0 0 1 1015 577 Z', fill: WINE, stroke: INK, 'stroke-width': 0.8, transform: 'translate(6 0)' }, P);
    }
    frag(P, `<g fill="none" stroke="#5d5a5f" stroke-width="0.8"><path d="M995 566 C990 556 996 548 1004 550"/><path d="M1029 566 C1034 556 1028 548 1020 550"/></g>`);
    bone(P, 1012 + (st === 2 ? 5 : 0), 598, 22, 90 + (st === 2 ? -24 : 0), 1, '#e6e2dc');
  } else {
    el('circle', { cx: 1012, cy: 590, r: 90, fill: 'url(#glowG)', opacity: 0.75 }, P);
    const heart = 'M1012 556 C1000 534 964 536 962 566 C960 600 990 626 1012 652 C1034 626 1064 600 1062 566 C1060 536 1024 534 1012 556 Z';
    // pipes (aorta)
    frag(P, `<g fill="none" stroke-linecap="round">
      <path d="M998 556 C996 540 992 530 982 522" stroke="${INK}" stroke-width="10"/><path d="M998 556 C996 540 992 530 982 522" stroke="url(#brass)" stroke-width="7.5"/>
      <path d="M1026 556 C1028 540 1032 530 1034 519" stroke="${INK}" stroke-width="9"/><path d="M1026 556 C1028 540 1032 530 1034 519" stroke="url(#brass)" stroke-width="6.5"/>
      <path d="M1012 552 L1012 530" stroke="${INK}" stroke-width="6"/><path d="M1012 552 L1012 530" stroke="#8a7f93" stroke-width="3.8"/></g>
      <rect x="975" y="515" width="14" height="5" transform="rotate(-38 982 518)" fill="url(#brass)" stroke="${INK}" stroke-width="0.8"/>
      <rect x="1027" y="513" width="14" height="5" transform="rotate(8 1034 516)" fill="url(#brass)" stroke="${INK}" stroke-width="0.8"/>`);
    el('path', { d: heart, fill: WINE, stroke: INK, 'stroke-width': 1.3 }, P);
    el('path', { d: heart, fill: 'url(#hatch)', opacity: 0.55 }, P);
    el('path', { d: 'M972 572 C976 552 996 548 1004 560', fill: 'none', stroke: '#c79ea0', 'stroke-width': 1.2, opacity: 0.6 }, P);
    for (let i = 0; i < 14; i++) { const a = i / 14; const x = 1012 + Math.sin(a * TAU) * 44, y = 590 - Math.cos(a * TAU) * 40; if (y > 560 && y < 632) el('circle', { cx: f1(x), cy: f1(y), r: 1.4, fill: 'url(#silver)', stroke: INK, 'stroke-width': 0.4 }, P); }
    gear(P, 1012, 590, 25, 12, o.gear || 0, 'url(#silver)', 5);
    gear(P, 1043, 614, 12, 8, -(o.gear || 0) * 25 / 12 + 11, 'url(#brass)', 4);
    gear(P, 983, 612, 10, 7, -(o.gear || 0) * 25 / 10 + 5, 'url(#brass)', 3);
    bone(P, 1012, 664, 22, 90 + Math.sin((o.gear || 0) * D2R * 2) * 14, 1, '#e6e2dc');
  }
  for (const pf of (o.puffs || [])) {
    const G = g(P, { filter: 'url(#steam)', opacity: f1(pf.op) });
    for (const [dx, dy, rr] of pf.blobs) el('circle', { cx: f1(pf.x + dx * pf.r), cy: f1(pf.y + dy * pf.r), r: f1(pf.r * rr), fill: '#f6f1e8', stroke: '#5e5566', 'stroke-width': 0.9 }, G);
  }
}

function ghost(parent, o) {
  const G = g(parent, { transform: o.tf });
  if (o.wash !== false) frag(G, `<g filter="url(#wash)">
    <path d="M790 820 C740 640 760 420 820 280 C880 140 960 96 1030 100 C1130 106 1220 190 1250 320 C1285 470 1260 660 1230 830 C1180 880 850 890 790 820 Z" fill="url(#washG)" opacity="0.9" stroke="#3e3744" stroke-width="7" stroke-opacity="0.45"/>
    <path d="M820 300 C860 220 900 190 950 175 C900 240 870 330 860 420 Z" fill="#6b5a4e" opacity="0.55"/>
    <path d="M1180 260 C1230 330 1245 420 1238 520 C1215 430 1190 350 1150 300 Z" fill="#6b5a4e" opacity="0.5"/></g>
    <rect x="760" y="100" width="500" height="760" fill="url(#dots)" opacity="0.12"/>`);
  const tilt = `rotate(${o.tilt} 1010 470)`;
  const HB = g(G, { transform: tilt });
  if (o.halo) frag(HB, `<circle cx="1010" cy="322" r="176" fill="none" stroke="#f3ede2" stroke-width="3" stroke-dasharray="1.5 6" opacity="0.9"/>
    <circle cx="1010" cy="322" r="188" fill="none" stroke="#2b2226" stroke-width="0.7" opacity="0.6"/>
    <circle cx="1010" cy="322" r="196" fill="none" stroke="#6e2330" stroke-width="0.5" stroke-dasharray="14 4 2 4" opacity="0.7"/>`);
  const back = g(HB, { filter: 'url(#pencil)' });
  frag(G, `<g filter="url(#pencil)">
    <path id="coat" d="M860 600 C900 560 950 552 985 558 L1040 558 C1078 552 1132 560 1172 602 C1232 654 1262 770 1282 1000 L738 1000 C758 772 800 652 860 600 Z" fill="url(#coatG)" stroke="#1f181b" stroke-width="1.4"/>
    <clipPath id="coatClip"><use href="#coat"/></clipPath>
    <g clip-path="url(#coatClip)">
      <rect x="730" y="550" width="560" height="460" fill="url(#hatch)" opacity="0.7"/>
      <path d="M740 1000 C770 800 820 690 880 640 L900 1000 Z" fill="url(#xhatch)"/>
      <path d="M1282 1000 C1255 800 1210 690 1150 640 L1130 1000 Z" fill="url(#xhatch)"/>
      <path d="M1012 880 L1000 1000 M1050 800 C1080 870 1100 940 1110 1000 M975 800 C945 870 925 940 915 1000" stroke="#1b1417" stroke-width="1.2" fill="none" opacity="0.7"/>
      <g fill="url(#silver)" stroke="#2b2226" stroke-width="0.6"><circle cx="1068" cy="820" r="6"/><circle cx="1080" cy="880" r="6"/><circle cx="1090" cy="940" r="6"/></g>
    </g>
    <path d="M985 562 L902 612 L952 716 L972 772 Z" fill="url(#damask)" stroke="#1f181b" stroke-width="1.2"/>
    <path d="M1040 562 L1124 614 L1070 718 L1052 772 Z" fill="url(#damask)" stroke="#1f181b" stroke-width="1.2"/>
    <path d="M985 560 L1040 560 L1052 770 L1012 880 L972 770 Z" fill="#efe8dc" stroke="#2b2226" stroke-width="1"/></g>`);
  const jabot = g(G, { filter: 'url(#pencil)' });
  frag(G, `<g filter="url(#pencil)">
    <path d="M982 440 C984 480 982 510 978 540 L1044 540 C1040 510 1036 478 1038 440 Z" fill="#e4dbd4" stroke="#3a3034" stroke-width="0.9"/>
    <path d="M985 470 C1000 482 1020 482 1036 470 L1036 500 C1020 508 1000 508 985 500 Z" fill="#8a7f93" opacity="0.28"/></g>`);
  const collar = g(G, { filter: 'url(#pencil)' });
  const HF = g(G, { transform: tilt });
  const face = g(HF, { filter: 'url(#pencil)' });
  face.innerHTML = `<path d="M945 300 C939 360 954 420 988 454 C1002 467 1020 467 1033 455 C1066 420 1081 364 1074 298 C1068 250 1040 224 1008 224 C975 224 950 250 945 300 Z" fill="url(#faceG)" stroke="#3a3034" stroke-width="1.1"/>
    <g filter="url(#soft)" opacity="0.5"><ellipse cx="972" cy="350" rx="26" ry="12" fill="#8a7f93"/><ellipse cx="1048" cy="346" rx="26" ry="12" fill="#8a7f93"/>
    <ellipse cx="1060" cy="395" rx="14" ry="30" fill="#8a7f93" opacity="0.6"/><ellipse cx="966" cy="398" rx="12" ry="18" fill="#b98a8e" opacity="0.35"/></g>
    <path d="M1000 316 C986 311 966 313 948 325" fill="none" stroke="#6b5a4e" stroke-width="1.3" opacity="0.8"/>
    <path d="M1021 313 C1036 307 1056 309 1073 322" fill="none" stroke="#6b5a4e" stroke-width="1.3" opacity="0.8"/>
    <path d="M1013 352 C1011 370 1009 384 1006 396" fill="none" stroke="#8a7f93" stroke-width="0.8" opacity="0.55"/>
    <path d="M1001 401 C1005 404 1010 404 1015 400" fill="none" stroke="#6b5a4e" stroke-width="0.9" opacity="0.6"/>
    <path d="M997 426 C1005 432 1018 432 1025 426 C1018 428 1005 428 997 426 Z" fill="#b98a8e" opacity="0.65"/>
    <path d="M996 425 C1003 421 1008 422 1011 424 C1014 422 1019 421 1026 425" fill="#c79ea0" opacity="0.5" stroke="#7a4a50" stroke-width="0.9"/>
    <path d="M1003 440 C1009 442 1015 442 1020 440" fill="none" stroke="#8a7f93" stroke-width="0.6" opacity="0.5"/>`;
  eyes(face, o);
  const front = g(HF, { filter: 'url(#pencil)' });
  // hair (same generation order as the poster)
  rnd = mk(1989);
  for (let i = 0; i < 120; i++) {
    const th = R(PI * 1.05, PI * 1.95), side = Math.cos(th) < 0 ? -1 : 1;
    strand(back, vine({ x: 1010 + Math.cos(th) * R(62, 80), y: 318 + Math.sin(th) * R(80, 96), a: th + side * R(0.5, 1.25), len: R(200, 470), g: R(0.008, 0.022), curlAt: R(0.5, 0.78), dir: side * (rnd() < 0.8 ? 1 : -1), w: R(3, 6), sw: R(0.55, 0.8), fill: hairFill() }));
  }
  for (let i = 0; i < 14; i++) {
    const th = R(PI * 1.3, PI * 1.7), side = Math.cos(th) < 0 ? -1 : 1;
    strand(back, vine({ x: 1010 + Math.cos(th) * 60, y: 300 + Math.sin(th) * 76, a: th + side * R(0.2, 0.6), len: R(110, 190), g: 0, curlAt: R(0.35, 0.55), dir: side, w: R(3.5, 6), sw: 0.7, fill: hairFill() }));
  }
  el('path', { d: 'M940 322 C932 262 962 222 1010 220 C1058 222 1088 262 1080 318 C1070 290 1050 268 1016 262 L1010 244 L1004 262 C970 268 950 290 940 322 Z', fill: '#f6f1e8', stroke: '#231c20', 'stroke-width': 0.7, 'stroke-opacity': 0.6 }, front);
  for (let i = 0; i < 14; i++) {
    const side = i % 2 ? 1 : -1, off = R(4, 60);
    el('path', { d: `M${1010 + side * 3} ${f1(236 + R(0, 8))} C${f1(1010 + side * off * 0.6)} ${f1(228 + R(0, 6))} ${f1(1010 + side * (off + 20))} ${f1(250 + off * 0.3)} ${f1(1010 + side * (off + 34))} ${f1(300 + R(-6, 10))}`, fill: 'none', stroke: LILAC, 'stroke-width': 0.5, opacity: 0.8 }, front);
  }
  for (let i = 0; i < 10; i++) {
    const side = i % 2 ? 1 : -1;
    strand(front, vine({ x: 1010 + side * R(55, 72), y: R(285, 320), a: PI / 2 - side * R(0.3, 0.8), len: R(120, 220), g: R(0.02, 0.04), curlAt: R(0.6, 0.8), dir: side, w: R(3.5, 5.5), sw: 0.75, fill: hairFill() }));
  }
  for (let i = 0; i < 24; i++) {
    const side = i % 2 ? 1 : -1, sx = side < 0 ? R(900, 930) : R(1090, 1120);
    strand(front, vine({ x: sx, y: R(380, 470), a: PI / 2 - side * R(0.1, 0.6), len: R(180, 380), g: R(0.006, 0.014), curlAt: R(0.58, 0.8), dir: side * (rnd() < 0.75 ? 1 : -1), w: R(3, 5.5), sw: 0.7, fill: hairFill() }));
  }
  for (let r = 0; r < 3; r++) frill(collar, 1010, 486 + r * 26, 72 + r * 20, 8 + r * 2, 10, r % 2 ? '#ece5d8' : '#f3ede2');
  frill(collar, 1012, 572, 150, 12, 12, '#f3ede2');
  for (let r = 0; r < 6; r++) frill(jabot, 1012 + R(-3, 3), 610 + r * 38, 96 - r * 10, 6, 15, r % 2 ? '#e8e0d2' : '#f4eee3');
  pendant(g(G, { filter: 'url(#pencil)', transform: o.pscale ? `translate(1012 578) scale(${o.pscale}) translate(-1012 -578)` : '' }), o);
  return G;
}

// ================= the hand =================
const FING = [
  { b: [-38, -44], a: -52, L: [34, 27, 22], w: 15 },
  { b: [-28, -112], a: -12, L: [46, 29, 23], w: 12 },
  { b: [-8, -119], a: -3, L: [51, 32, 25], w: 12.5 },
  { b: [13, -114], a: 7, L: [46, 29, 23], w: 12 },
  { b: [31, -101], a: 17, L: [35, 23, 19], w: 10.5 },
];
function hand(parent, curl) {
  const H = g(parent, { filter: 'url(#pencil)' });
  rnd = mk(31);
  // forearm
  frag(H, `<path d="M-27 -4 C-30 60 -34 200 -40 560 L42 560 C36 200 32 60 29 -4 Z" fill="#e7dfd6" stroke="${INK}" stroke-width="2.4"/>
    <path d="M10 10 C18 120 22 260 26 560 L42 560 C36 200 32 60 29 -4 Z" fill="url(#hatch)" opacity="0.7"/>
    <path d="M-20 30 C-18 90 -16 150 -16 220 M6 40 C8 110 10 170 12 240" stroke="#8a7f93" stroke-width="1" fill="none" opacity="0.7"/>
    <ellipse cx="24" cy="6" rx="6" ry="4" fill="none" stroke="#8a7f93" stroke-width="1"/>`);
  const cuff = g(H);
  frill(cuff, 1, 212, 96, 8, 14, '#f3ede2'); frill(cuff, 1, 236, 104, 9, 14, '#ece5d8');
  el('path', { d: 'M-46 250 L48 250 L50 300 L-50 300 Z', fill: 'url(#coatG)', stroke: INK, 'stroke-width': 1.4 }, cuff);
  // fingers geometry
  const segs = FING.map((f, i) => {
    let a = f.a, x = f.b[0], y = f.b[1];
    const bendDir = i === 0 ? 1 : (f.a < -5 ? 1 : f.a > 5 ? -1 : 0.5);
    const pts = [[x, y]];
    f.L.forEach((len, j) => {
      a += bendDir * curl[i] * [22, 48, 40][j];
      const l = len * (1 - curl[i] * [0.1, 0.4, 0.45][j]);
      x += Math.sin(a * D2R) * l; y -= Math.cos(a * D2R) * l;
      pts.push([x, y]);
    });
    return { pts, w: f.w };
  });
  const palm = 'M-30 0 C-40 -14 -48 -32 -44 -48 C-42 -70 -38 -96 -30 -114 C-20 -122 0 -124 14 -118 C26 -112 34 -106 36 -96 C40 -70 38 -30 30 0 Z';
  el('path', { d: palm, fill: '#ece4db', stroke: INK, 'stroke-width': 3.2 }, H);
  for (const s of segs) s.pts.slice(0, -1).forEach((p, j) => { const q = s.pts[j + 1]; el('line', { x1: f1(p[0]), y1: f1(p[1]), x2: f1(q[0]), y2: f1(q[1]), stroke: INK, 'stroke-width': s.w * (1 - j * 0.12) + 3.4, 'stroke-linecap': 'round' }, H); });
  el('path', { d: palm, fill: '#ece4db' }, H);
  for (const s of segs) s.pts.slice(0, -1).forEach((p, j) => { const q = s.pts[j + 1]; el('line', { x1: f1(p[0]), y1: f1(p[1]), x2: f1(q[0]), y2: f1(q[1]), stroke: j === 2 ? '#e2d9d0' : '#ece4db', 'stroke-width': s.w * (1 - j * 0.12), 'stroke-linecap': 'round' }, H); });
  // creases, nails, tendons
  for (const s of segs) {
    s.pts.forEach((p, j) => {
      if (j === 0 || j === 3) return;
      const q = s.pts[j - 1], dx = p[0] - q[0], dy = p[1] - q[1], m = Math.hypot(dx, dy) || 1, nx = -dy / m, ny = dx / m, hw = s.w * 0.4;
      el('path', { d: `M${f1(p[0] - nx * hw)} ${f1(p[1] - ny * hw)} Q${f1(p[0] + dx / m * 2)} ${f1(p[1] + dy / m * 2)} ${f1(p[0] + nx * hw)} ${f1(p[1] + ny * hw)}`, fill: 'none', stroke: '#6b5a4e', 'stroke-width': 1, opacity: 0.8 }, H);
    });
    const t = s.pts[3], u = s.pts[2], dx = t[0] - u[0], dy = t[1] - u[1], m = Math.hypot(dx, dy) || 1;
    el('ellipse', { cx: f1(t[0] - dx / m * 4), cy: f1(t[1] - dy / m * 4), rx: f1(s.w * 0.3), ry: f1(s.w * 0.38), transform: `rotate(${f1(Math.atan2(dy, dx) / D2R + 90)} ${f1(t[0] - dx / m * 4)} ${f1(t[1] - dy / m * 4)})`, fill: '#b9aaa6', stroke: INK, 'stroke-width': 0.8 }, H);
    const b = s.pts[0];
    el('path', { d: `M${f1(b[0] * 0.3)} -6 Q${f1(b[0] * 0.8)} ${f1(b[1] * 0.5)} ${f1(b[0])} ${f1(b[1] + 8)}`, fill: 'none', stroke: LILAC, 'stroke-width': 0.9, opacity: 0.7 }, H);
  }
  // grave dirt on the skin
  for (let i = 0; i < 40; i++) el('circle', { cx: f1(R(-36, 34)), cy: f1(R(-150, 180)), r: f1(R(0.6, 2.4)), fill: SMOKE, opacity: f1(R(0.3, 0.7)) }, H);
  el('path', { d: 'M-30 -40 C-10 -30 10 -30 30 -44', fill: 'none', stroke: '#8a7f93', 'stroke-width': 1, opacity: 0.6 }, H);
}

// ================= standing figure (shot 6/7) =================
function figure(parent, o) {
  const F = g(parent, { transform: o.tf, filter: 'url(#pencil)' });
  const up = o.up, hy = -455;
  frag(F, `<circle cx="4" cy="${hy - 12}" r="74" fill="none" stroke="#f3ede2" stroke-width="2.2" stroke-dasharray="1.5 5" opacity="0.8"/>
    <circle cx="4" cy="${hy - 12}" r="84" fill="none" stroke="#f3ede2" stroke-width="0.6" opacity="0.5"/>`);
  const HB = g(F);
  rnd = mk(606);
  for (let i = 0; i < 46; i++) {
    const x0 = R(-26, 30), side = x0 < 2 ? -1 : 1;
    strand(HB, vine({ x: x0, y: hy - 28 + R(-4, 10), a: PI / 2 + side * R(0.2, 0.9), tgt: PI / 2, len: R(180, 400), g: R(0.03, 0.06), curlAt: R(0.8, 0.94), dir: side, w: R(2.2, 3.8), sw: 0.55, fill: hairFill() }));
  }
  // coat
  frag(F, `<path id="fcoat" d="M-52 -372 C-70 -300 -60 -200 -66 -120 C-80 -60 -110 -20 -128 0 L-86 6 L-60 -2 L-30 7 L0 -1 L32 8 L66 -2 L94 6 L126 0 C104 -30 76 -70 66 -130 C62 -210 72 -300 52 -372 C30 -386 -30 -386 -52 -372 Z" fill="url(#coatG)" stroke="#1b1417" stroke-width="1.6"/>
    <path d="M-52 -372 C-70 -300 -60 -200 -66 -120 C-80 -60 -110 -20 -128 0 L-86 6 L-60 -2 L-30 7 L0 -1 L32 8 L66 -2 L94 6 L126 0 C104 -30 76 -70 66 -130 C62 -210 72 -300 52 -372 C30 -386 -30 -386 -52 -372 Z" fill="url(#hatch)" opacity="0.8"/>
    <path d="M-20 -250 C-30 -160 -50 -80 -70 0 M16 -240 C24 -150 40 -80 60 0 M0 -300 L-4 0" stroke="#1b1417" stroke-width="1.1" fill="none" opacity="0.6"/>
    <path d="M-16 -384 L-40 -340 L-6 -290 Z" fill="url(#damask)" stroke="#1b1417" stroke-width="1"/>
    <path d="M16 -384 L40 -340 L6 -290 Z" fill="url(#damask)" stroke="#1b1417" stroke-width="1"/>
    <path d="M-12 -386 L12 -386 L6 -292 L0 -280 L-6 -292 Z" fill="#efe8dc" stroke="#2b2226" stroke-width="0.9"/>`);
  const C = g(F);
  frill(C, 0, -330, 26, 4, 8, '#f4eee3'); frill(C, 0, -312, 22, 4, 8, '#e8e0d2');
  // neck (stretched, chin up)
  frag(F, `<path d="M-13 -384 C-12 -400 -12 -418 -14 -436 L16 -438 C14 -418 14 -400 14 -384 Z" fill="#e4dbd4" stroke="#3a3034" stroke-width="0.9"/>
    <path d="M-8 -392 C-2 -402 4 -414 8 -428" stroke="#8a7f93" stroke-width="0.8" fill="none" opacity="0.7"/>`);
  frill(C, 0, -386, 50, 7, 9, '#f3ede2'); frill(C, 0, -376, 64, 8, 9, '#ece5d8');
  // arms
  const th = o.arm;
  for (const s of [-1, 1]) {
    const S = [s * 48, -366];
    const d1 = [s * Math.sin(th * D2R), Math.cos(th * D2R)], t2 = th + 9, d2 = [s * Math.sin(t2 * D2R), Math.cos(t2 * D2R)], t3 = th + 14, d3 = [s * Math.sin(t3 * D2R), Math.cos(t3 * D2R)];
    const E = [S[0] + d1[0] * 100, S[1] + d1[1] * 100], Wr = [E[0] + d2[0] * 92, E[1] + d2[1] * 92];
    const pl = `M${f1(S[0])} ${f1(S[1])} L${f1(E[0])} ${f1(E[1])} L${f1(Wr[0])} ${f1(Wr[1])}`;
    el('path', { d: pl, fill: 'none', stroke: '#1b1417', 'stroke-width': 31, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, F);
    el('path', { d: pl, fill: 'none', stroke: '#3d3339', 'stroke-width': 27, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, F);
    el('path', { d: pl, fill: 'none', stroke: 'url(#hatch)', 'stroke-width': 27, 'stroke-linecap': 'round', opacity: 0.8 }, F);
    // bell cuff
    const n2 = [-d2[1], d2[0]];
    const c0 = [Wr[0] - d2[0] * 22, Wr[1] - d2[1] * 22];
    el('path', { d: `M${f1(c0[0] + n2[0] * 13)} ${f1(c0[1] + n2[1] * 13)} L${f1(Wr[0] + n2[0] * 22)} ${f1(Wr[1] + n2[1] * 22)} L${f1(Wr[0] - n2[0] * 22)} ${f1(Wr[1] - n2[1] * 22)} L${f1(c0[0] - n2[0] * 13)} ${f1(c0[1] - n2[1] * 13)} Z`, fill: '#3d3339', stroke: '#1b1417', 'stroke-width': 1.3 }, F);
    el('line', { x1: f1(Wr[0] + n2[0] * 18), y1: f1(Wr[1] + n2[1] * 18), x2: f1(Wr[0] - n2[0] * 18), y2: f1(Wr[1] - n2[1] * 18), stroke: '#f3ede2', 'stroke-width': 6, 'stroke-dasharray': '3 1.5' }, F);
    // hand: palm + spread fingers
    const Pc = [Wr[0] + d3[0] * 14, Wr[1] + d3[1] * 14];
    const fingers = [-46, -20, -5, 10, 26].map((da, k) => { const a = (t3 + da) * D2R, l = [20, 27, 30, 27, 21][k]; const b = [Pc[0] + s * Math.sin(a) * 7, Pc[1] + Math.cos(a) * 7]; return [b, [b[0] + s * Math.sin(a) * l, b[1] + Math.cos(a) * l]]; });
    for (const [b, e] of fingers) el('line', { x1: f1(b[0]), y1: f1(b[1]), x2: f1(e[0]), y2: f1(e[1]), stroke: INK, 'stroke-width': 7, 'stroke-linecap': 'round' }, F);
    el('circle', { cx: f1(Pc[0]), cy: f1(Pc[1]), r: 11, fill: '#ece4db', stroke: INK, 'stroke-width': 1.5 }, F);
    for (const [b, e] of fingers) el('line', { x1: f1(b[0]), y1: f1(b[1]), x2: f1(e[0]), y2: f1(e[1]), stroke: '#ece4db', 'stroke-width': 4.2, 'stroke-linecap': 'round' }, F);
  }
  // head, turned up to the sky
  const fy = (1 - up) * 10;
  frag(F, `<path d="M-26 ${hy + 6} C-32 ${hy - 26} -12 ${hy - 44} 6 ${hy - 43} C26 ${hy - 42} 38 ${hy - 22} 32 ${hy + 6} C28 ${hy + 22} 14 ${hy + 30} 2 ${hy + 28} C-12 ${hy + 26} -24 ${hy + 18} -26 ${hy + 6} Z" fill="url(#faceG)" stroke="#3a3034" stroke-width="1.1"/>
    <path d="M-20 ${hy + 16} C-8 ${hy + 26} 12 ${hy + 28} 26 ${hy + 16} C18 ${hy + 30} -8 ${hy + 32} -20 ${hy + 16} Z" fill="#8a7f93" opacity="0.45"/>
    <path d="M-17 ${hy - 16 + fy} C-13 ${hy - 11 + fy} -6 ${hy - 11 + fy} -2 ${hy - 16 + fy}" fill="none" stroke="#231c20" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M10 ${hy - 17 + fy} C14 ${hy - 12 + fy} 21 ${hy - 12 + fy} 25 ${hy - 17 + fy}" fill="none" stroke="#231c20" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M-18 ${hy - 23 + fy} C-12 ${hy - 26 + fy} -6 ${hy - 26 + fy} -2 ${hy - 23 + fy} M10 ${hy - 24 + fy} C15 ${hy - 27 + fy} 21 ${hy - 27 + fy} 26 ${hy - 24 + fy}" fill="none" stroke="#6b5a4e" stroke-width="1" opacity="0.8"/>
    <path d="M3 ${hy - 8 + fy} C1 ${hy - 3 + fy} 3 ${hy + fy} 7 ${hy + fy}" fill="none" stroke="#6b5a4e" stroke-width="0.9"/>
    <ellipse cx="4" cy="${hy + 9 + fy}" rx="4.5" ry="3" fill="#5a2a32" stroke="#3a1c22" stroke-width="0.7"/>
    <path d="M-12 ${hy - 4 + fy} L-13 ${hy + 6 + fy} M20 ${hy - 5 + fy} L21 ${hy + 8 + fy}" stroke="#9ab" stroke-width="0.7" opacity="0.6"/>
    <path d="M-28 ${hy - 2} C-34 ${hy - 34} -12 ${hy - 50} 6 ${hy - 50} C28 ${hy - 50} 42 ${hy - 32} 34 ${hy - 2} C30 ${hy - 26} 20 ${hy - 36} 6 ${hy - 37} C-8 ${hy - 36} -22 ${hy - 26} -28 ${hy - 2} Z" fill="#f6f1e8" stroke="#231c20" stroke-width="0.7"/>`);
  rnd = mk(607);
  for (let i = 0; i < 10; i++) {
    const side = i % 2 ? 1 : -1;
    strand(F, vine({ x: 4 + side * R(24, 32), y: hy + R(-12, 4), a: PI / 2 + side * R(0.05, 0.3), tgt: PI / 2, len: R(110, 230), g: R(0.04, 0.07), curlAt: R(0.8, 0.9), dir: side, w: R(2.4, 3.6), sw: 0.6, fill: hairFill() }));
  }
}

// ================= environments =================
function paperBg(S, fill = '#ece2cc') {
  el('rect', { x: -20, y: -20, width: 1640, height: 940, fill, filter: 'url(#paper)' }, S);
}

function skyline(S, dy, q) {
  const G = g(S, { transform: `translate(0 ${f1(dy)})` });
  rnd = mk(515);
  const far = g(G, { filter: 'url(#pencil)' });
  // far chimneys + smoke
  const chim = [60, 330, 420, 1250, 1330, 1520, 1580];
  chim.forEach((x, i) => {
    const h = R(430, 620), w = R(20, 34);
    el('path', { d: `M${f1(x - w / 2)} 900 L${f1(x - w * 0.38)} ${f1(900 - h)} L${f1(x + w * 0.38)} ${f1(900 - h)} L${f1(x + w / 2)} 900 Z`, fill: '#8a7f93', stroke: '#4c4553', 'stroke-width': 1 }, far);
    el('rect', { x: f1(x - w * 0.5), y: f1(900 - h - 6), width: f1(w), height: 8, fill: '#6d6377', stroke: '#4c4553' }, far);
    for (let b = 1; b < 4; b++) el('line', { x1: f1(x - w * 0.45), x2: f1(x + w * 0.45), y1: f1(900 - h + b * 40), y2: f1(900 - h + b * 40), stroke: '#4c4553', 'stroke-width': 1.2 }, far);
    const sm = g(far, { filter: 'url(#wash)', opacity: 0.5 });
    for (let k = 0; k < 4; k++) el('ellipse', { cx: f1(x + (k * 22 + (q % 3) * 6) * (i % 2 ? 1 : -1)), cy: f1(900 - h - 30 - k * 46 - (q % 4) * 5), rx: f1(22 + k * 14), ry: f1(16 + k * 8), fill: '#b7aebd' }, sm);
  });
  // far buildings with saw roofs
  let x = -20;
  while (x < 1620) {
    const w = R(70, 170), h = R(160, 330);
    let d = `M${f1(x)} 900 L${f1(x)} ${f1(900 - h)}`;
    const teeth = Math.round(w / 34);
    for (let t = 0; t < teeth; t++) { const x0 = x + t * w / teeth; d += ` L${f1(x0 + w / teeth * 0.7)} ${f1(900 - h - 22)} L${f1(x0 + w / teeth)} ${f1(900 - h)}`; }
    d += ` L${f1(x + w)} 900 Z`;
    el('path', { d, fill: '#6d6377', stroke: '#3e3744', 'stroke-width': 1 }, far);
    x += w + R(-10, 20);
  }
  // big gears
  gear(G, 1450, 620, 190, 18, q * 5, '#4a4250', 6, '#231c20');
  gear(G, 1236, 760, 92, 10, -q * 5 * 190 / 92 + 9, '#554c5b', 5, '#231c20');
  gear(G, 110, 700, 120, 12, -q * 7, '#4a4250', 5, '#231c20');
  // clock tower
  const T = g(G, { filter: 'url(#pencil)' });
  frag(T, `<path d="M150 900 L150 330 L130 330 L130 300 L250 300 L250 330 L230 330 L230 900 Z" fill="#3b3338" stroke="#1b1417" stroke-width="1.4"/>
    <path d="M140 300 L190 130 L240 300 Z" fill="#2e272b" stroke="#1b1417" stroke-width="1.4"/>
    <path d="M150 330 L230 330 L230 900 L150 900 Z" fill="url(#hatch2)" opacity="0.8"/>
    <line x1="190" y1="130" x2="190" y2="92" stroke="#1b1417" stroke-width="2"/><circle cx="190" cy="90" r="4" fill="#6e2330"/>
    <circle cx="190" cy="248" r="36" fill="#f3ede2" stroke="#1b1417" stroke-width="2"/><circle cx="190" cy="248" r="30" fill="none" stroke="#6e2330" stroke-width="0.7"/>`);
  for (let k = 0; k < 12; k++) { const a = k * TAU / 12; el('line', { x1: f1(190 + Math.cos(a) * 26), y1: f1(248 + Math.sin(a) * 26), x2: f1(190 + Math.cos(a) * 32), y2: f1(248 + Math.sin(a) * 32), stroke: INK, 'stroke-width': k % 3 ? 1 : 2 }, T); }
  const hm = (q * 30) * D2R, hh = (200 + q * 2.5) * D2R;
  el('line', { x1: 190, y1: 248, x2: f1(190 + Math.sin(hm) * 27), y2: f1(248 - Math.cos(hm) * 27), stroke: INK, 'stroke-width': 1.6 }, T);
  el('line', { x1: 190, y1: 248, x2: f1(190 + Math.sin(hh) * 17), y2: f1(248 - Math.cos(hh) * 17), stroke: INK, 'stroke-width': 2.6 }, T);
  for (let k = 0; k < 6; k++) el('rect', { x: 176, y: 380 + k * 80, width: 28, height: 40, fill: k === 2 ? '#6e2330' : '#1b1417', opacity: 0.8 }, T);
  // near factory row
  const near = g(G, { filter: 'url(#pencil)' });
  x = 240;
  while (x < 1600) {
    const w = R(90, 190), h = R(70, 180);
    if (x > 330 && x < 1180) { x += w; continue; }
    el('rect', { x: f1(x), y: f1(900 - h), width: f1(w), height: f1(h + 20), fill: '#3b3338', stroke: '#1b1417', 'stroke-width': 1.2 }, near);
    el('rect', { x: f1(x), y: f1(900 - h), width: f1(w), height: f1(h + 20), fill: 'url(#hatch2)', opacity: 0.6 }, near);
    for (let wy = 900 - h + 18; wy < 880; wy += 30) for (let wx = x + 12; wx < x + w - 14; wx += 24) if (rnd() < 0.35) el('rect', { x: f1(wx), y: f1(wy), width: 9, height: 13, fill: rnd() < 0.3 ? '#c9a878' : '#6e2330', opacity: 0.85 }, near);
    x += w + R(0, 30);
  }
}

function ruins(S, flash) {
  el('rect', { x: -20, y: -20, width: 1640, height: 940, fill: 'url(#skyG)' }, S);
  el('rect', { x: -20, y: -20, width: 1640, height: 940, fill: '#ece2cc', filter: 'url(#paper)', opacity: 0.18 }, S);
  if (flash) el('rect', { x: -20, y: -20, width: 1640, height: 940, fill: '#e9e2d6', opacity: 0.78 }, S);
  rnd = mk(808);
  const cl = g(S, { filter: 'url(#wash)', opacity: flash ? 0.4 : 0.7 });
  for (let i = 0; i < 9; i++) el('ellipse', { cx: f1(R(-100, 1700)), cy: f1(R(20, 260)), rx: f1(R(180, 380)), ry: f1(R(50, 110)), fill: i % 2 ? '#2b2530' : '#4c4553' }, cl);
  if (flash) frag(S, `<path d="M1180 -10 L1150 90 L1175 100 L1120 230 L1150 240 L1090 400" fill="none" stroke="#fffaf0" stroke-width="3.5" filter="url(#pencil)"/>
    <path d="M1150 90 L1110 150 M1120 230 L1180 300" fill="none" stroke="#fffaf0" stroke-width="1.5"/>`);
  const far = g(S, { filter: 'url(#pencil)' });
  // distant broken skyline
  let d = 'M-20 900 L-20 610', x = -20;
  while (x < 1620) {
    const w = R(40, 120), kind = rnd();
    if (kind < 0.18) { d += ` L${f1(x)} ${f1(R(420, 480))} L${f1(x + 14)} ${f1(R(400, 460))} L${f1(x + 22)} ${f1(R(430, 470))} L${f1(x + 26)} 600`; x += 26; }
    else { d += ` L${f1(x + w * 0.3)} ${f1(R(560, 610))} L${f1(x + w * 0.6)} ${f1(R(575, 620))} L${f1(x + w)} ${f1(R(555, 615))}`; x += w; }
  }
  d += ' L1620 900 Z';
  el('path', { d, fill: flash ? '#8a7f93' : '#4a4250', stroke: '#231c20', 'stroke-width': 1 }, far);
  // broken arches
  for (const [ax, ar] of [[560, 60], [760, 48], [1500, 70]]) el('path', { d: `M${ax - ar} 640 L${ax - ar} ${560 - ar * 0.2} A${ar} ${ar} 0 0 1 ${ax + ar * 0.6} ${f1(500 - ar * 0.6)}`, fill: 'none', stroke: '#3b3338', 'stroke-width': 16 }, far);
  // broken clock tower with half a clock
  frag(far, `<path d="M300 900 L300 330 L322 300 L336 318 L352 280 L372 326 L380 900 Z" fill="#3b3338" stroke="#1b1417" stroke-width="1.4"/>
    <path d="M300 900 L300 330 L322 300 L336 318 L352 280 L372 326 L380 900 Z" fill="url(#hatch2)" opacity="0.8"/>
    <path d="M308 400 A32 32 0 0 1 372 400" fill="#d8cfc2" stroke="#1b1417" stroke-width="2"/>
    <line x1="340" y1="400" x2="352" y2="376" stroke="#1b1417" stroke-width="2"/>`);
  // big half-buried gear + broken columns
  gear(S, 1390, 820, 140, 16, 12, '#2e272b', 6, '#140e10');
  for (const [cx, h] of [[190, 330], [1520, 230], [1140, 150]]) {
    const top = 780 - h;
    el('path', { d: `M${cx - 30} 800 L${cx - 30} ${top + 12} L${cx - 12} ${top} L${cx + 2} ${top + 18} L${cx + 18} ${top + 4} L${cx + 30} ${top + 20} L${cx + 30} 800 Z`, fill: '#6b5a4e', stroke: '#1b1417', 'stroke-width': 1.4 }, far);
    for (let k = -20; k <= 20; k += 10) el('line', { x1: cx + k, x2: cx + k, y1: top + 24, y2: 800, stroke: '#2b2226', 'stroke-width': 1, opacity: 0.6 }, far);
    el('rect', { x: cx + 6, y: top + 20, width: 24, height: 780 - top, fill: 'url(#hatch2)' }, far);
  }
  // ground + puddles
  el('rect', { x: -20, y: 780, width: 1640, height: 140, fill: '#2e272b' }, S);
  el('rect', { x: -20, y: 780, width: 1640, height: 140, fill: 'url(#hatchH)', opacity: 0.7 }, S);
  for (const [px, py, rx] of [[260, 850, 120], [620, 872, 80], [1500, 860, 110]]) {
    el('ellipse', { cx: px, cy: py, rx, ry: rx * 0.12, fill: '#8a7f93', opacity: 0.45 }, S);
    el('line', { x1: px - rx * 0.6, x2: px + rx * 0.5, y1: py, y2: py, stroke: '#f3ede2', 'stroke-width': 1, opacity: 0.5 }, S);
  }
  // rubble mound
  const M = g(S, { filter: 'url(#pencil)' });
  const mound = 'M600 920 L660 820 L720 772 L790 748 L860 728 L930 716 L1010 708 L1090 714 L1170 730 L1240 752 L1310 790 L1380 850 L1440 920 Z';
  el('path', { d: mound, fill: '#3b3136', stroke: '#140e10', 'stroke-width': 1.6 }, M);
  el('path', { d: mound, fill: 'url(#hatch)', opacity: 0.8 }, M);
  for (let i = 0; i < 26; i++) {
    const cx = R(680, 1360), top = 708 + Math.pow(Math.abs(cx - 1010) / 360, 2) * 110 + R(4, 60), s = R(10, 26);
    el('path', { d: `M${f1(cx - s)} ${f1(top + s * 0.5)} L${f1(cx - s * 0.6)} ${f1(top - s * 0.3)} L${f1(cx + s * 0.4)} ${f1(top - s * 0.45)} L${f1(cx + s)} ${f1(top + s * 0.2)} L${f1(cx + s * 0.3)} ${f1(top + s * 0.6)} Z`, fill: rnd() < 0.5 ? '#6b5a4e' : '#5e5566', stroke: '#140e10', 'stroke-width': 1 }, M);
  }
  frag(M, `<path d="M760 760 L730 700 M1250 760 L1290 690 L1300 700" stroke="#1b1417" stroke-width="2.5" fill="none"/>`);
}

function rain(S, seed, n, far) {
  const r = mk(seed), ang = 0.24;
  const G = g(S);
  for (let i = 0; i < n; i++) {
    const x = r() * 1900 - 100, y = r() * 1000 - 60, len = (far ? 25 : 45) + r() * (far ? 40 : 90), pale = r() < 0.8;
    el('line', { x1: f1(x), y1: f1(y), x2: f1(x - Math.sin(ang) * len), y2: f1(y + Math.cos(ang) * len), stroke: pale ? '#efe8dc' : '#140e10', 'stroke-width': f1((far ? 0.5 : 0.8) + r() * (far ? 0.7 : 1.4)), opacity: f1(0.2 + r() * (far ? 0.3 : 0.5)), 'stroke-linecap': 'round' }, G);
  }
  if (!far) for (let i = 0; i < 40; i++) {
    const cx = 640 + r() * 760, top = 708 + Math.pow(Math.abs(cx - 1010) / 360, 2) * 110 + r() * 8;
    el('path', { d: `M${f1(cx - 6)} ${f1(top - 4)} L${f1(cx)} ${f1(top)} L${f1(cx + 6)} ${f1(top - 5)}`, fill: 'none', stroke: '#efe8dc', 'stroke-width': 0.9, opacity: 0.7 }, G);
  }
}
const PFPS = 8;
