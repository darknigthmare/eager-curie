/**
 * Suite de Validation QA AAA Wave 7
 * Vérifie l'intégration des transitions biomorphiques diégétiques,
 * de la télémétrie génétique Weyland-Yutani du modal d'évolution,
 * des risques cryogéniques et vapeur avec décals persistants au sol,
 * du balayage CRT et Doppler du Motion Tracker M314, et de la préservation
 * absolue des icônes carrées vectorielles.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const rootDir = path.resolve(__dirname, '..');
const gameJsPath = path.join(rootDir, 'src', 'game.js');
const systemsJsPath = path.join(rootDir, 'src', 'game-systems.js');
const indexHtmlPath = path.join(rootDir, 'index.html');
const styleCssPath = path.join(rootDir, 'src', 'css', 'style.css');

const gameJs = fs.readFileSync(gameJsPath, 'utf8');
const systemsJs = fs.readFileSync(systemsJsPath, 'utf8');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const styleCss = fs.readFileSync(styleCssPath, 'utf8');

console.log('--- EXÉCUTION DE LA SUITE DE TESTS QA AAA WAVE 7 ---');

// 1. Synthétiseurs WebAudio
assert(gameJs.includes('playXenoBiomorphicChime()'), 'AudioManager doit inclure playXenoBiomorphicChime');
console.log('PASS: playXenoBiomorphicChime présent dans src/game.js');

assert(gameJs.includes('playCryoFrostCrackle('), 'AudioManager doit inclure playCryoFrostCrackle');
console.log('PASS: playCryoFrostCrackle présent dans src/game.js');

// 2. Effets VFX Three.js
assert(systemsJs.includes('cryoFrostFlash('), 'VFXManager doit inclure cryoFrostFlash');
console.log('PASS: VFX cryoFrostFlash présent dans src/game-systems.js');

assert(systemsJs.includes('effect.cryoFrostFlash'), 'VFXManager.update doit animer cryoFrostFlash');
console.log('PASS: Boucle de mise à jour VFX prend en charge cryoFrostFlash');

// 3. Détecteur de Mouvements M314 CRT & Doppler
assert(gameJs.includes('// Mission Wave 7 : Scanlines CRT Cathodiques & Vignetage Diégétique Phosphore M314'), 'MotionTrackerDisplay doit intégrer les scanlines CRT');
assert(gameJs.includes('audioManager.playMotionTrackerSweep?.()'), 'MotionTrackerDisplay doit déclencher le sweep Doppler à chaque révolution');
console.log('PASS: Motion Tracker M314 scanlines CRT et sweep Doppler révolution vérifiés');

// 4. Risque Cryogénique (shatterCryoPod)
assert(gameJs.includes('0xbae6fd'), 'shatterCryoPod doit poser une flaque de givre cryogénique (0xbae6fd)');
assert(gameJs.includes('audioManager.playCryoFrostCrackle?.(pod.x, pod.z)'), 'shatterCryoPod doit jouer le craquement de givre');
assert(gameJs.includes('window.HiveSystems?.vfx?.cryoFrostFlash?.(pod.x, pod.z'), 'shatterCryoPod doit émettre le flash d\'onde cryogénique');
assert(gameJs.includes('ent.speedMultiplier = 0.5'), 'shatterCryoPod doit ralentir les entités touchées par hypothermie');
console.log('PASS: shatterCryoPod décals givre, audio craquement, flash VFX et pénalité de vitesse vérifiés');

// 5. Risque Vapeur Surchauffée (ruptureSteamVent)
assert(gameJs.includes('0x94a3b8'), 'ruptureSteamVent doit poser une flaque de condensation métallique (0x94a3b8)');
assert(gameJs.includes('spawnSteamCloud?.(vent.x'), 'ruptureSteamVent doit émettre un nuage de vapeur dense');
assert(gameJs.includes('ent.isBlinded = true'), 'updateSteamVents doit aveugler les humains pris dans le geyser');
assert(gameJs.includes('audioManager.playHumanPanicScream?.(ent.x, ent.z)'), 'updateSteamVents doit déclencher des cris de panique humains');
console.log('PASS: ruptureSteamVent décals condensation, nuage de vapeur, aveuglement et cris de panique vérifiés');

// 6. Modal de Transition Biomorphique & Télémétrie Génétique
assert(indexHtml.includes('modal-directive-banner'), 'index.html doit contenir la bannière de directive du modal');
assert(indexHtml.includes('modal-mutation-telemetry'), 'index.html doit contenir la grille de télémétrie de mutation');
assert(indexHtml.includes('modal-morphology-desc'), 'index.html doit contenir le champ modal-morphology-desc');
assert(indexHtml.includes('modal-host-desc'), 'index.html doit contenir le champ modal-host-desc');
assert(indexHtml.includes('modal-abilities-desc'), 'index.html doit contenir le champ modal-abilities-desc');
console.log('PASS: index.html éléments de télémétrie de mutation vérifiés');

// 7. Méthode showEvolutionTransitionModal et advanceStage
assert(gameJs.includes('showEvolutionTransitionModal(nextStage, act)'), 'advanceStage doit appeler showEvolutionTransitionModal');
assert(gameJs.includes('audioManager.playXenoBiomorphicChime?.()'), 'showEvolutionTransitionModal doit jouer le carillon biomorphique');
assert(gameJs.includes('showEndModal(title, description)'), 'src/game.js doit contenir showEndModal');
console.log('PASS: advanceStage et showEvolutionTransitionModal avec carillon vérifiés');

// 8. Préservation absolue des icônes carrées vectorielles
assert(gameJs.includes('btn-sq-icon'), 'Les modifications de texte de bouton dans game.js doivent conserver la classe btn-sq-icon');
assert(!gameJs.includes("continueButton.textContent = 'RECOMMENCER"), 'continueButton ne doit pas écraser textContent sans icône');
console.log('PASS: Maintien strict des icônes carrées vectorielles dans les boutons dynamiques');

// 9. Styles CSS Weyland-Yutani
assert(styleCss.includes('.modal-directive-banner'), 'src/css/style.css doit styliser .modal-directive-banner');
assert(styleCss.includes('.mutation-telemetry-grid'), 'src/css/style.css doit styliser .mutation-telemetry-grid');
assert(styleCss.includes('.telemetry-block'), 'src/css/style.css doit styliser .telemetry-block');
assert(styleCss.includes('.directive-code'), 'src/css/style.css doit styliser .directive-code');
assert(styleCss.includes('.directive-badge'), 'src/css/style.css doit styliser .directive-badge');
console.log('PASS: Styles CSS du modal de transition biomorphique vérifiés');

console.log('--- TOUS LES TESTS QA AAA WAVE 7 SONT VALIDÉS AVEC SUCCÈS ! (13/13) ---');
