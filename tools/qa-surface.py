#!/usr/bin/env python3
"""Native-CSP PBR surface diagnostics and matched enabled/disabled captures.
The game script is instrumented only to expose its existing renderer. No
rendering or gameplay logic is replaced. Requires Playwright, Pillow, Chromium.
"""
import argparse
import base64
import io
import json
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
from PIL import Image, ImageChops, ImageStat


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url',default='http://127.0.0.1:8082')
    parser.add_argument('--output',type=Path,default=Path('/tmp/hive-surface-qa'))
    args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
    root=Path(__file__).resolve().parents[1]
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,
            args=['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader'])
        page=browser.new_page(viewport={'width':640,'height':640})
        errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
        page.on('console',lambda message:errors.append(message.text) if message.type=='error' else None)
        def expose(route):
            source=(root/'src/game.js').read_text();position=source.rfind('})();')
            route.fulfill(body=source[:position]+'window.__surfaceQA={rendererEngine};\n'+source[position:],content_type='application/javascript')
        page.route('**/src/game.js*',expose)
        page.goto(args.url.rstrip('/')+'/',wait_until='domcontentloaded')
        page.wait_for_function('() => !!(window.gameInstance && window.HiveSurfaceDetail)')
        page.evaluate('async()=>{await HiveModelFactory.loadTextures();gameInstance.isRunning=false}')
        page.evaluate('''()=>{
            const T=THREE,e=__surfaceQA.rendererEngine,r=e.renderer;
            r.setPixelRatio(1);r.setSize(640,640);r.toneMapping=T.ACESFilmicToneMapping;r.outputEncoding=T.sRGBEncoding;r.toneMappingExposure=1.15;
            const scene=new T.Scene();scene.background=new T.Color(0x11151b);scene.environment=e.scene.environment;
            scene.add(new T.HemisphereLight(0xdde3e8,0x4c4036,.9));
            const key=new T.DirectionalLight(0xfff0dd,3.0);key.position.set(4,6,7);scene.add(key);
            const rim=new T.DirectionalLight(0xb4c9dd,1.4);rim.position.set(-5,3,-6);scene.add(rim);
            const camera=new T.PerspectiveCamera(34,1,.1,40);camera.position.set(3.3,2.1,5.1);camera.lookAt(0,0,0);
            const geometry=new T.SphereGeometry(1.25,64,48);geometry.setAttribute('uv2',geometry.attributes.uv.clone());
            const mesh=new T.Mesh(geometry);mesh.scale.set(1,1.15,1);scene.add(mesh);
            window.__surfaceStudio={scene,camera,geometry,mesh,r};
        }''')
        results=[]
        for kind in ['chitin','resin','opaque_resin','skin','fabric','industrial']:
            capture=page.evaluate('''kind=>{
                const s=__surfaceStudio,F=HiveModelFactory,D=HiveSurfaceDetail;
                if(s.mesh.material&&s.mesh.material.userData.hiveMaterialKind)s.mesh.material.dispose();
                const type=kind==='opaque_resin'?'resin':kind;
                const material=F._material(type,kind==='opaque_resin'?{color:0x728586,opacity:1,transparent:false}:undefined);s.mesh.material=material;
                D.apply(material,type);const key=material.customProgramCacheKey();D.apply(material,type);
                const idempotent=key===material.customProgramCacheKey();
                D.setEnabled(material,false);s.r.render(s.scene,s.camera);const before=s.r.domElement.toDataURL();
                D.setEnabled(material,true);s.r.render(s.scene,s.camera);const after=s.r.domElement.toDataURL();
                const diagnostics=D.getDiagnostics(material);
                const clone=material.clone();D.apply(clone,type);s.mesh.material=clone;s.r.render(s.scene,s.camera);
                const cloneCompiled=D.getDiagnostics(clone).compiled;clone.dispose();s.mesh.material=material;
                return {before,after,idempotent,cloneCompiled,diagnostics,error:s.r.getContext().getError()};
            }''',kind)
            images=[]
            for label in ['before','after']:
                image=Image.open(io.BytesIO(base64.b64decode(capture[label].split(',',1)[1]))).convert('RGB')
                image.save(args.output/f'{kind}-{label}.png');images.append(image)
            change=sum(ImageStat.Stat(ImageChops.difference(*images)).mean)/3
            assert change>.15,(kind,change)
            assert capture['idempotent'] and capture['cloneCompiled'] and capture['error']==0,capture
            assert capture['diagnostics']['compiled'],capture
            assert capture['diagnostics']['albedoEncoding']==3001,capture
            assert capture['diagnostics']['normalEncoding']==3000,capture
            results.append({'kind':kind,'mean_pixel_change':change,**{k:v for k,v in capture.items() if k not in ('before','after')}})
        palettes=page.evaluate('''()=>{
            const T=THREE,F=HiveModelFactory,D=HiveSurfaceDetail;
            const acid=F._material('resin',{color:0xb0c96e,emissive:0x425718,emissiveIntensity:.36,opacity:.94});
            const pod=F._material('resin',{color:0x3b1747,emissive:0x4c1d95,emissiveIntensity:.44});
            const intact=acid.color.equals(new T.Color(0xb0c96e))&&pod.color.equals(new T.Color(0x3b1747));
            const excluded=!D.getDiagnostics(acid).opaqueTissue&&!D.getDiagnostics(pod).opaqueTissue;
            acid.dispose();pod.dispose();return {intact,excluded};
        }''')
        assert palettes['intact'] and palettes['excluded'],palettes
        async_map=page.evaluate('''async()=>{
            const T=THREE,s=__surfaceStudio,D=HiveSurfaceDetail;
            const material=new T.MeshPhysicalMaterial({color:0x263b45,roughness:.4});
            D.apply(material,'chitin');s.mesh.material=material;s.r.render(s.scene,s.camera);
            const key=material.customProgramCacheKey();
            material.normalMap=await new T.TextureLoader().loadAsync('assets/textures/carapace-normal.png');
            material.normalScale.setScalar(.55);D.apply(material,'chitin');material.needsUpdate=true;
            s.r.render(s.scene,s.camera);const enabled=D.getDiagnostics(material);
            D.setEnabled(material,false);const restored=material.normalScale.x===.55;
            const stable=key===material.customProgramCacheKey(),error=s.r.getContext().getError();
            material.normalMap.dispose();material.dispose();return {enabled,restored,stable,error};
        }''')
        assert async_map['restored'] and async_map['stable'] and async_map['error']==0,async_map
        instanced=page.evaluate('''()=>{
            const T=THREE,s=__surfaceStudio,m=HiveModelFactory._material('chitin');
            const instances=new T.InstancedMesh(s.geometry,m,2),matrix=new T.Matrix4();
            matrix.makeScale(.38,.6,.45);matrix.setPosition(-.7,0,0);instances.setMatrixAt(0,matrix);
            matrix.makeScale(.5,.45,.35);matrix.setPosition(.7,0,0);instances.setMatrixAt(1,matrix);
            s.mesh.visible=false;s.scene.add(instances);s.r.render(s.scene,s.camera);
            const result={error:s.r.getContext().getError(),compiled:HiveSurfaceDetail.getDiagnostics(m).compiled};
            s.scene.remove(instances);s.mesh.visible=true;m.dispose();return result;
        }''')
        assert instanced['error']==0 and instanced['compiled'],instanced
        fallback=page.evaluate('''()=>{
            const T=THREE,s=__surfaceStudio,canvas=document.createElement('canvas'),context=canvas.getContext('webgl');
            if(!context)throw Error('WebGL1 unavailable');
            const r=new T.WebGLRenderer({canvas,context});r.setSize(96,96);
            const material=HiveModelFactory._material('chitin');s.mesh.material=material;
            r.render(s.scene,s.camera);const diagnostics=HiveSurfaceDetail.getDiagnostics(material),error=context.getError();
            material.dispose();r.dispose();return {diagnostics,error};
        }''')
        assert fallback['error']==0 and fallback['diagnostics']['compiled'],fallback
        assert not errors,errors
        report={'surfaces':results,'preserved_palettes':palettes,'async_map':async_map,'instancing':instanced,'webgl1':fallback,'errors':errors}
        (args.output/'diagnostics.json').write_text(json.dumps(report,indent=2)+'\n')
        print(json.dumps(report,indent=2));print('PASS: 6 matched material comparisons; acid/pod palettes preserved;, clones/cache, asynchronous maps, instancing, native CSP, WebGL1')
        browser.close()


if __name__=='__main__':main()
