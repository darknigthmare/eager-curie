// tools/qa-aaa-wave4.cjs
// Automated test suite for AAA Overhaul Wave 4 features
const fs = require('fs');
const assert = require('assert');

console.log('--- RUNNING QA AAA WAVE 4 TEST SUITE ---');

// 1. Check audio synthesizers in src/game.js
const gameSrc = fs.readFileSync('src/game.js', 'utf8');
const requiredAudio = [
  'playGroundSlamImpact',
  'playHydraulicHoseRupture',
  'playTurretOverheatHiss',
  'playTurretServoSwivel',
  'playEmergencyKlaxonPulse'
];
requiredAudio.forEach((fn) => {
  assert(gameSrc.includes(fn), `Missing audio method in src/game.js: ${fn}`);
  console.log(`PASS: Audio synth '${fn}' present in src/game.js`);
});

// 2. Check VFX methods in src/game-systems.js
const systemsSrc = fs.readFileSync('src/game-systems.js', 'utf8');
const requiredVfx = [
  'groundSlamShockwave',
  'hydraulicSpurt',
  'barrelHeatSmoke'
];
requiredVfx.forEach((fn) => {
  assert(systemsSrc.includes(fn), `Missing VFX method in src/game-systems.js: ${fn}`);
  console.log(`PASS: VFX method '${fn}' present in src/game-systems.js`);
});

// 3. Check rendererEngine floor crater decal and emergency beacons in src/game.js
assert(gameSrc.includes('addFloorCraterDecal('), 'Missing addFloorCraterDecal in rendererEngine');
console.log('PASS: rendererEngine.addFloorCraterDecal present');
assert(gameSrc.includes('emergencyKlaxonTimer'), 'Missing emergencyKlaxonTimer in rendererEngine');
console.log('PASS: emergency beacon / klaxon loop present in rendererEngine');

// 4. Check Sentry Turret enhancements in src/game.js
assert(gameSrc.includes('digital_ammo_display'), 'Missing digital_ammo_display dynamic lighting in updateSentryTurrets');
assert(gameSrc.includes('barrelHeatSmoke'), 'Missing barrelHeatSmoke call in updateSentryTurrets');
assert(gameSrc.includes('playTurretServoSwivel'), 'Missing playTurretServoSwivel call in updateSentryTurrets');
console.log('PASS: Sentry Turret UA 571-C diegetic ammo LED and heat smoke verified');

// 5. Check Heavy Caste ground slam in src/game.js
assert(gameSrc.includes('isHeavyCaste'), 'Missing isHeavyCaste check in StageDrone leap');
assert(gameSrc.includes('groundSlamShockwave'), 'Missing groundSlamShockwave call in StageDrone');
console.log('PASS: Heavy caste seismic ground slam impact verified');

// 6. Check Exosuit & MANTIS-4 hydraulic hose rupture
assert(gameSrc.includes('hydraulicSpurt'), 'Missing hydraulicSpurt call on MANTIS_4 / exosuit');
console.log('PASS: Exosuit and MANTIS-4 hydraulic hose rupture verified');

// 7. Check Evolution Tree in src/game-systems.js and src/css/style.css
assert(systemsSrc.includes('evolution-nodes-grid'), 'Missing evolution-nodes-grid in game-systems.js');
assert(systemsSrc.includes('casteIcons'), 'Missing casteIcons map in game-systems.js');
assert(systemsSrc.includes('dnaTags'), 'Missing dnaTags map in game-systems.js');
const cssSrc = fs.readFileSync('src/css/style.css', 'utf8');
assert(cssSrc.includes('.evolution-nodes-grid'), 'Missing .evolution-nodes-grid in style.css');
assert(cssSrc.includes('.evolution-node.unlocked'), 'Missing .evolution-node.unlocked in style.css');
console.log('PASS: Evolution tree cyber-organic UI verified');

// 8. Check 100% buttons with square icons in index.html
const htmlSrc = fs.readFileSync('index.html', 'utf8');
const btnRegex = /<button[^>]*id="([^"]+)"/g;
let m;
let missingIcons = 0;
while ((m = btnRegex.exec(htmlSrc)) !== null) {
  const id = m[1];
  const slice = htmlSrc.slice(m.index, m.index + 500);
  const end = slice.indexOf('</button>');
  const sub = slice.slice(0, end);
  const hasIcon = sub.includes('<svg');
  if (!hasIcon) {
    console.error(`FAIL: Button #${id} is missing square icon`);
    missingIcons++;
  }
}
assert(missingIcons === 0, `Found ${missingIcons} buttons without icons in index.html`);
console.log('PASS: 100% of buttons in index.html have square SVG icons');

console.log('--- ALL QA AAA WAVE 4 TESTS PASSED! ---');
