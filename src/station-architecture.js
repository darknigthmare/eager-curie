/* Authored station topology, not another scatter of props. The physical hull
 * and room screens are installed before fixture placement. Elevated portals
 * use the ordinary wall cutaway, but never pretend to be ground obstacles. */
(function exposeStationArchitecture(global) {
  'use strict';
  const HULL = Object.freeze([
    [-75,-62],[-62,-62],[-62,-75],[56,-75],[56,-66],[75,-66],
    [75,54],[66,54],[66,75],[-54,75],[-54,64],[-75,64]
  ].map(([x,z])=>Object.freeze({x,z})));
  const PARTITIONS = Object.freeze([
    ['cryo-examination',-29,-47.5,1.2,19,'cryo'],['cryo-return',-25,-57,8,1.2,'cryo'],
    ['security-checkpoint',43,-36,15,1.2,'security'],['security-stores',51,-52,1.2,14,'security'],
    ['freight-decon',-47,-2,16,1.2,'freight'],['freight-store',-56,9,1.2,9,'freight'],
    ['colony-intake',35,7,1.2,12,'colony'],['colony-transfer',55,7,12,1.2,'colony'],
    ['refinery-control',-31,45,1.2,16,'refinery'],['refinery-baffle',-25,36,10,1.2,'refinery'],
    ['hive-approach',30,40,1.2,12,'nursery'],['hive-screen',39,35,18,1.2,'nursery'],
    ['cryo-bay-west',-50.5,-47,1.2,15,'cryo'],['cryo-bay-east',-35.25,-47,1.2,15,'cryo'],
    ['cryo-bay-head',-43,-55,5,1.2,'cryo'],['cryo-bay-foot',-48.5,-38,4,1.2,'cryo'],
    ['security-bay-west',37,-50,1.2,10,'security'],['security-bay-head',45,-57,6,1.2,'security'],
    ['refinery-bay-west',-56,50,1.2,12,'refinery'],['refinery-bay-east',-40,50,1.2,12,'refinery'],
    ['refinery-bay-head',-48,41,12,1.2,'refinery'],
    ['hive-bay-west',34,49,1.2,10,'nursery'],['hive-bay-east',50,50,1.2,12,'nursery'],
    ['hive-bay-head',42,40,4,1.2,'nursery'],
    ['spine-north-west',-9,-44,1.2,10,'transit'],['spine-north-east',9,-44,1.2,10,'transit'],
    ['spine-south-west',-9,44,1.2,12,'transit'],['spine-south-east',9,44,1.2,12,'transit']
  ].map(([id,x,z,width,depth,sector])=>Object.freeze({id,x,z,width,depth,sector,height:6.4})));
  const SECTORS = Object.freeze([
    {id:'cryo',label:'01  CRYO / BIOLOGIE',bounds:[-73,-17,-73,-27],color:0x82979a,accent:0x98c8cf},
    {id:'security',label:'02  SECURITE',bounds:[17,73,-73,-27],color:0x918b77,accent:0xe0bb75},
    {id:'freight',label:'03  FRET / SERVICES',bounds:[-73,-17,-22,22],color:0x64747a,accent:0x88a6ad},
    {id:'colony',label:'04  HABITAT / SAS',bounds:[17,73,-16,16],color:0x8d806c,accent:0xd0b483},
    {id:'refinery',label:'05  FONDERIE',bounds:[-73,-17,27,73],color:0x88705c,accent:0xe1a075},
    {id:'nursery',label:'06  NURSERIE',bounds:[17,73,27,73],color:0x485b4d,accent:0x9bba9c},
    {id:'transit',label:'MNEMOSYNE / TRANSIT',bounds:[-12,12,-73,73],color:0x748083,accent:0xaac2bd}
  ].map(s=>Object.freeze(s)));
  const BAYS=Object.freeze([
    {id:'cryo-treatment',label:'BIO-01 / OBSERVATION',sector:'cryo',bounds:[-49.3,-36.45,-53.8,-39.2]},
    {id:'security-inspection',label:'SEC-02 / CONTROLE',sector:'security',bounds:[38.2,49.8,-55.8,-44.4]},
    {id:'refinery-dispatch',label:'R5-01 / REACTEUR',sector:'refinery',bounds:[-54.8,-41.2,42.2,56.8]},
    {id:'hive-brood',label:'N6-01 / COUVEE',sector:'nursery',bounds:[35.2,48.8,41.2,54.8]}
  ].map(b=>Object.freeze(b)));
  const VOID = Object.freeze([
    {minX:-80,maxX:-62.4,minZ:-80,maxZ:-62.4},
    {minX:56.4,maxX:80,minZ:-80,maxZ:-66.4},
    {minX:66.4,maxX:80,minZ:54.4,maxZ:80},
    {minX:-80,maxX:-54.4,minZ:64.4,maxZ:80}
  ]);
  const sectorById = id=>SECTORS.find(s=>s.id===id);
  function hullWalls() {
    return HULL.map((a,i)=>{
      const b=HULL[(i+1)%HULL.length];
      return {x:(a.x+b.x)/2,z:(a.z+b.z)/2,width:Math.abs(b.x-a.x)||2,
        depth:Math.abs(b.z-a.z)||2,height:10.6};
    });
  }
  function polygonGeometry(T,points) {
    const shape=new T.Shape();
    points.forEach((p,i)=>shape[i?'lineTo':'moveTo'](p.x,-p.z));shape.closePath();
    const geometry=new T.ShapeGeometry(shape);
    // ShapeGeometry's world-sized UVs would repeat the floor hundreds of times.
    const uv=geometry.getAttribute('uv'),position=geometry.getAttribute('position');
    for(let i=0;i<uv.count;i++)uv.setXY(i,(position.getX(i)+80)/160,(-position.getY(i)+80)/160);
    geometry.setAttribute('uv2',uv.clone());return geometry;
  }
  function clip(points,bounds) {
    const [minX,maxX,minZ,maxZ]=bounds;
    for(const [axis,edge,sign]of[['x',minX,1],['x',maxX,-1],['z',minZ,1],['z',maxZ,-1]]) {
      const input=points;points=[];
      for(let i=0;i<input.length;i++) {
        const a=input[i],b=input[(i+1)%input.length],insideA=sign*(a[axis]-edge)>=0,insideB=sign*(b[axis]-edge)>=0;
        if(insideA)points.push(a);
        if(insideA!==insideB) {
          const t=(edge-a[axis])/(b[axis]-a[axis]);
          points.push({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});
        }
      }
    }
    return points;
  }
  function build(map,options={}) {
    if(map.architecture?.diagnostics?.version===1)return map.architecture;
    const T=options.THREE||global.THREE,parent=options.propsGroup||options.mapGroup;
    if(!T||!parent||typeof options.addWall!=='function')return null;
    const group=new T.Group();group.name='MNEMOSYNE · authored room structure';
    group.userData.hiveGlobalDecorations=true;group.userData.stationArchitecture=true;parent.add(group);
    const geometries=new Set(),materials=new Set(),textures=new Set(),batches=new Map(),portals=[];
    const diagnostics={version:1,hullVertices:HULL.length,boundarySegments:HULL.length,
      partitions:PARTITIONS.length,voidColliders:VOID.length,sectors:SECTORS.length,
      portals:0,instances:0,batches:0,triangles:0,dynamicLights:0,labels:0,roomBays:BAYS.length,observationModules:0};
    const geo=g=>(geometries.add(g),g),mat=m=>(materials.add(m),m);
    const box=geo(new T.BoxGeometry(1,1,1));
    const steel=mat(new T.MeshStandardMaterial({color:0x43535c,roughness:.58,metalness:.76}));
    const dark=mat(new T.MeshStandardMaterial({color:0x1c282c,roughness:.83,metalness:.3}));
    const resin=mat(new T.MeshStandardMaterial({color:0x263e31,roughness:.62,metalness:.25}));
    const colors=new Map(SECTORS.map(s=>[s.id,mat(new T.MeshStandardMaterial({color:s.accent,
      emissive:s.accent,emissiveIntensity:.24,roughness:.72,metalness:.18}))]));
    const dummy=new T.Object3D(),hiddenMatrix=new T.Matrix4().makeScale(0,0,0);
    function part(key,material,x,y,z,w,h,d,rotation=0,wall=null,geometry=box) {
      if(!batches.has(key))batches.set(key,{geometry,material,matrices:[]});
      dummy.position.set(x,y,z);dummy.rotation.set(0,rotation,0);dummy.scale.set(w,h,d);dummy.updateMatrix();
      batches.get(key).matrices.push({matrix:dummy.matrix.clone(),wall,visible:true});diagnostics.instances++;
    }
    for(const p of PARTITIONS) {
      const wall=options.addWall(p.x,p.z,p.width,p.height,p.depth);
      if(wall) {
        wall.name=`Room screen · ${p.id}`;wall.userData.architectureRoom=p.id;
        wall.material.color.setHex(sectorById(p.sector).color);
      }
    }
    // The clear centre is an observation/incubation volume, not an empty exam
    // bed. Three non-interactive diagnostic banks live wholly within the wall
    // collision padding; their casing, sample tubes and print remain cutaway.
    const sampleTube=geo(new T.CylinderGeometry(1,1,1,8,1));
    for(const [wallId,x,z,facing]of[
      ['cryo-bay-west',-49.68,-50.5,1],['cryo-bay-west',-49.68,-43.5,1],
      ['cryo-bay-east',-36.07,-47,-1]
    ]) {
      const owner=map.walls.find(w=>w.userData.architectureRoom===wallId);
      part('screen-shoulders',dark,x,2.6,z,.38,1.55,1.9,0,owner);
      const face=x+facing*.22,tubeX=x+facing*.26;
      part('screen-indicators-cryo',colors.get('cryo'),face,2.6,z,.035,1.05,1.45,0,owner);
      for(const offset of[-.5,0,.5]) {
        part('observation-sample-tubes',colors.get('cryo'),tubeX,2.6,z+offset,.075,.9,.075,0,owner,sampleTube);
        for(const y of[2.1,3.1])part('portal-posts',steel,tubeX,y,z+offset,.13,.065,.16,0,owner);
      }
      for(const y of[2,3.2])part('screen-shoulders',dark,face+facing*.012,y,z,.045,.045,1.3,0,owner);
      diagnostics.observationModules++;
    }
    map.colliders.push(...VOID.map((v,i)=>({...v,isHullVoid:true,architectureId:`hull-void-${i}`})));
    for(const sector of SECTORS) {
      const points=clip(HULL.map(p=>({...p})),sector.bounds);
      const floorMaterial=mat(options.floorMaterial?.clone?.()||new T.MeshStandardMaterial({roughness:.85,metalness:.45}));
      floorMaterial.color.setHex(sector.color);floorMaterial.roughness=.86;floorMaterial.metalness=sector.id==='nursery'?.22:.48;
      const floor=new T.Mesh(geo(polygonGeometry(T,points)),floorMaterial);
      floor.rotation.x=-Math.PI/2;floor.position.y=.012;floor.receiveShadow=true;
      floor.name=`Sector floor · ${sector.id}`;group.add(floor);
    }
    // Human-scale work bays have actual enclosing screens and open approaches,
    // not merely a different sector name on another enormous uniform floor.
    for(const bay of BAYS) {
      const [left,right,north,south]=bay.bounds,sector=sectorById(bay.sector);
      const material=mat(options.floorMaterial?.clone?.()||new T.MeshStandardMaterial());
      material.color.setHex(sector.color).multiplyScalar(bay.sector==='nursery'?.85:.76);
      material.roughness=.86;material.metalness=.22;
      const floor=new T.Mesh(geo(polygonGeometry(T,[{x:left,z:north},{x:right,z:north},{x:right,z:south},{x:left,z:south}])),material);
      floor.rotation.x=-Math.PI/2;floor.position.y=.023;floor.receiveShadow=true;
      floor.name=`Work bay floor · ${bay.id}`;group.add(floor);
      for(const x of[left+.35,right-.35])for(const z of[north+.35,south-.35]) {
        const side=x<(left+right)/2?1:-1,heading=z<(north+south)/2?1:-1;
        part(`portal-guide-${bay.sector}`,colors.get(bay.sector),x+side*.65,.044,z,1.35,.015,.07);
        part(`portal-guide-${bay.sector}`,colors.get(bay.sector),x,.044,z+heading*.65,.07,.015,1.35);
      }
    }
    // Local frames replace nine 140-unit bars across the entire map. Posts are
    // inside existing wall footprints; the overhead lintels are cutaway-only.
    function portal(id,x,z,width,sector,height=6.9) {
      const material=mat(steel.clone());material.transparent=true;
      const beam=new T.Mesh(geo(new T.BoxGeometry(width+.6,.42,.72)),material);
      beam.position.set(x,height,z);beam.castShadow=true;beam.receiveShadow=true;
      beam.name=`Local portal · ${id}`;beam.userData.architecturePortal=true;
      group.add(beam);map.walls.push(beam);portals.push(beam);
      for(const side of[-1,1])part('portal-posts',steel,x+side*width/2,height/2,z,.3,height,.6,0,beam);
      part(`portal-guide-${sector}`,colors.get(sector),x,.043,z,.12,.025,3.8);
      diagnostics.portals++;
    }
    for(const [id,x,z,sector]of[['cryo',-18,-25,'cryo'],['security',18,-25,'security'],
      ['refinery',-18,25,'refinery'],['nursery',18,25,'nursery']])portal(id,x,z,5.5,sector);
    portal('spine-north',0,-44,18,'transit',7.2);portal('spine-south',0,44,18,'transit',7.2);
    portal('cryo-treatment',-42.875,-47,15.25,'cryo');
    portal('security-inspection',44,-50,14,'security');
    portal('refinery-dispatch',-48,50,16,'refinery');
    // Ribs stand on the new nursery screens, outside their walking footprint.
    // The low-frequency arch silhouette is geometry, not a wall painted green.
    const ribs=geo(new T.TubeGeometry(new T.CatmullRomCurve3([
      new T.Vector3(-9,0,0),new T.Vector3(-8,4.8,0),new T.Vector3(0,8,0),
      new T.Vector3(8,4.8,0),new T.Vector3(9,0,0)
    ]),20,.24,7,false));
    for(const z of[34.5,35.5]) {
      const ribMaterial=mat(resin.clone());ribMaterial.transparent=true;
      const arch=new T.Mesh(ribs,ribMaterial);arch.position.set(39,0,z);arch.name='Nursery structural rib';
      arch.userData.architecturePortal=true;group.add(arch);map.walls.push(arch);portals.push(arch);
    }
    const broodRib=geo(new T.TubeGeometry(new T.CatmullRomCurve3([
      new T.Vector3(-8,0,0),new T.Vector3(-7.3,5.4,0),new T.Vector3(0,8.4,0),
      new T.Vector3(7.3,5.4,0),new T.Vector3(8,0,0)
    ]),20,.28,7,false));
    for(const z of[46,51,54]) {
      const material=mat(resin.clone());material.color.setHex(0x506958);material.transparent=true;
      const arch=new T.Mesh(broodRib,material);arch.position.set(42,0,z);
      arch.name='Brood chamber · central resin rib';arch.userData.architecturePortal=true;
      group.add(arch);map.walls.push(arch);portals.push(arch);
    }
    // Inset service recesses sit against the new screens, never in a corridor.
    for(const p of PARTITIONS) {
      const owner=map.walls.find(wall=>wall.userData.architectureRoom===p.id);
      const alongX=p.width>p.depth,length=alongX?p.width:p.depth;
      const inset=Math.max(0,Math.min(4,length/2-1.1));
      for(const side of[-1,1]) {
        const x=p.x+(alongX?side*inset:0),z=p.z+(alongX?0:side*inset);
        part('screen-shoulders',dark,x,1.05,z,alongX?1.65:.9,1.9,alongX?.9:1.65,0,owner);
        part(`screen-indicators-${p.sector}`,colors.get(p.sector),x,2.15,z,alongX?1.2:.72,.09,alongX?.72:1.2,0,owner);
      }
    }
    // A single static atlas, large enough to read as room/route signage. Tests
    // without a DOM still exercise all physical architecture and geometry.
    if(global.document?.createElement) {
      const canvas=global.document.createElement('canvas');canvas.width=canvas.height=1024;
      const context=canvas.getContext('2d');
      if(context) {
        const labels=[...SECTORS,...BAYS.map(b=>({...b,accent:sectorById(b.sector).accent}))];
        labels.forEach((s,i)=>{
          const x=(i%4)*256,y=Math.floor(i/4)*256;
          context.fillStyle=`#${s.accent.toString(16).padStart(6,'0')}`;context.fillRect(x+10,y+13,236,5);
          context.font='bold 23px monospace';context.textAlign='left';
          const words=s.label.split(' / ');words.forEach((word,line)=>context.fillText(word,x+15,y+81+line*34,228));
          context.font='14px monospace';context.fillText('MNEMOSYNE',x+15,y+216,228);
        });
        const texture=new T.CanvasTexture(canvas);texture.encoding=T.sRGBEncoding;textures.add(texture);
        const labelMat=mat(new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1}));
        const labelPositions=[[-24,-29], [24,-29],[-36,-6],[36,10],[-24,31],[24,31],[0,-29],
          ...BAYS.map(b=>[(b.bounds[0]+b.bounds[1])/2,b.bounds[2]+2.3])];
        labelPositions.forEach(([x,z],i)=>{
          const geometry=geo(new T.PlaneGeometry(i<7?8:6.7,i<7?5.3:4.1)),uv=geometry.getAttribute('uv');
          for(let j=0;j<uv.count;j++)uv.setXY(j,(i%4+uv.getX(j))/4,(3-Math.floor(i/4)+uv.getY(j))/4);
          const mesh=new T.Mesh(geometry,labelMat);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.043,z);
          mesh.name=`Room identifier · ${labels[i].id}`;mesh.renderOrder=2;group.add(mesh);diagnostics.labels++;
        });
      }
    }
    for(const [name,batch]of batches) {
      const mesh=new T.InstancedMesh(batch.geometry,batch.material,batch.matrices.length);
      mesh.name=`Station architecture · ${name}`;mesh.frustumCulled=false;mesh.receiveShadow=true;
      batch.matrices.forEach((row,i)=>mesh.setMatrixAt(i,row.matrix));mesh.instanceMatrix.needsUpdate=true;
      mesh.onBeforeRender=()=>{
        let changed=false;
        batch.matrices.forEach((row,i)=>{
          if(!row.wall)return;
          const visible=row.wall.visible!==false&&(row.wall.material.opacity??1)>=.88;
          if(visible===row.visible)return;
          row.visible=visible;mesh.setMatrixAt(i,visible?row.matrix:hiddenMatrix);changed=true;
        });
        if(changed)mesh.instanceMatrix.needsUpdate=true;
      };
      group.add(mesh);
    }
    diagnostics.batches=batches.size;
    diagnostics.overheadCutaways=portals.length;
    group.traverse(object=>{
      if(!object.isMesh)return;
      const geometry=object.geometry,count=(geometry.index?.count||geometry.getAttribute('position').count)/3;
      diagnostics.triangles+=count*(object.isInstancedMesh?object.count:1);
    });
    map.architectureDiagnostics=diagnostics;
    map.architecture={group,diagnostics,portals};return map.architecture;
  }
  function containsHull(x,z) {
    if(!Number.isFinite(x)||!Number.isFinite(z))return false;
    let inside=false;
    for(let i=0,j=HULL.length-1;i<HULL.length;j=i++) {
      const a=HULL[i],b=HULL[j];
      if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)inside=!inside;
    }
    return inside;
  }
  function zoneAt(x,z) {
    if(!containsHull(x,z))return null;
    const sector=SECTORS.find(s=>x>=s.bounds[0]&&x<=s.bounds[1]&&z>=s.bounds[2]&&z<=s.bounds[3])||sectorById('transit');
    return {id:sector.id,label:sector.label,code:({cryo:'C1',security:'S2',freight:'F3',colony:'H4',refinery:'R5',nursery:'N6',transit:'T0'})[sector.id],color:sector.accent};
  }
  const api=Object.freeze({build,zoneAt,containsHull,getHull:()=>HULL.map(p=>({...p})),getHullWalls:hullWalls,
    getPartitions:()=>PARTITIONS.map(p=>({...p})),getSectors:()=>SECTORS.map(p=>({...p,bounds:[...p.bounds]})),
    getRoomBays:()=>BAYS.map(b=>({...b,bounds:[...b.bounds]})),
    createFloorGeometry:T=>polygonGeometry(T,HULL)});
  global.HiveStationArchitecture=api;
  if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
