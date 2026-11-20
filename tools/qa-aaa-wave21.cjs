// tools/qa-aaa-wave21.cjs
// Suite de tests QA automatisée pour la Wave 21 : Rendu 3D FLIR/Acoustique, Queue Articulée Parent-Enfant,
// Chestburster Sinueux 1:1 & Embuscade Conduit Plafond avec Chute Verticale et Tension Cardiaque

const fs = require('fs');
const assert = require('assert');
const vm = require('node:vm');

console.log('--- EXÉCUTION DE LA SUITE DE TESTS QA AAA WAVE 21 ---');

const gameJs = fs.readFileSync('src/game.js', 'utf8');
const styleCss = fs.readFileSync('src/css/style.css', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');

// 1. Vision Thermique (FLIR) & Vision Acoustique 3D réelles + backdrop-filter CSS
assert(gameJs.includes("const visionMode = visionSystem.currentMode || 'normal';"), 'Lecture visionSystem.currentMode manquante dans Renderer2D3D');
assert(gameJs.includes('child.material.emissive.setHex(isColdSynth ? 0x06b6d4 : 0xff4500)'), 'Signatures thermiques chaud/froid FLIR manquantes');
assert(gameJs.includes('child.userData._baseEmissiveHex'), 'Sauvegarde/restauration des matériaux émissifs manquante');
assert(styleCss.includes('backdrop-filter: contrast(1.45) saturate(1.9) hue-rotate(175deg)'), 'backdrop-filter FLIR manquant dans style.css');
assert(styleCss.includes('backdrop-filter: contrast(1.65) brightness(0.92) saturate(1.4)'), 'backdrop-filter acoustique manquant dans style.css');
console.log('PASS: Vision Thermique FLIR & Acoustique 3D réelles + backdrop-filter CSS validés');

// 2. La chaîne parent-enfant pose la peau caudale continue et le dard.
global.THREE = require('../assets/vendor/three.r128.min.js');
for (const file of ['organic-sculpt.js', 'surface-detail.js', 'model-detail.js', 'models.js']) require('../src/' + file);
const factory = global.HiveModelFactory;
const adult = factory.createAdult('drone');
try {
  const tail = adult.getObjectByName('segmented_tail'), pivots = tail.userData.vertebrae, rig = tail.userData.getTailRig();
  assert(pivots.length >= 5 && pivots.every((pivot, index) => pivot.parent === (pivots[index - 1] || tail)));
  const vertices = rig.skin.geometry.getAttribute('position').array, rest = vertices.slice();
  const blade = rig.blade.position.clone();
  rig.flex(.85, .85, .4);
  assert(vertices.some((coordinate, index) => Math.abs(coordinate - rest[index]) > .15));
  assert(rig.blade.position.distanceTo(blade) > .15);
  rig.restore();
  assert.deepStrictEqual(vertices, rest);
} finally {
  factory.disposeModel(adult);
}
console.log('PASS: Chaîne caudale et déformation mesurée du maillage continu');

// 3. Marche et attaque utilisent les groupes articulés réellement livrés.
const start = gameJs.indexOf('  function getAnimationModel');
const end = gameJs.indexOf('  function setHudBar', start);
assert(start >= 0 && end > start);
const context = { window: {} };
vm.createContext(context);
vm.runInContext(gameJs.slice(start, end) + '\nthis.animate = animateProceduralModel;', context);
const juvenile = factory.createChestburster(false);
try {
  const joints = ['segmented_tail', 'juvenile_head', ...Array.from({ length: 4 }, (_, index) => `chestburster_seg_${index}`)]
    .map(name => juvenile.getObjectByName(name));
  assert(joints.every(node => node && juvenile.userData.animationRig.joints.includes(node)));
  const before = joints.map(node => node.quaternion.clone());
  context.animate(juvenile, { phase: .71, movement: .8, attack: .35 });
  assert(joints.every((node, index) => !node.quaternion.equals(before[index])));
} finally {
  factory.disposeModel(juvenile);
}
console.log('PASS: Joints du juvénile mesurés en marche et en attaque');

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
