/* Compile the actual page scripts and exercise the two distinct incubator
 * dispatch paths. DOM, positions and action sinks are explicitly fixtures. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'src/game.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
let passed=0;
function check(name,run){run();passed++;console.log('PASS '+name);}
check('Every local script actually loaded by index.html compiles',()=>{
  const files=[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(m=>m[1].split('?')[0]);
  assert(files.length>5);
  for(const file of files){assert(!/^https?:/.test(file));new vm.Script(fs.readFileSync(path.join(root,file),'utf8'),{filename:file});}
  console.log('COMPILED '+files.length+' page scripts');
});
const stage=source.indexOf('  class StageDrone {'),start=source.indexOf('    interactWithNearbyProps() {',stage),
  end=source.indexOf('    executeSabotagePower() {',start);
assert(stage>0&&start>stage&&end>start);
const helperStart=source.indexOf('    isPropActiveForStage(prop) {'),
  helperEnd=source.indexOf('    syncPropsToStage(',helperStart);
assert(helperStart>0&&helperEnd>helperStart);
function fixture(medlab,transgenic){
  const calls=[],map={colliders:[],medlabIncubatorRacks:medlab,transgenicIncubators:transgenic,
    shatterIncubatorRack:h=>calls.push(['medlab',h]),ruptureTransgenicIncubator:h=>calls.push(['transgenic',h])};
  const context={stationMap:map,playerCreature:{x:0,z:0},showToast(){},window:{gameInstance:{currentStageIndex:4}},Math};
  const helpers=vm.runInNewContext('class PropProgressionFixture {'+source.slice(helperStart,helperEnd)+'}\nPropProgressionFixture.prototype;',context);
  map.isPropActiveForStage=helpers.isPropActiveForStage;
  map.getPropMinStage=helpers.getPropMinStage;
  map.canInteractWithProp=helpers.canInteractWithProp;
  const action=vm.runInNewContext('({'+source.slice(start,end)+'}).interactWithNearbyProps',context);
  return {calls,run:()=>action()};
}
check('The medlab rack still routes to shatterIncubatorRack',()=>{
  const rack={x:0,z:0,isShattered:false},f=fixture([rack],[]);
  assert.equal(f.run(),true);assert.equal(f.calls.length,1);assert.equal(f.calls[0][0],'medlab');assert.equal(f.calls[0][1],rack);
});
check('The distinct transgenic incubator routes to ruptureTransgenicIncubator',()=>{
  const tank={x:0,z:0,isRuptured:false},f=fixture([],[tank]);
  assert.equal(f.run(),true);assert.equal(f.calls.length,1);assert.equal(f.calls[0][0],'transgenic');assert.equal(f.calls[0][1],tank);
});
check('Existing dispatch priority and the 5.5 range are unchanged',()=>{
  const rack={x:0,z:0,isShattered:false},tank={x:0,z:0,isRuptured:false},first=fixture([rack],[tank]);
  assert.equal(first.run(),true);assert.equal(first.calls[0][0],'medlab');
  const edge=fixture([],[{x:5.5,z:0,isRuptured:false}]);assert.equal(edge.run(),true);
  const outside=fixture([],[{x:5.51,z:0,isRuptured:false}]);assert.equal(outside.run(),false);assert.equal(outside.calls.length,0);
});
check('Production progression helpers reject hidden or future incubators',()=>{
  for(const hidden of [{minStage:5},{placementStatus:'deferred-stale-layout'},{collider:{disabled:true}}]){
    const f=fixture([],[{x:0,z:0,isRuptured:false,...hidden}]);
    assert.equal(f.run(),false);assert.equal(f.calls.length,0);
  }
});
check('Render-distance culling is not a substitute for gameplay progression',()=>{
  const tank={x:0,z:0,isRuptured:false,minStage:4,mesh:{visible:false,userData:{hiveDistanceCulled:true}}},f=fixture([],[tank]);
  assert.equal(f.run(),true);assert.equal(f.calls[0][0],'transgenic');
});
console.log(passed+' boot contract groups passed');
