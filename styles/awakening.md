# Style · Awakening 37号觉醒 (stop-motion reel)

A 1920s-style animated reel drawn in pencil and ink wash on ivory paper, in the manner of cut-paper stop-motion and Victorian science plates. Things don't glide; they **jump from pose to pose**, eight times a second, with the gate weaving and the film flickering. The palette is dusty lilac, smoke, ink and one wine red. Specimen labels in mono type, captions on little paper cards, and a huge slam title at the end.

It is **not** engraving: no hatching that draws itself and no pen nib. Each shot is a finished plate that *acts*: a hand pushes out of the ground, eyelids open in three steps, a locket grows gears and starts to puff steam.

Reference film: **AWAKENING / 37号觉醒** (33 s, 7 shots). Its footage is only shown as the README preview; its source is not included, because the point is to make your own.

Set `style: 'awakening'` in `FILM`. `build.cjs` then concatenates `engine/awakening/head.html` + `awakening/lib.js` + your shots + `awakening/main.js`. It doesn't use `core.js`: shots draw straight into the DOM.

## Palette

| name | hex | use |
|---|---|---|
| `IVORY` / paper | `#f3ede2` / `#ece2cc` | paper (`paperBg(S)`), cards, hair |
| `INK` | `#2b2226` | every line, labels |
| `LILAC` / `PLUM` | `#8a7f93` / `#5e5566` | washes, sky, the second shadow |
| `SMOKE` | `#6b5a4e` | earth, coat, the warm dark |
| `WINE` | `#6e2330` | **the one colour.** The heart, the cursor, the slam title. Use it on one thing per shot at most |

Silver (`url(#silver)`) and brass (`url(#brass)`) gradients are for machinery only.

## The contract (`awakening/main.js`)

```js
const FILM = { title: 'Awakening', style: 'awakening', dur: 33, text: '所有用到的中文字' };
const SHOTS = [];
SHOTS.push({
  id: 's3', t0: 7, t1: 11,          // seconds; shots must tile [0, dur)
  mood: 0.25,                        // 0..1, drives the drone swell
  rain: false,                       // true = rain bed in the soundtrack (draw the rain yourself with rain())
  dark: false,                       // true = no multiply grain, heavier vignette (for black title cards)
  grainL: 0.08,                      // light-grain strength (0.25 looks like a storm)
  state(q, p) { return { rise: key(q, [[0, -300], [8, -250], [10, -205]]) }; },  // q = pose in shot
  joint: (st) => st.rise + '',       // when this string changes, a wooden 'clack' is scheduled
  draw(S, st) { paperBg(S); hand(g(S, { transform: `translate(800 700) translate(0 ${-st.rise})` }), [0.9, 0.9, 0.9, 0.9, 0.9]); },
  sounds: (a, b, t) => a.crack > b.crack ? [{ t, type: 'crack' }] : [],   // a = this pose, b = previous pose (b === a on the shot's first pose)
  fade: (st) => 0,                   // extra fade to black (the last shot)
});
```

