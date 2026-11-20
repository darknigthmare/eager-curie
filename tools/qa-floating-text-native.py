#!/usr/bin/env python3
"""Exercise production combat labels and acid hazards in Chromium."""

import argparse
import hashlib
import json
from pathlib import Path
import shutil

from playwright.sync_api import sync_playwright
from qa_boot_flow import open_campaign_menu


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', default='http://127.0.0.1:8098/')
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    args.output.mkdir(parents=True)
    sources = [Path(__file__).resolve().parents[1] / 'src' / name for name in ['game-systems.js', 'game.js']]
    digest = lambda value: hashlib.sha256(value).hexdigest()
    inventory = lambda: {source.name: digest(source.read_bytes()) for source in sources}
    report = dict(sourceBefore=inventory(), sourcesServed={}, checks=[], captures=[], errors=[], complete=False)

    def save():
        (args.output / 'results.json').write_text(json.dumps(report, indent=2) + '\n')

    def check(page, name, operation):
        result = page.evaluate(operation)
        report['checks'].append(dict(name=name, detail=result, passed=result['passed']))
        save()
        assert result['passed'], (name, result)
        print('PASS', name, flush=True)

    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=shutil.which('chromium'), headless=True,
            args=['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-angle=swiftshader'])
        page = browser.new_page(viewport={'width': 1440, 'height': 900}, reduced_motion='no-preference')
        page.on('pageerror', lambda error: report['errors'].append(str(error)))
        page.on('console', lambda message: report['errors'].append(message.text) if message.type == 'error' else None)
        page.on('requestfailed', lambda request: report['errors'].append(f'{request.url}: {request.failure}'))
        page.on('response', lambda response: report['errors'].append(f'{response.url}: {response.status}') if response.status >= 400 else None)
        try:
            with page.expect_response(lambda response: '/src/game.js' in response.url) as game_response, \
                    page.expect_response(lambda response: '/src/game-systems.js' in response.url) as vfx_response:
                page.goto(args.url, wait_until='domcontentloaded')
            report['sourcesServed'] = {'game.js': digest(game_response.value.body()), 'game-systems.js': digest(vfx_response.value.body())}
            assert report['sourceBefore'] == report['sourcesServed']
            page.wait_for_function('()=>!!(window.gameInstance && window.HiveSystems?.vfx?.scene)', timeout=120000)
            check(page, 'T140 and long accented labels fit their rasterized textures', '''() => {
              const vfx = HiveSystems.vfx;
              const labels = ['-140 DARD DE QUEUE', 'DÉFLAGRATION EN CHAÎNE CHARGEURS M41A (-180) !', '-12'];
              const results = labels.map((label, i) => {
                const actual = [];
                const nativeFill = CanvasRenderingContext2D.prototype.fillText;
                try {
                  CanvasRenderingContext2D.prototype.fillText = function(text, ...args) {
                    actual.push(text);
                    return nativeFill.call(this, text, ...args);
                  };
                  vfx.floatingText(0, 3, 0, label, '#ef4444', i < 2);
                } finally { CanvasRenderingContext2D.prototype.fillText = nativeFill; }
                const {width, height} = vfx.effects.at(-1).texture.image;
                const canvas = vfx.effects.at(-1).texture.image;
                const pixels = canvas.getContext('2d').getImageData(0, 0, width, height).data;
                let minX = width, minY = height, maxX = -1, maxY = -1;
                for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
                  if (pixels[(y * width + x) * 4 + 3] === 0) continue;
                  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
                  minY = Math.min(minY, y); maxY = Math.max(maxY, y);
                }
                const fits = minX >= 2 && minY >= 2 && maxX < width - 2 && maxY < height - 2 && maxX > minX;
                return {label, actual, width, height, minX, minY, maxX, maxY,
                  passed: fits && actual.join(' ') === label};
              });
              vfx.clear();
              return {passed: results.every(result => result.passed), results};
            }''')
            page.evaluate('''() => {
              const scene = HiveSystems.vfx.scene;
              const original = scene.onBeforeRender;
              scene.onBeforeRender = (renderer, world, camera, target) => {
                original.call(scene, renderer, world, camera, target);
                window.__labelRender = {renderer, world, camera};
              };
            }''')
            open_campaign_menu(page)
            page.locator('.origin-card[data-origin="starship"]').click(timeout=120000)
            page.locator('#btn-new-campaign').click(timeout=120000)
            page.locator('#btn-start-act-one').click(timeout=120000)
            page.wait_for_function('()=>!!window.__labelRender', timeout=120000)
            page.evaluate('() => gameInstance.setSystemPaused(true)')
            check(page, 'Standard gameplay camera renders the T140 label within the pixel budget', '''() => {
              const {renderer, world, camera} = window.__labelRender;
              const before = camera.position.toArray();
              const target = camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(35).add(camera.position);
              HiveSystems.vfx.floatingText(target.x, target.y, target.z, '-140 DARD DE QUEUE', '#ef4444', true);
              const sprite = HiveSystems.vfx.effects.at(-1).group;
              renderer.render(world, camera);
              const center = sprite.getWorldPosition(new THREE.Vector3()).applyMatrix4(camera.matrixWorldInverse);
              const width = sprite.scale.x * camera.projectionMatrix.elements[0] * innerWidth / (-2 * center.z);
              const height = sprite.scale.y * camera.projectionMatrix.elements[5] * innerHeight / (-2 * center.z);
              return {passed: camera.fov === 40 && width > 35 && width <= 220.01 && height <= 48.01 &&
                before.every((value, index) => value === camera.position.toArray()[index]), width, height, fov: camera.fov,
                position: before};
            }''')
            screenshot = args.output / 'normal-camera.png'
            page.screenshot(path=str(screenshot), timeout=120000)
            report['captures'].append(dict(file=screenshot.name, sha256=digest(screenshot.read_bytes())))
            check(page, 'Near-camera rendering keeps a finite, bounded sprite with its texture aspect', '''() => {
              const {renderer, world, camera} = window.__labelRender;
              const near = camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(2).add(camera.position);
              HiveSystems.vfx.floatingText(near.x, near.y, near.z, 'DÉFLAGRATION EN CHAÎNE CHARGEURS M41A (-180) !', '#ef4444', true);
              const effect = HiveSystems.vfx.effects.at(-1), sprite = effect.group;
              renderer.render(world, camera);
              const center = sprite.getWorldPosition(new THREE.Vector3()).applyMatrix4(camera.matrixWorldInverse);
              const width = sprite.scale.x * camera.projectionMatrix.elements[0] * innerWidth / (-2 * center.z);
              const height = sprite.scale.y * camera.projectionMatrix.elements[5] * innerHeight / (-2 * center.z);
              const aspect = effect.texture.image.width / effect.texture.image.height;
              return {passed: width <= 220.01 && height <= 48.01 && height > 10 && Math.abs(width / height - aspect) < 0.02, width, height, aspect};
            }''')
            check(page, 'Floating text expires or clears under reduced motion with one resource disposal', '''() => {
              const vfx = HiveSystems.vfx;
              vfx.clear();
              function observe() {
                vfx.floatingText(0, 3, 0, '-12', '#ef4444');
                const effect = vfx.effects.at(-1), count = {texture: 0, material: 0, geometry: 0};
                const geometry = effect.group.geometry;
                const onGeometryDispose = () => count.geometry++;
                effect.texture.addEventListener('dispose', () => count.texture++);
                effect.group.material.addEventListener('dispose', () => count.material++);
                geometry.addEventListener('dispose', onGeometryDispose);
                return () => {
                  geometry.removeEventListener('dispose', onGeometryDispose);
                  return {...count, detached: !effect.group.parent};
                };
              }
              const expire = observe();
              vfx.update(0.5);
              const active = vfx.effects.at(-1), rose = active.group.position.y > 3 && active.group.material.opacity < 1;
              vfx.update(0.5);
              const expired = expire();
              const clear = observe();
              vfx.setReducedMotion(true);
              const reduced = clear();
              vfx.floatingText(0, 3, 0, '-12', '#ef4444');
              const suppressed = vfx.effects.length === 0;
              vfx.setReducedMotion(false);
              const released = record => record.texture === 1 && record.material === 1 && record.geometry === 0 && record.detached;
              return {passed: rose && released(expired) && released(reduced) && suppressed, expired, reduced, suppressed, rose};
            }''')
            check(page, 'Acid floor damage follows simulation with normal, reduced and absent visuals', '''() => {
              const game = gameInstance, vfx = HiveSystems.vfx;
              const human = game.humans.find(actor => !actor.isCocooned && !actor.isIncapacitated && actor.hp > 36);
              if (!human) return {passed: false, reason: 'A live campaign actor is required'};
              const scene = vfx.scene, position = {x: human.x, z: human.z}, startingHp = human.hp;
              const step = count => { for (let tick = 0; tick < count; tick++) game.updateAcidPools(.05); };
              const observations = [];
              try {
                for (const mode of ['normal', 'reduced', 'no-scene']) {
                  game.clearAcidPools();
                  vfx.clear();
                  game.setSystemPaused(false);
                  vfx.setReducedMotion(mode === 'reduced');
                  vfx.scene = mode === 'no-scene' ? null : scene;
                  const hp = human.hp;
                  const created = game.registerAcidPool(position.x, position.z, 1.5, 1.5);
                  const marker = vfx.effects.find(effect => effect.acidPool);
                  const markerCorrect = mode === 'no-scene' ? !marker : !!marker && marker.group.children[0].visible;
                  vfx.update(.5);
                  const visualDidNotDamage = human.hp === hp;
                  step(9);
                  const earlyDamage = hp - human.hp;
                  const remaining = game.acidPools[0]?.remaining;
                  game.setSystemPaused(true);
                  step(20);
                  const pausePreservedTime = game.acidPools[0]?.remaining === remaining && human.hp === hp;
                  game.setSystemPaused(false);
                  if (mode === 'normal') vfx.setReducedMotion(true);
                  const markerPreserved = mode !== 'normal' || vfx.effects.includes(marker) &&
                    marker.group.children[0].visible && marker.group.children.slice(1).every(child => !child.visible);
                  step(1);
                  const firstHit = hp - human.hp;
                  human.x += 4;
                  step(10);
                  human.x = position.x;
                  const outsideDamage = hp - firstHit - human.hp;
                  game.loadStage(1);
                  const stageClean = game.acidPools.length === 0 && !vfx.effects.some(effect => effect.acidPool);
                  observations.push({mode, created, earlyDamage, firstHit, outsideDamage, pausePreservedTime,
                    visualDidNotDamage, markerCorrect, markerPreserved, stageClean});
                }
              } finally {
                human.hp = startingHp;
                human.x = position.x;
                vfx.scene = scene;
                game.clearAcidPools();
                vfx.setReducedMotion(false);
                game.setSystemPaused(true);
              }
              return {observations, passed: observations.every(result => result.created && result.earlyDamage === 0 &&
                result.firstHit === 12 && result.outsideDamage === 0 && result.pausePreservedTime &&
                result.visualDidNotDamage && result.markerCorrect && result.markerPreserved && result.stageClean)};
            }''')
            report['complete'] = True
        finally:
            report['sourceAfter'] = inventory()
            report['passed'] = report['complete'] and not report['errors'] and report['sourceBefore'] == report['sourceAfter']
            save()
            browser.close()
    assert report['passed'], report


if __name__ == '__main__':
    main()
