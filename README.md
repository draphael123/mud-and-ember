# Mud & Ember — a pottery studio

**A cozy, tense pottery game for mobile.** Wedge the air out of the clay, centre it
on the wheel, throw a pot with your thumb — thin walls wobble and collapse, and the
clay dries while you fuss — carve it, survive the bisque fire, dip it in layered
glaze, then gamble everything on the glaze fire. Survivors go on your studio shelf,
and they stay there.

Single-file HTML5 game built with [Three.js](https://threejs.org/) (loaded from a
CDN). No build step — open `index.html`.

## Play

- Pick a form (cup / bowl / vase / jug / amphora, or freeform) — a guide silhouette
  appears on the wheel and your sketch match is scored. Optional **commissions** on
  the noticeboard pay coins for delivering the right piece.
- **Tap** to wedge · **press & hold** to centre · **drag ↔** to shape the wall ·
  **drag ↑** near the rim to pull taller
- **Rib** the wet wall anytime to smooth it into a clean, true curve — your first
  pot can't break, so learn freely
- At leather-hard: **trim** to even the walls, **carve** decoration (rings, wave,
  chatter, fluting, facets, dimples, spiral)
- Every firing bakes a unique **fired character** — subtle belly/waist, lean, uneven
  rim, warping, glaze colour-shift and drips — so no two pieces come out alike, even
  from the same shape and glaze. Each piece earns a **★ star rating** for craft.
- **Bisque fire** → **dip-glaze** (layer colours, use **wax resist** for two-tone) →
  **load the kiln** (fire in **oxidation** for bright true colour or **reduction** to
  deepen and shift it; put it **on a stilt** so a running glaze can't weld to the
  shelf) → **glaze fire**. Both firings roll real risk from your shortcuts: wet clay
  and air bubbles burst, thin walls split, heavy glaze runs.
- **Sign your work** with a maker's mark (Settings) — it's recorded on every piece.
- Ten forms and eighteen glazes with real-ceramic finishing — a trimmed foot ring
  the pot stands on, glaze pooling and breaking rusty on the rims, gentle mottling,
  and reactive glazes: **celadon/sage craze** (hairline crackle), **tenmoku/rust
  break dark on the rims** (iron), **oxblood/plum streak** (variegated running).
- Five clay bodies (red clay, stoneware, black clay and porcelain unlock as you fire
  pieces), a full brick-kiln firing cinematic, and a living studio (hanging lamp,
  potted plant, a napping cat).
- Cinematic rendering on HIGH graphics: bloom, a warm filmic grade + vignette,
  depth-of-field on the finished-piece shots, and a warm studio environment for
  believable glaze reflections. (Switch to LOW graphics in Settings for the fast
  path on low-end devices.)
- Every finished piece is shown off on a rotating display, saved to your persistent
  **My Gallery**, and lined up on the studio shelf. Photo mode exports a PNG.
- **Music player** with four tracks (one pre-rendered, three generative) — skip,
  pause, and pick from the 🎵 menu.
- Optional **cloud save** — sync your gallery across devices with a studio code
  (see setup below).

## Deploy

Static site — Vercel serves `index.html` at the domain root (`outputDirectory: "."`).
Pushes to `main` auto-deploy. No configuration needed beyond importing the repo.

## Cloud save (optional)

The gallery is saved in the browser's `localStorage` by default (per-device). To
sync it across devices, the game calls a tiny serverless function at
`api/studio.js` backed by a Redis/KV store. One-time owner setup in Vercel:

1. Vercel dashboard → this project → **Storage**
2. Create a **Redis / KV** database (Upstash's free tier works) and **Connect** it
   to the project — this injects `KV_REST_API_URL` + `KV_REST_API_TOKEN` (or the
   `UPSTASH_REDIS_REST_*` equivalents; the function accepts either)
3. **Redeploy**

Until a store is connected, `☁️ Cloud Save` shows setup instructions and the game
stays local-only — nothing breaks. Once connected, players hit **Enable cloud save**
to get a studio code and enter that same code on another device to sync. Identity is
the code itself (a capability token), so there's no login; anyone with a code can
read/write that studio, which is the right trade-off for a low-stakes gallery.

## Audio

The game ships with real audio in `audio/`, loaded via `audio/manifest.json` (anything
missing from the manifest falls back to the built-in WebAudio synthesizer, so the
folder is optional):

- **Music** — *"The River Studio"*, an original ~27-second seamless loop
  (Karplus–Strong plucked strings over Am–F–C–G with Schroeder reverb), rendered
  offline by `audio/render.js` (dependency-free; re-render with `node audio/render.js`).
  CC0, as are the rendered `squish` and `shatter`.
- **Foley** — `chime`, `crack`, `creak`, `scrape`, `slosh`, `thud` are trimmed from
  the [Sonic Pi](https://github.com/sonic-pi-net/sonic-pi) sample library, which is
  **CC0 / public domain** (originally from freesound.org — see the license note in
  Sonic Pi's `etc/samples/README.md`).

To swap any sound, replace its file (or point the manifest at a new one); `music`
should be a seamless loop, everything else is a one-shot.

## Credits & license

Game code © the author. Three.js is MIT-licensed. All bundled audio is CC0 / public
domain (see above), so the whole project is free to modify and redistribute.
