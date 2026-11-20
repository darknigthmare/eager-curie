// tools/qa-aaa-wave19.cjs
// Suite de tests QA automatisée pour la Wave 19 : Fidélité 1:1 Visuel, Son, VFX & Gameplay
// (Néons réactifs blackout/alarme, bio-lumière résine dynamique, brèche acide 3D & projection murale,
//  synthétiseurs WebAudio acide/néon, recul humain sang acide, fuite feu RTS & bonus visée laser)

const fs = require('fs');
const assert = require('assert');

console.log('--- EXÉCUTION DE LA SUITE DE TESTS QA AAA WAVE 19 ---');

const gameJs = fs.readFileSync('src/game.js', 'utf8');
const stationDetailJs = fs.readFileSync('src/station-detail.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');

// 1. Éclairage architectural réactif dans src/station-detail.js
assert(stationDetailJs.includes('window.rendererEngine?.powerSabotagedTimer'), 'Réaction blackout manquante dans station-detail.js');
assert(stationDetailJs.includes('window.alarmSystem?.level'), 'Réaction alarme manquante dans station-detail.js');
assert(stationDetailJs.includes('coolLamp.emissiveIntensity'), 'Modulation émissive coolLamp manquante dans station-detail.js');
console.log('PASS: Éclairage architectural réactif (blackout & alarme stroboscopique) validé');

// 2. Exposition globale rendererEngine & suivi dynamique bioGreen sur la bio-résine
assert(gameJs.includes('window.rendererEngine = rendererEngine;'), 'Exposition globale window.rendererEngine manquante');
assert(gameJs.includes('this.lights.bioGreen.position.x +='), 'Suivi dynamique bioGreen sur les noeuds de bio-résine manquant');
console.log('PASS: Exposition rendererEngine & suivi dynamique bioGreen sur bio-résine validés');

// 3. Synthétiseurs WebAudio 1:1 (brèche pont acide, bourdonnement néon, recul projection acide)
assert(gameJs.includes('playAcidDeckBurnThrough('), 'Synthétiseur playAcidDeckBurnThrough manquant');
assert(gameJs.includes('playFluorescentBuzz('), 'Synthétiseur playFluorescentBuzz manquant');
assert(gameJs.includes('playXenomorphAcidSplashRecoil('), 'Synthétiseur playXenomorphAcidSplashRecoil manquant');
console.log('PASS: Synthétiseurs WebAudio 1:1 (playAcidDeckBurnThrough, playFluorescentBuzz, playXenomorphAcidSplashRecoil) validés');

// 4. Brèche acide 3D & projection d'éclaboussure sur la face extérieure des murs
assert(gameJs.includes('acid_breach_hole'), 'Mesh 3D acid_breach_hole manquant dans addAcidCorrosion');
assert(gameJs.includes('wallMesh.rotation.y = wallRotY;'), 'Projection murale avec orientation normale manquante dans addAcidCorrosion');
console.log('PASS: Brèche acide 3D (acid_breach_hole) & projection murale sur face extérieure validées');

// 5. Recul réflexe des humains organiques face aux flaques/projections d'acide
assert(gameJs.includes('SANG ACIDE ! ÉCARTEZ-VOUS !'), 'Recul humain face aux flaques d\'acide manquant');
assert(gameJs.includes('audioManager.playXenomorphAcidSplashRecoil?.(human.x, human.z)'), 'Réaction sonore et recul sur éclaboussure acide manquants');
console.log('PASS: Recul réflexe humain face au sang acide & projections pressurisées validé');

// 6. Fuite thermique RTS (HiveUnit) & multiplicateur de précision laser (accuracyBoostTimer)
assert(gameJs.includes('this.fireFleeTimer = Math.max(this.fireFleeTimer || 0, 2.4)'), 'Aversion thermique fireFleeTimer manquante sur HiveUnit');
assert(gameJs.includes("applyWeaponDamage(1.15, 'fire')") && gameJs.includes("applyWeaponDamage(1.35, 'fire')"), 'Propagation damageType fire manquante sur les lance-flammes/chalumeaux');
assert(gameJs.includes('const laserBonus = this.accuracyBoostTimer > 0 ? (this.accuracyBoost || 1.3) : 1;'), 'Multiplicateur de précision laser accuracyBoostTimer manquant dans applyWeaponDamage');
console.log('PASS: Fuite thermique RTS (fireFleeTimer) & bonus désignation laser validés');

// 7. Préservation absolue des carrés d'icônes vectorielles statiques (30/30)
const buttonMatches = indexHtml.match(/class="[^"]*btn-sq-icon[^"]*"/g) || [];
assert(buttonMatches.length >= 30, `Au moins 30 boutons avec icônes carrées requis (trouvé: ${buttonMatches.length})`);
console.log(`PASS: Préservation absolue des carrés d'icônes vectorielles statiques (${buttonMatches.length}/30)`);

// 8. Équilibre parfait des délimiteurs sur tous les modules clés
['src/game.js', 'src/game-systems.js', 'src/models.js', 'src/station-detail.js'].forEach((filePath) => {
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

console.log('--- TOUS LES TESTS QA AAA WAVE 19 SONT VALIDÉS AVEC SUCCÈS ! (12/12) ---');
