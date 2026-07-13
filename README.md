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
- **Four ways to glaze.** Choose your application method, and mix them on one piece:
  **Dip** (drag the pot into the tub — an even coat, bottom-up to the glaze line),
  **Pour** (hold to pour over the rim — coats top-down with runs and drips, builds thick
  and can run in the fire), **Brush** (drag up and down the wall to paint partial bands
  exactly where you want), and **Spray** (hold to mist the whole piece — thin, soft and
  even, the safe slow coat). Layer colours and methods, and use **wax resist** to
  protect a coat before the next.
- **Attach parts at leather-hard** — pull on a **handle**, a **spout**, or a **lid** and
  the piece becomes what it's for: a cup + handle is a **mug**, a jug + spout a
  **pitcher**, handle + spout a **teapot**, add a lid for a **lidded jar**. Attach at the
  right moisture for a strong join — a weak join can crack off in the fire.
- **Decorate the surface** at leather-hard: paint a motif (dots, dashes, bands, wave,
  chevron, vine, cross-hatch) in an **underglaze** or **slip** colour, scratch it back to
  bare clay with **sgraffito**, or press it in as a darker **stamp**. The colour comes up
  in the fire.
- **Bisque fire** → **glaze** (dip / pour / brush / spray; layer colours, **wax resist**
  for two-tone) →
  **load the kiln** and choose your **firing type** — **oxidation** (bright, safe),
  **reduction** (deep, shifted), or the specialty fires: **raku** (crackle + smoke-black
  bare clay + metallic flash), **wood** (amber ash-flashing down one flank), **salt**
  (glassy orange-peel). Specialty fires are riskier but characterful. Put it **on a
  stilt** so a running glaze can't weld to the shelf, then **cold-finish**: **grind the
  foot smooth**, and optionally add a **gold lustre** third firing that gilds the rims.
  → **glaze fire**. Every firing rolls real risk from your shortcuts: wet clay and air
  bubbles burst, thin walls split, heavy glaze runs, weak joins let go.
- **You drive the firing.** Once the kiln door seals, **hold to heat** and watch a pack
  of **pyrometric cones** bend — they track *heat-work* (temperature over time, exactly
  like real Orton cones), not just peak temperature. When the middle **target cone**
  (Cone 04 bisque, Cone 6 glaze) tips over, **cut the kiln** for a clean firing.
  **Underfire** (cut too early) and the glaze stays dry, dull and immature (−rating);
  fire to the cone for the fullest colour and a rating bonus; push past the **guard
  cone** and it **overfires** — the glaze burns pale and runs, the wall leans, and the
  break risk climbs. Release the heat to hold steady in the window.
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
