#!/usr/bin/env python3
"""Native menu-card input/layout checks on unchanged HTTP sources.

These are automated UI/keyboard/touch-size diagnostics, not human playtesting,
cinema fidelity or a performance benchmark. No request interception is used.
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright
from qa_boot_flow import open_campaign_menu


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', default='http://127.0.0.1:8098/')
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    root, out = Path(__file__).resolve().parents[1], Path(args.output).resolve()
    if out.exists():
        raise SystemExit('Refusing to overwrite prior evidence')
    out.mkdir(parents=True)
    digest = lambda value: hashlib.sha256(value).hexdigest()

    def inventory():
        files = [*root.joinpath('src').rglob('*'), *root.joinpath('data').glob('*.json'), root / 'index.html', root / 'vercel.json']
        return {str(path.relative_to(root)): digest(path.read_bytes()) for path in sorted(files) if path.is_file()}

    report = dict(scope=__doc__, url=args.url, complete=False, passed=False,
                  sourceBefore=inventory(), sourceAfter=None,
                  harnessSha256=digest(Path(__file__).read_bytes()), checks=[], captures=[],
                  assets={}, pageErrors=[], consoleErrors=[], failedRequests=[], httpFailures=[], observationErrors=[])

    def save():
        (out / 'results.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')

    def require(value, message):
        if not value:
            raise AssertionError(message)

    def check(name, run):
        detail = run()
        report['checks'].append(dict(name=name, passed=True, detail=detail))
        save()
        print('PASS', name, flush=True)
        return detail

    base = urlparse(args.url)

    def local_url(url):
        parsed = urlparse(url)
        return (parsed.scheme, parsed.netloc) == (base.scheme, base.netloc)

    def watch(page):
        page.on('pageerror', lambda error: report['pageErrors'].append(str(error)))
        page.on('console', lambda message: report['consoleErrors'].append(message.text) if message.type == 'error' else None)
        page.on('requestfailed', lambda request: report['failedRequests'].append(dict(url=request.url, failure=request.failure)))

        def response_seen(response):
            if not local_url(response.url):
                return
            if response.status >= 400:
                report['httpFailures'].append(dict(url=response.url, status=response.status))
            if response.status != 200:
                return
            name = urlparse(response.url).path.lstrip('/') or 'index.html'
            local = root / name
            if not local.is_file():
                report['observationErrors'].append('No exact local file for ' + name)
                return
            try:
                content = response.body()
                actual, expected = digest(content), digest(local.read_bytes())
                report['assets'][name] = dict(bytes=len(content), sha256=actual, expected=expected, match=actual == expected)
            except Exception as error:
                report['observationErrors'].append(name + ': ' + str(error))
        page.on('response', response_seen)

    def boot(page, *, touch=False):
        watch(page)
        page.goto(args.url, wait_until='domcontentloaded')
        page.wait_for_function('()=>!!(window.gameInstance&&window.HiveSystems?.ui?.game&&document.getElementById("btn-open-alien-base-menu"))', timeout=120000)
        open_campaign_menu(page, touch=touch)
        require(page.locator('#boot-screen').is_visible(), 'Boot menu is not visible')

    def states(page):
        return page.evaluate('''()=>({difficulty:document.getElementById('difficulty-select').value,
          origin:document.getElementById('origin-select').value,
          groups:[...document.querySelectorAll('.difficulty-grid,.origin-grid')].map(group=>({
            selected:[...group.querySelectorAll('[aria-checked="true"]')].map(card=>card.dataset.difficulty||card.dataset.origin),
            tabbable:[...group.querySelectorAll('[tabindex="0"]')].map(card=>card.dataset.difficulty||card.dataset.origin)}))})''')

    def geometry(page):
        value = page.evaluate('''()=>{
          const boot=document.getElementById('boot-screen'),heading=document.getElementById('boot-title');
          const elements=[...document.querySelectorAll('.diff-card,.origin-card')];
          return {viewport:{width:innerWidth,height:innerHeight},documentWidth:document.documentElement.scrollWidth,
            bodyWidth:document.body.scrollWidth,boot:{width:boot.clientWidth,scrollWidth:boot.scrollWidth,scrollTop:boot.scrollTop},
            heading:{top:heading.getBoundingClientRect().top,bottom:heading.getBoundingClientRect().bottom},
            cards:elements.map(card=>{const r=card.getBoundingClientRect();return {id:card.dataset.origin||card.dataset.difficulty,
              left:r.left,right:r.right,width:r.width,height:r.height,role:card.getAttribute('role'),label:document.getElementById(card.getAttribute('aria-labelledby'))?.textContent};})};
        }''')
        width = value['viewport']['width']
        require(max(value['documentWidth'], value['bodyWidth']) <= width + 1, 'Horizontal document overflow: ' + str(value))
        require(value['boot']['scrollWidth'] <= value['boot']['width'] + 1, 'Horizontal boot overflow: ' + str(value))
        require(all(card['width'] >= 44 and card['height'] >= 44 and card['label'] for card in value['cards']), 'Unnamed or undersized radio card')
        require(all(card['left'] >= -1 and card['right'] <= width + 1 for card in value['cards']), 'Card outside viewport width')
        return value

    def capture(page, filename, label):
        path = out / filename
        page.screenshot(path=str(path), timeout=120000)
        report['captures'].append(dict(file=filename, label=label, bytes=path.stat().st_size, sha256=digest(path.read_bytes())))
        save()

    def touch_target(page, button_id):
        button = page.locator('#' + button_id)
        button.scroll_into_view_if_needed()
        bounds = button.bounding_box()
        viewport = page.viewport_size
        require(bounds and bounds['width'] >= 44 and bounds['height'] >= 44,
                f'{button_id} is smaller than 44×44 CSS pixels: {bounds}')
        require(bounds['x'] >= -1 and bounds['x'] + bounds['width'] <= viewport['width'] + 1
                and bounds['y'] >= -1 and bounds['y'] + bounds['height'] <= viewport['height'] + 1,
                f'{button_id} is clipped after scrolling: {bounds}')
        return bounds

    contexts = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=shutil.which('chromium'), headless=True,
            args=['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-angle=swiftshader'])
        page = None
        try:
            save()
            context = browser.new_context(viewport=dict(width=1440, height=900))
            contexts.append(context)
            page = context.new_page()
            boot(page)

            def initial():
                value = geometry(page)
                require(value['heading']['top'] >= 0 and value['heading']['bottom'] <= 900, 'Tall desktop menu clipped its first heading')
                state = states(page)
                require(state['groups'] == [dict(selected=['survivor'], tabbable=['survivor']), dict(selected=['random'], tabbable=['random'])], 'Initial native radio state mismatch')
                return dict(geometry=value, state=state)
            check('Desktop menu begins at an accessible heading with two radio-group tab stops', initial)
            capture(page, '01-desktop-menu.png', 'Actual boot menu top; illustrative SVG cards, no diagnostic camera')

            def click_cards():
                observations = []
                for key, values, selector in [('difficulty', ['story', 'survivor', 'nightmare'], '.diff-card'),
                                              ('origin', ['random', 'juggernaut', 'hive', 'colony', 'starship'], '.origin-card')]:
                    for value in values:
                        card = page.locator(selector + '[data-' + key + '="' + value + '"]')
                        card.click()
                        state = states(page)
                        require(state[key] == value and card.get_attribute('aria-checked') == 'true', 'Visible click did not reach campaign select: ' + key + '=' + value)
                        require(card.evaluate('(card)=>document.activeElement===card'), 'Click focus missing')
                        require(all(len(group['selected']) == len(group['tabbable']) == 1 for group in state['groups']), 'Multiple selected/tabbable cards')
                        observations.append(dict(key=key, value=value, state=state))
                return observations
            check('All eight visible card clicks synchronize real campaign controls and focus', click_cards)

            def keyboard():
                card = page.locator('.origin-card[data-origin="starship"]')
                card.focus()
                page.keyboard.press('ArrowRight')
                require(states(page)['origin'] == 'random', 'Arrow wrap failed')
                page.keyboard.press('End')
                require(states(page)['origin'] == 'starship', 'End failed')
                page.keyboard.press('Home')
                require(states(page)['origin'] == 'random', 'Home failed')
                page.keyboard.press('ArrowDown')
                require(states(page)['origin'] == 'juggernaut', 'Down failed')
                page.keyboard.press('Space')
                require(states(page)['origin'] == 'juggernaut', 'Space changed selected value unexpectedly')
                page.keyboard.press('ArrowUp')
                require(states(page)['origin'] == 'random', 'Up failed')
                page.locator('.diff-card[data-difficulty="nightmare"]').focus()
                page.keyboard.press('Home')
                require(states(page)['difficulty'] == 'story', 'Difficulty Home failed')
                page.keyboard.press('ArrowLeft')
                require(states(page)['difficulty'] == 'nightmare', 'Difficulty left wrap failed')
                page.keyboard.press('Enter')
                require(states(page)['difficulty'] == 'nightmare', 'Enter failed')
                return states(page)
            check('Real keyboard arrows/Home/End/Space/Enter share the visible selection contract', keyboard)

            def archives():
                page.locator('#btn-open-alien-base-menu').click()
                page.wait_for_function('()=>!!window.AlienBaseReference&&!document.getElementById("alien-base-overlay").hidden')
                require(page.evaluate('AlienBaseReference.listSharedRecords().length') == 494, 'Archives references missing')
                page.keyboard.press('Escape')
                require(page.locator('#alien-base-overlay').is_hidden(), 'Archives Escape failed')
                require(page.evaluate('document.activeElement.id') == 'btn-open-alien-base-menu', 'Archives did not restore menu focus')
                return states(page)
            check('Archives still open from the expanded card menu and restore focus without changing choices', archives)

            def launch():
                page.locator('.origin-card[data-origin="starship"]').click()
                page.locator('.diff-card[data-difficulty="nightmare"]').click()
                page.locator('#btn-new-campaign').click()
                page.locator('#btn-start-act-one').click()
                page.wait_for_function('()=>gameInstance.campaignActive&&!gameInstance.isSystemPaused', timeout=120000)
                value = page.evaluate('()=>({config:{...gameInstance.campaignConfig},origin:gameInstance.activeOrigin?.id,stage:gameInstance.currentStageIndex})')
                require(value['config']['difficulty'] == 'nightmare' and value['origin'] == 'starship' and value['stage'] == 1, 'Campaign started with values other than visible choices')
                return value
            check('Visible selected cards launch Act I with the actual difficulty and origin', launch)
            # Do not leave a live WebGL campaign competing with later viewport
            # checks. Closing this isolated context is test cleanup, not a game
            # pause bypass or a substituted scene.
            context.close()
            contexts.remove(context)
            page = None

            for label, width, height in [('portrait', 390, 844), ('landscape', 844, 390), ('narrow', 320, 568)]:
                context = browser.new_context(viewport=dict(width=width, height=height), has_touch=True, is_mobile=True)
                contexts.append(context)
                page = context.new_page()
                boot(page, touch=True)

                def compact():
                    initial = geometry(page)
                    require(initial['heading']['top'] >= 0 and initial['heading']['bottom'] <= height, 'Compact heading clipped')
                    page.locator('.origin-card[data-origin="hive"]').tap()
                    require(states(page)['origin'] == 'hive', 'Touch selection did not update actual origin')
                    page.locator('.diff-card[data-difficulty="story"]').tap()
                    require(states(page)['difficulty'] == 'story', 'Touch selection did not update actual difficulty')
                    final = geometry(page)
                    actions = {button_id: touch_target(page, button_id) for button_id in (
                        'btn-new-campaign', 'btn-continue-campaign', 'btn-open-codex-menu',
                        'btn-open-alien-base-menu')}
                    require(page.locator('#btn-continue-campaign').is_disabled(), 'Empty saves must not enable Continue')
                    return dict(initial=initial, final=final, selected=states(page), actions=actions)
                check(label + ' menu responds to touch and all four actions fit 44×44 CSS pixels', compact)
                capture(page, '02-' + label + '-menu-actions.png', 'Actual touch menu scrolled to campaign actions at ' + str(width) + '×' + str(height))

                def touch_panels_and_prologue():
                    panels = {}
                    for opener, overlay, closer in [
                        ('btn-open-codex-menu', 'codex-overlay', 'btn-close-codex'),
                        ('btn-open-alien-base-menu', 'alien-base-overlay', 'btn-close-alien-base'),
                    ]:
                        page.locator('#' + opener).tap()
                        page.locator('#' + overlay).wait_for(state='visible')
                        panels[closer] = touch_target(page, closer)
                        page.locator('#' + closer).tap()
                        page.locator('#' + overlay).wait_for(state='hidden')
                        require(states(page)['origin'] == 'hive' and states(page)['difficulty'] == 'story',
                                'Closing a touch panel changed campaign choices')
                    page.locator('#btn-new-campaign').tap()
                    page.locator('#prologue-screen').wait_for(state='visible')
                    start_rect = touch_target(page, 'btn-start-act-one')
                    return dict(panels=panels, startActOne=start_rect)
                check(label + ' opens and closes both reference panels and reaches the prologue by touch', touch_panels_and_prologue)

                if label == 'landscape':
                    def touch_launch():
                        page.locator('#btn-start-act-one').tap()
                        page.wait_for_function('()=>gameInstance.campaignActive&&!gameInstance.isSystemPaused', timeout=120000)
                        value = page.evaluate('()=>({difficulty:gameInstance.campaignConfig.difficulty,origin:gameInstance.activeOrigin?.id,stage:gameInstance.currentStageIndex})')
                        require(value == dict(difficulty='story', origin='hive', stage=1), 'Touch campaign started with different choices')
                        return value
                    check('Landscape touch launches Act I with the selected origin and difficulty', touch_launch)
                context.close()
                contexts.remove(context)
                page = None

            require(not report['pageErrors'] and not report['consoleErrors'] and not report['failedRequests'] and not report['httpFailures'] and not report['observationErrors'], 'Runtime/HTTP observation errors recorded')
            require(report['assets'] and all(value['match'] for value in report['assets'].values()), 'Served resources differ from exact local candidate')
            for required in ['index.html', 'src/game.js', 'src/game-systems.js', 'src/models.js', 'src/css/style.css']:
                require(required in report['assets'], 'Missing served-source observation: ' + required)
            report['complete'] = True
        except Exception as error:
            report['failure'] = str(error)
            if page:
                try:
                    capture(page, 'failure.png', 'Retained failed attempt; not accepted evidence')
                except Exception as capture_error:
                    report['failureCaptureError'] = str(capture_error)
            save()
            raise
        finally:
            for context in contexts:
                context.close()
            browser.close()
            report['sourceAfter'] = inventory()
            report['sourceStable'] = report['sourceBefore'] == report['sourceAfter']
            report['passed'] = bool(report['complete'] and report['sourceStable'] and not report.get('failure'))
            save()
    require(report['passed'], 'Sources changed during native menu checks')
    print(json.dumps(dict(passed=True, checks=len(report['checks']), assets=len(report['assets']), sourceStable=True)))


if __name__ == '__main__':
    main()
