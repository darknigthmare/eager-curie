const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const gameSrc = fs.readFileSync(path.join(root, 'src/game.js'), 'utf8');
const systemsSrc = fs.readFileSync(path.join(root, 'src/game-systems.js'), 'utf8');
const contentSrc = fs.readFileSync(path.join(root, 'src/content.js'), 'utf8');
const stationSrc = fs.readFileSync(path.join(root, 'src/station-detail.js'), 'utf8');
const modelsSrc = fs.readFileSync(path.join(root, 'src/models.js'), 'utf8');
const cssSrc = fs.readFileSync(path.join(root, 'src/css/style.css'), 'utf8');
const htmlSrc = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function checkDelimiters(code) {
  let b = 0, p = 0, k = 0;
  let inSingle = false, inDouble = false, inTpl = false, inLineComment = false, inBlockComment = false;
  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    const n = code[i + 1];
    if (inLineComment) { if (c === '\n') inLineComment = false; continue; }
    if (inBlockComment) { if (c === '*' && n === '/') { inBlockComment = false; i++; } continue; }
    if (inSingle) { if (c === '\\') { i++; continue; } if (c === '\'') inSingle = false; continue; }
    if (inDouble) { if (c === '\\') { i++; continue; } if (c === '"') inDouble = false; continue; }
    if (inTpl) { if (c === '\\') { i++; continue; } if (c === '`') inTpl = false; continue; }
    if (c === '/' && n === '/') { inLineComment = true; i++; continue; }
    if (c === '/' && n === '*') { inBlockComment = true; i++; continue; }
    if (c === '\'') { inSingle = true; continue; }
    if (c === '"') { inDouble = true; continue; }
    if (c === '`') { inTpl = true; continue; }
    if (c === '{') b++; else if (c === '}') b--;
    else if (c === '(') p++; else if (c === ')') p--;
    else if (c === '[') k++; else if (c === ']') k--;
  }
  return { b, p, k };
}

function countOccurrences(str, substr) {
  let count = 0;
  let idx = 0;
  while ((idx = str.indexOf(substr, idx)) !== -1) {
    count++;
    idx += substr.length;
  }
  return count;
}

