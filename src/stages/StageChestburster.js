/* Stage 3: Gestation & Chestburster Phase Logic */
import { playerCreature } from '../entities/PlayerCreature.js';
import { audioManager } from '../engine/AudioManager.js';

export class StageChestburster {
  constructor() {
    this.isCompleted = false;
    this.hasEmerged = false;
  }

  init() {
    // Open Embryo Adaptation Modal Choice
    this.showEmbryoModal();
  }

  showEmbryoModal() {
    const modal = document.getElementById('stage-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-description');
    const embryoChoices = document.getElementById('embryo-choices');
    const modalBtn = document.getElementById('modal-btn-continue');

    modal.classList.remove('hidden');
    modalTitle.textContent = 'GESTATION & ADAPTATION EMBRYONNAIRE';
    modalDesc.textContent = 'Sélectionnez l\'adaptation mutagène que développera l\'embryon dans l\'hôte :';
    embryoChoices.classList.remove('hidden');

    // Choice Cards
    const cards = embryoChoices.querySelectorAll('.choice-card');
    cards.forEach(card => {
      card.onclick = () => {
        cards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        playerCreature.selectedMutation = card.getAttribute('data-mutation');
      };
    });

    modalBtn.onclick = () => {
      if (!playerCreature.selectedMutation) {
        playerCreature.selectedMutation = 'agility';
      }
      modal.classList.add('hidden');
      embryoChoices.classList.add('hidden');
      this.emergeChestburster();
    };
  }

  emergeChestburster() {
    this.hasEmerged = true;
    playerCreature.setForm('chestburster');
    audioManager.playXenoRoar();
    this.updateHUD();
    this.log(`[CHESTBURSTER] ÉMERGENCE REUSSIE ! Adaptation choisie : ${playerCreature.selectedMutation.toUpperCase()}. Fuyez dans les conduits !`);
  }

  updateHUD() {
    document.getElementById('stage-badge').textContent = 'PHASE 3 : CHESTBURSTER';
    document.getElementById('bio-title').textContent = 'CHESTBURSTER (SURVIE & MUE)';
    document.getElementById('stat-vital-label').textContent = 'CROISSANCE BIOMASSE';
    document.getElementById('stat-sec-label').textContent = 'VULNÉRABILITÉ';

    const inst = document.getElementById('stage-instructions');
    inst.innerHTML = `
      <strong>Objectif :</strong> Fuir la salle médicale et se cacher sous les conduits.<br><br>
      • Vous êtes vulnérable aux armes.<br>
      • Déplacez-vous rapidement avec <strong>ZQSD</strong>.<br>
      • Cliquez sur <em>"MANGER BIOMASSE & MUER"</em> pour grandir.
    `;

    const actionsContainer = document.getElementById('action-buttons-container');
    actionsContainer.innerHTML = `
      <button id="btn-eat-molt" class="act-btn">🍖 ABSORBER BIOMASSE & EFFECTUER MUE (DRONE)</button>
    `;

    document.getElementById('btn-eat-molt').onclick = () => this.moltIntoDrone();
  }

  moltIntoDrone() {
    audioManager.playHatch();
    this.log('[MUTATION] Première mue accomplie ! La créature devient un Drone Xénomorphe adulte !');
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
