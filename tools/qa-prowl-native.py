#!/usr/bin/env python3
"""Exercise the adult K command with Chromium and authored station colliders."""

import argparse
import hashlib
import json
from pathlib import Path
import shutil

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
SOURCES = ('index.html', 'src/game.js', 'src/game-systems.js', 'src/models.js')


def inventory():
    return {path: hashlib.sha256((ROOT / path).read_bytes()).hexdigest() for path in SOURCES}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--baseline', action='store_true')
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=False)
    report = dict(before=inventory(), served={}, pageErrors=[], consoleErrors=[], httpErrors=[], checks=[],
                  passed=False, baseline=args.baseline)

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=shutil.which('chromium'), headless=True, args=[
            '--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
        ])
        page = browser.new_page(viewport={'width': 1280, 'height': 840})
        page.on('pageerror', lambda error: report['pageErrors'].append(str(error)))
        page.on('console', lambda item: report['consoleErrors'].append(item.text) if item.type == 'error' else None)
        page.on('response', lambda response: report['httpErrors'].append(response.url) if response.status >= 400 else None)

        def observe_source(route):
            response = route.fetch()
            path = next(name for name in SOURCES if route.request.url.split('?')[0].endswith('/' + name))
            report['served'][path] = hashlib.sha256(response.body()).hexdigest()
            if path == 'src/game.js':
                source = response.text()
                boundary = source.rindex('})();')
                source = source[:boundary] + 'window.__prowlWorld = { playerCreature, stationMap, HumanAI, rendererEngine };\n' + source[boundary:]
                route.fulfill(response=response, body=source)
            else:
                route.fulfill(response=response)

        page.route('**/src/game.js*', observe_source)
        page.route('**/src/game-systems.js*', observe_source)
        page.route('**/src/models.js*', observe_source)

        def check(name, body):
            value = page.evaluate('() => { const f = window.__prowlQA; ' + body + '}')
            report['checks'].append({'name': name, 'value': value})
            print('PASS', name, flush=True)
            return value

        try:
            page.goto(args.url, wait_until='domcontentloaded', timeout=120_000)
            page.wait_for_function('() => Boolean(window.gameInstance?.currentStage && window.__prowlWorld)', timeout=120_000)
            page.evaluate('''() => {
              const g = window.gameInstance;
              const {playerCreature: p, stationMap: map, HumanAI, rendererEngine: renderer} = window.__prowlWorld;
              const need = (value, message) => { if (!value) throw Error(message); };
              const setPoint = (actor, x, z) => { actor.x = x; actor.z = z; actor.mesh.position.set(x, 0, z); };
              const bounds = () => {
                p.mesh.updateMatrixWorld(true);
                return new THREE.Box3().setFromObject(p.detailedModel);
              };
              const f = {g, p, map, renderer, need, setPoint, bounds,
                start(caste = 'drone') {
                  g.configureCampaign({adultCaste: caste, difficulty: 'survivor', origin: 'starship'});
                  g.startCampaign(4);
                  g.clearHumans();
                  g.setSystemPaused(true);
                  p.isProwling = p.isInVent = p.isSubfloorProwling = false;
                  p.isHiveMelded = p.isWallMimic = false;
                  p.mesh.rotation.set(0, 0, 0);
                  const clearance = Math.max(p.creatureEnvelope.radius + .15, 1.35);
                  for (let x = -54; x <= 54; x += 3) {
                    for (let z = -54; z <= 42; z += 3) {
                      if (map.seegsonTerminals?.some(t => Math.hypot(t.x - x, t.z - z) < 5)) continue;
                      if (!map.hasClearSegment(x, z, x, z + 6, clearance)) continue;
                      setPoint(p, x, z);
                      p.applyGroundContact();
                      if (p.canFitProwlLeap && !p.canFitProwlLeap({
                        start: {x, y:p.mesh.position.y, z}, dest: {x, z:z + 4.75}, yaw: 0,
                        arcHeight: caste === 'warrior' ? .85 : (caste === 'runner' ? 1.35 : 1.15)
                      })) continue;
                      f.origin = {x, z};
                      return f.origin;
                    }
                  }
                  throw Error(`No verified authored lane found for ${caste}`);
                },
                human(offset = 6) {
                  const human = new HumanAI(9101 + g.humans.length, 'scientist', p.x, p.z + offset, 'Fixture K');
                  human.createMesh();
                  human.hp = human.maxHp = 1000;
                  g.humans.push(human);
                  return human;
                },
                key(key = 'k') {
                  const canvas = document.getElementById('game-canvas');
                  canvas.focus();
                  const code = 'Key' + key.toUpperCase();
                  g.setSystemPaused(false);
                  try {
                    window.dispatchEvent(new KeyboardEvent('keydown', {key, code, bubbles: true}));
                    window.dispatchEvent(new KeyboardEvent('keyup', {key, code, bubbles: true}));
                  } finally { g.setSystemPaused(true); }
                },
                advance(seconds, inspect) {
                  g.setSystemPaused(false);
                  try {
                    for (let elapsed = 0; elapsed < seconds - 1e-9; elapsed += 1 / 60) {
                      p.update(Math.min(seconds - elapsed, 1 / 60));
                      inspect?.();
                    }
                  } finally { g.setSystemPaused(true); }
                }
              };
              window.__prowlQA = f;
            }''')
            if args.baseline:
                check('Prior K immediately moves and hits at dispatch', '''
                    const from = f.start(), human = f.human();
                    f.key();
                    const distance = Math.hypot(f.p.x - from.x, f.p.z - from.z);
                    f.need(distance >= 5.9 && human.hp === 915 && !f.p.isLeaping, 'Baseline teleport not reproduced');
                    return {from, landed: {x: f.p.x, z: f.p.z}, distance, hp: human.hp};
                ''')
            else:
                check('K starts an arc and delays damage until one landing', '''
                    const {g, p, map, need} = f, from = f.start(), human = f.human();
                    f.key();
                    need(p.isLeaping && g.isLocomotionBusy() && p.z === from.z && human.hp === 1000, 'K moved or hit at launch');
                    f.advance(.15);
                    need(p.isLeaping && p.z > from.z && p.z < human.z && human.hp === 1000, 'No intermediate flight pose');
                    const airborne = p.mesh.position.toArray();
                    for (let i = 0; i < 60; i++) p.update(1 / 60);
                    need(p.mesh.position.toArray().every((n, i) => n === airborne[i]) && human.hp === 1000, 'Pause advanced K');
                    let landed = false;
                    f.advance(.7, () => {
                      if (landed) return;
                      const bounds = f.bounds();
                      need(map.isCreaturePoseClear(bounds), `Animated envelope clipped: ${JSON.stringify({leaping:p.isLeaping,
                        pos:p.mesh.position.toArray(), bounds:[bounds.min.toArray(),bounds.max.toArray()]})}`);
                      landed = !p.isLeaping;
                    });
                    need(!p.isLeaping && !g.isLocomotionBusy() && human.hp === 915,
                      `K landing mismatch ${JSON.stringify({from, pos:p.mesh.position.toArray(), human:{hp:human.hp,x:human.x,z:human.z},
                        elapsed:p.leapElapsed,duration:p.leapDuration, toast:document.getElementById('toast-message')?.textContent})}`);
                    return {from, airborne, landed: p.mesh.position.toArray(), humanHp: human.hp};
                ''')
                check('The real collision sweep refuses a barrier and cancels one that appears mid-flight', '''
                    const {p, map, need} = f;
                    const from = f.start(), human = f.human();
                    const block = {minX: from.x - 1, maxX: from.x + 1, minZ: from.z + 4, maxZ: from.z + 4.1};
                    map.colliders.push(block);
                    try {
                      f.key();
                      need(!p.isLeaping && p.z === from.z && human.hp === 1000, 'Initial barrier was crossed');
                    } finally { map.colliders.splice(map.colliders.indexOf(block), 1); }
                    f.key();
                    need(p.isLeaping, 'Refused launch consumed cooldown');
                    f.advance(.1);
                    map.colliders.push(block);
                    try {
                      f.advance(1);
                      need(!p.isLeaping && p.z < block.minZ && human.hp === 1000 && map.isCreaturePoseClear(f.bounds()), 'Dynamic obstruction failed');
                      return {heldBefore: block.minZ, landed: p.mesh.position.toArray()};
                    } finally { map.colliders.splice(map.colliders.indexOf(block), 1); }
                ''')
                check('Target movement and campaign replacement cannot resolve a stale hit', '''
                    const {g, p, need} = f;
                    const from = f.start(), human = f.human();
                    f.key();
                    f.setPoint(human, from.x + 5, human.z);
                    f.advance(.8);
                    need(!p.isLeaping && human.hp === 1000 && Math.abs(p.x - from.x) < .001, 'A moving actor dragged aim or received stale damage');
                    f.start();
                    const stale = f.human();
                    f.key();
                    need(p.isLeaping, 'Second launch missing');
                    g.startCampaign(4);
                    f.advance(.8);
                    need(!p.isLeaping && !p.prowlLeap && stale.hp === 1000, 'Campaign replacement retained K');
                    return true;
                ''')
                check('Runner, Warrior and Prowler retain their intended damage', '''
                    const {p, need} = f, outcomes = {};
                    for (const [caste, damage] of [['runner', 110], ['warrior', 130], ['prowler', 100]]) {
                      f.start(caste);
                      const human = f.human();
                      f.key();
                      need(p.isLeaping && human.hp === 1000, `K launch missing for ${caste}`);
                      f.advance(.8);
                      need(!p.isLeaping && human.hp === 1000 - damage, `Damage changed for ${caste}: ${human.hp}`);
                      outcomes[caste] = damage;
                    }
                    return outcomes;
                ''')
                check('K remains a terminal hack within range', '''
                    const {p, map, need} = f;
                    f.start();
                    const terminal = map.seegsonTerminals.find(t => !t.isHacked);
                    need(terminal, 'Authored terminal unavailable');
                    f.setPoint(p, terminal.x, terminal.z + 2);
                    f.key();
                    need(!p.isLeaping && terminal.isHacked, 'K no longer prefers the reachable terminal');
                    return {x: terminal.x, z: terminal.z};
                ''')
                page.evaluate('''() => {
                    const f = window.__prowlQA;
                    const {g, p} = f;
                    const from = f.start(), human = f.human();
                    human.isRestrained = true;
                    document.getElementById('boot-screen').classList.add('hidden');
                    document.getElementById('game-canvas').focus();
                    window.addEventListener('keydown', event => {
                      const observe = {trusted: event.isTrusted, launch: p.mesh.position.toArray(), hpAtLaunch: human.hp,
                        leapingAtLaunch: p.isLeaping, from, flightFrames: 0, peakY: 0, completed: false};
                      window.__trustedProwl = observe;
                      const frame = () => {
                        if (p.isLeaping) {
                          observe.flightFrames++;
                          observe.peakY = Math.max(observe.peakY, p.mesh.position.y);
                          requestAnimationFrame(frame);
                        } else {
                          observe.landed = p.mesh.position.toArray();
                          observe.hpAfterLanding = human.hp;
                          observe.completed = true;
                          g.setSystemPaused(true);
                        }
                      };
                      requestAnimationFrame(frame);
                    }, {once: true});
                    g.setSystemPaused(false);
                }''')
                page.keyboard.press('k')
                page.wait_for_function('() => Boolean(window.__trustedProwl?.completed)', timeout=12_000)
                check('Trusted Chromium keyboard input completes the arc on the native game loop', '''
                    const data = window.__trustedProwl;
                    f.need(data.trusted && data.leapingAtLaunch && data.hpAtLaunch === 1000 && data.launch[2] === data.from.z &&
                      data.flightFrames >= 2 && data.peakY > .5 && data.hpAfterLanding === 915, JSON.stringify(data));
                    return data;
                ''')
            report['after'] = inventory()
            assert report['before'] == report['after'], 'Sources changed during test'
            assert all(report['served'].get(path) == report['before'][path] for path in SOURCES if path != 'index.html'), report['served']
            assert not any(report[key] for key in ('pageErrors', 'consoleErrors', 'httpErrors')), report
            report['passed'] = True
        except Exception as error:
            report['error'] = str(error)
            raise
        finally:
            (args.output / 'results.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
            browser.close()


if __name__ == '__main__':
    main()
