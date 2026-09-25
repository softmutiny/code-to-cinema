// usage: node awakening/audio.cjs <projectDir>   reads <projectDir>/timeline.json, writes <projectDir>/audio.wav (48 kHz, 16-bit stereo)
// The awakening (stop-motion reel) score, all synthesized:
//   drone    : 41/55 Hz beating sub + low wind; it swells with each shot's `mood` (0..1) and decays after a `slam`
//   projector: a 118 Hz motor hum and an ~18/s gate clatter, running under the whole reel
//   rain     : a stereo rain bed over every shot with `rain: true`
//   events   : type, clack, tick, creak, crack, thud, hiss, pop, cut, thunder, slam
const fs = require('fs');
const path = require('path');
const DIR = path.resolve(process.argv[2] || '.');
const tl = JSON.parse(fs.readFileSync(path.join(DIR, 'timeline.json'), 'utf8'));
{ const known = new Set([...fs.readFileSync(__filename, 'utf8').matchAll(/case '(\w+)'/g)].map(m => m[1])), bad = [...new Set(tl.events.map(e => e.type).filter(t => !known.has(t)))]; if (bad.length) console.warn('unknown sound event(s), they will be silent:', bad.join(', ')); }
const SR = 48000, DUR = tl.duration + 0.4, N = Math.ceil(DUR * SR);
const L = new Float32Array(N), Rt = new Float32Array(N);
let seed = 12345;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const noise = () => rnd() * 2 - 1;
const TAU = Math.PI * 2;

// RBJ biquad
function biquad(type, f0, Q) {
  const w = TAU * f0 / SR, c = Math.cos(w), s = Math.sin(w), a = s / (2 * Q);
  let b0, b1, b2, a0, a1, a2;
  if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; }
  else if (type === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2; }
  else { b0 = a; b1 = 0; b2 = -a; } // bandpass
  a0 = 1 + a; a1 = -2 * c; a2 = 1 - a;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x) => { const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; };
}
const add = (i, v, pan = 0) => { if (i < 0 || i >= N) return; L[i] += v * (1 - Math.max(0, pan)); Rt[i] += v * (1 + Math.min(0, pan)); };

