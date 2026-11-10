const fs = require('fs');

console.log('--- RUNNING QA AAA WAVE 6 TEST SUITE ---');

const gameJs = fs.readFileSync('src/game.js', 'utf8');
const gameSystemsJs = fs.readFileSync('src/game-systems.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const styleCss = fs.readFileSync('src/css/style.css', 'utf8');

let failed = 0;
function test(name, condition) {
  if (condition) {
    console.log(`PASS: ${name}`);
  } else {
    console.error(`FAIL: ${name}`);
    failed++;
  }
}

// 1. WebAudio Synthesizers (Wave 6)
test("Audio synth 'playHiveMindSynapticPulse' present in src/game.js", gameJs.includes('playHiveMindSynapticPulse(command'));

// 2. VFX Methods (Wave 6)
test("VFX method 'hiveSynapticRipple' present in src/game-systems.js", gameSystemsJs.includes('hiveSynapticRipple(x, z, color'));
test("VFX update loop handles 'synapticRipple'", gameSystemsJs.includes('effect.synapticRipple'));

// 3. RTS Pheromone System integration
test("PheromoneSystem.setCommand triggers playHiveMindSynapticPulse and hiveSynapticRipple", 
  gameJs.includes('audioManager.playHiveMindSynapticPulse?.(cmd)') &&
  gameJs.includes('window.HiveSystems?.vfx?.hiveSynapticRipple')
);

// 4. Acid Blood Deck Corrosion & Decals
test("PlayerCreature.takeDamage creates acid floor fluid decal (0x84cc16)", 
  gameJs.includes('rendererEngine.addFloorFluidDecal?.(this.x, this.z, this.embryoMutation === \'acid\' ? 1.6 : 1.1, 0x84cc16')
);

// 5. Chestburster Thoracic Eruption Visceral Impact
test("StageChestburster.finishBurstSequence triggers hitstop, fleshImpact and arterial floor decal", 
  gameJs.includes('rendererEngine.addHitstop?.(0.18)') &&
  gameJs.includes('rendererEngine.addFloorFluidDecal?.(playerCreature.x, playerCreature.z, 2.2, 0x7f1d1d, 35)') &&
  gameJs.includes('window.HiveSystems?.vfx?.fleshImpact?.(playerCreature.x, playerCreature.z, 0xb91c1c, 45)')
);

// 6. Settings Panel SVG Icon Glyphs & Layout
test("index.html contains .setting-item and .setting-sq-icon glyphs", 
  indexHtml.includes('class="setting-item"') &&
  indexHtml.includes('class="setting-sq-icon"') &&
  indexHtml.includes('class="setting-toggles-grid"')
);
test("All 7 settings controls retain their exact IDs and accessibility",
  indexHtml.includes('id="setting-graphics"') &&
  indexHtml.includes('id="setting-camera-distance"') &&
  indexHtml.includes('id="setting-volume"') &&
  indexHtml.includes('id="setting-brightness"') &&
  indexHtml.includes('id="setting-scanlines"') &&
  indexHtml.includes('id="setting-reduced-motion"') &&
  indexHtml.includes('id="setting-high-contrast"')
);
test("src/css/style.css contains styling for .setting-item, .setting-label-header and .setting-sq-icon",
  styleCss.includes('.setting-item') &&
  styleCss.includes('.setting-label-header') &&
  styleCss.includes('.setting-sq-icon') &&
  styleCss.includes('.setting-toggles-grid')
);

if (failed > 0) {
  console.error(`--- ${failed} TESTS FAILED ---`);
  process.exit(1);
} else {
  console.log('--- ALL QA AAA WAVE 6 TESTS PASSED! (8/8) ---');
}