const checks = [
  {
    name: '1. Codex Wave 29 UX: 6 archive sub-filter pills, live tab counters (.codex-tab-count), clickable evolution tree nodes & 4 tabs preserved',
    ok: htmlSrc.includes('id="codex-archive-filters"') &&
        countOccurrences(htmlSrc, 'role="tab"') === 4 &&
        countOccurrences(htmlSrc, 'class="codex-tab-count"') === 4 &&
        systemsSrc.includes('activateCodexTab(category, preferredEntryId = null)') &&
        systemsSrc.includes('updateCodexTabCounts()') &&
        systemsSrc.includes('matchesArchiveFilter(') &&
        systemsSrc.includes("evolution-node${isUnlocked ? ' unlocked is-clickable' : ' locked'}")
  },
  {
    name: '2. CSS Wave 29: codex-archive-filters, codex-tab-count, clickable evolution button, tracker-sector-tag & mobile overflow guards',
    ok: cssSrc.includes('.codex-archive-filters') &&
        cssSrc.includes('.codex-tab-count') &&
        cssSrc.includes('button.evolution-node.unlocked.is-clickable') &&
        cssSrc.includes('.tracker-sector-tag') &&
        cssSrc.includes('width: min(440px, 92vw);')
  },
  {
    name: '3. Shadowed duplicates eliminated: playElectricArc, playMagneticBootClank, playAirlockOuterSealRupture, updateAmbientTemperatureSensor & VFXManager.clear pool loop',
    ok: countOccurrences(gameSrc, 'playElectricArc(x = null, z = null) {') === 1 &&
        countOccurrences(gameSrc, 'playMagneticBootClank(x = null, z = null) {') === 1 &&
        countOccurrences(gameSrc, 'playAirlockOuterSealRupture(x = null, z = null) {') === 1 &&
        countOccurrences(gameSrc, 'updateAmbientTemperatureSensor(safeDelta) {') === 1 &&
        countOccurrences(systemsSrc.slice(systemsSrc.indexOf('clear(resolveProjectiles'), systemsSrc.indexOf('burst(x, z')), 'particleMeshPool.length < 180') === 1
  },
  {
    name: '4. Ambient cryo sensor unified (writes this.ambientTemp = t for .cryo-freeze vignette) & AudioManager/GameMaster idempotent setMuted + cancelScheduledValues',
    ok: gameSrc.includes('this.ambientTemp = t;') &&
        gameSrc.includes('this.masterGain.gain.value = this.isMuted ? 0 : this.volume;') &&
        gameSrc.includes('setMuted(muted)') &&
        gameSrc.includes('this.masterGain.gain.cancelScheduledValues(now);') &&
        systemsSrc.includes('this.game.setMuted(this.values.muted)')
  },
  {
    name: '5. M314 sector tag (#tracker-sector), CRT/Holo-Blueprint sector codes, Jonesy sweepNorthAngle fix & SVG icon preservation on #btn-tracker-mode/#btn-toggle-hud',
    ok: htmlSrc.includes('id="tracker-sector"') &&
        gameSrc.includes("this.sectorEl = document.getElementById('tracker-sector');") &&
        gameSrc.includes('relAngle - sweepNorthAngle') &&
        gameSrc.includes("const label = this.modeBtn.querySelector('span');") &&
        gameSrc.includes("const toggleLabel = toggleButton.querySelector('span');")
  },
  {
    name: '6. Per-instance 3D overhead health bars attached to HumanAI & HiveUnit (billboarded, shadow-free, auto-hidden on death/cocoon)',
    ok: countOccurrences(gameSrc, 'attachOverheadHealthBar(group) {') === 2 &&
        countOccurrences(gameSrc, 'updateOverheadHealthBar() {') === 2 &&
        gameSrc.includes('userData.isHealthBar = true;') &&
        gameSrc.includes('this.possessedUnit.updateOverheadHealthBar?.();')
  },
  {
    name: '7. Shared ARMORED_HOST_TYPES unified across StageFacehugger & StageHiveRTS, faction-safe HumanAI squad radios & Empress 4.3m aiming heights',
    ok: gameSrc.includes('const ARMORED_HOST_TYPES = [') &&
        gameSrc.includes('return ARMORED_HOST_TYPES.includes(host?.type);') &&
        gameSrc.includes('!this.isFactionHostile(h)') &&
        countOccurrences(gameSrc, "combatTarget.caste === 'empress' ? 4.3") >= 5
  },
  {
    name: '8. Act 2 StageFacehugger: updateImplantProgressUI (no DOM thrash), Aster Rho #boss-telemetry-hud & destroy() cleanup',
    ok: gameSrc.includes('updateImplantProgressUI()') &&
        gameSrc.includes('updateAsterTelemetry()') &&
        gameSrc.includes("SURVEILLANTE ASTER RHO // CIBLE KAPPA")
  },
  {
    name: '9. Act 3 StageChestburster: dynamic host narrative (no hardcoded IMANI KADE/Dr Kade), collision-safe rations/investigators & SVG-safe button label updates',
    ok: !gameSrc.includes("window.HiveSystems?.narrative('IMANI KADE'") &&
        !gameSrc.includes("Dr Kade ? Votre transpondeur") &&
        gameSrc.includes('const safePos = this.findRodentSpawn(playerCreature.x + roX') &&
        gameSrc.includes('const techPos = this.findRodentSpawn(prefX, prefZ, 20);') &&
        gameSrc.includes("emergeButton.querySelector('.act-btn-label')")
  },
  {
    name: '10. Act 4 StageDrone: #btn-tail-impale->handleKeyDown(3), codexByCaste unlocks, expanded isHeavyCaste/getActiveThreats, sector beats & Wave 3 elite boss HUD',
    ok: gameSrc.includes("document.getElementById('btn-tail-impale').onclick = () => this.handleKeyDown('3');") &&
        gameSrc.includes('checkSectorNarrative()') &&
        gameSrc.includes('updateEliteTelemetry()') &&
        gameSrc.includes("human.isCombatant?.() || human.isSynthetic?.() || human.isCyberHound")
  },
  {
    name: '11. Act 5 StageHiveRTS: Empress 0.42 detached speed, non-consumed host counter, getCycleBlockReason tooltips, passive (+3/8s) rate & SVG-safe labels',
    ok: gameSrc.includes("this.queen.speed = this.queen.caste === 'empress' ? 0.42 : 0.38;") &&
        gameSrc.includes('const hostCount = humans.filter((human) => human.isCocooned && !human.isConsumedByCycle).length;') &&
        gameSrc.includes('getCycleBlockReason(caste, cost)') &&
        gameSrc.includes("const oviRate = (this.queen?.attachedToOvipositor && !this.queen.isDestroyed) ? ' (+3/8s)' : '';") &&
        !gameSrc.includes('ENTRAAVÉ PAR LA RÉSINE')
  },
  {
    name: '12. Balanced delimiters { b: 0, p: 0, k: 0 } across src/game.js, src/game-systems.js, src/content.js, src/models.js & src/station-detail.js',
    ok: (() => {
      for (const s of [gameSrc, systemsSrc, contentSrc, modelsSrc, stationSrc]) {
        const d = checkDelimiters(s);
        if (d.b !== 0 || d.p !== 0 || d.k !== 0) return false;
      }
      return true;
    })()
  }
];

let passed = 0;
console.log('=== QA AAA WAVE 29 : CODEX UX, DÉDUPLICATION AUDIO/CRYO, BARRES PV 3D & POLISH ACTES 2–5 ===');
for (const c of checks) {
  if (c.ok) {
    console.log('[PASS]', c.name);
    passed++;
  } else {
    console.error('[FAIL]', c.name);
  }
}
console.log(`\nScore Wave 29 : ${passed}/${checks.length}`);
if (passed !== checks.length) process.exit(1);
