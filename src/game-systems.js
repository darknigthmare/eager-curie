/* HIVE ASCENSION
 * Campaign shell, save data, codex, accessibility, narrative UI and lightweight VFX.
 * The file is intentionally framework-free so the static build remains deployable anywhere.
 */

(function () {
  'use strict';

  const SAVE_KEY = 'hive-ascension-campaign-v2';
  const SETTINGS_KEY = 'hive-ascension-settings-v2';

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
        adultCaste: 'drone',
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

    read() {
      try {
        const raw = window.localStorage.getItem(SAVE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        return {
          ...this.defaultSave,
          ...parsed,
          unlockedCodex: Array.isArray(parsed.unlockedCodex) ? parsed.unlockedCodex : ['ovomorphe'],
          completedEndings: Array.isArray(parsed.completedEndings) ? parsed.completedEndings : [],
          campaignCharacters: parsed.campaignCharacters && typeof parsed.campaignCharacters === 'object'
            ? {
              ...this.defaultSave.campaignCharacters,
              ...parsed.campaignCharacters
            }
            : { ...this.defaultSave.campaignCharacters }
        };
      } catch (error) {
        console.warn('[Save] Lecture impossible', error);
        return null;
      }
    }

    write(patch) {
      const current = this.read() || { ...this.defaultSave };
      const next = {
        ...current,
        ...patch,
        updatedAt: new Date().toISOString()
      };
      try {
        window.localStorage.setItem(SAVE_KEY, JSON.stringify(next));
      } catch (error) {
        console.warn('[Save] Écriture impossible', error);
      }
      return next;
    }

    startNew(difficulty, expandedLore) {
      const previous = this.read();
      return this.write({
        ...this.defaultSave,
        difficulty,
        expandedLore,
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
        scanlines: true,
        reducedMotion: prefersReducedMotion,
        highContrast: false
      };
      this.values = this.read();
      this.game = null;
      this.vfx = null;
    }

    attachVFX(vfxManager) {
      this.vfx = vfxManager;
    }

    read() {
      try {
        const parsed = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || '{}');
        return { ...this.defaults, ...parsed };
      } catch (_error) {
        return { ...this.defaults };
      }
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
        highContrast: document.getElementById('setting-high-contrast')
      };

      if (controls.volume) controls.volume.value = this.values.volume;
      if (controls.brightness) controls.brightness.value = this.values.brightness;
      if (controls.scanlines) controls.scanlines.checked = this.values.scanlines;
      if (controls.reducedMotion) controls.reducedMotion.checked = this.values.reducedMotion;
      if (controls.highContrast) controls.highContrast.checked = this.values.highContrast;

      const sync = () => {
        this.values = {
          volume: Number(controls.volume?.value ?? this.values.volume),
          brightness: Number(controls.brightness?.value ?? this.values.brightness),
          scanlines: !!controls.scanlines?.checked,
          reducedMotion: !!controls.reducedMotion?.checked,
          highContrast: !!controls.highContrast?.checked
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
      this.game?.setMasterVolume?.(this.values.volume / 100);
      this.game?.setReducedMotion?.(this.values.reducedMotion);
      this.vfx?.setReducedMotion?.(this.values.reducedMotion);
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

    clear(resolveProjectiles = false) {
      const effects = this.effects.splice(0, this.effects.length);
      for (const effect of effects) {
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
        const geometry = new THREE.SphereGeometry(scale * (0.6 + Math.random()), 5, 5);
        const material = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.88,
          depthWrite: false
        });
        const particle = new THREE.Mesh(geometry, material);
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
      this.effects.push({ group, age: 0, lifetime: 0.72 + Math.random() * 0.35 });
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
      const expandedLore = document.getElementById('expanded-lore-toggle');

      document.getElementById('btn-new-campaign')?.addEventListener('click', () => {
        const save = this.saveManager.startNew(difficulty?.value || 'survivor', !!expandedLore?.checked);
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

    bindUtilityControls() {
      document.getElementById('btn-open-codex')?.addEventListener('click', () => this.openCodex(false));
      document.getElementById('btn-audio-toggle')?.addEventListener('click', () => {
        const muted = this.game?.toggleAudio?.();
        const button = document.getElementById('btn-audio-toggle');
        button?.setAttribute('aria-pressed', String(!!muted));
        if (button) button.textContent = muted ? 'SON COUPÉ' : 'SON';
      });
      document.getElementById('btn-pause-game')?.addEventListener('click', () => this.openPause());

      window.addEventListener('keydown', (event) => {
        if (event.defaultPrevented || event.repeat) return;
        const key = event.key.toLowerCase();
        const activeSystemLayer = this.visibleSystemLayer();
        if (key === 'tab' && activeSystemLayer) {
          this.trapFocus(event, activeSystemLayer);
          return;
        }

        const target = event.target;
        const isForm = target instanceof Element && !!target.closest('input, select, textarea, [contenteditable="true"]');
        if (isForm) return;

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

    setMission(stage, completed = 0, explicitObjective = null) {
      const act = this.getAct(stage);
      const objectives = this.objectivesForAct(act);
      const missionAct = document.getElementById('mission-act');
      const missionTitle = document.getElementById('mission-title');
      const missionObjective = document.getElementById('mission-objective');
      const missionProgress = document.getElementById('mission-progress');
      const playableTotals = [3, 2, 3, 4, 5];
      const playableTotal = playableTotals[Math.max(0, Math.min(4, stage - 1))];
      if (missionAct) missionAct.textContent = `ACTE ${this.roman(stage)}`;
      if (missionTitle) missionTitle.textContent = act?.title || `PHASE ${stage}`;
      if (missionObjective) {
        missionObjective.textContent = explicitObjective || objectives[Math.min(completed, Math.max(0, objectives.length - 1))] || 'Adapter la ruche à la menace.';
      }
      if (missionProgress) missionProgress.textContent = `${Math.min(completed, playableTotal)} / ${playableTotal}`;
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
        button.textContent = isUnlocked ? (entry.name || entry.title || id).toUpperCase() : `DONNÉE ${String(index + 1).padStart(2, '0')} — VERROUILLÉE`;
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
        container.innerHTML = '<span class="codex-status">DONNÉE VERROUILLÉE</span><h3>OBSERVATION INCOMPLÈTE</h3><p>Progressez dans la campagne ou rencontrez cette forme pour restaurer le dossier.</p>';
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
      container.append(status, heading, tag, paragraph);
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
          ids: ['ovomorphe', 'facehugger', 'chestburster']
        },
        {
          label: 'FORMES ADULTES · PHÉNOTYPES LIÉS À L’HÔTE',
          ids: ['drone', 'runner']
        },
        {
          label: 'CASTES FONCTIONNELLES · BRANCHES DE L’UNIVERS ÉTENDU',
          ids: ['worker', 'warrior', 'spitter']
        },
        {
          label: 'LIGNÉE ROYALE · BRANCHE DISTINCTE',
          ids: ['praetorian', 'queen']
        }
      ];
      const names = this.entriesForCategory('castes').reduce((map, entry) => {
        map[entry.id] = entry.name || entry.id;
        return map;
      }, {});
      container.innerHTML = '<span class="codex-status">ROUTES BIOLOGIQUES</span><h3>ÉVOLUTION DE LA RUCHE</h3><p>Le cycle reproductif reste obligatoire. Les groupes suivants décrivent des branches possibles selon l’hôte et les sources étendues compatibles, pas une succession certaine de mues.</p>';
      const tree = document.createElement('div');
      tree.className = 'evolution-tree';
      branches.forEach((branch) => {
        const row = document.createElement('div');
        row.className = 'evolution-tier';
        const branchLabel = document.createElement('strong');
        branchLabel.className = 'evolution-branch-label';
        branchLabel.textContent = branch.label;
        row.appendChild(branchLabel);
        branch.ids.forEach((id) => {
          const node = document.createElement('span');
          node.className = `evolution-node${unlocked.has(id) ? ' unlocked' : ''}`;
          node.textContent = String(names[id] || id).toUpperCase();
          row.appendChild(node);
        });
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
      endings.forEach((ending) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'ending-card';
        const title = document.createElement('strong');
        title.textContent = ending.title || ending.name || ending.id;
        const description = document.createElement('span');
        description.textContent = ending.description || ending.summary || ending.choiceLabel || ending.epilogue || '';
        button.append(title, description);
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
        return journals.map((entry) => ({
          ...entry,
          id: entry.id,
          title: entry.title || entry.subject || entry.id,
          text: entry.text || entry.body || entry.transcript || entry.summary
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
