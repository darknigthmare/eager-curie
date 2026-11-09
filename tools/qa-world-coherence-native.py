#!/usr/bin/env python3
"""Prepared native world-coherence checks, not human/cinema or GPU performance QA.

Production methods and models are unchanged. Instrumentation exports internals;
observers forward real calls. Positions, stages, selected prop collections and
fixed subsystem ticks are explicitly prepared fixtures, not a free RAF campaign.
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright


PREPARE = r"""async()=>{
  const q=window.__worldQA,g=window.gameInstance,p=q.playerCreature,map=q.stationMap,T=THREE;
  const need=(value,message)=>{if(!value)throw Error(message);};
  await HiveModelFactory.loadTextures?.();await q.rendererEngine.renderQuality?.environmentReady;
  need(typeof q.HumanAI.prototype.canObserveThreat==='function','Current AI contract is missing');
  need(typeof map.isPropActiveForStage==='function','Current prop-stage contract is missing');
  const caption=document.createElement('div');
  caption.style.cssText='position:fixed;top:74px;left:20px;z-index:100000;background:#111827;color:#fef3c7;padding:8px;font:13px monospace';
  document.body.append(caption);
  const f={q,g,p,map,T,need,caption,h:null,prop:null,paths:[],positions:[],layout:null,
    active(run){const paused=g.isSystemPaused;try{g.isSystemPaused=false;return run();}finally{g.isSystemPaused=paused;}},
    reset(stage=4){g.startCampaign(stage);g.setSystemPaused(true);g.clearHumans();HiveSystems.vfx.clear(false);
      p.embryoMutation=null;p.isDefeated=p.inDeathThroes=p.isBiologicalTransition=false;
      p.isInVent=p.isCeilingProwling=p.isProwling=p.isWallMimic=p.isDopplerInvisible=false;
      p.acousticMaskTimer=0;p.health=p.maxHealth=1000;if(p.mesh)p.mesh.visible=true;p.moveTarget=null;p.moveWaypoints=[];
      q.rendererEngine.powerSabotagedTimer=0;this.paths=[];this.positions=[];},
    placePlayer(x,z){p.x=x;p.z=z;if(p.mesh)p.mesh.position.set(x,0,z);},
    placeHuman(h,x,z){h.x=x;h.z=z;h.mesh.position.set(x,0,z);h.motionPingCooldown=h.shootCooldown=h.grenadeCooldown=999;},
    actor(type,x,z){const h=new q.HumanAI(9100+(g.humans.length||0),type,x,z);h.createMesh();g.humans.push(h);this.placeHuman(h,x,z);return h;},
    tickActor(h,seconds){return this.active(()=>{for(let t=0;t<seconds-1e-8;t+=1/60){h.update(Math.min(1/60,seconds-t));
      this.positions.push({x:h.x,z:h.z,collision:map.checkCollision(h.x,h.z)});}return this.actorState(h);});},
    actorState(h){const runtime=h.importedAnimationRoot&&window.HiveAssetLibrary?.getRuntime(h.importedAnimationRoot);
      return {x:h.x,z:h.z,state:h.aiState,target:{...h.targetPos},goal:h.navigationGoal?{...h.navigationGoal}:null,
      path:h.pathWaypoints.map(point=>({...point})),known:h.lastKnownThreat?{x:h.lastKnownThreat.x,z:h.lastKnownThreat.z,
        remaining:h.lastKnownThreat.remaining,source:h.lastKnownThreat.source}:null,
      importedAnimation:runtime?{elapsed:runtime.elapsed,state:runtime.currentState,mode:runtime.mode}:null};},
    visiblePair(){
      // A free centre and an occluding wall do not certify an accessible
      // destination. The former(-30,-28) point is a real narrow pocket under
      // current props; retain all actual colliders and the production padding.
      const hiddenPoints=[{x:-30,z:-34},{x:-36,z:-34},{x:-30,z:-28}].filter(point=>!map.checkCollision(point.x,point.z,.8));
      need(hiddenPoints.length,'No free player point south of actual laboratory wall');
      for(const hidden of hiddenPoints)for(let x=-36;x<=-24;x+=2)for(let z=-22;z<=-14;z+=2){
        if(map.checkCollision(x,z,.8)||map.hasLineOfSight(x,z,hidden.x,hidden.z))continue;
        const routePreflight=map.findPath(x,z,hidden.x,hidden.z);if(routePreflight.length<2)continue;
        let previous={x,z};const clear=routePreflight.every(point=>{const valid=!map.checkCollision(point.x,point.z,.72)&&map.hasLineOfSight(previous.x,previous.z,point.x,point.z,.72);previous=point;return valid;});
        if(!clear||Math.hypot(previous.x-hidden.x,previous.z-hidden.z)>.05)continue;
        for(const distance of [5,8,12])for(let angle=0;angle<24;angle++){
          const point={x:x+Math.cos(angle*Math.PI/12)*distance,z:z+Math.sin(angle*Math.PI/12)*distance};
          if(!map.checkCollision(point.x,point.z,.8)&&map.hasLineOfSight(x,z,point.x,point.z))return {human:{x,z},visible:point,hidden,routePreflight};
        }
      }throw Error('No actual laboratory visible/occluded pair with a valid production-clearance detour is available');
    },
    draw(label,point={x:0,z:0},wide=false){g.setSystemPaused(true);document.getElementById('app-container').classList.remove('game-paused');
      caption.textContent='DIAGNOSTIC PRÉPARÉ — '+label;const r=q.rendererEngine;
      r.camera.clearViewOffset();r.camera.position.set(point.x+(wide?65:15),wide?105:18,point.z+(wide?75:20));
      r.camera.lookAt(point.x,wide?0:1.5,point.z);r.camera.fov=wide?65:46;r.camera.updateProjectionMatrix();
      r.updatePropVisibility(point,wide);for(let i=0;i<30;i++)r.updateWallVisibility({x:point.x,y:1.5,z:point.z},1/60);
      r.render();r.renderer.getContext().finish();return {label,camera:r.camera.position.toArray(),point,
        scope:'Actual scene/materials, diagnostic camera and prepared state; no human play or GPU FPS'};},
    cleanup(){caption.remove();g.setSystemPaused(true);}
  };window.__worldNative=f;
  return {ready:true,scope:'Actual production classes/scene. Positions and synchronous ticks are labelled prepared fixtures.'};
}"""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', required=True)
    parser.add_argument('--source-root', default=str(Path(__file__).resolve().parents[1]))
    parser.add_argument('--output', required=True)
    parser.add_argument('--no-captures', action='store_true')
    args = parser.parse_args()
    root, out = Path(args.source_root).resolve(), Path(args.output).resolve()
    if out.exists():
        raise SystemExit('Refusing to overwrite earlier world evidence: ' + str(out))
    out.mkdir(parents=True)
    digest = lambda value: hashlib.sha256(value).hexdigest()
    def runtime_paths():
        return sorted(path for path in [*root.joinpath('src').rglob('*'), root / 'index.html', root / 'vercel.json'] if path.is_file())

    paths = runtime_paths()
    before = {str(path.relative_to(root)): digest(path.read_bytes()) for path in paths}
    report = dict(scope=__doc__, complete=False, sourceBefore=before, sourceAfter=None,
                  harnessSha256=digest(Path(__file__).read_bytes()), url=args.url,
                  sources={}, assets={}, checks=[], captures=[], pageErrors=[], consoleErrors=[], httpFailures=[], failedRequests=[])
    report['navigationContract'] = {
        'local': 'All300 actual prop access points require an actual A-star route from the explicit accessOrigin; no collider bypass.',
        'global': 'The eight real room anchors require paths from0,0. Closed unwelded doors may be opened only through the real API after a collision-clear route to an operable stand point within6; the result is labelled conditional and initial states are restored.',
        'originLinks': 'Every unique local accessOrigin must connect to a real room anchor, using the documented door state of the global check.',
        'preExecutionHypothesis': 'The original draft proposed all300 paths from0,0 in the initial door state. Before any execution this was replaced by the explicit local-room plus global conditional-door contract; it was never an accepted proof.'}

    def save():
        (out / 'results.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=shutil.which('chromium'), headless=True,
            args=['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-angle=swiftshader'])
        page = browser.new_page(viewport={'width': 1440, 'height': 1000})
        page.on('pageerror', lambda error: report['pageErrors'].append(str(error)))
        page.on('console', lambda message: report['consoleErrors'].append(message.text) if message.type == 'error' else None)
        page.on('requestfailed', lambda request: report['failedRequests'].append({'url': request.url, 'failure': request.failure}))

        def response_seen(response):
            parsed = urlparse(response.url)
            if parsed.netloc != urlparse(args.url).netloc:
                return
            if response.status >= 400:
                report['httpFailures'].append({'url': response.url, 'status': response.status})
            relative = parsed.path.lstrip('/') or 'index.html'
            local = root / relative
            if response.status == 200 and (relative.startswith('assets/') or relative.endswith('.css') or relative == 'index.html'):
                value = response.body()
                expected = digest(local.read_bytes()) if local.is_file() else None
                report['assets'][relative] = {'bytes': len(value), 'sha256': digest(value), 'expected': expected, 'match': expected == digest(value)}

        page.on('response', response_seen)

        def expose(route):
            response = route.fetch()
            source, relative = response.text(), urlparse(response.url).path.lstrip('/')
            observed = digest(source.encode())
            assert observed == digest((root / relative).read_bytes()), relative
            report['sources'][relative] = observed
            if relative == 'src/game.js':
                end = source.rfind('})();')
                assert end >= 0
                source = source[:end] + 'window.__worldQA={stationMap,StationMap,HumanAI,playerCreature,rendererEngine,inputManager,audioManager,alarmSystem,resinGrid};\n' + source[end:]
            route.fulfill(response=response, body=source)

        page.route('**/src/*.js*', expose)

        def check(name, body):
            value = page.evaluate('()=>{const f=__worldNative,q=f.q,g=f.g,p=f.p,map=f.map,T=THREE,need=f.need;' + body + '}')
            report['checks'].append({'name': name, 'passed': True, 'detail': value})
            save()
            print('PASS', name, flush=True)
            return value

        def capture(name, label, point, wide=False):
            if args.no_captures:
                return
            detail = page.evaluate('({label,point,wide})=>__worldNative.draw(label,point,wide)', {'label': label, 'point': point, 'wide': wide})
            page.screenshot(path=str(out / name), timeout=120000)
            report['captures'].append({'file': name, **detail})
            save()

        try:
            save()
            page.goto(args.url, wait_until='domcontentloaded')
            page.wait_for_function('()=>!!(window.__worldQA&&window.HiveSystems?.ui?.game)', timeout=180000)
            page.locator('#btn-new-campaign').click()
            page.locator('#btn-start-act-one').click()
            page.evaluate('()=>gameInstance.setSystemPaused(true)')
            report['prepare'] = page.evaluate(PREPARE)
            save()
            check('Actual laboratory wall prevents unobserved acquisition', r"""
              f.reset();f.placePlayer(-30,-28);const h=f.actor('guard',-30,-22);f.h=h;h.mesh.rotation.y=Math.PI;
              let imported=null;h.mesh.traverse(child=>{if(!imported&&window.HiveAssetLibrary?.getRuntime(child))imported=child;});
              const runtime=imported&&HiveAssetLibrary.getRuntime(imported);need(runtime,'Actual ordinary guard did not load its imported rig');const animationBefore=runtime.elapsed;
              const before=f.actorState(h),los=map.hasLineOfSight(h.x,h.z,p.x,p.z),wall=map.checkCollision(-30,-25);
              need(wall&&!los,'Authored laboratory wall/occlusion fixture has moved');f.tickActor(h,.1);
              need(h.aiState==='PATROL'&&!h.lastKnownThreat,'Guard acquired hidden player through the actual wall');
              need(Math.abs(runtime.elapsed-animationBefore-.1)<1e-6,'Ordinary imported animation did not advance once per simulation tick');
              return {fixture:'Prepared original wall coordinates and isolated actual guard; no lure/ally/radio/tracker event. Real imported mixer clock observed, not replaced.',wall,los,before,after:f.actorState(h),animationBefore,animationAfter:runtime.elapsed};
            """)
            check('Native FOV and copied memory distinguish observation from a hidden moving actor', r"""
              const pair=f.visiblePair(),h=f.h;f.placeHuman(h,pair.human.x,pair.human.z);f.placePlayer(pair.visible.x,pair.visible.z);
              const facing=Math.atan2(p.x-h.x,p.z-h.z);h.mesh.rotation.y=facing+Math.PI;
              need(!h.canObserveThreat(p),'Guard sees behind its actual facing');h.mesh.rotation.y=facing;
              need(h.canObserveThreat(p),'Prepared clear frontal view is not observable');f.tickActor(h,1/60);
              need(h.lastKnownThreat&&h.lastKnownThreat.source==='visual','Native observation did not store a visual point');
              const known={x:h.lastKnownThreat.x,z:h.lastKnownThreat.z};f.placePlayer(pair.hidden.x,pair.hidden.z);
              need(!map.hasLineOfSight(h.x,h.z,p.x,p.z),'Second fixture is not actually occluded');f.tickActor(h,.2);
              need(h.lastKnownThreat.x===known.x&&h.lastKnownThreat.z===known.z,'Hidden live coordinates replaced remembered point');
              need(h.aiState==='SEARCH','Lost view did not use remembered search');f.aiPair=pair;
              return {fixture:'Actual room geometry, prepared actor positions and fixed actual HumanAI ticks',pair,known,after:f.actorState(h)};
            """)
            capture('01-native-ai-search.png', 'IA : recherche du dernier point observé', {'x': -30, 'z': -22})
            check('Native pursuit follows a real route around the authored wall without collider penetration', r"""
              const h=f.h,pair=f.aiPair;f.placeHuman(h,pair.human.x,pair.human.z);h.lastKnownThreat=null;
              p.isInVent=true;const original=map.findPath;let calls=0;
              map.findPath=function(...args){calls++;return original.apply(this,args);};
              try{h.navigationGoal=null;h.pathWaypoints=[];h.receiveThreatReport(pair.hidden.x,pair.hidden.z,p);
                const route=h.pathWaypoints.map(point=>({...point}));need(route.length>=2,'Occluded target did not require a real non-direct route');
                const start={x:h.x,z:h.z};f.positions=[];f.tickActor(h,2.8);
                need(f.positions.every(sample=>!sample.collision),'Native routed pursuit entered a real collider');
                need(Math.hypot(h.x-start.x,h.z-start.z)>2,'Native search failed to move along its route');
                need(calls<=5,'Native pursuit replanned without cadence bound');
                return {fixture:'Legitimate copied radio point; live player concealed, actual A-star and actual HumanAI movement, fixed2.8s',start,route,calls,samples:f.positions,after:f.actorState(h)};
              }finally{map.findPath=original;p.isInVent=false;}
            """)
            check('The actual station dispatcher advances the steam subsystem once per tick', r"""
              f.reset();f.placePlayer(0,0);const original=map.updateSteamVents;let calls=0;
              map.updateSteamVents=function(dt){calls++;return original.call(this,dt);};
              try{f.active(()=>map.update(1/60));need(calls===1,'Actual StationMap.update dispatched steam '+calls+' times');return {calls,delta:1/60,scope:'Full actual station update, one prepared simulation tick; observer forwards unchanged'};}
              finally{map.updateSteamVents=original;}
            """)
            check('Native steam keeps raw8/35 direct rates while preserving real acid collateral and its timer', r"""
              const vent=map.steamVents?.[0];need(vent,'Actual steam vent missing');
              const saved={vents:map.steamVents,ruptured:vent.isRuptured,timer:vent.timer,x:p.x,z:p.z};
              const h=f.actor('scientist',vent.x,vent.z);h.hp=h.maxHp=1000;f.placePlayer(vent.x,vent.z);p.health=p.maxHealth=1000;
              const flags=ent=>({x:ent.x,z:ent.z,hp:ent===p?ent.health:ent.hp,isCocooned:!!ent.isCocooned,isIncapacitated:!!ent.isIncapacitated,
                isDefeated:!!ent.isDefeated,isBiologicalTransition:!!ent.isBiologicalTransition,embryoMutation:ent.embryoMutation??null,form:ent.form??null});
              const before={player:flags(p),human:flags(h)},raw={player:0,human:0,humanThermal:0,humanCollateral:0,humanOther:0},events=[],pTake=p.takeDamage,hTake=h.takeDamage;
              let playerDamageDepth=0;
              p.takeDamage=function(...args){raw.player+=args[0];events.push({receiver:'player',source:'thermal',amount:args[0],attacker:args[1]===h?'human':args[1]==null?'none':'other'});
                playerDamageDepth++;try{return pTake.apply(this,args);}finally{playerDamageDepth--;}};
              h.takeDamage=function(...args){
                const source=playerDamageDepth>0&&args[1]===p?'collateral':playerDamageDepth===0&&args[1]==null?'thermal':'other';
                raw.human+=args[0];raw[source==='thermal'?'humanThermal':source==='collateral'?'humanCollateral':'humanOther']+=args[0];
                events.push({receiver:'human',source,amount:args[0],playerDamageDepth,attacker:args[1]===p?'player':args[1]==null?'none':'other'});return hTake.apply(this,args);};
              try{map.steamVents=[vent];vent.isRuptured=true;vent.timer=9;
                f.active(()=>{for(let frame=0;frame<60;frame++)map.updateSteamVents(1/60);});
                const counts={player:events.filter(event=>event.receiver==='player').length,human:events.filter(event=>event.receiver==='human').length,
                  humanThermal:events.filter(event=>event.receiver==='human'&&event.source==='thermal').length,
                  humanCollateral:events.filter(event=>event.receiver==='human'&&event.source==='collateral').length,
                  humanOther:events.filter(event=>event.receiver==='human'&&event.source==='other').length};
                f.failureDetail={contract:'native-steam-raw-rates',before,after:{player:flags(p),human:flags(h)},raw:{...raw},
                  counts,events,timer:vent.timer,net:{player:1000-p.health,human:1000-h.hp},
                  observerCorrection:'Retained world-native-2 and steam-native-diagnostic-1 disproved summing all human damage as thermal: actual nested player acid feedback adds collateral. Classification uses attacker identity AND call nesting, never damage amount.'};
                need(Math.abs(raw.player-8)<1e-7&&Math.abs(raw.humanThermal-35)<1e-7,'Native direct thermal rates changed');
                need(counts.player===60&&counts.humanThermal===60,'Expected one direct thermal call per actor/tick');
                need(counts.humanCollateral===60&&counts.humanOther===0&&raw.humanCollateral>0,'Native acid counter-effect was suppressed or misclassified');
                need(events.filter(event=>event.source==='collateral').every(event=>event.attacker==='player'&&event.playerDamageDepth>0),'Collateral was not an actual nested player damage effect');
                need(Math.abs(raw.human-raw.humanThermal-raw.humanCollateral)<1e-7&&Math.abs((1000-h.hp)-raw.human)<1e-7&&Math.abs((1000-p.health)-raw.player)<1e-7,'Raw thermal/collateral totals disagree with actual net damage');
                need(Math.abs(vent.timer-8)<1e-7,'Native steam duration advanced more than one second');
                const detail=f.failureDetail;f.failureDetail=null;
                return {fixture:'Actual vent and forwarded damage receivers; prepared co-located1000HP/unmutated drone/scientist, isolated vent collection and60 fixed steam updates. No actor repositioning inside the loop, no effect suppressed. Direct steam and real nested acid collateral are separate; legacy knockback/free movement is outside this rate contract, not human QA.',...detail};
              }finally{p.takeDamage=pTake;h.takeDamage=hTake;map.steamVents=saved.vents;vent.isRuptured=saved.ruptured;vent.timer=saved.timer;f.placePlayer(saved.x,saved.z);g.clearHumans();}
            """)
            check('Inactive future prop rejects E acid chain and direct damage authority', r"""
              f.reset();const stage=g.currentStage,prop=map.wave31Props.find(candidate=>candidate.minStage===5&&candidate.placementStatus==='placed');
              need(prop?.interactionPoint,'No actual placed stage5 prop with an access point');f.prop=prop;
              const saved=new Map();for(const key of Object.keys(map)){
                if(Array.isArray(map[key])&&!['colliders','walls','industrialPlacementDiagnostics','recoveryRoomAnchors'].includes(key)){saved.set(key,map[key]);map[key]=[];}
                else if(map[key]&&typeof map[key]==='object'&&!Array.isArray(map[key])&&Number.isFinite(map[key].x)&&Number.isFinite(map[key].z)){saved.set(key,map[key]);map[key]=null;}
              }
              map.wave31Props=[prop];map.chainQueue=[];f.placePlayer(prop.interactionPoint.x,prop.interactionPoint.z);
              const trigger=map.triggerWave31Prop,events=[];
              map.triggerWave31Prop=function(...args){const accepted=trigger.apply(this,args);events.push({id:args[0]?.id,chain:!!args[1],accepted});return accepted;};
              try{map.syncPropsToStage(4);need(prop.mesh.visible===false&&prop.collider.disabled,'Future prop not masked/disabled');
                const e=stage.interactWithNearbyProps();need(e===false&&!prop.isTriggered,'E activated an inactive future prop');
                stage.abilityReadyAt.acidSpit=0;stage.executeAcidSpit();need(!prop.isTriggered,'Acid activated inactive prop');
                map.chainQueue.push({prop,delay:0});map.updateChainReaction(.1);need(!prop.isTriggered&&map.chainQueue.length===0,'Chain retained/activated inactive prop');
                const h=f.actor('scientist',prop.x,prop.z);h.hp=h.maxHp=1000;const hp=h.hp;
                const direct=map.triggerWave31Prop(prop,true);need(direct===false&&h.hp===hp&&!prop.isTriggered,'Inactive prop retained damage authority');
                return {fixture:'Actual future prop and actions, prepared stage4/access point; unrelated prop data collections temporarily excluded, no model/production method replaced',
                  prop:{id:prop.id,minStage:prop.minStage,x:prop.x,z:prop.z,visible:prop.mesh.visible,colliderDisabled:prop.collider.disabled},e,direct,hpBefore:hp,hpAfter:h.hp,events};
              }finally{map.triggerWave31Prop=trigger;for(const [key,value]of saved)map[key]=value;g.clearHumans();}
            """)
            check('The same prop becomes active at its intended stage and impacts once', r"""
              const prop=f.prop;g.currentStageIndex=5;map.syncPropsToStage(5);HiveSystems.vfx.clear(false);
              need(map.isPropActiveForStage(prop)&&prop.mesh.visible&&prop.collider.disabled===false,'Stage5 prop failed activation');
              const saved=map.wave31Props;map.wave31Props=[prop];map.chainQueue=[];
              const h=f.actor('scientist',prop.x,prop.z);h.hp=h.maxHp=1000;let calls=0;const take=h.takeDamage;
              h.takeDamage=function(...args){calls++;return take.apply(this,args);};
              try{const first=map.triggerWave31Prop(prop),hp=h.hp,second=map.triggerWave31Prop(prop);
                need(first===true&&second===false&&calls===1&&h.hp===hp,'Active prop impact was not exactly once');
                need(Math.abs((1000-hp)-prop.damage)<1e-7,'Active native prop damage differs from authored value');
                return {fixture:'Same actual prop, stage index advanced for isolated activation contract, real native damage forwarded',id:prop.id,first,second,calls,damage:prop.damage,hp};
              }finally{h.takeDamage=take;map.wave31Props=saved;map.chainQueue=[];g.clearHumans();}
            """)
            check('All300 industrial props have finite native geometry inside bounds and no pair overlap', r"""
              f.reset(5);map.syncPropsToStage(5);q.rendererEngine.scene.updateMatrixWorld(true);
              need(map.wave31Props.length===300,'Expected300 actual wave31..60 props');
              const rows=map.wave31Props.map(prop=>{need(prop.placementStatus==='placed','Unplaced prop: '+prop.id+' '+prop.placementStatus);
                need(prop.mesh&&prop.mesh.parent&&prop.interactionPoint&&prop.accessOrigin,'Missing actual root/access/accessOrigin: '+prop.id);
                prop.mesh.updateMatrixWorld(true);const box=new T.Box3().setFromObject(prop.mesh);
                const values=[...box.min.toArray(),...box.max.toArray(),...prop.mesh.matrixWorld.elements];
                need(values.every(Number.isFinite),'Nonfinite native root geometry: '+prop.id);
                need(Math.max(Math.abs(box.min.x),Math.abs(box.max.x),Math.abs(box.min.z),Math.abs(box.max.z))<72.3,'Native geometry outside72.3: '+prop.id);
                need(box.min.y>=-.02&&box.min.y<=.02,'Native prop is floating/underground at its base: '+prop.id+' '+box.min.y);
                need(!map.checkCollision(prop.interactionPoint.x,prop.interactionPoint.z,.8),'Blocked access point: '+prop.id);
                need(!map.checkCollision(prop.accessOrigin.x,prop.accessOrigin.z,.8),'Blocked actual local circulation origin: '+prop.id);
                need(Math.hypot(prop.x-prop.interactionPoint.x,prop.z-prop.interactionPoint.z)<=6,'Access outside E6: '+prop.id);
                return {id:prop.id,status:prop.placementStatus,sector:prop.placementSector,x:prop.x,z:prop.z,minStage:prop.minStage,
                  position:prop.mesh.position.toArray(),min:box.min.toArray(),max:box.max.toArray(),access:{...prop.interactionPoint},
                  accessOrigin:{...prop.accessOrigin},declaredInteractionRoute:prop.interactionRoute?.map(point=>({...point}))||null};});
              const overlap=[];for(let a=0;a<rows.length;a++)for(let b=a+1;b<rows.length;b++){
                const x=rows[a],y=rows[b];if(x.min[0]<y.max[0]-1e-4&&x.max[0]>y.min[0]+1e-4&&x.min[2]<y.max[2]-1e-4&&x.max[2]>y.min[2]+1e-4)overlap.push([x.id,y.id]);}
              need(overlap.length===0,'Native industrial pair overlap: '+JSON.stringify(overlap.slice(0,8)));
              f.layout=rows;f.navigationOrigin={x:0,z:0};need(!map.checkCollision(0,0,.8),'Actual central navigation origin0,0 is blocked');
              return {scope:'Native Box3 world matrices/AABBs and actual access points at stage5; no GPU performance or all-prop ceiling certification',
                rows,overlap,origin:f.navigationOrigin,planningMetrics:map.industrialPlacementMetrics,maxHeight:Math.max(...rows.map(row=>row.max[1]))};
            """)
            report['navigation'] = []
            for offset in range(0, 300, 20):
                batch = page.evaluate(r"""({offset,count})=>{const f=__worldNative,map=f.map,need=f.need;
                  return f.layout.slice(offset,offset+count).map(row=>{const origin=row.accessOrigin,route=map.findPath(origin.x,origin.z,row.access.x,row.access.z,{padding:.8});
                    const alreadyAtAccess=Math.hypot(origin.x-row.access.x,origin.z-row.access.z)<=.05&&!map.checkCollision(origin.x,origin.z,.8);
                    need(route.length>0||alreadyAtAccess,'No actual A-star route to prop access: '+row.id);
                    let previous=origin;for(const point of route){need(!map.checkCollision(point.x,point.z,.8),'Route node collision: '+row.id);
                      need(map.hasLineOfSight(previous.x,previous.z,point.x,point.z,.8),'Route segment collision: '+row.id);previous=point;}
                    need(Math.hypot(previous.x-row.access.x,previous.z-row.access.z)<.81,'Route did not reach prop access: '+row.id);
                    return {id:row.id,origin,access:row.access,alreadyAtAccess,route};});} """, {'offset': offset, 'count': 20})
                report['navigation'].extend(batch)
                save()
                print('PASS actual navigation anchors', len(report['navigation']), '/300', flush=True)
            assert len(report['navigation']) == 300
            report['checks'].append({'name': 'All300 native access anchors have collision-clear actual A-star routes from explicit local origins', 'passed': True,
                                      'detail': {'count': 300, 'padding': .8, 'scope': 'Actual StationMap.findPath and collision/LOS methods in the initial door state, not playback of all300 walks'}})
            save()
            check('All eight real room anchors and local circulation origins connect through legitimate passages', r"""
              const origin={x:0,z:0},anchors=map.recoveryRoomAnchors||[];
              need(anchors.length===8,'Expected eight real room/recovery anchors');
              const initialDoors=map.blastDoors.map(door=>({door,id:door.id,isOpen:door.isOpen,isWelded:!!door.isWelded}));
              const routeTo=(start,end)=>{const route=map.findPath(start.x,start.z,end.x,end.z,{padding:.8});
                if(Math.hypot(start.x-end.x,start.z-end.z)<=.05&&!map.checkCollision(start.x,start.z,.8))return [];
                if(!route.length)return null;let previous=start;
                for(const point of route){if(map.checkCollision(point.x,point.z,.8)||!map.hasLineOfSight(previous.x,previous.z,point.x,point.z,.8))return null;previous=point;}
                return Math.hypot(previous.x-end.x,previous.z-end.z)<.81?route:null;};
              const initial=anchors.map(anchor=>({id:anchor.id,sector:anchor.sector,point:{x:anchor.x,z:anchor.z},route:routeTo(origin,anchor)}));
              const opened=[],restored=[];
              const audit={scope:'Actual routes with actual colliders and declared circulation origins; no wall/collider disabling. Door operations are separately labelled conditional, not normal-open playback.',
                centralOrigin:origin,initialDoors:initialDoors.map(({door,...state})=>state),initialAnchorRoutes:initial,
                conditional:false,openedDoorOperations:opened,finalAnchorRoutes:[],localOriginLinks:[],restoredDoors:restored};f.worldDoorAudit=audit;
              try{
                for(let pass=0;pass<map.blastDoors.length&&anchors.some(anchor=>!routeTo(origin,anchor));pass++){
                  let changed=false;
                  for(const door of map.blastDoors){
                    if(door.isOpen||door.isWelded||door.isLocked)continue;
                    const stands=[{x:door.x,z:door.z-door.depth/2-2},{x:door.x,z:door.z+door.depth/2+2},
                      {x:door.x-door.width/2-2,z:door.z},{x:door.x+door.width/2+2,z:door.z}];
                    let operation=null;
                    for(const stand of stands){if(Math.hypot(stand.x-door.x,stand.z-door.z)>6||map.checkCollision(stand.x,stand.z,.8))continue;
                      const route=routeTo(origin,stand);if(route){operation={stand,route};break;}}
                    if(!operation)continue;
                    const accepted=map.setBlastDoorState(door,true);
                    need(accepted===true&&door.isOpen&&!map.colliders.includes(door.collider),'Real door API failed to open lawful passage: '+door.id);
                    opened.push({id:door.id,stand:operation.stand,approachRoute:operation.route,api:'StationMap.setBlastDoorState(door,true)',
                      condition:'Originally closed, not welded/locked; stand reachable with actual colliders at distance<=6',meshY:door.mesh?.position.y});changed=true;
                  }
                  if(!changed)break;
                }
                const final=anchors.map(anchor=>({id:anchor.id,sector:anchor.sector,point:{x:anchor.x,z:anchor.z},route:routeTo(origin,anchor)}));
                audit.conditional=opened.length>0;audit.finalAnchorRoutes=final;
                need(final.every(row=>row.route),'A room is isolated without a legitimate operable passage: '+final.filter(row=>!row.route).map(row=>row.id).join(','));
                const unique=new Map();for(const row of f.layout)unique.set(row.accessOrigin.x+','+row.accessOrigin.z,row.accessOrigin);
                const links=[];
                for(const accessOrigin of unique.values()){
                  let link=null;const ordered=anchors.slice().sort((a,b)=>Math.hypot(a.x-accessOrigin.x,a.z-accessOrigin.z)-Math.hypot(b.x-accessOrigin.x,b.z-accessOrigin.z));
                  for(const anchor of ordered){const route=routeTo(accessOrigin,anchor);if(route){link={origin:accessOrigin,anchor:anchor.id,route};break;}}
                  need(link,'Local circulation origin isolated from every room anchor: '+JSON.stringify(accessOrigin));links.push(link);
                }
                audit.localOriginLinks=links;return audit;
              }finally{
                for(const state of initialDoors){if(state.door.isOpen!==state.isOpen){const accepted=map.setBlastDoorState(state.door,state.isOpen,true);
                  need(accepted===true&&state.door.isOpen===state.isOpen,'Could not restore prepared door state: '+state.id);restored.push({id:state.id,isOpen:state.isOpen,accepted});}}
              }
            """)
            capture('02-native-world-overview.png', '300 props : implantation native et accès contrôlés', {'x': 0, 'z': 0}, wide=True)
            sectors = page.evaluate('()=>__worldQA.stationMap.getIndustrialLayoutSectors()')
            for index, sector in enumerate([item for item in sectors if item['id'] in ['medical', 'foundry']], start=3):
                capture(f'{index:02d}-native-sector-{sector["id"]}.png', 'Secteur ' + sector['id'], {'x': sector['x'], 'z': sector['z']})
            assert not report['pageErrors'], report['pageErrors']
            assert not report['consoleErrors'], report['consoleErrors']
            assert not report['httpFailures'], report['httpFailures']
            assert not report['failedRequests'], report['failedRequests']
            assert all(row['match'] for row in report['assets'].values()), report['assets']
            report['sourceAfter'] = {str(path.relative_to(root)): digest(path.read_bytes()) for path in runtime_paths()}
            assert before == report['sourceAfter'], 'Sources changed during native world cohort'
            report['complete'] = True
            save()
        except Exception as error:
            report['failure'] = str(error)
            try:
                report['failureDetail'] = page.evaluate('()=>window.__worldNative?.failureDetail||null')
                report['failureSnapshot'] = page.evaluate('()=>({stage:gameInstance?.currentStageIndex,ai:window.__worldNative?.h?__worldNative.actorState(__worldNative.h):null,layout:__worldQA?.stationMap?.industrialPlacementMetrics,doorAudit:window.__worldNative?.worldDoorAudit||null})')
            except Exception:
                pass
            save()
            raise
        finally:
            try:
                page.evaluate('()=>window.__worldNative?.cleanup()')
            finally:
                browser.close()
                save()


if __name__ == '__main__':
    main()
