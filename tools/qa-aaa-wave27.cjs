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
    name: '1. Upgraded 1:1 3D Vehicles: Narcissus landing gear, M577 APC GAU-113A/Boyars rail, Echo-12 Tug & Seegson Cargo Tug',
    ok: modelsSrc.includes('narcissus_dorsal_docking_collar') &&
        modelsSrc.includes('apc_chin_gau113_turret') &&
        modelsSrc.includes('createEcho12SalvageTug()') &&
        modelsSrc.includes('createSeegsonCargoTug()')
  },
  {
    name: '2. Expanded 3D held weapon profiles for 9 specialized USCM/Weyland combatants in src/models.js',
    ok: modelsSrc.includes('uscm_mortar_trooper: {') &&
        modelsSrc.includes('uscm_pulse_lance_gunner: {') &&
        modelsSrc.includes('uscm_railgun_marksman: {') &&
        modelsSrc.includes('weyland_shock_enforcer: {') &&
        modelsSrc.includes('uscm_veteran_smartgunner: {')
  },
  {
    name: '3. 7 stationed in-lore vehicles registered with AABB colliders & sabotageStationedVehicle() in StationMap',
    ok: gameSrc.includes('this.stationedVehicles = [];') &&
        gameSrc.includes('this.echo12SalvageTug = registerStationedVehicle(') &&
        gameSrc.includes('this.seegsonCargoTug = registerStationedVehicle(') &&
        gameSrc.includes('sabotageStationedVehicle(veh)')
  },
  {
    name: '4. All specialized NPC weapon branches wired in HumanAI.update() (M402 Mortar, M92, M78 Lance, M90 Railgun, LN2 Cryo, Voltaic, Neural Prod, CN-20)',
    ok: gameSrc.includes('OBUS DE MORTIER M402 !') &&
        gameSrc.includes('BARILLET 40MM M92 !') &&
        gameSrc.includes('LANCE À IMPULSIONS M78 !') &&
        gameSrc.includes('TIR RAILGUN M90 HYPER-VÉLOCE !') &&
        gameSrc.includes('JET CRYOGÉNIQUE LN2 SUB-ZÉRO !') &&
        gameSrc.includes('DÉCHARGE VOLTAÏQUE HAUTE TENSION !') &&
        gameSrc.includes('IMPULSION NEURALE ANTI-XÉNO !') &&
        gameSrc.includes('AÉROSOL NEUROTOXIQUE CN-20 / CBRN !')
  },
  {
    name: '5. P0 Royal Matriarch Hierarchy (queen/empress/matriarch_queen) fixed across HiveUnit & StageHiveRTS + rendererEngine.removeObject',
    ok: gameSrc.includes("const isRoyalMatriarch = ['queen', 'empress', 'matriarch_queen'].includes(this.caste);") &&
        gameSrc.includes('rendererEngine.removeObject(this.queen.mesh);') &&
        gameSrc.includes("window.HiveSystems?.unlockCodex?.(['codex_empress_ravager', 'codex_royal_pheromone_aura']);")
  },
  {
    name: '6. Royal Pheromone Aura (Regen + Armor -20% + Damage +15%) active for Queen, Empress, Matriarch, Praetorian & Palatine',
    ok: gameSrc.includes('const armorMult = (this.royalArmorBuffTimer || 0) > 0 ? 0.8 : 1.0;') &&
        gameSrc.includes('ally.royalArmorBuffTimer = 3.2;')
  },
  {
    name: '7. Carrier dorsal swarmer release on death (+2 Swarmers), periodic combat spawn & possessed attack',
    ok: gameSrc.includes('ESSAIM DORSAL LIBÉRÉ (+2 SWARMERS) !') &&
        gameSrc.includes('LARGAGE DORSAL : +1 SWARMER !') &&
        gameSrc.includes("} else if (unit.caste === 'carrier') {")
  },
  {
    name: '8. Boiler ranged caustic mortar (range 8.5 + acid pool on impact) & 6.8m/115dmg thermochemical death cataclysm',
    ok: gameSrc.includes('boiler: { hp: 165, speed: 0.48, damage: 85, range: 8.5 }') &&
        gameSrc.includes("['spitter', 'reef_spitter', 'pathogen_blight'].includes(this.caste) || this.caste === 'boiler'") &&
        gameSrc.includes('const blastRadius = isBoiler ? 6.8 : 5.8;')
  },
  {
    name: '9. Stage 3 progressive juvenile Chestburster growth scale (applyJuvenileGrowth)',
    ok: gameSrc.includes('applyJuvenileGrowth()') &&
        gameSrc.includes('const growthScale = 1 + Math.min(3, this.biomassHunted) * 0.14;')
  },
  {
    name: '10. Stage 4 [2/R] bug fixed (no redundant key === r filter), Ravager/Carrier/Spitter/Neomorph/Deacon wired & duplicate options removed',
    ok: gameSrc.includes("if (caste === 'king' || caste === 'empress' || caste === 'matriarch_queen') {") &&
        gameSrc.includes("} else if (caste === 'ravager') {") &&
        gameSrc.includes("} else if (caste === 'neomorph') {") &&
        gameSrc.includes("} else if (caste === 'spitter') {") &&
        (gameSrc.match(/<option value="boiler"/g) || []).length === 1 &&
        (gameSrc.match(/<option value="carrier"/g) || []).length === 1
  },
  {
    name: '11. Full Codex & Boss uppercase unlocks + new entries (codex_sadar_xm99_lance, codex_royal_pheromone_aura, codex_seegson_cargo_tug) + Pause Telemetry fix',
    ok: contentSrc.includes('id: "codex_sadar_xm99_lance"') &&
        contentSrc.includes('id: "codex_royal_pheromone_aura"') &&
        contentSrc.includes('id: "codex_seegson_cargo_tug"') &&
        gameSrc.includes("'BRIAREOS_7', 'MANTIS_4', 'PALIMPSESTE'") &&
        gameSrc.includes("const activeCaste = this.currentStageIndex === 5")
  },
  {
    name: '12. Balanced delimiters { b: 0, p: 0, k: 0 } across src/models.js, src/content.js & src/game.js',
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
console.log('=== QA AAA WAVE 27 (VEHICLES 1:1, NPC WEAPONS, EMPRESS HIERARCHY, CARRIER SWARMERS, BOILER & FULL CODEX) ===');
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
console.log(`\nAll ${checks.length}/${checks.length} Wave 27 AAA checks passed!`);
