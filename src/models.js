/*
 * HIVE ASCENSION - Procedural model factory
 * Three.js r128, browser global build, no bundler required.
 *
 * The silhouettes are original procedural constructions. They evoke an
 * unfamiliar biomechanical ecosystem without reproducing a protected model.
 */
(function exposeHiveModelFactory(global) {
  'use strict';

  // Human archetype aliases are deliberately compacted before lookup so that
  // content data may use spaces, dashes, underscores or localized labels.
  const HUMAN_TYPE_ALIASES = Object.freeze({
    civilian: 'civilian',
    civil: 'civilian',
    colonist: 'civilian',
    worker: 'civilian',
    scientist: 'scientist',
    scientifique: 'scientist',
    researcher: 'scientist',
    doctor: 'scientist',
    guard: 'guard',
    security: 'guard',
    securityguard: 'guard',
    sentry: 'guard',
    warden: 'guard',
    marine: 'marine',
    rifleman: 'marine',
    soldier: 'marine',
    trooper: 'marine',
    colonialmarine: 'marine',
    smartgunner: 'smartgunner',
    smartgun: 'smartgunner',
    gunner: 'smartgunner',
    heavygunner: 'smartgunner',
    heavyweapon: 'smartgunner',
    cleaner: 'incinerator',
    incinerator: 'incinerator',
    flametrooper: 'incinerator',
    flamethrower: 'incinerator',
    flamer: 'incinerator',
    pyro: 'incinerator',
    android: 'synthetic',
    synth: 'synthetic',
    synthetic: 'synthetic',
    artificialperson: 'synthetic',
    commando: 'commando',
    operator: 'commando',
    specops: 'commando',
    specialforces: 'commando',
    specialoperator: 'commando',
    labhound: 'labhound',
    labdog: 'labhound',
    serviceanimal: 'labhound',
    k9: 'labhound',
    canine: 'labhound',
    dog: 'labhound',
    labmouse: 'labrodent',
    laboratorymouse: 'labrodent',
    laboratoryrodent: 'labrodent',
    labrat: 'labrodent',
    labrodent: 'labrodent',
    mouse: 'labrodent',
    mice: 'labrodent',
    rat: 'labrodent',
    rodent: 'labrodent',
    souris: 'labrodent',
    powerloader: 'powerloader',
    powerloadersuit: 'powerloader',
    exosuit: 'powerloader',
    mech: 'powerloader',
    steelteam: 'weyland_steel_team_synth',
    steelteamsynth: 'weyland_steel_team_synth',
    steelteamandroid: 'weyland_steel_team_synth',
    cyberhound: 'weyland_cyber_hound',
    cyber_hound: 'weyland_cyber_hound',
    weylandcyberhound: 'weyland_cyber_hound',
    weyland_cyber_hound: 'weyland_cyber_hound',
    hazmattech: 'uscm_hazmat_tech',
    hazmat: 'uscm_hazmat_tech',
    uscmhazmat: 'uscm_hazmat_tech',
    uscm_hazmat_tech: 'uscm_hazmat_tech',
    droneoperator: 'weyland_drone_operator',
    dronist: 'weyland_drone_operator',
    weylanddroneoperator: 'weyland_drone_operator',
    weyland_drone_operator: 'weyland_drone_operator',
    skimmerdrone: 'skimmer_scan_drone',
    skimmer_scan_drone: 'skimmer_scan_drone',
    sniper: 'uscm_sniper',
    marksman: 'uscm_sniper',
    uscmsniper: 'uscm_sniper',
    uscm_sniper: 'uscm_sniper',
    containment: 'weyland_containment_squad',
    containmentsquad: 'weyland_containment_squad',
    hazmatsquad: 'weyland_containment_squad',
    weylandcontainment: 'weyland_containment_squad',
    weyland_containment_squad: 'weyland_containment_squad',
    heavyflamer: 'uscm_heavy_flamer',
    flamersquad: 'uscm_heavy_flamer',
    uscmflamer: 'uscm_heavy_flamer',
    uscm_heavy_flamer: 'uscm_heavy_flamer',
    combatengineer: 'uscm_combat_engineer',
    engineer: 'uscm_combat_engineer',
    uscmengineer: 'uscm_combat_engineer',
    uscm_combat_engineer: 'uscm_combat_engineer',
    sadaroperator: 'uscm_sadar_operator',
    sadar: 'uscm_sadar_operator',
    uscmsadar: 'uscm_sadar_operator',
    uscm_sadar_operator: 'uscm_sadar_operator',
    reconscout: 'uscm_recon_scout',
    recon: 'uscm_recon_scout',
    uscmrecon: 'uscm_recon_scout',
    uscm_recon_scout: 'uscm_recon_scout',
    combatmedic: 'uscm_combat_medic',
    medic: 'uscm_combat_medic',
    uscmmedic: 'uscm_combat_medic',
    combat_medic: 'uscm_combat_medic',
    uscm_combat_medic: 'uscm_combat_medic',
    reconsniper: 'uscm_recon_sniper',
    recon_sniper: 'uscm_recon_sniper',
    uscmsniper_recon: 'uscm_recon_sniper',
    uscm_recon_sniper: 'uscm_recon_sniper',
    forward_observer: 'uscm_recon_sniper',
    uscm_demolitionist: 'uscm_demolitionist',
    demolitionist: 'uscm_demolitionist',
    demoman: 'uscm_demolitionist',
    uscm_phalanx_shield: 'uscm_phalanx_shield',
    phalanx: 'uscm_phalanx_shield',
    riotshield: 'uscm_phalanx_shield',
    uscm_sentry_sapper: 'uscm_sentry_sapper',
    sapper: 'uscm_sentry_sapper',
    sentrysapper: 'uscm_sentry_sapper',
    uscm_field_commander: 'uscm_field_commander',
    commander: 'uscm_field_commander',
    officer: 'uscm_field_commander',
    uscm_breacher_shotgun: 'uscm_breacher_shotgun',
    breacher: 'uscm_breacher_shotgun',
    shotgunner: 'uscm_breacher_shotgun',
    uscm_exosuit_commando: 'uscm_exosuit_commando',
    heavycommando: 'uscm_exosuit_commando',
    seegson_hazmat_joe: 'seegson_hazmat_joe',
    hazmatjoe: 'seegson_hazmat_joe',
    industrialjoe: 'seegson_hazmat_joe',
    seegson_security_joe: 'seegson_security_joe',
    securityjoe: 'seegson_security_joe',
    tuxedojoe: 'seegson_security_joe',
    weyland_strike_synth: 'weyland_strike_synth',
    strikesynth: 'weyland_strike_synth',
    blacksynth: 'weyland_strike_synth',
    weyland_specimen_trapper: 'weyland_specimen_trapper',
    trapper: 'weyland_specimen_trapper',
    biotrapper: 'weyland_specimen_trapper',
    weyland_director_officer: 'weyland_director_officer',
    director: 'weyland_director_officer',
    weylanddirector: 'weyland_director_officer',
    weyland_heavy_mech: 'weyland_heavy_mech',
    heavymech: 'weyland_heavy_mech',
    combatmech: 'weyland_heavy_mech'
  });

  // ---------------------------------------------------------------------------
  // 1. FACTORY BOOTSTRAP & SHARED CONSTANTS
  // ---------------------------------------------------------------------------
  class HiveModelFactoryRuntime {
    constructor() {
      this.texturePaths = {
        resin: 'assets/textures/hive-resin.png', carapace: 'assets/textures/carapace.png',
        industrial: 'assets/textures/industrial-panels.png', organicBump: 'assets/textures/organic-bump.png',
        carapaceNormal: 'assets/textures/carapace-normal.png', carapaceRoughness: 'assets/textures/carapace-roughness.png', carapaceAO: 'assets/textures/carapace-ao.png',
        resinNormal: 'assets/textures/hive-resin-normal.png', resinRoughness: 'assets/textures/hive-resin-roughness.png', resinAO: 'assets/textures/hive-resin-ao.png',
        industrialNormal: 'assets/textures/industrial-panels-normal.png', industrialRoughness: 'assets/textures/industrial-panels-roughness.png', industrialAO: 'assets/textures/industrial-panels-ao.png', industrialMetalness: 'assets/textures/industrial-panels-metalness.png',
        fabric: 'assets/textures/fabric-weave.png', fabricNormal: 'assets/textures/fabric-weave-normal.png', fabricRoughness: 'assets/textures/fabric-weave-roughness.png', fabricAO: 'assets/textures/fabric-weave-ao.png',
        skin: 'assets/textures/skin-tissue.png', skinNormal: 'assets/textures/skin-tissue-normal.png', skinRoughness: 'assets/textures/skin-tissue-roughness.png', skinAO: 'assets/textures/skin-tissue-ao.png'
      };
      this.textures = Object.fromEntries(Object.keys(this.texturePaths).map((key) => [key, null]));
      this._texturePromise = null;
      this._managedMaterials = new Set();
    }

    _three() {
      if (!global.THREE) {
        throw new Error('HiveModelFactory requires the Three.js r128 global runtime.');
      }
      return global.THREE;
    }

    _vector(x, y, z) {
      const T = this._three();
      return new T.Vector3(x, y, z);
    }

    _normalizeHumanType(type) {
      const raw = String(type || 'civilian').trim().toLowerCase();
      const withoutAccents = typeof raw.normalize === 'function'
        ? raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        : raw;
      const compact = withoutAccents.replace(/[^a-z0-9]+/g, '');
      return HUMAN_TYPE_ALIASES[compact] || compact || 'civilian';
    }

    // -------------------------------------------------------------------------
    // 2. OPTIONAL TEXTURE LOADING & MATERIAL FALLBACKS
    // -------------------------------------------------------------------------
    loadTextures() {
      if (this._texturePromise) return this._texturePromise;

      const T = this._three();
      const loader = new T.TextureLoader();
      const entries = Object.keys(this.texturePaths);
      const safeLoad = (path) => new Promise((resolve) => {
        loader.load(
          path,
          (texture) => resolve(texture),
          undefined,
          () => resolve(null)
        );
      });

      this._texturePromise = Promise.all(entries.map((key) => (
        safeLoad(this.texturePaths[key]).then((texture) => {
          if (!texture) return;
          texture.wrapS = T.RepeatWrapping;
          texture.wrapT = T.RepeatWrapping;
          const repeat = key.startsWith('industrial') ? 2 : (key.startsWith('fabric') ? 3 : 1);
          texture.repeat.set(repeat, repeat);
          texture.anisotropy = 4;
          if (['carapace', 'resin', 'industrial', 'fabric', 'skin'].includes(key) && T.sRGBEncoding !== undefined) {
            texture.encoding = T.sRGBEncoding;
          }
          this.textures[key] = texture;
        })
      ))).then(() => {
        this._refreshManagedMaterials();
        return this.textures;
      });

      return this._texturePromise;
    }

    _material(kind, options) {
      const T = this._three();
      const defaults = {
        chitin: {
          color: 0x263b45,
          roughness: 0.3,
          metalness: 0.34
        },
        chitinWarm: {
          color: 0x2e1c14,
          roughness: 0.22,
          metalness: 0.42
        },
        resin: {
          color: 0x281230,
          roughness: 0.14,
          metalness: 0.32,
          transparent: true,
          opacity: 0.88
        },
        industrial: {
          color: 0x4b5563,
          roughness: 0.44,
          metalness: 0.72
        },
        darkMetal: {
          color: 0x111827,
          roughness: 0.3,
          metalness: 0.86
        },
        fabric: {
          color: 0x334155,
          roughness: 0.88,
          metalness: 0.02
        },
        skin: {
          color: 0xb7795b,
          roughness: 0.82,
          metalness: 0
        },
        bone: {
          color: 0xcbd5b1,
          roughness: 0.54,
          metalness: 0.04
        },
        glass: {
          color: 0x67e8f9,
          roughness: 0.12,
          metalness: 0.18,
          transparent: true,
          opacity: 0.48
        },
        emissiveGreen: {
          color: 0x164e3a,
          emissive: 0x39ff14,
          emissiveIntensity: 1.2,
          roughness: 0.36,
          metalness: 0.12
        },
        emissiveAmber: {
          color: 0x78350f,
          emissive: 0xf59e0b,
          emissiveIntensity: 1.1,
          roughness: 0.36,
          metalness: 0.16
        },
        emissiveRed: {
          color: 0x7f1d1d,
          emissive: 0xef4444,
          emissiveIntensity: 1.05,
          roughness: 0.4,
          metalness: 0.16
        }
      };
      const params = Object.assign({}, defaults[kind] || defaults.chitin, options || {});
      const wetShell = ['chitin', 'chitinWarm', 'resin', 'skin'].includes(kind);
      const material = (wetShell || Number(params.transmission) > 0)
        ? new T.MeshPhysicalMaterial(Object.assign({ clearcoat: kind === 'resin' ? 0.62 : 0.35, clearcoatRoughness: kind === 'skin' ? 0.6 : 0.24 }, params))
        : new T.MeshStandardMaterial(params);
      material.userData.hiveMaterialKind = kind;
      material.userData.hiveBaseRoughness = material.roughness;
      material.userData.hiveBaseMetalness = material.metalness;
      this._applyManagedTexture(material);
      global.HiveSurfaceDetail?.apply?.(material, kind);
      this._managedMaterials.add(material);
      material.addEventListener('dispose', () => this._managedMaterials.delete(material));
      return material;
    }

    _applyManagedTexture(material) {
      const kind = material.userData.hiveMaterialKind;
      const profile = (kind === 'chitin' || kind === 'chitinWarm') ? 'carapace'
        : ((kind === 'darkMetal' || kind === 'industrial') ? 'industrial'
          : (['resin', 'fabric', 'skin'].includes(kind) ? kind : null));
      if (profile) {
        material.map = this.textures[profile] || null;
        material.normalMap = this.textures[`${profile}Normal`] || null;
        material.roughnessMap = this.textures[`${profile}Roughness`] || null;
        material.roughness = material.roughnessMap ? 1 : material.userData.hiveBaseRoughness;
        material.aoMap = this.textures[`${profile}AO`] || null;
        material.aoMapIntensity = profile === 'industrial' ? 0.42 : 0.32;
        material.normalScale.setScalar(profile === 'skin' ? 0.28 : (profile === 'fabric' ? 0.38 : 0.55));
        if (profile === 'industrial') {
          material.metalnessMap = this.textures.industrialMetalness || null;
          material.metalness = material.metalnessMap ? 1 : material.userData.hiveBaseMetalness;
        }
        // Use the old height map only while full tangent-space normals are absent.
        material.bumpMap = !material.normalMap && ['carapace', 'resin'].includes(profile)
          ? this.textures.organicBump || null : null;
        material.bumpScale = profile === 'resin' ? 0.028 : 0.014;
      }
      material.needsUpdate = true;
      global.HiveSurfaceDetail?.apply?.(material, kind);
    }

    _refreshManagedMaterials() {
      this._managedMaterials.forEach((material) => this._applyManagedTexture(material));
    }

    // -------------------------------------------------------------------------
    // 3. DISPOSAL-FRIENDLY MODEL OWNERSHIP
    // -------------------------------------------------------------------------
    _finalize(root, metadata) {
      root.userData = Object.assign(root.userData || {}, metadata || {});
      global.HiveModelDetail?.decorate?.(this, root, root.userData);
      this._buildAnimationRig(root);
      if (['adult', 'egg', 'facehugger', 'chestburster'].includes(metadata?.modelType)) {
        // Keep the egg's captured visibility handle and every declared rig joint.
        global.HiveModelDetail?.mergeStatic?.(root, { excludeNames: ['apical_seal'] });
      }
      root.userData.hiveProceduralModel = true;
      root.userData.dispose = () => this.disposeModel(root);
      return root;
    }

    _resolveAnimationSpec(root, spec) {
      if (typeof spec === 'string') return root.getObjectByName(spec) || null;
      if (spec && spec.isObject3D) return spec;
      if (Array.isArray(spec)) {
        return spec.map((entry) => this._resolveAnimationSpec(root, entry)).filter(Boolean);
      }
      if (spec && typeof spec === 'object') {
        return Object.keys(spec).reduce((resolved, key) => {
          const entry = this._resolveAnimationSpec(root, spec[key]);
          if (entry && (!Array.isArray(entry) || entry.length)) resolved[key] = entry;
          return resolved;
        }, {});
      }
      return null;
    }

    _flattenAnimationJoints(spec, target, label) {
      const list = target || [];
      if (!spec) return list;
      if (spec.isObject3D) {
        list.push({ label: label || spec.name, joint: spec });
      } else if (Array.isArray(spec)) {
        spec.forEach((entry, index) => this._flattenAnimationJoints(entry, list, `${label || 'joint'}_${index}`));
      } else if (typeof spec === 'object') {
        Object.keys(spec).forEach((key) => this._flattenAnimationJoints(spec[key], list, key));
      }
      return list;
    }

    _buildAnimationRig(root) {
      const jointNames = root.userData && root.userData.animationJoints;
      if (!jointNames || !root.getObjectByName) return;

      const joints = this._resolveAnimationSpec(root, jointNames);
      const descriptors = this._flattenAnimationJoints(joints);
      const uniqueJoints = Array.from(new Set(descriptors.map((entry) => entry.joint)));
      const explicitRoles = root.userData.animationRoles || {};
      const roles = this._resolveAnimationSpec(root, explicitRoles) || {};

      if (!roles.locomotion) {
        roles.locomotion = descriptors
          .filter((entry) => /leg|arm|tail|limb|hip|knee|ankle/i.test(`${entry.label} ${entry.joint.name}`))
          .map((entry) => entry.joint);
      }
      if (!roles.attack) {
        roles.attack = descriptors
          .filter((entry) => /jaw|arm|claw|head|tail|mandible|feeler/i.test(`${entry.label} ${entry.joint.name}`))
          .map((entry) => entry.joint);
      }

      const bindPose = uniqueJoints.map((joint) => ({
        joint,
        position: joint.position.clone(),
        quaternion: joint.quaternion.clone(),
        scale: joint.scale.clone()
      }));

      root.userData.joints = joints;
      root.userData.animationRig = {
        jointNames,
        joints,
        roles,
        bindPose,
        resetPose: () => {
          bindPose.forEach((entry) => {
            entry.joint.position.copy(entry.position);
            entry.joint.quaternion.copy(entry.quaternion);
            entry.joint.scale.copy(entry.scale);
          });
        }
      };
    }

    disposeModel(root) {
      if (!root || !root.traverse || root.userData?.hiveFactoryDisposed) return;
      root.userData.hiveFactoryDisposed = true;
      global.HiveAssetLibrary?.disposeObject?.(root, { disposeResources: false });
      const geometries = new Set();
      const materials = new Set();
      root.traverse((child) => {
        if (child.geometry) geometries.add(child.geometry);
        if (child.material) {
          const list = Array.isArray(child.material) ? child.material : [child.material];
          list.forEach((material) => materials.add(material));
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      if (root.parent) root.parent.remove(root);
    }

    disposeTextures() {
      Object.keys(this.textures).forEach((key) => {
        if (this.textures[key]) this.textures[key].dispose();
        this.textures[key] = null;
      });
      this._texturePromise = null;
      this._refreshManagedMaterials();
    }

    // -------------------------------------------------------------------------
    // 4. WORLD-SPACE BOUNDS & RELIABLE GROUND PLACEMENT
    // -------------------------------------------------------------------------
    getModelBounds(root, targetBox) {
      const T = this._three();
      const bounds = targetBox || new T.Box3();
      bounds.makeEmpty();
      if (!root || typeof root.updateMatrixWorld !== 'function') return bounds;

      // Updating from the topmost ancestor avoids stale parent matrices when a
      // prop is grounded immediately after its container was transformed.
      let hierarchyRoot = root;
      while (hierarchyRoot.parent) hierarchyRoot = hierarchyRoot.parent;
      hierarchyRoot.updateMatrixWorld(true);
      if (global.HiveAssetLibrary?.handlesRoot?.(root)) {
        return global.HiveAssetLibrary.getModelBounds(root, bounds);
      }
      return bounds.setFromObject(root);
    }

    placeOnGround(root, targetY) {
      const T = this._three();
      if (!root || !root.position || typeof root.updateMatrixWorld !== 'function') return root;

      const numericTarget = Number(targetY);
      const groundY = Number.isFinite(numericTarget) ? numericTarget : 0;
      const bounds = this.getModelBounds(root);
      if (bounds.isEmpty() || !Number.isFinite(bounds.min.y)) return root;

      // Correct the world-space origin, then convert it back to the parent's
      // local space. This remains correct under translated, rotated or scaled
      // parent groups, unlike adding the raw offset to root.position.y.
      const worldOrigin = root.getWorldPosition(new T.Vector3());
      const correction = groundY - bounds.min.y;
      worldOrigin.y += correction;

      if (root.parent) {
        root.parent.updateMatrixWorld(true);
        root.parent.worldToLocal(worldOrigin);
      }
      root.position.copy(worldOrigin);
      root.updateMatrixWorld(true);
      root.userData = root.userData || {};
      root.userData.groundAligned = true;
      root.userData.groundPlaneY = groundY;
      root.userData.lastGroundCorrection = correction;
      return root;
    }

    // -------------------------------------------------------------------------
    // 5. LOW-LEVEL GEOMETRY HELPERS
    // -------------------------------------------------------------------------
    _mesh(geometry, material, name) {
      const T = this._three();
      if (geometry.attributes.uv && !geometry.attributes.uv2) {
        geometry.setAttribute('uv2', geometry.attributes.uv.clone());
      }
      const mesh = new T.Mesh(geometry, material);
      mesh.name = name || 'detail';
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    }

    _ellipsoid(material, scale, position, name, segments) {
      const T = this._three();
      const sculpt = global.HiveOrganicSculpt;
      let kind = null;
      if (name === 'thorax') kind = 'chest';
      else if (name === 'elongated_cranial_shell' || name === 'juvenile_head') kind = 'skull';
      else if (name === 'warrior_cranial_shell') kind = 'warriorSkull';
      else if (name === 'runner_head') kind = 'runnerSkull';
      else if (name === 'shell_body') kind = 'egg';
      else if (name === 'pod_membrane') kind = 'cocoon';
      else if (name === 'petal_shell' || name === 'petal_membrane') kind = 'petal';
      else if (name === 'central_carpal_body' || name === 'runner_thorax') kind = 'crawler';
      else if (name === 'palm_plate') kind = 'palm';
      else if (name === 'pelvic_carapace' || name === 'royal_abdomen') kind = 'pelvis';
      else if (/reinforced_shoulder|patellar_plate/.test(name || '')) kind = 'shoulder';
      else if (name === 'knuckle') kind = 'knuckle';
      else if (/^(hip|knee|ankle)$|_joint_|_terminal_joint/.test(name || '')) kind = 'joint';
      const resolution = Math.max(24, segments || 24);
      const geometry = kind && sculpt
        ? sculpt.surface(T, kind)
        : new T.SphereGeometry(1, resolution, Math.max(16, Math.floor(resolution * 0.75)));
      if (kind && sculpt) sculpt.fitUV(geometry, scale);
      const mesh = this._mesh(geometry, material, name);
      mesh.scale.set(scale.x, scale.y, scale.z);
      mesh.position.set(position.x, position.y, position.z);
      return mesh;
    }

    _sphere(material, radius, position, name, segments) {
      return this._ellipsoid(
        material,
        { x: radius, y: radius, z: radius },
        position,
        name,
        segments || 20
      );
    }

    _box(material, size, position, name, bevelHint) {
      const T = this._three();
      let geometry;
      if (bevelHint) {
        const bevel = Math.min(size.x, size.y, size.z) * 0.08;
        const halfX = size.x / 2 - bevel;
        const halfY = size.y / 2 - bevel;
        const outline = new T.Shape();
        outline.moveTo(-halfX, -halfY);
        outline.lineTo(halfX, -halfY);
        outline.lineTo(halfX, halfY);
        outline.lineTo(-halfX, halfY);
        outline.closePath();
        geometry = new T.ExtrudeGeometry(outline, {
          depth: size.z - bevel * 2,
          steps: 1,
          bevelEnabled: true,
          bevelThickness: bevel,
          bevelSize: bevel,
          bevelSegments: 1,
          curveSegments: 1
        });
        geometry.translate(0, 0, -size.z / 2 + bevel);
      } else {
        geometry = new T.BoxGeometry(size.x, size.y, size.z);
      }
      const mesh = this._mesh(geometry, material, name);
      mesh.position.set(position.x, position.y, position.z);
      return mesh;
    }

    _segment(material, start, end, radiusStart, radiusEnd, name, radialSegments) {
      const T = this._three();
      const direction = new T.Vector3().subVectors(end, start);
      const length = Math.max(0.001, direction.length());
      const sculpt = global.HiveOrganicSculpt;
      let anatomy = null;
      if (/phalanx|tarsus/.test(name || '')) anatomy = 'digit';
      else if (/^(arm|leg|runner_leg|juvenile_arm).*segment_/.test(name || '')) {
        anatomy = /segment_0$/.test(name) ? 'upper' : (/^leg|^runner_leg/.test(name) ? 'shin' : 'forearm');
      } else if (name === 'femur') anatomy = 'upper';
      else if (name === 'tibia') anatomy = 'shin';
      else if (name === 'cervical_column') anatomy = 'forearm';
      let geometry;
      if (anatomy && sculpt) {
        geometry = sculpt.limb(T, anatomy, (radiusEnd === undefined ? radiusStart : radiusEnd) / radiusStart);
        geometry.scale(radiusStart, length, radiusStart);
        sculpt.fitUV(geometry);
      } else {
        geometry = new T.CylinderGeometry(
          radiusEnd === undefined ? radiusStart : radiusEnd,
          radiusStart,
          length,
          Math.max(12, radialSegments || 12),
          2,
          false
        );
      }
      const mesh = this._mesh(geometry, material, name);
      mesh.position.copy(start).add(end).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), direction.normalize());
      return mesh;
    }

    _joint(material, position, radius, name) {
      return this._ellipsoid(
        material,
        { x: radius, y: radius, z: radius },
        position,
        name,
        12
      );
    }

    _tube(material, points, radius, name, tubularSegments, radialSegments) {
      const T = this._three();
      const curve = new T.CatmullRomCurve3(points.map((point) => (
        new T.Vector3(point.x, point.y, point.z)
      )));
      return this._mesh(
        new T.TubeGeometry(curve, tubularSegments || 24, radius, radialSegments || 7, false),
        material,
        name
      );
    }

    _sweptBody(material, points, radii, name, tubularSegments = 56, radialSegments = 12) {
      const T = this._three();
      const curve = new T.CatmullRomCurve3(points.map((p) => new T.Vector3(p.x, p.y, p.z)));
      const frames = curve.computeFrenetFrames(tubularSegments, false);
      const positions = [], normals = [], uvs = [], indices = [];
      for (let i = 0; i <= tubularSegments; i++) {
        const t = i / tubularSegments;
        const center = curve.getPointAt(t);
        const span = t * (radii.length - 1);
        const section = Math.min(radii.length - 2, Math.floor(span));
        const radius = T.MathUtils.lerp(radii[section], radii[section + 1], span - section);
        for (let j = 0; j <= radialSegments; j++) {
          const angle = j / radialSegments * Math.PI * 2;
          const normal = frames.normals[i].clone().multiplyScalar(Math.cos(angle))
            .addScaledVector(frames.binormals[i], Math.sin(angle));
          let surfaceRadius = radius;
          if (name === 'tail_skin' || name === 'larval_trunk') {
            const dorsal = Math.max(0, Math.sin(angle));
            const scute = Math.pow(Math.max(0,Math.cos(t * Math.PI * (name === 'tail_skin' ? 38 : 24) + Math.cos(angle) * .8)), 6);
            surfaceRadius *= 1 + .12 * scute * (.4 + dorsal) - .045 * Math.pow(Math.cos(angle * 3 + t * 4), 8);
          }
          const point = center.clone().addScaledVector(normal, surfaceRadius);
          positions.push(point.x, point.y, point.z); normals.push(normal.x, normal.y, normal.z);
          uvs.push(j / radialSegments, t);
          if (i < tubularSegments && j < radialSegments) {
            const a = i * (radialSegments + 1) + j, b = a + radialSegments + 1;
            indices.push(a, a + 1, b, b, a + 1, b + 1);
          }
        }
      }
      // Closed root/tip capfans prevent cut-open tubes during close inspection.
      for (const end of [0, tubularSegments]) {
        const center = curve.getPointAt(end / tubularSegments);
        const ci = positions.length / 3;
        positions.push(center.x, center.y, center.z); uvs.push(.5,end/tubularSegments);
        normals.push(0,0,1);
        const offset=end*(radialSegments+1);
        for(let side=0;side<radialSegments;side++) {
          if(end===0)indices.push(ci,offset+side+1,offset+side);
          else indices.push(ci,offset+side,offset+side+1);
        }
      }
      const geometry = new T.BufferGeometry();
      geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
      geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      return this._mesh(geometry, material, name);
    }

    _addInstancedRings(parent, material, curve, count, radius, name) {
      const T = this._three();
      const geometry = new T.TorusGeometry(1, 0.12, 6, 18);
      geometry.setAttribute('uv2', geometry.attributes.uv.clone());
      const bands = new T.InstancedMesh(geometry, material, count);
      bands.name = name;
      bands.castShadow = true; bands.receiveShadow = true;
      // Three r128 does not include instance transforms in its culling sphere.
      bands.frustumCulled = false;
      const dummy = new T.Object3D();
      for (let i = 0; i < count; i++) {
        const t = (i + 1) / (count + 1);
        dummy.position.copy(curve.getPointAt(t));
        dummy.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), curve.getTangentAt(t));
        dummy.scale.setScalar(radius * (1 - t * 0.76));
        dummy.updateMatrix(); bands.setMatrixAt(i, dummy.matrix);
      }
      parent.add(bands);
      return bands;
    }

    _coneAlong(material, base, direction, radius, length, name, radialSegments) {
      const T = this._three();
      const normalized = new T.Vector3(direction.x, direction.y, direction.z).normalize();
      const mesh = this._mesh(
        new T.ConeGeometry(radius, length, radialSegments || 7),
        material,
        name
      );
      mesh.position.set(
        base.x + normalized.x * length * 0.5,
        base.y + normalized.y * length * 0.5,
        base.z + normalized.z * length * 0.5
      );
      mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), normalized);
      return mesh;
    }

    _ring(material, majorRadius, tubeRadius, position, rotation, name, arc) {
      const T = this._three();
      const mesh = this._mesh(
        new T.TorusGeometry(majorRadius, tubeRadius, 7, 22, arc === undefined ? Math.PI * 2 : arc),
        material,
        name
      );
      mesh.position.set(position.x, position.y, position.z);
      mesh.rotation.set(rotation.x, rotation.y, rotation.z);
      return mesh;
    }

    _cylinder(material, radiusTop, radiusBottom, height, position, rotation, name, bevelHint) {
      const T = this._three();
      const mesh = this._mesh(
        new T.CylinderGeometry(radiusTop, radiusBottom, height, bevelHint ? 32 : 20),
        material,
        name
      );
      mesh.position.set(position.x, position.y, position.z);
      if (rotation) mesh.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
      return mesh;
    }

    _cone(material, radius, height, position, rotation, name, detailHint) {
      const T = this._three();
      const mesh = this._mesh(
        new T.ConeGeometry(radius, height, detailHint ? 32 : 20),
        material,
        name
      );
      mesh.position.set(position.x, position.y, position.z);
      if (rotation) mesh.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
      return mesh;
    }

    _torus(material, majorRadius, tubeRadius, position, rotation, name) {
      return this._ring(
        material,
        majorRadius,
        tubeRadius,
        position,
        { x: (rotation && rotation.x) || 0, y: (rotation && rotation.y) || 0, z: (rotation && rotation.z) || 0 },
        name
      );
    }

    _addBolt(parent, material, position, radius, name) {
      const bolt = this._joint(material, position, radius || 0.07, name || 'fastener');
      parent.add(bolt);
      return bolt;
    }

    // -------------------------------------------------------------------------
    // 5. ORGANIC DETAIL HELPERS
    // -------------------------------------------------------------------------
    _addCarapaceSpines(parent, material, startY, count, width, depth, direction) {
      for (let index = 0; index < count; index++) {
        const t = count <= 1 ? 0 : index / (count - 1);
        const spine = this._coneAlong(
          material,
          {
            x: (t - 0.5) * width,
            y: startY + Math.sin(t * Math.PI) * 0.25,
            z: direction * (depth + Math.sin(t * Math.PI) * 0.18)
          },
          { x: (t - 0.5) * 0.35, y: 0.3, z: direction },
          0.09 + Math.sin(t * Math.PI) * 0.05,
          0.45 + Math.sin(t * Math.PI) * 0.25,
          `carapace_spine_${index}`,
          6
        );
        parent.add(spine);
      }
    }

    _addRibCage(parent, material, centerY, width, depth, count) {
      // Rib arches, sternum and pectoral transitions are embedded in the chest
      // loft. Separate torus hoops would float over this continuous anatomy.
      return parent;
    }

    _addDorsalTubes(parent, material, baseY, size, count) {
      for (let index = 0; index < count; index++) {
        const side = index % 2 === 0 ? -1 : 1;
        const row = Math.floor(index / 2);
        const tube = this._tube(
          material,
          [
            { x: side * (0.32 + row * 0.08) * size, y: baseY, z: -0.3 * size },
            { x: side * (0.42 + row * 0.12) * size, y: baseY + (0.8 + row * 0.18) * size, z: -0.5 * size },
            { x: side * (0.38 + row * 0.14) * size, y: baseY + (1.45 + row * 0.22) * size, z: -0.2 * size },
            { x: side * (0.28 + row * 0.1) * size, y: baseY + (1.72 + row * 0.25) * size, z: 0.05 * size }
          ],
          (0.07 + row * 0.012) * size,
          `dorsal_tube_${index}`,
          18,
          6
        );
        parent.add(tube);
      }
    }

    _createClawedHand(material, boneMaterial, side, isFoot, scale) {
      const T = this._three();
      const root = new T.Group();
      root.name = isFoot ? `foot_${side < 0 ? 'left' : 'right'}` : `hand_${side < 0 ? 'left' : 'right'}`;
      const s = scale || 1;
      const palm = this._ellipsoid(
        material,
        { x: 0.3 * s, y: 0.13 * s, z: 0.42 * s },
        { x: 0, y: 0, z: 0.12 * s },
        'palm_plate',
        12
      );
      root.add(palm);

      const digits = isFoot ? 3 : 6;
      for (let index = 0; index < digits; index++) {
        const spread = (index - (digits - 1) / 2) * 0.13 * s;
        const finger = new T.Group();
        finger.name = `digit_${index}`;
        const base = new T.Vector3(spread, 0, 0.34 * s);
        const lengthBias = 1 - Math.abs(index - (digits - 1) / 2) / digits * 0.24;
        const knuckle = new T.Vector3(spread * 1.14, (isFoot ? -0.025 : -0.09) * s, 0.57 * lengthBias * s);
        const tip = new T.Vector3(spread * 1.22, (isFoot ? -0.07 : -0.27) * s, 0.78 * lengthBias * s);
        finger.add(this._segment(material, base, knuckle, 0.065 * s, 0.05 * s, 'proximal_phalanx', 7));
        finger.add(this._joint(material, knuckle, 0.064 * s, 'knuckle'));
        finger.add(this._segment(material, knuckle, tip, 0.05 * s, 0.035 * s, 'distal_phalanx', 7));
        finger.add(this._coneAlong(
          boneMaterial,
          tip,
          { x: spread * 0.35, y: -0.24, z: 1 },
          0.052 * s,
          (isFoot ? 0.28 : 0.22) * s,
          'terminal_claw',
          6
        ));
        // Digits are static relative to their hand/foot joint. Flatten their
        // identity groups so the material batcher can draw each hand in two calls.
        while (finger.children.length) root.add(finger.children[0]);
      }
      return root;
    }

    _addSegmentedLimb(parent, material, jointMaterial, points, radii, name, handOptions) {
      const T = this._three();
      const limb = new T.Group();
      limb.name = name;
      const anchor = new T.Vector3(points[0].x, points[0].y, points[0].z);
      limb.position.copy(anchor);
      for (let index = 0; index < points.length - 1; index++) {
        const start = new T.Vector3(points[index].x, points[index].y, points[index].z).sub(anchor);
        const end = new T.Vector3(points[index + 1].x, points[index + 1].y, points[index + 1].z).sub(anchor);
        limb.add(this._segment(
          material,
          start,
          end,
          radii[index],
          radii[index + 1],
          `${name}_segment_${index}`,
          14
        ));
        if (index > 0 || index === points.length - 2) {
          limb.add(this._joint(jointMaterial, start, radii[index] * 1.12, `${name}_joint_${index}`));
        }
      }
      const finalPoint = new T.Vector3(
        points[points.length - 1].x,
        points[points.length - 1].y,
        points[points.length - 1].z
      ).sub(anchor);
      limb.add(this._joint(
        jointMaterial,
        finalPoint,
        radii[radii.length - 1] * 1.12,
        `${name}_terminal_joint`
      ));
      if (handOptions) {
        const hand = this._createClawedHand(
          handOptions.material || material,
          handOptions.clawMaterial || jointMaterial,
          handOptions.side || 1,
          !!handOptions.isFoot,
          handOptions.scale || 1
        );
        hand.position.set(finalPoint.x, finalPoint.y, finalPoint.z);
        hand.rotation.y = handOptions.rotationY || 0;
        hand.rotation.x = handOptions.rotationX || 0;
        limb.add(hand);
      }
      parent.add(limb);
      return limb;
    }

    _addTail(parent, material, boneMaterial, origin, length, lift, side, thickness) {
      const T = this._three();
      const tailRoot = new T.Group(); tailRoot.name = 'segmented_tail';
      tailRoot.position.set(origin.x, origin.y, origin.z);
      const points = [
        { x: 0, y: 0, z: 0 },
        { x: side * length * 0.1, y: lift * 0.2, z: -length * 0.2 },
        { x: side * length * 0.23, y: lift * 0.34, z: -length * 0.43 },
        { x: side * length * 0.36, y: lift * 0.15, z: -length * 0.7 },
        { x: side * length * 0.47, y: lift, z: -length }
      ];
      tailRoot.add(this._sweptBody(material, points,
        [thickness * 1.45, thickness * 1.16, thickness * 0.83, thickness * 0.5, thickness * 0.24],
        'tail_skin', 128, 24));
      const curve = new T.CatmullRomCurve3(points.map((p) => new T.Vector3(p.x, p.y, p.z)));
      // Vertebral scutes are relief in the tapered tail surface, not ring beads.
      const tip = points[points.length - 1];
      const blade = this._ellipsoid(boneMaterial,
        { x: thickness * 1.5, y: thickness * 0.2, z: thickness * 4.4 },
        { x: tip.x, y: tip.y, z: tip.z - thickness * 2.9 }, 'tail_blade', 24);
      blade.rotation.y = -side * 0.35;
      tailRoot.add(blade);
      parent.add(tailRoot); return tailRoot;
    }

    _addCrest(parent, material, size, isRoyal) {
      const T = this._three();
      const crest = new T.Group(); crest.name = isRoyal ? 'royal_crown_crest' : 'guardian_crest';
      const positions = [], uvs = [], indices = [], rows = 22, columns = 72;
      const stride = columns + 1, layerSize = (rows + 1) * stride;
      for (let layer = 0; layer < 2; layer++) {
        for (let row = 0; row <= rows; row++) {
          const r = row / rows;
          for (let col = 0; col <= columns; col++) {
            const angle = (col / columns - .5) * Math.PI * 1.2;
            const fluting = Math.pow(Math.max(0,Math.cos(angle * 8 + r * 1.6)),5);
            const edgeRadius = (.27 + r * 1.55) * size;
            const scallop = 1 + .055 * Math.cos(angle * 9) * Math.pow(r,5);
            const dome = .2 + .29 * Math.sin(r * Math.PI * .9) - .09 * Math.abs(Math.sin(angle));
            const keel = .11 * Math.exp(-Math.pow(angle/.23,2)) * Math.sin(r*Math.PI);
            const grooves = -.055 * fluting * Math.sin(r*Math.PI);
            const thickness = (.11 + .08 * Math.sin(r * Math.PI)) * size;
            positions.push(Math.sin(angle) * edgeRadius * scallop,
              (dome + keel + grooves) * size + (layer === 0 ? thickness / 2 : -thickness / 2),
              -Math.cos(angle) * edgeRadius * scallop - size * .18);
            uvs.push(col / columns,r);
            if (row < rows && col < columns) {
              const a = layer*layerSize+row*stride+col,b=a+stride;
              if(layer===0)indices.push(a,a+1,b,b,a+1,b+1);
              else indices.push(a,b,a+1,b,b+1,a+1);
            }
          }
        }
      }
      // Weld top and underside around every edge into a closed, thick shield.
      for(let col=0;col<columns;col++) {
        for(const row of [0,rows]) {
          const a=row*stride+col,b=a+1,c=a+layerSize,d=b+layerSize;
          if(row===0)indices.push(a,c,b,b,c,d);else indices.push(a,b,c,b,d,c);
        }
      }
      for(let row=0;row<rows;row++)for(const col of [0,columns]) {
        const a=row*stride+col,b=a+stride,c=a+layerSize,d=b+layerSize;
        if(col===0)indices.push(a,b,c,b,d,c);else indices.push(a,c,b,b,c,d);
      }
      const geometry = new T.BufferGeometry();
      geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
      geometry.setIndex(indices); geometry.computeVertexNormals();
      const crownMaterial = material.clone(); crownMaterial.side = T.DoubleSide;
      global.HiveSurfaceDetail?.apply?.(crownMaterial, material.userData.hiveMaterialKind);
      this._managedMaterials.add(crownMaterial);
      crownMaterial.addEventListener('dispose', () => this._managedMaterials.delete(crownMaterial));
      crest.add(this._mesh(geometry, crownMaterial, 'sculpted_crown_shield'));
      parent.add(crest); return crest;
    }

    _addJaw(parent, chitin, bone, position, scale, extended) {
      const T = this._three();
      const jawRoot = new T.Group(); jawRoot.name = 'articulated_jaw';
      jawRoot.position.set(position.x, position.y, position.z);
      jawRoot.add(this._ellipsoid(chitin, { x: 0.39 * scale, y: 0.09 * scale, z: 0.3 * scale },
        { x: 0, y: -0.06 * scale, z: 0.04 * scale }, 'lower_mandible', 28));
      for (const side of [-1, 1]) {
        jawRoot.add(this._tube(chitin, [
          { x: side * 0.34 * scale, y: 0.08 * scale, z: -0.19 * scale },
          { x: side * 0.32 * scale, y: -0.08 * scale, z: 0.12 * scale },
          { x: side * 0.15 * scale, y: -0.06 * scale, z: 0.32 * scale }
        ], 0.045 * scale, `mandibular_rail_${side}`, 20, 8));
        for (let index = 0; index < 8; index++) {
          const t = index / 7;
          jawRoot.add(this._coneAlong(bone,
            { x: (t - 0.5) * 0.59 * scale, y: side < 0 ? -0.005 * scale : 0.2 * scale, z: (0.27 - Math.abs(t - 0.5) * 0.08) * scale },
            { x: 0, y: side < 0 ? 1 : -1, z: 0.04 }, 0.022 * scale,
            (0.075 + Math.sin(t * Math.PI) * 0.025) * scale,
            `dental_arcade_${side}_${index}`, 8));
        }
      }
      // The secondary pharyngeal jaw rests inside the mouth. It must not read
      // as a permanent ivory horn projecting from the creature's face.
      const inner = new T.Group(); inner.name = 'pharyngeal_jaw_slider';
      inner.position.set(0, 0.095 * scale, -0.2 * scale);
      inner.add(this._segment(chitin, new T.Vector3(0, 0, 0), new T.Vector3(0, 0, 0.35 * scale),
        0.065 * scale, 0.048 * scale, 'telescopic_inner_jaw', 12));
      inner.add(this._ellipsoid(bone, { x: 0.065 * scale, y: 0.045 * scale, z: 0.075 * scale },
        { x: 0, y: 0, z: 0.36 * scale }, 'inner_jaw_crown', 16));
      inner.position.z += extended ? 0.64 * scale : 0;
      inner.userData.retractedZ = -0.2 * scale;
      inner.userData.extensionLength = 0.7 * scale;
      jawRoot.add(inner); jawRoot.userData.innerJaw = inner;
      parent.add(jawRoot); return jawRoot;
    }

    _addMechanicalLimb(parent, metal, dark, points, radii, name, addClamp) {
      const T = this._three();
      const limb = new T.Group();
      limb.name = name;
      const anchor = new T.Vector3(points[0].x, points[0].y, points[0].z);
      limb.position.copy(anchor);
      for (let index = 0; index < points.length - 1; index++) {
        const start = new T.Vector3(points[index].x, points[index].y, points[index].z).sub(anchor);
        const end = new T.Vector3(points[index + 1].x, points[index + 1].y, points[index + 1].z).sub(anchor);
        limb.add(this._segment(metal, start, end, radii[index], radii[index + 1], `${name}_beam_${index}`, 10));
        limb.add(this._joint(dark, start, radii[index] * 1.28, `${name}_hub_${index}`));

        const offset = name.indexOf('left') >= 0 ? -0.17 : 0.17;
        limb.add(this._segment(
          dark,
          new T.Vector3(start.x + offset, start.y, start.z + 0.06),
          new T.Vector3(end.x + offset, end.y, end.z + 0.06),
          radii[index] * 0.22,
          radii[index + 1] * 0.18,
          `${name}_piston_${index}`,
          7
        ));
      }
      const terminal = new T.Vector3(
        points[points.length - 1].x,
        points[points.length - 1].y,
        points[points.length - 1].z
      ).sub(anchor);
      limb.add(this._joint(dark, terminal, radii[radii.length - 1] * 1.35, `${name}_terminal_hub`));

      if (addClamp) {
        const clamp = new T.Group();
        clamp.name = `${name}_clamp`;
        clamp.position.set(terminal.x, terminal.y, terminal.z);
        clamp.add(this._box(
          metal,
          { x: 0.72, y: 0.22, z: 0.56 },
          { x: 0, y: 0, z: 0.24 },
          'clamp_crossbar',
          true
        ));
        for (let side = -1; side <= 1; side += 2) {
          clamp.add(this._segment(
            metal,
            new T.Vector3(side * 0.29, 0, 0.36),
            new T.Vector3(side * 0.48, -0.08, 0.82),
            0.1,
            0.075,
            `clamp_finger_${side}`,
            8
          ));
          clamp.add(this._coneAlong(
            dark,
            { x: side * 0.48, y: -0.08, z: 0.82 },
            { x: -side * 0.24, y: -0.15, z: 1 },
            0.09,
            0.34,
            `clamp_tip_${side}`,
            6
          ));
        }
        limb.add(clamp);
      }
      parent.add(limb);
      return limb;
    }

    _createEquipmentWeapon(type, metal, dark, accent) {
      const T = this._three();
      const weapon = new T.Group();
      weapon.name = `${type}_equipment`;

      if (type === 'scientist') {
        weapon.add(this._box(
          dark,
          { x: 0.48, y: 0.72, z: 0.12 },
          { x: 0, y: 0, z: 0 },
          'analysis_tablet',
          true
        ));
        weapon.add(this._box(
          accent,
          { x: 0.36, y: 0.52, z: 0.03 },
          { x: 0, y: 0, z: 0.075 },
          'tablet_screen'
        ));
        weapon.userData.equipmentType = 'analysisTablet';
        return weapon;
      }

      if (type === 'synthetic') {
        weapon.add(this._box(
          dark,
          { x: 0.42, y: 0.66, z: 0.16 },
          { x: 0, y: 0, z: 0 },
          'synthetic_diagnostic_body',
          true
        ));
        weapon.add(this._box(
          accent,
          { x: 0.3, y: 0.38, z: 0.035 },
          { x: 0, y: 0.08, z: 0.1 },
          'synthetic_diagnostic_display'
        ));
        weapon.add(this._segment(
          metal,
          new T.Vector3(0.12, -0.26, 0),
          new T.Vector3(0.34, -0.52, 0.24),
          0.04,
          0.025,
          'synthetic_probe',
          7
        ));
        weapon.userData.equipmentType = 'diagnosticScanner';
        return weapon;
      }

      if (type === 'civilian') {
        weapon.add(this._segment(
          dark,
          new T.Vector3(0, -0.16, 0),
          new T.Vector3(0, 0.3, 0),
          0.1,
          0.13,
          'emergency_flashlight',
          10
        ));
        weapon.add(this._ellipsoid(
          accent,
          { x: 0.11, y: 0.05, z: 0.11 },
          { x: 0, y: 0.35, z: 0 },
          'flashlight_lens',
          10
        ));
        weapon.userData.equipmentType = 'emergencyLight';
        return weapon;
      }

      const weaponProfiles = {
        guard: {
          receiverWidth: 0.26,
          receiverLength: 1.02,
          barrelEnd: 1.32,
          barrelRadius: 0.055
        },
        marine: {
          receiverWidth: 0.34,
          receiverLength: 1.48,
          barrelEnd: 1.68,
          barrelRadius: 0.075
        },
        commando: {
          receiverWidth: 0.29,
          receiverLength: 1.28,
          barrelEnd: 1.54,
          barrelRadius: 0.06
        },
        smartgunner: {
          receiverWidth: 0.42,
          receiverLength: 1.76,
          barrelEnd: 2.02,
          barrelRadius: 0.1
        },
        incinerator: {
          receiverWidth: 0.38,
          receiverLength: 1.52,
          barrelEnd: 1.88,
          barrelRadius: 0.13
        },
        uscm_sadar_operator: {
          receiverWidth: 0.44,
          receiverLength: 2.1,
          barrelEnd: 2.4,
          barrelRadius: 0.14
        },
        uscm_recon_scout: {
          receiverWidth: 0.28,
          receiverLength: 1.35,
          barrelEnd: 1.85,
          barrelRadius: 0.065
        },
        uscm_combat_medic: {
          receiverWidth: 0.22,
          receiverLength: 0.85,
          barrelEnd: 1.15,
          barrelRadius: 0.05
        },
        uscm_recon_sniper: {
          receiverWidth: 0.22,
          receiverLength: 1.15,
          barrelEnd: 1.75,
          barrelRadius: 0.05
        }
      };
      const profile = weaponProfiles[type] || weaponProfiles.guard;

      weapon.add(this._box(
        metal,
        { x: profile.receiverWidth, y: 0.34, z: profile.receiverLength },
        { x: 0, y: 0, z: 0.18 },
        `${type}_receiver`,
        true
      ));
      weapon.add(this._segment(
        dark,
        new T.Vector3(0, 0.02, profile.receiverLength * 0.46),
        new T.Vector3(0, 0.02, profile.barrelEnd),
        profile.barrelRadius,
        profile.barrelRadius * 0.72,
        `${type}_barrel`,
        10
      ));
      weapon.add(this._box(
        dark,
        { x: 0.18, y: 0.64, z: 0.3 },
        { x: 0, y: -0.36, z: 0.05 },
        `${type}_grip`,
        true
      ));
      weapon.add(this._box(
        accent,
        { x: 0.2, y: 0.14, z: 0.34 },
        { x: 0, y: 0.26, z: 0.28 },
        `${type}_status_display`
      ));

      if (type !== 'incinerator') {
        weapon.add(this._box(
          dark,
          {
            x: type === 'smartgunner' ? 0.34 : 0.16,
            y: type === 'smartgunner' ? 0.58 : 0.5,
            z: type === 'smartgunner' ? 0.48 : 0.32
          },
          { x: 0, y: -0.25, z: 0.5 },
          `${type}_magazine`,
          true
        ));
      }

      if (type === 'guard') {
        weapon.add(this._box(
          accent,
          { x: 0.12, y: 0.12, z: 0.24 },
          { x: 0, y: -0.06, z: 0.92 },
          'guard_tactical_light',
          true
        ));
        weapon.add(this._box(
          dark,
          { x: 0.22, y: 0.22, z: 0.56 },
          { x: 0, y: 0.02, z: -0.56 },
          'guard_compact_stock',
          true
        ));
      } else if (type === 'marine') {
        weapon.add(this._box(
          dark,
          { x: 0.28, y: 0.2, z: 0.72 },
          { x: 0, y: 0.02, z: -0.68 },
          'marine_shoulder_stock',
          true
        ));
        weapon.add(this._segment(
          metal,
          new T.Vector3(0, -0.16, 0.38),
          new T.Vector3(0, -0.16, 1.25),
          0.11,
          0.085,
          'marine_underbarrel_launcher',
          9
        ));
        weapon.add(this._box(
          accent,
          { x: 0.16, y: 0.17, z: 0.08 },
          { x: 0.2, y: 0.12, z: 0.02 },
          'marine_ammunition_counter'
        ));
      } else if (type === 'commando') {
        weapon.add(this._segment(
          dark,
          new T.Vector3(0, 0.02, 1.42),
          new T.Vector3(0, 0.02, 1.92),
          0.11,
          0.11,
          'commando_sound_suppressor',
          12
        ));
        weapon.add(this._box(
          dark,
          { x: 0.18, y: 0.24, z: 0.34 },
          { x: 0, y: 0.3, z: 0.38 },
          'commando_optic',
          true
        ));
        weapon.add(this._box(
          accent,
          { x: 0.07, y: 0.07, z: 0.36 },
          { x: 0.17, y: -0.02, z: 0.92 },
          'commando_targeting_laser'
        ));
      } else if (type === 'smartgunner') {
        weapon.add(this._box(
          dark,
          { x: 0.86, y: 0.14, z: 0.2 },
          { x: 0, y: 0.12, z: -0.22 },
          'smartgun_stabilizer_yoke',
          true
        ));
        weapon.add(this._segment(
          dark,
          new T.Vector3(-0.22, -0.18, 0.24),
          new T.Vector3(-0.38, -0.48, -0.16),
          0.07,
          0.055,
          'smartgun_feed_chute',
          8
        ));
        for (let shroud = 0; shroud < 3; shroud++) {
          weapon.add(this._ring(
            metal,
            0.15,
            0.025,
            { x: 0, y: 0.02, z: 1.22 + shroud * 0.26 },
            { x: Math.PI / 2, y: 0, z: 0 },
            `smartgun_cooling_shroud_${shroud}`
          ));
        }
      } else if (type === 'incinerator') {
        weapon.add(this._segment(
          metal,
          new T.Vector3(-0.2, -0.08, 0.3),
          new T.Vector3(-0.2, -0.1, 1.46),
          0.1,
          0.07,
          'incinerator_fuel_line',
          10
        ));
        weapon.add(this._segment(
          dark,
          new T.Vector3(0, 0.02, 1.55),
          new T.Vector3(0, 0.02, 2.08),
          0.2,
          0.16,
          'incinerator_projector_nozzle',
          14
        ));
        for (let collar = 0; collar < 3; collar++) {
          weapon.add(this._ring(
            accent,
            0.19 - collar * 0.025,
            0.025,
            { x: 0, y: 0.02, z: 1.68 + collar * 0.17 },
            { x: Math.PI / 2, y: 0, z: 0 },
            `incinerator_nozzle_collar_${collar}`
          ));
        }
        weapon.add(this._ellipsoid(
          accent,
          { x: 0.08, y: 0.08, z: 0.13 },
          { x: 0, y: 0.02, z: 2.1 },
          'incinerator_pilot_emitter',
          10
        ));
      } else if (type === 'weyland_security_taser' || type === 'taser_guard') {
        // Chantier 45 : Bâton à choc haute tension 100kV Weyland-Yutani (Alien 3 / Isolation)
        weapon.add(this._segment(
          dark,
          new T.Vector3(0, 0, -0.3),
          new T.Vector3(0, 0, 1.3),
          0.05,
          0.04,
          'stun_baton_shaft',
          10
        ));
        weapon.add(this._ellipsoid(
          this._material('emissiveGreen', { color: 0x38bdf8, emissiveIntensity: 2.8 }),
          { x: 0.09, y: 0.09, z: 0.18 },
          { x: 0, y: 0, z: 1.35 },
          'stun_baton_tip',
          12
        ));
        weapon.add(this._ring(
          accent,
          0.08,
          0.02,
          { x: 0, y: 0, z: 0.95 },
          { x: 0, y: 0, z: 0 },
          'stun_charge_collar'
        ));
      } else if (type === 'weyland_commando_mk2' || type === 'commando_mk2' || type === 'xm99') {
        // Chantier 53 : Fusil de combat automatique lourd XM99 Commando Bio-Armé Weyland-Yutani
        weapon.add(this._box(
          dark,
          { x: 0.32, y: 0.26, z: 0.85 },
          { x: 0, y: 0.04, z: -0.45 },
          'xm99_heavy_receiver',
          true
        ));
        weapon.add(this._segment(
          metal,
          new T.Vector3(0, 0.06, 0.35),
          new T.Vector3(0, 0.06, 1.55),
          0.12,
          0.095,
          'xm99_heavy_barrel',
          12
        ));
        weapon.add(this._segment(
          dark,
          new T.Vector3(0, 0.06, 1.55),
          new T.Vector3(0, 0.06, 1.95),
          0.13,
          0.13,
          'xm99_compensator_suppressor',
          14
        ));
        // Chargeur tambour double
        weapon.add(this._ring(
          dark,
          0.24,
          0.09,
          { x: 0, y: -0.22, z: 0.15 },
          { x: 0, y: 0, z: Math.PI / 2 },
          'xm99_drum_magazine'
        ));
        // Viseur holographique Weyland-Yutani
        weapon.add(this._box(
          this._material('emissiveAmber', { color: 0xf59e0b, emissiveIntensity: 2.2 }),
          { x: 0.08, y: 0.12, z: 0.25 },
          { x: 0, y: 0.32, z: 0.1 },
          'xm99_holo_sight'
        ));
      } else if (type === 'weyland_steel_team_synth') {
        // Chantier 63 : Fusil à Concussion Magnétique Steel Team (Marvel Comics: Alien: Icarus)
        weapon.add(this._segment(
          dark,
          new T.Vector3(0, 0.05, 0.25),
          new T.Vector3(0, 0.05, 1.65),
          0.13,
          0.11,
          'concussion_magnetic_barrel',
          14
        ));
        for (let coil = 0; coil < 4; coil++) {
          weapon.add(this._ring(
            this._material('emissiveRed', { color: 0xef4444, emissiveIntensity: 2.2 }),
            0.17,
            0.028,
            { x: 0, y: 0.05, z: 0.45 + coil * 0.28 },
            { x: 0, y: 0, z: 0 },
            `magnetic_inductor_coil_${coil}`
          ));
        }
        weapon.add(this._box(
          dark,
          { x: 0.22, y: 0.38, z: 0.42 },
          { x: 0, y: -0.22, z: 0.45 },
          'concussion_power_cell',
          true
        ));
      } else if (type === 'uscm_sadar_operator') {
        // Chantier 193 : Lance-Roquettes Antichar Guidé M57A1 SADAR (Aliens lore)
        weapon.add(this._segment(dark, new T.Vector3(0, 0.04, -0.8), new T.Vector3(0, 0.04, -1.15), 0.14, 0.22, 'sadar_exhaust_cone', 12));
        weapon.add(this._box(dark, { x: 0.24, y: 0.22, z: 0.42 }, { x: -0.16, y: 0.26, z: 0.4 }, 'sadar_guidance_scope', true));
        weapon.add(this._ellipsoid(accent, { x: 0.06, y: 0.06, z: 0.04 }, { x: -0.16, y: 0.26, z: 0.62 }, 'sadar_scope_lens', 8));
        weapon.add(this._box(dark, { x: 0.14, y: 0.46, z: 0.16 }, { x: 0, y: -0.32, z: 0.35 }, 'sadar_front_grip', true));
        weapon.add(this._box(dark, { x: 0.14, y: 0.42, z: 0.16 }, { x: 0, y: -0.3, z: -0.1 }, 'sadar_rear_grip', true));
      } else if (type === 'uscm_recon_scout') {
        // Chantier 203 : Carabine Silencieuse M42C Scoped Recon Rifle (Aliens: Fireteam Elite)
        weapon.add(this._segment(dark, new T.Vector3(0, 0.02, 1.35), new T.Vector3(0, 0.02, 1.95), 0.1, 0.1, 'recon_silencer_can', 12));
        weapon.add(this._box(dark, { x: 0.16, y: 0.22, z: 0.45 }, { x: 0, y: 0.28, z: 0.4 }, 'recon_thermal_scope', true));
        weapon.add(this._ellipsoid(accent, { x: 0.05, y: 0.05, z: 0.03 }, { x: 0, y: 0.28, z: 0.64 }, 'recon_scope_lens', 8));
      } else if (type === 'uscm_combat_medic') {
        // Chantier 213 : Pistolet de service M4A3 & Injecteur Stimulant Tactique (Aliens: Fireteam Elite)
        const stimMat = this._material('emissiveGreen', { color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 2.2 });
        weapon.add(this._segment(dark, new T.Vector3(0, 0.02, 0.85), new T.Vector3(0, 0.02, 1.25), 0.06, 0.06, 'medic_pistol_barrel', 10));
        weapon.add(this._cylinder(stimMat, 0.04, 0.04, 0.35, { x: 0, y: -0.16, z: 0.4 }, { x: Math.PI / 2, y: 0, z: 0 }, 'medic_stim_vial'));
      } else if (type === 'uscm_recon_sniper') {
        // Chantier 223 : Fusil de précision M42A Scoped Pulse Rifle & Désignateur Laser (Dark Descent / Fireteam Elite)
        const laserMat = this._material('emissiveRed', { color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 2.8 });
        weapon.add(this._segment(dark, new T.Vector3(0, 0.04, 1.15), new T.Vector3(0, 0.04, 1.75), 0.05, 0.035, 'recon_long_barrel', 10));
        weapon.add(this._cylinder(dark, 0.065, 0.065, 0.65, { x: 0, y: 0.3, z: 0.5 }, { x: Math.PI / 2, y: 0, z: 0 }, 'recon_thermal_scope_tube'));
        weapon.add(this._ellipsoid(laserMat, { x: 0.04, y: 0.04, z: 0.02 }, { x: 0, y: 0.3, z: 0.83 }, 'recon_scope_lens_glow', 8));
        weapon.add(this._box(dark, { x: 0.08, y: 0.1, z: 0.25 }, { x: 0, y: -0.12, z: 1.0 }, 'recon_laser_box'));
        weapon.add(this._segment(laserMat, new T.Vector3(0, -0.12, 1.13), new T.Vector3(0, -0.12, 1.8), 0.015, 0.005, 'recon_laser_beam', 6));
      }

      weapon.userData.equipmentType = type;
      return weapon;
    }

    // -------------------------------------------------------------------------
    // 7. HUMAN ROLE PROFILES & READABLE SILHOUETTES
    // -------------------------------------------------------------------------
    _humanVisualProfile(type, compact) {
      const profiles = {
        civilian: {
          uniformColor: 0x6d28d9,
          armorColor: 0x4c1d95,
          torso: { x: 0.54, y: 0.8, z: 0.33 },
          pelvis: { x: 0.44, y: 0.29, z: 0.3 },
          chest: { x: 0.76, y: 0.42, z: 0.1 },
          pack: { x: 0.46, y: 0.52, z: 0.18 },
          shoulderX: 0.56,
          hipX: 0.29,
          helmetScale: 0.92
        },
        scientist: {
          uniformColor: 0x2563eb,
          armorColor: 0xcbd5e1,
          torso: { x: 0.56, y: 0.84, z: 0.35 },
          pelvis: { x: 0.45, y: 0.3, z: 0.31 },
          chest: { x: 0.82, y: 0.58, z: 0.12 },
          pack: { x: 0.54, y: 0.66, z: 0.2 },
          shoulderX: 0.58,
          hipX: 0.3,
          helmetScale: 0.96
        },
        guard: {
          uniformColor: 0x475569,
          armorColor: 0x374151,
          torso: { x: 0.62, y: 0.86, z: 0.37 },
          pelvis: { x: 0.48, y: 0.3, z: 0.32 },
          chest: { x: 1, y: 0.78, z: 0.18 },
          pack: { x: 0.7, y: 0.78, z: 0.28 },
          shoulderX: 0.62,
          hipX: 0.32,
          helmetScale: 1
        },
        marine: {
          uniformColor: 0x556b2f,
          armorColor: 0x3f4d2a,
          torso: { x: 0.69, y: 0.91, z: 0.43 },
          pelvis: { x: 0.52, y: 0.33, z: 0.36 },
          chest: { x: 1.18, y: 0.9, z: 0.25 },
          pack: { x: 0.84, y: 0.92, z: 0.38 },
          shoulderX: 0.69,
          hipX: 0.35,
          helmetScale: 1.05
        },
        smartgunner: {
          uniformColor: 0x365314,
          armorColor: 0x283618,
          torso: { x: 0.74, y: 0.94, z: 0.46 },
          pelvis: { x: 0.56, y: 0.35, z: 0.38 },
          chest: { x: 1.28, y: 1, z: 0.28 },
          pack: { x: 0.98, y: 1.06, z: 0.46 },
          shoulderX: 0.74,
          hipX: 0.37,
          helmetScale: 1.08
        },
        incinerator: {
          uniformColor: 0x9a3412,
          armorColor: 0x7c2d12,
          torso: { x: 0.72, y: 0.96, z: 0.49 },
          pelvis: { x: 0.55, y: 0.35, z: 0.4 },
          chest: { x: 1.24, y: 0.98, z: 0.32 },
          pack: { x: 1.02, y: 1.14, z: 0.52 },
          shoulderX: 0.72,
          hipX: 0.37,
          helmetScale: 1.1
        },
        synthetic: {
          uniformColor: 0xe2e8f0,
          armorColor: 0x94a3b8,
          torso: { x: 0.52, y: 0.92, z: 0.31 },
          pelvis: { x: 0.4, y: 0.28, z: 0.27 },
          chest: { x: 0.76, y: 0.72, z: 0.14 },
          pack: { x: 0.42, y: 0.68, z: 0.16 },
          shoulderX: 0.57,
          hipX: 0.27,
          helmetScale: 0.94
        },
        commando: {
          uniformColor: 0x172554,
          armorColor: 0x111827,
          torso: { x: 0.59, y: 0.9, z: 0.34 },
          pelvis: { x: 0.45, y: 0.31, z: 0.3 },
          chest: { x: 0.92, y: 0.82, z: 0.18 },
          pack: { x: 0.66, y: 0.82, z: 0.24 },
          shoulderX: 0.61,
          hipX: 0.31,
          helmetScale: 0.98
        },
        weyland_security_taser: {
          uniformColor: 0x0f172a,
          armorColor: 0x334155,
          torso: { x: 0.62, y: 0.88, z: 0.38 },
          pelvis: { x: 0.48, y: 0.32, z: 0.32 },
          chest: { x: 1.05, y: 0.85, z: 0.2 },
          pack: { x: 0.68, y: 0.78, z: 0.26 },
          shoulderX: 0.64,
          hipX: 0.33,
          helmetScale: 1.02
        },
        weyland_commando_mk2: {
          uniformColor: 0x334155,
          armorColor: 0xe2e8f0, // Armure céramique pressurisée Weyland-Yutani (Aliens: Fireteam Elite)
          torso: { x: 0.72, y: 0.98, z: 0.44 },
          pelvis: { x: 0.54, y: 0.36, z: 0.36 },
          chest: { x: 1.28, y: 0.98, z: 0.32 },
          pack: { x: 0.82, y: 0.95, z: 0.38 }, // Pack autonome de survie et filtration anti-acide
          shoulderX: 0.72,
          hipX: 0.36,
          helmetScale: 1.12
        },
        weyland_steel_team_synth: {
          uniformColor: 0x09090b,
          armorColor: 0x18181b, // Composite titane-carbone mat blindé (Marvel Comics: Alien: Icarus)
          torso: { x: 0.7, y: 0.96, z: 0.42 },
          pelvis: { x: 0.52, y: 0.35, z: 0.34 },
          chest: { x: 1.25, y: 0.95, z: 0.3 },
          pack: { x: 0.78, y: 0.88, z: 0.32 },
          shoulderX: 0.7,
          hipX: 0.35,
          helmetScale: 1.08
        },
        uscm_hazmat_tech: {
          uniformColor: 0xe2e8f0, // Combinaison NBC étanche argentée aluminisée (Aliens: Fireteam Elite)
          armorColor: 0x94a3b8,
          torso: { x: 0.74, y: 0.98, z: 0.46 },
          pelvis: { x: 0.56, y: 0.36, z: 0.38 },
          chest: { x: 1.25, y: 0.96, z: 0.32 },
          pack: { x: 0.95, y: 1.1, z: 0.48 }, // Compresseur dorsal de mousse neutralisante
          shoulderX: 0.74,
          hipX: 0.37,
          helmetScale: 1.16
        },
        weyland_drone_operator: {
          uniformColor: 0x1e293b, // Combinaison de vol technique Weyland-Yutani (Dark Descent)
          armorColor: 0x475569,
          torso: { x: 0.62, y: 0.88, z: 0.36 },
          pelvis: { x: 0.48, y: 0.32, z: 0.32 },
          chest: { x: 0.98, y: 0.84, z: 0.2 },
          pack: { x: 0.72, y: 0.82, z: 0.26 }, // Antenne de télémesure satellite repliable
          shoulderX: 0.63,
          hipX: 0.32,
          helmetScale: 1.02
        },
        uscm_sniper: {
          uniformColor: 0x334155, // Camouflage d'infiltration nocturne USCM (Aliens / Dark Descent)
          armorColor: 0x1e293b,
          torso: { x: 0.66, y: 0.92, z: 0.38 },
          pelvis: { x: 0.5, y: 0.34, z: 0.34 },
          chest: { x: 1.05, y: 0.88, z: 0.26 },
          pack: { x: 0.76, y: 0.84, z: 0.28 }, // Radio longue portée et télémètre balistique
          shoulderX: 0.68,
          hipX: 0.34,
          helmetScale: 1.04
        },
        weyland_containment_squad: {
          uniformColor: 0xffedd5, // Combinaison hermétique haute sécurité blanche avec marquages orange (Alien: Romulus)
          armorColor: 0xf97316,
          torso: { x: 0.75, y: 1.0, z: 0.46 },
          pelvis: { x: 0.58, y: 0.38, z: 0.38 },
          chest: { x: 1.28, y: 0.98, z: 0.35 },
          pack: { x: 0.95, y: 1.15, z: 0.5 }, // Compresseur autonome de fréon cryogénique
          shoulderX: 0.76,
          hipX: 0.38,
          helmetScale: 1.18
        },
        uscm_heavy_flamer: {
          uniformColor: 0x3f3f46, // Combinaison ignifugée amiante-kevlar sombre USCM (Aliens 1986 / Dark Descent)
          armorColor: 0x365314,   // Plaques balistiques M3 Olive Drab
          torso: { x: 0.78, y: 1.02, z: 0.48 },
          pelvis: { x: 0.6, y: 0.38, z: 0.4 },
          chest: { x: 1.32, y: 1.0, z: 0.38 },
          pack: { x: 1.05, y: 1.25, z: 0.55 }, // Double bonbonne de napalm liquide M240A1 pressurisée
          shoulderX: 0.78,
          hipX: 0.4,
          helmetScale: 1.14
        },
        uscm_combat_engineer: {
          uniformColor: 0x27272a, // Combinaison de travail treillis ignifugé gris acier USCM (Aliens: Dark Descent)
          armorColor: 0xca8a04,   // Cuirasse tactique jaune sécurité / kevlar M3
          torso: { x: 0.74, y: 0.98, z: 0.46 },
          pelvis: { x: 0.56, y: 0.36, z: 0.38 },
          chest: { x: 1.25, y: 0.94, z: 0.34 },
          pack: { x: 0.95, y: 1.1, z: 0.48 }, // Poste de soudure plasma et déploiement de concertina barbelé
          shoulderX: 0.74,
          hipX: 0.37,
          helmetScale: 1.12
        },
        uscm_sadar_operator: {
          uniformColor: 0x14532d, // Treillis USCM camouflage forêt sombre (Aliens 1986 / Colonial Marines)
          armorColor: 0x166534,   // Cuirasse balistique M3 Olive Drab renforcée
          torso: { x: 0.76, y: 1.0, z: 0.48 },
          pelvis: { x: 0.58, y: 0.36, z: 0.4 },
          chest: { x: 1.28, y: 0.96, z: 0.36 },
          pack: { x: 0.95, y: 1.2, z: 0.52 }, // Râtelier dorsal de 3 roquettes antichar de rechange M57A1 SADAR
          shoulderX: 0.76,
          hipX: 0.38,
          helmetScale: 1.12
        },
        uscm_recon_scout: {
          uniformColor: 0x1e293b, // Tenue furtive d'infiltration nocturne USCM (Aliens: Fireteam Elite)
          armorColor: 0x334155,   // Cuirasse légère polymère mat anti-reflet
          torso: { x: 0.65, y: 0.9, z: 0.38 },
          pelvis: { x: 0.5, y: 0.32, z: 0.34 },
          chest: { x: 1.05, y: 0.88, z: 0.25 },
          pack: { x: 0.72, y: 0.82, z: 0.28 }, // Antenne de marquage laser et micro-drones éclaireurs
          shoulderX: 0.65,
          hipX: 0.33,
          helmetScale: 1.02
        },
        uscm_combat_medic: {
          uniformColor: 0x1e293b, // Combinaison de combat USCM
          armorColor: 0xe2e8f0,   // Plastron et protections blancs / ardoise de médecin de bord
          torso: { x: 0.68, y: 0.92, z: 0.38 },
          pelvis: { x: 0.52, y: 0.34, z: 0.34 },
          chest: { x: 1.12, y: 0.92, z: 0.32 },
          pack: { x: 0.82, y: 0.95, z: 0.45 }, // Sacoche médicale d'intervention rapide et défibrillateur
          shoulderX: 0.68,
          hipX: 0.34,
          helmetScale: 1.05
        },
        uscm_recon_sniper: {
          uniformColor: 0x1e293b, // Treillis USCM de camouflage nocturne
          armorColor: 0x334155,   // Blindage composite sombre anti-reflet
          torso: { x: 0.7, y: 0.95, z: 0.4 },
          pelvis: { x: 0.54, y: 0.36, z: 0.35 },
          chest: { x: 1.14, y: 0.95, z: 0.34 },
          pack: { x: 0.85, y: 1.0, z: 0.48 },
          shoulderX: 0.65,
          hipX: 0.33,
          helmetScale: 1.02
        },
        uscm_demolitionist: {
          uniformColor: 0x14532d, armorColor: 0x15803d,
          torso: { x: 0.76, y: 0.98, z: 0.44 }, pelvis: { x: 0.56, y: 0.36, z: 0.38 }, chest: { x: 1.25, y: 0.98, z: 0.38 }, pack: { x: 0.95, y: 1.15, z: 0.55 },
          shoulderX: 0.74, hipX: 0.36, helmetScale: 1.1
        },
        uscm_phalanx_shield: {
          uniformColor: 0x1e293b, armorColor: 0x475569,
          torso: { x: 0.78, y: 1.02, z: 0.46 }, pelvis: { x: 0.58, y: 0.38, z: 0.4 }, chest: { x: 1.3, y: 1.0, z: 0.42 }, pack: { x: 0.85, y: 1.0, z: 0.45 },
          shoulderX: 0.76, hipX: 0.38, helmetScale: 1.14
        },
        uscm_sentry_sapper: {
          uniformColor: 0x14532d, armorColor: 0x334155,
          torso: { x: 0.7, y: 0.92, z: 0.4 }, pelvis: { x: 0.52, y: 0.34, z: 0.34 }, chest: { x: 1.12, y: 0.9, z: 0.32 }, pack: { x: 0.95, y: 1.1, z: 0.5 },
          shoulderX: 0.68, hipX: 0.34, helmetScale: 1.06
        },
        uscm_field_commander: {
          uniformColor: 0x1e293b, armorColor: 0x166534,
          torso: { x: 0.72, y: 0.95, z: 0.4 }, pelvis: { x: 0.54, y: 0.36, z: 0.36 }, chest: { x: 1.18, y: 0.94, z: 0.35 }, pack: { x: 0.82, y: 0.95, z: 0.42 },
          shoulderX: 0.7, hipX: 0.35, helmetScale: 1.08
        },
        uscm_breacher_shotgun: {
          uniformColor: 0x14532d, armorColor: 0x3f3f46,
          torso: { x: 0.75, y: 0.96, z: 0.44 }, pelvis: { x: 0.56, y: 0.36, z: 0.38 }, chest: { x: 1.24, y: 0.96, z: 0.38 }, pack: { x: 0.85, y: 1.0, z: 0.45 },
          shoulderX: 0.72, hipX: 0.36, helmetScale: 1.1
        },
        uscm_exosuit_commando: {
          uniformColor: 0x0f172a, armorColor: 0x1e293b,
          torso: { x: 0.88, y: 1.15, z: 0.55 }, pelvis: { x: 0.68, y: 0.44, z: 0.48 }, chest: { x: 1.45, y: 1.15, z: 0.5 }, pack: { x: 1.15, y: 1.35, z: 0.65 },
          shoulderX: 0.88, hipX: 0.44, helmetScale: 1.25
        },
        seegson_hazmat_joe: {
          uniformColor: 0xea580c, armorColor: 0xf97316,
          torso: { x: 0.7, y: 0.95, z: 0.4 }, pelvis: { x: 0.52, y: 0.34, z: 0.35 }, chest: { x: 1.12, y: 0.92, z: 0.32 }, pack: { x: 0.6, y: 0.75, z: 0.35 },
          shoulderX: 0.68, hipX: 0.34, helmetScale: 1.0
        },
        seegson_security_joe: {
          uniformColor: 0x0f172a, armorColor: 0x1e293b,
          torso: { x: 0.72, y: 0.98, z: 0.42 }, pelvis: { x: 0.54, y: 0.35, z: 0.36 }, chest: { x: 1.15, y: 0.94, z: 0.34 }, pack: { x: 0.65, y: 0.8, z: 0.35 },
          shoulderX: 0.7, hipX: 0.35, helmetScale: 1.02
        },
        weyland_strike_synth: {
          uniformColor: 0x09090b, armorColor: 0x18181b,
          torso: { x: 0.68, y: 0.95, z: 0.38 }, pelvis: { x: 0.5, y: 0.34, z: 0.34 }, chest: { x: 1.1, y: 0.92, z: 0.32 }, pack: { x: 0.7, y: 0.85, z: 0.38 },
          shoulderX: 0.68, hipX: 0.34, helmetScale: 1.05
        },
        weyland_specimen_trapper: {
          uniformColor: 0x1e293b, armorColor: 0x334155,
          torso: { x: 0.74, y: 0.96, z: 0.42 }, pelvis: { x: 0.55, y: 0.36, z: 0.36 }, chest: { x: 1.2, y: 0.95, z: 0.36 }, pack: { x: 0.9, y: 1.05, z: 0.48 },
          shoulderX: 0.72, hipX: 0.36, helmetScale: 1.1
        },
        weyland_director_officer: {
          uniformColor: 0x09090b, armorColor: 0x1c1917,
          torso: { x: 0.7, y: 1.0, z: 0.4 }, pelvis: { x: 0.52, y: 0.36, z: 0.35 }, chest: { x: 1.15, y: 0.96, z: 0.35 }, pack: { x: 0.65, y: 0.8, z: 0.32 },
          shoulderX: 0.68, hipX: 0.34, helmetScale: 1.04
        },
        weyland_heavy_mech: {
          uniformColor: 0x18181b, armorColor: 0x27272a,
          torso: { x: 0.95, y: 1.25, z: 0.6 }, pelvis: { x: 0.75, y: 0.5, z: 0.55 }, chest: { x: 1.6, y: 1.25, z: 0.58 }, pack: { x: 1.3, y: 1.45, z: 0.75 },
          shoulderX: 0.96, hipX: 0.5, helmetScale: 1.35
        }
      };
      const profile = Object.assign({}, profiles[type] || profiles.civilian);
      profile.compact = !!compact;
      return profile;
    }

    _addHumanRoleDetails(root, type, materials, torsoY, profile) {
      const T = this._three();
      const armor = materials.armor;
      const dark = materials.dark;
      const visor = materials.visor;
      const accent = materials.accent;
      const combatRole = ['guard', 'marine', 'smartgunner', 'incinerator', 'commando', 'weyland_commando_mk2', 'weyland_steel_team_synth', 'uscm_hazmat_tech', 'weyland_drone_operator', 'uscm_sniper', 'weyland_containment_squad', 'uscm_heavy_flamer', 'uscm_combat_engineer', 'uscm_sadar_operator', 'uscm_recon_scout', 'uscm_combat_medic', 'uscm_recon_sniper', 'uscm_demolitionist', 'uscm_phalanx_shield', 'uscm_sentry_sapper', 'uscm_field_commander', 'uscm_breacher_shotgun', 'uscm_exosuit_commando', 'seegson_hazmat_joe', 'seegson_security_joe', 'weyland_strike_synth', 'weyland_specimen_trapper', 'weyland_director_officer', 'weyland_heavy_mech'].indexOf(type) >= 0;

      if (combatRole) {
        for (let side = -1; side <= 1; side += 2) {
          const pauldron = this._box(
            armor,
            {
              x: type === 'smartgunner' ? 0.46 : 0.36,
              y: type === 'incinerator' ? 0.36 : 0.26,
              z: type === 'marine' ? 0.5 : 0.4
            },
            {
              x: side * (profile.shoulderX + 0.08),
              y: torsoY + 0.4,
              z: 0.02
            },
            `${type}_pauldron_${side < 0 ? 'left' : 'right'}`,
            true
          );
          pauldron.rotation.z = side * -0.16;
          root.add(pauldron);
        }
      }

      if (type === 'guard') {
        root.add(this._box(
          accent,
          { x: 0.16, y: 0.22, z: 0.035 },
          { x: -0.3, y: torsoY + 0.2, z: profile.chest.z + 0.12 },
          'guard_security_badge'
        ));
        root.add(this._segment(
          dark,
          new T.Vector3(-0.32, torsoY + 0.66, -0.22),
          new T.Vector3(-0.36, torsoY + 1.16, -0.24),
          0.025,
          0.012,
          'guard_radio_antenna',
          6
        ));
      } else if (type === 'marine') {
        for (let plate = 0; plate < 3; plate++) {
          root.add(this._box(
            armor,
            { x: 0.82 - plate * 0.08, y: 0.16, z: 0.1 },
            { x: 0, y: torsoY - 0.24 - plate * 0.19, z: 0.46 },
            `marine_abdominal_plate_${plate}`,
            true
          ));
        }
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._box(
            dark,
            { x: 0.2, y: 0.3, z: 0.18 },
            { x: side * 0.43, y: 1.48, z: 0.28 },
            `marine_utility_charge_${side}`,
            true
          ));
        }
      } else if (type === 'smartgunner') {
        root.add(this._box(
          dark,
          { x: 1.18, y: 0.16, z: 0.16 },
          { x: 0, y: torsoY + 0.2, z: 0.52 },
          'smartgunner_stabilizer_harness',
          true
        ));
        root.add(this._segment(
          armor,
          new T.Vector3(-0.4, torsoY + 0.36, -0.42),
          new T.Vector3(0.78, torsoY - 0.36, 0.42),
          0.11,
          0.075,
          'smartgunner_articulated_support',
          9
        ));
        root.add(this._box(
          dark,
          { x: 0.68, y: 0.76, z: 0.28 },
          { x: -0.1, y: torsoY - 0.02, z: -0.74 },
          'smartgunner_ammunition_case',
          true
        ));
      } else if (type === 'incinerator') {
        root.add(this._ring(
          dark,
          0.48,
          0.1,
          { x: 0, y: torsoY + 0.83, z: 0 },
          { x: Math.PI / 2, y: 0, z: 0 },
          'incinerator_sealed_collar'
        ));
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._segment(
            armor,
            new T.Vector3(side * 0.25, torsoY - 0.48, -0.55),
            new T.Vector3(side * 0.25, torsoY + 0.55, -0.55),
            0.22,
            0.22,
            `incinerator_fuel_tank_${side < 0 ? 'left' : 'right'}`,
            14
          ));
          root.add(this._ring(
            accent,
            0.24,
            0.03,
            { x: side * 0.25, y: torsoY + 0.36, z: -0.55 },
            { x: Math.PI / 2, y: 0, z: 0 },
            `incinerator_tank_warning_${side}`
          ));
        }
        root.add(this._tube(
          dark,
          [
            { x: 0.25, y: torsoY - 0.46, z: -0.56 },
            { x: 0.72, y: torsoY - 0.72, z: -0.2 },
            { x: 0.8, y: torsoY - 0.48, z: 0.55 }
          ],
          0.045,
          'incinerator_external_fuel_hose',
          20,
          7
        ));
        root.add(this._box(
          visor,
          { x: 0.5, y: 0.28, z: 0.1 },
          { x: 0, y: torsoY + 1.18, z: 0.39 },
          'incinerator_respirator_mask',
          true
        ));
      } else if (type === 'synthetic') {
        for (let ring = 0; ring < 3; ring++) {
          root.add(this._ring(
            dark,
            0.18 - ring * 0.012,
            0.018,
            { x: 0, y: torsoY + 0.68 + ring * 0.08, z: 0 },
            { x: Math.PI / 2, y: 0, z: 0 },
            `synthetic_neck_coupling_${ring}`
          ));
        }
        root.add(this._box(
          accent,
          { x: 0.34, y: 0.22, z: 0.035 },
          { x: 0, y: torsoY + 0.16, z: 0.4 },
          'synthetic_service_panel'
        ));
        root.add(this._segment(
          dark,
          new T.Vector3(0, torsoY - 0.55, -0.35),
          new T.Vector3(0, torsoY + 0.62, -0.35),
          0.07,
          0.055,
          'synthetic_external_spine',
          8
        ));
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._ring(
            dark,
            0.16,
            0.022,
            { x: side * 0.38, y: 0.92, z: side * 0.08 },
            { x: 0, y: 0, z: 0 },
            `synthetic_knee_coupling_${side}`
          ));
        }
      } else if (type === 'commando') {
        root.add(this._ellipsoid(
          dark,
          { x: 0.44, y: 0.46, z: 0.4 },
          { x: 0, y: torsoY + 1.18, z: -0.03 },
          'commando_ballistic_hood',
          16
        ));
        root.add(this._box(
          visor,
          { x: 0.62, y: 0.16, z: 0.065 },
          { x: 0, y: torsoY + 1.24, z: 0.37 },
          'commando_low_profile_visor',
          true
        ));
        for (let pouch = 0; pouch < 4; pouch++) {
          root.add(this._box(
            dark,
            { x: 0.17, y: 0.3, z: 0.14 },
            { x: -0.3 + pouch * 0.2, y: torsoY - 0.5, z: 0.35 },
            `commando_magazine_pouch_${pouch}`,
            true
          ));
        }
      } else if (type === 'weyland_commando_mk2') {
        // Chantier 53 : Commando Lourd Weyland-Yutani MK-II avec Visière Blindée Dorée Anti-Acide (Canon Aliens: Fireteam Elite)
        const goldVisorMat = this._material('darkMetal', {
          color: 0xf59e0b,
          metalness: 0.95,
          roughness: 0.08,
          emissive: 0xd97706,
          emissiveIntensity: 0.4
        });
        // Visière dorée réfléchissante intégrale
        root.add(this._box(
          goldVisorMat,
          { x: 0.65, y: 0.28, z: 0.14 },
          { x: 0, y: torsoY + 1.22, z: 0.38 },
          'anti_acid_gold_visor',
          true
        ));
        // Bonbonnes de filtration et survie autonome dorsales
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._segment(
            armor,
            new T.Vector3(side * 0.22, torsoY - 0.45, -0.42),
            new T.Vector3(side * 0.22, torsoY + 0.42, -0.42),
            0.11,
            0.11,
            `commando_mk2_filter_canister_${side}`,
            12
          ));
          // Tubulures cannelées reliant le pack au casque
          root.add(this._tube(
            dark,
            [
              { x: side * 0.22, y: torsoY + 0.38, z: -0.42 },
              { x: side * 0.32, y: torsoY + 0.95, z: -0.22 },
              { x: side * 0.25, y: torsoY + 1.15, z: 0.15 }
            ],
            0.038,
            `commando_mk2_air_hose_${side}`,
            14,
            6
          ));
        }
        // Plaques balistiques céramiques renforcées sur les cuisses
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._box(
            armor,
            { x: 0.28, y: 0.45, z: 0.18 },
            { x: side * (profile.hipX + 0.14), y: 1.1, z: 0.08 },
            `commando_mk2_thigh_plate_${side}`,
            true
          ));
        }
      } else if (type === 'weyland_steel_team_synth') {
        // Chantier 63 : Lame Thermique Thermo-Plasma Incandescente Avant-Bras Droit (Marvel Comics: Alien: Icarus)
        const bladeGlow = this._material('emissiveRed', {
          color: 0xff3b30,
          emissive: 0xff2d55,
          emissiveIntensity: 3.4,
          roughness: 0.1,
          metalness: 0.95
        });
        const bladeSpine = this._material('darkMetal', { color: 0x09090b, roughness: 0.2, metalness: 0.95 });
        root.add(this._box(bladeSpine, { x: 0.18, y: 0.14, z: 0.55 }, { x: profile.shoulderX + 0.14, y: torsoY - 0.72, z: 0.35 }, 'thermal_blade_gauntlet', true));
        root.add(this._segment(
          bladeGlow,
          new T.Vector3(profile.shoulderX + 0.14, torsoY - 0.72, 0.45),
          new T.Vector3(profile.shoulderX + 0.14, torsoY - 0.72, 1.45),
          0.065,
          0.015,
          'thermal_blade_glow',
          10
        ));
        root.add(this._box(
          this._material('bone', { color: 0xf8fafc, roughness: 0.3 }),
          { x: 0.28, y: 0.18, z: 0.04 },
          { x: 0, y: torsoY + 0.32, z: profile.chest.z + 0.12 },
          'steel_team_wy_insignia'
        ));
      } else if (type === 'uscm_hazmat_tech') {
        // Chantier 83 : Unité de Neutralisation Chimique USCM en tenue Hazmat étanche (Aliens: Fireteam Elite)
        const hazmatVisor = this._material('darkMetal', {
          color: 0xf59e0b,
          roughness: 0.12,
          metalness: 0.85,
          emissive: 0xd97706,
          emissiveIntensity: 0.35
        });
        const tankMat = this._material('industrial', { color: 0xeab308, roughness: 0.45, metalness: 0.6 });
        const foamNozzle = this._material('darkMetal', { color: 0x334155, roughness: 0.3, metalness: 0.85 });
        // Masque à visière panoramique bombée dorée
        root.add(this._ellipsoid(hazmatVisor, { x: 0.38, y: 0.28, z: 0.22 }, { x: 0, y: torsoY + 1.25, z: 0.36 }, 'hazmat_panoramic_visor', 16));
        // Cartouches de filtration jumelées sous les maxillaires
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._segment(dark, new T.Vector3(side * 0.24, torsoY + 1.05, 0.15), new T.Vector3(side * 0.32, torsoY + 0.95, 0.35), 0.08, 0.08, `hazmat_filter_${side}`, 10));
          // Réservoir dorsal de mousse chimique neutralisante pressurisée
          root.add(this._segment(tankMat, new T.Vector3(side * 0.24, torsoY - 0.5, -0.42), new T.Vector3(side * 0.24, torsoY + 0.55, -0.42), 0.14, 0.14, `hazmat_foam_tank_${side}`, 14));
          root.add(this._ring(dark, 0.17, 0.03, { x: side * 0.24, y: torsoY, z: -0.42 }, { x: 0, y: 0, z: 0 }, `hazmat_tank_strap_${side}`));
        }
        // Tuyau spiralé d'alimentation vers le canon à mousse
        root.add(this._tube(dark, [
          { x: 0.24, y: torsoY - 0.3, z: -0.42 },
          { x: 0.55, y: torsoY - 0.55, z: -0.1 },
          { x: profile.shoulderX + 0.18, y: torsoY - 0.75, z: 0.25 }
        ], 0.045, 'hazmat_feed_hose', 14, 6));
        // Canon à mousse ignifuge et neutralisante d'acide
        root.add(this._segment(foamNozzle, new T.Vector3(profile.shoulderX + 0.18, torsoY - 0.75, 0.2), new T.Vector3(profile.shoulderX + 0.18, torsoY - 0.75, 1.25), 0.085, 0.12, 'hazmat_foam_cannon', 12));
      } else if (type === 'weyland_drone_operator') {
        // Chantier 87 : Droniste de Combat Weyland-Yutani & Console de Télémesure (Aliens: Dark Descent)
        const screenMat = this._material('emissiveGreen', { color: 0x0284c7, emissive: 0x38bdf8, emissiveIntensity: 2.2 });
        const antennaMat = this._material('darkMetal', { color: 0x09090b, roughness: 0.3, metalness: 0.9 });
        // Console de télécommande tactique sur l'avant-bras gauche
        root.add(this._box(antennaMat, { x: 0.22, y: 0.06, z: 0.32 }, { x: -profile.shoulderX - 0.16, y: torsoY - 0.45, z: 0.35 }, 'drone_controller_pad', true));
        root.add(this._box(screenMat, { x: 0.18, y: 0.02, z: 0.26 }, { x: -profile.shoulderX - 0.16, y: torsoY - 0.42, z: 0.35 }, 'drone_screen_holo'));
        // Mât d'antenne de liaison de données satellite repliable dans le dos
        root.add(this._segment(antennaMat, new T.Vector3(0.25, torsoY + 0.35, -0.32), new T.Vector3(0.3, torsoY + 1.65, -0.38), 0.025, 0.012, 'drone_link_antenna', 8));
        root.add(this._ellipsoid(screenMat, { x: 0.04, y: 0.04, z: 0.04 }, { x: 0.3, y: torsoY + 1.68, z: -0.38 }, 'drone_link_beacon', 8));
      } else if (type === 'uscm_sniper') {
        // Chantier 92 : Tireur d'Élite USCM & Fusil de Précision M42A Scoped Pulse Rifle (Aliens / Dark Descent)
        const scopeMat = this._material('darkMetal', { color: 0x09090b, roughness: 0.25, metalness: 0.95 });
        const laserRed = this._material('emissiveRed', { color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 4.0 });
        // Monoculaire thermique sur le côté droit du casque
        root.add(this._segment(scopeMat, new T.Vector3(0.18, torsoY + 1.32, 0.22), new T.Vector3(0.18, torsoY + 1.32, 0.44), 0.045, 0.038, 'sniper_nv_monocular', 8));
        root.add(this._ellipsoid(laserRed, { x: 0.03, y: 0.03, z: 0.01 }, { x: 0.18, y: torsoY + 1.32, z: 0.44 }, 'sniper_optic_glow'));
        // Fusil de sniper M42A long lourd à deux mains
        root.add(this._box(scopeMat, { x: 0.12, y: 0.18, z: 1.15 }, { x: profile.shoulderX + 0.06, y: torsoY - 0.6, z: 0.65 }, 'm42a_sniper_chassis', true));
        root.add(this._segment(scopeMat, new T.Vector3(profile.shoulderX + 0.06, torsoY - 0.58, 1.2), new T.Vector3(profile.shoulderX + 0.06, torsoY - 0.58, 2.45), 0.032, 0.024, 'm42a_long_barrel', 8));
        root.add(this._segment(scopeMat, new T.Vector3(profile.shoulderX + 0.06, torsoY - 0.46, 0.4), new T.Vector3(profile.shoulderX + 0.06, torsoY - 0.46, 1.1), 0.05, 0.05, 'm42a_thermal_scope', 8));
        // Faisceau laser de visée rouge continu vers la cible
        root.add(this._segment(laserRed, new T.Vector3(profile.shoulderX + 0.06, torsoY - 0.64, 2.45), new T.Vector3(profile.shoulderX + 0.06, torsoY - 0.64, 8.5), 0.012, 0.012, 'm42a_laser_sight_beam', 6));
      } else if (type === 'weyland_containment_squad') {
        // Chantier 97 : Équipe d'Intervention Confinement Weyland-Yutani & Filet Cryogénique (Romulus / Comics)
        const containmentVisor = this._material('darkMetal', { color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 0.6, metalness: 0.9 });
        const cryoTankMat = this._material('industrial', { color: 0x38bdf8, roughness: 0.35, metalness: 0.75 });
        const cryoGlow = this._material('emissiveGreen', { color: 0x0284c7, emissive: 0x38bdf8, emissiveIntensity: 2.8 });
        // Masque intégral pressurisé miroir orange
        root.add(this._ellipsoid(containmentVisor, { x: 0.38, y: 0.28, z: 0.25 }, { x: 0, y: torsoY + 1.25, z: 0.36 }, 'containment_visor_dome', 16));
        // Bonbonne de fréon liquide cryogénique sur l'épaule gauche
        root.add(this._segment(cryoTankMat, new T.Vector3(-0.38, torsoY + 0.4, -0.35), new T.Vector3(-0.38, torsoY + 1.25, -0.35), 0.13, 0.13, 'cryo_freon_tank', 12));
        root.add(this._ring(dark, 0.16, 0.03, { x: -0.38, y: torsoY + 0.8, z: -0.35 }, { x: 0, y: 0, z: 0 }, 'cryo_tank_clamp'));
        // Lanceur de filet cryogénique monté sur l'avant-bras droit
        root.add(this._segment(dark, new T.Vector3(profile.shoulderX + 0.16, torsoY - 0.72, 0.3), new T.Vector3(profile.shoulderX + 0.16, torsoY - 0.72, 1.2), 0.095, 0.15, 'cryo_net_launcher', 12));
        root.add(this._ellipsoid(cryoGlow, { x: 0.12, y: 0.12, z: 0.06 }, { x: profile.shoulderX + 0.16, y: torsoY - 0.72, z: 1.2 }, 'cryo_capsule_muzzle', 10));
      } else if (type === 'uscm_heavy_flamer') {
        // Chantier 102 : Équipe de Choc USCM "Heavy Flamer Squad" & Lance-Flammes Lourd M240A1 (Aliens 1986 / Dark Descent)
        const goldVisor = this._material('industrial', { color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.45, metalness: 0.95, roughness: 0.12 });
        const napalmTankMat = this._material('industrial', { color: 0xdc2626, roughness: 0.32, metalness: 0.65 });
        const pilotBlue = this._material('emissiveGreen', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 3.5 });
        // Visière thermique réfléchissante dorée M3
        root.add(this._ellipsoid(goldVisor, { x: 0.36, y: 0.24, z: 0.22 }, { x: 0, y: torsoY + 1.25, z: 0.36 }, 'heavy_flamer_gold_visor', 14));
        // Double bonbonne dorsale de napalm liquide pressurisée avec sangles d'acier
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._segment(napalmTankMat, new T.Vector3(side * 0.26, torsoY - 0.55, -0.45), new T.Vector3(side * 0.26, torsoY + 0.65, -0.45), 0.16, 0.16, `m240_napalm_tank_${side}`, 14));
          root.add(this._ring(dark, 0.19, 0.035, { x: side * 0.26, y: torsoY + 0.05, z: -0.45 }, { x: 0, y: 0, z: 0 }, `m240_tank_strap_${side}`));
        }
        // Conduite haute pression blindée vers le lance-flammes M240A1
        root.add(this._tube(dark, [
          { x: 0.26, y: torsoY - 0.35, z: -0.45 },
          { x: 0.62, y: torsoY - 0.58, z: -0.1 },
          { x: profile.shoulderX + 0.18, y: torsoY - 0.72, z: 0.35 }
        ], 0.05, 'm240_fuel_hose', 14, 6));
        // Lance-flammes lourd M240A1 Incinerator Unit avec manchon thermique perforé et veilleuse bleue
        root.add(this._box(dark, { x: 0.16, y: 0.22, z: 0.95 }, { x: profile.shoulderX + 0.18, y: torsoY - 0.72, z: 0.65 }, 'm240_flamer_body', true));
        root.add(this._segment(dark, new T.Vector3(profile.shoulderX + 0.18, torsoY - 0.7, 1.1), new T.Vector3(profile.shoulderX + 0.18, torsoY - 0.7, 1.75), 0.065, 0.055, 'm240_heat_shroud', 10));
        root.add(this._ellipsoid(pilotBlue, { x: 0.05, y: 0.05, z: 0.09 }, { x: profile.shoulderX + 0.18, y: torsoY - 0.78, z: 1.82 }, 'm240_pilot_flame', 8));
      } else if (type === 'uscm_combat_engineer') {
        // Chantier 114 : Unité Tactique USCM "Combat Engineer" (Aliens: Dark Descent)
        const weldingVisor = this._material('industrial', { color: 0x1e293b, roughness: 0.25, metalness: 0.8 });
        const visorStripe = this._material('emissiveAmber', { color: 0xeab308, emissive: 0xca8a04, emissiveIntensity: 1.5 });
        const steelSpool = this._material('industrial', { color: 0x64748b, roughness: 0.35, metalness: 0.9 });
        // Visière de soudage / démolition M3 renforcée
        root.add(this._box(weldingVisor, { x: 0.38, y: 0.32, z: 0.22 }, { x: 0, y: torsoY + 1.22, z: 0.32 }, 'engineer_welding_helmet', true));
        root.add(this._box(visorStripe, { x: 0.28, y: 0.08, z: 0.05 }, { x: 0, y: torsoY + 1.25, z: 0.44 }, 'engineer_visor_band'));
        // Rouleau de fil de concertina barbelé fixé sur l'épaule gauche
        root.add(this._segment(steelSpool, new T.Vector3(-0.38, torsoY + 0.4, -0.32), new T.Vector3(-0.38, torsoY + 1.1, -0.32), 0.22, 0.22, 'engineer_barbed_wire_rack', 14));
        root.add(this._ring(dark, 0.26, 0.04, { x: -0.38, y: torsoY + 0.75, z: -0.32 }, { x: 0, y: 0, z: 0 }, 'engineer_rack_strap'));
        // Découpeur plasma / pistolet agrafeur de concertina sur le bras droit
        root.add(this._box(dark, { x: 0.14, y: 0.18, z: 0.65 }, { x: profile.shoulderX + 0.16, y: torsoY - 0.72, z: 0.55 }, 'engineer_plasma_welder', true));
        root.add(this._coneAlong(visorStripe, { x: profile.shoulderX + 0.16, y: torsoY - 0.72, z: 0.88 }, { x: 0, y: 0, z: 1 }, 0.04, 0.18, 'welder_plasma_tip', 8));
      } else if (type === 'uscm_sadar_operator') {
        // Chantier 193 : Opérateur USCM Lance-Roquettes Antichar Guidé M57A1 SADAR (Aliens lore)
        root.add(this._ellipsoid(materials.visor, { x: 0.38, y: 0.22, z: 0.22 }, { x: 0, y: torsoY + 1.25, z: 0.36 }, 'sadar_ballistic_visor', 14));
        const rocketGreen = this._material('industrial', { color: 0x15803d, metalness: 0.5, roughness: 0.5 });
        for (let r = 0; r < 3; r++) {
          const offsetX = (r - 1) * 0.22;
          root.add(this._segment(rocketGreen, new T.Vector3(offsetX, torsoY - 0.5, -0.42), new T.Vector3(offsetX, torsoY + 0.7, -0.42), 0.08, 0.08, `sadar_spare_rocket_${r}`, 10));
          root.add(this._ellipsoid(dark, { x: 0.09, y: 0.12, z: 0.09 }, { x: offsetX, y: torsoY + 0.72, z: -0.42 }, `sadar_rocket_cap_${r}`, 8));
        }
      } else if (type === 'uscm_recon_scout') {
        // Chantier 203 : Unité USCM "Recon Scout Sniper" (Aliens: Fireteam Elite)
        root.add(this._box(dark, { x: 0.14, y: 0.12, z: 0.22 }, { x: 0.16, y: torsoY + 1.25, z: 0.38 }, 'recon_monocular_optic', true));
        root.add(this._ellipsoid(accent, { x: 0.05, y: 0.05, z: 0.03 }, { x: 0.16, y: torsoY + 1.25, z: 0.5 }, 'recon_lens_glow', 8));
        root.add(this._segment(dark, new T.Vector3(-0.25, torsoY + 0.65, -0.28), new T.Vector3(-0.28, torsoY + 1.2, -0.3), 0.025, 0.015, 'recon_antenna', 6));
      } else if (type === 'uscm_combat_medic') {
        // Chantier 213 : Unité USCM "Combat Medic" (Aliens: Fireteam Elite)
        const crossRed = this._material('emissiveRed', { color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 2.5 });
        root.add(this._ring(crossRed, 0.16, 0.05, { x: -profile.shoulderX - 0.08, y: torsoY + 0.25, z: 0 }, { x: 0, y: Math.PI / 2, z: 0 }, 'medic_armband'));
        root.add(this._box(crossRed, { x: 0.24, y: 0.08, z: 0.05 }, { x: 0, y: torsoY + 0.35, z: 0.38 }, 'medic_chest_cross_h'));
        root.add(this._box(crossRed, { x: 0.08, y: 0.24, z: 0.05 }, { x: 0, y: torsoY + 0.35, z: 0.38 }, 'medic_chest_cross_v'));
        const stimGreen = this._material('emissiveGreen', { color: 0x22c55e, emissive: 0x15803d, emissiveIntensity: 2.0 });
        root.add(this._cylinder(stimGreen, 0.03, 0.03, 0.18, { x: 0.24, y: torsoY - 0.5, z: 0.25 }, { x: 0, y: 0, z: 0 }, 'medic_belt_stim_0'));
        root.add(this._cylinder(stimGreen, 0.03, 0.03, 0.18, { x: 0.32, y: torsoY - 0.5, z: 0.25 }, { x: 0, y: 0, z: 0 }, 'medic_belt_stim_1'));
      } else if (type === 'uscm_recon_sniper') {
        // Chantier 223 : Unité USCM "Forward Observer / Recon Sniper" (Aliens: Dark Descent)
        const lensRed = this._material('emissiveRed', { color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 2.5 });
        root.add(this._ellipsoid(lensRed, { x: 0.06, y: 0.06, z: 0.04 }, { x: 0.18, y: torsoY + 1.25, z: 0.48 }, 'recon_thermal_monocle', 8));
        root.add(this._segment(dark, new T.Vector3(-0.28, torsoY + 0.65, -0.28), new T.Vector3(-0.32, torsoY + 1.45, -0.32), 0.025, 0.012, 'recon_whip_antenna', 6));
        const claymoreMat = this._material('industrial', { color: 0x475569 });
        root.add(this._box(claymoreMat, { x: 0.22, y: 0.18, z: 0.1 }, { x: 0.42, y: torsoY - 0.2, z: 0 }, 'recon_thigh_claymore_pouch'));
      } else if (type === 'uscm_demolitionist') {
        // Unité USCM Demolitionist (Aliens: Fireteam Elite)
        const ammoGold = this._material('industrial', { color: 0xd97706, metalness: 0.9, roughness: 0.2 });
        for (let g = 0; g < 4; g++) {
          root.add(this._cylinder(ammoGold, 0.045, 0.045, 0.18, { x: -0.3 + g * 0.2, y: torsoY + 0.25, z: 0.42 }, { x: 0, y: 0, z: Math.PI / 2 }, `demo_grenade_${g}`));
        }
        root.add(this._box(dark, { x: 0.28, y: 0.35, z: 0.8 }, { x: profile.shoulderX + 0.18, y: torsoY - 0.65, z: 0.5 }, 'm40_grenade_launcher', true));
        root.add(this._cylinder(dark, 0.08, 0.08, 0.35, { x: -0.36, y: torsoY + 1.05, z: -0.35 }, { x: 0, y: 0, z: 0 }, 'demo_shoulder_pod'));
      } else if (type === 'uscm_phalanx_shield') {
        // Unité USCM Phalanx Riot Shield (Aliens: Fireteam Elite)
        const shieldMat = this._material('industrial', { color: 0x334155, metalness: 0.8, roughness: 0.3 });
        const glassMat = this._material('glass', { color: 0x38bdf8, opacity: 0.7, transparent: true });
        root.add(this._box(shieldMat, { x: 0.9, y: 1.6, z: 0.1 }, { x: -profile.shoulderX - 0.2, y: torsoY - 0.15, z: 0.55 }, 'phalanx_riot_shield', true));
        root.add(this._box(glassMat, { x: 0.45, y: 0.18, z: 0.06 }, { x: -profile.shoulderX - 0.2, y: torsoY + 0.4, z: 0.58 }, 'phalanx_shield_viewport'));
        root.add(this._box(dark, { x: 0.12, y: 0.18, z: 0.45 }, { x: profile.shoulderX + 0.15, y: torsoY - 0.65, z: 0.4 }, 'phalanx_tactical_sidearm'));
      } else if (type === 'uscm_sentry_sapper') {
        // Unité USCM Sentry Sapper (Aliens: Dark Descent)
        const sentryPackMat = this._material('industrial', { color: 0x1e293b, metalness: 0.7 });
        root.add(this._box(sentryPackMat, { x: 0.65, y: 0.85, z: 0.45 }, { x: 0, y: torsoY + 0.25, z: -0.45 }, 'sapper_sentry_backpack', true));
        root.add(this._cylinder(dark, 0.03, 0.03, 0.7, { x: -0.22, y: torsoY + 0.65, z: -0.5 }, { x: 0.3, y: 0, z: 0 }, 'sapper_tripod_leg_1'));
        root.add(this._cylinder(dark, 0.03, 0.03, 0.7, { x: 0.22, y: torsoY + 0.65, z: -0.5 }, { x: 0.3, y: 0, z: 0 }, 'sapper_tripod_leg_2'));
      } else if (type === 'uscm_field_commander') {
        // Officier USCM Field Commander (Aliens 1986 / Dark Descent)
        const goldChevron = this._material('industrial', { color: 0xfbbf24, metalness: 0.95 });
        root.add(this._box(goldChevron, { x: 0.2, y: 0.12, z: 0.04 }, { x: 0, y: torsoY + 0.38, z: 0.42 }, 'commander_insignia'));
        root.add(this._segment(dark, new T.Vector3(0.28, torsoY + 0.6, -0.3), new T.Vector3(0.35, torsoY + 1.6, -0.35), 0.03, 0.015, 'commander_sat_antenna', 6));
        root.add(this._box(dark, { x: 0.28, y: 0.18, z: 0.05 }, { x: 0, y: torsoY + 0.15, z: 0.44 }, 'commander_tactical_pad'));
      } else if (type === 'uscm_breacher_shotgun') {
        // Spécialiste USCM Breacher Shotgun (Aliens 1986)
        const shellRed = this._material('industrial', { color: 0xef4444 });
        for (let s = 0; s < 6; s++) {
          root.add(this._cylinder(shellRed, 0.028, 0.028, 0.12, { x: -0.3 + s * 0.12, y: torsoY + 0.1, z: 0.42 }, { x: 0, y: 0, z: Math.PI / 2 }, `breacher_shell_${s}`));
        }
        root.add(this._box(dark, { x: 0.12, y: 0.2, z: 1.1 }, { x: profile.shoulderX + 0.18, y: torsoY - 0.65, z: 0.6 }, 'breacher_shotgun_body', true));
      } else if (type === 'uscm_exosuit_commando') {
        // Commando USCM Exosuit Mk-IV
        const exoFrame = this._material('industrial', { color: 0x1e293b, metalness: 0.85, roughness: 0.3 });
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._box(exoFrame, { x: 0.18, y: 1.8, z: 0.22 }, { x: side * (profile.shoulderX + 0.22), y: torsoY - 0.1, z: 0 }, `exo_spine_rail_${side}`, true));
          root.add(this._cylinder(dark, 0.09, 0.09, 0.75, { x: side * 0.42, y: torsoY + 1.25, z: -0.25 }, { x: 0, y: 0, z: 0 }, `exo_shoulder_cannon_${side}`));
        }
      } else if (type === 'seegson_hazmat_joe') {
        // Working Joe Hazmat Combinaison Caoutchouc Orange (Alien: Isolation)
        const whiteMask = this._material('skin', { color: 0xf8fafc, roughness: 0.2, metalness: 0.1 });
        const synthEye = this._material('emissiveBlue', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.2 });
        root.add(this._ellipsoid(whiteMask, { x: 0.32, y: 0.38, z: 0.32 }, { x: 0, y: torsoY + 1.25, z: 0.08 }, 'working_joe_porcelain_face', 14));
        for (let eye = -1; eye <= 1; eye += 2) {
          root.add(this._ellipsoid(synthEye, { x: 0.04, y: 0.04, z: 0.03 }, { x: eye * 0.12, y: torsoY + 1.28, z: 0.38 }, `joe_eye_${eye}`));
        }
        root.add(this._box(dark, { x: 0.1, y: 0.14, z: 0.85 }, { x: profile.shoulderX + 0.15, y: torsoY - 0.7, z: 0.45 }, 'joe_pipe_wrench', true));
      } else if (type === 'seegson_security_joe') {
        // Working Joe Sécurité Veston Sombre & Yeux Rouges (Alien: Isolation)
        const whiteMask = this._material('skin', { color: 0xf8fafc, roughness: 0.2, metalness: 0.1 });
        const redEye = this._material('emissiveRed', { color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 3.5 });
        const stunGlow = this._material('emissiveBlue', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.8 });
        root.add(this._ellipsoid(whiteMask, { x: 0.32, y: 0.38, z: 0.32 }, { x: 0, y: torsoY + 1.25, z: 0.08 }, 'security_joe_face', 14));
        for (let eye = -1; eye <= 1; eye += 2) {
          root.add(this._ellipsoid(redEye, { x: 0.04, y: 0.04, z: 0.03 }, { x: eye * 0.12, y: torsoY + 1.28, z: 0.38 }, `security_joe_eye_${eye}`));
        }
        root.add(this._cylinder(dark, 0.035, 0.035, 1.1, { x: profile.shoulderX + 0.15, y: torsoY - 0.6, z: 0.5 }, { x: 0, y: 0, z: 0 }, 'security_stun_baton'));
        root.add(this._ellipsoid(stunGlow, { x: 0.06, y: 0.09, z: 0.06 }, { x: profile.shoulderX + 0.15, y: torsoY - 0.05, z: 0.5 }, 'stun_baton_arc_tip'));
      } else if (type === 'weyland_strike_synth') {
        // Synthétique Weyland Strike Team Black-Ops
        const carbonMat = this._material('darkMetal', { color: 0x0a0a0c, metalness: 0.95, roughness: 0.15 });
        const hudBlue = this._material('emissiveBlue', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 3.0 });
        root.add(this._box(carbonMat, { x: 0.45, y: 0.2, z: 0.2 }, { x: 0, y: torsoY + 1.25, z: 0.35 }, 'strike_synth_visor', true));
        root.add(this._ellipsoid(hudBlue, { x: 0.05, y: 0.05, z: 0.03 }, { x: 0.12, y: torsoY + 1.26, z: 0.45 }, 'strike_synth_hud'));
        root.add(this._box(carbonMat, { x: 0.1, y: 0.18, z: 0.65 }, { x: profile.shoulderX + 0.16, y: torsoY - 0.7, z: 0.4 }, 'strike_pulse_carbine'));
      } else if (type === 'weyland_specimen_trapper') {
        // Traqueur de Spécimen Weyland-Yutani
        const poleMat = this._material('steel', { color: 0x94a3b8, metalness: 0.9 });
        const snareMat = this._material('emissiveBlue', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.2 });
        root.add(this._cylinder(poleMat, 0.03, 0.03, 1.8, { x: profile.shoulderX + 0.18, y: torsoY - 0.35, z: 0.6 }, { x: 0, y: 0, z: 0 }, 'trapper_catch_pole'));
        root.add(this._ring(snareMat, 0.32, 0.04, { x: profile.shoulderX + 0.18, y: torsoY + 0.55, z: 0.6 }, { x: Math.PI / 2, y: 0, z: 0 }, 'trapper_stun_snare'));
      } else if (type === 'weyland_director_officer') {
        // Directeur Exécutif Weyland-Yutani
        const coatMat = this._material('fabric', { color: 0x18181b, roughness: 0.65 });
        const goldSun = this._material('industrial', { color: 0xfbbf24, metalness: 0.95 });
        root.add(this._box(coatMat, { x: 0.85, y: 1.4, z: 0.48 }, { x: 0, y: torsoY - 0.35, z: 0 }, 'director_trench_coat', true));
        root.add(this._box(goldSun, { x: 0.18, y: 0.12, z: 0.05 }, { x: -0.25, y: torsoY + 0.35, z: 0.38 }, 'weyland_sun_badge'));
      } else if (type === 'weyland_heavy_mech') {
        // Mécha de Combat Lourd Weyland-Yutani
        const mechMat = this._material('industrial', { color: 0x27272a, metalness: 0.85, roughness: 0.3 });
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._box(mechMat, { x: 0.4, y: 1.2, z: 0.4 }, { x: side * (profile.shoulderX + 0.35), y: torsoY - 0.1, z: 0.2 }, `mech_hydraulic_arm_${side}`, true));
          root.add(this._box(dark, { x: 0.22, y: 0.35, z: 0.5 }, { x: side * (profile.shoulderX + 0.35), y: torsoY - 0.7, z: 0.5 }, `mech_claw_${side}`));
        }
      }
    }

    _createHumanFigure(type, compact) {
      const T = this._three();
      const root = new T.Group();
      root.name = `human_${type}`;

      const profile = this._humanVisualProfile(type, compact);
      const uniform = this._material('fabric', { color: profile.uniformColor });
      const armor = this._material('industrial', {
        color: profile.armorColor,
        metalness: type === 'scientist' ? 0.18 : 0.58
      });
      const dark = this._material('darkMetal', { color: 0x111827 });
      const skin = this._material('skin', { color: type === 'synthetic' ? 0xe5e7eb : 0xb7795b });
      const visor = this._material('glass', {
        color: type === 'incinerator' ? 0xfbbf24 : 0x67e8f9,
        emissive: type === 'synthetic' ? 0x38bdf8 : 0x000000,
        emissiveIntensity: type === 'synthetic' ? 0.55 : 0
      });
      const accent = this._material(
        type === 'incinerator' ? 'emissiveAmber' : 'emissiveGreen',
        type === 'synthetic'
          ? { color: 0x0c4a6e, emissive: 0x38bdf8, emissiveIntensity: 0.78 }
          : { emissiveIntensity: 0.75 }
      );

      const torsoY = compact ? 2.55 : 2.75;
      root.add(this._ellipsoid(
        uniform,
        profile.torso,
        { x: 0, y: torsoY, z: 0 },
        'torso',
        16
      ));
      root.add(this._ellipsoid(
        uniform,
        profile.pelvis,
        { x: 0, y: 1.82, z: 0 },
        'pelvis',
        14
      ));
      root.add(this._box(
        armor,
        profile.chest,
        { x: 0, y: torsoY + 0.1, z: profile.torso.z },
        'chest_armor',
        true
      ));
      root.add(this._box(
        dark,
        { x: profile.pelvis.x * 2.25, y: 0.13, z: profile.pelvis.z * 1.32 },
        { x: 0, y: 1.78, z: 0 },
        'utility_belt',
        true
      ));

      for (let side = -1; side <= 1; side += 2) {
        root.add(this._box(
          armor,
          { x: 0.22, y: 0.32, z: 0.26 },
          { x: side * (profile.hipX + 0.08), y: 1.55, z: 0.25 },
          `belt_pouch_${side}`,
          true
        ));
        this._addSegmentedLimb(
          root,
          uniform,
          armor,
          [
            { x: side * profile.shoulderX, y: torsoY + 0.38, z: 0 },
            { x: side * (profile.shoulderX + 0.24), y: torsoY - 0.27, z: 0.08 },
            { x: side * (profile.shoulderX + 0.1), y: torsoY - 0.92, z: 0.3 }
          ],
          [
            type === 'smartgunner' || type === 'incinerator' ? 0.23 : 0.2,
            type === 'synthetic' ? 0.145 : 0.17,
            type === 'synthetic' ? 0.11 : 0.13
          ],
          `arm_${side < 0 ? 'left' : 'right'}`,
          null
        );
        root.add(this._ellipsoid(
          skin,
          { x: 0.14, y: 0.2, z: 0.12 },
          { x: side * (profile.shoulderX + 0.1), y: torsoY - 1.08, z: 0.32 },
          `hand_${side}`,
          10
        ));
        this._addSegmentedLimb(
          root,
          uniform,
          armor,
          [
            { x: side * profile.hipX, y: 1.72, z: 0 },
            { x: side * (profile.hipX + 0.06), y: 0.92, z: side * 0.08 },
            { x: side * (profile.hipX + 0.02), y: 0.18, z: 0.04 }
          ],
          [
            type === 'marine' || type === 'smartgunner' || type === 'incinerator' ? 0.28 : 0.25,
            type === 'synthetic' ? 0.18 : 0.21,
            type === 'synthetic' ? 0.13 : 0.15
          ],
          `leg_${side < 0 ? 'left' : 'right'}`,
          null
        );
        root.add(this._ellipsoid(
          dark,
          { x: 0.24, y: 0.14, z: 0.43 },
          { x: side * (profile.hipX + 0.02), y: 0.08, z: 0.2 },
          `boot_${side}`,
          12
        ));
      }

      root.add(this._segment(
        skin,
        new T.Vector3(0, torsoY + 0.65, 0),
        new T.Vector3(0, torsoY + 0.86, 0),
        0.17,
        0.17,
        'neck',
        9
      ));
      root.add(this._ellipsoid(
        skin,
        {
          x: 0.34 * profile.helmetScale,
          y: (type === 'synthetic' ? 0.45 : 0.42) * profile.helmetScale,
          z: 0.34 * profile.helmetScale
        },
        { x: 0, y: torsoY + 1.18, z: 0.02 },
        'head',
        16
      ));

      const helmet = new T.Group();
      helmet.name = 'helmet_and_comms';
      helmet.position.set(0, torsoY + 1.2, 0);
      helmet.add(this._ellipsoid(
        armor,
        {
          x: 0.41 * profile.helmetScale,
          y: 0.35 * profile.helmetScale,
          z: 0.4 * profile.helmetScale
        },
        { x: 0, y: 0.12, z: -0.02 },
        type === 'synthetic' ? 'synthetic_cranial_casing' : 'helmet_shell',
        16
      ));
      helmet.add(this._box(
        visor,
        {
          x: 0.58 * profile.helmetScale,
          y: (type === 'commando' ? 0.14 : 0.2) * profile.helmetScale,
          z: 0.08
        },
        { x: 0, y: 0.1, z: 0.36 },
        type === 'synthetic' ? 'synthetic_optical_band' : 'visor',
        true
      ));
      helmet.add(this._box(
        dark,
        { x: 0.1, y: 0.22, z: 0.14 },
        { x: -0.42 * profile.helmetScale, y: 0.08, z: 0.02 },
        type === 'synthetic' ? 'synthetic_data_port' : 'comms_module',
        true
      ));
      if (type !== 'synthetic') {
        helmet.add(this._segment(
          dark,
          new T.Vector3(-0.42 * profile.helmetScale, 0.12, 0.04),
          new T.Vector3(-0.36 * profile.helmetScale, -0.02, 0.42),
          0.025,
          0.018,
          'microphone_boom',
          6
        ));
      }
      root.add(helmet);

      root.add(this._box(
        dark,
        profile.pack,
        { x: 0, y: torsoY + 0.05, z: -(profile.torso.z + profile.pack.z * 0.38) },
        'equipment_pack',
        true
      ));
      root.add(this._box(
        accent,
        { x: 0.16, y: 0.1, z: 0.04 },
        { x: 0.28, y: torsoY + 0.22, z: 0.45 },
        'suit_status_light'
      ));

      this._addHumanRoleDetails(
        root,
        type,
        { uniform, armor, dark, skin, visor, accent },
        torsoY,
        profile
      );

      const equipment = this._createEquipmentWeapon(type, armor, dark, accent);
      equipment.position.set(profile.shoulderX + 0.16, torsoY - 0.42, 0.52);
      equipment.rotation.x = -0.18;
      equipment.rotation.z = -0.08;
      root.add(equipment);
      root.userData.animationJoints = {
        head: 'helmet_and_comms',
        leftArm: 'arm_left',
        rightArm: 'arm_right',
        leftLeg: 'leg_left',
        rightLeg: 'leg_right'
      };
      return root;
    }

    _createExosuit() {
      const T = this._three();
      const root = new T.Group();
      root.name = 'caterpillar_p5000_powerloader';
      // Chantier 41 : Caterpillar P-5000 Power Loader (Aliens 1986 James Cameron)
      const catYellow = this._material('industrial', { color: 0xeab308, roughness: 0.38, metalness: 0.65 });
      const metal = catYellow;
      const dark = this._material('darkMetal', { color: 0x18181b, roughness: 0.45, metalness: 0.85 });
      const hazardAmber = this._material('emissiveAmber', { color: 0xf59e0b, emissiveIntensity: 2.2 });
      const hazardStripe = this._material('industrial', { color: 0x1c1917, roughness: 0.5 });
      const glass = this._material('glass', { color: 0x93c5fd, opacity: 0.34 });

      // Châssis central industriel lourd
      root.add(this._box(
        catYellow,
        { x: 2.6, y: 3.2, z: 1.35 },
        { x: 0, y: 3.25, z: 0 },
        'central_frame',
        true
      ));
      // Berceau du pilote avec harnais
      root.add(this._box(
        dark,
        { x: 1.42, y: 2.05, z: 0.86 },
        { x: 0, y: 3.35, z: 0.74 },
        'pilot_cradle',
        true
      ));
      // Arceau de sécurité tubulaire (Roll-Cage) Caterpillar P-5000 au-dessus du pilote
      for (let bar = -1; bar <= 1; bar += 2) {
        root.add(this._segment(
          catYellow,
          new T.Vector3(bar * 0.72, 4.4, 0.4),
          new T.Vector3(bar * 0.72, 5.25, 0.9),
          0.07,
          0.07,
          `rollcage_arch_${bar}`,
          12
        ));
      }
      root.add(this._segment(
        catYellow,
        new T.Vector3(-0.72, 5.25, 0.9),
        new T.Vector3(0.72, 5.25, 0.9),
        0.07,
        0.07,
        'rollcage_crossbar',
        12
      ));
      // Gyrophare rotatif d'avertissement orange vif sur le sommet de la cage (P-5000 Flashing Beacon)
      root.add(this._segment(
        dark,
        new T.Vector3(0, 5.25, 0.9),
        new T.Vector3(0, 5.48, 0.9),
        0.08,
        0.08,
        'beacon_stalk',
        10
      ));
      root.add(this._ellipsoid(
        hazardAmber,
        { x: 0.18, y: 0.22, z: 0.18 },
        { x: 0, y: 5.65, z: 0.9 },
        'p5000_amber_beacon',
        16
      ));

      root.add(this._box(
        glass,
        { x: 1.18, y: 0.78, z: 0.08 },
        { x: 0, y: 4.06, z: 1.2 },
        'cockpit_shield',
        true
      ));

      const pilot = this._createHumanFigure('guard', true);
      pilot.name = 'exosuit_pilot';
      pilot.scale.setScalar(0.67);
      pilot.position.set(0, 1.02, 0.63);
      root.add(pilot);

      for (let side = -1; side <= 1; side += 2) {
        root.add(this._box(
          dark,
          { x: 0.28, y: 3.25, z: 0.34 },
          { x: side * 1.24, y: 3.46, z: -0.42 },
          `frame_rail_${side}`,
          true
        ));
        // Bandes de sécurité chevron noir/jaune sur l'épaulement
        root.add(this._box(
          hazardStripe,
          { x: 0.38, y: 0.28, z: 0.06 },
          { x: side * 1.34, y: 4.45, z: 0.42 },
          `hazard_chevrons_${side}`
        ));
        root.add(this._box(
          hazardAmber,
          { x: 0.16, y: 0.22, z: 0.08 },
          { x: side * 1.32, y: 4.52, z: 0.72 },
          `warning_light_${side}`
        ));
        this._addMechanicalLimb(
          root,
          catYellow,
          dark,
          [
            { x: side * 1.04, y: 2.12, z: 0 },
            { x: side * 1.26, y: 1.12, z: 0.15 },
            { x: side * 1.16, y: 0.2, z: 0.06 }
          ],
          [0.34, 0.3, 0.24],
          `exosuit_leg_${side < 0 ? 'left' : 'right'}`,
          false
        );
        root.add(this._box(
          dark,
          { x: 0.7, y: 0.25, z: 1.08 },
          { x: side * 1.16, y: 0.12, z: 0.28 },
          `stability_foot_${side}`,
          true
        ));
        this._addMechanicalLimb(
          root,
          catYellow,
          dark,
          [
            { x: side * 1.34, y: 4.22, z: 0 },
            { x: side * 2.03, y: 3.18, z: 0.26 },
            { x: side * 2.24, y: 2.08, z: 0.72 }
          ],
          [0.31, 0.26, 0.22],
          `exosuit_arm_${side < 0 ? 'left' : 'right'}`,
          true
        );

        // Pinces de préhension hydrauliques massives P-5000 (Upper & Lower Heavy Claws)
        const clawGroup = new T.Group();
        clawGroup.name = `p5000_hydraulic_pincer_${side < 0 ? 'left' : 'right'}`;
        clawGroup.position.set(side * 2.24, 2.08, 0.72);
        // Poignet rotatif
        clawGroup.add(this._ring(dark, 0.26, 0.06, { x: 0, y: 0, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, `pincer_wrist_${side}`));
        // Mâchoire supérieure crantée
        clawGroup.add(this._segment(
          catYellow,
          new T.Vector3(0, 0.12, 0),
          new T.Vector3(side * 0.15, 0.35, 0.75),
          0.12,
          0.08,
          `upper_claw_prong_${side}`,
          12
        ));
        // Mâchoire inférieure crantée
        clawGroup.add(this._segment(
          catYellow,
          new T.Vector3(0, -0.12, 0),
          new T.Vector3(side * 0.15, -0.35, 0.75),
          0.12,
          0.08,
          `lower_claw_prong_${side}`,
          12
        ));
        // Vérin hydraulique central
        clawGroup.add(this._segment(
          dark,
          new T.Vector3(0, 0, 0),
          new T.Vector3(0, 0, 0.45),
          0.09,
          0.07,
          `pincer_actuator_${side}`,
          10
        ));
        root.add(clawGroup);
      }

      root.add(this._tube(
        dark,
        [
          { x: -0.9, y: 4.45, z: -0.35 },
          { x: -1.36, y: 4.8, z: -0.82 },
          { x: -1.92, y: 3.6, z: -0.22 }
        ],
        0.08,
        'left_hydraulic_hose',
        20,
        7
      ));
      root.add(this._tube(
        dark,
        [
          { x: 0.9, y: 4.45, z: -0.35 },
          { x: 1.36, y: 4.8, z: -0.82 },
          { x: 1.92, y: 3.6, z: -0.22 }
        ],
        0.08,
        'right_hydraulic_hose',
        20,
        7
      ));
      root.userData.animationJoints = {
        leftArm: 'exosuit_arm_left',
        rightArm: 'exosuit_arm_right',
        leftLeg: 'exosuit_leg_left',
        rightLeg: 'exosuit_leg_right',
        leftPincer: 'p5000_hydraulic_pincer_left',
        rightPincer: 'p5000_hydraulic_pincer_right'
      };
      return this._finalize(root, { modelType: 'human', subtype: 'powerloader', height: 5.65 });
    }

    // -------------------------------------------------------------------------
    // 7. PUBLIC MODEL: ORGANIC INCUBATOR
    // -------------------------------------------------------------------------
    createEgg(open) {
      const T = this._three();
      const root = new T.Group();
      root.name = open ? 'organic_incubator_open' : 'organic_incubator_closed';
      const petalJoints = [];
      const closedPetalAngle = -1.46;
      const openPetalAngle = -0.18;
      const shell = this._material('chitinWarm', { color: 0x4a352d, roughness: 0.58 });
      const membrane = this._material('resin', {
        color: 0x5b2132,
        emissive: 0x3f0b1a,
        emissiveIntensity: 0.42,
        opacity: 0.82
      });
      const inner = this._material('emissiveGreen', {
        color: 0x294d2a,
        emissive: 0x74d321,
        emissiveIntensity: 0.62
      });

      const shellBody = this._ellipsoid(shell,
        { x: 1.34, y: 1.95, z: 1.34 }, { x: 0, y: 1.55, z: 0 }, 'shell_body', 48);
      const skinVertices = shellBody.geometry.attributes.position;
      for (let i = 0; i < skinVertices.count; i++) {
        const y = skinVertices.getY(i), angle = Math.atan2(skinVertices.getZ(i), skinVertices.getX(i));
        const lobe = 1 + Math.sin(angle * 8 + y * 0.8) * 0.024 + Math.max(0, -y) * 0.08;
        skinVertices.setX(i, skinVertices.getX(i) * lobe);
        skinVertices.setZ(i, skinVertices.getZ(i) * lobe);
      }
      skinVertices.needsUpdate = true; shellBody.geometry.computeVertexNormals();
      root.add(shellBody);
      root.add(this._ring(
        membrane,
        1.12,
        0.16,
        { x: 0, y: 0.34, z: 0 },
        { x: Math.PI / 2, y: 0, z: 0 },
        'root_collar'
      ));
      for (let petalIndex = 0; petalIndex < 4; petalIndex++) {
        const angle = petalIndex * Math.PI / 2;
        const petalRoot = new T.Group();
        petalRoot.name = `articulated_petal_${petalIndex}`;
        petalRoot.position.set(0, 3.08, 0);
        petalRoot.rotation.y = angle;
        petalRoot.rotation.x = open ? openPetalAngle : closedPetalAngle;
        petalRoot.userData.closedRotationX = closedPetalAngle;
        petalRoot.userData.openRotationX = openPetalAngle;
        petalRoot.add(this._ellipsoid(
          shell,
          { x: 0.8, y: 0.18, z: 1.06 },
          { x: 0, y: 0.06, z: 0.64 },
          'petal_shell',
          36
        ));
        petalRoot.add(this._ellipsoid(
          membrane,
          { x: 0.59, y: 0.08, z: 0.79 },
          { x: 0, y: 0.2, z: 0.62 },
          'petal_membrane',
          28
        ));
        for (let vein = -1; vein <= 1; vein++) {
          petalRoot.add(this._tube(
            inner,
            [
              { x: vein * 0.16, y: 0.25, z: 0.1 },
              { x: vein * 0.22, y: 0.28, z: 0.6 },
              { x: vein * 0.12, y: 0.21, z: 1.16 }
            ],
            0.028,
            `petal_vein_${vein}`,
            12,
            5
          ));
        }
        root.add(petalRoot);
        petalJoints.push(petalRoot);
      }

      // This shallow seal guarantees that the closed incubator has no visible
      // luminous aperture, even from the high gameplay camera.
      const apicalSeal = this._ellipsoid(
        shell,
        { x: 0.84, y: 0.13, z: 0.84 },
        { x: 0, y: 3.25, z: 0 },
        'apical_seal',
        32
      );
      root.add(apicalSeal);

      const innerAssembly = new T.Group();
      innerAssembly.name = 'incubator_inner_assembly';
      innerAssembly.add(this._ellipsoid(
        inner,
        { x: 0.72, y: 0.42, z: 0.72 },
        { x: 0, y: 3.24, z: 0 },
        'incubator_core',
        28
      ));
      for (let tendril = 0; tendril < 6; tendril++) {
        const angle = tendril / 6 * Math.PI * 2;
        innerAssembly.add(this._tube(
          membrane,
          [
            { x: 0, y: 3.12, z: 0 },
            { x: Math.cos(angle) * 0.35, y: 3.25, z: Math.sin(angle) * 0.35 },
            { x: Math.cos(angle) * 0.72, y: 3.34, z: Math.sin(angle) * 0.72 }
          ],
          0.045,
          `inner_tendril_${tendril}`,
          12,
          6
        ));
      }
      root.add(innerAssembly);

      this._addCarapaceSpines(root, shell, 1.25, 7, 1.8, 1.28, -1);
      const egg = this._finalize(root, {
        modelType: 'egg',
        open: !!open,
        height: open ? 3.55 : 4.45,
        animationJoints: {
          petals: ['articulated_petal_0', 'articulated_petal_1', 'articulated_petal_2', 'articulated_petal_3']
        },
        animationRoles: {
          interaction: ['articulated_petal_0', 'articulated_petal_1', 'articulated_petal_2', 'articulated_petal_3']
        }
      });

      egg.userData.setOpenProgress = (value) => {
        const progress = Math.max(0, Math.min(1, Number(value) || 0));
        petalJoints.forEach((petal) => {
          petal.rotation.x = closedPetalAngle + (openPetalAngle - closedPetalAngle) * progress;
        });
        apicalSeal.visible = progress < 0.08;
        innerAssembly.visible = progress > 0.08;
        egg.userData.openProgress = progress;
        egg.userData.open = progress >= 0.98;
      };
      egg.userData.setOpen = (state) => egg.userData.setOpenProgress(state ? 1 : 0);
      egg.userData.petalJoints = petalJoints;
      egg.userData.setOpenProgress(open ? 1 : 0);
      return egg;
    }

    // -------------------------------------------------------------------------
    // 8. PUBLIC MODEL: PARASITIC CRAWLER
    // -------------------------------------------------------------------------
    createFacehugger(variant = 'standard') {
      const T = this._three();
      const root = new T.Group();
      const isBlackGoo = variant === 'black_goo';
      root.name = isBlackGoo ? 'mutated_black_goo_crawler' : 'parasitic_crawler';
      const legJoints = [];
      const kneeJoints = [];
      const ankleJoints = [];
      const hide = isBlackGoo
        ? this._material('chitin', { color: 0x09090b, roughness: 0.18, metalness: 0.82 })
        : this._material('skin', { color: 0xc5b69b, roughness: 0.58, clearcoat: 0.2 });
      const joints = isBlackGoo
        ? this._material('emissiveRed', { color: 0xef4444, emissive: 0x991b1b, emissiveIntensity: 1.8 })
        : this._material('skin', { color: 0x9f8f79, roughness: 0.64, clearcoat: 0.15 });
      const claw = isBlackGoo
        ? this._material('darkMetal', { color: 0x18181b, roughness: 0.2 })
        : this._material('bone', { color: 0xc6ad79 });

      root.add(this._ellipsoid(
        hide,
        { x: 0.69, y: 0.23, z: 1.0 },
        { x: 0, y: 0.48, z: 0 },
        'central_carpal_body',
        36
      ));
      for (let plateIndex = 0; plateIndex < 5; plateIndex++) {
        root.add(this._ellipsoid(
          joints,
          { x: 0.72 - plateIndex * 0.08, y: 0.07, z: 0.22 },
          { x: 0, y: 0.7, z: -0.58 + plateIndex * 0.3 },
          `dorsal_plate_${plateIndex}`,
          12
        ));
      }

      for (let legIndex = 0; legIndex < 8; legIndex++) {
        const side = legIndex < 4 ? -1 : 1;
        const row = legIndex % 4;
        const zBase = -0.67 + row * 0.45;
        const reach = 1.55 - Math.abs(row - 1.5) * 0.12;
        const limb = new T.Group();
        limb.name = `crawler_leg_${legIndex}`;
        const hip = new T.Vector3(side * 0.55, 0.48, zBase);
        const knee = new T.Vector3(side * 1.15, 0.34 + (row % 2) * 0.08, zBase + (row - 1.5) * 0.08);
        const ankle = new T.Vector3(side * reach, 0.13, zBase + (row - 1.5) * 0.18);
        const toe = new T.Vector3(side * (reach + 0.28), 0.05, zBase + (row - 1.5) * 0.24);
        const localKnee = knee.clone().sub(hip);
        const localAnkle = ankle.clone().sub(knee);
        const localToe = toe.clone().sub(ankle);

        limb.position.copy(hip);
        limb.userData.side = side;
        limb.userData.row = row;
        limb.add(this._joint(joints, { x: 0, y: 0, z: 0 }, 0.145, 'hip'));
        limb.add(this._segment(hide, new T.Vector3(), localKnee, 0.14, 0.1, 'femur', 14));

        const kneeJoint = new T.Group();
        kneeJoint.name = `crawler_knee_${legIndex}`;
        kneeJoint.position.copy(localKnee);
        kneeJoint.add(this._joint(joints, { x: 0, y: 0, z: 0 }, 0.13, 'knee'));
        kneeJoint.add(this._segment(hide, new T.Vector3(), localAnkle, 0.1, 0.065, 'tibia', 12));

        const ankleJoint = new T.Group();
        ankleJoint.name = `crawler_ankle_${legIndex}`;
        ankleJoint.position.copy(localAnkle);
        ankleJoint.add(this._joint(joints, { x: 0, y: 0, z: 0 }, 0.085, 'ankle'));
        ankleJoint.add(this._segment(hide, new T.Vector3(), localToe, 0.06, 0.035, 'tarsus', 12));
        ankleJoint.add(this._coneAlong(
          claw,
          localToe,
          { x: side, y: -0.22, z: (row - 1.5) * 0.12 },
          0.055,
          0.28,
          'gripping_claw',
          6
        ));
        kneeJoint.add(ankleJoint);
        limb.add(this._tube(joints, [
          { x: 0, y: -0.035, z: 0 },
          { x: localKnee.x * 0.48, y: localKnee.y * 0.5 - 0.035, z: localKnee.z * 0.5 },
          { x: localKnee.x, y: localKnee.y - 0.035, z: localKnee.z }
        ], 0.025, `crawler_flexor_${legIndex}`, 18, 6));
        limb.add(kneeJoint);
        root.add(limb);
        legJoints.push(limb);
        kneeJoints.push(kneeJoint);
        ankleJoints.push(ankleJoint);
      }

      const tailJoint = new T.Group();
      tailJoint.name = 'crawler_tail_root';
      const tailBase = new T.Vector3(0, 0.47, -0.85);
      const tailPoints = [
        new T.Vector3(0, 0.47, -0.85),
        new T.Vector3(0.25, 0.36, -1.55),
        new T.Vector3(0.74, 0.22, -2.15),
        new T.Vector3(1.15, 0.38, -2.7),
        new T.Vector3(0.82, 0.52, -3.28),
        new T.Vector3(0.22, 0.43, -3.56)
      ];
      tailJoint.position.copy(tailBase);
      tailJoint.add(this._tube(
        hide,
        tailPoints.map((point) => point.clone().sub(tailBase)),
        0.105,
        'prehensile_tail',
        72,
        12
      ));
      tailJoint.add(this._coneAlong(
        claw,
        tailPoints[tailPoints.length - 1].clone().sub(tailBase),
        { x: -0.45, y: -0.08, z: -1 },
        0.12,
        0.42,
        'tail_hook',
        7
      ));
      root.add(tailJoint);
      root.add(this._ellipsoid(
        joints,
        { x: 0.32, y: 0.14, z: 0.38 },
        { x: 0, y: 0.2, z: 0.22 },
        'ventral_organ',
        14
      ));
      for (let feeler = -1; feeler <= 1; feeler += 2) {
        root.add(this._tube(
          joints,
          [
            { x: feeler * 0.12, y: 0.2, z: 0.42 },
            { x: feeler * 0.2, y: 0.1, z: 0.74 },
            { x: feeler * 0.13, y: 0.08, z: 1.02 }
          ],
          0.034,
          `sensory_feeler_${feeler}`,
          12,
          6
        ));
      }
      // Keep the detailed silhouette while counterbalancing the global player
      // scale applied by the game. The resulting parasite is visibly smaller
      // than a human head instead of spanning the whole upper body.
      const scaledAssembly = new T.Group();
      scaledAssembly.name = 'crawler_scaled_assembly';
      while (root.children.length) scaledAssembly.add(root.children[0]);
      scaledAssembly.scale.setScalar(0.82);
      root.add(scaledAssembly);

      const facehugger = this._finalize(root, {
        modelType: 'facehugger',
        height: 0.66,
        forwardAxis: '+Z',
        animationJoints: {
          legs: Array.from({ length: 8 }, (_, index) => `crawler_leg_${index}`),
          knees: Array.from({ length: 8 }, (_, index) => `crawler_knee_${index}`),
          ankles: Array.from({ length: 8 }, (_, index) => `crawler_ankle_${index}`),
          tail: 'crawler_tail_root'
        },
        animationRoles: {
          locomotion: Array.from({ length: 8 }, (_, index) => `crawler_leg_${index}`),
          attack: [
            ...Array.from({ length: 8 }, (_, index) => `crawler_knee_${index}`),
            'crawler_tail_root'
          ]
        }
      });

      const bindRotations = [...legJoints, ...kneeJoints, ...ankleJoints, tailJoint]
        .map((joint) => joint.rotation.clone());
      facehugger.userData.setFoldedPose = (folded) => {
        [...legJoints, ...kneeJoints, ...ankleJoints, tailJoint].forEach((joint, index) => {
          joint.rotation.copy(bindRotations[index]);
        });
        if (folded) {
          legJoints.forEach((joint, index) => {
            const side = joint.userData.side;
            const row = joint.userData.row;
            joint.rotation.z = side * 0.24;
            joint.rotation.y = (row - 1.5) * 0.1;
            kneeJoints[index].rotation.z = side * 2.2;
            kneeJoints[index].rotation.y = (row - 1.5) * 0.16;
            ankleJoints[index].rotation.z = side * 1.12;
          });
          tailJoint.rotation.x = -0.2;
          tailJoint.rotation.y = 0.72;
        }
        facehugger.userData.foldedPose = !!folded;
      };
      facehugger.userData.setPose = (pose) => facehugger.userData.setFoldedPose(pose === 'folded');
      facehugger.userData.attachmentPose = {
        name: 'folded',
        forwardAxis: '+Z',
        suggestedFaceOffset: { x: 0, y: 0.02, z: 0.34 }
      };
      return facehugger;
    }

    createDeadFacehuggerHusk() {
      const T = this._three();
      const husk = this.createFacehugger();
      husk.name = 'dead_facehugger_husk';
      husk.userData.modelType = 'deadFacehuggerHusk';
      husk.userData.setFoldedPose?.(true);

      const deadMaterial = this._material('chitinWarm', {
        color: 0x8a7765,
        roughness: 0.94,
        metalness: 0.04
      });

      husk.traverse((child) => {
        if (child.isMesh) {
          child.material = deadMaterial;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      // Posture inversée / recroquevillée comme un cadavre d'arachnide desséché (Alien 1979)
      husk.rotation.x = Math.PI * 0.92;
      husk.rotation.z = 0.15;
      husk.position.y = 0.08;
      return husk;
    }

    createRoyalFacehugger() {
      const hugger = this.createFacehugger();
      hugger.name = 'royal_superfacehugger';
      hugger.scale.setScalar(1.28);
      const royalArmorMat = this._material('chitin', {
        color: 0x3b1d11,
        roughness: 0.35,
        metalness: 0.4
      });
      hugger.traverse((child) => {
        if (child.isMesh && child.name.includes('body')) {
          child.material = royalArmorMat;
        }
      });
      return hugger;
    }

    createDiscardedExuvia() {
      const T = this._three();
      const root = new T.Group();
      root.name = 'discarded_xeno_exuvia';
      root.userData.modelType = 'discardedExuvia';

      const moltMaterial = new T.MeshStandardMaterial({
        color: 0x64748b,
        emissive: 0x1e293b,
        emissiveIntensity: 0.25,
        roughness: 0.18,
        metalness: 0.12,
        transparent: true,
        opacity: 0.48,
        side: T.DoubleSide
      });

      // Dôme crânien translucide creux et fendu
      const dome = this._ellipsoid(
        moltMaterial,
        { x: 0.42, y: 0.26, z: 0.88 },
        { x: 0, y: 0.32, z: 0.2 },
        'exuvia_hollow_dome',
        18
      );
      root.add(dome);

      // Fissure spinale dorsale par laquelle l'adulte a émergé
      const slit = this._box(
        moltMaterial,
        { x: 0.1, y: 0.28, z: 1.1 },
        { x: 0, y: 0.42, z: -0.1 },
        'exuvia_dorsal_emergence_slit'
      );
      root.add(slit);

      // Cage thoracique affaissée
      for (let rib = 0; rib < 5; rib++) {
        for (const side of [-1, 1]) {
          const ribMesh = this._segment(
            moltMaterial,
            new T.Vector3(0, 0.3 - rib * 0.04, -0.2 - rib * 0.22),
            new T.Vector3(side * 0.36, 0.05, -0.25 - rib * 0.22),
            0.045,
            0.025,
            `exuvia_rib_${rib}_${side}`,
            8
          );
          root.add(ribMesh);
        }
      }

      // Queue serpentine flasque repliée au sol
      const tailPoints = [
        new T.Vector3(0, 0.12, -1.2),
        new T.Vector3(0.25, 0.04, -1.7),
        new T.Vector3(0.55, 0.02, -2.1),
        new T.Vector3(0.35, 0.02, -2.5),
        new T.Vector3(0.05, 0.02, -2.8)
      ];
      root.add(this._tube(moltMaterial, tailPoints, 0.065, 'exuvia_flaccid_tail', 18, 6));

      // Flaque de mucus résiduel séché
      const puddle = new T.Mesh(
        new T.CircleGeometry(1.6, 20),
        new T.MeshStandardMaterial({
          color: 0x1e1b4b,
          roughness: 0.1,
          metalness: 0.6,
          transparent: true,
          opacity: 0.62
        })
      );
      puddle.rotation.x = -Math.PI / 2;
      puddle.position.y = 0.01;
      root.add(puddle);

      this.placeOnGround(root, 0);
      return root;
    }

    // -------------------------------------------------------------------------
    // 9. PUBLIC MODEL: JUVENILE / METAMORPHIC POD
    // -------------------------------------------------------------------------
    createChestburster(chrysalis) {
      const T = this._three();
      const root = new T.Group();
      root.name = chrysalis ? 'metamorphic_pod' : 'juvenile_serpent';
      const hide = chrysalis ? null : this._material('skin', { color: 0xc4a48d, roughness: 0.46, clearcoat: 0.45 });
      const chitin = chrysalis ? null : this._material('chitin', { color: 0x9a9694, roughness: 0.4, metalness: 0.08 });
      const bone = this._material('bone', { color: 0xd6c58b });

      if (chrysalis) {
        // --- COCON / CHRYSALIDE BIOMÉCANIQUE ALIEN: ROMULUS ---
        const romulusResin = this._material('resin', {
          color: 0x220c2a,
          roughness: 0.18,
          metalness: 0.38,
          emissive: 0x4a1268,
          emissiveIntensity: 0.55,
          transparent: true,
          opacity: 0.92
        });
        const romulusChitin = this._material('chitin', {
          color: 0x120d18,
          roughness: 0.22,
          metalness: 0.72
        });
        const romulusFlesh = this._material('chitinWarm', {
          color: 0x4c1424,
          roughness: 0.38,
          emissive: 0x831843,
          emissiveIntensity: 0.52
        });
        const romulusAmniotic = this._material('resin', {
          color: 0x1f0833,
          roughness: 0.12,
          emissive: 0x9333ea,
          emissiveIntensity: 0.75,
          transparent: true,
          opacity: 0.58
        });

        // 1. Membrane externe du cocon (capsule asymétrique et charnue)
        root.add(this._ellipsoid(
          romulusResin,
          { x: 1.24, y: 1.82, z: 1.08 },
          { x: 0, y: 1.48, z: 0 },
          'pod_membrane',
          28
        ));

        // 2. Coeur amniotique interne pulsant
        root.add(this._ellipsoid(
          romulusAmniotic,
          { x: 0.88, y: 1.42, z: 0.72 },
          { x: 0, y: 1.5, z: 0.05 },
          'amniotic_core',
          20
        ));

        // 3. Silhouette en gestation de l'adulte (dôme crânien et colonne incurvée)
        root.add(this._ellipsoid(
          this._material('darkMetal', { color: 0x050810, roughness: 0.14, metalness: 0.95, emissive: 0x15803d, emissiveIntensity: 0.35 }),
          { x: 0.42, y: 0.46, z: 0.98 },
          { x: 0, y: 1.82, z: 0.1 },
          'developing_cranial_dome',
          20
        ));
        root.add(this._ellipsoid(
          romulusChitin,
          { x: 0.36, y: 0.72, z: 0.38 },
          { x: 0, y: 1.25, z: -0.12 },
          'developing_torso',
          14
        ));

        // 4. Suture longitudinale d'émergence (fissure centrale emblématique de Romulus)
        root.add(this._tube(
          romulusFlesh,
          [
            { x: -0.06, y: 2.35, z: 0.94 },
            { x: -0.1, y: 1.52, z: 1.08 },
            { x: -0.05, y: 0.65, z: 0.9 }
          ],
          0.065,
          'suture_lip_left',
          18,
          8
        ));
        root.add(this._tube(
          romulusFlesh,
          [
            { x: 0.06, y: 2.35, z: 0.94 },
            { x: 0.1, y: 1.52, z: 1.08 },
            { x: 0.05, y: 0.65, z: 0.9 }
          ],
          0.065,
          'suture_lip_right',
          18,
          8
        ));

        // Ligaments fibreux transversaux retenant la suture
        for (let s = 0; s < 5; s++) {
          const sy = 0.85 + s * 0.32;
          const sz = 0.98 + Math.sin((s / 4) * Math.PI) * 0.09;
          root.add(this._segment(
            bone,
            this._vector(-0.11, sy, sz),
            this._vector(0.11, sy, sz),
            0.024,
            0.024,
            `suture_ligament_${s}`,
            6
          ));
        }

        // 5. Arches costales biomécaniques enserrant le cocon (côtes squelettiques Romulus)
        for (let rib = 0; rib < 6; rib++) {
          const ribY = 0.62 + rib * 0.32;
          const ribScale = 1.06 - Math.abs(2.8 - rib) * 0.07;
          // Côte gauche
          root.add(this._tube(
            romulusChitin,
            [
              { x: 0, y: ribY, z: -0.95 * ribScale },
              { x: -1.15 * ribScale, y: ribY + 0.08, z: -0.2 * ribScale },
              { x: -0.92 * ribScale, y: ribY - 0.04, z: 0.72 * ribScale }
            ],
            0.055,
            `romulus_rib_left_${rib}`,
            14,
            7
          ));
          // Côte droite
          root.add(this._tube(
            romulusChitin,
            [
              { x: 0, y: ribY, z: -0.95 * ribScale },
              { x: 1.15 * ribScale, y: ribY + 0.08, z: -0.2 * ribScale },
              { x: 0.92 * ribScale, y: ribY - 0.04, z: 0.72 * ribScale }
            ],
            0.055,
            `romulus_rib_right_${rib}`,
            14,
            7
          ));
        }

        // Colonne vertébrale postérieure consolidant les côtes
        root.add(this._tube(
          romulusChitin,
          [
            { x: 0, y: 0.45, z: -0.85 },
            { x: 0, y: 1.5, z: -1.02 },
            { x: 0, y: 2.5, z: -0.78 }
          ],
          0.095,
          'posterior_spine_column',
          18,
          8
        ));

        // 6. Vrilles et racines d'ancrage aux parois et au sol
        for (let rootIndex = 0; rootIndex < 8; rootIndex++) {
          const angle = (rootIndex / 8) * Math.PI * 2;
          const reach = 1.35 + (rootIndex % 3) * 0.28;
          root.add(this._tube(
            romulusResin,
            [
              { x: Math.cos(angle) * 0.52, y: 0.45, z: Math.sin(angle) * 0.52 },
              { x: Math.cos(angle) * (reach * 0.65), y: 0.14, z: Math.sin(angle) * (reach * 0.65) },
              { x: Math.cos(angle) * reach, y: 0.02, z: Math.sin(angle) * reach }
            ],
            0.065,
            `anchoring_root_${rootIndex}`,
            14,
            7
          ));
        }

        // Disque de résine visqueuse au sol
        root.add(this._ring(
          romulusResin,
          1.15,
          0.22,
          { x: 0, y: 0.03, z: 0 },
          { x: Math.PI / 2, y: 0, z: 0 },
          'ground_resin_pool'
        ));

        // 7. Gouttes et stalactites de sécrétion visqueuse
        const dripOffsets = [
          [-0.45, 0.55, 0.4], [0.45, 0.55, 0.4],
          [-0.3, 0.42, -0.4], [0.3, 0.42, -0.4]
        ];
        dripOffsets.forEach(([dx, dy, dz], idx) => {
          root.add(this._coneAlong(
            romulusResin,
            { x: dx, y: dy, z: dz },
            { x: 0, y: -1, z: 0 },
            0.05,
            0.28,
            `resin_drip_${idx}`
          ));
        });

        return this._finalize(root, {
          modelType: 'chestburster',
          chrysalis: true,
          height: 3.25,
          animationJoints: [
            'pod_membrane',
            'amniotic_core',
            'developing_cranial_dome',
            'suture_lip_left',
            'suture_lip_right',
            'romulus_rib_left_0',
            'romulus_rib_right_0',
            'romulus_rib_left_2',
            'romulus_rib_right_2',
            'romulus_rib_left_4',
            'romulus_rib_right_4'
          ]
        });
      }

      root.add(this._sweptBody(hide, [
        { x: 0, y: 0.58, z: -0.96 }, { x: 0.02, y: 0.7, z: -0.58 },
        { x: 0, y: 0.77, z: -0.05 }, { x: 0, y: 0.7, z: 0.53 }
      ], [0.19, 0.29, 0.37, 0.3], 'larval_trunk', 88, 28));
      root.add(this._ellipsoid(
        chitin,
        { x: 0.4, y: 0.29, z: 1.02 },
        { x: 0, y: 0.78, z: 0.72 },
        'juvenile_head',
        40
      ));
      this._addJaw(root, chitin, bone, { x: 0, y: 0.62, z: 1.25 }, 0.56, false);
      for (let side = -1; side <= 1; side += 2) {
        this._addSegmentedLimb(
          root,
          hide,
          chitin,
          [
            { x: side * 0.34, y: 0.68, z: 0.18 },
            { x: side * 0.65, y: 0.45, z: 0.42 },
            { x: side * 0.82, y: 0.24, z: 0.65 }
          ],
          [0.1, 0.075, 0.05],
          `juvenile_arm_${side}`,
          {
            material: hide,
            clawMaterial: bone,
            side,
            scale: 0.44,
            rotationY: side < 0 ? -0.38 : 0.38
          }
        );
      }
      this._addTail(root, hide, chitin, { x: 0, y: 0.58, z: -0.72 }, 3.1, 0.3, -0.38, 0.11);
      this._addCarapaceSpines(root, chitin, 0.94, 7, 0.65, 0.52, -1);
      return this._finalize(root, {
        modelType: 'chestburster',
        chrysalis: false,
        height: 1.42,
        animationJoints: ['juvenile_arm_-1', 'juvenile_arm_1', 'articulated_jaw']
      });
    }

    // -------------------------------------------------------------------------
    // 10. PUBLIC MODEL: ADULT CASTE FAMILY
    // -------------------------------------------------------------------------
    createAdult(caste) {
      const normalizedCaste = String(caste || 'drone').toLowerCase();
      if (normalizedCaste === 'runner') return this._createRunner();
      if (normalizedCaste === 'crusher') return this._createCrusher();
      if (normalizedCaste === 'mantis_drone' || normalizedCaste === 'mantis') return this.createMantisDrone();
      if (normalizedCaste === 'bull_drone' || normalizedCaste === 'bull') return this.createBullDrone();
      if (normalizedCaste === 'gorilla_drone' || normalizedCaste === 'gorilla') return this.createGorillaDrone();
      if (normalizedCaste === 'boar_drone' || normalizedCaste === 'boar') return this.createBoarDrone();
      if (normalizedCaste === 'scorpion_drone' || normalizedCaste === 'scorpion') return this.createScorpionDrone();
      if (normalizedCaste === 'cougar_drone' || normalizedCaste === 'cougar' || normalizedCaste === 'panther_drone') return this.createCougarDrone();
      if (normalizedCaste === 'worker_drone' || normalizedCaste === 'worker' || normalizedCaste === 'hive_worker') return this.createWorkerDrone();
      if (normalizedCaste === 'rhino_drone' || normalizedCaste === 'rhino') return this.createRhinoDrone();
      if (normalizedCaste === 'crab_drone' || normalizedCaste === 'crab') return this.createCrabDrone();
      if (normalizedCaste === 'charger') return this._createUprightAdult('charger');
      if (normalizedCaste === 'infiltrator') return this._createUprightAdult('infiltrator');
      if (normalizedCaste === 'pathogen_stalker' || normalizedCaste === 'pathogen') return this._createUprightAdult('pathogen_stalker');
      if (normalizedCaste === 'snake_alien' || normalizedCaste === 'snake') return this._createUprightAdult('snake_alien');
      if (normalizedCaste === 'spider_alien' || normalizedCaste === 'spider') return this._createUprightAdult('spider_alien');
      if (normalizedCaste === 'flying_queen') return this._createUprightAdult('flying_queen');
      if (normalizedCaste === 'queen_mother') return this._createUprightAdult('queen_mother');
      if (normalizedCaste === 'chrysalis_warrior' || normalizedCaste === 'chrysalis') return this._createUprightAdult('chrysalis_warrior');
      return this._createUprightAdult(normalizedCaste);
    }

    _createUprightAdult(caste) {
      const T = this._three();
      const root = new T.Group();
      root.name = `adult_${caste}`;
      const royal = caste === 'queen';
      const palatine = caste === 'palatine';
      const guardian = caste === 'praetorian';
      const warrior = caste === 'warrior';
      const prowler = caste === 'prowler';
      const spitter = caste === 'spitter';
      const burster = caste === 'burster';
      const boiler = caste === 'boiler';
      const carrier = caste === 'carrier';
      const offspring = caste === 'offspring';
      const newborn = caste === 'newborn';
      const raven = caste === 'raven';
      const king = caste === 'king';
      const bodyburster = caste === 'bodyburster';
      const predalien = caste === 'predalien';
      const deaconAdult = caste === 'deacon_adult';
      const deaconess = caste === 'deaconess';
      const deacon = caste === 'deacon' || deaconAdult || deaconess;
      const neomorph = caste === 'neomorph';
      const alpha = caste === 'alpha';
      const abomination = caste === 'abomination';
      const redDrone = caste === 'red_drone';
      const flyingDrone = caste === 'flying_drone';
      const charger = caste === 'charger';
      const infiltrator = caste === 'infiltrator';
      const pathogenStalker = caste === 'pathogen_stalker';
      const snakeAlien = caste === 'snake_alien';
      const spiderAlien = caste === 'spider_alien';
      const flyingQueen = caste === 'flying_queen';
      const queenMother = caste === 'queen_mother';
      const chrysalisWarrior = caste === 'chrysalis_warrior';

      const scale = queenMother ? 1.75 : (flyingQueen ? 1.58 : (king ? 1.62 : (deaconess ? 1.55 : (raven ? 1.48 : (abomination ? 1.48 : (royal ? 1.42 : (alpha ? 1.38 : (newborn ? 1.35 : (deaconAdult ? 1.34 : (charger ? 1.32 : (palatine ? 1.28 : (guardian ? 1.24 : (carrier ? 1.22 : (predalien ? 1.32 : (chrysalisWarrior ? 1.25 : (spiderAlien ? 1.2 : (snakeAlien ? 1.18 : (pathogenStalker ? 1.16 : (deacon ? 1.12 : (flyingDrone ? 1.12 : (neomorph ? 1.08 : (redDrone ? 1.08 : (warrior ? 1.06 : (infiltrator ? 1.05 : (boiler ? 1.04 : (offspring ? 1.15 : (burster ? 0.96 : (bodyburster ? 0.92 : 1))))))))))))))))))))))))))));
      let chitinColor = 0x0b1518;
      if (royal) chitinColor = 0x221033;
      else if (queenMother) chitinColor = 0x150824; // Reine Mère Suprême Obsidienne Nacrée Pourpre (Aliens: Female War)
      else if (flyingQueen) chitinColor = 0x1e102e; // Reine Ailée Royale Pourpre Abyssal (Aliens: Genocide 1991)
      else if (charger) chitinColor = 0x3a2e2b; // Cuirasse osseuse lourde brun sombre Charger (Aliens: Fireteam Elite)
      else if (chrysalisWarrior) chitinColor = 0x524e4d; // Chitine pétrifiée gris ardoise Chrysalis (AvP Arcade / Rebellion)
      else if (pathogenStalker) chitinColor = 0x064e3b; // Émeraude sombre pathogène virulent (Fireteam Elite Pathogen)
      else if (infiltrator) chitinColor = 0x1e293b; // Réfractif translucide Infiltrator (Colonial Marines)
      else if (spiderAlien) chitinColor = 0x18181b; // Noir arachnide soyeux (Aliens Kenner 1992)
      else if (snakeAlien) chitinColor = 0x1c1917; // Écailles luisantes serpentine Snake Alien (Kenner)
      else if (king) chitinColor = 0x7f1d1d; // Chitine royale cramoisie sombre Rouge de Charon (Aliens: Rogue 1993)
      else if (redDrone) chitinColor = 0x991b1b; // Chitine rouge écarlate sanglante Guerre Civile des Ruches (Aliens: Genocide 1991)
      else if (flyingDrone) chitinColor = 0x0f172a; // Chitine bleu nuit sombre abyssal Ailé de Charon (Aliens 1992 Kenner / Comics)
      else if (deaconess) chitinColor = 0x0a1128; // Bleu nuit abyssal royal iridescente Deaconess Proto-Queen (Fire and Stone)
      else if (bodyburster) chitinColor = 0xfef2f2; // Membrane translucide pâle d'éruption dorsale (Alien: Covenant 2017)
      else if (deaconAdult) chitinColor = 0x0f172a; // Bleu cobalt ébène profond Apex Archon (Prometheus lore étendu)
      else if (abomination) chitinColor = 0xf1f5f9; // Peau d'albâtre cireuse cadavérique Offspring Adulte Géant (Alien: Romulus 2024)
      else if (palatine) chitinColor = 0x1f0b29;
      else if (guardian) chitinColor = 0x2d163d;
      else if (raven) chitinColor = 0x0a0e14; // Blindage bivalve chitineux obsidienne impénétrable (Aliens: Colonial Marines)
      else if (alpha) chitinColor = 0x140a0b; // Obsidienne marbrée de carmin (Marvel Comics: Alien: Bloodlines)
      else if (newborn) chitinColor = 0xfce7f3; // Peau gélatineuse blanc cassé/rosé humanoïde (Alien: Resurrection 1997)
      else if (predalien) chitinColor = 0x2e291e; // Bronze sombre métallique Yautja
      else if (deacon) chitinColor = 0x1e293b; // Bleu ardoise profond lisse (Prometheus 2012)
      else if (neomorph) chitinColor = 0xf1f5f9; // Peau blanc albâtre translucide (Alien: Covenant 2017)
      else if (warrior) chitinColor = 0x111827;
      else if (prowler) chitinColor = 0x3d0c0c;
      else if (spitter) chitinColor = 0x1a2e05;
      else if (burster) chitinColor = 0x3a3804;
      else if (boiler) chitinColor = 0x271708; // Chitine craquelée brûlée et pustuleuse (Colonial Marines)
      else if (carrier) chitinColor = 0x18181b; // Matrice sombre alvéolée (AvP: Extinction)
      else if (offspring) chitinColor = 0xd4d4d8;

      const primary = this._material('chitin', {
        color: chitinColor,
        roughness: royal || palatine || king || queenMother || flyingQueen ? 0.22 : (raven || chrysalisWarrior ? 0.35 : (alpha ? 0.20 : (newborn ? 0.65 : (abomination ? 0.72 : (bodyburster ? 0.15 : (predalien ? 0.24 : (deacon ? 0.16 : (neomorph ? 0.18 : (offspring ? 0.55 : 0.28))))))))),
        metalness: king || queenMother ? 0.68 : (raven || charger ? 0.72 : (alpha ? 0.65 : (predalien ? 0.54 : (deacon ? 0.22 : (neomorph || bodyburster ? 0.06 : (newborn || abomination ? 0.04 : (offspring ? 0.15 : 0.46))))))),
        emissive: queenMother ? 0x6b21a8 : (flyingQueen ? 0x7c3aed : (pathogenStalker ? 0x10b981 : (king ? 0x991b1b : (alpha ? 0x991b1b : (bodyburster ? 0xdc2626 : (raven ? 0x0f172a : 0x000000)))))),
        emissiveIntensity: queenMother ? 0.55 : (flyingQueen ? 0.45 : (pathogenStalker ? 0.4 : (king ? 0.38 : (alpha ? 0.32 : (bodyburster ? 0.28 : (raven ? 0.2 : 0)))))),
        opacity: infiltrator ? 0.52 : 1.0,
        transparent: infiltrator
      });
      const secondary = this._material('resin', {
        color: queenMother ? 0x3b0764 : (flyingQueen ? 0x4c1d95 : (pathogenStalker ? 0x064e3b : (king ? 0x450a0a : (bodyburster ? 0xfecdd3 : (royal || palatine ? 0x4a214f : (raven ? 0x18181b : (alpha ? 0x3b0712 : (newborn ? 0xfbcfe8 : (abomination ? 0xe2e8f0 : (predalien ? 0x1c1913 : (deacon ? 0x0f172a : (neomorph ? 0xfbcfe8 : (prowler ? 0x450a0a : (spitter ? 0x365314 : (offspring ? 0xa1a1aa : 0x263238))))))))))))))),
        opacity: infiltrator ? 0.48 : 0.96,
        transparent: infiltrator
      });
      const bone = this._material('bone', { color: queenMother ? 0xf3e8ff : (king ? 0xfecaca : (bodyburster ? 0xfee2e2 : (royal || palatine ? 0xc8b6d8 : (raven ? 0x334155 : (alpha ? 0xfee2e2 : (newborn ? 0xfff1f2 : (abomination ? 0x94a3b8 : (predalien ? 0xa89f88 : (deacon ? 0x94a3b8 : (neomorph ? 0xffffff : (offspring ? 0xf4f4f5 : 0xb9c6a5))))))))))) });
      const sensory = this._material(royal || palatine || alpha || king || bodyburster || queenMother || flyingQueen ? 'emissiveRed' : (spitter || burster || pathogenStalker ? 'emissiveGreen' : 'emissiveGreen'), {
        emissiveIntensity: royal || palatine || king || queenMother ? 0.52 : (alpha ? 0.75 : (burster || bodyburster || pathogenStalker ? 0.65 : 0.32))
      });

      root.add(this._ellipsoid(
        primary,
        { x: 0.76 * scale, y: 1.08 * scale, z: 0.5 * scale },
        { x: 0, y: 3.05 * scale, z: 0 },
        'thorax',
        20
      ));
      root.add(this._ellipsoid(
        secondary,
        { x: 0.62 * scale, y: 0.54 * scale, z: 0.48 * scale },
        { x: 0, y: 1.88 * scale, z: -0.02 * scale },
        'pelvic_carapace',
        18
      ));
      const isDrone = caste === 'drone';
      const domeMat = isDrone ? this._material('resin', {
        color: 0x151c28,
        opacity: 0.62,
        roughness: 0.12,
        metalness: 0.35,
        transparent: true
      }) : primary;

      root.add(this._ellipsoid(
        domeMat,
        {
          x: (royal ? 0.92 : (deacon ? 0.58 : 0.7)) * scale,
          y: (royal ? 0.54 : (deacon ? 0.42 : 0.46)) * scale,
          z: (royal ? 1.35 : (deacon ? 1.25 : 1.14)) * scale
        },
        { x: 0, y: 4.58 * scale, z: 0.36 * scale },
        'cranial_dome',
        royal ? 28 : 22
      ));

      if (deacon) {
        // Chantier 44 : Crâne conique effilé pointu vers l'arrière & Mâchoire prémaxillaire de type requin gobelin (Prometheus 2012)
        root.add(this._coneAlong(
          primary,
          { x: 0, y: 4.58 * scale, z: 0.15 * scale },
          { x: 0, y: 0.08, z: -1 },
          0.48 * scale,
          1.45 * scale,
          'deacon_pointed_occiput',
          18
        ));
        const premaxGroup = new T.Group();
        premaxGroup.name = 'deacon_premaxillary_jaw';
        premaxGroup.position.set(0, 4.04 * scale, 1.35 * scale);
        premaxGroup.add(this._box(primary, { x: 0.34 * scale, y: 0.2 * scale, z: 0.45 * scale }, { x: 0, y: 0, z: 0.2 * scale }, 'premax_frame', true));
        premaxGroup.add(this._box(bone, { x: 0.3 * scale, y: 0.08 * scale, z: 0.38 * scale }, { x: 0, y: -0.06 * scale, z: 0.22 * scale }, 'premax_teeth'));
        root.add(premaxGroup);

        if (deaconess) {
          // Chantier 141 : Couronne crânienne royale pointue Deaconess Proto-Queen (Fire and Stone)
          const royalCrestMat = this._material('chitin', { color: 0x1e3a8a, roughness: 0.18, metalness: 0.45 });
          for (let sp = 0; sp < 5; sp++) {
            const angle = (sp - 2) * 0.22;
            root.add(this._segment(
              royalCrestMat,
              new T.Vector3(Math.sin(angle) * 0.6 * scale, 4.8 * scale, -0.4 * scale),
              new T.Vector3(Math.sin(angle) * 1.1 * scale, 5.4 * scale, -1.5 * scale),
              0.08 * scale,
              0.02 * scale,
              `deaconess_crest_spine_${sp}`,
              10
            ));
          }
        }
      }

      if (isDrone) {
        // Canon Alien 1979 (H.R. Giger Big Chap) : Crâne humain sculpté sous la carapace translucide
        const innerSkullMat = this._material('bone', { color: 0xd6d3cb, roughness: 0.48 });
        const darkSocketMat = this._material('darkMetal', { color: 0x020617, roughness: 0.8 });
        root.add(this._ellipsoid(
          innerSkullMat,
          { x: 0.52 * scale, y: 0.38 * scale, z: 0.92 * scale },
          { x: 0, y: 4.54 * scale, z: 0.34 * scale },
          'drone_internal_skull',
          22
        ));
        for (let eyeSide = -1; eyeSide <= 1; eyeSide += 2) {
          root.add(this._ellipsoid(
            darkSocketMat,
            { x: 0.11 * scale, y: 0.12 * scale, z: 0.08 * scale },
            { x: eyeSide * 0.21 * scale, y: 4.46 * scale, z: 0.86 * scale },
            `skull_orbit_${eyeSide}`,
            14
          ));
        }
        root.add(this._box(
          darkSocketMat,
          { x: 0.07 * scale, y: 0.12 * scale, z: 0.06 * scale },
          { x: 0, y: 4.34 * scale, z: 0.94 * scale },
          'skull_nasal_cavity'
        ));
        root.add(this._box(
          innerSkullMat,
          { x: 0.26 * scale, y: 0.07 * scale, z: 0.16 * scale },
          { x: 0, y: 4.22 * scale, z: 1.04 * scale },
          'skull_maxilla_teeth'
        ));
      }

      root.add(this._ellipsoid(
        secondary,
        { x: 0.58 * scale, y: 0.23 * scale, z: 0.62 * scale },
        { x: 0, y: 4.24 * scale, z: 1.02 * scale },
        'facial_mask',
        18
      ));
      this._addJaw(root, primary, bone, { x: 0, y: 4.08 * scale, z: 1.32 * scale }, scale, royal);

      if (predalien) {
        // Chantier 36 : 4 Mandibules prédatrices Yautja articulées (Canon AvP)
        const mandibleMat = this._material('bone', { color: 0x948464, roughness: 0.38, metalness: 0.15 });
        const fangMat = this._material('bone', { color: 0xded8c6, roughness: 0.25 });
        const mandibleOffsets = [
          { name: 'upper_left', x: -0.42 * scale, y: 4.18 * scale, z: 1.15 * scale, rotZ: 0.35, rotY: 0.45 },
          { name: 'upper_right', x: 0.42 * scale, y: 4.18 * scale, z: 1.15 * scale, rotZ: -0.35, rotY: -0.45 },
          { name: 'lower_left', x: -0.36 * scale, y: 3.92 * scale, z: 1.25 * scale, rotZ: -0.28, rotY: 0.38 },
          { name: 'lower_right', x: 0.36 * scale, y: 3.92 * scale, z: 1.25 * scale, rotZ: 0.28, rotY: -0.38 }
        ];
        mandibleOffsets.forEach((m) => {
          const mandGroup = new T.Group();
          mandGroup.name = `predalien_mandible_${m.name}`;
          mandGroup.position.set(m.x, m.y, m.z);
          mandGroup.rotation.set(0, m.rotY, m.rotZ);
          mandGroup.add(this._segment(mandibleMat, new T.Vector3(0, 0, 0), new T.Vector3(0, 0, 0.42 * scale), 0.08 * scale, 0.05 * scale, `mand_shaft_${m.name}`, 8));
          mandGroup.add(this._coneAlong(fangMat, { x: 0, y: 0, z: 0.42 * scale }, { x: m.rotZ > 0 ? 0.2 : -0.2, y: -0.2, z: 1 }, 0.05 * scale, 0.24 * scale, `fang_${m.name}`, 6));
          root.add(mandGroup);
        });

        // 16 Dreadlocks sensoriels biomécaniques retombant sur les épaules et le dos
        const dreadMat = this._material('chitin', { color: 0x1a1814, roughness: 0.32, metalness: 0.45 });
        const ringMat = this._material('darkMetal', { color: 0xb45309, roughness: 0.3, metalness: 0.8 }); // Viroles en laiton Yautja
        for (let d = 0; d < 16; d++) {
          const angle = ((d - 8) / 16) * Math.PI * 0.95;
          const dreadRootX = Math.sin(angle) * 0.55 * scale;
          const dreadRootY = (4.45 - Math.abs(angle) * 0.22) * scale;
          const dreadRootZ = (-0.1 - Math.cos(angle) * 0.35) * scale;
          const dreadPoints = [
            { x: dreadRootX, y: dreadRootY, z: dreadRootZ },
            { x: dreadRootX * 1.35, y: dreadRootY - 0.7 * scale, z: dreadRootZ - 0.4 * scale },
            { x: dreadRootX * 1.2, y: dreadRootY - 1.55 * scale, z: dreadRootZ - 0.25 * scale }
          ];
          root.add(this._tube(dreadMat, dreadPoints, 0.065 * scale, `predalien_dreadlock_${d}`, 16, 6));
          root.add(this._ring(ringMat, 0.078 * scale, 0.02 * scale, { x: dreadRootX * 1.35, y: dreadRootY - 0.7 * scale, z: dreadRootZ - 0.4 * scale }, { x: 0.4, y: 0, z: 0 }, `dread_collar_${d}`));
        }
      }

      this._addRibCage(root, secondary, 3.62 * scale, 0.72 * scale, 0.52 * scale, royal ? 8 : 6);
      if (!deacon && !neomorph && !newborn && !abomination) {
        this._addDorsalTubes(root, primary, 2.72 * scale, scale, royal ? 8 : (warrior || predalien || raven ? 6 : 4));
      } else if (abomination) {
        // Chantier 131 : Colonne vertébrale externe reptilienne saillante The Abomination (Alien: Romulus 2024)
        const spineMat = this._material('bone', { color: 0x94a3b8, roughness: 0.35, metalness: 0.45 });
        for (let vert = 0; vert < 9; vert++) {
          const vy = (2.2 + vert * 0.22) * scale;
          const vz = (-0.38 - Math.sin((vert / 8) * Math.PI) * 0.12) * scale;
          root.add(this._box(spineMat, { x: 0.14 * scale, y: 0.14 * scale, z: 0.28 * scale }, { x: 0, y: vy, z: vz }, `abomination_external_spine_${vert}`, true));
        }
      }

      for (let side = -1; side <= 1; side += 2) {
        const stance = guardian || royal ? 0.22 : 0;
        this._addSegmentedLimb(
          root,
          primary,
          secondary,
          [
            { x: side * 0.7 * scale, y: 3.72 * scale, z: 0 },
            { x: side * (1.08 + stance) * scale, y: 2.85 * scale, z: 0.18 * scale },
            { x: side * 0.92 * scale, y: 2.02 * scale, z: 0.62 * scale }
          ],
          [0.24 * scale, 0.2 * scale, 0.14 * scale],
          `arm_${side < 0 ? 'left' : 'right'}`,
          {
            material: primary,
            clawMaterial: bone,
            side,
            scale: 0.9 * scale,
            rotationY: side < 0 ? -0.2 : 0.2
          }
        );
        this._addSegmentedLimb(
          root,
          primary,
          secondary,
          [
            { x: side * 0.46 * scale, y: 1.98 * scale, z: 0 },
            { x: side * 0.67 * scale, y: 1.03 * scale, z: -0.1 * scale },
            { x: side * 0.58 * scale, y: 0.18 * scale, z: 0.2 * scale }
          ],
          [0.32 * scale, 0.27 * scale, 0.19 * scale],
          `leg_${side < 0 ? 'left' : 'right'}`,
          {
            material: primary,
            clawMaterial: bone,
            side,
            isFoot: true,
            scale: 1.05 * scale,
            rotationY: side < 0 ? -0.08 : 0.08
          }
        );
      }

      if (royal) {
        for (let side = -1; side <= 1; side += 2) {
          this._addSegmentedLimb(
            root,
            secondary,
            primary,
            [
              { x: side * 0.55 * scale, y: 3.32 * scale, z: -0.26 * scale },
              { x: side * 1.34 * scale, y: 3.02 * scale, z: -0.54 * scale },
              { x: side * 1.66 * scale, y: 2.42 * scale, z: -0.22 * scale }
            ],
            [0.18 * scale, 0.15 * scale, 0.1 * scale],
            `royal_secondary_arm_${side}`,
            {
              material: secondary,
              clawMaterial: bone,
              side,
              scale: 0.72 * scale,
              rotationY: side < 0 ? -0.32 : 0.32
            }
          );
        }
      }

      if (royal || guardian) this._addCrest(root, primary, (royal ? 1.62 : 1.08) * scale, royal);
      if (guardian) {
        // Chantier 56 : Couronne coronaire blindée à 5 pointes du Praetorian / Garde Royal (Aliens 1986 / AvP)
        for (let spike = 0; spike < 5; spike++) {
          const angle = ((spike - 2) / 4) * Math.PI * 0.65;
          root.add(this._coneAlong(
            bone,
            { x: Math.sin(angle) * 1.05 * scale, y: 5.15 * scale, z: (0.1 - Math.cos(angle) * 0.35) * scale },
            { x: Math.sin(angle) * 0.45, y: 0.65, z: -1 },
            0.11 * scale,
            0.75 * scale,
            `praetorian_coronary_spike_${spike}`,
            8
          ));
        }
        // Plaques jugulaires carénées et caroncules de charge
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._box(
            primary,
            { x: 0.32 * scale, y: 0.48 * scale, z: 0.65 * scale },
            { x: side * 0.95 * scale, y: 4.35 * scale, z: 0.55 * scale },
            `praetorian_jugular_plate_${side}`,
            true
          ));
        }
      }
      if (warrior) {
        // Canon Aliens (1986) James Cameron : Calotte crânienne cannelée aux crêtes osseuses transversales
        for (let ridge = 0; ridge < 7; ridge++) {
          const ridgeMesh = this._box(
            primary,
            { x: (0.64 - ridge * 0.05) * scale, y: 0.12 * scale, z: 0.14 * scale },
            { x: 0, y: (4.72 + (ridge % 2) * 0.03) * scale, z: (0.75 - ridge * 0.2) * scale },
            `warrior_cranial_ridge_${ridge}`,
            true
          );
          root.add(ridgeMesh);
        }
      }
      if (spitter) {
        // Chantier 71 : Phénotype "Spitter Corrosif Évolué" (Aliens: Colonial Marines / Fireteam Elite)
        // 4 Poches de venin acide bioluminescentes vert fluo 0x84cc16 (2 antérieures et 2 postérieures)
        const acidVenomMat = this._material('acidBiolum', {
          color: 0x84cc16,
          roughness: 0.22,
          transmission: 0.65,
          transparent: true,
          opacity: 0.88,
          emissiveIntensity: 2.8
        });
        const acidGlandMat = this._material('chitinWarm', { color: 0x365314, roughness: 0.38 });

        for (let side = -1; side <= 1; side += 2) {
          // Poches antérieures maxillaires
          root.add(this._ellipsoid(
            acidVenomMat,
            { x: 0.26 * scale, y: 0.22 * scale, z: 0.44 * scale },
            { x: side * 0.54 * scale, y: 4.42 * scale, z: 0.56 * scale },
            `spitter_acid_pouch_anterior_${side < 0 ? 'left' : 'right'}`,
            16
          ));
          // Poches postérieures carotides cervicales
          root.add(this._ellipsoid(
            acidVenomMat,
            { x: 0.28 * scale, y: 0.26 * scale, z: 0.52 * scale },
            { x: side * 0.48 * scale, y: 4.15 * scale, z: -0.12 * scale },
            `spitter_acid_pouch_posterior_${side < 0 ? 'left' : 'right'}`,
            16
          ));
          // Crêtes glandulaires caustiques céphaliques
          root.add(this._box(
            acidGlandMat,
            { x: 0.12 * scale, y: 0.28 * scale, z: 0.95 * scale },
            { x: side * 0.38 * scale, y: 4.75 * scale, z: 0.35 * scale },
            `spitter_glandular_crest_${side < 0 ? 'left' : 'right'}`,
            true
          ));
          // Nœuds de suintement d'acide sous les mâchoires
          root.add(this._ellipsoid(
            acidVenomMat,
            { x: 0.14 * scale, y: 0.12 * scale, z: 0.16 * scale },
            { x: side * 0.25 * scale, y: 3.82 * scale, z: 1.12 * scale },
            `spitter_acid_drip_node_${side < 0 ? 'left' : 'right'}`,
            12
          ));
        }
      }
      if (alpha) {
        // Chantier 61 : Crête sagittale osseuse acérée et 6 arêtes transversales de l'Alpha (Marvel Comics: Alien: Bloodlines 2021)
        root.add(this._box(
          bone,
          { x: 0.14 * scale, y: 0.42 * scale, z: 1.85 * scale },
          { x: 0, y: 5.08 * scale, z: 0.28 * scale },
          'alpha_sagittal_crest',
          true
        ));
        for (let r = 0; r < 6; r++) {
          root.add(this._box(
            primary,
            { x: (0.85 - r * 0.08) * scale, y: 0.16 * scale, z: 0.18 * scale },
            { x: 0, y: (4.85 + (r % 2) * 0.04) * scale, z: (0.95 - r * 0.28) * scale },
            `alpha_cranial_ridge_${r}`,
            true
          ));
        }
        // Cicatrices chitineuses blanches d'anciennes batailles (Marvel Canon)
        const scarMat = this._material('bone', { color: 0xf1f5f9, roughness: 0.45 });
        for (let s = 0; s < 4; s++) {
          const side = s % 2 === 0 ? -1 : 1;
          root.add(this._box(
            scarMat,
            { x: 0.08 * scale, y: 0.55 * scale, z: 0.05 * scale },
            { x: side * (0.65 + s * 0.06) * scale, y: (3.1 + s * 0.25) * scale, z: 0.35 * scale },
            `alpha_battle_scar_${s}`
          ));
        }
      }
      if (boiler) {
        // Chantier 81 : Phénotype "Boiler / Kamikaze Acide Thermique Aveugle" (Aliens: Colonial Marines)
        // Ampoules d'acide thermique boursouflées orange/acide 0xf97316 / 0x84cc16 pulsantes
        const thermalBlisterMat = this._material('emissiveAmber', {
          color: 0xf97316,
          emissive: 0xea580c,
          emissiveIntensity: 2.8,
          roughness: 0.15,
          transmission: 0.55,
          transparent: true,
          opacity: 0.92
        });
        const causticGooMat = this._material('acidBiolum', {
          color: 0x84cc16,
          emissive: 0x65a30d,
          emissiveIntensity: 2.2,
          roughness: 0.2
        });
        const charredChitin = this._material('darkMetal', { color: 0x1c1917, roughness: 0.85 });

        // 8 Ampoules thermiques dorsales et cervicales prêtes à exploser
        const blisterPositions = [
          { x: -0.32, y: 4.1, z: 0.18, r: 0.22 },
          { x: 0.32, y: 4.1, z: 0.18, r: 0.22 },
          { x: -0.28, y: 3.5, z: -0.28, r: 0.26 },
          { x: 0.28, y: 3.5, z: -0.28, r: 0.26 },
          { x: 0, y: 3.85, z: -0.35, r: 0.3 },
          { x: -0.35, y: 2.9, z: -0.25, r: 0.24 },
          { x: 0.35, y: 2.9, z: -0.25, r: 0.24 },
          { x: 0, y: 2.65, z: -0.32, r: 0.28 }
        ];
        blisterPositions.forEach((b, idx) => {
          root.add(this._ellipsoid(
            idx % 2 === 0 ? thermalBlisterMat : causticGooMat,
            { x: b.r * scale, y: b.r * 1.15 * scale, z: b.r * scale },
            { x: b.x * scale, y: b.y * scale, z: b.z * scale },
            `boiler_acid_blister_${idx}`,
            14
          ));
        });
        // Bosselures et nécroses chitineuses crâniennes (yeux atrophiés et crâne calciné)
        root.add(this._box(
          charredChitin,
          { x: 0.72 * scale, y: 0.38 * scale, z: 1.15 * scale },
          { x: 0, y: 4.6 * scale, z: 0.35 * scale },
          'boiler_calcified_cranial_crust',
          true
        ));
      }
      if (carrier) {
        // Chantier 86 : Phénotype "Carrier / Matrice Vivante Porteuse de Facehuggers" (AvP: Extinction)
        // Nacelle dorsale charnue hypertrophiée avec alvéoles d'incubation et 6 Facehuggers vivants fixés
        const pouchResin = this._material('resin', { color: 0x4a1d24, roughness: 0.35 });
        const eggHusk = this._material('chitinWarm', { color: 0x78350f, roughness: 0.45 });
        const facehuggerSkin = this._material('bone', { color: 0xd4a373, roughness: 0.42 });

        // Nacelle dorsale alvéolaire charnue
        root.add(this._ellipsoid(
          pouchResin,
          { x: 0.95 * scale, y: 1.35 * scale, z: 0.72 * scale },
          { x: 0, y: 3.25 * scale, z: -0.55 * scale },
          'carrier_dorsal_matrix_sac',
          20
        ));
        // 6 Alvéoles d'incubation contenant chacune un Facehugger accroché au dos
        const carrierPods = [
          { x: -0.42, y: 3.8, z: -0.65 },
          { x: 0.42, y: 3.8, z: -0.65 },
          { x: -0.5, y: 3.2, z: -0.7 },
          { x: 0.5, y: 3.2, z: -0.7 },
          { x: -0.38, y: 2.6, z: -0.65 },
          { x: 0.38, y: 2.6, z: -0.65 }
        ];
        carrierPods.forEach((pod, idx) => {
          // Rebord de l'alvéole charnue
          root.add(this._ring(
            eggHusk,
            0.22 * scale,
            0.05 * scale,
            { x: pod.x * scale, y: pod.y * scale, z: pod.z * scale },
            { x: 0.3, y: pod.x > 0 ? 0.3 : -0.3, z: 0 },
            `carrier_pod_rim_${idx}`
          ));
          // Corps central du Facehugger logé dans la cavité
          root.add(this._ellipsoid(
            facehuggerSkin,
            { x: 0.12 * scale, y: 0.15 * scale, z: 0.1 * scale },
            { x: pod.x * scale, y: pod.y * scale, z: (pod.z - 0.05) * scale },
            `carrier_facehugger_body_${idx}`,
            12
          ));
          // 4 Pattes visibles cramponnées au bord de l'alvéole
          for (let leg = 0; leg < 4; leg++) {
            const side = leg % 2 === 0 ? -1 : 1;
            const legY = (pod.y + (leg < 2 ? 0.08 : -0.08)) * scale;
            root.add(this._segment(
              facehuggerSkin,
              new T.Vector3(pod.x * scale, legY, (pod.z - 0.05) * scale),
              new T.Vector3((pod.x + side * 0.18) * scale, legY + 0.05 * scale, pod.z * scale),
              0.02 * scale,
              0.012 * scale,
              `carrier_fh_leg_${idx}_${leg}`,
              6
            ));
          }
        });
      }
      if (newborn) {
        // Chantier 91 : Phénotype "The Newborn / Hybride Humain-Xénomorphe" (Alien: Resurrection 1997)
        const eyeMat = this._material('darkMetal', { color: 0x09090b, roughness: 0.1 });
        const tongueMat = this._material('resin', { color: 0xf43f5e, roughness: 0.4 });
        const noseBridge = this._material('bone', { color: 0xfce7f3, roughness: 0.5 });
        // Arcades sourcilières et orbites oculaires profondes expressives
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._ellipsoid(eyeMat, { x: 0.09 * scale, y: 0.08 * scale, z: 0.05 * scale }, { x: side * 0.22 * scale, y: 4.38 * scale, z: 1.18 * scale }, `newborn_eye_${side}`, 12));
          root.add(this._box(noseBridge, { x: 0.16 * scale, y: 0.06 * scale, z: 0.12 * scale }, { x: side * 0.22 * scale, y: 4.48 * scale, z: 1.15 * scale }, `newborn_brow_${side}`));
        }
        // Nez retroussé quasi-humain
        root.add(this._box(noseBridge, { x: 0.08 * scale, y: 0.14 * scale, z: 0.12 * scale }, { x: 0, y: 4.32 * scale, z: 1.25 * scale }, 'newborn_humanoid_nose'));
        // Langue humaine charnue rétractile
        root.add(this._segment(tongueMat, new T.Vector3(0, 4.08 * scale, 1.1 * scale), new T.Vector3(0, 4.06 * scale, 1.62 * scale), 0.09 * scale, 0.06 * scale, 'newborn_fleshy_tongue', 10));
        // Pectoraux et cage thoracique humanoïde
        root.add(this._ellipsoid(secondary, { x: 0.72 * scale, y: 0.45 * scale, z: 0.4 * scale }, { x: 0, y: 3.25 * scale, z: 0.35 * scale }, 'newborn_humanoid_chest', 16));
      }
      if (raven) {
        // Chantier 94 : Phénotype "The Raven / Berserker Géant à Blindage Bivalve" (Aliens: Colonial Marines)
        const armorChitin = this._material('darkMetal', { color: 0x0f172a, roughness: 0.3, metalness: 0.85 });
        const boneSpur = this._material('bone', { color: 0x475569, roughness: 0.35, metalness: 0.5 });
        // Blindage bivalve céphalique : plaques superposées protégeant le crâne
        for (let p = 0; p < 5; p++) {
          root.add(this._box(
            armorChitin,
            { x: (0.95 - p * 0.06) * scale, y: 0.22 * scale, z: 0.35 * scale },
            { x: 0, y: (4.95 - p * 0.18) * scale, z: (0.8 - p * 0.45) * scale },
            `raven_bivalve_plate_${p}`,
            true
          ));
        }
        // Éperons d'épaule massifs
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._coneAlong(boneSpur, { x: side * 0.85 * scale, y: 3.85 * scale, z: 0 }, { x: side * 0.8, y: 0.8, z: -0.3 }, 0.16 * scale, 0.95 * scale, `raven_shoulder_spur_${side}`, 8));
        }
      }
      if (king) {
        // Chantier 101 : Phénotype "The King Xenomorph / Rouge de Charon" (Aliens: Rogue 1993 / Comics)
        const royalRed = this._material('chitin', { color: 0x991b1b, emissive: 0x7f1d1d, emissiveIntensity: 0.45, roughness: 0.18, metalness: 0.72 });
        const crownHorn = this._material('bone', { color: 0xfecaca, roughness: 0.25, metalness: 0.55 });
        // Couronne céphalique trilobée royale massive
        root.add(this._box(royalRed, { x: 1.55 * scale, y: 0.88 * scale, z: 1.85 * scale }, { x: 0, y: 5.05 * scale, z: -0.35 * scale }, 'king_royal_trilobe_crest', true));
        // 4 Cornes latérales incurvées royales
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._coneAlong(crownHorn, { x: side * 0.75 * scale, y: 5.15 * scale, z: 0.2 * scale }, { x: side * 0.65, y: 0.45, z: 0.85 }, 0.18 * scale, 1.35 * scale, `king_forward_horn_${side}`, 10));
          root.add(this._coneAlong(crownHorn, { x: side * 0.88 * scale, y: 5.25 * scale, z: -0.8 * scale }, { x: side * 0.85, y: 0.65, z: -0.9 }, 0.22 * scale, 1.65 * scale, `king_rear_horn_${side}`, 10));
          // Épaulières osseuses dentelées massives
          root.add(this._ellipsoid(royalRed, { x: 0.52 * scale, y: 0.38 * scale, z: 0.65 * scale }, { x: side * 0.95 * scale, y: 3.95 * scale, z: 0.1 * scale }, `king_shoulder_crest_${side}`, 14));
        }
      }
      if (bodyburster) {
        // Chantier 104 : Phénotype "Bodyburster / Émergence Dorsale Fulgurante" (Alien: Covenant 2017)
        const bloodVein = this._material('emissiveRed', { color: 0xdc2626, emissive: 0x991b1b, emissiveIntensity: 1.4 });
        const membraneMat = this._material('resin', { color: 0xfda4af, opacity: 0.78, transparent: true });
        // Lambeaux de membrane amniotique sanglante sur le dos (vestige de l'éruption vertébrale)
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._box(membraneMat, { x: 0.45 * scale, y: 0.85 * scale, z: 0.08 * scale }, { x: side * 0.42 * scale, y: 3.2 * scale, z: -0.35 * scale }, `bodyburster_dorsal_shred_${side}`));
        }
        // Artères cramoisies pulsantes et museau ensanglanté d'émergence
        root.add(this._ellipsoid(bloodVein, { x: 0.28 * scale, y: 0.22 * scale, z: 0.48 * scale }, { x: 0, y: 4.12 * scale, z: 1.25 * scale }, 'bodyburster_bloodied_jaw', 12));
      }
      if (flyingDrone) {
        // Chantier 161 : Ailes membraneuses chiroptères dorsales (Flying Xenomorph 1992 / Comics Dark Horse)
        const wingMembrane = this._material('chitin', { color: 0x1e1b4b, roughness: 0.45, opacity: 0.88, transparent: true, side: 2 });
        const wingBone = this._material('bone', { color: 0x312e81, roughness: 0.3 });
        for (let side = -1; side <= 1; side += 2) {
          const p0 = new T.Vector3(side * 0.35 * scale, 3.8 * scale, -0.35 * scale);
          const p1 = new T.Vector3(side * 1.6 * scale, 4.4 * scale, -0.6 * scale);
          const p2 = new T.Vector3(side * 2.4 * scale, 3.6 * scale, -0.8 * scale);
          root.add(this._segment(wingBone, p0, p1, 0.08 * scale, 0.05 * scale, `flying_wing_bone_a_${side}`, 8));
          root.add(this._segment(wingBone, p1, p2, 0.05 * scale, 0.03 * scale, `flying_wing_bone_b_${side}`, 8));
          root.add(this._box(wingMembrane, { x: 1.8 * scale, y: 1.4 * scale, z: 0.04 * scale }, { x: side * 1.4 * scale, y: 3.8 * scale, z: -0.65 * scale }, `flying_wing_membrane_${side}`));
        }
      }
      if (flyingQueen) {
        // Reine Ailée Royale / Flying Queen (Aliens: Genocide)
        const royalWingMembrane = this._material('chitin', { color: 0x2e1065, roughness: 0.35, opacity: 0.9, transparent: true, side: 2 });
        const royalWingBone = this._material('bone', { color: 0x4c1d95, roughness: 0.25 });
        for (let side = -1; side <= 1; side += 2) {
          const p0 = new T.Vector3(side * 0.45 * scale, 4.2 * scale, -0.4 * scale);
          const p1 = new T.Vector3(side * 2.2 * scale, 5.2 * scale, -0.8 * scale);
          const p2 = new T.Vector3(side * 3.4 * scale, 4.1 * scale, -1.1 * scale);
          root.add(this._segment(royalWingBone, p0, p1, 0.12 * scale, 0.08 * scale, `flying_queen_bone_a_${side}`, 10));
          root.add(this._segment(royalWingBone, p1, p2, 0.08 * scale, 0.04 * scale, `flying_queen_bone_b_${side}`, 10));
          root.add(this._box(royalWingMembrane, { x: 2.8 * scale, y: 2.1 * scale, z: 0.05 * scale }, { x: side * 1.9 * scale, y: 4.4 * scale, z: -0.9 * scale }, `flying_queen_membrane_${side}`));
        }
        root.add(this._box(primary, { x: 1.6 * scale, y: 0.7 * scale, z: 1.8 * scale }, { x: 0, y: 5.2 * scale, z: -0.3 * scale }, 'flying_queen_crest', true));
      }
      if (queenMother) {
        // Reine Mère Suprême / Supreme Queen Mother (Aliens: Female War)
        const crownMat = this._material('chitin', { color: 0x3b0764, emissive: 0x581c87, emissiveIntensity: 0.65, roughness: 0.18, metalness: 0.75 });
        const crownJewel = this._material('emissiveRed', { color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 3.5 });
        root.add(this._box(crownMat, { x: 2.2 * scale, y: 1.1 * scale, z: 2.4 * scale }, { x: 0, y: 5.5 * scale, z: -0.5 * scale }, 'queen_mother_coronal_crest', true));
        root.add(this._ellipsoid(crownJewel, { x: 0.25 * scale, y: 0.35 * scale, z: 0.25 * scale }, { x: 0, y: 5.8 * scale, z: 0.2 * scale }, 'queen_mother_telepathic_crown'));
        // 4 bras secondaires royaux thoraciques
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._cylinder(primary, 0.08 * scale, 0.05 * scale, 1.2 * scale, { x: side * 0.45 * scale, y: 3.4 * scale, z: 0.45 * scale }, { x: 0.4, y: 0, z: side * -0.4 }, `queen_mother_secondary_arm_${side}`));
        }
      }
      if (charger) {
        // Charger Xenomorph (Aliens: Fireteam Elite)
        const armorPlate = this._material('bone', { color: 0x57534e, roughness: 0.6, metalness: 0.4 });
        root.add(this._box(armorPlate, { x: 1.25 * scale, y: 0.65 * scale, z: 1.45 * scale }, { x: 0, y: 4.8 * scale, z: 0.45 * scale }, 'charger_battering_crest', true));
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._box(armorPlate, { x: 0.45 * scale, y: 0.45 * scale, z: 0.65 * scale }, { x: side * 0.85 * scale, y: 3.6 * scale, z: 0.15 * scale }, `charger_shoulder_ram_${side}`, true));
        }
      }
      if (pathogenStalker) {
        // Pathogen Stalker (Aliens: Fireteam Elite: Pathogen)
        const crystalGlow = this._material('emissiveGreen', { color: 0x10b981, emissive: 0x059669, emissiveIntensity: 2.8 });
        for (let cyst = 0; cyst < 5; cyst++) {
          root.add(this._coneAlong(crystalGlow, { x: (Math.sin(cyst * 1.5) * 0.35) * scale, y: (3.2 + cyst * 0.28) * scale, z: -0.32 * scale }, { x: 0, y: 0.3, z: -1 }, 0.09 * scale, 0.45 * scale, `pathogen_cyst_spike_${cyst}`));
        }
      }
      if (spiderAlien) {
        // Spider Xenomorph (Kenner / Comics)
        const legBone = this._material('chitin', { color: 0x09090b, roughness: 0.3 });
        for (let s = -1; s <= 1; s += 2) {
          for (let l = 0; l < 2; l++) {
            root.add(this._segment(legBone, new T.Vector3(s * 0.4 * scale, (3.2 + l * 0.4) * scale, 0), new T.Vector3(s * 1.6 * scale, (3.8 + l * 0.4) * scale, 0.4 * scale), 0.06 * scale, 0.03 * scale, `spider_leg_upper_${s}_${l}`));
            root.add(this._segment(legBone, new T.Vector3(s * 1.6 * scale, (3.8 + l * 0.4) * scale, 0.4 * scale), new T.Vector3(s * 2.2 * scale, 1.2 * scale, 0.8 * scale), 0.03 * scale, 0.015 * scale, `spider_leg_lower_${s}_${l}`));
          }
        }
      }
      if (chrysalisWarrior) {
        // Chrysalis Hardened Warrior (AvP Arcade / Rebellion)
        const stonePlate = this._material('industrial', { color: 0x78716c, roughness: 0.85, metalness: 0.2 });
        root.add(this._box(stonePlate, { x: 1.15 * scale, y: 0.55 * scale, z: 1.35 * scale }, { x: 0, y: 4.8 * scale, z: 0.2 * scale }, 'chrysalis_petrified_crest', true));
        root.add(this._box(stonePlate, { x: 0.95 * scale, y: 1.15 * scale, z: 0.35 * scale }, { x: 0, y: 3.15 * scale, z: 0.45 * scale }, 'chrysalis_chest_carapace', true));
      }
      if (!newborn) {
        this._addTail(
          root,
          primary,
          bone,
          { x: 0, y: 1.88 * scale, z: -0.36 * scale },
          (king ? 6.8 : (royal ? 6.4 : (raven ? 5.5 : 4.8))) * scale,
          (king || royal) ? 1.05 * scale : 0.58 * scale,
          (king || royal) ? 0.42 : -0.34,
          (king ? 0.24 : (royal ? 0.19 : (raven ? 0.22 : 0.14))) * scale
        );
      } else {
        // Coccyx vestigial humain atrophié du Newborn
        root.add(this._segment(primary, new T.Vector3(0, 1.88 * scale, -0.36 * scale), new T.Vector3(0, 1.65 * scale, -0.55 * scale), 0.14 * scale, 0.05 * scale, 'newborn_vestigial_tail', 8));
      }
      if (raven) {
        // Massue caudale lourde hérissée de pointes au bout de la queue du Raven
        const armorChitin = this._material('darkMetal', { color: 0x0f172a, roughness: 0.3, metalness: 0.85 });
        const boneSpur = this._material('bone', { color: 0x475569, roughness: 0.35, metalness: 0.5 });
        const tailEndX = -0.34 * 5.5 * scale * 0.47;
        const tailEndY = 1.88 * scale + 0.58 * scale;
        const tailEndZ = -0.36 * scale - 5.5 * scale;
        root.add(this._ellipsoid(armorChitin, { x: 0.32 * scale, y: 0.28 * scale, z: 0.55 * scale }, { x: tailEndX, y: tailEndY, z: tailEndZ }, 'raven_tail_club_mace', 16));
        for (let sp = 0; sp < 6; sp++) {
          const spAng = (sp / 6) * Math.PI * 2;
          root.add(this._coneAlong(boneSpur, { x: tailEndX, y: tailEndY, z: tailEndZ }, { x: Math.cos(spAng), y: Math.sin(spAng), z: -0.5 }, 0.06 * scale, 0.4 * scale, `raven_mace_spike_${sp}`, 6));
        }
      }
      if (neomorph) {
        // Chantier 51 : Stylet osseux acéré terminal de queue du Néomorphe (Alien: Covenant)
        root.add(this._coneAlong(
          bone,
          { x: -0.34 * 4.8 * scale * 0.47, y: 1.88 * scale + 0.58 * scale, z: -0.36 * scale - 4.8 * scale },
          { x: 0, y: 0.1, z: -1 },
          0.09 * scale,
          0.85 * scale,
          'neomorph_tail_stylus',
          8
        ));
      }
      if (alpha || king) {
        // Chantier 70 & 101 : Fouet bifide / Double dard royal
        for (let prong = -1; prong <= 1; prong += 2) {
          root.add(this._coneAlong(
            bone,
            { x: (-0.34 * 4.8 * scale * 0.47) + prong * 0.22 * scale, y: 1.88 * scale + 0.58 * scale, z: -0.36 * scale - 4.8 * scale },
            { x: prong * 0.35, y: 0.1, z: -1 },
            0.12 * scale,
            1.1 * scale,
            `alpha_bifid_tail_prong_${prong < 0 ? 'left' : 'right'}`,
            8
          ));
        }
      }
      this._addCarapaceSpines(root, primary, 4.75 * scale, (royal || king) ? 13 : (bodyburster ? 11 : 9), 1.15 * scale, 1.0 * scale, -1);
      root.add(this._ellipsoid(
        sensory,
        { x: 0.12 * scale, y: 0.06 * scale, z: 0.18 * scale },
        { x: 0, y: 4.3 * scale, z: 1.39 * scale },
        'sensory_node',
        12
      ));

      if (royal) {
        root.add(this._ellipsoid(
          secondary,
          { x: 1.04 * scale, y: 0.88 * scale, z: 1.55 * scale },
          { x: 0, y: 2.12 * scale, z: -1.62 * scale },
          'royal_abdomen',
          22
        ));
        for (let band = 0; band < 6; band++) {
          root.add(this._ring(
            primary,
            (0.82 - band * 0.055) * scale,
            0.055 * scale,
            { x: 0, y: (2.42 - band * 0.12) * scale, z: (-0.82 - band * 0.32) * scale },
            { x: Math.PI / 2, y: 0, z: 0 },
            `royal_abdomen_band_${band}`
          ));
        }
      }
      return this._finalize(root, {
        modelType: 'adult',
        caste,
        height: (royal ? 7.4 : (alpha ? 6.8 : (guardian ? 6.25 : 5.25))),
        animationJoints: {
          head: 'cranial_dome',
          jaw: 'articulated_jaw',
          leftArm: 'arm_left',
          rightArm: 'arm_right',
          leftLeg: 'leg_left',
          rightLeg: 'leg_right',
          tail: 'segmented_tail'
        }
      });
    }

    _createRunner() {
      const T = this._three();
      const root = new T.Group();
      root.name = 'adult_runner';
      const primary = this._material('chitin', { color: 0x9a8980, roughness: 0.42, metalness: 0.12, clearcoat: 0.54 });
      const secondary = this._material('resin', { color: 0x8e8174, opacity: 1, transparent: false });
      const bone = this._material('bone', { color: 0xc7b58b });

      root.add(this._ellipsoid(
        primary,
        { x: 0.68, y: 0.62, z: 1.52 },
        { x: 0, y: 1.55, z: -0.15 },
        'runner_thorax',
        36
      ));
      root.add(this._ellipsoid(
        primary,
        { x: 0.42, y: 0.33, z: 1.28 },
        { x: 0, y: 1.72, z: 1.55 },
        'runner_head',
        44
      ));
      root.add(this._ellipsoid(
        secondary,
        { x: 0.54, y: 0.18, z: 0.6 },
        { x: 0, y: 1.46, z: 2.22 },
        'runner_muzzle',
        16
      ));
      this._addJaw(root, primary, bone, { x: 0, y: 1.32, z: 2.56 }, 0.72, false);
      this._addRibCage(root, secondary, 1.86, 0.62, 0.5, 5);

      for (let legIndex = 0; legIndex < 4; legIndex++) {
        const side = legIndex % 2 === 0 ? -1 : 1;
        const front = legIndex < 2;
        const z = front ? 0.82 : -0.92;
        this._addSegmentedLimb(
          root,
          primary,
          secondary,
          [
            { x: side * 0.52, y: 1.58, z },
            { x: side * 0.92, y: 0.86, z: z + (front ? 0.32 : -0.24) },
            { x: side * 0.74, y: 0.12, z: z + (front ? 0.62 : -0.48) }
          ],
          [0.24, 0.18, 0.12],
          `runner_leg_${legIndex}`,
          {
            material: primary,
            clawMaterial: bone,
            side,
            isFoot: true,
            scale: 0.82,
            rotationY: side < 0 ? -0.08 : 0.08
          }
        );
      }
      this._addTail(root, primary, secondary, { x: 0, y: 1.55, z: -1.42 }, 5.5, 0.42, 0.55, 0.13);
      this._addCarapaceSpines(root, primary, 2.05, 11, 0.78, 1.42, -1);
      return this._finalize(root, {
        modelType: 'adult',
        caste: 'runner',
        height: 2.55,
        animationJoints: {
          head: 'runner_head', jaw: 'articulated_jaw', tail: 'segmented_tail',
          legs: Array.from({ length: 4 }, (_, index) => `runner_leg_${index}`)
        },
        animationRoles: {
          locomotion: Array.from({ length: 4 }, (_, index) => `runner_leg_${index}`),
          attack: ['runner_head', 'articulated_jaw', 'segmented_tail']
        }
      });
    }

    _createCrusher() {
      const T = this._three();
      const root = new T.Group();
      root.name = 'adult_crusher';
      const scale = 1.45;
      const primary = this._material('chitin', { color: 0x18181b, roughness: 0.4, metalness: 0.52 });
      const secondary = this._material('chitinWarm', { color: 0x27272a });
      const bone = this._material('bone', { color: 0xa1a1aa });

      // Massive armored quadruped thorax
      root.add(this._ellipsoid(
        primary,
        { x: 0.95 * scale, y: 0.85 * scale, z: 1.85 * scale },
        { x: 0, y: 1.8 * scale, z: -0.2 * scale },
        'crusher_thorax',
        20
      ));
      // Heavy head with ramming crest
      root.add(this._ellipsoid(
        primary,
        { x: 0.75 * scale, y: 0.58 * scale, z: 1.2 * scale },
        { x: 0, y: 1.95 * scale, z: 1.65 * scale },
        'crusher_head',
        20
      ));

      // Chantier 77 : Bouclier Céphalique Pare-Balles Renforcé et Cornes de Percée (Aliens: Colonial Marines / Fireteam Elite)
      const shieldGeo = new T.ConeGeometry(1.4 * scale, 2.0 * scale, 4);
      const shieldMesh = new T.Mesh(shieldGeo, primary);
      shieldMesh.name = 'crusher_heavy_shield';
      shieldMesh.rotation.x = Math.PI / 3;
      shieldMesh.rotation.y = Math.PI / 4;
      shieldMesh.position.set(0, 2.3 * scale, 1.35 * scale);
      shieldMesh.scale.set(1.3, 0.45, 1.15);
      root.add(shieldMesh);

      for (let side = -1; side <= 1; side += 2) {
        root.add(this._coneAlong(
          bone,
          { x: side * 1.15 * scale, y: 3.1 * scale, z: 1.15 * scale },
          { x: side * 0.45, y: 0.65, z: 0.35 },
          0.16 * scale,
          0.85 * scale,
          `crusher_shield_horn_${side < 0 ? 'left' : 'right'}`,
          10
        ));
        root.add(this._box(
          primary,
          { x: 0.45 * scale, y: 0.72 * scale, z: 0.88 * scale },
          { x: side * 0.85 * scale, y: 1.95 * scale, z: 0.55 * scale },
          `crusher_jugular_plate_${side < 0 ? 'left' : 'right'}`,
          true
        ));
      }

      this._addJaw(root, primary, bone, { x: 0, y: 1.5 * scale, z: 2.6 * scale }, 0.95 * scale, true);
      this._addRibCage(root, secondary, 2.1 * scale, 0.9 * scale, 0.7 * scale, 6);

      for (let legIndex = 0; legIndex < 4; legIndex++) {
        const side = legIndex % 2 === 0 ? -1 : 1;
        const front = legIndex < 2;
        const z = front ? 0.95 * scale : -1.05 * scale;
        this._addSegmentedLimb(
          root,
          primary,
          secondary,
          [
            { x: side * 0.75 * scale, y: 1.85 * scale, z },
            { x: side * 1.2 * scale, y: 1.0 * scale, z: z + (front ? 0.3 : -0.25) * scale },
            { x: side * 0.98 * scale, y: 0.15 * scale, z: z + (front ? 0.6 : -0.48) * scale }
          ],
          [0.34 * scale, 0.26 * scale, 0.18 * scale],
          `crusher_leg_${legIndex}`,
          {
            material: primary,
            clawMaterial: bone,
            side,
            isFoot: true,
            scale: 1.15 * scale,
            rotationY: side < 0 ? -0.1 : 0.1
          }
        );
      }
      this._addTail(root, primary, bone, { x: 0, y: 1.8 * scale, z: -1.8 * scale }, 6.2 * scale, 0.5 * scale, 0.65 * scale, 0.16 * scale);

      return this._finalize(root, {
        modelType: 'adult',
        caste: 'crusher',
        height: 3.8 * scale,
        animationJoints: Array.from({ length: 4 }, (_, index) => `crusher_leg_${index}`)
      });
    }

    // -------------------------------------------------------------------------
    // 11. PUBLIC MODEL: RTS UNIT ADAPTER
    // -------------------------------------------------------------------------
    createHiveUnit(caste) {
      const normalizedCaste = String(caste || 'warrior').toLowerCase();
      const root = this.createAdult(normalizedCaste);
      root.name = `hive_unit_${normalizedCaste}`;
      root.userData.modelType = 'hiveUnit';
      root.userData.caste = normalizedCaste;

      const commandNode = this._material('emissiveGreen', {
        transparent: true,
        opacity: 0.72,
        emissiveIntensity: 0.58
      });
      const node = this._ring(
        commandNode,
        normalizedCaste === 'queen' ? 1.5 : 0.72,
        0.035,
        { x: 0, y: 0.045, z: 0 },
        { x: Math.PI / 2, y: 0, z: 0 },
        'synaptic_command_node'
      );
      root.add(node);
      return root;
    }

    // -------------------------------------------------------------------------
    // 12. PUBLIC MODEL: HUMAN / COMBATANT / EXOSUIT
    // -------------------------------------------------------------------------
    _createLaboratoryRodent(requestedType) {
      const T = this._three();
      const root = new T.Group();
      root.name = 'laboratory_rodent';
      const coat = this._material('fabric', { color: 0x9a8a78, roughness: 0.96 });
      const skin = this._material('skin', { color: 0xd9a6a3, roughness: 0.84 });
      const dark = this._material('darkMetal', { color: 0x111111, metalness: 0.04 });

      root.add(this._ellipsoid(
        coat,
        { x: 0.14, y: 0.13, z: 0.28 },
        { x: 0, y: 0.16, z: -0.02 },
        'rodent_torso',
        14
      ));

      const headJoint = new T.Group();
      headJoint.name = 'rodent_head';
      headJoint.position.set(0, 0.19, 0.24);
      headJoint.add(this._ellipsoid(
        coat,
        { x: 0.12, y: 0.11, z: 0.15 },
        { x: 0, y: 0, z: 0.04 },
        'rodent_skull',
        14
      ));
      headJoint.add(this._ellipsoid(
        skin,
        { x: 0.055, y: 0.045, z: 0.09 },
        { x: 0, y: -0.015, z: 0.17 },
        'rodent_muzzle',
        10
      ));
      headJoint.add(this._ellipsoid(
        dark,
        { x: 0.022, y: 0.018, z: 0.022 },
        { x: 0, y: -0.005, z: 0.255 },
        'rodent_nose',
        8
      ));
      for (let side = -1; side <= 1; side += 2) {
        headJoint.add(this._ellipsoid(
          skin,
          { x: 0.058, y: 0.065, z: 0.022 },
          { x: side * 0.075, y: 0.09, z: 0.005 },
          `rodent_ear_${side < 0 ? 'left' : 'right'}`,
          10
        ));
        headJoint.add(this._ellipsoid(
          dark,
          { x: 0.016, y: 0.016, z: 0.012 },
          { x: side * 0.07, y: 0.035, z: 0.15 },
          `rodent_eye_${side < 0 ? 'left' : 'right'}`,
          8
        ));
      }
      root.add(headJoint);

      const legNames = [];
      for (let legIndex = 0; legIndex < 4; legIndex++) {
        const side = legIndex % 2 === 0 ? -1 : 1;
        const front = legIndex < 2;
        const z = front ? 0.13 : -0.17;
        const legName = `rodent_leg_${front ? 'front' : 'rear'}_${side < 0 ? 'left' : 'right'}`;
        const limb = this._addSegmentedLimb(
          root,
          coat,
          skin,
          [
            { x: side * 0.09, y: 0.14, z },
            { x: side * 0.15, y: 0.035, z: z + (front ? 0.05 : -0.04) }
          ],
          [0.025, 0.016],
          legName,
          null
        );
        limb.add(this._ellipsoid(
          skin,
          { x: 0.04, y: 0.014, z: 0.055 },
          { x: side * 0.06, y: -0.105, z: front ? 0.07 : -0.055 },
          `${legName}_paw`,
          8
        ));
        legNames.push(legName);
      }

      const tailJoint = new T.Group();
      tailJoint.name = 'rodent_tail';
      tailJoint.position.set(0, 0.17, -0.27);
      tailJoint.add(this._tube(
        skin,
        [
          { x: 0, y: 0, z: 0 },
          { x: 0.08, y: 0.015, z: -0.18 },
          { x: 0.15, y: -0.02, z: -0.37 },
          { x: 0.1, y: -0.05, z: -0.58 }
        ],
        0.014,
        'rodent_tail_skin',
        18,
        6
      ));
      root.add(tailJoint);

      return this._finalize(root, {
        modelType: 'laboratoryRodent',
        subtype: 'labrodent',
        requestedSubtype: requestedType,
        forwardAxis: '+Z',
        height: 0.34,
        animationJoints: {
          head: 'rodent_head',
          legs: legNames,
          tail: 'rodent_tail'
        },
        animationRoles: {
          locomotion: [...legNames, 'rodent_tail'],
          attack: ['rodent_head']
        }
      });
    }

    _createServiceAnimal(requestedType) {
      const T = this._three();
      const root = new T.Group();
      const isCyberHound = String(requestedType || '').includes('cyber');
      root.name = isCyberHound ? 'service_animal_weyland_cyber_hound' : 'service_animal_labhound';
      const coat = isCyberHound
        ? this._material('chitin', { color: 0x1e293b, roughness: 0.35, metalness: 0.72 })
        : this._material('fabric', { color: 0x4a392f, roughness: 0.94 });
      const armor = isCyberHound
        ? this._material('darkMetal', { color: 0x09090b, roughness: 0.25, metalness: 0.88 })
        : this._material('industrial', { color: 0x374151, roughness: 0.58 });
      const dark = this._material('darkMetal', { color: 0x111827 });
      const sensor = isCyberHound
        ? this._material('emissiveRed', { color: 0xef4444, emissiveIntensity: 3.2 })
        : this._material('emissiveAmber', { color: 0x713f12, emissiveIntensity: 0.58 });

      // The animal faces +Z, matching humanoids and weapon barrels.
      root.add(this._ellipsoid(
        coat,
        { x: 0.58, y: 0.72, z: 1.35 },
        { x: 0, y: 1.18, z: 0 },
        'labhound_torso',
        20
      ));
      root.add(this._segment(
        coat,
        new T.Vector3(0, 1.34, 0.78),
        new T.Vector3(0, 1.55, 1.18),
        0.34,
        0.3,
        'labhound_neck',
        12
      ));
      root.add(this._ellipsoid(
        coat,
        { x: 0.5, y: 0.56, z: 0.64 },
        { x: 0, y: 1.55, z: 1.32 },
        'labhound_head',
        18
      ));
      root.add(this._ellipsoid(
        coat,
        { x: 0.32, y: 0.27, z: 0.56 },
        { x: 0, y: 1.4, z: 1.78 },
        'labhound_muzzle',
        14
      ));
      root.add(this._ellipsoid(
        dark,
        { x: 0.13, y: 0.1, z: 0.13 },
        { x: 0, y: 1.43, z: 2.25 },
        'labhound_nose',
        12
      ));

      if (isCyberHound) {
        // Chantier 73 : Capteur mono-optique rouge et mâchoire cybernétique acier dentelée
        root.add(this._ellipsoid(
          sensor,
          { x: 0.16, y: 0.08, z: 0.12 },
          { x: 0, y: 1.72, z: 1.62 },
          'cyberhound_mono_optic',
          16
        ));
        root.add(this._box(
          dark,
          { x: 0.34, y: 0.12, z: 0.54 },
          { x: 0, y: 1.34, z: 1.82 },
          'cyberhound_steel_mandible',
          true
        ));
        root.add(this._box(
          armor,
          { x: 0.44, y: 0.15, z: 0.58 },
          { x: 0, y: 1.82, z: 1.25 },
          'cyberhound_cranial_armor',
          true
        ));
      }

      for (let side = -1; side <= 1; side += 2) {
        root.add(this._coneAlong(
          coat,
          { x: side * 0.27, y: 1.87, z: 1.24 },
          { x: side * 0.28, y: 1, z: -0.08 },
          0.16,
          0.46,
          `labhound_ear_${side < 0 ? 'left' : 'right'}`,
          8
        ));
        root.add(this._ellipsoid(
          sensor,
          { x: 0.06, y: 0.07, z: 0.06 },
          { x: side * 0.32, y: 1.67, z: 1.75 },
          `labhound_eye_${side < 0 ? 'left' : 'right'}`,
          8
        ));

        for (const front of [-0.72, 0.78]) {
          const legName = `labhound_leg_${front > 0 ? 'front' : 'rear'}_${side < 0 ? 'left' : 'right'}`;
          const hip = new T.Vector3(side * 0.38, 1.05, front);
          const knee = new T.Vector3(
            side * 0.42,
            0.55,
            front + (front > 0 ? 0.08 : -0.08)
          );
          const paw = new T.Vector3(
            side * 0.4,
            0.16,
            front + (front > 0 ? 0.2 : -0.2)
          );
          const localKnee = knee.clone().sub(hip);
          const localPaw = paw.clone().sub(knee);
          const legJoint = new T.Group();
          legJoint.name = legName;
          legJoint.position.copy(hip);
          legJoint.add(this._segment(
            coat,
            new T.Vector3(),
            localKnee,
            0.16,
            0.13,
            `${legName}_upper`,
            10
          ));

          const kneeJoint = new T.Group();
          kneeJoint.name = `${legName}_knee`;
          kneeJoint.position.copy(localKnee);
          kneeJoint.add(this._joint(coat, { x: 0, y: 0, z: 0 }, 0.13, `${legName}_knee_cap`));
          kneeJoint.add(this._segment(
            coat,
            new T.Vector3(),
            localPaw,
            0.13,
            0.09,
            `${legName}_lower`,
            10
          ));
          kneeJoint.add(this._ellipsoid(
            dark,
            { x: 0.15, y: 0.08, z: 0.24 },
            {
              x: localPaw.x,
              y: localPaw.y - 0.08,
              z: localPaw.z + (front > 0 ? 0.1 : -0.1)
            },
            `${legName}_paw`,
            10
          ));
          legJoint.add(kneeJoint);
          root.add(legJoint);
        }
      }

      const tailJoint = new T.Group();
      tailJoint.name = 'labhound_tail';
      tailJoint.position.set(0, 1.28, -1.18);
      tailJoint.add(this._tube(
        coat,
        [
          { x: 0, y: 0, z: 0 },
          { x: 0.12, y: 0.24, z: -0.6 },
          { x: 0.2, y: -0.06, z: -1.02 }
        ],
        0.11,
        'labhound_tail_skin',
        18,
        8
      ));
      root.add(tailJoint);

      // Search harness and sensor pods make the role readable at RTS distance.
      root.add(this._box(
        armor,
        { x: 1.22, y: 0.16, z: 1.45 },
        { x: 0, y: 1.45, z: 0.05 },
        'labhound_search_harness',
        true
      ));
      for (let side = -1; side <= 1; side += 2) {
        root.add(this._box(
          dark,
          { x: 0.16, y: 0.32, z: 0.52 },
          { x: side * 0.61, y: 1.4, z: 0.08 },
          `labhound_sensor_pod_${side < 0 ? 'left' : 'right'}`,
          true
        ));
      }
      root.add(this._box(
        sensor,
        { x: 0.28, y: 0.16, z: 0.08 },
        { x: 0.34, y: 1.57, z: 0.62 },
        'labhound_tracker'
      ));

      return this._finalize(root, {
        modelType: 'serviceAnimal',
        subtype: isCyberHound ? 'weyland_cyber_hound' : 'labhound',
        requestedSubtype: requestedType,
        forwardAxis: '+Z',
        height: 2.25,
        animationJoints: {
          head: 'labhound_head',
          tail: 'labhound_tail',
          frontLeft: 'labhound_leg_front_left',
          frontRight: 'labhound_leg_front_right',
          rearLeft: 'labhound_leg_rear_left',
          rearRight: 'labhound_leg_rear_right',
          knees: [
            'labhound_leg_front_left_knee',
            'labhound_leg_front_right_knee',
            'labhound_leg_rear_left_knee',
            'labhound_leg_rear_right_knee'
          ]
        },
        animationRoles: {
          locomotion: [
            'labhound_leg_front_left',
            'labhound_leg_front_right',
            'labhound_leg_rear_left',
            'labhound_leg_rear_right',
            'labhound_tail'
          ],
          attack: ['labhound_head']
        }
      });
    }

    createHuman(type) {
      const requestedType = String(type || 'civilian');
      const normalizedType = this._normalizeHumanType(requestedType);
      if (normalizedType === 'powerloader') return this._createExosuit();
      if (normalizedType === 'labhound' || normalizedType === 'weyland_cyber_hound') return this._createServiceAnimal(requestedType);
      if (normalizedType === 'labrodent') return this._createLaboratoryRodent(requestedType);

      const imported = global.HiveAssetLibrary?.instantiate?.(normalizedType, { height: 4.25 });
      if (imported) {
        Object.assign(imported.userData, {
          modelType: 'human', subtype: normalizedType, requestedSubtype: requestedType,
          forwardAxis: '+Z', height: 4.25, hiveImportedModel: true
        });
        const hand = global.HiveAssetLibrary.getRuntime(imported)?.bindings.rightHand;
        if (hand && ['guard', 'marine', 'smartgunner', 'incinerator', 'commando'].includes(normalizedType)) {
          const T = this._three();
          const metal = this._material('industrial', { color: 0x56616b });
          const dark = this._material('darkMetal', { color: 0x20282d });
          const accent = this._material('emissiveAmber', { emissiveIntensity: 0.25 });
          const weapon = this._createEquipmentWeapon(normalizedType, metal, dark, accent);
          global.HiveModelDetail?.mergeStatic?.(weapon);
          const usedMaterials = new Set();
          weapon.traverse(object => {
            if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => usedMaterials.add(material));
          });
          for (const material of [metal, dark, accent]) if (!usedMaterials.has(material)) material.dispose();
          imported.updateMatrixWorld(true);
          const grip = new T.Group(); grip.name = 'imported_weapon_grip';
          const handScale = hand.getWorldScale(new T.Vector3());
          grip.scale.set(1 / handScale.x, 1 / handScale.y, 1 / handScale.z);
          const carried = imported.getWorldQuaternion(new T.Quaternion())
            .multiply(new T.Quaternion().setFromEuler(new T.Euler(0.42, 0, 0)));
          grip.quaternion.copy(hand.getWorldQuaternion(new T.Quaternion()).invert().multiply(carried));
          weapon.position.set(0, 0.08, 0.12);
          weapon.scale.setScalar(0.76);
          grip.add(weapon); hand.add(grip);
          imported.userData.equipmentType = normalizedType;
        }
        imported.userData.dispose = () => this.disposeModel(imported);
        return imported;
      }

      const root = this._createHumanFigure(normalizedType, false);
      return this._finalize(root, {
        modelType: 'human',
        subtype: normalizedType,
        requestedSubtype: requestedType,
        forwardAxis: '+Z',
        height: 4.25
      });
    }

    // -------------------------------------------------------------------------
    // 13. PUBLIC MODEL: MODULAR INDUSTRIAL PROPS
    // -------------------------------------------------------------------------
    createIndustrialProp(type) {
      const T = this._three();
      const normalizedType = String(type || 'crate').toLowerCase();
      const root = new T.Group();
      root.name = `industrial_prop_${normalizedType}`;
      // Extended prop families reuse these base materials. Allocate the full
      // palette, then release any entry that the selected prop did not use.
      const metal = this._material('industrial', { color: 0x617585 });
      const dark = this._material('darkMetal', { color: 0x24333d });
      const hazard = this._material('emissiveAmber', { emissiveIntensity: 0.7 });
      const screen = this._material('emissiveGreen', { emissiveIntensity: 0.92 });
      const warning = this._material('emissiveRed', { emissiveIntensity: 0.82 });

      if (normalizedType === 'console') {
        root.add(this._box(metal, { x: 2.2, y: 1.35, z: 0.82 }, { x: 0, y: 0.68, z: 0 }, 'console_body', true));
        const upper = this._box(dark, { x: 2.05, y: 1.2, z: 0.38 }, { x: 0, y: 1.58, z: -0.12 }, 'console_upper', true);
        upper.rotation.x = -0.35;
        root.add(upper);
        const display = this._box(screen, { x: 1.42, y: 0.62, z: 0.04 }, { x: 0, y: 1.62, z: 0.3 }, 'console_display');
        display.rotation.x = -0.35;
        root.add(display);
        for (let button = 0; button < 8; button++) {
          root.add(this._box(
            button % 3 === 0 ? warning : hazard,
            { x: 0.12, y: 0.05, z: 0.12 },
            { x: -0.62 + (button % 4) * 0.4, y: 1.17, z: 0.46 + Math.floor(button / 4) * 0.16 },
            `console_button_${button}`
          ));
        }
      } else if (normalizedType === 'generator') {
        root.add(this._box(metal, { x: 2.5, y: 2.4, z: 1.5 }, { x: 0, y: 1.2, z: 0 }, 'generator_chassis', true));
        for (let coil = -1; coil <= 1; coil += 2) {
          root.add(this._segment(
            dark,
            new T.Vector3(coil * 0.68, 0.5, 0.82),
            new T.Vector3(coil * 0.68, 2.02, 0.82),
            0.3,
            0.3,
            `generator_coil_${coil}`,
            14
          ));
          for (let ring = 0; ring < 6; ring++) {
            root.add(this._ring(
              hazard,
              0.34,
              0.035,
              { x: coil * 0.68, y: 0.64 + ring * 0.27, z: 0.82 },
              { x: 0, y: 0, z: 0 },
              `coil_ring_${coil}_${ring}`
            ));
          }
        }
        root.add(this._tube(
          dark,
          [
            { x: -0.68, y: 2.0, z: 0.78 },
            { x: 0, y: 2.62, z: 0.42 },
            { x: 0.68, y: 2.0, z: 0.78 }
          ],
          0.075,
          'generator_bridge_cable',
          18,
          7
        ));
      } else if (normalizedType === 'vent') {
        root.add(this._box(metal, { x: 2.4, y: 2.4, z: 0.22 }, { x: 0, y: 1.2, z: 0 }, 'vent_frame', true));
        root.add(this._box(dark, { x: 2.0, y: 2.0, z: 0.12 }, { x: 0, y: 1.2, z: 0.14 }, 'vent_void'));
        for (let slat = 0; slat < 8; slat++) {
          const blade = this._box(
            metal,
            { x: 1.88, y: 0.1, z: 0.18 },
            { x: 0, y: 0.38 + slat * 0.24, z: 0.28 },
            `vent_slat_${slat}`,
            true
          );
          blade.rotation.x = -0.32;
          root.add(blade);
        }
        this._addBolt(root, hazard, { x: -1.02, y: 0.2, z: 0.18 }, 0.07, 'vent_warning_fastener');
      } else if (normalizedType === 'pipe') {
        root.add(this._segment(
          metal,
          new T.Vector3(0, 0, 0),
          new T.Vector3(0, 3.2, 0),
          0.34,
          0.34,
          'main_pipe',
          16
        ));
        for (let collar = 0; collar < 5; collar++) {
          root.add(this._ring(
            dark,
            0.4,
            0.06,
            { x: 0, y: 0.35 + collar * 0.64, z: 0 },
            { x: Math.PI / 2, y: 0, z: 0 },
            `pipe_collar_${collar}`
          ));
        }
        root.add(this._segment(
          metal,
          new T.Vector3(0, 2.75, 0),
          new T.Vector3(1.45, 2.75, 0),
          0.25,
          0.25,
          'branch_pipe',
          14
        ));
        root.add(this._ring(hazard, 0.34, 0.05, { x: 1.22, y: 2.75, z: 0 }, { x: 0, y: Math.PI / 2, z: 0 }, 'branch_warning_collar'));
      } else if (normalizedType === 'door') {
        root.add(this._box(metal, { x: 3.6, y: 4.8, z: 0.42 }, { x: 0, y: 2.4, z: 0 }, 'door_panel', true));
        root.add(this._box(dark, { x: 4.2, y: 0.38, z: 0.68 }, { x: 0, y: 4.62, z: 0 }, 'door_header', true));
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._box(dark, { x: 0.38, y: 4.8, z: 0.68 }, { x: side * 1.92, y: 2.4, z: 0 }, `door_rail_${side}`, true));
        }
        root.add(this._box(hazard, { x: 0.16, y: 3.6, z: 0.06 }, { x: 0, y: 2.4, z: 0.25 }, 'door_hazard_stripe'));
        root.add(this._box(screen, { x: 0.32, y: 0.48, z: 0.08 }, { x: 1.45, y: 2.42, z: 0.3 }, 'door_access_panel', true));
      } else if (normalizedType === 'barrel') {
        root.add(this._segment(
          metal,
          new T.Vector3(0, 0.1, 0),
          new T.Vector3(0, 1.9, 0),
          0.62,
          0.62,
          'barrel_body',
          18
        ));
        for (let band = 0; band < 3; band++) {
          root.add(this._ring(
            dark,
            0.66,
            0.055,
            { x: 0, y: 0.28 + band * 0.72, z: 0 },
            { x: Math.PI / 2, y: 0, z: 0 },
            `barrel_band_${band}`
          ));
        }
        root.add(this._box(warning, { x: 0.42, y: 0.42, z: 0.04 }, { x: 0, y: 1.05, z: 0.63 }, 'hazard_label'));
      } else if (normalizedType === 'lamp') {
        root.add(this._box(dark, { x: 1.5, y: 0.22, z: 0.52 }, { x: 0, y: 0.12, z: 0 }, 'lamp_housing', true));
        root.add(this._box(screen, { x: 1.18, y: 0.06, z: 0.32 }, { x: 0, y: 0.02, z: 0 }, 'lamp_emitter'));
        const light = new T.PointLight(0x9dff7a, 1.4, 8);
        light.name = 'optional_prop_light';
        light.position.set(0, -0.12, 0);
      } else if (normalizedType === 'ration' || normalizedType === 'labration') {
        // Canon Alien (1979) : Ration nutritive sous blister hermétique stérile Weyland-Yutani
        const rationPack = this._material('synthetic', { color: 0x94a3b8, roughness: 0.35, metalness: 0.25 });
        const rationLabel = this._material('emissiveAmber', { emissiveIntensity: 0.85 });
        root.add(this._box(rationPack, { x: 0.95, y: 0.32, z: 0.65 }, { x: 0, y: 0.16, z: 0 }, 'ration_chassis', true));
        root.add(this._box(dark, { x: 0.82, y: 0.08, z: 0.52 }, { x: 0, y: 0.34, z: 0 }, 'ration_seal_strip'));
        root.add(this._box(rationLabel, { x: 0.45, y: 0.02, z: 0.28 }, { x: 0, y: 0.33, z: 0.08 }, 'weyland_yutani_food_label'));
      } else if (normalizedType === 'cryopod') {
        // Chantier 15 : Caisson de stase cryogénique d'hypersommeil (Alien 1979 / Romulus)
        const glassMat = this._material('visorGlass', { color: 0x38bdf8, opacity: 0.45 });
        const chassis = this._material('synthetic', { color: 0xe2e8f0, roughness: 0.22, metalness: 0.4 });
        root.add(this._box(chassis, { x: 1.25, y: 0.45, z: 2.65 }, { x: 0, y: 0.22, z: 0 }, 'cryo_base', true));
        root.add(this._box(dark, { x: 1.05, y: 0.3, z: 2.45 }, { x: 0, y: 0.48, z: 0 }, 'cryo_interior'));
        root.add(this._box(glassMat, { x: 0.98, y: 0.32, z: 2.35 }, { x: 0, y: 0.72, z: 0 }, 'cryo_glass_lid'));
        root.add(this._ellipsoid(metal, { x: 0.35, y: 0.16, z: 0.95 }, { x: 0, y: 0.52, z: -0.1 }, 'sleeper_silhouette'));
        root.add(this._box(screen, { x: 0.42, y: 0.08, z: 0.25 }, { x: 0, y: 0.52, z: 1.15 }, 'cryo_vitals_screen'));
      } else if (normalizedType === 'blackgoo' || normalizedType === 'mutagen') {
        // Chantier 18 : Canister de fluide pathogène mutagène noir Z-01 (Prometheus / Romulus)
        const glass = this._material('visorGlass', { color: 0x1e293b, opacity: 0.65 });
        const blackLiquid = this._material('chitin', { color: 0x020617, roughness: 0.1, metalness: 0.9 });
        root.add(this._segment(metal, new T.Vector3(0, 0, 0), new T.Vector3(0, 0.2, 0), 0.3, 0.3, 'canister_base'));
        root.add(this._segment(glass, new T.Vector3(0, 0.2, 0), new T.Vector3(0, 1.2, 0), 0.26, 0.26, 'canister_glass'));
        root.add(this._segment(blackLiquid, new T.Vector3(0, 0.22, 0), new T.Vector3(0, 1.1, 0), 0.22, 0.22, 'canister_fluid'));
        root.add(this._segment(metal, new T.Vector3(0, 1.2, 0), new T.Vector3(0, 1.4, 0), 0.3, 0.3, 'canister_cap'));
        root.add(this._box(hazard, { x: 0.12, y: 0.18, z: 0.04 }, { x: 0, y: 0.7, z: 0.28 }, 'weyland_biohazard_label'));
      } else if (normalizedType === 'narcissus' || normalizedType === 'narcissus_dock') {
        // Chantier 25 : Quai d'amarrage de la navette Narcissus (Alien 1979)
        const frameMat = this._material('darkMetal', { color: 0x1e293b, roughness: 0.35 });
        const hatchMat = this._material('industrial', { color: 0x64748b, roughness: 0.28 });
        const thrusterMat = this._material('emissiveBlue', { emissiveIntensity: 0.95 });
        root.add(this._box(frameMat, { x: 4.2, y: 4.8, z: 1.2 }, { x: 0, y: 2.4, z: 0 }, 'narcissus_dock_frame', true));
        root.add(this._box(hatchMat, { x: 3.2, y: 3.8, z: 0.4 }, { x: 0, y: 2.2, z: 0.4 }, 'narcissus_hatch_door', true));
        root.add(this._box(hazard, { x: 3.0, y: 0.22, z: 0.08 }, { x: 0, y: 4.0, z: 0.65 }, 'narcissus_hazard_stripe'));
        root.add(this._box(screen, { x: 0.8, y: 0.5, z: 0.1 }, { x: 1.2, y: 2.2, z: 0.68 }, 'narcissus_launch_screen'));
        root.add(this._box(warning, { x: 0.2, y: 0.2, z: 0.12 }, { x: -1.1, y: 2.2, z: 0.68 }, 'narcissus_abort_lever'));
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._ring(thrusterMat, 0.4, 0.08, { x: side * 1.6, y: 4.5, z: 0.2 }, { x: 0, y: 0, z: 0 }, `narcissus_thruster_${side}`));
        }
      } else if (normalizedType === 'ultrasonic') {
        // Chantier 26 : Émetteur de sonde ultrasonique anti-xénomorphe Weyland-Yutani
        const pylonMat = this._material('darkMetal', { color: 0x0f172a, roughness: 0.3 });
        const strobeBlue = this._material('emissiveBlue', { color: 0x38bdf8, emissiveIntensity: 2.2 });
        root.add(this._box(metal, { x: 1.2, y: 0.28, z: 1.2 }, { x: 0, y: 0.14, z: 0 }, 'pylon_base', true));
        root.add(this._segment(pylonMat, new T.Vector3(0, 0.2, 0), new T.Vector3(0, 1.6, 0), 0.18, 0.14, 'pylon_mast', 18));
        root.add(this._ellipsoid(strobeBlue, { x: 0.26, y: 0.26, z: 0.26 }, { x: 0, y: 1.75, z: 0 }, 'ultrasonic_strobe', 20));
        root.add(this._ring(hazard, 0.35, 0.04, { x: 0, y: 1.4, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'waveguide_collar'));
        for (let leg = 0; leg < 3; leg++) {
          const legAngle = (leg / 3) * Math.PI * 2;
          const legMesh = this._segment(pylonMat, new T.Vector3(0, 0.4, 0), new T.Vector3(Math.cos(legAngle) * 0.75, 0, Math.sin(legAngle) * 0.75), 0.05, 0.05, `pylon_strut_${leg}`, 12);
          root.add(legMesh);
        }
      } else if (normalizedType === 'medikit') {
        // Chantier 28 : Station médicale murale Medikit & seringues de stimulants Weyland-Yutani
        const cabinetMat = this._material('synthetic', { color: 0xf1f5f9, roughness: 0.24, metalness: 0.3 });
        const medCrossMat = this._material('emissiveGreen', { color: 0x22c55e, emissiveIntensity: 1.4 });
        root.add(this._box(cabinetMat, { x: 1.2, y: 1.5, z: 0.4 }, { x: 0, y: 0.75, z: 0 }, 'medikit_cabinet', true));
        root.add(this._box(medCrossMat, { x: 0.5, y: 0.14, z: 0.05 }, { x: 0, y: 0.9, z: 0.22 }, 'medikit_cross_h'));
        root.add(this._box(medCrossMat, { x: 0.14, y: 0.5, z: 0.05 }, { x: 0, y: 0.9, z: 0.22 }, 'medikit_cross_v'));
        const hypoMat = this._material('emissiveAmber', { color: 0xf59e0b, emissiveIntensity: 0.9 });
        for (let i = -1; i <= 1; i++) {
          root.add(this._segment(hypoMat, new T.Vector3(i * 0.24, 0.3, 0.12), new T.Vector3(i * 0.24, 0.58, 0.12), 0.04, 0.04, `hypospray_${i}`, 10));
        }
        root.add(this._box(screen, { x: 0.6, y: 0.2, z: 0.04 }, { x: 0, y: 0.35, z: 0.21 }, 'medikit_vitals_screen'));
      } else if (normalizedType === 'fuel_tank' || normalizedType === 'fueltank') {
        // Chantier 30 : Réservoir de carburant cryogénique de raffinerie (détonation en chaîne)
        const tankMat = this._material('industrial', { color: 0x475569, roughness: 0.32, metalness: 0.85 });
        const frostMat = this._material('visorGlass', { color: 0x38bdf8, opacity: 0.75 });
        root.add(this._segment(tankMat, new T.Vector3(0, 0, 0), new T.Vector3(0, 3.4, 0), 1.15, 1.15, 'fuel_tank_body', 28));
        root.add(this._ellipsoid(tankMat, { x: 1.15, y: 0.45, z: 1.15 }, { x: 0, y: 3.4, z: 0 }, 'fuel_tank_cap_top', 24));
        root.add(this._ellipsoid(tankMat, { x: 1.15, y: 0.45, z: 1.15 }, { x: 0, y: 0, z: 0 }, 'fuel_tank_cap_bottom', 24));
        for (let band = 0; band < 4; band++) {
          root.add(this._ring(dark, 1.22, 0.065, { x: 0, y: 0.65 + band * 0.72, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, `tank_reinforce_${band}`));
        }
        root.add(this._box(frostMat, { x: 0.3, y: 0.45, z: 0.3 }, { x: 0, y: 3.75, z: 0 }, 'cryo_vent_valve'));
        root.add(this._box(warning, { x: 0.6, y: 0.6, z: 0.06 }, { x: 0, y: 1.8, z: 1.18 }, 'flammable_hazard_plaque'));
      } else if (normalizedType === 'water_pump' || normalizedType === 'flood_grate') {
        // Chantier 31 : Station de pompage hydraulique et vanne Sub-Level 3 (Hadley's Hope / Aliens 1986)
        const pumpMetal = this._material('darkMetal', { color: 0x1e293b, roughness: 0.45, metalness: 0.7 });
        const pipeCopper = this._material('industrial', { color: 0xb45309, roughness: 0.35, metalness: 0.85 });
        root.add(this._box(pumpMetal, { x: 2.2, y: 0.15, z: 2.2 }, { x: 0, y: 0.08, z: 0 }, 'sump_grate', true));
        root.add(this._segment(pumpMetal, new T.Vector3(0, 0.15, 0), new T.Vector3(0, 2.2, 0), 0.55, 0.45, 'pump_cylinder', 20));
        root.add(this._segment(pipeCopper, new T.Vector3(0, 1.6, 0), new T.Vector3(1.2, 1.6, 0), 0.22, 0.22, 'intake_pipe_h', 16));
        root.add(this._ring(dark, 0.62, 0.06, { x: 0, y: 1.1, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'pump_collar'));
        root.add(this._box(screen, { x: 0.35, y: 0.25, z: 0.08 }, { x: 0, y: 1.5, z: 0.52 }, 'pump_gauge'));
      } else if (normalizedType === 'terminal' || normalizedType === 'seegson_terminal') {
        // Chantier 33 & 40 : Terminal mural Seegson / Weyland-Yutani 9 pouces CRT (Alien: Isolation)
        const casing = this._material('synthetic', { color: 0x94a3b8, roughness: 0.42, metalness: 0.2 });
        const crtAmber = this._material('emissiveAmber', { color: 0xf59e0b, emissiveIntensity: 1.6 });
        root.add(this._box(casing, { x: 1.1, y: 1.4, z: 0.35 }, { x: 0, y: 0.7, z: 0 }, 'terminal_housing', true));
        root.add(this._box(crtAmber, { x: 0.68, y: 0.52, z: 0.06 }, { x: 0, y: 0.92, z: 0.18 }, 'crt_screen_9inch'));
        root.add(this._box(dark, { x: 0.8, y: 0.28, z: 0.22 }, { x: 0, y: 0.28, z: 0.22 }, 'keyboard_bevel', true));
        root.add(this._box(warning, { x: 0.2, y: 0.04, z: 0.05 }, { x: 0, y: 0.55, z: 0.18 }, 'cassette_drive_slot'));
      } else if (normalizedType === 'camera' || normalizedType === 'security_camera') {
        // Chantier 33 : Caméra de sécurité motorisée CRT Weyland-Yutani (Alien: Isolation)
        const camMetal = this._material('darkMetal', { color: 0x0f172a, roughness: 0.3 });
        const lensLed = this._material('emissiveGreen', { color: 0x22c55e, emissiveIntensity: 2.0 });
        root.add(this._box(camMetal, { x: 0.3, y: 0.4, z: 0.18 }, { x: 0, y: 0.2, z: 0 }, 'camera_wall_bracket', true));
        root.add(this._segment(camMetal, new T.Vector3(0, 0.2, 0.1), new T.Vector3(0, 0.2, 0.5), 0.06, 0.06, 'camera_swivel_arm', 10));
        root.add(this._box(camMetal, { x: 0.28, y: 0.32, z: 0.75 }, { x: 0, y: 0.2, z: 0.85 }, 'camera_casing', true));
        root.add(this._ring(dark, 0.16, 0.03, { x: 0, y: 0.2, z: 1.24 }, { x: 0, y: 0, z: 0 }, 'camera_lens_hood'));
        root.add(this._ellipsoid(lensLed, { x: 0.08, y: 0.08, z: 0.05 }, { x: 0, y: 0.2, z: 1.25 }, 'camera_starlight_sensor', 12));
      } else if (normalizedType === 'trap' || normalizedType === 'tripwire_trap') {
        // Chantier 35 : Piège au sol à harpons pneumatiques et filet électrifié (Alien 3 / Isolation)
        const baseMat = this._material('darkMetal', { color: 0x18181b, roughness: 0.4, metalness: 0.8 });
        const laserMat = this._material('emissiveRed', { color: 0xef4444, emissiveIntensity: 2.5 });
        root.add(this._box(baseMat, { x: 1.8, y: 0.08, z: 0.45 }, { x: 0, y: 0.04, z: 0 }, 'trap_base_plate', true));
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._segment(baseMat, new T.Vector3(side * 0.78, 0.08, 0), new T.Vector3(side * 0.78, 0.45, 0), 0.06, 0.045, `harpoon_post_${side}`, 10));
          root.add(this._coneAlong(dark, { x: side * 0.78, y: 0.45, z: 0 }, { x: 0, y: 1, z: 0 }, 0.05, 0.16, `harpoon_spike_${side}`, 6));
        }
        root.add(this._segment(laserMat, new T.Vector3(-0.75, 0.25, 0), new T.Vector3(0.75, 0.25, 0), 0.015, 0.015, 'tripwire_laser_beam', 8));
      } else if (normalizedType === 'ceiling_cocoon' || normalizedType === 'suspended_cocoon') {
        // Chantier 39 : Cocon organique suspendu aux poutrelles du plafond (Aliens 1986)
        const resinMat = this._material('resin', { color: 0x2e1065, opacity: 0.94, roughness: 0.35 });
        const hostBone = this._material('bone', { color: 0x94a3b8, opacity: 0.45 });
        root.add(this._segment(resinMat, new T.Vector3(0, 3.2, 0), new T.Vector3(0, 1.8, 0), 0.14, 0.48, 'cocoon_stem', 14));
        root.add(this._ellipsoid(resinMat, { x: 0.58, y: 0.92, z: 0.55 }, { x: 0, y: 1.1, z: 0 }, 'cocoon_main_body', 22));
        root.add(this._ellipsoid(hostBone, { x: 0.28, y: 0.45, z: 0.26 }, { x: 0, y: 1.15, z: 0.12 }, 'cocoon_embedded_host', 14));
        for (let w = 0; w < 6; w++) {
          const wAngle = (w / 6) * Math.PI * 2;
          root.add(this._tube(resinMat, [
            { x: Math.cos(wAngle) * 0.4, y: 1.2, z: Math.sin(wAngle) * 0.4 },
            { x: Math.cos(wAngle) * 0.8, y: 2.2, z: Math.sin(wAngle) * 0.8 },
            { x: Math.cos(wAngle) * 0.6, y: 3.2, z: Math.sin(wAngle) * 0.6 }
          ], 0.035, `web_strand_${w}`, 12, 6));
        }
      } else if (normalizedType === 'airlock_decompression' || normalizedType === 'decompression_airlock') {
        // Chantier 42 : Sas de Dépressurisation d'Urgence & Éjection Spatiale (Alien 1979 / Romulus)
        const frameMat = this._material('darkMetal', { color: 0x1e293b, roughness: 0.38, metalness: 0.85 });
        const doorMat = this._material('industrial', { color: 0x475569, roughness: 0.45, metalness: 0.75 });
        const warningMat = this._material('emissiveAmber', { color: 0xf59e0b, emissiveIntensity: 1.5 });
        const voidGlass = this._material('glass', { color: 0x0284c7, opacity: 0.45, roughness: 0.1 });
        const handleRed = this._material('emissiveRed', { color: 0xef4444, emissiveIntensity: 2.2 });
        // Cadre de sas lourd
        root.add(this._box(frameMat, { x: 3.4, y: 4.2, z: 0.6 }, { x: 0, y: 2.1, z: 0 }, 'airlock_outer_frame', true));
        // Battants étanches
        root.add(this._box(doorMat, { x: 2.8, y: 3.6, z: 0.2 }, { x: 0, y: 1.9, z: 0.1 }, 'airlock_inner_door', true));
        // Hublot blindé circulaire donnant sur le vide spatial étoilé
        root.add(this._ring(frameMat, 0.95, 0.14, { x: 0, y: 2.4, z: 0.28 }, { x: 0, y: 0, z: 0 }, 'airlock_porthole_frame'));
        root.add(this._ellipsoid(voidGlass, { x: 0.9, y: 0.9, z: 0.08 }, { x: 0, y: 2.4, z: 0.25 }, 'airlock_porthole_glass', 24));
        // Poignée manuelle rouge d'urgence "EMERGENCY AIR DUMP"
        root.add(this._box(handleRed, { x: 0.14, y: 0.55, z: 0.22 }, { x: 1.25, y: 2.0, z: 0.35 }, 'airlock_dump_lever'));
        root.add(this._box(warningMat, { x: 0.8, y: 0.2, z: 0.04 }, { x: 0, y: 3.8, z: 0.32 }, 'airlock_hazard_header'));
      } else if (normalizedType === 'decon_shower' || normalizedType === 'decon_arch') {
        // Chantier 43 : Sas Décontaminant avec Douches Chimiques (Alien 3 / Isolation)
        const archMetal = this._material('industrial', { color: 0x64748b, roughness: 0.35, metalness: 0.65 });
        const nozzleMat = this._material('darkMetal', { color: 0x0f172a, roughness: 0.3 });
        const sensorBlue = this._material('emissiveGreen', { color: 0x38bdf8, emissiveIntensity: 2.0 });
        // Portique d'arche de décontamination
        root.add(this._box(archMetal, { x: 0.4, y: 3.8, z: 0.4 }, { x: -1.6, y: 1.9, z: 0 }, 'arch_post_left', true));
        root.add(this._box(archMetal, { x: 0.4, y: 3.8, z: 0.4 }, { x: 1.6, y: 1.9, z: 0 }, 'arch_post_right', true));
        root.add(this._box(archMetal, { x: 3.6, y: 0.45, z: 0.45 }, { x: 0, y: 3.8, z: 0 }, 'arch_crossbeam', true));
        // 4 Buses de pulvérisation haute pression orientées vers le bas
        for (let b = -1; b <= 1; b += 0.66) {
          root.add(this._coneAlong(nozzleMat, { x: b * 1.1, y: 3.55, z: 0 }, { x: 0, y: -1, z: 0 }, 0.08, 0.22, `spray_nozzle_${Math.round(b*10)}`, 10));
        }
        // Détecteur de passage optique
        root.add(this._ellipsoid(sensorBlue, { x: 0.1, y: 0.06, z: 0.12 }, { x: 0, y: 3.5, z: 0.25 }, 'decon_motion_sensor', 12));
      } else if (normalizedType === 'subfloor_grate' || normalizedType === 'floor_grate_ambush') {
        // Chantier 49 : Éventration de Planchers & Grilles de Sol (Aliens 1986 / Alien 3)
        const grateMetal = this._material('darkMetal', { color: 0x27272a, roughness: 0.6, metalness: 0.7 });
        const voidShadow = this._material('darkMetal', { color: 0x09090b, roughness: 0.95 });
        const rustAccent = this._material('industrial', { color: 0x78350f, roughness: 0.8 });
        // Fosse technique sous le plancher
        root.add(this._box(voidShadow, { x: 2.4, y: 0.6, z: 2.4 }, { x: 0, y: -0.3, z: 0 }, 'subfloor_pit_void'));
        // Grille à caillebotis métallique perforé
        root.add(this._box(grateMetal, { x: 2.5, y: 0.08, z: 2.5 }, { x: 0, y: 0.04, z: 0 }, 'floor_grate_frame', true));
        for (let s = -4; s <= 4; s++) {
          root.add(this._box(s % 2 === 0 ? grateMetal : rustAccent, { x: 2.4, y: 0.05, z: 0.1 }, { x: 0, y: 0.06, z: s * 0.24 }, `grate_slat_${s}`));
        }
      } else if (normalizedType === 'bisected_android' || normalizedType === 'crawling_synth') {
        // Chantier 47 : Demi-corps de Synthétique Décapité Rampant (Alien 1979 / Aliens 1986)
        const synthSkin = this._material('skin', { color: 0xe2e8f0, roughness: 0.35 });
        const chassisMat = this._material('darkMetal', { color: 0x334155, roughness: 0.45, metalness: 0.65 });
        const milkMat = new T.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.88 });
        const sparkMat = this._material('emissiveGreen', { color: 0x67e8f9, emissiveIntensity: 2.2 });
        // Torse incliné rampant au sol
        const torsoGroup = new T.Group();
        torsoGroup.name = 'bisected_torso_assembly';
        torsoGroup.rotation.x = 0.55;
        torsoGroup.position.set(0, 0.25, 0);
        torsoGroup.add(this._ellipsoid(synthSkin, { x: 0.5, y: 0.65, z: 0.3 }, { x: 0, y: 0.4, z: 0 }, 'synth_upper_torso', 16));
        torsoGroup.add(this._segment(chassisMat, new T.Vector3(0, 0.2, -0.15), new T.Vector3(0, 0.7, -0.15), 0.06, 0.05, 'severed_spine', 10));
        // Bras rampant vers l'avant
        torsoGroup.add(this._segment(synthSkin, new T.Vector3(-0.45, 0.6, 0), new T.Vector3(-0.65, 0.15, 0.55), 0.1, 0.08, 'crawl_arm_left', 8));
        torsoGroup.add(this._segment(synthSkin, new T.Vector3(0.45, 0.6, 0), new T.Vector3(0.65, 0.15, 0.55), 0.1, 0.08, 'crawl_arm_right', 8));
        // Câbles dénudés et étincelles au niveau de la taille sectionnée
        for (let c = 0; c < 4; c++) {
          torsoGroup.add(this._coneAlong(sparkMat, { x: (c - 1.5) * 0.18, y: 0.05, z: 0 }, { x: 0, y: -1, z: 0 }, 0.04, 0.18, `severed_cable_${c}`, 6));
        }
        root.add(torsoGroup);
        // Flaque de liquide laiteux synthétique blanc répandue au sol
        const milkPool = new T.Mesh(new T.CircleGeometry(1.4, 20), milkMat);
        milkPool.rotation.x = -Math.PI / 2;
        milkPool.position.y = 0.02;
        root.add(milkPool);
      } else if (normalizedType === 'spore_pod' || normalizedType === 'black_pathogen_spore_pod') {
        // Chantier 51 : Sac de spores fongiques pathogènes du Néomorphe (Alien: Covenant 2017)
        const podMat = this._material('chitin', { color: 0x090d16, roughness: 0.65, metalness: 0.2 });
        const orificeMat = this._material('emissiveGreen', { color: 0x14532d, emissive: 0x22c55e, emissiveIntensity: 0.6 });
        const sporeTendril = this._material('resin', { color: 0x1f2937, opacity: 0.95 });
        // Corps bulbeux asymétrique du sac
        root.add(this._ellipsoid(podMat, { x: 0.65, y: 0.75, z: 0.62 }, { x: 0, y: 0.6, z: 0 }, 'spore_pod_bulb', 20));
        // Renflements fongiques secondaires
        root.add(this._ellipsoid(podMat, { x: 0.38, y: 0.42, z: 0.35 }, { x: 0.35, y: 0.45, z: 0.2 }, 'spore_nodule_1', 14));
        root.add(this._ellipsoid(podMat, { x: 0.32, y: 0.38, z: 0.32 }, { x: -0.3, y: 0.4, z: -0.18 }, 'spore_nodule_2', 14));
        // Orifice central d'expulsion pulvérulente
        root.add(this._ring(orificeMat, 0.26, 0.08, { x: 0, y: 1.25, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'spore_expulsion_orifice'));
        root.add(this._ellipsoid(orificeMat, { x: 0.16, y: 0.08, z: 0.16 }, { x: 0, y: 1.2, z: 0 }, 'spore_powder_core', 12));
        // Vrilles racinaires d'ancrage au sol
        for (let r = 0; r < 6; r++) {
          const rAngle = (r / 6) * Math.PI * 2;
          root.add(this._tube(
            sporeTendril,
            [
              { x: Math.cos(rAngle) * 0.45, y: 0.35, z: Math.sin(rAngle) * 0.45 },
              { x: Math.cos(rAngle) * 0.95, y: 0.12, z: Math.sin(rAngle) * 0.95 },
              { x: Math.cos(rAngle) * 1.35, y: 0.02, z: Math.sin(rAngle) * 1.35 }
            ],
            0.05,
            `spore_root_${r}`,
            12,
            6
          ));
        }
      } else if (normalizedType === 'steam_pipe_valve' || normalizedType === 'steam_vent') {
        // Chantier 54 : Conduits de Vapeur Industriels Surchauffée & Vannes de Décharge (Alien 1979 / Aliens 1986)
        const pipeMat = this._material('darkMetal', { color: 0x334155, roughness: 0.38, metalness: 0.85 });
        const valveWheel = this._material('emissiveRed', { color: 0xdc2626, emissiveIntensity: 0.8 });
        const gaugeMat = this._material('emissiveGreen', { color: 0x22c55e, emissiveIntensity: 1.8 });
        // Conduite verticale haute pression
        root.add(this._segment(pipeMat, new T.Vector3(0, 0, 0), new T.Vector3(0, 4.2, 0), 0.28, 0.28, 'steam_main_riser', 16));
        // Manchon de décharge horizontal orienté vers la pièce
        root.add(this._segment(pipeMat, new T.Vector3(0, 2.8, 0), new T.Vector3(0, 2.8, 1.1), 0.22, 0.18, 'steam_exhaust_nozzle', 14));
        // Vanne manuelle volante circulaire rouge vif
        const wheelGroup = new T.Group();
        wheelGroup.name = 'steam_valve_wheel_assembly';
        wheelGroup.position.set(0.32, 2.4, 0);
        wheelGroup.rotation.z = Math.PI / 2;
        wheelGroup.add(this._ring(valveWheel, 0.38, 0.045, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 'valve_rim'));
        for (let spoke = 0; spoke < 4; spoke++) {
          const sAngle = spoke * (Math.PI / 2);
          wheelGroup.add(this._segment(valveWheel, new T.Vector3(0, 0, 0), new T.Vector3(Math.cos(sAngle) * 0.35, Math.sin(sAngle) * 0.35, 0), 0.035, 0.035, `spoke_${spoke}`, 6));
        }
        root.add(wheelGroup);
        // Manomètre circulaire rétro à aiguille
        root.add(this._ellipsoid(gaugeMat, { x: 0.18, y: 0.18, z: 0.06 }, { x: 0, y: 3.4, z: 0.32 }, 'pressure_gauge', 14));
      } else if (normalizedType === 'narcissus_shuttle' || normalizedType === 'shuttle_narcissus') {
        // Chantier 55 : Navette de Sauvetage Narcissus de classe Nostromo (Alien 1979)
        const hullMat = this._material('synthetic', { color: 0xd4d4d8, roughness: 0.32, metalness: 0.45 });
        const hullDark = this._material('darkMetal', { color: 0x27272a, roughness: 0.4, metalness: 0.75 });
        const canopyGlass = this._material('visorGlass', { color: 0x0284c7, opacity: 0.65 });
        const thrusterBurn = this._material('emissiveAmber', { color: 0xf97316, emissiveIntensity: 2.2 });
        // Corps cunéiforme principal de la Narcissus (forme iconique de fer à repasser spatial d'Alien 1979)
        root.add(this._box(hullMat, { x: 5.5, y: 2.8, z: 8.2 }, { x: 0, y: 1.6, z: 0 }, 'narcissus_hull_main', true));
        // Nez avant profilé incliné
        root.add(this._box(hullMat, { x: 4.6, y: 2.2, z: 3.4 }, { x: 0, y: 1.4, z: 4.8 }, 'narcissus_bow', true));
        // Hublot de cockpit panoramique supérieur
        root.add(this._box(canopyGlass, { x: 3.2, y: 0.95, z: 2.2 }, { x: 0, y: 2.85, z: 3.6 }, 'cockpit_windshield'));
        // Tuyères de propulsion jumelées à l'arrière
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._segment(hullDark, new T.Vector3(side * 1.8, 1.6, -4.1), new T.Vector3(side * 1.8, 1.6, -5.6), 0.75, 0.88, `thruster_nozzle_${side}`, 18));
          root.add(this._ellipsoid(thrusterBurn, { x: 0.6, y: 0.6, z: 0.2 }, { x: side * 1.8, y: 1.6, z: -5.55 }, `thruster_flare_${side}`, 16));
        }
        // Sas d'accès latéral avec rampe
        root.add(this._box(hullDark, { x: 0.3, y: 2.2, z: 1.8 }, { x: 2.8, y: 1.3, z: 0.5 }, 'airlock_side_door', true));
        root.add(this._box(warning, { x: 0.08, y: 0.25, z: 1.5 }, { x: 2.9, y: 2.3, z: 0.5 }, 'airlock_hazard_stripe'));
      } else if (normalizedType === 'ground_cryo_mist' || normalizedType === 'cryo_mist') {
        // Chantier 60 : Nappe de Brume Cryogénique au Ras du Sol (Alien 1979)
        const mistMat = new T.MeshStandardMaterial({
          color: 0xe2e8f0,
          roughness: 0.1,
          metalness: 0.05,
          transparent: true,
          opacity: 0.38
        });
        root.add(this._box(mistMat, { x: 14.0, y: 0.45, z: 14.0 }, { x: 0, y: 0.22, z: 0 }, 'cryo_mist_volume'));
        for (let disk = 0; disk < 4; disk++) {
          const dAngle = (disk / 4) * Math.PI * 2;
          root.add(this._ellipsoid(mistMat, { x: 4.5, y: 0.3, z: 4.5 }, { x: Math.cos(dAngle) * 3.5, y: 0.18, z: Math.sin(dAngle) * 3.5 }, `mist_puff_${disk}`, 14));
        }
      } else if (normalizedType === 'emp_grenade_projectile' || normalizedType === 'emp_grenade') {
        // Chantier 57 : Grenade à Impulsion Magnétique Polarisée (Aliens: Dark Descent)
        const empBody = this._material('darkMetal', { color: 0x1e293b, roughness: 0.3, metalness: 0.85 });
        const empGlow = this._material('emissiveGreen', { color: 0x38bdf8, emissiveIntensity: 3.2 });
        root.add(this._segment(empBody, new T.Vector3(0, 0, -0.3), new T.Vector3(0, 0, 0.3), 0.12, 0.12, 'emp_canister_body', 12));
        root.add(this._ring(empGlow, 0.14, 0.025, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 'emp_pulse_ring_center'));
        root.add(this._ellipsoid(empGlow, { x: 0.09, y: 0.09, z: 0.09 }, { x: 0, y: 0, z: 0.32 }, 'emp_emitter_lens', 12));
      } else if (normalizedType === 'sealed_hydraulic_door' || normalizedType === 'sealed_door') {
        // Chantier 58 : Porte Hydraulique Scellée par Barres de Renfort (Alien: Isolation / Aliens)
        const doorPanel = this._material('darkMetal', { color: 0x18181b, roughness: 0.5, metalness: 0.75 });
        const sealBeam = this._material('industrial', { color: 0xeab308, roughness: 0.4, metalness: 0.6 }); // Barres jaune de renfort
        const pistonMetal = this._material('industrial', { color: 0x94a3b8, roughness: 0.25, metalness: 0.9 });
        root.add(this._box(doorPanel, { x: 3.8, y: 4.6, z: 0.55 }, { x: 0, y: 2.3, z: 0 }, 'sealed_door_slab', true));
        // 2 Barres transversales en acier trempé barrant la porte
        root.add(this._box(sealBeam, { x: 4.4, y: 0.32, z: 0.22 }, { x: 0, y: 1.8, z: 0.34 }, 'lock_bar_lower', true));
        root.add(this._box(sealBeam, { x: 4.4, y: 0.32, z: 0.22 }, { x: 0, y: 3.2, z: 0.34 }, 'lock_bar_upper', true));
        // Vérin hydraulique central renforcé sous pression
        root.add(this._segment(pistonMetal, new T.Vector3(0, 1.2, 0.38), new T.Vector3(0, 3.8, 0.38), 0.12, 0.12, 'hydraulic_reinforcement_ram', 12));
      } else if (normalizedType === 'swarmer_pack' || normalizedType === 'micro_morphs') {
        // Chantier 62 : Nuée de Xénomorphes Nains "Swarmers" (Marvel Comics 2022: Alien: Icarus)
        const swarmerChitin = this._material('chitin', { color: 0x090d16, roughness: 0.18, metalness: 0.62 });
        const swarmerBone = this._material('bone', { color: 0xe2e8f0, roughness: 0.3 });
        const offsets = [
          { x: 0, z: 0, rotY: 0 },
          { x: -0.45, z: 0.35, rotY: 0.4 },
          { x: 0.42, z: -0.28, rotY: -0.35 },
          { x: -0.32, z: -0.42, rotY: 0.8 },
          { x: 0.38, z: 0.46, rotY: -0.6 }
        ];
        offsets.forEach((o, idx) => {
          const mini = new T.Group();
          mini.name = `swarmer_unit_${idx}`;
          mini.position.set(o.x, 0, o.z);
          mini.rotation.y = o.rotY;
          // Mini-corps allongé
          mini.add(this._ellipsoid(swarmerChitin, { x: 0.12, y: 0.1, z: 0.28 }, { x: 0, y: 0.14, z: 0 }, `swarmer_torso_${idx}`, 10));
          // Mini-crâne caréné
          mini.add(this._ellipsoid(swarmerChitin, { x: 0.08, y: 0.08, z: 0.24 }, { x: 0, y: 0.2, z: 0.18 }, `swarmer_head_${idx}`, 12));
          // Mini-mâchoire à crochets
          mini.add(this._coneAlong(swarmerBone, { x: 0, y: 0.16, z: 0.32 }, { x: 0, y: -0.1, z: 1 }, 0.04, 0.12, `swarmer_jaw_${idx}`, 6));
          // 4 Pattes arachnéennes arquées
          for (let leg = 0; leg < 4; leg++) {
            const side = leg % 2 === 0 ? -1 : 1;
            const fwd = leg < 2 ? 0.08 : -0.08;
            mini.add(this._segment(swarmerChitin, new T.Vector3(side * 0.08, 0.14, fwd), new T.Vector3(side * 0.24, 0.02, fwd + (leg < 2 ? 0.06 : -0.06)), 0.02, 0.012, `swarmer_leg_${idx}_${leg}`, 6));
          }
          // Mini-queue ondulante
          mini.add(this._tube(
            swarmerChitin,
            [
              { x: 0, y: 0.14, z: -0.22 },
              { x: (idx % 2 === 0 ? 0.08 : -0.08), y: 0.18, z: -0.42 },
              { x: 0, y: 0.24, z: -0.65 }
            ],
            0.022,
            `swarmer_tail_${idx}`,
            10,
            5
          ));
          root.add(mini);
        });
      } else if (normalizedType === 'napalm_barrel' || normalizedType === 'incinerator_barrel') {
        // Chantier 68 : Baril de Napalm USCM Inflammable (Aliens / Isolation)
        const barrelMat = this._material('industrial', { color: 0xc2410c, roughness: 0.35, metalness: 0.65 });
        const ringMat = this._material('darkMetal', { color: 0x18181b, roughness: 0.45, metalness: 0.85 });
        const hazardDecal = this._material('emissiveAmber', { color: 0xf59e0b, emissiveIntensity: 2.2 });
        // Fût cylindrique principal
        root.add(this._segment(barrelMat, new T.Vector3(0, 0, 0), new T.Vector3(0, 1.85, 0), 0.58, 0.58, 'napalm_barrel_drum', 22));
        // 3 Anneaux de renfort d'acier
        for (let ring = 0; ring < 3; ring++) {
          root.add(this._ring(ringMat, 0.61, 0.04, { x: 0, y: 0.35 + ring * 0.58, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, `napalm_ring_${ring}`));
        }
        // Couvercle étanche avec bouchon de décharge rouge
        root.add(this._segment(ringMat, new T.Vector3(0, 1.85, 0), new T.Vector3(0, 1.9, 0), 0.56, 0.56, 'barrel_lid', 20));
        root.add(this._segment(hazardDecal, new T.Vector3(0.24, 1.88, 0), new T.Vector3(0.24, 1.96, 0), 0.08, 0.08, 'napalm_bung_cap', 10));
        // Logo de danger inflammable
        root.add(this._box(hazardDecal, { x: 0.35, y: 0.35, z: 0.04 }, { x: 0, y: 0.95, z: 0.58 }, 'flammable_hazard_badge'));
      } else if (normalizedType === 'alpha_containment_cell' || normalizedType === 'alpha_tank') {
        // Chantier 66 : Cuve de Confinement Alpha & Sas Bio-Sécurité (Marvel Comics: Alien: Bloodlines)
        const frameMetal = this._material('darkMetal', { color: 0x0f172a, roughness: 0.35, metalness: 0.9 });
        const reinforcedGlass = this._material('glass', { color: 0x38bdf8, opacity: 0.36, transparent: true, roughness: 0.1 });
        const bioWarning = this._material('emissiveRed', { color: 0xdc2626, emissiveIntensity: 2.4 });
        const fluidResidue = this._material('resin', { color: 0x450a0a, opacity: 0.72, transparent: true });
        // Socle octogonal lourd
        root.add(this._segment(frameMetal, new T.Vector3(0, 0, 0), new T.Vector3(0, 0.6, 0), 2.2, 2.35, 'containment_base', 16));
        // Cylindre de verre acrylique blindé brisé
        root.add(this._segment(reinforcedGlass, new T.Vector3(0, 0.6, 0), new T.Vector3(0, 4.2, 0), 1.85, 1.85, 'acrylic_tank_shattered', 24));
        // Fluide d'incubation sombre résiduel au fond
        root.add(this._segment(fluidResidue, new T.Vector3(0, 0.6, 0), new T.Vector3(0, 1.25, 0), 1.8, 1.8, 'amniotic_black_fluid_residue', 20));
        // 4 Montants d'acier lourd et anneau supérieur
        for (let pillar = 0; pillar < 4; pillar++) {
          const pAngle = (pillar / 4) * Math.PI * 2;
          root.add(this._segment(frameMetal, new T.Vector3(Math.cos(pAngle) * 1.95, 0.6, Math.sin(pAngle) * 1.95), new T.Vector3(Math.cos(pAngle) * 1.95, 4.4, Math.sin(pAngle) * 1.95), 0.14, 0.14, `containment_pillar_${pillar}`, 12));
        }
        root.add(this._ring(frameMetal, 1.95, 0.12, { x: 0, y: 4.3, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'containment_top_collar'));
        // Dôme supérieur avec voyant biohazard
        root.add(this._ellipsoid(frameMetal, { x: 2.0, y: 0.8, z: 2.0 }, { x: 0, y: 4.6, z: 0 }, 'containment_dome', 20));
        root.add(this._ellipsoid(bioWarning, { x: 0.25, y: 0.25, z: 0.25 }, { x: 0, y: 5.1, z: 0 }, 'biohazard_strobe', 12));
        // Panneau d'avertissement Weyland-Yutani Alpha Specimen
        root.add(this._box(bioWarning, { x: 0.8, y: 0.35, z: 0.05 }, { x: 0, y: 0.35, z: 2.3 }, 'alpha_specimen_placard'));
      } else if (normalizedType === 'hive_creep_patch' || normalizedType === 'hive_creep') {
        // Chantier 64 : Expansion Vivante de la Toile de Ruche "Hive Creep" (Marvel Comics / Lore canon)
        const creepResin = this._material('resin', { color: 0x3b0712, roughness: 0.14, metalness: 0.45, opacity: 0.94 });
        const bioPustule = this._material('emissiveRed', { color: 0xb91c1c, emissiveIntensity: 1.4, roughness: 0.2 });
        // Nappe ondulante centrale de résine
        root.add(this._ellipsoid(creepResin, { x: 2.8, y: 0.18, z: 2.8 }, { x: 0, y: 0.09, z: 0 }, 'hive_creep_slab', 24));
        // Pustules biologiques et vésicules de biomasse pulsantes
        for (let p = 0; p < 7; p++) {
          const pAngle = (p / 7) * Math.PI * 2 + (p * 0.3);
          const pDist = 0.6 + (p % 3) * 0.65;
          root.add(this._ellipsoid(
            bioPustule,
            { x: 0.16 + (p % 3) * 0.08, y: 0.14 + (p % 2) * 0.06, z: 0.16 + (p % 3) * 0.08 },
            { x: Math.cos(pAngle) * pDist, y: 0.16, z: Math.sin(pAngle) * pDist },
            `creep_pustule_${p}`,
            14
          ));
        }
        // Filaments de résine tentaculaires rayonnants
        for (let f = 0; f < 8; f++) {
          const fAngle = (f / 8) * Math.PI * 2;
          root.add(this._tube(
            creepResin,
            [
              { x: Math.cos(fAngle) * 1.2, y: 0.12, z: Math.sin(fAngle) * 1.2 },
              { x: Math.cos(fAngle) * 2.2 + 0.15, y: 0.08, z: Math.sin(fAngle) * 2.2 - 0.1 },
              { x: Math.cos(fAngle) * 3.4, y: 0.02, z: Math.sin(fAngle) * 3.4 }
            ],
            0.065,
            `creep_tendril_${f}`,
            16,
            6
          ));
        }
      } else if (normalizedType === 'gantry_container' || normalizedType === 'rail_container' || normalizedType === 'suspended_container') {
        // Chantier 72 : Baie de Fret & Déambulateur de Fret "Powerloader Rail Gantry" (Aliens 1986)
        // Conteneur de fret 10t suspendu par 4 câbles en acier à un chariot de roulement sur rail de plafond
        const containerYellow = this._material('industrial', { color: 0xd97706, roughness: 0.45, metalness: 0.65 });
        const cableMetal = this._material('darkMetal', { color: 0x1e293b, roughness: 0.35, metalness: 0.9 });
        const hazardMark = this._material('emissiveAmber', { color: 0xf59e0b, emissiveIntensity: 1.8 });
        // Corps principal du conteneur lourd de 10t
        root.add(this._box(containerYellow, { x: 3.6, y: 2.4, z: 5.4 }, { x: 0, y: 3.4, z: 0 }, 'gantry_container_body', true));
        // Renforts angulaires et nervures d'armature
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._box(cableMetal, { x: 0.22, y: 2.48, z: 5.48 }, { x: side * 1.75, y: 3.4, z: 0 }, `container_side_rib_${side}`, true));
          root.add(this._box(cableMetal, { x: 3.68, y: 2.48, z: 0.22 }, { x: 0, y: 3.4, z: side * 2.65 }, `container_end_rib_${side}`, true));
        }
        // Plaques d'avertissement et jauge de charge 10000 KG
        root.add(this._box(hazardMark, { x: 1.2, y: 0.4, z: 0.08 }, { x: 0, y: 3.6, z: 2.74 }, 'container_payload_stencil'));
        root.add(this._box(hazardMark, { x: 1.2, y: 0.4, z: 0.08 }, { x: 0, y: 3.6, z: -2.74 }, 'container_payload_stencil_back'));
        // 4 Câbles d'acier de levage suspendus aux poutres supérieures
        const cableCorners = [
          { x: -1.6, z: -2.5 },
          { x: 1.6, z: -2.5 },
          { x: -1.6, z: 2.5 },
          { x: 1.6, z: 2.5 }
        ];
        cableCorners.forEach((corner, idx) => {
          root.add(this._ring(cableMetal, 0.22, 0.04, { x: corner.x, y: 4.65, z: corner.z }, { x: 0, y: 0, z: 0 }, `gantry_cable_ring_${idx}`));
          root.add(this._segment(cableMetal, new T.Vector3(corner.x, 4.7, corner.z), new T.Vector3(corner.x, 8.2, corner.z), 0.045, 0.045, `gantry_steel_cable_${idx}`, 8));
        });
        // Chariot de roulement sur rail supérieur
        root.add(this._box(cableMetal, { x: 4.2, y: 0.45, z: 6.2 }, { x: 0, y: 8.35, z: 0 }, 'gantry_trolley_chassis', true));
      } else if (normalizedType === 'freon_pipe' || normalizedType === 'freon_system' || normalizedType === 'cryo_pipe') {
        // Chantier 74 : Réseau de Fluide Réfrigérant & Rupture de Conduites de Fréon (Alien 1979 / Romulus)
        // Conduites murales bleu glacier givrées sous pression avec manomètres et valves de purge
        const pipeBlue = this._material('industrial', { color: 0x0284c7, roughness: 0.32, metalness: 0.82 });
        const pipeFrost = this._material('visorGlass', { color: 0xe0f2fe, opacity: 0.85, roughness: 0.15 });
        const bracketDark = this._material('darkMetal', { color: 0x1e293b, roughness: 0.45 });
        const gaugeGlass = this._material('glass', { color: 0xffffff, opacity: 0.9 });
        const dialNeedle = this._material('emissiveRed', { color: 0xef4444, emissiveIntensity: 2.5 });
        // Conduite principale horizontale réfrigérée (longueur 4m)
        root.add(this._segment(pipeBlue, new T.Vector3(-2.2, 2.4, 0), new T.Vector3(2.2, 2.4, 0), 0.22, 0.22, 'freon_main_pipe', 16));
        // Manchon givré / condensation cristallisée à -150°C
        root.add(this._segment(pipeFrost, new T.Vector3(-1.8, 2.4, 0), new T.Vector3(1.8, 2.4, 0), 0.245, 0.245, 'freon_frost_sleeve', 14));
        // 3 Étriers de fixation murale industrielle
        for (let b = -1; b <= 1; b++) {
          root.add(this._box(bracketDark, { x: 0.18, y: 0.75, z: 0.38 }, { x: b * 1.5, y: 2.4, z: -0.12 }, `freon_wall_bracket_${b}`, true));
          root.add(this._ring(bracketDark, 0.26, 0.04, { x: b * 1.5, y: 2.4, z: 0 }, { x: 0, y: Math.PI / 2, z: 0 }, `freon_collar_${b}`));
        }
        // Buse de purge / raccord de surpression
        root.add(this._segment(bracketDark, new T.Vector3(0, 2.4, 0), new T.Vector3(0, 1.7, 0.2), 0.12, 0.1, 'freon_vent_nozzle', 10));
        // Manomètre circulaire de pression cryogénique
        root.add(this._segment(bracketDark, new T.Vector3(0.65, 2.4, 0), new T.Vector3(0.65, 2.85, 0.18), 0.05, 0.05, 'gauge_stem', 8));
        root.add(this._ellipsoid(bracketDark, { x: 0.24, y: 0.24, z: 0.08 }, { x: 0.65, y: 2.95, z: 0.22 }, 'gauge_housing', 16));
        root.add(this._ellipsoid(gaugeGlass, { x: 0.2, y: 0.2, z: 0.02 }, { x: 0.65, y: 2.95, z: 0.28 }, 'gauge_dial_face', 14));
        root.add(this._box(dialNeedle, { x: 0.03, y: 0.14, z: 0.01 }, { x: 0.65, y: 2.98, z: 0.3 }, 'gauge_pressure_needle'));
      } else if (normalizedType === 'tripwire_claymore' || normalizedType === 'claymore_mine' || normalizedType === 'claymore') {
        // Chantier 76 : Pièges Mines Antipersonnel Claymore M18A1 à Câble USCM (Aliens 1986)
        // Boîtier concave olive-drab "FRONT TOWARD ENEMY" monté sur ciseaux et fil laser de déclenchement
        const claymoreDrab = this._material('fabric', { color: 0x3f4f38, roughness: 0.72, metalness: 0.2 });
        const scissorLegs = this._material('darkMetal', { color: 0x18181b, roughness: 0.35, metalness: 0.8 });
        const armingLed = this._material('emissiveRed', { color: 0xef4444, emissiveIntensity: 3.2 });
        const tripwireBeam = this._material('emissiveRed', { color: 0xf87171, emissiveIntensity: 2.8 });
        // Boîtier incurvé convexe M18A1
        root.add(this._box(claymoreDrab, { x: 0.65, y: 0.38, z: 0.16 }, { x: 0, y: 0.35, z: 0 }, 'claymore_casing', true));
        // Viseur optique à fente supérieur
        root.add(this._box(scissorLegs, { x: 0.18, y: 0.08, z: 0.08 }, { x: 0, y: 0.56, z: 0 }, 'claymore_scissor_sight'));
        // 2 Paires de pieds métalliques en ciseaux plantés dans le sol
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._segment(scissorLegs, new T.Vector3(side * 0.22, 0.3, 0), new T.Vector3(side * 0.32, 0, -0.15), 0.02, 0.015, `claymore_leg_back_${side}`, 6));
          root.add(this._segment(scissorLegs, new T.Vector3(side * 0.22, 0.3, 0), new T.Vector3(side * 0.32, 0, 0.15), 0.02, 0.015, `claymore_leg_front_${side}`, 6));
        }
        // LED rouge clignotante de mise à feu
        root.add(this._ellipsoid(armingLed, { x: 0.035, y: 0.035, z: 0.02 }, { x: 0.22, y: 0.42, z: 0.09 }, 'claymore_arming_beacon', 10));
        // Fil laser de déclenchement rouge horizontal tendu en travers du couloir
        root.add(this._segment(tripwireBeam, new T.Vector3(0, 0.35, 0.08), new T.Vector3(0, 0.35, 3.2), 0.008, 0.008, 'claymore_laser_tripwire', 6));
      } else if (normalizedType === 'magnesium_flare' || normalizedType === 'flare' || normalizedType === 'marine_flare') {
        // Chantier 78 : Flares de Magnésium Luminescents USCM & Feux de Détresse (Aliens 1986)
        // Bâtonnet d'allumage cylindrique avec flamme chimique blanche-orangée aveuglante
        const casingTube = this._material('industrial', { color: 0x991b1b, roughness: 0.55, metalness: 0.35 });
        const flareGlow = this._material('emissiveRed', { color: 0xffedd5, emissiveIntensity: 4.8 });
        const sparkAmber = this._material('emissiveAmber', { color: 0xf97316, emissiveIntensity: 3.5 });
        // Tube de la fusée au sol
        root.add(this._segment(casingTube, new T.Vector3(0, 0.04, -0.15), new T.Vector3(0, 0.04, 0.15), 0.035, 0.035, 'flare_cartridge_casing', 10));
        // Tête incandescente de combustion magnésium
        root.add(this._ellipsoid(flareGlow, { x: 0.12, y: 0.14, z: 0.12 }, { x: 0, y: 0.12, z: 0.18 }, 'flare_magnesium_core', 14));
        // Volute de flamme vive et étincelles
        root.add(this._coneAlong(sparkAmber, { x: 0, y: 0.12, z: 0.18 }, { x: 0, y: 1, z: 0.2 }, 0.08, 0.28, 'flare_flame_cone', 8));
        // Halo d'étincelles au sol
        root.add(this._ring(sparkAmber, 0.45, 0.02, { x: 0, y: 0.02, z: 0.18 }, { x: Math.PI / 2, y: 0, z: 0 }, 'flare_ground_slag_ring'));
      } else if (normalizedType === 'garbage_chute' || normalizedType === 'trash_compactor' || normalizedType === 'fiorina_grinder') {
        // Chantier 79 : Trémie de Broyage & Incinérateur de Déchets Fiorina 161 (Alien 3)
        // Puits vertical de broyage avec mâchoires rotatives d'acier, rotor à lames et veilleuse d'incinération
        const heavyCastIron = this._material('darkMetal', { color: 0x1c1917, roughness: 0.65, metalness: 0.85 });
        const rotorSteel = this._material('industrial', { color: 0x71717a, roughness: 0.25, metalness: 0.95 });
        const furnaceGlow = this._material('emissiveRed', { color: 0xdc2626, emissiveIntensity: 2.8 });
        const hazardBevel = this._material('emissiveAmber', { color: 0xf59e0b, emissiveIntensity: 1.6 });
        // Trémie d'acier évasée au sol
        root.add(this._box(heavyCastIron, { x: 2.6, y: 0.35, z: 2.6 }, { x: 0, y: 0.18, z: 0 }, 'grinder_collar_rim', true));
        root.add(this._box(hazardBevel, { x: 2.8, y: 0.08, z: 2.8 }, { x: 0, y: 0.38, z: 0 }, 'grinder_hazard_stripe'));
        // Puits creux central
        root.add(this._box(heavyCastIron, { x: 2.1, y: 1.8, z: 2.1 }, { x: 0, y: -0.9, z: 0 }, 'grinder_chute_shaft', true));
        // Deux rotors broyeurs contrarotatifs à lames d'acier acérées
        for (let rotor = -1; rotor <= 1; rotor += 2) {
          root.add(this._segment(rotorSteel, new T.Vector3(rotor * 0.45, 0.05, -0.9), new T.Vector3(rotor * 0.45, 0.05, 0.9), 0.14, 0.14, `grinder_shaft_${rotor}`, 12));
          for (let tooth = 0; tooth < 5; tooth++) {
            const tAngle = (tooth / 5) * Math.PI * 2;
            root.add(this._box(rotorSteel, { x: 0.08, y: 0.28, z: 0.12 }, { x: rotor * 0.45 + Math.cos(tAngle) * 0.22, y: 0.05 + Math.sin(tAngle) * 0.22, z: -0.7 + tooth * 0.35 }, `grinder_tooth_${rotor}_${tooth}`));
          }
        }
        // Veilleuse d'incinération rougeoyante dans la profondeur du puits
        root.add(this._ellipsoid(furnaceGlow, { x: 0.9, y: 0.25, z: 0.9 }, { x: 0, y: -1.7, z: 0 }, 'incinerator_furnace_glow', 16));
      } else if (normalizedType === 'flamer_sentry' || normalizedType === 'ua571d_flamer' || normalizedType === 'flamer_turret') {
        // Chantier 82 : Tourelles Automatiques UA 571-D Flamer (Aliens 1986 Director's Cut / Fireteam Elite)
        // Sentinelle lance-flammes sur trépied avec bonbonne de napalm liquide pressurisée orange et veilleuse pilote bleue
        const gunMetal = this._material('darkMetal', { color: 0x1f2937, roughness: 0.32, metalness: 0.88 });
        const oliveDrab = this._material('industrial', { color: 0x3f4a3c, roughness: 0.45, metalness: 0.65 });
        const napalmTank = this._material('industrial', { color: 0xea580c, roughness: 0.4, metalness: 0.7 });
        const pilotFlame = this._material('emissiveGreen', { color: 0x0284c7, emissive: 0x38bdf8, emissiveIntensity: 3.5 });
        const thermalSensor = this._material('emissiveRed', { color: 0xef4444, emissiveIntensity: 2.8 });

        // Trépied pliant d'ancrage lourd au sol
        root.add(this._ellipsoid(gunMetal, { x: 0.28, y: 0.15, z: 0.28 }, { x: 0, y: 0.42, z: 0 }, 'tripod_hub', 16));
        for (let leg = 0; leg < 3; leg++) {
          const legAngle = (leg / 3) * Math.PI * 2;
          const groundX = Math.cos(legAngle) * 0.95;
          const groundZ = Math.sin(legAngle) * 0.95;
          root.add(this._segment(gunMetal, new T.Vector3(0, 0.42, 0), new T.Vector3(groundX, 0.05, groundZ), 0.065, 0.05, `flamer_tripod_leg_${leg}`, 12));
          root.add(this._box(gunMetal, { x: 0.18, y: 0.08, z: 0.18 }, { x: groundX, y: 0.04, z: groundZ }, `flamer_tripod_foot_${leg}`));
        }
        root.add(this._segment(gunMetal, new T.Vector3(0, 0.42, 0), new T.Vector3(0, 0.95, 0), 0.11, 0.11, 'elevation_post', 16));

        // Tête rotative de la tourelle lance-flammes
        const swivelHead = new T.Group();
        swivelHead.name = 'flamer_swivel_head';
        swivelHead.position.set(0, 0.95, 0);

        swivelHead.add(this._box(oliveDrab, { x: 0.52, y: 0.38, z: 0.85 }, { x: 0, y: 0.16, z: -0.1 }, 'flamer_housing', true));
        // Canon lance-flammes évasé haute température
        swivelHead.add(this._segment(gunMetal, new T.Vector3(0, 0.16, 0.3), new T.Vector3(0, 0.16, 1.35), 0.08, 0.14, 'flamer_barrel', 16));
        // Veilleuse d'allumage pilote bleue vacillante sous la buse
        swivelHead.add(this._ellipsoid(pilotFlame, { x: 0.04, y: 0.04, z: 0.06 }, { x: 0, y: 0.04, z: 1.32 }, 'flamer_pilot_burner', 10));
        // Capteur optique infrarouge de tracking
        swivelHead.add(this._ellipsoid(thermalSensor, { x: 0.09, y: 0.09, z: 0.12 }, { x: 0, y: 0.35, z: 0.28 }, 'thermal_sensor_lens', 14));
        // Réservoir double de napalm liquide pressurisé orange sur le flanc
        swivelHead.add(this._segment(napalmTank, new T.Vector3(0, -0.22, -0.2), new T.Vector3(0, -0.22, 0.45), 0.24, 0.24, 'napalm_fuel_drum', 16));
        swivelHead.add(this._ring(gunMetal, 0.26, 0.03, { x: 0, y: -0.22, z: 0.1 }, { x: 0, y: 0, z: 0 }, 'napalm_tank_strap'));
        root.add(swivelHead);
      } else if (normalizedType === 'liquid_nitrogen_tank' || normalizedType === 'nitrogen_tank' || normalizedType === 'cryo_tank_ln2') {
        // Chantier 84 : Réservoirs de Carburant Cryogénique d'Azote Liquide LN2 & Congélation Flash (Alien: Romulus)
        // Cuve cylindrique verticale de 4m de haut avec isolation argentée givrée et manomètre
        const tankSilver = this._material('industrial', { color: 0x94a3b8, roughness: 0.25, metalness: 0.85 });
        const frostGlass = this._material('visorGlass', { color: 0xe0f2fe, opacity: 0.75, roughness: 0.15 });
        const frameDark = this._material('darkMetal', { color: 0x1e293b, roughness: 0.5 });
        const warningDecal = this._material('emissiveGreen', { color: 0x0284c7, emissive: 0x38bdf8, emissiveIntensity: 1.8 });

        // Base d'ancrage circulaire lourd au sol
        root.add(this._segment(frameDark, new T.Vector3(0, 0, 0), new T.Vector3(0, 0.35, 0), 1.4, 1.4, 'ln2_tank_base', 24));
        // Cuve cryogénique principale haute pression (hauteur 3.8m, rayon 1.15m)
        root.add(this._segment(tankSilver, new T.Vector3(0, 0.35, 0), new T.Vector3(0, 3.8, 0), 1.15, 1.15, 'ln2_tank_body', 28));
        // Dôme supérieur bombé
        root.add(this._ellipsoid(tankSilver, { x: 1.15, y: 0.45, z: 1.15 }, { x: 0, y: 3.8, z: 0 }, 'ln2_tank_dome', 24));
        // Manchon givré à condensation de frimas glacé (-196°C)
        root.add(this._segment(frostGlass, new T.Vector3(0, 0.8, 0), new T.Vector3(0, 3.2, 0), 1.18, 1.18, 'ln2_frost_condensation', 20));
        // Cerclages d'armature en acier
        for (let ringY = 1.0; ringY <= 3.2; ringY += 1.1) {
          root.add(this._ring(frameDark, 1.22, 0.05, { x: 0, y: ringY, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, `ln2_tank_band_${Math.round(ringY)}`));
        }
        // Soupape de décharge cryogénique et buse de purge latérale
        root.add(this._segment(frameDark, new T.Vector3(0, 3.8, 0), new T.Vector3(0, 4.3, 0), 0.12, 0.12, 'ln2_relief_valve', 12));
        root.add(this._segment(frameDark, new T.Vector3(1.15, 2.0, 0), new T.Vector3(1.55, 1.6, 0), 0.09, 0.07, 'ln2_vent_nozzle', 10));
        // Marquage officiel de sécurité cryogénique
        root.add(this._box(warningDecal, { x: 0.9, y: 0.4, z: 0.05 }, { x: 0, y: 2.2, z: 1.16 }, 'ln2_hazard_stencil'));
      } else if (normalizedType === 'freight_elevator' || normalizedType === 'hydraulic_lift' || normalizedType === 'cargo_lift') {
        // Chantier 85 : Ascenseur Monte-Charge Industriel Hydraulique & Traque Verticale (Aliens 1986 / Alien 3)
        // Plateforme monte-charge carrée de 5x5m avec rambardes jaunes et 4 câbles verticaux de 8m
        const grateSteel = this._material('darkMetal', { color: 0x27272a, roughness: 0.45, metalness: 0.85 });
        const railYellow = this._material('industrial', { color: 0xeab308, roughness: 0.4, metalness: 0.5 });
        const cableSteel = this._material('darkMetal', { color: 0x18181b, roughness: 0.3, metalness: 0.95 });
        const controlGlow = this._material('emissiveGreen', { color: 0x22c55e, emissiveIntensity: 2.2 });

        // Plateforme caillebotis métallique perforée (5x5m)
        root.add(this._box(grateSteel, { x: 5.0, y: 0.35, z: 5.0 }, { x: 0, y: 0.18, z: 0 }, 'elevator_deck_grate', true));
        // Cadre de renfort inférieur en poutrelles en I
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._box(railYellow, { x: 5.08, y: 0.4, z: 0.25 }, { x: 0, y: 0.18, z: side * 2.45 }, `elevator_girder_z_${side}`, true));
          root.add(this._box(railYellow, { x: 0.25, y: 0.4, z: 5.08 }, { x: side * 2.45, y: 0.18, z: 0 }, `elevator_girder_x_${side}`, true));
        }
        // Rambardes de sécurité jaunes (hauteur 1.2m)
        for (let side = -1; side <= 1; side += 2) {
          // Barres horizontales
          root.add(this._segment(railYellow, new T.Vector3(side * 2.4, 0.35, -2.4), new T.Vector3(side * 2.4, 0.35, 2.4), 0.05, 0.05, `elevator_rail_bottom_${side}`, 8));
          root.add(this._segment(railYellow, new T.Vector3(side * 2.4, 1.25, -2.4), new T.Vector3(side * 2.4, 1.25, 2.4), 0.06, 0.06, `elevator_rail_top_${side}`, 8));
          // Montants verticaux
          for (let post = -2; post <= 2; post++) {
            root.add(this._segment(railYellow, new T.Vector3(side * 2.4, 0.35, post * 1.1), new T.Vector3(side * 2.4, 1.25, post * 1.1), 0.045, 0.045, `elevator_post_${side}_${post}`, 6));
          }
        }
        // 4 Câbles verticaux d'acier de levage suspendus au plafond (8m)
        const cablePillars = [
          { x: -2.35, z: -2.35 },
          { x: 2.35, z: -2.35 },
          { x: -2.35, z: 2.35 },
          { x: 2.35, z: 2.35 }
        ];
        cablePillars.forEach((c, idx) => {
          root.add(this._segment(cableSteel, new T.Vector3(c.x, 0.35, c.z), new T.Vector3(c.x, 8.5, c.z), 0.045, 0.045, `elevator_hoist_cable_${idx}`, 8));
          root.add(this._ring(railYellow, 0.18, 0.04, { x: c.x, y: 1.3, z: c.z }, { x: 0, y: 0, z: 0 }, `cable_guide_collar_${idx}`));
        });
        // Console de commande hydraulique à bord
        root.add(this._box(grateSteel, { x: 0.3, y: 1.0, z: 0.2 }, { x: 2.2, y: 0.85, z: 0 }, 'elevator_control_pedestal', true));
        root.add(this._box(controlGlow, { x: 0.18, y: 0.25, z: 0.04 }, { x: 2.05, y: 1.15, z: 0 }, 'elevator_call_buttons'));
      } else if (normalizedType === 'foundry_crucible' || normalizedType === 'molten_crucible' || normalizedType === 'fiorina_furnace') {
        // Chantier 88 : Puits de Fonderie Fiorina 161 & Cascade de Métal en Fusion (Alien 3)
        // Creuset suspendu à pivot en fonte réfractaire contenant un bain d'acier incandescent à 1500°C
        const castIron = this._material('darkMetal', { color: 0x18181b, roughness: 0.75, metalness: 0.85 });
        const moltenMetal = this._material('emissiveRed', {
          color: 0xff4500,
          emissive: 0xfacc15,
          emissiveIntensity: 4.5,
          roughness: 0.15,
          metalness: 0.95
        });
        const pivotSteel = this._material('industrial', { color: 0x52525b, roughness: 0.35, metalness: 0.9 });

        // Creuset cylindro-conique en fonte réfractaire
        root.add(this._segment(castIron, new T.Vector3(0, 0.8, 0), new T.Vector3(0, 2.8, 0), 1.6, 2.0, 'crucible_pot_body', 24));
        root.add(this._ellipsoid(castIron, { x: 1.6, y: 0.45, z: 1.6 }, { x: 0, y: 0.8, z: 0 }, 'crucible_pot_bottom', 20));
        // Bec verseur de coulée
        root.add(this._box(castIron, { x: 0.6, y: 0.35, z: 0.85 }, { x: 0, y: 2.75, z: 1.95 }, 'crucible_pouring_lip', true));
        // Bain intérieur de métal en fusion liquide incandescent (1500°C)
        root.add(this._ellipsoid(moltenMetal, { x: 1.85, y: 0.12, z: 1.85 }, { x: 0, y: 2.65, z: 0 }, 'molten_metal_liquid_surface', 24));
        // Tourillons d'axe de pivotement latéral et roues d'engrenage de basculement
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._segment(pivotSteel, new T.Vector3(side * 1.9, 1.85, 0), new T.Vector3(side * 2.8, 1.85, 0), 0.18, 0.18, `crucible_trunnion_${side}`, 12));
          root.add(this._ring(castIron, 0.5, 0.08, { x: side * 2.75, y: 1.85, z: 0 }, { x: 0, y: Math.PI / 2, z: 0 }, `crucible_tilt_gear_${side}`));
          // Piliers de support verticaux d'ancrage au sol
          root.add(this._box(castIron, { x: 0.45, y: 2.4, z: 0.8 }, { x: side * 2.75, y: 1.2, z: 0 }, `crucible_support_pillar_${side}`, true));
        }
        // Rigole réfractaire au sol pour canaliser le plomb/acier liquide
        root.add(this._box(castIron, { x: 1.2, y: 0.25, z: 3.5 }, { x: 0, y: 0.12, z: 3.2 }, 'furnace_slag_trough', true));
        root.add(this._box(moltenMetal, { x: 0.8, y: 0.08, z: 3.3 }, { x: 0, y: 0.22, z: 3.2 }, 'trough_molten_glow'));
      } else if (normalizedType === 'industrial_laser_cutter' || normalizedType === 'orbital_laser_rig' || normalizedType === 'laser_cutter') {
        // Chantier 90 : Banc de Découpe Laser Industriel Orbital USCM (Aliens 1986 / Romulus)
        // Portique industriel sur rail avec faisceau continu vert cohérent haute intensité
        const railChassis = this._material('industrial', { color: 0x334155, roughness: 0.45, metalness: 0.8 });
        const laserHeadMat = this._material('darkMetal', { color: 0x0f172a, roughness: 0.25, metalness: 0.95 });
        const laserBeamMat = this._material('emissiveGreen', { color: 0x22c55e, emissive: 0x4ade80, emissiveIntensity: 5.0 });
        const sparkEmitter = this._material('emissiveGreen', { color: 0x86efac, emissiveIntensity: 3.8 });

        // Portique de guidage métallique en arche
        root.add(this._box(railChassis, { x: 4.5, y: 0.35, z: 0.5 }, { x: 0, y: 3.2, z: 0 }, 'laser_gantry_crossbeam', true));
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._segment(railChassis, new T.Vector3(side * 2.1, 0, 0), new T.Vector3(side * 2.1, 3.2, 0), 0.18, 0.18, `laser_gantry_upright_${side}`, 12));
          root.add(this._box(railChassis, { x: 0.4, y: 0.18, z: 2.8 }, { x: side * 2.1, y: 0.09, z: 0 }, `laser_floor_skid_${side}`, true));
        }
        // Chariot motorisé et tête de focalisation laser mobile
        root.add(this._box(laserHeadMat, { x: 0.65, y: 0.5, z: 0.65 }, { x: 0, y: 3.0, z: 0 }, 'laser_focusing_head', true));
        root.add(this._coneAlong(laserHeadMat, { x: 0, y: 2.75, z: 0 }, { x: 0, y: -1, z: 0 }, 0.18, 0.35, 'laser_nozzle_cone', 12));
        // Faisceau laser volumétrique continu vert cohérent découpant le sol (longueur 2.4m)
        root.add(this._segment(laserBeamMat, new T.Vector3(0, 2.4, 0), new T.Vector3(0, 0.05, 0), 0.035, 0.035, 'industrial_laser_beam', 8));
        // Point d'impact incandescent au sol avec halo d'étincelles
        root.add(this._ellipsoid(sparkEmitter, { x: 0.18, y: 0.05, z: 0.18 }, { x: 0, y: 0.04, z: 0 }, 'laser_ground_incandescence', 14));
        root.add(this._ring(laserBeamMat, 0.4, 0.025, { x: 0, y: 0.05, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'laser_reflection_ring'));
      } else if (normalizedType === 'skimmer_scan_drone' || normalizedType === 'scan_drone' || normalizedType === 'weyland_drone') {
        // Chantier 87 : Drones Flottants de Reconnaissance "Skimmer Scan-Drones" Weyland-Yutani (Aliens: Dark Descent)
        // Drone hélicoïdal autonome antigravité avec rotors carénés et balayage laser bleu oscillant
        const carbonHull = this._material('darkMetal', { color: 0x0f172a, roughness: 0.25, metalness: 0.92 });
        const rotorMat = this._material('darkMetal', { color: 0x1e293b, roughness: 0.4 });
        const blueScanner = this._material('emissiveGreen', { color: 0x0284c7, emissive: 0x38bdf8, emissiveIntensity: 3.4 });
        const empCell = this._material('emissiveRed', { color: 0x06b6d4, emissive: 0x67e8f9, emissiveIntensity: 2.8 });

        // Corps ovoïde profilé furtif du drone
        root.add(this._ellipsoid(carbonHull, { x: 0.45, y: 0.22, z: 0.65 }, { x: 0, y: 1.6, z: 0 }, 'drone_chassis_hull', 18));
        // Deux rotors carénés latéraux contrarotatifs
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._ring(carbonHull, 0.32, 0.04, { x: side * 0.58, y: 1.6, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, `rotor_shroud_${side}`));
          root.add(this._box(rotorMat, { x: 0.55, y: 0.02, z: 0.08 }, { x: side * 0.58, y: 1.6, z: 0 }, `rotor_blade_${side}`));
          root.add(this._segment(carbonHull, new T.Vector3(side * 0.35, 1.6, 0), new T.Vector3(side * 0.58, 1.6, 0), 0.035, 0.035, `rotor_strut_${side}`, 6));
        }
        // Lentille de visée optique et sonar 360° inférieure
        root.add(this._ellipsoid(blueScanner, { x: 0.16, y: 0.12, z: 0.16 }, { x: 0, y: 1.45, z: 0.18 }, 'drone_sonar_dome', 16));
        // Cône de balayage holographique bleu orienté vers le sol
        root.add(this._coneAlong(blueScanner, { x: 0, y: 1.4, z: 0.18 }, { x: 0, y: -1, z: 0.3 }, 0.05, 1.4, 'drone_scan_cone', 12));
        // Cellule de décharge EMP d'autodéfense
        root.add(this._ellipsoid(empCell, { x: 0.12, y: 0.08, z: 0.12 }, { x: 0, y: 1.74, z: -0.15 }, 'drone_emp_core', 12));
      } else if (normalizedType === 'decontamination_airlock' || normalizedType === 'decon_shower' || normalizedType === 'hazmat_airlock') {
        // Chantier 93 : Sas de Décontamination Nucléaire & Douches Caustiques d'Urgence (Aliens / Isolation)
        const frameMat = this._material('industrial', { color: 0x475569, roughness: 0.35, metalness: 0.85 });
        const yellowDoor = this._material('hazard', { color: 0xeab308, roughness: 0.4 });
        const glassPort = this._material('glass', { color: 0x38bdf8, opacity: 0.65, transparent: true });
        const nozzleMat = this._material('darkMetal', { color: 0x0f172a, roughness: 0.2, metalness: 0.9 });
        const alertBeacon = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 3.5 });

        // Structure du sas cubique étanche (4.2m x 3.8m x 4.2m)
        root.add(this._box(frameMat, { x: 4.2, y: 0.25, z: 4.2 }, { x: 0, y: 0.12, z: 0 }, 'decon_floor_tray', true));
        root.add(this._box(frameMat, { x: 4.2, y: 0.25, z: 4.2 }, { x: 0, y: 3.65, z: 0 }, 'decon_ceiling_hood', true));
        // Parois latérales avec montants renforcés
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._box(frameMat, { x: 0.25, y: 3.4, z: 4.2 }, { x: side * 2.0, y: 1.85, z: 0 }, `decon_wall_${side}`, true));
          // Portes coulissantes jaunes avec hublot circulaire étanche
          root.add(this._box(yellowDoor, { x: 1.6, y: 3.2, z: 0.18 }, { x: side * 0.9, y: 1.8, z: 2.05 }, `decon_sliding_door_${side}`, true));
          root.add(this._ring(frameMat, 0.35, 0.05, { x: side * 0.9, y: 2.1, z: 2.15 }, { x: 0, y: 0, z: 0 }, `decon_porthole_frame_${side}`));
          root.add(this._ellipsoid(glassPort, { x: 0.3, y: 0.3, z: 0.02 }, { x: side * 0.9, y: 2.1, z: 2.15 }, `decon_porthole_glass_${side}`, 14));
        }
        // 4 Buses de pulvérisation rotatives au plafond
        const nozzlePositions = [
          { x: -1.2, z: -1.2 }, { x: 1.2, z: -1.2 },
          { x: -1.2, z: 1.2 }, { x: 1.2, z: 1.2 }
        ];
        nozzlePositions.forEach((noz, idx) => {
          root.add(this._coneAlong(nozzleMat, { x: noz.x, y: 3.55, z: noz.z }, { x: 0, y: -1, z: 0 }, 0.12, 0.25, `decon_spray_nozzle_${idx}`, 10));
          root.add(this._ring(nozzleMat, 0.16, 0.03, { x: noz.x, y: 3.55, z: noz.z }, { x: Math.PI / 2, y: 0, z: 0 }, `decon_nozzle_flange_${idx}`));
        });
        // Gyrophare d'urgence jaune au sommet du sas
        root.add(this._ellipsoid(alertBeacon, { x: 0.22, y: 0.18, z: 0.22 }, { x: 0, y: 3.9, z: 2.05 }, 'decon_alert_beacon', 14));
        // Console murale avec bouton poussoir d'activation d'urgence
        root.add(this._box(frameMat, { x: 0.3, y: 0.45, z: 0.15 }, { x: 1.9, y: 1.7, z: 1.2 }, 'decon_switch_panel', true));
        root.add(this._box(this._material('emissiveRed', { color: 0xef4444, emissiveIntensity: 3.0 }), { x: 0.08, y: 0.08, z: 0.06 }, { x: 1.78, y: 1.7, z: 1.2 }, 'decon_emergency_trigger'));
      } else if (normalizedType === 'industrial_crane_arm' || normalizedType === 'crane_arm' || normalizedType === 'seegson_crane') {
        // Chantier 96 : Bras Manipulateur Robotique Industriel & Grue Suspendue Télescopique Seegson (Alien: Isolation)
        const frameYellow = this._material('hazard', { color: 0xeab308, roughness: 0.45, metalness: 0.6 });
        const hydSteel = this._material('darkMetal', { color: 0x334155, roughness: 0.2, metalness: 0.95 });
        const clawMat = this._material('darkMetal', { color: 0x0f172a, roughness: 0.25, metalness: 0.92 });
        const warningGlow = this._material('emissiveAmber', { color: 0xf59e0b, emissiveIntensity: 2.5 });

        // Portique d'ancrage télescopique au plafond (hauteur 7.5m)
        root.add(this._box(frameYellow, { x: 1.8, y: 0.5, z: 2.4 }, { x: 0, y: 7.2, z: 0 }, 'crane_ceiling_mount', true));
        // Pivot rotatif d'azimut
        root.add(this._segment(hydSteel, new T.Vector3(0, 7.2, 0), new T.Vector3(0, 6.4, 0), 0.45, 0.45, 'crane_turntable_shaft', 16));
        // Bras articulé principal plongeant
        root.add(this._segment(frameYellow, new T.Vector3(0, 6.4, 0), new T.Vector3(0, 4.2, 1.8), 0.28, 0.22, 'crane_upper_boom', 12));
        // Vérin hydraulique double effet
        root.add(this._segment(hydSteel, new T.Vector3(0, 6.2, -0.2), new T.Vector3(0, 4.6, 1.2), 0.12, 0.08, 'crane_hydraulic_ram', 8));
        // Poignet articulé et rotule d'orientation
        root.add(this._ellipsoid(hydSteel, { x: 0.35, y: 0.35, z: 0.35 }, { x: 0, y: 4.2, z: 1.8 }, 'crane_wrist_joint', 16));
        // Pince tripode géante de préhension d'acier
        for (let f = 0; f < 3; f++) {
          const fAng = (f / 3) * Math.PI * 2;
          const clawBase = new T.Vector3(Math.cos(fAng) * 0.35, 4.2, 1.8 + Math.sin(fAng) * 0.35);
          const clawTip = new T.Vector3(Math.cos(fAng) * 0.65, 2.7, 1.8 + Math.sin(fAng) * 0.65);
          root.add(this._segment(clawMat, clawBase, clawTip, 0.14, 0.06, `crane_claw_jaw_${f}`, 8));
          root.add(this._coneAlong(clawMat, clawTip, { x: -Math.cos(fAng) * 0.4, y: -1, z: -Math.sin(fAng) * 0.4 }, 0.06, 0.35, `crane_claw_tooth_${f}`, 6));
        }
        root.add(this._ellipsoid(warningGlow, { x: 0.15, y: 0.15, z: 0.15 }, { x: 0, y: 4.15, z: 1.8 }, 'crane_working_beacon', 12));
      } else if (normalizedType === 'fusion_reactor_core' || normalizedType === 'reactor_core' || normalizedType === 'fusion_core') {
        // Chantier 98 : Réacteur à Fusion Surchauffé & Rupture du Confinement Magnétique (Aliens 1986 / Romulus)
        const reactorBaseMat = this._material('industrial', { color: 0x1e293b, roughness: 0.4, metalness: 0.85 });
        const copperToroid = this._material('chitinWarm', { color: 0xb45309, roughness: 0.25, metalness: 0.95 });
        const glassCore = this._material('glass', { color: 0x38bdf8, opacity: 0.45, transparent: true });
        const plasmaCoreGlow = this._material('emissiveGreen', { color: 0x0284c7, emissive: 0x38bdf8, emissiveIntensity: 5.5 });
        const arcSpark = this._material('emissiveGreen', { color: 0x67e8f9, emissiveIntensity: 4.2 });

        // Base toroïdale du réacteur au sol
        root.add(this._segment(reactorBaseMat, new T.Vector3(0, 0, 0), new T.Vector3(0, 1.2, 0), 2.8, 2.5, 'reactor_pedestal_body', 24));
        root.add(this._ring(reactorBaseMat, 3.2, 0.25, { x: 0, y: 0.12, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'reactor_deck_rim'));
        // Dôme de confinement borosilicaté transparent (hauteur 4m)
        root.add(this._segment(glassCore, new T.Vector3(0, 1.2, 0), new T.Vector3(0, 5.2, 0), 1.8, 1.8, 'reactor_containment_cylinder', 24));
        // Cœur plasmique vertical hyper-luminescent bleu
        root.add(this._segment(plasmaCoreGlow, new T.Vector3(0, 1.4, 0), new T.Vector3(0, 5.0, 0), 0.55, 0.55, 'reactor_plasma_column', 16));
        // 4 Anneaux magnétiques supraconducteurs toroïdaux en cuivre
        for (let ringIdx = 0; ringIdx < 4; ringIdx++) {
          const ringY = 1.8 + ringIdx * 0.95;
          root.add(this._ring(copperToroid, 2.2, 0.16, { x: 0, y: ringY, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, `magnetic_choke_ring_${ringIdx}`));
        }
        // Arches d'arcs électriques et de décharge plasmique
        for (let arc = 0; arc < 4; arc++) {
          const arcAng = (arc / 4) * Math.PI * 2;
          root.add(this._tube(arcSpark, [
            { x: Math.cos(arcAng) * 0.55, y: 2.2, z: Math.sin(arcAng) * 0.55 },
            { x: Math.cos(arcAng + 0.5) * 1.6, y: 3.2, z: Math.sin(arcAng + 0.5) * 1.6 },
            { x: Math.cos(arcAng) * 0.55, y: 4.2, z: Math.sin(arcAng) * 0.55 }
          ], 0.035, `plasma_discharge_arc_${arc}`, 12, 6));
        }
        // Couvercle magnétique supérieur
        root.add(this._segment(reactorBaseMat, new T.Vector3(0, 5.2, 0), new T.Vector3(0, 6.2, 0), 2.5, 2.0, 'reactor_top_cap', 24));
      } else if (normalizedType === 'muthur_terminal' || normalizedType === 'mother_terminal' || normalizedType === 'muthur_6000') {
        // Chantier 100 : Système M.U.T.H.U.R. 6000 & Interface Terminaux Rétro-Futuriste CRT Orale (Alien 1979 / Romulus)
        const consoleShell = this._material('industrial', { color: 0x334155, roughness: 0.35, metalness: 0.8 });
        const crtScreenMat = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 2.8 });
        const keyboardMat = this._material('darkMetal', { color: 0x0f172a, roughness: 0.4 });
        const blinkerMat = this._material('emissiveGreen', { color: 0x22c55e, emissiveIntensity: 2.0 });

        // Pupitre central hexagonal (largeur 2.4m, hauteur 1.1m)
        root.add(this._segment(consoleShell, new T.Vector3(0, 0, 0), new T.Vector3(0, 1.1, 0), 1.25, 1.4, 'muthur_pedestal_base', 6));
        // 3 Écrans incurvés CRT cathodiques à phosphore ambré orientés à 120°
        for (let scr = 0; scr < 3; scr++) {
          const scrAng = (scr / 3) * Math.PI * 2;
          const scrX = Math.cos(scrAng) * 0.95;
          const scrZ = Math.sin(scrAng) * 0.95;
          // Boîtier moniteur CRT
          const monBox = this._box(consoleShell, { x: 0.75, y: 0.55, z: 0.45 }, { x: scrX, y: 1.45, z: scrZ }, `muthur_crt_housing_${scr}`, true);
          monBox.rotation.y = -scrAng + Math.PI / 2;
          root.add(monBox);
          // Écran incurvé vert/ambre
          const crtFace = this._box(crtScreenMat, { x: 0.62, y: 0.42, z: 0.04 }, { x: scrX * 1.15, y: 1.45, z: scrZ * 1.15 }, `muthur_screen_glow_${scr}`);
          crtFace.rotation.y = -scrAng + Math.PI / 2;
          root.add(crtFace);
          // Clavier mécanique incliné à touches cliquetantes
          const kbFace = this._box(keyboardMat, { x: 0.65, y: 0.08, z: 0.35 }, { x: scrX * 1.35, y: 1.12, z: scrZ * 1.35 }, `muthur_keyboard_${scr}`);
          kbFace.rotation.y = -scrAng + Math.PI / 2;
          kbFace.rotation.x = 0.2;
          root.add(kbFace);
        }
        // Panneau supérieur de voyants lumineux carrés stroboscopiques
        for (let b = 0; b < 6; b++) {
          const bAng = (b / 6) * Math.PI * 2;
          root.add(this._box(b % 2 === 0 ? blinkerMat : crtScreenMat, { x: 0.06, y: 0.06, z: 0.06 }, { x: Math.cos(bAng) * 0.55, y: 1.82, z: Math.sin(bAng) * 0.55 }, `muthur_blinker_${b}`));
        }
        // Mât central de processeur avec ventilation
        root.add(this._segment(consoleShell, new T.Vector3(0, 1.1, 0), new T.Vector3(0, 2.1, 0), 0.35, 0.25, 'muthur_central_core', 12));
      } else if (normalizedType === 'high_pressure_steam_valve') {
        // Chantier 103 : Sas de Décharge de Pression & Vannes Hydrauliques de Vapeur d'Urgence (Alien 1979 / Isolation)
        const pipeCopper = this._material('chitinWarm', { color: 0xb45309, roughness: 0.3, metalness: 0.88 });
        const valveRed = this._material('industrial', { color: 0xdc2626, roughness: 0.35, metalness: 0.65 });
        const gaugeGlow = this._material('emissiveAmber', { color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 2.2 });
        // Double colonne de vapeur haute pression 40 bars
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._segment(pipeCopper, new T.Vector3(side * 0.45, 0, 0), new T.Vector3(side * 0.45, 3.8, 0), 0.18, 0.18, `steam_main_column_${side}`, 16));
          root.add(this._ring(dark, 0.24, 0.04, { x: side * 0.45, y: 1.5, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, `steam_flange_${side}`));
        }
        // Collecteur transversal et buse d'échappement
        root.add(this._segment(metal, new T.Vector3(-0.45, 1.5, 0), new T.Vector3(0.45, 1.5, 0), 0.14, 0.14, 'steam_cross_manifold', 12));
        root.add(this._segment(dark, new T.Vector3(0, 1.5, 0), new T.Vector3(0, 1.5, 0.55), 0.12, 0.16, 'steam_exhaust_nozzle', 12));
        // Volant de manœuvre rouge cranté
        root.add(this._ring(valveRed, 0.38, 0.055, { x: 0, y: 1.5, z: 0.62 }, { x: 0, y: 0, z: 0 }, 'steam_red_handwheel'));
        root.add(this._box(valveRed, { x: 0.72, y: 0.05, z: 0.05 }, { x: 0, y: 1.5, z: 0.62 }, 'steam_wheel_spoke_h'));
        root.add(this._box(valveRed, { x: 0.05, y: 0.72, z: 0.05 }, { x: 0, y: 1.5, z: 0.62 }, 'steam_wheel_spoke_v'));
        // Manomètre de pression 40 bars
        root.add(this._ellipsoid(gaugeGlow, { x: 0.14, y: 0.14, z: 0.05 }, { x: 0, y: 2.05, z: 0.22 }, 'steam_pressure_gauge_40bar', 12));
      } else if (normalizedType === 'seismic_claymore_mine') {
        // Chantier 105 : Mines Magnétiques Détectrices de Mouvement "M38 Claymore Sismique" (Aliens: Colonial Marines)
        const oliveCase = this._material('industrial', { color: 0x365314, roughness: 0.42, metalness: 0.68 });
        const sensorBlue = this._material('emissiveGreen', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 3.5 });
        // Trépied magnétique néodyme bas
        for (let leg = 0; leg < 3; leg++) {
          const ang = (leg / 3) * Math.PI * 2;
          root.add(this._segment(dark, new T.Vector3(0, 0.28, 0), new T.Vector3(Math.cos(ang) * 0.38, 0.02, Math.sin(ang) * 0.38), 0.03, 0.025, `m38_leg_${leg}`, 8));
        }
        // Boîtier incurvé directionnel M38 ("FRONT TOWARD ENEMY")
        root.add(this._box(oliveCase, { x: 0.56, y: 0.28, z: 0.16 }, { x: 0, y: 0.36, z: 0 }, 'm38_claymore_body', true));
        // Double diode bleue de détection sismique
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._ellipsoid(sensorBlue, { x: 0.045, y: 0.045, z: 0.03 }, { x: side * 0.16, y: 0.44, z: 0.09 }, `m38_seismic_led_${side}`, 8));
        }
      } else if (normalizedType === 'uscm_titanium_barricade') {
        // Chantier 106 : Système de Barricades Déployables Renforcées en Titane USCM (Aliens: Dark Descent)
        const titaniumMat = this._material('industrial', { color: 0x475569, roughness: 0.28, metalness: 0.88 });
        const hazardYellow = this._material('emissiveAmber', { color: 0xeab308, emissive: 0xca8a04, emissiveIntensity: 0.45 });
        // Bouclier frontal blindé incliné (largeur 3.6m, hauteur 1.55m)
        const shieldPlate = this._box(titaniumMat, { x: 3.6, y: 1.55, z: 0.24 }, { x: 0, y: 0.78, z: 0 }, 'titanium_shield_plate', true);
        shieldPlate.rotation.x = -0.15;
        root.add(shieldPlate);
        // Bandeau d'avertissement jaune USCM et meurtrières de tir
        root.add(this._box(hazardYellow, { x: 3.4, y: 0.18, z: 0.28 }, { x: 0, y: 1.25, z: 0.02 }, 'barricade_hazard_stripe'));
        // 3 Vérins hydrauliques d'ancrage arrière
        for (let strut = -1; strut <= 1; strut++) {
          root.add(this._segment(dark, new T.Vector3(strut * 1.2, 1.2, -0.1), new T.Vector3(strut * 1.2, 0.05, -0.95), 0.08, 0.07, `barricade_anchor_strut_${strut}`, 10));
        }
      } else if (normalizedType === 'seegson_medibot') {
        // Chantier 107 : Unité Médicale Robotisée Seegson Medi-Bot & Décontamination Hygiénique (Alien: Isolation)
        const clinicalWhite = this._material('bone', { color: 0xf8fafc, roughness: 0.2, metalness: 0.35 });
        const seegsonEmerald = this._material('industrial', { color: 0x059669, roughness: 0.3, metalness: 0.65 });
        const ecgGreen = this._material('emissiveGreen', { color: 0x10b981, emissive: 0x059669, emissiveIntensity: 3.2 });
        const laserRed = this._material('emissiveRed', { color: 0xef4444, emissiveIntensity: 3.0 });
        // Socle roulant et fût cylindrique médical blanc/émeraude
        root.add(this._segment(dark, new T.Vector3(0, 0, 0), new T.Vector3(0, 0.25, 0), 0.85, 0.75, 'medibot_base', 18));
        root.add(this._segment(clinicalWhite, new T.Vector3(0, 0.25, 0), new T.Vector3(0, 1.85, 0), 0.55, 0.52, 'medibot_chassis_body', 20));
        root.add(this._ring(seegsonEmerald, 0.56, 0.08, { x: 0, y: 1.15, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'medibot_seegson_band'));
        // Écran moniteur ECG cardiaque frontal
        root.add(this._box(ecgGreen, { x: 0.52, y: 0.34, z: 0.06 }, { x: 0, y: 1.52, z: 0.52 }, 'medibot_ecg_screen'));
        // 2 Bras articulés chirurgicaux (seringue de neurotoxine/soin & scalpel laser)
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._segment(clinicalWhite, new T.Vector3(side * 0.55, 1.45, 0), new T.Vector3(side * 0.95, 1.25, 0.65), 0.07, 0.05, `medibot_arm_${side}`, 10));
          root.add(this._coneAlong(side < 0 ? ecgGreen : laserRed, { x: side * 0.95, y: 1.25, z: 0.65 }, { x: 0, y: -0.2, z: 1 }, 0.045, 0.38, `medibot_injector_${side}`, 8));
        }
      } else if (normalizedType === 'hanging_hv_cables') {
        // Chantier 108 : Réseau Haute Tension & Câbles Pendants Électrifiés (Alien 1979 / Isolation)
        const cableRubber = this._material('darkMetal', { color: 0x09090b, roughness: 0.6, metalness: 0.2 });
        const sparkArc = this._material('emissiveGreen', { color: 0x38bdf8, emissive: 0x67e8f9, emissiveIntensity: 4.5 });
        // Boîtier de jonction arraché au plafond (y = 4.6m)
        root.add(this._box(dark, { x: 1.2, y: 0.35, z: 1.2 }, { x: 0, y: 4.6, z: 0 }, 'hv_ceiling_junction_box', true));
        // 3 Câbles 50 000 V pendants et ondulants avec extrémités d'arcs électriques
        for (let c = -1; c <= 1; c++) {
          root.add(this._tube(cableRubber, [
            { x: c * 0.32, y: 4.5, z: 0 },
            { x: c * 0.48, y: 2.8, z: c * 0.25 },
            { x: c * 0.28, y: 1.15, z: -c * 0.2 }
          ], 0.055, `hv_hanging_cable_${c}`, 16, 8));
          root.add(this._ellipsoid(sparkArc, { x: 0.14, y: 0.14, z: 0.14 }, { x: c * 0.28, y: 1.1, z: -c * 0.2 }, `hv_cable_spark_tip_${c}`, 10));
        }
        // Socle d'avertissement de flaque conductrice au sol
        root.add(this._ring(sparkArc, 1.35, 0.03, { x: 0, y: 0.04, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'hv_floor_arc_ring'));
      } else if (normalizedType === 'zero_g_gravity_generator') {
        // Chantier 110 : Dispositif de Sabotage Central de Gravité Artificielle "Zero-G Emergency Flush" (Alien: Romulus 2024)
        const brassGimbal = this._material('chitinWarm', { color: 0xd97706, roughness: 0.22, metalness: 0.92 });
        const gravCoreGlow = this._material('emissiveGreen', { color: 0xa855f7, emissive: 0x38bdf8, emissiveIntensity: 4.8 });
        // Piédestal octogonal lourd
        root.add(this._segment(dark, new T.Vector3(0, 0, 0), new T.Vector3(0, 0.85, 0), 1.85, 1.6, 'zerog_pedestal_base', 8));
        // 2 Anneaux de cardan gyroscopiques croisés
        root.add(this._ring(brassGimbal, 1.45, 0.1, { x: 0, y: 2.35, z: 0 }, { x: 0.4, y: 0.3, z: 0 }, 'zerog_outer_gimbal_ring'));
        root.add(this._ring(brassGimbal, 1.12, 0.08, { x: 0, y: 2.35, z: 0 }, { x: -0.5, y: 0.8, z: 0.4 }, 'zerog_inner_gimbal_ring'));
        // Singularité centrale d'antigravité en lévitation
        root.add(this._ellipsoid(gravCoreGlow, { x: 0.55, y: 0.55, z: 0.55 }, { x: 0, y: 2.35, z: 0 }, 'zerog_graviton_sphere', 20));
        // Console frontale de débrayage Zero-G
        root.add(this._box(metal, { x: 0.85, y: 1.15, z: 0.45 }, { x: 0, y: 0.58, z: 1.55 }, 'zerog_override_console', true));
        root.add(this._box(gravCoreGlow, { x: 0.65, y: 0.28, z: 0.05 }, { x: 0, y: 1.05, z: 1.78 }, 'zerog_console_screen'));
      } else if (normalizedType === 'cryo_stasis_pod' || normalizedType === 'stasis_pod') {
        // Chantier 112 : Chambre de Stase Cryogénique Weyland-Yutani & Caissons d'Hyper-Sommeil Ouverts (Alien 1979 / Aliens 1986)
        const frameMat = this._material('industrial', { color: 0x94a3b8, roughness: 0.24, metalness: 0.82 });
        const cyanGlow = this._material('emissiveGreen', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.8 });
        const bedMat = this._material('bone', { color: 0xe2e8f0, roughness: 0.4 });
        // Socle élévateur et cuve inférieure
        root.add(this._box(frameMat, { x: 1.6, y: 0.65, z: 2.8 }, { x: 0, y: 0.32, z: 0 }, 'cryo_pod_pedestal', true));
        root.add(this._box(bedMat, { x: 1.25, y: 0.2, z: 2.35 }, { x: 0, y: 0.65, z: 0 }, 'cryo_pod_mattress'));
        // Verrière borosilicate incurvée ouverte ou close
        const canopy = this._box(cyanGlow, { x: 1.35, y: 0.85, z: 2.45 }, { x: 0, y: 1.15, z: 0 }, 'cryo_pod_glass_canopy');
        root.add(canopy);
        // Console de monitoring des fonctions vitales en tête de lit
        root.add(this._box(dark, { x: 0.65, y: 0.45, z: 0.25 }, { x: 0, y: 1.05, z: -1.3 }, 'cryo_vitals_housing', true));
        root.add(this._box(cyanGlow, { x: 0.48, y: 0.24, z: 0.04 }, { x: 0, y: 1.12, z: -1.18 }, 'cryo_ecg_screen'));
        // Conduites de fréon réfrigérant liquide sous le caisson
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._segment(dark, new T.Vector3(side * 0.72, 0.2, -1.2), new T.Vector3(side * 0.72, 0.2, 1.2), 0.065, 0.065, `cryo_freon_line_${side}`, 10));
        }
      } else if (normalizedType === 'hive_pheromone_spore') {
        // Chantier 113 : Système de Pulvérisation de Phéromones de Ruche & Brume Organique Épaississante (Aliens: Genocide / Isolation)
        const sporeChitin = this._material('resin', { color: 0x451a03, roughness: 0.35, metalness: 0.3 });
        const amberGlow = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 3.2 });
        // Bulbe organique mural suspendu
        root.add(this._ellipsoid(sporeChitin, { x: 0.85, y: 1.1, z: 0.85 }, { x: 0, y: 1.6, z: 0 }, 'pheromone_bulb_core', 18));
        // Pores d'expulsion de phéromones bioluminescents
        for (let p = 0; p < 5; p++) {
          const ang = (p / 5) * Math.PI * 2;
          root.add(this._ellipsoid(amberGlow, { x: 0.18, y: 0.18, z: 0.14 }, { x: Math.cos(ang) * 0.75, y: 1.6 + (p % 2) * 0.25, z: Math.sin(ang) * 0.75 }, `pheromone_pore_${p}`, 10));
        }
        // Tentacules d'ancrage le long de la cloison
        for (let t = 0; t < 4; t++) {
          const tang = (t / 4) * Math.PI * 2;
          root.add(this._tube(sporeChitin, [
            { x: Math.cos(tang) * 0.5, y: 2.2, z: Math.sin(tang) * 0.5 },
            { x: Math.cos(tang) * 1.1, y: 2.6, z: Math.sin(tang) * 1.1 },
            { x: Math.cos(tang) * 1.4, y: 3.0, z: Math.sin(tang) * 1.4 }
          ], 0.08, `pheromone_root_tendril_${t}`, 12, 5));
        }
      } else if (normalizedType === 'barbed_wire_spool' || normalizedType === 'concertina_wire') {
        // Chantier 114 : Unité Tactique USCM "Combat Engineer" & Rouleau de Fil Barbelé Rasoir Électrifié (Aliens: Dark Descent)
        const wireSteel = this._material('industrial', { color: 0x64748b, roughness: 0.35, metalness: 0.95 });
        const shockGlow = this._material('emissiveGreen', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.5 });
        // Trépieds de fixation USCM aux extrémités
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._segment(dark, new T.Vector3(side * 1.4, 0, 0), new T.Vector3(side * 1.4, 0.75, 0), 0.05, 0.04, `wire_post_${side}`, 8));
          root.add(this._box(shockGlow, { x: 0.14, y: 0.14, z: 0.14 }, { x: side * 1.4, y: 0.8, z: 0 }, `wire_insulator_${side}`));
        }
        // Spirale de concertina barbelé en 6 anneaux entrelacés
        for (let r = 0; r < 6; r++) {
          const xPos = -1.15 + r * 0.46;
          root.add(this._ring(wireSteel, 0.42, 0.035, { x: xPos, y: 0.42, z: 0 }, { x: 0, y: Math.PI / 2, z: 0 }, `concertina_coil_${r}`));
          root.add(this._coneAlong(shockGlow, { x: xPos, y: 0.8, z: 0 }, { x: 0, y: 1, z: 0 }, 0.03, 0.14, `razor_barb_${r}`, 6));
        }
      } else if (normalizedType === 'flight_recorder_box' || normalizedType === 'flight_recorder') {
        // Chantier 115 : Composant Diégétique "Weyland-Yutani Flight Recorder / Boîte Noire M7" (Alien: Isolation)
        const orangeBox = this._material('industrial', { color: 0xea580c, roughness: 0.3, metalness: 0.65 });
        const strobeLed = this._material('emissiveAmber', { color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 3.5 });
        // Boîtier blindé étanche anti-crash orange vif
        root.add(this._box(orangeBox, { x: 0.65, y: 0.45, z: 0.52 }, { x: 0, y: 0.24, z: 0 }, 'flight_recorder_chassis', true));
        // Poignée de préhension métallique supérieure
        root.add(this._box(dark, { x: 0.38, y: 0.14, z: 0.06 }, { x: 0, y: 0.52, z: 0 }, 'flight_recorder_handle'));
        // Balise acoustique sous-marine cylindrique Pinger & LED stroboscopique
        root.add(this._segment(dark, new T.Vector3(0.2, 0.25, 0.28), new T.Vector3(0.2, 0.25, 0.48), 0.06, 0.05, 'flight_recorder_pinger', 10));
        root.add(this._ellipsoid(strobeLed, { x: 0.05, y: 0.05, z: 0.05 }, { x: -0.18, y: 0.48, z: 0 }, 'flight_recorder_beacon_led', 8));
      } else if (normalizedType === 'auxiliary_generator_board' || normalizedType === 'generator_board') {
        // Chantier 117 : Système de Sabotage du Générateur Auxiliaire & Blackout Total d'Étage (Alien 1979 / Isolation)
        const panelMat = this._material('industrial', { color: 0x334155, roughness: 0.38, metalness: 0.75 });
        const copperBus = this._material('chitinWarm', { color: 0xd97706, roughness: 0.25, metalness: 0.95 });
        const greenLed = this._material('emissiveGreen', { color: 0x22c55e, emissiveIntensity: 2.2 });
        const redLed = this._material('emissiveRed', { color: 0xef4444, emissiveIntensity: 2.2 });
        // Armoire électrique murale 380V (largeur 2.4m, hauteur 2.8m)
        root.add(this._box(panelMat, { x: 2.4, y: 2.8, z: 0.65 }, { x: 0, y: 1.4, z: 0 }, 'generator_board_casing', true));
        // 3 Barres omnibus en cuivre massif sectionnables
        for (let b = -1; b <= 1; b++) {
          root.add(this._box(copperBus, { x: 0.16, y: 2.1, z: 0.08 }, { x: b * 0.65, y: 1.4, z: 0.34 }, `generator_copper_bus_${b}`));
          root.add(this._ellipsoid(greenLed, { x: 0.06, y: 0.06, z: 0.04 }, { x: b * 0.65, y: 2.5, z: 0.35 }, `generator_power_led_${b}`, 8));
        }
        // Sectionneur principal rotatif d'urgence
        root.add(this._ring(redLed, 0.22, 0.04, { x: 0, y: 0.6, z: 0.35 }, { x: 0, y: 0, z: 0 }, 'generator_main_disconnect'));
      } else if (normalizedType === 'laser_designator_turret' || normalizedType === 'laser_designator') {
        // Chantier 118 : Tourelle Laser de Pointage & Faisceau de Marquage Orbital USCM (Aliens 1986 / Fireteam Elite)
        const uscmGreen = this._material('industrial', { color: 0x3f4d2a, roughness: 0.38, metalness: 0.72 });
        const targetingLaser = this._material('emissiveRed', { color: 0xef4444, emissiveIntensity: 4.8 });
        // Trépied bas pliant M3
        for (let leg = 0; leg < 3; leg++) {
          const ang = (leg / 3) * Math.PI * 2;
          root.add(this._segment(dark, new T.Vector3(0, 0.45, 0), new T.Vector3(Math.cos(ang) * 0.52, 0.02, Math.sin(ang) * 0.52), 0.04, 0.03, `laser_tripod_leg_${leg}`, 8));
        }
        // Tourelle pivotante et optique laser rouge
        root.add(this._segment(uscmGreen, new T.Vector3(0, 0.45, 0), new T.Vector3(0, 0.95, 0), 0.18, 0.16, 'laser_turret_pivot', 12));
        root.add(this._box(uscmGreen, { x: 0.35, y: 0.28, z: 0.65 }, { x: 0, y: 0.98, z: 0.1 }, 'laser_sensor_head', true));
        root.add(this._segment(targetingLaser, new T.Vector3(0, 0.98, 0.42), new T.Vector3(0, 0.98, 1.25), 0.025, 0.02, 'laser_targeting_beam', 8));
      } else if (normalizedType === 'orbital_docking_clamp' || normalizedType === 'docking_clamp') {
        // Chantier 120 : Sas d'Amarrage de Module Orbital de Secours & Découplage Explosif (Alien: Romulus 2024)
        const forgedSteel = this._material('industrial', { color: 0x475569, roughness: 0.3, metalness: 0.92 });
        const pyroBolt = this._material('emissiveAmber', { color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 3.5 });
        // Anneau d'accouplement lourd de 3.2m de diamètre
        root.add(this._ring(forgedSteel, 1.6, 0.18, { x: 0, y: 1.8, z: 0 }, { x: 0, y: 0, z: 0 }, 'docking_clamp_ring'));
        // 4 Mâchoires de verrouillage hydrauliques avec boulons pyrotechniques ambrés
        for (let jaw = 0; jaw < 4; jaw++) {
          const jang = (jaw / 4) * Math.PI * 2;
          const jx = Math.cos(jang) * 1.55;
          const jy = 1.8 + Math.sin(jang) * 1.55;
          root.add(this._box(dark, { x: 0.38, y: 0.45, z: 0.35 }, { x: jx, y: jy, z: 0.1 }, `docking_jaw_${jaw}`, true));
          root.add(this._ellipsoid(pyroBolt, { x: 0.08, y: 0.08, z: 0.12 }, { x: jx, y: jy, z: 0.3 }, `pyro_explosive_bolt_${jaw}`, 8));
        }
      } else if (normalizedType === 'forklift_vehicle' || normalizedType === 'forklift') {
        // Chantier 122 : Chariot Élévateur & Batteries Industrielles au Lithium Weyland (Alien: Isolation)
        const safetyYellow = this._material('industrial', { color: 0xeab308, roughness: 0.35, metalness: 0.65 });
        const heavyRubber = this._material('darkMetal', { color: 0x09090b, roughness: 0.85, metalness: 0.1 });
        const forgedForks = this._material('darkMetal', { color: 0x27272a, roughness: 0.25, metalness: 0.95 });
        const lithiumBattery = this._material('emissiveGreen', { color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 2.2 });
        // Châssis principal lourd
        root.add(this._box(safetyYellow, { x: 1.8, y: 0.72, z: 2.8 }, { x: 0, y: 0.55, z: 0 }, 'forklift_chassis', true));
        // 4 Roues de manutention massives
        for (let w = 0; w < 4; w++) {
          const wx = (w % 2 === 0 ? -1 : 1) * 0.95;
          const wz = (w < 2 ? -1 : 1) * 1.05;
          root.add(this._cylinder(heavyRubber, 0.38, 0.38, 0.28, { x: wx, y: 0.38, z: wz }, { x: 0, y: 0, z: Math.PI / 2 }, `forklift_wheel_${w}`));
        }
        // Cage de protection cabine conducteur (arceaux tubulaires)
        for (let post = 0; post < 4; post++) {
          const px = (post % 2 === 0 ? -1 : 1) * 0.72;
          const pz = (post < 2 ? -1 : 1) * 0.65;
          root.add(this._segment(dark, new T.Vector3(px, 0.9, pz), new T.Vector3(px, 2.3, pz), 0.045, 0.045, `cage_post_${post}`, 8));
        }
        root.add(this._box(dark, { x: 1.5, y: 0.08, z: 1.4 }, { x: 0, y: 2.32, z: 0 }, 'cage_roof'));
        // Mât élévateur vertical à l'avant
        root.add(this._segment(dark, new T.Vector3(-0.55, 0.2, 1.45), new T.Vector3(-0.55, 2.8, 1.45), 0.08, 0.08, 'forklift_mast_left', 8));
        root.add(this._segment(dark, new T.Vector3(0.55, 0.2, 1.45), new T.Vector3(0.55, 2.8, 1.45), 0.08, 0.08, 'forklift_mast_right', 8));
        // Tablier et fourches horizontales d'acier
        root.add(this._box(forgedForks, { x: 1.35, y: 0.45, z: 0.12 }, { x: 0, y: 0.35, z: 1.5 }, 'fork_carriage', true));
        root.add(this._box(forgedForks, { x: 0.14, y: 0.06, z: 1.55 }, { x: -0.38, y: 0.12, z: 2.25 }, 'fork_blade_left', true));
        root.add(this._box(forgedForks, { x: 0.14, y: 0.06, z: 1.55 }, { x: 0.38, y: 0.12, z: 2.25 }, 'fork_blade_right', true));
        // Pack de batteries lithium Weyland haute capacité à l'arrière
        root.add(this._box(lithiumBattery, { x: 1.3, y: 0.55, z: 0.55 }, { x: 0, y: 0.85, z: -1.1 }, 'lithium_battery_pack'));
      } else if (normalizedType === 'ceiling_fire_sprinkler' || normalizedType === 'fire_sprinkler') {
        // Chantier 124 : Système d'Arroseurs Automatiques Incendie (Alien 1979 / Isolation)
        const brassMat = this._material('industrial', { color: 0xd97706, roughness: 0.25, metalness: 0.88 });
        const thermalBulb = this._material('emissiveRed', { color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 2.8 });
        // Conduite descendante depuis le plafond (fixée à y=5.8m)
        root.add(this._segment(dark, new T.Vector3(0, 5.8, 0), new T.Vector3(0, 5.35, 0), 0.06, 0.05, 'sprinkler_pipe', 8));
        // Corps de buse fileté en laiton doré
        root.add(this._cylinder(brassMat, 0.1, 0.12, 0.18, { x: 0, y: 5.25, z: 0 }, { x: 0, y: 0, z: 0 }, 'sprinkler_brass_body'));
        // Ampoule de déclenchement thermique rouge
        root.add(this._ellipsoid(thermalBulb, { x: 0.035, y: 0.08, z: 0.035 }, { x: 0, y: 5.14, z: 0 }, 'sprinkler_thermal_bulb', 8));
        // Déflecteur d'arrosage dentelé crénelé en étoile
        root.add(this._cylinder(brassMat, 0.18, 0.04, 0.025, { x: 0, y: 5.05, z: 0 }, { x: 0, y: 0, z: 0 }, 'sprinkler_deflector_plate'));
      } else if (normalizedType === 'toxic_waste_chute' || normalizedType === 'waste_chute') {
        // Chantier 127 : Sas de Décharge Déchets Toxiques Fiorina 161 (Alien 3)
        const castIron = this._material('darkMetal', { color: 0x334155, roughness: 0.75, metalness: 0.45 });
        const vacuumIndicator = this._material('emissiveCyan', { color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 2.5 });
        // Trémie cylindrique industrielle lourde
        root.add(this._cylinder(castIron, 1.25, 1.05, 1.85, { x: 0, y: 0.95, z: 0 }, { x: 0, y: 0, z: 0 }, 'waste_chute_hopper'));
        // Clapet guillotine d'obstruction scellé par vérins
        root.add(this._box(dark, { x: 1.45, y: 0.22, z: 1.45 }, { x: 0, y: 1.85, z: 0 }, 'waste_chute_gate_valve', true));
        // Voyant et hublot d'aspiration sous-vide
        root.add(this._cylinder(vacuumIndicator, 0.35, 0.35, 0.05, { x: 0, y: 1.15, z: 1.12 }, { x: Math.PI / 2, y: 0, z: 0 }, 'vacuum_sight_glass'));
      } else if (normalizedType === 'portable_mortar_turret' || normalizedType === 'mortar_turret') {
        // Chantier 128 : Tourelle Portative Mortier M40 USCM à Shrapnel (Aliens: Fireteam Elite)
        const uscmOlive = this._material('industrial', { color: 0x15803d, roughness: 0.45, metalness: 0.55 });
        const mortarBarrel = this._material('darkMetal', { color: 0x18181b, roughness: 0.28, metalness: 0.92 });
        // Trépied de tranchée stabilisé
        for (let l = 0; l < 3; l++) {
          const lang = (l / 3) * Math.PI * 2;
          root.add(this._segment(dark, new T.Vector3(0, 0.48, 0), new T.Vector3(Math.cos(lang) * 0.65, 0.02, Math.sin(lang) * 0.65), 0.05, 0.035, `mortar_leg_${l}`, 8));
        }
        // Tube de mortier lourd incliné à 60°
        const barrelEnd = new T.Vector3(0, 1.15, 0.65);
        root.add(this._segment(mortarBarrel, new T.Vector3(0, 0.48, 0), barrelEnd, 0.12, 0.09, 'mortar_cannon_tube', 12));
        // Chargeur rotatif de shrapnels 4 obus
        root.add(this._cylinder(uscmOlive, 0.24, 0.24, 0.28, { x: 0.22, y: 0.65, z: 0.18 }, { x: 0.45, y: 0, z: 0 }, 'mortar_rotary_magazine'));
      } else if (normalizedType === 'narcissus_docking_port' || normalizedType === 'narcissus_dock') {
        // Chantier 130 : Sas d'Amarrage Navette de Sauvetage Narcissus (Alien 1979)
        const hullWhite = this._material('industrial', { color: 0xe2e8f0, roughness: 0.35, metalness: 0.72 });
        const greenBeacon = this._material('emissiveGreen', { color: 0x10b981, emissive: 0x059669, emissiveIntensity: 3.2 });
        // Anneau d'accouplement lourd de 3.8m d'envergure
        root.add(this._ring(hullWhite, 1.9, 0.25, { x: 0, y: 2.2, z: 0 }, { x: 0, y: 0, z: 0 }, 'narcissus_docking_ring'));
        // 4 Feux de guidage vert émeraude de pressurisation
        for (let b = 0; b < 4; b++) {
          const bang = (b / 4) * Math.PI * 2;
          const bx = Math.cos(bang) * 1.85;
          const by = 2.2 + Math.sin(bang) * 1.85;
          root.add(this._ellipsoid(greenBeacon, { x: 0.09, y: 0.09, z: 0.12 }, { x: bx, y: by, z: 0.2 }, `narcissus_beacon_${b}`, 8));
        }
        // Console de commande de déverrouillage manuel
        root.add(this._box(dark, { x: 0.65, y: 0.85, z: 0.25 }, { x: -2.3, y: 1.4, z: 0.2 }, 'narcissus_manual_console', true));
      } else if (normalizedType === 'm577_apc' || normalizedType === 'apc') {
        // Chantier 132 : Véhicule Blindé de Transport de Troupes M577 APC USCM (Aliens 1986)
        const uscmArmor = this._material('industrial', { color: 0x166534, roughness: 0.45, metalness: 0.65 });
        const heavyTire = this._material('darkMetal', { color: 0x09090b, roughness: 0.9, metalness: 0.05 });
        const cannonMetal = this._material('darkMetal', { color: 0x18181b, roughness: 0.25, metalness: 0.92 });
        // Châssis blindé incliné titane/céramique
        root.add(this._box(uscmArmor, { x: 3.2, y: 1.5, z: 6.4 }, { x: 0, y: 1.25, z: 0 }, 'apc_hull_main', true));
        // Glacis avant incliné à 45°
        const glacis = this._box(uscmArmor, { x: 3.15, y: 1.1, z: 1.6 }, { x: 0, y: 1.45, z: 2.8 }, 'apc_glacis', true);
        glacis.rotation.x = -0.45;
        root.add(glacis);
        // 4 Roues motrices géantes tout-terrain (diamètre 1.3m)
        for (let rw = 0; rw < 4; rw++) {
          const rwx = (rw % 2 === 0 ? -1 : 1) * 1.72;
          const rwz = (rw < 2 ? -1 : 1) * 2.1;
          root.add(this._cylinder(heavyTire, 0.65, 0.65, 0.48, { x: rwx, y: 0.65, z: rwz }, { x: 0, y: 0, z: Math.PI / 2 }, `apc_wheel_${rw}`));
        }
        // Tourelle double canon 20mm Boyars escamotable sur le toit
        root.add(this._cylinder(cannonMetal, 0.62, 0.68, 0.35, { x: 0.75, y: 2.2, z: -1.2 }, { x: 0, y: 0, z: 0 }, 'apc_turret_base'));
        root.add(this._segment(cannonMetal, new T.Vector3(0.65, 2.3, -1.2), new T.Vector3(0.65, 2.3, 1.4), 0.06, 0.05, 'apc_cannon_barrel_left', 8));
        root.add(this._segment(cannonMetal, new T.Vector3(0.85, 2.3, -1.2), new T.Vector3(0.85, 2.3, 1.4), 0.06, 0.05, 'apc_cannon_barrel_right', 8));
      } else if (normalizedType === 'water_droplet_vent' || normalizedType === 'droplet_vent') {
        // Chantier 134 : Sas de Condensation & Chutes de Gouttes d'Eau Industrielles (Alien 1979)
        const copperPipe = this._material('industrial', { color: 0xb45309, roughness: 0.4, metalness: 0.78 });
        const cyanWater = this._material('emissiveCyan', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.4 });
        // Grille de condensation au plafond (Y=5.5m)
        root.add(this._box(dark, { x: 2.2, y: 0.15, z: 2.2 }, { x: 0, y: 5.5, z: 0 }, 'droplet_ceiling_grate', true));
        root.add(this._segment(copperPipe, new T.Vector3(-0.9, 5.5, 0), new T.Vector3(0.9, 5.5, 0), 0.08, 0.08, 'condenser_pipe', 8));
        // Goutteurs d'eau volumétriques suspendus
        for (let g = 0; g < 4; g++) {
          const gx = (g % 2 === 0 ? -0.55 : 0.55);
          const gz = (g < 2 ? -0.55 : 0.55);
          root.add(this._ellipsoid(cyanWater, { x: 0.04, y: 0.09, z: 0.04 }, { x: gx, y: 5.3, z: gz }, `droplet_bead_${g}`, 8));
        }
      } else if (normalizedType === 'wall_defibrillator' || normalizedType === 'defibrillator') {
        // Chantier 135 : Défibrillateur Médical Mural Seegson & Surcharge 5000V (Alien: Isolation)
        const seegsonWhite = this._material('industrial', { color: 0xf8fafc, roughness: 0.25, metalness: 0.45 });
        const shockVolt = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 3.0 });
        const paddleRed = this._material('emissiveRed', { color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 1.8 });
        // Boîtier mural fixé à Y=1.5m
        root.add(this._box(seegsonWhite, { x: 0.75, y: 0.95, z: 0.28 }, { x: 0, y: 1.5, z: 0 }, 'defib_housing', true));
        // Écran indicateur de charge 5000V
        root.add(this._box(shockVolt, { x: 0.45, y: 0.25, z: 0.04 }, { x: 0, y: 1.75, z: 0.15 }, 'defib_voltage_meter'));
        // Deux palettes de réanimation
        root.add(this._box(paddleRed, { x: 0.18, y: 0.28, z: 0.14 }, { x: -0.22, y: 1.35, z: 0.16 }, 'defib_paddle_left', true));
        root.add(this._box(dark, { x: 0.18, y: 0.28, z: 0.14 }, { x: 0.22, y: 1.35, z: 0.16 }, 'defib_paddle_right', true));
      } else if (normalizedType === 'reaction_purge_vent' || normalizedType === 'purge_vent') {
        // Chantier 137 : Sas de Purge Dépressurisation SAS C-30 avec Vents de Propulsion (Alien: Romulus)
        const blastAlloy = this._material('industrial', { color: 0x334155, roughness: 0.5, metalness: 0.8 });
        const jetGlow = this._material('emissiveAmber', { color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 3.2 });
        // Buse d'éjection conique de tuyère
        root.add(this._cylinder(blastAlloy, 0.95, 1.45, 1.8, { x: 0, y: 1.2, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'purge_thruster_nozzle'));
        // Dôme intérieur de combustion ionique
        root.add(this._ellipsoid(jetGlow, { x: 0.65, y: 0.65, z: 0.4 }, { x: 0, y: 1.2, z: 0.65 }, 'purge_jet_glow', 16));
      } else if (normalizedType === 'thermal_surveillance_post' || normalizedType === 'surveillance_post') {
        // Chantier 138 : Caméra de Surveillance Thermique Rotative USCM & Écran CRT (Aliens 1986 / Isolation)
        const uscmMat = this._material('industrial', { color: 0x15803d, roughness: 0.45, metalness: 0.55 });
        const crtScreen = this._material('emissiveRed', { color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 2.2 });
        // Pupitre de console de surveillance
        root.add(this._box(uscmMat, { x: 1.4, y: 1.1, z: 0.8 }, { x: 0, y: 0.55, z: 0 }, 'thermal_desk_base', true));
        root.add(this._box(dark, { x: 1.25, y: 0.7, z: 0.25 }, { x: 0, y: 1.35, z: -0.15 }, 'thermal_crt_housing', true));
        root.add(this._box(crtScreen, { x: 1.05, y: 0.52, z: 0.04 }, { x: 0, y: 1.35, z: -0.02 }, 'thermal_crt_display'));
        // Caméra sur mât
        root.add(this._segment(dark, new T.Vector3(0.55, 1.1, 0.25), new T.Vector3(0.55, 2.2, 0.25), 0.04, 0.04, 'camera_mast', 8));
        root.add(this._box(dark, { x: 0.22, y: 0.16, z: 0.35 }, { x: 0.55, y: 2.22, z: 0.25 }, 'thermal_camera_head', true));
      } else if (normalizedType === 'reactor_disconnect_console' || normalizedType === 'reactor_console') {
        // Chantier 140 : Console de Déconnexion du Réacteur Principal & Sirène d'Évacuation (Aliens 1986)
        const reactorMetal = this._material('darkMetal', { color: 0x1e293b, roughness: 0.3, metalness: 0.85 });
        const sirenBeacon = this._material('emissiveRed', { color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 3.5 });
        // Pupitre hexagonal central
        root.add(this._cylinder(reactorMetal, 1.2, 1.35, 1.1, { x: 0, y: 0.55, z: 0 }, { x: 0, y: 0, z: 0 }, 'reactor_console_base'));
        // 4 Leviers de déconnexion manuelle
        for (let lv = 0; lv < 4; lv++) {
          const lvang = (lv / 4) * Math.PI * 2;
          const lx = Math.cos(lvang) * 0.75;
          const lz = Math.sin(lvang) * 0.75;
          root.add(this._segment(dark, new T.Vector3(lx, 1.1, lz), new T.Vector3(lx * 1.15, 1.45, lz * 1.15), 0.035, 0.025, `reactor_lever_${lv}`, 8));
        }
        // Gyrophare d'alarme rouge d'évacuation générale
        root.add(this._cylinder(sirenBeacon, 0.16, 0.18, 0.28, { x: 0, y: 1.25, z: 0 }, { x: 0, y: 0, z: 0 }, 'evacuation_alarm_siren'));
      } else if (normalizedType === 'subzero_coolant_panel' || normalizedType === 'coolant_panel') {
        // Chantier 142 : Panneau de Réfrigération Cryogénique Sub-Zero Coolant (Alien 1979 / Romulus)
        const cryoMetal = this._material('darkMetal', { color: 0x0f172a, roughness: 0.25, metalness: 0.9 });
        const frostedPipe = this._material('industrial', { color: 0x38bdf8, roughness: 0.2, metalness: 0.85 });
        const pressureGauge = this._material('emissiveBlue', { color: 0x0284c7, emissive: 0x38bdf8, emissiveIntensity: 2.4 });
        root.add(this._box(cryoMetal, { x: 1.6, y: 2.2, z: 0.55 }, { x: 0, y: 1.1, z: 0 }, 'coolant_chassis', true));
        // Réservoir cryogénique vertical cylindrique LN2
        root.add(this._cylinder(frostedPipe, 0.35, 0.35, 1.8, { x: 0, y: 1.1, z: 0.35 }, { x: 0, y: 0, z: 0 }, 'ln2_coolant_cylinder'));
        // Manomètre de pression 120 bars
        root.add(this._cylinder(pressureGauge, 0.18, 0.18, 0.08, { x: 0.45, y: 1.6, z: 0.32 }, { x: Math.PI / 2, y: 0, z: 0 }, 'gauge_120bars'));
      } else if (normalizedType === 'm42a_sniper_post' || normalizedType === 'sniper_post') {
        // Chantier 143 : Fusil de Sniper Smart-Scoped M42A Scoped Pulse Rifle sur Trépied (Colonial Marines / Fireteam Elite)
        const rifleMetal = this._material('darkMetal', { color: 0x18181b, roughness: 0.3, metalness: 0.85 });
        const uscmGreen = this._material('industrial', { color: 0x166534, roughness: 0.4, metalness: 0.6 });
        const thermalScope = this._material('emissiveRed', { color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 2.8 });
        // Trépied de maintien
        for (let leg = 0; leg < 3; leg++) {
          const a = (leg / 3) * Math.PI * 2;
          root.add(this._segment(rifleMetal, new T.Vector3(0, 1.15, 0), new T.Vector3(Math.cos(a) * 0.55, 0, Math.sin(a) * 0.55), 0.03, 0.02, `tripod_leg_${leg}`, 8));
        }
        // Boîtier M42A 10x30mm long
        root.add(this._box(uscmGreen, { x: 0.16, y: 0.22, z: 1.4 }, { x: 0, y: 1.25, z: 0.1 }, 'm42a_body', true));
        root.add(this._cylinder(rifleMetal, 0.04, 0.04, 1.2, { x: 0, y: 1.28, z: 0.95 }, { x: Math.PI / 2, y: 0, z: 0 }, 'm42a_barrel'));
        // Viseur optique thermique rouge
        root.add(this._box(thermalScope, { x: 0.12, y: 0.14, z: 0.45 }, { x: 0, y: 1.45, z: 0.05 }, 'm42a_thermal_scope'));
      } else if (normalizedType === 'underfloor_grate' || normalizedType === 'floor_grate') {
        // Chantier 144 : Trappe de Plancher de Conduits Techniques (Alien 3 / Isolation)
        const grateMetal = this._material('darkMetal', { color: 0x334155, roughness: 0.55, metalness: 0.75 });
        const pitDarkness = this._material('darkMetal', { color: 0x020617, roughness: 0.95, metalness: 0.05 });
        // Fosse sous-plancher
        root.add(this._box(pitDarkness, { x: 1.8, y: 0.8, z: 1.8 }, { x: 0, y: -0.4, z: 0 }, 'underfloor_pit', true));
        // Cadre de caillebotis avec barres métalliques ajourées
        root.add(this._box(grateMetal, { x: 1.9, y: 0.06, z: 1.9 }, { x: 0, y: 0.03, z: 0 }, 'grate_frame', true));
        for (let bar = -4; bar <= 4; bar++) {
          root.add(this._box(grateMetal, { x: 1.7, y: 0.05, z: 0.08 }, { x: 0, y: 0.04, z: bar * 0.18 }, `grate_bar_${bar}`));
        }
      } else if (normalizedType === 'bulkhead_blast_shutter_console' || normalizedType === 'shutter_console') {
        // Chantier 145 : Console de Contrôle des Volets Anti-Souffle de Confinement (Alien 1979 / Aliens 1986)
        const consoleChassis = this._material('industrial', { color: 0x475569, roughness: 0.4, metalness: 0.65 });
        const yellowLight = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 2.5 });
        root.add(this._box(consoleChassis, { x: 1.35, y: 1.3, z: 0.7 }, { x: 0, y: 0.65, z: 0 }, 'shutter_console_chassis', true));
        root.add(this._box(dark, { x: 1.15, y: 0.6, z: 0.15 }, { x: 0, y: 1.35, z: -0.1 }, 'shutter_console_panel', true));
        // 3 Voyants d'état de sas étanches
        for (let ind = 0; ind < 3; ind++) {
          root.add(this._cylinder(yellowLight, 0.06, 0.06, 0.04, { x: (ind - 1) * 0.32, y: 1.38, z: 0.02 }, { x: Math.PI / 2, y: 0, z: 0 }, `shutter_indicator_${ind}`));
        }
      } else if (normalizedType === 'synthetic_charging_bay' || normalizedType === 'charging_bay') {
        // Chantier 147 : Module de Recharge pour Androïdes Seegson (Alien: Isolation)
        const seegsonMetal = this._material('darkMetal', { color: 0x1e293b, roughness: 0.35, metalness: 0.8 });
        const synthFluid = this._material('chitinWarm', { color: 0xf8fafc, roughness: 0.1, metalness: 0.1 });
        const coilAmber = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xb45309, emissiveIntensity: 2.2 });
        // Alcôve verticale 2.5m
        root.add(this._box(seegsonMetal, { x: 1.2, y: 2.6, z: 0.8 }, { x: 0, y: 1.3, z: -0.2 }, 'charging_alcove', true));
        // Flacon collecteur de liquide laiteux synthétique blanc
        root.add(this._cylinder(synthFluid, 0.15, 0.15, 0.85, { x: 0.45, y: 1.4, z: 0.2 }, { x: 0, y: 0, z: 0 }, 'synthetic_fluid_canister'));
        // Bobines électromagnétiques de charge 400V
        root.add(this._cylinder(coilAmber, 0.25, 0.25, 0.12, { x: 0, y: 2.2, z: 0.1 }, { x: 0, y: 0, z: 0 }, 'charging_coil_top'));
      } else if (normalizedType === 'holographic_decoy_projector' || normalizedType === 'decoy_projector') {
        // Chantier 148 : Projecteurs Holographiques Tactiques de Fausse Piste (Aliens: Dark Descent)
        const emitterMetal = this._material('darkMetal', { color: 0x09090b, roughness: 0.4, metalness: 0.85 });
        const blueLaser = this._material('emissiveBlue', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 3.5 });
        // Socle sur trépied
        for (let l = 0; l < 3; l++) {
          const la = (l / 3) * Math.PI * 2;
          root.add(this._segment(emitterMetal, new T.Vector3(0, 0.65, 0), new T.Vector3(Math.cos(la) * 0.4, 0, Math.sin(la) * 0.4), 0.025, 0.02, `decoy_leg_${l}`, 6));
        }
        // Lentille holographique rotative émettrice
        root.add(this._cylinder(emitterMetal, 0.22, 0.28, 0.4, { x: 0, y: 0.75, z: 0 }, { x: 0, y: 0, z: 0 }, 'emitter_housing'));
        root.add(this._sphere(blueLaser, 0.16, { x: 0, y: 1.0, z: 0 }, 'holo_emitter_lens'));
      } else if (normalizedType === 'atmospheric_depression_console' || normalizedType === 'depression_console') {
        // Chantier 150 : Console de Purge Atmosphérique M.U.T.H.U.R. & Dépression N2/O2 (Alien 1979 / Romulus)
        const muthurConsole = this._material('darkMetal', { color: 0x0f172a, roughness: 0.28, metalness: 0.88 });
        const gasCyan = this._material('emissiveBlue', { color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 2.6 });
        const redLever = this._material('emissiveRed', { color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 2.0 });
        root.add(this._box(muthurConsole, { x: 1.5, y: 1.4, z: 0.75 }, { x: 0, y: 0.7, z: 0 }, 'muthur_atmo_chassis', true));
        // Manomètres O2 / N2 circulaires rétro
        root.add(this._cylinder(gasCyan, 0.15, 0.15, 0.05, { x: -0.35, y: 1.45, z: 0.25 }, { x: Math.PI / 2, y: 0, z: 0 }, 'o2_gauge'));
        root.add(this._cylinder(gasCyan, 0.15, 0.15, 0.05, { x: 0.35, y: 1.45, z: 0.25 }, { x: Math.PI / 2, y: 0, z: 0 }, 'n2_gauge'));
        // Levier guillotine d'évacuation d'urgence
        root.add(this._box(redLever, { x: 0.08, y: 0.4, z: 0.08 }, { x: 0, y: 1.48, z: 0.32 }, 'emergency_dump_lever'));
      } else if (normalizedType === 'sadar_rocket_launcher' || normalizedType === 'sadar_launcher') {
        // Chantier 152 : Affût Lance-Roquettes M83A2 SADAR USCM (Aliens 1986 / Dark Descent)
        const tubeOlive = this._material('industrial', { color: 0x3f4f2c, roughness: 0.45, metalness: 0.6 });
        const darkMech = this._material('darkMetal', { color: 0x18181b, roughness: 0.3, metalness: 0.85 });
        const rocketTip = this._material('hazard', { color: 0xeab308, roughness: 0.35, metalness: 0.7 });
        // Trépied de support
        for (let l = 0; l < 3; l++) {
          const la = (l / 3) * Math.PI * 2;
          root.add(this._segment(darkMech, new T.Vector3(0, 0.7, 0), new T.Vector3(Math.cos(la) * 0.55, 0, Math.sin(la) * 0.55), 0.035, 0.025, `sadar_leg_${l}`, 6));
        }
        // Tube lanceur 80mm
        root.add(this._cylinder(tubeOlive, 0.16, 0.16, 1.6, { x: 0, y: 0.85, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'sadar_tube'));
        // Tête de roquette prête au tir
        root.add(this._cylinder(rocketTip, 0.14, 0.02, 0.28, { x: 0, y: 0.85, z: 0.9 }, { x: Math.PI / 2, y: 0, z: 0 }, 'sadar_rocket_head'));
      } else if (normalizedType === 'hydraulic_oil_pipe' || normalizedType === 'oil_pipe') {
        // Chantier 153 : Réseau de Canalisations d'Huile Hydraulique & Nappe Inflammable (Alien 1979 / Isolation)
        const pipeMetal = this._material('darkMetal', { color: 0x334155, roughness: 0.35, metalness: 0.85 });
        const redValve = this._material('emissiveRed', { color: 0xdc2626, emissive: 0x991b1b, emissiveIntensity: 1.8 });
        const oilSlick = this._material('chitin', { color: 0x09090b, roughness: 0.08, metalness: 0.95 });
        // Colonne de conduite verticale
        root.add(this._cylinder(pipeMetal, 0.18, 0.18, 2.8, { x: 0, y: 1.4, z: 0 }, { x: 0, y: 0, z: 0 }, 'hydraulic_pipe_main'));
        // Vanne quart-de-tour rouge
        root.add(this._cylinder(redValve, 0.22, 0.22, 0.08, { x: 0.22, y: 1.5, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, 'hydraulic_pipe_valve'));
        // Nappe de carter d'huile au sol
        root.add(this._cylinder(oilSlick, 1.4, 1.4, 0.02, { x: 0, y: 0.01, z: 0 }, { x: 0, y: 0, z: 0 }, 'oil_slick_puddle'));
      } else if (normalizedType === 'laser_decon_arch' || normalizedType === 'decon_arch') {
        // Chantier 154 : SAS de Quarantaine Médicale avec Champ Laser Bio-Sécurisé (Alien 3 / Romulus)
        const medFrame = this._material('industrial', { color: 0xf8fafc, roughness: 0.25, metalness: 0.65 });
        const uvLaser = this._material('emissiveBlue', { color: 0xc084fc, emissive: 0xa855f7, emissiveIntensity: 3.5 });
        // Portique arche 2.8m
        root.add(this._box(medFrame, { x: 0.25, y: 2.8, z: 0.3 }, { x: -1.2, y: 1.4, z: 0 }, 'arch_pillar_left', true));
        root.add(this._box(medFrame, { x: 0.25, y: 2.8, z: 0.3 }, { x: 1.2, y: 1.4, z: 0 }, 'arch_pillar_right', true));
        root.add(this._box(medFrame, { x: 2.65, y: 0.28, z: 0.3 }, { x: 0, y: 2.7, z: 0 }, 'arch_lintel', true));
        // Rideau de lasers ultraviolets
        for (let b = -4; b <= 4; b++) {
          root.add(this._cylinder(uvLaser, 0.015, 0.015, 2.5, { x: b * 0.24, y: 1.35, z: 0 }, { x: 0, y: 0, z: 0 }, `uv_beam_${b}`));
        }
      } else if (normalizedType === 'magnetic_crane_container' || normalizedType === 'crane_container') {
        // Chantier 156 : Grue de Levage Magnétique & Conteneur Suspendu 10 Tonnes (Alien 1979 / Aliens 1986)
        const craneSteel = this._material('industrial', { color: 0x475569, roughness: 0.45, metalness: 0.8 });
        const cargoYellow = this._material('hazard', { color: 0xd97706, roughness: 0.5, metalness: 0.65 });
        const cableMetal = this._material('darkMetal', { color: 0x0f172a, roughness: 0.2, metalness: 0.95 });
        // Électro-aimant cylindrique suspendu
        root.add(this._cylinder(craneSteel, 0.65, 0.65, 0.45, { x: 0, y: 4.8, z: 0 }, { x: 0, y: 0, z: 0 }, 'magnet_head'));
        // 4 Câbles de suspension en acier
        for (let c = -1; c <= 1; c += 2) {
          root.add(this._cylinder(cableMetal, 0.02, 0.02, 2.2, { x: c * 0.8, y: 3.6, z: 0.6 }, { x: 0, y: 0, z: 0 }, `suspension_cable_${c}_f`));
          root.add(this._cylinder(cableMetal, 0.02, 0.02, 2.2, { x: c * 0.8, y: 3.6, z: -0.6 }, { x: 0, y: 0, z: 0 }, `suspension_cable_${c}_r`));
        }
        // Conteneur de fret Weyland 10T suspendu à 2m du sol
        root.add(this._box(cargoYellow, { x: 2.4, y: 1.8, z: 1.8 }, { x: 0, y: 2.2, z: 0 }, 'cargo_container_10t', true));
      } else if (normalizedType === 'zx76_shotgun_rack' || normalizedType === 'shotgun_rack') {
        // Chantier 157 : Fusil à Pompe Lourd ZX-76 Trench Shotgun sur Râtelier (Alien: Isolation)
        const rackWood = this._material('darkMetal', { color: 0x1e293b, roughness: 0.5, metalness: 0.75 });
        const shotgunMetal = this._material('industrial', { color: 0x09090b, roughness: 0.3, metalness: 0.9 });
        root.add(this._box(rackWood, { x: 1.4, y: 1.8, z: 0.25 }, { x: 0, y: 1.2, z: 0 }, 'shotgun_rack_board', true));
        // 2 Fusils ZX-76 suspendus
        for (let g = 0; g < 2; g++) {
          const gy = 1.0 + g * 0.45;
          root.add(this._box(shotgunMetal, { x: 1.1, y: 0.12, z: 0.08 }, { x: 0, y: gy, z: 0.15 }, `zx76_shotgun_${g}`));
        }
      } else if (normalizedType === 'halon_gas_generator' || normalizedType === 'halon_generator') {
        // Chantier 158 : Générateur de Brouillard Halon Anti-Incendie (Alien 1979 / Isolation)
        const halonBox = this._material('industrial', { color: 0x94a3b8, roughness: 0.35, metalness: 0.7 });
        const greenLed = this._material('emissiveGreen', { color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 2.2 });
        root.add(this._box(halonBox, { x: 0.9, y: 1.2, z: 0.4 }, { x: 0, y: 1.6, z: 0 }, 'halon_generator_chassis', true));
        // Voyant de charge verte
        root.add(this._cylinder(greenLed, 0.06, 0.06, 0.04, { x: 0.25, y: 1.9, z: 0.22 }, { x: Math.PI / 2, y: 0, z: 0 }, 'halon_led'));
        // 3 Buses de diffusion orientées vers le bas
        for (let nz = -1; nz <= 1; nz++) {
          root.add(this._cylinder(halonBox, 0.08, 0.05, 0.25, { x: nz * 0.25, y: 0.9, z: 0.1 }, { x: 0, y: 0, z: 0 }, `halon_nozzle_${nz}`));
        }
      } else if (normalizedType === 'surveillance_radio_console' || normalizedType === 'radio_console') {
        // Chantier 160 : Terminal Central de Surveillance Weyland & Radio USCM (Aliens 1986 / Isolation)
        const radioChassis = this._material('darkMetal', { color: 0x1e1b4b, roughness: 0.4, metalness: 0.85 });
        const screenAmber = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 2.4 });
        root.add(this._box(radioChassis, { x: 1.6, y: 1.3, z: 0.8 }, { x: 0, y: 0.65, z: 0 }, 'radio_console_desk', true));
        // Double écran CRT ambré
        root.add(this._box(screenAmber, { x: 0.6, y: 0.45, z: 0.08 }, { x: -0.38, y: 1.35, z: 0.1 }, 'radio_screen_left'));
        root.add(this._box(screenAmber, { x: 0.6, y: 0.45, z: 0.08 }, { x: 0.38, y: 1.35, z: 0.1 }, 'radio_screen_right'));
      } else if (normalizedType === 'co2_extinguisher' || normalizedType === 'seegson_co2_extinguisher') {
        // Chantier 162 : Système d'Extincteurs Portatifs CO2 Seegson & Masquage Thermique (Alien: Isolation)
        const redCylinder = this._material('emissiveRed', { color: 0xdc2626, roughness: 0.3, metalness: 0.6 });
        const blackHose = this._material('darkMetal', { color: 0x18181b, roughness: 0.5 });
        const gaugeBrass = this._material('hazard', { color: 0xeab308, roughness: 0.35, metalness: 0.8 });
        // Bonbonne rouge pressurisée
        root.add(this._cylinder(redCylinder, 0.16, 0.16, 0.85, { x: 0, y: 0.9, z: 0.12 }, { x: 0, y: 0, z: 0 }, 'co2_tank'));
        // Manomètre et vanne de percution
        root.add(this._cylinder(gaugeBrass, 0.05, 0.05, 0.04, { x: 0.1, y: 1.35, z: 0.18 }, { x: Math.PI / 2, y: 0, z: 0 }, 'co2_gauge'));
        // Tromblon diffuseur noir
        root.add(this._cylinder(blackHose, 0.06, 0.12, 0.35, { x: -0.12, y: 1.1, z: 0.2 }, { x: 0.2, y: 0, z: -0.4 }, 'co2_horn'));
      } else if (normalizedType === 'biowaste_incinerator' || normalizedType === 'incinerator_furnace') {
        // Chantier 164 : SAS de Traitement Déchets Biologiques & Incinérateur Central Fiorina 161 (Alien 3)
        const furnaceSteel = this._material('darkMetal', { color: 0x1c1917, roughness: 0.6, metalness: 0.85 });
        const glowingCore = this._material('emissiveAmber', { color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 2.8 });
        const ironGrate = this._material('industrial', { color: 0x44403c, roughness: 0.4, metalness: 0.9 });
        // Corps de chambre de combustion 1200°C
        root.add(this._box(furnaceSteel, { x: 2.4, y: 2.6, z: 2.2 }, { x: 0, y: 1.3, z: 0 }, 'incinerator_body', true));
        // Cœur thermique radiant incandescent
        root.add(this._box(glowingCore, { x: 1.6, y: 1.2, z: 0.2 }, { x: 0, y: 1.1, z: 1.05 }, 'incinerator_fire_chamber'));
        // Grille de sécurité en fonte réfractaire
        for (let b = -3; b <= 3; b++) {
          root.add(this._cylinder(ironGrate, 0.03, 0.03, 1.2, { x: b * 0.22, y: 1.1, z: 1.1 }, { x: 0, y: 0, z: 0 }, `incinerator_bar_${b}`));
        }
      } else if (normalizedType === 'eva_robotic_arm' || normalizedType === 'robotic_arm') {
        // Chantier 166 : Bras Robotique Manipulateur Industriel EVA (Alien 1979 / Romulus)
        const armYellow = this._material('hazard', { color: 0xfacc15, roughness: 0.35, metalness: 0.65 });
        const jointDark = this._material('darkMetal', { color: 0x18181b, roughness: 0.25, metalness: 0.9 });
        // Tourelle pivotante de socle
        root.add(this._cylinder(jointDark, 0.45, 0.55, 0.5, { x: 0, y: 0.25, z: 0 }, { x: 0, y: 0, z: 0 }, 'eva_arm_base'));
        // Premier segment élévateur
        root.add(this._segment(armYellow, new T.Vector3(0, 0.45, 0), new T.Vector3(0.6, 1.8, 0.4), 0.16, 0.12, 'eva_arm_seg1', 8));
        // Deuxième segment avant-bras
        root.add(this._segment(armYellow, new T.Vector3(0.6, 1.8, 0.4), new T.Vector3(1.2, 1.4, 1.2), 0.12, 0.09, 'eva_arm_seg2', 8));
        // Pince de préhension industrielle bipolaire
        root.add(this._box(jointDark, { x: 0.28, y: 0.12, z: 0.45 }, { x: 1.25, y: 1.4, z: 1.45 }, 'eva_claw_left'));
        root.add(this._box(jointDark, { x: 0.28, y: 0.12, z: 0.45 }, { x: 1.25, y: 1.4, z: 0.95 }, 'eva_claw_right'));
      } else if (normalizedType === 'laser_claymore_mine' || normalizedType === 'claymore_mine') {
        // Chantier 167 : Piège Mural Mine de Proximité Laser Claymore USCM M18A3 (Aliens vs Predator / Dark Descent)
        const mineOlive = this._material('industrial', { color: 0x3f4f2c, roughness: 0.5, metalness: 0.5 });
        const laserGreen = this._material('emissiveGreen', { color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 3.5 });
        // Boîtier incurvé "FRONT TOWARD ENEMY"
        root.add(this._box(mineOlive, { x: 0.55, y: 0.35, z: 0.18 }, { x: 0, y: 0.5, z: 0 }, 'claymore_housing', true));
        // 3 Faisceaux laser de détection volumétrique
        for (let lb = -1; lb <= 1; lb++) {
          root.add(this._cylinder(laserGreen, 0.012, 0.012, 4.5, { x: lb * 0.18, y: 0.5, z: 2.25 }, { x: Math.PI / 2, y: 0, z: lb * 0.15 }, `claymore_beam_${lb}`));
        }
      } else if (normalizedType === 'freon_fog_generator' || normalizedType === 'freon_condenser') {
        // Chantier 168 : Générateur de Brouillard de Fréon Glacial Sub-Zero (Alien 3 / Isolation)
        const cryoFrosted = this._material('industrial', { color: 0xe0f2fe, roughness: 0.15, metalness: 0.8 });
        const cyanIce = this._material('emissiveBlue', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.2 });
        root.add(this._cylinder(cryoFrosted, 0.45, 0.45, 1.6, { x: 0, y: 0.8, z: 0 }, { x: 0, y: 0, z: 0 }, 'freon_unit_body', true));
        // Ailettes de refroidissement thermique
        for (let r = 0; r < 5; r++) {
          root.add(this._ring(cyanIce, 0.52, 0.03, { x: 0, y: 0.35 + r * 0.25, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, `freon_fin_${r}`));
        }
      } else if (normalizedType === 'muthur_bioscan_console' || normalizedType === 'bioscan_console') {
        // Chantier 170 : Console Centrale Bio-Scan MUTHUR 6000 & Diagnostic Équipage (Alien 1979 / Aliens 1986)
        const consoleDark = this._material('darkMetal', { color: 0x0f172a, roughness: 0.35, metalness: 0.9 });
        const greenCrt = this._material('emissiveGreen', { color: 0x22c55e, emissive: 0x15803d, emissiveIntensity: 2.8 });
        const keyPanel = this._material('hazard', { color: 0xd97706, roughness: 0.4 });
        root.add(this._box(consoleDark, { x: 1.5, y: 1.25, z: 0.75 }, { x: 0, y: 0.62, z: 0 }, 'bioscan_pedestal', true));
        // Écran CRT phosphore vert incurvé
        root.add(this._box(greenCrt, { x: 0.85, y: 0.55, z: 0.05 }, { x: 0, y: 1.35, z: 0.12 }, 'bioscan_crt_display'));
        // Clavier diégétique incliné
        root.add(this._box(keyPanel, { x: 1.2, y: 0.06, z: 0.35 }, { x: 0, y: 1.05, z: 0.28 }, 'bioscan_keyboard'));
      } else if (normalizedType === 'industrial_water_curtain' || normalizedType === 'water_curtain') {
        // Chantier 172 : Système de Rideaux d'Eau Industriels & Sas d'Immersion d'Urgence (Alien 1979 / Isolation)
        const frameMetal = this._material('darkMetal', { color: 0x334155, roughness: 0.45, metalness: 0.8 });
        const pipeBlue = this._material('industrial', { color: 0x0284c7, roughness: 0.3, metalness: 0.65 });
        const waterSheet = this._material('resin', { color: 0x38bdf8, roughness: 0.05, opacity: 0.48, transparent: true });
        // Rampe supérieure suspendue
        root.add(this._box(frameMetal, { x: 3.2, y: 0.25, z: 0.45 }, { x: 0, y: 2.85, z: 0 }, 'water_curtain_frame', true));
        // Tuyauterie haute pression bleue
        root.add(this._cylinder(pipeBlue, 0.08, 0.08, 3.0, { x: 0, y: 2.7, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, 'water_curtain_pipe'));
        // Nappe de cascade d'eau translucide
        root.add(this._box(waterSheet, { x: 2.8, y: 2.6, z: 0.06 }, { x: 0, y: 1.3, z: 0 }, 'water_curtain_sheet'));
        // Grille de drainage au sol
        root.add(this._box(frameMetal, { x: 3.0, y: 0.06, z: 0.6 }, { x: 0, y: 0.03, z: 0 }, 'water_drain_grate'));
      } else if (normalizedType === 'bulkhead_emergency_control_panel' || normalizedType === 'bulkhead_panel') {
        // Chantier 174 : Poste de Contrôle des SAS Étanches d'Urgence Weyland (Alien: Isolation)
        const panelSteel = this._material('darkMetal', { color: 0x1e293b, roughness: 0.4, metalness: 0.8 });
        const redHandle = this._material('emissiveRed', { color: 0xdc2626, emissive: 0x991b1b, emissiveIntensity: 2.0 });
        const yellowHazard = this._material('hazard', { color: 0xf59e0b, roughness: 0.3 });
        const greenLock = this._material('emissiveGreen', { color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 2.5 });
        // Boîtier mural
        root.add(this._box(panelSteel, { x: 0.9, y: 1.3, z: 0.28 }, { x: 0, y: 1.4, z: 0.14 }, 'bulkhead_panel_chassis', true));
        // Poignée en T rouge d'actionnement d'urgence
        root.add(this._cylinder(redHandle, 0.03, 0.03, 0.35, { x: 0, y: 1.35, z: 0.34 }, { x: 0, y: 0, z: Math.PI / 2 }, 'bulkhead_t_handle'));
        // Bandes de danger jaune et voyant vert
        root.add(this._box(yellowHazard, { x: 0.75, y: 0.12, z: 0.02 }, { x: 0, y: 1.75, z: 0.29 }, 'bulkhead_hazard_stripe'));
        root.add(this._cylinder(greenLock, 0.04, 0.04, 0.03, { x: 0.28, y: 1.55, z: 0.29 }, { x: Math.PI / 2, y: 0, z: 0 }, 'bulkhead_lock_led'));
      } else if (normalizedType === 'geothermal_turbine_valve' || normalizedType === 'geothermal_valve') {
        // Chantier 176 : Générateur d'Énergie Thermique & Soupape de Surpression Fiorina 161 (Alien 3)
        const castIron = this._material('darkMetal', { color: 0x292524, roughness: 0.65, metalness: 0.8 });
        const valveWheel = this._material('emissiveRed', { color: 0xb91c1c, roughness: 0.35 });
        const steamOrange = this._material('emissiveAmber', { color: 0xf97316, emissive: 0xc2410c, emissiveIntensity: 2.2 });
        // Corps sphérique de turbine géothermique
        root.add(this._ellipsoid(castIron, { x: 0.85, y: 1.1, z: 0.85 }, { x: 0, y: 1.1, z: 0 }, 'geothermal_body', 14));
        // Volant de vanne manuel rouge
        root.add(this._ring(valveWheel, 0.38, 0.05, { x: 0, y: 1.95, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'geothermal_wheel'));
        // Tuyère d'évacuation de vapeur avec anneau thermique incandescent
        root.add(this._cylinder(castIron, 0.22, 0.3, 0.6, { x: 0.65, y: 1.3, z: 0 }, { x: 0, y: 0, z: -Math.PI / 3 }, 'geothermal_nozzle'));
        root.add(this._ring(steamOrange, 0.32, 0.04, { x: 0.95, y: 1.45, z: 0 }, { x: 0, y: 0, z: -Math.PI / 3 }, 'geothermal_heat_ring'));
      } else if (normalizedType === 'micro_electric_barbed_wire_turret' || normalizedType === 'm24_wire_turret') {
        // Chantier 177 : Tourelle de Barbelés Micro-Électrifiés M24 USCM (Aliens: Dark Descent)
        const tripMetal = this._material('darkMetal', { color: 0x334155, roughness: 0.4, metalness: 0.8 });
        const wireSpool = this._material('industrial', { color: 0x64748b, roughness: 0.35, metalness: 0.9 });
        const sparkCyan = this._material('emissiveBlue', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 3.0 });
        // Trépied de déploiement
        for (let leg = 0; leg < 3; leg++) {
          const ang = leg * ((Math.PI * 2) / 3);
          root.add(this._cylinder(tripMetal, 0.03, 0.03, 0.75, { x: Math.cos(ang) * 0.35, y: 0.35, z: Math.sin(ang) * 0.35 }, { x: Math.sin(ang) * 0.45, y: 0, z: -Math.cos(ang) * 0.45 }, `m24_leg_${leg}`));
        }
        // Double bobines de fil barbelé
        root.add(this._cylinder(wireSpool, 0.24, 0.24, 0.55, { x: 0, y: 0.65, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, 'm24_spool'));
        // Électrodes d'impulsion électrique 2500V
        root.add(this._cylinder(sparkCyan, 0.02, 0.02, 0.4, { x: 0, y: 0.95, z: 0 }, { x: 0, y: 0, z: 0 }, 'm24_electrode'));
      } else if (normalizedType === 'subzero_cryogel_canister' || normalizedType === 'cryogel_canister') {
        // Chantier 178 : Réservoir Pressurisé de Gel Cryogénique Sub-Zero LN2 (Alien: Romulus)
        const frostTank = this._material('industrial', { color: 0xbae6fd, roughness: 0.18, metalness: 0.75 });
        const trolleyBlack = this._material('darkMetal', { color: 0x18181b, roughness: 0.5 });
        const blueCryo = this._material('emissiveBlue', { color: 0x0284c7, emissive: 0x0369a1, emissiveIntensity: 2.4 });
        // Réservoir cylindrique vertical givré
        root.add(this._cylinder(frostTank, 0.28, 0.28, 1.1, { x: 0, y: 0.85, z: 0 }, { x: 0, y: 0, z: 0 }, 'cryogel_tank', true));
        // Chariot à 2 roues
        root.add(this._cylinder(trolleyBlack, 0.12, 0.12, 0.08, { x: -0.32, y: 0.12, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, 'cryogel_wheel_l'));
        root.add(this._cylinder(trolleyBlack, 0.12, 0.12, 0.08, { x: 0.32, y: 0.12, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, 'cryogel_wheel_r'));
        // Bague cryogénique d'isolation
        root.add(this._ring(blueCryo, 0.32, 0.03, { x: 0, y: 1.15, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'cryogel_ring'));
      } else if (normalizedType === 'seegson_diagnostic_alcove' || normalizedType === 'working_joe_alcove') {
        // Chantier 180 : Console de Diagnostic Synthétique Seegson & Alcôve Working Joe (Alien: Isolation)
        const alcoveChassis = this._material('darkMetal', { color: 0x1e293b, roughness: 0.45, metalness: 0.75 });
        const synthJumpsuit = this._material('industrial', { color: 0x64748b, roughness: 0.65 });
        const synthRubberHead = this._material('resin', { color: 0xf1f5f9, roughness: 0.35 });
        const amberScreen = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 2.2 });
        // Niche capitonnée d'accueil
        root.add(this._box(alcoveChassis, { x: 1.4, y: 2.4, z: 0.7 }, { x: 0, y: 1.2, z: 0 }, 'joe_alcove_frame', true));
        // Corps Working Joe inerte en stase
        root.add(this._box(synthJumpsuit, { x: 0.55, y: 1.0, z: 0.35 }, { x: 0, y: 1.1, z: 0.08 }, 'joe_torso'));
        root.add(this._ellipsoid(synthRubberHead, { x: 0.18, y: 0.22, z: 0.18 }, { x: 0, y: 1.85, z: 0.08 }, 'joe_head', 14));
        // Moniteur latéral de diagnostic Seegson
        root.add(this._box(amberScreen, { x: 0.35, y: 0.25, z: 0.04 }, { x: 0.48, y: 1.5, z: 0.25 }, 'joe_diag_screen'));
      } else if (normalizedType === 'acoustic_jammer_m20' || normalizedType === 'm20_jammer') {
        // Chantier 182 : Système de Brouilleur Acoustique Ultrasonique USCM M20 (Aliens: Dark Descent)
        const jammerChassis = this._material('industrial', { color: 0x3f4f2c, roughness: 0.45, metalness: 0.6 });
        const dishMetal = this._material('darkMetal', { color: 0x64748b, roughness: 0.35, metalness: 0.85 });
        const cyanEmitter = this._material('emissiveBlue', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 3.2 });
        // Socle mural USCM
        root.add(this._box(jammerChassis, { x: 0.7, y: 0.9, z: 0.35 }, { x: 0, y: 1.2, z: 0.15 }, 'jammer_chassis', true));
        // Antenne parabolique ultrasonique
        root.add(this._cylinder(dishMetal, 0.35, 0.15, 0.25, { x: 0, y: 1.45, z: 0.35 }, { x: Math.PI / 2, y: 0, z: 0 }, 'jammer_horn'));
        // Dôme d'émission 22 kHz cyan pulsant
        root.add(this._ellipsoid(cyanEmitter, { x: 0.12, y: 0.12, z: 0.1 }, { x: 0, y: 1.45, z: 0.45 }, 'jammer_emitter_core', 10));
      } else if (normalizedType === 'cryo_sterilization_unit' || normalizedType === 'sterilization_unit') {
        // Chantier 184 : Unité Autonome de Décontamination Cryo-Stérilisante (Alien 3 / Romulus)
        const tankGalva = this._material('darkMetal', { color: 0x94a3b8, roughness: 0.25, metalness: 0.8 });
        const sprayYellow = this._material('hazard', { color: 0xf59e0b, roughness: 0.3 });
        const fluidAmber = this._material('resin', { color: 0xd97706, roughness: 0.1, opacity: 0.65, transparent: true });
        // Cuve suspendue de décontamination
        root.add(this._cylinder(tankGalva, 0.45, 0.45, 1.4, { x: 0, y: 2.2, z: 0 }, { x: 0, y: 0, z: 0 }, 'sterilizer_tank', true));
        // Jauge de liquide stérilisant ambré
        root.add(this._cylinder(fluidAmber, 0.08, 0.08, 1.0, { x: 0.46, y: 2.2, z: 0 }, { x: 0, y: 0, z: 0 }, 'sterilizer_sight_glass'));
        // 4 Buses de pulvérisation orientées vers le bas
        for (let b = 0; b < 4; b++) {
          const ang = b * (Math.PI / 2);
          root.add(this._cylinder(sprayYellow, 0.04, 0.07, 0.2, { x: Math.cos(ang) * 0.35, y: 1.4, z: Math.sin(ang) * 0.35 }, { x: Math.sin(ang) * 0.3, y: 0, z: -Math.cos(ang) * 0.3 }, `sterilizer_nozzle_${b}`));
        }
      } else if (normalizedType === 'eev_type37_console' || normalizedType === 'eev_console') {
        // Chantier 186 : Poste de Contrôle des SAS d'Éjection de Capsule EEV Type 37 (Alien 3)
        const consoleGrey = this._material('darkMetal', { color: 0x334155, roughness: 0.4, metalness: 0.75 });
        const leverHazard = this._material('hazard', { color: 0xeab308, roughness: 0.35 });
        const pyroRed = this._material('emissiveRed', { color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 2.5 });
        // Console angulaire
        root.add(this._box(consoleGrey, { x: 1.3, y: 1.2, z: 0.65 }, { x: 0, y: 0.6, z: 0 }, 'eev_chassis', true));
        // Deux gros leviers d'éjection pyrotechnique manuelle
        root.add(this._cylinder(leverHazard, 0.04, 0.04, 0.35, { x: -0.28, y: 1.25, z: 0.15 }, { x: -0.3, y: 0, z: 0 }, 'eev_lever_1'));
        root.add(this._cylinder(leverHazard, 0.04, 0.04, 0.35, { x: 0.28, y: 1.25, z: 0.15 }, { x: -0.3, y: 0, z: 0 }, 'eev_lever_2'));
        // Voyant d'alarme d'abandon de bord EEV
        root.add(this._ellipsoid(pyroRed, { x: 0.08, y: 0.06, z: 0.06 }, { x: 0, y: 1.35, z: 0.25 }, 'eev_alarm_strobe', 10));
      } else if (normalizedType === 'm20b_napalm_trap' || normalizedType === 'napalm_trap') {
        // Chantier 187 : Piège Déployable USCM : Mine Antipersonnel Incendiaire M20B (Aliens: Fireteam Elite)
        const trapMetal = this._material('industrial', { color: 0x27272a, roughness: 0.5, metalness: 0.8 });
        const napalmOrange = this._material('emissiveAmber', { color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 3.0 });
        // Corps de mine circulaire bas
        root.add(this._cylinder(trapMetal, 0.42, 0.46, 0.18, { x: 0, y: 0.09, z: 0 }, { x: 0, y: 0, z: 0 }, 'napalm_mine_body', true));
        // Cellule thermique centrale d'amorçage
        root.add(this._cylinder(napalmOrange, 0.18, 0.18, 0.08, { x: 0, y: 0.19, z: 0 }, { x: 0, y: 0, z: 0 }, 'napalm_mine_core'));
      } else if (normalizedType === 'ammonia_pipe' || normalizedType === 'ammonia_conduit') {
        // Chantier 188 : Réseau de Canalisations d'Ammoniac Industriel (Alien 1979 / Isolation)
        const yellowPipe = this._material('hazard', { color: 0xeab308, roughness: 0.35, metalness: 0.6 });
        const darkClamp = this._material('darkMetal', { color: 0x18181b, roughness: 0.5, metalness: 0.9 });
        const toxGreen = this._material('emissiveGreen', { color: 0x84cc16, emissive: 0x4d7c0f, emissiveIntensity: 2.2 });
        // Conduit horizontal sous 60 bars
        root.add(this._cylinder(yellowPipe, 0.16, 0.16, 2.6, { x: 0, y: 2.1, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, 'ammonia_pipe_body', true));
        // Colliers de serrage haute pression
        for (let c = -1; c <= 1; c++) {
          root.add(this._ring(darkClamp, 0.22, 0.04, { x: c * 0.85, y: 2.1, z: 0 }, { x: 0, y: Math.PI / 2, z: 0 }, `ammonia_clamp_${c}`));
        }
        // Soupape toxique avec indicateur chimique
        root.add(this._box(toxGreen, { x: 0.12, y: 0.12, z: 0.08 }, { x: 0, y: 1.88, z: 0.14 }, 'ammonia_purge_indicator'));
      } else if (normalizedType === 'biocore_nursery_interface' || normalizedType === 'biocore_interface') {
        // Chantier 190 : Terminal de Surveillance de Ruche "Bio-Core Nursery Interface" (Aliens: Genocide)
        const resinDark = this._material('chitin', { color: 0x1e1035, roughness: 0.35, metalness: 0.4 });
        const royalJellyGlow = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 3.5 });
        // Pilier biomécanique en résine torsadée
        root.add(this._cylinder(resinDark, 0.55, 0.75, 1.6, { x: 0, y: 0.8, z: 0 }, { x: 0, y: 0, z: 0 }, 'biocore_pedestal', true));
        // Réservoir alvéolé de Gelée Royale
        root.add(this._ellipsoid(royalJellyGlow, { x: 0.32, y: 0.22, z: 0.32 }, { x: 0, y: 1.65, z: 0 }, 'biocore_royal_jelly_core', 14));
      } else if (normalizedType === 'm94_smoke_system' || normalizedType === 'smoke_system') {
        // Chantier 192 : Système de Brouillard de Fumigènes Phosphorés M94 (Aliens: Fireteam Elite)
        const chassisOlive = this._material('industrial', { color: 0x364127, roughness: 0.5, metalness: 0.6 });
        const canisterGrey = this._material('darkMetal', { color: 0x64748b, roughness: 0.35, metalness: 0.8 });
        const beaconAmber = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 2.8 });
        // Caisson distributeur mural
        root.add(this._box(chassisOlive, { x: 0.85, y: 1.1, z: 0.38 }, { x: 0, y: 1.3, z: 0.15 }, 'smoke_m94_body', true));
        // 2 Cartouches de fumigène cylindriques
        root.add(this._cylinder(canisterGrey, 0.12, 0.12, 0.65, { x: -0.22, y: 1.3, z: 0.26 }, { x: 0, y: 0, z: 0 }, 'smoke_canister_1'));
        root.add(this._cylinder(canisterGrey, 0.12, 0.12, 0.65, { x: 0.22, y: 1.3, z: 0.26 }, { x: 0, y: 0, z: 0 }, 'smoke_canister_2'));
        // Balise stroboscopique infrarouge
        root.add(this._ellipsoid(beaconAmber, { x: 0.08, y: 0.08, z: 0.06 }, { x: 0, y: 1.75, z: 0.24 }, 'smoke_ir_beacon', 8));
      } else if (normalizedType === 'cryo_purge_c44' || normalizedType === 'cryo_purge') {
        // Chantier 194 : Poste de Contrôle des SAS d'Échappement Cryo-Statique C-44 (Alien: Romulus)
        const frostMetal = this._material('darkMetal', { color: 0x475569, roughness: 0.2, metalness: 0.85 });
        const iceGlow = this._material('emissiveBlue', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.4 });
        const frostCyan = this._material('resin', { color: 0xa5f3fc, roughness: 0.1, opacity: 0.75, transparent: true });
        // Pupitre cryogénique mural
        root.add(this._box(frostMetal, { x: 1.2, y: 1.3, z: 0.55 }, { x: 0, y: 0.95, z: 0 }, 'cryo_c44_chassis', true));
        // Manomètre haute pression de gaz liquéfié
        root.add(this._cylinder(iceGlow, 0.18, 0.18, 0.06, { x: 0, y: 1.45, z: 0.25 }, { x: Math.PI / 2, y: 0, z: 0 }, 'cryo_gauge'));
        // Conduits givrés translucides
        root.add(this._cylinder(frostCyan, 0.08, 0.08, 0.9, { x: 0.35, y: 0.95, z: 0.2 }, { x: 0, y: 0, z: 0 }, 'cryo_frost_pipe'));
      } else if (normalizedType === 'fusion_battery_station' || normalizedType === 'fusion_station') {
        // Chantier 196 : Station de Rechargement Rapide pour Armures KAPPA & Pile à Fusion (Aliens: Fireteam Elite)
        const heavyPlates = this._material('industrial', { color: 0x1e293b, roughness: 0.45, metalness: 0.85 });
        const inductionCyan = this._material('emissiveBlue', { color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 3.8 });
        const isolatorCeramic = this._material('hazard', { color: 0xe2e8f0, roughness: 0.25 });
        // Socle renforcé au sol
        root.add(this._cylinder(heavyPlates, 0.85, 0.95, 0.45, { x: 0, y: 0.22, z: 0 }, { x: 0, y: 0, z: 0 }, 'fusion_base', true));
        // Bobine à induction magnétique toroïdale cyan
        root.add(this._ring(inductionCyan, 0.65, 0.1, { x: 0, y: 0.55, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'fusion_coil'));
        // 3 Isolateurs verticaux
        for (let i = 0; i < 3; i++) {
          const a = i * ((Math.PI * 2) / 3);
          root.add(this._cylinder(isolatorCeramic, 0.06, 0.06, 0.7, { x: Math.cos(a) * 0.55, y: 0.7, z: Math.sin(a) * 0.55 }, { x: 0, y: 0, z: 0 }, `fusion_isolator_${i}`));
        }
      } else if (normalizedType === 'hydraulic_spurt_manifold' || normalizedType === 'hydraulic_manifold') {
        // Chantier 197 : Réseau de Gicleurs de Fluide Hydraulique 120 bars (Alien: Isolation)
        const darkCastIron = this._material('darkMetal', { color: 0x18181b, roughness: 0.6, metalness: 0.9 });
        const redValve = this._material('emissiveRed', { color: 0xef4444, emissive: 0x991b1b, emissiveIntensity: 1.5 });
        const oilPool = this._material('resin', { color: 0x09090b, roughness: 0.05, opacity: 0.88, transparent: true });
        // Collecteur tubulaire
        root.add(this._cylinder(darkCastIron, 0.18, 0.18, 1.8, { x: 0, y: 1.8, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, 'hydraulic_manifold_pipe'));
        // Vanne quart-de-tour rouge
        root.add(this._cylinder(redValve, 0.14, 0.14, 0.08, { x: 0, y: 1.95, z: 0.15 }, { x: Math.PI / 2, y: 0, z: 0 }, 'hydraulic_valve_handle'));
        // Flaque d'huile luisante sous le manifold
        root.add(this._cylinder(oilPool, 0.9, 0.9, 0.02, { x: 0, y: 0.01, z: 0 }, { x: 0, y: 0, z: 0 }, 'hydraulic_slick_puddle'));
      } else if (normalizedType === 'muthur_telemetry_console' || normalizedType === 'telemetry_console') {
        // Chantier 199 : Terminal de Télémétrie MUTHUR & Détection Sonar Sismique (Alien 1979 / Isolation)
        const retroIvory = this._material('industrial', { color: 0x334155, roughness: 0.55, metalness: 0.65 });
        const phosphorGreen = this._material('emissiveGreen', { color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 3.2 });
        const keyboardDark = this._material('darkMetal', { color: 0x0f172a, roughness: 0.6 });
        // Meuble console retro-informatique
        root.add(this._box(retroIvory, { x: 1.4, y: 1.15, z: 0.8 }, { x: 0, y: 0.58, z: 0 }, 'telemetry_chassis', true));
        // Écran CRT phosphore vert incurvé
        root.add(this._box(phosphorGreen, { x: 0.75, y: 0.55, z: 0.06 }, { x: 0, y: 1.25, z: 0.12 }, 'telemetry_crt_screen'));
        // Clavier mécanique plat incliné
        root.add(this._box(keyboardDark, { x: 0.85, y: 0.08, z: 0.35 }, { x: 0, y: 0.88, z: 0.28 }, 'telemetry_keyboard'));
      } else if (normalizedType === 'ovipositor_cradle' || normalizedType === 'royal_cradle') {
        // Chantier 200 : Grand Sanctuaire de Ponte Royal "The Ovipositor Cradle" (Aliens 1986)
        const broodChitin = this._material('chitin', { color: 0x180b26, roughness: 0.3, metalness: 0.5 });
        const eggBioSack = this._material('organicAmber', { color: 0x7c2d12, roughness: 0.4, metalness: 0.1 });
        const royalAura = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xb45309, emissiveIntensity: 2.2 });
        // Socle monumental alvéolé
        root.add(this._cylinder(broodChitin, 1.6, 2.2, 0.6, { x: 0, y: 0.3, z: 0 }, { x: 0, y: 0, z: 0 }, 'cradle_base', true));
        // Sac d'incubation ovoïde central
        root.add(this._ellipsoid(eggBioSack, { x: 0.95, y: 1.3, z: 0.95 }, { x: 0, y: 1.4, z: 0 }, 'cradle_sac_core', 16));
        // Anneaux d'exsudat royal ambré
        root.add(this._ring(royalAura, 1.1, 0.08, { x: 0, y: 1.2, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'cradle_aura_ring'));
        // 4 Tentacules biomécaniques de soutien
        for (let t = 0; t < 4; t++) {
          const ang = t * (Math.PI / 2);
          root.add(this._segment(broodChitin, new THREE.Vector3(Math.cos(ang) * 1.5, 0.4, Math.sin(ang) * 1.5), new THREE.Vector3(Math.cos(ang) * 0.7, 1.8, Math.sin(ang) * 0.7), 0.12, 0.06, `cradle_tendon_${t}`, 8));
        }
      } else if (normalizedType === 'm47_ir_smoke_dispenser' || normalizedType === 'ir_smoke_dispenser') {
        // Chantier 202 : Système de Brouilleur Thermique Infrarouge USCM M47 (Aliens: Dark Descent)
        const darkChassis = this._material('darkMetal', { color: 0x1f2937, roughness: 0.4, metalness: 0.8 });
        const tubeCopper = this._material('industrial', { color: 0xb45309, roughness: 0.3, metalness: 0.85 });
        const irSensor = this._material('emissiveRed', { color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 2.6 });
        root.add(this._box(darkChassis, { x: 0.9, y: 1.2, z: 0.42 }, { x: 0, y: 1.25, z: 0.15 }, 'ir_smoke_dispenser_chassis', true));
        for (let i = 0; i < 4; i++) {
          const offX = ((i % 2) - 0.5) * 0.4;
          const offY = (Math.floor(i / 2) - 0.5) * 0.45;
          root.add(this._cylinder(tubeCopper, 0.08, 0.08, 0.5, { x: offX, y: 1.25 + offY, z: 0.28 }, { x: Math.PI / 2, y: 0, z: 0 }, `ir_tube_${i}`));
        }
        root.add(this._ellipsoid(irSensor, { x: 0.15, y: 0.08, z: 0.05 }, { x: 0, y: 1.7, z: 0.32 }, 'ir_sensor_lens', 8));
      } else if (normalizedType === 'cryo_flow_c50' || normalizedType === 'cryo_purge_c50') {
        // Chantier 204 : Sas de Purge Caustique LN2 & Clapet Cryo-Flow C-50 (Alien 3 / Romulus)
        const steelFrost = this._material('industrial', { color: 0x94a3b8, roughness: 0.2, metalness: 0.9 });
        const valveCyan = this._material('emissiveGreen', { color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 2.2 });
        root.add(this._cylinder(steelFrost, 0.26, 0.26, 1.8, { x: 0, y: 1.1, z: 0 }, { x: 0, y: 0, z: 0 }, 'cryo_flow_main_pipe', true));
        root.add(this._box(steelFrost, { x: 0.65, y: 0.45, z: 0.45 }, { x: 0, y: 1.2, z: 0.18 }, 'cryo_manifold_block', true));
        root.add(this._ring(valveCyan, 0.28, 0.05, { x: 0, y: 1.2, z: 0.42 }, { x: 0, y: 0, z: 0 }, 'cryo_actuator_wheel'));
      } else if (normalizedType === 'hyperdyne_tokamak_bleeder' || normalizedType === 'tokamak_bleeder') {
        // Chantier 206 : Station de Dégazage Tokamak Supraconducteur Weyland (Aliens: Colonial Marines)
        const reactorDark = this._material('darkMetal', { color: 0x0f172a, roughness: 0.35, metalness: 0.9 });
        const copperCoils = this._material('industrial', { color: 0xd97706, roughness: 0.25, metalness: 0.85 });
        const plasmaCore = this._material('emissiveGreen', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 3.8 });
        root.add(this._ring(copperCoils, 0.85, 0.22, { x: 0, y: 1.2, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'tokamak_torus_coil'));
        root.add(this._cylinder(reactorDark, 0.45, 0.45, 1.6, { x: 0, y: 1.0, z: 0 }, { x: 0, y: 0, z: 0 }, 'tokamak_center_column', true));
        root.add(this._ellipsoid(plasmaCore, { x: 0.35, y: 0.35, z: 0.35 }, { x: 0, y: 1.2, z: 0 }, 'tokamak_plasma_chamber', 14));
      } else if (normalizedType === 'argon_manifold_pipe' || normalizedType === 'argon_pipe') {
        // Chantier 207 : Canalisations d'Argon Compressé 150 bars & Purge Anoxique (Alien: Isolation)
        const pipeGrey = this._material('industrial', { color: 0x475569, roughness: 0.4, metalness: 0.7 });
        const warningPurple = this._material('emissiveAmber', { color: 0xa855f7, emissive: 0x7e22ce, emissiveIntensity: 2.4 });
        root.add(this._cylinder(pipeGrey, 0.18, 0.18, 2.2, { x: 0, y: 1.2, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, 'argon_horizontal_conduit', true));
        root.add(this._box(pipeGrey, { x: 0.5, y: 0.65, z: 0.4 }, { x: 0, y: 1.2, z: 0.15 }, 'argon_guillotine_valve', true));
        root.add(this._box(warningPurple, { x: 0.28, y: 0.18, z: 0.05 }, { x: 0, y: 1.45, z: 0.36 }, 'argon_anoxia_warning_badge'));
      } else if (normalizedType === 'muthur_scrubber_console' || normalizedType === 'scrubber_console') {
        // Chantier 209 : Console de Télémesure MUTHUR 6000 "Atmospheric Scrubbing" (Alien 1979 / Isolation)
        const frameIvory = this._material('industrial', { color: 0xd1d5db, roughness: 0.5, metalness: 0.4 });
        const crtAmber = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 3.0 });
        const keyboardDark = this._material('darkMetal', { color: 0x111827, roughness: 0.7 });
        root.add(this._box(frameIvory, { x: 1.2, y: 1.25, z: 0.75 }, { x: 0, y: 0.62, z: 0 }, 'scrubber_chassis', true));
        root.add(this._box(crtAmber, { x: 0.65, y: 0.48, z: 0.06 }, { x: 0, y: 1.28, z: 0.14 }, 'scrubber_crt_display'));
        root.add(this._box(keyboardDark, { x: 0.75, y: 0.07, z: 0.3 }, { x: 0, y: 0.9, z: 0.28 }, 'scrubber_keyboard'));
      } else if (normalizedType === 'biomass_conversion_sarcophagus' || normalizedType === 'biomass_sarcophagus') {
        // Chantier 210 : Autel de Gestation Ruche "Biomass Conversion Sarcophagus" (Aliens 1986 / Prometheus)
        const chitinBase = this._material('chitin', { color: 0x1e1b4b, roughness: 0.25, metalness: 0.6 });
        const bioGelGlow = this._material('emissiveGreen', { color: 0x22c55e, emissive: 0x15803d, emissiveIntensity: 2.6 });
        root.add(this._box(chitinBase, { x: 1.3, y: 2.2, z: 0.7 }, { x: 0, y: 1.1, z: 0 }, 'sarcophagus_hull', true));
        root.add(this._ellipsoid(bioGelGlow, { x: 0.45, y: 0.9, z: 0.2 }, { x: 0, y: 1.15, z: 0.3 }, 'sarcophagus_bio_chamber', 14));
        for (let rib = 0; rib < 5; rib++) {
          root.add(this._ring(chitinBase, 0.48, 0.04, { x: 0, y: 0.4 + rib * 0.35, z: 0.28 }, { x: 0, y: 0, z: 0 }, `sarcophagus_rib_${rib}`));
        }
      } else if (normalizedType === 'm56_jammer_box' || normalizedType === 'jammer_box') {
        // Chantier 212 : Système de Brouilleur Électromagnétique Portatif USCM M56 (Aliens: Dark Descent)
        const casingOlive = this._material('industrial', { color: 0x3f4a3c, roughness: 0.45, metalness: 0.65 });
        const darkMetal = this._material('darkMetal', { color: 0x18181b, roughness: 0.3, metalness: 0.85 });
        const blueSignal = this._material('emissiveGreen', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.8 });
        root.add(this._box(casingOlive, { x: 0.75, y: 0.9, z: 0.4 }, { x: 0, y: 0.95, z: 0 }, 'jammer_casing', true));
        root.add(this._cylinder(darkMetal, 0.02, 0.02, 0.8, { x: -0.22, y: 1.75, z: 0 }, { x: 0, y: 0, z: -0.15 }, 'jammer_antenna_l'));
        root.add(this._cylinder(darkMetal, 0.02, 0.02, 0.8, { x: 0.22, y: 1.75, z: 0 }, { x: 0, y: 0, z: 0.15 }, 'jammer_antenna_r'));
        root.add(this._ellipsoid(blueSignal, { x: 0.08, y: 0.08, z: 0.04 }, { x: 0, y: 1.15, z: 0.21 }, 'jammer_status_led', 8));
      } else if (normalizedType === 'cryo_chamber_c60' || normalizedType === 'cryo_chamber') {
        // Chantier 214 : Poste de Contrôle Cryo-Containment Chamber C-60 (Alien: Resurrection)
        const frostSteel = this._material('industrial', { color: 0x94a3b8, roughness: 0.25, metalness: 0.85 });
        const cryoVortex = this._material('emissiveGreen', { color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 3.0 });
        root.add(this._cylinder(frostSteel, 0.75, 0.75, 0.3, { x: 0, y: 0.15, z: 0 }, { x: 0, y: 0, z: 0 }, 'cryo_c60_base', true));
        root.add(this._cylinder(frostSteel, 0.75, 0.75, 0.3, { x: 0, y: 2.2, z: 0 }, { x: 0, y: 0, z: 0 }, 'cryo_c60_cap', true));
        root.add(this._cylinder(cryoVortex, 0.6, 0.6, 1.8, { x: 0, y: 1.2, z: 0 }, { x: 0, y: 0, z: 0 }, 'cryo_c60_glass_tube'));
        for (let s = 0; s < 4; s++) {
          const ang = s * (Math.PI / 2);
          root.add(this._cylinder(frostSteel, 0.06, 0.06, 1.9, { x: Math.cos(ang) * 0.7, y: 1.2, z: Math.sin(ang) * 0.7 }, { x: 0, y: 0, z: 0 }, `cryo_strut_${s}`));
        }
      } else if (normalizedType === 'arc_furnace_inverter' || normalizedType === 'arc_furnace') {
        // Chantier 216 : Générateur Magnétique Weyland Arc-Furnace Inverter (Alien 3 / Isolation)
        const coilCopper = this._material('industrial', { color: 0xb45309, roughness: 0.25, metalness: 0.9 });
        const coreDark = this._material('darkMetal', { color: 0x0f172a, roughness: 0.4, metalness: 0.8 });
        const arcPlasma = this._material('emissiveAmber', { color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 3.5 });
        root.add(this._box(coreDark, { x: 1.4, y: 0.5, z: 1.2 }, { x: 0, y: 0.25, z: 0 }, 'arc_inverter_plinth', true));
        root.add(this._ring(coilCopper, 0.75, 0.16, { x: 0, y: 1.25, z: 0 }, { x: 0, y: 0, z: 0 }, 'arc_magnetic_coil'));
        root.add(this._ellipsoid(arcPlasma, { x: 0.3, y: 0.3, z: 0.3 }, { x: 0, y: 1.25, z: 0 }, 'arc_plasma_focal_point', 12));
      } else if (normalizedType === 'ethylene_flare_pipe' || normalizedType === 'ethylene_pipe') {
        // Chantier 217 : Collecteur d'Éthylène Haute Température & Torche (Aliens 1986 / Romulus)
        const darkConduit = this._material('darkMetal', { color: 0x334155, roughness: 0.35, metalness: 0.8 });
        const flareNozzle = this._material('industrial', { color: 0x78716c, roughness: 0.3, metalness: 0.9 });
        const flameCore = this._material('emissiveAmber', { color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 3.6 });
        root.add(this._cylinder(darkConduit, 0.2, 0.2, 2.0, { x: 0, y: 1.0, z: 0 }, { x: 0, y: 0, z: 0 }, 'ethylene_riser_pipe', true));
        root.add(this._cone(flareNozzle, 0.35, 0.55, { x: 0, y: 2.15, z: 0 }, { x: 0, y: 0, z: 0 }, 'ethylene_flare_funnel'));
        root.add(this._cone(flameCore, 0.18, 0.45, { x: 0, y: 2.5, z: 0 }, { x: 0, y: 0, z: 0 }, 'ethylene_pilot_flame'));
      } else if (normalizedType === 'seegson_casai_override' || normalizedType === 'casai_override') {
        // Chantier 219 : Terminal Réseau C.A.S.A.I. Seegson Synthetic Security Override (Alien: Isolation)
        const casingCream = this._material('industrial', { color: 0xd4d4d8, roughness: 0.55, metalness: 0.35 });
        const seegsonBlue = this._material('emissiveGreen', { color: 0x0284c7, emissive: 0x0369a1, emissiveIntensity: 2.8 });
        const darkPanel = this._material('darkMetal', { color: 0x18181b, roughness: 0.7 });
        root.add(this._box(casingCream, { x: 1.0, y: 1.4, z: 0.65 }, { x: 0, y: 0.7, z: 0 }, 'casai_chassis', true));
        root.add(this._box(seegsonBlue, { x: 0.62, y: 0.45, z: 0.05 }, { x: 0, y: 1.25, z: 0.12 }, 'casai_apollo_display'));
        root.add(this._box(darkPanel, { x: 0.7, y: 0.06, z: 0.25 }, { x: 0, y: 0.88, z: 0.24 }, 'casai_input_console'));
      } else if (normalizedType === 'bio_stasis_vault' || normalizedType === 'bio_vault') {
        // Chantier 220 : Couveuse Biologique "Bio-Stasis Preservation Vault" (Alien: Covenant / Romulus)
        const engineerObsidian = this._material('chitin', { color: 0x0f172a, roughness: 0.2, metalness: 0.8 });
        const pathogenGoo = this._material('emissiveGreen', { color: 0x15803d, emissive: 0x166534, emissiveIntensity: 2.5 });
        root.add(this._box(engineerObsidian, { x: 1.1, y: 1.8, z: 0.75 }, { x: 0, y: 0.9, z: 0 }, 'bio_vault_pedestal', true));
        root.add(this._cylinder(pathogenGoo, 0.22, 0.22, 0.75, { x: 0, y: 1.05, z: 0.15 }, { x: 0, y: 0, z: 0 }, 'pathogen_vial'));
        for (let ring = 0; ring < 3; ring++) {
          root.add(this._ring(engineerObsidian, 0.26, 0.04, { x: 0, y: 0.8 + ring * 0.25, z: 0.15 }, { x: 0, y: 0, z: 0 }, `bio_clamp_${ring}`));
        }
      } else if (normalizedType === 'transit_mag_cart' || normalizedType === 'mag_cart') {
        // Chantier 222 : Système de Transit Orbital Mag-Lev "Weyland-Yutani Heavy Transit Cart" (Alien: Isolation / Romulus)
        const frameYellow = this._material('industrial', { color: 0xeab308, roughness: 0.45, metalness: 0.65 });
        const magSkid = this._material('darkMetal', { color: 0x0f172a, roughness: 0.25, metalness: 0.85 });
        const amberLight = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 2.4 });
        root.add(this._box(dark, { x: 1.8, y: 0.35, z: 2.8 }, { x: 0, y: 0.25, z: 0 }, 'transit_cart_chassis', true));
        root.add(this._box(frameYellow, { x: 1.85, y: 0.15, z: 2.85 }, { x: 0, y: 0.45, z: 0 }, 'transit_cart_bumper', true));
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._box(magSkid, { x: 0.22, y: 0.18, z: 2.6 }, { x: side * 0.75, y: 0.1, z: 0 }, `transit_skid_${side}`, true));
          root.add(this._cylinder(frameYellow, 0.04, 0.04, 0.85, { x: side * 0.85, y: 0.9, z: 0 }, { x: 0, y: 0, z: 0 }, `transit_rail_${side}`));
        }
        root.add(this._box(metal, { x: 1.2, y: 0.8, z: 1.4 }, { x: 0, y: 0.85, z: -0.4 }, 'transit_cargo_crate', true));
        root.add(this._cylinder(amberLight, 0.12, 0.12, 0.22, { x: 0, y: 1.4, z: -0.4 }, { x: 0, y: 0, z: 0 }, 'transit_beacon_dome'));
      } else if (normalizedType === 'halon_extinguisher' || normalizedType === 'halon_tank') {
        // Chantier 224 : Système d'Extinction Industrielle Halon 1301 Fire Suppression Extinguisher (Alien 1979 / Fireteam Elite)
        const halonRed = this._material('emissiveRed', { color: 0xb91c1c, emissive: 0x7f1d1d, emissiveIntensity: 1.5 });
        const chromeNozzle = this._material('darkMetal', { color: 0x94a3b8, roughness: 0.15, metalness: 0.9 });
        root.add(this._cylinder(halonRed, 0.24, 0.24, 1.4, { x: -0.22, y: 0.9, z: 0 }, { x: 0, y: 0, z: 0 }, 'halon_tank_1', true));
        root.add(this._cylinder(halonRed, 0.24, 0.24, 1.4, { x: 0.22, y: 0.9, z: 0 }, { x: 0, y: 0, z: 0 }, 'halon_tank_2', true));
        root.add(this._cylinder(dark, 0.08, 0.08, 0.7, { x: 0, y: 1.65, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, 'halon_manifold'));
        root.add(this._cone(chromeNozzle, 0.18, 0.35, { x: 0, y: 1.85, z: 0.15 }, { x: Math.PI / 4, y: 0, z: 0 }, 'halon_discharge_horn'));
        root.add(this._box(hazard, { x: 0.35, y: 0.2, z: 0.04 }, { x: 0, y: 1.25, z: 0.22 }, 'halon_hazard_sign'));
      } else if (normalizedType === 'm20_claymore_mine' || normalizedType === 'claymore_mine') {
        // Chantier 226 : Munitions de Défense Périmétrique USCM M20 Claymore Directional Mine (Aliens 1986 / Dark Descent)
        const oliveCasing = this._material('industrial', { color: 0x3f6212, roughness: 0.65, metalness: 0.25 });
        const tripLaser = this._material('emissiveRed', { color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 2.6 });
        root.add(this._box(oliveCasing, { x: 0.45, y: 0.25, z: 0.12 }, { x: 0, y: 0.22, z: 0 }, 'claymore_body', true));
        for (let leg = -1; leg <= 1; leg += 2) {
          root.add(this._segment(dark, new T.Vector3(leg * 0.18, 0.2, 0), new T.Vector3(leg * 0.24, 0, -0.1), 0.02, 0.015, `claymore_leg_rear_${leg}`, 6));
          root.add(this._segment(dark, new T.Vector3(leg * 0.18, 0.2, 0), new T.Vector3(leg * 0.24, 0, 0.1), 0.02, 0.015, `claymore_leg_front_${leg}`, 6));
        }
        root.add(this._box(tripLaser, { x: 0.06, y: 0.06, z: 0.04 }, { x: 0, y: 0.28, z: 0.06 }, 'claymore_arm_led'));
        root.add(this._segment(tripLaser, new T.Vector3(0, 0.22, 0.08), new T.Vector3(0, 0.22, 2.5), 0.01, 0.005, 'claymore_tripwire_beam', 6));
      } else if (normalizedType === 'heat_exchanger_vent' || normalizedType === 'ap14_heat_exchanger') {
        // Chantier 227 : Échangeur Thermique Primaire du Processeur Atmosphérique AP-14 (Aliens 1986 Hadleys Hope)
        const cowlMat = this._material('industrial', { color: 0x475569, roughness: 0.5, metalness: 0.7 });
        const copperValve = this._material('darkMetal', { color: 0xb45309, roughness: 0.35, metalness: 0.8 });
        const steamBlue = this._material('emissiveGreen', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.8 });
        root.add(this._cylinder(cowlMat, 0.75, 0.75, 1.6, { x: 0, y: 0.8, z: 0 }, { x: 0, y: 0, z: 0 }, 'heat_exchanger_cowl', true));
        root.add(this._ring(cowlMat, 0.82, 0.1, { x: 0, y: 1.55, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'heat_exchanger_flange'));
        for (let fin = 0; fin < 6; fin++) {
          const angle = (fin / 6) * Math.PI * 2;
          root.add(this._box(dark, { x: 0.06, y: 1.3, z: 0.35 }, { x: Math.cos(angle) * 0.65, y: 0.8, z: Math.sin(angle) * 0.65 }, `heat_fin_${fin}`));
        }
        root.add(this._cylinder(copperValve, 0.16, 0.16, 0.12, { x: 0.78, y: 1.1, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, 'heat_valve_wheel'));
        root.add(this._cylinder(steamBlue, 0.08, 0.08, 0.35, { x: 0, y: 1.65, z: 0 }, { x: 0, y: 0, z: 0 }, 'heat_steam_orifice'));
      } else if (normalizedType === 'resin_camouflage_wall' || normalizedType === 'resin_wall') {
        // Chantier 228 : Camouflage Organique "Hive Resin Melding" (Alien: Isolation / Dark Horse)
        const organicWall = this._material('resin', { color: 0x1c1917, roughness: 0.3, metalness: 0.4 });
        const bioGlow = this._material('emissiveGreen', { color: 0x15803d, emissive: 0x166534, emissiveIntensity: 1.6 });
        root.add(this._box(organicWall, { x: 1.6, y: 2.2, z: 0.6 }, { x: 0, y: 1.1, z: 0 }, 'resin_wall_backing', true));
        for (let rib = 0; rib < 4; rib++) {
          root.add(this._ring(organicWall, 0.55 + rib * 0.08, 0.07, { x: 0, y: 0.5 + rib * 0.45, z: 0.25 }, { x: 0, y: 0, z: 0 }, `resin_rib_${rib}`));
        }
        root.add(this._ellipsoid(bioGlow, { x: 0.25, y: 0.35, z: 0.15 }, { x: 0, y: 1.2, z: 0.32 }, 'resin_pheromone_node', 10));
      } else if (normalizedType === 'maintenance_jack_socket' || normalizedType === 'jack_socket') {
        // Chantier 229 : Boîtier Déverrouillage Sevastopol Maintenance Jack Socket (Alien: Isolation)
        const boxYellow = this._material('industrial', { color: 0xca8a04, roughness: 0.4, metalness: 0.6 });
        const socketDark = this._material('darkMetal', { color: 0x09090b, roughness: 0.2, metalness: 0.9 });
        const ledYellow = this._material('emissiveAmber', { color: 0xfacc15, emissive: 0xeab308, emissiveIntensity: 2.5 });
        root.add(this._box(boxYellow, { x: 0.6, y: 0.85, z: 0.28 }, { x: 0, y: 1.2, z: 0 }, 'jack_box_chassis', true));
        root.add(this._cylinder(socketDark, 0.12, 0.12, 0.15, { x: 0, y: 1.15, z: 0.14 }, { x: Math.PI / 2, y: 0, z: 0 }, 'jack_torque_socket'));
        root.add(this._cylinder(ledYellow, 0.04, 0.04, 0.04, { x: 0, y: 1.45, z: 0.14 }, { x: Math.PI / 2, y: 0, z: 0 }, 'jack_status_led'));
        root.add(this._box(dark, { x: 0.45, y: 0.08, z: 0.06 }, { x: 0, y: 0.95, z: 0.14 }, 'jack_crank_handle'));
      } else if (normalizedType === 'working_joe_alcove' || normalizedType === 'joe_alcove') {
        // Chantier 230 : Alcôve de Rechargement Inductif Working Joe (Alien: Isolation)
        const alcoveChassis = this._material('industrial', { color: 0x27272a, roughness: 0.55, metalness: 0.5 });
        const chargingPad = this._material('darkMetal', { color: 0xb45309, roughness: 0.25, metalness: 0.85 });
        const apolloScreen = this._material('emissiveGreen', { color: 0x0284c7, emissive: 0x0369a1, emissiveIntensity: 2.6 });
        root.add(this._box(alcoveChassis, { x: 1.2, y: 2.3, z: 0.45 }, { x: 0, y: 1.15, z: 0 }, 'joe_alcove_niche', true));
        root.add(this._box(chargingPad, { x: 0.4, y: 0.35, z: 0.05 }, { x: 0, y: 1.4, z: 0.2 }, 'joe_contact_plate_upper'));
        root.add(this._box(chargingPad, { x: 0.4, y: 0.35, z: 0.05 }, { x: 0, y: 0.6, z: 0.2 }, 'joe_contact_plate_lower'));
        root.add(this._box(apolloScreen, { x: 0.5, y: 0.2, z: 0.03 }, { x: 0, y: 2.05, z: 0.2 }, 'joe_apollo_status'));
      } else if (normalizedType === 'hadley_drainage_sump' || normalizedType === 'drainage_sump') {
        // Chantier 231 : Hadley's Hope Sub-Level 3 Drainage Sump & Catwalks (Aliens 1986)
        const sumpBasin = this._material('darkMetal', { color: 0x0f172a, roughness: 0.8, metalness: 0.4 });
        const murkyWater = this._material('industrial', { color: 0x14532d, roughness: 0.1, metalness: 0.6 });
        const grateSteel = this._material('industrial', { color: 0x64748b, roughness: 0.35, metalness: 0.85 });
        const yellowRail = this._material('hazard', { color: 0xeab308, roughness: 0.3 });
        root.add(this._box(sumpBasin, { x: 4.8, y: 0.8, z: 3.6 }, { x: 0, y: 0.4, z: 0 }, 'sump_concrete_basin', true));
        root.add(this._box(murkyWater, { x: 4.5, y: 0.1, z: 3.3 }, { x: 0, y: 0.75, z: 0 }, 'sump_murky_water'));
        root.add(this._box(grateSteel, { x: 4.6, y: 0.15, z: 1.4 }, { x: 0, y: 1.6, z: 0 }, 'sump_catwalk_grating', true));
        root.add(this._cylinder(grateSteel, 0.08, 0.08, 1.6, { x: -2.1, y: 0.8, z: -0.6 }, { x: 0, y: 0, z: 0 }, 'sump_pillar_fl'));
        root.add(this._cylinder(grateSteel, 0.08, 0.08, 1.6, { x: 2.1, y: 0.8, z: -0.6 }, { x: 0, y: 0, z: 0 }, 'sump_pillar_fr'));
        root.add(this._cylinder(grateSteel, 0.08, 0.08, 1.6, { x: -2.1, y: 0.8, z: 0.6 }, { x: 0, y: 0, z: 0 }, 'sump_pillar_rl'));
        root.add(this._cylinder(grateSteel, 0.08, 0.08, 1.6, { x: 2.1, y: 0.8, z: 0.6 }, { x: 0, y: 0, z: 0 }, 'sump_pillar_rr'));
        root.add(this._box(yellowRail, { x: 4.6, y: 0.06, z: 0.06 }, { x: 0, y: 2.4, z: -0.65 }, 'sump_handrail_n'));
        root.add(this._box(yellowRail, { x: 4.6, y: 0.06, z: 0.06 }, { x: 0, y: 2.4, z: 0.65 }, 'sump_handrail_s'));
      } else if (normalizedType === 'sevastopol_duct_splitter' || normalizedType === 'duct_splitter') {
        // Chantier 232 : Sevastopol Habitation Duct Splitter & Multi-Vent Hub (Alien: Isolation)
        const ductMetal = this._material('industrial', { color: 0x334155, roughness: 0.45, metalness: 0.75 });
        const hatchHazard = this._material('hazard', { color: 0xf59e0b, roughness: 0.3, metalness: 0.5 });
        const amberBeacon = this._material('emissiveAmber', { color: 0xfbbf24, emissive: 0xd97706, emissiveIntensity: 2.4 });
        root.add(this._box(ductMetal, { x: 2.6, y: 2.8, z: 2.6 }, { x: 0, y: 1.4, z: 0 }, 'duct_hub_plenum', true));
        root.add(this._box(dark, { x: 2.8, y: 1.8, z: 0.15 }, { x: 0, y: 1.4, z: 1.35 }, 'duct_flange_n'));
        root.add(this._box(dark, { x: 2.8, y: 1.8, z: 0.15 }, { x: 0, y: 1.4, z: -1.35 }, 'duct_flange_s'));
        root.add(this._box(dark, { x: 0.15, y: 1.8, z: 2.8 }, { x: 1.35, y: 1.4, z: 0 }, 'duct_flange_e'));
        root.add(this._box(dark, { x: 0.15, y: 1.8, z: 2.8 }, { x: -1.35, y: 1.4, z: 0 }, 'duct_flange_w'));
        root.add(this._box(hatchHazard, { x: 1.4, y: 0.15, z: 1.4 }, { x: 0, y: 2.85, z: 0 }, 'duct_ceiling_ambush_hatch'));
        for (let r = 0; r < 4; r++) {
          root.add(this._box(hatchHazard, { x: 0.06, y: 0.06, z: 0.8 }, { x: -1.15, y: 0.6 + r * 0.55, z: 0 }, `duct_rung_${r}`));
        }
        root.add(this._cylinder(amberBeacon, 0.08, 0.08, 0.15, { x: 0.9, y: 2.9, z: 0.9 }, { x: 0, y: 0, z: 0 }, 'duct_indicator_beacon'));
      } else if (normalizedType === 'biocontainment_vault_alpha' || normalizedType === 'containment_vault') {
        // Chantier 233 : Weyland-Yutani Xenobiology Specimen Isolation Vault Alpha (Alien: Romulus)
        const frameArmored = this._material('darkMetal', { color: 0x1e293b, roughness: 0.35, metalness: 0.85 });
        const yellowSafety = this._material('hazard', { color: 0xfacc15, roughness: 0.3 });
        const quartzView = this._material('emissiveBlue', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.8, opacity: 0.85, transparent: true });
        const biohazRed = this._material('emissiveRed', { color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 2.2 });
        root.add(this._box(frameArmored, { x: 3.2, y: 3.4, z: 1.2 }, { x: 0, y: 1.7, z: 0 }, 'bio_vault_portal', true));
        root.add(this._box(quartzView, { x: 1.8, y: 1.8, z: 0.1 }, { x: 0, y: 1.8, z: 0.05 }, 'bio_vault_quartz'));
        root.add(this._box(yellowSafety, { x: 2.2, y: 0.15, z: 0.15 }, { x: 0, y: 2.8, z: 0.1 }, 'bio_vault_arch_top'));
        root.add(this._box(yellowSafety, { x: 2.2, y: 0.15, z: 0.15 }, { x: 0, y: 0.8, z: 0.1 }, 'bio_vault_arch_bot'));
        root.add(this._cylinder(biohazRed, 0.09, 0.09, 0.12, { x: 0, y: 3.1, z: 0.1 }, { x: Math.PI / 2, y: 0, z: 0 }, 'bio_warning_strobe'));
      } else if (normalizedType === 'nostromo_reactor_ring' || normalizedType === 'reactor_ring') {
        // Chantier 234 : Nostromo Class M Reactor Magnetic Shielding Ring (Alien 1979)
        const coreSteel = this._material('darkMetal', { color: 0x09090b, roughness: 0.25, metalness: 0.95 });
        const copperStator = this._material('industrial', { color: 0xd97706, roughness: 0.35, metalness: 0.85 });
        const ionCyan = this._material('emissiveBlue', { color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 3.2 });
        root.add(this._cylinder(coreSteel, 1.4, 1.4, 3.8, { x: 0, y: 1.9, z: 0 }, { x: 0, y: 0, z: 0 }, 'reactor_containment_core', true));
        root.add(this._ring(copperStator, 1.7, 0.22, { x: 0, y: 1.9, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'reactor_stator_ring'));
        root.add(this._ring(ionCyan, 1.2, 0.12, { x: 0, y: 2.6, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'reactor_ion_ring_upper'));
        root.add(this._ring(ionCyan, 1.2, 0.12, { x: 0, y: 1.2, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'reactor_ion_ring_lower'));
        for (let i = 0; i < 6; i++) {
          const ang = (i * Math.PI) / 3;
          root.add(this._box(copperStator, { x: 0.35, y: 1.8, z: 0.35 }, { x: Math.cos(ang) * 1.5, y: 1.9, z: Math.sin(ang) * 1.5 }, `reactor_coil_${i}`));
        }
      } else if (normalizedType === 'orbital_centrifuge_lab' || normalizedType === 'centrifuge_lab') {
        // Chantier 235 : Renaissance Station Orbital Centrifuge Lab (Alien: Romulus)
        const chassisTitanium = this._material('industrial', { color: 0x475569, roughness: 0.35, metalness: 0.8 });
        const trackGrate = this._material('darkMetal', { color: 0x18181b, roughness: 0.5, metalness: 0.9 });
        const beaconCyan = this._material('emissiveBlue', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.2 });
        root.add(this._cylinder(chassisTitanium, 0.45, 0.45, 3.2, { x: 0, y: 1.6, z: 0 }, { x: 0, y: 0, z: 0 }, 'centrifuge_central_hub', true));
        root.add(this._ring(trackGrate, 2.4, 0.35, { x: 0, y: 1.8, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'centrifuge_rim_track'));
        for (let s = 0; s < 4; s++) {
          const ang = (s * Math.PI) / 2;
          root.add(this._box(chassisTitanium, { x: 2.2, y: 0.12, z: 0.25 }, { x: Math.cos(ang) * 1.1, y: 1.8, z: Math.sin(ang) * 1.1 }, `centrifuge_spoke_${s}`));
        }
        root.add(this._ring(beaconCyan, 2.42, 0.05, { x: 0, y: 1.95, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'centrifuge_strobe_rim'));
      } else if (normalizedType === 'uscm_munitions_bunker' || normalizedType === 'munitions_bunker') {
        // Chantier 236 : USCM Armory & Fortified Munitions Bunker (Aliens: Dark Descent)
        const bunkerArmor = this._material('industrial', { color: 0x334155, roughness: 0.55, metalness: 0.7 });
        const sandbags = this._material('industrial', { color: 0x78716c, roughness: 0.9, metalness: 0.1 });
        const weaponCrate = this._material('hazard', { color: 0x15803d, roughness: 0.45, metalness: 0.4 });
        const chevronStripe = this._material('hazard', { color: 0xf59e0b, roughness: 0.3 });
        root.add(this._box(bunkerArmor, { x: 3.4, y: 2.6, z: 1.6 }, { x: 0, y: 1.3, z: 0 }, 'bunker_bastion_core', true));
        root.add(this._box(sandbags, { x: 3.2, y: 0.8, z: 0.6 }, { x: 0, y: 0.4, z: 0.95 }, 'bunker_sandbag_revetment'));
        root.add(this._box(weaponCrate, { x: 1.1, y: 0.55, z: 0.6 }, { x: -0.9, y: 1.05, z: 0.2 }, 'bunker_ammo_crate_a'));
        root.add(this._box(weaponCrate, { x: 0.95, y: 0.5, z: 0.55 }, { x: 0.8, y: 1.05, z: 0.2 }, 'bunker_ammo_crate_b'));
        root.add(this._box(chevronStripe, { x: 1.4, y: 0.2, z: 0.05 }, { x: 0, y: 2.1, z: 0.82 }, 'bunker_uscm_chevron'));
      } else if (normalizedType === 'geothermal_vent_flue' || normalizedType === 'vent_flue') {
        // Chantier 237 : Sevastopol Engineering Geothermal Venting Flue (Alien: Isolation)
        const boilerMetal = this._material('darkMetal', { color: 0x27272a, roughness: 0.5, metalness: 0.85 });
        const thermalGlow = this._material('emissiveRed', { color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 2.8 });
        const brassValve = this._material('industrial', { color: 0xb45309, roughness: 0.3, metalness: 0.9 });
        root.add(this._cylinder(boilerMetal, 0.7, 0.95, 3.2, { x: 0, y: 1.6, z: 0 }, { x: 0, y: 0, z: 0 }, 'geothermal_stack', true));
        root.add(this._ring(thermalGlow, 0.96, 0.12, { x: 0, y: 1.2, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'geothermal_heating_coil'));
        root.add(this._ring(thermalGlow, 0.82, 0.1, { x: 0, y: 2.3, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'geothermal_upper_coil'));
        root.add(this._cylinder(boilerMetal, 0.55, 0.55, 0.4, { x: 0, y: 3.3, z: 0 }, { x: 0, y: 0, z: 0 }, 'geothermal_nozzle'));
        root.add(this._ring(brassValve, 0.18, 0.04, { x: 0.75, y: 1.5, z: 0 }, { x: 0, y: Math.PI / 2, z: 0 }, 'geothermal_relief_valve'));
      } else if (normalizedType === 'hive_bio_spire' || normalizedType === 'bio_spire') {
        // Chantier 238 : Hive Central Bio-Spire Catwalk Anchor (Aliens 1986 / AvP)
        const resinSpire = this._material('organic', { color: 0x09090b, roughness: 0.45, metalness: 0.3 });
        const chitinBone = this._material('industrial', { color: 0x292524, roughness: 0.6, metalness: 0.5 });
        const amberPheromone = this._material('emissiveGreen', { color: 0x16a34a, emissive: 0x15803d, emissiveIntensity: 2.2 });
        root.add(this._cylinder(resinSpire, 0.6, 1.4, 5.5, { x: 0, y: 2.75, z: 0 }, { x: 0, y: 0, z: 0 }, 'spire_trunk_column', true));
        for (let rib = 0; rib < 5; rib++) {
          const y = 1.0 + rib * 0.9;
          root.add(this._ring(chitinBone, 1.1 + rib * 0.08, 0.12, { x: 0, y, z: 0 }, { x: Math.PI / 2 + 0.15, y: rib * 0.4, z: 0 }, `spire_rib_${rib}`));
        }
        root.add(this._cylinder(chitinBone, 1.25, 0.8, 0.35, { x: 0, y: 4.8, z: 0 }, { x: 0, y: 0, z: 0 }, 'spire_ambush_perch'));
        root.add(this._ellipsoid(amberPheromone, { x: 0.28, y: 0.45, z: 0.28 }, { x: 0.45, y: 2.2, z: 0.3 }, 'spire_pheromone_bulb'));
      } else if (normalizedType === 'jettison_bolt_console' || normalizedType === 'jettison_console') {
        // Chantier 239 : Orbital Module Jettison Explosive Bolt Console (Alien 1979 / Romulus)
        const pedestalMetal = this._material('industrial', { color: 0x1e293b, roughness: 0.4, metalness: 0.8 });
        const hazardHatch = this._material('hazard', { color: 0xeab308, roughness: 0.35 });
        const redHandle = this._material('emissiveRed', { color: 0xdc2626, emissive: 0xb91c1c, emissiveIntensity: 2.8 });
        const crtScreen = this._material('emissiveGreen', { color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 2.5 });
        root.add(this._box(pedestalMetal, { x: 0.9, y: 1.15, z: 0.7 }, { x: 0, y: 0.58, z: 0 }, 'jettison_pedestal', true));
        root.add(this._box(hazardHatch, { x: 0.75, y: 0.08, z: 0.55 }, { x: 0, y: 1.18, z: 0.05 }, 'jettison_hazard_cover'));
        root.add(this._cylinder(redHandle, 0.04, 0.04, 0.32, { x: 0, y: 1.32, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, 'jettison_t_handle'));
        root.add(this._cylinder(redHandle, 0.03, 0.03, 0.15, { x: 0, y: 1.25, z: 0 }, { x: 0, y: 0, z: 0 }, 'jettison_handle_stem'));
        root.add(this._box(crtScreen, { x: 0.55, y: 0.35, z: 0.04 }, { x: 0, y: 1.45, z: -0.22 }, 'jettison_crt_monitor'));
      } else if (normalizedType === 'fiorina_lead_channel' || normalizedType === 'lead_channel') {
        // Chantier 240 : Fiorina 161 Foundry Lead Smelting Channel (Alien 3)
        const troughBrick = this._material('darkMetal', { color: 0x1c1917, roughness: 0.85, metalness: 0.3 });
        const moltenLead = this._material('emissiveRed', { color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 3.5 });
        const sluiceIron = this._material('industrial', { color: 0x44403c, roughness: 0.6, metalness: 0.8 });
        const catwalkRail = this._material('industrial', { color: 0x78716c, roughness: 0.4, metalness: 0.7 });
        root.add(this._box(troughBrick, { x: 5.6, y: 0.7, z: 2.2 }, { x: 0, y: 0.35, z: 0 }, 'lead_trough_basin', true));
        root.add(this._box(moltenLead, { x: 5.4, y: 0.15, z: 1.8 }, { x: 0, y: 0.65, z: 0 }, 'lead_molten_pool'));
        root.add(this._box(sluiceIron, { x: 0.25, y: 2.2, z: 2.3 }, { x: -2.4, y: 1.1, z: 0 }, 'lead_sluice_gate'));
        root.add(this._box(sluiceIron, { x: 5.6, y: 0.1, z: 0.7 }, { x: 0, y: 1.9, z: 0 }, 'lead_overhead_walkway', true));
        root.add(this._box(catwalkRail, { x: 5.6, y: 0.05, z: 0.05 }, { x: 0, y: 2.6, z: -0.32 }, 'lead_catwalk_rail_l'));
        root.add(this._box(catwalkRail, { x: 5.6, y: 0.05, z: 0.05 }, { x: 0, y: 2.6, z: 0.32 }, 'lead_catwalk_rail_r'));
      } else if (normalizedType === 'nostromo_maintenance_gondola' || normalizedType === 'maintenance_gondola') {
        // Chantier 241 : Nostromo Class M Maintenance Gondola & Crane Track (Alien 1979)
        const gondolaSteel = this._material('industrial', { color: 0x475569, roughness: 0.4, metalness: 0.85 });
        const yellowBar = this._material('hazard', { color: 0xeab308, roughness: 0.35 });
        const cableDark = this._material('darkMetal', { color: 0x18181b, roughness: 0.2, metalness: 0.95 });
        root.add(this._box(gondolaSteel, { x: 3.2, y: 0.2, z: 2.2 }, { x: 0, y: 0.1, z: 0 }, 'gondola_floor_plate', true));
        root.add(this._box(yellowBar, { x: 3.2, y: 0.08, z: 0.08 }, { x: 0, y: 1.1, z: 1.05 }, 'gondola_rail_s'));
        root.add(this._box(yellowBar, { x: 3.2, y: 0.08, z: 0.08 }, { x: 0, y: 1.1, z: -1.05 }, 'gondola_rail_n'));
        root.add(this._box(yellowBar, { x: 0.08, y: 0.08, z: 2.1 }, { x: 1.55, y: 1.1, z: 0 }, 'gondola_rail_e'));
        root.add(this._box(yellowBar, { x: 0.08, y: 0.08, z: 2.1 }, { x: -1.55, y: 1.1, z: 0 }, 'gondola_rail_w'));
        root.add(this._cylinder(cableDark, 0.03, 0.03, 5.0, { x: -1.4, y: 3.6, z: -0.9 }, { x: 0, y: 0, z: 0 }, 'gondola_cable_fl'));
        root.add(this._cylinder(cableDark, 0.03, 0.03, 5.0, { x: 1.4, y: 3.6, z: -0.9 }, { x: 0, y: 0, z: 0 }, 'gondola_cable_fr'));
        root.add(this._cylinder(cableDark, 0.03, 0.03, 5.0, { x: -1.4, y: 3.6, z: 0.9 }, { x: 0, y: 0, z: 0 }, 'gondola_cable_rl'));
        root.add(this._cylinder(cableDark, 0.03, 0.03, 5.0, { x: 1.4, y: 3.6, z: 0.9 }, { x: 0, y: 0, z: 0 }, 'gondola_cable_rr'));
        root.add(this._box(dark, { x: 3.4, y: 0.45, z: 2.4 }, { x: 0, y: 6.2, z: 0 }, 'gondola_trolley_mount'));
      } else if (normalizedType === 'sevastopol_synthetic_cell' || normalizedType === 'synthetic_containment_cell') {
        // Chantier 242 : Sevastopol Synthetic Containment Airlock & Polycarbonate Cell (Alien: Isolation)
        const cellSteel = this._material('darkMetal', { color: 0x1e293b, roughness: 0.35, metalness: 0.8 });
        const polycarb = this._material('emissiveBlue', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.5, opacity: 0.55, transparent: true });
        const lockAmber = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 2.8 });
        root.add(this._cylinder(cellSteel, 1.4, 1.5, 0.4, { x: 0, y: 0.2, z: 0 }, { x: 0, y: 0, z: 0 }, 'cell_base_plate', true));
        root.add(this._cylinder(polycarb, 1.35, 1.35, 2.8, { x: 0, y: 1.7, z: 0 }, { x: 0, y: 0, z: 0 }, 'cell_polycarb_wall'));
        root.add(this._cylinder(cellSteel, 1.5, 1.4, 0.4, { x: 0, y: 3.2, z: 0 }, { x: 0, y: 0, z: 0 }, 'cell_top_cap'));
        for (let l = 0; l < 3; l++) {
          const ang = (l * Math.PI * 2) / 3;
          root.add(this._box(lockAmber, { x: 0.25, y: 0.35, z: 0.2 }, { x: Math.cos(ang) * 1.45, y: 1.8, z: Math.sin(ang) * 1.45 }, `cell_maglock_${l}`));
        }
      } else if (normalizedType === 'fiorina_shaft_fan' || normalizedType === 'ventilation_fan_rotor') {
        // Chantier 243 : Fiorina 161 Ventilation Shaft Fan Rotor & Blade Slicer (Alien 3)
        const shroudMetal = this._material('darkMetal', { color: 0x18181b, roughness: 0.5, metalness: 0.9 });
        const bladeSteel = this._material('industrial', { color: 0x94a3b8, roughness: 0.25, metalness: 0.95 });
        const hubDark = this._material('darkMetal', { color: 0x09090b, roughness: 0.4, metalness: 0.8 });
        root.add(this._ring(shroudMetal, 1.65, 0.28, { x: 0, y: 1.8, z: 0 }, { x: 0, y: 0, z: 0 }, 'fan_outer_shroud', true));
        root.add(this._cylinder(hubDark, 0.4, 0.4, 0.5, { x: 0, y: 1.8, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'fan_rotor_hub'));
        for (let b = 0; b < 6; b++) {
          const ang = (b * Math.PI) / 3;
          root.add(this._box(bladeSteel, { x: 1.15, y: 0.18, z: 0.04 }, { x: Math.cos(ang) * 0.8, y: 1.8 + Math.sin(ang) * 0.8, z: 0 }, `fan_blade_${b}`));
        }
      } else if (normalizedType === 'hadley_scrubber_column' || normalizedType === 'atmospheric_scrubber_column') {
        // Chantier 244 : Hadley's Hope Atmospheric Scrubber Column (Aliens 1986)
        const towerMetal = this._material('industrial', { color: 0x334155, roughness: 0.5, metalness: 0.75 });
        const frostCyan = this._material('emissiveBlue', { color: 0xbae6fd, emissive: 0x38bdf8, emissiveIntensity: 1.8 });
        const valveBrass = this._material('industrial', { color: 0xb45309, roughness: 0.3, metalness: 0.85 });
        root.add(this._cylinder(towerMetal, 1.1, 1.3, 5.2, { x: 0, y: 2.6, z: 0 }, { x: 0, y: 0, z: 0 }, 'scrubber_column_trunk', true));
        for (let tier = 0; tier < 4; tier++) {
          root.add(this._ring(frostCyan, 1.38, 0.1, { x: 0, y: 1.2 + tier * 1.0, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, `scrubber_frost_coil_${tier}`));
        }
        root.add(this._ring(valveBrass, 0.22, 0.05, { x: 1.3, y: 2.1, z: 0 }, { x: 0, y: Math.PI / 2, z: 0 }, 'scrubber_evap_valve'));
      } else if (normalizedType === 'gravity_inversion_chamber' || normalizedType === 'gravity_chamber') {
        // Chantier 245 : Renaissance Station Gravity Inversion Chamber (Alien: Romulus)
        const frameTitanium = this._material('industrial', { color: 0x64748b, roughness: 0.3, metalness: 0.85 });
        const gravityViolet = this._material('emissivePurple', { color: 0xc084fc, emissive: 0xa855f7, emissiveIntensity: 3.0 });
        const gimbalDark = this._material('darkMetal', { color: 0x0f172a, roughness: 0.4, metalness: 0.9 });
        root.add(this._ring(frameTitanium, 2.2, 0.25, { x: 0, y: 1.6, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'gravity_outer_gimbal', true));
        root.add(this._ring(gravityViolet, 1.8, 0.12, { x: 0, y: 1.6, z: 0 }, { x: 0, y: Math.PI / 2, z: 0 }, 'gravity_flux_emitter'));
        root.add(this._cylinder(gimbalDark, 0.35, 0.35, 1.2, { x: 0, y: 0.6, z: 0 }, { x: 0, y: 0, z: 0 }, 'gravity_pedestal_core'));
      } else if (normalizedType === 'uscm_sentry_barricade' || normalizedType === 'sentry_barricade') {
        // Chantier 246 : USCM Sentry Gun Barricade Chokepoint (Aliens: Dark Descent)
        const sandbagMat = this._material('industrial', { color: 0x78716c, roughness: 0.9, metalness: 0.1 });
        const wireSteel = this._material('darkMetal', { color: 0x27272a, roughness: 0.2, metalness: 0.95 });
        const gunMountMat = this._material('hazard', { color: 0x15803d, roughness: 0.4, metalness: 0.6 });
        root.add(this._box(sandbagMat, { x: 3.6, y: 0.85, z: 0.7 }, { x: 0, y: 0.42, z: 0 }, 'sentry_sandbag_front', true));
        root.add(this._cylinder(wireSteel, 0.3, 0.3, 3.4, { x: 0, y: 0.3, z: 0.75 }, { x: 0, y: 0, z: Math.PI / 2 }, 'sentry_concertina_wire'));
        root.add(this._cylinder(gunMountMat, 0.08, 0.08, 1.1, { x: -1.2, y: 0.9, z: -0.3 }, { x: 0, y: 0, z: 0 }, 'sentry_pylon_l'));
        root.add(this._cylinder(gunMountMat, 0.08, 0.08, 1.1, { x: 1.2, y: 0.9, z: -0.3 }, { x: 0, y: 0, z: 0 }, 'sentry_pylon_r'));
      } else if (normalizedType === 'auriga_flooded_bay' || normalizedType === 'flooded_cargo_bay') {
        // Chantier 247 : USM Auriga Sub-Deck Flooded Cargo Bay (Alien Resurrection 1997)
        const basinArmor = this._material('darkMetal', { color: 0x09090b, roughness: 0.8, metalness: 0.5 });
        const bayWater = this._material('emissiveBlue', { color: 0x0284c7, emissive: 0x0369a1, emissiveIntensity: 1.4, opacity: 0.7, transparent: true });
        const cargoBox = this._material('industrial', { color: 0x334155, roughness: 0.5, metalness: 0.7 });
        const ladderYellow = this._material('industrial', { color: 0xeab308, roughness: 0.35, metalness: 0.65 });
        root.add(this._box(basinArmor, { x: 4.8, y: 0.7, z: 4.0 }, { x: 0, y: 0.35, z: 0 }, 'auriga_sub_basin', true));
        root.add(this._box(bayWater, { x: 4.5, y: 0.15, z: 3.7 }, { x: 0, y: 0.65, z: 0 }, 'auriga_water_surface'));
        root.add(this._box(cargoBox, { x: 1.4, y: 1.2, z: 1.4 }, { x: -1.2, y: 0.8, z: -0.8 }, 'auriga_sunken_crate', true));
        for (let r = 0; r < 4; r++) {
          root.add(this._box(ladderYellow, { x: 0.05, y: 0.05, z: 0.7 }, { x: 2.1, y: 0.3 + r * 0.4, z: 0 }, `auriga_ladder_rung_${r}`));
        }
      } else if (normalizedType === 'apollo_server_tower' || normalizedType === 'apollo_server_core') {
        // Chantier 248 : Sevastopol Apollo AI Server Core Tower (Alien: Isolation)
        const serverChassis = this._material('darkMetal', { color: 0x09090b, roughness: 0.3, metalness: 0.9 });
        const blinkerGreen = this._material('emissiveGreen', { color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 2.8 });
        const apolloScreen = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 2.5 });
        root.add(this._box(serverChassis, { x: 1.6, y: 4.5, z: 1.6 }, { x: 0, y: 2.25, z: 0 }, 'apollo_rack_tower', true));
        for (let row = 0; row < 6; row++) {
          root.add(this._box(blinkerGreen, { x: 1.2, y: 0.08, z: 0.04 }, { x: 0, y: 0.8 + row * 0.55, z: 0.82 }, `apollo_led_row_${row}`));
        }
        root.add(this._box(apolloScreen, { x: 0.7, y: 0.45, z: 0.05 }, { x: 0, y: 2.7, z: 0.82 }, 'apollo_main_screen'));
      } else if (normalizedType === 'specimen_dissection_theater' || normalizedType === 'dissection_theater') {
        // Chantier 249 : Weyland Specimen Dissection Theater (Alien: Romulus / Resurrection)
        const surgicalSteel = this._material('industrial', { color: 0xe2e8f0, roughness: 0.15, metalness: 0.95 });
        const scialyticLight = this._material('emissiveBlue', { color: 0xf8fafc, emissive: 0x38bdf8, emissiveIntensity: 3.2 });
        const darkArm = this._material('darkMetal', { color: 0x1e293b, roughness: 0.4, metalness: 0.8 });
        root.add(this._box(surgicalSteel, { x: 2.4, y: 0.25, z: 1.2 }, { x: 0, y: 1.0, z: 0 }, 'dissection_table_top', true));
        root.add(this._cylinder(surgicalSteel, 0.15, 0.15, 1.0, { x: 0, y: 0.5, z: 0 }, { x: 0, y: 0, z: 0 }, 'dissection_pedestal'));
        root.add(this._cylinder(darkArm, 0.05, 0.05, 1.8, { x: -1.3, y: 1.9, z: 0 }, { x: 0, y: 0, z: 0 }, 'scialytic_support_arm'));
        root.add(this._cylinder(darkArm, 0.05, 0.05, 1.2, { x: -0.7, y: 2.8, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, 'scialytic_horizontal_arm'));
        root.add(this._cylinder(scialyticLight, 0.35, 0.4, 0.15, { x: 0, y: 2.65, z: 0 }, { x: 0, y: 0, z: 0 }, 'scialytic_lamp_head'));
      } else if (normalizedType === 'fiorina_slag_press' || normalizedType === 'slag_crucible_press') {
        // Chantier 250 : Fiorina 161 Piston-Driven Slag Press (Alien 3)
        const frameSteel = this._material('darkMetal', { color: 0x18181b, roughness: 0.6, metalness: 0.85 });
        const pistonChrome = this._material('industrial', { color: 0xcbd5e1, roughness: 0.15, metalness: 0.95 });
        const slagGlow = this._material('emissiveRed', { color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 3.2 });
        root.add(this._box(frameSteel, { x: 2.8, y: 4.8, z: 2.2 }, { x: 0, y: 2.4, z: 0 }, 'slag_press_uprights', true));
        root.add(this._box(frameSteel, { x: 2.2, y: 0.8, z: 1.8 }, { x: 0, y: 0.4, z: 0 }, 'slag_anvil_base', true));
        root.add(this._box(slagGlow, { x: 1.6, y: 0.08, z: 1.2 }, { x: 0, y: 0.84, z: 0 }, 'slag_molten_residue'));
        root.add(this._cylinder(pistonChrome, 0.22, 0.22, 2.2, { x: 0, y: 3.2, z: 0 }, { x: 0, y: 0, z: 0 }, 'slag_hydraulic_ram'));
        root.add(this._box(frameSteel, { x: 1.8, y: 0.5, z: 1.4 }, { x: 0, y: 2.1, z: 0 }, 'slag_stamp_head'));
      } else if (normalizedType === 'cryo_vault_matrix' || normalizedType === 'nostromo_cryo_matrix') {
        // Chantier 251 : Nostromo Cryo-Vault Central Matrix & Coolant Manifold (Alien 1979)
        const hexSteel = this._material('industrial', { color: 0xe2e8f0, roughness: 0.35, metalness: 0.8 });
        const frostCyan = this._material('emissiveBlue', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.4, opacity: 0.85, transparent: true });
        const copperPipe = this._material('industrial', { color: 0xb45309, roughness: 0.3, metalness: 0.85 });
        const muthurConsole = this._material('emissiveGreen', { color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 2.6 });
        // Base surélevée et noyau central
        root.add(this._cylinder(hexSteel, 2.4, 2.6, 0.4, { x: 0, y: 0.2, z: 0 }, { x: 0, y: 0, z: 0 }, 'cryo_hex_base', true));
        root.add(this._cylinder(hexSteel, 0.6, 0.6, 2.8, { x: 0, y: 1.4, z: 0 }, { x: 0, y: 0, z: 0 }, 'cryo_central_core', true));
        // 6 Caissons cryogéniques radiaux hexagonaux
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2;
          const px = Math.cos(ang) * 1.6;
          const pz = Math.sin(ang) * 1.6;
          root.add(this._box(hexSteel, { x: 0.8, y: 1.8, z: 0.6 }, { x: px, y: 1.0, z: pz }, `cryo_pod_hull_${i}`, true));
          root.add(this._box(frostCyan, { x: 0.5, y: 1.2, z: 0.1 }, { x: px * 1.1, y: 1.1, z: pz * 1.1 }, `cryo_pod_glass_${i}`));
          root.add(this._cylinder(copperPipe, 0.04, 0.04, 1.4, { x: px * 0.7, y: 1.8, z: pz * 0.7 }, { x: 0, y: 0, z: 0 }, `cryo_feed_tube_${i}`));
        }
        root.add(this._box(muthurConsole, { x: 0.4, y: 0.3, z: 0.1 }, { x: 0, y: 1.6, z: 0.65 }, 'cryo_muthur_telemetry'));
      } else if (normalizedType === 'chasm_retractable_bridge' || normalizedType === 'operations_chasm_bridge') {
        // Chantier 252 : Hadley's Hope Sub-Level 3 Operations Chasm & Retractable Access Bridge (Aliens 1986)
        const frameDark = this._material('darkMetal', { color: 0x1e293b, roughness: 0.7, metalness: 0.85 });
        const grateYellow = this._material('hazard', { color: 0xeab308, roughness: 0.4, metalness: 0.6 });
        const pistonSteel = this._material('industrial', { color: 0x94a3b8, roughness: 0.2, metalness: 0.9 });
        const warningAmber = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 3.2 });
        // Culées de gouffre des deux côtés
        root.add(this._box(frameDark, { x: 1.4, y: 2.2, z: 4.2 }, { x: -2.8, y: 1.1, z: 0 }, 'chasm_abutment_left', true));
        root.add(this._box(frameDark, { x: 1.4, y: 2.2, z: 4.2 }, { x: 2.8, y: 1.1, z: 0 }, 'chasm_abutment_right', true));
        // Tablier rétractable ajouré central
        root.add(this._box(grateYellow, { x: 4.4, y: 0.25, z: 2.2 }, { x: 0, y: 1.9, z: 0 }, 'chasm_retractable_deck', true));
        // Vérins hydrauliques télescopiques
        root.add(this._cylinder(pistonSteel, 0.12, 0.12, 3.8, { x: 0, y: 1.5, z: -1.0 }, { x: 0, y: 0, z: Math.PI / 2 }, 'chasm_hydraulic_piston_front'));
        root.add(this._cylinder(pistonSteel, 0.12, 0.12, 3.8, { x: 0, y: 1.5, z: 1.0 }, { x: 0, y: 0, z: Math.PI / 2 }, 'chasm_hydraulic_piston_back'));
        // Balises lumineuses d'alarme
        root.add(this._cylinder(warningAmber, 0.08, 0.08, 0.25, { x: -2.0, y: 2.3, z: 1.1 }, { x: 0, y: 0, z: 0 }, 'chasm_alarm_left'));
        root.add(this._cylinder(warningAmber, 0.08, 0.08, 0.25, { x: 2.0, y: 2.3, z: 1.1 }, { x: 0, y: 0, z: 0 }, 'chasm_alarm_right'));
      } else if (normalizedType === 'toxic_quench_basin' || normalizedType === 'quench_basin') {
        // Chantier 253 : Fiorina 161 Toxic Quench Basin & Steam Dispersion Vent (Alien 3)
        const darkBrick = this._material('darkMetal', { color: 0x27272a, roughness: 0.85, metalness: 0.3 });
        const toxicGreen = this._material('emissiveGreen', { color: 0x84cc16, emissive: 0x4d7c0f, emissiveIntensity: 2.5, opacity: 0.8, transparent: true });
        const rustyGrate = this._material('industrial', { color: 0x78350f, roughness: 0.6, metalness: 0.7 });
        // Cuve circulaire en brique réfractaire
        root.add(this._cylinder(darkBrick, 2.2, 2.5, 1.4, { x: 0, y: 0.7, z: 0 }, { x: 0, y: 0, z: 0 }, 'quench_basin_wall', true));
        // Surface de liquide corrosif bouillonnant
        root.add(this._cylinder(toxicGreen, 2.0, 2.0, 0.1, { x: 0, y: 1.1, z: 0 }, { x: 0, y: 0, z: 0 }, 'quench_acid_surface'));
        // Cheminée d'évacuation de vapeur
        root.add(this._cylinder(rustyGrate, 0.35, 0.35, 2.8, { x: -1.6, y: 1.4, z: -1.6 }, { x: 0, y: 0, z: 0 }, 'quench_steam_vent', true));
        root.add(this._ring(rustyGrate, 0.45, 0.08, { x: -1.6, y: 2.8, z: -1.6 }, { x: Math.PI / 2, y: 0, z: 0 }, 'quench_vent_collar'));
      } else if (normalizedType === 'observation_lab_window' || normalizedType === 'auriga_observation_lab') {
        // Chantier 254 : USM Auriga Xenomorph Incubation Observation Lab & Reinforced Mirror (Alien Resurrection)
        const frameTitanium = this._material('darkMetal', { color: 0x334155, roughness: 0.3, metalness: 0.9 });
        const oneWayMirror = this._material('emissiveBlue', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.8, opacity: 0.75, transparent: true });
        const consoleWhite = this._material('industrial', { color: 0xf1f5f9, roughness: 0.25, metalness: 0.6 });
        const alertRed = this._material('emissiveRed', { color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 2.8 });
        // Châssis blindé lourd
        root.add(this._box(frameTitanium, { x: 4.8, y: 3.2, z: 0.5 }, { x: 0, y: 1.6, z: 0 }, 'obs_frame_outer', true));
        // Baie vitrée sans tain centrale
        root.add(this._box(oneWayMirror, { x: 4.0, y: 2.4, z: 0.15 }, { x: 0, y: 1.6, z: 0 }, 'obs_glass_mirror'));
        // Pupitre de contrôle de surveillance biométrique
        root.add(this._box(consoleWhite, { x: 2.6, y: 0.85, z: 0.8 }, { x: 0, y: 0.42, z: 0.8 }, 'obs_biometric_console', true));
        root.add(this._box(alertRed, { x: 0.6, y: 0.06, z: 0.06 }, { x: 0, y: 0.86, z: 0.8 }, 'obs_biometric_led_strip'));
      } else if (normalizedType === 'cryo_fuel_centrifuge' || normalizedType === 'renaissance_cryo_centrifuge') {
        // Chantier 255 : Renaissance Station Cryo-Fuel Centrifuge Rotor & Siphon Lines (Alien: Romulus)
        const rotorSteel = this._material('darkMetal', { color: 0x0f172a, roughness: 0.4, metalness: 0.9 });
        const tankCyan = this._material('emissiveBlue', { color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 2.8 });
        const pipeSilver = this._material('industrial', { color: 0xcbd5e1, roughness: 0.2, metalness: 0.85 });
        // Carénage toroïdal centrifuge
        root.add(this._cylinder(rotorSteel, 2.2, 2.2, 1.2, { x: 0, y: 1.2, z: 0 }, { x: 0, y: 0, z: 0 }, 'centrifuge_housing', true));
        root.add(this._ring(rotorSteel, 2.4, 0.18, { x: 0, y: 1.8, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'centrifuge_flange'));
        // 4 Bonbonnes de carburant cryogénique montées radialement
        for (let b = 0; b < 4; b++) {
          const ang = b * (Math.PI / 2);
          root.add(this._cylinder(tankCyan, 0.35, 0.35, 1.8, { x: Math.cos(ang) * 1.5, y: 1.2, z: Math.sin(ang) * 1.5 }, { x: 0, y: 0, z: 0 }, `centrifuge_cryo_tank_${b}`));
          root.add(this._cylinder(pipeSilver, 0.08, 0.08, 1.2, { x: Math.cos(ang) * 0.9, y: 2.1, z: Math.sin(ang) * 0.9 }, { x: 0, y: 0, z: 0 }, `centrifuge_siphon_${b}`));
        }
      } else if (normalizedType === 'transit_rail_switch' || normalizedType === 'sevastopol_rail_switch') {
        // Chantier 256 : Sevastopol Transit Car Rail Switch & High-Voltage Third Rail (Alien: Isolation)
        const railSteel = this._material('industrial', { color: 0x64748b, roughness: 0.3, metalness: 0.95 });
        const thirdRailCopper = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 2.8 });
        const tieWood = this._material('darkMetal', { color: 0x18181b, roughness: 0.9, metalness: 0.2 });
        const boxSeegson = this._material('hazard', { color: 0x0284c7, roughness: 0.5, metalness: 0.6 });
        // Traverses ferroviaires
        for (let t = -3; t <= 3; t++) {
          root.add(this._box(tieWood, { x: 3.2, y: 0.12, z: 0.35 }, { x: 0, y: 0.06, z: t * 0.8 }, `rail_tie_${t}`, true));
        }
        // Rails porteurs gauche et droite
        root.add(this._box(railSteel, { x: 0.12, y: 0.18, z: 5.6 }, { x: -1.1, y: 0.22, z: 0 }, 'rail_track_left', true));
        root.add(this._box(railSteel, { x: 0.12, y: 0.18, z: 5.6 }, { x: 1.1, y: 0.22, z: 0 }, 'rail_track_right', true));
        // 3e rail haute tension électrifié au centre
        root.add(this._box(thirdRailCopper, { x: 0.15, y: 0.25, z: 5.6 }, { x: 0, y: 0.28, z: 0 }, 'rail_third_rail_electrified'));
        // Boîtier d'aiguillage Seegson
        root.add(this._box(boxSeegson, { x: 0.6, y: 0.8, z: 0.5 }, { x: 1.8, y: 0.45, z: 0 }, 'rail_switch_box', true));
      } else if (normalizedType === 'medlab_autopsy_chute' || normalizedType === 'autopsy_incinerator_chute') {
        // Chantier 257 : Hadley's Hope MedLab Autopsy Sump Drain & Biohazard Chute (Aliens 1986)
        const steelTable = this._material('industrial', { color: 0x94a3b8, roughness: 0.18, metalness: 0.92 });
        const fireGlow = this._material('emissiveRed', { color: 0xf97316, emissive: 0xc2410c, emissiveIntensity: 3.4 });
        const darkChute = this._material('darkMetal', { color: 0x0f172a, roughness: 0.6, metalness: 0.8 });
        // Table d'autopsie inox incurvée
        root.add(this._box(steelTable, { x: 2.6, y: 0.2, z: 1.3 }, { x: 0, y: 0.95, z: 0 }, 'autopsy_table_surface', true));
        root.add(this._cylinder(steelTable, 0.2, 0.2, 0.85, { x: 0, y: 0.45, z: 0 }, { x: 0, y: 0, z: 0 }, 'autopsy_table_pedestal'));
        // Goulotte d'évacuation de déchets au pied de table
        root.add(this._box(darkChute, { x: 1.1, y: 1.2, z: 1.1 }, { x: 1.4, y: 0.6, z: 0 }, 'autopsy_drain_hopper', true));
        // Trappe guillotine vers l'incinérateur avec lueur thermique
        root.add(this._box(fireGlow, { x: 0.8, y: 0.05, z: 0.8 }, { x: 1.4, y: 0.1, z: 0 }, 'autopsy_incinerator_glow'));
      } else if (normalizedType === 'vehicle_crane_arm' || normalizedType === 'uscm_vehicle_crane') {
        // Chantier 258 : USCM Heavy Vehicle Maintenance Bay & Hydraulic Crane Arm (Aliens: Dark Descent)
        const craneOlive = this._material('industrial', { color: 0x365314, roughness: 0.55, metalness: 0.7 });
        const cableSteel = this._material('darkMetal', { color: 0x18181b, roughness: 0.2, metalness: 0.95 });
        const hookYellow = this._material('hazard', { color: 0xeab308, roughness: 0.35, metalness: 0.7 });
        // Pylône vertical pivotant
        root.add(this._cylinder(craneOlive, 0.45, 0.55, 3.8, { x: 0, y: 1.9, z: 0 }, { x: 0, y: 0, z: 0 }, 'crane_main_pylon', true));
        root.add(this._cylinder(craneOlive, 0.75, 0.85, 0.4, { x: 0, y: 0.2, z: 0 }, { x: 0, y: 0, z: 0 }, 'crane_slew_ring', true));
        // Flèche horizontale télescopique
        root.add(this._box(craneOlive, { x: 4.2, y: 0.45, z: 0.45 }, { x: 1.8, y: 3.7, z: 0 }, 'crane_jib_boom', true));
        // Câbles de levage et treuil à crochet de 15t
        root.add(this._cylinder(cableSteel, 0.03, 0.03, 2.2, { x: 3.6, y: 2.5, z: 0 }, { x: 0, y: 0, z: 0 }, 'crane_hoist_cable'));
        root.add(this._box(hookYellow, { x: 0.35, y: 0.5, z: 0.25 }, { x: 3.6, y: 1.3, z: 0 }, 'crane_15t_hook_block'));
      } else if (normalizedType === 'lorenz_comms_dish' || normalizedType === 'sevastopol_comms_dish') {
        // Chantier 259 : Sevastopol Lorenz Systech Spire Comms Array Uplink Dish (Alien: Isolation)
        const dishAlloy = this._material('industrial', { color: 0x475569, roughness: 0.35, metalness: 0.85 });
        const waveCyan = this._material('emissiveBlue', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 3.0 });
        const pylonDark = this._material('darkMetal', { color: 0x0f172a, roughness: 0.5, metalness: 0.9 });
        // Trépied de montage
        root.add(this._cylinder(pylonDark, 0.22, 0.35, 2.2, { x: 0, y: 1.1, z: 0 }, { x: 0, y: 0, z: 0 }, 'comms_dish_mast', true));
        // Réflecteur parabolique
        root.add(this._cone(dishAlloy, 1.8, 0.7, { x: 0, y: 2.4, z: 0 }, { x: 0.4, y: 0, z: 0 }, 'comms_parabolic_dish', true));
        // Corne d'alimentation micro-ondes
        root.add(this._cylinder(dishAlloy, 0.05, 0.05, 1.1, { x: 0, y: 2.7, z: 0.4 }, { x: 0.4, y: 0, z: 0 }, 'comms_subreflector_strut'));
        root.add(this._ellipsoid(waveCyan, { x: 0.15, y: 0.15, z: 0.15 }, { x: 0, y: 3.1, z: 0.6 }, 'comms_emitter_horn'));
      } else if (normalizedType === 'corbel_docking_clamp' || normalizedType === 'renaissance_docking_clamp') {
        // Chantier 260 : Renaissance Station Corbel Airlock Docking Clamp (Alien: Romulus)
        const ringTitanium = this._material('darkMetal', { color: 0x1e293b, roughness: 0.4, metalness: 0.9 });
        const sealNeoprene = this._material('industrial', { color: 0x09090b, roughness: 0.85, metalness: 0.1 });
        const clampSteel = this._material('hazard', { color: 0xeab308, roughness: 0.35, metalness: 0.75 });
        const beaconAmber = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 3.5 });
        // Anneau d'amarrage circulaire de 3.6m
        root.add(this._ring(ringTitanium, 3.4, 0.35, { x: 0, y: 2.0, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'corbel_docking_ring', true));
        root.add(this._ring(sealNeoprene, 3.1, 0.15, { x: 0, y: 2.0, z: 0.2 }, { x: Math.PI / 2, y: 0, z: 0 }, 'corbel_pressure_seal'));
        // 4 Mâchoires de verrouillage hydrauliques
        for (let c = 0; c < 4; c++) {
          const ang = c * (Math.PI / 2);
          root.add(this._box(clampSteel, { x: 0.65, y: 0.45, z: 0.8 }, { x: Math.cos(ang) * 1.8, y: 2.0 + Math.sin(ang) * 1.8, z: 0 }, `corbel_clamp_jaw_${c}`));
        }
        root.add(this._cylinder(beaconAmber, 0.1, 0.1, 0.2, { x: 0, y: 3.8, z: 0 }, { x: 0, y: 0, z: 0 }, 'corbel_docking_beacon'));
      } else if (normalizedType === 'narcissus_boarding_ramp' || normalizedType === 'narcissus_ramp') {
        // Chantier 261 : Nostromo Narcissus Shuttle Retractable Boarding Ramp & Umbilical (Alien 1979)
        const frameAlloy = this._material('industrial', { color: 0x94a3b8, roughness: 0.35, metalness: 0.85 });
        const grateWalkway = this._material('hazard', { color: 0xe2e8f0, roughness: 0.5, metalness: 0.7 });
        const cableBlack = this._material('darkMetal', { color: 0x09090b, roughness: 0.7, metalness: 0.2 });
        const lightCyan = this._material('emissiveBlue', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.5 });
        // Tablier incliné de la rampe
        const rampGroup = new THREE.Group();
        rampGroup.rotation.x = -0.32;
        rampGroup.add(this._box(grateWalkway, { x: 2.2, y: 0.15, z: 4.8 }, { x: 0, y: 0, z: 0 }, 'ramp_surface', true));
        for (let side = -1; side <= 1; side += 2) {
          rampGroup.add(this._box(frameAlloy, { x: 0.1, y: 0.85, z: 4.8 }, { x: side * 1.05, y: 0.45, z: 0 }, `ramp_rail_${side}`, true));
          rampGroup.add(this._cylinder(lightCyan, 0.04, 0.04, 4.8, { x: side * 1.05, y: 0.85, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, `ramp_light_strip_${side}`));
        }
        root.add(rampGroup);
        // Faisceau de câbles ombilicaux au sol
        for (let c = 0; c < 3; c++) {
          root.add(this._cylinder(cableBlack, 0.06, 0.06, 4.2, { x: -1.4 + c * 0.15, y: 0.06, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, `ramp_umbilical_${c}`));
        }
      } else if (normalizedType === 'seismic_stabilizer_piston' || normalizedType === 'seismic_piston') {
        // Chantier 262 : Hadley's Hope Seismic Stabilizer Piston & Bedrock Anchor (Aliens 1986)
        const heavyCastSteel = this._material('darkMetal', { color: 0x1e293b, roughness: 0.6, metalness: 0.9 });
        const ramPolished = this._material('industrial', { color: 0xcbd5e1, roughness: 0.12, metalness: 0.98 });
        const warningOrange = this._material('hazard', { color: 0xf97316, roughness: 0.4, metalness: 0.6 });
        // Socle d'ancrage massif
        root.add(this._box(heavyCastSteel, { x: 2.8, y: 0.7, z: 2.8 }, { x: 0, y: 0.35, z: 0 }, 'seismic_anchor_plinth', true));
        // Corps de vérin hydraulique
        root.add(this._cylinder(heavyCastSteel, 0.75, 0.85, 2.6, { x: 0, y: 2.0, z: 0 }, { x: 0, y: 0, z: 0 }, 'seismic_cylinder_body', true));
        // Tige de piston chromée
        root.add(this._cylinder(ramPolished, 0.42, 0.42, 2.4, { x: 0, y: 3.8, z: 0 }, { x: 0, y: 0, z: 0 }, 'seismic_piston_ram'));
        // 4 Tirants diagonaux
        for (let b = 0; b < 4; b++) {
          const ang = b * (Math.PI / 2);
          root.add(this._segment(warningOrange, new THREE.Vector3(Math.cos(ang) * 1.3, 0.7, Math.sin(ang) * 1.3), new THREE.Vector3(Math.cos(ang) * 0.5, 2.8, Math.sin(ang) * 0.5), 0.1, 0.08, `seismic_brace_${b}`, 8));
        }
      } else if (normalizedType === 'furnace_bellows_duct' || normalizedType === 'furnace_bellows') {
        // Chantier 263 : Fiorina 161 Furnace Bellows Duct & Draft Injector (Alien 3)
        const castIron = this._material('darkMetal', { color: 0x18181b, roughness: 0.75, metalness: 0.85 });
        const bellowsLeather = this._material('industrial', { color: 0x451a03, roughness: 0.85, metalness: 0.2 });
        const heatGlow = this._material('emissiveRed', { color: 0xf97316, emissive: 0xc2410c, emissiveIntensity: 2.8 });
        // Conduite principale en fonte
        root.add(this._cylinder(castIron, 0.65, 0.65, 3.2, { x: 0, y: 1.6, z: 0 }, { x: 0, y: 0, z: 0 }, 'bellows_duct_pipe', true));
        // 5 Anneaux plissés de soufflet
        for (let r = 0; r < 5; r++) {
          root.add(this._ring(bellowsLeather, 0.75, 0.12, { x: 0, y: 0.8 + r * 0.4, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, `bellows_fold_${r}`));
        }
        // Buse d'injection avec lueur thermique
        root.add(this._cone(castIron, 0.85, 0.7, { x: 0, y: 3.5, z: 0 }, { x: 0, y: 0, z: 0 }, 'bellows_injector_nozzle', true));
        root.add(this._ellipsoid(heatGlow, { x: 0.4, y: 0.15, z: 0.4 }, { x: 0, y: 3.8, z: 0 }, 'bellows_draft_glow'));
      } else if (normalizedType === 'cryo_surgical_sarcophagus' || normalizedType === 'surgical_sarcophagus') {
        // Chantier 264 : USM Auriga Cryo-Surgical Stasis Sarcophagus (Alien Resurrection)
        const surgicalTitanium = this._material('industrial', { color: 0xe2e8f0, roughness: 0.2, metalness: 0.95 });
        const stasisGelCyan = this._material('emissiveBlue', { color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 2.2, opacity: 0.75, transparent: true });
        const laserGreen = this._material('emissiveGreen', { color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 3.0 });
        // Coque de sarcophage profilée
        root.add(this._box(surgicalTitanium, { x: 1.2, y: 2.4, z: 0.85 }, { x: 0, y: 1.2, z: 0 }, 'sarcophagus_hull', true));
        // Hublot stasique transparent
        root.add(this._cylinder(stasisGelCyan, 0.35, 0.35, 1.6, { x: 0, y: 1.3, z: 0.32 }, { x: 0, y: 0, z: 0 }, 'sarcophagus_stasis_window'));
        // 3 Arcs lasers de confinement
        for (let l = 0; l < 3; l++) {
          root.add(this._ring(laserGreen, 0.4, 0.02, { x: 0, y: 0.8 + l * 0.45, z: 0.32 }, { x: 0, y: 0, z: 0 }, `sarcophagus_laser_ring_${l}`));
        }
      } else if (normalizedType === 'fuel_siphon_pylon' || normalizedType === 'siphon_pylon') {
        // Chantier 265 : Renaissance Station Fuel Siphon Pylon & Pressure Valve (Alien: Romulus)
        const darkTower = this._material('darkMetal', { color: 0x0f172a, roughness: 0.4, metalness: 0.9 });
        const fuelOrange = this._material('hazard', { color: 0xf59e0b, roughness: 0.45, metalness: 0.65 });
        const gaugeBrass = this._material('industrial', { color: 0xb45309, roughness: 0.25, metalness: 0.85 });
        const ventJet = this._material('emissiveAmber', { color: 0xfbbf24, emissive: 0xd97706, emissiveIntensity: 2.5 });
        // Pylône vertical à section carrée
        root.add(this._box(darkTower, { x: 0.9, y: 4.2, z: 0.9 }, { x: 0, y: 2.1, z: 0 }, 'siphon_pylon_core', true));
        // Manifold de transfert de carburant
        root.add(this._cylinder(fuelOrange, 0.22, 0.22, 2.6, { x: 0, y: 2.4, z: 0.5 }, { x: 0, y: 0, z: Math.PI / 2 }, 'siphon_manifold_pipe'));
        // 2 Manomètres ronds
        root.add(this._cylinder(gaugeBrass, 0.15, 0.15, 0.08, { x: -0.6, y: 2.8, z: 0.5 }, { x: 0, y: Math.PI / 2, z: 0 }, 'siphon_gauge_left'));
        root.add(this._cylinder(gaugeBrass, 0.15, 0.15, 0.08, { x: 0.6, y: 2.8, z: 0.5 }, { x: 0, y: Math.PI / 2, z: 0 }, 'siphon_gauge_right'));
        // Soupape de décharge de surpression
        root.add(this._cylinder(ventJet, 0.1, 0.1, 0.35, { x: 0, y: 4.35, z: 0 }, { x: 0, y: 0, z: 0 }, 'siphon_relief_valve'));
      } else if (normalizedType === 'security_shutter_door' || normalizedType === 'shutter_door') {
        // Chantier 266 : Sevastopol Habitation High-Security Roll-Up Shutter (Alien: Isolation)
        const frameSteel = this._material('darkMetal', { color: 0x1e293b, roughness: 0.5, metalness: 0.85 });
        const corrugatedPanel = this._material('industrial', { color: 0x64748b, roughness: 0.45, metalness: 0.9 });
        const alertBeacon = this._material('emissiveRed', { color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 3.2 });
        // Cadre porteur du rideau
        root.add(this._box(frameSteel, { x: 3.6, y: 3.4, z: 0.45 }, { x: 0, y: 1.7, z: 0 }, 'shutter_outer_frame', true));
        // Tablier métallique ondulé
        root.add(this._box(corrugatedPanel, { x: 3.0, y: 2.8, z: 0.12 }, { x: 0, y: 1.4, z: 0 }, 'shutter_corrugated_curtain'));
        // Tambour supérieur d'enroulement
        root.add(this._cylinder(frameSteel, 0.35, 0.35, 3.4, { x: 0, y: 3.2, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, 'shutter_roller_drum'));
        root.add(this._cylinder(alertBeacon, 0.08, 0.08, 0.2, { x: 1.5, y: 3.5, z: 0.25 }, { x: 0, y: 0, z: 0 }, 'shutter_alarm_light'));
      } else if (normalizedType === 'processing_sump_siphon' || normalizedType === 'sump_siphon') {
        // Chantier 267 : Hadley's Hope Sub-Level 2 Processing Sump Siphon (Aliens 1986)
        const darkBasin = this._material('darkMetal', { color: 0x0f172a, roughness: 0.85, metalness: 0.4 });
        const pumpMotor = this._material('industrial', { color: 0x334155, roughness: 0.4, metalness: 0.85 });
        const toxicOoze = this._material('emissiveGreen', { color: 0x84cc16, emissive: 0x3f6212, emissiveIntensity: 2.2, opacity: 0.7, transparent: true });
        // Grille de puisard au sol
        root.add(this._cylinder(darkBasin, 1.8, 1.8, 0.25, { x: 0, y: 0.12, z: 0 }, { x: 0, y: 0, z: 0 }, 'sump_rim_base', true));
        root.add(this._cylinder(toxicOoze, 1.5, 1.5, 0.05, { x: 0, y: 0.18, z: 0 }, { x: 0, y: 0, z: 0 }, 'sump_drain_liquid'));
        // Corps de pompe centrifuge verticale
        root.add(this._cylinder(pumpMotor, 0.4, 0.4, 1.4, { x: 1.1, y: 0.8, z: 0 }, { x: 0, y: 0, z: 0 }, 'sump_pump_motor', true));
        // Tuyau de refoulement coudé
        root.add(this._cylinder(pumpMotor, 0.15, 0.15, 1.8, { x: 1.1, y: 1.6, z: 0.6 }, { x: Math.PI / 4, y: 0, z: 0 }, 'sump_discharge_pipe'));
      } else if (normalizedType === 'munitions_heavy_pallet' || normalizedType === 'munitions_pallet') {
        // Chantier 268 : USCM Munitions Pallet & Forklift Anchor (Aliens: Dark Descent)
        const palletSteel = this._material('darkMetal', { color: 0x27272a, roughness: 0.65, metalness: 0.8 });
        const ammoOlive = this._material('industrial', { color: 0x365314, roughness: 0.55, metalness: 0.45 });
        const strapYellow = this._material('hazard', { color: 0xeab308, roughness: 0.4, metalness: 0.3 });
        // Palette à semelles pour fourches d'élévateur
        root.add(this._box(palletSteel, { x: 2.2, y: 0.22, z: 2.2 }, { x: 0, y: 0.11, z: 0 }, 'munitions_pallet_base', true));
        // 4 Caisses de cartouches M41A et grenades
        for (let bx = -1; bx <= 1; bx += 2) {
          for (let bz = -1; bz <= 1; bz += 2) {
            root.add(this._box(ammoOlive, { x: 0.9, y: 0.65, z: 0.9 }, { x: bx * 0.5, y: 0.55, z: bz * 0.5 }, `ammo_crate_${bx}_${bz}`, true));
          }
        }
        // 2 Sangles d'arrimage transversales jaunes
        root.add(this._box(strapYellow, { x: 2.05, y: 0.7, z: 0.08 }, { x: 0, y: 0.55, z: 0 }, 'ammo_tie_strap_1'));
        root.add(this._box(strapYellow, { x: 0.08, y: 0.7, z: 2.05 }, { x: 0, y: 0.55, z: 0 }, 'ammo_tie_strap_2'));
      } else if (normalizedType === 'synthetic_recharge_bay' || normalizedType === 'recharge_bay') {
        // Chantier 269 : Sevastopol Synthetic Recharging Terminal Bay (Alien: Isolation)
        const alcoveCream = this._material('industrial', { color: 0xd4d4d8, roughness: 0.6, metalness: 0.3 });
        const terminalCyan = this._material('emissiveBlue', { color: 0x0284c7, emissive: 0x0369a1, emissiveIntensity: 2.8 });
        const copperPins = this._material('industrial', { color: 0xb45309, roughness: 0.2, metalness: 0.95 });
        // Alcôve d'amarrage verticale
        root.add(this._box(alcoveCream, { x: 1.4, y: 2.6, z: 0.9 }, { x: 0, y: 1.3, z: 0 }, 'recharge_alcove_body', true));
        // Connecteur cervical magnétique supérieur
        root.add(this._box(copperPins, { x: 0.35, y: 0.18, z: 0.25 }, { x: 0, y: 2.1, z: 0.25 }, 'recharge_cervical_pin'));
        // Écran de diagnostic de charge Seegson
        root.add(this._box(terminalCyan, { x: 0.65, y: 0.45, z: 0.05 }, { x: 0, y: 1.4, z: 0.42 }, 'recharge_diagnostic_screen'));
      } else if (normalizedType === 'foundry_gantry_hoist' || normalizedType === 'gantry_hoist') {
        // Chantier 270 : Fiorina 161 Foundry Gantry Overhead Crane Hoist (Alien 3)
        const hoistIron = this._material('darkMetal', { color: 0x18181b, roughness: 0.6, metalness: 0.9 });
        const pulleySteel = this._material('industrial', { color: 0x94a3b8, roughness: 0.25, metalness: 0.95 });
        const crucibleAmber = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 3.0 });
        // Chariot motorisé sur poutre en I
        root.add(this._box(hoistIron, { x: 2.6, y: 0.65, z: 1.6 }, { x: 0, y: 4.8, z: 0 }, 'hoist_carriage_frame', true));
        // Câbles de suspension verticaux
        for (let s = -1; s <= 1; s += 2) {
          root.add(this._cylinder(pulleySteel, 0.03, 0.03, 2.8, { x: s * 0.9, y: 3.2, z: 0 }, { x: 0, y: 0, z: 0 }, `hoist_cable_${s}`));
        }
        // Pince de préhension du creuset de fonderie
        root.add(this._box(hoistIron, { x: 2.2, y: 0.4, z: 1.2 }, { x: 0, y: 1.8, z: 0 }, 'hoist_clamp_beam'));
        root.add(this._cylinder(crucibleAmber, 0.75, 0.65, 0.9, { x: 0, y: 1.1, z: 0 }, { x: 0, y: 0, z: 0 }, 'hoist_molten_ladle'));
      } else if (normalizedType === 'nostromo_coolant_hatch' || normalizedType === 'coolant_hatch') {
        // Chantier 271 : Nostromo E-Deck Coolant Air-Lock Escape Hatch (Alien 1979)
        const bronzeCollar = this._material('darkMetal', { color: 0x78350f, roughness: 0.5, metalness: 0.85 });
        const hatchSteel = this._material('industrial', { color: 0x334155, roughness: 0.35, metalness: 0.9 });
        const wheelAmber = this._material('hazard', { color: 0xd97706, roughness: 0.3, metalness: 0.8 });
        const cryoFrost = this._material('emissiveBlue', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.2 });
        // Cadre annulaire de sas mural
        root.add(this._cylinder(bronzeCollar, 1.25, 1.25, 0.25, { x: 0, y: 1.5, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'coolant_hatch_collar'));
        // Porte circulaire de sas sous pression
        root.add(this._cylinder(hatchSteel, 1.05, 1.05, 0.22, { x: 0, y: 1.5, z: 0.08 }, { x: Math.PI / 2, y: 0, z: 0 }, 'coolant_hatch_door'));
        // Volant central de déverrouillage manuel
        root.add(this._torus(wheelAmber, 0.38, 0.045, { x: 0, y: 1.5, z: 0.24 }, { x: 0, y: 0, z: 0 }, 'coolant_hatch_wheel'));
        // 4 Clavettes de verrouillage radiales
        for (let a = 0; a < 4; a++) {
          const ang = (a * Math.PI) / 2;
          root.add(this._box(hatchSteel, { x: 0.12, y: 0.38, z: 0.1 }, { x: Math.cos(ang) * 0.85, y: 1.5 + Math.sin(ang) * 0.85, z: 0.18 }, `hatch_dog_bolt_${a}`));
        }
        // Buse de purge cryogénique givrante
        root.add(this._cylinder(cryoFrost, 0.12, 0.16, 0.3, { x: 0.65, y: 2.35, z: 0.12 }, { x: 0, y: 0, z: 0 }, 'coolant_purge_nozzle'));
      } else if (normalizedType === 'hadley_coolant_flume' || normalizedType === 'coolant_flume') {
        // Chantier 272 : Hadley's Hope Atmosphere Processor Core Coolant Flume (Aliens 1986)
        const flumeIron = this._material('darkMetal', { color: 0x1e293b, roughness: 0.65, metalness: 0.85 });
        const copperFins = this._material('hazard', { color: 0xb45309, roughness: 0.4, metalness: 0.75 });
        const toxicLiquid = this._material('emissiveAcid', { color: 0x10b981, emissive: 0x059669, emissiveIntensity: 2.4, transparent: true, opacity: 0.85 });
        const grateMesh = this._material('industrial', { color: 0x475569, roughness: 0.5, metalness: 0.9 });
        // Rigole en auge industrielle
        root.add(this._box(flumeIron, { x: 1.4, y: 0.65, z: 3.4 }, { x: 0, y: 0.32, z: 0 }, 'flume_chassis', true));
        // Canal de liquide caloporteur caustique
        root.add(this._box(toxicLiquid, { x: 0.95, y: 0.2, z: 3.2 }, { x: 0, y: 0.45, z: 0 }, 'flume_toxic_fluid'));
        // Grille de protection supérieure
        root.add(this._box(grateMesh, { x: 1.1, y: 0.05, z: 3.3 }, { x: 0, y: 0.65, z: 0 }, 'flume_top_grate'));
        // 4 Rangs d'ailettes thermiques de dissipation en cuivre
        for (let i = -1; i <= 1; i += 2) {
          root.add(this._box(copperFins, { x: 0.2, y: 0.55, z: 2.8 }, { x: i * 0.75, y: 0.35, z: 0 }, `flume_radiator_fins_${i}`));
        }
      } else if (normalizedType === 'fiorina_counterweight_piston' || normalizedType === 'counterweight_piston') {
        // Chantier 273 : Fiorina 161 Ventilation Shaft Heavy Counterweight Piston (Alien 3)
        const frameIron = this._material('darkMetal', { color: 0x0f172a, roughness: 0.7, metalness: 0.9 });
        const blockCast = this._material('industrial', { color: 0x18181b, roughness: 0.5, metalness: 0.92 });
        const steelCable = this._material('industrial', { color: 0x94a3b8, roughness: 0.25, metalness: 0.95 });
        const damperLead = this._material('darkMetal', { color: 0x334155, roughness: 0.8, metalness: 0.6 });
        // Rails verticaux de guidage de gaine
        for (let s = -1; s <= 1; s += 2) {
          root.add(this._box(frameIron, { x: 0.18, y: 4.8, z: 0.22 }, { x: s * 0.75, y: 2.4, z: 0 }, `piston_guide_rail_${s}`, true));
        }
        // Masse de contrepoids 5 tonnes en fonte
        root.add(this._box(blockCast, { x: 1.35, y: 1.6, z: 0.9 }, { x: 0, y: 2.8, z: 0 }, 'piston_counterweight_block', true));
        // Câbles tressés de suspension
        for (let c = -1; c <= 1; c += 2) {
          root.add(this._cylinder(steelCable, 0.035, 0.035, 4.2, { x: c * 0.45, y: 2.6, z: 0 }, { x: 0, y: 0, z: 0 }, `piston_cable_${c}`));
        }
        // Butée d'amortisseur basse
        root.add(this._cylinder(damperLead, 0.45, 0.55, 0.45, { x: 0, y: 0.22, z: 0 }, { x: 0, y: 0, z: 0 }, 'piston_base_bumper'));
      } else if (normalizedType === 'auriga_bioreactor_dome' || normalizedType === 'bioreactor_dome') {
        // Chantier 274 : USM Auriga Gene-Sequencing Bioreactor Dome & Culturing Vat (Alien Resurrection)
        const vatPlinth = this._material('darkMetal', { color: 0x0f172a, roughness: 0.45, metalness: 0.85 });
        const vatDome = this._material('emissiveBlue', { color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 1.5, transparent: true, opacity: 0.48 });
        const dnaHelix = this._material('emissiveAcid', { color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 2.8 });
        const hosePoly = this._material('industrial', { color: 0x475569, roughness: 0.3, metalness: 0.8 });
        // Socle de contention bio-médicale
        root.add(this._cylinder(vatPlinth, 1.25, 1.35, 0.65, { x: 0, y: 0.32, z: 0 }, { x: 0, y: 0, z: 0 }, 'bioreactor_base_plinth'));
        // Dôme vitré de séquençage génétique
        root.add(this._sphere(vatDome, 1.05, { x: 0, y: 1.35, z: 0 }, 'bioreactor_glass_dome'));
        // Hélice de culture ADN centrale
        root.add(this._cylinder(dnaHelix, 0.25, 0.25, 1.2, { x: 0, y: 1.35, z: 0 }, { x: 0, y: 0, z: 0 }, 'bioreactor_dna_core'));
        // Tubulures d'infusion et pompes
        for (let p = 0; p < 3; p++) {
          const pang = (p * Math.PI * 2) / 3;
          root.add(this._cylinder(hosePoly, 0.05, 0.05, 1.4, { x: Math.cos(pang) * 1.05, y: 0.9, z: Math.sin(pang) * 1.05 }, { x: 0.25, y: pang, z: 0 }, `bioreactor_hose_${p}`));
        }
      } else if (normalizedType === 'remus_gantry_rail' || normalizedType === 'gantry_rail') {
        // Chantier 275 : Renaissance Station Remus Module Cargo Gantry Rail (Alien: Romulus)
        const railSteel = this._material('darkMetal', { color: 0x334155, roughness: 0.4, metalness: 0.9 });
        const carriageIron = this._material('industrial', { color: 0x1e293b, roughness: 0.6, metalness: 0.85 });
        const hookHazard = this._material('hazard', { color: 0xeab308, roughness: 0.35, metalness: 0.75 });
        const beaconAmber = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 2.8 });
        // Poutre de guidage en I
        root.add(this._box(railSteel, { x: 3.8, y: 0.38, z: 0.45 }, { x: 0, y: 4.6, z: 0 }, 'gantry_rail_beam', true));
        // Chariot motorisé suspendu
        root.add(this._box(carriageIron, { x: 1.1, y: 0.55, z: 0.85 }, { x: 0, y: 4.15, z: 0 }, 'gantry_travel_carriage'));
        // Câble et crochet lourd de levage
        root.add(this._cylinder(railSteel, 0.04, 0.04, 1.6, { x: 0, y: 3.1, z: 0 }, { x: 0, y: 0, z: 0 }, 'gantry_hoist_cable'));
        root.add(this._torus(hookHazard, 0.28, 0.07, { x: 0, y: 2.1, z: 0 }, { x: 0, y: 0, z: 0 }, 'gantry_cargo_hook'));
        // Feux à éclats d'avertissement de zone
        for (let b = -1; b <= 1; b += 2) {
          root.add(this._cylinder(beaconAmber, 0.07, 0.07, 0.14, { x: b * 1.7, y: 4.85, z: 0 }, { x: 0, y: 0, z: 0 }, `gantry_beacon_${b}`));
        }
      } else if (normalizedType === 'seegson_test_booth' || normalizedType === 'test_booth') {
        // Chantier 276 : Sevastopol Seegson Synthetic Testing Chamber Observation Booth (Alien: Isolation)
        const boothShell = this._material('industrial', { color: 0x334155, roughness: 0.5, metalness: 0.8 });
        const windowGlass = this._material('emissiveBlue', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.2, transparent: true, opacity: 0.52 });
        const consoleCrt = this._material('emissiveAcid', { color: 0x22c55e, emissive: 0x15803d, emissiveIntensity: 2.4 });
        const seatFabric = this._material('darkMetal', { color: 0x1e293b, roughness: 0.7, metalness: 0.5 });
        // Châssis arrondi de cabine d'observation
        root.add(this._box(boothShell, { x: 1.8, y: 2.6, z: 1.6 }, { x: 0, y: 1.3, z: 0 }, 'booth_outer_chassis', true));
        // Hublot de surveillance panoramique
        root.add(this._box(windowGlass, { x: 1.45, y: 1.1, z: 0.1 }, { x: 0, y: 1.5, z: 0.82 }, 'booth_observation_window'));
        // Console pupitre Seegson avec écran CRT vert
        root.add(this._box(boothShell, { x: 1.1, y: 0.85, z: 0.55 }, { x: 0, y: 0.85, z: 0.4 }, 'booth_diagnostic_desk'));
        root.add(this._box(consoleCrt, { x: 0.65, y: 0.42, z: 0.05 }, { x: 0, y: 1.15, z: 0.42 }, 'booth_crt_monitor'));
        // Siège de diagnostic avec pinces
        root.add(this._box(seatFabric, { x: 0.65, y: 0.85, z: 0.65 }, { x: 0, y: 0.65, z: -0.3 }, 'booth_restraint_chair'));
      } else if (normalizedType === 'medlab_incubator_rack' || normalizedType === 'incubator_rack') {
        // Chantier 277 : Hadley's Hope MedLab Incubator Battery Rack (Aliens 1986)
        const rackFrame = this._material('industrial', { color: 0x1e293b, roughness: 0.55, metalness: 0.85 });
        const chamberPlexi = this._material('emissiveBlue', { color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 1.2, transparent: true, opacity: 0.42 });
        const o2Cylinder = this._material('hazard', { color: 0x10b981, roughness: 0.35, metalness: 0.8 });
        const ecgMonitor = this._material('emissiveAcid', { color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 2.2 });
        // Étagère métallique hospitalière
        root.add(this._box(rackFrame, { x: 1.8, y: 2.4, z: 0.9 }, { x: 0, y: 1.2, z: 0 }, 'incubator_rack_frame', true));
        // 2 Couveuses de soins intensifs sous cloche
        for (let t = 0; t < 2; t++) {
          root.add(this._box(chamberPlexi, { x: 1.4, y: 0.55, z: 0.72 }, { x: 0, y: 0.65 + t * 0.95, z: 0.05 }, `incubator_capsule_${t}`));
          root.add(this._box(ecgMonitor, { x: 0.35, y: 0.25, z: 0.05 }, { x: 0.5, y: 0.75 + t * 0.95, z: 0.42 }, `incubator_ecg_${t}`));
        }
        // Bonbonne d'oxygène médical pressurisée
        root.add(this._cylinder(o2Cylinder, 0.16, 0.16, 1.1, { x: -0.72, y: 0.65, z: 0.35 }, { x: 0, y: 0, z: 0 }, 'incubator_o2_bottle'));
      } else if (normalizedType === 'uscm_sandbag_bunker' || normalizedType === 'sandbag_bunker') {
        // Chantier 278 : USCM Sentry Bunker Perimeter Sandbag Emplacement (Aliens: Dark Descent)
        const sandbagTex = this._material('darkMetal', { color: 0x78716c, roughness: 0.85, metalness: 0.2 });
        const armorPlate = this._material('darkMetal', { color: 0x1f2937, roughness: 0.5, metalness: 0.9 });
        const floodLight = this._material('emissiveAmber', { color: 0xfde047, emissive: 0xeab308, emissiveIntensity: 2.6 });
        const ammoCrate = this._material('hazard', { color: 0x15803d, roughness: 0.4, metalness: 0.7 });
        // Barricade semi-circulaire de sacs de sable empilés
        for (let layer = 0; layer < 3; layer++) {
          for (let seg = -2; seg <= 2; seg++) {
            const rad = 1.35;
            const ang = (seg * Math.PI) / 6;
            root.add(this._box(sandbagTex, { x: 0.55, y: 0.28, z: 0.32 }, { x: Math.sin(ang) * rad, y: 0.15 + layer * 0.28, z: Math.cos(ang) * rad }, `sandbag_${layer}_${seg}`, true));
          }
        }
        // Plaque de blindage avec fente de tir
        root.add(this._box(armorPlate, { x: 1.6, y: 0.8, z: 0.08 }, { x: 0, y: 1.05, z: 1.1 }, 'bunker_shield_plate'));
        // Projecteur halogène de périmètre
        root.add(this._cylinder(floodLight, 0.14, 0.18, 0.22, { x: 0.85, y: 1.15, z: 0.9 }, { x: 0.35, y: 0, z: 0 }, 'bunker_halogen_spot'));
        // Caisse de munitions USCM verte
        root.add(this._box(ammoCrate, { x: 0.65, y: 0.4, z: 0.45 }, { x: -0.5, y: 0.2, z: 0 }, 'bunker_ammo_cache'));
      } else if (normalizedType === 'habitation_louver_shutter' || normalizedType === 'louver_shutter') {
        // Chantier 279 : Sevastopol Habitation Air Circulation Louver Shutter (Alien: Isolation)
        const frameAlu = this._material('industrial', { color: 0x475569, roughness: 0.45, metalness: 0.85 });
        const louverSlat = this._material('darkMetal', { color: 0x334155, roughness: 0.55, metalness: 0.8 });
        const actuatorDrive = this._material('emissiveBlue', { color: 0x0284c7, emissive: 0x0369a1, emissiveIntensity: 1.8 });
        // Châssis encastré de ventilation
        root.add(this._box(frameAlu, { x: 1.6, y: 2.2, z: 0.25 }, { x: 0, y: 1.2, z: 0 }, 'louver_outer_frame', true));
        // 6 Lamelles horizontales orientables
        for (let l = 0; l < 6; l++) {
          root.add(this._box(louverSlat, { x: 1.35, y: 0.18, z: 0.04 }, { x: 0, y: 0.4 + l * 0.32, z: 0.05 }, `louver_blade_${l}`));
        }
        // Servomoteur d'orientation électrique
        root.add(this._cylinder(actuatorDrive, 0.12, 0.12, 0.45, { x: 0.72, y: 1.2, z: 0.15 }, { x: 0, y: 0, z: 0 }, 'louver_servo_actuator'));
      } else if (normalizedType === 'quench_overflow_weir' || normalizedType === 'overflow_weir') {
        // Chantier 280 : Fiorina 161 Sub-Basement Quench Pit Grate & Overflow Weir (Alien 3)
        const weirGrate = this._material('darkMetal', { color: 0x18181b, roughness: 0.7, metalness: 0.95 });
        const sludgeFluid = this._material('darkMetal', { color: 0x451a03, roughness: 0.3, metalness: 0.6, transparent: true, opacity: 0.88 });
        const gateValveWheel = this._material('hazard', { color: 0xb45309, roughness: 0.4, metalness: 0.8 });
        const drainPipe = this._material('industrial', { color: 0x334155, roughness: 0.6, metalness: 0.85 });
        // Fosse et grille caillebotis en fonte
        root.add(this._box(weirGrate, { x: 2.2, y: 0.35, z: 2.2 }, { x: 0, y: 0.18, z: 0 }, 'weir_trench_grate', true));
        // Surface de liquide boueux résiduel
        root.add(this._box(sludgeFluid, { x: 1.85, y: 0.1, z: 1.85 }, { x: 0, y: 0.12, z: 0 }, 'weir_sludge_surface'));
        // Tuyau d'écoulement de déversoir
        root.add(this._cylinder(drainPipe, 0.28, 0.28, 1.8, { x: 0.95, y: 0.9, z: 0 }, { x: 0, y: 0, z: 0 }, 'weir_overflow_riser'));
        // Volant de vanne guillotine de trop-plein
        root.add(this._torus(gateValveWheel, 0.32, 0.05, { x: 0.95, y: 1.65, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'weir_gate_wheel'));
      } else if (normalizedType === 'nostromo_cooling_blower' || normalizedType === 'cooling_blower') {
        // Chantier 281 : Nostromo Hypersleep Vault Central Cooling Blower (Alien 1979)
        const blowerSteel = this._material('darkMetal', { color: 0x1e293b, roughness: 0.55, metalness: 0.88 });
        const rotorBlades = this._material('industrial', { color: 0x64748b, roughness: 0.35, metalness: 0.9 });
        const motorHousing = this._material('darkMetal', { color: 0x0f172a, roughness: 0.7, metalness: 0.9 });
        const frostGlow = this._material('emissiveBlue', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.2 });
        // Corps de turbine cylindrique
        root.add(this._cylinder(blowerSteel, 1.15, 1.15, 1.8, { x: 0, y: 1.2, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, 'blower_turbine_casing', true));
        // Moteur électrique d'entraînement arrière
        root.add(this._cylinder(motorHousing, 0.65, 0.65, 0.8, { x: -1.2, y: 1.2, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, 'blower_drive_motor'));
        // Pales de rotor de ventilation
        for (let b = 0; b < 6; b++) {
          const ang = (b * Math.PI) / 3;
          root.add(this._box(rotorBlades, { x: 0.1, y: 0.95, z: 0.25 }, { x: 0.4, y: 1.2 + Math.sin(ang) * 0.45, z: Math.cos(ang) * 0.45 }, `blower_blade_${b}`));
        }
        // Conduites de refoulement caloporteur cryo givrantes
        for (let p = -1; p <= 1; p += 2) {
          root.add(this._cylinder(frostGlow, 0.18, 0.18, 1.4, { x: 0, y: 2.1, z: p * 0.65 }, { x: p * 0.3, y: 0, z: 0 }, `blower_frost_duct_${p}`));
        }
      } else if (normalizedType === 'hadley_tactical_table' || normalizedType === 'tactical_table') {
        // Chantier 282 : Hadley's Hope Operations Tactical Holo-Table (Aliens 1986)
        const tableBase = this._material('industrial', { color: 0x334155, roughness: 0.45, metalness: 0.85 });
        const holoEmitter = this._material('darkMetal', { color: 0x0f172a, roughness: 0.6, metalness: 0.9 });
        const holoMap = this._material('emissiveAcid', { color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 2.8, transparent: true, opacity: 0.65 });
        const crtScreen = this._material('emissiveAmber', { color: 0xeab308, emissive: 0xd97706, emissiveIntensity: 2.0 });
        // Socle hexagonal de table de commandement
        root.add(this._cylinder(tableBase, 1.45, 1.6, 0.85, { x: 0, y: 0.42, z: 0 }, { x: 0, y: 0, z: 0 }, 'tactical_table_pedestal', true));
        // Puits central d'émission holographique
        root.add(this._cylinder(holoEmitter, 0.75, 0.75, 0.15, { x: 0, y: 0.88, z: 0 }, { x: 0, y: 0, z: 0 }, 'tactical_holo_well'));
        // Projection holographique vectorielle volumétrique
        root.add(this._cylinder(holoMap, 0.85, 0.45, 0.95, { x: 0, y: 1.45, z: 0 }, { x: 0, y: 0, z: 0 }, 'tactical_hologram_cone'));
        // Pupitres opérateurs et moniteurs ambrés de statut
        for (let t = 0; t < 4; t++) {
          const tang = (t * Math.PI) / 2;
          root.add(this._box(crtScreen, { x: 0.35, y: 0.22, z: 0.05 }, { x: Math.cos(tang) * 1.35, y: 0.95, z: Math.sin(tang) * 1.35 }, `tactical_monitor_${t}`));
        }
      } else if (normalizedType === 'fiorina_lead_sluice' || normalizedType === 'lead_sluice') {
        // Chantier 283 : Fiorina 161 Molten Lead Drainage Sluice (Alien 3)
        const sluiceBrick = this._material('darkMetal', { color: 0x27272a, roughness: 0.8, metalness: 0.7 });
        const moltenLead = this._material('emissiveAmber', { color: 0xf97316, emissive: 0xd97706, emissiveIntensity: 3.2 });
        const gateIron = this._material('industrial', { color: 0x18181b, roughness: 0.5, metalness: 0.95 });
        const counterweightLead = this._material('darkMetal', { color: 0x3f3f46, roughness: 0.7, metalness: 0.85 });
        // Rigole de coulée en briques réfractaires
        root.add(this._box(sluiceBrick, { x: 1.4, y: 0.55, z: 3.6 }, { x: 0, y: 0.28, z: 0 }, 'lead_sluice_trough', true));
        // Plomb liquide incandescent en fusion
        root.add(this._box(moltenLead, { x: 0.95, y: 0.15, z: 3.4 }, { x: 0, y: 0.38, z: 0 }, 'lead_molten_stream'));
        // Vanne guillotine de régulation
        root.add(this._box(gateIron, { x: 1.25, y: 1.6, z: 0.2 }, { x: 0, y: 1.2, z: -0.6 }, 'lead_sluice_gate'));
        // Bras de levier avec contrepoids
        root.add(this._box(counterweightLead, { x: 0.35, y: 0.35, z: 0.8 }, { x: 0.75, y: 1.8, z: -0.6 }, 'lead_sluice_counterweight'));
      } else if (normalizedType === 'auriga_holding_cage' || normalizedType === 'holding_cage') {
        // Chantier 284 : USM Auriga Xenomorph Specimen Holding Cage (Alien Resurrection)
        const frameTitanium = this._material('industrial', { color: 0x1e293b, roughness: 0.45, metalness: 0.9 });
        const shockBars = this._material('emissiveBlue', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.2 });
        const feederTrough = this._material('darkMetal', { color: 0x475569, roughness: 0.6, metalness: 0.8 });
        const alertBeacon = this._material('emissiveAmber', { color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 2.8 });
        // Armature tubulaire de confinement haute résistance
        root.add(this._box(frameTitanium, { x: 2.6, y: 2.8, z: 2.2 }, { x: 0, y: 1.4, z: 0 }, 'holding_cage_frame', true));
        // Barres électrifiées verticales
        for (let s = -1; s <= 1; s += 2) {
          for (let b = -2; b <= 2; b++) {
            root.add(this._cylinder(shockBars, 0.035, 0.035, 2.5, { x: s * 1.22, y: 1.35, z: b * 0.42 }, { x: 0, y: 0, z: 0 }, `shock_bar_${s}_${b}`));
          }
        }
        // Mangeoire à bétail suspendue
        root.add(this._box(feederTrough, { x: 1.2, y: 0.35, z: 0.65 }, { x: 0, y: 0.95, z: 0.75 }, 'cage_feeder_trough'));
        // Boîtier de commutation et balise d'alerte rouge
        root.add(this._cylinder(alertBeacon, 0.09, 0.09, 0.18, { x: 1.25, y: 2.85, z: 1.05 }, { x: 0, y: 0, z: 0 }, 'cage_alert_beacon'));
      } else if (normalizedType === 'romulus_stasis_carousel' || normalizedType === 'stasis_carousel') {
        // Chantier 285 : Renaissance Station Romulus Module Cryo-Stasis Carousel (Alien: Romulus)
        const hubColumn = this._material('darkMetal', { color: 0x0f172a, roughness: 0.6, metalness: 0.92 });
        const rotorRing = this._material('industrial', { color: 0x334155, roughness: 0.4, metalness: 0.88 });
        const podGlass = this._material('emissiveBlue', { color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 1.4, transparent: true, opacity: 0.52 });
        const umbilicalHose = this._material('darkMetal', { color: 0x64748b, roughness: 0.5, metalness: 0.7 });
        // Colonne centrale de rotation
        root.add(this._cylinder(hubColumn, 0.55, 0.65, 2.8, { x: 0, y: 1.4, z: 0 }, { x: 0, y: 0, z: 0 }, 'carousel_central_hub', true));
        // Anneau d'indexation hydraulique
        root.add(this._cylinder(rotorRing, 1.85, 1.85, 0.25, { x: 0, y: 1.35, z: 0 }, { x: 0, y: 0, z: 0 }, 'carousel_rotor_ring'));
        // 4 Capsules cryogéniques montées en croix
        for (let c = 0; c < 4; c++) {
          const cang = (c * Math.PI) / 2;
          root.add(this._box(podGlass, { x: 0.75, y: 1.8, z: 0.75 }, { x: Math.cos(cang) * 1.55, y: 1.2, z: Math.sin(cang) * 1.55 }, `carousel_cryo_pod_${c}`));
          root.add(this._cylinder(umbilicalHose, 0.04, 0.04, 1.1, { x: Math.cos(cang) * 1.1, y: 2.2, z: Math.sin(cang) * 1.1 }, { x: 0.25, y: cang, z: 0 }, `carousel_hose_${c}`));
        }
      } else if (normalizedType === 'monorail_buffer_stop' || normalizedType === 'buffer_stop') {
        // Chantier 286 : Sevastopol Habitation Transit Monorail Buffer Stop (Alien: Isolation)
        const stopBase = this._material('darkMetal', { color: 0x334155, roughness: 0.7, metalness: 0.8 });
        const bufferPistons = this._material('industrial', { color: 0x18181b, roughness: 0.35, metalness: 0.95 });
        const hazardCrossbar = this._material('hazard', { color: 0xeab308, roughness: 0.35, metalness: 0.75 });
        const signalRed = this._material('emissiveAmber', { color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 3.0 });
        // Butoir massif en béton/acier
        root.add(this._box(stopBase, { x: 2.2, y: 1.4, z: 1.6 }, { x: 0, y: 0.7, z: 0 }, 'buffer_stop_buttress', true));
        // Traverse de butée à chevrons de danger
        root.add(this._box(hazardCrossbar, { x: 2.4, y: 0.55, z: 0.3 }, { x: 0, y: 0.95, z: 0.95 }, 'buffer_hazard_crossbar'));
        // Vérins hydrauliques télescopiques à absorption
        for (let r = -1; r <= 1; r += 2) {
          root.add(this._cylinder(bufferPistons, 0.16, 0.16, 1.05, { x: r * 0.75, y: 0.95, z: 1.45 }, { x: Math.PI / 2, y: 0, z: 0 }, `buffer_ram_${r}`));
        }
        // Fanal rouge d'arrêt absolu
        root.add(this._cylinder(signalRed, 0.09, 0.09, 0.18, { x: 0, y: 1.65, z: 0.95 }, { x: 0, y: 0, z: 0 }, 'buffer_signal_lamp'));
      } else if (normalizedType === 'steam_superheater' || normalizedType === 'superheater') {
        // Chantier 287 : Hadley's Hope Power Plant Steam Superheater (Aliens 1986)
        const vesselAlloy = this._material('darkMetal', { color: 0x292524, roughness: 0.75, metalness: 0.85 });
        const copperCoils = this._material('hazard', { color: 0xb45309, roughness: 0.45, metalness: 0.75 });
        const gaugeBrass = this._material('hazard', { color: 0xeab308, roughness: 0.35, metalness: 0.8 });
        const steamFlue = this._material('industrial', { color: 0x64748b, roughness: 0.5, metalness: 0.85 });
        // Corps de chauffe vertical haute pression
        root.add(this._cylinder(vesselAlloy, 1.15, 1.25, 2.6, { x: 0, y: 1.3, z: 0 }, { x: 0, y: 0, z: 0 }, 'superheater_vessel', true));
        // Serpentins de surchauffe en cuivre étiré
        for (let ring = 0; ring < 4; ring++) {
          root.add(this._torus(copperCoils, 1.22, 0.06, { x: 0, y: 0.65 + ring * 0.5, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, `superheater_coil_${ring}`));
        }
        // Cheminée d'échappement et soupape
        root.add(this._cylinder(steamFlue, 0.25, 0.25, 1.2, { x: 0.65, y: 2.8, z: 0 }, { x: 0, y: 0, z: 0 }, 'superheater_vent_flue'));
        // Manomètre à mercure haute température
        root.add(this._cylinder(gaugeBrass, 0.18, 0.18, 0.08, { x: 0, y: 1.8, z: 1.25 }, { x: Math.PI / 2, y: 0, z: 0 }, 'superheater_manometer'));
      } else if (normalizedType === 'uscm_weapon_rack' || normalizedType === 'weapon_rack') {
        // Chantier 288 : USCM Armory Heavy Weapon Wall Racks (Aliens: Dark Descent)
        const rackSteel = this._material('darkMetal', { color: 0x1e293b, roughness: 0.6, metalness: 0.9 });
        const pulseRifleGreen = this._material('hazard', { color: 0x15803d, roughness: 0.45, metalness: 0.65 });
        const palmScanner = this._material('emissiveBlue', { color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 2.4 });
        const ammoBoxes = this._material('hazard', { color: 0x854d0e, roughness: 0.55, metalness: 0.6 });
        // Châssis d'armurerie mural
        root.add(this._box(rackSteel, { x: 2.2, y: 2.4, z: 0.55 }, { x: 0, y: 1.2, z: 0 }, 'weapon_rack_cabinet', true));
        // 4 Fusils d'assaut M41A Pulse Rifles en râtelier
        for (let r = 0; r < 4; r++) {
          root.add(this._box(pulseRifleGreen, { x: 1.35, y: 0.16, z: 0.12 }, { x: 0, y: 0.75 + r * 0.42, z: 0.18 }, `m41a_rifle_${r}`));
        }
        // Lecteur d'empreinte biométrique
        root.add(this._box(palmScanner, { x: 0.22, y: 0.32, z: 0.05 }, { x: 0.85, y: 1.5, z: 0.28 }, 'rack_biometric_pad'));
        // Caisses de munitions 10mm empilées à la base
        root.add(this._box(ammoBoxes, { x: 1.4, y: 0.35, z: 0.35 }, { x: 0, y: 0.25, z: 0.12 }, 'rack_ammo_tins'));
      } else if (normalizedType === 'synthetic_assembly_station' || normalizedType === 'assembly_station') {
        // Chantier 289 : Sevastopol Seegson Synthetic Assembly Station (Alien: Isolation)
        const benchChassis = this._material('industrial', { color: 0x334155, roughness: 0.5, metalness: 0.85 });
        const robotArm = this._material('darkMetal', { color: 0x64748b, roughness: 0.4, metalness: 0.9 });
        const synthBody = this._material('industrial', { color: 0xe2e8f0, roughness: 0.3, metalness: 0.4 });
        const synthBloodTank = this._material('emissiveBlue', { color: 0xf8fafc, emissive: 0x94a3b8, emissiveIntensity: 1.2, transparent: true, opacity: 0.75 });
        const crtScreen = this._material('emissiveAcid', { color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 2.6 });
        // Table d'assemblage biomécanique
        root.add(this._box(benchChassis, { x: 2.4, y: 1.1, z: 1.4 }, { x: 0, y: 0.55, z: 0 }, 'assembly_bench_table', true));
        // Torse synthétique Working Joe inachevé
        root.add(this._box(synthBody, { x: 0.95, y: 0.45, z: 0.75 }, { x: -0.2, y: 1.25, z: 0 }, 'synth_chassis_jig'));
        // Bras robotique articulé de sertissage
        root.add(this._cylinder(robotArm, 0.08, 0.08, 1.2, { x: 0.85, y: 1.6, z: 0.2 }, { x: 0.4, y: 0, z: 0.3 }, 'assembly_robot_arm'));
        // Réservoir de liquide laiteux synthétique
        root.add(this._cylinder(synthBloodTank, 0.28, 0.28, 0.85, { x: -0.85, y: 1.45, z: -0.35 }, { x: 0, y: 0, z: 0 }, 'synth_fluid_reservoir'));
        // Oscilloscope diagnostique vert
        root.add(this._box(crtScreen, { x: 0.45, y: 0.35, z: 0.05 }, { x: 0.65, y: 1.4, z: -0.4 }, 'assembly_diagnostic_crt'));
      } else if (normalizedType === 'furnace_air_intake' || normalizedType === 'air_intake') {
        // Chantier 290 : Fiorina 161 Furnace Air Intake Siphon Flange (Alien 3)
        const intakeFunnel = this._material('darkMetal', { color: 0x18181b, roughness: 0.65, metalness: 0.95 });
        const damperValve = this._material('hazard', { color: 0xb45309, roughness: 0.4, metalness: 0.8 });
        const intakeGrille = this._material('industrial', { color: 0x475569, roughness: 0.5, metalness: 0.9 });
        const draftGauge = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 2.4 });
        // Entonnoir évasé venturi en fonte
        root.add(this._cylinder(intakeFunnel, 1.25, 0.75, 1.4, { x: 0, y: 1.4, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, 'intake_venturi_funnel', true));
        // Clapet anti-retour de flammes à contrepoids
        root.add(this._box(damperValve, { x: 0.15, y: 1.2, z: 1.2 }, { x: 0, y: 1.4, z: 0 }, 'intake_damper_flap'));
        // Grille de protection pare-débris
        root.add(this._cylinder(intakeGrille, 1.28, 1.28, 0.1, { x: 0.72, y: 1.4, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, 'intake_debris_screen'));
        // Manomètre de pression de tirage
        root.add(this._cylinder(draftGauge, 0.14, 0.14, 0.08, { x: -0.4, y: 2.15, z: 0.55 }, { x: Math.PI / 2, y: 0, z: 0 }, 'intake_draft_gauge'));
      } else if (normalizedType === 'nostromo_monorail_hoist' || normalizedType === 'monorail_hoist') {
        // Chantier 291 : Nostromo Catwalk Overhead Monorail Hoist & Winch Drum (Alien 1979)
        const darkMetal = this._material('darkMetal', { color: 0x18181b, roughness: 0.65, metalness: 0.95 });
        const hazard = this._material('hazard', { color: 0xeab308, roughness: 0.45, metalness: 0.8 });
        const steel = this._material('steel', { color: 0x64748b, roughness: 0.35, metalness: 0.95 });
        // Poutrelle de roulement monorail supérieure
        root.add(this._box(darkMetal, { x: 3.4, y: 0.45, z: 0.45 }, { x: 0, y: 3.8, z: 0 }, 'hoist_runway_beam'));
        // Chariot motorisé sur galets
        root.add(this._box(hazard, { x: 0.85, y: 0.55, z: 0.75 }, { x: 0, y: 3.65, z: 0 }, 'hoist_trolley_carriage'));
        // Tambour de treuil avec câble enroulé
        root.add(this._cylinder(darkMetal, 0.42, 0.42, 1.1, { x: 0, y: 3.0, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, 'hoist_winch_drum', true));
        // Câble de levage en acier
        root.add(this._cylinder(steel, 0.04, 0.04, 1.8, { x: 0, y: 2.0, z: 0 }, { x: 0, y: 0, z: 0 }, 'hoist_wire_rope'));
        // Crochet de levage jaune industriel
        root.add(this._torus(hazard, 0.28, 0.08, { x: 0, y: 1.0, z: 0 }, { x: 0, y: 0, z: 0 }, 'hoist_crane_hook'));
      } else if (normalizedType === 'hadley_battery_bank' || normalizedType === 'battery_bank') {
        // Chantier 292 : Hadley's Hope Operations Emergency Battery Bank (Aliens 1986)
        const darkMetal = this._material('darkMetal', { color: 0x0f172a, roughness: 0.6, metalness: 0.9 });
        const cellMat = this._material('industrial', { color: 0x1e293b, roughness: 0.5, metalness: 0.75 });
        const copper = this._material('copper', { color: 0xb45309, roughness: 0.3, metalness: 0.95 });
        const meterAmber = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 2.2 });
        // Armoire d'accumulateurs au plomb-acide
        root.add(this._box(darkMetal, { x: 1.8, y: 2.2, z: 0.95 }, { x: 0, y: 1.1, z: 0 }, 'battery_rack_cabinet', true));
        // Cellules d'accumulateurs réparties
        for (let row = 0; row < 2; row++) {
          for (let col = -1; col <= 1; col++) {
            root.add(this._box(cellMat, { x: 0.45, y: 0.55, z: 0.35 }, { x: col * 0.52, y: 0.65 + row * 0.72, z: 0.2 }, `battery_cell_${row}_${col}`));
          }
        }
        // Barres omnibus en cuivre massif
        root.add(this._box(copper, { x: 1.5, y: 0.08, z: 0.08 }, { x: 0, y: 1.75, z: 0.42 }, 'battery_busbar'));
        // Galvanomètre indicateur de décharge
        root.add(this._cylinder(meterAmber, 0.16, 0.16, 0.08, { x: 0.45, y: 2.0, z: 0.5 }, { x: Math.PI / 2, y: 0, z: 0 }, 'battery_charge_meter'));
      } else if (normalizedType === 'fiorina_quench_basket' || normalizedType === 'quench_basket') {
        // Chantier 293 : Fiorina 161 Heavy Quench Tank Immersion Basket (Alien 3)
        const darkMetal = this._material('darkMetal', { color: 0x1c1917, roughness: 0.7, metalness: 0.9 });
        const rustMetal = this._material('rust', { color: 0x78350f, roughness: 0.85, metalness: 0.4 });
        const oilMat = this._material('quenchOil', { color: 0x09090b, roughness: 0.2, metalness: 0.3 });
        const cageMat = this._material('industrial', { color: 0x334155, roughness: 0.5, metalness: 0.85, wireframe: true });
        // Cuve de trempe en acier épais
        root.add(this._box(darkMetal, { x: 2.2, y: 1.2, z: 2.2 }, { x: 0, y: 0.6, z: 0 }, 'quench_tank_body', true));
        // Bain d'huile de refroidissement
        root.add(this._box(oilMat, { x: 1.9, y: 0.1, z: 1.9 }, { x: 0, y: 0.9, z: 0 }, 'quench_fluid_bath'));
        // Mât pivotant de la potence
        root.add(this._cylinder(rustMetal, 0.16, 0.16, 3.6, { x: 1.2, y: 1.8, z: 1.2 }, { x: 0, y: 0, z: 0 }, 'quench_crane_mast'));
        // Flèche de levage
        const jib = this._box(rustMetal, { x: 1.8, y: 0.22, z: 0.22 }, { x: 0.3, y: 3.5, z: 0.6 }, 'quench_jib_boom');
        jib.rotation.y = 0.4;
        root.add(jib);
        // Panier grillagé de maintien des pièces
        root.add(this._box(cageMat, { x: 1.35, y: 0.8, z: 1.35 }, { x: 0, y: 1.6, z: 0 }, 'quench_wire_basket'));
      } else if (normalizedType === 'auriga_cryo_centrifuge' || normalizedType === 'cryo_centrifuge') {
        // Chantier 294 : USM Auriga Surgical Cryo-Centrifuge & Fluid Separator (Alien Resurrection)
        const darkMetal = this._material('darkMetal', { color: 0x0f172a, roughness: 0.5, metalness: 0.9 });
        const stainless = this._material('stainless', { color: 0xe2e8f0, roughness: 0.25, metalness: 0.95 });
        const cryoFrost = this._material('frost', { color: 0x38bdf8, roughness: 0.2, metalness: 0.5, transparent: true, opacity: 0.85 });
        const emissiveCyan = this._material('emissiveCyan', { color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 2.2 });
        // Socle d'amortissement inertiel
        root.add(this._cylinder(darkMetal, 0.85, 0.95, 0.5, { x: 0, y: 0.25, z: 0 }, { x: 0, y: 0, z: 0 }, 'centrifuge_pedestal', true));
        // Bol de rotor centrifuge inox
        root.add(this._cylinder(stainless, 0.75, 0.75, 1.2, { x: 0, y: 1.1, z: 0 }, { x: 0, y: 0, z: 0 }, 'centrifuge_rotor_drum'));
        // Serpentin de réfrigération cryo
        root.add(this._torus(cryoFrost, 0.82, 0.07, { x: 0, y: 0.8, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'centrifuge_cryo_coil'));
        // Hublot de surveillance en verre blindé
        root.add(this._cylinder(cryoFrost, 0.32, 0.32, 0.12, { x: 0, y: 1.72, z: 0 }, { x: 0, y: 0, z: 0 }, 'centrifuge_view_glass'));
        // Terminal de commande tactile Weyland-Yutani
        root.add(this._box(emissiveCyan, { x: 0.35, y: 0.45, z: 0.1 }, { x: 0.65, y: 1.2, z: 0.45 }, 'centrifuge_touchscreen'));
      } else if (normalizedType === 'romulus_fuel_manifold' || normalizedType === 'fuel_manifold') {
        // Chantier 295 : Renaissance Station Romulus Module Fuel Transfer Manifold (Alien: Romulus)
        const darkMetal = this._material('darkMetal', { color: 0x18181b, roughness: 0.6, metalness: 0.9 });
        const stainless = this._material('stainless', { color: 0x94a3b8, roughness: 0.3, metalness: 0.95 });
        const hazard = this._material('hazard', { color: 0xd97706, roughness: 0.4, metalness: 0.8 });
        const frost = this._material('frost', { color: 0x7dd3fc, roughness: 0.2, metalness: 0.4, transparent: true, opacity: 0.8 });
        // Collecteur tubulaire principal
        root.add(this._cylinder(darkMetal, 0.35, 0.35, 2.8, { x: 0, y: 1.4, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, 'manifold_main_header', true));
        // Conduites de dérivation verticales
        for (let i = -1; i <= 1; i++) {
          root.add(this._cylinder(stainless, 0.16, 0.16, 1.2, { x: i * 0.85, y: 0.7, z: 0 }, { x: 0, y: 0, z: 0 }, `manifold_branch_${i}`));
          root.add(this._torus(hazard, 0.22, 0.05, { x: i * 0.85, y: 1.5, z: 0.38 }, { x: 0, y: 0, z: 0 }, `manifold_valve_${i}`));
        }
        // Manchon givré par détente cryogénique
        root.add(this._cylinder(frost, 0.38, 0.38, 0.8, { x: 0, y: 1.4, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, 'manifold_frost_jacket'));
      } else if (normalizedType === 'sevastopol_baggage_scanner' || normalizedType === 'baggage_scanner') {
        // Chantier 296 : Sevastopol Habitation Luggage Conveyor Belt & Baggage Scanner (Alien: Isolation)
        const darkMetal = this._material('darkMetal', { color: 0x1e293b, roughness: 0.65, metalness: 0.9 });
        const industrial = this._material('industrial', { color: 0x475569, roughness: 0.5, metalness: 0.85 });
        const leadCurtain = this._material('rubber', { color: 0x0f172a, roughness: 0.9, metalness: 0.1 });
        const crtScreen = this._material('emissiveGreen', { color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 2.2 });
        // Table de convoyage à rouleaux
        root.add(this._box(darkMetal, { x: 3.2, y: 0.65, z: 1.1 }, { x: 0, y: 0.55, z: 0 }, 'scanner_conveyor_chassis', true));
        // Tunnel d'inspection aux rayons X plombé
        root.add(this._box(industrial, { x: 1.25, y: 1.45, z: 1.25 }, { x: 0, y: 1.5, z: 0 }, 'scanner_xray_shroud'));
        // Rideaux de lamelles de plomb souple
        root.add(this._box(leadCurtain, { x: 0.08, y: 0.85, z: 0.85 }, { x: -0.63, y: 1.35, z: 0 }, 'scanner_lead_curtain_in'));
        root.add(this._box(leadCurtain, { x: 0.08, y: 0.85, z: 0.85 }, { x: 0.63, y: 1.35, z: 0 }, 'scanner_lead_curtain_out'));
        // Moniteur CRT Seegson d'inspection des bagages
        root.add(this._box(crtScreen, { x: 0.45, y: 0.35, z: 0.08 }, { x: 0, y: 2.1, z: 0.62 }, 'scanner_crt_monitor'));
      } else if (normalizedType === 'hadley_steam_turbogenerator' || normalizedType === 'steam_turbogenerator') {
        // Chantier 297 : Hadley's Hope Atmosphere Processor Steam Turbogenerator (Aliens 1986)
        const darkMetal = this._material('darkMetal', { color: 0x1e1b4b, roughness: 0.6, metalness: 0.95 });
        const industrial = this._material('industrial', { color: 0x334155, roughness: 0.45, metalness: 0.85 });
        const hazard = this._material('hazard', { color: 0xb45309, roughness: 0.4, metalness: 0.8 });
        const brass = this._material('brass', { color: 0xd97706, roughness: 0.35, metalness: 0.9 });
        // Corps de stator cylindrique monumental
        root.add(this._cylinder(darkMetal, 1.35, 1.35, 3.2, { x: 0, y: 1.4, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, 'turbogen_stator_barrel', true));
        // Brides annulaires de renfort
        for (let r = -1; r <= 1; r++) {
          root.add(this._torus(industrial, 1.42, 0.08, { x: r * 0.95, y: 1.4, z: 0 }, { x: 0, y: Math.PI / 2, z: 0 }, `turbogen_flange_${r}`));
        }
        // Boîte d'admission de vapeur surchauffée
        root.add(this._box(hazard, { x: 0.85, y: 1.1, z: 0.85 }, { x: -1.1, y: 2.5, z: 0 }, 'turbogen_steam_chest'));
        // Régulateur tachymétrique de vitesse
        root.add(this._cylinder(brass, 0.28, 0.28, 0.65, { x: 1.4, y: 1.9, z: 0.4 }, { x: 0, y: 0, z: 0 }, 'turbogen_speed_governor'));
      } else if (normalizedType === 'uscm_ballistic_sled' || normalizedType === 'ballistic_sled') {
        // Chantier 298 : USCM Armory Ballistic Test Chamber & Gel Block Sled (Aliens: Dark Descent)
        const darkMetal = this._material('darkMetal', { color: 0x18181b, roughness: 0.7, metalness: 0.9 });
        const steel = this._material('steel', { color: 0x64748b, roughness: 0.35, metalness: 0.95 });
        const gelMat = this._material('ballisticGel', { color: 0xd97706, roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.75 });
        const amberSensor = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 2.0 });
        // Caisson blindé du banc d'essai
        root.add(this._box(darkMetal, { x: 2.8, y: 1.2, z: 1.4 }, { x: 0, y: 0.9, z: 0 }, 'ballistic_containment_box', true));
        // Rails de guidage du chariot
        root.add(this._box(steel, { x: 2.7, y: 0.08, z: 0.75 }, { x: 0, y: 0.65, z: 0 }, 'ballistic_sled_tracks'));
        // Bloc de gélatine balistique cible
        root.add(this._box(gelMat, { x: 0.6, y: 0.65, z: 0.5 }, { x: 0.2, y: 1.05, z: 0 }, 'ballistic_gelatin_target'));
        // Cellules photoélectriques du chronographe
        root.add(this._cylinder(amberSensor, 0.08, 0.08, 0.85, { x: -0.65, y: 1.35, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'ballistic_chronograph_beam'));
      } else if (normalizedType === 'sevastopol_apollo_cable_tray' || normalizedType === 'apollo_cable_tray') {
        // Chantier 299 : Sevastopol Apollo Data Conduit Cable Tray & Fiber Bus (Alien: Isolation)
        const darkMetal = this._material('darkMetal', { color: 0x1e293b, roughness: 0.65, metalness: 0.9 });
        const yellowFiber = this._material('fiberCable', { color: 0xfacc15, roughness: 0.4, metalness: 0.3 });
        const industrial = this._material('industrial', { color: 0x475569, roughness: 0.5, metalness: 0.85 });
        const ledGreen = this._material('emissiveGreen', { color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 2.4 });
        // Passerelle en treillis de chemin de câbles
        root.add(this._box(darkMetal, { x: 3.2, y: 0.12, z: 0.95 }, { x: 0, y: 3.6, z: 0 }, 'cable_tray_ladder_truss'));
        // Faisceau de fibres optiques jaunes Apollo
        root.add(this._cylinder(yellowFiber, 0.12, 0.12, 3.1, { x: 0, y: 3.75, z: -0.18 }, { x: 0, y: 0, z: Math.PI / 2 }, 'fiber_bundle_primary'));
        // Boîtier de dérivation et diagnostic
        root.add(this._box(industrial, { x: 0.45, y: 0.4, z: 0.35 }, { x: 0.6, y: 3.82, z: 0.2 }, 'apollo_diagnostic_tap'));
        // Voyant LED d'activité réseau synaptique
        root.add(this._cylinder(ledGreen, 0.05, 0.05, 0.08, { x: 0.6, y: 3.82, z: 0.4 }, { x: Math.PI / 2, y: 0, z: 0 }, 'apollo_bus_activity_led'));
      } else if (normalizedType === 'fiorina_blast_tuyere' || normalizedType === 'blast_tuyere') {
        // Chantier 300 : Fiorina 161 Foundry Blast Furnace Tuyere & Oxygen Lance (Alien 3)
        const darkMetal = this._material('darkMetal', { color: 0x18181b, roughness: 0.7, metalness: 0.95 });
        const copper = this._material('copper', { color: 0xb45309, roughness: 0.35, metalness: 0.95 });
        const steel = this._material('steel', { color: 0x64748b, roughness: 0.35, metalness: 0.95 });
        const amberSight = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 2.2 });
        // Buse conique de soufflage en cuivre refroidie
        root.add(this._cylinder(copper, 0.55, 0.32, 1.8, { x: 0, y: 1.3, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, 'blast_copper_tuyere', true));
        // Collerette de fixation au blindage du fourneau
        root.add(this._torus(darkMetal, 0.72, 0.14, { x: -0.75, y: 1.3, z: 0 }, { x: 0, y: Math.PI / 2, z: 0 }, 'blast_bustle_pipe_collar'));
        // Lance axiale d'injection d'oxygène pur
        root.add(this._cylinder(steel, 0.12, 0.12, 2.2, { x: 0.2, y: 1.3, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, 'blast_oxygen_injection_lance'));
        // Hublot de regard visuel à verre teinté
        root.add(this._cylinder(amberSight, 0.15, 0.15, 0.22, { x: 0.95, y: 1.3, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, 'blast_optical_peep_sight'));
      } else if (normalizedType === 'nostromo_eva_locker') {
        // Chantier 301 : Nostromo Airlock EVA Spacesuit Locker Rack (Alien 1979)
        const lockerMetal = this._material('industrial', { color: 0x64748b, roughness: 0.5, metalness: 0.85 });
        const suitWhite = this._material('suit', { color: 0xe2e8f0, roughness: 0.7, metalness: 0.1 });
        const visorGold = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 1.6 });
        const stripe = this._material('hazard', { color: 0xdc2626, roughness: 0.5, metalness: 0.4 });
        root.add(this._box(lockerMetal, { x: 2.0, y: 2.6, z: 0.8 }, { x: 0, y: 1.3, z: 0 }, 'eva_locker_cabinet', true));
        for (let s = -1; s <= 1; s += 2) {
          root.add(this._box(suitWhite, { x: 0.62, y: 1.5, z: 0.3 }, { x: s * 0.5, y: 1.25, z: 0.3 }, `eva_suit_torso_${s}`));
          root.add(this._ellipsoid(suitWhite, { x: 0.28, y: 0.28, z: 0.28 }, { x: s * 0.5, y: 2.2, z: 0.32 }, `eva_helmet_${s}`, 8));
          root.add(this._box(visorGold, { x: 0.34, y: 0.14, z: 0.06 }, { x: s * 0.5, y: 2.2, z: 0.58 }, `eva_visor_${s}`));
        }
        root.add(this._box(stripe, { x: 2.04, y: 0.12, z: 0.06 }, { x: 0, y: 2.5, z: 0.42 }, 'eva_locker_stripe'));
      } else if (normalizedType === 'hadley_dropship_fuel_cart') {
        // Chantier 302 : Hadley's Hope Dropship Fuel Pump Cart (Aliens 1986)
        const tankMetal = this._material('industrial', { color: 0x854d0e, roughness: 0.55, metalness: 0.8 });
        const rubber = this._material('rubber', { color: 0x0f172a, roughness: 0.9, metalness: 0.1 });
        const hazard = this._material('hazard', { color: 0xeab308, roughness: 0.45, metalness: 0.7 });
        root.add(this._cylinder(tankMetal, 0.7, 0.7, 2.4, { x: 0, y: 1.05, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, 'fuel_cart_tank', true));
        for (let s = -1; s <= 1; s += 2) {
          root.add(this._cylinder(rubber, 0.38, 0.38, 0.22, { x: s * 0.85, y: 0.38, z: 0.75 }, { x: Math.PI / 2, y: 0, z: 0 }, `fuel_cart_wheel_a_${s}`));
          root.add(this._cylinder(rubber, 0.38, 0.38, 0.22, { x: s * 0.85, y: 0.38, z: -0.75 }, { x: Math.PI / 2, y: 0, z: 0 }, `fuel_cart_wheel_b_${s}`));
        }
        root.add(this._box(hazard, { x: 0.7, y: 0.5, z: 0.5 }, { x: 0.95, y: 1.95, z: 0 }, 'fuel_cart_pump_housing'));
        root.add(this._cylinder(hazard, 0.07, 0.07, 1.6, { x: -0.4, y: 1.9, z: 0.3 }, { x: 0, y: 0, z: Math.PI / 2 }, 'fuel_cart_hose'));
      } else if (normalizedType === 'fiorina_bunk_block') {
        // Chantier 303 : Fiorina 161 Prisoner Dormitory Bunk Cell Block (Alien 3)
        const rustSteel = this._material('rust', { color: 0x57534e, roughness: 0.85, metalness: 0.5 });
        const cloth = this._material('cloth', { color: 0x44403c, roughness: 0.95, metalness: 0.02 });
        for (let level = 0; level < 2; level++) {
          root.add(this._box(rustSteel, { x: 2.2, y: 0.12, z: 1.0 }, { x: 0, y: 0.55 + level * 1.15, z: 0 }, `bunk_frame_${level}`));
          root.add(this._box(cloth, { x: 2.0, y: 0.14, z: 0.85 }, { x: 0, y: 0.68 + level * 1.15, z: 0 }, `bunk_mattress_${level}`));
        }
        for (let cx = -1; cx <= 1; cx += 2) {
          for (let cz = -1; cz <= 1; cz += 2) {
            root.add(this._box(rustSteel, { x: 0.1, y: 2.5, z: 0.1 }, { x: cx * 1.05, y: 1.25, z: cz * 0.46 }, `bunk_post_${cx}_${cz}`));
          }
        }
        root.add(this._box(rustSteel, { x: 0.08, y: 1.5, z: 0.5 }, { x: 1.2, y: 0.75, z: 0 }, 'bunk_ladder'));
      } else if (normalizedType === 'auriga_amniotic_tanks') {
        // Chantier 304 : USM Auriga Hybrid Nursery Amniotic Tank Row (Alien Resurrection)
        const baseMetal = this._material('darkMetal', { color: 0x0f172a, roughness: 0.5, metalness: 0.9 });
        const glass = this._material('glass', { color: 0x4ade80, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.45 });
        const fluidGlow = this._material('emissiveGreen', { color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 1.8, transparent: true, opacity: 0.7 });
        root.add(this._box(baseMetal, { x: 3.4, y: 0.35, z: 1.2 }, { x: 0, y: 0.18, z: 0 }, 'amniotic_base', true));
        for (let t = -1; t <= 1; t++) {
          root.add(this._cylinder(glass, 0.5, 0.5, 2.3, { x: t * 1.1, y: 1.5, z: 0 }, { x: 0, y: 0, z: 0 }, `amniotic_tank_glass_${t}`, true));
          root.add(this._cylinder(fluidGlow, 0.38, 0.38, 1.9, { x: t * 1.1, y: 1.45, z: 0 }, { x: 0, y: 0, z: 0 }, `amniotic_tank_fluid_${t}`));
          root.add(this._cylinder(baseMetal, 0.56, 0.56, 0.16, { x: t * 1.1, y: 2.7, z: 0 }, { x: 0, y: 0, z: 0 }, `amniotic_tank_cap_${t}`));
        }
      } else if (normalizedType === 'romulus_spindle_handrail') {
        // Chantier 305 : Renaissance Station Rotating Ring Spindle & Zero-G Handrail (Alien: Romulus)
        const spindleMetal = this._material('industrial', { color: 0x94a3b8, roughness: 0.35, metalness: 0.95 });
        const amber = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 1.8 });
        root.add(this._cylinder(spindleMetal, 0.32, 0.32, 3.6, { x: 0, y: 1.8, z: 0 }, { x: 0, y: 0, z: 0 }, 'spindle_core', true));
        root.add(this._torus(spindleMetal, 1.1, 0.07, { x: 0, y: 1.0, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'spindle_handrail_low'));
        root.add(this._torus(spindleMetal, 1.1, 0.07, { x: 0, y: 2.4, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'spindle_handrail_high'));
        for (let a = 0; a < 4; a++) {
          const ang = a * Math.PI / 2;
          root.add(this._box(amber, { x: 0.12, y: 0.12, z: 0.12 }, { x: Math.cos(ang) * 1.1, y: 1.7, z: Math.sin(ang) * 1.1 }, `spindle_beacon_${a}`));
        }
      } else if (normalizedType === 'sevastopol_security_turnstile') {
        // Chantier 306 : Sevastopol Security Checkpoint Turnstile Gate (Alien: Isolation)
        const gateMetal = this._material('industrial', { color: 0xcbd5e1, roughness: 0.4, metalness: 0.8 });
        const redLed = this._material('emissiveRed', { color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 2.0 });
        const dark = this._material('darkMetal', { color: 0x1e293b, roughness: 0.6, metalness: 0.9 });
        root.add(this._box(dark, { x: 0.45, y: 1.2, z: 0.9 }, { x: -1.0, y: 0.6, z: 0 }, 'turnstile_post_left', true));
        root.add(this._box(dark, { x: 0.45, y: 1.2, z: 0.9 }, { x: 1.0, y: 0.6, z: 0 }, 'turnstile_post_right', true));
        for (let arm = 0; arm < 3; arm++) {
          const bar = this._box(gateMetal, { x: 1.7, y: 0.07, z: 0.07 }, { x: 0, y: 1.0, z: 0 }, `turnstile_arm_${arm}`);
          bar.rotation.y = arm * Math.PI / 3;
          root.add(bar);
        }
        root.add(this._box(redLed, { x: 0.2, y: 0.12, z: 0.06 }, { x: -1.0, y: 1.25, z: 0.46 }, 'turnstile_status_led'));
      } else if (normalizedType === 'hadley_radio_mast_rack') {
        // Chantier 307 : Hadley's Hope Operations Radio Mast & Transmitter Rack (Aliens 1986)
        const rackMetal = this._material('darkMetal', { color: 0x1e293b, roughness: 0.55, metalness: 0.9 });
        const steel = this._material('steel', { color: 0x94a3b8, roughness: 0.35, metalness: 0.95 });
        const amber = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 2.2 });
        root.add(this._box(rackMetal, { x: 1.3, y: 1.9, z: 0.8 }, { x: 0, y: 0.95, z: 0 }, 'radio_rack_cabinet', true));
        for (let u = 0; u < 4; u++) {
          root.add(this._box(amber, { x: 0.9, y: 0.07, z: 0.04 }, { x: 0, y: 0.35 + u * 0.42, z: 0.42 }, `radio_rack_led_${u}`));
        }
        root.add(this._cylinder(steel, 0.05, 0.08, 4.6, { x: 0.45, y: 4.2, z: 0 }, { x: 0, y: 0, z: 0 }, 'radio_mast_pole'));
        root.add(this._torus(steel, 0.55, 0.04, { x: 0.45, y: 5.8, z: 0 }, { x: Math.PI / 2.4, y: 0, z: 0 }, 'radio_mast_dish'));
      } else if (normalizedType === 'uscm_dropship_cargo_winch') {
        // Chantier 308 : USCM UD-4L Dropship Cargo Winch & Ramp Clamp (Aliens: Dark Descent)
        const frame = this._material('darkMetal', { color: 0x3f3f46, roughness: 0.6, metalness: 0.9 });
        const hazard = this._material('hazard', { color: 0xeab308, roughness: 0.45, metalness: 0.7 });
        const steel = this._material('steel', { color: 0x94a3b8, roughness: 0.3, metalness: 0.95 });
        root.add(this._box(frame, { x: 2.6, y: 0.25, z: 1.6 }, { x: 0, y: 0.13, z: 0 }, 'winch_ramp_deck', true));
        root.add(this._cylinder(steel, 0.38, 0.38, 1.3, { x: 0, y: 0.95, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, 'winch_drum', true));
        root.add(this._box(hazard, { x: 0.3, y: 0.9, z: 0.3 }, { x: -0.85, y: 0.6, z: 0 }, 'winch_clamp_left'));
        root.add(this._box(hazard, { x: 0.3, y: 0.9, z: 0.3 }, { x: 0.85, y: 0.6, z: 0 }, 'winch_clamp_right'));
        root.add(this._cylinder(steel, 0.03, 0.03, 1.8, { x: 0, y: 0.7, z: 0.9 }, { x: Math.PI / 2, y: 0, z: 0 }, 'winch_cable'));
      } else if (normalizedType === 'sevastopol_control_rod_gantry') {
        // Chantier 309 : Sevastopol Reactor Control Rod Gantry (Alien: Isolation)
        const gantry = this._material('darkMetal', { color: 0x334155, roughness: 0.55, metalness: 0.9 });
        const rodMat = this._material('steel', { color: 0xcbd5e1, roughness: 0.3, metalness: 0.95 });
        const tip = this._material('emissiveCyan', { color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 2.4 });
        root.add(this._box(gantry, { x: 3.0, y: 0.25, z: 0.6 }, { x: 0, y: 3.4, z: 0 }, 'rod_gantry_beam', true));
        root.add(this._box(gantry, { x: 0.25, y: 3.4, z: 0.25 }, { x: -1.5, y: 1.7, z: 0 }, 'rod_gantry_leg_left'));
        root.add(this._box(gantry, { x: 0.25, y: 3.4, z: 0.25 }, { x: 1.5, y: 1.7, z: 0 }, 'rod_gantry_leg_right'));
        for (let r = -1; r <= 1; r++) {
          root.add(this._cylinder(rodMat, 0.1, 0.1, 2.4, { x: r * 0.9, y: 2.1, z: 0 }, { x: 0, y: 0, z: 0 }, `control_rod_${r}`));
          root.add(this._cylinder(tip, 0.12, 0.12, 0.2, { x: r * 0.9, y: 0.85, z: 0 }, { x: 0, y: 0, z: 0 }, `control_rod_tip_${r}`));
        }
      } else if (normalizedType === 'fiorina_ingot_mold_rack') {
        // Chantier 310 : Fiorina 161 Lead Ingot Mold Casting Rack (Alien 3)
        const frame = this._material('rust', { color: 0x44403c, roughness: 0.85, metalness: 0.6 });
        const moltenLead = this._material('emissiveAmber', { color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 2.4 });
        root.add(this._box(frame, { x: 3.0, y: 0.12, z: 1.2 }, { x: 0, y: 0.7, z: 0 }, 'ingot_rack_shelf', true));
        root.add(this._box(frame, { x: 0.15, y: 0.7, z: 1.2 }, { x: -1.45, y: 0.35, z: 0 }, 'ingot_rack_leg_left'));
        root.add(this._box(frame, { x: 0.15, y: 0.7, z: 1.2 }, { x: 1.45, y: 0.35, z: 0 }, 'ingot_rack_leg_right'));
        for (let i = -2; i <= 2; i++) {
          root.add(this._box(moltenLead, { x: 0.45, y: 0.2, z: 0.85 }, { x: i * 0.58, y: 0.86, z: 0 }, `ingot_${i + 2}`));
        }
        root.add(this._cylinder(frame, 0.05, 0.05, 1.8, { x: 0, y: 1.3, z: 0.75 }, { x: 0, y: 0, z: Math.PI / 2 }, 'ingot_tongs'));
      } else if (normalizedType === 'nostromo_galley_table') {
        // Chantier 311 : Nostromo Mess Hall Galley Table & Coffee Dispenser (Alien 1979)
        const steel = this._material('steel', { color: 0xcbd5e1, roughness: 0.35, metalness: 0.9 });
        const dark = this._material('darkMetal', { color: 0x334155, roughness: 0.6, metalness: 0.85 });
        const amber = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 1.8 });
        root.add(this._box(steel, { x: 2.8, y: 0.1, z: 1.1 }, { x: 0, y: 0.85, z: 0 }, 'galley_table_top', true));
        root.add(this._box(dark, { x: 0.18, y: 0.85, z: 0.18 }, { x: 0, y: 0.42, z: 0 }, 'galley_table_pedestal'));
        for (let s = -1; s <= 1; s += 2) {
          root.add(this._cylinder(dark, 0.22, 0.22, 0.5, { x: s * 0.9, y: 0.28, z: 0.85 }, { x: 0, y: 0, z: 0 }, `galley_stool_a_${s}`));
          root.add(this._cylinder(dark, 0.22, 0.22, 0.5, { x: s * 0.9, y: 0.28, z: -0.85 }, { x: 0, y: 0, z: 0 }, `galley_stool_b_${s}`));
        }
        root.add(this._box(dark, { x: 0.5, y: 0.9, z: 0.4 }, { x: 1.7, y: 0.45, z: 0 }, 'galley_coffee_dispenser', true));
        root.add(this._box(amber, { x: 0.3, y: 0.08, z: 0.04 }, { x: 1.7, y: 0.75, z: 0.22 }, 'galley_coffee_led'));
      } else if (normalizedType === 'hadley_hydroponic_planter') {
        // Chantier 312 : Hadley's Hope Colony Hydroponics Planter Bay (Aliens 1986)
        const trough = this._material('industrial', { color: 0x475569, roughness: 0.6, metalness: 0.7 });
        const leaf = this._material('plant', { color: 0x16a34a, roughness: 0.8, metalness: 0.0 });
        const lamp = this._material('emissiveViolet', { color: 0xc084fc, emissive: 0xa855f7, emissiveIntensity: 2.2 });
        for (let p = -1; p <= 1; p++) {
          root.add(this._box(trough, { x: 0.8, y: 0.5, z: 1.6 }, { x: p * 0.95, y: 0.25, z: 0 }, `hydro_trough_${p}`, true));
          root.add(this._ellipsoid(leaf, { x: 0.32, y: 0.35, z: 0.55 }, { x: p * 0.95, y: 0.7, z: 0 }, `hydro_plant_${p}`, 8));
        }
        root.add(this._box(trough, { x: 3.0, y: 0.1, z: 0.2 }, { x: 0, y: 2.2, z: 0 }, 'hydro_lamp_rail'));
        root.add(this._box(lamp, { x: 2.8, y: 0.06, z: 0.16 }, { x: 0, y: 2.12, z: 0 }, 'hydro_lamp'));
      } else if (normalizedType === 'fiorina_chapel_altar') {
        // Chantier 313 : Fiorina 161 Chapel Altar & Candle Rack (Alien 3)
        const stone = this._material('rust', { color: 0x57534e, roughness: 0.9, metalness: 0.2 });
        const wax = this._material('emissiveAmber', { color: 0xfde68a, emissive: 0xf59e0b, emissiveIntensity: 2.6 });
        const iron = this._material('darkMetal', { color: 0x1c1917, roughness: 0.7, metalness: 0.8 });
        root.add(this._box(stone, { x: 2.0, y: 1.0, z: 0.9 }, { x: 0, y: 0.5, z: 0 }, 'chapel_altar_block', true));
        root.add(this._box(iron, { x: 0.14, y: 1.9, z: 0.14 }, { x: 0, y: 1.95, z: -0.2 }, 'chapel_cross_upright'));
        root.add(this._box(iron, { x: 0.8, y: 0.14, z: 0.14 }, { x: 0, y: 2.4, z: -0.2 }, 'chapel_cross_arm'));
        for (let c = -2; c <= 2; c++) {
          root.add(this._cylinder(wax, 0.05, 0.05, 0.3, { x: c * 0.38, y: 1.15, z: 0.25 }, { x: 0, y: 0, z: 0 }, `chapel_candle_${c + 2}`));
        }
      } else if (normalizedType === 'auriga_command_console') {
        // Chantier 314 : USM Auriga Command Bridge Navigation Console (Alien Resurrection)
        const hull = this._material('darkMetal', { color: 0x1e293b, roughness: 0.5, metalness: 0.9 });
        const screen = this._material('emissiveCyan', { color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 2.2 });
        root.add(this._box(hull, { x: 3.2, y: 1.0, z: 0.9 }, { x: 0, y: 0.5, z: 0 }, 'bridge_console_base', true));
        for (let s = -1; s <= 1; s++) {
          const scr = this._box(screen, { x: 0.85, y: 0.55, z: 0.06 }, { x: s * 1.0, y: 1.3, z: -0.1 }, `bridge_screen_${s + 1}`);
          scr.rotation.x = -0.35;
          root.add(scr);
        }
        root.add(this._cylinder(hull, 0.3, 0.3, 0.6, { x: 0, y: 0.3, z: 1.1 }, { x: 0, y: 0, z: 0 }, 'bridge_command_chair'));
      } else if (normalizedType === 'romulus_cryo_pod_rack') {
        // Chantier 315 : Renaissance Station Cryo Pod Rack (Alien: Romulus)
        const rack = this._material('industrial', { color: 0x94a3b8, roughness: 0.4, metalness: 0.9 });
        const glass = this._material('glass', { color: 0x7dd3fc, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.5 });
        const glow = this._material('emissiveCyan', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.8 });
        root.add(this._box(rack, { x: 3.0, y: 0.2, z: 1.2 }, { x: 0, y: 0.1, z: 0 }, 'pod_rack_base', true));
        for (let p = 0; p < 2; p++) {
          root.add(this._ellipsoid(glass, { x: 0.6, y: 0.55, z: 1.0 }, { x: -0.8 + p * 1.6, y: 1.0, z: 0 }, `pod_shell_${p}`, 10));
          root.add(this._box(glow, { x: 0.5, y: 0.08, z: 0.7 }, { x: -0.8 + p * 1.6, y: 0.75, z: 0 }, `pod_glow_${p}`));
        }
        root.add(this._box(rack, { x: 0.12, y: 2.2, z: 0.12 }, { x: 0, y: 1.1, z: 0 }, 'pod_rack_spine'));
      } else if (normalizedType === 'sevastopol_medical_bed') {
        // Chantier 316 : Sevastopol Medical Bay Diagnostic Bed (Alien: Isolation)
        const bedMat = this._material('steel', { color: 0xe2e8f0, roughness: 0.4, metalness: 0.7 });
        const dark = this._material('darkMetal', { color: 0x1e293b, roughness: 0.6, metalness: 0.85 });
        const mon = this._material('emissiveGreen', { color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 2.0 });
        root.add(this._box(bedMat, { x: 2.0, y: 0.18, z: 0.85 }, { x: 0, y: 0.75, z: 0 }, 'medbed_surface', true));
        root.add(this._box(dark, { x: 0.3, y: 0.7, z: 0.5 }, { x: 0, y: 0.35, z: 0 }, 'medbed_base'));
        root.add(this._torus(dark, 0.7, 0.07, { x: 0.3, y: 1.1, z: 0 }, { x: 0, y: Math.PI / 2, z: 0 }, 'scanner_arch'));
        root.add(this._box(mon, { x: 0.5, y: 0.35, z: 0.06 }, { x: -1.3, y: 1.6, z: 0.3 }, 'medbed_monitor'));
      } else if (normalizedType === 'hadley_hangar_chain_hoist') {
        // Chantier 317 : Hadley's Hope Hangar Overhead Chain Hoist (Aliens 1986)
        const beam = this._material('darkMetal', { color: 0x3f3f46, roughness: 0.6, metalness: 0.9 });
        const hazard = this._material('hazard', { color: 0xeab308, roughness: 0.45, metalness: 0.7 });
        const chain = this._material('steel', { color: 0x94a3b8, roughness: 0.3, metalness: 0.95 });
        root.add(this._box(beam, { x: 3.0, y: 0.3, z: 0.4 }, { x: 0, y: 4.0, z: 0 }, 'hangar_hoist_beam', true));
        root.add(this._box(hazard, { x: 0.7, y: 0.5, z: 0.6 }, { x: 0, y: 3.6, z: 0 }, 'hangar_hoist_motor'));
        root.add(this._cylinder(chain, 0.04, 0.04, 2.0, { x: 0, y: 2.5, z: 0 }, { x: 0, y: 0, z: 0 }, 'hangar_hoist_chain'));
        root.add(this._torus(hazard, 0.25, 0.07, { x: 0, y: 1.4, z: 0 }, { x: 0, y: 0, z: 0 }, 'hoist_hook'));
        root.add(this._box(beam, { x: 0.2, y: 4.0, z: 0.2 }, { x: -1.4, y: 2.0, z: 0 }, 'hangar_hoist_column'));
      } else if (normalizedType === 'uscm_smartgun_rig') {
        // Chantier 318 : USCM Armory Smartgun Gyro Calibration Rig (Aliens)
        const frame = this._material('darkMetal', { color: 0x27272a, roughness: 0.6, metalness: 0.9 });
        const gun = this._material('steel', { color: 0x71717a, roughness: 0.35, metalness: 0.95 });
        const led = this._material('emissiveGreen', { color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 2.2 });
        root.add(this._box(frame, { x: 1.4, y: 0.2, z: 1.0 }, { x: 0, y: 0.1, z: 0 }, 'rig_base', true));
        root.add(this._box(frame, { x: 0.18, y: 1.6, z: 0.18 }, { x: 0, y: 1.0, z: 0 }, 'rig_mast'));
        root.add(this._torus(gun, 0.55, 0.05, { x: 0, y: 1.5, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'rig_gyro'));
        root.add(this._box(gun, { x: 1.3, y: 0.18, z: 0.16 }, { x: 0, y: 1.5, z: 0 }, 'rig_smartgun_body'));
        root.add(this._box(led, { x: 0.2, y: 0.1, z: 0.05 }, { x: 0.5, y: 0.55, z: 0.5 }, 'rig_status_led'));
      } else if (normalizedType === 'sevastopol_vending_row') {
        // Chantier 319 : Sevastopol Seegson Cafeteria Vending Machine Row (Alien: Isolation)
        const body = this._material('industrial', { color: 0xb91c1c, roughness: 0.45, metalness: 0.6 });
        const face = this._material('emissiveAmber', { color: 0xfef3c7, emissive: 0xf59e0b, emissiveIntensity: 1.6 });
        for (let v = -1; v <= 1; v++) {
          root.add(this._box(body, { x: 0.85, y: 1.9, z: 0.8 }, { x: v * 0.95, y: 0.95, z: 0 }, `vend_body_${v + 1}`, true));
          root.add(this._box(face, { x: 0.6, y: 1.1, z: 0.05 }, { x: v * 0.95, y: 1.2, z: 0.42 }, `vend_face_${v + 1}`));
        }
      } else if (normalizedType === 'fiorina_autopsy_table') {
        // Chantier 320 : Fiorina 161 Infirmary Autopsy Table (Alien 3)
        const steel = this._material('steel', { color: 0xd4d4d8, roughness: 0.35, metalness: 0.85 });
        const dark = this._material('darkMetal', { color: 0x292524, roughness: 0.7, metalness: 0.8 });
        const sheet = this._material('cloth', { color: 0xe7e5e4, roughness: 0.95, metalness: 0.0 });
        const lamp = this._material('emissiveAmber', { color: 0xffffff, emissive: 0xfef9c3, emissiveIntensity: 2.8 });
        root.add(this._box(steel, { x: 2.0, y: 0.12, z: 0.85 }, { x: 0, y: 0.95, z: 0 }, 'autopsy_table_top', true));
        root.add(this._box(dark, { x: 0.25, y: 0.95, z: 0.25 }, { x: 0, y: 0.47, z: 0 }, 'autopsy_table_pedestal'));
        root.add(this._box(sheet, { x: 1.4, y: 0.1, z: 0.6 }, { x: -0.1, y: 1.06, z: 0 }, 'autopsy_sheet'));
        root.add(this._cylinder(dark, 0.04, 0.04, 2.2, { x: 0.8, y: 2.0, z: 0.4 }, { x: 0, y: 0, z: 0 }, 'autopsy_lamp_arm'));
        root.add(this._cylinder(lamp, 0.3, 0.3, 0.1, { x: 0.8, y: 3.05, z: 0.4 }, { x: 0, y: 0, z: 0 }, 'autopsy_lamp'));
      } else if (normalizedType === 'nostromo_airlock_cycling_valve') {
        // Chantier 321 : Nostromo Airlock Manual Cycling Valve & Actuator (Alien 1979)
        const steel = this._material('steel', { color: 0x94a3b8, roughness: 0.35, metalness: 0.9 });
        const dark = this._material('darkMetal', { color: 0x1e293b, roughness: 0.65, metalness: 0.85 });
        const cyan = this._material('emissiveCyan', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.0 });
        root.add(this._box(dark, { x: 1.4, y: 1.8, z: 0.35 }, { x: 0, y: 1.1, z: 0 }, 'airlock_valve_panel', true));
        root.add(this._cylinder(steel, 0.25, 0.25, 0.45, { x: 0, y: 1.2, z: 0.22 }, { x: Math.PI / 2, y: 0, z: 0 }, 'airlock_valve_hub'));
        root.add(this._torus(steel, 0.45, 0.06, { x: 0, y: 1.2, z: 0.46 }, { x: 0, y: 0, z: 0 }, 'airlock_valve_wheel'));
        root.add(this._box(cyan, { x: 0.25, y: 0.1, z: 0.05 }, { x: 0.45, y: 1.7, z: 0.19 }, 'airlock_pressure_gauge'));
      } else if (normalizedType === 'hadley_seismic_survey_drill') {
        // Chantier 322 : Hadley's Hope Seismic Survey Drill Rig (Aliens 1986)
        const frame = this._material('industrial', { color: 0xd97706, roughness: 0.45, metalness: 0.75 });
        const bit = this._material('steel', { color: 0x475569, roughness: 0.3, metalness: 0.95 });
        const amber = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 2.4 });
        root.add(this._cylinder(frame, 0.6, 0.8, 1.2, { x: 0, y: 0.6, z: 0 }, { x: 0, y: 0, z: 0 }, 'drill_housing', true));
        root.add(this._cylinder(bit, 0.15, 0.05, 1.4, { x: 0, y: 0.2, z: 0 }, { x: 0, y: 0, z: 0 }, 'drill_bit'));
        for (let l = 0; l < 3; l++) {
          const ang = (l * Math.PI * 2) / 3;
          root.add(this._cylinder(frame, 0.07, 0.07, 1.8, { x: Math.cos(ang) * 0.75, y: 0.85, z: Math.sin(ang) * 0.75 }, { x: Math.sin(ang) * 0.35, y: 0, z: -Math.cos(ang) * 0.35 }, `drill_leg_${l}`));
        }
        root.add(this._box(amber, { x: 0.2, y: 0.2, z: 0.2 }, { x: 0, y: 1.35, z: 0 }, 'drill_strobe'));
      } else if (normalizedType === 'fiorina_toxic_sludge_centrifuge') {
        // Chantier 323 : Fiorina 161 Toxic Sludge Decanter Centrifuge (Alien 3)
        const rust = this._material('rust', { color: 0x78350f, roughness: 0.85, metalness: 0.4 });
        const vat = this._material('darkMetal', { color: 0x27272a, roughness: 0.7, metalness: 0.8 });
        const slime = this._material('emissiveGreen', { color: 0x84cc16, emissive: 0x65a30d, emissiveIntensity: 2.0 });
        root.add(this._cylinder(vat, 1.1, 1.1, 1.6, { x: 0, y: 0.8, z: 0 }, { x: 0, y: 0, z: 0 }, 'centrifuge_drum', true));
        root.add(this._cylinder(rust, 0.2, 0.2, 1.8, { x: 0, y: 0.9, z: 0 }, { x: 0, y: 0, z: 0 }, 'centrifuge_core'));
        root.add(this._box(slime, { x: 0.8, y: 0.15, z: 0.8 }, { x: 0, y: 1.5, z: 0 }, 'centrifuge_sludge'));
        root.add(this._cylinder(rust, 0.12, 0.12, 1.4, { x: 1.1, y: 1.1, z: 0 }, { x: 0, y: 0, z: -0.6 }, 'centrifuge_discharge_chute'));
      } else if (normalizedType === 'auriga_specimen_autopsy_rig') {
        // Chantier 324 : USM Auriga Vertical Specimen Autopsy Rig (Alien Resurrection)
        const armor = this._material('darkMetal', { color: 0x0f172a, roughness: 0.5, metalness: 0.9 });
        const arm = this._material('steel', { color: 0x64748b, roughness: 0.35, metalness: 0.9 });
        const cyanGlow = this._material('emissiveCyan', { color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 2.2 });
        root.add(this._box(armor, { x: 1.6, y: 2.8, z: 0.4 }, { x: 0, y: 1.4, z: 0 }, 'autopsy_backplate', true));
        root.add(this._box(cyanGlow, { x: 1.1, y: 2.2, z: 0.08 }, { x: 0, y: 1.4, z: 0.18 }, 'autopsy_matrix_grid'));
        root.add(this._cylinder(arm, 0.06, 0.06, 0.9, { x: -0.65, y: 2.1, z: 0.4 }, { x: 0.4, y: 0, z: 0 }, 'autopsy_tool_arm_l'));
        root.add(this._cylinder(arm, 0.06, 0.06, 0.9, { x: 0.65, y: 2.1, z: 0.4 }, { x: 0.4, y: 0, z: 0 }, 'autopsy_tool_arm_r'));
      } else if (normalizedType === 'romulus_centrifugal_ring_pylon') {
        // Chantier 325 : Renaissance Station Centrifugal Ring Pylon (Alien: Romulus)
        const hull = this._material('industrial', { color: 0x64748b, roughness: 0.4, metalness: 0.85 });
        const beam = this._material('darkMetal', { color: 0x1e293b, roughness: 0.6, metalness: 0.9 });
        const redBeacon = this._material('emissiveRed', { color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 2.5 });
        root.add(this._cylinder(hull, 0.4, 0.65, 3.2, { x: 0, y: 1.6, z: 0 }, { x: 0, y: 0, z: 0 }, 'pylon_mast', true));
        root.add(this._torus(beam, 0.85, 0.12, { x: 0, y: 2.6, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'pylon_ring'));
        root.add(this._box(redBeacon, { x: 0.18, y: 0.28, z: 0.18 }, { x: 0, y: 3.3, z: 0 }, 'pylon_beacon'));
      } else if (normalizedType === 'sevastopol_transit_turnstile_gate') {
        // Chantier 326 : Sevastopol Transit Gate Turnstile (Alien: Isolation)
        const yellow = this._material('industrial', { color: 0xeab308, roughness: 0.45, metalness: 0.65 });
        const post = this._material('darkMetal', { color: 0x334155, roughness: 0.5, metalness: 0.85 });
        const reader = this._material('emissiveGreen', { color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 2.2 });
        root.add(this._box(post, { x: 0.4, y: 1.1, z: 1.2 }, { x: 0, y: 0.55, z: 0 }, 'turnstile_console', true));
        root.add(this._cylinder(yellow, 0.05, 0.05, 0.9, { x: 0.25, y: 0.8, z: 0.45 }, { x: 0, y: 0, z: Math.PI / 2 }, 'turnstile_arm_a'));
        root.add(this._cylinder(yellow, 0.05, 0.05, 0.9, { x: 0.25, y: 0.8, z: -0.45 }, { x: 0, y: 0, z: Math.PI / 2 }, 'turnstile_arm_b'));
        root.add(this._box(reader, { x: 0.15, y: 0.06, z: 0.2 }, { x: 0, y: 1.12, z: 0.2 }, 'turnstile_badge_scanner'));
      } else if (normalizedType === 'hadley_sublevel_sump_pump') {
        // Chantier 327 : Hadley's Hope Sublevel Drainage Sump Pump (Aliens 1986)
        const dark = this._material('darkMetal', { color: 0x1e293b, roughness: 0.65, metalness: 0.8 });
        const blue = this._material('industrial', { color: 0x0284c7, roughness: 0.45, metalness: 0.7 });
        const water = this._material('emissiveCyan', { color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 1.6 });
        root.add(this._box(dark, { x: 1.8, y: 0.3, z: 1.4 }, { x: 0, y: 0.15, z: 0 }, 'sump_basin', true));
        root.add(this._cylinder(blue, 0.35, 0.35, 1.2, { x: 0, y: 0.75, z: 0 }, { x: 0, y: 0, z: 0 }, 'sump_motor'));
        root.add(this._cylinder(dark, 0.12, 0.12, 1.6, { x: 0.5, y: 1.0, z: 0 }, { x: 0, y: 0, z: 0.4 }, 'sump_pipe'));
        root.add(this._box(water, { x: 1.5, y: 0.08, z: 1.1 }, { x: 0, y: 0.25, z: 0 }, 'sump_water'));
      } else if (normalizedType === 'uscm_drop_beacon_tripod') {
        // Chantier 328 : USCM Tactical Drop-Zone Beacon Tripod (Aliens: Dark Descent)
        const olive = this._material('darkMetal', { color: 0x27272a, roughness: 0.6, metalness: 0.9 });
        const dish = this._material('steel', { color: 0x71717a, roughness: 0.35, metalness: 0.95 });
        const strobe = this._material('emissiveGreen', { color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 2.8 });
        root.add(this._cylinder(olive, 0.06, 0.06, 2.4, { x: 0, y: 1.2, z: 0 }, { x: 0, y: 0, z: 0 }, 'beacon_mast', true));
        for (let t = 0; t < 3; t++) {
          const a = (t * Math.PI * 2) / 3;
          root.add(this._cylinder(olive, 0.05, 0.05, 1.2, { x: Math.cos(a) * 0.45, y: 0.55, z: Math.sin(a) * 0.45 }, { x: Math.sin(a) * 0.45, y: 0, z: -Math.cos(a) * 0.45 }, `beacon_foot_${t}`));
        }
        root.add(this._cylinder(dish, 0.35, 0.05, 0.15, { x: 0, y: 2.3, z: 0 }, { x: 0.4, y: 0, z: 0 }, 'beacon_dish'));
        root.add(this._cylinder(strobe, 0.1, 0.1, 0.2, { x: 0, y: 2.45, z: 0 }, { x: 0, y: 0, z: 0 }, 'beacon_led'));
      } else if (normalizedType === 'sevastopol_maintenance_scaffold') {
        // Chantier 329 : Sevastopol Mobile Maintenance Scaffold Tower (Alien: Isolation)
        const frame = this._material('industrial', { color: 0xf97316, roughness: 0.4, metalness: 0.8 });
        const deck = this._material('steel', { color: 0x475569, roughness: 0.6, metalness: 0.9 });
        const dark = this._material('darkMetal', { color: 0x18181b, roughness: 0.7, metalness: 0.85 });
        for (let col = 0; col < 4; col++) {
          const cx = (col % 2 === 0 ? -1 : 1) * 0.9;
          const cz = (col < 2 ? -1 : 1) * 0.7;
          root.add(this._cylinder(frame, 0.05, 0.05, 3.4, { x: cx, y: 1.7, z: cz }, { x: 0, y: 0, z: 0 }, `scaffold_leg_${col}`));
        }
        root.add(this._box(deck, { x: 2.0, y: 0.1, z: 1.6 }, { x: 0, y: 2.2, z: 0 }, 'scaffold_platform', true));
        root.add(this._torus(dark, 0.12, 0.04, { x: 0.9, y: 0.12, z: 0.7 }, { x: 0, y: 0, z: 0 }, 'scaffold_wheel'));
      } else if (normalizedType === 'fiorina_smelter_tapping_spout') {
        // Chantier 330 : Fiorina 161 Blast Smelter Tapping Spout & Launder (Alien 3)
        const stone = this._material('rust', { color: 0x451a03, roughness: 0.9, metalness: 0.2 });
        const lead = this._material('emissiveAmber', { color: 0xf97316, emissive: 0xd97706, emissiveIntensity: 2.8 });
        const guard = this._material('darkMetal', { color: 0x1c1917, roughness: 0.75, metalness: 0.85 });
        root.add(this._box(stone, { x: 2.6, y: 0.5, z: 1.0 }, { x: 0, y: 0.9, z: 0 }, 'spout_trough', true));
        root.add(this._box(lead, { x: 2.4, y: 0.1, z: 0.6 }, { x: 0, y: 1.12, z: 0 }, 'spout_molten_stream'));
        root.add(this._box(guard, { x: 0.15, y: 1.2, z: 1.2 }, { x: 1.3, y: 1.2, z: 0 }, 'spout_splash_shield'));
      } else if (normalizedType === 'nostromo_cryo_refrigeration_compressor') {
        // Chantier 331 : Nostromo Cryo Refrigeration Compressor Unit (Alien 1979)
        const dark = this._material('darkMetal', { color: 0x1e293b, roughness: 0.65, metalness: 0.85 });
        const steel = this._material('steel', { color: 0x94a3b8, roughness: 0.35, metalness: 0.9 });
        const frost = this._material('emissiveCyan', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.2 });
        root.add(this._box(dark, { x: 2.2, y: 0.9, z: 1.2 }, { x: 0, y: 0.45, z: 0 }, 'compressor_base', true));
        root.add(this._torus(steel, 0.55, 0.08, { x: -0.75, y: 0.85, z: 0.62 }, { x: 0, y: 0, z: 0 }, 'compressor_flywheel'));
        root.add(this._cylinder(steel, 0.28, 0.28, 1.1, { x: 0.25, y: 1.05, z: 0 }, { x: 0, y: 0, z: 0 }, 'compressor_cylinder_a'));
        root.add(this._cylinder(steel, 0.28, 0.28, 1.1, { x: 0.85, y: 1.05, z: 0 }, { x: 0, y: 0, z: 0 }, 'compressor_cylinder_b'));
        root.add(this._box(frost, { x: 0.15, y: 0.7, z: 0.15 }, { x: -0.2, y: 1.1, z: 0.4 }, 'compressor_frost_manifold'));
      } else if (normalizedType === 'hadley_operations_relay_switchboard') {
        // Chantier 332 : Hadley's Hope Operations Relay Switchboard (Aliens 1986)
        const frame = this._material('industrial', { color: 0x334155, roughness: 0.6, metalness: 0.75 });
        const face = this._material('darkMetal', { color: 0x0f172a, roughness: 0.5, metalness: 0.9 });
        const amber = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 2.4 });
        root.add(this._box(frame, { x: 2.4, y: 0.85, z: 1.2 }, { x: 0, y: 0.42, z: 0 }, 'switchboard_desk', true));
        root.add(this._box(face, { x: 2.4, y: 1.0, z: 0.35 }, { x: 0, y: 1.35, z: -0.42 }, 'switchboard_rack'));
        for (let r = 0; r < 4; r++) {
          root.add(this._box(amber, { x: 0.38, y: 0.08, z: 0.05 }, { x: -0.8 + r * 0.52, y: 1.45, z: -0.22 }, `relay_led_bank_${r}`));
        }
      } else if (normalizedType === 'fiorina_ventilation_silencer_baffle') {
        // Chantier 333 : Fiorina 161 Main Ventilation Silencer Baffle (Alien 3)
        const duct = this._material('rust', { color: 0x57534e, roughness: 0.85, metalness: 0.4 });
        const blade = this._material('darkMetal', { color: 0x1c1917, roughness: 0.7, metalness: 0.85 });
        root.add(this._cylinder(duct, 0.8, 0.8, 2.8, { x: 0, y: 1.0, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, 'silencer_casing', true));
        root.add(this._torus(duct, 0.85, 0.08, { x: -1.38, y: 1.0, z: 0 }, { x: 0, y: Math.PI / 2, z: 0 }, 'silencer_flange_l'));
        root.add(this._torus(duct, 0.85, 0.08, { x: 1.38, y: 1.0, z: 0 }, { x: 0, y: Math.PI / 2, z: 0 }, 'silencer_flange_r'));
        for (let b = -2; b <= 2; b++) {
          root.add(this._box(blade, { x: 0.08, y: 1.3, z: 1.2 }, { x: b * 0.45, y: 1.0, z: 0 }, `silencer_blade_${b + 2}`));
        }
      } else if (normalizedType === 'auriga_embryo_cryo_storage_vault') {
        // Chantier 334 : USM Auriga Hybrid Embryo Cryo Storage Vault (Alien Resurrection)
        const vault = this._material('darkMetal', { color: 0x09090b, roughness: 0.5, metalness: 0.9 });
        const chrome = this._material('steel', { color: 0xe2e8f0, roughness: 0.25, metalness: 0.95 });
        const bioGlow = this._material('emissiveGreen', { color: 0x4ade80, emissive: 0x22c55e, emissiveIntensity: 2.2 });
        root.add(this._box(vault, { x: 1.8, y: 2.2, z: 0.6 }, { x: 0, y: 1.1, z: 0 }, 'vault_casing', true));
        for (let row = 0; row < 3; row++) {
          for (let col = -1; col <= 1; col += 2) {
            root.add(this._box(chrome, { x: 0.65, y: 0.42, z: 0.06 }, { x: col * 0.42, y: 0.5 + row * 0.55, z: 0.32 }, `vault_drawer_${row}_${col}`));
          }
        }
        root.add(this._box(bioGlow, { x: 0.4, y: 0.25, z: 0.04 }, { x: 0, y: 1.95, z: 0.32 }, 'vault_bio_scanner'));
      } else if (normalizedType === 'romulus_docking_umbilical_coupling') {
        // Chantier 335 : Renaissance Station Docking Umbilical Coupling (Alien: Romulus)
        const ring = this._material('industrial', { color: 0x64748b, roughness: 0.4, metalness: 0.85 });
        const clamp = this._material('darkMetal', { color: 0x1e293b, roughness: 0.6, metalness: 0.9 });
        const pyroRed = this._material('emissiveRed', { color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 2.6 });
        root.add(this._cylinder(ring, 0.9, 0.9, 2.4, { x: 0, y: 1.2, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'coupling_cylinder', true));
        for (let b = -1; b <= 1; b++) {
          root.add(this._torus(ring, 0.96, 0.07, { x: 0, y: 1.2, z: b * 0.65 }, { x: 0, y: 0, z: 0 }, `coupling_bellows_${b + 1}`));
        }
        for (let c = 0; c < 4; c++) {
          const ang = (c * Math.PI) / 2;
          root.add(this._box(clamp, { x: 0.25, y: 0.35, z: 0.4 }, { x: Math.cos(ang) * 1.05, y: 1.2 + Math.sin(ang) * 1.05, z: 1.1 }, `pyro_clamp_${c}`));
          root.add(this._box(pyroRed, { x: 0.08, y: 0.08, z: 0.1 }, { x: Math.cos(ang) * 1.15, y: 1.2 + Math.sin(ang) * 1.15, z: 1.15 }, `pyro_led_${c}`));
        }
      } else if (normalizedType === 'sevastopol_seegson_security_checkpoint_desk') {
        // Chantier 336 : Sevastopol Seegson Security Checkpoint Desk (Alien: Isolation)
        const desk = this._material('industrial', { color: 0x475569, roughness: 0.5, metalness: 0.7 });
        const crt = this._material('emissiveGreen', { color: 0x86efac, emissive: 0x22c55e, emissiveIntensity: 1.8 });
        const acrylic = this._material('steel', { color: 0x93c5fd, roughness: 0.2, metalness: 0.9, opacity: 0.7, transparent: true });
        root.add(this._box(desk, { x: 2.6, y: 1.0, z: 0.8 }, { x: 0, y: 0.5, z: 0 }, 'security_desk_body', true));
        root.add(this._box(acrylic, { x: 2.4, y: 0.85, z: 0.06 }, { x: 0, y: 1.42, z: 0.32 }, 'security_acrylic_barrier'));
        root.add(this._box(desk, { x: 0.5, y: 0.4, z: 0.4 }, { x: 0.6, y: 1.2, z: -0.1 }, 'security_crt_housing'));
        root.add(this._box(crt, { x: 0.38, y: 0.28, z: 0.04 }, { x: 0.6, y: 1.2, z: 0.12 }, 'security_crt_screen'));
      } else if (normalizedType === 'hadley_sublevel_water_separator') {
        // Chantier 337 : Hadley's Hope Sublevel Water Separator Tank (Aliens 1986)
        const tank = this._material('industrial', { color: 0x0284c7, roughness: 0.45, metalness: 0.75 });
        const dark = this._material('darkMetal', { color: 0x1e293b, roughness: 0.65, metalness: 0.85 });
        const sightGlass = this._material('emissiveCyan', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.2 });
        root.add(this._cylinder(tank, 0.65, 0.65, 2.2, { x: 0, y: 1.1, z: 0 }, { x: 0, y: 0, z: 0 }, 'separator_tank_body', true));
        root.add(this._cylinder(dark, 0.12, 0.12, 1.2, { x: 0.72, y: 1.6, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, 'separator_pipe_in'));
        root.add(this._cylinder(dark, 0.12, 0.12, 1.2, { x: -0.72, y: 0.6, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, 'separator_pipe_out'));
        root.add(this._cylinder(sightGlass, 0.05, 0.05, 1.4, { x: 0, y: 1.1, z: 0.68 }, { x: 0, y: 0, z: 0 }, 'separator_sight_tube'));
      } else if (normalizedType === 'uscm_m577_apc_wheel_chock_rack') {
        // Chantier 338 : USCM M577 APC Heavy Wheel Chock Rack (Aliens 1986 / Dark Descent)
        const frame = this._material('darkMetal', { color: 0x27272a, roughness: 0.6, metalness: 0.9 });
        const chock = this._material('industrial', { color: 0xeab308, roughness: 0.4, metalness: 0.7 });
        root.add(this._box(frame, { x: 2.2, y: 0.8, z: 1.1 }, { x: 0, y: 0.4, z: 0 }, 'chock_rack_frame', true));
        for (let k = 0; k < 4; k++) {
          root.add(this._box(chock, { x: 0.38, y: 0.32, z: 0.35 }, { x: -0.75 + k * 0.5, y: 0.55, z: 0 }, `chock_wedge_${k}`));
        }
      } else if (normalizedType === 'sevastopol_luggage_lockers_bank') {
        // Chantier 339 : Sevastopol Seegson Luggage Lockers Bank (Alien: Isolation)
        const casing = this._material('industrial', { color: 0xb45309, roughness: 0.5, metalness: 0.65 });
        const door = this._material('darkMetal', { color: 0x292524, roughness: 0.6, metalness: 0.85 });
        const led = this._material('emissiveAmber', { color: 0xfde047, emissive: 0xeab308, emissiveIntensity: 2.0 });
        root.add(this._box(casing, { x: 3.2, y: 2.1, z: 0.7 }, { x: 0, y: 1.05, z: 0 }, 'lockers_casing', true));
        for (let row = 0; row < 2; row++) {
          for (let col = 0; col < 4; col++) {
            root.add(this._box(door, { x: 0.68, y: 0.88, z: 0.05 }, { x: -1.1 + col * 0.74, y: 0.55 + row * 0.95, z: 0.36 }, `locker_door_${row}_${col}`));
            root.add(this._box(led, { x: 0.08, y: 0.08, z: 0.06 }, { x: -0.85 + col * 0.74, y: 0.85 + row * 0.95, z: 0.38 }, `locker_led_${row}_${col}`));
          }
        }
      } else if (normalizedType === 'fiorina_lead_refining_skimmer') {
        // Chantier 340 : Fiorina 161 Molten Lead Refining Skimmer Trolley (Alien 3)
        const frame = this._material('rust', { color: 0x451a03, roughness: 0.85, metalness: 0.3 });
        const blade = this._material('darkMetal', { color: 0x1c1917, roughness: 0.7, metalness: 0.85 });
        const scum = this._material('emissiveAmber', { color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 2.8 });
        root.add(this._box(frame, { x: 2.4, y: 0.3, z: 0.8 }, { x: 0, y: 2.4, z: 0 }, 'skimmer_rail_trolley', true));
        root.add(this._cylinder(frame, 0.06, 0.06, 1.6, { x: -0.9, y: 1.6, z: 0 }, { x: 0, y: 0, z: 0 }, 'skimmer_hanger_l'));
        root.add(this._cylinder(frame, 0.06, 0.06, 1.6, { x: 0.9, y: 1.6, z: 0 }, { x: 0, y: 0, z: 0 }, 'skimmer_hanger_r'));
        root.add(this._box(blade, { x: 2.2, y: 0.6, z: 0.15 }, { x: 0, y: 0.75, z: 0 }, 'skimmer_paddle', true));
        root.add(this._box(scum, { x: 2.0, y: 0.12, z: 0.4 }, { x: 0, y: 0.55, z: 0.2 }, 'skimmer_lead_crust'));
      } else if (normalizedType === 'nostromo_avionics_transformer_station') {
        // Chantier 341 : Nostromo Avionics High-Voltage Transformer Station (Alien 1979)
        const frame = this._material('darkMetal', { color: 0x1e293b, roughness: 0.65, metalness: 0.85 });
        const core = this._material('steel', { color: 0x94a3b8, roughness: 0.35, metalness: 0.9 });
        const spark = this._material('emissiveCyan', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.8 });
        root.add(this._box(frame, { x: 2.4, y: 1.4, z: 1.2 }, { x: 0, y: 0.7, z: 0 }, 'transformer_casing', true));
        for (let ins = -1; ins <= 1; ins++) {
          root.add(this._cylinder(core, 0.12, 0.18, 0.7, { x: ins * 0.75, y: 1.75, z: 0 }, { x: 0, y: 0, z: 0 }, `ceramic_insulator_${ins + 1}`));
          root.add(this._box(spark, { x: 0.18, y: 0.18, z: 0.18 }, { x: ins * 0.75, y: 2.15, z: 0 }, `discharge_terminal_${ins + 1}`));
        }
      } else if (normalizedType === 'hadley_tractor_refueling_gantry') {
        // Chantier 342 : Hadley's Hope Mining Tractor Refueling Gantry (Aliens 1986)
        const frame = this._material('industrial', { color: 0xd97706, roughness: 0.45, metalness: 0.75 });
        const pipe = this._material('darkMetal', { color: 0x27272a, roughness: 0.6, metalness: 0.85 });
        const hose = this._material('darkMetal', { color: 0x18181b, roughness: 0.9, metalness: 0.2 });
        const amber = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 2.2 });
        root.add(this._box(frame, { x: 0.3, y: 3.4, z: 0.3 }, { x: -1.2, y: 1.7, z: 0 }, 'gantry_column', true));
        root.add(this._box(frame, { x: 2.6, y: 0.35, z: 0.35 }, { x: 0, y: 3.3, z: 0 }, 'gantry_boom', true));
        root.add(this._cylinder(pipe, 0.08, 0.08, 2.2, { x: 0.8, y: 2.1, z: 0 }, { x: 0, y: 0, z: 0 }, 'gantry_drop_pipe'));
        root.add(this._torus(hose, 0.45, 0.08, { x: 0.8, y: 0.5, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'gantry_fuel_hose'));
        root.add(this._box(amber, { x: 0.15, y: 0.2, z: 0.15 }, { x: -1.2, y: 3.55, z: 0 }, 'gantry_beacon'));
      } else if (normalizedType === 'fiorina_casting_ladle_crucible') {
        // Chantier 343 : Fiorina 161 Casting Ladle Suspended Crucible (Alien 3)
        const rust = this._material('rust', { color: 0x451a03, roughness: 0.85, metalness: 0.3 });
        const iron = this._material('darkMetal', { color: 0x1c1917, roughness: 0.75, metalness: 0.85 });
        const lava = this._material('emissiveAmber', { color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 2.8 });
        root.add(this._cylinder(rust, 0.9, 0.65, 1.8, { x: 0, y: 1.1, z: 0 }, { x: 0, y: 0, z: 0 }, 'ladle_body', true));
        root.add(this._torus(iron, 1.05, 0.12, { x: 0, y: 1.6, z: 0 }, { x: 0, y: 0, z: 0 }, 'ladle_bail_ring'));
        root.add(this._cylinder(lava, 0.8, 0.8, 0.1, { x: 0, y: 1.85, z: 0 }, { x: 0, y: 0, z: 0 }, 'ladle_molten_core'));
      } else if (normalizedType === 'auriga_biohazard_incineration_sluice') {
        // Chantier 344 : USM Auriga Biohazard Incineration Rapid Sluice (Alien Resurrection)
        const casing = this._material('darkMetal', { color: 0x0f172a, roughness: 0.5, metalness: 0.9 });
        const steel = this._material('steel', { color: 0x64748b, roughness: 0.35, metalness: 0.9 });
        const fire = this._material('emissiveRed', { color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 2.6 });
        root.add(this._box(casing, { x: 2.0, y: 2.4, z: 1.4 }, { x: 0, y: 1.2, z: 0 }, 'incinerator_vault', true));
        root.add(this._box(steel, { x: 1.2, y: 1.8, z: 0.15 }, { x: 0, y: 1.1, z: 0.7 }, 'incinerator_blast_door'));
        root.add(this._cylinder(fire, 0.3, 0.3, 0.1, { x: 0, y: 1.4, z: 0.78 }, { x: Math.PI / 2, y: 0, z: 0 }, 'incinerator_plasma_view'));
      } else if (normalizedType === 'romulus_gyro_stabilizer_gimbal') {
        // Chantier 345 : Renaissance Station Gyro-Stabilizer Gimbal (Alien: Romulus)
        const frame = this._material('industrial', { color: 0x475569, roughness: 0.45, metalness: 0.85 });
        const wheel = this._material('steel', { color: 0x94a3b8, roughness: 0.3, metalness: 0.95 });
        const cyan = this._material('emissiveCyan', { color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 2.2 });
        root.add(this._torus(frame, 1.2, 0.08, { x: 0, y: 1.4, z: 0 }, { x: 0, y: 0, z: 0 }, 'gimbal_outer_ring', true));
        root.add(this._torus(frame, 0.9, 0.06, { x: 0, y: 1.4, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'gimbal_inner_ring'));
        root.add(this._cylinder(wheel, 0.5, 0.5, 0.25, { x: 0, y: 1.4, z: 0 }, { x: 0, y: 0, z: 0 }, 'gimbal_rotor'));
        root.add(this._box(cyan, { x: 0.15, y: 0.3, z: 0.15 }, { x: 0, y: 2.65, z: 0 }, 'gimbal_strobe'));
      } else if (normalizedType === 'sevastopol_seegson_freight_pallet_turntable') {
        // Chantier 346 : Sevastopol Seegson Freight Pallet Turntable (Alien: Isolation)
        const base = this._material('industrial', { color: 0x334155, roughness: 0.5, metalness: 0.75 });
        const plate = this._material('steel', { color: 0x64748b, roughness: 0.35, metalness: 0.9 });
        const yellow = this._material('industrial', { color: 0xeab308, roughness: 0.4, metalness: 0.65 });
        root.add(this._cylinder(plate, 1.3, 1.3, 0.2, { x: 0, y: 0.1, z: 0 }, { x: 0, y: 0, z: 0 }, 'turntable_disc', true));
        root.add(this._torus(yellow, 1.32, 0.05, { x: 0, y: 0.12, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'turntable_hazard_rim'));
        root.add(this._box(base, { x: 0.4, y: 0.9, z: 0.3 }, { x: 1.5, y: 0.45, z: 0 }, 'turntable_console'));
      } else if (normalizedType === 'hadley_sublevel_sewer_grate_sluice') {
        // Chantier 347 : Hadley's Hope Sublevel Sewer Grate Sluice (Aliens 1986)
        const frame = this._material('darkMetal', { color: 0x1e293b, roughness: 0.7, metalness: 0.8 });
        const grate = this._material('rust', { color: 0x57534e, roughness: 0.85, metalness: 0.4 });
        const wheel = this._material('industrial', { color: 0x0284c7, roughness: 0.45, metalness: 0.75 });
        root.add(this._box(frame, { x: 1.8, y: 2.8, z: 0.3 }, { x: 0, y: 1.4, z: 0 }, 'sewer_sluice_frame', true));
        root.add(this._box(grate, { x: 1.4, y: 1.8, z: 0.08 }, { x: 0, y: 1.1, z: 0 }, 'sewer_grate_gate'));
        root.add(this._torus(wheel, 0.28, 0.04, { x: 0, y: 2.7, z: 0.2 }, { x: 0, y: 0, z: 0 }, 'sewer_hoist_wheel'));
      } else if (normalizedType === 'uscm_motion_tracker_recharge_depot') {
        // Chantier 348 : USCM Motion Tracker Inductive Recharge Depot (Aliens: Dark Descent)
        const frame = this._material('darkMetal', { color: 0x27272a, roughness: 0.6, metalness: 0.9 });
        const led = this._material('emissiveGreen', { color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 2.2 });
        root.add(this._box(frame, { x: 2.0, y: 1.5, z: 0.35 }, { x: 0, y: 1.2, z: 0 }, 'depot_wall_mount', true));
        for (let s = 0; s < 6; s++) {
          const col = s % 3;
          const row = Math.floor(s / 3);
          root.add(this._box(frame, { x: 0.45, y: 0.4, z: 0.22 }, { x: -0.6 + col * 0.6, y: 0.8 + row * 0.55, z: 0.18 }, `tracker_cradle_${s}`));
          root.add(this._box(led, { x: 0.08, y: 0.08, z: 0.05 }, { x: -0.6 + col * 0.6, y: 1.05 + row * 0.55, z: 0.3 }, `cradle_led_${s}`));
        }
      } else if (normalizedType === 'sevastopol_synthetic_charging_alcove_alt') {
        // Chantier 349 : Sevastopol Synthetic Working Joe Charging Alcove (Alien: Isolation)
        const shell = this._material('industrial', { color: 0x334155, roughness: 0.5, metalness: 0.75 });
        const bus = this._material('steel', { color: 0xd97706, roughness: 0.3, metalness: 0.95 });
        const glow = this._material('emissiveViolet', { color: 0xc084fc, emissive: 0xa855f7, emissiveIntensity: 2.4 });
        root.add(this._box(shell, { x: 1.2, y: 2.4, z: 0.8 }, { x: 0, y: 1.2, z: 0 }, 'alcove_enclosure', true));
        root.add(this._cylinder(bus, 0.04, 0.04, 1.8, { x: 0, y: 1.2, z: -0.32 }, { x: 0, y: 0, z: 0 }, 'charging_busbar'));
        root.add(this._box(glow, { x: 0.5, y: 0.2, z: 0.05 }, { x: 0, y: 2.15, z: 0.38 }, 'charging_status_display'));
      } else if (normalizedType === 'fiorina_crane_counterweight_stack') {
        // Chantier 350 : Fiorina 161 Foundry Crane Cast Iron Counterweight Stack (Alien 3)
        const iron = this._material('rust', { color: 0x3f3f46, roughness: 0.85, metalness: 0.4 });
        const bar = this._material('darkMetal', { color: 0x18181b, roughness: 0.7, metalness: 0.85 });
        root.add(this._cylinder(bar, 0.09, 0.09, 2.4, { x: 0, y: 1.2, z: 0 }, { x: 0, y: 0, z: 0 }, 'counterweight_pin', true));
        for (let w = 0; w < 5; w++) {
          root.add(this._cylinder(iron, 0.8, 0.8, 0.32, { x: 0, y: 0.25 + w * 0.4, z: 0 }, { x: 0, y: 0, z: 0 }, `counterweight_slab_${w}`));
        }
      } else if (normalizedType === 'nostromo_mhd_generator') {
        // Chantier 351 : Nostromo Engine Room Magnetohydrodynamic Generator (Alien 1979)
        const dark = this._material('darkMetal', { color: 0x1e293b, roughness: 0.6, metalness: 0.85 });
        const copper = this._material('copper', { color: 0xb45309, roughness: 0.35, metalness: 0.9 });
        const glow = this._material('emissiveBlue', { color: 0x60a5fa, emissive: 0x3b82f6, emissiveIntensity: 2.2 });
        root.add(this._box(dark, { x: 2.6, y: 0.35, z: 1.5 }, { x: 0, y: 0.18, z: 0 }, 'mhd_base_skid', true));
        root.add(this._cylinder(dark, 0.6, 0.6, 2.0, { x: 0, y: 1.0, z: 0 }, { x: 0, y: 0, z: Math.PI * 0.5 }, 'mhd_vacuum_chamber', true));
        for (let c = -1; c <= 1; c++) {
          root.add(this._cylinder(copper, 0.78, 0.78, 0.28, { x: c * 0.65, y: 1.0, z: 0 }, { x: 0, y: 0, z: Math.PI * 0.5 }, `mhd_magnetic_coil_${c}`));
        }
        root.add(this._box(copper, { x: 1.8, y: 0.12, z: 0.12 }, { x: 0, y: 1.75, z: 0.3 }, 'mhd_busbar_upper'));
        root.add(this._cylinder(glow, 0.15, 0.15, 1.8, { x: 0, y: 1.0, z: 0 }, { x: 0, y: 0, z: Math.PI * 0.5 }, 'mhd_magnetic_flux'));
      } else if (normalizedType === 'hadley_seismic_stabilizer_jack') {
        // Chantier 352 : Hadley's Hope Seismic Stabilizer Jack Rig (Aliens 1986)
        const steel = this._material('steel', { color: 0x64748b, roughness: 0.4, metalness: 0.85 });
        const chrome = this._material('steelBright', { color: 0x94a3b8, roughness: 0.2, metalness: 0.95 });
        const amber = this._material('emissiveAmber', { color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 1.8 });
        root.add(this._box(steel, { x: 1.8, y: 0.25, z: 1.8 }, { x: 0, y: 0.12, z: 0 }, 'jack_base_foot', true));
        root.add(this._cylinder(steel, 0.45, 0.45, 1.6, { x: 0, y: 0.95, z: 0 }, { x: 0, y: 0, z: 0 }, 'hydraulic_cylinder_barrel', true));
        root.add(this._cylinder(chrome, 0.28, 0.28, 1.2, { x: 0, y: 1.9, z: 0 }, { x: 0, y: 0, z: 0 }, 'hydraulic_cylinder_piston', true));
        root.add(this._box(steel, { x: 1.2, y: 0.2, z: 1.2 }, { x: 0, y: 2.5, z: 0 }, 'jack_head_saddle', true));
        root.add(this._box(amber, { x: 0.25, y: 0.35, z: 0.1 }, { x: 0, y: 1.1, z: 0.48 }, 'jack_pressure_dial'));
      } else if (normalizedType === 'fiorina_chemical_neutralization_vat') {
        // Chantier 353 : Fiorina 161 Chemical Neutralization Acid Bath Vat (Alien 3)
        const lead = this._material('rust', { color: 0x475569, roughness: 0.8, metalness: 0.5 });
        const acid = this._material('acidSlurry', { color: 0x65a30d, roughness: 0.2, metalness: 0.2 });
        const dark = this._material('darkMetal', { color: 0x1e293b, roughness: 0.7, metalness: 0.85 });
        root.add(this._box(lead, { x: 2.2, y: 1.1, z: 1.6 }, { x: 0, y: 0.55, z: 0 }, 'neutralization_vat_tub', true));
        root.add(this._box(acid, { x: 1.9, y: 0.08, z: 1.3 }, { x: 0, y: 0.95, z: 0 }, 'neutralization_slurry_surface'));
        root.add(this._cylinder(dark, 0.06, 0.06, 1.4, { x: 0, y: 1.1, z: 0 }, { x: 0, y: 0, z: 0 }, 'vat_agitator_shaft'));
        root.add(this._box(dark, { x: 0.8, y: 0.15, z: 0.05 }, { x: 0, y: 0.65, z: 0 }, 'vat_agitator_blade'));
      } else if (normalizedType === 'auriga_cryo_microtome_workbench') {
        // Chantier 354 : USM Auriga Surgical Cryo-Microtome Workbench (Alien Resurrection)
        const steel = this._material('steel', { color: 0x94a3b8, roughness: 0.35, metalness: 0.9 });
        const cyanGlow = this._material('emissiveCyan', { color: 0x22d3ee, emissive: 0x06b6d4, emissiveIntensity: 2.0 });
        const dark = this._material('darkMetal', { color: 0x0f172a, roughness: 0.6, metalness: 0.8 });
        root.add(this._box(steel, { x: 1.8, y: 0.85, z: 1.1 }, { x: 0, y: 0.42, z: 0 }, 'microtome_bench_body', true));
        root.add(this._cylinder(steel, 0.32, 0.3, 0.25, { x: -0.35, y: 0.95, z: 0 }, { x: 0, y: 0, z: 0 }, 'cryo_sample_chamber', true));
        root.add(this._box(dark, { x: 0.45, y: 0.15, z: 0.15 }, { x: -0.35, y: 1.1, z: 0 }, 'microtome_blade_arm'));
        root.add(this._box(dark, { x: 0.25, y: 0.45, z: 0.25 }, { x: 0.45, y: 1.05, z: 0 }, 'microscope_stand'));
        root.add(this._box(cyanGlow, { x: 0.35, y: 0.2, z: 0.05 }, { x: 0.3, y: 1.25, z: 0.45 }, 'cryo_temp_display'));
      } else if (normalizedType === 'romulus_docking_clamp_arm') {
        // Chantier 355 : Renaissance Station Docking Clamp Hydraulic Arm (Alien: Romulus)
        const frame = this._material('industrial', { color: 0x334155, roughness: 0.55, metalness: 0.75 });
        const hazard = this._material('hazard', { color: 0xd97706, roughness: 0.45, metalness: 0.6 });
        const dark = this._material('darkMetal', { color: 0x18181b, roughness: 0.7, metalness: 0.85 });
        root.add(this._box(frame, { x: 1.2, y: 2.4, z: 0.8 }, { x: 0, y: 1.2, z: -0.2 }, 'clamp_pylon_base', true));
        root.add(this._box(hazard, { x: 1.6, y: 0.4, z: 0.6 }, { x: 0, y: 2.2, z: 0.35 }, 'docking_jaw_upper', true));
        root.add(this._box(dark, { x: 1.4, y: 0.4, z: 0.6 }, { x: 0, y: 1.4, z: 0.35 }, 'docking_jaw_lower', true));
        root.add(this._cylinder(dark, 0.09, 0.09, 0.8, { x: -0.65, y: 1.8, z: 0.2 }, { x: 0, y: 0, z: 0 }, 'jaw_hydraulic_cylinder'));
      } else if (normalizedType === 'sevastopol_synthetic_maintenance_rig') {
        // Chantier 356 : Sevastopol Synthetic Maintenance Test Rig (Alien: Isolation)
        const frame = this._material('industrial', { color: 0x475569, roughness: 0.5, metalness: 0.75 });
        const purple = this._material('emissiveViolet', { color: 0xc084fc, emissive: 0xa855f7, emissiveIntensity: 2.2 });
        const steel = this._material('steel', { color: 0x94a3b8, roughness: 0.35, metalness: 0.9 });
        root.add(this._box(frame, { x: 1.2, y: 2.4, z: 0.3 }, { x: 0, y: 1.2, z: -0.25 }, 'synth_backboard_cradle', true));
        root.add(this._box(steel, { x: 0.15, y: 0.55, z: 0.45 }, { x: -0.5, y: 1.3, z: 0 }, 'synth_arm_clamp_l'));
        root.add(this._box(steel, { x: 0.15, y: 0.55, z: 0.45 }, { x: 0.5, y: 1.3, z: 0 }, 'synth_arm_clamp_r'));
        root.add(this._cylinder(steel, 0.2, 0.22, 0.25, { x: 0, y: 1.95, z: 0 }, { x: 0, y: 0, z: 0 }, 'synth_test_harness'));
        root.add(this._box(purple, { x: 0.45, y: 0.3, z: 0.08 }, { x: 0.4, y: 1.9, z: -0.05 }, 'synth_diagnostic_scope'));
      } else if (normalizedType === 'hadley_moisture_scrubber_column') {
        // Chantier 357 : Hadley's Hope Ventilation Moisture Scrubber Column (Aliens 1986)
        const steel = this._material('steel', { color: 0x64748b, roughness: 0.45, metalness: 0.8 });
        const dark = this._material('darkMetal', { color: 0x334155, roughness: 0.6, metalness: 0.85 });
        root.add(this._cylinder(steel, 0.55, 0.55, 2.7, { x: 0, y: 1.35, z: 0 }, { x: 0, y: 0, z: 0 }, 'scrubber_column_shell', true));
        for (let ring = 0; ring < 4; ring++) {
          root.add(this._cylinder(dark, 0.66, 0.66, 0.1, { x: 0, y: 0.5 + ring * 0.6, z: 0 }, { x: 0, y: 0, z: 0 }, `scrubber_cooling_fin_${ring}`));
        }
        root.add(this._cylinder(dark, 0.4, 0.4, 0.3, { x: 0, y: 2.75, z: 0 }, { x: 0, y: 0, z: 0 }, 'scrubber_fan_core'));
        root.add(this._cylinder(steel, 0.75, 0.75, 0.18, { x: 0, y: 0.09, z: 0 }, { x: 0, y: 0, z: 0 }, 'scrubber_drip_pan'));
      } else if (normalizedType === 'uscm_sentry_ammo_hoist') {
        // Chantier 358 : USCM Sentry Gun Ammunition Hoist Elevator (Aliens: Dark Descent)
        const olive = this._material('oliveDrab', { color: 0x4d533c, roughness: 0.65, metalness: 0.55 });
        const dark = this._material('darkMetal', { color: 0x1f2421, roughness: 0.7, metalness: 0.85 });
        const ammo = this._material('ammoBox', { color: 0x3f4e38, roughness: 0.7, metalness: 0.5 });
        root.add(this._box(dark, { x: 0.1, y: 2.5, z: 0.1 }, { x: -0.5, y: 1.25, z: -0.3 }, 'hoist_guide_rail_l', true));
        root.add(this._box(dark, { x: 0.1, y: 2.5, z: 0.1 }, { x: 0.5, y: 1.25, z: -0.3 }, 'hoist_guide_rail_r', true));
        root.add(this._box(olive, { x: 1.1, y: 0.8, z: 0.75 }, { x: 0, y: 0.75, z: 0 }, 'ammo_hoist_basket', true));
        root.add(this._box(ammo, { x: 0.45, y: 0.28, z: 0.5 }, { x: -0.15, y: 0.95, z: 0 }, 'ammo_crate_stack_1'));
        root.add(this._box(ammo, { x: 0.45, y: 0.28, z: 0.5 }, { x: 0.2, y: 0.95, z: 0 }, 'ammo_crate_stack_2'));
      } else if (normalizedType === 'sevastopol_transit_maintenance_cart') {
        // Chantier 359 : Sevastopol Transit Line Maintenance Cart (Alien: Isolation)
        const yellow = this._material('transportYellow', { color: 0xeab308, roughness: 0.45, metalness: 0.65 });
        const dark = this._material('darkMetal', { color: 0x1e293b, roughness: 0.65, metalness: 0.85 });
        const glow = this._material('emissiveYellow', { color: 0xfef08a, emissive: 0xeab308, emissiveIntensity: 2.0 });
        root.add(this._box(yellow, { x: 2.2, y: 0.3, z: 1.2 }, { x: 0, y: 0.35, z: 0 }, 'cart_flatbed_chassis', true));
        for (let wx = -0.75; wx <= 0.75; wx += 1.5) {
          for (let wz = -0.62; wz <= 0.62; wz += 1.24) {
            root.add(this._cylinder(dark, 0.18, 0.18, 0.12, { x: wx, y: 0.18, z: wz }, { x: Math.PI * 0.5, y: 0, z: 0 }, `cart_wheel_${wx}_${wz}`));
          }
        }
        root.add(this._box(dark, { x: 0.7, y: 0.5, z: 0.8 }, { x: -0.55, y: 0.75, z: 0 }, 'cart_tool_chest', true));
        root.add(this._cylinder(dark, 0.05, 0.05, 0.9, { x: 0.7, y: 0.9, z: 0.35 }, { x: 0, y: 0, z: 0 }, 'cart_spotlight_pole'));
        root.add(this._box(glow, { x: 0.22, y: 0.22, z: 0.18 }, { x: 0.7, y: 1.35, z: 0.35 }, 'cart_spotlight_head'));
      } else if (normalizedType === 'fiorina_ore_pulverizer_jaw') {
        // Chantier 360 : Fiorina 161 Underground Ore Pulverizer Jaw (Alien 3)
        const rust = this._material('rust', { color: 0x57534e, roughness: 0.85, metalness: 0.45 });
        const dark = this._material('darkMetal', { color: 0x1c1917, roughness: 0.75, metalness: 0.8 });
        const steel = this._material('steel', { color: 0x78716c, roughness: 0.5, metalness: 0.85 });
        root.add(this._box(rust, { x: 1.8, y: 1.7, z: 1.5 }, { x: 0, y: 0.85, z: 0 }, 'pulverizer_housing', true));
        root.add(this._cylinder(steel, 0.65, 0.65, 0.25, { x: -0.98, y: 1.1, z: 0 }, { x: 0, y: 0, z: Math.PI * 0.5 }, 'pulverizer_flywheel', true));
        root.add(this._box(dark, { x: 1.1, y: 0.8, z: 0.25 }, { x: 0, y: 1.1, z: 0.45 }, 'pulverizer_jaw_plate'));
        root.add(this._box(rust, { x: 1.4, y: 0.5, z: 1.1 }, { x: 0, y: 1.85, z: 0 }, 'pulverizer_hopper_funnel', true));
      } else if (normalizedType === 'nostromo_turbulated_heat_exchanger') {
        // Chantier 361 : Nostromo Turbulated Heat Exchanger Coil (Alien 1979)
        const copper = this._material('copper', { color: 0xb45309, roughness: 0.35, metalness: 0.9 });
        const dark = this._material('darkMetal', { color: 0x1e293b, roughness: 0.65, metalness: 0.85 });
        const amber = this._material('emissiveAmber', { color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 2.0 });
        root.add(this._box(dark, { x: 2.4, y: 1.8, z: 1.2 }, { x: 0, y: 0.9, z: 0 }, 'heat_exchanger_shroud', true));
        for (let tube = 0; tube < 5; tube++) {
          root.add(this._cylinder(copper, 0.08, 0.08, 2.2, { x: 0, y: 0.35 + tube * 0.3, z: 0.65 }, { x: 0, y: 0, z: Math.PI * 0.5 }, `exchanger_turbulated_tube_${tube}`));
        }
        root.add(this._box(amber, { x: 0.3, y: 0.2, z: 0.08 }, { x: 0.8, y: 1.4, z: 0.65 }, 'exchanger_thermal_meter'));
      } else if (normalizedType === 'hadley_overhead_crane_trolley') {
        // Chantier 362 : Hadley's Hope Overhead Traveling Crane Trolley (Aliens 1986)
        const yellow = this._material('industrial', { color: 0xfbbf24, roughness: 0.45, metalness: 0.7 });
        const dark = this._material('darkMetal', { color: 0x18181b, roughness: 0.7, metalness: 0.85 });
        const steel = this._material('steel', { color: 0x71717a, roughness: 0.35, metalness: 0.9 });
        root.add(this._box(yellow, { x: 2.6, y: 0.4, z: 1.8 }, { x: 0, y: 2.2, z: 0 }, 'crane_trolley_chassis', true));
        root.add(this._cylinder(steel, 0.4, 0.4, 0.8, { x: 0, y: 1.6, z: 0 }, { x: 0, y: 0, z: 0 }, 'crane_hoist_drum', true));
        root.add(this._cylinder(dark, 0.04, 0.04, 1.2, { x: 0, y: 0.9, z: 0 }, { x: 0, y: 0, z: 0 }, 'crane_cable'));
        root.add(this._torus(yellow, 0.22, 0.06, { x: 0, y: 0.3, z: 0 }, { x: 0, y: 0, z: 0 }, 'crane_forged_hook'));
      } else if (normalizedType === 'fiorina_slag_preheater_stand') {
        // Chantier 363 : Fiorina 161 Slag Ladle Preheater Burner Stand (Alien 3)
        const rust = this._material('rust', { color: 0x57534e, roughness: 0.85, metalness: 0.45 });
        const flame = this._material('emissiveRed', { color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 3.2 });
        const dark = this._material('darkMetal', { color: 0x1c1917, roughness: 0.75, metalness: 0.8 });
        root.add(this._cylinder(rust, 0.6, 0.75, 1.6, { x: 0, y: 0.8, z: 0 }, { x: 0, y: 0, z: 0 }, 'preheater_burner_cowl', true));
        root.add(this._cylinder(flame, 0.25, 0.05, 0.6, { x: 0, y: 1.8, z: 0 }, { x: 0, y: 0, z: 0 }, 'preheater_pilot_core'));
        root.add(this._tube(dark, [{ x: 0, y: 0.3, z: -0.6 }, { x: 0, y: 0.3, z: -1.1 }, { x: 0.6, y: 0.1, z: -1.3 }], 0.05, 'preheater_gas_line', 10, 6));
      } else if (normalizedType === 'auriga_cryo_freon_cascade_tank') {
        // Chantier 364 : USM Auriga Cryo-Freon Storage Cascade Tank (Alien Resurrection)
        const cyan = this._material('emissiveCyan', { color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 2.2 });
        const steel = this._material('steel', { color: 0x94a3b8, roughness: 0.3, metalness: 0.9 });
        const dark = this._material('darkMetal', { color: 0x0f172a, roughness: 0.65, metalness: 0.85 });
        root.add(this._box(dark, { x: 2.4, y: 0.35, z: 1.4 }, { x: 0, y: 0.18, z: 0 }, 'cascade_tank_cradle', true));
        root.add(this._cylinder(steel, 0.55, 0.55, 2.2, { x: 0, y: 0.9, z: 0 }, { x: 0, y: 0, z: Math.PI * 0.5 }, 'cascade_freon_tank', true));
        root.add(this._cylinder(cyan, 0.04, 0.04, 1.6, { x: 0, y: 0.9, z: 0.58 }, { x: 0, y: 0, z: Math.PI * 0.5 }, 'cascade_level_gauge'));
      } else if (normalizedType === 'romulus_debris_deflector_grille') {
        // Chantier 365 : Renaissance Station Centrifuge Debris Deflector Grille (Alien: Romulus)
        const frame = this._material('industrial', { color: 0x334155, roughness: 0.5, metalness: 0.8 });
        const blade = this._material('steel', { color: 0x64748b, roughness: 0.35, metalness: 0.9 });
        root.add(this._box(frame, { x: 2.8, y: 2.2, z: 0.25 }, { x: 0, y: 1.1, z: 0 }, 'deflector_outer_frame', true));
        for (let l = 0; l < 6; l++) {
          const louver = this._box(blade, { x: 2.5, y: 0.08, z: 0.35 }, { x: 0, y: 0.35 + l * 0.3, z: 0 }, `deflector_louver_${l}`, true);
          louver.rotation.x = 0.45;
          root.add(louver);
        }
      } else if (normalizedType === 'sevastopol_synthetic_qa_gantry') {
        // Chantier 366 : Sevastopol Synthetic Quality Assurance Gantry (Alien: Isolation)
        const arch = this._material('industrial', { color: 0x475569, roughness: 0.5, metalness: 0.75 });
        const purple = this._material('emissiveViolet', { color: 0xc084fc, emissive: 0xa855f7, emissiveIntensity: 2.4 });
        root.add(this._box(arch, { x: 0.25, y: 2.6, z: 0.4 }, { x: -0.9, y: 1.3, z: 0 }, 'qa_arch_l', true));
        root.add(this._box(arch, { x: 0.25, y: 2.6, z: 0.4 }, { x: 0.9, y: 1.3, z: 0 }, 'qa_arch_r', true));
        root.add(this._box(arch, { x: 2.05, y: 0.35, z: 0.4 }, { x: 0, y: 2.5, z: 0 }, 'qa_arch_top', true));
        root.add(this._cylinder(purple, 0.05, 0.05, 1.8, { x: 0, y: 2.3, z: 0 }, { x: 0, y: 0, z: Math.PI * 0.5 }, 'qa_scan_emitter'));
      } else if (normalizedType === 'hadley_sump_scum_skimmer') {
        // Chantier 367 : Hadley's Hope Main Sublevel Sump Scum Skimmer (Aliens 1986)
        const dark = this._material('darkMetal', { color: 0x1e293b, roughness: 0.7, metalness: 0.85 });
        const drum = this._material('rust', { color: 0x475569, roughness: 0.6, metalness: 0.6 });
        const scum = this._material('acidSlurry', { color: 0x10b981, roughness: 0.2, metalness: 0.1 });
        root.add(this._box(dark, { x: 2.2, y: 0.8, z: 1.5 }, { x: 0, y: 0.4, z: 0 }, 'skimmer_trough', true));
        root.add(this._cylinder(drum, 0.45, 0.45, 1.8, { x: 0, y: 0.75, z: 0 }, { x: 0, y: 0, z: Math.PI * 0.5 }, 'skimmer_rotating_drum', true));
        root.add(this._box(scum, { x: 1.9, y: 0.08, z: 1.2 }, { x: 0, y: 0.65, z: 0 }, 'skimmer_scum_fluid'));
      } else if (normalizedType === 'uscm_m20_claymore_pod') {
        // Chantier 368 : USCM M20 Claymore Mine Dispenser Pod (Aliens: Dark Descent)
        const green = this._material('oliveDrab', { color: 0x3f4e38, roughness: 0.65, metalness: 0.55 });
        const dark = this._material('darkMetal', { color: 0x1c1917, roughness: 0.7, metalness: 0.85 });
        const redLed = this._material('emissiveRed', { color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 2.5 });
        root.add(this._cylinder(dark, 0.04, 0.04, 0.85, { x: 0, y: 0.42, z: 0 }, { x: 0, y: 0, z: 0 }, 'claymore_tripod_stem'));
        root.add(this._box(green, { x: 0.95, y: 0.45, z: 0.22 }, { x: 0, y: 0.85, z: 0 }, 'claymore_mine_pod_body', true));
        root.add(this._ellipsoid(redLed, { x: 0.05, y: 0.05, z: 0.03 }, { x: 0, y: 0.95, z: 0.12 }, 'claymore_sensor_lens'));
      } else if (normalizedType === 'sevastopol_baggage_conveyor_track') {
        // Chantier 369 : Sevastopol Baggage Carousel Conveyor Track (Alien: Isolation)
        const steel = this._material('steel', { color: 0x94a3b8, roughness: 0.35, metalness: 0.9 });
        const dark = this._material('darkMetal', { color: 0x334155, roughness: 0.6, metalness: 0.8 });
        const yellow = this._material('industrial', { color: 0xeab308, roughness: 0.4, metalness: 0.7 });
        root.add(this._box(steel, { x: 3.2, y: 0.4, z: 1.2 }, { x: 0, y: 0.2, z: 0 }, 'conveyor_track_slats', true));
        root.add(this._box(yellow, { x: 3.24, y: 0.12, z: 0.08 }, { x: 0, y: 0.45, z: 0.6 }, 'conveyor_guide_rail_f'));
        root.add(this._box(yellow, { x: 3.24, y: 0.12, z: 0.08 }, { x: 0, y: 0.45, z: -0.6 }, 'conveyor_guide_rail_b'));
        root.add(this._cylinder(dark, 0.22, 0.22, 0.3, { x: 1.5, y: 0.3, z: 0 }, { x: Math.PI * 0.5, y: 0, z: 0 }, 'conveyor_drive_roller'));
      } else if (normalizedType === 'fiorina_blast_air_preheat_stove') {
        // Chantier 370 : Fiorina 161 Furnace Blast Air Preheating Stove Pylon (Alien 3)
        const brick = this._material('rust', { color: 0x7c2d12, roughness: 0.9, metalness: 0.35 });
        const dark = this._material('darkMetal', { color: 0x1c1917, roughness: 0.7, metalness: 0.85 });
        const glow = this._material('emissiveRed', { color: 0xea580c, emissive: 0xc2410c, emissiveIntensity: 2.2 });
        root.add(this._cylinder(brick, 1.0, 1.1, 3.2, { x: 0, y: 1.6, z: 0 }, { x: 0, y: 0, z: 0 }, 'blast_stove_tower', true));
        root.add(this._cylinder(dark, 0.25, 0.25, 1.6, { x: 0.8, y: 2.4, z: 0 }, { x: 0, y: 0, z: Math.PI * 0.5 }, 'bustle_air_pipe'));
        root.add(this._torus(glow, 1.05, 0.08, { x: 0, y: 1.2, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }, 'blast_stove_burner_ring'));
      } else {
        root.add(this._box(metal, { x: 1.9, y: 1.9, z: 1.9 }, { x: 0, y: 0.95, z: 0 }, 'crate_body', true));
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._box(dark, { x: 0.18, y: 2.02, z: 2.04 }, { x: side * 0.82, y: 0.96, z: 0 }, `crate_vertical_brace_${side}`, true));
          root.add(this._box(dark, { x: 2.04, y: 0.18, z: 2.04 }, { x: 0, y: 0.96 + side * 0.78, z: 0 }, `crate_horizontal_brace_${side}`, true));
        }
        root.add(this._box(hazard, { x: 0.72, y: 0.3, z: 0.05 }, { x: 0, y: 1.08, z: 0.98 }, 'crate_manifest_display'));
        for (let cornerX = -1; cornerX <= 1; cornerX += 2) {
          for (let cornerY = -1; cornerY <= 1; cornerY += 2) {
            this._addBolt(root, dark, { x: cornerX * 0.72, y: 0.96 + cornerY * 0.7, z: 1.02 }, 0.075, `crate_fastener_${cornerX}_${cornerY}`);
          }
        }
      }

      if (normalizedType === 'console') {
        // A display is readable as instrumentation instead of a solid green slab.
        for (let row = 0; row < 4; row++) {
          const line = this._box(dark,
            { x: 0.45 + (row % 3) * 0.18, y: 0.025, z: 0.012 },
            { x: -0.17, y: 1.43 + row * 0.12, z: 0.38 - row * 0.04 },
            `display_telemetry_${row}`);
          line.rotation.x = -0.35;
          root.add(line);
        }
      } else if (normalizedType === 'door') {
        for (const side of [-1, 1]) {
          root.add(this._box(dark, { x: 1.38, y: 0.055, z: 0.04 },
            { x: side * 0.87, y: 1.14, z: 0.236 }, `door_panel_seam_${side}`));
          root.add(this._box(hazard, { x: 0.54, y: 0.075, z: 0.04 },
            { x: side * 0.97, y: 3.64, z: 0.236 }, `door_clearance_marker_${side}`));
        }
      }

      const usedBaseMaterials = new Set();
      root.traverse((object) => {
        if (!object.material) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => usedBaseMaterials.add(material));
      });
      for (const material of [metal, dark, hazard, screen, warning]) {
        if (!usedBaseMaterials.has(material)) material.dispose();
      }

      const finalized = this._finalize(root, {
        modelType: 'industrialProp',
        subtype: normalizedType,
        localGroundPlaneY: 0
      });
      this.placeOnGround(finalized, 0);
      return finalized;
    }

    // -------------------------------------------------------------------------
    // Chantier 13 : Le Chat Jonesy & Faune de Bord (Alien 1979)
    // -------------------------------------------------------------------------
    createCat() {
      const T = this._three();
      const root = new T.Group();
      root.name = 'ship_cat_jonesy';
      root.userData.modelType = 'cat';
      const fur = this._material('organicAmber', { color: 0xd97706, roughness: 0.8, metalness: 0.05 });
      const furWhite = this._material('bone', { color: 0xfef3c7, roughness: 0.85, metalness: 0.02 });
      const eye = this._material('emissiveGreen', { emissiveIntensity: 1.2 });
      const nose = this._material('emissiveRed', { color: 0xf43f5e, emissiveIntensity: 0.2 });

      // Corps félin souple roux tigré
      root.add(this._ellipsoid(fur, { x: 0.18, y: 0.16, z: 0.38 }, { x: 0, y: 0.22, z: 0 }, 'cat_torso', 14));
      // Ventre blanc
      root.add(this._ellipsoid(furWhite, { x: 0.14, y: 0.08, z: 0.28 }, { x: 0, y: 0.14, z: 0 }, 'cat_belly', 12));
      // Tête
      root.add(this._ellipsoid(fur, { x: 0.14, y: 0.13, z: 0.14 }, { x: 0, y: 0.32, z: 0.32 }, 'cat_head', 14));
      // Museau blanc
      root.add(this._ellipsoid(furWhite, { x: 0.09, y: 0.06, z: 0.08 }, { x: 0, y: 0.28, z: 0.44 }, 'cat_muzzle', 10));
      root.add(this._box(nose, { x: 0.03, y: 0.02, z: 0.02 }, { x: 0, y: 0.31, z: 0.5 }, 'cat_nose'));
      // Yeux verts félins
      for (let side = -1; side <= 1; side += 2) {
        root.add(this._ellipsoid(eye, { x: 0.025, y: 0.025, z: 0.02 }, { x: side * 0.065, y: 0.34, z: 0.42 }, `cat_eye_${side}`, 8));
        const ear = this._box(fur, { x: 0.04, y: 0.08, z: 0.04 }, { x: side * 0.08, y: 0.44, z: 0.28 }, `cat_ear_${side}`);
        ear.rotation.z = side * -0.25;
        root.add(ear);
      }
      // 4 pattes félines
      for (let i = 0; i < 4; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const front = i < 2;
        const leg = this._box(furWhite, { x: 0.05, y: 0.18, z: 0.06 }, { x: side * 0.11, y: 0.09, z: front ? 0.22 : -0.22 }, `cat_paw_${i}`);
        root.add(leg);
      }
      // Queue dressée avec bout incurvé
      const tail = this._box(fur, { x: 0.035, y: 0.32, z: 0.035 }, { x: 0, y: 0.36, z: -0.42 }, 'cat_tail');
      tail.rotation.x = 0.35;
      root.add(tail);

      const finalized = this._finalize(root, { modelType: 'cat', height: 0.5 });
      this.placeOnGround(finalized, 0);
      return finalized;
    }

    // -------------------------------------------------------------------------
    // Chantier 22 : Le Casque d'Ingénieur / Space Jockey & Relique Fossilisée (Alien 1979)
    // -------------------------------------------------------------------------
    createSpaceJockeyRelic() {
      const T = this._three();
      const root = new T.Group();
      root.name = 'space_jockey_derelict_relic';
      root.userData.modelType = 'spaceJockey';

      const petrifiedBone = this._material('bone', { color: 0x948e85, roughness: 0.72, metalness: 0.12 });
      const darkBiomech = this._material('darkMetal', { color: 0x1e1c24, roughness: 0.45, metalness: 0.7 });
      const petrifiedChitin = this._material('chitin', { color: 0x27242d, roughness: 0.38, metalness: 0.42 });
      const bioAmber = this._material('emissiveAmber', { color: 0xd97706, emissiveIntensity: 0.6 });

      // Plateforme circulaire biradiale fossilisée
      root.add(this._segment(darkBiomech, new T.Vector3(0, 0, 0), new T.Vector3(0, 0.6, 0), 3.2, 3.4, 'relic_dais', 32));
      for (let r = 0; r < 8; r++) {
        const radAngle = (r / 8) * Math.PI * 2;
        root.add(this._box(petrifiedChitin, { x: 0.32, y: 0.45, z: 2.2 }, { x: Math.cos(radAngle) * 1.8, y: 0.5, z: Math.sin(radAngle) * 1.8 }, `radial_strut_${r}`));
      }

      // Siège de pilotage / Trône télescopique incliné à 35 degrés
      const chairGroup = new T.Group();
      chairGroup.name = 'pilot_chair_assembly';
      chairGroup.rotation.x = -0.38;
      chairGroup.position.set(0, 0.6, 0);

      // Dossier biomécanique incurvé avec cannelures vertébrales
      chairGroup.add(this._box(darkBiomech, { x: 2.2, y: 3.4, z: 0.8 }, { x: 0, y: 1.7, z: -0.4 }, 'chair_backrest', true));
      for (let v = 0; v < 6; v++) {
        chairGroup.add(this._ring(petrifiedChitin, 0.9, 0.08, { x: 0, y: 0.6 + v * 0.48, z: -0.25 }, { x: 0, y: 0, z: 0 }, `chair_vertebra_${v}`));
      }

      // Corps fossilisé de l'Ingénieur / Space Jockey géant
      chairGroup.add(this._ellipsoid(petrifiedBone, { x: 0.95, y: 1.35, z: 0.75 }, { x: 0, y: 1.5, z: 0.1 }, 'engineer_torso', 24));

      // Cage thoracique pétrifiée avec sternum éclaté vers l'extérieur (Chestburst 1:1 canon)
      for (let rib = 0; rib < 5; rib++) {
        for (let side = -1; side <= 1; side += 2) {
          const ribMesh = this._coneAlong(
            petrifiedBone,
            { x: side * 0.45, y: 1.1 + rib * 0.28, z: 0.4 },
            { x: side * 0.6, y: 0.15, z: 0.75 },
            0.11,
            0.65,
            `shattered_rib_${side}_${rib}`,
            14
          );
          chairGroup.add(ribMesh);
        }
      }
      chairGroup.add(this._ellipsoid(darkBiomech, { x: 0.42, y: 0.65, z: 0.45 }, { x: 0, y: 1.55, z: 0.42 }, 'ruptured_chest_void', 16));

      // Tête casquée d'Ingénieur / Space Jockey
      chairGroup.add(this._ellipsoid(petrifiedBone, { x: 0.58, y: 0.72, z: 0.85 }, { x: 0, y: 2.85, z: 0.2 }, 'space_jockey_helmet', 24));
      chairGroup.add(this._tube(
        petrifiedBone,
        [
          { x: 0, y: 2.65, z: 0.75 },
          { x: 0, y: 2.2, z: 1.05 },
          { x: 0, y: 1.85, z: 0.85 },
          { x: 0, y: 1.6, z: 0.5 }
        ],
        0.18,
        'elephantine_breathing_trunk',
        32,
        14
      ));

      for (let armSide = -1; armSide <= 1; armSide += 2) {
        chairGroup.add(this._segment(
          petrifiedBone,
          new T.Vector3(armSide * 0.85, 2.1, 0.1),
          new T.Vector3(armSide * 0.95, 1.2, 0.7),
          0.2,
          0.16,
          `engineer_arm_${armSide}`,
          16
        ));
      }

      chairGroup.add(this._segment(
        darkBiomech,
        new T.Vector3(0, 1.2, 0.6),
        new T.Vector3(0, 3.8, 2.6),
        0.35,
        0.22,
        'stellar_telescope_barrel',
        24
      ));
      chairGroup.add(this._ring(bioAmber, 0.4, 0.06, { x: 0, y: 3.8, z: 2.6 }, { x: 0.5, y: 0, z: 0 }, 'telescope_lens_optic'));

      root.add(chairGroup);

      const finalized = this._finalize(root, { modelType: 'spaceJockey', height: 4.5 });
      this.placeOnGround(finalized, 0);
      return finalized;
    }

    // -------------------------------------------------------------------------
    // Chantier 23 : Tourelles Automatiques UA 571-C Sentry Guns (Aliens 1986)
    // -------------------------------------------------------------------------
    createUA571CTurret() {
      const T = this._three();
      const root = new T.Group();
      root.name = 'ua571c_sentry_turret';
      root.userData.modelType = 'sentryTurret';

      const gunMetal = this._material('darkMetal', { color: 0x1f2937, roughness: 0.32, metalness: 0.88 });
      const oliveDrab = this._material('industrial', { color: 0x3f4a3c, roughness: 0.45, metalness: 0.65 });
      const ammoDrumMat = this._material('industrial', { color: 0x27272a, roughness: 0.5, metalness: 0.75 });
      const laserSensor = this._material('emissiveRed', { color: 0xef4444, emissiveIntensity: 2.4 });
      const digitalCounter = this._material('emissiveGreen', { color: 0x22c55e, emissiveIntensity: 2.0 });

      // Trépied pliant d'ancrage lourd au sol
      root.add(this._ellipsoid(gunMetal, { x: 0.28, y: 0.15, z: 0.28 }, { x: 0, y: 0.42, z: 0 }, 'tripod_hub', 16));
      for (let leg = 0; leg < 3; leg++) {
        const legAngle = (leg / 3) * Math.PI * 2;
        const groundX = Math.cos(legAngle) * 0.95;
        const groundZ = Math.sin(legAngle) * 0.95;
        root.add(this._segment(
          gunMetal,
          new T.Vector3(0, 0.42, 0),
          new T.Vector3(groundX, 0.05, groundZ),
          0.065,
          0.05,
          `tripod_leg_${leg}`,
          14
        ));
        root.add(this._box(gunMetal, { x: 0.18, y: 0.08, z: 0.18 }, { x: groundX, y: 0.04, z: groundZ }, `tripod_foot_${leg}`));
      }

      root.add(this._segment(gunMetal, new T.Vector3(0, 0.42, 0), new T.Vector3(0, 0.95, 0), 0.11, 0.11, 'elevation_post', 18));

      const swivelHead = new T.Group();
      swivelHead.name = 'turret_swivel_head';
      swivelHead.position.set(0, 0.95, 0);

      swivelHead.add(this._box(oliveDrab, { x: 0.52, y: 0.38, z: 0.85 }, { x: 0, y: 0.16, z: -0.1 }, 'breech_housing', true));

      for (let barrel = -1; barrel <= 1; barrel += 2) {
        swivelHead.add(this._segment(
          gunMetal,
          new T.Vector3(barrel * 0.14, 0.16, 0.3),
          new T.Vector3(barrel * 0.14, 0.16, 1.25),
          0.045,
          0.04,
          `pulse_barrel_${barrel}`,
          16
        ));
        swivelHead.add(this._ring(gunMetal, 0.06, 0.015, { x: barrel * 0.14, y: 0.16, z: 1.22 }, { x: 0, y: 0, z: 0 }, `muzzle_brake_${barrel}`));
      }

      swivelHead.add(this._ellipsoid(laserSensor, { x: 0.08, y: 0.08, z: 0.12 }, { x: 0, y: 0.34, z: 0.28 }, 'thermal_sensor_lens', 16));
      swivelHead.add(this._box(digitalCounter, { x: 0.18, y: 0.09, z: 0.03 }, { x: 0.25, y: 0.28, z: -0.2 }, 'digital_ammo_display'));

      swivelHead.add(this._segment(
        ammoDrumMat,
        new T.Vector3(0, -0.18, -0.1),
        new T.Vector3(0, -0.18, 0.32),
        0.28,
        0.28,
        'ammo_drum_500rd',
        22
      ));

      root.add(swivelHead);

      const finalized = this._finalize(root, { modelType: 'sentryTurret', height: 1.4 });
      this.placeOnGround(finalized, 0);
      return finalized;
    }

    // -------------------------------------------------------------------------
    // Chantier 36 : Phénotype Hybride Predalien (Canon AvP)
    // -------------------------------------------------------------------------
    createPredalien() {
      return this._createUprightAdult('predalien');
    }

    // -------------------------------------------------------------------------
    // Chantier 33 : Caméra de Sécurité Motorisée CRT Seegson / Weyland-Yutani
    // -------------------------------------------------------------------------
    createSecurityCamera() {
      return this.createIndustrialProp('security_camera');
    }

    // -------------------------------------------------------------------------
    // Chantier 35 : Piège au Sol à Harpons Pneumatiques & Filet Électrifié
    // -------------------------------------------------------------------------
    createTripwireTrap() {
      return this.createIndustrialProp('tripwire_trap');
    }

    // -------------------------------------------------------------------------
    // Chantier 33 & 40 : Terminal Mural Seegson / Weyland-Yutani
    // -------------------------------------------------------------------------
    createSeegsonTerminal() {
      return this.createIndustrialProp('seegson_terminal');
    }

    // -------------------------------------------------------------------------
    // Chantier 39 : Cocon Suspendu aux Poutrelles du Plafond (Aliens 1986)
    // -------------------------------------------------------------------------
    createCeilingCocoon() {
      return this.createIndustrialProp('ceiling_cocoon');
    }

    // -------------------------------------------------------------------------
    // Chantier 41 : Exosquelette Caterpillar P-5000 Power Loader (Aliens 1986)
    // -------------------------------------------------------------------------
    createPowerLoader() {
      return this._createExosuit();
    }

    // -------------------------------------------------------------------------
    // Chantier 44 : Phénotype Deacon / Proto-Xénomorphe (Prometheus 2012)
    // -------------------------------------------------------------------------
    createDeacon() {
      return this._createUprightAdult('deacon');
    }

    // -------------------------------------------------------------------------
    // Chantier 47 : Demi-corps de Synthétique Décapité Rampant (Aliens 1986)
    // -------------------------------------------------------------------------
    createBisectedAndroid() {
      return this.createIndustrialProp('bisected_android');
    }

    // -------------------------------------------------------------------------
    // Chantier 42 : Sas de Dépressurisation d'Urgence (Alien 1979 / Romulus)
    // -------------------------------------------------------------------------
    createDepressurizationAirlock() {
      return this.createIndustrialProp('airlock_decompression');
    }

    // -------------------------------------------------------------------------
    // Chantier 43 : Sas Décontaminant avec Douches Chimiques (Alien 3 / Isolation)
    // -------------------------------------------------------------------------
    createDeconShowerArch() {
      return this.createIndustrialProp('decon_shower');
    }

    // -------------------------------------------------------------------------
    // Chantier 49 : Grille d'Éventration de Plancher Technique (Aliens 1986)
    // -------------------------------------------------------------------------
    createSubfloorGrate() {
      return this.createIndustrialProp('subfloor_grate');
    }

    // -------------------------------------------------------------------------
    // Chantier 51 : Phénotype Neomorphe (Alien: Covenant 2017)
    // -------------------------------------------------------------------------
    createNeomorph() {
      return this._createUprightAdult('neomorph');
    }

    // -------------------------------------------------------------------------
    // Chantier 51 : Sac de Spores Fongiques Pathogènes (Alien: Covenant 2017)
    // -------------------------------------------------------------------------
    createSporePod() {
      return this.createIndustrialProp('spore_pod');
    }

    // -------------------------------------------------------------------------
    // Chantier 54 : Conduits de Vapeur & Vannes de Décharge (Alien 1979 / Aliens)
    // -------------------------------------------------------------------------
    createSteamPipeSystem() {
      return this.createIndustrialProp('steam_pipe_valve');
    }

    // -------------------------------------------------------------------------
    // Chantier 55 : Navette de Sauvetage Narcissus de classe Nostromo (Alien 1979)
    // -------------------------------------------------------------------------
    createNarcissusShuttle() {
      return this.createIndustrialProp('narcissus_shuttle');
    }

    // -------------------------------------------------------------------------
    // Chantier 60 : Nappe de Brume Cryogénique au Ras du Sol (Alien 1979)
    // -------------------------------------------------------------------------
    createGroundCryoMist() {
      return this.createIndustrialProp('ground_cryo_mist');
    }

    // -------------------------------------------------------------------------
    // Chantier 57 : Grenade à Impulsion Magnétique Polarisée (Aliens: Dark Descent)
    // -------------------------------------------------------------------------
    createEMPGrenade() {
      return this.createIndustrialProp('emp_grenade_projectile');
    }

    // -------------------------------------------------------------------------
    // Chantier 58 : Porte Hydraulique Scellée par Barres de Renfort (Alien: Isolation)
    // -------------------------------------------------------------------------
    createSealedHydraulicDoor() {
      return this.createIndustrialProp('sealed_hydraulic_door');
    }

    // -------------------------------------------------------------------------
    // Chantier 61 : Phénotype "Alpha Xenomorph" (Marvel Comics 2021: Alien: Bloodlines)
    // -------------------------------------------------------------------------
    createAlpha() {
      return this._createUprightAdult('alpha');
    }

    // -------------------------------------------------------------------------
    // Chantier 62 : Nuée de Xénomorphes Nains "Swarmers" (Marvel Comics 2022: Alien: Icarus)
    // -------------------------------------------------------------------------
    createSwarmerPack() {
      return this.createIndustrialProp('swarmer_pack');
    }

    // -------------------------------------------------------------------------
    // Chantier 63 : Synthétique d'Élite "Steel Team" Weyland-Yutani (Marvel Comics)
    // -------------------------------------------------------------------------
    createSteelTeamSynth() {
      return this._createHumanFigure('weyland_steel_team_synth');
    }

    // -------------------------------------------------------------------------
    // Chantier 68 : Baril de Carburant Napalm USCM (Aliens / Isolation)
    // -------------------------------------------------------------------------
    createNapalmBarrel() {
      return this.createIndustrialProp('napalm_barrel');
    }

    // -------------------------------------------------------------------------
    // Chantier 66 : Cuve de Confinement Alpha & Sas Bio-Sécurité (Marvel Comics)
    // -------------------------------------------------------------------------
    createAlphaContainmentCell() {
      return this.createIndustrialProp('alpha_containment_cell');
    }

    // -------------------------------------------------------------------------
    // Chantier 64 : Expansion Vivante de la Toile de Ruche "Hive Creep" (Marvel Comics)
    // -------------------------------------------------------------------------
    createHiveCreepPatch() {
      return this.createIndustrialProp('hive_creep_patch');
    }

    // -------------------------------------------------------------------------
    // Chantier 73 : Molosse Cybernétique de Reconnaissance Weyland-Yutani (Dark Descent / Alien 3)
    // -------------------------------------------------------------------------
    createCyberHound() {
      return this._createServiceAnimal('weyland_cyber_hound');
    }

    // -------------------------------------------------------------------------
    // Chantier 72 : Baie de Fret & Déambulateur de Fret "Powerloader Rail Gantry" (Aliens 1986)
    // -------------------------------------------------------------------------
    createGantryContainer() {
      return this.createIndustrialProp('gantry_container');
    }

    // -------------------------------------------------------------------------
    // Chantier 74 : Réseau de Fluide Réfrigérant & Rupture de Conduites de Fréon (Alien 1979 / Romulus)
    // -------------------------------------------------------------------------
    createFreonPipe() {
      return this.createIndustrialProp('freon_pipe');
    }

    // -------------------------------------------------------------------------
    // Chantier 76 : Pièges Mines Antipersonnel Claymore M18A1 à Câble USCM (Aliens 1986)
    // -------------------------------------------------------------------------
    createTripwireClaymore() {
      return this.createIndustrialProp('tripwire_claymore');
    }

    // -------------------------------------------------------------------------
    // Chantier 78 : Flares de Magnésium Luminescents USCM & Feux de Détresse (Aliens 1986)
    // -------------------------------------------------------------------------
    createMagnesiumFlare() {
      return this.createIndustrialProp('magnesium_flare');
    }

    // -------------------------------------------------------------------------
    // Chantier 79 : Trémie de Broyage & Incinérateur de Déchets Fiorina 161 (Alien 3)
    // -------------------------------------------------------------------------
    createGarbageChute() {
      return this.createIndustrialProp('garbage_chute');
    }

    // -------------------------------------------------------------------------
    // Chantier 81 : Phénotype Boiler Kamikaze Acide Thermique (Colonial Marines)
    // -------------------------------------------------------------------------
    createBoiler() {
      return this._createUprightAdult('boiler');
    }

    // -------------------------------------------------------------------------
    // Chantier 86 : Phénotype Carrier Matrice Porteuse de Facehuggers (AvP: Extinction)
    // -------------------------------------------------------------------------
    createCarrier() {
      return this._createUprightAdult('carrier');
    }

    // -------------------------------------------------------------------------
    // Chantier 82 : Tourelles Automatiques UA 571-D Flamer (Aliens Director's Cut)
    // -------------------------------------------------------------------------
    createFlamerSentry() {
      return this.createIndustrialProp('flamer_sentry');
    }

    // -------------------------------------------------------------------------
    // Chantier 84 : Réservoirs Cryogéniques d'Azote Liquide LN2 (Alien: Romulus)
    // -------------------------------------------------------------------------
    createLiquidNitrogenTank() {
      return this.createIndustrialProp('liquid_nitrogen_tank');
    }

    // -------------------------------------------------------------------------
    // Chantier 85 : Ascenseur Monte-Charge Industriel Hydraulique (Aliens / Alien 3)
    // -------------------------------------------------------------------------
    createFreightElevator() {
      return this.createIndustrialProp('freight_elevator');
    }

    // -------------------------------------------------------------------------
    // Chantier 88 : Puits de Fonderie Fiorina 161 & Métal en Fusion (Alien 3)
    // -------------------------------------------------------------------------
    createFoundryCrucible() {
      return this.createIndustrialProp('foundry_crucible');
    }

    // -------------------------------------------------------------------------
    // Chantier 90 : Banc de Découpe Laser Industriel Orbital USCM (Aliens / Romulus)
    // -------------------------------------------------------------------------
    createIndustrialLaserCutter() {
      return this.createIndustrialProp('industrial_laser_cutter');
    }

    // -------------------------------------------------------------------------
    // Chantier 87 : Drones Flottants Skimmer Scan-Drones Weyland-Yutani (Dark Descent)
    // -------------------------------------------------------------------------
    createSkimmerScanDrone() {
      return this.createIndustrialProp('skimmer_scan_drone');
    }

    // -------------------------------------------------------------------------
    // Chantier 83 : Unité de Neutralisation Chimique USCM Hazmat (Fireteam Elite)
    // -------------------------------------------------------------------------
    createHazmatTech() {
      return this._createHumanFigure('uscm_hazmat_tech');
    }

    // -------------------------------------------------------------------------
    // Chantier 87 : Droniste de Combat Weyland-Yutani (Dark Descent)
    // -------------------------------------------------------------------------
    createDroneOperator() {
      return this._createHumanFigure('weyland_drone_operator');
    }

    // -------------------------------------------------------------------------
    // Chantier 91 : Phénotype "The Newborn / Hybride Humain-Xénomorphe" (Alien: Resurrection)
    // -------------------------------------------------------------------------
    createNewborn() {
      return this._createUprightAdult('newborn');
    }

    // -------------------------------------------------------------------------
    // Chantier 94 : Phénotype "The Raven / Berserker Géant à Blindage Bivalve" (Colonial Marines)
    // -------------------------------------------------------------------------
    createRaven() {
      return this._createUprightAdult('raven');
    }

    // -------------------------------------------------------------------------
    // Chantier 92 : Tireur d'Élite USCM & Fusil Sniper M42A (Aliens / Dark Descent)
    // -------------------------------------------------------------------------
    createSniper() {
      return this._createHumanFigure('uscm_sniper');
    }

    // -------------------------------------------------------------------------
    // Chantier 97 : Équipe d'Intervention Confinement Weyland-Yutani (Alien: Romulus)
    // -------------------------------------------------------------------------
    createContainmentSquad() {
      return this._createHumanFigure('weyland_containment_squad');
    }

    // -------------------------------------------------------------------------
    // Chantier 93 : Sas de Décontamination Nucléaire & Douches Caustiques (Aliens / Isolation)
    // -------------------------------------------------------------------------
    createDecontaminationAirlock() {
      return this.createIndustrialProp('decontamination_airlock');
    }

    // -------------------------------------------------------------------------
    // Chantier 96 : Bras Manipulateur Robotique Industriel & Grue Seegson (Alien: Isolation)
    // -------------------------------------------------------------------------
    createIndustrialCraneArm() {
      return this.createIndustrialProp('industrial_crane_arm');
    }

    // -------------------------------------------------------------------------
    // Chantier 98 : Réacteur à Fusion Surchauffé & Rupture Magnétique (Aliens / Romulus)
    // -------------------------------------------------------------------------
    createFusionReactorCore() {
      return this.createIndustrialProp('fusion_reactor_core');
    }

    // -------------------------------------------------------------------------
    // Chantier 100 : Système M.U.T.H.U.R. 6000 & Interface Terminaux CRT (Alien 1979 / Romulus)
    // -------------------------------------------------------------------------
    createMuthurTerminal() {
      return this.createIndustrialProp('muthur_terminal');
    }

    // -------------------------------------------------------------------------
    // Chantier 101 : Phénotype "The King Xenomorph / Rouge de Charon" (Aliens: Rogue 1993)
    // -------------------------------------------------------------------------
    createKing() {
      return this._createUprightAdult('king');
    }

    // -------------------------------------------------------------------------
    // Chantier 102 : Équipe de Choc USCM "Heavy Flamer Squad" & Lance-Flammes M240A1 (Aliens 1986)
    // -------------------------------------------------------------------------
    createHeavyFlamer() {
      return this.createHuman('uscm_heavy_flamer');
    }

    // -------------------------------------------------------------------------
    // Chantier 103 : Sas de Décharge de Pression & Vannes Hydrauliques de Vapeur (Alien 1979 / Isolation)
    // -------------------------------------------------------------------------
    createHighPressureSteamValve() {
      return this.createIndustrialProp('high_pressure_steam_valve');
    }

    // -------------------------------------------------------------------------
    // Chantier 104 : Phénotype "Bodyburster / Émergence Dorsale Fulgurante" (Alien: Covenant 2017)
    // -------------------------------------------------------------------------
    createBodyburster() {
      return this._createUprightAdult('bodyburster');
    }

    // -------------------------------------------------------------------------
    // Chantier 105 : Mines Magnétiques Détectrices de Mouvement "M38 Claymore Sismique" (Colonial Marines)
    // -------------------------------------------------------------------------
    createSeismicClaymoreMine() {
      return this.createIndustrialProp('seismic_claymore_mine');
    }

    // -------------------------------------------------------------------------
    // Chantier 106 : Système de Barricades Déployables Renforcées en Titane USCM (Aliens: Dark Descent)
    // -------------------------------------------------------------------------
    createTitaniumBarricade() {
      return this.createIndustrialProp('uscm_titanium_barricade');
    }

    // -------------------------------------------------------------------------
    // Chantier 107 : Unité Médicale Robotisée Seegson Medi-Bot (Alien: Isolation)
    // -------------------------------------------------------------------------
    createSeegsonMedibot() {
      return this.createIndustrialProp('seegson_medibot');
    }

    // -------------------------------------------------------------------------
    // Chantier 108 : Réseau Haute Tension & Câbles Pendants Électrifiés (Alien 1979 / Isolation)
    // -------------------------------------------------------------------------
    createHangingHVCables() {
      return this.createIndustrialProp('hanging_hv_cables');
    }

    // -------------------------------------------------------------------------
    // Chantier 110 : Dispositif de Sabotage Central de Gravité Artificielle "Zero-G" (Alien: Romulus 2024)
    // -------------------------------------------------------------------------
    createZeroGGenerator() {
      return this.createIndustrialProp('zero_g_gravity_generator');
    }

    // -------------------------------------------------------------------------
    // Chantier 111 : Phénotype "The Deacon Adult / Apex Archon" (Prometheus Lore Étendu)
    // -------------------------------------------------------------------------
    createDeaconAdult() {
      return this._createUprightAdult('deacon_adult');
    }

    // -------------------------------------------------------------------------
    // Chantier 112 : Chambre de Stase Cryogénique Weyland-Yutani (Alien 1979 / Aliens 1986)
    // -------------------------------------------------------------------------
    createCryoStasisPod() {
      return this.createIndustrialProp('cryo_stasis_pod');
    }

    // -------------------------------------------------------------------------
    // Chantier 113 : Système de Pulvérisation de Phéromones de Ruche (Aliens: Genocide)
    // -------------------------------------------------------------------------
    createHivePheromoneSpore() {
      return this.createIndustrialProp('hive_pheromone_spore');
    }

    // -------------------------------------------------------------------------
    // Chantier 114 : Unité Tactique USCM "Combat Engineer" (Aliens: Dark Descent)
    // -------------------------------------------------------------------------
    createCombatEngineer() {
      return this.createHuman('uscm_combat_engineer');
    }

    // -------------------------------------------------------------------------
    // Chantier 114b : Rouleau de Fil Barbelé Rasoir Électrifié (Aliens: Dark Descent)
    // -------------------------------------------------------------------------
    createBarbedWireSpool() {
      return this.createIndustrialProp('barbed_wire_spool');
    }

    // -------------------------------------------------------------------------
    // Chantier 115 : Composant Diégétique Boîte Noire M7 (Alien: Isolation)
    // -------------------------------------------------------------------------
    createFlightRecorderBox() {
      return this.createIndustrialProp('flight_recorder_box');
    }

    // -------------------------------------------------------------------------
    // Chantier 116 : Mutated Black Goo Facehugger (Alien: Romulus 2024)
    // -------------------------------------------------------------------------
    createBlackGooFacehugger() {
      return this.createFacehugger('black_goo');
    }

    // -------------------------------------------------------------------------
    // Chantier 117 : Sabotage du Générateur Auxiliaire & Blackout (Alien 1979 / Isolation)
    // -------------------------------------------------------------------------
    createAuxiliaryGeneratorBoard() {
      return this.createIndustrialProp('auxiliary_generator_board');
    }

    // -------------------------------------------------------------------------
    // Chantier 118 : Tourelle Laser de Pointage & Faisceau de Marquage (Aliens 1986)
    // -------------------------------------------------------------------------
    createLaserDesignatorTurret() {
      return this.createIndustrialProp('laser_designator_turret');
    }

    // -------------------------------------------------------------------------
    // Chantier 120 : Sas d'Amarrage de Module Orbital de Secours (Alien: Romulus 2024)
    // -------------------------------------------------------------------------
    createOrbitalDockingClamp() {
      return this.createIndustrialProp('orbital_docking_clamp');
    }

    // -------------------------------------------------------------------------
    // Chantier 122 : Chariot Élévateur & Batteries Lithium Weyland (Alien: Isolation)
    // -------------------------------------------------------------------------
    createForkliftVehicle() {
      return this.createIndustrialProp('forklift_vehicle');
    }

    // -------------------------------------------------------------------------
    // Chantier 124 : Système d'Arroseurs Automatiques Incendie (Alien 1979 / Isolation)
    // -------------------------------------------------------------------------
    createCeilingFireSprinkler() {
      return this.createIndustrialProp('ceiling_fire_sprinkler');
    }

    // -------------------------------------------------------------------------
    // Chantier 126 : Phénotype "Chestburster Géant / Queen Burster" (Alien 3)
    // -------------------------------------------------------------------------
    createQueenBurster() {
      const T = this._three();
      const root = new T.Group();
      root.name = 'queen_burster_juvenile';
      const royalFlesh = this._material('chitinWarm', { color: 0x4a1d36, roughness: 0.38 });
      const royalChitin = this._material('chitin', { color: 0x221033, roughness: 0.22, metalness: 0.55 });
      const bone = this._material('bone', { color: 0xc8b6d8 });
      const scale = 1.38;

      // Segments corporels sinueux de serpent royal
      for (let s = 0; s < 9; s++) {
        const t = s / 8;
        const radius = (0.48 - t * 0.22) * scale;
        root.add(this._ellipsoid(
          s % 2 === 0 ? royalFlesh : royalChitin,
          { x: radius, y: radius * 0.78, z: 0.52 * scale },
          { x: 0, y: (0.62 + Math.sin(t * Math.PI) * 0.22) * scale, z: (-0.18 - t * 0.75) * scale },
          `queen_burster_segment_${s}`,
          16
        ));
      }
      // Tête allongée avec ébauche de crête royale trilobée
      root.add(this._ellipsoid(
        royalChitin,
        { x: 0.62 * scale, y: 0.45 * scale, z: 0.95 * scale },
        { x: 0, y: 0.88 * scale, z: 0.78 * scale },
        'queen_burster_head',
        22
      ));
      // Ébauche de crête royale élargie postérieure
      root.add(this._box(
        royalChitin,
        { x: 0.95 * scale, y: 0.22 * scale, z: 0.85 * scale },
        { x: 0, y: 1.05 * scale, z: 0.42 * scale },
        'queen_burster_crest',
        true
      ));
      // Mâchoire acérée
      this._addJaw(root, royalChitin, bone, { x: 0, y: 0.72 * scale, z: 1.35 * scale }, 0.68 * scale, true);

      // 4 Membres antérieurs (2 paires de bras embryonnaires : Reine Canon Aliens)
      for (let side = -1; side <= 1; side += 2) {
        // Paire supérieure principale
        this._addSegmentedLimb(
          root, royalFlesh, royalChitin,
          [
            { x: side * 0.42 * scale, y: 0.75 * scale, z: 0.25 * scale },
            { x: side * 0.75 * scale, y: 0.52 * scale, z: 0.52 * scale },
            { x: side * 0.95 * scale, y: 0.28 * scale, z: 0.75 * scale }
          ],
          [0.12 * scale, 0.085 * scale, 0.055 * scale],
          `queen_burster_main_arm_${side}`,
          { material: royalFlesh, clawMaterial: bone, side, scale: 0.52, rotationY: side < 0 ? -0.35 : 0.35 }
        );
        // Paire secondaire ventrale miniature
        this._addSegmentedLimb(
          root, royalFlesh, royalChitin,
          [
            { x: side * 0.25 * scale, y: 0.58 * scale, z: 0.48 * scale },
            { x: side * 0.42 * scale, y: 0.38 * scale, z: 0.68 * scale }
          ],
          [0.08 * scale, 0.05 * scale],
          `queen_burster_sub_arm_${side}`,
          { material: royalFlesh, clawMaterial: bone, side, scale: 0.36, rotationY: side < 0 ? -0.2 : 0.2 }
        );
      }

      return this._finalize(root, {
        modelType: 'queen_burster',
        caste: 'queen_burster',
        height: 1.65,
        animationJoints: ['queen_burster_head', 'queen_burster_crest', 'queen_burster_segment_0', 'queen_burster_segment_4']
      });
    }

    // -------------------------------------------------------------------------
    // Chantier 127 : Sas de Décharge Déchets Toxiques Fiorina 161 (Alien 3)
    // -------------------------------------------------------------------------
    createToxicWasteChute() {
      return this.createIndustrialProp('toxic_waste_chute');
    }

    // -------------------------------------------------------------------------
    // Chantier 128 : Tourelle Portative Mortier M40 USCM à Shrapnel (Aliens: Fireteam Elite)
    // -------------------------------------------------------------------------
    createPortableMortarTurret() {
      return this.createIndustrialProp('portable_mortar_turret');
    }

    // -------------------------------------------------------------------------
    // Chantier 130 : Sas d'Amarrage Navette de Sauvetage Narcissus (Alien 1979)
    // -------------------------------------------------------------------------
    createNarcissusDockingPort() {
      return this.createIndustrialProp('narcissus_docking_port');
    }

    // -------------------------------------------------------------------------
    // Chantier 131 : Phénotype "The Abomination / Anomaly Hybrid" (Alien: Romulus 2024)
    // -------------------------------------------------------------------------
    createAbomination() {
      return this._createUprightAdult('abomination');
    }

    // -------------------------------------------------------------------------
    // Chantier 132 : Véhicule Blindé M577 APC des Colonial Marines (Aliens 1986)
    // -------------------------------------------------------------------------
    createM577APC() {
      return this.createIndustrialProp('m577_apc');
    }

    // -------------------------------------------------------------------------
    // Chantier 134 : Sas de Condensation & Chutes de Gouttes d'Eau (Alien 1979)
    // -------------------------------------------------------------------------
    createWaterDropletVent() {
      return this.createIndustrialProp('water_droplet_vent');
    }

    // -------------------------------------------------------------------------
    // Chantier 135 : Défibrillateur Médical Mural Seegson (Alien: Isolation)
    // -------------------------------------------------------------------------
    createWallDefibrillator() {
      return this.createIndustrialProp('wall_defibrillator');
    }

    // -------------------------------------------------------------------------
    // Chantier 136 : Phénotype "The Belugamorph / Bloodburster Juvénile Blanc" (Alien: Covenant)
    // -------------------------------------------------------------------------
    createBelugamorph() {
      const T = this._three();
      const root = new T.Group();
      root.name = 'belugamorph_juvenile';
      const paleSkin = this._material('chitinWarm', { color: 0xf8fafc, roughness: 0.72, metalness: 0.05 });
      const bloodFlesh = this._material('chitin', { color: 0xdc2626, roughness: 0.25, metalness: 0.1 });
      const fangBone = this._material('bone', { color: 0xffffff });
      const scale = 1.15;

      // Segments corporels sinueux blanc craie translucide
      for (let s = 0; s < 8; s++) {
        const t = s / 7;
        const radius = (0.38 - t * 0.18) * scale;
        root.add(this._ellipsoid(
          paleSkin,
          { x: radius, y: radius * 0.8, z: 0.48 * scale },
          { x: 0, y: (0.55 + Math.sin(t * Math.PI) * 0.18) * scale, z: (-0.15 - t * 0.65) * scale },
          `belugamorph_segment_${s}`,
          14
        ));
      }
      // Tête ogivale lisse sans yeux
      root.add(this._ellipsoid(
        paleSkin,
        { x: 0.48 * scale, y: 0.36 * scale, z: 0.78 * scale },
        { x: 0, y: 0.72 * scale, z: 0.65 * scale },
        'belugamorph_head',
        18
      ));
      // Mâchoire carnassière à dents pointues acérées
      this._addJaw(root, paleSkin, fangBone, { x: 0, y: 0.58 * scale, z: 1.12 * scale }, 0.52 * scale, false);

      // Deux pattes antérieures véloces
      for (let side = -1; side <= 1; side += 2) {
        this._addSegmentedLimb(
          root, paleSkin, bloodFlesh,
          [
            { x: side * 0.32 * scale, y: 0.62 * scale, z: 0.18 * scale },
            { x: side * 0.58 * scale, y: 0.38 * scale, z: 0.38 * scale },
            { x: side * 0.72 * scale, y: 0.18 * scale, z: 0.58 * scale }
          ],
          [0.09 * scale, 0.065 * scale, 0.045 * scale],
          `belugamorph_arm_${side}`,
          { material: paleSkin, clawMaterial: fangBone, side, scale: 0.42, rotationY: side < 0 ? -0.3 : 0.3 }
        );
      }

      return this._finalize(root, {
        modelType: 'chestburster',
        caste: 'belugamorph',
        height: 1.25,
        animationJoints: ['belugamorph_head', 'belugamorph_segment_0', 'belugamorph_segment_3']
      });
    }

    // -------------------------------------------------------------------------
    // Chantier 137 : Sas de Purge Dépressurisation SAS C-30 (Alien: Romulus)
    // -------------------------------------------------------------------------
    createReactionPurgeVent() {
      return this.createIndustrialProp('reaction_purge_vent');
    }

    // -------------------------------------------------------------------------
    // Chantier 138 : Caméra de Surveillance Thermique Rotative USCM (Aliens 1986 / Isolation)
    // -------------------------------------------------------------------------
    createThermalSurveillancePost() {
      return this.createIndustrialProp('thermal_surveillance_post');
    }

    // -------------------------------------------------------------------------
    // Chantier 140 : Console de Déconnexion du Réacteur Principal (Aliens 1986)
    // -------------------------------------------------------------------------
    createReactorDisconnectConsole() {
      return this.createIndustrialProp('reactor_disconnect_console');
    }

    // -------------------------------------------------------------------------
    // Chantier 141 : Phénotype The Deacon Proto-Queen / Deaconess (Fire and Stone)
    // -------------------------------------------------------------------------
    createDeaconess() {
      return this._createUprightAdult('deaconess');
    }

    // -------------------------------------------------------------------------
    // Chantier 142 : Panneau de Réfrigération Cryogénique Sub-Zero Coolant (Alien 1979 / Romulus)
    // -------------------------------------------------------------------------
    createSubZeroCoolantPanel() {
      return this.createIndustrialProp('subzero_coolant_panel');
    }

    // -------------------------------------------------------------------------
    // Chantier 143 : Fusil de Sniper Smart-Scoped M42A USCM sur Trépied (Colonial Marines)
    // -------------------------------------------------------------------------
    createM42ASniperPost() {
      return this.createIndustrialProp('m42a_sniper_post');
    }

    // -------------------------------------------------------------------------
    // Chantier 144 : Trappe de Plancher de Conduits Techniques (Alien 3 / Isolation)
    // -------------------------------------------------------------------------
    createUnderfloorGrate() {
      return this.createIndustrialProp('underfloor_grate');
    }

    // -------------------------------------------------------------------------
    // Chantier 145 : Poste de Contrôle des Volets Anti-Souffle de Confinement (Aliens 1986)
    // -------------------------------------------------------------------------
    createBulkheadBlastShutterConsole() {
      return this.createIndustrialProp('bulkhead_blast_shutter_console');
    }

    // -------------------------------------------------------------------------
    // Chantier 147 : Module de Recharge pour Androïdes Seegson (Alien: Isolation)
    // -------------------------------------------------------------------------
    createSyntheticChargingBay() {
      return this.createIndustrialProp('synthetic_charging_bay');
    }

    // -------------------------------------------------------------------------
    // Chantier 148 : Projecteurs Holographiques Tactiques de Fausse Piste (Aliens: Dark Descent)
    // -------------------------------------------------------------------------
    createHolographicDecoyProjector() {
      return this.createIndustrialProp('holographic_decoy_projector');
    }

    // -------------------------------------------------------------------------
    // Chantier 150 : Console de Purge Atmosphérique M.U.T.H.U.R. & Dépression N2/O2 (Alien 1979 / Romulus)
    // -------------------------------------------------------------------------
    createAtmosphericDepressionConsole() {
      return this.createIndustrialProp('atmospheric_depression_console');
    }

    // -------------------------------------------------------------------------
    // Chantier 151 : Phénotype The Red Xenomorph Drone / Guerrier Rouge (Genocide 1991)
    // -------------------------------------------------------------------------
    createRedDrone() {
      return this._createUprightAdult('red_drone');
    }

    // -------------------------------------------------------------------------
    // Chantier 152 : Affût Lance-Roquettes M83A2 SADAR USCM (Aliens 1986 / Dark Descent)
    // -------------------------------------------------------------------------
    createSadarRocketLauncher() {
      return this.createIndustrialProp('sadar_rocket_launcher');
    }

    // -------------------------------------------------------------------------
    // Chantier 153 : Réseau de Canalisations d'Huile Hydraulique (Alien 1979 / Isolation)
    // -------------------------------------------------------------------------
    createHydraulicOilPipe() {
      return this.createIndustrialProp('hydraulic_oil_pipe');
    }

    // -------------------------------------------------------------------------
    // Chantier 154 : SAS de Quarantaine Médicale avec Champ Laser Bio-Sécurisé (Alien 3 / Romulus)
    // -------------------------------------------------------------------------
    createLaserDeconArch() {
      return this.createIndustrialProp('laser_decon_arch');
    }

    // -------------------------------------------------------------------------
    // Chantier 155 : Phénotype Juvénile "Chestburster Métamorphe Épineux" (Alien 3)
    // -------------------------------------------------------------------------
    createSpinedBurster() {
      const T = this._three();
      const root = new T.Group();
      root.name = 'spined_burster';
      const paleChitin = this._material('chitinWarm', { color: 0x451a03, roughness: 0.35, metalness: 0.3 });
      const spineBone = this._material('bone', { color: 0xfef08a });
      const scale = 0.95;

      for (let s = 0; s < 7; s++) {
        const rad = (0.28 - s * 0.03) * scale;
        root.add(this._ellipsoid(paleChitin, { x: rad, y: rad * 0.7, z: 0.35 * scale }, { x: 0, y: 0.28 * scale, z: -s * 0.32 * scale }, `spined_seg_${s}`, 12));
        // Épines dorsales le long du rachis
        root.add(this._box(spineBone, { x: 0.03 * scale, y: 0.16 * scale, z: 0.04 * scale }, { x: 0, y: (0.42 - s * 0.02) * scale, z: -s * 0.32 * scale }, `spine_${s}`));
      }
      root.add(this._ellipsoid(paleChitin, { x: 0.34 * scale, y: 0.26 * scale, z: 0.52 * scale }, { x: 0, y: 0.38 * scale, z: 0.42 * scale }, 'spined_head', 14));
      this._addJaw(root, paleChitin, spineBone, { x: 0, y: 0.28 * scale, z: 0.72 * scale }, 0.4 * scale, false);

      return this._finalize(root, {
        modelType: 'chestburster',
        caste: 'spined_burster',
        height: 0.85,
        animationJoints: ['spined_head', 'spined_seg_0', 'spined_seg_3']
      });
    }

    // -------------------------------------------------------------------------
    // Chantier 156 : Grue de Levage Magnétique & Conteneur Suspendu 10 Tonnes (Aliens 1986)
    // -------------------------------------------------------------------------
    createMagneticCraneContainer() {
      return this.createIndustrialProp('magnetic_crane_container');
    }

    // -------------------------------------------------------------------------
    // Chantier 157 : Fusil à Pompe Lourd ZX-76 Trench Shotgun sur Râtelier (Alien: Isolation)
    // -------------------------------------------------------------------------
    createZX76ShotgunRack() {
      return this.createIndustrialProp('zx76_shotgun_rack');
    }

    // -------------------------------------------------------------------------
    // Chantier 158 : Générateur de Brouillard Halon Anti-Incendie (Alien 1979 / Isolation)
    // -------------------------------------------------------------------------
    createHalonGasGenerator() {
      return this.createIndustrialProp('halon_gas_generator');
    }

    // -------------------------------------------------------------------------
    // Chantier 160 : Terminal Central de Surveillance Weyland & Radio USCM (Aliens 1986)
    // -------------------------------------------------------------------------
    createSurveillanceRadioConsole() {
      return this.createIndustrialProp('surveillance_radio_console');
    }

    // -------------------------------------------------------------------------
    // Chantier 161 : Phénotype The Flying Xenomorph / Alien Ailé de Charon (Aliens 1992 Kenner / Comics)
    // -------------------------------------------------------------------------
    createFlyingDrone() {
      return this._createUprightAdult('flying_drone');
    }

    // -------------------------------------------------------------------------
    // Chantier 162 : Système d'Extincteurs Portatifs CO2 Seegson & Masquage Thermique (Alien: Isolation)
    // -------------------------------------------------------------------------
    createSeegsonCO2Extinguisher() {
      return this.createIndustrialProp('co2_extinguisher');
    }

    // -------------------------------------------------------------------------
    // Chantier 164 : SAS de Traitement Déchets Biologiques & Incinérateur Central (Alien 3)
    // -------------------------------------------------------------------------
    createBioWasteIncinerator() {
      return this.createIndustrialProp('biowaste_incinerator');
    }

    // -------------------------------------------------------------------------
    // Chantier 165 : Phénotype Juvénile "Neomorph Bloodburster Albinos" (Alien: Covenant)
    // -------------------------------------------------------------------------
    createNeomorphBloodburster() {
      const T = this._three();
      const root = new T.Group();
      root.name = 'neomorph_bloodburster';
      const chalkSkin = this._material('resin', { color: 0xf8fafc, roughness: 0.25, opacity: 0.92, transparent: true });
      const bloodCrimson = this._material('emissiveRed', { color: 0xdc2626, emissive: 0x991b1b, emissiveIntensity: 1.5 });
      const scale = 0.92;

      for (let s = 0; s < 6; s++) {
        const rad = (0.24 - s * 0.025) * scale;
        root.add(this._ellipsoid(chalkSkin, { x: rad, y: rad * 0.75, z: 0.32 * scale }, { x: 0, y: 0.24 * scale, z: -s * 0.28 * scale }, `bloodburster_seg_${s}`, 12));
      }
      root.add(this._ellipsoid(chalkSkin, { x: 0.28 * scale, y: 0.22 * scale, z: 0.55 * scale }, { x: 0, y: 0.32 * scale, z: 0.38 * scale }, 'bloodburster_head', 14));
      root.add(this._box(bloodCrimson, { x: 0.16 * scale, y: 0.08 * scale, z: 0.24 * scale }, { x: 0, y: 0.25 * scale, z: 0.58 * scale }, 'bloodburster_bloody_teeth'));

      return this._finalize(root, {
        modelType: 'chestburster',
        caste: 'neomorph_bloodburster',
        height: 0.82,
        animationJoints: ['bloodburster_head', 'bloodburster_seg_0', 'bloodburster_seg_2']
      });
    }

    // -------------------------------------------------------------------------
    // Chantier 166 : Bras Robotique Manipulateur Industriel EVA (Alien 1979 / Romulus)
    // -------------------------------------------------------------------------
    createEvaRoboticArm() {
      return this.createIndustrialProp('eva_robotic_arm');
    }

    // -------------------------------------------------------------------------
    // Chantier 167 : Piège Mural Mine de Proximité Laser Claymore M18A3 (Aliens vs Predator / Dark Descent)
    // -------------------------------------------------------------------------
    createLaserClaymoreMine() {
      return this.createIndustrialProp('laser_claymore_mine');
    }

    // -------------------------------------------------------------------------
    // Chantier 168 : Générateur de Brouillard de Fréon Glacial Sub-Zero (Alien 3 / Isolation)
    // -------------------------------------------------------------------------
    createFreonFogGenerator() {
      return this.createIndustrialProp('freon_fog_generator');
    }

    // -------------------------------------------------------------------------
    // Chantier 170 : Console Centrale Bio-Scan MUTHUR 6000 & Diagnostic Équipage (Alien 1979 / Aliens 1986)
    // -------------------------------------------------------------------------
    createMuthurBioScanConsole() {
      return this.createIndustrialProp('muthur_bioscan_console');
    }

    // -------------------------------------------------------------------------
    // Chantier 171 : Phénotype "The Snake Xenomorph / Alien Ophidien" (Aliens 1992 Kenner / Comics)
    // -------------------------------------------------------------------------
    createSnakeDrone() {
      const T = this._three();
      const root = new T.Group();
      root.name = 'adult_snake_drone';
      const scale = 1.08;
      const snakeChitin = this._material('chitin', {
        color: 0x090d16,
        roughness: 0.18,
        metalness: 0.58,
        emissive: 0x1e1b4b,
        emissiveIntensity: 0.4
      });
      const boneDard = this._material('bone', { color: 0xf8fafc, roughness: 0.22, metalness: 0.1 });
      const fangWhite = this._material('emissiveAmber', { color: 0xf1f5f9, roughness: 0.1, emissiveIntensity: 0.8 });

      // Corps serpentin annelé : 10 segments sinueux décroissants sans pattes postérieures
      for (let s = 0; s < 10; s++) {
        const radiusX = (0.34 - s * 0.022) * scale;
        const radiusY = (0.28 - s * 0.018) * scale;
        const radiusZ = 0.32 * scale;
        const segZ = -s * 0.34 * scale;
        const segY = (0.28 + (s < 3 ? (3 - s) * 0.18 : 0)) * scale;
        root.add(this._ellipsoid(snakeChitin, { x: radiusX, y: radiusY, z: radiusZ }, { x: 0, y: segY, z: segZ }, `snake_seg_${s}`, 12));
      }

      // Tête conique allongée ophidienne sans tubes dorsaux
      root.add(this._ellipsoid(snakeChitin, { x: 0.32 * scale, y: 0.26 * scale, z: 0.82 * scale }, { x: 0, y: 0.95 * scale, z: 0.45 * scale }, 'snake_head', 16));
      // Collerette écailleuse dorsale recourbée (cobra Alien)
      root.add(this._box(snakeChitin, { x: 0.68 * scale, y: 0.48 * scale, z: 0.08 * scale }, { x: 0, y: 0.85 * scale, z: 0.12 * scale }, 'snake_hood'));
      // Crochets ophidiens acérés
      root.add(this._cylinder(fangWhite, 0.025 * scale, 0.005 * scale, 0.2 * scale, { x: -0.12 * scale, y: 0.78 * scale, z: 0.75 * scale }, { x: 0.25, y: 0, z: 0 }, 'snake_fang_left'));
      root.add(this._cylinder(fangWhite, 0.025 * scale, 0.005 * scale, 0.2 * scale, { x: 0.12 * scale, y: 0.78 * scale, z: 0.75 * scale }, { x: 0.25, y: 0, z: 0 }, 'snake_fang_right'));
      // Dard caudal aiguillon venimeux en fin de corps
      root.add(this._cone(boneDard, 0.08 * scale, 0.38 * scale, { x: 0, y: 0.18 * scale, z: -3.5 * scale }, { x: -Math.PI / 2, y: 0, z: 0 }, 'snake_stinger'));

      // Deux petits bras antérieurs griffus de préhension
      const armMat = this._material('chitin', { color: 0x090d16, roughness: 0.22, metalness: 0.5 });
      for (let side = -1; side <= 1; side += 2) {
        root.add(this._segment(armMat, new T.Vector3(side * 0.28 * scale, 0.75 * scale, 0.22 * scale), new T.Vector3(side * 0.45 * scale, 0.42 * scale, 0.45 * scale), 0.06 * scale, 0.04 * scale, `snake_arm_${side}`, 8));
      }

      return this._finalize(root, {
        modelType: 'adult',
        caste: 'snake_drone',
        height: 1.45 * scale,
        animationJoints: ['snake_head', 'snake_seg_0', 'snake_seg_2', 'snake_seg_5']
      });
    }

    // -------------------------------------------------------------------------
    // Chantier 172 : Rideau d'Eau Industriel & Buse Haute Pression (Alien 1979 / Isolation)
    // -------------------------------------------------------------------------
    createIndustrialWaterCurtain() {
      return this.createIndustrialProp('industrial_water_curtain');
    }

    // -------------------------------------------------------------------------
    // Chantier 174 : Poste de Contrôle des SAS Étanches d'Urgence Weyland (Alien: Isolation)
    // -------------------------------------------------------------------------
    createBulkheadEmergencyControlPanel() {
      return this.createIndustrialProp('bulkhead_emergency_control_panel');
    }

    // -------------------------------------------------------------------------
    // Chantier 175 : Phénotype Juvénile "Armored Chestburster" (Aliens: Genocide / Comics)
    // -------------------------------------------------------------------------
    createArmoredChestburster() {
      const T = this._three();
      const root = new T.Group();
      root.name = 'armored_chestburster';
      const scale = 0.95;
      const paleFlesh = this._material('resin', { color: 0xe2e8f0, roughness: 0.35 });
      const darkArmor = this._material('darkMetal', { color: 0x0f172a, roughness: 0.25, metalness: 0.75 });

      // Corps annelé
      for (let s = 0; s < 5; s++) {
        const rad = (0.22 - s * 0.022) * scale;
        root.add(this._ellipsoid(paleFlesh, { x: rad, y: rad * 0.8, z: 0.28 * scale }, { x: 0, y: 0.22 * scale, z: -s * 0.26 * scale }, `armored_burster_seg_${s}`, 12));
        // Plaques osseuses dorsales transversales blindées
        root.add(this._box(darkArmor, { x: (rad * 2.1) * scale, y: 0.06 * scale, z: 0.16 * scale }, { x: 0, y: (rad * 0.85 + 0.22) * scale, z: -s * 0.26 * scale }, `armored_plate_${s}`));
      }
      // Tête cuirassée
      root.add(this._ellipsoid(darkArmor, { x: 0.26 * scale, y: 0.2 * scale, z: 0.52 * scale }, { x: 0, y: 0.3 * scale, z: 0.36 * scale }, 'armored_burster_head', 14));

      return this._finalize(root, {
        modelType: 'chestburster',
        caste: 'armored_chestburster',
        height: 0.78,
        animationJoints: ['armored_burster_head', 'armored_burster_seg_0']
      });
    }

    // -------------------------------------------------------------------------
    // Chantier 176 : Générateur d'Énergie Thermique & Soupape de Surpression Fiorina 161 (Alien 3)
    // -------------------------------------------------------------------------
    createGeothermalTurbineValve() {
      return this.createIndustrialProp('geothermal_turbine_valve');
    }

    // -------------------------------------------------------------------------
    // Chantier 177 : Tourelle de Barbelés Micro-Électrifiés M24 USCM (Aliens: Dark Descent)
    // -------------------------------------------------------------------------
    createMicroElectricBarbedWireTurret() {
      return this.createIndustrialProp('micro_electric_barbed_wire_turret');
    }

    // -------------------------------------------------------------------------
    // Chantier 178 : Réservoir Pressurisé de Gel Cryogénique Sub-Zero LN2 (Alien: Romulus)
    // -------------------------------------------------------------------------
    createSubZeroCryoGelCanister() {
      return this.createIndustrialProp('subzero_cryogel_canister');
    }

    // -------------------------------------------------------------------------
    // Chantier 180 : Console de Diagnostic Synthétique Seegson & Alcôve Working Joe (Alien: Isolation)
    // -------------------------------------------------------------------------
    createSeegsonDiagnosticAlcove() {
      return this.createIndustrialProp('seegson_diagnostic_alcove');
    }

    // -------------------------------------------------------------------------
    // Chantier 181 : Phénotype "The Mantis Xenomorph / Alien Mante Religieuse" (Aliens 1992 Kenner)
    // -------------------------------------------------------------------------
    createMantisDrone() {
      const T = this._three();
      const root = new T.Group();
      root.name = 'adult_mantis_drone';
      const scale = 1.12;
      const mantisChitin = this._material('chitin', {
        color: 0x14532d,
        roughness: 0.16,
        metalness: 0.65,
        emissive: 0x052e16,
        emissiveIntensity: 0.5
      });
      const scytheBlade = this._material('bone', { color: 0xf1f5f9, roughness: 0.18, metalness: 0.75 });

      // Buste svelte élancé et abdomen conique étiré
      root.add(this._ellipsoid(mantisChitin, { x: 0.32 * scale, y: 0.45 * scale, z: 0.3 * scale }, { x: 0, y: 1.25 * scale, z: 0 }, 'mantis_torso', 12));
      root.add(this._ellipsoid(mantisChitin, { x: 0.28 * scale, y: 0.35 * scale, z: 0.65 * scale }, { x: 0, y: 0.85 * scale, z: -0.4 * scale }, 'mantis_abdomen', 14));

      // Tête cunéiforme triangulaire avec crête crânienne dentée
      root.add(this._ellipsoid(mantisChitin, { x: 0.26 * scale, y: 0.22 * scale, z: 0.75 * scale }, { x: 0, y: 1.7 * scale, z: 0.3 * scale }, 'mantis_head', 16));
      root.add(this._box(mantisChitin, { x: 0.52 * scale, y: 0.18 * scale, z: 0.4 * scale }, { x: 0, y: 1.8 * scale, z: 0.05 * scale }, 'mantis_crest'));

      // Double pinces falciformes antérieures géantes (lames de mante)
      for (let side = -1; side <= 1; side += 2) {
        root.add(this._segment(mantisChitin, new T.Vector3(side * 0.25 * scale, 1.45 * scale, 0.1 * scale), new T.Vector3(side * 0.55 * scale, 1.85 * scale, 0.35 * scale), 0.07 * scale, 0.05 * scale, `mantis_arm_upper_${side}`, 8));
        root.add(this._segment(scytheBlade, new T.Vector3(side * 0.55 * scale, 1.85 * scale, 0.35 * scale), new T.Vector3(side * 0.4 * scale, 0.95 * scale, 0.65 * scale), 0.06 * scale, 0.02 * scale, `mantis_scythe_${side}`, 8));
        for (let sp = 0; sp < 3; sp++) {
          root.add(this._cone(scytheBlade, 0.025 * scale, 0.12 * scale, { x: side * 0.46 * scale, y: (1.2 + sp * 0.18) * scale, z: 0.5 * scale }, { x: 0, y: 0, z: side * (Math.PI / 3) }, `mantis_spine_${side}_${sp}`));
        }
      }

      // Pattes postérieures digitigrades allongées
      for (let side = -1; side <= 1; side += 2) {
        root.add(this._segment(mantisChitin, new T.Vector3(side * 0.22 * scale, 0.85 * scale, -0.1 * scale), new T.Vector3(side * 0.38 * scale, 0.5 * scale, -0.3 * scale), 0.08 * scale, 0.05 * scale, `mantis_thigh_${side}`, 8));
        root.add(this._segment(mantisChitin, new T.Vector3(side * 0.38 * scale, 0.5 * scale, -0.3 * scale), new T.Vector3(side * 0.32 * scale, 0, 0.05 * scale), 0.05 * scale, 0.03 * scale, `mantis_shin_${side}`, 8));
      }

      // Dard caudal aiguillon
      root.add(this._cone(scytheBlade, 0.06 * scale, 0.35 * scale, { x: 0, y: 0.75 * scale, z: -1.05 * scale }, { x: -Math.PI / 3, y: 0, z: 0 }, 'mantis_tail_stinger'));

      return this._finalize(root, {
        modelType: 'adult',
        caste: 'mantis_drone',
        height: 1.85 * scale,
        animationJoints: ['mantis_head', 'mantis_torso']
      });
    }

    // -------------------------------------------------------------------------
    // Chantier 182 : Système de Brouilleur Acoustique Ultrasonique USCM M20 (Aliens: Dark Descent)
    // -------------------------------------------------------------------------
    createAcousticJammerM20() {
      return this.createIndustrialProp('acoustic_jammer_m20');
    }

    // -------------------------------------------------------------------------
    // Chantier 184 : Unité Autonome de Décontamination Cryo-Stérilisante (Alien 3 / Romulus)
    // -------------------------------------------------------------------------
    createCryoSterilizationUnit() {
      return this.createIndustrialProp('cryo_sterilization_unit');
    }

    // -------------------------------------------------------------------------
    // Chantier 185 : Phénotype Juvénile "Cloaked Runner Burster" (Alien: Romulus / Comics)
    // -------------------------------------------------------------------------
    createCloakedRunnerBurster() {
      const T = this._three();
      const root = new T.Group();
      root.name = 'cloaked_runner_burster';
      const scale = 0.88;
      const ghostChitin = this._material('resin', {
        color: 0x64748b,
        roughness: 0.15,
        opacity: 0.58,
        transparent: true
      });
      const eyeGlow = this._material('emissiveBlue', { color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.8 });

      // Corps fuselé transparent
      for (let s = 0; s < 5; s++) {
        const rad = (0.2 - s * 0.02) * scale;
        root.add(this._ellipsoid(ghostChitin, { x: rad, y: rad * 0.75, z: 0.25 * scale }, { x: 0, y: 0.18 * scale, z: -s * 0.24 * scale }, `cloaked_seg_${s}`, 10));
      }
      root.add(this._ellipsoid(ghostChitin, { x: 0.24 * scale, y: 0.18 * scale, z: 0.48 * scale }, { x: 0, y: 0.25 * scale, z: 0.32 * scale }, 'cloaked_head', 12));
      root.add(this._box(eyeGlow, { x: 0.08 * scale, y: 0.04 * scale, z: 0.12 * scale }, { x: 0, y: 0.24 * scale, z: 0.46 * scale }, 'cloaked_optic'));

      return this._finalize(root, {
        modelType: 'chestburster',
        caste: 'cloaked_runner_burster',
        height: 0.7,
        animationJoints: ['cloaked_head', 'cloaked_seg_0']
      });
    }

    // -------------------------------------------------------------------------
    // Chantier 186 : Poste de Contrôle des SAS d'Éjection de Capsule EEV Type 37 (Alien 3)
    // -------------------------------------------------------------------------
    createEevType37ControlConsole() {
      return this.createIndustrialProp('eev_type37_console');
    }

    // -------------------------------------------------------------------------
    // Chantier 187 : Mine Antipersonnel Incendiaire M20B Napalm Trap (Aliens: Fireteam Elite)
    // -------------------------------------------------------------------------
    createM20BNapalmTrap() {
      return this.createIndustrialProp('m20b_napalm_trap');
    }

    // -------------------------------------------------------------------------
    // Chantier 188 : Réseau de Canalisations d'Ammoniac Industriel (Alien 1979 / Isolation)
    // -------------------------------------------------------------------------
    createAmmoniaPipe() {
      return this.createIndustrialProp('ammonia_pipe');
    }

    // -------------------------------------------------------------------------
    // Chantier 190 : Terminal de Surveillance de Ruche "Bio-Core Nursery Interface" (Aliens: Genocide)
    // -------------------------------------------------------------------------
    createBioCoreNurseryInterface() {
      return this.createIndustrialProp('biocore_nursery_interface');
    }

    // -------------------------------------------------------------------------
    // Chantier 191 : Phénotype "The Bull Xenomorph / Alien Taureau de Charon" (Aliens 1992 Kenner)
    // -------------------------------------------------------------------------
    createBullDrone() {
      const T = this._three();
      const root = new T.Group();
      root.name = 'adult_bull_drone';
      const scale = 1.25;
      const bullChitin = this._material('chitin', {
        color: 0x1c1917,
        roughness: 0.38,
        metalness: 0.75
      });
      const hornBone = this._material('bone', {
        color: 0x44403c,
        roughness: 0.28,
        metalness: 0.5
      });
      const eyeGlow = this._material('emissiveAmber', { color: 0xf97316, emissive: 0xc2410c, emissiveIntensity: 2.2 });

      // Torse ramassé et surbaissé très musclé
      root.add(this._ellipsoid(bullChitin, { x: 0.45 * scale, y: 0.4 * scale, z: 0.7 * scale }, { x: 0, y: 0.85 * scale, z: 0 }, 'bull_torso', 14));
      // Tête blindée bélier
      root.add(this._ellipsoid(bullChitin, { x: 0.32 * scale, y: 0.28 * scale, z: 0.65 * scale }, { x: 0, y: 1.1 * scale, z: 0.55 * scale }, 'bull_head', 14));
      // Deux cornes recourbées vers l'avant
      for (let side = -1; side <= 1; side += 2) {
        root.add(this._segment(hornBone, new T.Vector3(side * 0.25 * scale, 1.25 * scale, 0.45 * scale), new T.Vector3(side * 0.48 * scale, 1.55 * scale, 0.75 * scale), 0.1 * scale, 0.04 * scale, `bull_horn_base_${side}`, 10));
        root.add(this._segment(hornBone, new T.Vector3(side * 0.48 * scale, 1.55 * scale, 0.75 * scale), new T.Vector3(side * 0.35 * scale, 1.65 * scale, 1.05 * scale), 0.04 * scale, 0.01 * scale, `bull_horn_tip_${side}`, 8));
      }
      // Pattes antérieures trapues
      for (let side = -1; side <= 1; side += 2) {
        root.add(this._segment(bullChitin, new T.Vector3(side * 0.35 * scale, 0.85 * scale, 0.35 * scale), new T.Vector3(side * 0.45 * scale, 0.4 * scale, 0.45 * scale), 0.12 * scale, 0.08 * scale, `bull_foreleg_${side}`, 10));
        root.add(this._segment(bullChitin, new T.Vector3(side * 0.45 * scale, 0.4 * scale, 0.45 * scale), new T.Vector3(side * 0.42 * scale, 0, 0.5 * scale), 0.08 * scale, 0.06 * scale, `bull_hoof_${side}`, 8));
      }
      // Pattes postérieures puissantes
      for (let side = -1; side <= 1; side += 2) {
        root.add(this._segment(bullChitin, new T.Vector3(side * 0.38 * scale, 0.85 * scale, -0.35 * scale), new T.Vector3(side * 0.48 * scale, 0.45 * scale, -0.2 * scale), 0.14 * scale, 0.09 * scale, `bull_hindthigh_${side}`, 10));
        root.add(this._segment(bullChitin, new T.Vector3(side * 0.48 * scale, 0.45 * scale, -0.2 * scale), new T.Vector3(side * 0.44 * scale, 0, -0.15 * scale), 0.09 * scale, 0.06 * scale, `bull_hindshin_${side}`, 8));
      }
      // Queue lourde terminée par une massue cornée
      root.add(this._cone(bullChitin, 0.15 * scale, 0.9 * scale, { x: 0, y: 0.75 * scale, z: -0.9 * scale }, { x: -Math.PI / 4, y: 0, z: 0 }, 'bull_tail'));
      root.add(this._ellipsoid(hornBone, { x: 0.18 * scale, y: 0.15 * scale, z: 0.22 * scale }, { x: 0, y: 0.65 * scale, z: -1.4 * scale }, 'bull_tail_club', 10));

      return this._finalize(root, {
        modelType: 'adult',
        caste: 'bull_drone',
        height: 1.7 * scale,
        animationJoints: ['bull_head', 'bull_torso']
      });
    }

    // -------------------------------------------------------------------------
    // Chantier 192 : Système de Brouillard de Fumigènes Phosphorés M94 (Aliens: Fireteam Elite)
    // -------------------------------------------------------------------------
    createM94SmokeSystem() {
      return this.createIndustrialProp('m94_smoke_system');
    }

    // -------------------------------------------------------------------------
    // Chantier 194 : Poste de Contrôle des SAS d'Échappement Cryo-Statique C-44 (Alien: Romulus)
    // -------------------------------------------------------------------------
    createCryoPurgeC44() {
      return this.createIndustrialProp('cryo_purge_c44');
    }

    // -------------------------------------------------------------------------
    // Chantier 195 : Phénotype "The Gorilla / Ape Xenomorph de Charon" (Aliens 1992 Kenner)
    // -------------------------------------------------------------------------
    createGorillaDrone() {
      const T = this._three();
      const root = new T.Group();
      root.name = 'adult_gorilla_drone';
      const scale = 1.28;
      const gorillaChitin = this._material('chitin', {
        color: 0x0f172a,
        roughness: 0.42,
        metalness: 0.6
      });
      const knuckleMetal = this._material('darkMetal', {
        color: 0x334155,
        roughness: 0.35,
        metalness: 0.85
      });

      // Buste large herculéen en voûte
      root.add(this._ellipsoid(gorillaChitin, { x: 0.55 * scale, y: 0.48 * scale, z: 0.45 * scale }, { x: 0, y: 1.15 * scale, z: 0 }, 'gorilla_chest', 14));
      // Dôme crânien arrondi côtelé
      root.add(this._ellipsoid(gorillaChitin, { x: 0.32 * scale, y: 0.28 * scale, z: 0.58 * scale }, { x: 0, y: 1.55 * scale, z: 0.22 * scale }, 'gorilla_head', 14));
      // Bras brachiaux surdimensionnés jusqu'au sol
      for (let side = -1; side <= 1; side += 2) {
        root.add(this._segment(gorillaChitin, new T.Vector3(side * 0.52 * scale, 1.25 * scale, 0.1 * scale), new T.Vector3(side * 0.65 * scale, 0.65 * scale, 0.25 * scale), 0.16 * scale, 0.12 * scale, `gorilla_arm_upper_${side}`, 10));
        root.add(this._segment(knuckleMetal, new T.Vector3(side * 0.65 * scale, 0.65 * scale, 0.25 * scale), new T.Vector3(side * 0.58 * scale, 0.05 * scale, 0.35 * scale), 0.13 * scale, 0.1 * scale, `gorilla_forearm_${side}`, 10));
        root.add(this._box(knuckleMetal, { x: 0.18 * scale, y: 0.12 * scale, z: 0.22 * scale }, { x: side * 0.58 * scale, y: 0.06 * scale, z: 0.38 * scale }, `gorilla_knuckle_${side}`));
      }
      // Membres inférieurs ramassés
      for (let side = -1; side <= 1; side += 2) {
        root.add(this._segment(gorillaChitin, new T.Vector3(side * 0.32 * scale, 0.75 * scale, -0.2 * scale), new T.Vector3(side * 0.38 * scale, 0, -0.1 * scale), 0.14 * scale, 0.09 * scale, `gorilla_leg_${side}`, 10));
      }
      // Queue courte articulée
      root.add(this._cone(gorillaChitin, 0.12 * scale, 0.65 * scale, { x: 0, y: 0.7 * scale, z: -0.55 * scale }, { x: -Math.PI / 4, y: 0, z: 0 }, 'gorilla_tail'));

      return this._finalize(root, {
        modelType: 'adult',
        caste: 'gorilla_drone',
        height: 1.8 * scale,
        animationJoints: ['gorilla_head', 'gorilla_chest']
      });
    }

    // -------------------------------------------------------------------------
    // Chantier 193 : Opérateur USCM SADAR Lance-Roquettes M57A1 (Aliens: Colonial Marines)
    // -------------------------------------------------------------------------
    createSadarOperator() {
      return this.createHuman('uscm_sadar_operator');
    }

    // -------------------------------------------------------------------------
    // Chantier 196 : Station de Rechargement Rapide KAPPA & Pile à Fusion (Aliens: Fireteam Elite)
    // -------------------------------------------------------------------------
    createFusionBatteryStation() {
      return this.createIndustrialProp('fusion_battery_station');
    }

    // -------------------------------------------------------------------------
    // Chantier 197 : Réseau de Gicleurs de Fluide Hydraulique 120 bars (Alien: Isolation)
    // -------------------------------------------------------------------------
    createHydraulicSpurtManifold() {
      return this.createIndustrialProp('hydraulic_spurt_manifold');
    }

    // -------------------------------------------------------------------------
    // Chantier 199 : Terminal de Télémétrie MUTHUR & Détection Sonar Sismique (Alien 1979 / Isolation)
    // -------------------------------------------------------------------------
    createMuthurTelemetryConsole() {
      return this.createIndustrialProp('muthur_telemetry_console');
    }

    // -------------------------------------------------------------------------
    // Chantier 200 : Grand Sanctuaire de Ponte Royal "The Ovipositor Cradle" (Aliens 1986)
    // -------------------------------------------------------------------------
    createOvipositorCradle() {
      return this.createIndustrialProp('ovipositor_cradle');
    }

    // -------------------------------------------------------------------------
    // Chantier 201 : Phénotype "The Wildboar / Boar Xenomorph de Charon" (Aliens 1992 Kenner / Genocide)
    // -------------------------------------------------------------------------
    createBoarDrone() {
      const T = this._three();
      const root = new T.Group();
      root.name = 'adult_boar_drone';
      const scale = 1.05;

      const boarChitin = this._material('carapace', {
        color: 0x27272a,
        roughness: 0.35,
        metalness: 0.65
      });
      const tuskObsidian = this._material('darkMetal', {
        color: 0x09090b,
        roughness: 0.15,
        metalness: 0.9
      });

      // Buste bas et ramassé bélier
      root.add(this._ellipsoid(boarChitin, { x: 0.52 * scale, y: 0.44 * scale, z: 0.5 * scale }, { x: 0, y: 1.1 * scale, z: 0 }, 'boar_chest', 14));
      // Tête carénée et dôme court hérissé
      root.add(this._ellipsoid(boarChitin, { x: 0.3 * scale, y: 0.26 * scale, z: 0.62 * scale }, { x: 0, y: 1.35 * scale, z: 0.35 * scale }, 'boar_head', 14));
      // Deux défenses en faux d'obsidienne tranchantes
      for (let side = -1; side <= 1; side += 2) {
        root.add(this._cone(tuskObsidian, 0.08 * scale, 0.48 * scale, { x: side * 0.24 * scale, y: 1.32 * scale, z: 0.6 * scale }, { x: Math.PI / 3, y: side * 0.25, z: 0 }, `boar_tusk_${side}`));
      }
      // Crête dorsale de pointes osseuses
      for (let spine = 0; spine < 5; spine++) {
        root.add(this._cone(tuskObsidian, 0.04 * scale, 0.25 * scale, { x: 0, y: (1.2 + spine * 0.1) * scale, z: (-0.1 - spine * 0.12) * scale }, { x: -Math.PI / 4, y: 0, z: 0 }, `boar_spine_${spine}`));
      }
      // Membres antérieurs puissants et postérieurs arqués
      for (let side = -1; side <= 1; side += 2) {
        root.add(this._segment(boarChitin, new T.Vector3(side * 0.38 * scale, 1.1 * scale, 0.15 * scale), new T.Vector3(side * 0.45 * scale, 0.1 * scale, 0.25 * scale), 0.14 * scale, 0.1 * scale, `boar_arm_${side}`, 10));
        root.add(this._segment(boarChitin, new T.Vector3(side * 0.32 * scale, 0.85 * scale, -0.2 * scale), new T.Vector3(side * 0.36 * scale, 0, -0.15 * scale), 0.15 * scale, 0.11 * scale, `boar_leg_${side}`, 10));
      }
      // Queue puissante à dard éperon
      root.add(this._cone(tuskObsidian, 0.1 * scale, 0.7 * scale, { x: 0, y: 0.7 * scale, z: -0.55 * scale }, { x: -Math.PI / 3, y: 0, z: 0 }, 'boar_tail'));

      return this._finalize(root, {
        modelType: 'adult',
        caste: 'boar_drone',
        height: 1.7 * scale,
        animationJoints: ['boar_head', 'boar_chest']
      });
    }

    // -------------------------------------------------------------------------
    // Chantier 205 : Phénotype "The Scorpion Xenomorph de Charon" (Aliens 1992 Kenner)
    // -------------------------------------------------------------------------
    createScorpionDrone() {
      const T = this._three();
      const root = new T.Group();
      root.name = 'adult_scorpion_drone';
      const scale = 1.1;

      const scorpionChitin = this._material('carapace', {
        color: 0x1c1917,
        roughness: 0.25,
        metalness: 0.75
      });
      const venomBarb = this._material('emissiveGreen', {
        color: 0x84cc16,
        emissive: 0x65a30d,
        emissiveIntensity: 3.2
      });

      // Buste segmenté cuirassé
      root.add(this._ellipsoid(scorpionChitin, { x: 0.48 * scale, y: 0.46 * scale, z: 0.42 * scale }, { x: 0, y: 1.15 * scale, z: 0 }, 'scorpion_chest', 14));
      // Tête dôme striée
      root.add(this._ellipsoid(scorpionChitin, { x: 0.28 * scale, y: 0.24 * scale, z: 0.65 * scale }, { x: 0, y: 1.5 * scale, z: 0.2 * scale }, 'scorpion_head', 14));
      // Plaques dorsales imbriquées en tuiles
      for (let plate = 0; plate < 4; plate++) {
        root.add(this._box(scorpionChitin, { x: 0.42 * scale, y: 0.08 * scale, z: 0.22 * scale }, { x: 0, y: (1.4 - plate * 0.16) * scale, z: -0.2 * scale }, `scorpion_dorsal_plate_${plate}`));
      }
      // Membres principaux
      for (let side = -1; side <= 1; side += 2) {
        root.add(this._segment(scorpionChitin, new T.Vector3(side * 0.42 * scale, 1.25 * scale, 0), new T.Vector3(side * 0.5 * scale, 0.4 * scale, 0.25 * scale), 0.12 * scale, 0.08 * scale, `scorpion_arm_${side}`, 10));
        root.add(this._segment(scorpionChitin, new T.Vector3(side * 0.3 * scale, 0.8 * scale, -0.15 * scale), new T.Vector3(side * 0.35 * scale, 0, -0.1 * scale), 0.13 * scale, 0.09 * scale, `scorpion_leg_${side}`, 10));
        // Pinces secondaires thoraciques
        root.add(this._cone(scorpionChitin, 0.05 * scale, 0.3 * scale, { x: side * 0.22 * scale, y: 0.95 * scale, z: 0.35 * scale }, { x: Math.PI / 4, y: side * 0.3, z: 0 }, `scorpion_pincer_${side}`));
      }
      // Queue scorpion articulée relevée vers l'avant au-dessus de la tête
      root.add(this._tube(scorpionChitin, [
        { x: 0, y: 0.7 * scale, z: -0.4 * scale },
        { x: 0, y: 1.4 * scale, z: -0.7 * scale },
        { x: 0, y: 2.1 * scale, z: -0.4 * scale },
        { x: 0, y: 2.3 * scale, z: 0.1 * scale }
      ], 0.08 * scale, 'scorpion_tail_arch', 12, 6));
      // Triple dard venimeux terminal luminescent
      root.add(this._cone(venomBarb, 0.07 * scale, 0.35 * scale, { x: 0, y: 2.25 * scale, z: 0.25 * scale }, { x: Math.PI / 2, y: 0, z: 0 }, 'scorpion_venom_sting'));

      return this._finalize(root, {
        modelType: 'adult',
        caste: 'scorpion_drone',
        height: 2.3 * scale,
        animationJoints: ['scorpion_head', 'scorpion_chest', 'scorpion_tail_arch']
      });
    }

    // -------------------------------------------------------------------------
    // Chantier 202 : Système de Brouilleur Thermique Infrarouge USCM M47 (Aliens: Dark Descent)
    // -------------------------------------------------------------------------
    createM47IRSmokeDispenser() {
      return this.createIndustrialProp('m47_ir_smoke_dispenser');
    }

    // -------------------------------------------------------------------------
    // Chantier 203 : Unité USCM "Recon Scout Sniper" (Aliens: Fireteam Elite)
    // -------------------------------------------------------------------------
    createReconScout() {
      return this.createHuman('uscm_recon_scout');
    }

    // -------------------------------------------------------------------------
    // Chantier 204 : Sas de Purge Caustique LN2 & Clapet Cryo-Flow C-50 (Alien 3 / Romulus)
    // -------------------------------------------------------------------------
    createCryoFlowC50() {
      return this.createIndustrialProp('cryo_flow_c50');
    }

    // -------------------------------------------------------------------------
    // Chantier 206 : Station de Dégazage Tokamak Supraconducteur Weyland (Aliens: Colonial Marines)
    // -------------------------------------------------------------------------
    createHyperdyneTokamakBleeder() {
      return this.createIndustrialProp('hyperdyne_tokamak_bleeder');
    }

    // -------------------------------------------------------------------------
    // Chantier 207 : Canalisations d'Argon Compressé 150 bars & Purge Anoxique (Alien: Isolation)
    // -------------------------------------------------------------------------
    createArgonManifoldPipe() {
      return this.createIndustrialProp('argon_manifold_pipe');
    }

    // -------------------------------------------------------------------------
    // Chantier 209 : Console de Télémesure MUTHUR 6000 "Atmospheric Scrubbing" (Alien 1979 / Isolation)
    // -------------------------------------------------------------------------
    createMuthurScrubberConsole() {
      return this.createIndustrialProp('muthur_scrubber_console');
    }

    // -------------------------------------------------------------------------
    // Chantier 210 : Autel de Gestation Ruche "Biomass Conversion Sarcophagus" (Aliens 1986 / Prometheus)
    // -------------------------------------------------------------------------
    createBiomassConversionSarcophagus() {
      return this.createIndustrialProp('biomass_conversion_sarcophagus');
    }

    // -------------------------------------------------------------------------
    // Chantier 211 : Phénotype "The Cougar / Panther Xenomorph de Charon" (Kenner 1992 / Dark Horse)
    // -------------------------------------------------------------------------
    createCougarDrone() {
      const T = this._three();
      const root = new T.Group();
      root.name = 'adult_cougar_drone';
      const scale = 1.0;

      const cougarChitin = this._material('carapace', {
        color: 0x0f172a,
        roughness: 0.2,
        metalness: 0.85
      });
      const tendonGlow = this._material('emissiveGreen', {
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 2.0
      });

      // Buste félin allongé et arqué bas
      root.add(this._ellipsoid(cougarChitin, { x: 0.42 * scale, y: 0.36 * scale, z: 0.65 * scale }, { x: 0, y: 0.95 * scale, z: 0 }, 'cougar_chest', 14));
      // Tête dôme fine et fuselée en proue féline
      root.add(this._ellipsoid(cougarChitin, { x: 0.24 * scale, y: 0.22 * scale, z: 0.72 * scale }, { x: 0, y: 1.08 * scale, z: 0.42 * scale }, 'cougar_head', 14));
      // 4 Membres quadrupèdes félins musclés
      for (let side = -1; side <= 1; side += 2) {
        // Membres antérieurs souples
        root.add(this._segment(cougarChitin, new T.Vector3(side * 0.35 * scale, 0.95 * scale, 0.22 * scale), new T.Vector3(side * 0.38 * scale, 0.05 * scale, 0.32 * scale), 0.11 * scale, 0.07 * scale, `cougar_foreleg_${side}`, 10));
        // Membres postérieurs hauts arqués pour le bond
        root.add(this._segment(cougarChitin, new T.Vector3(side * 0.32 * scale, 0.85 * scale, -0.25 * scale), new T.Vector3(side * 0.36 * scale, 0.05 * scale, -0.15 * scale), 0.14 * scale, 0.08 * scale, `cougar_hindleg_${side}`, 10));
        // Griffes rétractiles acérées
        for (let c = 0; c < 3; c++) {
          root.add(this._cone(cougarChitin, 0.02 * scale, 0.12 * scale, { x: (side * 0.38 + (c - 1) * 0.04) * scale, y: 0.05 * scale, z: 0.38 * scale }, { x: Math.PI / 4, y: 0, z: 0 }, `cougar_claw_${side}_${c}`));
        }
      }
      // Longue queue balistique souple terminée par une lame en diamant
      root.add(this._tube(cougarChitin, [
        { x: 0, y: 0.85 * scale, z: -0.45 * scale },
        { x: 0, y: 0.75 * scale, z: -0.9 * scale },
        { x: 0, y: 0.5 * scale, z: -1.35 * scale },
        { x: 0, y: 0.3 * scale, z: -1.7 * scale }
      ], 0.065 * scale, 'cougar_tail_tube', 14, 6));
      root.add(this._cone(tendonGlow, 0.05 * scale, 0.25 * scale, { x: 0, y: 0.25 * scale, z: -1.85 * scale }, { x: -Math.PI / 3, y: 0, z: 0 }, 'cougar_tail_blade'));

      return this._finalize(root, {
        modelType: 'adult',
        caste: 'cougar_drone',
        height: 1.35 * scale,
        animationJoints: ['cougar_head', 'cougar_chest']
      });
    }

    // -------------------------------------------------------------------------
    // Chantier 215 : Phénotype "The Swarm Hive Worker / Ouvrière de Ruche" (Genocide / AvP)
    // -------------------------------------------------------------------------
    createWorkerDrone() {
      const T = this._three();
      const root = new T.Group();
      root.name = 'adult_worker_drone';
      const scale = 0.96;

      const workerChitin = this._material('carapace', {
        color: 0x1e293b,
        roughness: 0.45,
        metalness: 0.55
      });
      const amberResin = this._material('emissiveAmber', {
        color: 0xd97706,
        emissive: 0xb45309,
        emissiveIntensity: 2.4
      });

      // Buste ramassé troglodyte
      root.add(this._ellipsoid(workerChitin, { x: 0.45 * scale, y: 0.42 * scale, z: 0.4 * scale }, { x: 0, y: 1.05 * scale, z: 0 }, 'worker_chest', 14));
      // Tête dôme striée trapue avec mandibules résineuses
      root.add(this._ellipsoid(workerChitin, { x: 0.28 * scale, y: 0.26 * scale, z: 0.58 * scale }, { x: 0, y: 1.35 * scale, z: 0.25 * scale }, 'worker_head', 14));
      // Glandes mandibulaires à sécrétion de résine
      for (let side = -1; side <= 1; side += 2) {
        root.add(this._ellipsoid(amberResin, { x: 0.08 * scale, y: 0.06 * scale, z: 0.1 * scale }, { x: side * 0.16 * scale, y: 1.25 * scale, z: 0.45 * scale }, `worker_gland_${side}`, 8));
        // Grosses griffes pelleteuses maçonnées sur les bras
        root.add(this._box(workerChitin, { x: 0.16 * scale, y: 0.22 * scale, z: 0.28 * scale }, { x: side * 0.45 * scale, y: 0.55 * scale, z: 0.3 * scale }, `worker_spade_claw_${side}`));
        root.add(this._segment(workerChitin, new T.Vector3(side * 0.38 * scale, 1.1 * scale, 0), new T.Vector3(side * 0.45 * scale, 0.45 * scale, 0.2 * scale), 0.13 * scale, 0.09 * scale, `worker_arm_${side}`, 10));
        root.add(this._segment(workerChitin, new T.Vector3(side * 0.28 * scale, 0.75 * scale, -0.15 * scale), new T.Vector3(side * 0.3 * scale, 0, -0.1 * scale), 0.14 * scale, 0.1 * scale, `worker_leg_${side}`, 10));
      }
      // Cheminées dorsales de résine
      for (let c = 0; c < 2; c++) {
        const side = c === 0 ? -1 : 1;
        root.add(this._cylinder(workerChitin, 0.06 * scale, 0.04 * scale, 0.4 * scale, { x: side * 0.18 * scale, y: 1.4 * scale, z: -0.22 * scale }, { x: -Math.PI / 6, y: side * 0.2, z: 0 }, `worker_chimney_${c}`));
      }
      // Queue robuste d'ancrage
      root.add(this._cone(workerChitin, 0.09 * scale, 0.75 * scale, { x: 0, y: 0.65 * scale, z: -0.55 * scale }, { x: -Math.PI / 3, y: 0, z: 0 }, 'worker_tail'));

      return this._finalize(root, {
        modelType: 'adult',
        caste: 'worker_drone',
        height: 1.6 * scale,
        animationJoints: ['worker_head', 'worker_chest']
      });
    }

    // -------------------------------------------------------------------------
    // Chantier 213 : Unité USCM "Combat Medic" (Aliens: Fireteam Elite)
    // -------------------------------------------------------------------------
    createCombatMedic() {
      return this.createHuman('uscm_combat_medic');
    }

    // -------------------------------------------------------------------------
    // Chantier 212 : Système de Brouilleur Électromagnétique USCM M56 (Aliens: Dark Descent)
    // -------------------------------------------------------------------------
    createM56JammerBox() {
      return this.createIndustrialProp('m56_jammer_box');
    }

    // -------------------------------------------------------------------------
    // Chantier 214 : Poste de Contrôle Cryo-Containment Chamber C-60 (Alien: Resurrection)
    // -------------------------------------------------------------------------
    createCryoChamberC60() {
      return this.createIndustrialProp('cryo_chamber_c60');
    }

    // -------------------------------------------------------------------------
    // Chantier 216 : Générateur Magnétique Weyland Arc-Furnace Inverter (Alien 3 / Isolation)
    // -------------------------------------------------------------------------
    createArcFurnaceInverter() {
      return this.createIndustrialProp('arc_furnace_inverter');
    }

    // -------------------------------------------------------------------------
    // Chantier 217 : Collecteur d'Éthylène Haute Température & Torche (Aliens 1986 / Romulus)
    // -------------------------------------------------------------------------
    createEthyleneFlarePipe() {
      return this.createIndustrialProp('ethylene_flare_pipe');
    }

    // -------------------------------------------------------------------------
    // Chantier 219 : Terminal Réseau C.A.S.A.I. Seegson Synthetic Security Override (Alien: Isolation)
    // -------------------------------------------------------------------------
    createSeegsonCasaiOverride() {
      return this.createIndustrialProp('seegson_casai_override');
    }

    // -------------------------------------------------------------------------
    // Chantier 220 : Couveuse Biologique "Bio-Stasis Preservation Vault" (Alien: Covenant / Romulus)
    // -------------------------------------------------------------------------
    createBioStasisVault() {
      return this.createIndustrialProp('bio_stasis_vault');
    }

    // -------------------------------------------------------------------------
    // Chantier 221 : Phénotype "The Rhino / Juggernaut Xenomorph de Charon" (Kenner 1992 / Dark Horse Genocide)
    // -------------------------------------------------------------------------
    createRhinoDrone() {
      const T = this._three();
      const root = new T.Group();
      root.name = 'adult_rhino_drone';
      const scale = 1.35;
      const rhinoChitin = this._material('chitin', {
        color: 0x1e293b,
        roughness: 0.18,
        metalness: 0.72
      });
      const hornBone = this._material('bone', {
        color: 0x94a3b8,
        roughness: 0.35,
        metalness: 0.25
      });
      const amberGlow = this._material('emissiveAmber', {
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 1.8
      });

      // Buste massif surdimensionné et armure pectorale renforcée
      root.add(this._ellipsoid(rhinoChitin, { x: 0.58 * scale, y: 0.52 * scale, z: 0.65 * scale }, { x: 0, y: 1.25 * scale, z: 0 }, 'rhino_chest', 16));
      root.add(this._ellipsoid(rhinoChitin, { x: 0.48 * scale, y: 0.44 * scale, z: 0.5 * scale }, { x: 0, y: 0.8 * scale, z: -0.25 * scale }, 'rhino_abdomen', 14));

      // Tête blindée en bélier avec double bouclier céphalique et corne frontale géante
      const headGroup = new T.Group();
      headGroup.name = 'rhino_head';
      headGroup.position.set(0, 1.5 * scale, 0.45 * scale);
      headGroup.add(this._ellipsoid(rhinoChitin, { x: 0.38 * scale, y: 0.32 * scale, z: 0.75 * scale }, { x: 0, y: 0, z: 0 }, 'rhino_cranium', 16));
      // Corne frontale conique massive perforante
      headGroup.add(this._cone(hornBone, 0.16 * scale, 0.85 * scale, { x: 0, y: 0.22 * scale, z: 0.65 * scale }, { x: Math.PI / 3.8, y: 0, z: 0 }, 'rhino_battering_horn'));
      // Bouclier nucal céphalique bivalve
      headGroup.add(this._box(rhinoChitin, { x: 0.78 * scale, y: 0.45 * scale, z: 0.2 * scale }, { x: 0, y: 0.35 * scale, z: -0.25 * scale }, 'rhino_neck_shield'));
      // Yeux résiduels bioluminescents ambrés sous le bouclier
      for (let s = -1; s <= 1; s += 2) {
        headGroup.add(this._ellipsoid(amberGlow, { x: 0.05 * scale, y: 0.05 * scale, z: 0.04 * scale }, { x: s * 0.22 * scale, y: 0.05 * scale, z: 0.3 * scale }, `rhino_eye_${s}`, 8));
      }
      root.add(headGroup);

      // Membres antérieurs et postérieurs pachydermiques
      for (let side = -1; side <= 1; side += 2) {
        // Épaulières blindées
        root.add(this._ellipsoid(rhinoChitin, { x: 0.25 * scale, y: 0.28 * scale, z: 0.28 * scale }, { x: side * 0.58 * scale, y: 1.35 * scale, z: 0.1 * scale }, `rhino_shoulder_${side}`, 12));
        // Avant-bras puissants terminés par de gros talons émoussés
        root.add(this._segment(rhinoChitin, new T.Vector3(side * 0.55 * scale, 1.3 * scale, 0.1 * scale), new T.Vector3(side * 0.62 * scale, 0.55 * scale, 0.35 * scale), 0.18 * scale, 0.14 * scale, `rhino_forearm_${side}`, 10));
        root.add(this._box(hornBone, { x: 0.22 * scale, y: 0.24 * scale, z: 0.32 * scale }, { x: side * 0.62 * scale, y: 0.5 * scale, z: 0.42 * scale }, `rhino_talon_${side}`));
        // Pattes arrières massives
        root.add(this._segment(rhinoChitin, new T.Vector3(side * 0.42 * scale, 0.85 * scale, -0.25 * scale), new T.Vector3(side * 0.46 * scale, 0, -0.2 * scale), 0.2 * scale, 0.15 * scale, `rhino_leg_${side}`, 10));
      }

      // Évents d'échappement dorsaux surdimensionnés
      for (let e = 0; e < 4; e++) {
        const side = e % 2 === 0 ? -1 : 1;
        const tier = e < 2 ? 0 : 1;
        root.add(this._cylinder(rhinoChitin, 0.08 * scale, 0.06 * scale, 0.55 * scale, { x: side * 0.26 * scale, y: (1.55 - tier * 0.22) * scale, z: (-0.15 - tier * 0.2) * scale }, { x: -Math.PI / 4, y: side * 0.25, z: 0 }, `rhino_exhaust_${e}`));
      }

      // Queue lourde garnie de pointes d'écrasement
      root.add(this._segment(rhinoChitin, new T.Vector3(0, 0.75 * scale, -0.5 * scale), new T.Vector3(0, 0.35 * scale, -1.2 * scale), 0.16 * scale, 0.1 * scale, 'rhino_tail_base', 8));
      root.add(this._cone(hornBone, 0.14 * scale, 0.6 * scale, { x: 0, y: 0.25 * scale, z: -1.45 * scale }, { x: -Math.PI / 3, y: 0, z: 0 }, 'rhino_tail_club'));

      return this._finalize(root, {
        modelType: 'adult',
        caste: 'rhino_drone',
        height: 1.85 * scale,
        animationJoints: ['rhino_head', 'rhino_chest']
      });
    }

    // -------------------------------------------------------------------------
    // Chantier 225 : Phénotype "The Killer Crab Xenomorph de Charon" (Kenner 1992 / Dark Horse)
    // -------------------------------------------------------------------------
    createCrabDrone() {
      const T = this._three();
      const root = new T.Group();
      root.name = 'adult_crab_drone';
      const scale = 1.25;
      const crabChitin = this._material('chitinWarm', {
        color: 0x331e28,
        roughness: 0.22,
        metalness: 0.68
      });
      const clawBone = this._material('bone', {
        color: 0xca8a04,
        roughness: 0.28,
        metalness: 0.35
      });
      const venomRuby = this._material('emissiveRed', {
        color: 0xef4444,
        emissive: 0xdc2626,
        emissiveIntensity: 2.2
      });

      // Carapace dorsale bivalve aplatie et cuirassée
      root.add(this._ellipsoid(crabChitin, { x: 0.62 * scale, y: 0.42 * scale, z: 0.55 * scale }, { x: 0, y: 1.15 * scale, z: 0 }, 'crab_carapace', 16));
      // Tête trapue sous visière crustacée
      root.add(this._ellipsoid(crabChitin, { x: 0.32 * scale, y: 0.28 * scale, z: 0.62 * scale }, { x: 0, y: 1.25 * scale, z: 0.35 * scale }, 'crab_head', 14));

      // Épines latérales de la carapace (spires de crustacé)
      for (let s = -1; s <= 1; s += 2) {
        root.add(this._cone(clawBone, 0.08 * scale, 0.42 * scale, { x: s * 0.72 * scale, y: 1.25 * scale, z: 0.05 * scale }, { x: 0, y: 0, z: -s * Math.PI / 2.5 }, `crab_spire_lateral_${s}`));
        root.add(this._cone(clawBone, 0.07 * scale, 0.38 * scale, { x: s * 0.65 * scale, y: 1.35 * scale, z: -0.2 * scale }, { x: -Math.PI / 6, y: 0, z: -s * Math.PI / 2.8 }, `crab_spire_rear_${s}`));
      }

      // Pinces chélipèdes géantes hypertrophiées
      for (let side = -1; side <= 1; side += 2) {
        // Bras articulé puissant
        root.add(this._segment(crabChitin, new T.Vector3(side * 0.55 * scale, 1.2 * scale, 0.15 * scale), new T.Vector3(side * 0.75 * scale, 0.7 * scale, 0.45 * scale), 0.16 * scale, 0.12 * scale, `crab_arm_${side}`, 10));
        // Corps de la pince
        root.add(this._box(crabChitin, { x: 0.24 * scale, y: 0.35 * scale, z: 0.42 * scale }, { x: side * 0.78 * scale, y: 0.6 * scale, z: 0.6 * scale }, `crab_chela_${side}`));
        // Mors mobile et fixe de la pince
        root.add(this._cone(clawBone, 0.1 * scale, 0.55 * scale, { x: side * 0.75 * scale, y: 0.75 * scale, z: 0.85 * scale }, { x: Math.PI / 6, y: side * 0.2, z: 0 }, `crab_claw_fixed_${side}`));
        root.add(this._cone(clawBone, 0.09 * scale, 0.5 * scale, { x: side * 0.82 * scale, y: 0.45 * scale, z: 0.82 * scale }, { x: -Math.PI / 8, y: -side * 0.15, z: 0 }, `crab_claw_mobile_${side}`));
        // Pattes locomotrices robustes
        root.add(this._segment(crabChitin, new T.Vector3(side * 0.38 * scale, 0.8 * scale, -0.2 * scale), new T.Vector3(side * 0.45 * scale, 0, -0.15 * scale), 0.16 * scale, 0.11 * scale, `crab_leg_${side}`, 10));
      }

      // Pinces pectorales de saisie thoracique
      root.add(this._ring(venomRuby, 0.18 * scale, 0.04 * scale, { x: 0, y: 1.05 * scale, z: 0.32 * scale }, { x: 0, y: 0, z: 0 }, 'crab_pectoral_trap'));

      // Queue articulée bivalve
      root.add(this._segment(crabChitin, new T.Vector3(0, 0.7 * scale, -0.45 * scale), new T.Vector3(0, 0.3 * scale, -1.15 * scale), 0.13 * scale, 0.08 * scale, 'crab_tail', 8));

      return this._finalize(root, {
        modelType: 'adult',
        caste: 'crab_drone',
        height: 1.7 * scale,
        animationJoints: ['crab_head', 'crab_carapace']
      });
    }

    // -------------------------------------------------------------------------
    // Chantier 223 : Unité USCM "Forward Observer / Recon Sniper" (Aliens: Dark Descent)
    // -------------------------------------------------------------------------
    createReconSniper() {
      return this.createHuman('uscm_recon_sniper');
    }

    // -------------------------------------------------------------------------
    // Chantier 222 : Système de Transit Mag-Lev "Weyland Heavy Transit Cart" (Alien: Isolation)
    // -------------------------------------------------------------------------
    createTransitMagCart() {
      return this.createIndustrialProp('transit_mag_cart');
    }

    // -------------------------------------------------------------------------
    // Chantier 224 : Système d'Extinction Halon 1301 Fire Suppression (Alien 1979)
    // -------------------------------------------------------------------------
    createHalonExtinguisher() {
      return this.createIndustrialProp('halon_extinguisher');
    }

    // -------------------------------------------------------------------------
    // Chantier 226 : Munitions USCM M20 Claymore Directional Mine (Aliens 1986)
    // -------------------------------------------------------------------------
    createM20ClaymoreMine() {
      return this.createIndustrialProp('m20_claymore_mine');
    }

    // -------------------------------------------------------------------------
    // Chantier 227 : Échangeur Thermique Processeur AP-14 (Aliens 1986 Hadleys Hope)
    // -------------------------------------------------------------------------
    createHeatExchangerVent() {
      return this.createIndustrialProp('heat_exchanger_vent');
    }

    // -------------------------------------------------------------------------
    // Chantier 228 : Camouflage Organique "Hive Resin Melding" (Alien: Isolation)
    // -------------------------------------------------------------------------
    createResinCamouflageWall() {
      return this.createIndustrialProp('resin_camouflage_wall');
    }

    // -------------------------------------------------------------------------
    // Chantier 229 : Boîtier Sevastopol Maintenance Jack Socket (Alien: Isolation)
    // -------------------------------------------------------------------------
    createMaintenanceJackSocket() {
      return this.createIndustrialProp('maintenance_jack_socket');
    }

    // -------------------------------------------------------------------------
    // Chantier 230 : Alcôve de Rechargement Inductif Working Joe (Alien: Isolation)
    // -------------------------------------------------------------------------
    createWorkingJoeAlcove() {
      return this.createIndustrialProp('working_joe_alcove');
    }

    // -------------------------------------------------------------------------
    // Chantier 231 : Hadley's Hope Drainage Sump & Catwalks (Aliens 1986)
    // -------------------------------------------------------------------------
    createHadleyDrainageSump() {
      return this.createIndustrialProp('hadley_drainage_sump');
    }

    // -------------------------------------------------------------------------
    // Chantier 232 : Sevastopol Habitation Duct Splitter (Alien: Isolation)
    // -------------------------------------------------------------------------
    createSevastopolDuctSplitter() {
      return this.createIndustrialProp('sevastopol_duct_splitter');
    }

    // -------------------------------------------------------------------------
    // Chantier 233 : Biocontainment Vault Alpha (Alien: Romulus)
    // -------------------------------------------------------------------------
    createBiocontainmentVaultAlpha() {
      return this.createIndustrialProp('biocontainment_vault_alpha');
    }

    // -------------------------------------------------------------------------
    // Chantier 234 : Nostromo Reactor Magnetic Ring (Alien 1979)
    // -------------------------------------------------------------------------
    createNostromoReactorRing() {
      return this.createIndustrialProp('nostromo_reactor_ring');
    }

    // -------------------------------------------------------------------------
    // Chantier 235 : Orbital Centrifuge Lab (Alien: Romulus)
    // -------------------------------------------------------------------------
    createOrbitalCentrifugeLab() {
      return this.createIndustrialProp('orbital_centrifuge_lab');
    }

    // -------------------------------------------------------------------------
    // Chantier 236 : USCM Munitions Bunker (Aliens: Dark Descent)
    // -------------------------------------------------------------------------
    createUscmMunitionsBunker() {
      return this.createIndustrialProp('uscm_munitions_bunker');
    }

    // -------------------------------------------------------------------------
    // Chantier 237 : Geothermal Vent Flue (Alien: Isolation)
    // -------------------------------------------------------------------------
    createGeothermalVentFlue() {
      return this.createIndustrialProp('geothermal_vent_flue');
    }

    // -------------------------------------------------------------------------
    // Chantier 238 : Hive Central Bio-Spire (Aliens 1986 / AvP)
    // -------------------------------------------------------------------------
    createHiveBioSpire() {
      return this.createIndustrialProp('hive_bio_spire');
    }

    // -------------------------------------------------------------------------
    // Chantier 239 : Jettison Explosive Bolt Console (Alien 1979 / Romulus)
    // -------------------------------------------------------------------------
    createJettisonBoltConsole() {
      return this.createIndustrialProp('jettison_bolt_console');
    }

    // -------------------------------------------------------------------------
    // Chantier 240 : Fiorina 161 Lead Smelting Channel (Alien 3)
    // -------------------------------------------------------------------------
    createFiorinaLeadChannel() {
      return this.createIndustrialProp('fiorina_lead_channel');
    }

    // -------------------------------------------------------------------------
    // Chantier 241 : Maintenance Gondola & Gantry Crane (Alien 1979)
    // -------------------------------------------------------------------------
    createMaintenanceGondola() {
      return this.createIndustrialProp('nostromo_maintenance_gondola');
    }

    // -------------------------------------------------------------------------
    // Chantier 242 : Synthetic Containment Cell (Alien: Isolation)
    // -------------------------------------------------------------------------
    createSyntheticContainmentCell() {
      return this.createIndustrialProp('sevastopol_synthetic_cell');
    }

    // -------------------------------------------------------------------------
    // Chantier 243 : Shaft Fan Rotor Blade Slicer (Alien 3)
    // -------------------------------------------------------------------------
    createVentilationFanRotor() {
      return this.createIndustrialProp('fiorina_shaft_fan');
    }

    // -------------------------------------------------------------------------
    // Chantier 244 : Atmospheric Scrubber Column (Aliens 1986)
    // -------------------------------------------------------------------------
    createAtmosphericScrubberColumn() {
      return this.createIndustrialProp('hadley_scrubber_column');
    }

    // -------------------------------------------------------------------------
    // Chantier 245 : Gravity Inversion Chamber (Alien: Romulus)
    // -------------------------------------------------------------------------
    createGravityInversionChamber() {
      return this.createIndustrialProp('gravity_inversion_chamber');
    }

    // -------------------------------------------------------------------------
    // Chantier 246 : USCM Sentry Barricade Redoubt (Aliens: Dark Descent)
    // -------------------------------------------------------------------------
    createUscmSentryBarricade() {
      return this.createIndustrialProp('uscm_sentry_barricade');
    }

    // -------------------------------------------------------------------------
    // Chantier 247 : Auriga Flooded Cargo Bay (Alien Resurrection 1997)
    // -------------------------------------------------------------------------
    createFloodedCargoBay() {
      return this.createIndustrialProp('auriga_flooded_bay');
    }

    // -------------------------------------------------------------------------
    // Chantier 248 : Apollo AI Server Core Tower (Alien: Isolation)
    // -------------------------------------------------------------------------
    createApolloServerTower() {
      return this.createIndustrialProp('apollo_server_tower');
    }

    // -------------------------------------------------------------------------
    // Chantier 249 : Specimen Dissection Theater (Alien: Romulus / Resurrection)
    // -------------------------------------------------------------------------
    createSpecimenDissectionTheater() {
      return this.createIndustrialProp('specimen_dissection_theater');
    }

    // -------------------------------------------------------------------------
    // Chantier 250 : Fiorina Piston Slag Press (Alien 3)
    // -------------------------------------------------------------------------
    createSlagCruciblePress() {
      return this.createIndustrialProp('fiorina_slag_press');
    }

    // -------------------------------------------------------------------------
    // Chantier 251 : Nostromo Cryo-Vault Central Matrix (Alien 1979)
    // -------------------------------------------------------------------------
    createCryoVaultMatrix() {
      return this.createIndustrialProp('cryo_vault_matrix');
    }

    // -------------------------------------------------------------------------
    // Chantier 252 : Operations Chasm Retractable Bridge (Aliens 1986)
    // -------------------------------------------------------------------------
    createOperationsChasmBridge() {
      return this.createIndustrialProp('chasm_retractable_bridge');
    }

    // -------------------------------------------------------------------------
    // Chantier 253 : Fiorina 161 Toxic Quench Basin (Alien 3)
    // -------------------------------------------------------------------------
    createToxicQuenchBasin() {
      return this.createIndustrialProp('toxic_quench_basin');
    }

    // -------------------------------------------------------------------------
    // Chantier 254 : Auriga Incubation Observation Lab Window (Alien Resurrection)
    // -------------------------------------------------------------------------
    createObservationLabWindow() {
      return this.createIndustrialProp('observation_lab_window');
    }

    // -------------------------------------------------------------------------
    // Chantier 255 : Renaissance Cryo-Fuel Centrifuge Rotor (Alien: Romulus)
    // -------------------------------------------------------------------------
    createCryoFuelCentrifuge() {
      return this.createIndustrialProp('cryo_fuel_centrifuge');
    }

    // -------------------------------------------------------------------------
    // Chantier 256 : Sevastopol Transit Rail Switch & 3rd Rail (Alien: Isolation)
    // -------------------------------------------------------------------------
    createTransitRailSwitch() {
      return this.createIndustrialProp('transit_rail_switch');
    }

    // -------------------------------------------------------------------------
    // Chantier 257 : MedLab Autopsy Sump Drain Chute (Aliens 1986)
    // -------------------------------------------------------------------------
    createMedLabAutopsyChute() {
      return this.createIndustrialProp('medlab_autopsy_chute');
    }

    // -------------------------------------------------------------------------
    // Chantier 258 : USCM Vehicle Maintenance Crane Arm (Aliens: Dark Descent)
    // -------------------------------------------------------------------------
    createVehicleCraneArm() {
      return this.createIndustrialProp('vehicle_crane_arm');
    }

    // -------------------------------------------------------------------------
    // Chantier 259 : Sevastopol Lorenz Comms Uplink Dish (Alien: Isolation)
    // -------------------------------------------------------------------------
    createLorenzCommsDish() {
      return this.createIndustrialProp('lorenz_comms_dish');
    }

    // -------------------------------------------------------------------------
    // Chantier 260 : Renaissance Station Corbel Docking Clamp (Alien: Romulus)
    // -------------------------------------------------------------------------
    createCorbelDockingClamp() {
      return this.createIndustrialProp('corbel_docking_clamp');
    }

    // -------------------------------------------------------------------------
    // Chantier 261 : Nostromo Narcissus Boarding Ramp (Alien 1979)
    // -------------------------------------------------------------------------
    createNarcissusBoardingRamp() {
      return this.createIndustrialProp('narcissus_boarding_ramp');
    }

    // -------------------------------------------------------------------------
    // Chantier 262 : Hadley's Hope Seismic Stabilizer Piston (Aliens 1986)
    // -------------------------------------------------------------------------
    createSeismicStabilizerPiston() {
      return this.createIndustrialProp('seismic_stabilizer_piston');
    }

    // -------------------------------------------------------------------------
    // Chantier 263 : Fiorina 161 Furnace Bellows Duct (Alien 3)
    // -------------------------------------------------------------------------
    createFurnaceBellowsDuct() {
      return this.createIndustrialProp('furnace_bellows_duct');
    }

    // -------------------------------------------------------------------------
    // Chantier 264 : Auriga Cryo-Surgical Stasis Sarcophagus (Alien Resurrection)
    // -------------------------------------------------------------------------
    createCryoSurgicalSarcophagus() {
      return this.createIndustrialProp('cryo_surgical_sarcophagus');
    }

    // -------------------------------------------------------------------------
    // Chantier 265 : Renaissance Station Fuel Siphon Pylon (Alien: Romulus)
    // -------------------------------------------------------------------------
    createFuelSiphonPylon() {
      return this.createIndustrialProp('fuel_siphon_pylon');
    }

    // -------------------------------------------------------------------------
    // Chantier 266 : Sevastopol Security Roll-Up Shutter (Alien: Isolation)
    // -------------------------------------------------------------------------
    createSecurityShutterDoor() {
      return this.createIndustrialProp('security_shutter_door');
    }

    // -------------------------------------------------------------------------
    // Chantier 267 : Processing Sump Siphon (Aliens 1986)
    // -------------------------------------------------------------------------
    createProcessingSumpSiphon() {
      return this.createIndustrialProp('processing_sump_siphon');
    }

    // -------------------------------------------------------------------------
    // Chantier 268 : USCM Munitions Heavy Pallet (Aliens: Dark Descent)
    // -------------------------------------------------------------------------
    createMunitionsHeavyPallet() {
      return this.createIndustrialProp('munitions_heavy_pallet');
    }

    // -------------------------------------------------------------------------
    // Chantier 269 : Sevastopol Synthetic Recharge Bay (Alien: Isolation)
    // -------------------------------------------------------------------------
    createSyntheticRechargeBay() {
      return this.createIndustrialProp('synthetic_recharge_bay');
    }

    // -------------------------------------------------------------------------
    // Chantier 270 : Fiorina Foundry Gantry Overhead Hoist (Alien 3)
    // -------------------------------------------------------------------------
    createFoundryGantryHoist() {
      return this.createIndustrialProp('foundry_gantry_hoist');
    }

    // -------------------------------------------------------------------------
    // Chantier 271 : Nostromo E-Deck Coolant Air-Lock Escape Hatch (Alien 1979)
    // -------------------------------------------------------------------------
    createNostromoCoolantHatch() {
      return this.createIndustrialProp('nostromo_coolant_hatch');
    }

    // -------------------------------------------------------------------------
    // Chantier 272 : Hadley's Hope Atmosphere Processor Core Coolant Flume (Aliens 1986)
    // -------------------------------------------------------------------------
    createHadleyCoolantFlume() {
      return this.createIndustrialProp('hadley_coolant_flume');
    }

    // -------------------------------------------------------------------------
    // Chantier 273 : Fiorina 161 Ventilation Shaft Heavy Counterweight Piston (Alien 3)
    // -------------------------------------------------------------------------
    createFiorinaCounterweightPiston() {
      return this.createIndustrialProp('fiorina_counterweight_piston');
    }

    // -------------------------------------------------------------------------
    // Chantier 274 : USM Auriga Gene-Sequencing Bioreactor Dome (Alien Resurrection)
    // -------------------------------------------------------------------------
    createAurigaBioreactorDome() {
      return this.createIndustrialProp('auriga_bioreactor_dome');
    }

    // -------------------------------------------------------------------------
    // Chantier 275 : Renaissance Station Remus Module Cargo Gantry Rail (Alien: Romulus)
    // -------------------------------------------------------------------------
    createRemusGantryRail() {
      return this.createIndustrialProp('remus_gantry_rail');
    }

    // -------------------------------------------------------------------------
    // Chantier 276 : Sevastopol Seegson Synthetic Testing Chamber Observation Booth (Alien: Isolation)
    // -------------------------------------------------------------------------
    createSeegsonTestBooth() {
      return this.createIndustrialProp('seegson_test_booth');
    }

    // -------------------------------------------------------------------------
    // Chantier 277 : Hadley's Hope MedLab Incubator Battery Rack (Aliens 1986)
    // -------------------------------------------------------------------------
    createMedlabIncubatorRack() {
      return this.createIndustrialProp('medlab_incubator_rack');
    }

    // -------------------------------------------------------------------------
    // Chantier 278 : USCM Sentry Bunker Perimeter Sandbag Emplacement (Aliens: Dark Descent)
    // -------------------------------------------------------------------------
    createUscmSandbagBunker() {
      return this.createIndustrialProp('uscm_sandbag_bunker');
    }

    // -------------------------------------------------------------------------
    // Chantier 279 : Sevastopol Habitation Air Circulation Louver Shutter (Alien: Isolation)
    // -------------------------------------------------------------------------
    createHabitationLouverShutter() {
      return this.createIndustrialProp('habitation_louver_shutter');
    }

    // -------------------------------------------------------------------------
    // Chantier 280 : Fiorina 161 Sub-Basement Quench Pit Grate & Overflow Weir (Alien 3)
    // -------------------------------------------------------------------------
    createQuenchOverflowWeir() {
      return this.createIndustrialProp('quench_overflow_weir');
    }

    // -------------------------------------------------------------------------
    // Chantier 281 : Nostromo Hypersleep Vault Central Cooling Blower (Alien 1979)
    // -------------------------------------------------------------------------
    createNostromoCoolingBlower() {
      return this.createIndustrialProp('nostromo_cooling_blower');
    }

    // -------------------------------------------------------------------------
    // Chantier 282 : Hadley's Hope Operations Tactical Holo-Table (Aliens 1986)
    // -------------------------------------------------------------------------
    createHadleyTacticalTable() {
      return this.createIndustrialProp('hadley_tactical_table');
    }

    // -------------------------------------------------------------------------
    // Chantier 283 : Fiorina 161 Molten Lead Drainage Sluice (Alien 3)
    // -------------------------------------------------------------------------
    createFiorinaLeadSluice() {
      return this.createIndustrialProp('fiorina_lead_sluice');
    }

    // -------------------------------------------------------------------------
    // Chantier 284 : USM Auriga Xenomorph Specimen Holding Cage (Alien Resurrection)
    // -------------------------------------------------------------------------
    createAurigaHoldingCage() {
      return this.createIndustrialProp('auriga_holding_cage');
    }

    // -------------------------------------------------------------------------
    // Chantier 285 : Renaissance Station Romulus Module Cryo-Stasis Carousel (Alien: Romulus)
    // -------------------------------------------------------------------------
    createRomulusStasisCarousel() {
      return this.createIndustrialProp('romulus_stasis_carousel');
    }

    // -------------------------------------------------------------------------
    // Chantier 286 : Sevastopol Habitation Transit Monorail Buffer Stop (Alien: Isolation)
    // -------------------------------------------------------------------------
    createMonorailBufferStop() {
      return this.createIndustrialProp('monorail_buffer_stop');
    }

    // -------------------------------------------------------------------------
    // Chantier 287 : Hadley's Hope Power Plant Steam Superheater (Aliens 1986)
    // -------------------------------------------------------------------------
    createSteamSuperheater() {
      return this.createIndustrialProp('steam_superheater');
    }

    // -------------------------------------------------------------------------
    // Chantier 288 : USCM Armory Heavy Weapon Wall Racks (Aliens: Dark Descent)
    // -------------------------------------------------------------------------
    createUscmWeaponRack() {
      return this.createIndustrialProp('uscm_weapon_rack');
    }

    // -------------------------------------------------------------------------
    // Chantier 289 : Sevastopol Seegson Synthetic Assembly Station (Alien: Isolation)
    // -------------------------------------------------------------------------
    createSyntheticAssemblyStation() {
      return this.createIndustrialProp('synthetic_assembly_station');
    }

    // -------------------------------------------------------------------------
    // Chantier 290 : Fiorina 161 Furnace Air Intake Siphon Flange (Alien 3)
    // -------------------------------------------------------------------------
    createFurnaceAirIntake() {
      return this.createIndustrialProp('furnace_air_intake');
    }

    // -------------------------------------------------------------------------
    // Chantier 291 : Nostromo Catwalk Overhead Monorail Hoist & Winch Drum (Alien 1979)
    // -------------------------------------------------------------------------
    createNostromoMonorailHoist() {
      return this.createIndustrialProp('nostromo_monorail_hoist');
    }

    // -------------------------------------------------------------------------
    // Chantier 292 : Hadley's Hope Operations Emergency Battery Bank (Aliens 1986)
    // -------------------------------------------------------------------------
    createHadleyBatteryBank() {
      return this.createIndustrialProp('hadley_battery_bank');
    }

    // -------------------------------------------------------------------------
    // Chantier 293 : Fiorina 161 Heavy Quench Tank Immersion Basket (Alien 3)
    // -------------------------------------------------------------------------
    createFiorinaQuenchBasket() {
      return this.createIndustrialProp('fiorina_quench_basket');
    }

    // -------------------------------------------------------------------------
    // Chantier 294 : USM Auriga Surgical Cryo-Centrifuge & Fluid Separator (Alien Resurrection)
    // -------------------------------------------------------------------------
    createAurigaCryoCentrifuge() {
      return this.createIndustrialProp('auriga_cryo_centrifuge');
    }

    // -------------------------------------------------------------------------
    // Chantier 295 : Renaissance Station Romulus Module Fuel Transfer Manifold (Alien: Romulus)
    // -------------------------------------------------------------------------
    createRomulusFuelManifold() {
      return this.createIndustrialProp('romulus_fuel_manifold');
    }

    // -------------------------------------------------------------------------
    // Chantier 296 : Sevastopol Habitation Luggage Conveyor Belt & Baggage Scanner (Alien: Isolation)
    // -------------------------------------------------------------------------
    createSevastopolBaggageScanner() {
      return this.createIndustrialProp('sevastopol_baggage_scanner');
    }

    // -------------------------------------------------------------------------
    // Chantier 297 : Hadley's Hope Atmosphere Processor Steam Turbogenerator (Aliens 1986)
    // -------------------------------------------------------------------------
    createHadleySteamTurbogenerator() {
      return this.createIndustrialProp('hadley_steam_turbogenerator');
    }

    // -------------------------------------------------------------------------
    // Chantier 298 : USCM Armory Ballistic Test Chamber & Gel Block Sled (Aliens: Dark Descent)
    // -------------------------------------------------------------------------
    createUscmBallisticSled() {
      return this.createIndustrialProp('uscm_ballistic_sled');
    }

    // -------------------------------------------------------------------------
    // Chantier 299 : Sevastopol Apollo Data Conduit Cable Tray & Fiber Bus (Alien: Isolation)
    // -------------------------------------------------------------------------
    createSevastopolApolloCableTray() {
      return this.createIndustrialProp('sevastopol_apollo_cable_tray');
    }

    // -------------------------------------------------------------------------
    // Chantier 300 : Fiorina 161 Foundry Blast Furnace Tuyere & Oxygen Lance (Alien 3)
    // -------------------------------------------------------------------------
    createFiorinaBlastTuyere() {
      return this.createIndustrialProp('fiorina_blast_tuyere');
    }

    // Chantiers 301 à 310 (Vague 31)
    createNostromoEvaLocker() { return this.createIndustrialProp('nostromo_eva_locker'); }
    createHadleyDropshipFuelCart() { return this.createIndustrialProp('hadley_dropship_fuel_cart'); }
    createFiorinaBunkBlock() { return this.createIndustrialProp('fiorina_bunk_block'); }
    createAurigaAmnioticTanks() { return this.createIndustrialProp('auriga_amniotic_tanks'); }
    createRomulusSpindleHandrail() { return this.createIndustrialProp('romulus_spindle_handrail'); }
    createSevastopolSecurityTurnstile() { return this.createIndustrialProp('sevastopol_security_turnstile'); }
    createHadleyRadioMastRack() { return this.createIndustrialProp('hadley_radio_mast_rack'); }
    createUscmDropshipCargoWinch() { return this.createIndustrialProp('uscm_dropship_cargo_winch'); }
    createSevastopolControlRodGantry() { return this.createIndustrialProp('sevastopol_control_rod_gantry'); }
    createFiorinaIngotMoldRack() {
      return this.createIndustrialProp('fiorina_ingot_mold_rack');
    }

    // Chantiers 311 à 320 (Vague 32)
    createNostromoGalleyTable() { return this.createIndustrialProp('nostromo_galley_table'); }
    createHadleyHydroponicPlanter() { return this.createIndustrialProp('hadley_hydroponic_planter'); }
    createFiorinaChapelAltar() { return this.createIndustrialProp('fiorina_chapel_altar'); }
    createAurigaCommandConsole() { return this.createIndustrialProp('auriga_command_console'); }
    createRomulusCryoPodRack() { return this.createIndustrialProp('romulus_cryo_pod_rack'); }
    createSevastopolMedicalBed() { return this.createIndustrialProp('sevastopol_medical_bed'); }
    createHadleyHangarChainHoist() { return this.createIndustrialProp('hadley_hangar_chain_hoist'); }
    createUscmSmartgunRig() { return this.createIndustrialProp('uscm_smartgun_rig'); }
    createSevastopolVendingRow() { return this.createIndustrialProp('sevastopol_vending_row'); }
    createFiorinaAutopsyTable() {
      return this.createIndustrialProp('fiorina_autopsy_table');
    }

    // Chantiers 321 à 330 (Vague 33)
    createNostromoAirlockCyclingValve() { return this.createIndustrialProp('nostromo_airlock_cycling_valve'); }
    createHadleySeismicSurveyDrill() { return this.createIndustrialProp('hadley_seismic_survey_drill'); }
    createFiorinaToxicSludgeCentrifuge() { return this.createIndustrialProp('fiorina_toxic_sludge_centrifuge'); }
    createAurigaSpecimenAutopsyRig() { return this.createIndustrialProp('auriga_specimen_autopsy_rig'); }
    createRomulusCentrifugalRingPylon() { return this.createIndustrialProp('romulus_centrifugal_ring_pylon'); }
    createSevastopolTransitTurnstileGate() { return this.createIndustrialProp('sevastopol_transit_turnstile_gate'); }
    createHadleySublevelSumpPump() { return this.createIndustrialProp('hadley_sublevel_sump_pump'); }
    createUscmDropBeaconTripod() { return this.createIndustrialProp('uscm_drop_beacon_tripod'); }
    createSevastopolMaintenanceScaffold() { return this.createIndustrialProp('sevastopol_maintenance_scaffold'); }
    createFiorinaSmelterTappingSpout() {
      return this.createIndustrialProp('fiorina_smelter_tapping_spout');
    }

    // Chantiers 331 à 340 (Vague 34)
    createNostromoCryoRefrigerationCompressor() { return this.createIndustrialProp('nostromo_cryo_refrigeration_compressor'); }
    createHadleyOperationsRelaySwitchboard() { return this.createIndustrialProp('hadley_operations_relay_switchboard'); }
    createFiorinaVentilationSilencerBaffle() { return this.createIndustrialProp('fiorina_ventilation_silencer_baffle'); }
    createAurigaEmbryoCryoStorageVault() { return this.createIndustrialProp('auriga_embryo_cryo_storage_vault'); }
    createRomulusDockingUmbilicalCoupling() { return this.createIndustrialProp('romulus_docking_umbilical_coupling'); }
    createSevastopolSeegsonSecurityCheckpointDesk() { return this.createIndustrialProp('sevastopol_seegson_security_checkpoint_desk'); }
    createHadleySublevelWaterSeparator() { return this.createIndustrialProp('hadley_sublevel_water_separator'); }
    createUscmM577ApcWheelChockRack() { return this.createIndustrialProp('uscm_m577_apc_wheel_chock_rack'); }
    createSevastopolLuggageLockersBank() { return this.createIndustrialProp('sevastopol_luggage_lockers_bank'); }
    createFiorinaLeadRefiningSkimmer() {
      return this.createIndustrialProp('fiorina_lead_refining_skimmer');
    }

    // Chantiers 341 à 350 (Vague 35)
    createNostromoAvionicsTransformerStation() { return this.createIndustrialProp('nostromo_avionics_transformer_station'); }
    createHadleyTractorRefuelingGantry() { return this.createIndustrialProp('hadley_tractor_refueling_gantry'); }
    createFiorinaCastingLadleCrucible() { return this.createIndustrialProp('fiorina_casting_ladle_crucible'); }
    createAurigaBiohazardIncinerationSluice() { return this.createIndustrialProp('auriga_biohazard_incineration_sluice'); }
    createRomulusGyroStabilizerGimbal() { return this.createIndustrialProp('romulus_gyro_stabilizer_gimbal'); }
    createSevastopolSeegsonFreightPalletTurntable() { return this.createIndustrialProp('sevastopol_seegson_freight_pallet_turntable'); }
    createHadleySublevelSewerGrateSluice() { return this.createIndustrialProp('hadley_sublevel_sewer_grate_sluice'); }
    createUscmMotionTrackerRechargeDepot() { return this.createIndustrialProp('uscm_motion_tracker_recharge_depot'); }
    createSevastopolSyntheticChargingAlcoveAlt() { return this.createIndustrialProp('sevastopol_synthetic_charging_alcove_alt'); }
    createFiorinaCraneCounterweightStack() {
      return this.createIndustrialProp('fiorina_crane_counterweight_stack');
    }
    createNostromoMhdGenerator() { return this.createIndustrialProp('nostromo_mhd_generator'); }
    createHadleySeismicStabilizerJack() { return this.createIndustrialProp('hadley_seismic_stabilizer_jack'); }
    createFiorinaChemicalNeutralizationVat() { return this.createIndustrialProp('fiorina_chemical_neutralization_vat'); }
    createAurigaCryoMicrotomeWorkbench() { return this.createIndustrialProp('auriga_cryo_microtome_workbench'); }
    createRomulusDockingClampArm() { return this.createIndustrialProp('romulus_docking_clamp_arm'); }
    createSevastopolSyntheticMaintenanceRig() { return this.createIndustrialProp('sevastopol_synthetic_maintenance_rig'); }
    createHadleyMoistureScrubberColumn() { return this.createIndustrialProp('hadley_moisture_scrubber_column'); }
    createUscmSentryAmmoHoist() { return this.createIndustrialProp('uscm_sentry_ammo_hoist'); }
    createSevastopolTransitMaintenanceCart() { return this.createIndustrialProp('sevastopol_transit_maintenance_cart'); }
    createFiorinaOrePulverizerJaw() { return this.createIndustrialProp('fiorina_ore_pulverizer_jaw'); }
    // Nouvelles Castes Xénomorphiques
    createCharger() { return this.createAdult('charger'); }
    createInfiltrator() { return this.createAdult('infiltrator'); }
    createPathogenStalker() { return this.createAdult('pathogen_stalker'); }
    createSnakeAlien() { return this.createAdult('snake_alien'); }
    createSpiderAlien() { return this.createAdult('spider_alien'); }
    createFlyingQueen() { return this.createAdult('flying_queen'); }
    createQueenMother() { return this.createAdult('queen_mother'); }
    createChrysalisWarrior() { return this.createAdult('chrysalis_warrior'); }
    // Nouveaux Ennemis USCM
    createDemolitionist() { return this.createHuman('uscm_demolitionist'); }
    createPhalanxShield() { return this.createHuman('uscm_phalanx_shield'); }
    createSentrySapper() { return this.createHuman('uscm_sentry_sapper'); }
    createFieldCommander() { return this.createHuman('uscm_field_commander'); }
    createBreacherShotgun() { return this.createHuman('uscm_breacher_shotgun'); }
    createExosuitCommando() { return this.createHuman('uscm_exosuit_commando'); }
    // Nouveaux Ennemis Weyland-Yutani & Seegson
    createHazmatJoe() { return this.createHuman('seegson_hazmat_joe'); }
    createSecurityJoe() { return this.createHuman('seegson_security_joe'); }
    createStrikeSynth() { return this.createHuman('weyland_strike_synth'); }
    createSpecimenTrapper() { return this.createHuman('weyland_specimen_trapper'); }
    createDirectorOfficer() { return this.createHuman('weyland_director_officer'); }
    createHeavyMech() { return this.createHuman('weyland_heavy_mech'); }
    // Vague 37 Props
    createNostromoTurbulatedHeatExchanger() { return this.createIndustrialProp('nostromo_turbulated_heat_exchanger'); }
    createHadleyOverheadCraneTrolley() { return this.createIndustrialProp('hadley_overhead_crane_trolley'); }
    createFiorinaSlagPreheaterStand() { return this.createIndustrialProp('fiorina_slag_preheater_stand'); }
    createAurigaCryoFreonCascadeTank() { return this.createIndustrialProp('auriga_cryo_freon_cascade_tank'); }
    createRomulusDebrisDeflectorGrille() { return this.createIndustrialProp('romulus_debris_deflector_grille'); }
    createSevastopolSyntheticQaGantry() { return this.createIndustrialProp('sevastopol_synthetic_qa_gantry'); }
    createHadleySumpScumSkimmer() { return this.createIndustrialProp('hadley_sump_scum_skimmer'); }
    createUscmM20ClaymorePod() { return this.createIndustrialProp('uscm_m20_claymore_pod'); }
    createSevastopolBaggageConveyorTrack() { return this.createIndustrialProp('sevastopol_baggage_conveyor_track'); }
    createFiorinaBlastAirPreheatStove() { return this.createIndustrialProp('fiorina_blast_air_preheat_stove'); }
  }

  // ---------------------------------------------------------------------------
  // 14. GLOBAL BROWSER API
  // ---------------------------------------------------------------------------
  global.HiveModelFactory = new HiveModelFactoryRuntime();
}(typeof window !== 'undefined' ? window : globalThis));
