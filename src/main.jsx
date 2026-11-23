import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pause, Play, RotateCcw, Volume2, VolumeX, Maximize, X } from 'lucide-react';
import { Arena } from './arena.js';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow-condensed/500.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/barlow-condensed/800.css';
import './style.css';

const initialFight = { hp:[100,100],wins:[0,0],round:1,time:60,phase:'loading',banner:'',move:['READY','READY'] };
function App(){
  const mount=useRef(null),engine=useRef(null),resumeButton=useRef(null),pauseButton=useRef(null);
  const [fight,setFight]=useState(initialFight),[paused,setPaused]=useState(false),[sound,setSound]=useState(false),[slow,setSlow]=useState(false),[error,setError]=useState('');
  useEffect(()=>{
    try{engine.current=new Arena(mount.current,setFight,setError);}
    catch{setError('The arena could not start. Enable hardware acceleration and reload.');}
    return()=>engine.current?.dispose();
  },[]);
  function togglePause(){if(!engine.current?.ready)return;setPaused(p=>{engine.current.paused=!p;return !p;});}
  function rematch(){engine.current?.reset();setPaused(false);}
  function toggleSound(){setSound(s=>{engine.current?.setSound(!s);return !s;});}
  function toggleSlow(){setSlow(s=>{if(engine.current)engine.current.speed=s?1:.45;return !s;});}
  function fullscreen(){if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.().catch(()=>{});}
  useEffect(()=>{
    const key=e=>{
      if(e.code==='Escape'||(e.code==='Space'&&!['BUTTON','SELECT','INPUT'].includes(document.activeElement.tagName))){e.preventDefault();togglePause();}
      if(e.code==='Tab'&&engine.current?.paused){
        const buttons=[...document.querySelectorAll('.pause-screen button:not(:disabled)')];
        if(e.shiftKey&&document.activeElement===buttons[0]){e.preventDefault();buttons.at(-1)?.focus();}
        else if(!e.shiftKey&&document.activeElement===buttons.at(-1)){e.preventDefault();buttons[0]?.focus();}
      }
    };window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  },[]);
  useEffect(()=>{if(paused)resumeButton.current?.focus();else if(document.activeElement===document.body)pauseButton.current?.focus({preventScroll:true});},[paused]);
  const opening=fight.phase==='faceoff',loading=fight.phase==='loading',finished=fight.phase==='matchEnd';
  return <main className="game" aria-label="Tinubu versus Peter Obi, AI fighting exhibition">
    <div className="field-backdrop"/>
    <div ref={mount} className="canvas-host"/>
    <div className="game-shade"/>
    {!opening&&!loading&&<div className="scoreboard" aria-hidden={paused||undefined}>
      <FighterHUD side="left" name="TINUBU" hp={fight.hp[0]} wins={fight.wins[0]}/>
      <div className="timer"><span>ROUND {fight.round}</span><strong>{Math.ceil(fight.time).toString().padStart(2,'0')}</strong></div>
      <FighterHUD side="right" name="PETER OBI" hp={fight.hp[1]} wins={fight.wins[1]}/>
    </div>}
    {loading&&!error&&<div className="loading-screen" role="status"><div className="loader"/><p>SETTING THE STAGE</p></div>}
    {opening&&<div className={'faceoff '+(paused?'animation-paused':'')} aria-label="Tinubu versus Peter Obi">
      <img className="faceoff-art" src="/scene/versus.png" alt="Tinubu and Peter Obi face each other before the fight"/>
      <div className="faceoff-shade"/>
      <div className="versus-mark" aria-hidden="true">VS</div>
      <div className="contender contender-left"><span>THE JAGABAN</span><h1>TINUBU</h1></div>
      <div className="contender contender-right"><span>THE CHALLENGER</span><h1>PETER OBI</h1></div>
      <div className="stage-title">OPEN FIELD<span>EXHIBITION MATCH</span></div>
      <button className="skip-intro" onClick={()=>engine.current?.skipIntro()} tabIndex={paused?-1:0}>Skip intro <Play size={13}/></button>
      <div className="intro-progress"/>
    </div>}
    {!opening&&!loading&&!paused&&fight.banner&&<div className={'round-call '+(finished?'match-result':'')} key={fight.banner}>
      {finished&&<span>MATCH COMPLETE</span>}
      <strong>{fight.banner}</strong>
      {finished&&<button className="action-button" onClick={rematch}><RotateCcw size={18}/> Run it back</button>}
    </div>}
    {!loading&&!paused&&!opening&&<div className="quick-controls">
      {slow&&<span className="speed-indicator">½×</span>}
      <button onClick={toggleSound} aria-label={sound?'Mute sound':'Enable sound'} title={sound?'Mute':'Sound'}>{sound?<Volume2 size={19}/>:<VolumeX size={19}/>}</button>
      <button ref={pauseButton} onClick={togglePause} aria-label="Pause fight" title="Pause · Space / Esc"><Pause size={20}/></button>
    </div>}
    {paused&&<div className="pause-screen" role="dialog" aria-modal="true" aria-labelledby="pause-title">
      <button className="close-pause" onClick={togglePause} aria-label="Close pause menu"><X size={22}/></button>
      <div className="pause-content"><span className="pause-location">OPEN FIELD</span><h2 id="pause-title">PAUSED</h2>
        <button ref={resumeButton} className="action-button" onClick={togglePause}><Play size={19}/> Resume fight</button>
        <button className="restart-button" onClick={rematch}><RotateCcw size={17}/> Restart match</button>
        <div className="pause-settings">
          <button onClick={toggleSound} aria-pressed={sound}>{sound?<Volume2 size={20}/>:<VolumeX size={20}/>}<span>Sound {sound?'on':'off'}</span></button>
          <button onClick={toggleSlow} aria-pressed={slow}><b>½×</b><span>{slow?'Slow motion':'Normal speed'}</span></button>
          <button onClick={fullscreen}><Maximize size={20}/><span>Fullscreen</span></button>
        </div>
        <p className="pause-note">Fictional exhibition · AI vs AI</p>
      </div>
    </div>}
    {error&&<div className="error-screen" role="alert"><h2>THE ARENA NEEDS A RESTART</h2><p>{error}</p><button className="action-button" onClick={()=>location.reload()}>Reload game</button></div>}
  </main>;
}
function FighterHUD({side,name,hp,wins}){
 return <div className={'fighter-hud '+side}>
  <div className="fighter-heading"><div className="avatar"><img src={`/fighters/${side==='left'?'tinubu':'obi'}-atlas.png`} alt=""/></div><h2>{name}</h2></div>
  <div className="health-track" role="progressbar" aria-label={`${name} health`} aria-valuenow={Math.round(hp)} aria-valuemin={0} aria-valuemax={100}><div className="health-fill" style={{transform:`scaleX(${hp/100})`}}/></div>
  <div className="round-pips" aria-label={`${wins} rounds won`}>{[0,1].map(i=><i key={i} className={wins>i?'won':''}/>)}</div>
 </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
