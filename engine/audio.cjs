// usage: node audio.cjs <projectDir>   reads <projectDir>/timeline.json, writes <projectDir>/audio.wav (48 kHz, 16-bit stereo)
// Layers: low drone that sinks shot by shot + pen-nib scratching that follows how much ink is being laid down each pose
// + one-shot events requested by shots (see the switch below) + optional rising chord over the last shot (FILM.finale).
const fs = require('fs');
const path = require('path');
const DIR = path.resolve(process.argv[2] || '.');
const tl = JSON.parse(fs.readFileSync(path.join(DIR, 'timeline.json'), 'utf8'));
{ const known = new Set([...fs.readFileSync(__filename, 'utf8').matchAll(/case '(\w+)'/g)].map(m => m[1])), bad = [...new Set(tl.events.map(e => e.type).filter(t => !known.has(t)))]; if (bad.length) console.warn('unknown sound event(s), they will be silent:', bad.join(', ')); }
const SR = 48000, DUR = tl.duration + 0.3, N = Math.ceil(DUR * SR);
const L = new Float32Array(N), R = new Float32Array(N);
let seed = 777;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const noise = () => rnd() * 2 - 1;
const TAU = Math.PI * 2;
function biquad(type, f0, Q) {
  const w = TAU * f0 / SR, c = Math.cos(w), s = Math.sin(w), a = s / (2 * Q);
  let b0, b1, b2; const a0 = 1 + a, a1 = -2 * c, a2 = 1 - a;
  if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; }
  else if (type === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2; }
  else { b0 = a; b1 = 0; b2 = -a; }
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x) => { const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; };
}
const add = (i, v, pan = 0) => { if (i < 0 || i >= N) return; L[i] += v * Math.min(1, 1 - pan); R[i] += v * Math.min(1, 1 + pan); };
const shots = tl.shots, act = tl.act, FPS = tl.fps;
const shotIdx = (t) => { for (let i = 0; i < shots.length; i++) if (t >= shots[i][0] && t < shots[i][1]) return i; return shots.length - 1; };
const actAt = (t) => { const p = t * FPS, i = Math.floor(p), f = p - i; const a = act[i] || 0, b = act[i + 1] || 0; return a + (b - a) * f; };

