// THE TYPEWRITER: an 8-second demo of the awakening style. Nobody is in the room; an old typewriter
// starts itself, a gear turns, a page fills, and the title slams in. Copy this file to start your own film.
const FILM = { title: 'The Typewriter', style: 'awakening', dur: 8, text: '没有人碰它。它自己写完了。' };
const EN1 = 'Nobody touched it.';
const ZH1 = '没有人碰它。';
const PAGE = ['the room was empty', 'the ink was dry', 'and still, a line —'];

// the machine, drawn in pencil: body, platen, a paper sheet, rows of keys, a side gear
function typewriter(S, st) {
  const M = g(S, { filter: 'url(#pencil)', transform: `translate(800 ${600 + st.jolt}) scale(1.45)` });
  // paper sheet rising out of the platen, typed lines on it
  const ph = 120 + st.lines * 34;
  el('rect', { x: -150, y: -150 - ph, width: 300, height: ph + 20, fill: IVORY, stroke: INK, 'stroke-width': 1.4 }, M);
  PAGE.forEach((line, i) => {
    const n = i < st.lines ? line.length : i === st.lines ? st.nch : 0;
    if (n) el('text', { class: 'mono', x: -128, y: -150 - ph + 40 + i * 34, 'font-size': 17, fill: INK, text: line.slice(0, n), 'xml:space': 'preserve' }, M);
  });
  // platen + carriage (slides left as it types)
  const cx = -st.carriage;
  el('rect', { x: -230 + cx, y: -150, width: 460, height: 44, rx: 22, fill: SMOKE, stroke: INK, 'stroke-width': 1.6 }, M);
  el('rect', { x: -230 + cx, y: -150, width: 460, height: 44, rx: 22, fill: 'url(#hatch)', opacity: 0.5 }, M);
  for (const s of [-1, 1]) el('circle', { cx: s * 250 + cx, cy: -128, r: 20, fill: 'url(#silver)', stroke: INK, 'stroke-width': 1.4 }, M);
  el('path', { d: `M${-262 + cx} -128 l-50 -30`, stroke: INK, 'stroke-width': 4, 'stroke-linecap': 'round' }, M);   // return lever
  // body
  el('path', { d: 'M-260 -100 L260 -100 L300 120 L-300 120 Z', fill: PLUM, stroke: INK, 'stroke-width': 1.8 }, M);
  el('path', { d: 'M-260 -100 L260 -100 L300 120 L-300 120 Z', fill: 'url(#xhatch)', opacity: 0.35 }, M);
  el('rect', { x: -90, y: -86, width: 180, height: 26, fill: IVORY, stroke: INK }, M);
  el('text', { class: 'mono', x: 0, y: -68, 'font-size': 12, 'letter-spacing': 3, 'text-anchor': 'middle', fill: WINE, text: 'Nº 1911' }, M);
  // type bars fanning up to the strike point; the one that just struck is raised
  for (let i = 0; i < 17; i++) {
    const a = -PI / 2 + (i - 8) * 0.09, up = i === st.bar;
    const r0 = 150, r1 = up ? 40 : 110;
    el('line', { x1: f1(Math.cos(a) * r0), y1: f1(-10 + Math.sin(a) * r0), x2: f1(Math.cos(a) * r1 * 0.5), y2: f1(up ? -100 : -40), stroke: up ? WINE : INK, 'stroke-width': up ? 2.6 : 1.4 }, M);
  }
  // keys: three rows, the pressed one sinks
  let k = 0;
  for (let row = 0; row < 3; row++) for (let i = 0; i < 11 - row; i++, k++) {
    const x = (i - (10 - row) / 2) * 44, y = 20 + row * 34, down = k === st.key;
    el('circle', { cx: f1(x), cy: y + (down ? 5 : 0), r: 15, fill: down ? WINE : IVORY, stroke: INK, 'stroke-width': 1.4 }, M);
  }
  // a gear on the side that ticks as it types
  gear(M, 330, 40, 46, 12, st.gear, 'url(#brass)', 5);
  gear(M, 392, -20, 26, 8, -st.gear * 1.7, 'url(#silver)', 4);
}

