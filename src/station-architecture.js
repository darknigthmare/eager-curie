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
    const qualityTier=profile=>/low|performance|mobile/i.test(typeof profile==='string'?profile:profile?.name||profile?.quality||'high')?0:1;
    let tier=qualityTier(options.quality);
    const diagnostics={version:1,hullVertices:HULL.length,boundarySegments:HULL.length,
      partitions:PARTITIONS.length,voidColliders:VOID.length,sectors:SECTORS.length,
      portals:0,instances:0,batches:0,triangles:0,dynamicLights:0,labels:0,roomBays:BAYS.length,observationModules:0,
      functionalModules:0,functionalSectors:0,functionalInstances:0,qualityTier:tier};
    const geo=g=>(geometries.add(g),g),mat=m=>(materials.add(m),m);
    const box=geo(new T.BoxGeometry(1,1,1));
    const steel=mat(new T.MeshStandardMaterial({color:0x43535c,roughness:.58,metalness:.76}));
    const dark=mat(new T.MeshStandardMaterial({color:0x1c282c,roughness:.83,metalness:.3}));
    const resin=mat(new T.MeshStandardMaterial({color:0x263a28,roughness:.54,metalness:.08}));
    // Striated chitin under the same station lighting, not a smooth grey tube.
    // A tiny shared normal field stays deterministic/offline and adds no draw.
    const chitinData=new Uint8Array(64*64*4);
    const ridge=(x,y)=>Math.sin(x*.6+Math.sin(y*.25)*1.7)*.34+Math.sin(x*.18+y*.12)*.12;
    for(let y=0;y<64;y++)for(let x=0;x<64;x++) {
      const nx=(ridge(x-1,y)-ridge(x+1,y))*.8,ny=(ridge(x,y-1)-ridge(x,y+1))*.8;
      const normal=new T.Vector3(nx,ny,1).normalize(),i=(y*64+x)*4;
      chitinData[i]=Math.round((normal.x*.5+.5)*255);chitinData[i+1]=Math.round((normal.y*.5+.5)*255);
      chitinData[i+2]=Math.round((normal.z*.5+.5)*255);chitinData[i+3]=255;
    }
    const chitinNormal=new T.DataTexture(chitinData,64,64,T.RGBAFormat);chitinNormal.wrapS=chitinNormal.wrapT=T.RepeatWrapping;
    chitinNormal.repeat.set(2,3);chitinNormal.needsUpdate=true;textures.add(chitinNormal);resin.normalMap=chitinNormal;resin.normalScale.set(.8,.8);
    const resinBands=mat(resin.clone());resinBands.color.setHex(0x58694a);resinBands.roughness=.63;
    const colors=new Map(SECTORS.map(s=>[s.id,mat(new T.MeshStandardMaterial({color:s.accent,
      emissive:s.accent,emissiveIntensity:.24,roughness:.72,metalness:.18}))]));
    const dummy=new T.Object3D(),hiddenMatrix=new T.Matrix4().makeScale(0,0,0);
    function part(key,material,x,y,z,w,h,d,rotation=0,wall=null,geometry=box) {
      if(!batches.has(key))batches.set(key,{geometry,material,matrices:[]});
      dummy.position.set(x,y,z);dummy.rotation.set(0,rotation,0);dummy.scale.set(w,h,d);dummy.updateMatrix();
      const row={matrix:dummy.matrix.clone(),wall,visible:true};
      batches.get(key).matrices.push(row);diagnostics.instances++;return row;
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
    // Fixed installations give the rooms recognisable human-scale functions.
    // Their solids stay in existing padded wall footprints: the observation
    // floors, four egg origins and all approaches remain clear.
    const roundedShape=new T.Shape(),r=.2;
    roundedShape.moveTo(-.5+r,-.5);roundedShape.lineTo(.5-r,-.5);
    roundedShape.quadraticCurveTo(.5,-.5,.5,-.5+r);roundedShape.lineTo(.5,.5-r);
    roundedShape.quadraticCurveTo(.5,.5,.5-r,.5);roundedShape.lineTo(-.5+r,.5);
    roundedShape.quadraticCurveTo(-.5,.5,-.5,.5-r);roundedShape.lineTo(-.5,-.5+r);
    roundedShape.quadraticCurveTo(-.5,-.5,-.5+r,-.5);
    const capsule=geo(new T.ExtrudeGeometry(roundedShape,{depth:1,bevelEnabled:false,curveSegments:3}).translate(0,0,-.5));
    const nodule=geo(new T.SphereGeometry(.5,8,6));
    const ribGeometry=geo(new T.TubeGeometry(new T.CatmullRomCurve3([
      new T.Vector3(-.1,-.5,-.03),new T.Vector3(.12,-.18,.025),new T.Vector3(-.04,.22,.04),new T.Vector3(-.13,.5,-.02)
    ]),8,.035,5,false));
    ribGeometry.computeBoundingBox();const ribSize=new T.Vector3();ribGeometry.boundingBox.getSize(ribSize);ribGeometry.center();ribGeometry.scale(1/ribSize.x,1/ribSize.y,1/ribSize.z);
    const porcelain=mat(new T.MeshStandardMaterial({color:0xc0d2cf,roughness:.48,metalness:.28}));
    const signalPaint=mat(new T.MeshStandardMaterial({color:0xffffff,roughness:.72,metalness:.18}));
    const programs=[
      {id:'cryo-pod-west',kind:'cryo',wallId:'cryo-bay-west',u:0,face:1,w:3.4,h:4.8},
      {id:'cryo-pod-east-a',kind:'cryo',wallId:'cryo-bay-east',u:-3.4,face:-1,w:3.4,h:4.8},
      {id:'cryo-pod-east-b',kind:'cryo',wallId:'cryo-bay-east',u:3.4,face:-1,w:3.4,h:4.8},
      {id:'security-screen',kind:'security',wallId:'security-bay-west',u:0,face:1,w:6.8,h:4.8},
      {id:'security-console',kind:'security',wallId:'security-bay-head',u:0,face:1,w:5.2,h:4.8},
      {id:'freight-dispatch',kind:'freight',wallId:'freight-decon',u:0,face:1,w:9.8,h:4.8},
      {id:'habitat-berths',kind:'colony',wallId:'colony-transfer',u:0,face:-1,w:9.2,h:4.8},
      {id:'refinery-exchanger',kind:'refinery',wallId:'refinery-bay-west',u:0,face:1,w:8.8,h:4.9},
      {id:'refinery-intake',kind:'refinery',wallId:'refinery-bay-head',u:0,face:1,w:9.4,h:4.9},
      {id:'brood-ribs-west',kind:'nursery',wallId:'hive-bay-west',u:0,face:1,w:8,h:5.1},
      {id:'brood-ribs-east',kind:'nursery',wallId:'hive-bay-east',u:0,face:-1,w:9.4,h:5.1},
      {id:'spine-services-west',kind:'transit',wallId:'spine-north-west',u:0,face:1,w:7.8,h:4.6},
      {id:'spine-services-east',kind:'transit',wallId:'spine-north-east',u:0,face:-1,w:7.8,h:4.6}
    ];
    const installations=[];
    for(const program of programs) {
      const p=PARTITIONS.find(w=>w.id===program.wallId),wall=map.walls.find(w=>w.userData.architectureRoom===program.wallId);
      if(!p||!wall)continue;
      const alongX=p.width>=p.depth,thickness=alongX?p.depth:p.width,angle=alongX?0:Math.PI/2;
      const accent=colors.get(program.kind),centreY=3.05;
      const installation={...program,sector:p.sector,instances:0};installations.push(installation);
      const fixed=(key,material,u,y,normal,w,h,d,geometry=box,tint=null)=>{
        const at=program.u+u,v=program.face*(thickness/2+normal);
        const secondary=key==='functional-resin-bands'||(geometry===box&&h<=.08);
        const color=key.startsWith('functional-accent-')?sectorById(program.kind).accent:null;
        if(color!==null){key='functional-signals';material=signalPaint;}
        if(key==='functional-steel')key='portal-posts';
        if(key==='functional-dark')key='screen-shoulders';
        const row=part(key,material,p.x+(alongX?at:v),y,p.z+(alongX?v:at),w,h,d,angle,wall,geometry);
        row.program=program.id;row.color=tint??color;row.minTier=secondary?1:0;
        installation.instances++;diagnostics.functionalInstances++;
      };
      const plate=(key,material,u,y,w,h,normal=.28,d=.3,tint=null)=>fixed(key,material,u,y,normal,w,h,d,capsule,tint);
      if(program.kind==='cryo') {
        // Closed frost shutters and a shoulder collar read as full-height cryo
        // capsules, while the separate sample banks stay visible beside them.
        plate('functional-ceramic',porcelain,0,centreY,program.w,program.h);
        plate('functional-dark-rounded',dark,0,centreY,program.w-.35,program.h-.4,.45,.12);
        plate('functional-ceramic',porcelain,0,3.25,program.w-.95,3.65,.56,.04,0x8fc9d5);
        plate('functional-dark-rounded',dark,0,4.5,program.w-1.55,.38,.578,.025);
        fixed('functional-accent-cryo',accent,0,1.24,.55,program.w-1.15,.1,.055);
        for(const side of[-1,1]) {
          fixed('functional-steel',steel,side*(program.w/2-.22),centreY,.53,.11,program.h-.68,.08);
          fixed('functional-accent-cryo',accent,side*(program.w/2-.48),3.6,.57,.055,1.7,.035);
        }
        for(let key=0;key<3;key++)fixed('functional-dark',dark,(key-1)*.35,1.48,.58,.13,.06,.025);
      } else if(program.kind==='security') {
        plate('functional-steel-rounded',steel,0,centreY,program.w,program.h);
        plate('functional-dark-rounded',dark,0,centreY,program.w-.4,program.h-.38,.45,.12);
        const count=program.id==='security-console'?2:3,span=(program.w-.8)/count;
        for(let i=0;i<count;i++) {
          const u=(i-(count-1)/2)*span;
          fixed('functional-steel',steel,u,centreY,.5,span-.13,program.h-.9,.08);
          fixed('screen-indicators-cryo',colors.get('cryo'),u,3.65,.56,span-.4,1.6,.035,box,0x9edab1);
          for(let line=0;line<3;line++)fixed('functional-dark',dark,u-(line%2)*.12,3.12+line*.4,.586,span-.65-line*.13,.07,.02);
          fixed('functional-accent-security',accent,u,4.8,.56,span-.35,.15,.045);
          for(let slit=0;slit<4;slit++)fixed('functional-dark',dark,u,1.45+slit*.2,.56,span-.38,.07,.035);
          fixed('functional-steel',steel,u,2.65,.57,span-.4,.13,.035);
        }
        fixed('functional-accent-security',accent,0,.85,.53,program.w-.65,.16,.07);
      } else if(program.kind==='freight') {
        plate('functional-steel-rounded',steel,0,centreY,program.w,program.h);
        fixed('functional-dark',dark,0,3.05,.46,program.w-.45,program.h-.5,.1);
        // A sealed loading shutter, not a fake traversable/interactable door.
        for(const side of[-1,1]) {
          fixed('functional-steel',steel,side*program.w*.235,3.08,.51,program.w*.435,program.h-.95,.08);
          for(let rib=0;rib<6;rib++)fixed('functional-dark',dark,side*program.w*.235,1.45+rib*.57,.56,program.w*.39,.055,.025);
        }
        fixed('functional-dark',dark,0,3.05,.565,.48,program.h-.9,.045);
        for(const side of[-1,1])fixed('functional-accent-freight',accent,side*(program.w/2-.35),3.05,.56,.12,program.h-.7,.035);
        fixed('functional-accent-freight',accent,0,5.2,.54,2.6,.2,.07);
      } else if(program.kind==='colony') {
        plate('functional-steel-rounded',steel,0,centreY,program.w,program.h);
        for(let berth=0;berth<3;berth++) {
          const u=(berth-1)*2.95;
          plate('functional-dark-rounded',dark,u,3.02,2.68,4.22,.45,.12);
          plate('functional-ceramic',porcelain,u,2.75,2.33,3.25,.51,.08);
          plate('functional-dark-rounded',dark,u,3.72,1.74,.74,.565,.03);
          fixed('functional-accent-colony',accent,u,4.92,.55,1.65,.12,.055);
          for(const side of[-1,1])fixed('functional-steel',steel,u+side*.79,1.65,.56,.12,.58,.04);
          fixed('functional-dark',dark,u,2.32,.56,1.8,.045,.035);
        }
      } else if(program.kind==='refinery') {
        plate('functional-steel-rounded',steel,0,centreY,program.w,program.h);
        fixed('functional-dark',dark,0,centreY,.45,program.w-.4,program.h-.4,.12);
        if(program.id==='refinery-exchanger') {
          for(let tube=0;tube<7;tube++) {
            const u=(tube-3)*1.1;
            fixed('functional-exchanger-tubes',steel,u,3.05,.46,.125,3.65,.125,sampleTube);
            for(const y of[1.45,4.65])fixed('functional-accent-refinery',accent,u,y,.49,.4,.22,.17);
          }
          for(const y of[1.08,5.01])fixed('functional-steel',steel,0,y,.48,program.w-.7,.25,.2);
        } else {
          for(let vane=0;vane<8;vane++)fixed('functional-steel',steel,0,1.35+vane*.48,.52,program.w-.8,.21,.12);
          for(const side of[-1,1])fixed('functional-accent-refinery',accent,side*(program.w/2-.35),3.05,.55,.12,program.h-.65,.06);
        }
      } else if(program.kind==='nursery') {
        // Compressed chitin lobes change the wall silhouette without putting
        // spikes or a decorative shell collider across the egg/queen route.
        for(let rib=0;rib<7;rib++) {
          const u=(rib-3)*(program.w-1.2)/6,height=Math.min(program.h-(rib%3)*.75,4.8),base=1.05;
          fixed('functional-resin-lobes',resin,u,base+height/2,.38,.88+(rib%2)*.12,height,.4,nodule);
          fixed('functional-resin-bands',resinBands,u+(rib%2?-.16:.13),base+height/2,.54,.38,height-.25,.1,ribGeometry);
          fixed('functional-resin-lobes',resin,u+(rib%2?-.18:.12),1.05,.38,1.08,.75,.4,nodule);
        }
        for(const y of[1.15,5.1])fixed('functional-resin-lobes',resin,0,y,.32,program.w,.48,.34,nodule);
      } else {
        plate('functional-steel-rounded',steel,0,centreY,program.w,program.h);
        fixed('functional-dark',dark,0,centreY,.45,program.w-.4,program.h-.4,.12);
        for(let panel=0;panel<3;panel++) {
          const u=(panel-1)*2.35;
          fixed('functional-steel',steel,u,2.95,.51,2.02,3.65,.08);
          fixed('functional-dark',dark,u,3.55,.56,1.55,1.55,.035);
          fixed('functional-accent-transit',accent,u,4.76,.56,1.58,.13,.035);
          fixed('functional-steel',steel,u,2.47,.575,1.15,.13,.025);
          fixed('functional-dark',dark,u,1.57,.56,1.55,.32,.035);
        }
      }
      diagnostics.functionalModules++;
    }
    diagnostics.functionalSectors=new Set(installations.map(p=>p.sector)).size;
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
    // Adherent, asymmetrical ribs stand on the screens outside the walking
    // footprint. Vary existing cross-sections instead of adding surface meshes.
    function organicArch(points,radius,phase) {
      const path=new T.CatmullRomCurve3(points),geometry=geo(new T.TubeGeometry(path,20,radius,7,false));
      const positions=geometry.getAttribute('position'),point=new T.Vector3();
      for(let section=0;section<=20;section++) {
        path.getPointAt(section/20,point);
        const swell=1+Math.sin(section*1.85+phase)*.2+Math.sin(section*.55+phase)*.07;
        for(let edge=0;edge<=7;edge++) {
          const index=section*8+edge;
          positions.setXYZ(index,point.x+(positions.getX(index)-point.x)*swell,
            point.y+(positions.getY(index)-point.y)*swell,point.z+(positions.getZ(index)-point.z)*swell);
        }
      }
      positions.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;
    }
    const ribs=organicArch([
      new T.Vector3(-9,0,0),new T.Vector3(-8,4.1,0),new T.Vector3(-1.1,7.7,0),
      new T.Vector3(7.4,5.3,0),new T.Vector3(9,0,0)
    ],.24,.3);
    for(const z of[34.5,35.5]) {
      const ribMaterial=mat(resin.clone());ribMaterial.transparent=true;
      const arch=new T.Mesh(ribs,ribMaterial);arch.position.set(39,0,z);arch.name='Nursery structural rib';
      arch.userData.architecturePortal=true;group.add(arch);map.walls.push(arch);portals.push(arch);
    }
    const broodRib=organicArch([
      new T.Vector3(-8,0,0),new T.Vector3(-7.1,4.6,0),new T.Vector3(-1.2,8.4,0),
      new T.Vector3(7.6,5.8,0),new T.Vector3(8,0,0)
    ],.28,1.4);
    for(const z of[46,51,54]) {
      const material=mat(resin.clone());material.color.setHex(0x34432b);material.transparent=true;
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
      if(batch.matrices.some(row=>row.program))mesh.userData.architecturePrograms=batch.matrices.map(row=>row.program||null);
      // r128 caches the instancing shader flag per shared material, but does
      // not invalidate it when instanceColor presence changes between meshes.
      // Every batch therefore owns a colour buffer; untinted instances stay
      // white. This preserves material sharing and the original appearance.
      batch.matrices.forEach((row,i)=>{
        mesh.setMatrixAt(i,row.matrix);
        mesh.setColorAt(i,new T.Color(row.color??0xffffff));
      });mesh.instanceMatrix.needsUpdate=true;
      mesh.onBeforeRender=()=>{
        let changed=false;
        batch.matrices.forEach((row,i)=>{
          if(!row.wall)return;
          const visible=tier>=(row.minTier||0)&&row.wall.visible!==false&&(row.wall.material.opacity??1)>=.88;
          if(visible===row.visible)return;
          row.visible=visible;mesh.setMatrixAt(i,visible?row.matrix:hiddenMatrix);changed=true;
        });
        if(changed)mesh.instanceMatrix.needsUpdate=true;
      };
      group.add(mesh);
      batch.mesh=mesh;
    }
    function setQuality(profile) {
      tier=qualityTier(profile);diagnostics.qualityTier=tier;
      for(const batch of batches.values()) {
        batch.mesh.visible=batch.matrices.some(row=>tier>=(row.minTier||0));
        batch.mesh.onBeforeRender();
      }
      diagnostics.activeFunctionalInstances=installations.reduce((total,program)=>total+program.instances,0);
      for(const batch of batches.values())for(const row of batch.matrices)
        if(row.program&&tier<(row.minTier||0))diagnostics.activeFunctionalInstances--;
    }
    setQuality(options.quality);
    diagnostics.batches=batches.size;
    diagnostics.overheadCutaways=portals.length;
    group.traverse(object=>{
      if(!object.isMesh)return;
      const geometry=object.geometry,count=(geometry.index?.count||geometry.getAttribute('position').count)/3;
      diagnostics.triangles+=count*(object.isInstancedMesh?object.count:1);
    });
    map.architectureDiagnostics=diagnostics;
    map.architecture={group,diagnostics,portals,installations,setQuality};return map.architecture;
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
