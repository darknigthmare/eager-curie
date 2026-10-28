/* HIVE ASCENSION — local glTF 2.0 assets and per-actor animation ownership.
 * THREE, GLTFLoader and SkeletonUtils must all be the pinned r128 versions.
 * Templates/textures are cached; geometry, materials and skeletons are actor-owned.
 */
(function exposeAssetLibrary(global) {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const errorText = error => error instanceof Error ? error.message : String(error);
  const vectorKeys = ['leftUpperArm','rightUpperArm','leftForeArm','rightForeArm','leftHand','rightHand',
    'leftThigh','rightThigh','leftShin','rightShin','leftFoot','rightFoot','hips','spine','head','neck'];

  class AssetLibrary {
    constructor() {
      this.entries = new Map(); this.records = new Map(); this.instances = new Set();
      this.runtimeByRoot = new WeakMap(); this.fallbacks = [];
      this.manifestURL = null; this.manifestBase = null; this.nextId = 1;
    }
    _three() {
      const T = global.THREE;
      if (!T || T.REVISION !== '128' || !T.GLTFLoader || !T.SkeletonUtils?.clone) {
        throw new Error('Imported assets require the local THREE, GLTFLoader and SkeletonUtils r128 scripts.');
      }
      return T;
    }
    _url(url, base = this.manifestBase || global.document?.baseURI || global.location?.href) {
      const result = new URL(url, base);
      const origin = new URL(global.document?.baseURI || global.location?.href || base).origin;
      if (!['http:','https:'].includes(result.protocol) || result.origin !== origin || !result.pathname.startsWith('/assets/')) {
        throw new Error('Asset URLs must remain within this site’s /assets/ directory.');
      }
      return result.href;
    }
    async loadManifest(source = 'assets/models/manifest.json') {
      let manifest = source;
      if (typeof source === 'string') {
        this.manifestURL = this._url(source);
        const response = await fetch(this.manifestURL, {credentials:'same-origin'});
        if (!response.ok) throw new Error(`Asset manifest HTTP ${response.status}`);
        manifest = await response.json(); this.manifestBase = new URL('.', this.manifestURL).href;
      } else {
        this.manifestBase = global.document?.baseURI || global.location?.href;
      }
      if (!manifest || manifest.version !== 1 || !manifest.models || typeof manifest.models !== 'object' || Array.isArray(manifest.models)) {
        throw new Error('Expected an asset manifest with version:1 and a models dictionary.');
      }
      const entries = new Map();
      for (const [name, specification] of Object.entries(manifest.models)) {
        const entry = typeof specification === 'string' ? {url:specification} : {...specification};
        if (!name || (!entry.url && !entry.alias)) throw new Error(`Asset ${name} requires a URL or alias.`);
        if (entry.url) entry.url = this._url(entry.url);
        if (entry.height !== undefined && !(Number.isFinite(entry.height) && entry.height > 0)) throw new Error(`Invalid asset height: ${name}`);
        entry.name = name; entries.set(name, entry);
      }
      this.entries = entries;
      for (const name of entries.keys()) this._entry(name);
      return this.getDiagnostics();
    }
    _entry(name, chain = []) {
      const entry = this.entries.get(name);
      if (!entry) throw new Error(`Unknown imported asset: ${name}`);
      if (chain.includes(name)) throw new Error(`Circular asset alias: ${name}`);
      if (!entry.alias) return entry;
      return {...this._entry(entry.alias, [...chain,name]), ...entry, url:this._entry(entry.alias,[...chain,name]).url};
    }
    async load({urls}) { await this.loadManifest({version:1,models:urls}); return this.preload(); }
    async preload(names = Array.from(this.entries.keys()), options = {}) {
      if (typeof names === 'string') names = [names];
      const results = await Promise.all(names.map(async name => {
        try { await this._load(this._entry(name), options); return {name,ready:true}; }
        catch (error) { return {name,ready:false,error:errorText(error)}; }
      }));
      const report = {ready:results.filter(r=>r.ready).map(r=>r.name),failed:results.filter(r=>!r.ready)};
      if (options.required && report.failed.length) throw new Error(report.failed.map(r=>`${r.name}: ${r.error}`).join('; '));
      return report;
    }
    async _load(entry, options) {
      const T = this._three(); let record = this.records.get(entry.url);
      if (record?.status === 'ready') return record;
      if (record?.promise) return record.promise;
      if (record?.status === 'error' && !options.retry) throw new Error(record.error);
      record = {url:entry.url,status:'loading',error:null,gltf:null,instances:0,promise:null};
      this.records.set(entry.url,record);
      record.promise = (async()=>{
        const controller = new AbortController();
        const timer = setTimeout(()=>controller.abort(),options.timeoutMs || 45000);
        try {
          const response = await fetch(entry.url,{credentials:'same-origin',signal:controller.signal,...(entry.integrity?{integrity:entry.integrity}:{})});
          if (!response.ok) throw new Error(`Asset HTTP ${response.status}: ${new URL(entry.url).pathname}`);
          const buffer = await response.arrayBuffer();
          const manager = new T.LoadingManager();
          manager.setURLModifier(resource=>{
            if (/^(blob:|data:)/.test(resource)) return resource;
            return this._url(resource,new URL('.',entry.url).href);
          });
          const loader = new T.GLTFLoader(manager);
          const gltf = await new Promise((resolve,reject)=>loader.parse(buffer,new URL('.',entry.url).href,resolve,reject));
          if (!gltf.scene) throw new Error('glTF has no default scene.');
          let triangles=0,meshes=0,skinnedMeshes=0; const bones=new Set(),materials=new Set();
          gltf.scene.traverse(object=>{
            if(object.isBone)bones.add(object);
            if(!object.isMesh)return;
            meshes++; if(object.isSkinnedMesh)skinnedMeshes++;
            triangles+=(object.geometry.index?.count||object.geometry.attributes.position.count)/3;
            (Array.isArray(object.material)?object.material:[object.material]).forEach(m=>materials.add(m));
          });
          if(!meshes||!Number.isFinite(triangles))throw new Error('glTF has no usable finite mesh.');
          record.gltf=gltf;record.status='ready';
          record.statistics={triangles,meshes,skinnedMeshes,bones:bones.size,materials:materials.size,clips:gltf.animations.map(c=>c.name)};
          return record;
        } catch(error) {
          record.status='error';record.error=errorText(error);throw error;
        } finally {clearTimeout(timer);record.promise=null;}
      })();
      return record.promise;
    }
    has(name) { return this.entries.has(name); }
    isReady(name) { try{return this.records.get(this._entry(name).url)?.status==='ready';}catch{return false;} }
    reportFallback(name,reason='Asset is unavailable') {
      this.fallbacks.push({assetId:name,status:'fallback',reason});
      if(this.fallbacks.length>64)this.fallbacks.shift();
    }
    _find(root, specification) {
      const names=Array.isArray(specification)?specification:[specification];
      for(const name of names){
        if(!name)continue;
        const exact=root.getObjectByName(name);if(exact)return exact;
        const sanitized=global.THREE.PropertyBinding.sanitizeNodeName(name);
        const node=root.getObjectByName(sanitized);if(node)return node;
      }
      return null;
    }
    _skinBounds(root) {
      const T=this._three(),box=new T.Box3(),point=new T.Vector3();box.makeEmpty();
      let hierarchyRoot=root;while(hierarchyRoot.parent)hierarchyRoot=hierarchyRoot.parent;
      hierarchyRoot.updateMatrixWorld(true);
      root.traverse(object=>{if(object.isSkinnedMesh)object.skeleton.update();});
      root.traverse(object=>{
        if(!object.isMesh||!object.geometry?.attributes.position)return;
        const position=object.geometry.attributes.position;
        for(let i=0;i<position.count;i++){
          point.fromBufferAttribute(position,i);
          if(object.isSkinnedMesh)object.boneTransform(i,point);
          point.applyMatrix4(object.matrixWorld);
          if(!Number.isFinite(point.x+point.y+point.z))throw new Error('Nonfinite skinned bounds.');
          box.expandByPoint(point);
        }
      });
      if(box.isEmpty())throw new Error('Asset bounds are empty.');
      return box;
    }
    instantiate(name, options = {}) {
      let entry,record;
      try{entry={...this._entry(name),...options};record=this.records.get(entry.url);}catch(error){this.reportFallback(name,errorText(error));return null;}
      if(record?.status!=='ready'){this.reportFallback(name,record?.error||'Asset has not loaded.');return null;}
      const T=this._three(),root=new T.Group(),fit=new T.Group();
      const content=T.SkeletonUtils.clone(record.gltf.scene);
      const geometries=new Map(),materials=new Map(),skeletons=new Set();
      content.traverse(object=>{
        if(!object.isMesh)return;
        if(!geometries.has(object.geometry))geometries.set(object.geometry,object.geometry.clone());
        object.geometry=geometries.get(object.geometry);
        const cloneMaterial=material=>{
          if(!materials.has(material)){const clone=material.clone();clone.userData.hiveImportedAsset=name;materials.set(material,clone);}
          return materials.get(material);
        };
        object.material=Array.isArray(object.material)?object.material.map(cloneMaterial):cloneMaterial(object.material);
        object.castShadow=true;object.receiveShadow=true;
        if(object.isSkinnedMesh){skeletons.add(object.skeleton);object.frustumCulled=false;}
      });
      root.name=`asset_${name}`;fit.name='imported_asset_normalization';fit.add(content);root.add(fit);
      if(entry.rotation)fit.rotation.fromArray(entry.rotation);
      const bindings={};for(const[key,specification]of Object.entries(entry.bindings||{})){const bone=this._find(content,specification);if(bone)bindings[key]=bone;}
      const runtime={id:this.nextId++,assetId:name,sourceUrl:entry.url,root,fit,content,entry,record,bindings,skeletons,
        geometries:new Set(geometries.values()),materials:new Set(materials.values()),mixer:null,actions:new Map(),
        state:{movement:0,attack:0},elapsed:0,mode:'static',currentAction:null,currentState:null,disposed:false,bindPose:[],warnings:[],
        resourcesPending:new Set([...geometries.values(),...materials.values()])};
      for(const resource of runtime.resourcesPending)resource.addEventListener('dispose',()=>runtime.resourcesPending.delete(resource));
      this.runtimeByRoot.set(root,runtime);this.instances.add(runtime);record.instances++;
      try{
        for(const key of entry.requiredBones||[])if(!bindings[key])throw new Error(`Missing required bone binding: ${key}`);
        const fallback=entry.rigFallback==='biped'&&Object.keys(bindings).length>0;
        if(fallback&&entry.neutralizeArms!==false)this._neutralizeArms(runtime);
        const initial=this._skinBounds(root),height=initial.max.y-initial.min.y;
        if(!(height>0&&Number.isFinite(height)))throw new Error('Asset has invalid height.');
        const target=entry.height||height,scale=target/height,center=initial.getCenter(new T.Vector3());
        fit.scale.setScalar(scale);fit.position.set(-center.x*scale,-initial.min.y*scale,-center.z*scale);
        if(entry.offset)fit.position.add(new T.Vector3().fromArray(entry.offset));
        root.updateMatrixWorld(true);runtime.bounds=this._skinBounds(root);
        this._capturePose(runtime);
        if(record.gltf.animations.length){
          runtime.mixer=new T.AnimationMixer(content);
          for(const clip of record.gltf.animations)runtime.actions.set(clip.name,runtime.mixer.clipAction(clip));
        }
        runtime.canFallback=fallback;
        const face=entry.anchors?.face;
        if(face){
          const bone=bindings[face.bone]||this._find(content,face.bone);
          if(!bone)throw new Error(`Face anchor bone is unavailable: ${face.bone}`);
          const anchor=new T.Group();anchor.name='face_attachment_anchor';
          anchor.position.fromArray(face.position||[0,0,0]);if(face.rotation)anchor.rotation.fromArray(face.rotation);
          bone.add(anchor);
          // FBX rigs can retain centimetre bone transforms inside a metre glTF.
          // Keep the measured bone-local position, but attachments inherit only
          // the actor's scale rather than that intrinsic skeleton conversion.
          root.updateMatrixWorld(true);
          const boneScale=bone.getWorldScale(new T.Vector3()),rootScale=root.getWorldScale(new T.Vector3());
          if(Math.min(Math.abs(boneScale.x),Math.abs(boneScale.y),Math.abs(boneScale.z))<1e-8)throw new Error('Face anchor has a singular bone scale.');
          anchor.scale.copy(rootScale).divide(boneScale);
          root.userData.faceAnchor=anchor;runtime.faceAnchor=anchor;
        }
        root.userData.assetRuntime=runtime;root.userData.hiveImportedModel=true;root.userData.hiveAssetId=name;
        root.userData.assetSource=entry.url;root.userData.height=target;
        root.userData.assetBounds={min:runtime.bounds.min.toArray(),max:runtime.bounds.max.toArray()};
        root.userData.animationRig={kind:'asset',joints:bindings,roles:{locomotion:[],attack:[]},resetPose:()=>{}};
        root.userData.dispose=()=>this.disposeModel(root);
        root.userData.setFoldedPose=folded=>this.setState(root,{folded:!!folded});
        if(entry.morphs?.open)root.userData.setOpenProgress=value=>{
          const progress=clamp(Number(value)||0,0,1);
          content.traverse(mesh=>{const index=mesh.morphTargetDictionary?.[entry.morphs.open];if(index!==undefined)mesh.morphTargetInfluences[index]=progress;});
        };
        this.setState(root,{movement:0,attack:0});this.updateModel(root,0);
        return root;
      }catch(error){runtime.error=errorText(error);this.reportFallback(name,runtime.error);this.disposeModel(root);return null;}
    }
    _neutralizeArms(runtime) {
      const T=this._three();runtime.root.updateMatrixWorld(true);
      const rootQ=runtime.root.getWorldQuaternion(new T.Quaternion());
      for(const[side,defaultSign]of[['left',1],['right',-1]]){
        const upper=runtime.bindings[`${side}UpperArm`],fore=runtime.bindings[`${side}ForeArm`];if(!upper||!fore)continue;
        const direction=fore.getWorldPosition(new T.Vector3()).sub(upper.getWorldPosition(new T.Vector3())).normalize();
        const shoulder=runtime.root.worldToLocal(upper.getWorldPosition(new T.Vector3()));
        const sign=Math.sign(shoulder.x)||defaultSign;
        const target=new T.Vector3(sign*.15,-1,.05).normalize().applyQuaternion(rootQ);
        const delta=new T.Quaternion().setFromUnitVectors(direction,target);
        const world=delta.multiply(upper.getWorldQuaternion(new T.Quaternion()));
        const parent=upper.parent.getWorldQuaternion(new T.Quaternion()).invert();
        upper.quaternion.copy(parent.multiply(world));runtime.root.updateMatrixWorld(true);
      }
    }
    _capturePose(runtime) {
      const T=this._three();runtime.root.updateMatrixWorld(true);
      const rootQ=runtime.root.getWorldQuaternion(new T.Quaternion());
      for(const key of vectorKeys){const bone=runtime.bindings[key];if(!bone)continue;
        const inverse=bone.getWorldQuaternion(new T.Quaternion()).invert();
        runtime.bindPose.push({key,bone,quaternion:bone.quaternion.clone(),position:bone.position.clone(),
          x:new T.Vector3(1,0,0).applyQuaternion(rootQ).applyQuaternion(inverse).normalize(),
          y:new T.Vector3(0,1,0).applyQuaternion(rootQ).applyQuaternion(inverse).normalize(),
          z:new T.Vector3(0,0,1).applyQuaternion(rootQ).applyQuaternion(inverse).normalize()});
      }
      runtime.overlayPose=runtime.bindPose.map(pose=>({bone:pose.bone,quaternion:pose.bone.quaternion.clone()}));
      runtime.overlayApplied=false;
    }
    handlesRoot(root) { return this.runtimeByRoot.has(root); }
    getRuntime(root) { return this.runtimeByRoot.get(root)||null; }
    setState(root,state={}) {const runtime=this.runtimeByRoot.get(root);if(!runtime||runtime.disposed)return false;Object.assign(runtime.state,state);return true;}
    _action(runtime,state) {
      const aliases=runtime.entry.animations||{};
      const configured=aliases[state];
      if(configured&&runtime.actions.has(configured))return runtime.actions.get(configured);
      const candidates={idle:['idle','stand'],walk:['walk'],run:['run','jog'],attack:['attack','melee'],death:['death','die'],folded:['folded','attach']}[state]||[state];
      for(const[name,action]of runtime.actions)if(candidates.some(word=>name.toLowerCase().includes(word)))return action;
      return null;
    }
    _boneAnimation(runtime) {
      const T=this._three(),movement=clamp(Number(runtime.state.movement)||0,0,1),attack=clamp(Number(runtime.state.attack)||0,0,1);
      const phase=runtime.elapsed*6.4,swing=Math.sin(phase)*movement,envelope=Math.sin(attack*Math.PI);
      for(const pose of runtime.bindPose){
        pose.bone.quaternion.copy(pose.quaternion);pose.bone.position.copy(pose.position);
        let angle=0,axis=pose.x;
        if(pose.key==='leftThigh')angle=swing*.43;
        if(pose.key==='rightThigh')angle=-swing*.43;
        if(pose.key==='leftShin')angle=Math.max(0,-swing)*.58;
        if(pose.key==='rightShin')angle=Math.max(0,swing)*.58;
        if(pose.key==='leftUpperArm')angle=-swing*.26-envelope*.65;
        if(pose.key==='rightUpperArm')angle=swing*.26-envelope*.65;
        if(pose.key.endsWith('ForeArm'))angle=-.08-Math.abs(swing)*.1-envelope*.4;
        if(pose.key==='spine')angle=movement*.055-envelope*.08;
        if(pose.key==='head'){axis=pose.y;angle=Math.sin(runtime.elapsed*.9)*.025;}
        if(angle)pose.bone.quaternion.multiply(new T.Quaternion().setFromAxisAngle(axis,angle));
      }
    }
    _restoreOverlay(runtime) {
      if(!runtime.overlayApplied)return;
      for(const pose of runtime.overlayPose)pose.bone.quaternion.copy(pose.quaternion);
      runtime.overlayApplied=false;
    }
    _overlayAnimation(runtime) {
      const s=runtime.state,poseName=String(s.pose||'').toLowerCase();
      const attack=clamp(Number(s.attack)||0,0,1),envelope=Math.sin(attack*Math.PI);
      const crouch=clamp(Number(s.crouch)||0,0,1);
      if(!poseName&&!envelope&&!crouch)return;
      const T=this._three(),phase=Number.isFinite(s.phase)?s.phase:runtime.elapsed*6.4;
      const progress=clamp(Number(s.poseProgress)||0,0,1);
      for(const saved of runtime.overlayPose)saved.quaternion.copy(saved.bone.quaternion);
      runtime.overlayApplied=true;
      for(const pose of runtime.bindPose){
        const key=pose.key,side=key.startsWith('left')?-1:1;
        let x=0,y=0,z=0;
        if(crouch){
          if(key==='spine')x+=crouch*.16;
          if(key.endsWith('Thigh'))x-=crouch*.24;
          if(key.endsWith('Shin'))x+=crouch*.36;
        }
        if(envelope){
          const ranged=/shot|fire|burst|rifle|gun|spit/i.test(String(s.action||''));
          if(key.endsWith('UpperArm'))x-=envelope*(ranged ? .44 : .7);
          if(key.endsWith('ForeArm'))x-=envelope*(ranged ? .48 : .32);
          if(key==='spine')x-=envelope*.08;
        }
        if(poseName==='struggle'||poseName==='attached'){
          if(key.endsWith('UpperArm')){x-=1.08+Math.sin(phase*1.3+side)*.16;z+=side*.24;}
          if(key.endsWith('ForeArm'))x-=.78;
          if(key==='head'){y+=Math.sin(phase*1.1)*.1;z+=Math.sin(phase*.8)*.07;}
          if(key==='spine')x+=Math.sin(phase*.8)*.05;
        }else if(poseName==='unconscious'||poseName==='waking'){
          const weight=poseName==='waking'?1-progress:1;
          if(key.endsWith('UpperArm'))z+=side*.22*weight;
          if(key.endsWith('ForeArm'))x-=.12*weight;
          if(key==='head'){z+=.22*weight;x+=.14*weight;}
          if(key==='spine')x+=.12*weight;
          if(poseName==='waking'&&key==='head')y+=Math.sin(phase*.7)*.1*progress;
        }else if(poseName==='discovery'){
          if(key==='head')x+=.4;
          if(key==='spine')x+=.15;
          if(key==='leftUpperArm'){x-=.76;z-=.22;}
          if(key==='leftForeArm')x-=1.05;
          if(key==='rightUpperArm'){x-=.4;z+=.38;}
          if(key==='rightForeArm')x-=.65;
        }else if(poseName==='panic'){
          if(key.endsWith('UpperArm')){x-=.34;z+=side*.18;}
          if(key==='head')y+=Math.sin(phase*.65)*.28;
          if(key==='spine')x+=.16;
        }else if(poseName==='gestation'){
          const pain=progress*progress*(3-2*progress);
          const contraction=Math.sin(phase*1.35)*.035*pain;
          if(key==='spine')x+=pain*.22+contraction;
          if(key==='head')x+=pain*.24+contraction;
          if(key.endsWith('UpperArm')){x-=pain*(side<0 ? .58 : .42);z-=side*pain*.23;}
          if(key.endsWith('ForeArm'))x-=pain*(side<0 ? 1.02 : .88);
          if(key.endsWith('Hand'))y+=side*pain*.12;
          if(key.endsWith('Thigh'))x-=pain*.07;
          if(key.endsWith('Shin'))x+=pain*.12;
        }else if(poseName==='emergence'){
          const folded=1-progress*progress*(3-2*progress);
          const push=Math.sin(Math.min(1,progress/.75)*Math.PI);
          if(key==='spine')x+=folded*.34;
          if(key==='head')x+=folded*.35-push*.18;
          if(key.endsWith('UpperArm')){x-=folded*.98+push*.2;z+=side*(folded*.18+push*.5);}
          if(key.endsWith('ForeArm'))x-=folded*.6;
          if(key.endsWith('Thigh'))x-=folded*.62;
          if(key.endsWith('Shin'))x+=folded*.95;
        }else if(poseName==='chestburst'||poseName==='pain'){
          if(key.endsWith('UpperArm')){x-=.95;z-=side*.32;}
          if(key.endsWith('ForeArm'))x-=1.04;
          if(key==='head')x-=.27+Math.sin(phase*3.2)*.08;
          if(key==='spine')x-=.18+Math.sin(phase*2.6)*.04;
        }
        if(x)pose.bone.quaternion.multiply(new T.Quaternion().setFromAxisAngle(pose.x,x));
        if(y)pose.bone.quaternion.multiply(new T.Quaternion().setFromAxisAngle(pose.y,y));
        if(z)pose.bone.quaternion.multiply(new T.Quaternion().setFromAxisAngle(pose.z,z));
      }
    }
    updateModel(root,deltaSeconds=0,state) {
      const runtime=this.runtimeByRoot.get(root);if(!runtime||runtime.disposed)return false;
      if(state)this.setState(root,state);
      if(runtime.state.frozen){runtime.currentState='frozen';return true;}
      // Remove last frame's additive pose before the authored clip evaluates.
      // Bones absent from a clip must not accumulate our recovery offsets.
      this._restoreOverlay(runtime);
      const delta=clamp(Number(deltaSeconds)||0,0,.1);runtime.elapsed+=delta;
      const s=runtime.state;
      const locomotion=(Number(s.movement)||0)>.85?'run':((Number(s.movement)||0)>.04?'walk':'idle');
      const name=s.dead?'death':(s.pose?String(s.pose):(s.folded?'folded':((Number(s.attack)||0)>.03?'attack':locomotion)));
      let action=this._action(runtime,name),actionState=name;
      if(!action&&name==='run'){action=this._action(runtime,'walk');actionState='walk';}
      // A pack with locomotion clips may not include attacks or coughing. Keep
      // its authored base pose alive instead of freezing mid-stride or exposing
      // the bind pose until gameplay returns to locomotion.
      if(!action&&runtime.actions.size){
        action=this._action(runtime,locomotion);actionState=locomotion;
        if(!action&&locomotion==='run'){action=this._action(runtime,'walk');actionState='walk';}
        if(!action){action=this._action(runtime,'idle');actionState='idle';}
      }
      if(action){
        if(runtime.currentAction!==action){
          const previous=runtime.currentAction;
          previous?.fadeOut(.16);action.reset().setEffectiveWeight(1);
          if(previous)action.fadeIn(.16);
          action.play();
          action.setLoop(actionState==='death'?global.THREE.LoopOnce:global.THREE.LoopRepeat,actionState==='death'?1:Infinity);
          action.clampWhenFinished=actionState==='death';runtime.currentAction=action;
        }
        runtime.mode='clips';runtime.currentState=name;runtime.actionState=actionState;runtime.mixer.update(delta);
      }else if(runtime.canFallback){
        if(runtime.currentAction){runtime.mixer.stopAllAction();runtime.currentAction=null;}
        runtime.mode='bone-fallback';runtime.currentState=name;this._boneAnimation(runtime);
      }else{runtime.mode='static';runtime.currentState=name;}
      this._overlayAnimation(runtime);
      return true;
    }
    update(deltaSeconds) {for(const runtime of this.instances)this.updateModel(runtime.root,deltaSeconds);}
    getModelBounds(root,targetBox) {
      const T=this._three(),box=targetBox||new T.Box3();
      if(!root?.traverse)return box.makeEmpty();
      return box.copy(this._skinBounds(root));
    }
    _cleanup(runtime) {
      if(runtime.disposed)return false;
      runtime.disposed=true;runtime.mixer?.stopAllAction();runtime.mixer?.uncacheRoot(runtime.content);
      for(const skeleton of runtime.skeletons)skeleton.dispose();
      runtime.record.instances=Math.max(0,runtime.record.instances-1);this.instances.delete(runtime);
      return true;
    }
    disposeModel(root) {
      const runtime=this.runtimeByRoot.get(root);if(!runtime)return false;
      const changed=this._cleanup(runtime);
      if(!changed&&!runtime.resourcesPending.size)return false;
      const children=[];root.traverse(child=>{if(child!==root&&this.handlesRoot(child))children.push(child);});
      for(const child of children)this.disposeModel(child);
      const owned=new Set(runtime.resourcesPending);
      // Actor-local additions (command rings, attached procedural effects) are
      // part of the same subtree; textures remain owned by their separate cache.
      root.traverse(child=>{
        if(child.geometry)owned.add(child.geometry);
        if(child.material)for(const material of Array.isArray(child.material)?child.material:[child.material])owned.add(material);
      });
      for(const resource of owned)resource.dispose();
      root.parent?.remove(root);return changed;
    }
    disposeObject(object,{disposeResources=false}={}) {
      const roots=[];object?.traverse(child=>{if(this.handlesRoot(child))roots.push(child);});
      for(const root of roots){
        if(disposeResources)this.disposeModel(root);
        else this._cleanup(this.runtimeByRoot.get(root));
      }
      // Cleanup-only is for renderer/factory callers that immediately perform
      // their existing, deduplicated geometry/material disposal traversal.
      return roots.length;
    }
    disposeCache() {
      if(this.instances.size)throw new Error('Dispose live asset instances before their shared texture cache.');
      if(Array.from(this.records.values()).some(record=>record.status==='loading'))throw new Error('Wait for pending asset loads before clearing their cache.');
      const geometries=new Set(),materials=new Set(),textures=new Set();
      for(const record of this.records.values())record.gltf?.scene.traverse(object=>{
        if(object.geometry)geometries.add(object.geometry);
        if(object.material)for(const material of Array.isArray(object.material)?object.material:[object.material]){
          materials.add(material);for(const value of Object.values(material))if(value?.isTexture)textures.add(value);
        }
      });
      for(const geometry of geometries)geometry.dispose();for(const material of materials)material.dispose();for(const texture of textures)texture.dispose();
      for(const image of new Set(Array.from(textures,texture=>texture.image)))if(typeof image?.close==='function')image.close();
      this.records.clear();
    }
    getDiagnostics() {
      return {manifestURL:this.manifestURL,entries:Array.from(this.entries.keys()).map(name=>{
        const entry=this._entry(name),record=this.records.get(entry.url);
        return {assetId:name,url:entry.url,status:record?.status||'not_loaded',error:record?.error||null,...record?.statistics};
      }),fallbacks:this.fallbacks.slice(),instances:Array.from(this.instances,r=>({id:r.id,assetId:r.assetId,url:r.sourceUrl,status:'ready',
        ...r.record.statistics,animationMode:r.mode,state:r.currentState,actionState:r.actionState||null,
        activeClip:r.currentAction?.getClip().name||null,mixerTime:r.mixer?.time??null,rigTime:r.elapsed,disposed:r.disposed,
        bindings:Object.keys(r.bindings),height:r.root.userData.height,hasFaceAnchor:!!r.faceAnchor,
        faceAnchorPosition:r.faceAnchor?r.faceAnchor.getWorldPosition(new global.THREE.Vector3()).toArray():null})),cachedSources:this.records.size};
    }
  }
  global.HiveAssetLibrary=new AssetLibrary();
}(typeof window!=='undefined'?window:globalThis));
