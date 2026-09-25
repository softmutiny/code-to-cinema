// code-to-cinema · awakening main: stop-motion poses (8/s, held keys), one black "pop" pose between shots,
// gate weave, film grain, dust, scratches, projector flicker, and the soundtrack timeline.
// FILM = { title, style: 'awakening', dur, text?: 'every Chinese glyph used in cards and plates' }
// SHOTS = [ {id, t0, t1, dark?, rain?, mood?, grainL?, pop?: false,
//            state(q, p) -> st,              q = pose inside the shot, p = global pose; keep values stepped (use key())
//            draw(S, st),                   S = the shot's <g>; build DOM with el / g / frag
//            joint?(st) -> string,          when it changes between two poses, a 'clack' is scheduled (amp: st.snap ? 1.4 : 1)
//            sounds?(a, b, t) -> [events],  a = this pose's state, b = the previous pose's state (b === a on the shot's first pose), t = seconds
//            snap: return st.snap = true from state() on a pose to make its clack louder
//            fade?(st) -> 0..1 } ]          extra dim to black at the end
const NP = Math.round(FILM.dur * PFPS);
const shotOfPose = (p) => { for (const s of SHOTS) if (p >= Math.round(s.t0 * PFPS) && p < Math.round(s.t1 * PFPS)) return s; return null; };
function state(p) {
  const s = shotOfPose(p);
  if (!s) return null;
  const p0 = Math.round(s.t0 * PFPS), p1 = Math.round(s.t1 * PFPS), q = p - p0;
  const st = s.state ? s.state(q, p) : {};
  st.p = p; st.q = q; st.shot = s;
  st.black = s.pop !== false && s !== SHOTS[SHOTS.length - 1] && p === p1 - 1;
  st.joint = s.joint ? s.joint(st) : '';
  return st;
}
function post(p, st) {
  const s = st.shot, dark = s.dark || st.black;
  const r = mk(p * 977 + 3);
  if (!dark) el('rect', { width: 1600, height: 900, filter: 'url(#grain)', opacity: 0.55, style: 'mix-blend-mode:multiply' }, root);
  el('rect', { width: 1600, height: 900, filter: 'url(#grainL)', opacity: dark ? 0.22 : (s.grainL ?? 0.08), style: 'mix-blend-mode:screen' }, root);
  const D = g(root);
  const nd = 6 + Math.floor(r() * 16);
  for (let i = 0; i < nd; i++) el('circle', { cx: f1(r() * 1600), cy: f1(r() * 900), r: f1(0.6 + r() * 2.2), fill: r() < 0.6 ? '#1b1417' : '#f3ede2', opacity: f1(0.3 + r() * 0.5) }, D);
  if (r() < 0.4) { const x = r() * 1600, y = r() * 900; el('path', { d: `M${f1(x)} ${f1(y)} q${f1(r() * 30 - 15)} ${f1(r() * 20)} ${f1(r() * 40 - 20)} ${f1(r() * 40)} t${f1(r() * 30 - 15)} ${f1(r() * 20)}`, fill: 'none', stroke: '#1b1417', 'stroke-width': 0.8, opacity: 0.6 }, D); }
  if (r() < 0.35) { const x = r() * 1600; el('line', { x1: f1(x), x2: f1(x + r() * 4 - 2), y1: f1(r() * 200), y2: f1(500 + r() * 400), stroke: r() < 0.5 ? '#f3ede2' : '#1b1417', 'stroke-width': f1(0.5 + r()), opacity: f1(0.25 + r() * 0.4) }, D); }
  el('rect', { width: 1600, height: 900, fill: 'url(#vigDark)', opacity: dark ? 0.8 : 0.45 }, root);
  let dim = r() < 0.14 ? 0.12 + r() * 0.14 : r() * 0.05;               // projector flicker
  if (s.fade) dim = Math.max(dim, s.fade(st));
  el('rect', { width: 1600, height: 900, fill: '#000', opacity: f1(Math.min(1, dim)) }, root);
}
const clear = (n) => { while (n.firstChild) n.removeChild(n.firstChild); };
window.renderPose = (p) => {
  clear(root);
  document.getElementById('grainT').setAttribute('seed', 11 + p * 7);
  document.getElementById('grainLT').setAttribute('seed', 5 + p * 13);
  document.getElementById('pencilT').setAttribute('seed', 2 + (p % 4));   // the pencil line boils on a 4-pose loop
  document.getElementById('steamT').setAttribute('seed', 4 + (p % 5));
  const st = state(p);
  if (st.black) { el('rect', { x: -20, y: -20, width: 1640, height: 940, fill: '#050304' }, root); post(p, st); return {}; }
  const jr = mk(p * 131 + 7);
  const S = g(root, { transform: `translate(${Math.round(jr() * 4 - 2)} ${Math.round(jr() * 4 - 2)})` });   // gate weave
  st.shot.draw(S, st);
  post(p, st);
  return {};
};
window.NPOSES = NP;
window.preloadFonts = async () => {
  const zh = FILM.text || '';
  const lat = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:;!?·—–…\'"()[]/&%+-×Nº№°℃#' + zh;   // FILM.text may add symbols
  await document.fonts.ready;
  await Promise.all([
    document.fonts.load('44px "IBM Plex Mono"', lat),
    document.fonts.load('500 44px "IBM Plex Mono"', lat),
    document.fonts.load('italic 600 46px "Cormorant Garamond"', lat),
    document.fonts.load('italic 500 18px "Cormorant Garamond"', 'abcdefghijklmnopqrstuvwxyz'),
    document.fonts.load('250px "Archivo Black"', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
    document.fonts.load('500 26px "Noto Serif SC"', zh || '醒'),
  ]);
  return [...new Set([...document.fonts].filter(x => x.status === 'loaded').map(x => x.family))];
};
window.timeline = () => {
  const ev = [], dt = 1 / PFPS;
  for (let p = 0; p < NP; p++) {
    const a = state(p), b = p > 0 ? state(p - 1) : null, t = p * dt;
    if (!a) continue;
    if (a.black) { ev.push({ t, type: 'pop' }); continue; }
    const first = !b || a.shot !== b.shot;
    if (first && p > 0) ev.push({ t, type: 'cut' });
    if (!first && a.joint && a.joint !== b.joint) ev.push({ t, type: 'clack', amp: a.snap ? 1.4 : 1 });
    if (a.shot.sounds) ev.push(...a.shot.sounds(a, first ? a : b, t));   // on a shot's first pose, b === a (so diffs are empty)
  }
  return {
    duration: FILM.dur, fps: PFPS, act: new Array(NP).fill(0),
    shots: SHOTS.map(s => [s.t0, s.t1]), moods: SHOTS.map(s => s.mood ?? 0), rain: SHOTS.map(s => !!s.rain),
    events: ev.sort((x, y) => x.t - y.t),
  };
};