const SHOTS = [];
SHOTS.push({ id: 'open', t0: 0, t1: 2.5, dark: true, mood: 0,
  state: (q) => ({ nch: q < 2 ? 0 : Math.min(EN1.length, (q - 1) * 2), nzh: q < 13 ? 0 : Math.min(ZH1.length, (q - 12) * 3), cursor: ((q >> 1) % 2) === 0 }),
  draw(S, st) {
    el('rect', { x: -20, y: -20, width: 1640, height: 940, fill: '#120e10' }, S);
    el('ellipse', { cx: 800, cy: 450, rx: 760, ry: 470, fill: 'url(#beam)', opacity: f1(0.55 + mk(st.p * 17)() * 0.35) }, S);
    const probe = el('text', { class: 'mono', 'font-size': 44, text: EN1, opacity: 0 }, S);
    const w = probe.getComputedTextLength(), x0 = 800 - w / 2, cw = w / EN1.length;
    el('text', { class: 'mono', x: f1(x0), y: 440, 'font-size': 44, 'font-weight': 500, fill: IVORY, text: EN1.slice(0, st.nch), 'xml:space': 'preserve' }, S);
    if (st.cursor && st.nzh < ZH1.length) el('rect', { x: f1(x0 + cw * st.nch + 4), y: 404, width: f1(cw * 0.7), height: 44, fill: WINE }, S);
    if (st.nzh) el('text', { class: 'zh', x: 800, y: 510, 'font-size': 26, 'letter-spacing': 6, 'text-anchor': 'middle', fill: LILAC, text: ZH1.slice(0, st.nzh) }, S);
  },
  sounds(a, b, t) {
    const ev = [];
    for (let i = 0; i < a.nch - b.nch; i++) if (EN1[b.nch + i] !== ' ') ev.push({ t: t + i / 16 + 0.01, type: 'type', amp: 1 });
    for (let i = 0; i < a.nzh - b.nzh; i++) ev.push({ t: t + i / 24, type: 'type', amp: 0.6 });
    return ev;
  } });
SHOTS.push({ id: 'machine', t0: 2.5, t1: 6, mood: 0.6,
  state(q) {
    // typing speeds up: characters per pose follow uneven keys, so it feels hand-moved
    const typed = key(q, [[0, 0], [3, 1], [5, 3], [6, 5], [8, 9], [9, 14], [11, 20], [12, 27], [14, 36], [15, 42], [17, 49], [18, 52]]);
    let lines = 0, left = typed;
    while (lines < PAGE.length && left >= PAGE[lines].length) left -= PAGE[lines++].length;
    const nch = lines < PAGE.length ? left : 0;
    return { typed, lines, nch, carriage: nch * 9, key: (typed * 7) % 30, bar: typed % 17, gear: typed * 15, jolt: q === 0 ? 0 : (typed % 2 ? 1 : -1),
      capN: q >= 22 ? 2 : q >= 18 ? 1 : 0 };
  },
  joint: (st) => 'k' + st.typed,
  draw(S, st) {
    paperBg(S);
    el('rect', { x: -20, y: -20, width: 1640, height: 940, fill: 'url(#vig)' }, S);
    typewriter(S, st);
    frag(S, `<text class="mono" x="48" y="58" font-size="12" letter-spacing="2.5" fill="${INK}">PL. I — A MACHINE, ${st.typed ? 'ATTENDED BY NO ONE' : 'UNATTENDED'}</text>`);
    if (st.capN) card(S, 56, 640, ['It wrote anyway.'], ['它自己写完了。'], { en: 1, zh: st.capN >= 2 }, -1.2);
  },
  sounds: (a, b, t) => {
    const ev = [];
    for (let i = 0; i < a.typed - b.typed; i++) ev.push({ t: t + i * 0.125 / Math.max(1, a.typed - b.typed), type: 'type', amp: 0.9 });
    if (a.gear !== b.gear) ev.push({ t: t + 0.03, type: 'tick' });
    if (a.lines > b.lines) ev.push({ t: t + 0.05, type: 'thud' });
    return ev;
  } });
SHOTS.push({ id: 'title', t0: 6, t1: 8, mood: 1,
  state: (q) => ({ slam: q === 1, on: q >= 1, sc: q === 1 ? 1.3 : 1, shake: key(q, [[0, [0, 0]], [2, [14, -9]], [3, [-8, 6]], [4, [4, -2]], [5, [0, 0]]]) }),
  draw(S, st) {
    paperBg(S);
    if (!st.on) return;
    const [sx, sy] = st.shake;
    const T = g(S, { transform: `translate(${800 + sx} ${450 + sy}) scale(${st.sc}) translate(-800 -450)`, style: 'mix-blend-mode:multiply' });
    for (const [dx, dy, fill, op] of [[9, 6, LILAC, 0.7], [0, 0, WINE, 0.93]])
      el('text', { class: 'black', x: 800 + dx, y: 540 + dy, 'font-size': 250, 'text-anchor': 'middle', textLength: 1300, lengthAdjust: 'spacingAndGlyphs', fill, opacity: op, text: 'IT WRITES' }, T);
    if (st.q === 1) el('rect', { x: -20, y: -20, width: 1640, height: 940, fill: '#fffaf0', opacity: 0.45 }, S);
  },
  sounds: (a, b, t) => a.slam ? [{ t, type: 'slam' }] : [],
  fade: (st) => st.q >= 11 ? (st.q - 10) / 6 : 0 });
