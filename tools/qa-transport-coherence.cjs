#!/usr/bin/env node
'use strict';
// Actual transport/loading methods, vendored Three and real factory geometry.
// Empty room / obstruction, DOM and audio outputs are explicit fixtures.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'src/game.js'),'utf8');
global.THREE=require(path.join(root,'assets/vendor/three.r128.min.js'));
for(const name of ['organic-sculpt','surface-detail','model-detail','models'])require(path.join(root,'src',name+'.js'));
const T=global.THREE,factory=global.HiveModelFactory,results=[];
const part=(a,b)=>{const i=source.indexOf(a),j=source.indexOf(b,i);assert(i>=0&&j>i);return source.slice(i,j);};
function test(name,run){try{const detail=run();results.push({name,passed:true,detail});console.log('PASS '+name);}catch(error){results.push({name,passed:false,error:error.stack});console.error('FAIL '+name+': '+error.message);}}
function fixture(bodyOptions={}){
 const scene=new T.Scene(),props=new T.Group();scene.add(props);const observations={campaign:[],destroy:0,damage:0,sounds:0};
 const game={campaignActive:true,isRunning:true,isSystemPaused:false,currentStageIndex:4,currentStage:{},humans:[],syncCampaignCharacter(host,state){observations.campaign.push({host,state});}};
 const map={colliders:[],medlabAutopsyChutes:[],getPropMinStage:p=>p.minStage||4};
 const player={form:'drone',x:0,z:5.2,mesh:new T.Group(),creatureEnvelope:{radius:.8},isDefeated:false,
   isLocomotionBusy(){return !!(this.ceilingAction||this.ceilingTransition||this.disposalTransfer);}};
 scene.add(player.mesh);player.mesh.position.set(player.x,0,player.z);player.mesh.rotation.y=Math.PI;
 const window={gameInstance:game,HiveModelFactory:factory,HiveSystems:{vfx:{burst(){},spawnWallCocoon(){}}}};
 const context={THREE:T,window,playerCreature:player,stationMap:map,rendererEngine:{scene,propsGroup:props,removeObject(o){o?.parent?.remove(o);},addScreenShake(){}},
   audioManager:{playIncineratorDraftRoar(){observations.sounds++;},playWetImpact(){}},getAnimationModel:()=>null,animateProceduralModel(){},showToast(){},appendSensorLog(){},Math,Number,Set,console};
 vm.createContext(context);
 const load=(target,code)=>{const methods=vm.runInContext('(class {'+code+'})',context).prototype;for(const key of Object.getOwnPropertyNames(methods))if(key!=='constructor')target[key]=methods[key];};
 load(player,part('    canTransportOnGround() {','    executeAcidSpit('));
 load(map,part('    getIncineratorIntake(chute) {','    // -------------------------------------------------------------------------\n    // Chantier 258'));
 load(map,part('    segmentIntersectsCollider(','    // Locomotion queries use authored solids/support meshes'));
 load(map,part('    checkCollision(nextX,','    findPath('));
 load(map,part('    isPropActiveForStage(prop) {','    setPropStageVisibility('));
 const mesh=factory.createMedLabAutopsyChute();props.add(mesh);const chute={id:'fixture-chute',x:0,z:0,mesh,minStage:4};
 const bounds=new T.Box3().setFromObject(mesh),collider={minX:bounds.min.x,maxX:bounds.max.x,minZ:bounds.min.z,maxZ:bounds.max.z,chuteRef:chute,mesh};chute.collider=collider;map.colliders.push(collider);map.medlabAutopsyChutes.push(chute);
 function body({x=0,z=7,hp=0,width=.7,height=4.25,depth=.55,profile='box'}={}){
   const mesh=new T.Group(),material=new T.MeshBasicMaterial();
   if(profile==='anatomical'){
     for(const [sx,sy,sz,px,py,pz] of [[.65,1.18,depth/2,0,2.5,0],[.34,.38,.36,0,3.87,0],[.23,1.05,.25,-.28,1.05,0],[.23,1.05,.25,.28,1.05,0],[.16,.85,.22,-.65,2.55,0],[.16,.85,.22,.65,2.55,0]]){
       const part=new T.Mesh(new T.SphereGeometry(1,20,16),material);part.scale.set(sx,sy,sz);part.position.set(px,py,pz);mesh.add(part);
     }
   }else{const shape=new T.Mesh(new T.BoxGeometry(width,height,depth),material);shape.position.y=height/2;mesh.add(shape);}
   mesh.position.set(x,.25,z);scene.add(mesh);
   const host={name:'Prepared body',x,z,hp,maxHp:110,mesh,isIncapacitated:true,isCocooned:false,hostEligibility:'viable',isSynthetic:()=>false,
     takeDamage(){observations.damage++;},destroy(){observations.destroy++;this.mesh?.parent?.remove(this.mesh);this.mesh=null;},cocoonInResin(){this.isCocooned=true;return true;}};
   game.humans.push(host);return host;
 }
 const host=body(bodyOptions);return {game,map,player,host,chute,scene,body,observations,context};
}
test('Factory provides four solid walls, an empty aperture and one articulated cover',()=>{
 const model=factory.createMedLabAutopsyChute(),intake=model.userData.incineratorIntake;
 assert(intake&&intake.anchor.isObject3D&&intake.lid.isObject3D);assert(intake.width>=2.1&&intake.length>=5&&intake.depth>=1);
 assert(!model.getObjectByName('autopsy_drain_hopper'));const lid=model.getObjectByName('autopsy_table_surface');model.updateMatrixWorld(true);const before=lid.getWorldPosition(new T.Vector3());
 intake.lid.rotation.x=intake.openAngle;model.updateMatrixWorld(true);const after=lid.getWorldPosition(new T.Vector3());assert(after.y>before.y+2);
 // Static walls may be material-batched. Ray-test their actual geometry and
 // the open center rather than requiring nodes the renderer legitimately merges.
 for(const direction of [new T.Vector3(1,0,0),new T.Vector3(-1,0,0),new T.Vector3(0,0,1),new T.Vector3(0,0,-1)]){
   const hits=new T.Raycaster(new T.Vector3(0,.6,0),direction).intersectObject(model,true);assert(hits.length>0);assert(hits[0].distance>1);
 }
 const centerHits=new T.Raycaster(new T.Vector3(0,3,0),new T.Vector3(0,-1,0)).intersectObject(model,true);assert(centerHits.length&&centerHits[0].point.y<.2,'Opened chamber is still a solid box');factory.disposeModel(model);
});
test('A body cannot be picked through a real wall, at height, or during ceiling ownership',()=>{
 for(const mode of ['wall','height','owner','busy']){const f=fixture();if(mode==='wall')f.map.colliders.push({minX:-2,maxX:2,minZ:5.8,maxZ:6.2,isWall:true});if(mode==='height')f.host.mesh.position.y=3;
   if(mode==='owner')f.host.ceilingActionOwner={};if(mode==='busy')f.player.ceilingAction={};assert.equal(f.player.toggleDragHost(),false,mode);assert.equal(f.player.draggedHost,undefined);}
});
test('Acquisition binds the exact floor body without moving its coordinates',()=>{
 const f=fixture(),before=[f.host.x,f.host.z];assert.equal(f.player.toggleDragHost(),true);assert.equal(f.player.draggedHost,f.host);assert.equal(f.host.transportOwner,f.player);assert.deepEqual([f.host.x,f.host.z],before);
 f.host.mesh.updateMatrixWorld(true);assert(new T.Box3().setFromObject(f.host.mesh).min.y>=.02);
});
test('Carrying speed is bounded and the complete body footprint cannot sweep through a wall',()=>{
 const f=fixture();assert(f.player.toggleDragHost());const old=[f.player.x,f.player.z,f.host.x,f.host.z];
 f.player.x+=1;f.player.mesh.position.x=f.player.x;f.player.updateDraggedHost(1/60);assert(f.player.x<=old[0]+2.4/60+1e-7);
 const previous=[f.player.x,f.player.z,f.host.x,f.host.z];f.map.colliders.push({minX:-2,maxX:2,minZ:6.7,maxZ:12,isWall:true});f.player.z+=.2;f.player.mesh.position.z=f.player.z;
 assert.equal(f.player.updateDraggedHost(1/60),false);assert.equal(f.player.x,previous[0]);assert.equal(f.player.z,previous[1]);assert.equal(f.host.x,previous[2]);assert.equal(f.host.z,previous[3]);
});
test('Pause freezes drag and a stage change releases stale ownership even when paused',()=>{
 const f=fixture();assert(f.player.toggleDragHost());f.game.isSystemPaused=true;const z=f.host.z;f.player.updateDraggedHost(.05);assert.equal(f.host.z,z);assert.equal(f.player.draggedHost,f.host);
 f.game.currentStage={};f.player.updateDraggedHost(.05);assert.equal(f.player.draggedHost,null);assert.equal(f.host.transportOwner,null);
});
test('Dead, synthetic or spent bodies never become new wall hosts',()=>{
 for(const type of ['dead','synthetic','spent']){const f=fixture();f.host.hp=type==='dead'?0:50;if(type==='synthetic')f.host.isSynthetic=()=>true;if(type==='spent')f.host.isConsumedByCycle=true;assert(f.player.toggleDragHost());assert.equal(f.player.wallCocoonDraggedHost(),false);assert.equal(f.host.isCocooned,false);}
});
test('Incineration never selects an unrelated nearby NPC when no body is carried',()=>{
 const f=fixture();f.host.x=0;f.host.z=3;assert.equal(f.map.dumpCorpseIntoIncinerator(f.chute),false);assert.equal(f.host.isDisposed,undefined);assert.equal(f.observations.damage,0);
});
test('Inactive, hidden, malformed and undersized intakes reject loading without ownership loss',()=>{
 for(const mode of ['stage','hidden','metadata','size']){const f=fixture();assert(f.player.toggleDragHost());if(mode==='stage')f.chute.minStage=5;if(mode==='hidden')f.chute.mesh.visible=false;if(mode==='metadata')delete f.chute.mesh.userData.incineratorIntake;if(mode==='size')f.chute.mesh.userData.incineratorIntake.width=.2;
   assert.equal(f.map.dumpCorpseIntoIncinerator(f.chute),false,mode);assert.equal(f.player.draggedHost,f.host);assert.equal(f.host.mesh.visible,true);}
});
test('Loading is animated, owned, pause-safe and consumes the exact body once without fake damage',()=>{
 const f=fixture(),other=f.body({x:7,z:2});assert(f.player.toggleDragHost());assert(f.map.dumpCorpseIntoIncinerator(f.chute));
 const transfer=f.chute.pendingTransfer;assert.equal(transfer.host,f.host);assert.equal(f.player.draggedHost,null);assert.equal(f.host.isDisposed,undefined);assert.equal(f.map.dumpCorpseIntoIncinerator(f.chute),false);
 for(let i=0;i<50;i++)f.map.updateMedlabAutopsyChutes(1/60);assert(transfer.elapsed<3.05);assert(f.host.mesh.visible);const position=f.host.mesh.position.clone(),age=transfer.elapsed;
 f.game.isSystemPaused=true;for(let i=0;i<100;i++)f.map.updateMedlabAutopsyChutes(.05);assert.equal(transfer.elapsed,age);assert(f.host.mesh.position.equals(position));f.game.isSystemPaused=false;
 for(let i=0;i<200;i++)f.map.updateMedlabAutopsyChutes(1/60);
 assert.equal(f.host.isDisposed,true);assert.equal(f.host.hostEligibility,'none');assert.equal(f.host.isConsumedByCycle,true);assert.equal(f.host.hp,0);assert.equal(f.host.mesh,null);assert(!f.game.humans.includes(f.host));assert(f.game.humans.includes(other));
 assert.equal(f.observations.damage,0);assert.equal(f.observations.destroy,1);assert.equal(f.observations.campaign.length,1);assert.equal(f.observations.campaign[0].state.alive,false);assert.equal(f.chute.disposalCount,1);assert.equal(f.chute.pendingTransfer,null);assert.equal(f.player.disposalTransfer,null);assert.equal(f.chute.mesh.userData.incineratorIntake.lid.rotation.x,0);
 assert.equal(f.map.dumpCorpseIntoIncinerator(f.chute),false);for(let i=0;i<20;i++)f.map.updateMedlabAutopsyChutes(.05);assert.equal(f.chute.disposalCount,1);
});
test('A thick articulated-profile corpse fits the physical chamber without shrinking or floating above its floor',()=>{
 const f=fixture({profile:'anatomical',depth:1.307});assert.equal(f.host.mesh.children.length,6);assert(f.host.mesh.children.every(child=>child.geometry.type==='SphereGeometry'));
 assert(f.player.toggleDragHost());const size=f.player.dragTransport.geometry.size.clone(),scale=f.host.mesh.scale.clone();assert(size.z>1.30&&size.z<1.32);
 assert(f.map.dumpCorpseIntoIncinerator(f.chute),'Human-depth body cannot enter the real chamber');const transfer=f.player.disposalTransfer;
 for(let i=0;i<156;i++)f.map.updateMedlabAutopsyChutes(1/60);
 assert(!f.host.isDisposed);f.host.mesh.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(f.host.mesh),intake=f.chute.mesh.userData.incineratorIntake;
 assert(bounds.min.y>=intake.floorY+.015&&bounds.min.y<=intake.floorY+.04,'Body did not settle on the chamber floor');
 assert(bounds.max.y<intake.lipY-.05);assert(f.host.mesh.scale.equals(scale));return {size:size.toArray(),floor:bounds.min.y,ceiling:bounds.max.y,lipY:intake.lipY};
});
test('Stage cancellation clears every owner and returns the visible body to its safe floor pose',()=>{
 const f=fixture();assert(f.player.toggleDragHost());assert(f.map.dumpCorpseIntoIncinerator(f.chute));const transfer=f.chute.pendingTransfer;
 for(let i=0;i<65;i++)f.map.updateMedlabAutopsyChutes(1/60);f.game.currentStage={};f.game.isSystemPaused=true;f.map.updateMedlabAutopsyChutes(.05);
 assert.equal(transfer.cancelled,true);assert.equal(f.chute.pendingTransfer,null);assert.equal(f.player.disposalTransfer,null);assert.equal(f.host.transportOwner,null);assert.equal(f.host.disposalOwner,null);assert(f.host.mesh.visible);assert(f.host.mesh.position.equals(transfer.startPosition));assert.equal(f.host.isDisposed,undefined);assert.equal(f.observations.damage,0);
});
test('Actor replacement and removal of the chute cannot finish an old disposal',()=>{
 for(const mode of ['actor','chute']){const f=fixture();assert(f.player.toggleDragHost());assert(f.map.dumpCorpseIntoIncinerator(f.chute));if(mode==='actor')f.player.mesh=new T.Group();else f.map.medlabAutopsyChutes=[];for(let i=0;i<100;i++)f.map.updateMedlabAutopsyChutes(.05);assert.equal(f.host.isDisposed,undefined);assert.equal(f.chute.pendingTransfer,null);assert.equal(f.observations.destroy,0);}
});
test('Production player movement delegates dragging to the checked transport sweep',()=>{
 const body=part('  class PlayerCreature','  const playerCreature = new PlayerCreature();');assert(body.includes('if (this.draggedHost) this.updateDraggedHost(safeDelta);'));assert(!body.includes('this.draggedHost.x = hostX'));
});
test('An obstruction along the initial lift footprint rejects loading before relinquishing the body',()=>{
 const f=fixture();assert(f.player.toggleDragHost());f.map.colliders.push({minX:-.3,maxX:.3,minZ:9,maxZ:9.3,isWall:true});
 const position=f.host.mesh.position.clone();assert.equal(f.map.dumpCorpseIntoIncinerator(f.chute),false);assert.equal(f.player.draggedHost,f.host);assert(f.host.mesh.position.equals(position));assert.equal(f.host.isDisposed,undefined);
});
test('The actual Q command cancels an intake without starting ceiling movement',()=>{
 const f=fixture();assert(f.player.toggleDragHost());assert(f.map.dumpCorpseIntoIncinerator(f.chute));const transfer=f.player.disposalTransfer;
 const proto=vm.runInContext('(class {'+part('    toggleCeilingProwl() {','    isLocomotionBusy()')+'})',f.context).prototype;
 assert.equal(proto.toggleCeilingProwl.call(f.player),false);assert.equal(transfer.cancelled,true);assert.equal(f.player.disposalTransfer,null);assert.equal(f.player.ceilingTransition,undefined);assert.equal(f.host.isDisposed,undefined);
});
const passed=results.filter(r=>r.passed).length,report={scope:'Actual methods and real factory/Three geometry; labelled room/body/audio fixtures, not native play or human QA',sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),groups:results.length,passed,results};
const arg=process.argv.find(a=>a.startsWith('--output='));if(arg){const file=path.resolve(root,arg.slice(9));assert(file.startsWith(path.join(root,'.tools')+path.sep));assert(!fs.existsSync(file));fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');}
console.log(`${passed}/${results.length} transport coherence groups passed`);process.exitCode=passed===results.length?0:1;
