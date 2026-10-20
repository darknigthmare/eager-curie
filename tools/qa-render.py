#!/usr/bin/env python3
"""Render-pipeline contract/visual checks using a small deterministic WebGL scene.
Requires Python Playwright, Pillow and Chromium. Uses only local runtime assets.
"""
import argparse
import base64
import io
import json
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
from PIL import Image, ImageStat, ImageChops


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=Path('/tmp/hive-render-qa'))
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    repository = Path(__file__).resolve().parents[1]
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=shutil.which('chromium'), headless=True,
            args=['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'])
        page = browser.new_page(viewport={'width': 512, 'height': 384})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('console', lambda message: errors.append(message.text) if message.type == 'error' else None)
        page.set_content('<style>body{margin:0;background:#090c10}canvas{display:block}</style>')
        page.add_script_tag(path=str(repository / 'assets/vendor/three.r128.min.js'))
        page.add_script_tag(path=str(repository / 'src/render-quality.js'))
        result = page.evaluate('''() => {
            const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
            renderer.setSize(512,384); renderer.outputEncoding=THREE.sRGBEncoding;
            renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05;
            renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
            document.body.appendChild(renderer.domElement);
            const scene=new THREE.Scene(); scene.background=new THREE.Color(0x131b24);
            const camera=new THREE.PerspectiveCamera(45,512/384,.1,100);
            camera.position.set(7,6,9); camera.lookAt(0,1,0);
            scene.add(new THREE.HemisphereLight(0xc3d6e8,0x3a3024,.8));
            const sun=new THREE.DirectionalLight(0xffefdc,2.4); sun.position.set(4,8,2);
            sun.castShadow=true; sun.shadow.camera.left=-8; sun.shadow.camera.right=8;
            sun.shadow.camera.top=8; sun.shadow.camera.bottom=-8; scene.add(sun);
            const ground=new THREE.Mesh(new THREE.PlaneGeometry(20,20),new THREE.MeshStandardMaterial({color:0x555e64,roughness:.7,metalness:.15}));
            ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);
            for(const [x,color,metalness,roughness] of [[-2,0x8e979d,.8,.3],[0,0x768c7b,.15,.6],[2,0xa77c57,.35,.45]]){
                const ball=new THREE.Mesh(new THREE.SphereGeometry(1,32,20),new THREE.MeshStandardMaterial({color,metalness,roughness}));
                ball.position.set(x,1,0); ball.castShadow=true; ball.receiveShadow=true; scene.add(ball);
            }
            const strip=new THREE.Mesh(new THREE.BoxGeometry(4,.1,.15),new THREE.MeshStandardMaterial({color:0xdfe9f4,emissive:0xdfe9f4,emissiveIntensity:4}));
            strip.position.set(0,.15,-2); scene.add(strip);
            renderer.render(scene,camera);
            const before=renderer.domElement.toDataURL();
            const pipeline=HiveRenderQuality.create(renderer,scene,camera,{quality:'high'});
            pipeline.render(); const after=renderer.domElement.toDataURL();
            const tests=[];
            const check=(name,pass,detail)=>{tests.push({name,pass,detail});if(!pass)throw Error(name+': '+JSON.stringify(detail))};
            check('preserves renderer tone mapping and output',renderer.toneMapping===THREE.ACESFilmicToneMapping&&renderer.outputEncoding===THREE.sRGBEncoding);
            check('retains scene geometry metrics',pipeline.getDiagnostics().sceneDrawCalls>=5&&pipeline.getDiagnostics().sceneTriangles>1000,pipeline.getDiagnostics());
            const target=pipeline.colorTarget; pipeline.setQuality('high');
            check('repeated profile does not reallocate render target',pipeline.colorTarget===target);
            for(const profile of ['mobile','high','ultra','auto']){
                pipeline.setQuality(profile); pipeline.render(); const d=pipeline.getDiagnostics();
                check('profile '+profile,d.quality===profile||profile==='auto',d);
                check('no WebGL error '+profile,renderer.getContext().getError()===0);
            }
            pipeline.setSize(320,240); pipeline.render();
            check('resize tracks physical render buffer',pipeline.getDiagnostics().width===renderer.domElement.width&&pipeline.getDiagnostics().height===renderer.domElement.height);
            let rejected=false;try{pipeline.setQuality('invalid')}catch(error){rejected=error instanceof RangeError}
            check('rejects invalid quality',rejected);
            pipeline.dispose(); pipeline.dispose();
            renderer.render(scene,camera);
            check('dispose restores direct rendering',renderer.getContext().getError()===0&&pipeline.disposed&&sun.shadow.mapSize.x===512);
            const fallbackCanvas=document.createElement('canvas');
            const webgl1=fallbackCanvas.getContext('webgl');
            if(webgl1){
                const legacyRenderer=new THREE.WebGLRenderer({canvas:fallbackCanvas,context:webgl1});
                legacyRenderer.setSize(64,64);
                const fallback=HiveRenderQuality.create(legacyRenderer,scene,camera,{quality:'mobile'});
                fallback.render();
                check('WebGL1 fallback renders without GL errors',webgl1.getError()===0,fallback.getDiagnostics());
                fallback.dispose(); legacyRenderer.dispose();
            }
            return {tests,before,after};
        }''')
        images=[]
        for name in ('before', 'after'):
            image=Image.open(io.BytesIO(base64.b64decode(result[name].split(',',1)[1]))).convert('RGB')
            image.save(args.output / f'{name}.png')
            images.append(image)
        before_luma=sum(ImageStat.Stat(images[0]).mean)/3
        after_luma=sum(ImageStat.Stat(images[1]).mean)/3
        change=sum(ImageStat.Stat(ImageChops.difference(*images)).mean)/3
        assert .65 < after_luma / before_luma < 1.4, (before_luma, after_luma)
        assert change > .1, 'Finishing pass must affect rendered image'
        assert not errors, errors
        print(json.dumps({'checks':result['tests'],'before_mean':before_luma,'after_mean':after_luma,'mean_pixel_change':change,'errors':errors},indent=2))
        print(f"PASS: {len(result['tests'])} rendering checks; images: {args.output}")
        browser.close()


if __name__ == '__main__':
    main()
