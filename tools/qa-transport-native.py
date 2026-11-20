#!/usr/bin/env python3
"""Prepared native body transport/chamber diagnostics; not human QA or film fidelity."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--url',default='http://127.0.0.1:8098/');parser.add_argument('--output',required=True);args=parser.parse_args()
    root=Path(__file__).resolve().parents[1];out=Path(args.output).resolve()
    if out.exists():raise SystemExit('Refusing to overwrite earlier evidence')
    out.mkdir(parents=True);sha=lambda b:hashlib.sha256(b).hexdigest()
    paths=sorted([*root.joinpath('src').rglob('*.js'),*root.joinpath('src').rglob('*.css'),*root.joinpath('data').rglob('*.json'),root/'index.html'])
    r={'scope':__doc__,'before':{str(p.relative_to(root)):sha(p.read_bytes()) for p in paths},'httpSources':{},'assets':{},'checks':[],'captures':[],'pageErrors':[],'consoleErrors':[],'httpFailures':[],'harnessSha256':sha(Path(__file__).read_bytes())}
    def save():(out/'results.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
        page=browser.new_page(viewport={'width':1440,'height':1000});page.on('pageerror',lambda e:r['pageErrors'].append(str(e)));page.on('console',lambda m:r['consoleErrors'].append(m.text) if m.type=='error' else None)
        def response(value):
            if value.status>=400:r['httpFailures'].append({'url':value.url,'status':value.status})
            parsed=urlparse(value.url);name=parsed.path.lstrip('/') or 'index.html';local=root/name
            if parsed.netloc==urlparse(args.url).netloc and value.status==200 and local.is_file() and (name.startswith(('assets/','data/')) or name.endswith('.css') or name=='index.html'):
                content=value.body();r['assets'][name]={'sha256':sha(content),'match':sha(content)==sha(local.read_bytes())}
        page.on('response',response)
        def expose(route):
            value=route.fetch();source=value.text();name=urlparse(value.url).path.lstrip('/');assert sha(source.encode())==sha((root/name).read_bytes());r['httpSources'][name]=sha(source.encode())
            if name=='src/game.js':
                end=source.rfind('})();');assert end>=0;source=source[:end]+'window.__transportQA={stationMap,playerCreature,HumanAI,rendererEngine,inputManager};\n'+source[end:]
            route.fulfill(response=value,body=source)
        page.route('**/src/*.js*',expose)
        def check(name,body):
            value=page.evaluate('()=>{const f=__transportNative,q=__transportQA,g=gameInstance,p=q.playerCreature,map=q.stationMap;'+body+'}')
            r['checks'].append({'name':name,'passed':True,'detail':value});save();print('PASS',name,flush=True)
        def capture(name):
            state=page.evaluate('()=>__transportNative.draw()');page.screenshot(path=str(out/name),timeout=120000);r['captures'].append({'file':name,'state':state});save()
            assert state['cameraDiagnostic']['clear'],'The actual intake view is blocked by opaque scenery: '+json.dumps(state['cameraDiagnostic'])
        try:
            save();page.goto(args.url,wait_until='domcontentloaded');page.wait_for_function('()=>!!(window.__transportQA&&window.HiveSystems?.ui?.game)',timeout=120000)
            page.locator('#btn-new-campaign').click();page.locator('#btn-start-act-one').click();page.evaluate('()=>gameInstance.setSystemPaused(true)')
            page.evaluate('async()=>{await HiveModelFactory.loadTextures?.();await __transportQA.rendererEngine.renderQuality?.environmentReady;}')
            page.evaluate('''()=>{
              const q=__transportQA,g=gameInstance,p=q.playerCreature,map=q.stationMap;
              const f={host:null,chute:null,transfer:null,samples:[],require(v,m){if(!v)throw Error(m);},
                active(run){const paused=g.isSystemPaused;try{g.isSystemPaused=false;return run();}finally{g.isSystemPaused=paused;}},
                key(key){return this.active(()=>{const code=key===' '?'Space':'Key'+key.toUpperCase();q.inputManager.canvas.focus();window.dispatchEvent(new KeyboardEvent('keydown',{key,code,bubbles:true}));window.dispatchEvent(new KeyboardEvent('keyup',{key,code,bubbles:true}));this.lastInput={key,code,ground:p.canTransportOnGround(),toast:document.getElementById('toast-message')?.textContent,transfer:!!p.disposalTransfer};});},
                prepare(){g.startCampaign(4);g.setSystemPaused(true);g.clearHumans();p.x=0;p.z=0;p.mesh.position.set(0,0,0);
                  const host=new q.HumanAI(9701,'scientist',0,0,'Corps QA transport');host.createMesh();host.hp=0;host.isIncapacitated=true;g.humans.push(host);
                  const geometry=p.getTransportGeometry(host);this.require(geometry,'Native corpse geometry is not transportable');let found=null;
                  for(const chute of map.medlabAutopsyChutes||[])for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
                    const x=chute.x+Math.sin(angle)*5.4,z=chute.z+Math.cos(angle)*5.4,yaw=angle+Math.PI;
                    if(found||map.checkCollision(x,z,p.creatureEnvelope.radius))continue;
                    const hx=x-Math.sin(yaw)*1.9,hz=z-Math.cos(yaw)*1.9,pos=new THREE.Vector3(hx,-geometry.bounds.min.z+.025,hz),quat=p.getTransportQuaternion(yaw);
                    if(!p.transportBodyFitsAt(geometry,pos,quat)||!map.hasLineOfSight(x,z,hx,hz,.12))continue;
                    p.x=x;p.z=z;p.mesh.position.set(x,0,z);p.mesh.rotation.y=yaw;host.x=hx;host.z=hz;host.mesh.position.copy(pos);host.mesh.quaternion.copy(quat);
                    q.rendererEngine.updatePropVisibility({x:chute.x,z:chute.z},false);if(!map.canInteractWithProp(chute))continue;
                    found={chute,x,z,hx,hz,yaw,key:Math.abs(Math.sin(yaw))>.5?(Math.sin(yaw)>0?'d':'a'):(Math.cos(yaw)>0?'s':'w')};
                  }
                  this.require(found,'No real loading bay has space for actor, full carried body and unobstructed approach');
                  this.host=host;this.chute=found.chute;this.fixture=found;this.samples=[];this.transfer=null;
                  return {fixture:'One real imported corpse placed on an authored collider-free floor and approach; all other NPCs removed, no unrelated map hazards stepped',body:geometry.size.toArray(),approach:{x:found.x,z:found.z,key:found.key},chute:{id:found.chute.id,x:found.chute.x,z:found.chute.z}};
                },
                tick(frames){return this.active(()=>{for(let i=0;i<frames;i++){p.update(1/60);map.updateMedlabAutopsyChutes(1/60);HiveAssetLibrary.update(1/60);this.samples.push({x:p.x,z:p.z,bodyX:this.host.x,bodyZ:this.host.z,phase:this.transfer?.phase,disposed:!!this.host.isDisposed});}return this.snapshot();});},
                snapshot(){return {carried:p.draggedHost===this.host,bodyVisible:this.host?.mesh?.visible??false,bodyPresent:g.humans.includes(this.host),disposed:!!this.host?.isDisposed,eligibility:this.host?.hostEligibility,hostHp:this.host?.hp,phase:this.transfer?.phase,elapsed:this.transfer?.elapsed,count:this.chute?.disposalCount||0,lid:this.chute?.mesh.userData.incineratorIntake.lid.rotation.x,busy:!!p.disposalTransfer};},
                draw(){
                  g.setSystemPaused(true);document.getElementById('app-container').classList.remove('game-paused');const r=q.rendererEngine,c=this.chute;
                  r.camera.clearViewOffset();r.camera.position.set(c.x,6.5,c.z+1.5);r.camera.lookAt(c.x,.8,c.z);r.camera.fov=55;r.camera.updateProjectionMatrix();
                  r.scene.updateMatrixWorld(true);const target=new THREE.Vector3(c.x,.8,c.z),direction=target.clone().sub(r.camera.position),distance=direction.length();
                  const inside=(node,parent)=>{for(let cursor=node;cursor;cursor=cursor.parent)if(cursor===parent)return true;return false;};
                  const opaque=node=>{for(let cursor=node;cursor;cursor=cursor.parent)if(!cursor.visible)return false;return (Array.isArray(node.material)?node.material:[node.material]).some(m=>m&&m.visible!==false&&(!m.transparent||m.opacity>=.98));};
                  const hits=new THREE.Raycaster(r.camera.position.clone(),direction.normalize(),.05,distance).intersectObject(r.scene,true).filter(h=>opaque(h.object));
                  const first=hits[0],allowed=!first||inside(first.object,c.mesh)||inside(first.object,p.mesh)||this.host?.mesh&&inside(first.object,this.host.mesh);
                  const cameraDiagnostic={fixture:'Explicit under-beam overhead camera; no scene object hidden or actor moved',position:r.camera.position.toArray(),target:target.toArray(),fov:r.camera.fov,clear:!!allowed,
                    opaqueHits:hits.slice(0,12).map(h=>({name:h.object.name,distance:h.distance,intake:inside(h.object,c.mesh),actor:inside(h.object,p.mesh),body:!!this.host?.mesh&&inside(h.object,this.host.mesh)}))};
                  r.render();r.renderer.getContext().finish();return {...this.snapshot(),cameraDiagnostic};
                }}
              window.__transportNative=f;
            }''')
            check('Fixture uses the actual loading bay and body geometry','return f.prepare();')
            check('Uncarried nearby bodies cannot be remotely incinerated','f.require(map.dumpCorpseIntoIncinerator(f.chute)===false,"Uncarried body accepted");return f.snapshot();')
            check('Actual drag control acquires exactly the prepared corpse','f.active(()=>document.getElementById("btn-drag-host").click());f.require(p.draggedHost===f.host,"Drag UI failed");return f.snapshot();')
            check('Keyboard movement transports the body at bounded speed on the actual floor','const before=[p.x,p.z];f.active(()=>{const key=f.fixture.key;window.dispatchEvent(new KeyboardEvent("keydown",{key,code:"Key"+key.toUpperCase(),bubbles:true}));try{f.tick(10);}finally{window.dispatchEvent(new KeyboardEvent("keyup",{key,code:"Key"+key.toUpperCase(),bubbles:true}));}});const distance=Math.hypot(p.x-before[0],p.z-before[1]);f.require(distance>0&&distance<=.41,"Body movement not bounded "+distance);return {distance,state:f.snapshot()};')
            capture('01-transport-floor.png')
            check('The installed Space command initiates a simulation-owned load instead of hiding or damaging the body','f.key(" ");f.transfer=p.disposalTransfer;f.require(f.transfer?.host===f.host&&!f.host.isDisposed&&f.host.mesh.visible,"Loading did not retain the real body");f.countBefore=f.chute.disposalCount||0;f.tick(70);f.require(!f.host.isDisposed&&f.host.mesh.visible,"Body disappeared early");return f.snapshot();')
            check('The real desktop Q action describes loading and remains available at the same simulation phase', '''
              HiveSystems.ui.syncLocomotionActions();
              const button = document.getElementById('btn-drone-ceiling');
              const label = button.querySelector('.action-label').textContent;
              f.require(f.transfer.phase === 'LOAD' && label === 'CHARGEMENT — ANNULER' && !button.disabled,
                `Loading action has wrong phase or state: ${label}`);
              return {label, phase: f.transfer.phase, disabled: button.disabled};
            ''')
            capture('02-loading-open-chamber.png')
            check('Pause freezes the body and hatch','g.setSystemPaused(false);document.getElementById("btn-pause-game").click();const before=f.snapshot(),position=f.host.mesh.position.clone();for(let i=0;i<100;i++)map.updateMedlabAutopsyChutes(.05);f.require(f.transfer.elapsed===before.elapsed&&f.host.mesh.position.equals(position),"Pause advanced loading");document.getElementById("btn-resume-game").click();g.setSystemPaused(true);return before;')
            check('Disposal commits once and removes body ownership and host eligibility','f.tick(160);f.require(f.host.isDisposed&&f.host.hp===0&&f.host.hostEligibility==="none"&&!g.humans.includes(f.host)&&!f.host.mesh,"Disposed body remains reusable");f.require(f.chute.disposalCount===f.countBefore+1&&!p.disposalTransfer&&!f.chute.pendingTransfer,"Disposal count/owner invalid");f.require(map.dumpCorpseIntoIncinerator(f.chute)===false,"Repeated disposal accepted");HiveSystems.ui.syncLocomotionActions();f.require(document.querySelector("#btn-drone-ceiling .action-label").textContent==="PAROI & PLAFOND","Loading label did not reset");return f.snapshot();')
            capture('03-chamber-closed-disposed.png')
            check('Q cancels a new transfer and restores the visible body','f.prepare();f.active(()=>document.getElementById("btn-drag-host").click());f.key(" ");f.transfer=p.disposalTransfer;f.require(!!f.transfer,"Cancellation fixture cannot load");f.tick(40);f.key("q");f.require(f.transfer.cancelled&&!p.disposalTransfer&&!f.chute.pendingTransfer&&f.host.mesh?.visible&&!f.host.isDisposed,"Q left a phantom body/owner");return f.snapshot();')
            check('Campaign reset clears an active transfer and its exact old body','f.active(()=>document.getElementById("btn-drag-host").click());f.key(" ");const old=p.disposalTransfer;f.require(!!old,"Reset fixture cannot load");g.startCampaign(1);g.setSystemPaused(true);f.require(old.cancelled&&!p.disposalTransfer&&!f.chute.pendingTransfer&&!f.host.mesh,"Reset retained prior transport state");return {cancelled:old.cancelled};')
            r['after']={str(p.relative_to(root)):sha(p.read_bytes()) for p in paths};assert r['before']==r['after'],'Runtime changed during cohort';assert not r['pageErrors'],r['pageErrors'];assert not r['consoleErrors'],r['consoleErrors'];assert not r['httpFailures'],r['httpFailures'];assert all(a['match'] for a in r['assets'].values());r['complete']=True;save()
        except Exception as error:
            r['failure']=str(error)
            try:r['failureDiagnostic']=page.evaluate('''()=>{
              const f=window.__transportNative,q=window.__transportQA,p=q.playerCreature,map=q.stationMap,g=gameInstance;
              const geometry=p.dragTransport?.geometry||p.getTransportGeometry(f.host),chute=f.chute,intake=map.getIncineratorIntake(chute),scale=chute.mesh.getWorldScale(new THREE.Vector3());
              const target=intake?chute.mesh.localToWorld(new THREE.Vector3(-(geometry.bounds.min.x+geometry.bounds.max.x)/(2*scale.x),intake.lipY-geometry.bounds.min.z/scale.y+.06,(geometry.bounds.min.y+geometry.bounds.max.y)/(2*scale.z))):null;
              return {snapshot:f?.snapshot(),geometry:{size:geometry?.size.toArray(),min:geometry?.bounds.min.toArray(),max:geometry?.bounds.max.toArray()},
                intake:intake?{width:intake.width,length:intake.length,depth:intake.depth,floorY:intake.floorY,lipY:intake.lipY,scale:scale.toArray(),thresholds:[intake.width*scale.x-.08,intake.length*scale.z-.08,intake.depth*scale.y-.12]}:null,
                guards:{groundAtDiagnosticPause:p.canTransportOnGround(),interactable:map.canInteractWithProp(chute),active:map.isPropActiveForStage(chute),visible:chute.mesh.visible,playerDistance:Math.hypot(p.x-chute.x,p.z-chute.z),bodyDistance:Math.hypot(p.x-f.host.x,p.z-f.host.z),bodyLOS:map.hasLineOfSight(p.x,p.z,f.host.x,f.host.z,.12),targetFits:target&&p.transportBodyFitsAt(geometry,target,chute.mesh.getWorldQuaternion(new THREE.Quaternion()).multiply(p.getTransportQuaternion(0)),chute)},
                lastInput:f.lastInput,toast:document.getElementById('toast-message')?.textContent,
                colliders:(map.colliders||[]).filter(c=>!c.disabled&&Math.hypot((c.minX+c.maxX)/2-chute.x,(c.minZ+c.maxZ)/2-chute.z)<18).map(c=>({name:c.mesh?.name,minX:c.minX,maxX:c.maxX,minZ:c.minZ,maxZ:c.maxZ,isTarget:c===chute.collider||c.mesh===chute.mesh})),
                counts:{humans:g.humans.length,disposed:chute.disposalCount||0}};
            }''')
            except Exception:pass
            save();raise
        finally:browser.close();save()

if __name__=='__main__':main()
