/* MNEMOSYNE station dressing. Decorative only: navigation/collision stays in game.js. */
(() => {
  'use strict';

  const qualityTier = (profile) => {
    const name = typeof profile === 'string' ? profile : profile?.name || profile?.quality || profile?.id || 'high';
    if (/low|performance|mobile/i.test(name)) return 0;
    if (/medium|balanced/i.test(name)) return 1;
    return 2;
  };

  // Paint belongs to the room, not to a screen-space colour grade. Keep these
  // restrained enough that steel, warning print and the black creature retain
  // their own materials under the shared station lighting.
  const SECTOR_FINISH = Object.freeze({
    cryo: { panel: 0xb7d0d1, stripe: 0x71a6ad },
    security: { panel: 0xd4c9aa, stripe: 0xb49a63 },
    freight: { panel: 0xb5c4cc, stripe: 0x7c97a2 },
    colony: { panel: 0xd2c1ab, stripe: 0xb79b79 },
    refinery: { panel: 0xd2af95, stripe: 0xb17d56 },
    nursery: { panel: 0xafc3aa, stripe: 0x7d9e77 },
    transit: { panel: 0xc6ceca, stripe: 0x95aaa3 }
  });
  function sectorFinish(x, z) {
    const named = window.HiveStationArchitecture?.zoneAt?.(x, z)?.id;
    const fallback = x < -14 ? (z < -22 ? 'cryo' : z > 22 ? 'refinery' : 'freight')
      : x > 14 ? (z < -22 ? 'security' : z > 22 ? 'nursery' : 'colony') : 'transit';
    return SECTOR_FINISH[named] || SECTOR_FINISH[fallback];
  }

  function build(options = {}) {
    const T = options.THREE || window.THREE;
    if (!T) throw new Error('HiveStationDetail requires Three.js.');
    const parent = options.propsGroup || options.mapGroup || options.scene;
    if (!parent) throw new Error('HiveStationDetail requires a scene parent.');
    const group = new T.Group();
    group.name = 'MNEMOSYNE · architecture and service systems';
    group.userData.decorativeOnly = true;
    group.userData.hiveGlobalDecorations = true;
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
    const diagnostics = { instances: 0, batches: 0, wallBays: 0, labels: 0, recessedFasteners: 0, grimePatches: 0, dynamicLights: 0, collisionChanges: 0, tier,
      sectorAccentedBays: 0, practicalSpills: 0, contactShadows: 0, contactShadowTracking: true };
    const geometry = (value) => { geometries.add(value); return value; };
    const material = (value) => { materials.add(value); return value; };
    const texture = (value) => { textures.add(value); return value; };
    const box = geometry(new T.BoxGeometry(1, 1, 1));
    const rod = geometry(new T.CylinderGeometry(1, 1, 1, 12, 1));
    const bolt = geometry(new T.CylinderGeometry(1, 1, 1, 6, 1).rotateX(Math.PI / 2));
    // A shared bevelled shell: six face plates, twelve edge bevels and eight corners.
    // Forty-four triangles preserve actual edge highlights without subdividing flat faces.
    const bevelPositions = [], bevelNormals = [], bevelUVs = [];
    const inset = 0.43;
    const putFace = (vertices, normal) => {
      const edgeA = new T.Vector3().subVectors(vertices[1], vertices[0]);
      const edgeB = new T.Vector3().subVectors(vertices[2], vertices[0]);
      if (edgeA.cross(edgeB).dot(normal) < 0) vertices.reverse();
      const uv = vertices.length === 4 ? [[0, 0], [1, 0], [1, 1], [0, 1]] : [[0, 0], [1, 0], [0.5, 1]];
      for (const triangle of vertices.length === 4 ? [[0, 1, 2], [0, 2, 3]] : [[0, 1, 2]]) {
        for (const index of triangle) {
          bevelPositions.push(...vertices[index].toArray());
          bevelNormals.push(...normal.toArray());
          bevelUVs.push(...uv[index]);
        }
      }
    };
    const axes = ['x', 'y', 'z'];
    for (let axis = 0; axis < 3; axis++) for (const sign of [-1, 1]) {
      const normal = new T.Vector3(); normal[axes[axis]] = sign;
      const others = axes.filter((_, index) => index !== axis);
      putFace([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => {
        const point = new T.Vector3(); point[axes[axis]] = 0.5 * sign;
        point[others[0]] = a * inset; point[others[1]] = b * inset; return point;
      }), normal);
    }
    for (let run = 0; run < 3; run++) {
      const [a, b] = axes.filter((_, index) => index !== run);
      for (const sa of [-1, 1]) for (const sb of [-1, 1]) {
        const normal = new T.Vector3(); normal[a] = sa; normal[b] = sb; normal.normalize();
        putFace([[0.5, inset, -inset], [0.5, inset, inset], [inset, 0.5, inset], [inset, 0.5, -inset]].map(([u, v, w]) => {
          const point = new T.Vector3(); point[a] = u * sa; point[b] = v * sb; point[axes[run]] = w; return point;
        }), normal);
      }
    }
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
      putFace([new T.Vector3(0.5 * x, inset * y, inset * z), new T.Vector3(inset * x, 0.5 * y, inset * z), new T.Vector3(inset * x, inset * y, 0.5 * z)], new T.Vector3(x, y, z).normalize());
    }
    const chamfer = geometry(new T.BufferGeometry());
    chamfer.setAttribute('position', new T.Float32BufferAttribute(bevelPositions, 3));
    chamfer.setAttribute('normal', new T.Float32BufferAttribute(bevelNormals, 3));
    chamfer.setAttribute('uv', new T.Float32BufferAttribute(bevelUVs, 2));
    const fanRim = geometry(new T.TorusGeometry(1, 0.11, 5, 20));
    const fanBack = geometry(new T.CylinderGeometry(1, 1, 1, 20, 1).rotateX(Math.PI / 2));
    const elbow = geometry(new T.TorusGeometry(0.34, 0.105, 6, 12, Math.PI / 2));
    const plane = geometry(new T.PlaneGeometry(1, 1));
    for (const geo of [box, rod, bolt, chamfer, fanRim, fanBack, elbow]) geo.setAttribute('uv2', geo.getAttribute('uv').clone());

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
      // Seams are modelled below; never stamp a false panel border onto every surface.
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
    const wallPaint = brushed(0xc2c0ac, 0.82, 0.16);
    const dark = material(new T.MeshStandardMaterial({ color: 0x101b20, roughness: 0.88, metalness: 0.35 }));
    const rubber = material(new T.MeshStandardMaterial({ color: 0x0d1316, roughness: 0.94, metalness: 0.08 }));
    const paint = material(new T.MeshStandardMaterial({ color: 0xc2a05a, roughness: 0.83, metalness: 0.12 }));
    const sectorPaint = material(new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.87, metalness: 0.035 }));
    const coolLamp = material(new T.MeshStandardMaterial({ color: 0xdaf1ef, emissive: 0x7daaa6, emissiveIntensity: 1.8, roughness: 0.31, metalness: 0.08 }));
    const warmLamp = material(new T.MeshStandardMaterial({ color: 0xffe4b5, emissive: 0xdba66a, emissiveIntensity: 1.6, roughness: 0.34, metalness: 0.06 }));
    const indicator = material(new T.MeshBasicMaterial({ color: 0x8bc6b3 }));

    // One atlas for all signage, screening and localized residue. No per-bay maps,
    // animated canvases or extra lights; UV-selected cells remain instanced below.
    const atlas = document.createElement('canvas'); atlas.width = 1024; atlas.height = 512;
    const ink = atlas.getContext('2d');
    if (ink) {
      const cell = (index, draw) => {
        ink.save(); ink.translate(index % 4 * 256, Math.floor(index / 4) * 256);
        ink.beginPath(); ink.rect(0, 0, 256, 256); ink.clip(); draw(); ink.restore();
      };
      const text = (value, x, y, size = 20, color = '#242b28') => {
        ink.fillStyle = color; ink.font = `bold ${size}px monospace`; ink.fillText(value, x, y);
      };
      cell(0, () => {
        ink.fillStyle = '#b8b9a6'; ink.fillRect(2, 2, 252, 252);
        ink.fillStyle = '#293331'; ink.fillRect(10, 10, 236, 48);
        text('MNEMOSYNE', 17, 43, 29, '#d1d0b9');
        text('SECTOR // 04', 16, 89, 25); text('LIFE SUPPORT', 16, 123, 24);
        text('DECK B · 07', 16, 158, 23); text('SERVICE ACCESS', 16, 195, 20);
        for (let n = 0; n < 38; n++) { ink.fillStyle = '#242b28'; ink.fillRect(16 + n * 6, 218, 2 + n % 3, 22 - n % 4); }
      });
      cell(1, () => {
        ink.fillStyle = '#bba451'; ink.fillRect(2, 2, 252, 252);
        ink.fillStyle = '#222924'; ink.fillRect(10, 10, 236, 40);
        text('CAUTION', 52, 39, 29, '#d5bd6b');
        ink.beginPath(); ink.moveTo(128, 65); ink.lineTo(175, 144); ink.lineTo(81, 144); ink.closePath(); ink.fill();
        text('!', 119, 132, 46, '#c8ae56'); text('PRESSURISED', 17, 179, 24); text('ISOLATE BEFORE', 17, 207, 21); text('MAINTENANCE', 17, 235, 21);
      });
      cell(2, () => {
        ink.fillStyle = '#111d18'; ink.fillRect(0, 0, 256, 256);
        for (let y = 8; y < 250; y += 24) { ink.strokeStyle = '#264639'; ink.beginPath(); ink.moveTo(12, y); ink.lineTo(244, y); ink.stroke(); }
        text('ENV. CONTROL', 13, 31, 25, '#9cae79'); text('AIR 101.3 kPa', 13, 62, 19, '#739c73');
        text('O2 20.9  CO2 .04', 13, 89, 18, '#739c73');
        ink.strokeStyle = '#9db781'; ink.lineWidth = 2; ink.beginPath();
        for (let x = 14; x < 244; x += 3) { const y = 144 + Math.sin(x * 0.085) * 9 + (x % 67 < 9 ? -28 : 0); x === 14 ? ink.moveTo(x, y) : ink.lineTo(x, y); } ink.stroke();
        text('FILTER 07 // OK', 13, 205, 19, '#739c73'); text('AUTO / STANDBY', 13, 233, 19, '#a9b789');
        for (let y = 0; y < 256; y += 3) { ink.fillStyle = 'rgba(0,0,0,.22)'; ink.fillRect(0, y, 256, 1); }
      });
      cell(3, () => {
        // Perforations are alpha-tested, so the actual fan cavity/rotor remains
        // visible through the cage instead of being covered by a printed square.
        ink.strokeStyle = '#65716a'; ink.lineWidth = 3;
        for (let row = -1; row < 12; row++) for (let col = -1; col < 12; col++) {
          const x = col * 25 + (row % 2) * 12.5, y = row * 22;
          ink.beginPath(); for (let p = 0; p < 6; p++) { const a = Math.PI / 3 * p; p ? ink.lineTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12) : ink.moveTo(x + 12, y); } ink.closePath(); ink.stroke();
        }
      });
      cell(4, () => {
        ink.fillStyle = '#c3bca0'; ink.fillRect(1, 1, 254, 254);
        text('W-Y / SYSTEMS', 15, 34, 24); text('EXHAUST RETURN', 15, 69, 22);
        text('AIRFLOW', 15, 108, 22); text('>>>>>', 15, 153, 42);
        text('TYPE 7-C / 024', 15, 195, 20); text('DO NOT OBSTRUCT', 15, 231, 20);
      });
      cell(5, () => {
        // The translucent cell has no panel outline: deposits accumulate below
        // bolts and service joints, rather than repeating over entire walls.
        for (let n = 0; n < 28; n++) {
          const x = 12 + (n * 47) % 232, y = (n * 19) % 48;
          const gradient = ink.createLinearGradient(0, y, 0, y + 120 + n % 80);
          gradient.addColorStop(0, n % 4 ? 'rgba(65,48,32,.55)' : 'rgba(23,31,26,.58)'); gradient.addColorStop(1, 'rgba(35,34,25,0)');
          ink.fillStyle = gradient; ink.fillRect(x, y, 2 + n % 9, 120 + n % 80);
        }
      });
      cell(6, () => {
        ink.fillStyle = '#17211d'; ink.fillRect(0, 0, 256, 256);
        text('SERVICE ONLY', 13, 35, 25, '#b5b7a1'); text('LOCK OUT / TAG OUT', 13, 74, 18, '#b5b7a1');
        text('01', 15, 155, 64, '#b5b7a1'); text('B', 170, 155, 64, '#b5b7a1');
        ink.fillStyle = '#b9a054'; ink.fillRect(13, 181, 230, 12);
        text('MNE-407-02 / REV C', 13, 228, 18, '#b5b7a1');
      });
      cell(7, () => {
        ink.fillStyle = '#bda45a'; ink.fillRect(0, 0, 256, 256); ink.fillStyle = '#242b28';
        for (let n = -4; n < 7; n++) { ink.beginPath(); ink.moveTo(n * 64, 0); ink.lineTo(n * 64 + 27, 0); ink.lineTo(n * 64 + 155, 256); ink.lineTo(n * 64 + 128, 256); ink.closePath(); ink.fill(); }
      });
      // Tiny deterministic abrasions keep printing/weathering coherent at every bay.
      for (let n = 0; n < 220; n++) { ink.fillStyle = n % 3 ? 'rgba(30,31,25,.12)' : 'rgba(220,217,187,.3)'; ink.fillRect((n * 137) % 1024, (n * 71) % 512, 1 + n % 9, 1); }
    }
    const atlasMap = texture(new T.CanvasTexture(atlas)); atlasMap.encoding = T.sRGBEncoding; atlasMap.anisotropy = 4;
    const serviceInk = material(new T.MeshStandardMaterial({ color: 0xffffff, map: atlasMap, alphaTest: 0.5, roughness: 0.83, metalness: 0.04, polygonOffset: true, polygonOffsetFactor: -1 }));
    const phosphor = material(new T.MeshStandardMaterial({ color: 0x9dac88, map: atlasMap, emissive: 0xa5c399, emissiveMap: atlasMap, emissiveIntensity: 0.35, roughness: 0.28 }));
    const residue = material(new T.MeshStandardMaterial({ color: 0x8b7456, map: atlasMap, transparent: true, opacity: 0.45, depthWrite: false, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -1 }));
    const atlasPlanes = Array.from({ length: 8 }, (_, index) => {
      const geo = geometry(new T.PlaneGeometry(1, 1)); const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, (index % 4 + 0.008 + uv.getX(i) * 0.984) / 4, 1 - (Math.floor(index / 4) + 0.992 - uv.getY(i) * 0.984) / 2);
      geo.setAttribute('uv2', uv.clone()); return geo;
    });
    diagnostics.sharedAtlasTextures = 1;

    function instance(key, geo, mat, position, scale, rotation = [0, 0, 0], wall = null, minTier = 0, color = null) {
      if (!batches.has(key)) batches.set(key, { geo, mat, instances: [], minTier, mesh: null });
      dummy.position.set(...position); dummy.scale.set(...scale); dummy.rotation.set(...rotation); dummy.updateMatrix();
      batches.get(key).instances.push({ matrix: dummy.matrix.clone(), wall, color });
      diagnostics.instances++;
    }
    const chamferedBatches = new Set(['structure', 'wall-panels', 'painted-bulkheads', 'floor-drain-frames', 'grate-bars']);
    function part(key, mat, x, y, z, w, h, d, angle = 0, wall = null, minTier = 0, color = null) {
      instance(key, chamferedBatches.has(key) ? chamfer : box, mat, [x, y, z], [w, h, d], [0, angle, 0], wall, minTier, color);
    }
    const walls = Array.isArray(options.walls) ? options.walls : [];
    const practicalSpills = [];
    for (const wall of walls) {
      if (wall.userData?.architecturePortal) continue;
      const dims = wall.geometry?.parameters;
      if (!dims || !Number.isFinite(dims.width) || !Number.isFinite(dims.depth)) continue;
      const alongX = dims.width >= dims.depth;
      const length = alongX ? dims.width : dims.depth;
      const thickness = alongX ? dims.depth : dims.width;
      const wallHeight = dims.height || 10;
      const height = Math.min(wallHeight, 10.8);
      const angle = alongX ? 0 : Math.PI / 2;
      const wallX = wall.position.x, wallZ = wall.position.z;
      const wallParts = (key, mat, u, y, v, width, h, depth, minTier = 0, color = null) => {
        const x = wallX + (alongX ? u : v), z = wallZ + (alongX ? v : u);
        const finish = sectorFinish(x, z);
        if (color === null && (key === 'wall-panels' || key === 'painted-bulkheads')) color = finish.panel;
        part(key, mat, x, y, z, width, h, depth, angle, wall, minTier, color);
      };
      let faces = [-1, 1];
      const boundary = alongX ? wallZ : wallX;
      if (Math.abs(boundary) > 70) faces = [boundary < 0 ? 1 : -1];
      const count = Math.max(1, Math.floor(length / 6));
      const bay = length / count;
      // The visible wall crown is an engineered channel cap, not a raw box top.
      // Its footprint stays inside the existing 0.6-unit wall collision padding.
      wallParts('structure', structural, 0, wallHeight + 0.035, 0, length + 0.08, 0.22, thickness + 0.26);
      wallParts('wall-panels', recessed, 0, wallHeight + 0.16, 0, length - 0.2, 0.08, Math.max(0.25, thickness - 0.28));
      for (const face of faces) {
        const outer = face * (thickness / 2 + 0.05);
        // Foot and shoulder rails are within the existing padded wall collider.
        wallParts('structure', structural, 0, 0.3, outer, length, 0.42, 0.28);
        wallParts('structure', structural, 0, height - 0.45, outer, length, 0.34, 0.25);
        wallParts('dark-inset', dark, 0, 0.65, outer, length, 0.22, 0.08);
        for (let index = 0; index < count; index++) {
          const u = -length / 2 + bay * (index + 0.5);
          const faceDepth = face * (thickness / 2 + 0.07);
          wallParts('wall-panels', recessed, u, 2.75, faceDepth + face * 0.06, bay - 0.65, 3.7, 0.16);
          // Worn ivory cladding is separated by dark service channels. It stays
          // above machinery, preserving the original silhouettes and walkways.
          const upperHeight = Math.max(0.6, height - 6.15);
          wallParts('painted-bulkheads', wallPaint, u, height - 0.72 - upperHeight / 2, faceDepth + face * 0.025, bay - 0.66, upperHeight, 0.13);
          // Chamfered, replaceable bumper armor has a readable silhouette at gameplay distance.
          wallParts('structure', structural, u, 0.89, faceDepth + face * 0.16, bay - 0.5, 0.72, 0.3);
          wallParts('wall-panel-trim', steel, u, 4.21, faceDepth + face * 0.04, bay - 0.5, 0.05, 0.045, 1);
          const finish = sectorFinish(wallX + (alongX ? u : faceDepth), wallZ + (alongX ? faceDepth : u));
          wallParts('sector-id-stripes', sectorPaint, u, 4.82, faceDepth + face * 0.16,
            bay - 0.72, 0.12, 0.025, 0, finish.stripe);
          diagnostics.sectorAccentedBays++;
          wallParts('structure', structural, u - bay / 2 + 0.13, height / 2, outer + face * 0.04, 0.36, height - 0.65, 0.36);
          wallParts('structure', structural, u + bay / 2 - 0.13, height / 2, outer + face * 0.04, 0.36, height - 0.65, 0.36);
          diagnostics.wallBays++;
          // Sparse service modules break the repeated wall rhythm with recognisable machinery.
          // Circular fan cages have real depth; they are not photographs pasted on a plane.
          const wallPoint = (localU, y, localV) => [wallX + (alongX ? localU : localV), y, wallZ + (alongX ? localV : localU)];
          const decal = (cell, key, atU, y, depth, width, h, mat = serviceInk, minTier = 1) => {
            instance(key, atlasPlanes[cell], mat, wallPoint(atU, y, depth), [width, h, 1], [0, alongX ? (face < 0 ? Math.PI : 0) : (face > 0 ? Math.PI / 2 : -Math.PI / 2), 0], wall, minTier);
          };
          const tag = index % 4 === 1 ? 4 : index % 4 === 3 ? 1 : index % 2 ? 6 : 0;
          decal(tag, `service-label-${tag}`, u - Math.min(0.65, bay * 0.1), 4.43, faceDepth + face * 0.17, Math.min(bay * 0.31, 1.4), 0.39);
          diagnostics.labels++;
          if (index % 3 === 0) {
            decal(6, 'deck-identifiers', u + bay * 0.24, height - 1.25, faceDepth + face * 0.105, Math.min(1.05, bay * 0.23), 0.75);
            diagnostics.labels++;
          }
          if (index % 2 === 1) {
            decal(5, 'service-residue', u + bay * 0.29, 1.49, faceDepth + face * 0.152, Math.min(1.22, bay * 0.25), 1.4, residue, 2);
            diagnostics.grimePatches++;
          }
          if (index % 4 === 1) {
            wallParts('structure', structural, u, 2.8, faceDepth + face * 0.14, 2.6, 2.5, 0.27);
            instance('fan-cavities', fanBack, dark, wallPoint(u, 2.8, faceDepth + face * 0.32), [0.97, 0.97, 0.12], [0, angle, 0], wall, 1);
            instance('fan-rims', fanRim, steel, wallPoint(u, 2.8, faceDepth + face * 0.4), [0.99, 0.99, 0.72], [0, angle, 0], wall, 1);
            // Four modelled rotor blades sit behind the protective guard cross.
            for (let blade = 0; blade < 4; blade++) {
              const theta = blade * Math.PI / 2 + 0.4;
              const q = new T.Quaternion().setFromEuler(new T.Euler(0, angle, 0));
              q.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 0, 1), theta));
              const e = new T.Euler().setFromQuaternion(q);
              instance('wall-panel-trim', box, steel, wallPoint(u + Math.cos(theta) * 0.44, 2.8 + Math.sin(theta) * 0.44, faceDepth + face * 0.41), [0.78, 0.22, 0.045], [e.x, e.y, e.z], wall, 1);
            }
            wallParts('wall-panel-trim', steel, u, 2.8, faceDepth + face * 0.47, 2.05, 0.08, 0.07);
            wallParts('wall-panel-trim', steel, u, 2.8, faceDepth + face * 0.47, 0.08, 2.05, 0.07);
            decal(3, 'fan-mesh-screen', u, 2.8, faceDepth + face * 0.435, 1.55, 1.55);
          } else if (index % 4 === 3) {
            // Bevelled service cabinet with inset louver bank and heavy surround.
            wallParts('structure', structural, u, 3.05, faceDepth + face * 0.16, 2.9, 3.0, 0.3);
            wallParts('dark-inset', dark, u, 3.13, faceDepth + face * 0.33, 2.35, 2.45, 0.06);
            for (let slit = 0; slit < 5; slit++) wallParts('vent-slats', steel, u, 2.4 + slit * 0.32, faceDepth + face * 0.37, 1.95, 0.11, 0.07, 1);
            wallParts('indicator', indicator, u - 0.76, 4.02, faceDepth + face * 0.38, 0.14, 0.12, 0.04, 1);
            // A small working phosphor display replaces an uninformative glow block.
            wallParts('dark-inset', dark, u + 0.57, 3.88, faceDepth + face * 0.4, 0.91, 0.61, 0.1);
            decal(2, 'phosphor-terminals', u + 0.57, 3.88, faceDepth + face * 0.46, 0.76, 0.49, phosphor);
            for (let key = 0; key < 5; key++) wallParts('wall-panel-trim', steel, u + 0.27 + key * 0.15, 3.51, faceDepth + face * 0.46, 0.065, 0.045, 0.04, 1);
          }
          // Compact service luminaires, grounded by matte housings and end clamps.
          if (index % 2 === 0) {
            const warm = boundary > 20;
            wallParts('dark-inset', dark, u, 5.6, faceDepth + face * 0.05, Math.min(bay * 0.65, 3.4), 0.5, 0.25);
            wallParts(warm ? 'lamps-warm' : 'lamps-cool', warm ? warmLamp : coolLamp, u, 5.6, faceDepth + face * 0.15, Math.min(bay * 0.57, 2.9), 0.15, 0.12);
            wallParts('indicator', indicator, u + bay * 0.32, 1.25, faceDepth + face * 0.08, 0.08, 0.22, 0.04, 1);
            const spillPoint = wallPoint(u, 0.041, faceDepth + face * 1.35);
            practicalSpills.push({ point: spillPoint, width: Math.min(bay * 0.72, 4.5), angle,
              color: warm ? 0xc6a270 : 0x90b6b4 });
          }
          // Four recessed fasteners per panel, batched with other polished metal.
          for (const du of [-0.42, 0.42]) for (const y of [1.1, 3.95]) {
            const atU = u + du * (bay - 0.4);
            instance('fastener-recesses', bolt, dark, wallPoint(atU, y, faceDepth + face * 0.154), [0.09, 0.09, 0.028], [0, angle, 0], wall, 1);
            instance('hex-fasteners', bolt, steel, wallPoint(atU, y, faceDepth + face * 0.17), [0.052, 0.052, 0.027], [0, angle, 0], wall, 1);
            wallParts('dark-inset', dark, atU, y, faceDepth + face * 0.187, 0.051, 0.009, 0.003, 1);
            diagnostics.recessedFasteners++;
          }
          // Continuous weld beads at bumper joins, rather than bright painted seams.
          instance('weld-beads', rod, dark, wallPoint(u - bay / 2 + 0.33, 0.9, faceDepth + face * 0.322), [0.024, 0.59, 0.024], [0, 0, 0], wall, 2);
        }
        // Conduit remains flush against bulkheads, never hanging across traversal.
        for (let cable = 0; cable < 3; cable++) {
          const v = face * (thickness / 2 + 0.12);
          instance(cable === 2 ? 'cable' : 'conduit', rod, cable === 2 ? rubber : steel,
            [wallX + (alongX ? 0 : v), 6.75 + cable * 0.31, wallZ + (alongX ? v : 0)],
            [cable === 2 ? 0.08 : 0.12, length - 0.5, cable === 2 ? 0.08 : 0.12],
            alongX ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0], wall, 1);
        }
        // Compression sleeves and saddles make each long service run physically assembled.
        for (let sleeve = 0; sleeve <= count; sleeve++) {
          const u = -length / 2 + bay * sleeve;
          for (let pipe = 0; pipe < 2; pipe++) {
            const v = face * (thickness / 2 + 0.12);
            instance('conduit', rod, steel, [wallX + (alongX ? u : v), 6.75 + pipe * 0.31, wallZ + (alongX ? v : u)], [0.18, 0.15, 0.18], alongX ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0], wall, 1);
          }
        }
        // A single downward return per wall face feeds a mounted junction housing.
        const endU = -length / 2 + 0.65;
        const serviceV = face * (thickness / 2 + 0.16);
        const elbowPosition = [wallX + (alongX ? endU : serviceV), 6.42, wallZ + (alongX ? serviceV : endU)];
        instance('conduit-elbows', elbow, steel, elbowPosition, [1, 1, 1], [0, angle, 0], wall, 1);
        instance('conduit', rod, steel, [elbowPosition[0] + (alongX ? 0.34 : 0), 5.93, elbowPosition[2] - (alongX ? 0 : 0.34)], [0.105, 0.9, 0.105], [0, 0, 0], wall, 1);
        wallParts('structure', structural, endU + (alongX ? 0.34 : -0.34), 5.28, serviceV, 0.67, 0.58, 0.32);
      }
      wallStates.set(wall, true);
    }

    // Flush maintenance drains and lane seams: detail underfoot, never fake obstacles.
    for (const x of [-6.2, 6.2]) {
      for (let z = -63; z <= 63; z += 7) {
        part('floor-drain', dark, x, 0.014, z, 1.35, 0.022, 4.9);
        for (let bar = 0; bar < 10; bar++) part('grate-bars', steel, x, 0.047, z - 2.12 + bar * 0.47, 1.19, 0.075, 0.14, 0, null, 1);
        for (const side of [-1, 1]) part('floor-drain-frames', structural, x + side * 0.69, 0.046, z, 0.12, 0.08, 5.02);
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
    const contact = material(new T.MeshBasicMaterial({ map: radialTexture(true), transparent: true, opacity: 0.49, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }));
    const spill = material(new T.MeshBasicMaterial({ map: radialTexture(), transparent: true, opacity: 0.55, depthWrite: false, blending: T.AdditiveBlending }));
    // Footprints come from current collision owners, after deterministic map
    // placement. Five old fixed blobs stayed behind when fixtures moved and
    // were below the new bay floors. These low-opacity contacts instead follow
    // the real prop, its visibility and its vertical displacement.
    const contactOwners = new Map(), contactTracks = [];
    for (const collider of options.colliders || []) {
      if (![collider.minX, collider.maxX, collider.minZ, collider.maxZ].every(Number.isFinite)) continue;
      const owner = Object.entries(collider).find(([key, value]) => /Ref$/.test(key) && value?.mesh?.isObject3D)?.[1];
      if (!owner || owner.mesh.userData?.hiveGlobalDecorations) continue;
      const box = contactOwners.get(owner) || { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity };
      box.minX = Math.min(box.minX, collider.minX); box.maxX = Math.max(box.maxX, collider.maxX);
      box.minZ = Math.min(box.minZ, collider.minZ); box.maxZ = Math.max(box.maxZ, collider.maxZ);
      contactOwners.set(owner, box);
    }
    parent.updateMatrixWorld(true);
    const origin = new T.Vector3(), modelBox = new T.Box3();
    const contactToLocal = new T.Matrix4().copy(parent.matrixWorld).invert();
    for (const [record, bounds] of contactOwners) {
      const owner = record.mesh, w = bounds.maxX - bounds.minX, d = bounds.maxZ - bounds.minZ;
      if (w <= 0 || d <= 0 || w > 22 || d > 22) continue;
      modelBox.setFromObject(owner).applyMatrix4(contactToLocal);
      if (modelBox.isEmpty() || modelBox.min.y > 0.55) continue;
      owner.getWorldPosition(origin).applyMatrix4(contactToLocal);
      const x = (bounds.minX + bounds.maxX) / 2, z = (bounds.minZ + bounds.maxZ) / 2;
      const index = contactTracks.length;
      instance('contact-shadows', plane, contact, [x, 0.038, z], [Math.max(0.4, w * 0.92), Math.max(0.4, d * 0.92), 1], [-Math.PI / 2, 0, 0]);
      contactTracks.push({ owner, index, x: origin.x, y: origin.y, z: origin.z,
        dx: x - origin.x, dz: z - origin.z, width: Math.max(0.4, w * 0.92), depth: Math.max(0.4, d * 0.92), visible: true });
    }
    // Empty callers retain a zero-instance owned material, not fake machinery.
    if (!batches.has('contact-shadows')) batches.set('contact-shadows', { geo: plane, mat: contact, instances: [], minTier: 0, mesh: null });
    diagnostics.contactShadows = contactTracks.length;
    for (const { point, width, angle, color } of practicalSpills) {
      instance('floor-light-spill', plane, spill, point, [width, 3.5, 1], [-Math.PI / 2, 0, angle], null, 1, color);
    }
    diagnostics.practicalSpills = practicalSpills.length;

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
      const mesh = new T.InstancedMesh(tier === 0 && batch.geo === chamfer ? box : batch.geo, batch.mat, batch.instances.length);
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
    diagnostics.chamferedGeometry = true;
    diagnostics.estimatedTriangles = Array.from(batches.values()).reduce((sum, batch) => sum + (batch.geo.index ? batch.geo.index.count : batch.geo.attributes.position.count) / 3 * batch.instances.length, 0);

    function setQuality(profile) {
      tier = qualityTier(profile); diagnostics.tier = tier; dust.visible = tier >= 2;
      for (const batch of batches.values()) {
        batch.mesh.visible = tier >= batch.minTier;
        batch.mesh.geometry = tier === 0 && batch.geo === chamfer ? box : batch.geo;
      }
      updateDiagnostics();
    }
    function updateDiagnostics() {
      diagnostics.activeBatches = (dust.visible ? 1 : 0) + Array.from(batches.values()).filter((batch) => batch.mesh.visible).length;
      diagnostics.activeTriangles = Array.from(batches.values()).reduce((sum, batch) => {
        const geo = batch.mesh.geometry;
        return sum + (batch.mesh.visible ? (geo.index ? geo.index.count : geo.attributes.position.count) / 3 * batch.instances.length : 0);
      }, 0);
    }
    updateDiagnostics();
    let surfaceMapsReady = false;
    function refreshSurfaceMaps() {
      if (surfaceMapsReady) return;
      const maps = window.HiveModelFactory?.textures;
      if (!maps?.industrialNormal || !maps?.industrialRoughness) return;
      // The factory owns these textures; this module borrows them and never disposes them.
      for (const mat of [structural, recessed, steel, wallPaint]) {
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
      const contactBatch = batches.get('contact-shadows');
      let contactsChanged = false;
      parent.updateWorldMatrix(true, false);
      contactToLocal.copy(parent.matrixWorld).invert();
      for (const track of contactTracks) {
        const owner = track.owner;
        owner.getWorldPosition(origin).applyMatrix4(contactToLocal);
        let visible = !!owner.parent && !owner.userData?.hiveFactoryDisposed && Math.abs(origin.y - track.y) < 0.55;
        for (let at = owner; visible && at; at = at.parent) if (!at.visible) visible = false;
        if (track.visible === visible && track.x === origin.x && track.z === origin.z) continue;
        track.visible = visible; track.x = origin.x; track.z = origin.z;
        if (visible) {
          dummy.position.set(origin.x + track.dx, 0.038, origin.z + track.dz);
          dummy.rotation.set(-Math.PI / 2, 0, 0); dummy.scale.set(track.width, track.depth, 1); dummy.updateMatrix();
          contactBatch.mesh.setMatrixAt(track.index, dummy.matrix);
        } else contactBatch.mesh.setMatrixAt(track.index, hiddenMatrix);
        contactsChanged = true;
      }
      if (contactsChanged) contactBatch.mesh.instanceMatrix.needsUpdate = true;
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
      contactTracks.length = 0; contactOwners.clear(); practicalSpills.length = 0;
    }
    update();
    return { group, update, setQuality, dispose, diagnostics };
  }

  window.HiveStationDetail = Object.freeze({ build });
})();
