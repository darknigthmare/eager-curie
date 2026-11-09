"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const read=name=>JSON.parse(fs.readFileSync(path.join(__dirname,"..","data",name),"utf8"));
const media=read("alien-base.media.v2.json"),entities=read("alien-base.snapshot.v2.json");
assert.equal(media.schemaVersion,"2.0.0");
assert.equal(media.origin,"darknigthmare/alien_base");
assert.equal(media.scope,"public-minimal-apex-media");
assert.ok(media.records.length>=29 && media.records.length<=1000);
assert.equal(entities.records.length,494);
assert.equal(new Set(media.records.map(r=>r.id)).size,media.records.length);
const keys=["continuity","fidelityVerified","id","localId","medium","provenanceTier","publicationStatus","sourceReview","title","year"].sort().join("|");
for(const r of media.records){
 assert.equal(Object.keys(r).sort().join("|"),keys,r.id);
 assert.equal(r.id,"work."+r.localId);
 assert.equal(r.fidelityVerified,false,r.id);
 assert.equal(r.sourceReview,"project-declared-not-primary-verified",r.id);
 assert.ok(!entities.records.some(e=>e.id===r.id),r.id);
}
for(const id of ["work.film_avp_2004","work.film_avpr_2007","work.game_avp_extinction","work.film_predator_1987"])
 assert.ok(media.records.some(r=>r.id===id),id);
const statuses=new Set(media.records.map(r=>r.publicationStatus));
for(const s of ["RELEASED","PROMO","CUT","UNRELEASED","ALT_CROSSOVER"])assert.ok(statuses.has(s),s);
for(const key of ['"sourceUrl"','"sourceRef"','"blobSha"','"health"','"damage"','"assets"','"canonVerified"'])
 assert.equal(JSON.stringify(media).includes(key),false,key);
assert.equal(entities.projectIntake.castes.length,16);
console.log("Alien Base: "+media.records.length+" documentary works; 494 distinct reference entities intact.");
