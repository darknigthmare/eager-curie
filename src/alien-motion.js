/* Secondary articulated motion for the continuous modern creature skin.
 * Proximal actions still come from the native campaign rig. These hinge poses
 * are evaluated from bind quaternions every frame, never accumulated.
 */
(function exposeAlienMotion(global) {
  'use strict';
  const clamp = value => Math.max(0, Math.min(1, Number(value) || 0));
  let hinge = null, axis = null;
  function apply(model, state = {}) {
    const rig = model?.userData?.modernMotionRig;
    if (!rig?.bends?.length || !global.THREE) return;
    hinge ||= new global.THREE.Quaternion();
    axis ||= new global.THREE.Vector3(1, 0, 0);
    const phase = Number.isFinite(state.phase) ? state.phase : 0;
    const movement = clamp(state.movement), crouch = clamp(state.crouch);
    const attack = Math.sin(clamp(state.attack) * Math.PI);
    const action = String(state.action || 'melee').toLowerCase();
    const pose = String(state.pose || '').toLowerCase();
    const emergence = pose === 'emergence' ? 1 - clamp(state.poseProgress) : 0;
    const leap = /ambush|leap|pounce|charge|dive|ram/.test(action);
    const weaving = /cocoon|weave|resin/.test(action);
    const tailStrike = /tail|sting|impale/.test(action);
    const projectile = /spit|acid|spray|hiss|roar/.test(action);
    const biting = /jaw|bite|snap/.test(action);
    for (const entry of rig.bends) {
      if (!entry.joint || !entry.baseQuaternion) continue;
      const offset = entry.side < 0 ? 0 : Math.PI;
      const swing = Math.sin(phase + offset);
      const idle = state.reducedMotion ? 0 : Math.sin(phase * .43 + offset) * .018;
      let angle;
      if (entry.kind === 'knee') {
        // The trailing leg folds during recovery; the planted leg stays long.
        angle = .055 + Math.max(0, -swing) * .72 * movement + crouch * .82;
        angle += attack * (leap ? .88 : tailStrike ? .16 : .08);
        angle += emergence * 1.03 + idle;
      } else {
        // A relaxed claw hangs from a slightly flexed elbow, not a straight rod.
        angle = -(.12 + (.14 + Math.max(0, swing) * .32) * movement + crouch * .24);
        // The proximal campaign pose already raises the arm. A jaw strike
        // braces below the mouth instead of folding bright claws into the teeth.
        angle -= attack * (weaving ? .66 : leap ? .73 : projectile ? .19 : tailStrike ? .23 : biting ? .28 : .62);
        angle -= emergence * .79 + idle;
        if (weaving) angle -= Math.sin(phase * 1.4 + offset) * attack * .13;
      }
      if (rig.quadruped && entry.kind === 'elbow') angle *= .58;
      entry.joint.quaternion.copy(entry.baseQuaternion).multiply(hinge.setFromAxisAngle(axis, angle));
    }
  }
  global.HiveAlienMotion = Object.freeze({apply});
})(typeof window === 'undefined' ? globalThis : window);
