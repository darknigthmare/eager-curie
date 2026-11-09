/* Production StationMap and VFXManager regressions. Node uses the real vendored
 * Three.js. Actor damage/audio, scene startup and simulation ticks are explicit
 * fixtures; this is neither native rendering nor a human playthrough.
 * Run: node tools/qa-mortar-lifecycle.cjs
 * Immutable defect reproduction:
 * git show 7fd6c46:src/game.js | node tools/qa-mortar-lifecycle.cjs --baseline --source -
 * Optional --output .tools/unique-proof.json never overwrites earlier evidence.
 * Whole-app syntax/startup and native rendering require their separate checks. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const T=require('../assets/vendor/three.r128.min.js');
const root=path.resolve(__dirname,'..');
const options={};
for(let i=2;i<process.argv.length;i++){
  if(process.argv[i]==='--baseline')options.baseline=true;
  else if(process.argv[i]==='--source'||process.argv[i]==='--output')options[process.argv[i].slice(2)]=process.argv[++i];
  else throw Error('Unknown option '+process.argv[i]);
}
const gameSource=options.source==='-'?fs.readFileSync(0,'utf8'):
  fs.readFileSync(options.source||path.join(root,'src/game.js'),'utf8');
const systemsSource=fs.readFileSync(path.join(root,'src/game-systems.js'),'utf8');
const hash=text=>crypto.createHash('sha256').update(text).digest('hex');
const report={scope:__filename+' — real production methods with labelled Node fixtures',
  sourceSha256:hash(gameSource),systemsSha256:hash(systemsSource),checks:[],baseline:!!options.baseline};
function extract(source,name,endMarker,context){
  const begin=source.indexOf('  class '+name+' {'),end=source.indexOf(endMarker,begin);
  assert(begin>=0&&end>begin,'Production '+name+' boundary changed');
  vm.runInContext(source.slice(begin,end)+'\nglobalThis.Extracted='+name+';',context);
  return context.Extracted;
}
function fixture({x=10,z=0,visual=true}={}){
  const events=[],hits=[],timers=[],visuals=[];
  const game={campaignActive:true,isRunning:true,isSystemPaused:false,currentStageIndex:4,currentStage:{}};
  const p={x,z,health:1000,form:'drone',adultCaste:'drone',isDefeated:false,
    isInVent:false,isCeilingProwling:false,mesh:new T.Group(),
    takeDamage(amount,attacker){hits.push({amount,attacker});this.health-=amount;}};
  p.mesh.position.set(x,0,z);
  const effects={
    burst:(...args)=>events.push({type:'burst',args}),ring:(...args)=>events.push({type:'ring',args}),
    floatingText:(...args)=>events.push({type:'text',args})
  };
  if(visual)effects.mortarWarning=spec=>{
    const handle={spec,cancelCalls:0,cancel(){this.cancelCalls++;}};
    visuals.push(handle);return handle;
  };
  const context={THREE:T,console,Math,Number,Set,Map,
    window:{gameInstance:game,HiveSystems:{vfx:effects}},playerCreature:p,
    rendererEngine:{scene:new T.Scene(),addScreenShake:(...args)=>events.push({type:'shake',args})},
    audioManager:{playMortarLaunchAndShrapnel:(...args)=>events.push({type:'launch-sfx',args}),
      playWelderSparks:(...args)=>events.push({type:'welder-sfx',args})},
    showToast(){},appendSensorLog(){},setTimeout(callback,delay){timers.push({callback,delay});return timers.length;}};
  vm.createContext(context);
  const NativeMap=extract(gameSource,'StationMap','  const stationMap =',context);
  const map=new NativeMap();context.stationMap=map;
  const mortar={id:'labelled-mortar-fixture',x:0,z:0,hp:80,shootCooldown:0,isDestroyed:false,mesh:new T.Group()};
  map.portableMortars=[mortar];
  return {game,p,map,mortar,events,hits,timers,visuals,context,
    launch(){map.updatePortableMortars(.05);return mortar.pendingShot;},
    advance(seconds){for(let t=0;t<seconds-1e-9;t+=.05)map.updatePortableMortars(Math.min(.05,seconds-t));},
    launchCalls(){return events.filter(e=>e.type==='launch-sfx').length;}};
}
function check(name,run){const detail=run();report.checks.push({name,passed:true,detail});console.log('PASS '+name);}
function save(){
  if(!options.output)return;
  const output=path.resolve(options.output);
  if(!output.startsWith(path.join(root,'.tools')+path.sep))throw Error('Proofs must remain inside local .tools');
  if(fs.existsSync(output))throw Error('Refusing to overwrite an earlier proof');
  fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
}
try{
  if(options.baseline){
    const f=fixture();f.map.updatePortableMortars(.05);
    assert.equal(f.timers.length,1,'The immutable baseline must use its original timeout');
    assert.equal(f.timers[0].delay,650);
    f.game.isSystemPaused=true;f.game.currentStage={replacement:true};f.mortar.isDestroyed=true;
    f.timers[0].callback();
    assert.equal(f.p.health,952,'Defect must be reproduced, not inferred from source text');
    report.status='defect_reproduced';report.defect={damageAfterPauseAndStageReplacement:f.hits[0].amount,
      remainingHealth:f.p.health,wallDelayMs:f.timers[0].delay,
      note:'Destroyed-launcher continuation alone is not a defect; pause/new-stage impact is.'};
    save();console.log(JSON.stringify(report,null,2));
  }else{
    check('Launch commits .65 simulated seconds, a fixed aim and no immediate hit or wall timer',()=>{
      const f=fixture(),shot=f.launch();assert(shot);assert.equal(shot.remaining,.65);
      assert.equal(shot.targetX,10);assert.equal(shot.targetZ,0);assert.equal(f.hits.length,0);assert.equal(f.timers.length,0);
      assert.equal(f.mortar.shootCooldown,4.8);assert.equal(f.launchCalls(),1);assert.equal(f.visuals.length,1);
      assert.equal(f.visuals[0].spec.duration,.65);assert.equal(f.visuals[0].spec.radius,5.5);
      assert.equal(typeof f.visuals[0].spec.onImpact,'undefined');return {remaining:shot.remaining,cooldown:f.mortar.shootCooldown};
    });
    check('Pause freezes pending time, cooldown, damage, sound and warning ownership',()=>{
      const f=fixture(),shot=f.launch();f.advance(.2);f.game.isSystemPaused=true;
      const before={remaining:shot.remaining,cooldown:f.mortar.shootCooldown,events:f.events.length};f.advance(10);
      assert.equal(shot.remaining,before.remaining);assert.equal(f.mortar.shootCooldown,before.cooldown);
      assert.equal(f.events.length,before.events);assert.equal(f.hits.length,0);assert.equal(f.visuals[0].cancelCalls,0);
      f.game.isSystemPaused=false;f.advance(.45);assert.equal(f.hits.length,1);assert.equal(f.hits[0].amount,48);
      assert.equal(f.visuals[0].cancelCalls,1);return before;
    });
    check('Impact occurs exactly once at .65, with the authored48 damage and impact point',()=>{
      const f=fixture(),shot=f.launch();assert.equal(f.map.resolvePortableMortarShot(f.mortar,shot),false);
      f.advance(.64);assert.equal(f.hits.length,0);f.advance(.01);
      assert.equal(f.hits.length,1);assert.equal(f.p.health,952);assert.equal(f.mortar.pendingShot,null);
      const burst=f.events.find(e=>e.type==='burst');assert.deepEqual(burst.args.slice(0,2),[10,0]);
      assert.equal(f.map.resolvePortableMortarShot(f.mortar,shot),false);assert.equal(f.hits.length,1);
      f.advance(1);assert.equal(f.hits.length,1);assert.equal(f.visuals[0].cancelCalls,1);
    });
    check('New shots retain the4.8-second cadence instead of firing on every update',()=>{
      const f=fixture();f.launch();f.advance(4.75);assert.equal(f.launchCalls(),1);f.advance(.05);
      assert.equal(f.launchCalls(),2);assert(f.mortar.pendingShot);assert.equal(f.hits.length,1);
    });
    check('Range and launch exposure retain the existing7..26/vent/ceiling contract',()=>{
      for(const [distance,allowed]of [[6.999,false],[7,true],[26,true],[26.001,false]]){
        const f=fixture({x:distance});f.launch();assert.equal(!!f.mortar.pendingShot,allowed,'distance '+distance);
      }
      for(const flag of ['isInVent','isCeilingProwling']){
        const f=fixture();f.p[flag]=true;f.launch();assert.equal(f.mortar.pendingShot,undefined);assert.equal(f.launchCalls(),0);
      }
    });
    check('Movement can evade the fixed ground aim; the5.5 blast radius remains inclusive',()=>{
      for(const [offset,hit]of [[5.5,true],[5.5001,false],[10,false]]){
        const f=fixture();const shot=f.launch();f.p.x+=offset;f.p.mesh.position.x=f.p.x;f.advance(.65);
        assert.equal(shot.targetX,10);assert.equal(f.hits.length,hit?1:0,'offset '+offset);
        assert.deepEqual(f.events.find(e=>e.type==='burst').args.slice(0,2),[10,0]);
      }
    });
    check('Destroying a launcher stops future shots but does not disarm an already-fired shell',()=>{
      const f=fixture();f.launch();f.map.destroyPortableMortar(f.mortar,80);assert(f.mortar.isDestroyed);
      f.advance(.65);assert.equal(f.hits.length,1);f.advance(10);assert.equal(f.launchCalls(),1);
      assert.equal(f.visuals[0].cancelCalls,1);
    });
    check('Game, stage, actor and mortar ownership changes cancel without affecting a replacement',()=>{
      const changes={
        game:f=>{f.context.window.gameInstance={...f.game};},
        stage:f=>{f.game.currentStage={newStage:true};},stageIndex:f=>{f.game.currentStageIndex=5;},
        mesh:f=>{f.p.mesh=new T.Group();},form:f=>{f.p.form='chestburster';},caste:f=>{f.p.adultCaste='warrior';},
        player:f=>{f.context.playerCreature={...f.p,mesh:new T.Group()};},
        removed:f=>{f.map.portableMortars.splice(0);},arrayReplaced:f=>{f.map.portableMortars=[f.mortar];},
        dead:f=>{f.p.health=0;},defeated:f=>{f.p.isDefeated=true;},
        campaignStopped:f=>{f.game.campaignActive=false;},notRunning:f=>{f.game.isRunning=false;}
      };
      for(const [name,change]of Object.entries(changes)){
        const f=fixture();const shot=f.launch();change(f);f.advance(.7);
        assert.equal(f.hits.length,0,name);assert.equal(shot.visual?.cancelCalls??f.visuals[0].cancelCalls,1,name);
        assert.equal(f.mortar.pendingShot,null,name);
      }
      return {cases:Object.keys(changes)};
    });
    check('Stale ownership is cleaned while paused without progressing a valid paused shot',()=>{
      const f=fixture();f.launch();f.game.isSystemPaused=true;f.game.currentStage={replacement:true};
      f.map.updatePortableMortars(.05);assert.equal(f.hits.length,0);assert.equal(f.mortar.pendingShot,null);
      assert.equal(f.visuals[0].cancelCalls,1);
    });
    check('Retained API references cannot resolve in pause or erase a replacement shot',()=>{
      const f=fixture(),shot=f.launch();shot.remaining=0;f.game.isSystemPaused=true;
      assert.equal(f.map.resolvePortableMortarShot(f.mortar,shot),false);assert.equal(f.hits.length,0);
      f.game.isSystemPaused=false;const replacement={sentinel:true};f.mortar.pendingShot=replacement;
      f.map.cancelPortableMortarShot(f.mortar,shot);assert.equal(f.mortar.pendingShot,replacement);
      assert.equal(f.visuals[0].cancelCalls,1);assert.equal(f.map.resolvePortableMortarShot(f.mortar,shot),false);
    });
    check('Invalid and zero deltas neither launch nor progress, and large deltas are bounded',()=>{
      const f=fixture();for(const dt of [NaN,Infinity,-1,0])f.map.updatePortableMortars(dt);
      assert.equal(f.launchCalls(),0);const shot=f.launch();const before=shot.remaining;
      for(const dt of [NaN,Infinity,-1,0])f.map.updatePortableMortars(dt);
      assert.equal(shot.remaining,before);f.map.updatePortableMortars(20);
      assert(Math.abs(shot.remaining-(before-.05))<1e-9);assert.equal(f.hits.length,0);
    });
    check('Missing optional visuals cannot advance damage or resolve it twice',()=>{
      for(const visual of [false,true]){
        const f=fixture({visual});f.launch();if(visual)f.visuals[0].spec.onImpact?.();
        assert.equal(f.hits.length,0);f.advance(.65);assert.equal(f.hits.length,1);
      }
    });

    // Real VFXManager, real Three geometry and explicit game/scene fixtures.
    const context={THREE:T,console,Math,Number,window:{gameInstance:{isSystemPaused:false}}};vm.createContext(context);
    const VFX=extract(systemsSource,'VFXManager','  // =============================================================\n  // CAMPAIGN UI',context);
    function visualFixture(game={isSystemPaused:false}){
      context.window.gameInstance=game;
      const vfx=new VFX(),scene=new T.Scene(),disposals=[];
      vfx.init(scene,object=>{
        object.traverse(child=>{
          if(child.geometry){child.geometry.dispose();disposals.push(child.geometry);}
          for(const mat of Array.isArray(child.material)?child.material:[child.material])if(mat){mat.dispose();disposals.push(mat);}
        });object.parent?.remove(object);
      });
      return {vfx,scene,disposals,game:context.window.gameInstance};
    }
    check('Actual VFX keeps a fixed target marker and a finite elevated shell arc under the ceiling',()=>{
      const f=visualFixture();let valid=true;
      const handle=f.vfx.mortarWarning({startX:0,startZ:0,targetX:10,targetZ:0,duration:.65,radius:5.5,isValid:()=>valid});
      assert.equal(typeof handle.cancel,'function');assert.equal(f.vfx.effects.length,1);
      const effect=f.vfx.effects[0];assert.equal(effect.mortarWarning,true);assert.equal(effect.projectile,undefined);
      assert.equal(effect.onImpact,undefined);assert.equal(effect.warning.name,'mortar_impact_warning');
      for(const resource of effect.resources)resource.addEventListener('dispose',()=>f.disposals.push(resource));
      const warning=effect.warning.position.clone();let maxY=-Infinity;
      for(let i=0;i<12;i++){
        f.vfx.update(.05);const y=effect.shell.position.y;assert(Number.isFinite(y));maxY=Math.max(maxY,y);
        assert(effect.warning.position.equals(warning),'warning aim must not home');
      }
      assert(maxY>1.5&&maxY<6.12);handle.cancel();assert.equal(f.scene.children.length,0);assert.equal(f.vfx.effects.length,0);
      const disposed=f.disposals.length;assert.equal(disposed,5);assert.equal(new Set(f.disposals).size,5);
      handle.cancel();assert.equal(f.disposals.length,disposed,'cancel is idempotent');
      return {maxY,disposed};
    });
    check('Actual VFX pause freezes transforms/age and lifecycle invalidation cancels without impact',()=>{
      const f=visualFixture();let valid=true;
      f.vfx.mortarWarning({startX:0,startZ:0,targetX:10,targetZ:0,duration:.65,radius:5.5,isValid:()=>valid});
      f.vfx.update(.1);const effect=f.vfx.effects[0],position=effect.shell.position.clone(),age=effect.age;
      f.game.isSystemPaused=true;f.vfx.update(1);assert(effect.shell.position.equals(position));assert.equal(effect.age,age);
      valid=false;f.vfx.update(.1);assert.equal(f.vfx.effects.length,0);assert.equal(f.scene.children.length,0);f.game.isSystemPaused=false;
    });
    check('Actual reduced-motion mode preserves a static warning and never resolves a shot',()=>{
      const f=visualFixture();let valid=true;
      f.vfx.setReducedMotion(true);
      const handle=f.vfx.mortarWarning({startX:0,startZ:0,targetX:10,targetZ:0,duration:.65,radius:5.5,isValid:()=>valid});
      assert(handle);const effect=f.vfx.effects[0];assert(effect.warning.visible);assert(!effect.shell.visible);
      const before=effect.warning.position.clone();f.vfx.update(.3);assert(effect.warning.position.equals(before));
      f.vfx.setReducedMotion(false);assert(effect.shell.visible);f.vfx.setReducedMotion(true);
      assert(f.vfx.effects.includes(effect));assert(effect.warning.visible);assert(!effect.shell.visible);
      f.vfx.clear(true);assert.equal(f.scene.children.length,0);assert.equal(f.vfx.effects.length,0);
      handle.cancel();
    });
    check('Actual VFX clear or settings changes cannot detonate the gameplay shot early',()=>{
      for(const action of ['clear','reduced-motion','invalidated']){
        const f=fixture(),visual=visualFixture(f.game);
        f.context.window.HiveSystems.vfx.mortarWarning=spec=>visual.vfx.mortarWarning(spec);
        const shot=f.launch();assert(shot);assert.equal(visual.vfx.effects.length,1);
        if(action==='clear')visual.vfx.clear(true);
        if(action==='reduced-motion')visual.vfx.setReducedMotion(true);
        if(action==='invalidated'){shot.visual.cancel();visual.vfx.update(.1);}
        assert.equal(f.hits.length,0,action);assert.equal(shot.remaining,.65);
        f.advance(.64);assert.equal(f.hits.length,0,action);f.advance(.01);assert.equal(f.hits.length,1,action);
        assert.equal(f.mortar.pendingShot,null);visual.vfx.clear();
      }
    });
    report.status='passed';console.log(`${report.checks.length} mortar lifecycle/VFX groups passed`);save();
  }
}catch(error){report.status='failed';report.failure=error.stack||String(error);save();throw error;}
