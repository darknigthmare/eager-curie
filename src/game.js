/* HIVE ASCENSION
 * Complete campaign pass: lore-safe castes, original characters, detailed models,
 * mission tracking, save data, accessibility, expanded enemies, bosses and endings.
 */

(function () {
  'use strict';

  // -------------------------------------------------------------
  // 1. AUDIO MANAGER
  // -------------------------------------------------------------
  class AudioManager {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.isMuted = false;
      this.initialized = false;
      this.volume = 0.7;
      this.ambienceNodes = null;
      window.audioManager = this;
    }

    init() {
      if (this.initialized) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.volume;
        this.masterGain.connect(this.ctx.destination);
        this.initialized = true;
      } catch (e) {
        console.warn('[Audio] Web Audio API not supported', e);
      }
    }

    resume() {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    connect(node, x = null, z = null, radius = 58) {
      if (!node || !this.ctx) return;
      if (!Number.isFinite(x) || !Number.isFinite(z)) {
        node.connect(this.masterGain || this.ctx.destination);
        return;
      }
      const listenerX = rendererEngine?.camera?.position?.x ?? playerCreature?.x ?? 0;
      const listenerZ = playerCreature?.z ?? rendererEngine?.camera?.position?.z ?? 0;
      const distance = Math.hypot(x - listenerX, z - listenerZ);
      const attenuation = Math.max(0.12, 1 - distance / Math.max(1, radius));
      const distanceGain = this.ctx.createGain();
      distanceGain.gain.value = attenuation;
      node.connect(distanceGain);
      if (this.ctx.createStereoPanner) {
        const panner = this.ctx.createStereoPanner();
        panner.pan.value = Math.max(-0.92, Math.min(0.92, (x - listenerX) / Math.max(1, radius * 0.55)));
        distanceGain.connect(panner);
        panner.connect(this.masterGain || this.ctx.destination);
      } else {
        distanceGain.connect(this.masterGain || this.ctx.destination);
      }
    }

    setVolume(value) {
      this.volume = Math.max(0, Math.min(1, Number(value) || 0));
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime, 0.03);
      }
    }

    toggleMuted() {
      this.isMuted = !this.isMuted;
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime, 0.03);
      }
      return this.isMuted;
    }

    startAmbience() {
      if (!this.initialized || this.ambienceNodes) return;
      this.resume();
      const drone = this.ctx.createOscillator();
      const harmonic = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      drone.type = 'sine';
      harmonic.type = 'triangle';
      drone.frequency.value = 41;
      harmonic.frequency.value = 63;
      gain.gain.value = 0.025;
      lfo.type = 'sine';
      lfo.frequency.value = 0.16;
      lfoGain.gain.value = 0.012;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      drone.connect(gain);
      harmonic.connect(gain);
      this.connect(gain);
      drone.start();
      harmonic.start();
      lfo.start();
      this.ambienceNodes = { drone, harmonic, gain, lfo, lfoGain };
    }

    stopAmbience() {
      if (!this.ambienceNodes) return;
      for (const key of ['drone', 'harmonic', 'lfo']) {
        try { this.ambienceNodes[key].stop(); } catch (_error) {}
      }
      this.ambienceNodes = null;
    }

    playMotionTrackerPing(dist = 10) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const freq = Math.max(550, 2450 - dist * 95);

      const emitPing = (timeOffset) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + timeOffset);
        gain.gain.setValueAtTime(0.38, now + timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.01, now + timeOffset + 0.068);
        osc.connect(gain);
        this.connect(gain);
        osc.start(now + timeOffset);
        osc.stop(now + timeOffset + 0.068);
      };

      emitPing(0);
      if (dist < 4.5) {
        emitPing(0.082); // Double-bip d'alerte frénétique Weyland-Yutani M314
      }
    }

    playFlamethrowerWhoosh(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      // 1. Souffle de combustion lourde (napalm / hydrocarbures Nostromo 1979)
      const bufferSize = this.ctx.sampleRate * 0.55;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.linearRampToValueAtTime(320, now + 0.5);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.75, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
      noise.connect(filter); filter.connect(gain);
      this.connect(gain, x, z, 70);
      noise.start(now);

      // 2. Sifflement de gaz pressurisé et allumage de torche pilote
      const gasOsc = this.ctx.createOscillator();
      const gasGain = this.ctx.createGain();
      gasOsc.type = 'sawtooth';
      gasOsc.frequency.setValueAtTime(320, now);
      gasOsc.frequency.exponentialRampToValueAtTime(80, now + 0.45);
      gasGain.gain.setValueAtTime(0.4, now);
      gasGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      gasOsc.connect(gasGain);
      this.connect(gasGain, x, z, 70);
      gasOsc.start(now); gasOsc.stop(now + 0.45);
    }

    playHeartbeat(rate = 1.0) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(70 * rate, now);
      osc.frequency.exponentialRampToValueAtTime(35 * rate, now + 0.15);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain); this.connect(gain);
      osc.start(now); osc.stop(now + 0.2);
    }

    playMotherChime() {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.24, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc1.connect(gain1); this.connect(gain1);
      osc1.start(now); osc1.stop(now + 0.55);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(440, now + 0.22);
      gain2.gain.setValueAtTime(0.28, now + 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc2.connect(gain2); this.connect(gain2);
      osc2.start(now + 0.22); osc2.stop(now + 0.85);
    }

    playEggOpen() {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.linearRampToValueAtTime(380, now + 0.4);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.connect(gain); this.connect(gain);
      osc.start(now); osc.stop(now + 0.45);
    }

    playHatch() {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(350, now);
      filter.frequency.linearRampToValueAtTime(1400, now + 0.4);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      noise.connect(filter); filter.connect(gain);
      this.connect(gain);
      noise.start(now);
    }

    playFacehuggerLeap() {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(250, now);
      osc.frequency.exponentialRampToValueAtTime(1600, now + 0.3);
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.connect(gain); this.connect(gain);
      osc.start(now); osc.stop(now + 0.35);
    }

    playBoneCrunch() {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.linearRampToValueAtTime(20, now + 0.25);
      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain); this.connect(gain);
      osc.start(now); osc.stop(now + 0.3);
    }

    playChestburstScreech() {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc1.type = 'sawtooth'; osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(800, now);
      osc1.frequency.linearRampToValueAtTime(1800, now + 0.2);
      osc1.frequency.linearRampToValueAtTime(400, now + 0.5);
      osc2.frequency.setValueAtTime(820, now);
      osc2.frequency.linearRampToValueAtTime(1820, now + 0.2);
      osc2.frequency.linearRampToValueAtTime(410, now + 0.5);
      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc1.connect(gain); osc2.connect(gain);
      this.connect(gain);
      osc1.start(now); osc2.start(now);
      osc1.stop(now + 0.5); osc2.stop(now + 0.5);
    }

    playAcidSizzle() {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass'; filter.frequency.setValueAtTime(2000, now);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      noise.connect(filter); filter.connect(gain);
      this.connect(gain);
      noise.start(now);
    }

    playPulseRifleFire(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      // 1. Claquement sec et agressif haute-fréquence du fusil à impulsions M41A (Aliens 1986)
      const crackOsc = this.ctx.createOscillator();
      const crackGain = this.ctx.createGain();
      crackOsc.type = 'sawtooth';
      crackOsc.frequency.setValueAtTime(1400, now);
      crackOsc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
      crackGain.gain.setValueAtTime(0.75, now);
      crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      crackOsc.connect(crackGain);
      this.connect(crackGain, x, z, 72);
      crackOsc.start(now); crackOsc.stop(now + 0.09);

      // 2. Détonation explosive basse-fréquence et résonance mécanique culte
      const punchOsc = this.ctx.createOscillator();
      const punchGain = this.ctx.createGain();
      punchOsc.type = 'square';
      punchOsc.frequency.setValueAtTime(180, now);
      punchOsc.frequency.exponentialRampToValueAtTime(35, now + 0.14);
      punchGain.gain.setValueAtTime(0.65, now);
      punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      punchOsc.connect(punchGain);
      this.connect(punchGain, x, z, 72);
      punchOsc.start(now); punchOsc.stop(now + 0.15);
    }

    playSmartgunBurst(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      // Cadence supersonique lourde M56 Smartgun (Vasquez / Drake)
      [0, 0.052, 0.104].forEach((offset) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1150, now + offset);
        osc.frequency.exponentialRampToValueAtTime(80, now + offset + 0.048);
        gain.gain.setValueAtTime(0.7, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.052);
        osc.connect(gain);
        this.connect(gain, x, z, 75);
        osc.start(now + offset); osc.stop(now + offset + 0.052);
      });
    }

    playSmartgunServo(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.linearRampToValueAtTime(680, now + 0.12);
      osc.frequency.linearRampToValueAtTime(380, now + 0.22);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      this.connect(gain, x, z, 55);
      osc.start(now); osc.stop(now + 0.25);
    }

    playGrenadeLaunch(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);
      gain.gain.setValueAtTime(0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      this.connect(gain, x, z, 68);
      osc.start(now); osc.stop(now + 0.2);
    }

    playGrenadeExplode(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.7);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.exponentialRampToValueAtTime(65, now + 0.65);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.85, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
      noise.connect(filter); filter.connect(gain);
      this.connect(gain, x, z, 85);
      noise.start(now);
    }

    playPowerloaderBeep(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1150, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      this.connect(gain, x, z, 60);
      osc.start(now); osc.stop(now + 0.2);
    }

    playRadioSquelch(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.1);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, now);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      noise.connect(filter); filter.connect(gain);
      this.connect(gain, x, z, 55);
      noise.start(now);
    }

    playBlastDoorHydraulics(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(65, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.45);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      this.connect(gain, x, z, 65);
      osc.start(now); osc.stop(now + 0.5);
    }

    // Chantier 14 : Fusil à pompe Ithaca 37 modèle 12 gauge (Caporal Hicks, Aliens 1986)
    playShotgunBlast(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.18));
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, now);
      filter.frequency.exponentialRampToValueAtTime(80, now + 0.4);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      noise.connect(filter); filter.connect(gain);
      this.connect(gain, x, z, 85);
      noise.start(now);
    }

    // Chantier 13 : Sifflement et miaulement du Chat Jonesy (Alien 1979)
    playCatHiss(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.35);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3200, now);
      filter.Q.setValueAtTime(3.5, now);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      noise.connect(filter); filter.connect(gain);
      this.connect(gain, x, z, 45);
      noise.start(now);
    }

    playCatMeow(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.linearRampToValueAtTime(780, now + 0.15);
      osc.frequency.linearRampToValueAtTime(520, now + 0.38);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      this.connect(gain, x, z, 35);
      osc.start(now); osc.stop(now + 0.4);
    }

    // Chantier 15 : Détente de gaz cryogénique & Bris de vitre renforcée
    playCryoVent(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.6);
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc.connect(gain);
      this.connect(gain, x, z, 60);
      osc.start(now); osc.stop(now + 0.65);
    }

    playGlassShatter(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(2400, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.22);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      this.connect(gain, x, z, 55);
      osc.start(now); osc.stop(now + 0.25);
    }

    // Chantier 16 : Sirène d'autodestruction bitonale MU/TH/UR 6000 (Nostromo 1979)
    playSelfDestructKlaxon(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.setValueAtTime(360, now + 0.25);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.connect(gain);
      this.connect(gain, x, z, 100);
      osc.start(now); osc.stop(now + 0.5);
    }

    // Chantier 17 : Éclaboussures d'eau et Arcs électriques (Isolation / Deck C)
    playWaterSplash(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.18);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      this.connect(gain, x, z, 45);
      osc.start(now); osc.stop(now + 0.2);
    }

    playElectricArc(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(850, now + 0.08);
      osc.frequency.linearRampToValueAtTime(60, now + 0.16);
      gain.gain.setValueAtTime(0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      this.connect(gain, x, z, 55);
      osc.start(now); osc.stop(now + 0.2);
    }

    // Chantier 20 : Coup de piston pneumatique percutant de la mâchoire interne
    playInnerJawPunch(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.14);
      gain.gain.setValueAtTime(0.85, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      this.connect(gain, x, z, 70);
      osc.start(now); osc.stop(now + 0.16);
    }

    playXenoRoar() {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc1.type = 'sawtooth'; osc2.type = 'square';
      osc1.frequency.setValueAtTime(140, now);
      osc1.frequency.linearRampToValueAtTime(750, now + 0.3);
      osc1.frequency.linearRampToValueAtTime(90, now + 0.7);
      osc2.frequency.setValueAtTime(150, now);
      osc2.frequency.linearRampToValueAtTime(770, now + 0.3);
      osc2.frequency.linearRampToValueAtTime(100, now + 0.7);
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
      osc1.connect(gain); osc2.connect(gain);
      this.connect(gain);
      osc1.start(now); osc2.start(now);
      osc1.stop(now + 0.7); osc2.stop(now + 0.7);
    }

    playQueenRoar() {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const sub = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, now);
      filter.frequency.linearRampToValueAtTime(1350, now + 0.35);
      filter.frequency.exponentialRampToValueAtTime(110, now + 1.25);

      osc1.type = 'sawtooth';
      osc2.type = 'square';
      sub.type = 'sine';

      // Modulations de fréquence gutturales et menaçantes (Lore Aliens 1986)
      osc1.frequency.setValueAtTime(80, now);
      osc1.frequency.linearRampToValueAtTime(430, now + 0.3);
      osc1.frequency.exponentialRampToValueAtTime(42, now + 1.2);

      osc2.frequency.setValueAtTime(86, now);
      osc2.frequency.linearRampToValueAtTime(445, now + 0.3);
      osc2.frequency.exponentialRampToValueAtTime(45, now + 1.2);

      sub.frequency.setValueAtTime(50, now);
      sub.frequency.linearRampToValueAtTime(70, now + 0.25);
      sub.frequency.exponentialRampToValueAtTime(24, now + 1.2);

      gain.gain.setValueAtTime(0.85, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.25);

      osc1.connect(filter);
      osc2.connect(filter);
      sub.connect(gain);
      filter.connect(gain);
      this.connect(gain);

      osc1.start(now); osc2.start(now); sub.start(now);
      osc1.stop(now + 1.25); osc2.stop(now + 1.25); sub.stop(now + 1.25);
    }

    playXenoHiss(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.85);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const env = Math.sin(Math.min(1, i / (bufferSize * 0.15)) * Math.PI / 2) * Math.exp(-i / (bufferSize * 0.45));
        data[i] = (Math.random() * 2 - 1) * env;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const bq = this.ctx.createBiquadFilter();
      bq.type = 'bandpass';
      bq.frequency.setValueAtTime(3400, now);
      bq.Q.setValueAtTime(4.2, now);
      bq.frequency.linearRampToValueAtTime(1800, now + 0.65);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.82);

      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(42, now + 0.55);
      oscGain.gain.setValueAtTime(0.4, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
      osc.connect(oscGain);
      oscGain.connect(gain);
      osc.start(now); osc.stop(now + 0.55);

      noise.connect(bq); bq.connect(gain);
      this.connect(gain, x, z, 72);
      noise.start(now);
    }

    playInnerJawSnap(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.15);
      gain.gain.setValueAtTime(0.85, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.17);
      osc.connect(gain);
      this.connect(gain, x, z, 65);
      osc.start(now); osc.stop(now + 0.17);
    }

    playTailWhip(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.18);
      gain.gain.setValueAtTime(0.72, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      this.connect(gain, x, z, 65);
      osc.start(now); osc.stop(now + 0.2);
    }

    playSteamVentHiss(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2600, now);
      filter.frequency.linearRampToValueAtTime(750, now + 0.42);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.42, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      noise.connect(filter); filter.connect(gain);
      this.connect(gain, x, z, 58);
      noise.start(now);
    }

    playSyntheticGlitchedVoice(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(220, now + 0.08);
      osc.frequency.setValueAtTime(880, now + 0.16);
      osc.frequency.setValueAtTime(110, now + 0.24);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.connect(gain);
      this.connect(gain, x, z, 55);
      osc.start(now); osc.stop(now + 0.4);
    }

    playElectricArc(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.35);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (i % 8 < 4 ? 1 : -0.8) * Math.exp(-i / (bufferSize * 0.25));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const bq = this.ctx.createBiquadFilter();
      bq.type = 'highpass';
      bq.frequency.setValueAtTime(1400, now);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.32);
      noise.connect(bq); bq.connect(gain);
      this.connect(gain, x, z, 65);
      noise.start(now);
    }

    playSonarPing(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(980, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.45);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.48);
      osc.connect(gain);
      this.connect(gain, x, z, 75);
      osc.start(now); osc.stop(now + 0.48);
    }

    playDepressurizationRoar(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 1.2);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin(Math.min(1, i / (bufferSize * 0.2)) * Math.PI / 2) * Math.exp(-i / (bufferSize * 0.7));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, now);
      filter.frequency.linearRampToValueAtTime(1100, now + 0.3);
      filter.frequency.exponentialRampToValueAtTime(120, now + 1.15);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.85, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
      noise.connect(filter); filter.connect(gain);
      this.connect(gain, x, z, 85);
      noise.start(now);
    }

    playGeneratorRestart(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(45, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.85);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
      osc.connect(gain);
      this.connect(gain, x, z, 70);
      osc.start(now); osc.stop(now + 0.9);
    }

    playVentEnter() {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.32);
      gain.gain.setValueAtTime(0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.connect(gain); this.connect(gain);
      osc.start(now); osc.stop(now + 0.35);
    }

    playVentExit() {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.32;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.22));
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(650, now);
      filter.frequency.linearRampToValueAtTime(170, now + 0.28);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.32);
      noise.connect(filter); filter.connect(gain);
      this.connect(gain);
      noise.start(now);
    }

    playAlarmSiren() {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.4);
      osc.frequency.linearRampToValueAtTime(440, now + 0.8);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      osc.connect(gain); this.connect(gain);
      osc.start(now); osc.stop(now + 0.8);
    }

    playFootstep(type = 'human', x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const heavy = ['powerloader', 'exosuit'].includes(type);
      osc.type = heavy ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(heavy ? 54 : 105, now);
      osc.frequency.exponentialRampToValueAtTime(heavy ? 24 : 62, now + 0.1);
      gain.gain.setValueAtTime(heavy ? 0.38 : 0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      this.connect(gain, x, z, 48);
      osc.start(now);
      osc.stop(now + 0.13);
    }

    playHostCough(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.24);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let index = 0; index < bufferSize; index++) {
        const envelope = Math.sin(Math.min(1, index / (bufferSize * 0.12)) * Math.PI / 2) *
          Math.exp(-index / (bufferSize * 0.3));
        data[index] = (Math.random() * 2 - 1) * envelope;
      }
      const source = this.ctx.createBufferSource();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      source.buffer = buffer;
      filter.type = 'bandpass';
      filter.frequency.value = 420;
      filter.Q.value = 0.8;
      gain.gain.value = 0.22;
      source.connect(filter);
      filter.connect(gain);
      this.connect(gain, x, z, 45);
      source.start(now);
    }

    playFacehuggerGrip(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(170, now);
      osc.frequency.exponentialRampToValueAtTime(52, now + 0.34);
      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.connect(gain);
      this.connect(gain, x, z, 44);
      osc.start(now);
      osc.stop(now + 0.4);
    }

    playMetalImpact(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      for (const frequency of [920, 1430]) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        this.connect(gain, x, z, 52);
        osc.start(now);
        osc.stop(now + 0.13);
      }
    }

    playInternalHeartbeat() {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      [0, 0.18].forEach((offset, index) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(index === 0 ? 62 : 54, now + offset);
        osc.frequency.exponentialRampToValueAtTime(28, now + offset + 0.18);
        gain.gain.setValueAtTime(index === 0 ? 0.52 : 0.36, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.2);
        osc.connect(gain);
        this.connect(gain);
        osc.start(now + offset);
        osc.stop(now + offset + 0.22);
      });
    }

    playSternumPressure() {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(34, now);
      osc.frequency.linearRampToValueAtTime(76, now + 0.7);
      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      osc.connect(gain);
      this.connect(gain);
      osc.start(now);
      osc.stop(now + 0.78);
    }

    playWetImpact(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(125, now);
      osc.frequency.exponentialRampToValueAtTime(31, now + 0.28);
      gain.gain.setValueAtTime(0.42, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.connect(gain);
      this.connect(gain, x, z, 55);
      osc.start(now);
      osc.stop(now + 0.34);
    }

    playRodentSqueak(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1650, now);
      osc.frequency.linearRampToValueAtTime(2350, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(980, now + 0.17);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      this.connect(gain, x, z, 35);
      osc.start(now);
      osc.stop(now + 0.19);
    }

    playJuvenileBite(x = null, z = null) {
      this.playWetImpact(x, z);
      this.playBoneCrunch();
    }

    playCocoonWeave(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(210, now);
      osc.frequency.linearRampToValueAtTime(95, now + 0.65);
      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc.connect(gain);
      this.connect(gain, x, z, 48);
      osc.start(now);
      osc.stop(now + 0.72);
    }

    playCocoonPulse(x = null, z = null) {
      this.playHeartbeat(0.72);
      this.playWetImpact(x, z);
    }

    // Chantier 23 : Tourelles Automatiques UA 571-C Sentry Guns (Aliens 1986)
    playSentryBurst(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      for (let shot = 0; shot < 4; shot++) {
        const shotTime = now + shot * 0.045;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(820, shotTime);
        osc.frequency.exponentialRampToValueAtTime(110, shotTime + 0.038);
        gain.gain.setValueAtTime(0.55, shotTime);
        gain.gain.exponentialRampToValueAtTime(0.01, shotTime + 0.042);
        osc.connect(gain);
        this.connect(gain, x, z, 70);
        osc.start(shotTime);
        osc.stop(shotTime + 0.042);
      }
    }

    // Chantier 24 : Découpeur plasma & soudures de portes (Aliens 1986)
    playWelderSparks(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.35);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (i % 6 === 0 ? 1 : 0.4) * Math.exp(-i / (bufferSize * 0.4));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const bq = this.ctx.createBiquadFilter();
      bq.type = 'bandpass';
      bq.frequency.setValueAtTime(3200, now);
      bq.Q.setValueAtTime(3.5, now);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.48, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      noise.connect(bq); bq.connect(gain);
      this.connect(gain, x, z, 55);
      noise.start(now);
    }

    // Chantier 26 : Émetteur de sonde ultrasonique Weyland-Yutani
    playUltrasonicPulse(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(4200, now);
      osc.frequency.linearRampToValueAtTime(6800, now + 0.12);
      osc.frequency.linearRampToValueAtTime(3600, now + 0.28);
      gain.gain.setValueAtTime(0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.3);
      osc.connect(gain);
      this.connect(gain, x, z, 60);
      osc.start(now);
      osc.stop(now + 0.3);
    }

    // Chantier 29 : Interférences magnétiques réacteur sur le tracker M314
    playStaticInterference(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.18);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.35;
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(1600, now);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      noise.connect(hp); hp.connect(gain);
      this.connect(gain, x, z, 50);
      noise.start(now);
    }

    // Chantier 28 : Station médicale murale & injecteur hypospray
    playMedikitInject(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.22);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'bandpass';
      lp.frequency.setValueAtTime(1800, now);
      lp.frequency.linearRampToValueAtTime(650, now + 0.2);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      noise.connect(lp); lp.connect(gain);
      this.connect(gain, x, z, 50);
      noise.start(now);
    }

    // Chantier 22 : Signal de détresse de la relique Derelict / Space Jockey (Alien 1979)
    playDerelictSignal(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(65, now);
      osc.frequency.linearRampToValueAtTime(115, now + 0.5);
      osc.frequency.linearRampToValueAtTime(55, now + 1.2);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.35);
      osc.connect(gain);
      this.connect(gain, x, z, 65);
      osc.start(now);
      osc.stop(now + 1.35);
    }

    // Chantier 30 : Détonation en chaîne de réservoir cryogénique
    playCryoDetonation(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(24, now + 0.85);
      gain.gain.setValueAtTime(0.95, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.95);
      osc.connect(gain);
      this.connect(gain, x, z, 90);
      osc.start(now);
      osc.stop(now + 0.95);
      this.playGlassShatter(x, z);
    }

    // Chantier 37 : Fusil à impulsion M41A Colonial Marines 10mm pulsé (Aliens 1986)
    playM41APulseBurst(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      for (let burst = 0; burst < 3; burst++) {
        const t = now + burst * 0.065;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(980, t);
        osc.frequency.exponentialRampToValueAtTime(140, t + 0.048);
        gain.gain.setValueAtTime(0.68, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.055);
        osc.connect(gain);
        this.connect(gain, x, z, 75);
        osc.start(t);
        osc.stop(t + 0.055);
      }
    }

    // Chantier 37 : Lance-grenades U1 à pompe 40mm M40 Fragmentation
    playM40GrenadePumpLaunch(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.22);
      gain.gain.setValueAtTime(0.72, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      this.connect(gain, x, z, 70);
      osc.start(now);
      osc.stop(now + 0.25);
    }

    // Chantier 34 : Lance-flammes lourd M240 Incinerator & jet continu de napalm B
    playNapalmFlameStream(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const bq = this.ctx.createBiquadFilter();
      bq.type = 'lowpass';
      bq.frequency.setValueAtTime(750, now);
      bq.frequency.linearRampToValueAtTime(280, now + 0.4);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      noise.connect(bq);
      bq.connect(gain);
      this.connect(gain, x, z, 75);
      noise.start(now);
    }

    // Chantier 31 : Éclaboussure d'eau lourde & Sillage aquatique Sub-Level 3
    playWaterSplashHeavy(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.28);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      this.connect(gain, x, z, 55);
      osc.start(now);
      osc.stop(now + 0.3);
    }

    playUnderwaterWhoosh(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.linearRampToValueAtTime(45, now + 0.4);
      gain.gain.setValueAtTime(0.42, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
      osc.connect(gain);
      this.connect(gain, x, z, 60);
      osc.start(now);
      osc.stop(now + 0.42);
    }

    // Chantier 32 : Bourdonnement de gravité zéro / sas d'apesanteur (Alien: Romulus)
    playZeroGHum(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(55, now);
      osc.frequency.linearRampToValueAtTime(62, now + 0.8);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc.connect(gain);
      this.connect(gain, x, z, 50);
      osc.start(now);
      osc.stop(now + 0.85);
    }

    // Chantier 33 : Alerte de caméra de sécurité Seegson (Alien: Isolation)
    playSecurityAlarmBeep(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      for (let b = 0; b < 2; b++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1450, now + b * 0.12);
        gain.gain.setValueAtTime(0.35, now + b * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, now + b * 0.12 + 0.08);
        osc.connect(gain);
        this.connect(gain, x, z, 65);
        osc.start(now + b * 0.12);
        osc.stop(now + b * 0.12 + 0.08);
      }
    }

    // Chantier 36 : Rugissement guttural de la caste Predalien (Canon AvP)
    playPredalienRoar(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(95, now);
      osc1.frequency.linearRampToValueAtTime(520, now + 0.35);
      osc1.frequency.linearRampToValueAtTime(65, now + 0.95);
      osc2.frequency.setValueAtTime(110, now);
      osc2.frequency.linearRampToValueAtTime(480, now + 0.35);
      osc2.frequency.linearRampToValueAtTime(75, now + 0.95);
      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.95);
      osc1.connect(gain);
      osc2.connect(gain);
      this.connect(gain, x, z, 85);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.95);
      osc2.stop(now + 0.95);
    }

    // Chantier 40 : Sons de syntonisation Hacker Tuner Seegson (Alien: Isolation)
    playTunerHackBeep(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1850, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.09);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      this.connect(gain, x, z, 45);
      osc.start(now);
      osc.stop(now + 0.09);
    }

    // Chantier 41 : Broyage de pince hydraulique Caterpillar P-5000 (Aliens 1986)
    playPowerLoaderPincerClaw(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(95, now + 0.28);
      gain.gain.setValueAtTime(0.85, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
      osc.connect(gain);
      this.connect(gain, x, z, 75);
      osc.start(now);
      osc.stop(now + 0.28);
      this.playWetImpact?.(x, z);
    }

    // Chantier 41 : Pas lourd à vérin hydraulique P-5000
    playPowerLoaderHeavyStep(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(75, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.35);
      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.connect(gain);
      this.connect(gain, x, z, 65);
      osc.start(now);
      osc.stop(now + 0.35);
    }

    // Chantier 42 : Sirène d'aspiration et décompression explosive de sas (Alien 1979 / Romulus)
    playDecompressionSiren(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.linearRampToValueAtTime(780, now + 0.45);
      osc.frequency.linearRampToValueAtTime(380, now + 0.9);
      gain.gain.setValueAtTime(0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
      osc.connect(gain);
      this.connect(gain, x, z, 95);
      osc.start(now);
      osc.stop(now + 0.9);
    }

    // Chantier 42 : Souffle d'aspiration du vide spatial (Vacuum Whoosh)
    playVacuumWhoosh(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.8;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.4));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(150, now + 0.8);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.75, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      noise.connect(filter);
      filter.connect(gain);
      this.connect(gain, x, z, 85);
      noise.start(now);
    }

    // Chantier 43 : Jet de vapeur chimique de décontamination (Alien 3 / Isolation)
    playDeconSteam(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.7;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.4;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, now);
      filter.Q.value = 1.8;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
      noise.connect(filter);
      filter.connect(gain);
      this.connect(gain, x, z, 60);
      noise.start(now);
    }

    // Chantier 45 : Décharge 100kV de bâton à choc Weyland-Yutani (Alien 3 / Isolation)
    playStunBatonZap(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(450, now + 0.12);
      osc.frequency.linearRampToValueAtTime(90, now + 0.28);
      gain.gain.setValueAtTime(0.75, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
      osc.connect(gain);
      this.connect(gain, x, z, 55);
      osc.start(now);
      osc.stop(now + 0.28);
    }

    // Chantier 46 : Éjection de gaz extincteur Halon 1301 (Alien: Isolation)
    playHalonHiss(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 1.2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.35;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, now);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
      noise.connect(filter);
      filter.connect(gain);
      this.connect(gain, x, z, 70);
      noise.start(now);
    }

    // Chantier 47 : Grésillement et étincelles d'androïde découpé (Aliens 1986)
    playBisectedSpark(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880 + Math.random() * 400, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      this.connect(gain, x, z, 40);
      osc.start(now);
      osc.stop(now + 0.08);
    }

    // Chantier 48 : Klaxon mécanique bitonal d'alarme rouge Nostromo (Jerry Goldsmith 1979)
    playKlaxonAlarm(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const freqs = [440, 580];
      freqs.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now + idx * 0.22);
        gain.gain.setValueAtTime(0.55, now + idx * 0.22);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.22 + 0.2);
        osc.connect(gain);
        this.connect(gain, x, z, 90);
        osc.start(now + idx * 0.22);
        osc.stop(now + idx * 0.22 + 0.2);
      });
    }

    // Chantier 49 : Éventration de grille métallique de plancher (Aliens 1986)
    playGrateBurstCrash(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.45);
      gain.gain.setValueAtTime(0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.connect(gain);
      this.connect(gain, x, z, 85);
      osc.start(now);
      osc.stop(now + 0.45);
      this.playWetImpact?.(x, z);
    }

    // Chantier 50 : Bip de compte à rebours de M.U.T.H.U.R. 6000 (Alien 1979)
    playMotherCountdownBeep(secondsRemaining) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2200, now);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    }

    // Chantier 51 : Sifflement et claquement mandibulaire du Néomorphe (Alien: Covenant 2017)
    playNeomorphHiss(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.linearRampToValueAtTime(2400, now + 0.18);
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.45);
      gain.gain.setValueAtTime(0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.connect(gain);
      this.connect(gain, x, z, 70);
      osc.start(now);
      osc.stop(now + 0.45);
    }

    // Chantier 51 : Jaillissement féroce du Bloodburster nouveau-né (Alien: Covenant 2017)
    playBloodbursterErupt(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.linearRampToValueAtTime(2800, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.5);
      gain.gain.setValueAtTime(0.85, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.connect(gain);
      this.connect(gain, x, z, 75);
      osc.start(now);
      osc.stop(now + 0.5);
      this.playWetImpact?.(x, z);
    }

    // Chantier 52 : Balayage et bips cadencés du Détecteur de Mouvement USCM M314 (Aliens 1986 / Isolation)
    playMotionTrackerSweep(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1450, now);
      osc.frequency.linearRampToValueAtTime(980, now + 0.08);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      this.connect(gain, x, z, 55);
      osc.start(now);
      osc.stop(now + 0.09);
    }

    playMotionTrackerRapidBeep() {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      for (let b = 0; b < 3; b++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(2250, now + b * 0.07);
        gain.gain.setValueAtTime(0.3, now + b * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + b * 0.07 + 0.045);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + b * 0.07);
        osc.stop(now + b * 0.07 + 0.045);
      }
    }

    // Chantier 54 : Rupture de conduite et geyser de vapeur à 300°C (Alien 1979 / Aliens 1986)
    playSteamBurstRupture(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.85;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.45;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1600, now);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.85);
      noise.connect(filter);
      filter.connect(gain);
      this.connect(gain, x, z, 70);
      noise.start(now);
    }

    // Chantier 56 : Rugissement royal phéromonal de ralliement du Praetorian (Aliens 1986 / AvP)
    playPraetorianBattleRoar(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(110, now);
      osc1.frequency.linearRampToValueAtTime(185, now + 0.35);
      osc1.frequency.exponentialRampToValueAtTime(45, now + 0.95);
      osc2.frequency.setValueAtTime(75, now);
      osc2.frequency.linearRampToValueAtTime(130, now + 0.4);
      osc2.frequency.exponentialRampToValueAtTime(32, now + 0.95);
      gain.gain.setValueAtTime(0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.95);
      osc1.connect(gain);
      osc2.connect(gain);
      this.connect(gain, x, z, 90);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.95);
      osc2.stop(now + 0.95);
    }

    // Chantier 57 : Détonation de grenade à impulsion magnétique polarisée I.M.P. (Aliens: Dark Descent)
    playEMPBlastNoise(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(18, now + 0.65);
      gain.gain.setValueAtTime(0.95, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc.connect(gain);
      this.connect(gain, x, z, 80);
      osc.start(now);
      osc.stop(now + 0.7);
    }

    // Chantier 58 : Grincement d'acier et rupture de vérin hydraulique forcé (Alien: Isolation)
    playDoorPryCreak(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(420, now + 0.25);
      osc.frequency.exponentialRampToValueAtTime(95, now + 0.55);
      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
      osc.connect(gain);
      this.connect(gain, x, z, 65);
      osc.start(now);
      osc.stop(now + 0.55);
    }

    // Chantier 59 : Inoculation oviducte directe sur proie agonique (Alien: Romulus / Comics)
    playOviductInoculation(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.linearRampToValueAtTime(320, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.45);
      gain.gain.setValueAtTime(0.75, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.48);
      osc.connect(gain);
      this.connect(gain, x, z, 60);
      osc.start(now);
      osc.stop(now + 0.48);
      this.playWetImpact?.(x, z);
    }

    // Chantier 60 : Écho de condensation et gouttes d'eau régulières (Ambiance Nostromo 1979)
    playDrippingEcho(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1750, now);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.04);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      this.connect(gain, x, z, 40);
      osc.start(now);
      osc.stop(now + 0.05);
    }

    // Chantier 61 : Onde télépathique psychique de commandement de l'Alpha (Marvel Comics: Alien: Bloodlines 2021)
    playAlphaPsychicWave(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const sub = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      sub.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.linearRampToValueAtTime(220, now + 0.4);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.9);
      sub.frequency.setValueAtTime(40, now);
      sub.frequency.linearRampToValueAtTime(75, now + 0.5);
      sub.frequency.exponentialRampToValueAtTime(28, now + 0.9);
      gain.gain.setValueAtTime(0.85, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.92);
      osc.connect(gain);
      sub.connect(gain);
      this.connect(gain, x, z, 95);
      osc.start(now);
      sub.start(now);
      osc.stop(now + 0.92);
      sub.stop(now + 0.92);
    }

    // Chantier 62 : Clisquetis multiples frénétiques d'essaim de Swarmers (Marvel Comics: Alien: Icarus)
    playSwarmerChitter(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        const startT = now + i * 0.06;
        osc.frequency.setValueAtTime(1400 + Math.random() * 600, startT);
        osc.frequency.exponentialRampToValueAtTime(450, startT + 0.09);
        gain.gain.setValueAtTime(0.35, startT);
        gain.gain.exponentialRampToValueAtTime(0.01, startT + 0.09);
        osc.connect(gain);
        this.connect(gain, x, z, 55);
        osc.start(startT);
        osc.stop(startT + 0.09);
      }
    }

    // Chantier 63 : Allumage et sifflement plasma thermo-lame Steel Team (Marvel Comics: Alien: Icarus)
    playThermalBladeIgnite(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.4);
      gain.gain.setValueAtTime(0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.42);
      osc.connect(gain);
      this.connect(gain, x, z, 70);
      osc.start(now);
      osc.stop(now + 0.42);
    }

    // Chantier 63 : Tir percussion fusil à concussion magnétique Steel Team
    playConcussionBlast(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.28);
      gain.gain.setValueAtTime(0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      this.connect(gain, x, z, 80);
      osc.start(now);
      osc.stop(now + 0.3);
    }

    // Chantier 64 : Suintement et pulsation visqueuse expansion Hive Creep (Marvel Comics)
    playHiveCreepSpread(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.linearRampToValueAtTime(145, now + 0.3);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.6);
      gain.gain.setValueAtTime(0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.62);
      osc.connect(gain);
      this.connect(gain, x, z, 50);
      osc.start(now);
      osc.stop(now + 0.62);
      this.playWetImpact?.(x, z);
    }

    // Chantier 68 : Déflagration lourde baril de Napalm USCM (Aliens 1986 / Isolation)
    playNapalmBarrelExplosion(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.65);
      gain.gain.setValueAtTime(1.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
      osc.connect(gain);
      this.connect(gain, x, z, 120);
      osc.start(now);
      osc.stop(now + 0.7);
    }

    // Chantier 69 : Battement de coeur volumétrique vision phéromonale (Marvel Comics 1:1)
    playHeartbeatPulse(bpm = 90) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(55, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.12);
      gain.gain.setValueAtTime(0.42, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(now);
      osc.stop(now + 0.14);
    }

    // Chantier 70 : Claquement supersonique balistique whip-crack de l'Alpha (Marvel Comics)
    playSupersonicTailSnap(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(2600, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);
      gain.gain.setValueAtTime(0.95, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      this.connect(gain, x, z, 90);
      osc.start(now);
      osc.stop(now + 0.2);
    }

    // Chantier 67 : Hurlement d'agonie rageur Death Throes (Marvel Comics)
    playDeathThroesScreech(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.linearRampToValueAtTime(1450, now + 0.4);
      osc.frequency.exponentialRampToValueAtTime(120, now + 1.2);
      gain.gain.setValueAtTime(1.0, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.25);
      osc.connect(gain);
      this.connect(gain, x, z, 100);
      osc.start(now);
      osc.stop(now + 1.25);
    }
  }

  const audioManager = new AudioManager();

  // -------------------------------------------------------------
  // RETRO-FUTURISTIC WEYLAND-YUTANI M314 MOTION TRACKER (Aliens / Isolation)
  // -------------------------------------------------------------
  class MotionTrackerDisplay {
    constructor() {
      this.canvas = document.getElementById('tracker-canvas');
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
      this.deviceEl = document.getElementById('m314-tracker');
      this.rangeValEl = document.getElementById('tracker-range-val');
      this.contactsValEl = document.getElementById('tracker-contacts-val');
      this.statusEl = document.getElementById('tracker-status');
      this.toggleBtn = document.getElementById('btn-toggle-tracker');
      this.modeBtn = document.getElementById('btn-tracker-mode');
      this.sweepAngle = 0;
      this.isCollapsed = false;
      this.focusedMode = false;
      this.staticInterferenceTimer = 0;

      if (this.toggleBtn) {
        this.toggleBtn.onclick = () => this.toggleCollapse();
      }
      if (this.modeBtn) {
        this.modeBtn.onclick = () => this.toggleFocusedMode();
      }
    }

    toggleCollapse() {
      this.isCollapsed = !this.isCollapsed;
      if (this.deviceEl) {
        this.deviceEl.classList.toggle('collapsed', this.isCollapsed);
      }
      showToast(this.isCollapsed ? 'M314 Replié [Touche M]' : 'M314 Déployé [Touche M]');
    }

    toggleFocusedMode() {
      this.focusedMode = !this.focusedMode;
      if (this.modeBtn) {
        this.modeBtn.textContent = this.focusedMode ? '[T] FOCAL' : '[T] 360°';
      }
      showToast(this.focusedMode ? 'M314 : Mode Balayage Focalisé 45° Longue Portée 35m [T]' : 'M314 : Mode Balayage Omni 360° Standard 22m [T]');
    }

    update(deltaSeconds, player, humans) {
      if (!this.ctx || !player) return;
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const maxRange = this.focusedMode ? 35.0 : 22.0;
      const radius = (w / 2) - 6;

      ctx.fillStyle = 'rgba(2, 26, 8, 0.42)';
      ctx.fillRect(0, 0, w, h);

      this.sweepAngle = (this.sweepAngle + deltaSeconds * 2.8) % (Math.PI * 2);

      ctx.strokeStyle = 'rgba(34, 197, 94, 0.28)';
      ctx.lineWidth = 1;
      for (let r = 0.25; r <= 1.0; r += 0.25) {
        ctx.beginPath();
        ctx.arc(cx, cy, radius * r, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.moveTo(cx, cy - radius);
      ctx.lineTo(cx, cy + radius);
      ctx.moveTo(cx - radius, cy);
      ctx.lineTo(cx + radius, cy);
      ctx.stroke();

      if (this.focusedMode) {
        // Chantier 29 : Faisceau conique étroit 45° vers l'avant (Aliens / Isolation)
        ctx.save();
        ctx.fillStyle = 'rgba(57, 255, 20, 0.22)';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, -Math.PI / 2 - 0.42, -Math.PI / 2 + 0.42);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(57, 255, 20, 0.75)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      } else {
        const sweepGradient = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius);
        sweepGradient.addColorStop(0, 'rgba(57, 255, 20, 0.55)');
        sweepGradient.addColorStop(1, 'rgba(34, 197, 94, 0.0)');
        ctx.fillStyle = sweepGradient;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, this.sweepAngle - 0.52, this.sweepAngle);
        ctx.closePath();
        ctx.fill();
      }

      // Chantier 29 : Interférences magnétiques du secteur réacteur Mantis
      const nearReactor = Math.hypot(player.x - (-45), player.z - 45) < 32;
      if (nearReactor && !this.focusedMode) {
        this.staticInterferenceTimer -= deltaSeconds;
        if (this.staticInterferenceTimer <= 0) {
          this.staticInterferenceTimer = 2.4 + Math.random() * 2.6;
          audioManager.playStaticInterference?.(player.x, player.z);
        }
        for (let s = 0; s < 40; s++) {
          const sx = Math.random() * w;
          const sy = Math.random() * h;
          ctx.fillStyle = Math.random() > 0.4 ? 'rgba(57, 255, 20, 0.4)' : 'rgba(255, 255, 255, 0.3)';
          ctx.fillRect(sx, sy, 1.5, 1.5);
        }
      }

      const activeHumans = (humans || []).filter((human) => !human.isIncapacitated && !human.isCocooned);
      let closestDistance = Infinity;
      let contactCount = 0;

      const playerFacing = player.mesh ? player.mesh.rotation.y : 0;

      for (const human of activeHumans) {
        const dx = human.x - player.x;
        const dz = human.z - player.z;
        const dist = Math.hypot(dx, dz);
        if (dist > maxRange) continue;

        const worldAngle = Math.atan2(dx, dz);
        const relAngle = worldAngle - playerFacing;
        const normalizedRel = (((relAngle % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI;

        // En mode focalisé, filtrer les contacts hors du cône 45°
        if (this.focusedMode && Math.abs(normalizedRel) > 0.44) continue;

        contactCount++;
        if (dist < closestDistance) closestDistance = dist;

        const normDist = (dist / maxRange) * radius;
        const bx = cx + Math.sin(relAngle) * normDist;
        const by = cy - Math.cos(relAngle) * normDist;

        // Chantier 8 : Indicateur d'élévation M314 (▲ au-dessus, ▼ en-dessous, ● même plan)
        const playerY = player.isCeilingProwling ? 5.85 : (player.isInVent ? 3.2 : 0);
        const humanY = human.mesh?.position?.y || 0;
        const dy = humanY - playerY;
        const elevMarker = dy > 1.2 ? '▲' : (dy < -1.2 ? '▼' : '●');
        const angleDiff = Math.abs((((relAngle - this.sweepAngle) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
        const isHit = this.focusedMode || angleDiff < 0.35;

        ctx.fillStyle = isHit ? '#ffffff' : '#39ff14';
        ctx.shadowColor = '#39ff14';
        ctx.shadowBlur = isHit ? 12 : 6;
        ctx.beginPath();
        ctx.arc(bx, by, isHit ? 4.2 : 3.0, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '700 9px monospace';
        ctx.fillText(elevMarker, bx + 5, by + 3);
        ctx.shadowBlur = 0;
      }

      // Chantier 13 : Écho radar du Chat Jonesy sur le tracker (Alien 1979)
      if (stationMap.shipCat && stationMap.shipCat.mesh) {
        const cat = stationMap.shipCat;
        const cdx = cat.x - player.x;
        const cdz = cat.z - player.z;
        const cdist = Math.hypot(cdx, cdz);
        if (cdist <= maxRange) {
          const worldAngle = Math.atan2(cdx, cdz);
          const relAngle = worldAngle - playerFacing;
          const normalizedRel = (((relAngle % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
          if (!this.focusedMode || Math.abs(normalizedRel) <= 0.44) {
            contactCount++;
            if (cdist < closestDistance) closestDistance = cdist;
            const normDist = (cdist / maxRange) * radius;
            const bx = cx + Math.sin(relAngle) * normDist;
            const by = cy - Math.cos(relAngle) * normDist;
            const angleDiff = Math.abs((((relAngle - this.sweepAngle) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
            const isHit = this.focusedMode || angleDiff < 0.35;
            ctx.fillStyle = isHit ? '#ffffff' : '#f59e0b';
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = isHit ? 10 : 4;
            ctx.beginPath();
            ctx.arc(bx, by, isHit ? 3.4 : 2.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = '700 8px monospace';
            ctx.fillText('CAT', bx + 4, by + 3);
            ctx.shadowBlur = 0;
          }
        }
      }

      // Échos fantômes intermittents causés par les évents de vapeur (Aliens 1986 / Isolation)
      if (stationMap.steamVents) {
        for (const sv of stationMap.steamVents) {
          const svDist = Math.hypot(sv.x - player.x, sv.z - player.z);
          if (svDist <= maxRange && (sv.timer || 0) < 1.2) {
            const worldAngle = Math.atan2(sv.x - player.x, sv.z - player.z);
            const relAngle = worldAngle - playerFacing;
            const normDist = (svDist / maxRange) * radius;
            const fx = cx + Math.sin(relAngle) * normDist;
            const fy = cy - Math.cos(relAngle) * normDist;
            ctx.fillStyle = 'rgba(57, 255, 20, 0.35)';
            ctx.beginPath();
            ctx.arc(fx, fy, 2.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = '700 8px monospace';
            ctx.fillText('~', fx + 4, fy + 3);
          }
        }
      }

      // Rendu des lignes de balayage cathodique CRT & lueur phosphorescente (Aliens 1986 / Isolation)
      ctx.strokeStyle = 'rgba(0, 20, 5, 0.35)';
      ctx.lineWidth = 1;
      for (let y = 0; y < h; y += 3) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Vignette circulaire d'écran cathodique bombé
      const crtVignette = ctx.createRadialGradient(cx, cy, radius * 0.7, cx, cy, radius);
      crtVignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      crtVignette.addColorStop(1, 'rgba(0, 15, 3, 0.55)');
      ctx.fillStyle = crtVignette;
      ctx.fillRect(0, 0, w, h);

      if (this.rangeValEl) {
        this.rangeValEl.textContent = closestDistance < Infinity ? `${closestDistance.toFixed(1)} M` : '--.- M';
      }
      if (this.contactsValEl) {
        this.contactsValEl.textContent = String(contactCount);
      }
      if (this.statusEl) {
        const modeTag = this.focusedMode ? 'FOCAL' : (nearReactor ? 'PARASITE' : 'OMNI');
        this.statusEl.textContent = contactCount > 0 ? (closestDistance < 6 ? `CRITIQUE [${modeTag}]` : `TRACKING [${modeTag}]`) : `STANDBY [${modeTag}]`;
        this.statusEl.style.color = closestDistance < 6 ? '#ef4444' : (nearReactor && !this.focusedMode ? '#f59e0b' : '#39ff14');
      }
    }
  }

  // -------------------------------------------------------------
  // 2. INPUT MANAGER
  // -------------------------------------------------------------
  class InputManager {
    constructor() {
      this.keys = {};
      this.mouse = { x: 0, y: 0, isDown: false, rightDown: false };
      this.listeners = [];
      this.initialized = false;
      this.lastTouchAt = 0;
    }

    init(canvasElement) {
      if (this.initialized) return;
      this.initialized = true;
      this.canvas = canvasElement;
      window.addEventListener('keydown', (e) => {
        const target = e.target;
        const isHudInteraction = target instanceof Element && !!target.closest(
          'button, input, select, textarea, a, [contenteditable="true"], #hud-header, #hud-sidebar, #rts-control-bar, #stage-modal'
        );
        if (isHudInteraction) return;

        const key = e.key.toLowerCase();
        this.keys[key] = true;
        this.keys[e.code.toLowerCase()] = true;

        if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'f1', 'f2', 'f3'].includes(key)) {
          e.preventDefault();
        }

        // A held key still drives movement, but one-shot actions fire only once.
        if (!e.repeat) this.emit('keydown', key);
      });
      window.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        this.keys[key] = false;
        this.keys[e.code.toLowerCase()] = false;
        this.emit('keyup', key);
      });
      window.addEventListener('blur', () => this.reset());
      const updatePointerPosition = (event) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = event.clientX - rect.left;
        this.mouse.y = event.clientY - rect.top;
      };
      this.canvas.addEventListener('mousemove', (e) => {
        updatePointerPosition(e);
        this.emit('mousemove', this.mouse);
      });
      this.canvas.addEventListener('mousedown', (e) => {
        if (Date.now() - this.lastTouchAt < 500) return;
        updatePointerPosition(e);
        if (e.button === 0) this.mouse.isDown = true;
        if (e.button === 2) this.mouse.rightDown = true;
        this.emit('mousedown', { button: e.button, x: this.mouse.x, y: this.mouse.y });
      });
      this.canvas.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse') return;
        e.preventDefault();
        this.lastTouchAt = Date.now();
        updatePointerPosition(e);
        this.mouse.isDown = true;
        this.emit('mousedown', { button: 0, x: this.mouse.x, y: this.mouse.y });
      });
      window.addEventListener('mouseup', (e) => {
        if (e.button === 0) this.mouse.isDown = false;
        if (e.button === 2) this.mouse.rightDown = false;
        this.emit('mouseup', { button: e.button, x: this.mouse.x, y: this.mouse.y });
      });
      window.addEventListener('pointerup', (e) => {
        if (e.pointerType === 'mouse') return;
        this.mouse.isDown = false;
        this.emit('mouseup', { button: 0, x: this.mouse.x, y: this.mouse.y });
      });
      window.addEventListener('pointercancel', () => {
        this.mouse.isDown = false;
      });
      this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    isKeyPressed(key) {
      return !!this.keys[key.toLowerCase()];
    }

    getMovementVector() {
      let dx = 0; let dy = 0;
      if (this.isKeyPressed('w') || this.isKeyPressed('z') || this.isKeyPressed('arrowup')) dy -= 1;
      if (this.isKeyPressed('s') || this.isKeyPressed('arrowdown')) dy += 1;
      if (this.isKeyPressed('a') || this.isKeyPressed('q') || this.isKeyPressed('arrowleft')) dx -= 1;
      if (this.isKeyPressed('d') || this.isKeyPressed('arrowright')) dx += 1;
      const len = Math.hypot(dx, dy);
      if (len > 0) { dx /= len; dy /= len; }
      return { dx, dy };
    }

    on(event, callback) {
      const listener = { event, callback };
      this.listeners.push(listener);
      return () => {
        const index = this.listeners.indexOf(listener);
        if (index >= 0) this.listeners.splice(index, 1);
      };
    }

    emit(event, payload) {
      for (const l of [...this.listeners]) {
        if (l.event === event) l.callback(payload);
      }
    }

    reset() {
      this.keys = {};
      this.mouse.isDown = false;
      this.mouse.rightDown = false;
    }
  }

  const inputManager = new InputManager();

  // -------------------------------------------------------------
  // 3. RENDERER 2D/3D (Three.js)
  // -------------------------------------------------------------
  class Renderer2D3D {
    constructor() {
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.lights = {};
      this.mapGroup = null;
      this.propsGroup = null;
      this.resinGroup = null;
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.raycaster = null;
      this.groundPlane = null;
      this.screenShake = 0;
      this.powerSabotagedTimer = 0;
      this.reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    sabotagePower(duration = 22) {
      this.powerSabotagedTimer = duration;
      audioManager.playElectricArc?.();
      this.addScreenShake?.(0.38, 0.25);
      showToast('SABOTAGE DU RÉSEAU ÉLECTRIQUE [B] : Coupure de courant majeure ! La station est plongée dans le noir !');
      appendSensorLog('[SABOTAGE] Conduits d\'alimentation sectionnés. Extinction de l\'éclairage principal.', 'alert');
    }

    init(canvas) {
      this.raycaster = new THREE.Raycaster();
      this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x040609);
      this.scene.fog = new THREE.FogExp2(0x040609, 0.012);

      const aspect = this.width / this.height;
      this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 1000);
      this.camera.position.set(0, 38, 32);
      this.camera.lookAt(0, 0, 0);

      this.renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        powerPreference: "high-performance"
      });
      this.renderer.setSize(this.width, this.height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.outputEncoding = THREE.sRGBEncoding;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.05;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      const ambient = new THREE.AmbientLight(0x172033, 1.05);
      this.scene.add(ambient);

      const hemisphere = new THREE.HemisphereLight(0x294861, 0x08030e, 0.75);
      this.scene.add(hemisphere);

      const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
      dirLight.position.set(30, 60, 30);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.set(2048, 2048);
      dirLight.shadow.bias = -0.0004;
      dirLight.shadow.camera.left = -75;
      dirLight.shadow.camera.right = 75;
      dirLight.shadow.camera.top = 75;
      dirLight.shadow.camera.bottom = -75;
      this.scene.add(dirLight);

      const redEmergency = new THREE.PointLight(0xff0055, 3.5, 50);
      redEmergency.position.set(-20, 10, -25);
      this.scene.add(redEmergency);

      const bioGreen = new THREE.PointLight(0x39ff14, 2.8, 40);
      bioGreen.position.set(15, 8, 10);
      this.scene.add(bioGreen);

      this.lights = { ambient, hemisphere, dirLight, redEmergency, bioGreen };

      this.mapGroup = new THREE.Group();
      this.propsGroup = new THREE.Group();
      this.resinGroup = new THREE.Group();
      this.scene.add(this.mapGroup);
      this.scene.add(this.propsGroup);
      this.scene.add(this.resinGroup);

      // Gyrophare rotatif d'alarme industrielle Weyland-Yutani (Alien 1979 / Aliens 1986)
      const beaconPivot = new THREE.Group();
      beaconPivot.position.set(0, 8.5, 0);
      const beaconSpot = new THREE.SpotLight(0xf59e0b, 0, 48, Math.PI / 4, 0.45, 1.2);
      beaconSpot.position.set(0, 0, 0);
      const beaconTarget = new THREE.Object3D();
      beaconTarget.position.set(22, -8.5, 0);
      beaconPivot.add(beaconSpot);
      beaconPivot.add(beaconTarget);
      beaconSpot.target = beaconTarget;
      this.scene.add(beaconPivot);
      this.beaconPivot = beaconPivot;
      this.beaconSpot = beaconSpot;

      window.addEventListener('resize', () => this.onWindowResize());
    }

    onWindowResize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height);
    }

    setCameraTarget(x, z, heightOffset = 0, isRTS = false, deltaSeconds = 1 / 60) {
      if (this.beaconPivot && this.beaconSpot) {
        const isAlarmActive = (window.alarmSystem?.level || 0) >= 2;
        this.beaconSpot.intensity = isAlarmActive ? 4.5 : 0;
        if (isAlarmActive) {
          this.beaconPivot.rotation.y += Math.max(0, deltaSeconds) * 4.2;
        }
      }

      if (this.powerSabotagedTimer > 0) {
        this.powerSabotagedTimer -= Math.max(0, deltaSeconds);
        if (this.lights.dirLight) this.lights.dirLight.intensity = 0.08;
        if (this.lights.ambient) this.lights.ambient.intensity = 0.12;
        if (this.lights.hemisphere) this.lights.hemisphere.intensity = 0.08;
        if (this.renderer) this.renderer.toneMappingExposure = 0.72;
        if (this.powerSabotagedTimer <= 0) {
          audioManager.playGeneratorRestart?.();
          if (this.lights.dirLight) this.lights.dirLight.intensity = 1.2;
          if (this.lights.ambient) this.lights.ambient.intensity = 1.05;
          if (this.lights.hemisphere) this.lights.hemisphere.intensity = 0.75;
          if (this.renderer) this.renderer.toneMappingExposure = isRTS ? 1.34 : 1.05;
          showToast('RÉSEAU ÉLECTRIQUE RÉTABLI : Les générateurs de secours ont redémarré.');
          appendSensorLog('[ÉLECTRICITÉ] Turbines de secours opérationnelles. Éclairage rétabli.', 'system');
        }
      }

      const desiredFov = isRTS ? 54 : 40;
      if (this.camera.fov !== desiredFov) {
        this.camera.fov = desiredFov;
        this.camera.updateProjectionMatrix();
      }
      if (this.camera.near !== 0.1) {
        this.camera.near = 0.1;
        this.camera.updateProjectionMatrix();
      }
      if (this.scene?.fog) this.scene.fog.density = isRTS ? 0.0045 : 0.012;
      if (this.renderer) this.renderer.toneMappingExposure = isRTS ? 1.34 : 1.05;
      // La vue de commandement cadre toute la station afin que les trois relais
      // restent réellement ciblables sans caméra libre ni mini-carte.
      const targetY = isRTS ? 120 : 46 + heightOffset;
      const targetZ = isRTS ? z + 70 : z + 20;
      const smoothing = 1 - Math.pow(0.92, Math.max(0, deltaSeconds) * 60);

      this.camera.position.x += (x - this.camera.position.x) * smoothing;
      this.camera.position.z += (targetZ - this.camera.position.z) * smoothing;
      this.camera.position.y += (targetY - this.camera.position.y) * smoothing;

      if (this.screenShake && this.screenShake > 0.005) {
        this.camera.position.x += (Math.random() - 0.5) * this.screenShake * 1.8;
        this.camera.position.y += (Math.random() - 0.5) * this.screenShake * 1.2;
        this.screenShake *= Math.pow(0.82, Math.max(0, deltaSeconds) * 60);
      } else {
        this.screenShake = 0;
      }

      this.camera.lookAt(x, isRTS ? 0 : 1.2, z);
    }

    addScreenShake(intensity = 0.22) {
      if (this.reduceMotion) return;
      this.screenShake = Math.min(1.2, (this.screenShake || 0) + intensity);
    }

    setCinematicCamera({ position, target, fov = 72, near = 0.025, exposure = 1.18 }, deltaSeconds = 1 / 60) {
      if (!position || !target) return;
      let projectionChanged = false;
      if (this.camera.fov !== fov) {
        this.camera.fov = fov;
        projectionChanged = true;
      }
      if (this.camera.near !== near) {
        this.camera.near = near;
        projectionChanged = true;
      }
      if (projectionChanged) this.camera.updateProjectionMatrix();
      if (this.scene?.fog) this.scene.fog.density = 0;
      if (this.renderer) this.renderer.toneMappingExposure = exposure;
      const smoothing = 1 - Math.pow(0.78, Math.max(0, deltaSeconds) * 60);
      this.camera.position.x += (position.x - this.camera.position.x) * smoothing;
      this.camera.position.y += (position.y - this.camera.position.y) * smoothing;
      this.camera.position.z += (position.z - this.camera.position.z) * smoothing;
      this.camera.lookAt(target.x, target.y, target.z);
    }

    snapCameraTarget(x, z, heightOffset = 0, isRTS = false) {
      this.setCameraTarget(x, z, heightOffset, isRTS, 4);
    }

    snapCinematicCamera(override) {
      this.setCinematicCamera(override, 4);
    }

    screenToGround(screenX, screenY) {
      if (!this.renderer || !this.camera) return null;
      const rect = this.renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;

      const pointer = new THREE.Vector2(
        (screenX / rect.width) * 2 - 1,
        -(screenY / rect.height) * 2 + 1
      );
      const worldPoint = new THREE.Vector3();
      this.raycaster.setFromCamera(pointer, this.camera);
      return this.raycaster.ray.intersectPlane(this.groundPlane, worldPoint)
        ? { x: worldPoint.x, z: worldPoint.z }
        : null;
    }

    removeObject(object) {
      if (!object) return;
      if (object.parent) object.parent.remove(object);
      object.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (!child.material) return;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        for (const material of materials) material.dispose();
      });
    }

    createTileTexture(type) {
      const canvas = document.createElement('canvas');
      canvas.width = 128; canvas.height = 128;
      const ctx = canvas.getContext('2d');

      if (type === 'floor') {
        ctx.fillStyle = '#0b1329'; ctx.fillRect(0, 0, 128, 128);
        ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 4;
        ctx.strokeRect(4, 4, 120, 120);
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(64, 0); ctx.lineTo(64, 128);
        ctx.moveTo(0, 64); ctx.lineTo(128, 64);
        ctx.stroke();
      } else if (type === 'wall') {
        ctx.fillStyle = '#1e293b'; ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#0f172a'; ctx.fillRect(8, 8, 112, 112);
        ctx.fillStyle = '#38bdf8'; ctx.fillRect(16, 16, 96, 6);
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      return texture;
    }

    render() {
      if (this.lights.redEmergency && !this.reduceMotion) {
        this.lights.redEmergency.intensity = 2.5 + Math.sin(Date.now() * 0.005) * 1.0;
      }
      if (this.lights.bioGreen && !this.reduceMotion) {
        this.lights.bioGreen.intensity = 2.0 + Math.sin(Date.now() * 0.003) * 0.6;
      }
      this.renderer.render(this.scene, this.camera);
    }
  }

  const rendererEngine = new Renderer2D3D();

  // -------------------------------------------------------------
  // 4. VISION SYSTEM
  // -------------------------------------------------------------
  class VisionSystem {
    constructor() {
      this.currentMode = 'normal';
      this.overlayElement = null;
    }
    init() {
      this.overlayElement = document.getElementById('vision-overlay');
      this.setupUIListeners();
      this.updateUI();
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
      if (!['normal', 'thermal', 'acoustic'].includes(mode)) return;
      const modeChanged = this.currentMode !== mode;
      this.currentMode = mode;
      this.updateUI();
      if (modeChanged) {
        audioManager.playHeartbeat();
        if (mode === 'thermal') {
          showToast('FLIR THERMIQUE ACTIF : Infrarouge endothermique (Humains 37°C / Synthétiques 21°C / Vapeur 92°C).');
          appendSensorLog('[FLIR] Détecteur infrarouge activé. Signature xénomorphe ectothermique masquée contre parois froides.', 'stealth');
        }
      }
    }
    updateUI() {
      if (this.overlayElement) this.overlayElement.className = `vision-${this.currentMode}`;
      document.querySelectorAll('.vis-btn').forEach((btn) => {
        const isActive = btn.id === `btn-vis-${this.currentMode}`;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', String(isActive));
      });
    }

    update(deltaSeconds) {
      if (this.currentMode === 'acoustic') {
        this.sonarTimer = (this.sonarTimer || 0) - deltaSeconds;
        this.heartbeatPulseTimer = (this.heartbeatPulseTimer || 0) - deltaSeconds;
        if (this.sonarTimer <= 0) {
          this.sonarTimer = 2.4;
          audioManager.playSonarPing?.(playerCreature.x, playerCreature.z);
          window.HiveSystems?.vfx?.ring?.(playerCreature.x, playerCreature.z, 0x22c55e, 26);
          const humans = window.gameInstance?.humans || [];
          humans.forEach((h) => {
            if (!h.isIncapacitated && h.hp > 0) {
              window.HiveSystems?.vfx?.ring?.(h.x, h.z, 0x4ade80, 2.5);
            }
          });
        }
        // Chantier 69 : Vision Chimio-Phéromonale Battements Cardiaques Marvel 1:1
        if (this.heartbeatPulseTimer <= 0) {
          const humans = window.gameInstance?.humans || [];
          const activeHumans = humans.filter((h) => !h.isIncapacitated && h.hp > 0 && Math.hypot(h.x - playerCreature.x, h.z - playerCreature.z) <= 32);
          if (activeHumans.length > 0) {
            const maxStress = Math.max(...activeHumans.map((h) => h.stress || 0));
            const calculatedBpm = Math.round(75 + (maxStress / 100) * 85);
            this.heartbeatPulseTimer = 60 / calculatedBpm;
            audioManager.playHeartbeatPulse?.(calculatedBpm);
            activeHumans.forEach((h) => {
              const pulseColor = (h.stress || 0) > 60 ? 0xdc2626 : 0xef4444;
              window.HiveSystems?.vfx?.ring?.(h.x, h.z, pulseColor, 1.2 + ((h.stress || 0) / 100) * 1.5);
              if (Math.random() < 0.35) {
                window.HiveSystems?.vfx?.floatingText?.(h.x, 3.2, h.z, `♥ ${calculatedBpm} BPM`, '#ef4444', false);
              }
            });
          } else {
            this.heartbeatPulseTimer = 1.6;
          }
        }
      } else if (this.currentMode === 'thermal') {
        // Chantier 11 : Système FLIR / Thermique & Furtivité Ectothermique (Alien: Isolation / Romulus)
        this.thermalScanTimer = (this.thermalScanTimer || 0) - deltaSeconds;
        if (this.thermalScanTimer <= 0) {
          this.thermalScanTimer = 1.5;
          const humans = window.gameInstance?.humans || [];
          humans.forEach((h) => {
            if (!h.isIncapacitated && h.hp > 0) {
              const isSynth = h.type === 'synthetic' || h.type === 'android';
              const tempLabel = isSynth ? '21.5°C [SYNTH]' : '37.2°C [ENDO]';
              const tempColor = isSynth ? '#38bdf8' : '#f97316';
              window.HiveSystems?.vfx?.floatingText?.(h.x, 3.2, h.z, tempLabel, tempColor, false);
              window.HiveSystems?.vfx?.ring?.(h.x, h.z, isSynth ? 0x38bdf8 : 0xf97316, 1.8);
            }
          });
          const steamVents = stationMap?.steamVents || [];
          steamVents.forEach((sv) => {
            if (Math.hypot(sv.x - playerCreature.x, sv.z - playerCreature.z) < 24) {
              window.HiveSystems?.vfx?.floatingText?.(sv.x, 2.6, sv.z, '92.4°C [VAPEUR]', '#fde047', false);
            }
          });
        }
      }
    }
  }

  const visionSystem = new VisionSystem();

  // -------------------------------------------------------------
  // 5. ALARM SYSTEM
  // -------------------------------------------------------------
  class AlarmSystem {
    constructor() {
      this.level = 0;
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
    setLevel(level) {
      const prevLevel = this.level;
      this.level = Math.max(0, Math.min(5, level));
      this.updateUI();
      if (this.level >= 3 && prevLevel < 3) {
        audioManager.playMotherChime?.();
        audioManager.playAlarmSiren();
      } else if (this.level >= 3) {
        audioManager.playAlarmSiren();
      }
    }
    updateUI() {
      if (!this.alertTextElement) return;
      this.alertTextElement.textContent = this.levelNames[this.level];
      this.alertTextElement.className = `alert-level level-${this.level}`;
    }
  }

  const alarmSystem = new AlarmSystem();
  window.alarmSystem = alarmSystem;

  // -------------------------------------------------------------
  // 6. PHEROMONE SYSTEM
  // -------------------------------------------------------------
  class PheromoneSystem {
    constructor() {
      this.activeCommand = 'HUNT';
      this.commandZones = [];
      this.possessionMode = false;
      this.scentTrails = [];
      window.pheromoneSystem = this;
    }
    init() {
      const buttons = document.querySelectorAll('.rts-cmd-btn[data-cmd]');
      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          this.setCommand(btn.getAttribute('data-cmd'));
        });
      });
      const possessBtn = document.getElementById('btn-possess-mode');
      if (possessBtn) {
        possessBtn.addEventListener('click', () => this.togglePossessionMode());
      }
      const scentBtn = document.getElementById('btn-scent-trail');
      if (scentBtn) {
        scentBtn.addEventListener('click', () => {
          const x = playerCreature?.x || 0;
          const z = playerCreature?.z || 0;
          this.dropManualScent(x, z);
        });
      }
      this.updateUI();
    }
    setCommand(cmd) {
      if (!['HUNT', 'CAPTURE', 'DEFEND', 'INFEST', 'RUSH'].includes(cmd)) return;
      this.activeCommand = cmd;
      this.possessionMode = false;
      this.updateUI();
      if (cmd === 'RUSH') {
        audioManager.playXenoHiss();
        audioManager.playHeartbeat(1.4);
      } else {
        audioManager.playHeartbeat();
      }
    }
    togglePossessionMode() {
      this.possessionMode = !this.possessionMode;
      if (this.possessionMode) {
        audioManager.playXenoRoar();
      } else {
        this.activeCommand = 'HUNT';
      }
      this.updateUI();
    }
    updateUI() {
      document.querySelectorAll('.rts-cmd-btn').forEach((btn) => {
        const isPossessButton = btn.id === 'btn-possess-mode';
        const isActive = isPossessButton
          ? this.possessionMode
          : !this.possessionMode && btn.getAttribute('data-cmd') === this.activeCommand;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', String(isActive));
      });
    }
    addZone(zone) {
      this.commandZones.push(zone);
      while (this.commandZones.length > 12) {
        const expiredZone = this.commandZones.shift();
        if (expiredZone && expiredZone.mesh) rendererEngine.removeObject(expiredZone.mesh);
      }
    }
    clearZones() {
      for (const zone of this.commandZones) {
        if (zone.mesh) rendererEngine.removeObject(zone.mesh);
      }
      this.commandZones = [];
    }

    // Chantier 12 : Sentiers de phéromones olfactifs traçables
    dropScentPoint(x, z, duration = 40) {
      if (this.scentTrails.length > 30) {
        const oldest = this.scentTrails.shift();
        if (oldest?.mesh) rendererEngine.removeObject(oldest.mesh);
      }
      const ringGeo = new THREE.RingGeometry(0.12, 0.75, 8);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65
      });
      const mesh = new THREE.Mesh(ringGeo, ringMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, 0.03, z);
      rendererEngine.propsGroup.add(mesh);
      this.scentTrails.push({ x, z, timer: duration, maxTimer: duration, mesh });
    }

    dropManualScent(x, z) {
      this.dropScentPoint(x, z, 45);
      audioManager.playXenoHiss?.(x, z);
      window.HiveSystems?.vfx?.burst?.(x, z, 0x10b981, 14, 0.1, 1.2);
      window.HiveSystems?.vfx?.floatingText?.(x, 2.6, z, 'PISTE PHÉROMONES (+30% SPRINT) [N]', '#10b981', true);
      showToast('PISTE PHÉROMONES TRACÉE [N] : Accélération de sprint +30% le long du sentier de ruche.');
      appendSensorLog('[BIOLOGIE RUCHE] Sécrétion phéromonale de traque déposée. Vitesse décuplée pour les unités alliées.', 'bio');
    }

    getScentBonus(x, z, maxDist = 3.6) {
      for (const st of this.scentTrails) {
        if (Math.hypot(st.x - x, st.z - z) <= maxDist) return 1.30;
      }
      return 1.0;
    }

    update(deltaSeconds) {
      const safeDelta = Math.max(0, deltaSeconds);
      for (let i = this.scentTrails.length - 1; i >= 0; i--) {
        const st = this.scentTrails[i];
        st.timer -= safeDelta;
        if (st.mesh) {
          st.mesh.material.opacity = Math.max(0.1, (st.timer / st.maxTimer) * 0.65);
        }
        if (st.timer <= 0) {
          if (st.mesh) rendererEngine.removeObject(st.mesh);
          this.scentTrails.splice(i, 1);
        }
      }
    }

    reset() {
      this.clearZones();
      for (const st of this.scentTrails) {
        if (st.mesh) rendererEngine.removeObject(st.mesh);
      }
      this.scentTrails = [];
      this.activeCommand = 'HUNT';
      this.possessionMode = false;
      this.updateUI();
    }
  }

  const pheromoneSystem = new PheromoneSystem();

  // -------------------------------------------------------------
  // 7. ENVIRONMENT: ORIGINAL MNEMOSYNE REFINERY MAP
  // -------------------------------------------------------------
  class StationMap {
    constructor() {
      this.currentDeck = 'A';
      this.walls = [];
      this.colliders = [];
      this.blastDoors = [];
      this.acidCorrosions = [];
      this.depressurizationTimer = 0;
      this.evaAirlock = { x: 68, z: 0 };
      this.lockdownApplied = false;
      this.cryoPods = [];
      this.blackGooCanisters = [];
      this.waterPuddles = [];
      this.shipCat = null;
      this.selfDestructActive = false;
      this.selfDestructTimer = 0;
      this.selfDestructKlaxonTimer = 0;
      this.napalmBarrels = [];
      this.alphaContainmentCells = [];
      this.hiveCreepPatches = [];
      this.activeSwarmers = [];
    }

    buildMap() {
      const textureLoader = new THREE.TextureLoader();
      const prepareTexture = (texture, repeatX, repeatY) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(repeatX, repeatY);
        texture.encoding = THREE.sRGBEncoding;
        texture.anisotropy = Math.min(8, rendererEngine.renderer.capabilities.getMaxAnisotropy());
        return texture;
      };
      const floorTex = prepareTexture(
        textureLoader.load('assets/textures/industrial-panels.png', undefined, undefined, () => {}),
        12,
        12
      );
      const wallTex = prepareTexture(
        textureLoader.load('assets/textures/industrial-panels.png', undefined, undefined, () => {}),
        5,
        2
      );

      const floorMat = new THREE.MeshStandardMaterial({
        map: floorTex,
        color: 0x768195,
        roughness: 0.56,
        metalness: 0.72
      });
      const wallMat = new THREE.MeshStandardMaterial({
        map: wallTex,
        color: 0x596579,
        roughness: 0.48,
        metalness: 0.78
      });

      const floorGeo = new THREE.PlaneGeometry(160, 160);
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.receiveShadow = true;
      rendererEngine.mapGroup.add(floorMesh);

      const addWall = (x, z, width, height, depth) => {
        const wallGeo = new THREE.BoxGeometry(width, height, depth);
        const wallMesh = new THREE.Mesh(wallGeo, wallMat);
        wallMesh.position.set(x, height / 2, z);
        wallMesh.castShadow = true;
        wallMesh.receiveShadow = true;
        rendererEngine.mapGroup.add(wallMesh);
        this.walls.push(wallMesh);
        this.colliders.push({
          minX: x - width / 2 - 0.6,
          maxX: x + width / 2 + 0.6,
          minZ: z - depth / 2 - 0.6,
          maxZ: z + depth / 2 + 0.6
        });
      };

      const addProp = (x, z, w, h, d, color = 0x38bdf8, emissive = 0x0284c7, type = 'crate') => {
        let mesh = window.HiveModelFactory?.createIndustrialProp?.(type);
        if (mesh) {
          mesh.scale.set(Math.max(0.3, w / 4), Math.max(0.3, h / 4), Math.max(0.3, d / 4));
          mesh.position.set(x, 0, z);
          window.HiveModelFactory?.placeOnGround?.(mesh, 0);
        } else {
          const geo = new THREE.BoxGeometry(w, h, d);
          const mat = new THREE.MeshStandardMaterial({
            color,
            emissive,
            emissiveIntensity: 0.5,
            roughness: 0.32,
            metalness: 0.68
          });
          mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(x, h / 2, z);
        }
        mesh.traverse((child) => {
          if (!child.isMesh) return;
          child.castShadow = true;
          child.receiveShadow = true;
        });
        rendererEngine.propsGroup.add(mesh);
        this.colliders.push({
          minX: x - w / 2 - 0.6,
          maxX: x + w / 2 + 0.6,
          minZ: z - d / 2 - 0.6,
          maxZ: z + d / 2 + 0.6
        });
      };

      const detailMetal = new THREE.MeshStandardMaterial({
        color: 0x263246,
        roughness: 0.38,
        metalness: 0.9
      });
      const pipeMetal = new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.3,
        metalness: 0.88
      });
      const lightMaterial = new THREE.MeshStandardMaterial({
        color: 0xbdefff,
        emissive: 0x38bdf8,
        emissiveIntensity: 2.2,
        roughness: 0.18
      });

      const addCeilingBeam = (x, z, length, alongX = true) => {
        const beam = new THREE.Mesh(
          new THREE.BoxGeometry(alongX ? length : 0.45, 0.5, alongX ? 0.45 : length),
          detailMetal
        );
        beam.position.set(x, 8.4, z);
        beam.castShadow = true;
        rendererEngine.propsGroup.add(beam);
      };

      const addPipe = (x, z, length, alongX = true, height = 6.7) => {
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, length, 10), pipeMetal);
        pipe.rotation.z = alongX ? Math.PI / 2 : 0;
        if (!alongX) pipe.rotation.x = Math.PI / 2;
        pipe.position.set(x, height, z);
        pipe.castShadow = true;
        rendererEngine.propsGroup.add(pipe);
      };

      const addLightStrip = (x, z, length = 5, alongX = true, color = 0x38bdf8) => {
        const material = lightMaterial.clone();
        material.color.setHex(color);
        material.emissive.setHex(color);
        const strip = new THREE.Mesh(
          new THREE.BoxGeometry(alongX ? length : 0.16, 0.12, alongX ? 0.16 : length),
          material
        );
        strip.position.set(x, 7.9, z);
        rendererEngine.propsGroup.add(strip);
      };

      // =========================================================================
      // ARCHITECTURE AVANCÉE MNEMOSYNE — 6 SECTEURS INTERCONNECTÉS + EXTÉRIEUR EVA
      // =========================================================================

      // 1. Enceinte Principale de Sécurité
      addWall(0, -75, 150, 12, 2);
      addWall(0, 75, 150, 12, 2);
      addWall(-75, 0, 2, 12, 150);
      addWall(75, 0, 2, 12, 150);

      // 2. SECTEUR CRYO-STASE & LABORATOIRE MÉDICAL (Nord-Ouest : X -70 à -15, Z -70 à -25)
      addWall(-45, -25, 48, 10, 2); // Mur Sud Cryo
      addWall(-15, -48, 2, 10, 44); // Mur Est Cryo
      // Entrée Cryo : ouverture à X = -32, Z = -25
      addProp(-50, -50, 5, 3.5, 4, 0x0284c7, 0x0369a1, 'console'); // Sas stase
      addProp(-32, -58, 6, 2.5, 3, 0x10b981, 0x047857, 'console'); // Caissons cryogéniques
      addProp(-60, -38, 4, 3, 4, 0x38bdf8, 0x0284c7, 'crate');

      // 3. SECTEUR ARMURERIE & SÉCURITÉ WEYLAND-YUTANI (Nord-Est : X 15 à 70, Z -70 à -25)
      addWall(45, -25, 48, 10, 2); // Mur Sud Armurerie
      addWall(15, -48, 2, 10, 44); // Mur Ouest Armurerie
      // Entrée Armurerie : ouverture à X = 32, Z = -25
      addProp(50, -50, 4, 4, 5, 0xf59e0b, 0xd97706, 'crate'); // Rateliers d'armes
      addProp(34, -58, 5, 3, 3, 0xef4444, 0xb91c1c, 'console'); // Borne biométrique Kappa
      addProp(60, -38, 3, 6, 3, 0x475569, 0x000000, 'barrel');

      // 4. CORRIDOR CENTRAL & CARREFOUR NORD-SUD (X -15 à 15, Z -70 à 70)
      // Diviseurs de coursive et piliers porteurs
      addWall(-15, 0, 2, 10, 36);  // Cloison Ouest corridor
      addWall(15, 0, 2, 10, 36);   // Cloison Est corridor
      addProp(0, -15, 6, 8, 6, 0x0ea5e9, 0x0284c7, 'generator'); // Relais de distribution
      addProp(0, 15, 5, 7, 5, 0x0284c7, 0x0369a1, 'generator');

      // 5. SECTEUR DU RÉACTEUR & RAFFINERIE THERMIQUE (Sud-Ouest : X -70 à -15, Z 25 à 70)
      addWall(-45, 25, 48, 10, 2); // Mur Nord Réacteur
      addWall(-15, 48, 2, 10, 44); // Mur Est Réacteur
      addProp(-45, 45, 10, 7, 10, 0xf59e0b, 0xd97706, 'generator'); // Cœur réacteur Mantis
      addProp(-60, 56, 4, 6, 4, 0x475569, 0x000000, 'barrel');
      addProp(-32, 58, 5, 3, 3, 0x334155, 0x000000, 'console');

      // 6. NURSERIE DE LA RUCHE & HANGAR BIO-RÉSINE (Sud-Est : X 15 à 70, Z 25 à 70)
      addWall(45, 25, 48, 10, 2); // Mur Nord Nurserie
      addWall(15, 48, 2, 10, 44); // Mur Ouest Nurserie
      addProp(48, 48, 9, 5, 9, 0x581c87, 0x7e22ce, 'generator'); // Chambre de ponte
      addProp(62, 58, 4, 4, 4, 0x3b0764, 0x581c87, 'crate');
      addProp(34, 58, 4, 3, 4, 0x2e1065, 0x3b0764, 'crate');

      // 7. SAS DE DÉCOMPRESSION & PASSERELLE EXTÉRIEURE EVA (Est Extrême : X 56 à 74, Z -18 à 18)
      // Sas pressurisé avec двойные cloisons étanches
      addWall(56, -18, 20, 10, 2); // Cloison Nord Sas
      addWall(56, 18, 20, 10, 2);  // Cloison Sud Sas
      // Décoration passerelle extérieure métallique avec vue sur l'abîme spatial
      addProp(68, 0, 3, 2, 6, 0x06b6d4, 0x0891b2, 'console'); // Console de pressurisation
      addProp(71, -10, 2, 5, 2, 0x475569, 0x000000, 'barrel');
      addProp(71, 10, 2, 5, 2, 0x475569, 0x000000, 'barrel');

      // Dense industrial set dressing: beams, pipes, lights, crates, tanks and consoles.
      for (let offset = -60; offset <= 60; offset += 15) {
        addCeilingBeam(offset, 0, 140, false);
        addLightStrip(offset, -6, 5, false, offset % 30 === 0 ? 0xef4444 : 0x38bdf8);
      }
      for (let offset = -55; offset <= 55; offset += 22) {
        addPipe(offset, -66, 118, false, 6.5);
        addPipe(offset + 2.2, 66, 118, false, 7.1);
      }

      addProp(-60, -58, 4, 4, 4, 0x334155, 0x000000, 'crate');
      addProp(-54, -58, 3, 6, 3, 0x475569, 0x000000, 'barrel');
      addProp(58, -55, 5, 3, 3, 0x334155, 0x0284c7, 'console');
      addProp(58, 55, 4, 7, 4, 0x475569, 0x000000, 'barrel');
      addProp(-58, 55, 6, 2.5, 3, 0x334155, 0x000000, 'crate');
      addProp(18, 58, 3, 4, 3, 0x334155, 0x0284c7, 'console');
      addProp(61, 12, 3, 7, 3, 0x334155, 0x000000, 'vent');
      addProp(-61, -12, 3, 7, 3, 0x334155, 0x000000, 'vent');
      addProp(-18, -48, 3, 7, 3, 0x334155, 0x000000, 'vent');
      addProp(22, 48, 3, 7, 3, 0x334155, 0x000000, 'vent');

      this.vents = [
        { id: 'vent_nord', name: 'Conduit Cryo-Nord', x: -18, z: -48 },
        { id: 'vent_ouest', name: 'Conduit Ouest (Fret)', x: -61, z: -12 },
        { id: 'vent_est', name: 'Conduit Est (Sécurité)', x: 61, z: 12 },
        { id: 'vent_sud', name: 'Conduit Sud (Raffinerie)', x: 22, z: 48 },
        { id: 'vent_sas', name: 'Conduit Sas & Dépressurisation', x: 58, z: 0 }
      ];

      this.steamVents = [
        { x: -15, z: -18, timer: 1.5 },
        { x: 32, z: -10, timer: 4.8 },
        { x: -38, z: 24, timer: 3.2 },
        { x: 26, z: 32, timer: 6.0 },
        { x: 0, z: 5, timer: 2.2 },
        { x: 60, z: 2, timer: 4.0 }
      ];

      // Chantier 3 : Portes blindées hydrauliques sur les vraies jonctions de secteur
      // (ouvertes par défaut ; verrouillage de quarantaine KAPPA pendant l'Acte IV).
      this.blastDoors = [
        { id: 'door_cryo', name: 'Porte étanche Cryo-Stase', x: -18, z: -25, width: 5.6, height: 8, depth: 1.6, isWelded: false, weldHp: 100 },
        { id: 'door_armory', name: 'Blindage Armurerie KAPPA', x: 18, z: -25, width: 5.6, height: 8, depth: 1.6, isWelded: false, weldHp: 100 },
        { id: 'door_reactor', name: 'Écluse Réacteur', x: -18, z: 25, width: 5.6, height: 8, depth: 1.6, isWelded: false, weldHp: 100 },
        { id: 'door_nursery', name: 'Porte Hangar Sud-Est', x: 18, z: 25, width: 5.6, height: 8, depth: 1.6, isWelded: false, weldHp: 100 }
      ];
      this.blastDoors.forEach((door) => {
        const doorMat = new THREE.MeshStandardMaterial({
          color: 0x3f4a5c,
          emissive: 0xf59e0b,
          emissiveIntensity: 0.18,
          roughness: 0.42,
          metalness: 0.86
        });
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(door.width, door.height, door.depth), doorMat);
        // Bandes de danger jaune/noir Weyland-Yutani
        for (let stripe = 0; stripe < 3; stripe++) {
          const band = new THREE.Mesh(
            new THREE.BoxGeometry(door.width * 0.98, 0.35, door.depth + 0.04),
            new THREE.MeshStandardMaterial({ color: stripe % 2 ? 0x111111 : 0xeab308, roughness: 0.6 })
          );
          band.position.y = -door.height / 2 + 0.6 + stripe * 0.35;
          mesh.add(band);
        }
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        rendererEngine.mapGroup.add(mesh);
        door.mesh = mesh;
        door.isOpen = true;
        door.collider = {
          minX: door.x - door.width / 2 - 0.5,
          maxX: door.x + door.width / 2 + 0.5,
          minZ: door.z - door.depth / 2 - 0.5,
          maxZ: door.z + door.depth / 2 + 0.5
        };
        mesh.position.set(door.x, -door.height + 0.3, door.z);
      });
      this.lockdownApplied = false;

      // Chantier 15 : Caissons de stase cryogénique d'hypersommeil (Alien 1979 / Romulus)
      this.cryoPods = [
        { id: 'cryo_1', name: 'Caisson Stase Vickers', x: -48, z: -58, isBroken: false, sleeper: 'Dr. Katherine Vickers', mesh: null },
        { id: 'cryo_2', name: 'Caisson Stase Kane', x: -40, z: -58, isBroken: false, sleeper: 'Officier Thomas Kane', mesh: null },
        { id: 'cryo_3', name: 'Caisson Stase Lambert', x: -32, z: -58, isBroken: false, sleeper: 'Navigateur Joan Lambert', mesh: null }
      ];
      this.cryoPods.forEach((pod) => {
        const mesh = window.HiveModelFactory?.createIndustrialProp?.('cryopod');
        if (mesh) {
          mesh.position.set(pod.x, 0, pod.z);
          rendererEngine.propsGroup.add(mesh);
          pod.mesh = mesh;
        }
        this.colliders.push({
          minX: pod.x - 1.2, maxX: pod.x + 1.2,
          minZ: pod.z - 1.6, maxZ: pod.z + 1.6
        });
      });

      // Chantier 18 : Canisters de fluide pathogène mutagène noir Z-01 (Prometheus / Romulus)
      this.blackGooCanisters = [
        { id: 'goo_1', name: 'Canister Mutagène Z-01 [Alpha]', x: -56, z: -38, isBroken: false, mesh: null },
        { id: 'goo_2', name: 'Canister Mutagène Z-01 [Beta]', x: -38, z: -38, isBroken: false, mesh: null }
      ];
      this.blackGooCanisters.forEach((can) => {
        const mesh = window.HiveModelFactory?.createIndustrialProp?.('blackgoo');
        if (mesh) {
          mesh.position.set(can.x, 0, can.z);
          rendererEngine.propsGroup.add(mesh);
          can.mesh = mesh;
        }
      });

      // Chantier 17 : Flaques d'eau conductrices et arcs électriques (Deck C / Isolation)
      this.waterPuddles = [
        { x: -5, z: 12, radius: 3.2, sparking: true, sparkTimer: 2.5 },
        { x: 5, z: 24, radius: 2.8, sparking: false, sparkTimer: 0 },
        { x: -28, z: 42, radius: 3.5, sparking: true, sparkTimer: 1.8 }
      ];
      this.waterPuddles.forEach((puddle) => {
        const geo = new THREE.CircleGeometry(puddle.radius, 16);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          roughness: 0.08,
          metalness: 0.92,
          transparent: true,
          opacity: 0.65
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(puddle.x, 0.025, puddle.z);
        rendererEngine.propsGroup.add(mesh);
        puddle.mesh = mesh;
      });

      // Chantier 13 : Le Chat Jonesy & Faune de Bord (Alien 1979)
      this.shipCat = {
        x: 0,
        z: -6,
        targetX: 0,
        targetZ: -6,
        mesh: window.HiveModelFactory?.createCat?.(),
        state: 'roam',
        timer: 3.0,
        hissCooldown: 0,
        meowCooldown: 7.0,
        lastMarineReaction: 0
      };
      if (this.shipCat.mesh) {
        this.shipCat.mesh.position.set(this.shipCat.x, 0, this.shipCat.z);
        rendererEngine.propsGroup.add(this.shipCat.mesh);
      }

      // Chantier 22 : Relique Fossilisée du Space Jockey & Casque d'Ingénieur (Alien 1979)
      this.spaceJockey = {
        x: -62,
        z: 0,
        mesh: window.HiveModelFactory?.createSpaceJockeyRelic?.(),
        beaconCooldown: 4.0,
        loreDiscovered: false
      };
      if (this.spaceJockey.mesh) {
        this.spaceJockey.mesh.position.set(this.spaceJockey.x, 0, this.spaceJockey.z);
        rendererEngine.propsGroup.add(this.spaceJockey.mesh);
      }
      this.colliders.push({
        minX: this.spaceJockey.x - 3.2, maxX: this.spaceJockey.x + 3.2,
        minZ: this.spaceJockey.z - 3.2, maxZ: this.spaceJockey.z + 3.2
      });

      // Chantier 23 : Tourelles Automatiques UA 571-C Sentry Guns (Aliens 1986)
      this.sentryTurrets = [
        { id: 'sentry_a', name: 'Tourelle UA 571-C [A-Couloir Nord]', x: 0, z: -32, angle: Math.PI / 2, ammo: 500, maxAmmo: 500, hp: 120, maxHp: 120, burstCooldown: 0, target: null, mesh: null, isDestroyed: false },
        { id: 'sentry_b', name: 'Tourelle UA 571-C [B-Armurerie]', x: 22, z: -32, angle: Math.PI / 2, ammo: 500, maxAmmo: 500, hp: 120, maxHp: 120, burstCooldown: 0, target: null, mesh: null, isDestroyed: false }
      ];
      this.sentryTurrets.forEach((turret) => {
        const mesh = window.HiveModelFactory?.createUA571CTurret?.();
        if (mesh) {
          mesh.position.set(turret.x, 0, turret.z);
          mesh.rotation.y = turret.angle;
          rendererEngine.propsGroup.add(mesh);
          turret.mesh = mesh;
        }
        this.colliders.push({
          minX: turret.x - 1.0, maxX: turret.x + 1.0,
          minZ: turret.z - 1.0, maxZ: turret.z + 1.0
        });
      });

      // Chantier 25 : Navette de Sauvetage Narcissus & Sas d'Évacuation Orbitale (Alien 1979)
      this.narcissusShuttle = {
        x: 64,
        z: -35,
        mesh: window.HiveModelFactory?.createIndustrialProp?.('narcissus_dock'),
        evacActive: false,
        evacTimer: 30.0,
        escapedCount: 0
      };
      if (this.narcissusShuttle.mesh) {
        this.narcissusShuttle.mesh.position.set(this.narcissusShuttle.x, 0, this.narcissusShuttle.z);
        rendererEngine.propsGroup.add(this.narcissusShuttle.mesh);
      }
      this.colliders.push({
        minX: this.narcissusShuttle.x - 2.5, maxX: this.narcissusShuttle.x + 2.5,
        minZ: this.narcissusShuttle.z - 1.2, maxZ: this.narcissusShuttle.z + 1.2
      });

      // Chantier 26 : Émetteurs de Balise Ultrasonique Weyland-Yutani
      this.ultrasonicBeacons = [
        { id: 'beacon_1', x: 20, z: -10, hp: 50, mesh: null, isDestroyed: false, pulseCooldown: 1.5 }
      ];
      this.ultrasonicBeacons.forEach((beacon) => {
        const mesh = window.HiveModelFactory?.createIndustrialProp?.('ultrasonic');
        if (mesh) {
          mesh.position.set(beacon.x, 0, beacon.z);
          rendererEngine.propsGroup.add(mesh);
          beacon.mesh = mesh;
        }
      });

      // Chantier 28 : Stations Médicales Murales Medikit Weyland-Yutani
      this.medikits = [
        { id: 'med_cryo', name: 'Station Médicale Cryo', x: -42, z: -26, uses: 3, isSabotaged: false, mesh: null },
        { id: 'med_armory', name: 'Station Médicale Armurerie', x: 38, z: -26, uses: 3, isSabotaged: false, mesh: null },
        { id: 'med_corridor', name: 'Station Médicale Couloir Central', x: -16, z: 2, uses: 3, isSabotaged: false, mesh: null }
      ];
      this.medikits.forEach((med) => {
        const mesh = window.HiveModelFactory?.createIndustrialProp?.('medikit');
        if (mesh) {
          mesh.position.set(med.x, 0, med.z);
          rendererEngine.propsGroup.add(mesh);
          med.mesh = mesh;
        }
      });

      // Chantier 30 : Réservoirs de Carburant Cryogénique de Raffinerie (Détonation en Chaîne)
      this.fuelTanks = [
        { id: 'fuel_1', name: 'Cuve Cryogénique Mantis [Alpha]', x: -58, z: 60, hp: 60, maxHp: 60, isVenting: false, ventTimer: 0, isExploded: false, mesh: null },
        { id: 'fuel_2', name: 'Cuve Cryogénique Mantis [Beta]', x: -50, z: 62, hp: 60, maxHp: 60, isVenting: false, ventTimer: 0, isExploded: false, mesh: null }
      ];
      this.fuelTanks.forEach((tank) => {
        const mesh = window.HiveModelFactory?.createIndustrialProp?.('fuel_tank');
        if (mesh) {
          mesh.position.set(tank.x, 0, tank.z);
          rendererEngine.propsGroup.add(mesh);
          tank.mesh = mesh;
        }
        this.colliders.push({
          minX: tank.x - 1.4, maxX: tank.x + 1.4,
          minZ: tank.z - 1.4, maxZ: tank.z + 1.4
        });
      });

      // Chantier 31 : Sous-Niveau 3 Inondé & Bassin de Traitement des Eaux Usées (Aliens 1986 / Resurrection)
      this.floodedZone = {
        minX: -18, maxX: 18,
        minZ: 50, maxZ: 72,
        waterLevelY: 0.45,
        mesh: null
      };
      const waterGeo = new THREE.PlaneGeometry(36, 22);
      const waterMat = new THREE.MeshStandardMaterial({
        color: 0x0f2b3c,
        emissive: 0x0369a1,
        emissiveIntensity: 0.22,
        roughness: 0.08,
        metalness: 0.45,
        transparent: true,
        opacity: 0.72
      });
      const waterMesh = new THREE.Mesh(waterGeo, waterMat);
      waterMesh.rotation.x = -Math.PI / 2;
      waterMesh.position.set(0, 0.45, 61);
      rendererEngine.propsGroup.add(waterMesh);
      this.floodedZone.mesh = waterMesh;

      const pump1 = window.HiveModelFactory?.createIndustrialProp?.('water_pump');
      if (pump1) { pump1.position.set(-14, 0, 56); rendererEngine.propsGroup.add(pump1); }
      const pump2 = window.HiveModelFactory?.createIndustrialProp?.('water_pump');
      if (pump2) { pump2.position.set(14, 0, 66); rendererEngine.propsGroup.add(pump2); }

      // Chantier 32 : Section Laboratoire Zéro-Gravité & Orbes d'Acide en Lévitation (Alien: Romulus)
      this.zeroGZone = {
        minX: 42, maxX: 68,
        minZ: -16, maxZ: 16,
        active: true,
        humTimer: 2.5
      };
      this.floatingAcidOrbs = [];

      // Chantier 33 : Caméras de Sécurité Motorisées CRT Seegson / Weyland-Yutani (Alien: Isolation)
      this.securityCameras = [
        { id: 'cam_nord', name: 'Caméra Couloir Nord', x: 0, z: -22, baseAngle: Math.PI / 2, sweep: 0, state: 'idle', alertTimer: 0, mesh: null, isDestroyed: false },
        { id: 'cam_airlock', name: 'Caméra Sas Est EVA', x: 52, z: 0, baseAngle: 0, sweep: 0, state: 'idle', alertTimer: 0, mesh: null, isDestroyed: false },
        { id: 'cam_armory', name: 'Caméra Armurerie', x: 28, z: -45, baseAngle: Math.PI, sweep: 0, state: 'idle', alertTimer: 0, mesh: null, isDestroyed: false }
      ];
      this.securityCameras.forEach((cam) => {
        const mesh = window.HiveModelFactory?.createSecurityCamera?.();
        if (mesh) {
          mesh.position.set(cam.x, 3.8, cam.z);
          rendererEngine.propsGroup.add(mesh);
          cam.mesh = mesh;
        }
      });

      // Chantier 33 & 40 : Terminaux Muraux Seegson Interactifs (Alien: Isolation)
      this.seegsonTerminals = [
        { id: 'term_cryo', name: 'Terminal Seegson Médical', x: -44, z: -24, isHacked: false, mesh: null },
        { id: 'term_sec', name: 'Terminal Seegson Sécurité KAPPA', x: 42, z: -24, isHacked: false, mesh: null }
      ];
      this.seegsonTerminals.forEach((term) => {
        const mesh = window.HiveModelFactory?.createSeegsonTerminal?.();
        if (mesh) {
          mesh.position.set(term.x, 0, term.z);
          rendererEngine.propsGroup.add(mesh);
          term.mesh = mesh;
        }
      });

      // Chantier 35 : Pièges au Sol à Harpons Pneumatiques & Filet Électrifié (Alien 3 / Isolation)
      this.tripwireTraps = [
        { id: 'trap_reactor', name: 'Piège Confinement Réacteur', x: -18, z: 28, isArmed: true, mesh: null },
        { id: 'trap_fret', name: 'Piège Sas Fret Ouest', x: -55, z: -10, isArmed: true, mesh: null }
      ];
      this.tripwireTraps.forEach((trap) => {
        const mesh = window.HiveModelFactory?.createTripwireTrap?.();
        if (mesh) {
          mesh.position.set(trap.x, 0, trap.z);
          rendererEngine.propsGroup.add(mesh);
          trap.mesh = mesh;
        }
      });

      // Chantier 39 : Cocons Suspendus aux Poutrelles du Plafond (Aliens 1986)
      this.ceilingCocoons = [];

      // Chantier 42 : Sas de Dépressurisation d'Urgence & Éjection Spatiale (Alien 1979 / Romulus)
      this.depressurizationAirlock = {
        x: 64,
        z: 56,
        mesh: window.HiveModelFactory?.createDepressurizationAirlock?.(),
        isOpen: false,
        activeTimer: 0,
        sirenTimer: 0
      };
      if (this.depressurizationAirlock.mesh) {
        this.depressurizationAirlock.mesh.position.set(this.depressurizationAirlock.x, 0, this.depressurizationAirlock.z);
        rendererEngine.propsGroup.add(this.depressurizationAirlock.mesh);
      }
      this.colliders.push({
        minX: this.depressurizationAirlock.x - 2.0, maxX: this.depressurizationAirlock.x + 2.0,
        minZ: this.depressurizationAirlock.z - 0.8, maxZ: this.depressurizationAirlock.z + 0.8
      });

      // Chantier 43 : Sas Décontaminant avec Douches Chimiques (Alien 3 / Isolation)
      this.deconShower = {
        x: -8,
        z: -32,
        mesh: window.HiveModelFactory?.createDeconShowerArch?.(),
        sprayTimer: 0,
        cooldownTimer: 0
      };
      if (this.deconShower.mesh) {
        this.deconShower.mesh.position.set(this.deconShower.x, 0, this.deconShower.z);
        rendererEngine.propsGroup.add(this.deconShower.mesh);
      }

      // Chantier 47 : Demi-corps de Synthétique Décapité Rampant (Aliens 1986)
      this.bisectedAndroid = {
        x: -22,
        z: 4,
        mesh: window.HiveModelFactory?.createBisectedAndroid?.(),
        speed: 0.04,
        targetX: -16,
        targetZ: 2,
        isDestroyed: false,
        isExtracted: false,
        sparkTimer: 1.2
      };
      if (this.bisectedAndroid.mesh) {
        this.bisectedAndroid.mesh.position.set(this.bisectedAndroid.x, 0, this.bisectedAndroid.z);
        rendererEngine.propsGroup.add(this.bisectedAndroid.mesh);
      }

      // Chantier 48 : Éclairage Stroboscopique d'Urgence Alarme Rouge & Ombres Dynamiques
      this.emergencyKlaxons = [
        { x: 0, y: 4.5, z: 10, light: null, angle: 0 },
        { x: -30, y: 4.5, z: -20, light: null, angle: Math.PI }
      ];
      this.emergencyKlaxons.forEach((k) => {
        const pLight = new THREE.PointLight(0xef4444, 0, 18);
        pLight.position.set(k.x, k.y, k.z);
        rendererEngine.propsGroup.add(pLight);
        k.light = pLight;
      });

      // Chantier 46 : Système d'Extinction Automatique Gaz Halon & Asphyxie O2 (Alien: Isolation)
      this.halonSystem = {
        active: false,
        timer: 0,
        x: 0,
        z: 0,
        radius: 15,
        mesh: null
      };

      // Chantier 49 : Éventration de Planchers & Grilles de Sol (Aliens 1986 / Alien 3)
      this.subfloorGrates = [
        { id: 'grate_1', x: -12, z: 8, mesh: null },
        { id: 'grate_2', x: 18, z: -12, mesh: null },
        { id: 'grate_3', x: -2, z: 32, mesh: null }
      ];
      this.subfloorGrates.forEach((grate) => {
        const mesh = window.HiveModelFactory?.createSubfloorGrate?.();
        if (mesh) {
          mesh.position.set(grate.x, 0, grate.z);
          rendererEngine.propsGroup.add(mesh);
          grate.mesh = mesh;
        }
      });

      // Chantier 50 : Protocole d'Auto-Destruction de la Station & Compte à Rebours M.U.T.H.U.R.
      this.selfDestructSystem = {
        active: false,
        timer: 120,
        totalTime: 120,
        consoleX: -55,
        consoleZ: -55,
        triggered: false,
        beepTimer: 1.0
      };

      // Chantier 51 : Sacs de Spores Fongiques Pathogènes (Alien: Covenant 2017)
      this.sporePods = [
        { id: 'spore_1', x: -28, z: -38, mesh: null, isBurst: false, respawnTimer: 0 },
        { id: 'spore_2', x: -14, z: -44, mesh: null, isBurst: false, respawnTimer: 0 },
        { id: 'spore_3', x: -36, z: -26, mesh: null, isBurst: false, respawnTimer: 0 },
        { id: 'spore_4', x: -4, z: -48, mesh: null, isBurst: false, respawnTimer: 0 }
      ];
      this.sporePods.forEach((pod) => {
        const mesh = window.HiveModelFactory?.createSporePod?.();
        if (mesh) {
          mesh.position.set(pod.x, 0, pod.z);
          rendererEngine.propsGroup.add(mesh);
          pod.mesh = mesh;
        }
      });

      // Chantier 52 : Faux Échos Acoustiques sur le Radar M314 (Aliens 1986 / Isolation)
      this.falseEchoes = [];

      // Chantier 54 : Conduits de Vapeur & Vannes de Décharge Thermique (Alien 1979 / Aliens 1986)
      this.steamVents = [
        { id: 'steam_1', x: -16, z: -10, mesh: null, isRuptured: false, timer: 0 },
        { id: 'steam_2', x: 22, z: 12, mesh: null, isRuptured: false, timer: 0 },
        { id: 'steam_3', x: 8, z: -28, mesh: null, isRuptured: false, timer: 0 },
        { id: 'steam_4', x: 34, z: 28, mesh: null, isRuptured: false, timer: 0 }
      ];
      this.steamVents.forEach((vent) => {
        const mesh = window.HiveModelFactory?.createSteamPipeSystem?.();
        if (mesh) {
          mesh.position.set(vent.x, 0, vent.z);
          rendererEngine.propsGroup.add(mesh);
          vent.mesh = mesh;
        }
      });

      // Chantier 55 : Navette de Sauvetage Narcissus Weyland-Yutani amarrée au quai (Alien 1979)
      this.narcissusDocked = {
        x: -60,
        z: -50,
        mesh: window.HiveModelFactory?.createNarcissusShuttle?.(),
        evacActive: false,
        evacTimer: 120,
        escapedCount: 0
      };
      if (this.narcissusDocked.mesh) {
        this.narcissusDocked.mesh.position.set(this.narcissusDocked.x, 0, this.narcissusDocked.z);
        rendererEngine.propsGroup.add(this.narcissusDocked.mesh);
      }
      this.colliders.push({
        minX: this.narcissusDocked.x - 3.2, maxX: this.narcissusDocked.x + 3.2,
        minZ: this.narcissusDocked.z - 4.5, maxZ: this.narcissusDocked.z + 4.5
      });

      // Chantier 57 : Grenades à Impulsion Magnétique Polarisée actives (Aliens: Dark Descent)
      this.activeEMPGrenades = [];

      // Chantier 58 : Portes Hydrauliques Scellées par Barres de Renfort (Alien: Isolation)
      this.sealedHydraulicDoors = [
        { id: 'sealed_1', x: 32, z: 0, mesh: null, isPried: false, health: 180 },
        { id: 'sealed_2', x: -32, z: 24, mesh: null, isPried: false, health: 180 }
      ];
      this.sealedHydraulicDoors.forEach((door) => {
        const mesh = window.HiveModelFactory?.createSealedHydraulicDoor?.();
        if (mesh) {
          mesh.position.set(door.x, 0, door.z);
          rendererEngine.propsGroup.add(mesh);
          door.mesh = mesh;
        }
        this.colliders.push({
          minX: door.x - 2.2, maxX: door.x + 2.2,
          minZ: door.z - 0.6, maxZ: door.z + 0.6,
          isSealedDoor: true,
          doorRef: door
        });
      });

      // Chantier 60 : Nappes de Brume Cryogénique au Ras du Sol (Alien 1979)
      this.cryoMistZones = [
        { x: -20, z: 0, mesh: null, dripTimer: 3.5 },
        { x: 20, z: -10, mesh: null, dripTimer: 4.8 }
      ];
      this.cryoMistZones.forEach((mist) => {
        const mesh = window.HiveModelFactory?.createGroundCryoMist?.();
        if (mesh) {
          mesh.position.set(mist.x, 0.05, mist.z);
          rendererEngine.propsGroup.add(mesh);
          mist.mesh = mesh;
        }
      });

      // Chantier 66 : Cuve de Confinement Alpha & Sas Bio-Sécurité Euridice (Marvel Comics: Alien: Bloodlines)
      this.alphaContainmentCells = [
        { id: 'alpha_tank_1', x: -35, z: 45, mesh: null }
      ];
      this.alphaContainmentCells.forEach((tank) => {
        const mesh = window.HiveModelFactory?.createAlphaContainmentCell?.();
        if (mesh) {
          mesh.position.set(tank.x, 0, tank.z);
          rendererEngine.propsGroup.add(mesh);
          tank.mesh = mesh;
        }
        this.colliders.push({
          minX: tank.x - 2.4, maxX: tank.x + 2.4,
          minZ: tank.z - 2.4, maxZ: tank.z + 2.4
        });
      });

      // Chantier 68 : Barils de Carburant Napalm USCM Inflammables (Aliens 1986 / Isolation)
      this.napalmBarrels = [
        { id: 'barrel_1', x: -10, z: -25, mesh: null, isDetonated: false, fireTimer: 0 },
        { id: 'barrel_2', x: 28, z: 18, mesh: null, isDetonated: false, fireTimer: 0 },
        { id: 'barrel_3', x: -45, z: 15, mesh: null, isDetonated: false, fireTimer: 0 },
        { id: 'barrel_4', x: 12, z: 42, mesh: null, isDetonated: false, fireTimer: 0 }
      ];
      this.napalmBarrels.forEach((b) => {
        const mesh = window.HiveModelFactory?.createNapalmBarrel?.();
        if (mesh) {
          mesh.position.set(b.x, 0, b.z);
          rendererEngine.propsGroup.add(mesh);
          b.mesh = mesh;
        }
        this.colliders.push({
          minX: b.x - 0.7, maxX: b.x + 0.7,
          minZ: b.z - 0.7, maxZ: b.z + 0.7,
          isNapalmBarrel: true,
          barrelRef: b
        });
      });

      // Chantier 64 : Expansion Vivante de la Toile de Ruche "Hive Creep" (Marvel Comics)
      this.hiveCreepPatches = [
        { x: -20, z: -35, radius: 4.5, mesh: null },
        { x: 0, z: -30, radius: 4.5, mesh: null }
      ];
      this.hiveCreepPatches.forEach((patch) => {
        const mesh = window.HiveModelFactory?.createHiveCreepPatch?.();
        if (mesh) {
          mesh.position.set(patch.x, 0.04, patch.z);
          rendererEngine.propsGroup.add(mesh);
          patch.mesh = mesh;
        }
      });
    }

    setBlastDoorState(door, open, silent = false) {
      if (!door || door.isOpen === open) return false;
      if (!open) {
        // Ne jamais refermer une porte sur une entité (évite tout blocage dans le collider).
        const entities = [playerCreature, ...(window.gameInstance?.humans || []), ...(window.gameInstance?.currentStage?.rtsUnits || [])];
        const blocked = entities.some((ent) => ent && !ent.isDestroyed && Math.hypot(ent.x - door.x, ent.z - door.z) < 3.4);
        if (blocked) return false;
      }
      door.isOpen = open;
      if (door.mesh) door.mesh.position.y = open ? -door.height + 0.3 : door.height / 2;
      const idx = this.colliders.indexOf(door.collider);
      if (open && idx >= 0) this.colliders.splice(idx, 1);
      if (!open && idx < 0) this.colliders.push(door.collider);
      if (!silent) audioManager.playBlastDoorHydraulics?.(door.x, door.z);
      return true;
    }

    findClosestBlastDoor(x, z, maxDistance = 6) {
      let best = null;
      for (const door of this.blastDoors) {
        const distance = Math.hypot(door.x - x, door.z - z);
        if (distance <= maxDistance && (!best || distance < best.distance)) best = { door, distance };
      }
      return best;
    }

    // Canon Alien: Isolation / Alien 3 — le Xénomorphe force les portes à la seule force des griffes.
    pryBlastDoor(x, z) {
      const found = this.findClosestBlastDoor(x, z, 6);
      if (!found) {
        showToast('Aucune porte blindée à portée (6 m) [J].');
        return false;
      }
      const { door } = found;
      if (door.isOpen) {
        showToast(`${door.name} déjà ouverte.`);
        return false;
      }
      if (door.isWelded) {
        showToast(`${door.name} SOUDÉE AU PLASMA [Chantier 24] ! Utilisez le crachat acide [X] pour dissoudre les soudures ou contournez par les conduits [C] / plafond [Q].`);
        audioManager.playWelderSparks?.(door.x, door.z);
        window.HiveSystems?.vfx?.burst?.(door.x, door.z, 0xef4444, 15, 0.12, 1.2);
        window.HiveSystems?.vfx?.floatingText?.(door.x, 4.2, door.z, 'SOUDURE INTACTE', '#ef4444', true);
        return false;
      }
      this.setBlastDoorState(door, true);
      audioManager.playMetalImpact?.(door.x, door.z);
      rendererEngine.addScreenShake?.(0.3, 0.2);
      window.HiveSystems?.vfx?.burst?.(door.x, door.z, 0xf59e0b, 22, 0.14, 1.6);
      window.HiveSystems?.vfx?.floatingText?.(door.x, 4.2, door.z, 'PORTE FORCÉE', '#f59e0b', true);
      showToast(`${door.name} arrachée de ses vérins par les griffes du prédateur [J] !`);
      appendSensorLog(`[BRÈCHE] ${door.name} : vérins hydrauliques forcés. Confinement rompu.`, 'alert');
      return true;
    }

    // Chantier 24 : Système de Découpeur Plasma & Barricades / Soudures de Portes (Aliens 1986)
    meltDoorWeld(door) {
      if (!door || !door.isWelded) return false;
      door.weldHp -= 55;
      audioManager.playAcidSizzle?.();
      window.HiveSystems?.vfx?.burst?.(door.x, door.z, 0x84cc16, 25, 0.18, 1.5);
      if (door.weldHp <= 0) {
        door.isWelded = false;
        door.weldHp = 0;
        showToast(`SOUDURES FONDUES PAR L'ACIDE ! ${door.name} peut être forcée avec [J] !`);
        appendSensorLog(`[ACIDE] Soudures plasma de ${door.name} dissoutes par le sang acide.`, 'bio');
        window.HiveSystems?.vfx?.floatingText?.(door.x, 4.2, door.z, 'SOUDURE DISSOUTE !', '#84cc16', true);
      } else {
        showToast(`Soudures attaquées par l'acide : ${door.weldHp}% restant.`);
      }
      return true;
    }

    weldDoor(door, marineName = 'Marine') {
      if (!door || door.isWelded) return false;
      this.setBlastDoorState(door, false);
      door.isWelded = true;
      door.weldHp = 100;
      audioManager.playWelderSparks?.(door.x, door.z);
      window.HiveSystems?.vfx?.burst?.(door.x, door.z, 0x38bdf8, 20, 0.16, 1.4);
      showToast(`${marineName} A SOUDÉ ${door.name.toUpperCase()} AU CHALUMEAU PLASMA !`);
      appendSensorLog(`[BARRICADE] ${door.name} scellée et soudée au chalumeau à arc par les Marines.`, 'alert');
      return true;
    }

    // Chantier 5 : Le sang acide perce le pont (Alien 1979 — Kane / Ash percent trois ponts).
    addAcidCorrosion(x, z, radius = 1.8, duration = 12.0) {
      // Fusionne les impacts rapprochés pour éviter l'accumulation de maillages.
      const existing = this.acidCorrosions.find((corr) => Math.hypot(corr.x - x, corr.z - z) < corr.radius);
      if (existing) {
        existing.timer = Math.max(existing.timer, duration);
        return;
      }
      if (this.acidCorrosions.length >= 14) {
        const oldest = this.acidCorrosions.shift();
        if (oldest?.mesh) rendererEngine.removeObject(oldest.mesh);
      }
      const mesh = new THREE.Mesh(
        new THREE.RingGeometry(0.15, radius, 18),
        new THREE.MeshBasicMaterial({ color: 0x1a0f05, transparent: true, opacity: 0.78, side: THREE.DoubleSide })
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, 0.035, z);
      rendererEngine.propsGroup.add(mesh);
      this.acidCorrosions.push({ x, z, radius, timer: duration, maxTimer: duration, tick: 0, mesh });
    }

    // Chantier 15 : Dépressurisation et bris du caisson d'hypersommeil cryogénique
    shatterCryoPod(pod, instigator = null) {
      if (!pod || pod.isBroken) return false;
      pod.isBroken = true;
      audioManager.playGlassShatter(pod.x, pod.z);
      audioManager.playCryoVent(pod.x, pod.z);
      rendererEngine.addScreenShake?.(0.32, 0.2);
      window.HiveSystems?.vfx?.spawnSteamCloud?.(pod.x, 1.2, pod.z, 4.5);
      window.HiveSystems?.vfx?.burst?.(pod.x, pod.z, 0x38bdf8, 22, 0.16, 1.8);
      window.HiveSystems?.vfx?.floatingText?.(pod.x, 3.2, pod.z, 'GEL CRYOGÉNIQUE (-180°C)', '#38bdf8', true);
      showToast(`CAISSON DÉPRESSURISÉ ! ${pod.name} fracturé ! Vapeurs d'azote liquide libérées.`);
      appendSensorLog(`[CRYO-STASE] Rupture d'étanchéité sur ${pod.name}. Décharge d'azote liquide sous pression.`, 'alert');

      // Risque d'hypothermie pour toute entité dans un rayon de 4.2m
      const entities = [playerCreature, ...(window.gameInstance?.humans || []), ...(window.gameInstance?.currentStage?.rtsUnits || [])];
      entities.forEach((ent) => {
        if (!ent || ent.isDestroyed || ent.isIncapacitated) return;
        const dist = Math.hypot(ent.x - pod.x, ent.z - pod.z);
        if (dist <= 4.2) {
          ent.takeDamage?.(14);
          if (ent.staggerTimer !== undefined) ent.staggerTimer = 1.2;
          window.HiveSystems?.vfx?.floatingText?.(ent.x, 2.5, ent.z, '-14 HYPOTHERMIE', '#38bdf8', false);
        }
      });

      // Libération de l'occupant en stase comme hôte viable
      if (window.gameInstance && window.gameInstance.humans) {
        const hostId = 300 + Math.floor(Math.random() * 50);
        const host = new HumanAI(hostId, 'scientist', pod.x, pod.z + 1.2, pod.sleeper);
        host.hp = 65;
        host.maxHp = 65;
        host.staggerTimer = 2.5;
        host.createMesh();
        window.gameInstance.humans.push(host);
        showToast(`HÔTE VIABLE LIBÉRÉ : ${pod.sleeper} titube hors du caisson !`);
        appendSensorLog(`[HÔTE] ${pod.sleeper} extrait de cryo-stase. Métabolisme chaud rétabli.`, 'bio');
      }
      return true;
    }

    // Chantier 18 : Déversement du fluide mutagène noir Z-01
    shatterBlackGoo(canister, instigator = null) {
      if (!canister || canister.isBroken) return false;
      canister.isBroken = true;
      audioManager.playGlassShatter(canister.x, canister.z);
      rendererEngine.addScreenShake?.(0.3, 0.18);
      window.HiveSystems?.vfx?.burst?.(canister.x, canister.z, 0x020617, 34, 0.2, 2.5);
      window.HiveSystems?.vfx?.floatingText?.(canister.x, 3.2, canister.z, 'MUTAGÈNE NOIR Z-01 (+25 BIOMASSE)', '#a855f7', true);
      showToast('MUTAGÈNE Z-01 LIBÉRÉ : Nanoparticules pathogènes noires absorbées par la ruche (+25 Biomasse) !');
      appendSensorLog('[PATHOGÈNE Z-01] Fiole de mutagène noir brisée. Hybridation génétique et poussée de biomasse.', 'bio');

      if (window.gameInstance?.currentStage?.addBiomass) {
        window.gameInstance.currentStage.addBiomass(25);
      } else if (window.gameInstance?.currentStage?.biomass !== undefined) {
        window.gameInstance.currentStage.biomass += 25;
      }

      // Corruption des humains à portée
      (window.gameInstance?.humans || []).forEach((h) => {
        if (!h.isIncapacitated && Math.hypot(h.x - canister.x, h.z - canister.z) <= 4.5) {
          h.takeDamage?.(22);
          h.stress = 100;
          window.HiveSystems?.vfx?.floatingText?.(h.x, 2.6, h.z, 'INFECTION MUTAGÈNE', '#a855f7', true);
        }
      });
      return true;
    }

    // Chantier 16 : Autodestruction thermonucléaire MU/TH/UR 6000
    triggerSelfDestruct(countdown = 90) {
      if (this.selfDestructActive) return;
      this.selfDestructActive = true;
      this.selfDestructTimer = countdown;
      this.selfDestructKlaxonTimer = 0;
      audioManager.playSelfDestructKlaxon();
      showToast(`ALERTE MU/TH/UR 6000 : DÉTONATION THERMONUCLÉAIRE DANS ${countdown}s !`);
      appendSensorLog('[MU/TH/UR 6000] Séquence d’autodestruction finale engagée. Évacuation immédiate de la station.', 'alert');
      window.HiveSystems?.narrative?.('MU/TH/UR 6000', `ATTENTION. LE SYSTÈME DE REFROIDISSEMENT DU RÉACTEUR A ÉTÉ COUPÉ. DÉTONATION DANS T-MOINS ${countdown} SECONDES.`, 6000);
    }

    // Chantier 3 : Décompression réelle du sas EVA (Alien 1979 navette / Resurrection).
    triggerDecompression(duration = 9.0) {
      this.depressurizationTimer = duration;
      audioManager.playBlastDoorHydraulics?.(this.evaAirlock.x, this.evaAirlock.z);
      showToast('DÉCOMPRESSION DU SAS EVA : l’atmosphère est aspirée vers le vide spatial !');
      appendSensorLog('[SÉCURITÉ ORBITALE] Sas EVA ouvert sur le vide. Dégazage atmosphérique à haute vélocité.', 'alert');
    }

    toggleBlastDoor(doorId) {
      const door = this.blastDoors.find((d) => d.id === doorId);
      if (!door) return;
      this.setBlastDoorState(door, !door.isOpen);
      showToast(`${door.name} : Sas ${door.isOpen ? 'ouvert [Dérivation hydraulique]' : 'verrouillé'}.`);
    }

    update(deltaSeconds = 1 / 60) {
      const safeDelta = Math.max(0, deltaSeconds);
      this.updateSteamVents(safeDelta);

      // Verrouillage de quarantaine KAPPA : les portes se scellent pendant l'Acte IV (alerte >= 3).
      const stageIndex = window.gameInstance?.currentStageIndex || 0;
      const lockdownWanted = stageIndex === 4 && (window.alarmSystem?.level || 0) >= 3;
      if (lockdownWanted && !this.lockdownApplied) {
        let sealed = 0;
        this.blastDoors.forEach((door) => { if (this.setBlastDoorState(door, false, true)) sealed++; });
        if (sealed > 0) {
          this.lockdownApplied = true;
          audioManager.playBlastDoorHydraulics?.();
          showToast(`VERROUILLAGE DE QUARANTAINE : ${sealed} portes blindées scellées. Forcez-les avec [J].`);
          appendSensorLog('[KAPPA] Protocole de confinement : portes de secteur verrouillées.', 'alert');
        }
      } else if (!lockdownWanted && this.lockdownApplied) {
        this.lockdownApplied = false;
        this.blastDoors.forEach((door) => this.setBlastDoorState(door, true, true));
      }

      // Décompression : aspiration vers le sas, éjection unique dans le vide.
      if (this.depressurizationTimer > 0) {
        this.depressurizationTimer -= safeDelta;
        const sas = this.evaAirlock;
        (window.gameInstance?.humans || []).forEach((ent) => {
          if (!ent || ent.isIncapacitated || ent.isCocooned || ent.ejectedIntoVoid) return;
          if (['powerloader', 'exosuit'].includes(ent.type)) return; // trop lourds / bottes magnétiques
          const dist = Math.hypot(sas.x - ent.x, sas.z - ent.z);
          if (dist > 24 || dist < 0.01) return;
          const pull = (1 - dist / 24) * safeDelta * 9;
          const nextX = ent.x + ((sas.x - ent.x) / dist) * pull;
          const nextZ = ent.z + ((sas.z - ent.z) / dist) * pull;
          if (!this.checkCollision(nextX, nextZ)) {
            ent.x = nextX;
            ent.z = nextZ;
            ent.mesh?.position?.set(ent.x, 0, ent.z);
          }
          if (dist <= 4) {
            ent.ejectedIntoVoid = true;
            ent.takeDamage?.(ent.hp + 1);
            window.HiveSystems?.vfx?.floatingText?.(ent.x, 2.5, ent.z, 'ÉJECTÉ DANS LE VIDE', '#38bdf8', true);
            appendSensorLog(`[VIDE SPATIAL] ${ent.name} aspiré hors du sas EVA.`, 'alert');
          }
        });
        if (Math.random() < 0.2) window.HiveSystems?.vfx?.spawnSteamCloud?.(sas.x - 4, 1.8, sas.z, 3.2);
      }

      // Corrosion acide : brûlure par impulsions (0,5 s) sans figer les victimes.
      for (let i = this.acidCorrosions.length - 1; i >= 0; i--) {
        const corr = this.acidCorrosions[i];
        corr.timer -= safeDelta;
        corr.tick -= safeDelta;
        if (corr.mesh) corr.mesh.material.opacity = Math.max(0.08, (corr.timer / corr.maxTimer) * 0.78);
        if (corr.tick <= 0) {
          corr.tick = 0.5;
          (window.gameInstance?.humans || []).forEach((h) => {
            if (h.isIncapacitated || h.isCocooned || h.type === 'labrodent') return;
            if (Math.hypot(h.x - corr.x, h.z - corr.z) > corr.radius) return;
            h.takeDamage?.(8);
            window.HiveSystems?.vfx?.floatingText?.(h.x, 2.2, h.z, '-8 ACIDE AU SOL', '#39ff14', false);
          });
        }
        if (corr.timer <= 0) {
          if (corr.mesh) rendererEngine.removeObject(corr.mesh);
          this.acidCorrosions.splice(i, 1);
        }
      }

      // Chantier 13 : Mouvement et réactions du Chat Jonesy
      if (this.shipCat && this.shipCat.mesh) {
        const cat = this.shipCat;
        cat.hissCooldown -= safeDelta;
        cat.meowCooldown -= safeDelta;
        cat.timer -= safeDelta;

        const distToPlayer = Math.hypot(playerCreature.x - cat.x, playerCreature.z - cat.z);
        if (distToPlayer <= 6.2 && cat.hissCooldown <= 0) {
          cat.hissCooldown = 8.0;
          cat.state = 'flee';
          cat.timer = 4.0;
          audioManager.playCatHiss(cat.x, cat.z);
          window.HiveSystems?.vfx?.burst?.(cat.x, cat.z, 0xf59e0b, 10, 0.08, 0.8);
          window.HiveSystems?.vfx?.floatingText?.(cat.x, 1.2, cat.z, '*FEULEMENT DE TERREUR*', '#f59e0b', true);
          const fleeAngle = Math.atan2(cat.z - playerCreature.z, cat.x - playerCreature.x);
          cat.targetX = Math.max(-65, Math.min(65, cat.x + Math.cos(fleeAngle) * 8));
          cat.targetZ = Math.max(-65, Math.min(65, cat.z + Math.sin(fleeAngle) * 8));
        } else if (cat.meowCooldown <= 0 && cat.state !== 'flee') {
          cat.meowCooldown = 18.0 + Math.random() * 12.0;
          audioManager.playCatMeow(cat.x, cat.z);
          window.HiveSystems?.vfx?.floatingText?.(cat.x, 0.9, cat.z, 'Miaou...', '#fef3c7', false);
        }

        // Réaction des Marines face au chat : apaisement du stress
        (window.gameInstance?.humans || []).forEach((h) => {
          if (!h.isIncapacitated && ['marine', 'guard', 'commando'].includes(h.type)) {
            const distMarineCat = Math.hypot(h.x - cat.x, h.z - cat.z);
            if (distMarineCat <= 5.2 && distToPlayer > 12) {
              if (Date.now() - (cat.lastMarineReaction || 0) > 14000) {
                cat.lastMarineReaction = Date.now();
                h.stress = Math.max(0, (h.stress || 0) - 25);
                window.HiveSystems?.vfx?.floatingText?.(h.x, 2.8, h.z, "Fausse alerte, c'est juste le chat !", '#38bdf8', false);
              }
            }
          }
        });

        if (cat.timer <= 0 && cat.state !== 'flee') {
          cat.timer = 4.0 + Math.random() * 5.0;
          const rx = cat.x + (Math.random() * 10 - 5);
          const rz = cat.z + (Math.random() * 10 - 5);
          if (!this.checkCollision(rx, rz)) {
            cat.targetX = rx;
            cat.targetZ = rz;
          }
        }

        const catDist = Math.hypot(cat.targetX - cat.x, cat.targetZ - cat.z);
        if (catDist > 0.3) {
          const catSpeed = cat.state === 'flee' ? 0.16 : 0.05;
          const step = Math.min(catDist, catSpeed * safeDelta * 60);
          cat.x += ((cat.targetX - cat.x) / catDist) * step;
          cat.z += ((cat.targetZ - cat.z) / catDist) * step;
          cat.mesh.position.set(cat.x, 0, cat.z);
          cat.mesh.rotation.y = Math.atan2(cat.targetX - cat.x, cat.targetZ - cat.z);
        } else if (cat.state === 'flee') {
          cat.state = 'roam';
        }
      }

      // Chantier 17 : Flaques d'eau et Arcs Électriques Conducteurs
      if (this.waterPuddles) {
        this.waterPuddles.forEach((puddle) => {
          const walkingEntities = [playerCreature, ...(window.gameInstance?.humans || [])];
          walkingEntities.forEach((ent) => {
            if (!ent || ent.isIncapacitated || ent.isCocooned) return;
            const dist = Math.hypot(ent.x - puddle.x, ent.z - puddle.z);
            if (dist <= puddle.radius) {
              ent.puddleTimer = (ent.puddleTimer || 0) - safeDelta;
              if (ent.puddleTimer <= 0) {
                ent.puddleTimer = 0.45;
                audioManager.playWaterSplash(ent.x, ent.z);
                window.HiveSystems?.vfx?.burst?.(ent.x, ent.z, 0x38bdf8, 8, 0.06, 0.6);
              }
            }
          });

          // Arcs électriques sur flaques sous tension
          if (puddle.sparking) {
            puddle.sparkTimer -= safeDelta;
            if (puddle.sparkTimer <= 0) {
              puddle.sparkTimer = 2.8 + Math.random() * 1.8;
              audioManager.playElectricArc(puddle.x, puddle.z);
              rendererEngine.addScreenShake?.(0.18, 0.12);
              window.HiveSystems?.vfx?.burst?.(puddle.x, puddle.z, 0x38bdf8, 22, 0.16, 1.8);
              window.HiveSystems?.vfx?.ring?.(puddle.x, puddle.z, 0x38bdf8, puddle.radius);

              walkingEntities.forEach((ent) => {
                if (!ent || ent.isIncapacitated || ent.isCocooned) return;
                if (Math.hypot(ent.x - puddle.x, ent.z - puddle.z) <= puddle.radius) {
                  ent.takeDamage?.(16);
                  if (ent.staggerTimer !== undefined) ent.staggerTimer = 0.9;
                  window.HiveSystems?.vfx?.floatingText?.(ent.x, 2.6, ent.z, '-16 DÉCHARGE ÉLECTRIQUE', '#38bdf8', true);
                }
              });
            }
          }
        });
      }

      // Chantier 16 : Autodestruction de la Station & Minuteur MU/TH/UR 6000
      if (this.selfDestructActive) {
        this.selfDestructTimer -= safeDelta;
        this.selfDestructKlaxonTimer -= safeDelta;
        if (this.selfDestructKlaxonTimer <= 0) {
          this.selfDestructKlaxonTimer = 3.8;
          audioManager.playSelfDestructKlaxon();
          rendererEngine.addScreenShake?.(0.2, 0.15);
          window.HiveSystems?.vfx?.floatingText?.(playerCreature.x, 3.8, playerCreature.z, `AUTODESTRUCTION : T-MOINS ${Math.ceil(this.selfDestructTimer)}s`, '#ef4444', true);
        }
        if (this.selfDestructTimer <= 0) {
          this.selfDestructActive = false;
          window.gameInstance?.showEndModal?.(
            'ANNIHILATION THERMONUCLÉAIRE',
            'La station Mnemosyne a été entièrement vaporisée par la surcharge de ses réacteurs fusion.'
          );
        }
      }

      this.updateSpaceJockey(safeDelta);
      this.updateSentryTurrets(safeDelta);
      this.updateNarcissusShuttle(safeDelta);
      this.updateUltrasonicBeacons(safeDelta);
      this.updateCryoFuelTanks(safeDelta);
      this.updateFloodedZone(safeDelta);
      this.updateZeroGZone(safeDelta);
      this.updateSecurityCameras(safeDelta);
      this.updateTripwireTraps(safeDelta);
      this.updateCeilingCocoons(safeDelta);
      this.updateDepressurizationAirlock(safeDelta);
      this.updateDeconShower(safeDelta);
      this.updateBisectedAndroid(safeDelta);
      this.updateHalonSystem(safeDelta);
      this.updateEmergencyKlaxons(safeDelta);
      this.updateSelfDestructSystem(safeDelta);
      this.updateSporePods(safeDelta);
      this.updateSteamVents(safeDelta);
      this.updateFalseEchoes(safeDelta);
      this.updateEMPGrenades(safeDelta);
      this.updateCryoMistZones(safeDelta);
      this.updateNapalmBarrels(safeDelta);
      this.updateHiveCreep(safeDelta);
      this.updateSwarmers(safeDelta);
    }

    // Chantier 22 : Relique Fossilisée du Space Jockey & Casque d'Ingénieur (Alien 1979)
    updateSpaceJockey(safeDelta) {
      if (!this.spaceJockey) return;
      const sj = this.spaceJockey;
      const dist = Math.hypot(playerCreature.x - sj.x, playerCreature.z - sj.z);
      if (dist <= 10.5) {
        sj.beaconCooldown -= safeDelta;
        if (sj.beaconCooldown <= 0) {
          sj.beaconCooldown = 6.0;
          audioManager.playDerelictSignal?.(sj.x, sj.z);
          window.HiveSystems?.vfx?.ring?.(sj.x, sj.z, 0xd97706, 9.5);
          if (playerCreature.health < playerCreature.maxHealth) {
            playerCreature.health = Math.min(playerCreature.maxHealth, playerCreature.health + 6);
            window.HiveSystems?.vfx?.floatingText?.(playerCreature.x, 2.5, playerCreature.z, '+6 RÉGÉNÉRATION ANCESTRALE', '#d97706', false);
          }
          if (!sj.loreDiscovered) {
            sj.loreDiscovered = true;
            showToast("RELIQUE DU SPACE JOCKEY : La carcasse de l'Ingénieur résonne du signal Derelict (+Régénération).");
            appendSensorLog("[RELIC 1979] Siège de navigation stellaire fossilisé. Cage thoracique explosée de l'intérieur.", 'bio');
          }
        }
      }
    }

    // Chantier 23 : Tourelles Automatiques UA 571-C Sentry Guns (Aliens 1986)
    updateSentryTurrets(safeDelta) {
      if (!this.sentryTurrets) return;
      for (const turret of this.sentryTurrets) {
        if (turret.isDestroyed || turret.ammo <= 0) continue;
        turret.burstCooldown = Math.max(0, turret.burstCooldown - safeDelta);

        if (playerCreature.isInVent || playerCreature.isCeilingProwling) continue;

        const dist = Math.hypot(playerCreature.x - turret.x, playerCreature.z - turret.z);
        if (dist > 16.5) continue;

        const targetAngle = Math.atan2(playerCreature.x - turret.x, playerCreature.z - turret.z);
        const diff = Math.abs((((targetAngle - turret.angle) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI);

        if (diff <= Math.PI * 0.35 && this.hasLineOfSight(turret.x, turret.z, playerCreature.x, playerCreature.z)) {
          if (turret.mesh) {
            const head = turret.mesh.getObjectByName('turret_swivel_head');
            if (head) head.rotation.y = targetAngle - turret.angle;
          }
          if (turret.burstCooldown <= 0) {
            turret.burstCooldown = 0.22;
            const rounds = Math.min(turret.ammo, 6);
            turret.ammo -= rounds;
            audioManager.playSentryBurst?.(turret.x, turret.z);
            rendererEngine.addScreenShake?.(0.12, 0.08);
            window.HiveSystems?.vfx?.burst?.(turret.x, turret.z, 0xf59e0b, 12, 0.1, 0.8);
            window.HiveSystems?.vfx?.beam?.(turret.x, 0.95, turret.z, playerCreature.x, 1.2, playerCreature.z, 0xef4444);

            playerCreature.takeDamage?.(12, turret);
            window.HiveSystems?.vfx?.floatingText?.(playerCreature.x, 2.2, playerCreature.z, `-12 MITRAILLEUSE UA 571-C (${turret.ammo})`, '#ef4444', true);

            if (turret.ammo <= 0) {
              showToast(`${turret.name} : MUNITIONS ÉPUISÉES (000 CART.) ! Clac d'enrayement.`);
              audioManager.playSyntheticGlitchedVoice?.(turret.x, turret.z);
              window.HiveSystems?.vfx?.floatingText?.(turret.x, 1.8, turret.z, '000 RDS - EMPTY', '#ef4444', true);
            }
          }
        }
      }
    }

    // Chantier 25 : Navette de Sauvetage Narcissus & Sas d'Évacuation Orbitale (Alien 1979)
    updateNarcissusShuttle(safeDelta) {
      if (!this.narcissusShuttle) return;
      const shuttle = this.narcissusShuttle;
      const alarmLvl = window.alarmSystem?.level || 0;
      if (alarmLvl >= 4 && !shuttle.evacActive) {
        shuttle.evacActive = true;
        showToast("ÉVACUATION D'URGENCE : La navette NARCISSUS arme son sas d'éjection au quai Est !");
        appendSensorLog("[NARCISSUS] Ordre d'évacuation générale. Sas sous pression active.", 'alert');
      }
      if (shuttle.evacActive) {
        shuttle.evacTimer -= safeDelta;
        const humans = window.gameInstance?.humans || [];
        humans.forEach((h) => {
          if (h.isIncapacitated || h.isCocooned || h.isEscaped) return;
          if (['synthetic', 'android'].includes(h.type)) return;
          const dist = Math.hypot(h.x - shuttle.x, h.z - shuttle.z);
          if (dist <= 3.8) {
            h.isEscaped = true;
            h.isIncapacitated = true;
            if (h.mesh) rendererEngine.removeObject(h.mesh);
            shuttle.escapedCount++;
            showToast(`${h.name} a réussi à monter à bord de la Narcissus !`);
            appendSensorLog(`[ÉVACUATION] Survivant ${h.name} monté à bord de la navette.`, 'alert');
          }
        });
      }
    }

    // Chantier 26 : Émetteur de Sonde Sonore / Balise Ultrasonique Weyland-Yutani
    updateUltrasonicBeacons(safeDelta) {
      if (!this.ultrasonicBeacons) return;
      playerCreature.isSlowedByBeacon = false;
      for (const beacon of this.ultrasonicBeacons) {
        if (beacon.isDestroyed) continue;
        beacon.pulseCooldown -= safeDelta;
        const dist = Math.hypot(playerCreature.x - beacon.x, playerCreature.z - beacon.z);
        if (dist <= 11) {
          playerCreature.isSlowedByBeacon = true;
          if (beacon.pulseCooldown <= 0) {
            beacon.pulseCooldown = 2.4;
            audioManager.playUltrasonicPulse?.(beacon.x, beacon.z);
            window.HiveSystems?.vfx?.ring?.(beacon.x, beacon.z, 0x38bdf8, 10.5);
            rendererEngine.addScreenShake?.(0.08, 0.1);
            showToast('BROUILLAGE ULTRASONIQUE ENNEMI : Vitesse réduite (-25%). Détruisez la balise [1 / X] !');
          }
        }
      }
    }

    // Chantier 30 : Réservoirs de Carburant Cryogénique de Raffinerie (Détonation en Chaîne)
    updateCryoFuelTanks(safeDelta) {
      if (!this.fuelTanks) return;
      for (const tank of this.fuelTanks) {
        if (tank.isExploded) continue;
        if (tank.isVenting) {
          tank.ventTimer -= safeDelta;
          window.HiveSystems?.vfx?.spawnSteamCloud?.(tank.x, 2.5, tank.z, 2.5);
          if (tank.ventTimer <= 0) {
            tank.isExploded = true;
            audioManager.playCryoDetonation?.(tank.x, tank.z);
            rendererEngine.addScreenShake?.(0.65, 0.45);
            window.HiveSystems?.vfx?.burst?.(tank.x, tank.z, 0x38bdf8, 45, 0.35, 3.2);
            window.HiveSystems?.vfx?.ring?.(tank.x, tank.z, 0x38bdf8, 12);
            if (tank.mesh) rendererEngine.removeObject(tank.mesh);

            const blastEntities = [playerCreature, ...(window.gameInstance?.humans || [])];
            blastEntities.forEach((ent) => {
              if (!ent || ent.isIncapacitated || ent.isCocooned) return;
              const d = Math.hypot(ent.x - tank.x, ent.z - tank.z);
              if (d <= 12) {
                const blastDmg = Math.round(90 * (1 - d / 12));
                ent.takeDamage?.(blastDmg);
                if (ent.staggerTimer !== undefined) ent.staggerTimer = 1.4;
                window.HiveSystems?.vfx?.floatingText?.(ent.x, 3.2, ent.z, `-${blastDmg} DÉFLAGRATION CRYOGÉNIQUE !`, '#38bdf8', true);
              }
            });
            showToast('DÉTONATION CRYOGÉNIQUE CATACLYSMIQUE ! Le secteur réacteur est éventré !');
            appendSensorLog('[EXPLOSION] Réservoir cryogénique Mantis pulvérisé. Brèche colossale.', 'alert');
          }
        }
      }
    }

    isInFloodedZone(x, z) {
      if (!this.floodedZone) return false;
      return x >= this.floodedZone.minX && x <= this.floodedZone.maxX &&
             z >= this.floodedZone.minZ && z <= this.floodedZone.maxZ;
    }

    isInZeroGZone(x, z) {
      if (!this.zeroGZone || !this.zeroGZone.active) return false;
      return x >= this.zeroGZone.minX && x <= this.zeroGZone.maxX &&
             z >= this.zeroGZone.minZ && z <= this.zeroGZone.maxZ;
    }

    // Chantier 31 : Mise à jour de la zone inondée Sub-Level 3 (Aliens 1986 / Resurrection)
    updateFloodedZone(safeDelta) {
      if (!this.floodedZone) return;
      const entities = [playerCreature, ...(window.gameInstance?.humans || [])];
      entities.forEach((ent) => {
        if (!ent || ent.isIncapacitated || ent.isCocooned) return;
        if (this.isInFloodedZone(ent.x, ent.z)) {
          ent.isInWater = true;
          ent.waterSplashTimer = (ent.waterSplashTimer || 0) - safeDelta;
          if (ent.waterSplashTimer <= 0) {
            ent.waterSplashTimer = 0.55;
            audioManager.playWaterSplashHeavy?.(ent.x, ent.z);
            window.HiveSystems?.vfx?.burst?.(ent.x, ent.z, 0x0284c7, 10, 0.08, 0.8);
          }
        } else {
          ent.isInWater = false;
        }
      });
    }

    // Chantier 32 : Mise à jour de la gravité zéro & orbes d'acide flottantes (Alien: Romulus)
    spawnFloatingAcidOrb(x, y, z) {
      if (!this.zeroGZone || !this.zeroGZone.active) return;
      const orbMat = new THREE.MeshStandardMaterial({
        color: 0x39ff14,
        emissive: 0x22c55e,
        emissiveIntensity: 1.8,
        roughness: 0.1,
        transparent: true,
        opacity: 0.85
      });
      const orbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), orbMat);
      orbMesh.position.set(x, y || 1.8, z);
      rendererEngine.propsGroup.add(orbMesh);
      this.floatingAcidOrbs.push({
        mesh: orbMesh,
        x, y: y || 1.8, z,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 0.6,
        vz: (Math.random() - 0.5) * 1.2,
        lifetime: 14.0
      });
    }

    updateZeroGZone(safeDelta) {
      if (!this.zeroGZone || !this.zeroGZone.active) return;
      this.zeroGZone.humTimer -= safeDelta;
      if (this.zeroGZone.humTimer <= 0) {
        this.zeroGZone.humTimer = 5.0;
        if (this.isInZeroGZone(playerCreature.x, playerCreature.z)) {
          audioManager.playZeroGHum?.(playerCreature.x, playerCreature.z);
        }
      }

      // Dérive inertielle des orbes d'acide en lévitation (Alien: Romulus)
      for (let i = this.floatingAcidOrbs.length - 1; i >= 0; i--) {
        const orb = this.floatingAcidOrbs[i];
        orb.lifetime -= safeDelta;
        orb.x += orb.vx * safeDelta;
        orb.y += orb.vy * safeDelta;
        orb.z += orb.vz * safeDelta;
        if (orb.y < 0.6) { orb.y = 0.6; orb.vy = -orb.vy * 0.8; }
        if (orb.y > 4.5) { orb.y = 4.5; orb.vy = -orb.vy * 0.8; }
        orb.mesh.position.set(orb.x, orb.y, orb.z);

        // Collision orbe d'acide avec entités
        const testEntities = [playerCreature, ...(window.gameInstance?.humans || [])];
        testEntities.forEach((ent) => {
          if (!ent || ent.isIncapacitated || ent.isCocooned) return;
          const d = Math.hypot(ent.x - orb.x, ent.z - orb.z);
          const dy = Math.abs((ent.y || 1.0) - orb.y);
          if (d <= 0.8 && dy <= 1.2) {
            ent.takeDamage?.(18);
            audioManager.playAcidSizzle?.(orb.x, orb.z);
            window.HiveSystems?.vfx?.burst?.(orb.x, orb.z, 0x39ff14, 18, 0.14, 1.4);
            window.HiveSystems?.vfx?.floatingText?.(ent.x, 2.5, ent.z, '-18 BRÛLURE ACIDE EN APESANTEUR', '#39ff14', true);
            orb.lifetime = 0;
          }
        });

        if (orb.lifetime <= 0) {
          if (orb.mesh) rendererEngine.removeObject(orb.mesh);
          this.floatingAcidOrbs.splice(i, 1);
        }
      }
    }

    // Chantier 33 : Caméras de Sécurité Motorisées CRT Seegson / Weyland-Yutani (Alien: Isolation)
    updateSecurityCameras(safeDelta) {
      if (!this.securityCameras) return;
      this.securityCameras.forEach((cam) => {
        if (cam.isDestroyed || !cam.mesh) return;
        cam.sweep += safeDelta * 0.65;
        const currentAngle = cam.baseAngle + Math.sin(cam.sweep) * 0.75;
        cam.mesh.rotation.y = currentAngle;

        // Cône de vision de 11 mètres, ouverture 45 degrés
        const dx = playerCreature.x - cam.x;
        const dz = playerCreature.z - cam.z;
        const dist = Math.hypot(dx, dz);
        if (dist <= 11 && !playerCreature.isInVent && !playerCreature.isCeilingProwling) {
          const angleToPlayer = Math.atan2(dx, dz);
          const angleDiff = Math.abs((((angleToPlayer - currentAngle) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
          if (angleDiff <= 0.45) {
            cam.alertTimer = (cam.alertTimer || 0) + safeDelta;
            if (cam.alertTimer >= 0.8 && cam.state !== 'alert') {
              cam.state = 'alert';
              audioManager.playSecurityAlarmBeep?.(cam.x, cam.z);
              window.HiveSystems?.vfx?.ring?.(cam.x, cam.z, 0xef4444, 9.0);
              showToast(`ALERTE CAMÉRA : ${cam.name} a détecté l'organisme !`);
              window.alarmSystem?.setLevel(Math.max((window.alarmSystem.level || 0), 3));

              // Alerte les patrouilles les plus proches vers la caméra
              (window.gameInstance?.humans || []).forEach((h) => {
                if (['guard', 'marine', 'synthetic'].includes(h.type) && !h.isIncapacitated) {
                  h.aiState = 'CHASE';
                  h.targetPos = { x: cam.x, z: cam.z };
                }
              });
            }
          } else {
            cam.alertTimer = Math.max(0, (cam.alertTimer || 0) - safeDelta * 0.5);
            if (cam.alertTimer <= 0) cam.state = 'idle';
          }
        }
      });
    }

    // Chantier 35 : Pièges au Sol à Harpons Pneumatiques & Filet Électrifié (Alien 3 / Isolation)
    updateTripwireTraps(safeDelta) {
      if (!this.tripwireTraps) return;
      this.tripwireTraps.forEach((trap) => {
        if (!trap.isArmed) return;
        const dist = Math.hypot(playerCreature.x - trap.x, playerCreature.z - trap.z);
        if (dist <= 1.4 && !playerCreature.isInVent && !playerCreature.isCeilingProwling) {
          trap.isArmed = false;
          audioManager.playElectricArc?.(trap.x, trap.z);
          rendererEngine.addScreenShake?.(0.4, 0.25);
          window.HiveSystems?.vfx?.burst?.(trap.x, trap.z, 0x38bdf8, 30, 0.2, 1.8);
          playerCreature.takeDamage?.(25);
          playerCreature.staggerTimer = 2.5;
          window.HiveSystems?.vfx?.floatingText?.(playerCreature.x, 2.5, playerCreature.z, 'PIÉGÉ ! HARPON ÉLECTRIQUE (-25)', '#38bdf8', true);
          showToast('PIÈGE WEYLAND-YUTANI : Filet électrifié déployé ! Mobilité bloquée 2.5s !');
          if (trap.mesh) {
            trap.mesh.position.y = -0.5;
          }
        }
      });
    }

    // Chantier 39 : Cocons Organiques Suspendus aux Poutrelles du Plafond (Aliens 1986)
    hangCeilingCocoon(host) {
      const mesh = window.HiveModelFactory?.createCeilingCocoon?.();
      const cocoon = {
        x: playerCreature.x,
        y: 4.8,
        z: playerCreature.z,
        mesh,
        hostName: host ? host.name : 'Sujet Inconnu',
        incubationProgress: 0,
        isHatches: false
      };
      if (mesh) {
        mesh.position.set(cocoon.x, 2.0, cocoon.z);
        rendererEngine.propsGroup.add(mesh);
      }
      this.ceilingCocoons.push(cocoon);
      showToast(`COCON AÉRIEN CRÉÉ : ${cocoon.hostName} emmuré en hauteur dans la nurserie suspendue !`);
      appendSensorLog(`[RÉSINE] Hôte fixé sous les arches du plafond. Sécurité absolue.`, 'bio');
      return cocoon;
    }

    updateCeilingCocoons(safeDelta) {
      if (!this.ceilingCocoons) return;
      this.ceilingCocoons.forEach((cocoon) => {
        if (cocoon.isHatches) return;
        cocoon.incubationProgress += safeDelta * 2.5;
        if (cocoon.incubationProgress >= 100 && !cocoon.isHatches) {
          cocoon.isHatches = true;
          audioManager.playWetImpact?.(cocoon.x, cocoon.z);
          window.HiveSystems?.vfx?.burst?.(cocoon.x, cocoon.z, 0xef4444, 25, 0.2, 1.8);
          window.HiveSystems?.vfx?.floatingText?.(cocoon.x, 3.5, cocoon.z, 'ÉMERGENCE CHESTBURSTER AÉRIEN !', '#ef4444', true);
          if (window.gameInstance?.currentStage?.spawnChestburster) {
            window.gameInstance.currentStage.spawnChestburster(cocoon.x, cocoon.z);
          }
        }
      });
    }

    // Chantier 40 : Mini-Jeu Hack Décodeur Cybernétique Weyland-Yutani (Alien: Isolation)
    hackSeegsonTerminal(term) {
      if (!term || term.isHacked) return;
      term.isHacked = true;
      audioManager.playTunerHackBeep?.(term.x, term.z);
      window.HiveSystems?.vfx?.burst?.(term.x, term.z, 0xf59e0b, 16, 0.1, 1.2);
      window.HiveSystems?.vfx?.floatingText?.(term.x, 2.5, term.z, 'TERMINAL SEEGSON PIRATÉ !', '#f59e0b', true);

      // Désactive toutes les caméras de sécurité pendant 45 secondes
      this.securityCameras.forEach((c) => {
        c.isDestroyed = true;
        if (c.mesh) rendererEngine.removeObject(c.mesh);
      });
      showToast('HACK DECODEUR RÉUSSI : Réseau de caméras Seegson neutralisé sur tout le secteur !');
      appendSensorLog(`[HACK] Protocoles de sécurité Seegson bypassés. Caméras hors service.`, 'alert');
    }

    // Chantier 42 : Dépressurisation d'Urgence du Sas (Alien 1979 / Romulus)
    triggerDepressurizationAirlock() {
      if (!this.depressurizationAirlock) return;
      this.depressurizationAirlock.isOpen = true;
      this.depressurizationAirlock.activeTimer = 10.0;
      this.depressurizationAirlock.sirenTimer = 0;
      audioManager.playDecompressionSiren?.(this.depressurizationAirlock.x, this.depressurizationAirlock.z);
      audioManager.playVacuumWhoosh?.(this.depressurizationAirlock.x, this.depressurizationAirlock.z);
      rendererEngine.addScreenShake?.(0.38, 0.3);
      window.HiveSystems?.vfx?.burst?.(this.depressurizationAirlock.x, this.depressurizationAirlock.z, 0x0284c7, 35, 0.3, 2.5);
      showToast("DÉPRESSURISATION D'URGENCE DU SAS [Y] : Décompression brutale vers le vide spatial !");
      appendSensorLog("[SAS DECOMPRESSION] Aspiration sous vide en cours. Ancrez-vous aux caillebotis !", "alert");
    }

    updateDepressurizationAirlock(safeDelta) {
      if (!this.depressurizationAirlock || this.depressurizationAirlock.activeTimer <= 0) return;
      const airlock = this.depressurizationAirlock;
      airlock.activeTimer -= safeDelta;
      airlock.sirenTimer -= safeDelta;
      if (airlock.sirenTimer <= 0) {
        airlock.sirenTimer = 1.8;
        audioManager.playDecompressionSiren?.(airlock.x, airlock.z);
        audioManager.playVacuumWhoosh?.(airlock.x, airlock.z);
        rendererEngine.addScreenShake?.(0.18, 0.12);
        window.HiveSystems?.vfx?.burst?.(airlock.x, airlock.z, 0x38bdf8, 18, 0.15, 1.8);
      }

      // Aspiration physique de toutes les entités dans le secteur Sud-Est vers le sas
      const sectorEntities = [playerCreature, ...(window.gameInstance?.humans || [])];
      sectorEntities.forEach((ent) => {
        if (!ent || ent.isIncapacitated || ent.isCocooned || ent.isEscaped) return;
        if (ent.x >= 40 && ent.x <= 68 && ent.z >= 35 && ent.z <= 68) {
          const dist = Math.hypot(airlock.x - ent.x, airlock.z - ent.z);
          const dirX = (airlock.x - ent.x) / (dist || 1);
          const dirZ = (airlock.z - ent.z) / (dist || 1);

          if (ent === playerCreature) {
            // Le xénomorphe résiste en plantant ses griffes s'il est au sol ou suspendu
            if (!playerCreature.isCeilingProwling && !playerCreature.isProwling) {
              playerCreature.x += dirX * 6.5 * safeDelta;
              playerCreature.z += dirZ * 6.5 * safeDelta;
            }
          } else {
            // Humains aspirés vers le sas
            ent.x += dirX * 13.5 * safeDelta;
            ent.z += dirZ * 13.5 * safeDelta;
            ent.stress = 100;
            if (dist <= 2.2) {
              ent.takeDamage?.(120);
              window.HiveSystems?.vfx?.burst?.(ent.x, ent.z, 0xef4444, 25, 0.2, 1.8);
              window.HiveSystems?.vfx?.floatingText?.(ent.x, 2.5, ent.z, 'ÉJECTÉ DANS L\'ESPACE (VIDE 1:1) !', '#38bdf8', true);
            }
          }
        }
      });
    }

    // Chantier 43 : Sas Décontaminant avec Douches Chimiques (Alien 3 / Isolation)
    updateDeconShower(safeDelta) {
      if (!this.deconShower) return;
      const shower = this.deconShower;
      shower.cooldownTimer = Math.max(0, shower.cooldownTimer - safeDelta);

      if (shower.sprayTimer > 0) {
        shower.sprayTimer -= safeDelta;
        if (Math.random() < 0.3) {
          window.HiveSystems?.vfx?.burst?.(shower.x, shower.z, 0xf8fafc, 14, 0.12, 1.2);
        }
      }

      if (shower.cooldownTimer <= 0) {
        const entities = [playerCreature, ...(window.gameInstance?.humans || [])];
        const triggeringEntity = entities.find((ent) => ent && !ent.isIncapacitated && !ent.isCocooned && Math.hypot(ent.x - shower.x, ent.z - shower.z) <= 3.4);
        if (triggeringEntity) {
          shower.sprayTimer = 3.4;
          shower.cooldownTimer = 7.5;
          audioManager.playDeconSteam?.(shower.x, shower.z);
          window.HiveSystems?.vfx?.burst?.(shower.x, shower.z, 0xf8fafc, 28, 0.22, 2.0);
          showToast("SAS SANITAIRE BIO-HAZARD : Douches chimiques antiseptiques haute pression activées !");
          appendSensorLog("[BIO-HAZARD] Pulvérisation antiseptique déclenchée au sas médical.", "bio");
        }
      }
    }

    // Chantier 47 : Demi-corps de Synthétique Décapité Rampant (Aliens 1986)
    updateBisectedAndroid(safeDelta) {
      if (!this.bisectedAndroid || this.bisectedAndroid.isDestroyed || this.bisectedAndroid.isExtracted) return;
      const synth = this.bisectedAndroid;
      synth.sparkTimer -= safeDelta;
      if (synth.sparkTimer <= 0) {
        synth.sparkTimer = 1.8 + Math.random() * 1.5;
        audioManager.playBisectedSpark?.(synth.x, synth.z);
        window.HiveSystems?.vfx?.burst?.(synth.x, synth.z, 0x67e8f9, 8, 0.08, 0.6);
      }

      // Progression lente en rampant
      const dist = Math.hypot(synth.targetX - synth.x, synth.targetZ - synth.z);
      if (dist > 0.4) {
        synth.x += ((synth.targetX - synth.x) / dist) * synth.speed * safeDelta * 60;
        synth.z += ((synth.targetZ - synth.z) / dist) * synth.speed * safeDelta * 60;
        if (synth.mesh) synth.mesh.position.set(synth.x, 0, synth.z);
      } else if (!synth.hasAlerted) {
        synth.hasAlerted = true;
        window.alarmSystem?.raiseAlarm?.();
        audioManager.playSyntheticGlitchedVoice?.(synth.x, synth.z);
        showToast("LE SYNTHÉTIQUE A ATTEINT LA CONSOLE : Appel de renforts KAPPA relayé !");
        appendSensorLog("[SYNTHÉTIQUE ASH/BISHOP] Le châssis endommagé a déclenché l'alerte centrale.", "alert");
      }
    }

    extractBisectedAndroid() {
      if (!this.bisectedAndroid || this.bisectedAndroid.isExtracted) return false;
      const synth = this.bisectedAndroid;
      const dist = Math.hypot(playerCreature.x - synth.x, playerCreature.z - synth.z);
      if (dist <= 3.8) {
        synth.isExtracted = true;
        synth.isDestroyed = true;
        audioManager.playTunerHackBeep?.(synth.x, synth.z);
        audioManager.playSyntheticGlitchedVoice?.(synth.x, synth.z);
        window.HiveSystems?.vfx?.burst?.(synth.x, synth.z, 0xf8fafc, 30, 0.2, 1.8);
        window.HiveSystems?.vfx?.floatingText?.(synth.x, 2.2, synth.z, '+15 BIOMASSE & PLANS EXTRAITS', '#38bdf8', true);
        if (window.HiveAscensionState) {
          window.HiveAscensionState.biomass = (window.HiveAscensionState.biomass || 0) + 15;
        }
        showToast("SYNTHÉTIQUE DÉMONTÉ [K] : Banques de données pillées, positions des patrouilles révélées !");
        appendSensorLog("[SYNTHÉTIQUE] Processeur logique extrait. Détection humaine maximale activée.", "bio");
        return true;
      }
      return false;
    }

    // Chantier 46 : Système d'Extinction Automatique Gaz Halon & Asphyxie O2 (Alien: Isolation)
    triggerHalonSuppression(x, z) {
      if (!this.halonSystem) return;
      this.halonSystem.active = true;
      this.halonSystem.timer = 14.0;
      this.halonSystem.x = x;
      this.halonSystem.z = z;
      audioManager.playHalonHiss?.(x, z);
      window.HiveSystems?.vfx?.burst?.(x, z, 0xe2e8f0, 48, 0.35, 3.8);
      showToast("ALERTE INCENDIE : PURGE GAZ HALON 1301 ACTIVÉE (Privation d'O2) !");
      appendSensorLog("[HALON 1301] Extinction incendie automatique. Asphyxie immédiate des tissus pulmonaires.", "alert");
    }

    updateHalonSystem(safeDelta) {
      if (!this.halonSystem || !this.halonSystem.active) return;
      const halon = this.halonSystem;
      halon.timer -= safeDelta;
      if (Math.random() < 0.25) {
        window.HiveSystems?.vfx?.burst?.(halon.x, halon.z, 0xe2e8f0, 16, 0.15, 2.2);
      }

      // Asphyxie des humains dans le rayon du gaz Halon (Le xénomorphe anaérobie est immunisé)
      (window.gameInstance?.humans || []).forEach((h) => {
        if (h.isIncapacitated || h.isCocooned || h.isEscaped) return;
        if (['synthetic', 'android'].includes(h.type)) return;
        if (Math.hypot(h.x - halon.x, h.z - halon.z) <= halon.radius) {
          h.stress = 100;
          h.takeDamage?.(12 * safeDelta);
          if (Math.random() < 0.05) {
            window.HiveSystems?.vfx?.floatingText?.(h.x, 2.4, h.z, '*SUFFOCATION O2 GAZ HALON*', '#94a3b8', false);
          }
        }
      });

      if (halon.timer <= 0) {
        halon.active = false;
      }
    }

    // Chantier 48 : Éclairage Stroboscopique d'Urgence Alarme Rouge & Ombres Dynamiques
    updateEmergencyKlaxons(safeDelta) {
      if (!this.emergencyKlaxons) return;
      const inHighAlert = (window.alarmSystem?.level || 0) >= 3 || this.selfDestructSystem?.active;
      this.emergencyKlaxons.forEach((k) => {
        if (!k.light) return;
        if (inHighAlert) {
          k.angle += safeDelta * 5.2;
          k.light.intensity = 1.4 + Math.sin(k.angle) * 1.1;
        } else {
          k.light.intensity = 0;
        }
      });
    }

    // Chantier 50 : Protocole d'Auto-Destruction de la Station & Compte à Rebours M.U.T.H.U.R.
    triggerSelfDestructProtocol() {
      if (!this.selfDestructSystem || this.selfDestructSystem.active) return;
      this.selfDestructSystem.active = true;
      this.selfDestructSystem.timer = 120;
      this.selfDestructSystem.beepTimer = 0;
      audioManager.playMotherCountdownBeep?.(120);
      audioManager.playKlaxonAlarm?.();
      rendererEngine.addScreenShake?.(0.35, 0.25);
      showToast("ORDRE SPÉCIAL 937 : AUTO-DESTRUCTION M.U.T.H.U.R. ENGAGÉE (T-MOINS 120s) !");
      appendSensorLog("[M.U.T.H.U.R. 6000] Surcharge du réacteur ordonnée. Tous les survivants fuient vers Narcissus !", "alert");

      // Panique frénétique chez tous les humains vivants
      (window.gameInstance?.humans || []).forEach((h) => {
        if (!h.isIncapacitated && !h.isCocooned) {
          h.stress = 100;
          h.isPanicking = true;
          window.HiveSystems?.vfx?.floatingText?.(h.x, 2.8, h.z, 'ÉVACUATION IMMÉDIATE !', '#ef4444', true);
        }
      });
    }

    updateSelfDestructSystem(safeDelta) {
      if (!this.selfDestructSystem || !this.selfDestructSystem.active) return;
      const sd = this.selfDestructSystem;
      sd.timer -= safeDelta;
      sd.beepTimer -= safeDelta;

      if (sd.beepTimer <= 0) {
        sd.beepTimer = 2.2;
        audioManager.playMotherCountdownBeep?.(Math.ceil(sd.timer));
        audioManager.playKlaxonAlarm?.();
        rendererEngine.addScreenShake?.(0.12, 0.08);
        window.HiveSystems?.vfx?.floatingText?.(playerCreature.x, 3.6, playerCreature.z, `M.U.T.H.U.R. T-MOINS ${Math.ceil(sd.timer)}s`, '#ef4444', true);
      }

      if (sd.timer <= 0 && !sd.triggered) {
        sd.triggered = true;
        rendererEngine.addScreenShake?.(0.65, 0.8);
        audioManager.playCryoDetonation?.();
        showToast("DÉTONATION THERMONUCLÉAIRE DU RÉACTEUR MANTIS : STATION PURGÉE !");
        appendSensorLog("[MANTIS] Fusion du cœur nucléaire atteinte. Zéro survivant.", "alert");
        window.gameInstance?.showEndModal?.(
          "PURGE THERMONUCLÉAIRE M.U.T.H.U.R. 1:1",
          "Le réacteur Mantis a explosé dans une déflagration thermonucléaire de 100 mégatonnes, détruisant la station Mnemosyne et purgeant toute trace biologique et cybernétique selon l'Ordre Spécial 937 !",
          "#ef4444"
        );
      }
    }

    // Chantier 51 : Sacs de Spores Fongiques Pathogènes & Incubation Bloodburster (Alien: Covenant 2017)
    updateSporePods(safeDelta) {
      if (!this.sporePods) return;
      const humans = window.gameInstance?.humans || [];

      for (const pod of this.sporePods) {
        if (pod.isBurst) {
          pod.respawnTimer -= safeDelta;
          if (pod.respawnTimer <= 0) {
            pod.isBurst = false;
            if (pod.mesh) pod.mesh.visible = true;
          }
          continue;
        }

        // Proximité humaine provoquant l'éclatement du sac
        for (const h of humans) {
          if (h.isIncapacitated || h.isCocooned || h.isEscaped || h.bloodbursterIncubating) continue;
          if (['synthetic', 'android'].includes(h.type)) continue;

          const dist = Math.hypot(h.x - pod.x, h.z - pod.z);
          if (dist <= 3.8) {
            pod.isBurst = true;
            pod.respawnTimer = 40.0;
            if (pod.mesh) pod.mesh.visible = false;

            audioManager.playBloodbursterErupt?.(pod.x, pod.z);
            window.HiveSystems?.vfx?.burst?.(pod.x, pod.z, 0x14532d, 35, 0.25, 2.2);
            rendererEngine.addScreenShake?.(0.18, 0.12);

            h.bloodbursterIncubating = true;
            h.bloodbursterTimer = 12.0;
            h.stress = 100;

            showToast(`SPORES PATHOGÈNES ÉJECTÉS : ${h.name} a inhalé le nuage fongique ! Bloodburster en gestation interne rapide (12s) !`);
            appendSensorLog(`[PATHOGÈNE] Spores aéroportées inhalées par ${h.name}. Incubation interne immédiate.`, 'bio');
            break;
          }
        }
      }

      // Progression de la gestation du Bloodburster dans les humains infectés
      humans.forEach((h) => {
        if (!h.bloodbursterIncubating || h.isIncapacitated || h.isCocooned) return;
        h.bloodbursterTimer -= safeDelta;
        if (Math.random() < 0.15) {
          window.HiveSystems?.vfx?.floatingText?.(h.x, 2.2, h.z, '*SPASMES VISCÉRAUX*', '#ef4444', false);
          audioManager.playHostCough?.(h.x, h.z);
        }

        if (h.bloodbursterTimer <= 0) {
          h.bloodbursterIncubating = false;
          h.takeDamage?.(h.hp || 100);
          audioManager.playBloodbursterErupt?.(h.x, h.z);
          rendererEngine.addScreenShake?.(0.28, 0.2);
          window.HiveSystems?.vfx?.burst?.(h.x, h.z, 0xef4444, 40, 0.35, 2.5);
          window.HiveSystems?.vfx?.floatingText?.(h.x, 2.8, h.z, 'ÉMERGENCE DU BLOODBURSTER (COVENANT) !', '#ef4444', true);
          showToast(`BLOODBURSTER : Jaillissement dorsal féroce à travers la colonne de ${h.name} !`);
          appendSensorLog(`[BLOODBURSTER] Organisme juvénile néomorphe émergé du dos de ${h.name}.`, 'bio');

          if (window.gameInstance?.currentStage?.spawnChestburster) {
            window.gameInstance.currentStage.spawnChestburster(h.x, h.z);
          }
        }
      });
    }

    // Chantier 52 : Faux Échos Acoustiques sur le Radar M314 (Aliens 1986 / Isolation)
    createAcousticDecoy(x, z) {
      this.falseEchoes.push({
        x,
        z,
        timer: 8.5
      });
      audioManager.playMetalImpact?.(x, z);
      showToast('LEURRE ACOUSTIQUE CRÉÉ [N] : Écho fantôme projeté sur les détecteurs de mouvement des Marines !');
      appendSensorLog(`[M314] Signal acoustique suspect enregistré en (${Math.round(x)}, ${Math.round(z)}).`, 'alert');

      // Détournement des patrouilles de sécurité vers le leurre
      const humans = window.gameInstance?.humans || [];
      humans.forEach((h) => {
        if (h.isIncapacitated || h.isCocooned) return;
        if (['marine', 'guard', 'smartgunner', 'commando'].includes(h.type)) {
          const d = Math.hypot(h.x - x, h.z - z);
          if (d <= 32) {
            h.targetX = x + (Math.random() * 4 - 2);
            h.targetZ = z + (Math.random() * 4 - 2);
            h.isInvestigating = true;
            window.HiveSystems?.vfx?.floatingText?.(h.x, 2.4, h.z, 'CONTACT SUR LE TRACKER !', '#39ff14', false);
          }
        }
      });
    }

    updateFalseEchoes(safeDelta) {
      if (!this.falseEchoes) return;
      for (let i = this.falseEchoes.length - 1; i >= 0; i--) {
        this.falseEchoes[i].timer -= safeDelta;
        if (this.falseEchoes[i].timer <= 0) {
          this.falseEchoes.splice(i, 1);
        }
      }
    }

    // Chantier 54 : Conduits de Vapeur Industriels Surchauffée & Vannes de Décharge (Alien 1979 / Aliens 1986)
    ruptureSteamVent(vent) {
      if (!vent || vent.isRuptured) return;
      vent.isRuptured = true;
      vent.timer = 9.0;
      audioManager.playSteamBurstRupture?.(vent.x, vent.z);
      rendererEngine.addScreenShake?.(0.24, 0.18);
      window.HiveSystems?.vfx?.burst?.(vent.x, vent.z, 0xf1f5f9, 30, 0.3, 2.5);
      showToast('CONDUITE DE VAPEUR SURCHAUFFÉE ÉVENTRÉE : Geyser à 300°C libéré ! Les humains sont aveuglés et brûlés !');
      appendSensorLog(`[VAPEUR] Rupture de conduite haute pression. Température critique 300°C.`, 'alert');
    }

    updateSteamVents(safeDelta) {
      if (!this.steamVents) return;
      const entities = [playerCreature, ...(window.gameInstance?.humans || [])];

      for (const sv of this.steamVents) {
        if (sv.isRuptured) {
          sv.timer -= safeDelta;
          if (Math.random() < 0.4) {
            window.HiveSystems?.vfx?.burst?.(sv.x, sv.z, 0xf1f5f9, 14, 0.16, 2.0);
          }

          // Dégâts thermiques et aveuglement des entités dans le geyser
          entities.forEach((ent) => {
            if (!ent || ent.isIncapacitated || ent.isCocooned) return;
            const dist = Math.hypot(ent.x - sv.x, ent.z - sv.z);
            if (dist <= 4.5) {
              if (ent === playerCreature) {
                // Le xénomorphe résiste bien mieux à la chaleur
                ent.takeDamage?.(8 * safeDelta);
              } else {
                ent.takeDamage?.(35 * safeDelta);
                ent.stress = 100;
                if (Math.random() < 0.1) {
                  window.HiveSystems?.vfx?.floatingText?.(ent.x, 2.6, ent.z, '-35 BRÛLURE DE VAPEUR !', '#f97316', true);
                }
              }
            }
          });

          if (sv.timer <= 0) {
            sv.isRuptured = false;
          }
        }
      }
    }

    // Chantier 57 : Grenades à Impulsion Magnétique Polarisée I.M.P. (Aliens: Dark Descent)
    throwEMPGrenade(originX, originZ, targetX, targetZ) {
      const mesh = window.HiveModelFactory?.createEMPGrenade?.();
      const grenade = {
        x: originX,
        y: 1.5,
        z: originZ,
        targetX,
        targetZ,
        mesh,
        elapsed: 0,
        duration: 0.85
      };
      if (mesh) {
        mesh.position.set(originX, 1.5, originZ);
        rendererEngine.propsGroup.add(mesh);
      }
      this.activeEMPGrenades.push(grenade);
    }

    updateEMPGrenades(safeDelta) {
      if (!this.activeEMPGrenades) return;
      for (let i = this.activeEMPGrenades.length - 1; i >= 0; i--) {
        const g = this.activeEMPGrenades[i];
        g.elapsed += safeDelta;
        const t = Math.min(1, g.elapsed / g.duration);
        g.x = g.x + (g.targetX - g.x) * t;
        g.z = g.z + (g.targetZ - g.z) * t;
        g.y = 1.5 + Math.sin(t * Math.PI) * 2.2;
        if (g.mesh) g.mesh.position.set(g.x, g.y, g.z);

        if (t >= 1) {
          // Détonation de l'EMP
          audioManager.playEMPBlastNoise?.(g.targetX, g.targetZ);
          rendererEngine.addScreenShake?.(0.35, 0.25);
          window.HiveSystems?.vfx?.burst?.(g.targetX, g.targetZ, 0x38bdf8, 45, 0.35, 3.5);
          window.HiveSystems?.vfx?.ring?.(g.targetX, g.targetZ, 0x38bdf8, 14);

          // Coupure de courant et extinction de la station pendant 6 secondes
          rendererEngine.sabotagePower?.(6.0);
          showToast('DÉTONATION I.M.P. : Onde électromagnétique polarisée ! Extinction réseau et caméras coupées !');
          appendSensorLog('[I.M.P.] Onde électromagnétique marine déclenchée. Systèmes hors-ligne 6s.', 'alert');

          if (g.mesh) rendererEngine.removeObject(g.mesh);
          this.activeEMPGrenades.splice(i, 1);
        }
      }
    }

    // Chantier 58 : Portes Hydrauliques Scellées par Barres de Renfort (Alien: Isolation)
    pryHydraulicDoor(door) {
      if (!door || door.isPried) return;
      door.health = Math.max(0, door.health - 65);
      audioManager.playDoorPryCreak?.(door.x, door.z);
      rendererEngine.addScreenShake?.(0.2, 0.15);
      window.HiveSystems?.vfx?.burst?.(door.x, door.z, 0xf59e0b, 16, 0.12, 1.2);
      window.HiveSystems?.vfx?.floatingText?.(door.x, 2.8, door.z, `FORÇAGE HYDRAULIQUE (${door.health} PV)`, '#f59e0b', true);

      if (door.health <= 0) {
        door.isPried = true;
        audioManager.playMetalImpact?.(door.x, door.z);
        if (door.mesh) rendererEngine.removeObject(door.mesh);
        // Supprimer le collider
        const idx = this.colliders.findIndex((c) => c.doorRef === door);
        if (idx >= 0) this.colliders.splice(idx, 1);
        showToast('SAS SCIELLÉ DÉFONCÉ : Les barres de renfort ont été arrachées ! Passage ouvert !');
        appendSensorLog(`[BRÈCHE] Sas scellé forcé par effraction physique. Cloison ouverte.`, 'alert');
      }
    }

    // Chantier 60 : Nappes de Brume Cryogénique au Ras du Sol (Alien 1979)
    updateCryoMistZones(safeDelta) {
      if (!this.cryoMistZones) return;
      for (const mist of this.cryoMistZones) {
        mist.dripTimer -= safeDelta;
        if (mist.dripTimer <= 0) {
          mist.dripTimer = 5.0 + Math.random() * 4.5;
          audioManager.playDrippingEcho?.(mist.x, mist.z);
        }

        // Dissimulation furtive du Xénomorphe dans la nappe de brume
        const dist = Math.hypot(playerCreature.x - mist.x, playerCreature.z - mist.z);
        if (dist <= 7.0) {
          playerCreature.isInMist = true;
        }
      }
    }

    // Chantier 68 : Barils de Napalm USCM Inflammables (Aliens 1986 / Isolation)
    detonateNapalmBarrel(barrel, triggerEntity = null) {
      if (!barrel || barrel.isDetonated) return;
      barrel.isDetonated = true;
      barrel.fireTimer = 15.0;

      // Supprimer le collider solide du baril
      const cIdx = this.colliders.findIndex((c) => c.barrelRef === barrel);
      if (cIdx >= 0) this.colliders.splice(cIdx, 1);

      audioManager.playNapalmBarrelExplosion?.(barrel.x, barrel.z);
      rendererEngine.addScreenShake?.(0.48, 0.32);
      window.HiveSystems?.vfx?.burst?.(barrel.x, barrel.z, 0xea580c, 45, 0.45, 3.2);
      window.HiveSystems?.vfx?.ring?.(barrel.x, barrel.z, 0xf97316, 7.5);
      showToast('DÉTONATION NAPALM USCM ! Barrière de feu persistante de 15s !');
      appendSensorLog(`[NAPALM] Détonation d'un baril de carburant. Incendie de zone à 800°C.`, 'alert');

      // Dégâts initiaux massifs dans le rayon de déflagration (6.5m)
      const entities = [playerCreature, ...(window.gameInstance?.humans || [])];
      entities.forEach((ent) => {
        if (!ent || ent.isIncapacitated || ent.isCocooned) return;
        const d = Math.hypot(ent.x - barrel.x, ent.z - barrel.z);
        if (d <= 6.5) {
          const dmg = ent === playerCreature ? 45 : 95;
          ent.takeDamage?.(dmg, triggerEntity || playerCreature);
          if (ent.staggerTimer !== undefined) ent.staggerTimer = 1.2;
          window.HiveSystems?.vfx?.floatingText?.(ent.x, 3.2, ent.z, `-${dmg} SOUFFLE DU NAPALM`, '#ea580c', true);
        }
      });
    }

    updateNapalmBarrels(safeDelta) {
      if (!this.napalmBarrels) return;
      const entities = [playerCreature, ...(window.gameInstance?.humans || [])];

      for (const b of this.napalmBarrels) {
        if (b.isDetonated && b.fireTimer > 0) {
          b.fireTimer -= safeDelta;
          if (Math.random() < 0.45) {
            window.HiveSystems?.vfx?.burst?.(b.x + (Math.random() * 3 - 1.5), b.z + (Math.random() * 3 - 1.5), 0xf97316, 12, 0.22, 1.6);
          }
          if (b.fireTimer <= 0 && b.mesh) {
            rendererEngine.removeObject(b.mesh);
          }

          // Dégâts continus de brûlure pour qui traverse le napalm
          entities.forEach((ent) => {
            if (!ent || ent.isIncapacitated || ent.isCocooned) return;
            const dist = Math.hypot(ent.x - b.x, ent.z - b.z);
            if (dist <= 5.2) {
              const burnDmg = ent === playerCreature ? 12 : 32;
              ent.takeDamage?.(burnDmg * safeDelta, null);
              if (ent.stress !== undefined) ent.stress = 100;
              if (Math.random() < 0.15) {
                window.HiveSystems?.vfx?.floatingText?.(ent.x, 2.8, ent.z, 'BRÛLURE NAPALM !', '#ea580c', false);
              }
            }
          });
        }
      }
    }

    // Chantier 64 : Expansion Vivante de la Toile de Ruche "Hive Creep" (Marvel Comics)
    spreadHiveCreep(x, z, radius = 4.5) {
      const patch = { x, z, radius, mesh: window.HiveModelFactory?.createHiveCreepPatch?.() };
      if (patch.mesh) {
        patch.mesh.position.set(x, 0.04, z);
        rendererEngine.propsGroup.add(patch.mesh);
      }
      this.hiveCreepPatches.push(patch);
      audioManager.playHiveCreepSpread?.(x, z);
      window.HiveSystems?.vfx?.ring?.(x, z, 0x831843, radius);
      showToast('TOILE VIVANTE DE RUCHE ÉTENDUE : Régénération +25% et Vitesse +20% sur la résine active !');
      appendSensorLog(`[HIVE CREEP] Nappe filamenteuse de ruche propagée en (${Math.round(x)}, ${Math.round(z)}).`, 'bio');
    }

    updateHiveCreep(safeDelta) {
      if (!this.hiveCreepPatches || !this.hiveCreepPatches.length) return;
      playerCreature.isOnHiveCreep = false;

      for (const patch of this.hiveCreepPatches) {
        const dXeno = Math.hypot(playerCreature.x - patch.x, playerCreature.z - patch.z);
        if (dXeno <= patch.radius) {
          playerCreature.isOnHiveCreep = true;
          // Régénération passive sur la toile vivante
          if (playerCreature.health < playerCreature.maxHealth) {
            playerCreature.health = Math.min(playerCreature.maxHealth, playerCreature.health + 4 * safeDelta);
          }
        }

        // Détection de pas humains sur la toile (vibrations tactiles pour le joueur)
        const humans = window.gameInstance?.humans || [];
        for (const h of humans) {
          if (h.isIncapacitated || h.isCocooned) continue;
          const dH = Math.hypot(h.x - patch.x, h.z - patch.z);
          if (dH <= patch.radius) {
            h.creepSlowTimer = 0.5;
            if (Math.random() < 0.08) {
              window.HiveSystems?.vfx?.floatingText?.(h.x, 2.6, h.z, 'INTRUS SUR LA TOILE !', '#ec4899', true);
            }
          }
        }
      }
    }

    // Chantier 62 : Nuée de Xénomorphes Nains "Swarmers" (Marvel Comics 2022: Alien: Icarus)
    spawnSwarmerPack(x, z, count = 5) {
      const mesh = window.HiveModelFactory?.createSwarmerPack?.();
      const pack = {
        x,
        z,
        mesh,
        count,
        hp: 45,
        speed: 0.52,
        targetHuman: null,
        targetX: x,
        targetZ: z,
        attackCooldown: 0
      };
      if (mesh) {
        mesh.position.set(x, 0.05, z);
        rendererEngine.propsGroup.add(mesh);
      }
      this.activeSwarmers.push(pack);
      audioManager.playSwarmerChitter?.(x, z);
      window.HiveSystems?.vfx?.burst?.(x, z, 0x090d16, 20, 0.15, 1.4);
      showToast('NUÉE DE SWARMERS INVOQUÉE : Meute de micro-morphs grouillant au sol prête à submerger les soldats !');
      appendSensorLog(`[SWARMERS] Meute de micro-xénomorphes déployée. Prête à attaquer.`, 'bio');
      return pack;
    }

    // Chantier 65 : Ordres de Meute Télépathiques de l'Alpha (Marvel Comics)
    orderSwarmers(targetX, targetZ, targetHuman = null) {
      if (!this.activeSwarmers || !this.activeSwarmers.length) {
        this.spawnSwarmerPack(playerCreature.x, playerCreature.z);
      }
      audioManager.playAlphaPsychicWave?.(playerCreature.x, playerCreature.z);
      audioManager.playSwarmerChitter?.(playerCreature.x, playerCreature.z);
      rendererEngine.addScreenShake?.(0.2, 0.14);
      window.HiveSystems?.vfx?.ring?.(playerCreature.x, playerCreature.z, 0xdc2626, 12);

      this.activeSwarmers.forEach((pack) => {
        pack.targetX = targetX;
        pack.targetZ = targetZ;
        pack.targetHuman = targetHuman;
        if (targetHuman) {
          window.HiveSystems?.vfx?.floatingText?.(targetHuman.x, 3.2, targetHuman.z, 'CIBLE DÉSIGNÉE PAR L\'ALPHA !', '#dc2626', true);
        }
      });
      showToast('ORDRE TÉLÉPATHIQUE DE MEUTE [T] : Les Swarmers et Drones convergent vers la cible !');
      appendSensorLog(`[ALPHA] Ordre psychique émis vers (${Math.round(targetX)}, ${Math.round(targetZ)}).`, 'bio');
    }

    updateSwarmers(safeDelta) {
      if (!this.activeSwarmers || !this.activeSwarmers.length) return;
      const humans = window.gameInstance?.humans || [];

      for (let i = this.activeSwarmers.length - 1; i >= 0; i--) {
        const pack = this.activeSwarmers[i];
        if (pack.hp <= 0) {
          audioManager.playAcidBurn?.(pack.x, pack.z);
          window.HiveSystems?.vfx?.burst?.(pack.x, pack.z, 0x84cc16, 16, 0.15, 1.2);
          if (pack.mesh) rendererEngine.removeObject(pack.mesh);
          this.activeSwarmers.splice(i, 1);
          continue;
        }

        // Trouver cible si aucune
        if (!pack.targetHuman || pack.targetHuman.isIncapacitated || pack.targetHuman.isCocooned) {
          let closest = null;
          let minD = 35;
          for (const h of humans) {
            if (h.isIncapacitated || h.isCocooned) continue;
            const d = Math.hypot(h.x - pack.x, h.z - pack.z);
            if (d < minD) { minD = d; closest = h; }
          }
          pack.targetHuman = closest;
          if (closest) {
            pack.targetX = closest.x;
            pack.targetZ = closest.z;
          } else {
            pack.targetX = playerCreature.x + Math.sin(Date.now() * 0.003 + i) * 2.5;
            pack.targetZ = playerCreature.z + Math.cos(Date.now() * 0.003 + i) * 2.5;
          }
        } else {
          pack.targetX = pack.targetHuman.x;
          pack.targetZ = pack.targetHuman.z;
        }

        // Déplacement du pack
        const dx = pack.targetX - pack.x;
        const dz = pack.targetZ - pack.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.8) {
          const moveStep = Math.min(dist, pack.speed * 60 * safeDelta);
          pack.x += (dx / dist) * moveStep;
          pack.z += (dz / dist) * moveStep;
          if (pack.mesh) {
            pack.mesh.position.set(pack.x, 0.05, pack.z);
            pack.mesh.rotation.y = Math.atan2(dx, dz);
          }
        }

        // Attaque d'étouffement / morsure de nuée
        if (pack.targetHuman && dist <= 2.2) {
          const h = pack.targetHuman;
          pack.attackCooldown -= safeDelta;
          if (pack.attackCooldown <= 0) {
            pack.attackCooldown = 0.6;
            audioManager.playSwarmerChitter?.(h.x, h.z);
            h.takeDamage?.(18, playerCreature);
            h.staggerTimer = 0.8;
            h.stress = 100;
            window.HiveSystems?.vfx?.burst?.(h.x, h.z, 0x090d16, 10, 0.1, 1.0);
            window.HiveSystems?.vfx?.floatingText?.(h.x, 2.5, h.z, 'SUBMERGÉ PAR LES SWARMERS (-60% VITESSE)', '#ef4444', true);
          }
        }
      }
    }

    findClosestVent(x, z) {
      if (!this.vents || !this.vents.length) return null;
      let closest = null;
      let minDistance = Infinity;
      for (const vent of this.vents) {
        const dist = Math.hypot(vent.x - x, vent.z - z);
        if (dist < minDistance) {
          minDistance = dist;
          closest = { ...vent, distance: dist };
        }
      }
      return closest;
    }

    segmentIntersectsCollider(startX, startZ, endX, endZ, collider, padding = 0) {
      const minX = collider.minX - padding;
      const maxX = collider.maxX + padding;
      const minZ = collider.minZ - padding;
      const maxZ = collider.maxZ + padding;
      const deltaX = endX - startX;
      const deltaZ = endZ - startZ;
      let entry = 0;
      let exit = 1;

      const clipAxis = (start, delta, min, max) => {
        if (Math.abs(delta) < 1e-7) return start >= min && start <= max;
        let near = (min - start) / delta;
        let far = (max - start) / delta;
        if (near > far) [near, far] = [far, near];
        entry = Math.max(entry, near);
        exit = Math.min(exit, far);
        return entry <= exit;
      };

      return clipAxis(startX, deltaX, minX, maxX) &&
        clipAxis(startZ, deltaZ, minZ, maxZ) &&
        exit >= 0 &&
        entry <= 1;
    }

    distPointToSegment(px, pz, x1, z1, x2, z2) {
      const l2 = (x2 - x1) * (x2 - x1) + (z2 - z1) * (z2 - z1);
      if (l2 === 0) return Math.hypot(px - x1, pz - z1);
      let t = ((px - x1) * (x2 - x1) + (pz - z1) * (z2 - z1)) / l2;
      t = Math.max(0, Math.min(1, t));
      return Math.hypot(px - (x1 + t * (x2 - x1)), pz - (z1 + t * (z2 - z1)));
    }

    hasLineOfSight(startX, startZ, endX, endZ, padding = 0.08) {
      const collidesWall = this.colliders.some((collider) => (
        this.segmentIntersectsCollider(startX, startZ, endX, endZ, collider, padding)
      ));
      if (collidesWall) return false;

      // Masquage thermique et visuel par les geysers de vapeur (Alien Isolation 1:1)
      const vfxEffects = window.HiveSystems?.vfx?.effects || [];
      for (const eff of vfxEffects) {
        if (eff.steamCloud && eff.age < eff.lifetime * 0.85) {
          const distToLine = this.distPointToSegment(eff.x, eff.z, startX, startZ, endX, endZ);
          if (distToLine < (eff.radius || 2.5)) return false;
        }
      }
      return true;
    }

    checkCollision(nextX, nextZ, padding = 0) {
      for (const col of this.colliders) {
        if (
          nextX > col.minX - padding &&
          nextX < col.maxX + padding &&
          nextZ > col.minZ - padding &&
          nextZ < col.maxZ + padding
        ) {
          return true;
        }
      }
      return false;
    }

    findPath(startX, startZ, endX, endZ, {
      step = 2.5,
      padding = 0.72,
      min = -70,
      max = 70
    } = {}) {
      const destination = { x: endX, z: endZ };
      if (
        !this.checkCollision(endX, endZ, padding) &&
        this.hasLineOfSight(startX, startZ, endX, endZ, padding)
      ) {
        return [destination];
      }

      const gridSize = Math.floor((max - min) / step) + 1;
      const keyOf = (ix, iz) => `${ix}:${iz}`;
      const pointOf = (ix, iz) => ({
        x: min + ix * step,
        z: min + iz * step
      });
      const clampIndex = (value) => Math.max(0, Math.min(gridSize - 1, value));
      const indexOf = (value) => clampIndex(Math.round((value - min) / step));

      const nearestFreeNode = (worldX, worldZ) => {
        const centerX = indexOf(worldX);
        const centerZ = indexOf(worldZ);
        for (let radius = 0; radius < gridSize; radius++) {
          let best = null;
          for (let offsetX = -radius; offsetX <= radius; offsetX++) {
            for (let offsetZ = -radius; offsetZ <= radius; offsetZ++) {
              if (Math.max(Math.abs(offsetX), Math.abs(offsetZ)) !== radius) continue;
              const ix = centerX + offsetX;
              const iz = centerZ + offsetZ;
              if (ix < 0 || iz < 0 || ix >= gridSize || iz >= gridSize) continue;
              const point = pointOf(ix, iz);
              if (this.checkCollision(point.x, point.z, padding)) continue;
              const distance = Math.hypot(point.x - worldX, point.z - worldZ);
              if (!best || distance < best.distance) best = { ix, iz, point, distance };
            }
          }
          if (best) return best;
        }
        return null;
      };

      const startNode = nearestFreeNode(startX, startZ);
      const goalNode = nearestFreeNode(endX, endZ);
      if (!startNode || !goalNode) return [];

      const directions = [
        [-1, 0, 1], [1, 0, 1], [0, -1, 1], [0, 1, 1],
        [-1, -1, Math.SQRT2], [-1, 1, Math.SQRT2],
        [1, -1, Math.SQRT2], [1, 1, Math.SQRT2]
      ];
      const open = [];
      const records = new Map();
      const closed = new Set();
      const startKey = keyOf(startNode.ix, startNode.iz);
      const goalKey = keyOf(goalNode.ix, goalNode.iz);
      const heuristic = (ix, iz) => Math.hypot(ix - goalNode.ix, iz - goalNode.iz);
      records.set(startKey, {
        ix: startNode.ix,
        iz: startNode.iz,
        g: 0,
        f: heuristic(startNode.ix, startNode.iz),
        parent: null
      });
      open.push(startKey);

      while (open.length > 0 && closed.size < gridSize * gridSize) {
        open.sort((leftKey, rightKey) => records.get(leftKey).f - records.get(rightKey).f);
        const currentKey = open.shift();
        if (currentKey === goalKey) break;
        if (closed.has(currentKey)) continue;
        closed.add(currentKey);
        const current = records.get(currentKey);
        const currentPoint = pointOf(current.ix, current.iz);

        for (const [offsetX, offsetZ, movementCost] of directions) {
          const ix = current.ix + offsetX;
          const iz = current.iz + offsetZ;
          if (ix < 0 || iz < 0 || ix >= gridSize || iz >= gridSize) continue;
          const neighborKey = keyOf(ix, iz);
          if (closed.has(neighborKey)) continue;
          const neighborPoint = pointOf(ix, iz);
          if (this.checkCollision(neighborPoint.x, neighborPoint.z, padding)) continue;
          if (
            offsetX !== 0 &&
            offsetZ !== 0 &&
            (
              this.checkCollision(pointOf(current.ix + offsetX, current.iz).x, currentPoint.z, padding) ||
              this.checkCollision(currentPoint.x, pointOf(current.ix, current.iz + offsetZ).z, padding)
            )
          ) {
            continue;
          }

          const tentativeG = current.g + movementCost;
          const existing = records.get(neighborKey);
          if (existing && tentativeG >= existing.g) continue;
          records.set(neighborKey, {
            ix,
            iz,
            g: tentativeG,
            f: tentativeG + heuristic(ix, iz),
            parent: currentKey
          });
          if (!open.includes(neighborKey)) open.push(neighborKey);
        }
      }

      if (!records.has(goalKey)) return [];
      const rawPath = [];
      let cursorKey = goalKey;
      while (cursorKey && cursorKey !== startKey) {
        const record = records.get(cursorKey);
        rawPath.unshift(pointOf(record.ix, record.iz));
        cursorKey = record.parent;
      }
      const finalPathPoint = rawPath[rawPath.length - 1] || {
        x: startX,
        z: startZ
      };
      if (
        !this.checkCollision(destination.x, destination.z, padding) &&
        this.hasLineOfSight(
          finalPathPoint.x,
          finalPathPoint.z,
          destination.x,
          destination.z,
          padding
        )
      ) {
        rawPath.push(destination);
      }

      const smoothed = [];
      let anchor = { x: startX, z: startZ };
      let cursor = 0;
      while (cursor < rawPath.length) {
        let farthest = cursor;
        for (let candidate = rawPath.length - 1; candidate >= cursor; candidate--) {
          if (this.hasLineOfSight(
            anchor.x,
            anchor.z,
            rawPath[candidate].x,
            rawPath[candidate].z,
            padding
          )) {
            farthest = candidate;
            break;
          }
        }
        smoothed.push(rawPath[farthest]);
        anchor = rawPath[farthest];
        cursor = farthest + 1;
      }
      return smoothed;
    }
  }

  const stationMap = new StationMap();

  class ResinGrid {
    constructor() { this.nodes = []; this.totalCoverage = 0; }
    init() {
      const loader = new THREE.TextureLoader();
      const resinTexture = loader.load('assets/textures/hive-resin.png', undefined, undefined, () => {});
      const bumpTexture = loader.load('assets/textures/organic-bump.png', undefined, undefined, () => {});
      for (const texture of [resinTexture, bumpTexture]) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 2);
      }
      resinTexture.encoding = THREE.sRGBEncoding;
      this.resinMat = new THREE.MeshStandardMaterial({
        map: resinTexture,
        bumpMap: bumpTexture,
        bumpScale: 0.22,
        color: 0x6b4b83,
        emissive: 0x301044,
        emissiveIntensity: 0.45,
        roughness: 0.24,
        metalness: 0.32,
        transparent: true,
        opacity: 0.94
      });
    }
    addResinPatch(x, z, radius = 6) {
      const overlapsExistingPatch = this.nodes.some((node) => Math.hypot(node.x - x, node.z - z) < Math.min(node.radius, radius) * 0.75);
      if (overlapsExistingPatch) return false;

      const group = new THREE.Group();
      const geo = new THREE.CircleGeometry(radius, 36);
      const mesh = new THREE.Mesh(geo, this.resinMat.clone());
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.05;
      mesh.receiveShadow = true;
      group.add(mesh);
      const tendrilMaterial = this.resinMat.clone();
      tendrilMaterial.opacity = 0.82;
      for (let index = 0; index < 7; index++) {
        const angle = (index / 7) * Math.PI * 2 + radius * 0.17;
        const length = radius * (0.55 + (index % 3) * 0.13);
        const tendril = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.14, length, 7),
          tendrilMaterial
        );
        tendril.rotation.z = Math.PI / 2;
        tendril.rotation.y = -angle;
        tendril.position.set(Math.cos(angle) * length * 0.45, 0.13, Math.sin(angle) * length * 0.45);
        group.add(tendril);
      }
      group.position.set(x, 0, z);
      rendererEngine.resinGroup.add(group);
      this.nodes.push({ x, z, radius, mesh: group });
      this.totalCoverage = Math.min(100, this.totalCoverage + 6);
      while (this.nodes.length > 16) {
        const expiredNode = this.nodes.shift();
        rendererEngine.removeObject(expiredNode.mesh);
      }
      const el = document.getElementById('hive-resin');
      if (el) el.textContent = `${this.totalCoverage}%`;
      return true;
    }
    reset() {
      for (const node of this.nodes) {
        if (node.mesh) rendererEngine.removeObject(node.mesh);
      }
      this.nodes = [];
      this.totalCoverage = 0;
      const resinElement = document.getElementById('hive-resin');
      if (resinElement) resinElement.textContent = '0%';
    }
  }

  const resinGrid = new ResinGrid();

  // -------------------------------------------------------------
  // SHARED HUD FEEDBACK HELPERS
  // -------------------------------------------------------------
  function appendSensorLog(message, type = 'bio') {
    const logBox = document.getElementById('sensor-log');
    if (!logBox) return;
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    line.textContent = message;
    logBox.appendChild(line);
    while (logBox.children.length > 40) logBox.firstElementChild.remove();
    logBox.scrollTop = logBox.scrollHeight;
  }

  let toastTimer = null;
  function showToast(message, duration = 2400) {
    const toast = document.getElementById('toast-message');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.add('hidden'), duration);
  }

  function getAnimationModel(container) {
    let model = null;
    container?.traverse((child) => {
      if (!model && child.userData?.animationRig) model = child;
    });
    return model;
  }

  function animateProceduralModel(container, {
    phase = 0,
    movement = 0,
    attack = 0,
    crouch = 0,
    pulse = 0
  } = {}) {
    const model = getAnimationModel(container);
    const rig = model?.userData?.animationRig;
    if (!rig) return;
    if (!model.userData.runtimeBasePose) {
      model.userData.runtimeBasePose = {
        position: model.position.clone(),
        quaternion: model.quaternion.clone(),
        scale: model.scale.clone()
      };
    }
    const basePose = model.userData.runtimeBasePose;
    model.position.copy(basePose.position);
    model.quaternion.copy(basePose.quaternion);
    model.scale.copy(basePose.scale);
    rig.resetPose?.();

    const locomotion = Array.isArray(rig.roles?.locomotion) ? rig.roles.locomotion : [];
    locomotion.forEach((joint, index) => {
      const alternating = index % 2 === 0 ? 1 : -1;
      joint.rotation.x += Math.sin(phase + index * 0.7) * 0.42 * movement * alternating;
      joint.rotation.z += Math.cos(phase * 0.5 + index) * 0.08 * movement;
    });

    const attackJoints = Array.isArray(rig.roles?.attack) ? rig.roles.attack : [];
    attackJoints.forEach((joint, index) => {
      const envelope = Math.sin(Math.min(1, Math.max(0, attack)) * Math.PI);
      joint.rotation.x -= envelope * (0.24 + index % 3 * 0.05);
      joint.rotation.z += envelope * (index % 2 === 0 ? 0.18 : -0.18);
    });

    if (crouch > 0) {
      model.position.y -= Math.sin(Math.min(1, crouch) * Math.PI) * 0.22;
      model.rotation.x += Math.sin(Math.min(1, crouch) * Math.PI) * 0.12;
    }
    if (pulse > 0) {
      const pulseScale = 1 + Math.sin(phase * 1.8) * 0.032 * pulse;
      model.scale.copy(basePose.scale).multiplyScalar(pulseScale);

      // Romulus chrysalis respiration, suture expansion & amniotic glow
      const membrane = model.getObjectByName('pod_membrane');
      if (membrane) {
        membrane.scale.x = 1.24 * (1 + Math.sin(phase * 1.8) * 0.03 * pulse);
        membrane.scale.z = 1.08 * (1 + Math.cos(phase * 1.8) * 0.03 * pulse);
      }
      const core = model.getObjectByName('amniotic_core');
      if (core) {
        core.position.y = 1.5 + Math.sin(phase * 1.4) * 0.04 * pulse;
        if (core.material && core.material.emissive) {
          core.material.emissiveIntensity = 0.65 + Math.sin(phase * 2.2) * 0.35 * pulse;
        }
      }
      const lipLeft = model.getObjectByName('suture_lip_left');
      const lipRight = model.getObjectByName('suture_lip_right');
      if (lipLeft && lipRight) {
        const seamBreath = Math.sin(phase * 2.5) * 0.018 * pulse;
        lipLeft.position.x = -0.06 - Math.max(0, seamBreath);
        lipRight.position.x = 0.06 + Math.max(0, seamBreath);
      }
    }
  }

  function setHudBar(kind, label, value, displayValue = null) {
    const normalizedValue = Math.max(0, Math.min(100, Number(value) || 0));
    const labelElement = document.getElementById(`stat-${kind}-label`);
    const valueElement = document.getElementById(`stat-${kind}-val`);
    const fillElement = document.getElementById(`stat-${kind}-fill`);
    if (labelElement) labelElement.textContent = label;
    if (valueElement) valueElement.textContent = displayValue === null ? `${Math.round(normalizedValue)}%` : String(displayValue);
    if (fillElement) {
      fillElement.style.width = `${normalizedValue}%`;
      fillElement.setAttribute('aria-valuenow', String(Math.round(normalizedValue)));
    }
  }

  // -------------------------------------------------------------
  // 8. ENTITIES WITH REAL HP COMBAT & COCOONING
  // -------------------------------------------------------------
  const ADULT_CASTE_PROFILES = Object.freeze({
    drone: Object.freeze({
      key: 'drone',
      label: 'DRONE',
      maxHealth: 190,
      speed: 0.42,
      huntAction: 'EMBUSCADE SILENCIEUSE',
      huntCost: 25,
      huntRange: 65,
      huntDamage: 78,
      jawDamage: 148,
      tailDamage: 105
    }),
    runner: Object.freeze({
      key: 'runner',
      label: 'RUNNER',
      maxHealth: 145,
      speed: 0.56,
      huntAction: 'BOND QUADRUPÈDE',
      huntCost: 30,
      huntRange: 70,
      huntDamage: 96,
      jawDamage: 124,
      tailDamage: 88
    }),
    warrior: Object.freeze({
      key: 'warrior',
      label: 'WARRIOR',
      maxHealth: 245,
      speed: 0.36,
      huntAction: 'CHARGE DE BRÈCHE',
      huntCost: 35,
      huntRange: 60,
      huntDamage: 118,
      jawDamage: 168,
      tailDamage: 132
    }),
    prowler: Object.freeze({
      key: 'prowler',
      label: 'PROWLER',
      maxHealth: 175,
      speed: 0.52,
      huntAction: 'BOND D’ÉPOUVANTE',
      huntCost: 25,
      huntRange: 75,
      huntDamage: 94,
      jawDamage: 162,
      tailDamage: 112
    }),
    spitter: Object.freeze({
      key: 'spitter',
      label: 'SPITTER',
      maxHealth: 160,
      speed: 0.40,
      huntAction: 'SALVE CORROSIVE',
      huntCost: 25,
      huntRange: 80,
      huntDamage: 88,
      jawDamage: 118,
      tailDamage: 92
    }),
    burster: Object.freeze({
      key: 'burster',
      label: 'BURSTER',
      maxHealth: 135,
      speed: 0.55,
      huntAction: 'EXPLOSION ACIDE',
      huntCost: 30,
      huntRange: 65,
      huntDamage: 155,
      jawDamage: 95,
      tailDamage: 80
    }),
    crusher: Object.freeze({
      key: 'crusher',
      label: 'CRUSHER',
      maxHealth: 380,
      speed: 0.38,
      huntAction: 'CHARGE DE BÉLIER',
      huntCost: 40,
      huntRange: 60,
      huntDamage: 175,
      jawDamage: 195,
      tailDamage: 155
    }),
    praetorian: Object.freeze({
      key: 'praetorian',
      label: 'PRAETORIAN',
      maxHealth: 340,
      speed: 0.34,
      huntAction: 'CHARGE ROYALE',
      huntCost: 35,
      huntRange: 65,
      huntDamage: 155,
      jawDamage: 210,
      tailDamage: 170
    }),
    palatine: Object.freeze({
      key: 'palatine',
      label: 'PALATINE',
      maxHealth: 420,
      speed: 0.35,
      huntAction: 'ÉGIDE DE LA REINE',
      huntCost: 40,
      huntRange: 70,
      huntDamage: 180,
      jawDamage: 230,
      tailDamage: 190
    }),
    offspring: Object.freeze({
      key: 'offspring',
      label: 'OFFSPRING (Z-01)',
      maxHealth: 310,
      speed: 0.46,
      huntAction: 'ÉCRASEMENT HYBRIDE',
      huntCost: 30,
      huntRange: 65,
      huntDamage: 140,
      jawDamage: 220,
      tailDamage: 130
    }),
    predalien: Object.freeze({
      key: 'predalien',
      label: 'PREDALIEN (AVP)',
      maxHealth: 360,
      speed: 0.44,
      huntAction: 'IMPLANTATION ORALE',
      huntCost: 35,
      huntRange: 65,
      huntDamage: 165,
      jawDamage: 225,
      tailDamage: 160
    }),
    deacon: Object.freeze({
      key: 'deacon',
      label: 'DEACON (PROMETHEUS)',
      maxHealth: 260,
      speed: 0.54,
      huntAction: 'MÂCHOIRE PRÉMAXILLAIRE',
      huntCost: 25,
      huntRange: 75,
      huntDamage: 140,
      jawDamage: 215,
      tailDamage: 110
    }),
    neomorph: Object.freeze({
      key: 'neomorph',
      label: 'NÉOMORPHE (COVENANT)',
      maxHealth: 220,
      speed: 0.62,
      huntAction: 'FRINGALE DU NÉOMORPHE',
      huntCost: 25,
      huntRange: 80,
      huntDamage: 135,
      jawDamage: 180,
      tailDamage: 145
    }),
    alpha: Object.freeze({
      key: 'alpha',
      label: 'ALPHA XENOMORPH (MARVEL)',
      maxHealth: 520,
      speed: 0.48,
      huntAction: 'IMPULSION TÉLÉPATHIQUE',
      huntCost: 35,
      huntRange: 75,
      huntDamage: 190,
      jawDamage: 260,
      tailDamage: 210
    })
  });

  class PlayerCreature {
    constructor() {
      this.form = 'egg';
      this.x = -20;
      this.z = -35;
      this.speed = 0.25;
      this.mesh = null;
      this.detailedModel = null;
      this.eggIsOpen = false;
      this.eggOpeningProgress = 1;
      this.isLeaping = false;
      this.leapElapsed = 0;
      this.leapDuration = 0.62;
      this.leapArcHeight = 3.6;
      this.leapUsesFaceAnchor = true;
      this.leapStart = null;
      this.leapHost = null;
      this.leapComplete = null;
      this.leapTrailCooldown = 0;
      this.attachedHost = null;
      this.isChrysalis = false;
      this.actionAnimation = 0;
      this.actionType = '';
      this.maxHealth = 100;
      this.health = 100;
      this.isDefeated = false;
      this.moveTarget = null;
      this.moveWaypoints = [];
      this.adultCaste = 'drone';
      this.isInVent = false;
      this.currentVent = null;
      this.salivaTimer = 0;
      this.isProwling = false;
      this.isCeilingProwling = false;
      this.draggedHost = null;
    }

    toggleCeilingProwl() {
      if (this.form !== 'drone') return;
      if (this.isInVent) {
        showToast('Impossible de grimper au plafond depuis un conduit.');
        return;
      }
      this.isCeilingProwling = !this.isCeilingProwling;
      if (this.isCeilingProwling) {
        this.mesh?.position.set(this.x, 5.85, this.z);
        if (this.detailedModel) {
          this.detailedModel.rotation.x = Math.PI; // Tête en bas agrippé aux poutres métalliques
          this.detailedModel.position.y = 0;
        }
        audioManager.playVentEnter?.();
        rendererEngine.addScreenShake?.(0.12, 0.1);
        window.HiveSystems?.vfx?.burst(this.x, this.z, 0x64748b, 10, 0.08, 1.0);
        showToast('PAROI & PLAFOND ACTIF [Q] : Suspendu aux superstructures ! Chute mortelle prête [ESPACE].');
        appendSensorLog('[TRAQUE 3D] Escalade aux poutrelles du plafond. Angle mort total des patrouilles.', 'stealth');
        window.HiveSystems?.vfx?.floatingText?.(this.x, 6.2, this.z, 'SUSPENDU AU PLAFOND [Q]', '#38bdf8', true);
      } else {
        this.mesh?.position.set(this.x, 0, this.z);
        if (this.detailedModel) {
          this.detailedModel.rotation.x = this.isProwling ? 0.42 : 0;
          this.detailedModel.position.y = this.isProwling ? -0.35 : 0;
        }
        audioManager.playWetImpact?.(this.x, this.z);
        showToast('DESCENTE AU SOL [Q] : Posture au sol rétablie.');
        appendSensorLog('[TRAQUE 3D] Descente furtive sur le pont.', 'bio');
      }
    }

    dropFromCeiling(target = null) {
      if (!this.isCeilingProwling) return false;
      this.isCeilingProwling = false;
      this.mesh?.position.set(this.x, 0, this.z);
      if (this.detailedModel) {
        this.detailedModel.rotation.x = this.isProwling ? 0.42 : 0;
        this.detailedModel.position.y = this.isProwling ? -0.35 : 0;
      }
      audioManager.playBoneCrunch?.();
      audioManager.playXenoRoar?.();
      rendererEngine.addScreenShake?.(0.48, 0.28);
      window.HiveSystems?.vfx?.burst(this.x, this.z, 0xef4444, 22, 0.18, 1.8);
      window.HiveSystems?.vfx?.ring?.(this.x, this.z, 0xef4444, 5.5);

      if (target) {
        const dropDmg = 120;
        target.takeDamage(dropDmg, this);
        target.staggerTimer = 1.3;
        window.HiveSystems?.vfx?.floatingText?.(target.x, 2.5, target.z, `-${dropDmg} CHUTE MORTELLE !`, '#ef4444', true);
        showToast(`CHUTE MORTELLE DU PLAFOND ! ${target.name} broyé sous l'impact !`);
        appendSensorLog(`[AMBUSH VERTICALE] Plongeon foudroyant sur ${target.name}. Dommages critiques.`, 'alert');
      } else {
        showToast('Atterrissage lourd sur le pont.');
      }
      return true;
    }

    // Chantier 27 : Réflexe d'Empalement Vertical Suspendu & Kidnapping au Plafond (Alien 1979 - Brett)
    executeCeilingImpale(target = null) {
      if (!this.isCeilingProwling) return false;
      const humans = window.gameInstance?.humans || [];
      const victim = target || humans.filter((h) => (
        !h.isIncapacitated && !h.isCocooned &&
        Math.hypot(h.x - this.x, h.z - this.z) <= 5.8
      )).sort((a, b) => Math.hypot(a.x - this.x, a.z - this.z) - Math.hypot(b.x - this.x, b.z - this.z))[0];

      if (!victim) {
        showToast("Aucune proie directement sous votre surplomb (5.8m). Patientez au plafond [Q] qu'elle passe sous vous !");
        return false;
      }

      audioManager.playInnerJawSnap?.(victim.x, victim.z);
      audioManager.playWetImpact?.(victim.x, victim.z);
      audioManager.playCocoonWeave?.(victim.x, victim.z);
      rendererEngine.addScreenShake?.(0.35, 0.2);
      window.HiveSystems?.vfx?.burst?.(victim.x, victim.z, 0xef4444, 25, 0.16, 1.8);
      window.HiveSystems?.vfx?.beam?.(this.x, 5.85, this.z, victim.x, 0.8, victim.z, 0x0c121e);

      victim.takeDamage?.(140, this);
      victim.isCocooned = true;
      victim.isIncapacitated = true;
      if (victim.mesh) {
        victim.mesh.position.y = 5.2; // Hissé au plafond !
        victim.mesh.rotation.x = Math.PI;
      }

      showToast(`KIDNAPPING VERTICAL SILENCIEUX ! ${victim.name} empalé et hissé dans la pénombre des combles (Brett 1979) !`);
      appendSensorLog(`[KIDNAPPING PLAFOND] ${victim.name} soustrait à la patrouille sans un bruit. Zéro alerte sonore.`, 'stealth');
      window.HiveSystems?.vfx?.floatingText?.(victim.x, 3.2, victim.z, 'ENLÈVEMENT SILENCIEUX DU PLAFOND', '#38bdf8', true);
      return true;
    }

    // Chantier 31 : Immersion Aquatique Furtive & Nage Ondulatoire (Alien: Resurrection)
    toggleAquaticImmersion() {
      if (!stationMap.isInFloodedZone(this.x, this.z)) {
        showToast("Immersion impossible : vous n'êtes pas dans le bassin inondé du Sous-Niveau 3.");
        return false;
      }
      this.isSubmerged = !this.isSubmerged;
      if (this.isSubmerged) {
        audioManager.playUnderwaterWhoosh?.(this.x, this.z);
        audioManager.playWaterSplashHeavy?.(this.x, this.z);
        window.HiveSystems?.vfx?.burst?.(this.x, this.z, 0x0284c7, 18, 0.1, 1.2);
        if (this.mesh) this.mesh.position.y = -0.3;
        showToast("IMMERSION AQUATIQUE [U] ACTIVÉE : Vitesse +35%, furtivité absolue sous l'eau (Alien: Resurrection) !");
        appendSensorLog(`[AQUATIQUE] Prédateur immergé dans le bassin de traitement. Profil hydrodynamique furtif.`, 'stealth');
      } else {
        audioManager.playWaterSplashHeavy?.(this.x, this.z);
        if (this.mesh) this.mesh.position.y = 0;
        showToast("Émergence hors de l'eau.");
      }
      return true;
    }

    executeAquaticAmbush(target = null) {
      if (!stationMap.isInFloodedZone(this.x, this.z)) return false;
      const humans = window.gameInstance?.humans || [];
      const victim = target || humans.filter((h) => (
        !h.isIncapacitated && !h.isCocooned &&
        stationMap.isInFloodedZone(h.x, h.z) &&
        Math.hypot(h.x - this.x, h.z - this.z) <= 6.5
      )).sort((a, b) => Math.hypot(a.x - this.x, a.z - this.z) - Math.hypot(b.x - this.x, b.z - this.z))[0];

      if (!victim) return false;

      audioManager.playWaterSplashHeavy?.(victim.x, victim.z);
      audioManager.playInnerJawSnap?.(victim.x, victim.z);
      audioManager.playUnderwaterWhoosh?.(victim.x, victim.z);
      rendererEngine.addScreenShake?.(0.38, 0.22);
      window.HiveSystems?.vfx?.burst?.(victim.x, victim.z, 0x0284c7, 30, 0.2, 1.8);
      window.HiveSystems?.vfx?.burst?.(victim.x, victim.z, 0xef4444, 20, 0.15, 1.2);

      victim.takeDamage?.(160, this);
      victim.isIncapacitated = true;
      if (victim.mesh) {
        victim.mesh.position.y = 0.15;
        victim.mesh.rotation.z = Math.PI / 2;
      }
      showToast(`EMBUSCADE AQUATIQUE FATALE ! ${victim.name} a été saisi par les jambes et entraîné sous la surface (Resurrection 1997) !`);
      appendSensorLog(`[EMBUSCADE AQUATIQUE] ${victim.name} noyé silencieusement sous la surface. Zéro coup de feu tiré.`, 'stealth');
      window.HiveSystems?.vfx?.floatingText?.(victim.x, 2.5, victim.z, 'NOYADE AQUATIQUE SILENCIEUSE (1:1)', '#38bdf8', true);
      return true;
    }

    // Chantier 36 : Implantation Orale Directe par les Mandibules (Canon AvP Requiem)
    executeOralImplantation(target = null) {
      if (this.caste !== 'predalien') return false;
      const humans = window.gameInstance?.humans || [];
      const victim = target || humans.filter((h) => (
        (h.isIncapacitated || h.hp <= 0) && !h.isCocooned && !h.isConsumedByCycle &&
        Math.hypot(h.x - this.x, h.z - this.z) <= 3.8
      )).sort((a, b) => Math.hypot(a.x - this.x, a.z - this.z) - Math.hypot(b.x - this.x, b.z - this.z))[0];

      if (!victim) {
        showToast("Approchez-vous d'une proie neutralisée (3.8m) pour l'insémination orale directe [G].");
        return false;
      }

      audioManager.playPredalienRoar?.(this.x, this.z);
      audioManager.playWetImpact?.(victim.x, victim.z);
      rendererEngine.addScreenShake?.(0.32, 0.2);
      window.HiveSystems?.vfx?.burst?.(victim.x, victim.z, 0xa89f88, 26, 0.18, 1.6);
      window.HiveSystems?.vfx?.burst?.(victim.x, victim.z, 0x22c55e, 16, 0.12, 1.2);

      victim.isCocooned = true;
      victim.isIncapacitated = true;
      victim.oralImpregnated = true;
      if (victim.mesh) {
        victim.mesh.rotation.z = Math.PI / 2;
        victim.mesh.position.y = 0.3;
      }

      const stage = window.gameInstance?.currentStage;
      if (stage) {
        stage.hiveBiomass = (stage.hiveBiomass || 0) + 35;
      }
      showToast(`IMPLANTATION ORALE DIRECTE (PREDALIEN 1:1) : Mandibules déployées, embryons multiples injectés (+35 Biomasse) !`);
      appendSensorLog(`[PREDALIEN] Fécondation directe de ${victim.name}. Élimination du besoin d'Ovomorphe intermédiaire.`, 'bio');
      window.HiveSystems?.vfx?.floatingText?.(victim.x, 2.8, victim.z, 'IMPLANTATION ORALE MULTIPLE (+35 BIOMASSE)', '#f59e0b', true);
      return true;
    }

    // Chantier 40 : Piratage Terminal Seegson / Mémoire Androïde (Alien: Isolation)
    executeHackTerminal() {
      // Chantier 47 : Extraction du demi-synthétique rampant s'il est à portée
      if (stationMap.extractBisectedAndroid?.()) return true;

      const terminals = stationMap.seegsonTerminals || [];
      const term = terminals.find((t) => !t.isHacked && Math.hypot(t.x - this.x, t.z - this.z) <= 3.8);
      if (term) {
        stationMap.hackSeegsonTerminal(term);
        return true;
      }
      const synths = (window.gameInstance?.humans || []).filter((h) => (
        (h.type === 'synthetic' || h.type === 'android') && h.isIncapacitated &&
        Math.hypot(h.x - this.x, h.z - this.z) <= 3.8
      ));
      if (synths.length > 0) {
        const s = synths[0];
        audioManager.playTunerHackBeep?.(s.x, s.z);
        audioManager.playSyntheticGlitchedVoice?.(s.x, s.z);
        window.HiveSystems?.vfx?.burst?.(s.x, s.z, 0x38bdf8, 20, 0.15, 1.4);
        showToast(`MÉMOIRE SYNTHÉTIQUE EXTRAITE : Codes d'accès Weyland-Yutani de ${s.name} décryptés ! Caméras désactivées !`);
        stationMap.securityCameras?.forEach((c) => { c.isDestroyed = true; if (c.mesh) rendererEngine.removeObject(c.mesh); });
        return true;
      }
      showToast("Aucun terminal Seegson ou synthétique neutralisé à portée (3.8m) pour le piratage [K].");
      return false;
    }

    // Chantier 49 : Éventration de Planchers & Embûches par les Grilles de Sol (Aliens 1986 / Alien 3)
    executeSubfloorAmbush() {
      const grates = stationMap.subfloorGrates || [];
      const nearbyGrate = grates.find((g) => Math.hypot(g.x - this.x, g.z - this.z) <= 3.8);

      if (!nearbyGrate && !this.isSubfloorProwling) {
        showToast("Aucune grille de plancher technique à portée (3.8m) pour l'embuscade [J].");
        return false;
      }

      if (this.isSubfloorProwling) {
        // Déjà sous le plancher : vérifier si un humain passe à proximité pour l'agripper par les chevilles
        const victim = (window.gameInstance?.humans || []).find((h) => !h.isIncapacitated && !h.isCocooned && Math.hypot(h.x - this.x, h.z - this.z) <= 3.6);
        if (victim) {
          audioManager.playGrateBurstCrash?.(victim.x, victim.z);
          rendererEngine.addScreenShake?.(0.38, 0.25);
          window.HiveSystems?.vfx?.burst?.(victim.x, victim.z, 0xef4444, 30, 0.22, 2.0);
          victim.takeDamage?.(150, this);
          victim.isCocooned = true;
          victim.isIncapacitated = true;
          if (victim.mesh) victim.mesh.position.y = -0.5;
          window.HiveSystems?.vfx?.floatingText?.(victim.x, 2.2, victim.z, 'HAPPÉ PAR LES CHEVILLES (SOUS-PLANCHER 1:1) !', '#ef4444', true);
          showToast("ÉVENTRATION DE PLANCHER RÉUSSIE : Cible entraînée sous les caillebotis métalliques !");
          this.isSubfloorProwling = false;
          if (this.mesh) this.mesh.position.y = 0;
          return true;
        } else {
          // Remonter à la surface
          this.isSubfloorProwling = false;
          if (this.mesh) this.mesh.position.y = 0;
          showToast("Vous remontez du sous-plancher technique.");
          return true;
        }
      } else {
        // Plonger sous le plancher
        this.isSubfloorProwling = true;
        this.x = nearbyGrate.x;
        this.z = nearbyGrate.z;
        if (this.mesh) this.mesh.position.y = -0.65;
        audioManager.playGrateBurstCrash?.(this.x, this.z);
        showToast("EMBUSCADE SOUS-PLANCHER [J] ACTIVE : Embusqué sous la grille ! Attendez qu'une proie approche.");
        return true;
      }
    }

    // Chantier 44 : Morsure perforante à la mâchoire prémaxillaire déboîtable (Prometheus 2012)
    executePremaxillaryBite(target = null) {
      const victim = target || (window.gameInstance?.humans || []).find((h) => !h.isIncapacitated && !h.isCocooned && Math.hypot(h.x - this.x, h.z - this.z) <= 4.2);
      if (!victim) return false;
      audioManager.playInnerJawPunch?.(victim.x, victim.z);
      audioManager.playWetImpact?.(victim.x, victim.z);
      rendererEngine.addScreenShake?.(0.32, 0.2);
      window.HiveSystems?.vfx?.burst?.(victim.x, victim.z, 0x38bdf8, 22, 0.16, 1.4);
      victim.takeDamage?.(140, this);
      window.HiveSystems?.vfx?.floatingText?.(victim.x, 2.4, victim.z, 'MÂCHOIRE PRÉMAXILLAIRE (140 PERFORATION) !', '#38bdf8', true);
      showToast("MÂCHOIRE PRÉMAXILLAIRE DÉBOÎTÉE : Frappe perforante de Deacon infligée !");
      return true;
    }

    // Chantier 51 : Fringale Frénétique du Néomorphe (Alien: Covenant 2017)
    executeNeomorphFrenzy(target = null) {
      if (this.adultCaste !== 'neomorph') {
        showToast('Capacité Fringale réservée au phénotype Néomorphe.');
        return false;
      }
      const victim = target || (window.gameInstance?.humans || []).find((h) => !h.isIncapacitated && !h.isCocooned && Math.hypot(h.x - this.x, h.z - this.z) <= 5.5);
      if (!victim) {
        showToast('Aucune proie à portée de bond (5.5m) pour la Fringale [B].');
        return false;
      }

      audioManager.playNeomorphHiss?.(this.x, this.z);
      audioManager.playWetImpact?.(victim.x, victim.z);
      rendererEngine.addScreenShake?.(0.35, 0.22);
      window.HiveSystems?.vfx?.burst?.(victim.x, victim.z, 0xef4444, 30, 0.2, 1.8);

      // Bond éclair sur la victime et frappe frénétique au stylet de queue
      this.x = victim.x - Math.cos(this.mesh?.rotation?.y || 0) * 1.1;
      this.z = victim.z - Math.sin(this.mesh?.rotation?.y || 0) * 1.1;
      victim.takeDamage?.(135, this);
      if (victim.staggerTimer !== undefined) victim.staggerTimer = 1.5;

      window.HiveSystems?.vfx?.floatingText?.(victim.x, 2.8, victim.z, 'FRINGALE NÉOMORPHE (135 DÉGÂTS) !', '#f1f5f9', true);
      showToast(`FRINGALE DU NÉOMORPHE [B] : Bond féroce et déchiquetage au stylet de queue sur ${victim.name} !`);
      appendSensorLog(`[NÉOMORPHE] Attaque frénétique à haute vélocité. ${victim.name} éventré.`, 'bio');
      return true;
    }

    // Chantier 56 : Ralliement Phéromonal Royal du Praetorian (Aliens 1986 / AvP)
    executePraetorianRoar() {
      if (this.adultCaste !== 'praetorian' && this.adultCaste !== 'queen' && this.adultCaste !== 'palatine') {
        showToast('Capacité Cri de Ralliement réservée aux castes Royales & Praetorian.');
        return false;
      }

      audioManager.playPraetorianBattleRoar?.(this.x, this.z);
      rendererEngine.addScreenShake?.(0.42, 0.35);
      window.HiveSystems?.vfx?.burst?.(this.x, this.z, 0xd946ef, 45, 0.35, 3.2);
      window.HiveSystems?.vfx?.ring?.(this.x, this.z, 0xd946ef, 18);

      // Boost phéromonal de toute la ruche : vitesse +40% et résistance doublée pendant 8s
      this.praetorianFrenzyTimer = 8.0;
      window.HiveSystems?.vfx?.floatingText?.(this.x, 3.2, this.z, 'RALLIEMENT PHÉROMONAL ROYAL (+40% SPEED, -50% DÉGÂTS) !', '#d946ef', true);
      showToast('RUGISSEMENT DU PRAETORIAN [R] : La ruche entière est galvanisée par l’impulsion royale !');
      appendSensorLog('[PRAETORIAN] Rugissement phéromonal alpha. Ruche en frénésie de combat.', 'bio');

      const hiveAllies = (window.gameInstance?.currentStage?.rtsUnits || []);
      hiveAllies.forEach((u) => {
        if (!u.isDestroyed) {
          u.rallyTimer = 8.0;
          window.HiveSystems?.vfx?.burst?.(u.x, u.z, 0xd946ef, 12, 0.15, 1.2);
        }
      });
      return true;
    }

    // Chantier 59 : Implantation Oviducte Directe sur Proie Agonique (Alien: Romulus / Comics)
    executeDirectInoculation(target = null) {
      const humans = window.gameInstance?.humans || [];
      const victim = target || humans.find((h) => (
        !h.isCocooned && !h.isConsumedByCycle && !h.directInoculated &&
        (h.isIncapacitated || h.stress >= 80 || h.hp <= 35) &&
        Math.hypot(h.x - this.x, h.z - this.z) <= 4.2
      ));

      if (!victim) {
        showToast('Aucune proie agonique ou terrorisée à portée (4.2m) pour l’Inoculation Directe [G].');
        return false;
      }

      audioManager.playOviductInoculation?.(victim.x, victim.z);
      rendererEngine.addScreenShake?.(0.25, 0.18);
      window.HiveSystems?.vfx?.burst?.(victim.x, victim.z, 0xef4444, 25, 0.2, 1.6);

      victim.directInoculated = true;
      victim.isIncapacitated = true;
      victim.directInoculationTimer = 15.0; // Éclosion ultra-rapide en 15s

      window.HiveSystems?.vfx?.floatingText?.(victim.x, 2.6, victim.z, 'INOCULATION OVIDUCTE IN-SITU (15s) !', '#ef4444', true);
      showToast(`IMPLANTATION OVIDUCTE DIRECTE [G] : Embryon inséminé in-situ dans la gorge de ${victim.name} !`);
      appendSensorLog(`[OVIDUCTE] Inoculation directe sur ${victim.name}. Éclosion programmée dans 15 secondes.`, 'bio');
      return true;
    }

    // Chantier 52 : Création de Leurre Acoustique sur le Motion Tracker M314 (Aliens 1986 / Isolation)
    executeAcousticDecoy() {
      stationMap.createAcousticDecoy?.(this.x, this.z);
      return true;
    }

    // Chantier 61 & 65 : Impulsion Télépathique de Commandement de l'Alpha (Marvel Comics: Alien: Bloodlines)
    executeAlphaPsychicCommand(target = null) {
      if (this.adultCaste !== 'alpha' && this.adultCaste !== 'queen') {
        showToast('Capacité Impulsion Télépathique réservée à l’Alpha et à la Reine.');
        return false;
      }
      const humans = window.gameInstance?.humans || [];
      const victim = target || humans.find((h) => !h.isIncapacitated && !h.isCocooned && Math.hypot(h.x - this.x, h.z - this.z) <= 14);

      stationMap.orderSwarmers(victim ? victim.x : this.x, victim ? victim.z : this.z, victim);

      // Étourdissement mental des humains dans le cône psychique
      humans.forEach((h) => {
        if (h.isIncapacitated || h.isCocooned) return;
        const d = Math.hypot(h.x - this.x, h.z - this.z);
        if (d <= 14) {
          h.staggerTimer = 2.0;
          h.stress = 100;
          window.HiveSystems?.vfx?.floatingText?.(h.x, 2.8, h.z, 'CHOC PSYCHIQUE ALPHA !', '#dc2626', true);
        }
      });
      return true;
    }

    // Chantier 70 : Fouet Bifide de Queue Supersonique de l'Alpha (Marvel Comics)
    executeSupersonicTailSnap() {
      if (this.adultCaste !== 'alpha') {
        showToast('Capacité Fouet Supersonique réservée à l’Alpha.');
        return false;
      }
      audioManager.playSupersonicTailSnap?.(this.x, this.z);
      rendererEngine.addScreenShake?.(0.42, 0.28);
      window.HiveSystems?.vfx?.burst?.(this.x, this.z, 0xef4444, 35, 0.35, 2.4);

      const humans = window.gameInstance?.humans || [];
      let hits = 0;
      humans.forEach((h) => {
        if (h.isIncapacitated || h.isCocooned) return;
        const d = Math.hypot(h.x - this.x, h.z - this.z);
        if (d <= 8.5) {
          hits++;
          h.takeDamage?.(190, this);
          h.staggerTimer = 2.2;
          // Rétropulsion balistique
          const angle = Math.atan2(h.z - this.z, h.x - this.x);
          h.x += Math.cos(angle) * 3.5;
          h.z += Math.sin(angle) * 3.5;
          window.HiveSystems?.vfx?.burst?.(h.x, h.z, 0xef4444, 20, 0.2, 1.6);
          window.HiveSystems?.vfx?.floatingText?.(h.x, 3.2, h.z, '-190 FOUET SUPERSONIQUE !', '#ef4444', true);
        }
      });
      showToast(`FOUET BIFIDE SUPERSONIQUE [Y] : Onde de choc balistique ! ${hits} soldat(s) fauchés et repoussés !`);
      appendSensorLog(`[ALPHA] Frappe supersonique de queue balistique déployée. Arc 180° balayé.`, 'bio');
      return true;
    }

    // Chantier 62 : Invocation directe d'une Nuée de Swarmers (Marvel Comics: Alien: Icarus)
    executeSpawnSwarmerPack() {
      stationMap.spawnSwarmerPack(this.x, this.z);
      return true;
    }

    // Chantier 64 : Expansion de la Toile Vivante Hive Creep (Marvel Comics)
    executeSpreadHiveCreep() {
      stationMap.spreadHiveCreep(this.x, this.z);
      return true;
    }

    // Chantier 67 : Agonie Berserk "Death Throes Acid Nova" (Marvel Comics)
    triggerDeathThroes() {
      if (this.inDeathThroes) return;
      this.inDeathThroes = true;
      this.deathThroesTimer = 4.0;
      audioManager.playDeathThroesScreech?.(this.x, this.z);
      rendererEngine.addScreenShake?.(0.55, 0.4);
      window.HiveSystems?.vfx?.ring?.(this.x, this.z, 0xef4444, 9.0);
      showToast('AGONIE BERSERK (DEATH THROES) ! 4 SECONDES DE FUREUR AVANT LA NOVA D\'ACIDE !');
      appendSensorLog('[DEATH THROES] Xénomorphe en état d\'agonie berserk critique. Risque acide extrême.', 'alert');
    }

    toggleDragHost() {
      if (this.draggedHost) {
        showToast(`Hôte ${this.draggedHost.name} relâché au sol.`);
        this.draggedHost = null;
        return;
      }
      const humans = window.gameInstance?.humans || [];
      const incapacitated = humans.filter((h) => (
        (h.isIncapacitated || h.hp <= 0) && !h.isCocooned && !h.isConsumedByCycle &&
        Math.hypot(h.x - this.x, h.z - this.z) <= 4.0
      )).sort((a, b) => Math.hypot(a.x - this.x, a.z - this.z) - Math.hypot(b.x - this.x, b.z - this.z))[0];

      if (!incapacitated) {
        showToast('Aucun corps neutralisé à portée (4.0m) à traîner [V].');
        return;
      }
      this.draggedHost = incapacitated;
      showToast(`CORPS SAISI [V] : Vous traînez ${incapacitated.name}. Approchez d'une paroi pour l'emmurer [V ou F].`);
      appendSensorLog(`[CAPTURE] Proie ${incapacitated.name} saisie par les griffes. Transport vers le nid.`, 'bio');
    }

    wallCocoonDraggedHost() {
      if (!this.draggedHost) return false;
      const host = this.draggedHost;
      if (this.isCeilingProwling) {
        // Chantier 39 : Cocon suspendu aux poutrelles du plafond (Aliens 1986)
        stationMap.hangCeilingCocoon?.(host);
        host.isCocooned = true;
        host.isIncapacitated = true;
        if (host.mesh) host.mesh.position.y = 4.8;
        this.draggedHost = null;
        return true;
      }
      host.cocoonInResin();
      host.isCocooned = true;
      host.isIncapacitated = true;
      if (host.mesh) {
        host.mesh.rotation.set(0, 0, 0);
        host.mesh.position.y = 1.25;
      }
      window.HiveSystems?.vfx?.spawnWallCocoon?.(host.x, 0, host.z);
      window.HiveSystems?.vfx?.burst(host.x, host.z, 0x9d4edd, 20, 0.16, 1.6);
      audioManager.playWetImpact?.(host.x, host.z);
      audioManager.playAcidSizzle?.();
      this.draggedHost = null;
      return true;
    }

    executeAcidSpit(target = null) {
      if (this.form !== 'drone') return false;
      const angle = this.mesh ? this.mesh.rotation.y : 0;
      const targetPos = target ? { x: target.x, z: target.z } : {
        x: this.x + Math.sin(angle) * 9.5,
        z: this.z + Math.cos(angle) * 9.5
      };
      audioManager.playAcidSizzle?.();
      rendererEngine.addScreenShake?.(0.18, 0.12);
      this.triggerAttack('acid');

      const applyAcidImpact = () => {
        window.HiveSystems?.vfx?.spawnAcidPool?.(targetPos.x, targetPos.z, 2.2, 9.0);
        window.HiveSystems?.vfx?.burst(targetPos.x, targetPos.z, 0x39ff14, 22, 0.15, 1.6);
        audioManager.playAcidSizzle?.();
        const humans = window.gameInstance?.humans || [];
        humans.forEach((h) => {
          if (h.isIncapacitated || h.isCocooned) return;
          if (Math.hypot(h.x - targetPos.x, h.z - targetPos.z) <= 3.2) {
            h.takeDamage(42, this);
            h.staggerTimer = 0.9;
            window.HiveSystems?.vfx?.floatingText?.(h.x, 2.5, h.z, '-42 JET D\'ACIDE', '#39ff14', true);
          }
        });

        // Chantier 24 : Dissolution des soudures de portes par le jet d'acide
        stationMap.blastDoors?.forEach((door) => {
          if (door.isWelded && Math.hypot(door.x - targetPos.x, door.z - targetPos.z) <= 4.5) {
            stationMap.meltDoorWeld?.(door);
          }
        });

        // Chantier 35 : Neutralisation des pièges tripwire par le jet d'acide
        stationMap.tripwireTraps?.forEach((trap) => {
          if (trap.isArmed && Math.hypot(trap.x - targetPos.x, trap.z - targetPos.z) <= 3.8) {
            trap.isArmed = false;
            audioManager.playAcidSizzle?.(trap.x, trap.z);
            window.HiveSystems?.vfx?.burst?.(trap.x, trap.z, 0x39ff14, 16, 0.1, 1.2);
            window.HiveSystems?.vfx?.floatingText?.(trap.x, 2.0, trap.z, 'PIÈGE DISSOUT PAR L’ACIDE', '#39ff14', false);
            if (trap.mesh) trap.mesh.position.y = -0.5;
          }
        });

        // Chantier 33 : Destruction des caméras par le jet d'acide
        stationMap.securityCameras?.forEach((cam) => {
          if (!cam.isDestroyed && Math.hypot(cam.x - targetPos.x, cam.z - targetPos.z) <= 4.2) {
            cam.isDestroyed = true;
            audioManager.playGlassShatter?.(cam.x, cam.z);
            window.HiveSystems?.vfx?.burst?.(cam.x, cam.z, 0xef4444, 20, 0.15, 1.4);
            window.HiveSystems?.vfx?.floatingText?.(cam.x, 3.8, cam.z, 'CAMÉRA DISSOUTE', '#ef4444', true);
            if (cam.mesh) rendererEngine.removeObject(cam.mesh);
          }
        });

        // Chantier 32 : Si dans la zone Zéro-G, fait jaillir des orbes d'acide flottantes en suspension 3D (Alien: Romulus)
        if (stationMap.isInZeroGZone(targetPos.x, targetPos.z)) {
          for (let o = 0; o < 4; o++) {
            stationMap.spawnFloatingAcidOrb?.(targetPos.x + (Math.random() - 0.5) * 1.5, 1.5 + Math.random() * 1.5, targetPos.z + (Math.random() - 0.5) * 1.5);
          }
        }

        // Chantier 30 : Détonation en chaîne sur cuves cryogéniques
        stationMap.fuelTanks?.forEach((tank) => {
          if (!tank.isExploded && !tank.isVenting && Math.hypot(tank.x - targetPos.x, tank.z - targetPos.z) <= 3.8) {
            tank.isVenting = true;
            tank.ventTimer = 1.8;
            audioManager.playCryoVent?.(tank.x, tank.z);
            showToast("CUVE CRYOGÉNIQUE PERCÉE PAR L'ACIDE ! Dégazage sifflant...");
            window.HiveSystems?.vfx?.floatingText?.(tank.x, 3.5, tank.z, 'FUITE CRITIQUE !', '#38bdf8', true);
          }
        });

        // Chantier 23 : Destruction des tourelles UA 571-C
        stationMap.sentryTurrets?.forEach((turret) => {
          if (!turret.isDestroyed && Math.hypot(turret.x - targetPos.x, turret.z - targetPos.z) <= 3.8) {
            turret.hp -= 45;
            window.HiveSystems?.vfx?.floatingText?.(turret.x, 1.8, turret.z, '-45 ACIDE', '#39ff14', true);
            if (turret.hp <= 0) {
              turret.isDestroyed = true;
              audioManager.playGlassShatter?.(turret.x, turret.z);
              if (turret.mesh) rendererEngine.removeObject(turret.mesh);
              showToast(`${turret.name} DÉTRUITE PAR L'ACIDE !`);
              appendSensorLog(`[NEUTRALISATION] ${turret.name} fondue par le jet d'acide.`, 'bio');
            }
          }
        });

        // Chantier 26 : Neutralisation des balises ultrasoniques
        stationMap.ultrasonicBeacons?.forEach((beacon) => {
          if (!beacon.isDestroyed && Math.hypot(beacon.x - targetPos.x, beacon.z - targetPos.z) <= 3.8) {
            beacon.isDestroyed = true;
            if (beacon.mesh) rendererEngine.removeObject(beacon.mesh);
            audioManager.playGlassShatter?.(beacon.x, beacon.z);
            showToast("BALISE ULTRASONIQUE ENNEMIE PULVÉRISÉE PAR L'ACIDE !");
            appendSensorLog("[NEUTRALISATION] Balise ultrasonique détruite. Clarté sensorielle rétablie.", 'bio');
          }
        });
      };

      const projectileVfx = window.HiveSystems?.vfx;
      if (projectileVfx?.projectile) {
        projectileVfx.projectile({
          startX: this.x,
          startY: 2.2,
          startZ: this.z,
          endX: targetPos.x,
          endY: 0.1,
          endZ: targetPos.z,
          color: 0x39ff14,
          scale: 0.26,
          speed: 24,
          acid: true,
          onImpact: applyAcidImpact
        });
      } else {
        applyAcidImpact();
      }
      showToast('JET D\'ACIDE CAUSTIQUE [X] : Flaque corrosive créée au point d\'impact !');
      appendSensorLog('[ACIDE VOLATILE] Glande acide activée. Éjection d\'un jet moléculaire sous pression.', 'bio');
      return true;
    }

    executeTerrifyingHiss() {
      if (this.form !== 'drone') return;
      audioManager.playXenoHiss(this.x, this.z);
      audioManager.playInnerJawSnap(this.x, this.z);
      rendererEngine.addScreenShake?.(0.32, 0.22);
      window.HiveSystems?.vfx?.ring?.(this.x, this.z, 0x39ff14, 13);
      window.HiveSystems?.vfx?.burst(this.x, this.z, 0x39ff14, 20, 0.15, 1.5);
      window.HiveSystems?.vfx?.floatingText?.(this.x, 3.2, this.z, 'SIFFLEMENT TERRIFIANT [H]', '#39ff14', true);

      const humans = window.gameInstance?.humans || [];
      const affected = humans.filter((h) => !h.isIncapacitated && !h.isCocooned && Math.hypot(h.x - this.x, h.z - this.z) <= 13.5);
      affected.forEach((h) => {
        h.staggerTimer = 2.8;
        if (h.type === 'synthetic' || h.type === 'android') {
          showToast(`Synthétique ${h.name} : Traitement des capteurs sonores saturé par le sifflement !`);
        } else {
          window.HiveSystems?.vfx?.floatingText?.(h.x, 2.5, h.z, 'TERREUR INTENSE !', '#ef4444', true);
        }
      });
      showToast(`SIFFLEMENT DÉCLENCHÉ ! ${affected.length} patrouilles paralysées de terreur !`);
      appendSensorLog(`[TERREUR ACOUSTIQUE] Sifflement bio-acoustique émis. Panique aiguë infligée aux patrouilles.`, 'alert');
    }

    toggleProwlStance() {
      if (this.form !== 'drone') return;
      this.isProwling = !this.isProwling;
      const profile = this.getAdultProfile();
      const isRunner = this.adultCaste === 'runner';
      if (this.isProwling) {
        this.speed = profile.speed * (isRunner ? 1.35 : 1.25);
        if (this.detailedModel) {
          this.detailedModel.rotation.x = isRunner ? 0.08 : 0.42;
          this.detailedModel.position.y = isRunner ? -0.15 : -0.35;
        }
        showToast(isRunner
          ? 'SPRINT QUADRUPÈDE RUNNER ACTIF [Z] : Vitesse maximale (Alien 3), portée de bond 10.5m [K] !'
          : 'TRAQUE AU SOL ACTIVE [Z] : Silhouette basse, vitesse +25%, détection réduite.');
        appendSensorLog(isRunner
          ? '[POSTURE RUNNER] Galop quadrupède ras du sol déclenché.'
          : '[POSTURE] Passage en traque quadrupède furtive.', 'bio');
      } else {
        this.speed = profile.speed;
        if (this.detailedModel) {
          this.detailedModel.rotation.x = 0;
          this.detailedModel.position.y = 0;
        }
        showToast(isRunner ? 'ALLURE DE TRAQUE STANDARD [Z]' : 'POSTURE BIPÈDE REDRESSÉE [Z]');
        appendSensorLog('[POSTURE] Retour en posture de déplacement standard.', 'bio');
      }
    }

    executeProwlLeap(target = null) {
      if (this.form !== 'drone') return false;
      const isRunner = this.adultCaste === 'runner';
      const isWarrior = this.adultCaste === 'warrior';
      const isProwler = this.adultCaste === 'prowler';

      const leapDist = isRunner ? 10.5 : (isProwler ? 9.0 : (isWarrior ? 6.5 : 7.5));
      const angle = this.mesh ? this.mesh.rotation.y : 0;
      const destX = target ? target.x : (this.x + Math.sin(angle) * leapDist);
      const destZ = target ? target.z : (this.z + Math.cos(angle) * leapDist);
      if (stationMap.checkCollision(destX, destZ)) {
        showToast('Trajectoire de bond bloquée par un obstacle.');
        return false;
      }
      audioManager.playXenoRoar?.();
      rendererEngine.addScreenShake?.(isWarrior ? 0.42 : 0.28, 0.2);
      window.HiveSystems?.vfx?.burst?.(this.x, this.z, 0x39ff14, 16, 0.12, 1.2);
      this.triggerAttack('leap');

      const startPos = { x: this.x, z: this.z };
      this.x = destX;
      this.z = destZ;
      this.mesh?.position.set(destX, 0, destZ);

      window.HiveSystems?.vfx?.organicTrail?.(startPos.x, 1.5, startPos.z, destX, 1.5, destZ, isRunner ? 0xf59e0b : 0x39ff14);
      window.HiveSystems?.vfx?.burst?.(destX, destZ, 0xef4444, 24, 0.18, 1.8);
      window.HiveSystems?.vfx?.ring?.(destX, destZ, isRunner ? 0xf59e0b : 0x39ff14, 4.2);

      const hitHumans = (window.gameInstance?.humans || []).filter((h) => (
        !h.isIncapacitated && !h.isCocooned && Math.hypot(h.x - destX, h.z - destZ) <= (isWarrior ? 4.2 : 3.4)
      ));
      if (hitHumans.length > 0) {
        audioManager.playBoneCrunch?.();
        audioManager.playWetImpact?.(destX, destZ);
        hitHumans.forEach((victim) => {
          const pDmg = isWarrior ? 130 : (isRunner ? 110 : (isProwler ? 100 : 85));
          victim.takeDamage(pDmg, this);
          victim.staggerTimer = isWarrior ? 2.0 : (isRunner ? 1.5 : 1.25);
          const leapLabel = isRunner ? 'BOND QUADRUPÈDE' : (isWarrior ? 'CHARGE BRUTALE' : 'BOND PRÉDATEUR');
          window.HiveSystems?.vfx?.floatingText?.(victim.x, 2.5, victim.z, `-${pDmg} ${leapLabel} !`, '#ef4444', true);
        });
        showToast(isRunner
          ? `BOND FOUDROYANT RUNNER [K] ! ${hitHumans[0].name} plaqué et renversé au sol !`
          : (isWarrior
            ? `CHARGE D'ASSAUT GUERRIER [K] ! ${hitHumans[0].name} broyé sous l'impact !`
            : `BOND DE TRAQUE FOUDROYANT [K] ! ${hitHumans[0].name} fauché par surprise !`));
        appendSensorLog(`[BOND PRÉDATEUR] Rupture brutale de posture. Projection cinétique sur ${hitHumans.map(h => h.name).join(', ')}.`, 'bio');
      } else {
        showToast(isRunner ? 'Bond quadrupède longue portée réussi [K].' : 'Bond de traque réussi [K].');
      }
      return true;
    }

    getAdultProfile() {
      return ADULT_CASTE_PROFILES[this.adultCaste] || ADULT_CASTE_PROFILES.drone;
    }

    setAdultCaste(caste, restoreHealth = true) {
      this.adultCaste = ADULT_CASTE_PROFILES[caste] ? caste : 'drone';
      // Selecting the future morphology during implantation must not grant
      // adult statistics to the egg, Facehugger or juvenile forms.
      if (this.form !== 'drone') return;
      const profile = this.getAdultProfile();
      this.maxHealth = profile.maxHealth;
      this.speed = profile.speed;
      if (restoreHealth) this.health = this.maxHealth;
      if (this.mesh) this.createMesh();
    }

    clearMesh() {
      if (this.mesh) {
        rendererEngine.removeObject(this.mesh);
        this.mesh = null;
      }
      if (this.attachedHost) this.attachedHost.isRestrained = false;
      this.attachedHost = null;
      this.detailedModel = null;
    }

    createMesh() {
      this.clearMesh();
      const group = new THREE.Group();
      const factory = window.HiveModelFactory;
      let detailedModel = null;
      if (factory) {
        if (this.form === 'egg') detailedModel = factory.createEgg?.(this.eggIsOpen);
        else if (this.form === 'facehugger') detailedModel = factory.createFacehugger?.();
        else if (this.form === 'chestburster') detailedModel = factory.createChestburster?.(this.isChrysalis);
        else if (this.form === 'drone') detailedModel = factory.createAdult?.(this.adultCaste || 'drone');
      }
      if (detailedModel) {
        const modelScale = this.form === 'drone'
          ? 1.14
          : (this.form === 'facehugger'
            ? 0.92
            : (this.form === 'chestburster' ? (this.isChrysalis ? 1.55 : 0.94) : 1.05));
        detailedModel.scale.setScalar(modelScale);
        group.add(detailedModel);
        this.detailedModel = detailedModel;
        if (this.isProwling && this.form === 'drone') {
          detailedModel.rotation.x = 0.42;
          detailedModel.position.y = -0.35;
        }
        const lightColors = {
          egg: this.eggIsOpen ? 0xf59e0b : 0x39ff14,
          facehugger: 0xf59e0b,
          chestburster: this.isChrysalis ? 0xa855f7 : 0xef4444,
          drone: 0x39ff14
        };
        const identityLight = new THREE.PointLight(lightColors[this.form] || 0x39ff14, 2.4, 13);
        identityLight.position.set(0, this.form === 'drone' ? 3 : 1.8, 0);
        group.add(identityLight);
        group.traverse((child) => {
          if (!child.isMesh) return;
          child.castShadow = true;
          child.receiveShadow = true;
        });
        group.position.set(this.x, 0, this.z);
        rendererEngine.scene.add(group);
        this.mesh = group;
        return;
      }

      if (this.form === 'egg') {
        const eggGeo = new THREE.SphereGeometry(1.4, 16, 16);
        const eggMat = new THREE.MeshStandardMaterial({ color: 0x334155, emissive: 0x1e293b, roughness: 0.7 });
        const eggMesh = new THREE.Mesh(eggGeo, eggMat);
        eggMesh.scale.set(1, 1.4, 1);
        eggMesh.position.y = 1.2;
        group.add(eggMesh);

        const petalGroup = new THREE.Group();
        petalGroup.name = 'petals';
        for (let i = 0; i < 4; i++) {
          const petalGeo = new THREE.ConeGeometry(0.5, 0.8, 4);
          const petalMat = new THREE.MeshStandardMaterial({ color: 0x39ff14, emissive: 0x39ff14, emissiveIntensity: 0.9 });
          const petal = new THREE.Mesh(petalGeo, petalMat);
          const angle = (i * Math.PI) / 2;
          petal.position.set(Math.cos(angle) * (this.eggIsOpen ? 0.8 : 0.3), 2.4, Math.sin(angle) * (this.eggIsOpen ? 0.8 : 0.3));
          if (this.eggIsOpen) {
            petal.rotation.z = Math.cos(angle) * 0.5;
            petal.rotation.x = Math.sin(angle) * 0.5;
          }
          petalGroup.add(petal);
        }
        group.add(petalGroup);

        if (this.eggIsOpen) {
          const faceCoreGeo = new THREE.SphereGeometry(0.5, 8, 8);
          const faceCoreMat = new THREE.MeshStandardMaterial({ color: 0xd97706, emissive: 0xf59e0b, emissiveIntensity: 0.8 });
          const faceCore = new THREE.Mesh(faceCoreGeo, faceCoreMat);
          faceCore.position.y = 2.0;
          group.add(faceCore);
        }

        const eggLight = new THREE.PointLight(this.eggIsOpen ? 0xd97706 : 0x39ff14, this.eggIsOpen ? 3.5 : 2.0, 15);
        eggLight.position.set(0, 2.0, 0);
        group.add(eggLight);

      } else if (this.form === 'facehugger') {
        const geo = new THREE.SphereGeometry(0.7, 10, 10);
        const mat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, emissive: 0xb45309 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 0.7;
        group.add(mesh);

      } else if (this.form === 'chestburster') {
        if (this.isChrysalis) {
          const cocGeo = new THREE.SphereGeometry(1.4, 12, 12);
          const cocMat = new THREE.MeshStandardMaterial({ color: 0x581c87, emissive: 0x7e22ce, emissiveIntensity: 0.9, roughness: 0.2 });
          const cocoon = new THREE.Mesh(cocGeo, cocMat);
          cocoon.scale.set(1.1, 2.0, 1.1);
          cocoon.position.y = 1.4;
          group.add(cocoon);

          const cLight = new THREE.PointLight(0xa855f7, 3.0, 15);
          cLight.position.set(0, 1.5, 0);
          group.add(cLight);

        } else {
          const geo = new THREE.CylinderGeometry(0.25, 0.5, 1.8, 10);
          const mat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2, emissive: 0x991b1b, emissiveIntensity: 0.5 });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.rotation.z = Math.PI / 2;
          mesh.position.y = 0.5;
          group.add(mesh);

          const jawGeo = new THREE.ConeGeometry(0.25, 0.5, 4);
          const jawMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 });
          const jaw = new THREE.Mesh(jawGeo, jawMat);
          jaw.position.set(0.9, 0.5, 0);
          jaw.rotation.z = -Math.PI / 2;
          group.add(jaw);
        }

      } else if (this.form === 'drone') {
        const mat = new THREE.MeshStandardMaterial({
          color: 0x090d16, roughness: 0.1, metalness: 0.9, emissive: 0x3b0764, emissiveIntensity: 0.6
        });

        const headGeo = new THREE.SphereGeometry(0.8, 16, 16);
        const headMesh = new THREE.Mesh(headGeo, mat);
        headMesh.scale.set(0.8, 0.8, 2.4);
        headMesh.position.set(0, 3.2, -0.6);
        group.add(headMesh);

        const torsoGeo = new THREE.CylinderGeometry(0.7, 0.5, 2.2, 10);
        const torsoMesh = new THREE.Mesh(torsoGeo, mat);
        torsoMesh.position.y = 1.8;
        group.add(torsoMesh);

        const tailGeo = new THREE.ConeGeometry(0.3, 3.8, 6);
        const tailMesh = new THREE.Mesh(tailGeo, mat);
        tailMesh.rotation.x = -Math.PI / 3;
        tailMesh.position.set(0, 1.2, -1.8);
        group.add(tailMesh);

        const xLight = new THREE.PointLight(0x39ff14, 2.5, 18);
        xLight.position.set(0, 2.5, 0);
        group.add(xLight);
      }

      group.position.set(this.x, 0, this.z);
      rendererEngine.scene.add(group);
      this.mesh = group;
    }

    setForm(form) {
      this.form = form;
      this.isLeaping = false;
      this.leapHost = null;
      this.leapComplete = null;
      this.isChrysalis = false;
      this.isDefeated = false;
      this.moveTarget = null;
      this.moveWaypoints = [];
      if (form === 'egg') {
        this.eggIsOpen = false;
        this.eggOpeningProgress = 1;
      }
      if (form === 'facehugger') {
        this.maxHealth = 100;
        this.speed = 0.50;
      } else if (form === 'chestburster') {
        this.maxHealth = 100;
        this.speed = 0.45;
      } else if (form === 'drone') {
        const profile = this.getAdultProfile();
        this.maxHealth = profile.maxHealth;
        this.speed = profile.speed;
      }
      this.health = this.maxHealth;
      this.createMesh();
    }

    takeDamage(amount) {
      if (this.isDefeated || this.form === 'egg' || !this.mesh?.visible) return;
      const actualDmg = Math.max(0, amount);
      this.health = Math.max(0, this.health - actualDmg);

      // Feedback d'impact viscéral
      audioManager.playAcidSizzle?.();
      audioManager.playBoneCrunch?.();
      rendererEngine.addScreenShake?.(0.24, 0.15);
      window.HiveSystems?.vfx?.burst(this.x, this.z, 0x39ff14, 18, 0.14, 1.25);
      window.HiveSystems?.vfx?.spawnAcidPool?.(this.x, this.z, 1.45, 9.0);
      stationMap.addAcidCorrosion?.(this.x, this.z, 1.8, 12.0);
      window.HiveSystems?.vfx?.floatingText?.(this.x, 2.0, this.z, `-${Math.ceil(actualDmg)}`, '#ef4444', false);

      // Canon 1:1 Lore — Projection de sang acide pressurisé sur les assaillants proches
      const nearbyHumans = (window.gameInstance?.humans || []).filter((h) => (
        !h.isIncapacitated && !h.isCocooned && Math.hypot(h.x - this.x, h.z - this.z) <= 4.0
      ));
      nearbyHumans.forEach((human) => {
        const acidDamage = Math.round(Math.max(12, actualDmg * 0.95));
        human.takeDamage(acidDamage, this);
        human.staggerTimer = 0.45;
        window.HiveSystems?.vfx?.floatingText?.(human.x, 2.4, human.z, `-${acidDamage} ACIDE`, '#39ff14', true);
        window.HiveSystems?.vfx?.burst(human.x, human.z, 0x39ff14, 12, 0.12, 1.0);
        if (human.type === 'synthetic' || human.type === 'android') {
          showToast(`Châssis synthétique de ${human.name} corrodé par le sang acide.`);
        } else {
          showToast(`PROJECTION D'ACIDE ! ${human.name} est aspergé de sang moléculaire !`);
        }
      });

      const profile = this.getAdultProfile();
      const formLabel = this.form === 'facehugger'
        ? 'FACEHUGGER'
        : (this.form === 'chestburster' ? 'CHESTBURSTER' : profile.label);
      setHudBar(
        'vital',
        `INTÉGRITÉ DU ${formLabel}`,
        (this.health / this.maxHealth) * 100,
        `${Math.ceil(this.health)}/${this.maxHealth}`
      );
      if (this.health <= 0) {
        if (!this.inDeathThroes && (this.adultCaste === 'alpha' || this.adultCaste === 'warrior' || this.adultCaste === 'praetorian')) {
          this.health = 1;
          this.triggerDeathThroes();
          return;
        }
        if (this.inDeathThroes) return;
        this.isDefeated = true;
        if (window.gameInstance) {
          window.gameInstance.showEndModal(
            `${formLabel} NEUTRALISÉ`,
            'Les forces de sécurité ont contenu l\'infestation. Recommencez le cycle pour adapter votre stratégie.'
          );
        }
      }
    }

    setMoveTarget(x, z) {
      if (this.form === 'egg' || this.isLeaping || this.attachedHost || this.isChrysalis) return;
      const padding = this.form === 'drone' ? 0.88 : (this.form === 'facehugger' ? 0.34 : 0.28);
      const path = stationMap.findPath(this.x, this.z, x, z, {
        step: 2.5,
        padding
      });
      this.moveWaypoints = path.slice();
      this.moveTarget = this.moveWaypoints.shift() || null;
      if (!this.moveTarget) showToast('Aucun passage accessible vers ce point.');
    }

    enterVent(vent) {
      if (this.isInVent || !vent) return;
      this.isInVent = true;
      this.currentVent = vent;
      audioManager.playVentEnter?.();
      window.HiveSystems?.vfx?.burst(this.x, this.z, 0x64748b, 12, 0.1, 1.2);
      if (this.mesh) {
        this.mesh.traverse((c) => {
          if (c.isMesh && c.material) {
            c.userData.origOpacity = c.material.opacity !== undefined ? c.material.opacity : 1.0;
            c.userData.origTrans = Boolean(c.material.transparent);
            c.material.transparent = true;
            c.material.opacity = 0.22;
          }
        });
      }
      showToast(`INFILTRATION DANS LE CONDUIT [${vent.name}] : Furtivité totale active ! Déplacez-vous à travers la station [C pour émerger].`);
      appendSensorLog(`[CONDUIT] Le xénomorphe a disparu dans le réseau de ventilation via ${vent.name}. Furtivité absolue.`, 'stealth');
      window.HiveSystems?.vfx?.floatingText?.(this.x, 2.5, this.z, 'FURTIVITÉ CONDUIT [C]', '#38bdf8', true);
    }

    exitVent(vent) {
      if (!this.isInVent) return;
      this.isInVent = false;
      this.x = vent.x;
      this.z = vent.z;
      this.mesh?.position.set(this.x, 0, this.z);
      if (this.mesh) {
        this.mesh.traverse((c) => {
          if (c.isMesh && c.material) {
            c.material.opacity = c.userData.origOpacity !== undefined ? c.userData.origOpacity : 1.0;
            c.material.transparent = c.userData.origTrans !== undefined ? c.userData.origTrans : false;
          }
        });
      }
      audioManager.playVentExit?.();
      rendererEngine.addScreenShake?.(0.35, 0.22);
      window.HiveSystems?.vfx?.burst(this.x, this.z, 0x94a3b8, 16, 0.14, 1.4);
      appendSensorLog(`[CONDUIT] Émergence brutale via ${vent.name} !`, 'alert');

      // Embuscade surprise sur les cibles humaines à proximité de la bouche d'aération
      const nearbyHumans = (window.gameInstance?.humans || []).filter((h) => (
        !h.isCocooned && !h.isIncapacitated && Math.hypot(h.x - this.x, h.z - this.z) <= 5.5
      ));
      if (nearbyHumans.length > 0) {
        audioManager.playXenoRoar?.();
        nearbyHumans.forEach((human) => {
          human.staggerTimer = 0.85; // Étourdissement de terreur
          const ambushDmg = this.form === 'drone' ? 75 : 30;
          human.takeDamage(ambushDmg, this);
          window.HiveSystems?.vfx?.floatingText?.(human.x, 2.5, human.z, `-${ambushDmg} EMBUSCADE CONDUIT !`, '#ef4444', true);
          window.HiveSystems?.vfx?.burst(human.x, human.z, 0xb91c1c, 14, 0.12, 1.4);
        });
        showToast('EMBUSCADE DU CONDUIT RÉUSSIE ! Ennemis terrifiés et lourdement blessés !');
      } else {
        showToast(`Émergence via ${vent.name}. Vous êtes de nouveau sur le pont de la station.`);
      }
    }

    setChrysalis(state) {
      this.isChrysalis = state;
      this.createMesh();
    }

    openEgg() {
      this.eggIsOpen = true;
      this.createMesh();
      this.eggOpeningProgress = 0;
      this.detailedModel?.userData?.setOpenProgress?.(0);
    }

    startLeapTo(host, onComplete, {
      duration = 0.62,
      arcHeight = 3.6,
      useFaceAnchor = true
    } = {}) {
      if (!host || !this.mesh || this.isLeaping) return false;
      this.moveTarget = null;
      this.isLeaping = true;
      this.leapElapsed = 0;
      this.leapDuration = Math.max(0.12, duration);
      this.leapArcHeight = Math.max(0, arcHeight);
      this.leapUsesFaceAnchor = useFaceAnchor;
      this.leapTrailCooldown = 0;
      this.leapStart = {
        x: this.x,
        y: this.mesh.position.y,
        z: this.z
      };
      this.leapHost = host;
      this.leapComplete = onComplete;
      return true;
    }

    attachToFace(host) {
      if (!host?.faceAnchor || !this.mesh) return false;
      this.isLeaping = false;
      this.x = host.x;
      this.z = host.z;
      this.mesh.parent?.remove(this.mesh);
      host.faceAnchor.add(this.mesh);
      this.mesh.position.set(0, 0, 0);
      this.mesh.rotation.set(Math.PI / 2, 0, Math.PI);
      this.detailedModel?.userData?.setFoldedPose?.(true);
      this.attachedHost = host;
      host.isRestrained = true;
      animateProceduralModel(this.mesh, { phase: 0, attack: 0.75, crouch: 0.5 });
      return true;
    }

    detachFromHost({ releaseHost = true, hide = false } = {}) {
      if (!this.mesh) return;
      const host = this.attachedHost;
      const worldPosition = new THREE.Vector3();
      this.mesh.getWorldPosition(worldPosition);
      this.mesh.parent?.remove(this.mesh);
      rendererEngine.scene.add(this.mesh);
      this.mesh.position.copy(worldPosition);
      this.mesh.rotation.set(0, 0, 0);
      this.detailedModel?.userData?.setFoldedPose?.(false);
      if (releaseHost && host) host.isRestrained = false;
      this.attachedHost = null;
      this.mesh.visible = !hide;
    }

    triggerAttack(type = 'melee') {
      this.actionType = type;
      this.actionAnimation = 1;
    }

    update(deltaSeconds = 1 / 60) {
      if (!this.mesh) return;
      const safeDelta = Math.max(0, deltaSeconds);
      this.actionAnimation = Math.max(0, this.actionAnimation - safeDelta * 3.4);

      // Chantier 67 : Fureur d'agonie berserk (Death Throes Acid Nova - Marvel Comics)
      if (this.inDeathThroes) {
        this.deathThroesTimer = (this.deathThroesTimer || 4.0) - safeDelta;
        if (Math.random() < 0.28) {
          window.HiveSystems?.vfx?.burst?.(this.x, this.z, 0xdc2626, 6, 0.15, 1.2);
          rendererEngine.addScreenShake?.(0.12, 0.08);
        }
        if (this.deathThroesTimer <= 0) {
          this.inDeathThroes = false;
          audioManager.playNapalmBarrelExplosion?.(this.x, this.z);
          audioManager.playDeathThroesScreech?.(this.x, this.z);
          rendererEngine.addScreenShake?.(0.85, 0.6);
          window.HiveSystems?.vfx?.burst?.(this.x, this.z, 0x84cc16, 90, 0.5, 4.0);
          window.HiveSystems?.vfx?.ring?.(this.x, this.z, 0x84cc16, 9.5);
          for (let i = 0; i < 8; i++) {
            const ang = (i / 8) * Math.PI * 2;
            stationMap.addAcidCorrosion?.(this.x + Math.cos(ang) * 4.5, this.z + Math.sin(ang) * 4.5);
          }
          const humans = window.gameInstance?.humans || [];
          humans.forEach((h) => {
            if (h.isIncapacitated || h.isCocooned) return;
            const d = Math.hypot(h.x - this.x, h.z - this.z);
            if (d <= 9.0) {
              h.takeDamage?.(140, this);
              window.HiveSystems?.vfx?.floatingText?.(h.x, 3.0, h.z, '-140 NOVA D\'ACIDE !', '#84cc16', true);
            }
          });
          showToast('NOVA D\'ACIDE FINALE DÉCLENCHÉE ! Le spécimen a libéré toute son acidité vitale.');
          appendSensorLog('[DEATH THROES] Nova acide libérée à 360° (rayon 9m, 140 dégâts). Destruction cataclysmique.', 'bio');
          this.health = 0;
          this.isDefeated = true;
          if (window.gameInstance) {
            window.gameInstance.showEndModal(
              'XÉNOMORPHE SACRIFIÉ (NOVA D\'ACIDE)',
              'Dans un baroud d\'honneur cataclysmique, votre organisme a anéanti la zone d\'opération sous un déluge d\'acide sulfurique.'
            );
          }
          return;
        }
      }

      if (this.form === 'egg') {
        if (this.eggIsOpen && this.eggOpeningProgress < 1) {
          this.eggOpeningProgress = Math.min(1, this.eggOpeningProgress + safeDelta / 0.9);
          const eased = 1 - Math.pow(1 - this.eggOpeningProgress, 3);
          this.detailedModel?.userData?.setOpenProgress?.(eased);
        }
        return;
      }

      if (this.isLeaping && this.leapHost) {
        this.leapElapsed = Math.min(this.leapDuration, this.leapElapsed + safeDelta);
        const progress = Math.min(1, this.leapElapsed / this.leapDuration);
        const eased = progress * progress * (3 - 2 * progress);
        const facePosition = this.leapUsesFaceAnchor
          ? this.leapHost.faceAnchor?.getWorldPosition?.(new THREE.Vector3())
          : null;
        const targetX = facePosition?.x ?? this.leapHost.x;
        const targetY = facePosition?.y ?? 0;
        const targetZ = facePosition?.z ?? this.leapHost.z;
        this.x = this.leapStart.x + (targetX - this.leapStart.x) * eased;
        this.z = this.leapStart.z + (targetZ - this.leapStart.z) * eased;
        const baseHeight = this.leapStart.y + (targetY - this.leapStart.y) * eased;
        const arcHeight = baseHeight + Math.sin(progress * Math.PI) * this.leapArcHeight;
        this.mesh.position.set(this.x, arcHeight, this.z);
        this.mesh.rotation.x = Math.sin(progress * Math.PI) * -0.35;
        this.mesh.rotation.y = Math.atan2(targetX - this.leapStart.x, targetZ - this.leapStart.z);
        animateProceduralModel(this.mesh, {
          phase: progress * Math.PI * 5,
          movement: 1,
          attack: progress
        });
        this.leapTrailCooldown -= safeDelta;
        if (this.leapTrailCooldown <= 0) {
          this.leapTrailCooldown = 0.09;
          window.HiveSystems?.vfx?.organicTrail(
            this.x,
            arcHeight + 0.4,
            this.z,
            this.leapStart.x,
            0.45,
            this.leapStart.z,
            0xd97706
          );
        }
        if (progress >= 1) {
          const callback = this.leapComplete;
          this.leapComplete = null;
          this.leapHost = null;
          callback?.();
        }
        return;
      }

      if (this.attachedHost) {
        this.x = this.attachedHost.x;
        this.z = this.attachedHost.z;
        animateProceduralModel(this.mesh, {
          phase: Date.now() * 0.01,
          attack: 0.72 + Math.sin(Date.now() * 0.012) * 0.16,
          crouch: 0.45
        });
        this.detailedModel?.userData?.setFoldedPose?.(true);
        const gripPulse = 1 + Math.sin(Date.now() * 0.014) * 0.018;
        const attachmentScale = 0.92 * gripPulse;
        this.detailedModel?.scale.setScalar(attachmentScale);
        if (this.mesh) this.mesh.rotation.y = Math.sin(Date.now() * 0.01) * 0.018;
        return;
      }

      if (this.form !== 'egg' && !this.isLeaping && !this.isChrysalis) {
        let { dx, dy } = inputManager.getMovementVector();
        let remainingDistance = Infinity;
        if (dx !== 0 || dy !== 0) {
          this.moveTarget = null;
          this.moveWaypoints = [];
        } else if (this.moveTarget) {
          let targetDistance = Math.hypot(this.moveTarget.x - this.x, this.moveTarget.z - this.z);
          if (targetDistance <= 0.5) {
            this.moveTarget = this.moveWaypoints.shift() || null;
            if (this.moveTarget) {
              targetDistance = Math.hypot(this.moveTarget.x - this.x, this.moveTarget.z - this.z);
            }
          }
          if (this.moveTarget && targetDistance > 0.5) {
            remainingDistance = targetDistance;
            dx = (this.moveTarget.x - this.x) / targetDistance;
            dy = (this.moveTarget.z - this.z) / targetDistance;
          }
        }
        const frameScale = safeDelta * 60;
        const resinBonus = (typeof resinGrid !== 'undefined' && resinGrid?.getResin?.(this.x, this.z) > 0) ? 1.25 : 1.0;
        const scentBonus = (window.pheromoneSystem?.getScentBonus?.(this.x, this.z)) || 1.0;
        const suppressionPenalty = (this.suppressionTimer > 0) ? 0.65 : 1.0;
        if (this.suppressionTimer > 0) this.suppressionTimer -= safeDelta;
        const deathThroesBonus = this.inDeathThroes ? 1.5 : 1.0;
        const creepBonus = this.isOnHiveCreep ? 1.2 : 1.0;
        const currentSpeed = this.speed * (this.isInVent ? 1.45 : 1.0) * resinBonus * scentBonus * suppressionPenalty * deathThroesBonus * creepBonus;
        const movementStep = Math.min(currentSpeed * frameScale, remainingDistance);
        const nextX = this.x + dx * movementStep;
        const nextZ = this.z + dy * movementStep;

        if (!stationMap.checkCollision(nextX, nextZ)) {
          this.x = nextX;
          this.z = nextZ;
          this.mesh.position.set(this.x, this.isCeilingProwling ? 5.85 : 0, this.z);
        } else if (this.moveTarget) {
          this.moveTarget = null;
          this.moveWaypoints = [];
        }

        if (dx !== 0 || dy !== 0) {
          this.mesh.rotation.y = Math.atan2(dx, dy);
        }

        // Suivi et traînée physique du corps de l'hôte capturé (Hadley's Hope 1:1)
        if (this.draggedHost && this.draggedHost.mesh) {
          const rotY = this.mesh.rotation.y;
          const dragDist = 1.6;
          const hostX = this.x - Math.sin(rotY) * dragDist;
          const hostZ = this.z - Math.cos(rotY) * dragDist;
          this.draggedHost.x = hostX;
          this.draggedHost.z = hostZ;
          this.draggedHost.mesh.position.set(hostX, 0.22, hostZ);
          this.draggedHost.mesh.rotation.z = Math.PI / 2;
        }

        if (this.isCeilingProwling) {
          this.mesh.position.y = 5.85;
        }

        // Canon H.R. Giger — Sécrétions de salive visqueuse perlant des mâchoires
        if (this.form === 'drone' && !this.isInVent && !this.isCeilingProwling) {
          this.salivaTimer = (this.salivaTimer || 0) - safeDelta;
          if (this.salivaTimer <= 0) {
            this.salivaTimer = 1.3 + Math.random() * 1.5;
            window.HiveSystems?.vfx?.salivaDrip(this.x, 2.7, this.z, 2);
          }
        }

        // Chantier 7 : Régénération biologique passive sur la bio-résine de la ruche
        if (typeof resinGrid !== 'undefined' && resinGrid?.getResin?.(this.x, this.z) > 0) {
          this.health = Math.min(this.maxHealth, this.health + 6 * safeDelta);
        }

        animateProceduralModel(this.mesh, {
          phase: Date.now() * (this.form === 'facehugger' ? 0.014 : 0.009),
          movement: dx !== 0 || dy !== 0 ? 1 : 0.08,
          attack: this.actionAnimation,
          pulse: this.form === 'chestburster' ? 0.4 : 0
        });
      } else if (this.isChrysalis) {
        animateProceduralModel(this.mesh, {
          phase: Date.now() * 0.006,
          pulse: 1
        });
      }
    }
  }

  const playerCreature = new PlayerCreature();

  class HumanAI {
    constructor(id, type, x, z, name = '') {
      this.id = id;
      this.type = type;
      this.name = name || type.toUpperCase();
      this.x = x; this.z = z;
      this.hp = ['powerloader', 'exosuit'].includes(type)
        ? 440
        : (['weyland_commando_mk2'].includes(type)
          ? 260
          : (['weyland_steel_team_synth', 'steelteam', 'steelteamsynth', 'steelteamandroid'].includes(type)
            ? 240
            : (['android', 'synthetic'].includes(type) ? 190 : (['smartgunner', 'gyro', 'commando'].includes(type) ? 140 : 110))));
      this.maxHp = this.hp;
      this.mesh = null;
      this.targetPos = { x, z };
      this.patrolOrigin = { x, z };
      this.aiState = 'PATROL';
      this.patrolWait = 0;
      this.isLured = false;
      this.isBursting = false;
      this.isInfected = false;
      this.infectionState = 'NONE';
      this.isRestrained = false;
      this.isCocooned = false;
      this.isIncapacitated = false;
      this.shootCooldown = 0;
      this.motionPingCooldown = 0.5 + Math.random();
      this.hostEligibility = ['android', 'synthetic', 'powerloader', 'exosuit', 'turret', 'weyland_steel_team_synth', 'steelteam', 'steelteamsynth', 'steelteamandroid'].includes(type)
        ? 'none'
        : (type === 'commando' ? 'protected' : 'viable');
      this.usedAsHost = false;
      this.isConsumedByCycle = false;
      this.characterKey = null;
      this.maskAttachments = 0;
      this.bossId = null;
      this.bossPhase = 0;
      this.bossShield = 0;
      this.faceAnchor = null;
      this.navigationGoal = null;
      this.pathWaypoints = [];
      this.navigationRepathTimer = 0;
      this.stuckTimer = 0;
      this.animationPhase = Math.random() * Math.PI * 2;
      this.attackAnimation = 0;
      this.staggerTimer = 0;
      this.footstepCooldown = 0;
      this.infectionCoughCooldown = 1.2 + Math.random() * 1.5;
      this.stress = 0; // Chantier 6 : Jauge de stress 0-100 & IA de Terreur
      this.panicTimer = 0;
      this.lastStressQuoteTime = 0;
      this.grenadeCooldown = 5.0 + Math.random() * 5.0; // Chantier 4 : Grenades M40 30mm commando
      this.powerloaderBeepTimer = 1.0 + Math.random() * 2.0; // Chantier 10 : Avertisseur P-5000
      this.choosePatrolWaypoint();
    }

    findFreeWaypoint(radius = 20) {
      for (let attempt = 0; attempt < 18; attempt++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 5 + Math.random() * Math.max(1, radius - 5);
        const x = Math.max(-69, Math.min(69, this.patrolOrigin.x + Math.cos(angle) * distance));
        const z = Math.max(-69, Math.min(69, this.patrolOrigin.z + Math.sin(angle) * distance));
        if (
          !stationMap.checkCollision(x, z) &&
          stationMap.hasLineOfSight(this.x, this.z, x, z, 0)
        ) {
          return { x, z };
        }
      }
      return { x: this.x, z: this.z };
    }

    choosePatrolWaypoint() {
      this.targetPos = this.findFreeWaypoint(20);
      this.aiState = 'PATROL';
      this.patrolWait = 0;
    }

    createMesh() {
      const group = new THREE.Group();
      const detailedModel = window.HiveModelFactory?.createHuman?.(this.type);
      if (detailedModel) {
        group.add(detailedModel);
        this.addFaceAnchor(group);
        group.position.set(this.x, 0, this.z);
        group.traverse((child) => {
          if (!child.isMesh) return;
          child.castShadow = true;
          child.receiveShadow = true;
        });
        rendererEngine.scene.add(group);
        this.mesh = group;
        return;
      }

      if (this.type === 'powerloader' || this.type === 'exosuit') {
        const mechGeo = new THREE.BoxGeometry(3.0, 4.5, 2.5);
        const mechMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.9, roughness: 0.2 });
        const mech = new THREE.Mesh(mechGeo, mechMat);
        mech.position.y = 2.25;
        group.add(mech);

        const clawGeo = new THREE.BoxGeometry(0.8, 1.8, 0.8);
        const clawMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 });
        const clawL = new THREE.Mesh(clawGeo, clawMat); clawL.position.set(-1.8, 2.0, 1.2);
        const clawR = new THREE.Mesh(clawGeo, clawMat); clawR.position.set(1.8, 2.0, 1.2);
        group.add(clawL); group.add(clawR);

        const pLight = new THREE.PointLight(0xeab308, 4.0, 25);
        pLight.position.set(0, 3.5, 0);
        group.add(pLight);

      } else {
        const bodyGeo = new THREE.CylinderGeometry(0.6, 0.6, 2.0, 8);
        let color = 0x38bdf8;
        if (['guard', 'marine', 'smartgunner', 'gyro', 'commando'].includes(this.type)) color = 0xf59e0b;
        if (['android', 'synthetic'].includes(this.type)) color = 0xf8fafc;
        if (['cleaner', 'incinerator'].includes(this.type)) color = 0xd97706;

        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4 });
        const mesh = new THREE.Mesh(bodyGeo, mat);
        mesh.position.y = 1.0;
        group.add(mesh);

        const headGeo = new THREE.SphereGeometry(0.4, 8, 8);
        const headMat = new THREE.MeshStandardMaterial({ color: ['android', 'synthetic'].includes(this.type) ? 0xe2e8f0 : 0xfde047 });
        const headMesh = new THREE.Mesh(headGeo, headMat);
        headMesh.position.y = 2.2;
        group.add(headMesh);
      }

      this.addFaceAnchor(group);
      group.position.set(this.x, 0, this.z);
      rendererEngine.scene.add(group);
      this.mesh = group;
    }

    addFaceAnchor(group) {
      const anchor = new THREE.Group();
      anchor.name = 'face_attachment_anchor';
      const helmetJoint = group.getObjectByName('helmet_and_comms');
      const labhoundHead = group.getObjectByName('labhound_head');
      const rodentHead = group.getObjectByName('rodent_head');
      if (helmetJoint) {
        anchor.position.set(0, 0, 0.43);
        helmetJoint.add(anchor);
      } else if (labhoundHead) {
        anchor.position.set(0, -0.02, 0.52);
        labhoundHead.add(anchor);
      } else if (rodentHead) {
        anchor.position.set(0, 0, 0.2);
        rodentHead.add(anchor);
      } else {
        anchor.position.set(0, 3.95, 0.43);
        group.add(anchor);
      }
      this.faceAnchor = anchor;
    }

    ensureFlashlight(active) {
      if (!this.mesh) return;
      if (!this.flashlight) {
        if (!active) return;
        const spot = new THREE.SpotLight(0xfff8e7, 3.8, 22, Math.PI / 4.5, 0.45, 1.2);
        spot.position.set(0.35, 1.9, 0.4);
        const targetObj = new THREE.Object3D();
        targetObj.position.set(0.35, 1.2, 12);
        this.mesh.add(spot);
        this.mesh.add(targetObj);
        spot.target = targetObj;
        this.flashlight = spot;
      }
      this.flashlight.intensity = active ? 3.8 : 0;
    }

    destroy() {
      if (this.flashlight) {
        if (this.flashlight.target && this.flashlight.target.parent) {
          this.flashlight.target.parent.remove(this.flashlight.target);
        }
        if (this.flashlight.parent) {
          this.flashlight.parent.remove(this.flashlight);
        }
        this.flashlight = null;
      }
      if (this.mesh) rendererEngine.removeObject(this.mesh);
      this.mesh = null;
    }

    getPrimaryMesh() {
      let primary = null;
      this.mesh?.traverse((child) => {
        if (!primary && child.isMesh && child.material) primary = child;
      });
      return primary;
    }

    takeDamage(dmg, attacker = null) {
      if (this.isCocooned || this.isIncapacitated) return false;
      let appliedDamage = Math.max(0, dmg);

      // MANTIS-4 reste un adversaire mécanique : conduites, blindage puis châssis exposé.
      if (this.bossId === 'MANTIS_4' && this.bossPhase === 1) {
        this.bossShield = Math.max(0, this.bossShield - appliedDamage);
        window.HiveSystems?.vfx?.burst(this.x, this.z, 0x38bdf8, 16, 0.12, 1.8);
        window.HiveSystems?.vfx?.floatingText(this.x, 3.4, this.z, `BLINDAGE -${Math.round(appliedDamage)}`, '#38bdf8');
        rendererEngine.addScreenShake?.(0.18);
        if (this.bossShield > 0) return true;
        this.bossPhase = 2;
        this.bossShield = 0;
        window.gameInstance?.currentStage?.onMantisPhaseChange?.(this, 2);
        return true;
      }
      if (this.bossId === 'MANTIS_4' && this.bossPhase === 2) {
        appliedDamage *= 0.55;
      }

      // Chantier 53 : Armure céramique et visière blindée anti-acide du Commando Weyland-Yutani MK-II
      if (this.type === 'weyland_commando_mk2' && (attacker === 'acid' || (attacker && attacker.isAcidSpit))) {
        window.HiveSystems?.vfx?.burst?.(this.x, this.z, 0xf59e0b, 10, 0.08, 0.8);
        window.HiveSystems?.vfx?.floatingText?.(this.x, 2.6, this.z, 'BLINDAGE CÉRAMIQUE ANTI-ACIDE MK-II !', '#f59e0b', true);
        return false;
      }

      // Chantier 34 : Vulnérabilité 1:1 canon — Déflagration thermobarique du réservoir dorsal M240
      if (['cleaner', 'incinerator'].includes(this.type) && attacker && !this.tankExploded) {
        const humanFacing = this.mesh ? this.mesh.rotation.y : 0;
        const angleToAttacker = Math.atan2(attacker.x - this.x, attacker.z - this.z);
        const angleDiff = Math.abs((((angleToAttacker - humanFacing) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
        if (angleDiff > 1.75 && appliedDamage >= 16) {
          this.tankExploded = true;
          this.hp = 0;
          appliedDamage = 999;
          audioManager.playGrenadeExplode?.(this.x, this.z);
          rendererEngine.addScreenShake?.(0.5, 0.3);
          window.HiveSystems?.vfx?.burst?.(this.x, this.z, 0xf97316, 45, 0.3, 2.8);
          window.HiveSystems?.vfx?.burst?.(this.x, this.z, 0xff8a16, 35, 0.25, 2.2);
          window.HiveSystems?.vfx?.ring?.(this.x, this.z, 0xf97316, 8.5);
          window.HiveSystems?.vfx?.floatingText?.(this.x, 3.4, this.z, 'DÉFLAGRATION DU RÉSERVOIR DORSAL M240 !', '#f97316', true);
          showToast(`POINT FAIBLE EXPLOITÉ (1:1 LORE) : Le réservoir de napalm de ${this.name} a explosé dans son dos !`);
          appendSensorLog(`[EXPLOSION] Réservoir de napalm dorsal M240 éventré par frappe arrière. Déflagration thermobarique.`, 'alert');

          const nearby = (window.gameInstance?.humans || []).filter((h) => h !== this && !h.isIncapacitated && Math.hypot(h.x - this.x, h.z - this.z) <= 7.5);
          nearby.forEach((victim) => {
            victim.takeDamage(65, this);
            victim.staggerTimer = 1.2;
            window.HiveSystems?.vfx?.floatingText?.(victim.x, 2.5, victim.z, '-65 SOUFFLE NAPALM', '#f97316', true);
          });
          this.incapacitate();
          return true;
        }
      }

      this.hp = Math.max(0, this.hp - appliedDamage);
      if (this.bossId === 'MANTIS_4' && this.bossPhase === 2 && this.hp <= this.maxHp * 0.5) {
        this.bossPhase = 3;
        window.gameInstance?.currentStage?.onMantisPhaseChange?.(this, 3);
      }

      // 1. Flash émissif vif sur l'ensemble des maillages de l'entité
      const isSteel = ['weyland_steel_team_synth', 'steelteam', 'steelteamsynth', 'steelteamandroid'].includes(this.type);
      const isSynth = this.type === 'synthetic' || this.type === 'android' || isSteel;
      const flashColor = isSynth ? 0xffffff : 0xef233c;
      const trackedMaterials = [];
      this.mesh?.traverse((child) => {
        if (child.isMesh && child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((mat) => {
            if (mat && mat.emissive) {
              trackedMaterials.push({
                mat,
                origHex: mat.emissive.getHex(),
                origIntensity: mat.emissiveIntensity !== undefined ? mat.emissiveIntensity : 1.0
              });
              mat.emissive.setHex(flashColor);
              mat.emissiveIntensity = 2.4;
            }
          });
        }
      });
      setTimeout(() => {
        trackedMaterials.forEach(({ mat, origHex, origIntensity }) => {
          if (mat && mat.emissive) {
            mat.emissive.setHex(origHex);
            mat.emissiveIntensity = origIntensity;
          }
        });
      }, 160);

      // 2. Recul physique et interruption (stagger)
      this.staggerTimer = 0.28;
      const fromX = attacker ? attacker.x : playerCreature.x;
      const fromZ = attacker ? attacker.z : playerCreature.z;
      const pushAngle = Math.atan2(this.z - fromZ, this.x - fromX);
      const pushDist = ['powerloader', 'exosuit'].includes(this.type) ? 0.25 : 0.72;
      const stepX = this.x + Math.cos(pushAngle) * pushDist;
      const stepZ = this.z + Math.sin(pushAngle) * pushDist;
      if (!stationMap.checkCollision(stepX, stepZ)) {
        this.x = stepX;
        this.z = stepZ;
        this.mesh?.position.set(this.x, this.mesh.position.y, this.z);
      }

      // 3. Effets de particules, texte de combat 3D et secousse
      const bloodColor = isSynth ? 0xe2e8f0 : 0xb91c1c;
      window.HiveSystems?.vfx?.burst(this.x, this.z, bloodColor, 14, 0.12, 1.4);
      window.HiveSystems?.vfx?.fleshImpact?.(this.x, this.z, bloodColor, 16);
      window.HiveSystems?.vfx?.floatingText(
        this.x,
        3.2,
        this.z,
        `-${Math.round(appliedDamage)}`,
        isSynth ? '#cbd5e1' : '#ef4444',
        appliedDamage >= 45
      );
      rendererEngine.addScreenShake?.(appliedDamage >= 40 ? 0.24 : 0.14);

      if (this.hp <= 0) {
        this.incapacitate();
      }
      return true;
    }

    incapacitate() {
      if (this.isIncapacitated) return;
      this.isIncapacitated = true;
      const isSteel = ['weyland_steel_team_synth', 'steelteam', 'steelteamsynth', 'steelteamandroid'].includes(this.type);
      const isSynth = this.type === 'synthetic' || this.type === 'android' || isSteel;
      if (isSynth) {
        if (this.mesh) {
          this.mesh.rotation.z = Math.PI / 2;
          this.mesh.position.y = 0.22;
          this.mesh.scale.y = 0.65;
        }
        audioManager.playSyntheticGlitchedVoice?.(this.x, this.z);
        window.HiveSystems?.vfx?.burst(this.x, this.z, 0xf8fafc, 26, 0.18, 1.8);
        if (isSteel) {
          const steelQuotes = [
            "Steel Team : Échec de la capture du spécimen... Protocole Weyland-Yutani compromis...",
            "Steel Team : Châssis endommagé... Priorité absolue aux échantillons génétiques...",
            "Steel Team : Défaillance interne critique... Lame plasma désactivée..."
          ];
          const quote = steelQuotes[Math.floor(Math.random() * steelQuotes.length)];
          window.HiveSystems?.narrative('STEEL TEAM (NEUTRALISÉ)', quote, 5000);
          showToast('SYNTHÉTIQUE STEEL TEAM SECTIONNÉ : Fuite abondante de fluide blanc laiteux.');
          appendSensorLog(`[STEEL TEAM] Commando synthétique ${this.name} démembré. Fluide de synthèse Weyland-Yutani au sol.`, 'bio');
        } else {
          const synthQuotes = [
            "Rook-7 : Admiration pour sa pureté... Organisme parfait...",
            "Rook-7 : Ordre Spécial 937... Toute autre considération secondaire...",
            "Rook-7 : Vous ne comprenez toujours pas à quoi vous avez affaire..."
          ];
          const quote = synthQuotes[Math.floor(Math.random() * synthQuotes.length)];
          window.HiveSystems?.narrative('ROOK-7 (DÉFAILLANT)', quote, 5000);
          showToast('SYNTHÉTIQUE SECTIONNÉ : Fuite de fluide blanc laiteux. Incompatible avec Facehuggers.');
          appendSensorLog(`[SYNTHÉTIQUE] ${this.name} démembré. Châssis inerte, fluide de synthèse au sol.`, 'bio');
        }
        return;
      }
      if (this.mesh) {
        this.mesh.rotation.z = Math.PI / 2;
        this.mesh.position.y = 0.3;
        const primary = this.getPrimaryMesh();
        if (primary && !Array.isArray(primary.material) && primary.material.color) primary.material.color.setHex(0x7f1d1d);
      }
    }

    cocoonInResin() {
      if (this.isCocooned) return false;
      this.isCocooned = true;
      this.isIncapacitated = true;
      if (this.mesh) {
        this.mesh.rotation.z = Math.PI / 2;
        this.mesh.position.y = 0.3;
        const primary = this.getPrimaryMesh();
        if (primary && !Array.isArray(primary.material) && primary.material.color) primary.material.color.setHex(0x9d4edd);
      }
      return true;
    }

    lureTowards(tx, tz) {
      this.isLured = true;
      this.aiState = 'LURED';
      this.planNavigation(tx, tz, true);
    }

    planNavigation(tx, tz, force = false) {
      if (
        !force &&
        this.navigationGoal &&
        Math.hypot(this.navigationGoal.x - tx, this.navigationGoal.z - tz) < 1
      ) {
        return;
      }
      this.navigationGoal = { x: tx, z: tz };
      this.pathWaypoints = stationMap.findPath(this.x, this.z, tx, tz);
      this.targetPos = this.pathWaypoints[0] || this.navigationGoal;
      this.navigationRepathTimer = 0.8;
      this.stuckTimer = 0;
    }

    updateNavigation(deltaSeconds) {
      if (!this.navigationGoal) return;
      this.navigationRepathTimer -= deltaSeconds;
      while (
        this.pathWaypoints.length > 0 &&
        Math.hypot(
          this.pathWaypoints[0].x - this.x,
          this.pathWaypoints[0].z - this.z
        ) < 0.8
      ) {
        this.pathWaypoints.shift();
      }
      this.targetPos = this.pathWaypoints[0] || this.navigationGoal;
    }

    collapseForBurst() {
      this.isBursting = true;
      if (this.mesh) {
        this.mesh.rotation.x = Math.PI / 2;
        this.mesh.position.y = 0.3;
        const primary = this.getPrimaryMesh();
        if (primary && !Array.isArray(primary.material) && primary.material.color) primary.material.color.setHex(0x991b1b);
      }
    }

    update(deltaSeconds = 1 / 60) {
      if (!this.mesh || this.isBursting || this.isCocooned || this.isIncapacitated) return;
      const safeDelta = Math.max(0, deltaSeconds);
      this.attackAnimation = Math.max(0, this.attackAnimation - safeDelta * 2.8);

      if (this.staggerTimer > 0) {
        this.staggerTimer -= safeDelta;
        if (this.mesh) {
          const recoil = Math.sin((Math.max(0, this.staggerTimer) / 0.28) * Math.PI) * 0.28;
          this.mesh.rotation.x = recoil;
        }
        return;
      }

      if (this.isRestrained) {
        this.animationPhase += safeDelta * 7;
        const struggle = (Math.sin(this.animationPhase * 1.7) + 1) * 0.5;
        animateProceduralModel(this.mesh, {
          phase: this.animationPhase,
          attack: 0.18 + struggle * 0.62,
          crouch: 0.42 + (1 - struggle) * 0.4
        });
        return;
      }

      if (this.isLured) this.updateNavigation(safeDelta);

      let combatTarget = playerCreature;
      if (window.gameInstance?.currentStageIndex === 4) {
        const royalTarget = window.gameInstance.currentStage?.royalCycle;
        if (royalTarget?.isActive) {
          const playerDistance = Math.hypot(playerCreature.x - this.x, playerCreature.z - this.z);
          const royalDistance = Math.hypot(royalTarget.x - this.x, royalTarget.z - this.z);
          if (royalDistance < playerDistance) combatTarget = royalTarget;
        }
      }
      if (window.gameInstance?.currentStageIndex === 5) {
        const livingUnits = window.gameInstance.currentStage?.rtsUnits?.filter((unit) => !unit.isDestroyed) || [];
        const activeCycles = window.gameInstance.currentStage?.incubationCycles?.filter((cycle) => cycle.isActive) || [];
        combatTarget = [...livingUnits, ...activeCycles].reduce((closest, target) => {
          const distance = Math.hypot(target.x - this.x, target.z - this.z);
          if (!closest || distance < closest.distance) return { unit: target, distance };
          return closest;
        }, null)?.unit || playerCreature;
      }
      const distToPlayer = Math.hypot(combatTarget.x - this.x, combatTarget.z - this.z);
      const hasLineOfSight = stationMap.hasLineOfSight(
        this.x,
        this.z,
        combatTarget.x,
        combatTarget.z
      );

      const isCombatant = !this.isInfected && [
        'guard', 'marine', 'smartgunner', 'gyro', 'cleaner', 'incinerator',
        'commando', 'android', 'synthetic', 'powerloader', 'exosuit', 'weyland_commando_mk2',
        'weyland_steel_team_synth', 'steelteam', 'steelteamsynth', 'steelteamandroid'
      ].includes(this.type);
      const currentStageIndex = window.gameInstance?.currentStageIndex || 0;
      const currentStageStep = window.gameInstance?.currentStage?.step;
      const inVentStealth = combatTarget === playerCreature && playerCreature.isInVent;
      const inCeilingStealth = combatTarget === playerCreature && playerCreature.isCeilingProwling;
      const biologicalTargetDetectable = (currentStageIndex !== 3 ||
        currentStageStep === 'HUNT_FAUNA' ||
        currentStageStep === 'CHRYSALIS') && !inVentStealth && !inCeilingStealth;

      this.motionPingCooldown -= safeDelta;
      if (this.radioAlertCooldown > 0) this.radioAlertCooldown -= safeDelta;
      if (biologicalTargetDetectable && distToPlayer < 24 && this.motionPingCooldown <= 0) {
        if (this.type !== 'scientist' && this.type !== 'labhound' && this.type !== 'labrodent') {
          audioManager.playMotionTrackerPing(distToPlayer);
        }
        // Cadence dynamique fidèle au tracker M314 (Aliens / Isolation)
        const pingInterval = distToPlayer < 4.5 ? 0.35 : (distToPlayer < 8.5 ? 0.65 : (distToPlayer < 14 ? 1.05 : 1.75));
        this.motionPingCooldown = pingInterval + Math.random() * 0.12;
      }

      // Canon 1:1 Lore — Directive 937 : Les synthétiques protègent le spécimen biologique au détriment de l'équipage
      if (isCombatant && ['synthetic', 'android'].includes(this.type) && hasLineOfSight && distToPlayer <= 16 && !this.saidOrder937) {
        this.saidOrder937 = true;
        showToast(`${this.name} : [ORDRE SPÉCIAL 937] Confinement de l'organisme engagé. Équipage sacrifiable.`);
        appendSensorLog(`[SYNTHÉTIQUE] ${this.name} applique la Directive 937 : la préservation du spécimen surpasse toute vie humaine.`, 'alert');
      }

      // Canon 1:1 Lore — Steel Team Weyland-Yutani (Marvel Comics: Alien: Icarus)
      if (isCombatant && ['weyland_steel_team_synth', 'steelteam', 'steelteamsynth', 'steelteamandroid'].includes(this.type) && hasLineOfSight && distToPlayer <= 16 && !this.saidSteelTeamDirective) {
        this.saidSteelTeamDirective = true;
        showToast(`${this.name} : [STEEL TEAM WEYLAND-YUTANI] Unité synthétique d'élite engagée.`);
        appendSensorLog(`[STEEL TEAM] ${this.name} déploie les lames thermiques et armes à concussion. Priorité capture génétique.`, 'alert');
      }

      const inDarkness = (rendererEngine?.powerSabotagedTimer || 0) > 0;
      this.ensureFlashlight(inDarkness && isCombatant);

      let targetInVisualField = true;
      if (inDarkness) {
        // Dans le noir complet, l'humain ne peut voir le prédateur que s'il est très proche (≤ 3.2m)
        // ou s'il est éclairé dans le cône de sa lampe torche portée à l'épaule (~45 degrés, ≤ 14m)
        if (distToPlayer > 3.2) {
          const facingAngle = this.mesh ? this.mesh.rotation.y : 0;
          const toTargetAngle = Math.atan2(combatTarget.x - this.x, combatTarget.z - this.z);
          let diffAngle = Math.abs(facingAngle - toTargetAngle);
          while (diffAngle > Math.PI) diffAngle = Math.abs(diffAngle - Math.PI * 2);
          const inFlashlightCone = diffAngle <= Math.PI / 4 && distToPlayer <= 14;
          if (!inFlashlightCone) {
            targetInVisualField = false;
          }
        }
      }

      // Lures have narrative priority. Otherwise armed humans investigate and
      // pursue a detected biological target while civilians keep patrolling.
      const isPlayerProwling = combatTarget === playerCreature && playerCreature.isProwling;
      const maxDetectionDist = inDarkness ? (isPlayerProwling ? 8 : 14) : (isPlayerProwling ? 14 : 26);
      const attackRangeDist = inDarkness ? (isPlayerProwling ? 5.5 : 9) : (isPlayerProwling ? 7.5 : 12);
      const shootDist = inDarkness ? (isPlayerProwling ? 6.5 : 10) : (isPlayerProwling ? 9.5 : 14);

      if (!this.isLured && isCombatant && biologicalTargetDetectable && targetInVisualField && distToPlayer <= maxDetectionDist) {
        this.aiState = hasLineOfSight && distToPlayer <= attackRangeDist ? 'ATTACK' : 'CHASE';
        this.targetPos = { x: combatTarget.x, z: combatTarget.z };

        // 1. TACTIQUE DE RADIO D'ESCOUADE (Aliens 1986 / Isolation)
        // Lorsqu'un marine repère le prédateur, il alerte ses coéquipiers proches sur la fréquence radio
        if (!this.radioAlertCooldown || this.radioAlertCooldown <= 0) {
          this.radioAlertCooldown = 4.5;
          audioManager.playRadioSquelch?.(this.x, this.z);
          const allies = (window.gameInstance?.humans || []).filter((h) => (
            h !== this && !h.isIncapacitated && !h.isCocooned && !h.isLured &&
            ['guard', 'marine', 'smartgunner', 'gyro', 'cleaner', 'incinerator', 'commando', 'android', 'synthetic'].includes(h.type) &&
            Math.hypot(h.x - this.x, h.z - this.z) <= 35
          ));
          allies.forEach((ally) => {
            if (ally.aiState === 'PATROL') {
              ally.aiState = 'CHASE';
              ally.targetPos = { x: combatTarget.x, z: combatTarget.z };
              window.HiveSystems?.vfx?.floatingText?.(ally.x, 2.6, ally.z, 'RADIO: ENNEMI EN VUE !', '#f59e0b', false);
            }
          });
        }

        const isSyntheticEntity = ['synthetic', 'android', 'weyland_steel_team_synth', 'steelteam', 'steelteamsynth', 'steelteamandroid'].includes(this.type);

        // 2. REPLI TACTIQUE SOUS TIRS / SANTÉ CRITIQUE (< 35% PV)
        // Les humains blessés reculent tout en tirant pour maintenir la distance
        if (this.hp < this.maxHp * 0.35 && distToPlayer < 7.5 && !isSyntheticEntity) {
          const retreatAngle = Math.atan2(this.z - combatTarget.z, this.x - combatTarget.x);
          const backX = this.x + Math.cos(retreatAngle) * 3.5;
          const backZ = this.z + Math.sin(retreatAngle) * 3.5;
          if (!stationMap.checkCollision(backX, backZ)) {
            this.targetPos = { x: backX, z: backZ };
          }
        }

        // Chantier 28 : Recherche de Station Médicale & Injecteur de Stimulants
        if (this.hp < this.maxHp * 0.55 && !isSyntheticEntity) {
          const availableMed = (stationMap.medikits || []).find((m) => !m.isSabotaged && m.uses > 0);
          if (availableMed) {
            const medDist = Math.hypot(availableMed.x - this.x, availableMed.z - this.z);
            if (medDist <= 2.2) {
              availableMed.uses--;
              this.hp = Math.min(this.maxHp, this.hp + 45);
              this.stress = 0;
              audioManager.playMedikitInject?.(this.x, this.z);
              window.HiveSystems?.vfx?.burst?.(this.x, this.z, 0x22c55e, 16, 0.12, 1.2);
              window.HiveSystems?.vfx?.floatingText?.(this.x, 2.5, this.z, '+45 PV STIMULANT', '#22c55e', true);
              showToast(`${this.name} s'est injecté un stimulant hypospray (+45 PV) !`);
            } else if (distToPlayer > 6.0) {
              this.targetPos = { x: availableMed.x, z: availableMed.z };
            }
          }
        }

        // Chantier 24 : Barricades & Soudures de Sas au Découpeur Plasma
        if (['marine', 'guard', 'commando'].includes(this.type) && (window.alarmSystem?.level || 0) >= 2 && distToPlayer > 8.0) {
          const nearbyDoor = stationMap.blastDoors?.find((d) => d.isOpen && !d.isWelded && Math.hypot(d.x - this.x, d.z - this.z) <= 3.2);
          if (nearbyDoor) {
            this.weldCooldown = (this.weldCooldown || 0) - safeDelta;
            if (this.weldCooldown <= 0) {
              this.weldCooldown = 22.0;
              stationMap.weldDoor(nearbyDoor, this.name);
            }
          }
        }
      } else if (!this.isLured && (this.aiState === 'CHASE' || this.aiState === 'ATTACK')) {
        this.choosePatrolWaypoint();
      }

      // Chantier 6 : Jauge de Stress Humaine 0 - 100 & IA de Terreur (Aliens 1986 / Isolation)
      if (!isSyntheticEntity && this.type !== 'labrodent') {
        let stressDelta = -3.5 * safeDelta;
        if (inDarkness) stressDelta += 6.5 * safeDelta;
        if (distToPlayer < 14) stressDelta += (1 - distToPlayer / 14) * 28 * safeDelta;
        if (this.hp < this.maxHp * 0.45) stressDelta += 14 * safeDelta;

        this.stress = Math.max(0, Math.min(100, (this.stress || 0) + stressDelta));

        if (this.stress >= 75) {
          const now = Date.now();
          if (now - (this.lastStressQuoteTime || 0) > 8000 && Math.random() < 0.35) {
            this.lastStressQuoteTime = now;
            const panicQuotes = [
              'Ils sont dans les murs !',
              'Game over, man ! Game over !',
              'C’est un cauchemar ! Tirez !',
              'Je veux sortir d’ici !',
              'Confinement rompu, il arrive !'
            ];
            const quote = panicQuotes[Math.floor(Math.random() * panicQuotes.length)];
            window.HiveSystems?.vfx?.floatingText?.(this.x, 2.8, this.z, quote, '#ef4444', true);
            appendSensorLog(`[TERREUR] ${this.name} : « ${quote} »`, 'alert');
          }

          // Chantier 38 : Grenade fumigène CS anti-émeute lancée par les humains apeurés (Alien: Romulus)
          this.csGrenadeCooldown = (this.csGrenadeCooldown || 0) - safeDelta;
          if (this.csGrenadeCooldown <= 0 && distToPlayer <= 10) {
            this.csGrenadeCooldown = 22.0;
            audioManager.playSteamVentHiss?.(this.x, this.z);
            window.HiveSystems?.vfx?.spawnSteamCloud?.(this.x, 2.0, this.z, 5.0);
            window.HiveSystems?.vfx?.floatingText?.(this.x, 2.6, this.z, 'FUMIGÈNE CS ANTI-ÉMEUTE !', '#cbd5e1', true);
            showToast(`FUMIGÈNE CS DÉPLOYÉ : Visibilité humaine réduite. L'organe de Jacobson du Xénomorphe surligne les battements cardiaques !`);
            appendSensorLog(`[FUMIGÈNE] Écran de fumée CS déclenché par ${this.name}. Capteurs optiques aveuglés, sens Jacobson actif.`, 'alert');
          }

          if (this.stress >= 85 && distToPlayer < 10) {
            const panicAngle = Math.atan2(this.z - combatTarget.z, this.x - combatTarget.x);
            const fleeX = this.x + Math.cos(panicAngle) * 4;
            const fleeZ = this.z + Math.sin(panicAngle) * 4;
            if (!stationMap.checkCollision(fleeX, fleeZ)) {
              this.targetPos = { x: fleeX, z: fleeZ };
            }
          }
        }
      }

      // Chantier 10 : Avertisseur de recul industriel Caterpillar P-5000 (Aliens 1986)
      if (this.type === 'powerloader' || this.type === 'exosuit') {
        this.powerloaderBeepTimer = (this.powerloaderBeepTimer || 0) - safeDelta;
        if (this.powerloaderBeepTimer <= 0) {
          this.powerloaderBeepTimer = 2.2 + Math.random() * 0.4;
          audioManager.playPowerloaderBeep?.(this.x, this.z);
        }
      }

      this.shootCooldown -= safeDelta;
      this.grenadeCooldown -= safeDelta;

      // Chantier 19 : Ligne de tir coordonnée et tir de suppression en escouade (Aliens 1986)
      if (isCombatant && biologicalTargetDetectable && targetInVisualField && hasLineOfSight && distToPlayer <= 18) {
        const nearbyMarines = (window.gameInstance?.humans || []).filter((h) => (
          h !== this && !h.isIncapacitated && !h.isCocooned &&
          ['marine', 'smartgunner', 'commando', 'guard'].includes(h.type) &&
          Math.hypot(h.x - this.x, h.z - this.z) <= 6.5
        ));
        if (nearbyMarines.length >= 1) {
          if (!this.lastSuppressionQuote || Date.now() - this.lastSuppressionQuote > 8000) {
            this.lastSuppressionQuote = Date.now();
            const squadQuotes = [
              'Rafales courtes contrôlées !',
              'Ligne de tir ! Couvrez le secteur !',
              'Restez groupés, tirs croisés !'
            ];
            const sq = squadQuotes[Math.floor(Math.random() * squadQuotes.length)];
            window.HiveSystems?.vfx?.floatingText?.(this.x, 3.1, this.z, sq, '#38bdf8', true);
          }
          if (combatTarget) {
            combatTarget.suppressionTimer = 1.4;
          }
        }
      }

      if (
        isCombatant &&
        biologicalTargetDetectable &&
        targetInVisualField &&
        distToPlayer < shootDist &&
        hasLineOfSight &&
        this.shootCooldown <= 0
      ) {
          const applyWeaponDamage = (multiplier = 1) => {
            const stageIndex = window.gameInstance?.currentStageIndex;
            if ([2, 3, 4].includes(stageIndex)) {
              const baseDamage = ['powerloader', 'exosuit'].includes(this.type)
                ? 18
                : (['cleaner', 'incinerator'].includes(this.type)
                  ? 12
                  : (stageIndex === 4 ? 8 : 6));
              const targetReceiver = combatTarget?.takeDamage ? combatTarget : playerCreature;
              targetReceiver.takeDamage(baseDamage * multiplier * window.gameInstance.getDifficultyDamageModifier());
            } else if (window.gameInstance?.currentStageIndex === 5 && combatTarget?.takeDamage) {
              const baseDamage = ['powerloader', 'exosuit'].includes(this.type) ? 25 : 11;
              combatTarget.takeDamage(baseDamage * multiplier * window.gameInstance.getDifficultyDamageModifier());
            }

            // Chantier 68 : Barils de napalm inflammables touchés par tirs perdus
            const closeNapalm = (stationMap.napalmBarrels || []).find((b) => !b.isDetonated && Math.hypot(b.x - combatTarget.x, b.z - combatTarget.z) <= 3.2);
            if (closeNapalm) {
              stationMap.detonateNapalmBarrel(closeNapalm, this);
            }
          };

          this.attackAnimation = 1;

          // Chantier 4 : Grenades M40 30mm à shrapnel du Commando (Aliens 1986)
          if (this.type === 'commando' && this.grenadeCooldown <= 0 && distToPlayer >= 5.5 && distToPlayer <= 22) {
            this.grenadeCooldown = 9.5;
            this.shootCooldown = 1.9;
            audioManager.playGrenadeLaunch?.(this.x, this.z);
            window.HiveSystems?.vfx?.muzzleFlash?.(this.x, 2.7, this.z, 0xf97316, 0.3);
            const projectileVfx = window.HiveSystems?.vfx;
            const onGrenadeImpact = () => {
              audioManager.playGrenadeExplode?.(combatTarget.x, combatTarget.z);
              rendererEngine.addScreenShake?.(0.35, 0.2);
              window.HiveSystems?.vfx?.burst?.(combatTarget.x, combatTarget.z, 0xf97316, 28, 0.18, 2.2);
              applyWeaponDamage(1.75);
            };
            if (projectileVfx?.projectile) {
              projectileVfx.projectile({
                startX: this.x,
                startY: 2.7,
                startZ: this.z,
                endX: combatTarget.x,
                endY: 1.0,
                endZ: combatTarget.z,
                color: 0xf97316,
                scale: 0.28,
                speed: 22,
                onImpact: onGrenadeImpact
              });
            } else {
              onGrenadeImpact();
            }
          } else if (['powerloader', 'exosuit'].includes(this.type) && distToPlayer <= 3.8) {
            // Chantier 10 & 41 : Broyage hydraulique & projection par les pinces Caterpillar P-5000 (Aliens 1986)
            this.shootCooldown = 2.1;
            audioManager.playPowerLoaderPincerClaw?.(this.x, this.z);
            audioManager.playMetalImpact?.(this.x, this.z);
            rendererEngine.addScreenShake?.(0.35, 0.22);
            window.HiveSystems?.vfx?.burst?.(combatTarget.x, combatTarget.z, 0xf59e0b, 22, 0.16, 1.6);
            window.HiveSystems?.vfx?.floatingText?.(combatTarget.x, 2.8, combatTarget.z, 'BROYAGE & PROJECTION P-5000 !', '#f59e0b', true);
            const pushDirX = (combatTarget.x - this.x) / (distToPlayer || 1);
            const pushDirZ = (combatTarget.z - this.z) / (distToPlayer || 1);
            combatTarget.x += pushDirX * 3.8;
            combatTarget.z += pushDirZ * 3.8;
            applyWeaponDamage(1.8);
          } else if (['weyland_security_taser', 'taser_guard'].includes(this.type) && distToPlayer <= 3.0) {
            // Chantier 45 : Bâton à choc 100kV Weyland-Yutani (Alien 3 / Isolation)
            this.shootCooldown = 2.2;
            audioManager.playStunBatonZap?.(this.x, this.z);
            rendererEngine.addScreenShake?.(0.28, 0.15);
            window.HiveSystems?.vfx?.burst?.(combatTarget.x, combatTarget.z, 0x38bdf8, 24, 0.18, 1.6);
            window.HiveSystems?.vfx?.floatingText?.(combatTarget.x, 2.8, combatTarget.z, 'BÂTON À CHOC 100kV (-18 & PARALYSIE) !', '#38bdf8', true);
            combatTarget.takeDamage?.(18, this);
            if (combatTarget === playerCreature) {
              combatTarget.staggerTimer = 1.8;
            }
          } else if (['cleaner', 'incinerator'].includes(this.type)) {
            // Chantier 34 : Lance-flammes lourd M240 Incinerator & jet de napalm continu (Aliens 1986 / Isolation)
            this.shootCooldown = 2.4;
            audioManager.playNapalmFlameStream?.(this.x, this.z);
            window.HiveSystems?.vfx?.muzzleFlash(this.x, 2.7, this.z, 0xff8a16, 0.35);
            window.HiveSystems?.vfx?.flameJet(
              this.x,
              2.65,
              this.z,
              combatTarget.x,
              combatTarget.caste === 'queen' ? 3.5 : 1.5,
              combatTarget.z
            );
            window.HiveSystems?.vfx?.burst?.(combatTarget.x, combatTarget.z, 0xf97316, 20, 0.16, 1.8);
            applyWeaponDamage(1.15);
          } else if (['marine', 'guard', 'commando'].includes(this.type) && distToPlayer <= 3.2) {
            // Chantier 14 : Fusil à pompe Ithaca 37 "Shorty" calibre 12 bout portant (Caporal Hicks, Aliens 1986)
            this.shootCooldown = 2.1;
            audioManager.playShotgunBlast?.(this.x, this.z);
            rendererEngine.addScreenShake?.(0.38, 0.22);
            window.HiveSystems?.vfx?.muzzleFlash?.(this.x, 2.65, this.z, 0xf97316, 0.35);
            window.HiveSystems?.vfx?.burst?.(combatTarget.x, combatTarget.z, 0xf97316, 26, 0.16, 2.0);
            window.HiveSystems?.vfx?.floatingText?.(this.x, 3.1, this.z, 'ITHACA 37 BOUT PORTANT !', '#f97316', true);
            applyWeaponDamage(2.2);

            // 1:1 Lore Aliens 1986 : Projection d'acide en retour brûlant l'armure du tireur
            this.takeDamage(12);
            window.HiveSystems?.vfx?.burst?.(this.x, this.z, 0x39ff14, 18, 0.15, 1.4);
            window.HiveSystems?.vfx?.floatingText?.(this.x, 2.6, this.z, 'RETOUR D’ACIDE -12', '#39ff14', true);
          } else if (['smartgunner', 'gyro'].includes(this.type)) {
            // Chantier 4 : M56 Smartgun gyro-stabilisé à haute cadence (Vasquez / Drake)
            this.shootCooldown = 0.85;
            audioManager.playSmartgunBurst?.(this.x, this.z);
            if (Math.random() < 0.45) audioManager.playSmartgunServo?.(this.x, this.z);
            window.HiveSystems?.vfx?.muzzleFlash(this.x, 2.75, this.z, 0xf59e0b, 0.24);
            const projectileVfx = window.HiveSystems?.vfx;
            if (projectileVfx?.projectile) {
              projectileVfx.projectile({
                startX: this.x,
                startY: 2.72,
                startZ: this.z,
                endX: combatTarget.x,
                endY: combatTarget.caste === 'queen' ? 3.6 : 1.3,
                endZ: combatTarget.z,
                color: 0xf59e0b,
                scale: 0.18,
                speed: 38,
                onImpact: () => applyWeaponDamage(0.9)
              });
            } else {
              applyWeaponDamage(0.9);
            }
          } else if (this.type === 'weyland_commando_mk2') {
            // Chantier 53 & 57 : Fusil XM99 lourd et Grenades I.M.P. Commando Weyland-Yutani
            this.empGrenadeCooldown = (this.empGrenadeCooldown || 0) - safeDelta;
            if (distToPlayer >= 6.0 && distToPlayer <= 18 && this.empGrenadeCooldown <= 0) {
              this.empGrenadeCooldown = 15.0;
              this.shootCooldown = 1.9;
              stationMap.throwEMPGrenade(this.x, this.z, combatTarget.x, combatTarget.z);
            } else {
              this.shootCooldown = 0.95;
              audioManager.playM41APulseBurst?.(this.x, this.z);
              rendererEngine.addScreenShake?.(0.16, 0.09);
              window.HiveSystems?.vfx?.muzzleFlash?.(this.x, 2.75, this.z, 0xf59e0b, 0.32);
              window.HiveSystems?.vfx?.floatingText?.(this.x, 3.2, this.z, 'RAFALE LOURDE XM99 !', '#f59e0b', false);
              applyWeaponDamage(1.55);
            }
          } else if (['weyland_steel_team_synth', 'steelteam', 'steelteamsynth', 'steelteamandroid'].includes(this.type)) {
            // Chantier 63 : Commando Synthétique Steel Team Weyland-Yutani (Marvel Comics: Alien: Icarus)
            // Lame thermique plasma au corps-à-corps (< 2.8m) ou Fusil à concussion magnétique à distance
            if (distToPlayer <= 2.8) {
              this.shootCooldown = 1.0;
              this.attackAnimation = 1.0;
              audioManager.playThermalBladeIgnite?.(this.x, this.z);
              rendererEngine.addScreenShake?.(0.24, 0.16);
              window.HiveSystems?.vfx?.burst?.(combatTarget.x, combatTarget.z, 0xff3b30, 24, 0.18, 1.6);
              window.HiveSystems?.vfx?.floatingText?.(combatTarget.x, 3.0, combatTarget.z, '-32 LAME THERMIQUE PLASMA !', '#ff3b30', true);
              const targetReceiver = combatTarget?.takeDamage ? combatTarget : playerCreature;
              targetReceiver.takeDamage(32, this);
            } else {
              this.shootCooldown = 1.6;
              audioManager.playConcussionBlast?.(this.x, this.z);
              rendererEngine.addScreenShake?.(0.3, 0.18);
              window.HiveSystems?.vfx?.muzzleFlash?.(this.x, 2.7, this.z, 0xef4444, 0.45);
              const onConcussionImpact = () => {
                rendererEngine.addScreenShake?.(0.38, 0.22);
                window.HiveSystems?.vfx?.burst?.(combatTarget.x, combatTarget.z, 0xef4444, 25, 0.2, 2.0);
                window.HiveSystems?.vfx?.floatingText?.(combatTarget.x, 3.2, combatTarget.z, '-28 SOUFFLE CONCUSSION MAGNÉTIQUE !', '#ef4444', true);
                const targetReceiver = combatTarget?.takeDamage ? combatTarget : playerCreature;
                targetReceiver.takeDamage(28, this);
                if (combatTarget === playerCreature) {
                  const pushAng = Math.atan2(playerCreature.z - this.z, playerCreature.x - this.x);
                  const pX = playerCreature.x + Math.cos(pushAng) * 2.2;
                  const pZ = playerCreature.z + Math.sin(pushAng) * 2.2;
                  if (!stationMap.checkCollision(pX, pZ)) {
                    playerCreature.x = pX;
                    playerCreature.z = pZ;
                    playerCreature.mesh?.position.set(pX, playerCreature.mesh.position.y, pZ);
                  }
                }
              };
              if (window.HiveSystems?.vfx?.projectile) {
                window.HiveSystems.vfx.projectile({
                  startX: this.x, startY: 2.7, startZ: this.z,
                  endX: combatTarget.x, endY: 1.2, endZ: combatTarget.z,
                  color: 0xef4444, scale: 0.28, speed: 42,
                  onImpact: onConcussionImpact
                });
              } else {
                onConcussionImpact();
              }
            }
          } else {
            // Chantier 37 : Fusil à impulsion M41A avec Lance-grenades U1 40mm sous le canon (Aliens 1986)
            this.u1GrenadeCooldown = (this.u1GrenadeCooldown || 0) - safeDelta;
            if (['marine', 'guard'].includes(this.type) && distToPlayer >= 7.0 && distToPlayer <= 20 && this.u1GrenadeCooldown <= 0) {
              this.u1GrenadeCooldown = 11.0;
              this.shootCooldown = 2.2;
              audioManager.playM40GrenadePumpLaunch?.(this.x, this.z);
              window.HiveSystems?.vfx?.muzzleFlash?.(this.x, 2.7, this.z, 0xf97316, 0.3);
              const onU1Impact = () => {
                audioManager.playGrenadeExplode?.(combatTarget.x, combatTarget.z);
                rendererEngine.addScreenShake?.(0.36, 0.22);
                window.HiveSystems?.vfx?.burst?.(combatTarget.x, combatTarget.z, 0xf97316, 28, 0.18, 2.2);
                window.HiveSystems?.vfx?.floatingText?.(combatTarget.x, 3.0, combatTarget.z, 'GRENADE U1 40MM EXPLOSIVE !', '#f97316', true);
                applyWeaponDamage(1.75);
              };
              if (window.HiveSystems?.vfx?.projectile) {
                window.HiveSystems.vfx.projectile({
                  startX: this.x, startY: 2.7, startZ: this.z,
                  endX: combatTarget.x, endY: 1.0, endZ: combatTarget.z,
                  color: 0xf97316, scale: 0.24, speed: 22,
                  onImpact: onU1Impact
                });
              } else {
                onU1Impact();
              }
            } else {
              this.shootCooldown = ['powerloader', 'exosuit'].includes(this.type) ? 1.9 : 1.35;
              audioManager.playM41APulseBurst?.(this.x, this.z);
              const projectileColor = this.bossId === 'MANTIS_4'
                ? (this.bossPhase >= 3 ? 0xef4444 : 0x38bdf8)
                : 0xfbbf24;
              window.HiveSystems?.vfx?.muzzleFlash(this.x, 2.75, this.z, projectileColor, 0.22);
              const projectileVfx = window.HiveSystems?.vfx;
              if (projectileVfx?.projectile) {
                projectileVfx.projectile({
                  startX: this.x,
                  startY: 2.72,
                  startZ: this.z,
                  endX: combatTarget.x,
                  endY: combatTarget.caste === 'queen' ? 3.6 : 1.3,
                  endZ: combatTarget.z,
                  color: projectileColor,
                  scale: this.bossId === 'MANTIS_4' ? 0.2 : 0.14,
                  speed: this.bossId === 'MANTIS_4' ? 28 : 34,
                  onImpact: applyWeaponDamage
                });
              } else {
                applyWeaponDamage();
              }
            }
          }
      }

      const dist = Math.hypot(this.targetPos.x - this.x, this.targetPos.z - this.z);
      const shouldHoldAttackPosition = this.aiState === 'ATTACK' && hasLineOfSight && distToPlayer <= 12;
      if (dist > 0.5 && !shouldHoldAttackPosition) {
        const speed = this.isLured ? 0.12 : (this.type === 'powerloader' ? 0.06 : 0.08);
        const frameScale = safeDelta * 60;
        const directionX = (this.targetPos.x - this.x) / dist;
        const directionZ = (this.targetPos.z - this.z) / dist;
        const nextX = this.x + directionX * speed * frameScale;
        const nextZ = this.z + directionZ * speed * frameScale;
        let moved = false;
        if (!stationMap.checkCollision(nextX, nextZ)) {
          this.x = nextX; this.z = nextZ;
          moved = true;
        } else {
          // Axis sliding, then a perpendicular sidestep, keeps pursuit from
          // freezing against the station's rectangular colliders.
          if (Math.abs(directionX) > 1e-4 && !stationMap.checkCollision(nextX, this.z)) {
            this.x = nextX;
            moved = true;
          } else if (Math.abs(directionZ) > 1e-4 && !stationMap.checkCollision(this.x, nextZ)) {
            this.z = nextZ;
            moved = true;
          } else {
            const sideX = -directionZ * speed * frameScale;
            const sideZ = directionX * speed * frameScale;
            if (!stationMap.checkCollision(this.x + sideX, this.z + sideZ)) {
              this.x += sideX;
              this.z += sideZ;
              moved = true;
            } else if (!stationMap.checkCollision(this.x - sideX, this.z - sideZ)) {
              this.x -= sideX;
              this.z -= sideZ;
              moved = true;
            }
          }
          if (!moved) {
            this.stuckTimer += safeDelta;
            if (
              this.navigationGoal &&
              this.stuckTimer >= 0.35 &&
              this.navigationRepathTimer <= 0
            ) {
              this.planNavigation(this.navigationGoal.x, this.navigationGoal.z, true);
            } else if (this.aiState === 'PATROL') {
              this.choosePatrolWaypoint();
            }
          }
        }
        if (moved) {
          this.stuckTimer = 0;
          this.mesh.position.set(this.x, 0, this.z);
          this.mesh.rotation.y = Math.atan2(directionX, directionZ);
          this.animationPhase += safeDelta * (this.type === 'labrodent' ? 17 : 8);
          this.footstepCooldown -= safeDelta;
          if (this.footstepCooldown <= 0 && this.type !== 'labrodent') {
            this.footstepCooldown = ['powerloader', 'exosuit'].includes(this.type) ? 0.62 : 0.38;
            audioManager.playFootstep?.(this.type, this.x, this.z);
          }
        }
      } else if (dist <= 0.5 && this.aiState === 'PATROL') {
        this.patrolWait -= safeDelta;
        if (this.patrolWait <= 0) {
          this.patrolWait = 0.6 + Math.random() * 1.4;
          this.targetPos = this.findFreeWaypoint(20);
        }
      }

      if (this.isInfected && this.infectionState !== 'BURST') {
        this.infectionCoughCooldown -= safeDelta;
        if (this.infectionCoughCooldown <= 0) {
          this.infectionCoughCooldown = 1.7 + Math.random() * 2.2;
          audioManager.playHostCough?.(this.x, this.z);
          this.attackAnimation = Math.max(this.attackAnimation, 0.55);
        }
      }

      // Chantier 59 : Gestation ultra-rapide et éclosion in-situ d'inoculation oviducte (Alien: Romulus)
      if (this.directInoculated && !this.isConsumedByCycle) {
        this.directInoculationTimer -= safeDelta;
        if (Math.random() < 0.15) {
          window.HiveSystems?.vfx?.floatingText?.(this.x, 2.2, this.z, '*CONVULSIONS OVIDUCTES*', '#ef4444', false);
        }
        if (this.directInoculationTimer <= 0) {
          this.directInoculated = false;
          this.isConsumedByCycle = true;
          this.takeDamage(this.hp || 100);
          audioManager.playBloodbursterErupt?.(this.x, this.z);
          rendererEngine.addScreenShake?.(0.35, 0.25);
          window.HiveSystems?.vfx?.burst?.(this.x, this.z, 0xef4444, 45, 0.35, 2.5);
          window.HiveSystems?.vfx?.floatingText?.(this.x, 3.0, this.z, 'ÉMERGENCE DU CHESTBURSTER IN-SITU !', '#ef4444', true);
          showToast(`CHESTBURSTER NOUVEAU-NÉ : Jaillissement sternal direct sur ${this.name} sans transport au nid !`);
          appendSensorLog(`[ROMULUS 1:1] Émergence thoracique foudroyante sur ${this.name}. Chestburster opérationnel.`, 'bio');
          if (window.gameInstance?.currentStage?.spawnChestburster) {
            window.gameInstance.currentStage.spawnChestburster(this.x, this.z);
          }
        }
      }
      animateProceduralModel(this.mesh, {
        phase: this.animationPhase,
        movement: dist > 0.5 ? (this.type === 'labrodent' ? 1 : 0.78) : 0.06,
        attack: this.attackAnimation,
        crouch: this.isInfected ? 0.18 : 0
      });
    }
  }

  class HiveUnit {
    constructor(id, caste, x, z) {
      this.id = id;
      this.caste = caste;
      this.x = x; this.z = z;
      const profiles = {
        queen: { hp: 1000, speed: 0, damage: 90, range: 5 },
        palatine: { hp: 580, speed: 0.32, damage: 110, range: 2.4 },
        praetorian: { hp: 460, speed: 0.28, damage: 85, range: 2.2 },
        crusher: { hp: 520, speed: 0.36, damage: 95, range: 2.2 },
        warrior: { hp: 230, speed: 0.37, damage: 48, range: 1.8 },
        prowler: { hp: 175, speed: 0.52, damage: 55, range: 2.0 },
        runner: { hp: 145, speed: 0.54, damage: 32, range: 1.8 },
        burster: { hp: 135, speed: 0.55, damage: 70, range: 2.0 },
        offspring: { hp: 420, speed: 0.44, damage: 92, range: 2.2 },
        spitter: { hp: 150, speed: 0.31, damage: 36, range: 13 },
        drone: { hp: 190, speed: 0.4, damage: 42, range: 1.8 },
        worker: { hp: 120, speed: 0.34, damage: 14, range: 1.6 }
      };
      const profile = profiles[caste] || profiles.drone;
      this.maxHp = profile.hp;
      this.hp = profile.hp;
      this.speed = profile.speed;
      this.damage = profile.damage;
      this.attackRange = profile.range;
      this.mesh = null;
      this.attackCooldown = 0;
      this.supportCooldown = 0;
      this.animationPhase = Math.random() * Math.PI * 2;
      this.attackAnimation = 0;
      this.movementBlend = 0;
      this.isDestroyed = false;
      this.attachedToOvipositor = caste === 'queen';
    }

    createMesh() {
      const group = new THREE.Group();
      const detailedModel = window.HiveModelFactory?.createHiveUnit?.(this.caste);
      if (detailedModel) {
        group.add(detailedModel);
        group.position.set(this.x, 0, this.z);
        group.traverse((child) => {
          if (!child.isMesh) return;
          child.castShadow = true;
          child.receiveShadow = true;
        });
        rendererEngine.scene.add(group);
        this.mesh = group;
        return;
      }
      let geo = new THREE.SphereGeometry(this.caste === 'queen' ? 2.5 : (['praetorian', 'palatine', 'crusher'].includes(this.caste) ? 1.6 : 1.0), 12, 12);
      let color = 0x0f172a;
      if (this.caste === 'runner') color = 0x7c2d12;
      if (this.caste === 'warrior') color = 0x1e1b4b;
      if (this.caste === 'worker') color = 0x14532d;
      if (this.caste === 'spitter') color = 0x365314;
      if (this.caste === 'prowler') color = 0x450a0a;
      if (this.caste === 'burster') color = 0x422006;
      if (this.caste === 'crusher') color = 0x27272a;
      if (this.caste === 'praetorian') color = 0x581c87;
      if (this.caste === 'palatine') color = 0x3b0764;
      if (this.caste === 'offspring') color = 0xd4d4d8;
      if (this.caste === 'queen') color = 0x3b0764;

      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.1, metalness: 0.9, emissive: 0x2e1065 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = this.caste === 'queen' ? 3.0 : 1.0;
      group.add(mesh);

      group.position.set(this.x, 0, this.z);
      rendererEngine.scene.add(group);
      this.mesh = group;
    }

    destroy() {
      if (this.mesh) rendererEngine.removeObject(this.mesh);
      this.mesh = null;
      this.isDestroyed = true;
    }

    takeDamage(amount) {
      if (this.isDestroyed) return;
      const actualDmg = Math.max(0, amount);
      this.hp = Math.max(0, this.hp - actualDmg);

      audioManager.playAcidSizzle?.();
      const isQueen = this.caste === 'queen';
      const splashRadius = isQueen ? 6.2 : (this.caste === 'burster' ? 5.5 : 3.8);
      const burstCount = isQueen ? 26 : 12;

      window.HiveSystems?.vfx?.burst(this.x, this.z, 0x39ff14, burstCount, 0.12, isQueen ? 2.8 : 1.2);
      window.HiveSystems?.vfx?.spawnAcidPool?.(this.x, this.z, isQueen ? 2.4 : 1.45, isQueen ? 12 : 8);
      window.HiveSystems?.vfx?.floatingText?.(this.x, isQueen ? 3.8 : 2.0, this.z, `-${Math.ceil(actualDmg)}`, '#ef4444', false);

      if (isQueen) {
        setHudBar('vital', 'INTÉGRITÉ REINE', (this.hp / this.maxHp) * 100);
      }

      // Canon 1:1 Lore — Projection de sang acide pressurisé sur les cibles humaines proches
      const nearbyHumans = (window.gameInstance?.humans || []).filter((h) => (
        !h.isIncapacitated && !h.isCocooned && Math.hypot(h.x - this.x, h.z - this.z) <= splashRadius
      ));
      nearbyHumans.forEach((human) => {
        const acidDmg = isQueen ? 35 : 14;
        human.takeDamage(acidDmg, this);
        human.staggerTimer = 0.45;
        window.HiveSystems?.vfx?.floatingText?.(human.x, 2.4, human.z, `-${acidDmg} SANG ACIDE`, '#39ff14', true);
        window.HiveSystems?.vfx?.burst(human.x, human.z, 0x39ff14, 10, 0.1, 1.0);
      });

      if (this.hp > 0) return;

      // Détonation cataclysmique du Burster à la mort
      if (this.caste === 'burster') {
        window.HiveSystems?.vfx?.burst(this.x, this.z, 0x39ff14, 38, 0.22, 1.4);
        window.HiveSystems?.vfx?.spawnAcidPool?.(this.x, this.z, 3.8, 12);
        audioManager.playChestburstScreech?.();
        const blastHumans = (window.gameInstance?.humans || []).filter((h) => (
          !h.isIncapacitated && !h.isCocooned && Math.hypot(h.x - this.x, h.z - this.z) <= 5.8
        ));
        blastHumans.forEach((human) => {
          human.takeDamage(95, this);
          human.staggerTimer = 1.2;
          window.HiveSystems?.vfx?.floatingText?.(human.x, 2.6, human.z, '-95 CATACLYSME', '#39ff14', true);
        });
      }

      if (isQueen && window.gameInstance) {
        window.gameInstance.showEndModal(
          'LIGNÉE ROYALE ÉTEINTE',
          'La dernière Reine a été détruite avant la sécurisation de MNEMOSYNE.'
        );
      }
      this.destroy();
    }

    moveDirect(dx, dy, deltaSeconds = 1 / 60, maxDistance = Infinity, speedMultiplier = 1) {
      if (!this.mesh || (this.caste === 'queen' && this.attachedToOvipositor) || this.isDestroyed) return false;
      if (Math.hypot(dx, dy) <= 1e-4 || maxDistance <= 1e-4) {
        this.movementBlend = 0;
        animateProceduralModel(this.mesh, {
          phase: this.animationPhase,
          movement: 0.08,
          attack: this.attackAnimation
        });
        return false;
      }
      const frameScale = Math.max(0, deltaSeconds) * 60;
      const resinBonus = (typeof resinGrid !== 'undefined' && resinGrid?.getResin?.(this.x, this.z) > 0) ? 1.25 : 1.0;
      const scentBonus = (window.pheromoneSystem?.getScentBonus?.(this.x, this.z)) || 1.0;
      const suppressionPenalty = (this.suppressionTimer > 0) ? 0.65 : 1.0;
      if (this.suppressionTimer > 0) this.suppressionTimer -= deltaSeconds;
      const movementStep = Math.min(this.speed * Math.max(0, speedMultiplier) * resinBonus * scentBonus * suppressionPenalty * frameScale, maxDistance);
      const nextX = this.x + dx * movementStep;
      const nextZ = this.z + dy * movementStep;
      let moved = false;
      if (!stationMap.checkCollision(nextX, nextZ)) {
        this.x = nextX;
        this.z = nextZ;
        moved = true;
      } else {
        // Glissement sur les obstacles AABB : les unités contournent les
        // cloisons au lieu de rester bloquées sur une trajectoire diagonale.
        const canSlideX = Math.abs(dx) > 1e-4 && !stationMap.checkCollision(nextX, this.z);
        const canSlideZ = Math.abs(dy) > 1e-4 && !stationMap.checkCollision(this.x, nextZ);
        if (canSlideX && (!canSlideZ || Math.abs(dx) >= Math.abs(dy))) {
          this.x = nextX;
          moved = true;
        } else if (canSlideZ) {
          this.z = nextZ;
          moved = true;
        }
      }
      if (moved) {
        this.mesh.position.set(this.x, 0, this.z);
        this.animationPhase += Math.max(0, deltaSeconds) * (this.caste === 'queen' ? 5.5 : (this.caste === 'runner' ? 13 : 8));
        this.movementBlend = 1;
        animateProceduralModel(this.mesh, {
          phase: this.animationPhase,
          movement: 1,
          attack: this.attackAnimation
        });
      }
      if (dx !== 0 || dy !== 0) this.mesh.rotation.y = Math.atan2(dx, dy);
      return moved;
    }

    update(deltaSeconds = 1 / 60, humans = []) {
      if (!this.mesh || this.isDestroyed) return;
      this.attackCooldown -= deltaSeconds;
      this.supportCooldown -= deltaSeconds;
      this.attackAnimation = Math.max(0, this.attackAnimation - Math.max(0, deltaSeconds) * 3);
      this.movementBlend = Math.max(0, this.movementBlend - Math.max(0, deltaSeconds) * 4.5);

      // Chantier 7 : Régénération biologique passive sur la bio-résine de la ruche
      if (typeof resinGrid !== 'undefined' && resinGrid?.getResin?.(this.x, this.z) > 0) {
        this.health = Math.min(this.maxHealth, this.health + 6 * Math.max(0, deltaSeconds));
      }

      // Canon Giger — Salive visqueuse perlant continuellement des mâchoires
      if ((this.caste === 'queen' || this.caste === 'praetorian' || this.caste === 'warrior') && !this.isDestroyed) {
        this.salivaTimer = (this.salivaTimer || 0) - deltaSeconds;
        if (this.salivaTimer <= 0) {
          this.salivaTimer = (this.caste === 'queen' ? 0.95 : 1.7) + Math.random() * 1.5;
          const jawY = this.caste === 'queen' ? 4.2 : 2.5;
          window.HiveSystems?.vfx?.salivaDrip(this.x, jawY, this.z, this.caste === 'queen' ? 3 : 2);
        }
      }

      if (this.caste === 'queen') {
        const reach = this.attachedToOvipositor ? this.attackRange : 6.5;
        const nearbyThreats = humans.filter((human) => (
          !human.isCocooned &&
          !human.isIncapacitated &&
          Math.hypot(human.x - this.x, human.z - this.z) <= reach
        ));
        const nearbyThreat = nearbyThreats[0] || null;

        if (nearbyThreat && this.attackCooldown <= 0) {
          this.attackCooldown = this.attachedToOvipositor ? 1.35 : 0.95;
          this.attackAnimation = 1;
          const queenDmg = this.attachedToOvipositor ? this.damage : 180;

          // Balayage royal dévastateur touchant l'ensemble des cibles proches
          nearbyThreats.forEach((threat) => {
            threat.takeDamage(queenDmg, this);
            threat.staggerTimer = 0.55;
            window.HiveSystems?.vfx?.burst(threat.x, threat.z, 0xa855f7, 16, 0.14, 1.5);
            window.HiveSystems?.vfx?.floatingText?.(threat.x, 2.5, threat.z, `-${queenDmg} IMPACT ROYAL`, '#a855f7', true);
          });

          audioManager.playQueenRoar?.();
          audioManager.playBoneCrunch?.();
          audioManager.playWetImpact?.(nearbyThreat.x, nearbyThreat.z);
          rendererEngine.addScreenShake?.(0.35, 0.22);
          window.HiveSystems?.vfx?.organicTrail(
            this.x,
            3.3,
            this.z,
            nearbyThreat.x,
            1.2,
            nearbyThreat.z,
            0xa855f7
          );
        }

        // Si la Reine est détachée et non possédée directement, elle progresse vers les ordres phéromonaux ou les menaces
        const stageRts = window.gameInstance?.currentStage;
        if (!this.attachedToOvipositor && stageRts?.possessedUnit !== this) {
          const activeZone = pheromoneSystem.commandZones[pheromoneSystem.commandZones.length - 1];
          let targetX = null;
          let targetZ = null;
          if (activeZone) {
            targetX = activeZone.x;
            targetZ = activeZone.z;
          } else if (nearbyThreat) {
            targetX = nearbyThreat.x;
            targetZ = nearbyThreat.z;
          }
          if (targetX !== null) {
            const dist = Math.hypot(targetX - this.x, targetZ - this.z);
            if (dist > 3.0) {
              const dirX = (targetX - this.x) / dist;
              const dirZ = (targetZ - this.z) / dist;
              this.moveDirect(dirX, dirZ, deltaSeconds);
            }
          }
        }

        animateProceduralModel(this.mesh, {
          phase: this.animationPhase += Math.max(0, deltaSeconds) * (this.attachedToOvipositor ? 2.2 : 5.0),
          attack: this.attackAnimation,
          movement: this.attachedToOvipositor ? 0.08 : this.movementBlend,
          pulse: 0.45
        });
        return;
      }

      const activeZone = pheromoneSystem.commandZones[pheromoneSystem.commandZones.length - 1];
      if (activeZone) {
        const zoneRadius = Number(activeZone.radius) || 18;
        const isInsideZone = (human) => (
          Math.hypot(human.x - activeZone.x, human.z - activeZone.z) <= zoneRadius
        );
        const nearestInZone = (predicate) => humans
          .filter((human) => isInsideZone(human) && predicate(human))
          .reduce((closest, human) => {
            const distance = Math.hypot(human.x - this.x, human.z - this.z);
            return !closest || distance < closest.distance
              ? { x: human.x, z: human.z, human, distance }
              : closest;
          }, null);

        let target = activeZone;
        if (activeZone.command === 'HUNT' || activeZone.command === 'RUSH') {
          target = nearestInZone((human) => !human.isCocooned && !human.isIncapacitated) || activeZone;
        } else if (activeZone.command === 'CAPTURE') {
          target = nearestInZone((human) => (
            human.isIncapacitated &&
            !human.isCocooned &&
            human.hostEligibility !== 'none'
          )) || activeZone;
        } else if (activeZone.command === 'DEFEND') {
          target = nearestInZone((human) => !human.isCocooned && !human.isIncapacitated) || activeZone;
        }

        const dist = Math.hypot(target.x - this.x, target.z - this.z);
        const isRush = activeZone.command === 'RUSH';
        const isAttackOrder = activeZone.command === 'HUNT' || activeZone.command === 'DEFEND' || isRush;
        const stopRadius = target.human && isAttackOrder
          ? this.attackRange
          : (activeZone.command === 'DEFEND' ? 4 : (activeZone.command === 'CAPTURE' ? 1.5 : 2));
        if (dist > stopRadius) {
          const speedMultiplier = isRush ? 1.45 : (activeZone.command === 'HUNT' ? 1.15 : (activeZone.command === 'DEFEND' ? 0.75 : 1));
          this.moveDirect(
            (target.x - this.x) / dist,
            (target.z - this.z) / dist,
            deltaSeconds,
            dist,
            speedMultiplier
          );
        } else if (target.human) {
          if (activeZone.command === 'CAPTURE' && target.human.isIncapacitated) {
            if (target.human.cocoonInResin()) resinGrid.addResinPatch(target.human.x, target.human.z);
          } else if (isAttackOrder) {
            if (this.attackCooldown <= 0) {
              const baseCooldown = this.caste === 'runner' ? 0.62 : (this.caste === 'spitter' ? 1.45 : 0.86);
              this.attackCooldown = isRush ? baseCooldown * 0.68 : baseCooldown;
              this.attackAnimation = 1;
              const bonusDmg = isRush ? Math.round(this.damage * 1.35) : this.damage;
              const color = this.caste === 'spitter' ? 0xa3e635 : (isRush ? 0xdc2626 : 0x39ff14);
              if (this.caste === 'spitter') {
                const applyAcidHit = () => {
                  target.human?.takeDamage(bonusDmg, this);
                  audioManager.playAcidSizzle();
                };
                const projectileVfx = window.HiveSystems?.vfx;
                if (projectileVfx?.projectile) {
                  projectileVfx.projectile({
                    startX: this.x,
                    startY: 1.55,
                    startZ: this.z,
                    endX: target.human.x,
                    endY: 1.1,
                    endZ: target.human.z,
                    color,
                    scale: 0.2,
                    speed: 17,
                    acid: true,
                    onImpact: applyAcidHit
                  });
                } else {
                  applyAcidHit();
                }
              } else {
                target.human.takeDamage(bonusDmg, this);
                window.HiveSystems?.vfx?.organicTrail(
                  this.x,
                  this.caste === 'praetorian' ? 2.8 : 1.4,
                  this.z,
                  target.human.x,
                  1.1,
                  target.human.z,
                  color
                );
                window.HiveSystems?.vfx?.burst(
                  target.human.x,
                  target.human.z,
                  color,
                  this.caste === 'praetorian' ? 18 : 10,
                  0.1,
                  1.2
                );
                if (isRush) {
                  window.HiveSystems?.vfx?.floatingText?.(target.human.x, 2.5, target.human.z, `-${bonusDmg} RUSH ESSAIM !`, '#dc2626', true);
                  window.HiveSystems?.vfx?.ring?.(target.human.x, target.human.z, 0xdc2626, 3.2);
                }
                audioManager.playWetImpact?.(target.human.x, target.human.z);
              }
            }
          }
        } else if (activeZone.command === 'INFEST' && this.caste === 'worker' && this.supportCooldown <= 0) {
          this.supportCooldown = 3.2;
          this.attackAnimation = 0.65;
          resinGrid.addResinPatch(this.x, this.z, 3.4);
          audioManager.playCocoonWeave?.(this.x, this.z);
          window.HiveSystems?.vfx?.ring(this.x, this.z, 0x9d4edd, 2.4);
          const activeCycle = window.gameInstance?.currentStage?.incubationCycles
            ?.find((cycle) => cycle.isActive && Math.hypot(cycle.x - this.x, cycle.z - this.z) <= 8);
          activeCycle?.reinforce?.(8);
        }
      } else {
        // =========================================================================
        // IA AUTONOME DE L'ESSAIM (SANS ORDRE PHÉROMONAL ACTIF)
        // =========================================================================
        // 1. Interception automatique de toute menace dans un rayon de 14m
        const localThreat = humans
          .filter((h) => !h.isCocooned && !h.isIncapacitated && Math.hypot(h.x - this.x, h.z - this.z) <= 14)
          .sort((a, b) => Math.hypot(a.x - this.x, a.z - this.z) - Math.hypot(b.x - this.x, b.z - this.z))[0];

        if (localThreat) {
          const distThreat = Math.hypot(localThreat.x - this.x, localThreat.z - this.z);
          if (distThreat > this.attackRange) {
            this.moveDirect(
              (localThreat.x - this.x) / distThreat,
              (localThreat.z - this.z) / distThreat,
              deltaSeconds,
              distThreat,
              1.1
            );
          } else if (this.attackCooldown <= 0) {
            this.attackCooldown = this.caste === 'runner' ? 0.65 : 0.9;
            this.attackAnimation = 1;
            localThreat.takeDamage(this.damage, this);
            audioManager.playBoneCrunch?.();
            audioManager.playWetImpact?.(localThreat.x, localThreat.z);
            window.HiveSystems?.vfx?.burst(localThreat.x, localThreat.z, 0xef4444, 12, 0.1, 1.2);
          }
        } else {
          // 2. Garde d'élite & ralliement automatique autour de la Reine ou du nid
          const queenUnit = window.gameInstance?.currentStage?.queen;
          if (queenUnit && queenUnit !== this && !queenUnit.isDestroyed) {
            const distToQueen = Math.hypot(queenUnit.x - this.x, queenUnit.z - this.z);
            if (distToQueen > (['praetorian', 'palatine'].includes(this.caste) ? 6.5 : 12)) {
              this.moveDirect(
                (queenUnit.x - this.x) / distToQueen,
                (queenUnit.z - this.z) / distToQueen,
                deltaSeconds,
                distToQueen,
                0.85
              );
            }
          }
        }
      }
      animateProceduralModel(this.mesh, {
        phase: this.animationPhase += Math.max(0, deltaSeconds) * 2.5,
        movement: Math.max(0.08, this.movementBlend),
        attack: this.attackAnimation,
        pulse: this.caste === 'praetorian' ? 0.25 : 0
      });
    }
  }

  // -------------------------------------------------------------
  // CYCLES BIOLOGIQUES VISIBLES ET DESTRUCTIBLES
  // -------------------------------------------------------------
  class BiologicalCycleEntity {
    constructor({
      id,
      x,
      z,
      caste,
      hostName,
      duration = 18,
      maxIntegrity = 150,
      states = ['OVOMORPHE', 'FACEHUGGER', 'IMPLANTATION', 'CHESTBURSTER', 'MUE'],
      onStateChange = null,
      canComplete = null,
      onComplete = null,
      onFail = null
    }) {
      this.id = id;
      this.x = x;
      this.z = z;
      this.caste = caste;
      this.hostName = hostName || 'hôte inconnu';
      this.duration = Math.max(1, duration);
      this.maxIntegrity = maxIntegrity;
      this.integrity = maxIntegrity;
      this.states = states;
      this.stateIndex = 0;
      this.state = states[0];
      this.progress = 0;
      this.mesh = null;
      this.isActive = true;
      this.isDestroyed = false;
      this.isComplete = false;
      this.onStateChange = onStateChange;
      this.canComplete = canComplete;
      this.onComplete = onComplete;
      this.onFail = onFail;
    }

    createMesh() {
      const group = new THREE.Group();
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(this.caste === 'queen' ? 1.7 : 1.05, 14, 14),
        new THREE.MeshStandardMaterial({
          color: this.caste === 'queen' ? 0x581c87 : 0x334155,
          emissive: 0x7e22ce,
          emissiveIntensity: 0.7,
          roughness: 0.32,
          transparent: true,
          opacity: 0.9
        })
      );
      core.name = 'biological-cycle-core';
      core.scale.set(1, this.caste === 'queen' ? 1.8 : 1.35, 1);
      core.position.y = this.caste === 'queen' ? 2.2 : 1.35;
      group.add(core);

      const membrane = new THREE.Mesh(
        new THREE.TorusGeometry(this.caste === 'queen' ? 2.25 : 1.4, 0.16, 8, 24),
        new THREE.MeshStandardMaterial({ color: 0x9d4edd, emissive: 0x9d4edd, emissiveIntensity: 1.2 })
      );
      membrane.name = 'biological-cycle-membrane';
      membrane.rotation.x = Math.PI / 2;
      membrane.position.y = 0.25;
      group.add(membrane);

      const light = new THREE.PointLight(0xa855f7, this.caste === 'queen' ? 4 : 2.5, 18);
      light.name = 'biological-cycle-light';
      light.position.y = 2;
      group.add(light);
      group.position.set(this.x, 0, this.z);
      rendererEngine.scene.add(group);
      this.mesh = group;
      this.refreshVisual();
    }

    refreshVisual() {
      if (!this.mesh) return;
      const stateRatio = this.states.length <= 1 ? 1 : this.stateIndex / (this.states.length - 1);
      const core = this.mesh.getObjectByName('biological-cycle-core');
      const membrane = this.mesh.getObjectByName('biological-cycle-membrane');
      if (core) {
        const growth = 0.82 + stateRatio * 0.5;
        core.scale.set(growth, growth * (this.caste === 'queen' ? 1.8 : 1.35), growth);
        if (core.material?.emissive) {
          core.material.emissive.setHex(this.state.includes('MUE') ? 0x39ff14 : 0x7e22ce);
          core.material.emissiveIntensity = 0.65 + stateRatio;
        }
      }
      if (membrane) membrane.rotation.z = this.progress * 0.025;
    }

    reinforce(amount) {
      if (!this.isActive) return;
      this.integrity = Math.min(this.maxIntegrity, this.integrity + Math.max(0, amount));
    }

    takeDamage(amount) {
      if (!this.isActive) return false;
      this.integrity = Math.max(0, this.integrity - Math.max(0, amount));
      window.HiveSystems?.vfx?.burst(this.x, this.z, 0xa855f7, 12, 0.11, 1.3);
      if (this.integrity <= 0) this.fail();
      return true;
    }

    fail() {
      if (!this.isActive) return;
      this.isActive = false;
      this.isDestroyed = true;
      this.destroyMesh();
      this.onFail?.(this);
    }

    complete() {
      if (!this.isActive) return;
      this.isActive = false;
      this.isComplete = true;
      this.destroyMesh();
      this.onComplete?.(this);
    }

    destroyMesh() {
      if (this.mesh) rendererEngine.removeObject(this.mesh);
      this.mesh = null;
    }

    destroy() {
      this.isActive = false;
      this.destroyMesh();
    }

    update(deltaSeconds = 1 / 60) {
      if (!this.isActive) return;
      this.progress = Math.min(100, this.progress + (Math.max(0, deltaSeconds) / this.duration) * 100);
      const nextIndex = Math.min(
        this.states.length - 1,
        Math.floor((this.progress / 100) * this.states.length)
      );
      if (nextIndex !== this.stateIndex) {
        this.stateIndex = nextIndex;
        this.state = this.states[nextIndex];
        this.onStateChange?.(this);
      }
      this.refreshVisual();
      if (this.progress >= 100) {
        if (this.canComplete && !this.canComplete(this)) {
          this.progress = 99.5;
          return;
        }
        this.complete();
      }
    }
  }

  // -------------------------------------------------------------
  // CINÉMATIQUE 3D — VUE INTRA-THORACIQUE DU CHESTBURSTER
  // -------------------------------------------------------------
  class ThoracicView {
    constructor() {
      this.group = null;
      this.tissue = null;
      this.heartLight = null;
      this.sternumPlates = [];
      this.fluidParticles = [];
      this.bumpTexture = null;
      this.x = 0;
      this.z = 0;
      this.hostX = 0;
      this.hostZ = 0;
      this.time = 0;
      this.burstProgress = 0;
      this.heartbeatSoundCooldown = 0;
    }

    createTube(material, points, radius = 0.08) {
      const curve = new THREE.CatmullRomCurve3(points);
      return new THREE.Mesh(new THREE.TubeGeometry(curve, 20, radius, 7, false), material);
    }

    activate(x, z) {
      this.deactivate();
      this.hostX = x;
      this.hostZ = z;
      // The anatomical set is staged outside the playable station so no wall,
      // prop or actor can intersect the full-screen internal camera.
      this.x = 0;
      this.z = 280;
      this.time = 0;
      this.burstProgress = 0;
      this.heartbeatSoundCooldown = 0;
      const group = new THREE.Group();
      group.name = 'intra_thoracic_view';
      group.position.set(this.x, 0, this.z);

      const loader = new THREE.TextureLoader();
      const bump = loader.load('assets/textures/organic-bump.png', undefined, undefined, () => {});
      this.bumpTexture = bump;
      bump.wrapS = THREE.RepeatWrapping;
      bump.wrapT = THREE.RepeatWrapping;
      bump.repeat.set(3, 2);

      const tissueMaterial = new THREE.MeshStandardMaterial({
        color: 0x3d0811,
        emissive: 0x130104,
        emissiveIntensity: 0.42,
        bumpMap: bump,
        bumpScale: 0.31,
        roughness: 0.74,
        metalness: 0.02,
        side: THREE.BackSide
      });
      const wetMaterial = new THREE.MeshStandardMaterial({
        color: 0x651120,
        emissive: 0x26030a,
        emissiveIntensity: 0.42,
        roughness: 0.16,
        metalness: 0.06
      });
      const boneMaterial = new THREE.MeshStandardMaterial({
        color: 0x685647,
        emissive: 0x160907,
        emissiveIntensity: 0.12,
        roughness: 0.82
      });
      const fractureMaterial = new THREE.MeshBasicMaterial({
        color: 0xff293f,
        transparent: true,
        opacity: 0.8,
        depthWrite: false
      });

      this.tissue = new THREE.Mesh(new THREE.SphereGeometry(3.35, 36, 28), tissueMaterial);
      this.tissue.position.set(0, 2.6, 0.9);
      this.tissue.scale.set(1.05, 0.82, 1.34);
      group.add(this.tissue);

      for (let ribIndex = 0; ribIndex < 7; ribIndex++) {
        const y = 1.35 + ribIndex * 0.42;
        const zDepth = 1.5 + Math.abs(3 - ribIndex) * 0.08;
        for (const side of [-1, 1]) {
          const rib = this.createTube(
            boneMaterial,
            [
              new THREE.Vector3(side * 2.45, y, 0.15),
              new THREE.Vector3(side * 2.08, y + 0.02, 1.08),
              new THREE.Vector3(side * 1.34, y - 0.02, zDepth),
              new THREE.Vector3(side * 0.54, y, 2.18),
              new THREE.Vector3(side * 0.28, y, 2.46)
            ],
            0.047 + ribIndex * 0.002
          );
          rib.name = `inner_rib_${ribIndex}_${side < 0 ? 'left' : 'right'}`;
          group.add(rib);
        }
      }

      for (let plateIndex = 0; plateIndex < 7; plateIndex++) {
        const plate = new THREE.Mesh(
          new THREE.BoxGeometry(0.54, 0.34, 0.2),
          boneMaterial
        );
        plate.name = `sternum_plate_${plateIndex}`;
        plate.position.set(0, 1.36 + plateIndex * 0.42, 2.5);
        plate.rotation.z = (plateIndex % 2 === 0 ? -1 : 1) * 0.035;
        plate.userData.basePosition = plate.position.clone();
        group.add(plate);
        this.sternumPlates.push(plate);

        const fracture = new THREE.Mesh(
          new THREE.BoxGeometry(0.035, 0.26, 0.025),
          fractureMaterial
        );
        fracture.position.set(
          plateIndex % 2 === 0 ? -0.08 : 0.08,
          0,
          -0.12
        );
        fracture.rotation.z = (plateIndex % 2 === 0 ? -1 : 1) * 0.32;
        plate.add(fracture);
      }

      for (let veinIndex = 0; veinIndex < 12; veinIndex++) {
        const side = veinIndex % 2 === 0 ? -1 : 1;
        const y = 0.8 + (veinIndex % 6) * 0.62;
        const vein = this.createTube(
          wetMaterial,
          [
            new THREE.Vector3(side * 2.75, y, -0.3),
            new THREE.Vector3(side * 2.55, y + 0.25, 0.7),
            new THREE.Vector3(side * 2.72, y - 0.12, 1.65),
            new THREE.Vector3(side * 2.45, y + 0.18, 2.45)
          ],
          0.045 + (veinIndex % 3) * 0.012
        );
        vein.name = `thoracic_vessel_${veinIndex}`;
        group.add(vein);
      }

      for (let particleIndex = 0; particleIndex < 34; particleIndex++) {
        const particle = new THREE.Mesh(
          new THREE.SphereGeometry(0.025 + Math.random() * 0.035, 6, 6),
          new THREE.MeshBasicMaterial({
            color: particleIndex % 3 === 0 ? 0xff8b77 : 0xb91c36,
            transparent: true,
            opacity: 0.52
          })
        );
        particle.position.set(
          (Math.random() - 0.5) * 4.5,
          0.7 + Math.random() * 3.8,
          -0.35 + Math.random() * 3
        );
        particle.userData.baseY = particle.position.y;
        particle.userData.speed = 0.25 + Math.random() * 0.55;
        group.add(particle);
        this.fluidParticles.push(particle);
      }

      this.heartLight = new THREE.PointLight(0xd9163b, 2.6, 8);
      this.heartLight.position.set(0, 2.7, 0.45);
      group.add(this.heartLight);
      const fillLight = new THREE.PointLight(0xff735c, 0.82, 7);
      fillLight.position.set(0, 2.2, 2.25);
      group.add(fillLight);

      rendererEngine.scene.add(group);
      this.group = group;
      audioManager.playInternalHeartbeat?.();
    }

    setBurstProgress(progress) {
      this.burstProgress = Math.max(0, Math.min(1, progress));
      const opening = Math.pow(this.burstProgress, 1.7);
      this.sternumPlates.forEach((plate, index) => {
        const side = index % 2 === 0 ? -1 : 1;
        plate.position.copy(plate.userData.basePosition);
        plate.position.x += side * opening * (0.18 + index * 0.025);
        plate.position.z += opening * 0.22;
        plate.rotation.y = side * opening * 0.24;
      });
    }

    update(deltaSeconds) {
      if (!this.group) return;
      this.time += Math.max(0, deltaSeconds);
      this.heartbeatSoundCooldown -= Math.max(0, deltaSeconds);
      const heartbeat = Math.pow(Math.max(0, Math.sin(this.time * 7.8)), 8);
      const tissuePulse = 1 + heartbeat * 0.025 + this.burstProgress * 0.045;
      this.tissue?.scale.set(
        1.05 * tissuePulse,
        0.82 * tissuePulse,
        1.34 * tissuePulse
      );
      if (this.heartLight) this.heartLight.intensity = 1.7 + heartbeat * 3.6;
      this.fluidParticles.forEach((particle, index) => {
        particle.position.y = particle.userData.baseY + Math.sin(
          this.time * particle.userData.speed * 4 + index
        ) * 0.12;
        particle.material.opacity = 0.35 + heartbeat * 0.32;
      });
      if (heartbeat > 0.82 && this.heartbeatSoundCooldown <= 0) {
        this.heartbeatSoundCooldown = 0.72;
        audioManager.playInternalHeartbeat?.();
      }
    }

    getCameraOverride() {
      if (!this.group) return null;
      const shake = rendererEngine.reduceMotion ? 0 : Math.sin(this.time * 19) * 0.012;
      const push = this.burstProgress * 0.5;
      return {
        position: {
          x: this.x + shake,
          y: 2.58 + shake,
          z: this.z - 1.48 + push
        },
        target: {
          x: this.x,
          y: 2.57,
          z: this.z + 2.5
        },
        fov: 70 + this.burstProgress * 8,
        near: 0.02,
        exposure: 0.92
      };
    }

    deactivate() {
      if (this.group) rendererEngine.removeObject(this.group);
      this.bumpTexture?.dispose?.();
      this.group = null;
      this.tissue = null;
      this.heartLight = null;
      this.sternumPlates = [];
      this.fluidParticles = [];
      this.bumpTexture = null;
    }
  }

  // -------------------------------------------------------------
  // STAGES LOGIC WITH GUARANTEED ATTACKS & TRANSITIONS
  // -------------------------------------------------------------
  class StageEgg {
    constructor() {
      this.step = 'CLOSED';
      this.senseCalibrations = 0;
      this.luredScientist = false;
      this.hostArrived = false;
      this.isCompleted = false;
    }
    init() {
      playerCreature.setAdultCaste('drone');
      if (window.gameInstance) window.gameInstance.hostProfile = null;
      playerCreature.setForm('egg');
      alarmSystem.setLevel(0);
      this.updateHUD();
      this.log('[OVOMORPHE] La coquille perçoit chaleur, pression et vibrations.');
      window.HiveSystems?.setMission(1, 0, 'Calibrer les sens biologiques sur trois sources.');
    }
    updateHUD() {
      document.getElementById('stage-badge').textContent = 'PHASE 1 : OVOMORPHE (INCUBATEUR)';
      document.getElementById('bio-title').textContent = 'STATUT OVOMORPHE — INCUBATEUR';
      setHudBar('vital', 'VITALITÉ OVOMORPHE', 100);
      setHudBar('sec', 'LECTURE SENSORIELLE', (this.senseCalibrations / 3) * 100);
      const inst = document.getElementById('stage-instructions');
      const actionsContainer = document.getElementById('action-buttons-container');
      if (this.step === 'CLOSED') {
        inst.innerHTML = '<strong>Incubateur scellé :</strong><br><br>• Analysez trois signatures.<br>• Émettez ensuite un stimulus de proximité.<br>• N’ouvrez qu’une fois l’hôte à portée.';
        actionsContainer.innerHTML = `
          <button type="button" id="btn-calibrate-senses" class="act-btn" ${this.senseCalibrations >= 3 ? 'disabled' : ''}>1. CALIBRER LES SENS — ${this.senseCalibrations}/3</button>
          <button type="button" id="btn-lure" class="act-btn" ${this.senseCalibrations < 3 || this.luredScientist ? 'disabled' : ''}>2. ÉMETTRE UN STIMULUS DE PROXIMITÉ</button>
          <button type="button" id="btn-open-egg" class="act-btn" ${!this.hostArrived ? 'disabled' : ''}>3. ENTROUVRIR LES PÉTALES</button>
        `;
        document.getElementById('btn-calibrate-senses').onclick = () => {
          if (this.senseCalibrations >= 3) return;
          this.senseCalibrations++;
          audioManager.playMotionTrackerPing(12 - this.senseCalibrations * 2);
          this.log(`[SENS] Signature ${this.senseCalibrations}/3 identifiée.`);
          window.HiveSystems?.updateObjective(1, this.senseCalibrations >= 3 ? 1 : 0);
          this.updateHUD();
        };
        document.getElementById('btn-lure').onclick = () => {
          if (this.luredScientist || this.senseCalibrations < 3) return;
          audioManager.playHeartbeat();
          this.luredScientist = true;
          this.hostArrived = false;
          this.log('[STIMULUS] La xénobiologiste Imani Kade s’approche de l’incubateur.');
          if (window.gameInstance && window.gameInstance.humans[0]) {
            window.gameInstance.humans[0].lureTowards(playerCreature.x, playerCreature.z + 1.2);
          }
          window.HiveSystems?.updateObjective(1, 2, 'Attendre que la cible entre dans la fenêtre d’éclosion.');
          window.HiveSystems?.narrative('IMANI KADE', 'Le capteur détecte un changement de pression. Je vais vérifier la chambre.');
          this.updateHUD();
        };
        document.getElementById('btn-open-egg').onclick = () => {
          if (!this.hostArrived || this.step !== 'CLOSED') return;
          audioManager.playEggOpen();
          this.step = 'OPENED';
          playerCreature.openEgg();
          window.HiveSystems?.vfx?.ring(playerCreature.x, playerCreature.z, 0xf59e0b, 2.5);
          window.HiveSystems?.updateObjective(1, 2, 'Libérer le Facehugger lorsque l’hôte est à portée.');
          this.updateHUD();
          requestAnimationFrame(() => document.getElementById('btn-expel-facehugger')?.focus({ preventScroll: true }));
        };
      } else {
        inst.innerHTML = '<strong>Fenêtre d’éclosion :</strong><br><br>• Libérez le parasite avant le retour du scanner.';
        actionsContainer.innerHTML = '<button type="button" id="btn-expel-facehugger" class="act-btn" style="border-color: #f59e0b;">4. LIBÉRER LE FACEHUGGER</button>';
        document.getElementById('btn-expel-facehugger').onclick = () => {
          if (this.isCompleted) return;
          this.isCompleted = true;
          window.HiveSystems?.updateObjective(1, 3);
          if (window.gameInstance) window.gameInstance.advanceStage(this);
          audioManager.playHatch();
          audioManager.playFacehuggerLeap();
        };
      }
    }
    log(msg) { appendSensorLog(msg, 'bio'); }
    update() {
      if (!this.luredScientist || this.hostArrived || this.step !== 'CLOSED') return;
      const host = window.gameInstance?.humans.find((human) => human.type === 'scientist');
      if (!host) return;
      const distance = Math.hypot(host.x - playerCreature.x, host.z - playerCreature.z);
      if (
        distance <= 4.2 &&
        stationMap.hasLineOfSight(host.x, host.z, playerCreature.x, playerCreature.z, 0.12)
      ) {
        this.hostArrived = true;
        host.isLured = false;
        host.navigationGoal = null;
        host.pathWaypoints = [];
        host.targetPos = { x: host.x, z: host.z };
        this.log('[PROXIMITÉ] Hôte dans la fenêtre d’éclosion. Les pétales peuvent s’entrouvrir.');
        window.HiveSystems?.updateObjective(1, 2, 'Entrouvrir les pétales pendant que l’hôte observe l’incubateur.');
        this.updateHUD();
        requestAnimationFrame(() => document.getElementById('btn-open-egg')?.focus({ preventScroll: true }));
      }
    }
  }

  class StageFacehugger {
    constructor() {
      this.bioTimer = 100;
      this.isCompleted = false;
      this.targetHost = null;
      this.isAttacking = false;
      this.isBonding = false;
      this.implantProgress = 0;
      this.lastImplantPercent = -1;
    }
    init() {
      playerCreature.setForm('facehugger');
      alarmSystem.setLevel(1);
      if (window.gameInstance) {
        const asterState = window.gameInstance.campaignCharacters.asterRho;
        if (
          asterState.alive &&
          !asterState.usedAsHost &&
          !window.gameInstance.humans.some((human) => human.characterKey === 'asterRho')
        ) {
          const protectedHost = new HumanAI(11, 'commando', 6, -18, 'Surveillante Aster Rho');
          protectedHost.characterKey = 'asterRho';
          protectedHost.maskAttachments = asterState.maskAttachments;
          protectedHost.hostEligibility = protectedHost.maskAttachments > 0 ? 'protected' : 'viable';
          protectedHost.createMesh();
          window.gameInstance.humans.push(protectedHost);
        }
      }
      if (window.gameInstance && !window.gameInstance.humans.some((human) => human.type === 'labhound')) {
        const serviceAnimal = new HumanAI(12, 'labhound', -38, -8, 'Animal de service K-9');
        serviceAnimal.hp = serviceAnimal.maxHp = 80;
        serviceAnimal.hostEligibility = 'viable';
        serviceAnimal.createMesh();
        window.gameInstance.humans.push(serviceAnimal);
      }
      this.updateHUD();
      appendSensorLog('[FACEHUGGER] Rejoignez une cible viable, bondissez puis maintenez l’agrippement.', 'bio');
      window.HiveSystems?.setMission(2, 0, 'Approcher un hôte viable sans toucher les équipes de capture.');
    }
    updateHUD() {
      document.getElementById('stage-badge').textContent = 'PHASE 2 : FACEHUGGER (ACTION RÉELLE)';
      document.getElementById('bio-title').textContent = 'STATUT DU FACEHUGGER — RECHERCHE D\'HÔTE';
      setHudBar(
        'vital',
        'VIABILITÉ DU PARASITE',
        (playerCreature.health / playerCreature.maxHealth) * 100,
        `${Math.ceil(playerCreature.health)}/${playerCreature.maxHealth}`
      );
      setHudBar(
        'sec',
        this.isAttacking ? 'IMPLANTATION' : (this.isBonding ? 'TRAJECTOIRE DU BOND' : 'RÉSERVE DE BOND'),
        this.isAttacking ? this.implantProgress : (this.isBonding ? 55 : 100)
      );
      const aster = window.gameInstance?.humans.find((human) => human.characterKey === 'asterRho');
      const maskStatus = aster
        ? `${aster.maskAttachments}/2 attaches intactes`
        : 'indisponible dans cette continuité';
      document.getElementById('stage-instructions').innerHTML = this.isAttacking
        ? '<strong>Lutte :</strong><br><br>• Le parasite est replié sur le visage et sa queue verrouille la nuque.<br>• Pressez Espace ou le bouton pour resserrer l’étreinte.<br>• Maintenez l’agrippement jusqu’à implantation complète.'
        : (this.isBonding
          ? '<strong>Bond en cours :</strong><br><br>• Trajectoire verrouillée sur le visage de l’hôte.'
          : `<strong>Choix d’hôte :</strong><br><br>• Imani Kade produit un Drone polyvalent.<br>• L’animal de service produit un Runner quadrupède.<br>• Un commando blindé produit un Warrior.<br>• Masque d’Aster Rho : ${maskStatus}. Chaque bond arrache une attache avant toute implantation.<br>• Déplacez-vous puis bondissez à courte portée.`);
      const actionsContainer = document.getElementById('action-buttons-container');
      actionsContainer.innerHTML = this.isAttacking
        ? `<button type="button" id="btn-action-leap" class="act-btn" style="border-color: #f59e0b;">RESSERRER L’ÉTREINTE — ${Math.round(this.implantProgress)}% [ESPACE]</button>`
        : `<button type="button" id="btn-action-leap" class="act-btn" ${this.isBonding ? 'disabled' : ''} style="border-color: #39ff14;">${this.isBonding ? 'BOND EN COURS…' : 'BONDIR SUR LE VISAGE [ESPACE]'}</button>`;
      document.getElementById('btn-action-leap').onclick = () => this.isAttacking ? this.tightenGrip() : this.attemptLeap();
    }
    attemptLeap() {
      if (this.isAttacking || this.isBonding || this.isCompleted) return;
      const humans = window.gameInstance ? window.gameInstance.humans : [];
      let closestHost = null;
      let closestDistance = Infinity;
      for (const human of humans) {
        if (human.isInfected || human.isCocooned || human.hostEligibility === 'none' || human.usedAsHost) continue;
        const distance = Math.hypot(human.x - playerCreature.x, human.z - playerCreature.z);
        if (distance < closestDistance) {
          closestHost = human;
          closestDistance = distance;
        }
      }

      // Canon 1:1 Lore — Détection et rejet absolu des androïdes / synthétiques (fluide blanc / pas d'appareil respiratoire)
      const nearbySynth = humans.find((h) => (
        ['synthetic', 'android'].includes(h.type) &&
        !h.isIncapacitated &&
        Math.hypot(h.x - playerCreature.x, h.z - playerCreature.z) <= 7.0
      ));
      if (nearbySynth && (!closestHost || closestDistance > 7.0)) {
        audioManager.playSyntheticGlitchedVoice?.(nearbySynth.x, nearbySynth.z);
        showToast(`HÔTE REJETÉ : ${nearbySynth.name} est un synthétique (fluide blanc). Absence de voies respiratoires !`);
        appendSensorLog(`[CHÉMORÉCEPTION] Polymères froids et fluide blanc détectés sur ${nearbySynth.name}. Le parasite rejette les androïdes.`, 'alert');
        return;
      }

      // Chantier 15 : Le Facehugger peut briser la vitre d'un caisson cryogénique pour infecter l'occupant
      const closePod = (stationMap.cryoPods || []).find((p) => !p.isBroken && Math.hypot(p.x - playerCreature.x, p.z - playerCreature.z) <= 4.8);
      if (closePod && (!closestHost || closestDistance > 4.8)) {
        stationMap.shatterCryoPod(closePod, playerCreature);
        audioManager.playLeapAttack?.();
        rendererEngine.addScreenShake?.(0.25, 0.15);
        return;
      }

      if (!closestHost || closestDistance > 16) {
        showToast('Aucun hôte à portée : rapprochez-vous du secteur ciblé.');
        appendSensorLog('[FACEHUGGER] Bond impossible : aucun visage à portée.', 'alert');
        return;
      }

      // Le masque d'Aster doit perdre ses deux attaches avant de rendre le visage viable.
      if (closestHost.hostEligibility === 'protected' && closestHost.maskAttachments > 0) {
        this.isBonding = true;
        audioManager.playFacehuggerLeap();
        this.updateHUD();
        playerCreature.startLeapTo(closestHost, () => {
          closestHost.maskAttachments--;
          playerCreature.x = closestHost.x + 2.4;
          playerCreature.z = closestHost.z + 1.4;
          playerCreature.mesh?.position.set(playerCreature.x, 0.35, playerCreature.z);
          playerCreature.mesh?.rotation.set(0, 0, 0);
          playerCreature.isLeaping = false;
          this.isBonding = false;
          audioManager.playMetalImpact?.(closestHost.x, closestHost.z);
          window.HiveSystems?.vfx?.burst(closestHost.x, closestHost.z, 0x38bdf8, 14, 0.1, 1.4);
          if (closestHost.maskAttachments <= 0) {
            closestHost.hostEligibility = 'viable';
            appendSensorLog('[MASQUE] Deuxième attache arrachée : Aster est désormais implantable.', 'alert');
          } else {
            appendSensorLog('[MASQUE] Première attache arrachée : une fixation protège encore Aster.', 'bio');
          }
          window.gameInstance?.syncCampaignCharacter?.(closestHost);
          this.updateHUD();
        });
        return;
      }

      this.targetHost = closestHost;
      if (window.gameInstance) {
        window.gameInstance.hostProfile = closestHost.type;
        const armoredHostTypes = ['commando', 'smartgunner', 'gyro', 'marine'];
        const adultCaste = closestHost.type === 'labhound'
          ? 'runner'
          : (armoredHostTypes.includes(closestHost.type) ? 'warrior' : 'drone');
        playerCreature.setAdultCaste(adultCaste);
      }
      this.isBonding = true;
      this.implantProgress = 0;
      audioManager.playFacehuggerLeap();
      this.updateHUD();
      playerCreature.startLeapTo(closestHost, () => {
        if (this.isCompleted || this.targetHost !== closestHost) return;
        this.isBonding = false;
        this.isAttacking = playerCreature.attachToFace(closestHost);
        this.implantProgress = this.isAttacking ? 15 : 0;
        audioManager.playFacehuggerGrip?.(closestHost.x, closestHost.z);
        window.HiveSystems?.vfx?.burst(closestHost.x, closestHost.z, 0xd97706, 16, 0.11, 2.4);
        window.HiveSystems?.updateObjective(2, 1, 'Maintenir l’agrippement jusqu’à implantation complète.');
        this.updateHUD();
      });
    }

    tightenGrip() {
      if (!this.isAttacking || this.isCompleted) return;
      this.implantProgress = Math.min(100, this.implantProgress + 14);
      audioManager.playHeartbeat(1.2);
      this.updateHUD();
      this.finishImplantationIfReady();
    }

    finishImplantationIfReady() {
      if (this.implantProgress < 100 || this.isCompleted || !this.targetHost) return;
      this.targetHost.isInfected = true;
      this.targetHost.infectionState = 'RECOVERING';
      this.targetHost.usedAsHost = true;
      this.targetHost.isRestrained = false;
      window.gameInstance?.syncCampaignCharacter?.(this.targetHost, { alive: true });
      playerCreature.detachFromHost({ releaseHost: true, hide: true });

      // Canon 1:1 Lore — Le Facehugger se détache, meurt et son cadavre desséché reste au sol (Alien 1979 / Medlab)
      const deadHusk = window.HiveModelFactory?.createDeadFacehuggerHusk?.();
      if (deadHusk) {
        deadHusk.position.set(this.targetHost.x + 0.7, 0.04, this.targetHost.z + 0.5);
        rendererEngine.propsGroup.add(deadHusk);
      }

      this.isCompleted = true;
      window.HiveSystems?.updateObjective(2, 2);
      window.HiveSystems?.narrative('PALIMPSESTE', 'Organisme implanté. Les protocoles humains passent en quarantaine totale.');
      if (window.gameInstance) window.gameInstance.advanceStage(this);
      audioManager.playAcidSizzle();
    }

    handleKeyDown(key) {
      if (key === 'c') {
        const vent = stationMap.findClosestVent(playerCreature.x, playerCreature.z);
        if (vent) {
          if (!playerCreature.isInVent && vent.distance <= 4.5) {
            playerCreature.enterVent(vent);
            return;
          } else if (playerCreature.isInVent && vent.distance <= 5.5) {
            playerCreature.exitVent(vent);
            return;
          }
        }
        if (playerCreature.isInVent) showToast('Rapprochez-vous d\'une grille pour émerger du conduit.');
        else showToast(vent ? `Approchez-vous du ${vent.name} (${vent.distance.toFixed(1)}m) pour vous infiltrer [C].` : 'Aucun conduit à proximité.');
        return;
      }
      if (key !== ' ') return;
      if (this.isAttacking) this.tightenGrip();
      else if (!this.isBonding) this.attemptLeap();
    }
    destroy() {
      if (playerCreature.attachedHost) playerCreature.detachFromHost({ releaseHost: true, hide: true });
    }
    update(deltaSeconds = 1 / 60) {
      if (!this.isAttacking || this.isCompleted) return;
      this.implantProgress = Math.min(100, this.implantProgress + (6 / 0.42) * Math.max(0, deltaSeconds));
      const displayedPercent = Math.floor(this.implantProgress);
      if (displayedPercent !== this.lastImplantPercent) {
        this.lastImplantPercent = displayedPercent;
        this.updateHUD();
      }
      this.finishImplantationIfReady();
    }
  }

  class StageChestburster {
    constructor() {
      this.step = 'INTERNAL_GESTATION';
      this.gestationProgress = 0;
      this.recoveryElapsed = 0;
      this.burstTimer = 0;
      this.burstCrackStage = 0;
      this.biomassHunted = 0;
      this.chrysalisTimer = 0;
      this.lastDisplayedPercent = -1;
      this.isCompleted = false;
      this.infectedHost = null;
      this.rodents = [];
      this.biteCooldown = 0;
      this.biteTarget = null;
      this.huntedRodentTarget = null;
      this.huntRepathCooldown = 0;
      this.rations = [];
      this.thoracicView = new ThoracicView();
    }

    setInternalViewUI(active, bursting = false) {
      const app = document.getElementById('app-container');
      const controls = document.getElementById('thoracic-controls');
      const button = document.getElementById('btn-thoracic-erupt');
      const status = document.getElementById('thoracic-status');
      app?.classList.toggle('is-internal-view', active);
      controls?.classList.toggle('hidden', !active);
      controls?.setAttribute('aria-hidden', String(!active));
      if (status) {
        status.textContent = bursting
          ? 'Les plaques sternales cèdent sous la poussée.'
          : 'Les contractions convergent vers le sternum.';
      }
      if (button) {
        button.disabled = bursting;
        button.textContent = bursting ? 'RUPTURE DU STERNUM…' : 'PERFORER LE STERNUM [ESPACE]';
        button.onclick = active && !bursting ? () => this.perforateSternum() : null;
      }
    }

    init() {
      this.setInternalViewUI(false);
      playerCreature.setForm('chestburster');
      if (playerCreature.mesh) playerCreature.mesh.visible = false;
      alarmSystem.setLevel(2);
      this.infectedHost = window.gameInstance?.humans.find((human) => human.isInfected && human.usedAsHost) || null;
      if (!this.infectedHost && window.gameInstance) {
        const savedAster = window.gameInstance.campaignCharacters.asterRho;
        const restoredType = savedAster.usedAsHost
          ? 'commando'
          : (window.gameInstance.hostProfile || 'scientist');
        const restoredName = savedAster.usedAsHost ? 'Surveillante Aster Rho' : 'Hôte de quarantaine';
        this.infectedHost = new HumanAI(31, restoredType, playerCreature.x, playerCreature.z, restoredName);
        if (savedAster.usedAsHost) {
          this.infectedHost.characterKey = 'asterRho';
          this.infectedHost.maskAttachments = savedAster.maskAttachments;
        }
        this.infectedHost.isInfected = true;
        this.infectedHost.usedAsHost = true;
        this.infectedHost.infectionState = 'RECOVERING';
        this.infectedHost.createMesh();
        window.gameInstance.humans.push(this.infectedHost);
      }
      if (this.infectedHost) {
        this.infectedHost.isRestrained = false;
        this.infectedHost.isBursting = false;
        this.infectedHost.infectionState = 'RECOVERING';
        this.infectedHost.aiState = 'PATROL';
        this.infectedHost.choosePatrolWaypoint();
        playerCreature.x = this.infectedHost.x;
        playerCreature.z = this.infectedHost.z;
        playerCreature.mesh?.position.set(playerCreature.x, 0, playerCreature.z);
      }
      this.updateHUD();
      appendSensorLog('[GESTATION] L’hôte reprend connaissance. La croissance demeure entièrement interne.', 'bio');
      window.HiveSystems?.setMission(3, 0, 'Maturer sans révéler la présence du parasite à l’extérieur.');
      window.HiveSystems?.narrative('IMANI KADE', 'Je… je vais bien. Le sédatif doit se dissiper.');
    }

    updateHUD() {
      document.getElementById('stage-badge').textContent = 'PHASE 3 : CHESTBURSTER & CHRYSALIDE';
      document.getElementById('bio-title').textContent = this.step === 'INTERNAL_GESTATION'
        ? 'TUMEUR INTERNE — INDÉTECTABLE'
        : (this.step === 'READY_TO_BURST' || this.step === 'BURST_SEQUENCE'
          ? 'PRESSION SOUS-STERNALE'
          : 'CROISSANCE DU CHESTBURSTER');
      setHudBar(
        'vital',
        this.step === 'INTERNAL_GESTATION' ? 'STABILITÉ DE L’HÔTE' : 'VITALITÉ DU JUVÉNILE',
        this.step === 'INTERNAL_GESTATION' || this.step === 'READY_TO_BURST' || this.step === 'BURST_SEQUENCE'
          ? 100
          : (playerCreature.health / playerCreature.maxHealth) * 100,
        this.step === 'INTERNAL_GESTATION' || this.step === 'READY_TO_BURST' || this.step === 'BURST_SEQUENCE'
          ? '100%'
          : `${Math.ceil(playerCreature.health)}/${playerCreature.maxHealth}`
      );
      setHudBar(
        'sec',
        this.step === 'CHRYSALIS'
          ? 'MATURATION'
          : (this.step === 'HUNT_FAUNA' ? 'BIOMASSE ASSIMILÉE' : 'GESTATION INTERNE'),
        this.step === 'CHRYSALIS'
          ? this.chrysalisTimer
          : (this.step === 'HUNT_FAUNA' ? (this.biomassHunted / 3) * 100 : this.gestationProgress)
      );
      const actionsContainer = document.getElementById('action-buttons-container');
      const instructions = document.getElementById('stage-instructions');
      if (this.step === 'INTERNAL_GESTATION') {
        instructions.innerHTML = '<strong>Incubation silencieuse :</strong><br><br>• Aucun organisme n’est visible sur l’hôte.<br>• L’hôte se réveille et recommence à circuler.<br>• À maturité, la perception basculera dans sa cage thoracique.';
        actionsContainer.innerHTML = `<button type="button" class="act-btn" disabled>GESTATION INTERNE — ${Math.floor(this.gestationProgress)}%</button>`;
      } else if (this.step === 'READY_TO_BURST') {
        instructions.innerHTML = '<strong>Vue intra-thoracique :</strong><br><br>• Le sternum remplit le champ de vision.<br>• Déclenchez la poussée lorsque les contractions culminent.';
        actionsContainer.innerHTML = '<button type="button" id="btn-erupt-now" class="act-btn" style="border-color: #ef4444;">PERFORER LE STERNUM [ESPACE]</button>';
        document.getElementById('btn-erupt-now').onclick = () => this.perforateSternum();
      } else if (this.step === 'BURST_SEQUENCE') {
        instructions.innerHTML = '<strong>Perforation :</strong><br><br>• La poussée fracture progressivement les plaques sternales.';
        actionsContainer.innerHTML = '<button type="button" class="act-btn" disabled>RUPTURE DU STERNUM…</button>';
      } else if (this.step === 'HUNT_FAUNA') {
        const fed = this.biomassHunted >= 3;
        const livingRodents = this.rodents.filter((rodent) => !rodent.isIncapacitated && rodent.mesh).length;
        instructions.innerHTML = `<strong>Chasse réelle :</strong><br><br>• ${livingRodents} rongeur${livingRodents > 1 ? 's' : ''} encore en mouvement dans le laboratoire.<br>• Verrouillez une proie : le juvénile la poursuit puis bondit au contact.<br>• Le compteur ne progresse qu’après une morsure réussie.`;
        actionsContainer.innerHTML = `
          <button type="button" id="btn-bite-rodent" class="act-btn" ${fed ? 'disabled' : ''}>TRAQUER / MORDRE UNE SOURIS [ESPACE] — ${this.biomassHunted}/3</button>
          <button type="button" id="btn-start-chrysalis" class="act-btn" ${!fed ? 'disabled' : ''} style="border-color: #9d4edd;">TISSER UN COCON DE MUE</button>
        `;
        document.getElementById('btn-bite-rodent').onclick = () => this.attackNearbyRodent();
        document.getElementById('btn-start-chrysalis').onclick = () => {
          if (!fed) return;
          this.step = 'CHRYSALIS';
          this.chrysalisTimer = 0;
          playerCreature.setChrysalis(true);
          audioManager.playCocoonWeave?.(playerCreature.x, playerCreature.z);
          window.HiveSystems?.vfx?.ring(playerCreature.x, playerCreature.z, 0xa855f7, 3.5);
          window.HiveSystems?.vfx?.burst(playerCreature.x, playerCreature.z, 0x9d4edd, 30, 0.09, 1.2);
          window.HiveSystems?.updateObjective(3, 2, 'Achever la mue sans être découvert.');
          this.updateHUD();
        };
      } else if (this.step === 'CHRYSALIS') {
        const isMature = this.chrysalisTimer >= 100;
        const adultLabel = playerCreature.getAdultProfile().label;
        instructions.innerHTML = '<strong>Chrysalide métamorphique (Cocon Romulus) :</strong><br><br>• Le juvénile tisse un cocon biomécanique ancré aux conduits et parois métalliques.<br>• À travers la membrane amniotique translucide, le crâne adulte et les côtes se structurent.<br>• À 100%, la suture longitudinale se déchire pour libérer le prédateur adulte.';
        actionsContainer.innerHTML = `<button type="button" id="btn-emerge-drone" class="act-btn" ${!isMature ? 'disabled' : ''} style="border-color: #39ff14; ${isMature ? 'background: rgba(57,255,20,0.22); box-shadow: 0 0 16px rgba(57,255,20,0.5);' : ''}">${isMature ? `DÉCHIRER LE COCON ROMULUS & ÉMERGER EN ${adultLabel} [ESPACE]` : `MATURATION DU COCON ROMULUS... (${Math.round(this.chrysalisTimer)}%)`}</button>`;
        if (isMature) document.getElementById('btn-emerge-drone').onclick = () => this.emergeAdultForm();
      }
    }

    perforateSternum() {
      if (this.step !== 'READY_TO_BURST') return;
      this.step = 'BURST_SEQUENCE';
      this.burstTimer = 0;
      this.burstCrackStage = 0;
      this.setInternalViewUI(true, true);
      audioManager.playSternumPressure?.();
      this.updateHUD();
    }

    finishBurstSequence() {
      if (this.step !== 'BURST_SEQUENCE') return;
      this.thoracicView.deactivate();
      this.setInternalViewUI(false);
      if (this.infectedHost) {
        this.infectedHost.infectionState = 'BURST';
        this.infectedHost.isConsumedByCycle = true;
        this.infectedHost.isRestrained = false;
        this.infectedHost.collapseForBurst();
        if (this.infectedHost.characterKey === 'asterRho') {
          window.gameInstance?.syncCampaignCharacter?.(this.infectedHost, { alive: false });
        }
        playerCreature.x = this.infectedHost.x;
        playerCreature.z = this.infectedHost.z;
      }
      if (playerCreature.mesh) {
        playerCreature.mesh.visible = true;
        playerCreature.mesh.position.set(playerCreature.x, 0, playerCreature.z);
        playerCreature.mesh.rotation.set(0, 0, 0);
      }
      this.step = 'HUNT_FAUNA';
      rendererEngine.snapCameraTarget(playerCreature.x, playerCreature.z);
      audioManager.playBoneCrunch();
      audioManager.playChestburstScreech();
      audioManager.playWetImpact?.(playerCreature.x, playerCreature.z);
      window.HiveSystems?.vfx?.burst(playerCreature.x, playerCreature.z, 0xef334f, 34, 0.16, 1.2);
      window.HiveSystems?.vfx?.ring(playerCreature.x, playerCreature.z, 0xef334f, 2.2);
      this.spawnRodents();
      window.HiveSystems?.updateObjective(3, 1, 'Traquer et mordre directement trois rongeurs de laboratoire.');
      window.HiveSystems?.narrative('ELIAN TORV', 'Rupture biologique au bloc médical. Confinement KAPPA immédiat.');
      this.updateHUD();
      document.getElementById('game-canvas')?.focus({ preventScroll: true });
    }

    spawnRodents() {
      if (!window.gameInstance || this.rodents.length > 0) return;
      const offsets = [
        [-7, -4], [8, -5], [-10, 6], [6, 9], [12, 3]
      ];
      offsets.forEach(([offsetX, offsetZ], index) => {
        const spawn = this.findRodentSpawn(
          playerCreature.x + offsetX,
          playerCreature.z + offsetZ,
          index
        );
        const { x, z } = spawn;
        const rodent = new HumanAI(330 + index, 'labrodent', x, z, `Rongeur de laboratoire ${index + 1}`);
        rodent.hp = rodent.maxHp = 1;
        rodent.hostEligibility = 'none';
        rodent.patrolOrigin = { x, z };
        rodent.createMesh();
        rodent.mesh?.scale.setScalar(0.72);
        rodent.targetPos = rodent.findFreeWaypoint(8);
        this.rodents.push(rodent);
        window.gameInstance.humans.push(rodent);
      });
      audioManager.playRodentSqueak?.(playerCreature.x + 5, playerCreature.z);
      appendSensorLog('[FAUNE] Cinq petits rongeurs fuient entre les équipements du bloc médical.', 'bio');

      // Chantier 1 : Rations nutritives de laboratoire (Alien 1979)
      const rationOffsets = [[-4, 5], [5, -4]];
      rationOffsets.forEach(([roX, roZ], rIdx) => {
        const rx = playerCreature.x + roX;
        const rz = playerCreature.z + roZ;
        const mesh = window.HiveModelFactory?.createIndustrialProp?.('ration');
        if (mesh) {
          mesh.position.set(rx, 0.05, rz);
          rendererEngine.propsGroup.add(mesh);
          this.rations.push({ x: rx, z: rz, mesh, id: rIdx });
        }
      });
      appendSensorLog('[NUTRITION] Deux packs de rations stériles de laboratoire Weyland-Yutani détectés au sol.', 'bio');
    }

    findRodentSpawn(preferredX, preferredZ, index) {
      const clamp = (value) => Math.max(-68, Math.min(68, value));
      for (let attempt = 0; attempt < 36; attempt++) {
        const radius = attempt === 0 ? 0 : 1.2 + Math.floor((attempt - 1) / 8) * 1.6;
        const angle = (attempt * 2.399) + index * 0.83;
        const x = clamp(preferredX + Math.cos(angle) * radius);
        const z = clamp(preferredZ + Math.sin(angle) * radius);
        if (
          Math.hypot(x - playerCreature.x, z - playerCreature.z) >= 4 &&
          !stationMap.checkCollision(x, z, 0.18)
        ) {
          return { x, z };
        }
      }
      return {
        x: clamp(playerCreature.x + 4 + index * 1.4),
        z: clamp(playerCreature.z + 4 + (index % 2) * 1.8)
      };
    }

    attackNearbyRodent() {
      if (
        this.step !== 'HUNT_FAUNA' ||
        this.biteCooldown > 0 ||
        this.biteTarget ||
        this.biomassHunted >= 3
      ) return;

      // Chantier 1 : Consommation de rations de laboratoire (Alien 1979)
      const closestRation = this.rations.find((r) => Math.hypot(r.x - playerCreature.x, r.z - playerCreature.z) <= 3.2);
      if (closestRation) {
        if (closestRation.mesh) rendererEngine.removeObject(closestRation.mesh);
        this.rations = this.rations.filter((r) => r !== closestRation);
        audioManager.playWetImpact?.(playerCreature.x, playerCreature.z);
        audioManager.playBoneCrunch?.();
        window.HiveSystems?.vfx?.burst?.(playerCreature.x, playerCreature.z, 0xf59e0b, 16, 0.12, 1.2);
        window.HiveSystems?.vfx?.floatingText?.(playerCreature.x, 2.2, playerCreature.z, '+1 BIOMASSE (RATION)', '#39ff14', true);
        this.biomassHunted++;
        showToast('Ration nutritive de laboratoire dévorée par le juvénile !');
        this.log(`[CROISSANCE] Ration nutritive ${this.biomassHunted}/3 consommée et assimilée.`);
        window.HiveSystems?.updateObjective(3, this.biomassHunted >= 3 ? 2 : 1);
        this.updateHUD();
        return;
      }
      const closest = this.rodents
        .filter((rodent) => !rodent.isIncapacitated && rodent.mesh)
        .reduce((nearest, rodent) => {
          const distance = Math.hypot(rodent.x - playerCreature.x, rodent.z - playerCreature.z);
          return !nearest || distance < nearest.distance ? { rodent, distance } : nearest;
        }, null);
      if (!closest || closest.distance > 3.2) {
        if (closest) {
          this.huntedRodentTarget = closest.rodent;
          this.huntRepathCooldown = 0;
          playerCreature.setMoveTarget(closest.rodent.x, closest.rodent.z);
          showToast('Proie verrouillée : poursuite du rongeur en mouvement.');
          audioManager.playRodentSqueak?.(closest.rodent.x, closest.rodent.z);
          window.HiveSystems?.vfx?.ring(closest.rodent.x, closest.rodent.z, 0xf59e0b, 0.65);
        } else {
          showToast('Aucun rongeur vivant détecté dans le secteur.');
        }
        return;
      }

      this.beginRodentBite(closest.rodent);
    }

    beginRodentBite(rodent) {
      if (
        !rodent?.mesh ||
        rodent.isIncapacitated ||
        this.biteCooldown > 0 ||
        this.biteTarget
      ) return;
      this.biteCooldown = 0.52;
      this.huntedRodentTarget = null;
      this.biteTarget = rodent;
      playerCreature.triggerAttack?.('bite');
      audioManager.playJuvenileBite?.(playerCreature.x, playerCreature.z);
      const started = playerCreature.startLeapTo(
        rodent,
        () => this.finishRodentBite(rodent),
        { duration: 0.28, arcHeight: 0.48, useFaceAnchor: true }
      );
      if (!started) {
        this.biteTarget = null;
        this.biteCooldown = 0;
      }
    }

    finishRodentBite(rodent) {
      playerCreature.isLeaping = false;
      playerCreature.mesh?.position.set(playerCreature.x, 0, playerCreature.z);
      this.biteTarget = null;
      if (
        this.step !== 'HUNT_FAUNA' ||
        !rodent ||
        rodent.isIncapacitated ||
        !rodent.mesh
      ) return;
      audioManager.playRodentSqueak?.(rodent.x, rodent.z);
      window.HiveSystems?.vfx?.organicTrail(
        playerCreature.x,
        0.55,
        playerCreature.z,
        rodent.x,
        0.24,
        rodent.z,
        0xef4444
      );
      window.HiveSystems?.vfx?.burst(rodent.x, rodent.z, 0xb91c1c, 10, 0.055, 0.24);
      rodent.isIncapacitated = true;
      rodent.destroy();
      this.biomassHunted++;
      this.log(`[CROISSANCE] Rongeur ${this.biomassHunted}/3 capturé et assimilé.`);
      window.HiveSystems?.updateObjective(3, this.biomassHunted >= 3 ? 2 : 1);
      this.updateHUD();
    }

    emergeAdultForm() {
      if (this.isCompleted) return;
      this.isCompleted = true;
      window.HiveSystems?.updateObjective(3, 3);
      audioManager.playBoneCrunch();
      audioManager.playXenoRoar();
      audioManager.playChestburstScreech();
      window.HiveSystems?.vfx?.burst(playerCreature.x, playerCreature.z, 0x39ff14, 28, 0.16, 1.8);
      window.HiveSystems?.vfx?.burst(playerCreature.x, playerCreature.z, 0x9d4edd, 24, 0.12, 1.2);
      window.HiveSystems?.vfx?.ring(playerCreature.x, playerCreature.z, 0x39ff14, 3.8);
      window.HiveSystems?.vfx?.transformation();
      rendererEngine.addScreenShake?.(0.35);

      if (window.HiveModelFactory?.createDiscardedExuvia) {
        const exuvia = window.HiveModelFactory.createDiscardedExuvia();
        exuvia.position.set(playerCreature.x, 0.02, playerCreature.z);
        exuvia.rotation.y = playerCreature.mesh ? playerCreature.mesh.rotation.y : 0;
        rendererEngine.propsGroup.add(exuvia);
      }

      const adultProfile = playerCreature.getAdultProfile();
      appendSensorLog(`[RÉFLEXE ADN 1:1] Métamorphose achevée selon le génome de l'hôte : émergence d'un ${adultProfile.label}.`, 'bio');
      appendSensorLog('[MUE ROMULUS] La chrysalide se déchire le long de la suture centrale. Le prédateur adulte émerge des fluides amniotiques en laissant son exuvie vide.', 'bio');
      if (window.gameInstance) window.gameInstance.advanceStage(this);
    }
    handleKeyDown(key) {
      if (key === 'c') {
        const closestVent = stationMap?.findClosestVent?.(playerCreature.x, playerCreature.z);
        if (closestVent) {
          if (playerCreature.isInVent) {
            playerCreature.exitVent(closestVent.vent);
          } else if (closestVent.distance <= 4.8) {
            playerCreature.enterVent(closestVent.vent);
          } else {
            showToast(`Conduit trop éloigné (${Math.round(closestVent.distance)}m) pour infiltration [C].`);
          }
        }
        return;
      }
      if (key !== ' ') return;
      if (this.step === 'READY_TO_BURST') this.perforateSternum();
      else if (this.step === 'HUNT_FAUNA') this.attackNearbyRodent();
      else if (this.step === 'CHRYSALIS' && this.chrysalisTimer >= 100) this.emergeAdultForm();
    }
    log(message) { appendSensorLog(message, 'bio'); }
    getCameraTarget() {
      if (
        this.infectedHost &&
        (this.step === 'INTERNAL_GESTATION' || this.step === 'READY_TO_BURST' || this.step === 'BURST_SEQUENCE')
      ) {
        return this.infectedHost;
      }
      return playerCreature;
    }
    getCameraOverride() {
      return (this.step === 'READY_TO_BURST' || this.step === 'BURST_SEQUENCE')
        ? this.thoracicView.getCameraOverride()
        : null;
    }
    destroy() {
      this.setInternalViewUI(false);
      this.thoracicView.deactivate();
      for (const rodent of this.rodents) {
        if (rodent.mesh) rodent.destroy();
      }
      for (const ration of this.rations) {
        if (ration.mesh) rendererEngine.removeObject(ration.mesh);
      }
      this.rations = [];
    }
    update(deltaSeconds = 1 / 60) {
      const safeDelta = Math.max(0, deltaSeconds);
      this.biteCooldown = Math.max(0, this.biteCooldown - safeDelta);
      this.huntRepathCooldown = Math.max(0, this.huntRepathCooldown - safeDelta);

      if (this.step === 'HUNT_FAUNA' && this.huntedRodentTarget && !this.biteTarget) {
        const target = this.huntedRodentTarget;
        if (!target.mesh || target.isIncapacitated) {
          this.huntedRodentTarget = null;
        } else {
          const huntDistance = Math.hypot(target.x - playerCreature.x, target.z - playerCreature.z);
          if (huntDistance <= 3.2 && this.biteCooldown <= 0) {
            this.beginRodentBite(target);
          } else if (this.huntRepathCooldown <= 0 && !playerCreature.isLeaping) {
            this.huntRepathCooldown = 0.42;
            playerCreature.setMoveTarget(target.x, target.z);
          }
        }
      }

      if (this.step === 'INTERNAL_GESTATION') {
        this.recoveryElapsed += safeDelta;
        if (this.infectedHost) {
          playerCreature.x = this.infectedHost.x;
          playerCreature.z = this.infectedHost.z;
          if (this.recoveryElapsed >= 1.4 && this.infectedHost.infectionState === 'RECOVERING') {
            this.infectedHost.infectionState = 'GESTATING';
            appendSensorLog('[HÔTE] Motricité revenue. Respiration irrégulière, aucune masse externe visible.', 'bio');
          }
        }
        this.gestationProgress = Math.min(100, this.gestationProgress + safeDelta * 12.5);
        const displayedPercent = Math.min(100, Math.floor(this.gestationProgress));
        if (displayedPercent !== this.lastDisplayedPercent) {
          this.lastDisplayedPercent = displayedPercent;
          const progressButton = document.querySelector('#action-buttons-container .act-btn');
          if (progressButton) progressButton.textContent = `GESTATION INTERNE — ${displayedPercent}%`;
          setHudBar('sec', 'GESTATION INTERNE', this.gestationProgress);
        }
        if (this.gestationProgress >= 100) {
          this.step = 'READY_TO_BURST';
          if (this.infectedHost) {
            this.infectedHost.isRestrained = true;
            this.thoracicView.activate(this.infectedHost.x, this.infectedHost.z);
          } else {
            this.thoracicView.activate(playerCreature.x, playerCreature.z);
          }
          const internalCamera = this.thoracicView.getCameraOverride();
          if (internalCamera) rendererEngine.snapCinematicCamera(internalCamera);
          this.setInternalViewUI(true);
          audioManager.playSternumPressure?.();
          window.HiveSystems?.updateObjective(3, 1, 'Perforer le sternum depuis la vue intra-thoracique.');
          this.updateHUD();
        }
      } else if (this.step === 'READY_TO_BURST') {
        this.thoracicView.update(safeDelta);
      } else if (this.step === 'BURST_SEQUENCE') {
        this.burstTimer += safeDelta;
        const progress = Math.min(1, this.burstTimer / 1.25);
        this.thoracicView.setBurstProgress(progress);
        this.thoracicView.update(safeDelta);
        const crackStage = Math.min(3, Math.floor(progress * 4));
        if (crackStage > this.burstCrackStage) {
          this.burstCrackStage = crackStage;
          audioManager.playBoneCrunch();
          window.HiveSystems?.vfx?.transformation();
        }
        if (progress >= 1) this.finishBurstSequence();
      } else if (this.step === 'CHRYSALIS' && this.chrysalisTimer < 100) {
        this.chrysalisTimer = Math.min(100, this.chrysalisTimer + safeDelta * 25);
        const displayedPercent = this.chrysalisTimer >= 100 ? 100 : Math.min(99, Math.floor(this.chrysalisTimer));
        if (displayedPercent !== this.lastDisplayedPercent) {
          this.lastDisplayedPercent = displayedPercent;
          const emergeButton = document.getElementById('btn-emerge-drone');
          if (emergeButton) {
            const isMature = this.chrysalisTimer >= 100;
            const adultLabel = playerCreature.getAdultProfile().label;
            emergeButton.textContent = isMature
              ? `ÉMERGER EN ${adultLabel} ADULTE [ESPACE]`
              : `MATURATION ${adultLabel}... (${displayedPercent}%)`;
            emergeButton.disabled = !isMature;
            if (isMature) emergeButton.onclick = () => this.emergeAdultForm();
          }
          setHudBar('sec', 'MATURATION', this.chrysalisTimer);
          if (displayedPercent > 0 && displayedPercent % 25 === 0) {
            audioManager.playCocoonPulse?.(playerCreature.x, playerCreature.z);
            window.HiveSystems?.vfx?.ring(playerCreature.x, playerCreature.z, 0xa855f7, 2.7);
          }
        }
      }
    }
  }

  // STAGE 4 — DRONE: FURTIVITY, CLOSE COMBAT AND NURSERY
  class StageDrone {
    constructor() {
      this.isCompleted = false;
      this.capturedHosts = 0;
      this.abilityReadyAt = { ambush: 0, jaw: 0, tail: 0, cocoon: 0 };
      this.huntReserve = 100;
      this.lastDisplayedReserve = 100;
      this.royalHost = null;
      this.royalCycle = null;
      this.defenseWaveSpawned = false;
      this.reinforcementsDispatched = false;
    }

    init() {
      playerCreature.setForm('drone');
      document.getElementById('hive-stats-group').classList.remove('hidden');
      alarmSystem.setLevel(3);

      if (window.gameInstance) {
        window.gameInstance.clearHumans();
        const enemies = [
          new HumanAI(98, 'smartgunner', -14, -12, 'Artilleuse Lena Ortiz'),
          new HumanAI(97, 'incinerator', 24, -2, 'Opérateur thermique Juno Pike'),
          new HumanAI(96, 'guard', -30, 18, 'Agent Arden Cole'),
          new HumanAI(95, 'synthetic', 28, 25, 'Synthétique de sécurité Rook-7'),
          new HumanAI(94, 'labhound', 36, -22, 'Animal de service Q-4'),
          new HumanAI(93, 'weyland_security_taser', 12, -26, 'Garde Taser Weyland-Yutani Briggs'),
          new HumanAI(92, 'powerloader', -45, 35, 'Chef de pont Jansen - Caterpillar P-5000 Power Loader'),
          new HumanAI(91, 'weyland_commando_mk2', -35, -20, 'Commando Lourd Weyland-Yutani Vance - Armure MK-II & XM99'),
          new HumanAI(90, 'weyland_steel_team_synth', -40, 40, 'Synthétique Steel Team T-01 - Lame Plasma & Concussion'),
          new HumanAI(89, 'weyland_steel_team_synth', 38, -32, 'Synthétique Steel Team T-02 - Lame Plasma & Concussion')
        ];
        enemies[4].hp = enemies[4].maxHp = 80;
        enemies.forEach((enemy) => enemy.createMesh());
        window.gameInstance.humans.push(...enemies);
      }

      this.updateHUD();
      const adultLabel = playerCreature.getAdultProfile().label;
      this.log(`[${adultLabel}] Embusquez les équipes KAPPA et préservez au moins deux hôtes.`);
      window.HiveSystems?.setMission(4, 0, 'Saboter l’équipe de confinement sans gaspiller les hôtes viables.');
      window.HiveSystems?.narrative('ELIAN TORV', 'Équipe KAPPA, je veux l’échantillon intact — brûlez tout le reste.');

      // Directive Weyland-Yutani Special Order 937
      setTimeout(() => {
        window.HiveSystems?.narrative(
          'ORDRE SPÉCIAL 937',
          'Priorité 1 : Assurer la capture de l’organisme pour analyse. Toute autre considération secondaire. Équipage sacrifiable.'
        );
        audioManager.playRadioChatter?.();
      }, 3500);
    }

    updateHUD() {
      const profile = playerCreature.getAdultProfile();
      const adultLabel = profile.label;
      const casteActions = {
        drone: { jaw: 'MÂCHOIRE INTERNE', tail: 'FRAPPE DE QUEUE' },
        runner: { jaw: 'MORSURE À L’ÉLAN', tail: 'FOUET DE QUEUE' },
        warrior: { jaw: 'BRISE-BLINDAGE', tail: 'BALAYAGE LOURD' },
        deacon: { jaw: 'MÂCHOIRE PRÉMAXILLAIRE', tail: 'COUP DE FOUET' },
        alpha: { jaw: 'BROYAGE DE CRÂNE', tail: 'FOUET BIFIDE SUPERSONIQUE' }
      };
      const actionLabels = casteActions[profile.key] || casteActions.drone;
      document.getElementById('stage-badge').textContent = `PHASE 4 : ${adultLabel} — CHASSE ET NURSERIE`;
      document.getElementById('bio-title').textContent = `STATUT DU ${adultLabel} — PRÉDATEUR`;
      setHudBar(
        'vital',
        `INTÉGRITÉ DU ${adultLabel}`,
        (playerCreature.health / playerCreature.maxHealth) * 100,
        `${Math.ceil(playerCreature.health)}/${playerCreature.maxHealth}`
      );
      if (this.royalCycle?.isActive) {
        setHudBar(
          'sec',
          `CYCLE ROYAL — ${this.royalCycle.state}`,
          (this.royalCycle.integrity / this.royalCycle.maxIntegrity) * 100,
          `${Math.ceil(this.royalCycle.integrity)}/${this.royalCycle.maxIntegrity}`
        );
      } else {
        setHudBar('sec', 'RÉSERVE DE CHASSE', this.huntReserve);
      }
      document.getElementById('stage-instructions').innerHTML = this.royalCycle?.isActive
        ? `<strong>Défense du cycle royal :</strong><br><br>• Étape visible : ${this.royalCycle.state}.<br>• Les tirs peuvent détruire la forme royale.<br>• Neutralisez la vague KAPPA avant la fin de la mue.<br>• Le ${adultLabel} conserve ses actions propres à sa caste.`
        : `<strong>Prédateur ${adultLabel} :</strong><br><br>• ${profile.huntAction} consomme ${profile.huntCost} points de chasse.<br>• [Q] Escalade plafond / [E] Kidnapping vertical silencieux (Brett 1979).<br>• [C] Conduits d'aération.<br>• [Z] Posture basse / Traque au sol.<br>• [X] Crachat acide : dissout soudures de portes et cuves cryogéniques.<br>• [G] Ovomorphing : métamorphoser un hôte en œuf.`;
      const actionsContainer = document.getElementById('action-buttons-container');
      actionsContainer.innerHTML = `
        <button type="button" id="btn-drone-ambush" class="act-btn">1. ${profile.huntAction} [1 / E]</button>
        <button type="button" id="btn-inner-jaw" class="act-btn">2. ${actionLabels.jaw} [2 / R]</button>
        <button type="button" id="btn-tail-impale" class="act-btn">3. ${actionLabels.tail} [3 / T]</button>
        <button type="button" id="btn-claw-swipe" class="act-btn">★ GRIFFES [ESPACE]</button>
        <button type="button" id="btn-drone-hiss" class="act-btn" style="border-color: #39ff14;">★ SIFFLEMENT [H / 5]</button>
        <button type="button" id="btn-acid-spit" class="act-btn" style="border-color: #84cc16; background: rgba(132,204,22,0.18);">★ CRACHAT ACIDE [X]</button>
        <button type="button" id="btn-drone-ceiling" class="act-btn" style="border-color: #38bdf8;">★ PAROI & PLAFOND [Q] (KIDNAPPING [E])</button>
        <button type="button" id="btn-drone-prowl" class="act-btn">★ POSTURE BASSE [Z]</button>
        <button type="button" id="btn-drone-prowl-leap" class="act-btn" style="border-color: #39ff14; background: rgba(57,255,20,0.18);">★ BOND DE TRAQUE [K]</button>
        <button type="button" id="btn-drone-vent" class="act-btn">5. CONDUITS [C]</button>
        <button type="button" id="btn-sabotage-power" class="act-btn" style="border-color: #eab308; background: rgba(234,179,8,0.18);">★ COUPER COURANT [B]</button>
        <button type="button" id="btn-acoustic-decoy" class="act-btn" style="border-color: #38bdf8; background: rgba(56,189,248,0.22);">★ ÉCHO RADAR FANTÔME [N]</button>
        <button type="button" id="btn-neomorph-frenzy" class="act-btn" style="border-color: #f1f5f9; background: rgba(241,245,249,0.25); display: ${playerCreature.caste === 'neomorph' ? 'inline-block' : 'none'};">★ FRINGALE FRÉNÉTIQUE [B]</button>
        <button type="button" id="btn-praetorian-roar" class="act-btn" style="border-color: #c084fc; background: rgba(192,132,252,0.25); display: ${playerCreature.caste === 'praetorian' ? 'inline-block' : 'none'};">★ RUGISSEMENT BÉLIER [R]</button>
        <button type="button" id="btn-alpha-psychic" class="act-btn" style="border-color: #dc2626; background: rgba(220,38,38,0.25);">★ IMPULSION PSYCHIQUE ALPHA [T]</button>
        <button type="button" id="btn-supersonic-tail" class="act-btn" style="border-color: #ef4444; background: rgba(239,68,68,0.22);">★ FOUET BIFIDE SUPERSONIQUE [Y]</button>
        <button type="button" id="btn-spawn-swarmers" class="act-btn" style="border-color: #090d16; background: rgba(15,23,42,0.45);">★ NUÉE DE SWARMERS [U]</button>
        <button type="button" id="btn-spread-creep" class="act-btn" style="border-color: #ec4899; background: rgba(236,72,153,0.2);">★ ÉTENDRE HIVE CREEP [F]</button>
        <button type="button" id="btn-evolve-alpha" class="act-btn" style="border-color: #dc2626; background: rgba(220,38,38,0.2);">★ MUE EN ALPHA (MARVEL)</button>
        <button type="button" id="btn-direct-inoculation" class="act-btn" style="border-color: #ef4444; background: rgba(239,68,68,0.22);">★ IMPLANTATION DIRECTE [G]</button>
        <button type="button" id="btn-airlock-purge" class="act-btn" style="border-color: #06b6d4; background: rgba(6,182,212,0.18);">★ PURGE SAS [Y]</button>
        <button type="button" id="btn-drag-host" class="act-btn" style="border-color: #f59e0b;">★ TRAÎNER / COCON MURAL [V]</button>
        <button type="button" id="btn-cocoon-host" class="act-btn">4. COCOONISER UN HÔTE [4 / F]</button>
        <button type="button" id="btn-eggmorph" class="act-btn">6. OVOMORPHE / ORAL [G]</button>
        <button type="button" id="btn-aquatic-dive" class="act-btn" style="border-color: #0284c7; background: rgba(2,132,199,0.18);">★ IMMERSION AQUATIQUE [U]</button>
        <button type="button" id="btn-hack-terminal" class="act-btn" style="border-color: #f59e0b; background: rgba(245,158,11,0.18);">★ PIRATAGE TERMINAL / SYNTH [K]</button>
        <button type="button" id="btn-subfloor-ambush" class="act-btn" style="border-color: #64748b; background: rgba(100,116,139,0.22);">★ EMBUSCADE SOUS-PLANCHER [J]</button>
        <button type="button" id="btn-self-destruct-mother" class="act-btn" style="border-color: #dc2626; background: rgba(220,38,38,0.22);">★ PURGE NUCLÉAIRE M.U.T.H.U.R. [O]</button>
        <button type="button" id="btn-found-queen-hive" class="act-btn" style="border-color: #9d4edd; background: rgba(157,78,221,0.22);">ÉTABLIR LA NURSERIE ROYALE</button>
      `;

      document.getElementById('btn-drone-ambush').onclick = () => this.executeAmbush();
      document.getElementById('btn-inner-jaw').onclick = () => this.executeInnerJaw();
      document.getElementById('btn-tail-impale').onclick = () => this.executeTailImpale();
      document.getElementById('btn-claw-swipe').onclick = () => this.executeClawSwipe();
      document.getElementById('btn-drone-hiss').onclick = () => this.executeTerrifyingHiss();
      document.getElementById('btn-acid-spit').onclick = () => this.executeAcidSpit();
      document.getElementById('btn-drone-ceiling').onclick = () => this.toggleCeilingProwl();
      document.getElementById('btn-drone-prowl').onclick = () => playerCreature.toggleProwlStance();
      document.getElementById('btn-drone-prowl-leap').onclick = () => this.executeProwlLeap();
      document.getElementById('btn-drone-vent').onclick = () => this.toggleVentInfiltration();
      document.getElementById('btn-sabotage-power').onclick = () => this.executeSabotagePower();
      const btnAlpha = document.getElementById('btn-alpha-psychic');
      if (btnAlpha) btnAlpha.onclick = () => playerCreature.executeAlphaPsychicCommand();
      const btnTailSnap = document.getElementById('btn-supersonic-tail');
      if (btnTailSnap) btnTailSnap.onclick = () => playerCreature.executeSupersonicTailSnap();
      const btnSwarmers = document.getElementById('btn-spawn-swarmers');
      if (btnSwarmers) btnSwarmers.onclick = () => playerCreature.executeSpawnSwarmerPack();
      const btnCreep = document.getElementById('btn-spread-creep');
      if (btnCreep) btnCreep.onclick = () => playerCreature.executeSpreadHiveCreep();
      const btnEvolveAlpha = document.getElementById('btn-evolve-alpha');
      if (btnEvolveAlpha) {
        btnEvolveAlpha.onclick = () => {
          playerCreature.setAdultCaste('alpha');
          playerCreature.createMesh();
          this.updateHUD();
          showToast('MUE EN ALPHA XENOMORPH CONFIRMÉE ! Le titan commande la ruche.');
        };
      }
      const btnDecoy = document.getElementById('btn-acoustic-decoy');
      if (btnDecoy) btnDecoy.onclick = () => playerCreature.executeAcousticDecoy();
      const btnFrenzy = document.getElementById('btn-neomorph-frenzy');
      if (btnFrenzy) btnFrenzy.onclick = () => playerCreature.executeNeomorphFrenzy();
      const btnRoar = document.getElementById('btn-praetorian-roar');
      if (btnRoar) btnRoar.onclick = () => playerCreature.executePraetorianRoar();
      const btnInoc = document.getElementById('btn-direct-inoculation');
      if (btnInoc) btnInoc.onclick = () => playerCreature.executeDirectInoculation();
      document.getElementById('btn-airlock-purge').onclick = () => this.executeAirlockPurge();
      document.getElementById('btn-drag-host').onclick = () => this.executeDragOrWallCocoon();
      document.getElementById('btn-cocoon-host').onclick = () => this.executeCocoonHost();
      document.getElementById('btn-eggmorph').onclick = () => this.executeEggmorph();
      document.getElementById('btn-aquatic-dive').onclick = () => playerCreature.toggleAquaticImmersion();
      document.getElementById('btn-hack-terminal').onclick = () => playerCreature.executeHackTerminal();
      document.getElementById('btn-subfloor-ambush').onclick = () => playerCreature.executeSubfloorAmbush();
      document.getElementById('btn-self-destruct-mother').onclick = () => stationMap.triggerSelfDestructProtocol();
      document.getElementById('btn-found-queen-hive').onclick = () => this.foundRoyalNursery();
      this.updateRoyalButton();
    }

    executeAcidSpit() {
      if (!this.canUseAbility('acidSpit', 1100)) return;
      const { human: target } = this.findClosestHuman((human) => !human.isCocooned && !human.isIncapacitated && Math.hypot(human.x - playerCreature.x, human.z - playerCreature.z) <= 15);
      playerCreature.executeAcidSpit(target);
      this.updateRoyalButton();
    }

    executeSabotagePower() {
      if (rendererEngine.powerSabotagedTimer > 0) {
        showToast(`Réseau électrique déjà hors service (${Math.ceil(rendererEngine.powerSabotagedTimer)}s restantes).`);
        return;
      }
      if (!this.canUseAbility('power', 16000)) return;
      rendererEngine.sabotagePower(22);
      window.HiveSystems?.vfx?.burst?.(playerCreature.x, playerCreature.z, 0xeab308, 28, 0.22, 2.2);
    }

    executeAirlockPurge() {
      if (!this.canUseAbility('purge', 9000)) return;
      stationMap.triggerDepressurizationAirlock?.();
      audioManager.playDepressurizationRoar?.(playerCreature.x, playerCreature.z);
      rendererEngine.addScreenShake?.(0.48, 0.4);
      showToast('DÉPRESSURISATION D\'URGENCE DU SAS [Y] : Onde de souffle explosive sous vide !');
      appendSensorLog('[SAS] Décompression explosive du sas de coursive. Éjection et onde de choc.', 'alert');
      window.HiveSystems?.vfx?.ring?.(playerCreature.x, playerCreature.z, 0x06b6d4, 18);
      window.HiveSystems?.vfx?.burst?.(playerCreature.x, playerCreature.z, 0x38bdf8, 36, 0.35, 3.2);

      const humans = window.gameInstance?.humans || [];
      humans.forEach((h) => {
        if (h.isIncapacitated || h.isCocooned) return;
        const dist = Math.hypot(h.x - playerCreature.x, h.z - playerCreature.z);
        if (dist <= 16) {
          const pushAngle = Math.atan2(h.z - playerCreature.z, h.x - playerCreature.x);
          const pushForce = Math.max(1.8, (16 - dist) * 0.45);
          const targetX = h.x + Math.cos(pushAngle) * pushForce;
          const targetZ = h.z + Math.sin(pushAngle) * pushForce;
          if (!stationMap.checkCollision(targetX, targetZ)) {
            h.x = targetX;
            h.z = targetZ;
            h.mesh?.position.set(h.x, 0, h.z);
          }
          h.staggerTimer = 1.4;
          h.takeDamage(32, playerCreature);
          window.HiveSystems?.vfx?.floatingText(h.x, 3.2, h.z, 'SOUFFLE DU SAS !', '#06b6d4', true);
        }
      });
      this.updateRoyalButton();
    }

    executeTerrifyingHiss() {
      if (!this.canUseAbility('hiss', 1400)) return;
      playerCreature.executeTerrifyingHiss();
    }

    toggleCeilingProwl() {
      playerCreature.toggleCeilingProwl();
    }

    executeDragOrWallCocoon() {
      if (playerCreature.draggedHost) {
        let nearWall = false;
        for (const col of stationMap.colliders) {
          if (
            playerCreature.x >= col.minX - 3.2 && playerCreature.x <= col.maxX + 3.2 &&
            playerCreature.z >= col.minZ - 3.2 && playerCreature.z <= col.maxZ + 3.2
          ) {
            nearWall = true; break;
          }
        }
        if (nearWall) {
          playerCreature.wallCocoonDraggedHost();
          this.capturedHosts++;
          this.updateRoyalButton();
        } else {
          showToast('Approchez le corps d\'un mur pour l\'emmurer dans la résine [V], ou pressez V pour relâcher.');
          playerCreature.toggleDragHost();
        }
      } else {
        playerCreature.toggleDragHost();
      }
    }

    toggleVentInfiltration() {
      const closestVent = stationMap?.findClosestVent?.(playerCreature.x, playerCreature.z);
      if (closestVent) {
        if (playerCreature.isInVent) {
          playerCreature.exitVent(closestVent.vent);
        } else if (closestVent.distance <= 5.2) {
          playerCreature.enterVent(closestVent.vent);
        } else {
          showToast(`Conduit trop éloigné (${Math.round(closestVent.distance)}m) pour infiltration [C].`);
        }
      }
    }

    executeProwlLeap() {
      if (!this.canUseAbility('prowlLeap', 1200)) return;
      const { human: target } = this.findClosestHuman((human) => !human.isCocooned && !human.isIncapacitated && Math.hypot(human.x - playerCreature.x, human.z - playerCreature.z) <= 9.0);
      playerCreature.executeProwlLeap(target);
      this.updateRoyalButton();
    }

    handleKeyDown(key) {
      if (playerCreature.isCeilingProwling) {
        if (key === '1' || key === 'e' || key === '3' || key === 't') {
          playerCreature.executeCeilingImpale();
          this.updateRoyalButton();
          return;
        }
      }
      if (key === 'c') this.toggleVentInfiltration();
      if (key === 'z') playerCreature.toggleProwlStance();
      if (key === 'u') playerCreature.toggleAquaticImmersion();
      if (key === 'j') playerCreature.executeSubfloorAmbush();
      if (key === 'o') stationMap.triggerSelfDestructProtocol();
      if (key === 'n') playerCreature.executeAcousticDecoy();
      if (key === 'k') {
        const hacked = playerCreature.executeHackTerminal();
        if (!hacked) this.executeProwlLeap();
      }
      if (key === 'q') this.toggleCeilingProwl();
      if (key === 'x') this.executeAcidSpit();
      if (key === 'b') {
        if (playerCreature.caste === 'neomorph') {
          playerCreature.executeNeomorphFrenzy();
        } else {
          this.executeSabotagePower();
        }
      }
      if (key === 'y') {
        if (playerCreature.adultCaste === 'alpha') {
          playerCreature.executeSupersonicTailSnap();
        } else {
          this.executeAirlockPurge();
        }
      }
      if (key === 'h' || key === '5') this.executeTerrifyingHiss();
      if (key === 'v') this.executeDragOrWallCocoon();
      if (key === 'g') {
        const inoculated = playerCreature.executeDirectInoculation();
        if (!inoculated) {
          if (playerCreature.caste === 'predalien') {
            playerCreature.executeOralImplantation();
          } else {
            this.executeEggmorph();
          }
        }
      }
      if (key === '1' || key === 'e') {
        if (playerCreature.isInWater && playerCreature.isSubmerged) {
          playerCreature.executeAquaticAmbush();
        } else {
          this.executeAmbush();
        }
      }
      if (key === '2' || key === 'r') {
        if (key === 'r' && playerCreature.caste === 'praetorian') {
          playerCreature.executePraetorianRoar();
        } else {
          this.executeInnerJaw();
        }
      }
      if (key === '3' || key === 't') {
        if (playerCreature.adultCaste === 'alpha') {
          playerCreature.executeAlphaPsychicCommand();
        } else {
          this.executeTailImpale();
        }
      }
      if (key === '4' || key === 'f') this.executeCocoonHost();
      if (key === ' ') this.executeClawSwipe();
    }

    canUseAbility(name, cooldownMs) {
      const now = Date.now();
      if (now < this.abilityReadyAt[name]) {
        showToast('Capacité en récupération…');
        return false;
      }
      this.abilityReadyAt[name] = now + cooldownMs;
      return true;
    }

    findClosestHuman(predicate = () => true) {
      const humans = window.gameInstance ? window.gameInstance.humans : [];
      let closest = null;
      let distance = Infinity;
      for (const human of humans) {
        if (!predicate(human)) continue;
        const currentDistance = Math.hypot(human.x - playerCreature.x, human.z - playerCreature.z);
        if (currentDistance < distance) {
          closest = human;
          distance = currentDistance;
        }
      }
      return { human: closest, distance };
    }

    executeAmbush() {
      const profile = playerCreature.getAdultProfile();
      if (this.huntReserve < profile.huntCost) {
        showToast('Réserve de chasse insuffisante.');
        return;
      }
      const { human: target, distance } = this.findClosestHuman((human) => !human.isCocooned && !human.isIncapacitated);
      if (!target || distance > profile.huntRange) {
        this.log(`[${profile.huntAction}] Aucun signal mobile à portée sensorielle.`);
        return;
      }
      const preferredAngle = Math.atan2(playerCreature.z - target.z, playerCreature.x - target.x);
      let landing = null;
      for (let attempt = 0; attempt < 12; attempt++) {
        const side = attempt % 2 ? 1 : -1;
        const angleStep = attempt === 0 ? 0 : Math.ceil(attempt / 2) * side * Math.PI / 6;
        const angle = preferredAngle + angleStep;
        const x = target.x + Math.cos(angle) * 2.2;
        const z = target.z + Math.sin(angle) * 2.2;
        if (!stationMap.checkCollision(x, z)) {
          landing = { x, z };
          break;
        }
      }
      if (!landing) {
        showToast('Embuscade annulée : aucun point d’atterrissage libre.');
        this.log(`[${profile.huntAction}] Approche bloquée par la structure.`);
        return;
      }
      if (!this.canUseAbility('ambush', 950)) return;

      this.huntReserve -= profile.huntCost;
      audioManager.playXenoRoar();
      playerCreature.triggerAttack('ambush');
      playerCreature.startLeapTo({ x: landing.x, z: landing.z }, () => {
        playerCreature.isLeaping = false;
        playerCreature.x = landing.x;
        playerCreature.z = landing.z;
        playerCreature.mesh?.position.set(playerCreature.x, 0, playerCreature.z);
        target.takeDamage(profile.huntDamage);
        audioManager.playWetImpact?.(target.x, target.z);
        window.HiveSystems?.vfx?.ring(target.x, target.z, 0x39ff14, 2.4);
        window.HiveSystems?.vfx?.burst(target.x, target.z, 0x39ff14, 18, 0.1, 1.4);
        this.log(`[${profile.huntAction}] ${target.name} désorienté — ${Math.max(0, target.hp)} PV.`);
        this.updateRoyalButton();
      });
      this.updateRoyalButton();
      this.updateReserveUI();
    }

    executeClawSwipe() {
      if (playerCreature.isCeilingProwling) {
        const { human: target } = this.findClosestHuman((human) => !human.isCocooned && !human.isIncapacitated && Math.hypot(human.x - playerCreature.x, human.z - playerCreature.z) <= 7.5);
        playerCreature.dropFromCeiling(target);
        this.updateRoyalButton();
        return;
      }
      if (!this.canUseAbility('claw', 380)) return;
      const { human: target, distance } = this.findClosestHuman((human) => !human.isCocooned && !human.isIncapacitated);
      if (!target || distance > 6.5) {
        const closeDoor = (stationMap.sealedHydraulicDoors || []).find((d) => !d.isPried && Math.hypot(d.x - playerCreature.x, d.z - playerCreature.z) <= 3.8);
        if (closeDoor) {
          stationMap.pryHydraulicDoor(closeDoor, playerCreature);
          playerCreature.triggerAttack('melee');
          this.updateRoyalButton();
          return;
        }
        const closeVent = (stationMap.steamVents || []).find((v) => !v.isRuptured && Math.hypot(v.x - playerCreature.x, v.z - playerCreature.z) <= 3.8);
        if (closeVent) {
          stationMap.ruptureSteamVent(closeVent, playerCreature);
          playerCreature.triggerAttack('melee');
          this.updateRoyalButton();
          return;
        }
        this.executeInnerJaw();
        return;
      }
      if (distance > 2.0) {
        const angle = Math.atan2(target.z - playerCreature.z, target.x - playerCreature.x);
        const step = Math.min(distance - 1.6, 2.8);
        const nextX = playerCreature.x + Math.cos(angle) * step;
        const nextZ = playerCreature.z + Math.sin(angle) * step;
        if (!stationMap.checkCollision(nextX, nextZ)) {
          playerCreature.x = nextX;
          playerCreature.z = nextZ;
          playerCreature.mesh?.position.set(nextX, 0, nextZ);
        }
      }
      if (playerCreature.mesh) {
        playerCreature.mesh.rotation.y = Math.atan2(target.x - playerCreature.x, target.z - playerCreature.z);
      }
      playerCreature.triggerAttack('melee');
      const profile = playerCreature.getAdultProfile();
      const dmg = Math.round(profile.jawDamage * 0.65);
      target.takeDamage(dmg, playerCreature);
      audioManager.playBoneCrunch();
      audioManager.playWetImpact?.(target.x, target.z);
      window.HiveSystems?.vfx?.burst(target.x, target.z, 0xef4444, 12, 0.08, 1.2);
      this.log(`[GRIFFES] Lacération sur ${target.name} — ${Math.max(0, target.hp)} PV.`);

      const closePod = (stationMap.cryoPods || []).find((p) => !p.isBroken && Math.hypot(p.x - playerCreature.x, p.z - playerCreature.z) <= 3.8);
      if (closePod) stationMap.shatterCryoPod(closePod, playerCreature);
      const closeGoo = (stationMap.blackGooCanisters || []).find((g) => !g.isBroken && Math.hypot(g.x - playerCreature.x, g.z - playerCreature.z) <= 3.8);
      if (closeGoo) stationMap.shatterBlackGoo(closeGoo, playerCreature);
      const closeDoor = (stationMap.sealedHydraulicDoors || []).find((d) => !d.isPried && Math.hypot(d.x - playerCreature.x, d.z - playerCreature.z) <= 3.8);
      if (closeDoor) stationMap.pryHydraulicDoor(closeDoor, playerCreature);
      const closeVent = (stationMap.steamVents || []).find((v) => !v.isRuptured && Math.hypot(v.x - playerCreature.x, v.z - playerCreature.z) <= 3.8);
      if (closeVent) stationMap.ruptureSteamVent(closeVent, playerCreature);
      const closeNapalm = (stationMap.napalmBarrels || []).find((b) => !b.isDetonated && Math.hypot(b.x - playerCreature.x, b.z - playerCreature.z) <= 3.8);
      if (closeNapalm) stationMap.detonateNapalmBarrel(closeNapalm, playerCreature);

      this.updateRoyalButton();
    }

    executeInnerJaw() {
      if (!this.canUseAbility('jaw', 550)) return;
      const profile = playerCreature.getAdultProfile();
      const { human: target, distance } = this.findClosestHuman((human) => !human.isCocooned && !human.isIncapacitated);
      if (!target || distance > 8.5) {
        showToast(target ? `Cible trop éloignée (${Math.round(distance)}m) — Approchez-vous [1: Embuscade].` : 'Aucune cible vivante en vue.');
        this.log('[MÂCHOIRE] Cible hors de portée.');
        return;
      }
      if (distance > 2.0) {
        const angle = Math.atan2(target.z - playerCreature.z, target.x - playerCreature.x);
        const lungeDist = Math.min(distance - 1.7, 5.2);
        const nextX = playerCreature.x + Math.cos(angle) * lungeDist;
        const nextZ = playerCreature.z + Math.sin(angle) * lungeDist;
        if (!stationMap.checkCollision(nextX, nextZ)) {
          playerCreature.x = nextX;
          playerCreature.z = nextZ;
          playerCreature.mesh?.position.set(nextX, 0, nextZ);
        }
      }
      if (playerCreature.mesh) {
        playerCreature.mesh.rotation.y = Math.atan2(target.x - playerCreature.x, target.z - playerCreature.z);
      }
      playerCreature.triggerAttack('inner-jaw');

      // Chantier 44 : Mâchoire prémaxillaire déboîtable de Deacon (Prometheus 2012)
      if (playerCreature.caste === 'deacon') {
        playerCreature.executePremaxillaryBite?.(target);
        this.updateRoyalButton();
        return;
      }

      // Chantier 20 : Exécution Interactive à la Mâchoire Interne 1:1 (Alien 1979 / Alien 3 / Romulus)
      audioManager.playInnerJawPunch?.(target.x, target.z);
      audioManager.playInnerJawSnap?.(target.x, target.z);
      audioManager.playBoneCrunch?.();
      audioManager.playWetImpact?.(target.x, target.z);
      rendererEngine.addScreenShake?.(0.44, 0.26);

      const isVulnerable = (target.staggerTimer > 0) || ((target.stress || 0) >= 70) || (target.hp <= profile.jawDamage * 1.5);
      if (isVulnerable && target.bossId !== 'MANTIS_4') {
        // Exécution fatale instantanée avec perforation crânienne 1:1
        target.takeDamage(target.hp + 50, playerCreature);
        window.HiveSystems?.vfx?.fleshImpact?.(target.x, target.z, 0xb91c1c, 32);
        window.HiveSystems?.vfx?.burst?.(target.x, target.z, 0xb91c1c, 24, 0.16, 1.8);
        window.HiveSystems?.vfx?.floatingText?.(target.x, 3.4, target.z, 'PERFORATION CRÂNIENNE (FATAL 1:1)', '#ef4444', true);
        showToast(`PERFORATION CRÂNIENNE 1:1 ! Le piston pharyngien a transpercé la boîte crânienne de ${target.name} !`);
        appendSensorLog(`[EXÉCUTION 1:1] ${target.name} abattu : perforation instantanée du lobe frontal par la mâchoire interne télescopique.`, 'bio');
      } else {
        target.takeDamage(profile.jawDamage * 1.5, playerCreature);
        target.staggerTimer = 1.6;
        window.HiveSystems?.vfx?.floatingText?.(target.x, 3.2, target.z, `-${Math.round(profile.jawDamage * 1.5)} MÂCHOIRE INTERNE`, '#ef4444', true);
        window.HiveSystems?.vfx?.burst?.(target.x, target.z, 0xb91c1c, 16, 0.12, 1.4);
      }

      window.HiveSystems?.vfx?.organicTrail?.(
        playerCreature.x,
        2.6,
        playerCreature.z,
        target.x,
        1.7,
        target.z,
        0x39ff14
      );
      this.log(`[MÂCHOIRE INTERNE] Piston pneumatique déployé sur ${target.name}.`);
      this.updateRoyalButton();
    }

    executeTailImpale() {
      if (!this.canUseAbility('tail', 650)) return;
      const profile = playerCreature.getAdultProfile();
      const { human: target, distance } = this.findClosestHuman((human) => !human.isCocooned && !human.isIncapacitated);
      if (!target || distance > 10.5) {
        showToast(target ? `Cible hors de portée (${Math.round(distance)}m).` : 'Aucune cible vivante.');
        this.log('[QUEUE] Cible hors de portée.');
        return;
      }
      if (distance > 3.0) {
        const angle = Math.atan2(target.z - playerCreature.z, target.x - playerCreature.x);
        const lungeDist = Math.min(distance - 2.4, 3.4);
        const nextX = playerCreature.x + Math.cos(angle) * lungeDist;
        const nextZ = playerCreature.z + Math.sin(angle) * lungeDist;
        if (!stationMap.checkCollision(nextX, nextZ)) {
          playerCreature.x = nextX;
          playerCreature.z = nextZ;
          playerCreature.mesh?.position.set(nextX, 0, nextZ);
        }
      }
      if (playerCreature.mesh) {
        playerCreature.mesh.rotation.y = Math.atan2(target.x - playerCreature.x, target.z - playerCreature.z);
      }
      playerCreature.triggerAttack('tail');
      target.takeDamage(profile.tailDamage, playerCreature);
      audioManager.playTailWhip?.(target.x, target.z);
      audioManager.playBoneCrunch();
      audioManager.playWetImpact?.(target.x, target.z);
      window.HiveSystems?.vfx?.organicTrail(
        playerCreature.x,
        1.5,
        playerCreature.z,
        target.x,
        1.2,
        target.z,
        0xa855f7
      );
      window.HiveSystems?.vfx?.burst(target.x, target.z, 0xa855f7, 18, 0.12, 1.4);
      this.log(`[FRAPPE DE QUEUE] ${target.name} empalé — ${Math.max(0, target.hp)} PV.`);
      this.updateRoyalButton();
    }

    executeCocoonHost() {
      if (!this.canUseAbility('cocoon', 450)) return;
      const { human: target, distance } = this.findClosestHuman((human) => (
        human.isIncapacitated &&
        !human.isCocooned &&
        human.hostEligibility !== 'none'
      ));

      if (target && distance <= 9.0) {
        if (distance > 2.0) {
          const angle = Math.atan2(target.z - playerCreature.z, target.x - playerCreature.x);
          const nextX = target.x - Math.cos(angle) * 1.8;
          const nextZ = target.z - Math.sin(angle) * 1.8;
          if (!stationMap.checkCollision(nextX, nextZ)) {
            playerCreature.x = nextX;
            playerCreature.z = nextZ;
            playerCreature.mesh?.position.set(nextX, 0, nextZ);
          }
        }
        if (!target.cocoonInResin()) return;
        this.capturedHosts++;
        document.getElementById('hive-hosts').textContent = this.capturedHosts;
        resinGrid.addResinPatch(target.x, target.z, 4.0);
        playerCreature.triggerAttack('cocoon');
        audioManager.playCocoonWeave?.(target.x, target.z);
        window.HiveSystems?.vfx?.ring(target.x, target.z, 0xa855f7, 3.5);
        window.HiveSystems?.vfx?.burst(target.x, target.z, 0x9d4edd, 24, 0.1, 1.5);
        window.HiveSystems?.vfx?.floatingText(target.x, 3.0, target.z, `HÔTE SÉCURISÉ [${this.capturedHosts}/2]`, '#a855f7', true);
        this.log(`[NURSERIE] ${target.name} sécurisé dans la résine de ruche (${this.capturedHosts}/2).`);
        showToast(`Hôte sécurisé dans la résine (${this.capturedHosts}/2) !`);
        window.HiveSystems?.updateObjective(4, Math.min(2, this.capturedHosts), 'Sécuriser deux hôtes puis fonder la nurserie royale.');
        this.updateRoyalButton();
      } else if (target) {
        showToast(`Approchez-vous du corps neutralisé (${Math.round(distance)}m) pour le coconiser [F].`);
        this.log('[NURSERIE] Cible trop éloignée : approchez-vous.');
      } else {
        showToast('Aucun hôte viable neutralisé à proximité.');
        this.log('[NURSERIE] Aucun hôte viable neutralisé à proximité.');
      }
    }

    executeEggmorph() {
      if (!this.canUseAbility('cocoon', 500)) return;
      const { human: target, distance } = this.findClosestHuman((human) => (
        human.isCocooned &&
        !human.isEggmorphed &&
        !human.usedAsHost
      ));

      if (!target || distance > 5.5) {
        showToast('Approchez-vous d’un hôte en cocon pour l’ovomorpher [G].');
        this.log('[OVOMORPHING] Aucun hôte en cocon à portée.');
        return;
      }

      target.isEggmorphed = true;
      target.usedAsHost = true;
      if (target.mesh) target.mesh.visible = false;

      if (window.HiveModelFactory?.createEgg) {
        const eggMesh = window.HiveModelFactory.createEgg(false);
        eggMesh.position.set(target.x, 0, target.z);
        eggMesh.scale.setScalar(1.2);
        rendererEngine.propsGroup.add(eggMesh);

        this.ovomorphs = this.ovomorphs || [];
        this.ovomorphs.push({
          x: target.x,
          z: target.z,
          mesh: eggMesh,
          isOpen: false,
          hostName: target.name
        });
      }

      audioManager.playCocoonWeave?.(target.x, target.z);
      audioManager.playBoneCrunch?.();
      window.HiveSystems?.vfx?.ring(target.x, target.z, 0x39ff14, 3.8);
      window.HiveSystems?.vfx?.burst(target.x, target.z, 0x39ff14, 26, 0.16, 1.4);
      window.HiveSystems?.vfx?.floatingText(target.x, 2.5, target.z, 'OVOMORPHE CRÉÉ', '#39ff14', true);
      this.log(`[OVOMORPHING GIGER] Tissus de ${target.name} digérés en ovomorphe prêt à féconder.`);
      showToast('Hôte métamorphosé en Œuf vivant [Eggmorphing 1979] !');
      this.updateRoyalButton();
    }

    foundRoyalNursery() {
      if (this.isCompleted || this.royalCycle?.isActive) return;
      if (!this.canFoundHive()) {
        if (this.capturedHosts < 2) {
          showToast(`Requis : 2 hôtes viables dans la résine [Touche F près d'un corps]. Actuel : ${this.capturedHosts}/2.`);
        } else {
          showToast('Zone non sécurisée : éliminez les menaces proches avant d’établir la nurserie royale.');
        }
        return;
      }

      // Un hôte réel est retiré du stock et consommé par le Queenburster.
      this.royalHost = (window.gameInstance?.humans || []).find((human) => (
        human.isCocooned &&
        !human.usedAsHost &&
        human.hostEligibility !== 'none'
      ));
      if (!this.royalHost) {
        showToast('Le stock de nurserie ne contient plus d’hôte royal disponible.');
        return;
      }
      this.royalHost.usedAsHost = true;
      this.royalHost.isInfected = true;
      this.royalHost.isConsumedByCycle = true;
      this.royalHost.collapseForBurst();

      this.royalCycle = new BiologicalCycleEntity({
        id: 'royal-cycle',
        x: this.royalHost.x,
        z: this.royalHost.z,
        caste: 'queen',
        hostName: this.royalHost.name,
        duration: 20,
        maxIntegrity: 280,
        states: ['QUEENBURSTER', 'MUE ROYALE', 'ÉMERGENCE DE LA REINE'],
        onStateChange: (cycle) => {
          this.log(`[CYCLE ROYAL] Étape visible : ${cycle.state}.`);
          window.HiveSystems?.vfx?.ring(cycle.x, cycle.z, cycle.state.includes('ÉMERGENCE') ? 0x39ff14 : 0xa855f7, 4);
          this.updateHUD();
        },
        canComplete: () => true,
        onComplete: (cycle) => this.completeRoyalCycle(cycle),
        onFail: (cycle) => this.failRoyalCycle(cycle)
      });
      this.royalCycle.createMesh();
      this.spawnRoyalDefenseWave();
      window.HiveSystems?.updateObjective(4, 3, 'Défendre le Queenburster puis sa mue royale.');
      window.HiveSystems?.narrative('PALIMPSESTE', 'Embryon royal détecté. Une force KAPPA converge sur la nurserie.');
      audioManager.playXenoRoar();
      appendSensorLog(`[NURSERIE ROYALE] ${this.royalHost.name} est consommé par le cycle royal. Défendez-le.`, 'bio');
      this.updateHUD();
    }

    canFoundHive() {
      if (this.capturedHosts < 2 || this.royalCycle?.isActive) return false;
      const nearbyThreats = this.getActiveThreats().filter((t) => (
        Math.hypot(t.x - playerCreature.x, t.z - playerCreature.z) < 22
      ));
      return nearbyThreats.length === 0;
    }

    getActiveThreats() {
      const combatantTypes = [
        'guard', 'marine', 'smartgunner', 'gyro', 'cleaner', 'incinerator',
        'commando', 'android', 'synthetic', 'powerloader', 'exosuit'
      ];
      return (window.gameInstance?.humans || []).filter((human) => (
        combatantTypes.includes(human.type) &&
        !human.isCocooned &&
        !human.isIncapacitated
      ));
    }

    spawnRoyalDefenseWave() {
      if (this.defenseWaveSpawned || !window.gameInstance) return;
      this.defenseWaveSpawned = true;
      const rx = this.royalCycle ? this.royalCycle.x : playerCreature.x;
      const rz = this.royalCycle ? this.royalCycle.z : playerCreature.z;
      const wave = [
        new HumanAI(151, 'commando', rx - 18, rz + 14, 'Commando KAPPA Ilya Moor'),
        new HumanAI(152, 'incinerator', rx + 16, rz - 14, 'Opératrice thermique KAPPA Veda Sol')
      ];
      wave.forEach((enemy) => {
        enemy.createMesh();
        enemy.lureTowards(rx, rz);
      });
      window.gameInstance.humans.push(...wave);
      this.log('[DÉFENSE] Une équipe KAPPA converge directement sur la chambre royale !');
    }

    dispatchReinforcements() {
      if (!window.gameInstance) return;
      const x = playerCreature.x > 0 ? -22 : 22;
      const z = playerCreature.z > 0 ? -16 : 16;
      const wave = [
        new HumanAI(160, 'guard', x, z, 'Patrouilleur IRISE Miller'),
        new HumanAI(161, 'guard', x + 3, z + 2, 'Patrouilleur IRISE Vance')
      ];
      wave.forEach((h) => {
        h.hostEligibility = 'viable';
        h.createMesh();
        h.lureTowards(playerCreature.x, playerCreature.z);
      });
      window.gameInstance.humans.push(...wave);
      showToast('Une patrouille de renfort IRISE entre dans le secteur.');
      this.log('[IRISE] Renforts envoyés suite à la perte de liaison. Nouveaux hôtes détectés.');
    }

    completeRoyalCycle(cycle) {
      if (this.isCompleted) return;
      this.isCompleted = true;
      if (window.gameInstance) {
        window.gameInstance.royalCycleRecord = {
          hostName: cycle.hostName,
          state: 'MUE ROYALE ACHEVÉE',
          completed: true
        };
      }
      window.HiveSystems?.updateObjective(4, 4);
      appendSensorLog('[CYCLE ROYAL] Queenburster et mue royale ont survécu. La Reine émerge et lie son ovipositeur.', 'bio');
      window.HiveSystems?.narrative('PALIMPSESTE', 'Mue royale confirmée. MNEMOSYNE engage l’autodestruction.');
      window.gameInstance?.advanceStage(this);
    }

    failRoyalCycle(cycle) {
      this.log(`[ÉCHEC] La forme royale issue de ${cycle.hostName} a été détruite avant sa mue.`);
      window.gameInstance?.showEndModal(
        'CYCLE ROYAL INTERROMPU',
        'La vague KAPPA a détruit le Queenburster avant la maturation de la lignée.'
      );
    }

    updateRoyalButton() {
      const button = document.getElementById('btn-found-queen-hive');
      if (!button) return;
      const activeThreatCount = this.getActiveThreats().length;
      const threatStatus = activeThreatCount === 0 ? 'SECTEUR SÛR' : `${activeThreatCount} MENACE(S)`;
      if (this.royalCycle?.isActive) {
        button.disabled = true;
        button.style.borderColor = '#a855f7';
        button.style.boxShadow = '0 0 12px rgba(168,85,247,0.4)';
        button.textContent = `CYCLE ROYAL — ${this.royalCycle.state} ${Math.floor(this.royalCycle.progress)}% · ${threatStatus}`;
        return;
      }
      const canFound = this.canFoundHive();
      button.disabled = false;
      if (canFound) {
        button.style.borderColor = '#39ff14';
        button.style.background = 'rgba(57,255,20,0.25)';
        button.style.boxShadow = '0 0 16px rgba(57,255,20,0.5)';
        button.textContent = `★ ÉTABLIR LA NURSERIE ROYALE [PRÊT] ★`;
      } else {
        button.style.borderColor = '#9d4edd';
        button.style.background = 'rgba(157,78,221,0.18)';
        button.style.boxShadow = 'none';
        button.textContent = `ÉTABLIR LA NURSERIE — HÔTES ${this.capturedHosts}/2 · ${threatStatus}`;
      }
    }

    log(msg) { appendSensorLog(msg, 'bio'); }

    update(deltaSeconds = 1 / 60) {
      this.royalCycle?.update(deltaSeconds);
      if (this.huntReserve < 100) {
        this.huntReserve = Math.min(100, this.huntReserve + Math.max(0, deltaSeconds) * 15);
        if (!this.royalCycle?.isActive && Math.floor(this.huntReserve) !== this.lastDisplayedReserve) {
          this.updateReserveUI();
        }
      }

      // Sécurité anti-blocage : réapprovisionnement d'hôtes si le stock est insuffisant
      if (this.capturedHosts < 2 && !this.reinforcementsDispatched) {
        const viableRemaining = (window.gameInstance?.humans || []).filter((h) => (
          h.hostEligibility === 'viable' && !h.usedAsHost
        ));
        const totalViable = this.capturedHosts + viableRemaining.filter((h) => !h.isCocooned).length;
        if (totalViable < 2) {
          this.reinforcementsDispatched = true;
          this.dispatchReinforcements();
        }
      }

      if (this.royalCycle?.isActive) {
        setHudBar(
          'sec',
          `CYCLE ROYAL — ${this.royalCycle.state}`,
          (this.royalCycle.integrity / this.royalCycle.maxIntegrity) * 100,
          `${Math.ceil(this.royalCycle.integrity)}/${this.royalCycle.maxIntegrity}`
        );
      }

      // Canon 1:1 Lore — Détection et éclosion des ovomorphs issus de l'eggmorphing
      if (this.ovomorphs && window.gameInstance?.humans) {
        for (const egg of this.ovomorphs) {
          if (egg.isOpen) continue;
          const intruder = window.gameInstance.humans.find((h) => (
            !h.isIncapacitated && !h.isCocooned && Math.hypot(h.x - egg.x, h.z - egg.z) <= 4.2
          ));
          if (intruder) {
            egg.isOpen = true;
            audioManager.playEggHatch?.(egg.x, egg.z);
            audioManager.playFacehuggerLeap?.();
            window.HiveSystems?.vfx?.burst(egg.x, egg.z, 0xf59e0b, 20, 0.15, 1.2);
            window.HiveSystems?.vfx?.projectile({
              startX: egg.x,
              startY: 0.8,
              startZ: egg.z,
              endX: intruder.x,
              endY: 1.5,
              endZ: intruder.z,
              color: 0xf59e0b,
              scale: 0.22,
              onImpact: () => {
                intruder.takeDamage(45);
                intruder.staggerTimer = 1.2;
                window.HiveSystems?.vfx?.floatingText(intruder.x, 2.8, intruder.z, 'FACEHUGGER SAUVAGE !', '#f59e0b', true);
              }
            });
            appendSensorLog(`[ÉCLOSION PÉRIMÉTRIQUE] L'ovomorphe issu de ${egg.hostName} a éclos et bondi sur ${intruder.name} !`, 'bio');
          }
        }
      }

      this.updateRoyalButton();
    }

    destroy() {
      this.royalCycle?.destroy();
      if (this.ovomorphs) {
        for (const egg of this.ovomorphs) {
          if (egg.mesh) rendererEngine.removeObject(egg.mesh);
        }
        this.ovomorphs = [];
      }
    }

    updateReserveUI() {
      this.lastDisplayedReserve = Math.floor(this.huntReserve);
      setHudBar('sec', 'RÉSERVE DE CHASSE', this.huntReserve);
    }
  }

  class StageHiveRTS {
    constructor() {
      this.isCompleted = false;
      this.rtsUnits = [];
      this.queen = null;
      this.possessedUnit = null;
      this.possessedMoveTarget = null;
      this.biomass = 120;
      this.lastHostCount = -1;
      this.lastThreatCount = -1;
      this.incubationCycles = [];
      this.processedBiomassHosts = new Set();
      this.relayCount = 0;
      this.relayMeshes = [];
      this.ovipositorMesh = null;
      this.mantisBoss = null;
      this.purgeRemaining = 240;
      this.lastPurgeSecond = -1;
    }

    findFreePosition(preferredX, preferredZ, seed = 0, extraOccupied = []) {
      const offsets = [
        [0, 0], [4, 0], [-4, 0], [0, 4], [0, -4],
        [6, 6], [-6, 6], [6, -6], [-6, -6],
        [10, 0], [-10, 0], [0, 10], [0, -10]
      ];
      for (let index = 0; index < offsets.length; index++) {
        const offset = offsets[(index + seed) % offsets.length];
        const x = preferredX + offset[0];
        const z = preferredZ + offset[1];
        const overlapsUnit = this.rtsUnits.some((unit) => Math.hypot(unit.x - x, unit.z - z) < 2.5);
        const overlapsHuman = (window.gameInstance?.humans || []).some((human) => (
          !human.isIncapacitated && Math.hypot(human.x - x, human.z - z) < 2.5
        ));
        const overlapsReserved = extraOccupied.some((entity) => Math.hypot(entity.x - x, entity.z - z) < 2.5);
        if (!stationMap.checkCollision(x, z) && !overlapsUnit && !overlapsHuman && !overlapsReserved) return { x, z };
      }

      // Fallback deterministe : elargit la recherche sans faire naitre d'unite dans un obstacle.
      for (let radius = 12; radius <= 36; radius += 4) {
        for (let segment = 0; segment < 16; segment++) {
          const angle = ((segment + seed) / 16) * Math.PI * 2;
          const x = preferredX + Math.cos(angle) * radius;
          const z = preferredZ + Math.sin(angle) * radius;
          const overlapsUnit = this.rtsUnits.some((unit) => Math.hypot(unit.x - x, unit.z - z) < 2.5);
          const overlapsHuman = (window.gameInstance?.humans || []).some((human) => (
            !human.isIncapacitated && Math.hypot(human.x - x, human.z - z) < 2.5
          ));
          const overlapsReserved = extraOccupied.some((entity) => Math.hypot(entity.x - x, entity.z - z) < 2.5);
          if (!stationMap.checkCollision(x, z) && !overlapsUnit && !overlapsHuman && !overlapsReserved) return { x, z };
        }
      }
      return { x: 0, z: 0 };
    }

    createOvipositor() {
      if (!this.queen) return;
      this.ovipositorPos = { x: this.queen.x, z: this.queen.z };
      const group = new THREE.Group();
      const sac = new THREE.Mesh(
        new THREE.SphereGeometry(2.3, 16, 16),
        new THREE.MeshStandardMaterial({
          color: 0x3f1d46,
          emissive: 0x581c87,
          emissiveIntensity: 0.75,
          roughness: 0.5
        })
      );
      sac.scale.set(1.35, 0.8, 2.2);
      sac.position.set(0, 1.45, -4.2);
      group.add(sac);
      for (let index = 0; index < 4; index++) {
        const tendon = new THREE.Mesh(
          new THREE.CylinderGeometry(0.16, 0.24, 5.2, 8),
          new THREE.MeshStandardMaterial({ color: 0x26132d, emissive: 0x3b0764, emissiveIntensity: 0.55 })
        );
        tendon.name = `ovipositor-tendon-${index}`;
        tendon.rotation.x = Math.PI / 2.6;
        tendon.rotation.z = (index - 1.5) * 0.13;
        tendon.position.set((index - 1.5) * 0.7, 2.25, -2.15);
        group.add(tendon);
      }
      group.position.set(this.queen.x, 0, this.queen.z);
      group.userData.biologicalRole = 'ovipositor';
      rendererEngine.scene.add(group);
      this.ovipositorMesh = group;
      this.queen.attachedToOvipositor = true;
    }

    toggleQueenOvipositor() {
      if (!this.queen || this.queen.isDestroyed) {
        showToast('La Reine n\'est pas disponible.');
        return;
      }
      if (this.queen.attachedToOvipositor) {
        // DÉTACHEMENT DE L'OVIPOSITEUR (Climax Aliens 1986 / Romulus)
        this.queen.attachedToOvipositor = false;
        this.queen.speed = 0.38;
        if (this.ovipositorMesh) {
          this.ovipositorMesh.traverse((child) => {
            if (child.name?.startsWith('ovipositor-tendon-')) child.visible = false;
          });
        }
        window.HiveSystems?.vfx?.burst(this.queen.x, this.queen.z, 0x3b0764, 28, 0.22, 2.8);
        window.HiveSystems?.vfx?.burst(this.queen.x, this.queen.z, 0x39ff14, 18, 0.16, 1.8);
        window.HiveSystems?.vfx?.floatingText?.(this.queen.x, 3.8, this.queen.z, 'OVIPOSITEUR SECTIONNÉ !', '#a855f7', true);
        audioManager.playQueenRoar?.();
        audioManager.playWetImpact?.(this.queen.x, this.queen.z);
        rendererEngine.addScreenShake?.(0.65, 0.45);
        showToast('RUPTURE DE L\'OVIPOSITEUR ! La Reine est libre et mène l\'assaut direct [X/P] !');
        this.log('[REINE DE GUERRE] L\'ovipositeur a été sectionné. La Reine participe directement au massacre.');
        this.updateHUD();
        this.updateStats();
      } else {
        // RÉARRIMAGE À L'OVIPOSITEUR
        const oviPos = this.ovipositorPos || { x: 55, z: 45 };
        const dist = Math.hypot(this.queen.x - oviPos.x, this.queen.z - oviPos.z);
        if (dist > 6.5) {
          showToast(`Trop loin de l'ovipositeur (${dist.toFixed(1)}m / 6.5m requis). Rapprochez la Reine du sac d'œufs.`);
          return;
        }
        this.queen.x = oviPos.x;
        this.queen.z = oviPos.z;
        this.queen.mesh?.position.set(this.queen.x, 0, this.queen.z);
        this.queen.attachedToOvipositor = true;
        this.queen.speed = 0;
        if (this.possessedUnit === this.queen) this.possessedUnit = null;
        if (this.ovipositorMesh) {
          this.ovipositorMesh.traverse((child) => {
            if (child.name?.startsWith('ovipositor-tendon-')) child.visible = true;
          });
        }
        window.HiveSystems?.vfx?.burst(this.queen.x, this.queen.z, 0x7e22ce, 18, 0.14, 2.0);
        window.HiveSystems?.vfx?.floatingText?.(this.queen.x, 3.8, this.queen.z, 'ANCRAGE ROYAL RÉTABLI', '#39ff14', false);
        audioManager.playAcidSizzle?.();
        showToast('La Reine est réancrée à son ovipositeur. Les pontes et cycles peuvent reprendre.');
        this.log('[NURSERIE] Réarrimage terminé. Cycles de la ruche réactivés.');
        this.updateHUD();
        this.updateStats();
      }
    }

    executePossessedAttack(targetEnemy = null) {
      if (!this.possessedUnit || this.possessedUnit.isDestroyed) return;
      const humans = window.gameInstance?.humans || [];
      const unit = this.possessedUnit;
      const isQueen = unit.caste === 'queen';
      const maxReach = isQueen ? 7.5 : (unit.attackRange + 2.5);

      let target = targetEnemy;
      if (!target) {
        target = humans
          .filter((h) => !h.isCocooned && !h.isIncapacitated && Math.hypot(h.x - unit.x, h.z - unit.z) <= maxReach)
          .sort((a, b) => Math.hypot(a.x - unit.x, a.z - unit.z) - Math.hypot(b.x - unit.x, b.z - unit.z))[0] || null;
      }

      if (!target) {
        showToast('Aucune menace vivante à portée d\'attaque.');
        return;
      }

      unit.attackCooldown = isQueen ? 0.95 : 0.6;
      unit.attackAnimation = 1;

      if (isQueen) {
        audioManager.playQueenRoar?.();
        audioManager.playBoneCrunch?.();
        audioManager.playWetImpact?.(unit.x, unit.z);
        rendererEngine.addScreenShake?.(0.4, 0.28);
        const cleaveVictims = humans.filter((h) => (
          !h.isCocooned && !h.isIncapacitated && Math.hypot(h.x - unit.x, h.z - unit.z) <= 7.0
        ));
        cleaveVictims.forEach((victim) => {
          victim.takeDamage(180, unit);
          victim.staggerTimer = 0.6;
          window.HiveSystems?.vfx?.burst(victim.x, victim.z, 0xb91c1c, 18, 0.16, 1.6);
          window.HiveSystems?.vfx?.floatingText?.(victim.x, 2.5, victim.z, '-180 BROYAGE ROYAL', '#a855f7', true);
        });
        showToast('BALAYAGE ROYAL DÉVASTATEUR !');
      } else if (unit.caste === 'spitter') {
        audioManager.playAcidSizzle?.();
        const applySpitHit = () => {
          target.takeDamage(unit.damage, unit);
          audioManager.playAcidSizzle?.();
        };
        const projectileVfx = window.HiveSystems?.vfx;
        if (projectileVfx?.projectile) {
          projectileVfx.projectile({
            startX: unit.x,
            startY: 1.55,
            startZ: unit.z,
            endX: target.x,
            endY: 1.1,
            endZ: target.z,
            color: 0xa3e635,
            scale: 0.22,
            speed: 22,
            acid: true,
            onImpact: applySpitHit
          });
        } else {
          applySpitHit();
        }
        showToast('CRACHAT CAUSTIQUE DU SPITTER [Distance] !');
      } else if (unit.caste === 'crusher') {
        audioManager.playBoneCrunch?.();
        audioManager.playWetImpact?.(unit.x, unit.z);
        rendererEngine.addScreenShake?.(0.32, 0.22);
        const chargeTargets = humans.filter((h) => !h.isCocooned && !h.isIncapacitated && Math.hypot(h.x - unit.x, h.z - unit.z) <= 4.8);
        chargeTargets.forEach((ct) => {
          ct.takeDamage(unit.damage, unit);
          ct.staggerTimer = 1.1;
          window.HiveSystems?.vfx?.burst(ct.x, ct.z, 0xef4444, 16, 0.14, 1.4);
          window.HiveSystems?.vfx?.floatingText?.(ct.x, 2.2, ct.z, `-${unit.damage} CHARGE BÉLIER`, '#ef4444', true);
        });
        showToast('IMPACT DE CHARGE DU CRUSHER !');
      } else if (unit.caste === 'praetorian' || unit.caste === 'palatine') {
        audioManager.playBoneCrunch?.();
        audioManager.playWetImpact?.(unit.x, unit.z);
        rendererEngine.addScreenShake?.(0.28, 0.18);
        target.takeDamage(unit.damage, unit);
        target.staggerTimer = 0.8;
        window.HiveSystems?.vfx?.ring?.(unit.x, unit.z, 0xa855f7, 3.8);
        window.HiveSystems?.vfx?.burst(target.x, target.z, 0xa855f7, 20, 0.15, 1.6);
        window.HiveSystems?.vfx?.floatingText?.(target.x, 2.6, target.z, `-${unit.damage} CHOC ROYAL`, '#a855f7', true);
        showToast(`FRAPPE ROYALE DE ${unit.caste.toUpperCase()} !`);
      } else {
        audioManager.playBoneCrunch?.();
        audioManager.playWetImpact?.(target.x, target.z);
        target.takeDamage(unit.damage, unit);
        target.staggerTimer = 0.45;
        window.HiveSystems?.vfx?.burst(target.x, target.z, 0xef4444, 14, 0.12, 1.4);
        window.HiveSystems?.vfx?.floatingText?.(target.x, 2.2, target.z, `-${unit.damage}`, '#ef4444', false);
      }
    }

    decorateMantisBoss() {
      if (!this.mantisBoss?.mesh) return;
      for (let index = 0; index < 2; index++) {
        const line = new THREE.Mesh(
          new THREE.CylinderGeometry(0.11, 0.11, 3.8, 7),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.35 })
        );
        line.name = `mantis-hydraulic-${index + 1}`;
        line.position.set(index === 0 ? -1.35 : 1.35, 2.3, 0.7);
        line.rotation.z = index === 0 ? -0.22 : 0.22;
        this.mantisBoss.mesh.add(line);
      }
    }

    onMantisPhaseChange(mantis, phase) {
      if (phase === 2) {
        mantis.mesh?.traverse((child) => {
          if (child.name?.startsWith('mantis-hydraulic-')) child.visible = false;
        });
        this.log('[MANTIS-4] Phase 2 : conduites rompues, plaque frontale encore blindée.');
        window.HiveSystems?.narrative('ELIAN TORV', 'Les hydrauliques sont coupées. MANTIS-4 passe sur les servos de secours.');
      } else if (phase === 3) {
        this.log('[MANTIS-4] Phase 3 : blindage ouvert, châssis interne vulnérable.');
        window.HiveSystems?.vfx?.ring(mantis.x, mantis.z, 0xef4444, 5);
      }
      this.updateStats();
    }

    ensureNurseryInventory() {
      if (!window.gameInstance || !this.queen) return;
      const humans = window.gameInstance.humans;
      const reserves = [
        {
          accepts: (host) => host.type !== 'labhound' && !this.isArmoredHost(host),
          type: 'scientist',
          name: 'Technicien de quart Neral Vos',
          offset: { x: -10, z: -7 }
        },
        {
          accepts: (host) => host.type === 'labhound',
          type: 'labhound',
          name: 'Animal de service K-12',
          offset: { x: -5, z: -11 }
        },
        {
          accepts: (host) => this.isArmoredHost(host),
          type: 'commando',
          name: 'Commando blessée Rhea Maddox',
          offset: { x: -14, z: 2 }
        }
      ];

      reserves.forEach((reserve, index) => {
        const available = humans.some((host) => (
          host.isCocooned &&
          !host.usedAsHost &&
          host.hostEligibility === 'viable' &&
          reserve.accepts(host)
        ));
        if (available) return;
        const spawn = this.findFreePosition(
          this.queen.x + reserve.offset.x,
          this.queen.z + reserve.offset.z,
          index + 9
        );
        const host = new HumanAI(180 + index, reserve.type, spawn.x, spawn.z, reserve.name);
        host.hostEligibility = 'viable';
        host.createMesh();
        host.cocoonInResin();
        humans.push(host);
        resinGrid.addResinPatch(host.x, host.z, 3.6);
        this.log(`[NURSERIE] Réserve viable restaurée : ${host.name}.`);
      });
    }

    init() {
      document.getElementById('rts-control-bar').classList.remove('hidden');
      document.getElementById('hive-stats-group').classList.remove('hidden');
      alarmSystem.setLevel(5);
      pheromoneSystem.clearZones();
      playerCreature.clearMesh();
      const queenSpawn = this.findFreePosition(55, 45);
      this.queen = new HiveUnit(100, 'queen', queenSpawn.x, queenSpawn.z);
      this.queen.createMesh();
      this.rtsUnits.push(this.queen);
      this.createOvipositor();

      // La seule unité adulte initiale est le prédateur incarné pendant l'acte IV.
      const foundingCaste = ADULT_CASTE_PROFILES[playerCreature.adultCaste]
        ? playerCreature.adultCaste
        : 'drone';
      const foundingSpawn = this.findFreePosition(this.queen.x - 6, this.queen.z + 7);
      const foundingAdult = new HiveUnit(10, foundingCaste, foundingSpawn.x, foundingSpawn.z);
      foundingAdult.createMesh();
      this.rtsUnits.push(foundingAdult);
      this.ensureNurseryInventory();

      // PALIMPSESTE activates a final mixed response force.
      if (window.gameInstance) {
        const responseForce = [
          new HumanAI(201, 'synthetic', -42, -38, 'BRIAREOS-7 — synthétique de siège'),
          new HumanAI(202, 'incinerator', -24, 34, 'Opératrice thermique Sava Rhee'),
          new HumanAI(204, 'smartgunner', 38, -26, 'Artilleur gyro Kade Mercer'),
          new HumanAI(205, 'marine', -6, 18, 'Fusilier orbital Niko Vale'),
          new HumanAI(206, 'exosuit', 22, -42, 'MANTIS-4 — exosquelette KAPPA'),
          new HumanAI(207, 'powerloader', -36, 12, 'Élévateur P-5000 Caterpillar — Chef de pont Jansen'),
          new HumanAI(208, 'marine', 12, -28, 'Tourelle sentinelle UA 571-C (Opérateur Novak)')
        ];
        this.mantisBoss = responseForce[4];
        this.mantisBoss.bossId = 'MANTIS_4';
        this.mantisBoss.bossPhase = 1;
        this.mantisBoss.bossShield = 260;
        const asterState = window.gameInstance.campaignCharacters.asterRho;
        if (asterState.alive && !asterState.usedAsHost) {
          const aster = new HumanAI(203, 'commando', 2, -48, 'Surveillante Aster Rho');
          aster.characterKey = 'asterRho';
          aster.maskAttachments = asterState.maskAttachments;
          aster.hostEligibility = aster.maskAttachments > 0 ? 'protected' : 'viable';
          responseForce.push(aster);
        }
        const occupiedSpawns = [];
        responseForce.forEach((enemy, index) => {
          const spawn = this.findFreePosition(enemy.x, enemy.z, index + 3, occupiedSpawns);
          enemy.x = spawn.x;
          enemy.z = spawn.z;
          enemy.patrolOrigin = { x: spawn.x, z: spawn.z };
          enemy.choosePatrolWaypoint();
          occupiedSpawns.push(spawn);
          enemy.createMesh();
        });
        this.decorateMantisBoss();
        window.gameInstance.humans.push(...responseForce);
      }

      // Three exposed station relays make the systemic boss readable in the 3D space.
      const relayPositions = [{ x: -48, z: 48 }, { x: 0, z: -52 }, { x: 50, z: -4 }];
      relayPositions.forEach((position, index) => {
        const relay = window.HiveModelFactory?.createIndustrialProp?.('generator') || new THREE.Mesh(
          new THREE.CylinderGeometry(1.1, 1.5, 4, 10),
          new THREE.MeshStandardMaterial({ color: 0x334155, emissive: 0xef4444, emissiveIntensity: 1.1 })
        );
        relay.position.set(position.x, 2, position.z);
        relay.userData.relayIndex = index;
        relay.userData.isolated = false;
        rendererEngine.propsGroup.add(relay);
        this.relayMeshes.push(relay);
        window.HiveSystems?.vfx?.ring(position.x, position.z, 0xef4444, 4);
      });

      const difficulty = window.gameInstance?.campaignConfig?.difficulty || 'survivor';
      this.purgeRemaining = difficulty === 'story' ? 330 : (difficulty === 'nightmare' ? 180 : 240);
      this.updateHUD();
      this.updateStats();
      this.log(`[RUCHE] La Reine issue de ${window.gameInstance?.royalCycleRecord?.hostName || 'l’hôte royal'} est attachée à son ovipositeur.`);
      this.log(`[LIGNÉE] Le ${foundingCaste.toUpperCase()} de l’acte IV constitue l’unique adulte initial.`);
      this.log('[MANTIS-4] Phase 1 : deux réseaux hydrauliques protègent encore le châssis.');
      this.log('[PALIMPSESTE] Trois relais pilotent la purge. Posez trois ordres INFEST distincts.');
      window.HiveSystems?.setMission(5, 0, 'Désactiver trois relais de PALIMPSESTE avec des impulsions INFEST.');
      window.HiveSystems?.narrative('PALIMPSESTE', 'Autodestruction confirmée. Toute vie biologique sera effacée avec les archives.');
    }

    updateHUD() {
      document.getElementById('stage-badge').textContent = 'PHASE 5 : REINE — GUERRE DE LA RUCHE';
      const isAttached = Boolean(this.queen?.attachedToOvipositor);
      document.getElementById('bio-title').textContent = isAttached
        ? 'RÉSEAU SYNAPTIQUE — REINE ANCRÉE À L’OVIPOSITEUR'
        : 'RÉSEAU SYNAPTIQUE — REINE DE GUERRE DÉTACHÉE (COMBAT DIRECT)';
      document.getElementById('stage-instructions').innerHTML = '<strong>Commandement de la Ruche :</strong><br><br>• <strong>Q / W / E / R</strong> : ordres phéromonaux (Chasser, Capturer, Défendre, Infester).<br>• <strong>X</strong> : détacher / réarrimer la Reine de son ovipositeur (Aliens 1986).<br>• <strong>P</strong> : synchronisation synaptique directe (ZQSD + ESPACE pour attaquer).<br>• La Reine doit être ancrée à l’ovipositeur pour féconder les cocons.<br>• Détachée, la Reine devient un béhémoth de guerre (180 dégâts de zone).';
      setHudBar('vital', 'INTÉGRITÉ REINE', this.queen ? (this.queen.hp / this.queen.maxHp) * 100 : 100);
      const actionsContainer = document.getElementById('action-buttons-container');
      const oviBtnLabel = isAttached
        ? 'DÉTACHER LA REINE DE L’OVIPOSITEUR [X]'
        : 'RÉARRIMER LA REINE À L’OVIPOSITEUR [X]';
      const oviBtnBg = isAttached
        ? 'rgba(168,85,247,0.24)'
        : 'rgba(57,255,20,0.24)';
      const oviBtnBorder = isAttached ? '#a855f7' : '#39ff14';

      actionsContainer.innerHTML = `
        <button type="button" id="btn-toggle-ovipositor" class="act-btn" style="border-color: ${oviBtnBorder}; background: ${oviBtnBg}; font-weight: bold;">${oviBtnLabel}</button>
        <button type="button" id="btn-spawn-drone" class="act-btn">CYCLE DRONE — HÔTE STANDARD (30 Bio)</button>
        <button type="button" id="btn-spawn-runner" class="act-btn">CYCLE RUNNER — HÔTE QUADRUPÈDE (30 Bio)</button>
        <button type="button" id="btn-spawn-warrior" class="act-btn">CYCLE WARRIOR — HÔTE COMMANDO/BLINDÉ (45 Bio)</button>
        <button type="button" id="btn-spawn-worker" class="act-btn">SPÉCIALISER DRONE EN WORKER (25 Bio)</button>
        <button type="button" id="btn-spawn-prowler" class="act-btn">SPÉCIALISER DRONE EN PROWLER (40 Bio)</button>
        <button type="button" id="btn-spawn-spitter" class="act-btn">SPÉCIALISER DRONE EN SPITTER (50 Bio)</button>
        <button type="button" id="btn-spawn-burster" class="act-btn">MUTER RUNNER/DRONE EN BURSTER ACIDE (35 Bio)</button>
        <button type="button" id="btn-spawn-crusher" class="act-btn">MUTER RUNNER/WARRIOR EN CRUSHER (75 Bio)</button>
        <button type="button" id="btn-spawn-praetorian" class="act-btn">MUE D’UN WARRIOR EN PRAETORIAN (80 Bio)</button>
        <button type="button" id="btn-spawn-palatine" class="act-btn">GÉLÉE ROYALE : ÉLITE PALATINE (110 Bio)</button>
        <button type="button" id="btn-spawn-offspring" class="act-btn">MUTAGÈNE Z-01 : OFFSPRING (95 Bio)</button>
        <button type="button" id="btn-final-conquest" class="act-btn" disabled style="border-color: #39ff14; background: rgba(57,255,20,0.24);">ISOLER PALIMPSESTE ET CHOISIR UNE FIN</button>
      `;

      document.getElementById('btn-toggle-ovipositor').onclick = () => this.toggleQueenOvipositor();
      document.getElementById('btn-spawn-drone').onclick = () => this.spawnUnit('drone', 30);
      document.getElementById('btn-spawn-worker').onclick = () => this.spawnUnit('worker', 25);
      document.getElementById('btn-spawn-runner').onclick = () => this.spawnUnit('runner', 30);
      document.getElementById('btn-spawn-warrior').onclick = () => this.spawnUnit('warrior', 45);
      document.getElementById('btn-spawn-prowler').onclick = () => this.spawnUnit('prowler', 40);
      document.getElementById('btn-spawn-spitter').onclick = () => this.spawnUnit('spitter', 50);
      document.getElementById('btn-spawn-burster').onclick = () => this.spawnUnit('burster', 35);
      document.getElementById('btn-spawn-crusher').onclick = () => this.spawnUnit('crusher', 75);
      document.getElementById('btn-spawn-praetorian').onclick = () => this.spawnUnit('praetorian', 80);
      document.getElementById('btn-spawn-palatine').onclick = () => this.spawnUnit('palatine', 110);
      document.getElementById('btn-spawn-offspring').onclick = () => this.spawnUnit('offspring', 95);
      document.getElementById('btn-final-conquest').onclick = () => this.completeConquest();
    }

    isArmoredHost(host) {
      return ['commando', 'smartgunner', 'gyro', 'marine'].includes(host?.type);
    }

    findCompatibleHost(caste) {
      return (window.gameInstance?.humans || []).find((host) => {
        if (!host.isCocooned || host.usedAsHost || host.hostEligibility !== 'viable') return false;
        if (caste === 'runner') return host.type === 'labhound';
        if (caste === 'warrior') return this.isArmoredHost(host);
        if (caste === 'offspring') return true;
        if (caste === 'drone') return host.type !== 'labhound' && !this.isArmoredHost(host);
        return false;
      }) || null;
    }

    findSpecializationPrecursor(caste) {
      const precursorMap = {
        worker: ['drone'],
        prowler: ['drone'],
        spitter: ['drone'],
        burster: ['runner', 'drone'],
        crusher: ['warrior', 'runner'],
        praetorian: ['warrior'],
        palatine: ['praetorian']
      };
      const allowed = precursorMap[caste] || ['drone'];
      return this.rtsUnits.find((unit) => (
        !unit.isDestroyed && allowed.includes(unit.caste)
      )) || null;
    }

    canBeginCycle(caste, cost) {
      if (
        this.biomass < cost ||
        this.queen?.isDestroyed ||
        !this.queen?.attachedToOvipositor ||
        this.incubationCycles.filter((cycle) => cycle.isActive).length >= 3
      ) return false;
      if (['drone', 'runner', 'warrior', 'offspring'].includes(caste)) return Boolean(this.findCompatibleHost(caste));
      return Boolean(this.findSpecializationPrecursor(caste));
    }

    spawnUnit(caste, cost) {
      if (this.biomass < cost) {
        showToast(`Biomasse insuffisante : ${cost} requise.`);
        return;
      }
      if (this.queen?.isDestroyed || !this.queen?.attachedToOvipositor) {
        showToast('La Reine doit être vivante et attachée à l’ovipositeur.');
        return;
      }
      if (this.incubationCycles.filter((cycle) => cycle.isActive).length >= 3) {
        showToast('Trois cycles biologiques sont déjà exposés dans la nurserie.');
        return;
      }

      const usesHost = ['drone', 'runner', 'warrior', 'offspring'].includes(caste);
      const host = usesHost ? this.findCompatibleHost(caste) : null;
      const precursor = usesHost ? null : this.findSpecializationPrecursor(caste);
      if (usesHost && !host) {
        const requirement = caste === 'runner'
          ? 'un quadrupède'
          : (caste === 'warrior'
            ? 'un commando ou soldat blindé'
            : (caste === 'offspring' ? 'n’importe quel hôte viable pour infusion Z-01' : 'un humanoïde standard'));
        showToast(`Cycle ${caste.toUpperCase()} impossible : ${requirement} cocoonisé est requis.`);
        return;
      }
      if (!usesHost && !precursor) {
        const precursorReq = {
          worker: 'DRONE',
          prowler: 'DRONE',
          spitter: 'DRONE',
          burster: 'RUNNER ou DRONE',
          crusher: 'WARRIOR ou RUNNER',
          praetorian: 'WARRIOR',
          palatine: 'PRAETORIAN'
        };
        showToast(`Spécialisation impossible : précurseur mature (${precursorReq[caste] || 'DRONE'}) requis.`);
        return;
      }

      this.biomass -= cost;
      let originX;
      let originZ;
      let sourceName;
      let states;
      if (host) {
        host.usedAsHost = true;
        host.isInfected = true;
        host.isConsumedByCycle = true;
        host.collapseForBurst();
        window.gameInstance?.syncCampaignCharacter?.(host, { alive: false });
        originX = host.x;
        originZ = host.z;
        sourceName = host.name;
        states = caste === 'offspring'
          ? ['INFUSION Z-01', 'MUTATION RECOMBINANTE', 'ÉMERGENCE HYBRIDE']
          : ['OVOMORPHE', 'FACEHUGGER', 'IMPLANTATION', 'CHESTBURSTER', 'MUE ADULTE'];
        this.log(`[CYCLE ${caste.toUpperCase()}] Cycle engagé ; ${host.name} est réservé et consommé.`);
      } else {
        originX = precursor.x;
        originZ = precursor.z;
        sourceName = `${precursor.caste.toUpperCase()} #${precursor.id}`;
        precursor.destroy();
        this.rtsUnits = this.rtsUnits.filter((u) => u !== precursor);
        states = ['COCON DE SPÉCIALISATION', 'MUE AVANCÉE', `ÉMERGENCE DU ${caste.toUpperCase()}`];
        this.log(`[SPÉCIALISATION ${caste.toUpperCase()}] ${sourceName} entre dans une mue irréversible.`);
      }

      const durations = {
        drone: 14, runner: 12, warrior: 17, worker: 10,
        prowler: 12, spitter: 14, burster: 11, crusher: 20,
        praetorian: 20, palatine: 24, offspring: 22
      };
      const maxIntegrities = {
        drone: 150, runner: 140, warrior: 190, worker: 120,
        prowler: 160, spitter: 150, burster: 130, crusher: 260,
        praetorian: 240, palatine: 300, offspring: 250
      };

      const cycle = new BiologicalCycleEntity({
        id: `cycle-${Date.now()}-${this.incubationCycles.length}`,
        x: originX,
        z: originZ,
        caste,
        hostName: sourceName,
        duration: durations[caste] || 14,
        maxIntegrity: maxIntegrities[caste] || 160,
        states,
        onStateChange: (activeCycle) => {
          this.log(`[CYCLE ${caste.toUpperCase()}] ${activeCycle.state} — ${Math.floor(activeCycle.progress)}%.`);
        },
        onComplete: (completedCycle) => {
          if (this.isCompleted || this.queen?.isDestroyed) return;
          const spawn = this.findFreePosition(completedCycle.x, completedCycle.z, this.rtsUnits.length);
          const unit = new HiveUnit(Date.now() + this.rtsUnits.length, caste, spawn.x, spawn.z);
          unit.createMesh();
          this.rtsUnits.push(unit);
          this.updateStats();
          window.HiveSystems?.vfx?.burst(spawn.x, spawn.z, 0x39ff14, 24, 0.14, 1.5);
          this.log(`[NAISSANCE] ${caste.toUpperCase()} mature ; le cycle exposé a survécu.`);
        },
        onFail: (failedCycle) => {
          this.log(`[ÉCHEC BIOLOGIQUE] ${caste.toUpperCase()} détruit pendant ${failedCycle.state}.`);
          this.updateStats();
        }
      });
      cycle.createMesh();
      this.incubationCycles.push(cycle);
      this.updateStats();
      window.HiveSystems?.vfx?.ring(originX, originZ, 0xa855f7, 3.2);
    }

    updateStats() {
      const biomassElement = document.getElementById('hive-biomass');
      const unitElement = document.getElementById('hive-units');
      if (biomassElement) biomassElement.textContent = this.biomass;
      if (unitElement) unitElement.textContent = this.rtsUnits.filter((unit) => !unit.isDestroyed).length;
      const biomassPercent = Math.max(0, Math.min(100, (this.biomass / 220) * 100));
      setHudBar('sec', 'BIOMASSE DISPONIBLE', biomassPercent, this.biomass);
      const droneButton = document.getElementById('btn-spawn-drone');
      const workerButton = document.getElementById('btn-spawn-worker');
      const runnerButton = document.getElementById('btn-spawn-runner');
      const warriorButton = document.getElementById('btn-spawn-warrior');
      const spitterButton = document.getElementById('btn-spawn-spitter');
      const praetorianButton = document.getElementById('btn-spawn-praetorian');
      const prowlerButton = document.getElementById('btn-spawn-prowler');
      const bursterButton = document.getElementById('btn-spawn-burster');
      const crusherButton = document.getElementById('btn-spawn-crusher');
      const palatineButton = document.getElementById('btn-spawn-palatine');
      const offspringButton = document.getElementById('btn-spawn-offspring');
      const conquestButton = document.getElementById('btn-final-conquest');
      const oviButton = document.getElementById('btn-toggle-ovipositor');
      if (oviButton) {
        const isAttached = Boolean(this.queen?.attachedToOvipositor);
        oviButton.textContent = isAttached
          ? 'DÉTACHER LA REINE DE L’OVIPOSITEUR [X]'
          : 'RÉARRIMER LA REINE À L’OVIPOSITEUR [X]';
        oviButton.style.borderColor = isAttached ? '#a855f7' : '#39ff14';
        oviButton.style.background = isAttached ? 'rgba(168,85,247,0.24)' : 'rgba(57,255,20,0.24)';
      }
      if (droneButton) droneButton.disabled = !this.canBeginCycle('drone', 30);
      if (workerButton) workerButton.disabled = !this.canBeginCycle('worker', 25);
      if (runnerButton) runnerButton.disabled = !this.canBeginCycle('runner', 30);
      if (warriorButton) warriorButton.disabled = !this.canBeginCycle('warrior', 45);
      if (prowlerButton) prowlerButton.disabled = !this.canBeginCycle('prowler', 40);
      if (spitterButton) spitterButton.disabled = !this.canBeginCycle('spitter', 50);
      if (bursterButton) bursterButton.disabled = !this.canBeginCycle('burster', 35);
      if (crusherButton) crusherButton.disabled = !this.canBeginCycle('crusher', 75);
      if (praetorianButton) praetorianButton.disabled = !this.canBeginCycle('praetorian', 80);
      if (palatineButton) palatineButton.disabled = !this.canBeginCycle('palatine', 110);
      if (offspringButton) offspringButton.disabled = !this.canBeginCycle('offspring', 95);
      if (conquestButton) {
        conquestButton.disabled = !this.canCompleteConquest();
        const activeThreats = (window.gameInstance?.humans || []).filter((human) => !human.isCocooned && !human.isIncapacitated).length;
        const bossStatus = this.mantisBoss?.isIncapacitated
          ? 'MANTIS NEUTRALISÉ'
          : `MANTIS PHASE ${this.mantisBoss?.bossPhase || 1}`;
        conquestButton.textContent = `ISOLER PALIMPSESTE — RELAIS ${this.relayCount}/3 · ${bossStatus} · MENACES ${activeThreats} · PURGE ${Math.ceil(this.purgeRemaining)}s`;
        conquestButton.title = conquestButton.disabled
          ? 'Neutralisez les menaces et désactivez les trois relais.'
          : 'Choisir le destin final de la ruche.';
      }
    }

    canCompleteConquest() {
      const humans = window.gameInstance ? window.gameInstance.humans : [];
      const hasActiveThreat = humans.some((human) => !human.isCocooned && !human.isIncapacitated);
      return this.relayCount >= 3 && !hasActiveThreat && !this.queen?.isDestroyed;
    }

    handleKeyDown(key) {
      if (pheromoneSystem.possessionMode && ['w', 'a', 'z', 'q', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        return;
      }
      if (key === 'x') {
        this.toggleQueenOvipositor();
        return;
      }
      if (key === ' ' && pheromoneSystem.possessionMode && this.possessedUnit) {
        this.executePossessedAttack();
        return;
      }
      const commandByKey = {
        q: 'HUNT',
        w: 'CAPTURE',
        e: 'DEFEND',
        r: 'INFEST',
        t: 'RUSH',
        '1': 'HUNT',
        '2': 'CAPTURE',
        '3': 'DEFEND',
        '4': 'INFEST',
        '5': 'RUSH'
      };
      if (commandByKey[key]) {
        this.possessedUnit = null;
        pheromoneSystem.setCommand(commandByKey[key]);
      } else if (key === 'p') {
        pheromoneSystem.togglePossessionMode();
      }
    }

    handleCanvasClick(screenX, screenY) {
      const worldPoint = rendererEngine.screenToGround(screenX, screenY);
      if (!worldPoint) return;

      if (pheromoneSystem.possessionMode) {
        // En mode possession, un clic direct sur une menace active déclenche une attaque immédiate
        if (this.possessedUnit) {
          const clickedTarget = (window.gameInstance?.humans || []).find((h) => (
            !h.isCocooned && !h.isIncapacitated && Math.hypot(h.x - worldPoint.x, h.z - worldPoint.z) <= 3.2
          ));
          if (clickedTarget) {
            this.executePossessedAttack(clickedTarget);
            return;
          }
        }

        let closestUnit = null;
        let closestDistance = Infinity;
        for (const unit of this.rtsUnits) {
          if (unit.isDestroyed) continue;
          if (unit.caste === 'queen' && unit.attachedToOvipositor) continue; // La Reine ne peut être incarnée que si détachée
          const distance = Math.hypot(unit.x - worldPoint.x, unit.z - worldPoint.z);
          if (distance < closestDistance) {
            closestUnit = unit;
            closestDistance = distance;
          }
        }
        if (closestUnit && closestDistance <= 8.5) {
          this.possessedUnit = closestUnit;
          this.possessedMoveTarget = null;
          const unitTitle = closestUnit.caste === 'queen' ? 'REINE DE GUERRE DÉTACHÉE' : closestUnit.caste.toUpperCase();
          this.log(`[SYNAPSE] Contrôle direct du ${unitTitle} #${closestUnit.id}.`);
          showToast(`Contrôle synaptique actif : ${unitTitle} [ZQSD / ESPACE pour attaquer].`);
        } else if (this.possessedUnit) {
          this.possessedMoveTarget = worldPoint;
          showToast('Destination de l\'unité synchronisée mise à jour.');
        } else {
          showToast('Aucune unité sélectionnable à proximité du point cliqué.');
        }
        return;
      }

      const colors = { HUNT: 0xef4444, CAPTURE: 0xa855f7, DEFEND: 0x38bdf8, INFEST: 0x39ff14, RUSH: 0xdc2626 };
      const command = pheromoneSystem.activeCommand;
      const marker = new THREE.Mesh(
        new THREE.RingGeometry(1.6, 2.6, 24),
        new THREE.MeshBasicMaterial({ color: colors[command], transparent: true, opacity: 0.8, side: THREE.DoubleSide })
      );
      marker.rotation.x = -Math.PI / 2;
      marker.position.set(worldPoint.x, 0.12, worldPoint.z);
      rendererEngine.scene.add(marker);
      pheromoneSystem.addZone({ x: worldPoint.x, z: worldPoint.z, command, radius: 18, mesh: marker });
      if (command === 'INFEST') {
        resinGrid.addResinPatch(worldPoint.x, worldPoint.z, 5);
        const relayTarget = this.relayMeshes
          .filter((relay) => !relay.userData.isolated)
          .map((relay) => ({
            relay,
            distance: Math.hypot(relay.position.x - worldPoint.x, relay.position.z - worldPoint.z)
          }))
          .sort((left, right) => left.distance - right.distance)[0];
        if (relayTarget && relayTarget.distance <= 11) {
          const relay = relayTarget.relay;
          relay.userData.isolated = true;
          relay?.traverse((child) => {
            if (!child.isMesh || !child.material || Array.isArray(child.material)) return;
            if (child.material.emissive) child.material.emissive.setHex(0x39ff14);
          });
          this.relayCount = this.relayMeshes.filter((candidate) => candidate.userData.isolated).length;
          window.HiveSystems?.vfx?.ring(relay.position.x, relay.position.z, 0x39ff14, 5);
          window.HiveSystems?.updateObjective(5, this.relayCount, this.relayCount < 3
            ? `Désactiver encore ${3 - this.relayCount} relais de PALIMPSESTE.`
            : 'Neutraliser les dernières forces de réponse humaine.');
          this.log(`[PALIMPSESTE] Relais ${this.relayCount}/3 isolé du réseau de purge.`);
        }
      }
      this.log(`[PHÉROMONE ${command}] Marque posée en X:${worldPoint.x.toFixed(1)} Z:${worldPoint.z.toFixed(1)}.`);
      this.updateStats();
    }

    getCameraTarget() {
      if (pheromoneSystem.possessionMode && this.possessedUnit) return this.possessedUnit;
      // Centre tactique décalé : il garde la Reine, les trois relais et les
      // couloirs d'approche hors des panneaux HUD.
      return { x: 20, z: 10 };
    }

    completeConquest() {
      if (this.isCompleted) return;
      if (this.relayCount < 3) {
        showToast('Désactivez les trois relais avec des impulsions INFEST.');
        return;
      }
      if (!this.canCompleteConquest()) {
        showToast('Des menaces humaines sont encore actives dans la station.');
        return;
      }
      this.isCompleted = true;
      window.HiveSystems?.updateObjective(5, 5, 'Choisir le destin de la ruche.');
      window.HiveSystems?.ending((ending) => {
        if (!window.gameInstance) return;
        window.gameInstance.showEndModal(
          ending.title || 'VICTOIRE DE LA RUCHE',
          ending.epilogue || ending.description || 'MNEMOSYNE appartient désormais à la lignée royale.'
        );
      });
    }

    log(msg) { appendSensorLog(msg, 'alert'); }

    destroy() {
      this.incubationCycles.forEach((cycle) => cycle.destroy());
      this.incubationCycles = [];
      this.rtsUnits.forEach((unit) => unit.destroy());
      this.rtsUnits = [];
      if (this.ovipositorMesh) rendererEngine.removeObject(this.ovipositorMesh);
      this.ovipositorMesh = null;
      this.relayMeshes.forEach((relay) => rendererEngine.removeObject(relay));
      this.relayMeshes = [];
      document.getElementById('rts-control-bar')?.classList.add('hidden');
      pheromoneSystem.clearZones();
    }

    update(deltaSeconds = 1 / 60) {
      const humans = window.gameInstance ? window.gameInstance.humans : [];
      this.incubationCycles.forEach((cycle) => cycle.update(deltaSeconds));
      if (pheromoneSystem.possessionMode && this.possessedUnit) {
        let { dx, dy } = inputManager.getMovementVector();
        let remainingDistance = Infinity;
        if ((dx !== 0 || dy !== 0) && this.possessedMoveTarget) {
          this.possessedMoveTarget = null;
        } else if (dx === 0 && dy === 0 && this.possessedMoveTarget) {
          const distance = Math.hypot(this.possessedMoveTarget.x - this.possessedUnit.x, this.possessedMoveTarget.z - this.possessedUnit.z);
          if (distance <= 0.6) {
            this.possessedMoveTarget = null;
          } else {
            remainingDistance = distance;
            dx = (this.possessedMoveTarget.x - this.possessedUnit.x) / distance;
            dy = (this.possessedMoveTarget.z - this.possessedUnit.z) / distance;
          }
        }
        this.possessedUnit.moveDirect(dx, dy, deltaSeconds, remainingDistance);
      }
      for (const unit of this.rtsUnits) {
        if (unit !== this.possessedUnit || !pheromoneSystem.possessionMode) unit.update(deltaSeconds, humans);
      }
      const hostCount = humans.filter((human) => human.isCocooned).length;
      if (hostCount !== this.lastHostCount) {
        this.lastHostCount = hostCount;
        const hostElement = document.getElementById('hive-hosts');
        if (hostElement) hostElement.textContent = hostCount;
      }

      // La biomasse supplémentaire vient une seule fois de matière organique cocoonisée.
      for (const host of humans) {
        if (!host.isCocooned || this.processedBiomassHosts.has(host.id)) continue;
        this.processedBiomassHosts.add(host.id);
        if (!host.isConsumedByCycle && !host.usedAsHost) {
          this.biomass = Math.min(220, this.biomass + 12);
          this.log(`[BIOMASSE] Réserve organique prélevée sur le cocon de ${host.name} (+12).`);
          this.updateStats();
        }
      }
      const threatCount = humans.filter((human) => !human.isCocooned && !human.isIncapacitated).length;
      if (threatCount !== this.lastThreatCount) {
        this.lastThreatCount = threatCount;
        this.updateStats();
      }

      this.purgeRemaining = Math.max(0, this.purgeRemaining - deltaSeconds);
      const purgeSecond = Math.ceil(this.purgeRemaining);
      if (purgeSecond !== this.lastPurgeSecond) {
        this.lastPurgeSecond = purgeSecond;
        this.updateStats();
      }
      if (this.purgeRemaining <= 0 && !this.isCompleted) {
        window.gameInstance?.showEndModal(
          'PURGE DE MNEMOSYNE',
          'PALIMPSESTE a déclenché la fusion du cœur avant l’isolement des trois relais.'
        );
        return;
      }

    }
  }

  // -------------------------------------------------------------
  // 10. GAME MASTER MAIN LOOP
  // -------------------------------------------------------------
  class GameMaster {
    constructor() {
      this.currentStageIndex = 1;
      this.currentStage = null;
      this.humans = [];
      this.isRunning = false;
      this.isSystemPaused = true;
      this.campaignActive = false;
      this.campaignConfig = {
        difficulty: 'survivor',
        expandedLore: true,
        adultCaste: 'drone',
        hostProfile: null
      };
      this.campaignCharacters = {
        asterRho: {
          alive: true,
          usedAsHost: false,
          maskAttachments: 2
        }
      };
      this.royalCycleRecord = null;
      this.lastTimestamp = null;
      this.mobileHudMedia = null;
      this.setHudExpanded = null;
      this.headerResizeObserver = null;
    }

    // -----------------------------------------------------------
    // HUD RESPONSIVE & FOCUS
    // -----------------------------------------------------------
    setupResponsiveHud() {
      const header = document.getElementById('hud-header');
      const sidebar = document.getElementById('hud-sidebar');
      const toggleButton = document.getElementById('btn-toggle-hud');
      if (!header || !sidebar || !toggleButton) return;

      const syncHeaderOffset = () => {
        const height = Math.ceil(header.getBoundingClientRect().height);
        document.documentElement.style.setProperty('--hud-header-height', `${height}px`);
      };

      this.setHudExpanded = (expanded) => {
        sidebar.classList.toggle('mobile-collapsed', !expanded);
        sidebar.inert = !expanded;
        sidebar.setAttribute('aria-hidden', String(!expanded));
        toggleButton.setAttribute('aria-expanded', String(expanded));
        toggleButton.textContent = expanded ? 'MASQUER HUD' : 'AFFICHER HUD';
        if (!expanded) document.getElementById('game-canvas')?.focus({ preventScroll: true });
      };

      this.mobileHudMedia = window.matchMedia('(max-width: 680px)');
      toggleButton.addEventListener('click', () => {
        const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
        this.setHudExpanded(!isExpanded);
      });

      const handleViewportChange = () => {
        syncHeaderOffset();
        if (!this.mobileHudMedia.matches) this.setHudExpanded(true);
      };
      window.addEventListener('resize', handleViewportChange);
      if (typeof ResizeObserver !== 'undefined') {
        this.headerResizeObserver = new ResizeObserver(syncHeaderOffset);
        this.headerResizeObserver.observe(header);
      }
      handleViewportChange();
    }

    focusPrimaryAction() {
      requestAnimationFrame(() => {
        const sidebar = document.getElementById('hud-sidebar');
        const canvas = document.getElementById('game-canvas');
        if (sidebar?.classList.contains('mobile-collapsed')) {
          canvas?.focus({ preventScroll: true });
          return;
        }
        if (this.currentStageIndex >= 2) {
          canvas?.focus({ preventScroll: true });
          return;
        }
        const action = document.querySelector('#action-buttons-container button:not(:disabled)');
        (action || canvas)?.focus({ preventScroll: true });
      });
    }

    init() {
      window.gameInstance = this;
      const canvas = document.getElementById('game-canvas');
      this.setupResponsiveHud();
      this.motionTracker = new MotionTrackerDisplay();
      rendererEngine.init(canvas); inputManager.init(canvas); audioManager.init(); visionSystem.init(); alarmSystem.init(); pheromoneSystem.init();
      window.HiveModelFactory?.loadTextures?.();
      window.HiveSystems?.init(this, {
        scene: rendererEngine.scene,
        removeObject: (object) => rendererEngine.removeObject(object)
      });
      inputManager.on('keydown', (key) => this.handleKeyDown(key));
      inputManager.on('mousedown', ({ button, x, y }) => {
        if (button !== 0) return;
        if (this.currentStageIndex === 5 && this.currentStage && this.currentStage.handleCanvasClick) {
          this.currentStage.handleCanvasClick(x, y);
          return;
        }
        if (this.currentStageIndex >= 2 && this.currentStageIndex <= 4) {
          const worldPoint = rendererEngine.screenToGround(x, y);
          if (worldPoint) {
            if (this.currentStageIndex === 4 && this.currentStage) {
              const clickedHuman = (this.humans || []).find((h) => (
                Math.hypot(h.x - worldPoint.x, h.z - worldPoint.z) < 3.2
              ));
              if (clickedHuman) {
                if (clickedHuman.isIncapacitated && !clickedHuman.isCocooned && clickedHuman.hostEligibility !== 'none') {
                  this.currentStage.executeCocoonHost?.();
                  return;
                }
                if (!clickedHuman.isIncapacitated && !clickedHuman.isCocooned) {
                  this.currentStage.executeClawSwipe?.();
                  return;
                }
              }
            }
            playerCreature.setMoveTarget(worldPoint.x, worldPoint.z);
          }
        }
      });
      canvas.addEventListener('pointerdown', () => canvas.focus({ preventScroll: true }));
      document.addEventListener('click', (event) => {
        if (event.detail === 0 || !(event.target instanceof Element)) return;
        const gameControl = event.target.closest('.vis-btn, .act-btn, .rts-cmd-btn');
        // A disconnected action was replaced during this click; keep focus on its newly rendered successor.
        if (gameControl?.matches('.act-btn') && !gameControl.isConnected) return;
        if (gameControl) {
          requestAnimationFrame(() => canvas.focus({ preventScroll: true }));
        }
      });
      stationMap.buildMap(); resinGrid.init();
      this.ensureStageOneHost(true);
      playerCreature.createMesh();
      this.loadStage(1);
      this.isRunning = true;
      requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    handleKeyDown(key) {
      if (this.isSystemPaused) return;
      if (key === 'm') {
        this.motionTracker?.toggleCollapse();
        return;
      }
      if (key === 't' && this.currentStageIndex !== 5 && !playerCreature.isCeilingProwling) {
        this.motionTracker?.toggleFocusedMode();
        return;
      }
      if (key === 'n') {
        pheromoneSystem.dropManualScent(playerCreature.x, playerCreature.z);
        return;
      }
      const visionByKey = { f1: 'normal', f2: 'thermal', f3: 'acoustic' };
      if (visionByKey[key]) {
        visionSystem.setMode(visionByKey[key]);
        return;
      }
      if (key === 'u' && (!this.currentStage || !this.currentStage.handleKeyDown)) {
        playerCreature.toggleAquaticImmersion?.();
        return;
      }
      if (this.currentStage && this.currentStage.handleKeyDown) this.currentStage.handleKeyDown(key);
    }

    loadStage(index) {
      if (index < 1 || index > 5) return;
      if (this.currentStage && this.currentStage.destroy) this.currentStage.destroy();
      inputManager.reset();
      this.currentStageIndex = index;
      if (index === 1) this.ensureStageOneHost();
      if (index === 2 && !this.humans.some((human) => human.hostEligibility === 'viable')) this.ensureStageOneHost(true);
      document.getElementById('app-container')?.classList.toggle('is-rts', index === 5);
      if (index !== 5) {
        document.getElementById('rts-control-bar')?.classList.add('hidden');
        pheromoneSystem.clearZones();
      }
      if (index === 1) this.currentStage = new StageEgg();
      else if (index === 2) this.currentStage = new StageFacehugger();
      else if (index === 3) this.currentStage = new StageChestburster();
      else if (index === 4) this.currentStage = new StageDrone();
      else if (index === 5) this.currentStage = new StageHiveRTS();
      if (this.currentStage) {
        this.currentStage.init();
        if (this.mobileHudMedia?.matches && this.setHudExpanded) this.setHudExpanded(index === 1);
        this.focusPrimaryAction();
      }
    }

    advanceStage(completedStage) {
      if (completedStage !== this.currentStage || !completedStage.isCompleted || this.currentStageIndex >= 5) return;
      const nextStage = this.currentStageIndex + 1;
      const unlocksByStage = {
        2: ['facehugger', 'journal_01', 'journal_02'],
        3: ['chestburster', 'journal_03', 'journal_04'],
        4: ['drone', 'runner', 'security_agent', 'thermal_operator', 'gyro_gunner', 'journal_05'],
        5: ['worker', 'warrior', 'spitter', 'praetorian', 'queen', 'argos_synthetic', 'capture_commando', 'journal_06', 'journal_07', 'journal_08']
      };
      window.HiveSystems?.checkpoint(nextStage, unlocksByStage[nextStage] || [], {
        adultCaste: playerCreature.adultCaste,
        hostProfile: this.hostProfile,
        campaignCharacters: Object.fromEntries(
          Object.entries(this.campaignCharacters).map(([key, value]) => [key, { ...value }])
        )
      });
      window.HiveSystems?.vfx?.transformation();
      const act = window.HIVE_CONTENT?.narrative?.acts?.[nextStage - 1];
      if (act?.summary) window.HiveSystems?.narrative(`ACTE ${nextStage}`, act.summary, 6500);
      this.loadStage(nextStage);
    }

    // -----------------------------------------------------------
    // CAMPAIGN SESSION, DIFFICULTY AND SYSTEM PAUSE
    // -----------------------------------------------------------
    configureCampaign(save) {
      const savedCaste = ADULT_CASTE_PROFILES[save?.adultCaste] ? save.adultCaste : 'drone';
      const savedHostProfile = typeof save?.hostProfile === 'string' ? save.hostProfile : null;
      this.campaignConfig = {
        difficulty: save?.difficulty || 'survivor',
        expandedLore: save?.expandedLore !== false,
        adultCaste: savedCaste,
        hostProfile: savedHostProfile
      };
      const savedAster = save?.campaignCharacters?.asterRho;
      const savedAttachments = Number(savedAster?.maskAttachments);
      this.campaignCharacters.asterRho = {
        alive: savedAster?.alive !== false,
        usedAsHost: Boolean(savedAster?.usedAsHost),
        maskAttachments: Number.isFinite(savedAttachments)
          ? Math.max(0, Math.min(2, savedAttachments))
          : 2
      };
    }

    resetWorldState() {
      if (this.currentStage?.destroy) this.currentStage.destroy();
      this.currentStage = null;
      this.clearHumans();
      resinGrid.reset();
      pheromoneSystem.reset();
      inputManager.reset();
      window.HiveSystems?.vfx?.clear?.(false);

      playerCreature.clearMesh();
      playerCreature.form = 'egg';
      playerCreature.x = -20;
      playerCreature.z = -35;
      playerCreature.speed = 0.25;
      playerCreature.eggIsOpen = false;
      playerCreature.isLeaping = false;
      playerCreature.isChrysalis = false;
      playerCreature.maxHealth = 100;
      playerCreature.health = 100;
      playerCreature.isDefeated = false;
      playerCreature.moveTarget = null;
      playerCreature.moveWaypoints = [];
      playerCreature.adultCaste = 'drone';
      this.hostProfile = null;
      this.lastTimestamp = null;

      document.getElementById('app-container')?.classList.remove('is-rts');
      document.getElementById('rts-control-bar')?.classList.add('hidden');
      document.getElementById('hive-stats-group')?.classList.add('hidden');
      const counters = {
        'hive-biomass': '0',
        'hive-units': '0',
        'hive-hosts': '0',
        'hive-resin': '0%'
      };
      Object.entries(counters).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
      });
      alarmSystem.setLevel(0);
      visionSystem.setMode('normal');
    }

    startCampaign(stage = 1) {
      const targetStage = Math.max(1, Math.min(5, Number(stage) || 1));
      this.resetWorldState();
      if (targetStage === 1) {
        this.resetCampaignCharacters();
      } else {
        playerCreature.setAdultCaste(this.campaignConfig.adultCaste || 'drone');
        this.hostProfile = this.campaignConfig.hostProfile || null;
      }
      this.campaignActive = true;
      this.isRunning = true;
      this.lastTimestamp = null;
      const log = document.getElementById('sensor-log');
      if (log) log.replaceChildren();
      appendSensorLog('[SYSTÈME] Réseau sensoriel de campagne initialisé.', 'info');
      this.loadStage(targetStage);
      this.setSystemPaused(false);
      audioManager.startAmbience();
      this.focusPrimaryAction();
    }

    returnToMenu() {
      this.campaignActive = false;
      this.setSystemPaused(true);
      audioManager.stopAmbience();
      this.resetWorldState();
      this.resetCampaignCharacters();
      this.ensureStageOneHost(true);
      this.loadStage(1);
    }

    resetCampaignCharacters() {
      this.campaignCharacters.asterRho = {
        alive: true,
        usedAsHost: false,
        maskAttachments: 2
      };
      this.royalCycleRecord = null;
    }

    syncCampaignCharacter(human, overrides = {}) {
      if (!human?.characterKey || !this.campaignCharacters[human.characterKey]) return;
      this.campaignCharacters[human.characterKey] = {
        ...this.campaignCharacters[human.characterKey],
        alive: overrides.alive ?? true,
        usedAsHost: Boolean(human.usedAsHost),
        maskAttachments: Math.max(0, Math.min(2, Number(human.maskAttachments) || 0))
      };
    }

    ensureStageOneHost(force = false) {
      const hasHost = this.humans.some((human) => human.type === 'scientist' && !human.isIncapacitated);
      if (hasHost && !force) return;
      if (force) this.clearHumans();
      const scientist = new HumanAI(1, 'scientist', -20, -10, 'Xénobiologiste Imani Kade');
      scientist.createMesh();
      this.humans.push(scientist);
    }

    setSystemPaused(paused) {
      this.isSystemPaused = !!paused;
      document.getElementById('app-container')?.classList.toggle('game-paused', this.isSystemPaused);
      inputManager.reset();
      this.lastTimestamp = null;
    }

    setMasterVolume(value) {
      audioManager.setVolume(value);
    }

    toggleAudio() {
      return audioManager.toggleMuted();
    }

    setReducedMotion(value) {
      rendererEngine.reduceMotion = !!value || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }

    getDifficultyDamageModifier() {
      if (this.campaignConfig.difficulty === 'story') return 0.55;
      if (this.campaignConfig.difficulty === 'nightmare') return 1.45;
      return 1;
    }

    clearHumans() {
      for (const human of this.humans) human.destroy();
      this.humans = [];
    }

    showEndModal(title, description) {
      const modal = document.getElementById('stage-modal');
      const continueButton = document.getElementById('modal-btn-continue');
      document.getElementById('modal-stage-num').textContent = 'CYCLE TERMINÉ';
      document.getElementById('modal-title').textContent = title;
      document.getElementById('modal-description').textContent = description;
      continueButton.textContent = 'RECOMMENCER LE CYCLE ↻';
      continueButton.onclick = () => window.location.reload();
      for (const regionId of ['game-canvas', 'hud-header', 'hud-sidebar', 'rts-control-bar']) {
        const region = document.getElementById(regionId);
        if (!region) continue;
        region.inert = true;
        region.setAttribute('aria-hidden', 'true');
      }
      modal.setAttribute('aria-hidden', 'false');
      modal.classList.remove('hidden');
      this.isRunning = false;
      modal.onkeydown = (event) => {
        if (event.key !== 'Tab') return;
        event.preventDefault();
        continueButton.focus({ preventScroll: true });
      };
      continueButton.focus();
    }

    gameLoop(timestamp) {
      if (!this.isRunning) return;

      const rawDelta = this.lastTimestamp === null ? 1 / 60 : (timestamp - this.lastTimestamp) / 1000;
      const deltaSeconds = Math.max(0, Math.min(0.05, rawDelta));
      this.lastTimestamp = timestamp;

      if (!this.isSystemPaused) {
        if (this.currentStageIndex !== 5) playerCreature.update(deltaSeconds);
        if (!this.isRunning) return;
        for (const human of this.humans) {
          human.update(deltaSeconds);
          if (!this.isRunning) return;
        }

        const activeStage = this.currentStage;
        if (activeStage) {
          activeStage.update(deltaSeconds);
          if (!this.isRunning) return;
          if (activeStage === this.currentStage && activeStage.isCompleted && this.currentStageIndex < 5) {
            this.loadStage(this.currentStageIndex + 1);
          }
        }
        window.HiveSystems?.update(deltaSeconds);
        stationMap.update?.(deltaSeconds);
        visionSystem.update?.(deltaSeconds);
        pheromoneSystem.update?.(deltaSeconds);
        this.motionTracker?.update(deltaSeconds, playerCreature, this.humans);
        if (!this.isRunning) return;
      }

      const cameraOverride = this.currentStage?.getCameraOverride?.() || null;
      if (cameraOverride) {
        rendererEngine.setCinematicCamera(cameraOverride, deltaSeconds);
      } else {
        const cameraTarget = this.currentStage?.getCameraTarget
          ? this.currentStage.getCameraTarget()
          : playerCreature;
        rendererEngine.setCameraTarget(
          cameraTarget.x,
          cameraTarget.z,
          0,
          this.currentStageIndex === 5,
          deltaSeconds
        );
      }
      rendererEngine.render();
      requestAnimationFrame((nextTimestamp) => this.gameLoop(nextTimestamp));
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    try {
      if (typeof THREE === 'undefined') throw new Error('Three.js indisponible');
      const game = new GameMaster();
      game.init();
    } catch (error) {
      console.error('[HIVE ASCENSION] Initialisation impossible', error);
      const instructions = document.getElementById('stage-instructions');
      const actions = document.getElementById('action-buttons-container');
      if (instructions) instructions.textContent = 'Le moteur 3D n\'a pas pu démarrer. Vérifiez WebGL et la connexion au CDN Three.js, puis rechargez la page.';
      if (actions) actions.innerHTML = '<button type="button" class="act-btn" id="btn-reload-game">RECHARGER LE JEU</button>';
      const reloadButton = document.getElementById('btn-reload-game');
      if (reloadButton) reloadButton.onclick = () => window.location.reload();
    }
  });

})();
