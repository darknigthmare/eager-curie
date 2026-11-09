#!/usr/bin/env node
'use strict';
// Real input/tracker/game-key methods with explicit DOM and action sinks.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'src/game.js'),'utf8');
function fragment(name,endMarker){const start=source.indexOf('  class '+name+' {'),end=source.indexOf(endMarker,start);assert(start>=0&&end>start);return source.slice(start,end);}
function fixture(stageIndex=4){
  const forwarded=[],tracker=[],p={isCeilingProwling:false,isLocomotionBusy:()=>false},context={window:{},console,
    playerCreature:p,showToast(){},visionSystem:{setMode(){},toggleThermal(){}},stationMap:{},pheromoneSystem:{dropManualScent(){}}};
  const Input=vm.runInNewContext(fragment('InputManager','  const inputManager =')+'\nInputManager;',context);
  const input=Object.create(Input.prototype);input.keys={};context.inputManager=input;
  const Game=vm.runInNewContext(fragment('GameMaster',"  window.addEventListener('DOMContentLoaded'")+'\nGameMaster;',context);
  const g=Object.create(Game.prototype);Object.assign(g,{isSystemPaused:false,currentStageIndex:stageIndex,
    currentStage:{handleKeyDown:key=>forwarded.push(key)},motionTracker:{toggleFocusedMode:()=>tracker.push('mode')}});
  context.window.gameInstance=g;
  const Motion=vm.runInNewContext(fragment('MotionTrackerDisplay','  // -------------------------------------------------------------\n  // 2.')+'\nMotionTrackerDisplay;',context);
  return {g,p,input,forwarded,tracker,Motion,context};
}
let passed=0;
function check(name,run){run();passed++;console.log('PASS '+name);}
check('T reaches the adult tail action rather than silently switching the tracker',()=>{
  const f=fixture();f.g.handleKeyDown('t');assert.deepEqual(f.forwarded,['t']);assert.equal(f.tracker.length,0);
});
check('Shift+T explicitly switches tracker while T remains available to gameplay',()=>{
  const f=fixture();f.input.keys.shift=true;f.g.handleKeyDown('t');assert.equal(f.tracker.length,1);assert.equal(f.forwarded.length,0);
  const early=fixture(1);early.g.handleKeyDown('t');assert.equal(early.tracker.length,1);
});
check('Input modifier aliases read the same actual stored physical keys',()=>{
  const f=fixture();f.input.keys.shiftleft=true;assert.equal(f.input.isKeyDown('ShiftLeft'),true);
  assert.equal(f.input.isKeyDown('ShiftRight'),false);assert.equal(f.input.isKeyDown(null),false);
});
check('A busy climb or capture rejects physical actions but retains Q cancellation',()=>{
  const f=fixture();f.p.isLocomotionBusy=()=>true;
  for(const key of ['r','k','j','e','t',' '])f.g.handleKeyDown(key);
  assert.equal(f.forwarded.length,0);f.g.handleKeyDown('q');assert.deepEqual(f.forwarded,['q']);
});
check('Hanging retains only tested physical routes instead of ground teleports',()=>{
  const f=fixture();f.p.isCeilingProwling=true;
  for(const key of ['r','k','j','1','3','x','c','z'])f.g.handleKeyDown(key);
  assert.equal(f.forwarded.length,0);
  for(const key of ['e','t',' ','q'])f.g.handleKeyDown(key);
  assert.deepEqual(f.forwarded,['e','t',' ','q']);
  assert.equal(f.g.getLocomotionState().hanging,true);
});
check('Tracker labels reflect the real shortcut without repeated DOM writes',()=>{
  const f=fixture(),m=Object.create(f.Motion.prototype),attributes={},writes=[];
  m.modeBtn={textContent:'',title:'',getAttribute:key=>attributes[key],setAttribute(key,value){attributes[key]=value;writes.push(key);}};
  m.focusedMode=false;m.updateModeLabel();assert.match(m.modeBtn.textContent,/MAJ\+T/);assert.equal(attributes['aria-keyshortcuts'],'Shift+T');
  m.updateModeLabel();assert.equal(writes.length,1);
  f.g.currentStageIndex=1;m.updateModeLabel();assert.equal(m.modeBtn.textContent,'[T] 360°');
});
check('Actor cleanup releases loading, dragging and resin anchors before destroying meshes',()=>{
  const f=fixture(),trace=[],transfer={id:'owned-loading'};
  f.context.stationMap.incineratorTransfers=new Set([transfer]);
  f.context.stationMap.cancelIncineratorTransfer=value=>{
    assert.equal(value,transfer);trace.push('loading');f.context.stationMap.incineratorTransfers.delete(value);
  };
  f.p.cancelCeilingAction=options=>{assert.equal(options.restorePose,true);trace.push('ceiling');};
  f.p.cancelDragHost=()=>trace.push('dragging');
  f.g.humans=[{ceilingAnchor:{dispose:()=>trace.push('anchor')},destroy:()=>trace.push('mesh')}];
  f.g.clearHumans();assert.deepEqual(trace,['ceiling','loading','dragging','anchor','mesh']);
  assert.equal(f.g.humans.length,0);assert.equal(f.context.stationMap.incineratorTransfers.size,0);
  f.g.clearHumans();assert.deepEqual(trace,['ceiling','loading','dragging','anchor','mesh','ceiling','dragging']);
});
check('Industrial prompt advertises the real environment key and rejects an occluded panel',()=>{
  const f=fixture(),MapClass=vm.runInNewContext(fragment('StationMap','  const stationMap = new StationMap();')+'\nStationMap;',f.context);
  const map=new MapClass();f.context.stationMap=map;f.g.currentStage.interactWithNearbyProps=()=>{};
  f.p.x=0;f.p.z=0;map.promptEl={style:{}};map.wave31Props=[{id:'nearby',name:'Panneau',x:3,z:0,minStage:4}];
  const update=()=>{map.interactPromptTimer=0;map.updateInteractionPrompt(.2);};
  update();assert.match(map.promptEl.textContent,/^\[ESPACE\] Panneau/);assert.equal(map.promptEl.style.display,'block');
  map.colliders.push({minX:1,maxX:2,minZ:-1,maxZ:1});update();assert.equal(map.promptEl.style.display,'none');
});
check('Industrial prompts disappear outside the actual ground interaction context',()=>{
  const f=fixture(),MapClass=vm.runInNewContext(fragment('StationMap','  const stationMap = new StationMap();')+'\nStationMap;',f.context);
  const map=new MapClass();f.g.currentStage.interactWithNearbyProps=()=>{};map.promptEl={style:{display:'block'}};
  const update=()=>{map.interactPromptTimer=0;map.promptEl.style.display='block';map.updateInteractionPrompt(.2);assert.equal(map.promptEl.style.display,'none');};
  for(const stage of [1,2,3,5]){f.g.currentStageIndex=stage;update();}f.g.currentStageIndex=4;
  for(const field of ['isCeilingProwling','isInVent','isEmerging','isBiologicalTransition','isWallMimic']){f.p[field]=true;update();f.p[field]=false;}
  f.p.isLocomotionBusy=()=>true;update();
});
console.log(`${passed} controls coherence groups passed`);
console.log('SOURCE '+crypto.createHash('sha256').update(source).digest('hex'));
