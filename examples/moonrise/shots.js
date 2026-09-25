// Moonrise: a 7-second, two-shot demo for the engraving style. Run it once to prove the setup works,
// then read it as the smallest complete example of FILM + SHOTS + Plate.
const FILM = { title: 'Moonrise', dur: 7.5, labels: ['LVX', 'LVNA'], finale: true };
const SHOTS = [];

// ---------- SHOT 0 · a lantern writes itself onto the page, then lights ----------
SHOTS.push({
  id: 0, t0: 0, t1: 3.5,
  cap: [{ a: 0.5, b: 3.5, en: 'Drawn in code, one stroke at a time.', zh: '用代码，一笔一笔画出来。' }],
  build() {
    const S = 2.2, LX = 800, LY = 560 - 78 * S; // lantern origin (bail top); its base sits on the table line
    const inLamp = (x, y) => x > LX - 24 * S && x < LX + 24 * S && y > LY - 4 && y < 560;
    const P = new Plate(10);
    P.keyFn = (x) => x; // hatching sweeps left → right
    P.tone((x, y) => {
      if (inLamp(x, y)) return 0;
      const d = Math.hypot(x - LX, (y - 470) * 1.25);
      const room = 0.1 + 0.75 * sm(110, 760, d) + 0.14 * (fbm(x / 90, y / 90) - 0.5);
      return clamp(y > 560 ? Math.max(room, 0.55 + 0.2 * fbm(x / 60, y / 14, 3)) : room);
    }, { angs: [0.35, 1.35, -0.15], sp: 5, wave: 2, w: 0.8 });
    P.line([[70, 562], [700, 556], [1530, 560]], { w: 1.8, key: 0 });
    P.line([[70, 600], [1530, 596]], { w: 0.9, key: 200 });
    this.P = P; this.LT = lanternPlate(S, 13); this.LX = LX; this.LY = LY; this.S = S;
  },
  frame(t) {
    const base = this.P.render(clamp(t / 2.2));
    const lp = this.LT.plate.render(clamp((t - 0.7) / 1.5));
    let svg = base.svg + `<g transform="${tf(this.LX, this.LY)}">${lp.svg}</g>`;
    let tip = base.tip || (lp.tip && [lp.tip[0] + this.LX, lp.tip[1] + this.LY, lp.tip[2]]);
    if (t > 2.3) { svg += lanternGlow(this.LX, this.LY + this.LT.flame[1], 300, clamp((t - 2.3) / 0.4), Math.sin(t * 23)); tip = null; }
    return { svg, tip };
  },
  events() { return [{ t: 2.3, type: 'lamp' }]; },
});

// ---------- SHOT 1 · moon over hills, slow push in ----------
SHOTS.push({
  id: 1, t0: 3.5, t1: 7.5,
  cap: [{ a: 0.4, b: 4, en: 'And then, it moves.', zh: '然后，它动起来。' }],
  build() {
    const MX = 1120, MY = 230, MR = 78;
    const far = (x) => 470 + 46 * Math.sin(x / 180 + 2) + 30 * fbm(x / 150, 7);
    const near = (x) => 540 + 58 * Math.sin(x / 260) + 44 * fbm(x / 200, 1);
    const P = new Plate(20);
    P.keyFn = (x, y) => y * 0.3 + x; // top-left first
    P.tone((x, y) => {
      const d = Math.hypot(x - MX, y - MY);
      if (d < MR) return 0;
      if (y > near(x)) return 0.78 + 0.12 * fbm(x / 70, y / 30, 2);
      if (y > far(x)) return 0.52 + 0.1 * fbm(x / 90, y / 40, 4);
      return (0.2 + 0.5 * (1 - y / 716)) * sm(MR + 10, MR + 260, d);
    }, { angs: [0.1, 1.2, -0.45], sp: 5, wave: 2.5, w: 0.8 });
    const curve = (fn) => { const p = []; for (let x = 70; x <= 1530; x += 20) p.push([x, fn(x)]); return p; };
    P.line(curve(far), { w: 1.2, key: 300 });
    P.line(curve(near), { w: 1.8, key: 400 });
    P.line(ellPts(MX, MY, MR, MR, 0, TAU, 48), { w: 1.6, key: MX });
    for (const [dx, dy, r] of [[-22, -14, 13], [18, 20, 9], [26, -26, 6]]) P.line(ellPts(MX + dx, MY + dy, r, r * 0.8, 0, TAU, 16), { w: 0.8, key: MX + 1, layer: 5 });
    this.P = P; this.MX = MX; this.MY = MY; this.MR = MR;
  },
  frame(t) {
    const base = this.P.render(clamp(t / 2.6));
    let svg = base.svg;
    if (t > 2.4) svg += `<circle cx="${this.MX}" cy="${this.MY}" r="${this.MR * 2.2}" fill="url(#star)" opacity="${(0.55 * clamp((t - 2.4) / 0.8)).toFixed(2)}"/>`;
    return { svg, tip: base.tip, zoom: 1 + 0.035 * sm(0, 4, t), zc: [this.MX, this.MY] };
  },
});
