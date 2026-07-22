/* Vision System (Optical, Thermal, Acoustic) for HIVE ASCENSION */
import { audioManager } from '../engine/AudioManager.js';

export class VisionSystem {
  constructor() {
    this.currentMode = 'normal'; // 'normal' | 'thermal' | 'acoustic'
    this.overlayElement = null;
  }

  init() {
    this.overlayElement = document.getElementById('vision-overlay');
    this.setupUIListeners();
  }

  setupUIListeners() {
    const btnNormal = document.getElementById('btn-vis-normal');
    const btnThermal = document.getElementById('btn-vis-thermal');
    const btnAcoustic = document.getElementById('btn-vis-acoustic');

    if (btnNormal) btnNormal.addEventListener('click', () => this.setMode('normal'));
    if (btnThermal) btnThermal.addEventListener('click', () => this.setMode('thermal'));
    if (btnAcoustic) btnAcoustic.addEventListener('click', () => this.setMode('acoustic'));
  }

  setMode(mode) {
    if (this.currentMode === mode) return;
    this.currentMode = mode;

    // Update overlay CSS classes
    if (this.overlayElement) {
      this.overlayElement.className = `vision-${mode}`;
    }

    // Update button active states
    document.querySelectorAll('.vis-btn').forEach(btn => btn.classList.remove('active'));
    const targetBtn = document.getElementById(`btn-vis-${mode}`);
    if (targetBtn) targetBtn.classList.add('active');

    // Play feedback audio sound
    audioManager.playHeartbeat();
    console.log(`[Vision] Switched to mode: ${mode.toUpperCase()}`);
  }
}

export const visionSystem = new VisionSystem();
