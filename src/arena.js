import * as THREE from 'three';
import { makeFighter, animateFighter } from './fighters.js';

const clamp=THREE.MathUtils.clamp;
const rand=(a,b)=>a+Math.random()*(b-a);
const moves=[{name:'JAB',duration:.42,range:2.05,damage:7,kind:'punch'},{name:'CROSS',duration:.6,range:2.2,damage:10,kind:'cross'},{name:'ROUNDHOUSE',duration:.88,range:2.75,damage:15,kind:'kick'},{name:'UPPERCUT',duration:.73,range:1.9,damage:13,kind:'upper'},{name:'POWER STRIKE',duration:1.05,range:2.45,damage:19,kind:'power'}];
function mesh(geo,mat,parent,x=0,y=0,z=0){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m;}
function loadArtwork(url){return new Promise((resolve,reject)=>{const image=new Image();image.onload=resolve;image.onerror=()=>reject(new Error('The scene artwork could not load. Reload to try again.'));image.src=url;});}

export class Arena {
 constructor(container,onUpdate,onError){
 this.container=container;this.onUpdate=onUpdate;this.paused=false;this.speed=1;this.cameraMode='Broadcast';this.sound=false;this.particles=[];this.elapsed=0;this.shake=0;this.disposed=false;
 this.scene=new THREE.Scene();this.scene.background=null;
 this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.shadowMap.enabled=false;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.25;container.appendChild(this.renderer.domElement);
 this.camera=new THREE.PerspectiveCamera(37,1,.1,140);this.camera.position.set(0,4.5,12.7);
 this.fighters=[makeFighter(this.scene,0),makeFighter(this.scene,1)];
 this.resize=()=>{const w=container.clientWidth,h=container.clientHeight;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();};this.observer=new ResizeObserver(this.resize);this.observer.observe(container);this.resize();
 this.ready=false;this.round=1;this.wins=[0,0];this.hits=[0,0];this.attacks=[0,0];this.phase='loading';this.phaseTime=0;this.time=60;this.banner='ENTER THE ARENA';this.log='Loading fighter artwork…';this.publish();
 Promise.all([...this.fighters.map(f=>f.ready),loadArtwork('/scene/grassland.png'),loadArtwork('/scene/versus.png')]).then(()=>{if(!this.disposed){this.ready=true;this.reset();}}).catch(error=>{if(!this.disposed)onError?.(error.message);});
 this.last=performance.now();this.frame=this.frame.bind(this);this.raf=requestAnimationFrame(this.frame);
 }
 reset(){if(!this.ready)return;this.hitStop=0;this.paused=false;this.round=1;this.wins=[0,0];this.hits=[0,0];this.attacks=[0,0];this.phase='intro';this.phaseTime=0;this.time=60;this.banner='ROUND 1';this.log='The contenders enter the arena.';this.newRound();this.phase='faceoff';this.phaseTime=0;this.banner='';this.publish();}
 skipIntro(){if(this.phase==='faceoff'){this.newRound();this.publish();}}
 newRound(){for(const [i,f] of this.fighters.entries()){f.hp=100;f.x=i===0?-2.3:2.3;f.state='idle';f.elapsed=0;f.stun=0;f.move=null;f.cooldown=rand(.3,.8);f.combo=0;}this.time=60;this.phase='intro';this.phaseTime=0;this.banner=`ROUND ${this.round}`;}
 setSound(on){this.sound=on;if(on){this.audio??=new(window.AudioContext||window.webkitAudioContext)();this.audio.resume();}}
 tone(type){if(!this.sound||!this.audio)return;const ctx=this.audio,osc=ctx.createOscillator(),gain=ctx.createGain();osc.connect(gain);gain.connect(ctx.destination);osc.type=type==='block'?'triangle':'sawtooth';osc.frequency.setValueAtTime(type==='bell'?640:type==='block'?180:95,ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(type==='bell'?320:35,ctx.currentTime+.13);gain.gain.setValueAtTime(type==='bell'?.1:.15,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.21);osc.start();osc.stop(ctx.currentTime+.22);}
 publish(){this.onUpdate({hp:this.fighters.map(f=>Math.max(0,f.hp)),wins:[...this.wins],round:this.round,time:this.time,phase:this.phase,banner:this.banner,hits:[...this.hits],attacks:[...this.attacks],log:this.log,move:this.fighters.map(f=>f.state==='attack'?f.move.name:f.state==='block'?'GUARDING':f.state==='hit'?'STAGGERED':f.hp<25?'RAGE ACTIVE':'AI ACTIVE')});}
 burst(x,y,color){
  for(let i=0;i<22;i++){
   const p=mesh(new THREE.BoxGeometry(.018,rand(.12,.3),.012),new THREE.MeshBasicMaterial({color,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}),this.scene,x,y,.5);
   const angle=rand(0,Math.PI*2);p.rotation.z=angle;
   const life=rand(.18,.4);this.particles.push({mesh:p,vel:new THREE.Vector3(Math.sin(angle)*rand(2,5),Math.cos(angle)*rand(2,5),rand(-.2,.8)),life,maxLife:life});
  }
  const flash=mesh(new THREE.RingGeometry(.12,.18,32),new THREE.MeshBasicMaterial({color:0xffefc1,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}),this.scene,x,y,.55);
  this.particles.push({mesh:flash,vel:new THREE.Vector3(),life:.14,maxLife:.14,flash:true});
 }
 decide(f,other,dt){
 f.cooldown-=dt;f.elapsed+=dt;
 if(f.state==='hit'){f.stun-=dt;if(f.stun<=0){f.state='idle';f.elapsed=0;}return;}
 if(f.state==='attack'){
 const m=f.move,t=f.elapsed/m.duration;
 if(t>=.48&&!f.resolved){f.resolved=true;const distance=Math.abs(f.x-other.x);if(distance<m.range){const blocked=other.state==='block';let damage=blocked?m.damage*.12:m.damage;if(f.hp<25)damage*=1.2;other.hp=Math.max(0,other.hp-damage);this.burst((f.x+other.x)/2,m.kind==='kick'?1.9:2.6,blocked?0xa9d9f2:f.index===0?0x90ffca:0xffc678);this.tone(blocked?'block':'hit');this.shake=blocked?.035:.11;this.hitStop=blocked?.025:m.kind==='power'?.11:.065;if(!blocked){this.hits[f.index]++;f.combo++;other.combo=0;other.state='hit';other.stun=m.kind==='power'?.65:.34;other.elapsed=0;other.x=clamp(other.x+(other.index===0?-.22:.22),-5.5,5.5);this.log=`${f.index===0?'Tinubu':'Obi'} lands ${m.name.toLowerCase()}${f.combo>1?` — ${f.combo} clean hits in a row!`:'.'}`;}else this.log=`${other.index===0?'Tinubu':'Obi'} reads the attack. Guard holds.`;}else{this.log=`${f.index===0?'Tinubu':'Obi'} swings. Just out of range.`;f.combo=0;}}
 if(t>=1){f.state='idle';f.elapsed=0;f.cooldown=rand(.15,.52);}return;
 }
 if(f.state==='block'){if(f.elapsed>.55){f.state='idle';f.elapsed=0;f.cooldown=.08;}return;}
 const distance=Math.abs(f.x-other.x);
 if(other.state==='attack'&&other.elapsed<.2&&f.cooldown<=0&&distance<2.8&&Math.random()<dt*4){f.state='block';f.elapsed=0;return;}
 if(distance>1.8){f.x+=(f.index===0?1:-1)*dt*(distance>3?1.65:.85);f.state='walk';}
 else {f.state='idle';if(distance<1.4)f.x+=(f.index===0?-1:1)*dt*.8;}
 if(f.cooldown<=0&&distance<2.8){
 if(Math.random()<.18){f.state='block';f.elapsed=0;return;}
 const available=moves.filter(m=>m.range>distance-.25);if(!available.length){f.cooldown=.1;return;}
 f.move=available[Math.floor(Math.random()*available.length)];f.state='attack';f.elapsed=0;f.resolved=false;this.attacks[f.index]++;
 }
 }
 pose(f){ animateFighter(f,this); }
 frame(now){
 if(this.disposed)return;this.raf=requestAnimationFrame(this.frame);const dt=Math.min((now-this.last)/1000,.05)*(this.phase==='fight'?this.speed:1);this.last=now;
 const frozen=this.hitStop>0;if(frozen&&!this.paused)this.hitStop=Math.max(0,this.hitStop-dt);
 if(!this.paused&&!frozen){this.elapsed+=dt;this.phaseTime+=dt;
 if(this.phase==='faceoff'){if(this.phaseTime>3.8)this.newRound();}
 else if(this.phase==='intro'){this.banner=this.phaseTime<1.05?`ROUND ${this.round}`:'FIGHT';if(this.phaseTime>1.9){this.phase='fight';this.phaseTime=0;this.banner='';this.log='The bell rings. Both AIs are looking for an opening.';this.tone('bell');}}
 else if(this.phase==='fight'){
 this.time=Math.max(0,this.time-dt);
 // Alternate evaluation order so neither side receives a persistent first-move advantage.
 const order=Math.floor(this.elapsed*60)%2?[0,1]:[1,0];for(const i of order){if(this.fighters.every(f=>f.hp>0))this.decide(this.fighters[i],this.fighters[1-i],dt);}
 if(this.time<=0||this.fighters.some(f=>f.hp<=0)){
 const [a,b]=this.fighters,winner=a.hp===b.hp?-1:a.hp>b.hp?0:1;if(winner>=0)this.wins[winner]++;this.phase='roundEnd';this.phaseTime=0;this.banner=winner<0?'DRAW':this.time<=0?'TIME UP':'K.O.';this.log=winner<0?'Evenly matched. The round will be replayed.':`${winner===0?'Tinubu':'Peter Obi'} takes round ${this.round}.`;this.roundWinner=winner;this.tone('bell');}
 }
 else if(this.phase==='roundEnd'&&this.phaseTime>3.5){if(this.wins.some(w=>w>=2)){this.phase='matchEnd';this.banner=this.wins[0]>=2?'TINUBU WINS':'OBI WINS';this.log='That’s the match. Run it back for a new showdown.';}else{if(this.roundWinner>=0)this.round++;this.newRound();}}
 for(const f of this.fighters)this.pose(f);
 for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];p.life-=dt;p.vel.y-=dt*6;p.mesh.position.addScaledVector(p.vel,dt);p.mesh.scale.multiplyScalar(p.flash?Math.pow(1.16,dt*60):Math.pow(.97,dt*60));p.mesh.material.opacity=p.life/p.maxLife;if(p.life<=0){this.scene.remove(p.mesh);p.mesh.geometry.dispose();p.mesh.material.dispose();this.particles.splice(i,1);}}
 this.shake*=Math.exp(-dt*18);
 }
 const mid=(this.fighters[0].x+this.fighters[1].x)/2;
 const portrait=this.camera.aspect<1.15,spread=Math.abs(this.fighters[0].x-this.fighters[1].x),distance=Math.max(11.6,(spread+3.4)/(.64*this.camera.aspect));
 let target=new THREE.Vector3(mid+Math.sin(this.elapsed*.17)*.2,3.1,distance);
 if(this.cameraMode==='Ringside')target.set(mid+.3,2.6,Math.max(distance-.5,11.1));
 if(this.cameraMode==='Wide')target.set(mid,4.1,distance+3);
 if(!this.paused){this.camera.position.lerp(target,.035);this.camera.position.x+=(Math.random()-.5)*this.shake;this.camera.position.y+=(Math.random()-.5)*this.shake;}
 this.camera.lookAt(mid,1.85,0);this.renderer.render(this.scene,this.camera);
 if(now-(this.lastPublish||0)>90){this.publish();this.lastPublish=now;}
 }
 dispose(){this.disposed=true;cancelAnimationFrame(this.raf);this.observer.disconnect();this.scene.traverse(obj=>{obj.geometry?.dispose();if(obj.material){for(const mat of Array.isArray(obj.material)?obj.material:[obj.material]){mat.map?.dispose();mat.dispose();}}});this.renderer.dispose();this.renderer.domElement.remove();this.audio?.close();}
}
