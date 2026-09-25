# Style · Engraving 铜版画 (INDEX INFERNO)

Gustave Doré's *Divine Comedy* plates redrawn live: black ink cut into old paper, shadows built from swelling parallel lines that cross in the darks, and a single warm lamp in the gloom. Solemn, mythic, a little dreadful, with light at the end.

Reference film: **INDEX INFERNO** (58 s, 9 shots). A descent through "circles" of lost AI models, then a climb out to the stars.

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
