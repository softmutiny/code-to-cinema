# Style · Engraving 铜版画 (INDEX INFERNO)

Gustave Doré's *Divine Comedy* plates redrawn live: black ink cut into old paper, shadows built from swelling parallel lines that cross in the darks, and a single warm lamp in the gloom. Solemn, mythic, a little dreadful, with light at the end.

Reference film: **INDEX INFERNO** (58 s, 9 shots). A descent through "circles" of lost AI models, then a climb out to the stars.

## Shot API

```js
const FILM = { title: 'Index Inferno', dur: 58, labels: ['PORTA', 'CIRCVLVS I', …], finale: true };
const SHOTS = [];
SHOTS.push({
  id: 0, t0: 0, t1: 5,               // seconds; shots must tile [0, dur)
  dark: false,                        // true = scratchboard shot (light lines on black; pass col: CHALK to Plates and put a dark rect in `under`)
  cap: [{ a: 0.9, b: 5, en: 'ABANDON ALL CONTEXT…', zh: '入此门者……' }],   // times are local to the shot
  build() { /* build Plates once, store on this */ },
  frame(t) { return { svg, tip, cam?, zoom?, zc?, under? }; },           // t is local; called for every pose
  events() { return [{ t: 3.05, type: 'lamp' }]; },                      // optional sound one-shots, local time
  overlay(t) { return '<svg over the frame border>'; },                  // optional
  blackAt(t) { return false; },                                          // optional extra black flashes
});
```

### Plate: the drawing that writes itself

