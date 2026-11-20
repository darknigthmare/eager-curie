#!/usr/bin/env python3
"""Browser regression checks. Requires Python Playwright and system Chromium.

Serve this repository with tools/serve.py, then run this script.
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
from qa_boot_flow import open_campaign_menu


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
        open_campaign_menu(page)

    def start(page):
        open_campaign_menu(page)
        # This smoke path has one reproducible authored origin. The dedicated
        # cycle suite covers the four origin/host journeys independently.
        # The visible radio card, not its internal hidden campaign select.
        page.locator('.origin-card[data-origin="starship"]').click()
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
                    if(g.isSystemPaused) throw Error('Host navigation must obey the real unpaused simulation state');
                    let frames=0;
                    while(!stage.hostArrived && frames<1800){host.update(1/60);stage.update(1/60);frames++}
                    const arrived=stage.hostArrived;
                    return {arrived,frames,x:host.x,z:host.z};
                }''')
                require(navigation['arrived'], f'Actual host AI reaches egg within 30 simulated seconds: {navigation}')
                page.click('#btn-open-egg')
                page.click('#btn-expel-facehugger')
                page.locator('#modal-btn-continue').click()
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

            def rts_inputs():
                canvas = page.locator('#game-canvas')
                canvas.focus()
                observed = []
                for key, order in enumerate(('HUNT', 'CAPTURE', 'DEFEND', 'INFEST', 'RUSH'), 1):
                    page.keyboard.press(str(key))
                    active = page.locator('.rts-cmd-btn[data-cmd][aria-pressed="true"]')
                    require(active.count() == 1 and active.get_attribute('data-cmd') == order,
                            f'RTS key {key} must select {order} in the real command palette')
                    observed.append(order)
                page.keyboard.press('p')
                require(page.locator('#btn-possess-mode').get_attribute('aria-pressed') == 'true',
                        'P owns possession in act 5')
                page.locator('.rts-cmd-btn[data-cmd="DEFEND"]').click()
                require(page.evaluate('pheromoneSystem.activeCommand === "DEFEND" && !pheromoneSystem.possessionMode'),
                        'Visible order button drives the same command and leaves possession')
                canvas.focus()
                page.keyboard.press('h')
                require(page.evaluate('gameInstance.currentStage.selectedUnit === gameInstance.currentStage.queen'),
                        'H selects the live queen for camera focus')
                page.keyboard.press('c')
                require(page.locator('#codex-overlay').is_hidden() and
                        page.evaluate('gameInstance.currentStage.royalCryCooldown > 0'),
                        'C triggers the act 5 royal cry without opening the Codex')
                page.keyboard.press('n')
                scent = page.evaluate('''() => {
                    const trail=pheromoneSystem.scentTrails.at(-1), queen=gameInstance.currentStage.queen;
                    return trail && {distance:Math.hypot(trail.x-queen.x,trail.z-queen.z),timer:trail.timer};
                }''')
                require(scent and scent['distance'] < .05 and scent['timer'] > 0,
                        'N lays active scent at the RTS queen position')
                return {'orders': observed, 'scent': scent}
            check('RTS native keyboard, command palette and queen shortcuts', rts_inputs)

            def resume():
                page.evaluate('HiveSystems.save.write({stage:4,campaignStarted:true,difficulty:"story",adultCaste:"runner",hostProfile:"labhound"})')
                page.reload(wait_until='domcontentloaded')
                page.wait_for_function('() => !!window.HiveSystems?.ui?.game', timeout=120000)
                open_campaign_menu(page)
                require(not page.locator('#btn-continue-campaign').is_disabled(), 'Continue offered after reload')
                page.click('#btn-continue-campaign')
                require(page.evaluate('gameInstance.currentStageIndex===4 && gameInstance.campaignConfig.difficulty==="story" && gameInstance.campaignConfig.adultCaste==="runner" && gameInstance.hostProfile==="labhound"'), 'Saved act, difficulty, caste and host restored')
                require(page.locator('#setting-volume').input_value() == '25', 'Volume survives reload')
                return 'Actual reload and continue; stored checkpoint seeded through save API'
            check('Reload and continue checkpoint', resume)

            def desktop_hud_layout():
                original = page.viewport_size
                records = []
                page.locator('#stealth-visibility-sensor').wait_for(state='visible')
                page.wait_for_function('() => !!document.getElementById("hud-gyro-compass")')
                page.evaluate('() => gameInstance.setSystemPaused(true)')
                try:
                    for width in (1440, 1100, 1051):
                        page.set_viewport_size({'width': width, 'height': original['height']})
                        # Chromium can expose the new innerWidth before applying the new layout.
                        page.wait_for_function('''expectedWidth => {
                            const header = document.getElementById('hud-header').getBoundingClientRect();
                            const measuredHeight = parseFloat(getComputedStyle(document.documentElement)
                                .getPropertyValue('--hud-header-height'));
                            return innerWidth === expectedWidth && Math.abs(header.width - expectedWidth) < .5 &&
                                Math.ceil(header.height) === measuredHeight;
                        }''', arg=width)
                        state = page.evaluate('''() => {
                            const header = document.getElementById('hud-header');
                            const bounds = header.getBoundingClientRect();
                            const selector = '.brand-title, #stage-badge, .vis-btn, #alert-box, #cryo-ambient-sensor, ' +
                                '#atmo-composition-sensor, #stealth-visibility-sensor, .utility-btn';
                            const nodes = [...header.querySelectorAll(selector)].filter(node => node.offsetHeight > 0);
                            const boxes = nodes.map(node => {
                                const {left, right, top, bottom} = node.getBoundingClientRect();
                                return {id: node.id || node.className, left, right, top, bottom};
                            });
                            const collides = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > .5 &&
                                Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > .5;
                            return {width: innerWidth, headerWidth: bounds.width, height: bounds.height, boxes,
                                gyroTop: document.getElementById('hud-gyro-compass').getBoundingClientRect().top,
                                commands: nodes.filter(node => node.tagName === 'BUTTON' && node.tabIndex >= 0 && !node.disabled).length,
                                outside: boxes.filter(box => box.left < -.5 || box.right > innerWidth + .5),
                                overlapping: boxes.some((box, index) => boxes.slice(index + 1).some(other => collides(box, other)))};
                        }''')
                        if state['outside'] or state['overlapping'] or state['commands'] != 7 or state['gyroTop'] < state['height']:
                            page.screenshot(path=str(output / f'desktop-hud-failed-{width}.png'))
                            raise AssertionError(f'Desktop stage/telemetry and all commands fit without overlap: {state}')
                        records.append(state)
                finally:
                    page.set_viewport_size(original)
                    page.evaluate('() => gameInstance.setSystemPaused(false)')
                return records
            check('Desktop HUD keeps stage, sensors and commands clear', desktop_hud_layout)

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
                preparations = []
                for index in range(3):
                    if index:
                        page.reload(wait_until='domcontentloaded')
                        page.wait_for_function('() => !!window.HiveSystems?.ui?.game', timeout=120000)
                        start(page)
                    prepared = page.evaluate('''() => {
                        gameInstance.startCampaign(5);
                        const s=gameInstance.currentStage;
                        s.relayCount=3;
                        s.relayMeshes.forEach(r=>r.userData.isolated=true);
                        const neutralize=host=>{
                            if(typeof host.incapacitate!=='function') throw Error('Actual incapacitation API missing for '+host.name);
                            host.incapacitate();
                        };
                        gameInstance.humans.forEach(neutralize);
                        const clearBeforeReinforcements=s.canCompleteConquest();
                        // Isolated relays trigger the real final response on
                        // the next tick. Materialize it before preparing the
                        // ending fixture, rather than bypassing its guard.
                        s.checkRtsReinforcements(0);
                        const mantis=s.mantisBoss;
                        const jansen=gameInstance.humans.find(h=>h.id===207&&h.type==='powerloader');
                        const activeReinforcements=gameInstance.humans.filter(h=>!h.isCocooned&&!h.isIncapacitated);
                        const blockedWithReinforcements=!s.canCompleteConquest();
                        const realReinforcements=!!mantis?.mesh&&gameInstance.humans.includes(mantis)&&!!jansen?.mesh;
                        gameInstance.humans.forEach(neutralize);
                        s.updateStats();
                        return {clearBeforeReinforcements,realReinforcements,blockedWithReinforcements,
                            activeReinforcements:activeReinforcements.map(h=>({id:h.id,type:h.type,name:h.name})),
                            finalGuard:s.canCompleteConquest()};
                    }''')
                    require(prepared['clearBeforeReinforcements'] and prepared['realReinforcements'] and
                            len(prepared['activeReinforcements']) == 2 and prepared['blockedWithReinforcements'],
                            f'Real Mantis/Jansen reinforcements prevent conquest while active: {prepared}')
                    require(prepared['finalGuard'], 'Conquest becomes available only after actual incapacitation APIs neutralize every threat')
                    preparations.append(prepared)
                    page.click('#btn-final-conquest')
                    choices = page.locator('#ending-choices button')
                    require(choices.count() == 3, 'Three distinct endings offered')
                    expected = page.evaluate('''(index) => {
                        const raw=HIVE_CONTENT.endings;
                        const ending=(Array.isArray(raw)?raw:Object.values(raw))[index];
                        return {id:ending.id,title:ending.title,tone:ending.tone||'',epilogue:ending.epilogue};
                    }''', index)
                    title = choices.nth(index).locator('strong').inner_text()
                    require(title == expected['title'], 'Displayed choice matches its exact content title')
                    choices.nth(index).click()
                    require(page.locator('#stage-modal').is_visible(), 'Ending epilogue displayed')
                    require(not page.evaluate('gameInstance.isRunning'), 'Completed simulation stops')
                    full_title = title + (f" [{expected['tone']}]" if expected['tone'] else '')
                    require(page.locator('#modal-title').inner_text() == full_title, 'Selected epilogue matches the exact choice title and tone')
                    epilogue = page.locator('#modal-description').text_content()
                    require(expected['epilogue'] and expected['epilogue'] in epilogue and 'BILAN TACTIQUE DE CAMPAGNE' in epilogue,
                            'The selected content epilogue and actual campaign synthesis are displayed')
                    saved = page.evaluate('HiveSystems.save.read()')
                    require(not saved['campaignStarted'] and len(saved['completedEndings']) == index + 1 and expected['id'] in saved['completedEndings'],
                            'Exact selected ending ID accumulates and campaign is marked complete')
                    require(page.locator('#game-canvas').evaluate('(e)=>e.inert'), 'Completed game input isolated')
                    prepared['ending'] = expected
                    completed.append(title)
                return dict(choices=completed, preparations=preparations,
                            prerequisites='Act five and three isolated relays prepared via API; real reinforcements and conquest guard asserted; actual incapacitate() methods prepare threat-free ending state; actual choice and epilogue UI exercised, not a played boss fight')
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
            records = []
            for width, height in ((390, 844), (844, 390)):
                mobile.set_viewport_size({'width': width, 'height': height})
                mobile.wait_for_function('() => HiveSystems.ui.compactHudActive === true')
                for stage in (1, 4, 5):
                    mobile.evaluate('(s)=>gameInstance.startCampaign(s)', stage)
                    mobile.wait_for_function('''() => {
                        const app=document.querySelector('#app-container'), toggle=document.querySelector('#btn-toggle-hud');
                        return toggle.getAttribute('aria-expanded')==='false' &&
                            !app.classList.contains('hud-drawer-open') && document.querySelector('#hud-sidebar').inert;
                    }''')
                    require(mobile.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{width}×{height}, act {stage}: no horizontal overflow')
                    toggle = mobile.locator('#btn-toggle-hud')
                    require(toggle.is_visible(), 'Mobile HUD control visible')
                    bounds = toggle.bounding_box()
                    require(bounds and bounds['width'] >= 44 and bounds['height'] >= 44, 'Drawer trigger is at least 44×44 CSS pixels')
                    if stage != 5:
                        aliases = mobile.locator('#hud-quick-actions .quick-action-btn:visible')
                        require(aliases.count() > 0, 'Closed drawer retains actual contextual action aliases')
                        for alias in aliases.all():
                            bounds = alias.bounding_box()
                            require(bounds and bounds['width'] >= 44 and bounds['height'] >= 44, 'Quick actions remain touch sized')
                    toggle.click()
                    require(toggle.get_attribute('aria-expanded') == 'true', 'Touch control opens drawer')
                    require(mobile.locator('#hud-sidebar').evaluate('(e)=>!e.inert'), 'Open drawer exposes its controls')
                    require(mobile.evaluate('document.querySelector("#action-buttons-container").contains(document.activeElement)'), 'Opening focuses a real action control')
                    mobile.keyboard.press('Escape')
                    require(toggle.get_attribute('aria-expanded') == 'false', 'Escape closes drawer')
                    require(mobile.locator('#hud-sidebar').evaluate('(e)=>e.inert'), 'Closed drawer is removed from interaction')
                    require(mobile.evaluate('document.activeElement.id === "btn-toggle-hud" && !gameInstance.isSystemPaused'), 'Drawer Escape restores focus without pausing')
                    # Stage initialization is a supported public API, not a
                    # simulated campaign evolution. It must also close an open
                    # drawer without leaving stale visual hiding classes.
                    toggle.click()
                    mobile.evaluate('(s)=>gameInstance.startCampaign(s)', stage)
                    mobile.wait_for_function('''() => document.querySelector('#btn-toggle-hud').getAttribute('aria-expanded')==='false' &&
                        !document.querySelector('#app-container').classList.contains('hud-drawer-open') && document.querySelector('#hud-sidebar').inert''')
                    records.append(dict(width=width, height=height, stage=stage))
                mobile.screenshot(path=str(output/f'mobile-rts-{width}x{height}.png'))
            return dict(viewports=records, scope='Touch target geometry, actual drawer focus/Escape and API stage-reset coherence; not a full touch campaign')
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
