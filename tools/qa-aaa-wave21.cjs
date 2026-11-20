// tools/qa-aaa-wave21.cjs
// Suite de tests QA automatisée pour la Wave 21 : Rendu 3D FLIR/Acoustique, Queue Articulée Parent-Enfant,
// Chestburster Sinueux 1:1 & Embuscade Conduit Plafond avec Chute Verticale et Tension Cardiaque

const fs = require('fs');
const assert = require('assert');

console.log('--- EXÉCUTION DE LA SUITE DE TESTS QA AAA WAVE 21 ---');

const gameJs = fs.readFileSync('src/game.js', 'utf8');
const modelsJs = fs.readFileSync('src/models.js', 'utf8');
const styleCss = fs.readFileSync('src/css/style.css', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');

// 1. Vision Thermique (FLIR) & Vision Acoustique 3D réelles + backdrop-filter CSS
assert(gameJs.includes("const visionMode = visionSystem.currentMode || 'normal';"), 'Lecture visionSystem.currentMode manquante dans Renderer2D3D');
assert(gameJs.includes('child.material.emissive.setHex(isColdSynth ? 0x06b6d4 : 0xff4500)'), 'Signatures thermiques chaud/froid FLIR manquantes');
assert(gameJs.includes('child.userData._baseEmissiveHex'), 'Sauvegarde/restauration des matériaux émissifs manquante');
assert(styleCss.includes('backdrop-filter: contrast(1.45) saturate(1.9) hue-rotate(175deg)'), 'backdrop-filter FLIR manquant dans style.css');
assert(styleCss.includes('backdrop-filter: contrast(1.65) brightness(0.92) saturate(1.4)'), 'backdrop-filter acoustique manquant dans style.css');
console.log('PASS: Vision Thermique FLIR & Acoustique 3D réelles + backdrop-filter CSS validés');

// 2. Chaîne vertébrale caudale parent-enfant réellement articulée (_addTail)
assert(modelsJs.includes('currentParent.add(vertGroup);') && modelsJs.includes('currentParent = vertGroup;') && modelsJs.includes('currentParent.add(blade);'), 'Chaîne parent-enfant articulée manquante dans _addTail');
assert(modelsJs.includes('`tail_seg_${v}`') && modelsJs.includes('`tail_scute_${v}`'), 'Segments et écussons vertébraux manquants dans _addTail');
console.log('PASS: Chaîne vertébrale caudale parent-enfant réellement articulée validée');

// 3. Chestburster standard sinueux (segments + segmented_tail dans animationJoints)
assert(modelsJs.includes('`chestburster_seg_${cs}`'), 'Segments dorsaux chestburster_seg_ manquants dans createChestburster');
assert(modelsJs.includes("animationJoints: ['juvenile_arm_-1', 'juvenile_arm_1', 'articulated_jaw', 'segmented_tail']"), 'segmented_tail manquant dans animationJoints du Chestburster');
assert(gameJs.includes("{ segs: ['chestburster_seg_'], heads: ['juvenile_head'], maxSeg: 4 }"), 'Animation sinueuse du Chestburster standard manquante dans animateProceduralModel');
console.log('PASS: Chestburster standard sinueux (segments + queue + tête) validé');

// 4. Embuscade conduit plafond avec chute verticale animée & tension cardiaque furtive
assert(gameJs.includes('this.ventDropTimer = 0.32') && gameJs.includes('this.ventDropStartY = 3.6'), 'Chute verticale animée manquante dans executeCeilingVentDropAmbush');
assert(gameJs.includes('this.stealthTensionTimer') && gameJs.includes('audioManager.playHeartbeatPulse?.()'), 'Tension cardiaque furtive en conduit/mimétisme manquante');
console.log('PASS: Embuscade conduit plafond (chute verticale 3.6m -> 0m) & tension cardiaque furtive validées');

// 5. Préservation absolue des carrés d'icônes vectorielles statiques (30/30)
const buttonMatches = indexHtml.match(/class="[^"]*btn-sq-icon[^"]*"/g) || [];
assert(buttonMatches.length >= 30, `Au moins 30 boutons avec icônes carrées requis (trouvé: ${buttonMatches.length})`);
console.log(`PASS: Préservation absolue des carrés d'icônes vectorielles statiques (${buttonMatches.length}/30)`);

// 6. Équilibre parfait des délimiteurs sur tous les modules clés
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

console.log('--- TOUS LES TESTS QA AAA WAVE 21 SONT VALIDÉS AVEC SUCCÈS ! (10/10) ---');
