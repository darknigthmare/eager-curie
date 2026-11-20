#!/usr/bin/env node
'use strict';
// Real CampaignUI card binding with explicit DOM fixtures. Browser geometry is separate.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/game-systems.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const start = source.indexOf('    bindCardSelectors() {');
const end = source.indexOf('    bindUtilityControls() {', start);
assert(start > 0 && end > start);
let passed = 0;
function test(name, run) { run(); passed++; console.log('PASS ' + name); }
function fixture() {
  let active = null;
  class Element {
    constructor(value, attribute, kind) {
      this.value = value; this.attributes = new Map(attribute ? [[attribute, value]] : []);
      this.listeners = new Map(); this.classes = new Set(); this.kind = kind;
      this.status = { textContent: '' }; this.changes = 0;
      this.classList = { toggle: (name, state) => state ? this.classes.add(name) : this.classes.delete(name) };
    }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    querySelector() { return this.status; }
    addEventListener(name, listener) { const list = this.listeners.get(name) || []; list.push(listener); this.listeners.set(name, list); }
    dispatchEvent(event) { if (event.type === 'change') this.changes++; for (const fn of this.listeners.get(event.type) || []) fn(event); }
    focus() { active = this; }
    scrollIntoView() { this.scrolled = true; }
    key(key) { const event = { type: 'keydown', key, prevented: false, preventDefault() { this.prevented = true; } }; this.dispatchEvent(event); return event; }
    click() { this.dispatchEvent({ type: 'click' }); }
  }
  const difficulty = new Element('survivor'), origin = new Element('random');
  const diffCards = ['story', 'survivor', 'nightmare'].map(value => new Element(value, 'data-difficulty', 'diff'));
  const originCards = ['random', 'juggernaut', 'hive', 'colony', 'starship'].map(value => new Element(value, 'data-origin', 'origin'));
  const document = {
    getElementById: id => id === 'difficulty-select' ? difficulty : id === 'origin-select' ? origin : null,
    querySelectorAll: selector => selector === '.diff-card' ? diffCards : selector === '.origin-card' ? originCards : []
  };
  const UI = vm.runInNewContext(`class UI {${source.slice(start, end)}}; UI`, { document, Event: class { constructor(type) { this.type = type; } } });
  const ui = new UI(); ui.bindCardSelectors();
  return { ui, difficulty, origin, diffCards, originCards, active: () => active };
}
function checked(cards, value) {
  assert.deepEqual(cards.filter(card => card.getAttribute('aria-checked') === 'true').map(card => card.value), [value]);
  assert.deepEqual(cards.filter(card => card.getAttribute('tabindex') === '0').map(card => card.value), [value]);
  assert(cards.every(card => card.classes.has('active') === (card.value === value)));
}
test('HTML has eight named radio cards and a single initial tab stop per group', () => {
  const cards = [...html.matchAll(/<div class="(?:diff-card|origin-card)[^"]*"[^>]*role="radio"[^>]*>/g)].map(match => match[0]);
  assert.equal(cards.length, 8);
  assert.equal(cards.filter(card => card.includes('tabindex="0"')).length, 2);
  assert(cards.every(card => /aria-labelledby="[^"]+"/.test(card)));
  for (const card of cards) {
    const id = card.match(/aria-labelledby="([^"]+)"/)[1];
    assert(html.includes(`id="${id}"`));
  }
  assert(!/^<<<<<<<|^>>>>>>>/m.test(html));
});
test('Initial real binding synchronizes selects, radio state and roving tabindex', () => {
  const f = fixture(); checked(f.diffCards, 'survivor'); checked(f.originCards, 'random');
});
test('Clicking all eight cards changes the actual campaign value and focuses that card', () => {
  const f = fixture();
  for (const [cards, select] of [[f.diffCards, f.difficulty], [f.originCards, f.origin]]) {
    for (const card of cards) { card.click(); assert.equal(select.value, card.value); checked(cards, card.value); assert.equal(f.active(), card); }
    assert.equal(select.changes, cards.length);
  }
});
test('Arrows wrap through each group and prevent page scroll', () => {
  const f = fixture();
  for (const [cards, select] of [[f.diffCards, f.difficulty], [f.originCards, f.origin]]) {
    assert(cards[0].key('ArrowLeft').prevented); assert.equal(select.value, cards.at(-1).value);
    assert(cards.at(-1).key('ArrowRight').prevented); assert.equal(select.value, cards[0].value);
    cards[0].key('ArrowDown'); assert.equal(select.value, cards[1].value);
    cards[1].key('ArrowUp'); checked(cards, cards[0].value);
  }
});
test('Home/End, Space and Enter choose through the same select change path', () => {
  const f = fixture();
  for (const [cards, select] of [[f.diffCards, f.difficulty], [f.originCards, f.origin]]) {
    cards[1].key('End'); assert.equal(select.value, cards.at(-1).value);
    cards.at(-1).key('Home'); assert.equal(select.value, cards[0].value);
    cards[1].key(' '); assert.equal(select.value, cards[1].value);
    cards[2].key('Enter'); assert.equal(select.value, cards[2].value);
    assert.equal(select.changes, 4);
  }
});
test('External select change updates cards and unrelated keys do not activate', () => {
  const f = fixture(); f.origin.value = 'hive'; f.origin.dispatchEvent({ type: 'change' }); checked(f.originCards, 'hive');
  assert.equal(f.originCards[2].key('Tab').prevented, false); assert.equal(f.origin.changes, 1);
  f.difficulty.value = 'story'; f.difficulty.dispatchEvent({ type: 'change' }); checked(f.diffCards, 'story');
});
test('Binding twice cannot duplicate clicks or change events', () => {
  const f = fixture(); f.ui.bindCardSelectors(); f.originCards[1].click(); assert.equal(f.origin.changes, 1);
  f.diffCards[0].click(); assert.equal(f.difficulty.changes, 1);
});
test('Invalid campaign values recover a valid default radio instead of losing the tab stop', () => {
  const f = fixture(); f.origin.value = 'unknown'; f.origin.dispatchEvent({ type: 'change' }); checked(f.originCards, 'random');
  f.difficulty.value = ''; f.difficulty.dispatchEvent({ type: 'change' }); checked(f.diffCards, 'survivor');
});
test('Menu distinguishes illustrative station origins from four film maps and fictional probabilities', () => {
  assert(html.includes('quatre cartes cinéma'));
  assert(!html.includes('1 des 4 cartes et origines'));
  assert(!html.includes('>18%</span>') && !html.includes('>65%</span>') && !html.includes('>98%</span>'));
  assert(html.includes('[+34.0 // +38.0]'));
});
console.log(JSON.stringify({ passed: true, checks: passed, scope: 'Real menu binding and HTML contracts; not rendered layout or human QA.' }));
