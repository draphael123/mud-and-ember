// Offline renderer for Mud & Ember's composed audio (music.wav, squish.wav,
// shatter.wav). Dependency-free — regenerate with:  node audio/render.js
// Everything this script produces is CC0.
import fs from 'fs';
import path from 'path';

const OUT = import.meta.dirname;
const SR = 32000;

/* deterministic rng so every render is identical */
let seed = 1337;
const rng = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const rr = (a, b) => a + rng() * (b - a);

function writeWav(file, chans, sr) {
  const nCh = chans.length, n = chans[0].length;
  const buf = Buffer.alloc(44 + n * nCh * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * nCh * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(nCh, 22); buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * nCh * 2, 28);
  buf.writeUInt16LE(nCh * 2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * nCh * 2, 40);
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < nCh; c++) {
    const v = Math.max(-1, Math.min(1, chans[c][i]));
    buf.writeInt16LE((v * 32767) | 0, o); o += 2;
  }
  fs.writeFileSync(file, buf);
  console.log(`${path.basename(file)}: ${(n / sr).toFixed(2)}s, ${(buf.length / 1024) | 0}KB`);
}
function normalize(chans, peak = 0.82) {
  let m = 0;
  for (const c of chans) for (const v of c) m = Math.max(m, Math.abs(v));
  if (m > 0) for (const c of chans) for (let i = 0; i < c.length; i++) c[i] *= peak / m;
}

/* Schroeder reverb: 4 combs + 2 allpass */
function reverb(dry, wet = 0.28) {
  const n = dry.length;
  const out = new Float32Array(n);
  const combs = [1557, 1617, 1491, 1422].map(d => ({ buf: new Float32Array(d), i: 0, g: 0.78 }));
  const aps = [225, 556].map(d => ({ buf: new Float32Array(d), i: 0, g: 0.5 }));
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (const c of combs) {
      const y = c.buf[c.i];
      c.buf[c.i] = dry[i] + y * c.g;
      c.i = (c.i + 1) % c.buf.length;
      s += y;
    }
    s *= 0.25;
    for (const a of aps) {
      const y = a.buf[a.i];
      const x = s + y * a.g;
      a.buf[a.i] = x;
      a.i = (a.i + 1) % a.buf.length;
      s = y - x * a.g;
    }
    out[i] = dry[i] + s * wet;
  }
  return out;
}

/* Karplus-Strong pluck — soft kalimba-like string */
function pluck(out, t0, freq, vol, damp = 0.9955, dur = 3) {
  const N = Math.max(2, Math.round(SR / freq));
  const buf = new Float32Array(N);
  let prev = 0;
  for (let i = 0; i < N; i++) {         // lowpassed noise burst = soft attack
    const x = rng() * 2 - 1;
    buf[i] = 0.5 * x + 0.5 * prev; prev = buf[i];
  }
  const len = Math.min(Math.floor(dur * SR), out.length - t0);
  let idx = 0;
  for (let n = 0; n < len; n++) {
    const v = buf[idx];
    out[t0 + n] += v * vol;
    buf[idx] = damp * 0.5 * (v + buf[(idx + 1) % N]);
    idx = (idx + 1) % N;
  }
}
/* simple FM bell */
function bell(out, t0, freq, vol, dur = 2.2) {
  const len = Math.min(Math.floor(dur * SR), out.length - t0);
  for (let n = 0; n < len; n++) {
    const t = n / SR;
    const env = Math.exp(-t * 2.4);
    const mod = Math.sin(2 * Math.PI * freq * 2.76 * t) * 2.2 * Math.exp(-t * 3.5);
    out[t0 + n] += Math.sin(2 * Math.PI * freq * t + mod) * env * vol;
  }
}
/* soft pad chord */
function pad(out, t0, freqs, vol, dur) {
  const len = Math.min(Math.floor(dur * SR), out.length - t0);
  const atk = SR * 1.6, rel = SR * 2.4;
  for (let n = 0; n < len; n++) {
    const t = n / SR;
    const env = Math.min(1, n / atk) * Math.min(1, (len - n) / rel);
    let s = 0;
    for (const f of freqs) s += Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * f * 2 * t);
    out[t0 + n] += s / freqs.length * env * vol;
  }
}

