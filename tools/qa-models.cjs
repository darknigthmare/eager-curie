/* Geometry and ownership regressions; Node uses the same vendored Three as the browser. */
'use strict';
const assert = require('node:assert/strict');
global.THREE = require('../assets/vendor/three.r128.min.js');
require('../src/models.js');
const factory = global.HiveModelFactory;
const cases = [
  ['egg sealed', () => factory.createEgg(false)],
  ['egg open', () => factory.createEgg(true)],
  ['facehugger', () => factory.createFacehugger()],
  ['juvenile', () => factory.createChestburster(false)],
  ['cocoon', () => factory.createChestburster(true)],
  ...['drone', 'runner', 'worker', 'warrior', 'spitter', 'praetorian', 'queen'].map(c => [`adult ${c}`, () => factory.createAdult(c)]),
  ...['civilian', 'scientist', 'guard', 'marine', 'smartgunner', 'incinerator', 'commando', 'synthetic', 'labhound', 'labrodent', 'powerloader'].map(t => [`human ${t}`, () => factory.createHuman(t)]),
  ...['crate', 'console', 'generator', 'vent', 'pipe', 'barrel', 'lamp', 'door'].map(t => [`prop ${t}`, () => factory.createIndustrialProp(t)])
];
for (const [name, create] of cases) {
  const before = factory._managedMaterials.size;
  const model = create();
  let meshes = 0;
  model.traverse(object => {
    if (!object.isMesh) return;
    meshes++;
    assert(object.material, `${name}: material exists`);
    const positions = object.geometry.attributes.position.array;
    assert(positions.length > 0, `${name}: nonempty geometry`);
    for (const coordinate of positions) assert(Number.isFinite(coordinate), `${name}: finite coordinates`);
  });
  assert(meshes > 0, `${name}: meshes created`);
  factory.disposeModel(model);
  assert.equal(factory._managedMaterials.size, before, `${name}: all owned materials disposed`);
  console.log(`PASS ${name}`);
}
console.log(`${cases.length} model cases passed`);
