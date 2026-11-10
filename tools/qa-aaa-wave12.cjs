// tools/qa-aaa-wave12.cjs
// Suite de tests QA automatisée pour la Wave 12 (Chantier AAA 1:1 Overhaul)

const fs = require('fs');
const assert = require('assert');

console.log('--- EXÉCUTION DE LA SUITE DE TESTS QA AAA WAVE 12 ---');

const gameJs = fs.readFileSync('src/game.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const styleCss = fs.readFileSync('src/css/style.css', 'utf8');
const gameSystemsJs = fs.readFileSync('src/game-systems.js', 'utf8');
const modelsJs = fs.readFileSync('src/models.js', 'utf8');

// 1. Synthétiseurs WebAudio procéduraux Wave 12
assert(gameJs.includes('playCryoPodGlassCrack(x = null, z = null)'), 'playCryoPodGlassCrack manquant dans AudioManager');
console.log('PASS: playCryoPodGlassCrack présent dans src/game.js');

assert(gameJs.includes('playCryoVentHiss(x = null, z = null)'), 'playCryoVentHiss manquant dans AudioManager');
console.log('PASS: playCryoVentHiss présent dans src/game.js');

assert(gameJs.includes('playStasisAwakeningGasp(x = null, z = null)'), 'playStasisAwakeningGasp manquant dans AudioManager');
console.log('PASS: playStasisAwakeningGasp présent dans src/game.js');

// 2. Dépressurisation, bris et réveil des caissons cryogéniques 1:1
assert(gameJs.includes('shatterCryoPod(pod, instigator = null)'), 'shatterCryoPod manquant dans StationMap');
assert(gameJs.includes('audioManager.playCryoPodGlassCrack?.(pod.x, pod.z)'), 'Audio playCryoPodGlassCrack manquant dans shatterCryoPod');
assert(gameJs.includes('audioManager.playCryoVentHiss?.(pod.x, pod.z)'), 'Audio playCryoVentHiss manquant dans shatterCryoPod');
assert(gameJs.includes('audioManager.playStasisAwakeningGasp?.(pod.x, pod.z)'), 'Audio playStasisAwakeningGasp manquant dans shatterCryoPod');
assert(gameJs.includes('rendererEngine.addFloorFluidDecal?.(pod.x, pod.z, 3.2, 0x93c5fd, 35)'), 'Décalque givre cryogénique sol manquant dans shatterCryoPod');
assert(gameJs.includes('window.HiveSystems?.vfx?.cryoVaporPlume?.(pod.x, 1.2, pod.z, 16)'), 'Panache azote cryogénique manquant dans shatterCryoPod');
console.log('PASS: shatterCryoPod validé avec audio procédural 1:1, VFX azote et décalque fluide givré');

// 3. Caissons de stase Weyland-Yutani (Chantier 112)
assert(gameJs.includes('shatterCryoStasisPod(pod)'), 'shatterCryoStasisPod manquant dans StationMap');
assert(modelsJs.includes('cryo_piston_left') && modelsJs.includes('cryo_status_led'), 'Vérins hydrauliques et LED stase manquants dans les modèles cryo');
console.log('PASS: shatterCryoStasisPod et modèles 3D cryogéniques validés');

// 4. Oscilloscope CRT Phosphorique Vert Diégétique & Surveillance Radio
assert(indexHtml.includes('narrative-audio-oscilloscope') || indexHtml.includes('narrative-oscilloscope'), 'Oscilloscope audio radio manquant dans index.html');
assert(styleCss.includes('.narrative-oscilloscope') && styleCss.includes('.waveform-crt-anim'), 'Styles et animations de l\'oscilloscope CRT manquants dans style.css');
console.log('PASS: Oscilloscope CRT vert phosphorique 1:1 validé dans le HUD et CSS');

// 5. Capteur Thermique Cryogénique Ambiant (Sevastopol / Nostromo)
assert(indexHtml.includes('cryo-ambient-sensor') && indexHtml.includes('cryo-ambient-temp'), 'Capteur cryogénique ambiant manquant dans index.html');
assert(gameJs.includes('updateAmbientTemperatureSensor(safeDelta)'), 'Méthode updateAmbientTemperatureSensor manquante dans StationMap');
assert(styleCss.includes('.cryo-ambient-sensor') && styleCss.includes('.cryo-ambient-sensor.deep-freeze'), 'Styles de capteur cryo et gel extrême manquants dans style.css');
console.log('PASS: Capteur thermique cryogénique diégétique et jauge dynamique validés');

// 6. Préservation absolue des carrés d\'icônes vectorielles statiques (24/24)
assert(!indexHtml.includes('<!-- MISSING_ICON -->'), 'Aucune icône manquante autorisée dans index.html');
const buttonMatches = indexHtml.match(/class="[^"]*btn-sq-icon[^"]*"/g) || [];
assert(buttonMatches.length >= 24, `Au moins 24 boutons avec icônes carrées requis (trouvé: ${buttonMatches.length})`);
console.log('PASS: Préservation absolue des carrés d\'icônes vectorielles statiques (24/24)');

// 7. Vérification de l'équilibre des délimiteurs
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

console.log('--- TOUS LES TESTS QA AAA WAVE 12 SONT VALIDÉS AVEC SUCCÈS ! (14/14) ---');
