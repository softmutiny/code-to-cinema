// GOLD SEAM · 金缮: a 9.5 s liyue demo (made by a fresh agent from the style guide alone, as a blind test). Copy it to start your own film.
// Script:
// | # | time     | picture                                                                 | caption                                           | sound                    |
// | 0 | 0–5.0    | saucer, then a celadon teacup wires & glazes itself in a garden alcove; |一盏新茶，半窗竹影 / New tea, half a window of bamboo | pluck, chime, drip, shatter |
// |   |          | steam curls in gold wire; a hairline crack runs, the cup falls to shards|                                                   |                          |
// | 1 | 5.0–9.5  | shards drift home, gold wire lays itself along every break (金缮),     |碎处，以金续之 / Where it broke, gold carries on     | pound, pluck, swell, finale |
// |   |          | the mended cup glows, steam rises again; camera eases back 1.07 → 1     |                                                   |                          |
const FILM = { title: 'GOLD SEAM · 金缮', style: 'liyue', dur: 9.5, labels: ['壹 · 盏', '贰 · 缮'], finale: true, text: '' };
const SHOTS = [];

// ---------- shared geometry ----------
const CUP = { cx: 800, rimY: 420, rx: 160, ry: 28 };
const BODY = 'M640,420 C645,520 710,585 760,592 L840,592 C890,585 955,520 960,420 A160,28 0 0 1 640,420 Z';
const SIL = 'M640,420 A160,28 0 0 1 960,420 C955,520 890,585 840,592 L760,592 C710,585 645,520 640,420 Z';
const DEFS = `<defs>
<linearGradient id="dusk" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="620"><stop offset="0" stop-color="#2f2c6e"/><stop offset="0.3" stop-color="#5b55a6"/><stop offset="0.6" stop-color="#9d8cc9"/><stop offset="0.85" stop-color="#dcb4d2"/><stop offset="1" stop-color="#f3cdd2"/></linearGradient>
<linearGradient id="celaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2f5ea"/><stop offset="0.6" stop-color="#c6ead6"/><stop offset="1" stop-color="#9fd3bd"/></linearGradient>
<radialGradient id="teaG" cx="0.45" cy="0.4" r="0.7"><stop offset="0" stop-color="#fbf0c8"/><stop offset="1" stop-color="#e3cf8e"/></radialGradient>
<clipPath id="cupClip"><path d="${SIL}"/></clipPath>
<clipPath id="winC"><path d="${poly(octagon(150, 150, 430, 560, 70))}Z"/></clipPath>
</defs>`;

// point in polygon (for trimming seams to the cup silhouette)
function inPoly(pt, pg) {
  let c = false;
  for (let i = 0, j = pg.length - 1; i < pg.length; j = i++) {
    const [xi, yi] = pg[i], [xj, yj] = pg[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) c = !c;
  }
  return c;
}

