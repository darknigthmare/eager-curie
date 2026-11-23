const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const modelsSrc = fs.readFileSync(path.join(root, 'src/models.js'), 'utf8');
const contentSrc = fs.readFileSync(path.join(root, 'src/content.js'), 'utf8');
const gameSrc = fs.readFileSync(path.join(root, 'src/game.js'), 'utf8');

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
    name: '1. Base stalker caste 3D model, HiveUnit profile & Stage 4 selector',
    ok: modelsSrc.includes("normalizedCaste === 'stalker'") &&
        gameSrc.includes('stalker: { hp: 200, speed: 0.56, damage: 56, range: 2.0 }') &&
        gameSrc.includes('<option value="stalker"')
  },
  {
    name: '2. In-lore 3D vehicles: createDaihotaiTractor & createWeylandCargoLoader instantiated in StationMap',
    ok: modelsSrc.includes('createDaihotaiTractor()') &&
        modelsSrc.includes('createWeylandCargoLoader()') &&
        gameSrc.includes('this.daihotaiTractor =') &&
        gameSrc.includes('this.weylandCargoLoader =')
  },
  {
    name: '3. Level Design: Perimeter clamp [-71, 71] on wave31..60 props, USCM bunker (-22,-60) & Hive Bio-Spire (38,42)',
    ok: gameSrc.includes('def.x = Math.max(-71, Math.min(71, def.x));') &&
        gameSrc.includes('def.z = Math.max(-71, Math.min(71, def.z));') &&
        gameSrc.includes("id: 'uscm_bunker_1', name: \"Bunker Fortifié de Munitions USCM\", x: -22, z: -60") &&
        gameSrc.includes("id: 'bio_spire_1', name: \"Flèche Centrale de Bio-Résine Organique\", x: 38, z: 42")
  },
  {
    name: '4. Level Design: Expanded grateAmbushNodes (7 floor grates across all station sectors)',
    ok: gameSrc.includes("id: 'grate_ambush_4'") &&
        gameSrc.includes("id: 'grate_ambush_5'") &&
        gameSrc.includes("id: 'grate_ambush_6'") &&
        gameSrc.includes("id: 'grate_ambush_7'")
  },
  {
    name: '5. Boss AI anti-perma-stagger protection (0.07s stagger on BRIAREOS-7 & MANTIS-4)',
    ok: gameSrc.includes('this.staggerTimer = this.bossId ? 0.07 : 0.28;')
  },
  {
    name: '6. Per-frame cooldown ticking for EMP, U1 30mm & White Phosphorus grenades + U1 recoil collision check',
    ok: gameSrc.includes('if (this.empGrenadeCooldown > 0) this.empGrenadeCooldown = Math.max(0, this.empGrenadeCooldown - safeDelta);') &&
        gameSrc.includes('if (this.u1GrenadeCooldown > 0) this.u1GrenadeCooldown = Math.max(0, this.u1GrenadeCooldown - safeDelta);') &&
        gameSrc.includes('if (this.whitePhosphorusCooldown > 0) this.whitePhosphorusCooldown = Math.max(0, this.whitePhosphorusCooldown - safeDelta);') &&
        gameSrc.includes('if (!stationMap.checkCollision(rx, rz))')
  },
  {
    name: '7. Dedicated NPC weapons for uscm_dropship_pilot & colonial_raider',
    ok: gameSrc.includes("} else if (this.type === 'uscm_dropship_pilot') {") &&
        gameSrc.includes('FRAPPE GUIDÉE UD-4L CHEYENNE !') &&
        gameSrc.includes("} else if (this.type === 'colonial_raider') {") &&
        gameSrc.includes('CALIBRE 12 & MOLOTOV !')
  },
  {
    name: '8. Stage 4 [R]/[2] moveset coverage for deaconess, red_drone, ravager, carrier, lurker, stalker, burster, boiler, empress',
    ok: gameSrc.includes("caste === 'deaconess'") &&
        gameSrc.includes("caste === 'red_drone'") &&
        gameSrc.includes("caste === 'ravager' || caste === 'carrier'") &&
        gameSrc.includes("caste === 'prowler' || caste === 'lurker' || caste === 'stalker'") &&
        gameSrc.includes("caste === 'burster' || caste === 'boiler'")
  },
  {
    name: '9. Stage 5 RTS progressive evolutions (Boiler, Ravager, Carrier) & Queen -> Empress Supreme Ascension',
    ok: gameSrc.includes('id="btn-spawn-boiler"') &&
        gameSrc.includes('id="btn-spawn-ravager"') &&
        gameSrc.includes('id="btn-spawn-carrier"') &&
        gameSrc.includes('id="btn-evolve-empress"') &&
        gameSrc.includes('evolveQueenToEmpress()')
  },
  {
    name: '10. Enriched RTS executePossessedAttack for ravager, prowler/lurker/stalker, burster/boiler, offspring & worker',
    ok: gameSrc.includes("} else if (unit.caste === 'ravager') {") &&
        gameSrc.includes("} else if (['prowler', 'lurker', 'stalker'].includes(unit.caste)) {") &&
        gameSrc.includes("} else if (['burster', 'boiler'].includes(unit.caste)) {") &&
        gameSrc.includes("} else if (unit.caste === 'offspring') {") &&
        gameSrc.includes("} else if (unit.caste === 'worker') {")
  },
  {
    name: '11. Narrative & Campaign coherence in src/content.js (A5_M01 queen, A5_M03 defeat_briareos, 6 Codex entries & 3 character journals)',
    ok: /id:\s*"A5_M01"[\s\S]{0,280}playableCaste:\s*"queen"/.test(contentSrc) &&
        contentSrc.includes('id: "defeat_briareos"') &&
        contentSrc.includes('id: "codex_stalker_lurker"') &&
        contentSrc.includes('id: "codex_boiler_carrier"') &&
        contentSrc.includes('id: "codex_daihotai_tractor"') &&
        contentSrc.includes('id: "journal_kade_origin"') &&
        contentSrc.includes('id: "journal_aster_quarantine"') &&
        contentSrc.includes('id: "journal_torv_palimpseste"')
  },
  {
    name: '12. Balanced delimiters across src/models.js, src/content.js & src/game.js',
    ok: (() => {
      const dm = checkDelimiters(modelsSrc);
      const dc = checkDelimiters(contentSrc);
      const dg = checkDelimiters(gameSrc);
      return dm.b === 0 && dm.p === 0 && dm.k === 0 &&
             dc.b === 0 && dc.p === 0 && dc.k === 0 &&
             dg.b === 0 && dg.p === 0 && dg.k === 0;
    })()
  }
];

let failed = 0;
console.log('=== QA AAA WAVE 26 (GLOBAL 1:1 COHERENCE PART 2: STALKER, EMPRESS RTS, DAIHOTAI, LEVEL DESIGN & AI) ===');
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
console.log(`\nAll ${checks.length}/${checks.length} Wave 26 AAA checks passed!`);
