/* HIVE ASCENSION — restrained, joint-local biological finishing.
 * Fine anatomy is batched per material and existing joint. No animation loop,
 * external asset, shared disposable geometry or additional light is required.
 */
(function exposeCreatureDetail(global) {
  'use strict';

  const TAU = Math.PI * 2;

  function makeBatches(T) {
    const parents = new Map();
    const matrix = new T.Matrix4();
    const position = new T.Vector3();
    const scale = new T.Vector3();
    const quaternion = new T.Quaternion();
    const rotation = new T.Euler();
    const stats = { meshes: 0, triangles: 0, elements: 0, refinedTriangles: 0 };

    function add(parent, material, geometry, at, size, orientation) {
      if (!parent || !material) { geometry.dispose(); return; }
      position.fromArray(at || [0, 0, 0]);
      scale.fromArray(size || [1, 1, 1]);
      if (orientation?.isQuaternion) quaternion.copy(orientation);
      else quaternion.setFromEuler(rotation.set(...(orientation || [0, 0, 0])));
      matrix.compose(position, quaternion, scale);
      const plain = geometry.index ? geometry.toNonIndexed() : geometry;
      if (plain !== geometry) geometry.dispose();
      plain.applyMatrix4(matrix);
      let materials = parents.get(parent);
      if (!materials) parents.set(parent, materials = new Map());
      let geometries = materials.get(material);
      if (!geometries) materials.set(material, geometries = []);
      geometries.push(plain);
      stats.elements++;
    }

    const batches = {
      stats,
      add,
      oval(parent, material, at, size, orientation, segments = 8) {
        add(parent, material, new T.SphereGeometry(1, segments, 6), at, size, orientation);
      },
      path(parent, material, points, radii, segments = 8, radial = 4) {
        if (!parent || points.length < 2) return;
        const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)), false, 'centripetal');
        const geometry = new T.TubeGeometry(curve, segments, 1, radial, false);
        const attribute = geometry.attributes.position;
        const widths = Array.isArray(radii) ? radii : [radii, radii];
        for (let row = 0; row <= segments; row++) {
          const t = row / segments;
          const center = curve.getPointAt(t);
          const span = t * (widths.length - 1);
          const lo = Math.min(widths.length - 2, Math.floor(span));
          const radius = T.MathUtils.lerp(widths[lo], widths[lo + 1], span - lo);
          for (let column = 0; column <= radial; column++) {
            const i = row * (radial + 1) + column;
            attribute.setXYZ(i,
              center.x + (attribute.getX(i) - center.x) * radius,
              center.y + (attribute.getY(i) - center.y) * radius,
              center.z + (attribute.getZ(i) - center.z) * radius);
          }
        }
        geometry.computeVertexNormals();
        add(parent, material, geometry);
      },
      ring(parent, material, at, radius, thickness, normal, segments = 10) {
        const orientation = new T.Quaternion().setFromUnitVectors(
          new T.Vector3(0, 0, 1), new T.Vector3(...normal).normalize());
        add(parent, material, new T.TorusGeometry(radius, thickness, 4, segments), at, null, orientation);
      },
      cone(parent, material, from, to, radius) {
        const start = new T.Vector3(...from), end = new T.Vector3(...to);
        const direction = end.clone().sub(start);
        const orientation = new T.Quaternion().setFromUnitVectors(
          new T.Vector3(0, 1, 0), direction.clone().normalize());
        add(parent, material, new T.ConeGeometry(radius, direction.length(), 6, 1),
          start.add(end).multiplyScalar(0.5).toArray(), null, orientation);
      },
      patch(parent, material, rows, columns, sample) {
        const positions = [], uv = [], indices = [];
        for (let row = 0; row <= rows; row++) {
          for (let column = 0; column <= columns; column++) {
            positions.push(...sample(row / rows, column / columns));
            uv.push(column / columns, row / rows);
            if (row < rows && column < columns) {
              const a = row * (columns + 1) + column, b = a + columns + 1;
              indices.push(a, b, a + 1, b, b + 1, a + 1);
            }
          }
        }
        const geometry = new T.BufferGeometry();
        geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        add(parent, material, geometry);
      },
      finish() {
        for (const [parent, materials] of parents) {
          for (const [material, geometries] of materials) {
            const count = geometries.reduce((sum, geometry) => sum + geometry.attributes.position.count, 0);
            const positions = new Float32Array(count * 3), normals = new Float32Array(count * 3);
            const uvs = new Float32Array(count * 2);
            let offset = 0;
            for (const geometry of geometries) {
              const attributes = geometry.attributes;
              positions.set(attributes.position.array, offset * 3);
              normals.set(attributes.normal.array, offset * 3);
              if (attributes.uv) uvs.set(attributes.uv.array, offset * 2);
              offset += attributes.position.count;
              geometry.dispose();
            }
            const geometry = new T.BufferGeometry();
            geometry.setAttribute('position', new T.BufferAttribute(positions, 3));
            geometry.setAttribute('normal', new T.BufferAttribute(normals, 3));
            geometry.setAttribute('uv', new T.BufferAttribute(uvs, 2));
            geometry.setAttribute('uv2', new T.BufferAttribute(uvs.slice(), 2));
            geometry.computeBoundingSphere();
            const mesh = new T.Mesh(geometry, material);
            mesh.name = 'creature_anatomy_batch';
            mesh.userData.creatureAnatomy = true;
            mesh.castShadow = !material.transparent;
            mesh.receiveShadow = true;
            parent.add(mesh);
            stats.meshes++;
            stats.triangles += count / 3;
          }
        }
        return stats;
      }
    };
    return batches;
  }

  // Sample the actual authored loft, not a surrounding primitive. Veins and
  // connective tissue consequently stay in contact with the sculpted skin.
  function surfacePoint(mesh, t, angle, offset = 0.012, alongZ = false) {
    const layout = mesh.geometry.userData.organicLoft;
    if (layout) {
      const { axial, radial } = layout;
      const row = Math.max(0, Math.min(axial - 0.00001, t * axial));
      const column = ((angle / TAU % 1 + 1) % 1) * radial;
      const lo = Math.floor(row), left = Math.floor(column);
      const fy = row - lo, fx = column - left;
      const attribute = mesh.geometry.attributes.position;
      const normal = mesh.geometry.attributes.normal;
      const result = [0, 0, 0];
      for (let dy = 0; dy <= 1; dy++) for (let dx = 0; dx <= 1; dx++) {
        const i = (lo + dy) * (radial + 1) + left + dx;
        const weight = (dy ? fy : 1 - fy) * (dx ? fx : 1 - fx);
        result[0] += (attribute.getX(i) + normal.getX(i) * offset) * weight;
        result[1] += (attribute.getY(i) + normal.getY(i) * offset) * weight;
        result[2] += (attribute.getZ(i) + normal.getZ(i) * offset) * weight;
      }
      return result;
    }
    const axis = t * 2 - 1, radius = Math.sqrt(Math.max(0, 1 - axis * axis));
    const x = Math.cos(angle) * radius * (1 + offset);
    const transverse = Math.sin(angle) * radius * (1 + offset);
    const point = alongZ ? [x, transverse, axis * (1 + offset)] : [x, axis * (1 + offset), transverse];
    const vault = mesh.geometry.userData.creatureVault;
    if (vault) {
      const rear = Math.max(0, -point[2]);
      point[0] *= 1 - rear * 0.1;
      point[2] -= (1 - point[2]) * vault.rearExtension;
    }
    return point;
  }

  function palette(factory, presets) {
    const materials = {};
    return new Proxy(materials, {
      get(target, key) {
        if (!presets[key]) return undefined;
        if (!target[key]) {
          const [kind, options] = presets[key];
          target[key] = factory._material(kind, { emissive: 0x000000, emissiveIntensity: 0, ...options });
          target[key].userData.creatureAnatomy = true;
        }
        return target[key];
      }
    });
  }

  function eggDetail(factory, root, batch, T) {
    const materials = palette(factory, {
      ridge: ['skin', { color: 0x554339, roughness: 0.57, metalness: 0.02 }],
      vein: ['skin', { color: 0x49312b, roughness: 0.48, metalness: 0.01 }],
      lip: ['skin', { color: 0x70443c, roughness: 0.31, clearcoat: 0.46 }],
      wet: ['resin', { color: 0x9a7460, roughness: 0.2, metalness: 0.02,
        transparent: true, opacity: 0.36, depthWrite: false, side: T.DoubleSide }]
    });
    const shell = root.getObjectByName('shell_body');
    if (shell) for (let lobe = 0; lobe < 8; lobe++) {
      const angle = lobe / 8 * TAU;
      const points = Array.from({ length: 7 }, (_, i) => {
        const t = 0.12 + i * 0.112;
        return surfacePoint(shell, t, angle + Math.sin(t * 6 + lobe) * 0.055, 0.012);
      });
      batch.path(shell, materials.ridge, points, [0.018, 0.024, 0.013], 10, 5);
      for (let branch = 0; branch < 2; branch++) {
        const base = 0.28 + branch * 0.29;
        batch.path(shell, materials.vein, Array.from({ length: 4 }, (_, i) =>
          surfacePoint(shell, base + i * 0.044, angle + i * (branch ? -0.12 : 0.12), 0.01)),
        [0.012, 0.003], 5, 4);
      }
    }

    for (let i = 0; i < 4; i++) {
      const petal = root.getObjectByName(`articulated_petal_${i}`);
      const lining = petal?.getObjectByName('petal_membrane');
      if (!lining) continue;
      // A vascular horseshoe follows each fleshy lip; no bridge spans the
      // opening, so all four petals retain their full range of movement.
      batch.path(lining, materials.lip, Array.from({ length: 9 }, (_, k) => {
        const arc = k / 8 * Math.PI;
        return surfacePoint(lining, 0.14 + Math.sin(arc) * 0.74,
          Math.PI * 0.15 + arc * 0.7, 0.035, true);
      }), [0.04, 0.075, 0.045], 10, 5);
      for (const side of [-1, 1]) {
        batch.path(lining, materials.vein, Array.from({ length: 5 }, (_, k) =>
          surfacePoint(lining, 0.12 + k * 0.17, Math.PI / 2 + side * (0.33 + k * 0.04), 0.022, true)),
        [0.023, 0.007], 5, 4);
      }
      for (let fold = 0; fold < 3; fold++) {
        batch.path(lining, materials.lip, Array.from({ length: 4 }, (_, k) =>
          surfacePoint(lining, 0.28 + fold * 0.17 + Math.sin(k / 3 * Math.PI) * 0.03,
            0.35 + k / 3 * 2.4, 0.025, true)), [0.02, 0.027, 0.012], 4, 4);
      }
      batch.patch(lining, materials.wet, 4, 4, (v, u) =>
        surfacePoint(lining, 0.21 + v * 0.54, Math.PI * (0.3 + u * 0.4), 0.031, true));
    }
    const seal = root.getObjectByName('apical_seal');
    if (seal) {
      for (let i = 0; i < 4; i++) {
        const angle = i * Math.PI / 2;
        batch.path(seal, materials.lip, [[0, 1.025, 0],
          [Math.cos(angle) * 0.34, 0.97, Math.sin(angle) * 0.34],
          [Math.cos(angle) * 0.73, 0.71, Math.sin(angle) * 0.73]], [0.024, 0.009], 5, 4);
      }
    }
    return ['vascular shell', 'four independent fleshy lips', 'wet petal lining', 'sealed apical sutures'];
  }

  function facehuggerDetail(factory, root, batch, T) {
    const mutant = root.name.includes('black_goo');
    const materials = palette(factory, {
      fold: ['skin', { color: mutant ? 0x34302c : 0x94816a, roughness: 0.59, clearcoat: 0.18 }],
      sac: ['skin', { color: mutant ? 0x2b2521 : 0xb59d81, roughness: 0.4, clearcoat: 0.32 }],
      nail: ['bone', { color: mutant ? 0x454139 : 0x827052, roughness: 0.36, metalness: 0.08 }],
      ventral: ['skin', { color: mutant ? 0x171717 : 0x776251, roughness: 0.57 }]
    });
    const assembly = root.getObjectByName('crawler_scaled_assembly') || root;
    for (const side of [-1, 1]) {
      batch.oval(assembly, materials.sac, [side * 0.38, 0.27, -0.05], [0.23, 0.125, 0.52]);
      for (let pleat = 0; pleat < 4; pleat++) {
        const z = -0.39 + pleat * 0.19;
        batch.path(assembly, materials.fold, [[side * 0.22, 0.235, z - 0.05],
          [side * 0.4, 0.16, z], [side * 0.56, 0.26, z + 0.04]], [0.012, 0.018, 0.009], 4, 4);
      }
    }
    for (let sternite = 0; sternite < 5; sternite++) {
      batch.oval(assembly, materials.ventral, [0, 0.228, -0.55 + sternite * 0.22],
        [0.13 + sternite * 0.01, 0.037, 0.065]);
    }

    for (let i = 0; i < 8; i++) {
      const leg = root.getObjectByName(`crawler_leg_${i}`);
      const knee = root.getObjectByName(`crawler_knee_${i}`);
      const ankle = root.getObjectByName(`crawler_ankle_${i}`);
      if (!leg || !knee || !ankle) continue;
      const side = leg.userData.side, row = leg.userData.row;
      // Narrow asymmetric creases read as finger joints, not mechanical beads.
      for (const [joint, radius] of [[knee, 0.127], [ankle, 0.082]]) {
        batch.path(joint, materials.fold, [[-radius * 0.65, radius * 0.52, -radius * 0.57],
          [0, radius * 0.97, -radius * 0.32], [radius * 0.65, radius * 0.52, radius * 0.15]],
        [0.013, 0.018, 0.01], 5, 4);
        batch.path(joint, materials.fold, [[-radius * 0.6, radius * 0.55, radius * 0.1],
          [0, radius * 0.91, radius * 0.4], [radius * 0.54, radius * 0.5, radius * 0.5]], 0.009, 4, 3);
      }
      const length = knee.position;
      batch.path(leg, materials.fold, [[side * 0.04, 0.09, 0],
        [length.x * 0.52, length.y * 0.5 + 0.1, length.z * 0.5],
        [length.x * 0.91, length.y + 0.08, length.z * 0.93]], [0.017, 0.009], 5, 4);
      const toe = [side * 0.28, -0.08, (row - 1.5) * 0.06];
      batch.cone(ankle, materials.nail, [toe[0] * 0.82, toe[1] + 0.035, toe[2]],
        [toe[0] + side * 0.13, toe[1] - 0.045, toe[2]], 0.035);
    }
    const tail = root.getObjectByName('crawler_tail_root');
    const tailMesh = root.getObjectByName('prehensile_tail');
    const curve = tailMesh?.geometry.parameters?.path;
    if (tail && curve) for (let ring = 0; ring < 21; ring++) {
      const t = 0.04 + ring / 21 * 0.91;
      batch.ring(tail, materials.fold, curve.getPointAt(t).toArray(), 0.106,
        0.009 + (1 - t) * 0.003, curve.getTangentAt(t).toArray(), 8);
    }
    return ['finger knuckle creases', 'terminal keratin nails', 'paired ventral breathing sacs', 'annulated prehensile tail'];
  }

  function mouthDetail(root, batch, materials, T, scale = 1) {
    const jaw = root.getObjectByName('articulated_jaw');
    if (!jaw) return;
    for (const side of [-1, 1]) {
      batch.path(jaw, materials.flesh, [[side * 0.36 * scale, 0.045 * scale, -0.1 * scale],
        [side * 0.39 * scale, -0.012 * scale, 0.13 * scale],
        [side * 0.25 * scale, -0.025 * scale, 0.3 * scale],
        [side * 0.03 * scale, -0.022 * scale, 0.343 * scale]],
      [0.024 * scale, 0.034 * scale, 0.019 * scale], 10, 5);
      for (let fold = 0; fold < 3; fold++) {
        batch.path(jaw, materials.flesh,
          [[side * (0.31 + fold * 0.018) * scale, -0.025 * scale, -0.08 * scale],
            [side * (0.33 + fold * 0.018) * scale, -0.075 * scale, 0.05 * scale],
            [side * (0.25 + fold * 0.026) * scale, -0.09 * scale, 0.16 * scale]],
          0.009 * scale, 5, 4);
      }
    }
    // Individual original dental arcades remain articulated. Brushed enamel
    // gives them the metallic catchlight of the films without a luminous jaw.
    jaw.traverse(object => {
      if (/^dental_arcade_|^inner_jaw_crown$/.test(object.name) && object.isMesh) {
        object.material = materials.enamel;
        // Original bone material is still used by the rest of the creature;
        // factory disposal owns it. No per-tooth material clone is created.
      }
    });
    const inner = jaw.getObjectByName('pharyngeal_jaw_slider');
    if (inner) for (const side of [-1, 1]) {
      batch.path(inner, materials.flesh, [[side * 0.046 * scale, 0, 0.04 * scale],
        [side * 0.052 * scale, -0.014 * scale, 0.19 * scale],
        [side * 0.04 * scale, 0, 0.33 * scale]], [0.012 * scale, 0.008 * scale], 7, 4);
    }
  }

  function headDetail(head, batch, materials, T, refined = false, rearExtension = 0) {
    if (!head?.isMesh) return;
    if (refined && head.geometry.type === 'SphereGeometry' && head.geometry.parameters.widthSegments < 40) {
      const previous = head.geometry;
      const triangles = previous.index ? previous.index.count / 3 : previous.attributes.position.count / 3;
      head.geometry = new T.SphereGeometry(1, 48, 24);
      head.geometry.setAttribute('uv2', head.geometry.attributes.uv.clone());
      batch.stats.refinedTriangles += head.geometry.index.count / 3 - triangles;
      previous.dispose();
    }
    if (rearExtension && !head.userData.modernAnatomy &&
        (head.geometry.type === 'SphereGeometry' || head.geometry.userData.organicLoft?.alongZ)) {
      // Grow the vault behind the fixed face, not uniformly around its center.
      // Changing geometry instead of joint scale keeps the teeth, static face
      // attachments and jaw bind transforms exactly where the rig expects.
      const attribute = head.geometry.attributes.position;
      for (let i = 0; i < attribute.count; i++) {
        const z = attribute.getZ(i), rear = Math.max(0, -z);
        attribute.setXYZ(i, attribute.getX(i) * (1 - rear * 0.1), attribute.getY(i),
          z - (1 - z) * rearExtension);
      }
      attribute.needsUpdate = true;
      head.geometry.computeVertexNormals();
      head.geometry.computeBoundingSphere();
      head.geometry.computeBoundingBox();
      head.geometry.userData.creatureVault = { rearExtension };
    }
    // The upper vault stays smooth. Thin temporal folds sit below it, with no
    // painted eyes, glowing nose or decorative crown obscuring the silhouette.
    for (const side of [-1, 1]) {
      const angle = side < 0 ? Math.PI + 0.3 : -0.3;
      for (let fold = 0; fold < 3; fold++) {
        batch.path(head, materials.rib, Array.from({ length: 6 }, (_, i) =>
          surfacePoint(head, 0.18 + i * 0.125, angle - side * fold * 0.13, 0.012, true)),
        [0.018, 0.028, 0.008], 10, 4);
      }
    }
  }

  function juvenileDetail(factory, root, batch, T) {
    const materials = palette(factory, {
      rib: ['skin', { color: 0xa48a73, roughness: 0.43, clearcoat: 0.24 }],
      flesh: ['skin', { color: 0x856b5b, roughness: 0.36, clearcoat: 0.4 }],
      enamel: ['bone', { color: 0xc8c7b6, roughness: 0.23, metalness: 0.38 }],
      membrane: ['skin', { color: 0x967965, roughness: 0.41,
        transparent: true, opacity: 0.64, side: T.DoubleSide }]
    });
    const head = root.getObjectByName('juvenile_head');
    headDetail(head, batch, materials, T);
    const trunk = root.getObjectByName('larval_trunk');
    if (trunk) {
      for (let vertebra = 0; vertebra < 8; vertebra++) {
        const z = -0.83 + vertebra * 0.15;
        const width = 0.2 + Math.sin(vertebra / 8 * Math.PI) * 0.13;
        const centerY = 0.63 + Math.sin(vertebra / 8 * Math.PI) * 0.13;
        batch.oval(trunk, materials.rib, [0, centerY + width * 0.96, z], [0.062, 0.038, 0.047]);
        for (const side of [-1, 1]) {
          batch.path(trunk, materials.rib, [[side * 0.03, centerY + width, z],
            [side * width * 0.75, centerY + width * 0.7, z - 0.025],
            [side * width, centerY, z + 0.025],
            [side * width * 0.63, centerY - width * 0.72, z + 0.04]],
          [0.014, 0.018, 0.008], 7, 4);
        }
      }
    }
    for (const side of [-1, 1]) {
      const arm = root.getObjectByName(`juvenile_arm_${side}`);
      if (arm) {
        batch.patch(arm, materials.membrane, 3, 3, (v, u) => {
          const spread = Math.sin(v * Math.PI) * 0.09;
          return [side * (0.04 + v * 0.21 + u * spread), -v * 0.15, v * 0.16 - u * 0.11];
        });
      }
    }
    mouthDetail(root, batch, materials, T, 0.56);
    return ['thoracic vertebrae', 'fine costal arches', 'larval limb membranes', 'temporal folds', 'wet articulated mouth'];
  }

  function cocoonDetail(factory, root, batch, T) {
    const materials = palette(factory, {
      vein: ['skin', { color: 0x684534, roughness: 0.35, clearcoat: 0.36 }],
      capillary: ['skin', { color: 0x493429, roughness: 0.39, clearcoat: 0.23 }],
      tissue: ['skin', { color: 0x9c795e, roughness: 0.28, clearcoat: 0.44,
        transparent: true, opacity: 0.3, depthWrite: false, side: T.DoubleSide }]
    });
    for (const side of [-1, 1]) {
      const half = root.getObjectByName(side < 0 ? 'cocoon_shell_left' : 'cocoon_shell_right');
      if (!half) continue;
      const point = (height, angle, inset = 1.008) => {
        const radius = Math.sqrt(Math.max(0, 1 - height * height));
        const x = side * Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        const taper = 0.9 + 0.12 * Math.sin((height + 1) * 1.7);
        const corrugation = 1 + Math.sin(height * 27 + z * 3) * 0.018;
        return [x * 1.23 * taper * corrugation * inset - half.position.x,
          1.78 + height * 1.7 - half.position.y,
          z * (1.03 + height * 0.08) * corrugation * inset - half.position.z];
      };
      for (let rib = 0; rib < 8; rib++) {
        const mesh = half.getObjectByName(`romulus_rib_${side < 0 ? 'left' : 'right'}_${rib}`);
        if (!mesh) continue;
        const height = (0.55 + rib * 0.34 - 1.78) / 1.7;
        const points = Array.from({ length: 9 }, (_, i) => {
          const angle = Math.PI - i / 8 * Math.PI;
          return new T.Vector3(...point(height + Math.cos(angle) * 0.024, angle, 1.008));
        });
        const previous = mesh.geometry;
        const before = previous.index ? previous.index.count / 3 : previous.attributes.position.count / 3;
        mesh.geometry = new T.TubeGeometry(new T.CatmullRomCurve3(points, false, 'centripetal'),
          16, 0.015 + rib % 2 * 0.002, 5, false);
        mesh.geometry.setAttribute('uv2', mesh.geometry.attributes.uv.clone());
        batch.stats.refinedTriangles += mesh.geometry.index.count / 3 - before;
        previous.dispose();
        mesh.material.color.setHex(0x4e4336);
        mesh.material.roughness = 0.44;
        mesh.material.metalness = 0.12;
      }
      const lip = half.getObjectByName(side < 0 ? 'suture_lip_left' : 'suture_lip_right');
      if (lip?.geometry.parameters?.path) {
        const parameters = lip.geometry.parameters;
        const previous = lip.geometry;
        lip.geometry = new T.TubeGeometry(parameters.path, parameters.tubularSegments,
          parameters.radius * 0.62, parameters.radialSegments, false);
        lip.geometry.setAttribute('uv2', lip.geometry.attributes.uv.clone());
        previous.dispose();
      }
      for (let vessel = 0; vessel < 5; vessel++) {
        const angle = 0.25 + vessel * 0.57;
        batch.path(half, materials.vein, Array.from({ length: 8 }, (_, i) => {
          const height = -0.84 + i * 0.23;
          return point(height, angle + 0.035 * Math.sin(i * 1.7 + vessel));
        }), [0.005, 0.016, 0.005], 12, 4);
        for (let branch = 0; branch < 2; branch++) {
          const base = -0.54 + branch * 0.63;
          batch.path(half, materials.capillary, Array.from({ length: 4 }, (_, i) =>
            point(base + i * 0.065, angle + i * (branch ? -0.09 : 0.085))),
          [0.009, 0.002], 5, 3);
        }
      }
      for (let patch = 0; patch < 3; patch++) {
        const start = -0.65 + patch * 0.43;
        // Small adherent sheets are deliberate: a second opaque full shell or
        // free-standing cage would conceal the embryo and block the split.
        batch.patch(half, materials.tissue, 6, 5, (v, u) =>
          point(start + v * 0.28, 0.5 + patch * 0.58 + u * 0.49 + Math.sin(v * Math.PI) * 0.05, 1.012));
        for (let fold = 0; fold < 2; fold++) {
          batch.path(half, materials.vein, Array.from({ length: 5 }, (_, i) =>
            point(start + i * 0.055, 0.54 + patch * 0.58 + fold * 0.23 + Math.sin(i) * 0.022, 1.016)),
          [0.006, 0.009, 0.003], 5, 3);
        }
      }
    }
    return ['adherent wet tissue sheets', 'branching nonluminous capillaries', 'independently peeling shell detail'];
  }

  function adultDetail(factory, root, metadata, batch, T) {
    const pale = /neomorph|newborn|offspring|abomination|bodyburster/.test(metadata.caste || '');
    const materials = palette(factory, {
      rib: ['resin', { color: pale ? 0xa39b8c : 0x303632, roughness: 0.36, metalness: pale ? 0.04 : 0.32 }],
      flesh: ['skin', { color: pale ? 0x877361 : 0x252b27, roughness: 0.3, clearcoat: 0.35 }],
      enamel: ['bone', { color: 0xb8bdb2, roughness: 0.2, metalness: 0.6 }],
      cavity: ['chitin', { color: 0x080b09, roughness: 0.74, metalness: 0.03 }],
      skull: ['bone', { color: 0x968f7d, roughness: 0.58, metalness: 0.02 }]
    });
    const originalMeshes = [];
    root.traverse(object => { if (object.isMesh) originalMeshes.push(object); });
    let head = root.getObjectByName('cranial_dome') || root.getObjectByName('runner_head') || root.getObjectByName('crusher_head');
    if (!head) head = originalMeshes.find(object => /(?:^|_)head$/.test(object.name)) ||
      originalMeshes.find(object => /(?:^|_)cranium$/.test(object.name));
    if (head) {
      // These static face parts were root siblings of the moving cranial
      // pivot. Preserve their world-space bind transform, then let the skull,
      // mask and muzzle follow that pivot. Jaw/inner-jaw pivots stay untouched.
      root.updateMatrixWorld(true);
      for (const object of originalMeshes) {
        if (object.parent !== root || object === head) continue;
        if (/^(facial_mask|runner_muzzle|drone_internal_skull|skull_orbit_-?1|skull_nasal_cavity|skull_maxilla_teeth|warrior_cranial_ridge_\d+|praetorian_coronary_spike_\d+|praetorian_jugular_plate_-?1)$/.test(object.name)) {
          head.attach(object);
          batch.stats.attachedFacialMeshes = (batch.stats.attachedFacialMeshes || 0) + 1;
        }
      }
    }
    const extendedVault = head?.name === 'cranial_dome' &&
      !/deacon|neomorph|newborn|offspring|abomination|bodyburster/.test(metadata.caste || '');
    headDetail(head, batch, materials, T, true,
      extendedVault ? (metadata.caste === 'queen' ? 0.16 : metadata.caste === 'warrior' ? 0.29 : 0.36) : 0);
    if (head && metadata.caste === 'warrior') {
      for (let ridge = 0; ridge < 7; ridge++) {
        const mesh = head.getObjectByName(`warrior_cranial_ridge_${ridge}`);
        if (!mesh) continue;
        const points = Array.from({ length: 9 }, (_, i) => new T.Vector3(...
          surfacePoint(head, 0.16 + ridge * 0.105, Math.PI * (0.07 + i / 8 * 0.86), 0.026, true)));
        const previous = mesh.geometry;
        const before = previous.index ? previous.index.count / 3 : previous.attributes.position.count / 3;
        mesh.geometry = new T.TubeGeometry(new T.CatmullRomCurve3(points, false, 'centripetal'), 12, 0.047, 5, false);
        mesh.geometry.setAttribute('uv2', mesh.geometry.attributes.uv.clone());
        mesh.position.set(0, 0, 0); mesh.quaternion.identity(); mesh.scale.set(1, 1, 1);
        batch.stats.refinedTriangles += mesh.geometry.index.count / 3 - before;
        previous.dispose();
      }
    }
    const crest = root.getObjectByName('royal_crown_crest') || root.getObjectByName('guardian_crest');
    if (head && crest?.parent === root) {
      const unit = head.position.y / 4.58;
      crest.position.set(0, head.position.y - 0.045 * unit, head.position.z - 0.18 * unit);
      crest.scale.setScalar(0.68);
      root.updateMatrixWorld(true);
      head.attach(crest);
      batch.stats.correctedCranialCrest = true;
    }

    const torso = root.getObjectByName('thorax') || root.getObjectByName('runner_thorax') ||
      root.getObjectByName('crusher_thorax') || originalMeshes.find(object => /_(torso|chest|carapace)$/.test(object.name));
    if (torso) {
      const horizontal = /runner_|crusher_/.test(torso.name);
      // Short, embedded costal tendons follow the existing sculpt instead of
      // introducing floating ring ribs around the entire torso.
      for (let rib = 0; rib < 7; rib++) for (const side of [-1, 1]) {
        const height = 0.24 + rib * 0.076;
        batch.path(torso, materials.rib, Array.from({ length: 6 }, (_, i) => {
          const angle = side < 0 ? Math.PI * (0.54 + i * 0.065) : Math.PI * (0.46 - i * 0.065);
          return surfacePoint(torso, height + Math.sin(i / 5 * Math.PI) * 0.025, angle, 0.014, horizontal);
        }), [0.008, 0.019, 0.006], 7, 4);
      }
      for (const side of [-1, 1]) {
        batch.path(torso, materials.flesh, Array.from({ length: 8 }, (_, i) =>
          surfacePoint(torso, 0.17 + i * 0.096, Math.PI / 2 + side * (0.11 + i * 0.018), 0.018, horizontal)),
        [0.009, 0.014, 0.006], 12, 4);
      }
    }
    const pelvis = root.getObjectByName('pelvic_carapace');
    if (pelvis) for (let segment = 0; segment < 5; segment++) {
      batch.path(pelvis, materials.rib, Array.from({ length: 6 }, (_, i) =>
        surfacePoint(pelvis, 0.2 + segment * 0.13, 0.55 + i * 0.4, 0.018)),
      [0.009, 0.025, 0.009], 7, 4);
    }
    const jaw = root.getObjectByName('articulated_jaw');
    if (jaw) {
      const mandible = jaw.getObjectByName('lower_mandible');
      mouthDetail(root, batch, materials, T, mandible ? mandible.scale.x / 0.39 : 1);
    } else if (head) {
      // Specialized host phenotypes have no jaw rig. Keep their anatomy and
      // add only a recessed dental edge beneath the front of the head.
      for (const side of [-1, 1]) {
        batch.path(head, materials.flesh,
          [[side * 0.62, -0.42, 0.57], [side * 0.38, -0.55, 0.79], [0, -0.56, 0.84]],
          [0.036, 0.022], 8, 4);
        for (let tooth = 0; tooth < 4; tooth++) {
          batch.cone(head, materials.enamel, [side * (0.08 + tooth * 0.1), -0.48, 0.82 - tooth * 0.026],
            [side * (0.08 + tooth * 0.1), -0.64, 0.83 - tooth * 0.026], 0.025);
        }
      }
    }

    for (const object of originalMeshes) {
      if (!/^dorsal_tube_|^worker_chimney_/.test(object.name)) continue;
      const curve = object.geometry.parameters?.path;
      if (!curve) {
        const parameters = object.geometry.parameters;
        if (object.geometry.type !== 'CylinderGeometry' || !parameters?.height) continue;
        for (let ring = 0; ring < 3; ring++) {
          const t = 0.7 + ring * 0.14;
          const radius = T.MathUtils.lerp(parameters.radiusBottom, parameters.radiusTop, t);
          batch.ring(object, materials.rib, [0, parameters.height * (t - 0.5), 0],
            radius * 1.015, radius * 0.1, [0, 1, 0], 8);
        }
        const orientation = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 0, 1), new T.Vector3(0, 1, 0));
        batch.add(object, materials.cavity, new T.CircleGeometry(parameters.radiusTop * 0.78, 10),
          [0, parameters.height * 0.501, 0], null, orientation);
        continue;
      }
      const radius = object.geometry.parameters.radius;
      for (let ring = 0; ring < 4; ring++) {
        const t = 0.77 + ring * 0.073;
        batch.ring(object, materials.rib, curve.getPointAt(t).toArray(), radius * 1.02,
          radius * 0.1, curve.getTangentAt(t).toArray(), 8);
      }
      const at = curve.getPointAt(0.997), normal = curve.getTangentAt(0.997);
      const orientation = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 0, 1), normal);
      batch.add(object, materials.cavity, new T.CircleGeometry(radius * 0.78, 10), at.toArray(), null, orientation);
    }

    // The inner human-like skull remains a partial, shadowed reading under the
    // translucent drone vault, with sutures rather than an exposed white orb.
    const innerSkull = root.getObjectByName('drone_internal_skull');
    if (innerSkull) {
      batch.path(innerSkull, materials.skull, [[0, 0.76, -0.48], [0.025, 0.98, -0.08],
        [-0.015, 0.93, 0.28], [0, 0.78, 0.54]], [0.012, 0.006], 10, 3);
      for (const side of [-1, 1]) batch.path(innerSkull, materials.skull,
        [[0, 0.94, 0.22], [side * 0.46, 0.84, 0.24], [side * 0.78, 0.48, 0.26]], 0.009, 7, 3);
    }
    return ['smooth cranial vault', 'subdomal temporal folds', 'embedded intercostal tendons',
      'segmented ventral tissue', 'nonluminous metallic dental arcades', 'dorsal pipe annuli and apertures'];
  }

  global.HiveCreatureDetail = {
    decorate(factory, root, metadata) {
      if (!root || root.userData.creatureFidelity || !global.THREE) return;
      const type = metadata?.modelType || root.userData.modelType;
      if (!['egg', 'facehugger', 'chestburster', 'adult'].includes(type)) return;
      const T = global.THREE;
      const batch = makeBatches(T);
      let coverage;
      if (type === 'egg') coverage = eggDetail(factory, root, batch, T);
      else if (type === 'facehugger') coverage = facehuggerDetail(factory, root, batch, T);
      else if (type === 'chestburster' && metadata?.chrysalis) coverage = cocoonDetail(factory, root, batch, T);
      else if (type === 'chestburster') coverage = juvenileDetail(factory, root, batch, T);
      else coverage = adultDetail(factory, root, metadata || root.userData, batch, T);
      root.userData.creatureFidelity = { version: 1, family: type, coverage, ...batch.finish() };
    }
  };
}(typeof window !== 'undefined' ? window : globalThis));
