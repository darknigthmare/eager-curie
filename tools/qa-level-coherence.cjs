#!/usr/bin/env node
'use strict';
// Actual map/prop methods and factory geometry. Texture loading, DOM/audio and
// GPU output are explicit Node fixtures; this is not a native playthrough.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/game.js'), 'utf8');
const T = global.THREE = require('../assets/vendor/three.r128.min.js');
require('../src/organic-sculpt.js'); require('../src/surface-detail.js'); require('../src/model-detail.js'); require('../src/models.js');
const factory = global.HiveModelFactory;
if(!process.argv.includes('--author-layout')&&fs.existsSync(path.join(root,'src/industrial-layout.js')))require('../src/industrial-layout.js');
const noop = () => {}, sink = new Proxy({}, {get: () => noop});
const vfx = new Proxy({effects:[]}, {get:(target,key)=>key in target?target[key]:noop});
const game = {currentStageIndex: 4, currentStage: {}, humans: []};
const player = {x: 0, z: 0};
const renderer = {mapGroup: new T.Group(), propsGroup: new T.Group(), renderer: {capabilities: {getMaxAnisotropy: () => 1}}};
T.TextureLoader.prototype.load = function () { return new T.Texture(); };
const context = {THREE:T, console, Math, performance, playerCreature:player, rendererEngine:renderer,
  window:{gameInstance:game, HiveModelFactory:factory, HiveIndustrialLayout:global.HiveIndustrialLayout,
    HiveIndustrialLayoutAuthoring:process.argv.includes('--author-layout'), HiveSystems:{vfx}},
  document:{getElementById:()=>null}, audioManager:sink, showToast:noop, appendSensorLog:noop,
  resinGrid:{damageResinNodes:noop}, alarmSystem:{setLevel:noop}, visionSystem:sink};