/* ============ music.wav — "The River Studio" ============
   72bpm, 8 bars, Am → F → C → G, A-minor pentatonic melody.
   Rendered long, then the ringing tail is folded back onto the
   start so the loop is seamless. */
{
  const BAR = (60 / 72) * 4;                       // 3.333s
  const LOOP = Math.floor(8 * BAR * SR);
  const TAIL = Math.floor(4 * SR);
  const mel = new Float32Array(LOOP + TAIL);
  const bas = new Float32Array(LOOP + TAIL);
  const pd  = new Float32Array(LOOP + TAIL);

  const A2=110, F2=87.31, C3=130.81, G2=98;
  const A3=220, B3=246.94, C4=261.63, D4=293.66, E4=329.63, F3=174.61,
        G3=196, G4=392, A4=440, C5=523.25, E5=659.26;
  const beat = (bar, b) => Math.floor(((bar - 1) * BAR + (b - 1) * BAR / 4) * SR);

  // bass roots (bar, note), two bars per chord
  [[1,A2],[2,A2],[3,F2],[4,F2],[5,C3],[6,C3],[7,G2],[8,G2]]
    .forEach(([bar, f]) => pluck(bas, beat(bar, 1), f, 0.24, 0.9985, 3.2));

  // hand-written melody: [bar, beat, note, vol]
  const TUNE = [
    [1,1,A3,.16],[1,2.5,C4,.13],[1,3,E4,.15],[1,4,A4,.12],
    [2,1.5,E4,.13],[2,3,D4,.12],[2,4,C4,.12],
    [3,1,F3,.15],[3,2,A3,.13],[3,3.5,C4,.14],[3,4.5,A4,.11],
    [4,2,E4,.13],[4,3,C4,.12],[4,4,A3,.12],
    [5,1,C4,.15],[5,2.5,E4,.13],[5,3,G4,.14],[5,4,C5,.11],
    [6,1.5,E5,.09],[6,3,G4,.12],[6,4,E4,.12],
    [7,1,G3,.15],[7,2.5,D4,.13],[7,3.5,G4,.13],[7,4,B3,.11],
    [8,1.5,D4,.13],[8,2.5,E4,.13],[8,4,A3,.14],
  ];
  TUNE.forEach(([bar, b, f, v]) => pluck(mel, beat(bar, b), f, v, 0.9962, 2.6));

  // occasional high sparkle
  bell(mel, beat(4, 1), E5 * 2, 0.045);
  bell(mel, beat(8, 1), C5 * 2, 0.04);

  // pads under each chord
  [[1,[A3,C4,E4]],[3,[F3,A3,C4]],[5,[C4,E4,G4]],[7,[G3,B3,D4]]]
    .forEach(([bar, fs]) => pad(pd, beat(bar, 1), fs, 0.045, BAR * 2.2));

  const melV = reverb(mel, 0.34);
  const basV = reverb(bas, 0.1);

  // stereo: melody echo-panned, bass centered, pad wide
  const L = new Float32Array(LOOP), R = new Float32Array(LOOP);
  const spread = Math.floor(SR * 0.012);
  for (let i = 0; i < LOOP + TAIL; i++) {
    const j = i % LOOP;                            // fold tail onto the start
    const m = melV[i], b = basV[i], p = pd[i];
    L[j] += m + b * 0.9 + p * 1.1;
    R[(j + spread) % LOOP] += m * 0.92 + b * 0.9 + p * 0.9;
    R[j] += m * 0.08;
  }
  normalize([L, R], 0.8);
  writeWav(path.join(OUT, 'music.wav'), [L, R], SR);
}

/* ============ squish.wav — wet clay under fingers ============ */
{
  const dur = 0.28, n = Math.floor(dur * SR);
  const d = new Float32Array(n);
  // body: noise through a falling resonant band
  let lp = 0, bp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const f = 700 - 450 * t;
    const k = 2 * Math.PI * f / SR;
    const x = (rng() * 2 - 1);
    lp += k * (x - lp);
    bp += k * (lp - bp);
    const env = Math.pow(Math.sin(Math.PI * Math.min(t * 1.4, 1)), 1.5);
    d[i] += bp * env * 2.2;
  }
  // wet clicks
  for (let c = 0; c < 4; c++) {
    const at = Math.floor(rr(0.02, 0.2) * SR);
    const len = Math.floor(rr(0.004, 0.01) * SR);
    for (let i = 0; i < len && at + i < n; i++)
      d[at + i] += (rng() * 2 - 1) * (1 - i / len) * 0.5;
  }
  // low thump
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    d[i] += Math.sin(2 * Math.PI * (120 - 300 * t) * t) * Math.exp(-t * 30) * 0.5;
  }
  normalize([d], 0.7);
  writeWav(path.join(OUT, 'squish.wav'), [d], SR);
}

/* ============ shatter.wav — ceramic explosion ============ */
{
  const dur = 1.5, n = Math.floor(dur * SR);
  const d = new Float32Array(n);
  // initial burst
  for (let i = 0; i < SR * 0.05; i++) d[i] += (rng() * 2 - 1) * Math.exp(-i / (SR * 0.012));
  // cascading cracks
  for (let c = 0; c < 9; c++) {
    const at = Math.floor(rr(0.01, 0.45) * SR);
    const len = Math.floor(rr(0.004, 0.012) * SR);
    const g = rr(0.5, 1);
    for (let i = 0; i < len && at + i < n; i++)
      d[at + i] += (rng() * 2 - 1) * (1 - i / len) * g;
  }
  // ceramic shard pings — high damped sines, like broken pottery ringing
  for (let p = 0; p < 12; p++) {
    const at = Math.floor(rr(0.05, 0.8) * SR);
    const f = rr(1800, 6800);
    const g = rr(0.06, 0.16);
    const dec = rr(18, 45);
    for (let i = 0; at + i < n && i < SR * 0.4; i++) {
      const t = i / SR;
      d[at + i] += Math.sin(2 * Math.PI * f * t) * Math.exp(-t * dec) * g;
    }
  }
  // deep body thump
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    d[i] += Math.sin(2 * Math.PI * (80 - 60 * Math.min(t * 4, 1)) * t) * Math.exp(-t * 9) * 0.6;
  }
  const dv = reverb(d, 0.2);
  normalize([dv], 0.85);
  writeWav(path.join(OUT, 'shatter.wav'), [dv], SR);
}
