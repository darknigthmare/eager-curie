/* Continuous biological character skins, not a layer of glued-on primitives.
 * A cached, indexed implicit surface replaces the old torso/pelvis/limb pieces.
 * Each actor owns its geometry, material and two-bone articulated limb skeleton.
 */
(function exposeModernAlien(global) {
  'use strict';
  const templates = new Map();
  const clamp = (value, lo=0, hi=1) => Math.min(hi, Math.max(lo, value));
  const smooth = (lo, hi, value) => { const t=clamp((value-lo)/(hi-lo)); return t*t*(3-2*t); };
  const mix = (a,b,t) => a+(b-a)*t;
  function union(a,b,k=.15) { const h=clamp(.5+.5*(b-a)/k); return mix(b,a,h)-k*h*(1-h); }
  function ellipsoid(x,y,z,c,r) {
    x-=c[0];y-=c[1];z-=c[2];
    const k0=Math.hypot(x/r[0],y/r[1],z/r[2]);
    const k1=Math.hypot(x/(r[0]*r[0]),y/(r[1]*r[1]),z/(r[2]*r[2]));
    return k1>1e-8?k0*(k0-1)/k1:-Math.min(...r);
  }
  function distanceToPath(x,y,z,points) {
    let best=Infinity,along=0,total=0,selected=0;
    const lengths=[];
    for(let i=0;i<points.length-1;i++) {
      const a=points[i],b=points[i+1],dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2];
      const length=Math.hypot(dx,dy,dz);lengths.push(length);
      const t=clamp(((x-a[0])*dx+(y-a[1])*dy+(z-a[2])*dz)/(length*length));
      const d=Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t,z-a[2]-dz*t);
      if(d<best){best=d;selected=total+length*t;}
      total+=length;
    }
    along=selected/total;
    return {along,bend:lengths[0]/total};
  }
  function definition(family) {
    const quad=family==='runner'||family==='crusher',heavy=family==='crusher',royal=family==='royal';
    const limbs=[];
    if(quad) {
      for(let index=0;index<4;index++) {
        const side=index%2===0?-1:1,front=index<2;
        const z=heavy?(front?.95:-1.05):(front?.82:-.92);
        limbs.push({name:`${family}_leg_${index}`,side,kind:'knee',
          points:heavy?[[side*.75,1.85,z],[side*1.2,1,z+(front?.3:-.25)],[side*.98,.15,z+(front?.6:-.48)]]
            :[[side*.52,1.58,z],[side*.92,.86,z+(front?.32:-.24)],[side*.74,.12,z+(front?.62:-.48)]],
          radii:heavy?[.29,.21,.145]:[.18,.13,.09]});
      }
    } else {
      for(const side of [-1,1]) {
        const suffix=side<0?'left':'right';
        limbs.push({name:`arm_${suffix}`,side,kind:'elbow',
          points:[[side*.7,3.72,0],[side*(royal?1.3:1.08),2.85,.18],[side*.92,2.02,.62]],
          radii:[royal?.23:.195,.155,.105]});
        limbs.push({name:`leg_${suffix}`,side,kind:'knee',
          points:[[side*.46,1.98,0],[side*.67,1.03,-.1],[side*.58,.18,.2]],radii:[.265,.19,.125]});
      }
      if(royal)for(const side of [-1,1])limbs.push({name:`royal_secondary_arm_${side}`,side,kind:'elbow',
        points:[[side*.55,3.32,-.26],[side*1.34,3.02,-.54],[side*1.66,2.42,-.22]],radii:[.145,.105,.075]});
    }
    // Frames and phase constants are invariant over the millions of field
    // evaluations needed to extract a template. Compute them only once.
    for(const limb of limbs)limb.sections=limb.points.slice(0,-1).map((a,index)=>{
      const b=limb.points[index+1],dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2];
      const squared=dx*dx+dy*dy+dz*dz,length=Math.sqrt(squared),across=Math.hypot(dx,dy)||1;
      return {a,dx,dy,dz,inverseSquared:1/squared,ux:-dy/across,uy:dx/across,
        vx:-dz*dx/(length*across),vy:-dz*dy/(length*across),vz:(dx*dx+dy*dy)/(length*across),
        r0:limb.radii[index],r1:limb.radii[index+1],distal:index===1,
        // The muscle belly sits proximally and thins into the joint. A uniform
        // sinusoidal swell reads as a hose with a ball at each end.
        bulge:limb.kind==='elbow'?(index===1?.010:.030):(index===1?.010:.036),
        phaseCos:Math.cos(limb.side*.38),phaseSin:Math.sin(limb.side*.38)};
    });
    const bounds=quad?{min:[heavy?-1.6:-1.25,-.12,heavy?-2.2:-1.75],max:[heavy?1.6:1.25,heavy?2.6:2.15,heavy?2.0:1.75]}:
      {min:[royal?-1.95:-1.48,-.12,royal?-1.7:-.75],max:[royal?1.95:1.48,4.5,1.03]};
    return {family,quad,heavy,royal,limbs,bounds};
  }
  function bodyDistance(x,y,z,spec) {
    if(spec.quad) {
      // A tapered lumbar insertion separates the shoulder mass from the hips.
      // These are fused volumes of the skin, not separate armour primitives.
      const lumbar=1-(spec.heavy?.12:.22)*smooth(-1.25,-.95,z)*(1-smooth(-.43,-.10,z));
      let d=ellipsoid(x/lumbar,y,z,[0,spec.heavy?1.72:1.49,-.12],spec.heavy?[.74,.65,1.48]:[.445,.43,1.08]);
      for(const side of [-1,1]) d=union(d,ellipsoid(x,y,z,
        [side*(spec.heavy?.32:.22),spec.heavy?1.91:1.65,spec.heavy?.64:.49],
        spec.heavy?[.51,.43,.66]:[.35,.30,.48]),spec.heavy?.19:.14);
      d=union(d,ellipsoid(x,y,z,[0,spec.heavy?1.72:1.56,spec.heavy?1.05:1.01],spec.heavy?[.55,.48,.82]:[.3,.31,.65]),.19);
      d=union(d,ellipsoid(x,y,z,[0,spec.heavy?1.58:1.41,spec.heavy?-1.12:-.85],spec.heavy?[.7,.6,.84]:[.49,.48,.62]),.18);
      const side=smooth(spec.heavy?.24:.16,spec.heavy?.53:.34,Math.abs(x));
      const cage=smooth(-1.08,-.79,z)*(1-smooth(.57,.91,z));
      const phase=z*(spec.heavy?13.6:16.2)+(y-(spec.heavy?1.68:1.48))**2*5.2;
      // Wide costal arcs remain resolvable on the extraction grid. The lower
      // flank sits in a shallow groove between them rather than a plain barrel.
      const rib=.5+.5*Math.cos(phase);
      d-=side*cage*(spec.heavy?.040:.046)*(rib*1.25-.28);
      const upper=smooth(spec.heavy?1.82:1.59,spec.heavy?2.12:1.84,y);
      const paired=Math.exp(-Math.pow((Math.abs(x)-(spec.heavy?.26:.16))/(spec.heavy?.15:.10),2));
      d-=upper*cage*paired*(spec.heavy?.037:.042);
      // A shallow sagittal trough separates the paired spinal tendons. The
      // scapular ridge broadens into the forelimb insertion rather than a
      // detached shoulder plate or a row of dorsal cones.
      const center=Math.exp(-x*x/(spec.heavy?.032:.015));
      d+=upper*cage*center*(spec.heavy?.020:.018);
      return d;
    }
    // Costal shell, narrow abdominal insertion, pelvis and cervical tissues are
    // one continuous surface. No separate belt-shaped pelvis or shoulder balls.
    const flare=mix(.72,1,smooth(2.66,3.58,y));
    let d=ellipsoid(x/flare,y,z,[0,3.26,-.025],[spec.royal?.76:.69,.86,.42]);
    d=union(d,ellipsoid(x,y,z,[0,2.43,.025],[spec.royal?.305:.275,.55,.255]),.15);
    d=union(d,ellipsoid(x,y,z,[0,1.89,-.025],[.405,.415,.29]),.15);
    d=union(d,ellipsoid(x,y,z,[0,4.05,.10],[.215,.43,.205]),.15);
    if(spec.royal)d=union(d,ellipsoid(x,y,z,[0,2.02,-.65],[.62,.5,.86]),.20);
    const front=smooth(.02,.28,z),coverage=smooth(2.64,2.85,y)*(1-smooth(3.70,3.96,y));
    const lateral=smooth(.045,.20,Math.abs(x));
    // Broad, curved costal crests: no narrow high-frequency teeth that
    // alias into wedges on the .055-unit extraction grid. The valleys carve
    // into the original thorax and each crest rejoins its continuous surface.
    const phase=(y-2.72)*22.0+x*x*6.3;
    const rib=.5+.5*Math.cos(phase);
    // Deeper valleys and a narrow recessed sternum keep the costal cage
    // readable in silhouette-neutral lighting instead of relying on shine.
    d-=front*coverage*lateral*(.058*rib-.018);
    const flank=smooth(.30,.54,Math.abs(x))*(1-smooth(.02,.23,z));
    d-=coverage*flank*(.052*rib-.016);
    d+=front*coverage*.029*Math.exp(-x*x/.009);
    const abdomen=smooth(2.02,2.17,y)*(1-smooth(2.67,2.85,y));
    const ventral=smooth(-.04,.21,z),segment=.5+.5*Math.cos((y-2.17)*20.0-x*x*7.0);
    d-=ventral*abdomen*(.035*segment-.012);
    d+=ventral*abdomen*.018*Math.exp(-x*x/.006);
    const back=smooth(.04,.29,-z),dorsal=smooth(2.52,2.77,y)*(1-smooth(3.80,4.10,y));
    const tendons=Math.exp(-Math.pow((Math.abs(x)-.22)/.105,2));
    d-=back*dorsal*tendons*.054;
    d+=back*dorsal*.023*Math.exp(-x*x/.012);
    // Embedded, swept scapular planes. These are relief of the one body
    // field, not glued-on epaulettes, and taper into both the neck and ribs.
    const scapula=smooth(3.14,3.34,y)*(1-smooth(3.83,4.01,y));
    const swept=.21+(3.90-y)*.36;
    const blade=Math.exp(-Math.pow((Math.abs(x)-swept)/.105,2));
    d-=back*scapula*blade*.056;
    return d;
  }
  function tendonSegment(x,y,z,section) {
    const {a,dx,dy,dz}=section;
    const t=clamp(((x-a[0])*dx+(y-a[1])*dy+(z-a[2])*dz)*section.inverseSquared);
    const px=x-a[0]-dx*t,py=y-a[1]-dy*t,pz=z-a[2]-dz*t;
    // Two broad, longitudinal tendon planes in the segment's own frame. The
    // envelope has zero derivative at the joints, so neither end grows a cuff.
    const u=section.ux*px+section.uy*py;
    const v=section.vx*px+section.vy*py+section.vz*pz;
    const radialSquared=u*u+v*v;
    // cos(2*atan2(v,u)+phase), evaluated without per-sample atan2/cos.
    const angular=radialSquared>1e-18?
      (section.phaseCos*(u*u-v*v)-section.phaseSin*2*u*v)/radialSquared:section.phaseCos;
    const envelope=Math.sin(t*Math.PI)**2,tendon=.5+.5*angular;
    const flute=(section.distal?.034:.026)*(tendon-.30);
    const belly=1.32-.70*t;
    // The distal shaft has a long lean insertion; proximal tissue carries
    // the volume. Both ends still meet their original animation pivots.
    const radius=mix(section.r0,section.r1,t)+envelope*(section.bulge*belly+flute);
    return Math.hypot(px,py,pz)-radius;
  }
  function limbDistance(x,y,z,limb) {
    return union(tendonSegment(x,y,z,limb.sections[0]),tendonSegment(x,y,z,limb.sections[1]),.09);
  }
  function field(x,y,z,spec,parts) {
    let value=bodyDistance(x,y,z,spec);
    if(parts)parts[0]=value;
    for(let i=0;i<spec.limbs.length;i++) {
      const d=limbDistance(x,y,z,spec.limbs[i]);if(parts)parts[i+1]=d;
      value=union(value,d,.145);
    }
    return value;
  }
  function skinWeights(x,y,z,spec) {
    const parts=[];field(x,y,z,spec,parts);
    const minimum=Math.min(...parts),weights=[[0,Math.exp(-32*(parts[0]-minimum))]];
    for(let i=0;i<spec.limbs.length;i++) {
      const influence=Math.exp(-32*(parts[i+1]-minimum));
      const path=distanceToPath(x,y,z,spec.limbs[i].points);
      const lower=smooth(path.bend-.12,path.bend+.16,path.along);
      weights.push([1+i*2,influence*(1-lower)],[2+i*2,influence*lower]);
    }
    weights.sort((a,b)=>b[1]-a[1]);weights.length=4;
    const total=weights.reduce((sum,item)=>sum+item[1],0)||1;
    return {indices:weights.map(item=>item[0]),weights:weights.map(item=>item[1]/total)};
  }
  function buildSurface(T,spec) {
    const step=spec.heavy?.067:(spec.royal?.063:(spec.quad?.052:.055));
    const min=spec.bounds.min,max=spec.bounds.max;
    const nx=Math.ceil((max[0]-min[0])/step),ny=Math.ceil((max[1]-min[1])/step),nz=Math.ceil((max[2]-min[2])/step);
    const sx=(max[0]-min[0])/nx,sy=(max[1]-min[1])/ny,sz=(max[2]-min[2])/nz;
    const stride=nx+1,plane=stride*(ny+1),count=plane*(nz+1),values=new Float32Array(count);
    const coordinates=id=>{const z=Math.floor(id/plane),rem=id-z*plane,y=Math.floor(rem/stride),x=rem-y*stride;
      return [min[0]+x*sx,min[1]+y*sy,min[2]+z*sz];};
    for(let z=0;z<=nz;z++)for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++)
      values[x+y*stride+z*plane]=field(min[0]+x*sx,min[1]+y*sy,min[2]+z*sz,spec);
    const points=[],normals=[],uv=[],indices=[],boneIndices=[],weights=[],edgeCache=new Map();
    const vertex=(a,b)=>{
      const lo=Math.min(a,b),hi=Math.max(a,b),key=lo*count+hi;
      if(edgeCache.has(key))return edgeCache.get(key);
      const pa=coordinates(a),pb=coordinates(b),t=clamp(values[a]/(values[a]-values[b]));
      const x=mix(pa[0],pb[0],t),y=mix(pa[1],pb[1],t),z=mix(pa[2],pb[2],t),epsilon=.002;
      let gx=field(x+epsilon,y,z,spec)-field(x-epsilon,y,z,spec);
      let gy=field(x,y+epsilon,z,spec)-field(x,y-epsilon,z,spec);
      let gz=field(x,y,z+epsilon,spec)-field(x,y,z-epsilon,spec);
      const length=Math.hypot(gx,gy,gz)||1;gx/=length;gy/=length;gz/=length;
      const id=points.length/3;points.push(x,y,z);normals.push(gx,gy,gz);
      uv.push((.5+Math.atan2(z,x)/(Math.PI*2))*2,y*.78);
      const skin=skinWeights(x,y,z,spec);boneIndices.push(...skin.indices);weights.push(...skin.weights);
      edgeCache.set(key,id);return id;
    };
    const emit=(a,b,c)=>{
      if(a===b||b===c||c===a)return;
      const ax=points[b*3]-points[a*3],ay=points[b*3+1]-points[a*3+1],az=points[b*3+2]-points[a*3+2];
      const bx=points[c*3]-points[a*3],by=points[c*3+1]-points[a*3+1],bz=points[c*3+2]-points[a*3+2];
      const dot=(ay*bz-az*by)*(normals[a*3]+normals[b*3]+normals[c*3])+
        (az*bx-ax*bz)*(normals[a*3+1]+normals[b*3+1]+normals[c*3+1])+
        (ax*by-ay*bx)*(normals[a*3+2]+normals[b*3+2]+normals[c*3+2]);
      indices.push(a,dot<0?c:b,dot<0?b:c);
    };
    const tetrahedra=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
    const cubeOffsets=[0,1,1+stride,stride,plane,plane+1,plane+1+stride,plane+stride];
    for(let z=0;z<nz;z++)for(let y=0;y<ny;y++)for(let x=0;x<nx;x++) {
      const offset=x+y*stride+z*plane,ids=cubeOffsets.map(v=>offset+v);
      let signs=0;for(let c=0;c<8;c++)if(values[ids[c]]<0)signs++;
      if(!signs||signs===8)continue;
      for(const tetra of tetrahedra) {
        const inside=[],outside=[];for(const c of tetra)(values[ids[c]]<0?inside:outside).push(ids[c]);
        if(!inside.length||inside.length===4)continue;
        if(inside.length===1||inside.length===3) {
          const one=inside.length===1?inside[0]:outside[0],other=inside.length===1?outside:inside;
          emit(vertex(one,other[0]),vertex(one,other[1]),vertex(one,other[2]));
        } else {
          const ac=vertex(inside[0],outside[0]),ad=vertex(inside[0],outside[1]);
          const bc=vertex(inside[1],outside[0]),bd=vertex(inside[1],outside[1]);
          emit(ac,bc,bd);emit(ac,bd,ad);
        }
      }
    }
    const geometry=new T.BufferGeometry();
    geometry.setAttribute('position',new T.Float32BufferAttribute(points,3));
    geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
    geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setAttribute('uv2',geometry.attributes.uv.clone());
    geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(boneIndices,4));
    geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));geometry.setIndex(indices);
    geometry.computeBoundingBox();geometry.computeBoundingSphere();
    geometry.userData.modernSurface={family:spec.family,step,triangles:indices.length/3,
      topology:'indexed-marching-tetrahedra',continuous:true,
      anatomicalRelief:'integrated-costal-abdominal-and-tendon-v3',
      silhouette:'flared-costal-cage-tapered-waist-swept-scapulae',
      separateReliefMeshes:0};
    return geometry;
  }
  function template(T,spec) {
    if(!templates.has(spec.family))templates.set(spec.family,buildSurface(T,spec));
    return templates.get(spec.family).clone();
  }
  const triangleCount=geometry=>(geometry.index?.count||geometry.attributes.position?.count||0)/3;
  function removeOwnedMesh(root,mesh,statistics) {
    if(!mesh?.isMesh||!mesh.parent)return;
    statistics.removedTriangles+=triangleCount(mesh.geometry);statistics.replacedMeshes++;
    mesh.parent.remove(mesh);mesh.geometry.dispose();
    const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
    for(const material of materials) {
      let used=false;root.traverse(object=>{if(object.material===material||Array.isArray(object.material)&&object.material.includes(material))used=true;});
      if(!used)material.dispose();
    }
  }
  function headRefit(root,metadata,T) {
    const sculpt=global.HiveOrganicSculpt,head=root.getObjectByName('cranial_dome')||root.getObjectByName('runner_head')||root.getObjectByName('crusher_head');
    if(!head||!sculpt)return;
    const upright=head.name==='cranial_dome',unit=upright?head.position.y/4.58:
      (head.name==='crusher_head'?head.position.y/1.95:1);
    const pale=/neomorph|newborn|offspring|abomination|deacon|bodyburster/.test(metadata.caste||'');
    if(pale)return;
    const previous=head.geometry;
    head.geometry=sculpt.surface(T,metadata.caste==='warrior'?'warriorSkull':(upright?'skull':'runnerSkull'));
    previous.dispose();
    if(upright) {
      const royal=metadata.caste==='queen'||metadata.caste==='praetorian';
      head.scale.set((royal?.65:.53)*unit,.38*unit,(royal?1.78:1.72)*unit);
      head.position.z=-.08*unit;
      const face=root.getObjectByName('facial_mask');
      if(face){face.scale.set(.44*unit,.16*unit,.48*unit);face.position.z=1.13*unit;}
      const skull=root.getObjectByName('drone_internal_skull');
      if(skull){skull.scale.set(.36*unit,.25*unit,.85*unit);skull.position.y=4.52*unit;skull.position.z=.43*unit;}
    } else if(head.name==='runner_head')head.scale.set(.35,.29,1.42);
    else head.scale.set(.64*unit,.48*unit,1.4*unit);
    sculpt.fitUV(head.geometry,{x:head.scale.x,y:head.scale.y,z:head.scale.z});
    head.userData.modernAnatomy=true;head.material.userData.modernRegion='dome';
  }
  function specializedRefit(root,metadata,T) {
    const sculpt=global.HiveOrganicSculpt;if(!sculpt)return;
    let replaced=0;
    root.traverse(mesh=>{
      if(!mesh.isMesh||!mesh.geometry)return;
      const name=mesh.name,geometry=mesh.geometry,p=geometry.parameters;
      let replacement=null;
      if(/(?:^|_)head$/.test(name)&&geometry.type==='SphereGeometry') {
        replacement=sculpt.surface(T,'skull');mesh.scale.x*=.9;mesh.scale.z*=1.14;
      } else if(/_(torso|chest)$/.test(name)&&geometry.type==='SphereGeometry')replacement=sculpt.surface(T,'chest');
      else if(geometry.type==='CylinderGeometry'&&/arm|leg|thigh|shin|foreleg|forearm/.test(name)&&p?.height) {
        replacement=sculpt.limb(T,/shin|forearm/.test(name)?'forearm':'upper',p.radiusTop/Math.max(.001,p.radiusBottom));
        replacement.scale(p.radiusBottom,p.height,p.radiusBottom);
      } else if(geometry.type==='BoxGeometry'&&/crest|knuckle|spade|dorsal_plate/.test(name)&&p) {
        replacement=sculpt.surface(T,'shoulder');replacement.scale(p.width*.5,p.height*.5,p.depth*.5);
      }
      if(replacement){geometry.dispose();mesh.geometry=replacement;sculpt.fitUV(replacement,{x:mesh.scale.x,y:mesh.scale.y,z:mesh.scale.z});replaced++;mesh.userData.modernAnatomy=true;}
    });
    root.userData.modernAlien={version:1,family:'specialized-refit',caste:metadata.caste,
      skinned:false,replacedMeshes:replaced,continuousLimbSkin:false};
  }
  function prepare(factory,root,metadata={}) {
    if(metadata.modelType!=='adult'||root.userData.modernAlien||!global.THREE)return root;
    const T=global.THREE;
    const upright=root.getObjectByName('cranial_dome')&&root.getObjectByName('arm_left')?.isGroup;
    const quad=metadata.caste==='runner'||metadata.caste==='crusher';
    if(!upright&&!quad){specializedRefit(root,metadata,T);return root;}
    const family=quad?metadata.caste:(metadata.caste==='queen'?'royal':(metadata.caste==='praetorian'?'guardian':'upright'));
    const spec=definition(family==='guardian'?'royal':family);
    // Praetorian has a Queen-width primary elbow stance but no second arm pair.
    if(family==='guardian') {spec.family='guardian';spec.limbs=spec.limbs.slice(0,4);spec.bounds={min:[-1.6,-.12,-.75],max:[1.6,4.5,1.03]};spec.royal=false;}
    const head=root.getObjectByName(upright?'cranial_dome':`${family}_head`);
    const unit=upright?head.position.y/4.58:(quad&&family==='crusher'?head.position.y/1.95:1);
    if(!(unit>0&&Number.isFinite(unit)))return root;
    const statistics={removedTriangles:0,replacedMeshes:0};
    const removeNames=upright?['thorax','pelvic_carapace','royal_abdomen','sensory_node']:[`${family}_thorax`];
    for(const name of removeNames)removeOwnedMesh(root,root.getObjectByName(name),statistics);
    // Generic cone rows were positioned against the previous primitive backs.
    // They float over the new Runner and form a toy crown on upright adults.
    // Named royal crests, Warrior arches and caste-specific horns are retained.
    const removeExtra=[];root.traverse(mesh=>{if(mesh.isMesh&&(/royal_abdomen_band_|crusher_heavy_shield|crusher_jugular_plate_|reinforced_shoulder|patellar_plate|^carapace_spine_/.test(mesh.name)))removeExtra.push(mesh);});
    for(const mesh of removeExtra)removeOwnedMesh(root,mesh,statistics);
    const groups=spec.limbs.map(limb=>root.getObjectByName(limb.name));
    if(groups.some(group=>!group?.isGroup))return root;
    const bones=[],bends=[];
    const rootBone=new T.Bone();rootBone.name='modern_root_bone';root.add(rootBone);bones.push(rootBone);
    for(let i=0;i<spec.limbs.length;i++) {
      const limb=spec.limbs[i],group=groups[i];
      for(const mesh of [...group.children])if(mesh.isMesh&&(/_segment_|_joint_|_terminal_joint/.test(mesh.name)))removeOwnedMesh(root,mesh,statistics);
      const upper=new T.Bone(),lower=new T.Bone();
      upper.name=`modern_${limb.name}_upper`;lower.name=`modern_${limb.kind}_${i}`;
      lower.position.set((limb.points[1][0]-limb.points[0][0])*unit,
        (limb.points[1][1]-limb.points[0][1])*unit,(limb.points[1][2]-limb.points[0][2])*unit);
      group.add(upper);upper.add(lower);bones.push(upper,lower);
      const hand=group.children.find(child=>child.isGroup&&/^(hand|foot)_/.test(child.name));
      if(hand){root.updateMatrixWorld(true);lower.attach(hand);hand.scale.multiply(new T.Vector3(limb.kind==='elbow'?.79:.84,.86,.88));}
      bends.push({joint:lower,kind:limb.kind,side:limb.side,baseQuaternion:lower.quaternion.clone()});
    }
    headRefit(root,metadata,T);
    const geometry=template(T,spec);
    const pale=/neomorph|newborn|offspring|abomination|bodyburster/.test(metadata.caste||'');
    const material=factory._material(pale?'skin':'chitin',{color:pale?0x9b8e7f:0x172222,
      roughness:.4,metalness:pale?0:.025,clearcoat:.28,skinning:true});
    material.userData.modernRegion='body';
    const skin=new T.SkinnedMesh(geometry,material);skin.name='modern_continuous_skin';
    skin.scale.setScalar(unit);skin.frustumCulled=false;skin.castShadow=true;skin.receiveShadow=true;
    skin.userData.modernAnatomy=true;root.add(skin);
    let hierarchy=root;while(hierarchy.parent)hierarchy=hierarchy.parent;hierarchy.updateMatrixWorld(true);
    const skeleton=new T.Skeleton(bones);skin.bind(skeleton);skeleton.update();
    let released=false;geometry.addEventListener('dispose',()=>{if(released)return;released=true;skeleton.dispose();});
    const previousJoints=metadata.animationJoints;
    const joints=Array.isArray(previousJoints)?{legacy:previousJoints}:
      (previousJoints&&typeof previousJoints==='object'?{...previousJoints}:{});
    if(!joints.head&&head)joints.head=head.name;
    // Every animated proximal pivot must participate in the bind-pose reset.
    // The Queen's secondary arms are new groups, absent from the legacy list.
    joints.modernLimbs=groups.map(group=>group.name);
    joints.bends=bends.map(entry=>entry.joint.name);metadata.animationJoints=joints;
    const roles=metadata.animationRoles||{};
    if(!roles.locomotion)roles.locomotion=[...groups.map(group=>group.name),...(root.getObjectByName('segmented_tail')?['segmented_tail']:[])];
    if(!roles.attack)roles.attack=[head.name,...groups.filter(group=>/arm/.test(group.name)).map(group=>group.name),
      ...(root.getObjectByName('articulated_jaw')?['articulated_jaw']:[]),...(root.getObjectByName('segmented_tail')?['segmented_tail']:[])];
    // Roles may also introduce a tail absent from an older caste's joint list.
    // Reset everything the production animation is allowed to move.
    joints.modernRoles=roles;
    metadata.animationRoles=roles;
    root.userData.modernMotionRig={bends};
    root.userData.modernAlien={version:1,family,caste:metadata.caste,skinned:true,
      continuousLimbSkin:true,skinTriangles:triangleCount(geometry),skinVertices:geometry.attributes.position.count,
      bones:bones.length,bendJoints:bends.map(entry=>entry.joint.name),...statistics};
    return root;
  }
  global.HiveModernAlien={prepare,getDiagnostics:()=>({version:1,templates:templates.size,
    templateTriangles:Array.from(templates.values()).reduce((sum,geometry)=>sum+triangleCount(geometry),0)})};
})(typeof window==='undefined'?globalThis:window);
