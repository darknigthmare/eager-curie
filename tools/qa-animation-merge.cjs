#!/usr/bin/env node
'use strict';
// Real procedural factory + production pose helper. These deterministic Node
// transforms are not a rendered animation, mocap or cinema-fidelity review.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/game.js'), 'utf8');
global.THREE = require('../assets/vendor/three.r128.min.js');
for (const file of ['organic-sculpt.js', 'surface-detail.js', 'model-detail.js', 'models.js']) require('../src/' + file);
const T = global.THREE, factory = global.HiveModelFactory;
const start = source.indexOf('  function getAnimationModel');
const end = source.indexOf('  function setHudBar', start);
assert(start >= 0 && end > start, 'Production animation helper must exist');
let drips = 0, assetState = null;
const context = { window: { HiveSystems: { vfx: { salivaDrip() { drips++; } } } } };
vm.createContext(context);
vm.runInContext(source.slice(start, end) + '\nthis.animate = animateProceduralModel;', context);
const animate = context.animate;
let passed = 0;
function test(name, run) { run(); passed++; console.log('PASS ' + name); }
function fixture(create) {
  const model = create(), container = new T.Group(); container.position.set(23, 4, -31); container.add(model);
  return { model, container, dispose() { factory.disposeModel(model); } };
}
function pose(model) {
  const result = [];
  model.traverse(node => result.push([node.name, node.position.toArray(), node.quaternion.toArray(), node.scale.toArray(), node.visible]));
  return JSON.stringify(result);
}
test('Biped gait changes the authored limbs and repeated absolute phase is stable', () => {
  const f = fixture(() => factory.createHuman('marine'));
  const leg = f.model.userData.joints.leftLeg, rest = leg.quaternion.clone();
  animate(f.container, { phase: .7, movement: .8 });
  assert(!leg.quaternion.equals(rest)); const first = pose(f.model);
  for (let index = 0; index < 300; index++) animate(f.container, { phase: .7, movement: .8 });
  assert.equal(pose(f.model), first); f.dispose();
});
test('Runner and flat-array crusher use diagonal quadruped pairs', () => {
  for (const caste of ['runner', 'crusher']) {
    const f = fixture(() => factory.createAdult(caste));
    const rig = f.model.userData.animationRig, legs = Array.isArray(rig.joints) ? rig.joints : rig.joints.legs;
    const before = legs.map(leg => leg.rotation.x);
    animate(f.container, { phase: .4, movement: 1 });
    const delta = legs.map((leg, index) => leg.rotation.x - before[index]);
    assert(delta[0] > .3 && delta[3] > .3 && delta[1] < -.3 && delta[2] < -.3, caste);
    const first = pose(f.model); animate(f.container, { phase: .4, movement: 1 }); assert.equal(pose(f.model), first);
    f.dispose();
  }
});
test('Eight-legged parasite keeps all legs in its own gait instead of a four-leg gallop', () => {
  const f = fixture(() => factory.createFacehugger()), legs = f.model.userData.joints.legs;
  const before = legs.map(leg => leg.quaternion.clone()); animate(f.container, { phase: .4, movement: 1 });
  assert.equal(legs.length, 8); assert(legs.every((leg, index) => !leg.quaternion.equals(before[index]))); f.dispose();
});
test('Undeclared crusher tail restores its bind orientation without accumulating drift', () => {
  const f = fixture(() => factory.createAdult('crusher')), tail = f.model.getObjectByName('segmented_tail');
  animate(f.container, { phase: .9, movement: .5, attack: .4 }); const first = tail.quaternion.toArray();
  for (let index = 0; index < 300; index++) animate(f.container, { phase: .9, movement: .5, attack: .4 });
  assert.deepEqual(tail.quaternion.toArray(), first); f.dispose();
});
test('Traversal baseline keeps the stationary tail skin and blade in their bind shape', () => {
  const f = fixture(() => factory.createAdult('drone')), tail = f.model.getObjectByName('segmented_tail');
  const mesh = tail.children.find(child => child.isMesh), markers = tail.userData.vertebrae || [];
  const beforeMarkers = markers.map(node => node.quaternion.toArray()), blade = tail.getObjectByName('tail_blade');
  const bladeRotation = blade?.quaternion.clone(); animate(f.container, { phase: .2, movement: .5 });
  f.container.updateMatrixWorld(true); const first = new T.Box3().setFromObject(mesh).getCenter(new T.Vector3());
  animate(f.container, { phase: 1.1, movement: .5 }); f.container.updateMatrixWorld(true);
  const second = new T.Box3().setFromObject(mesh).getCenter(new T.Vector3()); assert(first.distanceTo(second) > .1);
  assert.deepEqual(markers.map(node => node.quaternion.toArray()), beforeMarkers);
  if (blade) assert(blade.quaternion.equals(bladeRotation)); f.dispose();
});
test('Ground flex articulates the continuous shell and retains blade attachment and bind shape', () => {
  for (const caste of ['drone', 'runner', 'crusher', 'warrior', 'queen']) {
    const f = fixture(() => factory.createAdult(caste));
    const tail = f.model.getObjectByName('segmented_tail'), rig = tail.userData.getTailRig();
    const joints = tail.userData.vertebrae;
    const position = rig.skin.geometry.getAttribute('position');
    const rest = position.array.slice(), indices = rig.skin.geometry.index.array;
    const bladeRest = rig.blade.getWorldPosition(new T.Vector3());
    const jointEnd = () => joints.at(-1).getWorldPosition(new T.Vector3());
    const bladeOffsetDistance = bladeRest.distanceTo(jointEnd());
    const lengths = joints.slice(1).map((joint, index) => joint.getWorldPosition(new T.Vector3())
      .distanceTo(joints[index].getWorldPosition(new T.Vector3())));
    assert(joints.every((joint, index) => joint.parent === (joints[index - 1] || tail)), caste);
    const state = { phase: 1.07, movement: .85, flexTail: true };
    animate(f.container, state);
    const first = position.array.slice();
    const maxShift = first.reduce((max, value, index) => Math.max(max, Math.abs(value - rest[index])), 0);
    assert(maxShift > .12 && maxShift < 1.8, `${caste} local skin flex ${maxShift}`);
    const cap = position.count - 2;
    assert.deepEqual([position.getX(cap), position.getY(cap), position.getZ(cap)], [0, 0, 0], caste);
    assert.equal(rig.skin.geometry.index.array, indices);
    const currentOffset = rig.blade.getWorldPosition(new T.Vector3()).distanceTo(jointEnd());
    assert(Math.abs(currentOffset - bladeOffsetDistance) < 1e-6, caste);
    joints.slice(1).forEach((joint, index) => {
      const current = joint.getWorldPosition(new T.Vector3()).distanceTo(joints[index].getWorldPosition(new T.Vector3()));
      assert(Math.abs(current - lengths[index]) < 1e-6, caste);
    });
    const normals = rig.skin.geometry.getAttribute('normal');
    for (let index = 0; index < normals.count; index++) {
      const magnitude = Math.hypot(normals.getX(index), normals.getY(index), normals.getZ(index));
      assert(Math.abs(magnitude - 1) < 1e-5, `${caste} normal ${index}: ${magnitude}`);
    }
    animate(f.container, { ...state, phase: 2.43 });
    assert.notDeepEqual(position.array, first, caste);
    for (let index = 0; index < 8; index++) animate(f.container, state);
    assert.deepEqual(position.array, first, caste);
    animate(f.container, { ...state, flexTail: false });
    assert.deepEqual(position.array, rest, caste);
    assert(rig.blade.position.equals(rig.bladePosition) && rig.blade.quaternion.equals(rig.bladeRotation), caste);
    f.dispose();
  }
});
test('Saliva cylinders bridge the real jaw extension along their authored Y axis', () => {
  const f = fixture(() => factory.createAdult('drone'));
  animate(f.container, { phase: .4, attack: .5 });
  const jaw = f.model.getObjectByName('pharyngeal_jaw_slider'), saliva = f.model.getObjectByName('inner_jaw_saliva_strands');
  const gap = jaw.position.z - jaw.userData.retractedZ; assert(gap > 0 && saliva.visible);
  assert.equal(saliva.children.length, 4);
  for (const strand of saliva.children) {
    assert(strand.visible); assert(Math.abs(strand.rotation.x - Math.PI / 2) < 1e-9);
    const geometryHeight = strand.geometry.parameters.height;
    assert(Math.abs(geometryHeight * strand.scale.y - gap) < 1e-8);
    assert(strand.scale.x < 1 && strand.scale.z < 1);
  }
  animate(f.container, { phase: .4, attack: 0 }); assert(!saliva.visible);
  assert.equal(jaw.position.z, jaw.userData.retractedZ); f.dispose();
});
test('Pure posing emits no duplicate saliva particle at model-local origin', () => {
  const f = fixture(() => factory.createAdult('drone')); drips = 0;
  for (let index = 0; index < 80; index++) animate(f.container, { phase: index * .1, attack: .5 });
  assert.equal(drips, 0); f.dispose();
});
test('Procedural posing leaves the actor world transform and ownership outside the helper', () => {
  const f = fixture(() => factory.createAdult('drone'));
  f.container.rotation.set(.3, .7, Math.PI); f.container.userData.owner = 'ceiling-action';
  const before = [f.container.position.toArray(), f.container.quaternion.toArray(), f.container.scale.toArray()];
  animate(f.container, { phase: .6, movement: .7, attack: .2, crouch: .1 });
  assert.deepEqual([f.container.position.toArray(), f.container.quaternion.toArray(), f.container.scale.toArray()], before);
  assert.equal(f.container.userData.owner, 'ceiling-action'); f.dispose();
});
test('Imported roots delegate state only, without directly advancing a mixer', () => {
  const container = new T.Group(), imported = new T.Group(); container.add(imported);
  context.window.HiveAssetLibrary = { handlesRoot: node => node === imported, setState(model, state) { assert.equal(model, imported); assetState = state; } };
  animate(container, { phase: .2, movement: .7, attack: .4 });
  assert.equal(assetState.movement, .7); assert.equal(assetState.frozen, false);
  delete context.window.HiveAssetLibrary;
});
console.log(`${passed} animation merge cases passed`);
