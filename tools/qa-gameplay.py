#!/usr/bin/env python3
"""Deterministic browser regressions for navigation, cover and purge rules.

Requires Python Playwright and Chromium. The game script is served unchanged
except for a test-only export of its existing internal objects; no application
logic is replaced. Stage setup and fixed simulation steps isolate each rule.
"""
import argparse
import json
from pathlib import Path
import shutil

from playwright.sync_api import sync_playwright


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default="http://127.0.0.1:8082")
    args = parser.parse_args()
    repository = Path(__file__).resolve().parents[1]
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            executable_path=shutil.which("chromium"),
            headless=True,
            args=["--no-sandbox", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
        )
        page = browser.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on("console", lambda message: print(message.text, flush=True) if message.text.startswith("HIVE_QA_ROYAL ") else None)

        def expose_internals(route):
            source = (repository / "src/game.js").read_text(encoding="utf-8")
            position = source.rfind("})();")
            assert position >= 0, "Cannot expose internal game objects: script wrapper changed"
            export = "window.__qa={stationMap,playerCreature,HiveUnit,HumanAI,pheromoneSystem,rendererEngine,resinGrid};\n"
            route.fulfill(body=source[:position] + export + source[position:], content_type="application/javascript")

        page.route("**/src/game.js*", expose_internals)
        page.goto(args.url.rstrip("/") + "/", wait_until="domcontentloaded")
        page.wait_for_function("() => !!(window.gameInstance && window.HiveSystems.ui.game)", timeout=120000)
        page.click("#btn-new-campaign")
        page.click("#btn-start-act-one")
        results = page.evaluate("""() => {
            const g=gameInstance, q=__qa;
            g.setSystemPaused(true);
            const map=q.stationMap, tests=[];
            const check=(name,pass,detail)=>{
                tests.push({name,pass,detail});
                if(!pass) throw Error(name+': '+JSON.stringify(detail));
            };
            const renderer=q.rendererEngine;
            renderer.scene.updateMatrixWorld(true);
            const cameraPosition=renderer.camera.position.clone();
            const cameraRotation=renderer.camera.quaternion.clone();
            // The feature branch expands the cryolab bulkhead westward. Probe
            // the authored wall itself instead of the obsolete pre-redesign
            // coordinates that sat just outside its edge.
            renderer.camera.position.set(-45,20,-5);
            for(let i=0;i<60;i++) renderer.updateWallVisibility({x:-45,y:1.4,z:-35},1/60);
            check('foreground wall cutaway keeps creature visible',map.walls.some(w=>w.material.opacity<0.25));
            check('cutaway preserves physical cover',map.checkCollision(-45,-25));
            renderer.camera.position.set(-45,20,-65);
            for(let i=0;i<60;i++) renderer.updateWallVisibility({x:-45,y:1.4,z:-35},1/60);
            check('wall opacity restores when camera clears cover',map.walls.every(w=>w.material.opacity>0.99));
            renderer.camera.position.copy(cameraPosition); renderer.camera.quaternion.copy(cameraRotation);
            check('station bounds',map.checkCollision(100,0)&&map.checkCollision(NaN,0)&&!map.checkCollision(0,0));
            const bounded=map.findPath(0,0,500,500);
            check('clamped click destination',bounded.length>0&&bounded.every(p=>Math.abs(p.x)<=70&&Math.abs(p.z)<=70),bounded.at(-1));
            const unit=new q.HiveUnit(999,'drone',-30,-36); unit.createMesh();
            const target={x:-30,z:-20};
            for(let i=0;i<450;i++) unit.moveTowards(target.x,target.z,1/60);
            const distance=Math.hypot(unit.x-target.x,unit.z-target.z);
            check('RTS routes around laboratory bulkhead',distance<1,{x:unit.x,z:unit.z,distance});
            unit.destroy();
            g.startCampaign(2); g.setSystemPaused(true);
            q.playerCreature.x=-30; q.playerCreature.z=-28;
            g.clearHumans();
            let host=new q.HumanAI(901,'scientist',-30,-22); host.createMesh(); g.humans.push(host);
            g.currentStage.attemptLeap();
            check('facehugger cannot leap through wall',!g.currentStage.isBonding);
            g.startCampaign(4); g.setSystemPaused(true); g.clearHumans();
            q.playerCreature.x=-30; q.playerCreature.z=-28;
            host=new q.HumanAI(902,'guard',-30,-22); host.createMesh(); g.humans.push(host);
            const hp=host.hp; g.currentStage.executeInnerJaw(); g.currentStage.executeTailImpale();
            check('adult melee cannot damage through wall',host.hp===hp,{before:hp,after:host.hp});
            host.x=-30; host.z=-27; host.mesh.position.set(host.x,0,host.z);
            g.currentStage.executeInnerJaw();
            check('valid melee still works after rejected attack',host.hp<hp,{before:hp,after:host.hp});
            // Prepared viable host/biomass and fixed relevant subsystem ticks;
            // this is not a full campaign played by a human or native RAF.
            g.campaignConfig.origin='starship';g.startCampaign(1);
            g.startCampaign(2); g.setSystemPaused(true);g.clearHumans();
            let hostPoint=null;
            for(const x of [-12,-4,4,12,28,-28])for(const z of [-8,8,20,-20,36,-36]){
                if(!hostPoint&&!map.checkCollision(x,z,.45)&&!map.checkCollision(x,z-2,.45)&&map.hasLineOfSight(x,z,x,z-2,.12))hostPoint={x,z};
            }
            check('prepared cycle has a real free host lane',!!hostPoint);
            const parasite=g.currentStage, scientist=new q.HumanAI(963,'scientist',hostPoint.x,hostPoint.z);
            scientist.createMesh();g.humans.push(scientist);
            const fixedTicks=(frames,done=()=>false)=>{
                const paused=g.isSystemPaused;g.isSystemPaused=false;
                let elapsedFrames=0;
                try{for(let i=0;i<frames&&!done();i++){
                    q.playerCreature.update(1/60);
                    if(q.playerCreature.attachedHost||parasite.postImplantPhase||g.currentStageIndex!==2)for(const human of [...g.humans])human.update(1/60);
                    g.currentStage.update(1/60);window.HiveSystems.update(1/60);window.HiveAssetLibrary?.update(1/60);
                    elapsedFrames++;
                }}finally{g.isSystemPaused=paused;}
                return elapsedFrames;
            };
            q.playerCreature.x=scientist.x; q.playerCreature.z=scientist.z-2;
            q.playerCreature.mesh.position.set(q.playerCreature.x,0,q.playerCreature.z);
            parasite.attemptLeap();
            fixedTicks(50,()=>parasite.isAttacking);
            check('facehugger attaches to viable face',parasite.isAttacking&&q.playerCreature.attachedHost===scientist);
            for(let i=0;i<8&&g.currentStageIndex===2;i++) parasite.tightenGrip();
            check('grip clicks do not skip minimum attachment residence',g.currentStageIndex===2&&!parasite.isCompleted);
            fixedTicks(7000,()=>g.currentStageIndex===3);
            check('recovery relocates the same host before gestation',g.currentStageIndex===3&&scientist.isInfected&&scientist.usedAsHost&&g.currentStage.infectedHost===scientist&&g.hostRecoveryRecord?.completed);
            const juvenile=g.currentStage;
            fixedTicks(500,()=>juvenile.step==='READY_TO_BURST');
            check('gestation enables sternum rupture',juvenile.step==='READY_TO_BURST');
            fixedTicks(1800,()=>Boolean(juvenile.planBurstExtraction()));
            juvenile.perforateSternum();
            fixedTicks(160,()=>juvenile.step==='HUNT_FAUNA');
            check('rupture releases juvenile and real prey',juvenile.step==='HUNT_FAUNA'&&juvenile.rodents.length>=3&&scientist.isConsumedByCycle);
            juvenile.biomassHunted=3; juvenile.updateHUD();
            const adultRadius=q.playerCreature.getAdultClearance().radius;
            let moltSite=null;
            for(const distance of [0,4,8,12])for(let i=0;i<16&&!moltSite;i++){
                const x=q.playerCreature.x+Math.cos(i*Math.PI/8)*distance,z=q.playerCreature.z+Math.sin(i*Math.PI/8)*distance;
                if(map.checkCollision(x,z,adultRadius))continue;
                const route=map.findPath(q.playerCreature.x,q.playerCreature.z,x,z,{padding:q.playerCreature.creatureEnvelope.radius});
                if(distance===0||route.length&&Math.hypot(route.at(-1).x-x,route.at(-1).z-z)<1.5)moltSite={x,z};
            }
            check('molt site fits the actual future adult',!!moltSite);
            q.playerCreature.setMoveTarget(moltSite.x,moltSite.z);
            fixedTicks(1200,()=>Math.hypot(q.playerCreature.x-moltSite.x,q.playerCreature.z-moltSite.z)<.3);
            check('juvenile navigates to the free molt site',!map.checkCollision(q.playerCreature.x,q.playerCreature.z,adultRadius));
            document.getElementById('btn-start-chrysalis').click();
            fixedTicks(250,()=>juvenile.chrysalisTimer>=100);
            juvenile.emergeAdultForm();
            check('mature cocoon begins a progressive extraction',g.currentStageIndex===3&&juvenile.step==='EMERGING');
            fixedTicks(180,()=>g.currentStageIndex===4);
            check('mature cocoon advances to adult hunt',g.currentStageIndex===4&&q.playerCreature.form==='drone');
            const adult=g.currentStage;
            check('royal nursery rejects missing hosts and live threats',!adult.canFoundHive());
            for(const enemy of g.humans) enemy.incapacitate();
            const hosts=g.humans.filter(h=>h.hostEligibility==='viable').slice(0,2);
            for(const candidate of hosts){
                candidate.x=q.playerCreature.x; candidate.z=q.playerCreature.z+1;
                candidate.mesh.position.set(candidate.x,0,candidate.z);
                adult.abilityReadyAt.cocoon=0; adult.executeCocoonHost();
            }
            check('two real cocoons permit royal nursery',adult.capturedHosts===2&&adult.canFoundHive());
            adult.foundRoyalNursery();
            check('royal cycle consumes one host and requires defense',adult.royalHost.usedAsHost&&adult.royalHost.isConsumedByCycle&&adult.royalCycle.isActive&&!adult.royalCycle.canComplete());
            for(const enemy of g.humans) enemy.incapacitate();
            const royal=adult.royalCycle;
            const royalSnapshot=()=>({stage:g.currentStageIndex,running:g.isRunning,paused:g.isSystemPaused,duration:royal.duration,
                progress:royal.progress,state:royal.state,active:royal.isActive,complete:royal.isComplete,destroyed:royal.isDestroyed,
                integrity:royal.integrity,canComplete:royal.canComplete(),waveTimer:adult.waveTimer,spawnedWaves:{...adult.spawnedWaves},
                resin:q.resinGrid.getResin(royal.x,royal.z),threats:adult.getActiveThreats().map(h=>({id:h.id,type:h.type,hp:h.hp,x:h.x,z:h.z,state:h.aiState}))});
            const beforeRoyal=royalSnapshot(),remainingFraction=(100-royal.progress)/100;
            const minimumSeconds=royal.duration*remainingFraction/1.25;
            const frameBudget=Math.ceil((royal.duration*remainingFraction+2)*60);
            console.info('HIVE_QA_ROYAL '+JSON.stringify({when:'before',minimumSeconds,frameBudget,snapshot:beforeRoyal}));
            const preparedDefense=[],observedRoyalActors=new Set(g.humans);
            const royalFrames=fixedTicks(frameBudget,()=>{
                if(g.currentStageIndex===5||!g.isRunning||royal.isDestroyed||(!royal.isActive&&!royal.isComplete))return true;
                // Explicit continuous defense fixture, NOT a combat playthrough:
                // reinforcement logic runs unchanged; neutralize enemies only
                // AFTER their actual appearance, using their real actor method.
                const incoming=g.humans.filter(enemy=>!observedRoyalActors.has(enemy));
                if(incoming.length){
                    const guardBefore=royal.canComplete();
                    for(const enemy of incoming){observedRoyalActors.add(enemy);enemy.incapacitate();}
                    const members=incoming.map(h=>({id:h.id,type:h.type,incapacitated:h.isIncapacitated}));
                    preparedDefense.push({members,progress:royal.progress,guardBefore,guardAfter:royal.canComplete(),waves:{...adult.spawnedWaves}});
                }
                return false;
            });
            const afterRoyal=royalSnapshot(),royalDiagnostic={fixture:'Actual reinforcement waves spawn unchanged; harness incapacitates each incoming actor after appearance, not a human combat victory',before:beforeRoyal,after:afterRoyal,preparedDefense,frames:royalFrames,seconds:royalFrames/60,frameBudget,minimumSeconds};
            window.__qaRoyalDiagnostic=royalDiagnostic;console.info('HIVE_QA_ROYAL '+JSON.stringify({when:'after',...royalDiagnostic}));
            check('real reinforcement waves close the royal gate until their prepared neutralization',preparedDefense.length>0&&preparedDefense.every(w=>w.guardBefore===false&&w.guardAfter===true&&w.members.every(h=>h.incapacitated))&&Object.values(adult.spawnedWaves).every(Boolean),royalDiagnostic);
            check('royal maturation never skips its duration at the fastest resin rate',!royal.isComplete||royalFrames/60>=minimumSeconds-1/60,royalDiagnostic);
            check('defended royal maturation advances to RTS',g.currentStageIndex===5&&g.royalCycleRecord?.completed&&g.currentStage.queen.attachedToOvipositor,royalDiagnostic);
            g.startCampaign(5); g.setSystemPaused(true);
            const stage=g.currentStage; stage.relayCount=3; stage.purgeRemaining=.1; stage.update(.2);
            check('third relay interrupts purge',stage.purgeRemaining===.1&&g.isRunning,{remaining:stage.purgeRemaining,running:g.isRunning});
            stage.relayCount=2; stage.purgeRemaining=.1; stage.update(.2);
            check('uninterrupted purge still defeats player',stage.purgeRemaining===0&&!g.isRunning);
            return tests;
        }""")
        print(json.dumps({"checks": results, "uncaught_errors": errors}, ensure_ascii=False, indent=2))
        assert not errors, f"Uncaught browser errors: {errors}"
        print(f"PASS: {len(results)} gameplay regressions")
        browser.close()


if __name__ == "__main__":
    main()
