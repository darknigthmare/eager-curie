/* In-world orientation and a compact manual. This reads visible/local state;
 * it never reveals actors through walls or drives gameplay decisions. */
(function exposeFieldGuide(global) {
  'use strict';
  const manualState=new Map();
  let elapsed=0;
  function advice(game) {
    const s=game?.currentStage,index=game?.currentStageIndex;
    if(!s)return '';
    if(index===4) {
      if(s.royalCycle?.isActive)return `Défendez la nurserie — ${s.royalCycle.state}.`;
      const count=Math.min(2,Number(s.capturedHosts)||0);
      if(count<2)return `Hôtes vivants ${count}/2 : [F2] repérer, [H] étourdir, puis approcher et [F].`;
      return 'Deux hôtes sécurisés : éliminez les menaces proches, puis établissez la nurserie.';
    }
    const relayCount=Number(s.relayCount)||0;
    if(index===5)return relayCount<3
      ? `Relais ${relayCount}/3 : [R] INFEST, puis escortez une unité sur place pendant 3 s.`
      : 'Purge interrompue : neutralisez les dernières forces de confinement.';
    return '';
  }
  function subject(game,player) {
    if(game?.currentStageIndex===5)return game.currentStage?.possessedUnit&&global.pheromoneSystem?.possessionMode
      ? game.currentStage.possessedUnit : game.currentStage?.queen;
    return player;
  }
  function localTarget(game,map,actor) {
    if(!actor||!Number.isFinite(actor.x)||!Number.isFinite(actor.z)||game?.currentStageIndex!==4)return null;
    const available=(game.humans||[]).filter(h=>h&&h.hp>0&&!h.isDestroyed&&!h.isEscaped&&
      !h.isConsumedByCycle&&h.mesh?.visible!==false&&Number.isFinite(h.x)&&Number.isFinite(h.z)&&
      Math.hypot(h.x-actor.x,h.z-actor.z)<=10&&map.hasLineOfSight(actor.x,actor.z,h.x,h.z,.08));
    const requested=actor.actionTarget?.target;
    return available.includes(requested)?requested:
      available.sort((a,b)=>Math.hypot(a.x-actor.x,a.z-actor.z)-Math.hypot(b.x-actor.x,b.z-actor.z))[0]||null;
  }
  function targetAdvice(target) {
    if(!target)return '';
    const rules=global.HiveFidelityRules,host=rules?.classifyHost?.(target);
    if(host?.kind==='synthetic'||host?.eligibility==='none')return `${target.name} — non viable pour la nurserie.`;
    if(host?.eligibility==='protected')return `${target.name} — visage protégé : retirez le masque avant capture.`;
    if(target.isCocooned)return `${target.name} — hôte vivant sécurisé.`;
    if(target.isIncapacitated||target.staggerTimer>0)return `${target.name} — vulnérable : approchez puis [F].`;
    return `${target.name} — hôte vivant : [H], puis [F]. Préservez-le.`;
  }
  function decorateGuide(game) {
    const doc=global.document,guide=doc?.getElementById('stage-instructions');
    if(!guide)return;
    const compact=game.currentStageIndex>=4;
    guide.classList.toggle('compact-manual',compact);
    if(!compact)return;
    if(!guide.firstElementChild?.classList.contains('field-manual')) {
      const details=doc.createElement('details'),summary=doc.createElement('summary'),body=doc.createElement('div');
      details.className='field-manual';body.className='field-manual-body';
      summary.textContent='Aide et commandes';details.open=manualState.get(game.currentStageIndex)||false;
      const stage=game.currentStageIndex;
      details.addEventListener('toggle',()=>manualState.set(stage,details.open));
      while(guide.firstChild)body.appendChild(guide.firstChild);
      details.append(summary,body);guide.appendChild(details);
    }
    const actions=doc.getElementById('action-buttons-container');
    if(game.currentStageIndex===4&&actions) {
      const ids=game.currentStage?.royalCycle?.isActive
        ? ['btn-claw-swipe','btn-drone-ambush','btn-tail-impale']
        : game.currentStage?.capturedHosts>=2
          ? ['btn-found-queen-hive','btn-claw-swipe','btn-drone-ambush']
          : ['btn-drone-hiss','btn-cocoon-host','btn-claw-swipe'];
      const controls=ids.map(id=>doc.getElementById(id)).filter(b=>b?.parentElement===actions);
      if(!controls.every((b,i)=>actions.children[i]===b))
        for(let i=controls.length-1;i>=0;i--)actions.insertBefore(controls[i],actions.firstChild);
    }
  }
  function text(node,value) {if(node&&node.textContent!==value)node.textContent=value;}
  function bindPointerFocus(game) {
    const doc=global.document,actions=doc?.getElementById('action-buttons-container');
    if(!actions||actions.dataset.fieldPointerFocus)return;
    actions.dataset.fieldPointerFocus='bound';
    actions.addEventListener('click',event=>{
      const button=event.target.closest?.('button');
      // Pointer actions hand back control to the world. Keyboard activation
      // deliberately retains focus so the HUD remains navigable with Tab.
      if(!event.detail||!button||button.disabled||button.id==='btn-toggle-advanced-actions')return;
      Promise.resolve().then(()=>{
        if(!game.campaignActive||game.isSystemPaused||doc.querySelector('.system-overlay:not(.hidden), #stage-modal:not(.hidden), .front-screen:not(.hidden)'))return;
        doc.getElementById('game-canvas')?.focus({preventScroll:true});
      });
    });
  }
  function update(delta,game,map,player,force=false) {
    elapsed+=Math.max(0,Number(delta)||0);
    if(!force&&elapsed<.2)return;
    elapsed=0;
    const doc=global.document;if(!doc)return;
    const tracker=doc.getElementById('mission-tracker');if(!tracker)return;
    bindPointerFocus(game);
    decorateGuide(game);
    let sector=doc.getElementById('field-sector');
    if(!sector) {sector=doc.createElement('span');sector.id='field-sector';tracker.prepend(sector);}
    const actor=subject(game,player),zone=global.HiveStationArchitecture?.zoneAt(actor?.x,actor?.z);
    text(sector,zone?`${zone.code} / ${zone.label.replace(/^\d+\s+/, '')}`:'MNEMOSYNE / INTERCONNEXION');
    sector.hidden=!game?.campaignActive;
    const objective=doc.getElementById('mission-objective'),next=advice(game);
    if(next)text(objective,next);
    let intel=doc.getElementById('field-target');
    if(!intel) {intel=doc.createElement('p');intel.id='field-target';tracker.appendChild(intel);}
    const target=localTarget(game,map,actor),hint=targetAdvice(target);
    text(intel,hint);intel.hidden=!hint||!game?.campaignActive;
  }
  global.HiveFieldGuide=Object.freeze({advice,localTarget,targetAdvice,decorateGuide,update});
})(typeof window==='undefined'?globalThis:window);