let BG = null;
function background() {
  if (BG) return BG;
  BG = seeded(77, () => {
    let g = `<rect width="1600" height="900" fill="url(#wallG)"/>`;
    // night sky above the garden wall + the wall's tiled coping
    g += `<rect x="0" y="0" width="1600" height="112" fill="url(#dusk)"/>`;
    for (let i = 0; i < 14; i++) g += twinkle(R(60, 1540), R(24, 88), R(2, 4.5), '#fff6d4', R(0.5, 0.9));
    g += coping(30, 1570, 96);
    // octagonal leak window: bamboo against the dusk
    const pts = octagon(150, 150, 430, 560, 70);
    let scene = `<rect x="140" y="140" width="300" height="430" fill="url(#dusk)"/>`;
    for (let i = 0; i < 6; i++) scene += twinkle(R(170, 410), R(170, 330), R(2, 4), '#fff6d4', 0.8);
    scene += bamboo(236, 570, 150, 24) + bamboo(318, 570, 190, 18) + bamboo(392, 570, 160, 14);
    scene += leafSpray(236, 300, 1, 5) + leafSpray(318, 360, -1, 5) + leafSpray(392, 250, -1, 4);
    g += latticeWindow(pts, 'winC', scene, 5200);
    // osmanthus bough reaching in from the top right
    g += branch('M1600,150 C1500,170 1410,205 1330,262 C1280,298 1240,322 1190,330', 16, 12, 7, 1.1);
    // a narrow hanging scroll behind the cup: lilac mount, cream paper, one wired cloud
    g += `<rect x="714" y="150" width="172" height="330" fill="#a99ccc" opacity="0.25" filter="url(#glowS)" transform="translate(6 8)"/>`;
    g += `<rect x="714" y="150" width="172" height="330" fill="#ddd3f5" stroke="${GOLDD}" stroke-width="1.2"/>`;
    g += `<rect x="730" y="170" width="140" height="300" fill="#fcf6ea" stroke="${GOLD}" stroke-width="1.2"/>`;
    g += cloiCloud(778, 222, 1.05, '#f6d6e2', 1);
    for (let i = 0; i < 4; i++) g += sparkle(R(745, 855), R(250, 310), R(2.5, 4), 0.8);
    g += `<rect x="704" y="143" width="192" height="14" rx="7" fill="url(#goldG)" stroke="${GOLDD}" stroke-width="1"/>`;
    g += `<path d="M734,143 L800,112 L866,143" fill="none" stroke="${GOLDD}" stroke-width="1.4"/><circle cx="800" cy="112" r="4" fill="url(#goldG)" stroke="${GOLDD}"/>`;
    // stone table
    g += `<path d="M90,612 L1510,612 L1570,706 L30,706 Z" fill="url(#stoneG)" stroke="${GOLDD}" stroke-width="1.2"/>`;
    g += `<path d="M30,706 L1570,706 L1570,900 L30,900 Z" fill="#d9d2e4"/>` + goldLine('M96,616 L1504,616', 1.6);
    return g;
  });
  return BG;
}

