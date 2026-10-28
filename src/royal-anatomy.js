/* A closed, swept cranial fan replaces the royal plate-and-cone silhouette.
 * The ridges are relief in one shell, not detached ornaments. Each creature
 * owns its geometry/material and the shield follows the existing cranial pivot.
 */
(function exposeRoyalAnatomy(global) {
  'use strict';
  const templates = new Map();

  function angleWeightedNormals(T, geometry) {
    const p = geometry.attributes.position, index = geometry.index;
    const sums = new Float64Array(p.count * 3);
    const points = [new T.Vector3(), new T.Vector3(), new T.Vector3()];
    const a = new T.Vector3(), b = new T.Vector3(), normal = new T.Vector3(), cross = new T.Vector3();
    for (let face = 0; face < index.count; face += 3) {
      const ids = [index.getX(face), index.getX(face + 1), index.getX(face + 2)];
      for (let k = 0; k < 3; k++) points[k].fromBufferAttribute(p, ids[k]);
      normal.copy(points[1]).sub(points[0]).cross(b.copy(points[2]).sub(points[0])).normalize();
      for (let k = 0; k < 3; k++) {
        a.copy(points[(k + 1) % 3]).sub(points[k]); b.copy(points[(k + 2) % 3]).sub(points[k]);
        const angle = Math.atan2(cross.copy(a).cross(b).length(), a.dot(b)), offset = ids[k] * 3;
        sums[offset] += normal.x * angle; sums[offset + 1] += normal.y * angle; sums[offset + 2] += normal.z * angle;
      }
    }
    const normals = new Float32Array(sums.length);
    for (let i = 0; i < p.count; i++) {
      normal.fromArray(sums, i * 3).normalize(); normal.toArray(normals, i * 3);
    }
    geometry.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
  }

  function buildShield(T, queen) {
    const rows = queen ? 44 : 36, columns = queen ? 64 : 56;
    const stride = columns + 1, layerSize = (rows + 1) * stride;
    const positions = [], uvs = [], indices = [];
    const scale = queen ? 1 : .76;
    for (let layer = 0; layer < 2; layer++) {
      for (let row = 0; row <= rows; row++) {
        const t = row / rows, envelope = Math.pow(Math.sin(t * Math.PI), 1.1);
        const width = .39 + 1.39 * Math.sin(t * Math.PI * .62);
        for (let column = 0; column <= columns; column++) {
          const u = column / columns * 2 - 1, center = 1 - u * u;
          // Six swept buttresses radiate from the temporal root. Deep valleys,
          // a central sagittal keel and curled wings replace the thin leaf-like
          // sheet; all remain one closed shell with no floating horn primitives.
          const channelPhase=u*Math.PI*5.5+.30*Math.sin(t*2.8)*u;
          const channels=Math.pow(Math.max(0,Math.cos(channelPhase)),4);
          const keel=.23*Math.exp(-u*u/.026)*Math.pow(Math.sin(t*Math.PI*.9),1.3);
          const fluting=.18*channels*envelope*(1-.32*Math.abs(u));
          const valley=.055*Math.pow(Math.max(0,-Math.cos(channelPhase)),2)*envelope;
          const tailScallop=.105*Math.cos(u*Math.PI*5.5)*Math.pow(t,6);
          const thickness=.032+.12*envelope*(1-.58*u*u);
          const wingCurl=.26*Math.pow(Math.abs(u),3)*Math.sin(t*Math.PI*.88);
          const x = u * width;
          const y=.06+1.15*Math.sin(t*Math.PI*.55)+.18*t
            +.20*center*Math.sin(t*Math.PI)+tailScallop+wingCurl
            +(layer===0?thickness+fluting+keel-valley:-thickness-fluting*.32+keel*.45);
          const z = .50 - 2.65 * t - .35 * Math.pow(t, 4) * center
            + .17*u*u*Math.sin(t*Math.PI)-tailScallop-.08*channels*envelope;
          positions.push(x * scale, y * scale, z * scale);
          uvs.push(column / columns * 2.4, t * 2.2 + layer * 2.2);
          if (row < rows && column < columns) {
            const a = layer * layerSize + row * stride + column, b = a + stride;
            if (layer === 0) indices.push(a, a + 1, b, a + 1, b + 1, b);
            else indices.push(a, b, a + 1, a + 1, b, b + 1);
          }
        }
      }
    }
    // A single closed perimeter welds the upper and lower sheets by index.
    // Keeping a thin nonzero lip avoids degenerate triangles at the edge.
    const perimeter = [];
    for (let col = 0; col <= columns; col++) perimeter.push(col);
    for (let row = 1; row <= rows; row++) perimeter.push(row * stride + columns);
    for (let col = columns - 1; col >= 0; col--) perimeter.push(rows * stride + col);
    for (let row = rows - 1; row > 0; row--) perimeter.push(row * stride);
    for (let i = 0; i < perimeter.length; i++) {
      const a = perimeter[i], b = perimeter[(i + 1) % perimeter.length];
      indices.push(a, a + layerSize, b, b, a + layerSize, b + layerSize);
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute('uv2', geometry.attributes.uv.clone());
    geometry.setIndex(indices);
    // Angle weighting prevents the long thin edge faces from overwhelming a
    // small upper/underside corner and turning its smooth normal inside out.
    angleWeightedNormals(T, geometry);
    geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    geometry.userData.royalFan = { version: 2, caste: queen ? 'queen' : 'praetorian',
      topology: 'closed-indexed-swept-shield', rows, columns,
      ridges: 'radiating-buttresses-with-sagittal-keel', perimeter:'curled-scalloped-wings' };
    return geometry;
  }

  function ownedShield(T, queen) {
    const key = queen ? 'queen' : 'praetorian';
    if (!templates.has(key)) templates.set(key, buildShield(T, queen));
    return templates.get(key).clone();
  }

  function removeObsolete(root, branches) {
    const geometries = new Set(), materials = new Set();
    let meshes = 0, triangles = 0;
    for (const branch of branches) {
      branch.traverse(object => {
        if (!object.isMesh) return;
        meshes++; triangles += (object.geometry.index?.count || object.geometry.attributes.position.count) / 3;
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material])
          if (material) materials.add(material);
      });
      branch.parent?.remove(branch);
    }
    // Some old spikes share the teeth/body materials. Dispose only resources
    // that have no remaining user in this actor after removing the old crown.
    root.traverse(object => {
      if (object.geometry) geometries.delete(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material])
        if (material) materials.delete(material);
    });
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    return { meshes, triangles };
  }

  function refine(factory, root, metadata = {}) {
    const T = global.THREE;
    if (!T || !root || root.userData.royalAnatomy || metadata.modelType !== 'adult' ||
      !['queen', 'praetorian'].includes(metadata.caste)) return root;
    const head = root.getObjectByName('cranial_dome');
    if (!head?.isMesh) return root;
    const unit = head.position.y / 4.58;
    if (!(unit > 0 && Number.isFinite(unit))) return root;
    const queen = metadata.caste === 'queen', name = queen ? 'royal_crown_crest' : 'guardian_crest';
    const old = root.getObjectByName(name), branches = old ? [old] : [];
    root.traverse(object => {
      if (/^praetorian_(coronary_spike_\d+|jugular_plate_-?1)$/.test(object.name)) branches.push(object);
    });
    const removed = removeObsolete(root, branches);
    const crest = new T.Group(); crest.name = name;
    const geometry = ownedShield(T, queen);
    geometry.scale(unit, unit, unit);
    const material = factory._material('chitin', {color: queen ? 0x20272b : 0x252f2d,
      roughness: .53, metalness: .025, clearcoat: .22, clearcoatRoughness: .32,
      side: T.FrontSide, emissive: 0x000000, emissiveIntensity: 0});
    material.userData.modernRegion = 'royal-crest';
    const shield = factory._mesh(geometry, material, 'sculpted_crown_shield');
    shield.userData.royalAnatomy = true;
    crest.add(shield); crest.position.copy(head.position); root.add(crest);
    root.updateMatrixWorld(true);
    // Compensates the skull's non-uniform scale as well as the whole actor's
    // transform, preserving the authored bind silhouette and cranial animation.
    head.attach(crest);
    crest.userData.royalAnatomy = true;
    root.userData.royalAnatomy = {version: 2, caste: metadata.caste,
      shape: 'continuous-swept-cranial-fan', parent: head.name,
      meshes: 1, triangles: geometry.index.count / 3,
      removedMeshes: removed.meshes, removedTriangles: removed.triangles,
      closed: true, ridges:'radiating-buttresses-with-sagittal-keel', generated:'local-procedural'};
    return root;
  }

  global.HiveRoyalAnatomy = Object.freeze({refine, getDiagnostics: () => ({templates: templates.size})});
})(typeof window === 'undefined' ? globalThis : window);
