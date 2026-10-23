#!/usr/bin/env node
/* Regression checks for the actual cached organic lofts, not sphere fallbacks.
 * Run from any directory: node tools/qa-organic.cjs
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const THREE = require(path.join(__dirname, '../assets/vendor/three.r128.min.js'));
require(path.join(__dirname, '../src/organic-sculpt.js'));
const sculpt = global.HiveOrganicSculpt;
assert.ok(sculpt?.surface && sculpt?.limb, 'Actual organic sculpt module is required');

const surfaces = ['chest', 'pelvis', 'skull', 'warriorSkull', 'runnerSkull', 'egg', 'cocoon', 'petal', 'crawler', 'palm', 'shoulder', 'joint', 'knuckle'];
const limbs = ['upper', 'forearm', 'shin', 'digit'];
let triangles = 0;

function verify(name, geometry) {
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  const uv = geometry.attributes.uv;
  const uv2 = geometry.attributes.uv2;
  const layout = geometry.userData.organicLoft;
  assert.ok(layout && geometry.index, `${name}: authored indexed loft metadata missing`);
  for (const [key, attribute] of Object.entries({ position, normal, uv, uv2 })) {
    assert.ok(attribute, `${name}: ${key} missing`);
    assert.equal(attribute.count, position.count, `${name}: mismatched ${key} count`);
    assert.ok(attribute.array.every(Number.isFinite), `${name}: nonfinite ${key}`);
  }
  assert.deepEqual(Array.from(uv.array), Array.from(uv2.array), `${name}: AO unwrap differs from material unwrap`);
  for (let i = 0; i < normal.count; i++) {
    assert.ok(Math.abs(Math.hypot(normal.getX(i), normal.getY(i), normal.getZ(i)) - 1) < 2e-5, `${name}: nonunit normal ${i}`);
  }

  // UV seams duplicate vertices by design. Weld positions for the topological
  // test and require two opposite directed uses of every geometric edge.
  const ids = new Map(), welded = [];
  for (let i = 0; i < position.count; i++) {
    const key = [position.getX(i), position.getY(i), position.getZ(i)]
      .map(n => Math.round(n * 1e6)).join(',');
    if (!ids.has(key)) ids.set(key, ids.size);
    welded.push(ids.get(key));
  }
  const faces = geometry.index.array, edges = new Map();
  let volume = 0;
  for (let i = 0; i < faces.length; i += 3) {
    const a = faces[i], b = faces[i + 1], c = faces[i + 2];
    assert.equal(new Set([welded[a], welded[b], welded[c]]).size, 3, `${name}: collapsed triangle ${i / 3}`);
    volume += (position.getX(a) * (position.getY(b) * position.getZ(c) - position.getZ(b) * position.getY(c))
      - position.getY(a) * (position.getX(b) * position.getZ(c) - position.getZ(b) * position.getX(c))
      + position.getZ(a) * (position.getX(b) * position.getY(c) - position.getY(b) * position.getX(c))) / 6;
    for (const [from, to] of [[a, b], [b, c], [c, a]]) {
      const x = welded[from], y = welded[to], key = x < y ? `${x},${y}` : `${y},${x}`;
      const edge = edges.get(key) || { count: 0, direction: 0 };
      edge.count++; edge.direction += x < y ? 1 : -1;
      edges.set(key, edge);
    }
  }
  for (const [key, edge] of edges) {
    assert.equal(edge.count, 2, `${name}: open or nonmanifold edge ${key}`);
    assert.equal(edge.direction, 0, `${name}: inconsistent winding at ${key}`);
  }
  assert.ok(volume > 1e-4, `${name}: closed geometry must have positive outward volume`);
  const stride = layout.radial + 1;
  for (let row = 0; row <= layout.axial; row++) {
    const a = row * stride, b = a + layout.radial;
    assert.ok(Math.hypot(position.getX(a) - position.getX(b), position.getY(a) - position.getY(b), position.getZ(a) - position.getZ(b)) < 1e-8, `${name}: UV seam positions split`);
    assert.ok(Math.hypot(normal.getX(a) - normal.getX(b), normal.getY(a) - normal.getY(b), normal.getZ(a) - normal.getZ(b)) < 1e-7, `${name}: visible seam-normal split`);
  }
  triangles += faces.length / 3;
}

try {
  for (const kind of surfaces) {
    const geometry = sculpt.surface(THREE, kind);
    verify(kind, geometry);
    if (['skull', 'warriorSkull', 'runnerSkull'].includes(kind)) {
      const { axial, radial } = geometry.userData.organicLoft, stride = radial + 1;
      function ringRadius(row) {
        const center = new THREE.Vector3();
        for (let j = 0; j < radial; j++) center.add(new THREE.Vector3().fromBufferAttribute(geometry.attributes.position, row * stride + j));
        center.multiplyScalar(1 / radial);
        let radius = 0;
        for (let j = 0; j < radial; j++) radius = Math.max(radius, center.distanceTo(new THREE.Vector3().fromBufferAttribute(geometry.attributes.position, row * stride + j)));
        return radius;
      }
      const broad = ringRadius(Math.round(axial * .9)), tip = ringRadius(axial);
      assert.ok(tip / broad < .007, `${kind}: visible circular forehead closing puck`);
      assert.ok(ringRadius(axial - 3) < ringRadius(axial - 6), `${kind}: front vault fails to round toward its tip`);
    }
    geometry.dispose();
  }
  for (const kind of limbs) {
    const geometry = sculpt.limb(THREE, kind, .7);
    verify(kind, geometry); geometry.dispose();
  }

  const a = sculpt.surface(THREE, 'chest'), b = sculpt.surface(THREE, 'chest');
  const original = b.attributes.position.getX(0);
  assert.notStrictEqual(a.attributes.position.array, b.attributes.position.array, 'Cache clones share mutable position buffers');
  assert.notStrictEqual(a.index.array, b.index.array, 'Cache clones share mutable index buffers');
  a.attributes.position.setX(0, 1234); a.dispose();
  assert.equal(b.attributes.position.getX(0), original, 'Disposing/mutating one actor changes a sibling');
  const c = sculpt.surface(THREE, 'chest');
  assert.equal(c.attributes.position.getX(0), original, 'Actor mutation corrupts the cached template');
  const baseline = sculpt.diagnostics();
  for (let i = 0; i < 12; i++) { const clone = sculpt.surface(THREE, 'chest'); clone.dispose(); }
  assert.deepEqual(sculpt.diagnostics(), baseline, 'Repeated spawning grows the template cache');
  b.dispose(); c.dispose();

  const short = sculpt.limb(THREE, 'forearm', .7), long = sculpt.limb(THREE, 'forearm', .7);
  short.scale(.18, 1, .18); long.scale(.18, 2, .18);
  sculpt.fitUV(short); sculpt.fitUV(long);
  const end = short.userData.organicLoft.axial * (short.userData.organicLoft.radial + 1);
  assert.ok(long.attributes.uv.getY(end) > short.attributes.uv.getY(end) * 1.75, 'Axial UVs normalize away the actual bone length');
  assert.equal(short.attributes.uv.getX(short.userData.organicLoft.radial) % 1, 0, 'Circumference pigmentation seam is not an integral wrap');
  assert.deepEqual(Array.from(long.attributes.uv.array), Array.from(long.attributes.uv2.array), 'Rescaled material and AO unwrap diverge');
  short.dispose(); long.dispose();
  console.log(`PASS ${surfaces.length + limbs.length} authored templates: closed, outward, finite; seams, rounded skulls, independent cache clones and physical UVs verified (${triangles.toLocaleString('en-US')} triangles checked).`);
} catch (error) {
  console.error(`FAIL organic geometry: ${error.message}`);
  process.exitCode = 1;
}
