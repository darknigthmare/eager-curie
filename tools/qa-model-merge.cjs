#!/usr/bin/env node
'use strict';
// Geometry checks for the bf6c127 merge. These are station-unit envelopes,
// not measurements of film props or a one-unit-per-metre certification.
const assert = require('node:assert/strict');
global.THREE = require('../assets/vendor/three.r128.min.js');
for (const name of ['organic-sculpt', 'surface-detail', 'model-detail', 'models']) require('../src/' + name + '.js');
const T = global.THREE, factory = global.HiveModelFactory;
const rows = [];
function check(name, create, inspect) {
  const before = factory._managedMaterials.size;
  const model = create();
  try {
    model.updateMatrixWorld(true);
    const bounds = new T.Box3().setFromObject(model), size = bounds.getSize(new T.Vector3());
    assert(size.toArray().every(Number.isFinite));
    inspect(model, size, bounds);
    rows.push({ name, size: size.toArray() });
    console.log('PASS ' + name);
  } finally {
    factory.disposeModel(model);
    assert.equal(factory._managedMaterials.size, before, name + ': material ownership restored');
  }
}
check('Human reference has not been silently converted to metres', () => factory.createHuman('scientist'), (model, size) => {
  assert.equal(model.userData.height, 4.25);
  assert(size.y > 4.2 && size.y < 4.4);
});
check('Powerloader still encloses a human-sized pilot', () => factory.createHuman('powerloader'), (model, size) => {
  assert(size.y > 5.8 && size.y < 6.1);
  assert(model.getObjectByName('loader_assembly'));
});
check('Facehugger preserves its measured face-scale envelope', () => factory.createFacehugger(), (model, size) => {
  assert.equal(model.getObjectByName('crawler_scaled_assembly').scale.x, .4);
  assert(size.x > 1.6 && size.x < 1.7 && size.y > .32 && size.y < .35);
  assert.equal(model.userData.height, .33);
});
check('Birth rig is scaled once, not twice', () => factory.createChestburster(false), (model) => {
  model.scale.setScalar(.5);
  model.updateMatrixWorld(true);
  const size = new T.Box3().setFromObject(model).getSize(new T.Vector3());
  assert(size.x > 1.1 && size.x < 1.2 && size.y > .6 && size.y < .7 && size.z > 3.1 && size.z < 3.3);
});
check('Drone remains larger than the unchanged human reference', () => factory.createAdult('drone'), (model, size) => {
  assert(size.y > 5.1 && size.y < 5.4);
  assert(model.getObjectByName('inner_jaw_saliva_strands'));
  const saliva = model.getObjectByName('inner_jaw_saliva_strands');
  assert.equal(saliva.children.length, 4);
  assert(saliva.children.every(strand => strand.isMesh && !strand.visible));
});
check('Royal retains its station-unit hierarchy', () => factory.createAdult('queen'), (model, size) => {
  assert(size.y > 7.4 && size.y < 7.7);
});
check('Runner retains incoming authored bronze under the existing PBR finish', () => factory.createAdult('runner'), (model, size) => {
  assert(size.y > 2.4 && size.y < 2.7);
  assert.equal(model.getObjectByName('runner_assembly').scale.x, 1);
  const colors = new Set();
  model.traverse(object => {
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) if (material?.color) {
      // The existing finishing layer intentionally neutralises an albedo tint.
      // Check the authored colour with that layer disabled, then restore it.
      global.HiveSurfaceDetail.setEnabled(material, false);
      colors.add(material.color.getHex());
      global.HiveSurfaceDetail.setEnabled(material, true);
    }
  });
  assert(colors.has(0xa16207), 'Incoming bronze survives static material batching');
});
check('Crusher retains its heavy authored collision envelope', () => factory.createAdult('crusher'), (model, size) => {
  assert(size.y > 5.4 && size.y < 5.7);
});
check('Revised APC geometry fits its existing station footprint', () => factory.createM577APC(), (model, size, bounds) => {
  assert(model.getObjectByName('apc_station_assembly'));
  const targetSize = [3.9200000762939453, 2.3749999761581417, 6.921311855316162];
  const targetMin = [-1.9600000381469727, 0, -3.200000047683716];
  // The industrial detail pass bevels/batches the glacis. Its final outer
  // surface may recede slightly but must never exceed the reserved envelope.
  size.toArray().forEach((value, index) => assert(value <= targetSize[index] + 1e-5 && value >= targetSize[index] * .99));
  bounds.min.toArray().forEach((value, index) => assert(Math.abs(value - targetMin[index]) < 1e-5));
});
console.log(JSON.stringify({ scope: 'Measured factory models, not native or cinema QA', rows }));
console.log(rows.length + ' model merge cases passed');
