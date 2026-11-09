/* Native M40 diagnostic fixture. Production methods are not replaced.
 * Setups/positions and fixed simulation steps isolate the mortar from unrelated
 * level hazards. DOM clicks/keys use installed handlers; not human play or FPS.
 * Damage/audio wrappers observe calls then forward unchanged. */
(async () => {
  'use strict';
  const q = window.__mortarQA, g = window.gameInstance, T = window.THREE;
  if (!q || !g || typeof q.stationMap.isPortableMortarShotCurrent !== 'function' ||
      typeof window.HiveSystems?.vfx?.mortarWarning !== 'function') throw Error('Native M40 integration missing');
  await window.HiveModelFactory?.loadTextures?.();
  await q.rendererEngine.renderQuality?.environmentReady;
  const map = q.stationMap, p = q.playerCreature, vfx = window.HiveSystems.vfx;
  const caption = document.createElement('div');
  caption.style.cssText = 'position:fixed;left:24px;top:70px;z-index:100000;color:#fef3c7;background:#111827;padding:8px;font:13px monospace;max-width:1050px';
  document.body.append(caption);
  const originalDamage = p.takeDamage, originalLaunch = q.audioManager.playMortarLaunchAndShrapnel,
    originalConnect = q.audioManager.connect;
  const f = {
    caption, p, map, pm: null, shot: null, damage: [], audio: [], connections: 0, samples: [], lane: null,
    require(value, message) { if (!value) throw Error(message); },
    active(run) {
      const paused = g.isSystemPaused;
      this.require(g.isRunning, 'Prepared fixture must retain production running state');
      try { g.isSystemPaused = false; return run(); }
      finally { g.isSystemPaused = paused; }
    },
    tick(dt, movement = false) {
      if (movement) p.update(dt);
      // Same relevant subsystem order as native gameLoop: player, VFX, map.
      window.HiveSystems.update(dt);
      map.updatePortableMortars(dt);
    },
    step(seconds, { movement = false } = {}) {
      return this.active(() => {
        for (let elapsed = 0; elapsed < seconds - 1e-8; elapsed += 1 / 60) {
          this.tick(Math.min(1 / 60, seconds - elapsed), movement);
          this.samples.push({ x: p.x, z: p.z, collision: map.checkCollision(p.x, p.z) });
        }
        return this.snapshot();
      });
    },
    findLane() {
      const offsets = [{ key: 'd', x: 1, z: 0 }, { key: 'a', x: -1, z: 0 },
        { key: 's', x: 0, z: 1 }, { key: 'w', x: 0, z: -1 }];
      for (const mortar of map.portableMortars || []) for (const radius of [10, 14, 8, 18, 22])
        for (let i = 0; i < 24; i++) {
          const x = mortar.x + Math.cos(i * Math.PI / 12) * radius,
            z = mortar.z + Math.sin(i * Math.PI / 12) * radius;
          if (map.checkCollision(x, z, .88)) continue;
          for (const direction of offsets) {
            let clear = true;
            for (let at = 0; at <= 10; at += .25)
              if (map.checkCollision(x + direction.x * at, z + direction.z * at, .88)) { clear = false; break; }
            if (clear) return { mortar, x, z, direction, distance: radius };
          }
        }
      throw Error('No actual native mortar lane with an obstacle-free keyboard dodge was found');
    },
    prepare({ reduced = false } = {}) {
      g.startCampaign(4); g.setSystemPaused(true); g.clearHumans();
      vfx.clear(); vfx.setReducedMotion(reduced);
      p.embryoMutation = null; p.setAdultCaste('drone'); p.setForm('drone');
      p.isInVent = p.isCeilingProwling = p.isSubfloorProwling = p.isProwling = p.isWallMimic = false;
      p.inDeathThroes = p.isChrysalis = p.isMoltenLeadCoated = false; p.attachedHost = null;
      p.health = p.maxHealth = 1000; p.mesh.visible = true; p.moveTarget = null; p.moveWaypoints = [];
      this.lane = this.findLane(); this.pm = this.lane.mortar;
      p.x = this.lane.x; p.z = this.lane.z; p.mesh.position.set(p.x, 0, p.z);
      for (const mortar of map.portableMortars) {
        if (mortar.pendingShot) map.cancelPortableMortarShot(mortar, mortar.pendingShot);
        mortar.isDestroyed = false; mortar.hp = 80; mortar.shootCooldown = 999;
      }
      this.pm.shootCooldown = 0;
      this.damage = []; this.audio = []; this.samples = []; this.connections = 0; this.shot = null;
      return { mortar: { id: this.pm.id, x: this.pm.x, z: this.pm.z },
        player: { x: p.x, z: p.z, form: p.form, caste: p.adultCaste, mutation: p.embryoMutation,
          moltenLeadCoated: p.isMoltenLeadCoated, health: p.health, expectedNetDamage: 48 },
        direction: this.lane.direction, reduced,
        fixture: 'Actual authored mortar and colliders; drone/no mutation/no lead coating/1000PV prevent unrelated damage mitigation; only chosen cooldown ready; unrelated AI and map hazards not stepped' };
    },
    launch() {
      this.step(.01);
      this.shot = this.pm.pendingShot;
      this.require(!!this.shot, 'Native M40 failed to launch in its real lane');
      this.require(this.damage.length === 0 && p.health === 1000, 'Damage applied on launch');
      this.require(this.audio.length === 1 && this.audio[0].connections > 0, 'Launch did not allocate real audio connections exactly once');
      this.require(Math.abs(this.shot.remaining - .65) < 1e-6, 'Shot deadline differs from 0.65 simulation seconds');
      const snapshot = this.snapshot();
      this.require(snapshot.warning?.visible, 'Actual native warning marker missing');
      this.require(Math.abs(snapshot.warning.radius - 5.5) < 1e-6, 'Visible warning radius does not match authored blast radius');
      return snapshot;
    },
    warning() { return vfx.effects.find(effect => effect.mortarWarning) || null; },
    snapshot() {
      const warning = this.warning(), shell = warning?.shell, marker = warning?.warning;
      const ring = marker?.children?.find(object => object.geometry?.parameters?.outerRadius !== undefined);
      const shot = this.pm?.pendingShot;
      return { hp: p.health, x: p.x, z: p.z, paused: g.isSystemPaused, running: g.isRunning,
        pending: !!shot, remaining: shot?.remaining ?? null, target: shot ? [shot.targetX, shot.targetZ] : null,
        ownership: this.shot ? { launcherPending: this.pm?.pendingShot === this.shot,
          registered: !!map.pendingPortableMortarShots?.has(this.shot),
          current: map.isPortableMortarShotCurrent(this.pm, this.shot) } : null,
        launcherDestroyed: !!this.pm?.isDestroyed,
        damage: this.damage.slice(), audio: this.audio.slice(),
        warning: warning ? { age: warning.age, lifetime: warning.lifetime,
          visible: marker?.visible !== false && !!marker?.parent,
          radius: ring?.geometry.parameters.outerRadius ?? null,
          markerPosition: marker?.position.toArray(), markerScale: marker?.scale.toArray(),
          shellVisible: shell?.visible, shellPosition: shell?.position.toArray() } : null };
    },
    pauseViaButton(seconds = .8) {
      const before = this.snapshot();
      g.setSystemPaused(false);
      document.getElementById('btn-pause-game').click();
      this.require(g.isSystemPaused && !document.getElementById('pause-overlay').classList.contains('hidden'),
        'Installed pause button did not pause/open the actual dialog');
      for (let elapsed = 0; elapsed < seconds - 1e-8; elapsed += 1 / 60) this.tick(1 / 60);
      const after = this.snapshot();
      this.require(before.remaining === after.remaining && before.hp === after.hp &&
        before.damage.length === after.damage.length && before.audio.length === after.audio.length,
      'Native pause advanced shell damage, deadline or new SFX');
      this.require(JSON.stringify(before.warning) === JSON.stringify(after.warning), 'Native warning moved during pause');
      return { before, after, input: 'HTMLElement.click through installed pause button; fixed paused ticks' };
    },
    resumeViaButton() {
      const before = this.snapshot();
      document.getElementById('btn-resume-game').click();
      this.require(!g.isSystemPaused && document.getElementById('pause-overlay').classList.contains('hidden'),
        'Installed resume button did not resume/hide its actual dialog');
      // Keep this diagnostic deterministic before the next native RAF.
      g.setSystemPaused(true);
      return { before, after: this.snapshot(), input: 'HTMLElement.click through installed resume handler, then prepared diagnostic re-pause before RAF' };
    },
    dodge() {
      const key = this.lane.direction.key, before = this.snapshot();
      this.active(() => {
        q.inputManager.canvas.focus();
        window.dispatchEvent(new KeyboardEvent('keydown', { key, code: 'Key' + key.toUpperCase(), bubbles: true }));
        try { for (let i = 0; i < 26; i++) { this.tick(1 / 60, true);
          this.samples.push({ x: p.x, z: p.z, collision: map.checkCollision(p.x, p.z) }); } }
        finally { window.dispatchEvent(new KeyboardEvent('keyup', { key, code: 'Key' + key.toUpperCase(), bubbles: true })); }
      });
      const distance = Math.hypot(p.x - this.shot.targetX, p.z - this.shot.targetZ);
      this.require(distance > 5.5, 'Real keyboard motion did not escape the fixed blast radius: ' + distance);
      this.require(this.samples.every(sample => !sample.collision), 'Native keyboard dodge crossed an actual map collider');
      this.require(this.shot.targetX === before.target[0] && this.shot.targetZ === before.target[1], 'Mortar homed onto the moving actor');
      this.step(.3);
      this.require(p.health === 1000 && this.damage.length === 0 && !this.pm.pendingShot, 'Evaded fixed impact damaged the player');
      return { before, after: this.snapshot(), distance, movementKey: key, samples: this.samples };
    },
    draw(label) {
      const r = q.rendererEngine, cx = (this.pm.x + this.lane.x) / 2, cz = (this.pm.z + this.lane.z) / 2;
      g.setSystemPaused(true); document.getElementById('app-container').classList.remove('game-paused');
      r.camera.clearViewOffset(); r.camera.position.set(cx + 16, 22, cz + 21); r.camera.lookAt(cx, 1, cz);
      r.camera.fov = 46; r.camera.updateProjectionMatrix();
      r.updatePropVisibility({ x: cx, z: cz }, false); r.updateWallVisibility({ x: cx, y: 1.5, z: cz }, 4);
      caption.textContent = 'DIAGNOSTIC M40 PRÉPARÉ — ' + label;
      r.render(); r.renderer.getContext().finish();
      return { label, camera: r.camera.position.toArray(), state: this.snapshot(),
        scope: 'Actual scene/materials and diagnostic camera, fixed relevant simulation ticks; no human QA or GPU FPS' };
    },
    cleanup() {
      if (this.pm?.pendingShot) map.cancelPortableMortarShot(this.pm, this.pm.pendingShot);
      p.takeDamage = originalDamage; q.audioManager.playMortarLaunchAndShrapnel = originalLaunch;
      q.audioManager.connect = originalConnect; caption.remove(); g.setSystemPaused(true);
    }
  };
  p.takeDamage = function (...args) { f.damage.push({ amount: args[0], before: this.health }); return originalDamage.apply(this, args); };
  q.audioManager.connect = function (...args) { f.connections++; return originalConnect.apply(this, args); };
  q.audioManager.playMortarLaunchAndShrapnel = function (...args) {
    const before = f.connections, value = originalLaunch.apply(this, args);
    f.audio.push({ connections: f.connections - before, rawReturn: value === undefined ? 'undefined (legacy void API)' : value,
      rawReturnType: typeof value, args });
    return value;
  };
  window.__mortarNative = f;
  return { ready: true, scope: 'Prepared production objects, fixed relevant subsystem ticks and synthetic DOM input; not a human or unmodified-RAF playthrough' };
})()
