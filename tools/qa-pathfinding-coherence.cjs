#!/usr/bin/env node
'use strict';
// Unchanged production StationMap class. The small AABB corridors are explicit
// fixtures; no rendered level, human playthrough or performance claim.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'src/game.js'),'utf8');
const start=source.indexOf('  class StationMap {'),end=source.indexOf('  const stationMap = new StationMap();',start);
assert(start>0&&end>start,'Actual StationMap boundaries required');
const fixtureWindow={HiveSystems:{vfx:{effects:[]}},playerCreature:{}};
const classSource=source.slice(start,end),MapClass=vm.runInNewContext('('+classSource.trim()+')',{
  window:fixtureWindow,console,Math,performance});
const options={min:-10,max:10,padding:.1,step:2.5};
function fixture(colliders=[]){const map=new MapClass();map.colliders=colliders.map(col=>({...col}));return map;}
function observeGrids(map){const calls=[],original=map.findPathOnGrid;map.findPathOnGrid=function(...args){calls.push({...args[4]});return original.apply(this,args);};return calls;}
function verifyRoute(map,route,origin,{padding=.1,min=-10,max=10}={}){
  assert(Array.isArray(route));let previous=origin,samples=0;
  for(const point of route){
    assert(point&&[point.x,point.z].every(Number.isFinite),'Nonfinite route node');
    assert(point.x>=min&&point.x<=max&&point.z>=min&&point.z<=max,'Node outside bounded domain');
    assert.equal(map.checkCollision(point.x,point.z,padding),false,'Route node collides');
    assert.equal(map.hasLineOfSight(previous.x,previous.z,point.x,point.z,padding),true,'Route edge crosses a solid');
    const count=Math.max(1,Math.ceil(Math.hypot(point.x-previous.x,point.z-previous.z)/.1));
    for(let i=0;i<=count;i++){
      const t=i/count;assert.equal(map.checkCollision(previous.x+(point.x-previous.x)*t,previous.z+(point.z-previous.z)*t,padding),false,'Sampled edge penetrates a solid');samples++;
    }
    previous=point;
  }
  return {nodes:route.length,samples,last:{x:previous.x,z:previous.z}};
}
const results=[];
function check(name,run){try{const detail=run();results.push({name,passed:true,detail});console.log('PASS '+name);}catch(error){results.push({name,passed:false,error:error.stack||String(error)});console.error('FAIL '+name+': '+error.message);}}

check('Player ceiling or vent traversal never disables ground duct collisions for other actors',()=>{
  const map=fixture([{minX:-1,maxX:1,minZ:-1,maxZ:1,isDuctSplitter:true}]);
  for(const state of [{},{isInVent:true},{isCeilingProwling:true}]){
    fixtureWindow.playerCreature=state;
    assert.equal(map.checkCollision(0,0,.1),true);
    assert.equal(map.hasLineOfSight(-3,0,3,0,.1),false);
    assert.equal(map.findPath(0,0,4,0,options).length,0);
  }
  fixtureWindow.playerCreature={};
  return {states:3,scope:'Shared production geometry remains actor-independent'};
});
check('Direct clear route uses one coarse call without unnecessary refinement',()=>{
  const map=fixture(),calls=observeGrids(map),route=map.findPath(-8,-8,8,8,options);
  assert.equal(calls.length,1);assert.equal(calls[0].step,2.5);assert.equal(route.length,1);
  const proof=verifyRoute(map,route,{x:-8,z:-8},options);assert.equal(proof.last.x,8);assert.equal(proof.last.z,8);return {...proof,steps:calls.map(call=>call.step)};
});

check('A narrow L corridor rejects the coarse lattice and succeeds by one real1.25 refinement',()=>{
  const map=fixture([
    {minX:-10,maxX:.8,minZ:-10,maxZ:10},
    {minX:1.7,maxX:10,minZ:-10,maxZ:.8},
    {minX:-10,maxX:10,minZ:1.7,maxZ:10},
    {minX:-10,maxX:10,minZ:-10,maxZ:-9},
    {minX:9,maxX:10,minZ:.8,maxZ:1.7}
  ]),origin={x:1.25,z:-8},goal={x:8,z:1.25};
  assert.equal(map.checkCollision(origin.x,origin.z,.1),false);assert.equal(map.checkCollision(goal.x,goal.z,.1),false);
  assert.equal(map.hasLineOfSight(origin.x,origin.z,goal.x,goal.z,.1),false);
  const coarse=map.findPathOnGrid(origin.x,origin.z,goal.x,goal.z,options);assert.equal(coarse.length,0,'Coarse grid unexpectedly fits this prepared L');
  const calls=observeGrids(map),route=map.findPath(origin.x,origin.z,goal.x,goal.z,options);
  assert.equal(calls.length,2);assert.equal(calls[0].step,2.5);assert.equal(calls[1].step,1.25);
  assert(route.length>=2,'Real L route needs a turn');const proof=verifyRoute(map,route,origin,options);
  assert(Math.hypot(proof.last.x-goal.x,proof.last.z-goal.z)<=.05);
  return {fixture:'Free vertical x[.8,1.7],z[-9,1.7], horizontal z[.8,1.7],x[.8,9]; real AABB complement, padding.1',route,steps:calls.map(call=>call.step),...proof};
});

