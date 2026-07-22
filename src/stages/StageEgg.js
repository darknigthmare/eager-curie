/* Stage 1: Egg Phase Logic */
import { playerCreature } from '../entities/PlayerCreature.js';
import { audioManager } from '../engine/AudioManager.js';

export class StageEgg {
  constructor() {
    this.hatchTimer = 0;
    this.luredScientist = false;
    this.isCompleted = false;
  }

  init() {
    playerCreature.setForm('egg');
    this.updateHUD();
    this.log('[EGG] Vous êtes un œuf dans la salle d\'incubation. Détectez la présence du scientifique.');
  }

  updateHUD() {
    document.getElementById('stage-badge').textContent = 'PHASE 1 : ŒUF';
    document.getElementById('bio-title').textContent = 'STATUT BIOLOGIQUE (ŒUF)';
    document.getElementById('stat-vital-label').textContent = 'VITALITÉ ÉLOSION';
    document.getElementById('stat-sec-label').textContent = 'PHÉROMONES DE LEURRE';

    const inst = document.getElementById('stage-instructions');
    inst.innerHTML = `
      <strong>Objectif :</strong> Attirer le scientifique et choisir le moment exact pour ouvrir l'œuf.<br><br>
      • Cliquez sur <em>"LIBÉRER PHÉROMONE"</em> pour faire approcher l'hôte.<br>
      • Observez son rythme cardiaque en mode <strong>ACOUSTIC [3]</strong>.<br>
      • Cliquez sur <em>"ÉCLORE"</em> quand l'hôte est à portée.
    `;

    const actionsContainer = document.getElementById('action-buttons-container');
    actionsContainer.innerHTML = `
      <button id="btn-lure" class="act-btn">🧪 LIBÉRER PHÉROMONE (LEURRE)</button>
      <button id="btn-hatch" class="act-btn">💥 ÉCLORE & LIBÉRER FACEHUGGER</button>
    `;

    document.getElementById('btn-lure').onclick = () => this.lureHost();
    document.getElementById('btn-hatch').onclick = () => this.hatch();
  }

  lureHost() {
    audioManager.playHeartbeat();
    this.luredScientist = true;
    this.log('[SENSOR] Phéromones sécrétées. Le scientifique s\'approche curieusement de l\'œuf !');
  }

  hatch() {
    audioManager.playHatch();
    this.log("[EGG] Éclosion ! Le Facehugger s'expulse de l'œuf !");
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
    // Pulse heartbeat when scientist is lured
    if (this.luredScientist && Math.random() < 0.03) {
      audioManager.playHeartbeat();
    }
  }
}
