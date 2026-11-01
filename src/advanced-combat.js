/* Shared contracts for advanced adult attacks. Cooldowns and in-flight
 * validation advance on the simulation clock, never on wall-clock timers. */
(function exposeAdvancedCombat(global) {
  'use strict';
  const stages = new WeakMap();
  const failures = new WeakMap();
  const playerMotions = new WeakMap();
  const ceilingGeometry = new WeakMap();
  const ceilingFailures = new WeakMap();
  const ceilingSupports = new WeakMap();
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
  function ceilingParts(model,T) {
    const cached=ceilingGeometry.get(model);
    if(cached&&cached.checks.every(check=>check.valid()))return cached;
    const parts=[],checks=[{valid:()=>!model.userData.hiveFactoryDisposed}],point=new T.Vector3(),matrix=new T.Matrix4();
    function partition(points,object,bone=null,instance=null) {
      if(!points.length)return;
      const bounds=new T.Box3();for(const p of points)bounds.expandByPoint(p);
      const size=bounds.getSize(new T.Vector3()),cells=Array(27);
      for(const p of points){
        const x=size.x>1e-8?Math.min(2,Math.floor((p.x-bounds.min.x)/size.x*3)):0;
        const y=size.y>1e-8?Math.min(2,Math.floor((p.y-bounds.min.y)/size.y*3)):0;
        const z=size.z>1e-8?Math.min(2,Math.floor((p.z-bounds.min.z)/size.z*3)):0,key=x+3*y+9*z;
        if(!cells[key])cells[key]=new T.Box3();cells[key].expandByPoint(p);
      }
      for(const box of cells)if(box)parts.push({object,bone,instance,box});
    }
    let valid=true;
    model.traverse(object=>{
      const children=object.children.slice();checks.push({valid:()=>object.children.length===children.length&&object.children.every((child,i)=>child===children[i])});
      const positions=object.geometry?.attributes?.position;if(!object.isMesh||!positions)return;
      const geometry=object.geometry,indices=geometry.attributes.skinIndex,weights=geometry.attributes.skinWeight;
      const version=positions.version,indexVersion=indices?.version,weightVersion=weights?.version;
      const instances=object.count,instanceVersion=object.instanceMatrix?.version;
      if(geometry.morphAttributes?.position?.length){valid=false;return;}
      checks.push({valid:()=>!geometry.morphAttributes?.position?.length&&object.geometry===geometry&&geometry.attributes.position===positions&&positions.version===version&&
        geometry.attributes.skinIndex===indices&&indices?.version===indexVersion&&
        geometry.attributes.skinWeight===weights&&weights?.version===weightVersion&&
        object.count===instances&&object.instanceMatrix?.version===instanceVersion});
      if(object.isSkinnedMesh){
        if(!indices||!weights||!object.skeleton?.bones?.length){valid=false;return;}
        const skeleton=object.skeleton,bones=skeleton.bones.slice(),inverses=skeleton.boneInverses.map(inverse=>inverse.elements.slice()),bind=object.bindMatrix.elements.slice();
        checks.push({valid:()=>object.skeleton===skeleton&&skeleton.bones.length===bones.length&&skeleton.boneInverses.length===inverses.length&&
          skeleton.bones.every((bone,i)=>bone===bones[i])&&skeleton.boneInverses.every((inverse,i)=>inverse.elements.every((value,j)=>value===inverses[i][j]))&&
          object.bindMatrix.elements.every((value,i)=>value===bind[i])});
        const points=object.skeleton.bones.map(()=>[]);
        for(let i=0;i<positions.count;i++){
          let total=0;
          for(let j=0;j<4;j++){
            const weight=weights.array[i*4+j],index=indices.array[i*4+j];total+=weight;
            if(!Number.isFinite(weight)||weight<0||weight>1||!object.skeleton.boneInverses[index]){valid=false;continue;}
            if(weight===0)continue;
            point.fromBufferAttribute(positions,i).applyMatrix4(object.bindMatrix)
              .applyMatrix4(object.skeleton.boneInverses[index]);points[index].push(point.clone());
          }
          if(Math.abs(total-1)>1e-4)valid=false;
        }
        points.forEach((points,index)=>partition(points,object,object.skeleton.bones[index]));
      }else{
        const points=[];for(let i=0;i<positions.count;i++)points.push(point.fromBufferAttribute(positions,i).clone());
        if(object.isInstancedMesh){
          for(let i=0;i<object.count;i++){object.getMatrixAt(i,matrix);partition(points,object,null,matrix.clone());}
        }else partition(points,object);
      }
    });
    const result=valid&&parts.length?{parts,checks}:null;ceilingGeometry.set(model,result);return result;
  }
  function ceilingBounds(profile) {
    const {parts,box,point,matrix,mesh}=profile;mesh.parent?.updateWorldMatrix?.(true,false);mesh.updateMatrixWorld(true);box.makeEmpty();
    for(const part of parts){
      if(part.bone)matrix.multiplyMatrices(part.object.matrixWorld,part.object.bindMatrixInverse).multiply(part.bone.matrixWorld);
      else{matrix.copy(part.object.matrixWorld);if(part.instance)matrix.multiply(part.instance);}
      for(let i=0;i<8;i++){
        point.set(i&1?part.box.max.x:part.box.min.x,i&2?part.box.max.y:part.box.min.y,i&4?part.box.max.z:part.box.min.z)
          .applyMatrix4(matrix);box.expandByPoint(point);
      }
    }
    return box;
  }
  function fitCeilingPose(profile,progress) {
    const {T,player,model,basePosition,pivot,offset,rotation,axisY,axisZ}=profile;
    const t=Math.max(0,Math.min(1,progress)),s=t*t*(3-2*t),angle=Math.PI*(1-s);
    rotation.setFromAxisAngle(axisY,angle).multiply(profile.roll.setFromAxisAngle(axisZ,angle));
    model.quaternion.copy(rotation);model.position.copy(basePosition);
    // Rotate about the middle of the torso, not the feet. The support origin
    // descends while the mass stays inside the actual deck/ceiling interval.
    offset.copy(pivot).applyQuaternion(rotation).negate();offset.y+=pivot.y*(2*s-1);
    model.position.add(offset);player.mesh.rotation.set(0,profile.yawStart+profile.yawDelta*s,0);
    const bounds=ceilingBounds(profile),height=bounds.max.y-bounds.min.y;
    if(!Number.isFinite(height)||height>6.075)return false;
    const correction=Math.max(.025-bounds.min.y,Math.min(0,6.10-bounds.max.y));
    model.position.y+=correction;bounds.min.y+=correction;bounds.max.y+=correction;
    return true;
  }
  function clearCeilingVolume(map,bounds) {
    // Physical fixtures, including low props, still occupy the landing volume.
    // Conservative posed boxes reject a narrow manoeuvre instead of clipping.
    return !(map?.colliders||[]).some(c=>Number.isFinite(c.minX+c.maxX+c.minZ+c.maxZ)&&
      bounds.max.x>c.minX-.02&&bounds.min.x<c.maxX+.02&&
      bounds.max.z>c.minZ-.02&&bounds.min.z<c.maxZ+.02);
  }
  function prepareCeilingMotion(player,map,landing,spec) {
    const T=spec.graphics,model=player.detailedModel,mesh=player.mesh;
    ceilingFailures.set(player,'geometry');
    if(!T||!model||typeof spec.poseSampler!=='function'||typeof spec.groundSampler!=='function')return null;
    const geometry=ceilingParts(model,T);if(!geometry)return null;
    const transforms=[];model.traverse(object=>transforms.push({object,position:object.position.clone(),
      quaternion:object.quaternion.clone(),scale:object.scale.clone(),morph:object.morphTargetInfluences?.slice()}));
    const root={position:mesh.position.clone(),rotation:mesh.rotation.clone(),scale:mesh.scale.clone()};
    const previousBase=model.userData.runtimeBasePose;
    // The native animator caches its ground bind transform. A first action
    // issued before the first RAF must not accidentally cache the ceiling flip.
    if(!previousBase)model.userData.runtimeBasePose={position:new T.Vector3(),quaternion:new T.Quaternion(),scale:model.scale.clone()};
    const profile={T,player,model,mesh,parts:geometry.parts,checks:geometry.checks,basePosition:null,pivot:new T.Vector3(),offset:new T.Vector3(),
      rotation:new T.Quaternion(),roll:new T.Quaternion(),axisY:new T.Vector3(0,1,0),axisZ:new T.Vector3(0,0,1),
      box:new T.Box3(),point:new T.Vector3(),matrix:new T.Matrix4(),groundBase:model.userData.runtimeBasePose,
      snapshots:transforms,rootSnapshot:root,previousBase,samplePose:spec.poseSampler,yawStart:root.rotation.y,yawDelta:0};
    let valid=true;
    try{
      mesh.position.set(0,0,0);mesh.quaternion.identity();spec.poseSampler(1);
      profile.basePosition=profile.groundBase.position.clone();model.quaternion.identity();
      const upright=ceilingBounds(profile);profile.pivot.y=(upright.min.y+upright.max.y)*.5;
      const yaw=distance(player,landing)>1e-7?Math.atan2(landing.x-player.x,landing.z-player.z):root.rotation.y;
      profile.yawDelta=Math.atan2(Math.sin(yaw-profile.yawStart),Math.cos(yaw-profile.yawStart));
      for(let i=0;i<=64;i++){
        const t=i/64,s=t*t*(3-2*t);spec.poseSampler(t);
        mesh.position.set(player.x+(landing.x-player.x)*s,root.position.y*(1-s)+Math.sin(t*Math.PI)*(spec.arcHeight??1.7),
          player.z+(landing.z-player.z)*s);
        if(!fitCeilingPose(profile,t)){ceilingFailures.set(player,'height');valid=false;break;}
        if(!clearCeilingVolume(map,profile.box)){ceilingFailures.set(player,'space');valid=false;break;}
      }
      // A manoeuvre is not safe if its first ordinary, unmodified ground pose
      // immediately re-enters the deck. Do not alter art scale or raise an
      // entire morphology to hide an unfinished resting/foot-contact pose.
      if(valid)for(let i=0;i<4;i++){
        mesh.position.set(landing.x,0,landing.z);mesh.rotation.set(0,profile.yawStart+profile.yawDelta,0);
        spec.groundSampler(i*Math.PI/.86);
        const bounds=ceilingBounds(profile);
        if(bounds.min.y<-1e-5||bounds.max.y>6.12+1e-5){ceilingFailures.set(player,'ground');valid=false;break;}
        if(!clearCeilingVolume(map,bounds)){ceilingFailures.set(player,'space');valid=false;break;}
      }
    }finally{
      for(const snapshot of transforms){
        snapshot.object.position.copy(snapshot.position);snapshot.object.quaternion.copy(snapshot.quaternion);snapshot.object.scale.copy(snapshot.scale);
        if(snapshot.morph)snapshot.object.morphTargetInfluences.splice(0,snapshot.morph.length,...snapshot.morph);
      }
      mesh.position.copy(root.position);mesh.rotation.copy(root.rotation);mesh.scale.copy(root.scale);
      if(previousBase)model.userData.runtimeBasePose=previousBase;else delete model.userData.runtimeBasePose;
      mesh.updateMatrixWorld(true);
    }
    if(valid)ceilingFailures.delete(player);
    return valid?profile:null;
  }
  function canEnterCeiling(player,map,spec) {
    const mesh=player?.mesh,model=player?.detailedModel,T=spec.graphics;
    if(!mesh||!model||!T)return false;
    const position=mesh.position.clone(),rotation=mesh.rotation.clone();
    const modelPosition=model.position.clone(),modelQuaternion=model.quaternion.clone();
    let profile;
    try{
      mesh.position.set(player.x,5.85,player.z);mesh.rotation.x=0;
      model.position.set(0,0,0);model.rotation.set(Math.PI,0,0);
      const geometry=ceilingParts(model,T);
      if(!geometry){ceilingFailures.set(player,'geometry');return false;}
      const support={T,player,model,mesh,parts:geometry.parts,checks:geometry.checks,
        box:new T.Box3(),point:new T.Vector3(),matrix:new T.Matrix4()};
      const bounds=ceilingBounds(support);
      if(bounds.min.y<.025||bounds.max.y>6.10){ceilingFailures.set(player,'height');return false;}
      if(!clearCeilingVolume(map,bounds)){ceilingFailures.set(player,'space');return false;}
      profile=prepareCeilingMotion(player,map,{x:player.x,z:player.z},{...spec,arcHeight:0});
    }finally{
      mesh.position.copy(position);mesh.rotation.copy(rotation);
      model.position.copy(modelPosition);model.quaternion.copy(modelQuaternion);mesh.updateMatrixWorld(true);
    }
    return !!profile;
  }
  function updateCeilingSupport(player,T) {
    const model=player.detailedModel,mesh=player.mesh;if(!model||!T)return false;
    const geometry=ceilingParts(model,T);if(!geometry)return false;
    let support=ceilingSupports.get(model);
    if(!support||support.mesh!==mesh||support.parts!==geometry.parts){
      support={T,player,model,mesh,parts:geometry.parts,checks:geometry.checks,
        box:new T.Box3(),point:new T.Vector3(),matrix:new T.Matrix4()};ceilingSupports.set(model,support);
    }
    model.rotation.set(Math.PI,0,0);mesh.rotation.set(0,mesh.rotation.y,0);
    const bounds=ceilingBounds(support);
    if(bounds.max.y-bounds.min.y>6.075)return false;
    model.position.y+=Math.max(.025-bounds.min.y,Math.min(0,6.10-bounds.max.y));return true;
  }
  function restoreCeilingPose(motion) {
    const profile=motion.ceiling;if(!profile||motion.player.mesh!==motion.mesh||motion.player.detailedModel!==profile.model)return;
    profile.samplePose(1);
    profile.model.position.copy(profile.basePosition);profile.model.quaternion.identity();
    const bounds=ceilingBounds(profile);
    profile.model.position.y+=Math.max(.025-bounds.min.y,Math.min(0,6.10-bounds.max.y));
  }
  function updateMotionPose(player,progress) {
    const motion=playerMotions.get(player);if(!motion?.ceiling)return true;
    if(!motion.ceiling.checks.every(check=>check.valid())||!fitCeilingPose(motion.ceiling,progress)||!clearCeilingVolume(motion.map,motion.ceiling.box)){
      stopMotion(motion.state,motion);return false;
    }
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
    if(p.mesh===motion.mesh){p.mesh.position.set(p.x,0,p.z);p.mesh.rotation.x=0;restoreCeilingPose(motion);}
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
    const ceiling=spec.dropCeiling&&player.isCeilingProwling?prepareCeilingMotion(player,map,landing,spec):null;
    if(spec.dropCeiling&&player.isCeilingProwling&&!ceiling){
      const reason=ceilingFailures.get(player);
      failures.set(player,reason==='ground'?'Réception au sol non compatible avec cette morphologie.':
        reason==='height'?'Ce corps ne peut pas se retourner sous ce plafond.':
        'Espace insuffisant pour retourner ce corps sous le plafond : rejoignez un volume dégagé.');return false;
    }
    if(ceiling){
      if(!ceiling.model.userData.runtimeBasePose)ceiling.model.userData.runtimeBasePose=ceiling.groundBase;
      ceiling.samplePose(0);
      if(!fitCeilingPose(ceiling,0)||!clearCeilingVolume(map,ceiling.box)){
        for(const snapshot of ceiling.snapshots){snapshot.object.position.copy(snapshot.position);
          snapshot.object.quaternion.copy(snapshot.quaternion);snapshot.object.scale.copy(snapshot.scale);}
        if(ceiling.previousBase)ceiling.model.userData.runtimeBasePose=ceiling.previousBase;
        else delete ceiling.model.userData.runtimeBasePose;
        mesh.position.copy(ceiling.rootSnapshot.position);mesh.rotation.copy(ceiling.rootSnapshot.rotation);
        mesh.updateMatrixWorld(true);failures.set(player,'Le volume de départ est obstrué.');return false;
      }
    }
    const motion={player,game,state,map,landing,stage,mesh,caste,ceiling,complete:null,cancelled:false};
    let finished=false;
    motion.complete=()=>{
      if(finished||motion.cancelled)return;finished=true;state.motions.delete(motion);
      if(playerMotions.get(player)===motion)playerMotions.delete(player);
      if(player.mesh===mesh && (!player.leapHost || player.leapHost===landing)) {
        player.isLeaping=false;player.mesh?.position.set(player.x,0,player.z);
        if(player.mesh)player.mesh.rotation.x=0;
      }
      restoreCeilingPose(motion);
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
      if(ceiling){player.isProwling=false;player.speed=player.getAdultProfile().speed;}
      if(!ceiling&&player.detailedModel){player.detailedModel.rotation.x=0;player.detailedModel.position.y=0;}
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
  function descend(player,game,map,key,spec,preferred,onImpact) {
    if(preferred)return leap(player,game,map,key,spec,preferred,onImpact);
    // A non-offensive descent is an escape from the ceiling, not a second
    // attack. Keep it available during attack recovery, but never replace an
    // in-flight motion or lower the actor into an occupied deck footprint.
    if(!active(player,game,spec)||player.isLeaping){
      failures.set(player,game?.isSystemPaused?'Simulation en pause.':
        'Descente indisponible dans cette posture ou pendant un déplacement.');return false;
    }
    const landing=global.HiveGameplayControls?.sweptDestination(map,player,player,
      {range:0,padding:.88});
    if(!landing){failures.set(player,'Le pont est obstrué sous ce surplomb : déplacez-vous avant de descendre.');return false;}
    return beginMotion(player,game,map,'ceilingDescent',{...spec,cooldown:.35},landing,onImpact);
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
    targets,effectPath,selectTarget,landingNear,push,leap,descend,travel,cancelMotion,validateMotion,updateMotionPose,canEnterCeiling,updateCeilingSupport,contact,charge,defer,schedule,advanceClock,
    ceilingFailure:player=>ceilingFailures.get(player)||'',
    pending:game=>stageState(game)?.jobs.size||0,failure:player=>failures.get(player)||''});
})(typeof window==='undefined'?globalThis:window);