check('A thin full-span wall cannot be jumped by a coarse edge or refined route',()=>{
  const map=fixture([{minX:1.1,maxX:1.2,minZ:-10,maxZ:10}]);
  assert.equal(map.checkCollision(0,0,.1),false);assert.equal(map.checkCollision(2.5,0,.1),false);
  assert.equal(map.hasLineOfSight(0,0,2.5,0,.1),false);
  assert.equal(map.findPathOnGrid(0,0,2.5,0,options).length,0);
  const calls=observeGrids(map),route=map.findPath(0,0,2.5,0,options);
  assert.equal(route.length,0);assert.equal(calls.length,2);return {steps:calls.map(call=>call.step),route};
});

check('Disabled collider is ignored consistently by collision sight line and navigation',()=>{
  const map=fixture([{minX:1.1,maxX:1.2,minZ:-10,maxZ:10,disabled:true}]);
  assert.equal(map.checkCollision(1.15,0,.1),false);assert.equal(map.hasLineOfSight(0,0,2.5,0,.1),true);
  const calls=observeGrids(map),route=map.findPath(0,0,2.5,0,options);assert.equal(calls.length,1);
  return verifyRoute(map,route,{x:0,z:0},options);
});

check('A blocked target yields only a collision-clear approach, never the blocked destination',()=>{
  const map=fixture([{minX:4,maxX:6,minZ:-2,maxZ:2}]),origin={x:0,z:0},goal={x:5,z:0};
  assert.equal(map.checkCollision(goal.x,goal.z,.1),true);const route=map.findPath(origin.x,origin.z,goal.x,goal.z,options);
  assert(route.length>0,'Prepared blocked target should have a reachable safe approach');const proof=verifyRoute(map,route,origin,options);
  const distance=Math.hypot(proof.last.x-goal.x,proof.last.z-goal.z);assert(distance>.1&&distance<=4);
  return {...proof,target:goal,remainingDistance:distance,scope:'Approach point is explicitly not arrival at the blocked target'};
});

check('Invalid grid options are rejected before geometry/grid work in both entry points',()=>{
  const malformed=[{step:0},{step:NaN},{step:Infinity},{step:.5},{step:11},{padding:-1},{padding:NaN},{min:5,max:4},{min:-Infinity},{max:Infinity},{min:-71},{max:71}];
  let cases=0;
  for(const method of ['findPath','findPathOnGrid'])for(const bad of malformed){
    const map=fixture([{minX:1.1,maxX:1.2,minZ:-10,maxZ:10}]);let geometry=0;
    const checkCollision=map.checkCollision,los=map.hasLineOfSight;
    map.checkCollision=function(...args){geometry++;return checkCollision.apply(this,args);};
    map.hasLineOfSight=function(...args){geometry++;return los.apply(this,args);};
    const route=map[method](0,0,2.5,0,{...options,...bad});assert.equal(route.length,0,method+' accepted malformed options');
    assert.equal(geometry,0,'Invalid options entered collision/grid work');cases++;
  }
  return {cases,scope:'Guard is reached before any collision query/lattice allocation; no wall-clock benchmark'};
});

check('Nonfinite coordinates and an already-colliding start cannot invent a route',()=>{
  const map=fixture([{minX:-1,maxX:1,minZ:-1,maxZ:1}]);let cases=0;
  for(const method of ['findPath','findPathOnGrid']){
    for(const coordinate of [NaN,Infinity,-Infinity]){assert.equal(map[method](coordinate,0,8,8,options).length,0);cases++;}
    assert.equal(map[method](0,0,8,8,options).length,0);cases++;
  }
  return {cases};
});

check('Same-origin destination is valid only when its actual collision point is free',()=>{
  for(const method of ['findPath','findPathOnGrid']){
    const map=fixture(),origin={x:1.25,z:-8},route=map[method](origin.x,origin.z,origin.x,origin.z,options);
    assert.equal(route.length,1);const proof=verifyRoute(map,route,origin,options);assert.equal(proof.last.x,origin.x);assert.equal(proof.last.z,origin.z);
    map.colliders.push({minX:1,maxX:1.5,minZ:-8.5,maxZ:-7.5});assert.equal(map[method](origin.x,origin.z,origin.x,origin.z,options).length,0);
  }
});

const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const report={scope:'Actual production class, labelled AABB fixtures, real collision/LOS and all-route edge sampling; not native rendered gameplay',
  sourceSha256:hash(source),stationMapSha256:hash(classSource),groups:results.length,passed:results.filter(row=>row.passed).length,results};
const output=process.argv.find(arg=>arg.startsWith('--output='))?.slice(9);
if(output){const target=path.resolve(root,output);assert(target.startsWith(path.join(root,'.tools')+path.sep));assert(!fs.existsSync(target),'Do not overwrite earlier evidence');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');}
console.log(`${report.passed}/${report.groups} pathfinding coherence groups passed`);process.exitCode=report.passed===report.groups?0:1;