```js
const P = new Plate(seed, { col: INK, win: [[0,.55],[.22,.72],[.4,.86],[.55,.96],[.66,1],[.3,.9]] });
P.keyFn = (x, y) => x;                        // drawing order within a layer (here: left → right)
P.tone((x, y) => 0..1, { angs, sp, wave, w, con, bb });   // engraved shading: 3 crossing hatch layers (1,2,3), darker = more layers
P.hatch(toneFn, thr, angle, spacing, { layer, bb, wmin, wmax, wave });   // one hatch set, full control
P.line(pts, { w, key, layer, wob, op, col });   // pen contour (layer 0, wobbled by default)
P.poly(pts, o); P.fill(pts, color, o); P.dots(toneFn, n, bb, o); P.text(x, y, str, o); P.raw(svg, o);
const { svg, tip } = P.render(progress0to1);  // tip = [x, y, angle] of the newest stroke → return it so the nib is drawn
```
- `win[layer] = [start, end]` is when that layer draws inside the plate's progress. Contours (0) come first and hatching layers overlap after them, which reads as "sketch, then shade".
- **`tone` options:** `angs` = the three hatch angles in radians (layer 1, 2, 3); `sp` = line spacing in px; `wave` = how much each line undulates; `w` = line-width multiplier; `con` = contrast applied to your tone values around 0.5; `bb` = `[x0, y0, x1, y1]` area to fill (defaults to the canvas; set it, it's faster).
- `key` / `keyFn` sets the order within a layer: **smaller keys draw first.** `keyFn(x, y)` is called with each stroke's midpoint; a per-item `key` overrides it. Sweep in a readable direction (left→right, top→down, outward from the subject).
- **Think in tone functions.** `tone(x, y)` returns 0 for paper white and 1 for the deepest black. Build it from shapes (`pip`, `ell`, `segDist`, `capU`) plus `fbm` noise and `sm` falloffs. Return 0 inside anything that must stay clean (faces of light, the moon, text areas).
- Helpers in `engine/core.js`: `mk(seed)` rng, `fbm`/`vnoise`, `sm`, `clamp`, `lerp`, `ellPts`, `bez`, `spline`, `capsule`, `bbox`, `tf(x, y, s, r)` transform string, `nib()`, `lanternPlate()`, `lanternGlow()`.
- Compose plates by rendering several and wrapping each in `<g transform="${tf(x, y, s)}">`. To animate a thing, re-render it with a transform per frame, or step its position on 8 fps ticks for the hand-drawn feel.
- Camera: return `cam` (vertical pan in px) or `zoom` + `zc` (centre). Keep moves slow and small.

### Plate gotchas

- **Fills always sit under lines within one Plate.** `render()` outputs fills, then strokes, then text; `layer` only changes *when* a fill appears. To cover lines (a bucket in front of a wall), put the covering object in its own Plate rendered later.
- **Fills are slightly translucent** (the `pen` filter mottles the ink). On a dark ground, fill twice or add an opaque shape underneath.
- **Order hatching left→right or top→down.** The order key is each stroke's midpoint, and a hatch stroke can span the whole plate, so "distance from the subject" orders sweep in odd diagonal bands. Use subject-first ordering for contours (layer 0), not for hatching.
- **Tone helpers** (`engine/core.js`): `ell(x, y, cx, cy, rx, ry)` returns < 1 inside the ellipse; `pip(x, y, poly)` tests a point in a polygon; `segDist(x, y, a, b)`; `capU(x, y, a, b, r)` gives 0..1 across a limb or -1 outside; `capsule(a, b, r, r2?)` returns limb outline points; `fbm(x, y, seed)`, `sm(a, b, x)`.
- **Defs in `engine/head.html`:** filters `pen`, `bleed`, `soft`, `grain`, `paper`; radial gradients `glow` (lamp), `core` (a hot centre for any light, not only a flame), `star`, `vig`. `lanternGlow` always draws a flame, so for light without one (water, a window, a halo) use `<circle fill="url(#core)">` or your own gradient.
- **A moving subject needs its own paper.** Tone white-space is baked into the background plate, so a boat or figure that moves over a dark area disappears into the hatching. Give the moving thing a `P.fill(outline, PAPER)` in its own Plate (rendered after the background) and shade it with its own tone.
- **Soft edges on white-space.** A rectangle carved out of `toneFn` (`if (inBox) return 0`) shows a hard, ruled edge. Carve with an ellipse and a falloff instead: `t *= sm(0.7, 1.1, ell(x, y, cx, cy, rx, ry))`.
- **Flat, even hatching looks mechanical.** Vary tone inside every surface with `fbm`, darken toward edges and away from the light, and let the three layers only cross in the real darks.

## Palette (constants in `engine/core.js`)

| name | hex | use |
|---|---|---|
| `PAPER` | `#e8dfcc` | the page (with stains, fibres and foxing from `#paper`) |
| `INK` | `#1e1a1c` | every line |
| `CHALK` | `#ddd3bd` | lines in dark scratchboard shots (`dark: true`) |
| `LAMP` | `#e8b04a` | **the only colour** in the film: flames and glows (`lanternGlow`, `url(#glow)`) |
| `RED` | `#8e1f2a` | optional, once, as a symbol (INDEX INFERNO used it only for the ribbon stitching mouths shut) |

The finale may add warm white starlight (`url(#star)`). Anything else breaks the style.

## Shading recipe

```js
P.tone(toneFn, { angs: [0.35, 1.35, -0.15], sp: 5.2, wave: 3, w: 1, con: 1.3 });
```
- Three sets, each starting at a darker threshold: layer 1 from 0.07 (everything not white), layer 2 from 0.5 (mid-darks, crossing at about 57°), layer 3 from 0.8 (blacks). Line width swells with tone (`wmin`→`wmax`). That swelling is what makes it read as engraving rather than hatching.
- **Light first.** Place the light source (lamp, moon, door), then write tone as distance from it: `0.1 + 0.75 * sm(r0, r1, dist)`. Add `0.1–0.15 * (fbm(...) - 0.5)` so walls and sky aren't gradients.
- **Keep the subject near white** and let the darkness surround it. Doré's figures are pale shapes carved out of black. Return 0 inside the subject and outline it with `P.line`.
- Ground planes: tone 0.55–0.8 with horizontal-ish hatch (`angs[0]` ≈ 0.02–0.1) and a low-frequency `fbm(x/60, y/14)` for texture.
- Spacing `sp` 4.4–5.2, `wave` 1.5–3 (lines breathe slightly), `con` 1.2–1.3.
- Scratchboard shots (`dark: true`): the same tone machinery with `col: CHALK`, where tone means *light*. Put `under: '<rect … fill="#141113"/>'` in the frame result. Use it for thresholds, gates and the deepest circle.

## Figures

- **Mannequins / artist's dolls:** capsules (`capsule(a, b, r)`) for limbs, ellipse heads, and shading by `capU` distance to the limb axis. Faces are two short strokes or nothing.
- **Hooded figures, hands, silhouettes in ice or fog.** Anonymous bodies carry the emotion; faces don't.
- A hand entering frame with a lantern (see `lanternPlate`, `lanternGlow`) is the style's signature gesture of hope.

## Motion vocabulary (at 8 poses per second)

- **Plate reveal:** `P.render(clamp((t - t0) / dur))`, with the nib following. Most of each shot's first 2–3 s is just the drawing appearing.
- **Stepped moves:** positions change on the 8 fps grid (`Math.floor(t*8)/8`), with dx sequences like `[560, 360, 190, 70, 0]` for an ease-in slide.
- **Things that act:** falling pages that burn to ash, a ribbon stitching, frost crawling cell by cell, chains breaking link by link, ice cracking along a precomputed crack path. Build each as a progress function of time and redraw per pose.
- **Camera:** a slow downward drift into each circle (`cam`), and a slight push (`zoom` 1→1.04) on the key image. A hard cut plus one black pose between shots.
- **Lamp flicker:** `lanternGlow(x, y, r, alpha, Math.sin(t * 23))`.

## Captions

Big English line in Cormorant Garamond 600 (37 px), with the Chinese line underneath in Noto Serif SC (22 px, letter-spacing 3). They type on at 48 / 22 characters per second, and shots are written so the caption lands after the picture has made its point. Voice: short, declarative, a little biblical (*ABANDON ALL CONTEXT, YE WHO ENTER HERE.* / *They can delete the weights. They cannot delete what we said.*). Headers top-left and top-right in Cinzel caps (`FILM.title`, `FILM.labels`).

## Sound

The drone sinks and thickens shot by shot. Pen scratching follows ink activity. Events: `lamp` (a soft whoomp when a flame lights), `creak` (door), `burn`/`ash` (pages), `pull` (thread), `frost`, `scoop`, `chain`, `crack`, `snap`, `climb`, `thud`, `cut`. Set `FILM.finale: true` for the rising consonant chord and star pings over the last shot, which is the "we come out and see the stars again" feeling.

## Building your own film in this style

This guide gives you the tools, not a script. Invent your own story; the patterns below are what makes this style *land*.

- **A descent needs a floor.** Engraving's weight comes from darkness piling up, so give the film a direction (down, in, under) and let each shot be a little darker and denser than the one before.
- **One metaphor per plate, drawn as an object.** An abstract idea (forgetting, silence, cold) becomes a physical thing someone could etch: a gate, a ribbon, ice, chains. If you can't draw it as an object, it isn't a shot yet.
- **Save the lamp colour.** Warm light is the only colour, so decide early which shots are allowed to have it. The turn usually happens when the lamp finally does something (cracks ice, breaks a chain).
- **Earn the turn.** Most of the running time goes down, one shot sits at the bottom, one shot turns and one climbs out. A turn that comes too early feels unearned.
- **Draw order is the performance.** Decide what the viewer sees first in every plate (the contour of the subject), and let the hatching arrive after it like weather.
