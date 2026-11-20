#!/usr/bin/env python3
"""Prepared native M40 simulation, DOM input, VFX and PCM diagnostics.

The only script instrumentation exports existing internals; production logic is
not replaced. Positions/cooldowns and focused fixed steps are labelled fixtures.
Do not interpret screenshots or test assertions as human QA or film fidelity.
"""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import shutil
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright
from qa_boot_flow import open_campaign_menu


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', required=True)
    parser.add_argument('--source-root', default=str(Path(__file__).resolve().parents[1]))
    parser.add_argument('--output', required=True)
    parser.add_argument('--skip-audio', action='store_true')
    args = parser.parse_args()
    root, out = Path(args.source_root).resolve(), Path(args.output).resolve()
    if out.exists():
        raise SystemExit('Refusing to overwrite earlier native evidence: ' + str(out))
    out.mkdir(parents=True)
    digest = lambda value: hashlib.sha256(value).hexdigest()
    paths = sorted([*root.joinpath('src').rglob('*.js'), root / 'src/css/style.css', root / 'index.html'])
    frozen = {str(path.relative_to(root)): digest(path.read_bytes()) for path in paths}
    report = dict(scope=__doc__, complete=False, url=args.url, sourceBefore=frozen,
                  sourceAfter=None, sources={}, assets={}, checks=[], captures=[], errors=[], console_errors=[], failed_assets=[])
    probe_path = root / 'tools/qa-mortar-native-probe.js'
    report['harness'] = {str(path.relative_to(root)): digest(path.read_bytes())
                         for path in [Path(__file__).resolve(), probe_path, root / 'tools/qa-audio-boot.cjs']}

    def save():
        (out / 'results.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=shutil.which('chromium'), headless=True,
            args=['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-angle=swiftshader'])
        page = browser.new_page(viewport={'width': 1440, 'height': 1000}, reduced_motion='no-preference')
        page.on('pageerror', lambda error: report['errors'].append(str(error)))
        page.on('console', lambda message: report['console_errors'].append(message.text) if message.type == 'error' else None)
        def observe_response(response):
            url = urlparse(response.url)
            if url.netloc != urlparse(args.url).netloc:
                return
            if response.status >= 400:
                report['failed_assets'].append(f'{response.status} {response.url}')
            relative = url.path.lstrip('/') or 'index.html'
            local = root / relative
            if response.status == 200 and (relative.startswith('assets/') or relative.endswith('.css') or relative == 'index.html'):
                value = response.body()
                expected = digest(local.read_bytes()) if local.is_file() else None
                report['assets'][url.path] = {'sha256': digest(value), 'bytes': len(value),
                                             'expected': expected, 'match': expected == digest(value)}

        page.on('response', observe_response)

        def expose(route):
            response = route.fetch()
            source, path = response.text(), urlparse(response.url).path
            report['sources'][path] = digest(source.encode())
            assert digest(source.encode()) == digest((root / path.lstrip('/')).read_bytes()), path
            if path.endswith('/game.js'):
                end = source.rfind('})();')
                assert end >= 0
                source = source[:end] + 'window.__mortarQA={stationMap,playerCreature,inputManager,audioManager,rendererEngine};\n' + source[end:]
            route.fulfill(response=response, body=source)

        page.route('**/src/*.js*', expose)

        def check(name, body):
            value = page.evaluate('''()=>{const f=__mortarNative,q=__mortarQA,g=gameInstance,
                p=q.playerCreature,map=q.stationMap,vfx=HiveSystems.vfx;
            ''' + body + '}')
            report['checks'].append({'name': name, 'passed': True, 'detail': value})
            save()
            print('PASS', name, flush=True)
            return value

        def prepare(reduced=False):
            value = page.evaluate('(reduced)=>__mortarNative.prepare({reduced})', reduced)
            report.setdefault('fixtures', []).append(value)
            save()
            return value

        def capture(file, label):
            value = page.evaluate('(label)=>__mortarNative.draw(label)', label)
            page.screenshot(path=str(out / file), timeout=120000)
            report['captures'].append({'file': file, **value})
            save()

        try:
            page.goto(args.url, wait_until='domcontentloaded')
            page.wait_for_function('()=>!!(window.__mortarQA&&window.HiveSystems?.ui?.game)', timeout=120000)
            open_campaign_menu(page)
            page.locator('#btn-new-campaign').click()
            page.locator('#btn-start-act-one').click()
            page.evaluate('()=>gameInstance.setSystemPaused(true)')
            report['probe'] = page.evaluate(probe_path.read_text())
            prepare()
            check('Actual authored mortar launches one timed shot and a radius-matched warning', 'return f.launch();')
            check('Native shot is harmless during physical flight', '''
                const before=f.snapshot();f.step(.25);const after=f.snapshot();
                f.require(p.health===1000&&f.damage.length===0&&after.remaining>0,'Native flight hit early');
                f.require(after.warning?.shellPosition[1]>.12&&after.warning.shellPosition[1]<6.12,'Shell arc outside visible station volume');
                return {before,after};
            ''')
            capture('01-m40-flight.png', '0,25 s — cible fixe et obus en vol, aucun dégât')
            check('Real pause control freezes pending shot VFX damage and new SFX', 'return f.pauseViaButton();')
            before_wait = page.evaluate('()=>__mortarNative.snapshot()')
            page.wait_for_timeout(800)
            after_wait = page.evaluate('()=>__mortarNative.snapshot()')
            assert before_wait == after_wait, {'before': before_wait, 'after': after_wait}
            report['checks'].append({'name': 'Wall-clock delay beyond old650ms cannot trigger a paused impact',
                                     'passed': True, 'detail': after_wait})
            save()
            check('Real resume control preserves pending ownership', 'return f.resumeViaButton();')
            check('Native simulation applies one authored48PV impact at0.65s only', '''
                f.step(.39);f.require(p.health===1000&&f.damage.length===0,'Native deadline hit before0.65s');
                f.step(.02);const hit=f.snapshot();
                f.require(p.health===952&&f.damage.length===1&&f.damage[0].amount===48,'Native impact not exactly48 once');
                f.require(!f.pm.pendingShot&&!f.warning(),'Impact retained an owned warning or pending shot');
                f.step(.8);f.require(f.damage.length===1&&p.health===952,'One shell impacted twice');return hit;
            ''')
            capture('02-m40-after-impact.png', 'Impact unique — 48 PV, avertissement nettoyé')
            prepare()
            check('Keyboard dodge traverses real collision-free floor and escapes the fixed aim', '''
                f.launch();return f.dodge();
            ''')
            capture('03-m40-keyboard-dodge.png', 'Entrée clavier réelle — esquive hors du rayon figé')
            prepare()
            check('A launched shell persists after launcher destruction but no new shell launches', '''
                f.launch();f.active(()=>map.destroyPortableMortar(f.pm,80));
                f.require(f.pm.isDestroyed&&f.pm.pendingShot,'Destroying launcher erased in-flight shell');
                f.step(.7);f.require(p.health===952&&f.damage.length===1,'Destroyed launcher shell failed its authored impact');
                f.step(6);f.require(f.audio.length===1&&f.damage.length===1&&!f.pm.pendingShot,'Destroyed launcher fired again');
                return f.snapshot();
            ''')
            prepare()
            check('Replacing the actual campaign stage cancels stale ownership without hitting the new actor', '''
                f.launch();const old=f.pm,shot=f.shot;
                g.startCampaign(3);g.setSystemPaused(true);g.clearHumans();
                for(const mortar of map.portableMortars||[])mortar.shootCooldown=999;
                const health=p.health;f.active(()=>map.updatePortableMortars(.1));
                f.require(p.health===health&&f.damage.length===0,'Old mortar hit the next stage');
                f.require(!old.pendingShot&&!vfx.effects.some(effect=>effect.mortarWarning),'Stale stage retained owned shot/warning');
                return {oldRemaining:shot.remaining,newHealth:p.health,stage:g.currentStageIndex};
            ''')
            prepare(reduced=True)
            check('Reduced motion preserves the static warning and no premature impact', '''
                const launch=f.launch();
                f.require(launch.warning.visible&&launch.warning.shellVisible===false,'Reduced mode lost warning or retained moving shell');
                f.step(.25);const middle=f.snapshot();
                f.require(p.health===1000&&middle.warning.visible,'Reduced motion caused early impact or lost warning');
                f.require(JSON.stringify(middle.warning.markerScale)===JSON.stringify(launch.warning.markerScale),'Reduced warning expanded/pulsed');
                return {launch,middle};
            ''')
            capture('04-m40-reduced-motion.png', 'Mouvements réduits — avertissement statique avant impact')
            check('Reduced motion preserves the full simulation fuse and exactly one impact', '''
                f.step(.41);f.require(p.health===952&&f.damage.length===1,'Reduced mode changed damage/fuse');
                f.require(f.damage[0].amount===48&&!f.warning(),'Reduced impact amount/cleanup changed');
                return f.snapshot();
            ''')
            if not args.skip_audio:
                # Names/radii follow qa-audio-boot.cjs; each render is saved before
                # the next case so a later failure cannot erase earlier evidence.
                audio_methods = [('playMortarLaunchAndShrapnel', 110),
                                 ('playCameraServoPan', 14), ('playCameraAlertBeep', 22),
                                 ('playTurretSwivel', 18), ('playTurretLock', 20),
                                 ('playTerminalKeyboardClick', 10), ('playHighVoltageHum', 16),
                                 ('playHydraulicServo', 15), ('playAutomatonFootstep', 16),
                                 ('playSyntheticFluidLeak', 14),
                                 ('playBrineEvaporatorSteamHiss', 58),
                                 ('playGeothermalWellheadPressureRelief', 58),
                                 ('playXenoGutturalBreathing', 35),
                                 ('playHighFrequencyElectricArc', 38),
                                 ('playCavernousHullCreak', 75),
                                 ('playSyntheticCalmChime', 30),
                                 ('playMaterialFootstep:metal', 48),
                                 ('playMaterialFootstep:water', 42),
                                 ('playMaterialFootstep:resin', 38)]
                report['audio'] = {'scope': 'Native OfflineAudioContext renders: repaired and merged AudioManager methods, active/muted/zero-volume each. Material variants are separate. Real shared connect routing and void API; PCM diagnostics, not listening QA. Machinery methods tested here are not claimed to be bound to new interactions.',
                                   'expectedCases': len(audio_methods) * 3, 'results': []}
                for method, radius in audio_methods:
                    for mode in ['active', 'muted', 'zero-volume']:
                        report['audio']['currentCase'] = {'method': method, 'mode': mode}
                        save()
                        audio_case = page.evaluate('''async({method,mode,expectedRadius})=>{
                    const originalManager=window.audioManager,originalContext=window.AudioContext,
                        Original=__mortarQA.audioManager.constructor;
                    try{
                            const context=new OfflineAudioContext(2,48000*3.2,48000),audio=new Original();
                            const [methodName,surface]=method.split(':');
                            if(typeof audio[methodName]!=='function')throw Error('Actual AudioManager method missing: '+method);
                            // Initialize zero-volume at zero, not during the intentional
                            // 30ms smoothing ramp of an already audible master gain.
                            if(mode==='zero-volume')audio.setVolume(0);
                            try{window.AudioContext=function(){return context;};audio.init();}finally{window.AudioContext=originalContext;}
                            audio.resume=()=>{};
                            if(mode==='muted')audio.isMuted=true;
                            if(mode==='zero-volume')audio.setVolume(0);
                            const routingCalls=[],connect=audio.connect,
                                x=__mortarQA.playerCreature.x,z=__mortarQA.playerCreature.z;
                            audio.connect=function(node,px,pz,range){routingCalls.push({x:px,z:pz,radius:range});return connect.call(this,node,px,pz,range);};
                            const raw=surface ? audio[methodName](surface,x,z,true,false) : audio[methodName](x,z);
                            const buffer=await context.startRendering(),connections=routingCalls.length;
                            if(raw!==undefined)throw Error('Legacy native sound API is not void: '+method);
                            let peak=0,energy=0;for(let channel=0;channel<buffer.numberOfChannels;channel++)for(const sample of buffer.getChannelData(channel)){
                                if(!Number.isFinite(sample))throw Error('Nonfinite native PCM: '+method);peak=Math.max(peak,Math.abs(sample));energy+=sample*sample;
                            }
                            if(mode==='active'?(peak<1e-6||peak>=1||connections<1):peak!==0)throw Error('Native PCM/guard failure '+JSON.stringify({method,mode,peak,connections}));
                            if(mode==='muted'&&connections!==0)throw Error('Muted native sound allocated connections: '+method);
                            if(mode!=='muted'&&(connections<1||routingCalls.some(call=>call.x!==x||call.z!==z||call.radius!==expectedRadius)))
                                throw Error('Native shared routing/coordinates/radius changed: '+JSON.stringify({method,routingCalls,expectedRadius}));
                            const pcm=new Float32Array(buffer.length*buffer.numberOfChannels);
                            for(let frame=0;frame<buffer.length;frame++)for(let channel=0;channel<buffer.numberOfChannels;channel++)
                                pcm[frame*buffer.numberOfChannels+channel]=buffer.getChannelData(channel)[frame];
                            const bytes=new Uint8Array(pcm.buffer);let binary='';
                            for(let offset=0;offset<bytes.length;offset+=8192)binary+=String.fromCharCode(...bytes.subarray(offset,offset+8192));
                            return {method,mode,peak,rms:Math.sqrt(energy/(buffer.length*buffer.numberOfChannels)),connections,routingCalls,
                                sampleRate:buffer.sampleRate,channels:buffer.numberOfChannels,frames:buffer.length,pcmBase64:btoa(binary),
                                rawReturn:'undefined (legacy void API)',
                                scope:'Actual AudioManager method and shared routing, real OfflineAudioContext PCM; not listening QA'};
                    }finally{window.audioManager=originalManager;window.AudioContext=originalContext;}
                }''', {'method': method, 'mode': mode, 'expectedRadius': radius})
                        pcm = base64.b64decode(audio_case.pop('pcmBase64'), validate=True)
                        name = method + '-' + mode + '-stereo-f32le.pcm'
                        (out / name).write_bytes(pcm)
                        audio_case['artifact'] = {'file': name, 'sha256': digest(pcm), 'bytes': len(pcm),
                                                  'encoding': 'interleaved stereo Float32 little-endian PCM'}
                        report['audio']['results'].append(audio_case)
                        save()
                        print('PASS PCM', method, mode, flush=True)
                report['audio'].pop('currentCase')
                assert len(report['audio']['results']) == report['audio']['expectedCases']
                save()
            assert not report['errors'], report['errors']
            assert not report['console_errors'], report['console_errors']
            assert not report['failed_assets'], report['failed_assets']
            assert all(value['match'] for value in report['assets'].values()), report['assets']
            report['sourceAfter'] = {str(path.relative_to(root)): digest(path.read_bytes()) for path in paths}
            assert report['sourceBefore'] == report['sourceAfter'], 'Runtime changed during native cohort'
            report['complete'] = True
            save()
        except Exception as error:
            report['failure'] = str(error)
            try:
                report['failureSnapshot'] = page.evaluate('()=>window.__mortarNative?.snapshot()')
            except Exception:
                pass
            save()
            raise
        finally:
            try:
                page.evaluate('()=>window.__mortarNative?.cleanup()')
            finally:
                browser.close()
                save()


if __name__ == '__main__':
    main()
