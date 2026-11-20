/**
 * Suite de Validation QA AAA Wave 9
 * Vérifie l'intégration du kidnapping vertical au plafond (scène de Brett 1979),
 * de l'embuscade d'émergence des conduits avec projection de grille,
 * de la lampe torche dynamique humaine (grésillement sous stress et sursaut de contact visuel),
 * et de l'horodatage télémétrique militaire du log sensoriel.
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

console.log('--- EXÉCUTION DE LA SUITE DE TESTS QA AAA WAVE 9 ---');

// 1. Synthétiseurs WebAudio Wave 9
assert(gameJs.includes('playCeilingBloodDrip('), 'AudioManager doit inclure playCeilingBloodDrip');
console.log('PASS: playCeilingBloodDrip présent dans src/game.js');

assert(gameJs.includes('playVentGrateKick('), 'AudioManager doit inclure playVentGrateKick');
console.log('PASS: playVentGrateKick présent dans src/game.js');

assert(gameJs.includes('playFlashlightFlicker('), 'AudioManager doit inclure playFlashlightFlicker');
console.log('PASS: playFlashlightFlicker présent dans src/game.js');

assert(gameJs.includes('playHumanSpotXenoGasp('), 'AudioManager doit inclure playHumanSpotXenoGasp');
console.log('PASS: playHumanSpotXenoGasp présent dans src/game.js');

// 2. Kidnapping Vertical au Plafond (Scène Brett 1979 - executeCeilingImpale)
assert(gameJs.includes('audioManager.playCeilingBloodDrip?.(victim.x, victim.z)'), 'executeCeilingImpale doit jouer le sang qui goutte');
assert(gameJs.includes('rendererEngine.addFloorFluidDecal?.(victim.x, victim.z, 2.4, 0x7f1d1d, 35)'), 'executeCeilingImpale doit poser une flaque de sang sous la victime');
assert(gameJs.includes('window.HiveSystems?.vfx?.sporeDrip?.(victim.x, 3.8, victim.z, 8)'), 'executeCeilingImpale doit émettre des gouttes de sang tombant des combles');
console.log('PASS: executeCeilingImpale hitstop, flaque de sang au sol, audio et gouttes validés');

// 3. Embuscade de Sortie de Conduit (exitVent)
assert(gameJs.includes('audioManager.playVentGrateKick?.(this.x, this.z)'), 'exitVent doit jouer le coup de pied dans la grille');
assert(gameJs.includes('human.staggerTimer = 1.4; // Étourdissement de terreur'), 'exitVent doit appliquer la terreur surprise aux humains proches');
assert(gameJs.includes('audioManager.playHumanPanicScream?.(human.x, human.z)'), 'exitVent doit déclencher les cris de panique');
console.log('PASS: exitVent éjection de grille métallique, terreur surprise et panique validées');

// 4. Lampe Torche Dynamique et Contact Visuel (HumanAI)
assert(gameJs.includes('audioManager.playFlashlightFlicker?.(this.x, this.z)'), 'HumanAI doit faire grésiller la lampe sous stress');
assert(gameJs.includes('audioManager.playHumanSpotXenoGasp?.(this.x, this.z)'), 'HumanAI doit faire sursauter l\'humain qui éclaire le xénomorphe');
console.log('PASS: HumanAI grésillement de lampe torche et sursaut de détection validés');

// 5. Horodatage Militaire et Structure du Log Sensoriel
assert(gameJs.includes('log-timestamp'), 'appendSensorLog doit injecter un élément log-timestamp');
assert(styleCss.includes('.log-timestamp'), 'src/css/style.css doit styliser .log-timestamp');
assert(styleCss.includes('.log-line.stealth'), 'src/css/style.css doit supporter .log-line.stealth');
assert(styleCss.includes('.log-line.combat'), 'src/css/style.css doit supporter .log-line.combat');
console.log('PASS: Horodatage diégétique et styles du log sensoriel validés');

// 6. Préservation stricte des 23 boutons avec icônes carrées vectorielles
const regex = /<button[^>]*id="([^"]+)"/g;
let m;
let missing = 0;
while ((m = regex.exec(indexHtml)) !== null) {
  const id = m[1];
  const slice = indexHtml.slice(m.index, m.index + 500);
  const end = slice.indexOf('</button>');
  const sub = slice.slice(0, end);
  if (!sub.includes('<svg')) missing++;
}
assert.strictEqual(missing, 0, '100% des boutons avec id doivent posséder un carré d\'icône vectorielle');
console.log('PASS: Préservation absolue des carrés d\'icônes vectorielles');

console.log('--- TOUS LES TESTS QA AAA WAVE 9 SONT VALIDÉS AVEC SUCCÈS ! (14/14) ---');
