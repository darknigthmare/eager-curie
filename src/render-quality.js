/* HIVE ASCENSION — local linear rendering and restrained photographic finishing.
 * THREE r128, local RGBE HDR probe; no runtime CDN requests.
 *
 * const pipeline = HiveRenderQuality.create(renderer, scene, camera, {quality:'auto'});
 * pipeline.render(); pipeline.setSize(cssWidth, cssHeight);
 * pipeline.setQuality('auto'|'mobile'|'high'|'ultra');
 * await pipeline.environmentReady; // wait for local HDR + shared PMREM
 * pipeline.getDiagnostics(); pipeline.dispose();
 * Use {environment:false} to preserve a caller-owned studio environment.
 *
 * Scene shading happens in linear HDR when the GPU supports a renderable half
 * float target. ACES and sRGB conversion happen exactly once in the final pass.
 * Camera exposure is read from renderer.toneMappingExposure every frame.
 */
(() => {
  'use strict';

  const PROFILES = Object.freeze({
    mobile: Object.freeze({ pixelRatio: 1.25, scale: 0.85, shadowSize: 512, bloomScale: 0.25, bloom: 0.09, ao: 0, samples: 0 }),
    high: Object.freeze({ pixelRatio: 1.5, scale: 1, shadowSize: 1024, bloomScale: 0.5, bloom: 0.11, ao: 0.3, samples: 8 }),
    ultra: Object.freeze({ pixelRatio: 2, scale: 1, shadowSize: 2048, bloomScale: 0.5, bloom: 0.13, ao: 0.36, samples: 12 })
  });

  const ENVIRONMENT = Object.freeze({
    name: 'Empty Warehouse 01', license: 'CC0-1.0',
    source: 'assets/environments/empty-warehouse-01-1k.hdr',
    sourcePage: 'https://polyhaven.com/a/empty_warehouse_01',
    width: 1024, height: 512, bytes: 1672140, exposureStops: -2,
    sha256: '9b3d611cadc32c3a0c7e084ce5611c0650293881c4a041e7fa13748fe0dc6451'
  });
  // GPU targets belong to a renderer/context. Reference-counted scene bindings
  // prevent one preview pipeline from disposing another pipeline's light probe.
  const environmentCache = new WeakMap();

  function acquireEnvironment(renderer, scene) {
    let entry = environmentCache.get(renderer);
    if (!entry) {
      entry = { refs: 0, scenes: new Map(), status: 'pending', target: null,
        error: null, elapsedMs: null, released: false };
      environmentCache.set(renderer, entry);
      const started = performance.now();
      entry.ready = new Promise((resolve) => {
        const fail = (error) => {
          entry.status = 'failed';
          entry.error = error?.message || String(error?.type || error || 'Unknown HDR loading error');
          entry.elapsedMs = performance.now() - started;
          console.warn('[HIVE HDR] Local CC0 environment unavailable; keeping the existing light probe.', entry.error);
          resolve(entry);
        };
        if (typeof THREE.RGBELoader !== 'function') {
          fail(new Error('THREE.RGBELoader r128 is not loaded.'));
          return;
        }
        try {
          new THREE.RGBELoader().setDataType(THREE.UnsignedByteType).load(ENVIRONMENT.source, (source) => {
            let generator = null;
            try {
              if (entry.released) { entry.status = 'disposed'; resolve(entry); return; }
              // Calibrate the daylight capture to the station's existing key
              // and practical lights. Changing the RGBE exponent preserves its
              // relative radiance and highlight range; the source file remains
              // unchanged and no display-space filter is involved.
              const rgbe = source.image.data;
              for (let offset = 3; offset < rgbe.length; offset += 4) {
                if (rgbe[offset]) rgbe[offset] = Math.max(1, rgbe[offset] + ENVIRONMENT.exposureStops);
              }
              source.needsUpdate = true;
              source.mapping = THREE.EquirectangularReflectionMapping;
              generator = new THREE.PMREMGenerator(renderer);
              generator.compileEquirectangularShader();
              entry.target = generator.fromEquirectangular(source);
              entry.target.texture.name = 'CC0 Empty Warehouse 01 / local RGBE PMREM';
              entry.status = 'loaded';
              entry.elapsedMs = performance.now() - started;
              resolve(entry);
            } catch (error) { fail(error); }
            finally { source.dispose(); generator?.dispose(); }
          }, undefined, fail);
        } catch (error) { fail(error); }
      });
    }
    entry.refs += 1;
    let binding = entry.scenes.get(scene);
    if (!binding) {
      binding = { refs: 0, original: scene.environment };
      entry.scenes.set(scene, binding);
    }
    binding.refs += 1;
    return entry;
  }

  function releaseEnvironment(renderer, scene, entry) {
    const binding = entry.scenes.get(scene);
    if (binding && --binding.refs === 0) {
      if (scene.environment === entry.target?.texture) scene.environment = binding.original;
      entry.scenes.delete(scene);
    }
    entry.refs -= 1;
    if (entry.refs > 0) return;
    entry.released = true;
    entry.target?.dispose();
    entry.target = null;
    if (environmentCache.get(renderer) === entry) environmentCache.delete(renderer);
  }

  function environmentDiagnostics(entry, status) {
    const target = entry?.target;
    const type = target?.texture.type;
    const bytesPerChannel = type === THREE.FloatType ? 4 : type === THREE.HalfFloatType ? 2 : 1;
    return {
      ...ENVIRONMENT, status: status || entry?.status || 'disabled',
      inputFormat: 'Radiance RGBE / linear HDR, station calibration -2 EV',
      pmremWidth: target?.width || 0, pmremHeight: target?.height || 0,
      textureType: type === THREE.HalfFloatType ? 'HalfFloatType'
        : type === THREE.FloatType ? 'FloatType' : target ? 'UnsignedByteType' : null,
      gpuBytes: target ? target.width * target.height * 4 * bytesPerChannel : 0,
      refs: entry?.refs || 0, sceneRefs: entry?.scenes.size || 0,
      elapsedMs: entry?.elapsedMs ?? null, error: entry?.error || null,
      fallbackRetained: entry?.status === 'failed'
    };
  }

  const VERTEX = `varying vec2 vUv;
    void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`;
  const EXTRACT = `uniform sampler2D image;uniform vec2 texel;uniform float threshold;
    varying vec2 vUv;
    void main(){
      vec3 color=(texture2D(image,vUv+texel*vec2(-0.5,-0.5)).rgb+
        texture2D(image,vUv+texel*vec2(0.5,-0.5)).rgb+
        texture2D(image,vUv+texel*vec2(-0.5,0.5)).rgb+
        texture2D(image,vUv+texel*vec2(0.5,0.5)).rgb)*0.25;
      float brightness=max(max(color.r,color.g),color.b);
      float knee=threshold*0.5;
      float soft=clamp(brightness-threshold+knee,0.0,2.0*knee);
      soft=soft*soft/(4.0*knee+0.0001);
      float contribution=max(brightness-threshold,soft)/max(brightness,0.0001);
      gl_FragColor=vec4(color*contribution,1.0);
    }`;
  const BLUR = `uniform sampler2D image;uniform vec2 direction;varying vec2 vUv;
    void main(){
      vec3 color=texture2D(image,vUv).rgb*0.227027;
      color+=texture2D(image,vUv+direction*1.384615).rgb*0.316216;
      color+=texture2D(image,vUv-direction*1.384615).rgb*0.316216;
      color+=texture2D(image,vUv+direction*3.230769).rgb*0.070270;
      color+=texture2D(image,vUv-direction*3.230769).rgb*0.070270;
      gl_FragColor=vec4(color,1.0);
    }`;
  const FINAL = `
    uniform sampler2D image;uniform sampler2D bloomImage;uniform sampler2D depthImage;
    uniform vec2 texel;uniform mat4 inverseProjection;uniform float projectionScale;
    uniform float bloomStrength;uniform float aoStrength;uniform float aoSamples;
    uniform float depthAvailable;uniform float vignetteStrength;
    uniform float colorBackground;uniform vec3 backgroundColor;
    varying vec2 vUv;
    #include <tonemapping_pars_fragment>
    vec3 viewPosition(vec2 uv,float depth){
      vec4 p=inverseProjection*vec4(uv*2.0-1.0,depth*2.0-1.0,1.0);
      return p.xyz/p.w;
    }
    float contactOcclusion(){
      if(depthAvailable<0.5||aoStrength<0.001)return 1.0;
      float depth=texture2D(depthImage,vUv).x;
      if(depth>0.9999)return 1.0;
      vec3 center=viewPosition(vUv,depth);
      vec3 normal=normalize(cross(dFdx(center),dFdy(center)));
      if(dot(normal,-center)<0.0)normal=-normal;
      const float radius=1.35;
      float projectedRadius=clamp(radius*projectionScale/max(-center.z,0.05),texel.y*2.0,0.055);
      float occlusion=0.0;
      for(int i=0;i<12;i++){
        if(float(i)>=aoSamples)continue;
        float fi=float(i)+0.5;
        float angle=fi*2.39996323;
        float lengthScale=sqrt(fi/max(aoSamples,1.0));
        vec2 offset=vec2(cos(angle)*texel.x/texel.y,sin(angle))*projectedRadius*lengthScale;
        vec2 uv=vUv+offset;
        if(uv.x<=0.0||uv.x>=1.0||uv.y<=0.0||uv.y>=1.0)continue;
        float sampleDepth=texture2D(depthImage,uv).x;
        if(sampleDepth>0.9999)continue;
        vec3 delta=viewPosition(uv,sampleDepth)-center;
        float distanceToSample=length(delta);
        float horizon=max(dot(normal,delta)/max(distanceToSample,0.0001)-0.12,0.0);
        float rangeWeight=1.0-smoothstep(radius*0.2,radius,distanceToSample);
        occlusion+=horizon*rangeWeight;
      }
      return clamp(1.0-occlusion/max(aoSamples,1.0)*aoStrength*4.0,0.78,1.0);
    }
    vec3 antialiasedColor(){
      vec3 center=texture2D(image,vUv).rgb;
      vec3 north=texture2D(image,vUv+vec2(0.0,texel.y)).rgb;
      vec3 south=texture2D(image,vUv-vec2(0.0,texel.y)).rgb;
      vec3 east=texture2D(image,vUv+vec2(texel.x,0.0)).rgb;
      vec3 west=texture2D(image,vUv-vec2(texel.x,0.0)).rgb;
      vec3 luma=vec3(0.2126,0.7152,0.0722);
      float lc=dot(center,luma),ln=dot(north,luma),ls=dot(south,luma),le=dot(east,luma),lw=dot(west,luma);
      float range=max(max(ln,ls),max(le,lw))-min(min(ln,ls),min(le,lw));
      float blend=smoothstep(0.08,max(0.16,lc*0.55),range)*0.18;
      return mix(center,(north+south+east+west)*0.25,blend);
    }
    vec3 linearToDisplay(vec3 color){
      vec3 low=color*12.92;
      vec3 high=1.055*pow(max(color,vec3(0.0)),vec3(1.0/2.4))-0.055;
      return mix(high,low,step(color,vec3(0.0031308)));
    }
    void main(){
      // Three's Color backgrounds are clear colors specified in display space;
      // preserve their authored value instead of exposing them like lit surfaces.
      if(colorBackground>0.5&&depthAvailable>0.5&&texture2D(depthImage,vUv).x>0.99999){
        gl_FragColor=vec4(backgroundColor,1.0);return;
      }
      vec3 color=antialiasedColor()*contactOcclusion();
      color+=texture2D(bloomImage,vUv).rgb*bloomStrength;
      color=ACESFilmicToneMapping(max(color,vec3(0.0)));
      // Small saturation restraint preserves steel, skin and resin materials.
      float luminance=dot(color,vec3(0.2126,0.7152,0.0722));
      color=mix(vec3(luminance),color,0.965);
      vec2 corner=(vUv-0.5)*vec2(1.0,0.85);
      float vignette=1.0-vignetteStrength*smoothstep(0.14,0.48,dot(corner,corner));
      color*=vignette;
      gl_FragColor=vec4(linearToDisplay(clamp(color,0.0,1.0)),1.0);
    }`;

  function chooseAutoProfile() {
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    return coarse || Math.min(window.innerWidth, window.innerHeight) < 600 ? 'mobile' : 'high';
  }

  class RenderQuality {
    constructor(renderer, scene, camera, options = {}) {
      if (!renderer || !scene || !camera) throw new TypeError('RenderQuality requires a renderer, scene and camera.');
      this.renderer = renderer;
      this.scene = scene;
      this.camera = camera;
      this.disposed = false;
      this.originalPixelRatio = renderer.getPixelRatio();
      const size = renderer.getSize(new THREE.Vector2());
      this.width = Math.max(1, size.x);
      this.height = Math.max(1, size.y);
      this.shadowSizes = new Map();
      this.supportsDepth = renderer.capabilities.isWebGL2 || !!renderer.extensions.get('WEBGL_depth_texture');
      this.supportsDerivatives = renderer.capabilities.isWebGL2 || !!renderer.extensions.get('OES_standard_derivatives');
      this.supportsHDR = renderer.capabilities.isWebGL2
        ? !!renderer.extensions.get('EXT_color_buffer_float')
        : !!renderer.extensions.get('OES_texture_half_float') && !!renderer.extensions.get('EXT_color_buffer_half_float') && !!renderer.extensions.get('OES_texture_half_float_linear');
      this.textureType = this.supportsHDR ? THREE.HalfFloatType : THREE.UnsignedByteType;
      this.postScene = new THREE.Scene();
      this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
      this.quad.frustumCulled = false;
      this.postScene.add(this.quad);
      const material = (fragmentShader, uniforms, extensions = {}) => new THREE.ShaderMaterial({
        vertexShader: VERTEX, fragmentShader, uniforms, extensions,
        depthTest: false, depthWrite: false, toneMapped: false
      });
      this.extractMaterial = material(EXTRACT, {
        image: { value: null }, texel: { value: new THREE.Vector2() },
        threshold: { value: this.supportsHDR ? 1.15 : 0.78 }
      });
      this.blurMaterial = material(BLUR, { image: { value: null }, direction: { value: new THREE.Vector2() } });
      const finalShader = this.supportsDerivatives ? FINAL : FINAL.replace(/float contactOcclusion\(\)\{[\s\S]*?vec3 antialiasedColor/, 'float contactOcclusion(){return 1.0;}\nvec3 antialiasedColor');
      this.finalMaterial = material(finalShader, {
        image: { value: null }, bloomImage: { value: null }, depthImage: { value: null },
        texel: { value: new THREE.Vector2() }, inverseProjection: { value: new THREE.Matrix4() },
        projectionScale: { value: 1 }, toneMappingExposure: { value: 1 },
        bloomStrength: { value: 0.11 }, aoStrength: { value: 0.3 }, aoSamples: { value: 8 },
        depthAvailable: { value: this.supportsDepth ? 1 : 0 }, vignetteStrength: { value: 0.12 },
        colorBackground: { value: 0 }, backgroundColor: { value: new THREE.Color() }
      }, { derivatives: true });
      this.setQuality(options.quality || 'auto');
      this.lastSceneInfo = { calls: 0, triangles: 0, points: 0, lines: 0 };
      this.environmentEntry = null;
      this.environmentReady = options.environment === false
        ? Promise.resolve(environmentDiagnostics(null, 'disabled')) : this.loadEnvironment();
    }

    loadEnvironment() {
      if (this.disposed) return Promise.resolve(environmentDiagnostics(null, 'disposed'));
      if (this.environmentEntry) return this.environmentReady;
      const entry = acquireEnvironment(this.renderer, this.scene);
      this.environmentEntry = entry;
      this.environmentReady = entry.ready.then(() => {
        if (!this.disposed && this.environmentEntry === entry && entry.status === 'loaded') {
          this.scene.environment = entry.target.texture;
        }
        return environmentDiagnostics(entry, this.disposed ? 'disposed' : null);
      });
      return this.environmentReady;
    }

    createTarget(width, height, withDepth = false) {
      const target = new THREE.WebGLRenderTarget(width, height, {
        type: this.textureType, format: THREE.RGBAFormat,
        minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
        depthBuffer: withDepth, stencilBuffer: false,
        generateMipmaps: false
      });
      target.texture.encoding = THREE.LinearEncoding;
      target.texture.generateMipmaps = false;
      if (withDepth && this.supportsDepth) {
        target.depthTexture = new THREE.DepthTexture(width, height, THREE.UnsignedIntType);
        target.depthTexture.minFilter = THREE.NearestFilter;
        target.depthTexture.magFilter = THREE.NearestFilter;
      }
      return target;
    }

    setQuality(quality) {
      if (this.disposed) return;
      if (quality !== 'auto' && !PROFILES[quality]) throw new RangeError(`Unknown rendering quality: ${quality}`);
      const resolvedQuality = quality === 'auto' ? chooseAutoProfile() : quality;
      if (this.requestedQuality === quality && this.quality === resolvedQuality && this.colorTarget) return;
      this.requestedQuality = quality;
      this.quality = resolvedQuality;
      this.profile = PROFILES[this.quality];
      this.scene.traverse((object) => {
        if (!object.isLight || !object.shadow) return;
        if (!this.shadowSizes.has(object)) this.shadowSizes.set(object, object.shadow.mapSize.clone());
        this.resizeShadow(object, this.profile.shadowSize, this.profile.shadowSize);
      });
      this.finalMaterial.uniforms.bloomStrength.value = this.profile.bloom;
      this.finalMaterial.uniforms.aoSamples.value = this.profile.samples;
      this.setSize(this.width, this.height);
    }

    resizeShadow(light, width, height) {
      const shadow = light.shadow;
      if (shadow.mapSize.x === width && shadow.mapSize.y === height) return;
      shadow.mapSize.set(width, height);
      if (shadow.map) { shadow.map.dispose(); shadow.map = null; }
      if (shadow.mapPass) { shadow.mapPass.dispose(); shadow.mapPass = null; }
      shadow.needsUpdate = true;
    }

    setSize(width, height) {
      if (this.disposed) return;
      this.width = Math.max(1, Math.floor(width));
      this.height = Math.max(1, Math.floor(height));
      if (this.requestedQuality === 'auto' && chooseAutoProfile() !== this.quality) {
        this.setQuality('auto');
        return;
      }
      const ratio = Math.min(window.devicePixelRatio || 1, this.profile.pixelRatio) * this.profile.scale;
      this.renderer.setPixelRatio(ratio);
      this.renderer.setSize(this.width, this.height);
      const drawing = this.renderer.getDrawingBufferSize(new THREE.Vector2());
      const targetWidth = Math.max(1, Math.floor(drawing.x));
      const targetHeight = Math.max(1, Math.floor(drawing.y));
      const bloomWidth = Math.max(1, Math.floor(targetWidth * this.profile.bloomScale));
      const bloomHeight = Math.max(1, Math.floor(targetHeight * this.profile.bloomScale));
      if (!this.colorTarget) {
        this.colorTarget = this.createTarget(targetWidth, targetHeight, true);
        this.bloomA = this.createTarget(bloomWidth, bloomHeight);
        this.bloomB = this.createTarget(bloomWidth, bloomHeight);
      } else {
        this.colorTarget.setSize(targetWidth, targetHeight);
        this.bloomA.setSize(bloomWidth, bloomHeight);
        this.bloomB.setSize(bloomWidth, bloomHeight);
      }
      this.extractMaterial.uniforms.texel.value.set(1 / targetWidth, 1 / targetHeight);
      this.finalMaterial.uniforms.texel.value.set(1 / targetWidth, 1 / targetHeight);
      this.finalMaterial.uniforms.image.value = this.colorTarget.texture;
      this.finalMaterial.uniforms.bloomImage.value = this.bloomA.texture;
      this.finalMaterial.uniforms.depthImage.value = this.colorTarget.depthTexture || this.colorTarget.texture;
    }

    pass(material, target) {
      this.quad.material = material;
      this.renderer.setRenderTarget(target);
      this.renderer.render(this.postScene, this.postCamera);
    }

    render() {
      if (this.disposed) return;
      const renderer = this.renderer;
      const saved = {
        toneMapping: renderer.toneMapping, outputEncoding: renderer.outputEncoding,
        target: renderer.getRenderTarget(), autoClear: renderer.autoClear,
        exposure: renderer.toneMappingExposure
      };
      try {
        renderer.toneMapping = THREE.NoToneMapping;
        renderer.outputEncoding = THREE.LinearEncoding;
        renderer.autoClear = true;
        renderer.setRenderTarget(this.colorTarget);
        renderer.render(this.scene, this.camera);
        this.lastSceneInfo = { ...renderer.info.render };
        this.extractMaterial.uniforms.image.value = this.colorTarget.texture;
        this.pass(this.extractMaterial, this.bloomA);
        this.blurMaterial.uniforms.image.value = this.bloomA.texture;
        this.blurMaterial.uniforms.direction.value.set(1 / this.bloomA.width, 0);
        this.pass(this.blurMaterial, this.bloomB);
        this.blurMaterial.uniforms.image.value = this.bloomB.texture;
        this.blurMaterial.uniforms.direction.value.set(0, 1 / this.bloomA.height);
        this.pass(this.blurMaterial, this.bloomA);
        const uniforms = this.finalMaterial.uniforms;
        uniforms.colorBackground.value = this.scene.background?.isColor ? 1 : 0;
        if (this.scene.background?.isColor) uniforms.backgroundColor.value.copy(this.scene.background);
        uniforms.inverseProjection.value.copy(this.camera.projectionMatrixInverse);
        uniforms.projectionScale.value = this.camera.projectionMatrix.elements[5] * 0.5;
        uniforms.toneMappingExposure.value = Math.max(0, saved.exposure);
        uniforms.aoStrength.value = this.camera.near < 0.05 ? 0 : this.profile.ao;
        this.pass(this.finalMaterial, saved.target);
      } finally {
        renderer.setRenderTarget(saved.target);
        renderer.toneMapping = saved.toneMapping;
        renderer.outputEncoding = saved.outputEncoding;
        renderer.autoClear = saved.autoClear;
      }
    }

    getDiagnostics() {
      return {
        requestedQuality: this.requestedQuality, quality: this.quality,
        hdr: this.supportsHDR, depthContacts: this.supportsDepth && this.supportsDerivatives && this.profile.ao > 0,
        pixelRatio: this.renderer.getPixelRatio(), renderScale: this.profile.scale,
        width: this.colorTarget.width, height: this.colorTarget.height,
        bloomWidth: this.bloomA.width, bloomHeight: this.bloomA.height,
        shadowSize: this.profile.shadowSize, bloomStrength: this.profile.bloom,
        aoSamples: this.profile.samples, passes: 5, disposed: this.disposed,
        scene: { ...this.lastSceneInfo },
        sceneDrawCalls: this.lastSceneInfo.calls, sceneTriangles: this.lastSceneInfo.triangles,
        memory: { ...this.renderer.info.memory },
        environment: {
          ...environmentDiagnostics(this.environmentEntry, this.disposed ? 'disposed' : null),
          applied: !!this.environmentEntry?.target && this.scene.environment === this.environmentEntry.target.texture
        }
      };
    }

    dispose() {
      if (this.disposed) return;
      this.disposed = true;
      if (this.environmentEntry) {
        releaseEnvironment(this.renderer, this.scene, this.environmentEntry);
        this.environmentEntry = null;
      }
      this.colorTarget.dispose(); this.bloomA.dispose(); this.bloomB.dispose();
      this.extractMaterial.dispose(); this.blurMaterial.dispose(); this.finalMaterial.dispose();
      this.quad.geometry.dispose();
      this.shadowSizes.forEach((size, light) => this.resizeShadow(light, size.x, size.y));
      this.shadowSizes.clear();
      this.renderer.setPixelRatio(this.originalPixelRatio);
      this.renderer.setSize(this.width, this.height);
    }
  }

  window.HiveRenderQuality = Object.freeze({
    profiles: PROFILES,
    environment: ENVIRONMENT,
    create(renderer, scene, camera, options) { return new RenderQuality(renderer, scene, camera, options); }
  });
})();
