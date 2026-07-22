/* Stage 5: Organic Hive RTS & Defense Phase Logic */
import { pheromoneSystem } from '../systems/PheromoneSystem.js';
import { alarmSystem } from '../systems/AlarmSystem.js';
import { audioManager } from '../engine/AudioManager.js';

export class StageHiveRTS {
  constructor() {
    this.isCompleted = false;
    this.spawnedUnits = 5;
  }

  init() {
    document.getElementById('rts-control-bar').classList.remove('hidden');
    alarmSystem.setLevel(4); // Extermination level trigger
    this.updateHUD();
    this.log('[RTS HIVE] La colonie est éveillée ! Une escouade de nettoyage armée de lance-flammes pénètre dans le secteur !');
  }

  updateHUD() {
    document.getElementById('stage-badge').textContent = 'PHASE 5 : RTS HIVE';
    document.getElementById('bio-title').textContent = 'COMMANDE DES PHÉROMONES';
    document.getElementById('hive-units').textContent = this.spawnedUnits;

    const inst = document.getElementById('stage-instructions');
    inst.innerHTML = `
      <strong>Mode RTS Organique :</strong><br><br>
      • Sélectionnez des phéromones (<strong>Q, W, E, R</strong>).<br>
      • Peignez des zones d'ordre sur la carte.<br>
      • Cliquez sur <em>"POSSESSION DIRECTE"</em> pour prendre le contrôle direct d'un Warrior ou Praetorian.<br>
      • Repoussez l'escouade de nettoyage !
    `;

    const actionsContainer = document.getElementById('action-buttons-container');
    actionsContainer.innerHTML = `
      <button id="btn-spawn-runner" class="act-btn">👾 PRODUIRE RUNNER (20 Bio)</button>
      <button id="btn-spawn-warrior" class="act-btn">⚔️ PRODUIRE WARRIOR (50 Bio)</button>
      <button id="btn-final-victory" class="act-btn" style="border-color: #39ff14; background: rgba(57,255,20,0.3);">🏆 CONQUÉRIR LA STATION</button>
    `;

    document.getElementById('btn-spawn-runner').onclick = () => this.spawnUnit('runner');
    document.getElementById('btn-spawn-warrior').onclick = () => this.spawnUnit('warrior');
    document.getElementById('btn-final-victory').onclick = () => this.triggerVictory();
  }

  spawnUnit(type) {
    this.spawnedUnits++;
    document.getElementById('hive-units').textContent = this.spawnedUnits;
    audioManager.playXenoRoar();
    this.log(`[RUCHE] Nouvelle unité (${type.toUpperCase()}) éclose et intégrée au réseau phéromonal !`);
  }

  triggerVictory() {
    const modal = document.getElementById('stage-modal');
    modal.classList.remove('hidden');
    document.getElementById('modal-stage-num').textContent = 'ASCENSION COMPLÈTE';
    document.getElementById('modal-title').textContent = 'VICTOIRE TOTALE DU HIVE !';
    document.getElementById('modal-description').textContent = 'La station Acheron-9 est entièrement infestée. La Reine règne désormais sur les décombres de l\'installation scientifique.';
    document.getElementById('modal-btn-continue').textContent = 'RECOMMENCER LE CYCLE 🔄';
    document.getElementById('modal-btn-continue').onclick = () => location.reload();
  }

  log(msg) {
    const logBox = document.getElementById('sensor-log');
    if (logBox) {
      const line = document.createElement('div');
      line.className = 'log-line alert';
      line.textContent = msg;
      logBox.appendChild(line);
      logBox.scrollTop = logBox.scrollHeight;
    }
  }

  update() {}
}
