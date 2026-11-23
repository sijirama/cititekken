# Aso Arena design

## Current direction
An immersive, viewport-filling AI spectator fighting game. User explicitly requested the removal of the masthead, lower control bar, statistics and footer. The entire page is now the fight; only health bars, names, round timer, win markers and two discreet sound/pause buttons remain during combat.

## Location
Simple empty grassland, requested in the latest user correction. Soft green meadow, distant rolling hills, and natural daylight. No crowd, bus stop, buildings, or props. Static illustrated backdrop with Three.js fighter sprites, contact shadows and live impact particles composited over it.

## Characters
Retain the detailed fighter artwork the user approved: emerald/gold sleeveless agbada and fila for Tinubu; charcoal/silver senator tunic and wrapped hands for Obi. Sixteen combat poses per fighter. 2.5D characters rather than fully rigged 3D meshes.

## Match flow
A 3.8-second close-up Tinubu–Obi face-off opens each match, followed by Round 1 / Fight. Intro is skippable. Subsequent rounds go directly to the round call. The face-off references the user's fighting-game VS-screen example in composition, with original generated portraits. The menu uses a dimmed, softly blurred live stage and a focused Resume/Restart panel. Sound, slow motion and fullscreen settings live in this pause menu. Space and Escape toggle pause. No navigation or website footer.

## Typography and colors
Locally bundled Barlow for controls; Barlow Condensed for fighter names, timer, VS and round calls. Warm cream/gold text, green versus amber health, strong dark contrast over the stage. Mobile uses a compact HUD and contains both portraits during the face-off; the game never scrolls.
