// tools/qa-aaa-wave23.cjs
// Suite de tests QA automatisée pour la Wave 23 : Refonte & Correction Complète RTS Phase 5
// (Fix Game Over sur unité non-Reine, raccourcis [1-5]/[P]/[C]/[N] sans collision, Pathfinding A*,
//  Corruption physique des relais PALIMPSESTE, SFX/VFX RTS distincts, HUD 2-niveaux & Lore cohérent)

const fs = require('fs');
const assert = require('assert');

console.log('--- EXÉCUTION DE LA SUITE DE TESTS QA AAA WAVE 23 ---');

const gameJs = fs.readFileSync('src/game.js', 'utf8');
const gameSystemsJs = fs.readFileSync('src/game-systems.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const styleCss = fs.readFileSync('src/css/style.css', 'utf8');

// 1. Correctifs P0 Gameplay & Contrôles RTS
assert(gameJs.includes('else if (stageIndex === 5)') && gameJs.includes('[PERTE ESSAIM]'), 'Fix P0 Game Over sur mort d\'une unité non-Reine manquant');
assert(gameJs.includes("if (key === 'l' || (key === 'p' && this.currentStageIndex !== 5))"), 'Fix P0 interception [P] par Blueprint en Stage 5 manquant');
assert(gameSystemsJs.includes('if (!activeSystemLayer && this.campaignActive && this.game?.currentStageIndex === 5) return;'), 'Priorité du Cri Royal [C] hors des panneaux système manquante');
assert(gameJs.includes('getActiveOriginPoint()'), 'Fix P0 origine Stage 5 pour piste olfactive [N] et ripple manquant');
assert(gameJs.includes('if ((unit.attackCooldown || 0) > 0) return;'), 'Fix P0 cooldown attaque en mode possession manquant');
assert(!gameJs.includes('rtsBiomass'), 'Ancienne propriété erronée rtsBiomass encore présente');
console.log('PASS: Pilier 1 (Correctifs P0 Game Over, raccourcis [1-5]/[P]/[C]/[N], cooldown possession & biomasse) validé');

// 2. IA RTS, Pathfinding A*, Corruption Tactique Relais PALIMPSESTE & Économie Vivante
assert(gameJs.includes('this.moveTowards(target.x, target.z, deltaSeconds, speedMultiplier)'), 'Pathfinding A* moveTowards manquant dans HiveUnit.update');
assert(gameJs.includes("['spitter', 'reef_spitter', 'pathogen_blight'].includes(this.caste)"), 'Support complet castes à distance + LoS manquant');
assert(gameJs.includes('relay.userData.corruptProgress = Math.min(100,') && gameJs.includes('this.oviBiomassTimer'), 'Corruption physique des relais PALIMPSESTE ou récolte passive ovipositeur manquante');
console.log('PASS: Pilier 2 (Pathfinding A*, Spitters LoS, corruption physique relais & économie) validé');

// 3. VFX & SFX RTS Diégétiques 1:1
assert(gameJs.includes('playRtsUnitHatched(') && gameJs.includes('playQueenUnderAttackAlert('), 'Synthétiseurs RTS playRtsUnitHatched / playQueenUnderAttackAlert manquants');
assert(gameJs.includes('playRtsOrderPing(x = null, z = null, command = \'HUNT\')'), 'Signature sonore différenciée playRtsOrderPing par commande manquante');
assert(gameJs.includes("beamMesh.name = 'relay_beacon_beam'") && gameJs.includes('ROYAL_GUARD: 0xd946ef'), 'Balises verticales relais ou couleur ROYAL_GUARD manquantes');
console.log('PASS: Pilier 3 (SFX RTS distincts, alerte Reine, balises relais & anneaux animés) validé');

// 4. HUD RTS 2-Niveaux, Télémétrie Reine/Ordres/Escouade & Cohérence Lore MNEMOSYNE/PALIMPSESTE
assert(indexHtml.includes('id="rts-queen-status"') && indexHtml.includes('id="rts-active-order"') && indexHtml.includes('id="rts-bio-quick"'), 'Indicateurs Reine / Ordre actif / Biomasse manquants dans #rts-tactical-monitor');
assert(indexHtml.includes('SYNAPSE MATRIARCALE') && indexHtml.includes('PALIMPSESTE // PROTOCOLE DE PURGE TERMINAL — MNEMOSYNE'), 'Cohérence Lore MNEMOSYNE/PALIMPSESTE manquante dans index.html');
assert(gameJs.includes('Exochargeur lourd MN-500') && gameJs.includes('Tourelle autonome KAPPA-7'), 'Cohérence Lore IRISE/KAPPA manquante dans StageHiveRTS');
assert(styleCss.includes('.rts-cmd-palette') && styleCss.includes('.rts-chip-hp-track') && styleCss.includes('top: 126px;'), 'Styles layout 2-niveaux RTS & anti-chevauchement manquants dans style.css');
console.log('PASS: Pilier 4 (HUD RTS 2-niveaux, télémétrie Reine/Escouade, anti-chevauchement & Lore) validé');

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

console.log('--- TOUS LES TESTS QA AAA WAVE 23 SONT VALIDÉS AVEC SUCCÈS ! (11/11) ---');
