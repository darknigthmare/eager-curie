/* Deterministic perception and bounded contact memory, independent of rendering.
 * Reports are snapshots, not references to a hidden target's live position.
 */
(function exposeTacticalAI(global) {
  'use strict';
  const combatTypes = new Set([
    'guard','marine','smartgunner','gyro','cleaner','incinerator','commando','android','synthetic',
    'powerloader','exosuit','weyland_commando_mk2','weyland_steel_team_synth','steelteam',
    'steelteamsynth','steelteamandroid','weyland_cyber_hound','cyberhound','cyber_hound',
    'uscm_sniper','weyland_containment_squad','uscm_hazmat_tech','weyland_drone_operator',
    'uscm_heavy_flamer','uscm_combat_engineer','uscm_smartgun_flamer','uscm_m42b_marksman',
    'weyland_plasma_gunner','uscm_sadar_operator','uscm_recon_scout','reconscout','recon',
    'uscm_combat_medic','combatmedic','medic','combat_medic','uscm_recon_sniper',
    'reconsniper','recon_sniper','forward_observer','weyland_security_taser','taser_guard'
  ]);
  const finitePoint = point => point && Number.isFinite(point.x) && Number.isFinite(point.z);
  const distance = (a,b) => Math.hypot(a.x-b.x,a.z-b.z);
  function isCombatant(entity) {
    if (typeof entity === 'string') return combatTypes.has(entity);
    return !!entity && combatTypes.has(entity.type) && !entity.isInfected &&
      !entity.isIncapacitated && !entity.isCocooned && !entity.isDestroyed &&
      !(Number.isFinite(entity.hp) && entity.hp <= 0);
  }
  function profile(type) {
    if (/sniper|marksman|observer/.test(type)) return {role:'marksman',aim:.85,memory:8,range:28,halfFov:1.30};
    if (/hound|powerloader|exosuit|taser/.test(type)) return {role:'interceptor',aim:.32,memory:6,range:22,halfFov:1.65};
    if (/flamer|incinerator|cleaner|containment|hazmat/.test(type)) return {role:'containment',aim:.65,memory:6,range:19,halfFov:1.45};
    if (/medic|engineer|operator/.test(type)) return {role:'support',aim:.55,memory:6,range:23,halfFov:1.45};
    return {role:isCombatant(type)?'rifle':'civilian',aim:.46,memory:6,range:26,halfFov:1.50};
  }
  function createState() {
    return {lastKnown:null,remaining:0,source:null,searchIndex:0,searchGoal:null,seenAge:Infinity,
      aimRemaining:0,aimTarget:null,aimStarted:false};
  }
  function squadRecipients(reporter, humans, radius=35, limit=4) {
    if (!finitePoint(reporter) || !Array.isArray(humans)) return [];
    return humans.filter(ally => ally !== reporter && finitePoint(ally) && isCombatant(ally) &&
      !ally.isLured && !ally.isEscaped && !ally.isConsumedByCycle && distance(reporter,ally)<=radius)
      .sort((a,b)=>distance(reporter,a)-distance(reporter,b)||(Number(a.id)||0)-(Number(b.id)||0))
      .slice(0,Math.max(0,Math.min(8,limit)));
  }
  function escapeGoal(position, threat, options={}) {
    if (!finitePoint(position)||!finitePoint(threat)) return null;
    const away=Math.atan2(position.z-threat.z,position.x-threat.x),candidates=[];
    // A small, deterministic local sampling budget, not global knowledge of the
    // level or a teleport to a room the human has never reached.
    for(const radius of [8,5,3])for(const offset of [0,.65,-.65,1.3,-1.3,2.1,-2.1]) {
      const point={x:position.x+Math.cos(away+offset)*radius,z:position.z+Math.sin(away+offset)*radius};
      if(options.walkable&&!options.walkable(point.x,point.z))continue;
      const separation=distance(point,threat);
      if(separation<distance(position,threat)+.6)continue;
      const covered=!!options.covered?.(point.x,point.z);
      candidates.push({...point,covered,score:separation+ (covered?10:0)-radius*.16-Math.abs(offset)*.2});
    }
    candidates.sort((a,b)=>b.score-a.score);
    // At most six path searches per decision. Prefer a reachable corner over
    // the mathematically furthest point on the other side of a closed bulkhead.
    for(const point of candidates.slice(0,6)) {
      if(!options.reachable||options.reachable(point.x,point.z))return {x:point.x,z:point.z};
    }
    return null;
  }
  function report(state, point, source='radio') {
    if (!finitePoint(point) || (source !== 'visual' && state.seenAge < .8)) return false;
    state.lastKnown={x:point.x,z:point.z};state.source=source;
    state.remaining=source==='visual'?6:3.6;state.searchIndex=0;state.searchGoal=null;
    return true;
  }
  function observe(state, input) {
    const dt=Math.max(0,Math.min(.25,Number(input.delta)||0));
    state.seenAge+=dt;
    if (input.visible && finitePoint(input.point)) {
      report(state,input.point,'visual');state.remaining=input.memory||6;state.seenAge=0;
      return {mode:'CONTACT',goal:{...state.lastKnown}};
    }
    state.remaining=Math.max(0,state.remaining-dt);
    if (!state.lastKnown || state.remaining<=0 || input.detectable===false) {
      state.lastKnown=null;state.remaining=0;state.source=null;
      return {mode:'PATROL',goal:null};
    }
    let goal={...state.lastKnown};
    if (finitePoint(input.position) && ((!state.searchGoal && distance(input.position,goal)<1.1) ||
      (state.searchGoal && distance(input.position,state.searchGoal)<.8))) {
      const angle=(Number(input.id)||0)*2.399963+state.searchIndex*Math.PI*.5;
      const candidate={x:goal.x+Math.cos(angle)*2.8,z:goal.z+Math.sin(angle)*2.8};
      if ((!input.walkable || input.walkable(candidate.x,candidate.z)) &&
          (!input.reachable || input.reachable(candidate.x,candidate.z))) state.searchGoal=candidate;
      state.searchIndex=(state.searchIndex+1)%4;
    }
    if (state.searchGoal) goal={...state.searchGoal};
    return {mode:state.source==='visual'?'SEARCH':'INVESTIGATE',goal};
  }
  function inFieldOfView(position, target, facing, halfFov=1.5, closeRange=2.6) {
    if (!finitePoint(position)||!finitePoint(target)) return false;
    const d=distance(position,target);if(d<=closeRange)return true;
    const forwardX=Math.sin(Number(facing)||0),forwardZ=Math.cos(Number(facing)||0);
    return ((target.x-position.x)*forwardX+(target.z-position.z)*forwardZ)/d>=Math.cos(halfFov);
  }
  function aim(state,target,eligible,delta,delay=.46) {
    if(!eligible){state.aimTarget=null;state.aimRemaining=0;state.aimStarted=false;return {ready:false,started:false};}
    if(state.aimTarget!==target){state.aimTarget=target;state.aimRemaining=delay;state.aimStarted=true;return {ready:false,started:true};}
    state.aimRemaining=Math.max(0,state.aimRemaining-Math.max(0,Math.min(.25,Number(delta)||0)));
    return {ready:state.aimRemaining===0,started:false};
  }
  function validImpact(target,shot,currentStage,hasLineOfSight) {
    if (!finitePoint(target)||!finitePoint(shot)||currentStage!==shot.stage ||
      target.isDestroyed||target.isIncapacitated||target.isCocooned||target.isDefeated||target.isEscaped||target.isConsumedByCycle||
      target.isActive===false || (Number.isFinite(target.hp)&&target.hp<=0) ||
      (Number.isFinite(target.health)&&target.health<=0) ||
      (Number.isFinite(target.integrity)&&target.integrity<=0)) return false;
    return distance(target,shot)<=(shot.radius||1) &&
      hasLineOfSight(shot.originX,shot.originZ,shot.x,shot.z,0) &&
      hasLineOfSight(shot.x,shot.z,target.x,target.z,0);
  }
  global.HiveTacticalAI=Object.freeze({isCombatant,profile,createState,squadRecipients,escapeGoal,report,observe,inFieldOfView,aim,validImpact});
})(typeof window==='undefined'?globalThis:window);
