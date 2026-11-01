/* HIVE ASCENSION — local glTF 2.0 assets and per-actor animation ownership.
 * THREE, GLTFLoader and SkeletonUtils must all be the pinned r128 versions.
 * Templates/textures are cached; geometry, materials and skeletons are actor-owned.
 */
(function exposeAssetLibrary(global) {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const hostSides = ['left','right'];
  const hostSmooth = (p,a,b) => {const t=clamp((p-a)/(b-a),0,1);return t*t*(3-2*t);};
  const hasHostSupports = performance => performance?.pose==='waking'&&performance.progress>.02;
  const errorText = error => error instanceof Error ? error.message : String(error);
  const vectorKeys = ['leftUpperArm','rightUpperArm','leftForeArm','rightForeArm','leftHand','rightHand',
    'leftThigh','rightThigh','leftShin','rightShin','leftFoot','rightFoot','hips','spine','head','neck'];

  // A performance is sampled on an explicit simulation timeline. The body
  // changes support (feet -> knees/hip -> elbow -> seat -> feet); it is never
  // a rigid standing person rotated upright around the ankles.
  const hostFields = ['pitch','roll','lift','shift','hipHeight','spineX','spineY','spineZ','headX','headY','headZ','neckX',
    ...['left','right'].flatMap(side=>['UpperArmX','UpperArmZ','ForeArmX','HandX','ThighX','ThighZ','ShinX','FootX',
      'Face','Brace','Rest'].map(part=>side+part))];
  const hostNeutral = Object.fromEntries(hostFields.map(key=>[key,0]));
  const hostFrame = (t,values={})=>Object.freeze({t,...hostNeutral,...values});
  const hostLying = {pitch:-Math.PI/2,lift:.52,spineX:.04,headX:.10,headZ:.08,
    leftUpperArmX:-.09,leftUpperArmZ:.10,leftForeArmX:-.12,rightUpperArmX:-.04,rightUpperArmZ:.13,rightForeArmX:-.10,
    leftThighX:-.05,rightThighX:.04,leftShinX:.10,rightShinX:.08};
  const hostRecovery = [hostFrame(0,hostLying),
    hostFrame(.16,{...hostLying,pitch:-1.43,roll:.12,hipHeight:.22,rightBrace:1,rightForeArmX:-.60,headX:.18}),
    hostFrame(.34,{pitch:-.62,roll:.06,hipHeight:.24,spineX:-.35,headX:.72,neckX:.25,
      leftThighX:-.90,rightThighX:-.85,leftShinX:.25,rightShinX:.24,leftUpperArmX:.75,leftForeArmX:-.25,leftRest:1,rightBrace:1}),
    hostFrame(.46,{pitch:-.35,hipHeight:.21,shift:-.25,spineX:-.95,headX:1,neckX:.32,
      leftThighX:-1.52,rightThighX:-1.48,leftShinX:.22,rightShinX:.20,leftUpperArmX:.85,leftForeArmX:-.45,leftRest:1,rightBrace:1}),
    hostFrame(.66,{pitch:-.06,hipHeight:.47,shift:-.70,spineX:.20,headX:.14,
      leftThighX:-1.05,rightThighX:.55,leftShinX:1.80,rightShinX:1.60,leftUpperArmX:-.45,leftForeArmX:-.70,leftRest:1}),
    hostFrame(.84,{pitch:-.03,hipHeight:.79,shift:-.30,spineX:.26,headX:.12,
      leftThighX:-.60,rightThighX:-.56,leftShinX:1,rightShinX:.94,leftUpperArmX:-.35,leftForeArmX:-.40,leftRest:.6,
      rightUpperArmX:-.20,rightForeArmX:-.35}),
    hostFrame(1,{hipHeight:1,spineX:.035,headX:.14,leftUpperArmX:-.08,leftForeArmX:-.18,rightForeArmX:-.08})];
  const hostCollapse = [hostFrame(0,{spineX:-.10,headX:-.06,leftFace:1,rightFace:1,leftThighX:-.08,rightThighX:-.08,leftShinX:.14,rightShinX:.14}),
    hostFrame(.22,{pitch:-.08,lift:-.20,spineX:-.12,leftFace:1,rightFace:1,leftThighX:-.42,rightThighX:-.38,leftShinX:.68,rightShinX:.62}),
    hostFrame(.48,{pitch:-.45,lift:-.55,shift:-.05,spineX:.20,headX:.03,leftFace:.55,rightFace:.35,rightBrace:.30,
      leftThighX:-.72,rightThighX:-.62,leftShinX:1.20,rightShinX:1.05}),
    hostFrame(.72,{pitch:-1.10,lift:-.15,headX:.08,leftUpperArmX:-.16,leftForeArmX:-.40,rightBrace:.8,
      leftThighX:-.25,rightThighX:-.18,leftShinX:.55,rightShinX:.38}),hostFrame(1,hostLying)];
  const hostNames = new Set(['egg-approach','egg-observe','facehugger-contact','facehugger-struggle',
    'host-collapse','unconscious','waking','discovery','panic']);
  function sampleHostPerformance(pose,progress=0,phase=0,target={}) {
    const name=String(pose||'').toLowerCase();if(!hostNames.has(name))return null;
    const p=clamp(Number(progress)||0,0,1),time=Number.isFinite(phase)?phase:0;
    for(const key of hostFields)target[key]=0;
    target.pose=name;target.progress=p;target.phase=time;
    target.procedural=!['egg-approach','egg-observe','panic'].includes(name);
    target.grounded=name!=='panic';
    if(name==='waking'||name==='host-collapse'){
      const frames=name==='waking'?hostRecovery:hostCollapse;
      let end=1;while(end<frames.length-1&&p>frames[end].t)end++;
      const a=frames[end-1],b=frames[end],raw=clamp((p-a.t)/(b.t-a.t),0,1),t=raw*raw*(3-2*raw);
      for(const key of hostFields)target[key]=a[key]+(b[key]-a[key])*t;
    }else if(name==='unconscious')Object.assign(target,hostLying);
    else if(name==='egg-observe'){
      target.spineX=.10;target.neckX=.06;target.headX=.17+Math.sin(time*.35)*.018;
      target.headY=Math.sin(time*.22)*.035;target.leftForeArmX=-.12;target.rightForeArmX=-.08;
    }else if(name==='facehugger-contact'||name==='facehugger-struggle'){
      const contact=name==='facehugger-contact'?p*p*(3-2*p):1;
      target.pitch=-.035*contact;target.roll=Math.sin(time*.75)*.025*contact;
      target.spineX=-.10*contact;target.headX=-.06*contact;target.headZ=Math.sin(time*.8)*.025*contact;
      target.leftFace=contact;target.rightFace=contact;
      target.leftThighX=-.08*contact;target.rightThighX=-.05*contact;target.leftShinX=.14*contact;target.rightShinX=.10*contact;
    }else if(name==='discovery'){
      const t=p*p*(3-2*p);target.spineX=.13;target.headX=.37;
      target.leftUpperArmX=-.45;target.leftForeArmX=-.95;target.rightUpperArmX=-.18;target.rightForeArmX=-.38;
      target.headY=Math.sin(time*.32)*.08;target.shift=-.12*t;
    }else if(name==='panic'){
      target.spineX=.10;target.headY=Math.sin(time*.42)*.16;
    }
    return target;
  }
  function hostModel(container) {
    let model=null;container?.traverse?.(object=>{
      if(!model&&(global.HiveAssetLibrary?.handlesRoot?.(object)||object.userData?.hostPerformanceRig))model=object;
    });return model;
  }
  function isHumanMesh(object,root) {
    for(let at=object;at&&at!==root;at=at.parent){
      if(at.userData?.modelType==='facehugger'||at.userData?.modernLifecycle?.family==='facehugger'||
        at.name==='imported_weapon_grip'||(/_equipment$/.test(at.name||'')&&at.userData?.equipmentType)||
        /^(facehugger|crawler)_/.test(at.name||''))return false;
    }
    return true;
  }
  function groundHost(container,model,groundY=.025,measureOnly=false) {
    const T=global.THREE;if(!T||!container||!model)return;
    const scratch=model.userData.hostGroundScratch ||= {point:new T.Vector3(),box:new T.Box3(),min:new T.Vector3(),max:new T.Vector3()};
    let hierarchy=container;while(hierarchy.parent)hierarchy=hierarchy.parent;hierarchy.updateMatrixWorld(true);
    let minimum=Infinity;
    model.traverse(object=>{
      if(!object.isMesh||!object.geometry?.attributes?.position||!isHumanMesh(object,model))return;
      for(let at=object;at&&at!==model.parent;at=at.parent)if(!at.visible)return;
      const geometry=object.geometry,point=scratch.point;
      if(object.isSkinnedMesh){
        object.skeleton.update();const positions=geometry.attributes.position;
        for(let i=0;i<positions.count;i++){
          point.fromBufferAttribute(positions,i);object.boneTransform(i,point);point.applyMatrix4(object.matrixWorld);
          minimum=Math.min(minimum,point.y);
        }
      }else{
        const positions=geometry.attributes.position;
        for(let i=0;i<positions.count;i++){
          point.fromBufferAttribute(positions,i).applyMatrix4(object.matrixWorld);
          minimum=Math.min(minimum,point.y);
        }
      }
    });
    if(measureOnly)return minimum;
    if(Number.isFinite(minimum)){
      container.position.y+=groundY-minimum;
      container.updateMatrixWorld(true);
    }
  }
  function applyHostRoot(container,performance) {
    if(!container||!performance||!hostNames.has(performance.pose))return false;
    const model=hostModel(container);if(!model)return false;
    const yaw=container.rotation.y,scale=(Number(model.userData.height)||4.25)/4.25,baseX=container.position.x,baseZ=container.position.z;
    container.rotation.order='YXZ';
    container.rotation.x=performance.pitch;container.rotation.z=performance.roll;
    container.position.y=performance.lift*scale;
    container.position.x+=Math.sin(yaw)*performance.shift*scale;
    container.position.z+=Math.cos(yaw)*performance.shift*scale;
    model.userData.hostPerformanceContext ||= {};
    Object.assign(model.userData.hostPerformanceContext,{container,pose:performance.pose,groundY:.025,yaw,baseX,baseZ,performance});
    const runtime=global.HiveAssetLibrary?.getRuntime?.(model)||model.userData.hostPerformanceRig;
    if(runtime)runtime.hostSupportClearance=0;
    if(performance.grounded)groundHostSupported(container,model);
    return true;
  }
  function groundHostSupported(container,model,groundY=.025) {
    const library=global.HiveAssetLibrary,runtime=library?.getRuntime?.(model)||model?.userData?.hostPerformanceRig;
    const context=model?.userData?.hostPerformanceContext;
    if(runtime&&hasHostSupports(context?.performance)){
      context.groundY=groundY;library._stabilizeHostSupport(runtime,context.performance);return;
    }
    if(runtime?.hostSupports)runtime.hostSupports.length=0;
    groundHost(container,model,groundY);
  }
  global.HiveHostPerformance={sample:sampleHostPerformance,applyRoot:applyHostRoot,ground:groundHostSupported,
    supports(container){const model=hostModel(container),runtime=global.HiveAssetLibrary?.getRuntime?.(model)||model?.userData?.hostPerformanceRig;
      return runtime?.hostSupports||[];},
    carriedObjects(container){const result=new Set();container?.traverse?.(object=>{
      if(object.name==='imported_weapon_grip')for(const child of object.children)result.add(child);
      else if(/_equipment$/.test(object.name||'')&&object.userData?.equipmentType)result.add(object);
    });return Array.from(result);},
    focus(container,target){const T=global.THREE,model=hostModel(container);if(!T||!model)return null;
      const runtime=global.HiveAssetLibrary?.getRuntime?.(model),rig=model.userData.hostPerformanceRig;
      const head=runtime?.bindings.head||rig?.joints.head,hips=runtime?.bindings.hips||rig?.joints.hips;
      if(!head||!hips)return container.getWorldPosition(target||new T.Vector3());
      const out=target||new T.Vector3(),temp=model.userData.hostFocusScratch ||= new T.Vector3();
      return out.copy(head.getWorldPosition(temp)).multiplyScalar(.62).addScaledVector(hips.getWorldPosition(temp),.38);
    }};

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
      runtime.overlayPose=runtime.bindPose.map(pose=>({bone:pose.bone,quaternion:pose.bone.quaternion.clone(),position:pose.bone.position.clone()}));
      runtime.overlayApplied=false;
      this._captureHostContacts(runtime);
    }
    _captureHostContacts(runtime) {
      const T=this._three(),root=runtime.root,point=new T.Vector3(),at=new T.Vector3(),rootInverse=root.matrixWorld.clone().invert();
      const inverseQ=root.getWorldQuaternion(new T.Quaternion()).invert(),regions={};
      for(const side of hostSides)for(const part of ['Hand','Foot','Shin']){
        const bone=runtime.bindings[side+part];if(!bone)continue;
        const knee=part==='Shin',key=side+(knee?'Knee':part),inverse=bone.matrixWorld.clone().invert(),members=new Set();
        bone.traverse(child=>members.add(child));bone.getWorldPosition(at);
        const values=[],vertices=[];
        root.traverse(mesh=>{
          if(!mesh.isMesh||!mesh.geometry?.attributes.position||!isHumanMesh(mesh,root))return;
          const position=mesh.geometry.attributes.position,indices=mesh.geometry.attributes.skinIndex,weights=mesh.geometry.attributes.skinWeight;
          if(mesh.isSkinnedMesh)mesh.skeleton.update();
          for(let i=0;i<position.count;i++){
            let weight=0;if(mesh.isSkinnedMesh&&indices&&weights){
              for(let c=0;c<4;c++)if(members.has(mesh.skeleton.bones[indices.array[i*4+c]]))weight+=weights.array[i*4+c];
            }else for(let parent=mesh;parent&&parent!==root;parent=parent.parent)if(members.has(parent)){weight=1;break;}
            point.fromBufferAttribute(position,i);if(mesh.isSkinnedMesh)mesh.boneTransform(i,point);point.applyMatrix4(mesh.matrixWorld);
            const near=point.distanceToSquared(at)<(knee?.27:.42)**2;
            if(knee?!near:weight<.55)continue;
            vertices.push({mesh,index:i});point.applyMatrix4(inverse);values.push(point.x,point.y,point.z);
          }
        });
        regions[key]={bone,points:new Float32Array(values),vertices,
          bindQ:bone.getWorldQuaternion(new T.Quaternion()).premultiply(inverseQ),
          bindPosition:bone.getWorldPosition(new T.Vector3()).applyMatrix4(rootInverse)};
        if(part==='Hand'){
          const region=regions[key],middle=bone.children.find(child=>/Finger2$/.test(child.name)),index=bone.children.find(child=>/Finger1$/.test(child.name)),little=bone.children.find(child=>/Finger4$/.test(child.name));
          if(middle&&index&&little){
            const finger=middle.position.clone().normalize(),width=little.position.clone().sub(index.position);
            width.addScaledVector(finger,-width.dot(finger)).normalize();const normal=finger.clone().cross(width).normalize();
            const localFrame=new T.Matrix4().makeBasis(finger,width,normal).invert(),sign=Math.sign(region.bindPosition.x)||1;
            const worldFinger=new T.Vector3(0,0,-1),worldWidth=new T.Vector3(sign,0,0),worldNormal=worldFinger.clone().cross(worldWidth);
            region.supportQ=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(worldFinger,worldWidth,worldNormal).multiply(localFrame));
            region.normalAxis=normal;region.fingerAxis=finger;
          }else{
            region.supportQ=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/2).multiply(region.bindQ);
            const inverse=region.bindQ.clone().invert();region.normalAxis=new T.Vector3(0,0,1).applyQuaternion(inverse);region.fingerAxis=new T.Vector3(0,-1,0).applyQuaternion(inverse);
          }
        }
      }
      const hips=runtime.bindings.hips;
      runtime.hostContacts=regions;runtime.hostBindHipHeight=hips?hips.getWorldPosition(new T.Vector3()).applyMatrix4(rootInverse).y:2.1;
      runtime.hostSupports=[];
      runtime.hostSupportArmPose=runtime.bindPose.filter(bind=>/UpperArm|ForeArm|Hand|Thigh|Shin|Foot/.test(bind.key)).map(bind=>({bone:bind.bone,quaternion:bind.quaternion.clone()}));
    }
    _hostRegionMinimum(runtime,region,quaternion=null) {
      if(!region?.points.length)return 0;
      const T=this._three(),s=runtime.hostContactScratch ||= {point:new T.Vector3(),scale:new T.Vector3()};
      let minimum=Infinity;
      if(quaternion){
        region.bone.getWorldScale(s.scale);
        for(let i=0;i<region.points.length;i+=3){s.point.fromArray(region.points,i).multiply(s.scale).applyQuaternion(quaternion);minimum=Math.min(minimum,s.point.y);}
      }else{
        let previous=null;
        for(const entry of region.vertices){const mesh=entry.mesh;s.point.fromBufferAttribute(mesh.geometry.attributes.position,entry.index);
          if(mesh.isSkinnedMesh){if(previous!==mesh)mesh.skeleton.update();mesh.boneTransform(entry.index,s.point);}previous=mesh;s.point.applyMatrix4(mesh.matrixWorld);minimum=Math.min(minimum,s.point.y);}
      }
      return minimum;
    }
    _hostWorldQuaternion(runtime,bone,quaternion,weight=1) {
      const T=this._three(),scratch=runtime.hostOrientationScratch ||= new T.Quaternion();
      if(weight<1){const before=runtime.hostOrientationBefore ||= new T.Quaternion();bone.getWorldQuaternion(before).slerp(quaternion,weight);quaternion=before;}
      bone.parent.getWorldQuaternion(scratch).invert();bone.quaternion.copy(scratch).multiply(quaternion);runtime.root.updateMatrixWorld(true);
    }
    _stabilizeHostSupport(runtime,performance,clearancePass=0) {
      const context=runtime.root.userData.hostPerformanceContext;
      if(!context?.container||!hasHostSupports(performance))return false;
      const T=this._three(),root=runtime.root,container=context.container,contacts=runtime.hostContacts;
      for(const bind of runtime.hostSupportArmPose)bind.bone.quaternion.copy(bind.quaternion);
      const s=runtime.hostSupportScratch ||= {hips:new T.Vector3(),joint:new T.Vector3(),lower:new T.Vector3(),end:new T.Vector3(),target:new T.Vector3(),pole:new T.Vector3(),knee:new T.Vector3(),
        front:new T.Vector3(),right:new T.Vector3(),normal:new T.Vector3(),orientation:new T.Quaternion(),prepared:new T.Quaternion(),yaw:new T.Quaternion(),pitch:new T.Quaternion(),up:new T.Vector3(0,1,0),axis:new T.Vector3(1,0,0)};
      const p=performance.progress,ground=context.groundY,scale=root.getWorldScale(s.end).y,supportBlend=hostSmooth(p,.02,.16);
      s.yaw.setFromAxisAngle(s.up,context.yaw);s.front.set(0,0,1).applyQuaternion(s.yaw);s.right.set(1,0,0).applyQuaternion(s.yaw);
      // Blend out of the back-supported pose before the palm takes full load.
      // Entering the solver at one hard timeline boundary used to snap the
      // pelvis by 24 cm even though both adjacent key poses looked grounded.
      if(supportBlend<1)groundHost(container,root,ground);
      root.updateMatrixWorld(true);runtime.bindings.hips.getWorldPosition(s.hips);
      const goal=ground+runtime.hostBindHipHeight*scale*(p<.16?.22:performance.hipHeight);
      container.position.y+=(goal-s.hips.y)*supportBlend+(runtime.hostSupportClearance||0);container.updateMatrixWorld(true);
      runtime.hostSupports.length=0;
      for(const side of hostSides){
        const upper=runtime.bindings[side+'Thigh'],lower=runtime.bindings[side+'Shin'],foot=runtime.bindings[side+'Foot'],region=contacts[side+'Foot'];
        if(!upper||!lower||!foot||!region?.points.length)continue;
        upper.getWorldPosition(s.joint);lower.getWorldPosition(s.lower);foot.getWorldPosition(s.end);
        const l1=s.joint.distanceTo(s.lower),l2=s.lower.distanceTo(s.end),kneeling=side==='right'?hostSmooth(p,.46,.60)*(1-hostSmooth(p,.66,.86)):0;
        const pitch=-(Math.PI/2)*(1-hostSmooth(p,.16,.34))+kneeling*Math.PI/2;
        s.orientation.copy(s.yaw).multiply(s.pitch.setFromAxisAngle(s.axis,pitch)).multiply(region.bindQ);
        const ankleY=ground-this._hostRegionMinimum(runtime,region,s.orientation);
        const forward=.28*(1-hostSmooth(p,.84,1))+region.bindPosition.z*hostSmooth(p,.84,1);
        s.target.set(context.baseX,ankleY,context.baseZ).addScaledVector(s.right,region.bindPosition.x*scale).addScaledVector(s.front,forward*scale);
        s.pole.copy(s.joint).addScaledVector(s.front,2*scale);s.pole.y+=.3*scale;
        if(kneeling>0){
          const kneeY=ground+.16*scale,dy=Math.min(l1*.98,Math.max(0,s.joint.y-kneeY));
          s.knee.copy(s.joint).addScaledVector(s.front,Math.sqrt(Math.max(0,l1*l1-dy*dy)));s.knee.y=kneeY;
          const ankleDy=ankleY-kneeY,back=Math.sqrt(Math.max(0,l2*l2-ankleDy*ankleDy));
          s.end.copy(s.knee).addScaledVector(s.front,-back);s.end.y=ankleY;
          s.target.lerp(s.end,kneeling);s.pole.lerp(s.knee,kneeling);
        }
        this._hostLimb(runtime,upper,lower,foot,s.target,s.pole,supportBlend);this._hostWorldQuaternion(runtime,foot,s.orientation,supportBlend);
        if(kneeling>.99){
          // The knee origin is not its skin surface. Calibrate the loaded
          // kneecap against the deformed trouser vertices, then solve both
          // segments again without moving the already planted front foot.
          const kneeRegion=contacts[side+'Knee'];
          for(let pass=0;pass<2;pass++){
            const correction=ground-this._hostRegionMinimum(runtime,kneeRegion);
            s.knee.y+=correction;
            const dy=Math.min(l1*.995,Math.max(0,s.joint.y-s.knee.y));
            s.knee.copy(s.joint).addScaledVector(s.front,Math.sqrt(Math.max(0,l1*l1-dy*dy)));s.knee.y=s.joint.y-dy;
            const ankleDy=ankleY-s.knee.y,back=Math.sqrt(Math.max(0,l2*l2-ankleDy*ankleDy));
            s.target.copy(s.knee).addScaledVector(s.front,-back);s.target.y=ankleY;s.pole.copy(s.knee);
            this._hostLimb(runtime,upper,lower,foot,s.target,s.pole,1);this._hostWorldQuaternion(runtime,foot,s.orientation);
          }
        }
        const support=runtime.hostSupportRecords ||= {};
        const label=side+'-sole',record=support[label] ||= {name:label,minimum:0,error:0,loaded:false};
        record.minimum=this._hostRegionMinimum(runtime,region);record.error=record.minimum-ground;record.loaded=p>=.30&&kneeling<.01;
        runtime.hostSupports.push(record);
        if(kneeling>.99){const knee=contacts[side+'Knee'],label=side+'-knee',record=support[label] ||= {name:label,minimum:0,error:0,loaded:true};
          record.minimum=this._hostRegionMinimum(runtime,knee);record.error=record.minimum-ground;runtime.hostSupports.push(record);}
      }
      for(const side of hostSides){
        const brace=(performance[side+'Brace']||0)*supportBlend,upper=runtime.bindings[side+'UpperArm'],lower=runtime.bindings[side+'ForeArm'],hand=runtime.bindings[side+'Hand'],region=contacts[side+'Hand'];
        if(!(brace>0)||!upper||!lower||!hand||!region?.points.length)continue;
        upper.getWorldPosition(s.joint);const sign=Math.sign(region.bindPosition.x)||1;
        s.orientation.copy(s.yaw).multiply(region.supportQ);
        if(p>.46&&side==='right'){
          // Release toward the explicit .66 neutral-arm endpoint. Slerping
          // toward a moving IK-free wrist can cross the 180-degree shortest-
          // arc boundary and flip the hand while its load is fading out.
          s.pitch.setFromAxisAngle(s.axis,(runtime.native?.11:.20)-.06).premultiply(s.yaw).multiply(region.bindQ);
          s.prepared.copy(s.orientation).slerp(s.pitch,1-brace);
        }else hand.getWorldQuaternion(s.prepared).slerp(s.orientation,p<.16?Math.max(brace,hostSmooth(p,.02,.14)):brace);
        hand.getWorldPosition(s.end);
        s.target.copy(s.joint).addScaledVector(s.right,sign*.08*scale).addScaledVector(s.front,-.12*scale);
        const palmY=ground-this._hostRegionMinimum(runtime,region,s.prepared);
        s.target.y=palmY;s.target.lerp(s.end,1-brace);s.target.y=Math.max(palmY,s.target.y);
        s.pole.copy(s.target).addScaledVector(s.right,sign*.5*scale);s.pole.y+=.5*scale;
        this._hostLimb(runtime,upper,lower,hand,s.target,s.pole,1);
        // Prepare the wrist flat before it carries weight. Blending wrist
        // rotation as slowly as arm load drives the finger edge through the
        // deck just before contact, even when the wrist target is correct.
        this._hostWorldQuaternion(runtime,hand,s.prepared);
        const support=runtime.hostSupportRecords ||= {},label=side+'-palm',record=support[label] ||= {name:label,minimum:0,error:0,loaded:false};
        record.minimum=this._hostRegionMinimum(runtime,region);record.error=record.minimum-ground;record.loaded=brace>.999;
        hand.getWorldQuaternion(s.orientation);record.normalY=Math.abs(s.normal.copy(region.normalAxis).applyQuaternion(s.orientation).y);
        record.fingerY=Math.abs(s.normal.copy(region.fingerAxis).applyQuaternion(s.orientation).y);runtime.hostSupports.push(record);
      }
      for(const side of hostSides){
        const weight=performance[side+'Rest']||0,upper=runtime.bindings[side+'UpperArm'],lower=runtime.bindings[side+'ForeArm'],hand=runtime.bindings[side+'Hand'],thigh=runtime.bindings[side+'Thigh'],knee=runtime.bindings[side+'Shin'];
        if(!(weight>0)||!upper||!lower||!hand||!thigh||!knee)continue;
        thigh.getWorldPosition(s.target);knee.getWorldPosition(s.knee);s.target.lerp(s.knee,.65);s.target.y+=.13*scale;
        upper.getWorldPosition(s.pole);s.pole.addScaledVector(s.right,(side==='left'?1:-1)*.75*scale);s.pole.y-=.4*scale;
        this._hostLimb(runtime,upper,lower,hand,s.target,s.pole,weight);
      }
      // Cloth is a collision guard, never an anatomical support. If the
      // baseline torso would clip the deck, raise the pelvis BEFORE solving
      // all limbs again; no final root shift may detach a loaded hand/sole.
      const minimum=groundHost(container,root,ground,true);
      if(clearancePass<2&&minimum<ground-.001){
        runtime.hostSupportClearance=(runtime.hostSupportClearance||0)+ground-minimum;
        return this._stabilizeHostSupport(runtime,performance,clearancePass+1);
      }
      return true;
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
      for(const pose of runtime.overlayPose){pose.bone.quaternion.copy(pose.quaternion);if(pose.position)pose.bone.position.copy(pose.position);}
      runtime.overlayApplied=false;
    }
    _hostLimb(runtime,upper,lower,end,target,pole,weight=1) {
      if(!upper||!lower||!end||!(weight>0))return;
      const T=this._three(),root=runtime.root;
      const s=runtime.hostIK ||= {a:new T.Vector3(),b:new T.Vector3(),c:new T.Vector3(),direction:new T.Vector3(),bend:new T.Vector3(),elbow:new T.Vector3(),old:new T.Vector3(),next:new T.Vector3(),
        before:new T.Quaternion(),world:new T.Quaternion(),parent:new T.Quaternion(),delta:new T.Quaternion(),local:new T.Quaternion()};
      root.updateMatrixWorld(true);upper.getWorldPosition(s.a);lower.getWorldPosition(s.b);end.getWorldPosition(s.c);
      const l1=s.a.distanceTo(s.b),l2=s.b.distanceTo(s.c);if(l1<1e-6||l2<1e-6)return;
      s.direction.copy(target).sub(s.a);let distance=s.direction.length();if(distance<1e-6)return;
      s.direction.multiplyScalar(1/distance);distance=clamp(distance,Math.abs(l1-l2)+.001,(l1+l2)*.995);
      s.bend.copy(pole).sub(s.a);s.bend.addScaledVector(s.direction,-s.bend.dot(s.direction));
      if(s.bend.lengthSq()<1e-8)s.bend.set(1,0,0).addScaledVector(s.direction,-s.direction.x);
      s.bend.normalize();const along=(l1*l1-l2*l2+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,l1*l1-along*along));
      s.elbow.copy(s.a).addScaledVector(s.direction,along).addScaledVector(s.bend,height);
      s.old.copy(s.b).sub(s.a).normalize();s.next.copy(s.elbow).sub(s.a).normalize();
      s.before.copy(upper.quaternion);upper.getWorldQuaternion(s.world);upper.parent.getWorldQuaternion(s.parent).invert();
      s.delta.setFromUnitVectors(s.old,s.next);s.local.copy(s.parent).multiply(s.delta).multiply(s.world);
      upper.quaternion.copy(s.before).slerp(s.local,clamp(weight,0,1));root.updateMatrixWorld(true);
      lower.getWorldPosition(s.b);end.getWorldPosition(s.c);
      s.old.copy(s.c).sub(s.b).normalize();s.next.copy(target).sub(s.b).normalize();
      s.before.copy(lower.quaternion);lower.getWorldQuaternion(s.world);lower.parent.getWorldQuaternion(s.parent).invert();
      s.delta.setFromUnitVectors(s.old,s.next);s.local.copy(s.parent).multiply(s.delta).multiply(s.world);
      lower.quaternion.copy(s.before).slerp(s.local,clamp(weight,0,1));root.updateMatrixWorld(true);
    }
    _applyHostPerformance(runtime,performance) {
      const T=this._three(),root=runtime.root;
      const s=runtime.hostScratch ||= {face:new T.Vector3(),target:new T.Vector3(),pole:new T.Vector3(),position:new T.Vector3(),hips:new T.Vector3(),right:new T.Vector3(),front:new T.Vector3(),quaternion:new T.Quaternion()};
      const procedural=performance.procedural;
      for(const bind of runtime.bindPose){
        const key=bind.key,bone=bind.bone;
        if(procedural){bone.position.copy(bind.position);bone.quaternion.copy(bind.quaternion);}
        // Rocketbox distributes the spine through its original vertebral chain;
        // the compact fallback has one thorax pivot, so the same local angle
        // would double the visible bend and lay its head back on the deck.
        const x=(performance[key+'X']||0)*(runtime.native&&key==='spine'&&performance.pose==='waking'?.55:1),y=performance[key+'Y']||0;
        let z=performance[key+'Z']||0;
        if(key.startsWith('left')||key.startsWith('right')){
          const sideKey=key.startsWith('left')?'left':'right';
          const upper=runtime.bindings[sideKey+'UpperArm'];
          if(upper){root.updateMatrixWorld(true);root.worldToLocal(upper.getWorldPosition(s.position));z*=Math.sign(s.position.x)||1;}
        }
        if(x)bone.quaternion.multiply(s.quaternion.setFromAxisAngle(bind.x,x));
        if(y)bone.quaternion.multiply(s.quaternion.setFromAxisAngle(bind.y,y));
        if(z)bone.quaternion.multiply(s.quaternion.setFromAxisAngle(bind.z,z));
      }
      root.updateMatrixWorld(true);
      const context=root.userData.hostPerformanceContext;
      const supportedRecovery=hasHostSupports(performance);
      runtime.hostSupportClearance=0;
      if(supportedRecovery)for(const bind of runtime.hostSupportArmPose)bind.quaternion.copy(bind.bone.quaternion);
      if(context?.container&&performance.grounded&&!supportedRecovery)groundHost(context.container,root,context.groundY);
      const face=runtime.faceAnchor||runtime.bindings.head;
      if(face){
        face.getWorldPosition(s.face);root.worldToLocal(s.face);
        for(const sideKey of ['left','right']){
          const upper=runtime.bindings[sideKey+'UpperArm'],lower=runtime.bindings[sideKey+'ForeArm'],hand=runtime.bindings[sideKey+'Hand'];
          if(!upper||!lower||!hand)continue;
          root.worldToLocal(upper.getWorldPosition(s.position));const side=Math.sign(s.position.x)||1;
          const faceWeight=performance[sideKey+'Face']||0;
          if(faceWeight>0){
            s.target.copy(s.face);s.target.x+=side*(.43+Math.sin(performance.phase*.8+side)*.025);
            s.target.y-=.12+Math.sin(performance.phase*.65+side)*.018;s.target.z+=.12;
            s.pole.set(side*.94,s.face.y-.95,s.face.z+.30);
            root.localToWorld(s.target);root.localToWorld(s.pole);
            this._hostLimb(runtime,upper,lower,hand,s.target,s.pole,faceWeight);
          }
          const brace=performance[sideKey+'Brace']||0;
          if(brace>0&&!supportedRecovery&&runtime.bindings.hips){
            runtime.bindings.hips.getWorldPosition(s.hips);root.getWorldQuaternion(s.quaternion);
            s.right.set(1,0,0).applyQuaternion(s.quaternion);s.right.y=0;s.right.normalize();s.front.set(-s.right.z,0,s.right.x);
            s.target.copy(s.hips).addScaledVector(s.right,side*.65).addScaledVector(s.front,.12);s.target.y=.04;
            s.pole.copy(s.target).addScaledVector(s.right,side*.25);s.pole.y+=.4;
            this._hostLimb(runtime,upper,lower,hand,s.target,s.pole,brace);
          }
        }
      }
      if(supportedRecovery)this._stabilizeHostSupport(runtime,performance);
      else if(context?.container&&performance.grounded)groundHost(context.container,root,context.groundY);
    }
    _overlayAnimation(runtime) {
      const s=runtime.state,poseName=String(s.pose||'').toLowerCase();
      const attack=clamp(Number(s.attack)||0,0,1),envelope=Math.sin(attack*Math.PI);
      const crouch=clamp(Number(s.crouch)||0,0,1);
      if(!poseName&&!envelope&&!crouch)return;
      const T=this._three(),phase=Number.isFinite(s.phase)?s.phase:runtime.elapsed*6.4;
      const progress=clamp(Number(s.poseProgress)||0,0,1);
      for(const saved of runtime.overlayPose){saved.quaternion.copy(saved.bone.quaternion);saved.position?.copy(saved.bone.position);}
      runtime.overlayApplied=true;
      const hostPerformance=sampleHostPerformance(poseName,progress,phase,runtime.hostSample ||= {});
      if(hostPerformance){this._applyHostPerformance(runtime,hostPerformance);return;}
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
      const performance=sampleHostPerformance(s.pose,s.poseProgress,Number.isFinite(s.phase)?s.phase:runtime.elapsed*6.4,runtime.hostSample ||= {});
      if(performance?.procedural){
        if(runtime.currentAction){runtime.mixer.stopAllAction();runtime.currentAction=null;}
        runtime.mode='host-performance';runtime.currentState=name;runtime.actionState=name;
        for(const bind of runtime.bindPose){bind.bone.position.copy(bind.position);bind.bone.quaternion.copy(bind.quaternion);}
        this._overlayAnimation(runtime);return true;
      }
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
        const measuredSpeed=Number(s.groundSpeed);
        const naturalSpeed=(actionState==='run'?5.2:2.25)*(Number(runtime.entry.height)||4.25)/4.25;
        action.setEffectiveTimeScale(Number.isFinite(measuredSpeed)&&['walk','run'].includes(actionState)
          ? clamp(Math.max(0,measuredSpeed)/naturalSpeed,.08,2.2):1);
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
