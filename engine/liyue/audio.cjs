// usage: node liyue/audio.cjs <projectDir>   reads <projectDir>/timeline.json, writes <projectDir>/audio.wav (48 kHz, 16-bit stereo)
// The liyue (pastel cloisonné) score, all synthesized and all original:
//   pad      : a soft D-gong pentatonic chord whose level follows each shot's mood (mood 0 = silence)
//   guzheng  : plucked strings with a little press-vibrato; a short original motif is phrased over the shots,
//              and every {type:'pluck', n} event plays scale degree n (D E F# A B D')
//   shimmer  : a faint glassy sizzle while gold wire is being laid (timeline act)
//   events   : chime, axe, pound, drip, shatter, whoosh, bell, finale (swell is carried by the pad)
//   room     : a small Schroeder reverb over everything
const fs = require('fs');
const path = require('path');
const DIR = path.resolve(process.argv[2] || '.');
const tl = JSON.parse(fs.readFileSync(path.join(DIR, 'timeline.json'), 'utf8'));
const SR = 48000, DUR = tl.duration + 0.3, N = Math.ceil(DUR * SR);
const L = new Float32Array(N), R = new Float32Array(N), S = new Float32Array(N); // S = reverb send (mono)
let seed = 1227;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const noise = () => rnd() * 2 - 1;
const TAU = Math.PI * 2;
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
function biquad(type, f0, Q) {
  const w = TAU * f0 / SR, c = Math.cos(w), s = Math.sin(w), a = s / (2 * Q);
  let b0, b1, b2; const a0 = 1 + a, a1 = -2 * c, a2 = 1 - a;
  if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; }
  else if (type === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2; }
  else { b0 = a; b1 = 0; b2 = -a; }
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x) => { const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; };
}
const add = (i, v, pan = 0, send = 0.3) => { if (i < 0 || i >= N) return; L[i] += v * Math.min(1, 1 - pan); R[i] += v * Math.min(1, 1 + pan); S[i] += v * send; };
const shots = tl.shots, act = tl.act, FPS = tl.fps, moods = tl.moods || shots.map(() => 1);
const shotIdx = (t) => { for (let i = 0; i < shots.length; i++) if (t >= shots[i][0] && t < shots[i][1]) return i; return shots.length - 1; };
const actAt = (t) => { const p = t * FPS, i = Math.floor(p), f = p - i; const a = act[i] || 0, b = act[i + 1] || 0; return a + (b - a) * f; };
const SCALE = [62, 64, 66, 69, 71, 74, 76, 78]; // D4 E4 F#4 A4 B4 D5 E5 F#5