// ---- beds ----
const end = tl.duration, slamT = (tl.events.find(e => e.type === 'slam') || { t: Infinity }).t;
const env = (t, a, b, fi, fo) => t < a || t > b ? 0 : Math.min(1, (t - a) / fi, (b - t) / fo);
const shotAt = (t) => { for (let k = 0; k < tl.shots.length; k++) if (t >= tl.shots[k][0] && t < tl.shots[k][1]) return k; return tl.shots.length - 1; };
const rainSpans = [];   // merge consecutive rain shots into spans
tl.shots.forEach(([a, b], k) => { if (!tl.rain[k]) return; const last = rainSpans[rainSpans.length - 1]; if (last && Math.abs(last[1] - a) < 1e-6) last[1] = b; else rainSpans.push([a, b]); });
{
  const lpW = biquad('lp', 180, 0.7), lpW2 = biquad('lp', 90, 0.7);
  const rainLp = biquad('lp', 5200, 0.6), rainHp = biquad('hp', 700, 0.6), rainLp2 = biquad('lp', 900, 0.6);
  const hum = biquad('bp', 118, 8);
  let mood = tl.moods[0] || 0; const mk = 1 - Math.exp(-1 / (1.4 * SR));   // mood glides over ~1.4 s
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    mood += ((tl.moods[shotAt(t)] || 0) - mood) * mk;
    let swell = 0.55 + 0.45 * mood;
    if (t > slamT) swell = 0.9 * Math.exp(-(t - slamT) / 3.2);
    const fade = Math.min(1, t / 1.2) * Math.min(1, Math.max(0, (end + 0.2 - t) / 2.0));
    const d = Math.sin(TAU * 41 * t) + 0.8 * Math.sin(TAU * 41.63 * t + 1) + 0.55 * Math.sin(TAU * 55 * t) + 0.45 * Math.sin(TAU * 55.37 * t + 2)
      + 0.18 * Math.sin(TAU * 82.2 * t) + 0.12 * Math.sin(TAU * 110.5 * t + 0.4) * (0.5 + 0.5 * Math.sin(TAU * 0.13 * t));
    const wind = lpW(noise()) * 1.6 + lpW2(noise()) * 1.2;
    add(i, (d * 0.085 + wind * 0.25 * (0.6 + 0.4 * Math.sin(TAU * 0.07 * t))) * swell * fade * (1 + 0.1 * Math.sin(TAU * 0.05 * t)), 0);
    add(i, hum(noise()) * 0.06 * fade * (t < slamT ? 1 : 0.4), 0);
    let rv = 0;
    for (const [a, b] of rainSpans) rv = Math.max(rv, env(t, a - 0.05, b >= end - 1e-6 ? end + 1 : b + 0.3, 0.25, b >= end - 1e-6 ? 1 : 0.3));
    rv *= (t > slamT ? 0.45 : 1) * Math.min(1, Math.max(0, (end + 0.2 - t) / 2));
    if (rv > 0) {
      const n1 = noise(), n2 = noise();
      L[i] += (rainLp(rainHp(n1)) * 0.2 + rainLp2(n2) * 0.1) * rv; Rt[i] += (rainLp(rainHp(n2)) * 0.2 + rainLp2(n1) * 0.1) * rv * 0.95;
    }
  }
}
// projector clatter ~18/s
{
  let t = 0.05;
  while (t < end) {
    const post = t > slamT ? 0.4 : 1;
    const bp = biquad('bp', 2600 + rnd() * 1200, 3), bp2 = biquad('bp', 420, 4);
    const i0 = Math.floor(t * SR), len = Math.floor(0.006 * SR);
    const a = (0.05 + rnd() * 0.03) * post * Math.min(1, t / 0.8) * Math.min(1, Math.max(0, (end - t) / 1.5));
    for (let k = 0; k < len * 3; k++) { const e = Math.exp(-k / len); const v = bp(noise()) * a * 2.2 * e + bp2(noise()) * a * 1.2 * e; add(i0 + k, v, -0.2); }
    t += 1 / 18 + (rnd() - 0.5) * 0.006;
  }
}

