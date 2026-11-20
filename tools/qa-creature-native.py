#!/usr/bin/env python3
"""Prepared native creature locomotion/T140, real inputs/models/contacts.

No production logic is replaced. Prepared positions/HP and fixed subsystem ticks
are not a human playthrough, complete QA or cinema1:1/performance certification.
"""
import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import json
from pathlib import Path
import shutil
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright
from qa_boot_flow import open_campaign_menu


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', required=True)
    parser.add_argument('--source-root', default=str(Path(__file__).resolve().parents[1]))
    parser.add_argument('--output', required=True)
    parser.add_argument('--no-captures', action='store_true')
    args = parser.parse_args()
    root, out = Path(args.source_root).resolve(), Path(args.output).resolve()
    if out.exists():
        raise SystemExit('Preserve earlier native attempts: ' + str(out))
    out.mkdir(parents=True)
    digest = lambda value: hashlib.sha256(value).hexdigest()

    def inventory():
        files = [path for path in [*root.joinpath('src').rglob('*'), root / 'index.html', root / 'vercel.json'] if path.is_file()]
        return {str(path.relative_to(root)): digest(path.read_bytes()) for path in sorted(files)}

    probe = root / 'tools/qa-creature-native-probe.js'
    report = dict(scope=__doc__, complete=False, url=args.url, sourceBefore=inventory(), sourceAfter=None,
                  harness={str(path.relative_to(root)): digest(path.read_bytes()) for path in [Path(__file__).resolve(), probe]},
                  sources={}, assets={}, checks=[], captures=[], pageErrors=[], consoleErrors=[], httpFailures=[], failedRequests=[], limitations=[])
    report['resinRepositionContract'] = {
        'retainedFailure': '.tools/coherence-fix-20261109/creature-native-1/results.json',
        'disprovedInitialHypothesis': 'A13x1x13 barrier at the originally selected support was assumed to leave a real along-beam descent. The retained native failure and subsequent real-geometry preflights show that this exit is not guaranteed.',
        'currentContract': 'Anchor identity, rendering, ownership and restart are checked with the large floor barrier. A separate small solid blocker verifies the along-beam detour with the authored support and the installed Q command.'}

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
                source = source[:end] + 'window.__creatureQA={stationMap,playerCreature,HumanAI,rendererEngine,inputManager,audioManager};\n' + source[end:]
            route.fulfill(response=response, body=source)

        page.route('**/src/*.js*', expose)

        def check(name, body):
            value = page.evaluate('()=>{const f=__creatureNative,q=f.q,g=f.g,p=f.p,map=f.map,T=THREE,need=f.need;' + body + '}')
            report['checks'].append({'name': name, 'passed': True, 'detail': value})
            save()
            print('PASS', name, flush=True)
            return value

        def press(key):
            page.evaluate('''()=>{
              gameInstance.setSystemPaused(false);
              __creatureQA.inputManager.canvas.focus();
            }''')
            try:
                page.keyboard.press(key)
            finally:
                page.evaluate('()=>gameInstance.setSystemPaused(true)')

        def capture(file, label, *, gameplay=False):
            if args.no_captures:
                return
            draw = 'drawGameplay' if gameplay else 'draw'
            detail = page.evaluate(f'(label)=>__creatureNative.{draw}(label)', label)
            page.screenshot(path=str(out / file), timeout=120000)
            report['captures'].append({'file': file, 'mode': 'diagnostic', **detail})
            save()
            return detail

        def assert_capture_legible(detail):
            beam = next(item for item in detail['beams'] if item['id'] == detail['activeSupport'])
            assert beam['opacity'] <= .18 and not beam['depthWrite'], beam
            for actor in detail['actors']:
                assert any(sample['inFrame'] and not sample['hudOverlap'] and not sample['occluder']
                           for sample in actor['samples']), actor
            assert all(other['opacity'] == 1 and other['depthWrite'] for other in detail['beams'] if other != beam)

        try:
            save()
            page.goto(args.url, wait_until='domcontentloaded')
            page.wait_for_function('()=>!!(window.__creatureQA&&window.HiveSystems?.ui?.game)', timeout=180000)
            open_campaign_menu(page)
            page.locator('.origin-card[data-origin="starship"]').click()
            page.locator('#btn-new-campaign').click()
            page.locator('#btn-start-act-one').click()
            page.evaluate('()=>gameInstance.setSystemPaused(true)')
            report['prepare'] = page.evaluate(probe.read_text())
            # Suspend automatic animation frames while Chromium sends genuine
            # key events. Subsystem ticks below retain deterministic timing.
            page.clock.install()
            page.clock.pause_at(datetime.now(timezone.utc) + timedelta(seconds=1))
            save()
            approach_fixture = page.evaluate('()=>__creatureNative.findSupport()')
            press('q')
            check('Chromium Q begins a real wall/support approach without instantaneous altitude', r"""
              const after=f.snapshot();
              need(after.locomotionPhase==='APPROACH','Installed Q did not start approach');
              need(Math.abs(after.position[1]-.015)<.035&&!after.hanging,'Q caused instant ascent');
              return {prepared:f.supportFixture,start:f.fixtureStart,after};
            """)
            report['approachFixture'] = approach_fixture
            capture('01-creature-approach.png', 'Approche de la jonction mur/poutre réelle')
            check('Climbing and rolling use simulation time with actual deck/support contacts', r"""
              f.until('CLIMB');f.ticks(10);const climbing=f.snapshot();
              need(climbing.locomotionPhase==='CLIMB','Climb phase skipped');return {climbing,samples:f.samples};
            """)
            capture('02-creature-climb.png', 'Montée animée sur la paroi, gabarit réel')
            check('Roll/inversion stays under the actual support instead of a global height', r"""
              f.until('ROLL');f.ticks(18);const rolled=f.snapshot();need(rolled.locomotionPhase==='ROLL','Roll phase skipped');
              need(rolled.rotation[2]>0&&rolled.rotation[2]<Math.PI,'Roll did not interpolate inversion');return rolled;
            """)
            capture('03-creature-roll.png', 'Rotation progressive sous la poutre')
            check('Hanging ends at native underside contact and locks incompatible physical controls', r"""
              f.until('HANG');const hang=f.snapshot(),controls=f.controls();
              need(hang.hanging&&!hang.busy&&Math.abs(hang.rotation[2]-Math.PI)<.02,'Actual controller did not settle hanging');
              need(Math.abs(hang.bounds.max[1]-hang.ceiling)<.2,'Claws/body not under native support');
              need(controls.state.hanging&&!controls.state.busy,'Native HUD locomotion contract disagrees');return {hang,controls,samples:f.samples};
            """)
            capture('04-creature-hang.png', 'Appui au plafond : pose suspendue et commandes cohérentes')
            fixture = page.evaluate('()=>__creatureNative.makeVictim(300)')
            tracker_before = page.evaluate('()=>gameInstance.motionTracker.focusedMode')
            report['captureTargetFixture'] = fixture
            press('t')
            check('Chromium T starts a native140 capture without switching the M314 tracker', r"""
              const state=f.snapshot(),controls=f.controls();
              need(state.actionPhase==='WINDUP'&&f.hits.length===0,'T did not start an uncommitted capture windup');
              need(controls.state.busy&&controls.buttons.filter(button=>button.id!=='btn-drone-ceiling').every(button=>button.disabled),'Busy capture failed to lock physical UI');
              const before=JSON.stringify({phase:state.actionPhase,elapsed:state.elapsed,position:state.position});
              for(const key of ['e',' ','t'])f.key(key);const after=f.snapshot();
              need(before===JSON.stringify({phase:after.actionPhase,elapsed:after.elapsed,position:after.position}),'Busy physical key interrupted/restarted capture');
              return {state,controls};
            """)
            assert page.evaluate('()=>gameInstance.motionTracker.focusedMode') == tracker_before, 'Tail command stole tracker shortcut'
            capture('05-t140-windup-gameplay.png', 'T140 · préparation', gameplay=True)
            capture('05-t140-windup.png', 'T140 : préparation du dard, aucune blessure immédiate')
            check('T140 raw140 is applied once at contact, then the same native actor is hoisted', r"""
              f.ticks(18);need(f.hits.length===0,'Native windup hit before0.32s');
              const before=new Set(HiveSystems.vfx.effects);
              f.ticks(3);need(f.hits.length===1&&f.hits[0].amount===140,'Native contact did not commit exactly140 once');
              need(p.ceilingAction?.phase==='HOIST'&&f.victim.ceilingActionOwner===p.ceilingAction,'Native capture ownership missing');
              const impactLabels=HiveSystems.vfx.effects.filter(effect=>effect.sprite&&!before.has(effect)).length;
              need(impactLabels===1,'T140 contact emitted stacked damage labels');
              f.ticks(22,{humanFirst:true});need(f.hits.length===1,'Mixed observer update order delivered duplicate contact');
              return {state:f.snapshot(),impactLabels,scope:'Actual takeDamage forwarded, imported/procedural actor, real checked root trajectory; fixed relevant ticks'};
            """)
            view = capture('06-t140-hoist-gameplay.png', 'T140 · hissage', gameplay=True)
            if view:
                assert_capture_legible(view)
            capture('06-t140-hoist.png', 'T140 : hissage progressif du même hôte')
            check('Pause freezes a native hoist and no wall-clock callback commits another wound', r"""
              const before=f.snapshot();g.setSystemPaused(true);for(let i=0;i<60;i++)f.frame();const after=f.snapshot();
              need(JSON.stringify(before)===JSON.stringify(after),'Paused native hoist changed');return {before,after};
            """)
            page.wait_for_timeout(500)
            check('Native140 hold retains one victim and one wound under the real support', r"""
              f.until('HOLD');f.ticks(20);const hold=f.snapshot();
              need(f.hits.length===1&&hold.victim.hp===160&&hold.victim.owner&&hold.victim.isCocooned,'Native hold changed owner/health');
              need(hold.victim.bounds.min[1]>=-.035&&hold.victim.bounds.max[1]<=hold.ceiling+.04,'Native hold clipped deck/support');return {hold,samples:f.samples};
            """)
            view = capture('07-t140-hold-gameplay.png', 'T140 · maintien', gameplay=True)
            if view:
                assert_capture_legible(view)
            capture('07-t140-hold.png', 'T140 : prise maintenue, réaction humaine et propriété unique')
            page.evaluate('()=>{__creatureNative.beforeRelease=__creatureNative.snapshot()}')
            press('q')
            check('Chromium Q releases a native victim with gravity before descending the creature', r"""
              const before=f.beforeRelease;need(p.ceilingAction?.phase==='RELEASE','Installed Q did not release held actor');
              need(f.victim.mesh.position.y===before.victim.position[1],'Q teleported victim to deck');f.ticks(10);
              need(f.victim.mesh.position.y<before.victim.position[1]&&f.hits.length===1,'Release is not falling/created extra wound');return {before,after:f.snapshot()};
            """)
            capture('08-t140-release-gameplay.png', 'T140 · libération', gameplay=True)
            capture('08-t140-release.png', 'Libération gravitaire avant retour au sol')
            check('Released victim ownership clears and both native actors land without a second140 wound', r"""
              f.until('GROUND');f.ticks(10);const landed=f.snapshot();
              need(!p.ceilingAction&&!p.ceilingTransition&&!p.isCeilingProwling,'Creature retained old capture/locomotion');
              need(!f.victim.ceilingActionOwner&&!f.victim.isRestrained&&!f.victim.isCocooned,'Released living actor retained capture flags');
              need(f.hits.length===1&&landed.victim.bounds.min[1]>=-.035,'Landing caused duplicate damage or actor sank');return landed;
            """)
            landed_view = capture('09-t140-landed-gameplay.png', 'T140 · retour au pont', gameplay=True)
            if landed_view:
                assert all(beam['opacity'] == 1 and beam['depthWrite'] for beam in landed_view['beams']), landed_view['beams']
            capture('09-t140-landed.png', 'Retour au pont : acteurs libérés et contacts conservés')
            check('A lethal140 hauls a corpse without certifying a new viable implantation host', r"""
              f.climb();f.until('HANG');const fixture=f.makeVictim(100);f.key('t');f.until('HOLD');const corpse=f.snapshot();
              need(f.hits.length===1&&f.hits[0].amount===140&&corpse.victim.hp===0,'Native lethal140 did not remain one wound');
              need(corpse.victim.isIncapacitated&&!corpse.victim.isCocooned&&corpse.victim.hostEligibility==='none'&&corpse.victim.isConsumedByCycle,'Corpse became viable royal/implantation resource');
              f.key('q');f.until('GROUND');need(!f.victim.ceilingActionOwner&&!f.victim.isRestrained,'Corpse ownership retained after release');return {fixture,corpse,landed:f.snapshot()};
            """)
            check('Space drop delivers native120 only at actual landing, exactly once', r"""
              f.climb();f.until('HANG');f.makeVictim(300);const target=f.victim;
              target.x=p.x;target.z=p.z;target.mesh.position.set(target.x,0,target.z);HiveModelFactory.placeOnGround(target.mesh,.015);
              const before=f.snapshot();f.key(' ');need(p.ceilingTransition?.phase==='DESCEND'&&f.hits.length===0,'Space caused instant/non-descent attack');
              need(p.mesh.position.y===before.position[1],'Space teleported to floor');f.ticks(5);need(f.hits.length===0,'Drop wounded target before landing');
              f.until('GROUND');need(f.hits.length===1&&f.hits[0].amount===120,'Native landing did not commit one120 hit');
              f.ticks(20);need(f.hits.length===1,'Native drop hit twice');return {before,landed:f.snapshot()};
            """)
            check('Removing the actual target during windup invalidates a future140 wound', r"""
              f.climb();f.until('HANG');f.makeVictim(300);f.key('t');f.ticks(6);const victim=f.victim;
              g.humans=g.humans.filter(h=>h!==victim);f.ticks(30);need(!p.ceilingAction&&f.hits.length===0&&!victim.ceilingActionOwner,'Removed actor retained stale capture');
              victim.destroy();f.victim=null;return f.snapshot();
            """)
            check('Actor reset cancels a pending descent and its uncommitted impact', r"""
              f.climb();f.until('HANG');f.makeVictim(300);const victim=f.victim;
              victim.x=p.x;victim.z=p.z;victim.mesh.position.set(victim.x,0,victim.z);HiveModelFactory.placeOnGround(victim.mesh,.015);
              f.key(' ');f.ticks(3);need(f.hits.length===0,'Prepared reset occurred after landing');
              p.setForm('drone');f.ticks(120);need(!p.ceilingTransition&&!p.ceilingAction&&f.hits.length===0,'Reset preserved old impact');return f.snapshot();
            """)
            check('A prepared real floor barrier forces Q to anchor the same captive in visible resin', r"""
              const ascent=f.climb({x:-60,z:15});f.until('HANG');const victimFixture=f.makeVictim(300);f.key('t');f.until('HOLD');
              need(f.hits.length===1&&f.hits[0].amount===140,'Prepared anchor scenario requires one committed140');
              const action=p.ceilingAction,victim=f.victim,captivePosition=victim.mesh.position.clone(),center=action.startPosition.clone();
              const barrier=f.addFloorBlocker(center.x,center.z,13,13,1);
              need(map.checkCollision(p.x,p.z,p.creatureEnvelope.radius),'Prepared barrier did not obstruct the creature floor point');
              need(map.isCreaturePoseClear(p.getCeilingVictimBounds(victim)),'Prepared low barrier also obstructed the actual held captive');
              const landingPreflight=p.findCeilingLanding(p.ceilingSupport,false),playerPosition=p.mesh.position.clone();
              need(!landingPreflight||landingPreflight.distance>.05,'Barrier preflight unexpectedly accepted the obstructed current floor point');
              f.key('q');const record=victim.ceilingAnchor;
              need(record?.isCurrent()&&!p.ceilingAction,'Blocked floor did not hand the same native actor to a current anchor');
              const refusal=document.getElementById('toast-message')?.textContent||'';
              if(landingPreflight)need(p.ceilingTransition?.phase==='DESCEND_POSITION','Q did not use the preflight-certified physical along-beam route');
              else need(p.isCeilingProwling&&!p.ceilingTransition&&/Aucun atterrissage libre/.test(refusal),'No safe exit must give a clear actual refusal and retain hanging');
              need(p.mesh.position.distanceTo(playerPosition)<1e-7,'Q teleported the creature while handling a blocked floor');
              need(victim.mesh.position.distanceTo(captivePosition)<1e-7,'Q moved/teleported the held actor during anchor handoff');
              need(g.humans.length===1&&g.humans[0]===victim&&!victim.ceilingActionOwner,'Anchor duplicated or retained old ownership of the actor');
              need(record.group.parent&&record.group.visible&&record.group.name==='t140_supported_resin_anchor','Native resin group missing/invisible');
              need(g.biologicalRemains.has(record.group)&&p.ceilingAnchors.has(record),'Native marker not owned by both actual cleanup registries');
              let resinMeshes=0;record.group.traverse(child=>{if(child.isMesh){resinMeshes++;need(child.geometry&&child.material&&child.visible,'Resin strand has no rendered geometry/material');}});
              need(resinMeshes>=8,'Native support anchor has incomplete strands/bands');
              f.anchorFixture={record,victim,captivePosition,mesh:victim.mesh,landingPreflight,playerPosition,refusal};
              return {ascent,victimFixture,barrier,
                landingPreflight,branch:landingPreflight?'PREFLIGHT_CERTIFIED_DETOUR':'REFUS_CLAIR',refusal,
                resin:{name:record.group.name,meshes:resinMeshes,bounds:(()=>{const box=new T.Box3().setFromObject(record.group);return {min:box.min.toArray(),max:box.max.toArray()};})()},
                state:f.snapshot(),scope:'Prepared13x1x13 real visible mesh+solid collider after native HOLD; current authored support/props untouched, installed Q and actual anchor methods'};
            """)
            capture('10-t140-resin-anchor.png', 'Sol préparé obstrué : même hôte ancré, issue vérifiée ou refus clair')
            anchor_route = check('The anchored actor persists through either a certified detour or a clear no-exit refusal', r"""
              const {record,victim,captivePosition,landingPreflight,playerPosition,refusal}=f.anchorFixture,start=f.samples.length;
              if(!landingPreflight){const before=f.snapshot();f.ticks(120);const after=f.snapshot();
                need(p.isCeilingProwling&&!p.ceilingAction&&!p.ceilingTransition&&!p.isLocomotionBusy(),'Refused descent invented movement or retained capture ownership');
                need(p.mesh.position.distanceTo(playerPosition)<.035,'No-exit refusal drifted/teleported the creature');
                need(record.isCurrent()&&record.group.parent&&g.biologicalRemains.has(record.group)&&p.ceilingAnchors.has(record),'Refused descent lost its valid persistent anchor');
                need(victim.mesh.position.distanceTo(captivePosition)<1e-7&&g.humans.length===1&&g.humans[0]===victim,'Refused descent moved or duplicated the captive');
                need(f.hits.length===1&&f.hits[0].amount===140,'No-exit refusal created an extra wound');
                return {branch:'REFUS_CLAIR',positiveRepositionCertified:false,landingPreflight,refusal,before,after,samples:f.samples.slice(start),
                  limitation:'This native13x1x13 blocked-floor fixture certifies safe refusal/anchor persistence only. Positive DESCEND_POSITION remains Node-prepared evidence, not native certified.'};}
              const reposition=f.snapshot();need(reposition.locomotionPhase==='DESCEND_POSITION','Prepared anchor descent did not retain its phase');
              f.until('DESCEND');const descent=f.snapshot();f.until('GROUND');f.ticks(10);const landed=f.snapshot(),samples=f.samples.slice(start);
              need(samples.some(row=>row.locomotionPhase==='DESCEND_POSITION')&&samples.some(row=>row.locomotionPhase==='DESCEND'),'Native beam reposition/descent phases were skipped');
              need(!p.ceilingAction&&!p.ceilingTransition&&!p.isCeilingProwling&&!p.isLocomotionBusy(),'Anchored release left a creature locomotion softlock');
              need(!map.checkCollision(p.x,p.z,p.creatureEnvelope.radius),'Creature landed inside the prepared barrier or real station solid');
              need(record.isCurrent()&&record.group.parent&&g.biologicalRemains.has(record.group)&&p.ceilingAnchors.has(record),'Persistent resin anchor vanished during creature descent');
              need(victim.mesh.position.distanceTo(captivePosition)<1e-7&&g.humans.length===1&&g.humans[0]===victim,'Anchored actor moved or was duplicated while creature descended');
              need(f.hits.length===1&&f.hits[0].amount===140,'Anchoring/descent created an extra wound');
              return {branch:'PREFLIGHT_CERTIFIED_DETOUR',positiveRepositionCertified:true,reposition,descent,landed,samples,anchorCurrent:record.isCurrent(),sameActor:true};
            """)
            report['positiveResinRepositionCertified'] = anchor_route['positiveRepositionCertified']
            if not anchor_route['positiveRepositionCertified']:
                report['limitations'].append(anchor_route['limitation'])
            save()
            check('Actual campaign restart disposes the anchored resin actor and both cleanup registries', r"""
              const {record,victim,mesh}=f.anchorFixture;f.removeBarrierFixture();
              need(record.isCurrent()&&record.group.parent,'Prepared barrier removal incorrectly disposed the anchor');
              g.startCampaign(4);g.setSystemPaused(true);f.victim=null;
              need(record.disposed&&!record.isCurrent()&&!record.group.parent,'Actual campaign restart retained the visible resin marker');
              need(!g.biologicalRemains.has(record.group)&&!p.ceilingAnchors.has(record),'Actual restart retained an anchor registry entry');
              need(!g.humans.includes(victim)&&!victim.ceilingAnchor&&!victim.ceilingActionOwner&&!mesh.parent,'Actual restart retained the old native captive/ownership');
              need(record.dispose()===false,'Disposed marker cleanup is not idempotent');f.anchorFixture=null;
              return {campaignRestart:true,disposed:record.disposed,oldActorRemoved:true,barrierRestored:!f.barrierFixture,
                scope:'Actual GameMaster.startCampaign→resetWorldState→clearHumans cleanup; no page reload or direct registry erasure'};
            """)
            report['floorDetourFixture'] = page.evaluate(r"""()=>{
              const f=__creatureNative,p=f.p,map=f.map;
              const ascent=f.climb();f.until('HANG');
              const start=f.snapshot(),barrier=f.addFloorBlocker(p.x,p.z,.6,.6,.8);
              f.need(map.checkCollision(p.x,p.z,p.creatureEnvelope.radius),'The blocker did not obstruct the current floor');
              f.need(map.isCreaturePoseClear(f.bounds()),'The blocker also occupied the hanging pose');
              const landing=p.findCeilingLanding(p.ceilingSupport,false);
              f.need(landing?.distance>.05,'No along-beam landing near the authored support');
              f.floorDetour={start,landing,samplesStart:f.samples.length};
              return {ascent,barrier,start,landing};
            }""")
            press('q')
            check('Chromium Q starts a continuous detour under the actual beam', r"""
              const {start,landing}=f.floorDetour;
              need(p.ceilingTransition?.phase==='DESCEND_POSITION','Positive detour did not start through Q');
              need(p.mesh.position.distanceTo(new T.Vector3(...start.position))<1e-7,'Q teleported under the beam');
              f.ticks(4);const moving=f.snapshot();
              need(moving.locomotionPhase==='DESCEND_POSITION'&&p.mesh.position.distanceTo(new T.Vector3(...start.position))>.02,'No continuous movement under the beam');
              return {start,landing,moving};
            """)
            capture('11-q-descend-position.png', 'Q : trajet sous la poutre vers le passage libre')
            check('The alternate descent lands with clear rendered sub-mesh volumes', r"""
              const {landing,samplesStart}=f.floorDetour;
              f.until('DESCEND');const falling=f.snapshot();
              f.until('GROUND');const landed=f.snapshot(),samples=f.samples.slice(samplesStart);
              need(Math.hypot(p.x-landing.x,p.z-landing.z)<.15,'Landed away from the preflight-certified floor point');
              const bounds=f.bounds(),blocker=new T.Box3().setFromObject(f.barrierFixture.mesh),overlappingMeshes=[];
              let checkedMeshes=0;
              p.detailedModel.traverse(child=>{
                if(!child.isMesh||!child.geometry)return;
                for(let node=child;node&&node!==p.mesh;node=node.parent)if(!node.visible)return;
                child.geometry.computeBoundingBox();
                const world=child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld);
                checkedMeshes++;
                if(!map.isCreaturePoseClear(world))overlappingMeshes.push(child.name||child.id);
              });
              // The aggregate Box3 combines high tail and low foot extents.
              // Each visible mesh remains subject to the actual station test.
              need(checkedMeshes>0&&!overlappingMeshes.length&&!map.checkCollision(p.x,p.z,p.creatureEnvelope.radius),
                'Alternate landing overlaps a solid: '+JSON.stringify({bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},
                  blocker:{min:blocker.min.toArray(),max:blocker.max.toArray()},overlappingMeshes}));
              need(!p.isLocomotionBusy()&&!p.isCeilingProwling&&!f.hits.length,'Detour left stale ownership or damage');
              return {positiveFloorRepositionCertified:true,landing,falling,landed,samples,checkedMeshes,
                aggregateBoundsIntersectBlocker:bounds.intersectsBox(blocker),overlappingMeshes,
                scope:'Actual authored support, current station solids, prepared small floor blocker and a Chromium Q command. No captive in this positive detour fixture.'};
            """)
            report['positiveFloorRepositionCertified'] = True
            capture('12-q-alternate-landing.png', 'Q : atterrissage à côté de la barrière, dans le passage libre')
            page.evaluate('()=>__creatureNative.removeBarrierFixture()')
            check('Shift+T remains an explicit tracker command outside the biological action', r"""
              const before=g.motionTracker.focusedMode;f.key('t',{shift:true});const after=g.motionTracker.focusedMode;
              need(after!==before,'Installed Shift+T did not switch actual tracker');return {before,after};
            """)
            report['sourceAfter'] = inventory()
            assert report['sourceBefore'] == report['sourceAfter'], 'Source/file list changed during native creature cohort'
            assert not report['pageErrors'], report['pageErrors']
            assert not report['consoleErrors'], report['consoleErrors']
            assert not report['httpFailures'], report['httpFailures']
            assert not report['failedRequests'], report['failedRequests']
            assert all(row['match'] for row in report['assets'].values()), report['assets']
            report['complete'] = True
            save()
        except Exception as error:
            report['failure'] = str(error)
            try:
                report['failureSnapshot'] = page.evaluate('()=>window.__creatureNative?.snapshot()')
            except Exception:
                pass
            save()
            raise
        finally:
            try:
                page.evaluate('()=>window.__creatureNative?.cleanup()')
            except Exception as cleanup_error:
                report['cleanupFailure'] = str(cleanup_error)
                # The original assertion/trace remains authoritative; cleanup
                # diagnostics must never replace the failure being reraised.
                if not report.get('failure'):
                    report['failure'] = 'Cleanup failed: ' + str(cleanup_error)
                    report['complete'] = False
                    raise
            finally:
                try:
                    browser.close()
                except Exception as close_error:
                    report['browserCloseFailure'] = str(close_error)
                    if not report.get('failure'):
                        report['failure'] = 'Browser cleanup failed: ' + str(close_error)
                        report['complete'] = False
                        raise
                finally:
                    save()


if __name__ == '__main__':
    main()
