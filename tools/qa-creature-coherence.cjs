#!/usr/bin/env node
'use strict';
// Real production classes, model factory, animation rig and vendored Three.
// The small wall/beam scene, actor positions, input and presentation sinks are
// explicit fixtures. This does not claim native rendering or cinema fidelity.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'src/game.js'),'utf8');
global.THREE=require(path.join(root,'assets/vendor/three.r128.min.js'));
for(const file of ['organic-sculpt.js','surface-detail.js','model-detail.js','models.js'])require(path.join(root,'src',file));
const T=global.THREE,factory=global.HiveModelFactory;
function section(startText,endText){const start=source.indexOf(startText),end=source.indexOf(endText,start);assert(start>=0&&end>start,`Missing production section ${startText}`);return source.slice(start,end);}
const profiles=section('  const ADULT_CASTE_PROFILES','  class PlayerCreature');
const playerClass=section('  class PlayerCreature','  const playerCreature = new PlayerCreature();');
const mapClass=section('  class StationMap','  const stationMap = new StationMap();');
const animations=section('  function getAnimationModel','  function setHudBar');
const results=[];
function check(name,run){try{const detail=run();results.push({name,passed:true,detail});console.log('PASS '+name);}catch(error){results.push({name,passed:false,error:error.stack||String(error)});console.error('FAIL '+name+': '+error.message);}}
const noFX=new Proxy({effects:[]},{get:(object,key)=>key in object?object[key]:(()=>{})});
function fixture({caste='drone',support=true,height=8.4}={}){
 const input={dx:0,dy:0},messages=[],scene=new T.Scene(),game={campaignActive:true,isRunning:true,isSystemPaused:false,currentStage:{},currentStageIndex:4,humans:[]};
 const renderer={scene,removeObject(model){model.parent?.remove(model);factory.disposeModel(model);},addScreenShake(){}};
 const context={THREE:T,console,Math,Date,performance,Set,Map,Number,Object,Array,
   window:{THREE:T,gameInstance:game,HiveModelFactory:factory,HiveSystems:{vfx:noFX,unlockCodex(){}}},
   inputManager:{getMovementVector:()=>input},rendererEngine:renderer,audioManager:new Proxy({},{get:()=>()=>{}}),
   showToast(message){messages.push(message);},appendSensorLog(){},setHudBar(){},resinGrid:null};
 vm.createContext(context);
 const layoutFile=path.join(root,'src/industrial-layout.js');
 if(fs.existsSync(layoutFile))vm.runInContext(fs.readFileSync(layoutFile,'utf8'),context,{filename:'src/industrial-layout.js'});
 vm.runInContext(mapClass+';this.MapClass=StationMap;',context);
 const map=new context.MapClass();context.stationMap=map;
 vm.runInContext(profiles+animations+playerClass+';this.Creature=PlayerCreature;',context);
 const player=new context.Creature();context.playerCreature=player;
 const wall=new T.Mesh(new T.BoxGeometry(24,10,2),new T.MeshBasicMaterial());wall.position.set(0,5,0);scene.add(wall);
 map.walls=[wall];map.colliders=[{mesh:wall,minX:-12.6,maxX:12.6,minZ:-1.6,maxZ:1.6}];map.ceilingSupports=[];
 let beam=null;
 if(support){beam=new T.Mesh(new T.BoxGeometry(.45,.5,48),new T.MeshBasicMaterial());beam.position.set(0,height,0);scene.add(beam);map.ceilingSupports.push({id:'authored-fixture-beam',mesh:beam,alongX:false});}
 player.adultCaste=caste;player.setForm('drone');player.x=0;player.z=14;player.mesh.position.set(0,0,14);player.applyGroundContact();
 return {player,map,game,input,messages,scene,wall,beam,context,dispose(){player.clearMesh();for(const model of [wall,beam]){model?.geometry.dispose();model?.material.dispose();model?.parent?.remove(model);}}};
}
function bounds(player){player.mesh.updateMatrixWorld(true);return new T.Box3().setFromObject(player.detailedModel);}
function tick(f,count=1,step=1/60,samples=null){for(let i=0;i<count;i++){f.player.update(step);if(samples){const b=bounds(f.player);samples.push({phase:f.player.ceilingTransition?.phase|| (f.player.isCeilingProwling?'HANG':'GROUND'),y:f.player.mesh.position.y,minY:b.min.y,maxY:b.max.y,roll:f.player.mesh.rotation.z});}}}
function reachCeiling(f){assert.equal(f.player.toggleCeilingProwl(),true,'Prepared authored junction should be usable');const samples=[];for(let i=0;i<600&&!f.player.isCeilingProwling;i++)tick(f,1,1/60,samples);assert(f.player.isCeilingProwling,'Ascent did not reach an actual support');return samples;}
function victimFixture(f,{hp=300,offset=2.5}={}){
 const detail=factory.createHuman('scientist'),mesh=new T.Group();mesh.add(detail);f.scene.add(mesh);factory.placeOnGround(detail,.015);
 const victim={name:'Prepared real-model actor',x:f.player.x,z:f.player.z+offset,hp,maxHp:hp,mesh,isRestrained:false,isCocooned:false,isIncapacitated:false,hostEligibility:'viable',hits:[],
   takeDamage(amount){this.hits.push(amount);this.hp=Math.max(0,this.hp-amount);if(this.hp<=0)this.isIncapacitated=true;},
   dispose(){factory.disposeModel(mesh);mesh.parent?.remove(mesh);}};
 mesh.position.set(victim.x,0,victim.z);f.game.humans=[victim];return victim;
}

