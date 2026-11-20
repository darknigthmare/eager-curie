/* Prepared native locomotion/T140 observations. No production method is
 * replaced. Actor positions/HP and fixed ticks are fixtures, not human QA. */
(async()=>{
  'use strict';
  const q=window.__creatureQA,g=window.gameInstance,p=q.playerCreature,map=q.stationMap,T=THREE;
  const need=(value,message)=>{if(!value)throw Error(message);};
  await HiveModelFactory.loadTextures?.();await q.rendererEngine.renderQuality?.environmentReady;
  need(typeof p.findCeilingSupport==='function'&&typeof p.updateCeilingAction==='function','Current creature contracts missing');
  const caption=document.createElement('div');caption.style.cssText='position:fixed;left:20px;top:74px;z-index:100000;background:#111827;color:#fef3c7;padding:8px;font:13px monospace';document.body.append(caption);
  const f={q,g,p,map,T,need,caption,victim:null,hits:[],samples:[],fixtureStart:null,barrierFixture:null,
    active(run){const paused=g.isSystemPaused;try{g.isSystemPaused=false;return run();}finally{g.isSystemPaused=paused;}},
    removeBarrierFixture(){const fixture=this.barrierFixture;if(!fixture)return;
      const index=map.colliders.indexOf(fixture.collider);if(index>=0)map.colliders.splice(index,1);
      fixture.mesh.parent?.remove(fixture.mesh);fixture.mesh.geometry.dispose();fixture.mesh.material.dispose();this.barrierFixture=null;},
    reset(){this.removeBarrierFixture();g.startCampaign(4);g.setSystemPaused(true);g.clearHumans();HiveSystems.vfx.clear(false);
      p.isDefeated=p.inDeathThroes=p.isEmerging=p.isBiologicalTransition=p.isChrysalis=false;
      p.isInVent=p.isCeilingProwling=p.isProwling=p.isWallMimic=false;p.draggedHost=null;
      p.embryoMutation=null;p.health=p.maxHealth=1000;p.mesh.visible=true;p.moveTarget=null;p.moveWaypoints=[];
      q.inputManager.reset();this.victim=null;this.hits=[];this.samples=[];this.fixtureStart=null;},
    bounds(){p.mesh.updateMatrixWorld(true);return new T.Box3().setFromObject(p.detailedModel);},
    victimBounds(){return this.victim?.mesh?.parent?p.getCeilingVictimBounds(this.victim):null;},
    imported(h){let found=null;h?.mesh?.traverse(child=>{if(!found&&HiveAssetLibrary?.getRuntime(child))found=child;});return found;},
    tailAttachment(){
      const action=p.ceilingAction,tail=action?.tailPose;
      if(!tail)return null;
      const tip=tail.blade.localToWorld(tail.point.clone());
      const anchor=p.getCeilingTailContact(action).center;
      return {tip:tip.toArray(),anchor:anchor.toArray(),gap:tip.distanceTo(anchor),weight:tail.weight,
        lengthRatio:tail.weight>0?tail.curveLength/tail.rest.getLength():1};
    },
    snapshot(){const box=this.bounds(),h=this.victim,vbox=this.victimBounds(),state=p.ceilingTransition||p.ceilingSupport,
      support=p.ceilingAction?.support||state?.support,model=this.imported(h),runtime=model&&HiveAssetLibrary.getRuntime(model);
      return {phase:p.ceilingAction?.phase||p.ceilingTransition?.phase||(p.isCeilingProwling?'HANG':'GROUND'),
        locomotionPhase:p.ceilingTransition?.phase||null,actionPhase:p.ceilingAction?.phase||null,busy:p.isLocomotionBusy(),hanging:p.isCeilingProwling,
        position:p.mesh.position.toArray(),rotation:p.mesh.rotation.toArray(),clock:p.creatureAnimationTime,
        elapsed:p.ceilingAction?.elapsed??p.ceilingTransition?.elapsed??null,
        bounds:{min:box.min.toArray(),max:box.max.toArray()},ceiling:support?.undersideY??null,
        hits:this.hits.map(hit=>({...hit})),tailAttachment:this.tailAttachment(),victim:h?{hp:h.hp,isRestrained:h.isRestrained,isCocooned:h.isCocooned,
          isIncapacitated:h.isIncapacitated,hostEligibility:h.hostEligibility,isConsumedByCycle:h.isConsumedByCycle,
          owner:!!h.ceilingActionOwner,position:h.mesh.position.toArray(),rotation:h.mesh.rotation.toArray(),
          bounds:vbox?{min:vbox.min.toArray(),max:vbox.max.toArray()}:null,
          imported:model?{id:model.userData.hiveAssetId,elapsed:runtime.elapsed,state:runtime.currentState,mode:runtime.mode}:null}:null};},
    frame(dt=1/60,{humanFirst=false}={}){
      const h=this.victim;
      if(humanFirst&&h?.mesh?.parent)h.update(dt);
      p.update(dt);
      if(p.ceilingAction&&p.ceilingAction.phase!=='WINDUP'&&h)h.isDocileCatatonic=false;
      if(!humanFirst&&h?.mesh?.parent)h.update(dt);
      HiveSystems.update(dt);
      const state=this.snapshot();this.samples.push(state);
      need(state.bounds.min[1]>=-.035,'Actual animated creature crossed deck in '+state.phase);
      if(['CLIMB','ROLL','HANG','DESCEND_POSITION'].includes(state.phase)&&Number.isFinite(state.ceiling))need(state.bounds.max[1]<=state.ceiling+.04,'Creature penetrated its actual support');
      if(h?.ceilingActionOwner&&state.victim?.bounds){need(state.victim.bounds.min[1]>=-.035,'Animated victim crossed deck');
        if(p.ceilingAction.phase!=='RELEASE')need(state.victim.bounds.max[1]<=p.ceilingAction.support.undersideY+.04,'Animated victim penetrated support');}
      return state;
    },
    ticks(count,options){return this.active(()=>{for(let i=0;i<count;i++)this.frame(1/60,options);return this.snapshot();});},
    until(phase,max=900){return this.active(()=>{for(let i=0;i<max;i++){if(this.snapshot().phase===phase)return this.snapshot();this.frame();}
      throw Error('Native controller never reached '+phase+'; actual='+this.snapshot().phase);});},
    key(key,{shift=false}={}){return this.active(()=>{q.inputManager.canvas.focus();
      if(shift)window.dispatchEvent(new KeyboardEvent('keydown',{key:'Shift',code:'ShiftLeft',shiftKey:true,bubbles:true}));
      const code=key===' '?'Space':key.length===1?'Key'+key.toUpperCase():key;
      window.dispatchEvent(new KeyboardEvent('keydown',{key,code,shiftKey:shift,bubbles:true}));
      window.dispatchEvent(new KeyboardEvent('keyup',{key,code,shiftKey:shift,bubbles:true}));
      if(shift)window.dispatchEvent(new KeyboardEvent('keyup',{key:'Shift',code:'ShiftLeft',bubbles:true}));
      HiveSystems.ui.syncLocomotionActions?.();return this.snapshot();});},
    findSupport(preferred=null){this.reset();const candidates=preferred?[{...preferred}]:[];
      for(const x of [-45,-30,-60,30,45,60])for(const z of [-35,-15,15,35])candidates.push({x,z});
      for(let x=-65;x<=65;x+=10)for(let z=-65;z<=65;z+=10)candidates.push({x,z});
      for(const point of candidates){if(map.checkCollision(point.x,point.z,p.creatureEnvelope.radius))continue;
        p.x=point.x;p.z=point.z;p.mesh.position.set(point.x,0,point.z);p.applyGroundContact();const support=p.findCeilingSupport();
        if(!support||!p.canFitCeilingTransition(support))continue;
        this.fixtureStart={...point};this.supportFixture={id:support.id,undersideY:support.undersideY,x:support.x,z:support.z,yaw:support.yaw,
          route:support.route.map(row=>({...row})),alongX:support.alongX};
        return {start:this.fixtureStart,support:this.supportFixture,industrialProps:map.wave31Props.length,
          fixture:'Actual authored support, walls and all current props; only start position is prepared, no synthetic support or collider suppression'};
      }throw Error('Actual current station has no usable wall-beam junction for the live drone gabarit');},
    climb(preferred=null){const prepared=this.findSupport(preferred),before=this.snapshot();this.key('q');need(p.ceilingTransition&&p.ceilingTransition.phase==='APPROACH','Installed Q did not start approach');
      need(Math.abs(p.mesh.position.y-before.position[1])<1e-8&&!p.isCeilingProwling,'Q teleported altitude/instantaneously hung');
      return {prepared,before,after:this.snapshot()};},
    addFloorBlocker(x,z,width,depth,height=.8){
      this.removeBarrierFixture();
      const mesh=new T.Mesh(new T.BoxGeometry(width,height,depth),new T.MeshStandardMaterial({color:0xb45309,roughness:.8,metalness:.35}));
      mesh.name='qa_prepared_floor_barrier';mesh.position.set(x,height/2,z);
      (q.rendererEngine.propsGroup||q.rendererEngine.scene).add(mesh);mesh.updateMatrixWorld(true);
      const bounds=new T.Box3().setFromObject(mesh),collider={mesh,minX:bounds.min.x,maxX:bounds.max.x,minZ:bounds.min.z,maxZ:bounds.max.z};
      map.colliders.push(collider);this.barrierFixture={mesh,collider};
      return {min:bounds.min.toArray(),max:bounds.max.toArray(),center:mesh.position.toArray()};
    },
    makeVictim(hp=300){need(p.isCeilingProwling&&!p.isLocomotionBusy(),'Victim setup requires actual stable hanging');
      g.clearHumans();const h=new q.HumanAI(9201,'scientist',p.x,p.z);h.createMesh();g.humans.push(h);
      h.hp=h.maxHp=hp;h.isDocileCatatonic=true;h.catatonicTimer=999;h.shootCooldown=h.motionPingCooldown=999;
      let chosen=null;for(const radius of [2.5,3.5,1.8,4.5]){for(let index=0;index<24;index++){
        const x=p.x+Math.cos(index*Math.PI/12)*radius,z=p.z+Math.sin(index*Math.PI/12)*radius;
        if(map.checkCollision(x,z,.8)||!map.hasLineOfSight(p.x,p.z,x,z,.1))continue;
        h.x=x;h.z=z;h.mesh.position.set(x,0,z);h.mesh.rotation.set(0,0,0);HiveModelFactory.placeOnGround(h.mesh,.015);
        const accepted=this.active(()=>p.executeCeilingImpale(h));if(accepted){chosen={x,z};p.cancelCeilingAction();break;}
      }if(chosen)break;}
      need(chosen,'No real actor capture trajectory fits beneath the actual chosen support');
      const original=h.takeDamage;this.hits=[];h.takeDamage=function(...args){f.hits.push({amount:args[0],hpBefore:this.hp,phase:p.ceilingAction?.phase||p.ceilingTransition?.phase||null});return original.apply(this,args);};
      h.nativeOriginalTakeDamage=original;this.victim=h;
      return {hp,position:chosen,model:this.imported(h)?.userData.hiveAssetId||'procedural-fallback',
        fixture:'Actual HumanAI/model/damage; HP and floor position prepared, catatonia holds actor still until contact; real action preflight cancelled before any tick/hit'};},
    controls(){HiveSystems.ui.syncLocomotionActions?.();const state=g.getLocomotionState();return {state,
      buttons:[...document.querySelectorAll('#action-buttons-container .act-btn')].map(button=>({id:button.id,disabled:button.disabled,locked:button.dataset.locomotionLocked||null,
        ariaDisabled:button.getAttribute('aria-disabled'),label:button.textContent.trim()})),trackerFocused:g.motionTracker.focusedMode};},
    drawGameplay(label){
      g.setSystemPaused(true);
      document.getElementById('app-container').classList.remove('game-paused');
      this.caption.hidden=true;
      const r=q.rendererEngine,camera=r.camera;
      const target=g.currentStage?.getCameraTarget?.()||p;
      camera.clearViewOffset();
      // Let the installed camera and wall-fade controllers settle on the
      // observed phase. The HUD, actors, and collision geometry stay visible.
      for(let i=0;i<90;i++){
        r.setCameraTarget(target.x,target.z,0,false,1/60);
        r.updateWallVisibility({x:p.x,y:1.4,z:p.z},1/60);
      }
      r.updatePropVisibility(p,false);
      r.render();r.renderer.getContext().finish();
      const canvas=q.inputManager.canvas.getBoundingClientRect();
      const hud=['hud-header','hud-sidebar','m314-tracker','narrative-banner','toast-message'].flatMap(id=>{
        const element=document.getElementById(id);
        if(!element||element.classList.contains('hidden'))return [];
        const rect=element.getBoundingClientRect(),style=getComputedStyle(element);
        if(style.visibility==='hidden'||style.display==='none'||Number(style.opacity)===0||!rect.width||!rect.height)return [];
        return [{id,left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom}];
      });
      const occluders=[];
      r.scene.traverse(object=>{
        if(!object.isMesh)return;
        for(let node=object;node;node=node.parent)if(!node.visible||node===p.mesh||node===this.victim?.mesh)return;
        const materials=Array.isArray(object.material)?object.material:[object.material];
        if(materials.some(material=>material&&material.visible!==false&&(!material.transparent||material.opacity>.18)))occluders.push(object);
      });
      const actors=[['player',this.bounds()],['victim',this.victimBounds()]].flatMap(([id,bounds])=>{
        if(!bounds)return [];
        const center=bounds.getCenter(new T.Vector3()),ray=new T.Raycaster();
        const samples=[.22,.5,.78].map(height=>{
          const point=center.clone();point.y=T.MathUtils.lerp(bounds.min.y,bounds.max.y,height);
          const offset=point.clone().sub(camera.position),distance=offset.length();
          ray.set(camera.position,offset.normalize());ray.far=Math.max(0,distance-.08);
          const blocking=ray.intersectObjects(occluders,false)[0];
          const ndc=point.clone().project(camera),x=canvas.left+(ndc.x+1)*canvas.width/2,y=canvas.top+(1-ndc.y)*canvas.height/2;
          return {x,y,inFrame:Math.abs(ndc.x)<=1&&Math.abs(ndc.y)<=1&&Math.abs(ndc.z)<=1,
            hudOverlap:hud.filter(rect=>x>=rect.left&&x<=rect.right&&y>=rect.top&&y<=rect.bottom).map(rect=>rect.id),
            occluder:blocking?(blocking.object.name||blocking.object.parent?.name||blocking.object.type):null};
        });
        return [{id,samples}];
      });
      const beams=(map.ceilingSupports||[]).map(({id,mesh})=>({id,opacity:mesh.material.opacity,depthWrite:mesh.material.depthWrite}));
      need(hud.some(rect=>rect.id==='hud-header')&&hud.some(rect=>rect.id==='hud-sidebar'),'Standard view is missing the desktop HUD');
      return {label,mode:'gameplay-camera',camera:camera.position.toArray(),fov:camera.fov,hud,actors,beams,
        activeSupport:p.ceilingAction?.support.id||null,state:this.snapshot(),
        scope:'Prepared actors and fixed phase ticks, rendered by the settled standard camera and HUD. Three samples per actor record world geometry and HUD coverage.'};
    },
    draw(label){g.setSystemPaused(true);document.getElementById('app-container').classList.remove('game-paused');caption.textContent='DIAGNOSTIC PRÉPARÉ — '+label;
      caption.hidden=false;
      const r=q.rendererEngine,body=this.bounds(),victim=this.victimBounds(),combined=body.clone();if(victim)combined.union(victim);
      const center=combined.getCenter(new T.Vector3()),targets=[body.getCenter(new T.Vector3())];if(victim)targets.push(victim.getCenter(new T.Vector3()));
      r.updatePropVisibility(p,false);for(let i=0;i<30;i++)r.updateWallVisibility({x:p.x,y:center.y,z:p.z},1/60);r.scene.updateMatrixWorld(true);
      const worldMeshes=[];r.scene.traverse(object=>{if(!object.isMesh)return;
        for(let node=object;node;node=node.parent)if(!node.visible||node===p.mesh||node===this.victim?.mesh)return;
        const materials=Array.isArray(object.material)?object.material:[object.material];
        if(materials.some(material=>material&&material.visible!==false&&(!material.transparent||material.opacity>.18)))worldMeshes.push(object);});
      const candidates=[],ray=new T.Raycaster(),support=p.ceilingAction?.support||p.ceilingTransition?.support||p.ceilingSupport?.support;
      const offsets=support?.alongX?[[3,7],[3,-7],[-3,7],[-3,-7]]:[[7,3],[-7,3],[7,-3],[-7,-3]];
      offsets.push([10,0],[-10,0],[0,10],[0,-10],[9,9],[-9,9],[9,-9],[-9,-9]);
      for(const [dx,dz]of offsets){const origin=new T.Vector3(p.x+dx,Math.max(5.5,Math.min(6.5,center.y+1)),p.z+dz);
        if(Math.max(Math.abs(origin.x),Math.abs(origin.z))>=72.5)continue;const occluders=[];
        for(const target of targets){const direction=target.clone().sub(origin),distance=direction.length();ray.set(origin,direction.normalize());ray.near=.03;ray.far=Math.max(.03,distance-.08);
          const hit=ray.intersectObjects(worldMeshes,false)[0];if(hit)occluders.push({name:hit.object.name||hit.object.parent?.name||hit.object.type,distance:hit.distance});}
        candidates.push({origin,blocked:occluders.length,occluders});if(!occluders.length)break;}
      candidates.sort((a,b)=>a.blocked-b.blocked);const chosen=candidates[0];need(chosen,'No in-station diagnostic camera candidate');
      r.camera.clearViewOffset();r.camera.position.copy(chosen.origin);r.camera.lookAt(center);r.camera.fov=58;r.camera.updateProjectionMatrix();r.render();r.renderer.getContext().finish();
      return {label,camera:r.camera.position.toArray(),cameraAudit:{target:center.toArray(),sampleRays:targets.length,blocked:chosen.blocked,occluders:chosen.occluders,
        candidates:candidates.map(candidate=>({position:candidate.origin.toArray(),blocked:candidate.blocked})),scope:'Native geometry ray samples select a lateral camera below the support; no object/collider removed and no claim of complete pixel visibility'},
        state:this.snapshot(),controls:this.controls(),scope:'Actual native scene/materials and diagnostic camera; no human play or performance claim'};},
    cleanup(){this.removeBarrierFixture();p.cancelCeilingAction({restorePose:true});p.cancelCeilingTransition();caption.remove();g.setSystemPaused(true);}
  };window.__creatureNative=f;
  return {ready:true,scope:'Prepared actors/HP/positions, actual installed key handlers and fixed relevant subsystem ticks; no methods replaced or fake support geometry'};
})()
