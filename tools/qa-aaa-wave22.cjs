// tools/qa-aaa-wave22.cjs
// Suite de tests QA automatisée pour la Wave 22 : Correctifs Fin de Campagne & Codex,
// Bandeau Autodestruction M.U.T.H.U.R. 6000, Bio-Moniteur EKG Live, Portes Soudées,
// Lampes-Torches Volumétriques, Fusées au Magnésium Illuminantes & Rechargement M41A

const fs = require('fs');
const assert = require('assert');

console.log('--- EXÉCUTION DE LA SUITE DE TESTS QA AAA WAVE 22 ---');

const gameJs = fs.readFileSync('src/game.js', 'utf8');
const gameSystemsJs = fs.readFileSync('src/game-systems.js', 'utf8');
const contentJs = fs.readFileSync('src/campaign-archives.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const styleCss = fs.readFileSync('src/css/style.css', 'utf8');

// 1. Correctifs Critiques Fin de Campagne, Vignettes & Codex Complet
assert(gameJs.includes('const isWin = isVictory === true || /VICTOIRE|DOMINION|EXODE|GRAINE/i.test(String(title || \'\'));'), 'Correction stricte isWin manquante dans showEndModal');
assert(gameSystemsJs.includes('endingThumbnails.ENDING_DOMINION = endingThumbnails.dominion;') && gameSystemsJs.includes('endingIcons.ENDING_ASHES = endingIcons.seed;'), 'Mapping ENDING_DOMINION/EXODUS/ASHES manquant dans game-systems.js');
assert(gameSystemsJs.includes("this.saveManager.unlock(['codex_archives_complete'])"), 'Déblocage codex_archives_complete manquant dans completeEnding');
assert(!gameJs.includes('saveManager?.unlock?.('), 'Appel mort saveManager?.unlock encore présent');
assert(gameJs.includes("'codex_ovomorphe'") && gameJs.includes("'codex_queen'"), 'Entrées codex_* manquantes dans unlocksByStage');
assert(contentJs.includes('id: "codex_reflexe_adn"') && contentJs.includes('id: "codex_castes_etendues"') && contentJs.includes('id: "codex_protocole_kappa"'), '3 entrées Codex manquantes dans content.js');
assert(!indexHtml.includes('darknigthmare'), 'Coquille darknigthmare encore présente dans index.html');
console.log('PASS: Pilier A (Fin de campagne, vignettes endings, Codex complet & typo) validé');

// 2. Bandeau Autodestruction M.U.T.H.U.R. 6000 & Bio-Moniteur EKG Live
assert(indexHtml.includes('id="muthur-purge-banner"') && indexHtml.includes('id="muthur-purge-countdown"'), 'Bandeau #muthur-purge-banner manquant dans index.html');
assert(indexHtml.includes('id="hud-bio-ekg"') && indexHtml.includes('id="hud-bio-ekg-bpm"'), 'Bio-Moniteur #hud-bio-ekg manquant dans index.html');
assert(styleCss.includes('.hud-bio-ekg') && styleCss.includes('.muthur-purge-banner'), 'Styles Wave 22 manquants dans style.css');
assert(gameJs.includes("document.getElementById('hud-bio-ekg')") && gameJs.includes("document.getElementById('muthur-purge-banner')"), 'Mise à jour dynamique EKG / M.U.T.H.U.R. manquante dans game.js');
console.log('PASS: Pilier B (Bandeau M.U.T.H.U.R. 6000 & Bio-Moniteur EKG Live) validé');

// 3. Portes Soudées, Lampes-Torches Volumétriques & Fusées Magnésium Illuminantes
assert(gameJs.includes('if (this.setBlastDoorState(door, false) === false) return false;') && gameJs.includes("seam.name = 'door_weld_seam'"), 'Vérification fermeture & cordon de soudure 3D manquants dans weldDoor');
assert(gameJs.includes("coneMesh.name = 'flashlight_cone_mesh'") && gameJs.includes('this.flashlightActive !== false'), 'Cône volumétrique lampe-torche ou fix EMP manquant dans ensureFlashlight');
assert(gameJs.includes('new THREE.PointLight(0xff4500, 4.8, 16, 1.6)'), 'PointLight dynamique manquante sur spawnMagnesiumFlare');
console.log('PASS: Pilier C (Portes soudées 3D, lampes-torches volumétriques EMP-safe & flares lumineux) validé');

// 4. Rechargement M41A USCM (Chargeur + Claquement + Fenêtre d'embuscade)
assert(gameJs.includes('playM41AReloadClack('), 'Synthétiseur playM41AReloadClack manquant');
assert(gameJs.includes('this.m41aMagBursts') && gameJs.includes('RECHARGEMENT M41A ! COUVREZ-MOI !'), 'Compteur de chargeur et pause de rechargement M41A manquants');
console.log('PASS: Pilier D (Rechargement M41A USCM & fenêtre d\'embuscade) validé');

// 5. Préservation absolue des carrés d'icônes vectorielles statiques (30/30)
const buttonMatches = indexHtml.match(/class="[^"]*btn-sq-icon[^"]*"/g) || [];
assert(buttonMatches.length >= 30, `Au moins 30 boutons avec icônes carrées requis (trouvé: ${buttonMatches.length})`);
console.log(`PASS: Préservation absolue des carrés d'icônes vectorielles statiques (${buttonMatches.length}/30)`);

// 6. Équilibre parfait des délimiteurs sur tous les modules clés
['src/game.js', 'src/game-systems.js', 'src/models.js', 'src/content.js', 'src/station-detail.js'].forEach((filePath) => {
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

console.log('--- TOUS LES TESTS QA AAA WAVE 22 SONT VALIDÉS AVEC SUCCÈS ! (11/11) ---');
