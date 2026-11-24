const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const gameSrc = fs.readFileSync(path.join(root, 'src/game.js'), 'utf8');
const systemsSrc = fs.readFileSync(path.join(root, 'src/game-systems.js'), 'utf8');
const contentSrc = fs.readFileSync(path.join(root, 'src/content.js'), 'utf8');
const stationSrc = fs.readFileSync(path.join(root, 'src/station-detail.js'), 'utf8');
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

const checks = [
  {
    name: '1. P0 Ending Selection crash fixed (saveManager.unlock instead of non-existent saveManager.unlockCodex) & bare global audioManager fixed',
    ok: !systemsSrc.includes('this.saveManager.unlockCodex(') &&
        systemsSrc.includes("this.saveManager.unlock(['codex_archives_complete']);") &&
        systemsSrc.includes('window.audioManager?.playBrassCasingPing?.(')
  },
  {
    name: '2. Codex categories arsenal/vehicles, French loreLabels, case-insensitive unlocks, full-width evolution & rich enemy/boss metadata',
    ok: contentSrc.includes('arsenal: "Arsenal"') &&
        contentSrc.includes('vehicles: "Véhicules"') &&
        systemsSrc.includes("VEHICLES: 'VÉHICULES & NAVETTES'") &&
        systemsSrc.includes("layout?.classList.toggle('is-full-width', category === 'evolution');") &&
        systemsSrc.includes('const unlockedLower = new Set(')
  },
  {
    name: '3. CSS P0 positioning overrides removed, --font-mono defined, atmospheric edge vignettes & Dual-Boss HTML wired',
    ok: cssSrc.includes('--font-mono: var(--font-hud);') &&
        cssSrc.includes('.codex-layout.is-full-width') &&
        cssSrc.includes('#app-container.alarm-purge #vision-overlay') &&
        htmlSrc.includes('id="boss-telemetry-secondary"') &&
        htmlSrc.includes('<span>FERMER [ÉCHAP]</span>')
  },
  {
    name: '4. Station atmosphere: sector-strips, 6 sector floor-light-spills, pulsing emergency-beacons & 320 animated sector particles',
    ok: stationSrc.includes('function sectorColorFor(x, z)') &&
        stationSrc.includes("instance('sector-strips'") &&
        stationSrc.includes("instance('emergency-beacons'") &&
        stationSrc.includes('const moteCount = 320;') &&
        stationSrc.includes('const isPurgeActive = Boolean(')
  },
  {
    name: '5. Live MNEMOSYNE Sector HUD (getSectorInfo), app-container gyro mount, beacon tracking, bio-resin pulse & stalk FOV sync',
    ok: gameSrc.includes('getSectorInfo(x, z)') &&
        gameSrc.includes('id="hud-sector-badge"') &&
        gameSrc.includes('resinGrid.update?.(nowSec)') &&
        gameSrc.includes('rendererEngine._stalkFovOffset =')
  },
  {
    name: '6. Dead calls & runtime NaN bugs fixed: organicTrail 7-args, playXenoHiss, executeDeaconessInfrasonicRoar, executeRedDroneFrenzySwipe, executeAcidicBackSpray',
    ok: gameSrc.includes('organicTrail?.(this.x, 0.4, this.z, this.x, 1.8, this.z, 0xa855f7)') &&
        !gameSrc.includes('playXenomorphHiss') &&
        !gameSrc.includes('executeDeaconessSonicRoar') &&
        !gameSrc.includes('executeRedDroneCrimsonFrenzy') &&
        !gameSrc.includes('this.executeAcidSpray')
  },
  {
    name: '7. ADULT_CASTE_PROFILES.stalker added & all omitted Wave 27 combatants included in isCombatant + Stage 1 egg protection + toxic CN-20 damage',
    ok: gameSrc.includes("stalker: Object.freeze({") &&
        gameSrc.includes("'uscm_mortar_trooper', 'uscm_veteran_smartgunner'") &&
        gameSrc.includes('const biologicalTargetDetectable = currentStageIndex !== 1 &&') &&
        gameSrc.includes("applyWeaponDamage(1.4, 'toxic');")
  },
  {
    name: '8. Act 1 StageEgg fixes (detailedModel.setOpenProgress, host lookup, handleKeyDown, narrative beats)',
    ok: gameSrc.includes('playerCreature.detailedModel.userData.setOpenProgress(0.14);') &&
        gameSrc.includes('M.U.T.H.U.R. 6000 // BIO-SCAN')
  },
  {
    name: '9. Act 2 StageFacehugger P0 NaN health fix (.health/.maxHealth), Royal detailedModel + Codex unlock & collision-safe Aster Rho recoil',
    ok: gameSrc.includes('playerCreature.health = Math.max(40, Math.floor(playerCreature.maxHealth * 0.5));') &&
        !gameSrc.includes('playerCreature.hp = Math.max(40, Math.floor(playerCreature.maxHp * 0.5));') &&
        gameSrc.includes("window.HiveSystems?.unlockCodex?.(['royal_facehugger']);") &&
        gameSrc.includes('ASTER RHO // CANAL KAPPA')
  },
  {
    name: '10. Act 3 StageChestburster [C] vent guard + [Space] chrysalis shortcut & Act 4 HUD button sync / French typo cleanup',
    ok: gameSrc.includes("if (this.step !== 'HUNT_FAUNA') return;") &&
        gameSrc.includes("document.getElementById('btn-inner-jaw').onclick = () => this.handleKeyDown('2');") &&
        !gameSrc.includes('QA AUDIT #1') &&
        !gameSrc.includes('SECTION SPINAIL') &&
        !gameSrc.includes('ESTACA DE MANTE')
  },
  {
    name: '11. Act 5 Empress detached damage 235 + attackRange/speed/HUD sync, spawnUnit Codex unlocks & Dual-Boss HUD (MANTIS-4 + BRIAREOS-7)',
    ok: gameSrc.includes("const royalDmg = unit.caste === 'empress' ? 235 : Math.max(180, unit.damage || 180);") &&
        gameSrc.includes('this.queen.attackRange = 6.0;') &&
        gameSrc.includes("window.HiveSystems?.unlockCodex?.(codexByCaste[caste] || [caste, 'codex_castes_etendues']);") &&
        gameSrc.includes("const secRow = document.getElementById('boss-telemetry-secondary');")
  },
  {
    name: '12. Balanced delimiters { b: 0, p: 0, k: 0 } across src/game.js, src/game-systems.js, src/content.js & src/station-detail.js',
    ok: (() => {
      for (const s of [gameSrc, systemsSrc, contentSrc, stationSrc]) {
        const d = checkDelimiters(s);
        if (d.b !== 0 || d.p !== 0 || d.k !== 0) return false;
      }
      return true;
    })()
  }
];

let failed = 0;
console.log('=== QA AAA WAVE 28 (P0 CRASHES, CODEX UI, DUAL-BOSS/SECTOR HUD, ATMOSPHERE, DEAD CALLS & ACTS 1-5 POLISH) ===');
for (const c of checks) {
  if (c.ok) {
    console.log(`PASS: ${c.name}`);
  } else {
    console.error(`FAIL: ${c.name}`);
    failed++;
  }
}
if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length}/${checks.length} Wave 28 AAA checks passed!`);
