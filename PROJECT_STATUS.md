# Portfolio Project Status

Last updated: 2026-09-21

This file is the durable handoff for continuing the project in this chat or a
future Codex chat. Read it together with the current source code; when they
disagree, the source code is authoritative.

## Project goal

The repository contains Harikrishnan P M's original responsive portfolio and a
separate game-like 3D portfolio world. The world should feel like a
semi-stylized indoor exhibition while remaining practical on laptops with 8 GB
RAM, a Core i5 or Ryzen 5 processor, and integrated graphics.

The intended minimum performance is 30 FPS, with 60 FPS preferred. Final
performance must eventually be checked on representative physical hardware.

## Current repository state

- Repository: `C:\Projects\haripmdev-portfolio`
- Branch: `main`
- Current recorded commit: `5ab6db5` (`stall personalization`)
- Remote deployment branch: `origin/main`
- Portfolio route: `/`
- Interactive world route: `/world/`
- Frameworks: React 19, Three.js 0.180, Rapier 0.19, Vite 7
- No backend, database, or API key is required.

The working tree includes the local Camaro display implementation and updated
documentation. These changes have not been committed or published by Codex.

## Implemented experience

The original static portfolio remains at the site root. Its existing content
and responsive layout are retained, with an entry button that opens the 3D
world.

The world currently includes:

- A code-built indoor exhibition hall with tiled floor, walls, windows, beams,
  lighting, plants, a central display, and a fixed-direction follow camera.
- Keyboard movement using WASD or arrow keys, preliminary touch controls,
  smooth turning, reset-to-entrance, and idle/run animation blending.
- Rapier character movement with perimeter, Camaro display, and booth collision.
- Five exhibits: Experience, Skills & Projects, About me, Get in touch, and Fun
  part.
- Proximity interaction through a floor marker and the E key, plus direct
  access through the directory.
- Low, Balanced, and High graphics settings with an FPS/draw-call readout.
- Accessible HTML dialogs for detailed exhibit content.

Experience and Fun part have received their first personalization pass:

- Experience uses Geekywolf and EY branding, .NET, Angular, and Azure artwork,
  and presents ControlQore as a project.
- Fun part uses Spider-Man, Doctor Strange, Loki, Jon Snow, and White Walker
  poster artwork, plus simple themed desk props.
- The Fun part dialog exposes the five posters as a responsive gallery.

The remaining booths still use the generic prototype styling.

The central planter, green display and quote signs have been replaced with a
static 1967 Chevrolet Camaro SS on a low platform. The suspended light ring and
peripheral plants remain. A rotated box collider blocks the display footprint;
both side passages stay open. The playable avatar is unchanged.

## Current avatar state

The playable avatar in the committed source is still Kenney's **Skater Male**.
`world/scene.js` loads its FBX model, skin, idle animation, and run animation
from `public/world-assets/kenney/`.

`public/world-assets/captain/captain-america.glb` is present and is about 4.2 MB,
but it is not currently loaded by the application. The downloaded GLB contains
a skeleton but no animation clips. Replacing the playable character therefore
still requires:

1. A GLTF loader path in the world runtime.
2. Material and orientation verification.
3. Compatible idle and walk/run animations or a properly retargeted animation
   set.
4. Removal or correction of any detached accessory meshes.
5. Visible attribution in the application and a retained license record.
6. Movement, animation, collision, desktop, and narrow-screen verification.

Embedded download metadata identifies the model as "Captain America (Marvel's
Avengers Infinity War)" by `mikomagallona`, sourced from Sketchfab under CC BY
4.0. Before publishing it, preserve the exact creator/source/license links and
state any modifications. The model is based on third-party character IP, so its
public use should be treated separately from the modeller's CC attribution.

## Architecture map

| File | Responsibility |
|---|---|
| `index.html`, `styles.css`, `main.js` | Original portfolio and entry to the world |
| `world/main.jsx` | React overlay, directory, dialogs, controls, content loading |
| `world/scene.js` | Three.js renderer, hall, booths, avatar, camera, game loop |
| `world/personal-stalls.js` | Experience/Fun artwork loading and stall decoration |
| `world/center-display.js` | Camaro loading, material batching, scale and shared display dimensions |
| `world/physics.js` | Rapier world, colliders, player movement, reset |
| `world/world.css` | World overlay and dialog styling |
| `scripts/check-physics.mjs` | Movement and collision checks |
| `vite.config.js` | Multi-page build and static asset copying |
| `.github/workflows/deploy-pages.yml` | GitHub Pages production deployment |
| `world/WORLD_ARCHITECTURE_GUIDE.md` | Beginner-oriented explanation of the game architecture |

The exhibit list in `world/scene.js` drives booth placement, floor markers,
directory entries, interaction triggers, and booth colliders. Detailed dialog
content is selected by the matching exhibit ID in `world/main.jsx`.

The Experience and project dialogs reuse content parsed from the root portfolio
HTML. This avoids maintaining two conflicting copies of career information.

## Assets and attribution

### Kenney avatar

- Location: `public/world-assets/kenney/`
- Pack: Animated Characters Protagonists
- Active skin: Skater Male
- License: CC0; original license stored as `License.txt`
- Source: https://kenney.nl/assets/animated-characters-protagonists

### Personalized stall artwork

- Location: `public/world-assets/personal/`
- Company/project artwork: Geekywolf, EY, ControlQore
- Technology artwork: .NET, Angular, Azure
- Fun artwork: Spider-Man, Doctor Strange, Loki, Jon Snow, White Walker

