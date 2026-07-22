/* Stage 4: Drone Xenomorph Phase Logic */
import { playerCreature } from '../entities/PlayerCreature.js';
import { resinGrid } from '../environment/ResinGrid.js';
import { audioManager } from '../engine/AudioManager.js';

export class StageDrone {
  constructor() {
    this.isCompleted = false;
    this.capturedHosts = 0;
  }

  init() {
    playerCreature.setForm('drone');
    document.getElementById('hive-stats-group').classList.remove('hidden');
    this.updateHUD();
    this.log('[DRONE] Vous êtes un Drone adulte. Chassez les humains isolés, sécrétez de la résine et préparez la nidification.');
  }

  updateHUD() {
    document.getElementById('stage-badge').textContent = 'PHASE 4 : DRONE';
    document.getElementById('bio-title').textContent = 'DRONE (NIDIFICATION)';

    const inst = document.getElementById('stage-instructions');
    inst.innerHTML = `
      <strong>Objectif :</strong> Fonder le nid et capturer des hôtes.<br><br>
      • Déplacez-vous au sol ou sur les murs.<br>
      • Posez de la résine organique pour étendre votre emprise.<br>
      • Capturez 2 humains pour débloquer la phase <strong>RTS HIVE</strong>.
    `;

    const actionsContainer = document.getElementById('action-buttons-container');
    actionsContainer.innerHTML = `
      <button id="btn-secrete-resin" class="act-btn">🕸️ SÉCRÉTER RÉSINE BIOLOGIQUE</button>
      <button id="btn-capture-host" class="act-btn">👤 CAPTURER HÔTE DANS UN COCON</button>
      <button id="btn-start-rts" class="act-btn" style="border-color: #9d4edd; background: rgba(157,78,221,0.3);">👑 FONDER LE NID (LANCER LE RTS)</button>
    `;

    document.getElementById('btn-secrete-resin').onclick = () => this.secreteResin();
    document.getElementById('btn-capture-host').onclick = () => this.captureHost();
    document.getElementById('btn-start-rts').onclick = () => this.startRTS();
  }

  secreteResin() {
    resinGrid.addResinPatch(playerCreature.x, playerCreature.z);
    audioManager.playAcidSizzle();
    this.log('[HIVE] Résine biologique étalée sur les structures de la station.');
  }

  captureHost() {
    this.capturedHosts++;
    document.getElementById('hive-hosts').textContent = this.capturedHosts;
    audioManager.playHeartbeat();
    this.log(`[CAPTURE] Hôte vivant immobilisé et enfermé dans un cocon résineux ! (${this.capturedHosts}/2)`);

    if (this.capturedHosts >= 2) {
      document.getElementById('btn-start-rts').style.animation = 'pulse 1s infinite alternate';
    }
  }

  startRTS() {
    audioManager.playXenoRoar();
    this.log('[ASCENSION] La chambre royale est sécurisée ! Transition vers la commande RTS du Hive...');
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

  update() {}
}
