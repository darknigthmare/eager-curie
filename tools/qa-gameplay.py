#!/usr/bin/env python3
"""Deterministic browser regressions for navigation, cover and purge rules.

Requires Python Playwright and Chromium. The game script is served unchanged
except for a test-only export of its existing internal objects; no application
logic is replaced. Stage setup and fixed simulation steps isolate each rule.
"""
import argparse
import json
import os
from pathlib import Path
import shutil

from playwright.sync_api import sync_playwright
from qa_boot_flow import open_campaign_menu


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default="http://127.0.0.1:8082")
    parser.add_argument("--royal-only", action="store_true", help="Run only the prepared adult/royal scenario")
    args = parser.parse_args()
    royal_only = args.royal_only or os.environ.get("HIVE_QA_ROYAL_ONLY") == "1"
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
        open_campaign_menu(page)
        page.click("#btn-new-campaign")
        page.click("#btn-start-act-one")
        results = page.evaluate("""(royalOnly) => {
            const g=gameInstance, q=__qa;
            g.setSystemPaused(true);
            const map=q.stationMap, tests=[];
            const check=(name,pass,detail)=>{
                tests.push({name,pass,detail});
                if(!pass) throw Error(name+': '+JSON.stringify(detail));
            };
            const confirmEvolution=(owner)=>{
                if(g.pendingEvolution!==owner) return;
                document.getElementById('modal-btn-continue').click();
            };
            let parasite=null;
            const fixedTicks=(frames,done=()=>false)=>{
                const paused=g.isSystemPaused;g.isSystemPaused=false;
                let elapsedFrames=0;
                try{for(let i=0;i<frames&&!done();i++){
                    q.playerCreature.update(1/60);
                    if(q.playerCreature.attachedHost||parasite?.postImplantPhase||g.currentStageIndex!==2)for(const human of [...g.humans])human.update(1/60);
                    g.currentStage.update(1/60);window.HiveSystems.update(1/60);window.HiveAssetLibrary?.update(1/60);
                    elapsedFrames++;
                }}finally{g.isSystemPaused=paused;}
                return elapsedFrames;
            };
            if (!royalOnly) {
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
            parasite=g.currentStage;
            const scientist=new q.HumanAI(963,'scientist',hostPoint.x,hostPoint.z);
            scientist.createMesh();g.humans.push(scientist);
            q.playerCreature.x=scientist.x; q.playerCreature.z=scientist.z-2;
            q.playerCreature.mesh.position.set(q.playerCreature.x,0,q.playerCreature.z);
            parasite.attemptLeap();
            fixedTicks(50,()=>parasite.isAttacking);
            check('facehugger attaches to viable face',parasite.isAttacking&&q.playerCreature.attachedHost===scientist);
            for(let i=0;i<8&&g.currentStageIndex===2;i++) parasite.tightenGrip();
            check('grip clicks do not skip minimum attachment residence',g.currentStageIndex===2&&!parasite.isCompleted);
            fixedTicks(7000,()=>g.pendingEvolution===parasite);
            confirmEvolution(parasite);
            check('recovery relocates the same host before gestation',
                g.currentStageIndex===3&&scientist.isInfected&&scientist.usedAsHost&&g.currentStage.infectedHost===scientist&&g.hostRecoveryRecord?.completed,
                {stage:g.currentStageIndex,running:g.isRunning,phase:parasite.postImplantPhase,elapsed:parasite.phaseElapsed,
                    destination:parasite.recoveryDestination,remainingRoute:parasite.recoveryRoute,attempts:parasite.recoverySearchAttempts,
                    failedDestinations:[...parasite.failedRecoveryDestinations||[]],aborted:parasite.recoveryAborted,
                    host:{x:scientist.x,z:scientist.z,hp:scientist.hp,infected:scientist.isInfected,usedAsHost:scientist.usedAsHost},
                    hostPoint,modal:document.getElementById('stage-modal')?.innerText});
            const juvenile=g.currentStage;
            fixedTicks(500,()=>juvenile.step==='READY_TO_BURST');
            check('gestation enables sternum rupture',juvenile.step==='READY_TO_BURST');
            fixedTicks(1800,()=>Boolean(juvenile.planBurstExtraction()));
            juvenile.perforateSternum();
            fixedTicks(160,()=>juvenile.step==='HUNT_FAUNA');
            check('rupture releases juvenile and real prey',juvenile.step==='HUNT_FAUNA'&&juvenile.rodents.length>=3&&scientist.isConsumedByCycle);
            juvenile.biomassHunted=3; juvenile.updateHUD();
            const adultRadius=q.playerCreature.getAdultClearance().radius;
            const hasAdultExit=(x,z)=>[0,Math.PI/2,Math.PI,Math.PI*1.5].some(angle=>
                Array.from({length:13},(_,i)=>i/12*2.4).every(distance=>
                    !map.checkCollision(x+Math.sin(angle)*distance,z+Math.cos(angle)*distance,adultRadius)));
            let moltSite=null;
            const sites=[...(map.recoveryRoomAnchors||[])];
            for(const distance of [0,4,8,12,20,28,40])for(let i=0;i<16;i++)sites.push({
                x:q.playerCreature.x+Math.cos(i*Math.PI/8)*distance,z:q.playerCreature.z+Math.sin(i*Math.PI/8)*distance
            });
            for(const {x,z} of sites){
                if(Math.abs(x)>70||Math.abs(z)>70||!hasAdultExit(x,z))continue;
                const route=map.findPath(q.playerCreature.x,q.playerCreature.z,x,z,{padding:q.playerCreature.creatureEnvelope.radius});
                if(Math.hypot(q.playerCreature.x-x,q.playerCreature.z-z)<=.03||route.length&&Math.hypot(route.at(-1).x-x,route.at(-1).z-z)<=.03){
                    moltSite={x,z};break;
                }
            }
            check('molt site fits the actual future adult',!!moltSite);
            q.playerCreature.setMoveTarget(moltSite.x,moltSite.z);
            fixedTicks(1200,()=>!q.playerCreature.moveTarget&&Math.hypot(q.playerCreature.x-moltSite.x,q.playerCreature.z-moltSite.z)<=.05);
            const arrived={x:q.playerCreature.x,z:q.playerCreature.z};
            check('juvenile navigates to the free molt site with a 2.4-unit adult exit',
                !q.playerCreature.moveTarget&&Math.hypot(arrived.x-moltSite.x,arrived.z-moltSite.z)<=.05&&hasAdultExit(arrived.x,arrived.z),{moltSite,arrived});
            document.getElementById('btn-start-chrysalis').click();
            fixedTicks(250,()=>juvenile.chrysalisTimer>=100);
            juvenile.emergeAdultForm();
            check('mature cocoon begins a progressive extraction',g.currentStageIndex===3&&juvenile.step==='EMERGING');
            fixedTicks(180,()=>g.pendingEvolution===juvenile);
            confirmEvolution(juvenile);
            check('mature cocoon advances to adult hunt',g.currentStageIndex===4&&q.playerCreature.form==='drone');
            } else {
                g.startCampaign(4);g.setSystemPaused(true);
            }
            const adult=g.currentStage;
            check('royal nursery rejects missing hosts and live threats',!adult.canFoundHive());
            const deployment=(actors,objective=null)=>actors.map(h=>{
                const goal=h.navigationGoal;
                const rally=objective&&goal&&Math.hypot(goal.x-objective.x,goal.z-objective.z)>.05;
                const objectiveExposed=objective&&map.hasClearSegment(objective.x,objective.z,objective.x,objective.z,.12);
                let previous=h;
                const routeReady=h.pathWaypoints.every(point=>{
                    const clear=!map.checkCollision(point.x,point.z,.72)&&map.hasLineOfSight(previous.x,previous.z,point.x,point.z,.72);
                    previous=point;
                    return clear;
                });
                return {id:h.id,x:h.x,z:h.z,blocked:map.checkCollision(h.x,h.z,.72),navigationBlocked:h.navigationBlocked,
                    navigationGoal:goal?{...goal}:null,routeReady,rallyReady:!rally||!map.checkCollision(goal.x,goal.z,.72)&&
                        Math.hypot(goal.x-objective.x,goal.z-objective.z)<=6&&
                        (!objectiveExposed||map.hasClearSegment(goal.x,goal.z,objective.x,objective.z,.12))};
            });
            const initialOccupants=deployment(g.humans);
            for(const enemy of g.humans) enemy.incapacitate();
            const hosts=g.humans.filter(h=>h.hostEligibility==='viable').slice(0,2);
            for(const candidate of hosts){
                candidate.x=q.playerCreature.x; candidate.z=q.playerCreature.z+1;
                candidate.mesh.position.set(candidate.x,0,candidate.z);
                adult.abilityReadyAt.cocoon=0; adult.executeCocoonHost();
            }
            check('two real cocoons permit royal nursery',adult.capturedHosts===2&&adult.canFoundHive());
            const royalProbe=(type,flags={})=>{
                const actor=new q.HumanAI(903,type,q.playerCreature.x,q.playerCreature.z+1);
                actor.createMesh(); Object.assign(actor,flags);g.humans.push(actor);
                try { return {type,active:adult.getActiveThreats().includes(actor),canFound:adult.canFoundHive()}; }
                finally { g.humans.splice(g.humans.indexOf(actor),1); actor.destroy(); }
            };
            const royalProbes={
                hazmat:royalProbe('uscm_hazmat_tech'),
                civilian:royalProbe('scientist'),
                serviceAnimal:royalProbe('labhound'),
                infected:royalProbe('marine',{isInfected:true}),
                docile:royalProbe('guard',{isDocileCatatonic:true,catatonicTimer:0}),
                recoverable:royalProbe('guard',{isDocileCatatonic:true,catatonicTimer:6}),
                armedSynthetic:royalProbe('synthetic',{isDocileCatatonic:true,catatonicTimer:0})
            };
            adult.foundRoyalNursery();
            check('royal cycle consumes one host and requires defense',adult.royalHost.usedAsHost&&adult.royalHost.isConsumedByCycle&&adult.royalCycle.isActive&&!adult.royalCycle.canComplete());
            const royalDefenseTeam=deployment(adult.getActiveThreats(),adult.royalCycle);
            for(const enemy of g.humans) enemy.incapacitate();
            const royal=adult.royalCycle;
            const royalSnapshot=()=>({stage:g.currentStageIndex,running:g.isRunning,paused:g.isSystemPaused,duration:royal.duration,
                objective:{x:royal.x,z:royal.z,blocked:map.checkCollision(royal.x,royal.z,.72)},
                player:{x:q.playerCreature.x,z:q.playerCreature.z,blocked:map.checkCollision(q.playerCreature.x,q.playerCreature.z,.72)},
                progress:royal.progress,state:royal.state,active:royal.isActive,complete:royal.isComplete,destroyed:royal.isDestroyed,
                integrity:royal.integrity,canComplete:royal.canComplete(),waveTimer:adult.waveTimer,spawnedWaves:{...adult.spawnedWaves},
                resin:q.resinGrid.getResin(royal.x,royal.z),threats:adult.getActiveThreats().map(h=>({id:h.id,type:h.type,hp:h.hp,x:h.x,z:h.z,state:h.aiState}))});
            const beforeRoyal=royalSnapshot(),remainingFraction=(100-royal.progress)/100;
            const minimumSeconds=royal.duration*remainingFraction/1.25;
            const frameBudget=Math.ceil((royal.duration*remainingFraction+2)*60);
            console.info('HIVE_QA_ROYAL '+JSON.stringify({when:'before',minimumSeconds,frameBudget,snapshot:beforeRoyal}));
            const preparedDefense=[],observedRoyalActors=new Set(g.humans);
            const royalFrames=fixedTicks(frameBudget,()=>{
                if(g.pendingEvolution===adult||!g.isRunning||royal.isDestroyed||(!royal.isActive&&!royal.isComplete))return true;
                // Explicit continuous defense fixture, NOT a combat playthrough:
                // reinforcement logic runs unchanged; neutralize enemies only
                // AFTER their actual appearance, using their real actor method.
                const incoming=g.humans.filter(enemy=>!observedRoyalActors.has(enemy));
                if(incoming.length){
                    const guardBefore=royal.canComplete(),active=new Set(adult.getActiveThreats());
                    const deployments=deployment(incoming,q.playerCreature);
                    // Leave a previously unlisted role alive after the others.
                    const last=incoming.find(enemy=>enemy.type==='weyland_security_taser')||incoming.at(-1);
                    for(const enemy of incoming){observedRoyalActors.add(enemy);if(enemy!==last)enemy.incapacitate();}
                    const singleThreatBlocks=!royal.canComplete()&&adult.getActiveThreats().length===1&&adult.getActiveThreats()[0]===last;
                    last.incapacitate();
                    const members=incoming.map(h=>({id:h.id,type:h.type,active:active.has(h),incapacitated:h.isIncapacitated}));
                    preparedDefense.push({members,deployments,progress:royal.progress,guardBefore,guardAfter:royal.canComplete(),singleThreatBlocks,lastType:last.type,waves:{...adult.spawnedWaves}});
                }
                return false;
            });
            confirmEvolution(adult);
            const afterRoyal=royalSnapshot(),royalDiagnostic={fixture:'Production reinforcement rules with prepared defense: actors are incapacitated only after they appear',before:beforeRoyal,after:afterRoyal,preparedDefense,initialOccupants,royalDefenseTeam,frames:royalFrames,seconds:royalFrames/60,frameBudget,minimumSeconds};
            window.__qaRoyalDiagnostic=royalDiagnostic;console.info('HIVE_QA_ROYAL '+JSON.stringify({when:'after',...royalDiagnostic}));
            check('nursery guard follows hostile roles and excludes civilian or permanently neutralized actors',
                ['hazmat','recoverable','armedSynthetic'].every(key=>royalProbes[key].active&&!royalProbes[key].canFound)&&
                ['civilian','serviceAnimal','infected','docile'].every(key=>!royalProbes[key].active&&royalProbes[key].canFound),royalProbes);
            check('real reinforcement waves close the royal gate until their prepared neutralization',preparedDefense.length>0&&preparedDefense.every(w=>w.guardBefore===false&&w.guardAfter===true&&w.members.every(h=>h.incapacitated))&&Object.values(adult.spawnedWaves).every(Boolean),royalDiagnostic);
            check('every actual reinforcement counts and the last Taser guard alone blocks maturation',
                preparedDefense.flatMap(w=>w.members).length===13&&preparedDefense.every(w=>w.singleThreatBlocks&&w.members.every(h=>h.active))&&
                preparedDefense.some(w=>w.lastType==='weyland_security_taser'),royalDiagnostic);
            check('initial occupants and royal reinforcements deploy on walkable floor',
                initialOccupants.length===4&&royalDefenseTeam.length===2&&[...initialOccupants,...royalDefenseTeam,
                    ...preparedDefense.flatMap(w=>w.deployments)].every(actor=>!actor.blocked),royalDiagnostic);
            check('royal reinforcements have an approach in the prepared station layout',
                [...royalDefenseTeam,...preparedDefense.flatMap(w=>w.deployments)].every(actor=>!actor.navigationBlocked&&actor.routeReady&&actor.rallyReady),royalDiagnostic);
            check('royal maturation never skips its duration at the fastest resin rate',!royal.isComplete||royalFrames/60>=minimumSeconds-1/60,royalDiagnostic);
            check('defended royal maturation advances to RTS',g.currentStageIndex===5&&g.royalCycleRecord?.completed&&g.currentStage.queen.attachedToOvipositor,royalDiagnostic);
            if (royalOnly) return tests;
            g.startCampaign(5); g.setSystemPaused(true);
            const stage=g.currentStage; stage.relayCount=3; stage.purgeRemaining=.1; stage.update(.2);
            check('third relay interrupts purge',stage.purgeRemaining===.1&&g.isRunning,{remaining:stage.purgeRemaining,running:g.isRunning});
            stage.relayCount=2; stage.purgeRemaining=.1; stage.update(.2);
            check('uninterrupted purge still defeats player',stage.purgeRemaining===0&&!g.isRunning);
            return tests;
        }""", royal_only)
        print(json.dumps({"checks": results, "uncaught_errors": errors}, ensure_ascii=False, indent=2))
        assert not errors, f"Uncaught browser errors: {errors}"
        print(f"PASS: {len(results)} gameplay regressions")
        browser.close()


if __name__ == "__main__":
    main()
