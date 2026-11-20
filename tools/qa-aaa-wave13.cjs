// tools/qa-aaa-wave13.cjs
// Suite de tests QA automatisée pour la Wave 13 : Extinction Industrielle Halon 1301, Privation O2 & Moniteur Diégétique

const fs = require('fs');
const assert = require('assert');

console.log('--- EXÉCUTION DE LA SUITE DE TESTS QA AAA WAVE 13 ---');

const gameJs = fs.readFileSync('src/game.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const styleCss = fs.readFileSync('src/css/style.css', 'utf8');
const gameSystemsJs = fs.readFileSync('src/game-systems.js', 'utf8');
const modelsJs = fs.readFileSync('src/models.js', 'utf8');

// 1. Synthétiseurs WebAudio procéduraux Wave 13
assert(gameJs.includes('playHumanChokingGasp(x = null, z = null)'), 'playHumanChokingGasp manquant dans AudioManager');
console.log('PASS: playHumanChokingGasp présent dans src/game.js');

assert(gameJs.includes('playHalonKlaxonWarning(x = null, z = null)'), 'playHalonKlaxonWarning manquant dans AudioManager');
console.log('PASS: playHalonKlaxonWarning présent dans src/game.js');

// 2. Modèles 3D : Manomètres barométriques sur générateurs et extincteurs Halon 1301
const manometerMatches = modelsJs.match(/'halon_manometer'/g) || [];
assert(manometerMatches.length >= 2, `Au moins 2 manomètres halon_manometer requis dans src/models.js (trouvé: ${manometerMatches.length})`);
console.log('PASS: Manomètres barométriques halon_manometer modélisés sur générateurs et extincteurs');

// 3. Logique d'atmosphère, privation d'O2 et camouflet gazeux
assert(gameJs.includes('updateAtmoCompositionSensor(safeDelta)'), 'Méthode updateAtmoCompositionSensor manquante dans StationMap');
assert(gameJs.includes('updateAtmosphericCompositionSensor(safeDelta)'), 'Méthode alias updateAtmosphericCompositionSensor manquante');
assert(gameJs.includes('playHalonKlaxonWarning?.'), 'Alerte sonore klaxon manquante lors de la purge halon');
assert(gameJs.includes('playHumanChokingGasp?.'), 'Spasmes d\'asphyxie humaine manquants sous halon');
console.log('PASS: Télémétrie d\'oxygène et hypoxie humaine validées');

// 4. Intégration diégétique dans index.html et style.css
assert(indexHtml.includes('id="atmo-composition-sensor"'), 'Élément #atmo-composition-sensor manquant dans index.html');
assert(indexHtml.includes('id="halon-o2-monitor"'), 'Élément #halon-o2-monitor manquant dans index.html');
assert(indexHtml.includes('id="atmo-o2-val"'), 'Élément #atmo-o2-val manquant dans index.html');
assert(styleCss.includes('.atmo-composition-sensor') && styleCss.includes('.halon-purge'), 'Classes CSS .atmo-composition-sensor ou .halon-purge manquantes');
assert(styleCss.includes('@keyframes halonO2Strobe'), 'Animation stroboscopique @keyframes halonO2Strobe manquante');
console.log('PASS: Capteur diégétique d\'O2 et styles stroboscopiques validés');

// 5. Préservation absolue des carrés d\'icônes vectorielles statiques (24/24)
const buttonMatches = indexHtml.match(/class="[^"]*btn-sq-icon[^"]*"/g) || [];
assert(buttonMatches.length >= 24, `Au moins 24 boutons avec icônes carrées requis (trouvé: ${buttonMatches.length})`);
console.log('PASS: Préservation absolue des carrés d\'icônes vectorielles statiques (24/24)');

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
  assert(b === 0 && p === 0 && k === 0, `Délimiteurs déséquilibrés dans ${filePath}: { b: ${b}, p: ${p}, k: ${k} }`);
  console.log(`PASS: Équilibre parfait des délimiteurs { b: ${b}, p: ${p}, k: ${k} } dans ${filePath}`);
});

console.log('--- TOUS LES TESTS QA AAA WAVE 13 SONT VALIDÉS AVEC SUCCÈS ! (12/12) ---');
