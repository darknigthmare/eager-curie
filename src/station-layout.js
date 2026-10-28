/* Deterministic circulation pass for the authored station.
 * It moves existing fixtures with their interaction record and ALL owned
 * colliders. Architecture, doors, scripted actors and hazards are not deleted.
 * Footprints are the authored gameplay colliders, not solid bounding boxes
 * around every elevated pipe, arch or moving appendage.
 */
(function exposeStationLayout(global) {
  'use strict';
  const LIMIT = 71.8, WORLD_LIMIT = 73.4, GAP = .55, ACTOR = .72;
  const sectors = Object.freeze({
    cryo: [-69, -20, -69, -29], security: [20, 69, -69, -29],
    refinery: [-69, -20, 29, 69], nursery: [20, 69, 29, 69],
    serviceWest: [-69, -20, -21, 21], serviceEast: [20, 69, -14, 14],
    transit: [-11, 11, -69, 69]
  });
  const landmarks = Object.freeze([
    {id:'door_cryo', x:-18,z:-25,radius:3.7}, {id:'door_armory',x:18,z:-25,radius:3.7},
    {id:'door_reactor',x:-18,z:25,radius:3.7}, {id:'door_nursery',x:18,z:25,radius:3.7},
    {id:'egg_derelict',x:-43,z:-47,radius:4.8}, {id:'egg_hive',x:42,z:48,radius:4.8},
    {id:'egg_ship',x:-43,z:8,radius:4.8}, {id:'egg_colony',x:40,z:-6,radius:4.8},
    {id:'relay_refinery',x:-48,z:48,radius:3.7}, {id:'relay_north',x:0,z:-52,radius:3.7},
    {id:'relay_east',x:50,z:-4,radius:3.7}, {id:'queen_nursery',x:55,z:45,radius:3.7}
  ]);
  const lanes = Object.freeze([
    {id:'central_spine',minX:-3.6,maxX:3.6,minZ:-70,maxZ:70},
    {id:'north_crossing',minX:-22,maxX:22,minZ:-23,maxZ:-19.5},
    {id:'south_crossing',minX:-22,maxX:22,minZ:19.5,maxZ:23},
    {id:'security_bay_aisle',minX:39,maxX:42,minZ:-55,maxZ:-39},
    {id:'security_bay_threshold',minX:38.8,maxX:50,minZ:-44.5,maxZ:-38.5},
    {id:'hive_north_crossing',minX:20,maxX:65,minZ:27.5,maxZ:31.5},
    {id:'hive_bay_threshold',minX:31.7,maxX:57.5,minZ:37.4,maxZ:42}
  ]);
  // Do not repair a machine placement by putting it on a scripted encounter.
  // A few legacy actor anchors are already inside architecture; this cannot
  // move those walls and does not replace the actor's own safe-spawn resolver.
  const encounterClearances = Object.freeze([
    [-14,-12],[24,-2],[-30,18],[28,25],[36,-22],[12,-26],[-45,35],[-35,-20],
    [-40,40],[38,-32],[-22,-30],[-18,15],[16,-10],[35,25],[-25,-15],[-10,20],[-6,16],
    [-42,-38],[-24,34],[38,-26],[-6,18],[22,-42],[-36,12],[12,-28],[2,-48],
    [-20,-10],[6,-18],[-38,-8]
  ].map(([x,z])=>({x,z,radius:1.3})));
  const encounterReservations = new WeakMap();
  function originalClearances(map) {
    if(!encounterReservations.has(map)) encounterReservations.set(map,
      encounterClearances.filter(p=>typeof map.checkCollision==='function' && !map.checkCollision(p.x,p.z,.88)));
    return encounterReservations.get(map);
  }
  const finite = value => Number.isFinite(value);
  const overlap = (a,b,pad=0) => a.minX < b.maxX+pad && a.maxX > b.minX-pad &&
    a.minZ < b.maxZ+pad && a.maxZ > b.minZ-pad;
  const validBox = b => b && [b.minX,b.maxX,b.minZ,b.maxZ].every(finite) && b.maxX>b.minX && b.maxZ>b.minZ;
  const outOfBounds = b => b.minX < -WORLD_LIMIT || b.maxX > WORLD_LIMIT || b.minZ < -WORLD_LIMIT || b.maxZ > WORLD_LIMIT;
  const edgeClearance = b => b.minX < -LIMIT || b.maxX > LIMIT || b.minZ < -LIMIT || b.maxZ > LIMIT;
  const circleOverlap = (b,p) => Math.hypot(Math.max(b.minX-p.x,0,p.x-b.maxX),
    Math.max(b.minZ-p.z,0,p.z-b.maxZ)) < p.radius;
  const reserved = (b,encounters=[]) => lanes.some(lane=>overlap(b,lane,.15)) || landmarks.some(p=>circleOverlap(b,p))
    || encounters.some(p=>circleOverlap(b,p));
  function unionBounds(colliders) {
    return {minX:Math.min(...colliders.map(c=>c.minX)),maxX:Math.max(...colliders.map(c=>c.maxX)),
      minZ:Math.min(...colliders.map(c=>c.minZ)),maxZ:Math.max(...colliders.map(c=>c.maxZ))};
  }
  function collect(map) {
    const labels = new Map();
    for(const [key,list] of Object.entries(map)) if(Array.isArray(list)) list.forEach((record,index)=>{
      if(record && typeof record==='object' && finite(record.x) && finite(record.z) && !labels.has(record))
        labels.set(record,{collection:key,index});
    });
    const owners = new Map(), fixed = [];
    for(const collider of map.colliders || []) {
      if(!validBox(collider)) {fixed.push(collider);continue;}
      const record = Object.entries(collider).find(([key,value]) => /Ref$/.test(key) && value &&
        typeof value==='object' && finite(value.x) && finite(value.z))?.[1];
      if(!record || Object.isFrozen(record)) {fixed.push(collider);continue;}
      if(!owners.has(record)) {
        const label=labels.get(record)||{collection:'fixtures',index:owners.size};
        owners.set(record,{record,colliders:[],...label,uid:`${label.collection}:${label.index}:${record.id||record.type||'prop'}`});
      }
      owners.get(record).colliders.push(collider);
    }
    const entries=[...owners.values()];
    for(const entry of entries)entry.bounds=unionBounds(entry.colliders);
    return {entries,fixed:fixed.filter(validBox),encounters:originalClearances(map)};
  }
  function sectorFor(entry) {
    const {x,z}=entry.record;
    if(outOfBounds(entry.bounds) && /lead|quench|ingot|control_rod|furnace/i.test(`${entry.collection} ${entry.record.id}`)) return 'refinery';
    if(x<=-14 && z<=-22)return 'cryo';
    if(x>=14 && z<=-22)return 'security';
    if(x<=-14 && z>=22)return 'refinery';
    if(x>=14 && z>=22)return 'nursery';
    if(x<=-14)return 'serviceWest';
    if(x>=14)return 'serviceEast';
    return 'transit';
  }
  function translated(entry,x,z) {
    const dx=x-entry.record.x,dz=z-entry.record.z,b=entry.bounds;
    return {minX:b.minX+dx,maxX:b.maxX+dx,minZ:b.minZ+dz,maxZ:b.maxZ+dz};
  }
  function candidates(entry,sector,encounters,fine=false) {
    const box=sectors[sector],list=[];
    // Closest available bay wins; regular station spacing makes neighboring
    // machinery read as a service bank rather than random scattered clutter.
    const b=entry.bounds,rx=entry.record.x,rz=entry.record.z;
    const xs=[box[0]-(b.minX-rx)+.01,box[1]-(b.maxX-rx)-.01];
    const zs=[box[2]-(b.minZ-rz)+.01,box[3]-(b.maxZ-rz)-.01];
    const step=fine?1.75:3.5;
    for(let x=box[0]+1.5;x<=box[1]-1.5;x+=step)xs.push(x);
    for(let z=box[2]+1.5;z<=box[3]-1.5;z+=step)zs.push(z);
    for(const x of new Set(xs))for(const z of new Set(zs)) {
      const b=translated(entry,x,z);
      if(b.minX<box[0]||b.maxX>box[1]||b.minZ<box[2]||b.maxZ>box[3]||edgeClearance(b)||reserved(b,encounters))continue;
      const edge=Math.min(x-box[0],box[1]-x,z-box[2],box[3]-z);
      const storage=/crate|barrel|rack|locker|pallet/i.test(`${entry.record.type} ${entry.record.id}`);
      list.push({x,z,b,score:Math.hypot(x-entry.record.x,z-entry.record.z)+(storage?edge*.15:0)});
    }
    return list.sort((a,b)=>a.score-b.score||a.x-b.x||a.z-b.z);
  }
  function approaches(bounds) {
    const x=(bounds.minX+bounds.maxX)/2,z=(bounds.minZ+bounds.maxZ)/2,d=ACTOR+.4;
    return [{x:bounds.minX-d,z},{x:bounds.maxX+d,z},{x,z:bounds.minZ-d},{x,z:bounds.maxZ+d},
      {x:bounds.minX-d,z:bounds.minZ-d},{x:bounds.maxX+d,z:bounds.minZ-d},
      {x:bounds.minX-d,z:bounds.maxZ+d},{x:bounds.maxX+d,z:bounds.maxZ+d}];
  }
  function metrics(map,data) {
    let overlaps=0,wallConflicts=0,noApproach=0;
    const entries=data.entries;
    for(let i=0;i<entries.length;i++) {
      const b=unionBounds(entries[i].colliders);entries[i].bounds=b;
      wallConflicts+=data.fixed.some(c=>overlap(b,c))?1:0;
      for(let j=0;j<i;j++)if(overlap(b,entries[j].bounds))overlaps++;
      if(typeof map.checkCollision==='function' && !approaches(b).some(p=>!map.checkCollision(p.x,p.z,ACTOR)))noApproach++;
    }
    return {fixtures:entries.length,outside:entries.filter(e=>outOfBounds(e.bounds)).length,
      edgeClearanceConflicts:entries.filter(e=>edgeClearance(e.bounds)).length,
      fixedConflicts:wallConflicts,fixtureOverlapPairs:overlaps,
      reservedConflicts:entries.filter(e=>reserved(e.bounds,data.encounters)).length,noFreeApproach:noApproach};
  }
  function addWayfinding(map,options) {
    const T=global.THREE, parent=options.propsGroup;
    if(!T || !parent?.add || options.wayfinding===false)return {meshes:0,triangles:0};
    const group=new T.Group();group.name='station-circulation-markings';
    const batches=new Map(),colors={spine:0x779597,cryo:0x6198ae,security:0xc49757,refinery:0xbb7152,nursery:0x729e74};
    function triangle(kind,a,b,c){if(!batches.has(kind))batches.set(kind,[]);batches.get(kind).push(...a,...b,...c);}
    function rectangle(kind,x,z,w,d){const y=.032,a=[x-w/2,y,z-d/2],b=[x+w/2,y,z-d/2],c=[x+w/2,y,z+d/2],e=[x-w/2,y,z+d/2];triangle(kind,a,c,b);triangle(kind,a,e,c);}
    for(let z=-66;z<=66;z+=8)for(const side of [-1,1])rectangle('spine',side*3.15,z,.1,2.4);
    for(const [kind,x,z,heading] of [['cryo',-18,-29,-1],['security',18,-29,-1],['refinery',-18,29,1],['nursery',18,29,1]]) {
      for(let step=0;step<2;step++) {
        const at=z+heading*step*1.8,y=.034;
        triangle(kind,[x-.6,y,at-heading*.45],[x+.6,y,at-heading*.45],[x,y,at+heading*.7]);
      }
    }
    let count=0;
    for(const [kind,positions]of batches) {
      const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
      geometry.computeVertexNormals();geometry.computeBoundingSphere();
      const material=new T.MeshBasicMaterial({color:colors[kind],transparent:true,opacity:.56,depthWrite:false,
        side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1});
      const mesh=new T.Mesh(geometry,material);mesh.name=`circulation-${kind}`;mesh.renderOrder=1;group.add(mesh);count+=positions.length/9;
    }
    group.userData.stationLayout=true;parent.add(group);map.layoutWayfinding=group;
    return {meshes:batches.size,triangles:count};
  }
  function analyze(map) {
    const data=collect(map);
    return {...metrics(map,data),landmarks:landmarks.map(p=>({id:p.id,x:p.x,z:p.z,
      free:typeof map.checkCollision==='function'?!map.checkCollision(p.x,p.z,ACTOR):null}))};
  }
  function apply(map,options={}) {
    if(!map || !Array.isArray(map.colliders))return null;
    if(map.layoutDiagnostics?.version===1)return map.layoutDiagnostics;
    const data=collect(map),before=metrics(map,data),accepted=[...data.fixed],moves=[],unresolved=[];
    // Give the large functional equipment a real service bay before placing
    // smaller crates around it. Otherwise preserving every tiny original box
    // first can exile a reactor generator into an unrelated sector.
    const order=[...data.entries].sort((a,b)=>
      (b.bounds.maxX-b.bounds.minX)*(b.bounds.maxZ-b.bounds.minZ)-
      (a.bounds.maxX-a.bounds.minX)*(a.bounds.maxZ-a.bounds.minZ)||a.uid.localeCompare(b.uid));
    for(const entry of order) {
      const reasons=[];
      if(outOfBounds(entry.bounds))reasons.push('outside');
      else if(edgeClearance(entry.bounds))reasons.push('edge-clearance');
      if(reserved(entry.bounds,data.encounters))reasons.push('circulation');
      if(accepted.some(c=>overlap(entry.bounds,c,GAP)))reasons.push('overlap');
      if(!reasons.length){accepted.push(...entry.colliders);continue;}
      const preferred=sectorFor(entry);
      let destination=candidates(entry,preferred,data.encounters).find(point=>!accepted.some(c=>overlap(point.b,c,GAP)));
      if(!destination)destination=candidates(entry,preferred,data.encounters,true).find(point=>!accepted.some(c=>overlap(point.b,c,GAP)));
      if(!destination){unresolved.push(entry.uid);accepted.push(...entry.colliders);continue;}
      destination.sector=preferred;
      const from={x:entry.record.x,z:entry.record.z},dx=destination.x-from.x,dz=destination.z-from.z;
      entry.record.x=destination.x;entry.record.z=destination.z;
      const mesh=entry.record.mesh;
      if(mesh?.position){mesh.position.x+=dx;mesh.position.z+=dz;mesh.updateMatrixWorld?.(true);}
      for(const c of entry.colliders){c.minX+=dx;c.maxX+=dx;c.minZ+=dz;c.maxZ+=dz;}
      accepted.push(...entry.colliders);
      moves.push({id:entry.uid,from,to:{x:destination.x,z:destination.z},sector:destination.sector,reasons});
    }
    const after=metrics(map,data),markings=addWayfinding(map,options);
    const diagnostics={version:1,basis:'authored-gameplay-footprints',before,after,moves,unresolved,markings,
      landmarks:analyze(map).landmarks,reservedLanes:lanes.map(lane=>({...lane})),
      encounterClearances:data.encounters.map(point=>({...point}))};
    map.layoutDiagnostics=diagnostics;
    return diagnostics;
  }
  global.HiveStationLayout=Object.freeze({apply,analyze,getReservedLandmarks:()=>landmarks.map(p=>({...p})),
    getReservedLanes:()=>lanes.map(lane=>({...lane}))});
})(typeof window==='undefined'?globalThis:window);
