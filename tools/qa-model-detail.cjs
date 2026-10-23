/* Joint attachment, material ownership and batching regressions. No browser required. */
'use strict';
const assert = require('node:assert/strict');
global.THREE = require('../assets/vendor/three.r128.min.js');
require('../src/organic-sculpt.js');
require('../src/surface-detail.js');
require('../src/model-detail.js');
require('../src/models.js');
const T = global.THREE;
const factory = global.HiveModelFactory;
let passed = 0;
for (const type of ['civilian', 'scientist', 'guard', 'marine', 'smartgunner', 'incinerator', 'synthetic', 'commando']) {
  const root = factory.createHuman(type);
  assert(root.userData.hiveModelDetailApplied, `${type}: human detail applied`);
  if (['civilian','scientist'].includes(type)) assert(!root.getObjectByName('helmet_shell'), `${type}: distinct bare-head silhouette`);
  root.updateMatrixWorld(true);
  const size = new T.Box3().setFromObject(root).getSize(new T.Vector3());
  assert(size.x < 2.6, `${type}: shoulder cap transforms preserved (${size.x})`);
  const body = root.children.find(object => object.isMesh && object.material?.userData.hiveMaterialKind === 'fabric');
  assert(body, `${type}: continuous suit mesh retained`);
  const positions = body.geometry.attributes.position, normals = body.geometry.attributes.normal;
  const facing = [];
  for(let i=0;i<positions.count;i++) if(Math.abs(positions.getX(i))<.15 && positions.getY(i)>2.65 && positions.getY(i)<2.85 && positions.getZ(i)>.2) facing.push(normals.getZ(i));
  assert(facing.length && facing.reduce((a,b)=>a+b,0)/facing.length>.3, `${type}: torso surface normals face outward`);
  assert(root.userData.surfaceBatching.savedDrawCalls >= 5, `${type}: more details without extra per-detail draw calls`);
  for (const side of [-1, 1]) {
    const hand = root.getObjectByName(`hand_${side}`);
    const boot = root.getObjectByName(`boot_${side}`);
    assert.equal(hand.parent.name, `arm_${side < 0 ? 'left' : 'right'}`, `${type}: hand follows shoulder`);
    assert.equal(boot.parent.name, `leg_${side < 0 ? 'left' : 'right'}`, `${type}: foot follows hip`);
    root.updateMatrixWorld(true);
    const before = hand.getWorldPosition(new T.Vector3());
    hand.parent.rotation.x += 0.4;
    root.updateMatrixWorld(true);
    assert(before.distanceTo(hand.getWorldPosition(new T.Vector3())) > 0.2, `${type}: hand moves with animated sleeve`);
  }
  assert.equal(root.getObjectByName('head').parent.name, 'helmet_and_comms', `${type}: skin and helmet move together`);
  const detailKinds = new Set();
  let hairTexture = null, hairTextureDisposed = false;
  root.traverse(object => {
    if (!object.material || Array.isArray(object.material)) return;
    const kind = object.material.userData.hiveMaterialKind;
    detailKinds.add(kind);
    if (kind === 'hair') hairTexture = object.material.map;
  });
  for (const kind of ['eye','iris','pupil','lip','hair']) assert(detailKinds.has(kind), `${type}: authored ${kind} surface present`);
  assert(hairTexture?.isDataTexture, `${type}: groomed hair fibres owned by model material`);
  hairTexture.addEventListener('dispose', () => { hairTextureDisposed = true; });
  const shoe = root.getObjectByName('boot_1'), shoePositions = shoe.geometry.attributes.position, shoeNormals = shoe.geometry.attributes.normal;
  const uppers = [];
  for(let i=0;i<shoePositions.count;i++) if(shoePositions.getY(i)>.4) uppers.push(shoeNormals.getY(i));
  assert(uppers.length && uppers.reduce((a,b)=>a+b,0)/uppers.length>.2, `${type}: curved shoe upper faces outward`);
  let meshCount = 0;
  root.traverse(object => {
    if (!object.isMesh) return;
    meshCount++;
    assert(object.geometry.attributes.uv2, `${type}: AO UV coordinates present`);
    for (const value of object.geometry.attributes.position.array) assert(Number.isFinite(value), `${type}: finite vertices`);
  });
  assert(meshCount < 40, `${type}: bounded draw-call budget (${meshCount})`);
  factory.disposeModel(root);
  assert(hairTextureDisposed, `${type}: hair fibre texture released with model`);
  assert.equal(factory._managedMaterials.size, 0, `${type}: material ownership restored`);
  console.log(`PASS human ${type}: ${meshCount} mesh calls`);
  passed++;
}
{
  const root = factory.createHuman('powerloader');
  assert(!root.userData.hiveModelDetailApplied, 'Exosuit pilot is not mistaken for a full-size free-standing human');
  factory.disposeModel(root);
  assert.equal(factory._managedMaterials.size, 0);
  console.log('PASS exosuit retains its own anatomy and pilot');
  passed++;
}
for (const type of ['crate', 'console', 'generator', 'vent', 'pipe', 'barrel', 'lamp', 'door']) {
  const root = factory.createIndustrialProp(type);
  assert(root.userData.hiveModelDetailApplied, `${type}: prop detail applied`);
  let meshCount = 0;
  root.traverse(object => {
    if (!object.isMesh) return;
    meshCount++;
    for (const value of object.geometry.attributes.position.array) assert(Number.isFinite(value));
  });
  assert(meshCount <= 5, `${type}: repeated controls and screws batched (${meshCount})`);
  factory.disposeModel(root);
  assert.equal(factory._managedMaterials.size, 0, `${type}: no material leaks`);
  console.log(`PASS prop ${type}: ${meshCount} mesh calls`);
  passed++;
}
{
  const root = new T.Group();
  const material = new T.MeshStandardMaterial();
  for (let i = 0; i < 3; i++) {
    const mesh = new T.Mesh(new T.BoxGeometry(), material);
    mesh.name = i === 0 ? 'protected_joint' : `panel_${i}`;
    mesh.position.x = i;
    root.add(mesh);
  }
  root.userData.animationJoints = { arm: 'protected_joint' };
  const instanced = new T.InstancedMesh(new T.BoxGeometry(), material, 2);
  instanced.setMatrixAt(0, new T.Matrix4().makeTranslation(10, 0, 0));
  root.add(instanced);
  const result = HiveModelDetail.mergeStatic(root);
  assert(root.getObjectByName('protected_joint'), 'Animation mesh preserved');
  assert(root.children.includes(instanced), 'Instanced matrices preserved');
  assert.equal(result.savedDrawCalls, 1, 'Two compatible panels become one draw');
  factory.disposeModel(root);
  console.log('PASS batching preserves animation mesh and instancing');
  passed++;
}
console.log(`${passed} detail cases passed`);
