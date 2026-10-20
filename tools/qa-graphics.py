#!/usr/bin/env python3
"""Matched graphics captures and diagnostic budgets in Chromium/SwiftShader.

The only request instrumentation adds access to existing renderer/map/player
objects. It does not replace rendering, assets, collision or game logic.
Requires Python Playwright, Pillow and system Chromium; optional QA tooling only.
"""

import argparse
import base64
import hashlib
import json
from pathlib import Path
from statistics import median
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright
from PIL import Image


EXPORT = 'window.__graphicsQA={rendererEngine,playerCreature,stationMap};\n'
RANDOM_SEED = '''
Math.random=(()=>{let seed=93841;return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}})();
'''


def save_diagnostics(args, output, diagnostics):
    if args.label!='before':
        matches={path:hashlib.sha256(Path(path.lstrip('/')).read_bytes()).hexdigest()==digest
                 for path,digest in diagnostics['source_hashes'].items()}
        diagnostics['source_matches_checkout']=matches
        assert all(matches.values()),'Runtime changed during capture: '+repr(matches)
        assert not diagnostics['runtime_changed_during_capture'],'Runtime changed between page reloads during capture'
    if args.merge_diagnostics and (output/'diagnostics.json').exists():
        previous=json.loads((output/'diagnostics.json').read_text())
        assert previous['source_hashes']==diagnostics['source_hashes'],'Cannot merge checks from different runtime versions'
        merged={**previous,**diagnostics}
        key_functions={'portraits':lambda row:(row['kind'],row['name'],row['angle'],row['framing']),
                       'captures':lambda row:row['file'],'checks':lambda row:row['name'],
                       'comparisons':lambda row:row['file']}
        for field,key in key_functions.items():
            rows={key(row):row for row in previous.get(field,[])}
            rows.update({key(row):row for row in diagnostics.get(field,[])})
            merged[field]=list(rows.values())
        for field in ('stages','galleries','matched_inspection'):
            if not diagnostics.get(field):merged[field]=previous.get(field,[])
        for field in ('uncaught_errors','console_errors','failed_local_assets','external_requests'):
            merged[field]=list(dict.fromkeys(previous.get(field,[])+diagnostics.get(field,[])))
        merged['capture_refresh']={'subjects':args.portrait_subjects,'frames':args.portrait_frames,'baseline_camera':True}
        diagnostics.clear();diagnostics.update(merged)
    (output/'diagnostics.json').write_text(json.dumps(diagnostics,ensure_ascii=False,indent=2)+'\n')
    for field in ('uncaught_errors','console_errors','failed_local_assets','external_requests'):
        assert not diagnostics[field],diagnostics[field]


