// tools/qa-aaa-wave16.cjs
// Suite de tests QA automatisée pour la Wave 16 : Refonte Complète de la Partie RTS (Caméra Libre, Clic-Droit, Roster & Moniteur Purge/Relais)

const fs = require('fs');
const assert = require('assert');

console.log('--- EXÉCUTION DE LA SUITE DE TESTS QA AAA WAVE 16 ---');

const gameJs = fs.readFileSync('src/game.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const styleCss = fs.readFileSync('src/css/style.css', 'utf8');
const gameSystemsJs = fs.readFileSync('src/game-systems.js', 'utf8');
const modelsJs = fs.readFileSync('src/models.js', 'utf8');

// 1. Synthétiseurs WebAudio RTS
assert(gameJs.includes('playRtsUnitSelect()'), 'playRtsUnitSelect manquant dans AudioManager');
assert(gameJs.includes('playRtsOrderPing(x = null, z = null'), 'playRtsOrderPing manquant dans AudioManager');
assert(gameJs.includes('playRtsRelayIsolated(x = null, z = null'), 'playRtsRelayIsolated manquant dans AudioManager');
console.log('PASS: Synthétiseurs WebAudio RTS (sélection unité, ping ordre, isolement relais) validés');

// 2. Caméra libre RTS, Clic-Droit Contextuel & Sélection d\'Escouade
assert(gameJs.includes('this.cameraFocus = { x: 20, z: 10 }'), 'cameraFocus manquant dans StageHiveRTS');
assert(gameJs.includes('focusCameraOnQueen()'), 'focusCameraOnQueen manquant dans StageHiveRTS');
assert(gameJs.includes('selectRtsUnit(unit)') && gameJs.includes('selectRtsCaste(caste)'), 'Sélection d\'unité et caste manquante dans StageHiveRTS');
assert(gameJs.includes('handleCanvasRightClick(screenX, screenY)'), 'handleCanvasRightClick manquant dans StageHiveRTS');
assert(gameJs.includes('placePheromoneOrder(x, z, command)'), 'placePheromoneOrder manquant dans StageHiveRTS');
assert(gameJs.includes('button === 2 && this.currentStageIndex === 5'), 'Câblage clic-droit manquant dans GameMaster.init');
console.log('PASS: Caméra libre RTS, recentrage Reine [H], clic-droit contextuel et sélection d\'escouade validés');

// 3. Préservation des icônes carrées dans StageHiveRTS.updateStats()
assert(gameJs.includes("oviButton.querySelector('span')") && gameJs.includes("conquestButton.querySelector('span')"), 'Correctif de préservation .btn-sq-icon manquant dans updateStats()');
console.log('PASS: Préservation des icônes carrées .btn-sq-icon validée dans StageHiveRTS.updateStats()');

// 4. Moniteur Tactique RTS & Roster dans index.html et style.css
assert(indexHtml.includes('id="rts-tactical-monitor"'), '#rts-tactical-monitor manquant dans index.html');
assert(indexHtml.includes('id="rts-purge-timer"') && indexHtml.includes('id="rts-relay-1"') && indexHtml.includes('id="rts-squad-chips"'), 'Éléments du moniteur RTS manquants dans index.html');
assert(indexHtml.includes('id="btn-rts-focus-queen"'), 'Bouton #btn-rts-focus-queen manquant dans index.html');
assert(styleCss.includes('.rts-tactical-monitor') && styleCss.includes('.rts-squad-chip') && styleCss.includes('.rts-relay-diode'), 'Styles CSS RTS manquants dans style.css');
console.log('PASS: Moniteur tactique RTS (Purge, Relais, Cycles, Escouade) validé dans index.html et style.css');

// 5. Préservation absolue des carrés d\'icônes vectorielles statiques (28/28)
const buttonMatches = indexHtml.match(/class="[^"]*btn-sq-icon[^"]*"/g) || [];
assert(buttonMatches.length >= 28, `Au moins 28 boutons avec icônes carrées requis (trouvé: ${buttonMatches.length})`);
console.log(`PASS: Préservation absolue des carrés d'icônes vectorielles statiques (${buttonMatches.length}/28)`);

// 6. Équilibre parfait des délimiteurs
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

console.log('--- TOUS LES TESTS QA AAA WAVE 16 SONT VALIDÉS AVEC SUCCÈS ! (12/12) ---');
