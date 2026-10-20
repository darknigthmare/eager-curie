#!/usr/bin/env python3
"""Validate the local CC0 HDR/PMREM lifecycle and capture a fixed PBR object."""
import argparse
import json
from pathlib import Path
import shutil

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


def run(url, output, chromium):
    output.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=chromium, headless=True, args=[
            '--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-angle=swiftshader'])
        context = browser.new_context(viewport={'width': 1080, 'height': 720})
        page = context.new_page()
        errors, warnings, external = [], [], []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('console', lambda message: warnings.append(message.text) if message.type == 'warning' else None)
        page.on('request', lambda request: external.append(request.url) if not request.url.startswith((url.rstrip('/'), 'data:', 'blob:')) else None)
        page.goto(url, wait_until='domcontentloaded')
        page.wait_for_function('() => !!(window.HiveRenderQuality && window.THREE?.RGBELoader)')
        setup = page.evaluate('''async () => {
            const T=THREE;
            const canvas=document.createElement('canvas');canvas.id='hdr-qa';
            canvas.style.cssText='position:fixed;inset:0;z-index:999999;width:1080px;height:720px';document.body.append(canvas);
            const renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setSize(1080,720);
            renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
            const scene=new T.Scene();scene.background=new T.Color(0x14191d);
            const camera=new T.PerspectiveCamera(40,1.5,.1,50);camera.position.set(4.5,2.8,6.7);camera.lookAt(0,.85,0);
            scene.add(new T.HemisphereLight(0xdce4ea,0x33312c,.4));
            const key=new T.DirectionalLight(0xfff4e4,1.5);key.position.set(-3,5,4);scene.add(key);
            const floor=new T.Mesh(new T.PlaneGeometry(12,12),new T.MeshStandardMaterial({color:0x353c42,roughness:.8,metalness:.1}));
            floor.rotation.x=-Math.PI/2;floor.position.y=-.01;scene.add(floor);
            const subject=new T.Mesh(new T.TorusKnotGeometry(.65,.22,160,32),
                new T.MeshPhysicalMaterial({color:0x8b7d69,roughness:.36,metalness:.07,clearcoat:.15,clearcoatRoughness:.45}));
            subject.position.set(0,1.05,0);subject.rotation.set(.2,.35,.15);scene.add(subject);
            const ball=new T.Mesh(new T.SphereGeometry(.4,48,32),new T.MeshStandardMaterial({color:0xb7bdc3,roughness:.17,metalness:.9}));
            ball.position.set(1.55,.4,-.15);scene.add(ball);
            // This explicitly reproduces the old LDR fallback only for the
            // controlled before image. The after image uses the local HDR file.
            const probe=document.createElement('canvas');probe.width=512;probe.height=256;
            const ctx=probe.getContext('2d'),gradient=ctx.createLinearGradient(0,0,0,256);
            gradient.addColorStop(0,'#8fabbc');gradient.addColorStop(.36,'#586a75');
            gradient.addColorStop(.58,'#26343e');gradient.addColorStop(1,'#39342c');
            ctx.fillStyle=gradient;ctx.fillRect(0,0,512,256);
            for(const x of [32,186,352]){ctx.fillStyle='#edf4f1';ctx.fillRect(x,44,78,12);ctx.fillStyle='#9bb4c0';ctx.fillRect(x,60,78,6)}
            const source=new T.CanvasTexture(probe);source.encoding=T.sRGBEncoding;source.mapping=T.EquirectangularReflectionMapping;
            const generator=new T.PMREMGenerator(renderer),fallback=generator.fromEquirectangular(source);generator.dispose();source.dispose();
            scene.environment=fallback.texture;
            const pipeline=HiveRenderQuality.create(renderer,scene,camera,{quality:'high',environment:false});
            await pipeline.environmentReady;pipeline.render();renderer.getContext().finish();
            window.__hdrQA={renderer,scene,camera,pipeline,fallback,subject};
            return {before:pipeline.getDiagnostics(),camera:camera.position.toArray(),geometry:subject.geometry.type};
        }''')
        assert setup['before']['environment']['status'] == 'disabled'
        page.locator('#hdr-qa').screenshot(path=str(output / 'before-fallback.png'))
        after = page.evaluate('''async () => {
            const q=__hdrQA;await q.pipeline.loadEnvironment();q.pipeline.render();q.renderer.getContext().finish();
            return q.pipeline.getDiagnostics();
        }''')
        assert after['environment']['status'] == 'loaded' and after['environment']['applied'], after
        assert after['environment']['source'].endswith('.hdr')
        assert after['environment']['pmremWidth'] > 0 and after['environment']['pmremHeight'] > 0
        assert after['environment']['gpuBytes'] > 0
        page.locator('#hdr-qa').screenshot(path=str(output / 'after-hdr.png'))
        lifecycle = page.evaluate('''async () => {
            const q=__hdrQA,T=THREE;
            const shared=HiveRenderQuality.create(q.renderer,q.scene,q.camera,{quality:'high'});
            await shared.environmentReady;
            const target=q.scene.environment;
            const twoRefs=shared.getDiagnostics().environment;
            q.pipeline.setQuality('mobile');q.pipeline.setSize(800,600);
            const resized=q.pipeline.getDiagnostics().environment;
            q.pipeline.dispose();
            const retained=q.scene.environment===target&&shared.getDiagnostics().environment.refs===1;
            shared.render();q.renderer.getContext().finish();shared.dispose();
            const restored=q.scene.environment===q.fallback.texture;
            const disposedDuringLoad=HiveRenderQuality.create(q.renderer,q.scene,q.camera,{quality:'high'});
            const pending=disposedDuringLoad.environmentReady;disposedDuringLoad.dispose();await pending;
            const pendingRestored=q.scene.environment===q.fallback.texture;
            q.scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose()}});
            q.fallback.dispose();q.renderer.dispose();
            return {twoRefs,resized,retained,restored,pendingRestored};
        }''')
        assert lifecycle['twoRefs']['refs'] == 2 and lifecycle['twoRefs']['sceneRefs'] == 1
        assert lifecycle['resized']['status'] == 'loaded'
        assert lifecycle['retained'] and lifecycle['restored'] and lifecycle['pendingRestored'], lifecycle
        assert not errors, errors
        assert not external, external
        context.close()

        context = browser.new_context()
        page = context.new_page()
        failed_warnings = []
        page.on('console', lambda message: failed_warnings.append(message.text) if message.type == 'warning' else None)
        page.route('**/assets/environments/*.hdr', lambda route: route.abort())
        page.goto(url, wait_until='domcontentloaded')
        page.wait_for_function('() => !!(window.HiveRenderQuality && window.THREE?.RGBELoader)')
        failure = page.evaluate('''async () => {
            const T=THREE,renderer=new T.WebGLRenderer(),scene=new T.Scene(),camera=new T.PerspectiveCamera();
            renderer.setSize(32,32);const fallback=new T.Texture();scene.environment=fallback;
            const p=HiveRenderQuality.create(renderer,scene,camera);await p.environmentReady;
            const result={environment:p.getDiagnostics().environment,fallbackKept:scene.environment===fallback};
            p.dispose();fallback.dispose();renderer.dispose();return result;
        }''')
        assert failure['environment']['status'] == 'failed' and failure['environment']['error']
        assert failure['fallbackKept'] and any('[HIVE HDR]' in warning for warning in failed_warnings)
        context.close()
        browser.close()
    report = {'passed': 5, 'checks': ['Native local RGBE + PMREM loaded', 'Fixed-camera material before/after captured',
        'Shared renderer cache, resize and quality retain probe', 'Reference-counted dispose restores fallback, including pending load',
        'Failed HDR reports error/warning and preserves fallback'], 'setup': setup, 'after': after, 'lifecycle': lifecycle,
        'failure': failure, 'warnings': warnings, 'uncaught_errors': errors, 'external_requests': external}
    (output / 'diagnostics.json').write_text(json.dumps(report, indent=2))
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', default='http://127.0.0.1:8082/')
    parser.add_argument('--output', type=Path, default=ROOT / '.tools' / 'environment')
    parser.add_argument('--chromium', default=shutil.which('chromium') or '/usr/bin/chromium')
    args = parser.parse_args()
    result = run(args.url, args.output, args.chromium)
    print(json.dumps({'passed': result['passed'], 'checks': result['checks'], 'environment': result['after']['environment']}, indent=2))
