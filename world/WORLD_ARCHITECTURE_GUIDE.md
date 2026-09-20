# Interactive World: Beginner's Architecture and Game-Development Guide

This document explains how the `/world/` application works, from the React page down to each rendered 3D frame. It assumes you already understand normal web applications but are new to game development.

> Line numbers in this guide match the source code at the time this document was written. If code is inserted above a referenced line later, search for the named function, method, variable, or CSS class shown beside the line number.

## 1. The shortest mental model

The application has three cooperating layers:

| Layer | Web-development comparison | Main responsibility | Source |
|---|---|---|---|
| React and HTML | UI/component layer | Loading states, menus, dialogs, touch controls, and exhibit content | [`main.jsx`](./main.jsx), [`world.css`](./world.css) |
| Three.js | A retained-mode Canvas/WebGL view layer | Camera, lights, meshes, materials, avatar model, animation, and rendering | [`scene.js`](./scene.js) |
| Rapier | Domain/service layer for spatial rules | Character body, wall/booth colliders, collision response, and reset position | [`physics.js`](./physics.js) |

The browser DOM and the 3D world are separate visual layers:

```text
Browser window
└── React <main class="world-app">
    ├── <div class="scene-host">
    │   └── WebGL <canvas> inserted by Three.js
    │       └── 3D scene, hall, booths, avatar, camera, lights
    └── Regular HTML drawn over the canvas
        ├── header and caption
        ├── loading/error screen
        ├── directory and quality menu
        ├── interaction prompt and touch pad
        └── exhibit <dialog>
```

This resembles placing a full-screen `<canvas>` behind a React dashboard. React does not re-render the 3D scene every frame. Three.js owns that work through `requestAnimationFrame`.

## 2. Libraries and assets

