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
    mech: 'powerloader'
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
          color: 0x3f2a23,
          roughness: 0.42,
          metalness: 0.18
        },
        resin: {
          color: 0x301934,
          roughness: 0.24,
          metalness: 0.16,
          transparent: true,
          opacity: 0.92
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
      const material = wetShell
        ? new T.MeshPhysicalMaterial(Object.assign({ clearcoat: kind === 'resin' ? 0.62 : 0.35, clearcoatRoughness: kind === 'skin' ? 0.6 : 0.24 }, params))
        : new T.MeshStandardMaterial(params);
      material.userData.hiveMaterialKind = kind;
      material.userData.hiveBaseRoughness = material.roughness;
      material.userData.hiveBaseMetalness = material.metalness;
      this._applyManagedTexture(material);
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
      const resolution = segments || 24;
      const mesh = this._mesh(
        new T.SphereGeometry(1, resolution, Math.max(8, Math.floor(resolution * 0.75))),
        material,
        name
      );
      mesh.scale.set(scale.x, scale.y, scale.z);
      mesh.position.set(position.x, position.y, position.z);
      return mesh;
    }

    _box(material, size, position, name, bevelHint) {
      const T = this._three();
      // Subdividing a BoxGeometry does not soften its silhouette. A real,
      // single-segment chamfer catches the station lights with a modest budget.
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
          depth: size.z - bevel * 2, steps: 1,
          bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel,
          bevelSegments: 1, curveSegments: 1
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
      const mesh = this._mesh(
        new T.CylinderGeometry(
          radiusEnd === undefined ? radiusStart : radiusEnd,
          radiusStart,
          length,
          radialSegments || 12,
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
          const point = center.clone().addScaledVector(normal, radius);
          positions.push(point.x, point.y, point.z); normals.push(normal.x, normal.y, normal.z);
          uvs.push(j / radialSegments, t);
          if (i < tubularSegments && j < radialSegments) {
            const a = i * (radialSegments + 1) + j, b = a + radialSegments + 1;
            indices.push(a, b, a + 1, b, b + 1, a + 1);
          }
        }
      }
      const geometry = new T.BufferGeometry();
      geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
      geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
      geometry.setIndex(indices);
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

      const digits = isFoot ? 3 : 6;
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
        'tail_skin', 76, 12));
      const curve = new T.CatmullRomCurve3(points.map((p) => new T.Vector3(p.x, p.y, p.z)));
      this._addInstancedRings(tailRoot, boneMaterial, curve, 18, thickness * 1.48, 'caudal_vertebrae');
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
      // A swept, flared occipital crown belongs on the skull, never at ground level.
      const positions = [], uvs = [], indices = [], rows = 10, columns = 36;
      for (let row = 0; row <= rows; row++) {
        const r = row / rows;
        for (let col = 0; col <= columns; col++) {
          const angle = (col / columns - 0.5) * Math.PI * 1.2;
          const edge = (0.42 + r * 1.3) * size;
          const scallop = row === rows ? 1 + Math.pow(Math.sin(col / columns * Math.PI * 8), 8) * 0.055 : 1;
          positions.push(Math.sin(angle) * edge * scallop,
            (0.09 + Math.sin(r * Math.PI * 0.7) * 0.24 - Math.abs(Math.sin(angle)) * 0.07) * size,
            -Math.cos(angle) * edge * scallop - size * 0.18);
          uvs.push(col / columns, r);
          if (row < rows && col < columns) {
            const a = row * (columns + 1) + col, b = a + columns + 1;
            indices.push(a, b, a + 1, b, b + 1, a + 1);
          }
        }
      }
      const geometry = new T.BufferGeometry();
      geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
      geometry.setIndex(indices); geometry.computeVertexNormals();
      const crownMaterial = material.clone();
      crownMaterial.side = T.DoubleSide;
      this._managedMaterials.add(crownMaterial);
      crownMaterial.addEventListener('dispose', () => this._managedMaterials.delete(crownMaterial));
      crest.add(this._mesh(geometry, crownMaterial, 'swept_crown_shell'));
      for (let rib = 0; rib < (isRoyal ? 9 : 7); rib++) {
        const angle = (rib / ((isRoyal ? 9 : 7) - 1) - 0.5) * Math.PI * 1.14;
        crest.add(this._tube(material, [
          { x: Math.sin(angle) * size * 0.43, y: size * 0.12, z: -Math.cos(angle) * size * 0.43 },
          { x: Math.sin(angle) * size * 1.04, y: size * 0.31, z: -Math.cos(angle) * size * 1.04 },
          { x: Math.sin(angle) * size * 1.72, y: size * 0.29, z: -Math.cos(angle) * size * 1.72 - size * 0.18 }
        ], size * 0.025, `crown_rib_${rib}`, 20, 6));
      }
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
      const combatRole = ['guard', 'marine', 'smartgunner', 'incinerator', 'commando'].indexOf(type) >= 0;

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
      root.name = 'industrial_exosuit';
      const metal = this._material('industrial', { color: 0xd9a514, roughness: 0.34, metalness: 0.74 });
      const dark = this._material('darkMetal', { color: 0x1f2937 });
      const hazard = this._material('emissiveAmber', { emissiveIntensity: 0.82 });
      const glass = this._material('glass', { color: 0x93c5fd, opacity: 0.34 });

      root.add(this._box(
        metal,
        { x: 2.6, y: 3.2, z: 1.35 },
        { x: 0, y: 3.25, z: 0 },
        'central_frame',
        true
      ));
      root.add(this._box(
        dark,
        { x: 1.42, y: 2.05, z: 0.86 },
        { x: 0, y: 3.35, z: 0.74 },
        'pilot_cradle',
        true
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
        root.add(this._box(
          hazard,
          { x: 0.16, y: 0.22, z: 0.08 },
          { x: side * 1.32, y: 4.52, z: 0.72 },
          `warning_light_${side}`
        ));
        this._addMechanicalLimb(
          root,
          metal,
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
          metal,
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
        rightLeg: 'exosuit_leg_right'
      };
      return this._finalize(root, { modelType: 'human', subtype: 'powerloader', height: 5.25 });
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
      for (let vein = 0; vein < 8; vein++) {
        const angle = vein / 8 * Math.PI * 2;
        root.add(this._tube(membrane, [
          { x: Math.cos(angle) * 1.65, y: 0.04, z: Math.sin(angle) * 1.65 },
          { x: Math.cos(angle + 0.08) * 1.26, y: 0.46, z: Math.sin(angle + 0.08) * 1.26 },
          { x: Math.cos(angle + 0.12) * 1.32, y: 1.5, z: Math.sin(angle + 0.12) * 1.32 },
          { x: Math.cos(angle) * 0.99, y: 2.78, z: Math.sin(angle) * 0.99 }
        ], 0.042, `longitudinal_shell_fold_${vein}`, 36, 8));
      }
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
    createFacehugger() {
      const T = this._three();
      const root = new T.Group();
      root.name = 'parasitic_crawler';
      const legJoints = [];
      const kneeJoints = [];
      const ankleJoints = [];
      const hide = this._material('skin', { color: 0xc5b69b, roughness: 0.58, clearcoat: 0.2 });
      const joints = this._material('skin', { color: 0x9f8f79, roughness: 0.64, clearcoat: 0.15 });
      const claw = this._material('bone', { color: 0xc6ad79 });

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

    // -------------------------------------------------------------------------
    // 9. PUBLIC MODEL: JUVENILE / METAMORPHIC POD
    // -------------------------------------------------------------------------
    createChestburster(chrysalis) {
      const T = this._three();
      const root = new T.Group();
      root.name = chrysalis ? 'metamorphic_pod' : 'juvenile_serpent';
      const hide = chrysalis ? null : this._material('skin', { color: 0xc4a48d, roughness: 0.46, clearcoat: 0.45 });
      const chitin = this._material('chitin', { color: 0x9a9694, roughness: 0.4, metalness: 0.08 });
      const resin = chrysalis ? this._material('resin', {
        color: 0x3b1747,
        emissive: 0x4c1d95,
        emissiveIntensity: 0.44
      }) : null;
      const bone = chrysalis ? null : this._material('bone', { color: 0xd6c58b });

      if (chrysalis) {
        root.add(this._ellipsoid(
          resin,
          { x: 1.18, y: 1.72, z: 1.0 },
          { x: 0, y: 1.42, z: 0 },
          'pod_membrane',
          48
        ));
        for (let band = 0; band < 8; band++) {
          const y = 0.35 + band * 0.32;
          root.add(this._ring(
            chitin,
            1.02 - Math.abs(3.5 - band) * 0.07,
            0.065,
            { x: 0, y, z: 0 },
            { x: Math.PI / 2, y: 0, z: 0 },
            `pod_band_${band}`
          ));
        }
        for (let rootIndex = 0; rootIndex < 7; rootIndex++) {
          const angle = rootIndex / 7 * Math.PI * 2;
          root.add(this._tube(
            resin,
            [
              { x: Math.cos(angle) * 0.45, y: 0.44, z: Math.sin(angle) * 0.45 },
              { x: Math.cos(angle) * 1.0, y: 0.12, z: Math.sin(angle) * 1.0 },
              { x: Math.cos(angle) * 1.5, y: 0.04, z: Math.sin(angle) * 1.5 }
            ],
            0.07,
            `anchoring_root_${rootIndex}`,
            14,
            7
          ));
        }
        root.add(this._ellipsoid(
          this._material('emissiveGreen', { emissiveIntensity: 0.42, transparent: true, opacity: 0.34 }),
          { x: 0.62, y: 1.12, z: 0.5 },
          { x: 0, y: 1.48, z: 0.03 },
          'developing_silhouette',
          18
        ));
        return this._finalize(root, {
          modelType: 'chestburster',
          chrysalis: true,
          height: 3.15,
          animationJoints: [
            'pod_membrane',
            'pod_band_0',
            'pod_band_1',
            'pod_band_2',
            'pod_band_3',
            'pod_band_4',
            'pod_band_5',
            'pod_band_6',
            'pod_band_7',
            'developing_silhouette'
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
      return this._createUprightAdult(normalizedCaste);
    }

    _createUprightAdult(caste) {
      const T = this._three();
      const root = new T.Group(); root.name = `adult_${caste}`;
      const royal = caste === 'queen', guardian = caste === 'praetorian', warrior = caste === 'warrior';
      const scale = royal ? 1.42 : (guardian ? 1.18 : (warrior ? 1.06 : 1));
      const primary = this._material('chitin', {
        color: royal ? 0x77718a : (guardian ? 0x777e90 : (warrior ? 0x89959d : (caste === 'spitter' ? 0x909475 : (caste === 'worker' ? 0x809b94 : 0x89999f)))),
        roughness: 0.42, metalness: 0.16, clearcoat: 0.58, clearcoatRoughness: 0.2
      });
      const secondary = this._material('resin', { color: royal ? 0x817083 : 0x728586,
        opacity: 1, transparent: false, roughness: 0.5, metalness: 0.04 });
      const bone = this._material('bone', { color: 0x949e93, roughness: 0.36, metalness: 0.1 });
      const sensory = this._material(royal ? 'emissiveRed' : 'emissiveGreen', { emissiveIntensity: 0.16 });
      const body = new T.Group(); body.name = 'adult_anatomy'; body.scale.setScalar(scale); root.add(body);
      body.add(this._ellipsoid(primary, { x: 0.56, y: 0.86, z: 0.39 },
        { x: 0, y: 3.55, z: 0 }, 'thorax', 36));
      body.add(this._ellipsoid(secondary, { x: 0.42, y: 0.42, z: 0.32 },
        { x: 0, y: 2.6, z: -0.07 }, 'pelvic_carapace', 28));
      body.add(this._segment(secondary, new T.Vector3(0, 4.04, -0.08),
        new T.Vector3(0, 4.7, -0.17), 0.22, 0.19, 'cervical_column', 20));
      const head = new T.Group(); head.name = 'cranial_dome'; head.position.set(0, 4.81, 0.02);
      const skull = this._ellipsoid(primary,
        { x: royal ? 0.57 : 0.43, y: royal ? 0.4 : 0.34, z: royal ? 1.65 : 1.42 },
        { x: 0, y: 0.05, z: -0.34 }, 'elongated_cranial_shell', 48);
      // Taper toward the face while keeping the long occipital silhouette smooth.
      const vertices = skull.geometry.attributes.position;
      for (let i = 0; i < vertices.count; i++) {
        const z = vertices.getZ(i);
        vertices.setX(i, vertices.getX(i) * (1 - Math.max(0, z) * 0.18));
        vertices.setY(i, vertices.getY(i) * (1 - Math.max(0, z) * 0.08));
      }
      vertices.needsUpdate = true; skull.geometry.computeVertexNormals();
      head.add(skull); body.add(head);
      head.add(this._ellipsoid(secondary, { x: 0.36, y: 0.18, z: 0.43 },
        { x: 0, y: -0.22, z: 0.76 }, 'facial_mask', 32));
      this._addJaw(body, primary, bone, { x: 0, y: 4.4, z: 0.96 }, 0.72, false);
      this._addRibCage(body, secondary, 4.06, 0.57, 0.39, royal ? 10 : 8);
      this._addDorsalTubes(body, primary, 3.05, 0.8, royal ? 8 : (warrior ? 6 : 4));
      // Segmented sternum, scapular tendons and abdominal plates articulate the
      // silhouette rather than adding disconnected decorative spheres.
      for (let segment = 0; segment < 6; segment++) {
        const t = segment / 5;
        body.add(this._ellipsoid(primary, { x: 0.31 - t * 0.08, y: 0.105, z: 0.12 },
          { x: 0, y: 3.39 - t * 0.75, z: 0.29 }, `ventral_plate_${segment}`, 20));
      }
      for (const side of [-1, 1]) {
        body.add(this._tube(secondary, [
          { x: side * 0.2, y: 4.57, z: -0.17 },
          { x: side * 0.48, y: 4.2, z: -0.26 },
          { x: side * 0.61, y: 3.96, z: -0.12 }
        ], 0.075, `trapezial_tendon_${side}`, 24, 10));
        const arm = this._addSegmentedLimb(body, primary, secondary, [
          { x: side * 0.58, y: 4.05, z: 0 },
          { x: side * (royal || guardian ? 1.05 : 0.91), y: 3.05, z: -0.1 },
          { x: side * 0.93, y: 2.06, z: 0.36 }
        ], [0.19, 0.15, 0.1], `arm_${side < 0 ? 'left' : 'right'}`, {
          material: primary, clawMaterial: bone, side, scale: 0.76,
          rotationY: side < 0 ? -0.2 : 0.2
        });
        arm.add(this._tube(secondary, [
          { x: side * 0.08, y: -0.15, z: -0.05 },
          { x: side * 0.2, y: -1.02, z: -0.16 },
          { x: side * 0.2, y: -1.74, z: 0.28 }
        ], 0.035, `forearm_flexor_${side}`, 30, 8));
        const leg = this._addSegmentedLimb(body, primary, secondary, [
          { x: side * 0.34, y: 2.64, z: -0.05 },
          { x: side * 0.5, y: 1.5, z: 0.32 },
          { x: side * 0.48, y: 0.56, z: -0.23 },
          { x: side * 0.45, y: 0.14, z: 0.2 }
        ], [0.235, 0.17, 0.105, 0.085], `leg_${side < 0 ? 'left' : 'right'}`, {
          material: primary, clawMaterial: bone, side, isFoot: true, scale: 0.82,
          rotationY: side < 0 ? -0.08 : 0.08
        });
        leg.add(this._ellipsoid(primary, { x: 0.15, y: 0.27, z: 0.12 },
          { x: side * 0.16, y: -1.1, z: 0.48 }, `patellar_plate_${side}`, 24));
        leg.add(this._tube(secondary, [
          { x: 0, y: -0.25, z: -0.14 },
          { x: side * 0.13, y: -1.12, z: 0.14 },
          { x: side * 0.15, y: -2.1, z: -0.25 }
        ], 0.047, `achilles_tendon_${side}`, 30, 8));
        if (caste === 'worker' || warrior || guardian) {
          arm.add(this._ellipsoid(primary, { x: caste === 'worker' ? 0.31 : 0.27, y: 0.19, z: 0.35 },
            { x: 0, y: 0.03, z: -0.05 }, `reinforced_shoulder_${side}`, 28));
        }
      }
      if (warrior) {
        for (let rib = 0; rib < 11; rib++) {
          const z = -1.54 + rib * 0.22;
          const radius = Math.sqrt(Math.max(0.05, 1 - Math.pow((z + 0.34) / 1.5, 2)));
          const ridge = this._ring(secondary, 0.34 * radius, 0.031,
            { x: 0, y: 0.08, z }, { x: 0, y: 0, z: 0 }, `warrior_skull_ridge_${rib}`, Math.PI);
          ridge.scale.x = 1.22; ridge.rotation.z = 0; head.add(ridge);
        }
      }
      if (royal || guardian) {
        const crown = this._addCrest(head, primary, royal ? 1.12 : 0.77, royal);
        crown.position.set(0, 0.19, -0.12);
      }
      if (caste === 'spitter') {
        const acid = this._material('resin', { color: 0xb0c96e, emissive: 0x425718,
          emissiveIntensity: 0.36, roughness: 0.3, opacity: 0.94 });
        for (const side of [-1, 1]) {
          body.add(this._ellipsoid(acid, { x: 0.26, y: 0.49, z: 0.3 },
            { x: side * 0.57, y: 3.82, z: -0.3 }, `acid_reservoir_${side}`, 32));
          body.add(this._tube(secondary, [
            { x: side * 0.55, y: 3.9, z: -0.24 },
            { x: side * 0.39, y: 4.2, z: 0.35 },
            { x: side * 0.2, y: 4.39, z: 0.98 }
          ], 0.05, `acid_duct_${side}`, 26, 10));
        }
      }
      if (caste === 'worker') head.scale.set(1.12, 0.93, 0.9);
      if (royal) {
        for (const side of [-1, 1]) this._addSegmentedLimb(body, secondary, primary, [
          { x: side * 0.4, y: 3.78, z: 0.06 },
          { x: side * 0.8, y: 3.16, z: 0.36 },
          { x: side * 0.72, y: 2.7, z: 0.69 }
        ], [0.12, 0.09, 0.06], `royal_secondary_arm_${side}`, {
          material: secondary, clawMaterial: bone, side, scale: 0.51
        });
        body.add(this._ellipsoid(secondary, { x: 0.54, y: 0.59, z: 0.83 },
          { x: 0, y: 2.6, z: -0.64 }, 'royal_abdomen', 36));
      }
      this._addTail(body, primary, secondary, { x: 0, y: 2.6, z: -0.35 },
        royal ? 6.0 : 4.45, royal ? 0.5 : -0.2, royal ? 0.42 : -0.34, royal ? 0.16 : 0.12);
      body.add(this._ellipsoid(sensory, { x: 0.05, y: 0.035, z: 0.07 },
        { x: 0, y: 4.55, z: 1.04 }, 'sensory_node', 12));
      return this._finalize(root, {
        modelType: 'adult', caste, height: 5.35 * scale,
        animationJoints: { head: 'cranial_dome', jaw: 'articulated_jaw',
          leftArm: 'arm_left', rightArm: 'arm_right', leftLeg: 'leg_left',
          rightLeg: 'leg_right', tail: 'segmented_tail' }
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
      // Allocate only materials actually owned by this prop. Unused materials
      // cannot be found by disposeModel and otherwise accumulate on each spawn.
      const metal = normalizedType === 'lamp' ? null : this._material('industrial', { color: 0x617585 });
      const dark = this._material('darkMetal', { color: 0x24333d });
      const hazard = ['barrel', 'lamp'].includes(normalizedType) ? null : this._material('emissiveAmber', { emissiveIntensity: 0.7 });
      const screen = ['console', 'door', 'lamp'].includes(normalizedType)
        ? this._material('emissiveGreen', { emissiveIntensity: 0.92 }) : null;
      const warning = ['console', 'barrel'].includes(normalizedType)
        ? this._material('emissiveRed', { emissiveIntensity: 0.82 }) : null;

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
        root.add(light);
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

      const finalized = this._finalize(root, {
        modelType: 'industrialProp',
        subtype: normalizedType,
        localGroundPlaneY: 0
      });
      this.placeOnGround(finalized, 0);
      return finalized;
    }
  }

  // ---------------------------------------------------------------------------
  // 14. GLOBAL BROWSER API
  // ---------------------------------------------------------------------------
  global.HiveModelFactory = new HiveModelFactoryRuntime();
}(typeof window !== 'undefined' ? window : globalThis));
