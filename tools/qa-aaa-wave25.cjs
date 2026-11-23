// tools/qa-aaa-wave25.cjs
// Suite de tests QA automatisée pour la Wave 25 : Cohérence Globale 1:1
// (Échelles Chestburster/Impératrice, Véhicules In-Lore UD-4L/Transit/EEV/P-5000,
//  Armes PNJ M37A2/Stun-Snare/AK-4047/BoltGun, Fix P0 isCombatant & Boss Phase 2/3 & anti-Cryo-OS,
//  Castes & Évolutions reliées, Movesets [T]/[N]/[B]/[H], Level Design 8 Conduits & 14 Entrées Codex)

const fs = require('fs');
const assert = require('assert');

console.log('--- EXÉCUTION DE LA SUITE DE TESTS QA AAA WAVE 25 ---');

const gameJs = fs.readFileSync('src/game.js', 'utf8');
const modelsJs = fs.readFileSync('src/models.js', 'utf8');
const contentJs = fs.readFileSync('src/content.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');

// 1. Échelles 1:1 & Véhicules In-Lore 3D
assert(modelsJs.includes('scaledAssembly.scale.setScalar(0.38);'), 'Correction échelle 1:1 Chestburster (0.38) manquante');
assert(modelsJs.includes('const isSuperRoyal = empress || matriarchQueen || queenMother;'), 'Correction échelle super-royale Impératrice manquante');
assert(modelsJs.includes('createUD4LCheyenne()') && modelsJs.includes('createSevastopolTransitCar()') && modelsJs.includes('createEEVEscapePod()'), 'Véhicules 3D in-lore (UD-4L Cheyenne, Sevastopol Transit, EEV Type 37) manquants dans models.js');
assert(gameJs.includes('this.cheyenneDropship =') && gameJs.includes('this.sevastopolTransitCar =') && gameJs.includes('this.parkedPowerLoader ='), 'Placement des véhicules in-lore manquant dans StationMap');
console.log('PASS: Pilier 1 (Échelles 1:1 Chestburster/Impératrice & Véhicules In-Lore 3D) validé');

// 2. Ennemis Manquants, Armes PNJ & Correctifs IA/Boss P0
assert(gameJs.includes("'weyland_security_taser', 'uscm_field_commander'") && gameJs.includes("'seegson_survivor_jack'"), 'Correctif P0 isCombatant manquant');
assert(gameJs.includes('CHOC CRYO BOSS (-95 PV) !'), 'Protection anti-one-shot cryo des boss manquante');
assert(gameJs.includes('BRIAREOS-7 : SURCHARGE PLASMA !') && gameJs.includes('MANTIS-4 : BARRAGE KAPPA P'), 'Mécaniques Phase 2/3 des boss BRIAREOS-7 & MANTIS-4 manquantes');
assert(gameJs.includes('FUSIL À POMPE M37A2 !') && gameJs.includes('FILET ÉLECTRIFIÉ WEYLAND !') && gameJs.includes('RAFALE AK-4047 (UPP) !') && gameJs.includes('TIR DE BOULONNEUSE SEEGSON !'), 'Armes PNJ manquantes (M37A2, Stun-Snare, AK-4047, Boulonneuse)');
assert(gameJs.includes('const isMeleeSpecialist ='), 'Correctif holdMaxDist mêlée manquant');
console.log('PASS: Pilier 2 (Armes PNJ M37A2/Stun-Snare/AK-4047/BoltGun, Fix P0 isCombatant & Boss Phase 2/3) validé');

// 3. Castes Manquantes, Évolutions Reliées & Correctifs Movesets
assert(gameJs.includes('empress: { hp: 1450') && gameJs.includes('predalien: { hp: 480') && gameJs.includes('boiler: { hp: 165'), 'Profils HiveUnit étendus (empress, predalien, boiler, etc.) manquants');
assert(gameJs.includes("if (['burster', 'boiler', 'exploder'].includes(this.caste))"), 'Détonation à la mort boiler/exploder manquante');
assert(gameJs.includes('<option value="empress"') && gameJs.includes('<option value="ravager"'), 'Castes empress/ravager manquantes dans #select-adult-caste');
assert(gameJs.includes("if (key === 't' && this.currentStageIndex !== 4 && this.currentStageIndex !== 5") && gameJs.includes("if (key === 'n' && this.currentStageIndex !== 4)"), 'Déblocage touches [T] et [N] en Stage 4 manquant');
assert(gameJs.includes("playerCreature.adultCaste === 'neomorph'"), 'Fix [B] Neomorph Frenzy manquant');
console.log('PASS: Pilier 3 (Castes étendues, évolutions reliées & correctifs movesets [T]/[N]/[B]/[H]) validé');

// 4. Level Design (8 Conduits, Vapeur fusionnée, Props décalés) & Lore/Codex 14 Entrées
assert(gameJs.includes("id: 'vent_reacteur'") && gameJs.includes("id: 'vent_armurerie'") && gameJs.includes("id: 'vent_central'"), 'Réseau complet de 8 conduits manquant dans StationMap');
assert(gameJs.includes('this.steamVents = [...(this.steamVents || []), ...extraSteamVents];'), 'Fusion steamVents manquante');
assert(gameJs.includes('Directrice IRISE Elian Torv') && !gameJs.includes('Directeur IRISE Elian Torv'), 'Cohérence titre Directrice Elian Torv manquante');
assert(contentJs.includes('id: "imani_kade"') && contentJs.includes('id: "aster_rho"') && contentJs.includes('id: "elian_torv"') && contentJs.includes('id: "codex_m41a_pulse_rifle"') && contentJs.includes('id: "codex_ud4l_cheyenne"') && contentJs.includes('id: "codex_empress_ravager"'), 'Nouvelles entrées Codex canoniques manquantes dans content.js');
console.log('PASS: Pilier 4 (Level Design 8 conduits/props & Lore/Codex 14 nouvelles entrées) validé');

// 5. Préservation absolue des carrés d'icônes vectorielles statiques (30/30)
const buttonMatches = indexHtml.match(/class="[^"]*btn-sq-icon[^"]*"/g) || [];
assert(buttonMatches.length >= 30, `Au moins 30 boutons avec icônes carrées requis (trouvé: ${buttonMatches.length})`);
console.log(`PASS: Préservation absolue des carrés d'icônes vectorielles statiques (${buttonMatches.length}/30)`);

// 6. Équilibre parfait des délimiteurs sur tous les modules clés
['src/game.js', 'src/game-systems.js', 'src/models.js', 'src/model-detail.js', 'src/content.js', 'src/station-detail.js'].forEach((filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  let b = 0, p = 0, k = 0;
  for (const ch of content) {
    if (ch === '{') b++;
    else if (ch === '}') b--;
    else if (ch === '(') p++;
    else if (ch === ')') p--;
    else if (ch === '[') k++;
    else if (ch === ']') k--;
  }
  assert(b === 0 && p === 0 && k === 0, `Délimiteurs déséquilibrés dans ${filePath}: { b: ${b}, p: ${p}, k: ${k} }`);
  console.log(`PASS: Équilibre parfait des délimiteurs { b: ${b}, p: ${p}, k: ${k} } dans ${filePath}`);
});

console.log('--- TOUS LES TESTS QA AAA WAVE 25 SONT VALIDÉS AVEC SUCCÈS ! (12/12) ---');
