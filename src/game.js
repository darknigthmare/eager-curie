/* HIVE ASCENSION - Real Enemy HP Combat, Acid Spit & Tail Impale Attacks, Bulletproof Stage 5 Transition */

(function () {
  'use strict';

  // -------------------------------------------------------------
  // 1. AUDIO MANAGER
  // -------------------------------------------------------------
  class AudioManager {
    constructor() {
      this.ctx = null;
      this.isMuted = false;
      this.initialized = false;
    }

    init() {
      if (this.initialized) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
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
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(now); osc.stop(now + 0.08);
    }

    playFlamethrowerWhoosh() {
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
      gain.connect(this.ctx.destination);
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
      osc.connect(gain); gain.connect(this.ctx.destination);
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
      osc.connect(gain); gain.connect(this.ctx.destination);
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
      gain.connect(this.ctx.destination);
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
      osc.connect(gain); gain.connect(this.ctx.destination);
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
      osc.connect(gain); gain.connect(this.ctx.destination);
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
      gain.connect(this.ctx.destination);
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
      gain.connect(this.ctx.destination);
      noise.start(now);
    }

    playPulseRifleFire() {
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
      osc.connect(gain); gain.connect(this.ctx.destination);
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
      gain.connect(this.ctx.destination);
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
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(now); osc.stop(now + 0.8);
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
      this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
      this.camera.position.set(0, 38, 32);
      this.camera.lookAt(0, 0, 0);

      this.renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        powerPreference: "high-performance"
      });
      this.renderer.setSize(this.width, this.height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const ambient = new THREE.AmbientLight(0x1e293b, 1.4);
      this.scene.add(ambient);

      const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
      dirLight.position.set(30, 60, 30);
      this.scene.add(dirLight);

      const redEmergency = new THREE.PointLight(0xff0055, 3.5, 50);
      redEmergency.position.set(-20, 10, -25);
      this.scene.add(redEmergency);

      const bioGreen = new THREE.PointLight(0x39ff14, 2.8, 40);
      bioGreen.position.set(15, 8, 10);
      this.scene.add(bioGreen);

      this.lights = { ambient, dirLight, redEmergency, bioGreen };

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
      const targetY = isRTS ? 60 : 32 + heightOffset;
      const targetZ = isRTS ? z + 45 : z + 24;
      const smoothing = 1 - Math.pow(0.92, Math.max(0, deltaSeconds) * 60);

      this.camera.position.x += (x - this.camera.position.x) * smoothing;
      this.camera.position.z += (targetZ - this.camera.position.z) * smoothing;
      this.camera.position.y += (targetY - this.camera.position.y) * smoothing;

      this.camera.lookAt(x, 0, z);
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
  }

  const pheromoneSystem = new PheromoneSystem();

  // -------------------------------------------------------------
  // 7. ENVIRONMENT: MULTI-DECK ACHERON-9 MAP & ELEVATORS
  // -------------------------------------------------------------
  class StationMap {
    constructor() {
      this.currentDeck = 'A';
      this.walls = [];
      this.colliders = [];
    }

    buildMap() {
      const floorTex = rendererEngine.createTileTexture('floor');
      floorTex.repeat.set(16, 16);
      const wallTex = rendererEngine.createTileTexture('wall');

      const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.3, metalness: 0.7 });
      const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.4, metalness: 0.8 });

      const floorGeo = new THREE.PlaneGeometry(160, 160);
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.rotation.x = -Math.PI / 2;
      rendererEngine.mapGroup.add(floorMesh);

      const addWall = (x, z, width, height, depth) => {
        const wallGeo = new THREE.BoxGeometry(width, height, depth);
        const wallMesh = new THREE.Mesh(wallGeo, wallMat);
        wallMesh.position.set(x, height / 2, z);
        rendererEngine.mapGroup.add(wallMesh);
        this.walls.push(wallMesh);
        this.colliders.push({
          minX: x - width / 2 - 0.6,
          maxX: x + width / 2 + 0.6,
          minZ: z - depth / 2 - 0.6,
          maxZ: z + depth / 2 + 0.6
        });
      };

      const addProp = (x, z, w, h, d, color = 0x38bdf8, emissive = 0x0284c7) => {
        const geo = new THREE.BoxGeometry(w, h, d);
        const mat = new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: 0.5, roughness: 0.2 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, h / 2, z);
        rendererEngine.propsGroup.add(mesh);
        this.colliders.push({
          minX: x - w / 2 - 0.6,
          maxX: x + w / 2 + 0.6,
          minZ: z - d / 2 - 0.6,
          maxZ: z + d / 2 + 0.6
        });
      };

      addWall(0, -75, 150, 12, 2);
      addWall(0, 75, 150, 12, 2);
      addWall(-75, 0, 2, 12, 150);
      addWall(75, 0, 2, 12, 150);

      addProp(0, -15, 6, 8, 6, 0x0ea5e9, 0x0284c7);

      addWall(-30, -30, 35, 10, 2);
      addWall(-47, -15, 2, 10, 32);
      addProp(-35, -45, 3, 4, 3, 0x10b981, 0x047857);

      addWall(30, -30, 35, 10, 2);
      addWall(47, -15, 2, 10, 32);
      addProp(35, -45, 4, 2, 6, 0xe2e8f0, 0x94a3b8);

      addWall(35, 35, 30, 10, 2);
      addProp(45, 45, 10, 4, 10, 0x581c87, 0x7e22ce);

      addWall(-35, 35, 30, 10, 2);
      addProp(-45, 45, 8, 8, 8, 0xf59e0b, 0xd97706);
    }

    checkCollision(nextX, nextZ) {
      for (const col of this.colliders) {
        if (nextX > col.minX && nextX < col.maxX && nextZ > col.minZ && nextZ < col.maxZ) {
          return true;
        }
      }
      return false;
    }
  }

  const stationMap = new StationMap();

  class ResinGrid {
    constructor() { this.nodes = []; this.totalCoverage = 0; }
    init() {
      this.resinMat = new THREE.MeshStandardMaterial({
        color: 0x9d4edd, emissive: 0x5a189a, emissiveIntensity: 0.8, roughness: 0.2
      });
    }
    addResinPatch(x, z, radius = 6) {
      const overlapsExistingPatch = this.nodes.some((node) => Math.hypot(node.x - x, node.z - z) < Math.min(node.radius, radius) * 0.75);
      if (overlapsExistingPatch) return false;

      const geo = new THREE.CircleGeometry(radius, 16);
      const mesh = new THREE.Mesh(geo, this.resinMat.clone());
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, 0.05, z);
      rendererEngine.resinGroup.add(mesh);
      this.nodes.push({ x, z, radius, mesh });
      this.totalCoverage = Math.min(100, this.totalCoverage + 6);
      while (this.nodes.length > 16) {
        const expiredNode = this.nodes.shift();
        rendererEngine.removeObject(expiredNode.mesh);
      }
      const el = document.getElementById('hive-resin');
      if (el) el.textContent = `${this.totalCoverage}%`;
      return true;
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
  class PlayerCreature {
    constructor() {
      this.form = 'egg';
      this.x = -20;
      this.z = -35;
      this.speed = 0.25;
      this.mesh = null;
      this.eggIsOpen = false;
      this.isLeaping = false;
      this.isChrysalis = false;
      this.maxHealth = 100;
      this.health = 100;
      this.isDefeated = false;
      this.moveTarget = null;
    }

    clearMesh() {
      if (this.mesh) {
        rendererEngine.removeObject(this.mesh);
        this.mesh = null;
      }
    }

    createMesh() {
      this.clearMesh();
      const group = new THREE.Group();

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
      this.isChrysalis = false;
      this.health = this.maxHealth;
      this.isDefeated = false;
      this.moveTarget = null;
      if (form === 'facehugger') this.speed = 0.50;
      else if (form === 'chestburster') this.speed = 0.45;
      else if (form === 'drone') this.speed = 0.42;
      this.createMesh();
    }

    takeDamage(amount) {
      if (this.isDefeated || this.form !== 'drone') return;
      this.health = Math.max(0, this.health - Math.max(0, amount));
      setHudBar('vital', 'INTÉGRITÉ DU DRONE', this.health);
      if (this.health <= 0) {
        this.isDefeated = true;
        if (window.gameInstance) {
          window.gameInstance.showEndModal(
            'DRONE NEUTRALISÉ',
            'Les forces de sécurité ont contenu l\'infestation. Recommencez le cycle pour adapter votre stratégie.'
          );
        }
      }
    }

    setMoveTarget(x, z) {
      if (this.form === 'egg' || this.isLeaping || this.isChrysalis) return;
      this.moveTarget = { x, z };
    }

    setChrysalis(state) {
      this.isChrysalis = state;
      this.createMesh();
    }

    openEgg() {
      this.eggIsOpen = true;
      this.createMesh();
    }

    update(deltaSeconds = 1 / 60) {
      if (!this.mesh) return;
      if (this.form !== 'egg' && !this.isLeaping && !this.isChrysalis) {
        let { dx, dy } = inputManager.getMovementVector();
        let remainingDistance = Infinity;
        if (dx !== 0 || dy !== 0) {
          this.moveTarget = null;
        } else if (this.moveTarget) {
          const targetDistance = Math.hypot(this.moveTarget.x - this.x, this.moveTarget.z - this.z);
          if (targetDistance <= 0.5) {
            this.moveTarget = null;
          } else {
            remainingDistance = targetDistance;
            dx = (this.moveTarget.x - this.x) / targetDistance;
            dy = (this.moveTarget.z - this.z) / targetDistance;
          }
        }
        const frameScale = Math.max(0, deltaSeconds) * 60;
        const movementStep = Math.min(this.speed * frameScale, remainingDistance);
        const nextX = this.x + dx * movementStep;
        const nextZ = this.z + dy * movementStep;

        if (!stationMap.checkCollision(nextX, nextZ)) {
          this.x = nextX;
          this.z = nextZ;
          this.mesh.position.set(this.x, 0, this.z);
        } else if (this.moveTarget) {
          this.moveTarget = null;
        }

        if (dx !== 0 || dy !== 0) {
          this.mesh.rotation.y = Math.atan2(dx, dy);
        }
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
      this.hp = type === 'powerloader' ? 350 : 100;
      this.maxHp = this.hp;
      this.mesh = null;
      this.targetPos = { x, z };
      this.isLured = false;
      this.isBursting = false;
      this.isInfected = false;
      this.isCocooned = false;
      this.isIncapacitated = false;
      this.shootCooldown = 0;
      this.motionPingCooldown = 0.5 + Math.random();
    }

    createMesh() {
      const group = new THREE.Group();

      if (this.type === 'powerloader') {
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
        if (this.type === 'guard' || this.type === 'smartgunner') color = 0xf59e0b;
        if (this.type === 'android') color = 0xf8fafc;
        if (this.type === 'cleaner') color = 0xd97706;

        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4 });
        const mesh = new THREE.Mesh(bodyGeo, mat);
        mesh.position.y = 1.0;
        group.add(mesh);

        const headGeo = new THREE.SphereGeometry(0.4, 8, 8);
        const headMat = new THREE.MeshStandardMaterial({ color: this.type === 'android' ? 0xe2e8f0 : 0xfde047 });
        const headMesh = new THREE.Mesh(headGeo, headMat);
        headMesh.position.y = 2.2;
        group.add(headMesh);
      }

      group.position.set(this.x, 0, this.z);
      rendererEngine.scene.add(group);
      this.mesh = group;
    }

    destroy() {
      if (this.mesh) rendererEngine.removeObject(this.mesh);
      this.mesh = null;
    }

    takeDamage(dmg) {
      if (this.isCocooned || this.isIncapacitated) return false;
      this.hp = Math.max(0, this.hp - Math.max(0, dmg));
      if (this.mesh && this.mesh.children[0]) {
        this.mesh.children[0].material.emissive = new THREE.Color(0xef4444);
        setTimeout(() => {
          if (this.mesh && this.mesh.children[0]) this.mesh.children[0].material.emissive = new THREE.Color(0x000000);
        }, 150);
      }
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
        if (this.mesh.children[0]) this.mesh.children[0].material.color.setHex(0x7f1d1d);
      }
    }

    cocoonInResin() {
      if (this.isCocooned) return false;
      this.isCocooned = true;
      this.isIncapacitated = true;
      if (this.mesh) {
        this.mesh.rotation.z = Math.PI / 2;
        this.mesh.position.y = 0.3;
        if (this.mesh.children[0]) this.mesh.children[0].material.color.setHex(0x9d4edd);
      }
      return true;
    }

    lureTowards(tx, tz) {
      this.isLured = true;
      this.targetPos = { x: tx, z: tz };
    }

    collapseForBurst() {
      this.isBursting = true;
      if (this.mesh) {
        this.mesh.rotation.x = Math.PI / 2;
        this.mesh.position.y = 0.3;
        this.mesh.children[0].material.color.setHex(0x991b1b);
      }
    }

    update(deltaSeconds = 1 / 60) {
      if (!this.mesh || this.isBursting || this.isInfected || this.isCocooned || this.isIncapacitated) return;

      const distToPlayer = Math.hypot(playerCreature.x - this.x, playerCreature.z - this.z);

      this.motionPingCooldown -= deltaSeconds;
      if (distToPlayer < 20 && this.motionPingCooldown <= 0) {
        if (this.type !== 'scientist') audioManager.playMotionTrackerPing(distToPlayer);
        this.motionPingCooldown = 1.0 + Math.random() * 1.5;
      }

      const isCombatant = ['guard', 'smartgunner', 'cleaner', 'powerloader'].includes(this.type);
      this.shootCooldown -= deltaSeconds;
      if (isCombatant && distToPlayer < 14 && this.shootCooldown <= 0) {
          this.shootCooldown = this.type === 'cleaner' ? 2.4 : (this.type === 'powerloader' ? 1.9 : 1.6);
          if (this.type === 'cleaner') audioManager.playFlamethrowerWhoosh();
          else audioManager.playPulseRifleFire();
          if (window.gameInstance && window.gameInstance.currentStageIndex === 4) {
            const damage = this.type === 'powerloader' ? 18 : (this.type === 'cleaner' ? 12 : 8);
            playerCreature.takeDamage(damage);
          }
      }

      const dist = Math.hypot(this.targetPos.x - this.x, this.targetPos.z - this.z);
      if (dist > 0.5) {
        const speed = this.isLured ? 0.12 : (this.type === 'powerloader' ? 0.06 : 0.08);
        const frameScale = Math.max(0, deltaSeconds) * 60;
        const nextX = this.x + ((this.targetPos.x - this.x) / dist) * speed * frameScale;
        const nextZ = this.z + ((this.targetPos.z - this.z) / dist) * speed * frameScale;
        if (!stationMap.checkCollision(nextX, nextZ)) {
          this.x = nextX; this.z = nextZ;
          this.mesh.position.set(this.x, 0, this.z);
        } else {
          this.targetPos = { x: this.x + (Math.random() * 20 - 10), z: this.z + (Math.random() * 20 - 10) };
        }
      }
    }
  }

  class HiveUnit {
    constructor(id, caste, x, z) {
      this.id = id;
      this.caste = caste;
      this.x = x; this.z = z;
      this.hp = caste === 'queen' ? 1000 : (caste === 'praetorian' ? 400 : 180);
      this.speed = caste === 'runner' ? 0.50 : 0.35;
      this.mesh = null;
      this.attackCooldown = 0;
    }

    createMesh() {
      const group = new THREE.Group();
      let geo = new THREE.SphereGeometry(this.caste === 'queen' ? 2.5 : (this.caste === 'praetorian' ? 1.6 : 1.0), 12, 12);
      let color = 0x0f172a;
      if (this.caste === 'runner') color = 0x7c2d12;
      if (this.caste === 'warrior') color = 0x1e1b4b;
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
    }

    moveDirect(dx, dy, deltaSeconds = 1 / 60, maxDistance = Infinity) {
      if (!this.mesh || this.caste === 'queen') return;
      const frameScale = Math.max(0, deltaSeconds) * 60;
      const movementStep = Math.min(this.speed * frameScale, maxDistance);
      const nextX = this.x + dx * movementStep;
      const nextZ = this.z + dy * movementStep;
      if (!stationMap.checkCollision(nextX, nextZ)) {
        this.x = nextX;
        this.z = nextZ;
        this.mesh.position.set(this.x, 0, this.z);
      }
      if (dx !== 0 || dy !== 0) this.mesh.rotation.y = Math.atan2(dx, dy);
    }

    update(deltaSeconds = 1 / 60, humans = []) {
      if (!this.mesh) return;
      const activeZone = pheromoneSystem.commandZones[pheromoneSystem.commandZones.length - 1];
      if (activeZone && this.caste !== 'queen') {
        let target = activeZone;
        if (activeZone.command === 'HUNT') {
          const viableHumans = humans.filter((human) => !human.isCocooned && !human.isIncapacitated);
          target = viableHumans.reduce((closest, human) => {
            const distance = Math.hypot(human.x - this.x, human.z - this.z);
            return !closest || distance < closest.distance ? { x: human.x, z: human.z, human, distance } : closest;
          }, null) || activeZone;
        } else if (activeZone.command === 'CAPTURE') {
          const viableHosts = humans.filter((human) => human.isIncapacitated && !human.isCocooned);
          target = viableHosts.reduce((closest, human) => {
            const distance = Math.hypot(human.x - this.x, human.z - this.z);
            return !closest || distance < closest.distance ? { x: human.x, z: human.z, human, distance } : closest;
          }, null) || activeZone;
        }

        const dist = Math.hypot(target.x - this.x, target.z - this.z);
        const stopRadius = activeZone.command === 'DEFEND' ? 4 : 1.5;
        if (dist > stopRadius) {
          const speedMultiplier = activeZone.command === 'HUNT' ? 1.15 : (activeZone.command === 'DEFEND' ? 0.75 : 1);
          const frameScale = Math.max(0, deltaSeconds) * 60;
          const nextX = this.x + ((target.x - this.x) / dist) * this.speed * speedMultiplier * frameScale;
          const nextZ = this.z + ((target.z - this.z) / dist) * this.speed * speedMultiplier * frameScale;
          if (!stationMap.checkCollision(nextX, nextZ)) {
            this.x = nextX; this.z = nextZ;
            this.mesh.position.set(this.x, 0, this.z);
            this.mesh.rotation.y = Math.atan2(target.x - this.x, target.z - this.z);
          }
        } else if (target.human) {
          if (activeZone.command === 'CAPTURE' && target.human.isIncapacitated) {
            if (target.human.cocoonInResin()) resinGrid.addResinPatch(target.human.x, target.human.z);
          } else if (activeZone.command === 'HUNT') {
            this.attackCooldown -= deltaSeconds;
            if (this.attackCooldown <= 0) {
              this.attackCooldown = 0.8;
              target.human.takeDamage(this.caste === 'runner' ? 30 : 45);
            }
          }
        }
      }
    }
  }

  // -------------------------------------------------------------
  // STAGES LOGIC WITH GUARANTEED ATTACKS & TRANSITIONS
  // -------------------------------------------------------------
  class StageEgg {
    constructor() { this.step = 'CLOSED'; this.luredScientist = false; this.isCompleted = false; }
    init() {
      playerCreature.setForm('egg');
      alarmSystem.setLevel(0);
      this.updateHUD();
      this.log('[OVOMORPHE] L\'œuf perçoit les vibrations. Attirez le Dr. Yu.');
    }
    updateHUD() {
      document.getElementById('stage-badge').textContent = 'PHASE 1 : OVOMORPHE (INCUBATEUR)';
      document.getElementById('bio-title').textContent = 'STATUT DE L\'ŒUF (ZONE 1 — INCUBATEUR)';
      setHudBar('vital', 'VITALITÉ OVOMORPHE', 100);
      setHudBar('sec', 'SIGNAL PHÉROMONAL', this.luredScientist ? 100 : 0);
      const inst = document.getElementById('stage-instructions');
      const actionsContainer = document.getElementById('action-buttons-container');
      if (this.step === 'CLOSED') {
        inst.innerHTML = `<strong>Étape 1 — Ovomorphe Scellé :</strong><br><br>• Sécrétez des spores phéromonales.`;
        actionsContainer.innerHTML = `
          <button type="button" id="btn-lure" class="act-btn">🧪 1. LIBÉRER SPORES (ATTIRER DR. YU)</button>
          <button type="button" id="btn-open-egg" class="act-btn" ${!this.luredScientist ? 'disabled' : ''}>🌸 2. ENTROUVRIR PÉTALES</button>
        `;
        document.getElementById('btn-lure').onclick = () => {
          if (this.luredScientist) return;
          audioManager.playHeartbeat();
          this.luredScientist = true;
          this.log('[SPORES] Dr. Yu s\'approche.');
          if (window.gameInstance && window.gameInstance.humans[0]) window.gameInstance.humans[0].lureTowards(-20, -32);
          this.updateHUD();
          requestAnimationFrame(() => document.getElementById('btn-open-egg')?.focus({ preventScroll: true }));
        };
        document.getElementById('btn-open-egg').onclick = () => {
          if (!this.luredScientist || this.step !== 'CLOSED') return;
          audioManager.playEggOpen();
          this.step = 'OPENED';
          playerCreature.openEgg();
          this.updateHUD();
          requestAnimationFrame(() => document.getElementById('btn-expel-facehugger')?.focus({ preventScroll: true }));
        };
      } else {
        inst.innerHTML = `<strong>Étape 2 — Présence du Facehugger :</strong><br><br>• Catapultez le parasite !`;
        actionsContainer.innerHTML = `<button type="button" id="btn-expel-facehugger" class="act-btn" style="border-color: #f59e0b;">💥 3. CATAPULTER LE FACEHUGGER !</button>`;
        document.getElementById('btn-expel-facehugger').onclick = () => {
          if (this.isCompleted) return;
          this.isCompleted = true;
          if (window.gameInstance) window.gameInstance.advanceStage(this);
          audioManager.playHatch();
          audioManager.playFacehuggerLeap();
        };
      }
    }
    log(msg) { appendSensorLog(msg, 'bio'); }
    update() {}
  }

  class StageFacehugger {
    constructor() { this.bioTimer = 100; this.isCompleted = false; this.targetHost = null; this.isAttacking = false; this.leapTimer = null; }
    init() {
      playerCreature.setForm('facehugger');
      alarmSystem.setLevel(1);
      this.updateHUD();
      appendSensorLog('[FACEHUGGER] Repérez le Dr. Yu dans le secteur puis bondissez.', 'bio');
    }
    updateHUD() {
      document.getElementById('stage-badge').textContent = 'PHASE 2 : FACEHUGGER (ACTION RÉELLE)';
      document.getElementById('bio-title').textContent = 'STATUT DU FACEHUGGER — RECHERCHE D\'HÔTE';
      setHudBar('vital', 'VIABILITÉ DU PARASITE', 100);
      setHudBar('sec', 'RÉSERVE DE BOND', this.isAttacking ? 0 : 100);
      document.getElementById('stage-instructions').innerHTML = '<strong>Objectif :</strong><br><br>• Déplacez-vous avec ZQSD, les flèches ou un clic sur le terrain.<br>• Gardez le Dr. Yu dans le même secteur.<br>• Bondissez avec Espace ou le bouton.';
      const actionsContainer = document.getElementById('action-buttons-container');
      actionsContainer.innerHTML = `<button type="button" id="btn-action-leap" class="act-btn" style="border-color: #39ff14;">⚡ 💥 BONDIR SUR LE VISAGE [ESPACE]</button>`;
      document.getElementById('btn-action-leap').onclick = () => this.attemptLeap();
    }
    attemptLeap() {
      if (this.isAttacking || this.isCompleted) return;
      const humans = window.gameInstance ? window.gameInstance.humans : [];
      let closestHost = null;
      let closestDistance = Infinity;
      for (const human of humans) {
        if (human.isInfected || human.isCocooned) continue;
        const distance = Math.hypot(human.x - playerCreature.x, human.z - playerCreature.z);
        if (distance < closestDistance) {
          closestHost = human;
          closestDistance = distance;
        }
      }

      if (!closestHost || closestDistance > 30) {
        showToast('Aucun hôte à portée : rapprochez-vous du secteur ciblé.');
        appendSensorLog('[FACEHUGGER] Bond impossible : aucun visage à portée.', 'alert');
        return;
      }

      this.targetHost = closestHost;
      this.isAttacking = true;
      playerCreature.isLeaping = true;
      setHudBar('sec', 'RÉSERVE DE BOND', 0);
      const leapButton = document.getElementById('btn-action-leap');
      if (leapButton) leapButton.disabled = true;
      audioManager.playFacehuggerLeap();
      playerCreature.x = closestHost.x;
      playerCreature.z = closestHost.z;
      if (playerCreature.mesh) playerCreature.mesh.position.set(playerCreature.x, 0, playerCreature.z);
      this.leapTimer = window.setTimeout(() => {
        closestHost.isInfected = true;
        playerCreature.isLeaping = false;
        this.isCompleted = true;
        if (window.gameInstance) window.gameInstance.advanceStage(this);
        audioManager.playAcidSizzle();
      }, 700);
    }
    handleKeyDown(key) { if (key === ' ') this.attemptLeap(); }
    destroy() { if (this.leapTimer) window.clearTimeout(this.leapTimer); }
    update() {}
  }

  class StageChestburster {
    constructor() {
      this.step = 'INTERNAL_GESTATION';
      this.biomassHunted = 0;
      this.chrysalisTimer = 0;
      this.chrysalisStartedAt = null;
      this.maturationTimeout = null;
      this.lastDisplayedPercent = -1;
      this.isCompleted = false;
    }
    init() {
      playerCreature.setForm('chestburster');
      alarmSystem.setLevel(2);
      this.updateHUD();
    }
    updateHUD() {
      document.getElementById('stage-badge').textContent = 'PHASE 3 : CHESTBURSTER & CHRYSALIDE';
      document.getElementById('bio-title').textContent = 'CROISSANCE DU CHESTBURSTER';
      setHudBar('vital', 'VITALITÉ DU JUVÉNILE', 100);
      setHudBar('sec', 'MATURATION', this.step === 'CHRYSALIS' ? this.chrysalisTimer : 0);
      const actionsContainer = document.getElementById('action-buttons-container');
      const instructions = document.getElementById('stage-instructions');
      if (this.step === 'INTERNAL_GESTATION') {
        instructions.innerHTML = '<strong>Gestation terminée :</strong><br><br>• Émergez de l\'hôte infecté.';
        actionsContainer.innerHTML = `<button type="button" id="btn-erupt-now" class="act-btn" style="border-color: #ef4444;">💥 🩸 PERFORER LE STERNUM !</button>`;
        document.getElementById('btn-erupt-now').onclick = () => {
          audioManager.playBoneCrunch();
          audioManager.playChestburstScreech();
          this.step = 'HUNT_FAUNA';
          this.updateHUD();
        };
      } else if (this.step === 'HUNT_FAUNA') {
        instructions.innerHTML = '<strong>Croissance accélérée :</strong><br><br>• Trouvez un abri et tissez une chrysalide.';
        actionsContainer.innerHTML = `<button type="button" id="btn-start-chrysalis" class="act-btn" style="border-color: #9d4edd;">🦋 TISSER LA CHRYSALIDE ROMULUS</button>`;
        document.getElementById('btn-start-chrysalis').onclick = () => {
          this.step = 'CHRYSALIS';
          this.chrysalisStartedAt = performance.now();
          this.maturationTimeout = window.setTimeout(() => {
            if (this.step !== 'CHRYSALIS' || this.isCompleted) return;
            this.chrysalisTimer = 100;
            this.updateHUD();
          }, 4000);
          playerCreature.setChrysalis(true);
          this.updateHUD();
        };
      } else if (this.step === 'CHRYSALIS') {
        const isMature = this.chrysalisTimer >= 100;
        instructions.innerHTML = '<strong>Chrysalide :</strong><br><br>• Attendez la fin de la métamorphose.';
        actionsContainer.innerHTML = `<button type="button" id="btn-emerge-drone" class="act-btn" ${!isMature ? 'disabled' : ''} style="border-color: #39ff14;">${isMature ? '✨ 🦋 ÉMERGER EN DRONE ADULTE ! [ESPACE]' : `🧬 MATURATION... (${Math.round(this.chrysalisTimer)}%)`}</button>`;
        if (isMature) document.getElementById('btn-emerge-drone').onclick = () => this.emergeAdultDrone();
      }
    }
    emergeAdultDrone() {
      if (this.isCompleted) return;
      this.isCompleted = true;
      if (window.gameInstance) window.gameInstance.advanceStage(this);
      audioManager.playXenoRoar();
    }
    handleKeyDown(key) {
      if (key === ' ' && this.step === 'CHRYSALIS' && this.chrysalisTimer >= 100) this.emergeAdultDrone();
    }
    destroy() { if (this.maturationTimeout) window.clearTimeout(this.maturationTimeout); }
    update(deltaSeconds = 1 / 60) {
      if (this.step === 'CHRYSALIS' && this.chrysalisTimer < 100) {
        const elapsed = this.chrysalisStartedAt === null ? 0 : performance.now() - this.chrysalisStartedAt;
        this.chrysalisTimer = Math.min(100, (elapsed / 4000) * 100);
        const displayedPercent = this.chrysalisTimer >= 100 ? 100 : Math.min(99, Math.floor(this.chrysalisTimer));
        if (displayedPercent !== this.lastDisplayedPercent) {
          this.lastDisplayedPercent = displayedPercent;
          const emergeButton = document.getElementById('btn-emerge-drone');
          if (emergeButton) {
            const isMature = this.chrysalisTimer >= 100;
            emergeButton.textContent = isMature
              ? '✨ 🦋 ÉMERGER EN DRONE ADULTE ! [ESPACE]'
              : `🧬 MATURATION... (${displayedPercent}%)`;
            emergeButton.disabled = !isMature;
            if (isMature) emergeButton.onclick = () => this.emergeAdultDrone();
          }
          setHudBar('sec', 'MATURATION', this.chrysalisTimer);
        }
      }
    }
  }

  // STAGE 4 WITH REAL ENEMY HP COMBAT & DIRECT TRANSITION
  class StageDrone {
    constructor() {
      this.isCompleted = false;
      this.capturedHosts = 0;
      this.abilityReadyAt = { acid: 0, tail: 0, cocoon: 0 };
      this.acidReserve = 100;
      this.lastDisplayedAcid = 100;
    }
    init() {
      playerCreature.setForm('drone');
      document.getElementById('hive-stats-group').classList.remove('hidden');
      alarmSystem.setLevel(3);

      if (window.gameInstance) {
        window.gameInstance.clearHumans();
        const boss = new HumanAI(99, 'powerloader', 10, 10, 'Power Loader Mech Boss (Hicks)'); boss.createMesh();
        const smart = new HumanAI(98, 'smartgunner', -15, -15, 'Smartgunner Vasquez'); smart.createMesh();
        const g1 = new HumanAI(97, 'guard', 25, 0, 'Garde Miller'); g1.createMesh();
        window.gameInstance.humans.push(boss, smart, g1);
      }

      this.updateHUD();
      this.log('[DRONE ADULTE] Traquez les Colonial Marines & le Boss Power Loader ! Touches [1] Crachat d\'acide / [2] Attaque de queue / [3] Cocon.');
    }

    updateHUD() {
      document.getElementById('stage-badge').textContent = 'PHASE 4 : DRONE PRÉDATEUR vs COLONIAL MARINES BOSS';
      document.getElementById('bio-title').textContent = 'STATUT DU DRONE — CHASSE & NURSERIE';
      setHudBar('vital', 'INTÉGRITÉ DU DRONE', playerCreature.health);
      setHudBar('sec', 'RÉSERVE ACIDE', this.acidReserve);
      document.getElementById('stage-instructions').innerHTML = '<strong>Combat :</strong><br><br>• Déplacez-vous avec ZQSD, les flèches ou un clic/toucher sur le terrain.<br>• Affaiblissez les Marines.<br>• Approchez-vous d\'une cible neutralisée pour la coconner.<br>• Fondez ensuite la chambre royale.';
      const actionsContainer = document.getElementById('action-buttons-container');
      actionsContainer.innerHTML = `
        <button type="button" id="btn-acid-spit" class="act-btn">🧪 1. CRACHAT D'ACIDE CONCENTRÉ [TOUCHE 1 / E]</button>
        <button type="button" id="btn-tail-impale" class="act-btn">🗡️ 2. ATTAQUE DE QUEUE TRANCHANTE [TOUCHE 2 / R]</button>
        <button type="button" id="btn-cocoon-host" class="act-btn">👤 3. ENGLUER UNE CIBLE NEUTRALISÉE [TOUCHE 3 / F]</button>
        <button type="button" id="btn-found-queen-hive" class="act-btn" style="border-color: #9d4edd; background: rgba(157,78,221,0.35);">👑 4. FONDER LA CHAMBRE ROYALE & LA REINE (LANCER RTS)</button>
      `;

      document.getElementById('btn-acid-spit').onclick = () => this.executeAcidSpit();
      document.getElementById('btn-tail-impale').onclick = () => this.executeTailImpale();
      document.getElementById('btn-cocoon-host').onclick = () => this.executeCocoonHost();
      document.getElementById('btn-found-queen-hive').onclick = () => this.foundQueenHive();
      this.updateQueenButton();
    }

    handleKeyDown(key) {
      if (key === '1' || key === 'e') this.executeAcidSpit();
      if (key === '2' || key === 'r') this.executeTailImpale();
      if (key === '3' || key === 'f') this.executeCocoonHost();
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

    executeAcidSpit() {
      if (this.acidReserve < 25) {
        showToast('Réserve acide insuffisante. Patientez quelques secondes.');
        return;
      }
      if (!this.canUseAbility('acid', 700)) return;
      this.acidReserve -= 25;
      this.updateAcidUI();
      audioManager.playAcidSizzle();
      const { human: closest, distance: minDist } = this.findClosestHuman((human) => !human.isCocooned && !human.isIncapacitated);

      if (closest && minDist < 20.0) {
        closest.takeDamage(75);
        this.updateQueenButton();
        this.log(`[CRACHAT D'ACIDE] Jet d'acide corrosif projeté sur ${closest.name} ! Dégâts : 75 HP (PV restants : ${Math.max(0, closest.hp)})`);
      } else {
        this.log('[CRACHAT D\'ACIDE] Acide projeté à blanc (Aucune cible à portée).');
      }
    }

    executeTailImpale() {
      if (!this.canUseAbility('tail', 500)) return;
      audioManager.playBoneCrunch();
      const { human: closest, distance: minDist } = this.findClosestHuman((human) => !human.isCocooned && !human.isIncapacitated);

      if (closest && minDist < 6.0) {
        closest.takeDamage(130);
        this.updateQueenButton();
        this.log(`[ATTACK DE QUEUE] Coup de dards tranchant sur ${closest.name} ! Dégâts : 130 HP (PV restants : ${Math.max(0, closest.hp)})`);
      } else {
        this.log('[ATTACK DE QUEUE] Rapprochez-vous du corps à corps avec ZQSD / Flèches !');
      }
    }

    executeCocoonHost() {
      if (!this.canUseAbility('cocoon', 500)) return;
      const { human: target, distance } = this.findClosestHuman((human) => human.isIncapacitated && !human.isCocooned);

      if (target && distance < 6) {
        if (!target.cocoonInResin()) return;
        this.capturedHosts++;
        document.getElementById('hive-hosts').textContent = this.capturedHosts;
        resinGrid.addResinPatch(target.x, target.z);
        audioManager.playHeartbeat();
        this.log(`[NURSERIE] ${target.name} neutralisé et englué dans un cocon de résine ! (${this.capturedHosts}/2)`);
        this.updateQueenButton();
      } else if (target) {
        this.log('[NURSERIE] Cible neutralisée trop éloignée : approchez-vous à moins de 6 m.');
      } else {
        this.log('[NURSERIE] Aucune cible neutralisée disponible. Affaiblissez d\'abord un Marine.');
      }
    }

    foundQueenHive() {
      if (this.isCompleted) return;
      if (!this.canFoundHive()) {
        showToast('Neutralisez toutes les menaces, dont le Power Loader, et sécurisez deux hôtes.');
        return;
      }
      this.isCompleted = true;
      if (window.gameInstance) window.gameInstance.advanceStage(this);
      audioManager.playXenoRoar();
      appendSensorLog('[ASCENSION ROYALE] Fondation de la Chambre Royale & de la Reine. Lancement du RTS...', 'bio');
    }

    canFoundHive() {
      const humans = window.gameInstance ? window.gameInstance.humans : [];
      const powerLoader = humans.find((human) => human.type === 'powerloader');
      const activeThreats = humans.filter((human) => !human.isCocooned && !human.isIncapacitated);
      const powerLoaderNeutralized = !!powerLoader && (powerLoader.isIncapacitated || powerLoader.isCocooned);
      return this.capturedHosts >= 2 && powerLoaderNeutralized && activeThreats.length === 0;
    }

    updateQueenButton() {
      const button = document.getElementById('btn-found-queen-hive');
      if (!button) return;
      const humans = window.gameInstance ? window.gameInstance.humans : [];
      const powerLoader = humans.find((human) => human.type === 'powerloader');
      const activeThreatCount = humans.filter((human) => !human.isCocooned && !human.isIncapacitated).length;
      const bossStatus = powerLoader && (powerLoader.isIncapacitated || powerLoader.isCocooned) ? 'BOSS ✓' : 'BOSS À NEUTRALISER';
      const threatStatus = activeThreatCount === 0 ? 'MENACES ✓' : `MENACES ACTIVES ${activeThreatCount}`;
      button.disabled = !this.canFoundHive();
      button.textContent = `👑 4. FONDER LA REINE — HÔTES ${this.capturedHosts}/2 · ${bossStatus} · ${threatStatus}`;
    }

    log(msg) { appendSensorLog(msg, 'bio'); }

    update(deltaSeconds = 1 / 60) {
      if (this.acidReserve >= 100) return;
      this.acidReserve = Math.min(100, this.acidReserve + Math.max(0, deltaSeconds) * 12);
      if (Math.floor(this.acidReserve) !== this.lastDisplayedAcid) this.updateAcidUI();
    }

    updateAcidUI() {
      this.lastDisplayedAcid = Math.floor(this.acidReserve);
      setHudBar('sec', 'RÉSERVE ACIDE', this.acidReserve);
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
    }

    findFreePosition(preferredX, preferredZ, seed = 0) {
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
        if (!stationMap.checkCollision(x, z) && !overlapsUnit) return { x, z };
      }

      // Fallback deterministe : elargit la recherche sans faire naitre d'unite dans un obstacle.
      for (let radius = 12; radius <= 36; radius += 4) {
        for (let segment = 0; segment < 16; segment++) {
          const angle = ((segment + seed) / 16) * Math.PI * 2;
          const x = preferredX + Math.cos(angle) * radius;
          const z = preferredZ + Math.sin(angle) * radius;
          const overlapsUnit = this.rtsUnits.some((unit) => Math.hypot(unit.x - x, unit.z - z) < 2.5);
          if (!stationMap.checkCollision(x, z) && !overlapsUnit) return { x, z };
        }
      }
      return { x: 0, z: 0 };
    }

    init() {
      document.getElementById('rts-control-bar').classList.remove('hidden');
      alarmSystem.setLevel(5);
      pheromoneSystem.clearZones();
      const queenSpawn = this.findFreePosition(55, 45);
      this.queen = new HiveUnit(100, 'queen', queenSpawn.x, queenSpawn.z);
      this.queen.createMesh();
      this.rtsUnits.push(this.queen);
      for (let i = 0; i < 4; i++) {
        const spawn = this.findFreePosition(this.queen.x - 6 + i * 4, this.queen.z + 7, i);
        const unit = new HiveUnit(10 + i, i % 2 === 0 ? 'runner' : 'warrior', spawn.x, spawn.z);
        unit.createMesh();
        this.rtsUnits.push(unit);
      }
      this.updateHUD();
      this.updateStats();
      this.log('[RTS HIVE] REINE ÉTABLIE ! Cliquez sur la carte pour poser les marques phéromonales !');
    }

    updateHUD() {
      document.getElementById('stage-badge').textContent = 'PHASE 5 : RTS COLONIE SUPRÊME & REINE';
      document.getElementById('bio-title').textContent = 'RÉSEAU SYNAPTIQUE DE LA RUCHE';
      document.getElementById('stage-instructions').innerHTML = '<strong>Commandement :</strong><br><br>• Choisissez un ordre Q/W/E/R.<br>• Cliquez sur le terrain pour placer une phéromone.<br>• Activez la possession puis cliquez près d\'une unité pour la contrôler en ZQSD/WASD.<br>• Pour gagner, neutralisez toute menace et posez au moins une marque INFEST.';
      setHudBar('vital', 'INTÉGRITÉ REINE', 100);
      const actionsContainer = document.getElementById('action-buttons-container');
      actionsContainer.innerHTML = `
        <button type="button" id="btn-spawn-runner" class="act-btn">👾 PRODUIRE RUNNER (20 Bio)</button>
        <button type="button" id="btn-spawn-warrior" class="act-btn">⚔️ PRODUIRE WARRIOR (50 Bio)</button>
        <button type="button" id="btn-final-conquest" class="act-btn" disabled style="border-color: #39ff14; background: rgba(57,255,20,0.35);">🏆 CONQUÊTE TOTALE ACHERON-9</button>
      `;

      document.getElementById('btn-spawn-runner').onclick = () => this.spawnUnit('runner', 20);
      document.getElementById('btn-spawn-warrior').onclick = () => this.spawnUnit('warrior', 50);
      document.getElementById('btn-final-conquest').onclick = () => this.completeConquest();
    }

    spawnUnit(caste, cost) {
      if (this.biomass < cost) {
        showToast(`Biomasse insuffisante : ${cost} requise.`);
        return;
      }
      this.biomass -= cost;
      const offset = this.rtsUnits.length * 1.3;
      const spawn = this.findFreePosition(this.queen.x - 5 + offset, this.queen.z - 7, this.rtsUnits.length);
      const unit = new HiveUnit(Date.now() + this.rtsUnits.length, caste, spawn.x, spawn.z);
      unit.createMesh();
      this.rtsUnits.push(unit);
      this.updateStats();
      this.log(`[PONTE] ${caste.toUpperCase()} produit. Biomasse restante : ${this.biomass}.`);
    }

    updateStats() {
      const biomassElement = document.getElementById('hive-biomass');
      const unitElement = document.getElementById('hive-units');
      if (biomassElement) biomassElement.textContent = this.biomass;
      if (unitElement) unitElement.textContent = this.rtsUnits.length;
      const biomassPercent = Math.max(0, Math.min(100, (this.biomass / 120) * 100));
      setHudBar('sec', 'BIOMASSE DISPONIBLE', biomassPercent, this.biomass);
      const runnerButton = document.getElementById('btn-spawn-runner');
      const warriorButton = document.getElementById('btn-spawn-warrior');
      const conquestButton = document.getElementById('btn-final-conquest');
      if (runnerButton) runnerButton.disabled = this.biomass < 20;
      if (warriorButton) warriorButton.disabled = this.biomass < 50;
      if (conquestButton) {
        conquestButton.disabled = !this.canCompleteConquest();
        conquestButton.title = conquestButton.disabled
          ? 'Neutralisez les menaces restantes et posez une marque INFEST.'
          : 'Déclencher la conquête totale.';
      }
    }

    canCompleteConquest() {
      const humans = window.gameInstance ? window.gameInstance.humans : [];
      const hasInfestation = pheromoneSystem.commandZones.some((zone) => zone.command === 'INFEST');
      const hasActiveThreat = humans.some((human) => !human.isCocooned && !human.isIncapacitated);
      return hasInfestation && !hasActiveThreat;
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
          if (unit.caste === 'queen') continue;
          const distance = Math.hypot(unit.x - worldPoint.x, unit.z - worldPoint.z);
          if (distance < closestDistance) {
            closestUnit = unit;
            closestDistance = distance;
          }
        }
        if (closestUnit && closestDistance <= 8) {
          this.possessedUnit = closestUnit;
          this.possessedMoveTarget = null;
          this.log(`[POSSESSION] Contrôle direct du ${closestUnit.caste.toUpperCase()} #${closestUnit.id}.`);
          showToast('Unité possédée : déplacement ZQSD / flèches.');
        } else if (this.possessedUnit) {
          this.possessedMoveTarget = worldPoint;
          showToast('Destination de l\'unité possédée mise à jour.');
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
      pheromoneSystem.addZone({ x: worldPoint.x, z: worldPoint.z, command, mesh: marker });
      if (command === 'INFEST') resinGrid.addResinPatch(worldPoint.x, worldPoint.z, 5);
      this.log(`[PHÉROMONE ${command}] Marque posée en X:${worldPoint.x.toFixed(1)} Z:${worldPoint.z.toFixed(1)}.`);
      this.updateStats();
    }

    getCameraTarget() {
      if (pheromoneSystem.possessionMode && this.possessedUnit) return this.possessedUnit;
      return this.queen || playerCreature;
    }

    completeConquest() {
      if (this.isCompleted) return;
      if (!pheromoneSystem.commandZones.some((zone) => zone.command === 'INFEST')) {
        showToast('Posez au moins une marque phéromonale INFEST avant la conquête.');
        return;
      }
      if (!this.canCompleteConquest()) {
        showToast('Des menaces humaines sont encore actives dans la station.');
        return;
      }
      this.isCompleted = true;
      if (window.gameInstance) {
        window.gameInstance.showEndModal(
          'VICTOIRE DE LA RUCHE',
          'Acheron-9 est tombée. Le réseau synaptique contrôle désormais la station entière.'
        );
      }
    }

    log(msg) { appendSensorLog(msg, 'alert'); }

    update(deltaSeconds = 1 / 60) {
      const humans = window.gameInstance ? window.gameInstance.humans : [];
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
      const threatCount = humans.filter((human) => !human.isCocooned && !human.isIncapacitated).length;
      if (threatCount !== this.lastThreatCount) {
        this.lastThreatCount = threatCount;
        this.updateStats();
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
      const dr = new HumanAI(1, 'scientist', -20, -10, 'Dr. Yu'); dr.createMesh(); this.humans.push(dr);
      playerCreature.createMesh(); this.loadStage(1);
      this.isRunning = true;
      requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    handleKeyDown(key) {
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
      document.getElementById('app-container')?.classList.toggle('is-rts', index === 5);
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
      this.loadStage(this.currentStageIndex + 1);
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

      if (this.currentStageIndex !== 5) playerCreature.update(deltaSeconds);
      for (const human of this.humans) human.update(deltaSeconds);

      const activeStage = this.currentStage;
      if (activeStage) {
        activeStage.update(deltaSeconds);
        if (activeStage === this.currentStage && activeStage.isCompleted && this.currentStageIndex < 5) {
          this.loadStage(this.currentStageIndex + 1);
        }
      }

      const cameraTarget = this.currentStageIndex === 5 && this.currentStage && this.currentStage.getCameraTarget
        ? this.currentStage.getCameraTarget()
        : playerCreature;
      rendererEngine.setCameraTarget(cameraTarget.x, cameraTarget.z, 0, this.currentStageIndex === 5, deltaSeconds);
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
