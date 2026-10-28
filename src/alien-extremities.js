/* Joint-local anatomical replacements for adult hands, feet and dental arcades.
 * Existing objects, transforms and animation pivots remain the public contract.
 * Geometry is replaced, never layered over the original primitives.
 */
(function exposeAlienExtremities(global) {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = value => Math.max(0, Math.min(1, value));
  const triangles = geometry => (geometry.index?.count || geometry.attributes.position.count) / 3;

  function finish(T, positions, uv, index, rows, columns) {
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    geometry.setAttribute('uv2', geometry.attributes.uv.clone());
    geometry.setIndex(index); geometry.computeVertexNormals();
    // Two coincident vertices close a UV seam; keep their normals identical.
    const normals = geometry.attributes.normal, stride = columns + 1;
    for (let row = 0; row <= rows; row++) {
      const a = row * stride, b = a + columns;
      const x = normals.getX(a) + normals.getX(b), y = normals.getY(a) + normals.getY(b);
      const z = normals.getZ(a) + normals.getZ(b), length = Math.hypot(x, y, z) || 1;
      normals.setXYZ(a, x / length, y / length, z / length);
      normals.setXYZ(b, x / length, y / length, z / length);
    }
    geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    return geometry;
  }

  function radiusAt(radii, t) {
    const span = clamp(t) * (radii.length - 1), i = Math.min(radii.length - 2, Math.floor(span));
    return radii[i] + (radii[i + 1] - radii[i]) * (span - i);
  }

  function sweep(T, points, radii, rows = 12, columns = 10, flatten = 1, digit = false) {
    const curve = new T.CatmullRomCurve3(points.map(point => new T.Vector3(...point)), false, 'centripetal');
    const frames = curve.computeFrenetFrames(rows, false), positions = [], uv = [], index = [];
    const stride = columns + 1;
    for (let row = 0; row <= rows; row++) {
      const t = row / rows, center = curve.getPointAt(t), radius = radiusAt(radii, t);
      for (let col = 0; col <= columns; col++) {
        const angle = col / columns * TAU;
        const normal = frames.normals[row], binormal = frames.binormals[row];
        // The digit is one uninterrupted envelope. A broad extensor ridge and
        // shallow flexion folds replace the old sphere between two cylinders.
        const tendon = digit ? 1 + .13 * Math.cos(angle * 2) * Math.sin(t * Math.PI) ** 2 : 1;
        const crease = digit ? 1 - .07 * Math.exp(-Math.pow((t - .49) / .055, 2)) * (.5 + .5 * Math.sin(angle)) : 1;
        const width = radius * tendon * crease;
        positions.push(center.x + width * (Math.cos(angle) * normal.x + Math.sin(angle) * binormal.x * flatten),
          center.y + width * (Math.cos(angle) * normal.y + Math.sin(angle) * binormal.y * flatten),
          center.z + width * (Math.cos(angle) * normal.z + Math.sin(angle) * binormal.z * flatten));
        uv.push(col / columns, t);
        if (row < rows && col < columns) {
          const a = row * stride + col, b = a + stride;
          index.push(a, a + 1, b, a + 1, b + 1, b);
        }
      }
    }
    for (const end of [0, rows]) {
      const center = curve.getPointAt(end / rows), id = positions.length / 3;
      positions.push(center.x, center.y, center.z); uv.push(.5, end / rows);
      for (let col = 0; col < columns; col++) {
        const a = end * stride + col, b = a + 1;
        if (end === 0) index.push(id, b, a); else index.push(id, a, b);
      }
    }
    return finish(T, positions, uv, index, rows, columns);
  }

  function digitPatch(T, whole, from, to, rows, columns) {
    const position = whole.attributes.position, normal = whole.attributes.normal, uv = whole.attributes.uv;
    const positions = [], normals = [], texture = [], indices = [], stride = columns + 1;
    for (let row = from; row <= to; row++) for (let col = 0; col <= columns; col++) {
      const source = row * stride + col;
      positions.push(position.getX(source), position.getY(source), position.getZ(source));
      normals.push(normal.getX(source), normal.getY(source), normal.getZ(source));
      texture.push(uv.getX(source), uv.getY(source));
      if (row < to && col < columns) {
        const a = (row - from) * stride + col, b = a + stride;
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
    // Each named patch remains a real closed volume, not a hidden placeholder.
    // The internal caps do not change the shared exterior ring normals.
    for (const end of [0, to - from]) {
      const center = new T.Vector3(), n = new T.Vector3();
      for (let col = 0; col < columns; col++) center.add(new T.Vector3(...positions.slice((end * stride + col) * 3, (end * stride + col) * 3 + 3)));
      center.multiplyScalar(1 / columns);
      const adjacent = end === 0 ? stride : (end - 1) * stride;
      n.set(positions[adjacent * 3], positions[adjacent * 3 + 1], positions[adjacent * 3 + 2]);
      n.sub(center).normalize().multiplyScalar(end === 0 ? -1 : 1);
      const id = positions.length / 3;
      positions.push(...center.toArray()); normals.push(...n.toArray()); texture.push(.5, (end + from) / rows);
      for (let col = 0; col < columns; col++) {
        const a = end * stride + col, b = a + 1;
        if (end === 0) indices.push(id, b, a); else indices.push(id, a, b);
      }
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new T.Float32BufferAttribute(texture, 2));
    geometry.setAttribute('uv2', geometry.attributes.uv.clone()); geometry.setIndex(indices);
    geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    geometry.userData.continuousDigit = {from, to, rows, columns};
    return geometry;
  }

  function palmGeometry(T, foot) {
    const rows = 26, columns = 24, positions = [], uv = [], index = [], stride = columns + 1;
    for (let row = 0; row <= rows; row++) {
      const t = row / rows, z = t * 2 - 1;
      const envelope = Math.pow(Math.max(.001, 1 - z * z), .45);
      const width = envelope * (.66 + .35 * t), thickness = envelope * (foot ? .60 : .58);
      for (let col = 0; col <= columns; col++) {
        const angle = col / columns * TAU, x = Math.cos(angle) * width;
        const dorsal = Math.max(0, Math.sin(angle));
        // Metacarpal ridges grow out of the palm, not separate dorsal beads.
        const tendons = Math.pow(.5 + .5 * Math.cos(x * (foot ? 11 : 16) + t * .6), 3);
        const ridge = dorsal * tendons * Math.pow(Math.sin(t * Math.PI), 2) * .11;
        positions.push(x, Math.sin(angle) * thickness + ridge - .08 * (1 - t) - .035 * t * t, z);
        uv.push(col / columns, t);
        if (row < rows && col < columns) {
          const a = row * stride + col, b = a + stride;
          index.push(a, a + 1, b, a + 1, b + 1, b);
        }
      }
    }
    for (const end of [0, rows]) {
      const id = positions.length / 3; positions.push(0, end ? 0 : -.06, end ? 1 : -1); uv.push(.5, end / rows);
      for (let col = 0; col < columns; col++) {
        const a = end * stride + col, b = a + 1;
        if (end === 0) index.push(id, b, a); else index.push(id, a, b);
      }
    }
    return finish(T, positions, uv, index, rows, columns);
  }

  function setGeometry(mesh, geometry, statistics, parentSpace = false) {
    const previous = mesh.geometry;
    statistics.previousTriangles += triangles(previous);
    if (parentSpace) {
      mesh.updateMatrix();
      geometry.applyMatrix4(mesh.matrix.clone().invert());
      geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    }
    mesh.geometry = geometry; previous.dispose();
    mesh.userData.alienExtremity = true;
    statistics.replacedMeshes++; statistics.triangles += triangles(geometry);
  }

  function joinedGeometry(T, pieces) {
    const positions = [], normals = [], uv = [], ranges = [];
    let start = 0;
    for (const [geometry, materialIndex] of pieces) {
      const plain = geometry.index ? geometry.toNonIndexed() : geometry;
      if (plain !== geometry) geometry.dispose();
      positions.push(...plain.attributes.position.array); normals.push(...plain.attributes.normal.array);
      uv.push(...plain.attributes.uv.array);
      const previous = ranges.at(-1);
      if (previous && previous[2] === materialIndex) previous[1] += plain.attributes.position.count;
      else ranges.push([start, plain.attributes.position.count, materialIndex]);
      start += plain.attributes.position.count; plain.dispose();
    }
    const result = new T.BufferGeometry();
    result.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    result.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
    result.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    result.setAttribute('uv2', result.attributes.uv.clone());
    for (const range of ranges) result.addGroup(...range);
    result.computeBoundingBox(); result.computeBoundingSphere(); return result;
  }

  function refineHands(root, materials, T, statistics) {
    const hands = []; root.traverse(object => {
      if (object.isGroup && /^(hand|foot)_(left|right)$/.test(object.name) && object.getObjectByName('palm_plate')) hands.push(object);
    });
    for (const hand of hands) {
      const foot = hand.name.startsWith('foot_'), palm = hand.getObjectByName('palm_plate');
      const scale = palm.scale.x / .3, count = foot ? 3 : 6;
      const proximal = hand.children.filter(object => object.name === 'proximal_phalanx');
      const distal = hand.children.filter(object => object.name === 'distal_phalanx');
      const knuckles = hand.children.filter(object => object.name === 'knuckle');
      const claws = hand.children.filter(object => object.name === 'terminal_claw');
      if ([proximal, distal, knuckles, claws].some(parts => parts.length !== count)) continue;
      setGeometry(palm, palmGeometry(T, foot), statistics);
      for (let digit = 0; digit < count; digit++) {
        const spread = foot ? [-.215, 0, .215][digit] : [-.29, -.175, -.055, .065, .18, .285][digit];
        const bias = foot ? [.9, 1, .87][digit] : [.69, .91, 1, .97, .88, .65][digit];
        const thumb = !foot && (digit === 0 || digit === count - 1), sign = spread < 0 ? -1 : 1;
        const points = [
          [spread * .81, .015, .235],
          [spread * 1.01 + (thumb ? sign * .045 : 0), -.025, .38 * bias + .10],
          [spread * 1.10 + (thumb ? sign * .075 : 0), foot ? -.035 : -.085, .53 * bias + .08],
          [spread * 1.13 + (thumb ? sign * .035 : 0), foot ? -.045 : -.185, .67 * bias + .07],
          [spread * 1.08, foot ? -.070 : -.285, .75 * bias + .06]
        ].map(point => point.map(value => value * scale));
        const radius = (foot ? .060 : thumb ? .050 : .047) * scale;
        const whole = sweep(T, points, [radius * 1.16, radius * .94, radius * .87, radius * .70, radius * .50], 24, 10, .79, true);
        setGeometry(proximal[digit], digitPatch(T, whole, 0, 10, 24, 10), statistics, true);
        setGeometry(knuckles[digit], digitPatch(T, whole, 10, 15, 24, 10), statistics, true);
        setGeometry(distal[digit], digitPatch(T, whole, 15, 24, 24, 10), statistics, true);
        whole.dispose(); statistics.continuousDigits++;
        const tip = points[4];
        const claw = [tip, [tip[0] + sign * .009 * scale, tip[1] - .003 * scale, tip[2] + .075 * scale],
          [tip[0] + sign * .007 * scale, tip[1] - (foot ? .028 : .035) * scale, tip[2] + .135 * scale],
          [tip[0] - sign * .012 * scale, tip[1] - (foot ? .080 : .125) * scale, tip[2] + .155 * scale]];
        setGeometry(claws[digit], sweep(T, claw, [.032 * scale, .028 * scale, .014 * scale, .0014 * scale], 13, 10, .72), statistics, true);
        claws[digit].material = materials.keratin;
      }
      statistics.hands++; statistics.digits += count;
    }
  }

  function refineMouth(root, materials, T, statistics) {
    const jaw = root.getObjectByName('articulated_jaw');
    if (!jaw) return;
    const mandible = jaw.getObjectByName('lower_mandible');
    if (mandible?.isMesh) {
      // Raycasts into the white oral floor in the native studio hit this old
      // chitin shell, not enamel. Give only this region a nonpolished finish.
      mandible.material = materials.oralCavity; statistics.oralCavity = true;
    }
    const teeth = []; jaw.traverse(object => { if (object.isMesh && /^dental_arcade_/.test(object.name)) teeth.push(object); });
    const first = teeth.find(tooth => tooth.name === 'dental_arcade_-1_0');
    const last = teeth.find(tooth => tooth.name === 'dental_arcade_-1_7');
    const unit = first && last ? Math.abs(last.position.x - first.position.x) / .59 : 1;
    if (mandible?.isMesh) {
      const arch = [[-.23, .12, -.20], [-.28, -.015, .03], [-.22, -.065, .17],
        [0, -.075, .248], [.22, -.065, .17], [.28, -.015, .03], [.23, .12, -.20]];
      setGeometry(mandible, sweep(T, arch.map(point => point.map(value => value * unit)),
        [.028 * unit, .048 * unit, .043 * unit, .035 * unit, .028 * unit], 28, 12, .74), statistics, true);
      statistics.sculptedMandible = true;
    }
    const face = root.getObjectByName('facial_mask');
    if (face?.isMesh) {
      const geometry = face.geometry.clone(), position = geometry.attributes.position;
      for (let i = 0; i < position.count; i++) {
        const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
        const front = clamp((z + .2) / 1.2);
        position.setXYZ(i, x * (1 - .18 * front), y * (1 - .11 * front) + .05 * front, z * .80 - .12);
      }
      geometry.computeVertexNormals();
      // Sphere UV poles contain unused coincident seam vertices. Their native
      // analytic normals must survive an otherwise valid sculpt/recompute.
      const normals = geometry.attributes.normal, originalNormals = face.geometry.attributes.normal;
      for (let i = 0; i < normals.count; i++) {
        if (Math.hypot(normals.getX(i), normals.getY(i), normals.getZ(i)) < .5) {
          normals.setXYZ(i, originalNormals.getX(i), originalNormals.getY(i), originalNormals.getZ(i));
        }
      }
      geometry.computeBoundingBox(); geometry.computeBoundingSphere();
      setGeometry(face, geometry, statistics); statistics.refinedFace = true;
    }
    for (const tooth of teeth) {
      const p = tooth.geometry.parameters;
      if (!p?.height) continue;
      const index = Number(tooth.name.split('_').at(-1)), h = p.height, r = p.radius;
      const canine = index === 1 || index === 6, incisor = index > 1 && index < 6;
      const bias = canine ? 1.14 : [.64, 1, .52, .47, .49, .55, 1, .67][index];
      const bend = (index < 4 ? 1 : -1) * r * .23;
      const geometry = sweep(T, [[0, -h * .5, 0], [bend, -h * .20, r * .08],
        [bend * 1.25, h * .20 * bias, r * .28], [bend * 1.4, h * (.5 * bias), r * .38]],
      [r * .82, r * (incisor ? 1.04 : .91), r * (incisor ? .90 : .55), r * (incisor ? .66 : canine ? .025 : .23)], 10, 10, incisor ? .46 : .72);
      // Keep named tooth pivots untouched, but place the crowns on a curved,
      // narrower dental arcade rather than a straight rectangular zipper.
      tooth.updateMatrix(); geometry.applyMatrix4(tooth.matrix);
      const position = geometry.attributes.position;
      for (let i = 0; i < position.count; i++) {
        const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
        position.setXYZ(i, x * .84, y, z - unit * (.015 + .072 * Math.pow(Math.abs(x) / (.295 * unit), 1.45)));
      }
      geometry.computeVertexNormals();
      setGeometry(tooth, geometry, statistics, true); tooth.material = materials.enamel;
      tooth.geometry.userData.dentalCrown = canine ? 'canine' : incisor ? 'incisor' : 'premolar';
      statistics.teeth++;
    }
    if (teeth.length) {
      // The original arcade locates its roots in jaw-local units. These two
      // existing rail meshes become continuous gum arches around those roots.
      for (const [side, y] of [[-1, 0], [1, .2]]) {
        const rail = jaw.getObjectByName(`mandibular_rail_${side}`);
        if (!rail) continue;
        const buriedY = y + (side < 0 ? -.055 : .035);
        const points = [[-.23, buriedY, -.13], [-.277, y, .06], [-.245, y, .145], [-.12, y, .235], [0, y + .006, .252],
          [.12, y, .235], [.245, y, .145], [.277, y, .06], [.23, buriedY, -.13]].map(point => point.map(value => value * unit));
        setGeometry(rail, sweep(T, points, [.0015 * unit, .013 * unit, .018 * unit, .018 * unit, .013 * unit, .0015 * unit], 24, 10, .72), statistics, true);
        rail.material = materials.gingiva;
      }
    }
    // Raycasts from the recorded native camera identify the two split, open,
    // five-sided legacy cheek paths as the angular lower blades and centre gap.
    // Replace that entire owned batch with ONE smooth continuous gingival arch.
    // It sits around the tooth roots and meets the chitin mandibular arch below;
    // there are no facing cut ends or a second row of detached cheek strips.
    for (const mesh of jaw.children.filter(object => object.isMesh && object.name === 'creature_anatomy_batch')) {
      const points = [[-.23, .022, -.125], [-.266, -.008, .035], [-.24, -.021, .145],
        [-.12, -.023, .235], [0, -.022, .253], [.12, -.023, .235],
        [.24, -.021, .145], [.266, -.008, .035], [.23, .022, -.125]];
      const geometry = sweep(T, points.map(point => point.map(value => value * unit)),
        [.0015 * unit, .018 * unit, .025 * unit, .025 * unit, .018 * unit, .0015 * unit], 32, 12, .82);
      geometry.userData.continuousGingivalArch = {rows:32, columns:12, cappedEnds:true, centreSeam:false};
      setGeometry(mesh, geometry, statistics, true);
      statistics.continuousGingiva = true;
    }
    const crown = jaw.getObjectByName('inner_jaw_crown');
    if (crown?.isMesh) {
      const pulp = new T.SphereGeometry(1, 20, 14); pulp.scale(.88, .54, .72); pulp.translate(0, 0, -.12);
      const pieces = [[pulp, 0]];
      for (const side of [-1, 1]) for (let digit = 0; digit < 3; digit++) {
        const x = (digit - 1) * .48, y = side * .29;
        const tooth = sweep(T, [[x, y, .22], [x * .98, y - side * .12, .50],
          [x * .94, y - side * .24, .54]], [.13, .10, .008], 8, 8, .72);
        pieces.push([tooth, 1]);
      }
      setGeometry(crown, joinedGeometry(T, pieces), statistics);
      crown.material = [materials.gingiva, materials.enamel];
      statistics.innerJaw = true;
    }
    const maxilla = root.getObjectByName('skull_maxilla_teeth');
    if (maxilla?.isMesh && !Array.isArray(maxilla.material)) {
      // The muted human-like dental remnant beneath the Drone vault must not
      // remain a solid rectangular block. Keep its original skull material so
      // the dedicated subdomal calibration cannot darken the external enamel.
      maxilla.geometry.computeBoundingBox();
      const size = maxilla.geometry.boundingBox.getSize(new T.Vector3());
      const pulp = new T.SphereGeometry(1, 16, 10);
      pulp.scale(size.x * .48, size.y * .25, size.z * .40); pulp.translate(0, size.y * .22, -size.z * .06);
      const pieces = [[pulp, 0]];
      for (let digit = 0; digit < 6; digit++) {
        const x = (digit - 2.5) / 6 * size.x * .94, length = size.y * [.67, .84, .73, .76, .80, .65][digit];
        const z = size.z * (.25 - Math.abs(digit - 2.5) * .035);
        pieces.push([sweep(T, [[x, size.y * .22, z], [x * 1.01, 0, z + size.z * .04],
          [x * 1.015, size.y * .22 - length, z + size.z * .11]],
        [size.x * .060, size.x * .048, size.x * .004], 7, 8, .75), 1]);
      }
      const original = maxilla.material;
      setGeometry(maxilla, joinedGeometry(T, pieces), statistics);
      maxilla.material = [materials.gingiva, original]; statistics.subdomalTeeth = 6;
    }
  }

  function refine(factory, root, metadata = {}) {
    if (!global.THREE || metadata.modelType !== 'adult' || root.userData.alienExtremities) return root;
    const T = global.THREE, oldMaterials = new Set();
    root.traverse(object => { for (const material of Array.isArray(object.material) ? object.material : [object.material]) if (material) oldMaterials.add(material); });
    const materials = {
      keratin: factory._material('bone', {color: 0x172019, roughness: .61, metalness: .035}),
      enamel: factory._material('bone', {color: 0xa4ab9c, roughness: .48, metalness: .13}),
      gingiva: factory._material('skin', {color: 0x111b14, roughness: .62, metalness: 0, clearcoat: .19}),
      oralCavity: factory._material('chitin', {color: 0x0a100c, roughness: 1, metalness: 0, clearcoat: 0, clearcoatRoughness: 1})
    };
    materials.keratin.userData.modernRegion = 'keratin';
    materials.enamel.userData.modernRegion = 'enamel';
    materials.gingiva.userData.modernRegion = 'gingiva';
    materials.oralCavity.userData.modernRegion = 'oral-cavity';
    const statistics = {version: 2, hands: 0, digits: 0, continuousDigits: 0, teeth: 0, innerJaw: false, oralCavity: false, subdomalTeeth: 0,
      replacedMeshes: 0, previousTriangles: 0, triangles: 0, addedMeshes: 0};
    refineHands(root, materials, T, statistics); refineMouth(root, materials, T, statistics);
    const kept = new Set(); root.traverse(object => {
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) if (material) kept.add(material);
    });
    for (const material of [...oldMaterials, ...Object.values(materials)]) if (!kept.has(material)) material.dispose();
    statistics.deltaTriangles = statistics.triangles - statistics.previousTriangles;
    root.userData.alienExtremities = statistics; return root;
  }
  global.HiveAlienExtremities = {refine};
})(typeof window === 'undefined' ? globalThis : window);
