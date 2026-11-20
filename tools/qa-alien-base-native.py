#!/usr/bin/env python3
"""Native Chromium checks of the public reference library and modal round trip.

No network interception or production method replacement. Campaign start uses
visible controls; one explicitly prepared public unlock makes the Queen Codex
entry available without claiming a completed campaign. Viewports are emulated,
not physical devices. Screenshots/DOM checks do not certify film fidelity.
"""
import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import shutil
from urllib.parse import unquote, urljoin, urlparse

from playwright.sync_api import sync_playwright
from qa_boot_flow import open_campaign_menu


def classify_resource_url(resource_url, base_url):
    """Keep same-origin browser blobs separate from fetchable HTTP files."""
    try:
        base = urlparse(base_url)
        resource = urlparse(resource_url)
        origin = (base.scheme, base.netloc)
        if base.scheme not in ('http', 'https') or not base.netloc:
            return 'foreign'
        if resource.scheme == 'blob':
            owner = urlparse(resource.path)
            return 'local-blob' if (owner.scheme, owner.netloc) == origin else 'foreign'
        return 'local-http' if (resource.scheme, resource.netloc) == origin else 'foreign'
    except ValueError:
        return 'foreign'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--source-root', type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    root, output = args.source_root.resolve(), args.output.resolve()
    if output.exists():
        raise SystemExit('Refusing to overwrite earlier native evidence: ' + str(output))
    output.mkdir(parents=True)
    sha = lambda value: hashlib.sha256(value).hexdigest()
    public_data = ['data/alien-base.snapshot.v1.json', 'data/alien-base.snapshot.v2.json', 'data/alien-base.media.v2.json']
    source_files = sorted([*root.joinpath('src').rglob('*.js'), *root.joinpath('src').rglob('*.css'),
                           *[root / name for name in public_data], root / 'index.html', root / 'vercel.json'])
    inventory = lambda: {str(path.relative_to(root)): sha(path.read_bytes()) for path in source_files}
    report = {'scope': __doc__, 'complete': False, 'url': args.url, 'sourceBefore': inventory(),
              'sourceAfter': None, 'checks': [], 'captures': [], 'errors': [], 'consoleErrors': [],
              'failedAssets': [], 'foreignRequests': [], 'localBlobResponses': [],
              'browserResponses': [], 'httpBefore': {}, 'httpAfter': {},
              'fixture': 'Only HiveSystems.unlockCodex([queen]) is prepared through the real public API; no internal game export or logic replacement',
              'harnessSha256': sha(Path(__file__).read_bytes())}

    def save():
        (output / 'results.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')

    def require(value, message):
        if not value:
            raise AssertionError(message)

    def check(name, run):
        try:
            detail = run()
            report['checks'].append({'name': name, 'passed': True, 'detail': detail})
            save()
            print('PASS', name, flush=True)
            return detail
        except Exception as error:
            report['checks'].append({'name': name, 'passed': False, 'error': str(error)})
            save()
            raise

    class EntryAssets(HTMLParser):
        paths = []
        def handle_starttag(self, tag, attrs):
            attrs = dict(attrs)
            value = attrs.get('src') or (attrs.get('href') if tag == 'link' and attrs.get('rel') == 'stylesheet' else None)
            if value and not value.startswith(('http:', 'https:', 'data:')):
                self.paths.append(value)

    assets = EntryAssets()
    assets.feed((root / 'index.html').read_text())
    requested_paths = {'index.html', *assets.paths, *public_data}

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=shutil.which('chromium'), headless=True,
            args=['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-angle=swiftshader'])
        contexts, current_page = [], None

        def new_page(viewport, mobile=False):
            context = browser.new_context(viewport=viewport, is_mobile=mobile, has_touch=mobile, device_scale_factor=1)
            contexts.append(context)
            page = context.new_page()
            page.on('pageerror', lambda error: report['errors'].append(str(error)))
            page.on('console', lambda message: report['consoleErrors'].append(message.text) if message.type == 'error' else None)
            page.on('requestfailed', lambda request: report['failedAssets'].append(
                str(request.failure) + ' ' + request.url))
            def response_seen(response):
                kind = classify_resource_url(response.url, args.url)
                if kind == 'foreign':
                    report['foreignRequests'].append(response.url)
                    return
                if kind == 'local-blob':
                    report['localBlobResponses'].append({'url': response.url, 'status': response.status,
                        'scope': 'Browser-created blob owned by the exact local HTTP origin; not a file resource or external request'})
                    if response.status >= 400:
                        report['failedAssets'].append(f'{response.status} {response.url}')
                    return
                parsed = urlparse(response.url)
                path = parsed.path.lstrip('/') or 'index.html'
                if parsed.query:
                    path += '?' + parsed.query
                requested_paths.add(path)
                report['browserResponses'].append({'path': path, 'status': response.status})
                if response.status >= 400:
                    report['failedAssets'].append(f'{response.status} {response.url}')
            page.on('response', response_seen)
            return page

        def verify_http(request, paths, key):
            for relative in sorted(paths):
                parsed = urlparse(relative)
                local = root / unquote(parsed.path.lstrip('/'))
                require(local.is_file(), 'Unexpected non-public or missing local resource: ' + relative)
                response = request.get(urljoin(args.url, relative), timeout=120000)
                body = response.body()
                expected = sha(local.read_bytes())
                row = {'status': response.status, 'sha256': sha(body), 'expectedSha256': expected,
                       'bytes': len(body), 'contentType': response.headers.get('content-type')}
                report[key][relative] = row
                save()
                require(response.status == 200 and row['sha256'] == expected, 'HTTP/source mismatch: ' + relative)
                if relative in public_data:
                    require('application/json' in (row['contentType'] or ''), 'Reference export MIME mismatch: ' + relative)
            return {'resources': len(paths), 'allMatchExactLocalSources': True}

        def capture(page, name, label):
            page.screenshot(path=str(output / name), timeout=120000)
            state = page.evaluate('''() => ({viewport:[innerWidth,innerHeight],paused:gameInstance.isSystemPaused,
                archiveVisible:!document.getElementById('alien-base-overlay')?.hidden,
                codexVisible:!document.getElementById('codex-overlay')?.classList.contains('hidden'),
                drawerOpen:document.getElementById('btn-toggle-hud')?.getAttribute('aria-expanded')})''')
            report['captures'].append({'file': name, 'label': label, 'state': state})
            save()

        def boot(page):
            page.goto(args.url, wait_until='domcontentloaded')
            page.wait_for_function('()=>!!(window.gameInstance&&window.HiveSystems?.ui?.game&&document.getElementById("btn-open-alien-base-menu"))', timeout=120000)
            open_campaign_menu(page)

        def start(page):
            require(page.locator('#btn-new-campaign').is_visible(), 'New campaign control unavailable')
            page.locator('#btn-new-campaign').click()
            require(page.locator('#btn-start-act-one').is_visible(), 'Act-one control unavailable')
            page.locator('#btn-start-act-one').click()
            page.wait_for_function('()=>gameInstance.campaignActive&&!gameInstance.isSystemPaused', timeout=120000)

        def library_state(page):
            return page.evaluate('''() => ({records:AlienBaseReference.listSharedRecords().length,
                works:AlienBaseReference.listWorks().length,rows:document.querySelectorAll('#alien-base-list .ab-record').length,
                egg:AlienBaseReference.getCanonicalIdForCaste('ovomorphe'),runner:AlienBaseReference.getCanonicalIdForCaste('runner'),
                offspring:AlienBaseReference.getCanonicalIdForCaste('offspring'),
                allMediaUncertified:AlienBaseReference.listWorks().every(x=>x.fidelityVerified===false),
                noCards:AlienBaseReference.listSharedRecords().every(x=>x.kind!=='game-card')})''')

        def focus_edges(page):
            return page.evaluate('''() => {
                const layer=document.getElementById('alien-base-overlay'),selector='button:not(:disabled),select:not(:disabled),input:not(:disabled),textarea:not(:disabled),a[href],[tabindex]:not([tabindex="-1"])';
                const nodes=Array.from(layer.querySelectorAll(selector)).filter(n=>!n.closest('[inert]')&&(n.offsetParent!==null||n===document.activeElement));
                return {count:nodes.length,firstActive:document.activeElement===nodes[0],lastActive:document.activeElement===nodes.at(-1)};
            }''')

        def visible_layout(page):
            return page.evaluate('''() => {
                const panel=document.querySelector('#alien-base-overlay .ab-panel'),r=panel.getBoundingClientRect(),
                    close=document.getElementById('btn-close-alien-base').getBoundingClientRect();
                return {viewport:[innerWidth,innerHeight],scrollWidth:document.documentElement.scrollWidth,
                    panel:{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height},
                    closeHeight:close.height,touch:matchMedia('(pointer:coarse)').matches};
            }''')

        def wait_for_native_game_frame(page):
            # GameLoop intentionally defers resumed rendering, especially on
            # SwiftShader. Wait for its own completed render opportunity and
            # two real RAF boundaries; never call renderer.render() ourselves.
            page.wait_for_function('''()=>{
                const g=gameInstance;
                return g.isRunning&&!g.isSystemPaused&&Number.isFinite(g.lastSoftwareRenderAt)&&
                    g.lastSoftwareRenderAt>=g.renderResumeAt;
            }''', timeout=120000)
            evidence = page.evaluate('''()=>new Promise(resolve=>requestAnimationFrame(()=>
                requestAnimationFrame(()=>resolve({lastSoftwareRenderAt:gameInstance.lastSoftwareRenderAt,
                    renderResumeAt:gameInstance.renderResumeAt,now:performance.now(),
                    scope:'Actual GameLoop render timestamp followed by two native RAF boundaries; no renderer replacement'}))))''')
            report.setdefault('nativeRenderReadiness', []).append(evidence)
            save()

        try:
            desktop = new_page({'width': 1440, 'height': 1000})
            current_page = desktop
            check('Declared runtime and all three public exports match source before browser flow',
                  lambda: verify_http(desktop.request, requested_paths.copy(), 'httpBefore'))
            check('Native boot without script or network substitution', lambda: boot(desktop))
            desktop.locator('#btn-open-alien-base-menu').click()
            desktop.wait_for_function('()=>window.AlienBaseReference?.listWorks().length===29', timeout=120000)
            def menu_library():
                state = library_state(desktop)
                require(state == {'records':494,'works':29,'rows':579,'egg':'bio.xenomorph.ovomorph',
                    'runner':'ha.bio.runner','offspring':'ha.bio.offspring','allMediaUncertified':True,'noCards':True}, str(state))
                return state
            check('Menu Archives expose 494 references and 29 explicitly uncertified works', menu_library)
            capture(desktop, '01-desktop-archives.png', 'Native public reference library, menu entry')
            def search_and_api():
                desktop.locator('#alien-base-filter').select_option('works')
                require(desktop.locator('#alien-base-list .ab-record').count() == 29, 'Media filter lost records')
                desktop.locator('#alien-base-filter').select_option('all')
                desktop.locator('#alien-base-search').fill('offspring')
                require(desktop.locator('#alien-base-list .ab-record').count() >= 2, 'Local Z-01 and shared reference cannot be distinguished')
                detail = desktop.evaluate('''() => {
                    const a=AlienBaseReference.getSharedRecord('xeno:ovomorph'),name=a.name;a.name='QA mutation attempt';
                    return {unchanged:AlienBaseReference.getSharedRecord('xeno:ovomorph').name===name,
                        local:AlienBaseReference.getCanonicalIdForCaste('offspring'),pathogen:AlienBaseReference.getSharedRecord('bio.pathogen.offspring')?.id};
                }''')
                require(detail['unchanged'] and detail['local']=='ha.bio.offspring' and detail['pathogen']=='bio.pathogen.offspring', str(detail))
                desktop.locator('#alien-base-search').fill('')
                return detail
            check('Search and real read-only API retain distinct Z-01/pathogen identities', search_and_api)
            def focus_trap():
                desktop.locator('#btn-close-alien-base').focus()
                require(focus_edges(desktop)['firstActive'], 'Close control is not the first native focus target')
                desktop.keyboard.press('Shift+Tab')
                require(focus_edges(desktop)['lastActive'], 'Shift+Tab escaped archive focus trap')
                desktop.keyboard.press('Tab')
                require(focus_edges(desktop)['firstActive'], 'Tab escaped archive focus trap')
                return focus_edges(desktop)
            check('Actual keyboard Tab/Shift+Tab remain inside the Archives modal', focus_trap)
            desktop.keyboard.press('Escape')
            require(desktop.locator('#alien-base-overlay').is_hidden(), 'Escape did not close menu Archives')
            require(desktop.evaluate('document.activeElement.id')=='btn-open-alien-base-menu', 'Menu focus not restored')
            check('Campaign begins through visible controls', lambda: start(desktop))
            def locked_codex():
                desktop.locator('#btn-open-codex').click()
                desktop.locator('.codex-entry.locked').first.click()
                require(desktop.locator('#codex-detail .ab-codex-link').count()==0, 'Locked Codex exposed a reference shortcut')
                require('OBSERVATION INCOMPLÈTE' in desktop.locator('#codex-detail').inner_text(), 'Locked dossier content leaked')
                desktop.keyboard.press('Escape')
                require(not desktop.evaluate('gameInstance.isSystemPaused'), 'Closing initial Codex failed to resume')
                return {'lockedShortcutAbsent':True,'initialPauseRestored':True}
            check('Locked Codex records do not reveal an Alien Base shortcut', locked_codex)
            desktop.evaluate('()=>HiveSystems.unlockCodex(["queen"])')
            def codex_round_trip():
                desktop.locator('#btn-open-codex').click()
                desktop.locator('.codex-tab[data-category="castes"]').click()
                desktop.locator('.codex-entry').filter(has_text=re.compile('^REINE$')).click()
                require(desktop.evaluate('gameInstance.isSystemPaused'), 'Codex did not pause gameplay')
                desktop.locator('#codex-detail .ab-codex-link').click()
                desktop.wait_for_function('()=>!document.getElementById("alien-base-overlay").hidden&&document.getElementById("alien-base-detail").textContent.includes("bio.xenomorph.queen")')
                require(desktop.locator('#alien-base-list .ab-record').count()==16, 'Codex shortcut did not open exact caste filter')
                desktop.locator('#alien-base-detail .ab-record-jump').click()
                require('bio.xenomorph.queen' in desktop.locator('#alien-base-detail').inner_text(), 'Common identity jump lost the Queen')
                capture(desktop, '02-queen-common-reference.png', 'Prepared Queen unlock, actual Codex → local dossier → shared identity')
                desktop.keyboard.press('Escape')
                require(desktop.locator('#codex-overlay').is_visible(), 'Returning from Archives lost Codex')
                require(desktop.locator('#codex-detail h3').inner_text()=='REINE', 'Returning from Archives rerendered another Codex entry')
                require(desktop.evaluate('document.activeElement.classList.contains("ab-codex-link")&&gameInstance.isSystemPaused'), 'Codex reference focus/pause lost')
                desktop.keyboard.press('Escape')
                require(not desktop.evaluate('gameInstance.isSystemPaused'), 'Closing restored Codex failed to resume')
                require(desktop.evaluate('document.activeElement.id')=='btn-open-codex', 'Closing restored Codex lost original HUD focus')
                return {'exactIdentity':'bio.xenomorph.queen','retainedCodex':'REINE','focusReturnedTo':'btn-open-codex','pauseRestored':False}
            check('Codex → exact reference → same Codex → HUD preserves both focus origins and pause', codex_round_trip)
            def prior_pause():
                desktop.evaluate('()=>gameInstance.setSystemPaused(true)')
                desktop.locator('#btn-open-alien-base-hud').click()
                desktop.keyboard.press('Escape')
                require(desktop.evaluate('gameInstance.isSystemPaused'), 'Archives unpaused a previously paused game')
                desktop.evaluate('()=>gameInstance.setSystemPaused(false)')
                return {'previouslyPausedRetained':True,'fixtureRestored':True}
            check('Closing HUD Archives does not resume a previously paused game', prior_pause)

            mobile = new_page({'width':390,'height':844}, mobile=True)
            current_page = mobile
            boot(mobile)
            start(mobile)
            def compact_drawer():
                mobile.wait_for_function('()=>document.getElementById("app-container").classList.contains("compact-hud")')
                toggle = mobile.locator('#btn-toggle-hud')
                require(toggle.get_attribute('aria-expanded')=='false', 'Compact HUD initially blocks the scene')
                require(mobile.locator('#hud-sidebar').evaluate('(n)=>n.inert'), 'Collapsed drawer remains interactive')
                before = mobile.evaluate('gameInstance.isSystemPaused')
                toggle.click()
                require(toggle.get_attribute('aria-expanded')=='true', 'Real mobile drawer control failed')
                require(not mobile.locator('#hud-sidebar').evaluate('(n)=>n.inert'), 'Open drawer remains inert')
                mobile.keyboard.press('Escape')
                require(toggle.get_attribute('aria-expanded')=='false', 'Escape did not close compact drawer')
                require(mobile.evaluate('document.activeElement.id')=='btn-toggle-hud', 'Drawer focus return lost')
                require(mobile.evaluate('gameInstance.isSystemPaused')==before, 'Drawer close altered pause state')
                return {'viewport':[390,844],'nativeTouchEmulation':True,'collapsedByDefault':True,'focus':'btn-toggle-hud'}
            check('390×844 native touch-emulated compact drawer opens and closes without a modal conflict', compact_drawer)
            wait_for_native_game_frame(mobile)
            capture(mobile, '03-mobile-hud.png', '390×844 touch emulation, compact HUD closed')
            def mobile_archive(label):
                mobile.locator('#btn-open-alien-base-hud').click()
                mobile.wait_for_function('()=>window.AlienBaseReference?.listWorks().length===29')
                state = library_state(mobile)
                require(state['records']==494 and state['works']==29, str(state))
                require(mobile.evaluate('gameInstance.isSystemPaused'), 'Mobile Archives left live gameplay behind the list')
                layout = visible_layout(mobile)
                w,h = layout['viewport']
                require(layout['scrollWidth']<=w+1, str(layout))
                require(layout['panel']['x']>=-1 and layout['panel']['right']<=w+1 and layout['panel']['y']>=-1 and layout['panel']['bottom']<=h+1, str(layout))
                require(layout['touch'] and layout['closeHeight']>=44, str(layout))
                capture(mobile, label, 'Native touch-emulated Archives, no horizontal overflow')
                mobile.keyboard.press('Escape')
                require(not mobile.evaluate('gameInstance.isSystemPaused'), 'Closing mobile Archives failed to resume')
                require(mobile.evaluate('document.activeElement.id')=='btn-open-alien-base-hud', 'Mobile Archives lost header focus')
                return layout
            check('390×844 Archives remain usable inside the viewport with a 44px close target',
                  lambda: mobile_archive('04-mobile-archives.png'))
            mobile.set_viewport_size({'width':844,'height':390})
            check('844×390 landscape Archives scroll internally without clipping the modal',
                  lambda: mobile_archive('05-landscape-archives.png'))
            check('All actually requested local resources still match source after native flow',
                  lambda: verify_http(desktop.request, requested_paths.copy(), 'httpAfter'))
            require(not report['errors'], str(report['errors']))
            require(not report['consoleErrors'], str(report['consoleErrors']))
            require(not report['failedAssets'], str(report['failedAssets']))
            require(not report['foreignRequests'], str(report['foreignRequests']))
            report['sourceAfter'] = inventory()
            require(report['sourceBefore']==report['sourceAfter'], 'Runtime source changed during native library cohort')
            require(report['harnessSha256']==sha(Path(__file__).read_bytes()), 'Native harness changed during cohort')
            report['complete'] = True
            save()
        except Exception as error:
            report['failure'] = str(error)
            if current_page:
                try:
                    capture(current_page, 'failure.png', 'Failed boundary retained; not accepted QA')
                except Exception as capture_error:
                    report['failureCaptureError'] = str(capture_error)
            save()
            raise
        finally:
            for context in contexts:
                context.close()
            browser.close()
            save()


if __name__ == '__main__':
    main()
