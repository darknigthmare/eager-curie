#!/usr/bin/env python3
"""Chromium regression for the player projectile queue in prepared gameplay."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil

from playwright.sync_api import sync_playwright


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', required=True)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=False)
    root = Path(__file__).resolve().parents[1]
    files = [root / 'index.html', root / 'src/game.js', root / 'src/game-systems.js']

    def hashes():
        return {str(path.relative_to(root)): hashlib.sha256(path.read_bytes()).hexdigest() for path in files}

    report = {'sourceBefore': hashes(), 'checks': {}, 'pageErrors': [], 'httpErrors': [], 'passed': False}

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=shutil.which('chromium'), headless=True, args=[
            '--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
        ])
        page = browser.new_page()
        page.on('pageerror', lambda error: report['pageErrors'].append(str(error)))
        page.on('response', lambda response: report['httpErrors'].append(response.url) if response.status >= 400 else None)

        def expose_game(route):
            response = route.fetch()
            source = response.text()
            served = hashlib.sha256(source.encode()).hexdigest()
            report['servedGameSha256'] = served
            assert served == report['sourceBefore']['src/game.js']
            boundary = source.rindex('})();')
            export = 'window.__combatQA = {playerCreature, stationMap, HumanAI};\n'
            route.fulfill(response=response, body=source[:boundary] + export + source[boundary:])

        page.route('**/src/game.js*', expose_game)
        try:
            page.goto(args.url, wait_until='domcontentloaded', timeout=120_000)
            page.wait_for_function('() => Boolean(window.gameInstance && window.__combatQA)', timeout=120_000)
            report['checks'] = page.evaluate('''() => {
              const {playerCreature: player, stationMap: map, HumanAI} = window.__combatQA;
              const game = window.gameInstance;
              const vfx = window.HiveSystems.vfx;
              const assert = (condition, message) => { if (!condition) throw Error(message); };
              const checks = {};
              const reset = (adultCaste = 'drone') => {
                game.configureCampaign({adultCaste, difficulty: 'survivor', origin: 'starship'});
                game.startCampaign(4);
                game.clearHumans();
                let position;
                for (let x = -60; x <= 60 && !position; x += 3) {
                  for (let z = -60; z <= 42; z += 3) {
                    if (!map.checkCollision(x, z, 1) && !map.checkCollision(x, z + 6, 1) &&
                        map.hasClearSegment(x, z, x, z + 6, 1)) {
                      position = {x, z};
                      break;
                    }
                  }
                }
                assert(position, 'No free projectile lane in the authored station');
                player.x = position.x;
                player.z = position.z;
                player.mesh.position.set(player.x, 0, player.z);
                player.embryoMutation = null;
                const human = new HumanAI(9011, 'scientist', player.x, player.z + 6, 'Fixture acid');
                human.createMesh();
                game.humans.push(human);
                human.hp = human.maxHp = 1000;
                assert(map.hasClearSegment(player.x, player.z, human.x, human.z), 'Fixture path is obstructed');
                return human;
              };
              const launch = () => {
                document.getElementById('btn-acid-spit').click();
                assert(game.combatImpacts.length === 1, 'Acid command did not schedule a projectile');
              };
              const advance = (seconds) => {
                while (seconds > 1e-8) {
                  const step = Math.min(seconds, .05);
                  game.updateCombatImpacts(step);
                  vfx.update(step);
                  seconds -= step;
                }
              };
              for (const mode of ['normal', 'reduced', 'toggle']) {
                const human = reset();
                vfx.setReducedMotion(mode === 'reduced');
                launch();
                const delay = game.combatImpacts[0].remaining;
                const hp = human.hp;
                advance(delay / 2);
                if (mode === 'toggle') vfx.setReducedMotion(true);
                assert(human.hp === hp, `Early impact in ${mode}`);
                game.setSystemPaused(true);
                game.updateCombatImpacts(1);
                assert(human.hp === hp && game.combatImpacts.length === 1, 'Pause resolved a pending impact');
                game.setSystemPaused(false);
                advance(delay / 2);
                assert(human.hp < hp && game.combatImpacts.length === 0, `Missing impact in ${mode}`);
                const damage = hp - human.hp;
                advance(.05);
                assert(hp - human.hp === damage, 'Duplicate direct impact');
                checks[mode] = {delay, damage};
              }
              assert(checks.normal.damage === checks.reduced.damage && checks.normal.damage === checks.toggle.damage,
                'Motion preference changed direct damage');
              let human = reset();
              vfx.setReducedMotion(false);
              launch();
              human.z += 10;
              human.mesh.position.z = human.z;
              const hp = human.hp;
              advance(game.combatImpacts[0].remaining);
              assert(human.hp === hp, 'Projectile followed a target that moved away');
              checks.fixedPoint = true;
              human = reset();
              launch();
              game.loadStage(2);
              assert(!game.combatImpacts.length, 'Act replacement retained old shots');
              advance(.5);
              assert(human.hp === 1000, 'Old acid shot damaged after act replacement');
              checks.stageCleanup = true;
              human = reset('boiler');
              const boilerHp = human.hp;
              assert(player.executeBoilerThermalDetonation(), 'Boiler did not arm');
              assert(!player.executeBoilerThermalDetonation(), 'Boiler armed twice before detonation');
              advance(.30);
              game.setSystemPaused(true);
              game.updateCombatImpacts(1);
              assert(human.hp === boilerHp, 'Boiler detonated early or during pause');
              game.setSystemPaused(false);
              advance(.05);
              assert(human.hp < boilerHp && !game.combatImpacts.length, 'Boiler did not detonate after .35 s');
              checks.boiler = {damage: boilerHp - human.hp};
              human = reset('carrier');
              assert(player.executeCarrierFacehuggerSwarm(), 'Carrier did not launch');
              advance(1.15);
              assert(!human.isCocooned, 'Carrier resolved before 1.2 s');
              game.setSystemPaused(true);
              game.updateCombatImpacts(1);
              assert(!human.isCocooned, 'Carrier resolved during pause');
              game.setSystemPaused(false);
              advance(.05);
              assert(human.isCocooned && !game.combatImpacts.length, 'Carrier did not resolve after 1.2 s');
              checks.carrier = true;
              human = reset();
              const x = player.x, z = player.z + 3;
              assert(map.hasLineOfSight(x, z - 3, x, z + 3), 'Steam fixture starts obstructed');
              vfx.setReducedMotion(false);
              vfx.spawnSteamCloud(x, 1.5, z, 1);
              vfx.setReducedMotion(true);
              assert(!map.hasLineOfSight(x, z - 3, x, z + 3), 'Reduced motion removed live cover');
              advance(1);
              assert(map.hasLineOfSight(x, z - 3, x, z + 3), 'Cover never cleared');
              vfx.spawnSteamCloud(x, 1.5, z, 1);
              assert(!map.hasLineOfSight(x, z - 3, x, z + 3), 'Cover failed to spawn in reduced motion');
              checks.steamCover = true;
              game.setSystemPaused(true);
              return checks;
            }''')
            report['sourceAfter'] = hashes()
            assert report['sourceAfter'] == report['sourceBefore']
            assert not report['pageErrors'] and not report['httpErrors'], report
            report['passed'] = True
        except Exception as error:
            report['error'] = str(error)
            raise
        finally:
            (args.output / 'results.json').write_text(json.dumps(report, indent=2) + '\n')
            browser.close()

    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
