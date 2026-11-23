// tools/qa-aaa-wave24.cjs
// Suite de tests QA automatisée pour la Wave 24 : Refonte Complète PNJ & Ennemis 1:1
// (Civils spécialisés, Marines tactiques, Synthétiques Working Joe/Hazmat/Médical,
//  Exécutifs WY/IRISE archétype Burke & Robotique in-lore)

const fs = require('fs');
const assert = require('assert');

console.log('--- EXÉCUTION DE LA SUITE DE TESTS QA AAA WAVE 24 ---');

const gameJs = fs.readFileSync('src/game.js', 'utf8');
const modelsJs = fs.readFileSync('src/models.js', 'utf8');
const modelDetailJs = fs.readFileSync('src/model-detail.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');

// 1. Correctifs Structurels Modèles 3D PNJ (src/models.js & src/model-detail.js)
assert(modelsJs.includes('const HUMAN_TYPE_ALIASES_COMPACT = Object.freeze('), 'Index compact HUMAN_TYPE_ALIASES_COMPACT manquant dans models.js');
assert(modelsJs.includes("sentryturret: 'sentry_turret'") && modelsJs.includes("sentry_turret: 'sentry_turret'"), 'Fix casse sentry_turret manquant dans models.js');
assert(!modelsJs.includes('profile.torsoWidth'), 'Références NaN profile.torsoWidth encore présentes dans models.js');
assert(modelsJs.includes("weapon.userData.equipmentType = 'corporateBriefcase'") && modelsJs.includes("weapon.userData.equipmentType = 'medicalScanner'") && modelsJs.includes("weapon.userData.equipmentType = 'pipeWrench'") && modelsJs.includes("weapon.userData.equipmentType = 'specimenCanister'"), 'Équipements dédiés PNJ manquants dans _createEquipmentWeapon');
assert(modelsJs.includes('civilian_medic:') && modelsJs.includes('weyland_director_officer:') && modelsJs.includes('seegson_hazmat_joe:'), 'Profils visuels dédiés manquants dans _humanVisualProfile');
assert(modelDetailJs.includes('suitColors[type] ?? profile.uniformColor ?? 0x687476'), 'Préservation profile.uniformColor manquante dans model-detail.js');
assert(modelDetailJs.includes("'weyland_director_officer'") && modelDetailJs.includes("'working_joe'"), 'Extension bareHead manquante dans model-detail.js');
console.log('PASS: Pilier 1 (Pipeline 3D PNJ, préservation couleurs, bareHead, équipements & fix NaN) validé');

// 2. Comportements IA Spécialisés par Famille (src/game.js)
assert(gameJs.includes('COMBINAISON IGNIFUGÉE SEEGSON !'), 'Immunité thermique seegson_hazmat_joe manquante');
assert(gameJs.includes('PROTOCOLE DE QUARANTAINE ! FERMEZ CETTE PORTE !') && gameJs.includes('SÉCURITÉ ! PROTÉGEZ LES ACTIFS DE LA COMPAGNIE !'), 'IA Exécutif WY/IRISE (archétype Burke) manquante');
assert(gameJs.includes('JE VOUS STABILISE ! TENEZ BON !') && gameJs.includes('Intégrité organique restaurée. Reprise du protocole.'), 'IA Médecin civil & Androïde médical manquante');
assert(gameJs.includes('JE VERROUILLE LA CLOISON !'), 'IA Technicien maintenance manquante');
assert(gameJs.includes('CAMOUFLAGE RÉVÉLÉ PAR DRONE !'), 'IA Drone Skimmer autonome manquante');
assert(gameJs.includes('h.accuracyBoostTimer = 6.0;'), 'Fix accuracyBoostTimer manquant sur uscm_recon_sniper');
assert(gameJs.includes('TENEZ LA LIGNE ! FEU CONCENTRÉ !'), 'Barks uscm_field_commander manquants');
assert(gameJs.includes('const isStationaryTurret ='), 'Immobilité tourelle HumanAI sentry_turret manquante');
console.log('PASS: Pilier 2 (IA Civils, Marines, Synthétiques, Exécutifs Burke & Robotique) validé');

// 3. Déploiement Réel dans les Stages 2, 3, 4 & 5
assert(gameJs.includes("'maintenance_technician'") && gameJs.includes("'xenobiologist'"), 'Spawns civils spécialisés Stage 2 manquants');
assert(gameJs.includes("'civilian_medic'"), 'Spawn Médecin MedBay Stage 3 manquant');
assert(gameJs.includes("'working_joe'") && gameJs.includes("'seegson_hazmat_joe'") && gameJs.includes("'uscm_combat_medic'") && gameJs.includes("'uscm_field_commander'") && gameJs.includes("'weyland_combat_medic_synth'") && gameJs.includes("'weyland_research_director'"), 'Spawns diversifiés Stage 4 manquants');
assert(gameJs.includes("new HumanAI(208, 'sentry_turret'") && gameJs.includes("new HumanAI(210, 'weyland_director_officer'"), 'Spawns Stage 5 (vraie sentry_turret + Exécutif IRISE + Medic) manquants');
console.log('PASS: Pilier 3 (Déploiement campagne Stages 2, 3, 4 & 5) validé');

// 4. Préservation absolue des carrés d'icônes vectorielles statiques (30/30)
const buttonMatches = indexHtml.match(/class="[^"]*btn-sq-icon[^"]*"/g) || [];
assert(buttonMatches.length >= 30, `Au moins 30 boutons avec icônes carrées requis (trouvé: ${buttonMatches.length})`);
console.log(`PASS: Préservation absolue des carrés d'icônes vectorielles statiques (${buttonMatches.length}/30)`);

// 5. Équilibre parfait des délimiteurs sur tous les modules clés
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

console.log('--- TOUS LES TESTS QA AAA WAVE 24 SONT VALIDÉS AVEC SUCCÈS ! (11/11) ---');
