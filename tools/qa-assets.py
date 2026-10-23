#!/usr/bin/env python3
"""Exercise real imported GLBs through the native app, r128 skinning and ownership.
No asset requests, rendering or production geometry are replaced in the positive run.
"""
import argparse
import json
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url',default='http://127.0.0.1:8082/')
    parser.add_argument('--models',nargs='+',default=['scientist','marine'])
    parser.add_argument('--output',type=Path,default=Path('.tools/assets'))
    args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
    report={'models':[],'errors':[],'failed_local_assets':[]}
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,
            args=['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
        context=browser.new_context(viewport={'width':720,'height':900})
        page=context.new_page()
        page.on('pageerror',lambda error:report['errors'].append(str(error)))
        page.on('response',lambda response:report['failed_local_assets'].append(f'{response.status} {response.url}')
                if response.status>=400 and '/assets/models/' in response.url else None)
        page.goto(args.url,wait_until='domcontentloaded')
        page.wait_for_function('() => !!(window.gameInstance && window.HiveAssetLibrary && window.HiveModelFactory)',timeout=120000)
        report['preload']=page.evaluate('async()=>await HiveAssetLibrary.preload()')
        assert not report['preload']['failed'],report['preload']
        native=page.evaluate('''()=>{
            const L=HiveAssetLibrary,d=L.getDiagnostics();
            const native=d.instances.filter(i=>i.status==='ready'&&i.skinnedMeshes>0);
            if(!native.length)throw Error('The normal application path created no real imported skinned actor.');
            gameInstance.isRunning=false;
            return {nativeInstances:native,entries:d.entries};
        }''')
        report['native']=native
        for name in args.models:
            result=page.evaluate('''name=>{
                const T=THREE,L=HiveAssetLibrary,F=HiveModelFactory;
                if(!L.isReady(name))throw Error(`${name} did not load natively`);
                const factory=F.createHuman(name);
                if(!L.handlesRoot(factory))throw Error(`${name}: factory silently returned primitives`);
                const factoryId=L.getRuntime(factory).assetId;
                F.disposeModel(factory);
                const a=L.instantiate(name,{height:4.25}),b=L.instantiate(name,{height:4.25});
                if(!a||!b)throw Error(`${name}: instantiation failed`);
                const ra=L.getRuntime(a),rb=L.getRuntime(b);
                if(ra.mode!=='clips'||ra.currentAction?.getEffectiveWeight()!==1||ra.mixer.time!==0)
                    throw Error('The first Idle frame exposes a bind pose or an uninitialized animation clock');
                const gather=root=>{const out=[];root.traverse(o=>{if(o.isMesh)out.push(o)});return out;};
                const ma=gather(a),mb=gather(b);
                if(!ma.some(m=>m.isSkinnedMesh))throw Error('Imported geometry is not skinned.');
                for(let i=0;i<ma.length;i++){
                    if(ma[i].geometry===mb[i].geometry)throw Error('Actors share mutable geometry');
                    const am=Array.isArray(ma[i].material)?ma[i].material:[ma[i].material];
                    const bm=Array.isArray(mb[i].material)?mb[i].material:[mb[i].material];
                    for(let j=0;j<am.length;j++){
                        if(am[j]===bm[j])throw Error('Actors share mutable materials');
                        if(am[j].map&&am[j].map!==bm[j].map)throw Error('Immutable cached textures were needlessly duplicated');
                    }
                    if(ma[i].isSkinnedMesh&&ma[i].skeleton.bones.some((bone,j)=>bone===mb[i].skeleton.bones[j]))throw Error('Actors share bones');
                }
                const sample=root=>{
                    root.updateMatrixWorld(true);const out=[];
                    root.traverse(mesh=>{
                        if(!mesh.isSkinnedMesh)return;mesh.skeleton.update();
                        const p=mesh.geometry.attributes.position,step=Math.max(1,Math.floor(p.count/48)),v=new T.Vector3();
                        for(let i=0;i<p.count;i+=step){v.fromBufferAttribute(p,i);mesh.boneTransform(i,v);mesh.localToWorld(v);out.push(v.x,v.y,v.z);}
                    });return out;
                };
                const difference=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
                const bBefore=sample(b),bClock=rb.mixer?.time;
                const deformations=[];
                for(const[state,movement]of[['idle',0],['walk',.5],['run',1]]){
                    L.setState(a,{movement,attack:0,frozen:false});
                    for(let i=0;i<5;i++)L.updateModel(a,.05);
                    const before=sample(a),clock=ra.mixer?.time;
                    for(let i=0;i<7;i++)L.updateModel(a,.05);
                    const after=sample(a),change=difference(before,after);
                    if(ra.mode!=='clips'||ra.currentState!==state||!(ra.mixer.time>clock)||change<1e-5)
                        throw Error(`${name} ${state}: no genuine clip-driven vertex deformation (${change})`);
                    deformations.push({state,clip:ra.currentAction.getClip().name,mixerTime:ra.mixer.time,maxVertexChange:change});
                }
                if(new Set(deformations.map(d=>d.clip)).size!==3)throw Error('Idle/Walk/Run silently reuse the same clip');
                if(difference(sample(b),bBefore)>1e-7||rb.mixer?.time!==bClock)throw Error('Animating A changed B');
                const frozenBefore=sample(a),frozenClock=ra.mixer.time;
                L.setState(a,{frozen:true});L.update(.05);
                if(ra.mixer.time!==frozenClock||difference(sample(a),frozenBefore)>1e-7)throw Error('Frozen actors animate');
                L.setState(a,{frozen:false,movement:.78});L.updateModel(a,.05);
                if(ra.currentState!=='walk')throw Error('Patrol amplitude .78 incorrectly selects running');
                const attackClock=ra.mixer.time;
                L.setState(a,{movement:.5,attack:.6});L.updateModel(a,.05);
                if(ra.mode!=='clips'||ra.currentState!=='attack'||ra.actionState!=='walk'||ra.mixer.time<=attackClock)
                    throw Error('An unavailable attack clip stopped the authored walk cycle');
                L.setState(a,{movement:0,attack:.6});L.updateModel(a,.05);
                if(ra.mode!=='clips'||ra.actionState!=='idle')throw Error('An unavailable coughing/attack clip exposed the bind pose');
                L.setState(a,{movement:.5,attack:0});L.updateModel(a,.05);
                const box=L.getModelBounds(a),size=box.getSize(new T.Vector3());
                if(size.y<3.6||size.y>4.9||Math.abs(box.min.y)>.4)throw Error(`Bad normalized skinned bounds: ${size.toArray()} / ${box.min.y}`);
                if(!ra.faceAnchor)throw Error('No bone-attached face anchor');
                const anchor=ra.faceAnchor.getWorldPosition(new T.Vector3());
                if(anchor.y<2.8||anchor.y>4.7)throw Error('Face anchor is outside the head region');
                const anchorScale=ra.faceAnchor.getWorldScale(new T.Vector3());
                if(anchorScale.distanceTo(new T.Vector3(1,1,1))>1e-5)throw Error(`Face attachments inherit the FBX centimetre scale: ${anchorScale.toArray()}`);
                a.scale.setScalar(.6);a.updateMatrixWorld(true);
                if(ra.faceAnchor.getWorldScale(new T.Vector3()).distanceTo(new T.Vector3(.6,.6,.6))>1e-5)
                    throw Error('Face attachments do not follow the actor scale');
                a.scale.setScalar(1);a.updateMatrixWorld(true);
                const scene=new T.Scene();scene.background=new T.Color(0x10161e);
                scene.add(a);scene.add(new T.HemisphereLight(0xb5c3d1,0x202026,1.3));
                const light=new T.DirectionalLight(0xffefd9,2.4);light.position.set(4,7,5);scene.add(light);
                const camera=new T.PerspectiveCamera(35,720/900,.05,60);camera.position.set(5,3.1,8);camera.lookAt(0,2.2,0);
                const renderer=new T.WebGLRenderer({antialias:true});renderer.setSize(720,900);renderer.setPixelRatio(1);
                renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;
                renderer.render(scene,camera);renderer.getContext().finish();
                const image=renderer.domElement.toDataURL(),gpu={...renderer.info.render};
                if(renderer.getContext().getError()!==0)throw Error('Imported asset caused a WebGL error');
                const texture=ma.flatMap(m=>Array.isArray(m.material)?m.material:[m.material]).find(m=>m.map)?.map;
                let textureDisposals=0;const onTextureDispose=()=>textureDisposals++;
                texture?.addEventListener('dispose',onTextureDispose);
                let geometryDisposals=0;for(const g of ra.geometries)g.addEventListener('dispose',()=>geometryDisposals++);
                const geometryCount=ra.geometries.size;
                const bBeforeDisposal=sample(b);
                L.disposeModel(a);L.disposeModel(a);
                if(geometryDisposals!==geometryCount||textureDisposals)throw Error('Disposal duplicated geometry or destroyed shared textures');
                if(difference(sample(b),bBeforeDisposal)>1e-7)throw Error('Disposing A damaged B');
                L.disposeModel(b);texture?.removeEventListener('dispose',onTextureDispose);
                renderer.dispose();
                return {name,factoryAssetId:factoryId,clips:deformations,source:ra.sourceUrl,skinnedMeshes:ma.filter(m=>m.isSkinnedMesh).length,
                    bones:new Set(ma.flatMap(m=>m.skeleton?.bones||[])).size,height:size.y,faceAnchor:anchor.toArray(),gpu,
                    independent:true,idempotentDisposal:true,sharedTexturesPreserved:true,
                    firstFrameIdle:true,unsupportedAttackKeepsBaseClip:true,anchorScale:anchorScale.toArray(),image};
            }''',name)
            image=result.pop('image')
            import base64
            (args.output/f'{name}.png').write_bytes(base64.b64decode(image.split(',',1)[1]))
            report['models'].append(result)
        report['factoryRoles']=page.evaluate('''()=>{
            const T=THREE,L=HiveAssetLibrary,F=HiveModelFactory,results=[];
            for(const role of ['guard','marine','smartgunner','incinerator','commando']){
                const baseline=F._managedMaterials.size,liveBefore=L.instances.size;
                const root=F.createHuman(role),runtime=L.getRuntime(root);
                if(!runtime||runtime.disposed||!root.userData.hiveImportedModel)
                    throw Error(`${role}: factory returned a procedural substitute`);
                const grip=root.getObjectByName('imported_weapon_grip'),hand=runtime.bindings.rightHand;
                if(!grip||grip.parent!==hand||!grip.children.length||root.userData.equipmentType!==role)
                    throw Error(`${role}: weapon is missing or not attached to the right-hand bone`);
                root.updateMatrixWorld(true);
                const scale=grip.getWorldScale(new T.Vector3());
                if(scale.distanceTo(new T.Vector3(1,1,1))>1e-5)throw Error(`${role}: weapon inherits the FBX centimetre scale`);
                const weaponBounds=new T.Box3().setFromObject(grip),weaponSize=weaponBounds.getSize(new T.Vector3());
                const extent=Math.max(...weaponSize.toArray());
                if(extent<.3||extent>3.5)throw Error(`${role}: weapon has an implausible size ${weaponSize.toArray()}`);
                const before=grip.getWorldPosition(new T.Vector3());
                L.setState(root,{movement:.5,attack:0});for(let i=0;i<6;i++)L.updateModel(root,.05);
                root.updateMatrixWorld(true);
                const after=grip.getWorldPosition(new T.Vector3());
                if(after.distanceTo(before)<.005||after.distanceTo(hand.getWorldPosition(new T.Vector3()))>1e-5)
                    throw Error(`${role}: weapon does not follow the animated hand`);
                const resources=new Set(),disposals=new Map();
                root.traverse(mesh=>{
                    if(mesh.geometry)resources.add(mesh.geometry);
                    for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])if(material)resources.add(material);
                });
                for(const resource of resources){disposals.set(resource,0);resource.addEventListener('dispose',()=>disposals.set(resource,disposals.get(resource)+1));}
                const allocated=F._managedMaterials.size-baseline;
                if(allocated<1||allocated>3)throw Error(`${role}: unexpected managed weapon material allocation ${allocated}`);
                let image=null,gpu=null;
                if(role==='marine'){
                    L.setState(root,{movement:0,attack:0});for(let i=0;i<5;i++)L.updateModel(root,.05);
                    const scene=new T.Scene();scene.background=new T.Color(0x10161e);scene.add(root);
                    scene.add(new T.HemisphereLight(0xb5c3d1,0x202026,1.3));
                    const light=new T.DirectionalLight(0xffefd9,2.4);light.position.set(4,7,5);scene.add(light);
                    const camera=new T.PerspectiveCamera(35,720/900,.05,60);camera.position.set(5,3.1,8);camera.lookAt(0,2.2,0);
                    const renderer=new T.WebGLRenderer({antialias:true});renderer.setSize(720,900);renderer.setPixelRatio(1);
                    renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;
                    renderer.render(scene,camera);renderer.getContext().finish();
                    image=renderer.domElement.toDataURL();gpu={...renderer.info.render};
                    if(renderer.getContext().getError()!==0)throw Error('Factory weapon caused a WebGL error');
                    renderer.dispose();
                }
                F.disposeModel(root);F.disposeModel(root);root.userData.dispose();
                if(!runtime.disposed||L.instances.size!==liveBefore||F._managedMaterials.size!==baseline)
                    throw Error(`${role}: factory cleanup leaked the mixer or managed weapon materials`);
                if([...disposals.values()].some(count=>count!==1))throw Error(`${role}: factory cleanup did not dispose owned resources exactly once`);
                results.push({role,assetId:runtime.assetId,source:runtime.sourceUrl,weaponGrip:true,
                    weaponSize:weaponSize.toArray(),managedMaterialsAllocated:allocated,managedMaterialsRestored:true,
                    animatedHand:true,idempotentDisposal:true,gpu,image});
            }
            return results;
        }''')
        for role in report['factoryRoles']:
            image=role.pop('image')
            if image:(args.output/f"factory-{role['role']}.png").write_bytes(base64.b64decode(image.split(',',1)[1]))
        assert not report['errors'] and not report['failed_local_assets'],report
        negative_context=browser.new_context()
        negative_context.route('**/*.glb*',lambda route:route.abort('blockedbyclient'))
        negative=negative_context.new_page();negative.goto(args.url,wait_until='domcontentloaded')
        negative.wait_for_function('() => !!(window.HiveAssetLibrary && window.gameInstance)',timeout=120000)
        report['blocked_asset']=negative.evaluate('''()=>{
            const L=HiveAssetLibrary,d=L.getDiagnostics(),F=HiveModelFactory;
            if(!d.entries.some(e=>e.status==='error'))throw Error('Blocked import did not surface an explicit load error');
            const fallback=F.createHuman('scientist'),imported=L.handlesRoot(fallback);F.disposeModel(fallback);
            if(imported||!L.getDiagnostics().fallbacks.length)throw Error('Blocked import was silently presented as a real asset');
            return {entries:d.entries,fallbacks:L.getDiagnostics().fallbacks,imported};
        }''')
        negative_context.close();context.close();browser.close()
    (args.output/'diagnostics.json').write_text(json.dumps(report,indent=2)+'\n')
    print(f"PASS {len(report['models'])} real GLBs + {len(report['factoryRoles'])} armed factory roles: native imports, animated vertices/hand equipment, ownership/cleanup, freeze, bounds/anchors, GPU and explicit blocked-asset fallback.")


if __name__=='__main__':main()