// ---------- plates ----------
function saucerCloi() {
  const C = new Cloi({ wire: [0, 0.6], fill: [0.3, 1] });
  C.piece(ellD(800, 606, 230, 30), '#ddd3f5', { key: 0, filter: 'gouache', w: 1.8 });
  C.piece(ellD(800, 603, 168, 19), 'url(#celaG)', { key: 1, w: 1.4 });
  return C;
}
function cupCloi() {
  const C = new Cloi({ wire: [0, 0.62], fill: [0.35, 1] });
  C.piece('M752,590 L746,606 L854,606 L848,590 Z', 'url(#goldG)', { key: 0, w: 1.4 });
  C.piece(BODY, 'url(#celaG)', { key: 1, filter: 'gouache', w: 2.2 });
  C.piece(ellD(800, 420, 151, 22), '#fcefd2', { key: 2, w: 1.4 });
  C.piece(ellD(800, 427, 142, 17), 'url(#teaG)', { key: 3, w: 1.2 });
  C.piece(ellD(800, 420, 160, 28) + ' ' + ellD(800, 420, 151, 22), 'url(#goldG)', { key: 4, rule: 'evenodd', w: 1.6, flood: false });
  C.deco(`<ellipse cx="760" cy="424" rx="46" ry="5" fill="#fffdf2" opacity="0.6"/>` + osmFlower(842, 428, 2.2, 20) + osmFlower(856, 432, 1.8, 60));
  return C;
}
function decoCloi() {
  // cells inside the body: a lilac band with wire scrolls, a row of blush lotus petals below
  const C = new Cloi({ wire: [0, 0.6], fill: [0.3, 1] });
  C.piece('M600,452 Q800,480 1000,452 L1000,494 Q800,522 600,494 Z', '#ddd3f5', { key: 0, w: 1.4 });
  for (let i = -3; i <= 3; i++) {
    const x = 800 + i * 44, b = 600;
    C.piece(`M${x - 22},${b} C${x - 26},${b - 36} ${x - 10},${b - 62} ${x},${b - 74} C${x + 10},${b - 62} ${x + 26},${b - 36} ${x + 22},${b} Z`, i % 2 ? '#f6d6e2' : '#fcefd2', { key: 10 + Math.abs(i) * 2 + (i > 0 ? 1 : 0), w: 1.2 });
  }
  for (let i = 0; i < 8; i++) { const x = 655 + i * 42; C.wire(wireSpiral(x, 486 + 4 * Math.sin(i * 0.9) * 0 + (Math.abs(x - 800) / 160) ** 2 * -6, 12, i % 2 ? 1 : -1, 1.3, i), { key: 1 + i * 0.1, w: 1.1 }); }
  C.deco(osmCluster(800, 546, 4, 1.4, 5));
  return C;
}
function steamCloi() {
  const C = new Cloi({ wire: [0, 1], fill: [0.9, 1] });
  C.wire('M772,392 C752,360 792,338 770,304 C754,280 776,258 766,238', { key: 0, w: 1.6 });
  C.wire('M812,396 C832,366 796,344 818,312 C834,290 812,268 824,252', { key: 1, w: 1.4 });
  C.wire(wireSpiral(766, 238, 10, 1, 1.2, 1.5), { key: 2, w: 1.2 });
  C.wire(wireSpiral(824, 252, 8, -1, 1.2, 1.5), { key: 3, w: 1.1 });
  return C;
}
// shards: voronoi cells over the cup, seams trimmed to the silhouette
function makeShards() {
  const box = [626, 380, 976, 614];
  const sites = [];
  for (let i = 0; i < 11; i++) sites.push([R(660, 940), R(400, 590)]);
  const cells = voronoi(sites, box, 400);
  const silP = sample(SIL, 180);
  const seen = new Set();
  let seams = [];
  cells.forEach(pg => {
    for (let i = 0; i < pg.length; i++) {
      const P = pg[i], Q = pg[(i + 1) % pg.length];
      const k = [P, Q].map(p => p.map(v => Math.round(v)).join(',')).sort().join('|');
      if (seen.has(k)) continue; seen.add(k);
      let run = [];
      const flush = () => { if (run.length > 2) seams.push(poly(run)); run = []; };
      for (let s = 0; s <= 40; s++) {
        const pt = [lerp(P[0], Q[0], s / 40), lerp(P[1], Q[1], s / 40)];
        const inTea = ((pt[0] - 800) / 150) ** 2 + ((pt[1] - 420) / 21) ** 2 < 1; // keep seams off the tea surface
        if (inPoly(pt, silP) && !inTea) run.push(pt); else flush();
      }
      flush();
    }
  });
  // lay seams from the top of the cup downward
  seams.sort((a, b) => pathBox(a)[1] - pathBox(b)[1]);
  const c0 = [800, 500];
  const shards = cells.map((pg, i) => {
    const c = centroid(pg), dx = c[0] - c0[0], dy = c[1] - c0[1], l = Math.hypot(dx, dy) || 1;
    return { pg, c, dx: dx / l * R(16, 26), dy: dy / l * R(12, 20) + R(4, 10), rot: R(-6, 6) };
  });
  return { shards, seams };
}
function shardsSvg(S, cupSvg, u, pre) {
  let o = '';
  S.shards.forEach((s, i) => {
    const id = `${pre}${i}`;
    o += `<clipPath id="${id}"><path d="${poly(s.pg)}Z"/></clipPath>`;
    o += `<g transform="translate(${f(s.dx * u)} ${f(s.dy * u)}) rotate(${f(s.rot * u)} ${f(s.c[0])} ${f(s.c[1])})"><g clip-path="url(#${id})">${cupSvg}</g></g>`;
  });
  return o;
}
const CS = 1.25, CO = [800, 606];
const cupG = (svg) => `<g transform="translate(${CO[0]} ${CO[1]}) scale(${CS}) translate(${-CO[0]} ${-CO[1]})">${svg}</g>`;
const mapTip = (tp) => tp && [CO[0] + (tp[0] - CO[0]) * CS, CO[1] + (tp[1] - CO[1]) * CS];
const fullCup = (A, B) => A.render(1).svg + `<g clip-path="url(#cupClip)">${B.render(1).svg}</g>`;

