/* Shared contracts for advanced adult attacks. Cooldowns and in-flight
 * validation advance on the simulation clock, never on wall-clock timers. */
(function exposeAdvancedCombat(global) {
  'use strict';
  const stages = new WeakMap();
  const failures = new WeakMap();
  const playerMotions = new WeakMap();
  const point = p => !!p && Number.isFinite(p.x) && Number.isFinite(p.z);
  const distance = (a,b) => Math.hypot(a.x-b.x,a.z-b.z);
  const alive = target => point(target) && Number.isFinite(target.hp) && target.hp>0 &&
    !target.isIncapacitated && !target.isCocooned && !target.isDestroyed &&
    !target.isConsumedByCycle && !target.isEscaped;
  const vulnerable = target => alive(target) &&
    (target.hp<=Math.max(50,(Number(target.maxHp)||target.hp)*.35) || target.staggerTimer>0);
  function stageState(game) {
    const stage=game?.currentStage;
    if(!stage || typeof stage!=='object')return null;
    if(!stages.has(stage))stages.set(stage,{time:0,actors:new WeakMap(),motions:new Set(),jobs:new Set()});
    return stages.get(stage);
  }
  function actorState(state,player) {
    if(!state.actors.has(player))state.actors.set(player,{readyAt:Object.create(null),recoveryAt:0});
    return state.actors.get(player);
  }
  function active(player,game,{castes=null,allowCeiling=false,allowVent=false,allowSubfloor=false,pose=null}={}) {
    if(!player || !point(player) || player.form!=='drone' || !player.mesh ||
      player.isDefeated || !(player.health>0) || (!allowVent&&player.isInVent) || (!allowSubfloor&&player.isSubfloorProwling) ||
      player.isChrysalis || player.attachedHost || (!allowCeiling&&player.isCeilingProwling) ||
      !game?.campaignActive || !game.isRunning || game.isSystemPaused || game.currentStageIndex!==4)
      return false;
    const caste=player.adultCaste;
    if(pose==='ceiling'&&!player.isCeilingProwling || pose==='prowl'&&!player.isProwling ||
      pose==='wall'&&!player.isWallMimic ||
      pose==='submerged'&&!player.isSubmerged ||
      pose==='stealth'&&!player.isProwling&&!player.isCeilingProwling&&!player.isWallMimic ||
      pose==='vent'&&!player.isInVent&&!player.isSubfloorProwling)return false;
    // Generic adult abilities still reject an unknown/fallback morphology.
    if(castes ? !castes.includes(caste) : player.getAdultProfile?.()?.key!==caste)return false;
    return !!stageState(game);
  }
  function remaining(player,game,key) {
    const state=stageState(game);
    if(!state)return 0;
    const actor=actorState(state,player);
    return Math.max(0,(actor.readyAt[key]||0)-state.time,actor.recoveryAt-state.time);
  }
  function ready(player,game,key,options={}) {
    let message='';
    if(!active(player,game,options))message=game?.isSystemPaused?'Simulation en pause.':
      'Capacité indisponible pour cette morphologie ou cette situation.';
    else if(player.isLeaping)message='Un déplacement offensif est déjà en cours.';
    else if(remaining(player,game,key)>1e-7)message=`Récupération : ${remaining(player,game,key).toFixed(1)} s.`;
    failures.set(player,message);
    return !message;
  }
  function commit(player,game,key,seconds) {
    const state=stageState(game),actor=actorState(state,player);
    actor.readyAt[key]=state.time+Math.max(.35,Number(seconds)||0);
    actor.recoveryAt=state.time+.35;
  }
  function validTarget(game,map,origin,target,range) {
    return alive(target) && (game?.humans||[]).includes(target) && point(origin) &&
      distance(origin,target)<=range+.001 && !!map?.hasLineOfSight?.(origin.x,origin.z,target.x,target.z,.08);
  }
  function targets(game,map,origin,range) {
    return (game?.humans||[]).filter(target=>validTarget(game,map,origin,target,range));
  }
  function effectPath(map,origin,target,range) {
    if(!point(origin)||!point(target)||distance(origin,target)>range+.001)return false;
    if(Array.isArray(map?.colliders)&&typeof map.segmentIntersectsCollider==='function')return !map.colliders.some(c=>
      !Object.values(c).includes(target)&&map.segmentIntersectsCollider(origin.x,origin.z,target.x,target.z,c,.02));
    return !!map?.hasLineOfSight?.(origin.x,origin.z,target.x,target.z,.02);
  }
  function selectTarget(game,map,origin,preferred,range,filter=null) {
    if(preferred)return validTarget(game,map,origin,preferred,range)&&(!filter||filter(preferred))?preferred:null;
    return targets(game,map,origin,range).filter(h=>!filter||filter(h))
      .sort((a,b)=>distance(origin,a)-distance(origin,b))[0]||null;
  }
  function landingNear(player,map,target,range) {
    const controls=global.HiveGameplayControls;
    if(!controls)return null;
    const direction=Math.atan2(player.z-target.z,player.x-target.x);
    for(let i=0;i<12;i++) {
      const angle=direction+(i?Math.ceil(i/2)*(i%2?1:-1)*Math.PI/6:0);
      const candidate={x:target.x+Math.cos(angle)*1.6,z:target.z+Math.sin(angle)*1.6};
      const landing=controls.sweptDestination(map,player,candidate,{range,padding:.88});
      if(landing&&map.hasLineOfSight(landing.x,landing.z,target.x,target.z,.08))return landing;
    }
    return null;
  }
  function push(map,target,origin,force) {
    const controls=global.HiveGameplayControls;
    if(!controls || !point(target) || !point(origin))return false;
    const angle=Math.atan2(target.z-origin.z,target.x-origin.x);
    const destination=controls.sweptDestination(map,target,
      {x:target.x+Math.cos(angle)*force,z:target.z+Math.sin(angle)*force},
      {range:force+.001,padding:.35,truncate:true});
    if(!destination)return false;
    target.x=destination.x;target.z=destination.z;target.mesh?.position.set(target.x,0,target.z);
    return true;
  }
  function stopMotion(state,motion) {
    motion.cancelled=true;
    state.motions.delete(motion);
    const p=motion.player;
    if(playerMotions.get(p)===motion)playerMotions.delete(p);
    // Do not erase a replacement animation after a form/mesh change.
    if(p.leapComplete!==motion.complete)return;
    p.isLeaping=false;p.leapHost=null;p.leapComplete=null;
    p.mesh?.position.set(p.x,0,p.z);if(p.mesh)p.mesh.rotation.x=0;
  }
  function cancelMotion(player) {
    const motion=playerMotions.get(player);
    if(!motion)return false;
    stopMotion(motion.state,motion);return true;
  }
  function validateMotion(player,game) {
    const motion=playerMotions.get(player);
    if(!motion)return true;
    const controls=global.HiveGameplayControls;
    if(game!==motion.game || game?.currentStage!==motion.stage || game?.campaignActive===false ||
      game?.currentStageIndex!==4 || player.mesh!==motion.mesh ||
      player.adultCaste!==motion.caste || !player.isLeaping || player.isDefeated || player.health<=0 ||
      player.form!=='drone' || player.isChrysalis || player.attachedHost || player.isInVent ||
      player.isSubfloorProwling || !controls?.canStand(motion.map,player,.88) ||
      !controls.clearSegment(motion.map,player,motion.landing,.88)) {
      stopMotion(motion.state,motion);return false;
    }
    return true;
  }
  function beginMotion(player,game,map,key,spec,landing,onImpact,target=null) {
    const state=stageState(game),stage=game.currentStage,mesh=player.mesh,caste=player.adultCaste;
    const controls=global.HiveGameplayControls;
    const motion={player,game,state,map,landing,stage,mesh,caste,complete:null,cancelled:false};
    let finished=false;
    motion.complete=()=>{
      if(finished||motion.cancelled)return;finished=true;state.motions.delete(motion);
      if(playerMotions.get(player)===motion)playerMotions.delete(player);
      if(player.mesh===mesh && (!player.leapHost || player.leapHost===landing)) {
        player.isLeaping=false;player.mesh?.position.set(player.x,0,player.z);
        if(player.mesh)player.mesh.rotation.x=0;
      }
      if(game.currentStage!==stage || player.mesh!==mesh || player.adultCaste!==caste)return;
      if(!active(player,game,{...spec,pose:null}) || !controls.canStand(map,player,.88))return;
      if(target && !validTarget(game,map,player,target,2.8))return;
      onImpact(target);
    };
    player.startLeapTo(landing,motion.complete,{duration:spec.duration||Math.min(.72,.24+distance(player,landing)/22),
      arcHeight:spec.arcHeight??1.7,useFaceAnchor:false});
    if(!player.isLeaping || player.leapComplete!==motion.complete)return false;
    state.motions.add(motion);playerMotions.set(player,motion);commit(player,game,key,spec.cooldown);
    player.moveTarget=null;player.moveWaypoints=[];player.actionTarget=null;
    player.releaseDraggedHost?.('Le corps est relâché avant le déplacement offensif.');
    if(spec.dropCeiling){
      player.isCeilingProwling=false;
      if(player.detailedModel){player.detailedModel.rotation.x=0;player.detailedModel.position.y=0;}
    }
    player.triggerAttack?.(spec.action||'leap');
    return true;
  }
  function travel(player,game,map,key,spec,destination,onImpact) {
    if(!ready(player,game,key,spec))return false;
    const landing=global.HiveGameplayControls?.sweptDestination(map,player,destination,
      {range:spec.range,padding:.88});
    if(!landing || distance(player,landing)<.1){
      failures.set(player,'Trajectoire de bond bloquée ou arrivée trop proche.');return false;
    }
    return beginMotion(player,game,map,key,spec,landing,onImpact);
  }
  function leap(player,game,map,key,spec,preferred,onImpact) {
    if(!ready(player,game,key,spec))return false;
    const target=selectTarget(game,map,player,preferred,spec.range,spec.filter);
    if(!target){failures.set(player,`Aucune cible vivante visible à portée (${spec.range} m).`);return false;}
    const landing=landingNear(player,map,target,spec.range);
    if(!landing){failures.set(player,'Aucun point d’arrivée accessible : contournez l’obstacle.');return false;}
    return beginMotion(player,game,map,key,spec,landing,onImpact,target);
  }
  function contact(player,game,map,key,spec,preferred) {
    if(!ready(player,game,key,spec))return null;
    const target=selectTarget(game,map,player,preferred,spec.range,spec.filter);
    if(!target){failures.set(player,`Aucune cible vivante visible à portée (${spec.range} m).`);return null;}
    commit(player,game,key,spec.cooldown);player.triggerAttack?.('melee');
    return target;
  }
  function charge(player,game,map,key,spec,onImpact) {
    if(!ready(player,game,key,spec))return false;
    const controls=global.HiveGameplayControls,angle=player.mesh.rotation.y||0;
    const landing=controls?.sweptDestination(map,player,
      {x:player.x+Math.sin(angle)*spec.range,z:player.z+Math.cos(angle)*spec.range},
      {range:spec.range,padding:.88,truncate:true});
    if(!landing){failures.set(player,'Charge bloquée : aucun passage dégagé.');return false;}
    return beginMotion(player,game,map,key,spec,landing,()=>onImpact(landing));
  }
  function defer(player,game,seconds,callback,spec={}) {
    if(!active(player,game,spec) || typeof callback!=='function')return false;
    const state=stageState(game);
    const job={player,game,stage:game.currentStage,mesh:player.mesh,caste:player.adultCaste,
      origin:{x:player.x,z:player.z},due:state.time+Math.max(0,Number(seconds)||0),callback,spec};
    state.jobs.add(job);return job;
  }
  function schedule(player,game,key,spec,seconds,callback) {
    if(!ready(player,game,key,spec))return false;
    const job=defer(player,game,seconds,callback,spec);
    if(!job)return false;
    commit(player,game,key,spec.cooldown);player.triggerAttack?.(spec.action||'charging');
    return job;
  }
  function advanceClock(game,seconds) {
    if(!game?.campaignActive || !game.isRunning || game.isSystemPaused)return;
    const state=stageState(game);if(!state)return;
    state.time+=Math.max(0,Math.min(.1,Number(seconds)||0));
    for(const motion of [...state.motions]) {
      validateMotion(motion.player,game);
    }
    for(const job of [...state.jobs]) {
      if(job.due>state.time+1e-7)continue;
      state.jobs.delete(job);
      if(game.currentStage!==job.stage || job.player.mesh!==job.mesh || job.player.adultCaste!==job.caste ||
        !active(job.player,game,job.spec))continue;
      job.callback(job);
    }
  }
  global.HiveAdvancedCombat=Object.freeze({active,ready,remaining,commit,alive,vulnerable,validTarget,
    targets,effectPath,selectTarget,landingNear,push,leap,travel,cancelMotion,validateMotion,contact,charge,defer,schedule,advanceClock,
    pending:game=>stageState(game)?.jobs.size||0,failure:player=>failures.get(player)||''});
})(typeof window==='undefined'?globalThis:window);
