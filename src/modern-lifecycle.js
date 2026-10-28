/* Continuous lifecycle anatomy. Templates are CPU-side and every model owns
 * its clones. Existing joints and evolution closures remain the animation API.
 */
(function exposeModernLifecycle(global) {
  'use strict';
  const templates = new Map(), TAU = Math.PI * 2;
  const profileCurves = new WeakMap();
  const profiles = {
    egg:[[0,.54],[.12,1.00],[.34,1.27],[.58,1.31],[.82,1.20],[1,1.08]],
    parasite:[[0,.12],[.12,.61],[.34,.97],[.6,.96],[.82,.69],[1,.10]],
    larva:[[0,.08],[.12,.57],[.34,.96],[.62,.92],[.85,.73],[1,.25]]
  };
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
  function cached(key, build) {
    if (!templates.has(key)) templates.set(key, build());
    return templates.get(key).clone();
  }
  function geometry(T, sample, rows, columns, {wrap = true, capBottom = false, capTop = false, flip = false} = {}) {
    const positions = [], uv = [], index = [], stride = columns + 1;
    for (let row = 0; row <= rows; row++) for (let col = 0; col <= columns; col++) {
      positions.push(...sample(row / rows, col / columns)); uv.push(col / columns, row / rows);
      if (row < rows && col < columns) {
        const a = row * stride + col, b = a + stride;
        index.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
    for (const end of [0, rows]) {
      if ((end === 0 && !capBottom) || (end === rows && !capTop)) continue;
      const center = [0,0,0], start = end * stride;
      for (let col = 0; col < columns; col++) for (let axis=0;axis<3;axis++) center[axis] += positions[(start+col)*3+axis]/columns;
      const id = positions.length/3; positions.push(...center); uv.push(.5,end/rows);
      for (let col=0;col<columns;col++) {
        if (end === 0) index.push(id,start+col+1,start+col);
        else index.push(id,start+col,start+col+1);
      }
    }
    if(flip)for(let i=0;i<index.length;i+=3){const a=index[i+1];index[i+1]=index[i+2];index[i+2]=a;}
    const result = new T.BufferGeometry();
    result.setAttribute('position',new T.Float32BufferAttribute(positions,3));
    result.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    result.setAttribute('uv2',result.attributes.uv.clone());result.setIndex(index);result.computeVertexNormals();
    if (wrap) {
      const normal=result.attributes.normal;
      for(let row=0;row<=rows;row++) {
        const a=row*stride,b=a+columns;
        const x=normal.getX(a)+normal.getX(b),y=normal.getY(a)+normal.getY(b),z=normal.getZ(a)+normal.getZ(b),length=Math.hypot(x,y,z)||1;
        normal.setXYZ(a,x/length,y/length,z/length);normal.setXYZ(b,x/length,y/length,z/length);
      }
    }
    result.computeBoundingBox();result.computeBoundingSphere();return result;
  }
  function profileCurve(rows) {
    if(profileCurves.has(rows))return profileCurves.get(rows);
    const count=rows.length,h=[],delta=[],slopes=[];
    for(let i=0;i<count-1;i++) {h[i]=rows[i+1][0]-rows[i][0];delta[i]=(rows[i+1][1]-rows[i][1])/h[i];}
    // Shape-preserving cubic Hermite (PCHIP): neighbouring pieces share one
    // derivative instead of flattening independently at every authored station.
    const endpoint=(firstH,nextH,firstD,nextD)=>{
      let slope=((2*firstH+nextH)*firstD-firstH*nextD)/(firstH+nextH);
      if(slope*firstD<=0)slope=0;
      else if(firstD*nextD<0&&Math.abs(slope)>3*Math.abs(firstD))slope=3*firstD;
      return slope;
    };
    slopes[0]=count===2?delta[0]:endpoint(h[0],h[1],delta[0],delta[1]);
    slopes[count-1]=count===2?delta[0]:endpoint(h[count-2],h[count-3],delta[count-2],delta[count-3]);
    for(let i=1;i<count-1;i++) {
      const before=delta[i-1],after=delta[i];
      if(before*after<=0)slopes[i]=0;
      else {const a=2*h[i]+h[i-1],b=h[i]+2*h[i-1];slopes[i]=(a+b)/(a/before+b/after);}
    }
    const curve={slopes,value(t){
      const clamped=Math.max(rows[0][0],Math.min(rows[count-1][0],t));
      let i=0;while(i<count-2&&clamped>rows[i+1][0])i++;
      const s=(clamped-rows[i][0])/h[i],s2=s*s,s3=s2*s;
      return (2*s3-3*s2+1)*rows[i][1]+(s3-2*s2+s)*h[i]*slopes[i]
        +(-2*s3+3*s2)*rows[i+1][1]+(s3-s2)*h[i]*slopes[i+1];
    }};
    profileCurves.set(rows,curve);return curve;
  }
  function interpolate(rows,t) {return profileCurve(rows).value(t);}
  function rimNormals(T,geo,row,columns,slope,angleAt) {
    const normal=geo.attributes.normal,vector=new T.Vector3();
    for(let col=0;col<=columns;col++) {
      const angle=angleAt(col/columns);vector.set(Math.sin(angle),-slope,Math.cos(angle)).normalize();
      normal.setXYZ(row*(columns+1)+col,vector.x,vector.y,vector.z);
    }
    normal.needsUpdate=true;
  }
  function replace(mesh,next) {
    if(!mesh)return;
    if(next.attributes.uv&&!next.attributes.uv2)next.setAttribute('uv2',next.attributes.uv.clone());
    const old=mesh.geometry;mesh.geometry=next;old?.dispose();
  }
  function region(mesh,name) {
    if(!mesh)return mesh;
    mesh.userData.modernRegion=name;
    mesh.userData.creatureAnatomy=true;
    for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])if(material)material.userData.modernRegion=name;
    return mesh;
  }
  function stats(root) {
    let triangles=0,meshes=0;
    root.traverse(object=>{if(object.isMesh){meshes++;triangles+=(object.geometry.index?.count||object.geometry.attributes.position.count)/3;}});
    return {triangles,meshes};
  }
  function removeMatching(root,predicate) {
    const remove=[];root.traverse(object=>{if(object.isMesh&&predicate(object))remove.push(object);});
    const candidates=new Set();
    for(const object of remove) {
      object.parent?.remove(object);object.geometry?.dispose();
      for(const material of Array.isArray(object.material)?object.material:[object.material])if(material)candidates.add(material);
    }
    const kept=new Set();root.traverse(object=>{for(const material of Array.isArray(object.material)?object.material:[object.material])if(material)kept.add(material);});
    for(const material of candidates)if(!kept.has(material))material.dispose();
    return remove.length;
  }
  function complete(root,family,before,coverage,sections) {
    root.traverse(object=>{
      const geo=object.geometry;
      if(geo?.attributes.uv&&!geo.attributes.uv2)geo.setAttribute('uv2',geo.attributes.uv.clone());
    });
    const after=stats(root);
    root.userData.modernLifecycle={version:1,family,metrics:{...after,previousTriangles:before,sculptedSections:sections}};
    // This is a replacement surface, not an additive decoration. Do not put the
    // old fixed-radius rings/vein paths back over the newly sculpted anatomy.
    root.userData.creatureFidelity={version:2,family,coverage,elements:sections,meshes:after.meshes,
      triangles:0,refinedTriangles:after.triangles-before,integratedSurface:true};
  }
  function createEgg(factory,open=false) {
    const T=global.THREE,root=new T.Group();root.name=open?'modern_ovomorph_open':'modern_ovomorph_closed';
    const shell=factory._material('resin',{color:0x6d5742,roughness:.53,metalness:.015,
      transparent:false,opacity:1,side:T.DoubleSide,clearcoat:.26,clearcoatRoughness:.31});
    const flesh=factory._material('skin',{color:0x7a5547,roughness:.49,metalness:0,clearcoat:.24,side:T.DoubleSide});
    const inside=factory._material('skin',{color:0x634e3d,roughness:.39,metalness:0,clearcoat:.36});
    const rimY=2.45,radius=1.08,crownHeight=1.02;
    const rimSlope=profileCurve(profiles.egg).slopes.at(-1)/(rimY-.045);
    // This cap starts above the equator of its ellipse. Its radial derivative
    // therefore continues the belly tangent, rather than forming a bottle neck.
    const ratio=-rimSlope*crownHeight/radius,latitude=Math.asin(Math.min(.85,ratio/(1-ratio)));
    const sinLatitude=Math.sin(latitude),cosLatitude=Math.cos(latitude);
    const body=cached('ovomorph-body-v2',()=>{
      const result=geometry(T,(t,u)=>{
        const a=u*TAU,base=interpolate(profiles.egg,t),envelope=Math.pow(Math.sin(t*Math.PI),2);
        const fold=(.013*Math.sin(a*7+t*9)+.008*Math.sin(a*19-t*11))*envelope;
        const r=base*(1+fold);return [Math.sin(a)*r,.045+t*(rimY-.045),Math.cos(a)*r];
      },48,64,{capBottom:true});
      rimNormals(T,result,48,64,rimSlope,u=>u*TAU);return result;
    });
    root.add(region(factory._mesh(body,shell,'shell_body'),'egg-shell'));
    const joints=[];
    for(let i=0;i<4;i++) {
      const angle=i*Math.PI/2,petal=new T.Group();petal.name=`articulated_petal_${i}`;
      petal.position.set(Math.sin(angle)*radius,rimY,Math.cos(angle)*radius);petal.rotation.y=angle;
      petal.userData.closedRotationX=0;petal.userData.openRotationX=2.15;
      for(const lining of [false,true]) {
        const shape=cached(`ovomorph-crown-${lining?'inside':'outside'}-v2`,()=>{
          const result=geometry(T,(v,u)=>{
          // A sub-millimetre overlapping lip seals the independently animated
          // quadrants, including exactly on their diagonal floating-point seam.
          const phi=(u-.5)*(Math.PI/2+.004),theta=latitude+v*(Math.PI/2-latitude);
          const envelope=Math.pow(Math.sin(v*Math.PI),2),edge=1-.012*Math.pow(Math.sin(phi*4),2)*envelope;
          const inset=lining?.967:1,r=radius*Math.cos(theta)/cosLatitude*edge*inset;
          const fold=.009*Math.sin(phi*12+v*11)*envelope;
          return [Math.sin(phi)*r,crownHeight*(Math.sin(theta)-sinLatitude)/(1-sinLatitude)*inset+fold,Math.cos(phi)*r-radius];
          },24,24,{wrap:false});
          rimNormals(T,result,0,24,rimSlope,u=>(u-.5)*(Math.PI/2+.004));return result;
        });
        const mesh=factory._mesh(shape,lining?flesh:shell,lining?'petal_membrane':'petal_shell');
        if(lining)mesh.geometry.scale(.999,.999,.999);
        petal.add(region(mesh,lining?'egg-lining':'egg-shell'));
      }
      root.add(petal);joints.push(petal);
    }
    const seal=factory._mesh(cached('ovomorph-seal-v1',()=>new T.SphereGeometry(.085,16,12)),shell,'apical_seal');
    seal.position.y=rimY+crownHeight-.018;seal.scale.y=.27;root.add(region(seal,'egg-shell'));
    const inner=new T.Group();inner.name='incubator_inner_assembly';
    const core=factory._mesh(cached('ovomorph-inner-v1',()=>new T.SphereGeometry(1,24,18)),inside,'incubator_core');
    core.position.set(0,2.10,0);core.scale.set(.76,.34,.76);inner.add(region(core,'egg-lining'));root.add(inner);
    complete(root,'egg',93586,['continuous rounded ovomorph silhouette','four rim-hinged crown quadrants','embedded shell folds','nonluminous wet lining'],120);
    Object.assign(root.userData.modernLifecycle.metrics,{profileInterpolation:'pchip-c1',crownJoinSlope:rimSlope});
    factory._finalize(root,{modelType:'egg',open:!!open,height:rimY+crownHeight,forwardAxis:'+Z',
      animationJoints:{petals:joints.map(joint=>joint.name)},animationRoles:{interaction:joints.map(joint=>joint.name)}});
    root.userData.setOpenProgress=value=>{
      const progress=clamp(Number(value)||0);
      joints.forEach((joint,i)=>{joint.rotation.x=2.15*ease(clamp((progress-i*.012)/.964));});
      seal.visible=progress<.04;inner.visible=progress>.055;
      root.userData.openProgress=progress;root.userData.open=progress>=.98;
    };
    root.userData.setOpen=state=>root.userData.setOpenProgress(state?1:0);
    root.userData.petalJoints=joints;root.userData.setOpenProgress(open?1:0);
    return root;
  }
  function taperedSegment(T,length,from,to,key) {
    return cached(key,()=>geometry(T,(t,u)=>{
      const a=u*TAU,base=from+(to-from)*t;
      const end=Math.min(1,Math.sin(Math.PI*t)*4.5+.14);
      const r=base*end*(1+.045*Math.sin(t*TAU*2.5+a*.4));
      return [Math.cos(a)*r,(t-.5)*length,Math.sin(a)*r];
    },14,18,{capBottom:true,capTop:true}));
  }
  const parasiteMix=(a,b,t)=>a+(b-a)*t;
  function parasiteUnion(a,b,k) {
    const h=clamp(.5+.5*(b-a)/k);return parasiteMix(b,a,h)-k*h*(1-h);
  }
  function parasiteEllipsoid(x,y,z,c,r) {
    x-=c[0];y-=c[1];z-=c[2];
    const a=Math.hypot(x/r[0],y/r[1],z/r[2]);
    const b=Math.hypot(x/(r[0]*r[0]),y/(r[1]*r[1]),z/(r[2]*r[2]));
    return b>1e-8?a*(a-1)/b:-Math.min(...r);
  }
  function parasiteDefinition() {
    const legs=[];
    for(let i=0;i<8;i++) {
      const side=i<4?-1:1,row=i%4,z=-.67+row*.45,reach=1.55-Math.abs(row-1.5)*.12;
      const points=[[side*.49,.48,z],[side*1.15,.34+(row%2)*.08,z+(row-1.5)*.08],
        [side*reach,.13,z+(row-1.5)*.18],[side*(reach+.28),.065,z+(row-1.5)*.24]];
      const radii=[.133,.095,.063,.024];
      legs.push(points.slice(0,-1).map((a,j)=>{
        const b=points[j+1],dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2];
        return {a,dx,dy,dz,length:Math.hypot(dx,dy,dz),squared:dx*dx+dy*dy+dz*dz,r0:radii[j],r1:radii[j+1]};
      }));
    }
    return legs;
  }
  function parasiteBody(x,y,z) {
    // The dorsal carpus has a central furrow and paired lung lobes below it;
    // neither a flat oval plate nor separate spherical joints are retained.
    let value=parasiteEllipsoid(x,y,z,[0,.47,-.04],[.57,.215,.86]);
    for(const side of [-1,1])value=parasiteUnion(value,
      parasiteEllipsoid(x,y,z,[side*.255,.39,.10],[.255,.205,.56]),.085);
    const dorsal=ease((y-.43)/.18),coverage=ease((z+.75)/.24)*(1-ease((z-.55)/.24));
    const tendons=Math.exp(-Math.pow((Math.abs(x)-.21)/.12,2));
    value-=dorsal*coverage*tendons*.030;
    value+=dorsal*coverage*Math.exp(-x*x/.009)*.021;
    return value;
  }
  function parasiteSegment(x,y,z,s) {
    const t=clamp(((x-s.a[0])*s.dx+(y-s.a[1])*s.dy+(z-s.a[2])*s.dz)/s.squared);
    const px=x-s.a[0]-s.dx*t,py=y-s.a[1]-s.dy*t,pz=z-s.a[2]-s.dz*t;
    // A flattened ventral pad and an integrated extensor ridge change the
    // cross-section, rather than gluing a string onto a cylinder.
    const r=parasiteMix(s.r0,s.r1,t)+Math.sin(Math.PI*t)**2*.010;
    const dorsal=.009*Math.sin(Math.PI*t)**2*Math.max(0,py/(Math.hypot(px,py,pz)||1));
    return Math.hypot(px,py*1.10,pz)-r-dorsal;
  }
  function parasiteField(x,y,z,legs,parts) {
    let value=parasiteBody(x,y,z);if(parts)parts[0]=value;
    for(let leg=0;leg<legs.length;leg++) {
      let distance=Infinity;
      for(let part=0;part<3;part++) {
        const d=parasiteSegment(x,y,z,legs[leg][part]);if(parts)parts[1+leg*3+part]=d;
        distance=part?parasiteUnion(distance,d,.055):d;
      }
      value=parasiteUnion(value,distance,.065);
    }
    return value;
  }
  function parasiteSurface(T) {
    const legs=parasiteDefinition(),min=[-1.94,-.035,-1.17],max=[1.94,.79,1.27],step=.054;
    const nx=Math.ceil((max[0]-min[0])/step),ny=Math.ceil((max[1]-min[1])/step),nz=Math.ceil((max[2]-min[2])/step);
    const size=max.map((v,i)=>(v-min[i])/[nx,ny,nz][i]),stride=nx+1,plane=stride*(ny+1),count=plane*(nz+1);
    const values=new Float32Array(count),points=[],normals=[],uv=[],skinIndex=[],skinWeight=[],index=[],edges=new Map();
    const coordinate=id=>{const z=Math.floor(id/plane),r=id-z*plane,y=Math.floor(r/stride),x=r-y*stride;
      return [min[0]+x*size[0],min[1]+y*size[1],min[2]+z*size[2]];};
    for(let z=0;z<=nz;z++)for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++)
      values[x+y*stride+z*plane]=parasiteField(min[0]+x*size[0],min[1]+y*size[1],min[2]+z*size[2],legs);
    const vertex=(a,b)=>{
      const lo=Math.min(a,b),hi=Math.max(a,b),key=lo*count+hi;if(edges.has(key))return edges.get(key);
      const from=coordinate(a),to=coordinate(b),t=clamp(values[a]/(values[a]-values[b]));
      const p=from.map((v,i)=>parasiteMix(v,to[i],t)),[x,y,z]=p,e=.0015;
      let gx=parasiteField(x+e,y,z,legs)-parasiteField(x-e,y,z,legs);
      let gy=parasiteField(x,y+e,z,legs)-parasiteField(x,y-e,z,legs);
      let gz=parasiteField(x,y,z+e,legs)-parasiteField(x,y,z-e,legs);
      const length=Math.hypot(gx,gy,gz)||1;gx/=length;gy/=length;gz/=length;
      const id=points.length/3;points.push(...p);normals.push(gx,gy,gz);uv.push(.5+x/3.88,.5+z/2.44);
      const parts=[];parasiteField(x,y,z,legs,parts);const minimum=Math.min(...parts);
      const influences=parts.map((d,i)=>[i,Math.exp(-55*(d-minimum))]);influences.sort((a,b)=>b[1]-a[1]);
      influences.length=4;const total=influences.reduce((sum,item)=>sum+item[1],0)||1;
      skinIndex.push(...influences.map(item=>item[0]));skinWeight.push(...influences.map(item=>item[1]/total));
      edges.set(key,id);return id;
    };
    const emit=(a,b,c)=>{
      if(a===b||b===c||c===a)return;
      const ax=points[b*3]-points[a*3],ay=points[b*3+1]-points[a*3+1],az=points[b*3+2]-points[a*3+2];
      const bx=points[c*3]-points[a*3],by=points[c*3+1]-points[a*3+1],bz=points[c*3+2]-points[a*3+2];
      const dot=(ay*bz-az*by)*(normals[a*3]+normals[b*3]+normals[c*3])+
        (az*bx-ax*bz)*(normals[a*3+1]+normals[b*3+1]+normals[c*3+1])+
        (ax*by-ay*bx)*(normals[a*3+2]+normals[b*3+2]+normals[c*3+2]);
      index.push(a,dot<0?c:b,dot<0?b:c);
    };
    const tetrahedra=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
    const offsets=[0,1,1+stride,stride,plane,plane+1,plane+1+stride,plane+stride];
    for(let z=0;z<nz;z++)for(let y=0;y<ny;y++)for(let x=0;x<nx;x++) {
      const origin=x+y*stride+z*plane,ids=offsets.map(v=>origin+v);
      let insideCount=0;for(const id of ids)if(values[id]<0)insideCount++;
      if(!insideCount||insideCount===8)continue;
      for(const tetra of tetrahedra) {
        const inside=[],outside=[];for(const i of tetra)(values[ids[i]]<0?inside:outside).push(ids[i]);
        if(!inside.length||inside.length===4)continue;
        if(inside.length===1||inside.length===3) {
          const one=inside.length===1?inside[0]:outside[0],other=inside.length===1?outside:inside;
          emit(vertex(one,other[0]),vertex(one,other[1]),vertex(one,other[2]));
        } else {
          const ac=vertex(inside[0],outside[0]),ad=vertex(inside[0],outside[1]);
          const bc=vertex(inside[1],outside[0]),bd=vertex(inside[1],outside[1]);emit(ac,bc,bd);emit(ac,bd,ad);
        }
      }
    }
    const result=new T.BufferGeometry();
    for(const [name,array,itemSize]of [['position',points,3],['normal',normals,3],['uv',uv,2],['skinWeight',skinWeight,4]])
      result.setAttribute(name,new T.Float32BufferAttribute(array,itemSize));
    result.setAttribute('uv2',result.attributes.uv.clone());result.setAttribute('skinIndex',new T.Uint16BufferAttribute(skinIndex,4));
    result.setIndex(index);result.computeBoundingBox();result.computeBoundingSphere();
    result.userData.parasiteAnatomy={version:2,continuous:true,bones:25,step,triangles:index.length/3};return result;
  }
  function prepareParasite(factory,root,T) {
    const body=root.getObjectByName('central_carpal_body'),assembly=root.getObjectByName('crawler_scaled_assembly');
    if(!body||!assembly)return;
    const sourceMaterial=body.material,material=factory._material(sourceMaterial.userData.hiveMaterialKind||'skin',{
      color:sourceMaterial.color.getHex(),roughness:sourceMaterial.roughness,metalness:sourceMaterial.metalness,
      clearcoat:sourceMaterial.clearcoat,skinning:true});
    const skinGeometry=cached('facehugger-continuous-skin-v2',()=>parasiteSurface(T));
    const bones=[],bodyBone=new T.Bone();bodyBone.name='parasite_carpal_bone';assembly.add(bodyBone);bones.push(bodyBone);
    for(let leg=0;leg<8;leg++)for(const name of [`crawler_leg_${leg}`,`crawler_knee_${leg}`,`crawler_ankle_${leg}`]) {
      const group=root.getObjectByName(name),bone=new T.Bone();bone.name=`parasite_${name}_bone`;group.add(bone);bones.push(bone);
    }
    removeMatching(root,object=>/^(central_carpal_body|ventral_organ|hip|knee|ankle|femur|tibia|tarsus|gripping_claw|tail_hook)$|^dorsal_plate_|^crawler_flexor_|^sensory_feeler_/.test(object.name));
    const skin=new T.SkinnedMesh(skinGeometry,material);skin.name='central_carpal_body';skin.frustumCulled=false;
    skin.castShadow=true;skin.receiveShadow=true;assembly.add(region(skin,'parasite-skin'));
    let hierarchy=root;while(hierarchy.parent)hierarchy=hierarchy.parent;hierarchy.updateMatrixWorld(true);
    const skeleton=new T.Skeleton(bones);skin.bind(skeleton);skeleton.update();
    let released=false;skinGeometry.addEventListener('dispose',()=>{if(!released){released=true;skeleton.dispose();}});
    root.userData.parasiteAnatomy={version:2,continuous:true,bones:25,skinTriangles:(skinGeometry.index?.count||0)/3,
      topology:'one indexed skinned carpus and eight articulated digits'};
    // r128's Box3.setFromObject only sees the bind-space geometry of a
    // SkinnedMesh. Grounding a folded/dead parasite needs its actual vertices,
    // not the old spread-out hand. The factory calls this only on demand.
    root.userData.getAnimatedBounds=(target=new T.Box3())=>{
      let hierarchy=root;while(hierarchy.parent)hierarchy=hierarchy.parent;hierarchy.updateMatrixWorld(true);
      target.makeEmpty();const point=new T.Vector3(),box=new T.Box3();
      root.traverse(object=>{
        if(!object.isMesh||!object.geometry?.attributes.position)return;
        if(object.isSkinnedMesh) {
          object.skeleton.update();const position=object.geometry.attributes.position;
          for(let i=0;i<position.count;i++) {
            point.fromBufferAttribute(position,i);object.boneTransform(i,point);point.applyMatrix4(object.matrixWorld);
            target.expandByPoint(point);
          }
        } else {
          if(!object.geometry.boundingBox)object.geometry.computeBoundingBox();
          box.copy(object.geometry.boundingBox).applyMatrix4(object.matrixWorld);target.union(box);
        }
      });return target;
    };
    const tail=root.getObjectByName('prehensile_tail'),curve=tail?.geometry.parameters?.path;
    if(tail&&curve) {
      replace(tail,cached('facehugger-tail-v1',()=>{
        const geo=new T.TubeGeometry(curve,80,1,12,false),position=geo.attributes.position;
        for(let row=0;row<=80;row++) {
          const t=row/80,center=curve.getPointAt(t),r=(.112*Math.pow(1-t,.58)+.012)*(1+.065*Math.cos(t*TAU*27));
          for(let col=0;col<=12;col++){const i=row*13+col;position.setXYZ(i,center.x+(position.getX(i)-center.x)*r,center.y+(position.getY(i)-center.y)*r,center.z+(position.getZ(i)-center.z)*r);}
        }
        geo.computeVertexNormals();geo.setAttribute('uv2',geo.attributes.uv.clone());geo.computeBoundingBox();geo.computeBoundingSphere();return geo;
      }));region(tail,'parasite-skin');
    }
  }
  function prepareJuvenile(factory,root,T) {
    removeMatching(root,object=>/^carapace_spine_|^dorsal_spine_/.test(object.name));
    const head=root.getObjectByName('juvenile_head');
    if(head) {
      replace(head,cached('larval-head-v1',()=>geometry(T,(t,u)=>{
        const a=u*TAU,r=interpolate(profiles.larva,t);
        return [Math.cos(a)*r,Math.sin(a)*r*.83-.055*Math.pow(Math.max(0,-Math.sin(a)),2),t*2-1];
      },42,48,{capBottom:true,capTop:true})));
      head.scale.multiply(new T.Vector3(.78,.83,.68));head.position.z=.67;region(head,'larval-skin');
      if(head.material){head.material.color.setHex(0xa7927b);head.material.roughness=.45;head.material.metalness=0;}
    }
    const trunk=root.getObjectByName('larval_trunk');if(trunk)region(trunk,'larval-skin');
    for(const side of [-1,1]) {
      const arm=root.getObjectByName(`juvenile_arm_${side}`);if(!arm)continue;
      arm.scale.set(.66,.66,.66);arm.position.x*=.86;
      const parts=[];arm.traverse(object=>{if(object.isMesh)parts.push(object);});
      for(const part of parts) {
        if(/_segment_/.test(part.name)) {
          part.geometry.computeBoundingBox();const length=part.geometry.boundingBox.max.y-part.geometry.boundingBox.min.y;
          const from=/_segment_0$/.test(part.name)?.1:.075,to=/_segment_0$/.test(part.name)?.075:.05;
          replace(part,taperedSegment(T,length,from,to,`larval-${part.name}-${length.toFixed(5)}`));region(part,'larval-skin');
        } else if(/_joint_|_terminal_joint$/.test(part.name)) {
          replace(part,cached('larval-joint-v1',()=>new T.SphereGeometry(1,14,10)));part.scale.multiplyScalar(.8);region(part,'larval-skin');
        }
      }
      const hand=arm.getObjectByName(side<0?'hand_left':'hand_right');
      if(hand) {
        removeMatching(hand,()=>true);
        const material=root.getObjectByName('larval_trunk').material;
        const palm=factory._mesh(cached('larval-rudimentary-palm-v1',()=>geometry(T,(t,u)=>{
          const a=u*TAU,r=Math.sin(t*Math.PI)*.064+.006;
          return [Math.cos(a)*r,Math.sin(a)*r*.35,.025+t*.15];
        },16,16,{capBottom:true,capTop:true})),material,'larval_palm');
        hand.add(region(palm,'larval-skin'));
        for(let digit=0;digit<3;digit++) {
          const spread=(digit-1)*.04,curve=new T.CatmullRomCurve3([
            new T.Vector3(spread,0,.14),new T.Vector3(spread*1.12,-.018,.205),new T.Vector3(spread*.95,-.052,.25-Math.abs(digit-1)*.018)
          ]);
          hand.add(region(factory._mesh(new T.TubeGeometry(curve,12,.013,7,false),material,`larval_digit_${digit}`),'larval-skin'));
        }
      }
    }
    root.traverse(object=>{if(object.isMesh&&/finger|palm|phalanx|segment_|tail_skin/.test(object.name))region(object,'larval-skin');});
    const tailBlade=root.getObjectByName('tail_blade');if(tailBlade)tailBlade.scale.multiplyScalar(.52);
  }
  function cocoonPoint(t,angle,side,inset=1) {
    const h=t*2-1,r=Math.sqrt(Math.max(.00002,1-h*h));
    const folded=.018*Math.sin(angle*11+t*34)+.012*Math.pow(Math.max(0,Math.sin(angle*7+t*4)),5);
    const radius=r*(1+folded),centerX=.065*Math.sin(t*Math.PI*1.4),centerZ=-.10+.12*t;
    return [centerX+side*Math.sin(angle)*radius*(.98+.08*Math.sin(t*4))*inset,
      1.78+h*1.7,centerZ+Math.cos(angle)*radius*(.72+.045*h)*inset];
  }
  function prepareCocoon(root,T) {
    removeMatching(root,object=>/^romulus_rib_|^cocoon_vascular_fold_|^posterior_spine_column$|^suspensory_tendon_|^anchoring_root_[3-9]$/.test(object.name));
    for(const side of [-1,1]) {
      const half=root.getObjectByName(side<0?'cocoon_shell_left':'cocoon_shell_right');if(!half)continue;
      for(const lining of [false,true]) {
        const mesh=half.getObjectByName(`${half.name}_${lining?'lining':'surface'}`);if(!mesh)continue;
        replace(mesh,cached(`amniotic-shell-${side}-${lining}-v1`,()=>geometry(T,(t,u)=>{
          const p=cocoonPoint(t,u*Math.PI,side,lining?.956:1);
          return [p[0]-half.position.x,p[1]-half.position.y,p[2]-half.position.z];
        },lining?24:40,lining?24:32,{wrap:false,flip:side<0})));
        region(mesh,'cocoon-membrane');
        mesh.material.emissive?.setHex(0);mesh.material.metalness=.015;mesh.material.roughness=lining?.39:.53;
        if(!lining) {
          mesh.material.depthWrite=true;
          mesh.onBeforeRender=()=>{mesh.material.opacity=.94-(root.userData.evolutionOpening||0)*.18;mesh.material.emissive?.setHex(0);};
        } else mesh.material.opacity=.14;
      }
      const lip=half.getObjectByName(side<0?'suture_lip_left':'suture_lip_right');
      if(lip) {
        const points=Array.from({length:12},(_,i)=>{const p=cocoonPoint(.055+i/11*.89,0,side);return new T.Vector3(p[0]+side*.014-half.position.x,p[1]-half.position.y,p[2]-.01-half.position.z);});
        replace(lip,new T.TubeGeometry(new T.CatmullRomCurve3(points),32,.025,7,false));region(lip,'cocoon-membrane');
      }
    }
    root.traverse(object=>{
      if(/^suture_ligament_/.test(object.name)) {
        const t=clamp((object.position.y-1.78)/3.4+.5),p=cocoonPoint(t,0,1);
        object.position.set(p[0],p[1],p[2]+.012);region(object,'cocoon-membrane');
      }
    });
    const core=root.getObjectByName('amniotic_core');if(core){const previous=core.geometry;const next=previous.clone();next.scale(.92,1,.73);replace(core,next);}
  }
  function prepare(factory,root,metadata={}) {
    if(!root||root.userData.modernLifecycle||!global.THREE)return root;
    const type=metadata.modelType||root.userData.modelType;
    if(!['facehugger','chestburster'].includes(type))return root;
    const T=global.THREE,before=stats(root).triangles;
    if(type==='facehugger') {
      prepareParasite(factory,root,T);complete(root,'facehugger',before,['continuous skinned carpus and eight digits','paired ventral lung lobes','embedded extensor tendons','annulated tapering tail'],180);
    } else if(metadata.chrysalis) {
      prepareCocoon(root,T);complete(root,'cocoon',before,['asymmetric folded amniotic membrane','embedded surface folds instead of hoop cage','adherent split suture','retained emergence pivots'],180);
    } else {
      prepareJuvenile(factory,root,T);complete(root,'juvenile',before,['serpentine neonatal proportions','short organic cranial capsule','rudimentary forelimbs','continuous larval trunk'],120);
    }
    return root;
  }
  global.HiveModernLifecycle={createEgg,prepare,getDiagnostics:()=>({version:1,cachedTemplates:templates.size})};
})(typeof window==='undefined'?globalThis:window);