// ---------- guzheng pluck ----------
function pluck(t, m, amp = 0.3, pan = 0, o = {}) {
  const f = hz(m), i0 = Math.floor(t * SR), dur = o.dur || 2.6, n = Math.floor(dur * SR);
  const H = 9, ph = new Float64Array(H + 1), pos = 0.18 + rnd() * 0.06;
  const hA = [], hT = [];
  for (let h = 1; h <= H; h++) { hA[h] = Math.abs(Math.sin(Math.PI * h * pos)) / Math.pow(h, 1.1); hT[h] = (o.decay || 1.6) / Math.pow(h, 0.75); }
  const click = biquad('bp', 2800, 1.2), vibD = o.vib ?? 0.005, bend = o.bend || 0;
  for (let k = 0; k < n; k++) {
    const tt = k / SR;
    // a hair sharp at the strike, then settles; press-vibrato (揉弦) blooms after 0.35 s; optional 滑音 bend up by `bend` semitones
    let fm = 1 + 0.01 * Math.exp(-tt / 0.025) + vibD * Math.min(1, Math.max(0, (tt - 0.35) / 0.5)) * Math.sin(TAU * 5.4 * tt);
    if (bend) fm *= Math.pow(2, bend * Math.min(1, Math.max(0, (tt - 0.18) / 0.22)) / 12);
    let v = 0;
    for (let h = 1; h <= H; h++) { ph[h] += TAU * f * h * fm * (1 + 0.0007 * h * h) / SR; v += Math.sin(ph[h]) * hA[h] * Math.exp(-tt / hT[h]); }
    v *= Math.min(1, k / 40);
    if (k < 0.012 * SR) v += click(noise()) * 0.6 * Math.exp(-tt / 0.003);
    add(i0 + k, v * amp, pan, 0.35);
  }
}
// ---------- struck metal: chime / bell (inharmonic partials) ----------
function bellish(t, f, amp, pan, parts, send = 0.5) {
  const i0 = Math.floor(t * SR), n = Math.floor(Math.max(...parts.map(p => p[2])) * 5 * SR);
  const ph = parts.map(() => rnd() * TAU);
  for (let k = 0; k < n; k++) {
    const tt = k / SR; let v = 0;
    parts.forEach(([r, a, d], j) => { ph[j] += TAU * f * r / SR; v += Math.sin(ph[j]) * a * Math.exp(-tt / d); });
    add(i0 + k, v * amp * Math.min(1, k / 30), pan, send);
  }
}
function burst(t, o) {
  const i0 = Math.floor(t * SR), n = Math.floor((o.dur || 0.05) * SR);
  const f = o.bp ? biquad('bp', o.bp, o.q || 2) : null, hp = o.hp ? biquad('hp', o.hp, 0.7) : null, lp = o.lp ? biquad('lp', o.lp, 0.7) : null;
  const nd = (o.nd || 0.004) * SR, att = (o.att || 0) * SR;
  for (let k = 0; k < n; k++) {
    const tt = k / SR; let x = noise() * Math.exp(-k / nd) * (att ? Math.min(1, k / att) : 1);
    if (f) x = f(x); if (hp) x = hp(x); if (lp) x = lp(x);
    let v = x * (o.na ?? 1);
    for (const [fr, am, dc] of (o.partials || [])) v += Math.sin(TAU * fr * tt) * am * Math.exp(-tt / dc) * (att ? Math.min(1, k / att) : 1);
    add(i0 + k, v * o.amp, o.pan || 0, o.send ?? 0.3);
  }
}

