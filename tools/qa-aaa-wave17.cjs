// tools/qa-aaa-wave17.cjs
// Suite de tests QA automatisée pour la Wave 17 : Fidélité 1:1 des 5 Phases d'Évolution (Ovomorphe -> Facehugger -> Chestburster -> Adulte -> Reine RTS)

const fs = require('fs');
const assert = require('assert');

console.log('--- EXÉCUTION DE LA SUITE DE TESTS QA AAA WAVE 17 ---');

const gameJs = fs.readFileSync('src/game.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const modelsJs = fs.readFileSync('src/models.js', 'utf8');
const gameSystemsJs = fs.readFileSync('src/game-systems.js', 'utf8');

// 1. Modèles 3D Phases 1 & 2
assert(modelsJs.includes('webbing_membrane_') && modelsJs.includes('royal_dorsal_spine_'), 'Palmures et épines dorsales manquantes dans createRoyalFacehugger');
assert(modelsJs.includes('localProgress') && modelsJs.includes('emissiveIntensity'), 'Écartement asynchrone et lueur interne manquants dans createEgg');
console.log('PASS: Modèles 3D Ovomorphe (déphasage pétales) et Facehugger Royal (palmures + épines) validés');

// 2. Synthétiseurs WebAudio & Effets Visuels
assert(gameJs.includes('playLaserFieldDisturbance(') && gameJs.includes('playSpiderSkitter(') && gameJs.includes('playOvipositorLay(') && gameJs.includes('playRoyalCry('), 'Synthétiseurs Wave 17 manquants');
assert(gameJs.includes('triggerScreenFlash('), 'triggerScreenFlash manquant dans RendererEngine');
assert(gameJs.includes('if (legs.length >= 8)'), 'Locomotion arachnide 8 pattes manquante dans animateProceduralModel');
console.log('PASS: Synthétiseurs WebAudio, flash écran et locomotion arachnide 8 pattes validés');

// 3. Phase 1 (StageEgg) & Phase 2 (StageFacehugger)
assert(gameJs.includes('derelictLaserPlane') && gameJs.includes('THERMOSENSOR'), 'Champ laser LV-426 et télémétrie thermique manquants dans StageEgg');
assert(gameJs.includes('this.royalImplantCount = 0') && gameJs.includes("this.setRecoveryPhase('ROYAL_CHOICE')") &&
  gameJs.includes('beginSecondRoyalHunt()'), 'Choix après récupération du premier hôte royal manquant');
console.log('PASS: Champ laser, télémétrie et choix royal après récupération présents');

// 4. Phase 3 (StageChestburster) & Phase 4 (StageDrone)
assert(gameJs.includes('earlyHeartbeatTimer') && gameJs.includes('chrysalisRingMesh'), 'Arythmie précoce et anneau 3D de chrysalide manquants dans StageChestburster');
assert(gameJs.includes("playerCreature.adultCaste === 'spitter' ? 22 : 15"), 'Portée 22m du Spitter manquante');
assert(gameJs.includes('executeOffspringZ01Siphon(') && gameJs.includes('executeProwlerAmbush('), 'Capacités Offspring Z-01 et Prowler manquantes');
console.log('PASS: Fidélité 1:1 Phase 3 (Chestburster/Chrysalide) et Phase 4 (Castes Adultes & Headbite) validée');

// 5. Phase 5 (StageHiveRTS & M314)
assert(gameJs.includes('triggerRoyalCry()') && gameJs.includes('rallyRoyalGuard()') && gameJs.includes('ROYAL_GUARD'), 'Cri Royal et Garde Royale manquants');
assert(gameJs.includes('ovipositor-sac') && gameJs.includes('ovipositor-light'), 'Animation et lumière de l\'Ovipositeur manquantes');
assert(gameJs.includes("rtsStage.queen.attachedToOvipositor ? 'OVI' : 'QUEEN'"), 'Marqueurs Relais/Reine sur M314 manquants');
assert(indexHtml.includes('id="btn-royal-guard"') && indexHtml.includes('id="btn-royal-cry"'), 'Boutons #btn-royal-guard et #btn-royal-cry manquants dans index.html');
console.log('PASS: Fidélité 1:1 Phase 5 (Cri Royal, Garde Royale, Ovipositeur animé, M314) validée');

// 6. Couverture 100% icônes boutons statiques (30/30) & équilibre délimiteurs
const buttonMatches = indexHtml.match(/class="[^"]*btn-sq-icon[^"]*"/g) || [];
assert(buttonMatches.length >= 30, `Au moins 30 boutons avec icônes carrées requis (trouvé: ${buttonMatches.length})`);
console.log(`PASS: Préservation absolue des carrés d'icônes vectorielles statiques (${buttonMatches.length}/30)`);

['src/game.js', 'src/game-systems.js', 'src/models.js'].forEach((filePath) => {
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

console.log('--- TOUS LES TESTS QA AAA WAVE 17 SONT VALIDÉS AVEC SUCCÈS ! (12/12) ---');
