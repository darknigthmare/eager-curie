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

        def expose_internals(route):
            source = (repository / "src/game.js").read_text(encoding="utf-8")
            position = source.rfind("})();")
            assert position >= 0, "Cannot expose internal game objects: script wrapper changed"
            export = "window.__qa={stationMap,playerCreature,HiveUnit,HumanAI,pheromoneSystem,rendererEngine};\n"
            route.fulfill(body=source[:position] + export + source[position:], content_type="application/javascript")

        page.route("**/src/game.js*", expose_internals)
        page.goto(args.url.rstrip("/") + "/", wait_until="domcontentloaded")
        page.wait_for_function("window.gameInstance && window.HiveSystems.ui.game")
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
            renderer.camera.position.set(-20,20,-5);
            for(let i=0;i<60;i++) renderer.updateWallVisibility({x:-20,y:1.4,z:-35},1/60);
            check('foreground wall cutaway keeps creature visible',map.walls.some(w=>w.material.opacity<0.25));
            check('cutaway preserves physical cover',map.checkCollision(-20,-30));
            renderer.camera.position.set(-20,20,-65);
            for(let i=0;i<60;i++) renderer.updateWallVisibility({x:-20,y:1.4,z:-35},1/60);
            check('wall opacity restores when camera clears cover',map.walls.every(w=>w.material.opacity>0.99));
            renderer.camera.position.copy(cameraPosition); renderer.camera.quaternion.copy(cameraRotation);
            check('station bounds',map.checkCollision(100,0)&&map.checkCollision(NaN,0)&&!map.checkCollision(0,0));
            const bounded=map.findPath(0,0,500,500);
            check('clamped click destination',bounded.length>0&&bounded.every(p=>Math.abs(p.x)<=70&&Math.abs(p.z)<=70),bounded.at(-1));
            const unit=new q.HiveUnit(999,'drone',-30,-36); unit.createMesh();
            const target={x:-30,z:-24};
            for(let i=0;i<450;i++) unit.moveTowards(target.x,target.z,1/60);
            const distance=Math.hypot(unit.x-target.x,unit.z-target.z);
            check('RTS routes around laboratory bulkhead',distance<1,{x:unit.x,z:unit.z,distance});
            unit.destroy();
            g.startCampaign(2); g.setSystemPaused(true);
            q.playerCreature.x=-30; q.playerCreature.z=-33;
            g.clearHumans();
            let host=new q.HumanAI(901,'scientist',-30,-27); host.createMesh(); g.humans.push(host);
            g.currentStage.attemptLeap();
            check('facehugger cannot leap through wall',!g.currentStage.isBonding);
            g.startCampaign(4); g.setSystemPaused(true); g.clearHumans();
            q.playerCreature.x=-30; q.playerCreature.z=-32;
            host=new q.HumanAI(902,'guard',-30,-28); host.createMesh(); g.humans.push(host);
            const hp=host.hp; g.currentStage.executeInnerJaw(); g.currentStage.executeTailImpale();
            check('adult melee cannot damage through wall',host.hp===hp,{before:hp,after:host.hp});
            host.x=-30; host.z=-34; host.mesh.position.set(host.x,0,host.z);
            g.currentStage.executeInnerJaw();
            check('valid melee still works after rejected attack',host.hp<hp,{before:hp,after:host.hp});
            // Seed positions and elapsed biological time, then exercise the real
            // leap, implantation, burst, cocoon and royal-cycle methods.
            g.startCampaign(2); g.setSystemPaused(true);
            const parasite=g.currentStage, scientist=g.humans.find(h=>h.type==='scientist');
            q.playerCreature.x=scientist.x; q.playerCreature.z=scientist.z-2;
            q.playerCreature.mesh.position.set(q.playerCreature.x,0,q.playerCreature.z);
            parasite.attemptLeap();
            for(let i=0;i<50;i++) q.playerCreature.update(1/60);
            check('facehugger attaches to viable face',parasite.isAttacking&&q.playerCreature.attachedHost===scientist);
            for(let i=0;i<8&&g.currentStageIndex===2;i++) parasite.tightenGrip();
            check('implantation advances to gestation',g.currentStageIndex===3&&scientist.isInfected&&scientist.usedAsHost);
            const juvenile=g.currentStage;
            for(let i=0;i<500;i++) juvenile.update(1/60);
            check('gestation enables sternum rupture',juvenile.step==='READY_TO_BURST');
            juvenile.perforateSternum();
            for(let i=0;i<80;i++) juvenile.update(1/60);
            check('rupture releases juvenile and real prey',juvenile.step==='HUNT_FAUNA'&&juvenile.rodents.length>=3&&scientist.isConsumedByCycle);
            juvenile.biomassHunted=3; juvenile.updateHUD();
            document.getElementById('btn-start-chrysalis').click();
            for(let i=0;i<250;i++) juvenile.update(1/60);
            juvenile.emergeAdultForm();
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
            for(let i=0;i<1400&&g.currentStageIndex===4;i++) adult.update(1/60);
            check('defended royal maturation advances to RTS',g.currentStageIndex===5&&g.royalCycleRecord.completed&&g.currentStage.queen.attachedToOvipositor);
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
