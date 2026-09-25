// code-to-cinema · engine main: poses, camera, captions, post-processing, soundtrack timeline
// Expects the project file to define FILM = { title, dur, labels?: [] } and SHOTS = [ {id, t0, t1, cap, build(), frame(t), events()?, dark?, overlay?, blackAt?} ]
const DUR = FILM.dur, NP = Math.round(DUR * PFPS);
const root = document.getElementById('root');
let built = false;
function buildAll() { if (built) return; for (const s of SHOTS) s.build(); built = true; }
function shotAt(t) { for (const s of SHOTS) if (t >= s.t0 - 1e-9 && t < s.t1 - 1e-9) return s; return SHOTS[SHOTS.length - 1]; }
// hard cut + one black pose at the end of every shot except the last
function isBlack(p) { const t = p / PFPS, s = shotAt(t); if (s !== SHOTS[SHOTS.length - 1] && p === Math.round(s.t1 * PFPS) - 1) return true; return s.blackAt ? s.blackAt(t - s.t0) : false; }

// captions type on: English at 48 chars/s, Chinese follows at 22 chars/s
function caption(s, lt) {
  let o = '';
  for (const c of s.cap || []) {
    if (lt < c.a || lt >= c.b) continue;
    const u = lt - c.a;
    const n = Math.min(c.en.length, Math.ceil(u * 48 + 0.001));
    const nz = c.zh ? Math.min(c.zh.length, Math.max(0, Math.ceil((u - c.en.length / 48 * 0.6) * 22))) : 0;
    const fade = clamp((c.b - lt) / 0.2);
    o += `<g opacity="${fade.toFixed(2)}"><text class="serif" x="800" y="786" font-size="37" font-weight="600" text-anchor="middle" fill="${INK}">${esc(c.en.slice(0, n))}</text>`;
    if (nz > 0) o += `<text class="zh" x="800" y="832" font-size="22" font-weight="500" letter-spacing="3" text-anchor="middle" fill="#3a3032">${esc(c.zh.slice(0, nz))}</text>`;
    o += '</g>';
  }
  return o;
}

