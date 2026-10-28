/* HIVE ASCENSION — authored organic surface lofts.
 * Geometry templates stay CPU-side; each factory model owns a disposable clone.
 * Anatomical profiles and embedded relief replace stacked primitive silhouettes.
 */
(function exposeOrganicSculpt(global) {
  'use strict';
  const templates = new Map();
  const TAU = Math.PI * 2;
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const smooth = (a, b, n) => { const t = clamp((n - a) / (b - a)); return t * t * (3 - 2 * t); };
  const bump = (n, center, width) => Math.exp(-Math.pow((n - center) / width, 2));
  function profile(rows, t, column) {
    for (let i = 1; i < rows.length; i++) {
      if (t <= rows[i][0]) {
        const a = rows[i - 1], b = rows[i];
        const f = smooth(a[0], b[0], t);
        return a[column] + (b[column] - a[column]) * f;
      }
    }
    return rows[rows.length - 1][column];
  }

  const profiles = {
    chest: [[0,.24,.34],[.08,.55,.55],[.22,.62,.65],[.4,.76,.8],[.59,1,.97],[.76,1.13,1],[.88,.96,.79],[1,.38,.42]],
    pelvis: [[0,.18,.28],[.12,.62,.59],[.35,.91,.83],[.58,1,.94],[.8,.84,.75],[1,.54,.51]],
    // The posterior is a rounded occipital bulb, not the pointed end of a
    // spindle. The anterior vault remains narrower above the facial tissues.
    skull: [[0,.004,.004],[.12,.70,.65],[.29,.94,.89],[.49,1,.99],[.67,.97,.98],[.83,.85,.82],[.94,.55,.57],[1,.22,.25]],
    runnerSkull: [[0,.004,.004],[.12,.62,.60],[.29,.93,.85],[.52,1,.98],[.73,.9,.84],[.88,.73,.67],[.94,.54,.54],[1,.3,.3]],
    egg: [[0,.23,.23],[.08,.6,.6],[.27,.92,.92],[.52,1,1],[.74,.88,.88],[.92,.62,.62],[1,.34,.34]],
    cocoon: [[0,.18,.18],[.12,.66,.65],[.35,1,.95],[.62,.94,.95],[.86,.68,.7],[1,.2,.2]],
    petal: [[0,.1,.16],[.15,.6,.65],[.36,.99,1],[.6,.92,.88],[.82,.63,.68],[1,.04,.07]],
    crawler: [[0,.06,.1],[.12,.62,.56],[.3,.96,.84],[.56,1,1],[.8,.82,.78],[.95,.48,.5],[1,.08,.12]],
    palm: [[0,.06,.1],[.16,.74,.54],[.4,.94,.85],[.65,1,.9],[.85,.78,.65],[1,.36,.34]],
    shoulder: [[0,.06,.06],[.16,.65,.62],[.4,1,.95],[.65,.94,1],[.86,.64,.68],[1,.08,.1]],
    joint: [[0,.03,.03],[.12,.65,.62],[.38,1,.9],[.64,.97,1],[.88,.6,.68],[1,.04,.04]]
  };

  function finishLoft(T, positions, uv, indices, axial, radial, alongZ) {
    const points = Array.from(positions), coords = Array.from(uv), faces = Array.from(indices);
    const stride = radial + 1;
    // UVs need a duplicated seam. Weld positions and later average its normals
    // so there is no visible split, while preserving the full texture interval.
    for(let row=0;row<=axial;row++)for(let axis=0;axis<3;axis++) {
      points[(row*stride+radial)*3+axis]=points[row*stride*3+axis];
    }
    for(const end of [0,axial]) {
      const offset=end*stride,center=[0,0,0];
      for(let side=0;side<radial;side++)for(let axis=0;axis<3;axis++)center[axis]+=points[(offset+side)*3+axis]/radial;
      const ci=points.length/3;points.push(...center);coords.push(.5,end/axial);
      for(let side=0;side<radial;side++) {
        const a=offset+side,b=a+1;
        const reverse=alongZ ? end===0 : end!==0;
        if(reverse)faces.push(ci,b,a);else faces.push(ci,a,b);
      }
    }
    const geometry=new T.BufferGeometry();
    geometry.setAttribute('position',new T.Float32BufferAttribute(points,3));
    geometry.setAttribute('uv',new T.Float32BufferAttribute(coords,2));
    geometry.setAttribute('uv2',geometry.attributes.uv.clone());
    geometry.setIndex(faces);geometry.computeVertexNormals();
    const normals=geometry.attributes.normal;
    for(let row=0;row<=axial;row++) {
      const a=row*stride,b=a+radial;
      const x=normals.getX(a)+normals.getX(b),y=normals.getY(a)+normals.getY(b),z=normals.getZ(a)+normals.getZ(b);
      const length=Math.hypot(x,y,z)||1;
      normals.setXYZ(a,x/length,y/length,z/length);normals.setXYZ(b,x/length,y/length,z/length);
    }
    geometry.userData.organicLoft={axial,radial,alongZ};
    geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
  }

  function geometryFor(T, kind) {
    const isSkull = kind === 'skull' || kind === 'runnerSkull' || kind === 'warriorSkull';
    const alongZ = isSkull || ['petal','crawler','palm'].includes(kind);
    const rows = kind === 'warriorSkull' ? profiles.skull : (profiles[kind] || profiles.joint);
    const axial = isSkull ? 128 : (kind === 'chest' ? 112 : (kind === 'egg' ? 112 : (kind === 'knuckle' ? 12 : (kind === 'joint' ? 24 : (kind === 'palm' ? 28 : (kind === 'shoulder' ? 40 : 64))))));
    const radial = isSkull ? 112 : (kind === 'chest' ? 112 : (kind === 'egg' ? 96 : (kind === 'knuckle' ? 20 : (kind === 'joint' ? 28 : (kind === 'palm' ? 36 : (kind === 'shoulder' ? 40 : 64))))));
    const positions = new Float32Array((axial + 1) * (radial + 1) * 3);
    const uv = new Float32Array((axial + 1) * (radial + 1) * 2);
    const index = new Uint32Array(axial * radial * 6);
    let n = 0, q = 0, k = 0;
    for (let ring = 0; ring <= axial; ring++) {
      const t = ring / axial, axis = t * 2 - 1;
      let rx = profile(rows, t, 1), ry = profile(rows, t, 2);
      if(isSkull && t < .12) {
        const u=(.12-t)/.12,rounding=Math.sqrt(Math.max(.000025,1-u*u));
        rx=profile(rows,.12,1)*rounding;ry=profile(rows,.12,2)*rounding;
      }
      if(isSkull && t > .9) {
        // A real hemispherical vault termination, not a circular closing puck.
        // The tiny final cap lies below pixel scale at inspection distance.
        const u=(t-.9)/.1, rounding=Math.sqrt(Math.max(.000025,1-u*u));
        rx=profile(rows,.9,1)*rounding;ry=profile(rows,.9,2)*rounding;
      }
      for (let side = 0; side <= radial; side++) {
        const angle = side / radial * TAU;
        const c = Math.cos(angle), s = Math.sin(angle);
        let x, y, z;
        if (isSkull) {
          // A low, swept cranial vault, squared at the temporal walls and tapered
          // into the occipital keel; front palate is integrated below the dome.
          const exponent = .91 + smooth(.68,.96,t) * .12;
          x = Math.sign(c) * Math.pow(Math.abs(c), exponent) * rx;
          y = Math.sign(s) * Math.pow(Math.abs(s), .9) * ry;
          y += .10 * (1 - t) - .14 * smooth(.74,1,t);
          // Broad temporal canals stop below the smooth cranial roof. Their
          // paired sweeps are anatomical planes, not a row of decorative rings.
          const lateral = Math.pow(1 - Math.abs(s), 2);
          const back = smooth(.045,.18,t) * (1 - smooth(.67,.91,t));
          const lower = 1-smooth(.16,.56,s);
          const flute = Math.pow(Math.max(0,Math.sin(t*32+Math.abs(s)*3.1+.23*Math.sin(t*9))),4);
          const groove = bump(s,-.18+.13*Math.sin(t*3),.15);
          const temporal = .080*flute*back*lateral*lower-.105*groove*back;
          const armor = kind === 'warriorSkull' ? .15*Math.pow(Math.max(0,
            Math.cos(t*TAU*9.5+Math.abs(c)*.52+.22*Math.sin(t*8))),4)*back : 0;
          const ridge = temporal + armor;
          x *= 1 + ridge; y *= 1 + ridge * .5;
          // A continuous arch and restrained sagittal keel catch a clean long
          // highlight; the warrior alone carries raised transverse armour.
          y += (.095*bump(t,.46,.32)+.045*bump(c,0,.22)*Math.sin(t*Math.PI))*Math.max(0,s)*ry;
          x += .012*Math.sin(t*11)*Math.pow(Math.max(0,-s),2)*back;
          z = axis;
        } else if (kind === 'chest') {
          x = c * rx; y = axis;
          const front = smooth(-.35,.7,s), flank = .45 + .55 * Math.abs(c);
          const ribPhase = t * 8.5 + Math.abs(c) * .4 + c * .045;
          const fold = Math.pow(Math.max(0,Math.cos(ribPhase * TAU)), 7);
          const coverage = smooth(.13,.28,t) * (1 - smooth(.78,.93,t));
          const ribs = (.115 * fold - .025) * front * coverage * flank;
          z = s * (ry + ribs);
          const sternum = bump(c,0,.13) * Math.max(0,s) * smooth(.2,.37,t) * (1 - smooth(.83,.96,t));
          z += sternum * .18;
          // Paired pectoral shells taper continuously into the axillary tendon.
          z += bump(t,.76,.14) * bump(Math.abs(c),.48,.27) * front * .12;
          x *= 1 + bump(t,.75,.18) * .045 * Math.cos(angle * 3 + .2);
          z -= .13 * Math.pow(Math.max(0,-s),5) * bump(t,.45,.32);
        } else if (kind === 'pelvis') {
          x = c * rx * (1 + .08 * bump(t,.6,.13) * Math.abs(c));
          y = axis; z = s * ry;
          const front = smooth(.05,.7,s);
          const plate = Math.pow(Math.max(0,Math.cos(t * TAU * 4 + c * .25)),6);
          z += front * .15 * plate + .12 * bump(c,0,.2) * Math.max(0,s);
          z -= .05 * Math.sin(angle * 4 + t * 8) * bump(t,.6,.3);
        } else if (kind === 'egg' || kind === 'cocoon') {
          const ribs = .035 * Math.cos(angle * 8 + Math.sin(t * 5) * .22);
          const seams = .025 * Math.pow(Math.max(0,Math.cos(angle * 16 + t * 4)),8);
          const knot = .022 * Math.sin(angle * 5.0 + t * 19) * Math.sin(t * Math.PI);
          x = c * rx * (1 + ribs - seams + knot); y = axis;
          z = s * ry * (1 + ribs - seams + knot);
        } else if (kind === 'petal') {
          x = c * rx; y = s * ry; z = axis;
          const fold = .1 * Math.pow(Math.max(0,Math.cos(angle * 4 + t * 3)),7) * Math.sin(t * Math.PI);
          y *= 1 + fold; y += .2 * Math.pow(t,2) + .12 * Math.sin(t * Math.PI);
        } else if (kind === 'crawler') {
          x = c * rx; y = s * ry; z = axis;
          const dorsal = Math.max(0,s);
          y += dorsal * .15 * Math.pow(Math.max(0,Math.cos(t * TAU * 4.5 + c * .2)),4);
          y -= Math.max(0,-s) * .14 * bump(t,.5,.25);
          x *= 1 + .06 * Math.sin(t * TAU * 4) * (1-dorsal*.5);
        } else if (kind === 'palm') {
          x = c * rx; y = s * ry; z = axis;
          y += Math.max(0,s) * .12 * Math.pow(Math.cos(c * 9 + t * 2),8) * Math.sin(t * Math.PI);
          x *= 1 + .08 * Math.cos(t * 14) * Math.abs(c);
        } else {
          x = c * rx; y = axis; z = s * ry;
          const keel = .055 * Math.cos(angle * 3 + t * 2) * Math.sin(t * Math.PI);
          x *= 1 + keel; z *= 1 + keel;
        }
        positions[n++] = x; positions[n++] = y; positions[n++] = z;
        uv[q++] = side / radial; uv[q++] = t;
        if (ring < axial && side < radial) {
          const a = ring * (radial + 1) + side, b = a + radial + 1;
          // Winding reverses when the loft's axis changes from Y to Z.
          if (alongZ) { index[k++]=a;index[k++]=a+1;index[k++]=b;index[k++]=b;index[k++]=a+1;index[k++]=b+1; }
          else { index[k++]=a;index[k++]=b;index[k++]=a+1;index[k++]=b;index[k++]=b+1;index[k++]=a+1; }
        }
      }
    }
    const geometry=finishLoft(T,positions,uv,index,axial,radial,alongZ);
    if(isSkull)geometry.userData.cranialAnatomy={version:2,shape:'rounded-occiput-swept-vault',
      temporal:'paired-recessed-canals',roof:kind==='warriorSkull'?'integrated-armour':'continuous-smooth-arch'};
    return geometry;
  }

  function limbFor(T, kind, ratio) {
    const axial = kind === 'digit' ? 12 : 32, radial = kind === 'digit' ? 16 : 36;
    const positions = [], uv = [], indices = [];
    for (let row=0;row<=axial;row++) {
      const t=row/axial;
      const base=1+(ratio-1)*t;
      // Broad insertions, a narrowed tendon waist and an off-axis bony belly.
      let anatomy = 1 + .13*bump(t,.14,.1) - .17*bump(t,.5,.15) + .19*bump(t,.78,.13);
      if(kind==='forearm'||kind==='shin')anatomy=1+.12*bump(t,.08,.12)-.21*smooth(.3,.8,t)+.1*bump(t,.94,.06);
      if(kind==='digit')anatomy=1+.2*bump(t,.1,.08)-.15*bump(t,.48,.16)+.15*bump(t,.72,.09);
      for(let side=0;side<=radial;side++){
        const angle=side/radial*TAU,c=Math.cos(angle),s=Math.sin(angle);
        const dorsal = bump(s,.72,.18), groove = bump(c,.55,.08)+bump(c,-.58,.085);
        const relief = 1 + .14*dorsal*Math.sin(t*Math.PI)-.075*groove*Math.sin(t*Math.PI)
          +.035*Math.cos(t*36+angle*2)*bump(t,.13,.1);
        const x=c*base*anatomy*relief + .055*Math.sin(t*Math.PI*1.3);
        const z=s*base*(kind==='digit'?.85:1)*anatomy*relief + .09*Math.sin(t*Math.PI);
        positions.push(x,t-.5,z);uv.push(side/radial,t);
        if(row<axial&&side<radial){const a=row*(radial+1)+side,b=a+radial+1;indices.push(a,b,a+1,b,b+1,a+1);}
      }
    }
    return finishLoft(T,positions,uv,indices,axial,radial,false);
  }

  global.HiveOrganicSculpt = {
    surface(T,kind) {
      const key=`surface:${kind}`;
      if(!templates.has(key))templates.set(key,geometryFor(T,kind));
      return templates.get(key).clone();
    },
    limb(T,kind,ratio=1) {
      const quantized=Math.round(ratio*40)/40,key=`limb:${kind}:${quantized}`;
      if(!templates.has(key))templates.set(key,limbFor(T,kind,quantized));
      return templates.get(key).clone();
    },
    fitUV(geometry, scale = {x:1,y:1,z:1}, tileSize = 1.25) {
      const layout=geometry.userData.organicLoft;if(!layout)return geometry;
      const {axial,radial}=layout,p=geometry.attributes.position,uv=geometry.attributes.uv,stride=radial+1;
      const distance=(a,b)=>Math.hypot((p.getX(a)-p.getX(b))*scale.x,(p.getY(a)-p.getY(b))*scale.y,(p.getZ(a)-p.getZ(b))*scale.z);
      const mid=Math.floor(axial*.52)*stride;
      let circumference=0;
      for(let j=0;j<radial;j++)circumference+=distance(mid+j,mid+j+1);
      // Integral wraps close the pigmentation seam. Axial mapping follows actual
      // scaled surface arclength instead of stretching one full map per bone.
      const wraps=Math.max(1,Math.round(circumference/tileSize));
      let arc=0;
      for(let row=0;row<=axial;row++){
        if(row>0){let delta=0;for(let sample=0;sample<4;sample++){const j=Math.round(sample/4*radial);delta+=distance((row-1)*stride+j,row*stride+j)/4;}arc+=delta;}
        for(let side=0;side<=radial;side++)uv.setXY(row*stride+side,side/radial*wraps,arc/tileSize);
      }
      uv.setXY((axial+1)*stride,.5,0);uv.setXY((axial+1)*stride+1,.5,arc/tileSize);
      geometry.setAttribute('uv2',uv.clone());return geometry;
    },
    diagnostics(){return {templates:templates.size,vertices:Array.from(templates.values()).reduce((n,g)=>n+g.attributes.position.count,0)};}
  };
}(typeof window!=='undefined'?window:globalThis));
