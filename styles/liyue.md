# Style · Liyue 掐丝珐琅 (千里共婵娟)

Pastel cloisonné in a Suzhou garden at night. Every object is a plate that makes itself the way cloisonné is made: **gold wire is laid first (掐丝), enamel floods each cell (点蓝), then it glows (烧制).** Soft, festive and a little wistful, like a game world at Mid-Autumn: moon gates, leak windows, osmanthus, lanterns, a jade rabbit.

Reference film: **千里共婵娟** (57 s, 8 shots), with Su Shi's 《水调歌头》 as its spine, one line per shot.

Set `style: 'liyue'` in `FILM`. `build.cjs` then concatenates `engine/liyue/head.html` + `liyue/lib.js` + your shots + `liyue/main.js`. The liyue library is self-contained: it does **not** load `core.js`, so there is no `Plate`, `ellPts` or `spline` here.

## Palette

| name | hex | use |
|---|---|---|
| `WIRE` / `WIREH` | `#c99e48` / `#fff1c2` | the cloisonné wire and its highlight |
| `GOLD` / `GOLDL` / `GOLDD` | `#d4ae58` / `#f6e1a0` / `#a9803a` | trims, frames, rims |
| `INK` | `#6b5273` | soft plum outlines on figures and robes |
| night sky | `#2f2c6e → #5b55a6 → #9d8cc9 → #dcb4d2 → #f3cdd2` | the `dusk` gradient (define it in your shots, see the reference project) |
| enamels | celadon `#c6ead6`, lilac `#ddd3f5`, blush `#f6d6e2`, cream `#fcefd2`, pond `#2f2d6b → #7766b0` | cells |
| shadow enamel | `#3a3777` | moon phase shade, 皮影 silhouettes (`#4c3f7e`) |

Gold wire on pastel enamel on a lavender night. No black anywhere; the darkest value is indigo.

## The Cloi plate

```js
const C = new Cloi({ wire: [0, 0.6], fill: [0.3, 1] });   // windows inside the plate's progress
C.piece(d, fill, { key, fkey, w, rule, flood, filter, op, wire });   // an enamel cell with gold wire on its outline
C.wire(d, { key, w });                                         // a free wire (spirals, veins, waves)
C.deco(svg, { fkey });                                         // finished ornament that fades in with the enamel
const { svg, tip } = C.render(p);                              // p 0..1; tip = where the wire is being laid
```
- Wires are dash-animated per subpath (a `d` is split on `M`), ordered by `key`. Return `tip` from `frame()` and main.js draws the molten-gold bead there (`spark`). If the plate sits inside a transform, map `tip` to global coordinates yourself.
- Enamel floods out from each cell's centre (a growing clip circle), ordered by `fkey`. Big backgrounds look odd flooding as a circle, so give them `flood: false` and they fade.
- For something too detailed to wire piece by piece (the v4 moon), build a simple Cloi of its main shapes, and when it finishes lay the full static drawing over it (`moonCloi()` + `moonFull()` in the reference project).
- **Randomness must be frozen.** Build every ornament once in `build()` (main wraps it in `seeded()`), or wrap per-pose builders in `seeded(n, fn)`. Otherwise leaves and dots jump every pose.

## Library helpers (`liyue/lib.js`)

- **Garden:** `coping` (wall-top tiles), `latticeWindow(pts, clip, scene, cellArea)` (漏窗 with ice-crack lattice; the larger `cellArea` is, the sparser the lattice), `octagon`, `bamboo`, `leafSpray`, `pavilion`, `kongming` (sky lantern), `puffCloud`, `cloiCloud`, `cloiBlob`.
- **Flora:** `branch` (osmanthus bough with clusters), `osmFlower`, `osmCluster`, `leaf`, `lotus`, `pad`, `koi`.
- **Ornament:** `wire`, `wireSpiral`, `scrollCurl`, `goldLine`, `rosette`, `sparkle`, `twinkle`, `crescentC`, `ruyi`.
- **Geometry:** `poly`, `circD`, `ellD`, `ribbon`, `voronoi` + `clipHalf` (good for shattering things), `centroid`, `shrink`, `tf`, `pathLen`, `pathPt`, `pathBox`.
- **Figures:** `couple()`, a pair seen from behind (origin = centre of the seat line). Any figures in this style are backs, silhouettes or wire ghosts.
- Gradients in `head.html`: `moonE`, `moonLum`, `warmBloom`, `stoneG`, `tileG`, `robeO/P`, `kongG`, `fruitG`, `goldH`, `padG`, `lotusG`, `bambooG`, and more. Filters: `gouache`, `soft`, `glow`, `glowS`, `bloom`, `crayon`, `paper`.

## Motion vocabulary

- **Making:** the first 2–3 s of a shot is usually its main plate wiring and glazing itself. The bead leads the wire, and the enamel follows.
- **Soft dissolves** between shots (3 poses), not black cuts.
- **Things that act:** windows lighting one by one, a moon phase shade sweeping (`phaseShade(r, k, fill, op)`), a reflection breaking into voronoi shards and knitting back, ghosts drawn only in wire then fading, lanterns rising from lit windows to gather round the moon.
- **Camera:** gentle `zoom` pushes (1 → 1.03–1.08) or one pull-back for the ending (1.28 → 1). Small `pan` on long walls.

## Captions

The Chinese line is big, in ZCOOL XiaoWei, inking in one character at a time (7 per second, fading up with a 6 px rise). The English line is small, in Cormorant Garamond italic, and fades in after. A soft scrim sits under the caption band, so keep subjects above y ≈ 690. For Chinese text drawn inside plates use `class="zh"` (`.cz` is Cinzel). Every glyph used in plates must be listed in `FILM.text` so it gets preloaded.

## Sound (`engine/liyue/audio.cjs`)

```bash
node engine/liyue/audio.cjs my-film
```
- **Pad:** a D-gong pentatonic chord whose level follows each shot's `mood` (0 = silence, 1 = full). A shot with `mood: 0` goes quiet, which is useful for a held-breath moment.
- **Guzheng:** additive plucks with press-vibrato and optional bends. An original motif is phrased over the film (edit `plan` for new films). `{ type: 'pluck', n }` plays scale degree n of D E F# A B D' E' F#'.
- **Shimmer:** a glassy sizzle that follows wire-laying activity.
- **Events:** `pluck, chime (hi), axe, pound, drip (hi), shatter, whoosh, bell, swell, finale`.
- Keep melodies original. Don't quote existing songs.

## Building your own film in this style

This guide gives you the tools, not a script. Pick your own poem, festival or story; the patterns below are what makes this style *land*.

- **Let a text be the spine.** A classical poem, a song or a letter gives you one line per shot, and cloisonné's slow "wire → enamel → glow" rhythm fits reading pace naturally.
- **Every object makes itself.** Don't cut to a finished picture: lay the wire, flood the cells, then fire it. The making *is* the animation, so give the main subject the longest making.
- **Make, break, mend.** Cloisonné is precious and fragile, so it rewards a structure where something is built, broken (shards, cracks, a shade sweeping across), then repaired with gold (金缮) or completed.
- **Pastel, then one glow.** Keep the palette soft and festive. Save the strongest glow for the emotional peak, and pull back to a wide shot at the end so the whole world is under that light.
- **Architecture as frames.** Moon gates, leak windows, eaves and railings frame the subject and double as wire patterns, which is cheaper and richer than open landscape.
