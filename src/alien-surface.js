/* Anatomical material calibration for the local creature meshes.
 * This is deliberately not a post effect: one persistent per-material style
 * survives texture loading and keeps bone deformation, maps and ownership intact.
 */
(function exposeAlienSurface(global) {
  'use strict';
  const BIOLOGY = new Set(['adult', 'egg', 'facehugger', 'chestburster', 'queen_burster']);
  const PALE = /neomorph|newborn|offspring|abomination|bodyburster|belugamorph/;
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const TISSUE_VERSION = 'hive-alien-tissue-v3';
  const tissueStates = new WeakMap();
  // Additional detail is deliberately regional and low contrast. It does not
  // turn every surface into the same engraved shell. The body can have dry
  // intercostal membranes while the cranial vault retains a continuous film.
  const TISSUE_FRAGMENT = `
    varying vec3 vHiveAlienBindPosition;
    uniform float hiveAlienRegion;
    uniform float hiveAlienPale;
    uniform float hiveAlienMacroStrength;
    uniform vec3 hiveAlienMapMean;
    float hiveAlienHash(vec3 p){
      p=fract(p*0.1031);p+=dot(p,p.yzx+33.33);
      return fract((p.x+p.y)*p.z);
    }
    float hiveAlienNoise(vec3 p){
      vec3 cell=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);
      float a=mix(hiveAlienHash(cell),hiveAlienHash(cell+vec3(1,0,0)),u.x);
      float b=mix(hiveAlienHash(cell+vec3(0,1,0)),hiveAlienHash(cell+vec3(1,1,0)),u.x);
      float c=mix(hiveAlienHash(cell+vec3(0,0,1)),hiveAlienHash(cell+vec3(1,0,1)),u.x);
      float d=mix(hiveAlienHash(cell+vec3(0,1,1)),hiveAlienHash(cell+vec3(1,1,1)),u.x);
      vec3 footprint=fwidth(p);
      float visible=1.0-smoothstep(0.55,2.0,max(footprint.x,max(footprint.y,footprint.z)));
      return (mix(mix(a,b,u.y),mix(c,d,u.y),u.z)-0.5)*visible;
    }
    vec4 hiveAlienTissue(vec3 p){
      float mottling=hiveAlienNoise(p*7.2)*2.0;
      float fibre=hiveFilteredWave(p.x*116.0+p.z*53.0+sin(p.y*8.1)*0.55)*
        (0.45+0.55*hiveAlienNoise(p*19.0));
      float pores=hiveAlienNoise(p*176.0);
      if(hiveAlienRegion>0.5&&hiveAlienRegion<1.5){
        // The smooth vault is not a tiled plate or a leather handbag. Fine,
        // longitudinal abrasion only breaks up its reflected highlight.
        float streak=hiveFilteredWave(p.x*132.0+sin(p.z*4.7)*0.8+p.y*17.0);
        return vec4(0.985+0.025*mottling,0.024*mottling+0.006*streak,
          streak*0.000035+pores*0.00007,0.12);
      }
      if(hiveAlienRegion>1.5){
        return vec4(0.955+0.055*mottling,0.07+0.045*mottling,
          fibre*0.0002+pores*0.00025,0.48);
      }
      float ribPhase=(p.y-2.72)*22.0+p.x*p.x*5.1;
      float rib=pow(0.5+0.5*hiveFilteredWave(ribPhase+1.5707963),3.0);
      float costal=smoothstep(2.64,2.88,p.y)*(1.0-smoothstep(3.70,3.96,p.y))*
        smoothstep(0.02,0.28,p.z)*smoothstep(0.045,0.20,abs(p.x));
      float membrane=costal*(1.0-rib);
      // A slight warm/cool pigment variation and localized roughness separate
      // ridges from recessed tissue without painting false geometry or AO.
      return vec4(0.965+0.055*mottling-0.12*membrane,
        0.035+0.055*mottling+0.13*membrane-0.028*costal*rib,
        fibre*0.00018+pores*0.00021,membrane);
    }
  `;

  function applyTissue(material, profile = material?.userData?.alienTissueProfile) {
    if (!material?.isMeshStandardMaterial || !profile || tissueStates.has(material)) return material;
    // Material.clone preserves userData, not shader callbacks. Re-applying this
    // small profile composes with a clone's own surface state, never another
    // actor's closures or uniforms.
    global.HiveSurfaceDetail?.apply?.(material, material.userData.hiveMaterialKind);
    const previous = material.onBeforeCompile, previousKey = material.customProgramCacheKey;
    const region = clamp(Number(profile.region) || 0, 0, 2);
    const pale = profile.pale === true;
    const state = {region, pale, compiled:false};
    material.userData.alienTissueProfile = {version:2, region, pale};
    tissueStates.set(material, state);
    material.onBeforeCompile = function alienTissueCompile(shader, renderer) {
      previous.call(this, shader, renderer);
      // The shared surface hook owns derivative capability checks. Follow its
      // fallback exactly; do not introduce unsupported derivatives on WebGL1.
      if (!shader.uniforms.hiveSurfaceAmount) return;
      shader.uniforms.hiveAlienRegion = {value:region};
      shader.uniforms.hiveAlienPale = {value:pale ? 1 : 0};
      shader.uniforms.hiveAlienMacroStrength = {value:region === 1 ? .015 : (region === 2 ? .2 : .35)};
      // Means of the local map set in LINEAR light. Smoothing pigment toward
      // bare diffuse (1.0) made the first iteration look like a grey helmet.
      const mean = material.userData.hiveMaterialKind === 'skin' ? [.452,.305,.258] :
        material.userData.hiveMaterialKind === 'resin' ? [.081,.069,.047] : [.087,.081,.065];
      shader.uniforms.hiveAlienMapMean = {value:new global.THREE.Color(...mean)};
      shader.vertexShader = shader.vertexShader.replace('#include <common>',
        '#include <common>\nvarying vec3 vHiveAlienBindPosition;');
      shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>',
        '#include <project_vertex>\nvHiveAlienBindPosition=position;');
      shader.fragmentShader = shader.fragmentShader.replace('void main() {', TISSUE_FRAGMENT+'\nvoid main() {');
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
        #include <map_fragment>
        vec4 hiveAlienProperties=hiveAlienTissue(vHiveAlienBindPosition);
        // The coarse legacy resin map must not emboss the vault with giant
        // panel-like pigment cells. Its finer authored variation is retained.
        float hiveAlienMapBlend=hiveAlienRegion>0.5&&hiveAlienRegion<1.5?0.72:
          (hiveAlienRegion>1.5?0.42:0.18);
        #ifdef USE_MAP
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuse*hiveAlienMapMean,hiveAlienMapBlend*hiveSurfaceAmount);
        #endif
        vec3 hiveAlienTint=mix(vec3(0.95,0.985,1.015),vec3(1.025,1.0,0.95),hiveAlienProperties.w);
        hiveAlienTint=mix(hiveAlienTint,vec3(1.015,0.99,0.965),hiveAlienPale);
        diffuseColor.rgb*=mix(vec3(1.0),hiveAlienTint*hiveAlienProperties.x,hiveSurfaceAmount);
      `);
      shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', `
        #include <roughnessmap_fragment>
        roughnessFactor=clamp(roughnessFactor+hiveAlienProperties.y*hiveSurfaceAmount,0.0,1.0);
        if(hiveAlienRegion>0.5&&hiveAlienRegion<1.5){
          float hiveVaultRoughness=mix(0.265,0.40,hiveAlienPale)+hiveAlienProperties.y;
          roughnessFactor=mix(roughnessFactor,hiveVaultRoughness,0.88*hiveSurfaceAmount);
        }
      `);
      shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', `
        #include <normal_fragment_maps>
        normal=hiveSurfaceGradient(-vViewPosition,normal,hiveAlienProperties.z*hiveSurfaceAmount,faceDirection);
      `);
      shader.fragmentShader = shader.fragmentShader.replace('hiveSurface.z*hiveSurfaceAmount,faceDirection',
        'hiveSurface.z*hiveSurfaceAmount*hiveAlienMacroStrength,faceDirection');
      state.compiled = true;
    };
    material.customProgramCacheKey = function alienTissueCacheKey() {
      return previousKey.call(this)+'|'+TISSUE_VERSION;
    };
    material.needsUpdate = true;
    return material;
  }

  function finish(factory, root, metadata = {}) {
    const T = global.THREE, surfaces = global.HiveSurfaceDetail;
    if (!T || !surfaces?.setStyle || !BIOLOGY.has(metadata.modelType) || root.userData.alienSurface) return root;
    const type = metadata.modelType, caste = metadata.caste || '', pale = PALE.test(caste);
    const cocoon = type === 'chestburster' && (metadata.chrysalis || root.name.includes('chrysalis'));
    const usages = new Map(), regional = new Set();
    root.traverse(object => {
      if (!object.isMesh || !object.material) return;
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (!usages.has(material)) usages.set(material, []);
        usages.get(material).push(object);
      }
    });
    const named = names => root.getObjectByName(names.find(name => root.getObjectByName(name)) || '');
    const dome = named(['cranial_dome', 'runner_head', 'crusher_head']);
    if (dome && dome.material && !Array.isArray(dome.material)) {
      const original = dome.material;
      // A cranial vault has a smoother wet film than a ribbed body. Sharing one
      // material forces both to look like polished plastic, so split only here.
      if ((usages.get(original)?.length || 0) > 1) {
        const material = original.clone();
        material.skinning = false;
        material.userData.modernRegion = 'dome';
        factory._managedMaterials.add(material);
        material.addEventListener('dispose', () => factory._managedMaterials.delete(material));
        factory._applyManagedTexture(material);
        dome.material = material;
        usages.set(material, [dome]);
        usages.set(original, usages.get(original).filter(object => object !== dome));
      }
      regional.add(dome.material);
      if (!pale && type === 'adult') {
        dome.material.transparent = caste === 'drone';
        dome.material.opacity = caste === 'drone' ? 0.975 : 1;
        dome.material.depthWrite = true;
        dome.material.transmission = 0;
      }
      const pigment = surfaces.getAuthoredColor(original) || original.color.clone();
      pigment.lerp(new T.Color(pale ? 0xc7bba7 : 0x26302d), pale ? 0.15 : 0.72);
      surfaces.setStyle(dome.material, {color:pigment.getHex(), roughness:.92,
        roughnessFloor:pale ? .40 : .245, metalness:pale ? 0 : .018,
        clearcoat:pale ? .16 : .48, clearcoatRoughness:pale ? .36 : .21, normalScale:pale ? .14 : .012});
      if (type === 'adult') applyTissue(dome.material, {region:1,pale});
      if (type === 'adult') for (const name of ['facial_mask','runner_muzzle']) {
        const face = root.getObjectByName(name);
        if (!face?.isMesh || Array.isArray(face.material) || face.material === dome.material) continue;
        const previous = face.material;
        face.material = dome.material;
        usages.get(dome.material)?.push(face);
        const remaining = (usages.get(previous) || []).filter(mesh=>mesh !== face);
        usages.set(previous,remaining);
        if (!remaining.length) {usages.delete(previous);previous.dispose();}
      }
      dome.material.needsUpdate = true;
    }

    let calibrated = 0, suppressedLuminous = 0, preservedSkinning = 0;
    for (const [material, meshes] of usages) {
      if (!meshes.length || !material.isMeshStandardMaterial) continue;
      const kind = material.userData.hiveMaterialKind;
      const names = meshes.map(mesh => mesh.name || '').join('|');
      const authored = surfaces.getAuthoredColor(material) || material.color.clone();
      const keepSkinning = material.skinning;
      if (regional.has(material)) { calibrated++; continue; }
      let style = null;
      if (type === 'adult') {
        if (kind === 'chitin' || kind === 'chitinWarm' || material.userData.modernRegion === 'body') {
          const pigment = authored.clone().lerp(new T.Color(pale ? 0xb4aa94 : 0x2a342e), pale ? .18 : .55);
          style = {color:pigment.getHex(),roughness:.95,roughnessFloor:pale ? .48 : .43,
            metalness:.012,clearcoat:pale ? .12 : .19,clearcoatRoughness:.38,normalScale:.14};
        } else if (kind === 'skin') {
          // Dark connective tissue was previously remapped to near-white skin,
          // reading as glued beige strings. Preserve its authored pigmentation.
          const pigment = authored.clone();
          if (!pale) pigment.lerp(new T.Color(0x111a15), .42);
          style = {color:pigment.getHex(),roughness:.94,roughnessFloor:pale ? .48 : .51,
            metalness:0,clearcoat:.12,clearcoatRoughness:.42,normalScale:.24};
        } else if (kind === 'resin') {
          const pigment = authored.clone().lerp(new T.Color(pale ? 0x9b8c7b : 0x30352d), .45);
          style = {color:pigment.getHex(),roughness:.94,roughnessFloor:pale ? .47 : .43,
            metalness:.01,clearcoat:.17,clearcoatRoughness:.39,normalScale:.23};
        }
      } else if (type === 'facehugger') {
        if (kind === 'skin') {
          const pigment = authored.clone().lerp(new T.Color(0xc2af91), .20);
          style = {color:pigment.getHex(),roughness:.94,roughnessFloor:.43,
            metalness:0,clearcoat:.16,clearcoatRoughness:.39,normalScale:.28};
        } else if (kind === 'chitin') {
          style = {preservePigment:true,roughness:.89,roughnessFloor:.33,
            metalness:.02,clearcoat:.33,clearcoatRoughness:.28,normalScale:.32};
        }
      } else if (type === 'egg') {
        if (kind === 'chitinWarm' || kind === 'chitin') {
          const pigment = authored.clone().lerp(new T.Color(0x574d36), .22);
          style = {color:pigment.getHex(),roughness:.95,roughnessFloor:.48,
            metalness:.012,clearcoat:.20,clearcoatRoughness:.35,normalScale:.43};
        } else if (kind === 'skin' || kind === 'resin') {
          style = {preservePigment:true,roughness:.92,roughnessFloor:.38,
            metalness:0,clearcoat:.24,clearcoatRoughness:.31,normalScale:.32};
        }
      } else if (cocoon && ['resin','skin','chitin','chitinWarm'].includes(kind)) {
        style = {preservePigment:true,roughness:.94,roughnessFloor:.38,
          metalness:.012,clearcoat:.25,clearcoatRoughness:.31,normalScale:.27};
      } else if (['chestburster','queen_burster'].includes(type) && ['skin','resin','chitin','chitinWarm'].includes(kind)) {
        style = {preservePigment:true,roughness:.90,roughnessFloor:.37,
          metalness:.008,clearcoat:.22,clearcoatRoughness:.33,normalScale:.31};
      }
      if (kind === 'bone') {
        const internal = /drone_internal_skull|skull_maxilla_teeth|skull_orbit/.test(names);
        style = {color:internal ? 0x77756a : authored.getHex(),roughness:internal ? .95 : .82,
          roughnessFloor:internal ? .57 : .34,metalness:internal ? 0 : .12,
          clearcoat:.08,clearcoatRoughness:.38,normalScale:.25};
      }
      // The broad inner mandibular surface must not inherit the glossy shell
      // finish: a concentrated HDR reflection reads as an ivory mouth plate.
      // Keep enamel independent and retain this regional style when maps load.
      if (type === 'adult' && material.userData.modernRegion === 'oral-cavity') {
        style = {preservePigment:true,roughness:1,roughnessFloor:.78,
          metalness:0,clearcoat:0,clearcoatRoughness:1,normalScale:.18};
      }
      if (style) {
        surfaces.setStyle(material, style); calibrated++;
      }
      if (type === 'adult' && ['chitin','chitinWarm','resin','skin'].includes(kind) &&
          material.userData.modernRegion !== 'oral-cavity') {
        applyTissue(material, {region:kind === 'skin' ? 2 : 0,pale});
      }
      // Status lamps belong to props and UI, not an alien's teeth or tissues.
      // Explicit mutagen/acid sacs retain their authored signalling colour.
      const acidCaste = /spitter|boiler|burster|bodyburster|carrier/.test(caste);
      const acidTissue = acidCaste && /gland|sac|acid|pustule|sensory/.test(names);
      if (!acidTissue && material.emissive && material.emissiveIntensity > 0 &&
          (!kind || kind.startsWith('emissive') || ['resin','skin','chitin','chitinWarm'].includes(kind))) {
        material.emissiveIntensity = clamp(material.emissiveIntensity, 0, .035);
        suppressedLuminous++;
      }
      if (material.skinning === keepSkinning && keepSkinning) preservedSkinning++;
    }
    root.userData.alienSurface = {version:2,calibratedMaterials:calibrated,
      restrainedEmissionMaterials:suppressedLuminous,skinningMaterialsPreserved:preservedSkinning,
      mapping:'regional membrane/vault PBR + derivative-filtered bind-space fibres; no extra texture samples'};
    return root;
  }
  global.HiveAlienSurface = {finish, applyTissue,
    getDiagnostics:material=>{const state=tissueStates.get(material);return state ? {...state,version:2,additionalTextureSamples:0}:null;}};
})(typeof window === 'undefined' ? globalThis : window);