const start = source.indexOf('  class StationMap {'), end = source.indexOf('  const stationMap = new StationMap();', start);
assert(start > 0 && end > start);
const originsStart=source.indexOf('  const STARTING_CAMPAIGN_ORIGINS = Object.freeze({');
const originsEnd=source.indexOf('  const ADULT_CASTE_PROFILES',originsStart);
assert(originsStart>0&&originsEnd>originsStart);
const MapClass = vm.runInNewContext(source.slice(originsStart,originsEnd)+source.slice(start, end) + '\nStationMap;', context);
const map = new MapClass(); context.stationMap = map;
const results = [];
const groupFilter=process.argv.find(arg=>arg.startsWith('--only='))?.slice(7);
function check(name, run) {
  if(groupFilter&&!name.includes(groupFilter))return;
  try { const detail=run(); results.push({name,passed:true,detail}); console.log('PASS '+name); }
  catch(error){results.push({name,passed:false,error:error.stack});console.error('FAIL '+name+': '+error.message);}
}
check('Real map build uses all authored prop factories', () => {
  map.buildMap();
  assert.equal(map.wave31Props.length, 300);
  assert(map.wave31Props.every(prop => prop.mesh));
  return {props:map.wave31Props.length,colliders:map.colliders.length};
});
check('Every industrial prop has a reachable placement inside the authored boundary', () => {
  assert.equal(map.wave31Props.length, 300);
  const deferred=map.wave31Props.filter(prop=>prop.placementStatus!=='placed');
  assert.equal(deferred.length,0,'Unplaced props: '+deferred.map(prop=>prop.id).join(','));
  for(const prop of map.wave31Props){
    assert(prop.placementBounds && prop.interactionPoint, prop.id+' lacks geometry/access evidence');
    const b=prop.placementBounds;
    assert(b.minX > -73.4 && b.maxX < 73.4 && b.minZ > -73.4 && b.maxZ < 73.4,prop.id+' outside movement bounds');
    assert(Math.hypot(prop.x-prop.interactionPoint.x,prop.z-prop.interactionPoint.z)<=6,prop.id+' access exceeds authored E range');
  }
  return {props:map.wave31Props.length,sectors:[...new Set(map.wave31Props.map(prop=>prop.placementSector))]};
});
check('Industrial occupied bounds do not overlap each other', () => {
  for(let i=0;i<map.wave31Props.length;i++)for(let j=i+1;j<map.wave31Props.length;j++){
    const a=map.wave31Props[i],b=map.wave31Props[j],x=a.placementBounds,z=b.placementBounds;
    assert(x&&z,'Placement bounds missing');
    assert(!(x.minX<z.maxX&&x.maxX>z.minX&&x.minZ<z.maxZ&&x.maxZ>z.minZ),a.id+' overlaps '+b.id);
  }
});
check('Reserved interaction routes remain clear with every stage5 prop active', () => {
  game.currentStageIndex=5;map.syncPropsToStage(5);
  let samples=0;
  for(const prop of map.wave31Props){
    assert(prop.interactionRoute?.length,prop.id+' lacks a reserved route');
    for(let i=1;i<prop.interactionRoute.length;i++){
      const a=prop.interactionRoute[i-1],b=prop.interactionRoute[i];
      for(let t=0;t<=1;t+=.25){const x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;
        assert(!map.checkCollision(x,z,2),prop.id+' adult access route blocked at '+x+','+z);samples++;}
    }
  }
  game.currentStageIndex=4;map.syncPropsToStage(4);
  return {samples,padding:2,scope:'Drone/Warrior and Runner clearance, not every giant morphology'};
});
check('Every room anchor has an actual A-star path from the central circulation hub', () => {
  game.currentStageIndex=5;map.syncPropsToStage(5);
  const records=[];
  for(const anchor of map.recoveryRoomAnchors){
    const route=map.findPath(0,0,anchor.x,anchor.z,{padding:2});
    const reached=route.length>0&&Math.hypot(route.at(-1).x-anchor.x,route.at(-1).z-anchor.z)<1.1;
    records.push({id:anchor.id,routePoints:route.length,reached});
  }
  assert(records.every(record=>record.reached),JSON.stringify(records));
  game.currentStageIndex=4;map.syncPropsToStage(4);
  return records;
});
check('Every prop access point has a real A-star route for the adult envelope',()=>{
  game.currentStageIndex=5;map.syncPropsToStage(5);
  const failures=[];
  for(const prop of map.wave31Props){
    assert(prop.accessOrigin,prop.id+' access origin missing');
    const a=prop.accessOrigin,b=prop.interactionPoint;
    const route=map.findPath(a.x,a.z,b.x,b.z,{padding:2});
    const alreadyThere=Math.hypot(a.x-b.x,a.z-b.z)<.05&&!map.checkCollision(b.x,b.z,2);
    if(!alreadyThere&&(!route.length||Math.hypot(route.at(-1).x-b.x,route.at(-1).z-b.z)>1.1))failures.push(prop.id);
  }
  assert.equal(failures.length,0,'Runtime paths failed: '+failures.join(','));
  game.currentStageIndex=4;map.syncPropsToStage(4);
  return {routes:map.wave31Props.length,padding:2};
});
check('Every local access origin connects to a real station room at adult clearance',()=>{
  game.currentStageIndex=5;map.syncPropsToStage(5);
  const origins=[...new Map(map.wave31Props.filter(prop=>prop.accessOrigin).map(prop=>[
    `${prop.accessOrigin.x}:${prop.accessOrigin.z}`,prop.accessOrigin])).values()];
  assert(origins.length>0);
  for(const origin of origins){
    const connected=map.recoveryRoomAnchors.some(anchor=>{
      if(Math.hypot(origin.x-anchor.x,origin.z-anchor.z)<.05)return !map.checkCollision(origin.x,origin.z,2);
      const route=map.findPath(origin.x,origin.z,anchor.x,anchor.z,{padding:2});
      return route.length>0&&Math.hypot(route.at(-1).x-anchor.x,route.at(-1).z-anchor.z)<1.1;
    });
    assert(connected,`Disconnected local access origin ${origin.x},${origin.z}`);
  }
  game.currentStageIndex=4;map.syncPropsToStage(4);
  return {origins:origins.length,roomAnchors:map.recoveryRoomAnchors.length,padding:2};
});
check('Door leaves, frames and collision states match the widened openings',()=>{
  for(const door of map.blastDoors){
    const sideOpening=door.id==='door_airlock_est';
    assert.equal(door.width,sideOpening?2:8.8);
    if(sideOpening)assert.equal(door.depth,6.4);
    const jambs=map.colliders.filter(c=>c.isDoorFrame&&c.mesh?.name.startsWith(door.id+'_jamb'));
    assert.equal(jambs.length,2,door.id+' physical jambs missing');
    const old={x:player.x,z:player.z};player.x=door.x+(sideOpening?0:4);player.z=door.z+(sideOpening?3.6:0);
    assert.equal(map.setBlastDoorState(door,false,true),false,'Door closes on actor outside old3.4m check');
    player.x=0;player.z=0;game.humans=[];
    assert.equal(map.setBlastDoorState(door,false,true),true);
    const dx=sideOpening?4:0,dz=sideOpening?0:4;
    assert.equal(map.hasLineOfSight(door.x-dx,door.z-dz,door.x+dx,door.z+dz),false);
    assert(map.colliders.includes(door.collider));
    assert.equal(map.setBlastDoorState(door,true,true),true);
    assert(!map.colliders.includes(door.collider));
    player.x=old.x;player.z=old.z;
  }
});
check('Future-stage colliders cannot block sight or segment queries', () => {
  const isolated=new MapClass();
  isolated.colliders=[{minX:-1,maxX:1,minZ:-2,maxZ:2,disabled:true}];
  assert.equal(isolated.hasLineOfSight(-3,0,3,0),true);
  assert.equal(isolated.checkCollision(0,0),false);
  isolated.colliders[0].disabled=false;
  assert.equal(isolated.hasLineOfSight(-3,0,3,0),false);
  assert.equal(isolated.checkCollision(0,0),true);
});
check('Stage-gated props cannot trigger or queue chains while hidden', () => {
  const prop=map.wave31Props.find(p=>p.minStage===5);
  assert(prop,'Actual stage5 prop required'); map.syncPropsToStage(4);
  const before=map.chainQueue.length;
  assert.equal(prop.mesh.visible,false); assert.equal(prop.collider.disabled,true);
  assert.equal(map.triggerWave31Prop(prop),false);assert.equal(map.triggerWave31Prop(prop,true),false);
  assert.equal(prop.isTriggered,false);assert.equal(map.chainQueue.length,before);
  map.chainQueue.push({prop,delay:0});map.updateChainReaction(.1);
  assert.equal(prop.isTriggered,false,'Queued hidden prop activated');
  return {id:prop.id,minStage:prop.minStage};
});
check('Hidden active props cancel timers and do not animate or advertise an interaction', () => {
  const prop=map.wave31Props.find(p=>p.minStage===5);
  prop.isTriggered=true;prop.resetTimer=9;
  map.syncPropsToStage(4);
  assert.equal(prop.isTriggered,false);assert.equal(prop.resetTimer,0);
  const rotation=prop.mesh.rotation.y;map.updateWave31Props(.1);
  assert.equal(prop.mesh.rotation.y,rotation);
});
check('Distance-culling metadata cannot hide a newly unlocked gameplay prop',()=>{
  const begin=source.indexOf('    updatePropVisibility(target,'),end=source.indexOf('    screenToGround(',begin);
  assert(begin>0&&end>begin);
  const updateVisibility=vm.runInNewContext('({'+source.slice(begin,end)+'}).updatePropVisibility',{window:{innerWidth:1440}});
  const prop=map.wave31Props.find(p=>p.minStage===5),position={x:prop.x,z:prop.z};
  game.currentStageIndex=4;map.syncPropsToStage(4);
  const fixtureRenderer={propsGroup:{children:[prop.mesh]},isSoftwareRenderer:false};
  updateVisibility.call(fixtureRenderer,{x:position.x+200,z:position.z+200});
  game.currentStageIndex=5;map.syncPropsToStage(5);
  updateVisibility.call(fixtureRenderer,position);
  assert.equal(prop.mesh.visible,true);assert.equal(prop.mesh.userData.hiveGameplayVisible,true);
  assert.equal(map.isPropActiveForStage(prop),true);
});
check('Missing or stale precompiled plans fail closed without running the authoring search',()=>{
  const original={plan:context.window.HiveIndustrialLayout,authoring:context.window.HiveIndustrialLayoutAuthoring};
  const isolated=new MapClass();isolated.industrialCirculationPrepared=true;
  isolated.wave31Props=[{id:'fixture_invalid_plan',mesh:new T.Group(),minStage:1,placementStatus:'pending'}];
  try{
    context.window.HiveIndustrialLayoutAuthoring=false;context.window.HiveIndustrialLayout=null;
    isolated.layoutIndustrialProps();
    assert.equal(isolated.industrialPlacementMetrics.mode,'rejected-plan');
    assert.equal(isolated.wave31Props[0].placementStatus,'deferred-missing-layout');
    assert.equal(isolated.isPropActiveForStage(isolated.wave31Props[0]),false);
    context.window.HiveIndustrialLayout={schema:'outdated'};
    isolated.layoutIndustrialProps();
    assert.equal(isolated.wave31Props[0].placementStatus,'deferred-stale-layout');
  }finally{context.window.HiveIndustrialLayout=original.plan;context.window.HiveIndustrialLayoutAuthoring=original.authoring;}
});
check('Compiled plans validate actual factory bounds and distinct station departments',()=>{
  const isolated=new MapClass(),mesh=new T.Mesh(new T.BoxGeometry(.5,1,.5));
  const prop={id:'fixture_geometry_plan',factory:'fixture_box',mesh,hx:.25,hz:.25,minStage:1};
  isolated.wave31Props=[prop];
  const anchors=isolated.getIndustrialLayoutSectors().map(sector=>({id:`recovery_${sector.id}`,sector:sector.id,x:sector.x,z:sector.z}));
  const record={id:prop.id,factory:prop.factory,minStage:1,x:40,z:10,sector:'engineering',preferredSector:'engineering',
    localBounds:{minX:-.25,maxX:.25,minZ:-.25,maxZ:.25,groundY:.5},
    accessOrigin:{x:35,z:10},interactionPoint:{x:35,z:10},route:[{x:35,z:10}]};
  const plan={schema:'hive-industrial-layout-v1',version:1,clearance:2,boundary:73.4,anchors,records:[record]};
  assert.equal(isolated.applyIndustrialLayoutPlan({...plan,records:[{...record,localBounds:{...record.localBounds,maxX:1}}]}),false);
  assert.equal(isolated.applyIndustrialLayoutPlan({...plan,anchors:Array(8).fill(anchors[0])}),false);
  assert.equal(isolated.applyIndustrialLayoutPlan({...plan,records:[{...record,sector:'medical'}]}),false);
  assert.equal(isolated.colliders.length,0,'Rejected plan installed partial collisions');
  assert.equal(isolated.applyIndustrialLayoutPlan(plan),true);
  assert.equal(prop.placementStatus,'placed');
});
check('UA571 sentries neither animate nor spend ammunition before their phase and fire after unlock',()=>{
  const isolated=new MapClass(),mesh=new T.Group();
  const turret={id:'fixture_ua571_turret',minStage:4,mesh,x:0,z:0,angle:0,ammo:18,burstCooldown:0,
    isDestroyed:false,isOpticsBlinded:true,blindTimer:5};
  turret.collider={minX:-1,maxX:1,minZ:-1,maxZ:1,mesh,turretRef:turret};
  isolated.sentryTurrets=[turret];isolated.colliders=[turret.collider];
  const old={x:player.x,z:player.z,damage:player.takeDamage,audio:context.audioManager,stage:game.currentStageIndex};
  let damage=0,shots=0;
  try{
    player.x=0;player.z=5;player.takeDamage=value=>damage+=value;
    context.audioManager=new Proxy({}, {get:(_target,key)=>key==='playSentryBurst'?()=>shots++:noop});
    game.currentStageIndex=3;isolated.syncPropsToStage(3);isolated.updateSentryTurrets(.1);
    assert.equal(turret.ammo,18);assert.equal(shots,0);assert.equal(damage,0);
    assert.equal(turret.blindTimer,5);assert.equal(mesh.visible,false);assert.equal(turret.collider.disabled,true);
    game.currentStageIndex=4;isolated.syncPropsToStage(4);
    turret.isOpticsBlinded=false;turret.burstCooldown=0;
    isolated.updateSentryTurrets(.1);
    assert.equal(mesh.visible,true);assert.equal(turret.collider.disabled,false);
    assert.equal(turret.ammo,12);assert.equal(shots,1);assert.equal(damage,12);
  }finally{
    player.x=old.x;player.z=old.z;player.takeDamage=old.damage;context.audioManager=old.audio;game.currentStageIndex=old.stage;
  }
});
check('Coolant flow indicator remains physically grounded through idle and triggered light phases',()=>{
  const token="{ id: 'nostromo_subdeck_coolant_pipe_junction_1'",begin=source.indexOf(token);
  assert(begin>0);
  const definition=source.slice(begin,source.indexOf('\n',begin)).trim().replace(/,$/,'');
  const prop=vm.runInNewContext('('+definition+')');
  prop.mesh=factory[prop.factory]();prop.x=0;prop.z=0;prop.placementStatus='placed';
  const isolated=new MapClass();isolated.wave31Props=[prop];
  const anim=prop.mesh.children.find(child=>child.name===prop.anim),restPosition=anim.position.clone(),rootPosition=prop.mesh.position.clone();
  const oldPerformance=context.performance,oldStage=game.currentStageIndex;
  const samples=[];
  try{
    game.currentStageIndex=5;
    for(const triggered of [false,true]){
      prop.isTriggered=triggered;prop.resetTimer=10;
      for(let phase=0;phase<=32;phase++){
        context.performance={now:()=>phase*Math.PI/16/(.003*2.2)};
        isolated.updateWave31Props(1/60);prop.mesh.updateMatrixWorld(true);
        const box=new T.Box3().setFromObject(prop.mesh);
        assert(Math.abs(box.min.y)<1e-6,`Coolant indicator crossed the floor at phase${phase}, triggered=${triggered}: ${box.min.y}`);
        assert(anim.position.equals(restPosition),'Fixed flow indicator moved mechanically');
        assert(prop.mesh.position.equals(rootPosition),'Root was moved to conceal an animation defect');
        samples.push({triggered,phase,minY:box.min.y,emissive:prop.emissiveMats.map(entry=>entry.m.emissiveIntensity)});
      }
    }
    assert(samples.some(sample=>sample.emissive.some(value=>Math.abs(value-samples[0].emissive[0])>1e-3)),'Light indicator no longer pulses');
  }finally{context.performance=oldPerformance;game.currentStageIndex=oldStage;}
  return {scope:'Actual factory and updateWave31Props with labelled phase-clock fixture, not native rendering',samples:samples.length,minY:Math.min(...samples.map(sample=>sample.minY)),maxY:Math.max(...samples.map(sample=>sample.minY))};
});
check('Active prop progression retains authored damage, range and ID', () => {
  game.currentStageIndex=5;
  map.syncPropsToStage(5);
  const prop=map.wave31Props.find(p=>p.minStage===5);
  assert.equal(prop.mesh.visible,true);assert.equal(prop.collider.disabled,false);
  const hp=[];game.humans=[{x:prop.x,z:prop.z,takeDamage:d=>hp.push(d)}];
  assert.equal(map.triggerWave31Prop(prop),true);
  assert.equal(hp[0],prop.damage);assert.equal(map.triggerWave31Prop(prop),false);
  return {id:prop.id,damage:prop.damage,radius:prop.radius};
});
const report={scope:'Actual StationMap class and model factory, texture/DOM/audio fixtures, not native or human QA',
  sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),selectedGroup:groupFilter||null,groups:results.length,
  passed:results.filter(r=>r.passed).length,results,placementMetrics:map.industrialPlacementMetrics,
  recoveryRoomAnchors:map.recoveryRoomAnchors,baseRoomAccess:map.industrialBaseAccess,
  legacyRelocations:map.legacyPropRelocations,legacyDiagnostics:map.industrialCirculationDiagnostics,circulationMetrics:map.industrialCirculationMetrics,
  rootConnections:map.industrialRootConnections,
  baseColliders:map.colliders.filter(c=>!c.isWave31Prop).map(c=>({minX:c.minX,maxX:c.maxX,minZ:c.minZ,maxZ:c.maxZ,
    refId:Object.values(c).find(value=>value&&typeof value==='object'&&value.id)?.id,
    meshName:c.mesh?.name,structural:!!c.isDoorFrame||!!c.mesh&&map.walls.includes(c.mesh)})),
  placements:map.wave31Props.map(p=>({id:p.id,factory:p.factory,authored:p.authoredPosition,x:p.x,z:p.z,sector:p.placementSector,preferredSector:p.preferredPlacementSector,
    status:p.placementStatus,bounds:p.placementBounds,localBounds:p.localPlacementBounds,accessOrigin:p.accessOrigin,route:p.interactionRoute,
    interactionPoint:p.interactionPoint,routePoints:p.interactionRoute?.length,minStage:p.minStage}))};
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9);
if(output){const target=path.resolve(root,output);assert(target.startsWith(path.join(root,'.tools')+path.sep));assert(!fs.existsSync(target),'Do not overwrite evidence');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');}
console.log(`${report.passed}/${report.groups} level coherence groups passed`);
process.exitCode=report.passed===report.groups?0:1;
