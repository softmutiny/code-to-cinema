// code-to-cinema · liyue main: poses, soft dissolves, camera, gold frame, poem captions, paper grain, soundtrack timeline
// FILM = { title, style: 'liyue', dur, labels?: [], finale?, text?: 'extra glyphs used inside plates' }
// SHOTS = [ {id, t0, t1, cap: [{a, b, zh, en}], dark?, build(), frame(t) -> {svg, tip?, zoom?, zc?, pan?:[x,y]}, events()?} ]
const DUR = FILM.dur, NP = Math.round(DUR * PFPS), DISS = 3 / PFPS;
const root = document.getElementById('root');
let built = false;
function buildAll() { if (built) return; for (const s of SHOTS) seeded(1000 + s.id * 97, () => s.build()); built = true; }
function shotAt(t) { for (const s of SHOTS) if (t >= s.t0 - 1e-9 && t < s.t1 - 1e-9) return s; return SHOTS[SHOTS.length - 1]; }

// a poem line appears one character at a time (each character inks in), the English follows as a whisper
function caption(s, lt) {
  let o = '';
  for (const c of s.cap || []) {
    if (lt < c.a || lt >= c.b) continue;
    const u = lt - c.a, fade = clamp((c.b - lt) / 0.35);
    const zh = [...c.zh], rate = c.rate || 7, n = zh.length;
    const size = c.size || 46, ls = c.ls ?? 10, y = c.y || 812;
    const cw = size + ls, x0 = 800 - (n * cw - ls) / 2 + size / 2;
    const dark = s.dark, colZ = dark ? '#fff6de' : '#5b3f6a', colE = dark ? '#eadff6' : '#8a6a9a';
    o += `<g opacity="${fade.toFixed(3)}">`;
    zh.forEach((ch, i) => {
      const e = clamp((u - i / rate) / 0.32); if (e <= 0) return;
      const dy = (1 - ease(e)) * 6;
      o += `<text class="zh" x="${f(x0 + i * cw)}" y="${f(y + dy)}" font-size="${size}" text-anchor="middle" fill="${colZ}" opacity="${ease(e).toFixed(3)}">${esc(ch)}</text>`;
    });
    if (c.en) { const e = ease((u - n / rate - 0.15) / 0.6); if (e > 0) o += `<text class="cg" font-style="italic" font-weight="500" x="800" y="${y + 40}" font-size="${c.enSize || 22}" letter-spacing="1" text-anchor="middle" fill="${colE}" opacity="${e.toFixed(3)}">${esc(c.en)}</text>`; }
    o += `</g>`;
  }
  return o;
}
function frameOf(s, lt) {
  const fr = s.frame(lt) || {};
  let cam = '';
  if (fr.pan) cam += `translate(${f(fr.pan[0])} ${f(fr.pan[1])}) `;
  if (fr.zoom && fr.zoom !== 1) cam += `translate(${fr.zc[0]} ${fr.zc[1]}) scale(${fr.zoom.toFixed(4)}) translate(${-fr.zc[0]} ${-fr.zc[1]})`;
  let g = `<g transform="${cam}">${fr.svg}`;
  if (fr.tip) g += spark(fr.tip[0], fr.tip[1], lt);
  g += `</g>`;
  if (fr.over) g += fr.over; // un-zoomed overlay (title cards etc.)
  return { g, fr };
}
function renderPose(p) {
  buildAll();
  const t = p / PFPS, s = shotAt(t), lt = t - s.t0, si = SHOTS.indexOf(s);
  document.getElementById('grainT').setAttribute('seed', 3 + p * 11);
  UID = 0;
  let out = '';
  const cur = frameOf(s, lt);
  if (si > 0 && lt < DISS - 1e-6) { // soft dissolve from the previous shot's last image
    const pv = SHOTS[si - 1], prev = frameOf(pv, pv.t1 - pv.t0 - 1 / PFPS);
    out += prev.g + `<g opacity="${((lt + 1 / PFPS) / (DISS + 1 / PFPS)).toFixed(3)}">${cur.g}</g>`;
  } else out += cur.g;
  // caption scrim + captions
  const hasCap = (s.cap || []).some(c => lt >= c.a - 0.3 && lt < c.b + 0.2);
  if (hasCap && !s.noScrim) out += `<rect x="0" y="690" width="1600" height="210" fill="url(#${s.dark ? 'capScrimD' : 'capScrim'})"/>`;
  out += caption(s, lt);
  // post: paper grain that breathes, a soft vignette, the gold frame
  out += `<rect width="1600" height="900" filter="url(#grainM)" opacity="${s.dark ? 0.1 : 0.16}"/>`;
  out += `<rect width="1600" height="900" fill="url(#vigL)"/>`;
  out += `<rect x="14" y="14" width="1572" height="872" fill="none" stroke="url(#goldH)" stroke-width="2.2"/><rect x="22" y="22" width="1556" height="856" fill="none" stroke="${GOLD}" stroke-width="0.8"/>`;
  for (const [x, y] of [[14, 14], [1586, 14], [14, 886], [1586, 886]]) out += rosette(x, y, 0.8);
  const label = (FILM.labels || [])[si] || '';
  const hc = s.dark ? '#f3e2b0' : '#a07a3e';
  out += `<text class="ns" x="42" y="50" font-size="13" letter-spacing="6" fill="${hc}" opacity="0.8">${esc(FILM.title)}</text>`;
  out += `<text class="ns" x="1558" y="50" font-size="13" letter-spacing="6" text-anchor="end" fill="${hc}" opacity="0.8">${esc(label)}</text>`;
  root.innerHTML = out;
  return { tip: !!cur.fr.tip };
}
window.renderPose = renderPose;
window.NPOSES = NP;
window.preloadFonts = async () => {
  buildAll();
  const en = [], zh = [];
  for (const s of SHOTS) for (const c of s.cap || []) { if (c.en) en.push(c.en); zh.push(c.zh); }
  await document.fonts.ready;
  await Promise.all([
    document.fonts.load('46px "ZCOOL XiaoWei"', zh.join('') + (FILM.text || '') || '月'),
    document.fonts.load('italic 500 22px "Cormorant Garamond"', en.join('') || 'A'),
    document.fonts.load('500 13px "Noto Serif SC"', FILM.title + (FILM.labels || []).join('') + (FILM.text || '')),
    document.fonts.load('500 12px "Cinzel"', 'MID AUTUMN · 0123456789'),
  ]);
  return [...new Set([...document.fonts].filter(x => x.status === 'loaded').map(x => x.family))];
};
// soundtrack timeline: shot bounds, wire-laying activity per pose, sound events
window.timeline = () => {
  buildAll();
  const ev = [], act = [];
  for (let p = 0; p < NP; p++) {
    const t = p / PFPS, s = shotAt(t);
    const fr = s.frame(t - s.t0) || {};
    act.push(fr.tip ? 1 : 0);
  }
  for (const s of SHOTS) for (const e of (s.events ? s.events() : [])) ev.push({ ...e, t: e.t + s.t0 });
  return { duration: DUR, fps: PFPS, act, shots: SHOTS.map(s => [s.t0, s.t1]), moods: SHOTS.map(s => s.mood ?? 1), finale: !!FILM.finale, events: ev.sort((a, b) => a.t - b.t) };
};