// ---------- SHOT 0 · the cup makes itself, then breaks ----------
SHOTS.push({
  id: 0, t0: 0, t1: 5.0, mood: 1,
  cap: [{ a: 0.5, b: 4.95, zh: '一盏新茶，半窗竹影', en: 'New tea, and half a window of bamboo.' }],
  build() { this.S = saucerCloi(); this.A = cupCloi(); this.B = decoCloi(); this.C = steamCloi(); this.X = makeShards(); },
  frame(t) {
    const pS = clamp(t / 1.0), pA = clamp((t - 0.35) / 2.1), pB = clamp((t - 1.3) / 1.6), pC = clamp((t - 2.7) / 0.75);
    const S = this.S.render(pS), A = this.A.render(pA), B = this.B.render(pB);
    let svg = S.svg;
    let tip = null;
    if (t < 3.75) {
      svg += A.svg + `<g clip-path="url(#cupClip)">${B.svg}</g>`;
      const C = this.C.render(pC);
      const steamO = 1 - sm(3.4, 3.75, t);
      if (pC > 0) svg += `<g opacity="${steamO.toFixed(3)}">${C.svg}</g>`;
      tip = C.tip || B.tip || A.tip || S.tip;
      // hairline crack
      const k = sm(3.45, 3.7, t);
      if (k > 0) svg += `<g opacity="${k.toFixed(3)}">${this.X.seams.map(d => `<path d="${d}" fill="none" stroke="#fffdf4" stroke-width="1.4"/><path d="${d}" fill="none" stroke="#8e7fb8" stroke-width="0.6"/>`).join('')}</g>`;
    } else {
      svg += shardsSvg(this.X, fullCup(this.A, this.B), ease((t - 3.75) / 0.45), 'sa');
    }
    svg = DEFS + background() + cupG(svg); tip = mapTip(tip);
    return { svg, tip, zoom: 1 + 0.07 * ease(t / 5), zc: [800, 470] };
  },
  events() { return [{ t: 0.15, type: 'pluck', n: 0 }, { t: 2.45, type: 'chime' }, { t: 3.45, type: 'drip', hi: true }, { t: 3.75, type: 'shatter' }]; },
});

// ---------- SHOT 1 · shards come home, gold fills every break, the cup glows ----------
SHOTS.push({
  id: 1, t0: 5.0, t1: 9.5, mood: 0.8,
  cap: [{ a: 0.9, b: 4.5, zh: '碎处，以金续之', en: 'Where it broke, gold carries on.' }],
  build() {
    this.S = saucerCloi(); this.A = cupCloi(); this.B = decoCloi(); this.C = steamCloi();
    this.X = SHOTS[0].X;
    this.G = new Cloi({ wire: [0, 1], fill: [0.99, 1], col: '#d9a93e', hi: '#fff6d0' });
    this.X.seams.forEach((d, i) => this.G.wire(d, { key: i, w: 3 }));
    this.cup = null;
  },
  frame(t) {
    const cup = this.cup || (this.cup = fullCup(this.A, this.B));
    const u = 1 - ease(t / 1.0);
    const glow = ease((t - 2.5) / 0.9);
    let svg = this.S.render(1).svg;
    if (glow > 0) svg += `<ellipse cx="800" cy="470" rx="${f(300 + 60 * glow)}" ry="${f(230 + 40 * glow)}" fill="url(#warmBloom)" opacity="${(0.85 * glow).toFixed(3)}"/>`;
    svg += u > 0.001 ? shardsSvg(this.X, cup, u, 'sb') : cup;
    let tip = null;
    if (t >= 1.0) {
      const G = this.G.render(clamp((t - 1.0) / 1.5));
      if (glow > 0) svg += `<g filter="url(#glowS)" opacity="${(0.9 * glow).toFixed(3)}">${G.svg}</g>`;
      svg += G.svg; tip = G.tip;
    }
    if (t >= 2.9) { const C = this.C.render(clamp((t - 2.9) / 0.9)); svg += C.svg; tip = tip || C.tip; }
    svg = DEFS + background() + cupG(svg); tip = mapTip(tip);
    return { svg, tip, zoom: 1.07 - 0.07 * ease(t / 4.5), zc: [800, 470] };
  },
  events() { return [{ t: 0.1, type: 'whoosh' }, { t: 0.95, type: 'pound' }, { t: 1.1, type: 'pluck', n: 2 }, { t: 2.4, type: 'swell' }, { t: 2.6, type: 'chime', hi: true }, { t: 2.8, type: 'finale' }]; },
});
