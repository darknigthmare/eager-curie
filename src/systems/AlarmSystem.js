/* Human Security Alarm & Reaction System (Levels 0-5) */
import { audioManager } from '../engine/AudioManager.js';

export class AlarmSystem {
  constructor() {
    this.level = 0; // 0 to 5
    this.suspicionPoints = 0;
    this.alertTextElement = null;
    this.levelNames = [
      "NIVEAU 0 — IGNORANCE",
      "NIVEAU 1 — SUSPICION",
      "NIVEAU 2 — MENACE CONFIRMÉE",
      "NIVEAU 3 — QUARANTAINE",
      "NIVEAU 4 — EXTERMINATION",
      "NIVEAU 5 — DESTRUCTION TOTALE"
    ];
  }

  init() {
    this.alertTextElement = document.getElementById('alert-level-text');
    this.updateUI();
  }

  addSuspicion(amount) {
    this.suspicionPoints += amount;

    // Check level progression thresholds
    let newLevel = 0;
    if (this.suspicionPoints >= 100) newLevel = 5;
    else if (this.suspicionPoints >= 75) newLevel = 4;
    else if (this.suspicionPoints >= 50) newLevel = 3;
    else if (this.suspicionPoints >= 30) newLevel = 2;
    else if (this.suspicionPoints >= 10) newLevel = 1;

    if (newLevel !== this.level) {
      this.level = newLevel;
      this.onLevelChanged();
    } else {
      this.updateUI();
    }
  }

  setLevel(level) {
    this.level = Math.max(0, Math.min(5, level));
    this.onLevelChanged();
  }

  onLevelChanged() {
    this.updateUI();
    if (this.level >= 3) {
      audioManager.playAlarmSiren();
    }
    console.log(`[AlarmSystem] Alert level set to Level ${this.level}`);
  }

  updateUI() {
    if (!this.alertTextElement) return;
    this.alertTextElement.textContent = this.levelNames[this.level];
    this.alertTextElement.className = `alert-level level-${this.level}`;
  }
}

export const alarmSystem = new AlarmSystem();
