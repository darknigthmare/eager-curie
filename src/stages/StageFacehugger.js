/* Stage 2: Facehugger Phase Logic */
import { playerCreature } from '../entities/PlayerCreature.js';
import { audioManager } from '../engine/AudioManager.js';

export class StageFacehugger {
  constructor() {
    this.bioTimer = 100; // Countdown life bar
    this.isCompleted = false;
    this.selectedHostType = 'scientist';
  }

  init() {
    playerCreature.setForm('facehugger');
    this.updateHUD();
    this.log('[FACEHUGGER] Vous êtes expulsé ! Durée de vie limitée. Atteignez un hôte viable.');
  }

  updateHUD() {
    document.getElementById('stage-badge').textContent = 'PHASE 2 : FACEHUGGER';
    document.getElementById('bio-title').textContent = 'FACEHUGGER (INFILTRATION)';
    document.getElementById('stat-vital-label').textContent = 'SANTÉ BIOLOGIQUE';
    document.getElementById('stat-sec-label').textContent = 'RESERVE D\'ÉNERGIE';

    const inst = document.getElementById('stage-instructions');
    inst.innerHTML = `
      <strong>Objectif :</strong> Rampez rapidement avec <strong>ZQSD / Flèches</strong>.<br><br>
      • Esquivez la lumière et les caméras.<br>
      • Approchez du Scientifique ou du Garde.<br>
      • Cliquez sur <em>"SAUTER SUR LE VISAGE"</em>.
    `;

    const actionsContainer = document.getElementById('action-buttons-container');
    actionsContainer.innerHTML = `
      <button id="btn-host-scientist" class="act-btn">👤 FÉCONDER SCIENTIFIQUE (Equilibré)</button>
      <button id="btn-host-guard" class="act-btn">🛡️ FÉCONDER GARDE (Mutation Résistance)</button>
    `;

    document.getElementById('btn-host-scientist').onclick = () => this.infectHost('scientist');
    document.getElementById('btn-host-guard').onclick = () => this.infectHost('guard');
  }

  infectHost(type) {
    this.selectedHostType = type;
    audioManager.playFacehuggerLeap();
    this.log(`[INFECTION] Saut d'infection réussi sur le ${type.toUpperCase()} ! Implantation de l'embryon...`);
    this.isCompleted = true;
  }

  log(msg) {
    const logBox = document.getElementById('sensor-log');
    if (logBox) {
      const line = document.createElement('div');
      line.className = 'log-line bio';
      line.textContent = msg;
      logBox.appendChild(line);
      logBox.scrollTop = logBox.scrollHeight;
    }
  }

  update() {
    this.bioTimer -= 0.05;
    const secFill = document.getElementById('stat-sec-fill');
    const secVal = document.getElementById('stat-sec-val');
    if (secFill) secFill.style.width = `${Math.max(0, this.bioTimer)}%`;
    if (secVal) secVal.textContent = `${Math.round(this.bioTimer)}%`;
  }
}