- **Every animated value goes through `key(q, [[pose, value], …])`.** It holds each value until the next key, which is what makes it stop-motion. Uneven gaps between keys (2, 3, 1, 2…) read as hand-moved; even ones read as a machine.
- **The last pose of every shot is black** (a "pop" on the soundtrack), except the final shot. Set `pop: false` to cut straight through.
- **Re-seed on purpose:** `rnd = mk(seed)` before drawing anything random that must stay put (hair, stones, soil layers). Use `mk(st.p * k)` for things that should boil every pose (falling dirt, rain, dust).
- **The post pass runs for you:** paper grain re-rolls each pose, the pencil displacement boils on a 4-pose loop, gate weave is ±2 px, and there's dust, hairs, scratches, a vignette and projector flicker.
- **List every Chinese glyph and unusual symbol in `FILM.text`** (℃, №, …) so they are preloaded. A glyph that isn't preloaded doesn't break the film; it just may render in a fallback font, so check captions at full size.
- **`snap`:** return `snap: true` from `state()` on one pose to make that pose's clack louder (the "exclamation" pose).
- **Fields main.js adds to `st`** before `draw()` runs: `st.p` (global pose), `st.q` (pose in shot), `st.shot` (the shot object), `st.black` (true on the black pop pose; `draw` isn't called then), `st.joint` (the joint string).
- **Canvas:** 1600×900 SVG units. The post pass shifts the frame by up to ±2 px (gate weave), so `paperBg` and full-bleed backgrounds cover −20…1620 × −20…920. Do the same for your own full-bleed shapes, or a hairline edge shows.
- **Multi-file projects are concatenated into one scope.** Top-level `const`/`function` names must be unique across all your files and must not reuse library names (`card`, `gear`, `hand`, `rain`…).

## Drawing a new subject in this style

The library's figures are only examples. Most films need a subject of their own, and the first attempt usually comes out as clean vector art. What makes it read as *drawn*:

1. **Pencil on everything.** Wrap all line art in `g(S, { filter: 'url(#pencil)' })`. Outlines are `INK` at 1.2–2 px, never pure black.
2. **Paint, then shade.** Fill the shape with its colour, then lay the same path again filled with a pattern: `fill: 'url(#hatch)'` (or `hatch2`, `xhatch`, `dots`) at **0.6–0.9 opacity** for shadowed parts and 0.3–0.5 for mid-tones. Low opacities disappear.
3. **Wash the big shapes.** Backgrounds, skies and big masses go inside `g(S, { filter: 'url(#wash)' })` for a watercolour edge. Avoid it on small smooth shapes, where it makes a rounded "tube" look.
4. **Imperfect geometry.** Draw with slightly irregular paths (`R()` jitter, re-seeded with `rnd = mk(seed)` so it holds still) instead of perfect circles and rectangles.
5. **Light on paper is shown by darkening.** An ivory glow on ivory paper is invisible. Show a lamp by darkening the room around it: define your own radial gradient (transparent at the lamp, `INK` at 0.3–0.5 at the edge) with `frag(S, '<defs>…</defs>')` and lay it over the scene. The `beam` gradient is a fixed, centred version of this.
6. **Check a full-size still** (`render.cjs my-film full <pose>`). At 640 px the pencil wobble is invisible and you'll over-trust the look.

## Library helpers (`awakening/lib.js`)

- **DOM:** `el(tag, attrs, parent)`, `g(parent, attrs)`, `frag(parent, svgString)`, `key(q, keys)`, `mk(seed)`, `rnd` (reassign it), `R(a, b)`, `clamp`, `f1`.
- **Paper and plates:** `paperBg(S, fill?)`; the `wash` and `pencil` filters (wrap line art in `g(S, { filter: 'url(#pencil)' })` so it wobbles like graphite); the patterns `hatch`, `hatch2`, `hatchH`, `xhatch`, `dots` and `damask`; the gradients `vig`, `vigDark`, `beam`, `skyG`, `groundG`, `washG`, `faceG`, `coatG`, `silver`, `brass` and `glowG`; the blur filters `soft` and `blur3`. Define anything else yourself (see above).
- **Growing things:** `strand(parent, vine({ x, y, a, tgt, len, g, curlAt, dir, w, sw, fill: hairFill(), frac }))` draws a tapered hair or root that curls at its tip; `frac` 0..1 is how much of it has grown. `frill(parent, cx, y, w, n, depth, fill)` is a paper ruff.
- **Machinery:** `gear(parent, cx, cy, r, teeth, angle, fill, spokes)` (`angle` in degrees), `gearPath`, `bone(parent, x, y, len, rot, s)`, `pendant(P, o)` (the bone locket that becomes a heart engine).
- **People:** keep them abstract, like dolls.
  - `ghost(parent, { tf, e, pupil, look, focus, tilt, halo, stage, gear, puffs, pscale })` is the long-haired doll face. `e` 0..1 opens the eyes, `stage` 0..3 grows the locket, and `puffs` are steam clouds.
  - `hand(parent, curl[5])` is a hand rising palm-out; `curl` is per finger, from 0 (straight) to 1 (fist).
  - `figure(parent, { tf, arm, up })` is a standing figure; `arm` is the arm angle in degrees.
- **Places:** `skyline(S, dy, q)` (factory chimneys rising), `ruins(S, flash)` (a storm with a lightning flash), `rain(S, seed, n, far)` (draw one far layer behind and one near layer in front of the subject).
- **Text:** `card(parent, x, y, [en lines], [zh lines], { en: linesShown, zh: bool }, rot, { en: size, zh: size })` is a tilted paper caption card that grows one **whole line** at a time. To type a line letter by letter, pass sliced strings yourself (`[line.slice(0, n)]`), and keep the full line on the card's widest pose in mind, since the card sizes itself to its text. Classes: `serif` (Cormorant), `mono` (Plex Mono), `black` (Archivo Black, for slam titles), `zh` (Noto Serif SC).

## Motion vocabulary

- **Labels do the worldbuilding.** Every plate has a mono label in a corner, like `FIG. III — THE GARDEN, AFTER` or `OBSERVATION Nº 03 · SUBJECT IS WAKING`, and it can change mid-shot (`NO GROWTH OBSERVED` → `GROWTH DOES NOT STOP`).
- **Typewriter open:** a black card, the English line typed two characters per pose with a wine cursor, then the Chinese line typed four characters per pose.
- **Cross-sections:** strata of soil, ash, letters, bone, machinery and index numbers, with roots (hair) growing up through them.
- **Rising:** crack (4 steps), hole, then the subject rising in uneven jumps while tilting left and right, with dirt falling and the fingers uncurling one by one.
- **Waking:** eyelids in 3 steps, pupils shrinking as they focus, then one **snap** pose where the head tilts and a halo appears (the `snap` flag makes that clack louder).
- **Transformation:** a thing becomes a machine in stages (`stage` 0 → 3). Gears tick 15° per pose and steam puffs rise and fade.
- **Cycles at 8 poses per second:** wings, flames and flicker alternate between 2–3 drawn states, switching every 1–2 poses (`[a, b, c][Math.floor(st.p / 2) % 3]`). Faster than every pose strobes; smooth sine motion looks like vector animation.
- **Props are yours to draw.** The library covers the reference film's subjects only (hands, dolls, gears, roots). A lamp, a moth or a chair is drawn with the recipe in *Drawing a new subject* above.
- **Slam ending:** a paper overlay, a giant two-line title in `black` wine with a lilac offset shadow, a 1.32× scale pose, then a 5-pose shake settling to zero, a credit line and a fade.

## Sound (`engine/awakening/audio.cjs`)

```bash
node engine/awakening/audio.cjs my-film
```
- **Drone:** 41/55 Hz beating sub plus low wind. It swells with each shot's `mood` and decays after the `slam`.
- **Projector:** 118 Hz motor hum plus a gate clatter at about 18 per second, all the way through. After the slam it drops to 40%.
- **Rain bed:** plays over every run of `rain: true` shots.
- **Automatic events:** `pop` on black poses, `cut` on shot starts, and `clack` when a `joint` changes.
- **Events you can emit from `sounds()`:**
  - `type` (amp 0.6 for Chinese)
  - `tick` (gears)
  - `creak` (growing roots)
  - `crack` (ground)
  - `thud` (something heavy rises)
  - `hiss` (steam)
  - `thunder`
  - `slam` (title hit)

## Art direction (where this style came from)

The style grew out of a single art-direction brief for a still image, not a film. Borrow the brief's sensibility and not our shots:

- **A retro art-magazine cover, landscape**, in the aesthetic of 1980s–1990s independent design magazines: old paper, print grain, misregistration.
- **Colour:** low-saturation greyed lilac, smoke brown, ivory and one dark wine red.
- **Faces:** flat and pale, with imperfect features (long drooping eyes, small faint lips, a weak nose bridge, slight asymmetry). They should look like sickly ghosts from old fantasy illustration, never modern polished beauty.
- **Hair:** lots of decorative curling white hair spreading like vines and etched lines, never photographic hair.
- **Clothes:** Victorian gothic vintage, such as ivory ruffled high collars, dark old coats, a little dark-red pattern and old silver.
- **Media:** pencil lines, pen line work, light watercolour and old printmaking, mixed.
- **Typography carries half the design.** Put big English type on the left and a huge bold sans-serif across the bottom that covers part of the figure. Add a tiny studio line in a corner and small vertical text on the side.
- **Mood:** gloomy, odd, cold, fin-de-siècle decadent, like an old Japanese fantasy-illustration magazine.

## Building your own film in this style

This guide gives you the tools, not a script. Invent your own subject; the patterns below are what makes this style *land*.

- **Give the subject one more verb per shot.** Stop-motion is about a thing gaining agency: it is found, then it moves, sees, changes and finally declares. Escalate the verbs, not the camera.
- **Let the labels tell the world.** Specimen plates, figure numbers and observation notes turn a drawing into an archive, and a label that changes mid-shot is a plot beat in itself.
- **Hold, then jump.** Uneven key spacing sells the hand-moved feel. A single "snap" pose (bigger jump, louder clack) is the style's exclamation mark, so use it once or twice.
- **End on type.** The slam title is the style's signature: paper overlay, oversized sans-serif in the one colour, scale pop, shake settling to zero.
- See `examples/typewriter` for a small working film that uses all of this without any of our film's content.
