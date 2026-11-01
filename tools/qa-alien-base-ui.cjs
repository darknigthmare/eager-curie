/* Minimal, dependency-free DOM harness testing the real Alien Base browser widget. */
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const script = fs.readFileSync(path.join(root, "src/alien-base-library.js"), "utf8");
const v2 = JSON.parse(fs.readFileSync(path.join(root, "data/alien-base.snapshot.v2.json"), "utf8"));
const v1 = JSON.parse(fs.readFileSync(path.join(root, "data/alien-base.snapshot.v1.json"), "utf8"));
async function runCase(fallback) {
  let doc;
  class FakeElement {
    constructor(tag) {
      this.tag = tag; this.id = ""; this.className = ""; this.children = [];
      this.listeners = {}; this.textContent = ""; this.value = ""; this.attributes = {};
      this.hidden = false; this.disabled = false; this.tabIndex = -1;
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
    if (fallback && url.includes("v2")) return {ok:false,status:404};
    return {ok:true,status:200,json:async()=>url.includes("v2")?v2:v1};
  };
  const win = {};
  vm.runInNewContext(script, {window:win,document:doc,fetch,console}, {filename:"alien-base-library.js",timeout:1500});
  await doc.send("DOMContentLoaded");
  const open = boot.children.find(x=>x.id==="btn-open-alien-base-menu");
  assert.ok(open, "Menu entry not mounted");
  await open.send("click");
  const overlay = app.children.find(x=>x.id==="alien-base-overlay");
  assert.ok(overlay && !overlay.hidden);
  const children = overlay.children[0].children;
  const controls = children.find(x=>x.className==="ab-controls");
  const list = overlay.querySelectorAll("button.ab-record");
  const expected = fallback ? 58 : 380;
  assert.equal(win.AlienBaseReference.listSharedRecords().length,expected);
  assert.equal(win.AlienBaseReference.getSharedIdForCaste("ovomorphe"),"xeno:ovomorph");
  assert.ok(win.AlienBaseReference.getSharedRecord("xeno:ovomorph"));
  assert.equal(win.AlienBaseReference.getSharedRecord("invalid-identity"),null);
  if (!fallback) {
    assert.equal(win.AlienBaseReference.getCanonicalIdForCaste("runner"),"ha.bio.runner");
    assert.equal(win.AlienBaseReference.getCanonicalIdForCaste("ovomorphe"),"bio.xenomorph.ovomorph");
    assert.equal(list.length,380 + 16 + 10 + 4 + 5 + 21);
    const query = controls.children[0].children.find(x=>x.tag==="input");
    const filter = controls.children[1].children.find(x=>x.tag==="select");
    filter.value="shared:opposition"; await filter.send("change");
    assert.equal(overlay.querySelectorAll("button.ab-record").length,10);
    filter.value="all"; query.value="offspring"; await query.send("input");
    assert.ok(overlay.querySelectorAll("button.ab-record").length >=2);
    query.value="";await query.send("input");
    const first = overlay.querySelectorAll("button.ab-record")[0];
    await first.send("click");
    assert.equal(first.getAttribute("aria-pressed"),"true");
  } else {
    assert.ok(calls[0].includes("v2") && calls[1].includes("v1"),"Fallback did not use the preserved v1 catalog");
  }
  const close = overlay.querySelectorAll("button.ab-record");
  assert.ok(close.length>0);
  await doc.send("keydown",{key:"Escape",preventDefault(){},stopImmediatePropagation(){}});
  assert.equal(overlay.hidden,true);
  assert.equal(overlay.getAttribute("aria-hidden"),"true");
  return calls;
}
(async()=>{
  await runCase(false);
  await runCase(true);
  console.log("Alien Base UI : modal, recherche, filtres, action clavier et repli v1 OK");
})().catch(e=>{console.error(e);process.exitCode=1});
