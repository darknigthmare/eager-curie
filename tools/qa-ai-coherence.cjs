#!/usr/bin/env node
'use strict';
// Real production classes, prepared colliders/actors and observable audio/render
// sinks. Fixed simulation steps are not a human or rendered-campaign test.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'),
  assert = require('node:assert/strict'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '..'), argv = process.argv.slice(2);
const source = argv.includes('--source') && argv[argv.indexOf('--source') + 1] === '-'
  ? fs.readFileSync(0, 'utf8') : fs.readFileSync(path.join(root, 'src/game.js'), 'utf8');
const classSource = (start, end) => {
  const a = source.indexOf(start), b = source.indexOf(end, a);
  assert(a > 0 && b > a, 'Production class boundaries missing: ' + start);
  return source.slice(a, b);
};
const humanSource = classSource('  class HumanAI {', '  class HiveUnit {');
const mapSource = classSource('  class StationMap {', '  const stationMap = new StationMap();');
const systemsSource = fs.readFileSync(path.join(root, 'src/game-systems.js'), 'utf8');
const vfxSource = systemsSource.slice(systemsSource.indexOf('  class VFXManager {'), systemsSource.indexOf('  class CampaignUI {'));
const projectileProfiles = [
  { type: 'smartgunner', damage: 7.2, speed: 38, vertical: 1.42 },
  { type: 'weyland_plasma_gunner', damage: 20, stagger: 1.2, speed: 32, vertical: 1.5 },
  { type: 'weyland_steel_team_synth', damage: 28, speed: 42, vertical: 1.5 },
  { type: 'uscm_sniper', damage: 42, speed: 65, vertical: 1.5 },
  { type: 'uscm_sadar_operator', damage: 65, speed: 30, vertical: 1.5 },
  { type: 'marine', phosphorus: true, speed: 20, vertical: 2.5 },
  { type: 'guard', damage: 8, speed: 34, vertical: 1.42 }
];
function fixture({ type = 'guard', stage = 4, x = 0, z = 0, px = 0, pz = 20, wall = null } = {}) {
  const audio = [], render = [], animations = [], effects = [], damage = [], paths = [];
  const sink = calls => new Proxy({}, { get: (_, method) => (...args) => calls.push({ method: String(method), args }) });
  const p = { x: px, z: pz, form: 'drone', adultCaste: 'drone', mesh: { visible: true },
    health: 235, takeDamage: amount => damage.push(amount) };
  const game = { currentStageIndex: stage, currentStage: {}, humans: [], getDifficultyDamageModifier: () => 1 };
  const math = Object.create(Math); math.random = () => .99;
  const context = { Math: math, Date, console, performance: { now: () => 1000 },
    playerCreature: p, audioManager: sink(audio), rendererEngine: Object.assign(sink(render), { powerSabotagedTimer: 0 }),
    resinGrid: { getResin: () => 0 }, animateProceduralModel: (_mesh, state) => animations.push(state),
    showToast() {}, appendSensorLog() {}, window: { gameInstance: game,
      HiveSystems: { vfx: Object.assign(sink(effects), { effects: [] }) }, alarmSystem: { level: 0 } } };
  // Keep the two stateful scalar properties out of Proxy get sinks.
  context.rendererEngine = { powerSabotagedTimer: 0, addScreenShake() {}, addStrobeFlash() {}, triggerCameraFovPunch() {} };
  context.window.HiveSystems.vfx = { effects: [], burst() {}, floatingText() {}, beam() {}, muzzleFlash() {}, ring() {} };
  const MapClass = vm.runInNewContext('(' + mapSource.trim() + ')', context);
  const map = new MapClass(); context.stationMap = map;
  if (wall) map.colliders.push(wall);
  const findPath = map.findPath;
  map.findPath = function (...args) { paths.push(args); return findPath.apply(this, args); };
  const Human = vm.runInNewContext('(' + humanSource.trim() + ')', context);
  const actor = new Human(1, type, x, z);
  actor.mesh = { rotation: { x: 0, y: 0, z: 0, set(ax, ay, az) { this.x = ax; this.y = ay; this.z = az; } }, position: { x, y: 0, z,
    set(ax, ay, az) { this.x = ax; this.y = ay; this.z = az; } }, traverse() {} };
  actor.flashlight = { intensity: 0 }; actor.motionPingCooldown = 999; actor.grenadeCooldown = 999;
  game.humans = [actor];
  const step = seconds => { for (let t = 0; t < seconds - 1e-8; t += 1 / 60) actor.update(Math.min(1 / 60, seconds - t)); };
  return { actor, Human, MapClass, map, p, game, context, audio, damage, paths, animations, step };
}
const results = [];
function check(name, run) {
  try { const detail = run(); results.push({ name, passed: true, detail }); console.log('PASS ' + name); }
  catch (error) { results.push({ name, passed: false, error: error.stack || String(error) }); console.error('FAIL ' + name + ': ' + error.message); }
}
const wall = { minX: -1, maxX: 1, minZ: -5, maxZ: 5 };
check('Both Taser guard profiles pursue to baton range without firing a pulse rifle', () => {
  for (const type of ['weyland_security_taser', 'taser_guard']) {
    const f = fixture({ type, pz: 8 });
    assert.equal(f.actor.canEngageHostiles(), true);
    f.step(1 / 60);
    assert(f.actor.navigationGoal && f.actor.navigationGoal.z === 8);
    assert.equal(f.damage.length, 0);
    assert.equal(f.actor.pendingProjectiles.length, 0);
    for (let frame = 0; frame < 180 && f.damage.length === 0; frame++) f.step(1 / 60);
    assert.deepEqual(f.damage, [18]);
    assert(Math.hypot(f.actor.x - f.p.x, f.actor.z - f.p.z) <= 3);
    assert.equal(f.p.staggerTimer, 1.8);
    assert(f.audio.some(event => event.method === 'playStunBatonZap'));
    assert(!f.audio.some(event => event.method === 'playM41APulseBurst'));
  }
});
check('A real AABB wall prevents first acquisition and radio sight reports', () => {
  const f = fixture({ x: -8, px: 8, pz: 0, wall }); f.actor.mesh.rotation.y = Math.PI / 2;
  assert.equal(f.map.hasLineOfSight(-8, 0, 8, 0), false); f.step(.1);
  assert.equal(f.actor.aiState, 'PATROL'); assert.equal(f.actor.lastKnownThreat, null);
  assert(!f.audio.some(call => /RadioSquelch|RadioStatic/.test(call.method))); assert.equal(f.damage.length, 0);
});
check('A civilian cannot panic at a player across the same actual wall', () => {
  const f = fixture({ type: 'scientist', x: -8, px: 8, pz: 0, wall });
  f.actor.mesh.rotation.y = Math.PI / 2; f.step(.2);
  assert.equal(f.actor.aiState, 'PATROL'); assert.equal(f.actor.stress, 0);
});
check('Daylight vision is frontal beyond close proximity, not 360 degrees', () => {
  const f = fixture({ pz: -12 }); f.actor.mesh.rotation.y = 0; f.step(.1);
  assert.equal(f.actor.aiState, 'PATROL'); assert.equal(f.actor.lastKnownThreat, null);
  f.actor.mesh.rotation.y = Math.PI; f.step(.02); assert.equal(f.actor.aiState, 'ATTACK');
});
check('Close-range awareness still needs line of sight', () => {
  const f = fixture({ px: -2, pz: 0 }); assert.equal(f.actor.canObserveThreat(f.p), true);
  f.map.colliders.push({ minX: -1.2, maxX: -.8, minZ: -2, maxZ: 2 });
  assert.equal(f.actor.canObserveThreat(f.p), false);
});
check('Darkness narrows the cone without granting vision through cover', () => {
  const f = fixture({ px: 9, pz: 5 }); assert.equal(f.actor.canObserveThreat(f.p), true);
  f.context.rendererEngine.powerSabotagedTimer = 10; assert.equal(f.actor.canObserveThreat(f.p), false);
  f.p.x = 0; f.p.z = 10; assert.equal(f.actor.canObserveThreat(f.p), true);
  f.map.colliders.push({ minX: -2, maxX: 2, minZ: 4, maxZ: 6 }); assert.equal(f.actor.canObserveThreat(f.p), false);
});
check('Observed distant threat starts an actual A-star pursuit', () => {
  const f = fixture(); f.actor.update(1 / 60);
  assert.equal(f.actor.aiState, 'CHASE'); assert.equal(f.paths.length, 1);
  assert(f.actor.pathWaypoints.length > 0); assert.equal(f.actor.navigationGoal.z, 20);
  assert.equal(f.actor.lastKnownThreat.source, 'visual');
});
check('Occlusion freezes knowledge at the last observed position', () => {
  const f = fixture(); f.actor.update(1 / 60); const known = { x: f.actor.lastKnownThreat.x, z: f.actor.lastKnownThreat.z };
  f.map.colliders.push({ minX: -72, maxX: 72, minZ: 7, maxZ: 9 }); f.p.x = 12; f.p.z = 22;
  f.step(.3); assert.equal(f.actor.aiState, 'SEARCH');
  assert.equal(f.actor.lastKnownThreat.x, known.x); assert.equal(f.actor.lastKnownThreat.z, known.z);
  assert.equal(f.actor.navigationGoal.x, known.x); assert.equal(f.actor.navigationGoal.z, known.z);
  assert.equal(f.damage.length, 0);
});
check('Four simulation seconds without an observation expire the search', () => {
  const f = fixture(); f.actor.update(1 / 60);
  f.map.colliders.push({ minX: -72, maxX: 72, minZ: 7, maxZ: 9 }); f.p.x = 12; f.p.z = 22;
  f.step(4.2); assert.equal(f.actor.lastKnownThreat, null); assert.equal(f.actor.aiState, 'PATROL');
});
check('Pursuit replans moving observations at a bounded cadence', () => {
  const f = fixture();
  for (let frame = 0; frame < 120; frame++) { f.p.x = frame / 60; f.actor.update(1 / 60); }
  assert(f.paths.length >= 2 && f.paths.length <= 3, 'Unexpected A-star calls: ' + f.paths.length);
  return { simulationSeconds: 2, plans: f.paths.length };
});
check('Remembered coordinates route around an actual wall and never collide', () => {
  const f = fixture({ x: -8, px: 8, pz: 0, wall });
  f.actor.receiveThreatReport(8, 0, f.p); assert.equal(f.actor.aiState, 'SEARCH');
  assert(f.actor.pathWaypoints.length >= 2, 'Wall requires a non-direct path');
  const samples = [];
  for (let frame = 0; frame < 210; frame++) {
    f.actor.update(1 / 60); samples.push([f.actor.x, f.actor.z]);
    assert.equal(f.map.checkCollision(f.actor.x, f.actor.z), false);
  }
  assert(samples.some(([, z]) => Math.abs(z) > 5), 'Pursuit did not actually go around the wall');
  return { samples: samples.length, final: samples.at(-1) };
});
check('Radio copies a point once, never a live moving target coordinate', () => {
  const f = fixture({ wall, x: -8, px: 8, pz: 0 });
  assert.equal(f.actor.receiveThreatReport(8, 0, f.p), true);
  f.p.x = 18; f.p.z = 3; f.actor.update(1 / 60);
  assert.equal(f.actor.lastKnownThreat.x, 8); assert.equal(f.actor.lastKnownThreat.z, 0);
  assert.equal(f.actor.aiState, 'SEARCH');
});
check('Allied radio reports require a genuine visual observer', () => {
  const f = fixture({ px: 0, pz: 15 });
  const ally = new f.Human(2, 'marine', 5, -8); ally.mesh = { rotation: { y: Math.PI }, position: { set() {} } };
  f.game.humans.push(ally); f.actor.update(1 / 60);
  assert.equal(ally.lastKnownThreat?.source, 'radio'); assert.equal(ally.lastKnownThreat.z, 15);
  assert.equal(ally.aiState, 'SEARCH');
});
check('A hostile faction does not receive the observer radio report', () => {
  const f = fixture({ px: 0, pz: 15 });
  const hostile = new f.Human(2, 'weyland_combat_android', 5, -8); hostile.mesh = { rotation: { y: Math.PI }, position: { set() {} } };
  assert.equal(f.actor.isFactionHostile(hostile), false); assert.equal(hostile.isFactionHostile(f.actor), true);
  f.game.humans.push(hostile); f.actor.update(1 / 60); assert.equal(hostile.lastKnownThreat, null);
});
check('Attack distance hysteresis does not oscillate on a small range change', () => {
  const f = fixture({ pz: 11.9 }); f.actor.update(1 / 60); assert.equal(f.actor.aiState, 'ATTACK');
  f.p.z = 12.3; f.actor.update(1 / 60); assert.equal(f.actor.aiState, 'ATTACK');
  f.p.z = 14; f.actor.update(1 / 60); assert.equal(f.actor.aiState, 'CHASE'); assert(f.actor.navigationGoal);
});
check('Powerloaders and cyber-hounds still approach to their authored melee distance', () => {
  for (const type of ['powerloader', 'weyland_cyber_hound']) {
    const f = fixture({ type, pz: 10 }); const initial = Math.hypot(f.p.x - f.actor.x, f.p.z - f.actor.z);
    f.step(.4); assert(f.actor.navigationGoal); assert(f.paths.length > 0);
    assert(Math.hypot(f.p.x - f.actor.x, f.p.z - f.actor.z) < initial - .5, type + ' failed to approach');
  }
});
check('Wounded ranged actors keep their routed retreat between replans', () => {
  const f = fixture({ pz: 6 }); f.actor.hp = f.actor.maxHp * .3;
  f.step(.25); assert.equal(f.actor.aiState, 'REPOSITION'); assert(f.actor.z < -1);
  assert(f.paths.length <= 2, 'Retreat recomputed every tick');
});
check('An actor holding attack position does not play locomotion while stationary', () => {
  const f = fixture({ pz: 10 }); f.actor.shootCooldown = 999;
  const initial = [f.actor.x, f.actor.z]; f.step(.2);
  assert.deepEqual([f.actor.x, f.actor.z], initial); assert(f.animations.length > 0);
  assert(f.animations.every(state => state.movement === 0));
});
check('Unreachable search points wait and replan instead of steering through a wall', () => {
  const f = fixture({ x: -8, px: 8, pz: 0, wall: { minX: -1, maxX: 1, minZ: -74, maxZ: 74 } });
  f.actor.receiveThreatReport(8, 0, f.p); const initial = [f.actor.x, f.actor.z];
  assert.equal(f.actor.navigationBlocked, true); f.step(1);
  assert.deepEqual([f.actor.x, f.actor.z], initial); assert(f.paths.length <= 2);
});
check('The biological lure retains its existing A-star priority', () => {
  const f = fixture({ stage: 1, x: -8, px: 8, pz: 0, wall });
  f.actor.lureTowards(8, 0); assert.equal(f.actor.isLured, true); assert(f.actor.pathWaypoints.length >= 2);
  f.step(.4); assert.equal(f.actor.aiState, 'LURED'); assert.equal(f.actor.lastKnownThreat, null);
  assert(!f.map.checkCollision(f.actor.x, f.actor.z));
});
check('A closed egg and an internal embryo do not trigger predator pursuit', () => {
  for (const stage of [1, 3]) {
    const f = fixture({ stage, pz: 10 }); f.game.currentStage.step = 'GESTATION'; f.step(.1);
    assert.equal(f.actor.aiState, 'PATROL'); assert.equal(f.actor.lastKnownThreat, null);
  }
});
check('The exposed cocoon emergence remains detectable, unlike internal gestation', () => {
  const f = fixture({ stage: 3, pz: 10 }); f.game.currentStage.step = 'EMERGING';
  f.actor.update(1 / 60); assert.equal(f.actor.aiState, 'ATTACK'); assert(f.actor.lastKnownThreat);
});
check('Vent and ceiling concealment cancel fresh visual acquisition', () => {
  for (const property of ['isInVent', 'isCeilingProwling']) {
    const f = fixture({ pz: 10 }); f.p[property] = true; f.step(.1);
    assert.equal(f.actor.aiState, 'PATROL'); assert.equal(f.actor.lastKnownThreat, null);
  }
});
check('Host recovery leaves its pose and navigation exclusively to the cycle', () => {
  const f = fixture({ pz: 10 }); f.actor.isRecoveringFromFacehugger = true; f.actor.isRestrained = true;
  f.actor.mesh.rotation.x = .7; f.step(.1);
  assert.equal(f.actor.mesh.rotation.x, .7); assert.equal(f.animations.length, 0);
  assert.equal(f.actor.aiState, 'PATROL'); assert.equal(f.actor.lastKnownThreat, null);
});
check('T140 owns the restrained living victim root and rig without a second AI update', () => {
  const f = fixture({ pz: 10 }); f.actor.ceilingActionOwner = { phase: 'HOIST' }; f.actor.isRestrained = true;
  f.actor.mesh.position.y = 5; f.actor.mesh.rotation.z = 1.2; const before = [f.actor.x, f.actor.z];
  f.step(.2); assert.equal(f.actor.mesh.position.y, 5); assert.equal(f.actor.mesh.rotation.z, 1.2);
  assert.deepEqual([f.actor.x, f.actor.z], before); assert.equal(f.animations.length, 0); assert.equal(f.actor.lastKnownThreat, null);
});
check('T140 owns a dead synthetic before the bionic-crawl branch can rotate it', () => {
  for (const owner of ['ceilingActionOwner', 'transportOwner', 'disposalOwner']) {
    const f = fixture({ type: 'android', pz: 1 }); f.actor[owner] = { phase: 'HOLD' };
    f.actor.isIncapacitated = true; f.actor.isBionicCrawl = true; f.actor.bionicCrawlTimer = 12;
    f.actor.mesh.position.y = 7; f.actor.mesh.rotation.z = Math.PI; f.step(.2);
    assert.equal(f.actor.mesh.position.y, 7); assert.equal(f.actor.mesh.rotation.z, Math.PI);
    assert.equal(f.actor.bionicCrawlTimer, 12); assert.equal(f.animations.length, 0); assert.equal(f.damage.length, 0);
  }
});
check('A current resin ceiling anchor owns the actor, while a stale anchor disposes before normal AI', () => {
  const f = fixture({ pz: 10 }); let disposed = 0;
  f.actor.ceilingAnchor = { isCurrent: () => true, dispose: () => disposed++ };
  f.actor.mesh.position.y = 6; f.step(.1); assert.equal(f.actor.mesh.position.y, 6);
  assert.equal(f.animations.length, 0); assert.equal(disposed, 0);
  f.actor.ceilingAnchor = { isCurrent: () => false, dispose() { disposed++; delete f.actor.ceilingAnchor; } };
  f.actor.isDocileCatatonic = true; f.actor.catatonicTimer = 1; f.actor.update(1 / 60);
  assert.equal(disposed, 1); assert.equal(f.actor.ceilingAnchor, undefined);
});
check('Ordinary imported human advances its real-runtime owner route once per simulation tick', () => {
  const f = fixture(), model = { name: 'Explicit imported-root fixture' }, calls = [], runtime = { disposed: false };
  let traversals = 0; f.actor.mesh.traverse = visit => { traversals++; visit(f.actor.mesh); visit(model); };
  f.context.window.HiveAssetLibrary = { getRuntime: root => root === model ? runtime : null,
    updateModel(root, delta) { calls.push({ root, delta }); } };
  f.step(.1); assert.equal(calls.length, 6); assert.equal(traversals, 1);
  assert(calls.every(call => call.root === model && Math.abs(call.delta - 1 / 60) < 1e-8));
  return { fixture: 'Real HumanAI owner selection/finally; explicit runtime/animation sink, not native rig quality', ticks: 6, calls: calls.length, traversals };
});
check('Imported animation cannot double-tick recovery ceiling ownership or paused actors', () => {
  const f = fixture(), model = {}, calls = [], runtime = { disposed: false };
  f.actor.mesh.traverse = visit => visit(model);
  f.context.window.HiveAssetLibrary = { getRuntime: root => root === model ? runtime : null,
    updateModel(root, delta) { calls.push({ root, delta }); } };
  f.actor.isRecoveringFromFacehugger = true; f.step(.1);
  f.actor.isRecoveringFromFacehugger = false; f.actor.ceilingActionOwner = {}; f.step(.1);
  delete f.actor.ceilingActionOwner; f.game.isSystemPaused = true; f.step(.1);
  assert.equal(calls.length, 0); f.game.isSystemPaused = false; f.actor.isRestrained = true;
  f.actor.update(1 / 60); assert.equal(calls.length, 1);
  f.actor.isCocooned = true; f.actor.update(1 / 60); assert.equal(calls.length, 1);
});
check('A genuinely revived unowned transported actor returns upright before resuming AI', () => {
  const f = fixture({ px: 100 }), model = {}, states = [];
  f.actor.transportRestingPose = true; f.actor.isIncapacitated = false;
  f.actor.isDocileCatatonic = true; f.actor.catatonicTimer = 1;
  f.actor.mesh.rotation.x = -Math.PI / 2; f.actor.mesh.position.y = .5;
  f.actor.mesh.traverse = visit => visit(model);
  f.context.window.HiveAssetLibrary = { getRuntime: root => root === model ? { disposed: false } : null,
    setState(root, state) { states.push({ root, state }); }, updateModel() {} };
  f.actor.update(1 / 60); assert.equal(f.actor.transportRestingPose, false);
  assert.equal(f.actor.mesh.rotation.x, 0); assert.equal(f.actor.mesh.rotation.z, 0); assert.equal(f.actor.mesh.position.y, 0);
  assert(states.some(row => row.root === model && row.state.frozen === false && row.state.dead === false));
});
check('A hidden biological transition cannot override the released host escape', () => {
  const f = fixture({ stage: 2, type: 'guard', pz: 0 });
  f.actor.isInfected = true; f.actor.fleeFrom(0, -1);
  const goal = { ...f.actor.navigationGoal }; f.p.isBiologicalTransition = true; f.p.mesh.visible = false;
  f.step(.2); assert.equal(f.actor.aiState, 'FLEE'); assert.equal(f.actor.lastKnownThreat, null);
  assert.equal(f.actor.navigationGoal.x, goal.x); assert.equal(f.actor.navigationGoal.z, goal.z);
  assert(!f.audio.some(call => /MotionTrackerPing|RadioSquelch/.test(call.method)));
});
check('A visible live facehugger remains observable outside biological transition', () => {
  const f = fixture({ stage: 2, pz: 10 }); f.p.form = 'facehugger'; f.p.isBiologicalTransition = false;
  f.actor.update(1 / 60); assert.equal(f.actor.aiState, 'ATTACK'); assert(f.actor.lastKnownThreat);
  f.p.isBiologicalTransition = true; assert.equal(f.actor.canObserveThreat(f.p), false);
});
check('Recovery release can use the real collision-aware flee route', () => {
  const f = fixture({ type: 'scientist', pz: 40 }); assert.equal(f.actor.fleeFrom(0, -2), true);
  assert.equal(f.actor.aiState, 'FLEE'); assert(f.actor.pathWaypoints.length > 0);
  const start = f.actor.z; f.step(.4); assert(f.actor.z > start); assert(!f.map.checkCollision(f.actor.x, f.actor.z));
});
check('Real routed movement keeps A-star clearance through the retained recovery-wall corner', () => {
  const wall = { minX: -16.6, maxX: -13.4, minZ: -16.6, maxZ: 16.6 };
  const f = fixture({ stage: 2, x: -12, z: -8, px: 100, pz: 100, wall });
  f.p.isBiologicalTransition = true; f.actor.receiveThreatReport(-21, -18, f.p);
  const route = f.actor.pathWaypoints.map(point => ({ ...point })); assert(route.length >= 2);
  const samples = []; let previous = { x: f.actor.x, z: f.actor.z };
  for (let frame = 0; frame < 225; frame++) {
    f.actor.update(1 / 60); const point = { x: f.actor.x, z: f.actor.z };
    samples.push(point); assert(!f.map.checkCollision(point.x, point.z, .72), 'Routed body cut wall clearance at ' + JSON.stringify(point));
    assert(f.map.hasLineOfSight(previous.x, previous.z, point.x, point.z, .72), 'Movement swept through a real wall edge');
    assert(Math.hypot(point.x - previous.x, point.z - previous.z) <= .080001, 'Routed movement skipped or sped up a step'); previous = point;
  }
  assert(f.actor.x < -17, 'The safe route must actually round the retained wall, not wait forever');
  return { fixture: 'Retained native collision wall AABB, actual findPath + complete HumanAI.update, prepared hidden player and copied threat', route, samples };
});
check('A corner waypoint is not pruned while the next production-clearance segment is occluded', () => {
  const f = fixture({ x: -12.5, z: -16.8, wall: { minX: -16.6, maxX: -13.4, minZ: -16.6, maxZ: 16.6 } });
  f.actor.navigationGoal = { x: -21, z: -18 };
  f.actor.pathWaypoints = [{ x: -12.5, z: -17.5 }, { x: -21, z: -18 }];
  assert(!f.map.hasLineOfSight(f.actor.x, f.actor.z, -21, -18, .72));
  f.actor.updateNavigation(1 / 60); assert.equal(f.actor.pathWaypoints.length, 2);
  assert.equal(f.actor.targetPos.x, -12.5); assert.equal(f.actor.targetPos.z, -17.5);
});
check('An unruptured steam vent is not an active civilian hazard', () => {
  const f = fixture({ type: 'scientist', px: 100, pz: 0 }); f.map.steamVents = [{ x: 0, z: 0, timer: 0, isRuptured: false }];
  f.step(.1); assert.equal(f.actor.aiState, 'PATROL'); assert.equal(f.actor.stress, 0);
});
check('A ruptured steam vent creates a routed escape and appropriate stress', () => {
  const f = fixture({ type: 'scientist', px: 100, pz: 0 }); f.map.steamVents = [{ x: -1, z: 0, timer: 8, isRuptured: true }];
  f.step(.1); assert.equal(f.actor.aiState, 'FLEE'); assert(f.actor.stress > 0); assert(f.actor.navigationGoal);
  assert(f.paths.length >= 1 && f.paths.length <= 2);
});
check('Steam appears exactly once in the actual station update dispatcher', () => {
  const start = mapSource.indexOf('    update(deltaSeconds = 1 / 60) {'), end = mapSource.indexOf('\n    updateSpaceJockey(', start);
  assert(start > 0 && end > start);
  assert.equal([...mapSource.slice(start, end).matchAll(/this\.updateSteamVents\(safeDelta\)/g)].length, 1);
});
check('Steam keeps the authored8/35 damage rates and nine-second fuse', () => {
  const f = fixture({ px: 0, pz: 0 }); const damage = { player: 0, human: 0 };
  f.p.takeDamage = amount => damage.player += amount;
  f.game.humans = [{ x: 0, z: 0, takeDamage: amount => damage.human += amount }];
  f.map.steamVents = [{ x: 0, z: 0, timer: 9, isRuptured: true }];
  for (let frame = 0; frame < 60; frame++) f.map.updateSteamVents(1 / 60);
  assert(Math.abs(damage.player - 8) < 1e-8); assert(Math.abs(damage.human - 35) < 1e-8);
  assert(Math.abs(f.map.steamVents[0].timer - 8) < 1e-8); return damage;
});
function syntheticHazardFixture() {
  const f = fixture(), rows = [];
  for (const [type, distance] of [['guard', 1], ['guard', 50], ['working_joe', 1], ['working_joe', 50]]) {
    const actor = new f.Human(rows.length + 10, type, distance, 0), hits = [];
    assert.equal(typeof actor.isSynthetic, 'function');
    assert.equal(actor.isSynthetic(), type === 'working_joe');
    actor.takeDamage = (amount, attacker) => hits.push({ amount, attacker });
    rows.push({ actor, hits, synthetic: actor.isSynthetic(), distance });
  }
  f.game.humans = rows.map(row => row.actor);
  return { ...f, rows };
}
function checkSyntheticHazard(method, { globalSynthetic, humanDamage = null, syntheticDamage = null, stagger, timerKey, timer }) {
  const f = syntheticHazardFixture(), target = { x: 0, z: 0 };
  assert.equal(f.map[method](target), true);
  for (const row of f.rows) {
    const affected = row.distance === 1 || (globalSynthetic && row.synthetic);
    assert.equal(row.actor.staggerTimer, affected ? stagger : 0, `${method}: ${row.actor.type}@${row.distance} stagger`);
    const damage = row.synthetic ? syntheticDamage : humanDamage;
    assert.equal(row.hits.length, affected && damage !== null ? 1 : 0, `${method}: ${row.actor.type}@${row.distance} hits`);
    if (row.hits.length) { assert.equal(row.hits[0].amount, damage); assert.equal(row.hits[0].attacker, f.p); }
    if (method === 'corruptApolloServerTower') assert.equal(row.actor.stress, affected ? 100 : 0);
  }
  assert.equal(target[timerKey], timer);
  assert.equal(f.map[method](target), false, 'Already-activated prop must not repeat the hazard');
  return { scope: 'Actual StationMap method and real HumanAI.isSynthetic; explicit raw-damage recipient sink, not native injury/render',
    source: f.map[method].toString(), globalSynthetic, timer, rows: f.rows.map(row => ({ type: row.actor.type, distance: row.distance,
      synthetic: row.synthetic, stagger: row.actor.staggerTimer, hits: row.hits.map(hit => hit.amount) })) };
}
check('Apollo corruption calls actual synthetic classification and preserves only its existing synthetic-global OR', () =>
  checkSyntheticHazard('corruptApolloServerTower', { globalSynthetic: true, stagger: 5, timerKey: 'corruptionTimer', timer: 20 }));
