/* HIVE ASCENSION
 * Campaign shell, save data, codex, accessibility, narrative UI and lightweight VFX.
 * The file is intentionally framework-free so the static build remains deployable anywhere.
 */

(function () {
  'use strict';

  const SAVE_KEY = 'hive-ascension-campaign-v2';
  const SETTINGS_KEY = 'hive-ascension-settings-v2';

  const isRecord = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
  const boundedNumber = (value, fallback, minimum, maximum) => (
    typeof value === 'number' && Number.isFinite(value)
      ? Math.max(minimum, Math.min(maximum, value))
      : fallback
  );
  const stringList = (value, fallback = []) => Array.isArray(value)
    ? [...new Set(value.filter((entry) => typeof entry === 'string' && entry.length < 100))]
    : [...fallback];

  // =============================================================
  // SAVE DATA — CAMPAIGN, DISCOVERIES AND ENDINGS
  // =============================================================
  class SaveManager {
    constructor() {
      this.defaultSave = {
        version: 2,
        stage: 1,
        campaignStarted: false,
        difficulty: 'survivor',
        expandedLore: true,
        origin: 'random',
        adultCaste: 'drone',
        embryoMutation: 'carapace',
        hostProfile: null,
        campaignCharacters: {
          asterRho: {
            alive: true,
            usedAsHost: false,
            maskAttachments: 2
          }
        },
        unlockedCodex: ['ovomorphe'],
        completedEndings: [],
        updatedAt: null
      };
    }

    normalize(value) {
      const parsed = isRecord(value) ? value : {};
      const character = isRecord(parsed.campaignCharacters?.asterRho)
        ? parsed.campaignCharacters.asterRho : {};
      const validCaste = typeof parsed.adultCaste === 'string' && /^[a-z0-9_]{2,40}$/.test(parsed.adultCaste)
        ? parsed.adultCaste
        : 'drone';
      return {
        ...this.defaultSave,
        version: 2,
        stage: Math.floor(boundedNumber(parsed.stage, 1, 1, 5)),
        campaignStarted: parsed.campaignStarted === true,
        difficulty: ['story', 'survivor', 'nightmare'].includes(parsed.difficulty)
          ? parsed.difficulty : 'survivor',
        expandedLore: typeof parsed.expandedLore === 'boolean' ? parsed.expandedLore : true,
        origin: typeof parsed.origin === 'string' && /^[a-z0-9_]{2,32}$/.test(parsed.origin)
          ? parsed.origin : 'random',
        adultCaste: validCaste,
        embryoMutation: ['agility', 'acid', 'carapace'].includes(parsed.embryoMutation)
          ? parsed.embryoMutation : 'carapace',
        hostProfile: typeof parsed.hostProfile === 'string' && parsed.hostProfile.length < 100
          ? parsed.hostProfile : null,
        unlockedCodex: stringList(parsed.unlockedCodex, ['ovomorphe']),
        completedEndings: stringList(parsed.completedEndings),
        campaignCharacters: {
          asterRho: {
            alive: character.alive !== false,
            usedAsHost: character.usedAsHost === true,
            maskAttachments: Math.floor(boundedNumber(character.maskAttachments, 2, 0, 2))
          }
        },
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null
      };
    }

    read() {
      if (this.sessionOnly) return this.sessionSave ? this.normalize(this.sessionSave) : null;
      try {
        const raw = window.localStorage.getItem(SAVE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!isRecord(parsed)) return null;
        return this.normalize(parsed);
      } catch (error) {
        console.warn('[Save] Lecture impossible', error);
        return this.sessionSave ? this.normalize(this.sessionSave) : null;
      }
    }

    write(patch) {
      const current = this.read() || this.normalize(this.defaultSave);
      const next = this.normalize({ ...current, ...patch, updatedAt: new Date().toISOString() });
      // Keep the current campaign usable when private browsing or quota limits
      // prevent persistence. Checkpoints and discoveries must still accumulate.
      this.sessionSave = next;
      try {
        window.localStorage.setItem(SAVE_KEY, JSON.stringify(next));
        this.sessionOnly = false;
      } catch (error) {
        this.sessionOnly = true;
        if (!this.storageWarningShown) {
          this.storageWarningShown = true;
          console.warn('[Save] Stockage indisponible : progression conservée pour cette session.', error);
          const toast = document.getElementById('toast-message');
          if (toast) {
            toast.textContent = 'Sauvegarde locale indisponible : votre progression sera perdue en fermant cette page.';
            toast.classList.remove('hidden');
            window.setTimeout(() => toast.classList.add('hidden'), 9000);
          }
        }
      }
      return this.normalize(next);
    }

    startNew(difficulty, expandedLore, origin = 'random') {
      const previous = this.read();
      return this.write({
        ...this.defaultSave,
        difficulty,
        expandedLore,
        origin,
        campaignStarted: true,
        unlockedCodex: previous?.unlockedCodex || ['ovomorphe'],
        completedEndings: previous?.completedEndings || []
      });
    }

    checkpoint(stage, additions = {}) {
      const current = this.read() || this.defaultSave;
      return this.write({
        ...additions,
        campaignStarted: true,
        stage: Math.max(current.stage || 1, stage)
      });
    }

    unlock(ids) {
      const current = this.read() || this.defaultSave;
      const unlockedCodex = [...new Set([...current.unlockedCodex, ...ids])];
      this.write({ unlockedCodex });
      return unlockedCodex;
    }

    completeEnding(id) {
      const current = this.read() || this.defaultSave;
      const completedEndings = [...new Set([...current.completedEndings, id])];
      this.write({ completedEndings, campaignStarted: false, stage: 1 });
      return completedEndings;
    }
  }

  // =============================================================
  // SETTINGS — VOLUME, BRIGHTNESS AND ACCESSIBILITY
  // =============================================================
  class SettingsManager {
    constructor() {
      const prefersReducedMotion = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      this.defaults = {
        volume: 70,
        brightness: 100,
        scanlines: false,
        reducedMotion: prefersReducedMotion,
        highContrast: false,
        muted: false,
        graphicsQuality: 'auto',
        cameraDistance: 100
      };
      this.values = this.read();
      this.game = null;
      this.vfx = null;
      this.audioMuted = false;
    }

    attachVFX(vfxManager) {
      this.vfx = vfxManager;
    }

    read() {
      let parsed = {};
      try {
        const value = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || '{}');
        if (isRecord(value)) parsed = value;
      } catch (_error) {
        // Retain usable defaults even when browser storage is unavailable.
      }
      const values = { ...this.defaults };
      values.volume = boundedNumber(parsed.volume, this.defaults.volume, 0, 100);
      values.brightness = boundedNumber(parsed.brightness, this.defaults.brightness, 70, 140);
      values.cameraDistance = Math.round(boundedNumber(parsed.cameraDistance, 100, 50, 135));
      for (const key of ['scanlines', 'reducedMotion', 'highContrast', 'muted']) {
        if (typeof parsed[key] === 'boolean') values[key] = parsed[key];
      }
      if (['auto', 'mobile', 'high', 'ultra'].includes(parsed.graphicsQuality)) {
        values.graphicsQuality = parsed.graphicsQuality;
      }
      return values;
    }

    write() {
      try {
        window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.values));
      } catch (error) {
        console.warn('[Settings] Sauvegarde impossible', error);
      }
    }

    init(game) {
      this.game = game;
      const controls = {
        volume: document.getElementById('setting-volume'),
        brightness: document.getElementById('setting-brightness'),
        scanlines: document.getElementById('setting-scanlines'),
        reducedMotion: document.getElementById('setting-reduced-motion'),
        highContrast: document.getElementById('setting-high-contrast'),
        graphicsQuality: document.getElementById('setting-graphics'),
        cameraDistance: document.getElementById('setting-camera-distance')
      };

      if (controls.volume) controls.volume.value = this.values.volume;
      if (controls.brightness) controls.brightness.value = this.values.brightness;
      if (controls.scanlines) controls.scanlines.checked = this.values.scanlines;
      if (controls.reducedMotion) controls.reducedMotion.checked = this.values.reducedMotion;
      if (controls.highContrast) controls.highContrast.checked = this.values.highContrast;
      if (controls.graphicsQuality) controls.graphicsQuality.value = this.values.graphicsQuality;
      if (controls.cameraDistance) controls.cameraDistance.value = this.values.cameraDistance;

      const sync = () => {
        this.values = {
          volume: Number(controls.volume?.value ?? this.values.volume),
          brightness: Number(controls.brightness?.value ?? this.values.brightness),
          scanlines: !!controls.scanlines?.checked,
          reducedMotion: !!controls.reducedMotion?.checked,
          highContrast: !!controls.highContrast?.checked,
          muted: this.values.muted,
          graphicsQuality: controls.graphicsQuality?.value || this.values.graphicsQuality,
          cameraDistance: Number(controls.cameraDistance?.value ?? this.values.cameraDistance)
        };
        this.apply();
        this.write();
      };

      Object.values(controls).forEach((control) => {
        if (!control) return;
        control.addEventListener('input', sync);
        control.addEventListener('change', sync);
      });
      this.apply();
    }

    apply() {
      const app = document.getElementById('app-container');
      document.documentElement.style.setProperty('--game-brightness', String(this.values.brightness / 100));
      app?.classList.toggle('scanlines-off', !this.values.scanlines);
      app?.classList.toggle('high-contrast', this.values.highContrast);
      app?.classList.toggle('reduce-motion', this.values.reducedMotion);
      if (this.game && this.audioMuted !== this.values.muted) {
        this.audioMuted = !!this.game.toggleAudio?.();
      }
      const audioButton = document.getElementById('btn-audio-toggle');
      audioButton?.setAttribute('aria-pressed', String(this.values.muted));
      if (audioButton) {
        const audioSvg = `<svg class="btn-sq-icon" viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor"><path d="M4 7 L7 7 L12 3 L12 17 L7 13 L4 13 Z" stroke-width="1.5" stroke-linejoin="round"/>${this.values.muted ? '<line x1="14" y1="6" x2="18" y2="14" stroke-width="1.5"/><line x1="18" y1="6" x2="14" y2="14" stroke-width="1.5"/>' : '<path d="M15 7 A4 4 0 0 1 15 13 M17 4 A8 8 0 0 1 17 16" stroke-width="1.5" stroke-linecap="round"/>'}</svg>`;
        audioButton.innerHTML = `${audioSvg}<span>${this.values.muted ? 'SON COUPÉ' : 'SON'}</span>`;
      }
      this.game?.setMasterVolume?.(this.values.volume / 100);
      this.game?.setReducedMotion?.(this.values.reducedMotion);
      this.game?.setGraphicsQuality?.(this.values.graphicsQuality);
      this.applyCameraDistance();
      this.vfx?.setReducedMotion?.(this.values.reducedMotion);
    }

    applyCameraDistance() {
      this.game?.setCameraDistance?.(this.values.cameraDistance);
      const control = document.getElementById('setting-camera-distance');
      if (control) {
        control.value = this.values.cameraDistance;
        control.setAttribute('aria-valuetext', `${this.values.cameraDistance} %`);
      }
      const value = document.getElementById('camera-distance-value');
      if (value) value.textContent = `${this.values.cameraDistance} %`;
    }

    setCameraDistance(value) {
      this.values.cameraDistance = Math.round(boundedNumber(value, 100, 50, 135));
      this.applyCameraDistance();
      this.write();
    }
  }

  // =============================================================
  // VFX — PARTICLES, HIT CONFIRMATION AND TRANSFORMATIONS
  // =============================================================
  class VFXManager {
    constructor() {
      this.scene = null;
      this.removeObject = null;
      this.effects = [];
      this.reducedMotion = false;
      // Audit QA #20 : Object Pooling pour particules réutilisables (zéro allocation par frame)
      this.particleMeshPool = [];
      this.sharedSphereGeo = null;
      this.sharedMatCache = new Map();
    }

    init(scene, removeObject) {
      this.scene = scene;
      this.removeObject = removeObject;
    }

    setReducedMotion(reduced) {
      this.reducedMotion = !!reduced;
      if (!this.reducedMotion || this.effects.length === 0) return;
      this.clear(true);
    }

    getMaterial(color) {
      if (!this.sharedMatCache.has(color)) {
        this.sharedMatCache.set(color, new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.88,
          depthWrite: false
        }));
      }
      return this.sharedMatCache.get(color);
    }

    getParticle(scale, color) {
      if (typeof THREE === 'undefined') return null;
      if (!this.sharedSphereGeo) {
        this.sharedSphereGeo = new THREE.SphereGeometry(1, 5, 5);
      }
      let particle = this.particleMeshPool.pop();
      if (!particle) {
        particle = new THREE.Mesh(this.sharedSphereGeo, this.getMaterial(color).clone());
      } else {
        if (particle.material.color) particle.material.color.setHex(color);
        particle.material.opacity = 0.88;
      }
      const s = scale * (0.6 + Math.random());
      particle.scale.set(s, s, s);
      return particle;
    }

    clear(resolveProjectiles = false) {
      const effects = this.effects.splice(0, this.effects.length);
      for (const effect of effects) {
        if (effect.burst && effect.group && this.particleMeshPool.length < 180) {
          while (effect.group.children.length > 0) {
            const p = effect.group.children.pop();
            this.particleMeshPool.push(p);
          }
        }
        if (effect.burst && effect.group && this.particleMeshPool.length < 180) {
          while (effect.group.children.length > 0) {
            const p = effect.group.children.pop();
            this.particleMeshPool.push(p);
          }
        }
        if (effect.texture) effect.texture.dispose();
        if (effect.group?.material?.dispose) effect.group.material.dispose();
        if (this.removeObject) this.removeObject(effect.group);
        else effect.group.parent?.remove(effect.group);
        if (
          resolveProjectiles &&
          effect.projectile &&
          typeof effect.onImpact === 'function'
        ) {
          effect.onImpact();
        }
      }
    }

    burst(x, z, color = 0x39ff14, count = 18, scale = 0.15, height = 1.2) {
      if (this.reducedMotion || !this.scene || typeof THREE === 'undefined') return;
      const group = new THREE.Group();
      for (let index = 0; index < count; index++) {
        const particle = this.getParticle(scale, color);
        if (!particle) continue;
        particle.position.set(0, height, 0);
        particle.userData.velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 7,
          1.5 + Math.random() * 5,
          (Math.random() - 0.5) * 7
        );
        group.add(particle);
      }
      group.position.set(x, 0, z);
      this.scene.add(group);
      this.effects.push({ group, age: 0, lifetime: 0.72 + Math.random() * 0.35, burst: true });
    }

    ring(x, z, color = 0xa855f7, radius = 3) {
      if (this.reducedMotion || !this.scene || typeof THREE === 'undefined') return;
      const mesh = new THREE.Mesh(
        new THREE.RingGeometry(radius * 0.6, radius, 32),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, 0.1, z);
      this.scene.add(mesh);
      this.effects.push({ group: mesh, age: 0, lifetime: 0.9, ring: true });
    }

    projectile({
      startX,
      startY = 2.4,
      startZ,
      endX,
      endY = 1.2,
      endZ,
      color = 0x38bdf8,
      scale = 0.12,
      speed = 42,
      acid = false,
      onImpact = null
    }) {
      if (this.reducedMotion || !this.scene || typeof THREE === 'undefined') {
        if (typeof onImpact === 'function') onImpact();
        return;
      }
      const start = new THREE.Vector3(startX, startY, startZ);
      const end = new THREE.Vector3(endX, endY, endZ);
      const distance = Math.max(0.01, start.distanceTo(end));
      const group = new THREE.Group();
      const projectile = acid
        ? new THREE.Mesh(
          new THREE.SphereGeometry(scale * 1.8, 10, 10),
          new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: 1.9,
            transparent: true,
            opacity: 0.92,
            roughness: 0.18
          })
        )
        : new THREE.Mesh(
          new THREE.CylinderGeometry(scale * 0.38, scale * 0.64, Math.max(0.78, scale * 8), 7),
          new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.96,
            depthWrite: false
          })
        );
      if (!acid) {
        const direction = end.clone().sub(start).normalize();
        projectile.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
      }
      group.add(projectile);
      if (acid) {
        const light = new THREE.PointLight(color, 2.1, 7);
        group.add(light);
      } else {
        const tracerLight = new THREE.PointLight(color, 1.25, 4.5);
        group.add(tracerLight);
      }
      group.position.copy(start);
      this.scene.add(group);
      this.effects.push({
        group,
        age: 0,
        lifetime: Math.max(0.08, distance / Math.max(1, speed)),
        projectile: true,
        acid,
        color,
        scale,
        start,
        end,
        onImpact
      });
    }

    muzzleFlash(x, y, z, color = 0xfbbf24, scale = 0.18) {
      if (this.reducedMotion || !this.scene || typeof THREE === 'undefined') return;
      const group = new THREE.Group();
      const flash = new THREE.Mesh(
        new THREE.SphereGeometry(scale, 7, 7),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 1,
          depthWrite: false
        })
      );
      flash.scale.set(0.7, 0.7, 2.8);
      group.add(flash);
      const light = new THREE.PointLight(color, 3.4, 8);
      group.add(light);
      group.position.set(x, y, z);
      this.scene.add(group);
      this.effects.push({ group, age: 0, lifetime: 0.13, flash: true });
    }

    flameJet(startX, startY, startZ, endX, endY, endZ) {
      if (this.reducedMotion || !this.scene || typeof THREE === 'undefined') return;
      const start = new THREE.Vector3(startX, startY, startZ);
      const end = new THREE.Vector3(endX, endY, endZ);
      const group = new THREE.Group();
      for (let index = 0; index < 22; index++) {
        const progress = index / 21;
        const material = new THREE.MeshBasicMaterial({
          color: progress < 0.35 ? 0xfff1a8 : (progress < 0.72 ? 0xff8a16 : 0xef2b16),
          transparent: true,
          opacity: 0.86 * (1 - progress * 0.45),
          depthWrite: false
        });
        const particle = new THREE.Mesh(
          new THREE.SphereGeometry(0.12 + progress * 0.24, 7, 7),
          material
        );
        particle.position.lerpVectors(start, end, progress);
        particle.position.x += (Math.random() - 0.5) * (0.18 + progress * 0.7);
        particle.position.y += (Math.random() - 0.5) * (0.14 + progress * 0.5);
        particle.position.z += (Math.random() - 0.5) * (0.18 + progress * 0.7);
        particle.userData.baseOpacity = material.opacity;
        group.add(particle);
      }
      this.scene.add(group);
      this.effects.push({ group, age: 0, lifetime: 0.42, flame: true });
    }

    organicTrail(startX, startY, startZ, endX, endY, endZ, color = 0xd97706) {
      if (this.reducedMotion || !this.scene || typeof THREE === 'undefined') return;
      const start = new THREE.Vector3(startX, startY, startZ);
      const end = new THREE.Vector3(endX, endY, endZ);
      const group = new THREE.Group();
      for (let index = 0; index < 12; index++) {
        const progress = index / 11;
        const particle = new THREE.Mesh(
          new THREE.SphereGeometry(0.06 + progress * 0.045, 6, 6),
          new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.78 * (1 - progress * 0.5),
            depthWrite: false
          })
        );
        particle.position.lerpVectors(start, end, progress);
        particle.userData.baseOpacity = particle.material.opacity;
        group.add(particle);
      }
      this.scene.add(group);
      this.effects.push({ group, age: 0, lifetime: 0.38, trail: true });
    }

    floatingText(x, y, z, text, color = '#ef4444', isCrit = false) {
      if (this.reducedMotion || !this.scene || typeof THREE === 'undefined') return;
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 96;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.font = isCrit ? '900 48px monospace' : '700 38px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 6;
      ctx.strokeText(text, 128, 48);
      ctx.fillStyle = color;
      ctx.fillText(text, 128, 48);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 1.0,
        depthTest: false
      });
      const sprite = new THREE.Sprite(spriteMat);
      const scale = isCrit ? 3.4 : 2.6;
      sprite.scale.set(scale, scale * 0.38, 1);
      sprite.position.set(x + (Math.random() - 0.5) * 0.4, y, z + (Math.random() - 0.5) * 0.4);
      this.scene.add(sprite);
      this.effects.push({
        group: sprite,
        sprite: true,
        texture,
        age: 0,
        lifetime: 0.92,
        speedY: isCrit ? 2.8 : 2.2
      });
    }

    fleshImpact(x, z, color = 0xb91c1c, count = 16) {
      if (this.reducedMotion || !this.scene || typeof THREE === 'undefined') return;
      const group = new THREE.Group();
      for (let i = 0; i < count; i++) {
        const geo = new THREE.SphereGeometry(0.12 * (0.6 + Math.random()), 5, 5);
        const mat = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.95,
          depthWrite: false
        });
        const p = new THREE.Mesh(geo, mat);
        p.position.set(0, 1.6 + Math.random() * 0.6, 0);
        p.userData.velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 9,
          2.0 + Math.random() * 4,
          (Math.random() - 0.5) * 9
        );
        group.add(p);
      }
      group.position.set(x, 0, z);
      this.scene.add(group);
      this.effects.push({ group, age: 0, lifetime: 0.65 });
    }

    // Chantier 115 : Épanchement de Fluide Blanc Laiteux des Synthétiques (Ash Alien 1979 / Bishop Aliens 1986 / Rook Romulus)
    syntheticBleed(x, y, z, count = 20) {
      if (this.reducedMotion || !this.scene || typeof THREE === 'undefined') return;
      const group = new THREE.Group();
      const whiteColors = [0xf8fafc, 0xffffff, 0xe2e8f0, 0xf1f5f9];
      for (let i = 0; i < count; i++) {
        const radius = 0.11 * (0.6 + Math.random() * 0.7);
        const geo = new THREE.SphereGeometry(radius, 6, 6);
        const color = whiteColors[Math.floor(Math.random() * whiteColors.length)];
        const mat = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.95,
          depthWrite: false
        });
        const p = new THREE.Mesh(geo, mat);
        p.position.set(
          (Math.random() - 0.5) * 0.3,
          (y || 1.3) + (Math.random() - 0.5) * 0.35,
          (Math.random() - 0.5) * 0.3
        );
        p.userData.velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 8.5,
          1.8 + Math.random() * 4.2,
          (Math.random() - 0.5) * 8.5
        );
        group.add(p);
      }
      group.position.set(x, 0, z);
      this.scene.add(group);
      this.effects.push({ group, age: 0, lifetime: 0.75 });
    }

    // Chantier 119 : Vortex Aérien de Dépressurisation de Sas Vers le Vide Spatial
    airlockVortex(x, z, targetX, targetZ, count = 16) {
      if (this.reducedMotion || !this.scene || typeof THREE === 'undefined') return;
      const group = new THREE.Group();
      const dx = targetX - x;
      const dz = targetZ - z;
      const dist = Math.hypot(dx, dz) || 1;
      const dirX = dx / dist;
      const dirZ = dz / dist;
      for (let i = 0; i < count; i++) {
        const geo = new THREE.SphereGeometry(0.14 * (0.7 + Math.random() * 0.6), 6, 6);
        const mat = new THREE.MeshBasicMaterial({
          color: Math.random() < 0.65 ? 0xbae6fd : 0x38bdf8,
          transparent: true,
          opacity: 0.85,
          depthWrite: false
        });
        const p = new THREE.Mesh(geo, mat);
        p.position.set(
          (Math.random() - 0.5) * 2.5,
          0.8 + Math.random() * 2.2,
          (Math.random() - 0.5) * 2.5
        );
        p.userData.velocity = new THREE.Vector3(
          dirX * (14 + Math.random() * 8) + (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 2.0,
          dirZ * (14 + Math.random() * 8) + (Math.random() - 0.5) * 3
        );
        group.add(p);
      }
      group.position.set(x, 0, z);
      this.scene.add(group);
      this.effects.push({ group, age: 0, lifetime: 0.6 });
    }

    salivaDrip(x, y, z, count = 2) {
      if (this.reducedMotion || !this.scene || typeof THREE === 'undefined') return;
      const group = new THREE.Group();
      for (let index = 0; index < count; index++) {
        const dropGeo = new THREE.SphereGeometry(0.045, 6, 6);
        const dropMat = new THREE.MeshBasicMaterial({
          color: 0xf1f5f9,
          transparent: true,
          opacity: 0.82,
          depthWrite: false
        });
        const drop = new THREE.Mesh(dropGeo, dropMat);
        drop.scale.set(0.65, 2.2, 0.65);
        drop.position.set(
          (Math.random() - 0.5) * 0.14,
          y - index * 0.12,
          (Math.random() - 0.5) * 0.14
        );
        drop.userData.vy = -3.4 - Math.random() * 1.6;
        group.add(drop);
      }
      group.position.set(x, 0, z);
      this.scene.add(group);
      this.effects.push({ group, age: 0, lifetime: 0.72, drip: true, startY: y });
    }

    spawnAcidPool(x, z, radius = 1.5, duration = 8.5) {
      if (this.reducedMotion || !this.scene || typeof THREE === 'undefined') return;
      const group = new THREE.Group();
      const poolGeo = new THREE.CircleGeometry(radius, 24);
      const poolMat = new THREE.MeshBasicMaterial({
        color: 0x39ff14,
        transparent: true,
        opacity: 0.68,
        depthWrite: false
      });
      const poolMesh = new THREE.Mesh(poolGeo, poolMat);
      poolMesh.rotation.x = -Math.PI / 2;
      poolMesh.position.y = 0.032;
      group.add(poolMesh);

      const bubbles = [];
      for (let i = 0; i < 6; i++) {
        const bGeo = new THREE.SphereGeometry(0.07 + Math.random() * 0.07, 6, 6);
        const bMat = new THREE.MeshBasicMaterial({
          color: 0xa3e635,
          transparent: true,
          opacity: 0.85
        });
        const b = new THREE.Mesh(bGeo, bMat);
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.random() * (radius * 0.75);
        b.position.set(Math.cos(ang) * dist, 0.04, Math.sin(ang) * dist);
        b.userData.phase = Math.random() * Math.PI * 2;
        bubbles.push(b);
        group.add(b);
      }

      for (let i = 0; i < 3; i++) {
        const sGeo = new THREE.SphereGeometry(0.12, 5, 5);
        const sMat = new THREE.MeshBasicMaterial({
          color: 0x84cc16,
          transparent: true,
          opacity: 0.42,
          depthWrite: false
        });
        const s = new THREE.Mesh(sGeo, sMat);
        s.position.set((Math.random() - 0.5) * radius * 0.8, 0.2 + Math.random() * 0.25, (Math.random() - 0.5) * radius * 0.8);
        group.add(s);
      }

      group.position.set(x, 0, z);
      this.scene.add(group);
      this.effects.push({
        group,
        age: 0,
        lifetime: duration,
        acidPool: true,
        radius,
        x,
        z,
        bubbles
      });
    }

    // Persistance de fumees acides corrosives rongeant le metal avec bulles caustiques montantes
    persistentCorrosiveFumes(x, z, duration = 6.0) {
      if (this.reducedMotion || !this.scene || typeof THREE === 'undefined') return;
      const group = new THREE.Group();
      const radius = 1.8;
      for (let i = 0; i < 14; i++) {
        const size = 0.35 + Math.random() * 0.45;
        const geo = new THREE.SphereGeometry(size, 7, 7);
        const smokeColor = Math.random() < 0.6 ? 0x84cc16 : (Math.random() < 0.5 ? 0xa3e635 : 0x4d7c0f);
        const mat = new THREE.MeshBasicMaterial({
          color: smokeColor,
          transparent: true,
          opacity: 0.32 + Math.random() * 0.22,
          depthWrite: false
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
          (Math.random() - 0.5) * radius * 1.5,
          0.15 + Math.random() * 0.7,
          (Math.random() - 0.5) * radius * 1.5
        );
        mesh.userData.isSmoke = true;
        mesh.userData.baseOpacity = mat.opacity;
        mesh.userData.vy = 0.4 + Math.random() * 0.5;
        mesh.userData.vx = (Math.random() - 0.5) * 0.22;
        mesh.userData.vz = (Math.random() - 0.5) * 0.22;
        group.add(mesh);
      }
      for (let i = 0; i < 8; i++) {
        const bGeo = new THREE.SphereGeometry(0.06 + Math.random() * 0.06, 6, 6);
        const bMat = new THREE.MeshBasicMaterial({
          color: 0xecfccb,
          transparent: true,
          opacity: 0.9,
          depthWrite: false
        });
        const bubble = new THREE.Mesh(bGeo, bMat);
        bubble.position.set(
          (Math.random() - 0.5) * radius * 0.9,
          0.04 + Math.random() * 0.15,
          (Math.random() - 0.5) * radius * 0.9
        );
        bubble.userData.isBubble = true;
        bubble.userData.phase = Math.random() * Math.PI * 2;
        bubble.userData.vy = 0.4 + Math.random() * 0.35;
        group.add(bubble);
      }
      const light = new THREE.PointLight(0xa3e635, 2.2, 6.0);
      light.position.set(0, 0.4, 0);
      group.add(light);

      group.position.set(x, 0, z);
      this.scene.add(group);
      this.effects.push({
        group,
        age: 0,
        lifetime: duration,
        corrosiveFumes: true,
        radius,
        light
      });
    }

    // Etincelles d'impact de ricochets balistiques sur la chitine blindee
    ballisticRicochetSparks(x, y = 1.4, z, normalX = 0, normalY = 1, normalZ = 0, count = 16) {
      if (this.reducedMotion || !this.scene || typeof THREE === 'undefined') return;
      const group = new THREE.Group();
      const sparkColors = [0xfff7ed, 0xfef08a, 0xfbbf24, 0xf97316];
      for (let i = 0; i < count; i++) {
        const size = 0.04 + Math.random() * 0.04;
        const geo = new THREE.SphereGeometry(size, 4, 4);
        const col = sparkColors[Math.floor(Math.random() * sparkColors.length)];
        const mat = new THREE.MeshBasicMaterial({
          color: col,
          transparent: true,
          opacity: 1.0,
          depthWrite: false
        });
        const spark = new THREE.Mesh(geo, mat);
        spark.position.set(0, y, 0);
        const speed = 7.0 + Math.random() * 8.5;
        const spreadX = (Math.random() - 0.5) * 6.0;
        const spreadY = 2.0 + Math.random() * 6.0;
        const spreadZ = (Math.random() - 0.5) * 6.0;
        spark.userData.velocity = new THREE.Vector3(
          normalX * speed * 0.6 + spreadX,
          Math.max(1.5, normalY * speed * 0.6 + spreadY),
          normalZ * speed * 0.6 + spreadZ
        );
        group.add(spark);
      }
      group.position.set(x, 0, z);
      this.scene.add(group);
      this.effects.push({
        group,
        age: 0,
        lifetime: 0.38 + Math.random() * 0.2,
        ricochetSparks: true
      });
    }

    spawnSteamCloud(x, y, z, duration = 3.6) {
      if (this.reducedMotion || !this.scene || typeof THREE === 'undefined') return;
      const group = new THREE.Group();
      for (let i = 0; i < 9; i++) {
        const sGeo = new THREE.SphereGeometry(0.35 + Math.random() * 0.4, 6, 6);
        const sMat = new THREE.MeshBasicMaterial({
          color: 0x94a3b8,
          transparent: true,
          opacity: 0.38,
          depthWrite: false
        });
        const m = new THREE.Mesh(sGeo, sMat);
        m.position.set((Math.random() - 0.5) * 1.8, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 1.8);
        m.userData.vy = 0.6 + Math.random() * 0.8;
        m.userData.vx = (Math.random() - 0.5) * 0.5;
        m.userData.vz = (Math.random() - 0.5) * 0.5;
        group.add(m);
      }
      group.position.set(x, y, z);
      this.scene.add(group);
      this.effects.push({
        group,
        age: 0,
        lifetime: duration,
        steamCloud: true,
        x,
        z,
        radius: 2.8
      });
    }

    spawnWallCocoon(x, y, z) {
      if (!this.scene || typeof THREE === 'undefined') return;
      const group = new THREE.Group();
      const resinMat = new THREE.MeshStandardMaterial({
        color: 0x2e1065,
        emissive: 0x581c87,
        emissiveIntensity: 0.85,
        roughness: 0.3,
        metalness: 0.6
      });
      const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.48, 2.5, 8), resinMat);
      pod.position.set(0, 1.35, 0);
      group.add(pod);

      for (let i = 0; i < 6; i++) {
        const tendon = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.15, 2.4, 6), resinMat);
        const a = (i / 6) * Math.PI * 2;
        tendon.position.set(Math.cos(a) * 0.72, 1.35, Math.sin(a) * 0.72);
        tendon.rotation.z = Math.sin(a) * 0.38;
        group.add(tendon);
      }
      group.position.set(x, y, z);
      this.scene.add(group);
      return group;
    }

    transformation() {
      if (this.reducedMotion) return;
      const app = document.getElementById('app-container');
      app?.classList.add('transformation-flash');
      window.setTimeout(() => app?.classList.remove('transformation-flash'), 750);
    }

    // Mission Wave 4 : Onde de Choc Sismique au Sol pour Castes Lourdes (Reine, Crusher, Titan, Predalien)
    groundSlamShockwave(x, z, radius = 5.5, color = 0x39ff14) {
      if (this.reducedMotion || !this.scene || typeof THREE === 'undefined') return;
      const group = new THREE.Group();
      const ringGeo = new THREE.RingGeometry(0.18, 0.42, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        depthWrite: false
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      group.add(ring);
      group.position.set(x, 0.04, z);
      this.scene.add(group);
      this.effects.push({
        group,
        groundShockwave: true,
        ringMesh: ring,
        maxRadius: radius,
        age: 0,
        lifetime: 0.55
      });
      this.burst(x, z, 0x64748b, 20, 0.12, 0.5);
    }

    // Mission Wave 4 : Rupture de Flexibles Hydrauliques Haute Pression (MANTIS-4 & Exosuit P-5000)
    hydraulicSpurt(x, y = 1.4, z, count = 18) {
      if (this.reducedMotion || !this.scene || typeof THREE === 'undefined') return;
      const group = new THREE.Group();
      const darkMat = this.getMaterial(0x0f172a);
      const sparkMat = this.getMaterial(0xf59e0b);
      for (let i = 0; i < count; i++) {
        const isSpark = Math.random() < 0.25;
        const mat = isSpark ? sparkMat : darkMat;
        const p = this.getParticle(isSpark ? 0.06 : 0.12, isSpark ? 0xf59e0b : 0x0f172a);
        p.position.set(0, 0, 0);
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.0 + Math.random() * 3.5;
        p.userData.velocity = new THREE.Vector3(
          Math.cos(angle) * speed,
          1.5 + Math.random() * 2.5,
          Math.sin(angle) * speed
        );
        group.add(p);
      }
      group.position.set(x, y, z);
      this.scene.add(group);
      this.effects.push({
        group,
        burst: true,
        age: 0,
        lifetime: 0.65
      });
    }

    // Mission Wave 4 : Fumée Thermique de Surchauffe Canon UA 571-C
    barrelHeatSmoke(x, y = 1.0, z, count = 8) {
      if (this.reducedMotion || !this.scene || typeof THREE === 'undefined') return;
      const group = new THREE.Group();
      const smokeMat = new THREE.MeshBasicMaterial({
        color: 0x94a3b8,
        transparent: true,
        opacity: 0.45,
        depthWrite: false
      });
      for (let i = 0; i < count; i++) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), smokeMat);
        p.position.set((Math.random() - 0.5) * 0.12, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.12);
        p.userData.vy = 0.65 + Math.random() * 0.55;
        p.userData.vx = (Math.random() - 0.5) * 0.18;
        p.userData.vz = (Math.random() - 0.5) * 0.18;
        group.add(p);
      }
      group.position.set(x, y, z);
      this.scene.add(group);
      this.effects.push({
        group,
        barrelSmoke: true,
        age: 0,
        lifetime: 0.85
      });
    }

    // Mission Wave 5 : Chute de Gouttelettes de Spores et Sève de Résine (Ruche Primaire)
    sporeDrip(x, z, count = 6) {
      if (this.reducedMotion || !this.scene || typeof THREE === 'undefined') return;
      const group = new THREE.Group();
      const dripMat = new THREE.MeshBasicMaterial({
        color: 0xa855f7,
        transparent: true,
        opacity: 0.75,
        depthWrite: false
      });
      for (let i = 0; i < count; i++) {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 0.16, 6), dripMat);
        p.position.set(
          (Math.random() - 0.5) * 3.5,
          3.5 + Math.random() * 0.5,
          (Math.random() - 0.5) * 3.5
        );
        p.userData.vy = -(2.0 + Math.random() * 1.5);
        group.add(p);
      }
      group.position.set(x, 0, z);
      this.scene.add(group);
      this.effects.push({
        group,
        sporeDrip: true,
        age: 0,
        lifetime: 1.6
      });
    }

    // Mission Wave 5 : Brume Bleutée Volumétrique Basse du Derelict / Space Jockey
    derelictMist(x, z, count = 12) {
      if (this.reducedMotion || !this.scene || typeof THREE === 'undefined') return;
      const group = new THREE.Group();
      const mistMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.28,
        depthWrite: false
      });
      for (let i = 0; i < count; i++) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.35 + Math.random() * 0.3, 8, 8), mistMat);
        p.position.set(
          (Math.random() - 0.5) * 6.0,
          0.15 + Math.random() * 0.2,
          (Math.random() - 0.5) * 6.0
        );
        p.userData.vx = (Math.random() - 0.5) * 0.35;
        p.userData.vz = (Math.random() - 0.5) * 0.35;
        group.add(p);
      }
      group.position.set(x, 0, z);
      this.scene.add(group);
      this.effects.push({
        group,
        derelictMist: true,
        age: 0,
        lifetime: 2.2
      });
    }

    // Mission Wave 5 : Échappement de Vapeur Cryogénique Caissons MU/TH/UR Nostromo
    cryoVaporPlume(x, y = 1.0, z, count = 8) {
      if (this.reducedMotion || !this.scene || typeof THREE === 'undefined') return;
      const group = new THREE.Group();
      const vaporMat = new THREE.MeshBasicMaterial({
        color: 0xe0f2fe,
        transparent: true,
        opacity: 0.42,
        depthWrite: false
      });
      for (let i = 0; i < count; i++) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.12 + Math.random() * 0.1, 6, 6), vaporMat);
        p.position.set((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.3);
        p.userData.vy = 0.55 + Math.random() * 0.65;
        p.userData.vx = (Math.random() - 0.5) * 0.25;
        p.userData.vz = (Math.random() - 0.5) * 0.25;
        group.add(p);
      }
      group.position.set(x, y, z);
      this.scene.add(group);
      this.effects.push({
        group,
        cryoVapor: true,
        age: 0,
        lifetime: 1.4
      });
    }

    // Mission Wave 5 : Étincelles de Boîtier Électrique Sinistré Hadley's Hope
    electricalJunctionSpark(x, y = 1.6, z, count = 8) {
      if (this.reducedMotion || !this.scene || typeof THREE === 'undefined') return;
      const group = new THREE.Group();
      for (let i = 0; i < count; i++) {
        const isArc = Math.random() < 0.35;
        const p = this.getParticle(isArc ? 0.05 : 0.08, isArc ? 0x38bdf8 : 0xf59e0b);
        p.position.set(0, 0, 0);
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.8 + Math.random() * 2.8;
        p.userData.velocity = new THREE.Vector3(
          Math.cos(angle) * speed,
          -0.8 + Math.random() * 1.8,
          Math.sin(angle) * speed
        );
        group.add(p);
      }
      group.position.set(x, y, z);
      this.scene.add(group);
      this.effects.push({
        group,
        burst: true,
        age: 0,
        lifetime: 0.45
      });
    }

    // Mission Wave 6 : Onde d'Impulsion Synaptique Télépathique de la Ruche
    hiveSynapticRipple(x, z, color = 0x39ff14, maxRadius = 14) {
      if (this.reducedMotion || !this.scene || typeof THREE === 'undefined') return;
      const group = new THREE.Group();
      const ringGeo = new THREE.RingGeometry(0.25, 0.65, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        depthWrite: false
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      group.add(ring);
      group.position.set(x, 0.03, z);
      this.scene.add(group);
      this.effects.push({
        group,
        synapticRipple: true,
        ringMesh: ring,
        maxRadius,
        age: 0,
        lifetime: 0.75
      });
    }

    // Mission Wave 7 : Onde Expansive de Cristallisation Cryogénique
    cryoFrostFlash(x, z, maxRadius = 3.8) {
      if (this.reducedMotion || !this.scene || typeof THREE === 'undefined') return;
      const group = new THREE.Group();
      const ringGeo = new THREE.RingGeometry(0.3, 0.7, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xbae6fd,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
        depthWrite: false
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      group.add(ring);
      group.position.set(x, 0.04, z);
      this.scene.add(group);
      this.effects.push({
        group,
        cryoFrostFlash: true,
        ringMesh: ring,
        maxRadius,
        age: 0,
        lifetime: 0.85
      });
    }

    // Mission Wave 8 : Éjection Diégétique d'Étuis en Laiton M41A & Armes USCM
    ejectBulletCasing(x, y = 1.25, z, facingAngle = 0) {
      if (this.reducedMotion || !this.scene || typeof THREE === 'undefined') return;
      const casingGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.05, 6);
      const casingMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        roughness: 0.35,
        metalness: 0.85
      });
      const casingMesh = new THREE.Mesh(casingGeo, casingMat);
      const ejectAngle = facingAngle + Math.PI / 2 + (Math.random() - 0.5) * 0.45;
      const speed = 1.6 + Math.random() * 1.2;
      const vx = Math.cos(ejectAngle) * speed;
      const vz = Math.sin(ejectAngle) * speed;
      const vy = 1.2 + Math.random() * 0.8;

      casingMesh.position.set(x, y, z);
      casingMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      this.scene.add(casingMesh);

      this.effects.push({
        group: casingMesh,
        bulletCasing: true,
        vx,
        vy,
        vz,
        rotSpeedX: (Math.random() - 0.5) * 22,
        rotSpeedZ: (Math.random() - 0.5) * 22,
        hasPinged: false,
        groundY: 0.02,
        age: 0,
        lifetime: 3.5
      });
    }

    update(deltaSeconds) {
      for (let index = this.effects.length - 1; index >= 0; index--) {
        const effect = this.effects[index];
        effect.age += deltaSeconds;
        const progress = Math.min(1, effect.age / effect.lifetime);
        if (effect.projectile) {
          const easedProgress = 1 - Math.pow(1 - progress, 2);
          effect.group.position.lerpVectors(effect.start, effect.end, easedProgress);
          if (effect.acid) {
            const pulse = 0.82 + Math.sin(effect.age * 34) * 0.18;
            effect.group.scale.setScalar(pulse);
          }
        } else if (effect.sprite) {
          effect.group.position.y += (effect.speedY || 2.2) * deltaSeconds;
          if (effect.group.material) {
            effect.group.material.opacity = Math.max(0, 1 - Math.pow(progress, 1.6));
          }
        } else if (effect.ring) {
          effect.group.scale.setScalar(1 + progress * 1.8);
          effect.group.material.opacity = 0.8 * (1 - progress);
        } else if (effect.flash) {
          effect.group.scale.setScalar(1 + progress * 1.8);
          effect.group.children.forEach((child) => {
            if (child.material) child.material.opacity = 1 - progress;
            if (child.isLight) child.intensity = 3.4 * (1 - progress);
          });
        } else if (effect.flame || effect.trail) {
          effect.group.children.forEach((particle) => {
            if (!particle.material) return;
            particle.material.opacity = (particle.userData.baseOpacity || 0.8) * (1 - progress);
            if (effect.flame) {
              particle.position.y += deltaSeconds * (0.35 + progress);
              particle.scale.setScalar(1 + progress * 0.7);
            }
          });
        } else if (effect.groundShockwave) {
          effect.group.scale.setScalar(0.2 + progress * (effect.maxRadius * 2.4));
          if (effect.ringMesh?.material) effect.ringMesh.material.opacity = Math.max(0, 0.85 * (1 - progress));
        } else if (effect.synapticRipple) {
          effect.group.scale.setScalar(0.2 + progress * (effect.maxRadius * 1.8));
          if (effect.ringMesh?.material) effect.ringMesh.material.opacity = Math.max(0, 0.85 * (1 - progress));
        } else if (effect.cryoFrostFlash) {
          effect.group.scale.setScalar(0.25 + progress * (effect.maxRadius * 1.6));
          if (effect.ringMesh?.material) effect.ringMesh.material.opacity = Math.max(0, 0.9 * (1 - progress));
        } else if (effect.bulletCasing) {
          effect.group.position.x += effect.vx * deltaSeconds;
          effect.group.position.z += effect.vz * deltaSeconds;
          if (effect.group.position.y > effect.groundY) {
            effect.vy -= 9.8 * deltaSeconds;
            effect.group.position.y += effect.vy * deltaSeconds;
            effect.group.rotation.x += effect.rotSpeedX * deltaSeconds;
            effect.group.rotation.z += effect.rotSpeedZ * deltaSeconds;
          } else {
            effect.group.position.y = effect.groundY;
            effect.vx *= 0.25;
            effect.vz *= 0.25;
            if (!effect.hasPinged) {
              effect.hasPinged = true;
              audioManager.playBrassCasingPing?.(effect.group.position.x, effect.group.position.z);
            }
          }
        } else if (effect.barrelSmoke) {
          effect.group.children.forEach((p) => {
            p.position.y += p.userData.vy * deltaSeconds;
            p.position.x += p.userData.vx * deltaSeconds;
            p.position.z += p.userData.vz * deltaSeconds;
            p.scale.addScalar(deltaSeconds * 0.45);
            if (p.material) p.material.opacity = Math.max(0, 0.45 * (1 - progress));
          });
        } else if (effect.sporeDrip) {
          effect.group.children.forEach((p) => {
            p.position.y += p.userData.vy * deltaSeconds;
            if (p.material) p.material.opacity = Math.max(0, 0.75 * (1 - progress));
          });
        } else if (effect.derelictMist) {
          effect.group.children.forEach((p) => {
            p.position.x += p.userData.vx * deltaSeconds;
            p.position.z += p.userData.vz * deltaSeconds;
            p.scale.addScalar(deltaSeconds * 0.25);
            if (p.material) p.material.opacity = Math.max(0, 0.28 * (1 - progress));
          });
        } else if (effect.cryoVapor) {
          effect.group.children.forEach((p) => {
            p.position.y += p.userData.vy * deltaSeconds;
            p.position.x += p.userData.vx * deltaSeconds;
            p.position.z += p.userData.vz * deltaSeconds;
            p.scale.addScalar(deltaSeconds * 0.35);
            if (p.material) p.material.opacity = Math.max(0, 0.42 * (1 - progress));
          });
        } else if (effect.steamCloud) {
          effect.group.children.forEach((p) => {
            p.position.y += p.userData.vy * deltaSeconds;
            p.position.x += p.userData.vx * deltaSeconds;
            p.position.z += p.userData.vz * deltaSeconds;
            p.scale.addScalar(deltaSeconds * 0.55);
            if (p.material) p.material.opacity = Math.max(0, 0.38 * (1 - progress));
          });
        } else if (effect.drip) {
          effect.group.children.forEach((drop) => {
            drop.position.y += drop.userData.vy * deltaSeconds;
            if (drop.position.y <= 0.04) {
              drop.position.y = 0.04;
              drop.scale.set(1.6, 0.08, 1.6);
            }
            if (drop.material) drop.material.opacity = 0.82 * (1 - progress);
          });
        } else if (effect.acidPool) {
          if (effect.bubbles) {
            effect.bubbles.forEach((b) => {
              b.userData.phase += deltaSeconds * 6;
              const scaleY = 0.8 + Math.sin(b.userData.phase) * 0.5;
              b.scale.set(1, Math.max(0.2, scaleY), 1);
            });
          }
          if (effect.group.children[0]?.material) {
            effect.group.children[0].material.opacity = Math.max(0, 0.68 * (1 - Math.pow(progress, 2)));
          }
          effect.damageTimer = (effect.damageTimer || 0) + deltaSeconds;
          if (effect.damageTimer >= 0.48 && window.gameInstance?.humans) {
            effect.damageTimer = 0;
            for (const h of window.gameInstance.humans) {
              if (h.isIncapacitated || h.isCocooned) continue;
              const d = Math.hypot(h.x - effect.x, h.z - effect.z);
              if (d <= effect.radius) {
                h.takeDamage?.(12);
                window.HiveSystems?.vfx?.floatingText?.(h.x, 2.2, h.z, '-12 ACIDE', '#39ff14');
                window.audioManager?.playAcidSizzle?.();
              }
            }
          }
        } else if (effect.corrosiveFumes) {
          effect.group.children.forEach((p) => {
            if (p.userData.isBubble) {
              p.userData.phase = (p.userData.phase || 0) + deltaSeconds * 5.0;
              p.position.y += p.userData.vy * deltaSeconds;
              const scale = Math.max(0.1, 1 + Math.sin(p.userData.phase) * 0.4);
              p.scale.set(scale, scale, scale);
              if (p.position.y > 0.48) {
                p.position.y = 0.04;
                p.position.x = (Math.random() - 0.5) * effect.radius * 0.9;
                p.position.z = (Math.random() - 0.5) * effect.radius * 0.9;
              }
            } else if (p.userData.isSmoke) {
              p.position.y += p.userData.vy * deltaSeconds;
              p.position.x += p.userData.vx * deltaSeconds;
              p.position.z += p.userData.vz * deltaSeconds;
              p.scale.addScalar(deltaSeconds * 0.32);
              if (p.material) p.material.opacity = Math.max(0, (p.userData.baseOpacity || 0.35) * (1 - progress));
            }
          });
          if (effect.light) {
            effect.light.intensity = (1 - progress) * (2.2 + Math.sin(effect.age * 12) * 0.6);
          }
        } else if (effect.ricochetSparks) {
          for (const spark of effect.group.children) {
            spark.position.addScaledVector(spark.userData.velocity, deltaSeconds);
            spark.userData.velocity.y -= 14.0 * deltaSeconds;
            if (spark.material) spark.material.opacity = Math.max(0, 1 - progress);
          }
        } else {
          for (const particle of effect.group.children) {
            particle.position.addScaledVector(particle.userData.velocity, deltaSeconds);
            particle.userData.velocity.y -= 8 * deltaSeconds;
            particle.material.opacity = 0.88 * (1 - progress);
          }
        }
        if (progress < 1) continue;
        const impact = effect.projectile
          ? {
            x: effect.end.x,
            z: effect.end.z,
            color: effect.color,
            scale: effect.scale,
            acid: effect.acid
          }
          : null;
        if (effect.burst && effect.group && this.particleMeshPool.length < 180) {
          while (effect.group.children.length > 0) {
            const p = effect.group.children.pop();
            this.particleMeshPool.push(p);
          }
        }
        if (effect.texture) effect.texture.dispose();
        if (effect.group?.material?.dispose) effect.group.material.dispose();
        if (this.removeObject) this.removeObject(effect.group);
        else effect.group.parent?.remove(effect.group);
        this.effects.splice(index, 1);
        if (impact) {
          this.burst(
            impact.x,
            impact.z,
            impact.color,
            impact.acid ? 12 : 6,
            impact.acid ? impact.scale * 0.72 : impact.scale * 0.38,
            effect.end.y
          );
          if (typeof effect.onImpact === 'function') effect.onImpact();
        }
      }
    }
  }

  // =============================================================
  // CAMPAIGN UI — FRONT-END, OBJECTIVES, CODEX AND ENDINGS
  // =============================================================
  class CampaignUI {
    constructor(saveManager, settingsManager) {
      this.saveManager = saveManager;
      this.settingsManager = settingsManager;
      this.game = null;
      this.content = null;
      this.activeCodexCategory = 'castes';
      this.focusOrigins = new WeakMap();
      this.inertSnapshots = new Map();
      this.narrativeTimer = null;
      this.campaignActive = false;
    }

    init(game) {
      this.game = game;
      this.content = window.HIVE_CONTENT || {};
      this.settingsManager.init(game);
      this.bindFrontEnd();
      this.bindUtilityControls();
      this.bindCodex();
      this.bindPauseAndSettings();
      this.refreshContinueButton();
      this.bindThoracicObserver();
      this.setMission(1, 0);
      this.renderCodex('castes');
      const campaignMeta = document.querySelector('.front-meta');
      if (campaignMeta) {
        campaignMeta.textContent = 'Campagne solo tactique · 5 actes · sauvegarde au début de chaque acte · 3 conclusions';
      }
    }

    bindFrontEnd() {
      const boot = document.getElementById('boot-screen');
      const prologue = document.getElementById('prologue-screen');
      const difficulty = document.getElementById('difficulty-select');
      const originSelect = document.getElementById('origin-select');
      const expandedLore = document.getElementById('expanded-lore-toggle');

      this.bindCardSelectors();

      document.getElementById('btn-new-campaign')?.addEventListener('click', () => {
        const originVal = originSelect?.value || 'random';
        const save = this.saveManager.startNew(difficulty?.value || 'survivor', !!expandedLore?.checked, originVal);
        this.game?.configureCampaign?.(save);
        this.hideLayer(boot, false);
        this.showLayer(prologue, false);
        document.getElementById('btn-start-act-one')?.focus({ preventScroll: true });
      });

      document.getElementById('btn-start-act-one')?.addEventListener('click', () => {
        this.hideLayer(prologue, false);
        this.campaignActive = true;
        this.game?.startCampaign?.(1);
        this.narrative('MNEMOSYNE', 'Scan thermique actif. L’échantillon réagit aux vibrations de la salle.');
      });

      document.getElementById('btn-continue-campaign')?.addEventListener('click', () => {
        const save = this.saveManager.read();
        if (!save?.campaignStarted) return;
        this.game?.configureCampaign?.(save);
        this.hideLayer(boot, false);
        this.campaignActive = true;
        this.game?.startCampaign?.(save.stage || 1);
        this.narrative('ARCHIVE ORPHEUS', 'Dernier acte sauvegardé restauré. Reprise de la campagne au début de cet acte.');
      });

      document.getElementById('btn-open-codex-menu')?.addEventListener('click', () => {
        this.openCodex(true);
      });
    }

    bindCardSelectors() {
      const diffSelect = document.getElementById('difficulty-select');
      const originSelect = document.getElementById('origin-select');
      const diffCards = Array.from(document.querySelectorAll('.diff-card'));
      const originCards = Array.from(document.querySelectorAll('.origin-card'));

      const updateDiffCards = (val) => {
        if (!val) return;
        diffCards.forEach((card) => {
          const match = card.getAttribute('data-difficulty') === val;
          card.classList.toggle('active', match);
          card.setAttribute('aria-checked', match ? 'true' : 'false');
          const statusText = card.querySelector('.status-text');
          if (statusText) statusText.textContent = match ? 'ACTIF' : 'STANDBY';
        });
      };

      const updateOriginCards = (val) => {
        if (!val) return;
        originCards.forEach((card) => {
          const match = card.getAttribute('data-origin') === val;
          card.classList.toggle('active', match);
          card.setAttribute('aria-checked', match ? 'true' : 'false');
          const selectTag = card.querySelector('.origin-select-tag');
          if (selectTag) selectTag.textContent = match ? 'ACTIF' : 'SÉLECTIONNER';
        });
      };

      diffCards.forEach((card, index) => {
        const selectCurrent = () => {
          const val = card.getAttribute('data-difficulty');
          if (diffSelect && val) {
            diffSelect.value = val;
            diffSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }
          updateDiffCards(val);
        };

        card.addEventListener('click', selectCurrent);
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectCurrent();
          } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            const next = diffCards[(index + 1) % diffCards.length];
            next?.focus();
            const val = next?.getAttribute('data-difficulty');
            if (diffSelect && val) {
              diffSelect.value = val;
              diffSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
            updateDiffCards(val);
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = diffCards[(index - 1 + diffCards.length) % diffCards.length];
            prev?.focus();
            const val = prev?.getAttribute('data-difficulty');
            if (diffSelect && val) {
              diffSelect.value = val;
              diffSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
            updateDiffCards(val);
          }
        });
      });

      originCards.forEach((card, index) => {
        const selectCurrent = () => {
          const val = card.getAttribute('data-origin');
          if (originSelect && val) {
            originSelect.value = val;
            originSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }
          updateOriginCards(val);
        };

        card.addEventListener('click', selectCurrent);
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectCurrent();
          } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            const next = originCards[(index + 1) % originCards.length];
            next?.focus();
            const val = next?.getAttribute('data-origin');
            if (originSelect && val) {
              originSelect.value = val;
              originSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
            updateOriginCards(val);
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = originCards[(index - 1 + originCards.length) % originCards.length];
            prev?.focus();
            const val = prev?.getAttribute('data-origin');
            if (originSelect && val) {
              originSelect.value = val;
              originSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
            updateOriginCards(val);
          }
        });
      });

      diffSelect?.addEventListener('change', () => updateDiffCards(diffSelect.value));
      originSelect?.addEventListener('change', () => updateOriginCards(originSelect.value));

      if (diffSelect) updateDiffCards(diffSelect.value || 'survivor');
      if (originSelect) updateOriginCards(originSelect.value || 'random');
    }

    bindUtilityControls() {
      document.getElementById('btn-open-codex')?.addEventListener('click', () => this.openCodex(false));
      document.getElementById('btn-audio-toggle')?.addEventListener('click', () => {
        this.settingsManager.values.muted = !this.settingsManager.values.muted;
        this.settingsManager.apply();
        this.settingsManager.write();
      });
      document.getElementById('btn-pause-game')?.addEventListener('click', () => this.openPause());

      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.campaignActive) this.openPause();
      });

      window.addEventListener('keydown', (event) => {
        if (event.defaultPrevented || event.repeat) return;
        const key = event.key.toLowerCase();
        const activeSystemLayer = this.visibleSystemLayer();
        const progressModal = document.getElementById('stage-modal');
        const activeModal = activeSystemLayer || (this.isVisible(progressModal) ? progressModal : null);
        if (key === 'tab' && activeModal) {
          this.trapFocus(event, activeModal);
          return;
        }

        const target = event.target;
        const isForm = target instanceof Element && !!target.closest('input, select, textarea, [contenteditable="true"]');
        // Escape dismisses a dialog even when a slider or checkbox has focus.
        if (isForm && event.key !== 'Escape') return;

        if (this.hasBlockingProgressModal() && (key === 'c' || event.key === 'Escape')) {
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }

        if (key === 'c') {
          if (activeSystemLayer && activeSystemLayer.id !== 'codex-overlay') {
            event.preventDefault();
            return;
          }
          event.preventDefault();
          const codex = document.getElementById('codex-overlay');
          if (codex?.classList.contains('hidden')) this.openCodex(false);
          else this.closeCodex();
        }
        if (event.key === 'Escape') {
          const settings = document.getElementById('settings-overlay');
          const codex = document.getElementById('codex-overlay');
          if (!settings?.classList.contains('hidden')) this.closeSettings();
          else if (!codex?.classList.contains('hidden')) this.closeCodex();
          else if (activeSystemLayer?.id === 'pause-overlay') this.closePause();
          else if (!activeSystemLayer && this.campaignActive) this.openPause();
        }
      });
    }

    bindCodex() {
      document.getElementById('btn-close-codex')?.addEventListener('click', () => this.closeCodex());
      const tabs = Array.from(document.querySelectorAll('.codex-tab'));
      const panel = document.querySelector('.codex-layout');
      if (panel) {
        panel.id = 'codex-tabpanel';
        panel.setAttribute('role', 'tabpanel');
      }

      const activateTab = (button) => {
        const category = button.getAttribute('data-category') || 'castes';
        this.activeCodexCategory = category;
        tabs.forEach((tab) => {
          const active = tab === button;
          tab.classList.toggle('active', active);
          tab.setAttribute('aria-selected', String(active));
          tab.tabIndex = active ? 0 : -1;
        });
        panel?.setAttribute('aria-labelledby', button.id);
        this.renderCodex(category);
      };

      tabs.forEach((button, index) => {
        const category = button.getAttribute('data-category') || `category-${index}`;
        button.id = `codex-tab-${category}`;
        button.setAttribute('aria-controls', 'codex-tabpanel');
        button.tabIndex = button.classList.contains('active') ? 0 : -1;
        button.addEventListener('click', () => activateTab(button));
        button.addEventListener('keydown', (event) => {
          const horizontalKeys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
          if (!horizontalKeys.includes(event.key)) return;
          event.preventDefault();
          let nextIndex = index;
          if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
          if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
          if (event.key === 'Home') nextIndex = 0;
          if (event.key === 'End') nextIndex = tabs.length - 1;
          const nextTab = tabs[nextIndex];
          activateTab(nextTab);
          nextTab.focus({ preventScroll: true });
        });
      });
      const initiallyActiveTab = tabs.find((tab) => tab.classList.contains('active'));
      if (initiallyActiveTab) panel?.setAttribute('aria-labelledby', initiallyActiveTab.id);
    }

    bindPauseAndSettings() {
      document.getElementById('btn-resume-game')?.addEventListener('click', () => this.closePause());
      document.getElementById('btn-open-settings')?.addEventListener('click', () => this.openSettings());
      document.getElementById('btn-close-settings')?.addEventListener('click', () => this.closeSettings());
      document.getElementById('btn-return-menu')?.addEventListener('click', () => {
        this.hideLayer(document.getElementById('pause-overlay'), false);
        this.campaignActive = false;
        this.game?.returnToMenu?.();
        this.showLayer(document.getElementById('boot-screen'), false);
        this.refreshContinueButton();
        window.requestAnimationFrame(() => {
          const continueButton = document.getElementById('btn-continue-campaign');
          const target = continueButton && !continueButton.disabled
            ? continueButton
            : document.getElementById('btn-new-campaign');
          target?.focus({ preventScroll: true });
        });
      });
    }

    refreshContinueButton() {
      const save = this.saveManager.read();
      const button = document.getElementById('btn-continue-campaign');
      if (!button) return;
      button.disabled = !save?.campaignStarted;
      button.textContent = save?.campaignStarted ? `CONTINUER — ACTE ${save.stage || 1}` : 'CONTINUER — AUCUNE SAUVEGARDE';
    }

    isVisible(element) {
      return !!element && !element.classList.contains('hidden') && element.getAttribute('aria-hidden') !== 'true';
    }

    visibleSystemLayer() {
      return Array.from(document.querySelectorAll('.system-overlay')).find((layer) => this.isVisible(layer)) || null;
    }

    hasBlockingProgressModal() {
      return this.isVisible(document.getElementById('stage-modal')) ||
        this.isVisible(document.getElementById('ending-overlay'));
    }

    hasAnyVisibleModal() {
      return this.hasBlockingProgressModal() || !!this.visibleSystemLayer();
    }

    restoreInertState() {
      for (const [node, snapshot] of this.inertSnapshots) {
        if ('inert' in node) node.inert = snapshot.inert;
        if (snapshot.hadAttribute) node.setAttribute('inert', '');
        else node.removeAttribute('inert');
      }
      this.inertSnapshots.clear();
    }

    syncSystemModalIsolation() {
      this.restoreInertState();
      const activeLayer = this.visibleSystemLayer();
      const app = document.getElementById('app-container');
      if (!activeLayer || !app) return;

      Array.from(app.children).forEach((node) => {
        if (node === activeLayer) return;
        this.inertSnapshots.set(node, {
          inert: 'inert' in node ? node.inert : node.hasAttribute('inert'),
          hadAttribute: node.hasAttribute('inert')
        });
        node.setAttribute('inert', '');
        if ('inert' in node) node.inert = true;
      });
    }

    trapFocus(event, layer) {
      const selector = [
        'button:not(:disabled)',
        'select:not(:disabled)',
        'input:not(:disabled)',
        'textarea:not(:disabled)',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])'
      ].join(',');
      const focusable = Array.from(layer.querySelectorAll(selector))
        .filter((node) => !node.closest('[inert]') && (node.offsetParent !== null || node === document.activeElement));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;
      if (!layer.contains(current)) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      } else if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    }

    showLayer(element, pause = true) {
      if (!element) return false;
      const isSystemLayer = element.classList.contains('system-overlay');
      if (isSystemLayer && this.isVisible(document.getElementById('stage-modal'))) return false;

      if (isSystemLayer) {
        document.querySelectorAll('.system-overlay').forEach((layer) => {
          if (layer === element || !this.isVisible(layer)) return;
          layer.classList.add('hidden');
          layer.setAttribute('aria-hidden', 'true');
          this.focusOrigins.delete(layer);
        });
      }

      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement) this.focusOrigins.set(element, activeElement);
      element.classList.remove('hidden');
      element.setAttribute('aria-hidden', 'false');
      if (pause) this.game?.setSystemPaused?.(true);
      if (isSystemLayer) this.syncSystemModalIsolation();
      return true;
    }

    hideLayer(element, resume = true) {
      if (!element) return;
      const isSystemLayer = element.classList.contains('system-overlay');
      const focusOrigin = this.focusOrigins.get(element);
      this.focusOrigins.delete(element);
      element.classList.add('hidden');
      element.setAttribute('aria-hidden', 'true');
      if (isSystemLayer) this.syncSystemModalIsolation();
      if (resume && this.campaignActive && !this.hasAnyVisibleModal()) {
        this.game?.setSystemPaused?.(false);
      }
      if (
        focusOrigin instanceof HTMLElement &&
        focusOrigin.isConnected &&
        !focusOrigin.closest('.hidden, [inert]')
      ) {
        focusOrigin.focus({ preventScroll: true });
      }
    }

    openCodex(fromMenu = false) {
      const overlay = document.getElementById('codex-overlay');
      if (!overlay?.classList.contains('hidden')) return;
      if (this.hasBlockingProgressModal()) return;
      if (this.visibleSystemLayer()) return;
      overlay.dataset.fromMenu = String(fromMenu);
      this.renderCodex(this.activeCodexCategory);
      if (!this.showLayer(overlay, !fromMenu)) return;
      document.getElementById('btn-close-codex')?.focus({ preventScroll: true });
    }

    closeCodex() {
      const overlay = document.getElementById('codex-overlay');
      const fromMenu = overlay?.dataset.fromMenu === 'true';
      this.hideLayer(overlay, !fromMenu);
    }

    openPause() {
      if (!this.campaignActive) return;
      if (this.hasBlockingProgressModal() || this.visibleSystemLayer()) return;
      const overlay = document.getElementById('pause-overlay');
      if (!overlay?.classList.contains('hidden')) return;
      const save = this.saveManager.read();
      const summary = document.getElementById('pause-summary');
      if (summary) summary.textContent = `Acte ${save?.stage || 1} · reprise sauvegardée au début de cet acte.`;
      if (!this.showLayer(overlay, true)) return;
      document.getElementById('btn-resume-game')?.focus({ preventScroll: true });
    }

    closePause() {
      this.hideLayer(document.getElementById('pause-overlay'), true);
    }

    togglePause() {
      const overlay = document.getElementById('pause-overlay');
      if (overlay?.classList.contains('hidden')) this.openPause();
      else this.closePause();
    }

    openSettings() {
      const pause = document.getElementById('pause-overlay');
      if (!this.isVisible(pause) || this.hasBlockingProgressModal()) return;
      this.hideLayer(pause, false);
      if (!this.showLayer(document.getElementById('settings-overlay'), true)) return;
      document.getElementById('btn-close-settings')?.focus({ preventScroll: true });
    }

    closeSettings() {
      this.hideLayer(document.getElementById('settings-overlay'), false);
      if (this.campaignActive) {
        if (this.showLayer(document.getElementById('pause-overlay'), true)) {
          document.getElementById('btn-resume-game')?.focus({ preventScroll: true });
        }
      }
    }

    bindThoracicObserver() {
      const thoracicStatus = document.getElementById('thoracic-status');
      const pressureFill = document.getElementById('sternum-pressure-fill');
      const eruptButton = document.getElementById('btn-thoracic-erupt');
      if (!thoracicStatus || !pressureFill) return;
      const updateGauge = () => {
        const text = thoracicStatus.textContent || '';
        const isRuptured = text.includes('cèdent') || text.includes('Rupture') || eruptButton?.disabled;
        if (isRuptured) {
          pressureFill.style.width = '100%';
          pressureFill.classList.add('ruptured');
        } else {
          pressureFill.style.width = '75%';
          pressureFill.classList.remove('ruptured');
        }
      };
      const observer = new MutationObserver(updateGauge);
      observer.observe(thoracicStatus, { childList: true, characterData: true, subtree: true });
      if (eruptButton) {
        eruptButton.addEventListener('click', () => {
          pressureFill.style.width = '100%';
          pressureFill.classList.add('ruptured');
        });
      }
    }

    setMission(stage, completed = 0, explicitObjective = null) {
      const act = this.getAct(stage);
      const objectives = this.objectivesForAct(act);
      const missionAct = document.getElementById('mission-act');
      const missionTitle = document.getElementById('mission-title');
      const missionObjective = document.getElementById('mission-objective');
      const missionProgress = document.getElementById('mission-progress');
      const missionProgressFill = document.getElementById('mission-progress-fill');
      const playableTotals = [3, 2, 3, 4, 5];
      const playableTotal = playableTotals[Math.max(0, Math.min(4, stage - 1))];
      if (missionAct) missionAct.textContent = `ACTE ${this.roman(stage)}`;
      if (missionTitle) missionTitle.textContent = act?.title || `PHASE ${stage}`;
      if (missionObjective) {
        missionObjective.textContent = explicitObjective || objectives[Math.min(completed, Math.max(0, objectives.length - 1))] || 'Adapter la ruche à la menace.';
      }
      if (missionProgress) missionProgress.textContent = `${Math.min(completed, playableTotal)} / ${playableTotal}`;
      if (missionProgressFill) {
        const pct = Math.min(100, Math.max(0, (completed / Math.max(1, playableTotal)) * 100));
        missionProgressFill.style.width = `${pct.toFixed(1)}%`;
      }
    }

    checkpoint(stage, unlockIds = [], additions = {}) {
      if (unlockIds.length) this.saveManager.unlock(unlockIds);
      this.saveManager.checkpoint(stage, additions);
      this.setMission(stage, 0);
      this.renderCodex(this.activeCodexCategory);
    }

    updateObjective(stage, completed, objective) {
      this.setMission(stage, completed, objective);
    }

    narrative(speaker, line, duration = 5600) {
      const banner = document.getElementById('narrative-banner');
      const speakerElement = document.getElementById('narrative-speaker');
      const lineElement = document.getElementById('narrative-line');
      if (!banner || !speakerElement || !lineElement) return;
      speakerElement.textContent = speaker;
      lineElement.textContent = line;
      banner.classList.remove('hidden');
      window.clearTimeout(this.narrativeTimer);
      this.narrativeTimer = window.setTimeout(() => banner.classList.add('hidden'), duration);
      window.audioManager?.playMotherChime?.();
    }

    renderCodex(category) {
      const list = document.getElementById('codex-list');
      const detail = document.getElementById('codex-detail');
      if (!list || !detail) return;
      list.replaceChildren();

      if (category === 'evolution') {
        this.renderEvolution(detail);
        return;
      }

      const entries = this.entriesForCategory(category);
      const unlocked = new Set(this.saveManager.read()?.unlockedCodex || ['ovomorphe']);
      entries.forEach((entry, index) => {
        const id = entry.id || entry.key || `entry-${index}`;
        const isUnlocked = unlocked.has(id) || entry.unlockedByDefault;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `codex-entry${isUnlocked ? '' : ' locked'}`;

        const iconSpan = document.createElement('span');
        iconSpan.className = 'codex-entry-icon';
        iconSpan.setAttribute('aria-hidden', 'true');
        let iconSvg = '';
        if (!isUnlocked) {
          iconSvg = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><rect x="5" y="8" width="10" height="9" rx="2" stroke-width="1.5"/><path d="M7 8 V5 C7 3.3 8.3 2 10 2 C11.7 2 13 3.3 13 5 V8" stroke-width="1.5"/><circle cx="10" cy="12.5" r="1" fill="currentColor"/></svg>';
        } else if (category === 'castes') {
          iconSvg = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M4 11 C4 7 7 4 10 4 C13 4 16 7 16 11 C16 14 14 16 12 16 L12 18 L8 18 L8 16 C6 16 4 14 4 11 Z" stroke="#39ff14" stroke-width="1.4"/><circle cx="8" cy="11" r="1.2" fill="#39ff14"/><circle cx="12" cy="11" r="1.2" fill="#39ff14"/></svg>';
        } else if (category === 'threats') {
          iconSvg = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><circle cx="10" cy="10" r="7" stroke="#ef4444" stroke-width="1.4"/><path d="M10 3 L10 6 M10 14 L10 17 M3 10 L6 10 M14 10 L17 10" stroke="#ef4444" stroke-width="1.4"/><circle cx="10" cy="10" r="2" fill="#ef4444"/></svg>';
        } else {
          iconSvg = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><rect x="3" y="4" width="14" height="12" rx="2" stroke="#38bdf8" stroke-width="1.4"/><circle cx="7" cy="10" r="2" stroke="#38bdf8" stroke-width="1.2"/><circle cx="13" cy="10" r="2" stroke="#38bdf8" stroke-width="1.2"/><line x1="7" y1="13" x2="13" y2="13" stroke="#38bdf8" stroke-width="1.2"/></svg>';
        }
        iconSpan.innerHTML = iconSvg;

        const labelSpan = document.createElement('span');
        labelSpan.className = 'codex-entry-label';
        labelSpan.textContent = isUnlocked ? (entry.name || entry.title || id).toUpperCase() : `DONNÉE ${String(index + 1).padStart(2, '0')} — VERROUILLÉE`;

        button.append(iconSpan, labelSpan);
        button.addEventListener('click', () => {
          document.querySelectorAll('.codex-entry').forEach((node) => {
            node.classList.remove('active');
            node.removeAttribute('aria-current');
          });
          button.classList.add('active');
          button.setAttribute('aria-current', 'true');
          this.renderCodexDetail(detail, entry, isUnlocked);
        });
        list.appendChild(button);
      });

      if (entries.length === 0) {
        detail.innerHTML = '<span class="codex-status">BASE VIDE</span><h3>AUCUNE DONNÉE</h3><p>Cette section sera alimentée par les observations de campagne.</p>';
        return;
      }
      const firstUnlockedIndex = entries.findIndex((entry) => unlocked.has(entry.id || entry.key) || entry.unlockedByDefault);
      const selectedIndex = firstUnlockedIndex >= 0 ? firstUnlockedIndex : 0;
      list.children[selectedIndex]?.classList.add('active');
      list.children[selectedIndex]?.setAttribute('aria-current', 'true');
      this.renderCodexDetail(detail, entries[selectedIndex], firstUnlockedIndex >= 0);
    }

    renderCodexDetail(container, entry, unlocked) {
      if (!unlocked) {
        container.innerHTML = `
          <div class="codex-detail-thumb codex-thumb-locked" aria-hidden="true">
            <svg viewBox="0 0 320 90" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
              <rect width="320" height="90" fill="#080306"/>
              <line x1="0" y1="45" x2="320" y2="45" stroke="#ef4444" stroke-width="1" stroke-dasharray="6 4" stroke-opacity="0.4"/>
              <path d="M150 22 L170 22 L175 36 L165 36 L165 65 L155 65 L155 36 L145 36 Z" fill="#ef4444" fill-opacity="0.25"/>
              <text x="160" y="48" fill="#ef4444" font-family="'Orbitron', sans-serif" font-size="10" text-anchor="middle" letter-spacing="2">ACCÈS VERROUILLÉ</text>
              <text x="160" y="66" fill="#94a3b8" font-family="'Share Tech Mono', monospace" font-size="7.5" text-anchor="middle">SÉCURITÉ W-Y NIVEAU 4 EXIGÉE</text>
            </svg>
          </div>
          <span class="codex-status">DONNÉE VERROUILLÉE</span>
          <h3>OBSERVATION INCOMPLÈTE</h3>
          <p>Progressez dans la campagne ou rencontrez cette forme pour restaurer le dossier.</p>
        `;
        return;
      }
      const name = entry.name || entry.title || entry.id || 'ENTRÉE';
      const description = entry.description || entry.summary || entry.text || entry.role || entry.defeatCondition || 'Donnée biologique restaurée.';
      const lore = entry.loreStatus || entry.status || entry.source || 'Archive ORPHEUS';
      const actions = entry.actions || entry.capabilities || entry.counterplay || entry.objectives || [];
      const extra = [
        ...(entry.strengths || []),
        ...(entry.weaknesses || []).map((value) => `Faiblesse : ${value}`)
      ];
      const items = [...(Array.isArray(actions) ? actions : [actions]), ...extra]
        .filter(Boolean)
        .map((value) => {
          if (typeof value === 'string') return value;
          return value.description || value.label || value.name || value.id || 'Donnée restaurée';
        });
      container.replaceChildren();

      const detailThumb = document.createElement('div');
      detailThumb.className = 'codex-detail-thumb';
      detailThumb.setAttribute('aria-hidden', 'true');
      detailThumb.innerHTML = `
        <svg viewBox="0 0 320 90" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="detailThumbGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#04101e"/>
              <stop offset="60%" stop-color="#082038"/>
              <stop offset="100%" stop-color="#020812"/>
            </linearGradient>
          </defs>
          <rect width="320" height="90" fill="url(#detailThumbGrad)"/>
          <line x1="0" y1="22" x2="320" y2="22" stroke="rgba(56,189,248,0.12)" stroke-width="1"/>
          <line x1="0" y1="45" x2="320" y2="45" stroke="rgba(56,189,248,0.18)" stroke-width="1"/>
          <line x1="0" y1="68" x2="320" y2="68" stroke="rgba(56,189,248,0.12)" stroke-width="1"/>
          <line x1="80" y1="0" x2="80" y2="90" stroke="rgba(56,189,248,0.08)" stroke-width="1"/>
          <line x1="160" y1="0" x2="160" y2="90" stroke="rgba(56,189,248,0.14)" stroke-width="1"/>
          <line x1="240" y1="0" x2="240" y2="90" stroke="rgba(56,189,248,0.08)" stroke-width="1"/>
          <path d="M10 45 L50 45 L55 30 L60 60 L65 38 L70 45 L130 45 L135 25 L140 65 L145 35 L150 45 L210 45 L215 32 L220 58 L225 45 L310 45" fill="none" stroke="#38bdf8" stroke-width="1.3" stroke-opacity="0.8"/>
          <circle cx="275" cy="45" r="28" fill="none" stroke="#0284c7" stroke-width="1" stroke-dasharray="3 2"/>
          <circle cx="275" cy="45" r="16" fill="none" stroke="#38bdf8" stroke-width="1"/>
          <circle cx="275" cy="45" r="3" fill="#39ff14"/>
          <line x1="275" y1="45" x2="295" y2="30" stroke="#39ff14" stroke-width="1.2"/>
          <text x="14" y="16" fill="#7dd3fc" font-family="'Share Tech Mono', monospace" font-size="8">ARCHIVE BIOMÉTRIQUE // DOSSIER ACTIF</text>
          <text x="14" y="80" fill="#64748b" font-family="'Share Tech Mono', monospace" font-size="7.5">SPECTRE: ÉTALONNÉ // ANALYSE ORPHEUS OK</text>
        </svg>
      `;

      const status = document.createElement('span');
      status.className = 'codex-status';
      status.textContent = 'DOSSIER RESTAURÉ';
      const heading = document.createElement('h3');
      heading.textContent = String(name).toUpperCase();
      const tag = document.createElement('span');
      tag.className = 'lore-tag';
      const loreLabels = {
        FILM_CORE: 'SOCLE FILMIQUE',
        EXPANDED_COMPATIBLE: 'UNIVERS ÉTENDU COMPATIBLE',
        INSPIRED_ORIGINAL: 'ADAPTATION ORIGINALE',
        EXCLUDED_FROM_CORE: 'HORS CAMPAGNE'
      };
      tag.textContent = loreLabels[String(lore).toUpperCase()] || String(lore).toUpperCase();
      const paragraph = document.createElement('p');
      paragraph.textContent = description;
      container.append(detailThumb, status, heading, tag, paragraph);
      if (items.length) {
        const list = document.createElement('ul');
        items.forEach((value) => {
          const item = document.createElement('li');
          item.textContent = value;
          list.appendChild(item);
        });
        container.appendChild(list);
      }
    }

    renderEvolution(container) {
      const unlocked = new Set(this.saveManager.read()?.unlockedCodex || ['ovomorphe']);
      const branches = [
        {
          label: 'CYCLE REPRODUCTIF OBLIGATOIRE',
          ids: ['ovomorphe', 'facehugger', 'royal_facehugger', 'chestburster']
        },
        {
          label: 'FORMES ADULTES · PHÉNOTYPES LIÉS À L’HÔTE',
          ids: ['drone', 'runner', 'prowler']
        },
        {
          label: 'CASTES FONCTIONNELLES · BRANCHES DE L’UNIVERS ÉTENDU',
          ids: ['worker', 'warrior', 'spitter', 'burster', 'crusher']
        },
        {
          label: 'LIGNÉE ROYALE & MUTATIONS EXPÉRIMENTALES',
          ids: ['praetorian', 'palatine', 'queen', 'offspring']
        }
      ];
      const names = this.entriesForCategory('castes').reduce((map, entry) => {
        map[entry.id] = entry.name || entry.id;
        return map;
      }, {});
      container.innerHTML = '<span class="codex-status">ROUTES BIOLOGIQUES</span><h3>ÉVOLUTION DE LA RUCHE</h3><p>Le cycle reproductif reste obligatoire. Les groupes suivants décrivent des branches possibles selon l’hôte et les sources étendues compatibles, pas une succession certaine de mues.</p>';
      const casteIcons = {
        ovomorphe: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><ellipse cx="10" cy="11" rx="6" ry="7" stroke-width="1.4"/><path d="M7 6 Q10 2 13 6" stroke-width="1.2"/><path d="M10 6 L10 11" stroke-width="1.2" stroke-dasharray="2 2"/></svg>',
        facehugger: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><ellipse cx="10" cy="10" rx="3.5" ry="4.5" fill="rgba(57, 255, 20, 0.2)" stroke-width="1.4"/><path d="M6 7 Q2 5 2 9 M14 7 Q18 5 18 9 M6 11 Q2 12 3 15 M14 11 Q18 12 17 15" stroke-width="1.2"/><path d="M10 15 Q10 19 13 18" stroke-width="1.3"/></svg>',
        royal_facehugger: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><ellipse cx="10" cy="10" rx="4" ry="5" fill="rgba(234, 179, 8, 0.2)" stroke="#eab308" stroke-width="1.4"/><path d="M5 6 Q1 4 1 9 M15 6 Q19 4 19 9 M5 11 Q1 12 2 16 M15 11 Q19 12 18 16" stroke="#facc15" stroke-width="1.2"/><path d="M10 5 L8 2 L10 3 L12 2 Z" fill="#eab308"/></svg>',
        chestburster: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M7 17 Q8 12 11 10 Q13 8 13 5 Q13 3 10 3 Q8 4 8 6" stroke-width="1.4"/><circle cx="10" cy="4" r="1.5" fill="#ef4444"/><path d="M10 17 L12 19" stroke-width="1.3"/></svg>',
        drone: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M4 11 C4 6 7 3 12 3 C16 3 17 6 17 10 C17 13 14 15 11 15 L8 15 Z" fill="rgba(56, 189, 248, 0.15)" stroke-width="1.4"/><line x1="6" y1="14" x2="8" y2="16" stroke-width="1.4"/></svg>',
        runner: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M3 12 C4 8 8 5 15 4 C17 4 18 6 17 9 C15 12 12 14 8 14 Z" fill="rgba(245, 158, 11, 0.18)" stroke="#f59e0b" stroke-width="1.4"/><circle cx="6" cy="14" r="1" fill="#f59e0b"/></svg>',
        prowler: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M3 13 C5 7 9 4 16 5 C17 7 16 11 13 13 C9 15 6 15 3 13 Z" fill="rgba(168, 85, 247, 0.2)" stroke="#c084fc" stroke-width="1.4"/><path d="M12 5 L14 3" stroke="#e879f9" stroke-width="1.2"/></svg>',
        worker: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M5 12 C5 7 8 4 13 4 C16 4 17 7 16 11 C15 14 12 15 9 15 Z" stroke-width="1.4"/><line x1="9" y1="8" x2="13" y2="8" stroke-width="1.2"/><line x1="8" y1="11" x2="12" y2="11" stroke-width="1.2"/></svg>',
        warrior: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M4 11 C4 6 7 3 13 3 C16 3 17 6 17 10 C17 13 14 15 11 15 L7 15 Z" stroke-width="1.4"/><path d="M7 5 L9 8 M10 4 L12 7 M13 4 L15 7" stroke="currentColor" stroke-width="1.2"/></svg>',
        spitter: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M4 11 C4 6 8 3 13 3 C16 3 17 6 17 10 C16 13 13 15 10 15 Z" stroke="#39ff14" stroke-width="1.4"/><circle cx="8" cy="12" r="2" fill="rgba(57, 255, 20, 0.4)" stroke="#39ff14" stroke-width="1"/></svg>',
        burster: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M5 12 C5 6 8 3 13 3 C16 3 17 6 16 11 C15 14 12 16 9 16 Z" stroke="#ef4444" stroke-width="1.4"/><circle cx="11" cy="7" r="1.5" fill="#ef4444"/><circle cx="8" cy="11" r="1.5" fill="#f97316"/><circle cx="13" cy="12" r="1.5" fill="#eab308"/></svg>',
        crusher: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M2 14 L7 3 L16 3 L18 8 L13 15 Z" fill="rgba(148, 163, 184, 0.2)" stroke-width="1.5"/><path d="M7 3 L10 10 L13 15" stroke-width="1.2"/></svg>',
        praetorian: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M5 15 L3 8 L6 4 L10 2 L14 4 L17 8 L15 15 Z" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" stroke-width="1.4"/><line x1="10" y1="2" x2="10" y2="15" stroke="#38bdf8" stroke-width="1.2"/></svg>',
        palatine: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M4 16 L2 7 L6 3 L10 1 L14 3 L18 7 L16 16 Z" fill="rgba(168, 85, 247, 0.25)" stroke="#a855f7" stroke-width="1.4"/><polygon points="10,4 12,9 8,9" fill="#c084fc"/></svg>',
        queen: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M2 15 L1 7 L5 2 L10 5 L15 2 L19 7 L18 15 Z" fill="rgba(236, 72, 153, 0.25)" stroke="#ec4899" stroke-width="1.5"/><line x1="10" y1="5" x2="10" y2="15" stroke="#f472b6" stroke-width="1.4"/><circle cx="7" cy="10" r="1" fill="#ec4899"/><circle cx="13" cy="10" r="1" fill="#ec4899"/></svg>',
        offspring: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><ellipse cx="10" cy="9" rx="6" ry="7" fill="rgba(248, 250, 252, 0.2)" stroke="#e2e8f0" stroke-width="1.4"/><circle cx="8" cy="8" r="1.5" fill="#020617"/><circle cx="12" cy="8" r="1.5" fill="#020617"/><path d="M8 13 Q10 15 12 13" stroke="#e2e8f0" stroke-width="1.2"/></svg>'
      };
      const dnaTags = {
        ovomorphe: 'XX121-OVO', facehugger: 'XX121-FHG', royal_facehugger: 'XX121-RFH', chestburster: 'XX121-BUR',
        drone: 'XX121-DRN', runner: 'XX121-RUN', prowler: 'XX121-PRW',
        worker: 'XX121-WRK', warrior: 'XX121-WAR', spitter: 'XX121-SPT', burster: 'XX121-BST', crusher: 'XX121-CRU',
        praetorian: 'XX121-PRA', palatine: 'XX121-PAL', queen: 'XX121-QEN', offspring: 'XX121-OFF'
      };
      const tree = document.createElement('div');
      tree.className = 'evolution-tree';
      branches.forEach((branch) => {
        const row = document.createElement('div');
        row.className = 'evolution-tier';
        const branchLabel = document.createElement('strong');
        branchLabel.className = 'evolution-branch-label';
        branchLabel.textContent = branch.label;
        row.appendChild(branchLabel);
        const nodesGrid = document.createElement('div');
        nodesGrid.className = 'evolution-nodes-grid';
        branch.ids.forEach((id) => {
          const isUnlocked = unlocked.has(id);
          const node = document.createElement('div');
          node.className = `evolution-node${isUnlocked ? ' unlocked' : ' locked'}`;
          node.innerHTML = `
            <div class="evolution-node-header">
              <div class="evolution-node-icon" aria-hidden="true">${casteIcons[id] || casteIcons.drone}</div>
              <span class="evolution-node-tag">${dnaTags[id] || 'XX121'}</span>
            </div>
            <div class="evolution-node-body">
              <span class="evolution-node-name">${String(names[id] || id).toUpperCase()}</span>
              <span class="evolution-node-status">${isUnlocked ? 'ACTIF / DÉCOUVERT' : 'GÉNOTYPE REQUIS'}</span>
            </div>
          `;
          nodesGrid.appendChild(node);
        });
        row.appendChild(nodesGrid);
        tree.appendChild(row);
      });
      container.appendChild(tree);
    }

    showEndingChoices(onChoice) {
      const overlay = document.getElementById('ending-overlay');
      const container = document.getElementById('ending-choices');
      if (!overlay || !container) return;
      const rawEndings = this.content.endings || [
        { id: 'dominion', title: 'DOMINION', description: 'Transformer MNEMOSYNE en ruche permanente.' },
        { id: 'exodus', title: 'EXODE', description: 'Fuir avec la Reine vers une lune inexplorée.' },
        { id: 'seed', title: 'LA GRAINE', description: 'Contaminer la navette avant son départ.' }
      ];
      const endings = Array.isArray(rawEndings) ? rawEndings : Object.values(rawEndings);
      container.replaceChildren();

      const endingThumbnails = {
        dominion: `
          <div class="ending-card-thumb" aria-hidden="true">
            <svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="endDominionGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#19042b"/>
                  <stop offset="60%" stop-color="#3b0764"/>
                  <stop offset="100%" stop-color="#0a0112"/>
                </linearGradient>
              </defs>
              <rect width="160" height="90" fill="url(#endDominionGrad)"/>
              <circle cx="80" cy="45" r="22" fill="#0c1220" stroke="#a855f7" stroke-width="1.2"/>
              <ellipse cx="80" cy="45" rx="42" ry="8" fill="none" stroke="#c084fc" stroke-width="1.2" stroke-dasharray="4 2"/>
              <path d="M40 75 Q60 55 80 45 Q100 35 120 15 M30 20 Q55 35 80 45 Q105 55 130 70" stroke="#7e22ce" stroke-width="3" fill="none"/>
              <path d="M40 75 Q60 55 80 45 Q100 35 120 15 M30 20 Q55 35 80 45 Q105 55 130 70" stroke="#e879f9" stroke-width="1" stroke-opacity="0.8" fill="none"/>
              <path d="M68 28 L80 18 L92 28 L86 34 L80 32 L74 34 Z" fill="#2e1065" stroke="#f472b6" stroke-width="1.2"/>
              <circle cx="77" cy="28" r="1" fill="#39ff14"/>
              <circle cx="83" cy="28" r="1" fill="#39ff14"/>
            </svg>
          </div>
        `,
        exodus: `
          <div class="ending-card-thumb" aria-hidden="true">
            <svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="endExodusGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#041226"/>
                  <stop offset="60%" stop-color="#082f49"/>
                  <stop offset="100%" stop-color="#020617"/>
                </linearGradient>
              </defs>
              <rect width="160" height="90" fill="url(#endExodusGrad)"/>
              <circle cx="25" cy="18" r="0.8" fill="#e0f2fe"/>
              <circle cx="65" cy="28" r="0.6" fill="#bae6fd"/>
              <circle cx="110" cy="15" r="1" fill="#e0f2fe"/>
              <circle cx="128" cy="55" r="26" fill="#0f172a" stroke="#38bdf8" stroke-width="1.4"/>
              <path d="M112 45 Q122 42 126 52 M120 65 Q130 60 138 68" stroke="#0284c7" stroke-width="1" fill="none"/>
              <path d="M15 65 L45 52 L52 54 L38 68 Z" fill="#0f172a" stroke="#7dd3fc" stroke-width="1.2"/>
              <line x1="5" y1="70" x2="35" y2="58" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
              <line x1="2" y1="72" x2="25" y2="63" stroke="#39ff14" stroke-width="1.2"/>
            </svg>
          </div>
        `,
        seed: `
          <div class="ending-card-thumb" aria-hidden="true">
            <svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="endSeedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#141c0a"/>
                  <stop offset="60%" stop-color="#243310"/>
                  <stop offset="100%" stop-color="#060903"/>
                </linearGradient>
              </defs>
              <rect width="160" height="90" fill="url(#endSeedGrad)"/>
              <rect x="15" y="15" width="130" height="60" rx="3" fill="#0a0f05" stroke="#4d7c0f" stroke-width="1.2"/>
              <line x1="15" y1="35" x2="145" y2="35" stroke="#365314" stroke-width="1"/>
              <line x1="45" y1="15" x2="45" y2="75" stroke="#365314" stroke-width="1"/>
              <line x1="115" y1="15" x2="115" y2="75" stroke="#365314" stroke-width="1"/>
              <ellipse cx="80" cy="52" rx="14" ry="18" fill="#17250b" stroke="#84cc16" stroke-width="1.5"/>
              <path d="M76 40 L72 35 M84 40 L88 35 M74 42 L68 40 M86 42 L92 40" stroke="#a3e635" stroke-width="1.4" stroke-linecap="round"/>
              <circle cx="80" cy="42" r="2" fill="#39ff14"/>
              <circle cx="80" cy="68" r="1.8" fill="#84cc16"/>
            </svg>
          </div>
        `
      };

      const endingIcons = {
        dominion: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 18 L12 4 L20 18 L16 18 L12 11 L8 18 Z" stroke="#c084fc" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="18" r="3" fill="#a855f7"/></svg>',
        exodus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9" stroke="#38bdf8" stroke-width="1.5"/><path d="M12 3 A9 9 0 0 1 21 12" stroke="#7dd3fc" stroke-width="2.2"/><path d="M8 12 L16 12 L13 8 M16 12 L13 16" stroke="#38bdf8" stroke-width="1.6" stroke-linecap="round"/></svg>',
        seed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><ellipse cx="12" cy="13" rx="6" ry="8" stroke="#84cc16" stroke-width="1.6"/><circle cx="12" cy="13" r="2.5" fill="#84cc16"/><path d="M12 2 L12 5 M8 4 L10 6 M16 4 L14 6" stroke="#a3e635" stroke-width="1.4" stroke-linecap="round"/></svg>'
      };

      endings.forEach((ending) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'ending-card';

        const thumbWrapper = document.createElement('div');
        thumbWrapper.innerHTML = endingThumbnails[ending.id] || endingThumbnails.dominion;
        const thumbNode = thumbWrapper.firstElementChild;

        const iconBadge = document.createElement('span');
        iconBadge.className = 'ending-card-icon';
        iconBadge.setAttribute('aria-hidden', 'true');
        iconBadge.innerHTML = endingIcons[ending.id] || endingIcons.dominion;

        const title = document.createElement('strong');
        title.textContent = ending.title || ending.name || ending.id;
        const description = document.createElement('span');
        const labelPart = ending.choiceLabel || ending.description || ending.summary || '';
        const tonePart = ending.tone ? ` [${ending.tone}]` : '';
        description.textContent = `${labelPart}${tonePart}`;

        button.append(thumbNode, iconBadge, title, description);
        if (ending.epilogue) {
          const epilogueNode = document.createElement('small');
          epilogueNode.style.display = 'block';
          epilogueNode.style.marginTop = '6px';
          epilogueNode.style.opacity = '0.82';
          epilogueNode.textContent = ending.epilogue;
          button.appendChild(epilogueNode);
        }
        button.addEventListener('click', () => {
          this.saveManager.completeEnding(ending.id);
          this.hideLayer(overlay, false);
          onChoice?.(ending);
        });
        container.appendChild(button);
      });
      if (this.showLayer(overlay, true)) {
        container.querySelector('button')?.focus({ preventScroll: true });
      }
    }

    entriesForCategory(category) {
      const toArray = (value) => {
        if (Array.isArray(value)) return value;
        if (value && typeof value === 'object') {
          return Object.entries(value).map(([key, entry]) => ({ key, id: entry.id || key, ...entry }));
        }
        return [];
      };
      if (category === 'castes') return toArray(this.content.castes);
      if (category === 'threats') return [...toArray(this.content.enemies), ...toArray(this.content.bosses)];
      if (category === 'archives') {
        const journals = toArray(this.content.archives || this.content.logs || this.content.journals);
        const codexEntries = toArray(this.content.codex?.entries);
        return [...journals, ...codexEntries].map((entry) => ({
          ...entry,
          id: entry.id,
          title: entry.title || entry.subject || entry.id,
          text: entry.text || entry.body || entry.transcript || entry.summary,
          source: entry.source || entry.category || 'Archive ORPHEUS'
        }));
      }
      return [];
    }

    getAct(stage) {
      const acts = this.content.acts || this.content.campaign?.acts || this.content.narrative?.acts || [];
      return Array.isArray(acts) ? acts[stage - 1] : acts[stage] || acts[String(stage)] || null;
    }

    objectivesForAct(act) {
      if (!act) return [];
      if (Array.isArray(act.objectives)) {
        return act.objectives.map((objective) => typeof objective === 'string' ? objective : objective.label);
      }
      const missions = this.content.missions || {};
      return (act.missionIds || []).flatMap((missionId) => {
        const mission = missions[missionId];
        return (mission?.objectives || [])
          .filter((objective) => objective.required !== false)
          .map((objective) => objective.label);
      });
    }

    roman(value) {
      return ['I', 'II', 'III', 'IV', 'V'][Math.max(0, Math.min(4, value - 1))];
    }
  }

  const saveManager = new SaveManager();
  const settingsManager = new SettingsManager();
  const vfx = new VFXManager();
  settingsManager.attachVFX(vfx);
  const ui = new CampaignUI(saveManager, settingsManager);

  // =============================================================
  // PUBLIC FACADE — ONLY THE METHODS USED BY THE GAME MASTER
  // =============================================================
  window.HiveSystems = {
    init(game, services = {}) {
      ui.init(game);
      vfx.init(services.scene, services.removeObject);
    },
    save: saveManager,
    settings: settingsManager,
    ui,
    vfx,
    setMission(stage, completed, objective) {
      ui.setMission(stage, completed, objective);
    },
    updateObjective(stage, completed, objective) {
      ui.updateObjective(stage, completed, objective);
    },
    checkpoint(stage, unlockIds, additions) {
      ui.checkpoint(stage, unlockIds, additions);
    },
    unlockCodex(unlockIds = []) {
      const list = Array.isArray(unlockIds) ? unlockIds : [unlockIds];
      if (!list.length) return [];
      const unlocked = saveManager.unlock(list.filter(Boolean));
      ui.renderCodex(ui.activeCodexCategory);
      return unlocked;
    },
    narrative(speaker, line, duration) {
      ui.narrative(speaker, line, duration);
    },
    ending(onChoice) {
      ui.showEndingChoices(onChoice);
    },
    update(deltaSeconds) {
      vfx.update(deltaSeconds);
    }
  };
})();
