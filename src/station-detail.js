/* MNEMOSYNE station dressing. Decorative only: navigation/collision stays in game.js. */
(() => {
  'use strict';

  const qualityTier = (profile) => {
    const name = typeof profile === 'string' ? profile : profile?.name || profile?.quality || profile?.id || 'high';
    if (/low|performance|mobile/i.test(name)) return 0;
    if (/medium|balanced/i.test(name)) return 1;
    return 2;
  };

  function build(options = {}) {
    const T = options.THREE || window.THREE;
    if (!T) throw new Error('HiveStationDetail requires Three.js.');
    const parent = options.propsGroup || options.mapGroup || options.scene;
    if (!parent) throw new Error('HiveStationDetail requires a scene parent.');
    const group = new T.Group();
    group.name = 'MNEMOSYNE · architecture and service systems';
    group.userData.decorativeOnly = true;
    parent.add(group);
    let tier = qualityTier(options.quality);
    let disposed = false;
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();
    const batches = new Map();
    const wallStates = new Map();
    const dummy = new T.Object3D();
    const hiddenMatrix = new T.Matrix4().makeScale(0, 0, 0);
    const diagnostics = { instances: 0, batches: 0, wallBays: 0, dynamicLights: 0, collisionChanges: 0, tier };
    const geometry = (value) => { geometries.add(value); return value; };
    const material = (value) => { materials.add(value); return value; };
    const texture = (value) => { textures.add(value); return value; };
    const box = geometry(new T.BoxGeometry(1, 1, 1));
    const rod = geometry(new T.CylinderGeometry(1, 1, 1, 8, 1));
    const plane = geometry(new T.PlaneGeometry(1, 1));
    for (const geo of [box, rod]) geo.setAttribute('uv2', geo.getAttribute('uv').clone());

    // Deterministic brushed metal: small scuffs and seams remain readable at close camera distances.
    const sheet = document.createElement('canvas');
    sheet.width = sheet.height = 256;
    const ctx = sheet.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#a2a6aa'; ctx.fillRect(0, 0, 256, 256);
      for (let y = 0; y < 256; y++) {
        const value = 139 + ((y * 37 + y * y * 11) % 34);
        ctx.fillStyle = `rgb(${value},${value + 3},${value + 5})`;
        ctx.fillRect(0, y, 256, 1);
      }
      ctx.fillStyle = '#3f484e';
      ctx.fillRect(0, 0, 256, 3); ctx.fillRect(0, 253, 256, 3);
      ctx.fillRect(0, 0, 3, 256); ctx.fillRect(253, 0, 3, 256);
      for (let n = 0; n < 20; n++) {
        ctx.fillStyle = n % 3 ? '#c0c5c7' : '#687279';
        ctx.fillRect((n * 73) % 244 + 6, (n * 29) % 244 + 6, 3 + n % 11, 1);
      }
    }
    const metalMap = texture(new T.CanvasTexture(sheet));
    metalMap.encoding = T.sRGBEncoding;
    metalMap.anisotropy = 4;
    const brushed = (color, roughness, metalness) => material(new T.MeshStandardMaterial({
      color, map: metalMap, roughness, metalness, bumpMap: metalMap, bumpScale: 0.035
    }));
    const structural = brushed(0x58646c, 0.54, 0.8);
    const recessed = brushed(0x33424a, 0.69, 0.66);
    const steel = brushed(0x859398, 0.4, 0.86);
    const dark = material(new T.MeshStandardMaterial({ color: 0x101b20, roughness: 0.88, metalness: 0.35 }));
    const rubber = material(new T.MeshStandardMaterial({ color: 0x0d1316, roughness: 0.94, metalness: 0.08 }));
    const paint = material(new T.MeshStandardMaterial({ color: 0xc2a05a, roughness: 0.83, metalness: 0.12 }));
    const coolLamp = material(new T.MeshStandardMaterial({ color: 0xdaf1ef, emissive: 0x7daaa6, emissiveIntensity: 1.8, roughness: 0.31, metalness: 0.08 }));
    const warmLamp = material(new T.MeshStandardMaterial({ color: 0xffe4b5, emissive: 0xdba66a, emissiveIntensity: 1.6, roughness: 0.34, metalness: 0.06 }));
    const indicator = material(new T.MeshBasicMaterial({ color: 0x8bc6b3 }));

    function instance(key, geo, mat, position, scale, rotation = [0, 0, 0], wall = null, minTier = 0, color = null) {
      if (!batches.has(key)) batches.set(key, { geo, mat, instances: [], minTier, mesh: null });
      dummy.position.set(...position); dummy.scale.set(...scale); dummy.rotation.set(...rotation); dummy.updateMatrix();
      batches.get(key).instances.push({ matrix: dummy.matrix.clone(), wall, color });
      diagnostics.instances++;
    }
    function part(key, mat, x, y, z, w, h, d, angle = 0, wall = null, minTier = 0) {
      instance(key, box, mat, [x, y, z], [w, h, d], [0, angle, 0], wall, minTier);
    }
    const walls = Array.isArray(options.walls) ? options.walls : [];
    for (const wall of walls) {
      const dims = wall.geometry?.parameters;
      if (!dims || !Number.isFinite(dims.width) || !Number.isFinite(dims.depth)) continue;
      const alongX = dims.width >= dims.depth;
      const length = alongX ? dims.width : dims.depth;
      const thickness = alongX ? dims.depth : dims.width;
      const height = Math.min(dims.height || 10, 9.4);
      const angle = alongX ? 0 : Math.PI / 2;
      const wallX = wall.position.x, wallZ = wall.position.z;
      const wallParts = (key, mat, u, y, v, width, h, depth, minTier = 0) => {
        part(key, mat, wallX + (alongX ? u : v), y, wallZ + (alongX ? v : u), width, h, depth, angle, wall, minTier);
      };
      let faces = [-1, 1];
      const boundary = alongX ? wallZ : wallX;
      if (Math.abs(boundary) > 70) faces = [boundary < 0 ? 1 : -1];
      const count = Math.max(1, Math.floor(length / 6));
      const bay = length / count;
      for (const face of faces) {
        const outer = face * (thickness / 2 + 0.05);
        // Foot and shoulder rails are within the existing padded wall collider.
        wallParts('structure', structural, 0, 0.28, outer, length, 0.32, 0.12);
        wallParts('structure', structural, 0, height - 0.4, outer, length, 0.24, 0.12);
        wallParts('dark-inset', dark, 0, 0.65, outer, length, 0.22, 0.08);
        for (let index = 0; index < count; index++) {
          const u = -length / 2 + bay * (index + 0.5);
          const faceDepth = face * (thickness / 2 + 0.07);
          wallParts('wall-panels', recessed, u, 2.55, faceDepth, bay - 0.4, 3.25, 0.08);
          wallParts('wall-panel-trim', steel, u, 4.21, faceDepth + face * 0.04, bay - 0.5, 0.05, 0.045, 1);
          wallParts('structure', structural, u - bay / 2 + 0.13, height / 2, outer, 0.19, height - 0.65, 0.18);
          wallParts('structure', structural, u + bay / 2 - 0.13, height / 2, outer, 0.19, height - 0.65, 0.18);
          diagnostics.wallBays++;
          // Recessed ventilation replaces blank panels; no new route-looking doors.
          if (index % 3 === 1) {
            wallParts('dark-inset', dark, u, 2.45, faceDepth + face * 0.06, bay * 0.65, 1.72, 0.04);
            for (let slit = 0; slit < 7; slit++) {
              wallParts('vent-slats', steel, u, 1.76 + slit * 0.22, faceDepth + face * 0.1, bay * 0.6, 0.055, 0.06, 1);
            }
          }
          // Compact service luminaires, grounded by matte housings and end clamps.
          if (index % 2 === 0) {
            const warm = boundary > 20;
            wallParts('dark-inset', dark, u, 5.6, faceDepth + face * 0.05, Math.min(bay * 0.65, 3.4), 0.38, 0.17);
            wallParts(warm ? 'lamps-warm' : 'lamps-cool', warm ? warmLamp : coolLamp, u, 5.6, faceDepth + face * 0.15, Math.min(bay * 0.57, 2.9), 0.12, 0.08);
            wallParts('indicator', indicator, u + bay * 0.32, 1.25, faceDepth + face * 0.08, 0.08, 0.22, 0.04, 1);
          }
          // Four recessed fasteners per panel, batched with other polished metal.
          for (const du of [-0.42, 0.42]) for (const y of [1.1, 3.95]) {
            wallParts('wall-panel-trim', steel, u + du * (bay - 0.4), y, faceDepth + face * 0.06, 0.07, 0.07, 0.06, 1);
          }
        }
        // Conduit remains flush against bulkheads, never hanging across traversal.
        for (let cable = 0; cable < 3; cable++) {
          const v = face * (thickness / 2 + 0.12);
          instance(cable === 2 ? 'cable' : 'conduit', rod, cable === 2 ? rubber : steel,
            [wallX + (alongX ? 0 : v), 6.45 + cable * 0.22, wallZ + (alongX ? v : 0)],
            [cable === 2 ? 0.055 : 0.07, length - 0.5, cable === 2 ? 0.055 : 0.07],
            alongX ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0], wall, 1);
        }
      }
      wallStates.set(wall, true);
    }

    // Flush maintenance drains and lane seams: detail underfoot, never fake obstacles.
    for (const x of [-6.2, 6.2]) {
      for (let z = -63; z <= 63; z += 7) {
        part('floor-drain', dark, x, 0.015, z, 0.9, 0.025, 4.7);
        for (let bar = 0; bar < 12; bar++) part('grate-bars', steel, x, 0.035, z - 2.1 + bar * 0.38, 0.76, 0.028, 0.065, 0, null, 1);
        for (const side of [-1, 1]) part('floor-drain-frames', structural, x + side * 0.48, 0.024, z, 0.055, 0.025, 4.85);
      }
    }
    // Expansion joints are offset from the original sector signs and existing service lanes.
    for (let line = -60; line <= 60; line += 20) {
      part('floor-seams', dark, line, 0.007, 0, 0.045, 0.009, 142, 0, null, 1);
      part('floor-seams', dark, 0, 0.008, line, 142, 0.009, 0.045, 0, null, 1);
    }
    // Freight pads: four inset corner marks rather than large painted solid rectangles.
    for (const [x, z, w, d] of [[-24, 6, 9, 6], [25, 13, 8, 7], [-45, 45, 12, 12], [45, 45, 14, 14]]) {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        part('hazard-paint', paint, x + sx * (w / 2 - 1), 0.027, z + sz * d / 2, 2, 0.012, 0.12);
        part('hazard-paint', paint, x + sx * w / 2, 0.027, z + sz * (d / 2 - 1), 0.12, 0.012, 2);
      }
    }
    for (const x of [-49, 49]) for (let n = 0; n < 7; n++) {
      part('hazard-paint', paint, x + (n - 3) * 0.55, 0.025, -30, 0.24, 0.012, 1.35, -Math.PI / 5);
    }

    // Soft static contact and luminaire spill decals avoid adding dozens of realtime lights.
    function radialTexture(shadow = false) {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
      const context = canvas.getContext('2d');
      if (context) {
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, shadow ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.2)');
        gradient.addColorStop(0.45, shadow ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.07)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        context.fillStyle = gradient; context.fillRect(0, 0, 64, 64);
      }
      return texture(new T.CanvasTexture(canvas));
    }
    const contact = material(new T.MeshBasicMaterial({ map: radialTexture(true), transparent: true, opacity: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }));
    const spill = material(new T.MeshBasicMaterial({ map: radialTexture(), transparent: true, opacity: 0.55, depthWrite: false, blending: T.AdditiveBlending }));
    for (const [x, z, w, d] of [[0, -15, 10, 10], [-24, 6, 10, 6], [25, 13, 9, 8], [-45, 45, 13, 13], [45, 45, 16, 16]]) {
      instance('contact-shadows', plane, contact, [x, 0.016, z], [w, d, 1], [-Math.PI / 2, 0, 0]);
    }
    for (const [x, z, color] of [[-30, -27, 0x739c9c], [30, -27, 0x6f879c], [-34, 32, 0x947957], [34, 32, 0x998574]]) {
      instance('floor-light-spill', plane, spill, [x, 0.021, z], [17, 8, 1], [-Math.PI / 2, 0, 0], null, 2, color);
    }

    // Static suspended dust catches the white service lighting without animated noise.
    // One point draw, disabled in reduced detail; the renderer owns all volumetric fog.
    const moteGeometry = geometry(new T.BufferGeometry());
    const motes = new Float32Array(192 * 3);
    for (let index = 0; index < 192; index++) {
      motes[index * 3] = ((index * 73.791) % 134) - 67;
      motes[index * 3 + 1] = 0.5 + ((index * 3.177) % 6.2);
      motes[index * 3 + 2] = ((index * 39.137) % 134) - 67;
    }
    moteGeometry.setAttribute('position', new T.BufferAttribute(motes, 3));
    const moteMaterial = material(new T.PointsMaterial({ color: 0xa4b5bd, size: 0.055, transparent: true, opacity: 0.2, depthWrite: false, sizeAttenuation: true }));
    const dust = new T.Points(moteGeometry, moteMaterial);
    dust.name = 'Station detail · suspended service dust';
    dust.visible = tier >= 2;
    group.add(dust);

    for (const [key, batch] of batches) {
      const mesh = new T.InstancedMesh(batch.geo, batch.mat, batch.instances.length);
      mesh.name = `Station detail · ${key}`;
      mesh.frustumCulled = false; // r128 does not compute instance-aware bounds.
      mesh.receiveShadow = !batch.mat.isMeshBasicMaterial;
      mesh.castShadow = false; // Small dressing should not multiply the shadow pass.
      mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
      batch.instances.forEach((item, index) => {
        mesh.setMatrixAt(index, item.matrix);
        if (item.color !== null) mesh.setColorAt(index, new T.Color(item.color));
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.visible = tier >= batch.minTier;
      batch.mesh = mesh;
      group.add(mesh);
    }
    diagnostics.batches = batches.size + 1;

    function setQuality(profile) {
      tier = qualityTier(profile); diagnostics.tier = tier; dust.visible = tier >= 2;
      for (const batch of batches.values()) batch.mesh.visible = tier >= batch.minTier;
    }
    let surfaceMapsReady = false;
    function refreshSurfaceMaps() {
      if (surfaceMapsReady) return;
      const maps = window.HiveModelFactory?.textures;
      if (!maps?.industrialNormal || !maps?.industrialRoughness) return;
      // The factory owns these textures; this module borrows them and never disposes them.
      for (const mat of [structural, recessed, steel]) {
        mat.normalMap = maps.industrialNormal;
        mat.normalScale.set(0.26, 0.26);
        mat.roughnessMap = maps.industrialRoughness;
        mat.aoMap = maps.industrialAO || null;
        mat.aoMapIntensity = 0.45;
        mat.metalnessMap = maps.industrialMetalness || null;
        mat.bumpMap = null;
        mat.needsUpdate = true;
      }
      surfaceMapsReady = true;
      diagnostics.sharedPBRMaps = true;
    }
    function update() {
      if (disposed) return;
      refreshSurfaceMaps();
      let changed = false;
      for (const wall of wallStates.keys()) {
        const visible = wall.visible !== false && (wall.material?.opacity ?? 1) >= 0.88;
        if (wallStates.get(wall) !== visible) { wallStates.set(wall, visible); changed = true; }
      }
      if (!changed) return;
      for (const batch of batches.values()) {
        if (!batch.instances.some((item) => item.wall)) continue;
        batch.instances.forEach((item, index) => batch.mesh.setMatrixAt(index, item.wall && !wallStates.get(item.wall) ? hiddenMatrix : item.matrix));
        batch.mesh.instanceMatrix.needsUpdate = true;
      }
    }
    function dispose() {
      if (disposed) return;
      disposed = true; group.removeFromParent ? group.removeFromParent() : group.parent?.remove(group);
      for (const batch of batches.values()) batch.mesh.dispose?.();
      for (const value of geometries) value.dispose();
      for (const value of materials) value.dispose();
      for (const value of textures) value.dispose();
      batches.clear(); wallStates.clear();
    }
    update();
    return { group, update, setQuality, dispose, diagnostics };
  }

  window.HiveStationDetail = Object.freeze({ build });
})();
