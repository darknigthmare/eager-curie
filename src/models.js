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
    uscm_combat_engineer: 'uscm_combat_engineer'
  });

  // ---------------------------------------------------------------------------
  // 1. FACTORY BOOTSTRAP & SHARED CONSTANTS
  // ---------------------------------------------------------------------------
  class HiveModelFactoryRuntime {
    constructor() {
      this.textures = {
        resin: null,
        carapace: null,
        industrial: null,
        organicBump: null
      };
      this.texturePaths = {
        resin: 'assets/textures/hive-resin.png',
        carapace: 'assets/textures/carapace.png',
        industrial: 'assets/textures/industrial-panels.png',
        organicBump: 'assets/textures/organic-bump.png'
      };
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
          texture.repeat.set(key === 'industrial' ? 2 : 1.5, key === 'industrial' ? 2 : 1.5);
          texture.anisotropy = 4;
          if (key !== 'organicBump' && T.sRGBEncoding !== undefined) {
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
          color: 0x0c121e,
          roughness: 0.16,
          metalness: 0.58
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
      const material = new T.MeshStandardMaterial(params);
      material.userData.hiveMaterialKind = kind;
      this._applyManagedTexture(material);
      this._managedMaterials.add(material);
      material.addEventListener('dispose', () => this._managedMaterials.delete(material));
      return material;
    }

    _applyManagedTexture(material) {
      const kind = material.userData.hiveMaterialKind;
      if (kind === 'chitin' || kind === 'chitinWarm') {
        material.map = this.textures.carapace || null;
        material.bumpMap = this.textures.organicBump || null;
        material.bumpScale = kind === 'chitin' ? 0.16 : 0.1;
      } else if (kind === 'resin') {
        material.map = this.textures.resin || null;
        material.bumpMap = this.textures.organicBump || null;
        material.bumpScale = 0.22;
      } else if (kind === 'industrial' || kind === 'darkMetal') {
        material.map = this.textures.industrial || null;
      }
      material.needsUpdate = true;
    }

    _refreshManagedMaterials() {
      this._managedMaterials.forEach((material) => this._applyManagedTexture(material));
    }

    // -------------------------------------------------------------------------
    // 3. DISPOSAL-FRIENDLY MODEL OWNERSHIP
    // -------------------------------------------------------------------------
    _finalize(root, metadata) {
      root.userData = Object.assign(root.userData || {}, metadata || {});
      this._buildAnimationRig(root);
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
      if (!root || !root.traverse) return;
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
      const mesh = new T.Mesh(geometry, material);
      mesh.name = name || 'detail';
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    }

    _ellipsoid(material, scale, position, name, segments) {
      const T = this._three();
      const resolution = Math.max(32, Math.round((segments || 16) * 2.5));
      const heightSegments = Math.max(24, Math.round(resolution * 0.75));
      const mesh = this._mesh(
        new T.SphereGeometry(1, resolution, heightSegments),
        material,
        name
      );
      mesh.scale.set(scale.x, scale.y, scale.z);
      mesh.position.set(position.x, position.y, position.z);
      return mesh;
    }

    _box(material, size, position, name, bevelHint) {
      const T = this._three();
      const subdivisions = bevelHint ? 4 : 2;
      const mesh = this._mesh(
        new T.BoxGeometry(size.x, size.y, size.z, subdivisions, subdivisions, subdivisions),
        material,
        name
      );
      mesh.position.set(position.x, position.y, position.z);
      return mesh;
    }

    _segment(material, start, end, radiusStart, radiusEnd, name, radialSegments) {
      const T = this._three();
      const direction = new T.Vector3().subVectors(end, start);
      const length = Math.max(0.001, direction.length());
      const radSeg = Math.max(20, Math.round((radialSegments || 8) * 2.5));
      const mesh = this._mesh(
        new T.CylinderGeometry(
          radiusEnd === undefined ? radiusStart : radiusEnd,
          radiusStart,
          length,
          radSeg,
          2,
          false
        ),
        material,
        name
      );
      mesh.position.copy(start).add(end).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(
        new T.Vector3(0, 1, 0),
        direction.normalize()
      );
      return mesh;
    }

    _joint(material, position, radius, name) {
      return this._ellipsoid(
        material,
        { x: radius, y: radius, z: radius },
        position,
        name,
        24
      );
    }

    _tube(material, points, radius, name, tubularSegments, radialSegments) {
      const T = this._three();
      const curve = new T.CatmullRomCurve3(points.map((point) => (
        new T.Vector3(point.x, point.y, point.z)
      )));
      const tubSeg = Math.max(48, Math.round((tubularSegments || 24) * 2));
      const radSeg = Math.max(16, Math.round((radialSegments || 7) * 2.5));
      return this._mesh(
        new T.TubeGeometry(curve, tubSeg, radius, radSeg, false),
        material,
        name
      );
    }

    _coneAlong(material, base, direction, radius, length, name, radialSegments) {
      const T = this._three();
      const normalized = new T.Vector3(direction.x, direction.y, direction.z).normalize();
      const radSeg = Math.max(20, Math.round((radialSegments || 7) * 2.5));
      const mesh = this._mesh(
        new T.ConeGeometry(radius, length, radSeg),
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
        new T.TorusGeometry(majorRadius, tubeRadius, 16, 48, arc === undefined ? Math.PI * 2 : arc),
        material,
        name
      );
      mesh.position.set(position.x, position.y, position.z);
      mesh.rotation.set(rotation.x, rotation.y, rotation.z);
      return mesh;
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
      const T = this._three();
      for (let index = 0; index < count; index++) {
        const t = count <= 1 ? 0 : index / (count - 1);
        const rib = this._ring(
          material,
          width * (0.78 + Math.sin(t * Math.PI) * 0.22),
          0.065,
          { x: 0, y: centerY - t * 1.45, z: depth * 0.08 },
          { x: Math.PI / 2, y: 0, z: Math.PI * 0.22 },
          `rib_${index}`,
          Math.PI * 1.55
        );
        rib.scale.z = depth / Math.max(0.01, width);
        parent.add(rib);
      }
      parent.add(this._segment(
        material,
        new T.Vector3(0, centerY + 0.12, depth * 0.7),
        new T.Vector3(0, centerY - 1.45, depth * 0.72),
        0.08,
        0.055,
        'sternum_keel',
        7
      ));
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

      const digits = isFoot ? 4 : 5;
      for (let index = 0; index < digits; index++) {
        const spread = (index - (digits - 1) / 2) * 0.13 * s;
        const finger = new T.Group();
        finger.name = `digit_${index}`;
        const base = new T.Vector3(spread, 0, 0.34 * s);
        const knuckle = new T.Vector3(spread * 1.14, -0.025 * s, (0.59 + Math.abs(spread) * 0.18) * s);
        const tip = new T.Vector3(spread * 1.28, -0.09 * s, (0.82 - Math.abs(spread) * 0.2) * s);
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
        root.add(finger);
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
          9
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
      const tailRoot = new T.Group();
      tailRoot.name = 'segmented_tail';
      tailRoot.position.set(origin.x, origin.y, origin.z);
      const points = [
        { x: 0, y: 0, z: 0 },
        { x: side * length * 0.1, y: lift * 0.2, z: -length * 0.2 },
        { x: side * length * 0.23, y: lift * 0.34, z: -length * 0.43 },
        { x: side * length * 0.36, y: lift * 0.15, z: -length * 0.7 },
        { x: side * length * 0.47, y: lift, z: -length }
      ];
      tailRoot.add(this._tube(material, points, thickness, 'tail_skin', 34, 8));
      for (let index = 1; index < points.length - 1; index++) {
        tailRoot.add(this._ring(
          boneMaterial,
          thickness * 1.22,
          thickness * 0.13,
          points[index],
          { x: Math.PI / 2, y: 0, z: 0 },
          `tail_ring_${index}`
        ));
      }
      const tip = points[points.length - 1];
      tailRoot.add(this._coneAlong(
        boneMaterial,
        tip,
        { x: side * 0.35, y: lift * 0.3, z: -1 },
        thickness * 1.8,
        thickness * 6.5,
        'tail_blade',
        7
      ));
      parent.add(tailRoot);
      return tailRoot;
    }

    _addCrest(parent, material, size, isRoyal) {
      const T = this._three();
      const crest = new T.Group();
      crest.name = isRoyal ? 'royal_crown_crest' : 'guardian_crest';
      const plates = isRoyal ? 9 : 6;
      for (let index = 0; index < plates; index++) {
        const t = plates <= 1 ? 0 : index / (plates - 1);
        const plate = this._ellipsoid(
          material,
          {
            x: size * (1.05 - t * 0.36),
            y: size * (0.16 + Math.sin(t * Math.PI) * 0.06),
            z: size * (0.72 + t * 0.34)
          },
          {
            x: 0,
            y: size * (0.18 + t * 0.3),
            z: size * (-0.22 - t * 0.28)
          },
          `crest_plate_${index}`,
          16
        );
        plate.rotation.x = -0.3 - t * 0.22;
        plate.rotation.z = (index % 2 === 0 ? -1 : 1) * 0.025;
        crest.add(plate);
      }
      const edgeCount = isRoyal ? 11 : 7;
      for (let index = 0; index < edgeCount; index++) {
        const t = edgeCount <= 1 ? 0 : index / (edgeCount - 1);
        crest.add(this._coneAlong(
          material,
          { x: (t - 0.5) * size * 1.8, y: size * 0.54, z: -size * 0.86 },
          { x: (t - 0.5) * 0.65, y: 0.2, z: -1 },
          size * 0.06,
          size * (0.32 + Math.sin(t * Math.PI) * 0.18),
          `crest_tooth_${index}`,
          6
        ));
      }
      parent.add(crest);
      return crest;
    }

    _addJaw(parent, chitin, bone, position, scale, extended) {
      const T = this._three();
      const jawRoot = new T.Group();
      jawRoot.name = 'articulated_jaw';
      jawRoot.position.set(position.x, position.y, position.z);
      jawRoot.add(this._box(
        chitin,
        { x: 0.86 * scale, y: 0.22 * scale, z: 0.58 * scale },
        { x: 0, y: -0.08 * scale, z: 0.08 * scale },
        'lower_mandible',
        true
      ));
      for (let index = 0; index < 6; index++) {
        const x = (index - 2.5) * 0.13 * scale;
        jawRoot.add(this._coneAlong(
          bone,
          { x, y: 0.02 * scale, z: 0.32 * scale },
          { x: 0, y: 0.7, z: 0.12 },
          0.035 * scale,
          0.15 * scale,
          `outer_tooth_${index}`,
          5
        ));
      }
      const innerLength = (extended ? 1.25 : 0.62) * scale;
      jawRoot.add(this._segment(
        chitin,
        new T.Vector3(0, 0.14 * scale, 0.18 * scale),
        new T.Vector3(0, 0.14 * scale, 0.18 * scale + innerLength),
        0.13 * scale,
        0.1 * scale,
        'telescopic_inner_jaw',
        8
      ));
      jawRoot.add(this._coneAlong(
        bone,
        { x: 0, y: 0.14 * scale, z: 0.18 * scale + innerLength },
        { x: 0, y: 0, z: 1 },
        0.16 * scale,
        0.28 * scale,
        'inner_jaw_crown',
        6
      ));
      parent.add(jawRoot);
      return jawRoot;
    }

    // -------------------------------------------------------------------------
    // 6. MECHANICAL & HUMANOID DETAIL HELPERS
    // -------------------------------------------------------------------------
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
      const combatRole = ['guard', 'marine', 'smartgunner', 'incinerator', 'commando', 'weyland_commando_mk2', 'weyland_steel_team_synth', 'uscm_hazmat_tech', 'weyland_drone_operator', 'uscm_sniper', 'weyland_containment_squad', 'uscm_heavy_flamer', 'uscm_combat_engineer'].indexOf(type) >= 0;

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

      root.add(this._ellipsoid(
        shell,
        { x: 1.42, y: 1.95, z: 1.42 },
        { x: 0, y: 1.55, z: 0 },
        'shell_body',
        24
      ));
      root.add(this._ring(
        membrane,
        1.12,
        0.16,
        { x: 0, y: 0.34, z: 0 },
        { x: Math.PI / 2, y: 0, z: 0 },
        'root_collar'
      ));
      for (let ringIndex = 0; ringIndex < 5; ringIndex++) {
        root.add(this._ring(
          membrane,
          1.18 - ringIndex * 0.12,
          0.055,
          { x: 0, y: 0.66 + ringIndex * 0.42, z: 0 },
          { x: Math.PI / 2, y: 0, z: 0 },
          `shell_vein_ring_${ringIndex}`
        ));
      }

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
          20
        ));
        petalRoot.add(this._ellipsoid(
          membrane,
          { x: 0.59, y: 0.08, z: 0.79 },
          { x: 0, y: 0.2, z: 0.62 },
          'petal_membrane',
          16
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
        20
      );
      root.add(apicalSeal);

      const innerAssembly = new T.Group();
      innerAssembly.name = 'incubator_inner_assembly';
      innerAssembly.add(this._ellipsoid(
        inner,
        { x: 0.72, y: 0.42, z: 0.72 },
        { x: 0, y: 3.24, z: 0 },
        'incubator_core',
        18
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
        : this._material('chitinWarm', { color: 0x7c5b42, roughness: 0.52 });
      const joints = isBlackGoo
        ? this._material('emissiveRed', { color: 0xef4444, emissive: 0x991b1b, emissiveIntensity: 1.8 })
        : this._material('resin', { color: 0x5c342b, opacity: 0.96 });
      const claw = isBlackGoo
        ? this._material('darkMetal', { color: 0x18181b, roughness: 0.2 })
        : this._material('bone', { color: 0xc6ad79 });

      root.add(this._ellipsoid(
        hide,
        { x: 0.86, y: 0.25, z: 1.06 },
        { x: 0, y: 0.48, z: 0 },
        'central_carpal_body',
        20
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
        limb.add(this._segment(hide, new T.Vector3(), localKnee, 0.14, 0.1, 'femur', 8));

        const kneeJoint = new T.Group();
        kneeJoint.name = `crawler_knee_${legIndex}`;
        kneeJoint.position.copy(localKnee);
        kneeJoint.add(this._joint(joints, { x: 0, y: 0, z: 0 }, 0.13, 'knee'));
        kneeJoint.add(this._segment(hide, new T.Vector3(), localAnkle, 0.1, 0.065, 'tibia', 8));

        const ankleJoint = new T.Group();
        ankleJoint.name = `crawler_ankle_${legIndex}`;
        ankleJoint.position.copy(localAnkle);
        ankleJoint.add(this._joint(joints, { x: 0, y: 0, z: 0 }, 0.085, 'ankle'));
        ankleJoint.add(this._segment(hide, new T.Vector3(), localToe, 0.06, 0.035, 'tarsus', 7));
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
        42,
        8
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
      const hide = this._material('chitinWarm', { color: 0x672f2f, roughness: 0.42 });
      const chitin = this._material('chitin', { color: 0x24151d, roughness: 0.3, metalness: 0.22 });
      const resin = this._material('resin', {
        color: 0x3b1747,
        emissive: 0x4c1d95,
        emissiveIntensity: 0.44
      });
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

      for (let segmentIndex = 0; segmentIndex < 8; segmentIndex++) {
        const t = segmentIndex / 7;
        const radius = 0.42 - t * 0.19;
        root.add(this._ellipsoid(
          segmentIndex % 2 === 0 ? hide : chitin,
          { x: radius, y: radius * 0.78, z: 0.48 },
          { x: 0, y: 0.58 + Math.sin(t * Math.PI) * 0.18, z: -0.18 - t * 0.62 },
          `body_segment_${segmentIndex}`,
          14
        ));
      }
      root.add(this._ellipsoid(
        chitin,
        { x: 0.55, y: 0.4, z: 0.82 },
        { x: 0, y: 0.78, z: 0.72 },
        'juvenile_head',
        20
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

      const scale = king ? 1.62 : (deaconess ? 1.55 : (raven ? 1.48 : (abomination ? 1.48 : (royal ? 1.42 : (alpha ? 1.38 : (newborn ? 1.35 : (deaconAdult ? 1.34 : (palatine ? 1.28 : (guardian ? 1.24 : (carrier ? 1.22 : (predalien ? 1.32 : (deacon ? 1.12 : (flyingDrone ? 1.12 : (neomorph ? 1.08 : (redDrone ? 1.08 : (warrior ? 1.06 : (boiler ? 1.04 : (offspring ? 1.15 : (burster ? 0.96 : (bodyburster ? 0.92 : 1))))))))))))))))))));
      let chitinColor = 0x0b1518;
      if (royal) chitinColor = 0x221033;
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
        roughness: royal || palatine || king ? 0.22 : (raven ? 0.35 : (alpha ? 0.20 : (newborn ? 0.65 : (abomination ? 0.72 : (bodyburster ? 0.15 : (predalien ? 0.24 : (deacon ? 0.16 : (neomorph ? 0.18 : (offspring ? 0.55 : 0.28))))))))),
        metalness: king ? 0.68 : (raven ? 0.72 : (alpha ? 0.65 : (predalien ? 0.54 : (deacon ? 0.22 : (neomorph || bodyburster ? 0.06 : (newborn || abomination ? 0.04 : (offspring ? 0.15 : 0.46))))))),
        emissive: king ? 0x991b1b : (alpha ? 0x991b1b : (bodyburster ? 0xdc2626 : (raven ? 0x0f172a : 0x000000))),
        emissiveIntensity: king ? 0.38 : (alpha ? 0.32 : (bodyburster ? 0.28 : (raven ? 0.2 : 0)))
      });
      const secondary = this._material('resin', {
        color: king ? 0x450a0a : (bodyburster ? 0xfecdd3 : (royal || palatine ? 0x4a214f : (raven ? 0x18181b : (alpha ? 0x3b0712 : (newborn ? 0xfbcfe8 : (abomination ? 0xe2e8f0 : (predalien ? 0x1c1913 : (deacon ? 0x0f172a : (neomorph ? 0xfbcfe8 : (prowler ? 0x450a0a : (spitter ? 0x365314 : (offspring ? 0xa1a1aa : 0x263238)))))))))))),
        opacity: 0.96
      });
      const bone = this._material('bone', { color: king ? 0xfecaca : (bodyburster ? 0xfee2e2 : (royal || palatine ? 0xc8b6d8 : (raven ? 0x334155 : (alpha ? 0xfee2e2 : (newborn ? 0xfff1f2 : (abomination ? 0x94a3b8 : (predalien ? 0xa89f88 : (deacon ? 0x94a3b8 : (neomorph ? 0xffffff : (offspring ? 0xf4f4f5 : 0xb9c6a5)))))))))) });
      const sensory = this._material(royal || palatine || alpha || king || bodyburster ? 'emissiveRed' : (spitter || burster ? 'emissiveGreen' : 'emissiveGreen'), {
        emissiveIntensity: royal || palatine || king ? 0.52 : (alpha ? 0.75 : (burster || bodyburster ? 0.65 : 0.32))
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
      const primary = this._material('chitin', { color: 0x291a16, roughness: 0.34, metalness: 0.3 });
      const secondary = this._material('chitinWarm', { color: 0x5a3525 });
      const bone = this._material('bone', { color: 0xc7b58b });

      root.add(this._ellipsoid(
        primary,
        { x: 0.68, y: 0.62, z: 1.52 },
        { x: 0, y: 1.55, z: -0.15 },
        'runner_thorax',
        20
      ));
      root.add(this._ellipsoid(
        primary,
        { x: 0.62, y: 0.46, z: 1.0 },
        { x: 0, y: 1.72, z: 1.55 },
        'runner_head',
        20
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
      this._addTail(root, primary, bone, { x: 0, y: 1.55, z: -1.42 }, 5.5, 0.42, 0.55, 0.13);
      this._addCarapaceSpines(root, primary, 2.05, 11, 0.78, 1.42, -1);
      return this._finalize(root, {
        modelType: 'adult',
        caste: 'runner',
        height: 2.55,
        animationJoints: Array.from({ length: 4 }, (_, index) => `runner_leg_${index}`)
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
      const metal = this._material('industrial', { color: 0x475569 });
      const dark = this._material('darkMetal', { color: 0x111827 });
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
  }

  // ---------------------------------------------------------------------------
  // 14. GLOBAL BROWSER API
  // ---------------------------------------------------------------------------
  global.HiveModelFactory = new HiveModelFactoryRuntime();
}(typeof window !== 'undefined' ? window : globalThis));
