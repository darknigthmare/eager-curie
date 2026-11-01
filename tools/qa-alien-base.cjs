/* Offline drift checks for the pinned public-minimal Alien Base snapshot. */
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const text = fs.readFileSync(path.join(root, "src/content.js"), "utf8");
const snapshot = JSON.parse(fs.readFileSync(path.join(root, "data/alien-base.snapshot.v1.json"), "utf8"));
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