Before public release, record the source and usage rights for every logo and
poster that did not originate with the portfolio owner. Do not assume that an
image found online is reusable merely because it can be downloaded.

### Captain America candidate

- Location: `public/world-assets/captain/captain-america.glb`
- Current state: stored but unused
- Model creator: `mikomagallona`
- License recorded in GLB metadata: CC BY 4.0
- Source: https://sketchfab.com/3d-models/captain-america-marvels-avengers-infinity-war-bfa7a03d10544ac98cf8c80e8abc8456

### Camaro centre display

- Location: `public/world-assets/camaro/camaro.glb`
- Original download is preserved; runtime changes do not rewrite the GLB.
- Model: 1967 Chevrolet Camaro SS by OUTPISTON, approximately 2.17 MB,
  26,711 triangles, 10 materials and 9 embedded textures (maximum 1024 square).
- No skeleton or animation clips; the car is decorative, not driveable.
- Opaque geometry is merged by material after baking node transforms.
- Transmission is replaced by simpler tinted transparency for integrated GPUs.
- Scale, ground alignment and display rotation are applied at load time.
- Credits and exact source/license links: `public/world-assets/camaro/CREDITS.txt`.
  The directory exposes a visible credits link.
- Recorded license: CC BY-NC-SA 4.0. Resolve public/commercial-use suitability
  before release; do not treat this asset as unrestricted or CC0.

## Controls and mechanics

- WASD or arrow keys: move on the X/Z plane.
- E near a stall marker: open that exhibit.
- Escape or close button: close the exhibit; movement pauses while open.
- Directory button: open any exhibit and select graphics quality.
- Reset button: return to the entrance.
- The current world has no gravity, jumping, combat, mouse-look, or free camera.
- Animation is visual; physics moves the character independently of root motion.

## Performance decisions

- The renderer requests the low-power GPU preference.
- Balanced mode caps device pixel ratio at 1.25.
- Low mode uses pixel ratio 1 and disables real-time shadows.
- Static opaque hall geometry is merged by material to reduce draw calls.
- One directional light casts live shadows.
- The current production JavaScript is roughly 1.07 MB gzip, including physics.

Remaining performance work includes GLB optimization, loading strategy, reduced
texture sizes where needed, physical integrated-GPU profiling, and checking the
cost of each additional 3D character.

## Development and deployment

```sh
pnpm install
pnpm dev
pnpm test
pnpm build
pnpm preview
```

The world must be served over HTTP; opening `world/index.html` directly will not
work correctly.

GitHub Pages deployment is defined in `.github/workflows/deploy-pages.yml`.
Pushing to `main` runs the Vite production build and publishes `dist`. Repository
Settings > Pages must use **GitHub Actions** as its source.

Do not assume a local change is published until it has been committed, pushed,
and the Pages workflow has completed successfully.

## Verification baseline

Camaro checkpoint: collision tests and production build passed. Browser checks
at 1280x720 and 390x844 confirmed the car, materials, platform and credits render
without browser errors. The existing Rapier initialization deprecation warning
remains. Physical integrated-GPU performance is not yet verified.

`pnpm test` checks unobstructed movement, Camaro front/side collision, both
passages around the car, booth
collision, outer-wall collision, and entrance reset.

For a visual change, also check:

- The world is nonblank and framed correctly on a laptop viewport.
- The avatar is visible, correctly scaled, facing the travel direction, and
  switches between idle and movement animation.
- New textures and models load without browser errors.
- Exhibit markers, E-key prompts, dialogs, Escape dismissal, and reset work.
- The directory and dialogs remain usable on a narrow viewport.
- FPS and draw calls remain reasonable in Balanced mode.

The Vite build currently warns that the original root `main.js` is a classic
script and that the world bundle exceeds 500 KB. These are known warnings; the
original script is copied unchanged and bundle optimization remains release
work.

## Known limitations

- The scene is a playable layout and early art pass, not final reference-image
  fidelity.
- Education does not yet have its own exhibit.
- Generic styling remains on Skills & Projects, About, and Contact.
- Mobile controls are preliminary; laptops remain the primary target.
- Decorative objects do not all have matching colliders.
- The architecture guide contains line references and avatar details that may
  become stale as source files change; search for the named symbol when needed.
- Asset licensing records for the personalized logos and posters are incomplete.
- The Captain America candidate is present but not integrated in the current
  committed runtime.

## Next milestones

1. Decide whether to finish the Captain America playable-avatar integration or
   keep a freely licensed original avatar for the public release.
2. If Captain America is used, add compatible animations and complete visible
   attribution before publishing.
3. Playtest movement speed, animation feel, camera framing, booth spacing, and
   interaction distance on the target laptop class.
4. Refine Experience and Fun part after the first user review, then apply the
   established visual language to the other booths.
5. Collect education content and exact personal-interest text before adding new
   claims or dialogue content.
6. Complete asset optimization, accessibility/reduced-motion work, licensing
   records, physical performance profiling, and release verification.

## Maintenance rule

Update this file whenever a meaningful checkpoint changes the project's state,
especially after:

- adding or replacing an asset, avatar, exhibit, or mechanic;
- changing architecture, controls, deployment, or performance behavior;
- completing a milestone or discovering a blocker;
- committing or publishing a substantial set of changes.

At each update, change `Last updated`, move completed items into the implemented
sections, revise known limitations and next milestones, and record any new asset
credit. Do not turn this into a chronological diary; keep it as an accurate
snapshot that a fresh chat can use immediately.
