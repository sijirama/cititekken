# Fighter artwork

Created specifically for Aso Arena using OpenAI image generation on 2026-11-22.
These are fictional political-satire depictions, not photographs or licensed Tekken/Street Fighter assets.

## Files
- tinubu-atlas.png: 1024 × 1536 RGBA; 4 × 4 combat pose atlas.
- obi-atlas.png: 1024 × 1536 RGBA; 4 × 4 combat pose atlas.

## Art direction
Recognizable older Nigerian political figures interpreted as powerful, realistic-proportioned fighting game characters. Detailed painted skin, muscular anatomy, embroidered clothing, dramatic warm lighting. Tinubu: green fila cap with cream infinity embroidery, round glasses, emerald/gold sleeveless agbada-inspired tunic, dark trousers and leather wraps. Obi: rectangular glasses, close-cropped hair, fitted charcoal senator-style tunic with silver embroidery, wrapped hands and combat boots.

## Frame layout (row-major)
0 guarded stance; 1 alternate stance; 2 jab windup; 3 jab extension;
4 punch recovery; 5 cross windup; 6 cross extension; 7 raised knee;
8 extended side kick; 9 kick recovery; 10 guard; 11 crouching guard;
12 hit recoil; 13 stagger; 14 victory; 15 knockout.

Generated as individual atlas images, followed by an image-generation editing pass requesting alpha-background removal with pose positions and costume detail preserved. Original generated files retained in the Codex generated_images directory. The game loads the self-contained copies here.