// ---------- drone: a little deeper and heavier with every shot ----------
{
  const F = shots.map((_, i) => 55 * Math.pow(0.667, i / Math.max(1, shots.length - 1)));
  const G = shots.map((_, i) => 0.35 + 0.6 * i / Math.max(1, shots.length - 1));
  const lp = biquad('lp', 260, 0.7), lp2 = biquad('lp', 120, 0.7), wlp = biquad('lp', 220, 0.8), wbp = biquad('bp', 90, 1.5);
  let ph1 = 0, ph2 = 0, ph3 = 0, f = F[0], g = G[0];
  const end8 = tl.finale ? shots[shots.length - 1][0] : 1e9;
  for (let i = 0; i < N; i++) {
    const t = i / SR, si = shotIdx(t);
    f += (F[si] - f) * 0.00003; g += (G[si] - g) * 0.00003;
    ph1 += TAU * f / SR; ph2 += TAU * f * 1.498 / SR; ph3 += TAU * f * 0.5 / SR;
    let saw = 0; for (let k = 1; k <= 6; k++) saw += Math.sin(ph1 * k + k) / k;
    const d = lp(saw * 0.5 + Math.sin(ph2) * 0.25) + lp2(Math.sin(ph3)) * 0.9;
    const wind = wlp(noise()) * 1.4 + wbp(noise()) * 0.6;
    let fade = Math.min(1, t / 1.5);
    if (t > end8) fade *= Math.max(0, 1 - (t - end8) / 2.5);
    const v = (d * 0.16 + wind * 0.22 * (0.5 + 0.5 * Math.sin(TAU * 0.09 * t))) * g * fade;
    add(i, v * (1 + 0.08 * Math.sin(TAU * 0.05 * t)), 0.05 * Math.sin(TAU * 0.03 * t));
  }
}
// ---------- pen nib scratching, following drawing activity ----------
{
  const bp = biquad('bp', 3400, 0.9), bp2 = biquad('bp', 1500, 1.6), hp = biquad('hp', 900, 0.7);
  let env = 0, gr = 0, pan = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR, a = actAt(t);
    if (i % 96 === 0) { gr = rnd() < 0.55 ? 0.3 + rnd() * 0.9 : 0.05; if (rnd() < 0.02) pan = (rnd() - 0.5) * 0.6; }
    env += (a * gr - env) * 0.004;
    const stroke = 0.6 + 0.4 * Math.sin(TAU * (7 + 5 * Math.sin(t * 0.7)) * t);
    const x = noise();
    const v = (bp(x) * 1.2 + bp2(x) * 0.5 + hp(noise()) * 0.15) * env * stroke * 0.55;
    add(i, v, pan);
  }
}
// ---------- one-shot helpers ----------
function burst(t, o) {
  const i0 = Math.floor(t * SR), n = Math.floor((o.dur || 0.05) * SR);
  const f = o.bp ? biquad('bp', o.bp, o.q || 2) : null, hp = o.hp ? biquad('hp', o.hp, 0.7) : null, lp = o.lp ? biquad('lp', o.lp, 0.7) : null;
  const nd = (o.nd || 0.004) * SR, att = (o.att || 0) * SR;
  for (let k = 0; k < n; k++) {
    const tt = k / SR; let x = noise() * Math.exp(-k / nd) * (att ? Math.min(1, k / att) : 1);
    if (f) x = f(x); if (hp) x = hp(x); if (lp) x = lp(x);
    let v = x * (o.na ?? 1);
    for (const [fr, am, dc] of (o.partials || [])) v += Math.sin(TAU * fr * tt) * am * Math.exp(-tt / dc) * (att ? Math.min(1, k / att) : 1);
    add(i0 + k, v * o.amp, o.pan || 0);
  }
}
const clink = (t, amp, pan) => { const b = 1800 + rnd() * 1600; burst(t, { amp, dur: 0.12, nd: 0.002, hp: 1500, na: 0.8, partials: [[b, 0.5, 0.05], [b * 1.73, 0.3, 0.035], [b * 2.61, 0.18, 0.025]], pan }); };
for (const e of tl.events) {
  const t = e.t, p = (rnd() - 0.5) * 0.5;
  switch (e.type) {
    case 'burn': for (let k = 0; k < 18; k++) burst(t + rnd() * 0.5, { amp: 0.16 + rnd() * 0.12, hp: 2500, nd: 0.0015, dur: 0.02, pan: p }); burst(t, { amp: 0.12, lp: 500, nd: 0.15, att: 0.05, dur: 0.5, na: 2, pan: p }); break;
    case 'ash': for (let k = 0; k < 6; k++) burst(t + rnd() * 0.2, { amp: 0.1, hp: 3000, nd: 0.001, dur: 0.015, pan: p }); break;
    case 'pull': { const i0 = Math.floor(t * SR), n = Math.floor(0.22 * SR); let ph = 0; const f = biquad('bp', 2000, 2.5); for (let k = 0; k < n; k++) { const tt = k / SR, u = tt / 0.22; const e2 = Math.sin(Math.PI * u) ** 2; add(i0 + k, f(noise()) * e2 * 0.5 * (0.7 + 0.3 * Math.sin(TAU * 60 * tt)), p); } burst(t, { amp: 0.25, hp: 3000, nd: 0.001, dur: 0.01 }); break; }
    case 'frost': for (let k = 0; k < 10; k++) burst(t + rnd() * 0.3, { amp: 0.08 + rnd() * 0.1, bp: 4000 + rnd() * 4000, q: 3, nd: 0.0012, dur: 0.02, pan: (rnd() - 0.5) * 0.8 }); break;
    case 'creak': { const i0 = Math.floor(t * SR), n = Math.floor(0.55 * SR); const f = biquad('bp', 380, 4), f2 = biquad('bp', 900, 5); let ph = 0; for (let k = 0; k < n; k++) { const tt = k / SR; const fr = 95 + 35 * Math.sin(TAU * 1.3 * tt) + 20 * noise(); ph += TAU * fr / SR; const pulse = (ph % TAU) < 0.25 ? 1 : 0; const e2 = Math.sin(Math.PI * tt / 0.55); add(i0 + k, (f(pulse * 2 + noise() * 0.1) + f2(pulse) * 0.5) * e2 * 0.5, p); } break; }
    case 'release': burst(t, { amp: 0.18, bp: 700, q: 2, nd: 0.01, dur: 0.08, partials: [[160, 0.2, 0.03]] }); break;
    case 'thud': burst(t, { amp: 0.4, lp: 140, nd: 0.05, dur: 0.4, na: 3, partials: [[52, 0.5, 0.15]] }); break;
    case 'scoop': burst(t, { amp: 0.3, bp: 900, q: 1.5, nd: 0.08, att: 0.03, dur: 0.3, pan: 0.2 }); burst(t + 0.2, { amp: 0.25, lp: 400, nd: 0.03, dur: 0.15, partials: [[220, 0.3, 0.04], [140, 0.2, 0.05]] }); break;
    case 'chain': { const n = 5 + Math.floor(rnd() * 5); for (let k = 0; k < n; k++) clink(t + rnd() * 0.4, 0.1 + rnd() * 0.14, (rnd() - 0.5) * 1.2); break; }
    case 'lamp': burst(t, { amp: 0.3, lp: 300, nd: 0.2, att: 0.08, dur: 0.6, na: 2.2 }); burst(t, { amp: 0.06, bp: 2500, q: 1, nd: 0.1, att: 0.05, dur: 0.4 }); break;
    case 'crack': burst(t, { amp: 0.55, hp: 800, nd: 0.003, dur: 0.05, pan: p }); burst(t, { amp: 0.45, lp: 160, nd: 0.08, dur: 0.5, na: 2.5, partials: [[70, 0.4, 0.2]] }); for (let k = 0; k < 8; k++) burst(t + 0.02 + rnd() * 0.2, { amp: 0.1, bp: 5000, q: 2, nd: 0.001, dur: 0.02, pan: p }); break;
    case 'snap': burst(t, { amp: 0.8, hp: 1200, nd: 0.002, dur: 0.03, pan: p }); burst(t, { amp: 0.55, dur: 0.9, nd: 0.001, na: 0.2, partials: [[1180, 0.45, 0.25], [2931, 0.3, 0.18], [4620, 0.18, 0.12], [620, 0.25, 0.3]], pan: p }); burst(t, { amp: 0.45, lp: 120, nd: 0.05, dur: 0.3, na: 2, partials: [[60, 0.4, 0.1]] }); for (let k = 0; k < 3; k++) clink(t + 0.25 + k * 0.12 + rnd() * 0.05, 0.12, p); break;
    case 'cut': burst(t, { amp: 0.25, lp: 250, nd: 0.02, dur: 0.12, partials: [[80, 0.3, 0.04]] }); break;
    case 'climb': burst(t, { amp: 0.16, bp: 1300 + rnd() * 600, q: 1.2, nd: 0.03, dur: 0.14, pan: p }); for (let k = 0; k < 3; k++) burst(t + 0.05 + rnd() * 0.1, { amp: 0.06, hp: 2500, nd: 0.002, dur: 0.02 }); break;
  }
}
// ---------- finale: a rising, consonant chord swell ----------
{
  if (!tl.finale) { /* no finale requested */ } else {
  const t8 = shots[shots.length - 1][0], end = tl.duration, LS = end - t8;
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const chords = [[t8 + 0.0, [43, 50, 59, 62]], [t8 + LS * 0.3, [42, 50, 57, 62, 66]], [t8 + LS * 0.55, [50, 57, 62, 66, 69, 74, 76]]];
  for (let c = 0; c < chords.length; c++) {
    const [t0, notes] = chords[c]; const t1 = c < chords.length - 1 ? chords[c + 1][0] + 0.8 : end + 0.3;
    const i0 = Math.floor(t0 * SR), i1 = Math.min(N, Math.floor(t1 * SR));
    const phs = notes.map(() => [rnd() * TAU, rnd() * TAU]);
    for (let i = i0; i < i1; i++) {
      const t = i / SR, u = t - t0;
      let e = Math.min(1, u / 0.9) * Math.min(1, (t1 - t) / 0.8);
      if (c === 2) e = Math.min(1, u / 1.4) * (0.7 + 0.3 * Math.min(1, u / 2.5)) * Math.max(0, Math.min(1, (end + 0.25 - t) / 1.3));
      const lvl = [0.22, 0.26, 0.34][c];
      let v = 0;
      notes.forEach((m, k) => { const f = hz(m); const vib = 1 + 0.002 * Math.sin(TAU * 4.6 * t + k); phs[k][0] += TAU * f * vib / SR; phs[k][1] += TAU * f * 1.003 / SR; v += (Math.sin(phs[k][0]) + 0.35 * Math.sin(2 * phs[k][0]) + 0.1 * Math.sin(3 * phs[k][0]) + 0.6 * Math.sin(phs[k][1])) / (1 + k * 0.15); });
      v *= lvl * e / notes.length * 1.6;
      L[i] += v * (0.95 + 0.05 * Math.sin(TAU * 0.3 * t)); R[i] += v * (0.95 - 0.05 * Math.sin(TAU * 0.3 * t));
    }
  }
  // star pings (D major pentatonic, high and soft)
  const pent = [74, 76, 78, 81, 83, 86, 88, 90];
  for (let k = 0; k < 26; k++) { const t = t8 + LS * 0.4 + rnd() * LS * 0.55; const f = hz(pent[Math.floor(rnd() * pent.length)]); burst(t, { amp: 0.07 + rnd() * 0.05, dur: 1.2, nd: 0.0005, na: 0, partials: [[f, 0.6, 0.35], [f * 2, 0.15, 0.2]], pan: (rnd() - 0.5) * 1.2 }); }
}
}
// ---------- master: soft clip, tail fade, normalize to -1 dBFS ----------
let peak = 0;
for (let i = 0; i < N; i++) { const t = i / SR, f = Math.min(1, Math.max(0, (DUR - t) / 0.35)); L[i] = Math.tanh(L[i] * 1.2) * f; R[i] = Math.tanh(R[i] * 1.2) * f; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
const g = 0.891 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), 46 + i * 4); }
fs.writeFileSync(path.join(DIR, 'audio.wav'), buf);
console.log('audio.wav', DUR.toFixed(2) + 's', 'peak before norm', peak.toFixed(3), 'events', tl.events.length);
