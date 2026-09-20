# Harikrishnan's portfolio

The original HTML/CSS/JavaScript portfolio is at `/`. The separate React/Three.js exhibition is at `/world/`. Only the new world link and its spacing change the original page.

For the current implementation state, pending work, asset credits, and the
handoff procedure for future chats, read [`PROJECT_STATUS.md`](./PROJECT_STATUS.md).

## Local development

Install Node.js 20.19+ or 22.12+ and pnpm, then run:

```sh
pnpm install
pnpm dev
```

Build with `pnpm build`. Deploy the `dist` directory to a static host such as Netlify. Preview a production build with `pnpm preview`. The world requires an HTTP server, not opening its HTML file directly. No backend or API key is needed.

GitHub Pages deployment is handled by `.github/workflows/deploy-pages.yml`. In the repository's **Settings > Pages**, set **Source** to **GitHub Actions** once. Every later push to `main` builds and publishes `dist` automatically.

## Prototype controls

- WASD or arrow keys: move relative to the fixed-direction follow camera.
- Approach a colored floor marker and press E or click its prompt to open the exhibit.
- Escape or the close button: dismiss a panel. Movement pauses while it is open.
- Top-right directory: open any exhibit directly and change graphics quality.
- Bottom-right reset: return to the entrance.
- Touch devices have directional buttons, but this milestone primarily targets laptops.

## Implementation

- `world/main.jsx`: accessible HTML panels, directory, loading/error states.
- `world/scene.js`: Three.js hall, Kenney FBX character/animations, Rapier collisions, follow camera.
- `world/physics.js`: shared collision/movement implementation, checked by `pnpm test`.
- `world/center-display.js`: static Camaro display, material batching and shared collision dimensions.
- `world/world.css`: isolated world UI styles.
- Portfolio experience and project content is read from the original HTML to avoid two conflicting copies.
- Static meshes are batched by material. Balanced quality caps pixel ratio at 1.25; Low disables real-time shadows.

## Assets

Kenney Animated Characters Protagonists, Skater Male, CC0.
Source: https://kenney.nl/assets/animated-characters-protagonists
Original license: `public/world-assets/kenney/License.txt`.
The prototype loads the original FBX assets with Three.js FBXLoader. Idle and run use the longest animation clip in their respective files. GLB conversion is a later optimization, not a prerequisite.

## Planning and next milestones

The central Camaro display uses OUTPISTON's 1967 Chevrolet Camaro SS under
CC BY-NC-SA 4.0. Exact attribution and source links are retained in
`public/world-assets/camaro/CREDITS.txt` and linked from the world directory.
The original GLB is preserved; scale, batching and simplified glass are applied
at runtime. This is a static exhibit, not a driveable vehicle.

Agreed baseline: semi-stylized indoor exhibition, ordinary Core i5/Ryzen 5 laptops, 8 GB RAM, integrated graphics. Target 30 FPS minimum, ideally 60, verified on representative physical hardware before release.

1. Current prototype: one floor, animated character, camera, collision boundaries, Experience, Skills & Projects, About and Contact panels; homepage entry point.
2. User playtest: tune avatar pace, camera framing, hall proportions and booth placement.
3. Art pass: complete one booth with stronger reference-image detail, then extend the style to other booths. Add a compatible walking clip if jogging feels too fast.
4. Content: collect actual education details and interests before adding those exhibits. Do not invent qualifications or personal interests.
5. Release: GLB asset optimization, low-tier hardware profiling, accessibility/reduced-motion audit, broader mobile control testing and deployment.

The current scene is a playable layout prototype, not final reference-image fidelity. Balcony is decorative, there is no jumping or free camera orbit, and this version uses one live shadow light rather than baked lighting. Mobile controls are preliminary. FPS measured in the development browser cannot guarantee performance on all integrated GPUs.

## Verification

- `pnpm test`: unobstructed movement, Camaro front/side collision, both side passages, booth collisions, outer wall, reset.
- Production build and direct `/world/` load checked; Experience panel successfully loaded from production portfolio HTML with no browser errors observed.
- Browser checks cover avatar rendering/animation, directory panels, Escape dismissal, graphics selection, and homepage entry at desktop and narrow screen sizes.
- The world JavaScript bundle is currently approximately 1.07 MB gzip, including physics. Further loading optimization and physical integrated-GPU benchmarks remain release work. Vite warns about the original classic `main.js` script; it is intentionally copied unchanged into the build.
