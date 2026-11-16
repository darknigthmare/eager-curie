// tools/qa-aaa-wave14.cjs
// Suite de tests QA automatisée pour la Wave 14 : Menu Principal AAA Diégétique, Splash "Fan game by darknigthmare", Boot Apollo OS & Expansion Lore

const fs = require('fs');
const assert = require('assert');

console.log('--- EXÉCUTION DE LA SUITE DE TESTS QA AAA WAVE 14 ---');

const gameJs = fs.readFileSync('src/game.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const styleCss = fs.readFileSync('src/css/style.css', 'utf8');
const gameSystemsJs = fs.readFileSync('src/game-systems.js', 'utf8');
const contentJs = fs.readFileSync('src/content.js', 'utf8');

// 1. Écran Splash "Fan Game by darknigthmare"
assert(indexHtml.includes('id="fan-disclaimer-screen"'), 'Écran #fan-disclaimer-screen manquant dans index.html');
assert(indexHtml.includes('id="btn-enter-terminal"'), 'Bouton #btn-enter-terminal manquant dans index.html');
assert(indexHtml.toLowerCase().includes('fan game by') && indexHtml.toLowerCase().includes('darknightmare'), 'Mention Fan game by darknightmare manquante dans index.html');
console.log('PASS: Écran Splash préliminaire "Fan game by darknigthmare" validé');

// 2. Écran d\'introduction diégétique au Main Menu (Apollo OS)
assert(indexHtml.includes('id="apollo-intro-screen"'), 'Écran #apollo-intro-screen manquant dans index.html');
assert(indexHtml.includes('id="btn-skip-intro"'), 'Bouton #btn-skip-intro manquant dans index.html');
assert(indexHtml.includes('id="apollo-crt-log-stream"'), 'Stream de télémétrie CRT #apollo-crt-log-stream manquant');
assert(styleCss.includes('.apollo-intro-screen') && styleCss.includes('.apollo-crt-terminal'), 'Styles CRT Apollo intro manquants dans style.css');
console.log('PASS: Écran d\'intro diégétique Apollo OS validé avec logs et styles CRT');

// 3. Menu Principal AAA Diégétique
assert(indexHtml.includes('apollo-terminal-header-strip'), 'Bandeau supérieur Apollo terminal manquant sur le main menu');
assert(indexHtml.includes('id="btn-replay-intro"'), 'Bouton #btn-replay-intro manquant dans index.html');
assert(indexHtml.includes('id="menu-diegetic-preview"'), 'Moniteur de prévisualisation diégétique #menu-diegetic-preview manquant');
assert(gameSystemsJs.includes('initDiegeticMainMenu()'), 'Méthode initDiegeticMainMenu manquante dans game-systems.js');
assert(gameSystemsJs.includes('bindDiegeticPreview()'), 'Méthode bindDiegeticPreview manquante dans game-systems.js');
console.log('PASS: Menu principal AAA diégétique avec télémétrie et moniteur interactif validé');

// 4. Synthétiseurs audio procéduraux WebAudio Wave 14
assert(gameJs.includes('playApolloBootChime()'), 'playApolloBootChime manquant dans AudioManager');
assert(gameJs.includes('playCrtDefragBuzz()'), 'playCrtDefragBuzz manquant dans AudioManager');
assert(gameJs.includes('playMenuHoverBeep()'), 'playMenuHoverBeep manquant dans AudioManager');
console.log('PASS: Synthétiseurs sonores diégétiques (chime Apollo, degauss CRT, bip survol) validés');

// 5. Expansion Massive du Lore du Jeu
assert(contentJs.includes('codex_weyland_curie07'), 'Entrée codex_weyland_curie07 manquante dans content.js');
assert(contentJs.includes('codex_specimen_xx121_respiration'), 'Entrée codex_specimen_xx121_respiration manquante');
assert(contentJs.includes('codex_order_937'), 'Entrée codex_order_937 manquante dans content.js');
assert(contentJs.includes('journal_dr_thorne_01'), 'Journal journal_dr_thorne_01 manquant dans content.js');
assert(contentJs.includes('journal_vasquez_halon_vent'), 'Journal journal_vasquez_halon_vent manquant dans content.js');
assert(contentJs.includes('journal_orson_transmission'), 'Journal journal_orson_transmission manquant dans content.js');
assert(contentJs.includes('journal_seegson_log_ap7'), 'Journal journal_seegson_log_ap7 manquant dans content.js');
console.log('PASS: Expansion du lore canonique (Station Curie-07, Ordre 937, Halon, Dr Thorne, Working Joe) validée');

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

console.log('--- TOUS LES TESTS QA AAA WAVE 14 SONT VALIDÉS AVEC SUCCÈS ! (14/14) ---');