check('Egg is torso-high beside the normalized human rig, four lobes stay articulated',()=>{
 const egg=factory.createEgg(false),b=new T.Box3().setFromObject(egg),petals=egg.userData.petalJoints;
 assert.equal(petals.length,4);assert(b.max.y>=2.4&&b.max.y<=2.9);assert(b.min.y>=-.02);assert(b.max.y/4.25<.7);
 const before=petals.map(joint=>joint.rotation.x);egg.userData.setOpenProgress(.5);assert(petals.every((joint,i)=>joint.rotation.x!==before[i]));
 const detail={height:b.max.y-b.min.y,humanTarget:4.25,ratio:b.max.y/4.25,lobes:petals.length};factory.disposeModel(egg);return detail;
});
check('Facehugger standard and royal retain one root and fold the visible model at face scale',()=>{
 const rows=[];
 for(const royal of [false,true]){const f=fixture(),p=f.player;p.facehuggerVariant=royal?'royal':'standard';p.setForm('facehugger');
   const detail=p.detailedModel,base=detail.scale.clone(),anchor=new T.Group();anchor.position.set(0,3.9,.4);f.scene.add(anchor);
   const host={x:0,z:0,faceAnchor:anchor};assert(p.attachToFace(host));tick(f,10);
   assert.equal(p.detailedModel,detail);assert(detail.userData.foldedPose);assert.equal(p.mesh.parent,anchor);
   assert(Math.abs(detail.scale.x/base.x-1)<.02);assert(Math.abs(p.mesh.rotation.y-Math.PI)<.02);
   const b=bounds(p),width=b.max.x-b.min.x;assert(width<1.9,'Parasite spans beyond the human shoulders');
   rows.push({royal,width,baseScale:base.x,folded:true});p.detachFromHost({hide:true});f.dispose();
 }
 assert(Math.abs(rows[1].baseScale/rows[0].baseScale-1.28)<1e-6);return rows;
});
check('Attached fingers return behind the palm and a cached tail follows the actual neck binding',()=>{
 const rows=[];
 for(const royal of [false,true]){
  const f=fixture(),p=f.player;p.facehuggerVariant=royal?'royal':'standard';p.setForm('facehugger');
  const hostMesh=new T.Group(),neck=new T.Group(),head=new T.Group(),anchor=new T.Group();f.scene.add(hostMesh);
  hostMesh.userData.animationRig={kind:'fixture-bindings'};hostMesh.userData.height=4.25;
  neck.position.set(0,3.4,0);head.position.set(0,3.8,0);anchor.position.set(0,3.95,.43);hostMesh.add(neck,head,anchor);
  // The neck/head transforms are an explicit anatomical binding fixture.
  // The actual Player and cached surface/geometry methods are not replaced.
  f.context.window.HiveAssetLibrary={getRuntime:()=>({bindings:{neck,head}})};
  const host={x:0,z:0,mesh:hostMesh,faceAnchor:anchor};assert(p.attachToFace(host));tick(f,10);
  const model=p.detailedModel,grip=model.getObjectByName('cervical_grip_tail'),free=model.getObjectByName('crawler_tail_root');
  assert(grip?.visible&&!free.visible);assert(model.userData.attachmentGrip.active);
  for(let index=0;index<8;index++){
   const hip=model.getObjectByName('crawler_leg_'+index).getWorldPosition(new T.Vector3());
   const claw=new T.Box3().setFromObject(model.getObjectByName('crawler_ankle_'+index).getObjectByName('gripping_claw')).getCenter(new T.Vector3());
   anchor.worldToLocal(hip);anchor.worldToLocal(claw);assert(claw.z<hip.z-.2,'A gripping fingertip still points out in front of the palm');
  }
  const data=model.userData.attachmentGrip,center=model.localToWorld(new T.Vector3().fromArray(data.neckCenter));
  const points=data.ringPoints.map(point=>model.localToWorld(new T.Vector3().fromArray(point))),radius=4.25*.052;
  for(const point of points){assert(Math.abs(Math.hypot(point.x-center.x,point.z-center.z)-radius)<.008);assert(Math.abs(point.y-center.y)<.025);}
  assert(points.some(point=>point.z<center.z-radius*.85)&&points.some(point=>point.x>center.x+radius*.85)&&points.some(point=>point.x<center.x-radius*.85));
  const geometry=grip.geometry,updates=data.updates;tick(f,180);assert.equal(grip.geometry,geometry);assert(model.userData.attachmentGrip.updates<=updates+25);
  neck.position.z+=.12;tick(f,20);assert.equal(grip.geometry,geometry);assert(model.userData.attachmentGrip.updates>updates);
  let disposals=0;geometry.addEventListener('dispose',()=>disposals++);
  p.detachFromHost();assert(free.visible&&!grip.visible&&!model.userData.attachmentGrip.active);f.dispose();assert.equal(disposals,1);p.clearMesh();assert.equal(disposals,1);
  rows.push({royal,ringRadiusWorld:radius,geometryReused:true,allEightTipsBehindPalm:true,neckBindingFixture:true});
 }
 const husk=factory.createDeadFacehuggerHusk();assert(husk.getObjectByName('crawler_tail_root').visible);assert(!husk.getObjectByName('cervical_grip_tail'));factory.disposeModel(husk);return rows;
});
check('Grounded rest and motion frames never sink below the deck',()=>{
 const f=fixture(),samples=[];f.player.x=25;f.player.z=20;f.player.mesh.position.set(25,0,20);
 for(let i=0;i<90;i++){f.input.dx=i<45?1:0;tick(f,1,1/60,samples);}
 assert(samples.every(sample=>sample.minY>=-.035));const minY=Math.min(...samples.map(s=>s.minY));f.dispose();return {frames:samples.length,minY};
});
check('Movement collision uses measured body width rather than only the actor center',()=>{
 const f=fixture(),p=f.player;p.x=0;p.z=-5;p.mesh.position.set(0,0,-5);f.input.dy=1;tick(f,60);
 assert(p.z<=-1.6-p.creatureEnvelope.radius+.01);assert(p.z>-5);const detail={z:p.z,radius:p.creatureEnvelope.radius};f.dispose();return detail;
});
check('Future adult clearance matches the live factory without changing actor health form or mesh',()=>{
 const f=fixture(),p=f.player,mesh=p.mesh,form=p.form,health=p.health,materials=factory._managedMaterials.size;
 const clearance=p.getAdultClearance('warrior');assert(clearance&&clearance.radius>p.creatureEnvelope.radius);assert(clearance.height>6);
 assert.equal(p.mesh,mesh);assert.equal(p.form,form);assert.equal(p.health,health);assert.equal(factory._managedMaterials.size,materials);
 clearance.bounds.min.y=-500;const cached=p.getAdultClearance('warrior');assert(cached.bounds.min.y>=-.001);assert.equal(factory._managedMaterials.size,materials);assert.equal(p.getAdultClearance('nonexistent'),null);f.dispose();
});
check('Juvenile clearance and grounding use the smaller birth rig without resizing the cocoon or adult',()=>{
 const f=fixture(),p=f.player,oldMesh=p.mesh,oldHealth=p.health,oldForm=p.form,materials=factory._managedMaterials.size;
 const clearance=p.getJuvenileClearance();assert(clearance);assert.equal(p.mesh,oldMesh);assert.equal(p.health,oldHealth);assert.equal(p.form,oldForm);assert.equal(factory._managedMaterials.size,materials);
 clearance.bounds.min.y=-99;assert(p.getJuvenileClearance().bounds.min.y>=-.001);assert.equal(factory._managedMaterials.size,materials);
 p.setForm('chestburster');const actual=bounds(p),size=actual.getSize(new T.Vector3()),live=p.creatureEnvelope;
 assert(size.x>1.1&&size.x<1.2&&size.y>.6&&size.y<.7&&size.z>3.1&&size.z<3.3);assert(live.radius<.6);assert(actual.min.y>=-.001);
 assert(Math.abs(live.radius-clearance.radius)<1e-8&&Math.abs(live.height-clearance.height)<1e-8);assert.equal(p.detailedModel.scale.x,.5);
 p.setChrysalis(true);assert.equal(p.detailedModel.scale.x,1.55);assert(p.creatureEnvelope.height>5);p.isChrysalis=false;p.setForm('drone');assert.equal(p.detailedModel.scale.x,1.14);
 const detail={dimensions:size.toArray(),radius:live.radius,humanRigHeight:4.25,totalLengthToHumanHeight:size.z/4.25,probeDidNotMutateActor:true,cocoonScale:1.55,adultScale:1.14};f.dispose();return detail;
});
check('No wall-beam support means no instant altitude or inversion',()=>{
 const f=fixture({support:false}),before=f.player.mesh.position.clone();assert.equal(f.player.toggleCeilingProwl(),false);assert(f.player.mesh.position.equals(before));assert.equal(f.player.mesh.rotation.z,0);assert(!f.player.ceilingTransition);f.dispose();
});
check('Q cancels an intake transfer without starting an ascent and respects pause',()=>{
 const f=fixture(),p=f.player,transfer={fixture:'Prepared intake pointer; cancellation sink is observed here, full machine is covered by transport QA'},before=p.mesh.position.clone();let calls=0;
 p.disposalTransfer=transfer;f.map.cancelIncineratorTransfer=actual=>{assert.equal(actual,transfer);calls++;p.disposalTransfer=null;};
 f.game.isSystemPaused=true;assert.equal(p.toggleCeilingProwl(),false);assert.equal(calls,0);assert.equal(p.disposalTransfer,transfer);
 f.game.isSystemPaused=false;assert.equal(p.toggleCeilingProwl(),false);assert.equal(calls,1);assert.equal(p.disposalTransfer,null);assert(!p.ceilingTransition);assert(p.mesh.position.equals(before));f.dispose();
});
check('Ascent follows an authored junction over simulation time and reaches underside contact',()=>{
 const f=fixture(),p=f.player,before=p.mesh.position.clone();assert(p.toggleCeilingProwl());assert(p.mesh.position.equals(before));assert(!p.isCeilingProwling);
 const samples=[];for(let i=0;i<600&&!p.isCeilingProwling;i++)tick(f,1,1/60,samples);
 assert(p.isCeilingProwling);assert(samples.length>90);assert(samples.some(s=>s.phase==='CLIMB')&&samples.some(s=>s.phase==='ROLL'));
 assert(samples.every(s=>s.minY>=-.035),'Animated ascent crossed deck');assert(samples.every(s=>s.maxY<=8.16),'Animated ascent crossed support ceiling');
 const b=bounds(p);assert(Math.abs(b.max.y-8.08)<.15);const detail={frames:samples.length,minY:Math.min(...samples.map(s=>s.minY)),maxY:Math.max(...samples.map(s=>s.maxY)),end:b.max.y};f.dispose();return detail;
});
check('Pause and invalid deltas freeze climb state exactly',()=>{
 const f=fixture();f.player.toggleCeilingProwl();tick(f,20);const state=f.player.ceilingTransition;
 const snapshot=()=>JSON.stringify({position:f.player.mesh.position.toArray(),rotation:f.player.mesh.rotation.toArray(),elapsed:state.elapsed,clock:f.player.creatureAnimationTime});
 f.game.isSystemPaused=true;const paused=snapshot();tick(f,40);assert.equal(snapshot(),paused);f.game.isSystemPaused=false;
 for(const bad of [0,-1,NaN,Infinity])f.player.update(bad);assert.equal(snapshot(),paused);f.dispose();
});
check('Interrupting an ascent with Q starts a continuous descent instead of teleporting',()=>{
 const f=fixture(),p=f.player;assert(p.toggleCeilingProwl());
 for(let i=0;i<600&&p.ceilingTransition?.phase!=='ROLL';i++)tick(f);
 assert.equal(p.ceilingTransition?.phase,'ROLL');tick(f,12);
 const y=p.mesh.position.y,roll=p.mesh.rotation.z;assert(p.toggleCeilingProwl());
 assert.equal(p.ceilingTransition.phase,'DESCEND');assert.equal(p.mesh.position.y,y);assert.equal(p.mesh.rotation.z,roll);
 tick(f,180);assert(!p.ceilingTransition&&!p.isCeilingProwling);assert(bounds(p).min.y>=-.035);f.dispose();
});
check('Stage change invalidates pending locomotion even while paused',()=>{
 const f=fixture();f.player.toggleCeilingProwl();tick(f,10);f.game.currentStage={};f.game.isSystemPaused=true;f.player.update(1/60);assert(!f.player.ceilingTransition&&!f.player.isCeilingProwling);f.dispose();
});
check('Oversized morphology cannot clip through a low support',()=>{
 const f=fixture({caste:'praetorian'});assert(f.player.creatureEnvelope.height>7.8);assert.equal(f.player.toggleCeilingProwl(),false);assert(!f.player.isCeilingProwling);f.dispose();
});
check('Support height is read from the mesh, not a global5.85 constant',()=>{
 const f=fixture({height:10.1}),samples=reachCeiling(f),b=bounds(f.player);assert(b.max.y>9.6&&b.max.y<9.9);assert(samples.length>100);const detail={underSide:9.85,actualContact:b.max.y,rootY:f.player.mesh.position.y};f.dispose();return detail;
});
check('Hanging traversal stays on its beam and refuses perpendicular free flight',()=>{
 const f=fixture();reachCeiling(f);const x=f.player.x,z=f.player.z;f.input.dx=1;tick(f,15);assert.equal(f.player.x,x);f.input.dx=0;f.input.dy=1;tick(f,15);assert(f.player.z>z);assert(f.map.getCreatureCeilingSupportAt(f.player.x,f.player.z));f.dispose();
});
check('Dropping uses gravity and delivers its authored120 impact only at landing once',()=>{
 const f=fixture();reachCeiling(f);const p=f.player,hits=[],target={x:p.x,z:p.z,mesh:new T.Group(),takeDamage(amount){hits.push(amount);}};f.game.humans=[target];
 const startY=p.mesh.position.y;assert(p.dropFromCeiling(target));assert.equal(hits.length,0);assert.equal(p.mesh.position.y,startY);tick(f,8);assert.equal(hits.length,0);assert(p.mesh.position.y<startY);
 for(let i=0;i<180&&p.ceilingTransition;i++)tick(f);assert(!p.ceilingTransition);assert.deepEqual(hits,[120]);tick(f,30);assert.deepEqual(hits,[120]);const b=bounds(p);assert(b.min.y>=-.035);f.dispose();
});
check('Resetting the actor cancels an old descent without hitting the replacement',()=>{
 const f=fixture();reachCeiling(f);const hits=[],p=f.player,target={x:p.x,z:p.z,mesh:new T.Group(),takeDamage(d){hits.push(d);}};f.game.humans=[target];p.dropFromCeiling(target);tick(f,5);p.setForm('drone');tick(f,120);assert.deepEqual(hits,[]);assert(!p.ceilingTransition&&!p.isCeilingProwling);f.dispose();
});
check('A target that leaves the authored landing radius is not hit by a homing drop',()=>{
 const f=fixture();reachCeiling(f);const p=f.player,hits=[],target={x:p.x,z:p.z,mesh:new T.Group(),takeDamage(d){hits.push(d);}};f.game.humans=[target];p.dropFromCeiling(target);target.z+=12;tick(f,120);assert.deepEqual(hits,[]);f.dispose();
});
check('Death or removed support never leave an old impact callback scheduled',()=>{
 const f=fixture();reachCeiling(f);const p=f.player,hits=[],target={x:p.x,z:p.z,mesh:new T.Group(),takeDamage(d){hits.push(d);}};f.game.humans=[target];p.dropFromCeiling(target);p.isDefeated=true;p.health=0;tick(f,120);assert.deepEqual(hits,[]);assert(!p.ceilingTransition);f.dispose();
 const second=fixture();reachCeiling(second);second.beam.parent.remove(second.beam);tick(second);assert(second.player.ceilingTransition?.phase==='DESCEND');tick(second,120);assert(!second.player.isCeilingProwling);second.dispose();
});
check('Emergence and biological handoff flags prevent locomotion input',()=>{
 const f=fixture(),p=f.player;p.x=25;p.z=20;p.mesh.position.set(25,0,20);f.input.dx=1;p.isEmerging=true;tick(f,10);assert.equal(p.x,25);p.isEmerging=false;p.isBiologicalTransition=true;tick(f,10);assert.equal(p.x,25);assert.equal(p.startLeapTo({x:30,z:20},()=>{}),false);f.dispose();
});
check('T140 winds up, wounds once at contact, then hoists the same actor along a checked trajectory',()=>{
 const f=fixture();reachCeiling(f);const p=f.player,v=victimFixture(f),start=v.mesh.position.clone();
 assert(p.executeCeilingImpale(v));assert(p.isLocomotionBusy());assert(v.mesh.position.equals(start));assert.deepEqual(v.hits,[]);
 tick(f,18);assert.deepEqual(v.hits,[]);tick(f,3);assert.deepEqual(v.hits,[140]);assert.equal(v.ceilingActionOwner,p.ceilingAction);assert(v.isRestrained);
 const samples=[];for(let i=0;i<120&&p.ceilingAction?.phase!=='HOLD';i++){tick(f);v.mesh.updateMatrixWorld(true);const b=new T.Box3().setFromObject(v.mesh);samples.push({minY:b.min.y,maxY:b.max.y,position:v.mesh.position.toArray()});}
 assert.equal(p.ceilingAction?.phase,'HOLD');assert(samples.every(s=>s.minY>=-.035&&s.maxY<=8.18));assert(v.mesh.position.y>7.5);assert(v.isCocooned);
 tick(f,60);assert.deepEqual(v.hits,[140]);assert.equal(p.dropFromCeiling(v),false);const detail={samples:samples.length,hits:v.hits,endY:v.mesh.position.y,phase:p.ceilingAction.phase};p.cancelCeilingAction({restorePose:true});v.dispose();f.dispose();return detail;
});
check('Q releases a held victim with gravity, restores actor flags, then descends the creature',()=>{
 const f=fixture();reachCeiling(f);const p=f.player,v=victimFixture(f);assert(p.executeCeilingImpale(v));tick(f,100);assert.equal(p.ceilingAction?.phase,'HOLD');
 const height=v.mesh.position.y;assert(p.toggleCeilingProwl());assert.equal(p.ceilingAction.phase,'RELEASE');assert.equal(v.mesh.position.y,height);tick(f,10);assert(v.mesh.position.y<height);assert(v.isRestrained);
 for(let i=0;i<240&&(p.ceilingAction||p.ceilingTransition);i++)tick(f);
 assert(!p.ceilingAction&&!p.ceilingTransition&&!p.isCeilingProwling);assert.equal(v.isRestrained,false);assert.equal(v.isCocooned,false);assert(!v.ceilingActionOwner);v.mesh.updateMatrixWorld(true);assert(new T.Box3().setFromObject(v.mesh).min.y>=-.035);assert.deepEqual(v.hits,[140]);v.dispose();f.dispose();
});
check('T140 lethal victims are hauled as corpses and cannot become viable hosts',()=>{
 const f=fixture();reachCeiling(f);const p=f.player,v=victimFixture(f,{hp:100});assert(p.executeCeilingImpale(v));tick(f,100);
 assert.equal(v.hp,0);assert.equal(p.ceilingAction?.phase,'HOLD');assert.equal(v.isCocooned,false);assert.equal(v.hostEligibility,'none');assert(v.isConsumedByCycle);assert.deepEqual(v.hits,[140]);p.toggleCeilingProwl();tick(f,180);assert(!v.ceilingActionOwner&&!v.isRestrained);v.dispose();f.dispose();
});
check('T140 pause, target evasion and target removal cannot deliver stale wounds',()=>{
 const f=fixture();reachCeiling(f);const p=f.player,v=victimFixture(f);assert(p.executeCeilingImpale(v));tick(f,8);f.game.isSystemPaused=true;
 const elapsed=p.ceilingAction.elapsed,position=v.mesh.position.clone();tick(f,60);assert.equal(p.ceilingAction.elapsed,elapsed);assert(v.mesh.position.equals(position));assert.deepEqual(v.hits,[]);
 f.game.isSystemPaused=false;v.z+=1;v.mesh.position.z+=1;tick(f,30);assert(!p.ceilingAction);assert.deepEqual(v.hits,[]);
 v.z=p.z+2.5;v.mesh.position.z=v.z;assert(p.executeCeilingImpale(v));f.game.humans=[];tick(f,30);assert(!p.ceilingAction);assert.deepEqual(v.hits,[]);v.dispose();f.dispose();
});
check('T140 stage and actor reset release ownership without preserving a future impact',()=>{
 const f=fixture();reachCeiling(f);const p=f.player,v=victimFixture(f);assert(p.executeCeilingImpale(v));tick(f,30);assert(v.isRestrained);f.game.currentStage={};f.game.isSystemPaused=true;p.update(1/60);assert(!p.ceilingAction&&!v.ceilingActionOwner&&!v.isRestrained);
 const hits=v.hits.length;f.game.isSystemPaused=false;p.setForm('drone');tick(f,120);assert.equal(v.hits.length,hits);v.dispose();f.dispose();
});
check('T140 owner death and a victim killed before contact cancel pending ownership',()=>{
 const f=fixture();reachCeiling(f);const p=f.player,v=victimFixture(f);assert(p.executeCeilingImpale(v));tick(f,5);v.hp=0;v.isIncapacitated=true;tick(f,30);assert(!p.ceilingAction&&!v.ceilingActionOwner);assert.deepEqual(v.hits,[]);
 v.hp=300;v.isIncapacitated=false;assert(p.executeCeilingImpale(v));tick(f,30);assert(v.isRestrained);p.health=0;p.isDefeated=true;tick(f);assert(!p.ceilingAction&&!v.ceilingActionOwner&&!v.isRestrained);assert.deepEqual(v.hits,[140]);v.dispose();f.dispose();
});
check('Q can cancel T140 windup before any wound without moving the victim',()=>{
 const f=fixture();reachCeiling(f);const p=f.player,v=victimFixture(f),position=v.mesh.position.clone();assert(p.executeCeilingImpale(v));tick(f,8);assert(p.toggleCeilingProwl());assert(!p.ceilingAction);assert(v.mesh.position.equals(position));tick(f,180);assert.deepEqual(v.hits,[]);assert(!v.isRestrained);v.dispose();f.dispose();
});
check('A failing victim damage sink cannot repeat the T140 wound on later frames',()=>{
 const f=fixture();reachCeiling(f);const p=f.player,v=victimFixture(f);let calls=0;v.takeDamage=()=>{calls++;throw new Error('Labelled recipient failure');};assert(p.executeCeilingImpale(v));assert.throws(()=>tick(f,30),/Labelled recipient failure/);assert.equal(calls,1);assert(!p.ceilingAction&&!v.ceilingActionOwner);tick(f,60);assert.equal(calls,1);v.dispose();f.dispose();
});
check('T140 rejects a trajectory through a real solid even if its target center is near',()=>{
 const f=fixture();reachCeiling(f);const p=f.player,v=victimFixture(f);const obstacle=new T.Mesh(new T.BoxGeometry(6,3,1),new T.MeshBasicMaterial());obstacle.position.set(p.x,4,p.z+1.2);f.scene.add(obstacle);
 f.map.colliders.push({mesh:obstacle,minX:p.x-3,maxX:p.x+3,minZ:p.z+.7,maxZ:p.z+1.7});assert.equal(p.executeCeilingImpale(v),false);assert.deepEqual(v.hits,[]);assert(!v.isRestrained);obstacle.geometry.dispose();obstacle.material.dispose();obstacle.parent.remove(obstacle);v.dispose();f.dispose();
});
check('A sealed floor anchors the last safe captive with real resin and repositions along the beam before descent',()=>{
 const f=fixture();reachCeiling(f);const p=f.player,v=victimFixture(f);assert(p.executeCeilingImpale(v));tick(f,100);assert.equal(p.ceilingAction?.phase,'HOLD');
 const block=new T.Mesh(new T.BoxGeometry(28,1,24),new T.MeshBasicMaterial());block.position.set(0,.5,2);f.scene.add(block);f.map.colliders.push({mesh:block,minX:-14,maxX:14,minZ:-10,maxZ:14});
 const captivePosition=v.mesh.position.clone();assert(p.toggleCeilingProwl());assert(!p.ceilingAction);assert(v.ceilingAnchor?.isCurrent());assert(v.mesh.position.equals(captivePosition));assert.equal(p.ceilingTransition?.phase,'DESCEND_POSITION');assert(f.game.biologicalRemains.has(v.ceilingAnchor.group));
 const samples=[];for(let i=0;i<600&&p.ceilingTransition;i++)tick(f,1,1/60,samples);
 assert(!p.ceilingTransition&&!p.isCeilingProwling&&!p.isLocomotionBusy());assert(samples.some(sample=>sample.phase==='DESCEND_POSITION'));assert(samples.every(sample=>sample.minY>=-.035));assert.equal(f.game.humans.length,1);assert.deepEqual(v.hits,[140]);
 const record=v.ceilingAnchor;assert(record.dispose());assert.equal(record.dispose(),false);assert(!v.ceilingAnchor&&!v.ceilingActionOwner);assert(!f.game.biologicalRemains.has(record.group));assert.equal(record.group.parent,null);
 block.geometry.dispose();block.material.dispose();block.parent.remove(block);v.dispose();f.dispose();return {frames:samples.length,end:{x:p.x,z:p.z},noDuplicateActors:true};
});
check('An invalid last captive pose reports a blocked action instead of inventing an anchor',()=>{
 const f=fixture();reachCeiling(f);const p=f.player,v=victimFixture(f);assert(p.executeCeilingImpale(v));tick(f,100);
 const obstacle=new T.Mesh(new T.BoxGeometry(8,8,8),new T.MeshBasicMaterial());obstacle.position.copy(v.mesh.position);f.scene.add(obstacle);const col={mesh:obstacle,minX:-4,maxX:4,minZ:v.z-4,maxZ:v.z+4};f.map.colliders.push(col);
 assert(p.toggleCeilingProwl());assert.equal(p.ceilingAction?.failureReason,'no-safe-release-or-anchor');assert(!v.ceilingAnchor);assert(f.messages.some(message=>message.includes('Impossible de libérer ou d’ancrer')));assert.deepEqual(v.hits,[140]);
 col.disabled=true;obstacle.parent.remove(obstacle);obstacle.geometry.dispose();obstacle.material.dispose();p.toggleCeilingProwl();tick(f,240);assert(!p.ceilingAction&&!p.ceilingTransition);v.dispose();f.dispose();
});
check('The complete authored station accepts a real wall-beam ascent with all industrial geometry present',()=>{
 const f=fixture(),renderer=f.context.rendererEngine,originalLoad=T.TextureLoader.prototype.load;
 f.wall.parent.remove(f.wall);f.beam.parent.remove(f.beam);
 const map=new f.context.MapClass();f.context.stationMap=map;f.map=map;
 renderer.mapGroup=new T.Group();renderer.propsGroup=new T.Group();f.scene.add(renderer.mapGroup,renderer.propsGroup);
 renderer.renderer={capabilities:{getMaxAnisotropy:()=>1}};
 try{
   // Only pixels are unavailable in Node; the complete authored geometry,
   // colliders, placement and stage progression methods are not replaced.
   T.TextureLoader.prototype.load=function(){return new T.Texture();};
   map.buildMap();
   const p=f.player;
   assert.equal(map.wave31Props.length,300);assert(map.ceilingSupports.length>=1);
   let support=null,start=null;
   candidateSearch: for(const x of [-45,-30,-60,30,45,60])for(const z of [-35,-15,15,35]){
     if(map.checkCollision(x,z,p.creatureEnvelope.radius))continue;
     p.x=x;p.z=z;const candidate=p.findCeilingSupport();
     if(candidate){support=candidate;start={x,z};break candidateSearch;}
   }
   assert(support&&p.canFitCeilingTransition(support),'Authored playable map offers no valid support route');
   p.mesh.position.set(p.x,0,p.z);p.applyGroundContact();
   const samples=reachCeiling(f);
   assert(samples.every(sample=>sample.minY>=-.035&&sample.maxY<=support.undersideY+.03));
   const detail={scope:'Actual buildMap/models; blank TextureLoader fixture only. Prepared native-world coordinates, not renderer or human QA.',
     industrial:map.wave31Props.length,placed:map.wave31Props.filter(prop=>prop.placementStatus==='placed').length,
     supports:map.ceilingSupports.length,colliders:map.colliders.length,start,
     end:{x:p.x,z:p.z,y:p.mesh.position.y},support:{id:support.id,undersideY:support.undersideY},frames:samples.length};
   return detail;
 }finally{
   T.TextureLoader.prototype.load=originalLoad;f.dispose();factory.disposeModel(renderer.propsGroup);factory.disposeModel(renderer.mapGroup);
 }
});
const report={scope:'Actual production methods and procedural model geometry in labelled minimal station/input/presentation fixtures; not browser or human QA.',
 sourceSha256:Object.fromEntries(['src/game.js','src/models.js','src/industrial-layout.js'].filter(file=>fs.existsSync(path.join(root,file))).map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')])),
 groups:results.length,passed:results.filter(result=>result.passed).length,results};
const output=process.argv.find(arg=>arg.startsWith('--output='))?.slice(9);
if(output){const file=path.resolve(root,output);assert(file.startsWith(path.join(root,'.tools')+path.sep));assert(!fs.existsSync(file),'Do not overwrite earlier evidence');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');}
console.log(`${report.passed}/${report.groups} creature coherence groups passed`);process.exitCode=report.passed===report.groups?0:1;
module.exports={fixture,tick,bounds,reachCeiling,THREE:T,factory};
