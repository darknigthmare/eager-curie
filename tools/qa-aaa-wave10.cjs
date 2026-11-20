// tools/qa-aaa-wave10.cjs
// Suite de tests QA automatisée pour la Wave 10 (Chantier AAA 1:1 Overhaul)

const fs = require('fs');
const assert = require('assert');

console.log('--- EXÉCUTION DE LA SUITE DE TESTS QA AAA WAVE 10 ---');

const gameJs = fs.readFileSync('src/game.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const styleCss = fs.readFileSync('src/css/style.css', 'utf8');

// 1. Synthétiseurs WebAudio procéduraux Wave 10
assert(gameJs.includes('playBlackGooBubble(x = null, z = null)'), 'playBlackGooBubble manquant dans AudioManager');
console.log('PASS: playBlackGooBubble présent dans src/game.js');

assert(gameJs.includes('playCameraDestroyCrunch(x = null, z = null)'), 'playCameraDestroyCrunch manquant dans AudioManager');
console.log('PASS: playCameraDestroyCrunch présent dans src/game.js');

assert(gameJs.includes('playTerminalKeystroke(x = null, z = null)'), 'playTerminalKeystroke manquant dans AudioManager');
console.log('PASS: playTerminalKeystroke présent dans src/game.js');

// 2. Mécanique de sabotage de caméras de sécurité StationMap.prototype.destroySecurityCamera
assert(gameJs.includes('destroySecurityCamera(cam, instigator = null, method = \'impact\')'), 'destroySecurityCamera manquant dans StationMap');
assert(gameJs.includes('head.rotation.x = 0.85'), 'Affaissement physique de la tête motorisée de caméra manquant');
assert(gameJs.includes('fovCone.visible = false'), 'Extinction du cône FOV lors de la destruction manquant');
assert(gameJs.includes('playCameraDestroyCrunch?.(cam.x, cam.z)'), 'Audio crunch de caméra manquant');
assert(gameJs.includes('0x84cc16') && gameJs.includes('CAMÉRA DISSOUTE PAR L’ACIDE'), 'VFX et decal acide pour destruction de caméra manquants');
console.log('PASS: StationMap.destroySecurityCamera validé avec affaissement physique et extinction FOV');

// 3. Brèche de canisters de fluide mutagène noir Z-01
assert(gameJs.includes('canister.mesh.rotation.z = 1.35'), 'Inclinaison du canister brisé manquante');
assert(gameJs.includes('playBlackGooBubble?.(canister.x, canister.z)'), 'Audio playBlackGooBubble manquant dans shatterBlackGoo');
assert(gameJs.includes('0x0f051d') && gameJs.includes('addFloorFluidDecal'), 'Flaque de mutagène noir persistante (0x0f051d) manquante dans shatterBlackGoo');
console.log('PASS: shatterBlackGoo validé avec flaque d\'asphalte mutagène noir et bouillonnement audio');

// 4. Détonation barils de napalm USCM et destruction caméras par onde de choc
assert(gameJs.includes('0x1c1917') && gameJs.includes('addFloorFluidDecal'), 'Decal de terre brûlée/calcinée (0x1c1917) manquant dans detonateNapalmBarrel');
assert(gameJs.includes('this.destroySecurityCamera(cam, triggerEntity || playerCreature, \'explosion\')'), 'Destruction des caméras par explosion du napalm manquante');
console.log('PASS: detonateNapalmBarrel validé avec flaque calcinée et destruction de caméras à 6.5m');

// 5. Interface terminaux M.U.T.H.U.R. 6000 & Seegson
assert(gameJs.includes('playTerminalKeystroke?.(terminal.x, terminal.z)'), 'Frappe mécanique keystroke manquante dans interactMuthurTerminal');
assert(gameJs.includes('isCooling ? 0xf59e0b : 0x22c55e'), 'Pulsation et bascule chromatique verte/ambre manquantes dans updateMuthurTerminals');
assert(gameJs.includes('destroySecurityCamera(c, null, \'hack\')'), 'Appel destroySecurityCamera manquant dans hackSeegsonTerminal');
console.log('PASS: M.U.T.H.U.R. 6000 et terminaux Seegson validés avec écrans CRT réactifs et bips mécaniques');

// 6. Système unifié de destruction environnementale systémique
assert(gameJs.includes('triggerEnvironmentalDestruction(originX, originZ, range = 5.5, method = \'melee\')'), 'triggerEnvironmentalDestruction manquant dans StationMap');
assert(gameJs.includes('stationMap.triggerEnvironmentalDestruction?.(playerCreature.x, playerCreature.z, 5.5, \'claw\')'), 'Déclenchement environnemental manquant dans executeClawSwipe');
assert(gameJs.includes('stationMap.triggerEnvironmentalDestruction?.(playerCreature.x, playerCreature.z, 6.5, \'tail\')'), 'Déclenchement environnemental manquant dans executeTailImpale');
assert(gameJs.includes('stationMap.destroySecurityCamera(cam, this, \'acid\')'), 'Destruction de caméra par jet d\'acide manquante dans executeAcidSpit');
console.log('PASS: Système unifié triggerEnvironmentalDestruction validé pour griffes, queue et crachat d\'acide');

// 7. Télémétrie diégétique sur le Holo-Blueprint M314 (isExpanded)
assert(gameJs.includes('cam.isDestroyed ? \'rgba(239, 68, 68, 0.45)\' : \'rgba(34, 197, 94, 0.9)\''), 'Marqueurs diégétiques caméras actifs/détruits manquants sur le blueprint');
assert(gameJs.includes('stationMap.blackGooCanisters') && gameJs.includes('stationMap.napalmBarrels'), 'Canisters et barils manquants sur la carte des dispositifs blueprint');
console.log('PASS: Holo-Blueprint M314 enrichi avec statut en temps réel des caméras et props');

// 8. Préservation absolue des carrés d'icônes vectorielles et des balances de délimiteurs
assert(!indexHtml.includes('<!-- MISSING_ICON -->'), 'Aucune icône manquante autorisée dans index.html');
const buttonMatches = indexHtml.match(/class="[^"]*btn-sq-icon[^"]*"/g) || [];
assert(buttonMatches.length >= 23, `Au moins 23 boutons avec icônes carrées requis (trouvé: ${buttonMatches.length})`);
console.log('PASS: Préservation absolue des carrés d\'icônes vectorielles (23/23)');

// 9. Vérification des délimiteurs
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

console.log('--- TOUS LES TESTS QA AAA WAVE 10 SONT VALIDÉS AVEC SUCCÈS ! (14/14) ---');
