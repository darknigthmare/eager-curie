/* HIVE ASCENSION — scale-aware material finishing for the local PBR maps.
 * Load before models.js; call HiveSurfaceDetail.apply(material, kind) after map
 * assignment, including asynchronous refresh and explicitly cloned materials.
 * Authored albedo/normal/roughness/AO maps remain authoritative. This adds no
 * color-map fetches: anatomical macrofolds use object-space arithmetic and a
 * view-space surface-gradient bump, composed after the tangent-space normal.
 */
(function exposeSurfaceDetail(global) {
  'use strict';
  const VERSION = 'hive-surface-v3-anatomical';
  const states = new WeakMap();
  const PROFILES = Object.freeze({
    chitin: { kind: 1, scale: 1, bump: 0.0007, normal: 0.74 },
    chitinWarm: { kind: 1, scale: 1, bump: 0.0007, normal: 0.74 },
    resin: { kind: 2, scale: 1, bump: 0.0018, normal: 0.72 },
    skin: { kind: 3, scale: 1, bump: 0.00015, normal: 0.58 },
    fabric: { kind: 4, scale: 1, bump: 0.00012, normal: 0.9 },
    industrial: { kind: 5, scale: 1, bump: 0.00008, normal: 0.7 },
    darkMetal: { kind: 5, scale: 1, bump: 0.00008, normal: 0.7 },
    bone: { kind: 6, scale: 1, bump: 0.0004, normal: 0.65 }
  });

  const FRAGMENT = `
    varying vec3 vHiveSurfacePosition;
    uniform float hiveSurfaceAmount;
    uniform float hiveSurfaceKind;
    uniform float hiveSurfaceBump;
    uniform float hiveOpaqueTissue;
    uniform float hiveRoughnessFloor;
    const float HIVE_TAU=6.28318530718;
    float hiveFilteredWave(float phase){
      float visible=1.0-smoothstep(0.55,2.4,fwidth(phase));
      return sin(phase)*visible;
    }
    // x: pigment multiplier; y: roughness delta; z: geometric height in metres.
    // These are low/mid frequency anatomical folds, not a replacement for the
    // much finer pores, fibres and scratches in the authored texture set.
    vec3 hiveSurfaceProperties(vec3 p){
      float broad=sin(p.x*1.7+p.z*0.8)*sin(p.y*2.1-p.z*1.2);
      if(hiveSurfaceKind<1.5){
        float phase=p.y*19.0+sin(p.x*3.6+p.z*1.7)*1.8+sin(p.z*4.1-p.x*1.2)*1.2;
        float wave=hiveFilteredWave(phase);
        float envelope=0.35+0.65*pow(0.5+0.5*sin(p.x*5.7+p.z*3.3),2.0);
        float overlap=pow(max(0.0,wave),3.0)*envelope;
        float seam=pow(max(0.0,-wave),8.0)*envelope;
        return vec3(0.97+0.035*broad-0.035*seam,0.045*seam-0.025*overlap,
          (overlap-0.25)*hiveSurfaceBump);
      }
      if(hiveSurfaceKind<2.5){
        float phase=p.y*12.0+sin(p.x*4.3+p.z*2.6)*0.8;
        float fold=hiveFilteredWave(phase);
        float tendon=pow(max(0.0,hiveFilteredWave(p.x*16.0+p.z*11.0)),4.0);
        return vec3(0.98+0.035*broad-0.035*tendon,0.035*tendon,(fold*0.45+tendon*0.3)*hiveSurfaceBump);
      }
      if(hiveSurfaceKind<3.5){
        float fold=pow(max(0.0,hiveFilteredWave(p.y*34.0+sin(p.x*13.0)*0.7+p.z*4.0)),10.0);
        return vec3(0.995+0.016*broad-0.004*fold,0.015*broad+0.006*fold,-fold*hiveSurfaceBump);
      }
      if(hiveSurfaceKind<4.5){
        float warp=hiveFilteredWave(p.x*1600.0+p.z*210.0);
        float weft=hiveFilteredWave(p.y*1600.0+p.z*190.0);
        float crossing=warp*weft;
        return vec3(0.98+0.035*crossing,0.025+0.035*crossing,crossing*hiveSurfaceBump);
      }
      if(hiveSurfaceKind<5.5){
        float brushed=hiveFilteredWave(p.y*1800.0+sin(p.z*7.0)*0.2);
        float residue=pow(max(0.0,sin(p.x*5.2+p.z*2.9)),8.0)*
          (0.35+0.65*pow(0.5+0.5*sin(p.y*1.7),2.0));
        return vec3(0.98+0.018*brushed-0.055*residue,
          0.028*brushed+0.025*broad-0.045*residue,brushed*hiveSurfaceBump);
      }
      float grain=hiveFilteredWave(p.y*31.0+sin(p.x*7.0)*0.3);
      return vec3(0.985+0.025*broad,0.025*grain,grain*hiveSurfaceBump);
    }
    vec3 hiveSurfaceGradient(vec3 viewPosition,vec3 surfaceNormal,float height,float side){
      vec3 dx=dFdx(viewPosition),dy=dFdy(viewPosition);
      vec3 r1=cross(dy,surfaceNormal),r2=cross(surfaceNormal,dx);
      float determinant=dot(dx,r1)*side;
      vec3 gradient=sign(determinant)*(dFdx(height)*r1+dFdy(height)*r2);
      // The entire calculation is in view space, exactly like Three's native
      // derivative bump mapping. No object-space normal is mistaken for a
      // world/view-space normal; nonuniform scaling and instances remain safe.
      return normalize(max(abs(determinant),0.00000001)*surfaceNormal-gradient);
    }
  `;

  function isOpaqueTissue(material, kind) {
    return kind === 'resin' && !material.transparent && material.opacity >= 0.99 &&
      (!material.emissive || material.emissive.r + material.emissive.g + material.emissive.b < 0.001);
  }

  function tintFor(material, kind) {
    const color = material.color.clone();
    if (material.userData.hiveSurfaceStyle?.preservePigment) return color;
    if (kind === 'skin') {
      // The skin map already contains pigmentation. An orange material tint
      // multiplied over it produces doubled red/brown rather than natural skin.
      color.lerp(new global.THREE.Color(0.84, 0.81, 0.75), 0.65);
    } else if (kind === 'chitin' || kind === 'chitinWarm') {
      // A practical creature suit is a dark dielectric with wet reflections,
      // not pale aluminium. Preserve the authored caste hue while avoiding
      // the previous forced 0.58+ multiplier that washed every dome blue-grey.
      const value = Math.max(0.14, Math.min(0.30, Math.max(color.r, color.g, color.b)));
      const neutral = kind === 'chitin'
        ? new global.THREE.Color(value * 0.9, value * 0.97, value)
        : new global.THREE.Color(value, value * 0.91, value * 0.76);
      color.lerp(neutral, 0.68);
    } else if (isOpaqueTissue(material, kind)) {
      // Resin has its own umber/olive albedo. Keep explicitly authored acid,
      // translucent membranes and signalling materials outside this remap.
      const value = Math.max(0.19, Math.min(0.39, Math.max(color.r, color.g, color.b)));
      color.lerp(new global.THREE.Color(value, value * 0.94, value * 0.79), 0.62);
    }
    return color;
  }

  function applyState(material, state) {
    const enabled = state.amount.value > 0;
    material.color.copy(enabled ? state.color : state.original.color);
    if (state.profile.kind <= 3) material.metalness = enabled ? state.metalness : state.original.metalness;
    if (material.isMeshPhysicalMaterial) {
      material.clearcoat = enabled ? state.clearcoat : state.original.clearcoat;
      material.clearcoatRoughness = enabled ? state.clearcoatRoughness : state.original.clearcoatRoughness;
      if (enabled && material.normalMap) {
        material.clearcoatNormalMap = material.normalMap;
        material.clearcoatNormalScale.setScalar(state.profile.normal * 0.48);
      } else {
        material.clearcoatNormalMap = state.original.clearcoatNormalMap;
        material.clearcoatNormalScale.copy(state.original.clearcoatNormalScale);
      }
    }
    if (material.normalMap) material.normalScale.setScalar(enabled ? state.profile.normal : state.original.normalScale.x);
    const style = state.style;
    state.roughnessFloor.value = enabled && Number.isFinite(style?.roughnessFloor) ? style.roughnessFloor : 0;
    if (!style) return;
    if (enabled) {
      if (style.preservePigment) material.color.copy(state.original.color);
      if (style.color !== undefined) material.color.set(style.color);
      for (const key of ['roughness', 'metalness', 'clearcoat', 'clearcoatRoughness']) {
        if (Number.isFinite(style[key]) && key in material) material[key] = style[key];
      }
      if (material.normalMap && Number.isFinite(style.normalScale)) {
        material.normalScale.setScalar(style.normalScale);
        if (material.clearcoatNormalMap) material.clearcoatNormalScale.setScalar(style.normalScale * 0.35);
      }
    } else {
      if (Number.isFinite(style.roughness)) material.roughness = material.roughnessMap ? 1 : state.original.roughness;
      for (const key of ['metalness', 'clearcoat', 'clearcoatRoughness']) {
        if (Number.isFinite(style[key]) && Number.isFinite(state.original[key])) material[key] = state.original[key];
      }
    }
  }

  function apply(material, kind) {
    const profile = PROFILES[kind];
    if (!profile || !material?.isMeshStandardMaterial || !material.color) return material;
    let state = states.get(material);
    if (state) {
      if (material.normalMap !== state.lastNormalMap) {
        state.original.normalScale.copy(material.normalScale);
        state.lastNormalMap = material.normalMap;
      }
      applyState(material, state);
      return material;
    }
    const original = {
      color: material.color.clone(), normalScale: material.normalScale.clone(), metalness: material.metalness, roughness: material.roughness,
      clearcoat: material.clearcoat, clearcoatRoughness: material.clearcoatRoughness,
      clearcoatNormalMap: material.clearcoatNormalMap,
      clearcoatNormalScale: material.clearcoatNormalScale?.clone(),
      onBeforeCompile: material.onBeforeCompile,
      customProgramCacheKey: material.customProgramCacheKey
    };
    const opaqueTissue = isOpaqueTissue(material, kind);
    const surfaceProfile = opaqueTissue ? Object.assign({}, profile, { normal: 0.16, bump: 0.0002 }) : profile;
    state = {
      profile: surfaceProfile, original, kind, opaqueTissue, amount: { value: 1 }, color: tintFor(material, kind),
      metalness: Math.min(material.metalness, kind === 'skin' ? 0 : (kind === 'resin' ? 0.025 : 0.045)),
      clearcoat: profile.kind === 1 ? Math.max(0.56, Math.min(0.76, material.clearcoat || 0))
        : Math.min(material.clearcoat || 0, opaqueTissue ? 0.28 : (kind === 'skin' ? 0.13 : (kind === 'resin' ? 0.48 : 0.24))),
      clearcoatRoughness: profile.kind === 1 ? 0.17
        : Math.max(material.clearcoatRoughness || 0, kind === 'skin' ? 0.52 : (opaqueTissue ? 0.32 : 0.3)),
      compiled: false, derivativeSupported: true, lastNormalMap: material.normalMap,
      style: material.userData.hiveSurfaceStyle || null, roughnessFloor: { value: 0 }
    };
    states.set(material, state);
    material.extensions = Object.assign({}, material.extensions, { derivatives: true });
    material.onBeforeCompile = function surfaceCompile(shader, renderer) {
      original.onBeforeCompile.call(this, shader, renderer);
      state.derivativeSupported = renderer.capabilities.isWebGL2 || !!renderer.extensions.get('OES_standard_derivatives');
      if (!state.derivativeSupported) return;
      shader.uniforms.hiveSurfaceAmount = state.amount;
      shader.uniforms.hiveSurfaceKind = { value: state.profile.kind };
      shader.uniforms.hiveSurfaceBump = { value: state.profile.bump };
      shader.uniforms.hiveOpaqueTissue = { value: state.opaqueTissue ? 1 : 0 };
      shader.uniforms.hiveRoughnessFloor = state.roughnessFloor;
      shader.vertexShader = shader.vertexShader.replace('#include <common>',
        '#include <common>\nvarying vec3 vHiveSurfacePosition;\nuniform float hiveSurfaceAmount;');
      shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `
        #include <project_vertex>
        vec3 hiveObjectScale=vec3(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz),length(modelMatrix[2].xyz));
        #ifdef USE_INSTANCING
          hiveObjectScale*=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));
        #endif
        #ifdef USE_SKINNING
          // Anatomy is sampled in bind coordinates. Using the deformed point
          // makes a pore/tendon pattern swim while a shoulder bends.
          vHiveSurfacePosition=position*hiveObjectScale;
        #else
          vHiveSurfacePosition=transformed*hiveObjectScale;
        #endif
      `);
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\n' + FRAGMENT);
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
        #include <map_fragment>
        vec3 hiveSurface=hiveSurfaceProperties(vHiveSurfacePosition);
        diffuseColor.rgb*=mix(1.0,hiveSurface.x,hiveSurfaceAmount);
      `);
      shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', `
        #include <roughnessmap_fragment>
        float hiveMinimumRoughness=(hiveSurfaceKind<1.5?0.22:(hiveSurfaceKind<2.5?0.19:(hiveSurfaceKind<3.5?0.32:0.16)))*hiveSurfaceAmount;
        roughnessFactor=clamp(roughnessFactor+hiveSurface.y*hiveSurfaceAmount,hiveMinimumRoughness,1.0);
        roughnessFactor=max(roughnessFactor,0.36*hiveOpaqueTissue*hiveSurfaceAmount);
        roughnessFactor=max(roughnessFactor,hiveRoughnessFloor*hiveSurfaceAmount);
      `);
      shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', `
        #include <normal_fragment_maps>
        normal=hiveSurfaceGradient(-vViewPosition,normal,hiveSurface.z*hiveSurfaceAmount,faceDirection);
      `);
      state.compiled = true;
    };
    material.customProgramCacheKey = function surfaceCacheKey() {
      return original.customProgramCacheKey.call(this) + '|' + VERSION;
    };
    material.userData.hiveSurfaceDetail = { version: VERSION, kind, mapping: 'object-space-folds+tangent-PBR' };
    applyState(material, state);
    material.needsUpdate = true;
    return material;
  }

  global.HiveSurfaceDetail = Object.freeze({
    apply,
    // A small anatomical calibration layer, retained when maps arrive later.
    // It changes no geometry, skinning flag, texture ownership or shader pass.
    setStyle(material, style = {}) {
      if (!material?.isMeshStandardMaterial) return material;
      const next = {};
      if (style.preservePigment === true) next.preservePigment = true;
      if (typeof style.color === 'number' && Number.isFinite(style.color)) next.color = style.color;
      for (const key of ['roughness', 'roughnessFloor', 'metalness', 'clearcoat', 'clearcoatRoughness', 'normalScale']) {
        if (Number.isFinite(style[key])) next[key] = Math.max(0, Math.min(key === 'normalScale' ? 2 : 1, style[key]));
      }
      material.userData.hiveSurfaceStyle = next;
      if (!states.has(material)) apply(material, material.userData.hiveMaterialKind);
      const state = states.get(material);
      if (state) { state.style = next; applyState(material, state); }
      return material;
    },
    getAuthoredColor(material, target) {
      const original = states.get(material)?.original.color || material?.color;
      return original ? (target || original.clone()).copy(original) : null;
    },
    setEnabled(material, enabled) {
      const state = states.get(material);
      if (!state) return;
      state.amount.value = enabled ? 1 : 0;
      const hadClearcoatNormal = !!material.clearcoatNormalMap;
      applyState(material, state);
      if (hadClearcoatNormal !== !!material.clearcoatNormalMap) material.needsUpdate = true;
    },
    getDiagnostics(material) {
      const state = states.get(material);
      if (!state) return { applied: false };
      return {
        applied: true, kind: state.kind, opaqueTissue: state.opaqueTissue, enabled: state.amount.value > 0,
        compiled: state.compiled, derivatives: state.derivativeSupported,
        mapping: 'scaled-object-space folds; native tangent-space authored normal',
        additionalTextureSamples: material.clearcoatNormalMap ? 1 : 0,
        albedoEncoding: material.map?.encoding ?? null,
        normalEncoding: material.normalMap?.encoding ?? null,
        roughnessEncoding: material.roughnessMap?.encoding ?? null,
        normalScale: material.normalScale.toArray(), color: material.color.toArray(), metalness: material.metalness,
        style: state.style ? Object.assign({}, state.style) : null, roughnessFloor: state.roughnessFloor.value
      };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