def portraits(page, diagnostics, capture, subjects=None, frames=None, reference=None):
    """Large single-subject portraits under a fixed neutral studio rig."""
    page.set_viewport_size({'width':1440,'height':900})
    page.evaluate('''()=>{
        gameInstance.isRunning=false;
        document.querySelector('#app-container').classList.remove('game-paused');
        const e=__graphicsQA.rendererEngine,r=e.renderer,T=THREE;
        e.onWindowResize();
        r.toneMapping=T.ACESFilmicToneMapping;r.outputEncoding=T.sRGBEncoding;r.toneMappingExposure=1.2;
        const scene=new T.Scene();scene.background=new T.Color(0x0b1017);
        const camera=new T.PerspectiveCamera(36,innerWidth/innerHeight,.02,250);
        scene.add(new T.HemisphereLight(0xc9d4dc,0x343139,.65));
        for(const [color,intensity,x,y,z] of [[0xe9edf2,3,6,10,10],[0x9aafc1,.8,-7,4,5],[0xa0b6c6,1.5,-4,6,-9]]){
            const light=new T.DirectionalLight(color,intensity);light.position.set(x,y,z);scene.add(light);
        }
        const probe=document.createElement('canvas');probe.width=512;probe.height=256;
        const ctx=probe.getContext('2d'),gradient=ctx.createLinearGradient(0,0,0,256);
        gradient.addColorStop(0,'#8f9ba4');gradient.addColorStop(.5,'#515c64');gradient.addColorStop(1,'#252b30');
        ctx.fillStyle=gradient;ctx.fillRect(0,0,512,256);ctx.fillStyle='#d5dce1';ctx.fillRect(44,50,92,15);ctx.fillRect(300,40,72,12);
        const texture=new T.CanvasTexture(probe);texture.encoding=T.sRGBEncoding;texture.mapping=T.EquirectangularReflectionMapping;
        const pmrem=new T.PMREMGenerator(r),environment=pmrem.fromEquirectangular(texture);
        scene.environment=environment.texture;pmrem.dispose();texture.dispose();
        const pipeline=HiveRenderQuality.create(r,scene,camera,{quality:'high'});
        const maskTarget=new T.WebGLRenderTarget(240,150),maskMaterial=new T.MeshBasicMaterial({color:0xffffff});
        window.__portraitStudio={scene,camera,pipeline,environment,maskTarget,maskMaterial,model:null};
        window.__graphicsGalleryRender=()=>pipeline.render();
    }''')
    page.add_style_tag(content='#app-container > :not(#game-canvas){visibility:hidden!important}')
    cases=[]
    for caste in ('drone','warrior','runner','queen'):
        for angle in ('three-quarter','side'):
            cases.append(('adult',caste,angle,'body'))
    for archetype in ('scientist','marine','synthetic'):
        cases.extend([('human',archetype,'three-quarter','body'),('human',archetype,'three-quarter','face')])
    if subjects:
        cases=[case for case in cases if case[1] in subjects]
        assert cases,'No matching portrait subjects'
    if frames:
        cases=[case for case in cases if case[3] in frames]
        assert cases,'No matching portrait framing'
    diagnostics['portraits']=[]
    for kind,name,angle,framing in cases:
        ref=next((row for row in (reference or {}).get('portraits',[]) if row['kind']==kind and row['name']==name
                  and row['angle']==angle and row['framing']==framing),None) if framing=='face' else None
        stats=page.evaluate('''([kind,name,angle,framing,reference])=>{
            const s=__portraitStudio,F=HiveModelFactory,T=THREE,r=__graphicsQA.rendererEngine.renderer;
            if(s.model){s.scene.remove(s.model);F.disposeModel(s.model)}
            const model=kind==='adult'?F.createAdult(name):F.createHuman(name);s.model=model;s.scene.add(model);
            model.updateMatrixWorld(true);
            const full=new T.Box3().setFromObject(model),head=framing==='face'?model.getObjectByName('head'):null;
            const bounds=head?new T.Box3().setFromObject(head):full,size=bounds.getSize(new T.Vector3());
            const target=head?bounds.getCenter(new T.Vector3()):new T.Vector3(0,full.min.y+size.y*.53,0);
            const direction=new T.Vector3(...(angle==='side'?[3,.13,.35]:[1.35,.18,2.6])).normalize();
            let distance=size.y*.5/Math.tan(T.MathUtils.degToRad(18))/.76;
            const pixels=new Uint8Array(240*150*4);
            let coverage=0;
            for(let attempt=0;attempt<3;attempt++){
                if(reference){
                    s.camera.position.fromArray(reference.camera);target.fromArray(reference.target);
                    s.camera.fov=reference.fov;s.camera.updateProjectionMatrix();
                }else s.camera.position.copy(target).addScaledVector(direction,distance);
                s.camera.lookAt(target);s.camera.updateMatrixWorld(true);
                const background=s.scene.background;s.scene.background=new T.Color(0);s.scene.overrideMaterial=s.maskMaterial;
                r.setRenderTarget(s.maskTarget);r.render(s.scene,s.camera);r.readRenderTargetPixels(s.maskTarget,0,0,240,150,pixels);
                r.setRenderTarget(null);s.scene.overrideMaterial=null;s.scene.background=background;
                let min=150,max=-1;for(let y=0;y<150;y++)for(let x=0;x<240;x++)if(pixels[(y*240+x)*4]>40){min=Math.min(min,y);max=Math.max(max,y)}
                coverage=max>=min?(max-min+1)/150:0;
                if(coverage>=.6||framing==='face'||reference)break;
                distance*=.82;
            }
            if(coverage<.6)throw Error(`Subject too small: ${name} ${framing} ${coverage}`);
            s.pipeline.render();
            let meshes=0;model.traverse(o=>meshes+=o.isMesh?1:0);
            const q=s.pipeline.getDiagnostics();
            return {kind,name,angle,framing,subject_height_fraction:coverage,meshes,calls:q.sceneDrawCalls,triangles:q.sceneTriangles,
                camera:s.camera.position.toArray(),target:target.toArray(),fov:s.camera.fov,
                bounds:size.toArray(),baseline_camera_reused:!!reference};
        }''',[kind,name,angle,framing,ref])
        if ref:
            assert stats['camera']==ref['camera'] and stats['target']==ref['target'] and stats['fov']==ref['fov']
        filename=f'portrait-{name}-{framing}-{angle}.png'
        capture(filename,gallery=True)
        diagnostics['portraits'].append(stats)
        print('Captured',filename,'subject height',round(stats['subject_height_fraction'],3),flush=True)
    page.evaluate('''()=>{
        const s=__portraitStudio;s.scene.remove(s.model);HiveModelFactory.disposeModel(s.model);
        s.pipeline.dispose();s.environment.dispose();s.maskTarget.dispose();s.maskMaterial.dispose();
        window.__graphicsGalleryRender=null;window.__portraitStudio=null;
    }''')


