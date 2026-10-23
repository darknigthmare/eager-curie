#!/usr/bin/env python3
"""Browser regression checks. Requires Python Playwright and system Chromium.

Serve this repository with Python's http.server, then run this script.
Stage 2–5 checks initialize public game APIs; they do not claim full playthroughs.
No network request interception or replacement is used.
"""

import argparse
import json
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import urlopen
from urllib.error import HTTPError

from playwright.sync_api import sync_playwright


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', default='http://127.0.0.1:8080/')
    parser.add_argument('--output', default='.tools/qa')
    parser.add_argument('--chromium', default='/usr/bin/chromium')
    args = parser.parse_args()
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    results, errors, bad_assets = [], [], []

    def check(name, fn):
        started = time.monotonic()
        try:
            detail = fn()
            results.append(dict(name=name, status='passed', seconds=round(time.monotonic()-started, 2), detail=detail))
            print('PASS', name, flush=True)
        except Exception as exc:
            results.append(dict(name=name, status='failed', seconds=round(time.monotonic()-started, 2), detail=str(exc)))
            print('FAIL', name, str(exc), flush=True)

    def require(value, description):
        if not value:
            raise AssertionError(description)
        return description

    def watch(page):
        page.on('pageerror', lambda error: errors.append(error.stack or str(error)))
        page.on('response', lambda response: bad_assets.append(f'{response.status} {response.url}')
                if response.status >= 400 and urlparse(response.url).netloc == urlparse(args.url).netloc
                else None)

    def boot(page):
        page.goto(args.url, wait_until='domcontentloaded')
        page.wait_for_function('() => !!(window.gameInstance && window.HiveSystems?.ui?.game)', timeout=120000)

    def start(page):
        page.click('#btn-new-campaign')
        page.click('#btn-start-act-one')
        page.wait_for_function('() => gameInstance.campaignActive && !gameInstance.isSystemPaused')

    def native_assets():
        from html.parser import HTMLParser
        paths = []
        class Assets(HTMLParser):
            def handle_starttag(self, tag, attrs):
                attrs = dict(attrs)
                path = attrs.get('src') or (attrs.get('href') if tag == 'link' and attrs.get('rel') == 'stylesheet' else None)
                if path and not path.startswith(('http:', 'https:', 'data:')):
                    paths.append(path)
        with urlopen(args.url, timeout=10) as response:
            require(response.status == 200, 'HTML returned HTTP 200')
            Assets().feed(response.read().decode())
        require(len(paths) >= 5, 'HTML references actual local runtime assets')
        for path in paths:
            with urlopen(urljoin(args.url, path), timeout=10) as response:
                require(response.status == 200 and len(response.read()) > 0, f'{path} returned nonempty HTTP 200')
        return paths

    check('HTTP: local scripts and stylesheet', native_assets)
    def production_headers():
        with urlopen(args.url, timeout=10) as response:
            csp=response.headers.get('Content-Security-Policy','')
            require("script-src 'self'" in csp and "object-src 'none'" in csp, 'Strict local-script CSP present')
            require(response.headers.get('X-Content-Type-Options')=='nosniff', 'MIME sniffing disabled')
        for path in ('.git/config', 'tools/qa-browser.py', 'README.md', 'assets/'):
            try:
                with urlopen(urljoin(args.url,path),timeout=10) as response:
                    raise AssertionError(f'Private file or listing exposed: {path} ({response.status})')
            except HTTPError as error:
                require(error.code==404, f'{path} blocked with HTTP 404')
        return 'CSP, MIME protection, no repository metadata/tooling/directory listing'
    check('Production headers and private-path exclusion', production_headers)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=args.chromium, headless=True,
            args=['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-angle=swiftshader'])
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = context.new_page()
        watch(page)
        check('Native WebGL boot without request substitution', lambda: (boot(page),
            require(page.evaluate('THREE.REVISION === "128" && document.querySelector("canvas").width > 0 && gameInstance.isRunning'),
                    'Three r128 and active render loop'))[-1])

        if page.evaluate('!!window.HiveSystems?.ui?.game'):
            check('New campaign through visible UI', lambda: (start(page),
                require(page.evaluate('gameInstance.currentStageIndex === 1 && HiveSystems.ui.campaignActive'), 'Act one started'))[-1])

            def egg_cycle():
                for _ in range(3):
                    page.click('#btn-calibrate-senses')
                require(page.locator('#btn-calibrate-senses').is_disabled(), 'Calibration capped at three')
                require(page.locator('#btn-open-egg').is_disabled(), 'Egg cannot open before host arrival')
                page.click('#btn-lure')
                # Software WebGL can render slower than the engine's capped clock.
                # Exercise real entity navigation at 60 Hz without renderer speed
                # determining whether this gameplay assertion passes.
                navigation = page.evaluate('''() => {
                    const g=gameInstance, stage=g.currentStage, host=g.humans[0];
                    g.setSystemPaused(true);
                    let frames=0;
                    while(!stage.hostArrived && frames<1800){host.update(1/60);stage.update(1/60);frames++}
                    const arrived=stage.hostArrived;
                    g.setSystemPaused(false);
                    return {arrived,frames,x:host.x,z:host.z};
                }''')
                require(navigation['arrived'], f'Actual host AI reaches egg within 30 simulated seconds: {navigation}')
                page.click('#btn-open-egg')
                page.click('#btn-expel-facehugger')
                page.wait_for_function('() => gameInstance.currentStageIndex === 2')
                require(page.evaluate('HiveSystems.save.read().stage === 2'), 'Act-two checkpoint persisted')
                return dict(ui='Three calibrations, lure, egg opening, expulsion and stage-two checkpoint',
                            navigation=navigation, clock='Actual AI at fixed 60 Hz; renderer-independent navigation check')
            check('Act-one UI and deterministic host navigation', egg_cycle)

            def pause_and_vision():
                page.evaluate('gameInstance.startCampaign(2)')
                page.locator('#game-canvas').focus()
                page.keyboard.press('F2')
                require(page.locator('#btn-vis-thermal').get_attribute('aria-pressed') == 'true', 'F2 thermal enabled')
                page.keyboard.press('F3')
                require(page.locator('#btn-vis-acoustic').get_attribute('aria-pressed') == 'true', 'F3 acoustic enabled')
                page.keyboard.press('Escape')
                require(page.evaluate('gameInstance.isSystemPaused'), 'Escape pauses simulation')
                page.keyboard.press('F1')
                require(page.locator('#btn-vis-acoustic').get_attribute('aria-pressed') == 'true', 'Vision shortcut blocked while paused')
                page.keyboard.press('Escape')
                require(page.evaluate('!gameInstance.isSystemPaused'), 'Escape resumes simulation')
                page.locator('#game-canvas').focus()
                page.keyboard.press('F1')
                require(page.locator('#btn-vis-normal').get_attribute('aria-pressed') == 'true', 'F1 normal vision restored')
                return 'F1/F2/F3 and pause/resume behave correctly'
            check('Keyboard visions and pause isolation', pause_and_vision)

            def codex():
                page.locator('#game-canvas').focus()
                page.keyboard.press('c')
                require(page.locator('#codex-overlay').is_visible(), 'Codex opened')
                require(page.evaluate('gameInstance.isSystemPaused'), 'Codex pauses simulation')
                tabs = page.locator('.codex-tab')
                tabs.first.focus()
                page.keyboard.press('ArrowRight')
                require(tabs.nth(1).get_attribute('aria-selected') == 'true', 'Arrow key changes active tab')
                page.keyboard.press('Escape')
                require(not page.locator('#codex-overlay').is_visible(), 'Escape closes codex')
                require(page.evaluate('!gameInstance.isSystemPaused'), 'Codex close resumes simulation')
                return 'Keyboard tab navigation and modal pause isolation'
            check('Codex keyboard navigation', codex)

            def settings():
                page.locator('#game-canvas').focus()
                page.keyboard.press('Escape')
                page.click('#btn-open-settings')
                page.locator('#setting-volume').evaluate('(element)=>element.value="25"')
                page.locator('#setting-volume').dispatch_event('input')
                page.locator('#setting-reduced-motion').check()
                page.locator('#setting-high-contrast').check()
                require(page.evaluate('HiveSystems.settings.values.volume === 25 && HiveSystems.settings.values.reducedMotion && HiveSystems.settings.values.highContrast'), 'Settings applied')
                require(page.locator('#app-container').evaluate('(e)=>e.classList.contains("reduce-motion") && e.classList.contains("high-contrast")'), 'Accessibility classes applied')
                page.click('#btn-close-settings')
                require(page.evaluate('gameInstance.isSystemPaused'), 'Closing settings retains pause')
                page.click('#btn-resume-game')
                return 'Volume, reduced motion and high contrast applied and stored'
            check('Settings and nested pause lifecycle', settings)

            for stage, expected in enumerate(('StageEgg', 'StageFacehugger', 'StageChestburster', 'StageDrone', 'StageHiveRTS'), 1):
                def stage_check(stage=stage, expected=expected):
                    page.evaluate('(stage)=>gameInstance.startCampaign(stage)', stage)
                    page.wait_for_timeout(700)
                    state = page.evaluate('''({stage:gameInstance.currentStageIndex,name:gameInstance.currentStage.constructor.name,
                        running:gameInstance.isRunning,paused:gameInstance.isSystemPaused,humans:gameInstance.humans.length,
                        title:document.querySelector('#stage-badge').textContent})''')
                    require(state['stage'] == stage and state['name'] == expected and state['running'] and not state['paused'], 'Stage initializes and updates')
                    require(len(state['title']) > 8 and page.locator('#action-buttons-container button').count() > 0, 'Stage HUD and actions populated')
                    page.screenshot(path=str(output/f'act-{stage}.png'))
                    return state
                check(f'API initialization and simulation: act {stage}', stage_check)

            def rts_guard():
                state = page.evaluate('''() => {
                    const s=gameInstance.currentStage;
                    if(gameInstance.currentStageIndex!==5) throw Error('Not act 5');
                    const before=s.biomass;
                    s.biomass=0;
                    const count=s.incubationCycles.length;
                    s.spawnUnit('drone',30);
                    const guarded=s.biomass===0 && s.incubationCycles.length===count;
                    s.biomass=before;
                    return {guarded,queen:!!s.queen?.mesh,relays:s.relayMeshes.length,units:s.rtsUnits.length};
                }''')
                require(state['guarded'] and state['queen'] and state['relays'] == 3 and state['units'] >= 1, 'RTS assets and insufficient-biomass guard')
                return state
            check('RTS queen, relays and resource guard', rts_guard)

            def resume():
                page.evaluate('HiveSystems.save.write({stage:4,campaignStarted:true,difficulty:"story",adultCaste:"runner",hostProfile:"labhound"})')
                page.reload(wait_until='domcontentloaded')
                page.wait_for_function('() => !!window.HiveSystems?.ui?.game', timeout=120000)
                require(not page.locator('#btn-continue-campaign').is_disabled(), 'Continue offered after reload')
                page.click('#btn-continue-campaign')
                require(page.evaluate('gameInstance.currentStageIndex===4 && gameInstance.campaignConfig.difficulty==="story" && gameInstance.campaignConfig.adultCaste==="runner" && gameInstance.hostProfile==="labhound"'), 'Saved act, difficulty, caste and host restored')
                require(page.locator('#setting-volume').input_value() == '25', 'Volume survives reload')
                return 'Actual reload and continue; stored checkpoint seeded through save API'
            check('Reload and continue checkpoint', resume)

            def restart():
                page.locator('#game-canvas').focus()
                page.keyboard.press('Escape')
                page.click('#btn-return-menu')
                require(page.locator('#boot-screen').is_visible(), 'Return to menu visible')
                require(page.evaluate('!gameInstance.campaignActive && gameInstance.isSystemPaused'), 'World paused at menu')
                start(page)
                state = page.evaluate('({stage:gameInstance.currentStageIndex,humans:gameInstance.humans.length,running:gameInstance.isRunning})')
                require(state['stage'] == 1 and state['humans'] == 1 and state['running'], 'Fresh campaign resets actors and resumes loop')
                return state
            check('Return to menu and start a fresh campaign', restart)

            def endings():
                completed = []
                for index in range(3):
                    if index:
                        page.reload(wait_until='domcontentloaded')
                        page.wait_for_function('() => !!window.HiveSystems?.ui?.game', timeout=120000)
                        start(page)
                    page.evaluate('''() => {
                        gameInstance.startCampaign(5);
                        const s=gameInstance.currentStage;
                        s.relayCount=3;
                        s.relayMeshes.forEach(r=>r.userData.isolated=true);
                        gameInstance.humans.forEach(h=>h.isIncapacitated=true);
                        s.updateStats();
                    }''')
                    page.click('#btn-final-conquest')
                    choices = page.locator('#ending-choices button')
                    require(choices.count() == 3, 'Three distinct endings offered')
                    title = choices.nth(index).locator('strong').inner_text()
                    choices.nth(index).click()
                    require(page.locator('#stage-modal').is_visible(), 'Ending epilogue displayed')
                    require(not page.evaluate('gameInstance.isRunning'), 'Completed simulation stops')
                    require(page.locator('#modal-title').inner_text() == title, 'Selected epilogue matches choice')
                    saved = page.evaluate('HiveSystems.save.read()')
                    require(not saved['campaignStarted'] and len(saved['completedEndings']) == index + 1,
                            'Ending discovery accumulates and campaign marked complete')
                    require(page.locator('#game-canvas').evaluate('(e)=>e.inert'), 'Completed game input isolated')
                    completed.append(title)
                return dict(choices=completed, prerequisites='Act five, three isolated relays and incapacitated threats seeded via API; actual choice and epilogue UI exercised')
            check('All three ending choices and persisted discoveries', endings)

            def textures():
                for path in sorted(Path('assets/textures').glob('*.png')):
                    with urlopen(urljoin(args.url, path.as_posix()), timeout=10) as response:
                        require(response.status == 200 and response.read(8) == b'\x89PNG\r\n\x1a\n', f'Valid PNG served: {path}')
                require(len(list(Path('assets/textures').glob('*.png'))) >= 4, 'Committed texture set present')
                return 'Four or more local PNG textures served'
            check('Local texture delivery', textures)
            def fonts():
                faces = page.evaluate('''async () => {
                    await Promise.all([...document.fonts].map(face=>face.load()));
                    return [...document.fonts].map(face=>({family:face.family,weight:face.weight,status:face.status}));
                }''')
                require(len(faces) >= 6 and all(face['status'] == 'loaded' for face in faces), 'All six local font faces loaded')
                return faces
            check('Local fonts loaded', fonts)

        def damaged_storage():
            damaged_context = browser.new_context()
            damaged = damaged_context.new_page()
            watch(damaged)
            damaged.add_init_script('''
                localStorage.setItem('hive-ascension-campaign-v2','{invalid-json');
                localStorage.setItem('hive-ascension-settings-v2','null');
            ''')
            boot(damaged)
            require(damaged.locator('#btn-continue-campaign').is_disabled(), 'Corrupt campaign not resumable')
            start(damaged)
            require(damaged.evaluate('gameInstance.currentStageIndex===1 && gameInstance.isRunning'), 'Corrupt saved data does not prevent new campaign')
            damaged_context.close()
            return 'Malformed campaign JSON and null settings recover to playable defaults'
        check('Corrupt local storage recovery', damaged_storage)

        def denied_storage():
            denied_context = browser.new_context()
            denied = denied_context.new_page()
            watch(denied)
            denied.add_init_script('''
                Storage.prototype.getItem=function(){throw new DOMException('QA denied','SecurityError')};
                Storage.prototype.setItem=function(){throw new DOMException('QA denied','SecurityError')};
            ''')
            boot(denied)
            start(denied)
            denied.evaluate('HiveSystems.save.checkpoint(3,{adultCaste:"runner"})')
            require(denied.evaluate('gameInstance.isRunning && HiveSystems.save.read()?.stage===3'), 'Campaign remains usable in memory when persistent storage denied')
            denied_context.close()
            return 'Storage API denied; campaign remains usable with in-memory checkpoint'
        check('Denied local storage graceful fallback', denied_storage)

        mobile_context = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        mobile = mobile_context.new_page()
        watch(mobile)
        def mobile_layout():
            boot(mobile)
            require(mobile.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Menu has no horizontal overflow')
            start(mobile)
            for stage in (1, 4, 5):
                mobile.evaluate('(s)=>gameInstance.startCampaign(s)', stage)
                mobile.wait_for_timeout(400)
                require(mobile.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Act {stage}: no horizontal overflow')
                toggle = mobile.locator('#btn-toggle-hud')
                require(toggle.is_visible(), 'Mobile HUD control visible')
                toggle.click()
                expanded = toggle.get_attribute('aria-expanded') == 'true'
                require(mobile.locator('#hud-sidebar').evaluate('(e)=>e.inert') == (not expanded), 'Hidden mobile HUD removed from interaction')
            mobile.screenshot(path=str(output/'mobile-rts.png'))
            return '390×844 menu and acts 1/4/5; touch HUD toggle and no page overflow'
        check('Mobile touch layout and HUD isolation', mobile_layout)
        check('No uncaught JavaScript errors', lambda: require(not errors, repr(errors)))
        check('No failed local runtime requests', lambda: require(not bad_assets, repr(bad_assets)))
        browser.close()

    report = dict(url=args.url, results=results, uncaught_errors=errors, failed_assets=bad_assets,
                  passed=sum(x['status']=='passed' for x in results), failed=sum(x['status']=='failed' for x in results),
                  scope='Automated Chromium checks; API initialization for acts 2–5 is not a complete campaign playthrough. No human testers.')
    (output/'results.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
    print(f"{report['passed']} passed, {report['failed']} failed; {output/'results.json'}", flush=True)
    return 1 if report['failed'] else 0


if __name__ == '__main__':
    raise SystemExit(main())
