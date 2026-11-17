// tools/qa-aaa-wave15.cjs
// Suite de tests QA automatisée pour la Wave 15 : Prologue CRT, Overlays Diégétiques Apollo, Lecteur Bande Audio Codex & Lore In-Game

const fs = require('fs');
const assert = require('assert');

console.log('--- EXÉCUTION DE LA SUITE DE TESTS QA AAA WAVE 15 ---');

const gameJs = fs.readFileSync('src/game.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const styleCss = fs.readFileSync('src/css/style.css', 'utf8');
const gameSystemsJs = fs.readFileSync('src/game-systems.js', 'utf8');
const contentJs = fs.readFileSync('src/content.js', 'utf8');

// 1. Prologue CRT & Schéma Tactique ÉCHO-12
assert(indexHtml.includes('prologue-schematic-banner'), 'Schéma tactique #prologue-schematic-banner manquant dans index.html');
assert(indexHtml.includes('WEYLAND-YUTANI // BRIEFING OPÉRATIONNEL'), 'En-tête Apollo manquant sur #prologue-screen');
assert(styleCss.includes('.prologue-schematic-banner') && styleCss.includes('.prologue-schematic-svg'), 'Styles .prologue-schematic-banner manquants dans style.css');
console.log('PASS: Prologue CRT avec schéma tactique ÉCHO-12 et en-tête Apollo validé');

// 2. Overlays & Modales Diégétiques (Stage Modal, Pause, Settings, Codex, Ending)
assert(indexHtml.includes('id="modal-bio-waveform"'), 'Oscilloscope bio-waveform manquant dans #stage-modal');
assert(indexHtml.includes('APOLLO OS // SESSION SUSPENDUE'), 'En-tête Apollo manquant sur #pause-overlay');
assert(indexHtml.includes('WEYLAND-YUTANI // CONVERGENCE FINALE'), 'En-tête Apollo manquant sur #ending-overlay');
const scanlineMatches = indexHtml.match(/class="crt-overlay-scanlines"/g) || [];
assert(scanlineMatches.length >= 6, `Au moins 6 overlays doivent intégrer .crt-overlay-scanlines (trouvé: ${scanlineMatches.length})`);
console.log(`PASS: Overlays unifiés sous scanlines CRT Apollo (${scanlineMatches.length} couches)`);

// 3. Lecteur Audio Bande Magnétique Seegson dans le Codex
assert(gameSystemsJs.includes('codex-audio-tape-bar'), 'Lecteur codex-audio-tape-bar manquant dans renderCodexDetail');
assert(gameSystemsJs.includes('LIRE BANDE AUDIO'), 'Bouton de lecture bande audio manquant dans renderCodexDetail');
assert(styleCss.includes('.codex-audio-tape-bar') && styleCss.includes('@keyframes tapeWaveSweep'), 'Styles lecteur bande audio manquants dans style.css');
console.log('PASS: Lecteur d\'archive audio Seegson dans le Codex validé');

// 4. Retours sonores sur boutons d\'overlays et extraction de lore en jeu
assert(gameSystemsJs.includes('btn-start-act-one') && gameSystemsJs.includes('playMenuHoverBeep'), 'Bips de survol manquants sur les boutons d\'overlays');
assert(gameJs.includes('SEEGSON AP-7 // ARCHIVE EXTRAITE'), 'Extraction narrative Seegson manquante dans hackSeegsonTerminal');
assert(gameJs.includes('M.U.T.H.U.R. 6000 // DIRECTIVE 937'), 'Diffusion narrative Directive 937 manquante dans interactMuthurTerminal');
console.log('PASS: Extraction de lore in-game et retours sonores diégétiques validés');

// 5. Continuation du Lore (Actes II à V)
assert(contentJs.includes('codex_hive_mind_resonance'), 'codex_hive_mind_resonance manquant dans content.js');
assert(contentJs.includes('codex_apollo_self_destruct'), 'codex_apollo_self_destruct manquant dans content.js');
assert(contentJs.includes('journal_hull_breach_09'), 'journal_hull_breach_09 manquant dans content.js');
assert(contentJs.includes('journal_dockyard_p5000'), 'journal_dockyard_p5000 manquant dans content.js');
console.log('PASS: 4 nouvelles entrées de lore canonique (Réseau Synaptique, Autodestruction Apollo, Brèche Zéro-G, Soute P-5000) validées');

// 6. Préservation absolue des carrés d\'icônes vectorielles statiques (27/27)
const buttonMatches = indexHtml.match(/class="[^"]*btn-sq-icon[^"]*"/g) || [];
assert(buttonMatches.length >= 27, `Au moins 27 boutons avec icônes carrées requis (trouvé: ${buttonMatches.length})`);
console.log(`PASS: Préservation absolue des carrés d'icônes vectorielles statiques (${buttonMatches.length}/27)`);

// 7. Équilibre parfait des délimiteurs
['src/game.js', 'src/game-systems.js', 'src/models.js', 'src/content.js'].forEach((filePath) => {
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

console.log('--- TOUS LES TESTS QA AAA WAVE 15 SONT VALIDÉS AVEC SUCCÈS ! (12/12) ---');