def matched_inspection(page, diagnostics, capture):
    """Hold the new 50% inspection camera identical on old and new assets."""
    diagnostics['matched_inspection']=[]
    for width,height in ((1440,900),(390,844)):
        page.set_viewport_size({'width':width,'height':height})
        state=page.evaluate('''()=>{
            const g=gameInstance,e=__graphicsQA.rendererEngine;
            g.startCampaign(4);g.setSystemPaused(true);g.isRunning=false;
            document.querySelector('#app-container').classList.remove('game-paused');
            e.onWindowResize();e.renderQuality?.setQuality(innerWidth<680?'mobile':'high');
            e.camera.position.set(-20,15.5,-22.5);e.camera.fov=40;e.camera.near=.1;
            e.camera.updateProjectionMatrix();e.camera.lookAt(-20,1.6,-35);
            e.updateWallVisibility?.({x:-20,y:1.6,z:-35},4);e.render();
            return {position:e.camera.position.toArray(),target:[-20,1.6,-35],fov:40,viewport:[innerWidth,innerHeight]};
        }''')
        capture(f'matched-inspect50-{width}x{height}.png')
        diagnostics['matched_inspection'].append(state)


def camera_controls(page, diagnostics, capture):
    """Check actual inspection controls, guards, saved state and close framing."""
    page.reload(wait_until='domcontentloaded')
    page.wait_for_function('window.__graphicsQA && window.HiveSystems?.ui?.game')
    page.evaluate('async()=>await HiveModelFactory.loadTextures()')
    page.click('#btn-new-campaign');page.click('#btn-start-act-one')
    page.evaluate('gameInstance.startCampaign(4)')
    page.click('#btn-pause-game');page.click('#btn-open-settings')
    slider=page.locator('#setting-camera-distance')
    slider.focus();slider.press('Home')
    assert slider.input_value()=='50'
    assert page.locator('#camera-distance-value').inner_text()=='50 %'
    assert page.evaluate('HiveSystems.settings.values.cameraDistance===50 && __graphicsQA.rendererEngine.cameraDistance===.5')
    slider.press('End')
    assert slider.input_value()=='135'
    assert page.evaluate('HiveSystems.settings.values.cameraDistance===135 && __graphicsQA.rendererEngine.cameraDistance===1.35')
    slider.press('Home');slider.press('ArrowRight')
    assert slider.input_value()=='55'
    page.click('#btn-close-settings');page.click('#btn-resume-game')
    def wheel(delta, expected):
        page.mouse.move(720,450)
        page.mouse.wheel(0,delta)
        page.wait_for_timeout(125)
        value=page.evaluate('HiveSystems.settings.values.cameraDistance')
        assert value==expected,dict(delta=delta,expected=expected,actual=value)
    wheel(-300,50);wheel(-300,50);wheel(300,55)
    page.evaluate('gameInstance.setSystemPaused(true)')
    wheel(300,55)
    page.evaluate('gameInstance.setSystemPaused(false);gameInstance.startCampaign(5)')
    wheel(-300,55)
    rts=page.evaluate('''()=>{
        const e=__graphicsQA.rendererEngine;e.snapCameraTarget(20,10,0,true);
        return {distance:HiveSystems.settings.values.cameraDistance,position:e.camera.position.toArray()};
    }''')
    assert abs(rts['position'][1]-120)<.001,rts
    page.evaluate('''()=>{
        gameInstance.startCampaign(3);
        const s=gameInstance.currentStage,h=gameInstance.humans[0];
        s.step='READY_TO_BURST';s.thoracicView.activate(h.x,h.z);
    }''')
    assert page.evaluate('!!gameInstance.currentStage.getCameraOverride()')
    wheel(300,55)
    page.reload(wait_until='domcontentloaded')
    page.wait_for_function('window.__graphicsQA && window.HiveSystems?.ui?.game')
    assert page.evaluate('HiveSystems.settings.values.cameraDistance===55 && __graphicsQA.rendererEngine.cameraDistance===.55')
    recovery=[]
    for value,expected in (('invalid',100),(900,135),(-100,50)):
        page.evaluate('''value=>{
            const key='hive-ascension-settings-v2',settings=JSON.parse(localStorage.getItem(key)||'{}');
            settings.cameraDistance=value;localStorage.setItem(key,JSON.stringify(settings));
        }''',value)
        page.reload(wait_until='domcontentloaded')
        page.wait_for_function('window.__graphicsQA && window.HiveSystems?.ui?.game')
        actual=page.evaluate('HiveSystems.settings.values.cameraDistance')
        assert actual==expected,dict(value=value,expected=expected,actual=actual)
        recovery.append({'input':value,'restored':actual})
    page.evaluate('async()=>await HiveModelFactory.loadTextures()')
    page.click('#btn-continue-campaign')
    for width,height in ((1440,900),(390,844)):
        page.set_viewport_size({'width':width,'height':height})
        page.evaluate('''()=>{
            const g=gameInstance,e=__graphicsQA.rendererEngine;
            g.startCampaign(4);g.setSystemPaused(true);g.isRunning=false;
            document.querySelector('#app-container').classList.remove('game-paused');
            e.onWindowResize();e.snapCameraTarget(-20,-35);
            e.updateWallVisibility?.({x:-20,y:1.6,z:-35},4);e.render();
        }''')
        capture(f'inspect-camera-50-{width}x{height}.png')
    diagnostics['checks'].append({'name':'Inspection slider, wheel guards/clamps, persistence, invalid settings and in-game closeups',
        'passed':True,'detail':{'slider':[50,135,55],'wheel':[50,50,55],
            'paused_and_cinematic_unchanged':55,'rts':rts,'reloaded':55,'recovery':recovery}})


