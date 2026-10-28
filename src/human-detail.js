/* Role-specific, bone-mounted practical equipment for the local skinned cast.
 * Details are authored in normalized actor metres, then attached preserving the
 * bind transform: centimetre FBX bones must not inflate badges or backpacks.
 */
(function exposeHumanDetail(global) {
  'use strict';
  const ROLES = ['civilian', 'scientist', 'synthetic', 'guard', 'marine', 'smartgunner', 'incinerator', 'commando'];
  const LABELS = ['FLIGHT CREW', 'SCIENCE / 04', 'SYNTHETIC', 'SECURITY', 'USCM / 03', 'USCM / SG', 'USCM / FL', 'WY / SECURITY'];
  let atlas = null;
  function getAtlas(T) {
    if (atlas || !global.document) return atlas;
    const canvas = global.document.createElement('canvas'); canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d'); if (!ctx) return null;
    ctx.fillStyle = '#202720'; ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < ROLES.length; i++) {
      ctx.fillStyle = '#bfc4a7'; ctx.font = 'bold 15px monospace';
      ctx.fillText(LABELS[i], 8, i * 32 + 22);
      ctx.fillStyle = '#ada684'; ctx.fillRect(168, i * 32 + 8, 3, 16);
      ctx.fillRect(174, i * 32 + 8, 3, 16); ctx.fillRect(180, i * 32 + 8, 8, 16);
      ctx.font = '10px monospace'; ctx.fillText(`C-${String(i + 31).padStart(4, '0')}`, 198, i * 32 + 21);
    }
    atlas = new T.CanvasTexture(canvas); atlas.name = 'shared_crew_insignia_atlas';
    atlas.encoding = T.sRGBEncoding; atlas.anisotropy = 2;
    return atlas;
  }
  function decorate(factory, root, metadata = {}) {
    if (!metadata.hiveImportedModel || root.userData.humanFidelity) return root;
    const runtime = global.HiveAssetLibrary?.getRuntime?.(root);
    const T = global.THREE; if (!T || !runtime?.bindings.spine) return root;
    const role = metadata.subtype || 'civilian', armed = ['guard', 'marine', 'smartgunner', 'incinerator', 'commando'].includes(role);
    // Do not erase the imported artist's skin/cloth maps. Calibrate the existing
    // helmet/equipment independently; exposed faces retain their original skin.
    for (const material of runtime.materials) {
      if (/helmet|equipment/.test(material.name || '')) {
        material.color.multiply(new T.Color(role === 'commando' ? 0x7e8581 : 0x939a80));
        material.roughness = Math.max(.48, material.roughness || 0);
        material.metalness = Math.min(.18, material.metalness || 0);
      }
    }
    const cloth = factory._material('fabric', {color: armed ? 0x323c2d : 0x676c64, roughness: .93});
    const hardware = factory._material('darkMetal', {color: 0x454c46, roughness: .48, metalness: .55});
    const rubber = factory._material('fabric', {color: 0x151a19, roughness: .9});
    const shell = factory._material('industrial', {color: role === 'incinerator' ? 0x7b7360 : 0x4d5941, roughness: .65, metalness: .14});
    const used = new Set(), sockets = [];
    const group = name => { const g = new T.Group(); g.name = name; return g; };
    const box = (g, material, size, pos, name) => {
      const mesh = factory._box(material, {x:size[0], y:size[1], z:size[2]}, {x:pos[0], y:pos[1], z:pos[2]}, name, true);
      g.add(mesh); used.add(material); return mesh;
    };
    const rod = (g, material, a, b, radius, name) => {
      const mesh = factory._segment(material, new T.Vector3(...a), new T.Vector3(...b), radius, radius, name);
      g.add(mesh); used.add(material); return mesh;
    };
    const attach = (g, binding) => {
      if (!g.children.length) return;
      root.add(g); root.updateMatrixWorld(true);
      global.HiveModelDetail?.mergeStatic?.(g);
      (runtime.bindings[binding] || runtime.bindings.spine).attach(g);
      sockets.push(g);
    };
    const torso = group('crew_torso_equipment');
    // Flat webbing and separate belt pouches, not another full suit over the GLB.
    if (armed) {
      for (const side of [-1, 1]) {
        const strap = box(torso, cloth, [.095, .73, .045], [side * .32, 2.95, .31], `load_strap_${side}`);
        strap.rotation.z = side * -.1;
        box(torso, hardware, [.13, .1, .055], [side * .30, 2.72, .34], `strap_buckle_${side}`);
      }
      box(torso, rubber, [.08, .2, .08], [-.48, 3.14, .25], 'shoulder_radio');
      rod(torso, hardware, [-.48, 3.21, .25], [-.48, 3.48, .25], .012, 'radio_antenna');
    } else if (role === 'scientist' || role === 'synthetic') {
      box(torso, hardware, [.22, .28, .035], [-.30, 3.05, .30], 'crew_id_holder');
      box(torso, rubber, [.08, .20, .07], [.29, 2.98, .31], 'sampling_pen');
      rod(torso, hardware, [-.18, 3.46, .18], [-.30, 3.18, .31], .012, 'id_lanyard_left');
      rod(torso, hardware, [.13, 3.46, .18], [-.30, 3.18, .31], .012, 'id_lanyard_right');
    }
    const labelMap = getAtlas(T);
    if (labelMap) {
      const material = new T.MeshStandardMaterial({map:labelMap, roughness:.92, metalness:0, side:T.DoubleSide});
      const geometry = new T.PlaneGeometry(.43, .062), index = Math.max(0, ROLES.indexOf(role));
      const uv = geometry.attributes.uv;
      for (let i=0;i<uv.count;i++) uv.setXY(i, uv.getX(i), (7-index+uv.getY(i))/8);
      const nameplate = new T.Mesh(geometry, material); nameplate.name = 'crew_role_insignia';
      nameplate.position.set(.03, 3.22, .345); torso.add(nameplate);
    }
    // Specialized tools keep silhouettes distinguishable even in low light.
    if (role === 'incinerator') {
      for (const side of [-1, 1]) {
        rod(torso, shell, [side*.19,2.57,-.37], [side*.19,3.21,-.37], .145, `fuel_canister_${side}`);
        box(torso, hardware, [.33,.055,.32], [side*.19,2.67,-.37], `tank_retainer_${side}`);
        rod(torso, hardware, [side*.19,3.20,-.37], [side*.19,3.32,-.37], .035, `tank_valve_${side}`);
      }
      rod(torso, rubber, [.25,2.64,-.38], [.53,2.45,.08], .044, 'fuel_feed_hose');
    } else if (role === 'smartgunner') {
      box(torso, shell, [.62,.64,.25], [0,2.91,-.38], 'smartgun_powerpack');
      rod(torso, hardware, [-.44,2.65,-.15], [.44,2.65,-.15], .043, 'support_yoke');
      for (let i=0;i<8;i++) box(torso, hardware, [.07,.11,.13], [.43,2.55-i*.045,-.23+i*.055], `feed_link_${i}`);
    } else if (armed) {
      box(torso, cloth, [.49,.43,.18], [0,2.95,-.37], 'patrol_equipment_pack');
      box(torso, hardware, [.26,.055,.20], [0,2.89,-.38], 'pack_closure');
    }
    attach(torso, 'spine');
    const belt = group('crew_belt_equipment');
    for (const side of [-1,1]) {
      box(belt, cloth, [.25,.28,.16], [side*.41,2.15,.20], `utility_pouch_${side}`);
      box(belt, hardware, [.065,.07,.025], [side*.41,2.18,.29], `pouch_snap_${side}`);
    }
    attach(belt, 'hips');
    const head = group('crew_head_equipment');
    if (armed) {
      box(head, rubber, [.08,.16,.14], [-.25,3.84,.03], 'comms_earpiece');
      rod(head, hardware, [-.27,3.81,.07], [-.18,3.69,.28], .016, 'comms_boom');
    }
    attach(head, 'head');
    for (const material of [cloth, hardware, rubber, shell]) if (!used.has(material)) material.dispose();
    root.userData.humanFidelity = {version:1, role, boneMounted:true, sockets:sockets.map(g=>g.name)};
    return root;
  }
  global.HiveHumanDetail = {decorate, getDiagnostics:()=>({version:1,sharedAtlas:!!atlas}),
    disposeShared:()=>{ atlas?.dispose(); atlas=null; }};
})(typeof window === 'undefined' ? globalThis : window);
