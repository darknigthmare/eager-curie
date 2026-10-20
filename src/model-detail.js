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
      oval(parent, material, at, size, rotation, segments = 20) {
        add(parent, material, new T.SphereGeometry(1, segments, Math.max(10, Math.floor(segments * 0.7))), at, size, rotation);
      },
      cylinder(parent, material, at, radius, length, rotation, segments = 16) {
        add(parent, material, new T.CylinderGeometry(radius, radius, length, segments, 1), at, [1, 1, 1], rotation);
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
      const radial = 48;
      for (let row = 0; row < rings.length; row++) {
        const [y, width, depth, edgeDip = 0] = rings[row];
        for (let col = 0; col <= radial; col++) {
          const angle = col / radial * Math.PI * 2;
          const x = Math.sin(angle) * width;
          const z = Math.cos(angle) * depth;
          vertices.push(x / mesh.scale.x, (y - mesh.position.y - Math.abs(Math.sin(angle)) * edgeDip) / mesh.scale.y, z / mesh.scale.z);
          uv.push(col / radial, row / (rings.length - 1));
          if (row < rings.length - 1 && col < radial) {
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
    if (torso) section(torso, [
      [1.75, profile.pelvis.x * .94, profile.pelvis.z * .95],
      [1.9, profile.torso.x * .72, profile.torso.z * .79],
      [2.12, profile.torso.x * .76, profile.torso.z * .85],
      [2.38, profile.torso.x * .88, profile.torso.z * .99],
      [2.72, profile.torso.x, profile.torso.z * 1.02],
      [3.02, profile.torso.x * 1.02, profile.torso.z * .95],
      [3.18, profile.torso.x * .93, profile.torso.z * .79],
      [3.34, profile.torso.x * .48, profile.torso.z * .55],
      [3.46, .17, .14]
    ]);
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
        const tubular = 36, radial = 24;
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
            position.setXYZ(i,
              center.x + (position.getX(i) - center.x) * radius,
              center.y + (position.getY(i) - center.y) * radius,
              center.z + (position.getZ(i) - center.z) * radius);
          }
        }
        replace(segment, geometry);
        segment.position.set(0,0,0);
        segment.quaternion.identity();
        segment.scale.set(1,1,1);
      };
      smoothLimb(arm, [[0,0,0],[side * .19,-.35,.025],[side * .24,-.65,.08],[side * .15,-1.04,.22],[side * .1,-1.3,.3]],
        [combat ? .195 : .175, combat ? .19 : .17, .145, .16, .12]);
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
    return { bareHead, removedMaterials };
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
    const sculptedHead = new T.SphereGeometry(1, 56, 40);
    const points = sculptedHead.attributes.position;
    for (let i = 0; i < points.count; i++) {
      let x = points.getX(i), y = points.getY(i), z = points.getZ(i);
      const front = Math.pow(Math.max(0, z), 6);
      const gaussian = (cx, cy, sx, sy) => Math.exp(-Math.pow((x - cx) / sx, 2) - Math.pow((y - cy) / sy, 2));
      // Continuous facial planes: sockets, bridge, cheekbones and muzzle. These
      // live in one skin surface instead of separate balloon-shaped features.
      z += front * (0.27 * gaussian(0, -0.15, 0.16, 0.22)
        + 0.06 * gaussian(-0.36, -0.23, 0.23, 0.24)
        + 0.06 * gaussian(0.36, -0.23, 0.23, 0.24)
        - 0.055 * gaussian(-0.3, 0.13, 0.21, 0.15)
        - 0.055 * gaussian(0.3, 0.13, 0.21, 0.15));
      const jaw = Math.max(0, Math.min(1, (-y - 0.25) / 0.62));
      x *= 1 - jaw * 0.27;
      points.setXYZ(i, x, y, z);
    }
    sculptedHead.computeVertexNormals();
    sculptedHead.setAttribute('uv2', sculptedHead.attributes.uv.clone());
    head.geometry.dispose();
    head.geometry = sculptedHead;
    const faceParent = helmet || root;
    const headAt = head.position.clone();
    const sx = profile.helmetScale;
    const face = (x, y, z) => [headAt.x + x * sx, headAt.y + y * sx, headAt.z + z * sx];
    // Broad cheeks, nasal bridge and a tapered jaw read as a face at close range;
    // the eyes sit beneath the protective brow instead of glowing on the skin.
    batches.oval(faceParent, faceShadow, face(0, -0.205, 0.306), [0.084 * sx, 0.009 * sx, 0.012 * sx], null, 16);
    for (const side of [-1, 1]) {
      batches.oval(faceParent, skin, face(side * 0.335, -0.015, 0.015), [0.043 * sx, 0.098 * sx, 0.038 * sx], null, 20);
      batches.oval(faceParent, faceShadow, face(side * 0.12, 0.022, 0.306), [0.073 * sx, 0.028 * sx, 0.02 * sx], null, 20);
      batches.oval(faceParent, skin, face(side * 0.116, 0.068, 0.286), [0.09 * sx, 0.028 * sx, 0.03 * sx], [0, 0, side * -0.1], 20);
    }
    if (silhouette.bareHead) {
      const hair = factory._material('skin', { color: type === 'scientist' ? 0x1d1713 : 0x141313, roughness:.9, metalness:0 });
      const scalp = new T.SphereGeometry(1, 40, 24, 0, Math.PI * 2, 0, Math.PI * .49);
      const cap = new T.Mesh(scalp, hair);
      cap.position.copy(headAt);
      cap.scale.copy(head.scale).multiplyScalar(1.018);
      batches.mesh(faceParent, cap);
      scalp.dispose();
      const eyeWhite = factory._material('skin', {color:0xaeb4b1,roughness:.52,metalness:0});
      for (const side of [-1,1]) {
        batches.oval(faceParent,eyeWhite,face(side*.113,.025,.317),[.048*sx,.017*sx,.014*sx],null,16);
        batches.oval(faceParent,faceShadow,face(side*.113,.025,.329),[.015*sx,.016*sx,.008*sx],null,16);
      }
    }
    // Garment construction: zipper, collars, tension seams and load-bearing
    // webbing. Batches follow the body or the appropriate shoulder joint.
    batches.box(root, dark, [0, torsoY - 0.03, profile.torso.z + 0.015], [0.027, 1.22, 0.026]);
    for (let zip = 0; zip < 20; zip++) batches.box(root, armor, [(zip % 2 ? -1 : 1) * 0.022, torsoY - 0.52 + zip * 0.055, profile.torso.z + 0.033], [0.022, 0.018, 0.014]);
    batches.box(root,dark,[0,1.79,profile.pelvis.z*1.1],[.14,.075,.035]);
    for (const side of [-1, 1]) {
      batches.box(root, uniform, [side * 0.19, torsoY + 0.64, 0.19], [0.28, 0.14, 0.1], [0.18, 0, side * 0.22]);
      batches.box(root, dark, [side * profile.shoulderX * 0.63, torsoY + 0.08, profile.torso.z + profile.chest.z * 0.6], [0.075, 1.19, 0.055], [0, 0, side * -0.1]);
      batches.box(root, armor, [side * profile.shoulderX * 0.65, torsoY - 0.16, profile.torso.z + profile.chest.z * 0.68], [0.13, 0.12, 0.055]);
      const arm = root.getObjectByName(`arm_${side < 0 ? 'left' : 'right'}`);
      const leg = root.getObjectByName(`leg_${side < 0 ? 'left' : 'right'}`);
      const hand = moveWithJoint(root, `hand_${side}`, arm);
      const boot = moveWithJoint(root, `boot_${side}`, leg);
      moveWithJoint(root, `${type}_pauldron_${side < 0 ? 'left' : 'right'}`, arm);
      if (arm) {
        batches.box(arm, dark, [side * 0.15, -0.36, 0.19], [0.24, 0.16, 0.06], [0, 0, side * -0.08]);
        batches.box(arm, armor, [side * 0.15, -0.39, 0.225], [0.16, 0.06, 0.03]);
        if (combat) {
          for (let ridge = 0; ridge < 5; ridge++) batches.box(arm, dark, [side * 0.2, -0.66 + ridge * 0.045, 0.18], [0.24, 0.018, 0.035]);
        }
      }
      if (hand && arm) {
        const at = hand.position;
        const gloveMaterial = combat ? dark : skin;
        if (combat) hand.material = dark;
        for (let finger = 0; finger < 4; finger++) {
          const spread = (finger - 1.5) * 0.057;
          batches.oval(arm, gloveMaterial, [at.x + spread, at.y - 0.18, at.z + 0.055], [0.027, 0.12 - Math.abs(finger - 1.5) * 0.011, 0.034], [0.14, 0, (finger - 1.5) * -0.055], 16);
          if (combat) batches.oval(arm, armor, [at.x + spread, at.y + 0.015, at.z + 0.115], [0.027, 0.041, 0.016], null, 16);
        }
        batches.oval(arm, gloveMaterial, [at.x - side * 0.13, at.y - 0.015, at.z + 0.065], [0.044, 0.1, 0.042], [0.15, 0, side * -0.42], 16);
      }
      if (boot && leg) {
        const at = boot.position;
        batches.box(leg, dark, [at.x, at.y - 0.06, at.z + 0.02], [0.46, 0.065, 0.8]);
        for (let tread = 0; tread < 6; tread++) batches.box(leg, armor, [at.x, at.y - 0.095, at.z - 0.26 + tread * 0.115], [0.43, 0.026, 0.035]);
        for (let lace = 0; lace < 4; lace++) batches.box(leg, uniform, [at.x, at.y + 0.08, at.z + lace * 0.07], [0.19, 0.017, 0.023]);
        if (combat) {
          batches.oval(leg, armor, [side * 0.05, -0.78, 0.23], [0.17, 0.19, 0.04], null, 24);
          batches.box(leg, dark, [side * 0.05, -0.8, 0.31], [0.26, 0.045, 0.025]);
        }
      }
    }
    if (type === 'scientist') {
      // Split protective overcoat and medical badge retain the slender silhouette.
      for (const side of [-1, 1]) {
        batches.box(root, uniform, [side * 0.26, 1.92, 0.16], [0.43, 0.62, 0.06], [0, side * -0.06, side * -0.06]);
        batches.box(root, armor, [side * 0.33, torsoY - 0.25, 0.365], [0.21, 0.22, 0.035]);
      }
      batches.box(root, dark, [-0.26, torsoY + 0.36, 0.414], [0.16, 0.22, 0.02]);
      if (accent) batches.box(root, accent, [-0.26, torsoY + 0.36, 0.43], [0.11, 0.06, 0.014]);
    } else if (combat) {
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
          batches.box(root, dark, [(col - 1.5) * 0.19, torsoY + 0.02 + row * 0.14, profile.torso.z + profile.chest.z * 0.75], [0.12, 0.022, 0.018]);
        }
      }
      const equipment = root.children.find(object => object.userData?.equipmentType);
      const rightArm = root.getObjectByName('arm_right');
      if (equipment && rightArm) moveWithJoint(root, equipment.name, rightArm);
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
    const metal = materialOf(root, 'industrial') || materialOf(root, 'darkMetal');
    const dark = materialOf(root, 'darkMetal') || metal;
    const accent = materialOf(root, 'emissiveGreen') || materialOf(root, 'emissiveAmber') || materialOf(root, 'emissiveRed');
    if (!metal || !dark) return null;
    const screw = (x, y, z, radius = 0.035) => {
      batches.cylinder(root, metal, [x, y, z], radius, 0.025, [Math.PI / 2, 0, 0], 10);
      batches.box(root, dark, [x, y, z + 0.014], [radius * 1.1, 0.009, 0.009]);
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
    } else if (type === 'console') {
      for (let column = 0; column < 11; column++) {
        const h = 0.04 + ((column * 17) % 7) * 0.023;
        batches.box(root, dark, [-0.57 + column * 0.105, 1.65, 0.402], [0.035, h, 0.012], [-0.35, 0, 0]);
      }
      for (let row = 0; row < 4; row++) for (let column = 0; column < 12; column++) {
        batches.box(root, dark, [-0.77 + column * 0.139, 1.105, 0.5 + row * 0.06], [0.095, 0.025, 0.04], [0.12, 0, 0]);
      }
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
    } else if (type === 'door') {
      for (const side of [-1, 1]) {
        batches.box(root, dark, [side * 0.88, 2.42, 0.244], [1.42, 4.15, 0.024]);
        batches.box(root, metal, [side * 0.88, 2.42, 0.262], [1.36, 4.07, 0.018]);
        for (let seam = 0; seam < 4; seam++) batches.box(root, dark, [side * 0.88, 0.95 + seam * 1.02, 0.278], [1.25, 0.025, 0.014]);
        for (let latch = 0; latch < 3; latch++) batches.box(root, dark, [side * 1.75, 0.86 + latch * 1.45, 0.34], [0.17, 0.28, 0.22]);
        for (let bolt = 0; bolt < 7; bolt++) screw(side * 1.91, 0.4 + bolt * 0.64, 0.36, 0.045);
      }
      for (let key = 0; key < 9; key++) batches.box(root, dark, [1.36 + key % 3 * 0.07, 2.29 + Math.floor(key / 3) * 0.085, 0.355], [0.032, 0.035, 0.012]);
    } else if (type === 'barrel') {
      for (let ridge = 0; ridge < 20; ridge++) {
        const angle = ridge * Math.PI / 10;
        batches.box(root, metal, [Math.cos(angle) * 0.625, 1, Math.sin(angle) * 0.625], [0.028, 1.34, 0.028]);
      }
      batches.cylinder(root, dark, [0.24, 1.925, 0.12], 0.11, 0.025, null, 24);
      batches.cylinder(root, metal, [0.24, 1.944, 0.12], 0.068, 0.02, null, 6);
      batches.cylinder(root, dark, [-0.18, 1.925, -0.22], 0.062, 0.025, null, 24);
    } else if (type === 'vent') {
      for (let fin = 0; fin < 13; fin++) batches.box(root, dark, [-0.88 + fin * 0.147, 1.2, 0.19], [0.025, 1.85, 0.025]);
      for (const x of [-1.08, 1.08]) for (const y of [0.13, 1.2, 2.28]) screw(x, y, 0.24, 0.05);
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
    } else if (type === 'lamp') {
      for (let rib = 0; rib < 9; rib++) batches.box(root, dark, [-0.64 + rib * 0.16, 0.02, 0], [0.025, 0.055, 0.4]);
      for (const side of [-1, 1]) batches.box(root, dark, [side * 0.75, 0.14, 0], [0.08, 0.09, 0.4]);
    }
    if (accent) accent.emissiveIntensity = Math.min(accent.emissiveIntensity, 0.5);
    refineSmoothGeometry(T, root);
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
