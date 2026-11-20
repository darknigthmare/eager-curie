#!/usr/bin/env node
'use strict';

// The real AudioManager is compiled unchanged. WebAudio scheduling and graph
// nodes below are strict labelled fixtures, not native PCM or listening QA.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/game.js'), 'utf8');
const start = source.indexOf('  class AudioManager {');
const end = source.indexOf('  const audioManager = new AudioManager();', start);
assert(start >= 0 && end > start, 'Actual AudioManager class boundaries are required');

class Param {
  constructor(value = 0) { this.value = value; }
  set value(value) { assert(Number.isFinite(value), 'Non-finite audio parameter'); this._value = value; }
  get value() { return this._value; }
  setValueAtTime(value, time) { assert(Number.isFinite(time)); this.value = value; return this; }
  linearRampToValueAtTime(value, time) { return this.setValueAtTime(value, time); }
  exponentialRampToValueAtTime(value, time) { assert(value > 0); return this.setValueAtTime(value, time); }
  setTargetAtTime(value, time, constant) { assert(constant > 0); return this.setValueAtTime(value, time); }
  cancelScheduledValues(time) { assert(Number.isFinite(time)); return this; }
}
class AudioNode {
  constructor(context, kind) {
    this.context = context; this.kind = kind; this.outputs = new Set();
    for (const key of ['gain', 'frequency', 'Q', 'pan', 'delayTime', 'threshold', 'knee', 'ratio', 'attack', 'release'])
      this[key] = new Param();
    context.nodes.push(this);
  }
  connect(node) {
    assert(node instanceof AudioNode || node instanceof Param, 'Audio graph destination must exist');
    this.outputs.add(node); return node;
  }
  disconnect() { this.outputs.clear(); }
  start(time = this.context.currentTime) {
    assert(!this.started, 'A source must start only once');
    assert(Number.isFinite(time) && time >= this.context.currentTime, 'Invalid source start');
    this.started = true; this.startedAt = time;
    if (this.buffer && !this.loop) this.stoppedAt = time + this.buffer.duration;
    this.context.sources.push(this);
  }
  stop(time = this.context.currentTime) {
    assert(this.started && Number.isFinite(time) && time >= this.startedAt, 'Invalid source stop');
    this.stoppedAt = time;
  }
}
class AudioContextFixture {
  constructor(stereo = true) {
    this.nodes = []; this.sources = []; this.currentTime = 2; this.sampleRate = 12000; this.state = 'running';
    this.destination = new AudioNode(this, 'destination');
    if (!stereo) this.createStereoPanner = undefined;
  }
  createGain() { return new AudioNode(this, 'gain'); }
  createOscillator() { return new AudioNode(this, 'oscillator'); }
  createBufferSource() { return new AudioNode(this, 'buffer'); }
  createBiquadFilter() { return new AudioNode(this, 'filter'); }
  createStereoPanner() { return new AudioNode(this, 'panner'); }
  createDelay() { return new AudioNode(this, 'delay'); }
  createDynamicsCompressor() { return new AudioNode(this, 'compressor'); }
  createBuffer(channels, frames, rate) {
    assert(Number.isInteger(frames) && frames > 0 && rate > 0);
    const data = Array.from({length: channels}, () => new Float32Array(frames));
    return {duration: frames / rate, getChannelData: index => data[index]};
  }
  resume() { this.state = 'running'; return Promise.resolve(); }
}
function fixture(stereo = true, initialize = true) {
  const sandbox = {console, Math, Number, Float32Array,
    window: {AudioContext: function AudioContext() { return new AudioContextFixture(stereo); },
      stationMap: {blastDoors: []}, playerCreature: {isInVent: false}},
    rendererEngine: {camera: {position: {x: 0, z: 0}}}, playerCreature: {x: 0, z: 0}};
  vm.createContext(sandbox);
  vm.runInContext(source.slice(start, end) + '\nwindow.NativeAudio = AudioManager;', sandbox);
  const audio = new sandbox.window.NativeAudio();
  if (initialize) audio.init();
  return {audio, sandbox};
}
function reaches(sourceNode, destination, visited = new Set()) {
  if (sourceNode === destination) return true;
  if (!(sourceNode instanceof AudioNode) || visited.has(sourceNode)) return false;
  visited.add(sourceNode);
  return [...sourceNode.outputs].some(node => reaches(node, destination, visited));
}
const methods = [
  ['playBrineEvaporatorSteamHiss', 58, 1.2, 1],
  ['playGeothermalWellheadPressureRelief', 58, 1.4, 1],
  ['playCameraServoPan', 14, .18, 1], ['playCameraAlertBeep', 22, .15, 2],
  ['playTurretSwivel', 18, .16, 1], ['playTurretLock', 20, .14, 2],
  ['playTerminalKeyboardClick', 10, .035, 1], ['playHighVoltageHum', 16, .45, 2],
  ['playHydraulicServo', 15, .32, 1], ['playAutomatonFootstep', 16, .16, 2],
  ['playSyntheticFluidLeak', 14, .32, 1]
];
const results = [];
function check(name, run) {
  try { const detail = run(); results.push({name, passed: true, detail}); console.log('PASS ' + name); }
  catch (error) { results.push({name, passed: false, error: error.stack || String(error)}); console.error('FAIL ' + name + ': ' + error.message); }
}
check('The repaired sound methods are actual AudioManager methods with real routing', () => {
  const {audio} = fixture(false, false);
  for (const [name] of methods) assert.equal(typeof audio[name], 'function', name);
  const moved = source.slice(source.indexOf('    playBrineEvaporatorSteamHiss('), end);
  assert(!moved.includes('_calcSpatialPan') && !moved.includes('this.sfxGain') &&
    !moved.includes('this.audioCtx') && !moved.includes('this._createPanner'), 'No phantom audio context, spatial or bus API');
  return {methods: methods.map(row => row[0])};
});
for (const stereo of [true, false]) for (const [method, radius, duration, sourceCount] of methods) {
  check(method + (stereo ? ' real shared routing, stereo fixture' : ' real shared routing, mono fixture'), () => {
    const {audio} = fixture(stereo), ctx = audio.ctx, calls = [];
    assert(audio.initialized && ctx);
    const connect = audio.connect;
    audio.connect = function(node, x, z, range) { calls.push({x, z, range}); return connect.call(this, node, x, z, range); };
    const returned = audio[method](3, 4);
    assert.equal(returned, undefined, 'Legacy sound API returns void, not an invented boolean');
    assert.equal(ctx.sources.length, sourceCount, 'Source count must preserve the authored sound');
    assert(calls.length > 0 && calls.every(call => call.x === 3 && call.z === 4 && call.range === radius));
    for (const node of ctx.sources) {
      assert(reaches(node, audio.masterGain), method + ' source bypassed or missed masterGain');
      assert(Number.isFinite(node.stoppedAt), method + ' source has no finite lifetime');
    }
    const actual = Math.max(...ctx.sources.map(node => node.stoppedAt - ctx.currentTime));
    assert(Math.abs(actual - duration) < 1e-8, 'Authored duration changed: ' + actual);
    assert.equal([...audio.masterGain.outputs][0], audio.compressor);
    assert.equal([...audio.compressor.outputs][0], ctx.destination);
    return {sourceCount, radius, duration: actual, masterBus: true, stereo};
  });
}
check('Merged material, breathing and machinery sounds use finite master-bus sources and honor mute', () => {
  const calls = [
    ['playMaterialFootstep', ['metal', 3, 4, true, false]],
    ['playMaterialFootstep', ['water', 3, 4, false, false]],
    ['playMaterialFootstep', ['resin', 3, 4, true, true]],
    ['playXenoGutturalBreathing', [3, 4]],
    ['playHighFrequencyElectricArc', [3, 4]],
    ['playCavernousHullCreak', [3, 4]],
    ['playSyntheticCalmChime', [3, 4]]
  ];
  for (const [name, args] of calls) {
    const {audio} = fixture();
    audio[name](...args);
    assert(audio.ctx.sources.length > 0, name);
    for (const sourceNode of audio.ctx.sources) {
      assert(reaches(sourceNode, audio.masterGain), name + ' missed master bus');
      assert(Number.isFinite(sourceNode.stoppedAt), name + ' has unbounded lifetime');
    }
    audio.toggleMuted();
    const count = audio.ctx.sources.length, nodes = audio.ctx.nodes.length;
    audio[name](...args);
    assert.equal(audio.ctx.sources.length, count);
    assert.equal(audio.ctx.nodes.length, nodes);
  }
  return {variants:calls.length,scope:'Real methods with strict graph fixtures; not native PCM/listening'};
});
check('Cold sound calls remain no-op without WebAudio initialization', () => {
  const {audio} = fixture(true, false);
  for (const [method] of methods) assert.equal(audio[method](3, 4), undefined);
  assert.equal(audio.ctx, null);
});
check('Muted sound calls allocate no graph or sources', () => {
  const {audio} = fixture(), count = audio.ctx.nodes.length;
  audio.toggleMuted();
  for (const [method] of methods) assert.equal(audio[method](3, 4), undefined);
  assert.equal(audio.ctx.nodes.length, count); assert.equal(audio.ctx.sources.length, 0);
});
check('Non-spatial calls route through the existing master bus too', () => {
  const {audio} = fixture(false);
  for (const [method] of methods) audio[method]();
  assert(audio.ctx.sources.every(node => reaches(node, audio.masterGain)));
});
check('Explosion ducking cannot make the zero-volume master audible', () => {
  const {audio} = fixture();
  audio.setVolume(0);
  audio.triggerExplosionDucking();
  assert.equal(audio.masterGain.gain.value, 0);
});
check('Explosion ducking never amplifies a low-volume master', () => {
  const {audio} = fixture(), ramps = [], parameter = audio.masterGain.gain;
  audio.setVolume(.01);
  const original = parameter.exponentialRampToValueAtTime;
  parameter.exponentialRampToValueAtTime = function(value, time) {
    ramps.push(value); return original.call(this, value, time);
  };
  audio.triggerExplosionDucking();
  assert(ramps.length > 0);
  assert(ramps.every(value => value <= .01 && value > 0));
});
for (const action of ['volume', 'mute']) check('Changing '+action+' cancels old scheduled master restores', () => {
  const {audio} = fixture(), parameter = audio.masterGain.gain, cancellations = [];
  audio.triggerExplosionDucking();
  parameter.cancelScheduledValues = time => { cancellations.push(time); return parameter; };
  if (action === 'volume') audio.setVolume(.2); else audio.toggleMuted();
  assert.equal(cancellations.length, 1);
  assert.equal(cancellations[0], audio.ctx.currentTime);
});
check('The entire production game script parses before boot', () => {
  new vm.Script(source, {filename: 'src/game.js'});
});
const passed = results.filter(result => result.passed).length;
const report = {status: passed === results.length ? 'passed' : 'failed', sourceSha256: crypto.createHash('sha256').update(source).digest('hex'),
  scope: 'Unmodified AudioManager and full game parsing with strict WebAudio fixtures; no browser or native PCM claim',
  groups: results.length, passed, results};
const output = process.argv.find(argument => argument.startsWith('--output='))?.slice('--output='.length);
if (output) {
  const target = path.resolve(root, output);
  assert(target.startsWith(path.join(root, '.tools') + path.sep), 'Private evidence path required');
  assert(!fs.existsSync(target), 'Do not overwrite earlier evidence');
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(target, JSON.stringify(report, null, 2) + '\n');
}
console.log(`${passed}/${results.length} audio boot groups passed`);
process.exitCode = passed === results.length ? 0 : 1;
