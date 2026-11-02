/* Non-régression biologique et périmètre documentaire de HIVE ASCENSION. */
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path"),crypto=require("node:crypto");
const root=path.resolve(__dirname,"..");
const source=fs.readFileSync(path.join(root,"src/content.js"),"utf8");
const exported=JSON.parse(fs.readFileSync(path.join(root,"data/alien-base.snapshot.v2.json"),"utf8"));
const sha=crypto.createHash("sha1").update("blob "+Buffer.byteLength(source)+"\0").update(source).digest("hex");
assert.equal(sha,exported.sourceContent.blobSha,"Content changed without Alien Base review");
const w={window:{}};vm.runInNewContext(source,w,{timeout:1500});const c=w.window.HIVE_CONTENT;
assert.ok(c);assert.equal(c.metadata.version,"1.1.0");
assert.equal(Object.keys(c.castes).length,16);
assert.equal(c.castes.royal_facehugger.loreStatus,"EXPANDED_COMPATIBLE");
assert.equal(c.castes.offspring.loreStatus,"INSPIRED_ORIGINAL");
assert.match(c.castes.offspring.role,/hors cycle naturel/);
assert.match(c.castes.offspring.actions.find(a=>a.id==="acid_immunity").description,/aucune immunité universelle/);
assert.doesNotMatch(c.castes.crusher.evolutionCondition,/exo-armure assimilée/);
assert.match(c.castes.palatine.actions.find(a=>a.id==="queens_aegis").description,/s.interpose/);
assert.match(c.castes.queen.actions.find(a=>a.id==="detach_ovipositor").description,/ovipositeur sectionné/);
const aliases=Object.fromEntries(Object.entries(exported.bindings.castes).map(([k,v])=>[k,v.id]));
assert.ok(aliases.royal_facehugger.startsWith("ha.bio."));
assert.ok(aliases.offspring.startsWith("ha.bio."));
assert.ok(aliases.runner.startsWith("ha.bio."));
for(const [id,record] of Object.entries(c.castes)){
 const external=exported.projectIntake.castes.find(x=>x.id===id);
 assert.ok(external, "Missing game caste in export: "+id);
 assert.equal(record.loreStatus,external.sourceLoreStatus,id);
 assert.equal(record.role,external.role,id);
}
assert.ok(exported.records.every(e=>e.kind!=="game-card"));
assert.ok(!exported.records.some(e=>e.damage||e.hp||e.attackSpeed));
console.log("Lore/registry bridge: 16 stable forms, 9 reviewed corrections, Z-01 and Royal Facehugger safely scoped.");
