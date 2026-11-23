# Aso Arena
React + Three.js AI spectator fighting game with original fictional Tinubu and Peter Obi character art. Political satire; no affiliation or endorsement.

## Run
```sh
npm install
npm run dev
```
Open the Vite URL. Once all artwork is loaded, a short face-off introduces the match, followed by automatic combat. Skip Intro jumps to round one.

The game fills the screen. Use the bottom-right pause button, Space or Escape to open the pause menu. Resume, restart, sound, slow motion and fullscreen are available there; sound also has a small in-fight toggle. Matches are first to two round wins. Use Run it back on the winner screen for another match.

## Build
```sh
npm run build
npm run preview
```

## Rendering
Detailed sixteen-pose RGBA fighter atlases are composited with Three.js over a simple illustrated grassland backdrop, with no spectators or buildings. Fighter movement, contact shadows, recoil and hit effects animate live. This is a 2.5D presentation, not rigged 3D character meshes. The face-off uses separately generated close-up portraits matching the fighter costumes. All fonts and artwork are bundled locally.

Combat uses probabilistic rule-based AI (distance, reach, guard, cooldowns, hit reactions), with 60-second rounds. No runtime AI service is required. WebGL is required.

- src/main.jsx: full-screen HUD, face-off, pause and match-result screens.
- src/arena.js: simulation, round flow and WebGL rendering.
- src/fighters.js: character atlases and pose animation.
- public/fighters/PROVENANCE.md and public/scene/PROVENANCE.md: artwork provenance.
