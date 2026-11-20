#!/usr/bin/env node
'use strict';
// Real CampaignUI methods, with explicit DOM/matchMedia/game-interface fixtures.
// These tests do not claim computed browser layout, touch-device or human QA.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/game-systems.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src/css/style.css'), 'utf8');
const start = source.indexOf('  class CampaignUI {'), end = source.indexOf('  const saveManager = new SaveManager();', start);
assert(start >= 0 && end > start);
let passed = 0;
const results = [];
function test(name, run) { run(); passed++; results.push({ name, passed: true }); console.log('PASS ' + name); }
function fixture(compact = true, withObservers = false) {
  let document;
  class ElementFixture {
    constructor(tag = 'div') {
      this.tagName = tag.toUpperCase(); this.children = []; this.parentElement = null;
      this.attrs = new Map(); this.classes = new Set(); this.listeners = new Map();
      this.dataset = {}; this.style = {}; this.textContent = ''; this.disabled = false; this.inert = false;
      this.classList = { add: (...names) => names.forEach(n => this.classes.add(n)), remove: (...names) => names.forEach(n => this.classes.delete(n)),
        contains: name => this.classes.has(name), toggle: (name, force) => {
          const active = force === undefined ? !this.classes.has(name) : !!force;
          if (active) this.classes.add(name); else this.classes.delete(name); return active;
        } };
    }
    set className(value) { this.classes = new Set(value.split(/\s+/).filter(Boolean)); }
    get className() { return [...this.classes].join(' '); }
    get disabled() { return this.attrs.has('disabled'); }
    set disabled(value) { if (value) this.attrs.set('disabled', ''); else this.attrs.delete('disabled'); }
    set innerHTML(value) { this.children = []; this.rawHTML = value; }
    get firstElementChild() { return this.children[0] || null; }
    appendChild(node) { node.parentElement?.removeChild(node); node.parentElement = this; this.children.push(node); return node; }
    append(...nodes) { nodes.forEach(node => this.appendChild(node)); }
    removeChild(node) { this.children.splice(this.children.indexOf(node), 1); node.parentElement = null; }
    remove() { this.parentElement?.removeChild(this); }
    replaceChildren(...nodes) { this.children.forEach(node => { node.parentElement = null; }); this.children = []; this.append(...nodes); }
    setAttribute(name, value) { this.attrs.set(name, String(value)); }
    getAttribute(name) { return this.attrs.get(name) ?? null; }
    removeAttribute(name) { this.attrs.delete(name); }
    addEventListener(name, run) { if (!this.listeners.has(name)) this.listeners.set(name, []); this.listeners.get(name).push(run); }
    click() { if (!this.disabled) for (const run of this.listeners.get('click') || []) run({ target: this }); }
    focus() { document.activeElement = this; }
    scrollIntoView() { this.scrollRequested = true; }
    closest(selector) {
      if (selector === 'button.act-btn' && this.tagName === 'BUTTON' && this.classList.contains('act-btn')) return this;
      return this.parentElement?.closest(selector) || null;
    }
    descendants() { return this.children.flatMap(child => [child, ...child.descendants()]); }
    querySelectorAll(selector) {
      const all = this.descendants();
      if (selector === '.panel-section') return all.filter(e => e.classList.contains('panel-section'));
      if (selector === '.act-btn') return all.filter(e => e.classList.contains('act-btn'));
      if (selector === '.action-label') return all.filter(e => e.classList.contains('action-label'));
      if (selector === '#action-buttons-container .act-btn') return all.filter(e => e.classList.contains('act-btn') && e.parentElement?.id === 'action-buttons-container');
      if (selector === '#action-buttons-container button:not(:disabled)') return all.filter(e => e.tagName === 'BUTTON' && !e.disabled && e.parentElement?.id === 'action-buttons-container');
      return [];
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  }
  const body = new ElementFixture('body');
  document = { body, activeElement: null, createElement: tag => new ElementFixture(tag),
    getElementById: id => [body, ...body.descendants()].find(e => e.id === id) || null };
  const make = (id, parent = body, tag = 'div', cls = '') => { const el = document.createElement(tag); el.id = id; el.className = cls; parent.appendChild(el); return el; };
  const app = make('app-container'), sidebar = make('hud-sidebar', app), stats = make('stats', sidebar, 'section', 'panel-section');
  make('stat-vital-val', stats).textContent = '30/235'; make('stat-sec-val', stats).textContent = '70%';
  make('stat-vital-label', stats).textContent = 'Intégrité'; make('stat-sec-label', stats).textContent = 'Réserve de chasse';
  const actions = make('action-buttons-container', sidebar), toggle = make('btn-toggle-hud', app, 'button');
  const canvas = make('game-canvas', app, 'canvas'), tracker = make('m314-tracker', app), trackerToggle = make('btn-toggle-tracker', tracker, 'button');
  const media = { matches: compact, addEventListener() {} }, events = [];
  const window = { matchMedia: query => { media.query = query; return media; }, getComputedStyle: node => ({ display: node.style.display || 'block' }),
    addEventListener: (name, fn, capture) => events.push({ name, fn, capture }) };
  const game = { currentStage: { id: 4 }, currentStageIndex: 4, campaignActive: true, isSystemPaused: false, isRunning: true, busy: false,
    isLocomotionBusy() { return this.busy; },
    getLocomotionState() { return { busy: this.busy, hanging: !!this.hanging, ceilingActionPhase: this.capturePhase || null,
      disposalPhase: this.disposalPhase || null, prowlLeaping: Boolean(this.prowlLeaping) }; },
    motionTracker: { isCollapsed: false, deviceEl: tracker }, setHudExpanded(expanded) {
      sidebar.classList.toggle('mobile-collapsed', !expanded); sidebar.inert = !expanded;
      toggle.setAttribute('aria-expanded', String(expanded)); if (!expanded) canvas.focus();
    } };
  // Existing production listener is registered before CampaignUI's enhancer.
  toggle.addEventListener('click', () => game.setHudExpanded(toggle.getAttribute('aria-expanded') !== 'true'));
  const observers = [];
  class ObserverFixture {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe(target, options) { this.target = target; this.options = options; }
    takeRecords() { return []; }
  }
  const context = vm.createContext({ window, document, Element: ElementFixture, HTMLElement: ElementFixture,
    ...(withObservers ? { MutationObserver: ObserverFixture } : {}) });
  const CampaignUI = vm.runInContext(source.slice(start, end) + '\nCampaignUI', context);
  const ui = new CampaignUI({}, {}); ui.game = game; ui.content = { castes: { ovomorphe: {} } };
  ui.hasAnyVisibleModal = () => false;
  const action = (id, text, disabled = false) => { const a = make(id, actions, 'button', 'act-btn'); a.textContent = text; a.disabled = disabled; return a; };
  return { document, window, game, ui, app, sidebar, actions, toggle, canvas, tracker, trackerToggle, media, events, action, make, observers };
}
test('Production UI parses; compact media covers portrait and short landscape', () => {
  new vm.Script(source, { filename: 'src/game-systems.js' });
  const f = fixture(); f.ui.bindCompactHud();
  assert.match(f.media.query, /max-width: 680px/); assert.match(f.media.query, /max-height: 480px/);
});
test('Compact drawer starts inert/closed while vitals and real action aliases remain available', () => {
  const f = fixture(); f.action('leap', 'Bondir'); f.ui.bindCompactHud();
  assert(f.sidebar.inert); assert.equal(f.toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(f.document.getElementById('hud-compact-status').textContent, 'PV 30/235 · RÉSERVE 70%');
  assert.equal(f.document.getElementById('hud-quick-actions').children.length, 1);
  assert(f.tracker.classList.contains('collapsed')); assert.equal(f.trackerToggle.getAttribute('aria-expanded'), 'false');
});
test('Opening drawer uses the installed toggle, exposes/focuses the real action, Escape restores trigger without pause', () => {
  const f = fixture(), action = f.action('leap', 'Bondir'); f.ui.bindCompactHud(); f.toggle.click();
  assert(!f.sidebar.inert); assert(f.app.classList.contains('hud-drawer-open')); assert.equal(f.document.activeElement, action);
  let prevented = false, stopped = false;
  f.events.find(e => e.name === 'keydown' && e.capture).fn({ key: 'Escape', preventDefault() { prevented = true; }, stopImmediatePropagation() { stopped = true; } });
  assert(prevented && stopped); assert(f.sidebar.inert); assert.equal(f.document.activeElement, f.toggle); assert.equal(f.game.isSystemPaused, false);
});
test('Quick action forwards the current real button only; disabled/hidden/modal actions cannot execute', () => {
  const f = fixture(), a = f.action('jaw', 'Mâchoire'), b = f.action('blocked', 'Pas prêt', true); let calls = 0;
  a.addEventListener('click', () => calls++); f.action('hidden', 'Caché').style.display = 'none'; f.ui.bindCompactHud();
  const aliases = f.document.getElementById('hud-quick-actions'); assert.equal(aliases.children.length, 1);
  aliases.children[0].click(); assert.equal(calls, 1);
  a.disabled = true; aliases.children[0].click(); assert.equal(calls, 1);
  a.disabled = false; f.ui.hasAnyVisibleModal = () => true; aliases.children[0].click(); assert.equal(calls, 1);
  f.ui.hasAnyVisibleModal = () => false; a.style.display = 'none'; aliases.children[0].click(); assert.equal(calls, 1);
  assert(b.disabled);
});
test('Aliases cannot bypass a new locomotion transition or pause before visual lock synchronization', () => {
  const f = fixture(), a = f.action('jaw', 'Mâchoire'); let calls = 0;
  a.addEventListener('click', () => calls++); f.ui.bindCompactHud();
  const alias = f.document.getElementById('hud-quick-actions').children[0];
  f.game.busy = true; alias.click(); assert.equal(calls, 0);
  f.game.busy = false; f.game.isSystemPaused = true; alias.click(); assert.equal(calls, 0);
  f.game.isSystemPaused = false; f.game.campaignActive = false; alias.click(); assert.equal(calls, 0);
});
test('Locomotion disables physical actions, leaves Q available, and restores authored disabled states', () => {
  const f = fixture(), a = f.action('jaw', 'Mâchoire'), prerequisite = f.action('cocoon', 'Cocon', true), q = f.action('btn-drone-ceiling', 'Plafond');
  f.ui.bindCompactHud(); f.ui.bindLocomotionGuard();
  f.game.busy = true; f.ui.syncLocomotionActions();
  assert(a.disabled && prerequisite.disabled); assert.equal(a.getAttribute('aria-disabled'), 'true'); assert(!q.disabled);
  assert.equal(f.document.getElementById('hud-quick-actions').children[0].dataset.sourceAction, 'btn-drone-ceiling');
  f.game.busy = false; f.ui.syncLocomotionActions();
  assert(!a.disabled); assert(prerequisite.disabled); assert.equal(a.getAttribute('aria-disabled'), null);
  assert(!('locomotionLocked' in a.dataset));
});
test('Authored prerequisite/cooldown changes during a temporary lock survive its removal', () => {
  const f = fixture(), a = f.action('jaw', 'Mâchoire'), b = f.action('cocoon', 'Cocon', true);
  f.ui.bindLocomotionGuard(); f.game.busy = true; f.ui.syncLocomotionActions();
  // Explicit MutationObserver records emulate native attribute reflection; no
  // browser-layout/observer scheduling claim is made by this DOM fixture.
  f.ui.consumeLocomotionMutations([
    { type: 'attributes', target: a, attributeName: 'disabled', oldValue: null },
    { type: 'attributes', target: a, attributeName: 'aria-disabled', oldValue: null },
    { type: 'attributes', target: b, attributeName: 'aria-disabled', oldValue: null }
  ]);
  a.disabled = true;
  b.disabled = false;
  f.ui.consumeLocomotionMutations([
    { type: 'attributes', target: a, attributeName: 'disabled', oldValue: '' },
    { type: 'attributes', target: b, attributeName: 'disabled', oldValue: '' }
  ]);
  f.ui.syncLocomotionActions(); f.game.busy = false; f.ui.syncLocomotionActions();
  assert(a.disabled, 'New authored cooldown was lost'); assert(!b.disabled, 'Authored prerequisite completion was overwritten');
});
test('A same-tick authored cooldown is consumed before a completed transition restores actions', () => {
  const f = fixture(), a = f.action('jaw', 'Mâchoire');
  f.ui.bindLocomotionGuard(); f.game.busy = true; f.ui.syncLocomotionActions();
  f.ui.consumeLocomotionMutations([
    { type: 'attributes', target: a, attributeName: 'disabled', oldValue: null },
    { type: 'attributes', target: a, attributeName: 'aria-disabled', oldValue: null }
  ]);
  // Native MutationObserver delivery occurs after this synchronous tick. The
  // gameplay cooldown writes while our lock is still present, then ends busy.
  a.disabled = true;
  let pending = [{ type: 'attributes', target: a, attributeName: 'disabled', oldValue: '' }];
  f.ui.locomotionActionsObserver = { takeRecords() { const records = pending; pending = []; return records; } };
  f.game.busy = false; f.ui.syncLocomotionActions();
  assert(a.disabled, 'The final busy tick dropped a pending authored cooldown');
  assert.equal(pending.length, 0, 'Pending authored records were not drained before restore');
});
test('Hanging permits only Q, Space and the unified E/T capture; transit takes precedence without losing authored states', () => {
  const f = fixture(), jaw = f.action('jaw', 'Mâchoire'), space = f.action('btn-claw-swipe', 'Griffes'),
    tail = f.action('btn-tail-impale', 'Queue'), q = f.action('btn-drone-ceiling', 'Plafond'),
    capture = f.action('btn-ceiling-drop-eviscerate', 'Capture', true);
  f.ui.bindCompactHud(); f.ui.bindLocomotionGuard(); f.game.hanging = true; f.ui.syncLocomotionActions();
  assert(jaw.disabled); assert(!space.disabled && !tail.disabled && !q.disabled); assert(capture.disabled, 'Authored capture prerequisite was lost');
  assert(f.app.classList.contains('ceiling-hanging'));
  const aliases = f.document.getElementById('hud-quick-actions').children;
  assert.equal(aliases.length, 3); assert.equal(aliases[0].textContent, 'ATTERRISSAGE OFFENSIF [ESPACE]');
  assert.equal(aliases[1].textContent, 'PRISE CAUDALE SUSPENDUE [E/T]'); assert.equal(aliases[2].textContent, 'DESCENDRE AU SOL [Q]');
  f.game.busy = true; f.ui.syncLocomotionActions(); assert(space.disabled && tail.disabled && capture.disabled); assert(!q.disabled);
  f.game.busy = false; f.game.hanging = false; f.ui.syncLocomotionActions();
  assert(!jaw.disabled && !space.disabled && !tail.disabled && !q.disabled); assert(capture.disabled);
  assert(!f.app.classList.contains('ceiling-hanging'));
});
test('Fresh HANG capture guard blocks ground attacks without blocking the certified ceiling controls', () => {
  const f = fixture(), jaw = f.action('jaw', 'Mâchoire'); f.ui.bindLocomotionGuard(); f.game.hanging = true;
  const guard = f.actions.listeners.get('click')[0]; let stopped = false;
  guard({ target: jaw, preventDefault() {}, stopImmediatePropagation() { stopped = true; } }); assert(stopped);
  for (const id of ['btn-drone-ceiling', 'btn-claw-swipe', 'btn-tail-impale', 'btn-ceiling-drop-eviscerate']) {
    guard({ target: f.action(id, id), preventDefault() { throw Error('Certified control blocked: ' + id); },
      stopImmediatePropagation() { throw Error('Certified control blocked: ' + id); } });
  }
});
test('Q explains capture/hoist and held-host release without inventing an escalation action', () => {
  const f = fixture(); f.action('btn-drone-ceiling', 'Plafond'); f.ui.bindCompactHud(); f.ui.bindLocomotionGuard();
  f.game.busy = true; f.game.hanging = true; f.game.capturePhase = 'HOIST'; f.ui.syncLocomotionActions();
  const alias = f.document.getElementById('hud-quick-actions').children[0];
  assert.equal(alias.textContent, 'CAPTURE / LEVAGE — Q : INTERROMPRE');
  f.game.capturePhase = 'HOLD'; f.ui.syncLocomotionActions();
  assert.equal(alias.textContent, 'PRISE MAINTENUE — Q : LIBÉRER PUIS DESCENDRE');
});
test('Q describes the current incinerator loading phase in both layouts and restores the ceiling action', () => {
  const f = fixture(), q = f.action('btn-drone-ceiling', 'PAROI & PLAFOND');
  const label = f.make('ceiling-label', q, 'span', 'action-label');
  const quick = () => f.document.getElementById('hud-quick-actions').children[0];
  f.ui.bindCompactHud();
  f.ui.bindLocomotionGuard();
  f.game.busy = true;
  for (const [phase, text] of [['OPEN', 'OUVERTURE'], ['LIFT', 'LEVAGE'], ['LOAD', 'CHARGEMENT'],
    ['LOWER', 'DÉPOSE'], ['CLOSE', 'FERMETURE']]) {
    f.game.disposalPhase = phase;
    f.ui.syncLocomotionActions();
    assert.equal(label.textContent, `${text} — ANNULER`);
    assert.equal(quick().textContent, `${text} — ANNULER [Q]`);
    assert.equal(q.disabled, false);
  }
  f.game.disposalPhase = null;
  f.game.busy = false;
  f.ui.syncLocomotionActions();
  assert.equal(label.textContent, 'PAROI & PLAFOND');
});
test('Capture guard blocks direct dispatched actions during transit while Q remains cancellable', () => {
  const f = fixture(), a = f.action('jaw', 'Mâchoire'), q = f.action('btn-drone-ceiling', 'Plafond'); f.ui.bindLocomotionGuard();
  f.game.busy = true;
  let stopped = false, prevented = false;
  const guard = f.actions.listeners.get('click')[0];
  guard({ target: a, preventDefault() { prevented = true; }, stopImmediatePropagation() { stopped = true; } });
  assert(stopped && prevented);
  guard({ target: q, preventDefault() { throw Error('Q cancellation blocked'); }, stopImmediatePropagation() { throw Error('Q cancellation blocked'); } });
});
test('Ground leap does not advertise a ceiling cancellation while the actor is airborne', () => {
  const f = fixture(), q = f.action('btn-drone-ceiling', 'PAROI & PLAFOND');
  const label = f.make('ceiling-label', q, 'span', 'action-label');
  f.ui.bindCompactHud(); f.ui.bindLocomotionGuard();
  f.game.busy = true; f.game.prowlLeaping = true; f.ui.syncLocomotionActions();
  assert(q.disabled);
  assert.equal(label.textContent, 'BOND EN COURS');
  assert.equal(f.document.getElementById('hud-quick-actions').children.length, 0);
  f.game.busy = false; f.game.prowlLeaping = false; f.ui.syncLocomotionActions();
  assert(!q.disabled);
  assert.equal(label.textContent, 'PAROI & PLAFOND');
});
test('Changing viewport opens desktop controls and closes the drawer on returning to compact layout', () => {
  const f = fixture(); f.ui.bindCompactHud(); f.toggle.click(); f.media.matches = false;
  f.events.find(e => e.name === 'resize').fn(); assert(!f.sidebar.inert); assert(!f.app.classList.contains('compact-hud'));
  f.media.matches = true; f.events.find(e => e.name === 'resize').fn(); assert(f.sidebar.inert); assert(!f.app.classList.contains('hud-drawer-open'));
});
test('A stage-driven drawer closure synchronizes its visual state without a synthetic click or resize', () => {
  const f = fixture(true, true); f.action('jaw', 'Mâchoire'); f.ui.bindCompactHud();
  f.toggle.click(); assert(f.app.classList.contains('hud-drawer-open'));
  f.game.setHudExpanded(false);
  const observer = f.observers.find(item => item.target === f.toggle && item.options.attributeFilter?.includes('aria-expanded'));
  assert(observer, 'External authored drawer changes are not observed');
  observer.callback([{ type: 'attributes', target: f.toggle, attributeName: 'aria-expanded', oldValue: 'true' }]);
  assert(!f.app.classList.contains('hud-drawer-open')); assert(f.sidebar.inert);
  assert.equal(f.toggle.textContent, 'ACTIONS'); assert.equal(f.game.isSystemPaused, false);
  f.toggle.click(); assert(f.app.classList.contains('hud-drawer-open')); assert(!f.sidebar.inert);
});
test('Compact action reveal does not animate inherited visibility or delay real keyboard focus', () => {
  const rule=css.match(/#app-container\.compact-hud \.act-btn\s*\{([^}]+)\}/);
  assert(rule, 'Compact action rule missing');
  const properties=rule[1].match(/transition-property\s*:\s*([^;]+);/);
  assert(properties, 'Compact actions still inherit the generic all transition');
  const names=properties[1].split(',').map(name=>name.trim());
  assert.deepEqual(names,['background-color','border-color','color','opacity','transform']);
  assert(!names.some(name=>['all','visibility','display'].includes(name)));
});
test('Biological veil clamps opacity and clears on zero/nonfinite/context reset without changing simulation pause', () => {
  const f = fixture(); assert.equal(f.ui.setBiologicalTransition(2, '<script>'), 1);
  const veil = f.document.getElementById('biological-transition'); assert.equal(veil.style.opacity, '1'); assert.equal(veil.firstElementChild.textContent, '<script>');
  f.game.isSystemPaused = true; f.ui.setBiologicalTransition(.4, 'Pause'); assert.equal(veil.style.opacity, '0.4'); assert(f.game.isSystemPaused);
  f.game.currentStage = {}; f.ui.updateBiologicalTransition(); assert.equal(f.document.getElementById('biological-transition'), null);
  f.ui.setBiologicalTransition(.7); f.ui.setBiologicalTransition(NaN); assert.equal(f.document.getElementById('biological-transition'), null);
  assert(f.game.isSystemPaused);
});
test('Only unlocked caste entries expose exact-ID Alien Base navigation; no locked or non-caste backdoor', () => {
  const f = fixture(), container = f.make('detail'); let opened = null; f.window.AlienBaseOpenCaste = id => { opened = id; };
  f.ui.renderCodexDetail(container, { id: 'ovomorphe', name: 'Œuf' }, false); assert(!container.children.some(e => e.className === 'ab-codex-link'));
  f.ui.renderCodexDetail(container, { id: 'ovomorphe', name: 'Œuf' }, true);
  const link = container.children.find(e => e.className === 'ab-codex-link'); assert(link); link.click(); assert.equal(opened, 'ovomorphe');
  f.ui.renderCodexDetail(container, { id: 'not-a-caste', name: 'Journal' }, true); assert(!container.children.some(e => e.className === 'ab-codex-link'));
});
test('Every thoracic action remains pointer-accessible above the noninteractive scene overlay', () => {
  assert.match(css, /\.thoracic-controls \.act-btn\s*\{[^}]*pointer-events:\s*auto/s);
  assert.match(css, /\.thoracic-controls \.act-btn\s*\{[^}]*min-height:\s*44px/s);
});
test('Styles reserve separate mobile telemetry/actions and keep simulation veil free of wall-clock transitions', () => {
  assert.match(css, /#biological-transition\s*\{[^}]*transition:\s*none/s);
  assert.match(css, /\.quick-action-btn\s*\{[^}]*min-height:\s*56px/s);
  assert.match(css, /\.tracker-toggle-btn\s*\{[^}]*min-height:\s*44px/s);
  assert(css.includes('body.compact-hud #hud-gyro-compass')); assert(css.includes('#app-container.compact-hud #hud-sidebar.mobile-collapsed'));
  assert.match(css, /#app-container\.compact-hud \.hud-tab-btn,[\s\S]*?\.tracker-toggle-btn\s*\{\s*min-height:\s*44px/);
  assert(css.includes('#app-container.ceiling-hanging #btn-ceiling-drop-eviscerate { display: block !important; }'));
  assert(css.includes('#app-container:not(.ceiling-hanging) #btn-ceiling-drop-eviscerate { display: none !important; }'));
});
console.log(`${passed} HUD coherence groups passed`);
const hashes = Object.fromEntries(['src/game-systems.js', 'src/css/style.css'].map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')]));
console.log('SOURCES ' + JSON.stringify(hashes));
const outputIndex = process.argv.indexOf('--output');
if (outputIndex >= 0) {
  const target = path.resolve(root, process.argv[outputIndex + 1] || '');
  assert(target.startsWith(path.join(root, '.tools') + path.sep), 'Private evidence path required');
  assert(!fs.existsSync(target), 'Do not overwrite earlier evidence');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify({ status: 'passed', groups: passed,
    scope: 'Real CampaignUI methods with labelled DOM/matchMedia/game-interface fixtures; no native layout or human QA claim',
    sourceSha256: hashes, results }, null, 2) + '\n');
}
