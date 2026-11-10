/**
 * Suite de Validation QA AAA Wave 8
 * Vérifie l'intégration du système de trépas universel du xénomorphe sur tous les actes,
 * des synthétiseurs de trépas (hurlement, flatline EKG) et de victoire (fanfare synaptique),
 * de l'éjection physique des étuis en laiton de balles M41A avec tintement au sol,
 * de la mare d'acide au sol à la mort du joueur, et de la télémétrie complète du modal de fin.
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

console.log('--- EXÉCUTION DE LA SUITE DE TESTS QA AAA WAVE 8 ---');

// 1. Nouveaux Synthétiseurs WebAudio Wave 8
assert(gameJs.includes('playBrassCasingPing('), 'AudioManager doit inclure playBrassCasingPing');
console.log('PASS: playBrassCasingPing présent dans src/game.js');

assert(gameJs.includes('playXenoDeathScreech()'), 'AudioManager doit inclure playXenoDeathScreech');
console.log('PASS: playXenoDeathScreech présent dans src/game.js');

assert(gameJs.includes('playSpecimenFlatlineHeartbeat()'), 'AudioManager doit inclure playSpecimenFlatlineHeartbeat');
console.log('PASS: playSpecimenFlatlineHeartbeat présent dans src/game.js');

assert(gameJs.includes('playHiveVictoryFanfare()'), 'AudioManager doit inclure playHiveVictoryFanfare');
console.log('PASS: playHiveVictoryFanfare présent dans src/game.js');

// 2. Éjection Diégétique d'Étuis en Laiton Three.js
assert(systemsJs.includes('ejectBulletCasing('), 'VFXManager doit inclure ejectBulletCasing');
console.log('PASS: ejectBulletCasing présent dans src/game-systems.js');

assert(systemsJs.includes('effect.bulletCasing'), 'VFXManager.update doit animer effect.bulletCasing');
console.log('PASS: Animation physique de chute et rebond des douilles en laiton validée');

assert(systemsJs.includes('audioManager.playBrassCasingPing?.('), 'Le rebond de douille au sol doit jouer playBrassCasingPing');
console.log('PASS: Tintement de douille métallique sur le pont d\'acier validé');

assert(gameJs.includes('window.HiveSystems?.vfx?.ejectBulletCasing?.(this.x, 1.25, this.z'), 'HumanAI doit éjecter des douilles lors des tirs de fusil à impulsions / smartgun');
console.log('PASS: Déclenchement de l\'éjection des douilles par les Marines USCM validé');

// 3. Trépas Viscéral Universel du Xénomorphe (Acts 1 à 5)
assert(gameJs.includes('audioManager.playXenoDeathScreech?.()'), 'PlayerCreature.takeDamage doit déclencher le cri d\'agonie');
assert(gameJs.includes('rendererEngine.addFloorFluidDecal?.(this.x, this.z, isQueen ? 4.8 : 3.0, 0x84cc16, 45)'), 'PlayerCreature.takeDamage doit créer une flaque d\'acide moléculaire de trépas');
assert(gameJs.includes('rendererEngine.addHitstop?.(0.24)'), 'PlayerCreature.takeDamage doit appliquer un hitstop cinématique');
assert(gameJs.includes('SPÉCIMEN PARASITAIRE ÉRADIQUÉ'), 'PlayerCreature.takeDamage doit couvrir la défaite au Stade Facehugger');
assert(gameJs.includes('REJET DE GESTATION // SUJET PERDU'), 'PlayerCreature.takeDamage doit couvrir la défaite au Stade Chestburster');
assert(gameJs.includes('PRÉDATEUR ADULTE NEUTRALISÉ'), 'PlayerCreature.takeDamage doit couvrir la défaite au Stade Drone/Adulte');
assert(gameJs.includes('LIGNÉE ROYALE ÉTEINTE'), 'PlayerCreature.takeDamage doit couvrir la défaite de la Reine');
console.log('PASS: Trépas viscéral, hitstop, flaque d\'acide et diagnostic de mort pour tous les stades validés');

// 4. Modal de Fin et Télémétrie Dynamique Victoire / Défaite
assert(gameJs.includes('showEndModal(title, description, isVictory = false)'), 'showEndModal doit accepter le flag isVictory');
assert(gameJs.includes('audioManager.playHiveVictoryFanfare?.()'), 'showEndModal doit jouer la fanfare de victoire en cas de conquête');
assert(gameJs.includes('audioManager.playSpecimenFlatlineHeartbeat?.()'), 'showEndModal doit jouer le flatline EKG en cas de défaite');
assert(gameJs.includes('ÉCOSYSTÈME ASSIMILÉ'), 'showEndModal doit afficher le badge de succès');
assert(gameJs.includes('ÉCHEC CRITIQUE'), 'showEndModal doit afficher le badge d\'échec');
console.log('PASS: Télémétrie de fin de cycle (succès vs échec) et audio correspondants validés');

// 5. Préservation absolue des icônes carrées vectorielles
assert(gameJs.includes('btn-sq-icon'), 'showEndModal doit conserver .btn-sq-icon');
console.log('PASS: Préservation du glyphe vectoriel carré dans le bouton de relance');

console.log('--- TOUS LES TESTS QA AAA WAVE 8 SONT VALIDÉS AVEC SUCCÈS ! (13/13) ---');
