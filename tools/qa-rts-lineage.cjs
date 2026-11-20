#!/usr/bin/env node
'use strict';
// Compile the actual RTS stage. BiologicalCycleEntity mesh output is a labelled
// fixture; selection, resource spending and precursor ownership are real logic.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'src/game.js'),'utf8');
const begin=source.indexOf('  class StageHiveRTS {'),end=source.indexOf('  class GameMaster {',begin);
assert(begin>0&&end>begin);
const results=[];
function fixture(hosts=[]){
  const cycles=[],logs=[],toasts=[],sounds=[],window={gameInstance:{humans:hosts},HiveSystems:{vfx:{ring(){},burst(){}}}};
  class CycleFixture{constructor(config){Object.assign(this,config);cycles.push(this);}createMesh(){}}
  const Native=vm.runInNewContext(source.slice(begin,end)+'\nStageHiveRTS;',
    {window,console,Math,Date,BiologicalCycleEntity:CycleFixture,showToast:t=>toasts.push(t),
      audioManager:{playOvipositorLay:(x,z)=>sounds.push({x,z})}});
  const stage=Object.create(Native.prototype);
  Object.assign(stage,{biomass:120,queen:{x:1,z:2,attachedToOvipositor:true,isDestroyed:false},rtsUnits:[],incubationCycles:[],
    log:t=>logs.push(t),updateStats(){}});
  return {stage,hosts,cycles,logs,toasts,sounds};
}
function check(name,run){try{const detail=run();results.push({name,passed:true,detail});console.log('PASS '+name);}catch(error){results.push({name,passed:false,error:error.stack});console.error('FAIL '+name+': '+error.message);}}
const host=type=>({id:7,name:'prepared host',type,x:0,z:0,isCocooned:true,usedAsHost:false,hostEligibility:'viable',collapseForBurst(){}});
check('Human equipment does not change the biological host lineage',()=>{
  for(const type of ['scientist','marine','commando','smartgunner']){
    const h=host(type),f=fixture([h]);assert.equal(f.stage.findCompatibleHost('drone'),h,type);
    assert.equal(f.stage.findCompatibleHost('warrior'),null,'Armour must not be a Warrior genome');
  }
  const animal=host('labhound'),f=fixture([animal]);assert.equal(f.stage.findCompatibleHost('runner'),animal);
  assert.equal(f.stage.findCompatibleHost('drone'),null);
});
check('Warrior maturation requires an existing mature drone rather than an armoured person',()=>{
  const f=fixture([host('commando')]);assert.equal(f.stage.canBeginCycle('warrior',45),false);
  const drone={id:19,caste:'drone',x:2,z:3,isDestroyed:false,destroy(){this.isDestroyed=true;}};
  f.stage.rtsUnits.push(drone);assert.equal(f.stage.findSpecializationPrecursor('warrior'),drone);
  assert.equal(f.stage.canBeginCycle('warrior',45),true);
});
check('Actual Warrior request consumes its precursor and authored45 biomass exactly once',()=>{
  const f=fixture(),drone={id:19,caste:'drone',x:2,z:3,isDestroyed:false,destroy(){this.isDestroyed=true;}};
  f.stage.rtsUnits.push(drone);f.stage.spawnUnit('warrior',45);
  assert.equal(f.stage.biomass,75);assert.equal(drone.isDestroyed,true);assert.equal(f.stage.rtsUnits.length,0);
  assert.equal(f.cycles.length,1);assert.equal(f.cycles[0].duration,17);assert.equal(f.cycles[0].maxIntegrity,190);
  assert.equal(f.cycles[0].states[0],'COCON DE SPÉCIALISATION');
  f.stage.spawnUnit('warrior',45);assert.equal(f.cycles.length,1);assert.equal(f.stage.biomass,75);
  assert.deepEqual(f.sounds,[{x:1,z:2}]);
});
check('Invalid or free cycle requests cannot spend or allocate anything',()=>{
  for(const [caste,cost] of [['warrior',0],['warrior',-1],['drone',NaN],['not-a-caste',10]]){
    const f=fixture([host('scientist')]);f.stage.rtsUnits.push({caste:'drone',isDestroyed:false,destroy(){}});
    assert.equal(f.stage.canBeginCycle(caste,cost),false);f.stage.spawnUnit(caste,cost);
    assert.equal(f.stage.biomass,120);assert.equal(f.cycles.length,0);
  }
});
check('Queen attachment and exposed-cycle limit remain enforced',()=>{
  const f=fixture([host('scientist')]);f.stage.queen.attachedToOvipositor=false;
  assert.equal(f.stage.canBeginCycle('drone',30),false);f.stage.queen.attachedToOvipositor=true;
  f.stage.incubationCycles=[{isActive:true},{isActive:true},{isActive:true}];
  assert.equal(f.stage.canBeginCycle('drone',30),false);
});
const report={scope:'Real RTS stage logic; prepared hosts and cycle rendering sink, not a native cycle playthrough',sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),groups:results.length,passed:results.filter(r=>r.passed).length,results};
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9);
if(output){const target=path.resolve(root,output);assert(target.startsWith(path.join(root,'.tools')+path.sep)&&!fs.existsSync(target));fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');}
console.log(`${report.passed}/${report.groups} RTS lineage groups passed`);process.exitCode=report.passed===report.groups?0:1;
