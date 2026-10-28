/* Secondary articulated motion for the continuous modern creature skin.
 * Proximal actions still come from the native campaign rig. These hinge poses
 * are evaluated from bind quaternions every frame, never accumulated.
 */
(function exposeAlienMotion(global) {
  'use strict';
  const clamp = value => Math.max(0, Math.min(1, Number(value) || 0));
  const TAU = Math.PI * 2, stance = .62;
  const smooth = value => value * value * (3 - 2 * value);
  let hinge = null, axis = null, worldScale = null, baseEuler = null;
  function strideLength(container) {
    let model = container?.userData?.modernMotionRig ? container : null;
    if (!model) container?.traverse?.(object => { if (!model && object.userData?.modernMotionRig) model = object; });
    if (!model || !global.THREE) return 0;
    worldScale ||= new global.THREE.Vector3();
    model.getWorldScale(worldScale);
    // One phase cycle advances the body by the backward travel of a planted
    // foot / stance fraction. Callers advance phase from actual moved distance.
    return 2 * model.userData.modernMotionRig.stride / stance * Math.abs(worldScale.z);
  }
  function apply(model, state = {}) {
    const rig = model?.userData?.modernMotionRig;
    if (!rig?.bends?.length || !global.THREE) return;
    hinge ||= new global.THREE.Quaternion();
    axis ||= new global.THREE.Vector3(1, 0, 0);
    baseEuler ||= new global.THREE.Euler();
    const phase = Number.isFinite(state.phase) ? state.phase : 0;
    const idlePhase = Number.isFinite(state.idlePhase) ? state.idlePhase : phase;
    // Native actors use .08 as their resting blend. That must not walk in place.
    const movement = clamp((clamp(state.movement) - .1) / .9), crouch = clamp(state.crouch);
    const attack = Math.sin(clamp(state.attack) * Math.PI);
    const action = String(state.action || 'melee').toLowerCase();
    const pose = String(state.pose || '').toLowerCase();
    const emergence = pose === 'emergence' ? 1 - smooth(clamp(state.poseProgress)) : 0;
    const leap = /ambush|leap|pounce|charge|dive|ram/.test(action);
    const weaving = /cocoon|weave|resin/.test(action);
    const tailStrike = /tail|sting|impale/.test(action);
    const projectile = /spit|acid|spray|hiss|roar/.test(action);
    const biting = /jaw|bite|snap/.test(action);
    const airborne = Math.max(emergence, leap ? attack : 0);
    const grounded = 1 - airborne;
    // Lower the mass onto flexed legs, rather than shrinking the actor or
    // letting a full crouch spring back up (sin(PI) === 0).
    const brace = (projectile || tailStrike || weaving) ? attack * (rig.quadruped ? .14 : .055) : 0;
    if (rig.unit) model.position.y -= rig.unit * ((rig.quadruped ? .22 : .075) * movement +
      (rig.quadruped ? .19 : .34) * smooth(crouch) + brace) * grounded;
    const rootDrop = (model.userData.runtimeBasePose?.position.y ?? model.position.y) - model.position.y;
    const rootPitch = model.rotation.x - (model.userData.runtimeBasePose?.quaternion
      ? baseEuler.setFromQuaternion(model.userData.runtimeBasePose.quaternion).x : model.rotation.x);
    for (const entry of rig.bends) {
      if (!entry.joint || !entry.baseQuaternion) continue;
      const offset = entry.gaitOffset ?? (entry.side < 0 ? 0 : Math.PI);
      const swing = Math.sin(phase + offset);
      const idle = state.reducedMotion ? 0 : Math.sin(idlePhase * .43 + offset) * .018;
      let angle;
      if (entry.kind === 'knee') {
        if (entry.proximal && entry.terminal && entry.lowerLength > 0) {
          // A two-link solve keeps the sole at its bind height throughout
          // support; only recovery lifts it. Both hip and knee use this SAME
          // phase, unlike the old array-index hip / side-index knee sinusoids.
          const cycle = ((phase + offset) % TAU + TAU) % TAU / TAU;
          const recovery = cycle >= stance, t = recovery ? (cycle - stance) / (1 - stance) : cycle / stance;
          const travel = recovery ? -1 + 2 * smooth(t) : 1 - 2 * t;
          const lift = recovery ? Math.sin(t * Math.PI) * rig.unit * (rig.quadruped ? .23 : .21) * movement : 0;
          const rootZ = entry.bindTerminal.z + travel * rig.stride * movement;
          // A spit/brace leans the torso, not the ground under its feet.
          const targetY = (entry.bindTerminal.y + rootDrop + lift + Math.sin(rootPitch) * rootZ) /
            Math.max(.2, Math.cos(rootPitch)) - entry.proximal.position.y;
          const targetZ = rootZ - entry.proximal.position.z;
          const a = entry.upperLength, b = entry.lowerLength;
          const cosine = Math.max(-.99999, Math.min(.99999, (targetY * targetY + targetZ * targetZ - a * a - b * b) / (2 * a * b)));
          const bend = entry.bendDirection * Math.acos(cosine);
          const hip = Math.atan2(targetZ, targetY) - Math.atan2(b * Math.sin(bend), a + b * Math.cos(bend)) - entry.upperAngle;
          entry.proximal.rotation.x += Math.atan2(Math.sin(hip), Math.cos(hip)) * grounded;
          angle = (bend - entry.bindBend) * grounded + entry.bendDirection * (leap ? attack * .94 : 0) + entry.bendDirection * emergence * .98;
          entry.terminal.quaternion.copy(entry.terminalQuaternion);
          // Keep a planted sole level instead of pitching the entire foot with
          // the shin. Airborne feet retain their tucked anatomical orientation.
          entry.terminal.quaternion.premultiply(hinge.setFromAxisAngle(axis,
            -(entry.proximal.rotation.x + angle + rootPitch) * grounded - (recovery ? Math.sin(t * Math.PI) * .16 * movement * grounded : 0)));
        } else {
          // Compatibility for older/custom rigs that only expose hinge bones.
          angle = .055 + Math.max(0, -swing) * .72 * movement + crouch * .82;
          angle += attack * (leap ? .88 : tailStrike ? .16 : .08) + emergence * 1.03 + idle;
        }
      } else {
        // A relaxed claw hangs from a slightly flexed elbow, not a straight rod.
        angle = -(.12 + (.14 + Math.max(0, swing) * .32) * movement + crouch * .24);
        // The proximal campaign pose already raises the arm. A jaw strike
        // braces below the mouth instead of folding bright claws into the teeth.
        angle -= attack * (weaving ? .66 : leap ? .73 : projectile ? .19 : tailStrike ? .23 : biting ? .28 : .62);
        angle -= emergence * .79 + idle;
        if (weaving) angle -= Math.sin(phase * 1.4 + offset) * attack * .13;
        if (entry.proximal) {
          // Counter-swing the arm on the same side as the leg, with a small
          // delayed shoulder roll rather than a rigid marching piston.
          entry.proximal.rotation.x += -swing * movement * .30 * (1 - attack * .7) * (1 - emergence);
          entry.proximal.rotation.z += entry.side * Math.cos(phase + offset - .35) * movement * .035;
        }
        if (entry.terminal && entry.terminalQuaternion) {
          let wrist = .70 + swing * movement * .09;
          wrist += attack * (weaving ? -.36 : leap ? -.63 : tailStrike ? .23 : projectile ? .10 : biting ? -.16 : -.78);
          wrist -= emergence * .30;
          if (weaving) wrist += Math.sin(phase * 1.4 + offset) * attack * .18;
          entry.terminal.quaternion.copy(entry.terminalQuaternion)
            .premultiply(hinge.setFromAxisAngle(axis, wrist));
        }
      }
      if (rig.quadruped && entry.kind === 'elbow') angle *= .58;
      entry.joint.quaternion.copy(entry.baseQuaternion).multiply(hinge.setFromAxisAngle(axis, angle));
    }
  }
  global.HiveAlienMotion = Object.freeze({apply, strideLength});
})(typeof window === 'undefined' ? globalThis : window);
