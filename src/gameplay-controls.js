/* Shared physical traversal and intentional target selection. No renderer or
 * world singleton: the same rules drive real input and deterministic tests. */
(function exposeGameplayControls(global) {
  'use strict';
  const finitePoint = p => !!p && Number.isFinite(p.x) && Number.isFinite(p.z);
  const radius = form => form === 'drone' ? .88 : form === 'facehugger' ? .34 : .28;
  const distance = (a,b) => Math.hypot(a.x-b.x,a.z-b.z);
  function clampPoint(point) {
    return {x:Math.max(-70,Math.min(70,point.x)),z:Math.max(-70,Math.min(70,point.z))};
  }
  function clearSegment(map,from,to,padding=0) {
    if(!finitePoint(from)||!finitePoint(to)||!map)return false;
    // Steam obscures sight, not physical movement. Do not use visual LOS as a
    // collision test when the actual collider list is available.
    if(Array.isArray(map.colliders)&&typeof map.segmentIntersectsCollider==='function')
      return !map.colliders.some(c=>map.segmentIntersectsCollider(from.x,from.z,to.x,to.z,c,padding));
    return !!map.hasLineOfSight?.(from.x,from.z,to.x,to.z,padding);
  }
  function canStand(map,point,padding=0) {
    return finitePoint(point)&&Math.abs(point.x)<=70&&Math.abs(point.z)<=70&&
      !map.checkCollision(point.x,point.z,padding);
  }
  function moveWithSlide(map,from,requested,padding=0) {
    if(!finitePoint(from)||!finitePoint(requested))return {x:from?.x||0,z:from?.z||0,moved:false,blocked:true};
    const goal=clampPoint(requested),dx=goal.x-from.x,dz=goal.z-from.z;
    const axes=Math.abs(dx)>=Math.abs(dz)?[{x:goal.x,z:from.z},{x:from.x,z:goal.z}]:
      [{x:from.x,z:goal.z},{x:goal.x,z:from.z}];
    for(const point of [goal,...axes]) {
      if(distance(from,point)<1e-7)continue;
      if(canStand(map,point,padding)&&clearSegment(map,from,point,padding))
        return {...point,moved:true,blocked:point!==goal};
    }
    return {x:from.x,z:from.z,moved:false,blocked:distance(from,goal)>1e-7};
  }
  function inReach(map,from,target,range) {
    return finitePoint(from)&&finitePoint(target)&&distance(from,target)<=range&&
      !!map.hasLineOfSight?.(from.x,from.z,target.x,target.z,.08);
  }
  function approachPath(map,from,target,{range=2.7,padding=.88}={}) {
    if(!finitePoint(from)||!finitePoint(target))return [];
    if(inReach(map,from,target,range))return [{x:from.x,z:from.z}];
    const candidates=[];
    for(let i=0;i<12;i++) {
      const angle=i*Math.PI/6;
      candidates.push({x:target.x+Math.cos(angle)*range*.82,z:target.z+Math.sin(angle)*range*.82});
    }
    candidates.sort((a,b)=>distance(from,a)-distance(from,b));
    for(const point of candidates) {
      if(!canStand(map,point,padding)||!inReach(map,point,target,range))continue;
      const path=map.findPath(from.x,from.z,point.x,point.z,{step:2.5,padding});
      const end=path?.at(-1);
      // A* may return its closest partial route. It is not proof that a target
      // behind a sealed bulkhead can actually be reached.
      if(end&&inReach(map,end,target,range)&&path.every(finitePoint))return path;
    }
    return [];
  }
  function sweptDestination(map,from,to,{range=12,padding=.88,truncate=false}={}) {
    if(!finitePoint(from)||!finitePoint(to)||distance(from,to)>range+.001)return null;
    if(canStand(map,to,padding)&&clearSegment(map,from,to,padding))return {x:to.x,z:to.z};
    if(!truncate)return null;
    const length=distance(from,to),steps=Math.max(1,Math.ceil(length/.25));
    let last={x:from.x,z:from.z};
    for(let i=1;i<=steps;i++) {
      const point={x:from.x+(to.x-from.x)*i/steps,z:from.z+(to.z-from.z)*i/steps};
      if(!canStand(map,point,padding)||!clearSegment(map,last,point,padding))break;
      last=point;
    }
    return distance(from,last)>=.6?last:null;
  }
  function pickTarget(humans,point,radius=3.2) {
    if(!finitePoint(point))return null;
    return (humans||[]).filter(h=>finitePoint(h)&&!h.isCocooned&&!h.isDestroyed&&
      !h.isConsumedByCycle&&!h.isEscaped&&distance(h,point)<radius)
      .sort((a,b)=>distance(a,point)-distance(b,point))[0]||null;
  }
  global.HiveGameplayControls=Object.freeze({finitePoint,radius,distance,clearSegment,
    canStand,moveWithSlide,inReach,approachPath,sweptDestination,pickTarget});
})(typeof window==='undefined'?globalThis:window);
