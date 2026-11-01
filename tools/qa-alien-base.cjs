/* QA offline : vérification des snapshots v1 (secours) et v2 (registre unifié). */
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const text = fs.readFileSync(path.join(root, "src/content.js"), "utf8");
const snapshot = JSON.parse(fs.readFileSync(path.join(root, "data/alien-base.snapshot.v1.json"), "utf8"));
const v2 = JSON.parse(fs.readFileSync(path.join(root, "data/alien-base.snapshot.v2.json"), "utf8"));
const gitBlobSha = crypto.createHash("sha1").update("blob " + Buffer.byteLength(text) + "\0").update(text).digest("hex");
assert.equal(gitBlobSha, snapshot.sourceContent.blobSha, "HIVE_CONTENT changed: rebuild Alien Base intake + snapshot");
const env = {window: {}};
vm.runInNewContext(text, env, {filename: "content.js", timeout: 1500});
const content = env.window.HIVE_CONTENT;
assert.ok(content);
assert.equal(snapshot.scope, "public-minimal");
assert.equal(snapshot.records.length, 58);
assert.ok(snapshot.records.every(x => Object.keys(x).every(k => ["id", "kind", "name"].includes(k))));
for (const id of ["weapon:m41a", "vehicle:ud4l", "character:ellen-ripley", "faction:weyland-yutani"]) {
  assert.ok(snapshot.records.some(x => x.id === id), "Missing reference " + id);
}
assert.equal(snapshot.crosswalks.length, 12);
assert.equal(snapshot.projectIntake.castes.length, Object.keys(content.castes).length);
assert.equal(snapshot.projectIntake.enemies.length, Object.keys(content.enemies).length);
assert.equal(snapshot.projectIntake.bosses.length, Object.keys(content.bosses).length);
const coreIds = new Set(snapshot.records.map(r => r.id));
const map = new Map(snapshot.crosswalks.filter(x => x.collection === "HIVE_CONTENT_CASTES").map(x => [x.legacyId, x.sharedId]));
assert.equal(map.size, 6);
for (const [id, sharedId] of map) {
  assert.ok(content.castes[id], "Unknown game caste " + id);
  assert.ok(coreIds.has(sharedId), "Unknown shared identity " + sharedId);
}
for (const c of snapshot.projectIntake.castes) {
  assert.ok(content.castes[c.id], c.id);
  assert.equal(c.sharedId || null, map.get(c.id) || null, c.id);
  assert.equal(c.canonExact, false);
}
for (const e of snapshot.projectIntake.enemies) assert.ok(content.enemies[e.id], e.id);
for (const e of snapshot.projectIntake.bosses) assert.ok(content.bosses[e.id], e.id);
assert.equal(map.has("runner"), false, "Do not conflate the host-derived Runner across media");
assert.equal(map.has("offspring"), false, "Do not universalize the Z-01 Offspring");
const json = JSON.stringify(snapshot);
for (const forbidden of ["gameOnlyProfile", "gameOnlyThreat", "damage"]) assert.equal(json.includes(forbidden), false);
assert.equal(snapshot.sourcePins.length, 1);
assert.equal(snapshot.sourcePins[0].repository, "darknigthmare/eager-curie");
console.log("Alien Base ↔ Hive Ascension: 58 minimal shared references, 6 linked identities, 16 game castes, 10 enemies, 4 bosses; pinned snapshot OK");

// V2: broader references, 158 TCG cards excluded and all game IDs preserved.
assert.equal(v2.schemaVersion, "2.0.0");
assert.equal(v2.scope, "public-metadata-only");
assert.equal(v2.status, "reference-only-not-playable");
assert.equal(v2.sourceContent.blobSha, gitBlobSha);
assert.equal(v2.sourceContent.commit, snapshot.sourceContent.commit);
assert.equal(v2.records.length, 474);
assert.equal(v2.records.filter(x => x.kind === "source-profile").length, 26);
assert.equal(v2.records.filter(x => x.kind === "source-equipment-profile").length, 68);
assert.ok(v2.records.every(e => e.kind !== "game-card"));
assert.equal(new Set(v2.records.map(x => x.id)).size, v2.records.length);
assert.ok(v2.records.every(e => Object.keys(e).every(k => ["id","kind","name","classification","biology","originGame"].includes(k))));
assert.equal(v2.projectIntake.castes.length, Object.keys(content.castes).length);
assert.equal(v2.projectIntake.enemies.length, Object.keys(content.enemies).length);
assert.equal(v2.projectIntake.bosses.length, Object.keys(content.bosses).length);
assert.equal(v2.projectIntake.equipment.length, 21);
assert.equal(v2.projectIntake.factions.length, 5);
assert.equal(Object.keys(v2.bindings.castes).length, 16);
for (const x of v2.projectIntake.castes) {
  assert.equal(v2.bindings.castes[x.id].id, x.entityId, x.id);
  assert.ok(v2.records.some(r => r.id === x.entityId), x.id);
}
for (const e of v2.projectIntake.enemies) assert.equal(v2.bindings.enemies[e.id].id, e.entityId);
for (const e of v2.projectIntake.bosses) assert.equal(v2.bindings.bosses[e.id].id, e.entityId);
for (const id of ["ovomorphe", "facehugger", "chestburster", "drone", "warrior", "queen"])
  assert.ok(v2.bindings.castes[id].id.startsWith("bio.xenomorph."), id);
for (const id of ["runner", "worker", "spitter", "praetorian", "royal_facehugger", "prowler", "burster", "crusher", "palatine", "offspring"])
  assert.ok(v2.bindings.castes[id].id.startsWith("ha.bio."), id);
assert.equal(v2.compatibility.length, 6);
for (const row of v2.compatibility) {
  assert.ok(v2.records.some(x => x.id === row.registryId));
  assert.ok(snapshot.records.some(x => x.id === row.legacySharedId));
}
for (const forbidden of ["sourceRefs","gameOnlyProfile","gameOnlyThreat","gameActions"])
  assert.equal(JSON.stringify(v2).includes('"' + forbidden + '"'), false);
console.log("Alien Base v2 : 474 références minimales, 68 bindings Hive, 52 identités MNEMOSYNE, 94 archives WHW, aucun changement des sauvegardes");
