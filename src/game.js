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
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const freq = Math.max(400, 2200 - dist * 100);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain); this.connect(gain);
      osc.start(now); osc.stop(now + 0.08);
    }

    playFlamethrowerWhoosh(x = null, z = null) {
      if (!this.initialized || this.isMuted) return;
      this.resume();
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.linearRampToValueAtTime(250, now + 0.4);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      noise.connect(filter); filter.connect(gain);
      this.connect(gain, x, z, 68);
      noise.start(now);
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
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain); this.connect(gain, x, z, 72);
      osc.start(now); osc.stop(now + 0.12);
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
  }

  const audioManager = new AudioManager();

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
      this.reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
      dirLight.shadow.mapSize.set(1024, 1024);
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

      this.camera.lookAt(x, isRTS ? 0 : 1.2, z);
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
      if (modeChanged) audioManager.playHeartbeat();
    }
    updateUI() {
      if (this.overlayElement) this.overlayElement.className = `vision-${this.currentMode}`;
      document.querySelectorAll('.vis-btn').forEach((btn) => {
        const isActive = btn.id === `btn-vis-${this.currentMode}`;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', String(isActive));
      });
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
      this.level = Math.max(0, Math.min(5, level));
      this.updateUI();
      if (this.level >= 3) audioManager.playAlarmSiren();
    }
    updateUI() {
      if (!this.alertTextElement) return;
      this.alertTextElement.textContent = this.levelNames[this.level];
      this.alertTextElement.className = `alert-level level-${this.level}`;
    }
  }

  const alarmSystem = new AlarmSystem();

  // -------------------------------------------------------------
  // 6. PHEROMONE SYSTEM
  // -------------------------------------------------------------
  class PheromoneSystem {
    constructor() {
      this.activeCommand = 'HUNT';
      this.commandZones = [];
      this.possessionMode = false;
    }
    init() {
      const buttons = document.querySelectorAll('.rts-cmd-btn:not(.possess-btn)');
      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          this.setCommand(btn.getAttribute('data-cmd'));
        });
      });
      const possessBtn = document.getElementById('btn-possess-mode');
      if (possessBtn) {
        possessBtn.addEventListener('click', () => this.togglePossessionMode());
      }
      this.updateUI();
    }
    setCommand(cmd) {
      if (!['HUNT', 'CAPTURE', 'DEFEND', 'INFEST'].includes(cmd)) return;
      this.activeCommand = cmd;
      this.possessionMode = false;
      this.updateUI();
      audioManager.playHeartbeat();
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
    reset() {
      this.clearZones();
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

      addWall(0, -75, 150, 12, 2);
      addWall(0, 75, 150, 12, 2);
      addWall(-75, 0, 2, 12, 150);
      addWall(75, 0, 2, 12, 150);

      addProp(0, -15, 6, 8, 6, 0x0ea5e9, 0x0284c7, 'generator');

      addWall(-30, -30, 35, 10, 2);
      addWall(-47, -15, 2, 10, 32);
      addProp(-35, -45, 3, 4, 3, 0x10b981, 0x047857, 'console');

      addWall(30, -30, 35, 10, 2);
      addWall(47, -15, 2, 10, 32);
      addProp(35, -45, 4, 2, 6, 0xe2e8f0, 0x94a3b8, 'console');

      addWall(35, 35, 30, 10, 2);
      addProp(45, 45, 10, 4, 10, 0x581c87, 0x7e22ce, 'generator');

      addWall(-35, 35, 30, 10, 2);
      addProp(-45, 45, 8, 8, 8, 0xf59e0b, 0xd97706, 'crate');

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
      addProp(-18, 58, 3, 4, 3, 0x334155, 0x0284c7, 'console');
      addProp(61, 12, 3, 7, 3, 0x334155, 0x000000, 'vent');
      addProp(-61, -12, 3, 7, 3, 0x334155, 0x000000, 'vent');
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

    hasLineOfSight(startX, startZ, endX, endZ, padding = 0.08) {
      return !this.colliders.some((collider) => (
        this.segmentIntersectsCollider(startX, startZ, endX, endZ, collider, padding)
      ));
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
      const pulseScale = 1 + Math.sin(phase * 1.7) * 0.025 * pulse;
      model.scale.copy(basePose.scale).multiplyScalar(pulseScale);
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
    }

    getAdultProfile() {
      return ADULT_CASTE_PROFILES[this.adultCaste] || ADULT_CASTE_PROFILES.drone;
    }

    setAdultCaste(caste, restoreHealth = true) {
      this.adultCaste = ADULT_CASTE_PROFILES[caste] ? caste : 'drone';
      const profile = this.getAdultProfile();
      this.maxHealth = profile.maxHealth;
      this.speed = profile.speed;
      if (restoreHealth) this.health = this.maxHealth;
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
      this.health = Math.max(0, this.health - Math.max(0, amount));
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
        const movementStep = Math.min(this.speed * frameScale, remainingDistance);
        const nextX = this.x + dx * movementStep;
        const nextZ = this.z + dy * movementStep;

        if (!stationMap.checkCollision(nextX, nextZ)) {
          this.x = nextX;
          this.z = nextZ;
          this.mesh.position.set(this.x, 0, this.z);
        } else if (this.moveTarget) {
          this.moveTarget = null;
          this.moveWaypoints = [];
        }

        if (dx !== 0 || dy !== 0) {
          this.mesh.rotation.y = Math.atan2(dx, dy);
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
        : (['android', 'synthetic'].includes(type) ? 190 : (['smartgunner', 'gyro', 'commando'].includes(type) ? 140 : 110));
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
      this.hostEligibility = ['android', 'synthetic', 'powerloader', 'exosuit', 'turret'].includes(type)
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
      this.footstepCooldown = 0;
      this.infectionCoughCooldown = 1.2 + Math.random() * 1.5;
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

    destroy() {
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

    takeDamage(dmg) {
      if (this.isCocooned || this.isIncapacitated) return false;
      let appliedDamage = Math.max(0, dmg);

      // MANTIS-4 reste un adversaire mécanique : conduites, blindage puis châssis exposé.
      if (this.bossId === 'MANTIS_4' && this.bossPhase === 1) {
        this.bossShield = Math.max(0, this.bossShield - appliedDamage);
        window.HiveSystems?.vfx?.burst(this.x, this.z, 0x38bdf8, 13, 0.1, 1.8);
        if (this.bossShield > 0) return true;
        this.bossPhase = 2;
        this.bossShield = 0;
        window.gameInstance?.currentStage?.onMantisPhaseChange?.(this, 2);
        return true;
      }
      if (this.bossId === 'MANTIS_4' && this.bossPhase === 2) {
        appliedDamage *= 0.55;
      }

      this.hp = Math.max(0, this.hp - appliedDamage);
      if (this.bossId === 'MANTIS_4' && this.bossPhase === 2 && this.hp <= this.maxHp * 0.5) {
        this.bossPhase = 3;
        window.gameInstance?.currentStage?.onMantisPhaseChange?.(this, 3);
      }
      const primary = this.getPrimaryMesh();
      if (primary && !Array.isArray(primary.material) && primary.material.emissive) {
        primary.material.emissive = new THREE.Color(0xef4444);
        setTimeout(() => {
          const currentPrimary = this.getPrimaryMesh();
          if (currentPrimary && !Array.isArray(currentPrimary.material) && currentPrimary.material.emissive) {
            currentPrimary.material.emissive = new THREE.Color(0x000000);
          }
        }, 150);
      }
      window.HiveSystems?.vfx?.burst(this.x, this.z, this.type === 'synthetic' ? 0xe2e8f0 : 0xef4444, 9, 0.1, 1.2);
      if (this.hp <= 0) {
        this.incapacitate();
      }
      return true;
    }

    incapacitate() {
      if (this.isIncapacitated) return;
      this.isIncapacitated = true;
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
        'commando', 'android', 'synthetic', 'powerloader', 'exosuit'
      ].includes(this.type);
      const currentStageIndex = window.gameInstance?.currentStageIndex || 0;
      const currentStageStep = window.gameInstance?.currentStage?.step;
      const biologicalTargetDetectable = currentStageIndex !== 3 ||
        currentStageStep === 'HUNT_FAUNA' ||
        currentStageStep === 'CHRYSALIS';

      this.motionPingCooldown -= safeDelta;
      if (biologicalTargetDetectable && distToPlayer < 20 && this.motionPingCooldown <= 0) {
        if (this.type !== 'scientist') audioManager.playMotionTrackerPing(distToPlayer);
        this.motionPingCooldown = 1.0 + Math.random() * 1.5;
      }

      // Lures have narrative priority. Otherwise armed humans investigate and
      // pursue a detected biological target while civilians keep patrolling.
      if (!this.isLured && isCombatant && biologicalTargetDetectable && distToPlayer <= 26) {
        this.aiState = hasLineOfSight && distToPlayer <= 12 ? 'ATTACK' : 'CHASE';
        this.targetPos = { x: combatTarget.x, z: combatTarget.z };
      } else if (!this.isLured && (this.aiState === 'CHASE' || this.aiState === 'ATTACK')) {
        this.choosePatrolWaypoint();
      }

      this.shootCooldown -= safeDelta;
      if (
        isCombatant &&
        biologicalTargetDetectable &&
        distToPlayer < 14 &&
        hasLineOfSight &&
        this.shootCooldown <= 0
      ) {
          const applyWeaponDamage = () => {
            const stageIndex = window.gameInstance?.currentStageIndex;
            if ([2, 3, 4].includes(stageIndex)) {
              const baseDamage = ['powerloader', 'exosuit'].includes(this.type)
                ? 18
                : (['cleaner', 'incinerator'].includes(this.type)
                  ? 12
                  : (stageIndex === 4 ? 8 : 6));
              const targetReceiver = combatTarget?.takeDamage ? combatTarget : playerCreature;
              targetReceiver.takeDamage(baseDamage * window.gameInstance.getDifficultyDamageModifier());
            } else if (window.gameInstance?.currentStageIndex === 5 && combatTarget?.takeDamage) {
              const baseDamage = ['powerloader', 'exosuit'].includes(this.type) ? 25 : 11;
              combatTarget.takeDamage(baseDamage * window.gameInstance.getDifficultyDamageModifier());
            }
          };
          this.shootCooldown = ['cleaner', 'incinerator'].includes(this.type)
            ? 2.4
            : (['powerloader', 'exosuit'].includes(this.type) ? 1.9 : 1.6);
          this.attackAnimation = 1;
          if (['cleaner', 'incinerator'].includes(this.type)) {
            audioManager.playFlamethrowerWhoosh(this.x, this.z);
            window.HiveSystems?.vfx?.muzzleFlash(this.x, 2.7, this.z, 0xff8a16, 0.25);
            window.HiveSystems?.vfx?.flameJet(
              this.x,
              2.65,
              this.z,
              combatTarget.x,
              combatTarget.caste === 'queen' ? 3.5 : 1.5,
              combatTarget.z
            );
            applyWeaponDamage();
          } else {
            audioManager.playPulseRifleFire(this.x, this.z);
            const projectileColor = this.bossId === 'MANTIS_4'
              ? (this.bossPhase >= 3 ? 0xef4444 : 0x38bdf8)
              : 0xfbbf24;
            window.HiveSystems?.vfx?.muzzleFlash(this.x, 2.75, this.z, projectileColor, 0.18);
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
        praetorian: { hp: 460, speed: 0.28, damage: 85, range: 2.2 },
        warrior: { hp: 230, speed: 0.37, damage: 48, range: 1.8 },
        runner: { hp: 145, speed: 0.54, damage: 32, range: 1.8 },
        worker: { hp: 120, speed: 0.34, damage: 14, range: 1.6 },
        spitter: { hp: 150, speed: 0.31, damage: 36, range: 13 },
        drone: { hp: 190, speed: 0.4, damage: 42, range: 1.8 }
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
      let geo = new THREE.SphereGeometry(this.caste === 'queen' ? 2.5 : (this.caste === 'praetorian' ? 1.6 : 1.0), 12, 12);
      let color = 0x0f172a;
      if (this.caste === 'runner') color = 0x7c2d12;
      if (this.caste === 'warrior') color = 0x1e1b4b;
      if (this.caste === 'worker') color = 0x14532d;
      if (this.caste === 'spitter') color = 0x365314;
      if (this.caste === 'praetorian') color = 0x581c87;
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
      this.hp = Math.max(0, this.hp - Math.max(0, amount));
      window.HiveSystems?.vfx?.burst(this.x, this.z, 0x39ff14, 8, 0.09, this.caste === 'queen' ? 2.8 : 1.2);
      if (this.caste === 'queen') {
        setHudBar('vital', 'INTÉGRITÉ REINE', (this.hp / this.maxHp) * 100);
      }
      if (this.hp > 0) return;
      if (this.caste === 'queen' && window.gameInstance) {
        window.gameInstance.showEndModal(
          'LIGNÉE ROYALE ÉTEINTE',
          'La dernière Reine a été détruite avant la sécurisation de MNEMOSYNE.'
        );
      }
      this.destroy();
    }

    moveDirect(dx, dy, deltaSeconds = 1 / 60, maxDistance = Infinity, speedMultiplier = 1) {
      if (!this.mesh || this.caste === 'queen' || this.isDestroyed) return false;
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
      const movementStep = Math.min(this.speed * Math.max(0, speedMultiplier) * frameScale, maxDistance);
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
        this.animationPhase += Math.max(0, deltaSeconds) * (this.caste === 'runner' ? 13 : 8);
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

      if (this.caste === 'queen') {
        const nearbyThreat = humans.find((human) => (
          !human.isCocooned &&
          !human.isIncapacitated &&
          Math.hypot(human.x - this.x, human.z - this.z) <= this.attackRange
        ));
        if (nearbyThreat && this.attackCooldown <= 0) {
          this.attackCooldown = 1.35;
          this.attackAnimation = 1;
          nearbyThreat.takeDamage(this.damage);
          audioManager.playWetImpact?.(nearbyThreat.x, nearbyThreat.z);
          window.HiveSystems?.vfx?.organicTrail(
            this.x,
            3.3,
            this.z,
            nearbyThreat.x,
            1.2,
            nearbyThreat.z,
            0xa855f7
          );
          window.HiveSystems?.vfx?.burst(nearbyThreat.x, nearbyThreat.z, 0xa855f7, 14, 0.12, 1.4);
        }
        animateProceduralModel(this.mesh, {
          phase: this.animationPhase += Math.max(0, deltaSeconds) * 2.2,
          attack: this.attackAnimation,
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
        if (activeZone.command === 'HUNT') {
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
        const isAttackOrder = activeZone.command === 'HUNT' || activeZone.command === 'DEFEND';
        const stopRadius = target.human && isAttackOrder
          ? this.attackRange
          : (activeZone.command === 'DEFEND' ? 4 : (activeZone.command === 'CAPTURE' ? 1.5 : 2));
        if (dist > stopRadius) {
          const speedMultiplier = activeZone.command === 'HUNT' ? 1.15 : (activeZone.command === 'DEFEND' ? 0.75 : 1);
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
              this.attackCooldown = this.caste === 'runner' ? 0.62 : (this.caste === 'spitter' ? 1.45 : 0.86);
              this.attackAnimation = 1;
              const color = this.caste === 'spitter' ? 0xa3e635 : 0x39ff14;
              if (this.caste === 'spitter') {
                const applyAcidHit = () => {
                  target.human?.takeDamage(this.damage);
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
                target.human.takeDamage(this.damage);
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
      this.isCompleted = true;
      window.HiveSystems?.updateObjective(2, 2);
      window.HiveSystems?.narrative('PALIMPSESTE', 'Organisme implanté. Les protocoles humains passent en quarantaine totale.');
      if (window.gameInstance) window.gameInstance.advanceStage(this);
      audioManager.playAcidSizzle();
    }

    handleKeyDown(key) {
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
        instructions.innerHTML = '<strong>Cocon de mue :</strong><br><br>• Attendez la fin de la métamorphose.';
        actionsContainer.innerHTML = `<button type="button" id="btn-emerge-drone" class="act-btn" ${!isMature ? 'disabled' : ''} style="border-color: #39ff14;">${isMature ? `ÉMERGER EN ${adultLabel} ADULTE [ESPACE]` : `MATURATION ${adultLabel}... (${Math.round(this.chrysalisTimer)}%)`}</button>`;
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
      window.HiveSystems?.vfx?.transformation();
      if (window.gameInstance) window.gameInstance.advanceStage(this);
      audioManager.playXenoRoar();
    }
    handleKeyDown(key) {
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
          new HumanAI(94, 'labhound', 36, -22, 'Animal de service Q-4')
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
    }

    updateHUD() {
      const profile = playerCreature.getAdultProfile();
      const adultLabel = profile.label;
      const casteActions = {
        drone: { jaw: 'MÂCHOIRE INTERNE', tail: 'FRAPPE DE QUEUE' },
        runner: { jaw: 'MORSURE À L’ÉLAN', tail: 'FOUET DE QUEUE' },
        warrior: { jaw: 'BRISE-BLINDAGE', tail: 'BALAYAGE LOURD' }
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
        : `<strong>Prédateur ${adultLabel} :</strong><br><br>• ${profile.huntAction} consomme ${profile.huntCost} points de chasse.<br>• Les attaques rapprochées varient selon la morphologie adulte.<br>• Les synthétiques ne sont pas des hôtes.<br>• Coconisez deux cibles viables ; l’une sera consommée par le cycle royal.`;
      const actionsContainer = document.getElementById('action-buttons-container');
      actionsContainer.innerHTML = `
        <button type="button" id="btn-drone-ambush" class="act-btn">1. ${profile.huntAction} [1 / E]</button>
        <button type="button" id="btn-inner-jaw" class="act-btn">2. ${actionLabels.jaw} [2 / R]</button>
        <button type="button" id="btn-tail-impale" class="act-btn">3. ${actionLabels.tail} [3 / T]</button>
        <button type="button" id="btn-cocoon-host" class="act-btn">4. COCOONISER UNE CIBLE [4 / F]</button>
        <button type="button" id="btn-found-queen-hive" class="act-btn" style="border-color: #9d4edd; background: rgba(157,78,221,0.22);">ÉTABLIR LA NURSERIE ROYALE</button>
      `;

      document.getElementById('btn-drone-ambush').onclick = () => this.executeAmbush();
      document.getElementById('btn-inner-jaw').onclick = () => this.executeInnerJaw();
      document.getElementById('btn-tail-impale').onclick = () => this.executeTailImpale();
      document.getElementById('btn-cocoon-host').onclick = () => this.executeCocoonHost();
      document.getElementById('btn-found-queen-hive').onclick = () => this.foundRoyalNursery();
      this.updateRoyalButton();
    }

    handleKeyDown(key) {
      if (key === '1' || key === 'e') this.executeAmbush();
      if (key === '2' || key === 'r') this.executeInnerJaw();
      if (key === '3' || key === 't') this.executeTailImpale();
      if (key === '4' || key === 'f') this.executeCocoonHost();
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

    executeInnerJaw() {
      if (!this.canUseAbility('jaw', 620)) return;
      const profile = playerCreature.getAdultProfile();
      const { human: target, distance } = this.findClosestHuman((human) => !human.isCocooned && !human.isIncapacitated);
      if (!target || distance > 4.3) {
        this.log('[MÂCHOIRE] Cible hors de portée. Utilisez une embuscade ou approchez-vous.');
        return;
      }
      playerCreature.triggerAttack('inner-jaw');
      target.takeDamage(profile.jawDamage);
      audioManager.playBoneCrunch();
      audioManager.playWetImpact?.(target.x, target.z);
      window.HiveSystems?.vfx?.organicTrail(
        playerCreature.x,
        2.6,
        playerCreature.z,
        target.x,
        1.7,
        target.z,
        0x39ff14
      );
      window.HiveSystems?.vfx?.burst(target.x, target.z, 0x39ff14, 12, 0.1, 1.7);
      this.log(`[MÂCHOIRE INTERNE] Impact sur ${target.name} — ${Math.max(0, target.hp)} PV.`);
      this.updateRoyalButton();
    }

    executeTailImpale() {
      if (!this.canUseAbility('tail', 720)) return;
      const profile = playerCreature.getAdultProfile();
      const { human: target, distance } = this.findClosestHuman((human) => !human.isCocooned && !human.isIncapacitated);
      if (!target || distance > 7) {
        this.log('[QUEUE] Cible hors de portée.');
        return;
      }
      playerCreature.triggerAttack('tail');
      target.takeDamage(profile.tailDamage);
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
      window.HiveSystems?.vfx?.burst(target.x, target.z, 0xa855f7, 14, 0.1, 1.2);
      this.log(`[FRAPPE DE QUEUE] ${target.name} touché — ${Math.max(0, target.hp)} PV.`);
      this.updateRoyalButton();
    }

    executeCocoonHost() {
      if (!this.canUseAbility('cocoon', 520)) return;
      const { human: target, distance } = this.findClosestHuman((human) => (
        human.isIncapacitated &&
        !human.isCocooned &&
        human.hostEligibility !== 'none'
      ));

      if (target && distance < 6) {
        if (!target.cocoonInResin()) return;
        this.capturedHosts++;
        document.getElementById('hive-hosts').textContent = this.capturedHosts;
        resinGrid.addResinPatch(target.x, target.z);
        playerCreature.triggerAttack('cocoon');
        audioManager.playCocoonWeave?.(target.x, target.z);
        window.HiveSystems?.vfx?.ring(target.x, target.z, 0xa855f7, 3);
        window.HiveSystems?.vfx?.burst(target.x, target.z, 0x9d4edd, 22, 0.08, 1.5);
        this.log(`[NURSERIE] ${target.name} sécurisé dans la résine (${this.capturedHosts}/2).`);
        window.HiveSystems?.updateObjective(4, Math.min(2, this.capturedHosts), 'Neutraliser les menaces puis engager un véritable cycle royal.');
        this.updateRoyalButton();
      } else if (target) {
        this.log('[NURSERIE] Cible trop éloignée : approchez-vous à moins de 6 m.');
      } else {
        this.log('[NURSERIE] Aucun hôte viable neutralisé à proximité.');
      }
    }

    foundRoyalNursery() {
      if (this.isCompleted || this.royalCycle?.isActive) return;
      if (!this.canFoundHive()) {
        showToast('Neutralisez les menaces et sécurisez deux hôtes viables.');
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
        duration: 22,
        maxIntegrity: 260,
        states: ['QUEENBURSTER', 'MUE ROYALE', 'DÉFENSE DE LA MUE'],
        onStateChange: (cycle) => {
          this.log(`[CYCLE ROYAL] Étape visible : ${cycle.state}.`);
          window.HiveSystems?.vfx?.ring(cycle.x, cycle.z, cycle.state.includes('DÉFENSE') ? 0xef4444 : 0xa855f7, 4);
          this.updateHUD();
        },
        canComplete: () => this.getActiveThreats().length === 0,
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
      return (
        this.capturedHosts >= 2 &&
        this.getActiveThreats().length === 0 &&
        !this.royalCycle?.isActive
      );
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
      const wave = [
        new HumanAI(151, 'commando', -48, 42, 'Commando KAPPA Ilya Moor'),
        new HumanAI(152, 'incinerator', 46, -40, 'Opératrice thermique KAPPA Veda Sol')
      ];
      wave.forEach((enemy) => {
        enemy.createMesh();
        enemy.lureTowards(this.royalCycle.x, this.royalCycle.z);
      });
      window.gameInstance.humans.push(...wave);
      this.log('[DÉFENSE] Une vague KAPPA vise directement la forme royale.');
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
      appendSensorLog('[CYCLE ROYAL] Queenburster et mue royale ont survécu. La Reine reste liée à son ovipositeur.', 'bio');
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
        button.textContent = `CYCLE ROYAL — ${this.royalCycle.state} ${Math.floor(this.royalCycle.progress)}% · ${threatStatus}`;
        return;
      }
      button.disabled = !this.canFoundHive();
      button.textContent = `ÉTABLIR LA NURSERIE — HÔTES ${this.capturedHosts}/2 · ${threatStatus}`;
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
      if (this.royalCycle?.isActive) {
        setHudBar(
          'sec',
          `CYCLE ROYAL — ${this.royalCycle.state}`,
          (this.royalCycle.integrity / this.royalCycle.maxIntegrity) * 100,
          `${Math.ceil(this.royalCycle.integrity)}/${this.royalCycle.maxIntegrity}`
        );
      }
      this.updateRoyalButton();
    }

    destroy() {
      this.royalCycle?.destroy();
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
          new HumanAI(206, 'exosuit', 22, -42, 'MANTIS-4 — exosquelette KAPPA')
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
      document.getElementById('bio-title').textContent = 'RÉSEAU SYNAPTIQUE — REINE LIÉE À L’OVIPOSITEUR';
      document.getElementById('stage-instructions').innerHTML = '<strong>Commandement :</strong><br><br>• Q/W/E/R sélectionnent chasse, capture, défense et infestation.<br>• La Reine doit rester attachée à l’ovipositeur pour lancer un cycle.<br>• Drone, Runner et Warrior exigent un hôte biologiquement compatible.<br>• Worker, Spitter et Praetorian proviennent d’une spécialisation/mue d’un adulte existant.<br>• Chaque cycle est visible, attaquable et peut échouer.<br>• P active la synchronisation synaptique directe.';
      setHudBar('vital', 'INTÉGRITÉ REINE', 100);
      const actionsContainer = document.getElementById('action-buttons-container');
      actionsContainer.innerHTML = `
        <button type="button" id="btn-spawn-drone" class="act-btn">CYCLE DRONE — HÔTE HUMANOÏDE STANDARD (30 Bio)</button>
        <button type="button" id="btn-spawn-runner" class="act-btn">CYCLE RUNNER — HÔTE QUADRUPÈDE (30 Bio)</button>
        <button type="button" id="btn-spawn-warrior" class="act-btn">CYCLE WARRIOR — HÔTE COMMANDO/BLINDÉ (45 Bio)</button>
        <button type="button" id="btn-spawn-worker" class="act-btn">SPÉCIALISER UN DRONE EN WORKER (25 Bio)</button>
        <button type="button" id="btn-spawn-spitter" class="act-btn">SPÉCIALISER UN DRONE EN SPITTER (50 Bio)</button>
        <button type="button" id="btn-spawn-praetorian" class="act-btn">MUE D’UN WARRIOR EN PRAETORIAN (80 Bio)</button>
        <button type="button" id="btn-final-conquest" class="act-btn" disabled style="border-color: #39ff14; background: rgba(57,255,20,0.24);">ISOLER PALIMPSESTE ET CHOISIR UNE FIN</button>
      `;

      document.getElementById('btn-spawn-drone').onclick = () => this.spawnUnit('drone', 30);
      document.getElementById('btn-spawn-worker').onclick = () => this.spawnUnit('worker', 25);
      document.getElementById('btn-spawn-runner').onclick = () => this.spawnUnit('runner', 30);
      document.getElementById('btn-spawn-warrior').onclick = () => this.spawnUnit('warrior', 45);
      document.getElementById('btn-spawn-spitter').onclick = () => this.spawnUnit('spitter', 50);
      document.getElementById('btn-spawn-praetorian').onclick = () => this.spawnUnit('praetorian', 80);
      document.getElementById('btn-final-conquest').onclick = () => this.completeConquest();
      const expandedLore = window.gameInstance?.campaignConfig?.expandedLore !== false;
      document.getElementById('btn-spawn-spitter').hidden = !expandedLore;
      document.getElementById('btn-spawn-praetorian').hidden = !expandedLore;
    }

    isArmoredHost(host) {
      return ['commando', 'smartgunner', 'gyro', 'marine'].includes(host?.type);
    }

    findCompatibleHost(caste) {
      return (window.gameInstance?.humans || []).find((host) => {
        if (!host.isCocooned || host.usedAsHost || host.hostEligibility !== 'viable') return false;
        if (caste === 'runner') return host.type === 'labhound';
        if (caste === 'warrior') return this.isArmoredHost(host);
        if (caste === 'drone') return host.type !== 'labhound' && !this.isArmoredHost(host);
        return false;
      }) || null;
    }

    findSpecializationPrecursor(caste) {
      const precursorCaste = caste === 'praetorian' ? 'warrior' : 'drone';
      return this.rtsUnits.find((unit) => (
        !unit.isDestroyed &&
        unit.caste === precursorCaste
      )) || null;
    }

    canBeginCycle(caste, cost) {
      if (
        this.biomass < cost ||
        this.queen?.isDestroyed ||
        !this.queen?.attachedToOvipositor ||
        this.incubationCycles.filter((cycle) => cycle.isActive).length >= 3
      ) return false;
      if (['drone', 'runner', 'warrior'].includes(caste)) return Boolean(this.findCompatibleHost(caste));
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

      const usesHost = ['drone', 'runner', 'warrior'].includes(caste);
      const host = usesHost ? this.findCompatibleHost(caste) : null;
      const precursor = usesHost ? null : this.findSpecializationPrecursor(caste);
      if (usesHost && !host) {
        const requirement = caste === 'runner'
          ? 'un quadrupède'
          : (caste === 'warrior' ? 'un commando ou soldat blindé' : 'un humanoïde standard');
        showToast(`Cycle ${caste.toUpperCase()} impossible : ${requirement} cocoonisé est requis.`);
        return;
      }
      if (!usesHost && !precursor) {
        const requiredCaste = caste === 'praetorian' ? 'WARRIOR' : 'DRONE';
        showToast(`Spécialisation impossible : aucun ${requiredCaste} mature disponible.`);
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
        states = ['OVOMORPHE', 'FACEHUGGER', 'IMPLANTATION', 'CHESTBURSTER', 'MUE ADULTE'];
        this.log(`[CYCLE ${caste.toUpperCase()}] Ovomorphe pondu ; ${host.name} est réservé et consommé.`);
      } else {
        originX = precursor.x;
        originZ = precursor.z;
        sourceName = `${precursor.caste.toUpperCase()} #${precursor.id}`;
        precursor.destroy();
        states = ['COCON DE SPÉCIALISATION', 'RESTRUCTURATION', 'MUE ADULTE'];
        this.log(`[SPÉCIALISATION ${caste.toUpperCase()}] ${sourceName} entre dans une mue irréversible.`);
      }

      const durations = { drone: 14, runner: 12, warrior: 17, worker: 10, spitter: 14, praetorian: 20 };
      const cycle = new BiologicalCycleEntity({
        id: `cycle-${Date.now()}-${this.incubationCycles.length}`,
        x: originX,
        z: originZ,
        caste,
        hostName: sourceName,
        duration: durations[caste] || 14,
        maxIntegrity: caste === 'praetorian' ? 240 : (caste === 'warrior' ? 190 : 150),
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
          window.HiveSystems?.vfx?.burst(spawn.x, spawn.z, 0x39ff14, 22, 0.12, 1.4);
          this.log(`[NAISSANCE] ${caste.toUpperCase()} mature ; le cycle exposé a survécu.`);
        },
        onFail: (failedCycle) => {
          this.log(`[ÉCHEC BIOLOGIQUE] ${caste.toUpperCase()} détruit pendant ${failedCycle.state}. Hôte ou précurseur perdu.`);
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
      const conquestButton = document.getElementById('btn-final-conquest');
      if (droneButton) droneButton.disabled = !this.canBeginCycle('drone', 30);
      if (workerButton) workerButton.disabled = !this.canBeginCycle('worker', 25);
      if (runnerButton) runnerButton.disabled = !this.canBeginCycle('runner', 30);
      if (warriorButton) warriorButton.disabled = !this.canBeginCycle('warrior', 45);
      if (spitterButton) spitterButton.disabled = !this.canBeginCycle('spitter', 50);
      if (praetorianButton) praetorianButton.disabled = !this.canBeginCycle('praetorian', 80);
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
      const commandByKey = { q: 'HUNT', w: 'CAPTURE', e: 'DEFEND', r: 'INFEST' };
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
        let closestUnit = null;
        let closestDistance = Infinity;
        for (const unit of this.rtsUnits) {
          if (unit.caste === 'queen' || unit.isDestroyed) continue;
          const distance = Math.hypot(unit.x - worldPoint.x, unit.z - worldPoint.z);
          if (distance < closestDistance) {
            closestUnit = unit;
            closestDistance = distance;
          }
        }
        if (closestUnit && closestDistance <= 8) {
          this.possessedUnit = closestUnit;
          this.possessedMoveTarget = null;
          this.log(`[SYNAPSE] Contrôle direct du ${closestUnit.caste.toUpperCase()} #${closestUnit.id}.`);
          showToast('Contrôle synaptique actif : déplacement ZQSD / flèches.');
        } else if (this.possessedUnit) {
          this.possessedMoveTarget = worldPoint;
          showToast('Destination de l\'unité synchronisée mise à jour.');
        } else {
          showToast('Aucune unité à proximité du point sélectionné.');
        }
        return;
      }

      const colors = { HUNT: 0xef4444, CAPTURE: 0xa855f7, DEFEND: 0x38bdf8, INFEST: 0x39ff14 };
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
          if (worldPoint) playerCreature.setMoveTarget(worldPoint.x, worldPoint.z);
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
      const visionByKey = { f1: 'normal', f2: 'thermal', f3: 'acoustic' };
      if (visionByKey[key]) {
        visionSystem.setMode(visionByKey[key]);
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
