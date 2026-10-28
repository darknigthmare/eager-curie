/* HIVE ASCENSION — joint-aware human anatomy and batched industrial finishing.
 * All additions belong to their factory model and use its disposal contract.
 */
(function exposeModelDetail(global) {
  'use strict';

  function materialOf(root, kind) {
    let found = null;
    root.traverse((object) => {
      if (found || !object.material) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      found = materials.find((material) => material.userData?.hiveMaterialKind === kind) || null;
    });
    return found;
  }

  // The complete prop catalogue shares a single small, deterministic print/CRT
  // atlas. A bitmap font also works in headless tests (no DOM/canvas dependency).
  // Its last material owner releases it, so rebuilding maps cannot leak textures.
  let industrialAtlas = null;
  function acquireIndustrialAtlas(T) {
    if (industrialAtlas) { industrialAtlas.references++; return industrialAtlas; }
    const width = 512, height = 256, pixels = new Uint8Array(width * height * 4);
    const font = {
      A:[14,17,17,31,17,17,17],B:[30,17,17,30,17,17,30],C:[14,17,16,16,16,17,14],D:[30,17,17,17,17,17,30],
      E:[31,16,16,30,16,16,31],F:[31,16,16,30,16,16,16],G:[14,17,16,23,17,17,15],H:[17,17,17,31,17,17,17],
      I:[31,4,4,4,4,4,31],J:[7,2,2,2,18,18,12],K:[17,18,20,24,20,18,17],L:[16,16,16,16,16,16,31],
      M:[17,27,21,21,17,17,17],N:[17,25,21,19,17,17,17],O:[14,17,17,17,17,17,14],P:[30,17,17,30,16,16,16],
      Q:[14,17,17,17,21,18,13],R:[30,17,17,30,20,18,17],S:[15,16,16,14,1,1,30],T:[31,4,4,4,4,4,4],
      U:[17,17,17,17,17,17,14],V:[17,17,17,17,17,10,4],W:[17,17,17,21,21,21,10],X:[17,17,10,4,10,17,17],
      Y:[17,17,10,4,4,4,4],Z:[31,1,2,4,8,16,31],0:[14,17,19,21,25,17,14],1:[4,12,4,4,4,4,14],
      2:[14,17,1,2,4,8,31],3:[30,1,1,14,1,1,30],4:[2,6,10,18,31,2,2],5:[31,16,16,30,1,1,30],
      6:[14,16,16,30,17,17,14],7:[31,1,2,4,8,8,8],8:[14,17,17,14,17,17,14],9:[14,17,17,15,1,1,14],
      '/':[1,2,2,4,8,8,16],'-':[0,0,0,31,0,0,0],'.':[0,0,0,0,0,12,12],':':[0,12,12,0,12,12,0],'>':[16,8,4,2,4,8,16],
      '!':[4,4,4,4,4,0,4],'%':[17,2,4,4,8,16,17]
    };
    const ink = [30, 38, 32], paper = [194, 187, 151], amber = [181, 157, 78], phosphor = [139, 173, 116];
    function rect(x, y, w, h, color) {
      for (let row = Math.max(0, y); row < Math.min(height, y + h); row++) for (let col = Math.max(0, x); col < Math.min(width, x + w); col++) {
        const p = (row * width + col) * 4; pixels[p] = color[0]; pixels[p + 1] = color[1]; pixels[p + 2] = color[2]; pixels[p + 3] = 255;
      }
    }
    function text(cell, value, x, y, color = ink, scale = 1) {
      const ox = cell % 4 * 128, oy = Math.floor(cell / 4) * 128;
      for (const character of value) {
        const glyph = font[character];
        if (glyph) for (let row = 0; row < 7; row++) for (let col = 0; col < 5; col++) if (glyph[row] & (1 << (4 - col))) rect(ox + x + col * scale, oy + y + row * scale, scale, scale, color);
        x += 6 * scale;
      }
    }
    const background = (cell, color) => rect(cell % 4 * 128, Math.floor(cell / 4) * 128, 128, 128, color);
    background(0, paper); text(0, 'W-Y SYSTEMS', 7, 8, ink, 1); text(0, 'MNEMOSYNE', 7, 24, ink, 2);
    text(0, 'SERIAL 407-02', 7, 48); text(0, 'DECK B / REV C', 7, 62); text(0, 'MASS 124 KG', 7, 76);
    for (let bar = 0; bar < 31; bar++) rect(7 + bar * 3, 93, 1 + bar % 2, 24 - bar % 5, ink);
    background(1, amber); text(1, 'CAUTION', 21, 10, ink, 2); text(1, '!', 53, 34, ink, 4);
    text(1, 'PRESSURISED', 13, 73); text(1, 'ISOLATE BEFORE', 7, 89); text(1, 'MAINTENANCE', 13, 106);
    background(2, [12, 27, 19]); text(2, 'MNE ENV. CONTROL', 7, 8, phosphor); text(2, 'AIR 101.3 KPA', 7, 25, phosphor);
    text(2, 'O2 20.9%   OK', 7, 39, phosphor); text(2, 'FILTER 07 ON', 7, 92, phosphor); text(2, 'AUTO / STANDBY', 7, 110, phosphor);
    for (let x = 7; x < 121; x++) rect(256 + x, 65 + Math.round(Math.sin(x * .18) * 4) - (x % 37 < 4 ? 13 : 0), 1, 2, phosphor);
    for (let y = 0; y < 128; y += 3) for (let x = 256; x < 384; x++) { const p = (y * width + x) * 4; pixels[p] *= .72; pixels[p + 1] *= .72; pixels[p + 2] *= .72; }
    background(3, paper); text(3, 'SERVICE ACCESS', 7, 11); text(3, 'AIRFLOW', 15, 33, ink, 2); text(3, '>>>>>', 28, 57, ink, 2);
    text(3, 'TYPE 7-C / 024', 7, 86); text(3, 'DO NOT OBSTRUCT', 7, 107);
    background(4, [182, 174, 146]); text(4, 'BIOHAZARD', 10, 10, ink, 2); text(4, 'QUARANTINE', 7, 38); text(4, 'SEALED SPECIMEN', 7, 57);
    text(4, 'AUTHORISED', 7, 84); text(4, 'PERSONNEL ONLY', 7, 104);
    background(5, amber); text(5, 'HIGH VOLTAGE', 7, 11); text(5, '440V', 27, 33, ink, 3);
    text(5, 'LOCK OUT / TAG OUT', 7, 73); text(5, 'EARTH BEFORE USE', 7, 94); text(5, 'MNE-E-07', 7, 113);
    background(6, paper); text(6, 'INERT CONTENTS', 7, 12); text(6, 'FLUID TRANSFER', 7, 35); text(6, 'RETURN / 07', 7, 59);
    text(6, 'MAX 8.5 BAR', 7, 83); text(6, 'FLOW >>>', 7, 107);
    background(7, amber);
    for (let y = 128; y < 256; y++) for (let x = 384; x < 512; x++) if ((x - y + 256) % 38 < 18) rect(x, y, 1, 1, ink);
    // Printing is scuffed, never glowing neon or perfectly clean vinyl.
    for (let n = 0; n < 270; n++) if (n % 4) rect((n * 137) % width, (n * 71) % height, 1 + n % 5, 1, [119, 116, 92]);
    const texture = new T.DataTexture(pixels, width, height, T.RGBAFormat);
    texture.flipY = true; texture.encoding = T.sRGBEncoding; texture.anisotropy = 4; texture.needsUpdate = true;
    industrialAtlas = { texture, references: 1 };
    return industrialAtlas;
  }
  function industrialPrintMaterial(T, reuse) {
    const atlas = acquireIndustrialAtlas(T);
    const material = reuse || new T.MeshStandardMaterial({ color: 0xffffff, roughness: .86, metalness: .02, polygonOffset: true, polygonOffsetFactor: -1 });
    material.map = atlas.texture; material.color.setHex(0xffffff);
    material.userData.hiveIndustrialPrint = true;
    if (reuse) {
      material.emissive.setHex(0x8fa480); material.emissiveMap = atlas.texture;
      material.emissiveIntensity = .32; material.roughness = .34;
    }
    let released = false;
    material.addEventListener('dispose', () => {
      if (released) return; released = true;
      if (--atlas.references === 0) { atlas.texture.dispose(); if (industrialAtlas === atlas) industrialAtlas = null; }
    });
    material.needsUpdate = true;
    return material;
  }
  function atlasUV(geometry, cell) {
    const uv = geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (cell % 4 + .015 + uv.getX(i) * .97) / 4,
      1 - (Math.floor(cell / 4) + .985 - uv.getY(i) * .97) / 2);
    return geometry;
  }
  function displayUV(geometry, cell) {
    // Bevelled factory boxes use extrusion UVs in world units. Project the front
    // face explicitly so a 9-inch monitor never samples another atlas cell.
    geometry.computeBoundingBox(); const bounds = geometry.boundingBox;
    const width = Math.max(.001, bounds.max.x - bounds.min.x), height = Math.max(.001, bounds.max.y - bounds.min.y), depth = Math.max(.001, bounds.max.z - bounds.min.z);
    const position = geometry.attributes.position, uv = geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      if (height < Math.min(width, depth)) uv.setXY(i, (position.getX(i) - bounds.min.x) / width, 1 - (position.getZ(i) - bounds.min.z) / depth);
      else if (width < Math.min(height, depth)) uv.setXY(i, 1 - (position.getZ(i) - bounds.min.z) / depth, (position.getY(i) - bounds.min.y) / height);
      else uv.setXY(i, (position.getX(i) - bounds.min.x) / width, (position.getY(i) - bounds.min.y) / height);
    }
    return atlasUV(geometry, cell);
  }

  // Merge small details by material and animation parent. This avoids a new draw
  // call for every screw, finger segment, button and seam.
  function batcher(T) {
    const parents = new Map();
    const position = new T.Vector3();
    const scale = new T.Vector3();
    const quaternion = new T.Quaternion();
    const matrix = new T.Matrix4();
    const euler = new T.Euler();
    function add(parent, material, geometry, at, size, rotation) {
      if (!parent || !material) { geometry.dispose(); return; }
      position.set(at[0], at[1], at[2]);
      scale.set(size?.[0] ?? 1, size?.[1] ?? 1, size?.[2] ?? 1);
      euler.set(rotation?.[0] || 0, rotation?.[1] || 0, rotation?.[2] || 0);
      quaternion.setFromEuler(euler);
      matrix.compose(position, quaternion, scale);
      let nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry;
      if (nonIndexed !== geometry) geometry.dispose();
      nonIndexed.applyMatrix4(matrix);
      let materials = parents.get(parent);
      if (!materials) parents.set(parent, materials = new Map());
      let entries = materials.get(material);
      if (!entries) materials.set(material, entries = []);
      entries.push(nonIndexed);
    }
    return {
      mesh(parent, object) {
        add(parent, object.material, object.geometry.clone(), object.position.toArray(), object.scale.toArray(), [object.rotation.x, object.rotation.y, object.rotation.z]);
      },
      box(parent, material, at, size, rotation) {
        add(parent, material, new T.BoxGeometry(1, 1, 1), at, size, rotation);
      },
      decal(parent, material, cell, at, size, rotation) {
        add(parent, material, atlasUV(new T.PlaneGeometry(1, 1), cell), at, [size[0], size[1], 1], rotation);
      },
      transformed(parent, material, geometry, transform) {
        geometry.applyMatrix4(transform);
        add(parent, material, geometry, [0, 0, 0], [1, 1, 1]);
      },
      oval(parent, material, at, size, rotation, segments = 20) {
        add(parent, material, new T.SphereGeometry(1, segments, Math.max(10, Math.floor(segments * 0.7))), at, size, rotation);
      },
      cylinder(parent, material, at, radius, length, rotation, segments = 16) {
        add(parent, material, new T.CylinderGeometry(radius, radius, length, segments, 1), at, [1, 1, 1], rotation);
      },
      path(parent, material, points, radii, segments = 24, radial = 10) {
        const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)), false, 'centripetal');
        const geometry = new T.TubeGeometry(curve, segments, 1, radial, false);
        const position = geometry.attributes.position;
        for (let row = 0; row <= segments; row++) {
          const t = row / segments, center = curve.getPointAt(t);
          const scaled = t * (radii.length - 1), lo = Math.min(radii.length - 2, Math.floor(scaled));
          const radius = T.MathUtils.lerp(radii[lo], radii[lo + 1], scaled - lo);
          for (let col = 0; col <= radial; col++) {
            const i = row * (radial + 1) + col;
            position.setXYZ(i, center.x + (position.getX(i) - center.x) * radius,
              center.y + (position.getY(i) - center.y) * radius, center.z + (position.getZ(i) - center.z) * radius);
          }
        }
        geometry.computeVertexNormals();
        add(parent, material, geometry, [0,0,0], [1,1,1]);
      },
      panel(parent, material, at, size, rotation, bulge = .014) {
        const w = size[0], h = size[1], d = size[2];
        const shape = new T.Shape();
        const r = Math.min(w,h) * .13;
        shape.moveTo(-w/2+r,-h/2);shape.lineTo(w/2-r,-h/2);shape.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);
        shape.lineTo(w/2,h/2-r);shape.quadraticCurveTo(w/2,h/2,w/2-r,h/2);
        shape.lineTo(-w/2+r,h/2);shape.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);
        shape.lineTo(-w/2,-h/2+r);shape.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
        const geometry = new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSize:r*.32,bevelThickness:r*.2,bevelSegments:3,curveSegments:8,steps:1});
        const positions = geometry.attributes.position;
        for(let i=0;i<positions.count;i++) {
          const x=positions.getX(i),y=positions.getY(i);
          positions.setZ(i,positions.getZ(i)+bulge*Math.max(0,1-Math.pow(x/(w*.52),2))*Math.max(0,1-Math.pow(y/(h*.52),2)));
        }
        geometry.computeVertexNormals();
        add(parent,material,geometry,at,[1,1,1],rotation);
      },
      tube(parent, material, points, radius) {
        const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)));
        add(parent, material, new T.TubeGeometry(curve, 28, radius, 8, false), [0, 0, 0], [1, 1, 1]);
      },
      finish() {
        let meshes = 0;
        let triangles = 0;
        for (const [parent, materials] of parents) {
          for (const [material, entries] of materials) {
            const vertices = entries.reduce((sum, geometry) => sum + geometry.attributes.position.count, 0);
            const position = new Float32Array(vertices * 3);
            const normal = new Float32Array(vertices * 3);
            const uv = new Float32Array(vertices * 2);
            let vertex = 0;
            for (const geometry of entries) {
              const count = geometry.attributes.position.count;
              position.set(geometry.attributes.position.array, vertex * 3);
              normal.set(geometry.attributes.normal.array, vertex * 3);
              if (geometry.attributes.uv) uv.set(geometry.attributes.uv.array, vertex * 2);
              vertex += count;
              geometry.dispose();
            }
            const geometry = new T.BufferGeometry();
            geometry.setAttribute('position', new T.BufferAttribute(position, 3));
            geometry.setAttribute('normal', new T.BufferAttribute(normal, 3));
            geometry.setAttribute('uv', new T.BufferAttribute(uv, 2));
            geometry.setAttribute('uv2', new T.BufferAttribute(uv.slice(), 2));
            geometry.computeBoundingSphere();
            const mesh = new T.Mesh(geometry, material);
            mesh.name = 'surface_detail_batch';
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData.hiveSurfaceDetail = true;
            parent.add(mesh);
            meshes++;
            triangles += vertices / 3;
          }
        }
        return { meshes, triangles };
      }
    };
  }

  function moveWithJoint(root, name, parent) {
    const object = root.getObjectByName(name);
    if (!object || !parent || object.parent === parent) return object;
    root.updateMatrixWorld(true);
    parent.attach(object);
    return object;
  }

  function refineSmoothGeometry(T, root) {
    root.traverse((object) => {
      if (!object.isMesh || !object.geometry?.parameters || object.userData.hiveDetailFitted) return;
      const old = object.geometry;
      const p = old.parameters;
      let geometry;
      if (old.type === 'SphereGeometry' && p.widthSegments < 32) {
        geometry = new T.SphereGeometry(p.radius, 32, 24, p.phiStart, p.phiLength, p.thetaStart, p.thetaLength);
      } else if (old.type === 'CylinderGeometry' && p.radialSegments < 24) {
        geometry = new T.CylinderGeometry(p.radiusTop, p.radiusBottom, p.height, 24, p.heightSegments, p.openEnded, p.thetaStart, p.thetaLength);
      }
      if (!geometry) return;
      if (geometry.attributes.uv) geometry.setAttribute('uv2', geometry.attributes.uv.clone());
      object.geometry = geometry;
      old.dispose();
    });
  }

  function refitHumanSilhouette(root, profile, type, T) {
    const combat = ['guard', 'marine', 'smartgunner', 'incinerator', 'commando'].includes(type);
    const bareHead = ['civilian', 'scientist'].includes(type);
    const removedMaterials = new Set();
    const discard = object => {
      if (!object) return;
      object.parent?.remove(object);
      object.traverse(child => {
        child.geometry?.dispose();
        if (child.material) (Array.isArray(child.material) ? child.material : [child.material]).forEach(m => removedMaterials.add(m));
      });
    };
    const replace = (mesh, geometry) => {
      if (!mesh) { geometry.dispose(); return; }
      geometry.computeVertexNormals();
      if (geometry.attributes.uv) geometry.setAttribute('uv2', geometry.attributes.uv.clone());
      mesh.geometry.dispose();
      mesh.geometry = geometry;
      mesh.userData.hiveDetailFitted = true;
    };
    const section = (mesh, rings) => {
      const vertices = [], uv = [], indices = [];
      const radial = 64, rows = mesh.name === 'torso' ? 72 : 28;
      const cubic = (a,b,c,d,t) => .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
      for (let row = 0; row <= rows; row++) {
        const scaled = row / rows * (rings.length-1), segment = Math.min(rings.length-2,Math.floor(scaled)), t = scaled-segment;
        const a=rings[Math.max(0,segment-1)],b=rings[segment],c=rings[segment+1],d=rings[Math.min(rings.length-1,segment+2)];
        const y=cubic(a[0],b[0],c[0],d[0],t),width=cubic(a[1],b[1],c[1],d[1],t),depth=cubic(a[2],b[2],c[2],d[2],t);
        const edgeDip=T.MathUtils.lerp(b[3]||0,c[3]||0,t);
        for (let col = 0; col <= radial; col++) {
          const angle = col / radial * Math.PI * 2;
          const waist=Math.exp(-Math.pow((y-1.96)/.16,2));
          const armpit=Math.exp(-Math.pow((y-2.99)/.2,2))*Math.pow(Math.abs(Math.sin(angle)),4);
          const fold=.008*Math.sin((y-1.8)*57+Math.sin(angle)*2.5)*waist+.006*Math.sin(y*46-angle*2.2)*armpit;
          const x = Math.sin(angle) * (width+fold);
          const z = Math.cos(angle) * (depth+fold);
          vertices.push(x / mesh.scale.x, (y - mesh.position.y - Math.abs(Math.sin(angle)) * edgeDip) / mesh.scale.y, z / mesh.scale.z);
          uv.push(col / radial, row / rows);
          if (row < rows && col < radial) {
            const a = row * (radial + 1) + col;
            const b = a + radial + 1;
            if (rings[rings.length - 1][0] > rings[0][0]) indices.push(a, a + 1, b, b, a + 1, b + 1);
            else indices.push(a, b, a + 1, b, b + 1, a + 1);
          }
        }
      }
      const geometry = new T.BufferGeometry();
      geometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
      geometry.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      geometry.setIndex(indices);
      replace(mesh, geometry);
    };
    const torso = root.getObjectByName('torso');
    const pelvis = root.getObjectByName('pelvis');
    const torsoY = torso?.position.y || 2.75;
    const torsoRings = [
      [1.75, profile.pelvis.x * .94, profile.pelvis.z * .95],
      [1.9, profile.torso.x * .72, profile.torso.z * .79],
      [2.12, profile.torso.x * .76, profile.torso.z * .85],
      [2.38, profile.torso.x * .88, profile.torso.z * .99],
      [2.72, profile.torso.x, profile.torso.z * 1.02],
      [3.02, profile.torso.x * 1.02, profile.torso.z * .95],
      [3.18, profile.torso.x * .93, profile.torso.z * .79],
      [3.34, profile.torso.x * .48, profile.torso.z * .55],
      [3.46, .17, .14]
    ];
    if (torso) section(torso,torsoRings);
    if (pelvis) section(pelvis, [
      [1.82, profile.pelvis.x * .96, profile.pelvis.z * .96],
      [1.74, profile.pelvis.x * 1.06, profile.pelvis.z * 1.05],
      [1.61, profile.pelvis.x * 1.08, profile.pelvis.z * 1.04],
      [1.55, profile.pelvis.x * .98, profile.pelvis.z * .91, .08]
    ]);
    const belt = root.getObjectByName('utility_belt');
    if (belt) {
      const geometry = new T.CylinderGeometry(1, 1, .105, 48, 1, true);
      geometry.scale(profile.pelvis.x * 1.03, 1, profile.pelvis.z * 1.08);
      replace(belt, geometry);
    }
    const plate = root.getObjectByName('chest_armor');
    if (bareHead) discard(plate);
    else if (plate) {
      const w = profile.chest.x * .49, h = profile.chest.y * .54;
      const shape = new T.Shape();
      shape.moveTo(-w * .7, h);
      shape.lineTo(-w * .2, h * .8);
      shape.lineTo(w * .2, h * .8);
      shape.lineTo(w * .7, h);
      shape.lineTo(w, h * .5);
      shape.lineTo(w * .93, -h * .75);
      shape.lineTo(w * .65, -h);
      shape.lineTo(-w * .65, -h);
      shape.lineTo(-w * .93, -h * .75);
      shape.lineTo(-w, h * .5);
      shape.closePath();
      const geometry = new T.ExtrudeGeometry(shape, {depth:.038, bevelEnabled:true, bevelSize:.022, bevelThickness:.016, bevelSegments:2, steps:1, curveSegments:2});
      const positions = geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) positions.setZ(i, positions.getZ(i) - Math.pow(positions.getX(i) / Math.max(.1,w), 2) * .13);
      replace(plate, geometry);
      plate.position.z = profile.torso.z * .98;
    }
    for (const side of [-1, 1]) {
      const suffix = side < 0 ? 'left' : 'right';
      const arm = root.getObjectByName(`arm_${suffix}`);
      const leg = root.getObjectByName(`leg_${suffix}`);
      const smoothLimb = (parent, points, radii) => {
        if (!parent) return;
        const segment = parent.children.find(o => /_segment_0$/.test(o.name));
        if (!segment) return;
        for (const child of [...parent.children]) if (child !== segment && /(_segment_[1-9]|_joint_|_terminal_joint)/.test(child.name)) discard(child);
        const curve = new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)), false, 'centripetal');
        const tubular = 72, radial = 32;
        const geometry = new T.TubeGeometry(curve, tubular, 1, radial, false);
        const position = geometry.attributes.position;
        for (let row = 0; row <= tubular; row++) {
          const t = row / tubular;
          const center = curve.getPointAt(t);
          const scaled = t * (radii.length - 1);
          const lo = Math.min(radii.length - 2, Math.floor(scaled));
          const radius = T.MathUtils.lerp(radii[lo], radii[lo + 1], scaled - lo);
          for (let col = 0; col <= radial; col++) {
            const i = row * (radial + 1) + col;
            const theta=col/radial*Math.PI*2;
            const joint=Math.exp(-Math.pow((t-.52)/.125,2));
            const cuff=Math.exp(-Math.pow((t-.9)/.065,2));
            const compression=.009*Math.sin(t*103+Math.sin(theta)*1.8)*joint*(.3+.7*Math.max(0,Math.cos(theta)));
            const tension=.006*Math.sin(t*122+theta*.4)*cuff;
            const section=radius+compression+tension;
            position.setXYZ(i,
              center.x + (position.getX(i) - center.x) * section,
              center.y + (position.getY(i) - center.y) * section,
              center.z + (position.getZ(i) - center.z) * section);
          }
        }
        replace(segment, geometry);
        segment.position.set(0,0,0);
        segment.quaternion.identity();
        segment.scale.set(1,1,1);
      };
      const carrying = side > 0 && (combat || ['scientist','synthetic'].includes(type));
      const wrist=carrying? [combat?-.18:.08,-1.02,.68]:[side*.1,-1.3,.3];
      smoothLimb(arm, [[0,0,0],[side * .14,-.32,.025],[side * .2,-.64,.1],[wrist[0]*.8,-.94,wrist[2]*.75],wrist],
        [combat ? .195 : .175, combat ? .19 : .17, .145, .16, .12]);
      if(arm) arm.userData.restWrist=wrist;
      smoothLimb(leg, [[0,0,0],[side * .025,-.35,side * .035],[side * .06,-.8,side * .08],[side * .035,-1.2,.055],[side * .02,-1.54,.04]],
        [combat ? .255 : .23, combat ? .24 : .215, .17, .18, .125]);
      const pauldron = root.getObjectByName(`${type}_pauldron_${suffix}`);
      if (pauldron) {
        const geometry = new T.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI * .6);
        geometry.scale(.255,.21,.285);
        replace(pauldron, geometry);
      }
      if (bareHead) discard(root.getObjectByName(`belt_pouch_${side}`));
    }
    if (bareHead) {
      const helmet = root.getObjectByName('helmet_and_comms');
      for (const name of ['helmet_shell','visor','comms_module','microphone_boom']) discard(helmet?.getObjectByName(name));
    }
    return { bareHead, removedMaterials, frontAt(x,y) {
      const segment=Math.max(0,Math.min(torsoRings.length-2,torsoRings.findIndex(r=>r[0]>y)-1));
      const a=torsoRings[segment],b=torsoRings[segment+1],t=T.MathUtils.clamp((y-a[0])/(b[0]-a[0]),0,1);
      const width=T.MathUtils.lerp(a[1],b[1],t),depth=T.MathUtils.lerp(a[2],b[2],t);
      return depth*Math.sqrt(Math.max(.04,1-Math.pow(x/width,2)));
    } };
  }

  function humanDetail(factory, root, type, T) {
    if (['powerloader', 'labhound', 'labrodent'].includes(type)) return null;
    const head = root.getObjectByName('head');
    if (!head) return null; // Animals use their own anatomy, not human equipment.
    const profile = factory._humanVisualProfile(type, false);
    const uniform = materialOf(root, 'fabric');
    const armor = materialOf(root, 'industrial');
    const dark = materialOf(root, 'darkMetal');
    const skin = materialOf(root, 'skin');
    const visor = materialOf(root, 'glass');
    const accent = materialOf(root, type === 'incinerator' ? 'emissiveAmber' : 'emissiveGreen');
    const combat = ['guard', 'marine', 'smartgunner', 'incinerator', 'commando'].includes(type);
    const synthetic = type === 'synthetic';
    if (!uniform || !armor || !dark || !skin) return null;
    const suitColors = { civilian: 0x687476, scientist: 0xaebdbe, guard: 0x46535d, marine: 0x56614b, smartgunner: 0x47533f, incinerator: 0x846249, synthetic: 0xbac1c0, commando: 0x29363c };
    uniform.color.set(suitColors[type] || 0x687476);
    uniform.roughness = 0.88;
    armor.roughness = Math.max(armor.roughness, 0.48);
    skin.roughness = synthetic ? 0.55 : 0.7;
    const faceShadow = factory._material('skin', { color: synthetic ? 0x738b8c : 0x835347, roughness: 0.74, metalness: 0 });
    const silhouette = refitHumanSilhouette(root, profile, type, T);
    const batches = batcher(T);
    const torsoY = root.getObjectByName('torso')?.position.y || 2.75;
    const helmet = root.getObjectByName('helmet_and_comms');
    // The original rig animated sleeves and helmet but left skin/extremities in
    // root space. Attach these parts while preserving the initial world pose.
    if (helmet) {
      moveWithJoint(root, 'head', helmet);
      moveWithJoint(root, 'neck', helmet);
      if (type === 'incinerator') moveWithJoint(root, 'incinerator_respirator_mask', helmet);
      if (type === 'commando') {
        moveWithJoint(root, 'commando_ballistic_hood', helmet);
        moveWithJoint(root, 'commando_low_profile_visor', helmet);
      }
    }
    // A helmet should not turn a person into a five-head-tall toy. Retain the
    // existing world height and shoulder rig while using adult head proportions.
    if (helmet) helmet.scale.multiplyScalar(silhouette.bareHead ? .72 : .74);
    head.scale.x *= .9; head.scale.y *= 1.045;
    const faceParent = helmet || root;
    const headAt = head.position.clone();
    const sx = profile.helmetScale;
    const face = (x, y, z) => [headAt.x + x * sx, headAt.y + y * sx, headAt.z + z * sx];
    const sculptPoint = (x, y, z) => {
      const front = Math.pow(Math.max(0, z), 3);
      const g = (cx, cy, rx, ry) => Math.exp(-Math.pow((x-cx)/rx,2)-Math.pow((y-cy)/ry,2));
      z += front * (-.08*g(0,0,1.3,.9)
        + .12*g(-.35,.27,.3,.13)+.12*g(.35,.27,.3,.13)
        - .09*g(-.36,.095,.23,.14)-.09*g(.36,.095,.23,.14)
        + .34*g(0,-.10,.13,.30)+.19*g(0,-.27,.19,.12)
        + .11*g(-.085,-.27,.075,.09)+.11*g(.085,-.27,.075,.09)
        + .13*g(-.4,-.20,.27,.25)+.13*g(.4,-.20,.27,.25)
        + .10*g(0,-.5,.37,.17)+.16*g(0,-.75,.32,.14)
        - .025*g(-.23,-.44,.09,.2)-.025*g(.23,-.44,.09,.2));
      const jaw = T.MathUtils.smoothstep(-y,.29,.91);
      x *= (1-jaw*.245)*(1+.085*Math.exp(-Math.pow((y+.45)/.17,2)));
      if(z<0) z *= .94;
      return [x,y,z];
    };
    // A regular ring layout joins jaw and neck; stretching the final sphere
    // pole into a throat would create skinny triangles and a serrated seam.
    const headVertices=[],headUV=[],headIndices=[],headRadial=104,faceRows=88,neckRows=24,headRows=faceRows+neckRows;
    for(let row=0;row<=headRows;row++)for(let col=0;col<=headRadial;col++){
      const phi=col/headRadial*Math.PI*2,cut=-.72-.22*Math.max(0,Math.sin(phi));
      const angle=Math.acos(cut),radius=Math.sqrt(1-cut*cut);
      let vertex;
      if(row<=faceRows){
        const theta=row/faceRows*angle;
        vertex=sculptPoint(-Math.cos(phi)*Math.sin(theta),Math.cos(theta),Math.sin(phi)*Math.sin(theta));
      }else{
        const t=(row-faceRows)/neckRows,smooth=t*t*(3-2*t);
        const atCut=sculptPoint(-Math.cos(phi)*radius,cut,Math.sin(phi)*radius);
        const nx=-Math.cos(phi)*(.235/head.scale.x),nz=Math.sin(phi)*(.195/head.scale.z)-.035/head.scale.z;
        vertex=[T.MathUtils.lerp(atCut[0],nx,smooth),T.MathUtils.lerp(cut,-.76/head.scale.y,t),T.MathUtils.lerp(atCut[2],nz,smooth)];
      }
      headVertices.push(...vertex);headUV.push(col/headRadial,1-row/headRows);
      if(row<headRows&&col<headRadial){const n=row*(headRadial+1)+col,m=n+headRadial+1;headIndices.push(n,m,n+1,m,m+1,n+1);}
    }
    const sculptedHead=new T.BufferGeometry();sculptedHead.setAttribute('position',new T.Float32BufferAttribute(headVertices,3));
    sculptedHead.setAttribute('uv',new T.Float32BufferAttribute(headUV,2));sculptedHead.setIndex(headIndices);
    sculptedHead.computeVertexNormals();
    sculptedHead.setAttribute('uv2',sculptedHead.attributes.uv.clone());
    head.geometry.dispose();head.geometry=sculptedHead;head.userData.hiveDetailFitted=true;
    const lip = factory._material('lip',{color:synthetic?0x8b9390:0x8d5a50,roughness:.53,metalness:0});
    const eyeWhite=factory._material('eye',{color:synthetic?0x969f9d:0xc1c4b8,roughness:.24,metalness:0});
    const iris=factory._material('iris',{color:synthetic?0x596e72:0x4d5a47,roughness:.34,metalness:0});
    const pupil=factory._material('pupil',{color:0x0a0f0c,roughness:.25,metalness:0});
    const hair=factory._material('hair',{color:type==='scientist'?0x241b15:0x181615,roughness:.78,metalness:0});
    for(const material of [lip,eyeWhite,iris,pupil,hair]) material.color.convertSRGBToLinear();
    // Fine groomed fibres break the cap's highlight without a second material
    // or an external image. The texture belongs to this model's hair material.
    const hairPixels=new Uint8Array(128*256*3);
    for(let y=0;y<256;y++)for(let x=0;x<128;x++){
      const strand=x+.75*Math.sin(y*.035)+.28*Math.sin(y*.083+x*.11);
      const intensity=Math.max(0,Math.min(255,Math.round(190+26*Math.sin(strand*3.4)+18*Math.sin(strand*6.9)+6*Math.sin(y*.13+strand*2.1))));
      const i=(y*128+x)*3;hairPixels[i]=intensity;hairPixels[i+1]=intensity;hairPixels[i+2]=intensity;
    }
    const hairTexture=new T.DataTexture(hairPixels,128,256,T.RGBFormat);
    hairTexture.wrapS=hairTexture.wrapT=T.RepeatWrapping;hairTexture.minFilter=T.LinearMipmapLinearFilter;
    hairTexture.generateMipmaps=true;hairTexture.anisotropy=4;hairTexture.needsUpdate=true;
    hair.map=hairTexture;hair.bumpMap=hairTexture;hair.bumpScale=.0004;
    hair.addEventListener('dispose',()=>hairTexture.dispose());
    const skinFront=(x,y)=>{
      const nx=x*sx/head.scale.x,ny=y*sx/head.scale.y;
      const nz=Math.sqrt(Math.max(.0001,1-nx*nx-ny*ny));
      return sculptPoint(nx,ny,nz)[2]*head.scale.z/sx;
    };
    // Eye globes sit inside a sculpted orbit. Separate upper/lower lid rims and
    // a tear duct frame the sclera, iris and cornea instead of a painted dot.
    for(const side of [-1,1]) {
      const cx=side*.119,cy=.035;
      batches.oval(faceParent,eyeWhite,face(cx,cy,.260),[.048*sx,.022*sx,.029*sx],null,32);
      batches.oval(faceParent,iris,face(cx,cy,.288),[.0165*sx,.017*sx,.005*sx],null,28);
      batches.oval(faceParent,pupil,face(cx,cy,.292),[.007*sx,.010*sx,.003*sx],null,24);
      batches.oval(faceParent,eyeWhite,face(cx-.006,cy+.007,.295),[.003*sx,.003*sx,.002*sx],null,16);
      const upper=[],lower=[],brow=[],crease=[];
      for(let k=0;k<=12;k++) {
        const t=k/12,a=Math.PI*t;
        const x=cx+(t-.5)*.106;
        upper.push(face(x,cy+.014*Math.sin(a),.261+.021*Math.sin(a)));
        lower.push(face(x,cy-.012*Math.sin(a),.260+.023*Math.sin(a)));
        const bx=cx+(t-.5)*.135,by=cy+.061+.013*Math.sin(a);
        brow.push(face(bx,by,skinFront(bx,by)+.003));
        crease.push(face(x,cy-.031-.003*Math.sin(a),.282+.006*Math.sin(a)));
      }
      batches.path(faceParent,skin,upper,[.0035,.0045,.003],24,8);
      batches.path(faceParent,skin,lower,[.0025,.0035,.002],24,8);
      // The skin between the globe opening and outer orbit is a continuous lid
      // annulus, not a floating wire around a white sphere.
      const lidVertices=[],lidUV=[],lidIndices=[],steps=64,rings=8;
      for(let row=0;row<=rings;row++)for(let col=0;col<=steps;col++){
        const a=col/steps*Math.PI*2,t=row/rings;
        const ix=cx+Math.cos(a)*.052,iy=cy+Math.sin(a)*(Math.sin(a)>0?.014:.012);
        const ox=cx+Math.cos(a)*.062,oy=cy+Math.sin(a)*(Math.sin(a)>0?.029:.026);
        const iz=.260+.023*Math.abs(Math.sin(a));
        const x=T.MathUtils.lerp(ix,ox,t),y=T.MathUtils.lerp(iy,oy,t);
        const z=T.MathUtils.lerp(iz,Math.min(.300,skinFront(ox,oy)+.001),T.MathUtils.smoothstep(t,0,1))+.001*Math.sin(t*Math.PI);
        lidVertices.push(...face(x,y,z));lidUV.push(col/steps,t);
        if(row<rings&&col<steps){const n=row*(steps+1)+col,m=n+steps+1;lidIndices.push(n,m,n+1,m,m+1,n+1);}
      }
      const lidGeo=new T.BufferGeometry();lidGeo.setAttribute('position',new T.Float32BufferAttribute(lidVertices,3));lidGeo.setAttribute('uv',new T.Float32BufferAttribute(lidUV,2));lidGeo.setIndex(lidIndices);lidGeo.computeVertexNormals();
      const lidMesh=new T.Mesh(lidGeo,skin);batches.mesh(faceParent,lidMesh);lidGeo.dispose();
      batches.path(faceParent,hair,brow,[.0025,.0035,.001],24,6);
      batches.oval(faceParent,lip,face(cx-side*.05,cy-.001,.264),[.009*sx,.007*sx,.007*sx],null,20);
      // Pinna, concha, antihelix and tragus form a folded ear shell.
      batches.oval(faceParent,skin,face(side*.326,-.015,.006),[.046*sx,.103*sx,.041*sx],null,32);
      const helix=[];
      for(let k=0;k<=20;k++) {
        const a=-.35+k/20*Math.PI*1.8;
        helix.push(face(side*(.335+.018*Math.cos(a)),-.016+.082*Math.sin(a),.035+.018*Math.cos(a)));
      }
      batches.path(faceParent,skin,helix,[.007,.010,.006],32,8);
      batches.oval(faceParent,faceShadow,face(side*.339,-.023,.046),[.013*sx,.041*sx,.012*sx],null,24);
      batches.path(faceParent,skin,[face(side*.338,-.063,.058),face(side*.348,-.01,.06),face(side*.336,.035,.05)],[.006,.008,.004],20,8);
      batches.oval(faceParent,skin,face(side*.314,-.026,.052),[.007*sx,.016*sx,.008*sx],null,24);
      // Small alar volumes overlap the bridge; nostrils turn under the tip.
      batches.oval(faceParent,faceShadow,face(side*.024,-.116,skinFront(side*.024,-.116)+.003),[.010*sx,.005*sx,.007*sx],[.5,side*.18,0],24);
    }
    const upperLip=[],lowerLip=[],mouth=[];
    for(let k=0;k<=18;k++) {
      const t=k/18,x=(t-.5)*.158;
      const arch=Math.sin(Math.PI*t);
      const cupid=Math.exp(-Math.pow(x/.018,2));
      const uy=-.209+.012*arch-.004*cupid,ly=-.214-.010*arch,my=-.212+.002*arch;
      upperLip.push(face(x,uy,skinFront(x,uy)+.005));
      lowerLip.push(face(x,ly,skinFront(x,ly)+.005));
      mouth.push(face(x,my,skinFront(x,my)+.007));
    }
    batches.path(faceParent,lip,upperLip,[.0015,.0045,.0015],32,8);
    batches.path(faceParent,lip,lowerLip,[.0015,.0055,.0015],32,8);
    batches.path(faceParent,faceShadow,mouth,[.001,.0017,.001],32,6);
    // Sternomastoid/clavicle transitions connect a face to the collar, avoiding
    // the cylinder-on-a-box neck present in the prototype.
    const neck=root.getObjectByName('neck');
    if(neck) neck.visible=false; // The continuous head/throat mesh owns this volume now.
    if(silhouette.bareHead) {
      const vertices=[],uv=[],indices=[];const radial=88,rows=36;
      const capPoint=(phi,t)=>{
        const end=1.58-.65*Math.max(0,Math.sin(phi))+.32*Math.max(0,-Math.sin(phi))+.007*Math.sin(phi*53);
        const theta=t*end;
        const v=sculptPoint(-Math.cos(phi)*Math.sin(theta),Math.cos(theta),Math.sin(phi)*Math.sin(theta));
        const ridge=1.018+.004*Math.sin(phi*44+theta*18);
        return [headAt.x+v[0]*head.scale.x*ridge,headAt.y+v[1]*head.scale.y*ridge,headAt.z+v[2]*head.scale.z*ridge];
      };
      for(let r=0;r<=rows;r++)for(let c=0;c<=radial;c++) {
        vertices.push(...capPoint(c/radial*Math.PI*2,r/rows));uv.push(c/radial,r/rows);
        if(r<rows&&c<radial){const a=r*(radial+1)+c,b=a+radial+1;indices.push(a,b,a+1,b,b+1,a+1);}
      }
      const scalp=new T.BufferGeometry();scalp.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
      scalp.setAttribute('uv',new T.Float32BufferAttribute(uv,2));scalp.setIndex(indices);scalp.computeVertexNormals();
      const cap=new T.Mesh(scalp,hair);batches.mesh(faceParent,cap);scalp.dispose();
      for(let strand=0;strand<72;strand++) {
        const phi=strand/72*Math.PI*2,path=[];
        for(let k=0;k<9;k++) path.push(capPoint(phi+.18*(1-k/8),.12+k/8*.84));
        batches.path(faceParent,hair,path,[.00025,.0008,.0002],24,5);
      }
    }
    root.userData.humanFaceSculpt={version:2,eyelids:true,continuousPlanes:true,foldedEars:true};
    // Garment construction: zipper, collars, tension seams and load-bearing
    // webbing. Batches follow the body or the appropriate shoulder joint.
    const zipper=[];
    for(let k=0;k<=24;k++){const y=2.09+k/24*1.22;zipper.push([0,y,silhouette.frontAt(0,y)+.009]);}
    batches.path(root,uniform,zipper,[.005,.006,.004],40,8);
    for(let zip=0;zip<22;zip++) {
      const y=2.12+zip*.05;
      batches.panel(root,armor,[(zip%2?-1:1)*.012,y,silhouette.frontAt(0,y)+.014],[.014,.012,.006],null,.001);
    }
    batches.panel(root,dark,[0,1.79,profile.pelvis.z*1.1],[.14,.075,.024],null,.006);
    for (const side of [-1, 1]) {
      batches.panel(root,uniform,[side*.18,torsoY+.64,.17],[.24,.12,.025],[.2,0,side*.27],.012);
      const strap=[];
      for(let k=0;k<=16;k++) {
        const y=2.2+k/16*1.12,x=side*profile.shoulderX*(.56+.06*k/16);
        let z=silhouette.frontAt(x,y)+.018;
        if(combat&&y>torsoY+.1-profile.chest.y*.52&&y<torsoY+.1+profile.chest.y*.54) z=Math.max(z,profile.torso.z*.98+.058-Math.pow(x/(profile.chest.x*.49),2)*.13);
        strap.push([x,y,z]);
      }
      for(let k=0;k<strap.length-1;k++) {
        const a=strap[k],b=strap[k+1],dy=b[1]-a[1],dz=b[2]-a[2],dx=b[0]-a[0];
        batches.panel(root,dark,[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2],[.063,Math.hypot(dy,dz)+.008,.012],[Math.atan2(dz,dy),0,-Math.atan2(dx,dy)],.001);
      }
      const buckle=strap[6];
      batches.panel(root,armor,[buckle[0],buckle[1],buckle[2]+.012],[.105,.09,.015],null,.003);
      const arm = root.getObjectByName(`arm_${side < 0 ? 'left' : 'right'}`);
      const leg = root.getObjectByName(`leg_${side < 0 ? 'left' : 'right'}`);
      const hand = moveWithJoint(root, `hand_${side}`, arm);
      const boot = moveWithJoint(root, `boot_${side}`, leg);
      moveWithJoint(root, `${type}_pauldron_${side < 0 ? 'left' : 'right'}`, arm);
      if (arm) {
        batches.panel(arm,dark,[side*.15,-.36,.19],[.22,.14,.025],[0,0,side*-.08],.012);
        batches.panel(arm,armor,[side*.15,-.39,.225],[.15,.055,.018],null,.004);
        if (combat) {
          for (let ridge = 0; ridge < 5; ridge++) batches.box(arm, dark, [side * 0.2, -0.66 + ridge * 0.045, 0.18], [0.24, 0.018, 0.035]);
        }
      }
      if (hand && arm) {
        const wrist=arm.userData.restWrist;
        if(wrist) hand.position.set(wrist[0],wrist[1]-.115,wrist[2]+.03);
        const at=hand.position;
        const gloveMaterial=combat?dark:skin;
        hand.material=gloveMaterial;hand.scale.set(.115,.135,.072);
        const palm=new T.SphereGeometry(1,40,28),pp=palm.attributes.position;
        for(let i=0;i<pp.count;i++) {
          const x=pp.getX(i),y=pp.getY(i),z=pp.getZ(i);
          pp.setXYZ(i,x*(1-.16*Math.max(0,-y)),y,z*(.91+.06*Math.cos(x*6)));
        }
        palm.computeVertexNormals();palm.setAttribute('uv2',palm.attributes.uv.clone());
        hand.geometry.dispose();hand.geometry=palm;hand.userData.hiveDetailFitted=true;
        for(let finger=0;finger<4;finger++) {
          const spread=(finger-1.5)*.051,length=[.163,.18,.169,.139][finger];
          const bend=.022+(finger===3?.01:0);
          const path=[[at.x+spread,at.y-.082,at.z+.014],[at.x+spread,at.y-.112,at.z+.027],
            [at.x+spread*.98,at.y-.09-length*.55,at.z+bend],[at.x+spread*.95,at.y-.09-length,at.z+bend+.025]];
          batches.path(arm,gloveMaterial,path,[.024,.022,.019,.016],24,10);
          batches.oval(arm,gloveMaterial,[at.x+spread,at.y-.105,at.z+.055],[.026,.027,.016],null,24);
          if(combat) batches.panel(arm,armor,[at.x+spread,at.y-.105,at.z+.067],[.031,.034,.005],null,.002);
          else {
            batches.oval(arm,lip,[at.x+spread*.95,at.y-.09-length+.022,at.z+bend+.039],[.014,.022,.003],null,20);
            batches.path(arm,faceShadow,[[at.x+spread-.012,at.y-.16,at.z+.046],[at.x+spread,at.y-.166,at.z+.048],[at.x+spread+.012,at.y-.16,at.z+.046]],[.0012,.0018,.0012],12,6);
          }
        }
        batches.path(arm,gloveMaterial,[[at.x-side*.083,at.y+.01,at.z+.015],[at.x-side*.137,at.y-.035,at.z+.062],[at.x-side*.126,at.y-.108,at.z+.088]],
          [.035,.028,.018],24,12);
        // Thenar pad and wrist creases create a palm rather than a mitten.
        batches.oval(arm,gloveMaterial,[at.x-side*.066,at.y-.025,at.z+.043],[.05,.072,.026],[.1,0,side*-.22],28);
        for(let crease=0;crease<2;crease++) batches.path(arm,combat?uniform:faceShadow,
          [[at.x-.073,at.y+.10+crease*.019,at.z+.039],[at.x,at.y+.108+crease*.019,at.z+.049],[at.x+.073,at.y+.10+crease*.019,at.z+.039]],
          [combat?.003:.0012,combat?.003:.0016,combat?.003:.0012],20,6);
      }
      if (boot && leg) {
        const at=boot.position;
        const bootGeometry=(sole=false)=>{
          const sections=[[-.36,.14,sole?-.116:-.07,sole?-.062:.145],[-.24,.205,sole?-.125:-.075,sole?-.059:.17],
            [-.02,.218,sole?-.13:-.075,sole?-.06:.14],[.24,.222,sole?-.122:-.071,sole?-.055:.09],[.39,.165,sole?-.10:-.06,sole?-.045:.055],[.43,.025,sole?-.07:-.045,sole?-.04:.012]];
          const verts=[],uv=[],indices=[],radial=40;
          for(let row=0;row<sections.length;row++) {
            const[z,w,bottom,top]=sections[row];
            for(let col=0;col<=radial;col++) {
              const a=col/radial*Math.PI*2,x=Math.sin(a)*w,y=(top+bottom)/2+Math.cos(a)*(top-bottom)/2;
              verts.push(x/boot.scale.x,y/boot.scale.y,z/boot.scale.z);uv.push(col/radial,row/(sections.length-1));
              if(row<sections.length-1&&col<radial){const n=row*(radial+1)+col,m=n+radial+1;indices.push(n,m,n+1,m,m+1,n+1);}
            }
          }
          const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();geo.setAttribute('uv2',geo.attributes.uv.clone());return geo;
        };
        boot.geometry.dispose();boot.geometry=bootGeometry();boot.userData.hiveDetailFitted=true;
        const outsole=new T.Mesh(bootGeometry(true),dark);outsole.position.copy(at);outsole.scale.copy(boot.scale);batches.mesh(leg,outsole);outsole.geometry.dispose();
        batches.oval(leg,dark,[at.x,at.y+.16,at.z-.12],[.145,.18,.16],null,32);
        // Curved welt, toe-cap stitching and crossed laces follow the shoe last.
        const toe=[];for(let k=0;k<=16;k++){const a=-Math.PI*.46+k/16*Math.PI*.92;toe.push([at.x+Math.sin(a)*.202,at.y-.025,at.z+.19+Math.cos(a)*.185]);}
        batches.path(leg,uniform,toe,[.003,.004,.003],32,8);
        for(let lace=0;lace<5;lace++) {
          const y=at.y+.11-lace*.012,z=at.z-.015+lace*.052;
          batches.path(leg,uniform,[[at.x-.085,y,z-.014],[at.x,y+.012,z+.014],[at.x+.085,y,z+.031]],[.004,.005,.004],16,6);
        }
        for(let tread=0;tread<5;tread++) batches.panel(leg,dark,[at.x,at.y-.124,at.z-.24+tread*.125],[.3,.025,.033],[Math.PI/2,0,(tread%2?1:-1)*.08],.002);
        if(combat) {
          batches.panel(leg,armor,[side*.05,-.78,.215],[.28,.30,.025],null,.032);
          batches.path(leg,dark,[[side*.05-.1,-.8,.265],[side*.05,-.83,.278],[side*.05+.1,-.8,.265]],[.007,.01,.007],20,8);
        }
      }
    }
    if (type === 'scientist') {
      // Split protective overcoat and medical badge retain the slender silhouette.
      for (const side of [-1, 1]) {
        batches.panel(root,uniform,[side*.26,1.92,.16],[.43,.62,.024],[0,side*-.06,side*-.06],.027);
        batches.panel(root,uniform,[side*.16,3.2,silhouette.frontAt(side*.16,3.2)+.018],[.16,.34,.018],[.12,0,side*.27],.012);
        batches.panel(root,uniform,[side*.33,torsoY-.25,silhouette.frontAt(side*.33,torsoY-.25)+.018],[.21,.22,.02],null,.025);
      }
      batches.box(root, dark, [-0.26, torsoY + 0.36, 0.414], [0.16, 0.22, 0.02]);
      if (accent) batches.box(root, accent, [-0.26, torsoY + 0.36, 0.43], [0.11, 0.06, 0.014]);
    } else if (combat) {
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
          batches.box(root, dark, [(col - 1.5) * 0.19, torsoY + 0.02 + row * 0.14, profile.torso.z + profile.chest.z * 0.75], [0.12, 0.022, 0.018]);
        }
      }

    }
    const equipment=root.children.find(object=>object.userData?.equipmentType),rightArm=root.getObjectByName('arm_right');
    if(equipment&&rightArm){
      moveWithJoint(root,equipment.name,rightArm);
      const hand=root.getObjectByName('hand_1');
      if(hand) equipment.position.set(hand.position.x+.05,hand.position.y+.06,hand.position.z+.1);
    }
    if (helmet && !silhouette.bareHead) {
      for (const side of [-1, 1]) {
        batches.cylinder(helmet, dark, [side * 0.38 * sx, 0.06, 0.1], 0.082, 0.055, [0, 0, Math.PI / 2], 24);
        batches.box(helmet, armor, [side * 0.22, 0.295, 0.19], [0.09, 0.045, 0.22], [0.22, 0, 0]);
      }
      if (visor) batches.box(helmet, visor, [0.29, 0.18, 0.37], [0.095, 0.075, 0.035]);
    }
    refineSmoothGeometry(T, root);
    const detail = batches.finish();
    const retainedMaterials = new Set();
    root.traverse(object=>{
      if(object.material) (Array.isArray(object.material)?object.material:[object.material]).forEach(m=>retainedMaterials.add(m));
    });
    for(const material of silhouette.removedMaterials) if(!retainedMaterials.has(material)) material.dispose();
    root.userData.humanAnatomyDetail = true;
    return detail;
  }

  function propDetail(factory, root, type, T) {
    const batches = batcher(T);
    const metal = materialOf(root, 'industrial') || materialOf(root, 'darkMetal') || materialOf(root, 'synthetic') || materialOf(root, 'rust') || materialOf(root, 'steel') || materialOf(root, 'stainless');
    const dark = materialOf(root, 'darkMetal') || metal;
    const accent = materialOf(root, 'emissiveGreen') || materialOf(root, 'emissiveAmber') || materialOf(root, 'emissiveRed');
    if (!metal || !dark) return null;
    const basic = ['crate', 'console', 'generator', 'door', 'barrel', 'vent', 'pipe', 'lamp'].includes(type);
    const diagnostic = { profile: basic ? 'bespoke' : 'catalogue', labels: 0, screens: 0, recessedFasteners: 0, sharedAtlas: false };
    let printing = null;
    const print = () => {
      if (!printing) {
        printing = industrialPrintMaterial(T, ['console', 'door'].includes(type) ? materialOf(root, 'emissiveGreen') : null);
        diagnostic.sharedAtlas = true;
      }
      return printing;
    };
    const label = (cell, at, size, rotation) => { batches.decal(root, print(), cell, at, size, rotation); diagnostic.labels++; };
    const wrapLabel = (radius, y, h, angle, cell) => {
      const geometry = new T.CylinderGeometry(radius, radius, h, 14, 1, true, -angle / 2, angle);
      const uv = geometry.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));
      batches.transformed(root, print(), atlasUV(geometry, cell), new T.Matrix4().makeTranslation(0, y, 0)); diagnostic.labels++;
    };
    const screw = (x, y, z, radius = 0.035) => {
      batches.cylinder(root, dark, [x, y, z - .006], radius * 1.45, .018, [Math.PI / 2, 0, 0], 10);
      batches.cylinder(root, metal, [x, y, z], radius, 0.025, [Math.PI / 2, 0, 0], 6);
      batches.box(root, dark, [x, y, z + 0.014], [radius * 1.1, 0.009, 0.009]);
      diagnostic.recessedFasteners++;
    };
    if (type === 'crate') {
      batches.box(root, dark, [0, 0.97, 1.012], [1.18, 1.18, 0.035]);
      batches.box(root, metal, [0, 0.97, 1.036], [1.08, 1.04, 0.018]);
      for (const side of [-1, 1]) {
        batches.box(root, dark, [side * 0.52, 0.96, 1.06], [0.045, 0.92, 0.024]);
        batches.box(root, dark, [side * 1.032, 0.97, 0], [0.03, 0.11, 0.55]);
        batches.box(root, metal, [side * 1.05, 0.97, 0], [0.03, 0.08, 0.34]);
      }
      for (let slot = 0; slot < 5; slot++) batches.box(root, dark, [-0.36 + slot * 0.18, 0.55, 1.052], [0.08, 0.2, 0.016]);
      for (const x of [-0.47, 0.47]) for (const y of [0.52, 1.42]) screw(x, y, 1.062);
      for (const x of [-.75, .75]) {
        batches.cylinder(root, metal, [x, 1.76, 1.055], .058, .27, [0, 0, Math.PI / 2], 12);
        batches.box(root, dark, [x, 1.71, 1.05], [.13, .25, .04]);
      }
      label(0, [0, 1.17, 1.064], [.79, .45]);
    } else if (type === 'console') {
      // The original bars were floating in front of a blank emissive slab. The
      // actual display now carries bounded phosphor text, scanlines and waveform.
      const display = root.getObjectByName('console_display');
      if (display) { display.material = print(); displayUV(display.geometry, 2); diagnostic.screens++; }
      for (const child of root.children.slice()) if (/^display_telemetry_/.test(child.name)) { root.remove(child); child.geometry.dispose(); }
      for (const side of [-1, 1]) {
        batches.cylinder(root, metal, [side * .84, 1.64, .345], .052, .045, [Math.PI / 2, 0, 0], 12);
        batches.box(root, dark, [side * .84, 1.66, .37], [.009, .036, .006]);
      }
      // Keys sit on a tangible keyboard tray, not buried inside the chassis.
      batches.box(root, metal, [0, 1.33, .55], [1.95, .12, .66]);
      for (let row = 0; row < 4; row++) for (let column = 0; column < 12; column++) {
        batches.box(root, dark, [-0.77 + column * 0.139, 1.416, 0.32 + row * 0.076], [0.095, 0.035, 0.05], [0.12, 0, 0]);
      }
      for (const child of root.children) if (/^console_button_/.test(child.name)) { child.position.y = 1.417; child.position.z = .71 + Math.floor(Number(child.name.split('_').pop()) / 4) * .1; }
      for (let fin = 0; fin < 12; fin++) batches.box(root, dark, [-0.7 + fin * 0.127, 0.5, 0.421], [0.055, 0.49, 0.025]);
      for (const x of [-0.94, 0.94]) for (const y of [0.2, 0.95]) screw(x, y, 0.427);
      batches.tube(root, dark, [[-0.8, 0.08, -0.3], [-1.1, 0.08, -0.45], [-1.22, 0.12, -0.8]], 0.04);
    } else if (type === 'generator') {
      for (let fin = 0; fin < 20; fin++) {
        batches.box(root, dark, [-1.12 + fin * 0.118, 1.1, -0.77], [0.045, 1.75, 0.08]);
        batches.box(root, metal, [-1.12 + fin * 0.118, 2.41, 0], [0.035, 0.035, 1.3]);
      }
      batches.box(root, dark, [0, 1.16, 0.783], [0.36, 0.6, 0.035]);
      for (let bolt = 0; bolt < 5; bolt++) screw(-0.92 + bolt * 0.46, 0.18, 0.785, 0.045);
      batches.tube(root, dark, [[-1.2, 1.8, -0.35], [-1.5, 1.7, -0.6], [-1.5, 0.3, -0.6], [-1.2, 0.1, -0.6]], 0.055);
      label(5, [0, 1.15, .805], [.31, .47]);
      // An analog pressure gauge and visible pointer ground the electrical plant.
      batches.cylinder(root, metal, [0, 1.92, .79], .19, .075, [Math.PI / 2, 0, 0], 20);
      batches.cylinder(root, dark, [0, 1.92, .832], .157, .013, [Math.PI / 2, 0, 0], 20);
      for (let tick = 0; tick < 7; tick++) {
        const angle = -.7 * Math.PI + tick / 6 * 1.4 * Math.PI;
        batches.box(root, metal, [Math.sin(angle) * .12, 1.92 + Math.cos(angle) * .12, .844], [.012, .028, .006], [0, 0, -angle]);
      }
      batches.box(root, metal, [.031, 1.948, .851], [.012, .113, .009], [0, 0, -.81]);
    } else if (type === 'door') {
      for (const side of [-1, 1]) {
        batches.box(root, dark, [side * 0.88, 2.42, 0.244], [1.42, 4.15, 0.024]);
        batches.box(root, metal, [side * 0.88, 2.42, 0.262], [1.36, 4.07, 0.018]);
        for (let seam = 0; seam < 4; seam++) batches.box(root, dark, [side * 0.88, 0.95 + seam * 1.02, 0.278], [1.25, 0.025, 0.014]);
        for (let latch = 0; latch < 3; latch++) batches.box(root, dark, [side * 1.75, 0.86 + latch * 1.45, 0.34], [0.17, 0.28, 0.22]);
        for (let bolt = 0; bolt < 7; bolt++) screw(side * 1.91, 0.4 + bolt * 0.64, 0.36, 0.045);
      }
      for (let key = 0; key < 9; key++) batches.box(root, dark, [1.36 + key % 3 * 0.07, 2.29 + Math.floor(key / 3) * 0.085, 0.355], [0.032, 0.035, 0.012]);
      const display = root.getObjectByName('door_access_panel');
      if (display) { display.material = print(); displayUV(display.geometry, 2); diagnostic.screens++; }
      label(1, [-.88, 3.43, .289], [.73, .35]);
      label(0, [.88, 1.5, .289], [.73, .29]);
    } else if (type === 'barrel') {
      for (let ridge = 0; ridge < 20; ridge++) {
        const angle = ridge * Math.PI / 10;
        batches.box(root, metal, [Math.cos(angle) * 0.625, 1, Math.sin(angle) * 0.625], [0.028, 1.34, 0.028]);
      }
      batches.cylinder(root, dark, [0.24, 1.925, 0.12], 0.11, 0.025, null, 24);
      batches.cylinder(root, metal, [0.24, 1.944, 0.12], 0.068, 0.02, null, 6);
      batches.cylinder(root, dark, [-0.18, 1.925, -0.22], 0.062, 0.025, null, 24);
      wrapLabel(.632, 1.1, .43, 1.3, 6);
    } else if (type === 'vent') {
      for (let fin = 0; fin < 13; fin++) batches.box(root, dark, [-0.88 + fin * 0.147, 1.2, 0.19], [0.025, 1.85, 0.025]);
      for (const x of [-1.08, 1.08]) for (const y of [0.13, 1.2, 2.28]) screw(x, y, 0.24, 0.05);
      label(3, [0, 2.25, .36], [.94, .17]);
    } else if (type === 'pipe') {
      for (const y of [0.35, 2.28]) {
        for (let bolt = 0; bolt < 8; bolt++) {
          const angle = bolt * Math.PI / 4;
          batches.cylinder(root, dark, [Math.cos(angle) * 0.39, y, Math.sin(angle) * 0.39], 0.035, 0.13, null, 8);
        }
      }
      batches.cylinder(root, dark, [1.25, 2.75, 0], 0.43, 0.075, [0, 0, Math.PI / 2], 32);
      batches.cylinder(root, metal, [1.3, 2.75, 0], 0.31, 0.08, [0, 0, Math.PI / 2], 32);
      batches.box(root, dark, [0.35, 1.2, 0.04], [0.06, 0.22, 0.15]);
      wrapLabel(.348, 1.52, .31, 1.3, 6);
    } else if (type === 'lamp') {
      for (let rib = 0; rib < 9; rib++) batches.box(root, dark, [-0.64 + rib * 0.16, 0.02, 0], [0.025, 0.055, 0.4]);
      for (const side of [-1, 1]) batches.box(root, dark, [side * 0.75, 0.14, 0], [0.08, 0.09, 0.4]);
      label(0, [.33, .12, .269], [.31, .11]);
    } else {
      // Catalogue variants already have individual silhouettes. Detail their
      // authored equipment surfaces, never a bounding-box shell that could hide
      // moving mechanisms, transparent tanks, or the organic hive/derelict props.
      root.updateMatrixWorld(true);
      const inverse = new T.Matrix4().copy(root.matrixWorld).invert();
      const surfaces = [], cylinders = [], screens = [], plates = [], replaced = new Set();
      const structuralKinds = ['industrial', 'darkMetal', 'synthetic', 'rust', 'steel', 'stainless', 'hazard', 'copper', 'brass'];
      const boxDimensions = geometry => {
        if (!['BoxGeometry', 'ExtrudeGeometry'].includes(geometry.type)) return null;
        geometry.computeBoundingBox(); const bounds = geometry.boundingBox;
        return { width: bounds.max.x - bounds.min.x, height: bounds.max.y - bounds.min.y, depth: bounds.max.z - bounds.min.z,
          x: (bounds.max.x + bounds.min.x) / 2, y: (bounds.max.y + bounds.min.y) / 2, z: (bounds.max.z + bounds.min.z) / 2 };
      };
      root.traverse(object => {
        if (!object.isMesh || Array.isArray(object.material) || !object.geometry?.parameters) return;
        const kind = object.material.userData?.hiveMaterialKind;
        const dims = boxDimensions(object.geometry);
        if (dims && dims.width > .15 && Math.max(dims.height, dims.depth) > .08 && /screen|display|monitor|readout|crt|gauge/i.test(object.name) && /^emissive/.test(kind || '')) screens.push(object);
        else if (dims && dims.width > .08 && /label|plaque|placard|nameplate|manifest/i.test(object.name) && ['emissiveAmber', 'emissiveRed', 'emissiveGreen', 'hazard'].includes(kind)) plates.push(object);
        const paintedTank = /^emissive/.test(kind || '') && /tank|extinguisher|canister|flare_body|grenade_body/i.test(object.name) && !/fluid|glass|glow|coil|core|frost|plasma/i.test(object.name);
        if (paintedTank) { object.material.emissiveIntensity = Math.min(.06, object.material.emissiveIntensity); object.material.roughness = .58; }
        if ((!structuralKinds.includes(kind) && !paintedTank) || /(?:^|_)(?:resin|hive|jockey|fossil|fluid|liquid|glass|silhouette|beam|grate|rail|bar|cable)(?:_|$)/i.test(object.name)) return;
        if (dims) {
          let face = 'front', w = dims.width, h = dims.height, depth = dims.depth;
          if (dims.height < Math.min(dims.width, dims.depth)) { face = 'top'; h = dims.depth; depth = dims.height; }
          else if (dims.width < Math.min(dims.height, dims.depth)) { face = 'side'; w = dims.depth; depth = dims.width; }
          if (w > .12 && h > .1 && w * h > .03) surfaces.push({ object, dims, face, width: w, height: h, depth });
        }
        const p = object.geometry.parameters;
        if (object.geometry.type === 'CylinderGeometry' && p.height > .16 && Math.min(p.radiusTop, p.radiusBottom) > .055) cylinders.push(object);
      });
      for (const screen of screens.slice(0, 4)) {
        replaced.add(screen.material); screen.material = print();
        if (!printing.emissiveMap) { printing.emissive.setHex(0x6c8362); printing.emissiveMap = printing.map; printing.emissiveIntensity = .24; }
        displayUV(screen.geometry, 2); diagnostic.screens++;
      }
      const cell = /bio|specimen|stasis|cryo|mutagen|blackgoo|contain/i.test(type) ? 4
        : /fuel|tank|pump|pipe|coolant|siphon|flume/i.test(type) ? 6
          : /power|reactor|electric|generator|battery|capacitor|server/i.test(type) ? 5
            : /vent|air|duct|blower|scrubber/i.test(type) ? 3 : 0;
      for (const plate of plates.slice(0, 2)) {
        replaced.add(plate.material); plate.material = print(); displayUV(plate.geometry, cell); diagnostic.labels++;
      }
      surfaces.sort((a, b) => b.width * b.height - a.width * a.height);
      const surface = surfaces[0];
      if (surface) {
        const source = surface.dims, dims = { width: surface.width, height: surface.height, depth: surface.depth };
        const frame = new T.Matrix4().makeTranslation(source.x, source.y, source.z);
        if (surface.face === 'top') frame.multiply(new T.Matrix4().makeRotationX(-Math.PI / 2));
        else if (surface.face === 'side') frame.multiply(new T.Matrix4().makeRotationY(Math.PI / 2));
        const toRoot = new T.Matrix4().multiplyMatrices(inverse, surface.object.matrixWorld).multiply(frame);
        const z = dims.depth / 2 + .008;
        const width = Math.min(dims.width * .4, .85), h = Math.min(dims.height * .28, .46);
        const labelGeometry = atlasUV(new T.PlaneGeometry(width, h), cell);
        labelGeometry.translate(0, dims.height * .22, z);
        batches.transformed(root, print(), labelGeometry, toRoot); diagnostic.labels++;
        // Four counterbored, slotted hex heads are fitted to the actual face.
        const radius = Math.min(.04, dims.width * .04, dims.height * .04);
        for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
          const x = sx * dims.width * .42, y = sy * dims.height * .4;
          const seat = new T.CylinderGeometry(radius * 1.5, radius * 1.5, .013, 10).rotateX(Math.PI / 2).translate(x, y, z);
          const cap = new T.CylinderGeometry(radius, radius, .019, 6).rotateX(Math.PI / 2).translate(x, y, z + .009);
          const slot = new T.BoxGeometry(radius * 1.12, radius * .19, .005).translate(x, y, z + .02);
          batches.transformed(root, dark, seat, toRoot); batches.transformed(root, metal, cap, toRoot); batches.transformed(root, dark, slot, toRoot);
          diagnostic.recessedFasteners++;
        }
      } else if (cylinders.length) {
        cylinders.sort((a, b) => b.geometry.parameters.height * b.geometry.parameters.radiusTop - a.geometry.parameters.height * a.geometry.parameters.radiusTop);
        const surface = cylinders[0], p = surface.geometry.parameters;
        const toRoot = new T.Matrix4().multiplyMatrices(inverse, surface.matrixWorld);
        if (p.height < p.radiusTop * .5) {
          const labelGeometry = atlasUV(new T.PlaneGeometry(Math.min(p.radiusTop * .85, .85), Math.min(p.radiusTop * .35, .28)), cell)
            .rotateX(-Math.PI / 2).translate(0, p.height / 2 + .008, p.radiusTop * .46);
          batches.transformed(root, print(), labelGeometry, toRoot); diagnostic.labels++;
          for (let n = 0; n < 8; n++) {
            const angle = n / 8 * Math.PI * 2, radius = Math.min(.045, p.radiusTop * .055);
            const bolt = new T.CylinderGeometry(radius, radius, .027, 6).translate(Math.sin(angle) * p.radiusTop * .84, p.height / 2 + .015, Math.cos(angle) * p.radiusTop * .84);
            batches.transformed(root, metal, bolt, toRoot); diagnostic.recessedFasteners++;
          }
        } else {
        const h = Math.min(p.height * .3, .49), center = p.height * .09, slope = (p.radiusTop - p.radiusBottom) / p.height;
        const radius = (p.radiusTop + p.radiusBottom) / 2 + center * slope + .009;
        const labelGeometry = new T.CylinderGeometry(radius + h / 2 * slope, radius - h / 2 * slope, h, 14, 1, true, -.6, 1.2);
        for (let i = 0; i < labelGeometry.attributes.uv.count; i++) labelGeometry.attributes.uv.setX(i, 1 - labelGeometry.attributes.uv.getX(i));
        atlasUV(labelGeometry, cell); labelGeometry.translate(0, center, 0);
        batches.transformed(root, print(), labelGeometry, toRoot); diagnostic.labels++;
        if (p.height > .8) for (const y of [-p.height * .4, p.height * .4]) {
          const ring = new T.TorusGeometry((p.radiusTop + p.radiusBottom) / 2 + y * slope + .006, .012, 4, 24).rotateX(Math.PI / 2).translate(0, y, 0);
          batches.transformed(root, dark, ring, toRoot);
        }
        }
      }
      const used = new Set(); root.traverse(object => { if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => used.add(material)); });
      for (const material of replaced) if (!used.has(material) && material !== metal && material !== dark) material.dispose();
    }
    // Clamp only generic indicators. Authored warning beams and flashes retain
    // their dedicated material response; the readouts carry their own map.
    if (accent && !accent.userData.hiveIndustrialPrint) accent.emissiveIntensity = Math.min(accent.emissiveIntensity, 0.5);
    refineSmoothGeometry(T, root);
    root.userData.industrialDetail = diagnostic;
    return batches.finish();
  }

  global.HiveModelDetail = {
    mergeStatic(root, options = {}) {
      const T = global.THREE;
      if (!T || !root) return { meshes: 0, triangles: 0 };
      const exclude = new Set(options.excludeNames || []);
      function protect(value) {
        if (typeof value === 'string') exclude.add(value);
        else if (Array.isArray(value)) value.forEach(protect);
        else if (value && typeof value === 'object' && !value.isObject3D) Object.values(value).forEach(protect);
      }
      protect(root.userData.animationJoints);
      protect(root.userData.animationRoles);
      const buckets = batcher(T);
      const groups = [];
      const references = new Map();
      root.traverse(object => {
        if (object.isGroup || object === root) groups.push(object);
        if (object.geometry) references.set(object.geometry, (references.get(object.geometry) || 0) + 1);
      });
      let removed = 0;
      for (const parent of groups) {
        const byMaterial = new Map();
        for (const child of parent.children) {
          if (!child.isMesh || child.isInstancedMesh || child.isSkinnedMesh || child.children.length ||
            !child.visible || child.morphTargetInfluences || exclude.has(child.name) ||
            Array.isArray(child.material) || !child.geometry?.attributes.normal || !child.geometry?.attributes.uv) continue;
          let same = byMaterial.get(child.material);
          if (!same) byMaterial.set(child.material, same = []);
          same.push(child);
        }
        for (const same of byMaterial.values()) {
          if (same.length < 2) continue;
          for (const child of same) {
            buckets.mesh(parent, child);
            parent.remove(child);
            const remaining = references.get(child.geometry) - 1;
            references.set(child.geometry, remaining);
            if (!remaining) child.geometry.dispose();
            removed++;
          }
        }
      }
      const result = buckets.finish();
      return { ...result, removed, savedDrawCalls: removed - result.meshes };
    },
    decorate(factory, root, metadata) {
      if (!root || root.userData.hiveModelDetailApplied) return;
      const modelType = metadata?.modelType || root.userData.modelType;
      const type = metadata?.subtype || root.userData.subtype;
      if (!['human', 'industrialProp'].includes(modelType)) return;
      const T = global.THREE;
      if (!T) return;
      const detail = modelType === 'human'
        ? humanDetail(factory, root, type, T)
        : propDetail(factory, root, type, T);
      if (!detail) return;
      root.userData.hiveModelDetailApplied = true;
      root.userData.surfaceDetail = detail;
      root.userData.surfaceBatching = global.HiveModelDetail.mergeStatic(root, {
        excludeNames: modelType === 'human' ? ['head', 'hand_-1', 'hand_1', 'boot_-1', 'boot_1'] : []
      });
    }
  };
}(typeof window !== 'undefined' ? window : globalThis));
