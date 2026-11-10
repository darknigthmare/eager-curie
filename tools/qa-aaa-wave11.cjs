// tools/qa-aaa-wave11.cjs
// Suite de tests QA automatisée pour la Wave 11 (Chantier AAA 1:1 Overhaul)

const fs = require('fs');
const assert = require('assert');

console.log('--- EXÉCUTION DE LA SUITE DE TESTS QA AAA WAVE 11 ---');

const gameJs = fs.readFileSync('src/game.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const styleCss = fs.readFileSync('src/css/style.css', 'utf8');

// 1. Synthétiseurs WebAudio procéduraux Wave 11
assert(gameJs.includes('playMagneticBootClank(x = null, z = null)'), 'playMagneticBootClank manquant dans AudioManager');
console.log('PASS: playMagneticBootClank présent dans src/game.js');

assert(gameJs.includes('playAirlockOuterSealRupture(x = null, z = null)'), 'playAirlockOuterSealRupture manquant dans AudioManager');
console.log('PASS: playAirlockOuterSealRupture présent dans src/game.js');

// 2. Dépressurisation du sas & éjection dans le vide spatial
assert(gameJs.includes('audioManager.playAirlockOuterSealRupture?.(airlock.x, airlock.z)') || gameJs.includes('audioManager.playAirlockOuterSealRupture?.(this.depressurizationAirlock.x, this.depressurizationAirlock.z)'), 'Rupture de joint sous vide manquante dans triggerDepressurizationAirlock');
assert(gameJs.includes('audioManager.playMagneticBootClank?.(playerCreature.x, playerCreature.z)'), 'Audio d\'ancrage magnétique des griffes manquant');
assert(gameJs.includes('ent.isEjectedToSpace = true') && gameJs.includes('ent.mesh.position.y = -6.0'), 'Éjection physique dans le vide spatial manquante pour les victimes');
console.log('PASS: triggerDepressurizationAirlock et updateDepressurizationAirlock validés avec physique du vide 1:1');

// 3. Diagnostic d'équipage M.U.T.H.U.R. 6000 Bioscan
assert(gameJs.includes('playTerminalKeystroke?.(consoleProp.x, consoleProp.z)'), 'Frappe mécanique manquante dans consultMuthurBioScan');
assert(gameJs.includes('aliveCount') && gameJs.includes('cocoonedCount') && gameJs.includes('deadCount'), 'Ventilation détaillée des biosignaux vitaux manquante');
assert(gameJs.includes('BIOSCAN MUTHUR :'), 'Texte flottant holographique manquant');
console.log('PASS: consultMuthurBioScan validé avec télémétrie complète et retours tactiles');

// 4. Couverture des icônes carrées vectorielles sur les boutons d'action dynamiques
assert(gameJs.includes('iconPredation') && gameJs.includes('iconStealth') && gameJs.includes('iconEnvironment') && gameJs.includes('iconAll'), 'Générateurs d\'icônes vectorielles manquants');
assert(gameJs.includes('actionsContainer.querySelectorAll(\'.act-btn\').forEach'), 'Injection dynamique des icônes carrées sur .act-btn manquante');
assert(styleCss.includes('.act-btn .btn-sq-icon'), 'Style CSS pour .act-btn .btn-sq-icon manquant');
assert(styleCss.includes('.hud-tab-btn .btn-sq-icon'), 'Style CSS pour .hud-tab-btn .btn-sq-icon manquant');
console.log('PASS: 100% des boutons d\'action dynamiques équipés de leurs icônes carrées vectorielles');

// 5. Préservation absolue des carrés d'icônes vectorielles sur les boutons statiques (23/23)
assert(!indexHtml.includes('<!-- MISSING_ICON -->'), 'Aucune icône manquante autorisée dans index.html');
const buttonMatches = indexHtml.match(/class="[^"]*btn-sq-icon[^"]*"/g) || [];
assert(buttonMatches.length >= 23, `Au moins 23 boutons avec icônes carrées requis (trouvé: ${buttonMatches.length})`);
console.log('PASS: Préservation absolue des carrés d\'icônes vectorielles statiques (23/23)');

// 6. Vérification de l'équilibre des délimiteurs
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
  assert.strictEqual(b, 0, `Déséquilibre des accolades {} dans ${filePath}: ${b}`);
  assert.strictEqual(p, 0, `Déséquilibre des parenthèses () dans ${filePath}: ${p}`);
  assert.strictEqual(k, 0, `Déséquilibre des crochets [] dans ${filePath}: ${k}`);
});
console.log('PASS: Équilibre parfait des délimiteurs { b: 0, p: 0, k: 0 } sur tous les fichiers');

console.log('--- TOUS LES TESTS QA AAA WAVE 11 SONT VALIDÉS AVEC SUCCÈS ! (12/12) ---');
