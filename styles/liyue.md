# Style · Liyue 掐丝珐琅 (千里共婵娟)

Cloisonné that makes itself on screen. The reference film is pastel, in a Suzhou garden at night, but the palette is yours to choose (see below). Every object is a plate that makes itself the way cloisonné is made: **gold wire is laid first (掐丝), enamel floods each cell (点蓝), then it glows (烧制).** Soft, festive and a little wistful, like a game world at Mid-Autumn: moon gates, leak windows, osmanthus, lanterns, a jade rabbit.

Reference film: **千里共婵娟** (57 s, 8 shots), with Su Shi's 《水调歌头》 as its spine, one line per shot. Its source isn't included. **Start from `examples/goldseam`** (9.5 s, a teacup that makes itself, shatters and is mended with gold), which was made by a fresh agent from this guide alone.

Set `style: 'liyue'` in `FILM`. `build.cjs` then concatenates `engine/liyue/head.html` + `liyue/lib.js` + your shots + `liyue/main.js`. The liyue library is self-contained: it does **not** load `core.js`, so there is no `Plate`, `ellPts` or `spline` here.

## Palette: gold is fixed, the enamel is yours

**Only the wire is fixed.** Gold wire (`WIRE`, `GOLD*`) is what makes it cloisonné. The enamel colours, the sky and the mood are free, so pick a set that suits your story instead of reusing the reference film's pastel night. The table below is just that film's set.


| name | hex | use |
|---|---|---|
| `WIRE` / `WIREH` | `#c99e48` / `#fff1c2` | the cloisonné wire and its highlight |
| `GOLD` / `GOLDL` / `GOLDD` | `#d4ae58` / `#f6e1a0` / `#a9803a` | trims, frames, rims |
| `INK` | `#6b5273` | soft plum outlines on figures and robes |
| night sky | `#2f2c6e → #5b55a6 → #9d8cc9 → #dcb4d2 → #f3cdd2` | a `dusk` gradient you define yourself (see *Your own defs* below; `examples/goldseam` has one) |
| enamels | celadon `#c6ead6`, lilac `#ddd3f5`, blush `#f6d6e2`, cream `#fcefd2`, pond `#2f2d6b → #7766b0` | cells |
| shadow enamel | `#3a3777` | moon phase shade, 皮影 silhouettes (`#4c3f7e`) |

Gold wire on pastel enamel on a lavender night: that was one film. Other directions that work:
- **景泰蓝 classic:** turquoise and cobalt ground, coral red, jade green, a little white. Strong and imperial.
- **Daylight:** warm cream sky, peach and apricot, leaf green. A spring garden or a market.
- **Deep night:** ink-blue and plum grounds with a few jewel cells (ruby, emerald) that glow like lanterns.
- **Two-tone:** gold on one enamel family, like all blues or all greens, for a quiet, graphic film.

Rules that hold for any palette:
- Keep one dark value as the ground, and avoid pure black (use a deep version of your main hue).
- Keep enamels a little milky (add white) so the gold wire reads against them.
- Save the brightest, warmest cell or glow for the emotional peak.
- If you change the sky, define your own gradient (see *Your own defs*), and check that the gold header text is still readable.

## The Cloi plate