check('Third rail keeps local-only range and raw280 human versus450 synthetic damage', () =>
  checkSyntheticHazard('shortCircuitThirdRail', { globalSynthetic: false, humanDamage: 280, syntheticDamage: 450, stagger: 5.5, timerKey: 'dischargeTimer', timer: 12 }));
check('Recharge bay preserves its synthetic-global OR but not remote human hits and raw160 versus400', () =>
  checkSyntheticHazard('overloadSyntheticBay', { globalSynthetic: true, humanDamage: 160, syntheticDamage: 400, stagger: 5, timerKey: 'overloadTimer', timer: 12 }));
check('Seegson booth calls actual synthetic classification without globally staggering distant humans', () =>
  checkSyntheticHazard('overloadSeegsonBooth', { globalSynthetic: true, stagger: 5, timerKey: 'glitchTimer', timer: 9 }));
check('Assembly station keeps local-only range and raw160 human versus320 synthetic damage', () =>
  checkSyntheticHazard('overloadAssemblyStation', { globalSynthetic: false, humanDamage: 160, syntheticDamage: 320, stagger: 4.5, timerKey: 'overloadTimer', timer: 10 }));
check('Human grenades have a simulation fuse without any presentation subsystem', () => {
  const f = fixture({ pz: 10 }); f.context.window.HiveSystems = null;
  assert.equal(f.actor.launchGrenade(f.p, 36), true);
  assert.equal(f.damage.length, 0); f.actor.isIncapacitated = true;
  f.step(.44); assert.equal(f.damage.length, 0);
  f.step(.03); assert.deepEqual(f.damage, [36]); assert.equal(f.actor.pendingProjectiles.length, 0);
  f.step(1); assert.deepEqual(f.damage, [36]);
});
check('The optional grenade visual receives no authoritative impact callback', () => {
  const f = fixture({ pz: 10 }), visuals = [];
  f.context.window.HiveSystems.vfx.projectile = spec => { visuals.push(spec); return { cancel() {} }; };
  assert.equal(f.actor.launchGrenade(f.p, 36), true);
  assert.equal(visuals.length, 1); assert.equal(visuals[0].onImpact, undefined);
  f.actor.isIncapacitated = true; f.step(.5); assert.deepEqual(f.damage, [36]);
});
check('A paused simulation freezes a human grenade and resumes its remaining fuse', () => {
  const f = fixture({ pz: 10 }); f.actor.launchGrenade(f.p, 36);
  f.actor.isIncapacitated = true; f.step(.2); const remaining = f.actor.pendingProjectiles[0].remaining;
  f.game.isSystemPaused = true; f.step(3); assert.equal(f.actor.pendingProjectiles[0].remaining, remaining);
  assert.equal(f.damage.length, 0); f.game.isSystemPaused = false;
  f.step(.27); assert.deepEqual(f.damage, [36]);
});
check('A human grenade lands at the copied point and a moving target can evade it', () => {
  const f = fixture({ pz: 10 }); f.actor.launchGrenade(f.p, 36);
  f.actor.isIncapacitated = true; f.p.x = 9; f.step(.5);
  assert.equal(f.damage.length, 0); assert.equal(f.actor.pendingProjectiles.length, 0);
  const impacts = f.audio.filter(row => row.method === 'playGrenadeExplode');
  assert.equal(impacts.length, 1); assert.deepEqual(impacts[0].args, [0, 10]);
});
check('Blast clearance blocks a nearby target behind a newly closed actual wall', () => {
  const f = fixture({ pz: 10 }); f.actor.launchGrenade(f.p, 36);
  f.actor.isIncapacitated = true; f.p.x = 2;
  f.map.colliders.push({ minX: .8, maxX: 1.2, minZ: 8, maxZ: 12 }); f.step(.5);
  assert.equal(f.damage.length, 0); assert.equal(f.actor.pendingProjectiles.length, 0);
});
check('Stage reset and replaced target meshes cannot receive an old grenade', () => {
  for (const change of ['stage', 'mesh', 'humans', 'campaign']) {
    const f = fixture({ pz: 10 }); f.actor.launchGrenade(f.p, 36); f.actor.isIncapacitated = true;
    if (change === 'stage') f.game.currentStage = {};
    if (change === 'mesh') f.p.mesh = { visible: true };
    if (change === 'humans') f.game.humans = [f.actor];
    if (change === 'campaign') f.game.campaignActive = false;
    f.step(.5); assert.equal(f.damage.length, 0, change); assert.equal(f.actor.pendingProjectiles.length, 0, change);
  }
});
check('A grenade already in flight remains live if its launcher is incapacitated', () => {
  const f = fixture({ pz: 10 }); f.actor.launchGrenade(f.p, 14);
  f.actor.isIncapacitated = true; f.actor.ceilingActionOwner = {}; f.step(.5);
  assert.deepEqual(f.damage, [14]); assert.equal(f.animations.length, 0);
});
function prepareWeapon({ type, phosphorus }, reducedMotion = false) {
  const f = fixture({ type, pz: 10 });
  const VFX = vm.runInNewContext('(' + vfxSource + '\n)', f.context);
  const vfx = new VFX();
  vfx.setReducedMotion(reducedMotion);
  f.context.window.HiveSystems.vfx = vfx;
  f.map.whitePhosphorusPatches = [];
  f.actor.u1GrenadeCooldown = 999;
  f.p.mesh.position = { set() {} };
  if (phosphorus) {
    f.actor.stress = 65;
    f.actor.whitePhosphorusCooldown = 0;
  }
  return f;
}
for (const profile of projectileProfiles) {
  check(`${profile.type} has no immediate impact with real reduced-motion VFX or without a scene`, () => {
    for (const reducedMotion of [false, true]) {
      const f = prepareWeapon(profile, reducedMotion);
      f.actor.update(1 / 60);
      assert.equal(f.damage.length, 0, 'Weapon damage occurred during launch');
      assert.equal(f.map.whitePhosphorusPatches.length, 0, 'Fire appeared during launch');
      assert.equal(f.actor.pendingProjectiles.length, 1, 'Weapon branch did not queue a shot');
      const { remaining, startX, startZ } = f.actor.pendingProjectiles[0];
      const authored = Math.max(.08, Math.hypot(startX, startZ - 10, profile.vertical) / profile.speed);
      assert(Math.abs(remaining - authored) < 1e-9, 'Authored flight time changed');
      f.actor.isIncapacitated = true;
      f.step(remaining - .01);
      assert.equal(f.damage.length + f.map.whitePhosphorusPatches.length, 0);
      f.game.isSystemPaused = true;
      f.step(1);
      assert.equal(f.damage.length + f.map.whitePhosphorusPatches.length, 0);
      f.game.isSystemPaused = false;
      f.step(.02);
      f.step(1);
      if (profile.phosphorus) {
        assert.equal(f.map.whitePhosphorusPatches.length, 1);
        const patch = f.map.whitePhosphorusPatches[0];
        assert.deepEqual([patch.x, patch.z, patch.radius, patch.timer], [0, 10, 4.2, 8]);
      } else {
        assert.deepEqual(f.damage, [profile.damage]);
        if (profile.stagger) assert.equal(f.p.staggerTimer, profile.stagger);
      }
      assert.equal(f.actor.pendingProjectiles.length, 0);
    }
  });
}
check('SADAR keeps its launch point when evaded and cannot hit through newly closed solid cover', () => {
  for (const cover of [false, true]) {
    const f = prepareWeapon(projectileProfiles[4]);
    f.actor.update(1 / 60);
    f.actor.isIncapacitated = true;
    if (cover) f.map.colliders.push({ minX: -4, maxX: 4, minZ: 4, maxZ: 6 });
    else f.p.x = 6;
    f.step(.5);
    assert.equal(f.damage.length, 0);
    assert.equal(f.actor.pendingProjectiles.length, 0);
    const blasts = f.audio.filter(row => row.method === 'playGrenadeExplode');
    assert.equal(blasts.length, cover ? 0 : 1);
    if (!cover) assert.deepEqual(blasts[0].args, [0, 10]);
  }
});
check('Obsolete campaign and stage prevent damage and persistent phosphorus fire', () => {
  for (const profile of [projectileProfiles[4], projectileProfiles[5]]) {
    for (const change of ['stage', 'campaign', 'closed']) {
      const f = prepareWeapon(profile);
      f.actor.update(1 / 60);
      assert.equal(f.actor.pendingProjectiles.length, 1);
      f.actor.isIncapacitated = true;
      if (change === 'stage') f.game.currentStage = {};
      if (change === 'campaign') f.game.campaignActive = false;
      if (change === 'closed') f.game.isRunning = false;
      f.step(1);
      assert.equal(f.damage.length + f.map.whitePhosphorusPatches.length, 0, change);
      assert.equal(f.actor.pendingProjectiles.length, 0, change);
    }
  }
});
check('Concussion damage does not push the player through a thin solid collider', () => {
  const f = prepareWeapon(projectileProfiles[2]);
  f.map.colliders.push({ minX: -3, maxX: 3, minZ: 10.8, maxZ: 11.2 });
  f.actor.update(1 / 60);
  f.actor.isIncapacitated = true;
  f.step(.5);
  assert.deepEqual(f.damage, [28]);
  assert.equal(f.p.z, 10);
});
check('Deployed phosphorus freezes while paused and cannot burn a new act', () => {
  const f = fixture({ pz: 10 });
  f.map.deployWhitePhosphorus(0, 10);
  f.game.isSystemPaused = true;
  f.map.updateWhitePhosphorusPatches(.1);
  assert.equal(f.map.whitePhosphorusPatches[0].timer, 8);
  assert.equal(f.damage.length, 0);
  f.game.isSystemPaused = false;
  f.map.updateWhitePhosphorusPatches(.1);
  assert.deepEqual(f.damage, [1.5]);
  f.game.currentStage = {};
  f.map.updateWhitePhosphorusPatches(.1);
  assert.deepEqual(f.damage, [1.5]);
  assert.equal(f.map.whitePhosphorusPatches.length, 0);
});
check('Thrown EMP freezes in pause and its old mesh disappears without detonation on stage change', () => {
  const f = fixture();
  const observed = [];
  const mesh = { position: { set() {} } };
  f.map.activeEMPGrenades = [];
  f.context.window.HiveModelFactory = { createEMPGrenade: () => mesh };
  Object.assign(f.context.rendererEngine, { propsGroup: { add(value) { assert.equal(value, mesh); } },
    removeObject(value) { observed.push(value); }, sabotagePower() { observed.push('explosion'); } });
  f.map.throwEMPGrenade(0, 0, 0, 10);
  f.game.isSystemPaused = true;
  f.map.updateEMPGrenades(.9);
  assert.equal(f.map.activeEMPGrenades[0].elapsed, 0);
  f.game.isSystemPaused = false;
  f.game.currentStage = {};
  f.map.updateEMPGrenades(.9);
  assert.deepEqual(observed, [mesh]);
  assert.equal(f.map.activeEMPGrenades.length, 0);
  f.map.throwEMPGrenade(0, 0, 0, 10);
  f.map.deployWhitePhosphorus(0, 10);
  f.map.clearTransientMunitions();
  f.map.clearTransientMunitions();
  assert.deepEqual(observed, [mesh, mesh]);
  assert.equal(f.map.activeEMPGrenades.length, 0);
  assert.equal(f.map.whitePhosphorusPatches.length, 0);
});
check('Lost squad leaders do not grant hidden live coordinates for routed retreat', () => {
  const f = fixture({ pz: 12 }); f.actor.shootCooldown = 999; f.actor.u1GrenadeCooldown = 999;
  f.actor.update(1 / 60); const known = { x: f.actor.lastKnownThreat.x, z: f.actor.lastKnownThreat.z };
  f.map.colliders.push({ minX: -72, maxX: 72, minZ: 5, maxZ: 7 });
  f.p.x = 30; f.p.z = 20; f.actor.squadLeaderDownTimer = 5;
  const points = []; f.actor.fleeFrom = (x, z) => { points.push([x, z]); return true; };
  f.actor.update(1 / 60); assert(points.length > 0);
  assert(points.every(point => point[0] === known.x && point[1] === known.z));
});
check('Squad suppression has a bounded simulation cadence instead of one burst per frame', () => {
  const f = fixture({ type: 'marine', pz: 10 }); f.actor.id = 2;
  const ally = new f.Human(3, 'marine', 5, 0); f.game.humans.push(ally);
  f.actor.shootCooldown = .2; f.actor.u1GrenadeCooldown = 999; f.actor.grenadeCooldown = 999;
  // Keep the main shot cooldown near the support-fire threshold without
  // executing another weapon branch; only the squad cadence is under test.
  for (let frame = 0; frame < 120; frame++) { f.actor.shootCooldown = .2; f.actor.update(1 / 60); }
  const bursts = f.audio.filter(row => row.method === 'playPulseRifleFire');
  assert(bursts.length >= 2 && bursts.length <= 3, 'Unexpected suppression bursts: ' + bursts.length);
});
const report = { scope: 'Actual unchanged classes, authored collision/path methods on prepared AABB and actors, fixed ticks; not native render or human play',
  sourceSha256: crypto.createHash('sha256').update(source).digest('hex'), groups: results.length,
  passed: results.filter(row => row.passed).length, results };
const output = argv.find(value => value.startsWith('--output='))?.slice(9);
if (output) {
  const target = path.resolve(root, output); assert(target.startsWith(path.join(root, '.tools') + path.sep));
  assert(!fs.existsSync(target), 'Do not overwrite earlier evidence'); fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(report, null, 2) + '\n');
}
console.log(report.passed + '/' + report.groups + ' AI coherence groups passed');
process.exitCode = report.passed === report.groups ? 0 : 1;
