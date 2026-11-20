/* Prepared native lifecycle diagnostics. Real methods are not replaced.
 * Fixed simulation ticks and host/biomass setups are explicitly fixtures. */
(() => {
  const q=window.__cycleQA,g=window.gameInstance,p=q.playerCreature,map=q.stationMap;
  const f={host:null,face:null,phases:[],samples:[],extractionSamples:[],
    require(pass,message){if(!pass)throw Error(message);},
    prepare(origin='starship',type='scientist'){
      g.campaignConfig.origin=origin;g.startCampaign(1);g.setSystemPaused(true);g.startCampaign(2);g.setSystemPaused(true);g.clearHumans();
      let point=null;
      for(const x of [-12,-4,4,12,28,-28])for(const z of [-8,8,20,-20,36,-36]){
        if(!point&&!map.checkCollision(x,z,.45)&&!map.checkCollision(x,z-2,.45)&&map.hasLineOfSight(x,z,x,z-2,.12))point={x,z};
      }
      this.require(point,'No native free host/leap fixture found');
      const host=new q.HumanAI(9401,type,point.x,point.z,'Hôte QA du cycle');host.createMesh();g.humans.push(host);
      p.x=point.x;p.z=point.z-2;p.mesh.position.set(p.x,.1,p.z);p.moveTarget=null;p.moveWaypoints=[];
      this.host=host;this.face=g.currentStage;this.phases=[];this.samples=[];this.extractionSamples=[];
      return {origin,hostId:host.id,host:[host.x,host.z],player:[p.x,p.z],fixture:'One actual host on a collider-free authored floor, no unrelated AI/map hazards stepped; actual host AI starts after attachment'};
    },
    addRoyalCandidate(){
      const first=this.host;
      first.characterKey='asterRho';first.maskAttachments=0;first.hostEligibility='viable';
      let point=null;
      for(const radius of [5,6,8,10])for(let i=0;i<16;i++){
        const x=first.x+Math.cos(i*Math.PI/8)*radius,z=first.z+Math.sin(i*Math.PI/8)*radius;
        if(!point&&!map.checkCollision(x,z,.6)&&map.hasLineOfSight(first.x,first.z,x,z,.2))point={x,z};
      }
      this.require(point,'No native lane for the distinct second host');
      const second=new q.HumanAI(9402,'colonist',point.x,point.z,'Second hôte QA du cycle');
      second.hostEligibility='viable';second.isRestrained=true;second.createMesh();g.humans.push(second);
      this.secondHost=second;
      return {first:first.id,second:second.id,point,fixture:'Distinct actual hosts are placed and the future candidate is restrained until approached'};
    },
    tick(dt=1/60){
      if(g.currentStageIndex!==5)p.update(dt);
      if(p.attachedHost||this.face.postImplantPhase||g.currentStageIndex!==2)for(const human of [...g.humans])human.update(dt);
      g.currentStage?.update(dt);window.HiveSystems.update(dt);window.HiveAssetLibrary?.update(dt);
      if(this.face.postImplantPhase&&this.phases.at(-1)!==this.face.postImplantPhase)this.phases.push(this.face.postImplantPhase);
      if(this.face.postImplantPhase)this.samples.push({x:this.host.x,z:this.host.z,phase:this.face.postImplantPhase,collision:map.checkCollision(this.host.x,this.host.z,.4)});
      if(g.currentStage?.step==='BURST_EXTRACTION'){
        const plan=g.currentStage.burstExtraction;
        this.extractionSamples.push({x:p.x,y:p.mesh.position.y,z:p.z,elapsed:plan.elapsed,collision:map.checkCollision(p.x,p.z,plan.clearance.radius),fullBodyClear:g.currentStage.isBurstExtractionPoseClear(plan,plan.elapsed/plan.duration)});
      }
    },
    step(frames){const paused=g.isSystemPaused;try{g.isSystemPaused=false;for(let i=0;i<frames;i++)this.tick();}finally{g.isSystemPaused=paused;}return this.snapshot();},
    until(predicate,maxFrames=5000){const paused=g.isSystemPaused;let frames=0;try{g.isSystemPaused=false;while(!predicate()&&frames++<maxFrames)this.tick();}finally{g.isSystemPaused=paused;}
      this.require(predicate(),'Cycle condition timed out: '+JSON.stringify(this.snapshot()));return {frames,state:this.snapshot()};},
    snapshot(){return {stage:g.currentStageIndex,step:g.currentStage?.step,phase:this.face?.postImplantPhase,phaseElapsed:this.face?.phaseElapsed,
      progress:this.face?.implantProgress,attachedElapsed:this.face?.attachedElapsed,hostId:this.host?.id,host:[this.host?.x,this.host?.z],
      infected:this.host?.isInfected,restrained:this.host?.isRestrained,hostState:this.host?.infectionState,
      attached:p.attachedHost===this.host,playerVisible:p.mesh?.visible,player:[p.x,p.mesh?.position.y,p.z],juvenileRadius:p.creatureEnvelope?.radius,form:p.form,caste:p.adultCaste,
      husk:!!this.face?.deadHusk?.parent,remaining:g.biologicalRemains?.size||0,phases:this.phases.slice()};},
    attachedPoseMetrics(){
      let runtime=null;this.host.mesh.traverse(node=>{runtime ||= window.HiveAssetLibrary.getRuntime(node);});
      this.require(runtime?.bindings?.leftHand&&runtime.bindings.rightHand,'Actual imported hand bindings unavailable');
      this.host.mesh.updateMatrixWorld(true);const face=this.host.faceAnchor.getWorldPosition(new THREE.Vector3());
      const actorInverse=this.host.mesh.matrixWorld.clone().invert(),center=face.clone().applyMatrix4(actorInverse);
      const hands=['leftHand','rightHand'].map(key=>{const world=runtime.bindings[key].getWorldPosition(new THREE.Vector3()),local=world.clone().applyMatrix4(actorInverse);
        const shoulder=runtime.bindings[key.replace('Hand','UpperArm')].getWorldPosition(new THREE.Vector3()).applyMatrix4(actorInverse);
        return {key,world:world.toArray(),relativeToFace:local.clone().sub(center).toArray(),sameSide:(local.x-center.x)*(shoulder.x-center.x)>0,distance:world.distanceTo(face)};});
      return {hands,face:face.toArray(),frozen:runtime.state.frozen,stageOwned:this.host.isRecoveringFromFacehugger};
    },
    attachmentBounds(){
      const model=p.detailedModel;model.updateWorldMatrix(true,true);
      const full=new THREE.Box3().setFromObject(model),visible=new THREE.Box3().makeEmpty(),invisible=[],rendered=[];
      model.traverse(node=>{if(node.visible===false)invisible.push(node.name||node.type);});
      model.traverseVisible(node=>{
        if(!node.isMesh||!node.geometry||(Array.isArray(node.material)?node.material.every(m=>m.visible===false):node.material?.visible===false))return;
        if(!node.geometry.boundingBox)node.geometry.computeBoundingBox();
        visible.union(node.geometry.boundingBox.clone().applyMatrix4(node.matrixWorld));rendered.push(node.name||node.type);
      });
      return {fullSize:full.getSize(new THREE.Vector3()).toArray(),visibleSize:visible.getSize(new THREE.Vector3()).toArray(),invisibleNodes:invisible,renderedMeshes:rendered.length};
    },
    draw(view='wide'){const r=q.rendererEngine,h=this.host,target=g.currentStageIndex===2||g.currentStageIndex===3&&g.currentStage.step==='INTERNAL_GESTATION'?h:p;
      g.setSystemPaused(true);document.getElementById('app-container').classList.remove('game-paused');
      r.camera.clearViewOffset();r.camera.position.set(target.x+8,8,target.z+11);r.camera.lookAt(target.x,1.7,target.z);r.camera.fov=46;r.camera.updateProjectionMatrix();
      if(view==='face'||view==='profile'){
        h.mesh.updateMatrixWorld(true);const face=h.faceAnchor.getWorldPosition(new THREE.Vector3()),rotation=h.mesh.getWorldQuaternion(new THREE.Quaternion());
        const front=new THREE.Vector3(0,0,1).applyQuaternion(rotation),right=new THREE.Vector3(1,0,0).applyQuaternion(rotation);
        r.camera.position.copy(face).addScaledVector(front,view==='face'?5:1.2).addScaledVector(right,view==='face'?.15:4.6).add(new THREE.Vector3(0,.15,0));
        r.camera.lookAt(face);r.camera.fov=35;r.camera.updateProjectionMatrix();
      }
      r.updatePropVisibility(target,false);for(let i=0;i<30;i++)r.updateWallVisibility({x:target.x,y:1.5,z:target.z},1/60);
      const override=g.currentStage?.getCameraOverride?.();if(override)r.snapCinematicCamera(override);
      r.render();r.renderer.getContext().finish();return this.snapshot();}
  };
  window.__cycleNative=f;return {ready:true};
})()