Dependencies are declared in [`package.json:6`](../package.json#L6) and [`package.json:7`](../package.json#L7):

- **React / React DOM**: declarative HTML interface and state.
- **Three.js**: WebGL renderer, scene graph, geometry, materials, camera, lights, FBX loading, and skeletal animation.
- **Rapier (`@dimforge/rapier3d-compat`)**: collision detection and character movement.
- **Lucide React**: interface icons.
- **Vite**: local development and production bundling.

Character files are under `public/world-assets/kenney/`:

- `Model/characterMedium.fbx`: skinned character model.
- `Animations/idle.fbx`: idle animation.
- `Animations/run.fbx`: running animation.
- `Animations/jump.fbx`: present as an asset but not loaded or used by the current code.
- `Skins/skaterMaleA.png`: character texture.

Files in `public/` are served from the website root. Therefore `public/world-assets/kenney/...` is requested in code as `/world-assets/kenney/...` at [`scene.js:153`](./scene.js#L153).

## 3. Startup and component flow

### 3.1 Browser entry point

Vite treats the normal portfolio and the 3D world as two page entries at [`vite.config.js:6`](../vite.config.js#L6):

- `/index.html`: original portfolio.
- `/world/index.html`: interactive world.

The world HTML contains `<div id="root">` at [`index.html:11`](./index.html#L11), then loads `main.jsx` at [`index.html:12`](./index.html#L12). This is the same pattern as a standard React single-page application.

React mounts the `App` component into that root at [`main.jsx:69`](./main.jsx#L69):

```jsx
createRoot(document.getElementById('root')).render(<App />);
```

### 3.2 The `App` component

`App()` begins at [`main.jsx:7`](./main.jsx#L7). It is the only React component in this page; the smaller pieces are currently inline JSX rather than separate component functions.

Its refs are declared at [`main.jsx:8`](./main.jsx#L8):

| Ref | Purpose |
|---|---|
| `canvasHost` | DOM element into which Three.js inserts its canvas. |
| `engine` | Stores the small public API returned by `createWorld()`. This is similar to holding a service instance. |
| `dialog` | Direct reference to the native HTML `<dialog>`. |

Its React state is declared at [`main.jsx:11`](./main.jsx#L11):

| State | Meaning |
|---|---|
| `status` | Loading/status message. An empty string means loading finished. |
| `error` | Fatal world-loading error shown to the user. |
| `near` | ID of the exhibit close enough to interact with, or `null`. |
| `active` | ID of the currently open exhibit, or `null`. |
| `menu` | Whether the directory/settings menu is open. |
| `quality` | Selected `low`, `balanced`, or `high` graphics mode. |
| `stats` | Latest FPS and draw-call values sent by the scene. |
| `content` | Experience/project HTML copied from the original portfolio page. |

### 3.3 Mounting the world

The first `useEffect` starts at [`main.jsx:20`](./main.jsx#L20) and runs once because its dependency array is empty at line 35.

It starts two asynchronous operations:

1. Lines [`22-29`](./main.jsx#L22) fetch the original `/index.html`, parse it using `DOMParser`, and reuse `.timeline` and `.work-card template` content. The source elements live at [`../index.html:50`](../index.html#L50), [`../index.html:102`](../index.html#L102), and the first template begins at [`../index.html:108`](../index.html#L108). This avoids maintaining duplicate portfolio content.
2. Line [`31`](./main.jsx#L31) calls `createWorld(canvasHost.current, callbacks)`. The callbacks let the non-React game code send status, proximity, open-dialog, and performance events back into React state.

When `createWorld()` resolves, its returned control API is saved in `engine.current` at [`main.jsx:32`](./main.jsx#L32).

The effect cleanup at [`main.jsx:34`](./main.jsx#L34) aborts the fetch and calls `engine.current?.dispose()`. This plays the same role as unsubscribing from observables, timers, and event handlers in a web component's destroy lifecycle.

### 3.4 Pausing when a dialog opens

The second `useEffect` is at [`main.jsx:36`](./main.jsx#L36). Whenever `active` changes it:

- calls `engine.pause(true)` when an exhibit is open;
- calls `engine.pause(false)` when it closes;
- opens or closes the native HTML dialog.

The `pause(value)` implementation is returned by the scene at [`scene.js:209`](./scene.js#L209). It clears held keys as well as changing `paused`, preventing a key pressed before the dialog from continuing to move the character afterward.

### 3.5 React-to-scene and scene-to-React communication

Think of `createWorld()` as a framework-independent service with inputs and outputs.

**React calls the scene:**

| Action | JSX caller | Scene method |
|---|---|---|
| Pause while dialog is open | [`main.jsx:37`](./main.jsx#L37) | `pause(value)` at [`scene.js:209`](./scene.js#L209) |
| Touch movement | [`main.jsx:56`](./main.jsx#L56) | `input(key, value)` at [`scene.js:210`](./scene.js#L210) |
| Return to entrance | [`main.jsx:53`](./main.jsx#L53), [`main.jsx:55`](./main.jsx#L55) | `reset()` at [`scene.js:211`](./scene.js#L211) |
| Change quality | [`main.jsx:53`](./main.jsx#L53) | `quality(value)` at [`scene.js:212`](./scene.js#L212) |
| Destroy world | [`main.jsx:34`](./main.jsx#L34) | `dispose()` at [`scene.js:150`](./scene.js#L150) |

**The scene calls React:**

| Callback | Scene caller | React effect |
|---|---|---|
| `onStatus` | [`scene.js:151`](./scene.js#L151), [`scene.js:206`](./scene.js#L206) | Shows/hides `.loading`. |
| `onNear` | [`scene.js:201`](./scene.js#L201) | Updates `near`, which controls `.interact` at [`main.jsx:54`](./main.jsx#L54). |
| `onOpen` | [`scene.js:174`](./scene.js#L174) | Updates `active`, opening the exhibit dialog. |
| `onStats` | [`scene.js:204`](./scene.js#L204) | Updates FPS/draw calls displayed in the menu. |

This callback boundary is useful: Three.js can update at 30-60 frames per second without causing a React render every frame. React changes only when status, proximity, or once-per-second stats change.

## 4. Understanding the Three.js scene

### 4.1 `createWorld(host, callbacks)`

The complete 3D application is created by the exported async function `createWorld()` at [`scene.js:14`](./scene.js#L14). It uses a closure: all scene state is private inside the function, and only five control methods are returned at lines [`207-213`](./scene.js#L207).

There is no custom `Game`, `Scene`, or `Player` class in this project. Instead, the code composes Three.js classes and local functions inside `createWorld()`.

### 4.2 Renderer, scene, and camera

These are the three core concepts of most 3D applications:

| Concept | Web analogy | Code |
|---|---|---|
| `THREE.WebGLRenderer` | Browser painter/layout engine for the canvas | [`scene.js:15`](./scene.js#L15) |
| `THREE.Scene` | Root DOM node for 3D objects | [`scene.js:23`](./scene.js#L23) |
| `THREE.PerspectiveCamera` | Viewport plus perspective projection | [`scene.js:26`](./scene.js#L26) |

The renderer creates a canvas as `renderer.domElement`. Line [`22`](./scene.js#L22) appends it to the React-owned `host` div.

Important renderer controls:

- Antialiasing and low-power GPU preference: [`scene.js:15`](./scene.js#L15).
- Pixel ratio/resolution cap: [`scene.js:16`](./scene.js#L16).
- Soft shadow maps: [`scene.js:17`](./scene.js#L17) and [`scene.js:18`](./scene.js#L18).
- sRGB output and filmic tone mapping: [`scene.js:19`](./scene.js#L19) through [`scene.js:21`](./scene.js#L21).
- Scene background and distance fog: [`scene.js:24`](./scene.js#L24) and [`scene.js:25`](./scene.js#L25).

The perspective camera uses a 53-degree field of view, aspect ratio initially set to `1`, near clipping distance `0.1`, and far clipping distance `100`. The real aspect ratio is set during resize at [`scene.js:145`](./scene.js#L145).

### 4.3 The scene graph

Three.js uses a tree called a **scene graph**. A child object's transform is relative to its parent, similar to an absolutely positioned element inside a transformed parent.

For example, each booth is a `THREE.Group` at [`scene.js:103`](./scene.js#L103). Its walls, desk, monitors, labels, plant, and marker are children. Moving or rotating the booth group moves or rotates every child together.

Coordinates follow this convention:

- `x`: left/right across the hall.
- `y`: height; `0` is approximately floor level.
- `z`: forward/back through the hall.
- Rotation values are radians. `Math.PI / 2` is 90 degrees.

`position.set(x, y, z)` places an object. `rotation.y` rotates it around the vertical axis. `scale.setScalar(value)` scales all three axes equally.

### 4.4 Geometry, material, and mesh

A visible Three.js object normally combines:

```text
Geometry (shape/vertices) + Material (surface appearance) = Mesh (renderable object)
```

The `box()` helper at [`scene.js:34`](./scene.js#L34) demonstrates this:

- `THREE.BoxGeometry(w, h, d)` creates the box shape at line 35.
- `material(color, glow)` selects the surface material.
- `THREE.Mesh(...)` combines them.
- Line 36 positions it, configures shadows, and adds it to its parent.

The box arguments are:

```js
box(parent, x, y, z, width, height, depth, color, glow = false)
```

The `cylinder()` helper at [`scene.js:38`](./scene.js#L38) follows the same pattern using `THREE.CylinderGeometry`.

The `material()` helper at [`scene.js:29`](./scene.js#L29) caches materials in a `Map`. Objects with the same color/glow combination reuse a material instead of creating duplicates. Normal objects use `THREE.MeshStandardMaterial`, which responds to lights. A glowing object also gets an emissive color at [`scene.js:31`](./scene.js#L31).

### 4.5 Text inside the 3D scene

`label()` is defined at [`scene.js:42`](./scene.js#L42). It does not create HTML text. It:

1. Creates an off-screen 2D canvas at line 43.
2. Draws text using the Canvas 2D API at lines 44-47.
3. Turns that canvas into a `THREE.CanvasTexture` at line 48.
4. Applies the texture to a flat `THREE.PlaneGeometry` at line 49.
5. Adds that plane to the 3D scene at line 50.

This is similar to taking a screenshot of a DOM label and using the image as a texture in 3D. Change the font at [`scene.js:47`](./scene.js#L47), the texture resolution at [`scene.js:43`](./scene.js#L43), or the default text color/background in the method signature at [`scene.js:42`](./scene.js#L42).

### 4.6 Lighting

The scene uses three lights:

- `THREE.HemisphereLight` at [`scene.js:52`](./scene.js#L52): general sky/ground color fill.
- `THREE.DirectionalLight` named `sun` at [`scene.js:53`](./scene.js#L53): the main shadow-casting light.
- `THREE.AmbientLight` at [`scene.js:55`](./scene.js#L55): low-level illumination everywhere.

Directional-light shadow resolution and camera bounds are configured at [`scene.js:54`](./scene.js#L54). Larger shadow maps improve sharpness but cost GPU memory and rendering time.

## 5. How the hall and objects are built

All environment objects are generated in code; there is no hall model file.

### 5.1 Floor and architecture

| Object | Responsible lines |
|---|---|
| Base floor slab | [`scene.js:58`](./scene.js#L58) |
| Repeating floor tiles | [`scene.js:59`](./scene.js#L59) and [`scene.js:60`](./scene.js#L60) |
| Back and side walls | [`scene.js:63`](./scene.js#L63) and [`scene.js:64`](./scene.js#L64) |
| Columns/ceiling beams | [`scene.js:65`](./scene.js#L65) through [`scene.js:69`](./scene.js#L69) |
| Back windows/panels | [`scene.js:70`](./scene.js#L70) through [`scene.js:73`](./scene.js#L73) |
| Glowing architectural strip | [`scene.js:74`](./scene.js#L74) |
| Raised side galleries/rails | [`scene.js:76`](./scene.js#L76) through [`scene.js:80`](./scene.js#L80) |

### 5.2 Plants and center display

The local `plant(parent, x, z, scale)` function is at [`scene.js:81`](./scene.js#L81). It builds a pot and stem from cylinders and seven low-poly leaf meshes. The group at line 82 makes the complete plant reusable.

Plant placements are controlled at [`scene.js:90`](./scene.js#L90), [`scene.js:94`](./scene.js#L94), and inside every booth at [`scene.js:117`](./scene.js#L117).

The center display is built at [`scene.js:91`](./scene.js#L91) through [`scene.js:100`](./scene.js#L100). It includes stacked cylinders, plants, sign boxes, text labels, a torus light ring, and supports.

### 5.3 Exhibit configuration

The exported `exhibits` array at [`scene.js:6`](./scene.js#L6) is the data/configuration source for booths:

```js
{
  id,       // React/dialog identity
  number,   // floor marker and panel collection number
  title,    // booth title, directory title, interaction prompt
  x, z,     // booth position
  angle,    // booth rotation around Y
  color,    // booth and marker color
  subtitle  // 3D subtitle on booth
}
```

The same data drives both systems:

- Three.js loops through it to build booths at [`scene.js:102`](./scene.js#L102).
- React loops through it to build the directory at [`main.jsx:53`](./main.jsx#L53).
- React finds titles/numbers for prompts and dialogs at [`main.jsx:54`](./main.jsx#L54), [`main.jsx:58`](./main.jsx#L58), and [`main.jsx:59`](./main.jsx#L59).
- Rapier loops through it to build matching booth colliders at [`physics.js:16`](./physics.js#L16).

This is similar to rendering both a list component and a map marker layer from the same API response.

### 5.4 Booth, desk, monitor, and marker construction

Every booth is generated at [`scene.js:102`](./scene.js#L102) through [`scene.js:122`](./scene.js#L122).

| Object | Exact code |
|---|---|
| Booth group, position, rotation | [`scene.js:103`](./scene.js#L103) |
| Colored back wall | [`scene.js:104`](./scene.js#L104) |
| Overhead structure | [`scene.js:105`](./scene.js#L105) |
| Glowing strip | [`scene.js:106`](./scene.js#L106) |
| Booth title | [`scene.js:107`](./scene.js#L107) |
| Booth subtitle | [`scene.js:108`](./scene.js#L108) |
| Desktop | [`scene.js:109`](./scene.js#L109) |
| Desk legs | [`scene.js:110`](./scene.js#L110) |
| Two-monitor loop | [`scene.js:111`](./scene.js#L111) |
| Monitor frame and screen | [`scene.js:112`](./scene.js#L112) |
| Monitor stand | [`scene.js:113`](./scene.js#L113) |
| Decorative screen lines | [`scene.js:114`](./scene.js#L114) |
| Books/items | [`scene.js:116`](./scene.js#L116) |
| Booth plant | [`scene.js:117`](./scene.js#L117) |
| Interaction floor marker | [`scene.js:118`](./scene.js#L118) |
| Marker number | [`scene.js:119`](./scene.js#L119) |
| World-space interaction point | [`scene.js:120`](./scene.js#L120) |

The screens do not contain a webpage, image, or interactive UI. They are thin colored boxes. For the second booth (`index === 1`, Skills & Projects), line 112 uses blue `#70acbc`; other booth screens use `#e4debd`. The thin boxes on line 114 imitate content lines.

To move a whole booth, change `x`, `z`, or `angle` in the `exhibits` array. To change the same object inside every booth, edit the construction lines above. Remember that booth-child coordinates are **local to the rotated booth group**.

### 5.5 Interaction distance

The marker's local `(0, 0, 3.1)` position is rotated and converted to world space at [`scene.js:120`](./scene.js#L120). Every frame, line [`200`](./scene.js#L200) searches for a trigger within `2.1` units of the avatar.

When the nearby ID changes, `callbacks.onNear()` is called at [`scene.js:201`](./scene.js#L201). React then renders the `.interact` button at [`main.jsx:54`](./main.jsx#L54). Pressing `E` opens it through the keyboard handler at [`scene.js:174`](./scene.js#L174).

Change `2.1` at line 200 to adjust interaction range. Change `3.1` at lines 118-120 to move the marker and trigger together.

## 6. Character loading and animation

### 6.1 Visual avatar versus physics body

The player has two representations:

- `playerBody` at [`scene.js:139`](./scene.js#L139): invisible Rapier body used for collision.
- `avatar` at [`scene.js:140`](./scene.js#L140): visible Three.js group containing the FBX model.

The physics body is the source of truth. Every frame the visible group copies its `x` and `z` at [`scene.js:194`](./scene.js#L194). This is comparable to rendering a UI from application state rather than directly mutating business data from the view.

### 6.2 Loading model, animations, and skin

`FBXLoader` is imported at [`scene.js:2`](./scene.js#L2). Four assets load in parallel with `Promise.all()` at [`scene.js:154`](./scene.js#L154): model, idle animation, run animation, and skin texture.

After loading:

1. Texture color space/filtering are configured at [`scene.js:155`](./scene.js#L155).
2. Every character mesh receives a textured `MeshStandardMaterial` at [`scene.js:156`](./scene.js#L156).
3. `THREE.Box3` measures the source model at [`scene.js:157`](./scene.js#L157).
4. Lines [`157-158`](./scene.js#L157) scale it to 1.9 world units tall and place its feet at local `y = 0`.
5. The model is added under the `avatar` group at [`scene.js:158`](./scene.js#L158).

### 6.3 `AnimationMixer`, clips, and actions

The relevant Three.js classes are:

- `THREE.AnimationClip`: animation data/keyframes loaded from FBX.
- `THREE.AnimationMixer`: updates animations for one model over time.
- `THREE.AnimationAction`: playable state created from a clip.

The mixer is created at [`scene.js:159`](./scene.js#L159). Lines [`161-166`](./scene.js#L161) create `actions.idle` and `actions.run`:

- The longest clip in each FBX is selected at line 162 because the files also include a one-frame pose.
- The clip is cloned at line 163.
- Both actions begin playing at line 164, but idle starts at weight `1` and run at weight `0`.

Starting both actions makes cross-fading immediate later; their weights decide which motion is visible.

### 6.4 Current state machine: idle and run only

The animation state is stored in the `animation` variable, initially `'idle'`, at [`scene.js:141`](./scene.js#L141).

The current state machine is at [`scene.js:195`](./scene.js#L195):

```text
No movement input ──> idle
Movement input    ──> run
```

When the state changes, line [`196`](./scene.js#L196):

- fades the old action out over 0.18 seconds;
- resets the new action;
- gives it full target weight;
- fades it in over 0.18 seconds;
- starts it and updates `animation`.

The mixer advances its timeline with `mixer.update(dt)` at [`scene.js:197`](./scene.js#L197). It is deliberately not updated while paused.

**There is no walking state in the current application.** Every movement key produces the `run` animation, and movement always requests the same speed. The README also identifies a walking clip as future work at [`../README.md:49`](../README.md#L49).

### 6.5 How to change animation behavior

Common controls and their current locations:

| Desired change | Location |
|---|---|
| Change idle/run FBX files | [`scene.js:154`](./scene.js#L154) |
| Register animation names/actions | [`scene.js:161`](./scene.js#L161) |
| Change cross-fade duration | `.18` twice at [`scene.js:196`](./scene.js#L196) |
| Change state-selection rule | [`scene.js:195`](./scene.js#L195) |
| Speed up/slow down an animation clip | Call `actions[name].setEffectiveTimeScale(value)` after line 164. |
| Freeze all animation while a panel is open | Controlled by [`scene.js:197`](./scene.js#L197) and `paused`. |

To add real walking:

1. Add a compatible `walk.fbx` under `public/world-assets/kenney/Animations/`.
2. Load it beside `idle` and `run` at line 154.
3. Add `['walk', walk]` to the action-building loop at line 161.
4. Track a run modifier such as `ShiftLeft` in the keyboard handler.
5. Select `idle`, `walk`, or `run` at line 195.
6. Pass a walking or running speed into physics instead of hard-coding one speed at [`physics.js:20`](./physics.js#L20).

For example, the state rule could conceptually become:

```js
const nextAnimation = !moving ? 'idle' : sprinting ? 'run' : 'walk';
```

The animation chosen and the physical speed should change together; otherwise the feet will appear to slide across the floor.

One current edge case is worth knowing: `moving` means the user supplied input at [`scene.js:189`](./scene.js#L189), not that the physics body actually changed position. Therefore the run animation can continue while the avatar pushes against a wall. A more advanced implementation can compare the body's previous and current positions before selecting the animation.

## 7. Input and character motion

### 7.1 Keyboard mapping

Key codes map to four logical directions at [`scene.js:168`](./scene.js#L168):

- W / Arrow Up -> `forward`
- S / Arrow Down -> `backward`
- A / Arrow Left -> `left`
- D / Arrow Right -> `right`

`keyDirection()` at [`scene.js:169`](./scene.js#L169) includes both `KeyboardEvent.code` and `KeyboardEvent.key` handling.

The listeners are:

- `keydown` at [`scene.js:170`](./scene.js#L170): adds held keys and short taps.
- `keyup` at [`scene.js:176`](./scene.js#L176): removes released keys.
- window `blur` at [`scene.js:177`](./scene.js#L177): prevents stuck movement after switching windows.
- document visibility change at [`scene.js:178`](./scene.js#L178): clears input and resets the clock delta.

`keys` stores held inputs. `taps` preserves a very quick press/release that occurs between two rendered frames; see [`scene.js:185`](./scene.js#L185) through [`scene.js:188`](./scene.js#L188).

Touch/pointer controls are rendered at [`main.jsx:56`](./main.jsx#L56). `onPointerDown` calls `engine.input(key, true)` and release/cancel calls `engine.input(key, false)`. The touch pad is hidden by default at [`world.css:59`](./world.css#L59) and shown for coarse pointers at [`world.css:60`](./world.css#L60).

### 7.2 Direction vector

Line [`187`](./scene.js#L187) converts buttons into a 3D vector:

```js
x = right - left
z = backward - forward
```

JavaScript converts `true` to `1` and `false` to `0` through `Number(...)`. Thus W produces `(0, 0, -1)`, and D produces `(1, 0, 0)`.

The vector is normalized at [`scene.js:191`](./scene.js#L191). Without normalization, diagonal input `(1, 0, -1)` would be about 1.414 times faster than movement on one axis.

Movement is world-axis/camera-aligned rather than relative to the avatar's facing. The camera does not orbit, so this feels consistent: W always moves toward negative Z/deeper into the hall.

### 7.3 Movement speed and frame-rate independence

The frame delta `dt` is measured at [`scene.js:184`](./scene.js#L184) and capped at `0.05` seconds. The cap prevents a large movement jump after a slow or interrupted frame.

The actual speed is hard-coded as `3.6` world units per second at [`physics.js:20`](./physics.js#L20):

```js
requested distance this frame = direction * 3.6 * dt
```

Multiplying by `dt` makes movement frame-rate independent. At 60 FPS, each frame is approximately `1/60` second, so 60 frames move about 3.6 units. The automated test verifies this at [`../scripts/check-physics.mjs:11`](../scripts/check-physics.mjs#L11) and [`../scripts/check-physics.mjs:12`](../scripts/check-physics.mjs#L12).

To change character travel speed, change `3.6` at [`physics.js:20`](./physics.js#L20). A cleaner future design would make speed a parameter such as `move(x, z, dt, speed)` or define named constants for walking/running speed.

### 7.4 Smooth character turning

The desired facing angle is calculated using `Math.atan2()` at [`scene.js:192`](./scene.js#L192). The rest of that line computes the shortest angular difference and applies only a percentage each frame.

`dt * 12` controls turn responsiveness:

- larger than `12`: avatar turns more quickly;
- smaller than `12`: avatar turns more slowly;
- replacing the interpolation with `avatar.rotation.y = target` makes rotation instant.

### 7.5 Resetting

The scene API's `reset()` is at [`scene.js:211`](./scene.js#L211). It clears input, calls the Rapier reset, restores avatar rotation, and immediately resets the camera.

The underlying physics reset is at [`physics.js:27`](./physics.js#L27). Its default entrance position is `(x = 0, y = 1, z = 8)`. Change the defaults there and the initial rigid-body position at [`physics.js:13`](./physics.js#L13) together if the entrance changes.

## 8. Physics and collision handling

### 8.1 Why physics is separate from Three.js

Three.js draws objects but does not automatically stop meshes passing through each other. Rapier calculates allowed movement using invisible mathematical shapes called **colliders**.

The visible wall and its collider are separate objects:

```text
Three.js wall mesh  -> what the user sees
Rapier cuboid       -> what blocks the character
```

Keeping `physics.js` independent also allows collision tests to run in Node without opening a browser.

### 8.2 Creating the Rapier world

`createPhysics(exhibits)` begins at [`physics.js:3`](./physics.js#L3):

1. `RAPIER.init()` at line 4 initializes the WebAssembly module.
2. `new RAPIER.World({ x: 0, y: 0, z: 0 })` at line 5 creates a world with zero gravity.
3. `solid()` at lines [`6-8`](./physics.js#L6) creates fixed cuboid colliders.

Gravity is zero because this prototype supports only flat X/Z movement. The code fixes the player's Y position to `1`; there is no falling, jumping, or sloped ground simulation.

### 8.3 Static colliders

The following invisible blockers are created:

| Collider | Code |
|---|---|
| Left/right perimeter walls | [`physics.js:9`](./physics.js#L9) |
| Front/back perimeter walls | [`physics.js:10`](./physics.js#L10) |
| Center planter cylinder | [`physics.js:11`](./physics.js#L11) |
| Round car podium cylinder | [`physics.js:12`](./physics.js#L12) through [`physics.js:15`](./physics.js#L15) |
| One cuboid per booth | [`physics.js:16`](./physics.js#L16) |

Rapier's `cuboid()` expects **half extents**, so `solid()` divides visual width/depth by two at [`physics.js:7`](./physics.js#L7).

Booth collider width/depth swap when `e.angle` is nonzero at [`physics.js:12`](./physics.js#L12). This matches booths rotated 90 degrees. It is a simplified condition: it is correct for the current `0`, `Math.PI / 2`, and `-Math.PI / 2` angles, but a freely rotated booth would need a rotated collider rather than only swapping dimensions.

The car podium uses a Rapier cylinder at [`physics.js:13`](./physics.js#L13) through [`physics.js:15`](./physics.js#L15). Its radius comes from `centerDisplay.width / 2`, matching the round Three.js podium. The large vertical half-height keeps the player blocked by the podium even though the world currently has no jumping or gravity.

### 8.4 Player rigid body and collider

The body is created at [`physics.js:13`](./physics.js#L13) as `kinematicPositionBased()`.

A kinematic body is moved explicitly by code but still participates in collision queries. This fits a player controller: keyboard input decides where the player wants to go, and Rapier adjusts that movement around obstacles. A dynamic body would instead be pushed using forces and affected by gravity.

The player's capsule collider is created at [`physics.js:14`](./physics.js#L14). A capsule has a cylindrical middle and rounded ends, which slides around corners more smoothly than a box.

The character controller is created with `0.03` offset at [`physics.js:15`](./physics.js#L15). That small gap helps collision stability. Sliding is enabled at [`physics.js:16`](./physics.js#L16), allowing diagonal movement along a wall instead of all motion stopping.

### 8.5 The `move(x, z, dt)` method

The complete physics movement method is [`physics.js:18`](./physics.js#L18) through [`physics.js:26`](./physics.js#L26):

1. Read the current body position at line 19.
2. Request movement based on direction, speed, and delta time at line 20.
3. Ask the character controller for collision-corrected movement at line 21.
4. Set the next kinematic position at line 22, keeping `y = 1`.
5. Set the world's timestep and simulate at lines 23-24.
6. Return the body's resulting position at line 25.

`scene.js` calls this only while movement input exists at [`scene.js:190`](./scene.js#L190) and [`scene.js:191`](./scene.js#L191).

### 8.6 What the physics does not currently do

- No gravity or floor collision.
- No jumping, despite the unused jump asset.
- No acceleration, deceleration, momentum, or forces.
- No collision between the player and decorative plants, desks, monitors, or railings.
- No animation root motion; physics moves the avatar independently of its animation.
- No network synchronization or server authority.

To make a new visible object block the player, add a matching Rapier collider in `createPhysics()`. Adding only a Three.js mesh makes it visible but non-solid; adding only a collider creates an invisible wall.

### 8.7 Physics tests

Run:

```sh
pnpm test
```

The script is registered at [`package.json:6`](../package.json#L6). [`check-physics.mjs`](../scripts/check-physics.mjs) verifies:

- expected free-movement speed at lines [`11-12`](../scripts/check-physics.mjs#L11);
- center planter collision at lines [`14-15`](../scripts/check-physics.mjs#L14);
- booth collision at lines [`16-18`](../scripts/check-physics.mjs#L16);
- perimeter wall collision at lines [`19-21`](../scripts/check-physics.mjs#L19);
- entrance reset at lines [`22-23`](../scripts/check-physics.mjs#L22).

## 9. Camera behavior

The initial camera position and target are set at [`scene.js:180`](./scene.js#L180).

During every frame:

- [`scene.js:198`](./scene.js#L198) places the desired camera 4.5 units high and 8.5 units behind the player. Camera X is clamped so it does not travel too far sideways.
- `camera.position.lerp(...)` smoothly approaches that desired position. `5` inside `Math.exp(-5 * dt)` controls follow responsiveness.
- [`scene.js:199`](./scene.js#L199) points the camera toward a position 1.3 units high and 2.7 units ahead of the character.

This is a fixed-direction follow camera, not an orbit camera. There is no mouse-look control.

Useful tuning values:

| Feel | Change |
|---|---|
| Camera higher/lower | `4.5` at [`scene.js:198`](./scene.js#L198) |
| Camera farther/closer | `current.z + 8.5` at line 198 |
| Camera follow tighter/softer | `5` in the exponential interpolation at line 198 |
| Look farther ahead/behind | `current.z - 2.7` at [`scene.js:199`](./scene.js#L199) |
| Wider/narrower perspective | camera FOV `53` at [`scene.js:26`](./scene.js#L26) |

## 10. The render/game loop

`animate()` begins at [`scene.js:182`](./scene.js#L182) and starts at [`scene.js:206`](./scene.js#L206).

This is the game equivalent of a continuously running UI update loop:

```text
requestAnimationFrame
        ↓
measure elapsed time (`dt`)
        ↓
read keyboard/touch input
        ↓
ask Rapier for collision-safe movement
        ↓
copy physics position to visible avatar
        ↓
select/update animation
        ↓
update camera and exhibit proximity
        ↓
renderer.render(scene, camera)
        ↓
browser displays the frame; repeat
```

Exact responsibilities:

| Frame step | Code |
|---|---|
| Schedule next frame | [`scene.js:183`](./scene.js#L183) |
| Calculate/cap delta time | [`scene.js:184`](./scene.js#L184) |
| Read input direction | [`scene.js:186`](./scene.js#L186) through [`scene.js:188`](./scene.js#L188) |
| Move and rotate | [`scene.js:189`](./scene.js#L189) through [`scene.js:193`](./scene.js#L193) |
| Synchronize visible avatar | [`scene.js:194`](./scene.js#L194) |
| Cross-fade/update animation | [`scene.js:195`](./scene.js#L195) through [`scene.js:197`](./scene.js#L197) |
| Follow with camera | [`scene.js:198`](./scene.js#L198) and [`scene.js:199`](./scene.js#L199) |
| Detect nearby exhibit | [`scene.js:200`](./scene.js#L200) and [`scene.js:201`](./scene.js#L201) |
| Draw the frame | [`scene.js:202`](./scene.js#L202) |
| Report performance once a second | [`scene.js:203`](./scene.js#L203) and [`scene.js:204`](./scene.js#L204) |

`renderer.render(scene, camera)` is the moment Three.js traverses the scene, sends geometry/material/light data to WebGL, and draws the canvas.

## 11. Rendering performance and quality

### 11.1 Static mesh batching

The hall initially consists of many separate boxes and cylinders. Drawing every mesh separately creates many GPU draw calls.

Lines [`123-138`](./scene.js#L123) optimize this:

1. Update all world matrices at line 124.
2. Traverse opaque meshes at lines 126-132.
3. Group cloned geometries by shared material UUID.
4. Bake each object's world transform into its cloned geometry at line 130.
5. Remove/dispose original opaque meshes at line 133.
6. Merge each material group with `mergeGeometries()` at line 135.
7. Add one combined mesh per material at line 136.

Transparent label planes are intentionally excluded at [`scene.js:127`](./scene.js#L127). The avatar is loaded after batching, so its skinned meshes are not merged.

This is similar to combining many small database writes into a batch, or bundling many DOM updates, to reduce per-operation overhead.

### 11.2 Graphics quality

The quality selector is rendered inside `.world-menu` at [`main.jsx:53`](./main.jsx#L53). Its implementation is [`scene.js:212`](./scene.js#L212):

- `low`: pixel ratio `1`, shadows disabled.
- `balanced`: pixel ratio capped at `1.25`, shadows enabled.
- `high`: pixel ratio capped at `1.75`, shadows enabled.

Higher pixel ratio means more canvas pixels rendered, which looks sharper but increases GPU cost. The once-per-second FPS and draw-call report comes from [`scene.js:204`](./scene.js#L204).

## 12. HTML interface and CSS class map

The full-screen positioning starts with `.world-app` and `.scene-host` at [`world.css:10`](./world.css#L10). The canvas fills its host at [`world.css:11`](./world.css#L11).

Major JSX/CSS classes:

| Class | JSX | Styling | Purpose |
|---|---|---|---|
| `.world-app` | [`main.jsx:42`](./main.jsx#L42) | [`world.css:10`](./world.css#L10) | Full-screen root. |
| `.scene-host` | [`main.jsx:43`](./main.jsx#L43) | [`world.css:10`](./world.css#L10), [`world.css:11`](./world.css#L11) | Three.js canvas mount. |
| `.world-header` | [`main.jsx:44`](./main.jsx#L44) | [`world.css:12`](./world.css#L12) | Overlay header. |
| `.world-brand` / `.brand-emblem` | [`main.jsx:46`](./main.jsx#L46) | [`world.css:15`](./world.css#L15) through [`world.css:17`](./world.css#L17) | Brand block. |
| `.icon-button` | [`main.jsx:47`](./main.jsx#L47) | [`world.css:18`](./world.css#L18) | Circular utility buttons. |
| `.loading` | [`main.jsx:49`](./main.jsx#L49) | [`world.css:34`](./world.css#L34) | Loading and error overlay. |
| `.world-caption` | [`main.jsx:52`](./main.jsx#L52) | [`world.css:19`](./world.css#L19) | Intro text over canvas. |
| `.world-menu` | [`main.jsx:53`](./main.jsx#L53) | [`world.css:27`](./world.css#L27) | Directory/quality panel. |
| `.interact` | [`main.jsx:54`](./main.jsx#L54) | [`world.css:32`](./world.css#L32) | Nearby exhibit prompt. |
| `.world-footer` | [`main.jsx:55`](./main.jsx#L55) | [`world.css:23`](./world.css#L23) | Bottom overlay and reset. |
| `.touch-pad` | [`main.jsx:56`](./main.jsx#L56) | [`world.css:59`](./world.css#L59), [`world.css:60`](./world.css#L60) | Coarse-pointer movement controls. |
| `.exhibit-dialog` | [`main.jsx:58`](./main.jsx#L58) | [`world.css:39`](./world.css#L39) | Native modal dialog. |
| `.exhibit-sheet` | [`main.jsx:59`](./main.jsx#L59) | [`world.css:41`](./world.css#L41) | Dialog's content container. |
| `.portfolio-content` | [`main.jsx:60`](./main.jsx#L60) | [`world.css:46`](./world.css#L46) onward | Reused portfolio content. |
| `.contact-actions` | [`main.jsx:62`](./main.jsx#L62) | [`world.css:58`](./world.css#L58) | Contact links. |

The HTML overlay stays readable and accessible to browsers and assistive technologies, while the canvas is used only for spatial/visual content.

## 13. Lifecycle and cleanup

Long-running graphical applications must release resources explicitly. `dispose()` at [`scene.js:150`](./scene.js#L150):

- sets `stopped` so no new frame work runs;
- cancels `requestAnimationFrame`;
- disconnects `ResizeObserver`;
- removes every registered event listener;
- stops animation actions;
- disposes geometries, materials, and textures;
- frees the Rapier world;
- disposes the renderer and removes its canvas.

The `listen()` helper at [`scene.js:144`](./scene.js#L144) records matching cleanup functions whenever an event listener is added. `resources()` at [`scene.js:147`](./scene.js#L147) traverses scene resources for disposal.

This is the 3D equivalent of avoiding memory leaks from subscriptions, timers, Blob URLs, and detached DOM trees.

## 14. Safe modification recipes

### Change a booth's location, color, or text

Edit the relevant object in `exhibits` at [`scene.js:6`](./scene.js#L6). Because rendering, directory UI, triggers, and booth physics share this array, most booth-level changes stay synchronized automatically.

After changing a booth's dimensions in its construction code, manually update the collider sizes at [`physics.js:12`](./physics.js#L12); dimensions are not currently derived from the rendered geometry.

### Change the monitor screen

- Screen size/position/color: second `box(...)` on [`scene.js:112`](./scene.js#L112).
- Decorative lines: [`scene.js:114`](./scene.js#L114).
- Real text: add a `label(booth, ...)` near those lines.
- Real image: load a texture and use it in a plane material; ensure it is loaded before the static batching pass or excluded from batching if it must change.

### Change movement feel

- Travel speed: `3.6` at [`physics.js:20`](./physics.js#L20).
- Turning responsiveness: `12` at [`scene.js:192`](./scene.js#L192).
- Animation fade: `.18` at [`scene.js:196`](./scene.js#L196).
- Camera follow responsiveness: `5` at [`scene.js:198`](./scene.js#L198).
- Interaction radius: `2.1` at [`scene.js:200`](./scene.js#L200).

After changing speed, update the expected distance test at [`check-physics.mjs:12`](../scripts/check-physics.mjs#L12).

### Add a visible solid object

1. Build its Three.js mesh using `box()`, `cylinder()`, or a loaded model in `scene.js`.
2. Add a corresponding fixed collider in `createPhysics()`.
3. Add a collision test if the object affects important navigation.

### Add a new exhibit

1. Add a new `exhibits` entry at [`scene.js:6`](./scene.js#L6).
2. Add matching dialog content keyed by its `id` near [`main.jsx:60`](./main.jsx#L60) through [`main.jsx:63`](./main.jsx#L63).
3. Check that its booth collider does not overlap other navigation paths.
4. Test its marker, E-key prompt, menu entry, and mobile interaction.

### Add jumping

Jumping is not a one-line animation change. The current world has zero gravity and a kinematic body locked to `y = 1`. A complete implementation would require:

1. vertical velocity and gravity;
2. ground detection;
3. jump input and cooldown/state rules;
4. Y movement in the character controller;
5. floor/step colliders;
6. jump/fall/land animation states;
7. camera and collision tests.

The existing `jump.fbx` is only the visual animation asset; it does not provide physical jumping by itself.

## 15. Common beginner mistakes in this codebase

- **Moving only the Three.js avatar:** it will visually move for one frame, then line 194 will snap it back to the Rapier body. Move through `movement.move()` or update the physics body.
- **Adding a mesh without a collider:** the character walks through it.
- **Adding a collider without a mesh:** the character hits an invisible wall.
- **Using frame-based distance instead of `speed * dt`:** movement speed changes with FPS.
- **Skipping direction normalization:** diagonal movement becomes faster.
- **Loading an animation but never calling `mixer.update(dt)`:** the model remains frozen.
- **Changing an exhibit ID in only one place:** dialog content checks in `main.jsx` must use the same ID.
- **Forgetting cleanup:** duplicate event listeners and animation loops can remain after React remounts.
- **Expecting React state to drive every frame:** per-frame transforms belong in the Three.js loop; React should own coarse UI state.
- **Editing generated/batched meshes after batching:** opaque hall meshes are merged at lines 123-138, so their original object references are no longer live scene children.

## 16. End-to-end example: pressing W

Following one action through the whole application makes the architecture easier to remember:

1. The browser sends `keydown` with `KeyW`.
2. `mapping` converts it to `forward` at [`scene.js:168`](./scene.js#L168).
3. The listener adds `forward` to `keys` at [`scene.js:173`](./scene.js#L173).
4. On the next frame, `animate()` produces direction `(0, 0, -1)` at [`scene.js:187`](./scene.js#L187).
5. The direction is normalized and sent to `movement.move()` at [`scene.js:191`](./scene.js#L191).
6. Rapier requests `-3.6 * dt` Z movement, corrects it for collisions, and steps the world at [`physics.js:20`](./physics.js#L20) through [`physics.js:24`](./physics.js#L24).
7. The Three.js avatar copies the Rapier position at [`scene.js:194`](./scene.js#L194).
8. Animation changes from idle to run at [`scene.js:195`](./scene.js#L195) and [`scene.js:196`](./scene.js#L196).
9. The camera follows at [`scene.js:198`](./scene.js#L198).
10. Three.js renders the updated scene at [`scene.js:202`](./scene.js#L202).
11. Releasing W removes `forward` at [`scene.js:176`](./scene.js#L176); the next frame cross-fades back to idle.

That path—**input -> intent -> physics -> visual transform -> animation/camera -> render**—is the core game loop in this application.
