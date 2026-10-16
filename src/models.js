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
    steelteamandroid: 'weyland_steel_team_synth'
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
      const combatRole = ['guard', 'marine', 'smartgunner', 'incinerator', 'commando', 'weyland_commando_mk2', 'weyland_steel_team_synth'].indexOf(type) >= 0;

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
    createFacehugger() {
      const T = this._three();
      const root = new T.Group();
      root.name = 'parasitic_crawler';
      const legJoints = [];
      const kneeJoints = [];
      const ankleJoints = [];
      const hide = this._material('chitinWarm', { color: 0x7c5b42, roughness: 0.52 });
      const joints = this._material('resin', { color: 0x5c342b, opacity: 0.96 });
      const claw = this._material('bone', { color: 0xc6ad79 });

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
      const offspring = caste === 'offspring';
      const predalien = caste === 'predalien';
      const deacon = caste === 'deacon';
      const neomorph = caste === 'neomorph';
      const alpha = caste === 'alpha';

      const scale = royal ? 1.42 : (alpha ? 1.38 : (palatine ? 1.28 : (guardian ? 1.24 : (predalien ? 1.32 : (deacon ? 1.12 : (neomorph ? 1.08 : (warrior ? 1.06 : (offspring ? 1.15 : (burster ? 0.96 : 1)))))))));
      let chitinColor = 0x0b1518;
      if (royal) chitinColor = 0x221033;
      else if (palatine) chitinColor = 0x1f0b29;
      else if (guardian) chitinColor = 0x2d163d;
      else if (alpha) chitinColor = 0x140a0b; // Obsidienne marbrée de carmin (Marvel Comics: Alien: Bloodlines)
      else if (predalien) chitinColor = 0x2e291e; // Bronze sombre métallique Yautja
      else if (deacon) chitinColor = 0x1e293b; // Bleu ardoise profond lisse (Prometheus 2012)
      else if (neomorph) chitinColor = 0xf1f5f9; // Peau blanc albâtre translucide (Alien: Covenant 2017)
      else if (warrior) chitinColor = 0x111827;
      else if (prowler) chitinColor = 0x3d0c0c;
      else if (spitter) chitinColor = 0x1a2e05;
      else if (burster) chitinColor = 0x3a3804;
      else if (offspring) chitinColor = 0xd4d4d8;

      const primary = this._material('chitin', {
        color: chitinColor,
        roughness: royal || palatine ? 0.22 : (alpha ? 0.20 : (predalien ? 0.24 : (deacon ? 0.16 : (neomorph ? 0.18 : (offspring ? 0.55 : 0.28))))),
        metalness: alpha ? 0.65 : (predalien ? 0.54 : (deacon ? 0.22 : (neomorph ? 0.06 : (offspring ? 0.15 : 0.46)))),
        emissive: alpha ? 0x991b1b : 0x000000,
        emissiveIntensity: alpha ? 0.32 : 0
      });
      const secondary = this._material('resin', {
        color: royal || palatine ? 0x4a214f : (alpha ? 0x3b0712 : (predalien ? 0x1c1913 : (deacon ? 0x0f172a : (neomorph ? 0xfbcfe8 : (prowler ? 0x450a0a : (spitter ? 0x365314 : (offspring ? 0xa1a1aa : 0x263238))))))),
        opacity: 0.96
      });
      const bone = this._material('bone', { color: royal || palatine ? 0xc8b6d8 : (alpha ? 0xfee2e2 : (predalien ? 0xa89f88 : (deacon ? 0x94a3b8 : (neomorph ? 0xffffff : (offspring ? 0xf4f4f5 : 0xb9c6a5)))) ) });
      const sensory = this._material(royal || palatine || alpha ? 'emissiveRed' : (spitter || burster ? 'emissiveGreen' : 'emissiveGreen'), {
        emissiveIntensity: royal || palatine ? 0.42 : (alpha ? 0.75 : (burster ? 0.65 : 0.32))
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
      if (!deacon && !neomorph) {
        this._addDorsalTubes(root, primary, 2.72 * scale, scale, royal ? 8 : (warrior || predalien ? 6 : 4));
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
        // Canon Aliens Fireteam / CM : Poches d'acide pharyngées fluorescentes
        for (let side = -1; side <= 1; side += 2) {
          root.add(this._ellipsoid(
            sensory,
            { x: 0.22 * scale, y: 0.16 * scale, z: 0.38 * scale },
            { x: side * 0.52 * scale, y: 4.38 * scale, z: 0.48 * scale },
            `spitter_acid_pouch_${side}`,
            14
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
      this._addTail(
        root,
        primary,
        bone,
        { x: 0, y: 1.88 * scale, z: -0.36 * scale },
        (royal ? 6.4 : 4.8) * scale,
        royal ? 1.05 * scale : 0.58 * scale,
        royal ? 0.42 : -0.34,
        (royal ? 0.19 : 0.14) * scale
      );
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
      if (alpha) {
        // Chantier 70 : Fouet bifide à double pointe barbelée supersonique de l'Alpha (Marvel Comics: Alien: Bloodlines)
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
      this._addCarapaceSpines(root, primary, 4.75 * scale, royal ? 13 : 9, 1.15 * scale, 1.0 * scale, -1);
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

      // Triangular bullet-proof cranial shield (Ramming Shield)
      const shieldGeo = new T.ConeGeometry(1.4 * scale, 2.0 * scale, 4);
      const shieldMesh = new T.Mesh(shieldGeo, primary);
      shieldMesh.rotation.x = Math.PI / 3;
      shieldMesh.rotation.y = Math.PI / 4;
      shieldMesh.position.set(0, 2.3 * scale, 1.35 * scale);
      shieldMesh.scale.set(1.3, 0.45, 1.15);
      root.add(shieldMesh);

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
      root.name = 'service_animal_labhound';
      const coat = this._material('fabric', { color: 0x4a392f, roughness: 0.94 });
      const armor = this._material('industrial', { color: 0x374151, roughness: 0.58 });
      const dark = this._material('darkMetal', { color: 0x111827 });
      const sensor = this._material('emissiveAmber', {
        color: 0x713f12,
        emissiveIntensity: 0.58
      });

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
        subtype: 'labhound',
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
      if (normalizedType === 'labhound') return this._createServiceAnimal(requestedType);
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
  }

  // ---------------------------------------------------------------------------
  // 14. GLOBAL BROWSER API
  // ---------------------------------------------------------------------------
  global.HiveModelFactory = new HiveModelFactoryRuntime();
}(typeof window !== 'undefined' ? window : globalThis));