```js
const C = new Cloi({ wire: [0, 0.6], fill: [0.3, 1] });   // windows inside the plate's progress
C.piece(d, fill, { key, fkey, w, rule, flood, filter, op, wire });   // an enamel cell with gold wire on its outline
C.wire(d, { key, w });                                         // a free wire (spirals, veins, waves)
C.deco(svg, { fkey });                                         // finished ornament that fades in with the enamel
const { svg, tip } = C.render(p);                              // p 0..1; tip = where the wire is being laid
```
- `wire` and `fill` windows are **fractions of the plate's progress** `p` (0..1), not seconds. You choose how `p` maps to time in `frame(t)`, e.g. `C.render(clamp(t / 2.5))`.
- `piece` takes `op`, but free wires (`C.wire`) have no opacity of their own: to fade one wire, put it in its own `Cloi` and wrap that render in a `<g opacity>`.
- Wires are dash-animated per subpath (a `d` is split on `M`), ordered by `key`. Return `tip` from `frame()` and main.js draws the molten-gold bead there (`spark`). If the plate sits inside a transform, map `tip` to global coordinates yourself.
- Enamel floods out from each cell's centre (a growing clip circle), ordered by `fkey`. Big backgrounds and wide flat shapes (a saucer, a table top) look odd flooding as a circle, so give them `flood: false` and they fade.
- For something too detailed to wire piece by piece (the v4 moon), build a simple Cloi of its main shapes, and when it finishes lay the full static drawing over it (for example a simple `Cloi` of a moon's main shapes, then a detailed static moon drawn on top).
- **Randomness must be frozen.** Build every ornament once in `build()` (main wraps it in `seeded()`), or wrap per-pose builders in `seeded(n, fn)`. Otherwise leaves and dots jump every pose.

## Library helpers (`liyue/lib.js`)

- **Garden:** `coping` (wall-top tiles), `latticeWindow(pts, clip, scene, seedMin, hole?)` (漏窗 with ice-crack lattice; `seedMin` is the minimum cell area, so larger = sparser. **You must define `<clipPath id="${clip}">` yourself**; the function only defines `${clip}L` for the lattice), `octagon`, `bamboo`, `leafSpray`, `pavilion`, `kongming` (sky lantern), `puffCloud`, `cloiCloud`, `cloiBlob`.
- **Flora:** `branch` (osmanthus bough with clusters), `osmFlower`, `osmCluster`, `leaf`, `lotus`, `pad`, `koi`.
- **Ornament:** `wire`, `wireSpiral`, `scrollCurl`, `goldLine`, `rosette`, `sparkle`, `twinkle`, `crescentC`, `ruyi`.
- **Geometry:** `poly`, `circD`, `ellD`, `ribbon`, `voronoi` + `clipHalf` (good for shattering things), `centroid`, `shrink`, `tf`, `pathLen`, `pathPt`, `pathBox`.
- **Figures:** `couple()`, a pair seen from behind (origin = centre of the seat line). Any figures in this style are backs, silhouettes or wire ghosts.
- Gradients in `head.html`: `moonE`, `moonLum`, `warmBloom`, `stoneG`, `tileG`, `robeO/P`, `kongG`, `fruitG`, `goldH`, `padG`, `lotusG`, `bambooG`, and more. Filters: `gouache`, `soft`, `glow`, `glowS`, `bloom`, `crayon`, `paper`.

## Your own defs

Anything not in `head.html` (a sky gradient, a clipPath, a glow for one object) goes inside the frame's own SVG: start the returned `svg` with `<defs>…</defs>`. Make every id unique per shot (prefix it with the shot id), because during the 3-pose dissolve the previous shot's frame is drawn at the same time and duplicate ids clash.

## Frame fields

`frame(t)` returns `{ svg, tip?, zoom?, zc?, pan?: [x, y], over? }`. `over` is drawn above the scene and unzoomed. Shot-level fields: `mood` (0..1, sets the pad level for the whole shot; 0 = silence. For a change inside a shot, split it into two shots), `dark` (switches caption and label colours for a dark shot), `noScrim` (no caption scrim), and `cap: [{ a, b, en, zh, … }]` like the other styles.

## Gotchas

- **Title and label colours follow `dark`.** On a light shot with a dark band at the top, the gold header can get lost. Keep the top 60 px light, or mark the shot `dark`, which also switches caption colours and the scrim.
- **Chinese captions:** every glyph, including "，", gets a full cell plus letter-spacing. Prefer a space or a line break to a comma in short captions.
- Camera `zoom` is continuous, not stepped; keep it small (≤ 8%) so the wire lines don't swim.

## Motion vocabulary

- **Making:** the first 2–3 s of a shot is usually its main plate wiring and glazing itself. The bead leads the wire, and the enamel follows.
- **Soft dissolves** between shots (3 poses), not black cuts.
- **Things that act:** windows lighting one by one, a phase shade sweeping across a disc (a `shadow enamel` circle clipped to the disc and slid across it), a reflection breaking into voronoi shards and knitting back, ghosts drawn only in wire then fading, lanterns rising from lit windows to gather round the moon.
- **Camera:** gentle `zoom` pushes (1 → 1.03–1.08) or one pull-back for the ending (1.28 → 1). Small `pan` on long walls.

## Captions

The Chinese line is big, in ZCOOL XiaoWei, inking in one character at a time (7 per second, fading up with a 6 px rise). The English line is small, in Cormorant Garamond italic, and fades in after. A soft scrim sits under the caption band, so keep subjects above y ≈ 690. For Chinese text drawn inside plates use `class="zh"` (`.cz` is Cinzel). List every glyph used in plates in `FILM.text` so it gets preloaded (a missing one only falls back to another font).

ZCOOL XiaoWei draws a few characters as a solid box (回 is one). The renderer detects these and captions switch those characters to Noto Serif SC by themselves. Plate text doesn't, so look at plate text in a `full` still and avoid those characters there.

## Sound (`engine/liyue/audio.cjs`)

```bash
node engine/liyue/audio.cjs my-film
```
- **Pad:** a D-gong pentatonic chord whose level follows each shot's `mood` (0 = silence, 1 = full). A shot with `mood: 0` goes quiet, which is useful for a held-breath moment.
- **Guzheng:** additive plucks with press-vibrato and optional bends. An original motif is phrased over the film: by default one phrase per shot (skipping shots with `mood: 0`); put a `motif.json` (`[[seconds, "P1"|"P2"|"P3", amp], …]`) in your project to place phrases yourself. `{ type: 'pluck', n }` plays scale degree n of D E F# A B D' E' F#'.
- **Shimmer:** a glassy sizzle that follows wire-laying activity.
- **Events:** `pluck, chime (hi), axe, pound, drip (hi), shatter, whoosh, bell, swell, finale`.
- Keep melodies original. Don't quote existing songs.

## Building your own film in this style

This guide gives you the tools, not a script. Pick your own poem, festival or story; the patterns below are what makes this style *land*.

- **Let a text be the spine.** A classical poem, a song or a letter gives you one line per shot, and cloisonné's slow "wire → enamel → glow" rhythm fits reading pace naturally.
- **Every object makes itself.** Don't cut to a finished picture: lay the wire, flood the cells, then fire it. The making *is* the animation, so give the main subject the longest making.
- **Make, break, mend.** Cloisonné is precious and fragile, so it rewards a structure where something is built, broken (shards, cracks, a shade sweeping across), then repaired with gold (金缮) or completed.
- **Soft, then one glow.** Keep the palette gentle and let the enamel carry the mood. Save the strongest glow for the emotional peak, and pull back to a wide shot at the end so the whole world is under that light.
- **Architecture as frames.** Moon gates, leak windows, eaves and railings frame the subject and double as wire patterns, which is cheaper and richer than open landscape.
