#!/usr/bin/env python3
"""Prepared native lifecycle/input/render diagnostics, not human QA or film fidelity."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
from qa_boot_flow import open_campaign_menu

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url',default='http://127.0.0.1:8098/')
    parser.add_argument('--output',required=True)
    args=parser.parse_args()
    root=Path(__file__).resolve().parents[1];out=Path(args.output).resolve()
    if out.exists():raise SystemExit('Refusing to overwrite prior evidence')
    out.mkdir(parents=True)
    sha=lambda b:hashlib.sha256(b).hexdigest()
    files=sorted([*root.joinpath('src').rglob('*.js'),*root.joinpath('src').rglob('*.css'),*root.joinpath('data').rglob('*.json'),root/'index.html'])
    report={'scope':__doc__,'sourcesBefore':{str(p.relative_to(root)):sha(p.read_bytes()) for p in files},'httpSources':{},'assets':{},'checks':[],'captures':[],'pageErrors':[],'consoleErrors':[],'httpFailures':[]}
    report['harness']={str(p.relative_to(root)):sha(p.read_bytes()) for p in [Path(__file__).resolve(),root/'tools/qa-cycle-native-probe.js']}
    def save():(out/'results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
        page=browser.new_page(viewport={'width':1440,'height':1000})
        page.on('pageerror',lambda e:report['pageErrors'].append(str(e)))
        page.on('console',lambda m:report['consoleErrors'].append(m.text) if m.type=='error' else None)
        def observe_response(response):
            url=urlparse(response.url)
            if response.status>=400:report['httpFailures'].append({'url':response.url,'status':response.status})
            if url.netloc!=urlparse(args.url).netloc or response.status!=200:return
            name=url.path.lstrip('/') or 'index.html';local=root/name
            if local.is_file() and (name.startswith(('assets/','data/')) or name.endswith('.css') or name=='index.html'):
                content=response.body();actual=sha(content);expected=sha(local.read_bytes())
                report['assets'][url.path]={'sha256':actual,'expected':expected,'match':actual==expected,'bytes':len(content)}
        page.on('response',observe_response)
        def expose(route):
            response=route.fetch();source=response.text();name=urlparse(response.url).path.lstrip('/')
            actual=sha(source.encode());assert actual==sha((root/name).read_bytes()),name
            report['httpSources'][name]=actual
            if name=='src/game.js':
                end=source.rfind('})();');assert end>=0
                source=source[:end]+'window.__cycleQA={stationMap,playerCreature,HumanAI,rendererEngine,inputManager};\n'+source[end:]
            route.fulfill(response=response,body=source)
        page.route('**/src/*.js*',expose)
        def check(name,body):
            detail=page.evaluate('()=>{const f=__cycleNative,q=__cycleQA,g=gameInstance,p=q.playerCreature;'+body+'}')
            report['checks'].append({'name':name,'detail':detail,'passed':True});save();print('PASS',name,flush=True);return detail
        def capture(name,view='wide'):
            state=page.evaluate('(view)=>__cycleNative.draw(view)',view);page.screenshot(path=str(out/name),timeout=120000)
            report['captures'].append({'file':name,'state':state});save()
        def click(selector):
            available=page.locator(selector)
            assert available.is_visible() and available.is_enabled(),selector
            report.setdefault('inputs',[]).append({'selector':selector,'text':available.inner_text()})
            available.click()
        try:
            save();page.goto(args.url,wait_until='domcontentloaded')
            page.wait_for_function('()=>!!(window.__cycleQA&&window.HiveSystems?.ui?.game)',timeout=120000)
            open_campaign_menu(page)
            click('#btn-new-campaign');click('#btn-start-act-one');page.evaluate('()=>gameInstance.setSystemPaused(true)')
            page.evaluate('async()=>{await HiveModelFactory.loadTextures?.();await __cycleQA.rendererEngine.renderQuality?.environmentReady;}')
            probe=root/'tools/qa-cycle-native-probe.js';report['probeSha256']=sha(probe.read_bytes());page.evaluate(probe.read_text())
            report['normalFixture']=page.evaluate('()=>__cycleNative.prepare("starship")');save()
            click('#btn-action-leap')
            check('Actual leap reaches a folded face anchor', '''
              const result=f.until(()=>p.attachedHost===f.host,100);
              f.require(f.face.isAttacking&&p.mesh.parent===f.host.faceAnchor,'Attachment owner or stage state mismatch');
              let contains=false;p.mesh.traverse(o=>{if(o===p.detailedModel)contains=true;});
              f.require(contains&&p.detailedModel.userData.foldedPose===true,'Visible parasite did not fold');return result;
            ''')
            capture('01-normal-attached.png')
            check('Imported human braces its hands and visibly attempts to remove the parasite', '''
              const before=f.attachedPoseMetrics();f.require(before.frozen&&before.stageOwned,'Attachment overlay lacks exclusive ownership');
              f.require(before.hands.every(h=>h.sameSide&&Math.abs(h.relativeToFace[0])>.4&&h.relativeToFace[1]>-.7&&h.distance<1.25),'Hands remain down, cross the body or intersect the center of the face '+JSON.stringify(before));
              f.step(12);const after=f.attachedPoseMetrics();
              f.require(after.hands.some((h,i)=>Math.hypot(...h.world.map((v,j)=>v-before.hands[i].world[j]))>.01),'No defensive hand animation');
              return {before,after};
            ''')
            capture('01b-normal-face-defense.png','face');capture('01c-normal-profile-grip.png','profile')
            for _ in range(8):click('#btn-action-leap')
            check('Grip clicks cannot skip minimum residence and post-implant hold', '''
              f.require(g.currentStageIndex===2&&!f.face.isCompleted,'Clicks skipped the cycle');
              f.require(f.face.attachedElapsed<2&&!f.face.postImplantPhase,'Residence was already skipped');
              return f.until(()=>f.face.postImplantPhase==='HUSK_FALL',400);
            ''')
            check('Real pause freezes the recovery phase and corpse transform', '''
              g.setSystemPaused(false);document.getElementById('btn-pause-game').click();
              f.require(g.isSystemPaused,'Pause handler failed');const before=f.snapshot(),position=f.face.deadHusk.position.toArray();
              for(let i=0;i<120;i++)f.face.update(1/60);
              f.require(before.phaseElapsed===f.face.phaseElapsed&&JSON.stringify(position)===JSON.stringify(f.face.deadHusk.position.toArray()),'Recovery progressed in pause');return {before,position};
            ''')
            page.wait_for_timeout(800)
            check('Resume retains recovery ownership', '''document.getElementById('btn-resume-game').click();f.require(!g.isSystemPaused,'Resume handler failed');g.setSystemPaused(true);return f.snapshot();''')
            check('Corpse falls and human wake is not an immediate stage advance', '''f.until(()=>f.face.postImplantPhase==='WAKE',400);f.step(70);f.require(g.currentStageIndex===2&&f.face.deadHusk.parent,'Wake skipped or corpse missing');return f.snapshot();''')
            capture('02-host-waking.png')
            check('Completed host recovery opens a single owned evolution modal', '''
              f.until(()=>g.pendingEvolution===f.face,7000);const elapsed=f.face.phaseElapsed;
              f.require(g.currentStageIndex===2&&document.getElementById('game-canvas').inert,'Modal did not own the stage and input');
              f.pendingRecoveryElapsed=elapsed;
              g.setSystemPaused(false);
              return {elapsed,stage:g.currentStageIndex};
            ''')
            page.wait_for_timeout(500)
            check('Native game loop stays frozen until the evolution confirmation', '''
              f.require(!g.isSystemPaused&&g.pendingEvolution===f.face&&f.face.phaseElapsed===f.pendingRecoveryElapsed,
                  'Evolution modal let the simulation repeat its completed recovery');
              return f.snapshot();
            ''')
            click('#modal-btn-continue')
            check('Same host discovers corpse flees through real colliders then relocates under fade', '''
              const host=f.host;f.require(g.currentStageIndex===3&&!g.pendingEvolution&&!document.getElementById('game-canvas').inert,'Continue did not release the old scene and load gestation');
              const order=['ATTACHED_HOLD','COLLAPSE','HUSK_FALL','UNCONSCIOUS','WAKE','DISCOVER','PANIC_FLEE','FADE_OUT','RELOCATING','FADE_IN'];
              f.require(order.every((name,i)=>f.phases[i]===name),'Recovery phase order changed '+JSON.stringify(f.phases));
              f.require(g.currentStage.infectedHost===host&&g.hostRecoveryRecord.host===host,'Gestation replaced the host');
              f.require(!f.samples.some(s=>s.collision),'Recovery traversed an authored collision');
              f.require(!p.mesh.visible&&host.infectionState==='GESTATING','External gestation actor state invalid');return {state:f.snapshot(),samples:f.samples};
            ''')
            capture('03-same-host-relocated.png')
            click('#btn-observe-internal-view')
            check('Manual internal view cannot rupture before maturation', '''f.require(g.currentStage.internalViewActive,'Observer button failed');f.require(document.getElementById('btn-thoracic-erupt').disabled,'Premature rupture enabled');return f.snapshot();''')
            capture('04-internal-gestation.png')
            click('#btn-exit-internal-view')
            check('Actual gestation matures before the sternum action', '''f.until(()=>g.currentStage.step==='READY_TO_BURST',650);return f.snapshot();''')
            check('Mature host retains movement until a real full-body exit is clear', '''
              f.until(()=>!!g.currentStage.planBurstExtraction(),1800);const plan=g.currentStage.planBurstExtraction();
              f.require(!q.stationMap.checkCollision(plan.start.x,plan.start.z,plan.clearance.radius),'Burst starts inside a collider');
              return {start:plan.start,end:plan.end,radius:plan.clearance.radius,duration:plan.duration};
            ''')
            click('#btn-thoracic-erupt')
            check('Sternum rupture begins an owned visible extraction, not immediate free movement', '''
              f.until(()=>g.currentStage.step==='BURST_EXTRACTION',120);f.step(20);
              f.require(g.currentStage.step==='BURST_EXTRACTION'&&p.isBiologicalTransition&&p.mesh.visible&&f.host.isConsumedByCycle,'Rupture skipped extraction');return f.snapshot();
            ''')
            capture('04b-thoracic-extraction.png')
            check('Juvenile lands after the actual short extraction without body collisions', '''
              f.until(()=>g.currentStage.step==='HUNT_FAUNA',100);f.require(p.mesh.visible&&f.host.isConsumedByCycle&&!p.isBiologicalTransition,'Rupture boundary failed');
              f.require(f.extractionSamples.length>30&&!f.extractionSamples.some(s=>s.collision||!s.fullBodyClear),'Extraction crossed a collider');
              f.require(!q.stationMap.checkCollision(p.x,p.z,p.creatureEnvelope.radius)&&p.mesh.position.y===0,'Juvenile landed inside geometry');return {state:f.snapshot(),samples:f.extractionSamples};
            ''')
            check('Missing food cannot bypass the cocoon', '''f.require(g.currentStage.emergeAdultForm()===false,'Unfed juvenile emerged');g.currentStage.biomassHunted=3;g.currentStage.updateHUD();return {fixture:'Only biomass=3 is prepared; real cocoon button, maturation and emergence methods are tested next',state:f.snapshot()};''')
            check('Click-to-move completes a short juvenile route without dropping its last half unit', '''
              const map=q.stationMap,start={x:p.x,z:p.z},padding=p.creatureEnvelope.radius;
              const site=Array.from({length:16},(_,i)=>({x:start.x+Math.cos(i*Math.PI/8)*.35,z:start.z+Math.sin(i*Math.PI/8)*.35}))
                .find(({x,z})=>Math.abs(x)<=70&&Math.abs(z)<=70&&!map.checkCollision(x,z,padding)&&map.hasLineOfSight(start.x,start.z,x,z,padding));
              f.require(site,'No clear authored .35-unit approach at the extraction site');
              p.setMoveTarget(site.x,site.z);
              f.until(()=>!p.moveTarget,90);
              const remaining=Math.hypot(p.x-site.x,p.z-site.z);
              f.require(remaining<=.03,`Short click route was dropped before arrival (${remaining})`);
              return {start,site,remaining};
            ''')
            check('Juvenile reaches a real floor site with full adult clearance', '''
              const radius=p.getAdultClearance().radius;let site=null;
              const candidates=[...(q.stationMap.recoveryRoomAnchors||[])];
              for(const distance of [0,4,8,12,20,28,40])for(let i=0;i<16;i++)candidates.push({x:p.x+Math.cos(i*Math.PI/8)*distance,z:p.z+Math.sin(i*Math.PI/8)*distance});
              for(const candidate of candidates){
                const {x,z}=candidate;if(site||Math.abs(x)>70||Math.abs(z)>70)continue;
                if(q.stationMap.checkCollision(x,z,radius))continue;
                if(![0,Math.PI/2,Math.PI,Math.PI*1.5].some(angle=>Array.from({length:13},(_,i)=>i/12*2.4).every(distance=>!q.stationMap.checkCollision(x+Math.sin(angle)*distance,z+Math.cos(angle)*distance,radius))))continue;
                const route=q.stationMap.findPath(p.x,p.z,x,z,{padding:p.creatureEnvelope.radius});
                if(Math.hypot(p.x-x,p.z-z)<.03||route.length&&Math.hypot(route.at(-1).x-x,route.at(-1).z-z)<=.03)site={x,z};
              }
              f.require(site,'No reachable adult-clearance molt site');
              const navigation=()=>({actual:{x:p.x,z:p.z},destination:{...site},distance:Math.hypot(p.x-site.x,p.z-site.z),
                moveTarget:p.moveTarget?{x:p.moveTarget.x,z:p.moveTarget.z}:null,waypoints:(p.moveWaypoints||[]).map(point=>({x:point.x,z:point.z}))});
              f.moltNavigation={radius,arrivalTolerance:.03,before:navigation()};
              p.setMoveTarget(site.x,site.z);f.moltNavigation.planned=navigation();
              f.until(()=>{const current=navigation();f.moltNavigation.latest=current;return current.distance<=.03&&!current.moveTarget&&!current.waypoints.length;},1200);
              f.moltNavigation.after=navigation();
              f.require(!q.stationMap.checkCollision(p.x,p.z,radius),'Arrival lacks adult clearance');
              const exit=Array.from({length:12},(_,i)=>i*Math.PI/6).find(angle=>Array.from({length:9},(_,i)=>i*.3)
                .every(distance=>!q.stationMap.checkCollision(p.x+Math.sin(angle)*distance,p.z+Math.cos(angle)*distance,radius)));
              f.require(exit!==undefined,'Actual arrived position has no 2.4-unit adult extraction route');f.moltNavigation.actualExitAngle=exit;
              return {site,radius,navigation:f.moltNavigation,state:f.snapshot()};
            ''')
            click('#btn-start-chrysalis')
            check('Maturation cannot be skipped by calling emergence', '''f.require(g.currentStage.emergeAdultForm()===false,'Immature cocoon emerged');f.until(()=>g.currentStage.chrysalisTimer>=100,300);return f.snapshot();''')
            click('#btn-emerge-drone')
            check('Actual cocoon extraction remains on stage3 with progressive sutures', '''
              f.require(g.currentStageIndex===3&&g.currentStage.step==='EMERGING','Emergence advanced immediately');
              f.step(80);const c=g.currentStage;f.require(c.step==='EMERGING'&&c.emergenceCocoon?.parent,'Opening cocoon disappeared');
              f.require(c.emergenceCocoon.getObjectByName('suture_lip_left').position.x<-.06,'Suture did not open');
              p.mesh.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(p.mesh);f.require(box.min.y>=-.03,'Emerging adult penetrated floor');return {state:f.snapshot(),adultMinY:box.min.y};
            ''')
            capture('05-cocoon-emerging.png')
            page.evaluate('()=>__cycleNative.until(()=>Boolean(gameInstance.pendingEvolution),180)')
            click('#modal-btn-continue')
            check('Extraction finishes once and leaves the real exuvia', '''f.require(g.currentStageIndex===4&&!g.pendingEvolution,'Completion did not advance once');f.require([...g.biologicalRemains].some(o=>o.name==='discarded_chrysalis_exuvia'&&o.parent),'Exuvia missing');return f.snapshot();''')
            capture('06-emerged-adult.png')
            check('Restart clears all remains and old phase ownership', '''const old=f.face,remains=[...g.biologicalRemains];g.startCampaign(1);g.setSystemPaused(true);f.require(g.biologicalRemains.size===0&&remains.every(o=>!o.parent),'Restart retained prior remains');const stage=g.currentStage;old.update(.05);f.require(g.currentStage===stage,'Stale cycle advanced new game');return {remaining:g.biologicalRemains.size};''')
            report['royalFixture']=page.evaluate('()=>__cycleNative.prepare("hive")');save();click('#btn-action-leap')
            check('Royal attachment folds the actual visible descendant', '''
              f.until(()=>p.attachedHost===f.host,100);let contains=false;p.mesh.traverse(o=>{if(o===p.detailedModel)contains=true;});
              f.require(contains&&p.detailedModel.userData.foldedPose===true,'Royal pose targets a detached model');
              f.royalBounds=f.attachmentBounds();return {state:f.snapshot(),bounds:f.royalBounds};
            ''')
            capture('07-royal-attached.png')
            capture('07b-royal-face-defense.png','face');capture('07c-royal-profile-grip.png','profile')
            check('Rendered royal parasite remains below the same facial size limit', '''
              const bounds=f.attachmentBounds(),size=bounds.visibleSize;
              f.require(bounds.renderedMeshes>0&&size[0]<2.2&&size[1]<2.2,'Rendered royal parasite remains torso-sized '+JSON.stringify(bounds));return bounds;
            ''')
            report['sourcesAfter']={str(p.relative_to(root)):sha(p.read_bytes()) for p in files};assert report['sourcesBefore']==report['sourcesAfter'],'Runtime source changed during native cohort'
            assert not report['pageErrors'],report['pageErrors'];assert not report['consoleErrors'],report['consoleErrors'];assert not report['httpFailures'],report['httpFailures']
            assert all(item['match'] for item in report['assets'].values()),'A served asset differs from the local source'
            report['complete']=True;save()
        except Exception as error:
            report['failure']=str(error)
            try:report['failureDiagnostic']=page.evaluate('''()=>{
              const f=window.__cycleNative,map=window.__cycleQA?.stationMap;
              return {snapshot:f?.snapshot(),moltNavigation:f?.moltNavigation,royalBounds:f?.royalBounds,samples:f?.samples,extractionSamples:f?.extractionSamples,firstCollision:f?.samples?.find(s=>s.collision),
                activeColliders:(map?.colliders||[]).filter(c=>!c.disabled).map(c=>({name:c.mesh?.name,id:c.id,
                  minX:c.minX,maxX:c.maxX,minZ:c.minZ,maxZ:c.maxZ,isWall:!!c.isWall,stageMin:c.stageMin}))};
            }''')
            except Exception:pass
            save();raise
        finally:browser.close();save()

if __name__=='__main__':main()
