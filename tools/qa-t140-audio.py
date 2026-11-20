#!/usr/bin/env python3
"""Record native Web Audio PCM produced by T and Q in a prepared T140 capture.

The same AudioManager builds its graph on a native OfflineAudioContext. Fixed
subsystem steps and offline rendering measure timing and signal independently
of the browser's playback device or the render frame rate.
"""
import argparse
import base64
from datetime import datetime, timedelta, timezone
import hashlib
import json
from pathlib import Path
import shutil
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright
from qa_boot_flow import open_campaign_menu


MARKERS = {'windup': .2, 'pause': .8, 'contact': 1.35, 'hold': 2, 'release': 2.6, 'landing': 3.5}
PHASES = ['WINDUP', 'CONTACT', 'RELEASE', 'LANDING']


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', required=True)
    parser.add_argument('--source-root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--baseline', action='store_true')
    args = parser.parse_args()
    root = args.source_root.resolve()
    args.output.mkdir(parents=True, exist_ok=False)

    def digest(data):
        return hashlib.sha256(data).hexdigest()

    probe = root / 'tools/qa-creature-native-probe.js'
    tracked = ['index.html', 'tools/qa-creature-native-probe.js']
    tracked.extend(str(path.relative_to(root)) for path in sorted((root / 'src').rglob('*')) if path.is_file())

    def inventory():
        return {name: digest((root / name).read_bytes()) for name in tracked}

    report = {'scope': __doc__, 'complete': False, 'baseline': args.baseline, 'url': args.url,
              'harnessSha256': digest(Path(__file__).read_bytes()),
              'before': inventory(), 'served': {}, 'cases': [], 'pageErrors': [], 'consoleErrors': [], 'httpFailures': []}

    def save():
        (args.output / 'results.json').write_text(json.dumps(report, indent=2) + '\n')

    save()
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=shutil.which('chromium'), headless=True,
            args=['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-angle=swiftshader'])
        page = browser.new_page(viewport={'width': 1260, 'height': 900})
        page.on('pageerror', lambda error: report['pageErrors'].append(str(error)))
        page.on('console', lambda message: report['consoleErrors'].append(message.text) if message.type == 'error' else None)
        page.on('response', lambda response: report['httpFailures'].append([response.status, response.url]) if response.status >= 400 else None)

        def expose(route):
            response = route.fetch()
            name = urlparse(response.url).path.lstrip('/') or 'index.html'
            content = response.body()
            observed = digest(content)
            assert observed == report['before'][name], name
            report['served'][name] = observed
            if name == 'src/game.js':
                end = content.rindex(b'})();')
                content = content[:end] + b'window.__creatureQA={stationMap,playerCreature,HumanAI,rendererEngine,inputManager,audioManager};\n' + content[end:]
            route.fulfill(response=response, body=content)

        page.route('**/src/*.js*', expose)
        page.route(args.url, expose)

        def press(key):
            page.evaluate('()=>{gameInstance.setSystemPaused(false);__creatureQA.inputManager.canvas.focus();}')
            page.keyboard.press(key)
            page.evaluate('()=>gameInstance.setSystemPaused(true)')

        def render_case(mode):
            prepared_start = {'x': -60, 'z': 15} if mode == 'blocked' else None
            hp = 100 if mode == 'lethal' else 300
            page.evaluate('(start)=>__creatureNative.findSupport(start)', prepared_start)
            press('q')
            page.evaluate('(hp)=>{const f=__creatureNative;f.until("HANG");f.makeVictim(hp);f.q.rendererEngine.snapCameraTarget(f.p.x,f.p.z);}', hp)
            page.evaluate('''({mode,markers})=>{
              const f=__creatureNative,a=f.q.audioManager,g=f.g;
              g.setReducedMotion(mode==='reduced');a.stopAmbience();
              const nativeContext=window.AudioContext,context=new OfflineAudioContext(2,48000*4.5,48000);
              const original={...a};const fresh=new a.constructor();
              const initialVolume=mode==='zero'?0:.7;
              fresh.setVolume(initialVolume);
              try { window.AudioContext=function(){return context;};fresh.init(); }
              finally { window.AudioContext=nativeContext;window.audioManager=a; }
              Object.assign(a,fresh);
              a.resume=()=>{};
              if(mode==='muted')g.toggleAudio();
              g.setMasterVolume(initialVolume);
              const events=[],windows={},keys=[];
              const observeKey=event=>{if(event.isTrusted&&['q','t'].includes(event.key))keys.push(event.key);};
              window.addEventListener('keydown',observeKey);
              let currentEvent=null;
              const connect=a.connect;
              a.connect=function(node,x,z,radius){
                if(currentEvent)currentEvent.routes.push({x,z,radius});
                return connect.call(this,node,x,z,radius);
              };
              for(const method of ['playCeilingCaptureCue','playTailWhip','playWetImpact']){
                if(typeof a[method]!=='function')continue;
                const nativeMethod=a[method];
                a[method]=function(...args){
                  const [phase,x,z]=method==='playCeilingCaptureCue'?args:[null,...args];
                  const data={method,phase,x,z,time:context.currentTime,state:f.p.ceilingAction?.phase??null,routes:[]};
                  events.push(data);currentEvent=data;
                  try{return nativeMethod.apply(this,args);}finally{currentEvent=null;}
                };
              }
              const suspends=Object.fromEntries(Object.entries(markers).map(([name,at])=>[name,context.suspend(at)]));
              const audio=window.__captureAudio={events,windows,keys,listener:{x:f.q.rendererEngine.camera.position.x,z:f.p.z},
                reduced:f.q.rendererEngine.reduceMotion,ready:async name=>{await suspends[name];windows[name]=context.currentTime;},
                resume:()=>context.resume(),rendering:context.startRendering(),cleanup:()=>{
                  for(const name of Object.keys(a))delete a[name];Object.assign(a,original);
                  window.removeEventListener('keydown',observeKey);
                }};
            }''', {'mode': mode, 'markers': MARKERS})

            def at(marker):
                page.evaluate('(name)=>__captureAudio.ready(name)', marker)

            def resume():
                page.evaluate('()=>__captureAudio.resume()')

            at('windup')
            press('t')
            page.evaluate('''()=>{
              const f=__creatureNative;f.need(f.p.ceilingAction?.phase==='WINDUP'&&f.hits.length===0,'T bypassed windup');
              f.ticks(18);f.need(f.p.ceilingAction?.phase==='WINDUP'&&f.hits.length===0,'Hit before contact');
            }''')
            resume()
            at('pause')
            page.evaluate('''()=>{
              const f=__creatureNative,before=JSON.stringify(f.snapshot()),count=__captureAudio.events.length;
              f.g.setSystemPaused(true);for(let i=0;i<60;i++)f.frame();
              f.need(JSON.stringify(f.snapshot())===before&&__captureAudio.events.length===count,'Paused capture advanced or played a new cue');
              __captureAudio.pauseSnapshot={events:count,hits:f.hits.length};
            }''')
            resume()
            at('contact')
            page.evaluate('''()=>{
              const f=__creatureNative;f.ticks(3);
              f.need(f.p.ceilingAction?.phase==='HOIST'&&f.hits.length===1&&f.hits[0].amount===140,'Contact did not commit one native hit');
            }''')
            resume()
            at('hold')
            page.evaluate('''()=>{
              const f=__creatureNative,count=__captureAudio.events.length;
              f.until('HOLD');f.ticks(30);f.need(__captureAudio.events.length===count,'Hold replayed a transitory cue');
            }''')
            resume()
            at('release')
            if mode == 'blocked':
                page.evaluate('''()=>{
                  const f=__creatureNative,center=f.p.ceilingAction.startPosition;
                  f.addFloorBlocker(center.x,center.z,13,13,1);
                }''')
            press('q')
            page.evaluate('''(blocked)=>{
              const f=__creatureNative;
              if(blocked){
                f.need(!f.p.ceilingAction&&f.victim.ceilingAnchor?.isCurrent(),'Blocked release did not enter the real anchor branch');
                return;
              }
              f.need(f.p.ceilingAction?.phase==='RELEASE','Q did not release the captive');
              f.ticks(10);f.need(f.p.ceilingAction?.phase==='RELEASE','Release jumped straight to landing');
            }''', mode == 'blocked')
            resume()
            at('landing')
            page.evaluate('''(hp)=>{
              const f=__creatureNative;
              f.active(()=>{for(let i=0;i<120&&f.p.ceilingAction;i++)f.frame();});
              f.need(!f.p.ceilingAction&&!f.victim.ceilingActionOwner&&f.hits.length===1&&f.victim.hp===Math.max(0,hp-140),'Landing retained bad ownership or damage');
            }''', hp)
            resume()
            case = page.evaluate('''async()=>{
              const a=__captureAudio,buffer=await a.rendering;
              const pcm=new Float32Array(buffer.length*buffer.numberOfChannels),metrics={};
              const windows=Object.entries(a.windows);
              for(let i=0;i<windows.length;i++){
                const [name,at]=windows[i],stop=windows[i+1]?.[1]??buffer.duration;
                let peak=0;const energy=[0,0],changes=[0,0],start=Math.round(at*buffer.sampleRate),end=Math.round(stop*buffer.sampleRate);
                for(let channel=0;channel<buffer.numberOfChannels;channel++){
                  const samples=buffer.getChannelData(channel);
                  for(let frame=start;frame<end;frame++){
                    const sample=samples[frame];if(!Number.isFinite(sample))throw Error('Nonfinite sample at '+name);
                    peak=Math.max(peak,Math.abs(sample));energy[channel]+=sample*sample;
                    if(sample*samples[frame-1]<0&&Math.abs(sample)>.001)changes[channel]++;
                  }
                }
                metrics[name]={peak,rms:energy.map(value=>Math.sqrt(value/(end-start))),zeroCrossings:changes};
              }
              for(let channel=0;channel<buffer.numberOfChannels;channel++){
                const samples=buffer.getChannelData(channel);
                for(let i=0;i<buffer.length;i++)pcm[i*buffer.numberOfChannels+channel]=samples[i];
              }
              const data=new Uint8Array(pcm.buffer);let binary='';
              for(let i=0;i<data.length;i+=8192)binary+=String.fromCharCode(...data.subarray(i,i+8192));
              const result={events:a.events,windows:a.windows,keys:a.keys,listener:a.listener,reduced:a.reduced,pause:a.pauseSnapshot,
                metrics,sampleRate:buffer.sampleRate,frames:buffer.length,channels:buffer.numberOfChannels,pcm:btoa(binary)};
              a.cleanup();return result;
            }''')
            data = base64.b64decode(case.pop('pcm'), validate=True)
            name = mode + '-stereo-f32le.pcm'
            (args.output / name).write_bytes(data)
            case.update(mode=mode, artifact=name, sha256=digest(data), bytes=len(data))
            report['cases'].append(case)
            save()
            return case

        try:
            page.goto(args.url, wait_until='domcontentloaded')
            page.wait_for_function('()=>!!(window.__creatureQA&&window.HiveSystems?.ui?.game)', timeout=180000)
            open_campaign_menu(page)
            page.locator('.origin-card[data-origin="starship"]').click()
            page.locator('#btn-new-campaign').click()
            page.locator('#btn-start-act-one').click()
            page.evaluate('()=>gameInstance.setSystemPaused(true)')
            page.evaluate(probe.read_text())
            page.clock.install()
            page.clock.pause_at(datetime.now(timezone.utc) + timedelta(seconds=1))
            for mode in ['active'] if args.baseline else ['active', 'reduced', 'muted', 'zero', 'lethal', 'blocked']:
                case = render_case(mode)
                assert case['keys'] == ['t', 'q'] and case['pause'] == {'events': 1, 'hits': 0}, case
                events = case['events']
                if args.baseline:
                    assert [event['method'] for event in events] == ['playTailWhip', 'playWetImpact', 'playWetImpact'], case
                    assert case['metrics']['release']['peak'] < .001, case
                else:
                    assert [event['phase'] for event in events] == (PHASES[:2] if mode == 'blocked' else PHASES), case
                    markers = ['windup', 'contact', 'release', 'landing']
                    states = ['WINDUP', 'HOIST', 'RELEASE', None]
                    for marker, state, event in zip(markers, states, events):
                        assert event['time'] == case['windows'][marker], event
                        assert event['state'] == state, event
                        if mode in ['muted', 'zero']:
                            assert not event['routes'], event
                        else:
                            assert len(event['routes']) == 1, event
                            route = event['routes'][0]
                            assert [route['x'], route['z']] == [event['x'], event['z']] and route['radius'] > 0, event
                    peaks = [case['metrics'][name]['peak'] for name in ['windup', 'contact', 'release', 'landing']]
                    if mode in ['muted', 'zero']:
                        assert max(peaks) == 0, case['metrics']
                    else:
                        count = 2 if mode == 'blocked' else 4
                        assert all(.001 < peak < 1 for peak in peaks[:count]), case['metrics']
                        assert all(peak < .001 for peak in peaks[count:]), case['metrics']
                        assert any(abs(left - right) > .0001 for left, right in [window['rms'] for window in case['metrics'].values()]), case['metrics']
                    assert mode != 'reduced' or case['reduced'], case
                assert all(case['metrics'][name]['peak'] < .001 for name in ['pause', 'hold']), case['metrics']
                print('PASS T140 native PCM', mode, flush=True)
            report['after'] = inventory()
            assert report['after'] == report['before'], 'Audio validation sources changed'
            assert report['served'].get('src/game.js') == report['before']['src/game.js'], 'Production audio script was not observed'
            assert not any(report[key] for key in ['pageErrors', 'consoleErrors', 'httpFailures']), report
            report['complete'] = True
        except Exception as error:
            report['error'] = str(error)
            raise
        finally:
            save()
            browser.close()


if __name__ == '__main__':
    main()