def comparison_boards(context, root, diagnostics):
    """Arrange original PNGs at native size; no rendering or image retouching."""
    diagnostics['comparisons']=[]
    for name,filename in (('drone','portrait-drone-body-three-quarter.png'),
                          ('scientist','portrait-scientist-face-three-quarter.png')):
        before,after=root/'before'/filename,root/'after'/filename
        if not before.exists() or not after.exists():
            continue
        sources=[base64.b64encode(path.read_bytes()).decode() for path in (before,after)]
        board=context.new_page()
        board.set_viewport_size({'width':2880,'height':950})
        board.set_content('''<!doctype html><meta charset="utf-8"><style>
            *{box-sizing:border-box}body{margin:0;background:#090e15;color:#d9e5ec;font:24px monospace;display:flex}
            article{width:1440px}header{height:50px;padding:10px 25px;letter-spacing:3px;border-bottom:1px solid #293747}
            img{width:1440px;height:900px;display:block}</style>'''+
            f'<article><header>AVANT · 736f595</header><img src="data:image/png;base64,{sources[0]}"></article>'+
            f'<article><header>APRÈS · SURFACES SCULPTÉES</header><img src="data:image/png;base64,{sources[1]}"></article>')
        board.wait_for_function('Array.from(document.images).every(image=>image.complete&&image.naturalWidth===1440)')
        target=root/f'comparison-{name}.png'
        board.screenshot(path=str(target));board.close()
        diagnostics['comparisons'].append({'file':str(target),'sources':[str(before),str(after)],
                                           'source_sha256':[hashlib.sha256(path.read_bytes()).hexdigest() for path in (before,after)]})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', default='http://127.0.0.1:8082/')
    parser.add_argument('--label', default='after')
    parser.add_argument('--output', default='.tools/graphics')
    parser.add_argument('--chromium', default='/usr/bin/chromium')
    parser.add_argument('--portraits', action='store_true', help='Also capture large neutral character portraits')
    parser.add_argument('--portraits-only', action='store_true', help='Capture only large neutral portraits')
    parser.add_argument('--portrait-subjects', help='Optional comma-separated portrait subjects')
    parser.add_argument('--matched-inspection', action='store_true', help='Add identical old/new in-game50% inspection framing')
    parser.add_argument('--portrait-frames', help='Optional comma-separated body/face portrait framing')
    parser.add_argument('--merge-diagnostics', action='store_true', help='Refresh selected captures while retaining checks from identical runtime')
    args = parser.parse_args()
    reference_path=Path(args.output)/'before'/'diagnostics.json'
    reference=json.loads(reference_path.read_text()) if args.label!='before' and reference_path.exists() else None
    output = Path(args.output)/args.label
    output.mkdir(parents=True, exist_ok=True)
    diagnostics = {'label': args.label, 'url': args.url, 'stages': [], 'galleries': [], 'captures': [], 'checks': [], 'source_hashes': {}, 'runtime_changed_during_capture':False, 'uncaught_errors': [], 'console_errors': [], 'failed_local_assets': [], 'external_requests': [],
                   'instrumentation': 'Existing internal object export only; deterministic random seed; fixed cameras; simulation paused for matched captures',
                   'timing_scope': 'Synchronous renderer.render + gl.finish in Chromium SwiftShader; software diagnostics, not real GPU or gameplay FPS'}
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=args.chromium, headless=True,
            args=['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
        context = browser.new_context(viewport={'width':1440,'height':900})
        page = context.new_page()
        page.add_init_script(RANDOM_SEED)
        page.on('pageerror', lambda error: diagnostics['uncaught_errors'].append(str(error)))
        page.on('console', lambda message: diagnostics['console_errors'].append(message.text) if message.type=='error' else None)
        page.on('response', lambda response: diagnostics['failed_local_assets'].append(f'{response.status} {response.url}')
                if response.status>=400 and response.url.startswith(args.url) else None)
        page.on('request', lambda request: diagnostics['external_requests'].append(request.url)
                if request.url.startswith(('http:','https:')) and not request.url.startswith(args.url) else None)
        def expose(route):
            response=route.fetch()
            source=response.text()
            path=urlparse(response.url).path
            digest=hashlib.sha256(source.encode()).hexdigest()
            if path in diagnostics['source_hashes'] and diagnostics['source_hashes'][path]!=digest:
                diagnostics['runtime_changed_during_capture']=True
            diagnostics['source_hashes'][path]=digest
            if path.endswith('/game.js'):
                index=source.rfind('})();')
                assert index>=0, 'Game closure changed; diagnostic export cannot be inserted'
                source=source[:index]+EXPORT+source[index:]
            route.fulfill(response=response,body=source)
        page.route('**/src/*.js*',expose)
        page.goto(args.url,wait_until='domcontentloaded')
        page.wait_for_function('window.__graphicsQA && window.HiveSystems?.ui?.game')
        texture_state=page.evaluate('''async()=>{
            const textures=await HiveModelFactory.loadTextures();
            const count=Object.values(textures).filter(Boolean).length;
            if(count!==Object.keys(HiveModelFactory.texturePaths).length)throw Error('Incomplete texture set');
            return {count,dimensions:Object.fromEntries(Object.entries(textures).map(([key,texture])=>[key,[texture.image.width,texture.image.height]]))};
        }''')
        diagnostics['texture_count']=texture_state['count']
        diagnostics['texture_dimensions']=texture_state['dimensions']
        page.click('#btn-new-campaign')
        page.click('#btn-start-act-one')
        page.evaluate('gameInstance.setSystemPaused(true)')

        def capture(filename, gallery=False):
            # Keep the presented WebGL buffer populated while the browser
            # composites a screenshot, without advancing the simulation/camera.
            page.evaluate('''gallery=>{
                const token={active:true};window.__graphicsCapture=token;
                const draw=()=>{
                    if(!token.active)return;
                    if(gallery)window.__graphicsGalleryRender();else __graphicsQA.rendererEngine.render();
                    requestAnimationFrame(draw);
                };
                draw();
            }''',gallery)
            path=output/filename
            page.screenshot(path=str(path))
            page.evaluate('window.__graphicsCapture.active=false')
            image=Image.open(path).convert('RGB')
            width,height=image.size
            # The central scene region excludes desktop HUD/sidebar and the
            # mobile top controls; black world + bright HUD cannot pass.
            crop=image.crop((int(width*.2),int(height*.25),int(width*.7),int(height*.8)))
            pixels=list(crop.get_flattened_data() if hasattr(crop,'get_flattened_data') else crop.getdata())
            coverage=sum(max(pixel)>20 for pixel in pixels)/len(pixels)
            diagnostics['captures'].append({'file':filename,'world_nonblack_fraction':round(coverage,4)})
            assert coverage>.03, f'World absent from capture {filename}: nonblack coverage={coverage:.4f}'

        if args.matched_inspection:
            matched_inspection(page,diagnostics,capture)
        if args.portraits_only:
            portraits(page,diagnostics,capture,set(args.portrait_subjects.split(',')) if args.portrait_subjects else None,
                      set(args.portrait_frames.split(',')) if args.portrait_frames else None,reference)
            if args.label=='after':
                comparison_boards(context,Path(args.output),diagnostics)
            browser.close()
            save_diagnostics(args,output,diagnostics)
            print('Portrait capture complete:',output,flush=True)
            return

        for width,height in ((1440,900),(390,844)):
            page.set_viewport_size({'width':width,'height':height})
            page.evaluate('__graphicsQA.rendererEngine.onWindowResize()')
            rect=page.locator('#game-canvas').bounding_box()
            assert abs(rect['width']-width)<2 and abs(rect['height']-height)<2, f'Canvas CSS does not match viewport: {rect} vs {width}x{height}'
            for stage in (4,5):
                snapshot=page.evaluate('''([stage,width])=>{
                    const g=gameInstance,q=__graphicsQA,e=q.rendererEngine;
                    g.startCampaign(stage);g.setSystemPaused(true);
                    g.isRunning=false;
                    document.querySelector('#app-container').classList.remove('game-paused');
                    e.renderQuality?.setQuality(width<680?'mobile':'high');
                    e.snapCameraTarget(stage===5?20:-20,stage===5?10:-35,0,stage===5);
                    e.camera.position.set(stage===5?20:-20,stage===5?120:46,stage===5?80:-15);
                    e.camera.fov=stage===5?54:40;e.camera.near=.1;e.camera.updateProjectionMatrix();
                    e.camera.lookAt(stage===5?20:-20,stage===5?0:1.2,stage===5?10:-35);
                    e.updateWallVisibility?.(stage===5?{x:20,y:1.4,z:10}:{x:-20,y:1.4,z:-35},4);
                    e.render();
                    const quality=e.renderQuality?.getDiagnostics();
                    return {stage,position:e.camera.position.toArray(),fov:e.camera.fov,near:e.camera.near,
                        calls:quality?.sceneDrawCalls??e.renderer.info.render.calls,triangles:quality?.sceneTriangles??e.renderer.info.render.triangles,
                        geometries:e.renderer.info.memory.geometries,textures:e.renderer.info.memory.textures,
                        programs:e.renderer.info.programs.length,
                        quality:quality??null};
                }''',[stage,width])
                capture(f'act-{stage}-{width}x{height}.png')
                # Explicitly finish queued GPU work. This records software renderer
                # cost separately from host AI and browser scheduling.
                samples=page.evaluate('''()=>{
                    const e=__graphicsQA.rendererEngine,gl=e.renderer.getContext(),samples=[];
                    e.render();gl.finish();
                    for(let i=0;i<3;i++){const t=performance.now();e.render();gl.finish();samples.push(performance.now()-t)}
                    return samples;
                }''')
                snapshot.update(viewport=[width,height],software_frame_ms=samples,median_software_frame_ms=round(median(samples),2))
                diagnostics['stages'].append(snapshot)
                print(json.dumps(snapshot),flush=True)

        page.set_viewport_size({'width':1440,'height':900})
        page.evaluate('__graphicsQA.rendererEngine.onWindowResize()')
        page.evaluate('gameInstance.isRunning=false')
        if args.label!='before':
            page.evaluate('''()=>{
                const g=gameInstance,e=__graphicsQA.rendererEngine;
                g.startCampaign(4);g.setSystemPaused(true);g.isRunning=false;
                document.querySelector('#app-container').classList.remove('game-paused');
                e.renderQuality.setQuality('high');e.snapCameraTarget(-20,-35);
                e.updateWallVisibility?.({x:-20,y:1.4,z:-35},4);
                e.render();e.renderer.getContext().finish();
            }''')
            capture('authored-camera-act-4-1440x900.png')
            native=page.evaluate('''()=>{
                const rows=[],g=gameInstance,e=__graphicsQA.rendererEngine;
                for(let stage=1;stage<=5;stage++){
                    g.startCampaign(stage);g.setSystemPaused(true);
                    e.render();
                    const valid=g.currentStageIndex===stage&&g.isRunning&&!!g.currentStage&&g.humans.length>0;
                    rows.push({stage,valid,actors:g.humans.length});
                    if(!valid)throw Error(`Act ${stage} failed native graphics initialization`);
                }
                g.isRunning=false;
                return rows;
            }''')
            diagnostics['checks'].append({'name':'Five native stage initializations with final graphics','passed':True,'detail':native})
            profile_check=page.evaluate('''()=>{
                const e=__graphicsQA.rendererEngine,p=e.renderQuality,r=e.renderer;
                if(!p)throw Error('Integrated render-quality pipeline missing');
                const rows=[];
                for(let round=0;round<2;round++)for(const profile of ['mobile','high','ultra']){
                    p.setQuality(profile);p.setSize(480,320);p.render();r.getContext().finish();
                    const d=p.getDiagnostics();
                    if(d.quality!==profile||!Number.isFinite(d.width)||d.width<1||d.height<1||d.bloomStrength>.2)
                        throw Error(`Invalid quality profile ${profile}: ${JSON.stringify(d)}`);
                    if(profile==='mobile'&&d.depthContacts)throw Error('Mobile unexpectedly runs depth AO');
                    rows.push({round,profile,width:d.width,height:d.height,memory:d.memory,passes:d.passes,hdr:d.hdr});
                }
                for(let index=0;index<3;index++){
                    const before=rows[index].memory,after=rows[index+3].memory;
                    if(after.textures>before.textures+1||after.geometries>before.geometries)
                        throw Error(`Resources grow after repeated profile resize: ${JSON.stringify({before,after})}`);
                }
                p.setQuality('high');p.setSize(innerWidth,innerHeight);p.render();
                return rows;
            }''')
            diagnostics['checks'].append({'name':'Quality profiles, resize and stable resource counts','passed':True,'detail':profile_check})
        galleries = {
            'creatures':[('DRONE','adult','drone'),('WARRIOR','adult','warrior'),('RUNNER','adult','runner'),('REINE','adult','queen')],
            'humans':[('SCIENTIFIQUE','human','scientist'),('MARINE','human','marine'),('SYNTHÉTIQUE','human','synthetic'),('POWERLOADER','human','powerloader')],
            'props':[('CAISSE','prop','crate'),('CONSOLE','prop','console'),('GÉNÉRATEUR','prop','generator'),('PORTE','prop','door')]
        }
        page.evaluate('document.querySelector("#app-container").classList.remove("game-paused")')
        for name,cases in galleries.items():
            stats=page.evaluate('''cases=>{
                const e=__graphicsQA.rendererEngine,r=e.renderer,F=HiveModelFactory,W=innerWidth,H=innerHeight;
                const root=document.createElement('div');root.id='qa-gallery-labels';
                root.style.cssText='position:fixed;inset:0;z-index:99999;pointer-events:none;color:#e2e8f0;font:16px monospace';
                document.body.append(root);
                for(const [index,[label,type,caste]] of cases.entries()){
                    const text=document.createElement('div');text.textContent=label;
                    text.style.cssText=`position:absolute;left:${index%2*50+2}%;top:${Math.floor(index/2)*50+2}%;letter-spacing:4px`;
                    root.append(text);
                }
                const stats=[],views=[];
                for(const [index,[label,type,caste]] of cases.entries()){
                    const scene=new THREE.Scene();scene.background=new THREE.Color(0x0b1018);scene.environment=e.scene.environment;
                    const model=type==='adult'?F.createAdult(caste):(type==='human'?F.createHuman(caste):F.createIndustrialProp(caste));
                    scene.add(model);
                    const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
                    const radius=Math.max(size.x,size.y,size.z)*.73;
                    const camera=new THREE.PerspectiveCamera(34,(W/2)/(H/2),.03,1000);
                    camera.position.copy(center).add(new THREE.Vector3(radius*1.42,radius*.66,radius*1.95));camera.lookAt(center);
                    scene.add(new THREE.HemisphereLight(0xa0bdd6,0x19151a,1.25));
                    const key=new THREE.DirectionalLight(0xd2e5ff,2.2);key.position.set(8,12,8);scene.add(key);
                    const rim=new THREE.DirectionalLight(0x558bba,1.4);rim.position.set(-8,5,-8);scene.add(rim);
                    const x=index%2*W/2,y=(1-Math.floor(index/2))*H/2;
                    views.push({scene,camera,x,y,model});
                    stats.push({label,size:size.toArray(),meshes:(()=>{let n=0;model.traverse(o=>n+=o.isMesh?1:0);return n})()});
                }
                window.__graphicsGalleryModels=views.map(view=>view.model);
                window.__graphicsGalleryRender=()=>{
                    r.setScissorTest(true);
                    for(const [index,view] of views.entries()){
                        r.setViewport(view.x,view.y,W/2,H/2);r.setScissor(view.x,view.y,W/2,H/2);
                        r.render(view.scene,view.camera);
                        stats[index].calls=r.info.render.calls;stats[index].triangles=r.info.render.triangles;
                    }
                    r.setScissorTest(false);r.setViewport(0,0,W,H);
                };
                window.__graphicsGalleryRender();r.getContext().finish();
                return stats;
            }''',cases)
            # Hide gameplay UI while preserving the unmodified WebGL canvas.
            page.add_style_tag(content='#app-container > :not(#game-canvas){visibility:hidden!important}')
            capture(f'gallery-{name}.png',gallery=True)
            page.evaluate('''document.querySelector('#qa-gallery-labels')?.remove();
                window.__graphicsGalleryModels.forEach(model=>HiveModelFactory.disposeModel(model));
                window.__graphicsGalleryRender=null;window.__graphicsGalleryModels=[];''')
            diagnostics['galleries'].append({'name':name,'models':stats})
            print('Captured gallery',name,flush=True)
        if args.label!='before':
            disposal=page.evaluate('''()=>{
                const e=__graphicsQA.rendererEngine,p=e.renderQuality,r=e.renderer;
                p.setSize(480,320);p.render();r.getContext().finish();
                const before={...r.info.memory};
                p.dispose();p.dispose();
                const after={...r.info.memory};
                if(after.textures>=before.textures||after.geometries>=before.geometries)
                    throw Error(`Postprocess targets/quad not released: ${JSON.stringify({before,after})}`);
                return {before,after,idempotent:true};
            }''')
            diagnostics['checks'].append({'name':'Postprocess dispose releases targets and quad; repeated dispose safe','passed':True,'detail':disposal})
            # Exercise actual settings controls and persistence in a fresh app
            # after disposing the diagnostic render instance above.
            page.reload(wait_until='domcontentloaded')
            page.wait_for_function('window.__graphicsQA && window.HiveSystems?.ui?.game')
            page.click('#btn-new-campaign');page.click('#btn-start-act-one')
            page.click('#btn-pause-game');page.click('#btn-open-settings')
            selected=[]
            for quality in ('mobile','high','ultra','auto'):
                page.select_option('#setting-graphics',quality)
                state=page.evaluate('''()=>({saved:HiveSystems.settings.values.graphicsQuality,
                    requested:__graphicsQA.rendererEngine.renderQuality.getDiagnostics().requestedQuality,
                    resolved:__graphicsQA.rendererEngine.renderQuality.getDiagnostics().quality})''')
                assert state['saved']==quality and state['requested']==quality,state
                assert state['resolved']==('high' if quality=='auto' else quality),state
                selected.append(state)
            page.select_option('#setting-graphics','ultra')
            page.reload(wait_until='domcontentloaded')
            page.wait_for_function('window.__graphicsQA && window.HiveSystems?.ui?.game')
            restored=page.evaluate('''()=>({saved:HiveSystems.settings.values.graphicsQuality,
                resolved:__graphicsQA.rendererEngine.renderQuality.getDiagnostics().quality})''')
            assert restored=={'saved':'ultra','resolved':'ultra'},restored
            page.evaluate('''localStorage.setItem('hive-ascension-settings-v2',JSON.stringify({graphicsQuality:'obsolete-mode',scanlines:true,volume:45}))''')
            page.reload(wait_until='domcontentloaded')
            page.wait_for_function('window.__graphicsQA && window.HiveSystems?.ui?.game')
            recovered=page.evaluate('''()=>({saved:HiveSystems.settings.values.graphicsQuality,
                resolved:__graphicsQA.rendererEngine.renderQuality.getDiagnostics().quality,
                scanlines:HiveSystems.settings.values.scanlines,volume:HiveSystems.settings.values.volume})''')
            assert recovered=={'saved':'auto','resolved':'high','scanlines':True,'volume':45},recovered
            resized=[]
            for width,height,expected in ((390,844,'mobile'),(1440,900,'high')):
                page.set_viewport_size({'width':width,'height':height})
                state=page.evaluate('''()=>{
                    const e=__graphicsQA.rendererEngine;e.onWindowResize();
                    const d=e.renderQuality.getDiagnostics(),rect=e.renderer.domElement.getBoundingClientRect();
                    return {requested:d.requestedQuality,resolved:d.quality,css:[rect.width,rect.height],buffer:[d.width,d.height]};
                }''')
                assert state['requested']=='auto' and state['resolved']==expected,state
                assert state['css']==[width,height],state
                resized.append(state)
            diagnostics['checks'].append({'name':'Actual graphics settings, persisted ultra and invalid legacy settings recovery',
                                          'passed':True,'detail':{'selected':selected,'restored':restored,'recovered':recovered,'auto_resize':resized}})
        if args.portraits:
            page.set_viewport_size({'width':1440,'height':900})
            portraits(page,diagnostics,capture,set(args.portrait_subjects.split(',')) if args.portrait_subjects else None,
                      set(args.portrait_frames.split(',')) if args.portrait_frames else None,reference)
            if args.label!='before':
                camera_controls(page,diagnostics,capture)
            if args.label=='after':
                comparison_boards(context,Path(args.output),diagnostics)
        browser.close()
    save_diagnostics(args,output,diagnostics)
    print('Graphics capture complete:',output,flush=True)


if __name__=='__main__':
    main()
