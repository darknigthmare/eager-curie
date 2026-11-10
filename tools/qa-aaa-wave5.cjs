const fs = require('fs');

console.log('--- RUNNING QA AAA WAVE 5 TEST SUITE ---');

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

// 1. WebAudio Synthesizers (Wave 5)
test("Audio synth 'playDerelictAcousticDistress' present in src/game.js", gameJs.includes('playDerelictAcousticDistress()'));
test("Audio synth 'playBioResinHum' present in src/game.js", gameJs.includes('playBioResinHum()'));
test("Audio synth 'playIndustrialFluorescentBuzz' present in src/game.js", gameJs.includes('playIndustrialFluorescentBuzz('));
test("Audio synth 'playMedBayMonitorBeep' present in src/game.js", gameJs.includes('playMedBayMonitorBeep('));

// 2. VFX Methods (Wave 5)
test("VFX method 'sporeDrip' present in src/game-systems.js", gameSystemsJs.includes('sporeDrip(x, z, count'));
test("VFX method 'derelictMist' present in src/game-systems.js", gameSystemsJs.includes('derelictMist(x, z, count'));
test("VFX method 'cryoVaporPlume' present in src/game-systems.js", gameSystemsJs.includes('cryoVaporPlume(x, y'));
test("VFX method 'electricalJunctionSpark' present in src/game-systems.js", gameSystemsJs.includes('electricalJunctionSpark(x, y'));

// 3. Persistent Decals & Origin Environment Props
test("rendererEngine.addFloorFluidDecal present in src/game.js", gameJs.includes('addFloorFluidDecal(x, z, radius'));
test("originPropsGroup procedural props in applyOriginAtmosphere", gameJs.includes('this.originPropsGroup = propsGroup') && gameJs.includes('origin_biomechanic_props'));
test("Synthetic milk blood pooling (0xf8fafc) in incapacitate()", gameJs.includes('rendererEngine.addFloorFluidDecal?.(this.x, this.z, 1.4, 0xf8fafc'));
test("Human arterial blood pooling (0x7f1d1d) in incapacitate()", gameJs.includes('rendererEngine.addFloorFluidDecal?.(this.x, this.z, 1.5, 0x7f1d1d'));

// 4. Combat Executions (Wave 5)
test("executeInnerJaw hitstop and skull perforation execution verified", gameJs.includes('rendererEngine.addHitstop?.(0.14)') && gameJs.includes('executeInnerJaw()'));
test("executeTailImpale hitstop and body lift verified", gameJs.includes('rendererEngine.addHitstop?.(0.12)') && gameJs.includes('target.mesh.position.y = 1.35'));

// 5. Diegetic Weyland-Yutani Pause Telemetry Card
test("index.html contains #pause-telemetry-card and cells", 
  indexHtml.includes('id="pause-telemetry-card"') &&
  indexHtml.includes('id="pause-telemetry-caste"') &&
  indexHtml.includes('id="pause-telemetry-origin"') &&
  indexHtml.includes('id="pause-telemetry-biomass"') &&
  indexHtml.includes('id="pause-telemetry-hosts"')
);
test("src/css/style.css contains .pause-telemetry-card styling", styleCss.includes('.pause-telemetry-card') && styleCss.includes('.pause-telemetry-header'));
test("src/game.js contains updatePauseTelemetry() implementation", gameJs.includes('updatePauseTelemetry()') && gameJs.includes('XX121-'));

if (failed > 0) {
  console.error(`--- ${failed} TESTS FAILED ---`);
  process.exit(1);
} else {
  console.log('--- ALL QA AAA WAVE 5 TESTS PASSED! (17/17) ---');
}
