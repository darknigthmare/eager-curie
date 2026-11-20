#!/usr/bin/env node
'use strict';

// Exercise the production simulation and visual methods with deterministic actors.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const THREE = require('../assets/vendor/three.r128.min.js');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/game.js'), 'utf8');
const vfxSource = fs.readFileSync(path.join(root, 'src/game-systems.js'), 'utf8');
const startGame = source.indexOf('  class GameMaster {');
const endGame = source.indexOf("  window.addEventListener('DOMContentLoaded'", startGame);
const startMap = source.indexOf('  class StationMap {');
const endMap = source.indexOf('  const stationMap = new StationMap();', startMap);
const startVfx = vfxSource.indexOf('  class VFXManager {');
const endVfx = vfxSource.indexOf('  class CampaignUI {', startVfx);
assert(startGame >= 0 && endGame > startGame && startMap >= 0 && endMap > startMap && startVfx >= 0 && endVfx > startVfx);

const noop = () => {};
const context = vm.createContext({
  THREE, console, window: {}, audioManager: {}, rendererEngine: {},
  playerCreature: { x: 20, z: 20, isInVent: true }, showToast: noop, appendSensorLog: noop
});
const { GameMaster, StationMap, VFXManager } = vm.runInContext(
  source.slice(startGame, endGame) + source.slice(startMap, endMap) + vfxSource.slice(startVfx, endVfx) +
  '\n({GameMaster, StationMap, VFXManager})', context
);

function fixture(scene) {
  const vfx = new VFXManager();
  vfx.init(scene);
  const hits = [];
  const target = { x: 0.5, z: 0, takeDamage(value) { hits.push(value); } };
  const game = Object.assign(Object.create(GameMaster.prototype), {
    campaignActive: true, isRunning: true, isSystemPaused: false, humans: [target], currentStage: {}, acidPools: []
  });
  context.window.gameInstance = game;
  context.window.HiveSystems = { vfx };
  return { vfx, game, target, hits, step(count) { for (let tick = 0; tick < count; tick++) game.updateAcidPools(.05); } };
}

for (const mode of ['normal', 'reduced', 'no-scene']) {
  const { vfx, game, target, hits, step } = fixture(mode === 'no-scene' ? null : new THREE.Scene());
  vfx.setReducedMotion(mode === 'reduced');
  assert(game.registerAcidPool(0, 0, 1.5, 1.2));
  const marker = vfx.effects.find(effect => effect.acidPool);
  assert.equal(Boolean(marker), mode !== 'no-scene');
  if (mode === 'normal') {
    vfx.setReducedMotion(true);
    assert(vfx.effects.includes(marker));
    assert(marker.group.children[0].visible && marker.group.children.slice(1).every(child => !child.visible));
  }
  vfx.update(.6);
  assert.deepEqual(hits, [], 'Visual update must not inflict damage');
  step(9);
  assert.deepEqual(hits, []);
  game.isSystemPaused = true;
  const remaining = game.acidPools[0].remaining;
  step(20);
  assert.equal(game.acidPools[0].remaining, remaining);
  game.isSystemPaused = false;
  step(1);
  assert.deepEqual(hits, [12]);
  target.x = NaN;
  step(10);
  assert.deepEqual(hits, [12], 'Unknown actor coordinates must never be in range');
  step(5);
  assert.equal(game.acidPools.length, 0);
  assert(!marker?.group.parent);
  console.log('PASS acid pool cadence, pause, expiration and cleanup in', mode);
}

const { vfx, game, step } = fixture(null);
const collider = {};
const wire = { x: 0, z: 0, hp: 50, isCut: false, collider };
const turret = { x: 2, z: 0, ammo: 15, burstCooldown: .2 };
const station = Object.assign(Object.create(StationMap.prototype), {
  barbedWireSpools: [wire], colliders: [collider], sentryTurrets: [turret], isPropActiveForStage: () => true
});
assert(game.registerAcidPool(0, 0, 1.5, 2));
assert.equal(vfx.effects.length, 0);
station.updateBarbedWireSpools(.05);
station.updateSentryTurrets(.05);
assert(wire.isCut && wire.hp === 0 && !station.colliders.includes(collider));
assert(turret.isOpticsBlinded && turret.blindTimer === 12);
game.currentStage = {};
step(1);
assert.equal(game.acidPools.length, 0);
console.log('PASS real station wire and turret methods use the logical pool without visual effects');
