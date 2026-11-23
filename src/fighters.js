import * as THREE from 'three';

// Sixteen authored poses per fighter. Rows are idle/punch, cross/kick,
// kick/guard, and stagger/victory/knockout. Cell padding prevents UV bleed.
const COLS = 4;
const ROWS = 4;
const clamp = THREE.MathUtils.clamp;

function contactShadow() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  gradient.addColorStop(0, 'rgba(0,0,0,.7)');
  gradient.addColorStop(.45, 'rgba(0,0,0,.4)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

export function makeFighter(scene, index) {
  const root = new THREE.Group();
  scene.add(root);
  let resolveReady, rejectReady;
  const ready = new Promise((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });
  const texture = new THREE.TextureLoader().load(
    `/fighters/${index === 0 ? 'tinubu' : 'obi'}-atlas.png`,
    () => resolveReady(), undefined,
    () => rejectReady(new Error('The fighter artwork could not load. Refresh to try again.'))
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, alphaTest: .035, toneMapped: false });
  const sprite = new THREE.Sprite(spriteMaterial);
  // The atlas gives every cell a shared floor line, 95% down the image.
  sprite.center.set(.5, .055);
  sprite.scale.set(2.8, 4.2, 1);
  sprite.position.y = .035;
  sprite.renderOrder = 2;
  root.add(sprite);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.05), new THREE.MeshBasicMaterial({ map: contactShadow(), transparent: true, depthWrite: false, opacity: .85 }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = .025;
  root.add(shadow);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.69,.72,64),new THREE.MeshBasicMaterial({color:index===0?0x79e7be:0xffbb69,transparent:true,opacity:.24,side:THREE.DoubleSide,depthWrite:false}));
  ring.visible=false;
  ring.rotation.x=-Math.PI/2;
  ring.position.y=.018;
  root.add(ring);
  const fighter = { root, sprite, texture, shadow, ring, index, x:index===0?-2.3:2.3, hp:100, state:'idle', elapsed:0, cooldown:.2, move:null, resolved:false, stun:0, combo:0, frame:-1, animationTime:0 };
  setFrame(fighter, 0);
  fighter.ready = ready;
  return fighter;
}

function setFrame(f, frame) {
  if(f.frame === frame) return;
  f.frame = frame;
  const inset = .001;
  // Tinubu's extended boot crosses the nominal cell boundary. Give that
  // pose the gutter and trim it from its neighbor without moving the pivot.
  let left=(frame%COLS)*256, width=256, pivot=128;
  if(f.index===0 && frame===8) width=280;
  if(f.index===0 && frame===9) {left+=24;width-=24;pivot-=24;}
  f.frameWidth=width/256;
  f.sprite.center.x=pivot/width;
  f.texture.repeat.set(width/1024-inset*2, 1/ROWS-inset*2);
  f.texture.offset.set(left/1024+inset, 1-(Math.floor(frame/COLS)+1)/ROWS+inset);
}

function poseAt(p, keys) {
  for(let i=keys.length-1;i>=0;i--) if(p>=keys[i][0]) return keys[i][1];
  return keys[0][1];
}

export function animateFighter(f, arena) {
  const t = arena.elapsed;
  const direction = f.index === 0 ? 1 : -1;
  const idle = Math.sin(t*3.8+f.index);
  let frame = 0, lunge = 0, lift = 0, lean = 0;
  let stretchX = 1, stretchY = 1;
  f.root.position.set(f.x,0,0);
  f.sprite.material.color.setHex(0xffffff);
  if(f.state === 'idle' || f.state === 'walk') {
    // Keep one grounded silhouette while breathing; alternate stance only
    // on steps so the head doesn't pop between unrelated idle poses.
    stretchY = 1 + idle*.008;
    if(f.state === 'walk') {lift=Math.abs(Math.sin(t*9))*.045;lean=Math.sin(t*9)*.012;}
  }
  if(f.state === 'block') {frame=f.elapsed>.24?11:10;stretchY=.985;}
  if(f.state === 'hit') {
    frame=f.elapsed<.19?12:13;
    lean=direction*Math.sin(clamp(f.elapsed/.4,0,1)*Math.PI)*.07;
    f.sprite.material.color.setHex(arena.phase==='fight'&&f.elapsed<.065?0xffc8a5:0xffffff);
  }
  if(f.state === 'attack') {
    const p=clamp(f.elapsed/f.move.duration,0,1);
    const thrust=Math.sin(clamp((p-.18)/.42,0,1)*Math.PI);
    switch(f.move.kind) {
      case 'punch': frame=poseAt(p,[[0,2],[.34,3],[.66,4],[.92,0]]);lunge=thrust*.4;break;
      case 'cross': frame=poseAt(p,[[0,5],[.34,6],[.72,4],[.94,0]]);lunge=thrust*.48;break;
      case 'kick': frame=poseAt(p,[[0,7],[.35,8],[.68,9],[.9,0]]);lunge=thrust*.34;break;
      case 'upper': frame=poseAt(p,[[0,11],[.3,5],[.43,6],[.72,4],[.94,0]]);lift=thrust*.23;lunge=thrust*.4;break;
      case 'power': frame=poseAt(p,[[0,5],[.4,6],[.76,4],[.96,0]]);lunge=thrust*.62;stretchX=1+thrust*.025;break;
    }
  }
  if(f.hp<=0) {
    frame=arena.phaseTime<.25?12:arena.phaseTime<.5?13:15;
    lunge=0;lift=0;lean=0;
  } else if(arena.phase==='roundEnd'||arena.phase==='matchEnd') {frame=14;lift=0;}
  setFrame(f,frame);
  f.sprite.position.set(direction*lunge,.035+lift,0);
  f.sprite.material.rotation=lean;
  f.sprite.scale.set(2.8*stretchX*f.frameWidth,4.2*stretchY,1);
  f.shadow.material.opacity=.85-lift*.7;
  f.ring.material.opacity=f.hp<25?.25+Math.sin(t*8)*.13:.14;
}