// ---------- pad: D-gong chord, level follows the shot's mood ----------
{
  const notes = [50, 57, 62, 64, 69, 74], ph = notes.map(() => [rnd() * TAU, rnd() * TAU]);
  const lp = biquad('lp', 1400, 0.6);
  let g = 0;
  const swellAt = (tl.events.find(e => e.type === 'swell') || {}).t ?? 1e9;
  const fin = tl.finale ? shots[shots.length - 1][0] : 1e9;
  for (let i = 0; i < N; i++) {
    const t = i / SR, si = shotIdx(t);
    let target = 0.55 * moods[si];
    if (t > swellAt) target += 0.45 * Math.min(1, (t - swellAt) / 1.5);
    if (t > fin) target *= Math.max(0.35, 1 - (t - fin) / 4);          // yield to the finale chord
    g += (target - g) * (target < g ? 0.00012 : 0.00004);                 // falls fast (shot 4 goes quiet), rises slow
    let v = 0;
    notes.forEach((m, k) => { const f = hz(m); ph[k][0] += TAU * f / SR; ph[k][1] += TAU * f * 1.004 / SR; v += (Math.sin(ph[k][0]) + 0.5 * Math.sin(ph[k][1]) + 0.12 * Math.sin(3 * ph[k][0])) * (k < 2 ? 0.9 : 0.55); });
    v = lp(v) * 0.05 * g * (1 + 0.12 * Math.sin(TAU * 0.13 * t)) * Math.min(1, t / 2);
    add(i, v, 0.15 * Math.sin(TAU * 0.04 * t), 0.5);
  }
}
// ---------- the motif: an original phrase in D gong, placed over the shots ----------
{
  const P1 = [[0, 69], [0.5, 71], [1.0, 74], [2.0, 71], [2.5, 69], [3.0, 66, 0, 1.2]];
  const P2 = [[0, 66], [0.5, 69], [1.0, 71], [1.5, 69], [2.5, 64, 2], [3.25, 62]];
  const P3 = [[0, 74], [0.75, 76], [1.5, 74, 0], [2.25, 71], [3.0, 69, 2]];
  const plan = [[1.2, P1, 0.16], [7.6, P2, 0.14], [14.3, P1, 0.13], [17.4, P2, 0.12], [21.0, P3, 0.14],
    [34.2, P2, 0.1], [37.6, P1, 0.12], [41.0, P3, 0.15], [44.6, P1, 0.17], [49.0, P3, 0.17], [52.4, P2, 0.14]];
  for (const [t0, P, a] of plan) for (const [dt, m, bend, dec] of P) pluck(t0 + dt, m, a, (rnd() - 0.5) * 0.4, { bend: bend || 0, decay: dec ? 1.6 * dec : 1.6 });
  // a low root under each phrase
  for (const [t0, , a] of plan) { pluck(t0, 50, a * 0.8, -0.1, { decay: 2.4, vib: 0.002 }); pluck(t0 + 1.5, 57, a * 0.5, 0.1, { decay: 2.2, vib: 0.002 }); }
}
// ---------- shimmer while wire is laid ----------
{
  const bp = biquad('bp', 7000, 1.4), bp2 = biquad('bp', 4200, 3);
  let env = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR, a = actAt(t);
    env += (a - env) * 0.0015;
    if (env < 0.002) continue;
    const x = noise();
    add(i, (bp(x) * 0.35 + bp2(x) * 0.25) * env * (0.6 + 0.4 * Math.sin(TAU * 9 * t)) * 0.12, 0.3 * Math.sin(TAU * 0.4 * t), 0.4);
    if (i % 2400 === 0 && rnd() < 0.5 * env) bellish(t, hz(SCALE[5 + Math.floor(rnd() * 3)]) * 2, 0.02, (rnd() - 0.5) * 0.8, [[1, 1, 0.12], [2.76, 0.3, 0.06]], 0.6);
  }
}
// ---------- events ----------
for (const e of tl.events) {
  const t = e.t, p = (rnd() - 0.5) * 0.5;
  switch (e.type) {
    case 'pluck': pluck(t, SCALE[Math.max(0, Math.min(SCALE.length - 1, e.n | 0))], 0.3, p, { bend: e.n === 1 || e.n === 4 ? 0 : 0 }); break;
    case 'chime': { const f = hz(e.hi ? 90 : 86); bellish(t, f, 0.1, p, [[1, 1, 0.9], [2.76, 0.45, 0.45], [5.4, 0.25, 0.22], [8.9, 0.1, 0.1]]); break; }
    case 'axe': burst(t, { amp: 0.35, lp: 500, nd: 0.02, dur: 0.25, na: 2, partials: [[140, 0.5, 0.06], [260, 0.2, 0.04]], pan: 0.4 }); burst(t, { amp: 0.15, hp: 2500, nd: 0.004, dur: 0.05, pan: 0.4 }); break;
    case 'pound': burst(t, { amp: 0.16, lp: 700, nd: 0.01, dur: 0.12, na: 1.5, partials: [[300, 0.3, 0.03]], pan: 0.1 }); break;
    case 'drip': {
      const i0 = Math.floor(t * SR), n = Math.floor(0.25 * SR), f0 = e.hi ? 1100 : 750; let ph = 0;
      for (let k = 0; k < n; k++) { const tt = k / SR; ph += TAU * f0 * (1 + 1.2 * (1 - Math.exp(-tt / 0.03))) / SR; add(i0 + k, Math.sin(ph) * Math.exp(-tt / 0.05) * 0.35, 0, 0.7); }
      break;
    }
    case 'shatter': {
      for (let k = 0; k < 16; k++) { const tt = t + rnd() * 0.5, b = 2200 + rnd() * 3000; bellish(tt, b, 0.05 + rnd() * 0.05, (rnd() - 0.5) * 1.2, [[1, 1, 0.08], [1.73, 0.5, 0.05], [2.61, 0.3, 0.03]], 0.6); }
      burst(t, { amp: 0.2, hp: 3000, nd: 0.02, dur: 0.2, send: 0.6 });
      break;
    }
    case 'whoosh': burst(t, { amp: 0.22, bp: 900, q: 0.8, nd: 0.35, att: 0.4, dur: 1.2, send: 0.5 }); break;
    case 'bell': bellish(t, hz(38), 0.35, 0, [[1, 1, 3.5], [2.0, 0.5, 2.5], [2.76, 0.4, 1.8], [5.4, 0.2, 0.9], [0.5, 0.5, 4]], 0.6); break;
    case 'finale': {
      const notes = [50, 57, 62, 66, 69, 76], end = tl.duration, ph = notes.map(() => [rnd() * TAU, rnd() * TAU]);
      const i0 = Math.floor(t * SR), i1 = N;
      for (let i = i0; i < i1; i++) {
        const tt = i / SR, u = tt - t, env = Math.min(1, u / 1.4) * Math.max(0, Math.min(1, (end + 0.25 - tt) / 1.8));
        let v = 0;
        notes.forEach((m, k) => { const f = hz(m); ph[k][0] += TAU * f * (1 + 0.002 * Math.sin(TAU * 4.8 * tt + k)) / SR; ph[k][1] += TAU * f * 1.003 / SR; v += (Math.sin(ph[k][0]) + 0.3 * Math.sin(2 * ph[k][0]) + 0.5 * Math.sin(ph[k][1])) / (1 + k * 0.2); });
        add(i, v * env * 0.05, 0.05 * Math.sin(TAU * 0.3 * tt), 0.5);
      }
      // the motif's head, once more, high and slow
      [[0.4, 74], [1.1, 76], [1.8, 78], [2.9, 81]].forEach(([dt, m]) => pluck(t + dt, m, 0.14, (rnd() - 0.5) * 0.6, { decay: 2.2 }));
      break;
    }
  }
}
// ---------- room: 4 combs + 2 allpasses on the send, spread to stereo ----------
{
  const combs = [1557, 1617, 1491, 1422].map(d => ({ b: new Float32Array(Math.round(d * SR / 44100)), i: 0, lp: 0 }));
  const aps = [556, 441].map(d => ({ b: new Float32Array(Math.round(d * SR / 44100)), i: 0 }));
  const fb = 0.83, damp = 0.3, off = Math.round(0.011 * SR);
  const out = new Float32Array(N);
  for (let n = 0; n < N; n++) {
    const x = S[n] * 0.2; let y = 0;
    for (const c of combs) { const o = c.b[c.i]; c.lp = o * (1 - damp) + c.lp * damp; c.b[c.i] = x + c.lp * fb; c.i = (c.i + 1) % c.b.length; y += o; }
    for (const a of aps) { const o = a.b[a.i]; const v = -y + o; a.b[a.i] = y + o * 0.5; a.i = (a.i + 1) % a.b.length; y = v; }
    out[n] = y;
  }
  for (let n = 0; n < N; n++) { L[n] += out[n] * 0.9; R[n] += (n >= off ? out[n - off] : 0) * 0.9; }
}
// ---------- master ----------
let peak = 0;
for (let i = 0; i < N; i++) { const t = i / SR, f = Math.min(1, Math.max(0, (DUR - t) / 0.8)) * Math.min(1, t / 0.05); L[i] = Math.tanh(L[i] * 1.1) * f; R[i] = Math.tanh(R[i] * 1.1) * f; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
const g = 0.891 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), 46 + i * 4); }
fs.writeFileSync(path.join(DIR, 'audio.wav'), buf);
console.log('audio.wav', DUR.toFixed(2) + 's', 'peak before norm', peak.toFixed(3), 'events', tl.events.length);