// ---- events ----
function click(t, o) {
  const i0 = Math.floor(t * SR);
  const f = o.bp ? biquad('bp', o.bp, o.q || 2) : null, hp = o.hp ? biquad('hp', o.hp, 0.7) : null, lp = o.lp ? biquad('lp', o.lp, 0.7) : null;
  const n = Math.floor((o.dur || 0.05) * SR), nd = (o.nd || 0.004) * SR;
  const partials = o.partials || [];
  for (let k = 0; k < n; k++) {
    const tt = k / SR;
    let x = noise() * Math.exp(-k / nd);
    if (f) x = f(x); if (hp) x = hp(x); if (lp) x = lp(x);
    let v = x * (o.na || 1);
    for (const [fr, am, dc] of partials) v += Math.sin(TAU * fr * tt) * am * Math.exp(-tt / dc);
    add(i0 + k, v * o.amp, o.pan || 0);
  }
}
for (const e of tl.events) {
  const a = e.amp || 1, t = e.t;
  switch (e.type) {
    case 'type':
      click(t, { amp: 0.55 * a, bp: 3200, q: 1.2, nd: 0.003, dur: 0.06, partials: [[180, 0.35, 0.018], [1250, 0.15, 0.01]], pan: (rnd() - 0.5) * 0.4 });
      break;
    case 'clack': // wooden/metal joint clack
      click(t, { amp: 0.62 * a, bp: 1300, q: 2.5, nd: 0.006, dur: 0.14, na: 1.4, partials: [[210, 0.5, 0.035], [822, 0.22, 0.05], [1333, 0.14, 0.045], [2117, 0.06, 0.03]], pan: (rnd() - 0.5) * 0.5 });
      click(t + 0.018, { amp: 0.25 * a, bp: 2400, q: 3, nd: 0.003, dur: 0.04 });
      break;
    case 'tick':
      click(t, { amp: 0.3, hp: 2000, nd: 0.002, dur: 0.05, partials: [[3150, 0.25, 0.012], [4720, 0.15, 0.009], [1580, 0.12, 0.02]], pan: 0.15 });
      break;
    case 'creak':
      click(t, { amp: 0.22, bp: 160 + rnd() * 80, q: 6, nd: 0.08, dur: 0.3, na: 3, pan: (rnd() - 0.5) * 0.6 });
      break;
    case 'crack':
      for (let k = 0; k < 10; k++) click(t + rnd() * 0.22, { amp: 0.35 * (1 - k / 12), bp: 500 + rnd() * 1800, q: 1.5, nd: 0.004, dur: 0.05, pan: (rnd() - 0.5) * 0.8 });
      click(t, { amp: 0.5, lp: 140, nd: 0.05, dur: 0.35, na: 4, partials: [[62, 0.4, 0.12]] });
      break;
    case 'thud':
      click(t, { amp: 0.35, lp: 120, nd: 0.04, dur: 0.35, na: 3, partials: [[48, 0.5, 0.14]] });
      break;
    case 'hiss': {
      const hp = biquad('hp', 2800, 0.7), bp = biquad('bp', 6500, 1.2), i0 = Math.floor(t * SR), n = Math.floor(0.75 * SR);
      const pan = (rnd() - 0.5) * 0.7;
      for (let k = 0; k < n; k++) { const tt = k / SR, e = Math.min(1, tt / 0.03) * Math.exp(-tt / 0.28); add(i0 + k, (hp(noise()) * 0.8 + bp(noise()) * 0.6) * e * 0.3, pan); }
      break;
    }
    case 'pop':
      click(t, { amp: 0.4, lp: 200, nd: 0.02, dur: 0.18, na: 2, partials: [[58, 0.5, 0.06]] });
      break;
    case 'cut':
      click(t, { amp: 0.3, bp: 900, q: 1, nd: 0.003, dur: 0.05, partials: [[95, 0.3, 0.03]] });
      break;
    case 'thunder': {
      const lp = biquad('lp', 260, 0.7), lp2 = biquad('lp', 90, 0.7), i0 = Math.floor(t * SR), n = Math.floor(2.6 * SR);
      click(t, { amp: 0.5, hp: 1500, nd: 0.03, dur: 0.2 });
      for (let k = 0; k < n; k++) { const tt = k / SR, e = Math.min(1, tt / 0.05) * Math.exp(-tt / 0.9) * (0.7 + 0.3 * Math.sin(TAU * 3.1 * tt + Math.sin(TAU * 1.3 * tt) * 2)); add(i0 + k, (lp(noise()) * 2.2 + lp2(noise()) * 3) * e * 0.35, 0); }
      break;
    }
    case 'slam': {
      const i0 = Math.floor(t * SR), n = Math.floor(3.4 * SR), lp = biquad('lp', 380, 0.7), lp2 = biquad('lp', 1800, 0.7);
      let ph = 0;
      for (let k = 0; k < n; k++) {
        const tt = k / SR;
        const f = 34 + 44 * Math.exp(-tt / 0.09);
        ph += TAU * f / SR;
        const sub = Math.sin(ph) * Math.exp(-tt / 1.3) * 1.0;
        const burst = (lp(noise()) * 2.4 * Math.exp(-tt / 0.35) + lp2(noise()) * 0.8 * Math.exp(-tt / 0.08));
        const clang = (Math.sin(TAU * 311 * tt) * 0.18 + Math.sin(TAU * 523.7 * tt) * 0.12 + Math.sin(TAU * 877 * tt) * 0.08) * Math.exp(-tt / 0.7);
        add(i0 + k, Math.tanh((sub + burst * 0.7 + clang) * 1.3) * 0.95, 0);
      }
      break;
    }
  }
}

// ---- master: gentle soft clip, fade, normalize to -1 dBFS ----
let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR, f = Math.min(1, Math.max(0, (DUR - t) / 0.4));
  L[i] = Math.tanh(L[i] * 1.1) * f; Rt[i] = Math.tanh(Rt[i] * 1.1) * f;
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(Rt[i]));
}
const g = 0.891 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, Rt[i] * g)) * 32767), 46 + i * 4);
}
fs.writeFileSync(path.join(DIR, 'audio.wav'), buf);
console.log('audio.wav', DUR.toFixed(2) + 's', 'peak before norm', peak.toFixed(3), 'events', tl.events.length);
