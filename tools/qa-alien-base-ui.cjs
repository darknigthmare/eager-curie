/* Strict DOM/system-modal fixtures testing the real reference widget.
 * These contracts are not native browser, rendering or human QA. */
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const script = fs.readFileSync(path.join(root, "src/alien-base-library.js"), "utf8");
const v2 = JSON.parse(fs.readFileSync(path.join(root, "data/alien-base.snapshot.v2.json"), "utf8"));
const v1 = JSON.parse(fs.readFileSync(path.join(root, "data/alien-base.snapshot.v1.json"), "utf8"));
const media = JSON.parse(fs.readFileSync(path.join(root,"data/alien-base.media.v2.json"),"utf8"));
async function runCase(fallback, modalMode = "standalone") {
  let doc;
  class FakeElement {
    constructor(tag) {
      this.tag = tag; this.id = ""; this.className = ""; this.children = [];
      this.listeners = {}; this.textContent = ""; this.value = ""; this.attributes = {};
      this.hidden = false; this.disabled = false; this.tabIndex = -1;
      this.classList = {
        contains: value => this.className.split(/\s+/).includes(value),
        add: value => { if (!this.classList.contains(value)) this.className += " " + value; },
        remove: value => { this.className = this.className.split(/\s+/).filter(x => x !== value).join(" "); }
      };
    }
    append(...children) { for (const child of children) { this.children.push(child); child.parentElement = this;
      if (this.tag === "select" && this.children.length === 1) this.value = child.value; } }
    appendChild(child) { this.append(child); return child; }
    replaceChildren(...children) { this.children = []; this.append(...children); }
    setAttribute(key, value) { this.attributes[key] = String(value); }
    getAttribute(key) { return this.attributes[key]; }
    addEventListener(kind, callback) { (this.listeners[kind] ||= []).push(callback); }
    async send(kind, evt = {}) { for (const fn of this.listeners[kind] || []) await fn(evt); }
    focus() { doc.activeElement = this; }
    querySelectorAll(selector) {
      const out = [], walk = e => { for (const c of e.children) {
        const match = selector === "button.ab-record" ?
          c.tag === "button" && c.className.split(/\s+/).includes("ab-record") :
          ["button", "input", "select"].includes(c.tag) || c.tabIndex === 0;
        if (match) out.push(c); walk(c);
      }};
      walk(this); return out;
    }
  }
  const app = new FakeElement("div"), boot = new FakeElement("div"), hud = new FakeElement("div");
  doc = {
    activeElement: boot, createElement: tag => new FakeElement(tag),
    querySelector: selector => selector === "#boot-screen .front-actions" ? boot :
      selector === "#hud-header .utility-controls" ? hud : null,
    getElementById: id => id === "app-container" ? app : null,
    contains: () => true,
    listeners: {},
    addEventListener(kind, callback) { (this.listeners[kind] ||= []).push(callback); },
    async send(kind, event) { for (const fn of this.listeners[kind] || []) await fn(event); }
  };
  const calls = [];
  const fetch = async url => {
    calls.push(url);
    if (url.includes("alien-base.media.v2.json")) return fallback ? {ok:false,status:404} : {ok:true,status:200,json:async()=>media};
    if (fallback && url.includes("v2")) return {ok:false,status:404};
    return {ok:true,status:200,json:async()=>url.includes("v2")?v2:v1};
  };
  const pauseCalls = [], layerCalls = [];
  const priorPause = !["active", "late-progress"].includes(modalMode);
  const game = {campaignActive: true, isSystemPaused: priorPause,
    setSystemPaused(value) { this.isSystemPaused = !!value; pauseCalls.push(this.isSystemPaused); }};
  const previousLayer = modalMode === "codex" ? new FakeElement("section") : null;
  if (previousLayer) { previousLayer.id = "codex-overlay"; previousLayer.className = "system-overlay"; }
  const codexReference = new FakeElement("button");
  if (previousLayer) previousLayer.appendChild(codexReference);
  let activeLayer = previousLayer;
  let progressBlocked = modalMode === "blocked";
  const ui = {
    game,
    focusOrigins: new WeakMap(),
    hasBlockingProgressModal: () => progressBlocked,
    hasAnyVisibleModal: () => progressBlocked || !!activeLayer,
    visibleSystemLayer: () => activeLayer,
    showLayer(layer, pause) {
      layerCalls.push({action: "show", id: layer.id, pause});
      if (activeLayer && activeLayer !== layer) { activeLayer.classList.add("hidden"); this.focusOrigins.delete(activeLayer); }
      this.focusOrigins.set(layer, doc.activeElement);
      layer.classList.remove("hidden"); layer.setAttribute("aria-hidden", "false");
      activeLayer = layer; if (pause) game.setSystemPaused(true); return true;
    },
    hideLayer(layer, resume) {
      layerCalls.push({action: "hide", id: layer.id, resume});
      const origin = this.focusOrigins.get(layer); this.focusOrigins.delete(layer);
      layer.classList.add("hidden"); layer.setAttribute("aria-hidden", "true");
      activeLayer = null; if (resume) game.setSystemPaused(false);
      if (origin) origin.focus();
    }
  };
  if (previousLayer) ui.focusOrigins.set(previousLayer, hud);
  const win = modalMode === "standalone" ? {} : {HiveSystems: {ui}, gameInstance: game};
  vm.runInNewContext(script, {window:win,document:doc,fetch,console}, {filename:"alien-base-library.js",timeout:1500});
  await doc.send("DOMContentLoaded");
  const open = boot.children.find(x=>x.id==="btn-open-alien-base-menu");
  assert.ok(open, "Menu entry not mounted");
  if (previousLayer) codexReference.focus();
  await open.send("click");
  const overlay = app.children.find(x=>x.id==="alien-base-overlay");
  if (modalMode === "blocked") {
    assert(overlay?.hidden, "Progression/ending modal must not be replaced");
    assert.equal(calls.length, 0, "A rejected opening must not load or reveal reference data");
    assert.equal(layerCalls.length, 0);
    assert.equal(win.AlienBaseReference, undefined);
    assert.equal(await win.AlienBaseOpenCaste("queen"), false);
    return;
  }
  assert.ok(overlay && !overlay.hidden);
  if (modalMode !== "standalone") {
    assert.equal(game.isSystemPaused, true, "Archives must pause actual gameplay through the modal contract");
    assert.equal(activeLayer, overlay);
    assert(overlay.classList.contains("system-overlay") && !overlay.classList.contains("hidden"));
  }
  const children = overlay.children[0].children;
  const controls = children.find(x=>x.className==="ab-controls");
  const list = overlay.querySelectorAll("button.ab-record");
  const expected = fallback ? 58 : 494;
  assert.equal(win.AlienBaseReference.listSharedRecords().length,expected);
  assert.equal(win.AlienBaseReference.getSharedIdForCaste("ovomorphe"),"xeno:ovomorph");
  assert.ok(win.AlienBaseReference.getSharedRecord("xeno:ovomorph"));
  const copied = win.AlienBaseReference.getSharedRecord("xeno:ovomorph");
  const originalName = copied.name;
  copied.name = "external mutation attempt";
  assert.equal(win.AlienBaseReference.getSharedRecord("xeno:ovomorph").name, originalName,
    "A read-only reference API must not let callers mutate the archive");
  assert.equal(win.AlienBaseReference.getSharedRecord("invalid-identity"),null);
  if (!fallback) {
    assert.equal(win.AlienBaseReference.getCanonicalIdForCaste("runner"),"ha.bio.runner");
    assert.equal(win.AlienBaseReference.getCanonicalIdForCaste("ovomorphe"),"bio.xenomorph.ovomorph");
    assert.equal(list.length,494 + 16 + 10 + 4 + 5 + 21 + media.records.length);
    assert.equal(win.AlienBaseReference.listWorks().length,media.records.length);
    assert.equal(win.AlienBaseReference.getWork("work.film_avp_2004")?.title,"Alien vs. Predator");
    assert.equal(win.AlienBaseReference.getWork("missing"),null);
    const query = controls.children.find(x=>x.tag==="input");
    const filter = controls.children.find(x=>x.tag==="select");
    filter.value="works"; await filter.send("change");
    assert.equal(overlay.querySelectorAll("button.ab-record").length,media.records.length);
    filter.value="shared:opposition"; await filter.send("change");
    assert.equal(overlay.querySelectorAll("button.ab-record").length,10);
    filter.value="shared:source-equipment-profile"; await filter.send("change");
    assert.equal(overlay.querySelectorAll("button.ab-record").length,68);
    filter.value="shared:source-profile"; await filter.send("change");
    assert.equal(overlay.querySelectorAll("button.ab-record").length,26);
    filter.value="shared:character"; await filter.send("change");
    assert.equal(overlay.querySelectorAll("button.ab-record").length,54);
    filter.value="shared:equipment"; await filter.send("change");
    assert.equal(overlay.querySelectorAll("button.ab-record").length,154);
    filter.value="shared:vehicle"; await filter.send("change");
    assert.equal(overlay.querySelectorAll("button.ab-record").length,40);
    filter.value="all"; query.value="offspring"; await query.send("input");
    assert.ok(overlay.querySelectorAll("button.ab-record").length >=2);
    query.value="";await query.send("input");
    assert.equal(typeof win.AlienBaseOpenCaste, "function");
    assert.equal(await win.AlienBaseOpenCaste("queen"), true);
    assert.equal(overlay.querySelectorAll("button.ab-record").length, 16);
    assert.equal(overlay.hidden, false);
    assert.equal(await win.AlienBaseOpenCaste("nonexistent-caste"), false);
    const first = overlay.querySelectorAll("button.ab-record")[0];
    await first.send("click");
    assert.equal(first.getAttribute("aria-pressed"),"true");
  } else {
    assert.ok(calls[0].includes("v2") && calls[1].includes("v1"),"Fallback did not use the preserved v1 catalog");
    assert.equal(win.AlienBaseReference.listWorks().length,0);
  }
  const close = overlay.querySelectorAll("button.ab-record");
  assert.ok(close.length>0);
  if (modalMode === "late-progress") {
    progressBlocked = true;
    await doc.send("keydown", {key:"Escape",preventDefault(){},stopImmediatePropagation(){}});
    assert.equal(overlay.hidden, true);
    assert.equal(game.isSystemPaused, true, "Closing Archives resumed a newly visible progression modal");
    return;
  }
  if (modalMode === "superseded") {
    const replacement = new FakeElement("section");
    replacement.id = "settings-overlay"; replacement.className = "system-overlay";
    ui.showLayer(replacement, true);
    let intercepted = 0;
    await doc.send("keydown", {key:"Escape",preventDefault(){intercepted++;},stopImmediatePropagation(){intercepted++;}});
    assert.equal(intercepted, 0, "A hidden archive intercepted the active modal's Escape key");
    assert.equal(activeLayer, replacement);
    assert.equal(await win.AlienBaseOpenCaste("queen"), true, "A class-hidden archive failed to reopen");
    assert(!overlay.classList.contains("hidden"));
    await doc.send("keydown", {key:"Escape",preventDefault(){},stopImmediatePropagation(){}});
    assert.equal(activeLayer, replacement, "Reopened Archives restored stale context instead of the active modal");
    assert.equal(game.isSystemPaused, true);
    return;
  }
  await doc.send("keydown",{key:"Escape",preventDefault(){},stopImmediatePropagation(){}});
  assert.equal(overlay.hidden,true);
  assert.equal(overlay.getAttribute("aria-hidden"),"true");
  if (modalMode !== "standalone") {
    assert.equal(game.isSystemPaused, priorPause, "Closing archives changed the previous pause state");
    assert.equal(activeLayer, previousLayer, "Closing archives lost the previous Codex layer");
    assert(layerCalls.some(x => x.action === "hide" && x.resume === false), "Do not resume before restoring the previous layer");
    if (previousLayer) {
      assert(!previousLayer.classList.contains("hidden"), "Codex should return without a rerender");
      assert.equal(ui.focusOrigins.get(previousLayer), hud, "Archive round trip lost the Codex's original HUD/menu focus target");
      assert.equal(doc.activeElement, codexReference, "Returning to Codex lost its reference control");
      ui.hideLayer(previousLayer, true);
      assert.equal(doc.activeElement, hud, "Closing the restored Codex failed to return focus to the HUD");
      assert.equal(game.isSystemPaused, false, "Closing Codex should follow its own resume contract");
    }
    const count = pauseCalls.length;
    await doc.send("keydown",{key:"Escape",preventDefault(){},stopImmediatePropagation(){}});
    assert.equal(pauseCalls.length, count, "Repeated close must be idempotent");
  }
  return calls;
}
(async()=>{
  await runCase(false);
  await runCase(true);
  await runCase(false, "active");
  await runCase(false, "paused");
  await runCase(false, "codex");
  await runCase(false, "blocked");
  await runCase(false, "superseded");
  await runCase(false, "late-progress");
  console.log("Alien Base UI: 8 DOM/modal fixtures passed (v2, fallback, pause/resume, retained pause, Codex return, blocked progress, superseded modal, late progression)");
})().catch(e=>{console.error(e);process.exitCode=1});
