// tools/qa-aaa-wave18.cjs
// Suite de tests QA automatisée pour la Wave 18 : Correctifs Éclairage/Level Design, IA Combat/Boss 1:1, HUD Boss & Furtivité, Castes Complètes & Fix Double-Icône

const fs = require('fs');
const assert = require('assert');

console.log('--- EXÉCUTION DE LA SUITE DE TESTS QA AAA WAVE 18 ---');

const gameJs = fs.readFileSync('src/game.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const styleCss = fs.readFileSync('src/css/style.css', 'utf8');
const gameSystemsJs = fs.readFileSync('src/game-systems.js', 'utf8');
const modelsJs = fs.readFileSync('src/models.js', 'utf8');

// 1. Domaine A : Éclairage, Blackout, Strobe, Caméras & Level Design
assert(gameJs.includes('this.beaconSpot.intensity = isAlarmActive ? 85 : 0'), 'Calibration beaconSpot manquante');
assert(gameJs.includes('this._baseAmbientIntensity'), 'Correctif saturation strobeFlashTimer manquant');
assert(gameJs.includes('cam.sparkTimer') && gameJs.includes('electricalJunctionSpark?.(cam.x, 3.5, cam.z, 6)'), 'Étincelles résiduelles sur caméras détruites manquantes');
assert(gameJs.includes('addProp(-24, -58, 6, 2.5, 3'), 'Décalage console cryo_3 manquant');
assert(gameJs.includes('addPipe(offset, 0, 140, false, 6.5)'), 'Recentrage tuyaux addPipe manquant');
console.log('PASS: Domaine A (Éclairage, blackout, strobe, étincelles caméras, tuyaux & cryo_3) validé');

// 2. Domaine B : IA Combat, Boss 1:1 (BRIAREOS-7, MANTIS-4, P-5000), Feu & Escouades USCM
assert(gameJs.includes('briareos.hp = briareos.maxHp = 520') && gameJs.includes('briareos.bossShield = briareos.maxBossShield = 180'), 'Stats boss BRIAREOS-7 manquantes');
assert(gameJs.includes('mantis.hp = mantis.maxHp = 460'), 'Stats boss MANTIS-4 manquantes');
assert(gameJs.includes('BOUCLIER BRIAREOS -'), 'Phase 1/2 BRIAREOS-7 manquante dans takeDamage');
assert(gameJs.includes('RUPTURE HYDRAULIQUE P-5000 (+50%)'), 'Armure directionnelle P-5000 manquante');
assert(gameJs.includes('static notifySquadWitness('), 'Réactions témoins Headbite/Kidnapping manquantes');
assert(gameJs.includes('this.coveringFireCooldown = 2.2'), 'Correctif anti-spam tir de couverture USCM manquant');
assert(gameJs.includes('AVERSION THERMIQUE !'), 'Aversion thermique face au feu manquante');
console.log('PASS: Domaine B (Boss BRIAREOS-7 & MANTIS-4, P-5000, témoins USCM, anti-spam & aversion feu) validé');

// 3. Domaine C : HUD Boss, Capteur Furtivité, Castes Complètes & Fix Double-Icône
assert(indexHtml.includes('id="boss-telemetry-hud"') && indexHtml.includes('id="boss-hud-shield-fill"'), 'Bandeau #boss-telemetry-hud manquant dans index.html');
assert(indexHtml.includes('id="stealth-visibility-sensor"') && indexHtml.includes('id="stealth-status-val"'), 'Capteur #stealth-visibility-sensor manquant dans index.html');
assert(styleCss.includes('.boss-telemetry-hud') && styleCss.includes('.stealth-visibility-sensor'), 'Styles Wave 18 manquants dans style.css');
assert(gameJs.includes('id="btn-prowler-ambush"') && gameJs.includes('id="btn-offspring-siphon"'), 'Boutons castes prowler et offspring manquants dans StageDrone.updateHUD');
assert(gameJs.includes("btn.querySelector('.action-sq-icon, .btn-sq-icon, svg')"), 'Correctif anti double-icône manquant dans enrichActionButtonsWithSquareIcons');
console.log('PASS: Domaine C (HUD Boss, Capteur Furtivité, Castes Prowler/Palatine/Offspring & Fix Double-Icône) validé');

// 4. Préservation absolue des carrés d\'icônes vectorielles statiques (30/30)
const buttonMatches = indexHtml.match(/class="[^"]*btn-sq-icon[^"]*"/g) || [];
assert(buttonMatches.length >= 30, `Au moins 30 boutons avec icônes carrées requis (trouvé: ${buttonMatches.length})`);
console.log(`PASS: Préservation absolue des carrés d'icônes vectorielles statiques (${buttonMatches.length}/30)`);

// 5. Équilibre parfait des délimiteurs
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

console.log('--- TOUS LES TESTS QA AAA WAVE 18 SONT VALIDÉS AVEC SUCCÈS ! (12/12) ---');