function renderPose(p) {
  buildAll();
  const t = p / PFPS, s = shotAt(t), lt = t - s.t0;
  // re-roll grain and pen wobble every pose: this is what makes the still "boil" like hand-drawn animation
  document.getElementById('grainT').setAttribute('seed', 11 + p * 7);
  document.getElementById('grainLT').setAttribute('seed', 5 + p * 13);
  document.getElementById('penT').setAttribute('seed', 2 + (p % 3));
  const r = mk(p * 977 + 3);
  if (isBlack(p)) { root.innerHTML = `<rect x="-10" y="-10" width="1620" height="920" fill="#0a0809"/>`; return { black: true }; }
  const fr = s.frame(lt);
  const jx = Math.round(r() * 4 - 2), jy = Math.round(r() * 3 - 1.5); // gate weave
  let cam = '';
  if (fr.cam) cam += `translate(0 ${f1(fr.cam)}) `;
  if (fr.zoom) cam += `translate(${fr.zc[0]} ${fr.zc[1]}) scale(${fr.zoom.toFixed(4)}) translate(${-fr.zc[0]} ${-fr.zc[1]})`;
  let out = `<g transform="translate(${jx} ${jy})">`;
  out += `<g clip-path="url(#plateClip)"><g transform="${cam}">${fr.under || ''}<g filter="url(#pen)">${fr.svg}</g>`;
  if (fr.tip) out += nib(fr.tip[0], fr.tip[1], !s.dark, fr.tip[2]);
  out += `</g></g>`;
  // plate border + running heads
  out += `<rect x="70" y="44" width="1460" height="672" fill="none" stroke="${INK}" stroke-width="2.4"/><rect x="61" y="35" width="1478" height="690" fill="none" stroke="${INK}" stroke-width="0.9"/>`;
  const label = (FILM.labels || [])[SHOTS.indexOf(s)] || '';
  out += `<text class="cinzel" x="1530" y="26" font-size="12" letter-spacing="4" text-anchor="end" fill="${INK}" opacity="0.75">${esc(label)}</text><text class="cinzel" x="70" y="26" font-size="12" letter-spacing="4" fill="${INK}" opacity="0.75">${esc(FILM.title.toUpperCase())}</text>`;
  if (s.overlay) out += s.overlay(lt);
  out += caption(s, lt);
  out += `</g>`;
  // post: grain, dust specks, the odd scratch, ink blot near the pen, vignette, exposure flicker
  out += `<rect width="1600" height="900" filter="url(#grain)" opacity="0.5" style="mix-blend-mode:multiply"/>`;
  out += `<rect width="1600" height="900" filter="url(#grainL)" opacity="0.06" style="mix-blend-mode:screen"/>`;
  const nd = 4 + Math.floor(r() * 10);
  for (let i = 0; i < nd; i++) out += `<circle cx="${f1(r() * 1600)}" cy="${f1(r() * 900)}" r="${f1(0.6 + r() * 1.8)}" fill="${r() < 0.7 ? INK : PAPERL}" opacity="${f1(0.3 + r() * 0.5)}"/>`;
  if (r() < 0.3) { const x = r() * 1600; out += `<line x1="${f1(x)}" x2="${f1(x + r() * 4 - 2)}" y1="${f1(r() * 200)}" y2="${f1(500 + r() * 400)}" stroke="${INK}" stroke-width="0.6" opacity="0.3"/>`; }
  if (fr.tip && r() < 0.18) { const bx = fr.tip[0] + (r() - 0.5) * 30, by = fr.tip[1] + (r() - 0.5) * 30 + (fr.cam || 0); out += `<circle cx="${f1(bx)}" cy="${f1(by)}" r="${f1(2 + r() * 4)}" fill="${s.dark ? CHALK : INK}" opacity="0.85" filter="url(#bleed)"/>`; }
  out += `<rect width="1600" height="900" fill="url(#vig)"/>`;
  const fl = r() < 0.12 ? 0.06 + r() * 0.08 : r() * 0.03;
  out += `<rect width="1600" height="900" fill="#000" opacity="${fl.toFixed(3)}"/>`;
  root.innerHTML = out;
  return { tip: !!fr.tip };
}
window.renderPose = renderPose;
window.NPOSES = NP;
// load every glyph the captions/plates use before the first screenshot (otherwise pose 0 renders in a fallback font)
window.preloadFonts = async () => {
  buildAll();
  const en = [], zh = [];
  for (const s of SHOTS) for (const c of s.cap || []) { en.push(c.en); if (c.zh) zh.push(c.zh); }
  await document.fonts.ready;
  await Promise.all([
    document.fonts.load('600 37px "Cormorant Garamond"', en.join('') || 'A'),
    document.fonts.load('italic 600 37px "Cormorant Garamond"', en.join('') || 'A'),
    document.fonts.load('600 30px "Cinzel"', (FILM.title + (FILM.labels || []).join('')).toUpperCase()),
    document.fonts.load('500 22px "Noto Serif SC"', zh.join('') || '中'),
  ]);
  return [...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family))];
};
// timeline for the soundtrack: shot bounds, drawing activity per pose (drives pen-scratch loudness), sound events
window.timeline = () => {
  buildAll();
  const ev = [], act = [];
  let prev = 0, prevShot = null;
  const orig = Plate.prototype.render;
  for (let p = 0; p < NP; p++) {
    const t = p / PFPS, s = shotAt(t);
    if (isBlack(p)) { act.push(0); ev.push({ t, type: 'cut' }); prev = 0; continue; }
    let drawn = 0;
    Plate.prototype.render = function (P) { const o = orig.call(this, P); drawn += o.drawn || 0; return o; };
    const fr = s.frame(t - s.t0);
    Plate.prototype.render = orig;
    const d = s !== prevShot ? 0 : Math.max(0, drawn - prev);
    act.push(fr.tip ? Math.min(1, d / 9000) + 0.15 : 0);
    prev = drawn; prevShot = s;
  }
  for (const s of SHOTS) for (const e of (s.events ? s.events() : [])) ev.push({ ...e, t: e.t + s.t0 });
  return { duration: DUR, fps: PFPS, act, shots: SHOTS.map(s => [s.t0, s.t1]), finale: !!FILM.finale, events: ev.sort((a, b) => a.t - b.t) };
};
