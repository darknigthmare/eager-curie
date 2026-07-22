/* Pheromone Command System for Stage 5 RTS */
import { audioManager } from '../engine/AudioManager.js';

export class PheromoneSystem {
  constructor() {
    this.activeCommand = 'HUNT'; // 'HUNT' | 'CAPTURE' | 'DEFEND' | 'INFEST'
    this.commandZones = []; // Array of { type, x, z, radius }
    this.possessionMode = false;
  }

  init() {
    this.setupUIListeners();
  }

  setupUIListeners() {
    const rtsBar = id => document.getElementById(id);
    const buttons = document.querySelectorAll('.rts-cmd-btn:not(.possess-btn)');

    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cmd = btn.getAttribute('data-cmd');
        this.setCommand(cmd);
      });
    });

    const possessBtn = document.getElementById('btn-possess-mode');
    if (possessBtn) {
      possessBtn.addEventListener('click', () => {
        this.togglePossessionMode();
      });
    }
  }

  setCommand(cmd) {
    this.activeCommand = cmd;
    this.possessionMode = false;

    document.querySelectorAll('.rts-cmd-btn').forEach(btn => btn.classList.remove('active'));
    const targetBtn = document.querySelector(`.rts-cmd-btn[data-cmd="${cmd}"]`);
    if (targetBtn) targetBtn.classList.add('active');

    audioManager.playHeartbeat();
    console.log(`[Pheromone] Active command: ${cmd}`);
  }

  togglePossessionMode() {
    this.possessionMode = !this.possessionMode;
    const possessBtn = document.getElementById('btn-possess-mode');

    if (this.possessionMode) {
      document.querySelectorAll('.rts-cmd-btn').forEach(btn => btn.classList.remove('active'));
      if (possessBtn) possessBtn.classList.add('active');
      audioManager.playXenoRoar();
      console.log('[Pheromone] Direct Possession Mode Activated');
    } else {
      this.setCommand('HUNT');
    }
  }

  addZone(x, z, type = this.activeCommand) {
    const newZone = { type, x, z, radius: 8, createdAt: Date.now() };
    this.commandZones.push(newZone);
    // Keep maximum 5 active zones
    if (this.commandZones.length > 5) {
      this.commandZones.shift();
    }
    audioManager.playHeartbeat();
    return newZone;
  }
}

export const pheromoneSystem = new PheromoneSystem();
