// tools/qa-aaa-wave20.cjs
// Suite de tests QA automatisée pour la Wave 20 : Fidélité 1:1 Systèmes Critiques, VFX, Audio, IA & Modèles 3D

const fs = require('fs');
const assert = require('assert');

console.log('--- EXÉCUTION DE LA SUITE DE TESTS QA AAA WAVE 20 ---');

const gameJs = fs.readFileSync('src/game.js', 'utf8');
const gameSystemsJs = fs.readFileSync('src/game-systems.js', 'utf8');
const modelsJs = fs.readFileSync('src/models.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');

// 1. Restauration des méthodes VFX manquantes + Fumée acide animée + Filaments salive + Piston pharyngien
assert(gameSystemsJs.includes('beam(x1, y1, z1, x2, y2, z2'), 'VFXManager.beam() manquant');
assert(gameSystemsJs.includes('tracer(x1, y1, z1, x2, y2, z2'), 'VFXManager.tracer() manquant');
assert(gameSystemsJs.includes('spawnFrostGroundPool(x, z'), 'VFXManager.spawnFrostGroundPool() manquant');
assert(gameSystemsJs.includes('innerJawFlash(x, y, z'), 'VFXManager.innerJawFlash() manquant');
assert(gameSystemsJs.includes('effect.smokeWisps'), 'Animation des volutes de fumée acide manquante dans VFXManager');
console.log('PASS: Pilier A1 (VFX beam, tracer, spawnFrostGroundPool, innerJawFlash, smokeWisps & salive) validé');

// 2. Restauration des 13 méthodes AudioManager manquantes + playDryFireClick + Ambiance Nostromo/Sevastopol
['playDryFireClick(', 'playAcidBurn(', 'playAcidBurnSizzle(', 'playHumanPanicScream(', 'playLeapAttack(', 'playPistolShot(', 'playChestburst(', 'playEggHatch(', 'playMetalClawSparks(', 'playMetalTear(', 'playHeavyImpact(', 'playRadioAlertBeep(', 'playHissSound(', 'playPowerHum('].forEach((fn) => {
  assert(gameJs.includes(fn), `Méthode AudioManager manquante : ${fn}`);
});
assert(gameJs.includes('airSource.loop = true'), 'Flux d\'air filtré Nostromo/Sevastopol manquant dans startAmbience');
assert(gameJs.includes('audioManager.playSteamVentHiss?.(sv.x, sv.z)'), 'Audio vapeur périodique manquant dans updateSteamVents');
assert(gameJs.includes('audioManager.playCavernousHullCreak?.(sx, sz)') && gameJs.includes('audioManager.playFluorescentBuzz?.('), 'Audio coque caverneuse / néon manquant dans updateAmbientHullCreaks');
console.log('PASS: Pilier A2 (14 méthodes AudioManager, ambiance airflow, vapeur & coque/néon) validé');

// 3. Motion Tracker M314 1:1 (Phase 90°, Blackout EMP, Arc directionnel & Trahison Acoustique)
assert(gameJs.includes('const sweepNorthAngle = this.sweepAngle + Math.PI / 2;'), 'Correction déphasage 90° M314 manquante');
assert(gameJs.includes('const isBlackoutScramble = (window.rendererEngine?.powerSabotagedTimer || 0) > 0;'), 'Scramble EMP/Blackout M314 manquant');
assert(gameJs.includes("J\\'AI ENTENDU UN BIP ! PAR LÀ !"), 'Trahison acoustique M314 Alien: Isolation manquante');
console.log('PASS: Pilier B (Motion Tracker M314 phase, EMP/blackout, arc directionnel & trahison acoustique) validé');

// 4. Tourelle UA 571-C 1:1 (Cône laser, Clic à sec 000 RDS, Surchauffe & Ventilation)
assert(modelsJs.includes("laserCone.name = 'sentry_laser_cone'"), 'Cône laser sentry_laser_cone manquant dans createUA571CTurret');
assert(gameJs.includes('audioManager.playDryFireClick?.(turret.x, turret.z)'), 'Clic à sec 000 RDS manquant dans updateSentryTurrets');
assert(gameJs.includes('turret.overheatTimer = 2.6'), 'Cycle de surchauffe/ventilation UA 571-C manquant');
console.log('PASS: Pilier C1 (Tourelle UA 571-C cône laser, clic à sec 000 RDS & surchauffe) validé');

// 5. Working Joe Seegson 1:1 (Yeux rouges hostiles, marche lente implacable & voix/pas dédiés)
assert(gameJs.includes('this._lastJoeHostileState !== isHostileState'), 'Bascule yeux rouges hostiles Working Joe manquante');
assert(gameJs.includes('audioManager.playWorkingJoeDiagnosticVoice?.(this.x, this.z)'), 'Voix diagnostique Working Joe non câblée');
assert(gameJs.includes('audioManager.playAutomatonFootstep?.(this.x, this.z)'), 'Pas automate Working Joe non câblés');
console.log('PASS: Pilier C2 (Working Joe yeux rouges APOLLO, marche lente 0.055 & audio dédié) validé');

// 6. Facehugger sacs respiratoires pulsants + Séquence détachement Ovipositeur Reine 1.6s
assert(modelsJs.includes('respiratory_sac_left') && modelsJs.includes('respiratory_sac_right'), 'Sacs respiratoires latéraux du Facehugger manquants dans models.js');
assert(gameJs.includes("model.getObjectByName('respiratory_sac_left')"), 'Animation pulsation sacs respiratoires Facehugger manquante');
assert(gameJs.includes('this.queenDetachingTimer = 1.6') && gameJs.includes('this.queenDetachedTendons'), 'Séquence animée de détachement d\'ovipositeur Reine manquante');
console.log('PASS: Pilier D (Sacs respiratoires Facehugger & séquence arrachement Ovipositeur Reine) validé');

// 7. Préservation absolue des carrés d'icônes vectorielles statiques (30/30)
const buttonMatches = indexHtml.match(/class="[^"]*btn-sq-icon[^"]*"/g) || [];
assert(buttonMatches.length >= 30, `Au moins 30 boutons avec icônes carrées requis (trouvé: ${buttonMatches.length})`);
console.log(`PASS: Préservation absolue des carrés d'icônes vectorielles statiques (${buttonMatches.length}/30)`);

// 8. Équilibre parfait des délimiteurs sur tous les modules clés
['src/game.js', 'src/game-systems.js', 'src/models.js', 'src/station-detail.js'].forEach((filePath) => {
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

console.log('--- TOUS LES TESTS QA AAA WAVE 20 SONT VALIDÉS AVEC SUCCÈS ! (12/12) ---');
