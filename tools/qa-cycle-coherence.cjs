#!/usr/bin/env node
'use strict';
// Actual lifecycle classes/methods; DOM/audio/geometry and navigation fixtures
// are explicit. This suite is not a native-render or human-animation verdict.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'src/game.js'),'utf8');
const THREE=require(path.join(root,'assets/vendor/three.r128.min.js'));
const results=[];
function check(name,run){try{const detail=run();results.push({name,passed:true,detail});console.log('PASS '+name);}catch(error){results.push({name,passed:false,error:error.stack});console.error('FAIL '+name+': '+error.message);}}
const pick=(a,b)=>{const start=source.indexOf(a),end=source.indexOf(b,start);assert(start>=0&&end>start);return source.slice(start,end);};
const profiles={drone:{key:'drone',label:'Drone',maxHealth:190,speed:.35},warrior:{key:'warrior',label:'Warrior',maxHealth:245,speed:.32},runner:{key:'runner',label:'Runner',maxHealth:160,speed:.48},praetorian:{key:'praetorian',label:'Praetorian',maxHealth:300,speed:.3}};
function fixture(){
  const scene=new THREE.Group(),props=new THREE.Group();scene.add(props);
  const observations={fade:[],removed:[],advances:0,collisionSamples:[],camera:[]};
  const uiElement=()=>({style:{},classList:{toggle(){},remove(){},add(){}},setAttribute(){},focus(){},querySelectorAll:()=>[],textContent:'',innerHTML:''});
  const elements=new Map(),document={getElementById:id=>{if(!elements.has(id))elements.set(id,uiElement());return elements.get(id);},querySelector:()=>uiElement()};
  const game={isRunning:true,campaignActive:true,isSystemPaused:false,currentStage:null,currentStageIndex:2,activeOrigin:{id:'hive'},humans:[],campaignCharacters:{asterRho:{usedAsHost:false}},syncCampaignCharacter(){},advanceStage(stage){assert.equal(this.currentStage,stage);observations.advances++;this.currentStage=null;},showEndModal(){this.isRunning=false;}};
  const stationMap={recoveryRoomAnchors:[{id:'shelter',x:12,z:0}],checkCollision(x,z){const blocked=x>4&&x<6&&Math.abs(z)<1;observations.collisionSamples.push({x,z,blocked});return blocked;},
    hasLineOfSight:()=>false,findPath(x,z,tx,tz){return x<6?[{x:3,z:2},{x:7,z:2},{x:tx,z:tz}]:[{x:tx,z:tz}];}};
  const rendererEngine={scene,propsGroup:props,removeObject(object){observations.removed.push(object);object?.parent?.remove(object);},snapCameraTarget(x,z){observations.camera.push([x,z]);},addScreenShake(){}};
  const player={form:'facehugger',adultCaste:'drone',health:100,maxHealth:100,embryoMutation:null,x:0,z:0,isProwling:false,moveWaypoints:[],getAdultProfile(){return profiles[this.adultCaste];},
    createMesh(){this.clearMesh();this.mesh=new THREE.Group();this.detailedModel=new THREE.Group();this.mesh.add(this.detailedModel);this.detailedModel.userData.setFoldedPose=fold=>{this.detailedModel.userData.foldedPose=fold;};
      this.detailedModel.add(new THREE.Mesh(new THREE.BoxGeometry(.7,1.8,.6),new THREE.MeshBasicMaterial()));this.mesh.position.set(this.x,0,this.z);scene.add(this.mesh);},
    detachFromHost({releaseHost=true,hide=false}={}){if(releaseHost&&this.attachedHost)this.attachedHost.isRestrained=false;this.attachedHost=null;this.mesh.visible=!hide;},
    setEmbryoMutation(){},setChrysalis(){},triggerAttack(){},cancelCeilingTransition(){}};
  const audioManager={playHeartbeat(){},playWetImpact(){},playHostCough(){},playBoneCrunch(){},playXenoRoar(){},playCocoonWeave(){},playCocoonPulse(){},playChestburstScreech(){}};
  const window={gameInstance:game,HiveSystems:{ui:{setBiologicalTransition(value){observations.fade.push(value);},clearBiologicalTransition(){observations.fade.push(0);}},unlockCodex(){},updateObjective(){},setMission(){},narrative(){},vfx:{ring(){},burst(){}}},
    HiveModelFactory:{createDeadFacehuggerHusk(){const group=new THREE.Group();group.add(new THREE.Mesh(new THREE.SphereGeometry(.2),new THREE.MeshBasicMaterial()));group.rotation.x=Math.PI*.92;return group;},placeOnGround(object,y){object.updateMatrixWorld(true);object.position.y+=y-new THREE.Box3().setFromObject(object).min.y;}}};
  window.HiveSystems.vfx.transformation=()=>{};
  class ThoracicView{deactivate(){}activate(){}getCameraOverride(){return null;}update(){}setBurstProgress(){}}
  const ctx=vm.createContext({window,document,THREE,stationMap,playerCreature:player,rendererEngine,audioManager,ADULT_CASTE_PROFILES:profiles,ThoracicView,
    getAnimationModel:()=>null,animateProceduralModel(){},appendSensorLog(){},setHudBar(){},showToast(){},alarmSystem:{setLevel(){}},Math,Number,Set,console});
  const loadMethod=(a,b)=>vm.runInContext('({'+pick(a,b)+'})',ctx);
  Object.assign(player,loadMethod('    setAdultCaste(caste,','    clearMesh() {'));
  Object.assign(player,loadMethod('    clearProwlLeap(','    poseProwlLanding('));
  Object.assign(player,loadMethod('    clearMesh() {','    createMesh() {'));
  Object.assign(player,loadMethod('    setForm(form) {','    takeDamage(amount,'));
  player.createMesh();
  vm.runInContext(pick('  const ACTION_SVG_ICONS = {','  // MULTI-ORIGIN CAMPAIGN START'),ctx);
  vm.runInContext(pick('  class StageFacehugger {','  class StageChestburster {')+';globalThis.Face=StageFacehugger;',ctx);
  vm.runInContext(pick('  class StageChestburster {','  // STAGE 4 — DRONE:')+';globalThis.Chest=StageChestburster;',ctx);
  const face=new ctx.Face();face.ownerGame=game;face.updateHUD=()=>{};game.currentStage=face;
  const host={name:'Prepared host',type:'scientist',hostEligibility:'viable',x:0,z:0,hp:110,maxHp:110,usedAsHost:false,isIncapacitated:false,mesh:new THREE.Group(),faceAnchor:new THREE.Group(),isSynthetic:()=>false,
    fleeFrom(){this.aiState='FLEE';return true;},choosePatrolWaypoint(){this.aiState='PATROL';}};
  const body=new THREE.Mesh(new THREE.BoxGeometry(.65,1.8,.4),new THREE.MeshBasicMaterial());body.position.y=.9;host.mesh.add(body);host.faceAnchor.position.y=1.6;host.mesh.add(host.faceAnchor);scene.add(host.mesh);game.humans.push(host);face.targetHost=host;
  const chest=()=>{const c=new ctx.Chest();c.ownerGame=game;c.updateHUD=()=>{};game.currentStage=c;game.currentStageIndex=3;return c;};
  return {ctx,player,game,host,face,chest,scene,props,stationMap,observations,window,elements};
}
check('Production contains neither QA caste selector nor instant Alpha evolution',()=>{assert(!source.includes('select-adult-caste'));assert(!source.includes('btn-evolve-alpha'));});
check('Live adult mutation requests preserve caste health and mesh exactly',()=>{
  const {player}=fixture();player.form='drone';player.health=30;player.maxHealth=190;const mesh=player.mesh;
  for(const options of [undefined,true,false,{}, {lifecycle:{step:'EMERGING'}}])assert.equal(player.setAdultCaste('warrior',options),false);
  assert.equal(player.adultCaste,'drone');assert.equal(player.health,30);assert.equal(player.maxHealth,190);assert.equal(player.mesh,mesh);
  assert.equal(player.setAdultCaste('drone',true),true);assert.equal(player.health,30);assert.equal(player.mesh,mesh);
});
check('Future lineage config does not grant adult health or accept unknown species',()=>{
  const {player}=fixture();assert.equal(player.setAdultCaste('runner',true),true);assert.equal(player.health,100);assert.equal(player.maxHealth,100);assert.equal(player.setAdultCaste('unknown'),false);
});
check('Host lineage follows biology not human equipment',()=>{
  const {face,host,player}=fixture();for(const type of ['scientist','marine','commando','smartgunner']){host.type=type;assert.equal(face.configureHostLineage(host),true);assert.equal(player.adultCaste,'drone');}
  host.type='labhound';face.configureHostLineage(host);assert.equal(player.adultCaste,'runner');host.hostEligibility='protected';host.maskAttachments=2;assert.equal(face.configureHostLineage(host),false);
  host.hostEligibility='viable';host.maskAttachments=0;face.isRoyal=true;face.configureHostLineage(host);assert.equal(player.adultCaste,'praetorian');
});
check('Royal origin rebuilds the actual normal actor API and rejects a free mutation elsewhere',()=>{
  const {face,game,player}=fixture();let builds=0;const build=player.createMesh;player.createMesh=function(){builds++;return build.call(this);};
  game.activeOrigin.id='starship';assert.equal(face.applyRoyalMutation(true),false);assert.equal(builds,0);
  game.activeOrigin.id='hive';assert.equal(face.applyRoyalMutation(true),true);assert.equal(player.facehuggerVariant,'royal');assert.equal(builds,1);assert(player.mesh.children.includes(player.detailedModel));
});
check('Click-spam cannot skip attachment residence or recovery phases',()=>{
  const {face,game,host}=fixture();face.isAttacking=true;face.implantProgress=100;assert.equal(face.finishImplantationIfReady(),false);assert.equal(host.usedAsHost,false);
  for(let i=0;i<125;i++)face.update(1/60);assert.equal(face.postImplantPhase,'ATTACHED_HOLD');assert.equal(game.currentStage,face);assert.equal(host.isRestrained,true);
});
check('Imported host actively braces both hands beside its face with exclusive animation ownership',()=>{
  const f=fixture(),model=new THREE.Group(),bindings={};f.host.mesh.add(model);
  const bone=(key,parent,position)=>{const result=new THREE.Bone();result.name=key;result.position.fromArray(position);parent.add(result);bindings[key]=result;return result;};
  const spine=bone('spine',model,[0,2.7,0]);bone('head',spine,[0,1.1,0]);
  // Rocketbox's anatomical left shoulder is +actor X. A hard-coded side sign
  // crosses both arms even when each hand's face distance looks plausible.
  for(const[side,sign]of[['left',1],['right',-1]]){const upper=bone(side+'UpperArm',spine,[sign*.55,.45,0]);const fore=bone(side+'ForeArm',upper,[0,-.75,0]);bone(side+'Hand',fore,[0,-.75,0]);}
  f.host.faceAnchor.position.set(0,3.9,.3);f.host.mesh.updateMatrixWorld(true);
  const bindPose=Object.entries(bindings).map(([key,bone])=>({key,bone,quaternion:bone.quaternion.clone(),position:bone.position.clone()}));
  const runtime={bindings,bindPose,state:{}},library={handlesRoot:m=>m===model,getRuntime:()=>runtime,
    setState(m,state){Object.assign(runtime.state,state);},updateModel(){if(runtime.state.frozen)return;for(const pose of bindPose){pose.bone.quaternion.copy(pose.quaternion);pose.bone.position.copy(pose.position);}}};
  f.window.HiveAssetLibrary=library;f.ctx.getAnimationModel=()=>model;f.face.isAttacking=true;
  const face=f.host.faceAnchor.getWorldPosition(new THREE.Vector3()),initial=bindings.leftHand.getWorldPosition(new THREE.Vector3());
  assert.equal(f.face.poseAttachedHost(1/60),true);f.host.mesh.updateMatrixWorld(true);
  const left=bindings.leftHand.getWorldPosition(new THREE.Vector3()),right=bindings.rightHand.getWorldPosition(new THREE.Vector3());
  assert(left.y>initial.y+.8);assert(right.y>initial.y+.8);assert(left.x>face.x+.45);assert(right.x<face.x-.45);
  assert(left.distanceTo(face)<.9&&right.distanceTo(face)<.9);assert.equal(runtime.state.frozen,true);assert.equal(f.host.isRecoveringFromFacehugger,true);assert.equal(f.host.isRestrained,true);
  const a=bindings.leftHand.getWorldPosition(new THREE.Vector3());f.face.poseAttachedHost(.05);const b=bindings.leftHand.getWorldPosition(new THREE.Vector3());assert(a.distanceTo(b)>.001);
  const before=bindings.leftUpperArm.quaternion.clone(),time=f.face.attachedPoseTime;f.game.isSystemPaused=true;assert.equal(f.face.poseAttachedHost(.05),false);assert.equal(f.face.attachedPoseTime,time);assert(bindings.leftUpperArm.quaternion.equals(before));
  f.game.isSystemPaused=false;f.face.destroy();assert.equal(runtime.state.frozen,false);assert.equal(f.host.isRecoveringFromFacehugger,false);assert.equal(f.host.isRestrained,false);
  f.game.currentStage={};assert.equal(f.face.poseAttachedHost(.05),false);assert.equal(f.face.attachedPoseTime,time);
  return {initialY:initial.y,hands:[left.toArray(),right.toArray()],alternatingMovement:a.distanceTo(b)};
});
check('Paused and stale lifecycle updates are inert',()=>{
  const {face,game}=fixture();face.attachedElapsed=2;face.implantProgress=100;face.finishImplantationIfReady();game.isSystemPaused=true;for(let i=0;i<120;i++)face.update(.05);assert.equal(face.phaseElapsed,0);
  game.isSystemPaused=false;game.currentStage={};face.update(.05);assert.equal(face.phaseElapsed,0);face.destroy();assert.equal(game.hostRecoveryRecord,undefined);
});
check('The same host wakes discovers flees and reaches shelter before gestation',()=>{
  const {face,game,host,observations}=fixture();face.attachedElapsed=2;face.implantProgress=100;face.finishImplantationIfReady();
  const positions=[];for(let i=0;i<4000&&game.currentStage===face;i++){face.update(1/60);positions.push({x:host.x,z:host.z});}
  assert.equal(observations.advances,1);assert.equal(game.hostRecoveryRecord.host,host);assert.equal(game.hostRecoveryRecord.completed,true);assert(Math.hypot(host.x-12,host.z)<.8);
  assert.deepEqual(Array.from(face.recoveryPhases),['ATTACHED_HOLD','COLLAPSE','HUSK_FALL','UNCONSCIOUS','WAKE','DISCOVER','PANIC_FLEE','FADE_OUT','RELOCATING','FADE_IN']);
  assert(positions.every(p=>!(p.x>4&&p.x<6&&Math.abs(p.z)<1)));assert(observations.fade.includes(1));assert.equal(observations.fade.at(-1),0);assert.equal(host.infectionState,'GESTATING');
  assert.equal(host.isRecoveringFromFacehugger,false);assert.equal(host.isRestrained,false);return {steps:positions.length,last:[host.x,host.z]};
});
check('Closed passages never cause an empty path to count as successful relocation',()=>{
  const {face,game,host,stationMap}=fixture();face.recoveryDestination={x:12,z:0};face.recoveryRoute=[];stationMap.findPath=()=>[];
  assert.equal(face.moveRecoveryRoute(.05),false);assert.equal(host.x,0);assert.equal(game.hostRecoveryRecord,undefined);
});
check('Loss of the recovering host aborts once and clears transition ownership',()=>{
  const {face,game,host,player}=fixture();face.attachedElapsed=2;face.implantProgress=100;face.finishImplantationIfReady();host.isIncapacitated=true;face.update(.05);assert.equal(game.isRunning,false);assert.equal(player.isBiologicalTransition,false);assert.equal(game.hostRecoveryRecord,undefined);
});
check('Emergence requires the mature fed cocoon and cannot skip straight to adult play',()=>{
  const f=fixture(),c=f.chest();f.player.form='chestburster';f.player.isChrysalis=true;for(const [step,timer,food]of [['HUNT_FAUNA',100,3],['CHRYSALIS',99,3],['CHRYSALIS',100,2]]){c.step=step;c.chrysalisTimer=timer;c.biomassHunted=food;assert.equal(c.emergeAdultForm(),false);}assert.equal(f.observations.advances,0);
});
check('Mature cocoon opens over simulated time and leaves its actual exuvia',()=>{
  const f=fixture(),c=f.chest();c.step='CHRYSALIS';c.chrysalisTimer=100;c.biomassHunted=3;f.player.form='chestburster';f.player.isChrysalis=true;
  const cocoon=f.player.mesh;for(const name of ['suture_lip_left','suture_lip_right','pod_membrane','developing_cranial_dome','developing_torso',...Array.from({length:5},(_,i)=>'suture_ligament_'+i)]){const mesh=new THREE.Mesh(new THREE.SphereGeometry(.1),new THREE.MeshBasicMaterial());mesh.name=name;cocoon.add(mesh);}
  assert.equal(c.emergeAdultForm(),true);assert.equal(c.step,'EMERGING');assert.equal(f.observations.advances,0);assert.equal(f.player.mesh.visible,false);assert.equal(cocoon.parent,f.scene);
  for(let i=0;i<60;i++)c.update(1/60);assert.equal(f.observations.advances,0);assert(cocoon.getObjectByName('suture_lip_left').position.x<-.06);assert.equal(f.player.mesh.visible,true);
  const elapsed=c.emergenceElapsed;f.game.isSystemPaused=true;c.update(.05);assert.equal(c.emergenceElapsed,elapsed);f.game.isSystemPaused=false;
  for(let i=0;i<120&&f.game.currentStage===c;i++)c.update(1/60);
  assert.equal(f.observations.advances,1);assert.equal(f.player.isEmerging,false);assert(f.game.biologicalRemains.has(cocoon));assert.equal(cocoon.name,'discarded_chrysalis_exuvia');
});
check('Blocked emergence does not consume or replace the existing cocoon',()=>{
  const f=fixture(),c=f.chest();c.step='CHRYSALIS';c.chrysalisTimer=100;c.biomassHunted=3;f.player.form='chestburster';f.player.isChrysalis=true;f.stationMap.checkCollision=()=>true;const cocoon=f.player.mesh;
  assert.equal(c.emergeAdultForm(),false);assert.equal(f.player.mesh,cocoon);assert.equal(c.step,'CHRYSALIS');assert.equal(f.observations.advances,0);
});
check('Gestation keeps the same recovered host and hides the juvenile externally',()=>{
  const f=fixture(),c=f.chest();f.host.isInfected=true;f.host.usedAsHost=true;f.host.infectionState='GESTATING';
  c.init();assert.equal(c.infectedHost,f.host);assert.equal(f.player.mesh.visible,false);assert.equal(f.host.infectionState,'GESTATING');assert.equal(f.host.isRestrained,false);
  assert.equal(c.toggleInternalView(),true);assert.equal(c.internalViewActive,true);assert.equal(f.elements.get('btn-thoracic-erupt').disabled,true);
  assert.equal(c.toggleInternalView(),true);assert.equal(c.internalViewActive,false);assert.equal(c.step,'INTERNAL_GESTATION');
});
check('Manual internal observation never unlocks premature sternum rupture',()=>{
  const f=fixture(),c=f.chest();c.infectedHost=f.host;assert.equal(c.toggleInternalView(),true);c.perforateSternum();assert.equal(c.step,'INTERNAL_GESTATION');
  c.step='EMERGING';assert.equal(c.toggleInternalView(),false);
});
check('Future adult clearance is checked before replacing the cocoon',()=>{
  const f=fixture(),c=f.chest();c.step='CHRYSALIS';c.chrysalisTimer=100;c.biomassHunted=3;
  f.player.form='chestburster';f.player.isChrysalis=true;
  const original=f.player.mesh;f.player.getAdultClearance=()=>({radius:2});f.stationMap.checkCollision=(x,z,padding)=>padding>1;
  assert.equal(c.emergeAdultForm(),false);assert.equal(f.player.mesh,original);assert.equal(f.player.form,'chestburster');assert.equal(c.step,'CHRYSALIS');
});
check('Missing shelter is searched at bounded cadence then fails visibly without black-screen lock',()=>{
  const f=fixture();f.face.setRecoveryPhase('PANIC_FLEE');let searches=0;f.face.findRecoveryDestination=()=>{searches++;return null;};
  for(let i=0;i<900&&f.game.isRunning;i++)f.face.update(1/60);
  assert.equal(searches,5);assert.equal(f.game.isRunning,false);assert.equal(f.observations.advances,0);assert.equal(f.observations.fade.at(-1),0);
});
check('A stale mature cocoon cannot emerge into a restarted actor',()=>{
  const f=fixture(),c=f.chest();c.step='CHRYSALIS';c.chrysalisTimer=100;c.biomassHunted=3;f.player.form='chestburster';f.player.isChrysalis=true;
  const mesh=f.player.mesh,hp=f.player.health;f.game.currentStage={};assert.equal(c.emergeAdultForm(),false);assert.equal(f.player.mesh,mesh);assert.equal(f.player.health,hp);assert.equal(f.observations.advances,0);
});
check('A retained cocoon button cannot restart an old or already mature cycle',()=>{
  const f=fixture(),c=f.chest();c.step='HUNT_FAUNA';c.biomassHunted=3;f.player.form='chestburster';f.player.isChrysalis=false;
  f.ctx.Chest.prototype.updateHUD.call(c);const click=f.elements.get('btn-start-chrysalis').onclick,mesh=f.player.mesh;
  f.game.currentStage={};click();assert.equal(f.player.isChrysalis,false);assert.equal(f.player.mesh,mesh);
  f.game.currentStage=c;c.step='CHRYSALIS';click();assert.equal(f.player.isChrysalis,false);assert.equal(f.player.mesh,mesh);
});
check('A recovered host keeps priority over unrelated previously infected actors',()=>{
  const f=fixture(),c=f.chest();const unrelated={isInfected:true,usedAsHost:true};f.host.isInfected=true;f.host.usedAsHost=true;
  f.game.humans.unshift(unrelated);f.game.hostRecoveryRecord={host:f.host,completed:true};c.init();assert.equal(c.infectedHost,f.host);assert.equal(unrelated.infectionState,undefined);
});
check('A dead or consumed recovery record cannot override a living saved host',()=>{
  const f=fixture(),c=f.chest();f.host.isInfected=true;f.host.usedAsHost=true;f.host.hp=0;f.host.isConsumedByCycle=true;
  const living={...f.host,name:'Living saved host',hp:70,isConsumedByCycle:false,mesh:new THREE.Group()};
  f.game.humans.push(living);f.game.hostRecoveryRecord={host:f.host,completed:true};c.init();assert.equal(c.infectedHost,living);assert.equal(f.host.hp,0);
});
function birthFixture(scale=.50){
  global.THREE=THREE;for(const name of ['organic-sculpt','surface-detail','model-detail','models'])require(path.join(root,'src',name+'.js'));
  const f=fixture(),c=f.chest(),mesh=global.HiveModelFactory.createChestburster(false);mesh.scale.multiplyScalar(scale);mesh.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(mesh);bounds.translate(new THREE.Vector3(0,-bounds.min.y,0));const size=bounds.getSize(new THREE.Vector3());
  const clearance={bounds,height:size.y,radius:Math.max(.18,Math.abs(bounds.min.x),Math.abs(bounds.max.x)),front:bounds.max.z,rear:-bounds.min.z};global.HiveModelFactory.disposeModel(mesh);
  f.player.getJuvenileClearance=()=>({...clearance,bounds:bounds.clone()});f.player.form='chestburster';f.player.mesh.visible=false;
  f.host.x=-17.48303671605424;f.host.z=-5.713520891900392;f.host.mesh.position.set(f.host.x,0,f.host.z);f.host.collapseForBurst=()=>{f.observations.collapses=(f.observations.collapses||0)+1;f.host.mesh.rotation.x=Math.PI/2;};
  f.stationMap.colliders=[{minX:-16.6,maxX:-13.4,minZ:-16.6,maxZ:16.6}];
  const proto=vm.runInContext('(class {'+pick('    checkCollision(nextX,','    findPath(')+pick('    isCreaturePoseClear(bounds) {','    getCreatureCeilingSupportAt(')+'})',f.ctx).prototype;
  f.stationMap.checkCollision=proto.checkCollision;f.stationMap.isCreaturePoseClear=proto.isCreaturePoseClear;
  c.infectedHost=f.host;c.step='READY_TO_BURST';c.gestationProgress=100;c.spawnRodents=()=>{f.observations.rodents=(f.observations.rodents||0)+1;};
  return {...f,c,clearance};
}
check('The native blocked birth origin is rejected at actual juvenile clearance without consuming the host',()=>{
  const f=birthFixture(.94);assert.equal(f.stationMap.checkCollision(f.host.x,f.host.z,.4),false);assert.equal(f.stationMap.checkCollision(f.host.x,f.host.z,f.clearance.radius),true);
  assert.equal(f.c.perforateSternum(),false);assert.equal(f.c.step,'READY_TO_BURST');assert.equal(f.host.isConsumedByCycle,undefined);assert.equal(f.host.hp,110);assert.equal(f.player.mesh.visible,false);assert.equal(f.host.isRestrained,false);
  return {source:'Native final3 collider and endpoint replay; historical oversized body retained as a blocking fixture',radius:f.clearance.radius};
});
check('Actual juvenile geometry exits the chest over time onto a preflighted full-body floor pose',()=>{
  const f=birthFixture();assert.equal(f.c.perforateSternum(),true);assert.equal(f.player.isBiologicalTransition,true);const plan=f.c.burstExtraction;
  for(let i=0;i<=20;i++)assert(f.c.isBurstExtractionPoseClear(plan,i/20));
  f.c.finishBurstSequence();assert.equal(f.c.step,'BURST_SEQUENCE');assert.equal(f.host.isConsumedByCycle,undefined);
  for(let i=0;i<80&&f.c.step==='BURST_SEQUENCE';i++)f.c.update(1/60);
  assert.equal(f.c.step,'BURST_EXTRACTION');assert(f.player.mesh.position.y>.2);assert.equal(f.host.hp,0);assert.equal(f.host.hostEligibility,'none');assert.equal(f.observations.collapses,1);
  let previous=f.player.mesh.position.clone();for(let i=0;i<15;i++){f.c.update(1/60);assert(f.player.mesh.position.distanceTo(previous)<.15);previous=f.player.mesh.position.clone();}
  const elapsed=plan.elapsed;f.game.isSystemPaused=true;f.c.update(.05);assert.equal(plan.elapsed,elapsed);assert(f.player.mesh.position.equals(previous));f.game.isSystemPaused=false;
  for(let i=0;i<80&&f.c.step==='BURST_EXTRACTION';i++)f.c.update(1/60);
  assert.equal(f.c.step,'HUNT_FAUNA');assert.equal(f.player.mesh.position.y,0);assert.equal(f.player.isBiologicalTransition,false);assert.equal(f.observations.rodents,1);assert.equal(f.observations.collapses,1);
  assert(!f.stationMap.checkCollision(f.player.x,f.player.z,f.clearance.radius));return {radius:f.clearance.radius,end:[f.player.x,f.player.z],duration:plan.duration};
});
check('Blocked extraction volumes refuse a rupture and retain a living moving host',()=>{
  const f=birthFixture();f.stationMap.isCreaturePoseClear=()=>false;assert.equal(f.c.perforateSternum(),false);assert.equal(f.host.hp,110);assert.equal(f.host.isConsumedByCycle,undefined);assert.equal(f.host.isRestrained,false);assert.equal(f.c.step,'READY_TO_BURST');
});
check('Reset or stale extraction cannot move a replacement actor or keep transition ownership',()=>{
  const f=birthFixture();assert(f.c.perforateSternum());for(let i=0;i<80&&f.c.step==='BURST_SEQUENCE';i++)f.c.update(1/60);assert.equal(f.c.step,'BURST_EXTRACTION');
  f.c.destroy();assert.equal(f.player.isBiologicalTransition,false);assert.equal(f.c.burstExtraction,null);const position=f.player.mesh.position.clone();f.game.currentStage={};f.c.update(.05);assert(f.player.mesh.position.equals(position));assert.equal(f.observations.rodents,undefined);
});
const passed=results.filter(r=>r.passed).length;
const report={scope:'Actual lifecycle methods with labelled DOM/audio/geometry/path fixtures; not native graphics or human QA',sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),groups:results.length,passed,results};
const out=process.argv.find(a=>a.startsWith('--output='))?.slice(9);
if(out){const target=path.resolve(root,out);assert(target.startsWith(path.join(root,'.tools')+path.sep));assert(!fs.existsSync(target));fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');}
console.log(`${passed}/${results.length} cycle coherence groups passed`);process.exitCode=passed===results.length?0:1;
